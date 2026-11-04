import { test, expect, type Page } from '@playwright/test';
declare let growthData: any; declare let growthConfirm: any; declare let _feverEpisodes: any; declare let _vomitingEpisodes: any; declare let _feParaForm: any; declare let _feParaFormEp: any;
declare let profile: any;

// #161 PR 4b — the leftover-risk flow (spec §5, decision C; rules R0–R3 ratified 2026-11-04). The pure engine
// (_paraLoadFrom) is tested rule by rule; then the live wiring: the reference weight, the card's verdict line and
// block, Home's alerts, the escalation fold and the GI cards.
// QA chain canon-cc-008: Kael (intelligence-illness.js), Maren (consequence; PARA_LOAD_THRESHOLDS by hand),
// Carina (core.js, sync.js), Vela + core trio (styles.css), Ceres (ripple), Cipher.

const H = 3600000;
async function boot(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('ziva_guide_seen', '1'); } catch (e) {} });
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any)._paraLoadFrom === 'function', null, { timeout: 15_000 });
}
// Run the pure engine: doses as [hoursAgo, mg] (or [hoursAgo, lo, hi]).
async function load(page: Page, o: any) {
  return page.evaluate((o) => {
    const w: any = window;
    const now = Date.UTC(2026, 10, 10, 12);
    const doses = (o.doses || []).map((d: number[]) => ({ t: now - d[0] * 3600000, lo: d[1], hi: d.length > 2 ? d[2] : d[1], readable: true, form: null, medicine: 'Paracetamol' }));
    const r = w._paraLoadFrom({ nowMs: now, doses, wDose: o.wDose === undefined ? 9.5 : o.wDose, wRef: o.wRef === undefined ? { w: 9.5, src: null } : o.wRef,
      medName: o.medName || null, gi: !!o.gi, illnessStart: o.illnessStart || null, latestWtDate: o.latestWtDate || null,
      subj: 'she', obj: 'her', pos: 'her', fmtTime: () => 'TIME', fmtDate: () => 'DATE' });
    return { tier: r.tier, check: r.check, under: r.under, none: !!r.none, rules: r.rules.map((x: any) => x.rule + ':' + x.tier), text: r.rules.map((x: any) => x.lines.join(' ')).join(' | '), gi: r.rules.some((x: any) => x.giChips), wq: r.rules.some((x: any) => x.weightQ), extra: r.extra || '' };
  }, o);
}

test('dose amounts: mg exact, ml with the bottle exact, ml without a bottle 24–100 mg/ml, unreadable [0, ∞]', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const m = (dose: string, form?: string) => { const x = w._paraDoseMg({ dose, form }); return [x.lo, Number.isFinite(x.hi) ? x.hi : 'inf']; };
    return { mg: m('120 mg'), drops: m('1,5 ml', 'drops100'), range: m('1-1.4 ml', 'drops100'), noform: m('5 ml'), thousand: m('1,000 mg'), words: m('two drops'),
      para: [w._paraIsParacetamol('Paracetamol drops'), w._paraIsParacetamol('Combiflam'), w._paraIsParacetamol('Ibuprofen'), w._paraIsParacetamol('Brufen')] };
  });
  expect(r.mg).toEqual([120, 120]);
  expect(r.drops).toEqual([150, 150]);
  expect(r.range).toEqual([100, 140]);
  expect(r.noform).toEqual([120, 500]);
  expect(r.thousand).toEqual([1000, 1000]);
  expect(r.words).toEqual([0, 'inf']);
  expect(r.para).toEqual([true, true, false, false]);
});

test('calm: within the day\'s usual most, one plain line and the other-medicines note', async ({ page }) => {
  await boot(page);
  const r = await load(page, { doses: [[13, 140], [8, 140], [3, 140]] });
  expect(r.tier).toBe('calm');
  expect(r.under).toBe(true);
  expect(r.text).toContain('Last 24 h: 3 doses, 420');
  expect(r.extra).toContain('Some cold syrups also contain paracetamol');
});

