# Style Preset Candidates (Phase A pilot)
**Version:** 0.1 (Phase 0 draft) · **Created:** 9 May 2026
**Status:** 3 candidates ready for Phase A style-lock pilot
**Companion to:** `docs/design/ai-imagery-initiative.md` §7 governance gate G-1
**Audit-base:** `72b1b22`

---

## 1. Purpose

Phase A's first action is the **style-lock pilot**: generate ≥3 candidates for ONE reference asset across the 3 style presets below, then Maren picks the winner and freezes the preset into `style-preset.json`. This document specifies the 3 candidates.

**Reference asset for the pilot:** Onboarding screen 2 (Tend) — chosen because it has the most visual elements (hands + sprout + woven iconography), so preset variability surfaces strongly.

**Total pilot cost estimate:** ~9-12 SD credits (3 presets × ~3 candidates each, at ~1 cr each).

## 2. Style preset doctrine

Every candidate must satisfy ALL design constraints from `ai-imagery-initiative.md` §5:

- **DC-1** Flat / vector-graphic / watercolor — never photoreal.
- **DC-2** No human faces.
- **DC-3** Narrative arc cohesion (the preset must look natural across all 5 onboarding screens, not just screen 2).
- **DC-4** Locale-neutral; pulls colors from the 7-domain palette.

Each candidate below specifies: `style_modifiers` (positive prompt tail), `negative_prompt`, `parameters` (sampler / cfg / steps / dimensions), and assessment notes.

## 3. Candidate A — Soft botanical watercolor

**Aesthetic:** Hand-rendered watercolor on warm cream paper. Soft edges, organic washes, slight grain. Reminiscent of a vintage botanical journal or nursery storybook.

```yaml
style_modifiers: |
  soft watercolor illustration, botanical journal style,
  warm cream paper background, hand-rendered organic edges,
  gentle color washes, subtle paper grain texture,
  cozy nursery aesthetic, palette of sage green (#b5d5c5),
  rose (#f2a8b8), amber (#e8b86d), lavender (#c9b8e8), peach (#fad4b4),
  cream base (#fffaf7), warm soft lighting,
  no text, no logos, no human faces

negative_prompt: |
  photorealistic, photograph, hyperrealistic, 3D render,
  digital painting, harsh edges, neon, saturated, vivid,
  face, portrait, person, child, baby, human figure (full body),
  clinical, medical, hospital, sterile, white background,
  text, logo, watermark, signature,
  cluttered, busy, complex composition

parameters:
  sampler: DPM++ 2M Karras
  cfg_scale: 6.5
  steps: 30
  width: 1024
  height: 1024
  seed_range: 1000000–9999999  # record per-asset in sidecar
```

