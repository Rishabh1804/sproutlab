import { readFileSync, writeFileSync } from 'node:fs';

const sprite = readFileSync('/tmp/zi-sprite.svg', 'utf8');

// ── Categorisation of the 109 zi-* sprites ────────────────────────────────
const cats = [
  ['Navigation & Controls', 'Chrome: move, expand, play/transport, share, links.',
    ['arrow-right','chevron-down','chevron-up','skip-forward','undo','pause','play','stop','link','ios-share','share','follow-up','list','close']],
  ['Status & Flags', 'State signals, validity, alerts, country flags.',
    ['alert-circle','check','no-entry','warn','info','resolve','dot-empty','dot-red','flag-in','flag-eu','flag-cn','shield','siren','emergency','bell']],
  ['Data & Metrics', 'Charts, trends, gauges, measurement, time.',
    ['bars','chart','progress','halfcircle','target','goal','trending-up','trending-down','trending-flat','trending-mixed','scale','ruler','timer','hourglass','clock']],
  ['Sky, Time & Weather', 'Sleep/time domain — sun, weather, full lunar phase set.',
    ['sun','cloud','rain','snow','rainbow','moon','moon-new','moon-waxing-crescent','moon-first-quarter','moon-waxing-gibbous','moon-full','moon-waning-gibbous','moon-third-quarter','moon-waning-crescent']],
  ['Body, Mood & Growth', 'Baby, milestones, mood, development.',
    ['baby','brain','heart','run','fall','bump','shy','sleep','zzz','handshake','sprout','bubble','chat','bulb']],
  ['Medical & Care', 'Vaccinations, symptoms, samples, care.',
    ['medical','steth','syringe','pill','blood-drop','diaper','flask','drop','scope']],
  ['Food & Diet  →  migrating to zif-*', 'Generic food glyphs — superseded by the full-colour, per-ingredient zif-* set.',
    ['bowl','rice','grain','legume','fruit','carrot','pepper','spoon','chef']],
  ['Objects & Decorative', 'Celebration, brand warmth, tools, misc.',
    ['balloon','party','diya','lotus','crystal','mirror','palette','sparkle','star','flame','bolt','trophy','book','camera','clipboard','note','phone','save','track']],
];

// sanity: report any uncategorised
const all = sprite.match(/id="zi-([a-z0-9-]+)"/g).map(s => s.replace(/id="zi-(.*)"/,'$1'));
const placed = new Set(cats.flatMap(c => c[2]));
const missing = all.filter(n => !placed.has(n));
const extra = [...placed].filter(n => !all.includes(n));
console.error('total sprites:', all.length, '| placed:', placed.size, '| uncategorised:', missing.join(',')||'none', '| ghost:', extra.join(',')||'none');

const cell = (n, food) =>
  `<div class="cell${food?' food':''}"><svg class="zi"><use href="#zi-${n}"/></svg><span class="nm">${n}</span></div>`;

const groups = cats.map(([title, desc, names], i) => `
  <section>
    <div class="ghead"><h2>${title}</h2><span class="cnt">${names.length}</span></div>
    <p class="gdesc">${desc}</p>
    <div class="grid">${names.map(n => cell(n, i===6)).join('')}</div>
  </section>`).join('\n');

const html = `<!DOCTYPE html>
<!--
  SproutLab · zi sprite inventory + categorisation (design-system prep)
  ───────────────────────────────────────────────────────────────────
  All 109 zi-* sprites grouped into 8 categories, rendered from the real
  template.html sprite block. Groundwork for icon-system categorisation
  as zi gets design upgrades. The Food & Diet group is flagged as
  migrating to the full-colour, per-ingredient zif-* namespace.
-->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}
  body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:28px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 26px;max-width:680px;}
  section{margin:0 0 26px;}
  .ghead{display:flex;align-items:baseline;gap:10px;border-bottom:1.5px solid var(--card-border);padding-bottom:5px;margin-bottom:3px;}
  h2{font-family:'Fraunces',serif;font-size:18px;font-weight:600;margin:0;}
  .cnt{font-size:12px;font-weight:800;color:var(--light);}
  .gdesc{font-size:12px;color:var(--light);margin:0 0 12px;}
  .grid{display:grid;grid-template-columns:repeat(9,1fr);gap:10px;}
  .cell{background:#fff;border:1px solid var(--card-border);border-radius:13px;padding:12px 4px 7px;display:flex;flex-direction:column;align-items:center;gap:6px;}
  .cell .zi{width:30px;height:30px;color:var(--ink,#5b5048);}
  .nm{font-size:9.5px;font-weight:700;color:var(--mid);text-align:center;line-height:1.15;}
  .cell.food{background:#fbf0e6;border-color:var(--tc-caution);}
  .cell.food .zi{color:var(--tc-caution);}
</style></head><body>
${sprite}
<h1>zi sprite inventory — 109 icons, 8 categories</h1>
<p class="lead">The full <code>zi-*</code> set rendered from <code>template.html</code>, grouped to prepare the icon system for categorisation. Monochrome <code>currentColor</code> UI/semantic glyphs. The <b>Food &amp; Diet</b> group (amber) is generic and is being superseded by the full-colour, per-ingredient <code>zif-*</code> namespace.</p>
${groups}
</body></html>`;

writeFileSync('docs/design/zi-inventory.html', html);
console.error('wrote docs/design/zi-inventory.html');
