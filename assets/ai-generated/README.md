# AI-Generated Assets — Provenance Convention
**Version:** 0.1 (Phase 0 draft) · **Created:** 9 May 2026
**Audit-base:** `72b1b22`
**Companion to:** `docs/design/ai-imagery-initiative.md` §7 governance gate G-2

---

## 1. Purpose

This directory holds AI-generated imagery used by SproutLab. Every asset in this directory MUST follow the provenance convention below — no exceptions, no retrofits.

The convention exists because:
1. **Reproducibility.** SD model versions deprecate, prompts evolve, and seeds are forgotten. Without sidecar metadata, we cannot regenerate or audit an asset's origin.
2. **Legal posture.** SD training-data legal status is volatile (live lawsuits as of 2026). If the model used to generate an asset becomes legally encumbered, the sidecar lets us identify which assets need regeneration with a different model.
3. **Provenance audit.** Future Governors auditing the initiative need to verify each asset was generated with a sanctioned preset, not ad-hoc prompts.

## 2. Asset path convention

Every asset:

```
assets/ai-generated/<name>.png
assets/ai-generated/<name>.prompt.json
```

Both files MUST land in the same commit. An asset without its sidecar (or vice versa) is a contract violation; a future enforcement grep will fail (see §9).

**Naming pattern:** `<phase>-<arc-position>-<descriptor>`

Examples:
- `onboarding-1-welcome` (Phase A; arc position 1; descriptor "welcome")
- `onboarding-3-notice`
- `empty-diet-no-foods` (Phase B.1; arc position by surface; descriptor "no-foods")
- `marketing-appstore-hero` (Phase B.2; arc position substituted for surface-context; descriptor "hero")
- `scrapbook-milestone-rolling` (Phase B.3; arc position substituted for celebration-trigger; descriptor "rolling")

The `<phase>` prefix is a top-level grouping (`onboarding-`, `empty-`, `marketing-`, `scrapbook-`, etc.). The `<arc-position>` is the asset's position in its narrative arc (`1` through `5` for onboarding) — for non-narrative phases, `<arc-position>` degrades gracefully to a context-key: surface-key for empty states, surface-context for marketing, celebration-trigger for scrapbook decorative. The convention is "narrative when narrative exists; context-key otherwise."

## 3. Sidecar JSON schema

Every `<name>.prompt.json` follows this shape:

```json
{
  "asset": "<name>",
  "generated_at": "ISO 8601 datetime — UTC",
  "model": {
    "name": "stable-diffusion-xl-1.0 | sd3-medium | sd3-large | flux-dev | ...",
    "version": "specific version string from the SD provider",
    "provider": "stability-ai | replicate | huggingface | local"
  },
  "style_preset_ref": "path or git-commit ref to the style preset used (e.g., 'assets/ai-generated/style-preset.json @ 72b1b22')",
  "prompt": "the full positive prompt as sent to the model",
  "negative_prompt": "the full negative prompt as sent to the model",
  "parameters": {
    "sampler": "string (e.g., 'DPM++ 2M Karras')",
    "cfg_scale": 7.5,
    "steps": 30,
    "width": 1024,
    "height": 1024,
    "seed": 1234567890
  },
  "extensions": {
    "scheduler": "string or null (separable from sampler in some pipelines; e.g., 'Karras', 'Exponential')",
    "clip_skip": "integer or null (affects style-output significantly; SDXL+ surfaces)",
    "denoising_strength": "float 0.0-1.0 or null (img2img / inpainting)",
    "lora_refs": [
      { "name": "string", "weight": 0.7, "version": "string" }
    ],
    "controlnet_refs": [
      { "model": "string", "weight": 1.0, "preprocessor": "string" }
    ],
    "inpainting_mask_ref": "path to mask image or null",
    "random_seed_method": "cpu | gpu | null (CPU vs GPU seed differ on identical numeric values across providers — silent bit-non-equivalence)"
  },
  "regeneration": {
    "reproducible": true,
    "notes": "any caveats — e.g., 'model version-locked; provider deprecation will require re-pin'"
  },
  "review": {
    "selected_by": "Maren | Sovereign | <reviewer>",
    "reviewed_at": "ISO 8601 datetime",
    "alternatives_considered": 4,
    "selection_rationale": "one-sentence why-this-one"
  }
}
```

All top-level fields are required. The `extensions` sub-object is **optional but present-when-applicable**: if the generation pipeline used any of the listed features (LoRA, ControlNet, inpainting, non-default scheduler, clip skip, etc.), the corresponding `extensions` field MUST be populated. Empty `lora_refs: []` / `controlnet_refs: []` arrays are valid (declares "none used"); omitting the field entirely is invalid for any non-trivial pipeline. If a top-level field doesn't apply (e.g., `seed` for a model that doesn't expose seeds), use `null` and add a `regeneration.notes` explanation. Forward-compatibility note: `extensions` is open-shape — future SD generations may add fields without breaking schema validation; existing fields MUST NOT be removed without a schema version bump.

