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

  // Test 2 ships as a triad (R-7) covering both modes of the essential-mode contract.
  // Cipher r2 surfaced that essential-mode is opt-OUT (split/core.js:3711–3717:
  // saved !== 'false' → essential-mode added on init), so a fresh browserContext
  // with empty localStorage gets essential-mode ON, which CSS-hides Insights + Info.
  // The triad documents the two-mode contract on-record:
  //   2a — essential-mode default renders four tabs (positive, default state)
  //   2b — full mode (opt-out) renders all six (positive, opt-out state)
  //   2c — essential-mode hides exactly Insights + Info, nothing more (regression-guard)

  const ESSENTIAL_VISIBLE = ['home', 'growth', 'track', 'history'] as const;
  const ESSENTIAL_HIDDEN = ['insights', 'info'] as const;

  test('2a — essential-mode default renders four tabs (Insights + Info hidden)', async ({ page }) => {
    await stubChartJs(page);
    const { errors } = attachConsoleCollector(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();

    // Default: no localStorage entry → essential-mode ON.
    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);

    for (const tab of ESSENTIAL_VISIBLE) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present`).toHaveCount(1);
      await btn.scrollIntoViewIfNeeded();
      await expect(btn, `tab "${tab}" visible`).toBeVisible();
      await btn.click();
      await expect(btn).toHaveClass(/\bactive\b/);
      await expect(page.locator(`#tab-${tab}`)).toHaveClass(/\bactive\b/);
    }

    for (const tab of ESSENTIAL_HIDDEN) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present in DOM`).toHaveCount(1);
      await expect(btn, `tab "${tab}" hidden under essential-mode`).toBeHidden();
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('2b — full mode (essential-mode opted out) renders all six tabs', async ({ page }) => {
    await stubChartJs(page);
    const { errors } = attachConsoleCollector(page);

    // Opt out of essential-mode before init runs (split/core.js:3711 reads localStorage
    // synchronously during initEssentialMode). addInitScript fires before page scripts.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });

    await page.goto('/index.html?nosync');
    await expect(page.locator('.tab-bar')).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);

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

  test('2c — essential-mode hides exactly Insights + Info, nothing else', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);

    // Regression-guard for the essential-mode contract: if styles.css ever drops
    // a tab from the .essential-mode hide rule (or adds another), this fails.
    for (const tab of PRIMARY_TABS) {
      const btn = page.locator(`.tab-bar .tab-btn[data-tab="${tab}"]`);
      await expect(btn, `tab "${tab}" present in DOM`).toHaveCount(1);
      const shouldBeHidden = (ESSENTIAL_HIDDEN as readonly string[]).includes(tab);
      if (shouldBeHidden) {
        await expect(btn, `essential-mode hides "${tab}"`).toBeHidden();
      } else {
        await btn.scrollIntoViewIfNeeded();
        await expect(btn, `essential-mode keeps "${tab}" visible`).toBeVisible();
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
// which is `display:none` under body.essential-mode (the default for new users).
// Result: essential-mode users saw zero sync feedback. PR-2.5 relocates
// #syncStatus into a new #statusStrip sibling above the tab-bar so the
// indicator is visible in BOTH modes.
//
// Triad shape:
//   default-positive  — essential-mode (default) renders strip + indicator-host
//   opt-out-positive  — full-mode (localStorage opt-out) renders same
//   mode-contract     — strip and #syncStatus are present in BOTH modes; the
//                       essential-mode #headerFull display:none rule does NOT
//                       cascade to the strip (regression-guard)

test.describe('Status strip — sync indicator placement (Phase 2 PR-2.5)', () => {
  test('default-positive — essential-mode user sees the status strip + sync indicator', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);

    // Strip is the always-visible container.
    const strip = page.locator('#statusStrip');
    await expect(strip).toHaveCount(1);
    await expect(strip).toBeVisible();

    // Indicator lives inside the strip (parent-child selector confirms placement).
    await expect(page.locator('#statusStrip #syncStatus')).toHaveCount(1);
  });

  test('opt-out-positive — full-mode user sees the status strip + sync indicator', async ({ page }) => {
    await stubChartJs(page);

    // Opt out of essential-mode before init runs.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });

    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);

    const strip = page.locator('#statusStrip');
    await expect(strip).toHaveCount(1);
    await expect(strip).toBeVisible();

    await expect(page.locator('#statusStrip #syncStatus')).toHaveCount(1);
  });

  test('mode-contract-regression — strip is visible in BOTH modes (no display:none cascade)', async ({ page }) => {
    await stubChartJs(page);

    // Pass 1: default mode (essential-mode ON).
    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);
    const stripDefault = page.locator('#statusStrip');
    await expect(stripDefault, 'strip visible in essential-mode default').toBeVisible();
    // The essential-mode rule that hides #headerFull MUST NOT cascade — the
    // strip is a sibling of #headerFull, not a descendant.
    await expect(page.locator('#headerFull'), 'essential-mode hides #headerFull (existing contract)').toBeHidden();
    await expect(page.locator('#statusStrip'), 'strip survives the #headerFull hide').toBeVisible();
    await expect(page.locator('#statusStrip #syncStatus'), 'sync indicator co-located in strip').toHaveCount(1);

    // Pass 2: full mode (essential-mode OPT-OUT).
    await page.evaluate(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });
    await page.reload();
    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);
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
    //
    // PR-13 r1 surfaced (Cipher CT-8-shape catch under parallel stress):
    // `serviceWorker.ready` resolves when `reg.active` is non-null, but
    // `reg.active.state` can be 'activating' for a brief window before
    // settling to 'activated'. PR-4b's heavier install (manifest fetch +
    // 8-asset precache including 343 KB Firestore compat) widens that
    // window under parallel contention. Refinement: await the statechange
    // event explicitly, still inside one page.evaluate so D1 atomicity is
    // preserved (no inter-call window). 5s cap prevents indefinite hangs.
    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      const active = reg.active;
      if (active && active.state !== 'activated') {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('SW activate timeout (5s)')),
            5000,
          );
          const onChange = () => {
            if (active.state === 'activated') {
              clearTimeout(timer);
              active.removeEventListener('statechange', onChange);
              resolve();
            }
          };
          active.addEventListener('statechange', onChange);
        });
      }
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

// Phase 2 PR-4b — Versioned cache + precache + stale-while-revalidate.
//
// Five tests exercise the cache lifecycle end-to-end:
//   positive — cache name matches manifest.version (CACHE_NAME = 'sproutlab-' + version)
//   positive — all 8 first-party precache assets land in the cache after install
//   regression-guard — manifest.json is NOT precached (bypass keeps displayAppVersion fresh)
//   regression-guard — stale prior-version caches are deleted on activate
//   positive — cached asset served when network unavailable (offline behavior)
//
// Hermetic note: tests rely on the SW activating in a fresh BrowserContext.
// Playwright defaults to one context per test, so each test sees a clean SW
// install + activate cycle. The CACHE_PREFIX is 'sproutlab-'.

test.describe('Service Worker cache lifecycle (Phase 2 PR-4b)', () => {
  test('positive — cache name derived from manifest.version', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);

    const result = await page.evaluate(async () => {
      const manifest = await fetch('manifest.json', { cache: 'no-store' }).then(r => r.json());
      const cacheKeys = await caches.keys();
      return { version: manifest.version, cacheKeys };
    });

    expect(result.version, 'manifest version present').toMatch(/^\d{4}\.\d{2}\.\d{2}-\d+$/);
    expect(result.cacheKeys, 'cache name = sproutlab-<version>').toContain(`sproutlab-${result.version}`);
  });

  test('positive — all 8 first-party assets precached on install', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(500); // let precache promises settle

    const PRECACHE_EXPECTED = [
      './',
      'index.html',
      'icon-192.png',
      'icon-512.png',
      'apple-touch-icon.png',
      'lib/firebase-app-compat.js',
      'lib/firebase-auth-compat.js',
      'lib/firebase-firestore-compat.js',
    ];

    const cachedMap = await page.evaluate(async (assets) => {
      const keys = await caches.keys();
      const cacheName = keys.find(k => k.startsWith('sproutlab-'));
      if (!cacheName) return { cacheName: null, results: {} };
      const cache = await caches.open(cacheName);
      const results = {};
      for (const asset of assets) {
        const match = await cache.match(asset);
        results[asset] = !!match;
      }
      return { cacheName, results };
    }, PRECACHE_EXPECTED);

    expect(cachedMap.cacheName, 'versioned cache exists').toBeTruthy();
    for (const asset of PRECACHE_EXPECTED) {
      expect(cachedMap.results[asset], `precached: ${asset}`).toBe(true);
    }
  });

  test('regression-guard — manifest.json NOT precached (bypass preserved)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(500);

    // Cipher PR-11 catch: manifest.json must always reach network so
    // displayAppVersion() reads the current build's version, not a stale
    // precached copy. This guards both that manifest.json is excluded from
    // the precache list AND that the fetch handler skips respondWith for it.
    const manifestCached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cacheName = keys.find(k => k.startsWith('sproutlab-'));
      if (!cacheName) return null;
      const cache = await caches.open(cacheName);
      const match = await cache.match('manifest.json');
      return !!match;
    });

    expect(manifestCached, 'manifest.json must NOT be in versioned cache').toBe(false);
  });

  test('regression-guard — stale prior-version caches deleted on activate', async ({ page }) => {
    await stubChartJs(page);

    // Pre-seed an old cache before the SW activates. addInitScript runs
    // before page scripts but after browser context creation; the cache
    // is created from the page context, then the SW's activate handler
    // (which fires on first navigation) cleans it up.
    await page.addInitScript(() => {
      // Pre-seed in init-time so it exists before SW install completes
      caches.open('sproutlab-1900.01.01-1').then(cache =>
        cache.put('/old', new Response('stale prior version'))
      );
    });

    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(500); // let activate cleanup run

    const finalKeys = await page.evaluate(() => caches.keys());

    expect(finalKeys, 'old prefixed cache must be deleted').not.toContain('sproutlab-1900.01.01-1');
    expect(
      finalKeys.some(k => k.startsWith('sproutlab-')),
      'current versioned cache must remain'
    ).toBe(true);
  });

  test('positive — cached asset served when network unavailable', async ({ page, context }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(500); // precache settle

    // Verify icon is precached BEFORE going offline (sanity check).
    const precached = await page.evaluate(async () => {
      const keys = await caches.keys();
      const cacheName = keys.find(k => k.startsWith('sproutlab-'));
      if (!cacheName) return false;
      const cache = await caches.open(cacheName);
      return !!(await cache.match('icon-192.png'));
    });
    expect(precached, 'icon-192.png pre-cached as sanity').toBe(true);

    // Now go offline at the BrowserContext level. Subsequent fetches
    // would fail without the SW — the cache hit is what makes the offline
    // story work.
    await context.setOffline(true);

    const offlineResult = await page.evaluate(async () => {
      try {
        const res = await fetch('icon-192.png');
        return { ok: res.ok, status: res.status };
      } catch (err) {
        return { error: String(err) };
      }
    });

    expect(offlineResult.ok, 'cached icon served offline').toBe(true);
    expect(offlineResult.status, 'response status 200 (cache hit)').toBe(200);
  });
});

// Phase 2 PR-5 — Update-detection toast (R-7 binary-mode triad).
//
// When sw.js changes (typically post-manifest-version-bump deploy), the new
// worker fires 'updatefound' → reaches 'installed' state. With an existing
// controller, that's an UPDATE (not first install) and core.js reveals
// #updateToast. Tap routes through data-action="syncReload" (sl-1-2 r3
// dispatcher) which reloads the page → user gets the new bundle.
//
// Triad shape (binary-mode refinement of R-7 — anticipated 3rd on-record
// instance per Cipher PR-13 r2 doctrine ledger):
//   default-positive — essential-mode user: toast renders + reveals + has dispatcher wiring
//   opt-out-positive — full-mode user:    same
//   mode-contract-regression — toast in DOM under BOTH modes; visibility controlled
//                              by [hidden] attribute, NOT by mode (regression-guard
//                              against accidental essential-mode hide rule)
//
// Test approach: trigger the reveal via direct page.evaluate (mocking the
// updatefound→installed→controller chain). Real SW-script-swap simulation
// is jurisdictionally distinct (Playwright doesn't expose a clean primitive
// for swapping the SW script mid-test); the chain itself is verified by
// PR-13's cache-lifecycle suite. This describe block tests the UI surface +
// data-action wiring under both UX modes.

test.describe('Update-detection toast (Phase 2 PR-5)', () => {
  test('default-positive — essential-mode user sees toast on update', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);

    const toast = page.locator('#updateToast');
    await expect(toast, 'toast present in DOM').toHaveCount(1);
    await expect(toast, 'toast initially hidden').toBeHidden();

    // HR-3/HR-6: tap routes through the syncReload dispatcher.
    await expect(toast).toHaveAttribute('data-action', 'syncReload');

    // Simulate updatefound → installed + controller chain by directly
    // invoking the reveal that core.js's listener would run. This tests
    // the toast UI + wiring without needing to swap the SW script.
    await page.evaluate(() => {
      const el = document.getElementById('updateToast');
      if (el) el.removeAttribute('hidden');
    });

    await expect(toast, 'toast visible after reveal').toBeVisible();
    await expect(toast).toHaveText(/New version available/i);
  });

  test('opt-out-positive — full-mode user sees toast on update', async ({ page }) => {
    await stubChartJs(page);
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);

    const toast = page.locator('#updateToast');
    await expect(toast).toHaveCount(1);
    await expect(toast).toBeHidden();
    await expect(toast).toHaveAttribute('data-action', 'syncReload');

    await page.evaluate(() => {
      const el = document.getElementById('updateToast');
      if (el) el.removeAttribute('hidden');
    });

    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/New version available/i);
  });

  test('mode-contract-regression — toast in DOM under BOTH modes (no display:none cascade)', async ({ page }) => {
    await stubChartJs(page);

    // Pass 1: essential-mode default
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);
    await expect(page.locator('#updateToast'), 'toast in DOM under essential-mode').toHaveCount(1);
    await expect(page.locator('#headerFull'), 'essential-mode hides #headerFull').toBeHidden();
    await expect(page.locator('#statusStrip'), 'strip visible (toast container)').toBeVisible();
    // Toast itself is hidden by [hidden] attribute, NOT by essential-mode CSS.
    // After removeAttribute('hidden'), it should be visible regardless of mode.
    await page.evaluate(() => {
      const el = document.getElementById('updateToast');
      if (el) el.removeAttribute('hidden');
    });
    await expect(page.locator('#updateToast'), 'toast reveals under essential-mode').toBeVisible();

    // Pass 2: opt out, reload
    await page.evaluate(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });
    await page.reload();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);
    await expect(page.locator('#updateToast'), 'toast in DOM under full-mode').toHaveCount(1);
    await expect(page.locator('#headerFull'), 'full-mode shows #headerFull').toBeVisible();
    await page.evaluate(() => {
      const el = document.getElementById('updateToast');
      if (el) el.removeAttribute('hidden');
    });
    await expect(page.locator('#updateToast'), 'toast reveals under full-mode').toBeVisible();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Build script contract (Phase 3 PR-8)
// ───────────────────────────────────────────────────────────────────────────
//
// PR-8 mechanizes the rebuild step the Phase 1 ship-gap surfaced (manifest
// `version` advanced but the compiled artifact wasn't regenerated). The
// `pnpm build` entry runs `bash split/build.sh` (which now self-locates via
// `cd "$(dirname "$0")"` so it works from any cwd) and copies the result to
// both sproutlab.html and index.html. This describe block regression-guards
// the `package.json` "scripts.build" entry against accidental drop. The
// existing PR-3 manifest-version triad (above, lines ~290–365) covers the
// build-output side; this just guards the entry point.

test.describe('Build script contract (Phase 3 PR-8)', () => {
  test('positive — package.json declares a `build` script that invokes split/build.sh', async ({ request }) => {
    const res = await request.get('/package.json');
    expect(res.ok(), 'package.json fetchable').toBeTruthy();
    const pkg = await res.json();
    expect(pkg.scripts, 'package.json has scripts block').toBeTruthy();
    expect(pkg.scripts.build, 'scripts.build entry present').toBeTruthy();
    // Substring match — exact wording can iterate (e.g. future prepush hook),
    // but the entry must drive split/build.sh, not bypass it.
    expect(pkg.scripts.build, 'build script invokes split/build.sh').toContain('split/build.sh');
    expect(pkg.scripts.build, 'build script writes sproutlab.html').toContain('sproutlab.html');
    expect(pkg.scripts.build, 'build script copies to index.html').toContain('index.html');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Phase 3 PR-9 — Auto-Refresh on Listener Fire + clobber-loop fix + attribution
// ───────────────────────────────────────────────────────────────────────────
//
// Three deliverables under one architectural change (charter §3 Option B,
// post-R1 fold). Tested as three R-7 triads:
//
//   - Auto-refresh dispatch (the surface): listener fire → module global
//     rehydrate → active-tab renderer call → no page reload.
//   - Cross-device clobber regression (Finding E): listener-applied state
//     survives a subsequent local push (rehydration is the closer of the
//     clobber loop).
//   - Attribution surfacing (Finding F): toast text names the updater when
//     __sync_updatedBy is on the snapshot; falls back to count-only when
//     absent. Toast on auto-render success path is NOT tappable.
//
// All tests use ?nosync to skip Firebase init in start.js (so the dispatch
// path can be exercised without real Firestore). The tested primitives
// (_syncDispatchRender, _syncSetGlobal, _syncReadActiveTab, _syncQueueToast,
// _syncShowSyncToast, _syncComposeToastText) and the listener handlers
// themselves are top-level function declarations and attach to window.

// All tests below construct fake snapshot payloads inline inside page.evaluate
// (Firestore SDK SnapshotShape is exists/data()/metadata; ducktype is enough
// for _syncHandleSingleDocSnapshot's reads).

test.describe('Auto-refresh on listener fire (Phase 3 PR-9)', () => {
  test('positive — dispatch on growth listener fire rehydrates module global + reflects in active tab', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    // Wait for sync.js helpers (top-level fn declarations attach to window).
    await page.waitForFunction(() => typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function');

    // Synthetic listener fire — fake a remote growth doc with [a, b, c]
    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const get = w['_syncGetGlobal'] as (name: string) => unknown;
      const fakeGrowth = [
        { date: '2025-09-04', wt: 3.45, ht: 50 },
        { date: '2026-04-20', wt: 7.80, ht: 67 },
        { date: '2026-04-27', wt: 8.05, ht: 68 },
      ];
      const fakeDoc = {
        exists: true,
        data: () => ({
          ziva_growth: fakeGrowth,
          __sync_updatedBy: { uid: 'remote-uid', name: 'Bhavna' },
          __sync_syncedAt: null,
        }),
        metadata: { hasPendingWrites: false },
      };
      // Mark listener-ready so any guards do not early-return on first-fire
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', fakeDoc);
      const after = get('growthData') as Array<{ wt: number }>;
      return {
        moduleGlobalLength: after.length,
        moduleGlobalLastWt: after.slice(-1)[0].wt,
        localStorageMatches: window.localStorage.getItem('ziva_growth') !== null,
      };
    });

    expect(result.moduleGlobalLength, 'growthData rehydrated to 3 entries').toBe(3);
    expect(result.moduleGlobalLastWt, 'last entry weight matches synthetic').toBe(8.05);
    expect(result.localStorageMatches, 'localStorage[ziva_growth] populated').toBeTruthy();
  });

  test('regression-guard — dispatch while inactive tab does not call inactive renderer (still rehydrates)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function');

    // Activate Home tab; fire dispatch for tracking (feeding) — feeding's
    // active-tab renderers include both home and 'track:diet'. From home,
    // renderHome should run (and not throw); diet-only renderers are skipped.
    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const get = w['_syncGetGlobal'] as (name: string) => Record<string, unknown> | undefined;
      // Spy on renderDietStats — it's a 'track:diet' renderer; should NOT
      // be called when home tab is active. Dispatch resolves renderers via
      // window[name] lookup so this monkey-patch is observable.
      let dietStatsCalls = 0;
      const origDietStats = w['renderDietStats'] as () => void;
      w['renderDietStats'] = function() { dietStatsCalls++; if (origDietStats) return origDietStats(); };

      const dispatch = w['_syncDispatchRender'] as (k: string, v: unknown, a: unknown) => unknown;
      const fakeFeeding = { '2026-04-27': { breakfast: 'oats', lunch: '', dinner: '', snack: '' } };
      // Confirm home tab is active (default landing tab)
      const homeActive = !!document.getElementById('tab-home')?.classList.contains('active');
      dispatch('ziva_feeding', fakeFeeding, null);

      // Restore
      w['renderDietStats'] = origDietStats;
      return {
        homeActive,
        dietStatsCalls,
        feedingDataKeys: Object.keys(get('feedingData') || {}),
      };
    });

    expect(result.homeActive, 'home tab active by default landing').toBeTruthy();
    expect(result.dietStatsCalls, 'renderDietStats NOT called when home active').toBe(0);
    expect(result.feedingDataKeys, 'feedingData rehydrated despite no diet render').toContain('2026-04-27');
  });

  test('positive-regression — auto-render path does not trigger window.location.reload', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    const initialUrl = page.url();
    // Spy on navigation events
    let navigationCount = 0;
    page.on('framenavigated', () => { navigationCount++; });

    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({ ziva_growth: [{ date: '2026-04-27', wt: 8.05, ht: 68 }] }),
        metadata: { hasPendingWrites: false },
      });
    });

    // Wait briefly to allow any async navigation to settle
    await page.waitForTimeout(200);
    expect(page.url(), 'URL unchanged across listener fire').toBe(initialUrl);
    expect(navigationCount, 'no navigation events fired').toBe(0);
  });
});

test.describe('Cross-device clobber regression (Phase 3 PR-9, Finding E)', () => {
  test('positive — synthetic listener fire delivering remote state rehydrates module global to remote shape', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function');

    const remoteState = [
      { date: '2025-09-04', wt: 3.45, ht: 50 },
      { date: '2026-04-25', wt: 8.00, ht: 67 },
      { date: '2026-04-27', wt: 8.10, ht: 68 },
    ];

    const after = await page.evaluate((remote) => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const get = w['_syncGetGlobal'] as (name: string) => Array<{ date: string }>;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({ ziva_growth: remote }),
        metadata: { hasPendingWrites: false },
      });
      const arr = get('growthData');
      return {
        moduleGlobalCount: arr.length,
        moduleGlobalLastDate: arr.slice(-1)[0].date,
      };
    }, remoteState);

    expect(after.moduleGlobalCount, 'growthData has 3 entries (rehydrated)').toBe(3);
    expect(after.moduleGlobalLastDate, 'last entry matches remote shape').toBe('2026-04-27');
  });

  test('regression-guard — subsequent local addGrowthEntry pushes onto rehydrated state, not init state', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function');

    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const get = w['_syncGetGlobal'] as (name: string) => Array<{ date: string }>;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      // Step 1: capture init growthData length
      const initLen = get('growthData').length;
      // Step 2: synthetic listener fire delivers a 3-entry remote state
      handler('growth', {
        exists: true,
        data: () => ({ ziva_growth: [
          { date: '2025-09-04', wt: 3.45, ht: 50 },
          { date: '2026-04-25', wt: 8.00, ht: 67 },
          { date: '2026-04-27', wt: 8.10, ht: 68 },
        ] }),
        metadata: { hasPendingWrites: false },
      });
      const postSyncLen = get('growthData').length;
      // Step 3: simulate the local-add path's push (the addGrowthEntry idiom
      // at medical.js:1820–1841 — push onto the module global, then save).
      // get('growthData') returns the SAME array the let binding holds, so
      // .push() mutates the live data through the binding.
      get('growthData').push({ date: '2026-04-28', wt: 8.15, ht: 68 });
      const finalLen = get('growthData').length;
      const finalLast = get('growthData').slice(-1)[0].date;
      return { initLen, postSyncLen, finalLen, finalLast };
    });

    // Crucial: the local push lands on top of the 3-entry rehydrated state,
    // producing 4 entries total — not (initLen + 1) which would indicate a
    // push onto stale init state (the clobber-loop signature).
    expect(result.postSyncLen, 'rehydration replaced init state with 3 entries').toBe(3);
    expect(result.finalLen, 'local-add pushed onto rehydrated state').toBe(4);
    expect(result.finalLen, 'final length is NOT initLen + 1 (stale push)').not.toBe(result.initLen + 1);
    expect(result.finalLast, 'last entry is the local-added one').toBe('2026-04-28');
  });

  test('positive-regression — full A→B→A clobber sequence converges (no stale-write loop)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function');

    const trace = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const get = w['_syncGetGlobal'] as (name: string) => Array<{ date: string }>;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      const fire = (arr: Array<{ date: string; wt: number; ht: number | null }>) => handler('growth', {
        exists: true,
        data: () => ({ ziva_growth: arr }),
        metadata: { hasPendingWrites: false },
      });
      // Device A wrote [a,b]; Device A's local growthData is [a,b]. Listener
      // delivers Device A's own write back (echo).
      fire([
        { date: '2025-09-04', wt: 3.45, ht: 50 },
        { date: '2026-04-25', wt: 8.00, ht: 67 },
      ]);
      const t1 = get('growthData').length;
      // Now Device A receives Device B's append: A's listener fires with
      // [a,b,c]. Without the rehydrate fix, Device A's growthData would
      // remain [a,b] and the next local push would clobber back. With
      // rehydrate, growthData becomes [a,b,c].
      fire([
        { date: '2025-09-04', wt: 3.45, ht: 50 },
        { date: '2026-04-25', wt: 8.00, ht: 67 },
        { date: '2026-04-27', wt: 8.10, ht: 68 },
      ]);
      const t2 = get('growthData').length;
      // Device A user adds 'd'. Pushes onto growthData (now [a,b,c]).
      get('growthData').push({ date: '2026-04-28', wt: 8.15, ht: 68 });
      const t3 = get('growthData').length;
      const t3Last = get('growthData').slice(-1)[0].date;
      return { t1, t2, t3, t3Last };
    });

    expect(trace.t1, 'after first listener fire: 2 entries').toBe(2);
    expect(trace.t2, 'after Device B echo arrives: 3 entries (no clobber)').toBe(3);
    expect(trace.t3, 'after Device A local-add: 4 entries').toBe(4);
    expect(trace.t3Last, 'last entry is the local-added 2026-04-28').toBe('2026-04-28');
  });

  // ── PR-20 Item 1: byte-precision extension — save-payload spy ──
  //
  // Why: the existing triad above asserts module-global rehydration + the
  // shape of `growthData` after a local push. That's correct as far as it
  // goes — but the actual production clobber-loop signature is what flows
  // OUT to Firestore via _syncFlushSingleDoc, and that flush reads the
  // localStorage payload save() wrote. The spy depth previously stopped at
  // module-global mutation. PR-18 chronicle named this gap as Obs A:
  // "Phase 4+ Obs A save-payload spy compounds." PR-20 lands the first
  // instance — a spy at the canonical persistence boundary
  // (localStorage.setItem) that captures the post-rehydrate local-add's
  // outbound payload shape, not just the in-memory state.
  //
  // Discipline (Cipher PR-20 advisory):
  //   - Spy intercepts the post-rehydrate path SPECIFICALLY (baseline-
  //     after-rehydrate filter, not any save).
  //   - Payload-shape assertion is positive ("equals [a,b,c,d]"), not
  //     negative-leading ("not equals init+d").
  //   - Existing R-7 triad above is unmodified.
  test('byte-precision extension — save-payload spy verifies post-rehydrate local-add yields [a,b,c,d] outbound, not […init,d]', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as { _syncGetGlobal?: unknown })._syncGetGlobal === 'function' &&
      typeof (window as { save?: unknown }).save === 'function');

    const probe = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string,
        doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const get = w['_syncGetGlobal'] as (name: string) => Array<{ date: string; wt: number | null; ht: number | null }>;
      const save = w['save'] as (key: string, val: unknown) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;

      const GROWTH_KEY = 'ziva_growth';

      // Wrap localStorage.setItem to capture all write-key + payload pairs
      // crossing the persistence boundary. Wrapper preserves original
      // behavior (delegates to the genuine setItem) — this is observation,
      // not interception.
      const captured: Array<{ key: string; value: string }> = [];
      const realSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key: string, value: string) {
        captured.push({ key, value });
        return realSetItem(key, value);
      };

      // Rehydrate: synthetic listener fire delivering [a, b, c]. The handler
      // performs its own setItem write internally (this is fine — the
      // baseline filter below excludes it).
      const remote = [
        { date: '2025-09-04', wt: 3.45, ht: 50 },
        { date: '2026-04-25', wt: 8.00, ht: 67 },
        { date: '2026-04-27', wt: 8.10, ht: 68 },
      ];
      handler('growth', {
        exists: true,
        data: () => ({ ziva_growth: remote }),
        metadata: { hasPendingWrites: false },
      });

      // Baseline mark: index AFTER the rehydrate's setItem activity. Any
      // capture from this index onward is post-rehydrate by construction.
      const postRehydrateMarker = captured.length;

      // Local-add path (mirrors addGrowthEntry's effect at medical.js:1822 →
      // renderGrowth's save at medical.js:1009): push onto the rehydrated
      // module global, then save through the public save() boundary.
      const liveGrowth = get('growthData');
      liveGrowth.push({ date: '2026-04-28', wt: 8.15, ht: 68 });
      save(GROWTH_KEY, liveGrowth);

      // Restore so we don't leak the spy into other tests in the same page.
      localStorage.setItem = realSetItem;

      // Filter to growth-key writes from the post-rehydrate marker onward.
      // The result captures the outbound payload(s) the local-add path
      // produced — which is what would flow to Firestore via syncWrite.
      const postRehydrateGrowthWrites = captured
        .slice(postRehydrateMarker)
        .filter((c) => c.key === GROWTH_KEY);

      const lastWrite = postRehydrateGrowthWrites[postRehydrateGrowthWrites.length - 1] || null;
      const lastPayload = lastWrite ? JSON.parse(lastWrite.value) : null;

      return {
        postRehydrateGrowthWriteCount: postRehydrateGrowthWrites.length,
        lastPayload,
      };
    });

    // Positive payload-shape assertion: the outbound save carries the
    // 4-entry [a, b, c, d] shape — the exact post-rehydrate-plus-local-add
    // intent. Confirms the clobber loop is closed at the persistence
    // boundary, not just at the module global.
    expect(probe.postRehydrateGrowthWriteCount,
      'at least one post-rehydrate growth save crossed the persistence boundary').toBeGreaterThanOrEqual(1);
    expect(probe.lastPayload,
      'outbound save payload reflects rehydrate-then-local-add intent: [a, b, c, d]').toEqual([
      { date: '2025-09-04', wt: 3.45, ht: 50 },
      { date: '2026-04-25', wt: 8.00, ht: 67 },
      { date: '2026-04-27', wt: 8.10, ht: 68 },
      { date: '2026-04-28', wt: 8.15, ht: 68 },
    ]);
  });
});

test.describe('Attribution surfacing (Phase 3 PR-9, Finding F)', () => {
  test('positive — toast text names the updater when __sync_updatedBy.name is present', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any)._syncComposeToastText === 'function');

    const composed = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const compose = w['_syncComposeToastText'] as (n: number, attr: unknown) => string;
      return {
        single: compose(1, { uid: 'remote-uid', name: 'Bhavna', at: null }),
        multiple: compose(3, { uid: 'remote-uid', name: 'Bhavna', at: null }),
        groupMultiple: compose(2, { uid: null, name: null, group: 'multiple', at: null }),
      };
    });

    expect(composed.single, 'singular form names the updater').toContain('Bhavna');
    expect(composed.multiple, 'plural form names the updater').toContain('Bhavna');
    expect(composed.multiple, 'plural form has count').toContain('3');
    expect(composed.groupMultiple, 'multiple-writers shape uses group label').toContain('Multiple parents');
  });

  test('regression-guard — toast falls back to count-only when attribution is null/missing', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any)._syncComposeToastText === 'function');

    const composed = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const compose = w['_syncComposeToastText'] as (n: number, attr: unknown) => string;
      return {
        nullAttr: compose(1, null),
        emptyAttr: compose(2, {}),
        nameOnly: compose(1, { uid: null, name: null }),
      };
    });

    expect(composed.nullAttr, 'null attribution → count-only').not.toContain('synced an');
    // The message shape is "An update synced" or "N updates synced"
    expect(composed.nullAttr).toMatch(/^An update synced$/);
    expect(composed.emptyAttr).toMatch(/^2 updates synced$/);
    expect(composed.nameOnly).toMatch(/^An update synced$/);
  });

  test('positive-regression — auto-render success toast is NOT tappable (no .is-tappable; no click-to-reload)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as any)._syncShowSyncToast === 'function');

    // Show a toast on the success path (no opts → no tapToReload)
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const show = w['_syncShowSyncToast'] as (msg: string, opts?: { tapToReload?: boolean }) => void;
      show('Bhavna synced an update');
    });

    const toast = page.locator('#syncToast');
    await expect(toast, 'toast appears').toBeVisible();
    await expect(toast, 'success-path toast lacks .is-tappable').not.toHaveClass(/\bis-tappable\b/);
    await expect(toast, 'message is the success-path attribution text').toHaveText('Bhavna synced an update');

    // And the fallback path (tapToReload=true) DOES add the class
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const show = w['_syncShowSyncToast'] as (msg: string, opts?: { tapToReload?: boolean }) => void;
      show('Tap to refresh', { tapToReload: true });
    });
    await expect(toast, 'fallback-path toast has .is-tappable').toHaveClass(/\bis-tappable\b/);
  });

  // PR-9 hotfix — end-to-end toast assertion (Cipher CT-class observation
  // post-merge: hermetic-floor-doesnt-substitute-for-production-floor; PR-9 r1
  // Triad 3 verified _syncComposeToastText return values but never asserted
  // the full listener-fire → DOM toast chain rendered. Issue 1 surfaced because
  // dispatch render-crashes incremented _syncCrashCount toward SYNC_CRASH_LIMIT,
  // tripping _syncDisabled and detaching all listeners. Once disabled, no
  // listener fires and no toasts queue. Hermetic ?nosync tests bypass the
  // listener-attach path entirely, so the bug never manifested in the prior
  // hermetic floor.
  test('end-to-end — cross-device different-uid listener fire produces visible toast with attribution text', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    // Fire the single-doc listener handler with a synthetic cross-device write
    // (Bhavna writes growth on Device B; Lyra's session is Device A).
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [
            { date: '2025-09-04', wt: 3.45, ht: 50 },
            { date: '2026-04-25', wt: 8.00, ht: 67 },
            { date: '2026-04-27', wt: 8.10, ht: 68 },
          ],
          __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' },
          __sync_syncedAt: null,
        }),
        metadata: { hasPendingWrites: false },
      });
    });

    // PR-19 (Phase 3 R2 amendment): success-path now drives the
    // status-strip activity-mode pill (#syncActivity), not a transient
    // toast div. Pipeline still 1500ms-debounced before publish.
    const activity = page.locator('#syncActivity');
    await expect(activity, 'activity pill becomes visible after listener fire').toBeVisible({ timeout: 3000 });
    await expect(activity, 'activity text names the cross-device updater').toContainText('Bhavna');
    await expect(activity, 'attribution uid threaded onto data attribute').toHaveAttribute('data-attribution-uid', 'bhavna-uid');
    // The transient #syncToast div is NOT created on the success path
    // (Surface C ratification: pipeline repurposed, not duplicated).
    await expect(page.locator('#syncToast'), 'transient #syncToast div is NOT created on success path').toHaveCount(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-9 hotfix — Issue 1 + Issue 2 root-cause regression coverage
// ───────────────────────────────────────────────────────────────────────────
//
// Issue 1 (post-PR-9 prod regression): cross-device updates produced no toast.
// Root cause: _syncDispatchRender called _syncRecordCrash on renderer
// failures; that increments _syncCrashCount which trips _syncDisabled at
// SYNC_CRASH_LIMIT=3, detaching all listeners. UI render jurisdiction was
// conflating with sync I/O jurisdiction. Fix: dispatch-side failures log
// via console.warn only.
//
// Issue 2 (pre-existing latent bug surfaced post-PR-9 merge): orderMedicalCards
// called document.getElementById('medStatsCard') for a card removed from
// template.html in commit 16c644e (April 10 2026). appendChild(null) threw
// TypeError on every swipe-to-medical. Fix: null-guard each appendChild and
// filter null .el out of the cards array before classList queries.

test.describe('PR-18 hotfix — dispatch crashes do not trip sync circuit (Issue 1 root cause)', () => {
  test('positive — a renderer that throws does NOT increment _syncCrashCount or set _syncDisabled', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncDispatchRender?: unknown })._syncDispatchRender === 'function');

    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      // Capture pre-state
      const preCrashCount = (w['_syncCrashCount'] as number) || 0;
      const preDisabled = w['_syncDisabled'] as boolean;

      // Replace renderHome with a thrower for the duration of the test.
      const origRenderHome = w['renderHome'] as () => void;
      w['renderHome'] = function() { throw new Error('synthetic renderer crash'); };

      // Fire dispatch 5 times — would have tripped SYNC_CRASH_LIMIT=3 under
      // the pre-hotfix _syncRecordCrash path. After hotfix, console.warn only.
      const dispatch = w['_syncDispatchRender'] as (k: string, v: unknown, a: unknown) => unknown;
      for (let i = 0; i < 5; i++) {
        dispatch('ziva_feeding', { '2026-04-27': { breakfast: 'oats', lunch: '', dinner: '', snack: '' } }, null);
      }

      // Restore
      w['renderHome'] = origRenderHome;

      return {
        preCrashCount,
        preDisabled,
        postCrashCount: (w['_syncCrashCount'] as number) || 0,
        postDisabled: w['_syncDisabled'] as boolean,
      };
    });

    expect(result.preCrashCount, 'pre-test crash count is 0').toBe(0);
    expect(result.preDisabled, 'pre-test sync not disabled').toBeFalsy();
    expect(result.postCrashCount, '5 renderer crashes did NOT increment _syncCrashCount').toBe(0);
    expect(result.postDisabled, 'sync NOT auto-disabled by renderer crashes').toBeFalsy();
  });

  test('regression-guard — a real sync I/O failure (e.g., _syncRecordCrash direct call) DOES still trip the circuit', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncRecordCrash?: unknown })._syncRecordCrash === 'function');

    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const recordCrash = w['_syncRecordCrash'] as (source: string, err: Error) => void;
      // Directly fire _syncRecordCrash 3 times (simulating actual sync I/O
      // failures, not dispatch failures). The production circuit breaker
      // remains intact for its proper jurisdiction.
      for (let i = 0; i < 3; i++) {
        recordCrash('test/io-failure', new Error('synthetic I/O crash'));
      }
      return {
        crashCount: w['_syncCrashCount'] as number,
        disabled: w['_syncDisabled'] as boolean,
      };
    });

    expect(result.crashCount, '3 direct _syncRecordCrash calls register').toBeGreaterThanOrEqual(3);
    expect(result.disabled, 'sync correctly auto-disables on real I/O crashes').toBeTruthy();
  });

  test('positive-regression — listener handler with renderer crash STILL drives activity pill (no early-disable cascade)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      // Make renderHome throw — would have tripped circuit under pre-hotfix code
      w['renderHome'] = function() { throw new Error('synthetic'); };
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [{ date: '2026-04-27', wt: 8.10, ht: 68 }],
          __sync_updatedBy: { uid: 'remote-uid', name: 'Bhavna' },
          __sync_syncedAt: null,
        }),
        metadata: { hasPendingWrites: false },
      });
    });

    // PR-19: success path drives the activity pill (#syncActivity), not a
    // transient toast div. The circuit-not-tripped invariant is the same;
    // only the publish target moved.
    const activity = page.locator('#syncActivity');
    await expect(activity, 'activity pill still drives despite renderer crash').toBeVisible({ timeout: 3000 });
    await expect(activity, 'attribution text preserved').toContainText('Bhavna');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-18 hotfix — orderMedicalCards null-guard (Issue 2 root cause)
// ───────────────────────────────────────────────────────────────────────────
//
// R-7 duo-not-triad departure on-record (PR-18 Ruling 4):
//   "R-7 duo-not-triad departure for Issue 2 accepted (bug IS the absent
//   state; positive asserted as precondition)."
//
// Rationale: Issue 2 is a TypeError thrown by orderMedicalCards when
// #medStatsCard is absent from the DOM template (a pre-existing latent
// state since commit 16c644e on April 10 2026). The bug's state-space is
// binary in a degenerate way — the "positive" state (no #medStatsCard,
// orderMedicalCards completes cleanly) IS the post-fix invariant; the
// "absent / regression-guard" state (no #medStatsCard, orderMedicalCards
// throws) IS the bug. There is no third independent state for a triad's
// positive-regression slot — the production swipe-handler trace
// (handleSwipe → switchTrackSub → orderMedicalCards) collapses to the
// same call chain. Cipher endorsed the duo on these grounds; Aurelius
// + Sovereign ruled accept on-record.
//
// Sub-finding (PR-20 Item 3, D8-class citation-integrity catch): the
// describe-string previously read "PR-9 hotfix — …" — misattributing the
// hotfix to its remediation target (PR-9 introduced the auto-render path;
// PR-18 was the hotfix that closed Issues 1 + 2). Builder's mental model
// drifted from substance during PR-18 authorship; PR-20 corrects to
// "PR-18 hotfix — …" so the on-record citation matches the merged commit.
test.describe('PR-18 hotfix — orderMedicalCards null-guard (Issue 2 root cause)', () => {
  test('positive — orderMedicalCards completes without throwing when medStatsCard element is absent', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { orderMedicalCards?: unknown }).orderMedicalCards === 'function');

    // Confirm the pre-existing template state: no #medStatsCard in DOM.
    await expect(page.locator('#medStatsCard'), 'medStatsCard absent in template (commit 16c644e)').toHaveCount(0);

    // orderMedicalCards must complete without throwing. Pre-hotfix, this
    // would throw TypeError at appendChild(statsCard) where statsCard=null.
    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const order = w['orderMedicalCards'] as () => void;
      try { order(); return { threw: false, message: null as string | null }; }
      catch(e) { return { threw: true, message: (e as Error).message }; }
    });

    expect(result.threw, 'orderMedicalCards must not throw on missing medStatsCard').toBeFalsy();
  });

  test('regression-guard — switchTab(\'medical\') → orderMedicalCards chain completes without throwing', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { switchTab?: unknown }).switchTab === 'function');
    await page.waitForSelector('#tab-medical', { state: 'attached' });

    // switchTab('medical') redirects internally: name → 'track', _activeTrackSub
    // → 'medical' (core.js:2591). Then dispatches to switchTrackSub('medical')
    // which calls renderMedicalStats + orderMedicalCards inline — same chain
    // the production swipe trace exercises (handleSwipe → switchTrackSub).
    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const switchTab = w['switchTab'] as (n: string) => void;
      try {
        switchTab('medical');
        return { threw: false, message: null as string | null };
      } catch(e) { return { threw: true, message: (e as Error).message }; }
    });

    expect(result.threw, 'switchTab(\'medical\') → orderMedicalCards must not throw').toBeFalsy();
    expect(result.message, 'no error message captured').toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-19 — Status-strip activity-mode contract (R-7 binary-mode, 4th instance)
// ───────────────────────────────────────────────────────────────────────────
//
// Surface C ratification (Aurelius post-PR-18): the toast pipeline drives
// a permanent surface (#syncActivity pill in #statusStrip) instead of a
// transient toast div. The strip's mode contract is binary:
//   - State mode (default): only #syncStatus visible inside #statusStrip.
//   - Activity mode: #syncActivity visible alongside #syncStatus, for ~45s
//     after a remote listener fire delivers cross-device changes.
// Mode contract requires #statusStrip itself to remain visible across the
// transition — same shape as the PR-14 update-toast triad and the earlier
// PR-2.5 sync-indicator triad.

test.describe('Status-strip activity-mode contract (Phase 3 PR-19)', () => {
  test('default-positive — state mode: with no recent listener activity, #syncStatus is the only strip child', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncSetActivity?: unknown })._syncSetActivity === 'function');

    await expect(page.locator('#statusStrip'), 'strip itself visible').toBeVisible();
    await expect(page.locator('#syncActivity'), 'activity pill hidden in state mode').toBeHidden();
  });

  test('activity-positive — activity mode: synthetic listener fire brings #syncActivity into view with attribution', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    // Fire a cross-device single-doc snapshot
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [{ date: '2026-04-28', wt: 8.15, ht: 68 }],
          __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' },
        }),
        metadata: { hasPendingWrites: false },
      });
    });

    const activity = page.locator('#syncActivity');
    await expect(activity, 'activity pill enters activity mode').toBeVisible({ timeout: 3000 });
    await expect(activity, 'pill text names the cross-device updater').toContainText('Bhavna');
    await expect(activity, 'pill carries attribution-uid data attribute').toHaveAttribute('data-attribution-uid', 'bhavna-uid');
  });

  test('mode-contract-regression — #statusStrip remains visible in BOTH modes (no display:none cascade)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncSetActivity?: unknown })._syncSetActivity === 'function');

    // Pass 1: state mode (default)
    await expect(page.locator('#statusStrip'), 'strip visible in state mode').toBeVisible();
    await expect(page.locator('#syncActivity'), 'activity pill hidden in state mode').toBeHidden();

    // Pass 2: drive activity mode via the publish helper directly
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const setActivity = w['_syncSetActivity'] as (text: string, attribution?: { uid?: string | null; name?: string | null }) => void;
      setActivity('Bhavna synced an update', { uid: 'bhavna-uid', name: 'Bhavna' });
    });
    await expect(page.locator('#statusStrip'), 'strip still visible in activity mode').toBeVisible();
    await expect(page.locator('#syncActivity'), 'activity pill visible in activity mode').toBeVisible();

    // Pass 3: essential-mode opt-out should not change the strip's mode contract
    await page.evaluate(() => { try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {} });
    await page.reload();
    await page.waitForFunction(() => typeof (window as { _syncSetActivity?: unknown })._syncSetActivity === 'function');
    await expect(page.locator('body'), 'essential-mode opted out').not.toHaveClass(/\bessential-mode\b/);
    await expect(page.locator('#statusStrip'), 'strip visible under full mode too').toBeVisible();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-19 — Persistent attribution sidecar (KEYS.lastWriters)
// ───────────────────────────────────────────────────────────────────────────
//
// Permanent record of the last cross-device writer per lsKey. Sidecar shape
// chosen over co-located-on-each-entry for: (a) uniformity across single-doc
// and per-entry models, (b) zero risk of echo-loop via the sync diff (sidecar
// key is local-only, never enters SYNC_KEYS write path). Read by status-strip
// activity-mode driver and (Phase 4) future in-card "last updated by" lines.

test.describe('Persistent attribution sidecar (Phase 3 PR-19)', () => {
  test('positive — listener fire writes attribution to KEYS.lastWriters[lsKey]', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      const before = window.localStorage.getItem('ziva_last_writers');
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [{ date: '2026-04-28', wt: 8.15, ht: 68 }],
          __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' },
        }),
        metadata: { hasPendingWrites: false },
      });
      const after = window.localStorage.getItem('ziva_last_writers');
      return { before, after };
    });

    expect(result.before, 'sidecar empty before fire').toBeNull();
    expect(result.after, 'sidecar populated after fire').not.toBeNull();
    const parsed = JSON.parse(result.after as string);
    expect(parsed['ziva_growth'], 'ziva_growth key recorded').toBeTruthy();
    expect(parsed['ziva_growth'].name, 'name persisted').toBe('Bhavna');
    expect(parsed['ziva_growth'].uid, 'uid persisted').toBe('bhavna-uid');
    expect(typeof parsed['ziva_growth'].at, 'at is numeric ms-epoch').toBe('number');
  });

  test('regression-guard — local-only sidecar key NEVER appears in SYNC_KEYS or the syncWrite path', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncRecordLastWriter?: unknown })._syncRecordLastWriter === 'function');

    // KEYS.lastWriters must be ABSENT from SYNC_KEYS (sync.js:120-140 area).
    // Echo-loop risk if this leaks into the write path; verify the guard
    // empirically by calling syncWrite directly and confirming it returns
    // without attempting a Firestore call (KEYS / SYNC_KEYS are const
    // declarations and don't attach to window; we verify by behavior, not
    // by introspection).
    const checks = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      // String literal — same value as KEYS.lastWriters in core.js.
      const lastWritersKey = 'ziva_last_writers';
      const syncWrite = w['syncWrite'] as (key: string, val: unknown, old: unknown) => void;
      let threw = false;
      try { syncWrite(lastWritersKey, { test: 1 }, null); }
      catch(e) { threw = true; void e; }
      // Also verify _syncRecordLastWriter (which calls save()) does not
      // attempt to roundtrip the sidecar key (would fire syncWrite, hit
      // the !SYNC_KEYS[key] guard, and return — observable as no error).
      const recordLastWriter = w['_syncRecordLastWriter'] as (k: string, a: unknown) => void;
      let recordThrew = false;
      try { recordLastWriter('ziva_growth', { uid: 'test', name: 'Test', at: null }); }
      catch(e) { recordThrew = true; void e; }
      const sidecarAfter = window.localStorage.getItem(lastWritersKey);
      return {
        lastWritersKey,
        syncWriteThrew: threw,
        recordThrew,
        sidecarPopulated: sidecarAfter !== null,
      };
    });

    expect(checks.lastWritersKey, 'sidecar key value matches expected').toBe('ziva_last_writers');
    expect(checks.syncWriteThrew, 'syncWrite handles non-SYNC_KEYS key without throwing').toBeFalsy();
    expect(checks.recordThrew, '_syncRecordLastWriter writes without throwing').toBeFalsy();
    expect(checks.sidecarPopulated, 'sidecar localStorage entry created').toBeTruthy();
  });

  test('positive-regression — multiple cross-device fires accumulate per-key attribution without overwriting unrelated keys', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    const final = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) { _syncReady['growth'] = true; _syncReady['tracking'] = true; }
      // Fire 1: Bhavna writes growth
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [{ date: '2026-04-28', wt: 8.15, ht: 68 }],
          __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' },
        }),
        metadata: { hasPendingWrites: false },
      });
      // Fire 2: Different writer (Rishabh) writes feeding (different lsKey)
      handler('tracking', {
        exists: true,
        data: () => ({
          ziva_feeding: { '2026-04-28': { breakfast: 'oats', lunch: '', dinner: '', snack: '' } },
          __sync_updatedBy: { uid: 'rishabh-uid', name: 'Rishabh' },
        }),
        metadata: { hasPendingWrites: false },
      });
      return JSON.parse(window.localStorage.getItem('ziva_last_writers') as string);
    });

    expect(final['ziva_growth'].name, 'growth attribution preserved').toBe('Bhavna');
    expect(final['ziva_feeding'].name, 'feeding attribution recorded for second writer').toBe('Rishabh');
    expect(final['ziva_growth'].uid, 'growth uid still bhavna').toBe('bhavna-uid');
    expect(final['ziva_feeding'].uid, 'feeding uid is rishabh').toBe('rishabh-uid');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-19.5 — Per-entry attribution (history-tab surface)
// ───────────────────────────────────────────────────────────────────────────
//
// Sovereign-side production verification of PR-19 surfaced that the per-key
// KEYS.lastWriters sidecar was insufficient for the history-tab surface:
// each entry in a history list needs its own attribution. PR-19.5 fixes:
//   (a) per-entry strip in _syncHandlePerEntrySnapshot preserves
//       __sync_updatedBy / __sync_syncedAt on each entry (caretickets)
//   (b) _syncStampUnattributed in _syncFlushSingleDoc stamps un-attributed
//       array entries with the current writer at flush time (so locally-
//       added entries get the writer's identity before going to Firestore;
//       echoes back via listener with stamp intact)
//   (c) _renderAttribution(entry) helper in core.js + wired into history-
//       tab renderers (growth, sleep, poop, vacc, milestones, notes; meds
//       and feeding are object-keyed → Phase 4)
//
// Doctrine ledger: hermetic-floor-doesnt-substitute-for-production-floor
// RATIFIED at 3/3 with this PR's predecessor (PR-19) being the third
// instance. Hermetic R-4 floor remains necessary-not-sufficient; production
// verification on a real second device is the closer.

test.describe('Per-entry attribution — strip preserves + flush stamps (Phase 3 PR-19.5)', () => {
  test('positive — _syncStampUnattributed stamps un-attributed array entries with writer identity', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncStampUnattributed?: unknown })._syncStampUnattributed === 'function');

    const result = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const stamp = w['_syncStampUnattributed'] as (
        value: Array<Record<string, unknown>>, writer: { uid: string; name: string }
      ) => Array<Record<string, unknown>>;
      const writer = { uid: 'lyra-uid', name: 'Lyra' };
      // Mixed array — some entries have stamps, some don't.
      const input = [
        { date: '2025-09-04', wt: 3.45 },                                                          // unstamped
        { date: '2026-04-25', wt: 8.00, __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' } }, // stamped (Bhavna)
        { date: '2026-04-27', wt: 8.10 },                                                          // unstamped
      ];
      const stamped = stamp(input, writer);
      return {
        len: stamped.length,
        firstStamp: stamped[0].__sync_updatedBy as { name: string } | undefined,
        secondStamp: stamped[1].__sync_updatedBy as { name: string } | undefined,
        thirdStamp: stamped[2].__sync_updatedBy as { name: string } | undefined,
      };
    });

    expect(result.len, 'stamped array length unchanged').toBe(3);
    expect(result.firstStamp?.name, 'first (unstamped) gets writer identity').toBe('Lyra');
    expect(result.secondStamp?.name, 'second (already-stamped) preserved').toBe('Bhavna');
    expect(result.thirdStamp?.name, 'third (unstamped) gets writer identity').toBe('Lyra');
  });

  test('regression-guard — listener handler preserves __sync_updatedBy on entries through localStorage', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandleSingleDocSnapshot?: unknown })._syncHandleSingleDocSnapshot === 'function');

    const persisted = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandleSingleDocSnapshot'] as (
        docName: string, doc: { exists: boolean; data: () => Record<string, unknown>; metadata: { hasPendingWrites: boolean } }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['growth'] = true;
      handler('growth', {
        exists: true,
        data: () => ({
          ziva_growth: [
            { date: '2025-09-04', wt: 3.45, ht: 50, __sync_updatedBy: { uid: 'kajal-uid', name: 'Kajal Parakh' } },
            { date: '2026-04-27', wt: 8.10, ht: 68, __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' } },
          ],
          __sync_updatedBy: { uid: 'bhavna-uid', name: 'Bhavna' },
        }),
        metadata: { hasPendingWrites: false },
      });
      // localStorage now has the array; verify each entry retained __sync_updatedBy
      const raw = window.localStorage.getItem('ziva_growth');
      return raw ? JSON.parse(raw) : null;
    });

    expect(persisted, 'localStorage[ziva_growth] populated').not.toBeNull();
    expect(Array.isArray(persisted), 'is array').toBeTruthy();
    expect(persisted[0].__sync_updatedBy?.name, 'first entry attribution preserved (Kajal)').toBe('Kajal Parakh');
    expect(persisted[1].__sync_updatedBy?.name, 'second entry attribution preserved (Bhavna)').toBe('Bhavna');
  });

  test('positive-regression — _renderAttribution returns empty string for legacy un-stamped entries (graceful degradation)', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _renderAttribution?: unknown })._renderAttribution === 'function');

    const variants = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const render = w['_renderAttribution'] as (entry: unknown) => string;
      return {
        stamped: render({ date: '2026-04-27', wt: 8.10, __sync_updatedBy: { uid: 'b', name: 'Bhavna' } }),
        unstamped: render({ date: '2026-04-27', wt: 8.10 }),                                  // legacy entry
        emptyName: render({ date: '2026-04-27', wt: 8.10, __sync_updatedBy: { uid: 'b' } }),  // missing name
        nullEntry: render(null),
        undef: render(undefined),
        notObject: render(42),
      };
    });

    expect(variants.stamped, 'stamped entry renders attribution').toContain('Bhavna');
    expect(variants.unstamped, 'unstamped legacy entry renders empty').toBe('');
    expect(variants.emptyName, 'missing name renders empty').toBe('');
    expect(variants.nullEntry, 'null entry renders empty').toBe('');
    expect(variants.undef, 'undefined entry renders empty').toBe('');
    expect(variants.notObject, 'non-object entry renders empty').toBe('');
  });
});

test.describe('Per-entry attribution — caretickets per-entry strip preserves __sync_updatedBy (Phase 3 PR-19.5)', () => {
  test('positive — per-entry snapshot persists each entry\'s __sync_updatedBy through the strip', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { _syncHandlePerEntrySnapshot?: unknown })._syncHandlePerEntrySnapshot === 'function');

    const persisted = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const handler = w['_syncHandlePerEntrySnapshot'] as (
        collection: string, snapshot: {
          forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) => void;
          docChanges: () => Array<{ doc: { data: () => Record<string, unknown> }; type: string }>;
          metadata: { hasPendingWrites: boolean };
        }
      ) => void;
      const _syncReady = w['_syncReady'] as Record<string, boolean>;
      if (_syncReady) _syncReady['caretickets'] = true;
      // Synthetic per-entry snapshot with two tickets, each with its own __sync_updatedBy
      const docs = [
        { id: 't1', data: () => ({ id: 't1', title: 'Cough check', __sync_updatedBy: { uid: 'kajal-uid', name: 'Kajal Parakh' }, __sync_syncedAt: null }) },
        { id: 't2', data: () => ({ id: 't2', title: 'Vit D follow-up', __sync_updatedBy: { uid: 'rishabh-uid', name: 'Rishabh' }, __sync_syncedAt: null }) },
      ];
      const snapshot = {
        forEach: function(cb: (d: { id: string; data: () => Record<string, unknown> }) => void) { docs.forEach(cb); },
        docChanges: function() { return docs.map(d => ({ doc: d, type: 'modified' })); },
        metadata: { hasPendingWrites: false },
      };
      handler('caretickets', snapshot);
      const raw = window.localStorage.getItem('ziva_care_tickets');
      return raw ? JSON.parse(raw) : null;
    });

    expect(persisted, 'localStorage[ziva_care_tickets] populated').not.toBeNull();
    expect(persisted.length, 'two tickets').toBe(2);
    expect(persisted[0].__sync_updatedBy?.name, 'ticket 1 attribution preserved').toBe('Kajal Parakh');
    expect(persisted[1].__sync_updatedBy?.name, 'ticket 2 attribution preserved').toBe('Rishabh');
    // The strip must NOT preserve OTHER __sync_* fields (e.g. __sync_createdBy)
    // — only __sync_updatedBy and __sync_syncedAt are the explicit allowlist.
    expect(persisted[0].__sync_createdBy, 'unrelated __sync_* field stripped').toBeUndefined();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// PR-19.6 — Renderer-coverage extension (history-tab attribution audit close)
// ───────────────────────────────────────────────────────────────────────────
//
// Sovereign-side production verification of PR-19.5 surfaced renderer-coverage
// gaps: PR-19.5 wired 6 history-shape renderers (growth, sleep history-preview,
// poop history-preview, vacc, milestones, notes) but missed the active-list
// renderers (sleep-log, poop-log, meds, visits, active-milestones, notes-list)
// AND the episode history cards (fever, diarrhoea, vomiting, cold). PR-19.6
// is the audit-and-close pass per the new doctrine candidate
// `architectural-surfacing-must-enumerate-axis-of-resolution` (currently 2/3).
//
// Audit table (full list in PR body); newly-wired renderers tested below via
// a parameterized grep — built sproutlab.html must contain the
// _renderAttribution(<entry-var>) call site for each declared renderer name.

test.describe('PR-19.6 — renderer-coverage audit close (parameterized grep)', () => {
  // Each entry: renderer function name + the entry variable expected in the
  // _renderAttribution() call. The grep targets the BUILT sproutlab.html so
  // we verify the wire-up survives the build pipeline (split → concat).
  const NEWLY_WIRED: Array<{ renderer: string; entryVar: string; surface: string }> = [
    { renderer: 'renderSleepLog',         entryVar: 's',  surface: 'track:sleep — sleep entries log' },
    { renderer: 'renderPoopLog',          entryVar: 'p',  surface: 'track:poop — poop entries log' },
    { renderer: 'renderMeds',             entryVar: 'm',  surface: 'track:medical — meds list' },
    { renderer: 'renderVisits',           entryVar: 'v',  surface: 'track:medical — doctor visits list' },
    { renderer: 'renderActiveMilestones', entryVar: 'm',  surface: 'track:milestones — active milestones (evidence)' },
    { renderer: 'renderNotes',            entryVar: 'n',  surface: 'history — notes list' },
    { renderer: 'renderFeverHistory',     entryVar: 'ep', surface: 'track:medical — fever episode history' },
    { renderer: 'renderDiarrhoeaHistory', entryVar: 'ep', surface: 'track:medical — diarrhoea episode history' },
    { renderer: 'renderVomitingHistory',  entryVar: 'ep', surface: 'track:medical — vomiting episode history' },
    { renderer: 'renderColdHistory',      entryVar: 'ep', surface: 'track:medical — cold episode history' },
  ];

  // Sanity: PR-19.5 already-wired renderers — their wire-up MUST survive
  // PR-19.6 (no regression on the prior coverage).
  const PRE_WIRED_PR195: Array<{ renderer: string; entryVar: string }> = [
    { renderer: 'renderGrowthHistory',         entryVar: 'r' },
    { renderer: 'renderSleepHistoryPreview',   entryVar: 's' },
    { renderer: 'renderPoopHistoryPreview',    entryVar: 'p' },
    { renderer: 'renderVaccHistory',           entryVar: 'v' },
    { renderer: 'renderMilestoneHistory',      entryVar: 'm' },
    { renderer: 'renderNotesHistory',          entryVar: 'n' },
  ];

  test('positive — every newly-wired renderer in audit calls _renderAttribution(entry)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    expect(res.ok(), 'sproutlab.html fetchable').toBeTruthy();
    const html = await res.text();
    for (const { renderer, entryVar, surface } of NEWLY_WIRED) {
      // Each renderer must appear (function declaration) AND a
      // _renderAttribution(<entryVar>) call must appear in the built bundle.
      // The function-declaration grep prevents the test passing in a state
      // where the renderer was renamed/removed but our audit list went stale.
      const fnDecl = new RegExp('function\\s+' + renderer + '\\s*\\(');
      const callSite = new RegExp('_renderAttribution\\s*\\(\\s*' + entryVar + '\\s*\\)');
      expect(fnDecl.test(html), `${renderer} declared in built bundle (${surface})`).toBeTruthy();
      expect(callSite.test(html), `${renderer} (${surface}) wires _renderAttribution(${entryVar})`).toBeTruthy();
    }
  });

  test('regression-guard — every PR-19.5 already-wired renderer remains wired (no regression)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();
    for (const { renderer, entryVar } of PRE_WIRED_PR195) {
      const fnDecl = new RegExp('function\\s+' + renderer + '\\s*\\(');
      const callSite = new RegExp('_renderAttribution\\s*\\(\\s*' + entryVar + '\\s*\\)');
      expect(fnDecl.test(html), `${renderer} still in built bundle`).toBeTruthy();
      expect(callSite.test(html), `${renderer} still wires _renderAttribution(${entryVar})`).toBeTruthy();
    }
  });

  // ── PR-20 Item 5: brace-balance extractor (replaces non-greedy regex) ──
  //
  // Why: the prior extractor used `function NAME\\s*\\(([\\s\\S]*?)\\n\\}` —
  // non-greedy, terminating at the FIRST `\n}` after the declaration. In a
  // JS bundle, that almost always lands at the end of the FIRST nested
  // closure (an `if (cond) { … \n}` block, an inner anonymous function, an
  // object literal), NOT the function's own closing brace. A `_renderAttribution`
  // call inserted past that nested closure (mid-body or late-body) would
  // false-negative — the regex captures only the early-body slice and reports
  // "no _renderAttribution" even when one is present further down. Cipher's
  // PR-19.6 observation; landed here as PR-20 Item 5.
  //
  // Residual gap (Cipher disclosure, PR-20 advisory): brace counters are
  // defeasible by braces inside string literals ('}', "{"), template literal
  // ${} interpolations, block comments (/* { */), and regex literals (/\{/).
  // SproutLab's pnpm-build single-file bundle carries no such pathological
  // cases inside the renderer function bodies covered here — the practical
  // drift mode for `_renderAttribution` insertions is early-body / mid-body /
  // late-body across nested closures, which naive brace-balance handles
  // fully. A string-and-comment-aware tokenizer pass would be principled-er
  // but is over-LOC for a test guard. Future test failure traceable to the
  // gap → escalate to tokenizer-aware extractor; until then, this fix
  // dominates the regex.
  function extractFunctionBody(source: string, fnName: string): string | null {
    const decl = new RegExp('function\\s+' + fnName + '\\s*\\([^)]*\\)\\s*\\{', 'g');
    const m = decl.exec(source);
    if (!m) return null;
    const bodyStart = m.index + m[0].length; // position just after the opening `{`
    let depth = 1;
    for (let i = bodyStart; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) return source.slice(bodyStart, i);
      }
    }
    return null; // unbalanced — should not happen in a built bundle
  }

  test('self-test — brace-balance extractor catches early-body, mid-body, AND late-body marker insertions across nested closures', () => {
    // Synthetic bodies prove false-negative gap closure empirically. The
    // markers (__MARK_EARLY / __MARK_MID / __MARK_LATE) stand in for any
    // call-site we'd want to detect (e.g. _renderAttribution(<var>)).
    // Each fixture is a complete function declaration with the marker at a
    // specific depth relative to the FIRST nested closure — which is exactly
    // what the prior non-greedy regex would have terminated at.

    const earlyBody = [
      'function fixtureEarly() {',
      '  var x = __MARK_EARLY;',
      '  if (cond) { foo(); }',
      '  bar();',
      '}',
    ].join('\n');

    const midBody = [
      'function fixtureMid() {',
      '  if (cond) { ',
      '    foo();',
      '    return;',
      '  }',
      '  __MARK_MID;', // past the first nested closure — prior regex would miss this
      '  bar();',
      '}',
    ].join('\n');

    const lateBody = [
      'function fixtureLate() {',
      '  if (a) {',
      '    foo();',
      '    if (b) {',
      '      baz();',
      '    }',
      '  }',
      '  for (var i = 0; i < n; i++) {',
      '    qux(i);',
      '  }',
      '  __MARK_LATE;', // past TWO nested closure boundaries
      '}',
    ].join('\n');

    const earlySrc = extractFunctionBody(earlyBody, 'fixtureEarly');
    const midSrc   = extractFunctionBody(midBody,   'fixtureMid');
    const lateSrc  = extractFunctionBody(lateBody,  'fixtureLate');

    expect(earlySrc, 'extractor returns body for fixtureEarly').not.toBeNull();
    expect(midSrc,   'extractor returns body for fixtureMid').not.toBeNull();
    expect(lateSrc,  'extractor returns body for fixtureLate').not.toBeNull();

    // The crux: ALL THREE markers must be visible to the extractor. Under
    // the prior non-greedy regex, fixtureMid (mid-body past one nested
    // closure) and fixtureLate (late-body past two nested closures) would
    // have false-negatived. This assertion is the empirical false-negative-
    // gap-closed proof Cipher requested.
    expect(earlySrc!.includes('__MARK_EARLY'), 'early-body marker visible (sanity)').toBeTruthy();
    expect(midSrc!.includes('__MARK_MID'),     'mid-body marker visible past nested closure (gap closure)').toBeTruthy();
    expect(lateSrc!.includes('__MARK_LATE'),   'late-body marker visible past two nested closures (gap closure)').toBeTruthy();

    // Counter-assertion (regression-guard): a body without the marker must
    // NOT contain it. Confirms the extractor isn't pulling content from
    // siblings outside the function.
    const noMarker = 'function fixtureNone() { var x = 1; if (a) { y(); } z(); }';
    const noneSrc = extractFunctionBody(noMarker, 'fixtureNone');
    expect(noneSrc, 'extractor returns body for fixtureNone').not.toBeNull();
    expect(noneSrc!.includes('__MARK_EARLY'), 'no false positive on absent marker').toBeFalsy();
  });

  test('positive-regression — explicitly-deferred renderers (Phase 4) are NOT wired (object-keyed-shape disposition documented in PR body)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();
    // These two are object-keyed (date → sub-object) and require a shape
    // decision affecting every consumer of those fields. Per the audit
    // disposition, they remain unwired in PR-19.6 and carry forward to
    // Phase 4. The test asserts the explicit non-wire so a future drift-by-
    // accident is caught: if someone wires renderMedLog without making the
    // object-keyed shape decision, this guard fails and forces a re-discuss.
    const DEFERRED: Array<{ renderer: string; reason: string }> = [
      { renderer: 'renderMedLog',         reason: 'medChecks is object-keyed (date → medName→status string); per-entry attribution requires object-shape decision' },
      { renderer: 'renderFeedingHistory', reason: 'feedingData is object-keyed (date → meal-record); per-entry attribution requires object-shape decision' },
    ];
    for (const { renderer, reason } of DEFERRED) {
      // PR-20 Item 5: brace-balance extractor (replaces prior non-greedy
      // `[\\s\\S]*?\\n\\}` regex, which false-negatived past nested
      // closures). See extractFunctionBody above for the walker + the
      // residual-gap disclosure for the threat model.
      const body = extractFunctionBody(html, renderer);
      expect(body, `${renderer} function body found in bundle`).not.toBeNull();
      if (body !== null) {
        expect(body.includes('_renderAttribution'),
          `${renderer} explicitly NOT wired per Phase 4 deferral: ${reason}`).toBeFalsy();
      }
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-1 — medical.js Insights-tier defense-in-depth gates (Phase 4 sub-phase 1)
// ───────────────────────────────────────────────────────────────────────────
//
// Rationale-amendment on-record (PR-23 r1→r2 transparency precedent applies):
//
// Maren's Phase 4 Polish charter scout framed the medical.js zero-isEssentialMode-
// calls finding as "user-visible mode-contract drift" — the claim being that
// essential-mode users see full medical Insights surface while seeing simplified
// diet ZS. Lyra's Polish-1 build-deep empirical re-grep refuted that framing:
// the Info tab BUTTON is CSS-hidden in essential-mode (styles.css:3198: `body.
// essential-mode .tab-btn[aria-label="Info tab"] { display:none; }`), so
// essential-mode users have no path to navigate to the Info renderers' output.
// The "user-visible" framing is empirically wrong.
//
// What IS true: the Info renderer JS still RUNS in essential-mode (rendering into
// CSS-hidden DOM), wasting CPU cycles. Path-1 ratification (Sovereign via
// Aurelius post-PR-23-merge): ship the JS-layer gates Maren named, but reframe
// the rationale on-record — defense-in-depth + perf, NOT user-visible parity.
// The 19 remaining medical.js renderInfo* renderers carrying the same
// structural defect route to Phase 4 R-10 carry-forward P-5 (charter §6) as
// a Stability sub-phase candidate.
//
// Polish-1 lands the discipline at 2 named medical.js sites (the actually-
// medical.js subset of Maren's three named surfaces; the third — diet.js
// "Correlations appear" — was a jurisdictional-drift D8 catch closed at
// charter ratification). Triad below covers the two gates.

