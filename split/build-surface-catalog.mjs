// docs/SURFACE_CATALOG.html generator — the living Surface Catalog.
//
// SproutLab's visual contract. A build-time, can't-drift gallery that renders
// every canonical surface type using the REAL styles.css tokens + the REAL zi
// sprite, in light AND dark, with a zoom toggle. It is BOTH documentation and
// the design surface: to build a new surface you add its exemplar HERE first,
// review it rendered (this is exactly what will ship — same stylesheet), get
// Architect sign-off, THEN wire the feature using these exact classes/tokens.
// That closes the "post-build surprise" gap structurally — what you approve is
// what ships, because the catalog and the app read the same CSS. The page
// LINKS ../split/styles.css (served alongside it on GitHub Pages) rather than
// inlining it, so a styles.css change never produces a second copy in docs/.
//
// NEVER hand-edit docs/SURFACE_CATALOG.html — it is regenerated every build
// from this script + the live styles.css/template.html. Edit the exemplars in
// this file (the SURFACES array) instead.
//
// Cascade roadmap (built in visual-weight order): heroes → cards → chips/pills
// → inputs/steppers → composer rails/lists → toasts/overlays → interactions.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMPLATE = readFileSync(join(ROOT, 'split', 'template.html'), 'utf8');
const CORE = readFileSync(join(ROOT, 'split', 'core.js'), 'utf8');
const OUT = join(ROOT, 'docs', 'SURFACE_CATALOG.html');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Inline the live zi/zif symbols from template.html (same symbol-level
// match as build-icon-reference.mjs) so every zi() icon resolves exactly as in
// the app. An empty match would blank every icon, so it warns. ──
const symbols = TEMPLATE.match(/<symbol\b[^>]*\bid="(zi|zif)-[^"]+"[\s\S]*?<\/symbol>/g) || [];
if (!symbols.length) console.error('WARN: Surface Catalog found no zi/zif symbols in template.html — icons will be blank');
const sprites = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" hidden>${symbols.join('\n')}</svg>`;

// zi(name) → the same <svg><use> string the app emits (HR-7).
const zi = name => `<svg class="zi" aria-hidden="true"><use href="#zi-${name}"/></svg>`;

// Score → label/icon, read from core.js SCORE_LABELS itself (as
// build-poop-reference.mjs reads SAFE_POOP_COLORS) so ring states cannot drift.
const SCORE_LABELS = (() => {
  const m = CORE.match(/const SCORE_LABELS = \[([\s\S]*?)\];/);
  const rows = m ? [...m[1].matchAll(/min:\s*(\d+),\s*label:\s*'(\w+)',\s*emoji:\s*zi\('([\w-]+)'\)/g)]
    .map(r => ({ min: +r[1], label: r[2], emoji: r[3] })) : [];
  if (!rows.length) console.error('WARN: Surface Catalog could not read SCORE_LABELS from core.js — ring states may be wrong');
  return rows.sort((a, b) => b.min - a.min);
})();
function scoreLabel(s) {
  return SCORE_LABELS.find(r => s >= r.min) || { label: 'attention', emoji: 'warn' };
}
// Component bar bands — the 70/40 cut-offs renderDomainHero (diet.js) uses.
const band = s => (s >= 70 ? 'high' : s >= 40 ? 'mid' : 'low');
const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

// ── Hero exemplars (faithful to renderDomainHero / renderHeroScore markup) ──

function domainHero({ key, word, sub, weight, score, comps, stale }) {
  const lb = scoreLabel(score);
  const pills = comps.map(c => {
    const b = band(c.score);
    return `<div class="dsh-comp-pill dcp-${b}">
      <div class="dcp-bar dcb-${b}">${c.score}</div>
      <div class="dcp-text">
        <div class="dcp-name">${esc(c.name)} <span class="dcp-weight">${esc(c.weight)}</span></div>
        <div class="dcp-detail">${c.icon ? zi(c.icon) + ' ' : ''}${esc(c.detail)}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="card col-full card-hero hero-${key}"><div class="domain-score-hero dsh-${key}${stale ? ' dsh-stale' : ''}">
    <div class="dsh-top">
      <div class="dsh-ring dsh-ring-${lb.label}">
        <div class="dsh-number">${score}</div>
        <div class="dsh-label">${esc(word)}</div>
        <div class="dsh-emoji">${zi(lb.emoji)}</div>
      </div>
      <div class="dsh-info">
        <div class="dsh-domain-name">${zi(lb.emoji)} ${esc(cap(lb.label))}</div>
        <div class="dsh-domain-sublabel">${esc(sub)} · ${esc(weight)} of Ziva Score</div>
      </div>
    </div>
    <div class="dsh-components">${pills}</div>
  </div></div>`;
}

// Rendered inside its real Home shell (#homeVitalsCard → .vitals-expanded-inner,
// template.html), so the card's rainbow and stripe sit behind it as in the app.
function homeHero({ score, trend, trendDown, domains }) {
  const dpills = domains.map(d => {
    const lvl = d.score === null ? '' : ' zsd-' + scoreLabel(d.score).label;
    return `<div class="zs-domain-pill${d.stale ? ' zsd-stale' : ''}${lvl}">
      <div class="zsd-icon">${zi(d.icon)}</div>
      <div class="zsd-text"><div class="zsd-score">${d.score === null ? '—' : d.score}</div><div class="zsd-label">${esc(d.label)}</div></div>
    </div>`;
  }).join('');
  return `<div class="card col-full card-hero hero-home"><div class="vitals-expanded-inner">
    <div class="ziva-score-hero zs-score-${scoreLabel(score).label}">
      <div class="zs-ring">
        <div class="zs-number">${score}</div>
        <div class="zs-label">Ziva Score</div>
        <div class="zs-trend${trendDown ? ' trend-down' : ''}">${esc(trend)}</div>
      </div>
      <div class="zs-domains">${dpills}</div>
    </div>
  </div></div>`;
}

// Each surface: { id, title, note, exemplars: [{label, html}] }.
const SURFACES = [
  {
    id: 'hero-ziva',
    title: 'Ziva Score hero (Home)',
    note: 'The home front-door hero — composite score ring + per-domain pills, `.ziva-score-hero.zs-score-{label}`, shown inside its real Home vitals card (`.card.card-hero.hero-home` → `.vitals-expanded-inner`), whose rainbow it leans on. Stale domains carry `.zsd-stale`; an untracked domain shows "—". Domain pills reflow two per row at medium/large zoom, with the fifth taking the whole last row. Tap a pill to jump to that tab; tap the ring for the score popup.',
    exemplars: [
      { label: 'Strong week', html: homeHero({ score: 84, trend: '↑ +4 vs last week', domains: [
        { key: 'sleep', icon: 'moon', label: 'Sleep', score: 79 },
        { key: 'diet', icon: 'bowl', label: 'Diet', score: 88 },
        { key: 'poop', icon: 'diaper', label: 'Poop', score: 72 },
        { key: 'medical', icon: 'medical', label: 'Medical', score: 95 },
        { key: 'milestones', icon: 'trophy', label: 'Milestones', score: 82 },
      ] }) },
      { label: 'Needs attention — trending down, Poop carried forward (stale), Medical not yet tracked', html: homeHero({ score: 41, trend: '↓ -9 vs last week', trendDown: true, domains: [
        { key: 'sleep', icon: 'moon', label: 'Sleep', score: 38 },
        { key: 'diet', icon: 'bowl', label: 'Diet', score: 52 },
        { key: 'poop', icon: 'diaper', label: 'Poop', score: 40, stale: true },
        { key: 'medical', icon: 'medical', label: 'Medical', score: null },
        { key: 'milestones', icon: 'trophy', label: 'Milestones', score: 61 },
      ] }) },
    ],
  },
  {
    id: 'hero-domain',
    title: 'Domain Score hero (per-tab)',
    note: 'Per-tab score hero. Rendered inside its real `.card.card-hero.hero-{domain}` shell (the floor’s two-domain semantic gradient + the 5px `::before` accent stripe) wrapping `.domain-score-hero.dsh-{domain}`. The RING carries the score-band polarity (`.dsh-ring-{label}`), the card-hero gradient carries domain identity — the two never compete (§Polarity Collision). Component bars `.dcb-{high|mid|low}`. Components, weights and detail strings mirror `_spGetDomainDefs` (diet.js); details show in full and wrap (no truncation). Pills are one column at ≤400px and at medium/large zoom — the ≤400px rule follows the browser window, so narrow this page to see it.',
    exemplars: [
      { label: 'Diet · Great (88)', html: domainHero({
        key: 'diet', word: 'Diet', sub: 'Based on meals, variety, groups & nutrients', weight: '25%', score: 88,
        comps: [
          { name: 'Meals', weight: '30%', score: 100, detail: '3/3 meals logged today' },
          { name: 'Variety', weight: '30%', score: 80, detail: '12 unique foods this week (target: 15)' },
          { name: 'Groups', weight: '20%', score: 83, detail: '5/6 food groups covered' },
          { name: 'Nutrients', weight: '20%', score: 75, detail: '6/8 key nutrients this week' },
        ] }) },
      { label: 'Sleep · Fair (55)', html: domainHero({
        key: 'sleep', word: 'Sleep', sub: 'Based on duration, wake-ups, bedtime & naps', weight: '25%', score: 55,
        comps: [
          { name: 'Duration', weight: '40%', score: 84, detail: '10.5h total (target: 12h 30m, WHO)' },
          { name: 'Wake-ups', weight: '30%', score: 50, detail: '3 wake-ups' },
          { name: 'Bedtime', weight: '15%', score: 50, detail: 'Ideal: 19:00–20:00 (WHO)' },
          { name: 'Naps', weight: '15%', score: 60, detail: '1 nap (ideal: 2)' },
        ] }) },
      { label: 'Medical · Fair (58) — a dose due now, checkup may be due', html: domainHero({
        key: 'medical', word: 'Medical', sub: 'Based on vaccines, supplements, growth & checkups', weight: '15%', score: 58,
        comps: [
          { name: 'Vaccines', weight: '40%', score: 62, detail: '7/8 scheduled vaccines given · 1 due now' },
          { name: 'Supplements', weight: '25%', score: 86, detail: '6/7 days given this week' },
          { name: 'Growth', weight: '20%', score: 70, detail: 'Last measured 9d ago (wt+ht)' },
          { name: 'Checkup', weight: '15%', score: 40, detail: 'Developmental checkup may be due' },
        ] }) },
      { label: 'Poop · Needs attention (42), carried forward (stale)', html: domainHero({
        key: 'poop', word: 'Poop', sub: 'Based on consistency, frequency, color & symptoms', weight: '20%', score: 42, stale: true,
        comps: [
          { name: 'Carry-forward', weight: '', score: 42, detail: 'No poop today — using last score (2d ago, −4 decay)' },
        ] }) },
    ],
  },
];

// ── Meal planner exemplars (spec docs/specs/meal-planner-v1.md §4.7, P1a) ──
// Markup the P1b wiring must reproduce with these exact classes. Food names, pack
// lines, chew steps and keeps strings mirror recipes.js; the clock, dates and the
// rule-table lead (_mpNextSlot) are fixed so each exemplar shows one state.
const SLOT = { breakfast: ['Breakfast', 'sun'], lunch: ['Lunch', 'bowl'], dinner: ['Dinner', 'moon'], snack: ['Snack', 'spoon'] };
const rcpSafe = (level, text) => `<div class="rcp-safe rcp-safe--${level}">${zi(level === 'safe' ? 'check' : 'warn')} <span>${esc(text)}</span></div>`;

function mpDay({ date, wd, num, aria, today, sel, past, travel, fill = 'none', mark }) {
  const cls = ['mp-day', today && 'mp-day--today', sel && 'mp-day--sel', past && 'mp-day--past', travel && 'mp-day--travel'].filter(Boolean).join(' ');
  const m = mark === 'new' ? `<span class="mp-mark mp-mark--new">${zi('new')}</span>`
    : mark === 'travel' ? `<span class="mp-mark mp-mark--travel">${zi('bag')}</span>` : '<span class="mp-mark"></span>';
  return `<button class="${cls}" data-action="mpSelectDay" data-arg="${date}" aria-pressed="${sel ? 'true' : 'false'}" aria-label="${esc(aria)}">`
    + `<span class="mp-day-wd">${wd}</span><span class="mp-day-num">${num}</span><span class="mp-fill mp-fill--${fill}"></span>${m}</button>`;
}
function mpHead({ title = "This week's plan", thisWeek = false, nextDisabled = false, note = '' } = {}) {
  return `<div class="mp-head">${zi('calendar')}<span class="mp-head-title">${esc(title)}</span>`
    + `<div class="mp-weeknav">${thisWeek ? '<button class="mp-thisweek" data-action="mpThisWeek">This week</button>' : ''}`
    + `<button class="mp-navbtn mp-navbtn--prev" data-action="mpWeek" data-arg="-1" aria-label="Previous week">${zi('arrow-right')}</button>`
    + `<button class="mp-navbtn" data-action="mpWeek" data-arg="1" aria-label="Next week"${nextDisabled ? ' disabled' : ''}>${zi('arrow-right')}</button></div>`
    + (note ? `<div class="mp-navnote">${esc(note)}</div>` : '') + `</div>`;
}
// The week of Mon 2 Nov 2026; today is Wed 4 Nov.
const WEEK = [
  { date: '2026-11-02', wd: 'M', num: 2, past: true, fill: 'full', aria: 'Mon 2 Nov, all meals planned' },
  { date: '2026-11-03', wd: 'T', num: 3, past: true, fill: 'part', aria: 'Tue 3 Nov, some meals planned' },
  { date: '2026-11-04', wd: 'W', num: 4, today: true, sel: true, fill: 'full', aria: 'Wed 4 Nov, today, all meals planned' },
  { date: '2026-11-05', wd: 'T', num: 5, fill: 'full', aria: 'Thu 5 Nov, all meals planned (no snack)' },
  { date: '2026-11-06', wd: 'F', num: 6, fill: 'part', mark: 'travel', travel: true, aria: 'Fri 6 Nov, travel day, some meals planned' },
  { date: '2026-11-07', wd: 'S', num: 7, fill: 'part', mark: 'new', travel: true, aria: 'Sat 7 Nov, travel day, a new food planned, some meals planned' },
  { date: '2026-11-08', wd: 'S', num: 8, fill: 'none', aria: 'Sun 8 Nov, nothing planned' },
];
const mpStrip = (days = WEEK) => `<div class="mp-strip" role="group" aria-label="Days of the week">${days.map(mpDay).join('')}</div>`;

function mpAct(a, slot) {
  if (a === 'ate') return `<button class="mp-ate-btn" data-action="mpAte" data-arg="${slot}">${zi('check')} She ate this</button>`;
  if (a === 'add') return `<button class="mp-add-btn" data-action="mpOpenPicker" data-arg="${slot}">${zi('plus')} Add ${SLOT[slot][0].toLowerCase()}</button>`;
  if (a && a.logged) return `<span class="mp-logged">${zi('check')} ${esc(a.logged)}</span>`;
  return '';
}
function mpSlot({ slot, food, chew, newTag, lead, act = 'ate', open, body = '' }) {
  const [label, icon] = SLOT[slot];
  const cues = (chew || newTag) ? `<span class="mp-slot-cues">${chew ? `<span class="mp-chew">${zi('tooth')} Make it safe to chew: ${esc(chew)}</span>` : ''}`
    + `${newTag ? `<span class="mp-entry-new">${zi('new')} New to Ziva: ${esc(newTag)}</span>` : ''}</span>` : '';
  return `<div class="mp-slot${open ? ' mp-slot--open' : ''}">`
    + `<span class="mp-slot-ic">${zi(icon)}</span>`
    + `<button class="mp-slot-main" data-action="mpToggleSlot" data-arg="${slot}" aria-expanded="${open ? 'true' : 'false'}">`
    + `<span class="mp-slot-label">${label} <span class="mp-slot-chev">${zi('chevron-down')}</span></span>`
    + `<span class="mp-slot-food">${food ? esc(food) : '<span class="mp-slot-empty">Nothing planned</span>'}</span>${cues}</button>`
    + `<span class="mp-slot-act">${mpAct(act, slot)}</span>`
    + (lead ? rcpSafe(lead[0], lead[1]) : '') + body + `</div>`;
}
const mpLead = (slotHtml) => `<div class="mp-lead"><div class="mp-lead-eyebrow">Next</div>${slotHtml}</div>`;
function mpCard({ title, travel, pack = '', lead = '', slots = [], hint = '', tomorrow = '', foot = true }) {
  return `<div class="mp-daycard${travel ? ' mp-daycard--travel' : ''}">`
    + `<div class="mp-dayhead"><span class="mp-daytitle">${esc(title)}</span>`
    + `<button class="mp-travel-toggle" data-action="mpToggleTravel" aria-pressed="${travel ? 'true' : 'false'}">${zi('bag')} Travel day: ${travel ? 'on' : 'off'}</button></div>`
    + pack + lead + slots.join('') + (tomorrow ? `<div class="mp-tomorrow">${esc(tomorrow)}</div>` : '')
    + (hint ? `<div class="mp-hint">${zi('info')}<span>${esc(hint)}</span><button class="mp-textbtn" data-action="mpDismissHint">Dismiss</button></div>` : '')
    + (foot ? `<div class="mp-dayfoot"><button class="mp-textbtn" data-action="mpCopyDay">Copy day</button><button class="mp-textbtn" data-action="mpClearDay">Clear day</button></div>` : '')
    + `</div>`;
}
const prow = (variant, icon, title, teaser, body, open) =>
  `<div class="rcp-prow rcp-prow--${variant}${open ? ' open' : ''}"><button class="rcp-prow-head" data-action="toggleRecipeProw">`
  + `<span class="rcp-prow-ic">${zi(icon)}</span><span class="rcp-prow-txt"><span class="rcp-prow-t">${esc(title)}</span>`
  + (teaser ? `<span class="rcp-prow-d">${esc(teaser)}</span>` : '') + `</span><span class="rcp-prow-chev">${zi('arrow-right')}</span></button>`
  + `<div class="rcp-prow-body"><div class="rcp-prow-inner">${body}</div></div></div>`;
const ol = items => `<ol class="mp-pack-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
const pills = names => `<div class="mp-slot-pills">${names.map(n => `<span class="mp-pill">${esc(n)}<button class="mp-pill-x" data-action="mpRemoveEntry" aria-label="Remove ${esc(n)}">${zi('close')}</button></span>`).join('')}</div>`;

const KEEPS_FLASK = 'Packed boiling hot into a pre-heated flask filled to the top, it should still be too hot to eat straight away when you open it. If it is only warm, throw it away — warm rice and grains are where germs grow.';
const KEEPS_COOL = 'Cooked food: 2 hours at most at room temperature, 1 hour on a hot day (above 32 °C), counted from when it finished cooking. With an ice pack in an insulated bag it can last until a meal later the same day, as long as the ice pack is still frozen and the food still feels fridge-cold. If the ice pack has melted, don\'t give it.';
const keeps = `<div class="mp-keeps"><div class="mp-keeps-title">How it keeps</div>`
  + `<div class="rcp-serving">${zi('thermos')} <span><strong>Flask meals:</strong> ${esc(KEEPS_FLASK)}</span></div>`
  + `<div class="rcp-serving">${zi('timer')} <span><strong>Cool snack:</strong> ${esc(KEEPS_COOL)} <span class="rcp-serving-src">WHO · USDA FSIS</span></span></div></div>`;
const packOpen = `<div class="mp-pack"><div class="mp-pack-title">${zi('bag')} Pack for today</div>` + ol([
  '2 food flasks, one per meal: fill each with boiling water for 5 minutes, then empty it',
  'The khichdi, boiling hot, filled to the top and closed straight away',
  'A jar of ground quick oats mixed with the almond powder and cinnamon',
  'A whole banana, a cup with a lid, and a spoon',
  'Ragi–banana squares in a lidded box, with an ice pack in an insulated bag',
]) + keeps + `</div>`;
const packDone = `<div class="mp-pack">${prow('travel', 'bag', 'Packed: 5 things', 'Tap to see the list', ol(['2 food flasks…']), false)}${keeps}</div>`;

// A travel day seen on the day itself: Pack for today above the lead (CL-3).
function travelCard(state) {
  const fresh = state === 'fresh';
  const [b, l, s, d] = travelSlots(state === 'lunchOpen', fresh);
  return mpCard({ title: 'Friday, 6 Nov', travel: true, pack: state === 'logged' || state === 'lunchOpen' ? packDone : packOpen,
    lead: mpLead(fresh ? b : l), slots: fresh ? [l, s, d] : [b, s, d] });
}
const travelSlots = (lunchOpen, fresh) => [
  mpSlot({ slot: 'breakfast', food: 'Oats & Banana from a Flask', chew: '2 steps', act: fresh ? 'ate' : { logged: 'Logged · 8:10 am' } }),
  mpSlot({ slot: 'lunch', food: 'Veg Dalia Khichdi in a Flask + steamed carrot', chew: '2 steps', open: lunchOpen,
    body: lunchOpen ? pills(['Veg Dalia Khichdi in a Flask', 'Steamed carrot']) + `<div class="rcp-prows">`
      + prow('chew', 'tooth', 'Make it safe to chew', '2 steps', ol(['Cook until everything mashes between finger and thumb', 'Pack it slightly runny — it thickens in the flask']), true)
      + prow('dos', 'chat', 'Combo guidance', 'Grain + vegetable: a good pair', '<p class="mp-gap-note">Dalia and carrot together give her grain and a vegetable in one bowl.</p>', false)
      + prow('travel', 'timer', 'Packing', '3 things', ol(['A food flask: fill it with boiling water for 5 minutes, then empty it', 'The khichdi, boiling hot, filled to the top and closed straight away', 'A bowl to cool her portion in, and a spoon']), true)
      + `</div>` : '' }),
  mpSlot({ slot: 'snack', food: 'Steamed Ragi–Banana Squares', chew: '2 steps' }),
  mpSlot({ slot: 'dinner', act: 'add', body: `<div class="mp-gap-note">No travel dinners in the recipes yet. The travel lunches work for dinner too: Veg Dalia Khichdi in a Flask, Soft Palak Thepla for the Road, Soft Aloo–Carrot Paratha Rolls.</div>` }),
];

// Picker sheet (a .ql-sheet in the app; shown here without the sheet chrome).
function pickRow({ icon = 'bowl', title, why, locked, lock, more, action = 'mpPick' }) {
  const cls = 'mp-picker-row' + (locked ? ' mp-picker-row--locked' : '') + (more ? ' mp-picker-more' : '');
  return `<button class="${cls}" data-action="${action}"${locked ? ' aria-disabled="true"' : ''}>${zi(icon)}<span class="mp-picker-row-main">${esc(title)}`
    + (why ? `<span class="mp-picker-why">${esc(why)}</span>` : '') + (lock ? `<span class="mp-picker-lock">${esc(lock)}</span>` : '')
    + `</span>${more ? zi('chevron-down') : ''}</button>`;
}
// Snack is the slot with a real age-locked recipe for her (Banana & Honey Toast, 24 m+).
const picker = ({ search = '', noMatch = false } = {}) => `<div class="mp-picker"><div class="mp-picker-title">Snack · Thursday, 5 Nov</div>`
  + `<input class="mp-search" type="search" placeholder="Search recipes and foods" aria-label="Search recipes and foods" value="${esc(search)}">`
  + (noMatch
    ? `<div class="mp-empty">No recipe or food called “${esc(search)}”.</div>` + pickRow({ icon: 'plus', title: `Add “${search}” as a food`, action: 'mpPickFree' })
    : `<div class="mp-picker-sec">Suggested for Thursday</div>`
      + pickRow({ icon: 'spoon', title: 'Steamed Veg Sticks with Chana–Til Dip', why: 'Adds iron: Thursday has none yet' })
      + pickRow({ icon: 'spoon', title: 'Ragi–Banana Mini Pancakes', why: 'Adds iron' })
      + pickRow({ icon: 'spoon', title: 'Soft Fruit Bowl', why: 'Not had this week' })
      + pickRow({ icon: 'spoon', title: 'Curd with Papaya & Almond Dust', why: 'A favourite lately' })
      + pickRow({ icon: 'spoon', title: 'Sweet Potato Jeera Bites', why: 'Not had this week' })
      + pickRow({ icon: 'spoon', title: 'All snack recipes', more: true, action: 'mpPickAll' })
      + `<div class="mp-picker-sec">All snack recipes</div>`
      + pickRow({ icon: 'spoon', title: 'Plain Jeera Chaas' })
      + pickRow({ icon: 'spoon', title: 'Banana & Honey Toast (2 y+)', locked: true, lock: 'From 24 months · opens 4 Sep 2027' })
      + pickRow({ icon: 'new', title: 'Plan a new food', why: 'Foods she has not had yet', action: 'mpPickNew' }))
  + `</div>`;

const confirm = (title, body, primary, secondary, extra = '') => `<div class="mp-confirm" role="dialog" aria-label="${esc(title)}">`
  + `<div class="mp-confirm-title">${esc(title)}</div><p class="mp-confirm-body">${body}</p>${extra}`
  + `<div class="mp-confirm-actions"><button class="btn btn-sage" data-action="mpConfirmMove">${esc(primary)}</button>`
  + `<button class="mp-textbtn" data-action="mpConfirmAnyway">${esc(secondary)}</button></div></div>`;

const section = inner => `<div class="mp-section">${inner}</div>`;
const todayCard = (clock) => {
  const b = { slot: 'breakfast', food: 'Ragi–Oats Milk Porridge with Pear', chew: '2 steps', lead: ['safe', 'Fine for her age. Pear: cook soft or grate.'] };
  const l = { slot: 'lunch', food: 'Toddler Veg Khichdi', chew: '2 steps' };
  const d = { slot: 'dinner', food: 'Paneer–Tomato Bhurji with Roti + grapes', lead: ['caution', 'Grapes: quarter lengthways — never whole, and halving is not enough.'] };
  const s = { slot: 'snack', food: 'Soft Fruit Bowl' };
  if (clock === '02:00') return mpCard({ title: 'Wednesday, 4 Nov', lead: mpLead(mpSlot(b)), slots: [mpSlot(l), mpSlot(d), mpSlot(s)] });
  if (clock === '12:00') return mpCard({ title: 'Wednesday, 4 Nov', lead: mpLead(mpSlot(l)),
    slots: [mpSlot({ ...b, lead: null, act: { logged: 'Logged · 8:20 am' } }), mpSlot(d), mpSlot(s)] });
  return mpCard({ title: 'Wednesday, 4 Nov', tomorrow: 'Tomorrow: Breakfast — Soft Ragi Dosa Strips with Curd',
    slots: [mpSlot({ ...b, lead: null, act: { logged: 'Logged · 8:20 am' } }), mpSlot({ ...l, act: { logged: 'Logged · 12:40 pm' } }),
      mpSlot({ ...d, act: { logged: 'Logged · 7:15 pm' } }), mpSlot({ ...s, act: { logged: 'Logged · 4:00 pm' } })] });
};

const PLANNER = [
  {
    id: 'mp-strip', title: 'Planner 1 · Week strip',
    note: 'Seven `.mp-day` chips in a `minmax(0,1fr)` grid: never scrolls, chips ≥ 40 × 56 (CL-7, CL-8). One neutral fill disc per day (`.mp-fill--full|part|none`), never sage, muted on past days (CL-9). Today = bold sage numeral + bar; selected = sage-light fill + border (each survives greyscale alone). One marker: new food (`zi-new`, lavender) wins; a travel day then rides the peach chip border (Sat). Fri shows the travel marker alone. Thu has three meals and no snack, so it reads full. Rendered at 360 px and 320 px; use the toolbar for zoom and greyscale.',
    exemplars: [
      { label: '360 px — this week', width: 360, html: section(mpHead() + mpStrip()) },
      { label: '320 px — this week', width: 320, html: section(mpHead() + mpStrip()) },
    ],
  },
  {
    id: 'mp-today', title: 'Planner 2 · Today’s card at three clocks',
    note: 'The next meal leads by the `_mpNextSlot` rule table (V-V-275-2): before the breakfast window → Breakfast; mid-day → Lunch; after dinner → no lead, one quiet "Tomorrow:" line, never a "done" phrase. The lead is the slot row promoted, never repeated below (CL-3, CL-4). Collapsed slots are one row of content: food in words, the safety lead and chew cue when present, one action. Breakfast carries a `safe` lead with a chew cue; dinner carries a free-food form lead (grapes) in the amber channel.',
    exemplars: [
      { label: '02:00 — Next: Breakfast', width: 360, html: todayCard('02:00') },
      { label: '12:00 — Next: Lunch', width: 360, html: todayCard('12:00') },
      { label: '23:30 — no lead; Tomorrow line', width: 360, html: todayCard('23:30') },
    ],
  },
  {
    id: 'mp-safety', title: 'Planner 2b–2c · Safety stacking and the day hint',
    note: '2b: a promoted combo caution and a new top allergen ride the amber safety channel in words, not lavender (V-V-275-12, -14); the new-to-Ziva tag stays a tag. Peanut is established and clean, so it carries no repeated watch line (V-C-275-10). 2c: three slots planned, none iron-rich → one worded, dismissable hint (V-C-275-16). No score.',
    exemplars: [
      { label: '2b — combo caution + new allergen; established allergen quiet', width: 360, html: mpCard({ title: 'Thursday, 5 Nov', slots: [
        mpSlot({ slot: 'breakfast', food: 'Soft Egg Bhurji with Roti + kiwi', newTag: 'egg', chew: '1 step',
          lead: ['caution', 'Egg is a common allergen and new for her, and kiwi is new too. Give egg on its own day so you can tell what caused a reaction.'] }),
        mpSlot({ slot: 'lunch', food: 'Veg Poha with Ground Peanut', chew: '1 step' }),
        mpSlot({ slot: 'dinner', act: 'add' }), mpSlot({ slot: 'snack', act: 'add' }),
      ] }) },
      { label: '2c — no iron-rich food planned', width: 360, html: mpCard({ title: 'Thursday, 5 Nov',
        slots: [mpSlot({ slot: 'breakfast', food: 'Oats & Apple Porridge' }), mpSlot({ slot: 'lunch', food: 'Veg Curd Rice (Thayir Sadam)' }),
          mpSlot({ slot: 'dinner', food: 'Sambar Rice with Pumpkin & Carrot' }), mpSlot({ slot: 'snack', act: 'add' })],
        hint: 'No iron-rich food planned today. Ragi, dal, egg or greens would add some.' }) },
    ],
  },
  {
    id: 'mp-travel', title: 'Planner 3 · Travel day',
    note: 'Peach stripe, header wash and pack border; the travel state is in words on the toggle ("Travel day: on", V-V-275-13). Pack for today sits under the header, above everything else (CL-3): flasks de-duplicated to a count (V-C-275-7). How it keeps stays visible (V-C-275-8). Dinner has no travel recipe, so the gap copy leads with "The travel lunches work for dinner too" (V-C-275-17). 3b opens lunch: pills, Make it safe to chew open, Combo collapsed, Packing open. 3c: after the first log the list collapses to a count; How it keeps stays.',
    exemplars: [
      { label: '3 — Friday travel day, seen that morning, nothing logged', width: 360, html: travelCard('fresh') },
      { label: '3c — after the first log (breakfast); Next: Lunch', width: 360, html: travelCard('logged') },
      { label: '3b — the same card, lunch opened', width: 360, html: travelCard('lunchOpen') },
    ],
  },
  {
    id: 'mp-past', title: 'Planner 4 · Past day',
    note: 'A logged slot stamps the slot-window centre on a past date, never the tap time (CL-10, V-V-275-3): "Logged · around 1 pm". No lead on non-today cards.',
    exemplars: [
      { label: 'Tue 3 Nov', width: 360, html: mpCard({ title: 'Tuesday, 3 Nov', slots: [
        mpSlot({ slot: 'breakfast', food: 'Suji & Veg Upma', act: { logged: 'Logged · around 8 am' } }),
        mpSlot({ slot: 'lunch', food: 'Dal–Chawal with Lauki Sabzi', act: { logged: 'Logged · around 1 pm' } }),
        mpSlot({ slot: 'dinner', food: 'Mild Egg Curry with Rice' }), mpSlot({ slot: 'snack', act: 'add' }),
      ] }) },
    ],
  },
  {
    id: 'mp-picker', title: 'Planner 5 · Slot picker',
    note: 'Search, then five pickable suggestions before any scroll, each with its reason in words (CL-5). Locked rows never take a top-5 place; in the All list they show the reason inline and cannot be added (V-V-275-15). Then "Plan a new food". No match → "Add “xyz” as a food" (V-V-275-18). Check at large zoom with the toolbar.',
    exemplars: [
      { label: 'Suggestions + All list expanded', width: 360, html: picker() },
      { label: 'No match', width: 360, html: picker({ search: 'jowar', noMatch: true }) },
    ],
  },
  {
    id: 'mp-confirm', title: 'Planner 6–6b · Confirms',
    note: '6: a second new food within 3 days of another. 6b: the top-allergen confirm, V-C-275-3 copy. Primary is the safe move (Move to Sat); Plan anyway is secondary text. Sentences are to be source-verified at P1a sign-off (canon-cc-013); any without a source is dropped.',
    exemplars: [
      { label: '6 — new-food conflict', width: 360, html: confirm('Kiwi is new, and so is papaya on Thursday.',
        'Space new foods 3 days apart, so if she reacts you’ll know which one it was. Sunday is clear.', 'Move to Sun', 'Plan anyway') },
      { label: '6b — top allergen', width: 360, html: confirm('Egg is a common allergen, and new for Ziva.',
        'Give egg on its own, with nothing else new for 3 days before or after, so if she reacts you’ll know it was the egg. Best at home and early in the day, when you can watch her for a few hours.',
        'Move to Sat', 'Plan anyway', `<p class="mp-confirm-body"><button class="mp-textbtn" data-action="mpWatchFor">What to watch for after egg</button> <span class="rcp-serving-src">NHS</span></p>`) },
    ],
  },
  {
    id: 'mp-empty', title: 'Planner 7 · Empty states',
    note: 'First use is one invitation line plus the one-time fill legend, never an empty grid. A pruned week says why. The › button clamps at 8 weeks ahead with a one-line reason (V-V-275-17). Fewer than five suggestions reuses the existing "Keep logging meals…" line.',
    exemplars: [
      { label: 'First use', width: 360, html: section(mpHead() + `<div class="mp-legend"><span><span class="mp-fill mp-fill--full"></span> All meals planned</span><span><span class="mp-fill mp-fill--part"></span> Some</span><span><span class="mp-fill mp-fill--none"></span> None</span></div>`
        + mpStrip(WEEK.map(d => ({ ...d, fill: 'none', mark: null, travel: false }))) + `<p class="mp-empty">Plan Ziva’s meals for the week: tap a day to start.</p>`) },
      { label: 'Empty day (not first use)', width: 360, html: mpCard({ title: 'Sunday, 8 Nov', foot: false, slots: ['breakfast', 'lunch', 'dinner', 'snack'].map(s => mpSlot({ slot: s, act: 'add' })) }) },
      { label: 'Pruned week, and the horizon clamp', width: 360, html: section(mpHead({ title: 'Week of 5 Oct', thisWeek: true }) + `<p class="mp-empty">Plans older than 4 weeks are cleared.</p>`)
        + section(mpHead({ title: 'Week of 28 Dec', thisWeek: true, nextDisabled: true, note: 'You can plan up to 8 weeks ahead.' })) },
      { label: 'Fewer than five suggestions', width: 360, html: `<div class="mp-picker"><div class="mp-picker-title">Snack · Thursday, 5 Nov</div>`
        + pickRow({ icon: 'spoon', title: 'Soft Fruit Bowl', why: 'Fits her age' }) + pickRow({ icon: 'spoon', title: 'Curd & Banana Bowl', why: 'Fits her age' })
        + `<div class="mp-empty">Keep logging meals and suggestions will get more personal.</div>` + pickRow({ icon: 'spoon', title: 'All snack recipes', more: true, action: 'mpPickAll' }) + `</div>` },
    ],
  },
  {
    id: 'mp-nextweek', title: 'Planner 8 · Header on another week',
    note: '"This week’s plan" only on the current week; otherwise "Week of 9 Nov" plus a This week button (V-V-275-17).',
    exemplars: [
      { label: 'Next week', width: 360, html: section(mpHead({ title: 'Week of 9 Nov', thisWeek: true }) + mpStrip(WEEK.map((d, i) => ({ ...d, date: '', num: 9 + i, today: false, sel: i === 0, past: false, fill: i < 2 ? 'part' : 'none', mark: null, travel: false, aria: '' })))) },
    ],
  },
  {
    id: 'mp-stack', title: 'Planner 9 · Section stack (CL-11)',
    note: 'At 360 × 740, default zoom, a non-travel today card with slots collapsed: the Plan section stays within one viewport and the top of "Suggested for Ziva" is in reach without hunting. Measured in the screenshot pass.',
    exemplars: [
      { label: 'Recipes tab top, 360 px', width: 360, html: section(mpHead() + mpStrip() + todayCard('12:00')) + `<div class="recipes-sec-label">Suggested for Ziva</div><p class="recipes-sub-note">Picked for her age, what she has had lately, and what this week is missing.</p>` },
    ],
  },
];

// ── Page assembly ──
// An exemplar with `width` renders inside a phone-width frame (360 / 320 px).
const frame = ex => ex.width ? `<div class="sc-phone sc-phone--${ex.width}">${ex.html}</div>` : ex.html;

function specimen(s) {
  const panels = s.exemplars.map(ex => `
    <div class="sc-specimen">
      <div class="sc-specimen-label">${esc(ex.label)}</div>
      <div class="sc-render-row">
        <div class="sc-panel"><span class="sc-mode">Light</span><div class="sc-stage">${frame(ex)}</div></div>
        <div class="sc-panel" data-theme="dark"><span class="sc-mode">Dark</span><div class="sc-stage">${frame(ex)}</div></div>
      </div>
      <details class="sc-markup"><summary>Canonical markup</summary><pre><code>${esc(ex.html.trim())}</code></pre></details>
    </div>`).join('');
  return `<section class="sc-surface" id="${s.id}">
    <h3>${esc(s.title)}</h3>
    <p class="sc-surface-note">${s.note.replace(/`([^`]+)`/g, (m, c) => '<code>' + esc(c) + '</code>')}</p>
    ${panels}
  </section>`;
}

const ROADMAP = [
  ['Heroes', 'live', 'Ziva Score + per-tab domain heroes'],
  ['Meal planner', 'review', 'P1a mock-ups (spec meal-planner-v1 §4.7): week strip, day card, travel day, picker, confirms, empty states — awaiting sign-off'],
  ['Cards', 'next', 'action / info / stat cards'],
  ['Chips & pills', 'planned', 'domain chips, food chips, status pills'],
  ['Inputs & steppers', 'planned', 'text/date/time inputs, qty steppers, intake pills'],
  ['Composer rails & lists', 'planned', 'L1–L4 rails, 48px item rows — where the white-bg + Diet-tab prediction-visibility regressions get settled'],
  ['Toasts & overlays', 'planned', 'undo toast, post-save flash, bottom sheets, score popup'],
  ['Interactions', 'planned', 'save-on-action, burst + undo choreography, blur-dismiss'],
];

const heroSection = SURFACES.map(specimen).join('\n');
const plannerSection = PLANNER.map(specimen).join('\n');
const roadmapRows = ROADMAP.map(([name, state, desc]) =>
  `<tr class="sc-rm-${state}"><td>${esc(name)}</td><td><span class="sc-badge sc-badge-${state}">${state}</span></td><td>${esc(desc)}</td></tr>`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SproutLab — Surface Catalog</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- the LIVE app stylesheet, linked (edit split/styles.css, never this page) -->
<link rel="stylesheet" href="../split/styles.css">
<style>
/* ── catalog chrome (sc-* only; never collides with app classes) ── */
body { padding:0; margin:0; }
.sc-wrap { max-width:1100px; margin:0 auto; padding:var(--sp-24, 24px) var(--sp-16, 16px) 80px; }
.sc-banner { background:var(--amber-light, #f7ecd6); border:1.5px solid var(--amber, #e8b86d); border-radius:14px; padding:14px 18px; margin-bottom:24px; font-size:14px; line-height:1.5; color:var(--text, #3a2e2e); }
.sc-h1 { font-family:'Fraunces',serif; font-size:30px; font-weight:700; color:var(--text, #3a2e2e); margin:8px 0 4px; }
.sc-sub { color:var(--mid, #8a7a72); font-size:15px; margin:0 0 8px; }
.sc-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:18px 0 8px; }
.sc-toolbar .sc-zlabel { font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--mid,#8a7a72); font-weight:700; }
.sc-zbtn { font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; padding:6px 12px; border-radius:999px; border:1.5px solid var(--border-subtle,#e8ddd5); background:var(--surface,#fff); color:var(--mid,#8a7a72); cursor:pointer; }
.sc-zbtn.active { background:var(--tc-rose,#c2607a); color:#fff; border-color:var(--tc-rose,#c2607a); }
.sc-rm { width:100%; border-collapse:collapse; margin:8px 0 28px; font-size:14px; }
.sc-rm td { padding:8px 10px; border-bottom:1px solid var(--border-subtle,#eee); }
.sc-badge { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:2px 9px; border-radius:999px; }
.sc-badge-live { background:var(--sage,#b5d5c5); color:#1a4a32; }
.sc-badge-next { background:var(--amber,#e8b86d); color:#5a3e10; }
.sc-badge-review { background:var(--lavender,#c9b8e8); color:#3e2a66; }
.sc-phone { max-width:360px; }
.sc-phone--320 { max-width:320px; }
.sc-grey .sc-stage { filter:grayscale(1); }
.sc-badge-planned { background:var(--border-subtle,#eee); color:var(--mid,#8a7a72); }
.sc-rm-live td:first-child { font-weight:800; }
.sc-h2 { font-family:'Fraunces',serif; font-size:24px; color:var(--text,#3a2e2e); margin:10px 0 0; }
.sc-surface { margin:0 0 40px; }
.sc-surface > h3 { font-family:'Fraunces',serif; font-size:21px; font-weight:600; color:var(--text,#3a2e2e); margin:30px 0 4px; padding-top:14px; border-top:2px solid var(--border-subtle,#eee); }
.sc-surface-note { color:var(--mid,#8a7a72); font-size:14px; line-height:1.5; margin:0 0 14px; }
.sc-surface-note code, .sc-markup code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.86em; background:var(--warm,#f3ece6); padding:1px 5px; border-radius:5px; }
.sc-specimen { margin:0 0 22px; }
.sc-specimen-label { font-size:13px; font-weight:700; color:var(--mid,#8a7a72); margin:0 0 8px; }
.sc-render-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:720px){ .sc-render-row { grid-template-columns:1fr; } }
.sc-panel { position:relative; border-radius:16px; padding:30px 18px 18px; background:var(--cream,#fffaf7); border:1px solid var(--border-subtle,#e8ddd5); overflow:visible; }
.sc-panel[data-theme="dark"] { background:var(--cream); border-color:#3a2e3e; }
.sc-mode { position:absolute; top:8px; left:12px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; color:var(--light,#b0a098); }
.sc-stage { /* the live surface renders here, on its real token background */ }
.sc-markup { margin-top:10px; }
.sc-markup summary { font-size:12px; font-weight:700; color:var(--mid,#8a7a72); cursor:pointer; }
.sc-markup pre { background:var(--warm,#f6f0ea); border:1px solid var(--border-subtle,#e8ddd5); border-radius:10px; padding:12px; overflow:auto; font-size:11.5px; line-height:1.45; margin:8px 0 0; }
[data-theme="dark"] .sc-markup pre { background:#221c28; border-color:#3a2e3e; }
</style>
</head>
<body>
${sprites}
<div class="sc-wrap">
  <div class="sc-banner"><strong>Generated view — do not hand-edit.</strong> Rebuilt every build by <code>split/build-surface-catalog.mjs</code> from the live <code>split/styles.css</code> + sprite. This is the <strong>design surface</strong>: to build a new surface, add its exemplar to the <code>SURFACES</code> array in the generator first, review it here rendered (this is what ships — same stylesheet), get sign-off, then wire the feature with these exact classes. Edit exemplars in the generator, never this file.</div>

  <div class="sc-h1">Surface Catalog</div>
  <p class="sc-sub">Every canonical SproutLab surface, rendered with the live tokens in light + dark. The visual contract that prevents post-build surprises.</p>

  <div class="sc-toolbar">
    <span class="sc-zlabel">Zoom</span>
    <button class="sc-zbtn active" data-zoom="">Default</button>
    <button class="sc-zbtn" data-zoom="med">Medium</button>
    <button class="sc-zbtn" data-zoom="high">Large</button>
    <span class="sc-zlabel">Colour</span>
    <button class="sc-gbtn sc-zbtn" aria-pressed="false">Greyscale</button>
  </div>

  <table class="sc-rm"><tbody>${roadmapRows}</tbody></table>

  <h2 class="sc-h2">Heroes</h2>
  ${heroSection}

  <h2 class="sc-h2">Meal planner (P1a — awaiting sign-off)</h2>
  ${plannerSection}
</div>
<script>
  var g = document.querySelector('.sc-gbtn');
  g.addEventListener('click', function(){
    var on = document.body.classList.toggle('sc-grey');
    g.classList.toggle('active', on); g.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('.sc-zbtn[data-zoom]').forEach(function(b){
    b.addEventListener('click', function(){
      // Mirrors setZoomLevel (core.js): Default removes the attribute.
      if (b.dataset.zoom) document.documentElement.dataset.zoom = b.dataset.zoom;
      else document.documentElement.removeAttribute('data-zoom');
      document.querySelectorAll('.sc-zbtn[data-zoom]').forEach(function(x){ x.classList.toggle('active', x===b); });
    });
  });
</script>
</body>
</html>`;

writeFileSync(OUT, html);
console.error('Surface Catalog generated: docs/SURFACE_CATALOG.html (' + (html.length / 1024).toFixed(0) + 'KB; heroes + meal planner)');
