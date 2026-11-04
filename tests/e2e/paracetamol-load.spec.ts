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
    return { tier: r.tier, check: r.check, under: r.under, none: !!r.none, stop: r.stop, until: r.untilText || '', rules: r.rules.map((x: any) => x.rule + ':' + x.tier), text: r.rules.map((x: any) => x.lines.join(' ')).join(' | '), gi: r.rules.some((x: any) => x.giChips), wq: r.rules.some((x: any) => x.weightQ), extra: r.extra || '' };
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
  expect(close.text).toContain('The dose at TIME was 2\u00a0h 0\u00a0min after the one before');
  expect(close.until).toBe('Give no more paracetamol until TIME.');
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
  expect(amber.until).toContain('Give no more paracetamol until');
  const now = await load(page, { doses: [[20, 180], [14, 180], [8, 180], [2, 180]] });
  expect(now.tier).toBe('now');
  const bottle = await load(page, { doses: [[20, 120, 500], [14, 120, 500], [8, 120, 500], [2, 120, 500]] });
  expect(bottle.check).toBe(true);
  expect(bottle.tier).toBe('amber');
  expect(bottle.text).toContain('Check the bottle\'s label, then tap each dose above and write the mg given');
});

test('R1 weight question: the doses fit the newest weight but not the reference weight → check, never "safe"', async ({ page }) => {
  await boot(page);
  const r = await load(page, { wDose: 12, wRef: { w: 9.5, src: { date: '2026-10-01', wt: 9.4 } }, doses: [[20, 150], [14, 150], [8, 150], [2, 150]] });
  expect(r.wq).toBe(true);
  expect(r.check).toBe(true);
  expect(r.text).toContain('These doses fit her newest weight, 12 kg');
  expect(r.text).toContain('weigh-in on DATE (9.4\u00a0kg) suggests less');
});

test('R2: over the day\'s most for more than 48 h — call-now with a GI sign, amber with the question without one, amber "maybe" on unreadable amounts', async ({ page }) => {
  await boot(page);
  const doses = []; for (let h = 86; h >= 0; h -= 6) doses.push([h, 150]);
  const noGi = await load(page, { doses });
  expect(noGi.rules).toContain('R2:amber');
  expect(noGi.gi).toBe(true);
  expect(noGi.text).toContain('Has she vomited, retched, or had tummy pain?');
  expect(noGi.check).toBe(true);
  expect(noGi.text).toContain('won\'t eat and won\'t drink, even breastfeeds or milk');
  expect(noGi.text).toContain('check the whites of the eyes');
  const gi = await load(page, { doses, gi: true });
  expect(gi.tier).toBe('now');
  expect(gi.text).toContain('She may need a blood test');
  expect(gi.text).toContain('If you can\'t reach your doctor now, go to the emergency department.');
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
  expect(med.text).toContain('Calpol is on her medicines list');
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
  const card = await seed(page, [[40, 9.2], [3, 9.5]], [[3, '1.4 ml'], [1, '1.4 ml']]);   // 2 h apart, still inside the hold → R0 red
  await expect(card.locator('.fe-dose-next')).toContainText('Give no more paracetamol for now');
  await expect(card.locator('.fe-load--red')).toContainText('Call your doctor today');
  const r = await page.evaluate(() => {
    const w: any = window;
    return { load: w.computeParacetamolLoadAlerts(), fever: (w.computeFeverAlerts() || []).map((a: any) => a.body).join(' | '), verdict: w.getParacetamolNextDose().verdict };
  });
  expect(r.verdict).toBe('hold');
  expect(r.load[0].title).toBe('Paracetamol: call your doctor today');
  expect(r.load[0].severity).toBe('action');
  expect(r.fever).not.toContain('safe to give');
  await expect(card.locator('.fe-para-dose')).toHaveCount(0);
  await expect(card).toContainText('The dose is hidden while the box above says to stop');
  // What Home actually shows, not just what the producer returns (Carina V-CA-291-1).
  const home = await page.evaluate(() => { const w: any = window; w.switchTab('home'); w.renderHomeContextAlerts(); return document.body.innerText; });
  expect(home).toContain('Paracetamol: call your doctor today');
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
  await expect(page.locator('#vomitingEpisodeCard')).toContainText('Has she vomited, retched, or had tummy pain?');
  await page.locator('#feverEpisodeCard [data-action="feLogGiSign"][data-arg="Tummy pain"]').click();
  await expect(page.locator('#feverEpisodeCard .fe-load--now')).toContainText('may need a blood test');
});