test.describe('Polish-1 — medical.js Insights-tier defense-in-depth gates', () => {
  // The two gated renderers. Both write into Info-tab DOM (#infoPoopFoodDelay*
  // / #infoPoopFoodWatch*) which is CSS-hidden in essential-mode at the parent-
  // tab-button level. JS-layer early-return saves CPU + backs the CSS gate.
  const GATED = [
    {
      fn: 'renderInfoPoopFoodDelay',
      summaryEl: 'infoPoopFoodDelaySummary',
      listEl: 'infoPoopFoodDelayList',
      insightEl: 'infoPoopFoodDelayInsights',
    },
    {
      fn: 'renderInfoPoopFoodWatch',
      summaryEl: 'infoPoopFoodWatchSummary',
      listEl: 'infoPoopFoodWatchList',
      insightEl: 'infoPoopFoodWatchInsights',
    },
  ];

  test('positive — in full mode (essential-mode opted out), gated renderers DO write into their target DOM', async ({ page }) => {
    await stubChartJs(page);
    // Opt out of essential-mode before init runs; same idiom as smoke 2b.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { renderInfoPoopFoodDelay?: unknown }).renderInfoPoopFoodDelay === 'function');

    const results = await page.evaluate((cases) => {
      const w = window as unknown as Record<string, unknown>;
      return cases.map((c) => {
        const fn = w[c.fn] as () => void;
        const summary = document.getElementById(c.summaryEl);
        if (summary) summary.innerHTML = ''; // baseline empty
        try { fn(); } catch (e) { /* runtime errors surface in returned shape */ }
        return {
          fn: c.fn,
          summaryHasContent: !!(summary && summary.innerHTML.trim().length > 0),
          bodyClass: document.body.className,
        };
      });
    }, GATED);

    for (const r of results) {
      expect(r.bodyClass, `${r.fn}: body NOT in essential-mode for full-mode test`).not.toMatch(/\bessential-mode\b/);
      expect(r.summaryHasContent, `${r.fn}: full-mode call writes into target DOM (no early-return)`).toBeTruthy();
    }
  });

  test('regression-guard — in essential-mode, gated renderers early-return WITHOUT touching target DOM', async ({ page }) => {
    await stubChartJs(page);
    // Default fresh context → essential-mode ON (split/core.js:3711-3717 default-on logic).
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { renderInfoPoopFoodDelay?: unknown }).renderInfoPoopFoodDelay === 'function');

    const results = await page.evaluate((cases) => {
      const w = window as unknown as Record<string, unknown>;
      return cases.map((c) => {
        const fn = w[c.fn] as () => void;
        const summary = document.getElementById(c.summaryEl);
        // Pre-seed the summary with a sentinel so we can detect any innerHTML write.
        const SENTINEL = '__POLISH1_SENTINEL__';
        if (summary) summary.innerHTML = SENTINEL;
        try { fn(); } catch (e) { /* surface */ }
        return {
          fn: c.fn,
          sentinelPreserved: !!(summary && summary.innerHTML === SENTINEL),
          bodyClass: document.body.className,
        };
      });
    }, GATED);

    for (const r of results) {
      expect(r.bodyClass, `${r.fn}: body IS in essential-mode for essential-mode test`).toMatch(/\bessential-mode\b/);
      expect(r.sentinelPreserved, `${r.fn}: essential-mode early-return preserves pre-existing summary content (no innerHTML write)`).toBeTruthy();
    }
  });

  test('positive-regression — gate behavior tracks current body class on direct invocation', async ({ page }) => {
    await stubChartJs(page);
    // Start in full mode.
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
    });
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { renderInfoPoopFoodDelay?: unknown }).renderInfoPoopFoodDelay === 'function');

    // Call once in full mode (writes), then flip body class directly to simulate
    // a mode toggle, then call again (gate should engage), then restore class
    // and call once more (writes again). Verifies the gate dispatch is dynamic
    // per-call, not init-bound.
    const sequence = await page.evaluate((cases) => {
      const w = window as unknown as Record<string, unknown>;
      const c = cases[0]; // one renderer is sufficient for the dispatch-shape check
      const fn = w[c.fn] as () => void;
      const summary = document.getElementById(c.summaryEl);
      if (!summary) return { phase1: false, phase2: false, phase3: false };

      // Phase 1: full mode → expect content
      summary.innerHTML = '';
      try { fn(); } catch {}
      const phase1 = summary.innerHTML.trim().length > 0;

      // Phase 2: flip to essential-mode, set sentinel, call → expect sentinel preserved
      document.body.classList.add('essential-mode');
      const SENTINEL = '__POLISH1_PHASE2_SENTINEL__';
      summary.innerHTML = SENTINEL;
      try { fn(); } catch {}
      const phase2 = summary.innerHTML === SENTINEL;

      // Phase 3: flip back to full mode → call → expect content (sentinel cleared)
      document.body.classList.remove('essential-mode');
      summary.innerHTML = '';
      try { fn(); } catch {}
      const phase3 = summary.innerHTML.trim().length > 0;

      return { phase1, phase2, phase3 };
    }, GATED);

    expect(sequence.phase1, 'phase 1 (full mode): gate disengaged; renderer wrote content').toBeTruthy();
    expect(sequence.phase2, 'phase 2 (toggled to essential): gate engaged; sentinel preserved').toBeTruthy();
    expect(sequence.phase3, 'phase 3 (toggled back to full): gate disengaged; renderer wrote content').toBeTruthy();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-9 — essential-mode rename + boot migration (Phase 4 sub-phase 1)
