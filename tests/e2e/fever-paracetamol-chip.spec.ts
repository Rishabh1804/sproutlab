import { test, expect } from '@playwright/test';

// Fever card paracetamol chip (Maren V-M-282g-6 + PR #284 Governor round):
// the dose names the weight, the weigh-in date and the bottle; no bottle → no ml; a typo'd weight
// gives no dose; an old weight is flagged; the 4-in-24 h limit is enforced, not just stated.
// QA chain canon-cc-008: Kael (intelligence-illness.js) + Maren (dosing consequence) + Carina (core.js dispatch) + core trio (styles.css).

const H = 3600000;

// `unconfirmed`: leave the weight-jump check's question open. By default the newest weight counts as
// already confirmed by the parent (#161 PR 4a), so these tests stay about the dose itself.
async function seed(page: any, opts: { rows?: { date: string; wt: number }[]; doses?: number[]; earlier?: string; earlierHoursAgo?: number; unconfirmed?: boolean } = {}) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  await page.evaluate((o: any) => {
    const iso = (offsetDays: number) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return toDateStr(d); };
    growthData = (o.rows || []).map((r: any) => ({ date: r.date === 'DOB' ? toDateStr(DOB) : iso(+r.date), wt: r.wt }));
    growthConfirm = {};
    if (!o.unconfirmed && growthData.length) { const last = growthData[growthData.length - 1]; growthConfirm[last.date] = { [String(Math.round(last.wt * 1000))]: ['amber', 'calm', 'samedate'] }; }
    const now = Date.now();
    const eps: any[] = [];
    if (o.earlier) eps.push({ id: 'fe-old', status: 'resolved', startedAt: new Date(now - 60 * 24 * 3600000).toISOString(),
      resolvedAt: new Date(now - 58 * 24 * 3600000).toISOString(), readings: [{ temp: 101, time: new Date(now - 60 * 24 * 3600000).toISOString(), notes: '' }],
      doses: [{ time: new Date(now - (o.earlierHoursAgo || 60 * 24) * 3600000).toISOString(), medicine: 'Paracetamol', dose: o.earlier === 'drops100' ? '1.0 ml' : '5 ml', notes: '', form: o.earlier }],   // a real dose for that bottle: 5 ml of drops is 500 mg, which the leftover-risk flow rightly stops (#161 PR 4b)
      actions: [], peakTemp: 101, triggerSource: 'test', notes: '', resolvedNotes: '' });
    eps.push({ id: 'fe-para', status: 'active', startedAt: new Date(now - 20 * 3600000).toISOString(), resolvedAt: null,
      readings: [{ temp: 101.2, time: new Date().toISOString(), notes: '' }],
      doses: (o.doses || []).map((hAgo: number) => ({ time: new Date(now - hAgo * 3600000).toISOString(), medicine: 'Paracetamol', dose: '1.0 ml', notes: '', form: 'drops100' })),
      actions: [], peakTemp: 101.2, triggerSource: 'test', notes: '', resolvedNotes: '' });
    _feverEpisodes = eps;
    _feParaForm = null; _feParaFormEp = null;
    switchTab('medical');
    renderFeverEpisodeCard();
  }, opts);
  return page.locator('#feverEpisodeCard');
}

test('no bottle picked → no ml; picking one shows ml, mg, weight and date', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }] });
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  await expect(card.locator('.fe-para-form.active')).toHaveCount(0);
  await expect(card).toContainText('Tap the bottle you have');
  await card.locator('[data-action="feSetParaForm"][data-arg="drops100"]').click();
  await expect(card.locator('.fe-para-dose')).toContainText('1.0–1.4 ml');
  await expect(card.locator('.fe-para-dose')).toContainText('drops (100 mg in 1 ml)');
  await expect(card).toContainText('95–142 mg, for 9.5 kg, weighed');
  await expect(card.locator('.fe-para-form.active')).toHaveAttribute('aria-pressed', 'true');
  await card.locator('[data-action="feSetParaForm"][data-arg="syrup120"]').click();
  await expect(card.locator('.fe-para-dose')).toContainText('4.0–5.9 ml'); // never past 15 mg/kg
});