**Pros:**
- Strongest brand-fit. Watercolor + botanical journal aesthetic IS the brand brief verbatim.
- Easiest to keep consistent across 5 screens (watercolor's organic edge tolerates compositional variety without breaking visual cohesion).
- Nursery-storybook association — emotionally resonant for new parents.

**Cons:**
- Watercolor "splotches" can render unpredictably for SD models — pilot must verify the model can produce clean watercolor at our prompt depth.
- May feel TOO soft / vintage if executed shallowly; needs the right cfg + sampler tuning to keep clarity.

**Recommendation:** Strong default. The closest match to *"cozy nursery journal."*

## 4. Candidate B — Modern flat-graphic with grain

**Aesthetic:** Solid-color flat shapes with a subtle film-grain or paper-texture overlay. Modernist illustration style — think contemporary children's book illustration (e.g., Jon Klassen, Christian Robinson) but warmer and more nursery-coded.

```yaml
style_modifiers: |
  flat illustration, modern children's book illustration style,
  solid color shapes, slight film grain texture,
  cream paper background (#fffaf7),
  palette of sage green (#b5d5c5), rose (#f2a8b8), amber (#e8b86d),
  lavender (#c9b8e8), peach (#fad4b4),
  warm minimalist composition, geometric simplicity,
  cozy nursery aesthetic, soft shadows,
  no text, no logos, no human faces

negative_prompt: |
  photorealistic, photograph, 3D render,
  watercolor, painterly, soft edges, blurry,
  face, portrait, person, child, baby, human figure (full body),
  clinical, medical, hospital, sterile,
  text, logo, watermark, signature,
  neon, saturated, vivid, harsh contrast,
  cluttered, busy

parameters:
  sampler: Euler a
  cfg_scale: 7.0
  steps: 28
  width: 1024
  height: 1024
  seed_range: 1000000–9999999
```

**Pros:**
- Most reproducible across 5 screens — flat-graphic tolerates compositional variety better than watercolor.
- Contemporary feel — won't date as quickly as watercolor (which can feel "vintage" if not careful).
- Clean integration with the existing `zi()` icon set (which is itself modern flat-graphic).

**Cons:**
- Risks feeling "design-system-y" or corporate-app — less nursery-warm than Candidate A.
- The grain overlay is the difference between "warm modern" and "cold modern" — pilot must verify SD applies grain consistently.

**Recommendation:** Strong alternative. Most consistent with the existing icon set, but cooler in mood.

## 5. Candidate C — Storybook illustration

**Aesthetic:** Slightly more rendered than Candidate A — gentle pencil-line accents over watercolor washes, with warm volumetric lighting. Reminiscent of classic children's storybooks (think early-reader picture books — Eric Carle's warmth, Beatrix Potter's tenderness, but updated for modern nursery aesthetic).

```yaml
style_modifiers: |
  storybook illustration, gentle pencil line work over soft watercolor washes,
  warm volumetric lighting, cream paper background,
  hand-rendered, slightly textured,
  palette of sage green (#b5d5c5), rose (#f2a8b8), amber (#e8b86d),
  lavender (#c9b8e8), peach (#fad4b4), cream (#fffaf7),
  cozy nursery, gentle warmth, soft afternoon light,
  classic children's book aesthetic,
  no text, no logos, no human faces

negative_prompt: |
  photorealistic, photograph, 3D render, digital painting,
  flat vector, geometric, harsh edges,
  face, portrait, person, child, baby, human figure (full body),
  clinical, medical, hospital, sterile,
  text, logo, watermark, signature,
  neon, saturated, vivid,
  cluttered, busy, complex composition

parameters:
  sampler: DPM++ 2M Karras
  cfg_scale: 6.0
  steps: 35
  width: 1024
  height: 1024
  seed_range: 1000000–9999999
```

**Pros:**
- Strongest emotional warmth of the three — explicitly references the children's-book heritage that nursery imagery borrows from.
- The pencil-line accents add character that pure watercolor (Candidate A) sometimes lacks.

**Cons:**
- Hardest to keep consistent — pencil-line + watercolor + volumetric lighting = three style elements that SD must compose reliably.
- Risk of feeling "too rendered" / kid-app-y — could read as "for the baby" rather than "for the parent of the baby" (the actual user).

**Recommendation:** Wildcard. If Maren wants maximum emotional warmth, this is it. If consistency-across-5-screens matters more, Candidates A or B are safer.

## 6. Pilot test plan

| Step | Action | Estimated cost |
|---|---|:-:|
| 1 | Generate ~3 candidates per preset for screen 2 (Tend) — total 9 images | ~9 cr |
| 2 | Maren reviews; selects best preset OR requests one round of refinement (e.g., "Candidate A is closest but increase grain") | 0 cr (review) |
| 3 | (Optional) refinement round: regenerate the leading preset with adjusted parameters | ~3 cr |
| 4 | Maren locks final preset; Builder writes `assets/ai-generated/style-preset.json` (the locked parameters) | 0 cr |
| 5 | Sovereign go-ahead to Phase A bulk generation (5 hero PNGs) | 0 cr |

**Total pilot cost:** 9-12 cr. Within the 20% iteration headroom budget.

**Pilot pass condition:** ALL of (a) selected preset honors all 4 design constraints; (b) Maren approves the aesthetic; (c) Sovereign signs off on the locked preset. Without all three, pilot extends with another refinement round.

**Pilot fail condition:** None of the 3 candidates produce acceptable results in 2 refinement rounds total. In this case, Phase A pauses; Maren proposes 3 NEW candidates; Sovereign re-approves the new candidate set before another pilot. (Unlikely scenario; documented for completeness.)

## 7. Post-pilot artifact: `style-preset.json`

After pilot lock, the chosen preset's parameters land as:

```json
{
  "preset_name": "<A | B | C | A-refined | ...>",
  "version": "1.0",
  "locked_at": "ISO 8601 datetime",
  "locked_by": "Maren + Sovereign",
  "model": {
    "name": "...",
    "version": "...",
    "provider": "..."
  },
  "style_modifiers": "...",
  "negative_prompt": "...",
  "parameters": { "sampler": "...", "cfg_scale": 0, "steps": 0, "width": 0, "height": 0 },
  "design_constraint_compliance": {
    "DC-1": "verified — flat / watercolor",
    "DC-2": "verified — no faces",
    "DC-3": "verified — coheres across all 5 screens",
    "DC-4": "verified — palette anchored to 7-domain tokens"
  },
  "alternative_candidates_considered": ["A", "B", "C"],
  "selection_rationale": "..."
}
```

This file is the load-bearing reference for every asset's `prompt.json` `style_preset_ref` field.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 9 May 2026 | Initial Phase 0 draft. 3 candidates: A (watercolor), B (flat-graphic), C (storybook). Audit-base 72b1b22. |
