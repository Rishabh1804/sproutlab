import { test, expect, type Page } from '@playwright/test';
declare const KEYS: any;
declare let _syncUser: any; declare let _syncShadow: any; declare let _feverEpisodes: any; declare let _diarrhoeaEpisodes: any;

// #161 PR 3 — illness-episode sync (spec docs/specs/paracetamol-weight-check-v1.md §5A). The one merge
// (_epMergeLists) both phones run on receive and on push; the receive reassigns the module arrays; edit
// sheets commit to the live entry by id; every episodes write is a transaction; a joining phone takes the
// household's copy. QA chain canon-cc-008: Carina (sync.js), Kael (intelligence-illness.js), Maren
// (consequence), Vela (cards on receive).

async function gotoApp(page: Page) {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any)._epMergeLists === 'function' && typeof (window as any)._syncHandleSingleDocSnapshot === 'function', null, { timeout: 15_000 });
}
// In-page helpers: a fever episode and entries with explicit ids/times.
const H = `
  window.__iso = (h) => new Date(Date.UTC(2026, 10, 1, 0, 0) + h * 3600000).toISOString();
  window.__fe = (id, startH, extra) => Object.assign({ id, status: 'active', startedAt: __iso(startH), resolvedAt: null, readings: [], doses: [], actions: [], peakTemp: 0, triggerSource: 't', notes: '', resolvedNotes: '' }, extra || {});
  window.__S = (x) => window._epStable(x);
`;
async function setup(page: Page) { await gotoApp(page); await page.evaluate(H); }

test('commutative and idempotent on a mixed pair of phones', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = [w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }], doses: [{ id: 'd1', time: w.__iso(1), medicine: 'Paracetamol', dose: '1.0 ml' }] })];
    const B = [w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'r2', time: w.__iso(2), temp: 102 }], doses: [{ id: 'd2', time: w.__iso(3), medicine: 'Paracetamol', dose: '1.2 ml' }] })];
    const ab = w._epMergeLists('fever', A, B, Date.UTC(2026, 10, 1, 6)), ba = w._epMergeLists('fever', B, A, Date.UTC(2026, 10, 1, 6));
    const again = w._epMergeLists('fever', ab, B, Date.UTC(2026, 10, 1, 6));
    return { same: w.__S(ab) === w.__S(ba), idem: w.__S(again) === w.__S(ab), doses: ab[0].doses.map((d: any) => d.id), readings: ab[0].readings.length, peak: ab[0].peakTemp };
  });
  expect(r).toEqual({ same: true, idem: true, doses: ['d1', 'd2'], readings: 2, peak: 102 });
});

test('two fevers started offline fold into one active episode, the same on both phones', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = [w.__fe('fe-a', 0, { readings: [{ id: 'ra', time: w.__iso(0), temp: 101 }] })];
    const B = [w.__fe('fe-b', 1, { readings: [{ id: 'rb', time: w.__iso(1), temp: 102 }], doses: [{ id: 'db', time: w.__iso(1.5), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const ab = w._epMergeLists('fever', A, B), ba = w._epMergeLists('fever', B, A);
    const stale = w._epMergeLists('fever', ab, B);   // the other phone's stale copy can't bring fe-b back
    return { n: ab.length, id: ab[0].id, absorbed: ab[0].absorbed, readings: ab[0].readings.map((x: any) => x.id), doses: ab[0].doses.length, same: w.__S(ab) === w.__S(ba), staleN: stale.length };
  });
  expect(r).toEqual({ n: 1, id: 'fe-a', absorbed: ['fe-b'], readings: ['ra', 'rb'], doses: 1, same: true, staleN: 1 });
});

test('a resolve meets a late reading: ≥ 99°F reopens (recorded), a normal reading does not', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const resolved = w.__fe('fe-1', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), resolvedNotes: 'better', readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }] });
    const hot = w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'r2', time: w.__iso(6), temp: 100.6 }] });
    const ok = w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'r3', time: w.__iso(6), temp: 98.6 }] });
    const m1 = w._epMergeLists('fever', [resolved], [hot])[0], m2 = w._epMergeLists('fever', [resolved], [ok])[0];
    return { reopened: m1.status, sup: (m1.resolveSuperseded || []).map((x: any) => x.resolvedNotes), stays: m2.status, keepsLate: m2.readings.length };
  });
  expect(r).toEqual({ reopened: 'active', sup: ['better'], stays: 'resolved', keepsLate: 2 });
});

