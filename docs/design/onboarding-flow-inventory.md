# Onboarding Flow Inventory
**Version:** 0.1 (Phase 0 draft) · **Created:** 9 May 2026
**Status:** Phase 0 — copy-first; assets pending Phase A
**Companion to:** `ai-imagery-initiative.md` (Phase A scope)
**Audit-base:** `72b1b22`

---

## 1. Summary

The onboarding flow is SproutLab's first-impression touchpoint. It introduces a new parent to: (a) the brand voice (warm, sturdy, calm — cozy nursery journal), (b) the app's mental model (log → notice → act → reflect), and (c) the differentiating intelligence layer (cross-domain pattern recognition).

This document is **copy-first**: it specifies WHAT each screen says before specifying what each screen LOOKS like. AI imagery generation in Phase A pulls visual briefs from this document; the copy is canonical, the visuals are derivative.

## 2. Voice spec — Option G (generalizable)

**Mode:** second-person, generalizable. Onboarding addresses *any* new parent.

**Pronoun guidance:**
- Subject: "your little one" / "they" / "them" (default); "her" or "him" only AFTER the user enters baby's name + DOB during intake AND optionally provides gender pronouns (default: stay neutral if unprovided).
- Reflexive: "you" / "your" for the parent.
- Avoid: "your baby" (functional but less warm); "the baby" (clinical); specific names like "Ziva" (violates Option G).

**Tone register:**
- **Warm**, not saccharine. *"Every big thing starts small"* — yes. *"Welcome, super-parent!"* — no.
- **Confident**, not authoritative. *"We'll help you act"* — yes. *"You must consult a doctor"* — no, that's medical-overreach.
- **Lyra's voice signature.** Per `CLAUDE.md` Lyra is *"The Weaver — pattern-seeking, warm but precise. Sees connections others miss."* Screen 3 ("Notice") explicitly invokes this — *"we weave the threads."* This is intentional: the brand persona's language surfaces here.

## 3. Narrative arc

**Anchor metaphor:** Botanical — seed → sprout → tending → bloom. (Arc A in the Phase 0 framing discussion.)

**Why this metaphor:** Not a creative choice — it is the brand. SproutLab's literal name encodes the metaphor; the `zi()` icon set already includes `sprout`, `lotus`, `bowl`, `bulb`, `flask`; the 7-domain palette already maps emotionally to growth stages (sage = positive growth, lavender = milestones / reflection, peach = warmth, rose = care). Imagery just makes the existing brand metaphor visible.

**Messaging spine:** Functional verbs (Arc C in the framing discussion):
1. Welcome (brand intro)
2. Tend (logging)
3. Notice (cross-domain intelligence)
4. Watch over (care + medical escalation)
5. Bloom (reflection + growth)

The intake step interrupts between Welcome and Tend (screen 1.5) — see §5.

## 4. Screen-by-screen inventory

### Screen 1 — Welcome

| Field | Value |
|---|---|
| **Intent** | Brand intro; first impression. |
| **Copy (display)** | *"Sprout."* (Fraunces hero word; large.) |
| **Copy (sub)** | *"Every big thing starts small."* |
| **CTA** | "Begin" |
| **Domain color** | sage (positive growth) — `--sage` `#b5d5c5`, `--sage-light` `#e8f5ef` |
| **Visual brief** | A single seed in soft cream nursery light. Cream base (`--cream` `#fffaf7`) with `--sage-light` wash. Subtle vignette suggesting nursery interior without explicit nursery objects. No human figures. |
| **Asset deliverable** | `assets/ai-generated/onboarding-1-welcome.png` |
| **Feature it teaches** | (none — brand only) |
| **Phase A budget** | ~3-5 cr (~4 candidates × ~1cr each in pilot, then 1 final) |

### Screen 1.5 — Intake (form, no hero illustration)

