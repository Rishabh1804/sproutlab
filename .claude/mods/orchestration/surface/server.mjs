#!/usr/bin/env node
// The orchestration mod's own surface: a small local web server, Node
// builtins only. It is a plain Node program, not a hooks module, and is not
// named in hooks/hooks.json. It has no write endpoint.
//
//   node surface/server.mjs [--port 4319] [--dir <folder>] [--host 127.0.0.1]
//                           [--allow-host <name>]...
//
// It reads what the mod writes into <dir> (live-<session>.json snapshots and
// usage-<session>*.jsonl logs) and serves:
//   GET /             the page (surface/index.html)
//   GET /api/state    the newest snapshot, or ?session=<id>; with the sessions found
//   GET /api/history  usage lines of every usage-*.jsonl, newest HISTORY_LIMIT only
//   GET /api/events   server-sent events: `state` and `history` on a change
// No path is ever taken from a request: a session id is matched against the
// files found, never joined into a path. Only regular files are read (a
// symbolic link is skipped), and only the known fields of a snapshot or a log
// line are passed on. Requests must name a loopback Host, or one allowed with
// --allow-host.

import { createHash } from 'node:crypto'
import { readFileSync, watch } from 'node:fs'
import { lstat, open, readdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HISTORY_LIMIT = 5000
/** Bytes read from the end of one log file, and from all of them together. */
const HISTORY_FILE_BYTES = 1024 * 1024
const HISTORY_TOTAL_BYTES = 8 * 1024 * 1024
/** A snapshot larger than this is not read. */
const SNAPSHOT_BYTES = 2 * 1024 * 1024
const MAX_STREAMS = 16
/** An event stream is closed after this long; the page's EventSource reconnects. */
const STREAM_LIFETIME_MS = 10 * 60_000
const PORT_TRIES = 10
const POLL_MS = 2000
const HEARTBEAT_MS = 15000
const DEBOUNCE_MS = 250
const LIVE_FILE = /^live-([A-Za-z0-9_-]+)\.json$/
const USAGE_FILE = /^usage-[A-Za-z0-9_.-]+\.jsonl$/
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])
const LINE_KEYS = [
  'time',
  'sessionId',
  'kind',
  'agentId',
  'stage',
  'seat',
  'label',
  'model',
  'effort',
  'status',
  'durationMs',
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
]

