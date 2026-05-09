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

The `<phase>` prefix is a top-level grouping (`onboarding-`, `empty-`, `marketing-`, etc.). The `<arc-position>` is the asset's position in its narrative arc (`1` through `5` for onboarding; per-surface for empty states).

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

All fields are required. If a field doesn't apply (e.g., `seed` for a model that doesn't expose seeds), use `null` and add a `regeneration.notes` explanation.

## 4. Alt-text is NOT in this sidecar

Alt-text for AT users lives at the rendering site (the HTML / template / JS that consumes the asset), NOT in the sidecar. Rationale: alt-text describes the asset's role in its consumption context (which can vary), not the prompt that generated it. PC-2.4 escape contract applies at the consumption site (single-wrap `escAttr` post-PR-ε.0.1 for any user-text alt-text interpolation).

This is a Maren-flagged constraint from Phase 0 framing — *"SD prompts are NOT alt-text."*

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

This convention is currently enforced by:
- **Reviewer manual inspection** during Governor audit.
- **A future grep / lint check** (TBD): every `*.png` in this directory has a `*.prompt.json` sibling, and vice versa.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 9 May 2026 | Initial Phase 0 draft. Audit-base 72b1b22. |
