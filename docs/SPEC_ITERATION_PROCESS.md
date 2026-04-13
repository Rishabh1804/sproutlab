# Spec Iteration Process — From Draft to Build-Ready
**Version:** 1.0 · **Created:** 6 April 2026 · **Generalized:** 9 April 2026
**Origin:** Developed during SproutLab's Today So Far spec (8 iterations, ~35 issues found)
**Scope:** General-purpose — applies to any project in this library

---

## The Core Principle

**A spec is build-ready when the builder never has to make an undocumented decision.** Every judgment call — what to include, what to reject, what to defer — is recorded with rationale, so the builder executes rather than designs.

---

## 1. Spec Types

Not all specs need the same rigor. The type determines which passes to emphasize and which to abbreviate.

### Feature Spec
**What:** A new user-facing feature (card, tab, overlay, interaction).
**Characteristics:** Touches multiple data sources, has interaction state, integrates with existing UI, will be extended in future phases.
**Pass emphasis:** All 8 passes, full weight. This is the default.
**Output:** A build-ready document with wireframes, data flow, state management, edge cases, and "What This Does NOT Include."
**Example:** Today So Far card, Bug Capture System, Search Bar Upgrade.

### Architecture / Contract Spec
**What:** A design contract for a subsystem — data layer, API shape, service interface.
**Characteristics:** Defines return shapes and conventions that multiple features consume. Not built standalone — extracted during feature builds.
**Pass emphasis:** Heavy on Pass 2 (data flow) and Pass 3 (integration). Lighter on Pass 4–5 (bugs/drift) since the contract doesn't execute on its own. Pass 6 (builder questions) focuses on: "Will the second consumer understand this API?"
**Output:** A contract document with function signatures, return shapes, no-data contracts, caching strategy, and an evolution plan.
**Example:** Intelligence Service Layer (ISL), Data Layer Contract.

### Migration Spec
**What:** A systematic codebase transformation — replacing one pattern with another across hundreds of call sites.
**Characteristics:** Doesn't add new data flow or UI. Has a grep-countable scope. Needs a hard boundary defining what's in/out of this pass.
**Pass emphasis:** Heavy on Pass 1 (scope definition — what you will and won't touch), Pass 4 (what breaks — since you're touching working code), and Pass 7 (consistency — did you get them all?). Passes 2–3 (data flow, integration) are near-empty because migrations don't add new data paths. A unique pass exists: the **scope boundary pass** — explicitly defining module boundaries for the migration, because migrations on a large codebase are bottomless without a line.
**Output:** A punch list with grep patterns, module scoping, count targets, and verification steps.
**Example:** Emoji→SVG migration (M1), inline styles→CSS classes (M2), onclick→data-action (M3).

### Choosing the Type

| Signal | Type |
|--------|------|
| New UI the user will see and interact with | Feature |
| Defines conventions or shapes for other features to consume | Architecture / Contract |
| Replacing an old pattern with a new one across existing code | Migration |
| Fixing bugs or hardening quality in existing features | Not a spec — use QA_PROCESS.md |

---

## 2. The Eight Passes

One spec. One reviewer. Eight passes. Each pass has a different lens — moving from structural decisions down to data-level edge cases. Each pass has a diminishing return curve. Passes 1–4 find structural and correctness issues. Passes 5–6 find design and integration issues. Passes 7–8 find cosmetic issues and confirm completion.

**The key discipline:** Each pass has a single lens. Don't try to catch bugs during the concept pass. Don't question the concept during the consistency pass. The narrowing focus is what makes each pass productive.

---

### Pass 1: Does the core concept hold?

**Lens:** Is this the right thing to build? Does the problem statement match the solution?

**What to challenge:**
- Solutions that sound elegant in a wireframe but fail on a real device (e.g., a horizontal timeline on a 375px screen)
- Metrics that create pressure instead of insight (e.g., "6 of 9 events" creates a target the user can fail)
- Interactions with no visual signifier (e.g., "tap an empty region" — phantom affordance)

