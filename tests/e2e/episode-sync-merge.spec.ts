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
  expect(r.note).toContain('Marked better on');
});
