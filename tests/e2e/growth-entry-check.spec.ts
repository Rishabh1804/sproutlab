import { test, expect, type Page } from '@playwright/test';
declare let growthData: any; declare let growthConfirm: any; declare let profile: any;

// #161 PR 5 — the entry-time weight check (spec §4.5; Architect rulings E1–E4, 2026-11-06). On Save in the
// Add Measurement modal a weight is checked against the weigh-ins on or before its date, with the scale reading
// still in hand: a jump asks for a retype (or "Save unchecked" — never a silent block); a different weight on the
// same date offers keep both (the one typed counts) or keep either; a date before birth is a hard stop; a
// back-dated weight that makes the NEWEST weight look off asks about it before the modal closes.
// QA chain canon-cc-008: Maren (medical.js), Carina (core.js helpers + the growth / growthConfirm write path),
// Kael (consult: the jump-check engine and the shared reason builder), core trio (template.html).

async function boot(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('ziva_guide_seen', '1'); } catch (e) {} });
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).gEntryKeep === 'function' && typeof (window as any).gvEntryNeedsConfirm === 'function', null, { timeout: 15_000 });
}
// A girl, ~14 months; rows as [daysAgo, kg, htCm?]. Returns an iso(daysAgo) helper's results for the days asked.
async function seed(page: Page, rows: [number, number | null, number?][], opts: { confirm?: Record<string, [number, string[]]> } = {}) {
  await boot(page);
  await page.evaluate(({ rows, opts }) => {
    const w: any = window;
    const dob = new Date(); dob.setHours(12, 0, 0, 0); dob.setDate(dob.getDate() - 425);
    w._profSave(Object.assign({}, profile.child, { dob: w.toDateStr(dob), sex: 'f' }), profile.place);
    const iso = (ago: number) => { const d = new Date(); d.setDate(d.getDate() - ago); return w.toDateStr(d); };
    growthData = rows.map(([ago, wt, ht]) => ({ date: iso(ago), wt, ht: ht || null }));
    growthConfirm = {};
    Object.keys(opts.confirm || {}).forEach(k => { const [kg, kinds] = (opts.confirm as any)[k]; growthConfirm[iso(+k)] = { [String(Math.round(kg * 1000))]: kinds }; });
    w.switchTab('growth');
    w.openGrowthModal();
  }, { rows, opts });
}
const iso = (page: Page, ago: number) => page.evaluate((ago) => { const d = new Date(); d.setDate(d.getDate() - ago); return (window as any).toDateStr(d); }, ago);
async function enter(page: Page, ago: number, kg: string, htCm?: string) {
  await page.fill('#gDate', await iso(page, ago));
  await page.fill('#gWeight', kg);
  if (htCm) { await page.selectOption('#gHeightUnit', 'cm'); await page.fill('#gHeight', htCm); }
  await page.click('#growthSaveBtn');
}
const panel = (page: Page) => page.locator('#gEntryCheck .fe-para-confirm');
const weightsOn = (page: Page, date: string) => page.evaluate((d) => growthData.filter((r: any) => r.date === d && typeof r.wt === 'number').map((r: any) => r.wt), date);
const kinds = (page: Page, date: string, kg: number) => page.evaluate(([d, g]) => ((growthConfirm[d as string] || {})[g as string] || []), [date, String(Math.round(kg * 1000))]);
const chipState = (page: Page) => page.evaluate(() => { const w: any = window; return w.getParacetamolChip(w.getLatestWeight()).state; });
const modalOpen = (page: Page) => page.evaluate(() => document.getElementById('growthModal')!.classList.contains('open'));

test('a believable weight saves straight away, no panel', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '9.6');
  await expect(panel(page)).toHaveCount(0);
  expect(await weightsOn(page, await iso(page, 0))).toEqual([9.6]);
  expect(await modalOpen(page)).toBe(false);
});

test('a jump (9.5 → 15.9 kg) asks before saving: the pair, one instruction, Why folded, Save unchecked', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '15.9');
  await expect(panel(page)).toHaveCount(1);
  await expect(panel(page)).toContainText('Check this weight');
  await expect(panel(page)).toContainText('15.9 kg');
  await expect(panel(page)).toContainText('If 15.9 kg is right, type it again.');
  await expect(page.locator('#gEntryCheck .fe-load-prow')).not.toHaveClass(/open/);
  await expect(page.locator('#gEntryCheck .fe-load-prow-d')).toHaveText('More than children usually gain in that time');
  await expect(page.locator('#growthSaveBtn')).toBeHidden();
  await expect(page.locator('#growthSaveUncheckedBtn')).toBeVisible();
  expect(await weightsOn(page, await iso(page, 0))).toEqual([]);   // nothing written yet
});

