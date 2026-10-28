import { test, expect } from '@playwright/test';

// Fever episode card — "Show N earlier" readings toggle.
// Bug (2026-09-09, Architect screenshot): tapping "Show 2 earlier" re-rendered
// the card with the same 5-reading cap, so the list never expanded.
// QA chain canon-cc-008: Kael primary (intelligence-illness.js only).

async function seedSevenReadingEpisode(page: any) {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const at = (h: number, m: number) => {
      const d = new Date(day);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    const temps = [100.7, 99.9, 100.2, 97.5, 98.7, 99.7, 99.3];
    _feverEpisodes = [{
      id: 'fe-toggle-test',
      status: 'active',
      startedAt: at(1, 30),
      resolvedAt: null,
      readings: temps.map((t, i) => ({ temp: t, time: at(1 + i * 2, 30), notes: '' })),
      doses: [],
      actions: [],
      peakTemp: Math.max(...temps),
      triggerSource: 'test',
      notes: '',
      resolvedNotes: '',
    }];
    _feShowAllReadings = false;
    switchTab('medical'); // the card lives on Track → Medical; make it visible
    renderFeverEpisodeCard();
  });
}

test('fever card: "Show N earlier" expands to all readings, then collapses again', async ({ page }) => {
  await seedSevenReadingEpisode(page);

  const card = page.locator('#feverEpisodeCard');
  const entries = card.locator('.fe-tl-entry');
  const toggle = card.locator('.fe-more-toggle');

  // Collapsed: 5 of 7 shown, toggle offers the 2 hidden.
  await expect(entries).toHaveCount(5);
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toContainText('Show 2 earlier');

  // Expand.
  await toggle.click();
  await expect(entries).toHaveCount(7);
  await expect(toggle).toContainText('Show fewer');
  // Oldest reading is now visible at the bottom of the timeline.
  await expect(entries.last().locator('.fe-tl-temp')).toHaveText('100.7°F');
  // origIdx contract under expansion: the last (oldest) entry edits readings[0].
  await expect(entries.last()).toHaveAttribute('data-arg', '0');
  // No dangling connector line after the final entry.
  await expect(entries.last().locator('.fe-tl-line')).toHaveCount(0);

  // Collapse.
  await toggle.click();
  await expect(entries).toHaveCount(5);
  await expect(toggle).toContainText('Show 2 earlier');
});

test('fever card: no toggle rendered when 5 or fewer readings, even if flag is stale', async ({ page }) => {
  await seedSevenReadingEpisode(page);
  await page.evaluate(() => {
    _feverEpisodes[0].readings = _feverEpisodes[0].readings.slice(0, 4);
    _feShowAllReadings = true; // stale from a previous expand
    renderFeverEpisodeCard();
  });
  const card = page.locator('#feverEpisodeCard');
  await expect(card.locator('.fe-tl-entry')).toHaveCount(4);
  await expect(card.locator('.fe-more-toggle')).toHaveCount(0);
  // Render normalizes the stale flag, so regrowth past the cap opens collapsed.
  const flag = await page.evaluate(() => _feShowAllReadings);
  expect(flag).toBe(false);
});

test('fever card: resolving the episode resets the expand flag', async ({ page }) => {
  await seedSevenReadingEpisode(page);
  await page.locator('#feverEpisodeCard .fe-more-toggle').click();
  const r = await page.evaluate(() => {
    resolveFeverEpisode('');
    return { flag: _feShowAllReadings, status: _feverEpisodes[0].status };
  });
  expect(r.status).toBe('resolved');
  expect(r.flag).toBe(false);
});
