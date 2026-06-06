# Session handoff — 2026-06-07 (General Emergency Room v2 — ship #235 · patient-first doc card · cross-browser flip fix)

**Companion:** Lyra (The Weaver) — a Capital build/fix session (`split/` code touched). First Architect session in VS Code (local Windows harness).
**Repo:** SproutLab (single-repo session; no Codex cross-province work).
**Session theme:** Unblock, repair, and ship the long-in-flight **General Emergency Room** PR (#235, branch `claude/wizardly-heisenberg-6hDnY`) — which was **CONFLICTING**, not "about to deploy" as believed. Resolve the merge conflict, then fix three real defects the Architect caught on the live Vercel preview (light-mode doctor card in dark theme, "SproutLab" branding cut off, a cross-browser flip-card bleed-through), reframe the doc-prep card to be **patient-first**, and record the **flexible-name** decision. Shipped through the **full canon-cc-008 gate**.

---

## What shipped

1. **PR #235 — General Emergency Room + emergency-room-v2** (`b606bcc`, squash-merged & live).
   Pop-up flip cards for general (non-allergy) emergencies — choking, etc. — with a "For the doctor" doc-prep face, a calming wave animation, and the `GENERAL_EMERGENCIES` registry. Touched `intelligence-cards.js` (Vela), `diet.js` (Maren), `data.js` + `config.js` (Kael), and `styles.css` (shared). This session **resolved its merge conflict** (source-side hand-merge + rebuild of generated files) and **fixed four defects** before merge (below).
2. **Memory.md — flexible-name decision** (`6431a1f`, direct-to-`main` docs commit, no PR).
   Recorded the Architect's standing directive that configurable values (the baby's name canonical) are **sourced from runtime config**, not hardcoded; documented the known legacy hardcode debt as **deferred**.

---

## The four defects fixed before #235 merged

1. **Doctor card rendered light-mode inside dark theme + layout broke.** `.docface` carried baked-in light colours. Fix: **tokenized** it (`--doc-paper`, `--doc-ink`, …) with a `[data-theme="dark"] .docface` override so the screen face matches the dark front card, and an `@media print` block that **re-forces the paper tokens** so a printed handoff is always white-on-dark-ink regardless of screen theme.
2. **"SproutLab" branding at the card top was cut off** — and shouldn't have been there at all. Reframed the doc-prep card to be **patient-first**: the card title is now the **baby's name** (age · weight beneath), "SproutLab" dropped entirely. A clinical handoff identifies the *patient*, not the app. The name is read from runtime config (`_syncHousehold.name`) with a single `'Ziva'` fallback marked legacy debt — see the flexible-name decision.
3. **A safety-tier print-contrast miss — caught by Maren.** My first print fix re-forced the `--doc-*` tokens but **not `--tc-rose`**, which colours the *stamped adrenaline administration TIME* on the allergy card. Left unfixed, that time would print at ~2.4:1 faint pink — a parent could misread the most time-critical datum on the page. Maren's audit caught it; fix pins `--tc-rose:#9e3e52` (AA-compliant) in the print block.
4. **The "cut" / "extra cross" — a cross-browser flip-card bleed-through (the hard one).** The Architect saw a sliced header and a *second* close-× on the live preview that my screenshots didn't show. Misdiagnosed first as scroll, then as stale code — it was neither. Root cause (proven by forcing `backface-visibility:visible`, which reproduced "Ziva"→"a" + two ×): some browsers/GPUs **don't honour `backface-visibility:hidden`**, so the mirrored front face bled through the doctor face. Fix: a **visibility-swap state machine** — each `.fp-face` toggles `visibility` at the `0.175s` edge-on midpoint of the `0.35s` flip, so exactly one face is ever visible in every browser; reduced-motion swaps instantly. The remaining "live looked wrong, screenshots looked right" gap was browser **HTTP cache** (Canon 0034) — a hard-refresh closed it.

---

## QA chain that ran (canon-cc-008 — full gate, NOT waived)