test('R0: a dose under 4 h after the last one, or a 5th in 24 h, is red — never call-now on its own', async ({ page }) => {
  await boot(page);
  const close = await load(page, { doses: [[3, 140], [1, 140]] });
  expect(close.tier).toBe('red');
  expect(close.text).toContain('2 h 0 min after the last one');
  expect(close.text).toContain('Give no more paracetamol until TIME');
  const fifth = await load(page, { doses: [[22, 100], [17, 100], [12, 100], [7, 100], [2, 100]] });
  expect(fifth.rules).toContain('R0:red');
  expect(fifth.text).toContain('That\'s 5 doses in 24 hours. The packet allows 4.');
});

test('R0b: one dose bigger than one dose is red; twice the top dose is call-now', async ({ page }) => {
  await boot(page);
  const red = await load(page, { doses: [[2, 200]] });
  expect(red.rules).toContain('R0b:red');
  expect(red.text).toContain('the most for one dose is 142 mg');
  const now = await load(page, { doses: [[2, 300]] });
  expect(now.tier).toBe('now');
});

test('R1: over 60 mg/kg amber; at 75 call-now; escalation on the low end only, a high-only crossing asks which bottle', async ({ page }) => {
  await boot(page);
  const amber = await load(page, { doses: [[20, 150], [14, 150], [8, 150], [2, 150]] });
  expect(amber.rules).toContain('R1:amber');
  expect(amber.text).toContain('more than the usual most for a day for 9.5');
  const now = await load(page, { doses: [[20, 180], [14, 180], [8, 180], [2, 180]] });
  expect(now.tier).toBe('now');
  const bottle = await load(page, { doses: [[20, 120, 500], [14, 120, 500], [8, 120, 500], [2, 120, 500]] });
  expect(bottle.check).toBe(true);
  expect(bottle.tier).toBe('amber');
  expect(bottle.text).toContain('Which bottle was it?');
});

test('R1 weight question: the doses fit the newest weight but not the reference weight → check, never "safe"', async ({ page }) => {
  await boot(page);
  const r = await load(page, { wDose: 12, wRef: { w: 9.5, src: { date: '2026-10-01', wt: 9.4 } }, doses: [[20, 150], [14, 150], [8, 150], [2, 150]] });
  expect(r.wq).toBe(true);
  expect(r.check).toBe(true);
  expect(r.text).toContain('These doses fit her newest weight, 12 kg');
  expect(r.text).toContain('weigh-in on DATE (9.4 kg)');
});

test('R2: over the day\'s most for more than 48 h — call-now with a GI sign, amber with the question without one, amber "maybe" on unreadable amounts', async ({ page }) => {
  await boot(page);
  const doses = []; for (let h = 86; h >= 0; h -= 6) doses.push([h, 150]);
  const noGi = await load(page, { doses });
  expect(noGi.rules).toContain('R2:amber');
  expect(noGi.gi).toBe(true);
  expect(noGi.text).toContain('Has she been sick or had tummy pain?');
  expect(noGi.text).toContain('check the whites of the eyes');
  const gi = await load(page, { doses, gi: true });
  expect(gi.tier).toBe('now');
  expect(gi.text).toContain('She may need a blood test');
  const maybeDoses = []; for (let h = 86; h >= 0; h -= 6) maybeDoses.push([h, 36, 150]);
  const maybe = await load(page, { doses: maybeDoses });
  expect(maybe.text).toContain('We couldn\'t read every dose amount');
});

test('R2b: a dose on each of 4 calendar days → "the 4th day" (NHS: not more than 3 days without advice)', async ({ page }) => {
  await boot(page);
  const r = await load(page, { doses: [[72, 100], [48, 100], [24, 100], [0.5, 100]] });
  expect(r.rules).toContain('R2b:amber');
  expect(r.text).toContain('This is the 4th day of paracetamol.');
});