test("Maren's reopen rules: soft stool and spit-up don't reopen; a formed stool with blood does", async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const de = (stool: any) => [{ id: 'de-1', status: 'resolved', startedAt: w.__iso(0), resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), stools: [stool], fluids: [], wetDiapers: [], actions: [] }];
    const vo = (type: string) => [{ id: 'vo-1', status: 'resolved', startedAt: w.__iso(0), resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), episodes: [{ id: 'v1', time: w.__iso(7), type }], fluids: [], wetDiapers: [], actions: [] }];
    return {
      soft: w._epMergeLists('diarrhoea', de({ id: 's1', time: w.__iso(7), consistency: 'soft' }), [])[0].status,
      blood: w._epMergeLists('diarrhoea', de({ id: 's1', time: w.__iso(7), consistency: 'normal', blood: true }), [])[0].status,
      watery: w._epMergeLists('diarrhoea', de({ id: 's1', time: w.__iso(7), consistency: 'watery' }), [])[0].status,
      spit: w._epMergeLists('vomiting', vo('spit-up'), [])[0].status,
      bile: w._epMergeLists('vomiting', vo('bile'), [])[0].status,
    };
  });
  expect(r).toEqual({ soft: 'resolved', blood: 'active', watery: 'active', spit: 'resolved', bile: 'active' });
});

test('a newer same-kind episode keeps the old one resolved and takes its later entries (V-M-P3-5)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = [w.__fe('fe-old', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }] }),
               w.__fe('fe-new', 10, { readings: [{ id: 'rn', time: w.__iso(10), temp: 100 }] })];
    const B = [w.__fe('fe-old', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'rl', time: w.__iso(11), temp: 101 }] })];
    const m = w._epMergeLists('fever', A, B);
    const old = m.find((e: any) => e.id === 'fe-old'), neu = m.find((e: any) => e.id === 'fe-new');
    return { oldStatus: old.status, newStatus: neu.status, moved: neu.readings.map((x: any) => x.id), actives: m.filter((e: any) => e.status === 'active').length };
  });
  expect(r).toEqual({ oldStatus: 'resolved', newStatus: 'active', moved: ['rn', 'rl'], actives: 1 });
});

test('entries: same-minute entries both kept; an edit wins whole (a removed form stays removed); later action wins over a delete', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const t = w.__iso(2);
    const sameMin = w._epMergeLists('fever', [w.__fe('fe-1', 0, { readings: [{ id: 'a', time: t, temp: 101 }] })], [w.__fe('fe-1', 0, { readings: [{ id: 'b', time: t, temp: 101 }] })])[0].readings.length;
    const orig = { id: 'd1', time: w.__iso(1), medicine: 'Paracetamol', dose: '5 ml', form: 'syrup120' };
    const edited = { id: 'd1', time: w.__iso(1), medicine: 'Crocin', dose: '5 ml', editedAt: w.__iso(3) };
    const ed = w._epMergeLists('fever', [w.__fe('fe-1', 0, { doses: [orig] })], [w.__fe('fe-1', 0, { doses: [edited] })])[0].doses;
    const delEarly = w.__fe('fe-1', 0, { doses: [], _del: [{ arr: 'doses', id: 'd1', at: w.__iso(2) }] });
    const delLate = w.__fe('fe-1', 0, { doses: [], _del: [{ arr: 'doses', id: 'd1', at: w.__iso(4) }] });
    return {
      sameMin,
      edited: ed.length === 1 && ed[0].medicine === 'Crocin' && !('form' in ed[0]),
      editAfterDelete: w._epMergeLists('fever', [delEarly], [w.__fe('fe-1', 0, { doses: [edited] })])[0].doses.length,
      deleteAfterEdit: w._epMergeLists('fever', [delLate], [w.__fe('fe-1', 0, { doses: [edited] })])[0].doses.length,
      plainDelete: w._epMergeLists('fever', [delEarly], [w.__fe('fe-1', 0, { doses: [orig] })])[0].doses.length,
    };
  });
  expect(r).toEqual({ sameMin: 2, edited: true, editAfterDelete: 1, deleteAfterEdit: 0, plainDelete: 0 });
});

