import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

// SproutLab Phase 2 arming — province-specific smoke (R-15: surveyed against actual
// surface, NOT copied from sep-dashboard or sep-invoicing).
//
// `?nosync` skips Firebase init in start.js but keeps initSyncVisibility() running,
// so the indicator + offline badge still wire up to navigator.onLine.

const PRIMARY_TABS = ['home', 'growth', 'track', 'insights', 'history', 'info'] as const;

// Console errors we treat as benign on cold boot. CDN flakes for Chart.js or
// Firebase background warm-up shouldn't fail the smoke run; province-specific
// renderer errors must. Network/cert errors from the sandbox environment are
// also filtered (CT-10 lesson extended to console layer — bundled chromium may
// not trust sandbox MITM CAs, producing console errors with no URL substring;
// Cipher r1 review on PR #9 surfaced this empirically).
const BENIGN_CONSOLE = [
  /chart\.js/i,
  /firebase/i,
  /favicon/i,
  /Failed to load resource: net::/i,
  /ERR_CERT_/i,
];

// Hermetic stub for the Chart.js CDN. The smoke spec doesn't exercise chart
// rendering; stubbing the CDN at the route layer means cert / egress posture
// in any sandbox cannot produce false-positive console errors. Cipher Path B
// from the PR #9 r1 review.
async function stubChartJs(page: Page): Promise<void> {
  await page.route('https://cdn.jsdelivr.net/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body:
        'window.Chart = class { constructor(){ this.data={datasets:[]}; this.options={}; }' +
        ' update(){} destroy(){} resize(){} };' +
        'window.Chart.register = function(){};' +
        'window.Chart.defaults = { plugins:{} };' +
        'window.Chart.helpers = {};',
    }),
  );
}

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
    await stubChartJs(page);
    const { errors } = attachConsoleCollector(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();
    await page.waitForTimeout(500); // settle: let init() and initSyncVisibility() flush
    expect(errors, errors.join('\n')).toEqual([]);
  });

  // Test 2 ships as a triad (R-7) covering both modes of the simple-mode contract.
  // Cipher r2 surfaced that simple-mode is opt-OUT (split/core.js:3711–3717:
  // saved !== 'false' → simple-mode added on init), so a fresh browserContext
  // with empty localStorage gets simple-mode ON, which CSS-hides Insights + Info.
  // The triad documents the two-mode contract on-record:
  //   2a — simple-mode default renders four tabs (positive, default state)
  //   2b — full mode (opt-out) renders all six (positive, opt-out state)
  //   2c — simple-mode hides exactly Insights + Info, nothing more (regression-guard)

  const SIMPLE_VISIBLE = ['home', 'growth', 'track', 'history'] as const;
  const SIMPLE_HIDDEN = ['insights', 'info'] as const;

  test('2a — simple-mode default renders four tabs (Insights + Info hidden)', async ({ page }) => {
    await stubChartJs(page);
    const { errors } = attachConsoleCollector(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();

    // Default: no localStorage entry → simple-mode ON.
    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);

    for (const tab of SIMPLE_VISIBLE) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present`).toHaveCount(1);
      await btn.scrollIntoViewIfNeeded();
      await expect(btn, `tab "${tab}" visible`).toBeVisible();
      await btn.click();
      await expect(btn).toHaveClass(/\bactive\b/);
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/\bactive\b/);
    }

    for (const tab of SIMPLE_HIDDEN) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present in DOM`).toHaveCount(1);
      await expect(btn, `tab "${tab}" hidden under simple-mode`).toBeHidden();
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('2b — full mode (simple-mode opted out) renders all six tabs', async ({ page }) => {
    await stubChartJs(page);
    const { errors } = attachConsoleCollector(page);

    // Opt out of simple-mode before init runs (split/core.js:3711 reads localStorage
    // synchronously during initSimpleMode). addInitScript fires before page scripts.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });

    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/\bsimple-mode\b/);

    for (const tab of PRIMARY_TABS) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present`).toHaveCount(1);
      await btn.scrollIntoViewIfNeeded();
      await expect(btn, `tab "${tab}" visible`).toBeVisible();
      await btn.click();
      await expect(btn).toHaveClass(/\bactive\b/);
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/\bactive\b/);
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('2c — simple-mode hides exactly Insights + Info, nothing else', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);

    // Regression-guard for the simple-mode contract: if styles.css ever drops
    // a tab from the .simple-mode hide rule (or adds another), this fails.
    for (const tab of PRIMARY_TABS) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present in DOM`).toHaveCount(1);
      const shouldBeHidden = (SIMPLE_HIDDEN as readonly string[]).includes(tab);
      if (shouldBeHidden) {
        await expect(btn, `simple-mode hides "${tab}"`).toBeHidden();
      } else {
        await btn.scrollIntoViewIfNeeded();
        await expect(btn, `simple-mode keeps "${tab}" visible`).toBeVisible();
      }
    }
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
    await stubChartJs(page);
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
