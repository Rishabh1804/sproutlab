import type { Page } from '@playwright/test';

// App globals (top-level let/function in the built page, so not on window).
declare const meds: { name: string; active: boolean }[];
declare function isVitDSupplement(m: unknown): boolean;

// Put the fixture child back on once-daily Vitamin D3 drops (PC-6).
//
// The fixture (storage.json) models the child after her switch to a twice-daily calcium +
// vitamin D syrup: the D3 drops are kept as history with active:false. The once-daily drops
// flows (skip card, pattern-card adherence, the Q&A "given today" line, the ISL day summary)
// still ship for any child on drops, and their regression guards need the drops to be the
// active supplement. Call this after the app has loaded and before exercising those flows.
export async function useOnceDailyD3Drops(page: Page): Promise<void> {
  await page.evaluate(() => {
    const drops = meds.find((m) => m.name && m.name.toLowerCase().includes('d3'));
    if (!drops) throw new Error('fixture has no D3 drops record');
    meds.forEach((m) => { if (m !== drops && isVitDSupplement(m)) m.active = false; });
    drops.active = true;
  });
}
