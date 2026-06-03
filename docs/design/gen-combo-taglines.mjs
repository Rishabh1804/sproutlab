// SploutLab · combination-tagline composer — review sheet (uses shared taglines.mjs).
import { readFileSync, writeFileSync } from 'node:fs';
import { EP, compose } from './taglines.mjs';

const sheet = readFileSync('docs/design/zi-food-sheet.html', 'utf8');
const sprite = sheet.match(/<svg style="display:none">[\s\S]*?<\/svg>/)[0];

const COMBOS = [
  ['Almond Banana Mash',   [['banana',100],['almond',12]]],
  ['Veg & Paneer Khichdi', [['rice',60],['carrot',24],['paneer',14]]],
  ['Carrot Moong Mash',    [['carrot',45],['dal',30]]],
  ['Oats & Apple',         [['oats',50],['apple',50]]],
  ['Banana Grape Mash',    [['banana',70],['grapes',30]]],
  ['Sweet Potato Bowl',    [['sweetpotato',60],['spinach',25],['peanut',15]]],
  // expanded-bank coverage: egg(cooked) · fish(boneless) · chia(soaked) · jaggery(strict)
  ['Egg & Spinach Mash',   [['egg',50],['spinach',20],['potato',30]]],
  ['Fish & Rice',          [['fish',40],['rice',35]]],
  ['Chia Banana',          [['banana',85],['chia',5]]],
  ['Beetroot Curd',        [['curd',60],['beetroot',30]]],
  ['Honey Oats (strict)',  [['oats',80],['honey',10]]],
  ['Jaggery Suji (strict)',[['suji',70],['jaggery',8]]],
];
const SEED = 0;   // "today" for the static render

const render = ({ strict, body }) =>
  (strict.length ? `<span class="warn">${strict.join('; ')}</span><span class="dot"> · </span>` : '') + `<i>${body}</i>`;

const row = ([name, parts], seed = SEED) => {
  const total = parts.reduce((s, [, w]) => s + w, 0);
  const sorted = [...parts].sort((a, b) => b[1] - a[1]);
  const icons = sorted.map(([id]) => `<span class="ic" style="color:${EP[id].c}"><svg class="zi"><use href="#zif-${id}"/></svg></span>`).join('');
  const ratio = sorted.map(([id, w]) => `${EP[id].noun} ${Math.round(w / total * 100)}%`).join(' · ');
  return `<div class="combo"><div class="hd"><span class="ics">${icons}</span><span class="cn">${name}</span></div>
    <div class="ratio">${ratio}</div><div class="tag">${render(compose(parts.map(([id, w]) => ({ id, w })), seed))}</div></div>`;
};

// rotation demo — one combo across 3 day-seeds
const rotCombo = ['banana', 'almond'];
const rotParts = [['banana', 100], ['almond', 12]];
const rotRows = [0, 1, 2].map(s =>
  `<div class="rrow"><span class="day">day ${s + 1}</span><span class="rtag">${render(compose(rotParts.map(([id, w]) => ({ id, w })), s))}</span></div>`).join('');

const html = `<!DOCTYPE html>
<!-- SproutLab · combination-tagline composer (gen-combo-taglines.mjs → taglines.mjs). -->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:26px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 8px;max-width:760px;}
  .key{font-size:12px;color:var(--light);margin:0 0 22px;max-width:760px;}.key b{color:var(--mid);}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:880px;}
  .combo{background:#fbf7f1;border:1px solid var(--card-border);border-radius:16px;padding:14px 16px;}
  .hd{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
  .ics{display:inline-flex;gap:2px;}.ic .zi{width:26px;height:26px;}
  .cn{font-family:'Fraunces',serif;font-weight:600;font-size:15px;color:var(--text);}
  .ratio{font-size:11px;font-weight:700;color:var(--light);margin-bottom:8px;letter-spacing:.01em;}
  .tag{font-size:16px;color:var(--mid);line-height:1.35;}.tag i{font-family:'Fraunces',serif;font-style:italic;}
  .warn{font-family:'Nunito';font-style:normal;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--tc-rose);}
  .dot{color:var(--light);}
  .rot{margin:26px 0 0;max-width:560px;background:#fff;border:1px dashed var(--card-border);border-radius:16px;padding:14px 18px;}
  .rot h3{font-family:'Fraunces',serif;font-weight:600;font-size:14px;margin:0 0 4px;color:var(--text);}
  .rot p{font-size:11px;color:var(--light);margin:0 0 10px;}
  .rrow{display:flex;align-items:baseline;gap:12px;padding:5px 0;border-top:1px solid var(--card-border);}
  .day{flex:0 0 48px;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--light);}
  .rtag{font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:var(--mid);}
  .legend{margin:18px 0 4px;font-size:12px;color:var(--light);max-width:760px;}
</style></head><body>
${sprite}
<h1>Combination taglines — composer</h1>
<p class="lead">Any combo composes its own tagline from the ratified bank, <b>weighted by quantity</b>. Soft prep-cautions <b>fold into the phrase</b> (“ground almond”, “halved grape”); only <b>strict no’s</b> (honey · added sugar · salt) keep a prominent lead (rose caps). Epithets <b>rotate by day</b>.</p>
<p class="key">connector by minor share — <b>&lt;12%</b> “just a hint” · <b>~20%</b> “a touch” · <b>~30%</b> “a little” · <b>~40%</b> “balanced with” · <b>~50/50</b> “meets”.</p>
<div class="grid">${COMBOS.map(c => row(c)).join('')}</div>
<div class="rot"><h3>Epithet rotation — same combo, three days</h3><p>Almond Banana Mash · 89% / 11% — folded nut caution, dynamic adjective.</p>${rotRows}</div>
<p class="legend">Single shared module (<code>taglines.mjs</code>) feeds this sheet and the hero fallback. Curated recipe taglines still win when present.</p>
</body></html>`;

writeFileSync('docs/design/combo-taglines.html', html);
console.error('wrote combo-taglines.html');
for (const c of COMBOS) { const r = compose(c[1].map(([id, w]) => ({ id, w })), SEED); console.error('  ·', (r.strict.length ? r.strict.join(';') + ' · ' : '') + r.body); }
