# Session Handoff — SproutLab

**Date:** 2026-05-22 (PM session — doctrine + shipping)
**Builder:** Lyra (The Weaver)
**Companions consulted (Mode-1 subagents):** Maren ×3 audits, Kael ×3 audits, Cipher ×3 final-passes
**End state:** `main` at `c89a1a5` — clean, all session work merged and pushed.

---

## What shipped — 7 PRs merged

| PR | Title | Substance |
|----|-------|-----------|
| #100 | Fix 6 stale `#statusStrip` smoke tests | Tests reflected pre-collapse-when-empty state; repointed for current collapsed-by-default behavior. |
| #101 | HR-2/HR-3 cleanup of the Diet panel | Static `template.html` Diet inputs — 13 inline handlers + 5 inline-style blocks → `wireDietPanelEvents()` + token-driven CSS classes. **First PR to run the canon-cc-008 chain.** |
| #102 | QA-chain pre-merge gate + Vercel config | Codified canon-cc-008 as a *binding* pre-merge gate (`CLAUDE.md §QA Chain`, `docs/QA_GATE_SPEC.md` Gate 2.5, `AGENTS.md` rule 9, `Memory.md`). Added `vercel.json` enabling per-PR preview deploys — Gate 3 (visual check) now runnable pre-merge. |
| #103 | invocation.md — Companion invocation reference | New operational doc for summoning the roster: canon-cc-022 artifact test, per-Companion modes + brief shape, Scribe Worker Tier, canon-cc-008 invocation sequence, routing quick reference. Cross-model invocation explicitly deferred. |
| #105 | Move invocation.md to repo root | Relocated next to `CLAUDE.md` / `Memory.md` / `PERSONA_REGISTRY.md` — invocation.md is identity/policy, not docs/-tier reference material. |
| #106 | HR-3 cleanup of combo-card compound onclicks | Resolved #104: 5 combo-card inline `onclick=` sites converted to `data-action` delegation, with three new dispatcher branches in `core.js` — `applyComboQuery`, `showComboHistory`, `openFeedingDay`. |
| #108 | escHtml escapes `"` — close F-35-1 doctrine corner | Resolved #107: extended `escHtml` to escape `"` → `&quot;`. Closes the latent `data-arg` attribute-breakout across **every** `data-arg` site in the codebase. Incidentally also fixes pre-existing latent `"`-breakouts at three `title="${escHtml(...)}"` callers and the legacy ql-freq-pill inline `onclick=`. F-35-1 regression guard extended to `diet.js`; new V-K-14 guard locks in the `"` coverage. |