test('cold day logs: one per date, the later wins; entries sorted by time; peakTemp stays finite', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const ce = (log: any) => [{ id: 'ce-1', status: 'active', startedAt: w.__iso(0), resolvedAt: null, dailyLogs: [log], actions: [] }];
    const logs = w._epMergeLists('cold', ce({ date: '2026-11-01', time: w.__iso(1), symptoms: ['Cough'], severity: 3 }), ce({ date: '2026-11-01', time: w.__iso(2), symptoms: [], severity: 2 }))[0].dailyLogs;
    const order = w._epMergeLists('fever', [w.__fe('fe-1', 0, { readings: [{ id: 'x', time: w.__iso(3), temp: 104.5 }] })], [w.__fe('fe-1', 0, { readings: [{ id: 'y', time: w.__iso(2), temp: 99.5 }] })])[0].readings;
    const noReadings = w._epMergeLists('fever', [w.__fe('fe-1', 0, { peakTemp: 101.2 })], [])[0].peakTemp;
    return { logs: logs.length + ':' + logs[0].severity, latest: order[order.length - 1].temp, noReadings };
  });
  expect(r).toEqual({ logs: '1:2', latest: 104.5, noReadings: 101.2 });
});

test('prune: 20 kept — every active, and a fever episode holding a recent dose is kept', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const now = Date.UTC(2026, 10, 30, 12);
    const list = [];
    for (let i = 0; i < 21; i++) list.push(w.__fe('fe-' + String(i).padStart(2, '0'), i * 24, { status: 'resolved', resolvedAt: w.__iso(i * 24 + 5), resolvedUpdatedAt: w.__iso(i * 24 + 5) }));
    list[0].doses = [{ id: 'd', time: new Date(now - 2 * 3600000).toISOString(), medicine: 'Paracetamol', dose: '1 ml' }];
    // _epPrune directly: through the merge, a dose logged after fe-00's resolve moves to the newer episode (V-M-P3-5).
    const kept = w._epPrune('fever', list, now);
    return { n: kept.length, keepsOld: kept.some((e: any) => e.id === 'fe-00'), dropped: kept.some((e: any) => e.id === 'fe-01') };
  });
  expect(r).toEqual({ n: 20, keepsOld: true, dropped: false });
});

test('legacy entries without ids get the same ids on both phones', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const legacy = () => [w.__fe('fe-1', 0, { readings: [{ time: w.__iso(1), temp: 101 }, { time: w.__iso(1), temp: 100.5 }], doses: [{ time: w.__iso(2), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const m = w._epMergeLists('fever', legacy(), legacy());
    return { readings: m[0].readings.length, doses: m[0].doses.length, ids: m[0].readings.every((x: any) => String(x.id).indexOf('L:readings:') === 0) };
  });
  expect(r).toEqual({ readings: 2, doses: 1, ids: true });
});

test('receive: the other phone\'s dose lands in the live module array (no reload) and the merge is saved', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    const mine = [w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }] })];
    w.save(KEYS.feverEpisodes, mine); _feverEpisodes = JSON.parse(JSON.stringify(mine));
    localStorage.removeItem('sl_sync_dirty');
    const remote = [w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }], doses: [{ id: 'dB', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const doc = { exists: true, metadata: { hasPendingWrites: false }, data: () => ({ [KEYS.feverEpisodes]: remote }) };
    w._syncHandleSingleDocSnapshot('episodes', doc);
    const active = w.getActiveFeverEpisode();
    return { liveDose: active && active.doses.map((d: any) => d.id), stored: JSON.parse(localStorage.getItem(KEYS.feverEpisodes) || '[]')[0].doses.length };
  });
  expect(r).toEqual({ liveDose: ['dB'], stored: 1 });
});

test('an edit sheet commits to the live entry by id after a receive reorders the array', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const ep = w.__fe('fe-1', 0, { doses: [{ id: 'dA', time: w.__iso(2), medicine: 'Paracetamol', dose: '1 ml' }] });
    _feverEpisodes = [ep];
    w.feEditDose('dA');   // opens the sheet on dA
    // A receive arrives: an earlier dose from the other phone now sits before dA.
    _feverEpisodes = [w.__fe('fe-1', 0, { doses: [{ id: 'dB', time: w.__iso(1), medicine: 'Paracetamol', dose: '9 ml' }, { id: 'dA', time: w.__iso(2), medicine: 'Paracetamol', dose: '1 ml' }] })];
    (document.getElementById('epEdit_dose') as HTMLInputElement).value = '1.2 ml';
    (document.getElementById('epEditSave') as HTMLElement).click();
    const d = _feverEpisodes[0].doses;
    return { dA: d.find((x: any) => x.id === 'dA').dose, dB: d.find((x: any) => x.id === 'dB').dose, edited: !!d.find((x: any) => x.id === 'dA').editedAt };
  });
  expect(r).toEqual({ dA: '1.2 ml', dB: '9 ml', edited: true });
});

