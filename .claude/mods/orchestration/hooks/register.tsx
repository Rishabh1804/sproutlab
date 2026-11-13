import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer, TurnCompleteInput } from 'claude-code'

import type {
  OrchestrationAgent,
  OrchestrationMain,
  OrchestrationTier,
  OrchestrationTokens,
  OrchestrationTotals,
  OrchestrationWriteFailure,
} from '../types'

// The orchestration mod. It only observes. Every hook lets its event go on
// first (next(e), its answer returned unchanged) and only then queues its own
// work; nothing of the mod's state, store or file I/O is awaited ahead of an
// event's next, and every fault of its own is caught, so it never blocks,
// denies or alters a tool call, a spawn, a turn or a prompt.

const PANE = 'orchestration'
const TITLE = 'Orchestration'
const TIERS: readonly OrchestrationTier[] = ['Fable', 'Opus', 'Sonnet', 'Haiku', 'other']
const SESSION_KEY_PREFIX = 'session:'
const LEGACY_STORE_KEY = 'all-time-totals'
const MAX_ROWS = 300
const TICK_MS = 5000
const STALE_MINUTES = 30
const STALE_MS = STALE_MINUTES * 60_000
/** A session's log is rotated once it passes this size... */
const ROTATE_BYTES = 2 * 1024 * 1024
/** ...into at most this many numbered files, the oldest overwritten. */
const KEEP_ROTATED = 3
/** `$.fs.read` refuses a file over 4 MiB. */
const READ_LIMIT_BYTES = 4 * 1024 * 1024
/** `session.end` shares one 1.5 s bound with core; the drain stays well inside it. */
const DRAIN_MS = 800
/** One queued job may take this long before the queue moves on without it. */
const JOB_TIMEOUT_MS = 10_000
/** How long an agent's end waits for its spawn before its log line is written. */
const SPAWN_GRACE_MS = 1000
/** A queued snapshot whose timer never fired is given up after this long. */
const SNAPSHOT_WATCHDOG_MS = 5000
/** The live snapshot is written at most once per this many milliseconds. */
const SNAPSHOT_MIN_MS = 1000
const SNAPSHOT_SCHEMA = 1

// Change a tag when that value's fields change: the new code then reads
// what an older version stored as the initial value instead of trusting it.
const agentsA = atom({ plugin: 'orchestration', key: 'agents' } as const, [], {
  shape: 'agents-2',
})
const mainA = atom({ plugin: 'orchestration', key: 'main' } as const, emptyMain(0), {
  shape: 'main-2',
})
const totalsA = atom({ plugin: 'orchestration', key: 'totals' } as const, emptyTotals(null), {
  shape: 'totals-1',
})
const allTimeA = atom(
  { plugin: 'orchestration', key: 'allTime' } as const,
  emptyTotals(null),
  { shape: 'totals-1' },
)
const failureA = atom(
  { plugin: 'orchestration', key: 'lastWriteFailure' } as const,
  null,
  { shape: 'failure-1' },
)
const showFinishedA = atom({ plugin: 'orchestration', key: 'showFinished' } as const, true)
const expandedA = atom({ plugin: 'orchestration', key: 'expanded' } as const, null)
const tickA = atom({ plugin: 'orchestration', key: 'tick' } as const, 0)
const logPathA = atom({ plugin: 'orchestration', key: 'logPath' } as const, '')

type Dollar = EngineInterface

type LogLine = {
  time: string
  sessionId: string | null
  kind: 'agent' | 'turn'
  agentId: string | null
  stage: string
  seat: string
  /** Only when the `logLabels` option is on. */
  label?: string
  model: string | null
  effort: string | null
  status: string
  durationMs: number | null
  inputTokens: number | null
  outputTokens: number | null
  cacheReadTokens: number | null
  cacheWriteTokens: number | null
}

// ---------------------------------------------------------------- values

function zeroTokens(): OrchestrationTokens {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
}

function emptyMain(now: number): OrchestrationMain {
  return {
    model: null,
    effort: null,
    status: 'idle',
    firstSeenAt: now,
    turnStartedAt: null,
    lastTurnMs: null,
    tokens: zeroTokens(),
    turns: 0,
    unreportedTurns: 0,
  }
}

function emptyTotals(since: string | null): OrchestrationTotals {
  return {
    byTier: {
      Fable: zeroTokens(),
      Opus: zeroTokens(),
      Sonnet: zeroTokens(),
      Haiku: zeroTokens(),
      other: zeroTokens(),
    },
    agents: 0,
    turns: 0,
    since,
  }
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function saneTokens(v: unknown): OrchestrationTokens {
  if (!isObj(v)) return zeroTokens()
  return {
    input: num(v.input),
    output: num(v.output),
    cacheRead: num(v.cacheRead),
    cacheWrite: num(v.cacheWrite),
  }
}

function saneTotals(v: unknown): OrchestrationTotals {
  const out = emptyTotals(null)
  if (!isObj(v)) return out
  const byTier = isObj(v.byTier) ? v.byTier : {}
  for (const tier of TIERS) out.byTier[tier] = saneTokens(byTier[tier])
  out.agents = num(v.agents)
  out.turns = num(v.turns)
  out.since = str(v.since)
  return out
}

function saneMain(v: unknown): OrchestrationMain {
  if (!isObj(v)) return emptyMain(0)
  return {
    model: str(v.model),
    effort: str(v.effort),
    status: v.status === 'running' ? 'running' : 'idle',
    firstSeenAt: num(v.firstSeenAt),
    turnStartedAt: typeof v.turnStartedAt === 'number' ? v.turnStartedAt : null,
    lastTurnMs: typeof v.lastTurnMs === 'number' ? v.lastTurnMs : null,
    tokens: saneTokens(v.tokens),
    turns: num(v.turns),
    unreportedTurns: num(v.unreportedTurns),
  }
}

function saneFailure(v: unknown): OrchestrationWriteFailure | null {
  if (!isObj(v) || typeof v.at !== 'string') return null
  return { at: v.at, target: str(v.target) ?? 'a file', reason: str(v.reason) ?? '' }
}

function saneAgent(v: unknown): OrchestrationAgent | undefined {
  if (!isObj(v) || typeof v.id !== 'string') return undefined
  const status =
    v.status === 'done' || v.status === 'failed' || v.status === 'stale' ? v.status : 'running'
  const startedAt = num(v.startedAt)
  const label = str(v.label) ?? v.id
  return {
    id: v.id,
    label,
    stage: str(v.stage) ?? stageWord(label),
    seat: str(v.seat) ?? 'unknown',
    askedModel: str(v.askedModel),
    askedEffort: str(v.askedEffort),
    ranEffort: str(v.ranEffort),
    resolvedModel: str(v.resolvedModel),
    ranModel: str(v.ranModel),
    parentModel: str(v.parentModel),
    status,
    endReason: str(v.endReason),
    startedAt,
    activeAt: typeof v.activeAt === 'number' ? v.activeAt : startedAt,
    endedAt: typeof v.endedAt === 'number' ? v.endedAt : null,
    tokens: isObj(v.tokens) ? saneTokens(v.tokens) : null,
    turns: num(v.turns),
    reportedTurns: num(v.reportedTurns),
    counted: v.counted === true,
    workflowRunId: str(v.workflowRunId),
    workflowIndex: typeof v.workflowIndex === 'number' ? v.workflowIndex : null,
    isTeammate: v.isTeammate === true,
  }
}

function saneAgents(v: unknown): OrchestrationAgent[] {
  if (!Array.isArray(v)) return []
  const out: OrchestrationAgent[] = []
  for (const one of v) {
    const row = saneAgent(one)
    if (row !== undefined) out.push(row)
  }
  return out
}

function addTokens(a: OrchestrationTokens, b: OrchestrationTokens): OrchestrationTokens {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cacheRead: a.cacheRead + b.cacheRead,
    cacheWrite: a.cacheWrite + b.cacheWrite,
  }
}