test('"{wt} kg is right" on the weight question is a retype that makes the latest weight the reference', async ({ page }) => {
  const card = await seed(page, [[40, 11.0], [3, 11.6]], []);   // a believable gain: the chip doses, W_ref sits a little lower
  const setup = await page.evaluate(() => {
    const w: any = window;
    const ref = w._paraRefWeight().w, mg = Math.round(15 * (ref + 11.6) / 2);   // four doses: over 60 mg/kg on W_ref, under on 11.6 kg
    const now = Date.now();
    _feverEpisodes[0].doses = [20, 14, 8, 2].map((h, i) => ({ id: 'dq' + i, time: new Date(now - h * 3600000).toISOString(), medicine: 'Paracetamol', dose: mg + ' mg' }));
    w.renderFeverEpisodeCard();
    return { ref, chip: w.getParacetamolChip(w.getLatestWeight()).state, wq: w.getParacetamolLoad().rules.some((r: any) => r.weightQ) };
  });
  expect(setup.chip).not.toBe('confirm');
  expect(setup.ref).toBeLessThan(11.6);
  expect(setup.wq).toBe(true);
  await card.locator('#feLoadRetype').fill('11,6');
  await card.locator('[data-action="feConfirmLoadWeight"]').click();
  const after = await page.evaluate(() => ({ ref: (window as any)._paraRefWeight().w, wq: (window as any).getParacetamolLoad().rules.some((r: any) => r.weightQ) }));
  expect(after).toEqual({ ref: 11.6, wq: false });
});

test('while the chip asks about the weight, the load block points to it and offers no second retype (Kael V-K-291-9a)', async ({ page }) => {
  const card = await seed(page, [[40, 9.5], [3, 12.0]], [[20, '1.5 ml'], [14, '1.5 ml'], [8, '1.5 ml'], [2, '1.5 ml']]);
  await expect(card.locator('.fe-para-confirm')).toHaveCount(1);
  await expect(card.locator('#feLoadRetype')).toHaveCount(0);
});

test('dose text with a label strength reads the amount given, never the first number (Kael V-K-291-2, Maren V-M-291-5)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const m = (dose: string, form?: string) => { const x = w._paraDoseMg({ dose, form }); return [Math.round(x.lo * 100) / 100, Number.isFinite(x.hi) ? Math.round(x.hi * 100) / 100 : 'inf']; };
    return { a: m('5 ml (120 mg/5 ml)', 'syrup120'), b: m('1 ml (100 mg)'), c: m('2.5 ml of 120mg/5ml'), d: m('.8 ml', 'drops100'), e: m('7.5 ml of 250mg/5ml'), f: m('1.5ml drops 100mg/ml'), g: m('2 x 1.5 ml', 'drops100'), h: m('1.2', 'drops100') };
  });
  expect(r).toEqual({ a: [120, 120], b: [100, 100], c: [60, 60], d: [80, 80], e: [375, 375], f: [150, 150], g: [0, 'inf'], h: [1.2, 120] });
});

test('R0 holds only until its own time; after that the facts stay, amber, with no stale "until" (V-K-291-3, V-M-291-3, V-V-291-3)', async ({ page }) => {
  await boot(page);
  const r = await load(page, { doses: [[22, 140], [19, 140]] });
  expect(r.rules).toContain('R0:amber');
  expect(r.tier).toBe('amber');
  expect(r.text).toContain('If you haven\'t yet, call your doctor today');
  expect(r.until).toBe('');
});

