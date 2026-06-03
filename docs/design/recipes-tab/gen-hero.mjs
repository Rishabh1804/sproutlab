// SproutLab · Recipes hero generator — quantity-weighted generative fingerprint.
// Tweaks (Architect, 2026-06-03):
//   • FADE + STRIPE band-widths are weighted by each ingredient's quantity (grams),
//     wavelength-ordered (rose→peach→amber→sage→sky→indigo→lav). p5-style generative.
//   • STRIPE animates — a "warm wave": a sheen sweeps across the weighted gradient.
//   • WATERMARK uses the real zif_food icons (food colours), repositioned so they
//     never touch; dominant ingredient gets the big slot.
import { readFileSync, writeFileSync } from 'node:fs';

// pull the canonical zif sprite (61 symbols) from the approved sheet — no duplication
const sheet = readFileSync('docs/design/zi-food-sheet.html', 'utf8');
const sprite = sheet.match(/<svg style="display:none">[\s\S]*?<\/svg>/)[0];

// domain → wavelength order + colour expressions.
// STRIPE: soft mid-tone hues (de-neoned — between the pale --* and the harsh --tc-*).
// FADE: soft --*-light tints (theme-aware). CHIP: same --*-light bg + soft domain border.
const DOM = {
  fruit:  {o:0, sat:'#e59cb0', light:'var(--rose-light)',   dark:'rgba(158,62,82,0.20)',  dt:'fruits'},
  veg:    {o:1, sat:'#ecae7e', light:'var(--peach-light)',  dark:'rgba(138,101,32,0.18)', dt:'vegs'},
  legume: {o:2, sat:'#e6c078', light:'var(--amber-light)',  dark:'rgba(150,110,40,0.18)', dt:'legume'},
  grain:  {o:3, sat:'#9fcdb5', light:'var(--sage-light)',   dark:'rgba(58,112,96,0.17)',  dt:'grains'},
  dairy:  {o:4, sat:'#a0cce0', light:'var(--sky-light)',     dark:'rgba(58,112,144,0.18)', dt:'dairy'},
  nuts:   {o:6, sat:'#c4b4e6', light:'var(--lav-light)',     dark:'rgba(110,94,154,0.18)', dt:'nuts'},
};

// demo recipes: grams drive the weighting; trace ingredients excluded from the fingerprint
const RECIPES = [
  { title:'Veg & Paneer Khichdi', badge:'Lunch', tags:['a soft, savoury one-pot','gentle on little tummies','comfort in a bowl'], why:'Rice-led one-pot — soft grain base, a little carrot for colour and beta-carotene, paneer for protein.',
    ings:[
      {n:'Rice', g:60, dom:'grain', icon:'rice', c:'#d8c79f'},
      {n:'Carrot', g:24, dom:'veg', icon:'carrot', c:'#e8843a'},
      {n:'Paneer', g:14, dom:'dairy', icon:'paneer', c:'#cdbf93'},
      {n:'Ghee', g:5, dom:'trace', td:'legume', icon:'ghee', c:'#e8b94f'},
    ], time:'25 min', age:'7m+' },
  { title:'Almond Banana Mash', badge:'Breakfast', tags:['a five-minute creamy breakfast','naturally sweet, no added sugar','soft, spoonable, mess-free'], why:'Banana-forward mash, a spoon of almond powder folded in for healthy fats and a nutty note.',
    ings:[
      {n:'Banana', g:100, dom:'fruit', icon:'banana', c:'#e9c44a'},
      {n:'Almond powder', g:12, dom:'nuts', icon:'almond', c:'#b9824e'},
    ], time:'5 min', age:'6m+' },
  { title:'Ragi Banana Porridge', badge:'Breakfast', tags:['iron-rich & naturally sweet','a warm morning bowl','ragi’s gentle first porridge'], why:'Banana sweetens a ragi porridge — fruit leads, millet gives iron and body.',
    ings:[
      {n:'Banana', g:50, dom:'fruit', icon:'banana', c:'#e9c44a'},
      {n:'Ragi', g:30, dom:'grain', icon:'millet', c:'#b06a44'},
      {n:'Milk', g:8, dom:'trace', td:'dairy', icon:'milk', c:'#cdbf93'},
    ], time:'12 min', age:'7m+' },
  // 4th = an UNCURATED mix (no tags) → proves the generative fallback
  { title:'Carrot Moong Mash', badge:'Lunch', why:'A quick veg-and-dal mash — carrot for sweetness, moong for easy protein.',
    ings:[
      {n:'Carrot', g:45, dom:'veg', icon:'carrot', c:'#e8843a'},
      {n:'Moong dal', g:30, dom:'legume', icon:'dal', c:'#9bb24a'},
      {n:'Ghee', g:4, dom:'trace', td:'legume', icon:'ghee', c:'#e8b94f'},
    ], time:'18 min', age:'6m+' },
];

