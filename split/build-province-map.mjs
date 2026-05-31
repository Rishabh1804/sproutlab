// docs/PROVINCE_MAP.html generator — graphify-sproutlab pilot, Deliverable C.
//
// Reads the Graphify knowledge graph (split/graphify-out/graph.json) and emits a
// Roman provincial survey of the codebase: jurisdictions as Provinces, modules
// as cities (sized by symbol population), `calls` edges as roads (cross-province
// roads highlighted), high-degree nodes as resources, and each Province's LOC
// vs the 30K-rule frontier.
//
// SUPERSEDES the hand-maintained docs/MODULE_MAP.html: this map is regenerated
// from committed source every build, so it cannot drift. When this map and
// CLAUDE.md disagree on LOC / layout, THE MAP WINS (the established
// "maps win on counts, CLAUDE.md wins on policy" clause).
//
// Honesty about extraction mode: if the graph was built code-only (no LLM
// backend), styles.css + template.html carry no symbols. Those are rendered as
// an UNSURVEYED Territorium Commune so the map states plainly which mode ran.
//
// Pure Node, zero deps. Invoked (non-fatal) from split/build-safe.sh after the
// HTML build. Re-run reveals architectural drift via `git diff` on the output.
// HR-1: no emoji anywhere (this source lives under split/, scanned by audit-emoji.sh).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '..');
const graphPath  = join(__dirname, 'graphify-out', 'graph.json');
const outPath    = join(REPO_ROOT, 'docs', 'PROVINCE_MAP.html');

if (!existsSync(graphPath)) {
  console.error(`[province-map] no graph at ${graphPath} — run \`pnpm graph\` first. Skipping (non-fatal).`);
  process.exit(0);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── jurisdiction map (mirrors CLAUDE.md canon-cc-008 routing) ──
const CARE='care', ENG='intel', REN='render', SHARED='shared', WORKS='works';
const MODULE_PROVINCE = {
  'home.js':CARE, 'diet.js':CARE, 'medical.js':CARE,
  'intelligence-isl.js':ENG, 'intelligence-qa.js':ENG, 'intelligence-qa-handlers.js':ENG,
  'intelligence-illness.js':ENG, 'intelligence-correlate.js':ENG, 'intelligence-caretickets.js':ENG,
  'core.js':ENG, 'data.js':ENG, 'sync.js':ENG, 'config.js':ENG, 'start.js':ENG,
  'intelligence-cards.js':REN, 'intelligence-quicklog.js':REN,
  'styles.css':SHARED, 'template.html':SHARED,
};
const PROVINCES = {
  [ENG]:   { name:'Provincia Intelligentiae', gov:'Kael',  layer:'engine', box:{x:430,y:70,w:430,h:360}, fill:'#e7d2b8' },
  [CARE]:  { name:'Provincia Curae',          gov:'Maren', layer:'care',   box:{x:40,y:90,w:330,h:300},  fill:'#d9e3d2' },
  [REN]:   { name:'Provincia Superficiei',    gov:'Vela',  layer:'render', box:{x:470,y:470,w:330,h:200}, fill:'#dfd6e6' },
  [SHARED]:{ name:'Territorium Commune',      gov:'Maren + Kael + Vela', layer:'shared', box:{x:40,y:470,w:360,h:200}, fill:'#e9ddc6' },
  [WORKS]: { name:'Opera Publica',            gov:'build & audit corps', layer:'works', box:{x:890,y:90,w:170,h:560}, fill:'#cfc3b0' },
};
const FRONTIER = 30000; // the 30K rule

// ── load graph ──
const g = JSON.parse(readFileSync(graphPath, 'utf8'));
const nodes = g.nodes || [];
const links = g.links || [];
const builtAt = g.built_at_commit || '(unknown commit)';

// degree per node (for resources)
const degree = new Map();
const id2file = new Map();
for (const n of nodes) { id2file.set(n.id, n.source_file || '?'); degree.set(n.id, 0); }
for (const e of links) {
  if (degree.has(e.source)) degree.set(e.source, degree.get(e.source)+1);
  if (degree.has(e.target)) degree.set(e.target, degree.get(e.target)+1);
}

const fileToProvince = (f) => MODULE_PROVINCE[f] ?? WORKS;

// ── per-module stats ──
const liveLOC = (f) => {
  const p = join(__dirname, f);
  if (!existsSync(p)) return 0;
  const t = readFileSync(p, 'utf8');
  return t.length ? t.split('\n').length : 0;
};
const modules = new Map(); // file -> {prov, nodes, loc, topNode, topDeg}
const seenFiles = new Set(nodes.map(n => n.source_file).filter(Boolean));
// ensure shared files appear even when code-only (no symbols extracted)
for (const f of ['styles.css','template.html']) seenFiles.add(f);
for (const f of seenFiles) {
  modules.set(f, { prov:fileToProvince(f), nodes:0, loc:liveLOC(f), topNode:null, topDeg:-1 });
}
for (const n of nodes) {
  const m = modules.get(n.source_file); if (!m) continue;
  m.nodes++;
  const d = degree.get(n.id) || 0;
  if (d > m.topDeg) { m.topDeg = d; m.topNode = n.label || n.id; }
}

// ── module-pair call roads ──
const roadKey = (a,b) => a < b ? a+'|'+b : b+'|'+a;
const roads = new Map(); // key -> {a,b,count,cross}
for (const e of links) {
  if (e.relation !== 'calls') continue;
  const fa = id2file.get(e.source), fb = id2file.get(e.target);
  if (!fa || !fb || fa === fb) continue;
  if (!modules.has(fa) || !modules.has(fb)) continue;
  const k = roadKey(fa, fb);
  const cross = modules.get(fa).prov !== modules.get(fb).prov;
  const r = roads.get(k) || { a:fa, b:fb, count:0, cross };
  r.count++; roads.set(k, r);
}

// ── per-province rollup ──
const provStats = {};
for (const key of Object.keys(PROVINCES)) provStats[key] = { modules:[], nodes:0, loc:0 };
for (const [f, m] of modules) { const s = provStats[m.prov]; s.modules.push(f); s.nodes += m.nodes; s.loc += m.loc; }

const sharedSurveyed = (provStats[SHARED].nodes > 0);

// ── deterministic city layout within each province box ──
// sort modules by nodes desc (population); grid-pack into the box.
const cityPos = new Map(); // file -> {x,y,r}
for (const [key, prov] of Object.entries(PROVINCES)) {
  const mods = provStats[key].modules.slice().sort((a,b)=>(modules.get(b).nodes-modules.get(a).nodes) || a.localeCompare(b));
  const n = mods.length || 1;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n/cols);
  const { x,y,w,h } = prov.box;
  const padX = w/(cols+1), padY = (h-30)/(rows+1);
  mods.forEach((f,i)=>{
    const c = i % cols, rIdx = Math.floor(i/cols);
    const cx = x + padX*(c+1);
    const cy = y + 30 + padY*(rIdx+1);
    const pop = modules.get(f).nodes;
    const r = Math.max(7, Math.min(30, 7 + Math.sqrt(pop)*1.7));
    cityPos.set(f, { x:cx, y:cy, r });
  });
}

