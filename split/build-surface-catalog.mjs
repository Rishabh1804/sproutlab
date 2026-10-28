// docs/SURFACE_CATALOG.html generator — the living Surface Catalog.
//
// SproutLab's visual contract. A build-time, can't-drift gallery that renders
// every canonical surface type using the REAL styles.css tokens + the REAL zi
// sprite, in light AND dark, with a zoom toggle. It is BOTH documentation and
// the design surface: to build a new surface you add its exemplar HERE first,
// review it rendered (this is exactly what will ship — same stylesheet), get
// Architect sign-off, THEN wire the feature using these exact classes/tokens.
// That closes the "post-build surprise" gap structurally — what you approve is
// what ships, because the catalog and the app read the same CSS. The page
// LINKS ../split/styles.css (served alongside it on GitHub Pages) rather than
// inlining it, so a styles.css change never produces a second copy in docs/.
//
// NEVER hand-edit docs/SURFACE_CATALOG.html — it is regenerated every build
// from this script + the live styles.css/template.html. Edit the exemplars in
// this file (the SURFACES array) instead.
//
// Cascade roadmap (built in visual-weight order): heroes → cards → chips/pills
// → inputs/steppers → composer rails/lists → toasts/overlays → interactions.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMPLATE = readFileSync(join(ROOT, 'split', 'template.html'), 'utf8');
const CORE = readFileSync(join(ROOT, 'split', 'core.js'), 'utf8');
const OUT = join(ROOT, 'docs', 'SURFACE_CATALOG.html');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Inline the live zi/zif symbols from template.html (same symbol-level
// match as build-icon-reference.mjs) so every zi() icon resolves exactly as in
// the app. An empty match would blank every icon, so it warns. ──
const symbols = TEMPLATE.match(/<symbol\b[^>]*\bid="(zi|zif)-[^"]+"[\s\S]*?<\/symbol>/g) || [];
if (!symbols.length) console.error('WARN: Surface Catalog found no zi/zif symbols in template.html — icons will be blank');
const sprites = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" hidden>${symbols.join('\n')}</svg>`;

// zi(name) → the same <svg><use> string the app emits (HR-7).
const zi = name => `<svg class="zi" aria-hidden="true"><use href="#zi-${name}"/></svg>`;

// Score → label/icon, read from core.js SCORE_LABELS itself (as
// build-poop-reference.mjs reads SAFE_POOP_COLORS) so ring states cannot drift.
const SCORE_LABELS = (() => {
  const m = CORE.match(/const SCORE_LABELS = \[([\s\S]*?)\];/);
  const rows = m ? [...m[1].matchAll(/min:\s*(\d+),\s*label:\s*'(\w+)',\s*emoji:\s*zi\('([\w-]+)'\)/g)]
    .map(r => ({ min: +r[1], label: r[2], emoji: r[3] })) : [];
  if (!rows.length) console.error('WARN: Surface Catalog could not read SCORE_LABELS from core.js — ring states may be wrong');
  return rows.sort((a, b) => b.min - a.min);
})();
function scoreLabel(s) {
  return SCORE_LABELS.find(r => s >= r.min) || { label: 'attention', emoji: 'warn' };
}
// Component bar bands — the 70/40 cut-offs renderDomainHero (diet.js) uses.
const band = s => (s >= 70 ? 'high' : s >= 40 ? 'mid' : 'low');
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

// ── Hero exemplars (faithful to renderDomainHero / renderHeroScore markup) ──

function domainHero({ key, word, sub, weight, score, comps, stale }) {
  const lb = scoreLabel(score);
  const pills = comps.map(c => {
    const b = band(c.score);
    return `<div class="dsh-comp-pill dcp-${b}">
      <div class="dcp-bar dcb-${b}">${c.score}</div>
      <div class="dcp-text">
        <div class="dcp-name">${esc(c.name)} <span class="dcp-weight">${esc(c.weight)}</span></div>
        <div class="dcp-detail">${c.icon ? zi(c.icon) + ' ' : ''}${esc(c.detail)}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="card col-full card-hero hero-${key}"><div class="domain-score-hero dsh-${key}${stale ? ' dsh-stale' : ''}">
    <div class="dsh-top">
      <div class="dsh-ring dsh-ring-${lb.label}">
        <div class="dsh-number">${score}</div>
        <div class="dsh-label">${esc(word)}</div>
        <div class="dsh-emoji">${zi(lb.emoji)}</div>
      </div>
      <div class="dsh-info">
        <div class="dsh-domain-name">${zi(lb.emoji)} ${esc(cap(lb.label))}</div>
        <div class="dsh-domain-sublabel">${esc(sub)} · ${esc(weight)} of Ziva Score</div>
      </div>
    </div>
    <div class="dsh-components">${pills}</div>
  </div></div>`;
}

// Rendered inside its real Home shell (#homeVitalsCard → .vitals-expanded-inner,
// template.html), so the card's rainbow and stripe sit behind it as in the app.
function homeHero({ score, trend, trendDown, domains }) {
  const dpills = domains.map(d => {
    const lvl = d.score === null ? '' : ' zsd-' + scoreLabel(d.score).label;
    return `<div class="zs-domain-pill${d.stale ? ' zsd-stale' : ''}${lvl}">
      <div class="zsd-icon">${zi(d.icon)}</div>
      <div class="zsd-text"><div class="zsd-score">${d.score === null ? '—' : d.score}</div><div class="zsd-label">${esc(d.label)}</div></div>
    </div>`;
  }).join('');
  return `<div class="card col-full card-hero hero-home"><div class="vitals-expanded-inner">
    <div class="ziva-score-hero zs-score-${scoreLabel(score).label}">
      <div class="zs-ring">
        <div class="zs-number">${score}</div>
        <div class="zs-label">Ziva Score</div>
        <div class="zs-trend${trendDown ? ' trend-down' : ''}">${esc(trend)}</div>
      </div>
      <div class="zs-domains">${dpills}</div>
    </div>
  </div></div>`;
}

// Each surface: { id, title, note, exemplars: [{label, html}] }.
const SURFACES = [
  {
    id: 'hero-ziva',
    title: 'Ziva Score hero (Home)',
    note: 'The home front-door hero — composite score ring + per-domain pills, `.ziva-score-hero.zs-score-{label}`, shown inside its real Home vitals card (`.card.card-hero.hero-home` → `.vitals-expanded-inner`), whose rainbow it leans on. Stale domains carry `.zsd-stale`; an untracked domain shows "—". Domain pills reflow two per row at medium/large zoom, with the fifth taking the whole last row. Tap a pill to jump to that tab; tap the ring for the score popup.',
    exemplars: [
      { label: 'Strong week', html: homeHero({ score: 84, trend: '↑ +4 vs last week', domains: [
        { key: 'sleep', icon: 'moon', label: 'Sleep', score: 79 },
        { key: 'diet', icon: 'bowl', label: 'Diet', score: 88 },
        { key: 'poop', icon: 'diaper', label: 'Poop', score: 72 },
        { key: 'medical', icon: 'medical', label: 'Medical', score: 95 },
        { key: 'milestones', icon: 'trophy', label: 'Milestones', score: 82 },
      ] }) },
      { label: 'Needs attention — trending down, Poop carried forward (stale), Medical not yet tracked', html: homeHero({ score: 41, trend: '↓ -9 vs last week', trendDown: true, domains: [
        { key: 'sleep', icon: 'moon', label: 'Sleep', score: 38 },
        { key: 'diet', icon: 'bowl', label: 'Diet', score: 52 },
        { key: 'poop', icon: 'diaper', label: 'Poop', score: 40, stale: true },
        { key: 'medical', icon: 'medical', label: 'Medical', score: null },
        { key: 'milestones', icon: 'trophy', label: 'Milestones', score: 61 },
      ] }) },
    ],
  },
  {
    id: 'hero-domain',
    title: 'Domain Score hero (per-tab)',
    note: 'Per-tab score hero. Rendered inside its real `.card.card-hero.hero-{domain}` shell (the floor’s two-domain semantic gradient + the 5px `::before` accent stripe) wrapping `.domain-score-hero.dsh-{domain}`. The RING carries the score-band polarity (`.dsh-ring-{label}`), the card-hero gradient carries domain identity — the two never compete (§Polarity Collision). Component bars `.dcb-{high|mid|low}`. Components, weights and detail strings mirror `_spGetDomainDefs` (diet.js); details show in full and wrap (no truncation). Pills are one column at ≤400px and at medium/large zoom — the ≤400px rule follows the browser window, so narrow this page to see it.',
    exemplars: [
      { label: 'Diet · Great (88)', html: domainHero({
        key: 'diet', word: 'Diet', sub: 'Based on meals, variety, groups & nutrients', weight: '25%', score: 88,
        comps: [
          { name: 'Meals', weight: '30%', score: 100, detail: '3/3 meals logged today' },
          { name: 'Variety', weight: '30%', score: 80, detail: '12 unique foods this week (target: 15)' },
          { name: 'Groups', weight: '20%', score: 83, detail: '5/6 food groups covered' },
          { name: 'Nutrients', weight: '20%', score: 75, detail: '6/8 key nutrients this week' },
        ] }) },
      { label: 'Sleep · Fair (55)', html: domainHero({
        key: 'sleep', word: 'Sleep', sub: 'Based on duration, wake-ups, bedtime & naps', weight: '25%', score: 55,
        comps: [
          { name: 'Duration', weight: '40%', score: 84, detail: '10.5h total (target: 12h 30m, WHO)' },
          { name: 'Wake-ups', weight: '30%', score: 50, detail: '3 wake-ups' },
          { name: 'Bedtime', weight: '15%', score: 50, detail: 'Ideal: 19:00–20:00 (WHO)' },
          { name: 'Naps', weight: '15%', score: 60, detail: '1 nap (ideal: 2)' },
        ] }) },
      { label: 'Medical · Fair (58) — a dose due now, checkup may be due', html: domainHero({
        key: 'medical', word: 'Medical', sub: 'Based on vaccines, supplements, growth & checkups', weight: '15%', score: 58,
        comps: [
          { name: 'Vaccines', weight: '40%', score: 62, detail: '7/8 scheduled vaccines given · 1 due now' },
          { name: 'Supplements', weight: '25%', score: 86, detail: '6/7 days given this week' },
          { name: 'Growth', weight: '20%', score: 70, detail: 'Last measured 9d ago (wt+ht)' },
          { name: 'Checkup', weight: '15%', score: 40, detail: 'Developmental checkup may be due' },
        ] }) },
      { label: 'Poop · Needs attention (42), carried forward (stale)', html: domainHero({
        key: 'poop', word: 'Poop', sub: 'Based on consistency, frequency, color & symptoms', weight: '20%', score: 42, stale: true,
        comps: [
          { name: 'Carry-forward', weight: '', score: 42, detail: 'No poop today — using last score (2d ago, −4 decay)' },
        ] }) },
    ],
  },
];

// ── Page assembly ──
function specimen(s) {
  const panels = s.exemplars.map(ex => `
    <div class="sc-specimen">
      <div class="sc-specimen-label">${esc(ex.label)}</div>
      <div class="sc-render-row">
        <div class="sc-panel"><span class="sc-mode">Light</span><div class="sc-stage">${ex.html}</div></div>
        <div class="sc-panel" data-theme="dark"><span class="sc-mode">Dark</span><div class="sc-stage">${ex.html}</div></div>
      </div>
      <details class="sc-markup"><summary>Canonical markup</summary><pre><code>${esc(ex.html.trim())}</code></pre></details>
    </div>`).join('');
  return `<section class="sc-surface" id="${s.id}">
    <h3>${esc(s.title)}</h3>
    <p class="sc-surface-note">${s.note.replace(/`([^`]+)`/g, (m, c) => '<code>' + esc(c) + '</code>')}</p>
    ${panels}
  </section>`;
}

const ROADMAP = [
  ['Heroes', 'live', 'Ziva Score + per-tab domain heroes'],
  ['Cards', 'next', 'action / info / stat cards'],
  ['Chips & pills', 'planned', 'domain chips, food chips, status pills'],
  ['Inputs & steppers', 'planned', 'text/date/time inputs, qty steppers, intake pills'],
  ['Composer rails & lists', 'planned', 'L1–L4 rails, 48px item rows — where the white-bg + Diet-tab prediction-visibility regressions get settled'],
  ['Toasts & overlays', 'planned', 'undo toast, post-save flash, bottom sheets, score popup'],
  ['Interactions', 'planned', 'save-on-action, burst + undo choreography, blur-dismiss'],
];

const heroSection = SURFACES.map(specimen).join('\n');
const roadmapRows = ROADMAP.map(([name, state, desc]) =>
  `<tr class="sc-rm-${state}"><td>${esc(name)}</td><td><span class="sc-badge sc-badge-${state}">${state}</span></td><td>${esc(desc)}</td></tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SproutLab — Surface Catalog</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- the LIVE app stylesheet, linked (edit split/styles.css, never this page) -->
<link rel="stylesheet" href="../split/styles.css">
<style>
/* ── catalog chrome (sc-* only; never collides with app classes) ── */
body { padding:0; margin:0; }
.sc-wrap { max-width:1100px; margin:0 auto; padding:var(--sp-24, 24px) var(--sp-16, 16px) 80px; }
.sc-banner { background:var(--amber-light, #f7ecd6); border:1.5px solid var(--amber, #e8b86d); border-radius:14px; padding:14px 18px; margin-bottom:24px; font-size:14px; line-height:1.5; color:var(--text, #3a2e2e); }
.sc-h1 { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:var(--text, #3a2e2e); margin:8px 0 4px; }
.sc-sub { color:var(--mid, #8a7a72); font-size:15px; margin:0 0 8px; }
.sc-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:18px 0 8px; }
.sc-toolbar .sc-zlabel { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--mid,#8a7a72); font-weight:700; }
.sc-zbtn { font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; padding:6px 12px; border-radius:999px; border:1.5px solid var(--border-subtle,#e8ddd5); background:var(--surface,#fff); color:var(--mid,#8a7a72); cursor:pointer; }
.sc-zbtn.active { background:var(--tc-rose,#c2607a); color:#fff; border-color:var(--tc-rose,#c2607a); }
.sc-rm { width:100%; border-collapse:collapse; margin:8px 0 28px; font-size:14px; }
.sc-rm td { padding:8px 10px; border-bottom:1px solid var(--border-subtle,#eee); }
.sc-badge { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:2px 9px; border-radius:999px; }
.sc-badge-live { background:var(--sage,#b5d5c5); color:#1a4a32; }
.sc-badge-next { background:var(--amber,#e8b86d); color:#5a3e10; }
.sc-badge-planned { background:var(--border-subtle,#eee); color:var(--mid,#8a7a72); }
.sc-rm-live td:first-child { font-weight:800; }
.sc-h2 { font-family:'Fraunces',serif; font-size:24px; color:var(--text,#3a2e2e); margin:10px 0 0; }
.sc-surface { margin:0 0 40px; }
.sc-surface > h3 { font-family:'Fraunces',serif; font-size:21px; font-weight:600; color:var(--text,#3a2e2e); margin:30px 0 4px; padding-top:14px; border-top:2px solid var(--border-subtle,#eee); }
.sc-surface-note { color:var(--mid,#8a7a72); font-size:14px; line-height:1.5; margin:0 0 14px; }
.sc-surface-note code, .sc-markup code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.86em; background:var(--warm,#f3ece6); padding:1px 5px; border-radius:5px; }
.sc-specimen { margin:0 0 22px; }
.sc-specimen-label { font-size:13px; font-weight:700; color:var(--mid,#8a7a72); margin:0 0 8px; }
.sc-render-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:720px){ .sc-render-row { grid-template-columns:1fr; } }
.sc-panel { position:relative; border-radius:16px; padding:30px 18px 18px; background:var(--cream,#fffaf7); border:1px solid var(--border-subtle,#e8ddd5); overflow:visible; }
.sc-panel[data-theme="dark"] { background:var(--cream); border-color:#3a2e3e; }
.sc-mode { position:absolute; top:8px; left:12px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--light,#b0a098); }
.sc-stage { /* the live surface renders here, on its real token background */ }
.sc-markup { margin-top:10px; }
.sc-markup summary { font-size:12px; font-weight:700; color:var(--mid,#8a7a72); cursor:pointer; }
.sc-markup pre { background:var(--warm,#f6f0ea); border:1px solid var(--border-subtle,#e8ddd5); border-radius:10px; padding:12px; overflow:auto; font-size:11.5px; line-height:1.45; margin:8px 0 0; }
[data-theme="dark"] .sc-markup pre { background:#221c28; border-color:#3a2e3e; }
</style>
</head>
<body>
${sprites}
<div class="sc-wrap">
  <div class="sc-banner"><strong>Generated view — do not hand-edit.</strong> Rebuilt every build by <code>split/build-surface-catalog.mjs</code> from the live <code>split/styles.css</code> + sprite. This is the <strong>design surface</strong>: to build a new surface, add its exemplar to the <code>SURFACES</code> array in the generator first, review it here rendered (this is what ships — same stylesheet), get sign-off, then wire the feature with these exact classes. Edit exemplars in the generator, never this file.</div>

  <div class="sc-h1">Surface Catalog</div>
  <p class="sc-sub">Every canonical SproutLab surface, rendered with the live tokens in light + dark. The visual contract that prevents post-build surprises.</p>

  <div class="sc-toolbar">
    <span class="sc-zlabel">Zoom</span>
    <button class="sc-zbtn active" data-zoom="">Default</button>
    <button class="sc-zbtn" data-zoom="med">Medium</button>
    <button class="sc-zbtn" data-zoom="high">Large</button>
  </div>

  <table class="sc-rm"><tbody>${roadmapRows}</tbody></table>

  <h2 class="sc-h2">Heroes</h2>
  ${heroSection}
</div>
<script>
  document.querySelectorAll('.sc-zbtn').forEach(function(b){
    b.addEventListener('click', function(){
      // Mirrors setZoomLevel (core.js): Default removes the attribute.
      if (b.dataset.zoom) document.documentElement.dataset.zoom = b.dataset.zoom;
      else document.documentElement.removeAttribute('data-zoom');
      document.querySelectorAll('.sc-zbtn').forEach(function(x){ x.classList.toggle('active', x===b); });
    });
  });
</script>
</body>
</html>`;

writeFileSync(OUT, html);
console.error('Surface Catalog generated: docs/SURFACE_CATALOG.html (' + (html.length / 1024).toFixed(0) + 'KB; heroes section)');
