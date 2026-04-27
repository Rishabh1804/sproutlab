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
//
// PR-12 r2 — extended for SW 503-fallback noise: when sw.js's fetch handler
// catches an aborted/cancelled fetch (which happens during SW claim mid-load
// for in-flight resource requests), it returns `new Response('Offline',
// {status:503})`, which the browser logs as `Failed to load resource: the
// server responded with a status of 503 ()`. This is the SW doing its job,
// not a renderer-side defect — symmetric to the cert/egress noise from PR-9
// r2. The pattern below catches any `Failed to load resource: the server
// responded with a status of NNN ()` shape regardless of code, since smoke
// isn't the place to validate specific HTTP-status correctness.
const BENIGN_CONSOLE = [
  /chart\.js/i,
  /firebase/i,
  /favicon/i,
  /Failed to load resource: net::/i,
  /ERR_CERT_/i,
  /Failed to load resource: the server responded with a status of \d+/i,
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

// Phase 2 PR-2.5 — status strip placement contract (R-7 triad).
//
// Sovereign-issued PR-2.5: the sl-1-2 #syncStatus pill was inside #headerFull,
// which is `display:none` under body.simple-mode (the default for new users).
// Result: simple-mode users saw zero sync feedback. PR-2.5 relocates
// #syncStatus into a new #statusStrip sibling above the tab-bar so the
// indicator is visible in BOTH modes.
//
// Triad shape:
//   default-positive  — simple-mode (default) renders strip + indicator-host
//   opt-out-positive  — full-mode (localStorage opt-out) renders same
//   mode-contract     — strip and #syncStatus are present in BOTH modes; the
//                       simple-mode #headerFull display:none rule does NOT
//                       cascade to the strip (regression-guard)

test.describe('Status strip — sync indicator placement (Phase 2 PR-2.5)', () => {
  test('default-positive — simple-mode user sees the status strip + sync indicator', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);

    // Strip is the always-visible container.
    const strip = page.locator('#statusStrip');
    await expect(strip).toHaveCount(1);
    await expect(strip).toBeVisible();

    // Indicator lives inside the strip (parent-child selector confirms placement).
    await expect(page.locator('#statusStrip #syncStatus')).toHaveCount(1);
  });

  test('opt-out-positive — full-mode user sees the status strip + sync indicator', async ({ page }) => {
    await stubChartJs(page);

    // Opt out of simple-mode before init runs.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });

    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).not.toHaveClass(/\bsimple-mode\b/);

    const strip = page.locator('#statusStrip');
    await expect(strip).toHaveCount(1);
    await expect(strip).toBeVisible();

    await expect(page.locator('#statusStrip #syncStatus')).toHaveCount(1);
  });

  test('mode-contract-regression — strip is visible in BOTH modes (no display:none cascade)', async ({ page }) => {
    await stubChartJs(page);

    // Pass 1: default mode (simple-mode ON).
    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);
    const stripDefault = page.locator('#statusStrip');
    await expect(stripDefault, 'strip visible in simple-mode default').toBeVisible();
    // The simple-mode rule that hides #headerFull MUST NOT cascade — the
    // strip is a sibling of #headerFull, not a descendant.
    await expect(page.locator('#headerFull'), 'simple-mode hides #headerFull (existing contract)').toBeHidden();
    await expect(page.locator('#statusStrip'), 'strip survives the #headerFull hide').toBeVisible();
    await expect(page.locator('#statusStrip #syncStatus'), 'sync indicator co-located in strip').toHaveCount(1);

    // Pass 2: full mode (simple-mode OPT-OUT).
    await page.evaluate(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });
    await page.reload();
    await expect(page.locator('body')).not.toHaveClass(/\bsimple-mode\b/);
    await expect(page.locator('#headerFull'), 'full-mode shows #headerFull').toBeVisible();
    await expect(page.locator('#statusStrip'), 'strip stays visible in full-mode too').toBeVisible();
    await expect(page.locator('#statusStrip #syncStatus'), 'sync indicator co-located in strip (full-mode)').toHaveCount(1);
  });
});

// Phase 2 PR-3 — manifest version contract (R-7 triad).
// build.sh bumps manifest.json's `version` field on each invocation;
// displayAppVersion() in core.js fetches it at runtime and populates
// #appVersion in the settings sidebar. Three tests cover both ends of
// the contract:
//   positive — version is present + advance-shaped (YYYY.MM.DD-N) AND
//              #appVersion reflects it after page load.
//   regression-guard — no stale "1.0" / "0.0" / pending-build placeholder
//                      leaked into the served HTML at #appVersion.
//   positive-regression — when manifest.json fetch fails, the
//                         #appVersion line stays empty (CSS :empty hides
//                         the row).
const VERSION_RX = /^\d{4}\.\d{2}\.\d{2}-\d+$/;

