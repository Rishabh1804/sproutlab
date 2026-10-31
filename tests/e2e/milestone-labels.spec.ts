import { test, expect } from '@playwright/test';
declare let profile: any; declare let milestones: any[]; declare let activityLog: any; declare const KEYS: any; declare const MILESTONE_STANDARDS: any;

// Carina — BUGS.md S2–S4 #5: milestone text is the record key.
// A MILESTONE_STANDARDS row's `text` is frozen (id = slugify(text), stored and matched in synced
// records); the optional `label` is a pronoun-free display title, shown via core.js msLabel().
// Fixture child (tests/e2e/fixtures/storage.json): an invented girl, born 2025-09-01 (HR-13).
// Hermetic (?nosync).

// The nine rows whose record-key text says she/her, with the label each must display and the
// slug each must keep (literal: computed from the frozen text, so a reworded text fails here).
const ROWS: { text: string; label: string; slug: string }[] = [
  { text: 'Understands far more words than she can say', label: 'Understands far more words than can be said', slug: 'understands-far-more-words-than-she-can-say' },
  { text: 'Shows you an object she likes', label: 'Shows you a favourite object', slug: 'shows-you-an-object-she-likes' },
  { text: 'Takes a few steps on her own', label: 'Takes a few steps alone', slug: 'takes-a-few-steps-on-her-own' },
  { text: 'Uses fingers to feed herself some food', label: 'Uses fingers to self-feed some food', slug: 'uses-fingers-to-feed-herself-some-food' },
  { text: 'Wants to do things herself', label: 'Wants to do things alone', slug: 'wants-to-do-things-herself' },
  { text: 'Tries to take off her shoes or socks', label: 'Tries to take off shoes or socks', slug: 'tries-to-take-off-her-shoes-or-socks' },
  { text: 'Feeds herself with her fingers', label: 'Self-feeds with fingers', slug: 'feeds-herself-with-her-fingers' },
  { text: 'Shows pride when she does something new', label: 'Shows pride in doing something new', slug: 'shows-pride-when-she-does-something-new' },
  { text: 'Repeats words she overhears', label: 'Repeats overheard words', slug: 'repeats-words-she-overhears' },
];
const PRONOUN = /\b(she|her|hers|herself)\b/i;

async function boot(page: any) {
  await page.goto('/index.html?nosync');
  await page.waitForFunction(() => typeof (window as any).msLabel === 'function' && typeof (window as any)._profSave === 'function', null, { timeout: 15_000 });
  // init defers a switchTab(savedTab); let it land before we drive the tabs.
  await page.waitForTimeout(600);
}

