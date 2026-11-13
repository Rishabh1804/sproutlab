// The $.state contract of the orchestration mod: every value it keeps for
// the session, declared under the mod's name. Any plugin can read $.state,
// so nothing here holds a prompt's text.

/** The four token counts as the engine reports them (ModelUsage). */
export type OrchestrationTokens = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

/** The model tiers usage is summed under. */
export type OrchestrationTier = 'Fable' | 'Opus' | 'Sonnet' | 'Haiku' | 'other'

/**
 * `stale`: no end was reported within the stale limit after its last turn
 * began; it stops driving redraws, and a late end still settles it.
 */
export type OrchestrationStatus = 'running' | 'done' | 'failed' | 'stale'

/** One agent the session spawned: a subagent, a teammate or a workflow agent. */
export type OrchestrationAgent = {
  /** The agent id `agent.spawn` answered, or a minted one when it gave none. */
  id: string
  /** The Agent call's description, else its name, else the seat. Shown on screen. */
  label: string
  /** The recognised stage word before a colon (`draft`, `review`, ...), else ''. */
  stage: string
  /** The agent type it was spawned as (`subagentType`). */
  seat: string
  /** The model the call asked for; null when none was stated (inherits). */
  askedModel: string | null
  /** The effort the Agent call asked for; null when none was stated. */
  askedEffort: string | null
  /** The effort a SubagentStop event reported it ran at; null when none did. */
  ranEffort: string | null
  /** The model `agent.spawn` answered it starts on. */
  resolvedModel: string | null
  /** The model its last reported turn ran on (TurnUsage.model). */
  ranModel: string | null
  /** The parent's model, what `inherits` resolves to. */
  parentModel: string | null
  status: OrchestrationStatus
  /** Why its last turn ended (`answer`, `aborted`, `error`, `refusal`). */
  endReason: string | null
  startedAt: number
  /** When it last started a turn: what the stale limit counts from. */
  activeAt: number
  endedAt: number | null
  /** Its turns' token counts summed; null while none was reported. */
  tokens: OrchestrationTokens | null
  /** How many of its turns ended; how many of them reported usage. */
  turns: number
  reportedTurns: number
  /** Whether it has been counted once in the agent counts (never twice). */
  counted: boolean
  workflowRunId: string | null
  workflowIndex: number | null
  isTeammate: boolean
}

/** The base session's main loop. */
export type OrchestrationMain = {
  model: string | null
  /** The effort a Stop event last reported; null when none did. */
  effort: string | null
  status: 'idle' | 'running'
  /** When this mod first saw the session, and when the current turn began. */
  firstSeenAt: number
  turnStartedAt: number | null
  lastTurnMs: number | null
  tokens: OrchestrationTokens
  turns: number
  /** Main-loop turns that ended with no usage reported. */
  unreportedTurns: number
}

/** Tokens per tier, with how many agents and turns they came from. */
export type OrchestrationTotals = {
  byTier: Record<OrchestrationTier, OrchestrationTokens>
  agents: number
  turns: number
  /** ISO time the count started from. */
  since: string | null
}

/** The last write of the mod's that failed, in plain words, with its time. */
export type OrchestrationWriteFailure = {
  /** ISO time of the failure. */
  at: string
  /** What was being written: `usage log`, `totals store` or `export`. */
  target: string
  /** The error's own message. */
  reason: string
}

declare module 'claude-code' {
  interface PluginState {
    orchestration: {
      agents: Shaped<OrchestrationAgent[]>
      main: Shaped<OrchestrationMain>
      totals: Shaped<OrchestrationTotals>
      allTime: Shaped<OrchestrationTotals>
      lastWriteFailure: Shaped<OrchestrationWriteFailure | null>
      showFinished: boolean
      expanded: string | null
      tick: number
      logPath: string
    }
  }
}