test('a delete leaves a tombstone; a deleted-elsewhere entry shows the "changed on the other phone" path', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    _feverEpisodes = [w.__fe('fe-1', 0, { doses: [{ id: 'dA', time: w.__iso(2), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const ep = _feverEpisodes[0];
    w._epTombstone(ep, 'doses', 0); ep.doses.splice(0, 1);
    const tomb = ep._del.map((t: any) => t.arr + ':' + t.id);
    return { tomb, gone: w._epLive('fever', 'fe-1', 'doses', 'dA') === null, msg: (0, eval)('_EP_GONE') };
  });
  expect(r.tomb).toEqual(['doses:dA']);
  expect(r.gone).toBe(true);
  expect(r.msg).toContain('other phone');
});

test('push: an episodes flush is a transaction that merges against the server copy', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(async () => {
    const w: any = window;
    const cloud = { [KEYS.feverEpisodes]: [w.__fe('fe-1', 0, { doses: [{ id: 'dCloud', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })] };
    let written: any = null;
    const hRef = {
      firestore: { runTransaction: async (fn: any) => fn({ get: async () => ({ exists: true, data: () => cloud }), set: (_ref: any, payload: any) => { written = payload; } }) },
      collection: () => ({ doc: () => ({}) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    const local = [w.__fe('fe-1', 0, { doses: [{ id: 'dLocal', time: w.__iso(2), medicine: 'Paracetamol', dose: '1 ml' }] })];
    await w._syncEpisodesTxn(hRef, { [KEYS.feverEpisodes]: local });
    _syncUser = null;
    return { doses: written[KEYS.feverEpisodes][0].doses.map((d: any) => d.id), shadow: _syncShadow[KEYS.feverEpisodes][0].doses.length };
  });
  expect(r).toEqual({ doses: ['dCloud', 'dLocal'], shadow: 2 });
});

test('a joining phone takes the household\'s episodes outright on first receive (no seeding through the merge)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    w._epJoinBegin();
    const mine = [w.__fe('fe-mine', 0)];
    const remote = [w.__fe('fe-house', 5, { status: 'resolved', resolvedAt: w.__iso(9), resolvedUpdatedAt: w.__iso(9) })];
    const first = w._epMergeReceiveFever(remote, mine).map((e: any) => e.id);
    w._epJoinDone(KEYS.feverEpisodes);
    const later = w._epMergeReceiveFever(remote, mine).map((e: any) => e.id);
    return { first, later };
  });
  expect(r).toEqual({ first: ['fe-house'], later: ['fe-mine', 'fe-house'] });
});

test('a merge that throws keeps local — never last-write-wins', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    const mine = [w.__fe('fe-1', 0, { doses: [{ id: 'dMine', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })];
    w.save(KEYS.feverEpisodes, mine); localStorage.removeItem('sl_sync_dirty');
    const real = w._epMergeReceiveFever;
    w._epMergeReceiveFever = () => { throw new Error('boom'); };
    try {
      const doc = { exists: true, metadata: { hasPendingWrites: false }, data: () => ({ [KEYS.feverEpisodes]: [w.__fe('fe-1', 0)] }) };
      w._syncHandleSingleDocSnapshot('episodes', doc);
    } finally { w._epMergeReceiveFever = real; }
    return JSON.parse(localStorage.getItem(KEYS.feverEpisodes) || '[]')[0].doses.length;
  });
  expect(r).toBe(1);
});

test('a reopened episode says it came back (V-M-P3-7); a plain active one does not', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const plain = w._epCameBackHtml(w.__fe('fe-1', 0));
    const resolved = w.__fe('fe-1', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }] });
    const hot = w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'r2', time: w.__iso(6), temp: 100.6 }] });
    const m = w._epMergeLists('fever', [resolved], [hot])[0];
    return { plain, note: w._epCameBackHtml(m) };
  });
  expect(r.plain).toBe('');
  expect(r.note).toContain('open again');
  expect(r.note).toContain('Marked resolved on');
  expect(r.note).toContain('A 100.6\u00b0F reading was logged at');
  expect(r.note).toContain('Mark Resolved');
});

// ── Governor round on #289: each BLOCKING finding has a test that fails without its fix ──