test('R3, an active paracetamol medicine, and no weight', async ({ page }) => {
  await boot(page);
  const r3 = await load(page, { doses: [[2, 140]], illnessStart: '2026-11-08', latestWtDate: '2026-10-20' });
  expect(r3.text).toContain('If you can, weigh her again before the next dose.');
  const med = await load(page, { doses: [[2, 140]], medName: 'Calpol' });
  expect(med.check).toBe(true);
  expect(med.text).toContain('Calpol in her medicines list also contains paracetamol');
  const nowt = await load(page, { doses: [[2, 140]], wDose: NaN, wRef: null });
  expect(nowt.check).toBe(true);
  expect(nowt.text).toContain('Add a weight so the day\'s total can be checked');
  const none = await load(page, { doses: [[100, 140]] });
  expect(none.none).toBe(true);
});

// ── Live wiring ──
async function seed(page: Page, rows: [number, number][], doses: [number, string, string?][], opts: { confirmLatest?: boolean; vomits?: number[] } = {}) {
  await boot(page);
  await page.evaluate(({ rows, doses, opts }) => {
    const w: any = window;
    const dob = new Date(); dob.setHours(12, 0, 0, 0); dob.setDate(dob.getDate() - 425);
    w._profSave(Object.assign({}, profile.child, { dob: w.toDateStr(dob), sex: 'f' }), profile.place);
    const iso = (ago: number) => { const d = new Date(); d.setDate(d.getDate() - ago); return w.toDateStr(d); };
    growthData = rows.map(([ago, wt]) => ({ date: iso(ago), wt }));
    growthConfirm = {};
    if (opts.confirmLatest && growthData.length) { const l = growthData[growthData.length - 1]; growthConfirm[l.date] = { [String(Math.round(l.wt * 1000))]: ['amber', 'calm', 'samedate'] }; }
    const now = Date.now();
    _feverEpisodes = [{ id: 'fe-l', status: 'active', startedAt: new Date(now - 70 * 3600000).toISOString(), resolvedAt: null,
      readings: [{ id: 'r1', temp: 101.4, time: new Date(now - 600000).toISOString(), notes: '' }],
      doses: doses.map(([h, dose, form], i) => ({ id: 'd' + i, time: new Date(now - h * 3600000).toISOString(), medicine: 'Paracetamol', dose, form: form || 'drops100' })),
      actions: [], peakTemp: 101.4, triggerSource: 't', notes: '', resolvedNotes: '' }];
    _vomitingEpisodes = (opts.vomits || []).length ? [{ id: 'vo-l', status: 'active', startedAt: new Date(now - 30 * 3600000).toISOString(), resolvedAt: null,
      episodes: (opts.vomits || []).map((h: number, i: number) => ({ id: 'v' + i, time: new Date(now - h * 3600000).toISOString(), type: 'normal' })), fluids: [], wetDiapers: [], actions: [] }] : [];
    _feParaForm = 'drops100'; _feParaFormEp = 'fe-l';
    w.switchTab('medical');
    w.renderFeverEpisodeCard();
  }, { rows, doses, opts });
  return page.locator('#feverEpisodeCard');
}

test('the reference weight carries an earlier weigh-in along its centile; a retyped confirm makes the latest the reference', async ({ page }) => {
  await seed(page, [[40, 9.5], [3, 11.0]], []);
  const before = await page.evaluate(() => (window as any)._paraRefWeight());
  expect(before.w).toBeGreaterThan(9.4);
  expect(before.w).toBeLessThan(10.2);
  expect(before.src).not.toBeNull();
  await page.evaluate(() => { const l = growthData[growthData.length - 1]; growthConfirm = { [l.date]: { '11000': ['amber', 'calm'] } }; });
  const after = await page.evaluate(() => (window as any)._paraRefWeight());
  expect(after.w).toBe(11.0);
});