function sumTokens(t: OrchestrationTokens): number {
  return t.input + t.output + t.cacheRead + t.cacheWrite
}

function overall(totals: OrchestrationTotals): OrchestrationTokens {
  let all = zeroTokens()
  for (const tier of TIERS) all = addTokens(all, totals.byTier[tier])
  return all
}

function mergeTotals(a: OrchestrationTotals, b: OrchestrationTotals): OrchestrationTotals {
  const out = emptyTotals(null)
  for (const tier of TIERS) out.byTier[tier] = addTokens(a.byTier[tier], b.byTier[tier])
  out.agents = a.agents + b.agents
  out.turns = a.turns + b.turns
  const sinces = [a.since, b.since].filter((s): s is string => s !== null).sort()
  out.since = sinces[0] ?? null
  return out
}

function tierOf(model: string | null | undefined): OrchestrationTier {
  const m = (model ?? '').toLowerCase()
  if (m.includes('fable')) return 'Fable'
  if (m.includes('opus')) return 'Opus'
  if (m.includes('sonnet')) return 'Sonnet'
  if (m.includes('haiku')) return 'Haiku'
  return 'other'
}

function addToTotals(
  totals: OrchestrationTotals,
  model: string | null,
  tokens: OrchestrationTokens | null,
  counts: { agents: number; turns: number },
): OrchestrationTotals {
  const next = saneTotals(totals)
  if (tokens !== null) {
    const tier = tierOf(model)
    next.byTier[tier] = addTokens(next.byTier[tier], tokens)
  }
  next.agents += counts.agents
  next.turns += counts.turns
  return next
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message || err.name
  if (isObj(err) && typeof err.message === 'string') return err.message
  return String(err)
}

// ------------------------------------------------- independence check

const STAGE = /^\s*(draft|build|fold|review|verify|edict-v)\s*[:/]\s*(\S.*?)\s*$/i
const WORK_STAGES = new Set(['draft', 'build', 'fold'])
const ALIASES = new Set(['fable', 'opus', 'sonnet', 'haiku'])

type Verdict = {
  kind: 'same' | 'different' | 'unknown' | 'unpaired'
  against: 'work' | 'base' | 'none'
}
const REVIEW_STAGES = new Set(['review', 'verify', 'edict-v'])

/** The recognised stage word before a colon, else ''. */
function stageWord(label: string): string {
  const m = STAGE.exec(label)
  return m?.[1]?.toLowerCase() ?? ''
}

function stageOf(row: OrchestrationAgent): { stage: string; group: string } | undefined {
  const m = STAGE.exec(row.label)
  if (m === null || m[1] === undefined || m[2] === undefined) return undefined
  // The group holds the workflow run id, so a review pairs only within its
  // own run, and outside workflows only with the session's own agents.
  return {
    stage: m[1].toLowerCase(),
    group: `${row.workflowRunId ?? ''}|${m[2].toLowerCase()}`,
  }
}

function modelOf(row: OrchestrationAgent): string | null {
  return row.ranModel ?? row.resolvedModel ?? row.askedModel ?? row.parentModel
}

function normModel(model: string): string {
  return model
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, '')
    .trim()
    .replace(/-\d{8}$/, '')
}

function isSameModel(a: string, b: string): boolean {
  const na = normModel(a)
  const nb = normModel(b)
  if (ALIASES.has(na) || ALIASES.has(nb)) {
    const tier = tierOf(na)
    return tier !== 'other' && tier === tierOf(nb)
  }
  return na === nb
}

/** The verdict on one review row; undefined for a row that is no review. */
function checkOf(
  row: OrchestrationAgent,
  rows: readonly OrchestrationAgent[],
  baseModel: string | null,
): Verdict | undefined {
  const own = stageOf(row)
  if (own === undefined || WORK_STAGES.has(own.stage)) return undefined
  const mine = modelOf(row)
  const works = rows.filter(other => {
    if (other.id === row.id) return false
    const s = stageOf(other)
    return s !== undefined && s.group === own.group && WORK_STAGES.has(s.stage)
  })
  if (works.length === 0) {
    // A flag needs a real pair. With any other agent that is no review in the
    // session, the work may be that agent's, so nothing is claimed.
    const hasOtherWork = rows.some(
      other => other.id !== row.id && !REVIEW_STAGES.has(stageOf(other)?.stage ?? ''),
    )
    if (hasOtherWork) return { kind: 'unpaired', against: 'none' }
    // No other agent did any work: the work under review is the base session's.
    if (mine === null || baseModel === null) return { kind: 'unknown', against: 'base' }
    return { kind: isSameModel(baseModel, mine) ? 'same' : 'different', against: 'base' }
  }
  const theirs = works.map(modelOf).filter((m): m is string => m !== null)
  if (mine === null || theirs.length === 0) return { kind: 'unknown', against: 'work' }
  return { kind: theirs.some(m => isSameModel(m, mine)) ? 'same' : 'different', against: 'work' }
}

// ------------------------------------------------------- session facts

// Module values are lost on a reload, which re-runs session.start; that and
// a /clear (session.end with reason clear) make them read afresh.
let sessionIdCache: string | null | undefined
let startStamp: string | undefined
let dirCache: string | null | undefined
let shownLogPath: string | undefined
let othersCache: OrchestrationTotals | undefined
let ownTotals: OrchestrationTotals | undefined
const overflow = new Map<string, string>()
const asked = new Map<string, { model: string | null; effort: string | null }>()
let timer: Timer | undefined
let work: Promise<void> = Promise.resolve()
let snapshotQueued = false
let snapshotQueuedAt = 0
let snapshotLastWrite = 0
let logLabelsOption = false
let endedMarker: { at: string; reason: string } | null = null

