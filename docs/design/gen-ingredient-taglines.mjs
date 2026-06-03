// SproutLab · per-ingredient tagline bank — review sheet (generated).
// 2–3 short Fraunces-italic "voice" lines per ingredient (typography direction C),
// for single-food logs + as a richer source for recipe-fallback taglines.
// Safety-forward where it matters (honey 1y+, grapes halved, nuts ground).
import { readFileSync, writeFileSync } from 'node:fs';

const sheet = readFileSync('docs/design/zi-food-sheet.html', 'utf8');
const sprite = sheet.match(/<svg style="display:none">[\s\S]*?<\/svg>/)[0];

// [category, [ [zif-id, name, colour, [taglines...]] ]]
const BANK = [
  ['Grains & Cereals', [
    ['rice','Rice','#d8c79f',['a gentle first grain','soft and soothing']],
    ['millet','Ragi','#b06a44',['iron- & calcium-rich','an earthy little grain']],
    ['oats','Oats','#d4bb7c',['warm and wholesome','fibre for tiny tummies']],
    ['wheat','Wheat','#d9a945',['a hearty whole grain','soft-cooked and filling']],
    ['suji','Suji','#e7dcc2',['smooth and quick-cooking','light on the tummy']],
    ['corn','Corn','#ecc84e',['sweet little kernels','naturally sweet']],
  ]],
  ['Legumes & Pulses', [
    ['dal','Dal','#e8bd4e',['easy plant protein','soft, soupy and gentle','a first-dal favourite']],
    ['chana','Chana','#cda05c',['protein-packed','nutty and filling']],
    ['rajma','Rajma','#9c4338',['hearty bean protein','iron-rich beans']],
    ['peanut','Peanut','#d9b27a',['smooth, never whole','introduce early & watch']],
    ['sprouts','Sprouts','#86c258',['sprouted soft protein','easy to digest']],
  ]],
  ['Vegetables', [
    ['carrot','Carrot','#e8843a',['sweet and beta-rich','good for little eyes','naturally sweet']],
    ['spinach','Spinach','#5a9a42',['leafy iron','gentle cooked greens']],
    ['beans','Green beans','#6aa83f',['crisp green goodness','fibre-friendly']],
    ['bottlegourd','Bottle gourd','#9bbe63',['light and watering','easy on tummies']],
    ['beetroot','Beetroot','#9c3b6b',['earthy and ruby-sweet','iron-rich and bright']],
    ['pumpkin','Pumpkin','#e2913f',['silky and sweet','rich in beta-carotene']],
    ['sweetpotato','Sweet potato','#c56b3e',['sweet and creamy','beta-carotene rich']],
    ['potato','Potato','#cda36a',['soft and comforting','an easy first mash']],
    ['broccoli','Broccoli','#4f8a3a',['little green trees','vitamin-packed florets']],
    ['cauliflower','Cauliflower','#ece2c9',['mild and tender','gentle white florets']],
    ['tomato','Tomato','#d6473b',['mellow when cooked','bright and tangy']],
    ['pepper','Bell pepper','#d23b32',['sweet, not spicy','crunchy and colourful']],
    ['cucumber','Cucumber','#7bb34a',['cool and watering','soothing on sore gums']],
    ['zucchini','Zucchini','#4f7a3a',['soft and mild','a gentle summer green']],
    ['peas','Peas','#86c258',['sweet little pods','plant protein pops']],
    ['onion','Onion','#c9a3c0',['sweet when softened','a quiet flavour base']],
    ['garlic','Garlic','#ece4d5',['a gentle aromatic','flavour in a clove']],
    ['ginger','Ginger','#d6b483',['warming and settling','a tummy-friendly spice']],
    ['mushroom','Mushroom','#cdb79a',['earthy and tender','soft umami']],
  ]],
  ['Fruits', [
    ['banana','Banana','#e9c44a',['naturally sweet','soft & spoonable','a first-food favourite']],
    ['pear','Pear','#bcc758',['gentle and juicy','a soft first fruit']],
    ['apple','Apple','#d2473f',['stewed and sweet','a crisp classic']],
    ['mango','Mango','#f0a83a',['sunshine sweet','silky and golden']],
    ['avocado','Avocado','#5f7f33',['creamy good fats','buttery and soft','brain-loving']],
    ['blueberry','Blueberry','#5560a8',['tiny antioxidant gems','sweet little bursts']],
    ['strawberry','Strawberry','#d63f49',['sweet and fragrant','vitamin-C berries']],
    ['grapes','Grapes','#7d4f9e',['always halved lengthwise','juicy — quartered for babies']],
    ['date','Date','#7a4a2c',['nature’s caramel','iron-rich sweetness']],
    ['papaya','Papaya','#e88a4a',['soft and sweet','gentle on digestion']],
    ['orange','Orange','#e58a30',['juicy vitamin-C','bright little citrus']],
    ['pomegranate','Pomegranate','#c23a52',['ruby little jewels','antioxidant pops']],
    ['watermelon','Watermelon','#d6473b',['cool and hydrating','sweet summer water']],
    ['kiwi','Kiwi','#7ba33f',['tangy-sweet & green','vitamin-C rich']],
    ['coconut','Coconut','#9c7a52',['creamy island sweetness','rich and nourishing']],
  ]],
  ['Dairy & Eggs', [
    ['paneer','Paneer','#cdbf93',['soft protein cubes','calcium-rich and mild']],
    ['milk','Milk','#cdbf93',['creamy calcium','a nourishing pour']],
    ['ghee','Ghee','#e8b94f',['a golden spoon of fat','brain-loving fat']],
    ['curd','Curd','#e4ddcd',['cooling probiotics','gut-friendly and mild']],
    ['cheese','Cheese','#edc85e',['calcium, melted soft','a savoury little bite']],
    ['butter','Butter','#f0d480',['a rich little melt','soft golden fat']],
    ['egg','Egg','#efe6d0',['a protein powerhouse','soft-cooked goodness']],
  ]],
  ['Nuts & Seeds', [
    ['almond','Almond','#b9824e',['finely ground, never whole','brain-loving fats']],
    ['walnut','Walnut','#a9743f',['omega-rich, ground','earthy good fats']],
    ['cashew','Cashew','#e6d6b4',['buttery and mild','creamy when ground']],
    ['cumin','Cumin','#9c7548',['a warm, settling spice','soothes little tummies']],
  ]],
  ['Proteins', [
    ['fish','Fish','#86a6b6',['omega-rich protein','soft, deboned, flaky']],
    ['chicken','Chicken','#d59a62',['lean first protein','soft-shredded']],
    ['tofu','Tofu','#f0ece0',['silky plant protein','soft and mild']],
  ]],
  ['Fats & Sweeteners', [
    ['jaggery','Jaggery','#a5623a',['unrefined sweetness','iron-rich sweet']],
    ['honey','Honey','#e8a93a',['for one year and up','golden — but not before 1']],
  ]],
];

