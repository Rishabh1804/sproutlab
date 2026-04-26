import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

// SproutLab Phase 2 arming — province-specific smoke (R-15: surveyed against actual
// surface, NOT copied from sep-dashboard or sep-invoicing).
//
// `?nosync` skips Firebase init in start.js but keeps initSyncVisibility() running,
// so the indicator + offline badge still wire up to navigator.onLine.

const PRIMARY_TABS = ['home', 'growth', 'track', 'insights', 'history', 'info'] as const;

// Console errors we treat as benign on cold boot. CDN flakes for Chart.js or
// Firebase background warm-up shouldn't fail the smoke run; province-specific
// renderer errors must.
const BENIGN_CONSOLE = [
  /chart\.js/i,
  /firebase/i,
  /favicon/i,
];

function attachConsoleCollector(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (BENIGN_CONSOLE.some((rx) => rx.test(text))) return;
    errors.push(text);
  });
  page.on('pageerror', (err) => { errors.push(`pageerror: ${err.message}`); });
  return { errors };
}

test.describe('SproutLab smoke (Phase 2 arming)', () => {
  test('1 — index loads with no fatal console.error or pageerror', async ({ page }) => {
    const { errors } = attachConsoleCollector(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();
    await page.waitForTimeout(500); // settle: let init() and initSyncVisibility() flush
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('2 — all six primary tabs transition without throwing', async ({ page }) => {
    const { errors } = attachConsoleCollector(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();

    for (const tab of PRIMARY_TABS) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab button for "${tab}"`).toBeVisible();
      await btn.click();
      // Active tab gets .active on both the button and the corresponding panel.
      await expect(btn).toHaveClass(/\bactive\b/);
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/\bactive\b/);
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('3 — manifest.json parses with required PWA keys', async ({ request }) => {
    const res = await request.get('/manifest.json');
    expect(res.ok()).toBe(true);
    const m = await res.json();
    expect(m).toHaveProperty('name');
    expect(m).toHaveProperty('start_url');
    expect(m).toHaveProperty('display');
    expect(Array.isArray(m.icons)).toBe(true);
    expect(m.icons.length).toBeGreaterThan(0);
  });

  test('4 — Phase 1 surfaces intact under offline simulation', async ({ page, context }) => {
    await page.goto('/index.html?nosync');

    // syncStatus indicator exists in DOM (sl-1-2). It starts hidden until the
    // visibility store fires its first notify; we assert presence, not visibility.
    await expect(page.locator('#syncStatus')).toHaveCount(1);

    // Offline badge exists; starts hidden (sl-1-3).
    const badge = page.locator('#offlineBadge');
    await expect(badge).toHaveCount(1);
    await expect(badge).toBeHidden();

    // Flip the network offline at the BrowserContext level. The window
    // 'offline' event fires; the visibility store transitions to `offline`.
    await context.setOffline(true);
    await expect(badge).toBeVisible({ timeout: 5_000 });

    // Restore. Once `onSnapshotsInSync` would have fired (no-op under ?nosync),
    // the offline branch evaluates to false and the badge hides again. The
    // sl-1-2/r2 audit defines the transition as ~120 ms debounced.
    await context.setOffline(false);
    await expect(badge).toBeHidden({ timeout: 5_000 });
  });
});