| Field | Value |
|---|---|
| **Intent** | Capture baby identity (name + DOB; optional photo) before personalized voice unlocks. |
| **Copy (display)** | *"Tell us about your little one."* (Fraunces) |
| **Copy (sub)** | *"You can change any of this later."* (Nunito, `--mid` color, smaller) |
| **Form fields** | (1) Name (text input, required); (2) Birth date (date picker, required); (3) Photo (optional, file picker — local-only, never uploaded) |
| **CTA** | "Continue" (disabled until name + DOB filled) |
| **Domain color** | neutral cream + soft sage corner accent (no full-screen domain wash; this is a form, not a hero) |
| **Visual brief** | NO hero illustration. A small (`--icon-md` 18px) `zi('sprout')` watermark in a corner, sage-tinted at low opacity. The screen is functional, not decorative. |
| **Asset deliverable** | (no AI imagery — uses existing `zi()` vocabulary) |
| **Feature it teaches** | The user's data stays local-first (per the privacy-by-architecture posture). |
| **Phase A budget** | 0 cr |

**Why screen 1.5 instead of screen 2:** Inserting the form between Welcome (brand) and Tend (mechanics) lets the brand mood register before friction. Numbering as 1.5 (not promoting to 2) signals to designers that this screen has a different visual register — form, not hero.

### Screen 2 — Tend

| Field | Value |
|---|---|
| **Intent** | Introduce the logging mental model. The app is a journal you write in. |
| **Copy (display)** | *"Tend the small things."* |
| **Copy (sub)** | *"Log sleeps, feeds, firsts. They add up faster than you think."* |
| **CTA** | "Show me how" |
| **Domain color** | sage (primary) + amber (accent for "firsts" / activity) |
| **Visual brief** | Hands cupping a young sprout. Hands stylized — mid-tone skin (representation-neutral), no face, no specific identity markers. Around the sprout: subtle iconography woven into the soil and leaves — feeding bowl, moon (sleep), small star (milestone). The icons are HALF-VISIBLE — suggesting that the daily mechanics are the soil from which growth emerges. |
| **Asset deliverable** | `assets/ai-generated/onboarding-2-tend.png` |
| **Feature it teaches** | Quick Log + Today So Far (the core daily-logging surface). |
| **Phase A budget** | ~3-5 cr |

### Screen 3 — Notice

