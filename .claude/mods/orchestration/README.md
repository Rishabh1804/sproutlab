# Orchestration mod

A Claude Code mod that shows multi-agent orchestration as it happens and records token usage.
Built 13 Nov 2026 at the Architect's direction, on the working table ruled that day:
the base session (Fable, medium) briefed it, Opus built and folded it, and Fable reviewed it twice.

## What it does

- **Watches** every subagent and workflow agent the session spawns: seat, stage word, model and
  effort asked for and actually run, status, elapsed time, and the token counts the engine reports.
- **Checks independence:** a review that ran on the same model as the work it is paired with is
  marked. Pairing goes by label prefix (`draft:x`, `build:x`, `fold:x` are work; `review:x`,
  `verify:x`, `edict-v:x` are reviews). A review with no pair reads "independence not checked".
  Label your agents this way and the check is useful; leave them unlabelled and it stays silent.
- **Records** one JSON line per finished agent and per base-session turn in
  `~/.claude/orchestration/usage-<session id>.jsonl`, and keeps totals across sessions.
- **Shows** it two ways: a pane (`/orchestration`) where the client can draw one, and a web page
  for sessions that cannot (a cloud session has no pane surface).

## What it never records

Prompt text, file content and tool output are never written. An agent's description and a
teammate's free-text role are written only when the `logLabels` option is switched on; it is off
by default. Token counts are the engine's own; an agent whose usage was not reported shows
"not reported", never an estimate. The page shows tokens, not cost: cache reads are billed at a
fraction of fresh input, so they are shown apart from the input-plus-output headline.

## Running it

Load the mod for a session:

```bash
claude --plugin-dir .claude/mods/orchestration
```

Where no flag can be given, name the folder's absolute path in `CLAUDE_CODE_PLUGIN_DIRS`.

Start the web page (Node built-ins only, read-only, loopback only):

```bash
node .claude/mods/orchestration/surface/server.mjs --port 4319
```

It prints the address it listens on. It answers only to `127.0.0.1`, `localhost` and `[::1]`;
to reach it through a proxy that sends another Host name, add `--allow-host <name>` (each refused
name is printed once).

Check it after any change:

```bash
claude plugin validate .claude/mods/orchestration
```

```bash
claude plugin test .claude/mods/orchestration
```

## Known limits

- A workflow agent's phase name is not exposed by the engine, so phases are not matched.
- A turn that ran on more than one model is counted under its last model.
- Old rotated log files cannot be deleted (the engine offers no delete); the log is capped at three
  files by overwriting. The snapshot write cannot be made atomic (no rename); the server keeps the
  last snapshot that parsed.
- Two sessions writing the cross-session totals at the same instant could lose one update.
- The footer's "last write failed" notice stays on show after a later write succeeds.
- Not yet wired into the session-start hook: a session loads it only when started as above.
