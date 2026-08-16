#!/usr/bin/env node
/*
 * build-posters.mjs — Ziva's Winter ONEderland
 * Print-ready first-birthday party artwork.
 *
 * Everything is drawn inside one SVG viewBox, so a single source scales
 * losslessly from a phone preview to a 6ft x 4ft flex backdrop. Fonts are
 * subset + base64-embedded (make_fonts.py) so files are portable and no print
 * shop can substitute a fallback face.
 *
 * Typesetting is *measured*, not eyeballed: glyph advances are extracted from
 * the real font files (measure.py -> metrics.json) so the "Winter ONE derland"
 * lockup is composed from true widths and cannot collide.
 *
 *   node build-posters.mjs && ./render.sh
 *
 * Outputs: backdrop.html (3:2 landscape), welcome-board.html (A2 portrait)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS = readFileSync(join(HERE, 'fonts.css'), 'utf8');
const METRICS = JSON.parse(readFileSync(join(HERE, 'metrics.json'), 'utf8'));

/* ─────────────────────────────────────────────────────────────────────────
   PARTY DETAILS — edit, re-run `node build-posters.mjs && ./render.sh`.
   ───────────────────────────────────────────────────────────────────────── */
const PARTY = {
  name:     'ZIVA',
  eyebrow:  'our little snowflake',
  pun:      { pre: 'Winter', hero: 'ONE', post: 'derland' },
  blessing: 'one whole year of radiance',
  date:     'Friday, 4 September 2026',
  place:    'Jamshedpur',
  welcome:  'Welcome to',
  // Welcome board dedication — the name's meaning, not logistics.
  means:    'her name means',
  radiance: 'Radiance',
  triad:    'light · brightness · splendor',
};

/* Deterministic RNG — same seed, same snow, every rebuild. A poster that
   reshuffles itself between the proof and the print run is a liability. */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n) => Math.round(n * 100) / 100;

/* ── Real typesetting from real metrics ─────────────────────────────────── */
function textWidth(str, fam, size, tracking = 0) {
  const adv = METRICS[fam].adv;
  let w = 0;
  for (const ch of str) w += adv[ch] ?? 0.5;
  return w * size + tracking * Math.max(0, str.length - 1);
}
/* Chromium adds letter-spacing after the final glyph too, which drags a
   text-anchor="middle" run left by half a unit. Correct for it. */
const midX = (cx, tracking) => cx + tracking / 2;

/* ─────────────────────────────────────────────────────────────────────────
   Text styling lives on the elements as presentation attributes, NOT as CSS
   classes in the host page. An SVG lifted out of these files and dropped into
   another document (the gallery, an email, a print portal) must arrive fully
   styled — a class-based poster silently renders its lettering black.
   ───────────────────────────────────────────────────────────────────────── */
const T = {
  starlabel:  `font-family="Jura" font-weight="500" fill="#f4d79a" opacity=".88"`,
  constlabel: `font-family="Jura" font-weight="300" fill="#cfe8f7" opacity=".55"`,
  eyebrow:    `font-family="Jura" font-weight="500" fill="#6fb3d9"`,
  punword:    `font-family="Poiret One" fill="#cfe8f7"`,
  blessing:   `font-family="Jura" font-weight="300" fill="#cfe8f7"`,
  detail:     `font-family="Jura" font-weight="500" fill="#f6fbff"`,
  detailLite: `font-family="Jura" font-weight="300" fill="#cfe8f7" opacity=".82"`,
};
const nameAttrs = (grad) => `font-family="Poiret One" fill="url(#${grad})"`;

/* ── Palette ──────────────────────────────────────────────────────────────
   Blue-violet biased throughout; one warm accent (Vega gold) reserved
   strictly for starlight and the ice edge-light. */
const C = {
  night:    '#0a1830',
  nightMid: '#102544',
  deepIce:  '#16345c',
  horizon:  '#27567f',
  glacier:  '#6fb3d9',
  frost:    '#cfe8f7',
  snow:     '#f6fbff',
  mint:     '#8fe3c4',
  lilac:    '#b9a6e8',
  gold:     '#f4d79a',
};

/* ─────────────────────────────────────────────────────────────────────────
   Snowflake — six-fold symmetric crystal, procedurally branched, drawn as
   vector paths so print stays sharp at six feet.
   ───────────────────────────────────────────────────────────────────────── */
function snowflake(rand, size) {
  const arm = [];
  const L = size;
  arm.push(`M0 0 L0 ${-r2(L)}`);
  const branches = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < branches; i++) {
    const at = L * (0.28 + (i / branches) * 0.6);
    const len = L * (0.16 + rand() * 0.22) * (1 - at / L / 1.6);
    const ang = 0.55 + rand() * 0.36;
    const dx = r2(Math.sin(ang) * len);
    const dy = r2(Math.cos(ang) * len);
    arm.push(`M0 ${-r2(at)} l ${dx} ${-dy}`);
    arm.push(`M0 ${-r2(at)} l ${-dx} ${-dy}`);
  }
  if (rand() > 0.45) { // plate-dendrite cap on some crystals
    const c = r2(L * 0.13);
    arm.push(`M${-c} ${-r2(L * 0.86)} L0 ${-r2(L)} L${c} ${-r2(L * 0.86)}`);
  }
  const d = arm.join(' ');
  let g = '';
  for (let k = 0; k < 6; k++) g += `<path d="${d}" transform="rotate(${k * 60})"/>`;
  return g;
}