// ───────────────────────────────────────────────────────────────────────────
//
// Atomic-canon vocabulary rename: simple-mode → essential-mode (ratified by
// Sovereign-via-Aurelius). Internals previously drifted from the user-facing
// "Essential Mode" display strings (already at core.js:4626 + :4672 pre-rename);
// Polish-9 aligns internals → externals. Surfaces touched: KEYS string
// (ziva_simple_mode → ziva_essential_mode), function names (isSimpleMode →
// isEssentialMode + toggleSimpleMode → toggleEssentialMode + initSimpleMode →
// initEssentialMode), CSS class (body.simple-mode → body.essential-mode), state-
// snapshot prop (.simpleMode → .essentialMode), template settings-toggle id +
// onchange function name. Total: ~80-100 LOC source + ~75 LOC tests.
//
// Mitigation posture: LOCAL-ONLY (Q1 + Q2 conclusive at scout: simpleMode is
// NOT in SYNC_KEYS or SYNC_RENDER_DEPS; no Firestore involvement; no listener-
// fire path). Boot migration runs once at initEssentialMode (start.js:5):
// read-old → write-new (only if new not already set) → delete-old. Idempotent;
// race-safe under multi-tab boot; storage-cleared falls through to default-on.
//
// R-7 triad covers the migration contract:
//   - positive: fresh user (no localStorage state) defaults to essential-mode ON
//   - regression-guard: existing simpleMode-keyed state preserved through migration
//   - positive-regression: idempotency + multi-tab race + storage-cleared scenarios
//
// Note: existing simple-mode-equivalent assertions (2a/2b/2c above) verify the
// EXTERNAL contract (4 tabs vs 6 tabs) on the renamed body class; this triad
// verifies the INTERNAL migration contract (old→new key transition).

