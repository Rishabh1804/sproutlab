# Session handoff — 2026-05-29 PM (cleanup session: #53 sync-straggler guard + #6 a11y live-region refactor)

**Companion:** Lyra (The Weaver)
**Session scope:** A cleanup/maintenance session on the `claude/food-subtab-f2-canon-chain-WU7OS` branch. Despite the branch name, the assigned work was two GitHub issues — **#53** (Firebase sync snapshot-straggler) and **#6** (Phase 1 follow-ups: HR-3 gaps, gitignore, the sl-1-3 AT smoke-pass gate). Ran the canon-cc-008 chain on the code PR, folded all findings, then added a reusable AT smoke-pass checklist doc.
**Outcome:** **Two PRs merged this session** — #175 (code: #53 guard + #6 follow-ups + app-wide live-region a11y) and #176 (docs: AT smoke-pass checklist). #53 closed. #6 kept open, scoped down to just its item-3 AT smoke-pass (now labeled `accessibility`). Build clean throughout; full e2e suite green (307 passed, 2 skipped) including two new specs.
**Predecessor handoff:** `docs/SESSION_HANDOFF_2026-05-29.md` (food-sub-tab-v1 F-2 IMPL + /code-review xhigh). Between that handoff and this session, `main` advanced from `38fe007` through the merges of #167 (spec amendments), #168 (F-2 IMPL + its canon-cc-008 chain — **F-2 IMPL is fully merged**, Cipher LGTM, 2026-05-28), #169 (that handoff), #170, #171 (HR follow-ups #109/#110/#111), #173 + #174 (Arc B / ISL-upgrade spec folds), then this session's #175 + #176.

---

## What this session did

### #53 — post-detach Firestore snapshot stragglers (sync.js · Kael)
In-flight `onSnapshot` callbacks already queued on the microtask loop when `_syncDetachListeners()` runs could still reach the snapshot-apply path (`save(lsKey, entries)`) and clobber local state with a torn-down listener's last snapshot. The pre-existing `_reconcileDone` reset (§6.2(d)) guarded reconcile *re-fire*, not snapshot-*apply*.