function snowfield(rand, w, h, count, opts = {}) {
  const { minR = 4, maxR = 16, opacity = [0.18, 0.62], avoid = [] } = opts;
  const zones = Array.isArray(avoid) ? avoid : [avoid];
  let out = '';
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 60) {
    const x = rand() * w;
    const y = rand() * h;
    const s = minR + rand() * (maxR - minR);
    // Keep crystals clear of the type wells so lettering stays crisp.
    if (zones.some((z) => z && x > z.x0 - s && x < z.x1 + s && y > z.y0 - s && y < z.y1 + s)) continue;
    const o = opacity[0] + rand() * (opacity[1] - opacity[0]);
    const sw = r2(Math.max(0.7, s * 0.075));
    out += `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(rand() * 60)})" opacity="${r2(o)}" `
         + `stroke="${C.snow}" stroke-width="${sw}" stroke-linecap="round" fill="none">`
         + snowflake(rand, s) + `</g>`;
    placed++;
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────────────────
   Lyra — the constellation that rode over Jamshedpur at 5:09pm IST on
   4 September 2025, the moment Ziva was born. Vega at its crown.
   ───────────────────────────────────────────────────────────────────────── */
const LYRA = {
  stars: [
    { id: 'vega',    x: 0.30, y: 0.05, mag: 0.03, label: 'Vega' },
    { id: 'epsilon', x: 0.46, y: 0.01, mag: 4.6 },
    { id: 'zeta',    x: 0.40, y: 0.30, mag: 4.3 },
    { id: 'delta',   x: 0.63, y: 0.37, mag: 4.2 },
    { id: 'beta',    x: 0.32, y: 0.63, mag: 3.5 },
    { id: 'gamma',   x: 0.60, y: 0.70, mag: 3.2 },
  ],
  lines: [['vega', 'epsilon'], ['vega', 'zeta'], ['zeta', 'delta'],
          ['zeta', 'beta'], ['delta', 'gamma'], ['beta', 'gamma']],
};

function lyra(x, y, w, h, { label = true, scale = 1, labelSize = 18 } = {}) {
  const P = {};
  LYRA.stars.forEach((s) => { P[s.id] = { x: x + s.x * w, y: y + s.y * h, mag: s.mag, label: s.label }; });
  let g = `<g stroke="${C.frost}" stroke-opacity=".34" stroke-linecap="round">`;
  for (const [a, b] of LYRA.lines) {
    g += `<line x1="${r2(P[a].x)}" y1="${r2(P[a].y)}" x2="${r2(P[b].x)}" y2="${r2(P[b].y)}"/>`;
  }
  g += `</g><g>`;
  for (const s of LYRA.stars) {
    const p = P[s.id];
    const rad = r2((s.mag < 1 ? 7.5 : 3.4 - s.mag * 0.32) * scale);
    if (s.id === 'vega') {
      // Vega takes the gold — she is the radiance the child is named for.
      g += `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r2(rad * 3.6)}" fill="url(#vegaGlow)"/>`;
      g += `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${rad}" fill="${C.gold}"/>`;
      const t = r2(rad * 4.2);
      g += `<path d="M${r2(p.x - t)} ${r2(p.y)} H${r2(p.x + t)} M${r2(p.x)} ${r2(p.y - t)} V${r2(p.y + t)}" `
         + `stroke="${C.gold}" stroke-width="${r2(rad * 0.28)}" opacity=".75" stroke-linecap="round"/>`;
      if (label) {
        g += `<text ${T.starlabel} font-size="${r2(labelSize)}" `
           + `x="${r2(p.x + rad * 2.8)}" y="${r2(p.y - rad * 2.0)}">${p.label}</text>`;
      }
    } else {
      g += `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${Math.max(1.6, rad)}" fill="${C.frost}" opacity=".92"/>`;
    }
  }
  if (label) {
    g += `<text ${T.constlabel} font-size="${r2(labelSize * 0.88)}" `
       + `x="${r2(x + w * 0.12)}" y="${r2(y + h + labelSize * 1.9)}">Lyra · her first sky</text>`;
  }
  return g + `</g>`;
}

/* Stars respect the type wells too — a stray point inside a word reads as a
   printing speck, not as a star. */
function stars(rand, w, h, count, avoid = []) {
  const zones = Array.isArray(avoid) ? avoid : [avoid];
  let out = '';
  let placed = 0, guard = 0;
  while (placed < count && guard++ < count * 40) {
    const x = rand() * w;
    const y = rand() * h * (0.55 + rand() * 0.45);
    if (zones.some((z) => z && x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1)) continue;
    out += `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(0.8 + rand() * 2.0)}" `
         + `fill="${C.snow}" opacity="${r2(0.25 + rand() * 0.6)}"/>`;
    placed++;
  }
  return out;
}

/* ── Aurora ribbons ─────────────────────────────────────────────────────── */
function aurora(rand, w, h, bands) {
  let out = `<g filter="url(#auroraBlur)" opacity=".85">`;
  const fills = ['url(#aurA)', 'url(#aurB)', 'url(#aurC)'];
  for (let b = 0; b < bands; b++) {
    const baseY = h * (0.10 + b * 0.13) + rand() * h * 0.05;
    const amp = h * (0.10 + rand() * 0.10);
    const thick = h * (0.16 + rand() * 0.16);
    const steps = 7;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      pts.push([-w * 0.05 + (w * 1.1 * i) / steps,
                baseY + Math.sin(i * 1.15 + b * 2.2) * amp + (rand() - 0.5) * h * 0.03]);
    }
    let top = `M ${r2(pts[0][0])} ${r2(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i];
      top += ` C ${r2(px + (cx - px) / 2)} ${r2(py)}, ${r2(px + (cx - px) / 2)} ${r2(cy)}, ${r2(cx)} ${r2(cy)}`;
    }
    let bot = '';
    for (let i = pts.length - 1; i > 0; i--) {
      const [px, py] = pts[i], [cx, cy] = pts[i - 1];
      const t = thick * (0.6 + 0.4 * Math.sin(i));
      bot += ` C ${r2(px + (cx - px) / 2)} ${r2(py + t)}, ${r2(px + (cx - px) / 2)} ${r2(cy + t)}, ${r2(cx)} ${r2(cy + t)}`;
    }
    const last = pts[pts.length - 1];
    out += `<path d="${top} L ${r2(last[0])} ${r2(last[1] + thick)} ${bot} Z" `
         + `fill="${fills[b % fills.length]}" opacity="${r2(0.42 + rand() * 0.28)}"/>`;
  }
  return out + `</g>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Mountain range — varied ridgeline with a minor shoulder between each major
   summit, so it reads as alpine rather than as a row of triangles.
   Snow is a moonlit stroke along the ridgeline itself: it traces the exact
   silhouette, so it can never drift outside the mountain the way a separately
   drawn cap polygon does.
   ───────────────────────────────────────────────────────────────────────── */
function peaks(rand, w, baseY, height, fill, jag, opacity = 1, snowline = null) {
  const pts = [[-w * 0.05, baseY]];
  let x = -w * 0.05;
  while (x < w * 1.05) {
    const rise = height * (0.40 + rand() * 0.60) * jag;
    x += w * (0.05 + rand() * 0.07);
    const sy = baseY - rise;
    pts.push([x, sy]);
    // a shoulder on the way down, then a saddle — breaks the pyramid read
    x += w * (0.022 + rand() * 0.03);
    pts.push([x, sy + rise * (0.28 + rand() * 0.22)]);
    x += w * (0.03 + rand() * 0.055);
    pts.push([x, baseY - height * (0.04 + rand() * 0.16)]);
  }
  const line = pts.map(([px, py]) => `L ${r2(px)} ${r2(py)}`).join(' ');
  const ridge = `M ${r2(pts[0][0])} ${r2(pts[0][1])} ${line}`;
  const area = `M ${r2(pts[0][0])} ${r2(baseY + height)} ${line} L ${r2(x)} ${r2(baseY + height)} Z`;

  let out = `<path d="${area}" fill="${fill}" opacity="${opacity}"/>`;
  if (snowline) {
    // A moonlit rim along the ridge — kept faint so it lights the silhouette
    // instead of drawing a zigzag line across the poster.
    out += `<path d="${ridge}" fill="none" stroke="${snowline}" stroke-linejoin="round" `
         + `stroke-linecap="round" stroke-width="${r2(height * 0.026)}" opacity="${r2(opacity * 0.48)}"/>`;
  }
  return out;
}

/* ── Snowdrift: soft rolling foreground ─────────────────────────────────── */
function drift(rand, w, y, amp, fill, opacity = 1) {
  let d = `M -${r2(w * 0.05)} ${r2(y)}`;
  let prevX = -w * 0.05, prevY = y;
  for (let i = 1; i <= 5; i++) {
    const cx = -w * 0.05 + (w * 1.1 * i) / 5;
    const cy = y + (rand() - 0.5) * amp;
    d += ` C ${r2(prevX + (cx - prevX) / 2)} ${r2(prevY)}, ${r2(prevX + (cx - prevX) / 2)} ${r2(cy)}, ${r2(cx)} ${r2(cy)}`;
    prevX = cx; prevY = cy;
  }
  d += ` L ${r2(w * 1.05)} ${r2(y + amp * 10)} L -${r2(w * 0.05)} ${r2(y + amp * 10)} Z`;
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Frost fern — a window-frost crystal: one curved spine, symmetric paired
   barbs tapering to the tip, each barb carrying two smaller barblets.
   Symmetry is what makes it read as frost rather than as broken sticks.
   ───────────────────────────────────────────────────────────────────────── */
function frostFern(len, { barbs = 9, spread = 0.62, curve = 0.20 } = {}) {
  const tipX = len, tipY = -len * curve;
  let g = `<path d="M0 0 Q ${r2(len * 0.5)} ${r2(-len * curve * 0.25)} ${r2(tipX)} ${r2(tipY)}"/>`;
  for (let i = 1; i <= barbs; i++) {
    const t = i / (barbs + 1);
    // point on the quadratic spine
    const px = 2 * (1 - t) * t * (len * 0.5) + t * t * tipX;
    const py = 2 * (1 - t) * t * (-len * curve * 0.25) + t * t * tipY;
    const bl = len * 0.30 * (1 - t * 0.82);
    for (const sgn of [-1, 1]) {
      const ex = px + bl * 0.55;
      const ey = py + sgn * bl * spread * 1.5;
      g += `<path d="M${r2(px)} ${r2(py)} Q ${r2(px + bl * 0.34)} ${r2(py + sgn * bl * spread * 0.5)} ${r2(ex)} ${r2(ey)}"/>`;
      for (const k of [0.42, 0.74]) { // barblets
        const bx = px + (ex - px) * k, by = py + (ey - py) * k;
        const sl = bl * 0.30 * (1 - k * 0.5);
        g += `<path d="M${r2(bx)} ${r2(by)} l ${r2(sl * 0.75)} ${r2(sgn * sl * 0.62)}"/>`;
      }
    }
  }
  return g;
}

function filigree(x, y, size, rot, opacity = 0.40) {
  let g = `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${rot})" fill="none" `
        + `stroke="${C.glacier}" stroke-width="${r2(size * 0.010)}" stroke-linecap="round" opacity="${opacity}">`;
  // three ferns fanned from the corner
  for (const [a, s] of [[-24, 1.0], [4, 0.82], [30, 0.66]]) {
    g += `<g transform="rotate(${a})">${frostFern(size * s)}</g>`;
  }
  return g + `</g>`;
}

/* ── Ice facet cracks across the hero glyphs ────────────────────────────── */
function facets(rand, x0, y0, w, h, n) {
  let g = `<g stroke="${C.snow}" fill="none" stroke-linecap="round">`;
  for (let i = 0; i < n; i++) {
    const sx = x0 + rand() * w, sy = y0 + rand() * h;
    const len = w * (0.08 + rand() * 0.22);
    const ang = (rand() > 0.5 ? -1 : 1) * (0.5 + rand() * 0.9);
    g += `<path d="M${r2(sx)} ${r2(sy)} L${r2(sx + Math.cos(ang) * len)} ${r2(sy + Math.sin(ang) * len)}" `
       + `stroke-width="${r2(1 + rand() * 2.2)}" opacity="${r2(0.18 + rand() * 0.3)}"/>`;
  }
  return g + `</g>`;
}

/* ── Shared <defs> ──────────────────────────────────────────────────────── */
function defs(W, H) {
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"    stop-color="${C.night}"/>
    <stop offset="0.42" stop-color="${C.nightMid}"/>
    <stop offset="0.74" stop-color="${C.deepIce}"/>
    <stop offset="1"    stop-color="${C.horizon}"/>
  </linearGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.44" r="0.84">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1"    stop-color="#000" stop-opacity="0.24"/>
  </radialGradient>
  <!-- Starts fully transparent so the snowfield fades up out of the range
       instead of butting against it along a visible horizontal seam. -->
  <linearGradient id="snowGround" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0"    stop-color="${C.frost}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${C.frost}" stop-opacity="0.22"/>
    <stop offset="1"    stop-color="${C.snow}"  stop-opacity="0.42"/>
  </linearGradient>
  <radialGradient id="vegaGlow">
    <stop offset="0"    stop-color="${C.gold}" stop-opacity=".75"/>
    <stop offset="0.45" stop-color="${C.gold}" stop-opacity=".22"/>
    <stop offset="1"    stop-color="${C.gold}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="aurA" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.mint}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${C.mint}" stop-opacity=".62"/>
    <stop offset="1" stop-color="${C.mint}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="aurB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.lilac}" stop-opacity="0"/>
    <stop offset="0.5" stop-color="${C.lilac}" stop-opacity=".58"/>
    <stop offset="1" stop-color="${C.lilac}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="aurC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.glacier}" stop-opacity="0"/>
    <stop offset="0.5" stop-color="${C.glacier}" stop-opacity=".5"/>
    <stop offset="1" stop-color="${C.glacier}" stop-opacity="0"/>
  </linearGradient>
  <filter id="auroraBlur" x="-20%" y="-40%" width="140%" height="200%">
    <feGaussianBlur stdDeviation="${r2(Math.min(W, H) * 0.028)}"/>
  </filter>
  <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="${r2(Math.min(W, H) * 0.010)}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="iceFill" x1="0" y1="0" x2="0.25" y2="1">
    <stop offset="0"    stop-color="${C.snow}"/>
    <stop offset="0.38" stop-color="${C.frost}"/>
    <stop offset="0.72" stop-color="${C.glacier}"/>
    <stop offset="1"    stop-color="#3d7fa8"/>
  </linearGradient>
  <linearGradient id="nameFill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.snow}"/>
    <stop offset="1" stop-color="${C.frost}"/>
  </linearGradient>
</defs>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Hero "ONE" — carved ice. Gold edge-light offset behind, ice-gradient face,
   procedural facet cracks clipped to the glyphs, hairline frost stroke.
   ───────────────────────────────────────────────────────────────────────── */
function heroOne(rand, cx, cy, fontSize, clipId) {
  const track = fontSize * 0.03;
  const t = (extra) => `<text x="${r2(midX(cx, track))}" y="${r2(cy)}" text-anchor="middle" `
    + `font-family="Gloock" font-size="${r2(fontSize)}" letter-spacing="${r2(track)}" ${extra}>ONE</text>`;
  const fw = textWidth('ONE', 'Gloock', fontSize, track) * 1.06;
  const fh = fontSize * METRICS.Gloock.capHeight * 1.08;
  return `
  <g class="hero-one">
    <clipPath id="${clipId}">${t('')}</clipPath>
    ${t(`fill="${C.gold}" opacity=".34" transform="translate(${r2(-fontSize * 0.012)} ${r2(-fontSize * 0.015)})" filter="url(#softGlow)"`)}
    ${t(`fill="url(#iceFill)"`)}
    <g clip-path="url(#${clipId})">${facets(rand, cx - fw / 2, cy - fh, fw, fh, 34)}</g>
    ${t(`fill="none" stroke="${C.snow}" stroke-width="${r2(fontSize * 0.011)}" opacity=".65"`)}
  </g>`;
}

/* ── Page shell ─────────────────────────────────────────────────────────── */
const pageCSS = `
${FONTS}
*{box-sizing:border-box}
/* No flex centring and no 100vh: the document is exactly as tall as the
   artwork, so the print page maps 1:1 and no band of page background can
   appear under the poster. All poster type is styled on the SVG elements
   themselves, so nothing here is load-bearing for the artwork. */
html,body{margin:0;padding:0;background:${C.night}}
.sheet{width:100%}
svg{display:block;width:100%;height:auto}
@media print{body{min-height:0}}
`;

function page(title, svg, wIn, hIn) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
${pageCSS}
@page{size:${wIn}in ${hIn}in;margin:0}
</style>
</head>
<body>
<div class="sheet">
${svg}
</div>
</body>
</html>
`;
}

/* ─────────────────────────────────────────────────────────────────────────
   The "Winter ONE derland" lockup, composed from measured widths so the
   three words never touch — and so the *whole* lockup centres, rather than
   the ONE centring and the unequal flanks throwing it off axis.
   ───────────────────────────────────────────────────────────────────────── */
function punLockup(rand, cx, baselineY, oneSize, sideSize, clipId) {
  const sideTrack = sideSize * 0.06;
  const gap = oneSize * 0.10;
  const preW  = textWidth(PARTY.pun.pre,  'PoiretOne', sideSize, sideTrack);
  const postW = textWidth(PARTY.pun.post, 'PoiretOne', sideSize, sideTrack);
  const oneW  = textWidth(PARTY.pun.hero, 'Gloock', oneSize, oneSize * 0.03);

  const total = preW + gap + oneW + gap + postW;
  const left = cx - total / 2;
  const oneCx = left + preW + gap + oneW / 2;
  const sideY = baselineY - oneSize * 0.055; // optical: sit the small words high

  let s = heroOne(rand, oneCx, baselineY, oneSize, clipId);
  s += `<text ${T.punword} x="${r2(left)}" y="${r2(sideY)}" text-anchor="start" `
     + `font-size="${r2(sideSize)}" letter-spacing="${r2(sideTrack)}">${PARTY.pun.pre}</text>`;
  s += `<text ${T.punword} x="${r2(left + total)}" y="${r2(sideY)}" text-anchor="end" `
     + `font-size="${r2(sideSize)}" letter-spacing="${r2(sideTrack)}">${PARTY.pun.post}</text>`;
  return { svg: s, left, right: left + total, oneCx };
}

/* ── Rule + snowflake ornament ──────────────────────────────────────────── */
function ornamentRule(cx, y, halfLen, flakeSize, seed) {
  const gapX = flakeSize * 2.0;
  return `<path d="M${r2(cx - halfLen)} ${r2(y)} H${r2(cx - gapX)}" stroke="${C.glacier}" stroke-width="1.5" opacity=".55"/>`
       + `<path d="M${r2(cx + gapX)} ${r2(y)} H${r2(cx + halfLen)}" stroke="${C.glacier}" stroke-width="1.5" opacity=".55"/>`
       + `<g transform="translate(${r2(cx)} ${r2(y)})" stroke="${C.gold}" stroke-width="${r2(flakeSize * 0.07)}" `
       + `fill="none" stroke-linecap="round" opacity=".95">${snowflake(mulberry32(seed), flakeSize)}</g>`;
}

/* ═════════════════════════════════════════════════════════════════════════
   BOARD 1 — Photo backdrop, 3:2 landscape (prints 6ft x 4ft)
   Type lives in the upper 55%; the lower third stays a quiet snowfield,
   because that is exactly where people stand when the photos get taken.
   ═════════════════════════════════════════════════════════════════════════ */
function buildBackdrop() {
  const W = 1800, H = 1200, cx = W / 2;
  const rand = mulberry32(90425);

  const eyebrowY  = H * 0.190;
  const nameY     = H * 0.325;
  const ruleY     = H * 0.383;
  const oneSize   = H * 0.280;
  const oneBase   = H * 0.660;
  const blessingY = H * 0.735;
  const footY     = H * 0.795;

  // Big crystals stay out of the whole type block; tiny stars only dodge the
  // individual lines, so the sky between them keeps its depth.
  const block = { x0: W * 0.10, x1: W * 0.90, y0: eyebrowY - H * 0.05, y1: footY + H * 0.02 };
  const lines = [
    { x0: W * 0.27, x1: W * 0.73, y0: eyebrowY - H * 0.035, y1: eyebrowY + H * 0.012 },
    { x0: W * 0.32, x1: W * 0.68, y0: nameY - H * 0.105, y1: nameY + H * 0.020 },
    { x0: W * 0.31, x1: W * 0.69, y0: ruleY - H * 0.026, y1: ruleY + H * 0.026 },
    { x0: W * 0.07, x1: W * 0.93, y0: oneBase - H * 0.235, y1: oneBase + H * 0.030 },
    { x0: W * 0.24, x1: W * 0.76, y0: blessingY - H * 0.030, y1: blessingY + H * 0.012 },
    { x0: W * 0.23, x1: W * 0.77, y0: footY - H * 0.026, y1: footY + H * 0.010 },
  ];

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" `
        + `aria-label="Ziva's Winter ONEderland — first birthday photo backdrop">`;
  s += defs(W, H);
  s += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  s += stars(rand, W, H * 0.8, 190, lines);
  s += aurora(rand, W, H, 3);
  s += lyra(W * 0.055, H * 0.075, W * 0.145, H * 0.20, { scale: 1.25, labelSize: H * 0.020 });

  // Three ridges, each darker and nearer — aerial perspective, snow-capped.
  // The range sits wholly below the type — summits top out around 0.82H,
  // clear of the foot line, so no ridge ever crosses a word.
  s += peaks(rand, W, H * 0.905, H * 0.098, C.deepIce, 0.85, 0.55, '#9fc9e4');
  s += peaks(rand, W, H * 0.928, H * 0.085, '#123153', 0.90, 0.78, '#8dbcdd');
  s += peaks(rand, W, H * 0.948, H * 0.072, '#081d38', 0.95, 1, '#7fb2d6');

  // Foreground snowfield — the ground the peaks stand in, so the lower band
  // reads as lit snow rather than as a dark bar under the artwork.
  s += `<rect x="0" y="${r2(H * 0.930)}" width="${W}" height="${r2(H * 0.070)}" fill="url(#snowGround)"/>`;
  s += drift(rand, W, H * 0.952, H * 0.014, C.frost, 0.24);
  s += drift(rand, W, H * 0.976, H * 0.010, C.snow, 0.20);

  // Frost creeping in along the bottom corners, spine laid near-horizontal.
  s += filigree(W * 0.015, H * 0.988, W * 0.145, -14, 0.30);
  s += `<g transform="translate(${W} 0) scale(-1 1)">`
     + filigree(W * 0.015, H * 0.988, W * 0.145, -14, 0.30) + `</g>`;

  // ── Type ───────────────────────────────────────────────────────────────
  const skyMark = { x0: W * 0.02, x1: W * 0.24, y0: H * 0.04, y1: H * 0.33 };
  s += snowfield(rand, W, H, 74, { minR: 6, maxR: 30, opacity: [0.14, 0.52], avoid: [block, skyMark] });

  const ebTrack = H * 0.0155;
  s += `<text ${T.eyebrow} x="${r2(midX(cx, ebTrack))}" y="${r2(eyebrowY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.029)}" letter-spacing="${r2(ebTrack)}">`
     + PARTY.eyebrow.toUpperCase() + `</text>`;

  // The name: hairlines and wide tracking — line, played against the ONE's mass.
  const nameTrack = H * 0.075;
  s += `<text ${nameAttrs("nameFill")} x="${r2(midX(cx, nameTrack))}" y="${r2(nameY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.125)}" letter-spacing="${r2(nameTrack)}" filter="url(#softGlow)">`
     + PARTY.name + `</text>`;

  s += ornamentRule(cx, ruleY, W * 0.175, H * 0.019, 7);
  s += punLockup(rand, cx, oneBase, oneSize, H * 0.084, 'oneClipA').svg;

  const blTrack = H * 0.0125;
  s += `<text ${T.blessing} x="${r2(midX(cx, blTrack))}" y="${r2(blessingY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.0295)}" letter-spacing="${r2(blTrack)}">`
     + PARTY.blessing.toUpperCase() + `</text>`;

  const ftTrack = H * 0.0078;
  s += `<text ${T.detail} x="${r2(midX(cx, ftTrack))}" y="${r2(footY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.024)}" letter-spacing="${r2(ftTrack)}">`
     + `${PARTY.date.toUpperCase()} · ${PARTY.place.toUpperCase()}</text>`;

  s += `<rect width="${W}" height="${H}" fill="url(#vignette)" style="mix-blend-mode:multiply"/>`;
  s += `</svg>`;
  return page("Ziva's Winter ONEderland — Backdrop", s, 72, 48);
}

/* ═════════════════════════════════════════════════════════════════════════
   BOARD 2 — Welcome board, A2 portrait (420 x 594 mm)
   Same world, vertical composition: the lockup stacks, so the constellation
   and the sky get the room the landscape board cannot give them.
   ═════════════════════════════════════════════════════════════════════════ */
function buildWelcome() {
  const W = 1200, H = 1697, cx = W / 2; // A2 ratio
  const rand = mulberry32(50925);

  // A greeting, not a briefing: no date, no time, no venue. The stack ends on
  // what her name means — the one gold word on the board is "Radiance".
  const welcomeY  = H * 0.228;
  const nameY     = H * 0.322;
  const ruleY     = H * 0.360;
  const preY      = H * 0.434;
  const oneSize   = H * 0.175;
  const oneBase   = H * 0.588;
  const postY     = H * 0.644;
  const meansY    = H * 0.708;
  const radianceY = H * 0.762;
  const triadY    = H * 0.800;

  const block = { x0: W * 0.05, x1: W * 0.95, y0: welcomeY - H * 0.035, y1: triadY + H * 0.012 };
  const lines = [
    { x0: W * 0.30, x1: W * 0.70, y0: welcomeY - H * 0.022, y1: welcomeY + H * 0.008 },
    { x0: W * 0.22, x1: W * 0.78, y0: nameY - H * 0.066, y1: nameY + H * 0.014 },
    { x0: W * 0.24, x1: W * 0.76, y0: ruleY - H * 0.018, y1: ruleY + H * 0.018 },
    { x0: W * 0.28, x1: W * 0.72, y0: preY - H * 0.042, y1: preY + H * 0.014 },
    { x0: W * 0.16, x1: W * 0.84, y0: oneBase - H * 0.146, y1: oneBase + H * 0.018 },
    { x0: W * 0.26, x1: W * 0.74, y0: postY - H * 0.042, y1: postY + H * 0.014 },
    { x0: W * 0.30, x1: W * 0.70, y0: meansY - H * 0.018, y1: meansY + H * 0.008 },
    { x0: W * 0.20, x1: W * 0.80, y0: radianceY - H * 0.048, y1: radianceY + H * 0.014 },
    { x0: W * 0.20, x1: W * 0.80, y0: triadY - H * 0.016, y1: triadY + H * 0.008 },
  ];

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" `
        + `aria-label="Welcome to Ziva's Winter ONEderland — A2 welcome board">`;
  s += defs(W, H);
  s += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  s += stars(rand, W, H * 0.82, 210, lines);
  s += aurora(rand, W, H * 0.9, 3);
  // Unlabelled: guests read a constellation and a bright gold star; the board
  // itself explains the radiance in words further down.
  s += lyra(W * 0.085, H * 0.052, W * 0.27, H * 0.105, { scale: 1.4, label: false });

  s += peaks(rand, W, H * 0.888, H * 0.082, C.deepIce, 0.85, 0.55, '#9fc9e4');
  s += peaks(rand, W, H * 0.908, H * 0.072, '#123153', 0.90, 0.78, '#8dbcdd');
  s += peaks(rand, W, H * 0.925, H * 0.062, '#081d38', 0.95, 1, '#7fb2d6');

  s += `<rect x="0" y="${r2(H * 0.905)}" width="${W}" height="${r2(H * 0.095)}" fill="url(#snowGround)"/>`;
  s += drift(rand, W, H * 0.928, H * 0.011, C.frost, 0.24);
  s += drift(rand, W, H * 0.956, H * 0.009, C.snow, 0.20);

  s += filigree(W * 0.020, H * 0.990, W * 0.20, -14, 0.30);
  s += `<g transform="translate(${W} 0) scale(-1 1)">`
     + filigree(W * 0.020, H * 0.990, W * 0.20, -14, 0.30) + `</g>`;

  // ── Type ───────────────────────────────────────────────────────────────
  // Keep-out shrinks to the constellation itself now that it carries no label.
  const skyMark = { x0: W * 0.04, x1: W * 0.39, y0: H * 0.03, y1: H * 0.175 };
  s += snowfield(rand, W, H, 70, { minR: 6, maxR: 28, opacity: [0.14, 0.52], avoid: [block, skyMark] });

  const wTrack = H * 0.0105;
  s += `<text ${T.blessing} x="${r2(midX(cx, wTrack))}" y="${r2(welcomeY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.0215)}" letter-spacing="${r2(wTrack)}" opacity=".85">`
     + PARTY.welcome.toUpperCase() + `</text>`;

  const nameTrack = H * 0.042;
  s += `<text ${nameAttrs("nameFill")} x="${r2(midX(cx, nameTrack))}" y="${r2(nameY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.079)}" letter-spacing="${r2(nameTrack)}" filter="url(#softGlow)">`
     + PARTY.name + `</text>`;

  s += ornamentRule(cx, ruleY, W * 0.235, H * 0.0135, 21);

  const sideTrack = H * 0.008;
  s += `<text ${T.punword} x="${r2(midX(cx, sideTrack))}" y="${r2(preY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.052)}" letter-spacing="${r2(sideTrack)}">${PARTY.pun.pre}</text>`;
  s += heroOne(rand, cx, oneBase, oneSize, 'oneClipB');
  s += `<text ${T.punword} x="${r2(midX(cx, sideTrack))}" y="${r2(postY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.052)}" letter-spacing="${r2(sideTrack)}">${PARTY.pun.post}</text>`;

  // ── The dedication: what her name stands for ───────────────────────────
  const mTrack = H * 0.0092;
  s += `<text ${T.blessing} x="${r2(midX(cx, mTrack))}" y="${r2(meansY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.0175)}" letter-spacing="${r2(mTrack)}" opacity=".85">`
     + PARTY.means.toUpperCase() + `</text>`;

  // The one gold word on the board. Vega above, "Radiance" below — the same
  // light, named twice. Flanked by two small gold sparkles.
  const radTrack = H * 0.0062;
  s += `<text font-family="Poiret One" fill="${C.gold}" x="${r2(midX(cx, radTrack))}" y="${r2(radianceY)}" `
     + `text-anchor="middle" font-size="${r2(H * 0.054)}" letter-spacing="${r2(radTrack)}" `
     + `filter="url(#softGlow)">${PARTY.radiance}</text>`;
  for (const sgn of [-1, 1]) {
    const sx = cx + sgn * W * 0.255, sy = radianceY - H * 0.016;
    const a = H * 0.0085, b = a * 0.42; // long cross + short diagonal = star sparkle, not a plus sign
    s += `<g stroke="${C.gold}" stroke-linecap="round" opacity=".85" fill="none">`
       + `<path d="M${r2(sx - a)} ${r2(sy)} H${r2(sx + a)} M${r2(sx)} ${r2(sy - a)} V${r2(sy + a)}" `
       + `stroke-width="${r2(a * 0.20)}"/>`
       + `<path d="M${r2(sx - b)} ${r2(sy - b)} L${r2(sx + b)} ${r2(sy + b)} `
       + `M${r2(sx - b)} ${r2(sy + b)} L${r2(sx + b)} ${r2(sy - b)}" stroke-width="${r2(a * 0.14)}"/>`
       + `<circle cx="${r2(sx)}" cy="${r2(sy)}" r="${r2(a * 0.16)}" fill="${C.gold}" stroke="none"/></g>`;
  }

  const trTrack = H * 0.0078;
  s += `<text ${T.detailLite} x="${r2(midX(cx, trTrack))}" y="${r2(triadY)}" text-anchor="middle" `
     + `font-size="${r2(H * 0.0155)}" letter-spacing="${r2(trTrack)}">`
     + PARTY.triad.toUpperCase() + `</text>`;

  s += `<rect width="${W}" height="${H}" fill="url(#vignette)" style="mix-blend-mode:multiply"/>`;
  s += `</svg>`;
  return page("Ziva's Winter ONEderland — Welcome Board", s, 16.54, 23.39);
}

writeFileSync(join(HERE, 'backdrop.html'), buildBackdrop());
writeFileSync(join(HERE, 'welcome-board.html'), buildWelcome());
console.log('built  backdrop.html        6ft x 4ft   (3:2 landscape)');
console.log('built  welcome-board.html   A2          (420 x 594 mm portrait)');