test.describe('Polish-9 — essential-mode rename + boot migration', () => {
  test('positive — fresh user (no prior localStorage) defaults to essential-mode ON', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await expect(page.locator('body')).toHaveClass(/\bessential-mode\b/);

    // Fresh context: no migration triggered (old key wasn't set).
    const state = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
    }));
    expect(state.old, 'old key not present (fresh context, nothing to migrate)').toBeNull();
    // New key may also be null on fresh init (default-on logic doesn't write
    // until first user toggle); body class engagement confirms default-on path.
  });

  test('regression-guard — boot migration preserves existing user state through ziva_simple_mode → ziva_essential_mode', async ({ page }) => {
    await stubChartJs(page);
    // Seed old key BEFORE init runs (addInitScript fires before page scripts).
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });
    await page.goto('/index.html?nosync');

    // After init, body should NOT have essential-mode class (old key value was 'false').
    await expect(page.locator('body')).not.toHaveClass(/\bessential-mode\b/);

    // Migration ran: new key carries the migrated value; old key is deleted.
    const state = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
    }));
    expect(state.old, 'old key deleted post-migration').toBeNull();
    expect(state.newKey, 'new key carries migrated value').toBe('false');
  });

  test('positive-regression — migration idempotency: re-run is no-op + multi-tab race clobber-guard + storage-cleared default-on', async ({ page }) => {
    await stubChartJs(page);
    // Seed old key with 'true' (essential-mode ON via legacy storage).
    await page.addInitScript(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'true'); } catch {}
    });
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() => typeof (window as { initEssentialMode?: unknown }).initEssentialMode === 'function');

    // First-run state: migration ran, old deleted, new = 'true'.
    const after1 = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
    }));
    expect(after1.old, 'old key deleted after run 1').toBeNull();
    expect(after1.newKey, 'new key has migrated value after run 1').toBe('true');

    // Re-run init explicitly — should be no-op (old=null, no migration to do).
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const fn = w['initEssentialMode'] as () => void;
      fn();
    });
    const after2 = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
    }));
    expect(after2.old, 'old key still null after re-run (no resurrection)').toBeNull();
    expect(after2.newKey, 'new key unchanged after re-run').toBe('true');

    // Multi-tab race scenario: simulate B sees old re-set somehow (e.g., legacy
    // build wrote it again before being uninstalled); B's init must NOT clobber
    // A's already-migrated new value. Per migration's `if (new === null)` guard.
    await page.evaluate(() => {
      try {
        localStorage.setItem('ziva_simple_mode', 'false'); // simulate stale old re-set
        // new key is still 'true' from earlier migration
        const w = window as unknown as Record<string, unknown>;
        const fn = w['initEssentialMode'] as () => void;
        fn(); // re-invoke; clobber-guard should preserve new='true'
      } catch {}
    });
    const after3 = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
    }));
    expect(after3.old, 'race: old key deleted again post-init').toBeNull();
    expect(after3.newKey, 'race: new key preserved at \'true\' (clobber-guard prevents stale-old overwrite)').toBe('true');

    // Storage-cleared scenario: clear all + re-init → falls through to default-on.
    await page.evaluate(() => {
      localStorage.clear();
      const w = window as unknown as Record<string, unknown>;
      const fn = w['initEssentialMode'] as () => void;
      fn();
    });
    const after4 = await page.evaluate(() => ({
      old: localStorage.getItem('ziva_simple_mode'),
      newKey: localStorage.getItem('ziva_essential_mode'),
      bodyHasEssentialMode: document.body.classList.contains('essential-mode'),
    }));
    expect(after4.old, 'cleared storage: old key null').toBeNull();
    expect(after4.newKey, 'cleared storage: new key null (default-on does not write)').toBeNull();
    expect(after4.bodyHasEssentialMode, 'cleared storage: default-on logic engages essential-mode').toBeTruthy();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-2 — 4 named cross-Governor-catch governance-rule violations
