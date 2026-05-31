# Companion Subagent Auto-Load

The five seated Companions (`lyra`, `maren`, `kael`, `vela`, `cipher`) plus the
four scribes must be available as `subagent_type` values in every SproutLab
session. When they are not, summoning `maren` fails with *"Agent type 'maren'
not found"* and the work falls back to general-purpose agents wearing the
persona by hand — losing the canon-cc-022 separable-artifact guarantee.

## What was broken

The harness discovers subagents at session start from **`<cwd>/.claude/agents`**
(and re-reads dynamically). In a multi-repo web session the cwd is the *parent*
of the repos (e.g. `/home/user`, repos at `/home/user/sproutlab`) and `HOME` is
`/root`. The old `session-start.sh` hook:

1. **read the wrong source** — `$HOME/sproutlab` = `/root/sproutlab`, which does not exist;
2. **wrote to the wrong target** — `$HOME/.claude/agents` = `/root/.claude/agents`, which is **not** the cwd discovery dir;
3. **often did not run at all** — registered only in `sproutlab/.claude/settings.json`, which the harness does not read when cwd is the parent dir.

Net effect: `/home/user/.claude/agents` stayed empty and the Companions were unavailable.

## The fix (this branch)

`.claude/hooks/session-start.sh` was rewritten to:
- **resolve the repo robustly** — from the hook's own `BASH_SOURCE` location, then `$CLAUDE_PROJECT_DIR`, then known paths — never a hardcoded `$HOME`;
- **materialize into every real discovery dir** — the stdin `cwd`, `$HOME`, `/home/user`, `$CLAUDE_PROJECT_DIR`, `pwd` — so the harness finds the specs wherever it looks;
- **never write into a source repo's own tree** — skips the sproutlab + Codex roots as targets, so the tracked mirror is never overwritten and Codex-only specs (`chronicler`/`consul`) never leak into it;
- run **synchronously** (not async) so materialization completes before discovery — async would re-introduce the race.

Validated: after the hook runs, `/home/user/.claude/agents` holds all 11 specs and `subagent_type: maren` resolves (returned `MAREN-PROBE-OK` live).

## Guaranteeing it runs (multi-repo)

For single-repo sessions the repo's `.claude/settings.json` SessionStart hook
fires normally. For **multi-repo** sessions (cwd above the repos) the most
reliable guarantee is to call the same script from the **environment setup
script** (Settings → environment → setup), which runs before the harness:

```bash
bash /home/user/sproutlab/.claude/hooks/session-start.sh < /dev/null
```

The script is idempotent and tolerates no stdin, so it is safe to run there and
again as a SessionStart hook. Once merged to the default branch, every future
session picks up the corrected hook.