// ── build SVG ──
const W=1090, H=700;
let svg = '';
// roads first (under cities). draw only roads with count>=2 to reduce clutter.
const maxRoad = Math.max(1, ...[...roads.values()].map(r=>r.count));
for (const r of [...roads.values()].sort((a,b)=>a.cross-b.cross)) {
  if (r.count < 2 && !r.cross) continue;
  const pa = cityPos.get(r.a), pb = cityPos.get(r.b); if (!pa||!pb) continue;
  const wdt = Math.max(0.6, Math.min(6, (r.count/maxRoad)*6));
  const stroke = r.cross ? '#9c6b1f' : '#b9a98a';
  const dash = r.cross ? '' : 'stroke-dasharray="4 3"';
  const op = r.cross ? 0.85 : 0.45;
  svg += `<line x1="${pa.x.toFixed(1)}" y1="${pa.y.toFixed(1)}" x2="${pb.x.toFixed(1)}" y2="${pb.y.toFixed(1)}" stroke="${stroke}" stroke-width="${wdt.toFixed(1)}" stroke-opacity="${op}" ${dash}/>`;
}
// province territories
for (const [key, prov] of Object.entries(PROVINCES)) {
  const { x,y,w,h } = prov.box;
  const s = provStats[key];
  let frontierTint = prov.fill;
  let frontierLabel = '';
  if (key===CARE||key===ENG||key===REN) {
    const head = FRONTIER - s.loc;
    frontierLabel = `${s.loc.toLocaleString()} LOC · ${head>0?head.toLocaleString()+' to frontier':'OVER FRONTIER'}`;
    if (head>0 && head < 3500) frontierTint = '#e7b9a0'; // contested frontier (near 30K)
  }
  const unsurveyed = (key===SHARED && !sharedSurveyed);
  svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${frontierTint}" stroke="#7a5b2e" stroke-width="2" ${unsurveyed?'stroke-dasharray="8 5"':''}/>`;
  svg += `<text x="${x+14}" y="${y+22}" class="pname">${esc(prov.name)}</text>`;
  svg += `<text x="${x+14}" y="${y+38}" class="pgov">Governor: ${esc(prov.gov)}${frontierLabel?' · '+esc(frontierLabel):''}</text>`;
  if (unsurveyed) svg += `<text x="${x+w/2}" y="${y+h/2}" text-anchor="middle" class="unsurv">UNSURVEYED—thorough extraction pending</text>`;
}
// cities + resources
for (const [f, p] of cityPos) {
  const m = modules.get(f);
  const isResource = m.topDeg >= 30;
  svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="#fbf6ec" stroke="#7a5b2e" stroke-width="1.5"/>`;
  if (isResource) {
    // resource marker (a small star) for high-degree hub modules
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#9c6b1f"/>`;
  }
  const short = f.replace(/^intelligence-/, 'i-').replace(/\.(js|css|html|mjs|sh|md)$/, '');
  svg += `<text x="${p.x.toFixed(1)}" y="${(p.y+p.r+11).toFixed(1)}" text-anchor="middle" class="city">${esc(short)}</text>`;
  if (m.nodes>0) svg += `<text x="${p.x.toFixed(1)}" y="${(p.y+3).toFixed(1)}" text-anchor="middle" class="pop">${m.nodes}</text>`;
}

