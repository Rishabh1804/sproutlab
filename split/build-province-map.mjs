// docs/PROVINCE_MAP.html generator — graphify-sproutlab pilot, Deliverable C.
//
// EXEC SUMMARY, not a navigation tool. Reads the Graphify knowledge graph
// (split/graphify-out/graph.json) and renders a high-level jurisdiction
// overview: one card per Province with symbol/LOC counts and a headroom bar to
// the 30K-rule frontier, plus cross-province coupling and the top connectivity
// hubs. For actually NAVIGATING the code, the instrument is graphify's own
// interactive graph (split/graphify-out/graph.html — click/search/filter) and
// the query surfaces (`graphify query`, the graphify-sproutlab MCP server).
// This page deliberately does NOT pretend to be navigable.
//
// SUPERSEDES the hand-maintained docs/MODULE_MAP.html: regenerated from
// committed source every build, so it cannot drift. When this page and
// CLAUDE.md disagree on LOC, THE MAP WINS; CLAUDE.md wins on policy.
//
// Honesty about extraction mode: code-only graphs carry no styles.css /
// template.html symbols; the Shared card says so plainly.
//
// Pure Node, zero deps. Invoked (non-fatal) from split/build-safe.sh after the
// HTML build. HR-1: no emoji anywhere (this source lives under split/).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '..');
const graphPath  = join(__dirname, 'graphify-out', 'graph.json');
const outPath    = join(REPO_ROOT, 'docs', 'PROVINCE_MAP.html');

if (!existsSync(graphPath)) {
  console.error(`[province-map] no graph at ${graphPath} - run \`pnpm graph\` first. Skipping (non-fatal).`);
  process.exit(0);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); // apostrophe too (Vela NIT-1): context-agnostic helper

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
  [ENG]:   { name:'Provincia Intelligentiae', latin:'the engine layer', gov:'Kael',  accent:'#9ba8d8', jurisdiction:true },
  [CARE]:  { name:'Provincia Curae',          latin:'home / diet / medical', gov:'Maren', accent:'#b5d5c5', jurisdiction:true },
  [REN]:   { name:'Provincia Superficiei',    latin:'the render layer', gov:'Vela',  accent:'#c9b8e8', jurisdiction:true },
  [SHARED]:{ name:'Territorium Commune',      latin:'styles.css + template.html', gov:'Maren + Kael + Vela', accent:'#e8b86d', jurisdiction:false },
  [WORKS]: { name:'Opera Publica',            latin:'build + audit corps', gov:'(tooling)', accent:'#fad4b4', jurisdiction:false },
};
const FRONTIER = 30000; // the 30K rule

// ── load graph ──
// Guard the parse (V-K-G1): a killed `graphify extract` in an ephemeral
// container leaves a half-written graph.json. Degrade HONESTLY — skip, non-fatal,
// leaving the last-good map in place — rather than throw a stack trace that
// build-safe.sh swallows as "non-fatal" while the map silently goes stale.
let g;
try {
  g = JSON.parse(readFileSync(graphPath, 'utf8'));
} catch (err) {
  console.error(`[province-map] graph.json unreadable/corrupt (${err.message}); skipping (non-fatal). PROVINCE_MAP.html left as-is.`);
  process.exit(0);
}
const nodes = g.nodes || [];
const links = g.links || [];
const builtAt = String(g.built_at_commit || '(unknown commit)').slice(0, 12);

// degree per node (for hubs). Count CALLS edges only — not `contains`/`defines`
// (V-K-G3 + Maren/Vela NIT: counting `contains` made the file-level node itself
// the top "hub", conflating structural containment with call-connectivity).
// Degree sums both endpoints, so it is direction-AGNOSTIC — the undirected
// edge-direction concern (V-K-G2) affects only qa-route's ripple, not this count.
const degree = new Map();
const id2file = new Map();
for (const n of nodes) { id2file.set(n.id, n.source_file || '?'); degree.set(n.id, 0); }
for (const e of links) {
  if (e.relation !== 'calls') continue;
  if (degree.has(e.source)) degree.set(e.source, degree.get(e.source) + 1);
  if (degree.has(e.target)) degree.set(e.target, degree.get(e.target) + 1);
}