test('a mismatched retype saves nothing; the right one (comma decimal) saves and records amber', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '15.9');
  await page.fill('#gEntryRetype', '9.5');
  await page.click('[data-action="gEntryConfirm"]');
  await expect(page.locator('#gEntryRetypeErr')).toContainText('You typed 9.5 kg; the weight box has 15.9 kg.');
  expect(await weightsOn(page, await iso(page, 0))).toEqual([]);
  await page.fill('#gEntryRetype', '15,9');
  await page.click('[data-action="gEntryConfirm"]');
  const today = await iso(page, 0);
  expect(await weightsOn(page, today)).toEqual([15.9]);
  expect(await kinds(page, today, 15.9)).toEqual(['amber']);
  expect(await modalOpen(page)).toBe(false);
  expect(await chipState(page)).not.toBe('confirm');
});

test('Save unchecked saves the weight unconfirmed; the chip still asks', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '15.9');
  await page.click('#growthSaveUncheckedBtn');
  const today = await iso(page, 0);
  expect(await weightsOn(page, today)).toEqual([15.9]);
  expect(await kinds(page, today, 15.9)).toEqual([]);
  expect(await chipState(page)).toBe('confirm');
});

test('editing the weight box clears a stale panel', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '15.9');
  await expect(panel(page)).toHaveCount(1);
  await page.fill('#gWeight', '9.6');
  await expect(panel(page)).toHaveCount(0);
  await expect(page.locator('#growthSaveBtn')).toBeVisible();
});

test('same date: keep both — the one typed counts, the conflict is settled, the chip reads it', async ({ page }) => {
  await seed(page, [[30, 9.2], [0, 9.4]]);
  await enter(page, 0, '9.5');
  await expect(panel(page)).toContainText('Growth already has a weight for');
  await expect(panel(page)).toContainText('Keep both, or keep just one. If you keep both, the one you typed counts.');
  await expect(page.locator('[data-action="gEntryKeep"]')).toHaveCount(3);
  await page.click('[data-action="gEntryKeep"][data-arg="both"]');
  const today = await iso(page, 0);
  expect(await weightsOn(page, today)).toEqual([9.4, 9.5]);
  expect(await page.evaluate(() => (window as any).getLatestWeight().wt)).toBe(9.5);
  expect(await kinds(page, today, 9.5)).toEqual(['samedate']);
  expect(await chipState(page)).not.toBe('confirm');
});

test('same date: keep the typed weight only — the other weight leaves its row, its height stays', async ({ page }) => {
  await seed(page, [[30, 9.2], [0, 9.4, 76]]);
  await enter(page, 0, '9.5');
  await page.click('[data-action="gEntryKeep"][data-arg="new"]');
  const today = await iso(page, 0);
  expect(await weightsOn(page, today)).toEqual([9.5]);
  expect(await page.evaluate((d) => growthData.some((r: any) => r.date === d && r.ht === 76 && r.wt == null), today)).toBe(true);
});

test('same date: keep the saved weight only — the typed one is dropped', async ({ page }) => {
  await seed(page, [[30, 9.2], [0, 9.4]]);
  await enter(page, 0, '9.5');
  await page.click('[data-action="gEntryKeep"][data-arg="old:9400"]');
  expect(await weightsOn(page, await iso(page, 0))).toEqual([9.4]);
  expect(await modalOpen(page)).toBe(false);
});

test('the same weight on the same date is a re-save: no second weight row', async ({ page }) => {
  await seed(page, [[30, 9.2], [0, 9.4]]);
  await enter(page, 0, '9.4');
  await expect(panel(page)).toHaveCount(0);
  expect(await weightsOn(page, await iso(page, 0))).toEqual([9.4]);
});