**Outcome:** Foundational design decisions locked. The solution's shape is confirmed.

**What this pass catches:** Wrong solution for the right problem.

**Migration variant:** This pass becomes "scope definition" — explicitly drawing the boundary of what this migration touches and what it doesn't.

---

### Pass 2: Does the data flow work end-to-end?

**Lens:** For every piece of information shown to the user, can you trace it back to a specific data source with a specific access pattern?

**What to challenge:**
- Data sources that don't exist yet
- Access patterns that don't work (e.g., needing a field that isn't stored)
- Threshold values that are arbitrary and will produce noise
- Rendering decisions that can't be implemented with available data

**Outcome:** Every label, detail, and value shown on screen maps to a specific field in a specific data structure.

**What this pass catches:** Data sources that don't exist, access patterns that don't work.

**Migration variant:** Light pass — migrations don't add new data flow. Verify the new pattern doesn't change data semantics.

---

### Pass 3: What are the integration risks with the existing codebase?

**Lens:** This feature doesn't exist in isolation. It sits inside a large app with hundreds of functions. Where will it collide?

**What to challenge:**
- Information shown in both the new feature and existing UI (duplication)
- Concepts in the wireframe that aren't spec'd anywhere (orphaned features)
- Contradictions between wireframe and prose
- Features in the spec that depend on things that don't exist yet

**Outcome:** Every visual element matches a spec'd behavior. No orphaned concepts.

**What this pass catches:** Feature collisions, information duplication, wireframe/prose contradictions.

**Migration variant:** Light pass — the "integration risk" for a migration is regression. Verify the new pattern doesn't break callers.

---

### Pass 4: Will this cause bugs?

**Lens:** Walk through specific scenarios minute-by-minute. What breaks?

**What to look for:**
- Data tables that contradict prose
- Threshold values that produce wrong results in real scenarios
- State conflicts (two rules that give contradictory instructions for the same situation)
- Array access patterns that return the wrong element (`.find()` vs `.filter()`)
- Edge cases: empty state, first use, heavy use, midnight boundary, active sessions
- Missing `escHtml()` on user-sourced text
- Performance: O(n²) loops, uncached repeated computations

**Outcome:** Each bug is either fixed in the spec, documented as a known limitation with a future fix path, or noted as a QA verification item.

**What this pass catches:** Logic errors, state conflicts, data integrity issues, performance problems.

---

### Pass 5: Will this cause bugs weeks or months later?

**Lens:** What assumptions are baked in that will become wrong as data accumulates, user behavior changes, or the app evolves?

**What to look for:**
- Hardcoded thresholds that should change over time
- Lookback windows that will be polluted by exceptional events
- Averages that will lag as patterns shift
- Data volumes that will grow beyond current assumptions

**Outcome:** Each assumption is documented with a monitoring signal and a future fix path.

**What this pass catches:** Temporal assumptions, data pollution, model staleness.

---

### Pass 6: What would a builder hit in the first 30 minutes?

**Lens:** Sit down to build this right now. What makes you stop and ask a question?

**What to look for:**
- Missing patterns in a table (the most consistent items are paradoxically the most forgotten)
- Patterns with "any time" windows that produce meaningless averages
- Data model mismatches between the spec and the existing codebase
- Hardcoded references to specific code locations (line numbers that will shift)
- Interaction handlers that conflict with existing delegation patterns
- Pre-selection or default values that aren't specified

**Outcome:** Every builder-stopping question has a documented answer.

**What this pass catches:** Missing patterns, mechanism references that rot, interaction conflicts.

---

### Pass 7: Final consistency check

**Lens:** Read every line. Does every section agree with every other section?

**What to look for:**
- References to items removed in earlier iterations
- Missing fields in data shape definitions
- Undefined terms used as if they were defined
- Priority orders that include removed items
- Return type definitions missing fields that the prose references

**Outcome:** Internal consistency verified. No section contradicts another.

**What this pass catches:** Stale references, missing fields, undefined terms.

---

### Pass 8: Is it done?

