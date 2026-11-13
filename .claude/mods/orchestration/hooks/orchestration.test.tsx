import { expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

const SURFACES = ['terminal', 'desktop'] as const
const DIR = '/home/t/.claude/orchestration'
const LOG = `${DIR}/usage-sess-1.jsonl`
const LIVE = `${DIR}/live-sess-1.json`
const SECRET = 'SECRET-PROMPT-TEXT'
const PRIVATE = 'customer-4711'

const PANE = {
  plugin: 'orchestration',
  component: 'Pane',
  requestId: 'orchestration',
  props: {
    title: 'Orchestration',
    isFocused: false,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const COMMAND = {
  command: 'orchestration',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 120 },
} as const

type World = {
  files: Map<string, string>
  store: Map<string, unknown>
  clock: MockClock
  order: string[]
  /** Lets the mod's queued work run: no hook of the mod awaits it. */
  flush: () => Promise<void>
}

type WorldOptions = {
  store?: Record<string, unknown>
  failWrites?: boolean
  failStore?: boolean
  failPaths?: RegExp
  sizes?: Record<string, number>
}

/** The world beneath the plugin: clock, store, env, a file system in memory. */
function world(on: On, options: WorldOptions = {}): World {
  const files = new Map<string, string>()
  const store = new Map<string, unknown>(Object.entries(options.store ?? {}))
  const order: string[] = []
  let spawned = 0
  const clock = mock.clock(on, { now: 1_800_000_000_000 })
  mock.env(on, { HOME: '/home/t' })
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    if (options.failStore === true) throw new Error('store is full')
    store.set(e.key, JSON.parse(JSON.stringify(e.value)))
    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    store.delete(e.key)
    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...store.keys()] }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('session.model', () => ({ value: 'claude-fable-5' }))
  on('command.register', () => ({ value: { command: 'orchestration' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('fs.exists', (_, e) => ({ value: files.has(e.path) }))
  on('fs.stat', (_, e) => ({
    value: {
      kind: 'file',
      size: options.sizes?.[e.path] ?? (files.get(e.path) ?? '').length,
      mtimeMs: 0,
      isLink: false,
    },
  }))
  on('fs.read', (_, e) => ({ value: files.get(e.path) ?? '' }))
  on('fs.write', (_, e) => {
    order.push('fs.write')
    if (options.failWrites === true) throw new Error('EACCES: permission denied')
    if (options.failPaths?.test(e.path) === true) throw new Error('EROFS: read-only file system')
    files.set(e.path, e.text)
    return { value: undefined }
  })
  // The engine's own answers: a started agent, a turn's start and end.
  on('agent.spawn', (_, e) => {
    spawned += 1
    return { model: e.model ?? e.parentModel, agentId: `a${spawned}` }
  })
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => {
    order.push('core')
    return { text: '' }
  })
  on('classic.Stop', () => ({}))
  on('classic.SubagentStop', () => ({}))
  const flush = async () => {
    for (let i = 0; i < 4; i++) await clock.settle()
  }
  return { files, store, clock, order, flush }
}

async function spawn(
  $: Engine,
  description: string,
  options: { model?: string; workflowRunId?: string } = {},
): Promise<string> {
  const started = await $.agent.spawn({
    tool_use_id: `call-${description}`,
    prompt: `${SECRET}\nsecond line`,
    description,
    subagentType: 'general-purpose',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
    ...(options.model === undefined ? {} : { model: options.model }),
    ...(options.workflowRunId === undefined
      ? {}
      : { workflow: { runId: options.workflowRunId, agentIndex: 1 } }),
  })
  return started.agentId ?? ''
}

async function end(
  $: Engine,
  agentId: string | undefined,
  model: string | undefined,
  reason: 'answer' | 'error' = 'answer',
): Promise<void> {
  await $.turn.complete({
    ...(agentId === undefined ? {} : { agentId }),
    answer: '',
    durationMs: 1000,
    isAborted: false,
    turnId: `turn-${agentId ?? 'main'}`,
    reason,
    ...(model === undefined
      ? {}
      : {
          usage: {
            model,
            input_tokens: 100,
            output_tokens: 20,
            cache_read_input_tokens: 300,
            cache_creation_input_tokens: 4,
          },
        }),
  })
}

function linesOf(text: string | undefined): Record<string, unknown>[] {
  return (text ?? '')
    .trim()
    .split('\n')
    .filter(line => line !== '')
    .map(line => JSON.parse(line) as Record<string, unknown>)
}

test('a spawned agent is a running row, then done, counted under its tier', async ($, on) => {
  const w = world(on)
  const id = await spawn($, 'build:pane', { model: 'opus' })
  await w.flush()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const row = await ui.find({ key: `row-${id}` })
    expect(row?.text).toContain('running')
    expect(row?.text).toContain('build:pane')
    expect((await ui.find({ type: 'Text', text: /asked: model opus/ }))?.text).toContain(
      'effort inherits',
    )
    await ui.unmount()
  }

  await end($, id, 'claude-opus-5-5')
  await w.flush()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('done')
    expect((await ui.find({ type: 'Text', text: /^Opus:/ }))?.text).toBe(
      'Opus: in 100, out 20, cache read 300, cache write 4',
    )
    expect((await ui.find({ type: 'Text', text: /^Overall:/ }))?.text).toBe(
      'Overall: in 100, out 20, cache read 300, cache write 4',
    )
    await ui.unmount()
  }
})

test('the effort asked and the effort reported both reach the rows', async ($, on) => {
  const w = world(on)
  let callId = ''
  on('tool.call', (_, e) => {
    callId = e.tool_use_id
    return { result: {} }
  })
  await $.tool.call({ tool: 'Agent', description: 'scout', prompt: 'look', effort: 'high' })
  const started = await $.agent.spawn({
    tool_use_id: callId,
    prompt: 'look',
    description: 'scout',
    subagentType: 'Explore',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
  })
  await w.flush()
  await $.classic.SubagentStop({
    stop_hook_active: false,
    agent_id: started.agentId ?? '',
    agent_transcript_path: '',
    agent_type: 'Explore',
    effort: { level: 'medium' },
  })
  await $.classic.Stop({ stop_hook_active: false, effort: { level: 'xhigh' } })
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const line = (await ui.find({ type: 'Text', text: /asked: model/ }))?.text
    expect(line).toContain('asked: model inherits, effort high')
    expect(line).toContain('ran at effort medium')
    expect(await ui.find({ type: 'Text', text: /effort xhigh; 0 turns/ })).toBeDefined()
    await ui.unmount()
  }
})