function parseArgs(argv) {
  const out = { port: 4319, host: '127.0.0.1', dir: undefined, allowHosts: [] }
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[i + 1]
    if (flag === '--port' && value !== undefined) {
      out.port = Number.parseInt(value, 10)
      i++
    } else if (flag === '--host' && value !== undefined) {
      out.host = value
      i++
    } else if (flag === '--dir' && value !== undefined) {
      out.dir = value
      i++
    } else if (flag === '--allow-host' && value !== undefined) {
      out.allowHosts.push(value.toLowerCase())
      i++
    } else if (flag === '--help' || flag === '-h') {
      process.stdout.write(
        'node surface/server.mjs [--port 4319] [--dir <folder>] [--host 127.0.0.1] [--allow-host <name>]...\n',
      )
      process.exit(0)
    }
  }
  if (!Number.isInteger(out.port) || out.port < 1 || out.port > 65535) {
    process.stderr.write('orchestration surface: --port must be a number from 1 to 65535\n')
    process.exit(2)
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const baseConfig = process.env.CLAUDE_CONFIG_DIR || join(process.env.HOME || homedir(), '.claude')
const DIR = args.dir ?? join(baseConfig, 'orchestration')
const PAGE_PATH = fileURLToPath(new URL('./index.html', import.meta.url))
const ALLOWED_HOSTS = new Set([...LOOPBACK_HOSTS, ...args.allowHosts])

// The page is read once; the hashes of its inline <style> and <script>
// blocks let a strict Content-Security-Policy allow exactly those.
const PAGE = readFileSync(PAGE_PATH)
const pageText = PAGE.toString('utf8')
const hashesOf = tag =>
  [...pageText.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map(
    m => `'sha256-${createHash('sha256').update(m[1] ?? '', 'utf8').digest('base64')}'`,
  )
const CSP = [
  "default-src 'none'",
  `script-src 'self' ${hashesOf('script').join(' ')}`,
  `style-src 'self' https://fonts.googleapis.com ${hashesOf('style').join(' ')}`,
  'font-src https://fonts.gstatic.com',
  "connect-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

const COMMON_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': CSP,
}

// ------------------------------------------------------------ host check

const refusedHosts = new Set()

/** The Host header's name without its port, or null when it has none. */
function hostNameOf(header) {
  if (typeof header !== 'string' || header === '') return null
  const value = header.trim().toLowerCase()
  if (value.startsWith('[')) {
    const close = value.indexOf(']')
    return close < 0 ? value : value.slice(0, close + 1)
  }
  const colon = value.lastIndexOf(':')
  return colon < 0 ? value : value.slice(0, colon)
}

function isAllowedHost(header) {
  const name = hostNameOf(header)
  if (name !== null && ALLOWED_HOSTS.has(name)) return true
  const shown = name === null ? null : name.replace(/[^\x21-\x7e]/g, '?').slice(0, 100)
  const key = shown ?? ''
  if (!refusedHosts.has(key) && refusedHosts.size < 100) {
    refusedHosts.add(key)
    process.stdout.write(
      shown === null
        ? 'orchestration surface refused a request with no Host header\n'
        : `orchestration surface refused Host ${shown}; allow it with --allow-host ${shown}\n`,
    )
  }
  return false
}

// ------------------------------------------------------------ files

/** Regular files only: a symbolic link or anything else is skipped. */
async function filesIn() {
  try {
    const names = await readdir(DIR)
    const out = []
    for (const name of names) {
      if (!LIVE_FILE.test(name) && !USAGE_FILE.test(name)) continue
      try {
        const info = await lstat(join(DIR, name))
        if (info.isFile()) out.push({ name, mtimeMs: info.mtimeMs, size: info.size })
      } catch {
        // gone between the listing and the stat
      }
    }
    return out
  } catch {
    return []
  }
}

/** Reads at most `limit` bytes from the end of a regular file, never through a link. */
async function readTail(name, limit) {
  const path = join(DIR, name)
  const info = await lstat(path)
  if (!info.isFile()) throw new Error('not a regular file')
  const handle = await open(path, 'r')
  try {
    const size = Math.min(info.size, limit)
    const buffer = Buffer.alloc(size)
    await handle.read(buffer, 0, size, info.size - size)
    return { text: buffer.toString('utf8'), isCut: info.size > limit }
  } finally {
    await handle.close()
  }
}

// ------------------------------------------------------------ known fields

const str = v => (typeof v === 'string' ? v : null)
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const bool = v => v === true
const obj = v => (typeof v === 'object' && v !== null && !Array.isArray(v) ? v : null)
const TIERS = ['Fable', 'Opus', 'Sonnet', 'Haiku', 'other']

function tokens(v) {
  const t = obj(v)
  if (t === null) return null
  return {
    input: num(t.input) ?? 0,
    output: num(t.output) ?? 0,
    cacheRead: num(t.cacheRead) ?? 0,
    cacheWrite: num(t.cacheWrite) ?? 0,
  }
}

function totals(v) {
  const t = obj(v)
  if (t === null) return null
  const byTier = {}
  const source = obj(t.byTier) ?? {}
  for (const tier of TIERS) byTier[tier] = tokens(source[tier]) ?? tokens({})
  return {
    byTier,
    overall: tokens(t.overall) ?? tokens({}),
    agents: num(t.agents) ?? 0,
    turns: num(t.turns) ?? 0,
    since: str(t.since),
  }
}

function check(v) {
  const c = obj(v)
  if (c === null) return null
  return { flag: str(c.flag), against: str(c.against), reason: str(c.reason) }
}

function agentOf(v) {
  const a = obj(v)
  if (a === null || str(a.agentId) === null) return null
  const out = {
    agentId: str(a.agentId),
    stage: str(a.stage) ?? '',
    seat: str(a.seat) ?? 'unknown',
    askedModel: str(a.askedModel),
    askedEffort: str(a.askedEffort),
    ranEffort: str(a.ranEffort),
    resolvedModel: str(a.resolvedModel),
    ranModel: str(a.ranModel),
    status: str(a.status) ?? 'running',
    endReason: str(a.endReason),
    startedAt: str(a.startedAt),
    activeAt: str(a.activeAt),
    endedAt: str(a.endedAt),
    tokens: tokens(a.tokens),
    turns: num(a.turns) ?? 0,
    reportedTurns: num(a.reportedTurns) ?? 0,
    workflowRunId: str(a.workflowRunId),
    workflowIndex: num(a.workflowIndex),
    isTeammate: bool(a.isTeammate),
    check: check(a.check),
  }
  if (str(a.label) !== null) out.label = str(a.label)
  return out
}

/** Passes on only the snapshot fields the page knows. */
function snapshotOf(v) {
  const s = obj(v)
  if (s === null) return null
  const base = obj(s.base) ?? {}
  const failure = obj(s.lastWriteFailure)
  const ended = obj(s.ended)
  const t = obj(s.totals) ?? {}
  return {
    schema: num(s.schema),
    writtenAt: str(s.writtenAt),
    sessionId: str(s.sessionId),
    ended: ended === null ? null : { at: str(ended.at), reason: str(ended.reason) },
    logPath: str(s.logPath),
    logLabels: bool(s.logLabels),
    staleMinutes: num(s.staleMinutes),
    lastWriteFailure:
      failure === null
        ? null
        : { at: str(failure.at), target: str(failure.target), reason: str(failure.reason) },
    base: {
      model: str(base.model),
      effort: str(base.effort),
      status: str(base.status) ?? 'idle',
      firstSeenAt: str(base.firstSeenAt),
      turnStartedAt: str(base.turnStartedAt),
      lastTurnMs: num(base.lastTurnMs),
      turns: num(base.turns) ?? 0,
      unreportedTurns: num(base.unreportedTurns) ?? 0,
      tokens: tokens(base.tokens) ?? tokens({}),
    },
    agents: Array.isArray(s.agents) ? s.agents.map(agentOf).filter(a => a !== null) : [],
    totals: { session: totals(t.session), allSessions: totals(t.allSessions) },
  }
}

function lineOf(parsed) {
  const line = {}
  for (const key of LINE_KEYS) {
    const value = parsed[key]
    if (typeof value === 'string' || typeof value === 'number' || value === null) line[key] = value
  }
  return line
}

// ------------------------------------------------------------ answers

async function sessionsFound() {
  const files = await filesIn()
  return files
    .map(f => ({ match: LIVE_FILE.exec(f.name), f }))
    .filter(x => x.match !== null)
    .map(x => ({
      id: x.match[1],
      name: x.f.name,
      size: x.f.size,
      mtimeMs: x.f.mtimeMs,
      updatedAt: new Date(x.f.mtimeMs).toISOString(),
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

/** The last snapshot that parsed, per session: a half-written one does not blank the page. */
const lastGood = new Map()

async function stateFor(sessionParam) {
  const sessions = await sessionsFound()
  const chosen = sessionParam === null ? sessions[0] : sessions.find(s => s.id === sessionParam)
  let state = null
  let note = null
  if (chosen !== undefined) {
    const cached = lastGood.get(chosen.id)
    if (cached !== undefined && cached.mtimeMs === chosen.mtimeMs && cached.size === chosen.size) {
      state = cached.state
    } else if (chosen.size > SNAPSHOT_BYTES) {
      note = 'too-large'
    } else {
      try {
        // The name comes from the directory listing, never from the request.
        const { text } = await readTail(chosen.name, SNAPSHOT_BYTES)
        state = snapshotOf(JSON.parse(text))
        if (state !== null) {
          lastGood.set(chosen.id, { mtimeMs: chosen.mtimeMs, size: chosen.size, state })
        }
      } catch {
        note = 'unreadable'
      }
    }
    if (state === null && cached !== undefined) {
      state = cached.state
      note = 'showing-last-good'
    }
  } else if (sessionParam !== null) {
    note = 'no-such-session'
  }
  return {
    dir: DIR,
    sessions: sessions.map(({ id, updatedAt }) => ({ id, updatedAt })),
    session: chosen?.id ?? null,
    state,
    note,
  }
}

/** Parsed lines per log file, kept while its mtime and size stay the same. */
const historyCache = new Map()

async function history() {
  const files = (await filesIn())
    .filter(f => USAGE_FILE.test(f.name))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
  const lines = []
  let skipped = 0
  let bytes = 0
  let isCut = false
  for (const f of files) {
    if (bytes >= HISTORY_TOTAL_BYTES) {
      isCut = true
      break
    }
    const limit = Math.min(HISTORY_FILE_BYTES, HISTORY_TOTAL_BYTES - bytes)
    const key = `${f.mtimeMs}:${f.size}:${limit}`
    let entry = historyCache.get(f.name)
    if (entry === undefined || entry.key !== key) {
      try {
        const tail = await readTail(f.name, limit)
        const raw = tail.text.split('\n')
        if (tail.isCut) raw.shift() // the first line read from a cut is partial
        const parsed = []
        let bad = 0
        for (const one of raw) {
          if (one.trim() === '') continue
          try {
            const value = JSON.parse(one)
            if (typeof value === 'object' && value !== null) parsed.push(lineOf(value))
            else bad++
          } catch {
            bad++
          }
        }
        entry = { key, parsed, bad, isCut: tail.isCut, size: Math.min(f.size, limit) }
        historyCache.set(f.name, entry)
      } catch {
        continue
      }
    }
    bytes += entry.size
    isCut = isCut || entry.isCut
    skipped += entry.bad
    lines.push(...entry.parsed)
  }
  lines.sort((a, b) => String(b.time ?? '').localeCompare(String(a.time ?? '')))
  return {
    bound: HISTORY_LIMIT,
    bytesPerFile: HISTORY_FILE_BYTES,
    bytesInAll: HISTORY_TOTAL_BYTES,
    total: lines.length,
    truncated: lines.length > HISTORY_LIMIT || isCut,
    unreadableLines: skipped,
    lines: lines.slice(0, HISTORY_LIMIT),
  }
}

function send(res, status, type, body) {
  res.writeHead(status, { ...COMMON_HEADERS, 'Content-Type': type })
  res.end(body)
}

function sendJson(res, status, value) {
  send(res, status, 'application/json; charset=utf-8', `${JSON.stringify(value)}\n`)
}

// ------------------------------------------------------------ events

const clients = new Set()
let lastSeen = null
let debounce = null
let pendingKinds = new Set()

function broadcast(kinds) {
  for (const kind of kinds) {
    const frame = `event: ${kind}\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`
    for (const res of clients) res.write(frame)
  }
}

function changed(kind) {
  pendingKinds.add(kind)
  if (debounce !== null) return
  debounce = setTimeout(() => {
    debounce = null
    const kinds = pendingKinds
    pendingKinds = new Set()
    broadcast(kinds)
  }, DEBOUNCE_MS)
}

function kindOf(name) {
  if (LIVE_FILE.test(name)) return 'state'
  if (USAGE_FILE.test(name)) return 'history'
  return null
}

/** The fallback when fs.watch is missing or silent: compares each file's mtime and size. */
async function poll() {
  const files = await filesIn()
  const now = new Map(files.map(f => [f.name, `${f.mtimeMs}:${f.size}`]))
  if (lastSeen !== null) {
    for (const [name, sig] of now) {
      if (lastSeen.get(name) !== sig) changed(kindOf(name) ?? 'state')
    }
    for (const name of lastSeen.keys()) {
      if (!now.has(name)) changed(kindOf(name) ?? 'state')
    }
  }
  lastSeen = now
}

let watcher = null
function startWatch() {
  try {
    watcher = watch(DIR, (_event, name) => {
      const kind = typeof name === 'string' ? kindOf(name) : null
      if (kind !== null) changed(kind)
    })
    watcher.on('error', () => {
      watcher?.close()
      watcher = null
    })
  } catch {
    watcher = null // the folder may not exist yet: polling covers it
  }
}

function openStream(req, res) {
  if (clients.size >= MAX_STREAMS) {
    res.writeHead(503, {
      ...COMMON_HEADERS,
      'Retry-After': '10',
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Too many open event streams.\n')
    return
  }
  res.writeHead(200, {
    ...COMMON_HEADERS,
    'Content-Type': 'text/event-stream; charset=utf-8',
    Connection: 'keep-alive',
  })
  res.write('retry: 3000\n\n')
  res.write(`event: hello\ndata: ${JSON.stringify({ watching: watcher !== null })}\n\n`)
  clients.add(res)
  const lifetime = setTimeout(() => res.end(), STREAM_LIFETIME_MS)
  lifetime.unref()
  const close = () => {
    clearTimeout(lifetime)
    clients.delete(res)
  }
  req.on('close', close)
  res.on('close', close)
}

// ------------------------------------------------------------ server

const server = createServer(async (req, res) => {
  try {
    if (!isAllowedHost(req.headers.host)) {
      send(res, 403, 'text/plain; charset=utf-8', 'This host name is not allowed.\n')
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { ...COMMON_HEADERS, Allow: 'GET, HEAD' })
      res.end()
      return
    }
    const url = new URL(req.url ?? '/', 'http://local')
    switch (url.pathname) {
      case '/':
      case '/index.html':
        send(res, 200, 'text/html; charset=utf-8', PAGE)
        return
      case '/api/state':
        sendJson(res, 200, await stateFor(url.searchParams.get('session')))
        return
      case '/api/history':
        sendJson(res, 200, await history())
        return
      case '/api/events':
        openStream(req, res)
        return
      default:
        send(res, 404, 'text/plain; charset=utf-8', 'Not found\n')
    }
  } catch (err) {
    // The reason goes to this terminal only, never into a response.
    process.stderr.write(`orchestration surface: ${err instanceof Error ? err.message : err}\n`)
    if (!res.headersSent) send(res, 500, 'text/plain; charset=utf-8', 'The server could not answer.\n')
    else res.end()
  }
})

function listen(port, triesLeft) {
  server.once('error', err => {
    if (err.code === 'EADDRINUSE' && triesLeft > 1) {
      listen(port + 1, triesLeft - 1)
    } else {
      process.stderr.write(`orchestration surface: could not listen: ${err.message}\n`)
      process.exit(1)
    }
  })
  server.listen(port, args.host, () => {
    const address = server.address()
    const real = typeof address === 'object' && address !== null ? address.port : port
    const host = args.host.includes(':') ? `[${args.host}]` : args.host
    process.stdout.write(`orchestration surface listening on http://${host}:${real}\n`)
  })
}

if (!LOOPBACK_HOSTS.has(args.host.toLowerCase())) {
  process.stdout.write(
    `orchestration surface warning: --host ${args.host} is not loopback, so other machines that can reach it may load the page; only the Host check stands in the way\n`,
  )
}

startWatch()
await poll()
const pollTimer = setInterval(() => {
  poll().catch(() => undefined)
  if (watcher === null) startWatch()
}, POLL_MS)
const heartbeat = setInterval(() => {
  for (const res of clients) res.write(': still here\n\n')
}, HEARTBEAT_MS)
listen(args.port, PORT_TRIES)

function shutdown() {
  clearInterval(pollTimer)
  clearInterval(heartbeat)
  if (debounce !== null) clearTimeout(debounce)
  watcher?.close()
  for (const res of clients) res.end()
  clients.clear()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