// ── province + module tables ──
const provOrder = [ENG, CARE, REN, SHARED, WORKS];
const provName = { [ENG]:'Intelligence (engine)',[CARE]:'Care',[REN]:'Surfacing (render)',[SHARED]:'Shared',[WORKS]:'Public Works' };
let provRows = '';
for (const key of provOrder) {
  const s = provStats[key], P = PROVINCES[key];
  const isJur = (key===CARE||key===ENG||key===REN);
  const head = isJur ? (FRONTIER - s.loc) : null;
  provRows += `<tr>
    <td>${esc(P.name)}</td><td>${esc(P.gov)}</td>
    <td class="num">${s.modules.length}</td>
    <td class="num">${s.nodes.toLocaleString()}</td>
    <td class="num">${s.loc.toLocaleString()}</td>
    <td class="num">${head===null?'—':(head>0?head.toLocaleString():'<b>OVER</b>')}</td>
  </tr>`;
}
const crossRoads = [...roads.values()].filter(r=>r.cross).sort((a,b)=>b.count-a.count);
let roadRows = crossRoads.slice(0,15).map(r=>{
  const pa=provName[modules.get(r.a).prov], pb=provName[modules.get(r.b).prov];
  return `<tr><td>${esc(r.a)}</td><td>${esc(r.b)}</td><td class="num">${r.count}</td><td>${esc(pa)} ↔ ${esc(pb)}</td></tr>`;
}).join('');
if (!roadRows) roadRows = '<tr><td colspan="4">No cross-province roads detected.</td></tr>';

const resources = [...modules.entries()].filter(([,m])=>m.topNode && m.topDeg>=20)
  .sort((a,b)=>b[1].topDeg-a[1].topDeg).slice(0,12)
  .map(([f,m])=>`<tr><td>${esc(m.topNode)}</td><td>${esc(f)}</td><td>${esc(provName[m.prov])}</td><td class="num">${m.topDeg}</td></tr>`).join('');