/** Resolves with the promise, or with undefined once `ms` has passed. */
function withTimeout<T>($: Dollar, promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise<T | undefined>(resolve => {
    let isDone = false
    let guard: Timer | undefined
    const finish = (value: T | undefined) => {
      if (isDone) return
      isDone = true
      try {
        guard?.cancel()
      } catch {
        // a timer from a dropped environment
      }
      resolve(value)
    }
    try {
      guard = $.clock.after(ms, () => finish(undefined))
    } catch {
      guard = undefined
    }
    promise.then(finish, () => finish(undefined))
  })
}

/**
 * Queues the mod's own work behind what is queued; never awaited by a hook.
 * Each job has its own time limit, so one hung `$` call cannot hold the queue.
 */
function record($: Dollar, job: () => Promise<void>): void {
  work = work
    .then(() => withTimeout($, Promise.resolve().then(job), JOB_TIMEOUT_MS))
    .then(() => undefined)
    .catch(() => undefined)
}

/** The seat as written outside the screen: a teammate's role is free text. */
function seatOut(row: OrchestrationAgent): string {
  if (row.seat === 'not seen at spawn') return 'unknown'
  return row.isTeammate && !logLabelsOption ? 'teammate' : row.seat
}

async function nowOf($: Dollar): Promise<number> {
  try {
    return await $.clock.now()
  } catch {
    return 0
  }
}

async function sessionIdOf($: Dollar): Promise<string | null> {
  if (sessionIdCache !== undefined) return sessionIdCache
  try {
    sessionIdCache = await $.session.id()
  } catch {
    sessionIdCache = null
  }
  return sessionIdCache
}

async function envOf($: Dollar, which: 'config' | 'home' | 'profile'): Promise<string> {
  try {
    const v =
      which === 'config'
        ? await $.env.get('CLAUDE_CONFIG_DIR')
        : which === 'home'
          ? await $.env.get('HOME')
          : await $.env.get('USERPROFILE')
    return v ?? ''
  } catch {
    return ''
  }
}

/** `<CLAUDE_CONFIG_DIR, else HOME/.claude>/orchestration`, or null. */
async function dirOf($: Dollar): Promise<string | null> {
  if (dirCache !== undefined) return dirCache
  let base = await envOf($, 'config')
  if (base === '') {
    let home = await envOf($, 'home')
    if (home === '') home = await envOf($, 'profile')
    base = home === '' ? '' : `${home.replace(/[\\/]+$/, '')}/.claude`
  }
  dirCache = base === '' ? null : `${base.replace(/[\\/]+$/, '')}/orchestration`
  return dirCache
}

async function sessionKeyOf($: Dollar): Promise<string> {
  const id = await sessionIdOf($)
  if (id !== null && id !== '') return id.replace(/[^A-Za-z0-9_-]/g, '-')
  if (startStamp === undefined) {
    startStamp = new Date(await nowOf($)).toISOString().replace(/[:.]/g, '-')
  }
  return `started-${startStamp}`
}

/** This session's own log file: one per session, so sessions never share one. */
async function logFileOf($: Dollar): Promise<string | null> {
  const dir = await dirOf($)
  if (dir === null) return null
  const path = `${dir}/usage-${await sessionKeyOf($)}.jsonl`
  const shown = overflow.get(path) ?? path
  if (shown !== shownLogPath) {
    shownLogPath = shown
    await update($, logPathA, () => shown).catch(() => undefined)
  }
  return path
}

async function noteFailure($: Dollar, target: string, err: unknown): Promise<void> {
  const at = new Date(await nowOf($)).toISOString()
  await update($, failureA, () => ({ at, target, reason: messageOf(err) })).catch(
    () => undefined,
  )
  // The snapshot carries the notice; a failing snapshot does not reschedule itself.
  if (target !== 'live snapshot') scheduleSnapshot($)
}

// ------------------------------------------------------- live snapshot

/**
 * Asks for the live snapshot to be written: coalesced (one queued at a time,
 * built from the state as it stands when it is written, so the last state
 * wins) and at most once per SNAPSHOT_MIN_MS. Never awaited by a hook.
 */
function scheduleSnapshot($: Dollar): void {
  // A timer that never fired would leave the flag set for good: give it up.
  if (snapshotQueued && Date.now() - snapshotQueuedAt < SNAPSHOT_WATCHDOG_MS) return
  snapshotQueued = true
  snapshotQueuedAt = Date.now()
  record($, async () => {
    const wait = snapshotLastWrite + SNAPSHOT_MIN_MS - (await nowOf($))
    if (wait > 0) {
      try {
        $.clock.after(wait, () => {
          record($, () => writeSnapshot($))
        })
        return
      } catch {
        // no timer: write now
      }
    }
    await writeSnapshot($)
  })
}

function isoOrNull(ms: number | null): string | null {
  return ms === null || ms <= 0 ? null : new Date(ms).toISOString()
}

function totalsView(t: OrchestrationTotals) {
  return { byTier: t.byTier, overall: overall(t), agents: t.agents, turns: t.turns, since: t.since }
}

async function buildSnapshot($: Dollar, now: number) {
  const agents = saneAgents(await read($, agentsA))
  const main = saneMain(await read($, mainA))
  const logPath = await read($, logPathA)
  return {
    schema: SNAPSHOT_SCHEMA,
    writtenAt: new Date(now).toISOString(),
    sessionId: await sessionIdOf($),
    ended: endedMarker,
    logPath: typeof logPath === 'string' && logPath !== '' ? logPath : null,
    logLabels: logLabelsOption,
    staleMinutes: STALE_MINUTES,
    lastWriteFailure: saneFailure(await read($, failureA)),
    base: {
      model: main.model,
      effort: main.effort,
      status: main.status,
      firstSeenAt: isoOrNull(main.firstSeenAt),
      turnStartedAt: isoOrNull(main.turnStartedAt),
      lastTurnMs: main.lastTurnMs,
      turns: main.turns,
      unreportedTurns: main.unreportedTurns,
      tokens: main.tokens,
    },
    agents: agents.map(r => {
      const verdict = checkOf(r, agents, main.model)
      return {
        agentId: r.id,
        stage: r.stage,
        seat: seatOut(r),
        ...(logLabelsOption ? { label: r.label } : {}),
        askedModel: r.askedModel,
        askedEffort: r.askedEffort,
        ranEffort: r.ranEffort,
        resolvedModel: r.resolvedModel,
        ranModel: r.ranModel,
        status: r.status,
        endReason: r.endReason,
        startedAt: isoOrNull(r.startedAt),
        activeAt: isoOrNull(r.activeAt),
        endedAt: isoOrNull(r.endedAt),
        tokens: r.tokens,
        turns: r.turns,
        reportedTurns: r.reportedTurns,
        workflowRunId: r.workflowRunId,
        workflowIndex: r.workflowIndex,
        isTeammate: r.isTeammate,
        check:
          verdict === undefined
            ? null
            : {
                flag: verdict.kind,
                against: verdict.against,
                reason: verdictText(verdict),
              },
      }
    }),
    totals: {
      session: totalsView(saneTotals(await read($, totalsA))),
      allSessions: totalsView(saneTotals(await read($, allTimeA))),
    },
  }
}