test('a failed agent shows failed, and no usage reads not reported', async ($, on) => {
  const w = world(on)
  const id = await spawn($, 'verify:thing')
  await end($, id, undefined, 'error')
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('failed')
    expect(await ui.find({ type: 'Text', text: /tokens not reported/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the toggle hides finished rows and keeps running ones', async ($, on) => {
  const w = world(on)
  const doneId = await spawn($, 'draft:a')
  const runningId = await spawn($, 'draft:b')
  await end($, doneId, 'claude-sonnet-5-5')
  await w.flush()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ key: `row-${doneId}` })).toBeDefined()
    await ui.press({ key: 'toggle-finished' })
    expect(await ui.find({ key: `row-${doneId}` })).toBeUndefined()
    expect(await ui.find({ key: `row-${runningId}` })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /1 finished agent hidden/ })).toBeDefined()
    await ui.press({ key: 'toggle-finished' })
    expect(await ui.find({ key: `row-${doneId}` })).toBeDefined()
    await ui.unmount()
  }
})

test('a row expands to times, seat, model, effort, id and tokens, never the prompt', async ($, on) => {
  const w = world(on)
  const id = await spawn($, 'draft:c')
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /^Started:/ })).toBeUndefined()
    await ui.press({ key: `row-${id}` })
    expect(await ui.find({ type: 'Text', text: /^Started: 20/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Ended: 20/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^Seat:/ }))?.text).toBe('Seat: general-purpose')
    expect(await ui.find({ type: 'Text', text: /^Model: asked inherits/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Effort: asked inherits/ })).toBeDefined()
    expect((await ui.find({ type: 'Text', text: /^Agent id:/ }))?.text).toBe(`Agent id: ${id}`)
    expect((await ui.find({ type: 'Text', text: /^Tokens:/ }))?.text).toBe(
      'Tokens: in 100, out 20, cache read 300, cache write 4',
    )
    expect(await ui.find({ text: SECRET })).toBeUndefined()
    expect(await ui.find({ text: 'second line' })).toBeUndefined()
    await ui.press({ key: `row-${id}` })
    await ui.unmount()
  }
})