test.describe('Manifest version contract (Phase 2 PR-3)', () => {
  test('positive — manifest exposes a build-stamp version + #appVersion populates from it', async ({ page, request }) => {
    // 1. Manifest carries a version field in the advance-shaped format.
    const manifestRes = await request.get('/manifest.json');
    expect(manifestRes.ok()).toBe(true);
    const manifest = await manifestRes.json();
    expect(manifest).toHaveProperty('version');
    expect(typeof manifest.version).toBe('string');
    expect(manifest.version, 'version matches YYYY.MM.DD-N shape').toMatch(VERSION_RX);

    // 2. Runtime read populates #appVersion with the same value.
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    const appVersion = page.locator('#appVersion');
    await expect(appVersion).toHaveCount(1);
    await expect(appVersion).toHaveText(`App version ${manifest.version}`, { timeout: 5_000 });
  });

  test('regression-guard — no stale version placeholder in served HTML at #appVersion', async ({ request }) => {
    const res = await request.get('/index.html');
    expect(res.ok()).toBe(true);
    const html = await res.text();

    // The version is set by displayAppVersion() at runtime; the served HTML
    // must not carry a literal placeholder inside #appVersion that would
    // mask the dynamic value (a build-step regression where a hardcoded
    // string leaked through).
    const stalePatterns = [
      /id="appVersion"[^>]*>App version 0\.0/,
      /id="appVersion"[^>]*>App version 1\.0/,
      /id="appVersion"[^>]*>v0(\.\d+)?</,
      /id="appVersion"[^>]*>v1\.0/,
    ];
    for (const rx of stalePatterns) {
      expect(html, `no stale version literal: ${rx}`).not.toMatch(rx);
    }

    // The pending-build placeholder ("0.0.0-pending-build") should never
    // reach a deployed artifact — it's overwritten by build.sh on every
    // build. If it shows up, the build pipeline didn't run.
    expect(html, 'no pending-build placeholder leaked through').not.toMatch(/0\.0\.0-pending-build/);
  });

  test('positive-regression — #appVersion stays empty when manifest fetch fails', async ({ page }) => {
    await stubChartJs(page);
    // Stub manifest.json to 404 BEFORE goto so displayAppVersion() sees the
    // failure on first call.
    await page.route('**/manifest.json', (route) =>
      route.fulfill({ status: 404, body: 'not found' }),
    );

    await page.goto('/index.html?nosync');
    // Settle: the page-load init chain (initSyncVisibility, displayAppVersion)
    // resolves within a tick or two. 1s is generous.
    await page.waitForTimeout(1_000);

    const appVersion = page.locator('#appVersion');
    await expect(appVersion).toHaveCount(1);
    // Empty textContent. The :empty CSS rule hides the row visually; the
    // assertion here is on textContent, not visibility, since :empty also
    // makes the element non-visible to Playwright.
    await expect(appVersion).toHaveText('');
  });
});

// Phase 2 PR-4a — Service Worker registration (lifecycle-only, no caching yet).
//
// Pre-PR-4a, the SW was registered from an inline Blob URL with a hardcoded
// scope:'/sproutlab/beta/' that silently failed on production scope
// '/sproutlab/' (lowercase per GitHub Pages convention; capital-S returns
// 404). PR-4a externalizes the SW to /sw.js so default scope = parent
// directory of the script (auto-matches local '/' and prod '/sproutlab/').
//
// Two tests: positive (D1-technique activation wait) + regression-guard
// (no inline Blob-URL remnants in served HTML).

test.describe('Service Worker registration (Phase 2 PR-4a)', () => {
  test('positive — SW activates on scope-root', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    // D1 — atomic await navigator.serviceWorker.ready inside a single
    // page.evaluate. Collapses wait + read into one round-trip; eliminates
    // the inter-call window that race-conditioned earlier sep-dashboard
    // PR #6 attempts (D1 is the *technique*; the assertion below is the
    // *thing being asserted* — registration activates on scope-root).
    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return {
        scope: reg.scope,
        active: !!reg.active,
        state: reg.active?.state ?? null,
      };
    });

    expect(swState.active, 'SW has an active registration').toBe(true);
    expect(swState.state, 'active SW is in activated state').toBe('activated');
    // Scope is the parent directory of the SW script per the SW spec.
    // On the hermetic local server, that's the root '/'. Production
    // deploy has '/sproutlab/'. The assertion stays loose to let both
    // pass; PR-4b will tighten when versioned cache scopes are introduced.
    expect(swState.scope, 'scope ends with /').toMatch(/\/$/);
  });

  test('regression-guard — no inline Blob-URL SW remnants in served HTML', async ({ request }) => {
    const res = await request.get('/index.html');
    expect(res.ok()).toBe(true);
    const html = await res.text();

    // Pre-PR-4a inline pattern would leave these traces. Their presence
    // would mean the externalization didn't take effect and we shipped the
    // old broken-scope inline SW.
    expect(html, 'no Blob-URL SW remnants').not.toMatch(/new Blob\(\s*\[\s*swCode\s*\]/);
    expect(html, 'no inline swCode template literal').not.toMatch(/const\s+swCode\s*=/);
    // Hardcoded scope is gone — default scope derives from script location.
    expect(html, 'no /sproutlab/beta/ scope hardcode').not.toMatch(/scope\s*:\s*['"]\/sproutlab\/beta\//);
  });
});