const fileToProvince = (f) => MODULE_PROVINCE[f] ?? WORKS;

// ── per-module stats (live LOC from disk) ──
const liveLOC = (f) => {
  const p = join(__dirname, f);
  if (!existsSync(p)) return 0;
  const t = readFileSync(p, 'utf8');
  return (t.match(/\n/g) || []).length; // wc -l equivalent (V-M-map-1: split('\n') over-counted +1/file via trailing newline)
};
const modules = new Map(); // file -> {prov, nodes, loc, topNode, topDeg}
const seenFiles = new Set(nodes.map(n => n.source_file).filter(Boolean));
for (const f of ['styles.css', 'template.html']) seenFiles.add(f); // appear even when code-only
for (const f of seenFiles) {
  modules.set(f, { prov: fileToProvince(f), nodes: 0, loc: liveLOC(f), topNode: null, topDeg: -1 });
}
for (const n of nodes) {
  const m = modules.get(n.source_file); if (!m) continue;
  m.nodes++;
  const d = degree.get(n.id) || 0;
  if (d > m.topDeg) { m.topDeg = d; m.topNode = n.label || n.id; }
}

// ── cross-province coupling (calls edges crossing a jurisdiction border) ──
const sep = String.fromCharCode(124); // '|'
const roadKey = (a, b) => (a < b ? a + sep + b : b + sep + a);
const roads = new Map();
for (const e of links) {
  if (e.relation !== 'calls') continue;
  const fa = id2file.get(e.source), fb = id2file.get(e.target);
  if (!fa || !fb || fa === fb) continue;
  if (!modules.has(fa) || !modules.has(fb)) continue;
  if (modules.get(fa).prov === modules.get(fb).prov) continue; // cross-border only
  const k = roadKey(fa, fb);
  const r = roads.get(k) || { a: fa, b: fb, count: 0 };
  r.count++; roads.set(k, r);
}

// ── per-province rollup ──
const provStats = {};
for (const key of Object.keys(PROVINCES)) provStats[key] = { modules: [], nodes: 0, loc: 0 };
for (const [f, m] of modules) {
  const s = provStats[m.prov];
  s.modules.push(f); s.nodes += m.nodes; s.loc += m.loc;
}
const sharedSurveyed = provStats[SHARED].nodes > 0;

// ── render: province cards (exec summary) ──
const provName = { [ENG]:'Intelligence', [CARE]:'Care', [REN]:'Surfacing', [SHARED]:'Shared', [WORKS]:'Public Works' };
const cardOrder = [ENG, CARE, REN, SHARED, WORKS];
const shortMod = (f) => f.replace(/^intelligence-/, 'i-');

let cards = '';
for (const key of cardOrder) {
  const P = PROVINCES[key], s = provStats[key];
  const mods = s.modules.slice().sort((a, b) => (modules.get(b).nodes - modules.get(a).nodes) || a.localeCompare(b));
  const cityList = mods.map(shortMod).join(', ') || '(none)';
  let frontier = '';
  if (P.jurisdiction) {
    const pct = Math.min(100, Math.round((s.loc / FRONTIER) * 100));
    const head = FRONTIER - s.loc;
    const hot = head > 0 && head < 3500;
    frontier = `
      <div class="bar" title="${s.loc.toLocaleString()} of ${FRONTIER.toLocaleString()} LOC">
        <div class="fill ${hot ? 'hot' : ''}" style="width:${pct}%"></div>
        <span class="barlbl">${pct}% to 30K frontier${hot ? ' &middot; CONTESTED' : ''}</span>
      </div>
      <div class="hd">${head > 0 ? head.toLocaleString() + ' LOC headroom' : 'OVER FRONTIER &mdash; split due'}</div>`;
  } else if (key === SHARED && !sharedSurveyed) {
    frontier = `<div class="note">Unsurveyed &mdash; code-only extraction. Set a backend and rebuild for symbols.</div>`;
  }
  cards += `
    <div class="card" style="border-top:5px solid ${P.accent}">
      <div class="cname">${esc(P.name)}</div>
      <div class="clatin">${esc(P.latin)}</div>
      <div class="cgov">Governor: <b>${esc(P.gov)}</b></div>
      <div class="nums">
        <span><b>${mods.length}</b> modules</span>
        <span><b>${s.nodes.toLocaleString()}</b> symbols</span>
        <span><b>${s.loc.toLocaleString()}</b> LOC</span>
      </div>
      ${frontier}
      <div class="mods">${esc(cityList)}</div>
    </div>`;
}