test.describe('milestone labels: text is the record key, label is the display title', () => {
  test('msLabel maps each pronoun-bearing text to its neutral label (exact and loose lookup)', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate((rows: typeof ROWS) => {
      const w = window as any;
      return rows.map(row => ({ exact: w.msLabel(row.text), loose: w.msLabel('  ' + row.text.toUpperCase() + ' ') }));
    }, ROWS);
    ROWS.forEach((row, i) => {
      expect(r[i].exact, row.text).toBe(row.label);
      expect(r[i].loose, row.text).toBe(row.label);
      expect(r[i].exact, row.text).not.toMatch(PRONOUN);
    });
  });

  test('msLabel falls back to the text for rows without a label and for unknown / empty input', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const w = window as any;
      return { custom: w.msLabel('Waves at the cat'), empty: w.msLabel(''), undef: w.msLabel(undefined) === undefined };
    });
    expect(r).toEqual({ custom: 'Waves at the cat', empty: '', undef: true });
  });

  test('the record keys are unchanged: the rows keep their text and slugify(text) is the same id', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate((rows: typeof ROWS) => {
      const w = window as any;
      const all: any[] = [];
      const std = (MILESTONE_STANDARDS || {}) as any;
      Object.keys(std).forEach(k => Object.keys(std[k] || {}).forEach(b => { if (Array.isArray(std[k][b])) all.push(...std[k][b]); }));
      return rows.map(row => {
        const found = all.find(x => x && x.text === row.text);
        return { present: !!found, label: found ? found.label : null, slug: w.slugify(row.text), byId: w.msLabelById(w.slugify(row.text)) };
      });
    }, ROWS);
    ROWS.forEach((row, i) => {
      expect(r[i].present, 'row text still present: ' + row.text).toBe(true);
      expect(r[i].label).toBe(row.label);
      expect(r[i].slug).toBe(row.slug);
      expect(r[i].byId).toBe(row.label);   // tap evidence keyed by the slug shows the label too
    });
  });

  test('a boy\'s Milestones view shows the labels and never she/her, while the stored records keep the raw text', async ({ page }) => {
    await boot(page);
    // Switch the fixture child to a boy and seed milestone records (and a milestone-tap activity
    // entry) that carry the raw record-key text, then reload so everything renders from boot.
    await page.evaluate((rows: typeof ROWS) => {
      const w = window as any;
      w._profSave(Object.assign({}, profile.child, { sex: 'm' }), profile.place);
      const d = w.today();
      const statuses = ['mastered', 'practicing', 'emerging', 'consistent'];
      rows.forEach((row, i) => {
        if (milestones.some((m: any) => m.text === row.text)) return;
        const status = statuses[i % statuses.length];
        const rec: any = { id: row.slug, text: row.text, status, advanced: false, domain: 'motor', emergingAt: d };
        if (status !== 'emerging') rec.practicingAt = d;
        if (status === 'consistent' || status === 'mastered') rec.consistentAt = d;
        if (status === 'mastered') { rec.masteredAt = d; rec.doneAt = d; }
        else rec.inProgressAt = d;
        milestones.push(rec);
      });
      w.save(KEYS.milestones, milestones);
      // Three tap entries keyed by the slug fallback: enough for the 7-day rollup (threshold 3),
      // so both the per-entry text and the rollup title render.
      if (!activityLog[d]) activityLog[d] = [];
      for (let k = 0; k < 3; k++) {
        activityLog[d].push({ id: 'ms_v1_test_' + k, text: rows[2].text, type: 'observation', ts: new Date(Date.now() - k * 60000).toISOString(),
          source: 'milestones-tab-v1-tap', domains: ['motor'], evidence: [{ milestone: rows[2].slug, confidence: 'high', domain: 'motor', context: 'milestones-tab-v1-tap' }] });
      }
      w.save(KEYS.activityLog, activityLog);
    }, ROWS);
    await page.reload();
    await page.waitForFunction(() => typeof (window as any).msLabel === 'function' && typeof (window as any).childSex === 'function', null, { timeout: 15_000 });
    await page.waitForTimeout(600);
    const r = await page.evaluate((rows: typeof ROWS) => {
      const w = window as any;
      w.switchTab('track'); w.switchTrackSub('milestones');
      if (typeof w.renderMilestones === 'function') w.renderMilestones();
      if (typeof w.renderUpcomingMilestones === 'function') w.renderUpcomingMilestones();
      const tab = document.getElementById('tab-milestones');
      const list = document.getElementById('milestoneList');
      const text = tab ? (tab.textContent || '') : '';
      const m = text.match(/.{0,60}\b(she|her|hers|herself)\b.{0,60}/i);
      return {
        sex: w.childSex(),
        hit: m ? m[0] : null,
        listText: list ? (list.textContent || '') : '',
        stored: rows.map(row => milestones.some((x: any) => x.text === row.text)),
        storedKeys: rows.map(row => milestones.filter((x: any) => x.text === row.text).map((x: any) => w.slugify(x.text))[0] || null),
      };
    }, ROWS);
    expect(r.sex).toBe('m');
    expect(r.hit, 'pronoun in the boy\'s Milestones view').toBeNull();
    // The seeded records render under their labels in the milestone list...
    expect(r.listText).toContain('Takes a few steps alone');
    expect(r.listText).toContain('Shows you a favourite object');
    expect(r.listText).not.toContain('Takes a few steps on her own');
    // ...while the stored records keep the frozen text and the same slug id.
    expect(r.stored).toEqual(ROWS.map(() => true));
    expect(r.storedKeys).toEqual(ROWS.map(row => row.slug));
  });
});
