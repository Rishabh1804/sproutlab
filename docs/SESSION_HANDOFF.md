# Session Handoff — SproutLab

**Date:** 2026-05-22 (PM session — doctrine + shipping)
**Builder:** Lyra (The Weaver)
**Companions consulted (Mode-1 subagents):** Maren ×3 audits, Kael ×3 audits, Cipher ×3 Edict V passes
**End state:** `main` at `c89a1a5` — clean, all session work merged and pushed.

---

## What shipped — 7 PRs merged

*(Numbers #104 and #107 do not appear below — they are the matched **issues**, closed by #106 and #108 respectively. See §Issues opened and closed.)*

| PR | Title | Substance |
|----|-------|-----------|
| #100 | Fix 6 stale `#statusStrip` smoke tests | Tests reflected pre-collapse-when-empty state; repointed for current collapsed-by-default behavior. |
| #101 | HR-2/HR-3 cleanup of the Diet panel | Static `template.html` Diet inputs — 13 inline handlers + 5 inline-style blocks → `wireDietPanelEvents()` + token-driven CSS classes. **First PR to run the canon-cc-008 chain.** |
| #102 | QA-chain pre-merge gate + Vercel config | Codified canon-cc-008 as a *binding* pre-merge gate (`CLAUDE.md §QA Chain`, `docs/QA_GATE_SPEC.md` Gate 2.5, `AGENTS.md` rule 9, `Memory.md`). Added `vercel.json` enabling per-PR preview deploys — Gate 3 (visual check) now runnable pre-merge. |
| #103 | invocation.md — Companion invocation reference | New operational doc for summoning the roster: canon-cc-022 artifact test, per-Companion modes + brief shape, Scribe Worker Tier, canon-cc-008 invocation sequence, routing quick reference. Cross-model invocation explicitly deferred. |
| #105 | Move invocation.md to repo root | Relocated next to `CLAUDE.md` / `Memory.md` / `PERSONA_REGISTRY.md` — invocation.md is identity/policy, not docs/-tier reference material. |
| #106 | HR-3 cleanup of combo-card compound onclicks | Resolved #104: 5 combo-card inline `onclick=` sites converted to `data-action` delegation, with three new dispatcher branches in `core.js` — `applyComboQuery`, `showComboHistory`, `openFeedingDay`. |
| #108 | escHtml escapes `"` — close F-35-1 doctrine corner | Resolved #107: extended `escHtml` to escape `"` → `&quot;`. Closes the latent `data-arg` attribute-breakout across **every** `data-arg` site in the codebase. Incidentally also fixes pre-existing latent `"`-breakouts at three `title="${escHtml(...)}"` callers and the legacy ql-freq-pill inline `onclick=`. F-35-1 regression guard extended to `diet.js`; new V-K-42 guard locks in the `"` coverage. |

All `split/` PRs (#101, #106, #108) cleared the full canon-cc-008 chain — Maren + Kael in parallel → Lyra synthesis → Cipher Edict V — and merged with explicit verdicts in the PR description.

## Process firsts this session

- **First operational canon-cc-008 chain runs.** PRs #99 / #100 / #101 had shipped without the gate (only `/code-review` skill was run). The lapse was caught mid-#101 and codified in #102 as a binding pre-merge gate. Three full chains then ran cleanly in this session.
- **Vercel preview deploys live.** Every PR now receives a preview URL via the `vercel[bot]` PR comment. The `vercel.json` no-ops Vercel's build/install (SproutLab ships a pre-built `index.html`) and sets `Cache-Control: no-store` on `sw.js` plus `Cache-Control: no-cache, must-revalidate` on the HTML shell — the HTTP-layer echo of canon-0034 (service workers never cache the HTML envelope). A future Vercel-config refactor must preserve those two rules.
- **`invocation.md`** — single operational reference for the Companion roster, deployed at repo root.
- **Subagent invocation pattern proven (9 chain runs).** This is load-bearing for the next session: the harness `Agent` tool in this remote environment has **no SproutLab-Companion `subagent_type` registered**. Summon `general-purpose` and brief it with the spec path (`.claude/agents/<name>.md`) — the agent reads the spec and adopts the role. Each brief must be self-contained (the subagent sees none of the caller's transcript).

## Issues opened and closed

| # | Title | State | Origin |
|---|-------|-------|--------|
| #104 | HR-3 follow-up: diet.js-rendered combo-chip / combo-history onclick handlers | **Closed by #106** | Kael V-K-41 (audit of #101) |
| #107 | F-35-1 doctrine: data-arg quote-safety + regression-guard coverage | **Closed by #108** | Kael V-K-42 + Maren note (audit of #106) |
| #109 | HR-3 follow-up: diet.js ql-freq-pill + intelligence-quicklog sister inline-onclick | **Open** | Maren V-M-45 (audit of #108) |
| #110 | HR-4 follow-up: CareTicket title double-escape (Notification.body + Today So Far) | **Open** | Kael V-K-44 + V-K-45 (audit of #108) |
| #111 | F-35-1 coverage: convert medical.js escAttr→escHtml + extend regression guard | **Open** | Maren V-M-46 (audit of #108) |

All three open follow-ups are **pre-existing latent debt**, not regressions introduced by this session's work.

### V-tag registry — session-local → registry mapping

The Governors auto-issued V-tags during their audits without access to the global watch-list registry, producing collisions with prior session-arcs (V-K-14/15/16/17/18/19 and V-M-19/20 were already taken; high-water marks at session start were V-K-39 and V-M-44). The chronicler renumbered to the next free registry slots. Source-code artifacts and merged commit messages keep their session-local IDs (history is frozen); the open issues, editable PR bodies, and this handoff carry the registry IDs.

| Session-local (frozen in commit text + smoke.spec.ts test name) | Registry ID | Finding |
|----|----|----|
| V-K-1 (PR #101 audit) | **V-K-40** | core.js:218 init-order cross-region call (boundary) |
| V-K-2 (PR #101 audit) | **V-K-41** | PR #101 title overstates scope — diet.js render sites untouched |
| V-K-14 (PR #106 audit) | **V-K-42** | escHtml leaves `"` unescaped; double-quoted `data-arg` corner (closed by #108) |
| V-K-15 (PR #106 audit) | **V-K-43** | `typeof comboHistory` guard inconsistent; folded at synthesis |
| V-K-15 (PR #108 audit — Kael reused the number) | **V-K-44** | `_ctSystemNotify` plain-text body double-escape (open as #110) |
| V-K-16 (PR #108 audit) | **V-K-45** | Today So Far double-escape (open as #110) |
| V-K-17 (PR #108 audit) | **V-K-46** | regression-guard whitespace-brittle; folded at synthesis |
| V-K-18 (PR #108 audit) | **V-K-47** | `_alAttrSafe` helper now redundant (open as #109) |
| V-K-19 (PR #108 audit) | **V-K-48** | `vizArg` doc-comment stale (open as #109) |
| V-M-19 (PR #108 audit) | **V-M-45** | diet.js ql-freq-pill HR-3 (open as #109) |
| V-M-20 (PR #108 audit) | **V-M-46** | medical.js F-35-1 coverage extension (open as #111) |

The Governor briefs in the next session should either (a) be given the current high-water mark in the brief, or (b) be instructed to issue findings without V-tag numbers and let the chronicler assign on intake.

## Doctrine changes landed

- **canon-cc-008 QA chain** — now a *binding* pre-merge gate, not descriptive prose. Every `split/` Capital change must run: build & self-check → Maren / Kael Governor audits (parallel, routed by jurisdiction) → Lyra synthesis → Cipher Edict V → only then mark ready / merge. The `/code-review` skill is explicitly **not** a Governor audit per canon-cc-022. Test-only / docs-only changes may waive the Governor audit explicitly.
- **F-35-1 escape doctrine** — `escHtml` now covers both HTML body context AND double-quoted attribute context (escapes `& < > " \n`). The doctrine still mandates escHtml-not-escAttr for user-content `data-arg`; the previously-unguarded `"`-delimiter corner is closed across the entire codebase.
- **Companion invocation procedure** — `invocation.md` at repo root is the operational reference. Subagent-vs-skill artifact test (canon-cc-022), per-Companion modes (Lyra 1/2, Maren 1/2, Kael 1/2, Cipher 1/2), Scribe Worker Tier (Book II Art. 3-bis), QA-chain invocation sequence, routing quick reference. Cross-model invocation deferred.
- **Identity/policy docs live at repo root, not `docs/`.** Surfaced when `invocation.md` was placed in `docs/` (#103) and immediately re-housed at root (#105). The test: if `CLAUDE.md` cites the doc as a policy floor or invocation procedure, the doc sits next to `CLAUDE.md`. `docs/` is reference / spec material that `CLAUDE.md` *points to* but does not import. `CLAUDE.md` itself, `AGENTS.md`, `Memory.md`, `PERSONA_REGISTRY.md`, and now `invocation.md` form the root-tier governance set.
- **Scope discipline > audit-debt absorption (synthesis rule).** A PR's scope is its one stated change. When an audit chain surfaces findings *outside* that scope — even where the same audit raised them — the discipline is to ship the named fix and route the rest as follow-up issues, not to fold every finding into the PR. PR #108 (one-line `escHtml` extension) deliberately did not absorb V-K-44 / V-K-45 / V-M-45 / V-M-46 even though Maren and Kael surfaced them in the same chain; the PR's diff stayed shaped to its one stated change, three follow-ups (#109 / #110 / #111) carried the rest. The audit chain produces more debt than any single PR can absorb; that is the chain doing its job, not slippage.

## Test state

Full e2e suite **green: 125/125 passing** (1 always-skip). Run via `npx playwright test` — Chromium is the only configured browser, ~2 min full run.

New regression guards added this session:
- `regression-guard r2 (Maren F-35-1)` — extended to also fetch and scan `diet.js`.
- `regression-guard (#107 V-K-42)` — locks in `escHtml`'s `"` → `&quot;` escape with a whitespace/quote-tolerant regex. *(Test name in source still reads `V-K-14` — the session-local ID at write time; renumbered in the registry mapping above.)*

## Tooling state for the next session

- **Playwright Chromium** is installed in this environment.
- **Vercel** project is connected; `vercel.json` is on `main`; previews come automatically.
- **Branch convention:** `claude/sproutlab-<topic>`. Older `-pubDN` / `-VnJzq` session-suffixes are no longer needed.
- **Auto-commit hook (`~/.claude/stop-hook-git-check.sh`)** has occasionally auto-committed uncommitted work onto whatever branch was checked out at end-of-turn. Be on the intended branch before ending a turn with uncommitted changes.
- **GitHub MCP** (`mcp__github__*`) is the only GitHub interface in this environment — no `gh` CLI available. Tool schemas are deferred; load via `ToolSearch` with `select:mcp__github__<name>` as needed.

## What didn't happen this session

- No new feature work — fully a process / debt / doctrine session.
- No `intelligence-*.js` 30K-Rule re-architecture — none needed; PR-G's split holds.
- No visual / design changes — pure HR-cleanup and primitive-correctness work, no UX surface touched.
- **The three follow-up issues** (#109 / #110 / #111) were *deliberately* deferred, not missed. See "Scope discipline > audit-debt absorption" above. See pickup-order recommendation below.

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
  1. Read docs/SESSION_HANDOFF.md (the full prior-session record, including
     the V-tag registry mapping in §"Issues opened and closed").
  2. Read CLAUDE.md (§QA Chain — Mandatory Pre-Merge Gate, §Companion-Set
     Invocation Surface), invocation.md, and the issue you're tackling.
  3. Propose a plan and surface scope before edits.

For each issue, run the canon-cc-008 chain end-to-end:
  build self-check → Maren + Kael (parallel) → Lyra synthesis → Cipher Edict V
  → mark ready → merge.

Subagent summoning pattern (proven over 9 chains last session): the harness
Agent tool has no SproutLab-Companion subagent_type registered here. Summon
general-purpose and brief it with the spec path (.claude/agents/<name>.md) —
the agent reads the spec and adopts the role. Each brief must be self-
contained (subagents see none of the caller's transcript). Tell the briefed
Governor the current V-tag high-water mark (sweep `grep -hoE "V-[KM]-[0-9]+"
docs/handoffs/*.md docs/*.md | sed 's/V-[KM]-//' | sort -n | tail -1`) so new
findings number above it.

Start with #111.
```