## 4. Alt-text is NOT in this sidecar

Alt-text for AT users lives at the rendering site (the HTML / template / JS that consumes the asset), NOT in the sidecar. Rationale: alt-text describes the asset's role in its consumption context (which can vary), not the prompt that generated it. PC-2.4 escape contract applies at the consumption site (single-wrap `escAttr` post-PR-ε.0.1 for any user-text alt-text interpolation).

This is a Maren-flagged constraint from Phase 0 framing — *"SD prompts are NOT alt-text."*

## 4.1 Alt-text discipline at consumption site

Builder-binding rules for the alt-text contract when an asset is rendered:

- **Screen 4 ('Watch over') and any future medical-adjacent decorative imagery:** alt-text SHOULD be empty (`alt=""`), marking the imagery as decorative. The copy carries the meaning; alt-text MUST NOT duplicate or paraphrase medical-adjacent copy. Parent-AT-user reading the screen with alt-text empty hears the copy *"We'll watch over"* without redundant noise; reading with alt-text *"sprout under a soft lantern"* gets paraphrased imagery that competes with the meaning-carrying copy.
- **Screens 1, 2, 3, 5 (non-medical-adjacent decorative imagery):** alt-text describes the role-in-arc, not the image content. Example: `alt="Welcome"` for screen 1, NOT `alt="A seed in soft cream light"`. The role-in-arc is what the parent-AT-user needs to understand the screen's place in the onboarding sequence.
- **Any non-empty alt-text rendered via templating:** MUST flow through `escAttr` per HR-4 PC-2.4 single-wrap (post-PR-ε.0.1). User-text alt-text interpolation is a render-boundary that requires the standards-compliant escape contract.

The Maren-flagged constraint from Phase 0 framing remains canonical — *"SD prompts are NOT alt-text"* — and §4.1 above codifies what alt-text IS at consumption site.

## 5. Naming an asset

Before generating an asset, register its name in the relevant flow inventory document (e.g., `docs/design/onboarding-flow-inventory.md` §6). The flow inventory is the registry of WHICH assets the initiative produces; this directory holds WHERE they land.

## 6. Regeneration procedure

If an asset needs regeneration (model deprecation, legal status change, design preference shift):

1. Read the sidecar JSON to recover prompt + parameters + style preset ref.
2. Pin the same model version if available; if not, use the closest equivalent and document the substitution in `regeneration.notes`.
3. Re-run with the same seed if reproducibility matters; new seed if a fresh aesthetic is desired.
4. Update the sidecar with new `generated_at`, new `seed` (if changed), and a `regeneration.notes` entry describing the trigger.
5. Both files (PNG + sidecar) update in the same commit.

## 7. Style preset companion file

When a Phase locks a style preset (per the G-1 governance gate), the locked parameters land as `style-preset.json` in this directory:

```
assets/ai-generated/style-preset.json
```

Each `<name>.prompt.json` references this file via `style_preset_ref`. Updating the style preset is a Maren+Sovereign decision (preset changes affect ALL future assets); style preset updates do NOT retroactively regenerate existing assets — those are pinned to whatever preset was active when they were generated (sidecar tracks via git ref).

## 8. Forbidden contents

This directory does NOT hold:

- **Source assets** (logos, designer-authored illustrations, photographs) — those go in `assets/source/` (a future directory if needed).
- **Build artifacts derived from AI imagery** (e.g., compressed / resized variants) — those go in `assets/derived/` (a future directory if needed).
- **Assets without sidecars** — contract violation.
- **Sidecars without assets** — contract violation.

## 9. Enforcement

This convention is enforced by:
- **Reviewer manual inspection** during Governor audit (current state).
- **An enforcement grep / lint check**: every `*.png` in this directory has a `*.prompt.json` sibling, and vice versa.

**Phase A obligation:** the enforcement grep MUST be added as part of the Phase A PR — either as a CI check (if SproutLab gains CI) OR as a manual `bash` snippet committed to `tools/check-ai-asset-pairs.sh` and invoked at PR-author discipline. **Not deferrable to Phase B.x.** The Phase A PR is the FIRST exposure to the same-commit pairing rule; deferring the grep to Phase B multiplies the coverage-gap volume across multiple Phases without first-failure feedback. Closing the gap at the moment of first exposure is the binding constraint.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 9 May 2026 | Initial Phase 0 draft. Audit-base 72b1b22. |
