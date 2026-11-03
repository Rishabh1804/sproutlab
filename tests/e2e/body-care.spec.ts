import { test, expect } from '@playwright/test';
declare let profile: any; declare let _feverEpisodes: any[]; declare const BODY_CARE_GUIDANCE: any[]; declare const GENERAL_EMERGENCIES: any[];

// child-sex S3 — Medical → Body care card + sex-filtered emergency routing
// (docs/specs/child-sex-v1.md §4; sources docs/specs/care-guidance-s3-sources.md).
// Fixture child (tests/e2e/fixtures/storage.json): an invented girl, born 2025-09-01 (HR-13).
// Hermetic (?nosync). QA chain: Maren (content + medical.js), Vela (cards.js render),
// Carina (config.js registry + core.js wiring), Kael (fever hint in intelligence-illness.js).

const GIRL_IDS = ['wiping-washing', 'labial-adhesion', 'newborn-discharge'];
const BOY_IDS = ['foreskin-care', 'circumcision-care', 'undescended-testes', 'hydrocele', 'testicular-torsion', 'nappy-boys'];

async function openBodyCare(page: any, sex?: 'm') {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).renderBodyCare === 'function' && typeof (window as any)._profSave === 'function', null, { timeout: 15_000 });
  // init defers a switchTab(savedTab); let it land before we move to Track → Medical.
  await page.waitForTimeout(600);
  await page.evaluate((s: string | undefined) => {
    const w = window as any;
    if (s) w._profSave(Object.assign({}, profile.child, { sex: s }), profile.place);
    w.switchTab('track'); w.switchTrackSub('medical');
    w.renderBodyCare();
  }, sex);
  const card = page.locator('#medBodyCareCard');
  await expect(card).toBeVisible();
  return card;
}

async function renderedIds(card: any): Promise<string[]> {
  return card.locator('.bc-entry').evaluateAll((els: Element[]) => els.map(e => e.getAttribute('data-bc-id') || ''));
}

test.describe('child-sex S3: Body care card', () => {
  test('every registry entry is cited, in range and neutral (no pronoun on load-time copy)', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof BODY_CARE_GUIDANCE !== 'undefined', null, { timeout: 15_000 });
    const bad = await page.evaluate(() => BODY_CARE_GUIDANCE.filter((e: any) =>
      !['f', 'm', 'both'].includes(e.sex) || !(e.ageMinMo >= 0 && e.ageMaxMo <= 24 && e.ageMinMo <= e.ageMaxMo)
      || !Array.isArray(e.sources) || e.sources.length === 0
      || e.sources.some((s: any) => !s.org || !s.title || !/^https:\/\//.test(s.url))
      || /\b(she|her|hers|herself|he|him|his|himself)\b/i.test([e.title].concat(e.points, e.seeDoctorIf, e.emergencyIf).join(' '))
    ).map((e: any) => e.id));
    expect(bad).toEqual([]);
  });

  test('a girl sees the girls’ and shared entries, never a boys’ entry or torsion', async ({ page }) => {
    const card = await openBodyCare(page);
    await expect(card).toBeVisible();
    await expect(card.locator('.bc-intro')).toContainText('girls');
    const ids = await renderedIds(card);
    expect(ids).toContain('wiping-washing');
    expect(ids).toContain('labial-adhesion');
    expect(ids).toContain('inguinal-hernia');
    expect(ids).toContain('fever-uti');
    expect(ids).not.toContain('newborn-discharge');            // 0–1 m only; the fixture is ~14 m
    for (const b of BOY_IDS) expect(ids).not.toContain(b);
    await expect(card).not.toContainText(/torsion|testis|testes|foreskin|circumcis(ed|ion) care/i);
  });

  test('a boy sees the boys’ and shared entries, never a girls’ entry', async ({ page }) => {
    const card = await openBodyCare(page, 'm');
    await expect(card.locator('.bc-intro')).toContainText('boys');
    const ids = await renderedIds(card);
    for (const b of BOY_IDS) expect(ids).toContain(b);
    expect(ids).toContain('inguinal-hernia');
    for (const g of GIRL_IDS) expect(ids).not.toContain(g);
    await expect(card).not.toContainText(/vagina|labia stuck/i);
  });

  test('every rendered entry shows at least one source link, and opens to its detail', async ({ page }) => {
    for (const sex of [undefined, 'm'] as const) {
      const card = await openBodyCare(page, sex);
      const entries = card.locator('.bc-entry');
      const n = await entries.count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) {
        const links = entries.nth(i).locator('.bc-src-link');
        expect(await links.count()).toBeGreaterThan(0);
        await expect(links.first()).toHaveAttribute('target', '_blank');
        await expect(links.first()).toHaveAttribute('href', /^https:\/\//);
      }
      const first = entries.first();
      await first.locator('.bc-summary').click();
      await expect(first.locator('.bc-points li').first()).toBeVisible();
      await expect(first.locator('.bc-src')).toBeVisible();
    }
  });
});

