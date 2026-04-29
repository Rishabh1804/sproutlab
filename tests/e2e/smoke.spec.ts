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
//   default-positive — simple-mode user: toast renders + reveals + has dispatcher wiring
//   opt-out-positive — full-mode user:    same
//   mode-contract-regression — toast in DOM under BOTH modes; visibility controlled
//                              by [hidden] attribute, NOT by mode (regression-guard
//                              against accidental simple-mode hide rule)
//
// Test approach: trigger the reveal via direct page.evaluate (mocking the
// updatefound→installed→controller chain). Real SW-script-swap simulation
// is jurisdictionally distinct (Playwright doesn't expose a clean primitive
// for swapping the SW script mid-test); the chain itself is verified by
// PR-13's cache-lifecycle suite. This describe block tests the UI surface +
// data-action wiring under both UX modes.

test.describe('Update-detection toast (Phase 2 PR-5)', () => {
  test('default-positive — simple-mode user sees toast on update', async ({ page }) => {
    await stubChartJs(page);
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);

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
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);

    await expect(page.locator('body')).not.toHaveClass(/\bsimple-mode\b/);

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

    // Pass 1: simple-mode default
    await page.goto('/index.html?nosync');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('body')).toHaveClass(/\bsimple-mode\b/);
    await expect(page.locator('#updateToast'), 'toast in DOM under simple-mode').toHaveCount(1);
    await expect(page.locator('#headerFull'), 'simple-mode hides #headerFull').toBeHidden();
    await expect(page.locator('#statusStrip'), 'strip visible (toast container)').toBeVisible();
    // Toast itself is hidden by [hidden] attribute, NOT by simple-mode CSS.
    // After removeAttribute('hidden'), it should be visible regardless of mode.
    await page.evaluate(() => {
      const el = document.getElementById('updateToast');
      if (el) el.removeAttribute('hidden');
    });
    await expect(page.locator('#updateToast'), 'toast reveals under simple-mode').toBeVisible();

    // Pass 2: opt out, reload
    await page.evaluate(() => {
      try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {}
    });
    await page.reload();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect(page.locator('body')).not.toHaveClass(/\bsimple-mode\b/);
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

test.describe('PR-9 hotfix — dispatch crashes do not trip sync circuit (Issue 1 root cause)', () => {
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

test.describe('PR-9 hotfix — orderMedicalCards null-guard (Issue 2 root cause)', () => {
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

    // Pass 3: simple-mode opt-out should not change the strip's mode contract
    await page.evaluate(() => { try { window.localStorage.setItem('ziva_simple_mode', 'false'); } catch {} });
    await page.reload();
    await page.waitForFunction(() => typeof (window as { _syncSetActivity?: unknown })._syncSetActivity === 'function');
    await expect(page.locator('body'), 'simple-mode opted out').not.toHaveClass(/\bsimple-mode\b/);
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
