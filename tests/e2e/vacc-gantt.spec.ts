import { test, expect } from '@playwright/test';

// PR-K Phase 4 — vaccination timeline reshaped into a vertical Gantt:
// one row per IAP age group, each vaccine a named status-coloured chip.

test('vaccination timeline renders as a row-per-age-group Gantt', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    (window as any).switchTab('medical');
    const tl = document.getElementById('vaccTimeline');
    const rows = tl ? tl.querySelectorAll('.vc-gantt-row') : [];
    const chips = tl ? tl.querySelectorAll('.vc-gantt-chip') : [];
    // Every chip carries a named label and a status-coloured dot.
    let allChipsNamed = true;
    let allChipsHaveStatus = true;
    chips.forEach((c) => {
      if (!c.querySelector('.vc-gantt-chip-name')?.textContent?.trim()) allChipsNamed = false;
      const dot = c.querySelector('.vc-timeline-dot.vc-gantt-chipdot');
      const known = ['vc-dot-none', 'vc-dot-mild', 'vc-dot-moderate', 'vc-dot-severe', 'vc-dot-upcoming', 'vc-dot-nodata'];
      if (!dot || !known.some((k) => dot.classList.contains(k))) allChipsHaveStatus = false;
    });
    // The tap handler must survive the reshape.
    const firstChip = chips[0] as HTMLElement | undefined;
    return {
      rowCount: rows.length,
      chipCount: chips.length,
      allChipsNamed,
      allChipsHaveStatus,
      tapWired: !!firstChip && firstChip.getAttribute('data-action') === 'vaccTimelineTap',
    };
  });

  expect(data.rowCount, 'at least one age-group row').toBeGreaterThan(0);
  expect(data.chipCount, 'at least one vaccine chip').toBeGreaterThan(0);
  expect(data.allChipsNamed, 'every chip shows the vaccine name').toBe(true);
  expect(data.allChipsHaveStatus, 'every chip carries a reaction-status colour').toBe(true);
  expect(data.tapWired, 'chips keep the vaccTimelineTap handler').toBe(true);
});