const total = BANK.reduce((a,[,it])=>a+it.length,0);
const lines = BANK.reduce((a,[,it])=>a+it.reduce((s,x)=>s+x[3].length,0),0);

const ing = ([id,name,c,tags]) =>
  `<div class="ing"><span class="ico" style="color:${c}"><svg class="zi"><use href="#zif-${id}"/></svg></span>
   <div class="bd"><span class="nm">${name}</span><span class="tags">${tags.map(t=>`<i>“${t}”</i>`).join('<b>·</b>')}</span></div></div>`;

const sections = BANK.map(([title,items])=>`
  <section><div class="gh"><h2>${title}</h2><span class="cnt">${items.length}</span></div>
  <div class="list">${items.map(ing).join('')}</div></section>`).join('\n');

const html = `<!DOCTYPE html>
<!-- SproutLab · per-ingredient tagline bank (generated by gen-ingredient-taglines.mjs). -->
<html lang="en" data-zoom="default"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../split/styles.css">
<style>
  html,body{background:#efe7df;margin:0;}body{font-family:'Nunito',sans-serif;padding:30px 34px;color:var(--text);}
  h1{font-family:'Fraunces',serif;font-size:27px;font-weight:600;margin:0 0 2px;}
  .lead{font-size:13px;color:var(--mid);margin:0 0 22px;max-width:720px;}
  section{margin:0 0 18px;break-inside:avoid;}
  .gh{display:flex;align-items:baseline;gap:9px;border-bottom:1.5px solid var(--card-border);padding-bottom:5px;margin-bottom:10px;}
  h2{font-family:'Fraunces',serif;font-size:16px;font-weight:600;margin:0;}.cnt{font-size:11px;font-weight:800;color:var(--light);}
  .list{display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;}
  .ing{display:flex;align-items:center;gap:11px;padding:6px 0;}
  .ico{flex:0 0 auto;width:32px;height:32px;display:inline-flex;}.ico .zi{width:32px;height:32px;}
  .bd{min-width:0;}
  .nm{display:block;font-family:'Fraunces',serif;font-weight:600;font-size:14px;color:var(--text);line-height:1.1;}
  .tags{font-size:12.5px;color:var(--mid);line-height:1.3;}
  .tags i{font-family:'Fraunces',serif;font-style:italic;}
  .tags b{color:var(--light);font-weight:700;margin:0 5px;}
  .legend{margin:14px 0 4px;font-size:12px;color:var(--light);}
</style></head><body>
${sprite}
<h1>Per-ingredient tagline bank</h1>
<p class="lead">2–3 Fraunces-italic “voice” lines per ingredient (typography direction C) — for single-food logs, and a richer source for recipe-fallback lines. Safety baked in where it matters (honey 1y+, grapes halved, nuts ground). For copy approval.</p>
${sections}
<p class="legend"><b>${total} ingredients · ${lines} taglines.</b> Rotate by day-seed like recipe taglines. Extends as the icon set grows.</p>
</body></html>`;

writeFileSync('docs/design/ingredient-taglines.html', html);
console.error(`wrote ingredient-taglines.html — ${total} ingredients, ${lines} taglines`);