const totalNodes = nodes.length, totalEdges = links.length;
const totalLOC = [...modules.values()].reduce((a,m)=>a+m.loc,0);
const now = new Date().toISOString().slice(0,10);

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>IMPERIVM SPROVTLAB — Provincial Survey</title>
<style>
  :root{ --ink:#3a2c18; --line:#7a5b2e; --parch:#f6ecd8; --parch2:#efe2c6; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--parch);color:var(--ink);
    font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;line-height:1.5}
  header{padding:22px 28px;border-bottom:3px double var(--line);background:var(--parch2)}
  h1{margin:0;font-size:26px;letter-spacing:3px}
  .sub{margin-top:4px;font-size:13px;opacity:.8}
  main{padding:22px 28px;max-width:1140px}
  .mapwrap{border:2px solid var(--line);border-radius:10px;background:#f3e7cd;padding:8px;overflow:auto}
  svg{display:block;width:100%;height:auto;background:
    repeating-linear-gradient(45deg,#f3e7cd,#f3e7cd 18px,#f0e2c4 18px,#f0e2c4 36px)}
  text{font-family:"Iowan Old Style",Palatino,Georgia,serif}
  .pname{font-size:14px;font-weight:700;fill:#5a4220;letter-spacing:.5px}
  .pgov{font-size:10.5px;fill:#6b522c}
  .city{font-size:10px;fill:#3a2c18}
  .pop{font-size:9px;fill:#7a5b2e;font-weight:700}
  .unsurv{font-size:12px;fill:#9c6b1f;font-style:italic;letter-spacing:1px}
  h2{margin:26px 0 8px;font-size:18px;border-bottom:1px solid var(--line);padding-bottom:4px}
  table{border-collapse:collapse;width:100%;font-size:13px;margin-top:6px}
  th,td{border:1px solid #cdb88f;padding:6px 9px;text-align:left}
  th{background:var(--parch2)}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  .legend{display:flex;gap:20px;flex-wrap:wrap;font-size:12.5px;margin:10px 0 0}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .sw{width:26px;height:0;border-top:3px solid}
  .stat{display:inline-block;margin-right:18px;font-size:13px}
  .stat b{font-size:17px}
  footer{padding:14px 28px;font-size:11.5px;opacity:.7;border-top:1px solid var(--line)}
  code{background:#ece0c4;padding:1px 5px;border-radius:4px;font-size:12px}
</style></head>
<body>
<header>
  <h1>IMPERIVM SPROVTLAB</h1>
  <div class="sub">Provincial Survey of the Codebase &middot; generated ${now} &middot; graph @ <code>${esc(String(builtAt).slice(0,12))}</code></div>
  <div class="sub" style="margin-top:8px">
    <span class="stat"><b>${totalNodes.toLocaleString()}</b> symbols</span>
    <span class="stat"><b>${totalEdges.toLocaleString()}</b> relations</span>
    <span class="stat"><b>${totalLOC.toLocaleString()}</b> LOC</span>
    <span class="stat">extraction: <b>${sharedSurveyed?'thorough':'code-only'}</b></span>
  </div>
</header>
<main>
  <div class="mapwrap">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Roman provincial map of the SproutLab codebase">
      ${svg}
    </svg>
  </div>
  <div class="legend">
    <span><span class="sw" style="border-color:#9c6b1f"></span> cross-province road (calls)</span>
    <span><span class="sw" style="border-color:#b9a98a;border-top-style:dashed"></span> internal road</span>
    <span><span class="sw" style="border-color:#e7b9a0;border-top-width:10px"></span> contested frontier (&lt;3,500 LOC to 30K)</span>
    <span>city size = symbol population &middot; dot = resource hub (degree &ge; 30)</span>
  </div>

  <h2>Provinces</h2>
  <table>
    <thead><tr><th>Province</th><th>Governor</th><th class="num">Cities</th><th class="num">Symbols</th><th class="num">LOC</th><th class="num">Headroom to 30K</th></tr></thead>
    <tbody>${provRows}</tbody>
  </table>

  <h2>Cross-province roads (highest-traffic calls across jurisdictions)</h2>
  <table>
    <thead><tr><th>Module</th><th>Module</th><th class="num">Calls</th><th>Border crossed</th></tr></thead>
    <tbody>${roadRows}</tbody>
  </table>

  <h2>Resources (highest-connectivity hubs)</h2>
  <table>
    <thead><tr><th>Symbol</th><th>City (module)</th><th>Province</th><th class="num">Degree</th></tr></thead>
    <tbody>${resources}</tbody>
  </table>
</main>
<footer>
  Auto-generated by <code>split/build-province-map.mjs</code> from <code>split/graphify-out/graph.json</code> each build.
  Supersedes the hand-maintained <code>docs/MODULE_MAP.html</code> &mdash; this survey is graph-derived and cannot drift.
  When this map and CLAUDE.md disagree on counts or layout, the map wins; CLAUDE.md wins on policy, HRs, and persona.
  ${sharedSurveyed?'':'<b>Code-only extraction:</b> styles.css and template.html are unsurveyed (no LLM backend); set a backend and rebuild for the full survey.'}
</footer>
</body></html>
`;

writeFileSync(outPath, html, 'utf8');
console.error(`[province-map] wrote ${outPath} (${(html.length/1024).toFixed(1)} KB; ${totalNodes} symbols, ${crossRoads.length} cross-province roads, extraction=${sharedSurveyed?'thorough':'code-only'}).`);