All `split/` PRs (#101, #106, #108) cleared the full canon-cc-008 chain — Maren + Kael in parallel → Lyra synthesis → Cipher Edict V — and merged with explicit verdicts in the PR description.

## Process firsts this session

- **First operational canon-cc-008 chain runs.** PRs #99 / #100 / #101 had shipped without the gate (only `/code-review` skill was run). The lapse was caught mid-#101 and codified in #102 as a binding pre-merge gate. Three full chains then ran cleanly in this session.
- **Vercel preview deploys live.** Every PR now receives a preview URL via the `vercel[bot]` PR comment. The `vercel.json` no-ops Vercel's build/install (SproutLab ships a pre-built `index.html`) and sets `Cache-Control` headers preserving the canon-0034 sw.js / HTML shell freshness rules.
- **`invocation.md`** — single operational reference for the Companion roster, deployed at repo root.

## Issues opened and closed

| # | Title | State | Origin |
|---|-------|-------|--------|
| #104 | HR-3 follow-up: diet.js-rendered combo-chip / combo-history onclick handlers | **Closed by #106** | Kael V-K-2 (audit of #101) |
| #107 | F-35-1 doctrine: data-arg quote-safety + regression-guard coverage | **Closed by #108** | Kael V-K-14 + Maren note (audit of #106) |
| #109 | HR-3 follow-up: diet.js ql-freq-pill + intelligence-quicklog sister inline-onclick | **Open** | Maren V-M-19 (audit of #108) |
| #110 | HR-4 follow-up: CareTicket title double-escape (Notification.body + Today So Far) | **Open** | Kael V-K-15 + V-K-16 (audit of #108) |
| #111 | F-35-1 coverage: convert medical.js escAttr→escHtml + extend regression guard | **Open** | Maren V-M-20 (audit of #108) |

All three open follow-ups are **pre-existing latent debt**, not regressions introduced by this session's work.

## Doctrine changes landed

- **canon-cc-008 QA chain** — now a *binding* pre-merge gate, not descriptive prose. Every `split/` Capital change must run: build & self-check → Maren / Kael Governor audits (parallel, routed by jurisdiction) → Lyra synthesis → Cipher Edict V → only then mark ready / merge. The `/code-review` skill is explicitly **not** a Governor audit per canon-cc-022. Test-only / docs-only changes may waive the Governor audit explicitly.
- **F-35-1 escape doctrine** — `escHtml` now covers both HTML body context AND double-quoted attribute context (escapes `& < > " \n`). The doctrine still mandates escHtml-not-escAttr for user-content `data-arg`; the previously-unguarded `"`-delimiter corner is closed across the entire codebase.
- **Companion invocation procedure** — `invocation.md` at repo root is the operational reference. Subagent-vs-skill artifact test (canon-cc-022), per-Companion modes (Lyra 1/2, Maren 1/2, Kael 1/2, Cipher 1/2), Scribe Worker Tier (Book II Art. 3-bis), QA-chain invocation sequence, routing quick reference. Cross-model invocation deferred.

## Test state

Full e2e suite **green: 125/125 passing** (1 always-skip). Run via `npx playwright test` — Chromium is the only configured browser, ~2 min full run.

New regression guards added this session:
- `regression-guard r2 (Maren F-35-1)` — extended to also fetch and scan `diet.js`.
- `regression-guard (#107 V-K-14)` — locks in `escHtml`'s `"` → `&quot;` escape with a whitespace/quote-tolerant regex.

## Tooling state for the next session

- **Playwright Chromium** is installed in this environment.
- **Vercel** project is connected; `vercel.json` is on `main`; previews come automatically.
- **Branch convention:** `claude/sproutlab-<topic>`. Older `-pubDN` / `-VnJzq` session-suffixes are no longer needed.
- **Subagent invocation pattern (proven over 9 chain runs this session):** the harness `Agent` tool has no SproutLab-Companion `subagent_type` registered in this remote environment. Summon `general-purpose` and brief it with the spec path (`.claude/agents/<name>.md`) — the agent reads the spec and adopts the role. Each brief should be self-contained (the subagent sees none of the caller's transcript).
- **Auto-commit hook (`~/.claude/stop-hook-git-check.sh`)** has occasionally auto-committed uncommitted work onto whatever branch was checked out at end-of-turn. Be on the intended branch before ending a turn with uncommitted changes.
- **GitHub MCP** (`mcp__github__*`) is the only GitHub interface in this environment — no `gh` CLI available. Tool schemas are deferred; load via `ToolSearch` with `select:mcp__github__<name>` as needed.

## What didn't happen this session

- No new feature work — fully a process / debt / doctrine session.
- No `intelligence-*.js` 30K-Rule re-architecture — none needed; PR-G's split holds.
- No visual / design changes — pure HR-cleanup and primitive-correctness work, no UX surface touched.
- **The three follow-up issues** (#109 / #110 / #111) — surfaced by audits, deliberately deferred to keep PR #108 scope-bounded. See pickup-order recommendation below.

---

## Next session — opening prompt

The block below is intended as the opening message for the next SproutLab session — copy-pasteable, self-contained, gets the next Lyra-mode session productive without re-establishing context.

```
We're picking up SproutLab. End state from the previous session (2026-05-22 PM):

- main at c89a1a5 — clean, all work merged
- 7 PRs shipped: #100, #101, #102, #103, #105, #106, #108
- canon-cc-008 QA chain is now a binding pre-merge gate
  (CLAUDE.md §QA Chain + docs/QA_GATE_SPEC.md Gate 2.5)
- Vercel per-PR previews are live (every PR gets a preview URL)
- invocation.md (Companion roster procedure) lives at repo root next to CLAUDE.md

Three open follow-up issues from the prior session's audits — all pre-existing
debt, none are regressions:

  #109 — HR-3: diet.js ql-freq-pill + intelligence-quicklog sister inline-onclick
         (small; same shape as PR #106)
  #110 — HR-4: CareTicket title double-escape (Notification.body + Today So Far)
         (most cross-cutting; touches CareTickets — Care primary, Intelligence
         consults on the renderer)
  #111 — F-35-1: convert medical.js escAttr→escHtml + extend regression guard
         (completes the F-35-1 doctrine coverage that #108 started)

Recommended order: #111 → #109 → #110.

Before touching code:
  1. Read docs/SESSION_HANDOFF.md (the full prior-session record).
  2. Read CLAUDE.md (§QA Chain — Mandatory Pre-Merge Gate, §Companion-Set
     Invocation Surface), invocation.md, and the issue you're tackling.
  3. Propose a plan and surface scope.

For each issue, run the canon-cc-008 chain end-to-end:
  build self-check → Maren + Kael (parallel) → Lyra synthesis → Cipher Edict V
  → mark ready → merge.

Subagent summoning pattern (proven last session): the harness Agent tool has no
SproutLab-Companion subagent_type registered here. Summon general-purpose and
brief it with the spec path (.claude/agents/<name>.md) — the agent reads the
spec and adopts the role. Each brief must be self-contained (subagents see none
of the caller's transcript).

Start with #111.
```
