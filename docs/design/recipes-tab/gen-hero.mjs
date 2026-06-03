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
// STRIPE uses saturated, theme-aware --tc-* tokens (visible stops); FADE stays soft (--*-light).
// (veg has no --tc-peach token yet → deep-peach literal, flagged for tokenising at wiring.)
const DOM = {
  fruit:  {o:0, sat:'var(--tc-rose)',  light:'var(--rose-light)',   dark:'rgba(158,62,82,0.20)'},
  veg:    {o:1, sat:'#df9356',         light:'var(--peach-light)',  dark:'rgba(138,101,32,0.18)'},
  legume: {o:2, sat:'var(--tc-amber)', light:'var(--amber-light)',  dark:'rgba(150,110,40,0.18)'},
  grain:  {o:3, sat:'var(--tc-sage)',  light:'var(--sage-light)',   dark:'rgba(58,112,96,0.17)'},
  dairy:  {o:4, sat:'var(--tc-sky)',   light:'var(--sky-light)',    dark:'rgba(58,112,144,0.18)'},
  nuts:   {o:6, sat:'var(--tc-lav)',   light:'var(--lav-light)',    dark:'rgba(110,94,154,0.18)'},
};

// demo recipes: grams drive the weighting; trace ingredients excluded from the fingerprint
const RECIPES = [
  { title:'Veg & Paneer Khichdi', badge:'Lunch', why:'Rice-led one-pot — soft grain base, a little carrot for colour and beta-carotene, paneer for protein.',
    ings:[
      {n:'Rice', g:60, dom:'grain', icon:'rice', c:'#d8c79f'},
      {n:'Carrot', g:24, dom:'veg', icon:'carrot', c:'#e8843a'},
      {n:'Paneer', g:14, dom:'dairy', icon:'paneer', c:'#cdbf93'},
      {n:'Ghee', g:5, dom:'trace', icon:'ghee', c:'#e8b94f'},
    ], time:'25 min', age:'7m+' },
  { title:'Almond Banana Mash', badge:'Breakfast', why:'Banana-forward mash, a spoon of almond powder folded in for healthy fats and a nutty note.',
    ings:[
      {n:'Banana', g:100, dom:'fruit', icon:'banana', c:'#e9c44a'},
      {n:'Almond powder', g:12, dom:'nuts', icon:'almond', c:'#b9824e'},
    ], time:'5 min', age:'6m+' },
  { title:'Ragi Banana Porridge', badge:'Breakfast', why:'Banana sweetens a ragi porridge — fruit leads, millet gives iron and body.',
    ings:[
      {n:'Banana', g:50, dom:'fruit', icon:'banana', c:'#e9c44a'},
      {n:'Ragi', g:30, dom:'grain', icon:'millet', c:'#b06a44'},
      {n:'Milk', g:8, dom:'trace', icon:'milk', c:'#f1eee4'},
    ], time:'12 min', age:'7m+' },
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
  return { doms, stripe, fadeL, fadeD, ranked,
    pct: doms.map(x => `${x.d} ${Math.round(x.frac*100)}%`).join(' · ') };
}

