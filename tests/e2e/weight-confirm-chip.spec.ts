import { test, expect, type Page } from '@playwright/test';
declare let growthData: any; declare let growthConfirm: any; declare let _feverEpisodes: any; declare let _feParaForm: any; declare let _feParaFormEp: any;
declare const KEYS: any; declare let profile: any;

// #161 PR 4a — the weight confirm (spec §4.3 / §4.4, decisions A and B). The weight-jump check
// (gvWeightJumpCheck) gates the paracetamol dose: a weight that jumped, dropped, can't be compared, or
// shares its date with a different weight gives no dose until the parent RETYPES it. The confirm lives in
// its own synced map (KEYS.growthConfirm), never on the growth row.
// QA chain canon-cc-008: Kael (intelligence-illness.js), Carina (core.js, sync.js, the new key), Maren
// (medical.js, dosing consequence), Ceres (diet.js), Vela + core trio (styles.css).

async function boot(page: Page) {
  // The first-open welcome guide switches to Home after 500 ms, hiding the card mid-test (Carina V-CA-290-1).
  await page.addInitScript(() => { try { localStorage.setItem('ziva_guide_seen', '1'); } catch (e) {} });
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).gvWeightNeedsConfirm === 'function' && typeof (window as any).renderFeverEpisodeCard === 'function', null, { timeout: 15_000 });
}
// A girl, ~14 months; growth rows as [daysAgo, kg]; an active fever; the drops bottle picked.
// opts.confirm: { daysAgo: [kg, kinds?] } in the stored shape { date: { grams: kinds } }.
async function seed(page: Page, rows: [number, number][], opts: { confirm?: Record<string, [number, string[]?]>; sex?: string | null; ageDays?: number } = {}) {
  await boot(page);
  return page.evaluate(({ rows, opts }) => {
    const w: any = window;
    const dob = new Date(); dob.setHours(12, 0, 0, 0); dob.setDate(dob.getDate() - (opts.ageDays || 425));
    w._profSave(Object.assign({}, profile.child, { dob: w.toDateStr(dob), sex: opts.sex === undefined ? 'f' : opts.sex }), profile.place);
    const iso = (ago: number) => { const d = new Date(); d.setDate(d.getDate() - ago); return w.toDateStr(d); };
    growthData = rows.map(([ago, wt]) => ({ date: iso(ago), wt }));
    growthConfirm = {};
    Object.keys(opts.confirm || {}).forEach(k => { const [kg, kinds] = (opts.confirm as any)[k]; growthConfirm[iso(+k)] = { [String(Math.round(kg * 1000))]: kinds || ['amber'] }; });
    _feverEpisodes = [{ id: 'fe-w', status: 'active', startedAt: new Date(Date.now() - 5 * 3600000).toISOString(), resolvedAt: null,
      readings: [{ id: 'r1', temp: 101.2, time: new Date().toISOString(), notes: '' }], doses: [], actions: [], peakTemp: 101.2, triggerSource: 't', notes: '', resolvedNotes: '' }];
    _feParaForm = 'drops100'; _feParaFormEp = 'fe-w';
    w.switchTab('medical');
    w.renderFeverEpisodeCard();
    return iso(rows[rows.length - 1][0]);
  }, { rows, opts });
}
const card = (page: Page) => page.locator('#feverEpisodeCard');

test('a believable gain doses straight away; no confirm block', async ({ page }) => {
  await seed(page, [[40, 9.2], [3, 9.5]]);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await expect(card(page).locator('.fe-para-dose')).toContainText('1.0–1.4 ml');
});

test('a typo jump (9.5 → 15.9 kg) gives no dose and leads with both weights, the change and the escape line', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  const block = card(page).locator('.fe-para-confirm');
  await expect(block).toHaveCount(1);
  await expect(block).not.toHaveClass(/fe-para-confirm--calm/);
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(0);
  await expect(block).toContainText('15.9 kg');
  await expect(block).toContainText('9.5 kg');
  await expect(block).toContainText('6.4 kg more in 5 weeks');
  await expect(block).toContainText('more than children usually gain');
  await expect(block).toContainText('If she needs medicine now, ask your doctor or chemist for the dose.');
  // The confirm block comes before the bottle question.
  const html = await card(page).innerHTML();
  expect(html.indexOf('fe-para-confirm')).toBeLessThan(html.indexOf('Which paracetamol bottle'));
});

