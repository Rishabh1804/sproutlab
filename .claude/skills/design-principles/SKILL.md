---
name: design-principles
description: "SproutLab's canonical visual + UX law — the design floor for every card, section, screen, component, toast, chart, color, font, animation, and render boundary. Use BEFORE designing, building, restyling, or reviewing ANY UI in SproutLab: a new feature or card, an info-tab render, a Today So Far row, a CSS token choice, a domain-color assignment, a layout, or an overlay. Surfaces docs/DESIGN_PRINCIPLES.md (7 domain colors, Fraunces/Nunito typography, HR-1..HR-12 zero-tolerance rules, animation foundation, the half-awake test). If you are about to touch how SproutLab LOOKS or FEELS, read this first."
trigger: /design-principles
---

# /design-principles — the SproutLab design floor

**The canonical body lives at `docs/DESIGN_PRINCIPLES.md`** (the `@import` floor in
`CLAUDE.md`, ~670 lines, version-tracked). This skill is the *unmissable doorway* to it:
a fast quick-reference plus the standing instruction to **read the full doc before you
design**. The doc is authoritative; this is the index. When they disagree, the doc wins.

> **Standing rule.** Before you create, build, restyle, or review *any* SproutLab
> surface — a card, section, screen, component, toast, chart, overlay, color, font, or
> animation — open `docs/DESIGN_PRINCIPLES.md`. Designing without it is how warmth drifts
> into clinical and how `HR` violations slip in. No SproutLab UI work is exempt.

## When this fires

Any of these means **read `docs/DESIGN_PRINCIPLES.md` now**:

- A new feature, card, section, info-tab render, or Smart Quick Log / Today So Far row.
- Any change to color, typography, spacing, radius, shadow, or animation.
- Any `innerHTML` string that ships visible markup (escHtml + tokens, not raw hex/px).
- Choosing or assigning a **domain color** to a surface.
- A toast, overlay, chip, or chart.
- A QA pass on visual correctness (the per-build Design Principle scores live in §6).

## Quick-reference (the load-bearing floor — full detail in the doc)

### Personality — warm, sturdy, calm
A cozy nursery journal, **not** a clinical health app. Soft cream (`--cream: #fffaf7`), not
white. No hospital blues, no sharp corners, no neon, no bouncy animation. *The half-awake
test: would a tired parent read this correctly at 2 AM holding a baby?*

### Typography (§Typography)
- **Fraunces** (serif) — hero headlines, scores, card titles, countdowns, gauge values.
- **Nunito** (sans-serif) — body, labels, buttons, inputs, chips, navigation.
- Never system fonts / Arial / Helvetica in new code. Text zoom: 3 tiers via `data-zoom`.

### 7 domain colors (§Color System) — **every surface uses one; no ad-hoc hex**
`sage` (diet / positive) · `rose` (medical / alert) · `amber` (caution / trends) ·
`lavender` (milestones / intelligence) · `sky` (sleep / hydration) ·
`indigo` (sleep intelligence / night) · `peach` (warm accents / outing).
Status triad: sage = good, amber = fair, rose = attention.

### Animation foundation (§Animation Foundation)
Gentle, never bouncy (`--ease-med: 0.22s`). Motion One (`defer`) loads after Chart.js so
chart cold-start wins. See `docs/DESIGN_PRINCIPLES.md` §Animation Foundation.

### Icon system (§Icon System)
`zi()` SVG sprite only — **no emojis (HR-1)**. `zi(name)` → `<svg class="zi"><use
href="#zi-{name}"/></svg>`, set via innerHTML (HR-7).

### Hard Rules — zero tolerance (union of `DESIGN_PRINCIPLES.md` §3 + `CLAUDE.md` §Hard Rules)
No emojis · no inline styles · no inline handlers (`data-action` only) · escHtml at every
render boundary · all spacing/font/radius via tokens (no raw px) · domain color on every
surface · no ellipsis truncation · chip text wraps · no persistent editing in overlays ·
Math.floor for currency · timezone-safe dates · stubs show "Coming soon" via `showQLToast()`.

> **Numbering caveat:** the two docs number their HRs *differently* (e.g. CLAUDE.md HR-9 =
> "post-build QA audit"; DESIGN_PRINCIPLES.md HR-9 = "no persistent editing in overlays").
> Any `HR-N` tag in this skill follows **CLAUDE.md's** §Hard Rules table (the policy floor).
> Read the rule by name, not number, and check both docs.

### Tokens (§7) & UI systems (§5)
Spacing `--sp-*` · font-size `--fs-*` · radius `--r-*` · icon `--icon-*` · ease `--ease-*`.
4-tier card system, section labels, overlays (no persistent editing), chips.

## How to use

```
/design-principles            # surface this doorway + the standing rule
```

Then **read the canonical doc** for the section in play:

```
Read docs/DESIGN_PRINCIPLES.md            # full floor
# or jump to a section by header, e.g. §3 Hard Rules, §5 UI Systems, §7 Token Reference
```

## Relationship to the QA chain

This skill is the **design floor**, not a Governor audit. Per canon-cc-022, a skill run is
an in-transcript register-flip — it does **not** discharge the canon-cc-008 QA gate. Visual
correctness is still audited by the seated Governors (Vela leads Surfacing / render
legibility; Maren on Care surfaces; Kael on engine→render data) and Cipher's Edict V
final-pass. Reading the principles up front is how a surface *arrives* at that gate already
compliant instead of being sent back.

## References

- Canonical doc: `docs/DESIGN_PRINCIPLES.md` (the authoritative floor).
- Mirrored summary: `CLAUDE.md` §Design System + §Hard Rules (HR-1..HR-12).
- Build / animation wiring: `CLAUDE.md` §Build; `docs/DESIGN_PRINCIPLES.md` §Animation Foundation.