test.describe('child-sex S3: emergency routing', () => {
  test('torsion and stuck hernia are in GENERAL_EMERGENCIES with the full schema', async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof GENERAL_EMERGENCIES !== 'undefined', null, { timeout: 15_000 });
    const r = await page.evaluate(() => ['testicular-torsion', 'stuck-hernia'].map(id => {
      const e = GENERAL_EMERGENCIES.find((x: any) => x.id === id);
      return e && { id: e.id, sex: e.sex || null, src: !!e.source, steps: e.immediate.length > 0, doc: !!(e.doc && e.doc.forTeam), teaser: !!e.teaser };
    }));
    expect(r).toEqual([
      { id: 'testicular-torsion', sex: 'm', src: true, steps: true, doc: true, teaser: true },
      { id: 'stuck-hernia', sex: null, src: true, steps: true, doc: true, teaser: true },
    ]);
  });

  test('the General Emergency Room shows torsion to a boy only; the stuck hernia to both', async ({ page }) => {
    const rows = async () => page.evaluate(() => {
      const w = window as any;
      w.openGeneralEmergencyRoom();
      const ids = Array.from(document.querySelectorAll('#geOverlay .ge-row')).map(b => b.getAttribute('data-arg'));
      w._geClose();
      return ids;
    });
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any).openGeneralEmergencyRoom === 'function', null, { timeout: 15_000 });
    const girl = await rows();
    expect(girl).toContain('stuck-hernia');
    expect(girl).not.toContain('testicular-torsion');
    // A direct open by id is refused for a girl too.
    const direct = await page.evaluate(() => { (window as any)._geShowCard('testicular-torsion'); const ov = document.getElementById('geCardOv'); return ov ? ov.textContent : ''; });
    expect(direct || '').not.toMatch(/scrotum|torsion/i);
    await page.evaluate(() => { const w = window as any; w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place); });
    const boy = await rows();
    expect(boy).toContain('testicular-torsion');
    expect(boy).toContain('stuck-hernia');
  });
});

test('child-sex S3: the fever card carries the one-line urine-test hint under 2', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).renderFeverEpisodeCard === 'function', null, { timeout: 15_000 });
  await page.waitForTimeout(600);
  const text = await page.evaluate(() => {
    const w = window as any;
    const t = new Date(Date.now() - 3600000).toISOString();
    _feverEpisodes = [{ id: 'fe-s3', status: 'active', startedAt: t, resolvedAt: null, readings: [{ temp: 100.4, time: t, notes: '' }],
      doses: [], actions: [], peakTemp: 100.4, triggerSource: 'test', notes: '', resolvedNotes: '' }];
    w.switchTab('track'); w.switchTrackSub('medical'); w.renderFeverEpisodeCard();
    return (document.querySelector('#feverEpisodeCard .fe-guidance') || {} as any).textContent || '';
  });
  expect(text).toContain('urine test');
});

test('child-sex S3: under 3 months the fever entry says same day; the urine-test entry starts at 3 months (V-M-282-2)', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).bodyCareEntriesFor === 'function', null, { timeout: 15_000 });
  const r = await page.evaluate(() => {
    const w = window as any;
    const ids = (mo: number) => w.bodyCareEntriesFor('f', mo).map((e: any) => e.id);
    const young = w.bodyCareEntriesFor('f', 1).find((e: any) => e.id === 'fever-young-baby');
    return { at0: ids(0), at2: ids(2), at3: ids(3), youngLine: young ? young.seeDoctorIf[0] : '' };
  });
  for (const k of ['at0', 'at2'] as const) { expect(r[k]).toContain('fever-young-baby'); expect(r[k]).not.toContain('fever-uti'); }
  expect(r.at3).toContain('fever-uti');
  expect(r.at3).not.toContain('fever-young-baby');
  expect(r.youngLine).toMatch(/38°C \(100\.4°F\) or more .*same day/);
});