test('retyping the wrong number says so; the right one (comma decimal) confirms without touching Growth', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]]);
  const before = await page.evaluate(() => JSON.stringify(growthData));
  await card(page).locator('#feWtRetype').fill('9.5');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  await expect(card(page).locator('#feWtRetypeErr')).toContainText('You typed 9.5 kg; Growth has 15.9 kg on that date');
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(0);
  await card(page).locator('#feWtRetype').fill('15,9');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
  const r = await page.evaluate((d) => ({ growth: JSON.stringify(growthData), stored: (JSON.parse(localStorage.getItem(KEYS.growthConfirm) || '{}')[d] || {})['15900'] }), latest);
  expect(r.growth).toBe(before);
  expect(r.stored).toEqual(['amber']);
});

test('a confirm covers only that exact weight: a later edit on the same date asks again', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]], { confirm: { 3: [15.9] } });
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  // 15.4 kg is still believable on its own, so the jump check (not the plausibility gate) decides.
  await page.evaluate((d) => { growthData[growthData.length - 1] = { date: d, wt: 15.4 }; (window as any).renderFeverEpisodeCard(); }, latest);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(1);
});

test('one weigh-in with nothing to compare reads calm, not amber', async ({ page }) => {
  await seed(page, [[3, 9.5]]);
  const block = card(page).locator('.fe-para-confirm');
  await expect(block).toHaveClass(/fe-para-confirm--calm/);
  await expect(block).toContainText('no earlier weight to check it against');
});

test('a confirmed drop doses and adds the tell-your-doctor line', async ({ page }) => {
  await seed(page, [[20, 9.8], [2, 8.4]], { confirm: { 2: [8.4] } });
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
  await expect(card(page)).toContainText('A real drop in weight while she is unwell is worth telling your doctor today. Keep offering breast milk or other milk, and fluids, often.');
});

test('the countdown says to check the weight first when the dose could otherwise be given', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  await page.evaluate(() => { _feverEpisodes[0].doses = [{ id: 'd1', time: new Date(Date.now() - 5 * 3600000).toISOString(), medicine: 'Paracetamol', dose: '1 ml' }]; (window as any).renderFeverEpisodeCard(); });
  await expect(card(page).locator('.fe-dose-next')).toContainText('once the weight below is checked');
});

test('every chip state has its own branch: none falls through to the fail-closed line', async ({ page }) => {
  await seed(page, [[40, 9.2], [3, 9.5]]);
  const fell = await page.evaluate(() => {
    const w: any = window;
    const real = w.getParacetamolChip;
    const out: string[] = [];
    try {
      (0, eval)('PARA_CHIP_STATES').forEach((st: string) => {   // a top-level const, not a window property
        const F0 = (0, eval)('PARACETAMOL_FORMS')[0];
        w.getParacetamolChip = () => ({ state: st, form: F0, wt: 9.5, date: w.toDateStr(new Date()), dateLabel: 'today', ageDays: 0, stale: false,
          dose: w.getParacetamolDose(9.5, F0), check: { verdict: 'confirm', variant: 'nocompare', reason: 'noprev', pairs: [] } });
        w.renderFeverEpisodeCard();
        if ((document.getElementById('feverEpisodeCard') as HTMLElement).textContent!.indexOf('can’t be worked out here') >= 0
          || (document.getElementById('feverEpisodeCard') as HTMLElement).textContent!.indexOf("can't be worked out here") >= 0) out.push(st);
      });
      w.getParacetamolChip = () => ({ state: 'mystery', form: null });
      w.renderFeverEpisodeCard();
      out.push('unknown:' + ((document.getElementById('feverEpisodeCard') as HTMLElement).textContent!.indexOf("can't be worked out here") >= 0));
    } finally { w.getParacetamolChip = real; }
    return out;
  });
  expect(fell).toEqual(['unknown:true']);
});