async function writeSnapshot($: Dollar): Promise<void> {
  snapshotQueued = false
  const now = await nowOf($)
  snapshotLastWrite = now
  try {
    const dir = await dirOf($)
    if (dir === null) return
    const snapshot = await buildSnapshot($, now)
    await $.fs.write(`${dir}/live-${await sessionKeyOf($)}.json`, `${JSON.stringify(snapshot)}\n`)
  } catch (err) {
    await noteFailure($, 'live snapshot', err)
  }
}

async function rotate($: Dollar, path: string): Promise<void> {
  const slot = (n: number) => path.replace(/\.jsonl$/, `.${n}.jsonl`)
  for (let n = KEEP_ROTATED - 1; n >= 1; n--) {
    if (await $.fs.exists(slot(n))) await $.fs.write(slot(n + 1), await $.fs.read(slot(n)))
  }
  await $.fs.write(slot(1), await $.fs.read(path))
}

async function appendLog($: Dollar, line: LogLine): Promise<void> {
  const base = await logFileOf($)
  if (base === null) return
  try {
    let path = overflow.get(base) ?? base
    let isThere = await $.fs.exists(path)
    if (isThere) {
      const { size } = await $.fs.stat(path)
      if (size > READ_LIMIT_BYTES) {
        // Too large for $.fs.read to move: leave it whole, go on in a new file.
        const next = base.replace(/\.jsonl$/, `-${line.time.replace(/[:.]/g, '-')}.jsonl`)
        overflow.set(base, next)
        await noteFailure(
          $,
          'usage log',
          new Error(`${path} is too large to read, so new lines go to ${next}`),
        )
        path = next
        isThere = false
        await logFileOf($)
      } else if (size > ROTATE_BYTES) {
        await rotate($, path)
        await $.fs.write(path, '')
      }
    }
    const prev = isThere ? await $.fs.read(path) : ''
    await $.fs.write(path, `${prev}${JSON.stringify(line)}\n`)
  } catch (err) {
    await noteFailure($, 'usage log', err)
  }
}

async function othersOf($: Dollar, ownKey: string): Promise<OrchestrationTotals> {
  let sum = emptyTotals(null)
  for (const key of await $.store.keys()) {
    if (key === ownKey) continue
    if (key === LEGACY_STORE_KEY || key.startsWith(SESSION_KEY_PREFIX)) {
      sum = mergeTotals(sum, saneTotals(await $.store.get(key)))
    }
  }
  return sum
}

/** Shows this session's own entry plus every other session's, as read. */
async function refreshAllTime($: Dollar): Promise<void> {
  const key = SESSION_KEY_PREFIX + (await sessionKeyOf($))
  try {
    if (ownTotals === undefined) ownTotals = saneTotals(await $.store.get(key))
    if (othersCache === undefined) othersCache = await othersOf($, key)
  } catch (err) {
    await noteFailure($, 'totals store', err)
  }
  const shown = mergeTotals(othersCache ?? emptyTotals(null), ownTotals ?? emptyTotals(null))
  await update($, allTimeA, () => shown)
}

/**
 * Each session writes only its own `session:<id>` entry; the totals across
 * sessions are those entries summed at read, so no session's write can
 * overwrite another's.
 */
async function addAllTime(
  $: Dollar,
  model: string | null,
  tokens: OrchestrationTokens | null,
  counts: { agents: number; turns: number },
  nowIso: string,
): Promise<void> {
  const key = SESSION_KEY_PREFIX + (await sessionKeyOf($))
  try {
    const own = saneTotals(await $.store.get(key))
    if (own.since === null) own.since = nowIso
    const next = addToTotals(own, model, tokens, counts)
    await $.store.set(key, next)
    ownTotals = next
  } catch (err) {
    await noteFailure($, 'totals store', err)
  }
  await refreshAllTime($)
}

function lineOf(
  base: Omit<LogLine, 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheWriteTokens'>,
  tokens: OrchestrationTokens | null,
): LogLine {
  return {
    ...base,
    inputTokens: tokens === null ? null : tokens.input,
    outputTokens: tokens === null ? null : tokens.output,
    cacheReadTokens: tokens === null ? null : tokens.cacheRead,
    cacheWriteTokens: tokens === null ? null : tokens.cacheWrite,
  }
}

// --------------------------------------------------------------- ticking

function isActive(row: OrchestrationAgent): boolean {
  return row.status === 'running'
}

/** Running, or running with no update past the stale limit: not yet ended. */
function isOpenRow(row: OrchestrationAgent): boolean {
  return row.status === 'running' || row.status === 'stale'
}

function stopTicker(): void {
  try {
    timer?.cancel()
  } catch {
    // a timer from a dropped environment
  }
  timer = undefined
}

/** One timer at most, armed only while some agent runs. */
function armTicker($: Dollar): void {
  if (timer !== undefined) return
  try {
    timer = $.clock.every(TICK_MS, () => {
      tick($).catch(() => undefined)
    })
  } catch {
    timer = undefined
  }
}

async function tick($: Dollar): Promise<void> {
  const now = await nowOf($)
  const list = await update($, agentsA, value =>
    saneAgents(value).map(r =>
      isActive(r) && now - r.activeAt > STALE_MS ? { ...r, status: 'stale' as const } : r,
    ),
  )
  // While an agent or the base turn runs, the snapshot is rewritten each
  // tick, so its age tells a page whether the mod is still writing.
  scheduleSnapshot($)
  const isBaseRunning = saneMain(await read($, mainA)).status === 'running'
  if (!list.some(isActive) && !isBaseRunning) {
    stopTicker()
    return
  }
  await update($, tickA, () => now)
}

// -------------------------------------------------------------- events

function newRow(id: string, now: number): OrchestrationAgent {
  return {
    id,
    label: `agent ${id}`,
    stage: '',
    seat: 'not seen at spawn',
    askedModel: null,
    askedEffort: null,
    ranEffort: null,
    resolvedModel: null,
    ranModel: null,
    parentModel: null,
    status: 'running',
    endReason: null,
    startedAt: now,
    activeAt: now,
    endedAt: null,
    tokens: null,
    turns: 0,
    reportedTurns: 0,
    counted: false,
    workflowRunId: null,
    workflowIndex: null,
    isTeammate: false,
  }
}