test('tapping a real dose row opens its edit sheet (V-V-289-1 / V-M-289-1 — the dispatcher passes the id)', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    const w: any = window;
    const now = Date.now();
    _feverEpisodes = [w.__fe('fe-tap', 0, { startedAt: new Date(now - 3 * 3600000).toISOString(),
      readings: [{ id: 'r1', time: new Date(now - 3600000).toISOString(), temp: 101 }],
      doses: [{ id: 'mw1doseA', time: new Date(now - 2 * 3600000).toISOString(), medicine: 'Paracetamol', dose: '1.0 ml' }] })];
    w.switchTab('medical');
    w.renderFeverEpisodeCard();
  });
  await page.locator('#feverEpisodeCard .fe-dose-row').first().click();
  await expect(page.locator('#epEditSave')).toBeVisible();
});

test('an entry logged into an absorbed episode after the fold survives in the survivor (V-CA-289-2 / V-M-289-2)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = [w.__fe('fe-a', 0, { readings: [{ id: 'ra', time: w.__iso(0), temp: 101 }] })];
    const B = [w.__fe('fe-b', 1, { readings: [{ id: 'rb', time: w.__iso(1), temp: 102 }], doses: [{ id: 'd1', time: w.__iso(1.2), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const folded = w._epMergeLists('fever', A, B);
    // B logs d2 into its stale fe-b before it sees the fold.
    const B2 = [w.__fe('fe-b', 1, { readings: [{ id: 'rb', time: w.__iso(1), temp: 102 }], doses: [{ id: 'd1', time: w.__iso(1.2), medicine: 'Paracetamol', dose: '1 ml' }, { id: 'd2', time: w.__iso(5), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const m1 = w._epMergeLists('fever', folded, B2), m2 = w._epMergeLists('fever', B2, folded);
    return { n: m1.length, id: m1[0].id, doses: m1[0].doses.map((d: any) => d.id), same: w.__S(m1) === w.__S(m2), idem: w.__S(w._epMergeLists('fever', m1, B2)) === w.__S(m1) };
  });
  expect(r).toEqual({ n: 1, id: 'fe-a', doses: ['d1', 'd2'], same: true, idem: true });
});

test('a red flag logged between the resolve and a newer episode moves to the active card (V-M-289-3)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const vo = (id: string, startH: number, extra: any) => Object.assign({ id, status: 'active', startedAt: w.__iso(startH), resolvedAt: null, episodes: [], fluids: [], wetDiapers: [], actions: [] }, extra);
    const A = [vo('vo-old', 0, { status: 'resolved', resolvedAt: w.__iso(10), resolvedUpdatedAt: w.__iso(10), episodes: [{ id: 'v1', time: w.__iso(1), type: 'normal' }] }),
               vo('vo-new', 13, { episodes: [{ id: 'v3', time: w.__iso(13), type: 'normal' }] })];
    const B = [vo('vo-old', 0, { episodes: [{ id: 'v1', time: w.__iso(1), type: 'normal' }, { id: 'v2', time: w.__iso(10.5), type: 'bile' }] })];
    const m = w._epMergeLists('vomiting', A, B);
    const neu = m.find((e: any) => e.id === 'vo-new'), old = m.find((e: any) => e.id === 'vo-old');
    return { neu: neu.episodes.map((x: any) => x.id), old: old.episodes.map((x: any) => x.id), oldStatus: old.status };
  });
  expect(r).toEqual({ neu: ['v2', 'v3'], old: ['v1'], oldStatus: 'resolved' });
});

test('editing a resolved episode on un-normalized legacy storage never doubles entries (V-CA-289-3 / V-M-289-4)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const legacy = [w.__fe('fe-old', 0, { status: 'resolved', resolvedAt: w.__iso(5), readings: [{ time: w.__iso(0), temp: 101 }], doses: [{ time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }, { time: w.__iso(3), medicine: 'Paracetamol', dose: '1 ml' }] })];
    localStorage.setItem(KEYS.feverEpisodes, JSON.stringify(legacy));
    w.epEditResolved('fever', 'fe-old');
    (document.getElementById('epEditSave') as HTMLElement).click();
    const saved = JSON.parse(localStorage.getItem(KEYS.feverEpisodes) || '[]');
    const merged = w._epMergeLists('fever', saved, legacy);   // the other phone still holds the legacy copy
    return { ids: saved[0].doses.map((d: any) => String(d.id).slice(0, 8)), mergedDoses: merged[0].doses.length };
  });
  expect(r.ids).toEqual(['L:doses:', 'L:doses:']);
  expect(r.mergedDoses).toBe(2);
});

test('conflict copies: deleting one keeps the other, the delete sticks, and re-merging is idempotent (V-CA-289-4/-5, V-M-289-6)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const A = [w.__fe('fe-1', 0, { doses: [{ id: 'd', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })];
    const B = [w.__fe('fe-1', 0, { doses: [{ id: 'd', time: w.__iso(1), medicine: 'Paracetamol', dose: '1.5 ml' }] })];
    const m = w._epMergeLists('fever', A, B);
    const idem = w.__S(w._epMergeLists('fever', m, B)) === w.__S(m) && w.__S(w._epMergeLists('fever', m, A)) === w.__S(m);
    // Delete the second copy (d~1) on this phone; both stale phones still hold their copy.
    const ep = JSON.parse(JSON.stringify(m[0]));
    const i = ep.doses.findIndex((d: any) => d.id === 'd~1');
    const keptDose = ep.doses[1 - i].dose;
    w._epTombstone(ep, 'doses', i); ep.doses.splice(i, 1);
    const afterA = w._epMergeLists('fever', [ep], A)[0].doses, afterB = w._epMergeLists('fever', [ep], B)[0].doses;
    const afterBoth = w._epMergeLists('fever', w._epMergeLists('fever', [ep], A), B)[0].doses;
    return { copies: m[0].doses.map((d: any) => d.id), idem, afterA: afterA.map((d: any) => d.dose), afterB: afterB.map((d: any) => d.dose), afterBoth: afterBoth.map((d: any) => d.dose), keptDose };
  });
  expect(r.copies).toEqual(['d', 'd~1']);
  expect(r.idem).toBe(true);
  expect(r.afterA).toEqual([r.keptDose]);
  expect(r.afterB).toEqual([r.keptDose]);
  expect(r.afterBoth).toEqual([r.keptDose]);
});

