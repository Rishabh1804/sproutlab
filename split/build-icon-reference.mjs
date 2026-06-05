// docs/ICON_REFERENCE.html generator — a self-contained visual gallery of every icon symbol in the
// template.html sprite, grouped by namespace (zi- general, zif- food). Auto-generated each build from
// the committed sprite, so the icon COUNT and LIST can never drift from reality again (the lesson of
// DESIGN_PRINCIPLES.md's frozen "54" while the sprite grew to 114+97). NEVER hand-edit the .html.
//
// Reads: split/template.html — every <symbol id="zi-*"> and <symbol id="zif-*">.
// Renders: the extracted sprite (hidden) + a labelled grid of <use> references, with live count,
// a filter box, and light/dark — the house style of the other docs/*.html reference views.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'split', 'template.html');
const OUT = join(ROOT, 'docs', 'ICON_REFERENCE.html');

const tpl = readFileSync(SRC, 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Extract every zi-/zif- <symbol> (full self-contained markup) in document order.
const symbols = [];
const re = /<symbol\b[^>]*\bid="(zi|zif)-([^"]+)"[\s\S]*?<\/symbol>/g;
let m;
while ((m = re.exec(tpl)) !== null) {
  symbols.push({ ns: m[1], name: m[2], markup: m[0] });
}
const zi  = symbols.filter(s => s.ns === 'zi');
const zif = symbols.filter(s => s.ns === 'zif');
const sprite = symbols.map(s => s.markup).join('');

const cell = s => `<button class="cell" data-name="${esc(s.ns)}-${esc(s.name)}">`
  + `<svg class="${s.ns}"><use href="#${esc(s.ns)}-${esc(s.name)}"/></svg>`
  + `<span class="nm">${esc(s.name)}</span></button>`;

const grid = (list, ns) => list.length
  ? `<div class="grid">${list.map(cell).join('')}</div>`
  : `<p class="empty">No ${ns} symbols found.</p>`;