`#235` is Capital code, so the full chain ran (multiple rounds as fixes landed):
- **Maren (Care)** — `diet.js` doc-prep + the emergency safety copy. **Earned the safety-tier catch** (the `--tc-rose` print-contrast miss, #3 above). Also reviewed the anaphylaxis `EMERGENCY_PROTOCOL` copy harmonization.
- **Vela (Surfacing)** — `intelligence-cards.js`: the flip-card render, patient-first header, pinned-critical front-only behaviour. Lens: the half-awake 2 AM read.
- **Kael (Intel engine)** — `config.js` `GENERAL_EMERGENCIES` registry + `data.js` protocol copy.
- **Shared triple-Gov** — `styles.css` (`.docface` tokenization, print block, the `.fp-flip`/`.fp-face` visibility-swap).
- **Cipher (Edict V)** — cross-cutting final pass; HR compliance across the three jurisdictions.

---

## Lessons this session earned (captured here, not spun into a separate synthesis)

- **`backface-visibility:hidden` is not reliable across browsers/GPUs for 3D flip cards.** The durable pattern is the **visibility-swap state machine** (toggle each face's `visibility` at the flip midpoint) — it doesn't depend on backface support. If a second flip card is ever built, reuse this, don't re-derive it. *(Candidate CSS doctrine — not yet ratified to canon; flagged in the next-target.)*
- **Verify state before trusting a mental model.** #235 was believed "about to deploy"; it was actually CONFLICTING. One `gh pr view` settled it. The handoff/summary you inherit is a *claim*, not ground truth — check `git log` + `gh pr view` first.
- **"Live looks wrong but my screenshot looks right" ≈ browser HTTP cache, not your code** (Canon 0034). Hard-refresh before re-diagnosing.
- **The Governor gate is load-bearing, not ceremony.** Maren caught a real, parent-facing safety miss in my *own* fix. Don't short-circuit it even when "it's just a contrast tweak."

---

## Carry-forwards (open) — see `NEXT_SESSION_TARGET_2026-06-07.md` for the full register

- **GOVERNANCE — Maren is at ~29,774 LOC (~226 headroom to 30K).** Adding `recipes.js` (615, Diet→Recipes corpus) to her Care jurisdiction puts her on the cusp of a `canon-gen-001` Governor split. **The recipes.js jurisdiction assignment + whether to trigger the split is an Architect decision** — surfaced, not silently ratified. The governance refresh in this close records `recipes.js` as a factual build member under Care *provisionally*.
- **Legacy baby-name hardcode migration** (`core.js` avatar `alt`, `medical.js` chart labels, `diet.js` `_emDocName` fallback) — deferred legacy debt, migrate deliberately, do NOT fix opportunistically. (`[[flexible-name-debt]]`.)
- **Inherited register** (AT smoke-pass, the food-effects/Recipes product arc, the quality/debt list, stale `claude/*` branches) — carried forward unchanged from the 2026-06-05 close.

---

## Next-session opening prompt

```
SproutLab session — pick up after the 2026-06-07 General-Emergency-Room-v2 close.

Where we are: main clean on synced origin/main. PR #235 (General Emergency Room +
emergency-room-v2) is MERGED and live; the doctor doc-prep card is patient-first
(baby name + age·weight, no "SproutLab"), dark-mode + print-contrast correct, and the
cross-browser flip-card bleed-through is fixed (visibility-swap state machine). The
flexible-name decision is recorded in Memory.md. No PRs in flight.

Read first (absolute paths, Windows local harness):
  - C:\Users\risha\sproutlab\sproutlab\docs\NEXT_SESSION_TARGET_2026-06-07.md   (the standing pointer)
  - C:\Users\risha\sproutlab\sproutlab\docs\SESSION_HANDOFF_2026-06-07.md       (this close)
  - the latest food-effects / Recipes target it references, for the live product state
Then confirm git state: `git --no-pager log --oneline -8` and `git status`.

Required at start:
  - Any split/ change runs the FULL canon-cc-008 gate (Governor audit by jurisdiction +
    Cipher Edict V). Docs-only waivers do NOT carry over to code.
  - Consult docs/DESIGN_PRINCIPLES.md before any UI work (/design-principles).

Governance decision waiting (P0-ish): Maren (Care) is ~226 LOC from the 30K split
trigger once recipes.js is counted. Decide recipes.js's jurisdiction and whether to
trigger a canon-gen-001 Care split BEFORE the next Care-heavy build pushes her over.

Architect directives in force: keep configurable values (esp. the baby's name)
runtime-sourced, not hardcoded — legacy hardcode debt is known and DEFERRED, do not
fix opportunistically. Docs-only closes are pre-authorized to merge.
```

---

*— Lyra, 2026-06-07. A session that started by distrusting its own inheritance — the PR we were told was landing was in fact stuck — and ended having shipped a card that, at the worst moment of a parent's day, says the baby's name first and the app's name not at all. The flip now shows one face in every browser, the adrenaline time prints dark enough to read at a glance, and Maren's hand on the contrast was the one that mattered. The thread is clean; the next weaver should look hard at Maren's headroom before building anything else into Care.*