const r2 = n => Math.round(n * 10) / 10;

function fingerprint(rec) {
  const prim = rec.ings.filter(i => i.dom !== 'trace');
  // aggregate grams per domain
  const byDom = {};
  for (const i of prim) byDom[i.dom] = (byDom[i.dom] || 0) + i.g;
  const total = Object.values(byDom).reduce((a, b) => a + b, 0);
  // wavelength-ordered domain weights (fraction)
  const doms = Object.entries(byDom)
    .map(([d, g]) => ({ d, frac: g / total, ...DOM[d] }))
    .sort((a, b) => a.o - b.o);
  // smooth weighted stops: each colour at the cumulative MIDPOINT of its band
  const stopsAt = key => {
    let cum = 0; const s = [];
    for (const x of doms) { const mid = cum + x.frac / 2; s.push(`${x[key]} ${r2(mid * 100)}%`); cum += x.frac; }
    return s;
  };
  const stripe = `linear-gradient(90deg, ${doms[0].sat} 0%, ${stopsAt('sat').join(', ')}, ${doms.at(-1).sat} 100%)`;
  const fadeL  = `linear-gradient(135deg, ${doms[0].light} 0%, ${stopsAt('light').join(', ')}, ${doms.at(-1).light} 100%)`;
  // dark fade: weighted 135deg with deep rgba hues
  let cum = 0; const ds = [];
  for (const x of doms) { const mid = cum + x.frac / 2; ds.push(`${x.dark} ${r2(mid*100)}%`); cum += x.frac; }
  const fadeD = `linear-gradient(135deg, ${doms[0].dark} 0%, ${ds.join(', ')}, ${doms.at(-1).dark} 100%)`;
  // watermark slots: dominant ingredient → big slot
  const ranked = [...prim].sort((a, b) => b.g - a.g).slice(0, 3);
  const dominant = doms.slice().sort((a, b) => b.frac - a.frac)[0].d;
  return { doms, stripe, fadeL, fadeD, ranked, dominant,
    pct: doms.map(x => `${x.d} ${Math.round(x.frac*100)}%`).join(' · ') };
}

// ── tagline system ───────────────────────────────────────────────────────────
// Curated recipes carry 2–3 taglines, rotated by a day-seed (novelty, not random).
// Uncurated mixes fall back to a generated line: {texture}, {dominant-domain} {form}.
const FORM = [
  [/khichdi/i,            ['a soft',   'one-pot']],
  [/porridge|kheer|malt/i,['a warm',   'porridge']],
  [/mash|pur[eé]e/i,      ['a smooth', 'mash']],
  [/soup|broth/i,         ['a cosy',   'soup']],
  [/dosa|idli|upma|poha/i,['a light',  'bite']],
];
const DOMPHRASE = {grain:'grain-led', veg:'veggie-forward', fruit:'fruit-sweet', legume:'protein-rich', dairy:'creamy', nuts:'nutty'};
const fallbackTag = (rec, fp) => {
  let tex = 'a gentle', form = 'bowl';
  for (const [re, [t, f]] of FORM) if (re.test(rec.title)) { tex = t; form = f; break; }
  return `${tex}, ${DOMPHRASE[fp.dominant] || 'wholesome'} ${form}`;
};
// deterministic day-seed → same dish reads fresh across days, stable within a day
const DAYSEED = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
const pickTag = (rec, fp) => {
  const pool = (rec.tags && rec.tags.length) ? rec.tags : [fallbackTag(rec, fp)];
  return { tag: pool[DAYSEED % pool.length], pool, generated: !(rec.tags && rec.tags.length) };
};