const SLOTS = ['s1', 's2', 's3'];
const card = (rec) => {
  const fp = fingerprint(rec);
  const wm = fp.ranked.map((i, k) =>
    `<span class="wi ${SLOTS[k]}"><svg class="zi" style="color:${i.c}"><use href="#zif-${i.icon}"/></svg></span>`).join('');
  const chips = rec.ings.map(i =>
    `<span class="gh-chip"><svg class="zi" style="color:${i.c}"><use href="#zif-${i.icon}"/></svg>${i.n}</span>`).join('');
  return `<article class="gh" style="--stripe:${fp.stripe};--fl:${fp.fadeL};--fd:${fp.fadeD}">
    <div class="gh-wm">${wm}</div>
    <div class="gh-top"><span class="gh-eyebrow"><svg class="zi"><use href="#zi-sparkle"/></svg>Recipe of the day</span>
      <span class="gh-badge">${rec.badge}</span></div>
    <h3 class="gh-title">${rec.title}</h3>
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
  /* weighted stripe + warm-wave sheen */
  .gh::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;z-index:2;background:var(--stripe);}
  .gh::after{content:'';position:absolute;top:0;left:0;right:0;height:8px;z-index:3;pointer-events:none;
    background:linear-gradient(100deg,transparent 0 36%,rgba(255,255,255,.62) 50%,transparent 64% 100%);
    background-size:300% 100%;animation:ghsweep 3.2s linear infinite;}
  [data-theme="dark"] .gh::after{background:linear-gradient(100deg,transparent 0 36%,rgba(255,255,255,.30) 50%,transparent 64% 100%);background-size:300% 100%;}
  @keyframes ghsweep{0%{background-position:130% 0;}100%{background-position:-70% 0;}}

  /* watermark — bottom-hugging fan, non-overlapping, dominant = big; never climbs to title */
  .gh-wm{position:absolute;right:0;bottom:0;width:200px;height:96px;pointer-events:none;z-index:0;}
  .gh-wm .wi{position:absolute;}
  .gh-wm .s1{width:74px;height:74px;right:10px;bottom:4px;}
  .gh-wm .s2{width:48px;height:48px;right:88px;bottom:11px;}
  .gh-wm .s3{width:34px;height:34px;right:150px;bottom:2px;}
  .gh-wm .zi{width:100%;height:100%;opacity:.26;}
  [data-theme="dark"] .gh-wm .zi{opacity:.36;}

  .gh-top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:var(--sp-8);margin-bottom:var(--sp-10);}
  .gh-eyebrow{display:inline-flex;align-items:center;gap:var(--sp-6);font-size:var(--fs-2xs);font-weight:800;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--tc-sage);}
  .gh-eyebrow .zi{width:15px;height:15px;}
  .gh-badge{flex:0 0 auto;display:inline-flex;align-items:center;gap:var(--sp-4);background:var(--tc-sage);color:var(--card-bg);border-radius:var(--r-full);padding:var(--sp-4) var(--sp-10);font-size:var(--fs-2xs);font-weight:800;}
  .gh-title{position:relative;z-index:1;font-family:'Fraunces',serif;font-weight:700;font-size:33px;line-height:1.05;letter-spacing:-0.01em;color:var(--text);margin-bottom:var(--sp-8);max-width:80%;}
  .gh-why{position:relative;z-index:1;font-size:var(--fs-sm);color:var(--mid);line-height:1.45;margin-bottom:var(--sp-12);max-width:78%;}
  .gh-ings{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:var(--sp-6);margin-bottom:var(--sp-16);max-width:82%;}
  .gh-chip{display:inline-flex;align-items:center;gap:var(--sp-4);background:var(--card-bg);border:1px solid var(--card-border);border-radius:var(--r-full);padding:var(--sp-4) var(--sp-10);font-size:var(--fs-xs);font-weight:600;color:var(--text);}
  .gh-chip .zi{width:15px;height:15px;flex:0 0 auto;}
  .gh-foot{position:relative;z-index:1;display:flex;align-items:center;gap:var(--sp-14);}
  .gh-meta{display:flex;align-items:center;gap:var(--sp-6);font-size:var(--fs-xs);color:var(--mid);}
  .gh-meta .zi{width:14px;height:14px;}.gh-meta b{color:var(--text);font-weight:700;}
  .fp{font-size:11px;font-weight:700;color:var(--light);margin:0 0 18px;padding-left:4px;letter-spacing:.01em;}
  [data-theme="dark"] .fp{color:#8a7f88;}
</style></head><body>
${sprite}
<svg style="display:none">${uiSprite}</svg>
<div class="r-stage">${col('light')}${col('dark')}</div>
</body></html>`;

writeFileSync('docs/design/recipes-tab/09-hero-motion.html', html);
console.error('wrote 09-hero-motion.html');
for (const rec of RECIPES) console.error('  ·', rec.title, '→', fingerprint(rec).pct);