/** Running rows count toward the cap: the oldest settled go first, then the oldest running. */
function keepRecent(list: OrchestrationAgent[]): OrchestrationAgent[] {
  if (list.length <= MAX_ROWS) return list
  const timeOf = (r: OrchestrationAgent) => r.endedAt ?? r.activeAt
  const order = [...list].sort(
    (a, b) => Number(isActive(a)) - Number(isActive(b)) || timeOf(a) - timeOf(b),
  )
  const drop = new Set(order.slice(0, list.length - MAX_ROWS).map(r => r.id))
  return list.filter(r => !drop.has(r.id))
}

type SpawnFacts = {
  agentId: string
  label: string
  seat: string
  askedModel: string | null
  askedEffort: string | null
  resolvedModel: string | null
  parentModel: string | null
  workflowRunId: string | null
  workflowIndex: number | null
  isTeammate: boolean
  isResume: boolean
}

async function onSpawn($: Dollar, facts: SpawnFacts): Promise<void> {
  const now = await nowOf($)
  await update($, agentsA, value => {
    const list = saneAgents(value)
    const at = list.findIndex(r => r.id === facts.agentId)
    const old = at >= 0 ? list[at] : undefined
    // A turn.complete that came first made a bare row: keep its status and
    // tokens, fill in what the spawn knows.
    const base = old ?? newRow(facts.agentId, now)
    const row: OrchestrationAgent = {
      ...base,
      label: facts.label,
      stage: stageWord(facts.label),
      seat: facts.seat,
      askedModel: facts.askedModel ?? base.askedModel,
      askedEffort: facts.askedEffort ?? base.askedEffort,
      resolvedModel: facts.resolvedModel ?? base.resolvedModel,
      parentModel: facts.parentModel ?? base.parentModel,
      workflowRunId: facts.workflowRunId ?? base.workflowRunId,
      workflowIndex: facts.workflowIndex ?? base.workflowIndex,
      isTeammate: facts.isTeammate || base.isTeammate,
    }
    if (facts.isResume && old !== undefined) {
      row.status = 'running'
      row.activeAt = now
      row.endedAt = null
    }
    if (old === undefined) return keepRecent([...list, row])
    return list.map((r, i) => (i === at ? row : r))
  })
  armTicker($)
  scheduleSnapshot($)
}

async function onTurnStart($: Dollar, agentId: string | undefined): Promise<void> {
  const now = await nowOf($)
  if (agentId === undefined) {
    await update($, mainA, value => ({
      ...saneMain(value),
      status: 'running' as const,
      turnStartedAt: now,
    }))
    armTicker($)
    scheduleSnapshot($)
    return
  }
  await update($, agentsA, value =>
    saneAgents(value).map(r =>
      r.id === agentId && r.status !== 'running'
        ? { ...r, status: 'running' as const, activeAt: now, endedAt: null }
        : r,
    ),
  )
  armTicker($)
  scheduleSnapshot($)
}

async function onEffort($: Dollar, agentId: string | undefined, level: string): Promise<void> {
  if (agentId === undefined) {
    await update($, mainA, value => ({ ...saneMain(value), effort: level }))
    scheduleSnapshot($)
    return
  }
  await update($, agentsA, value =>
    saneAgents(value).map(r => (r.id === agentId ? { ...r, ranEffort: level } : r)),
  )
  scheduleSnapshot($)
}

function toTokens(e: TurnCompleteInput): OrchestrationTokens | null {
  const u = e.usage
  if (u === undefined) return null
  return {
    input: num(u.input_tokens),
    output: num(u.output_tokens),
    cacheRead: num(u.cache_read_input_tokens),
    cacheWrite: num(u.cache_creation_input_tokens),
  }
}

async function onTurnComplete(
  $: Dollar,
  e: TurnCompleteInput,
  logLabels: boolean,
): Promise<void> {
  const now = await nowOf($)
  const nowIso = new Date(now).toISOString()
  const tokens = toTokens(e)
  const ranModel = e.usage?.model ?? null
  const status = e.reason === 'answer' ? 'done' : 'failed'
  const sessionId = await sessionIdOf($)
  const agentId = e.agentId

  if (agentId === undefined) {
    const main = await update($, mainA, value => {
      const m = saneMain(value)
      return {
        ...m,
        model: ranModel ?? m.model,
        status: 'idle' as const,
        turnStartedAt: null,
        lastTurnMs: num(e.durationMs),
        tokens: tokens === null ? m.tokens : addTokens(m.tokens, tokens),
        turns: m.turns + 1,
        unreportedTurns: m.unreportedTurns + (tokens === null ? 1 : 0),
      }
    })
    await update($, totalsA, value => {
      const t = saneTotals(value)
      if (t.since === null) t.since = nowIso
      return addToTotals(t, main.model, tokens, { agents: 0, turns: 1 })
    })
    scheduleSnapshot($)
    await addAllTime($, main.model, tokens, { agents: 0, turns: 1 }, nowIso)
    await appendLog(
      $,
      lineOf(
        {
          time: nowIso,
          sessionId,
          kind: 'turn',
          agentId: null,
          stage: '',
          seat: 'main',
          model: main.model,
          effort: main.effort,
          status,
          durationMs: num(e.durationMs),
        },
        tokens,
      ),
    )
    return
  }

  let finished: OrchestrationAgent | undefined
  let isFirstCount = false
  let isFirstEnd = false
  let wasSeen = true
  await update($, agentsA, value => {
    const list = saneAgents(value)
    const at = list.findIndex(r => r.id === agentId)
    wasSeen = at >= 0
    const row = at >= 0 ? (list[at] ?? newRow(agentId, now)) : newRow(agentId, now - num(e.durationMs))
    isFirstCount = !row.counted
    isFirstEnd = row.turns === 0
    const next: OrchestrationAgent = {
      ...row,
      status,
      endReason: e.reason,
      endedAt: now,
      ranModel: ranModel ?? row.ranModel,
      tokens: tokens === null ? row.tokens : addTokens(row.tokens ?? zeroTokens(), tokens),
      turns: row.turns + 1,
      reportedTurns: row.reportedTurns + (tokens === null ? 0 : 1),
      counted: true,
    }
    finished = next
    return at >= 0 ? list.map((r, i) => (i === at ? next : r)) : keepRecent([...list, next])
  })
  const row = finished
  if (row === undefined) return
  const model = ranModel ?? row.resolvedModel ?? row.askedModel ?? row.parentModel
  const counts = { agents: isFirstCount ? 1 : 0, turns: 0 }
  await update($, totalsA, value => {
    const t = saneTotals(value)
    if (t.since === null) t.since = nowIso
    return addToTotals(t, model, tokens, counts)
  })
  scheduleSnapshot($)
  await addAllTime($, model, tokens, counts, nowIso)
  const durationMs = isFirstEnd ? Math.max(0, now - row.startedAt) : num(e.durationMs)
  const writeLine = async () => {
    // The row as it stands now: a spawn that came after its end has filled it in.
    const current =
      saneAgents(await read($, agentsA)).find(r => r.id === agentId) ?? row
    await appendLog(
      $,
      lineOf(
        {
          time: nowIso,
          sessionId,
          kind: 'agent',
          agentId: current.id,
          stage: current.stage,
          seat: seatOut(current),
          ...(logLabels ? { label: current.label } : {}),
          model: ranModel ?? current.resolvedModel ?? current.askedModel ?? current.parentModel,
          effort: current.ranEffort ?? current.askedEffort ?? 'inherits',
          status,
          durationMs,
        },
        tokens,
      ),
    )
  }
  if (!wasSeen) {
    // Its end came before its spawn was recorded: give the spawn a moment.
    try {
      $.clock.after(SPAWN_GRACE_MS, () => record($, writeLine))
      return
    } catch {
      // no timer: write it as it stands
    }
  }
  await writeLine()
}

