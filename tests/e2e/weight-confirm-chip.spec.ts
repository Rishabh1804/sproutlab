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
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).gvWeightNeedsConfirm === 'function' && typeof (window as any).renderFeverEpisodeCard === 'function', null, { timeout: 15_000 });
}
// A girl, ~14 months; growth rows as [daysAgo, kg]; an active fever; the drops bottle picked.
async function seed(page: Page, rows: [number, number][], opts: { confirm?: Record<string, number>; sex?: string | null } = {}) {
  await boot(page);
  return page.evaluate(({ rows, opts }) => {
    const w: any = window;
    const dob = new Date(); dob.setHours(12, 0, 0, 0); dob.setDate(dob.getDate() - 425);
    w._profSave(Object.assign({}, profile.child, { dob: w.toDateStr(dob), sex: opts.sex === undefined ? 'f' : opts.sex }), profile.place);
    const iso = (ago: number) => { const d = new Date(); d.setDate(d.getDate() - ago); return w.toDateStr(d); };
    growthData = rows.map(([ago, wt]) => ({ date: iso(ago), wt }));
    growthConfirm = {};
    Object.keys(opts.confirm || {}).forEach(k => { growthConfirm[iso(+k)] = (opts.confirm as any)[k]; });
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
  await expect(card(page).locator('#feWtRetypeErr')).toContainText('You typed 9.5 kg; Growth has 15.9 kg');
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(0);
  await card(page).locator('#feWtRetype').fill('15,9');
  await card(page).locator('[data-action="feConfirmWeight"]').click();
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
  const r = await page.evaluate((d) => ({ growth: JSON.stringify(growthData), stored: JSON.parse(localStorage.getItem(KEYS.growthConfirm) || '{}')[d] }), latest);
  expect(r.growth).toBe(before);
  expect(r.stored).toBe(15.9);
});

test('a confirm covers only that exact weight: a later edit on the same date asks again', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]], { confirm: { 3: 15.9 } });
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
  await seed(page, [[20, 9.8], [2, 8.4]], { confirm: { 2: 8.4 } });
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
  await expect(card(page)).toContainText('A real drop in weight while she is unwell is worth telling your doctor.');
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

test('the confirm map merges commutatively and idempotently; a conflicting date keeps the smaller weight', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = { '2026-11-01': 15.9, '2026-10-01': 9.2, 'bad': 3, '2026-09-01': 'x' };
    const B = { '2026-11-01': 9.5, '2026-08-01': 8.8 };
    const ab = w.gvConfirmMerge(A, B), ba = w.gvConfirmMerge(B, A);
    return { ab, same: JSON.stringify(ab) === JSON.stringify(ba), idem: JSON.stringify(w.gvConfirmMerge(ab, B)) === JSON.stringify(ab) };
  });
  expect(r.ab).toEqual({ '2026-08-01': 8.8, '2026-10-01': 9.2, '2026-11-01': 9.5 });
  expect(r.same).toBe(true);
  expect(r.idem).toBe(true);
});

test('a confirm from the other phone arrives on receive and re-renders the chip', async ({ page }) => {
  const latest = await seed(page, [[40, 9.5], [3, 15.9]]);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(1);
  await page.evaluate((d) => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    w._syncHandleSingleDocSnapshot('growth', { exists: true, metadata: { hasPendingWrites: false },
      data: () => ({ [KEYS.growth]: growthData, [KEYS.growthConfirm]: { [d]: 15.9 } }) });
  }, latest);
  await expect(card(page).locator('.fe-para-confirm')).toHaveCount(0);
  await expect(card(page).locator('.fe-para-dose')).toHaveCount(1);
});

test('the emergency summary shows the weigh-in date and "not yet checked" while the check asks', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  const before = await page.evaluate(() => (window as any)._emDocVitals());
  expect(before).toContain('15.9 kg (weighed ');
  expect(before).toContain('not yet checked');
  await page.evaluate(() => { const last = growthData[growthData.length - 1]; growthConfirm = { [last.date]: last.wt }; });
  const after = await page.evaluate(() => (window as any)._emDocVitals());
  expect(after).toContain('15.9 kg (weighed ');
  expect(after).not.toContain('not yet checked');
});
