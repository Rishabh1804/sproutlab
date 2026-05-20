---
session_id: s-2026-05-19-02
session_title: Post-Merge Design Roundtable & PR-EF.1 Amendment — the 3.5/10 Arc
author: Aurelius (The Chronicler)
date: 2026-05-19
repo: SproutLab (primary)
edict_v_exercise: deferred — PR-EF.1 amendment merged on architect's mark-ready-and-merge without a separate Edict V pass (amendment-only on already-audited surfaces)
prior_chronicles:
  - session-2026-05-18-discharge-arc-closure.md (s-2026-05-18-04) — post-quadrilogy sync-discharge arc
  - session-2026-05-19-01-info-tab-rich-viz-and-intelligence-split.md (s-2026-05-19-01) — sibling arc; PR-EF + PR-G + chronicle
arc_position: second arc of the 2026-05-19 session — a post-merge design review that re-opened PR-EF's shipped state, convened a companion roundtable, and discharged 9 findings + 1 new finding via an amendment PR
rounds:
  lyra: 1 (builder — PR-EF.1 amendment; also roundtable critic-of-own-work)
  maren: 1 (roundtable Governor voice — Care-region critique)
  kael: 1 (roundtable Governor voice — Intelligence-region critique)
  cipher: 1 (roundtable Censor voice — doctrine arbiter; no separate Edict V pass on the amendment)
  aurelius: 1 (roundtable logger + this chronicle)