test('no prompt text is kept in $.state', async ($, on) => {
  const written: unknown[] = []
  on('state.set', (_, e, next) => {
    written.push(e.value)
    return next(e)
  })
  const w = world(on)
  const id = await spawn($, 'draft:s')
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  expect(written.length).toBeGreaterThan(0)
  expect(JSON.stringify(written)).not.toContain(SECRET)
  expect(JSON.stringify(written)).not.toContain('second line')
})

test('Reset clears the counts', async ($, on) => {
  const w = world(on)
  const id = await spawn($, 'build:x')
  await end($, id, 'claude-haiku-4-5')
  await end($, undefined, 'claude-fable-5')
  await w.flush()

  // The counts are the session's, so each surface presses Reset over fresh ones.
  for (const surface of SURFACES) {
    const again = await spawn($, `build:${surface}`)
    await end($, again, 'claude-haiku-4-5')
    await end($, undefined, 'claude-fable-5')
    await w.flush()
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /^Overall:/ }))?.text).toBe(
      surface === 'terminal'
        ? 'Overall: in 400, out 80, cache read 1,200, cache write 16'
        : 'Overall: in 200, out 40, cache read 600, cache write 8',
    )
    await ui.press({ key: 'reset' })
    expect((await ui.find({ type: 'Text', text: /^Overall:/ }))?.text).toBe(
      'Overall: in 0, out 0, cache read 0, cache write 0',
    )
    expect((await ui.find({ type: 'Text', text: /^Model claude-fable-5/ }))?.text).toContain(
      '0 turns',
    )
    expect(await ui.find({ key: `row-${id}` })).toBeUndefined()
    await ui.unmount()
  }
})

test('Reset does not count an agent twice when it ends again', async ($, on) => {
  const w = world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const id = await spawn($, 'mate')
  await end($, id, 'claude-opus-5-5')
  await $.turn.start({ text: '', turnId: 't2', agentId: id })
  await w.flush()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'reset' })
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  await ui.redraw()
  expect((await ui.find({ type: 'Text', text: /main turns counted/ }))?.text).toContain(
    '0 agents and 0 main turns counted',
  )
  expect((await ui.find({ type: 'Text', text: /in all sessions/ }))?.text).toContain(
    '1 agent and 0 main turns in all sessions',
  )
  expect(w.store.get('session:sess-1')).toMatchObject({ agents: 1 })
  await ui.unmount()
})

test('a review on the work model is flagged, one on another model is not', async ($, on) => {
  const w = world(on)
  const draftX = await spawn($, 'draft:x', { model: 'opus' })
  const reviewX = await spawn($, 'review:x', { model: 'opus' })
  const draftY = await spawn($, 'draft:y', { model: 'opus' })
  const reviewY = await spawn($, 'review:y', { model: 'sonnet' })
  await end($, draftX, 'claude-opus-5-5')
  await end($, reviewX, 'claude-opus-5-5')
  await end($, draftY, 'claude-opus-5-5')
  await end($, reviewY, 'claude-sonnet-5-5')
  await w.flush()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const same = await ui.findAll({ type: 'Text', text: 'same model as the work' })
    const different = await ui.findAll({ type: 'Text', text: 'different model from the work' })
    expect(same.length).toBe(1)
    expect(different.length).toBe(1)
    await ui.unmount()
  }
})

test('a review with no paired work is checked against the base session', async ($, on) => {
  const w = world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await w.flush()
  const same = await spawn($, 'review:base')
  const other = await spawn($, 'verify:base2', { model: 'sonnet' })
  await end($, same, 'claude-fable-5')
  await end($, other, 'claude-sonnet-5-5')
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.findAll({ type: 'Text', text: 'same model as the base session' })).toHaveLength(
      1,
    )
    expect(
      await ui.findAll({ type: 'Text', text: 'different model from the base session' }),
    ).toHaveLength(1)
    expect(await ui.find({ type: 'Text', text: /^Limits of the check/ })).toBeDefined()
    await ui.unmount()
  }
})

test('reviews pair with work only inside the same workflow run', async ($, on) => {
  const w = world(on)
  const a = await spawn($, 'build:z', { model: 'opus', workflowRunId: 'wf_1' })
  const b = await spawn($, 'verify:z', { model: 'opus', workflowRunId: 'wf_2' })
  await end($, a, 'claude-opus-5-5')
  await end($, b, 'claude-opus-5-5')
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: 'same model as the work' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'same model as the base session' })).toBeUndefined()
    expect(
      await ui.find({ type: 'Text', text: 'no paired work found: independence not checked' }),
    ).toBeDefined()
    await ui.unmount()
  }
})