test('keep both with a jumped typed weight still asks for the retype, then records both kinds', async ({ page }) => {
  await seed(page, [[30, 9.2], [0, 9.4]]);
  await enter(page, 0, '15.9');
  await page.click('[data-action="gEntryKeep"][data-arg="both"]');
  await expect(panel(page)).toContainText('Check this weight');
  await page.fill('#gEntryRetype', '15.9');
  await page.click('[data-action="gEntryConfirm"]');
  const today = await iso(page, 0);
  expect(await kinds(page, today, 15.9)).toEqual(['amber', 'samedate']);
  expect(await chipState(page)).not.toBe('confirm');
});

test('a calm "couldn\'t compare" saves with no panel (E2): no earlier weight, or too long a gap', async ({ page }) => {
  await seed(page, []);
  await enter(page, 0, '9.5');
  await expect(panel(page)).toHaveCount(0);
  expect(await weightsOn(page, await iso(page, 0))).toEqual([9.5]);
  await page.evaluate(() => (window as any).openGrowthModal());
  await page.evaluate(() => { growthData = [{ date: (window as any).toDateStr(new Date(Date.now() - 300 * 864e5)), wt: 6.2 }]; });
  await enter(page, 0, '9.4');
  await expect(panel(page)).toHaveCount(0);
});

test('a weigh-in dated before the birth date is a hard stop (E3)', async ({ page }) => {
  await seed(page, [[30, 9.2]]);
  await enter(page, 500, '9.5');
  await expect(panel(page)).toContainText('is before her birth date');
  await expect(page.locator('#growthSaveBtn')).toBeHidden();
  await expect(page.locator('#growthSaveUncheckedBtn')).toBeHidden();
  expect(await page.evaluate(() => growthData.length)).toBe(1);
});

test('a back-dated weight that makes the newest weight jump asks about the newest (E4); Confirm records it', async ({ page }) => {
  await seed(page, [[200, 7.6], [3, 11.4]]);
  await enter(page, 30, '9.2');
  await expect(panel(page)).toContainText('Now check the newest weight');
  await expect(panel(page)).toContainText('You just added');
  expect(await weightsOn(page, await iso(page, 30))).toEqual([9.2]);   // the entry is saved first
  await expect(page.locator('#growthDoneBtn')).toBeVisible();
  await page.fill('#gEntryRetype', '11.4');
  await page.click('[data-action="gEntryConfirmNewest"]');
  expect(await kinds(page, await iso(page, 3), 11.4)).toEqual(['amber']);
  expect(await modalOpen(page)).toBe(false);
});

test('E4 Done leaves the newest weight asking at the chip', async ({ page }) => {
  await seed(page, [[200, 7.6], [3, 11.4]]);
  await enter(page, 30, '9.2');
  await page.click('#growthDoneBtn');
  expect(await modalOpen(page)).toBe(false);
  expect(await chipState(page)).toBe('confirm');
});

test('a height-only entry is never checked', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await page.fill('#gDate', await iso(page, 0));
  await page.check('#gHeightCheck');
  await page.selectOption('#gHeightUnit', 'cm');
  await page.fill('#gHeight', '76');
  await page.click('#growthSaveBtn');
  await expect(panel(page)).toHaveCount(0);
  expect(await page.evaluate(() => growthData.some((r: any) => r.ht === 76 && r.wt == null))).toBe(true);
});

test('if the check changed between the panel and the tap (a sync landed), the row saves but nothing is recorded', async ({ page }) => {
  await seed(page, [[40, 9.2], [9, 9.5]]);
  await enter(page, 0, '15.9');
  // The other phone's weight for today lands: the newest weight now shares its date, a different question.
  await page.evaluate(() => { growthData.push({ date: (window as any).today(), wt: 15.0, ht: null }); });
  await page.fill('#gEntryRetype', '15.9');
  await page.click('[data-action="gEntryConfirm"]');
  const today = await iso(page, 0);
  expect(await weightsOn(page, today)).toEqual([15.0, 15.9]);
  expect(await kinds(page, today, 15.9)).toEqual([]);
  expect(await chipState(page)).toBe('confirm');
});

test('the helpers with no rows argument still read Growth (the chip path is unchanged)', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 15.9]]);
  const r = await page.evaluate(() => { const w: any = window; const row = w.getLatestWeight(); return [w.gvWeightNeedsConfirm(row).askKind, w.gvWeightNeedsConfirm(row, growthData).askKind]; });
  expect(r).toEqual(['amber', 'amber']);
});