async function setup($: Dollar): Promise<void> {
  try {
    await $.command.register({
      name: 'orchestration',
      description: 'Open the Orchestration pane, or "export" to write a session summary file',
      argumentHint: '[export]',
    })
  } catch {
    // the pane still records; the command is what failed
  }
  const now = await nowOf($)
  let model: string | null = null
  try {
    model = await $.session.model()
  } catch {
    model = null
  }
  await update($, mainA, value => {
    const m = saneMain(value)
    return {
      ...m,
      model: m.model ?? model,
      firstSeenAt: m.firstSeenAt > 0 ? m.firstSeenAt : now,
    }
  })
  await logFileOf($)
  await refreshAllTime($)
  if (saneAgents(await read($, agentsA)).some(isActive)) armTicker($)
  // Written once at start, so a page has something before the first agent.
  scheduleSnapshot($)
}

async function reset($: Dollar): Promise<void> {
  const nowIso = new Date(await nowOf($)).toISOString()
  await update($, totalsA, () => emptyTotals(nowIso))
  await update($, mainA, value => {
    const m = saneMain(value)
    return { ...m, tokens: zeroTokens(), turns: 0, unreportedTurns: 0 }
  })
  // Running rows stay, with their counts cleared; `counted` stays, so an
  // agent already counted is never counted again.
  await update($, agentsA, value =>
    saneAgents(value)
      .filter(isActive)
      .map(r => ({ ...r, tokens: null, turns: 0, reportedTurns: 0 })),
  )
  await update($, expandedA, () => null)
  scheduleSnapshot($)
}

async function resetAllTime($: Dollar): Promise<void> {
  const nowIso = new Date(await nowOf($)).toISOString()
  try {
    for (const key of await $.store.keys()) {
      if (key === LEGACY_STORE_KEY || key.startsWith(SESSION_KEY_PREFIX)) {
        await $.store.delete(key)
      }
    }
  } catch (err) {
    await noteFailure($, 'totals store', err)
  }
  othersCache = emptyTotals(null)
  ownTotals = emptyTotals(nowIso)
  await update($, allTimeA, () => emptyTotals(nowIso))
  scheduleSnapshot($)
}

async function exportSummary($: Dollar, logLabels: boolean): Promise<string> {
  const dir = await dirOf($)
  if (dir === null) {
    return 'Export is off: none of CLAUDE_CONFIG_DIR, HOME or USERPROFILE is set, so there is no folder to write to.'
  }
  const now = await nowOf($)
  const nowIso = new Date(now).toISOString()
  const agents = saneAgents(await read($, agentsA)).map(r => ({
    agentId: r.id,
    stage: r.stage,
    seat: seatOut(r),
    ...(logLabels ? { label: r.label } : {}),
    askedModel: r.askedModel,
    askedEffort: r.askedEffort,
    ranEffort: r.ranEffort,
    resolvedModel: r.resolvedModel,
    ranModel: r.ranModel,
    status: r.status,
    endReason: r.endReason,
    startedAt: new Date(r.startedAt).toISOString(),
    endedAt: r.endedAt === null ? null : new Date(r.endedAt).toISOString(),
    tokens: r.tokens,
    workflowRunId: r.workflowRunId,
  }))
  const main = saneMain(await read($, mainA))
  const summary = {
    exportedAt: nowIso,
    sessionId: await sessionIdOf($),
    main: { model: main.model, effort: main.effort, turns: main.turns, tokens: main.tokens },
    totals: saneTotals(await read($, totalsA)),
    allTime: saneTotals(await read($, allTimeA)),
    agents,
  }
  const out = `${dir}/export-${await sessionKeyOf($)}-${nowIso.replace(/[:.]/g, '-')}.json`
  try {
    await $.fs.write(out, `${JSON.stringify(summary, null, 2)}\n`)
  } catch (err) {
    await noteFailure($, 'export', err)
    return `The export could not be written to ${out}: ${messageOf(err)}`
  }
  return `Exported this session's orchestration summary to ${out}. It holds no prompt text${logLabels ? '' : ' and no agent descriptions'}. Session tokens: ${fmtTokens(overall(summary.totals))}.`
}

// ------------------------------------------------------------- drawing

function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function fmtTokens(t: OrchestrationTokens): string {
  return `in ${fmtInt(t.input)}, out ${fmtInt(t.output)}, cache read ${fmtInt(t.cacheRead)}, cache write ${fmtInt(t.cacheWrite)}`
}

function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

function fmtIso(ms: number | null): string {
  return ms === null || ms <= 0 ? 'not known' : new Date(ms).toISOString()
}

function tokensText(row: OrchestrationAgent): string {
  if (row.tokens !== null) {
    const missing = row.turns - row.reportedTurns
    const partial = missing > 0 ? ` (${plural(missing, 'turn', 'turns')} not reported)` : ''
    return `tokens ${fmtTokens(row.tokens)}${partial}`
  }
  return row.status === 'running' ? 'tokens when it ends' : 'tokens not reported'
}

const STATUS_COLOR: Record<OrchestrationAgent['status'], string> = {
  running: 'warning',
  done: 'success',
  failed: 'error',
  stale: 'subtle',
}

function verdictText(v: Verdict): string {
  if (v.kind === 'unpaired') return 'no paired work found: independence not checked'
  if (v.against === 'base') {
    if (v.kind === 'same') return 'same model as the base session, the only one that did work here'
    if (v.kind === 'different') return 'different model from the base session, the only one that did work here'
    return 'same-model check against the base session: models not known yet'
  }
  if (v.kind === 'same') return 'same model as the work'
  if (v.kind === 'different') return 'different model from the work'
  return 'same-model check: models not known yet'
}

function plural(n: number, one: string, many: string): string {
  return `${fmtInt(n)} ${n === 1 ? one : many}`
}