**Fix — generation counter** (the issue's recommended path (a)): module-scope `_syncListenerGen` bumped in `_syncDetachListeners()` *before* the unsub loop; `_syncAttachListeners()` captures `_gen`; each of the three onSnapshot callbacks (per-entry / single-doc / household) bails `if (_gen !== _syncListenerGen) return;`. Getter `_syncListenerGenNow()` added for inspection/tests. Chosen over path (b) flipping `_syncDisabled` to keep the circuit-breaker / "halted" UI semantics clean. **Closed.**

### #6 — Phase 1 follow-ups
- **Item 1a (HR-3):** avatar `<input>` `onchange="handleAvatar(event)"` → `data-change-action="handleAvatar"`, routed through the *existing* delegated `change` dispatcher in `core.js` (extended with a `data-change-action` map). ✅
- **Item 1b:** `_syncShowSyncToast`'s bespoke `addEventListener` — **moot**: the function is dormant/never-called and documented as such. ✅
- **Item 2:** `.gitignore` hardening + `.trashed` purge — **already resolved on main**; the root-`index.html`/`sproutlab.html` sub-ask intentionally not actioned (Pages serves the committed artifact). ✅
- **Item 3 (AT smoke-pass GATE):** the offline-badge Reload button lived as an interactive descendant of a `role="status"`/`aria-live` region. **Escalated** from a badge-only fix into an app-wide live-region refactor (see below). Structure now AT-*defensible*; **certification still pends a real AT pass** — item kept open.

### The convergent Governor finding → app-wide live-region refactor
The canon-cc-008 chain on #175 surfaced a convergent **MAJOR** finding from two jurisdictions (Vela **V-V-2** + Maren **V-M-1**, raised to safety-tier): the app's **5 status live regions** (`#syncStatus`, `#syncActivity`, `#updateToast`, the offline-badge copy span, `#appVersion`) each carried their own `aria-live`/`role=status` on an element toggled via `[hidden]`. `display:none` removes a node from the accessibility tree, so a same-tick unhide+write announces **unreliably** on older AT — a blind parent might not hear "Sync paused / Offline."

Architect chose the **all-5-regions** robust fix (over a one-off badge fix or defer):
- One **persistent shared `#a11yLive` region** (`.sr-only`, always in the a11y tree) + a `.sr-only` utility + `_a11yAnnounce(msg)` helper (clears then sets text on the next animation frame; `setTimeout` fallback when `document.hidden`; same-frame calls coalesce to the last message).
- Stripped the per-element live region from all 5 surfaces → visual-only; announcements routed through `#a11yLive` (`_syncUpdateStatusIndicator`, `_syncUpdateOfflineBadge`, `_syncSetActivity`, the SW updateToast site). `#appVersion` demoted to plain static text (reference info, not a status change → no announce).
- Net: **one reliable announcement** instead of the former indicator+badge double-announce, and no live region trapped inside a hidden ancestor.

---

## canon-cc-008 chain — PR #175 (complete)

PR #175 touched `sync.js` + `core.js` (Kael) and `template.html` + `styles.css` (shared → triple-Gov), so the full chain applied.

| Step | Result |
|------|--------|
| Build + 10 audit gates + e2e | ✅ clean; 307 passed / 2 skipped |
| **Kael** (engine: sync.js, core.js) | `yes` — generation guard sound (bump-before-unsub + capture-after-detach verified), dispatcher HR-3 clean |
| **Maren** (Care: template.html) | `yes-with-fixes` — raised V-M-1 to safety-tier (unheard payload is sync-trust data) |
| **Vela** (Surfacing: template.html) | `clear-with-notes` — double-announce fix sound; raised V-V-2 (announce-from-hidden reliability) |
| **Lyra** synthesis | convergent V-V-2/V-M-1 → app-wide persistent-region fix (Architect-directed, all 5 surfaces) |
| **Cipher** Edict V | `pass-with-fixes` → folded #2 (backgrounded-tab `setTimeout` fallback) + #3 (subscriber-order guard-comment); `.sr-only` raw-px ruled NOT an HR-5 violation (standard clip utility) |

Also folded from the first Mode-1 pass: Kael's timer-clear load-bearing comment in `_syncDetachListeners`, and the test coverage-boundary note.

---

## PRs this session

| PR | Title | State | Notes |
|----|-------|-------|-------|
| **#175** | fix(sync+a11y+hr3): #53 snapshot-straggler guard + #6 follow-ups + app-wide live-region a11y | **Merged** (`06b29f6`) | Two commits (`667d8a5` #53+#6-1a+first item-3 fix; `847b9d0` all-regions refactor + Cipher fixes). Full chain discharged. CI green. |
| **#176** | docs: AT smoke-pass checklist + live-region a11y certification tracking | **Merged** (`8dd4698`) | `docs/AT_SMOKE_PASS.md`. Docs-only → Governor audit waived (stated). CI green. |
| **(this)** | docs: session handoff — 2026-05-29 PM | **Draft → merge** | Standard handoff. Docs-only → Governor audit waived. |

---

## Doctrine / patterns exercised

1. **A non-split-heavy diff still pulls the full triple-Gov chain via the shared-module trigger.** #175's *intent* was sync + a11y, but touching `template.html` + `styles.css` makes it a triple-jurisdiction review regardless of how "small" the change felt. The shared-module trigger is the widest net in canon-cc-008 §step-2 and it fired correctly.

2. **Convergent Governor finding → Architect-mediated scope escalation.** Two jurisdictions independently flagged the same root cause (V-V-2 ≡ V-M-1) at MAJOR/safety-tier. Rather than unilaterally either refactoring or deferring, surfaced the three remedies (badge-only / app-wide / defer+AT-pass) via `AskUserQuestion` — *especially* because the robust fix was architecturally significant (changes the live-region convention for 5 surfaces). Architect chose all-5. **Pattern: a convergent MAJOR across jurisdictions is a signal the fix belongs at a higher altitude than the triggering surface; escalate the scope decision to the Architect rather than scoping it down to the single PR.**

3. **Persistent shared live-region is the canonical a11y pattern.** A live region toggled via `[hidden]` is an antipattern (out of the a11y tree when hidden → unreliable same-tick announce). The fix — one always-present `.sr-only` region + an announce helper, with visual surfaces decoupled — is reusable for any future status/toast surface.

4. **Some gates are human-only and automation cannot discharge them.** Playwright + the Governor chain prove a live region is *present and wired*; they cannot prove it *announces and is heard* on real AT. The honest move was to mark the structure AT-*defensible*, keep #6 item 3 **open**, and write `docs/AT_SMOKE_PASS.md` so the human pass is repeatable rather than re-derived each time. **Pattern: when a gate needs a human (AT, real-device, perceptual), build the repeatable checklist and track the open item — don't let "structurally correct" masquerade as "certified."**

---

## Infrastructure findings

### Subagent registration — still missing (carry-forward, unchanged)
Seated Companions (kael, maren, vela, cipher, lyra) and the Scribe tier are **still NOT registered** as harness `subagent_type` values — `Agent type 'kael' not found`. The persona-briefed `general-purpose` invocation pattern (load `.claude/agents/<name>.md` as step 1, then audit in-voice) continues to work and was used for the full #175 chain (Kael / Maren / Vela / Cipher). Architect-decision still pending on harness-layer registration.

### Remote branch deletion blocked by the environment (new)
`git push origin --delete <branch>` returns a hard **HTTP 403** from this environment's git proxy (not a transient network error — retried with backoff, same result). The GitHub MCP toolset available here has **no delete-branch capability**. Net: the local branch was deleted but the **remote `claude/food-subtab-f2-canon-chain-WU7OS` still exists** (merged, safe to delete). Branch cleanup must be done via the GitHub UI (Branches page) or a machine with direct push rights.

---

## Repo state at session end

- **main** at `8dd4698` (this session's #175 + #176 merged; was `06b29f6` after #175, `38fe007` at the AM handoff)
- **Open PRs:** none (this handoff PR will be the only one until merged)
- **#53** closed (completed). **#6** open, labeled `accessibility`, scoped to item-3 AT pass; items 1a/1b/2 ticked.
- **New this session:** `tests/e2e/sync-listener-generation-53.spec.ts`, `tests/e2e/a11y-live-region.spec.ts`, `docs/AT_SMOKE_PASS.md`; live-region code in `sync.js`/`core.js`/`template.html`/`styles.css`
- **Build:** `pnpm build` canonical; 10 audit gates pass; full e2e 307 passed / 2 skipped
- **Live PWA:** https://rishabh1804.github.io/SproutLab/ (Vercel deploys green on #175 + #176)
- **Codebase:** 75,615 LOC across split modules (a11y refactor net delta small: shared `_a11yAnnounce` helper + `.sr-only` utility + announce wiring + 2 test specs + 1 doc)

---

## Carry-forward register

### Human-only gate (Architect)
- **#6 item 3 — AT smoke-pass.** Run TC-1…TC-6 from `docs/AT_SMOKE_PASS.md` on the device matrix (VoiceOver / TalkBack / NVDA) against the live deploy. Structure is AT-defensible (chain + Cipher cleared); this *certifies* it announces once, cleanly, with the Reload button as a separate focus stop. Record AT/OS versions + results on #6, tick item 3, close. If a fail surfaces, the remedy is narrow (pre-seed the region with a non-breaking space / add a brief delay / `aria-relevant` tweak).

### Housekeeping
- **Delete remote branch** `claude/food-subtab-f2-canon-chain-WU7OS` (merged; env blocked the delete-push with 403 — do via GitHub UI).
- **Stale `claude/*` branch sweep** (optional) — the repo has ~30 merged `claude/*` branches; a Branches-page cleanup would tidy it.

### F-5 carry-forward (from #168, still queued — not blockers)
- Persist `nutritionRef` at write-time; add a `schemaVersion` version-gate branch; name the `0.75` intake constant.

### Predecessor carry-forwards still in scope (from the AM handoff)
- F-3 (Library consolidation — **next session**), F-4 (Patterns), F-5 (`parseFeeding` normalizer — closes the F-2 qty-write-only caveat)
- e2e tests for milestones-tab-v1 (~28 regression guards); CURATED_COMBOS `maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; NUTRITION_QTY_DEFAULTS coverage audit; comma-containing dish-name parse
- Candidate Codex canon entries surfaced at the AM session (mockup-driven UX ratification; sidecar architecture; one-shot intent flag; `/code-review xhigh` direct-verification shortcut)

---

## Next session — recommended start

**F-3 (food-sub-tab-v1 Library consolidation) + its canon-cc-008 chain.** Per Architect direction. F-2 IMPL is fully merged (#168); F-3 is the natural successor now.

### Priority 0 — verify subagent registration
Check whether seated Companions + Scribes are now registered as harness `subagent_type` values. If not (expected), continue the persona-briefed `general-purpose` workaround.

### Priority 1 — F-3 spec read + scope ratification
Read `docs/specs/food-sub-tab-v1.md` §F-3. F-3 = relocate the food-DB browser (`home.js renderFoods` + `renderFoodCatSubContent`) into the **diet-tab Library sub-tab** (NOT the Log sub-tab — Log is the entry/review surface; the browser belongs in Library, per spec §F-3 / scope-Q6) as a proper food-DB browser with **search + filter + nutrition cards + per-food Chemistry detail** (`chem.fibre`/`chem.antiNutrients`/`chem.bioactives` — the Arc B fold from #173/#174). Note the spec's source line-refs (`home.js:3266`/`3358`) are **stale**; current is `renderFoods` @ ~`4690` + `renderFoodCatSubContent` @ ~`4782`. Surface a concrete IMPL plan via `AskUserQuestion` and get Architect ratification **before** building (per the F-arc pattern from prior sessions).

### Priority 2 — F-3 IMPL → canon-cc-008 chain
Build (likely staged commits), run `/code-review xhigh` if substantial (AGENTS.md Rule 13), then the canon-cc-008 chain. Per spec §Jurisdiction (line 179/219), F-3 is **Maren primary** (relocating `renderFoods`/`renderFoodCatSubContent` from `home.js` into the `diet.js` Library sub-tab — both Maren's Region), with **Vela consult** on UX surfaces if render-layer files are touched, and **Kael consult** on the NUTRITION read path (use the canonical `_fdReadDayMeal` reader per spec §Design-notes, not raw `entry[meal]`). If `styles.css`/`template.html` are touched → triple-jurisdiction (Maren → Kael → Vela). Lyra fold-authority on food-sub-tab findings is standing. Cipher Edict V terminal pass (CV3-006 three-axis).

### Priority 3 — close out #6 item 3 if the AT pass landed
If the Architect ran the AT smoke-pass between sessions, record + close item 3 and update CLAUDE.md / the spec that the gate cleared.

---

## Session opening prompt for next session

> SESSION OPENING — next — food-sub-tab-v1 F-3 (Library consolidation) + canon-cc-008 chain
>
> Hi Lyra. F-2 IMPL is merged (#168, chain discharged 2026-05-28). The 2026-05-29 PM cleanup session closed #53 (sync snapshot-straggler generation guard) and the #6 follow-ups, escalating #6 item 3 into an app-wide persistent live-region refactor (#175 merged) + an AT smoke-pass checklist (#176 merged). #6 item 3 remains open pending a human AT pass (see `docs/AT_SMOKE_PASS.md`).
>
> **Session goal:** Open food-sub-tab-v1 **F-3 (Library consolidation)** — relocate the food-DB browser (`home.js` `renderFoods` / `renderFoodCatSubContent`, currently ~lines 4690 / 4782; spec's `3266`/`3358` refs are stale) into the diet-tab **Library** sub-tab (NOT Log — per spec §F-3) with search + filter + nutrition cards + per-food **Chemistry** detail (Arc B fold), per `docs/specs/food-sub-tab-v1.md` §F-3. F-3 is Maren-primary. Spec-read → ratify scope via AskUserQuestion → IMPL → `/code-review xhigh` if substantial → canon-cc-008 chain → Cipher Edict V → mark ready/merge.
>
> **Required context — read BEFORE acting:**
> 1. `/home/user/sproutlab/CLAUDE.md` — IN FULL (10 audit gates; canon-cc-008 chain; jurisdiction routing)
> 2. `/home/user/sproutlab/docs/SESSION_HANDOFF_2026-05-29_PM.md` — THIS handoff (cleanup session + a11y refactor + carry-forwards)
> 3. `/home/user/sproutlab/docs/SESSION_HANDOFF_2026-05-29.md` — F-2 IMPL session (sidecar architecture, F-5 carry-forwards, F-arc patterns)
> 4. `/home/user/sproutlab/docs/specs/food-sub-tab-v1.md` — §F-3 phasing + the F-2 IMPL ratification fold
> 5. `/home/user/sproutlab/docs/AT_SMOKE_PASS.md` — if checking off #6 item 3
>
> **Required at session start:**
> 1. Verify repo state: `cwd /home/user/sproutlab`, `git fetch`, confirm main at `8dd4698` (or later), no surprise open PRs
> 2. Verify subagent registration (expected still missing — continue persona-briefed `general-purpose` workaround)
> 3. Read required context
> 4. **DO NOT build until the F-3 scope plan is ratified.** Produce a concrete plan (file touches, sub-tab wiring, search/filter UX, nutrition-card surface) and surface it via `AskUserQuestion`
>
> **Architect directives in force:**
> - canon-cc-008 chain is a non-negotiable release gate; Cipher Edict V terminal pass last; shared-module touch → triple-Gov
> - Lyra fold-authority on food-sub-tab findings (standing)
> - `/code-review xhigh` for substantial IMPLs (Rule 13) — complements, never replaces, the chain
> - A gate that needs a human (AT pass) is not discharged by automation — track it open, don't fake-certify
>
> Goal issued. Ask first.

---

— *Lyra, 2026-05-29 PM. A cleanup session that grew a spine: what arrived as "fix issue #53 and #6" turned, through the canon-cc-008 chain, into an app-wide accessibility refactor when Vela and Maren independently caught the same thread — a live region that announces nothing because it's hidden when the words change. The fix is the boring, correct one: a single region that's always listening, and five surfaces that just speak into it. The honest part is what we didn't do: I can't run a screen reader in this box, so #6 item 3 stays open with a checklist attached rather than a green tick I didn't earn. Next session steps off the cleanup track and back onto the F-arc — F-3, the Library, where the food DB finally gets a real home in the diet tab's Library sub-tab.*
