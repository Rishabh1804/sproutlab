import { test, expect } from '@playwright/test';

// Fever card paracetamol chip (Maren V-M-282g-6): the dose names the weight, the weigh-in date
// and the bottle; a typo'd weight gives no dose; an old weight is flagged.
// QA chain canon-cc-008: Kael (intelligence-illness.js) + Maren (dosing consequence) + Carina (core.js dispatch).

async function seed(page: any, rows: { date: string; wt: number }[]) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  await page.evaluate((rows: any) => {
    const iso = (offsetDays: number) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); return toDateStr(d); };
    growthData = rows.map((r: any) => ({ date: r.date.startsWith('-') || /^\d+$/.test(r.date) ? iso(+r.date) : r.date, wt: r.wt }));
    _feParaForm = null;
    _feverEpisodes = [{ id: 'fe-para', status: 'active', startedAt: new Date().toISOString(), resolvedAt: null,
      readings: [{ temp: 101.2, time: new Date().toISOString(), notes: '' }], doses: [], actions: [],
      peakTemp: 101.2, triggerSource: 'test', notes: '', resolvedNotes: '' }];
    switchTab('medical');
    renderFeverEpisodeCard();
  }, rows);
}

test('dose names weight, date and bottle; switching bottle changes ml', async ({ page }) => {
  await seed(page, [{ date: '-3', wt: 9.5 }]);
  const card = page.locator('#feverEpisodeCard');
  await expect(card.locator('.fe-para-dose')).toContainText('1.0–1.4 ml of drops 100 mg/ml');
  await expect(card.locator('.fe-para-dose')).toContainText('for 9.5 kg, weighed');
  await card.locator('[data-action="feSetParaForm"][data-arg="syrup120"]').click();
  // 95–142.5 mg at 24 mg/ml → 4.0–5.9 ml (high end rounds down, never past 15 mg/kg)
  await expect(card.locator('.fe-para-dose')).toContainText('4.0–5.9 ml of syrup 120 mg/5 ml');
  await expect(card.locator('.fe-para-note')).not.toContainText('weeks old');
});

test('a typo weight (95 kg) shows no dose', async ({ page }) => {
  await seed(page, [{ date: '-3', wt: 95 }]);
  const card = page.locator('#feverEpisodeCard');
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  await expect(card.locator('.fe-para-warn')).toContainText('95 kg, looks off');
});

test('a weight older than 4 weeks is flagged', async ({ page }) => {
  await seed(page, [{ date: '-45', wt: 9.2 }]);
  await expect(page.locator('#feverEpisodeCard .fe-para-note').first()).toContainText('6 weeks old');
});

test('the logged dose remembers the bottle', async ({ page }) => {
  await seed(page, [{ date: '-3', wt: 9.5 }]);
  page.on('dialog', (d: any) => d.accept('5 ml'));
  const card = page.locator('#feverEpisodeCard');
  await card.locator('[data-action="feSetParaForm"][data-arg="syrup250"]').click();
  await card.locator('[data-action="feLogDosePrompt"]').click();
  const dose = await page.evaluate(() => _feverEpisodes[0].doses[0]);
  expect(dose.form).toBe('syrup250');
  expect(dose.medicine).toBe('Paracetamol Syrup 250 mg/5 ml');
  await page.evaluate(() => { _feParaForm = null; renderFeverEpisodeCard(); });
  await expect(card.locator('.fe-action-chip.active')).toHaveText('Syrup 250 mg/5 ml');
});