test("a log line per agent and turn, in this session's own file, with no description or prompt", async ($, on) => {
  const w = world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const id = await spawn($, `build:log ${PRIVATE}`, { model: 'sonnet' })
  await end($, id, 'claude-sonnet-5-5')
  await end($, undefined, 'claude-fable-5')
  await w.flush()

  const text = w.files.get(LOG) ?? ''
  for (const hidden of [SECRET, 'second line', PRIVATE]) {
    expect(text).not.toContain(hidden)
    expect(JSON.stringify([...w.store.entries()])).not.toContain(hidden)
  }
  const lines = linesOf(text)
  expect(lines.length).toBe(2)
  expect(Object.keys(lines[0] ?? {}).sort()).toEqual(
    [
      'agentId',
      'cacheReadTokens',
      'cacheWriteTokens',
      'durationMs',
      'effort',
      'inputTokens',
      'kind',
      'model',
      'outputTokens',
      'seat',
      'sessionId',
      'stage',
      'status',
      'time',
    ].sort(),
  )
  expect(lines[0]).toMatchObject({
    kind: 'agent',
    agentId: id,
    stage: 'build',
    seat: 'general-purpose',
    model: 'claude-sonnet-5-5',
    effort: 'inherits',
    status: 'done',
    sessionId: 'sess-1',
    inputTokens: 100,
    outputTokens: 20,
    cacheReadTokens: 300,
    cacheWriteTokens: 4,
  })
  expect(lines[1]).toMatchObject({ kind: 'turn', seat: 'main', model: 'claude-fable-5' })

  const exported = await $.command.run({ ...COMMAND, args: 'export' })
  const exportFile = [...w.files.keys()].find(path => path.includes('/export-'))
  expect(exported.text).toContain(`${DIR}/export-sess-1-`)
  expect(exportFile).toBeDefined()
  for (const hidden of [SECRET, PRIVATE]) {
    expect(w.files.get(exportFile ?? '')).not.toContain(hidden)
  }

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(
      await ui.find({ type: 'Text', text: `Usage log for this session: ${LOG}` }),
    ).toBeDefined()
    // The screen may show the description.
    expect(await ui.find({ key: `row-${id}`, text: PRIVATE })).toBeDefined()
    await ui.unmount()
  }
})

test('with logLabels on, the label is logged and exported', { options: { logLabels: true } }, async ($, on) => {
  const w = world(on)
  const id = await spawn($, `build:log ${PRIVATE}`)
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  expect(linesOf(w.files.get(LOG))[0]).toMatchObject({ label: `build:log ${PRIVATE}` })
  await w.clock.advance(1100)
  await w.flush()
  const live = JSON.parse(w.files.get(LIVE) ?? '{}') as { agents: Record<string, unknown>[] }
  expect(live.agents[0]).toMatchObject({ label: `build:log ${PRIVATE}` })
  expect(JSON.stringify(live)).not.toContain(SECRET)
  await $.command.run({ ...COMMAND, args: 'export' })
  const exportFile = [...w.files.keys()].find(path => path.includes('/export-'))
  expect(w.files.get(exportFile ?? '')).toContain(PRIVATE)
  expect(w.files.get(exportFile ?? '')).not.toContain(SECRET)
})

test('tool.call, agent.spawn, turn.start, turn.complete and Stop pass through unchanged', async ($, on) => {
  // The engine's answers for this test, registered ahead of the world's own.
  on('tool.call', () => ({ result: { marker: 'tool-result' }, text: 'tool text' }))
  on('agent.spawn', { description: 'pass' }, () => ({
    model: 'claude-opus-5-5',
    agentId: 'agent-pass',
    teammateId: 'pass@team',
  }))
  on('agent.spawn', { description: 'denied' }, () => ({ deny: 'no room' }))
  on('turn.complete', { turnId: 'turn-x' }, () => ({ text: 'the report' }))
  on('classic.Stop', { stop_hook_active: true }, () => ({ additionalContext: ['kept'] }))
  world(on)
  const tool = await $.tool.call({ tool: 'Agent', description: 'p', prompt: 'q', effort: 'low' })
  expect(tool).toMatchObject({ result: { marker: 'tool-result' }, text: 'tool text' })

  const started = await $.agent.spawn({
    tool_use_id: 'c1',
    prompt: 'p',
    description: 'pass',
    subagentType: 'general-purpose',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
  })
  expect(started).toEqual({
    model: 'claude-opus-5-5',
    agentId: 'agent-pass',
    teammateId: 'pass@team',
  })

  const denied = await $.agent.spawn({
    tool_use_id: 'c2',
    prompt: 'p',
    description: 'denied',
    subagentType: 'general-purpose',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
  })
  expect(denied).toEqual({ deny: 'no room' })

  const begun = await $.turn.start({ text: 'hi', turnId: 'turn-9' })
  expect(begun).toEqual({ turnId: 'turn-9' })

  const ended = await $.turn.complete({
    agentId: 'agent-pass',
    answer: 'the report',
    durationMs: 5,
    isAborted: false,
    turnId: 'turn-x',
    reason: 'answer',
  })
  expect(ended.text).toBe('the report')

  const stop = await $.classic.Stop({ stop_hook_active: true, effort: { level: 'low' } })
  expect(stop).toEqual({ additionalContext: ['kept'] })
})