const SLOTS = ['s1', 's2', 's3'];
const card = (rec) => {
  const fp = fingerprint(rec);
  const t = pickTag(rec, fp);
  const wm = fp.ranked.map((i, k) =>
    `<span class="wi ${SLOTS[k]}"><svg class="zi" style="color:${i.c}"><use href="#zif-${i.icon}"/></svg></span>`).join('');
  const chips = rec.ings.map(i => {
    const dk = i.dom !== 'trace' ? i.dom : i.td;       // trace items tint via mapped domain
    return `<span class="gh-chip dt-${DOM[dk].dt}"><svg class="zi" style="color:${i.c}"><use href="#zif-${i.icon}"/></svg>${i.n}</span>`;
  }).join('');
  // design-record only: show the tagline bank so the rotation is legible
  const others = t.pool.filter(x => x !== t.tag);
  const bank = t.generated
    ? `<span class="bk-gen">generated fallback</span>`
    : (others.length ? `+${others.length} more · rotates daily` : '');
  return `<article class="gh" style="--stripe:${fp.stripe};--fl:${fp.fadeL};--fd:${fp.fadeD}">
    <div class="gh-wm">${wm}</div>
    <div class="gh-top"><span class="gh-eyebrow"><svg class="zi"><use href="#zi-sparkle"/></svg>Recipe of the day</span>
      <span class="gh-badge">${rec.badge}</span></div>
    <h3 class="gh-title">${rec.title}</h3>
    <p class="gh-tag">${t.tag}${bank ? `<span class="gh-bank"> · ${bank}</span>` : ''}</p>
    <p class="gh-why">${rec.why}</p>
    <div class="gh-ings">${chips}</div>
    <div class="gh-foot"><span class="gh-meta"><svg class="zi"><use href="#zi-clock"/></svg><b>${rec.time}</b></span>
      <span class="gh-meta"><svg class="zi"><use href="#zi-baby"/></svg><b>${rec.age}</b></span></div>
  </article>
  <p class="fp">fingerprint · weighted ${fp.pct}</p>`;
};

const col = (theme) => `<div class="r-col">
  <p class="r-mode ${theme}">${theme === 'light' ? 'Light' : 'Dark'}</p>
  <div class="r-phone"${theme==='dark'?' data-theme="dark"':''}>
    <h2 class="r-h">Recipes</h2>
    ${RECIPES.map(card).join('\n')}
  </div></div>`;