test('the confirm map is a union by date, weight and kind: commutative, idempotent, never undone (Kael V-K-290-4)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = { '2026-11-01': { '15900': ['amber'] }, '2026-10-01': { '9200': ['calm'] }, 'bad': { '1': ['amber'] }, '2026-09-01': { '9.5': ['amber'], '9500': ['nope'] } };
    const B = { '2026-11-01': { '9500': ['calm'], '15900': ['samedate'] }, '2026-08-01': { '8800': ['amber'] } };
    const ab = w.gvConfirmMerge(A, B), ba = w.gvConfirmMerge(B, A);
    return { ab, same: JSON.stringify(ab) === JSON.stringify(ba), idem: JSON.stringify(w.gvConfirmMerge(ab, B)) === JSON.stringify(ab) };
  });
  expect(r.ab).toEqual({ '2026-08-01': { '8800': ['amber'] }, '2026-10-01': { '9200': ['calm'] }, '2026-11-01': { '15900': ['amber', 'samedate'], '9500': ['calm'] } });
  expect(r.same).toBe(true);
  expect(r.idem).toBe(true);
});

test('a calm confirm does not cover a jump that later evidence reveals (Kael V-K-290-3)', async ({ page }) => {
  await seed(page, [[3, 15.9]], { confirm: { 3: [15.9, ['calm']] } });
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 40); growthData.unshift({ date: (window as any).toDateStr(d), wt: 9.5 }); (window as any).renderFeverEpisodeCard(); });
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(1);
  await expect(card(page).locator('.fe-para-confirm')).not.toHaveClass(/fe-para-confirm--calm/);
});

test('a confirmed same-date conflict still runs the jump test against earlier weigh-ins (Kael V-K-290-8)', async ({ page }) => {
  await seed(page, [[60, 9.5], [3, 9.6], [3, 11.6]]);
  await expect(card(page).locator('.fe-para-confirm')).toContainText('two different weights on the same day');
  await card(page).locator('#feWtRetype').fill('11.6');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  await expect(card(page).locator('.fe-para-confirm')).toContainText('more than children usually gain');
  await card(page).locator('#feWtRetype').fill('11.6');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
});

test('a small loss in a baby reads in grams, never "0.0 kg" (Vela V-V-290-1)', async ({ page }) => {
  await seed(page, [[8, 6.40], [3, 6.38]], { ageDays: 200 });
  const block = card(page).locator('.fe-para-confirm');
  await expect(block).toContainText('20 g less in 5 days');
  await expect(block).not.toContainText('0.0');
});

test('a recent match with an old far pair says so, never "the weigh-in before it was too long ago" (Maren V-M-290-3)', async ({ page }) => {
  await seed(page, [[220, 8.2], [10, 9.4], [0, 9.5]]);
  const block = card(page).locator('.fe-para-confirm');
  await expect(block).toContainText('weigh-in matches, but the one on');
  await expect(block).not.toContainText('The weigh-in before it was too long ago');
});

test('Home never says "safe to give" while the card asks about the weight (Kael V-K-290-1, Maren V-M-290-1)', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  const alert = await page.evaluate(() => {
    const w: any = window;
    _feverEpisodes[0].doses = [{ id: 'd1', time: new Date(Date.now() - 5 * 3600000).toISOString(), medicine: 'Paracetamol', dose: '1 ml' }];
    return (w.computeFeverAlerts() || []).find((a: any) => a.id === 'fever-dose-available') || null;
  });
  expect(alert).not.toBeNull();
  expect(alert.body).not.toContain('safe to give');
  expect(alert.body).toContain('Check the weight on the fever card');
});