test('next resolves before the log is written', async ($, on) => {
  const w = world(on)
  const id = await spawn($, 'build:o')
  await w.flush()
  w.order.length = 0
  await end($, id, 'claude-opus-5-5')
  expect(w.order).toEqual(['core'])
  await w.flush()
  expect(w.order).toEqual(['core', 'fs.write'])
})

test('a throwing fs and store leave the session unharmed, and the footer says so', async ($, on) => {
  on('turn.complete', { turnId: 'turn-kept' }, () => ({ text: 'kept' }))
  const w = world(on, { failWrites: true, failStore: true })
  const id = await spawn($, 'build:f')
  const ended = await $.turn.complete({
    agentId: id,
    answer: '',
    durationMs: 5,
    isAborted: false,
    turnId: 'turn-kept',
    reason: 'answer',
  })
  expect(ended.text).toBe('kept')
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('done')
    // The kit skips a test hook that throws and the call then rejects with
    // its own reason; the footer names the failed write and that reason.
    expect((await ui.find({ type: 'Text', text: /^Last write failed at 20/ }))?.text).toMatch(
      /the (usage log|live snapshot) could not be written \(.+\)\.$/,
    )
    await ui.unmount()
  }
})

test("two sessions do not lose each other's totals", async ($, on) => {
  const opus = { input: 1000, output: 0, cacheRead: 0, cacheWrite: 0 }
  const zero = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  const other = {
    byTier: { Fable: zero, Opus: opus, Sonnet: zero, Haiku: zero, other: zero },
    agents: 1,
    turns: 0,
    since: '2026-01-01T00:00:00.000Z',
  }
  const w = world(on, { store: { 'session:other': other } })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const id = await spawn($, 'build:a')
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  // Another session writes its own entry while this one runs.
  w.store.set('session:third', { ...other, agents: 2 })
  await end($, undefined, 'claude-opus-5-5')
  await w.flush()

  expect(w.store.get('session:other')).toEqual(other)
  expect(w.store.get('session:third')).toMatchObject({ agents: 2 })
  expect(w.store.get('session:sess-1')).toMatchObject({ agents: 1, turns: 1 })

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await w.flush()
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /in all sessions/ }))?.text).toContain(
      '4 agents and 1 main turn in all sessions since 2026-01-01T00:00:00.000Z',
    )
    await ui.unmount()
  }
})

test('a row whose end never comes is marked stale and stops the ticks', async ($, on) => {
  let ticks = 0
  on('state.set', (_, e, next) => {
    if (e.key === 'tick') ticks++
    return next(e)
  })
  const w = world(on)
  const id = await spawn($, 'never ends')
  await w.flush()
  await w.clock.advance(31 * 60_000)
  await w.flush()
  const settled = ticks
  await w.clock.advance(60_000)
  await w.flush()
  expect(ticks).toBe(settled)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('stale')
    expect(
      await ui.find({ type: 'Text', text: /Running for over 30 minutes with no update/ }),
    ).toBeDefined()
    // It still counts as running until it ends.
    expect(await ui.find({ type: 'Text', text: /Agents: 1 running, 0 finished/ })).toBeDefined()
    await ui.unmount()
  }
  // A late end still settles it.
  await end($, id, 'claude-opus-5-5')
  await w.flush()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: `row-${id}` }))?.text).toContain('done')
  await ui.unmount()
})

test('the timer never doubles and does not tick while nothing runs', async ($, on) => {
  let ticks = 0
  on('state.set', (_, e, next) => {
    if (e.key === 'tick') ticks++
    return next(e)
  })
  const w = world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await w.flush()
  await w.clock.advance(20_000)
  await w.flush()
  expect(ticks).toBe(0)
  await spawn($, 'runs')
  await w.flush()
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await w.flush()
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await w.flush()
  await w.clock.advance(20_000)
  await w.flush()
  expect(ticks).toBe(4)
})