**Lens:** Am I finding real issues or manufacturing them?

**Signal:** When the reviewer is reaching for cosmetic issues (a parenthetical inconsistency, a dead line that can never fire), the spec is done. Attempting Pass 9 would produce noise.

**Outcome:** Spec declared build-ready.

---

## 3. The Pattern

```
Pass 1:  Concept level     — "Is this the right thing?"
Pass 2:  Data flow level   — "Can this be built?"
Pass 3:  Integration level — "Where does it collide?"
Pass 4:  Bug level         — "What breaks today?"
Pass 5:  Drift level       — "What breaks in 3 months?"
Pass 6:  Builder level     — "What makes someone stop and ask?"
Pass 7:  Consistency level — "Does it agree with itself?"
Pass 8:  Completion level  — "Am I done?"
```

---

## 4. Standard Spec Sections

Every feature spec should include these sections (adapt as needed for architecture and migration specs):

| Section | Purpose |
|---------|---------|
| **Problem** | Why this feature exists. What's broken or missing today. |
| **Solution** | The approach, with rationale for why this approach over alternatives. |
| **Data Flow** | Every data source, access pattern, and transformation. |
| **UI / Wireframe** | Visual layout with annotation. Wireframe matches prose exactly. |
| **State Management** | What persists, what resets, on what trigger. |
| **Integration** | Where this touches existing features. Duplication, conflicts, precedence. |
| **Edge Cases** | Empty state, first use, heavy use, midnight boundary, active sessions. |
| **What This Does NOT Include** | Every rejected option with documented rationale. |
| **Known Assumptions** | Each with a monitoring signal and future fix path. |
| **Future Expansion** | Items with enough context to be spec'd independently. |
| **Line Estimate** | Validated against actual function complexity. |
| **Implementation Plan** | Ordered steps with estimated lines per step. |
| **Files Needed** | What the builder uploads to start the session (apply context budget rules from SESSION_PROTOCOL.md §4). |

---

## 5. Build-Ready Checklist

Before declaring a spec build-ready, verify:

- [ ] Wireframe matches prose (no orphaned concepts, no contradictions)
- [ ] Every data field shown traces to a specific source with access pattern
- [ ] Every interaction has defined behavior (tap, expand, dismiss, re-render)
- [ ] State management is explicit (what persists, what resets, on what trigger)
- [ ] Integration with existing features is documented (duplication, conflicts, precedence)
- [ ] Edge cases covered: empty state, first use, heavy use, midnight boundary, active sessions
- [ ] Performance addressed (caching, render frequency, data scan scope)
- [ ] Security addressed (escHtml for all user-sourced text in innerHTML)
- [ ] Known assumptions documented with monitoring signals
- [ ] "What This Does NOT Include" section exists with rationale for each rejection
- [ ] Future expansion items have enough context to be spec'd independently
- [ ] Line estimate is realistic (validated against actual function complexity)
- [ ] The reviewer is reaching for cosmetic issues (completion signal)

---

## 6. When to Use This Process

**Use it for:** Features that touch 3+ data sources, have interaction state (accordion, expansion, modals), integrate with existing UI, or will be extended in future phases.

**Don't use it for:** Bug fixes, CSS tweaks, copy changes, or features that are fully isolated with no integration surface. Those go straight to build.

**For QA/hardening sessions:** Use QA_PROCESS.md instead. Its output is a punch list document, not a build-ready feature spec. These are parallel processes — SPEC_ITERATION_PROCESS creates specs for new things; QA_PROCESS creates plans for hardening existing things. The routing table in ONBOARDING.md makes this boundary explicit.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 9 Apr 2026 | Generalized from SproutLab-specific version. Added spec types (feature, architecture, migration). Added standard spec sections. Added migration pass variants. Clarified QA_PROCESS boundary. |

---

*This document defines how to write build-ready specs. QA_PROCESS.md defines how to run quality audits. ARCHITECTURE_PATTERNS.md defines shared engineering patterns. Per-app Design Principles define visual design systems.*