test('an offline transaction failure, then a success, leaves the ledger clean so receives apply again (V-CA-289-1)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(async () => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    let fail = true;
    const hRef = {
      firestore: { runTransaction: async (fn: any) => { if (fail) throw new Error('offline'); return fn({ get: async () => ({ exists: false, data: () => ({}) }), set: () => {} }); } },
      collection: () => ({ doc: () => ({}) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    w._syncReady.episodes = true;
    w.save(KEYS.feverEpisodes, [w.__fe('fe-1', 0, { doses: [{ id: 'dX', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })]);
    w._syncFlushSingleDoc(hRef, 'episodes');
    await new Promise(res => setTimeout(res, 50));
    const dirtyAfterFail = !!w._syncIsDirty(KEYS.feverEpisodes);
    fail = false;
    w._syncFlushSingleDoc(hRef, 'episodes');   // nothing new locally: the retry still runs and clears
    await new Promise(res => setTimeout(res, 50));
    const dirtyAfterOk = !!w._syncIsDirty(KEYS.feverEpisodes);
    w._epRetryReset();
    _syncUser = null;
    return { dirtyAfterFail, dirtyAfterOk };
  });
  expect(r).toEqual({ dirtyAfterFail: true, dirtyAfterOk: false });
});

test('a receive whose merge changes nothing saves and renders nothing (V-CA-289-8)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    const mine = [w.__fe('fe-1', 0, { doses: [{ id: 'd1', time: w.__iso(1), medicine: 'Paracetamol', dose: '1 ml' }] })];
    w.save(KEYS.feverEpisodes, mine); _feverEpisodes = w._epNormalize('fever', mine); localStorage.removeItem('sl_sync_dirty');
    // The same record, keys in another order (as Firestore returns maps).
    const reordered = JSON.parse(JSON.stringify(mine)).map((e: any) => { const o: any = {}; Object.keys(e).sort().reverse().forEach(k => o[k] = e[k]); return o; });
    let saves = 0; const real = w.save; w.save = function(k: any, v: any) { if (k === KEYS.feverEpisodes) saves++; return real.apply(this, arguments); };
    try { w._syncHandleSingleDocSnapshot('episodes', { exists: true, metadata: { hasPendingWrites: false }, data: () => ({ [KEYS.feverEpisodes]: reordered }) }); }
    finally { w.save = real; }
    return { saves, dirty: !!w._syncIsDirty(KEYS.feverEpisodes) };
  });
  expect(r).toEqual({ saves: 0, dirty: false });
});

