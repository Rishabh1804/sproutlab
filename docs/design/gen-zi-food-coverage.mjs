// SproutLab · zi_food coverage map — the full ingredient roadmap vs. what's drawn.
// Corpus curated from data.js DEFAULT_FOODS + FOOD_SUGGESTIONS + food resolver vocab.
import { writeFileSync } from 'node:fs';

// done = has a zif-* icon (incl. via a shared symbol/variant). pending = roadmap.
const CORPUS = [
  ['Grains & Cereals',
    [['rice',1],['ragi / millet',1],['oats',1],['wheat',1],['suji / semolina',1],['poha',1],['corn',1],['dalia / broken wheat',0],['barley',0],['quinoa',0]]],
  ['Legumes & Pulses',
    [['toor dal',1],['moong dal',1],['masoor dal',1],['chana dal',1],['urad dal',0],['rajma',1],['chickpeas',1],['green peas',1],['sprouts',1],['peanut',1]]],
  ['Vegetables',
    [['carrot',1],['spinach / palak',1],['green beans',1],['bottle gourd',1],['beetroot',1],['pumpkin',1],['sweet potato',1],['potato',1],['broccoli',1],['cauliflower',1],['tomato',1],['bell pepper / capsicum',1],['cucumber',1],['zucchini',1],['onion',1],['garlic',1],['ginger',1],['mushroom',1],['brinjal / eggplant',0],['okra / bhindi',0],['drumstick',0],['cabbage',0]]],
  ['Fruits',
    [['banana',1],['pear',1],['apple',1],['mango',1],['avocado',1],['blueberry',1],['strawberry',1],['grapes',1],['date',1],['papaya',1],['orange',1],['pomegranate',1],['watermelon',1],['kiwi',1],['coconut',1],['apricot',0],['fig',0],['prune',0],['raisin',0],['custard apple',0],['sapota / chikoo',0],['pineapple',0],['peach',0],['plum',0],['muskmelon',0],['guava',0],['raspberry',0],['cranberry',0],['lemon',0]]],
  ['Dairy & Eggs',
    [['paneer',1],['milk',1],['ghee',1],['curd / yogurt',1],['cheese',1],['butter',1],['egg',1],['buttermilk',0]]],
  ['Nuts & Seeds',
    [['almond',1],['walnut',1],['cashew',1],['cumin / jeera',1],['pistachio',0],['pumpkin seed',0],['chia seed',0],['flaxseed',0],['sesame',0]]],
  ['Proteins',
    [['fish',1],['chicken',1],['tofu',1],['prawn',0],['mutton',0]]],
  ['Fats & Sweeteners',
    [['jaggery',1],['honey',1],['oil',0]]],
  ['Spices & Herbs',
    [['turmeric',0],['black pepper',0],['cinnamon',0],['cardamom',0],['coriander leaf',0],['mint',0]]],
];

const total = CORPUS.reduce((a,[,it]) => a+it.length, 0);
const done = CORPUS.reduce((a,[,it]) => a+it.filter(x=>x[1]).length, 0);

const chip = ([name,d]) => `<span class="chip ${d?'done':'todo'}">${d?'●':'○'} ${name}</span>`;
const sections = CORPUS.map(([title,items]) => {
  const d = items.filter(x=>x[1]).length;
  return `<section><div class="ghead"><h2>${title}</h2><span class="cnt">${d}/${items.length}</span></div>
  <div class="chips">${items.map(chip).join('')}</div></section>`;
}).join('\n');

const pct = Math.round(done/total*100);
const html = `<!DOCTYPE html>
<!-- SproutLab · zi_food coverage roadmap (generated). Corpus from data.js. -->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:28px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 14px;max-width:720px;}
  .bar{height:12px;border-radius:6px;background:#e0d4c4;max-width:720px;overflow:hidden;margin:0 0 4px;}
  .bar i{display:block;height:100%;width:${pct}%;background:var(--tc-sage);}
  .barlbl{font-size:12px;font-weight:800;color:var(--mid);margin:0 0 22px;}
  section{margin:0 0 16px;}
  .ghead{display:flex;align-items:baseline;gap:9px;border-bottom:1.5px solid var(--card-border);padding-bottom:4px;margin-bottom:9px;}
  h2{font-family:'Fraunces',serif;font-size:16px;font-weight:600;margin:0;}.cnt{font-size:11px;font-weight:800;color:var(--light);}
  .chips{display:flex;flex-wrap:wrap;gap:6px;}
  .chip{font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:11px;border:1px solid var(--card-border);}
  .chip.done{background:#e7f0e8;color:#3f6e4a;border-color:#c2dcc8;}
  .chip.todo{background:#fff;color:var(--light);border-style:dashed;}
</style></head><body>
<h1>zi_food coverage roadmap</h1>
<p class="lead">Every base ingredient the app's food DB &amp; suggestions reference (from <code>data.js</code>), mapped against what's drawn. Filled = has a <code>zif-*</code> icon; dashed = on the roadmap. Variants (e.g. all dals, gourds, capsicum) ride shared symbols.</p>
<div class="bar"><i></i></div>
<p class="barlbl">${done} of ${total} base ingredients drawn · ${pct}% · ${total-done} on the roadmap</p>
${sections}
</body></html>`;
writeFileSync('docs/design/zi-food-coverage.html', html);
console.error(`wrote zi-food-coverage.html — ${done}/${total} (${pct}%)`);