test('the growth-vs-meals insight never reads a second weight on a flagged newest date, in either save order (Ceres V-C-290-1/-4)', async ({ page }) => {
  const read = async (rows: [number, number][]) => {
    await seed(page, rows);
    return page.evaluate(() => {
      const w: any = window;
      // Meals logged on every day, so the insight has periods to show.
      const fd = (0, eval)('feedingData');   // a top-level let, not a window property
      for (let i = 0; i < 100; i++) { const d = new Date(); d.setDate(d.getDate() - i); fd[w.toDateStr(d)] = { breakfast: 'x', lunch: 'y', dinner: i % 2 ? 'z' : '' }; }
      const el = document.getElementById('insightsCrossContent') || (() => { const d = document.createElement('div'); d.id = 'insightsCrossContent'; document.body.appendChild(d); return d; })();
      w.renderInsightsCross();
      return el.textContent || '';
    });
  };
  for (const rows of [[[90, 9.0], [60, 9.2], [30, 9.4], [3, 9.6], [3, 96]], [[90, 9.0], [60, 9.2], [30, 9.4], [3, 96], [3, 9.6]]] as [number, number][][]) {
    const t = await read(rows);
    expect(t).toContain('Growth vs meals');               // the insight is shown, not just silent
    expect(t).not.toMatch(/[0-9]{3,}g\/d/);               // and never a thousands-of-grams day from the 96 kg typo
  }
});

test('a confirm from the other phone arrives on receive and re-renders the chip', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]]);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(1);
  await page.evaluate((d) => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    w._syncHandleSingleDocSnapshot('growth', { exists: true, metadata: { hasPendingWrites: false },
      data: () => ({ [KEYS.growth]: growthData, [KEYS.growthConfirm]: { [d]: { '15900': ['amber'] } } }) });
  }, latest);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
});

test('the emergency summary shows the weigh-in date and "not yet confirmed by the family" while the check asks', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  const before = await page.evaluate(() => (window as any)._emDocVitals());
  expect(before).toContain('15.9 kg (weighed ');
  expect(before).toContain('not yet confirmed by the family');
  await page.evaluate(() => { const last = growthData[growthData.length - 1]; growthConfirm = { [last.date]: { [String(Math.round(last.wt * 1000))]: ['amber'] } }; });
  const after = await page.evaluate(() => (window as any)._emDocVitals());
  expect(after).toContain('15.9 kg (weighed ');
  expect(after).not.toContain('not yet confirmed');
});

test('a retype for a row that changed writes nothing (spec §4.3, Carina V-CA-290-6d)', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]]);
  await page.evaluate((d) => { growthData[growthData.length - 1] = { date: d, wt: 15.4 }; }, latest);   // changed under the open card
  await card(page).locator('#feWtRetype').fill('15.9');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(KEYS.growthConfirm) || '{}'));
  expect(stored).toEqual({});
});

test('a full push merges confirms with the cloud as a union, never local-wins (Carina V-CA-290-6a)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(async () => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    let written: any = null;
    const cloud = { [KEYS.growthConfirm]: { '2026-10-01': { '9200': ['calm'] } } };
    const doc = (col: string) => ({ get: async () => ({ exists: col === 'growth', data: () => (col === 'growth' ? cloud : {}) }), set: async (p: any) => { if (col === 'growth') written = p; } });
    const hRef = { firestore: { runTransaction: async () => {}, batch: () => ({ set() {}, commit: async () => {} }) }, collection: () => ({ doc }) };
    w._syncUser = undefined;
    (0, eval)("_syncUser = { uid: 't', displayName: 'T' }");
    w.save(KEYS.growthConfirm, { '2026-11-01': { '15900': ['amber'] } });
    await w._syncFlushDirty(hRef);
    (0, eval)('_syncUser = null');
    return written && written[KEYS.growthConfirm];
  });
  expect(r).toEqual({ '2026-10-01': { '9200': ['calm'] }, '2026-11-01': { '15900': ['amber'] } });
});

test('a retype records only the question the parent was shown; a changed check asks again (Kael V-K-290-11)', async ({ page }) => {
  await seed(page, [[3, 15.9]]);   // calm: nothing to compare
  await expect(card(page).locator('[data-action="feConfirmWeight"]')).toHaveAttribute('data-arg3', 'calm');
  // An earlier weigh-in arrives between render and tap: the question is now a jump.
  await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 40); growthData.unshift({ date: (window as any).toDateStr(d), wt: 9.5 }); });
  await card(page).locator('#feWtRetype').fill('15.9');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(KEYS.growthConfirm) || '{}'));
  expect(stored).toEqual({});
  await expect(card(page).locator('.fe-para-confirm')).not.toHaveClass(/fe-para-confirm--calm/);
});