| Field | Value |
|---|---|
| **Intent** | Reveal the differentiating intelligence layer. The app does not just log — it weaves. |
| **Copy (display)** | *"We weave the threads."* (Lyra's voice signature.) |
| **Copy (sub)** | *"Patterns you'd never spot alone — what helps your little one sleep, what foods agree with them, what's emerging."* |
| **CTA** | "Show me a pattern" |
| **Domain color** | lavender (intelligence) — `--lavender` `#c9b8e8`, `--lav-light` `#f0ebfb` |
| **Visual brief** | Multiple sprouts forming a constellation pattern — three or four sprouts at different positions, gentle lavender-tinted lines connecting them (suggesting cross-domain correlations). The lines should feel hand-drawn, not technical/diagrammatic. Stars or sparkles in negative space. |
| **Asset deliverable** | `assets/ai-generated/onboarding-3-notice.png` |
| **Feature it teaches** | ISL / cross-domain correlations / Smart Q&A (the patent-claim-worthy intelligence layer per `SPROUTLAB_PATENT_CLAIMS_SUMMARY.md` Cluster B). |
| **Phase A budget** | ~3-5 cr |

### Screen 4 — Watch over

| Field | Value |
|---|---|
| **Intent** | Surface the care + medical-escalation surface gently — without becoming clinical. |
| **Copy (display)** | *"We'll watch over."* |
| **Copy (sub)** | *"When something feels off — a fever, an unusual pattern — we'll help you act, not just notice."* |
| **CTA** | "Got it" |
| **Domain color** | rose (care) — `--rose` `#f2a8b8`, `--rose-light` `#fde8ed` — used as soft accent, not dominant; cream base preserved |
| **Visual brief** | A sprout under a soft lantern (or umbrella, or canopy of leaves — pilot will choose). Suggests protection without alarm. The lantern/canopy color picks up rose-soft. NO clinical iconography — no syringe, no thermometer, no stethoscope. The protection metaphor carries the message. |
| **Asset deliverable** | `assets/ai-generated/onboarding-4-watch-over.png` |
| **Feature it teaches** | CareTickets + medical escalation (the second patent-claim-worthy cluster per `SPROUTLAB_PATENT_CLAIMS_SUMMARY.md` Cluster A). |
| **Phase A budget** | ~3-5 cr (this screen has the highest pilot variability — multiple metaphor candidates) |
| **Medical HARD-block reminder** | This screen depicts the *concept* of care, not medical content. Per §6 of the initiative charter, decorative imagery adjacent to a medical concept is permitted; medical-information surfaces themselves are blocked. This onboarding screen does NOT depict vaccination cards, dosing UI, etc. |

### Screen 5 — Bloom

| Field | Value |
|---|---|
| **Intent** | Close the arc; preview the long-term reflective value (scrapbook, milestones). Hand off to the app. |
| **Copy (display)** | *"Watch them unfold."* |
| **Copy (sub)** | *"Months from now, you'll have a journal you couldn't have written alone. Begin."* |
| **CTA** | "Begin" (this is the final CTA; tapping it dismisses onboarding and lands the user on the Home tab.) |
| **Domain color** | peach + multi-domain (this screen is the only one that lets the full palette breathe — peach as warm base + small accents in sage, lavender, rose, sky) |
| **Visual brief** | A mature sprout with first bloom. Adjacent to the sprout: a pressed-leaf scrapbook-page motif (suggests the long-term journal). The bloom should NOT be a generic flower — should carry through the SproutLab visual vocabulary (textured, hand-rendered, warm). Soft sun light suggested. |
| **Asset deliverable** | `assets/ai-generated/onboarding-5-bloom.png` |
| **Feature it teaches** | Scrapbook + milestones + the long-term reflective value. |
| **Phase A budget** | ~3-5 cr |

## 5. Intake step rationale

The intake step (screen 1.5) does NOT use AI imagery. Three reasons:

1. **Functional, not decorative.** The user is filling fields; a hero illustration competes for attention.
2. **Brand consistency.** A `zi('sprout')` watermark from the existing icon set ties the form back to the brand without introducing a new asset class.
3. **Scope discipline.** Adding a 6th hero illustration (~3-5 cr) to a form screen is poor budget allocation; the form's job is data capture, not brand storytelling.

The intake step's data feeds future personalization: post-intake, copy that uses "your little one" can switch to the entered name; "they/them" can switch to gender pronouns IF the user provided that during intake (default: stay neutral if unprovided).

## 6. Asset deliverables list (Phase A)

Five PNG files + five sidecar JSON files:

```
assets/ai-generated/
  onboarding-1-welcome.png
  onboarding-1-welcome.prompt.json
  onboarding-2-tend.png
  onboarding-2-tend.prompt.json
  onboarding-3-notice.png
  onboarding-3-notice.prompt.json
  onboarding-4-watch-over.png
  onboarding-4-watch-over.prompt.json
  onboarding-5-bloom.png
  onboarding-5-bloom.prompt.json
```

Plus:
```
assets/ai-generated/style-preset.json   ← created at Phase A pilot lock-in
```

## 7. Phase A entry conditions

Phase A may begin once ALL of:

1. ✓ This document merged to main (Phase 0 PR closure).
2. ✓ `ai-imagery-initiative.md` charter merged.
3. ✓ `assets/ai-generated/README.md` provenance convention merged (G-2 governance gate).
4. ✓ `assets/ai-generated/style-preset-candidates.md` merged (the 3 candidate stubs ready for pilot).
5. **Sovereign go-ahead** for Phase A entry (after Phase 0 merge).

Phase A first action: style-lock pilot on screen 2 (Tend) — chosen because it has the most visual elements (hands + sprout + woven iconography) so preset variability surfaces strongly. ~9-12 cr expected.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 9 May 2026 | Initial Phase 0 draft. 5 hero screens + 1 intake step. Option G voice. Audit-base 72b1b22. |