test('a large log rotates into a numbered file', async ($, on) => {
  const w = world(on)
  const big = `${'x'.repeat(2 * 1024 * 1024 + 10)}\n`
  w.files.set(LOG, big)
  await end($, undefined, 'claude-fable-5')
  await w.flush()
  expect(w.files.get(LOG.replace(/\.jsonl$/, '.1.jsonl'))).toBe(big)
  expect(linesOf(w.files.get(LOG))).toHaveLength(1)
})

test('a log too large to read is left whole and the lines go on in a new file', async ($, on) => {
  const w = world(on, { sizes: { [LOG]: 5 * 1024 * 1024 } })
  w.files.set(LOG, 'old\n')
  await end($, undefined, 'claude-fable-5')
  await w.flush()
  expect(w.files.get(LOG)).toBe('old\n')
  const next = [...w.files.keys()].find(path => path.startsWith(`${DIR}/usage-sess-1-`))
  expect(linesOf(w.files.get(next ?? ''))).toHaveLength(1)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^Last write failed/ }))?.text).toContain(
    'too large to read',
  )
  expect(
    await ui.find({ type: 'Text', text: `Usage log for this session: ${next ?? ''}` }),
  ).toBeDefined()
  await ui.unmount()
})

test('the command opens the pane', async ($, on) => {
  world(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const opened = await $.command.run({ ...COMMAND, args: '' })
  expect(opened.text).toBe('Orchestration pane opened.')
})

test('values an older version stored do not throw', async ($, on) => {
  // A state backend holding what earlier code wrote, under old and current tags.
  const old: Record<string, unknown> = {
    agents: { shape: 'agents-2', value: [{ id: 'old-1', status: 'weird', tokens: 'many' }, 7] },
    main: { shape: 'main-1', value: { turns: 'lots' } },
    totals: { shape: 'totals-1', value: { byTier: 'nope', agents: -3 } },
    allTime: [1, 2, 3],
    lastWriteFailure: { shape: 'failure-1', value: 'boom' },
    showFinished: 'yes',
    expanded: 42,
    tick: 'later',
    logPath: 5,
  }
  const versions: Record<string, number> = {}
  on('state.get', (_, e) => ({
    value: { value: old[e.key], version: versions[e.key] ?? (e.key in old ? 1 : 0) },
  }))
  on('state.set', (_, e) => {
    old[e.key] = e.value
    versions[e.key] = (versions[e.key] ?? 1) + 1
    return { value: { isSet: true, version: versions[e.key] ?? 2 } }
  })
  const w = world(on, {
    store: {
      'all-time-totals': { byTier: { Opus: { input: 'x' } }, turns: null },
      'session:x': 9,
    },
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const id = await spawn($, 'draft:old', { model: 'opus' })
  await end($, id, 'claude-opus-5-5')
  await w.flush()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ key: 'row-old-1' })).toBeDefined()
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('done')
    expect((await ui.find({ type: 'Text', text: /^Opus:/ }))?.text).toBe(
      'Opus: in 100, out 20, cache read 300, cache write 4',
    )
    await ui.unmount()
  }
})