test('legacy ids name an entry alike when the phones hold different same-time sets (V-K-289-6)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const t = w.__iso(1);
    const A = [w.__fe('fe-1', 0, { doses: [{ time: t, medicine: 'Paracetamol', dose: '2 ml' }] })];
    const B = [w.__fe('fe-1', 0, { doses: [{ time: t, medicine: 'Paracetamol', dose: '1 ml' }, { time: t, medicine: 'Paracetamol', dose: '2 ml' }] })];
    return w._epMergeLists('fever', A, B)[0].doses.map((d: any) => d.dose).sort();
  });
  expect(r).toEqual(['1 ml', '2 ml']);
});

test('a delete still applies after the entry moved to a newer episode (V-K-289-5)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const late = { id: 'rl', time: w.__iso(7), temp: 101 };
    // Phone B deletes the late reading on the OLD episode before it has seen the newer one; the merge moves
    // that reading into fe-new, and B's tombstone (kept on fe-old) must still remove it.
    const A = [w.__fe('fe-old', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5) }), w.__fe('fe-new', 10)];
    const bOld = w.__fe('fe-old', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), readings: [late] });
    const C = [w.__fe('fe-old', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), readings: [late] }), w.__fe('fe-new', 10)];
    w._epTombstone(bOld, 'readings', 0); bOld.readings.splice(0, 1);
    const m = w._epMergeLists('fever', w._epMergeLists('fever', A, C), [bOld]);
    return m.map((e: any) => e.id + ':' + e.readings.map((x: any) => x.id).join(','));
  });
  expect(r).toEqual(['fe-old:', 'fe-new:']);
});

test('a delete kills every other version of the entry — edit-then-delete, or an earlier edit elsewhere (V-CA-289-12)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const orig = { id: 'd1', time: w.__iso(1), medicine: 'Paracetamol', dose: '5 ml' };
    const cloud = [w.__fe('fe-1', 0, { doses: [orig] })];
    // This phone corrects the dose, then deletes it, before either reaches the cloud.
    const ep = w.__fe('fe-1', 0, { doses: [Object.assign({}, orig, { dose: '2.5 ml', editedAt: new Date(Date.now() - 1000).toISOString() })] });
    w._epTombstone(ep, 'doses', 0); ep.doses.splice(0, 1);
    const editThenDelete = w._epMergeLists('fever', cloud, [ep])[0].doses.length;
    // The other phone edited earlier; this phone, not having seen it, deletes later.
    const other = [w.__fe('fe-1', 0, { doses: [Object.assign({}, orig, { dose: '4 ml', editedAt: new Date(Date.now() - 60000).toISOString() })] })];
    const mine = w.__fe('fe-1', 0, { doses: [orig] });
    w._epTombstone(mine, 'doses', 0); mine.doses.splice(0, 1);
    const earlierEdit = w._epMergeLists('fever', other, [mine])[0].doses.length;
    return { editThenDelete, earlierEdit };
  });
  expect(r).toEqual({ editThenDelete: 0, earlierEdit: 0 });
});

test('the came-back note does not name a reading that was since corrected (V-V-289-7)', async ({ page }) => {
  await setup(page);
  const note = await page.evaluate(() => {
    const w: any = window;
    const resolved = w.__fe('fe-1', 0, { status: 'resolved', resolvedAt: w.__iso(5), resolvedUpdatedAt: w.__iso(5), readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }] });
    const hot = w.__fe('fe-1', 0, { readings: [{ id: 'r1', time: w.__iso(0), temp: 101 }, { id: 'r2', time: w.__iso(6), temp: 101.2 }] });
    const m = w._epMergeLists('fever', [resolved], [hot])[0];
    m.readings.find((x: any) => x.id === 'r2').temp = 98.6;   // the typo, corrected
    return w._epCameBackHtml(m);
  });
  expect(note).toContain('since been changed or removed');
  expect(note).not.toContain('98.6');
});

