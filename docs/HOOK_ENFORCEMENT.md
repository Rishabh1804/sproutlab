# Hook Enforcement — SproutLab

Rules in `CLAUDE.md` / `AGENTS.md` are *prose an agent may follow*. The hooks
below are *gates that actually block*. Two layers: **git hooks** (block bad
commits/pushes) and **Claude Code hooks** (block bad agent actions).

> There is intentionally **no `.clauderules` file** — Claude Code reads
> `CLAUDE.md`, not `.clauderules`; a third rules file would be inert and would
> drift from the canon. Enforcement lives in hooks, not in a prose file.

## Activation

Git hooks are dormant until `core.hooksPath` points at `.githooks`. This is now
**automatic**: `.claude/hooks/session-start.sh` runs
`git config core.hooksPath .githooks` at the start of every Claude Code session
(local and remote). For a plain terminal with no Claude session, activate once
per clone:

```bash
git config core.hooksPath .githooks
```

## What is enforced

### git: `.githooks/pre-commit` — fast universal HR audits (blocking)
Runs on every commit; blocks on any violation:
- `audit-emoji.sh` — **HR-1** (no emoji)
- `audit-hr12-v3-3.sh` — **HR-12** (timezone-safe date construction)
- `audit-icon-text.sh` — icon/text integrity

Heavier, feature-specific audits (food-effects-sync, card-priority, chip-
taxonomy, …) stay at build time (`build.sh`), where they have full context.

Bypass (emergency only): `git commit --no-verify`.

### git: `.githooks/pre-push` — bundle-sync + integrity (blocking, non-mutating)
- **Stale-bundle:** if a *bundled* `split/` source (the `.js` modules + `styles.css` + `template.html`) changed in the pushed range but root `index.html` was not rebuilt in that range, the push is blocked — the deployed bundle would be stale. Fix: `pnpm build`, commit the rebuilt `index.html`/`sproutlab.html`, re-push.
- **Integrity:** blocks if root `index.html` is not `<!DOCTYPE html>` … `</html>` and > 100 KB.

It never runs `build.sh` (which would bump `manifest.json` + regenerate docs) — it only inspects git, so it cannot mutate your tree.

Bypass: `git push --no-verify`.

### Claude Code: `.claude/settings.json` PreToolUse guards (blocking, fail-open)
- `guard-bash.sh` (matcher `Bash`) — blocks `build.sh … 2>&1` (the PR #118 STDERR-leak class) and raw-`cat` bundle assembly.
- `guard-edit.sh` (matcher `Edit|Write`) — blocks hand-edits to the build outputs `index.html` / `sproutlab.html` (edit `split/` + rebuild instead).

**Fail-open by design:** any parse error or unexpected input exits 0 (allow). A guard bug must never brick the agent — enforcement degrades to "no enforcement", never to "everything blocked".

## Design notes
- The pre-commit/pre-push scan the working tree / git ranges, not just the staged set — consistent with the existing emoji gate.
- Guards block the *documented* "never do this" rules only; they are deliberately narrow to avoid false positives on legitimate commands.
