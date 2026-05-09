# AI Imagery Initiative
**Version:** 0.1 (Phase 0 charter draft) · **Created:** 9 May 2026
**Status:** Phase 0 — design-doc spike (zero SD credits consumed)
**Branch:** `claude/ai-imagery-initiative-phase-0`
**Audit-base:** `72b1b22` (PR-ε.0.1 squash-merge tip)

---

## 1. Summary

Initiative scope: introduce AI-generated imagery (Stable Diffusion) into SproutLab as a brand asset layer. Initial pool: 4000 credits. First use case: onboarding illustrations. Sequenced expansion thereafter (Phase B candidates documented but deferred until Phase A lands cleanly).

The initiative inherits SproutLab's brand brief verbatim — *"warm, sturdy, calm. A cozy nursery journal, not a clinical health app."* (`CLAUDE.md`, `DESIGN_PRINCIPLES.md`). All design constraints below derive from that brief.

## 2. Scope

### In-scope (Phase A)
- 5 hero illustrations + 1 intake screen for the onboarding flow (per `onboarding-flow-inventory.md`)
- 1 locked style preset (selected via Phase A pilot from the 3 candidates in `assets/ai-generated/style-preset-candidates.md`)
- Provenance convention (sidecar JSON per asset; per `assets/ai-generated/README.md`)

### Out-of-scope (Phase B+ — deferred, documented)
- Empty-state illustrations (per-domain × per-feature; ~15-25 assets)
- Marketing site / app store screenshots
- Social share preview imagery
- In-app educational graphics
- Decorative imagery for scrapbook/milestone celebrations
- Loading-state / micro-interaction illustrations

### Hard-blocked (initiative-lifetime, not just Phase A)
Any imagery in clinical/medical-information surfaces — see §6 medical-domain HARD-block clause.

## 3. Use-case roadmap

| Phase | Scope | Credit estimate | Entry condition |
|---|---|:-:|---|
| **Phase 0** (current) | Design-doc spike: charter + flow inventory + provenance convention + 3 style preset candidates | 0 | PR-ε.0.1 merged ✓ |
| **Phase A** | Onboarding: 5 hero + 1 intake; style preset pilot + lock + bulk-generate | 75-120 | Phase 0 PR merged + Sovereign go-ahead on preset selection |
| **Phase B.1** | Empty-state illustrations (per-domain) | ~150-300 | Phase A landed + style preset proven across ≥2 use cases |
| **Phase B.2** | Marketing assets (app store, social share) | ~80-150 | Phase B.1 landed |
| **Phase B.3** | In-app decorative assets (scrapbook, celebrations) | ~100-200 | Phase B.2 landed |

## 4. Budget framework

**Pool:** 4000 SD credits (granted 9 May 2026).

**Allocation doctrine: 70 / 20 / 10**
- **70%** (2800 cr) — production assets across Phase A → Phase B.3
- **20%** (800 cr) — iteration headroom (style preset pilot retries, asset re-generation, prompt-tuning rounds)
- **10%** (400 cr) — post-launch reserve (asset replacement if SD policy / training-data legal status invalidates an asset class)

**Per-Phase cap:** No single Phase consumes >40% of the production allocation without explicit Sovereign re-authorization. Phase A cap: 1120 cr (40% of 2800) — well above the 75-120 cr estimate.

**Burn-rate gate:** if any Phase exceeds 1.5× its credit estimate, Phase auto-pauses for Sovereign re-scope before continuation.

## 5. Design constraints (load-bearing rules)

These are NON-NEGOTIABLE for the initiative lifetime. Derived from Maren's design lens during Phase 0 framing discussion.

### DC-1: Flat / vector-graphic style; never photoreal
**Rule:** All AI-generated imagery uses flat-graphic, vector-style, or watercolor-illustration aesthetic. Photoreal imagery is FORBIDDEN.

**Why:** SproutLab's brand brief is *"cozy nursery journal, not clinical health app."* Photoreal imagery in a baby-tracking surface raises (a) uncanny-valley risk, (b) confusion with clinical/referential medical imagery, and (c) representation governance overhead at face level. Flat-graphic is unambiguously decorative.

**Enforcement:** Every style preset candidate's `style_modifiers` field MUST include `flat illustration` / `vector graphic` / `watercolor` / equivalent; every preset's `negative_prompt` MUST include `photorealistic`, `photograph`, `realistic`, `hyperrealistic`.

### DC-2: No human faces by default
**Rule:** AI-generated imagery does NOT depict identifiable human faces. Hands, silhouettes, back-views, environmental cues, and metaphorical figures are permitted.

**Why:** SD's highest-bias / highest-uncanny surface is face generation. SproutLab's deployment posture (publicly-deployed for any new parent post-Option-G) makes specific-baby depiction (a) privacy-confused if it implies the actual user's child, (b) representation-governed if it implies a specific demographic. Metaphor-only avoids both failure modes.

**Enforcement:** Every preset's `negative_prompt` MUST include `face`, `portrait`, `person`, `child`, `baby` (the metaphor carries the meaning, not literal depiction). Exceptions require explicit Maren+Sovereign sign-off PER ASSET, not per preset.

### DC-3: Narrative arc cohesion
**Rule:** Imagery in any single deployment context (e.g., the onboarding flow) must share a narrative arc — the assets together tell a progression, not just decorate independently.

**Why:** Disconnected imagery feels stock-photo-ish and undermines brand cohesion. SproutLab's brand identity emerges from its *consistency* (7-domain palette, Fraunces+Nunito typography, `zi()` icon set) — AI imagery must honor that consistency principle.