const html = `<!DOCTYPE html>
<!-- GENERATED from split/template.html by split/build-icon-reference.mjs — do NOT hand-edit.
     The sprite in template.html is the source of truth; this is a styled gallery, rebuilt each build. -->
<html lang="en" data-theme="">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SproutLab — Icon Reference (${zi.length} zi · ${zif.length} zif)</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --warm:#fef6f0;--text:#3d2e2e;--mid:#6e5858;--light:#806c6c;--card:#fff;--line:#ece2dc;
    --sage:#b5d5c5;--sage-light:#e8f5ef;--tc-sage:#3a7060;--lav:#c9b8e8;--lav-light:#f0ebf9;--tc-lav:#6e5e9a;
    --amber-light:#fef6e8;--codebg:#f4ece8;--shadow:rgba(180,120,120,.13);--zif-c:#c98a5a;
  }
  [data-theme="dark"]{
    --warm:#221c28;--text:#e8e0ec;--mid:#b0a0b8;--light:#9a8aa2;--card:#2a2230;--line:#3a3040;
    --sage-light:#1e3028;--tc-sage:#7ac0a0;--lav-light:#241d33;--tc-lav:#b8a8e0;--amber-light:#352e1e;
    --codebg:#2f2636;--shadow:rgba(0,0,0,.3);--zif-c:#e0a878;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--warm);color:var(--text);font-family:'Nunito',sans-serif;line-height:1.5;padding:40px 24px 90px;}
  .wrap{max-width:1080px;margin:0 auto;}
  .eyebrow{font-weight:800;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--tc-lav);}
  h1{font-family:'Fraunces',serif;font-weight:600;font-size:2.2rem;margin:.2em 0 .1em;}
  h2{font-family:'Fraunces',serif;font-weight:600;font-size:1.4rem;margin:1.8em 0 .2em;padding-bottom:.2em;border-bottom:1px solid var(--line);}
  .gennote{margin-top:12px;font-size:.72rem;color:var(--light);background:var(--lav-light);border-radius:999px;padding:6px 14px;display:inline-block;}
  .gennote code{color:var(--tc-lav);font-weight:700;}
  .counts{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 4px;}
  .chip{background:var(--sage-light);color:var(--tc-sage);border-radius:999px;padding:5px 14px;font-size:.8rem;font-weight:700;}
  .filter{margin:18px 0 6px;width:100%;max-width:340px;font-family:'Nunito';font-size:.9rem;padding:9px 14px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px;margin:14px 0;}
  .cell{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px;background:var(--card);border:1px solid var(--line);border-radius:12px;cursor:pointer;font:inherit;color:var(--mid);transition:border-color .12s,transform .12s;}
  .cell:hover{border-color:var(--sage);transform:translateY(-1px);box-shadow:0 3px 12px var(--shadow);}
  .cell.copied{border-color:var(--tc-sage);color:var(--tc-sage);}
  .cell .nm{font-size:.7rem;text-align:center;word-break:break-word;line-height:1.25;}
  svg.zi{width:28px;height:28px;color:var(--text);}
  svg.zif{width:30px;height:30px;color:var(--zif-c);}
  .empty{color:var(--light);}
  .hint{font-size:.76rem;color:var(--light);margin-top:4px;}
  .theme-btn{position:fixed;top:16px;right:18px;z-index:10;font-family:'Nunito';font-weight:700;font-size:12px;color:var(--mid);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:7px 14px;cursor:pointer;box-shadow:0 2px 10px var(--shadow);}
</style>
</head>
<body>
<button class="theme-btn" id="themeBtn">◐ Dark</button>
<!-- the sprite, embedded so the <use> references resolve -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">${sprite}</svg>
<div class="wrap">
  <div class="eyebrow">SproutLab</div>
  <h1>Icon Reference</h1>
  <span class="gennote">Generated from <code>split/template.html</code> — the sprite is the source of truth. Rebuilt each build; don't hand-edit this HTML.</span>
  <div class="counts">
    <span class="chip">${zi.length} &nbsp;zi- &nbsp;(general)</span>
    <span class="chip">${zif.length} &nbsp;zif- &nbsp;(food)</span>
    <span class="chip">${symbols.length} total</span>
  </div>
  <input class="filter" id="filter" type="text" placeholder="Filter by name…" aria-label="Filter icons by name">
  <p class="hint">Click an icon to copy its name. <code>zi-</code> renders via <code>zi(name)</code>; <code>zif-</code> via the food-icon path in diet.js.</p>

  <h2>zi- &nbsp;general icon set &nbsp;<span style="font-size:.8rem;color:var(--light);font-weight:400;">${zi.length} icons · zi(name)</span></h2>
  ${grid(zi, 'zi')}

  <h2>zif- &nbsp;food icon set &nbsp;<span style="font-size:.8rem;color:var(--light);font-weight:400;">${zif.length} icons · &lt;svg class="zif"&gt;</span></h2>
  ${grid(zif, 'zif')}
</div>
<script>
  var btn=document.getElementById('themeBtn');
  btn.addEventListener('click',function(){var d=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',d?'':'dark');btn.textContent=d?'◐ Dark':'◐ Light';});
  var f=document.getElementById('filter');
  f.addEventListener('input',function(){var q=f.value.toLowerCase();document.querySelectorAll('.cell').forEach(function(c){c.style.display=c.getAttribute('data-name').indexOf(q)>-1?'':'none';});});
  document.querySelectorAll('.cell').forEach(function(c){c.addEventListener('click',function(){var n=c.getAttribute('data-name');navigator.clipboard&&navigator.clipboard.writeText(n);c.classList.add('copied');setTimeout(function(){c.classList.remove('copied');},700);});});
</script>
</body>
</html>`;

writeFileSync(OUT, html);
console.error('[icon-reference] wrote ' + relative(ROOT, OUT) + ' (' + (html.length / 1024).toFixed(1) + ' KB; ' + zi.length + ' zi- + ' + zif.length + ' zif- = ' + symbols.length + ' symbols)');
