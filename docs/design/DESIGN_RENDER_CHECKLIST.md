# Design-render checklist — how we avoid DESIGN_PRINCIPLES misses

Adopted 2026-06-03 after the Recipes-tab padding miss (a custom detail panel
under-padded vs the `18×16` mobile card standard). The misses this session
(broken icons, wrong fade, tight padding) all share one root cause: **inventing
CSS instead of using what the app already defines.** This checklist is the fix.

## Rule 0 — Real-components-first (the big one)
Compose every render from the app's **real classes** (`.card`, `.card-hero.hero-*`,
`.combo-result`/`.combo-section`, `.lib-book`, `.food-lib-card`, `.btn-*`,
`.icon.icon-*`) and the **real `zi()` sprite** (spliced from `template.html`).
Real components carry correct padding, radius, type, and dark-mode by
construction — you cannot under-pad a `.card`. Write **new** CSS only when no
real component fits, and keep it to the minimum.

## Run this on every render BEFORE sending for sign-off
For any **new** class introduced:
- [ ] **Padding** — card-like containers ≥ `18px / 16px` mobile (DESIGN_PRINCIPLES line ~275). Nothing hugs the edge; right-aligned values get a left-gap.
- [ ] **Tokens only** — spacing `--sp-*`, radius `--r-*`, font `--fs-*`, line-height `--lh-*`. No bare px except when it equals a token's value and none exists.
- [ ] **No raw hex** in component CSS or innerHTML — domain colour via `--{domain}`/`--*-light`/`--tc-*` only. (Harness-only chrome — phone bg, mode labels — is exempt.)
- [ ] **Tint = a named register** — Hero gradient / Ambient / Signaling / Receded / **Food-domain whisper** (`.dt-*`). Never hand-mix a wash. Food domain stays a whisper + companion rail (polarity-collision rule).
- [ ] **Icons** — real `zi()` symbols only (check the name exists in the sprite). Never hand-draw.
- [ ] **HR-1..12** — no emojis (zi only), no inline styles in shipped code (renders may annotate), `escHtml` at render boundaries, Math.floor currency, timezone-safe dates.
- [ ] **Both themes** — light + dark; verify the dark hue-swap (fades → deep `--tc`, hero stripe stays the identity layer).
- [ ] **The 2 AM half-awake test** (Vela's lens) — would a tired parent read this correctly, one-handed, at 2 AM?

## Belt-and-suspenders
- **Vela skill-mode smell-check** on the render before sign-off — surfacing/legibility governor; catches spacing/contrast/comprehension misses this checklist's author is blind to.
- When the render's classes get **wired into `styles.css`**, the canon-cc-008 Governor chain (Maren/Kael/Vela + Cipher) is the real gate — the checklist is the pre-filter, not a replacement.