test('the pane draws on vscode and mobile too', async ($, on) => {
  const w = world(on)
  await spawn($, 'draft:m')
  await w.flush()
  for (const surface of ['vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /Agents: 1 running/ })).toBeDefined()
    await ui.unmount()
  }
})

type Snapshot = {
  schema: number
  writtenAt: string
  sessionId: string
  logPath: string
  logLabels: boolean
  lastWriteFailure: { target: string } | null
  base: Record<string, unknown>
  agents: Record<string, unknown>[]
  totals: {
    session: { byTier: Record<string, unknown>; overall: unknown; agents: number }
    allSessions: { overall: unknown }
  }
}

test('the live snapshot is written at start, then after a spawn and a completion', async ($, on) => {
  const w = world(on)
  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  await w.flush()
  const first = JSON.parse(w.files.get(LIVE) ?? '{}') as Snapshot
  expect(first).toMatchObject({ schema: 1, sessionId: 'sess-1', agents: [] })
  expect(first.base).toMatchObject({ model: 'claude-fable-5', status: 'idle' })

  const draft = await spawn($, `draft:x ${PRIVATE}`, { model: 'opus' })
  const review = await spawn($, `review:x ${PRIVATE}`, { model: 'opus' })
  await end($, draft, 'claude-opus-5-5')
  await end($, review, 'claude-opus-5-5', 'error')
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()

  const text = w.files.get(LIVE) ?? ''
  for (const hidden of [SECRET, 'second line', PRIVATE]) expect(text).not.toContain(hidden)
  const live = JSON.parse(text) as Snapshot
  expect(live.logPath).toBe(LOG)
  expect(live.logLabels).toBe(false)
  expect(live.lastWriteFailure).toBeNull()
  expect(live.agents).toHaveLength(2)
  for (const row of live.agents) expect(Object.keys(row)).not.toContain('label')
  expect(live.agents[0]).toMatchObject({
    agentId: draft,
    stage: 'draft',
    seat: 'general-purpose',
    askedModel: 'opus',
    askedEffort: null,
    ranModel: 'claude-opus-5-5',
    status: 'done',
    tokens: { input: 100, output: 20, cacheRead: 300, cacheWrite: 4 },
    workflowRunId: null,
    check: null,
  })
  expect(live.agents[1]).toMatchObject({
    agentId: review,
    stage: 'review',
    status: 'failed',
    check: { flag: 'same', against: 'work', reason: 'same model as the work' },
  })
  expect(live.totals.session.byTier.Opus).toEqual({
    input: 200,
    output: 40,
    cacheRead: 600,
    cacheWrite: 8,
  })
  expect(live.totals.session.agents).toBe(2)
  expect(live.totals.allSessions.overall).toEqual({
    input: 200,
    output: 40,
    cacheRead: 600,
    cacheWrite: 8,
  })
})

test('snapshot writes are coalesced to about one per second', async ($, on) => {
  let liveWrites = 0
  on('fs.write', { path: LIVE }, (_, e, next) => {
    liveWrites++
    return next(e)
  })
  const w = world(on)
  for (let i = 0; i < 6; i++) await spawn($, `draft:${i}`)
  await w.flush()
  expect(liveWrites).toBeLessThanOrEqual(2)
  await w.clock.advance(1100)
  await w.flush()
  const live = JSON.parse(w.files.get(LIVE) ?? '{}') as Snapshot
  expect(live.agents).toHaveLength(6)
})

test('a failing snapshot write leaves the session unharmed and says so', async ($, on) => {
  on('turn.complete', { turnId: 'turn-snap' }, () => ({ text: 'kept' }))
  const w = world(on, { failPaths: /live-/ })
  const id = await spawn($, 'build:snap')
  const ended = await $.turn.complete({
    agentId: id,
    answer: '',
    durationMs: 5,
    isAborted: false,
    turnId: 'turn-snap',
    reason: 'answer',
  })
  expect(ended.text).toBe('kept')
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()
  expect(linesOf(w.files.get(LOG))).toHaveLength(1)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ key: `row-${id}` }))?.text).toContain('done')
    expect((await ui.find({ type: 'Text', text: /^Last write failed/ }))?.text).toContain(
      'the live snapshot could not be written',
    )
    await ui.unmount()
  }
})

test('a review whose work was an unlabelled agent is not flagged, only marked unpaired', async ($, on) => {
  const w = world(on)
  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  const build = await spawn($, 'build the parser')
  const review = await spawn($, 'review:parser')
  await end($, build, 'claude-fable-5')
  await end($, review, 'claude-fable-5')
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()
  const live = JSON.parse(w.files.get(LIVE) ?? '{}') as Snapshot
  expect(live.agents.find(a => a.agentId === review)).toMatchObject({
    check: { flag: 'unpaired', against: 'none', reason: 'no paired work found: independence not checked' },
  })
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /^same model as/ })).toBeUndefined()
    expect(
      await ui.find({ type: 'Text', text: 'no paired work found: independence not checked' }),
    ).toBeDefined()
    await ui.unmount()
  }
})

test("a teammate's role is written as teammate unless logLabels is on", async ($, on) => {
  const w = world(on)
  const started = await $.agent.spawn({
    tool_use_id: 'c-mate',
    prompt: 'p',
    description: 'helper',
    subagentType: `role for ${PRIVATE}`,
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
    isTeammate: true,
  })
  await end($, started.agentId, 'claude-opus-5-5')
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()
  await $.command.run({ ...COMMAND, args: 'export' })
  const exportFile = [...w.files.keys()].find(path => path.includes('/export-'))
  for (const text of [w.files.get(LOG), w.files.get(LIVE), w.files.get(exportFile ?? '')]) {
    expect(text).toBeDefined()
    expect(text).not.toContain(PRIVATE)
    expect(text).toMatch(/"seat": ?"teammate"/)
  }
  expect(linesOf(w.files.get(LOG))[0]).toMatchObject({ seat: 'teammate' })
})