**Enforcement:** Every flow inventory document (e.g., `onboarding-flow-inventory.md`) MUST declare a narrative arc anchor (the metaphor) and per-screen role-in-arc (e.g., "screen 3 — pattern recognition moment"). Reviewer manual inspection.

### DC-4: Locale-neutral, palette-cohesive
**Rule:** AI-generated imagery is locale-neutral (no culturally-specific imagery unless the surface is explicitly localized) and pulls color anchors from SproutLab's 7-domain palette tokens (`--sage`, `--rose`, `--amber`, `--lavender`, `--sky`, `--indigo`, `--peach`).

**Why:** SproutLab is publicly deployed; localization is not yet planned. Cultural neutrality is the safest default. Palette cohesion ensures generated assets visually integrate with the existing rendered UI surfaces, not feel bolted-on.

**Enforcement:** Every preset's `style_modifiers` MUST reference the active palette by hex value or token name (palette is locked per `DESIGN_PRINCIPLES.md` §1). Negative prompts SHOULD exclude culturally-marked elements unless the asset is explicitly localized.

## 6. Medical-domain HARD-block clause

**Rule:** AI-generated imagery is FORBIDDEN in any clinical or medical-information surface. This includes:

- Vaccination cards, schedules, and reaction tracking (`medical.js` vacc surface)
- Symptom guidance / illness episode tracking (fever / diarrhoea / vomiting / cold; `intelligence.js`)
- Doctor management / visit logs / consultation surfaces
- CareTickets banner / state UI
- Growth percentile / gauge surfaces
- Medication tracking / dosing displays
- Any UI that presents medically-actionable information

**Why:** SD models hallucinate anatomy, dosing visuals, instrument detail, and procedural correctness. Even decoratively-intended imagery in a medical-information context invites confusion about whether the imagery is *illustrative* or *referential*. This is a parent-safety surface — Maren's *"what if this data is wrong and a parent acts on it?"* lens applies AT MAXIMUM intensity to imagery in these surfaces.

**Boundary clarification:** Decorative imagery for *non-medical* surfaces that happens to coexist on a screen with medical information is permitted (e.g., the Today So Far timeline can show a decorative sprout next to a feed entry). The hard-block applies to the medical-information surface itself — vaccination card backgrounds, illness-episode chips, etc.

**Override:** This clause has NO override path. If a future surface needs imagery that touches a medical context, the surface design must change to remove the medical context first; the imagery cannot override the block.

## 7. Governance gates

Two gates control progression to bulk asset generation. Both apply to every Phase that involves new asset generation (not only Phase A).

### G-1: Style-lock pilot before bulk generation
**Rule:** Before any bulk asset generation, generate ≥3 candidates for ONE reference asset across 2-3 style presets. Maren picks the winner. The winning preset's parameters (style modifiers + negatives + sampler/cfg/steps + seed range) are frozen into a checked-in `style-preset.json` companion file in the same directory.

**Why:** SD without a frozen style preset produces stylistic drift across batches — week-1 assets won't match week-4 assets. Pilot-first establishes the preset is reproducible BEFORE we commit credits to bulk.

**Estimated cost:** ~9-12 credits per pilot.

### G-2: Provenance convention codified first
**Rule:** Before the FIRST asset lands, the provenance convention (sidecar JSON shape, naming, regen procedure) MUST be codified as a load-bearing rule (`assets/ai-generated/README.md`).

**Why:** Provenance retrofit is harder than provenance-from-day-1. SD policy / training-data legal status is volatile — without provenance metadata committed alongside each PNG, we cannot reproduce assets if the model used becomes unavailable.

**Status:** G-2 satisfied by Phase 0 itself (this is Phase 0's deliverable).

## 8. Audit chain

The initiative inherits SproutLab's PR-ε audit chain shape:

1. **Builder (Lyra)** — drafts each Phase's deliverables on a feature branch; opens draft PR.
2. **Governors (Maren + Kael)** — parallel audits. Maren on design-constraint compliance (DC-1 through DC-4 + medical HARD-block); Kael on governance compliance (budget, provenance, gate satisfaction).
3. **Lyra synthesis** — Builder folds Governor findings.
4. **Cipher cross-cut** — Edict V cross-cutting pass for any cross-domain compliance gaps Governors didn't catch.
5. **Aurelius final pass** — closing read.
6. **Sovereign mark-ready + merge.**

The chain runs in full for Phase A and Phase B.x; Phase 0 (this charter) runs an abbreviated chain (Builder → light Governor read → Sovereign mark-ready), since Phase 0 lands no assets and consumes no credits.

## 9. Phase definitions

| Phase | Deliverable | Branch | Status |
|---|---|---|---|
| **Phase 0** | This charter + flow inventory + provenance README + 3 style preset candidates | `claude/ai-imagery-initiative-phase-0` | **In progress** (this PR) |
| **Phase A** | Onboarding-flow assets: style-lock pilot + 5 hero PNGs + intake-screen integration | TBD | Pending Phase 0 merge |
| **Phase B.1** | Empty-state illustrations | TBD | Deferred |
| **Phase B.2** | Marketing assets | TBD | Deferred |
| **Phase B.3** | In-app decorative assets | TBD | Deferred |

## 10. Open questions

None at Phase 0 entry. All clarifications resolved during framing discussion:
- Use-case priority — onboarding-first ✓ (Sovereign)
- Audience scope — Option G (generalizable) ✓ (Sovereign)
- Sequencing — post-PR-ε.0.1-merge ✓ (Sovereign)
- Branch shape — fresh branch + draft PR ✓ (Sovereign)
- Narrative arc — Arc A (botanical) × Arc C (functional verbs) hybrid ✓ (Sovereign)

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 9 May 2026 | Initial Phase 0 charter draft. Audit-base 72b1b22. |