test('a key whose merge throws is left out of the transaction and stays unsynced (V-CA-289-13)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(async () => {
    const w: any = window;
    localStorage.setItem('sl_sync_seeded', '4'); localStorage.removeItem('sl_sync_dirty');
    let written: any = null;
    const hRef = {
      firestore: { runTransaction: async (fn: any) => fn({ get: async () => ({ exists: false, data: () => ({}) }), set: (_r: any, p: any) => { written = p; } }) },
      collection: () => ({ doc: () => ({}) }),
    };
    _syncUser = { uid: 't', displayName: 'T' };
    w._syncReady.episodes = true;
    w.save(KEYS.feverEpisodes, [w.__fe('fe-1', 0)]);
    w.save(KEYS.coldEpisodes, [{ id: 'ce-1', status: 'active', startedAt: w.__iso(0), dailyLogs: [], actions: [] }]);
    const real = w._epMergeLists;
    w._epMergeLists = function(kind: string) { if (kind === 'cold') throw new Error('corrupt'); return real.apply(this, arguments); };
    try { w._syncFlushSingleDoc(hRef, 'episodes'); await new Promise(res => setTimeout(res, 50)); }
    finally { w._epMergeLists = real; w._epRetryReset(); _syncUser = null; }
    return { feverWritten: !!(written && written[KEYS.feverEpisodes]), coldWritten: !!(written && written[KEYS.coldEpisodes]),
      feverDirty: !!w._syncIsDirty(KEYS.feverEpisodes), coldDirty: !!w._syncIsDirty(KEYS.coldEpisodes) };
  });
  expect(r).toEqual({ feverWritten: true, coldWritten: false, feverDirty: false, coldDirty: true });
});

test('an end time edited earlier keeps the doses logged before Resolve was pressed, even when a newer episode exists (Cipher A1)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    // Oct-1 fever: last reading 06:30, dose 07:30, Resolve pressed at 09:00, end later edited back to 07:00.
    const old = w.__fe('fe-1', 0, { status: 'resolved', resolvedAt: w.__iso(7), resolvedAtOriginal: w.__iso(9), resolvedEditedAt: w.__iso(30), resolvedUpdatedAt: w.__iso(30),
      readings: [{ id: 'r1', time: w.__iso(6.5), temp: 101 }], doses: [{ id: 'd1', time: w.__iso(7.5), medicine: 'Paracetamol', dose: '1 ml' }] });
    const neu = w.__fe('fe-2', 19 * 24, { readings: [{ id: 'r2', time: w.__iso(19 * 24), temp: 100.5 }] });
    const m1 = w._epMergeLists('fever', [old], [neu]), m2 = w._epMergeLists('fever', [neu], [old]);
    const f = (m: any[], id: string) => m.find((e: any) => e.id === id).doses.map((d: any) => d.id);
    return { old: f(m1, 'fe-1'), neu: f(m1, 'fe-2'), same: w.__S(m1) === w.__S(m2), idem: w.__S(w._epMergeLists('fever', m1, [old])) === w.__S(m1) };
  });
  expect(r).toEqual({ old: ['d1'], neu: [], same: true, idem: true });
});

test('a late red flag between an edited end and the Resolve press still reaches the active card (V-M-289-16)', async ({ page }) => {
  await setup(page);
  const r = await page.evaluate(() => {
    const w: any = window;
    const vo = (id: string, startH: number, extra: any) => Object.assign({ id, status: 'active', startedAt: w.__iso(startH), resolvedAt: null, episodes: [], fluids: [], wetDiapers: [], actions: [] }, extra);
    // Resolve pressed at 10:00, end edited to 08:00; an offline phone's 09:00 bile vomit and 09:00 fluid arrive later.
    const A = [vo('vo-1', 0, { status: 'resolved', resolvedAt: w.__iso(8), resolvedAtOriginal: w.__iso(10), resolvedUpdatedAt: w.__iso(11), episodes: [{ id: 'v1', time: w.__iso(1), type: 'normal' }] }),
               vo('vo-2', 13, { episodes: [{ id: 'v3', time: w.__iso(13), type: 'normal' }] })];
    const B = [vo('vo-1', 0, { episodes: [{ id: 'v1', time: w.__iso(1), type: 'normal' }, { id: 'v2', time: w.__iso(9), type: 'bile' }], fluids: [{ id: 'f1', time: w.__iso(9), type: 'ORS' }] })];
    const m = w._epMergeLists('vomiting', A, B), m2 = w._epMergeLists('vomiting', B, A);
    const g = (id: string, arr: string) => m.find((e: any) => e.id === id)[arr].map((x: any) => x.id);
    return { neuVomits: g('vo-2', 'episodes'), oldFluids: g('vo-1', 'fluids'), same: w.__S(m) === w.__S(m2) };
  });
  expect(r).toEqual({ neuVomits: ['v2', 'v3'], oldFluids: ['f1'], same: true });
});