test("with logLabels on, a teammate's role is written", { options: { logLabels: true } }, async ($, on) => {
  const w = world(on)
  const started = await $.agent.spawn({
    tool_use_id: 'c-mate',
    prompt: 'p',
    description: 'helper',
    subagentType: 'researcher',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-fable-5',
    background: true,
    fork: false,
    isTeammate: true,
  })
  await end($, started.agentId, 'claude-opus-5-5')
  await w.flush()
  expect(linesOf(w.files.get(LOG))[0]).toMatchObject({ seat: 'researcher', label: 'helper' })
})

test('the snapshot keeps being written while only the base turn runs', async ($, on) => {
  let liveWrites = 0
  on('fs.write', { path: LIVE }, (_, e, next) => {
    liveWrites++
    return next(e)
  })
  const w = world(on)
  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  await w.flush()
  await $.turn.start({ text: 'a long one', turnId: 'main-1' })
  await w.flush()
  const before = liveWrites
  await w.clock.advance(30_000)
  await w.flush()
  expect(liveWrites - before).toBeGreaterThanOrEqual(5)
  const live = JSON.parse(w.files.get(LIVE) ?? '{}') as Snapshot
  expect(live.base).toMatchObject({ status: 'running' })
  expect(Date.parse(live.writtenAt)).toBeGreaterThan(w.clock.now() - 6000)
  // The turn ends: the ticks stop.
  await end($, undefined, 'claude-fable-5')
  await w.flush()
  await w.clock.advance(10_000)
  await w.flush()
  const settled = liveWrites
  await w.clock.advance(30_000)
  await w.flush()
  expect(liveWrites).toBe(settled)
})

test('a hung write does not hold the queue for good', async ($, on) => {
  let hung = false
  let late: World | undefined
  on('fs.write', { path: LOG }, async (_, e, next) => {
    if (!hung && late !== undefined) {
      hung = true
      await late.clock.sleep(10 * 60_000)
    }
    return next(e)
  })
  const w = world(on)
  late = w
  await end($, undefined, 'claude-fable-5')
  await w.flush()
  await end($, undefined, 'claude-fable-5')
  await w.flush()
  expect(w.files.get(LOG)).toBeUndefined()
  await w.clock.advance(10_001)
  await w.flush()
  expect(linesOf(w.files.get(LOG))).toHaveLength(1)
})

test('an end that comes before its spawn is logged with what the spawn knew', async ($, on) => {
  const w = world(on)
  // The engine will answer the spawn with id a1; its end arrives first.
  await end($, 'a1', 'claude-opus-5-5')
  await w.flush()
  await spawn($, 'review:early', { model: 'opus' })
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()
  expect(linesOf(w.files.get(LOG))[0]).toMatchObject({
    agentId: 'a1',
    stage: 'review',
    seat: 'general-purpose',
    status: 'done',
  })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'row-a1' }))?.text).toContain('done')
  expect((await ui.find({ key: 'row-a1' }))?.text).toContain('review:early')
  await ui.unmount()
})

test('an end with no spawn at all is logged with seat unknown', async ($, on) => {
  const w = world(on)
  await end($, 'ghost', 'claude-haiku-4-5')
  await w.flush()
  await w.clock.advance(1100)
  await w.flush()
  expect(linesOf(w.files.get(LOG))[0]).toMatchObject({ agentId: 'ghost', seat: 'unknown' })
})

test('session end marks the snapshot ended', async ($, on) => {
  const w = world(on)
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  await $.session.start({ cwd: '/', surface: null, isInteractive: false })
  await w.flush()
  await $.session.end({ reason: 'other', sessionId: 'sess-1', resume: { id: 'sess-1' } })
  await w.flush()
  const live = JSON.parse(w.files.get(LIVE) ?? '{}') as Snapshot & { ended: { reason: string } }
  expect(live.ended).toMatchObject({ reason: 'other' })
})

test('base tokens read not reported when no turn reported usage', async ($, on) => {
  const w = world(on)
  await end($, undefined, undefined)
  await w.flush()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^Model / }))?.text).toContain('tokens not reported')
  await ui.unmount()
})
