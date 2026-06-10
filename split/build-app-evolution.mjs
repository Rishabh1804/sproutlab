// docs/APP_EVOLUTION.html generator — the evolution-of-the-app view.
//
// Renders the interactive evolution illustration (PR-dot river with era bands
// and milestone flags + curated era chapters telling what the app became) from:
//   - split/app-evolution-template.html — the page shell; the ERA chapters and
//     milestone FLAGS are CURATED narrative living in the template's script —
//     when a new era of work opens, add its chapter there
//   - docs/pr-dashboard-data.json      — the same curated PR corpus the PR
//     Tree Dashboard reads (single source, two views)
//
// Sibling of split/build-pr-dashboard.mjs; same doctrine: the .html is a
// regenerated VIEW that cannot drift from committed source; appending a PR
// record to the data file flows into both views on the next build.
//
// Pure Node, zero deps. Invoked (non-fatal) from split/build-safe.sh after the
// HTML build. HR-1: no emoji anywhere (this source lives under split/).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = join(__dirname, '..');
const tplPath    = join(__dirname, 'app-evolution-template.html');
const dataPath   = join(REPO_ROOT, 'docs', 'pr-dashboard-data.json');
const outPath    = join(REPO_ROOT, 'docs', 'APP_EVOLUTION.html');

for (const [p, what] of [[tplPath, 'template'], [dataPath, 'data file']]) {
  if (!existsSync(p)) {
    console.error(`[app-evolution] no ${what} at ${p}; skipping (non-fatal).`);
    process.exit(0);
  }
}

// Guard the parse (PROVINCE_MAP V-K-G1 doctrine): degrade honestly on a
// half-written/corrupt data file — skip non-fatally, last-good view stays.
let data;
try {
  data = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(data) || data.length === 0) throw new Error('not a non-empty array');
} catch (err) {
  console.error(`[app-evolution] ${dataPath} unreadable/corrupt (${err.message}); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

const REQUIRED = ['number', 'title', 'date', 'what', 'achieved', 'solved', 'category', 'kind'];
const bad = data.filter(r => REQUIRED.some(k => r[k] === undefined || r[k] === null || r[k] === ''));
if (bad.length) {
  console.error(`[app-evolution] ${bad.length} record(s) missing required fields (first: #${bad[0].number ?? '?'}); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

// The river colors dots by top-level branch; an unknown branch renders gray.
const BRANCHES = new Set(['Product', 'Platform', 'Governance', 'Records', 'Lore']);
const offBranch = data.filter(r => !BRANCHES.has(String(r.category).split(' / ')[0]));
if (offBranch.length) {
  console.error(`[app-evolution] ${offBranch.length} record(s) carry an unknown top-level branch (first: #${offBranch[0].number} "${offBranch[0].category}"); skipping (non-fatal). View left as-is.`);
  process.exit(0);
}

// Duplicate guard (Cipher F-4 doctrine from the dashboard sibling).
const seen = new Set();
const dupes = data.filter(r => seen.size === seen.add(r.number).size);
if (dupes.length) {
  console.error(`[app-evolution] duplicate PR number(s) in data (first: #${dupes[0].number}); skipping (non-fatal). View left as-is.`);
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
  `the app's whole arc as a river of work and the chapters it carved.`;
const today    = new Date().toISOString().slice(0, 10);

// Cipher Edict V doctrine (PR #250): replacer-FUNCTION form so `$&`-class
// patterns in record prose can never corrupt the payload; escape `<` so a
// literal `</script>` in a summary can never terminate the script block.
const html = readFileSync(tplPath, 'utf8')
  .replace('__RANGE__', () => range)
  .replace('__SUBTITLE__', () => subtitle)
  .replace('__THROUGH__', () => `#${hi}`)
  .replace('__GENERATED__', () => today)
  .replace('__PR_DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c'));

// Write only on SUBSTANTIVE change (PROVINCE_MAP PR #232 churn doctrine):
// the generated date flips daily with nothing real behind it.
const normalize = (s) => s.replace(/Generated \d{4}-\d{2}-\d{2}/g, 'Generated <DATE>');

if (existsSync(outPath) && normalize(readFileSync(outPath, 'utf8')) === normalize(html)) {
  console.error(`[app-evolution] no substantive change (date-jitter only); left ${outPath} untouched.`);
  process.exit(0);
}

writeFileSync(outPath, html, 'utf8');
console.error(`[app-evolution] wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB; ${data.length} PRs, ${range}).`);