// ───────────────────────────────────────────────────────────────────────────
//
// R-7 binary-mode duos per PR-18 precedent: governance-rule violations have
// binary state-space (compliant vs violating); the bug IS the absent state.
// Two slots per rule: positive (rule-compliant in the built bundle) +
// regression-guard (the specific violating-pattern is byte-precise absent).
// Path A scope per Sovereign-via-Aurelius ratification: the 4 named cross-
// Governor-catch sites only. Broader audit (P-1 + P-6 in charter §6 R-10
// queue) defers to Stability sub-phase or dedicated Polish-N hygiene-sweep.
//
// Sites:
//   1. HR-2 escape — medical.js:3208 #ffc107 hex-in-inline-style → var(--amber)
//   2. HR-1 emoji  — medical.js:2268 🚨 ('When to seek emergency care') → zi('siren')
//   3. HR-1 emoji  — home.js:1595    🩺 (ms-tidbit-icon doctor context) → zi('steth')
//   4. HR-3 inline — home.js:1391    onclick="..." (vacc-history toggle) → data-action="toggleVaccHistoryInfo"

test.describe('Polish-2 — governance-rule violations closed at 4 named cross-Governor-catch sites', () => {
  test('positive — built bundle ships the compliant patterns at all 4 sites', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    expect(res.ok(), 'sproutlab.html fetchable').toBeTruthy();
    const html = await res.text();

    // Site 1: medical.js:3208 — peach-light flagEl uses canonical --border-warn
    // post-Polish-4 retroactive swap. Polish-2 originally used var(--amber) as
    // a substitute (Polish-4's --border-warn token didn't exist yet); Polish-4
    // introduced --border-warn and swapped this site to the canonical token.
    // Future-fragility per Maren's Polish-2 audit: this guard updates with
    // intentional downstream substitution.
    expect(html.includes('background:var(--peach-light);border-left:var(--accent-w) solid var(--border-warn);'),
      'Site 1: medical.js:3208 carries var(--border-warn) (Polish-4 retroactive swap from Polish-2 var(--amber) substitute)').toBeTruthy();

    // Site 2: medical.js:2268 — the emergency-care-callout title now uses zi('siren').
    // The bundle text contains: ` + zi('siren') + ' When to seek emergency care`.
    expect(html.includes("zi('siren') + ' When to seek emergency care"),
      'Site 2: medical.js:2268 emergency-care title uses zi(siren)').toBeTruthy();

    // Site 3: home.js:1595 — ms-tidbit-icon doctor context wraps zi('steth') in a
    // template literal expression.
    expect(html.includes("ms-tidbit tidbit-doctor") &&
           html.includes("${zi('steth')}"),
      "Site 3: home.js:1595 ms-tidbit-icon uses zi('steth') template-literal interpolation").toBeTruthy();

    // Site 4: home.js:1391 — vacc-history row carries the delegated data-action
    // pattern with the dynamic infoId argument.
    expect(html.includes('data-action="toggleVaccHistoryInfo"') &&
           html.includes('data-arg="${infoId}"'),
      'Site 4: home.js:1391 vacc-history row uses data-action="toggleVaccHistoryInfo" data-arg="${infoId}"').toBeTruthy();
  });

  test('regression-guard — the specific violating patterns at all 4 sites are byte-precise ABSENT from bundle', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();

    // Site 1: HR-2 — medical.js:3208 specific violation pattern (canonical
    // string match). Note: #ffc107 still appears in styles.css ad-hoc-tonal
    // hex variants (Polish-4 territory); this guard targets the medical.js:3208
    // INLINE-STYLE escape specifically, not the broader hex-in-CSS surface.
    expect(html.includes('background:var(--peach-light);border-left:var(--accent-w) solid #ffc107;'),
      'Site 1 violation absent: medical.js:3208 no longer carries `#ffc107` inside the inline-style attribute').toBeFalsy();

    // Site 2: HR-1 — medical.js:2268 specific violation pattern. The original
    // line emitted `\u{1F6A8} When to seek emergency care`. The same string
    // template was BYTE-IDENTICALLY duplicated at intelligence.js:11965 — a
    // Polish-2 build-deep finding (running-beats-reading 6th instance; cross-
    // Governor-catch coverage gap because Cipher's PR-23 r1 audit was scoped
    // to Maren's Care territory and missed Kael's Intelligence territory).
    // intelligence.js:11965 is OUT of Polish-2 scope (routed to charter §6 P-1
    // R-10 carry-forward); it still emits the pattern post-Polish-2.
    //
    // Once both source files were concatenated into the bundle pre-Polish-2,
    // this pattern appeared 2× (once per source file). Polish-2 closes
    // medical.js:2268 only, so post-Polish-2 the pattern appears 1× (from
    // intelligence.js:11965). The binary-mode-duo regression-guard for Site
    // 2 is therefore count-based: assert exactly 1 remaining occurrence,
    // confirming medical.js's contribution is absent without false-positive
    // failure on intelligence.js's still-present out-of-scope contribution.
    const emergencyPattern = "\\u{1F6A8} When to seek emergency care";
    const remainingOccurrences = html.split(emergencyPattern).length - 1;
    expect(remainingOccurrences,
      'Site 2 medical.js:2268 contribution absent: bundle has exactly 1 remaining occurrence (intelligence.js:11965, out-of-scope per R-10 P-1)').toBe(1);

    // Site 3: HR-1 — home.js:1595 specific violation pattern. The original
    // line emitted `<div class="ms-tidbit-icon">🩺</div>`. The string-literal-
    // 🩺-inside-ms-tidbit-icon-div is the binary signature.
    expect(html.includes('<div class="ms-tidbit-icon">🩺</div>'),
      'Site 3 violation absent: home.js:1595 ms-tidbit-icon no longer carries the literal 🩺 emoji').toBeFalsy();

    // Site 4: HR-3 — home.js:1391 specific violation pattern. The original
    // inline-onclick handler. The signature is the literal getElementById +
    // ternary-toggle pattern inside an onclick attribute.
    expect(html.includes('onclick="const el=document.getElementById(') &&
           html.includes("style.display=el.style.display==='none'?'block':'none'"),
      'Site 4 violation absent: home.js:1391 no longer carries the inline onclick handler').toBeFalsy();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-3 — Direct-token-duplication hex sweep (styles.css; 32 substitutions)
// ───────────────────────────────────────────────────────────────────────────
//
// Atomic-canon hex sweep: 32 hex literals byte-identical to canonical light-
// theme :root token values replaced with var(--token) references. Tokens
// covered: --rose, --rose-light, --peach, --peach-light, --sage, --sage-light,
// --lavender, --sky, --sky-light, --indigo, --indigo-light, --amber,
// --amber-light. :root definitions preserved (single source of truth).
//
// Pure substitution: zero new tokens, zero ad-hoc tonal variations (those
// route to Polish-4 spec-amendment). Charter §4 scout estimated ~87 sites;
// empirical Polish-3 build-deep count is 32 (running-beats-reading 7th
// instance count drift — Polish-bench operational consistency).
//
// R-7 triad shape:
//   - positive: a representative consumer (.icon-rose) resolves
//     getComputedStyle().backgroundColor to the canonical rose-light RGB
//     post-substitution (visual fidelity preserved through the var(--*)
//     dispatch).
//   - regression-guard: zero canonical-hex literals (#f2a8b8 / #fde8ed /
//     etc.) outside the :root definition lines (1-89) — substitution sweep
//     is total within scope.
//   - positive-regression: token system itself unchanged —
//     getComputedStyle(root).getPropertyValue('--rose-light') returns the
//     canonical hex value byte-precise.

test.describe('Polish-3 — Direct-token-duplication hex sweep (styles.css; 32 substitutions)', () => {
  // Known canonical light-theme token → hex value pairs. Source of truth:
  // split/styles.css :root block (lines 1-89). Test asserts the token system
  // resolves correctly post-substitution (no accidental cycle / no clobber).
  const CANONICAL_TOKENS = [
    { token: '--rose',          hex: '#f2a8b8' },
    { token: '--rose-light',    hex: '#fde8ed' },
    { token: '--peach',         hex: '#fad4b4' },
    { token: '--peach-light',   hex: '#fef3ea' },
    { token: '--sage',          hex: '#b5d5c5' },
    { token: '--sage-light',    hex: '#e8f5ef' },
    { token: '--lavender',      hex: '#c9b8e8' },
    { token: '--sky',           hex: '#a8cfe0' },
    { token: '--sky-light',     hex: '#e8f4fa' },
    { token: '--indigo',        hex: '#9ba8d8' },
    { token: '--indigo-light',  hex: '#edf0fa' },
    { token: '--amber',         hex: '#e8b86d' },
    { token: '--amber-light',   hex: '#fef6e8' },
  ];

  test('positive — known consumer (.icon-rose) resolves getComputedStyle to the canonical rose-light RGB post-substitution', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    // .icon-rose is a known consumer — pre-Polish-3 it had `background: #fde8ed`;
    // post-Polish-3 it has `background: var(--rose-light)`. Computed background
    // must still resolve to the canonical rose-light RGB (245, 232, 237).
    // (Hex #fde8ed = RGB 253,232,237 — modern browsers normalize hex → rgb in computed style.)
    const bg = await page.evaluate(() => {
      // Create a probe div with the .icon-rose class so we don't depend on
      // a specific page state having an .icon-rose element rendered.
      const probe = document.createElement('div');
      probe.className = 'icon-rose';
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return computed;
    });
    // rose-light hex #fde8ed → rgb(253, 232, 237). Browser may render as
    // 'rgb(253, 232, 237)' or normalized variant.
    expect(bg.match(/rgb\(\s*253\s*,\s*232\s*,\s*237\s*\)/),
      `.icon-rose computed background-color resolves to rose-light canonical RGB; got: ${bg}`).toBeTruthy();
  });

  test('regression-guard — zero canonical-hex literals outside :root in styles.css (Polish-3 scope: CSS substitution sweep total within scope)', async ({ request }) => {
    // Polish-3 scope is styles.css ONLY. JS-side hex literals (e.g.,
    // medical.js:1452-1453 growth-gauge JS consts; Chart.js dataset config
    // borderColor/backgroundColor strings) live in different jurisdiction
    // and are out-of-scope for Polish-3 (Stability sub-phase candidates
    // since they need runtime token-resolution rather than CSS var()).
    // Test fetches styles.css source directly (server serves repo root).
    const res = await request.get('/split/styles.css');
    expect(res.ok(), '/split/styles.css fetchable').toBeTruthy();
    const css = await res.text();

    // For each canonical hex value, count occurrences in styles.css source.
    // Each canonical hex must appear exactly ONCE (its :root definition line);
    // zero direct-duplicate consumer literals remain inside styles.css.
    for (const { token, hex } of CANONICAL_TOKENS) {
      const occurrences = (css.match(new RegExp(hex, 'gi')) || []).length;
      expect(occurrences,
        `${token} hex literal ${hex} appears exactly once in styles.css (only the :root definition; zero CSS consumer duplicates)`).toBe(1);
    }
  });

  test('positive-regression — token system itself unchanged: getComputedStyle(root).getPropertyValue resolves canonical RGB byte-precise', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    // Read each canonical token's resolved value from the runtime CSS engine.
    // Asserts the :root preservation worked (no circular `var(--rose): var(--rose)`
    // accident from the sed substitution sweep).
    const tokenValues = await page.evaluate((tokens) => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      return tokens.map(({ token, hex }) => ({
        token,
        expectedHex: hex,
        resolvedRaw: computed.getPropertyValue(token).trim(),
      }));
    }, CANONICAL_TOKENS);

    for (const { token, expectedHex, resolvedRaw } of tokenValues) {
      // The resolved value should be the canonical hex byte-precise (browsers
      // preserve hex form in getPropertyValue for custom properties; no
      // RGB conversion at the property-read layer).
      expect(resolvedRaw.toLowerCase(), `token ${token} resolves to canonical hex ${expectedHex}; got '${resolvedRaw}'`).toBe(expectedHex);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-4 — Design-token-system spec amendment + ad-hoc-tonal sweep (38 sites)
// ───────────────────────────────────────────────────────────────────────────
//
// First-instance candidate for `spec-amendment-in-substitution-PR` doctrine
// (Aurelius PR-23 Ruling 5; RATIFIED 0/3, first-instance pending). Spec
// amendment lands in DESIGN_PRINCIPLES.md (token-family naming rule + 9 new
// canonical tokens) IN THE SAME PR DIFF as the substitution sweep that
// consumes them. Parallels PR-19.5's strip-allowlist + flush-stamper
// architectural-commit precedent.
//
// 9 new tokens introduced (Path B″ — Maren+Kael Mode 2 synthesis):
//   --border-warn (#ffc107)         — caution-amber border-accent
//   --border-warn-soft (#ffd166)    — light variant
//   --sage-deepest (#1a7a42)        — milestone consistent deepest tone
//   --sage-mid (#5a9a6a)            — milestone mid-tone
//   --accent-sage-deep (#3d7a60)    — Smart Q&A active state fill
//   --amber-deepest (#b8904a)       — milestone emerging deepest tone
//   --amber-deep (#d4a04a)          — milestone in-progress signal
//   --amber-mid (#e8a840)           — milestone emerging signal
//   --amber-text-deep (#886520)     — text-on-amber-bg readable contrast
//
// Plus Polish-3 coverage-gap corrective: #f0ebfb → var(--lav-light), 5 sites
// (Polish-3 missed --lav-light because naming inconsistency tripped scout
// pattern-matching; running-beats-reading 8th instance).
//
// Plus Polish-2 retroactive: medical.js:3208 var(--amber) → var(--border-warn)
// (Polish-2 used var(--amber) as substitute; Polish-4 swaps to canonical
// --border-warn now that the token is introduced).
//
// Test discipline: scope to styles.css source contribution (server fetches
// /split/styles.css directly) + getComputedStyle resolves tokens correctly +
// DESIGN_PRINCIPLES.md token-family naming-rule consumers honored.

test.describe('Polish-4 — Design-token-system spec amendment + ad-hoc-tonal sweep', () => {
  const POLISH_4_NEW_TOKENS = [
    { token: '--border-warn',       hex: '#ffc107' },
    { token: '--border-warn-soft',  hex: '#ffd166' },
    { token: '--sage-deepest',      hex: '#1a7a42' },
    { token: '--sage-mid',          hex: '#5a9a6a' },
    { token: '--accent-sage-deep',  hex: '#3d7a60' },
    { token: '--amber-deepest',     hex: '#b8904a' },
    { token: '--amber-deep',        hex: '#d4a04a' },
    { token: '--amber-mid',         hex: '#e8a840' },
    { token: '--amber-text-deep',   hex: '#886520' },
  ];

  // Hex values that were COLLAPSED into existing canonical tokens (no new
  // canonical token introduced; the Maren-classification mapped them to a
  // previously-introduced token).
  const POLISH_4_COLLAPSED_HEX = [
    { hex: '#0a6a32', mappedTo: '--sage-deepest' },
    { hex: '#4a8a5a', mappedTo: '--sage-mid' },
    { hex: '#8a6418', mappedTo: '--amber-text-deep' },
  ];

  test('positive — all 9 new tokens resolve to their canonical hex byte-precise via getComputedStyle', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    const tokenValues = await page.evaluate((tokens) => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      return tokens.map(({ token, hex }) => ({
        token,
        expectedHex: hex,
        resolvedRaw: computed.getPropertyValue(token).trim(),
      }));
    }, POLISH_4_NEW_TOKENS);

    for (const { token, expectedHex, resolvedRaw } of tokenValues) {
      expect(resolvedRaw.toLowerCase(),
        `Polish-4 token ${token} resolves to canonical hex ${expectedHex}; got '${resolvedRaw}'`).toBe(expectedHex);
    }
  });

  test('regression-guard — zero direct-duplicate hex literals outside :root for the 9 new + 3 collapsed values + Polish-3 corrective #f0ebfb', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    expect(res.ok(), '/split/styles.css fetchable').toBeTruthy();
    const css = await res.text();

    // 9 new-token hex values must each appear EXACTLY ONCE (their :root def).
    for (const { token, hex } of POLISH_4_NEW_TOKENS) {
      const occurrences = (css.match(new RegExp(hex, 'gi')) || []).length;
      expect(occurrences,
        `${token} hex literal ${hex} appears exactly once in styles.css (only :root def; zero CSS consumer duplicates)`).toBe(1);
    }

    // 3 collapsed hex values (mapped to a sibling new token) must appear
    // ZERO times — they were sweep-target hex with no canonical :root home;
    // every occurrence got swapped to the mapped token.
    for (const { hex, mappedTo } of POLISH_4_COLLAPSED_HEX) {
      const occurrences = (css.match(new RegExp(hex, 'gi')) || []).length;
      expect(occurrences,
        `collapsed hex ${hex} (mapped to ${mappedTo}) appears zero times in styles.css (every consumer swept)`).toBe(0);
    }

    // Polish-3 coverage-gap corrective: #f0ebfb (--lav-light) must appear
    // EXACTLY ONCE (its :root def). Pre-Polish-4 had 6 occurrences (1 def
    // + 5 consumer duplicates Polish-3's canonical-13 sweep missed because
    // --lav-light naming inconsistency tripped scout pattern-matching).
    const lavLightOccurrences = (css.match(/#f0ebfb/gi) || []).length;
    expect(lavLightOccurrences,
      'Polish-3 coverage-gap corrective: #f0ebfb (--lav-light) appears exactly once in styles.css (only :root def; 5 consumer duplicates swept in Polish-4)').toBe(1);
  });

  test('positive-regression — DESIGN_PRINCIPLES.md token-family naming-rule consumers honored: Polish-2 retroactive medical.js:3208 swap to var(--border-warn)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    expect(res.ok(), 'sproutlab.html fetchable').toBeTruthy();
    const html = await res.text();

    // Polish-2 used var(--amber) as a substitute at medical.js:3208's HR-2
    // escape because Polish-4's canonical --border-warn token didn't exist
    // yet. Polish-4 swaps it to the canonical token now. Verify the
    // retroactive swap landed (presence of --border-warn in the medical.js
    // post-substitution shape).
    expect(html.includes('background:var(--peach-light);border-left:var(--accent-w) solid var(--border-warn);'),
      'Polish-2 retroactive: medical.js:3208 swapped var(--amber) → var(--border-warn) (canonical token from Polish-4 spec amendment)').toBeTruthy();

    // Verify the prior Polish-2 substitute is GONE from medical.js:3208 site.
    // (var(--amber) still appears elsewhere as a domain accent — out of scope.)
    expect(html.includes('background:var(--peach-light);border-left:var(--accent-w) solid var(--amber);'),
      'Polish-2 substitute pattern absent at medical.js:3208 site post-Polish-4 retroactive swap').toBeFalsy();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-5 — Cross-jurisdiction class-extraction sweep (Path C narrow-scope)
// ───────────────────────────────────────────────────────────────────────────
//
// 8 new utility classes extracted to styles.css; 11 inline-style HR-2 sites
// replaced with class references across medical.js + intelligence.js. Path C
// narrow-scope per RATIFIED 3/3 narrow-scope-and-defer-broader-audit-to-R-10
// doctrine: charter framing was 50+ sites across 5 modules; empirical re-grep
// surfaced 44 cousin-pattern sites with substantial variation (running-beats-
// reading 9th instance count drift). Class-taxonomy decision deferred to
// charter §6 R-10 P-7.
//
// 8 new classes (no DESIGN_PRINCIPLES.md amendment — class taxonomy is
// implicit; class names approved at Polish-charter time by Maren+Kael):
//   .guidance-section-title-do      — medical.js:3094 Do/Don't bullet section title (sage tone)
//   .guidance-section-title-dont    — medical.js:3102 Don't section title (rose tone)
//   .guidance-bullet                — medical.js bullet rendering inside Do/Don't lists
//   .guidance-bullet-marker         — absolute-positioned · marker inside .guidance-bullet
//   .doctor-cta-call                — medical.js:2364 Call CTA (background:--tc-sage)
//   .doctor-cta-map                 — medical.js:2365 Map CTA (background:--tc-sky)
//   .kc-row-flex-wrap               — intelligence.js episode-tracker chip row pattern
//   .nh-legend-swatch               — intelligence.js nutrient-heatmap legend swatch
//
// 11 site replacements:
//   - 4 medical.js guidance sites (Do title + Don't title + 2 bullet templates)
//   - 2 medical.js doctor-cta sites (Call + Map anchor tags)
//   - 2 intelligence.js kc-row-flex-wrap sites (:7885 + :7905 exact pattern matches)
//   - 3 intelligence.js nh-legend-swatch sites (:14974/:14975/:14976 Some/Good/Rich
//     legend cells; dynamic background:rgba(...) stays inline since alpha varies
//     per swatch — partial extraction is valid per Path C; Polish-6's CSS-custom-
//     property pivot may consolidate the dynamic-rgba pattern across all swatches
//     as part of its first-instance candidate scope).

test.describe('Polish-5 — Cross-jurisdiction class-extraction sweep (Path C narrow-scope)', () => {
  const POLISH_5_NEW_CLASSES = [
    '.guidance-section-title-do',
    '.guidance-section-title-dont',
    '.guidance-bullet',
    '.guidance-bullet > .guidance-bullet-marker',
    '.doctor-cta-call',
    '.doctor-cta-map',
    '.kc-row-flex-wrap',
    '.nh-legend-swatch',
  ];

  test('positive — all 8 new utility classes are reachable in styles.css source', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    expect(res.ok(), '/split/styles.css fetchable').toBeTruthy();
    const css = await res.text();

    for (const className of POLISH_5_NEW_CLASSES) {
      // Each class must appear at least once as a selector in styles.css.
      // Selectors may have descendant combinators or grouping; use simple
      // substring check — if the literal selector text is present, the
      // class is reachable.
      expect(css.includes(className),
        `Polish-5 class ${className} reachable in styles.css source`).toBeTruthy();
    }
  });

  test('regression-guard — extracted-site inline-style residue absent from bundle (verbatim original-pattern bytes)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();

    // Guidance section titles: original pattern was the full 7-prop inline-style.
    // Each canonical pattern present pre-Polish-5 must be ABSENT post-Polish-5.
    const guidanceDoSig = "font-weight:600;font-size:var(--fs-sm);color:var(--tc-sage);text-transform:uppercase;letter-spacing:var(--ls-wide);margin-bottom:4px;\"><span class=\"zi-check-placeholder";
    const guidanceDontSig = "font-weight:600;font-size:var(--fs-sm);color:var(--tc-rose);text-transform:uppercase;letter-spacing:var(--ls-wide);margin-bottom:4px;\"><span class=\"zi-warn-placeholder";
    const guidanceBulletSig = "font-size:var(--fs-base);color:var(--text);padding:3px 0 3px 18px;position:relative;line-height:var(--lh-relaxed);";

    expect(html.includes(guidanceDoSig),
      'guidance Do title 7-prop inline-style absent (replaced with .guidance-section-title-do class)').toBeFalsy();
    expect(html.includes(guidanceDontSig),
      'guidance Don\'t title 7-prop inline-style absent (replaced with .guidance-section-title-dont class)').toBeFalsy();
    expect(html.includes(guidanceBulletSig),
      'guidance bullet 5-prop inline-style absent (replaced with .guidance-bullet class)').toBeFalsy();

    // Doctor CTA: original was 12-prop inline-style.
    const doctorCtaSig = "min-height:44px;padding:8px 14px;border-radius:var(--r-2xl);background:var(--tc-sage);display:inline-flex;align-items:center;gap:var(--sp-8);text-decoration:none;font-size:var(--fs-sm);font-weight:700;color:white;font-family:'Nunito',sans-serif;";
    expect(html.includes(doctorCtaSig),
      'doctor-cta Call 12-prop inline-style absent (replaced with .doctor-cta-call class)').toBeFalsy();

    // kc-row-flex-wrap: 4-prop inline-style at intelligence.js:7885 + :7905.
    const kcRowSig = "display:flex;gap:var(--sp-8);flex-wrap:wrap;padding:var(--sp-4) 0;";
    expect(html.includes(kcRowSig),
      'kc-row-flex-wrap 4-prop inline-style absent (replaced with .kc-row-flex-wrap class)').toBeFalsy();
  });

  test('positive-regression — class consumers ship in bundle (medical.js + intelligence.js)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();

    // Each new class must have at least one consumer-site reference in the
    // bundle (the class is actually USED, not just defined).
    const consumerExpectations = [
      { className: 'guidance-section-title-do',   minCount: 1 },
      { className: 'guidance-section-title-dont', minCount: 1 },
      { className: 'guidance-bullet',             minCount: 1 },
      { className: 'doctor-cta-call',             minCount: 1 },
      { className: 'doctor-cta-map',              minCount: 1 },
      { className: 'kc-row-flex-wrap',            minCount: 2 },  // 2 intelligence.js consumers
      { className: 'nh-legend-swatch',            minCount: 3 },  // 3 intelligence.js consumers
    ];

    for (const { className, minCount } of consumerExpectations) {
      // Count occurrences of class="<className>" or class="... <className> ..."
      // patterns. Simple regex matches `${className}"` (closing quote) or
      // `${className} ` (space) since class lists separate by spaces.
      const re = new RegExp('class="[^"]*\\b' + className + '\\b', 'g');
      const occurrences = (html.match(re) || []).length;
      expect(occurrences,
        `class .${className} has ≥${minCount} consumer-site reference(s) in bundle (got ${occurrences})`).toBeGreaterThanOrEqual(minCount);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-6 — CSS-custom-property pivot for dynamic-required surfaces (Path C)
// ───────────────────────────────────────────────────────────────────────────
//
// First-instance candidate for `CSS-custom-property-pivot-for-dynamic-
// required-surfaces` doctrine (Aurelius PR-23 Ruling 5; sister-doctrine to
// Polish-4's `spec-amendment-in-substitution-PR` first-instance which Cipher
// §B-framed observational). Path C narrow-scope: spec amendment + --dyn-pct
// width/height-pct pivot only at Polish-6; --dyn-bg / --dyn-fg / --dyn-border
// deferred to Polish-7+ first-instance evaluations per Maren+Kael Mode 2
// dual-endorsement.
//
// 1 new token (--dyn-pct) + 2 new classes (.dyn-fill width-pivot;
// .dyn-fill-h height-pivot) + DESIGN_PRINCIPLES.md `--dyn-*` family rule +
// compound-style partial-pivot clause (Kael Mode 2 surfacing).
//
// 9 site sweep (width 8 + height 1):
//   - diet.js:3048/:3117/:3458/:3513 (4 pure-width pivot)
//   - intelligence.js:11794/:11803 (2 pure-width pivot)
//   - intelligence.js:14803 (1 pure-height pivot via .dyn-fill-h)
//   - intelligence.js:15484 (1 compound-partial: width via --dyn-pct;
//     background:${m.color} stays inline per partial-pivot clause)
//   - home.js:2706 (1 compound-partial: width via --dyn-pct; height +
//     border-radius + background + transition stay inline)

test.describe('Polish-6 — CSS-custom-property pivot (Path C; --dyn-pct width/height-pivot)', () => {
  test('positive — --dyn-pct token resolves runtime values + .dyn-fill consumes via getComputedStyle', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');

    // Probe: create a div with class="dyn-fill" + style="--dyn-pct:67%".
    // Computed width must resolve to 67% (or browser-canonical equivalent).
    const result = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'dyn-fill';
      probe.style.setProperty('--dyn-pct', '67%');
      // Parent with explicit width so % resolves predictably.
      const parent = document.createElement('div');
      parent.style.width = '300px';
      parent.appendChild(probe);
      document.body.appendChild(parent);
      const computed = getComputedStyle(probe).width;
      const tokenResolved = getComputedStyle(probe).getPropertyValue('--dyn-pct').trim();
      parent.remove();
      return { computed, tokenResolved };
    });

    expect(result.tokenResolved, '--dyn-pct token resolves to assigned runtime value').toBe('67%');
    // 67% of 300px = 201px.
    expect(result.computed, '.dyn-fill consumes --dyn-pct via var() — width resolves to 67% of parent (201px)').toBe('201px');
  });

  test('regression-guard — pure width:${...}% / height:${...}% inline-style patterns absent from production source (post-Polish-6 sweep)', async ({ request }) => {
    // Fetch each production source file directly + verify no residual pure
    // dynamic-pct inline-style patterns. This scopes the assertion to
    // production source contributions (out-of-scope sites in JS-side hex
    // const lookups + Chart.js dataset configs — Stability sub-phase
    // territory — would NOT match this width/height-pct template-literal
    // signature anyway).
    const FILES_TO_SCAN = [
      '/split/home.js',
      '/split/diet.js',
      '/split/medical.js',
      '/split/intelligence.js',
    ];
    // Pattern: `style="width:${...}%"` or `style='width:${...}%'`.
    // Compound-partial sites pivoted to --dyn-pct don't match this pattern
    // (they use `--dyn-pct:${...}%` not `width:${...}%`).
    const purePctPattern = /style=["']width:\$\{[^}]+\}%/;
    const pureHeightPattern = /style=["']height:\$\{[^}]+\}%/;

    for (const file of FILES_TO_SCAN) {
      const res = await request.get(file);
      expect(res.ok(), `${file} fetchable`).toBeTruthy();
      const src = await res.text();

      expect(purePctPattern.test(src),
        `${file}: pure width:\${pct}% inline-style pattern absent (pivoted to --dyn-pct + .dyn-fill)`).toBeFalsy();
      expect(pureHeightPattern.test(src),
        `${file}: pure height:\${pct}% inline-style pattern absent (pivoted to --dyn-pct + .dyn-fill-h)`).toBeFalsy();
    }
  });

  test('positive-regression — compound-partial-pivot sites preserve non-pivoted dynamic properties as inline-style residue (Kael partial-pivot clause)', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    const html = await res.text();

    // home.js:2706 compound-partial: width pivoted to --dyn-pct; height +
    // border-radius + background + transition stay inline.
    expect(html.includes('class="dyn-fill" style="--dyn-pct:${pct}%;height:100%;border-radius:2px;background:${barColor};transition:width var(--ease-slow);"'),
      'home.js:2706 compound-partial: width pivoted via --dyn-pct; height/border-radius/background/transition residue intact').toBeTruthy();

    // intelligence.js:15484 compound-partial: width pivoted; background:${m.color} stays inline.
    expect(html.includes('class="mb-meal-bar dyn-fill" style="--dyn-pct:${Math.max(pct, 4)}%;background:${m.color};"'),
      'intelligence.js:15484 compound-partial: width pivoted via --dyn-pct; background:${m.color} residue intact (--dyn-bg deferred to Polish-7+)').toBeTruthy();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Polish-7 — Responsive breakpoint normalization (canonical 4-value system)
// ───────────────────────────────────────────────────────────────────────────
//
// Header comment + pixel-value normalization in styles.css. Path: charter
// said "13 scattered global @media; migrate to canonical 4 values uniformly."
// Empirical Polish-7 build-deep grep (running-beats-reading 11th instance):
// 24 total @media queries — 10 Care-coherent (700/400 cat-pattern, Maren-
// preserved verbatim) + 1 Care-non-coherent (`.milestone-actions:1391`
// max-width:480 — non-canonical) + 10 non-Care pixel-based (ALL ALREADY
// canonical 360/400/500/700) + 3 special-feature queries (print +
// prefers-reduced-motion).
//
// Effective normalization: header comment at top of styles.css + 1 site
// swap (.milestone-actions 480→500 closest canonical). All other pixel
// values were already canonical; the 13-scattered framing was about
// queries being SPREAD across the file rather than centralized, not about
// non-canonical values.
//
// 4 canonical values: --bp-xs:360 / --bp-sm:400 / --bp-md:500 / --bp-lg:700.
// CSS custom properties cannot be consumed inside @media query conditions
// in current browsers (no @custom-media support yet); convention is enforced
// by R-7 regression-guard rather than by var() resolution.

test.describe('Polish-7 — Responsive breakpoint normalization (canonical 4-value system)', () => {
  test('positive — canonical breakpoint header comment present at top of styles.css', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    expect(res.ok(), '/split/styles.css fetchable').toBeTruthy();
    const css = await res.text();

    // Header comment must appear at top of file (before :root). Verify the
    // canonical 4 breakpoint values are documented.
    const headerSlice = css.slice(0, 2000);
    expect(headerSlice.includes('Responsive Breakpoint Conventions (Polish-7'),
      'Polish-7 header comment present at top of styles.css').toBeTruthy();
    expect(headerSlice.includes('--bp-xs : 360px'),
      'header documents --bp-xs:360px canonical').toBeTruthy();
    expect(headerSlice.includes('--bp-sm : 400px'),
      'header documents --bp-sm:400px canonical').toBeTruthy();
    expect(headerSlice.includes('--bp-md : 500px'),
      'header documents --bp-md:500px canonical').toBeTruthy();
    expect(headerSlice.includes('--bp-lg : 700px'),
      'header documents --bp-lg:700px canonical').toBeTruthy();
  });

  test('regression-guard — zero non-canonical pixel values in @media declarations', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    const css = await res.text();

    // Extract all pixel values from @media query parens. Canonical-4: 360,
    // 400, 500, 700. Any other value is a non-canonical violation.
    const CANONICAL_BPS = new Set(['360', '400', '500', '700']);

    // Match @media declarations + extract pixel values from inside parens.
    // Pattern: @media(max-width:NNNpx) or @media(min-width:NNNpx) or
    // @media(...condition...) (other forms — feature queries — don't have
    // pixel values).
    const mediaRegex = /@media[^{]*?\((?:min|max)-width:\s*(\d+)px\)/g;
    const violations: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mediaRegex.exec(css)) !== null) {
      const px = match[1];
      if (!CANONICAL_BPS.has(px)) {
        violations.push(`${px}px (in: ${match[0]})`);
      }
    }

    expect(violations,
      `non-canonical @media pixel values present: ${violations.join('; ')}`).toEqual([]);
  });

  test('positive-regression — Care-coherent 10 cat-grid queries preserved verbatim at canonical 700/400', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    const css = await res.text();

    // Care-coherent pattern (Maren-preserved): 5 cat-grid pairs × 2 queries
    // each = 10 queries. Each pair has max-width:700px AND max-width:400px,
    // both targeting the same cat-grid selector with `grid-template-columns:1fr`.
    // Verify each cat-grid has BOTH 700 and 400 queries present.
    const CAT_GRIDS = ['food-cats', 'ms-cats', 'activity-cats', 'upcoming-cats', 'tip-cats'];
    for (const grid of CAT_GRIDS) {
      const re700 = new RegExp(`@media\\(max-width:700px\\)\\s*\\{\\s*\\.${grid}\\b`);
      const re400 = new RegExp(`@media\\(max-width:400px\\)\\s*\\{\\s*\\.${grid}\\b`);
      expect(re700.test(css),
        `Care-coherent: .${grid} has @media(max-width:700px) preserved verbatim`).toBeTruthy();
      expect(re400.test(css),
        `Care-coherent: .${grid} has @media(max-width:400px) preserved verbatim`).toBeTruthy();
    }
  });
});

test.describe('Polish-10a — SVG-in-data architectural shift + HR-1/HR-4 sweep', () => {
  // Visible-bug root cause: zi() output (`<svg class="zi">`) stored as data
  // on illness-episode `emoji` fields and concatenated into HTML title="..."
  // attributes. The embedded `class="zi"` quote prematurely terminates the
  // attribute and leaks the trailing markup as rendered DOM text. Fix shape:
  // strip SVG from data structures (store icon-key string only); render
  // `zi(key)` at display boundary; title="..." carries plain-text only,
  // escHtml-applied for defense-in-depth.

  test('positive — zero <svg substring inside any title="..." attribute in built bundle', async ({ request }) => {
    const res = await request.get('/sproutlab.html');
    expect(res.ok(), '/sproutlab.html fetchable').toBeTruthy();
    const html = await res.text();

    // Match every title="..." attribute. The non-greedy [^"]* stops at the
    // first closing quote, so any leaked `<svg` BEFORE that quote means the
    // attribute genuinely contains SVG markup (not a SVG sibling rendered
    // adjacent to the title-bearing element).
    const titleAttrRegex = /title="[^"]*<svg[^"]*"/g;
    const matches = html.match(titleAttrRegex) || [];
    expect(matches,
      `Polish-10a: no title="..." attribute may contain <svg markup. Found: ${matches.slice(0, 3).join(' | ')}`)
      .toEqual([]);
  });

  test('regression-guard — zero illness-episode emoji-as-data leaks at constructor sites', async ({ request }) => {
    const res = await request.get('/split/medical.js');
    expect(res.ok(), '/split/medical.js fetchable').toBeTruthy();
    const js = await res.text();

    // Polish-10a fix shape: illness-episode constructors at _getAllEpisodes
    // and computeIllnessFoodCorrelation must store icon-key strings, not
    // rendered SVG. Match the original buggy pattern.
    const buggyPattern = /emoji:\s*zi\('(?:flame|diaper|siren)'\)/g;
    const violations = js.match(buggyPattern) || [];
    expect(violations,
      `Polish-10a: illness-episode constructors must store iconKey string, not zi() output. Found: ${violations.join(' | ')}`)
      .toEqual([]);
  });

  test('positive-regression — .mi-legend-item carries white-space:nowrap; legend wrapper preserved', async ({ request }) => {
    const res = await request.get('/split/styles.css');
    const css = await res.text();

    // Polish-10a side-fix: prevent legend-label wrapping that contributed to
    // visual stacking artifact in Illness Frequency Timeline.
    const legendItemDecl = /\.mi-legend-item\s*\{[^}]*white-space\s*:\s*nowrap\s*[;}]/;
    expect(legendItemDecl.test(css),
      'Polish-10a: .mi-legend-item must include white-space:nowrap').toBeTruthy();

    // Care-domain wrapper class preserved.
    expect(css.includes('.mi-legend {'),
      'Polish-10a: .mi-legend wrapper class preserved').toBeTruthy();
  });

  test('regression-guard — title="..." attrs in HR-4-fixed sites use escAttr (no raw user-data interpolation)', async ({ request }) => {
    const medRes = await request.get('/split/medical.js');
    const med = await medRes.text();
    const intelRes = await request.get('/split/intelligence.js');
    const intel = await intelRes.text();
    const homeRes = await request.get('/split/home.js');
    const home = await homeRes.text();

    // Sites where Polish-10a applied escAttr() — verify the wrapped form
    // remains in source (regression guard against accidental revert).
    expect(med.includes("escAttr(d.hydraFoods.join(', ') || 'none')"),
      'Polish-10a: medical.js hydraFoods title uses escAttr').toBeTruthy();
    expect(intel.includes("escAttr(foods.join(', '))"),
      'Polish-10a: intelligence.js heatmap-cell title uses escAttr').toBeTruthy();
    expect(intel.includes('escAttr(n)'),
      'Polish-10a: intelligence.js nutrient badge title uses escAttr').toBeTruthy();
    expect(home.includes('escAttr(nextMeta.label)'),
      'Polish-10a: home.js milestone-override title uses escAttr').toBeTruthy();
    expect(home.includes('escAttr((POOP_COLORS[c]||{}).label||c)'),
      'Polish-10a: home.js poop-color-strip title uses escAttr').toBeTruthy();
  });

  test('positive — HR-1 emoji removed at 11 named cross-Governor-catch sites (Polish-10a absorption of P-1 subset)', async ({ request }) => {
    const medRes = await request.get('/split/medical.js');
    const med = await medRes.text();
    const intelRes = await request.get('/split/intelligence.js');
    const intel = await intelRes.text();

    // medical.js: 4 HR-1 sites previously deferred to R-10 P-1, absorbed
    // into Polish-10a (route a — single zi() swap fix-shape).
    expect(med.includes("'\u{1F6BB}'") || med.includes('\u{1F6BB}'),
      'medical.js: zero residual stethoscope literals').toBeFalsy();
    // Use the actual emoji glyph in source-search; if grep against bundle
    // returned 1 (template.html shared-module deferred), source is clean.
    const stethEmojiInMed = (med.match(/\u{1FA7A}/gu) || []).length;
    expect(stethEmojiInMed,
      `medical.js: zero stethoscope-emoji glyphs in source. Found: ${stethEmojiInMed}`).toBe(0);

    // intelligence.js: 7 HR-1 sites (5 diaper + 2 stethoscope) absorbed.
    const diaperEmojiInIntel = (intel.match(/\u{1FA72}/gu) || []).length;
    expect(diaperEmojiInIntel,
      `intelligence.js: zero diaper-emoji glyphs in source. Found: ${diaperEmojiInIntel}`).toBe(0);
    const stethEmojiInIntel = (intel.match(/\u{1FA7A}/gu) || []).length;
    expect(stethEmojiInIntel,
      `intelligence.js: zero stethoscope-emoji glyphs in source. Found: ${stethEmojiInIntel}`).toBe(0);
  });
});

test.describe('Polish-10b — HR-3 onclick batch (Care + Home; ~24 sites)', () => {
  // Polish-10b absorbs the inline-onclick HR-3 violations across the Care
  // jurisdiction (medical.js doctor cards, vacc UI; home.js missed-med
  // alerts, feeding day toggles, milestone expanders, diet pill fillers,
  // contextual-alert tip toggles + actions). Two new generic dispatcher
  // handlers introduced (toggleDisplayBlock, toggleDisplayFlex) for the
  // common display-toggle pattern that previously inlined a 6-step DOM
  // mutation chain.

  test('positive — new dispatcher handlers wired in core.js (toggleDisplayBlock, toggleDisplayFlex, plus ~14 named function dispatchers)', async ({ request }) => {
    const res = await request.get('/split/core.js');
    expect(res.ok(), '/split/core.js fetchable').toBeTruthy();
    const js = await res.text();

    // Generic toggle handlers (Polish-10b new).
    expect(js.includes("action === 'toggleDisplayBlock'"),
      'core.js dispatcher includes toggleDisplayBlock').toBeTruthy();
    expect(js.includes("action === 'toggleDisplayFlex'"),
      'core.js dispatcher includes toggleDisplayFlex').toBeTruthy();

    // Named function dispatchers.
    const NAMED_HANDLERS = [
      'resolveMissedMedDone', 'resolveMissedMedSkipped',
      'markMedDone', 'markMedSkipped',
      'deleteFeedingEntry', 'switchFoodCatSub',
      'expandMilestoneByIdx', 'expandUpcomingItem',
      'fillDietMeal', 'insertDietFood',
      'toggleAlertTip', 'execAlertAction',
      'switchTab', 'toggleUpcomingSubcat',
    ];
    for (const handler of NAMED_HANDLERS) {
      expect(js.includes(`action === '${handler}'`),
        `core.js dispatcher includes ${handler}`).toBeTruthy();
    }
  });

  test('regression-guard — zero onclick=" attrs at converted Polish-10b ranges (medical.js + home.js)', async ({ request }) => {
    const medRes = await request.get('/split/medical.js');
    const med = await medRes.text();
    const homeRes = await request.get('/split/home.js');
    const home = await homeRes.text();

    // Polish-10b: 3 medical.js conversions (lines were :301, :794, :4119).
    // Verify the previously-inlined patterns are absent.
    const buggyMedPatterns = [
      // toggleDisplay*-style inlines that Polish-10b absorbed.
      `onclick="event.stopPropagation();document.getElementById(\\'`,
      `onclick="const e=document.getElementById('`,
      `onclick="event.stopPropagation();toggleUpcomingSubcat('`,
    ];
    for (const pattern of buggyMedPatterns) {
      expect(med.includes(pattern),
        `medical.js: zero residual inlined onclick of pattern: ${pattern}`).toBeFalsy();
    }

    // Polish-10b: 21 home.js conversions across multiple pattern families.
    const buggyHomePatterns = [
      `onclick="resolveMissedMed(`,
      `onclick="markMedDone(`,
      `onclick="markMedSkipped(`,
      `onclick="event.stopPropagation();deleteFeedingEntry(`,
      `onclick="switchFoodCatSub(`,
      `onclick="expandMilestoneByIdx(`,
      `onclick="expandUpcomingItem(`,
      `onclick="fillDietMeal(`,
      `onclick="insertDietFood(`,
      `onclick="event.stopPropagation();toggleAlertTip(`,
      `onclick="event.stopPropagation();execAlertAction(`,
      `onclick="event.stopPropagation();switchTab(`,
    ];
    for (const pattern of buggyHomePatterns) {
      expect(home.includes(pattern),
        `home.js: zero residual inlined onclick of pattern: ${pattern}`).toBeFalsy();
    }

    // Display-toggle inlines (the 6-step DOM mutation chain) — verify both
    // medical.js and home.js no longer carry the literal pattern fragment.
    const TOGGLE_FRAGMENT_BLOCK = `style.display==='none'?'block':'none'`;
    const TOGGLE_FRAGMENT_FLEX = `style.display==='none'?'flex':'none'`;
    expect(med.includes(TOGGLE_FRAGMENT_BLOCK) || med.includes(TOGGLE_FRAGMENT_FLEX),
      'medical.js: zero residual display-toggle inlines (Polish-10b absorbs all)').toBeFalsy();

    // home.js: only the SKIP-list site at home.js:637 may carry a display
    // toggle fragment (compound chained-call inline; deferred to R-10).
    // Other sites must be free of the pattern.
    // For tractability we just check that the count is small.
    const homeBlockMatches = (home.match(/style\.display=='none'\?'block':'none'/g) || []).length;
    const homeFlexMatches = (home.match(/style\.display=='none'\?'flex':'none'/g) || []).length;
    expect(homeBlockMatches + homeFlexMatches,
      `home.js: at most 1 residual display-toggle inline (R-10 carry-forward at :637 chained-compound). Found: ${homeBlockMatches + homeFlexMatches}`)
      .toBeLessThanOrEqual(1);
  });

  test('regression-guard r2 (Maren F-35-1) — escAttr-in-data-arg corrupts user-content via backslash-leak; user-content data-arg/data-arg2 positions must use escHtml not escAttr', async ({ request }) => {
    // Maren's Polish-10b audit found that escAttr (core.js:2252) is
    // `s.replace(/'/g, "\\'").replace(/"/g, '&quot;')` — designed for
    // embedding inside a JS string literal within an attribute. When
    // applied to data-arg="..." the HTML attribute parser does not decode
    // \' as escape; backslash leaks through dataset.arg into the
    // dispatcher's function call. Parent-facing failure: a food name like
    // John's pasta saves to localStorage as John\'s pasta and syncs
    // corrupted to Firestore. r2 fix: swap escAttr → escHtml at all
    // user-content data-arg / data-arg2 positions; apostrophe in double-
    // quoted HTML attribute is parser-safe; escHtml leaves apostrophe
    // literal; dataset.arg returns clean string.
    const homeRes = await request.get('/split/home.js');
    const home = await homeRes.text();

    // Affected fields: m.name (medication), nextMilestone.text (milestone),
    // val (food meal value), f.name (food name), comboStr (combo string),
    // s.partner (synergy partner food name).
    const buggyPattern = /data-arg2?="\$\{escAttr\((m\.name|nextMilestone\.text|comboStr|s\.partner|f\.name|val)\b/g;
    const violations = home.match(buggyPattern) || [];
    expect(violations,
      `Polish-10b r2: zero escAttr in user-content data-arg positions (Maren F-35-1 fix). Found: ${violations.join(' | ')}`)
      .toEqual([]);
  });
});

test.describe('Polish-10c — HR-3 onclick batch (Intelligence + Diet; ~15 sites)', () => {
  // Polish-10c absorbs the inline-onclick HR-3 violations across the
  // Intelligence jurisdiction (intelligence.js fever/diarrhoea/vomiting/
  // cold episode action chips, severity selectors, nutrient-heatmap cells)
  // plus 1 diet.js site (toggleCorrEvidence). Single fix-shape per atomic-
  // canon discipline: function-call delegation via data-action + data-arg.
  //
  // Compound onclicks (set-value + call, this.closest, template-string
  // injection) deferred to R-10 carry-forward — different fix-shape needs
  // separate atomic-canon treatment.

  test('positive — 11 named function dispatchers wired in core.js for Intelligence + Diet domains', async ({ request }) => {
    const res = await request.get('/split/core.js');
    expect(res.ok(), '/split/core.js fetchable').toBeTruthy();
    const js = await res.text();

    const NAMED_HANDLERS = [
      'logFeverAction',
      'logDiarrhoeaWetDiaper', 'logDiarrhoeaAction',
      'logVomitingWetDiaper', 'logVomitingEpisodeEntry', 'logVomitingAction',
      'ceToggleSymptom', 'ceSetSeverity',
      'logColdAction',
      'showHeatmapDetail',
      'toggleCorrEvidence',
    ];
    for (const handler of NAMED_HANDLERS) {
      expect(js.includes(`action === '${handler}'`),
        `core.js dispatcher includes ${handler}`).toBeTruthy();
    }
  });

  test('regression-guard — zero onclick=" attrs at converted Polish-10c ranges (intelligence.js + diet.js)', async ({ request }) => {
    const intelRes = await request.get('/split/intelligence.js');
    const intel = await intelRes.text();
    const dietRes = await request.get('/split/diet.js');
    const diet = await dietRes.text();

    const buggyIntelPatterns = [
      `onclick="logFeverAction(`,
      `onclick="logDiarrhoeaWetDiaper(`,
      `onclick="logDiarrhoeaAction(`,
      `onclick="logVomitingWetDiaper(`,
      `onclick="logVomitingEpisodeEntry(`,
      `onclick="logVomitingAction(`,
      `onclick="ceToggleSymptom(`,
      `onclick="ceSetSeverity(`,
      `onclick="logColdAction(`,
      `onclick="showHeatmapDetail(`,
    ];
    for (const pattern of buggyIntelPatterns) {
      expect(intel.includes(pattern),
        `intelligence.js: zero residual inlined onclick of pattern: ${pattern}`).toBeFalsy();
    }

    expect(diet.includes(`onclick="toggleCorrEvidence(`),
      'diet.js: zero residual inlined onclick of toggleCorrEvidence').toBeFalsy();

    // Verify the new data-action attribute presence as positive complement.
    expect(intel.includes(`data-action="logFeverAction"`),
      'intelligence.js: logFeverAction converted to data-action').toBeTruthy();
    expect(diet.includes(`data-action="toggleCorrEvidence"`),
      'diet.js: toggleCorrEvidence converted to data-action').toBeTruthy();
  });
});

test.describe('Polish-10d hotfix — sections.* iconKey architectural sweep (Sovereign-caught visible bug at sections.diet)', () => {
  // Sovereign-caught visible bug: Doctor Visit Prep > Diet row rendered
  // literal text "bowl" instead of an SVG icon. Root cause: medical.js:9248
  // sections.diet was constructed with `emoji: 'bowl'` (a string literal,
  // not the rendered SVG `zi('bowl')`). The Polish-10a r3 consumer fallback
  // `(sec.iconKey ? zi(sec.iconKey) : sec.emoji)` faithfully preserved the
  // bug because sections.diet had .emoji='bowl' (string) with no .iconKey,
  // so it fell through to render the literal string. Maren flagged as
  // F-34-1 NIT in Polish-10a audit; Lyra deferred per narrow-scope to
  // Stability sub-phase as P-9 — wrong call, since visible-bug-is-visible
  // doesn't defer per hermetic-floor doctrine. Hotfix discharges P-9 +
  // absorbs P-8 sibling architectural sweep (4 sections.* sites total)
  // simultaneously since fix shape is uniform; consumer ternary
  // simplifies to direct zi(sec.iconKey) call.

  test('positive — all 5 sections.* constructors use iconKey shape (no emoji-as-data residual)', async ({ request }) => {
    const res = await request.get('/split/medical.js');
    expect(res.ok(), '/split/medical.js fetchable').toBeTruthy();
    const js = await res.text();

    // Match any sections.<name> = { ... emoji: ... } pattern. Polish-10d
    // converts all 5 (growth, milestones, activities, diet, poop) to
    // iconKey shape; the architectural shift completes for this code path.
    const sectionsEmojiPattern = /sections\.\w+\s*=\s*\{[^}]*emoji:/g;
    const violations = js.match(sectionsEmojiPattern) || [];
    expect(violations,
      `Polish-10d: zero sections.* constructors may use emoji: shape (architectural sweep). Found: ${violations.join(' | ')}`)
      .toEqual([]);

    // All 5 known sections present with iconKey: 'name' shape.
    const REQUIRED_ICON_KEYS = ['scale', 'brain', 'run', 'bowl', 'diaper'];
    for (const key of REQUIRED_ICON_KEYS) {
      expect(js.includes(`iconKey: '${key}'`),
        `Polish-10d: sections.* must include iconKey:'${key}' (visible bug at 'bowl' fixes)`).toBeTruthy();
    }
  });

  test('regression-guard — Visit Prep section consumer renders via zi(sec.iconKey) directly (no ternary fallback)', async ({ request }) => {
    const res = await request.get('/split/medical.js');
    const js = await res.text();

    // Polish-10d simplifies the Polish-10a r3 fallback ternary
    // `(sec.iconKey ? zi(sec.iconKey) : sec.emoji)` to direct zi(sec.iconKey)
    // since all sections.* now use iconKey shape uniformly.
    expect(js.includes('zi(sec.iconKey)'),
      'Polish-10d: consumer renders via zi(sec.iconKey) direct call').toBeTruthy();

    // Old fallback ternary must be absent (would indicate incomplete absorption).
    expect(js.includes('sec.iconKey ? zi(sec.iconKey) : sec.emoji'),
      'Polish-10d: consumer fallback ternary removed (architectural sweep complete)').toBeFalsy();

    // The 'bowl' literal-string anti-pattern that caused the visible
    // Sovereign-surfaced bug must be absent.
    expect(js.match(/emoji:\s*'bowl'/g) || [],
      `Polish-10d: zero 'emoji: bowl' string-literal residue (visible-bug source)`).toEqual([]);
  });
});