const FOOTER = [
  'Token counts are the engine\'s own, from each turn\'s end (turn.complete usage). An agent whose end the engine did not report shows "tokens not reported"; nothing is estimated.',
  'A turn that ran on more than one model is counted under the model of its last response.',
  'Same-model check, by label prefix only: draft, build and fold are work; review, verify and edict-v are review. A review is flagged only against a real pair: work whose label has the same text after the colon, inside the same workflow run, or outside workflows among the session\'s own agents. A review with no pair reads "no paired work found: independence not checked". Only when no other agent in the session did any work is a review compared with the base session\'s model.',
  'Limits of the check: labels without those prefixes are not checked, a label is taken at its word, work done by an unlabelled agent is never paired, and workflow phase names are not exposed to mods, so phases are not matched.',
  'Effort: "asked" is what the Agent call stated; "ran at" is what a Stop or SubagentStop event reported. A workflow agent\'s asked effort is not exposed.',
  `An agent with no update for ${STALE_MINUTES} minutes after its last turn began is marked "running for over ${STALE_MINUTES} minutes with no update". It still counts as running until it ends.`,
]

export const register: Register = (on, options) => {
  const logLabels = options.logLabels === true
  logLabelsOption = logLabels

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    try {
      sessionIdCache = undefined
      dirCache = undefined
      othersCache = undefined
      ownTotals = undefined
      endedMarker = null
      stopTicker()
      record($, () => setup($))
    } catch {
      // observation only
    }
    return result
  })

  on('session.end', async ($, e, next) => {
    const result = await next(e)
    try {
      const reason = e.reason
      record($, async () => {
        // Mark the ending session's snapshot, so a page can say it has ended,
        // then let a /clear start the next session's records afresh.
        endedMarker = { at: new Date(await nowOf($)).toISOString(), reason }
        stopTicker()
        await writeSnapshot($)
        if (reason === 'clear') {
          sessionIdCache = undefined
          othersCache = undefined
          ownTotals = undefined
          endedMarker = null
        }
      })
      // Let queued lines land before the process may exit, inside the event's
      // shared 1.5 s bound.
      const pending = work
      await Promise.race([pending, $.clock.sleep(DRAIN_MS).catch(() => undefined)])
    } catch {
      // observation only
    }
    return result
  })

  on('command.run', { command: 'orchestration' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'export') {
      try {
        return { text: await exportSummary($, logLabels) }
      } catch {
        return { text: 'The export could not be written.' }
      }
    }
    try {
      const opened = await $.ui.open({ id: PANE, title: TITLE })
      return {
        text: opened.isPlaced
          ? 'Orchestration pane opened.'
          : 'Orchestration pane will show when the surface can place it.',
      }
    } catch {
      return { text: 'The Orchestration pane could not be opened.' }
    }
  })

  // The Agent call states the effort and model it asks for; agent.spawn
  // carries the same tool_use_id but not the effort. No I/O here.
  on('tool.call', { tool: 'Agent' }, ($, e, next) => {
    try {
      asked.set(e.tool_use_id, { model: e.model ?? null, effort: e.effort ?? null })
      if (asked.size > 200) {
        const oldest = asked.keys().next()
        if (!oldest.done) asked.delete(oldest.value)
      }
    } catch {
      // observation only
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    try {
      if (started.deny === undefined) {
        const call = asked.get(e.tool_use_id)
        if (e.workflow === undefined) asked.delete(e.tool_use_id)
        const facts: SpawnFacts = {
          agentId:
            started.agentId ??
            e.resume?.agentId ??
            `${e.workflow?.runId ?? e.tool_use_id}-${e.workflow?.agentIndex ?? 0}`,
          label: e.description || e.name || e.subagentType || 'agent',
          seat: e.subagentType || 'unknown',
          askedModel: e.model ?? call?.model ?? null,
          askedEffort: e.workflow === undefined ? (call?.effort ?? null) : null,
          resolvedModel: typeof started.model === 'string' ? started.model : null,
          parentModel: typeof e.parentModel === 'string' ? e.parentModel : null,
          workflowRunId: e.workflow?.runId || null,
          workflowIndex: e.workflow?.agentIndex ?? null,
          isTeammate: e.isTeammate === true,
          isResume: e.resume !== undefined,
        }
        record($, () => onSpawn($, facts))
      }
    } catch {
      // observation only
    }
    return started
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const result = await next(e)
    try {
      const agentId = e.agentId
      record($, () => onTurnStart($, agentId))
    } catch {
      // observation only
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    try {
      const ended = { ...e }
      record($, () => onTurnComplete($, ended, logLabels))
    } catch {
      // observation only
    }
    return result
  })

  // The effort a turn actually ran at, from the classic Stop events' base
  // fields; read without a streaming turn.step hook.
  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    try {
      const level = e.effort?.level
      if (typeof level === 'string') record($, () => onEffort($, undefined, level))
    } catch {
      // observation only
    }
    return result
  }).catch(($, e, next) => next(e))

  on('classic.SubagentStop', async ($, e, next) => {
    const result = await next(e)
    try {
      const level = e.effort?.level
      const agentId = e.agent_id
      if (typeof level === 'string') record($, () => onEffort($, agentId, level))
    } catch {
      // observation only
    }
    return result
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const tickAt = await read($, tickA)
    let now = await nowOf($)
    if (now === 0) now = typeof tickAt === 'number' ? tickAt : 0
    const agents = saneAgents(await read($, agentsA))
    const main = saneMain(await read($, mainA))
    const totals = saneTotals(await read($, totalsA))
    const allTime = saneTotals(await read($, allTimeA))
    const failure = saneFailure(await read($, failureA))
    const showFinished = (await read($, showFinishedA)) !== false
    const expandedRaw = await read($, expandedA)
    const expanded = typeof expandedRaw === 'string' ? expandedRaw : null
    const logPathRaw = await read($, logPathA)
    const logPath = typeof logPathRaw === 'string' ? logPathRaw : ''

    const running = agents.filter(isOpenRow).sort((a, b) => a.startedAt - b.startedAt)
    const finished = agents
      .filter(r => !isOpenRow(r))
      .sort((a, b) => (b.endedAt ?? b.activeAt) - (a.endedAt ?? a.activeAt))
    const all = overall(totals)

    if (e.props.placement === 'widget') {
      return (
        <Box flexDirection="column">
          <Text>
            {running.length} running, {finished.length} finished
          </Text>
          <Text dimColor>Session tokens: {fmtInt(sumTokens(all))}</Text>
        </Box>
      )
    }

    const shown = showFinished ? [...running, ...finished] : running

    const rowOf = (row: OrchestrationAgent) => {
      const verdict = checkOf(row, agents, main.model)
      const end = isOpenRow(row) ? now : (row.endedAt ?? now)
      const elapsed = fmtDuration(end - row.startedAt)
      const isOpen = expanded === row.id
      const ranOn = row.ranModel ?? row.resolvedModel ?? 'not known yet'
      return (
        <Box key={`agent-${row.id}`} flexDirection="column" marginTop={1}>
          <Button
            key={`row-${row.id}`}
            plain
            onPress={() => {
              update($, expandedA, cur => (cur === row.id ? null : row.id)).catch(
                () => undefined,
              )
            }}
          >
            <Text color={STATUS_COLOR[row.status]}>{row.status}</Text> {row.label}{' '}
            <Text dimColor>({row.seat})</Text>
          </Button>
          <Text dimColor>
            asked: model {row.askedModel ?? 'inherits'}, effort {row.askedEffort ?? 'inherits'}
            ; runs on {ranOn}
            {row.ranEffort === null ? '' : `; ran at effort ${row.ranEffort}`}; {elapsed};{' '}
            {tokensText(row)}
          </Text>
          {row.status === 'stale' && (
            <Text color="warning">
              Running for over {STALE_MINUTES} minutes with no update.
            </Text>
          )}
          {verdict !== undefined && (
            <Text
              color={
                verdict.kind === 'same' ? 'error' : verdict.kind === 'different' ? 'success' : undefined
              }
              dimColor={verdict.kind === 'unknown' || verdict.kind === 'unpaired'}
            >
              {verdictText(verdict)}
            </Text>
          )}
          {isOpen && (
            <Box flexDirection="column" paddingLeft={2}>
              <Text>Started: {fmtIso(row.startedAt)}</Text>
              <Text>
                Ended:{' '}
                {row.endedAt === null ? 'not yet' : fmtIso(row.endedAt)}
              </Text>
              <Text>Seat: {row.seat}</Text>
              <Text>
                Model: asked {row.askedModel ?? 'inherits'}, started on{' '}
                {row.resolvedModel ?? 'not known'}, last ran on {row.ranModel ?? 'not reported'}
              </Text>
              <Text>
                Effort: asked {row.askedEffort ?? 'inherits'}, ran at{' '}
                {row.ranEffort ?? 'not reported'}
              </Text>
              <Text>Agent id: {row.id}</Text>
              <Text>Tokens: {row.tokens === null ? 'not reported' : fmtTokens(row.tokens)}</Text>
              <Text>
                Turns ended: {fmtInt(row.turns)}, with usage reported: {fmtInt(row.reportedTurns)}
              </Text>
              {row.endReason !== null && <Text>End reason: {row.endReason}</Text>}
              {row.workflowRunId !== null && (
                <Text>
                  Workflow run {row.workflowRunId}, agent {row.workflowIndex ?? 'not known'}
                </Text>
              )}
            </Box>
          )}
        </Box>
      )
    }

    const tierLines = TIERS.filter(t => sumTokens(totals.byTier[t]) > 0)
    const allTimeTiers = TIERS.filter(t => sumTokens(allTime.byTier[t]) > 0)
    const baseState =
      main.status === 'running' && main.turnStartedAt !== null
        ? `running this turn for ${fmtDuration(now - main.turnStartedAt)}`
        : main.lastTurnMs === null
          ? 'idle'
          : `idle; last turn took ${fmtDuration(main.lastTurnMs)}`

    return (
      <Box flexDirection="column">
        <Text bold>{TITLE}</Text>
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Button
            key="toggle-finished"
            label={showFinished ? 'Hide finished' : 'Show finished'}
            onPress={() => {
              update($, showFinishedA, v => v === false).catch(() => undefined)
            }}
          />
          <Button
            key="reset"
            label="Reset counts"
            onPress={() => {
              reset($).catch(() => undefined)
            }}
          />
          <Button
            key="reset-all-time"
            label="Reset all sessions"
            onPress={() => {
              resetAllTime($).catch(() => undefined)
            }}
          />
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text bold>Base session</Text>
          <Text>Status: {baseState}</Text>
          {main.firstSeenAt > 0 && (
            <Text dimColor>
              Seen for {fmtDuration(now - main.firstSeenAt)}, since {fmtIso(main.firstSeenAt)}
            </Text>
          )}
          <Text>
            Model {main.model ?? 'not known yet'}; effort {main.effort ?? 'not reported'};{' '}
            {plural(main.turns, 'turn', 'turns')}; tokens{' '}
            {main.turns > 0 && main.unreportedTurns === main.turns
              ? 'not reported'
              : fmtTokens(main.tokens)}
          </Text>
          {main.unreportedTurns > 0 && (
            <Text dimColor>
              {plural(main.unreportedTurns, 'turn', 'turns')} ended with no usage reported
            </Text>
          )}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text bold>
            Agents: {running.length} running, {finished.length} finished
          </Text>
          {agents.length === 0 && <Text dimColor>No agents spawned yet.</Text>}
          {!showFinished && finished.length > 0 && (
            <Text dimColor>{plural(finished.length, 'finished agent', 'finished agents')} hidden</Text>
          )}
          {shown.map(rowOf)}
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text bold>Totals this session</Text>
          {tierLines.length === 0 && <Text dimColor>No tokens reported yet.</Text>}
          {tierLines.map(t => (
            <Text>
              {t}: {fmtTokens(totals.byTier[t])}
            </Text>
          ))}
          <Text>Overall: {fmtTokens(all)}</Text>
          <Text dimColor>
            {plural(totals.agents, 'agent', 'agents')} and{' '}
            {plural(totals.turns, 'main turn', 'main turns')} counted
            {totals.since === null ? '' : ` since ${totals.since}`}
          </Text>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text bold>All sessions</Text>
          {allTimeTiers.map(t => (
            <Text>
              {t}: {fmtTokens(allTime.byTier[t])}
            </Text>
          ))}
          <Text>Overall: {fmtTokens(overall(allTime))}</Text>
          <Text dimColor>
            {plural(allTime.agents, 'agent', 'agents')} and{' '}
            {plural(allTime.turns, 'main turn', 'main turns')} in all sessions
            {allTime.since === null ? '' : ` since ${allTime.since}`}
          </Text>
        </Box>

        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>
            Usage log for this session:{' '}
            {logPath === ''
              ? 'off (no CLAUDE_CONFIG_DIR, HOME or USERPROFILE to place it under)'
              : logPath}
          </Text>
          {failure === null ? (
            <Text dimColor>No write has failed this session.</Text>
          ) : (
            <Text color="error">
              Last write failed at {failure.at}: the {failure.target} could not be written (
              {failure.reason}).
            </Text>
          )}
          <Text dimColor>
            Agent descriptions are {logLabels ? 'written' : 'not written'} to the log (option
            logLabels).
          </Text>
          {FOOTER.map(line => (
            <Text dimColor>{line}</Text>
          ))}
        </Box>
      </Box>
    )
  })
}