test('the card: a hold says stop and shows the red block; Home raises the load alert and never says "safe to give"', async ({ page }) => {
  const card = await seed(page, [[40, 9.2], [3, 9.5]], [[7, '1.4 ml'], [5, '1.4 ml']]);   // 2 h apart → R0 red
  await expect(card.locator('.fe-dose-next')).toContainText('Give no more paracetamol for now');
  await expect(card.locator('.fe-load--red')).toContainText('Call your doctor today');
  const r = await page.evaluate(() => {
    const w: any = window;
    return { load: w.computeParacetamolLoadAlerts(), fever: (w.computeFeverAlerts() || []).map((a: any) => a.body).join(' | '), verdict: w.getParacetamolNextDose().verdict };
  });
  expect(r.verdict).toBe('hold');
  expect(r.load[0].title).toBe('Paracetamol: call your doctor today');
  expect(r.fever).not.toContain('safe to give');
});

test('a calm day still lets the card say "can be given now" after the gap', async ({ page }) => {
  const card = await seed(page, [[40, 9.2], [3, 9.5]], [[9, '1.2 ml'], [5, '1.2 ml']]);
  await expect(card.locator('.fe-dose-next')).toContainText('Next dose can be given now');
  await expect(card.locator('.fe-load')).toHaveCount(0);
  await expect(card).toContainText('Last 24 h: 2 doses, 240');
});

test('a fever past 48 h folds the paracetamol into the call-your-doctor line', async ({ page }) => {
  await seed(page, [[40, 9.2], [3, 9.5]], [[9, '1.2 ml'], [5, '1.2 ml']]);
  const esc = await page.evaluate(() => (window as any)._computeFeverEscalations(_feverEpisodes[0]).map((e: any) => e.text).join(' | '));
  expect(esc).toContain('Tell them about the paracetamol: 2 doses, 240');
});

test('R2 shows on the vomiting card too, and its chips log the answer onto the fever episode', async ({ page }) => {
  const doses: [number, string][] = []; for (let h = 86; h >= 0; h -= 6) doses.push([h, '1.5 ml']);   // 150 mg every 6 h on 9.5 kg
  await seed(page, [[40, 9.2], [3, 9.5]], doses, { confirmLatest: true });
  await page.evaluate(() => { _vomitingEpisodes = [{ id: 'vo-x', status: 'active', startedAt: new Date().toISOString(), resolvedAt: null, episodes: [], fluids: [], wetDiapers: [], actions: [] }]; (window as any).renderVomitingEpisodeCard(); });
  await expect(page.locator('#vomitingEpisodeCard')).toContainText('Has she been sick or had tummy pain?');
  await page.locator('#feverEpisodeCard [data-action="feLogGiSign"][data-arg="Tummy pain"]').click();
  await expect(page.locator('#feverEpisodeCard .fe-load--now')).toContainText('may need a blood test');
});

test('"{wt} kg is right" on the weight question is a retype that makes the latest weight the reference', async ({ page }) => {
  const card = await seed(page, [[40, 9.5], [3, 12.0]], [[20, '1.5 ml'], [14, '1.5 ml'], [8, '1.5 ml'], [2, '1.5 ml']], { confirmLatest: false });
  // The newest weight jumped, so the chip asks too; confirm it there first (that is the 4a flow), then the load asks.
  await page.evaluate(() => { const l = growthData[growthData.length - 1]; growthConfirm = {}; });
  const wq = await page.evaluate(() => (window as any).getParacetamolLoad().rules.some((r: any) => r.weightQ));
  expect(wq).toBe(true);
  await card.locator('#feLoadRetype').fill('12');
  await card.locator('[data-action="feConfirmLoadWeight"]').click();
  const after = await page.evaluate(() => ({ ref: (window as any)._paraRefWeight().w, wq: (window as any).getParacetamolLoad().rules.some((r: any) => r.weightQ) }));
  expect(after).toEqual({ ref: 12, wq: false });
});