test('a bottle from an earlier fever is a hint, never a preselected dose', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }], earlier: 'syrup120' });
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  await expect(card.locator('.fe-para-form.active')).toHaveCount(0);
  await expect(card).toContainText('Last fever you used syrup (120 mg in 5 ml)');
});

test('a typo weight (95 kg) shows no dose', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 95 }] });
  await card.locator('[data-action="feSetParaForm"][data-arg="drops100"]').click();
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  await expect(card.locator('.fe-para-warn')).toContainText('95 kg, looks off');
});

test('a believable newborn weight under 3 kg gives no dose and no crash', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: 'DOB', wt: 2.9 }] });
  await expect(card.locator('.fe-para-warn')).toContainText('too old to dose from');
  await expect(card.locator('[data-action="feResolvePrompt"]')).toHaveCount(1); // the card rendered to the end
});

test('a weight older than 4 weeks is flagged', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-45', wt: 9.2 }] });
  await card.locator('[data-action="feSetParaForm"][data-arg="drops100"]').click();
  await expect(card).toContainText('6 weeks old');
});

test('4 doses in 24 h blocks a 5th even after the 4 h gap', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }], doses: [17, 13, 9, 5] });
  await expect(card.locator('.fe-dose-next')).toContainText('4 doses in the last 24 h');
  await expect(card.locator('.fe-dose-next')).not.toContainText('available now');
  const cd = await page.evaluate(() => getFeverDoseCountdown());
  expect(cd.available).toBe(false);
  expect(cd.reason).toBe('daily-max');
});

test('the logged dose records the picked bottle, amount first in history', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }] });
  page.on('dialog', (d: any) => d.accept('2.5 ml'));
  await card.locator('[data-action="feSetParaForm"][data-arg="syrup250"]').click();
  await card.locator('[data-action="feLogDosePrompt"]').click();
  const dose = await page.evaluate(() => _feverEpisodes[_feverEpisodes.length - 1].doses[0]);
  expect(dose.form).toBe('syrup250');
  expect(dose.medicine).toBe('Paracetamol syrup (250 mg in 5 ml)');
  await expect(card.locator('.fe-dose-row').first()).toContainText('2.5 ml of Paracetamol syrup (250 mg in 5 ml)');
  await page.evaluate(() => { _feParaForm = null; renderFeverEpisodeCard(); });
  await expect(card.locator('.fe-para-form.active')).toContainText('Syrup · 250 mg in 5 ml'); // within this episode
});

test('a dose from a just-resolved episode still holds the 4 h gap in a new, empty episode', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }], earlier: 'drops100', earlierHoursAgo: 1 });
  await expect(card.locator('.fe-dose-next')).toContainText('4 h gap');
  await expect(card.locator('.fe-dose-next')).toContainText('earlier fever');
  const lastAt = await page.evaluate(() => _feverTimeShort(new Date(getFeverDoseCountdown().lastTime).toISOString()));
  await expect(card.locator('.fe-dose-next')).toContainText('Last paracetamol at ' + lastAt);
  await expect(card.locator('.fe-dose-empty')).toHaveText('No medicine logged since this fever started');
  const cd = await page.evaluate(() => getFeverDoseCountdown());
  expect(cd.available).toBe(false);
  expect(cd.reason).toBe('gap');
});

test('a months-old dose sets no limit and raises no alert', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }], earlier: 'drops100' });
  await expect(card.locator('.fe-dose-next')).toHaveCount(0);
  expect(await page.evaluate(() => getFeverDoseCountdown())).toBeNull();
});

test('a weight the check asks about shows no dose and the log prompt pre-fills nothing (Maren V-M-290-7)', async ({ page }) => {
  const card = await seed(page, { rows: [{ date: '-3', wt: 9.5 }], unconfirmed: true });
  await card.locator('[data-action="feSetParaForm"][data-arg="drops100"]').click();
  await expect(card.locator('.fe-para-confirm')).toHaveCount(1);
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  const def = await page.evaluate(() => { const w: any = window; let got: any = null; const real = w.prompt; w.prompt = (_m: string, d: string) => { got = d; return null; }; try { w.feLogDosePrompt(); } finally { w.prompt = real; } return got; });
  expect(def).toBe('');
});