// cross-province coupling table
const crossRoads = [...roads.values()].sort((a, b) => b.count - a.count);
let roadRows = crossRoads.slice(0, 12).map(r => {
  const pa = provName[modules.get(r.a).prov], pb = provName[modules.get(r.b).prov];
  return `<tr><td>${esc(shortMod(r.a))}</td><td>${esc(shortMod(r.b))}</td><td class="num">${r.count}</td><td>${esc(pa)} &harr; ${esc(pb)}</td></tr>`;
}).join('');
if (!roadRows) roadRows = '<tr><td colspan="4">No cross-province coupling detected.</td></tr>';

// connectivity hubs
const hubs = [...modules.entries()].filter(([, m]) => m.topNode && m.topDeg >= 20)
  .sort((a, b) => b[1].topDeg - a[1].topDeg).slice(0, 12)
  .map(([f, m]) => `<tr><td><code>${esc(m.topNode)}</code></td><td>${esc(shortMod(f))}</td><td>${esc(provName[m.prov])}</td><td class="num">${m.topDeg}</td></tr>`).join('');

const totalNodes = nodes.length, totalEdges = links.length;
const totalLOC = [...modules.values()].reduce((a, m) => a + m.loc, 0);
const now = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SproutLab - Jurisdiction Overview</title>
<style>
  :root{ --ink:#3a2c18; --line:#cdb88f; --parch:#f7efe0; --card:#fffaf0; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--parch);color:var(--ink);
    font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;line-height:1.5}
  header{padding:22px 28px;border-bottom:3px double #7a5b2e;background:#efe2c6}
  h1{margin:0;font-size:24px;letter-spacing:2px}
  .sub{margin-top:5px;font-size:12.5px;opacity:.82}
  .stat{display:inline-block;margin-right:18px;font-size:13px}
  .stat b{font-size:17px}
  main{padding:22px 28px;max-width:1080px}
  .banner{background:#eaf2ec;border:1px solid #b5d5c5;border-radius:8px;padding:12px 16px;font-size:13.5px;margin-bottom:22px}
  .banner b{color:#2f5d45}
  code{background:#ece0c4;padding:1px 5px;border-radius:4px;font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;box-shadow:0 1px 3px rgba(60,40,20,.08)}
  .cname{font-size:16px;font-weight:700}
  .clatin{font-size:12px;font-style:italic;opacity:.7;margin-bottom:6px}
  .cgov{font-size:12.5px;margin-bottom:8px}
  .nums{display:flex;gap:14px;font-size:12.5px;margin-bottom:10px;flex-wrap:wrap}
  .nums b{font-size:16px}
  .bar{position:relative;height:20px;background:#e7dcc4;border-radius:5px;overflow:hidden;margin-bottom:4px}
  .fill{position:absolute;inset:0 auto 0 0;background:#9bbfa6;border-radius:5px}
  .fill.hot{background:#e0a07d}
  .barlbl{position:relative;font-size:10.5px;line-height:20px;padding-left:8px;color:#3a2c18;font-weight:700}
  .hd{font-size:11.5px;opacity:.78;margin-bottom:8px}
  .note{font-size:11.5px;color:#9c6b1f;font-style:italic;margin-bottom:8px}
  .mods{font-size:11px;opacity:.7;border-top:1px dashed var(--line);padding-top:7px;word-spacing:1px}
  h2{margin:28px 0 8px;font-size:17px;border-bottom:1px solid #7a5b2e;padding-bottom:4px}
  table{border-collapse:collapse;width:100%;font-size:13px;margin-top:6px}
  th,td{border:1px solid var(--line);padding:6px 9px;text-align:left}
  th{background:#efe2c6}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  footer{padding:14px 28px;font-size:11.5px;opacity:.7;border-top:1px solid #7a5b2e}
</style></head>
<body>
<header>
  <h1>SPROUTLAB &middot; JURISDICTION OVERVIEW</h1>
  <div class="sub">graph-derived exec summary &middot; generated ${now} &middot; graph @ <code>${esc(builtAt)}</code></div>
  <div class="sub" style="margin-top:8px">
    <span class="stat"><b>${totalNodes.toLocaleString()}</b> symbols</span>
    <span class="stat"><b>${totalEdges.toLocaleString()}</b> relations</span>
    <span class="stat"><b>${totalLOC.toLocaleString()}</b> LOC</span>
    <span class="stat">extraction: <b>${sharedSurveyed ? 'thorough' : 'code-only'}</b></span>
  </div>
</header>
<main>
  <div class="banner">
    This is a high-level <b>jurisdiction overview</b>, not a navigation tool. To explore the code graph,
    open the interactive node graph at <code>split/graphify-out/graph.html</code> (click / search / filter),
    or query it: <code>graphify query "..."</code> &middot; <code>graphify path "A" "B"</code> &middot;
    <code>graphify affected "X"</code>. Routing a diff to Governors: <code>pnpm qa-route</code>.
  </div>

  <h2>Provinces</h2>
  <div class="grid">${cards}</div>

  <h2>Cross-province coupling (highest-traffic calls across jurisdiction borders)</h2>
  <table>
    <thead><tr><th>Module</th><th>Module</th><th class="num">Calls</th><th>Border</th></tr></thead>
    <tbody>${roadRows}</tbody>
  </table>

  <h2>Connectivity hubs (highest call-degree symbols per module)</h2>
  <table>
    <thead><tr><th>Symbol</th><th>Module</th><th>Province</th><th class="num">Degree (calls)</th></tr></thead>
    <tbody>${hubs}</tbody>
  </table>
</main>
<footer>
  Auto-generated by <code>split/build-province-map.mjs</code> from <code>split/graphify-out/graph.json</code> each build.
  Supersedes the hand-maintained <code>docs/MODULE_MAP.html</code> &mdash; graph-derived, cannot drift.
  Map wins on counts; CLAUDE.md wins on policy.
  ${sharedSurveyed ? '' : '<b>Code-only extraction:</b> styles.css and template.html are unsurveyed; set a backend and rebuild for the full count.'}
</footer>
</body></html>
`;

// ── write only when the SUBSTANTIVE content changed (kill regeneration churn) ──
// PROVINCE_MAP.html is the one committed graph-derived artifact, so every rewrite
// is a git diff that trips the stop-hook. Three header fields wobble on every
// rebuild with no real change behind them:
//   - builtAt   — a hash of the graph's internals, not the repo commit
//   - now       — the generated date, which flips daily
//   - totalEdges — graphify's extraction jitters the relation count +/-1 run-to-run
// Normalize those three out and compare against the committed file; if only they
// differ, leave it untouched. A genuine content change (LOC, symbols, the
// coupling table, the hub degrees) still lands in the body and forces a rewrite.
const normalize = (s) => s
  .replace(/generated \d{4}-\d{2}-\d{2}/, 'generated <DATE>')
  .replace(/graph @ <code>[^<]*<\/code>/, 'graph @ <code><HASH></code>')
  .replace(/<b>[\d,]+<\/b> relations/, '<b><RELATIONS></b> relations');

if (existsSync(outPath) && normalize(readFileSync(outPath, 'utf8')) === normalize(html)) {
  console.error(`[province-map] no substantive change (graph-hash/date/relation-jitter only); left ${outPath} untouched.`);
  process.exit(0);
}

writeFileSync(outPath, html, 'utf8');
console.error(`[province-map] wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB; ${totalNodes} symbols, ${crossRoads.length} cross-province couplings, extraction=${sharedSurveyed ? 'thorough' : 'code-only'}).`);