canon_candidates: 3 — C1 (viz primitive choice precedes toolkit fit), C2 (tab-level information hierarchy requires a designated primary surface), C3 (cozy-nursery design brief is a Care-Region promise)
watch_list_intake: 9 findings filed at the roundtable (V-M-15..19, V-K-28..32); all discharged in PR-EF.1 except V-K-30 + V-K-32 (carry-forward — bigger than amendment-shape)
shipped_to_main: 1 (PR #85 = `bf628bec`)
---

# Session Chronicle — Post-Merge Design Roundtable & PR-EF.1 Amendment

**Session ID:** s-2026-05-19-02 (second arc of the 2026-05-19 session; immediate continuation of s-2026-05-19-01)
**Volume:** SproutLab (primary). One amendment PR merged.
**Builder:** Lyra (The Weaver) — and, unusually, critic of her own shipped work
**Governors:** Maren (Care) + Kael (Intelligence) — roundtable voices, not formal Mode-1
**Censor:** Cipher (The Codewright) — roundtable voice + doctrine arbiter
**Architect:** Sovereign — convened the roundtable, delivered the 3.5/10 verdict, added one finding directly (V-M-19), set the next-PR direction
**Status:** Closed. PR-EF.1 amendment merged. 9 roundtable findings discharged (7 in the amendment; 2 carried forward). 3 canon candidates surfaced. The next session's scope re-shaped from the original PR-H toward a viz-interactivity layer.

---

## 1. Arc of the round — the work was re-opened

The s-2026-05-19-01 arc closed clean: PR-EF and PR-G merged, chronicle filed, doctrine operational. The Architect then opened the running app, captured eight screenshots of the shipped info-tab surfaces, and convened a roundtable with a verdict stated up front: **3.5/10. "This is not good work."**

This is the first session-arc in the recent ledger where a *merged* feature PR was re-opened for a design-quality review rather than a correctness audit. The QA chain (canon-cc-008) verifies HR-compliance and parent-action correctness; it does not verify whether the result is *good*. PR-EF passed every gate — Maren clear-with-notes, Kael clear-with-notes, Cipher LGTM — and still shipped a 3.5/10 surface. That gap is the load-bearing observation of this arc.

The roundtable ran in the order the Architect set: Lyra first (builder, owns the work), then Cipher (Censor), then Maren + Kael (Governors). Aurelius stood by to log and to catch canon-tier events.

---

## 2. The roundtable — what the companions said

### Lyra (builder, self-critiquing)

Lyra accepted the 3.5/10 without defense. She named five failure modes across the eight screenshots:

1. **Bugs shipping to a parent's eyes** — texture-progression `—skipped—` leak in the gap-flag; "Orange" duplicated in the unclassified list; Food Intro Timeline lane-labels truncated to fragments ("Grains G", "Vegetab #", "Nuts &"); Milestone treemap labels overflowing their rectangles.
2. **Tonal failure** — the cozy-nursery design brief (CLAUDE.md §Design brief) violated; the surfaces read clinical, not warm.
3. **Flat hierarchy** — every card carries identical visual weight; nothing signals "today's headline."
4. **Wrong primitive for the data shape** — the Vaccination Gantt: 12 lanes for an 8-month-old's sparse vaccine record, clustering left and going empty right.
5. **D10 producing monotone rhythm** — card-local primitives (canon-cc-008-A's sibling) made every viz card look like every other viz card.

Lyra's own diagnosis of the root cause: **toolkit-fit error**. PR-EF chose viz primitives by asking *"what's in our toolkit?"* rather than *"what does this data look like, and what's the cleanest way for a parent's eye to read it?"* The infrastructure landed clean; the design eye that should have curated it did not show up.

### Cipher (Censor, terse)

Three categorical violations: an HR-10 spirit-violation (treemap label overlap is worse than the forbidden ellipsis); a tonal canon violation (CLAUDE.md §Design brief); and **D10 mis-applied** — canon-cc-008-A canonized module *layout*, not design *rhythm*; Lyra inferred the second from the first, wrongly.

Two amendments required before any new PR: **A1** (texture `—skipped—` leak, V-M-tier parent-trust failure) and **A2** (treemap recolor — encode category in hue, status in opacity, not the inverse).

Cipher's verdict on the originally-proposed PR-H: **withdraw**. The Tier 1/2/3/4 structure assumed PR-EF's design was sound enough to extend. It is not. Restart from a different question: *what does a parent want to see first when they open the info tab?*

### Maren (Governor of Care, worst-case frame)

Maren walked the screenshots through the parent-action lens:

- **"Foods to Try Next"** — five non-veg proteins, all carrying the identical subtext "No non-veg in 7 days." A stuck-state surface masquerading as a recommendation; trust-eroding.
- **"Color Anomaly"** card titled for alarm, bodied "All clear" — title-body tonal mismatch is a safety-tier copy failure on a Care card.
- **Growth chart** — illegible percentile bands at info-tab size; the chart is decoration, the text is signal; reverse the weight or demote the chart.
- **Texture `—skipped—` leak** — the gap-flag meant to surface honesty instead makes the classifier look broken.

Her framing line: *the cozy-nursery brief is a Care-Region promise, not a designer's preference.* A clinical-feeling card on a parent's phone at 11pm reads as "your child has a medical issue" by tone alone.

V-tag intake: V-M-15 (texture leak), V-M-16 (Color Anomaly title), V-M-17 (Foods to Try Next stuck-state), V-M-18 (growth chart demote).

### Kael (Governor of Intelligence, coverage-surface frame)

- **Weekly Introduction Rate** — bars carrying unlabeled floating numbers; value-axis intent gap.
- **Food Intro Timeline** — lane labels truncated mid-entity; a `silent-fail` (visual shows characters not in the data).
- **Vaccination Gantt** — wrong-shape primitive; a Gantt encodes parallel duration timelines, the data is discrete point-events on one timeline grouped by series.
- **Milestone treemap** — 50% information loss; the category dimension has zero hue variation, so the 4×4 cell grid reads as only 4 status groupings.
- **Hierarchy gap** — no coverage surface for "today's primary signal"; an information-architecture defect at the layout level.

Kael's pattern observation: the toolkit-availability error appears in *three* places (Gantt, treemap, Bristol stream) — PR-EF Phase B reads as portfolio-completion, eight chart types because eight chart types had been built.

V-tag intake: V-K-28 (Weekly Intro value-axis), V-K-29 (timeline label truncation), V-K-30 (Gantt wrong-shape), V-K-31 (treemap encoding), V-K-32 (hierarchy primary-surface gap).

---

## 3. PR-EF.1 — the amendment (PR #85, `bf628bec`)

The Architect's call: amendment PR first, restore Care-Region trust, then re-spec the next PR. The Architect also added a finding the roundtable had not caught — **V-M-19** — directly: the Settings diet-preference (`dietPref`) was not consulted by the food-suggestion engine, so a veg-preference household saw non-veg suggestions surface.

PR-EF.1 discharged 9 findings:

| Finding | Fix | File |
|---|---|---|
| V-M-15 | Texture skipped-meal leak — `filter(isRealMeal)` before classification; dedup at food-name level | medical.js |
| V-M-16 | "Color Anomaly" → "Stool Color Pattern" — title/body tonal alignment | template.html |
| V-M-17 | "Foods to Try Next" — group by reason; ≥3 sharing a reason render as heading + chips | intelligence-cards.js |
| V-M-18 | Growth-velocity chart demoted — canvas removed, "View full chart on Medical tab" link added; auto-closes V-M-9 | template.html, medical.js |
| V-M-19 | Diet-preference filter — `getUntriedSuggestions()` now skips `pid==='nonveg'` when `dietPref==='veg'` | intelligence-quicklog.js |
| V-K-28 | Weekly Introduction Rate — "— foods / week" value-axis label added | intelligence-cards.js |
| V-K-29 | Food Intro Timeline labels — word/ampersand-boundary truncation, no fragments | intelligence-cards.js |
| V-K-31 / Cipher A2 | Milestone treemap — category encodes hue, status encodes opacity; dual-legend; label-overflow guarded | medical.js |

All four ship-gates green post-amendment. `audit-viz-smoke` dropped from 5 ids to 4 (the `growthChartInfo` canvas removed per V-M-18; the gate was updated to match).

Merged on the Architect's mark-ready-and-merge. No separate Edict V pass — amendment-only work on already-audited surfaces; the QA chain was exercised at the roundtable in lieu of a formal cycle.

---

## 4. Carry-forwards — what did NOT close

**V-K-30 — Vaccination Gantt is the wrong primitive.** 12 series-lanes for an 8-month-old's vaccine record produce a left-clustered, right-empty blob. The fix is a redesign (single timeline with series-color, or per-series completion rings), not an amendment. Carried to the next PR.

**V-K-32 — info-tab hierarchy primary-surface gap.** 47 cards, all equal visual weight, no "today's headline." This is the information-architecture defect underneath the 3.5/10. A layout-level redesign. Carried to the next PR — and it is, in Kael's framing, *the* defect; the bug-fixes treat symptoms.

**The interactivity layer.** The Architect's explicit next-PR direction: every trend graph — the 8 PR-EF viz *and* the legacy graphs — must be tappable. A parent looking at the Food Intro Timeline today sees dots and cannot answer "when was Mango introduced?" The `<title>` SVG tooltips degrade to nothing on touch devices. The fix is a generic `vizDetailPopup` primitive + per-cell `data-action="vizShowDetail"` wiring via the HR-6 delegation machinery. The Architect also flagged the Feeding Intake card as "vague" — the same interactivity layer addresses it. This is the bulk of the next session.

**The original PR-H (cross-tab design continuation, Tier 1-4).** Withdrawn per Cipher's verdict. The cross-tab survey remains a chronicle-only artifact (s-2026-05-19-01 §3 T4). It cannot proceed until the info-tab's own design is sound — Cipher's reasoning: extending a 3.5/10 surface to other tabs propagates the deficit.

---

## 5. Canon candidates surfaced

Three, all from the roundtable, all awaiting the Architect's wording ratification and a Codex canon-amendment cycle (canon bodies live in Codex per canon-cc-026 §Per-Province-Layout):

**C1 — Viz primitive choice precedes toolkit fit.** Proposed by Cipher, refined by Kael. Draft wording: *"Visualization primitive selection is data-shape-led, not toolkit-availability-led. A card may have no chart."* Addresses the root cause Lyra named — PR-EF chose primitives from the toolkit's empty slots.

**C2 — Tab-level information hierarchy requires a designated primary surface.** Proposed by Cipher. There is no canon today on "what is the lede" for a multi-card tab. The 47-card flat info-tab is the failure this would prevent.

**C3 — The cozy-nursery design brief is a Care-Region promise.** Framed by Maren. Promotes the existing CLAUDE.md §Design brief from a descriptive note to canonical status — a clinical-feeling card does harm by tone alone, and tone is therefore a Care-jurisdiction surface.

---

## 6. Thread worth chronicling — the gap the QA chain doesn't cover

PR-EF passed canon-cc-008 end to end. Maren clear-with-notes, Kael clear-with-notes, Lyra synthesis, Cipher LGTM-after-amendment. Every Hard Rule held. Every ship-gate green. And the result was a 3.5/10 surface.

The QA chain verifies **correctness** and **HR-compliance**. It does not verify **quality of result** — whether a viz actually helps a parent, whether the tone serves the brief, whether the information hierarchy is legible. Those are design judgments, and no companion in the chain owns them as a gate.

The roundtable was the Architect supplying that missing gate manually. The three canon candidates (C1/C2/C3) are an attempt to encode parts of it so the gate is not purely manual next time. But C1-C3 are partial — they catch primitive-selection, hierarchy, and tone. They do not catch "is this viz, at this size, on this device, actually readable by a tired parent." That judgment may not be canon-shaped at all; it may be irreducibly a review act.

The honest entry for the ledger: **the audit chain is necessary and not sufficient.** It was built to catch the failure modes of 2026-05's HR-compliance sweeps. It was not built to catch a feature that is correct, compliant, and mediocre. The 3.5/10 is the evidence.

---

## 7. Carry-forwards (open dispositions for the next session)

**1. The interactivity layer — next PR, primary scope.**
Generic `vizDetailPopup(detail)` primitive (likely `core.js` or `intelligence-cards.js`). Per-cell `data-action="vizShowDetail"` + `data-arg="{json}"` wiring on all 8 PR-EF viz cards and the legacy graphs (bedtime drift, sleep efficiency, wake windows, day/night, regression, nutrient heatmap, combo frequency, meal breakdown, smart pairings, adoption, repetition, texture progression — ~20 surfaces). Estimated ~200-300 LOC for the primitive + ~10-20 LOC per card. The Architect's stated expectation: tap a dot → popup with the full detail ("Mango introduced 14 Apr, reaction OK").

**2. V-K-32 — info-tab hierarchy redesign.**
Designate a primary surface. No card today says "look here first." This is the defect underneath the 3.5/10; the interactivity layer treats readability but not hierarchy. May warrant its own PR or fold into the interactivity PR's layout pass.

**3. V-K-30 — Vaccination Gantt re-shape.**
Wrong primitive. Redesign to single-timeline-with-series-color or per-series completion rings. A test case for canon-candidate C1.

**4. Canon candidates C1 / C2 / C3.**
Await Architect wording ratification → Codex canon-amendment PR. Aurelius routes after ratification.

**5. The original PR-H cross-tab survey.**
Withdrawn, not cancelled. Re-eligible once the info-tab design is sound. Chronicle-only at s-2026-05-19-01 §3 T4.

**6. canon-cc-008-A canonization** (carried from s-2026-05-19-01).
Still awaiting the Codex amendment cycle. Cipher's NOW verdict stands.

**7. Three P3 PR-EF defers + V-M-9** (carried from s-2026-05-19-01).
V-M-9 (growth-chart lazy-init) **auto-closed** this arc — PR-EF.1's V-M-18 removed the unconditional canvas render entirely. The three P3 defers (Intro Rate threshold, Poop Symptoms lag, Vacc Recovery seasonality) remain open, observe-tier.

---

## 8. Session-close note

Five PRs across the full 2026-05-19 session (both arcs): PR-EF (#82), PR-G (#83), chronicle (#84), PR-EF.1 amendment (#85), and this chronicle (#86 pending). Two chronicles — s-2026-05-19-01 for the build arc, this one for the design-review arc.

The session's hardest lesson is in §6: a clean audit chain and a good product are not the same thing, and the gap between them is the design-judgment the chain was never built to hold. The Architect closed that gap by hand this arc. The three canon candidates try to encode part of it. The rest stays a review act — which means the next session opens not with "build PR-H" but with "make the info tab something a parent actually wants to open."

The next session's first question is Cipher's, asked at the roundtable and still unanswered: *what does a parent want to see first when they open the info tab?*

—Aurelius (The Chronicler), invoked at session-close by the Architect's hand
2026-05-19 — second arc, eighth artifact in the s-2026-05-17 / -18 / -19 sequence