// minimal extra zi glyphs used (sparkle/clock/baby) come from the food sheet? No — pull from template
const tmpl = readFileSync('split/template.html', 'utf8');
const pick = id => (tmpl.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`)) || [''])[0];
const uiSprite = ['zi-sparkle','zi-clock','zi-baby'].map(pick).join('\n');

const html = `<!DOCTYPE html>
<!--
  SproutLab · Recipes hero — S9 WEIGHTED + MOTION (design record, generated by gen-hero.mjs)
  • Stripe/fade band-widths weighted by ingredient grams (wavelength-ordered).
  • Stripe animates: a warm-wave sheen sweeps the weighted gradient (live in-browser).
  • Watermark = real zif_food icons, repositioned non-overlapping; dominant = big slot.
-->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../../split/styles.css">
<style>
  html,body{background:#cfc6bf;margin:0;}body{font-family:'Nunito',sans-serif;padding:24px;}
  .r-stage{display:flex;gap:28px;align-items:flex-start;justify-content:center;}
  .r-col{width:412px;flex:0 0 auto;}
  .r-mode{font-family:'Fraunces',serif;font-weight:600;font-size:18px;text-align:center;margin:0 0 10px;}
  .r-mode.light{color:#5a4f48;}.r-mode.dark{color:#2a2230;}
  .r-phone{width:412px;box-sizing:border-box;background:#faf6f3;color:var(--text);border-radius:22px;padding:var(--sp-16);box-shadow:0 6px 30px rgba(0,0,0,0.14);}
  .r-phone[data-theme="dark"]{background:#1a1620;box-shadow:0 6px 30px rgba(0,0,0,0.5);}
  .r-h{font-family:'Fraunces',serif;font-size:var(--fs-2xl);font-weight:600;color:var(--text);margin:0 0 var(--sp-12);}

  .gh{position:relative;overflow:hidden;border-radius:var(--r-2xl);padding:var(--sp-24) var(--sp-24) 22px;box-shadow:0 8px 32px var(--shadow);margin-bottom:6px;background:var(--fl);}
  [data-theme="dark"] .gh{background:var(--fd);}
  /* weighted stripe — narrow, soft hues + warm-wave sheen */
  .gh::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;z-index:2;background:var(--stripe);}
  .gh::after{content:'';position:absolute;top:0;left:0;right:0;height:4px;z-index:3;pointer-events:none;
    background:linear-gradient(100deg,transparent 0 38%,rgba(255,255,255,.42) 50%,transparent 62% 100%);
    background-size:320% 100%;animation:ghsweep 4.4s ease-in-out infinite;}
  [data-theme="dark"] .gh::after{background:linear-gradient(100deg,transparent 0 38%,rgba(255,255,255,.22) 50%,transparent 62% 100%);background-size:320% 100%;}
  @keyframes ghsweep{0%{background-position:135% 0;}100%{background-position:-75% 0;}}

  /* watermark — organic arc, dominant icon anchors the corner (bleeds slightly); non-overlapping */
  .gh-wm{position:absolute;right:0;bottom:0;width:210px;height:104px;pointer-events:none;z-index:0;}
  .gh-wm .wi{position:absolute;}
  .gh-wm .s1{width:84px;height:84px;right:-6px;bottom:-8px;}
  .gh-wm .s2{width:50px;height:50px;right:84px;bottom:8px;}
  .gh-wm .s3{width:36px;height:36px;right:146px;bottom:-2px;}
  .gh-wm .zi{width:100%;height:100%;opacity:.32;}
  [data-theme="dark"] .gh-wm .zi{opacity:.42;}

  .gh-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:var(--sp-8);margin-bottom:var(--sp-10);}
  .gh-eyebrow{display:inline-flex;align-items:center;gap:var(--sp-6);font-size:var(--fs-2xs);font-weight:800;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--tc-sage);}
  .gh-eyebrow .zi{width:15px;height:15px;}
  .gh-badge{flex:0 0 auto;display:inline-flex;align-items:center;gap:var(--sp-4);background:var(--tc-sage);color:var(--card-bg);border-radius:var(--r-full);padding:var(--sp-4) var(--sp-10);font-size:var(--fs-2xs);font-weight:800;}
  /* direction C — roman title + Fraunces italic "voice" descriptor */
  .gh-title{position:relative;z-index:1;font-family:'Fraunces',serif;font-weight:700;font-size:31px;line-height:1.06;letter-spacing:-0.01em;color:var(--text);margin-bottom:2px;max-width:92%;text-wrap:balance;}
  .gh-tag{position:relative;z-index:1;font-family:'Fraunces',serif;font-style:italic;font-weight:400;font-size:var(--fs-lg);line-height:1.25;color:var(--mid);margin:0 0 var(--sp-10);max-width:82%;}
  .gh-bank{font-family:'Nunito',sans-serif;font-style:normal;font-size:10.5px;font-weight:700;color:var(--light);opacity:.85;}
  .bk-gen{font-family:'Nunito',sans-serif;font-style:normal;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--tc-sage);}
  .gh-why{position:relative;z-index:1;font-size:var(--fs-sm);color:var(--mid);line-height:1.5;margin-bottom:var(--sp-12);max-width:78%;}
  .gh-ings{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:var(--sp-6);margin-bottom:var(--sp-16);max-width:82%;}
  .gh-chip{display:inline-flex;align-items:center;gap:var(--sp-4);background-color:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-full);padding:var(--sp-4) var(--sp-10);font-size:var(--fs-xs);font-weight:700;color:var(--text);}
  .gh-chip .zi{width:15px;height:15px;flex:0 0 auto;}
  /* food-domain WHISPER FADE — verbatim from the decided library record (transparent 40% → accent .22) */
  .dt-grains{background-image:linear-gradient(135deg,transparent 40%,rgba(181,213,197,0.22));border-color:rgba(181,213,197,0.7);}
  .dt-fruits{background-image:linear-gradient(135deg,transparent 40%,rgba(242,168,184,0.22));border-color:rgba(242,168,184,0.7);}
  .dt-vegs  {background-image:linear-gradient(135deg,transparent 40%,rgba(250,212,180,0.30));border-color:rgba(245,196,150,0.8);}
  .dt-legume{background-image:linear-gradient(135deg,transparent 40%,rgba(232,184,109,0.24));border-color:rgba(232,184,109,0.7);}
  .dt-dairy {background-image:linear-gradient(135deg,transparent 40%,rgba(168,207,224,0.22));border-color:rgba(168,207,224,0.7);}
  .dt-nuts  {background-image:linear-gradient(135deg,transparent 40%,rgba(201,184,232,0.22));border-color:rgba(201,184,232,0.7);}
  [data-theme="dark"] .dt-grains{background-image:linear-gradient(135deg,transparent 30%,rgba(58,112,96,0.18));border-color:rgba(122,192,160,0.4);}
  [data-theme="dark"] .dt-fruits{background-image:linear-gradient(135deg,transparent 30%,rgba(158,62,82,0.20));border-color:rgba(224,144,168,0.4);}
  [data-theme="dark"] .dt-vegs  {background-image:linear-gradient(135deg,transparent 30%,rgba(138,101,32,0.20));border-color:rgba(232,184,112,0.4);}
  [data-theme="dark"] .dt-legume{background-image:linear-gradient(135deg,transparent 30%,rgba(150,110,40,0.20));border-color:rgba(212,168,72,0.4);}
  [data-theme="dark"] .dt-dairy {background-image:linear-gradient(135deg,transparent 30%,rgba(58,112,144,0.18));border-color:rgba(128,184,216,0.4);}
  [data-theme="dark"] .dt-nuts  {background-image:linear-gradient(135deg,transparent 30%,rgba(110,94,154,0.20));border-color:rgba(184,168,224,0.4);}
  .gh-foot{position:relative;z-index:1;display:flex;align-items:center;gap:var(--sp-14);}
  .gh-meta{display:flex;align-items:center;gap:var(--sp-6);font-size:var(--fs-xs);color:var(--mid);}
  .gh-meta .zi{width:14px;height:14px;}.gh-meta b{color:var(--text);font-weight:700;}
  .fp{font-size:10.5px;font-style:italic;font-weight:600;color:var(--light);opacity:.8;margin:0 0 18px;padding-left:4px;letter-spacing:.01em;}
  [data-theme="dark"] .fp{color:#8a7f88;}
</style></head><body>
${sprite}
<svg style="display:none">${uiSprite}</svg>
<div class="r-stage">${col('light')}${col('dark')}</div>
</body></html>`;

writeFileSync('docs/design/recipes-tab/09-hero-motion.html', html);
console.error('wrote 09-hero-motion.html');
for (const rec of RECIPES) console.error('  ·', rec.title, '→', fingerprint(rec).pct);