test('R0b is split like R1: over only for the reference weight asks about the weight, never red (Architect 2026-11-04)', async ({ page }) => {
  await boot(page);
  const ref = await load(page, { wDose: 10, wRef: { w: 9.7, src: { date: '2026-10-01', wt: 9.4 } }, doses: [[2, 158]] });
  expect(ref.rules).toContain('R0b:amber');
  expect(ref.wq).toBe(true);
  expect(ref.tier).toBe('amber');
  const big = await load(page, { wDose: 10, wRef: { w: 9.7, src: null }, doses: [[8, 170], [2, 170]] });
  expect(big.rules.filter((x: string) => x.startsWith('R0b')).length).toBe(1);
  expect(big.text).toContain('2 doses in the last 24 hours were that big');
});

test('the RCH lines lead with the emergency department, and every call-now line names it as the fallback (Architect 2026-11-04)', async ({ page }) => {
  await boot(page);
  const anz = await load(page, { doses: [[20, 500], [15, 500], [10, 500], [5, 500]] });
  expect(anz.rules).toContain('ANZ:now');
  expect(anz.text).toContain('Go to the emergency department now.');
  expect(anz.stop).toBe(true);
  expect(anz.until).toBe('');
  expect(anz.text).not.toContain('Call your doctor');   // one instruction under the ER lead (V-K-291-4)
  expect(anz.text).toContain('In the last 24 hours: 4 doses');
  const r1 = await load(page, { doses: [[20, 180], [14, 180], [8, 180], [2, 180]] });
  expect(r1.text).toContain('If you can\'t reach your doctor now, go to the emergency department.');
  const two = await load(page, { doses: [[20, 300], [14, 300], [8, 300]] });   // R0b now and R1 now together
  expect(two.rules).toEqual(expect.arrayContaining(['R0b:now', 'R1:now']));
  expect(two.text.split('go to the emergency department').length - 1).toBe(1);
});

test('an amber rule keeps "safe to give" off: the 4th day of paracetamol asks to check (V-K-291-6, V-M-291-2, V-V-291-2)', async ({ page }) => {
  const card = await seed(page, [[40, 9.2], [3, 9.5]], [[72, '1.0 ml'], [48, '1.0 ml'], [24, '1.0 ml'], [6, '1.0 ml']], { confirmLatest: true });
  const r = await page.evaluate(() => { const n = (window as any).getParacetamolNextDose(); return { verdict: n.verdict, safe: n.safe }; });
  expect(r).toEqual({ verdict: 'check', safe: false });
  await expect(card.locator('.fe-dose-next')).not.toContainText('can be given now');
});

test('a weight the chip rejects is no weight for the totals (V-K-291-12, V-M-291-6), and the medicines list is read by brand (V-K-291-10)', async ({ page }) => {
  await seed(page, [[3, 95]], [[20, '5 ml'], [14, '5 ml'], [8, '5 ml'], [2, '5 ml']]);
  const r = await page.evaluate(() => {
    const w: any = window;
    const a = w.getParacetamolLoad();
    (0, eval)("meds = [{ name: 'Fever syrup', brand: 'Calpol', active: true }]");
    const b = w.getParacetamolLoad();
    (0, eval)('meds = []');
    return { weight: a.reasons.indexOf('weight') >= 0, calm: a.tier === 'calm', med: b.rules.some((x: any) => x.rule === 'MED') };
  });
  expect(r).toEqual({ weight: true, calm: false, med: true });
});

test('R2 on a GI card points to the fever card for the weight question (no duplicate retype — Vela V-V-291-4)', async ({ page }) => {
  await boot(page);
  const html = await page.evaluate(() => {
    const w: any = window;
    const load = { rules: [{ rule: 'R2', tier: 'amber', lines: ['x'], weightQ: true }], tier: 'amber' };
    return w._paraLoadHtml(load, 'gi');
  });
  expect(html).toContain('Answer the weight question on the fever card.');
  expect(html).not.toContain('feLoadRetype');
});

