// docs/PR_TREE_DASHBOARD.html generator — the PR-history exec view.
//
// Renders the interactive PR Tree Dashboard (sunburst + collapsible tree of
// every SproutLab pull request, each carrying what-it-was / what-it-achieved /
// what-it-solved) from two committed sources:
//   - split/pr-dashboard-template.html  — the page shell (placeholder tokens)
//   - docs/pr-dashboard-data.json       — the curated per-PR record corpus
//
// The DATA FILE is the source of truth and is CURATED, not scraped: the build
// is offline, so it cannot fetch GitHub. When a PR merges, append its record
// to docs/pr-dashboard-data.json (number, title, date, merged, what, achieved,
// solved, category, kind) and rebuild — the HTML is a regenerated VIEW and can
// never drift from the data (same doctrine as PROVINCE_MAP / the /doc-render
// siblings). Hand-edits to the .html are overwritten on the next build.
//
// Pure Node, zero deps. Invoked (non-fatal) from split/build-safe.sh after the
// HTML build. HR-1: no emoji anywhere (this source lives under split/).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '..');
const tplPath    = join(__dirname, 'pr-dashboard-template.html');
const dataPath   = join(REPO_ROOT, 'docs', 'pr-dashboard-data.json');
const outPath    = join(REPO_ROOT, 'docs', 'PR_TREE_DASHBOARD.html');

for (const [p, what] of [[tplPath, 'template'], [dataPath, 'data file']]) {
  if (!existsSync(p)) {
    console.error(`[pr-dashboard] no ${what} at ${p}; skipping (non-fatal).`);
    process.exit(0);
  }
}

// Guard the parse (PROVINCE_MAP V-K-G1 doctrine): degrade honestly on a
// half-written/corrupt data file — skip non-fatally, leaving the last-good
// view in place, rather than throw a stack trace the wrapper swallows.
let data;
try {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(data) || data.length === 0) throw new Error('not a non-empty array');
} catch (err) {
  console.error(`[pr-dashboard] ${dataPath} unreadable/corrupt (${err.message}); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

// Minimal record validation — a malformed record renders as a broken card and
// a wrong sunburst count, so fail the GENERATION (still non-fatal to the build)
// loudly instead of shipping a silently-wrong view.
const REQUIRED = ['number', 'title', 'date', 'what', 'achieved', 'solved', 'category', 'kind'];
const bad = data.filter(r => REQUIRED.some(k => r[k] === undefined || r[k] === null || r[k] === '')
  || !Number.isInteger(r.number));
if (bad.length) {
  console.error(`[pr-dashboard] ${bad.length} record(s) missing required fields or non-integer number (first: #${bad[0].number ?? '?'}); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

const template = readFileSync(tplPath, 'utf8');

// Taxonomy membership (Cipher F-3): an off-taxonomy category renders a silent
// gray wedge; fail generation loudly instead. The template's CAT_COLORS map IS
// the taxonomy — extract its keys rather than maintain a second list.
const taxonomy = new Set([...template.matchAll(/^\s*"((?:Product|Platform|Governance|Records|Lore) \/ [^"]+)":/gm)].map(m => m[1]));
const offTax = data.filter(r => !taxonomy.has(r.category));
if (taxonomy.size && offTax.length) {
  console.error(`[pr-dashboard] ${offTax.length} record(s) carry a category outside the template taxonomy (first: #${offTax[0].number} "${offTax[0].category}"); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

// Duplicate guard (Cipher F-4): a double-appended record renders twice.
const seen = new Set();
const dupes = data.filter(r => seen.size === seen.add(r.number).size);
if (dupes.length) {
  console.error(`[pr-dashboard] duplicate PR number(s) in data (first: #${dupes[0].number}); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

data.sort((a, b) => a.number - b.number);
const nums  = data.map(r => r.number);
const lo    = nums[0], hi = nums[nums.length - 1];
const dates = data.map(r => r.date).sort();
const fmt   = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${MON[m - 1]} ${y}`;
};

const range    = `#${lo}–#${hi}`;
const subtitle = `SproutLab pull requests ${range} · ${data.length} PRs · ` +
  `${fmt(dates[0])} → ${fmt(dates[dates.length - 1])} · ` +
  `categorized as a tree — branch out from the trunk, or click the rings.`;
const today    = new Date().toISOString().slice(0, 10);

// Cipher Edict V amendment (PR #250): replacer-FUNCTION form so `$&`/`$'`-class
// replacement patterns in record prose can never corrupt the payload, and
// escape `<` so a literal `</script>` in a summary can never terminate the
// inline script block. The corpus is hand-appended free prose — harden, don't hope.
const html = template
  .replace('__RANGE__', () => range)
  .replace('__SUBTITLE__', () => subtitle)
  .replace('__THROUGH__', () => `#${hi}`)
  .replace('__GENERATED__', () => today)
  .replace('__PR_DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'));

// Write only when the SUBSTANTIVE content changed (kill regeneration churn —
// PROVINCE_MAP PR #232 doctrine). The generated date flips daily with nothing
// real behind it; normalize it out before comparing. A genuine change (a new
// PR record, an edited summary, a template change) still forces a rewrite.
const normalize = (s) => s.replace(/Generated \d{4}-\d{2}-\d{2}/g, 'Generated <DATE>');

if (existsSync(outPath) && normalize(readFileSync(outPath, 'utf8')) === normalize(html)) {
  console.error(`[pr-dashboard] no substantive change (date-jitter only); left ${outPath} untouched.`);
  process.exit(0);
}

writeFileSync(outPath, html, 'utf8');
console.error(`[pr-dashboard] wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB; ${data.length} PRs, ${range}).`);
