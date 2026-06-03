// SproutLab · combination-tagline composer — PROTOTYPE (generated review sheet).
// Composes a tagline for any food combo from the ratified ingredient bank, weighted
// by quantity. Ratio picks the connector (volume → language); safety ALWAYS leads.
import { readFileSync, writeFileSync } from 'node:fs';

const sheet = readFileSync('docs/design/zi-food-sheet.html', 'utf8');
const sprite = sheet.match(/<svg style="display:none">[\s\S]*?<\/svg>/)[0];

// composable layer: epithet + noun (+ optional safety warn) + icon colour
const EP = {
  banana:{ep:'creamy',  noun:'banana',      c:'#e9c44a'},
  almond:{ep:'nutty',   noun:'almond',      c:'#b9824e', warn:'nuts ground fine'},
  peanut:{ep:'nutty',   noun:'peanut',      c:'#d9b27a', warn:'ground & watched'},
  rice:  {ep:'soft',    noun:'rice',        c:'#d8c79f'},
  carrot:{ep:'sweet',   noun:'carrot',      c:'#e8843a'},
  paneer:{ep:'mild',    noun:'paneer',      c:'#cdbf93'},
  dal:   {ep:'savoury', noun:'moong dal',   c:'#9bb24a'},
  millet:{ep:'earthy',  noun:'ragi',        c:'#b06a44'},
  oats:  {ep:'wholesome',noun:'oats',       c:'#d4bb7c'},
  apple: {ep:'sweet',   noun:'apple',       c:'#d2473f'},
  spinach:{ep:'leafy',  noun:'spinach',     c:'#5a9a42'},
  sweetpotato:{ep:'velvety',noun:'sweet potato',c:'#c56b3e'},
  pumpkin:{ep:'silky',  noun:'pumpkin',     c:'#e2913f'},
  grapes:{ep:'juicy',   noun:'grape',       c:'#7d4f9e', warn:'grapes halved first'},
  honey: {ep:'golden',  noun:'honey',       c:'#e8a93a', warn:'honey from age 1'},
};

const connector = s =>
  s < 0.12 ? 'with just a hint of' :
  s < 0.22 ? 'with a touch of'     :
  s < 0.33 ? 'with a little'       :
  s < 0.45 ? 'balanced with'       : 'meets';

// parts: [{id, w}] — composes one tagline, safety-first
function compose(parts) {
  const items = parts.map(p => ({ ...EP[p.id], w: p.w })).sort((a, b) => b.w - a.w);
  const total = items.reduce((s, i) => s + i.w, 0);
  const warns = [...new Set(items.filter(i => i.warn).map(i => i.warn))];
  const dom = items[0];
  let body;
  if (items.length === 1) {
    body = `${dom.ep} ${dom.noun}`;
  } else if (items.length === 2) {
    const m = items[1], con = connector(m.w / total);
    body = con === 'meets'
      ? `${dom.ep} ${dom.noun} meets ${m.ep} ${m.noun}`
      : `${dom.ep} ${dom.noun}, ${con} ${m.noun}`;
  } else {
    const mids = items.slice(1, -1).map(i => i.noun);
    const last = items.at(-1), lastCon = (last.w / total) < 0.15 ? 'a touch of' : 'a little';
    body = `${dom.ep} ${dom.noun}, with ${mids.join(', ')} and ${lastCon} ${last.noun}`;
  }
  return { warns, body };
}

// demo combos (id + grams) spanning 2/3/4 foods + safety cases
const COMBOS = [
  ['Almond Banana Mash',   [['banana',100],['almond',12]]],
  ['Veg & Paneer Khichdi', [['rice',60],['carrot',24],['paneer',14]]],
  ['Carrot Moong Mash',    [['carrot',45],['dal',30]]],
  ['Ragi Banana Porridge', [['banana',50],['millet',30]]],
  ['Oats & Apple',         [['oats',50],['apple',50]]],
  ['Banana Grape Mash',    [['banana',70],['grapes',30]]],
  ['Sweet Potato Bowl',    [['sweetpotato',60],['spinach',25],['peanut',15]]],
  ['Pumpkin Banana Mash',  [['pumpkin',80],['banana',20]]],
];

const row = ([name, parts]) => {
  const total = parts.reduce((s, [, w]) => s + w, 0);
  const sorted = [...parts].sort((a, b) => b[1] - a[1]);
  const icons = sorted.map(([id]) => `<span class="ic" style="color:${EP[id].c}"><svg class="zi"><use href="#zif-${id}"/></svg></span>`).join('');
  const ratio = sorted.map(([id, w]) => `${EP[id].noun} ${Math.round(w / total * 100)}%`).join(' · ');
  const { warns, body } = compose(parts.map(([id, w]) => ({ id, w })));
  const line = warns.length
    ? `<span class="warn">${warns.join('; ')}</span><span class="dot"> · </span><i>${body}</i>`
    : `<i>${body}</i>`;
  return `<div class="combo"><div class="hd"><span class="ics">${icons}</span><span class="cn">${name}</span></div>
    <div class="ratio">${ratio}</div><div class="tag">${line}</div></div>`;
};

const html = `<!DOCTYPE html>
<!-- SproutLab · combination-tagline composer prototype (gen-combo-taglines.mjs). -->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:26px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 8px;max-width:740px;}
  .key{font-size:12px;color:var(--light);margin:0 0 22px;max-width:740px;}
  .key b{color:var(--mid);}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:880px;}
  .combo{background:#fbf7f1;border:1px solid var(--card-border);border-radius:16px;padding:14px 16px;}
  .hd{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
  .ics{display:inline-flex;gap:2px;}.ic .zi{width:26px;height:26px;}
  .cn{font-family:'Fraunces',serif;font-weight:600;font-size:15px;color:var(--text);}
  .ratio{font-size:11px;font-weight:700;color:var(--light);margin-bottom:8px;letter-spacing:.01em;}
  .tag{font-size:16px;color:var(--mid);line-height:1.35;}
  .tag i{font-family:'Fraunces',serif;font-style:italic;}
  .warn{font-family:'Nunito';font-style:normal;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--tc-rose);}
  .dot{color:var(--light);}
  .legend{margin:18px 0 4px;font-size:12px;color:var(--light);max-width:760px;}
</style></head><body>
${sprite}
<h1>Combination taglines — composer prototype</h1>
<p class="lead">Any food combo composes its own tagline from the ratified ingredient bank, <b>weighted by quantity</b>. The ratio picks the connector, so volume shows up in the words; <b>safety always leads</b> (rose caps).</p>
<p class="key">connectors by minor share — <b>&lt;12%</b> “just a hint” · <b>~20%</b> “a touch” · <b>~30%</b> “a little” · <b>~40%</b> “balanced with” · <b>~50/50</b> “meets”.</p>
<div class="grid">${COMBOS.map(row).join('')}</div>
<p class="legend">Deterministic per combo. Replaces the generic domain-phrase fallback. Curated recipe taglines still win when present; this is the fallback for any uncurated mix.</p>
</body></html>`;

writeFileSync('docs/design/combo-taglines.html', html);
console.error('wrote combo-taglines.html');
for (const c of COMBOS) { const { warns, body } = compose(c[1].map(([id, w]) => ({ id, w }))); console.error('  ·', (warns.length ? warns.join(';') + ' · ' : '') + body); }