test('whoWfaWeightAtZ inverts whoWfaZ, restricted z included, and fails closed (Carina V-CA-291-7)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    let worst = 0;
    for (const sex of ['f', 'm']) for (let mo = 0; mo <= 60; mo += 2.5) for (const wt of [3, 6, 9.5, 14, 22, 30]) {
      const z = w.whoWfaZ(wt, mo, sex); if (!Number.isFinite(z)) continue;
      worst = Math.max(worst, Math.abs(w.whoWfaWeightAtZ(z, mo, sex) - wt));
    }
    return { worst, nan: [w.whoWfaWeightAtZ(0, 12, 'x'), w.whoWfaWeightAtZ(0, 61, 'f'), w.whoWfaWeightAtZ(-40, 12, 'f')].map(Number.isNaN) };
  });
  expect(r.worst).toBeLessThan(1e-6);
  expect(r.nan).toEqual([true, true, true]);
});

test('paracetamol by name: Indian brands and cold syrups count, plain ibuprofen does not (V-M-291-D11, V-K-291-D3)', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const yes = ['Pacimol', 'Paracip 250', 'P-250', 'P 650', 'Febrex Plus', 'Ibugesic Plus', 'Sumo', 'Sinarest syrup', 'paracetmol'].filter(n => !w._paraIsParacetamol(n));
    const no = ['Ibugesic', 'Ibuprofen', 'Meftal-P', 'Caldikind-P NF', 'Zinc'].filter(n => w._paraIsParacetamol(n));
    return { yes, no };
  });
  expect(r).toEqual({ yes: [], no: [] });
});

test('the fallback is said once, on the highest call line; R2 amber\'s conditional call line carries it when alone (V-V-291-17)', async ({ page }) => {
  await boot(page);
  const ER = 'If you can\'t reach your doctor now, go to the emergency department.';
  const d150: number[][] = []; for (let h = 86; h >= 0; h -= 6) d150.push([h, 150]);
  const amber = await load(page, { doses: d150 });
  expect(amber.rules).toContain('R2:amber');
  expect(amber.text.split(ER).length - 1).toBe(1);
  const d180: number[][] = []; for (let h = 86; h >= 0; h -= 6) d180.push([h, 180]);
  const both = await load(page, { doses: d180 });
  expect(both.rules).toEqual(expect.arrayContaining(['R1:now', 'R2:amber']));
  expect(both.text.split(ER).length - 1).toBe(1);
  const r1 = both.text.split(' | ').find((l: string) => l.startsWith('That\'s more paracetamol in 24 hours'));
  expect(r1).toContain(ER);
});

test('Home\'s load alert carries the hold time; a fallback confirm never records while the jump check asks; the hero redraws on a dose receive (V-V-291-12, V-CA-291-11/-13)', async ({ page }) => {
  await seed(page, [[40, 9.2], [3, 9.5]], [[3, '1.4 ml'], [1, '1.4 ml']], { confirmLatest: true });
  const r = await page.evaluate(() => {
    const w: any = window;
    const a = w.computeParacetamolLoadAlerts()[0];
    const deps = (0, eval)('SYNC_RENDER_DEPS');
    const heroes = [KEYS.feverEpisodes, KEYS.vomitingEpisodes, KEYS.diarrhoeaEpisodes].map((k: string) => deps[k].renderers.home.indexOf('renderTodayHero') >= 0);
    (0, eval)("growthData = [{ date: toDateStr(new Date(Date.now() - 40*864e5)), wt: 9.5 }, { date: toDateStr(new Date(Date.now() - 3*864e5)), wt: 16.4 }]; growthConfirm = {};");
    const row = w.getLatestWeight();
    const before = JSON.stringify((0, eval)('growthConfirm'));
    const asking = !!w.gvWeightNeedsConfirm(row);
    const rec = w.gvConfirmRecord(row, null, 'calm');
    return { body: a.body, heroes, asking, rec, same: JSON.stringify((0, eval)('growthConfirm')) === before };
  });
  expect(r.body).toContain('Give no more paracetamol until');
  expect(r.heroes).toEqual([true, true, true]);
  expect(r).toMatchObject({ asking: true, rec: false, same: true });
});
