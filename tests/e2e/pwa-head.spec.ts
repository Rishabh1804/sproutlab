import { test, expect } from '@playwright/test';

// PWA installability head tags (2026-09-18).
// Architect report: the "Install app" option vanished on Android. Root cause:
// build.sh's <head> heredoc never emitted <link rel="manifest"> (or the
// theme-color / apple-* tags) — they only ever lived in the retired beta/ pages,
// so the split-file build has been non-installable since April. Chrome offers
// install only when the page links a manifest; iOS reads the apple-* tags.
// QA chain canon-cc-008: build.sh only (Public Works) — no Governor jurisdiction
// touched; Cipher Edict V final-pass.

test('index.html head links the manifest and carries the PWA meta tags', async ({ request }) => {
  const res = await request.get('/index.html');
  expect(res.ok()).toBe(true);
  const html = await res.text();
  const head = html.slice(0, html.indexOf('</head>'));
  expect(head.length, '</head> present').toBeGreaterThan(0);

  expect(head).toMatch(/<link rel="manifest" href="manifest\.json">/);
  expect(head).toMatch(/<meta name="theme-color" content="#fdf0f3">/);
  expect(head).toMatch(/<meta name="mobile-web-app-capable" content="yes">/);
  expect(head).toMatch(/<meta name="apple-mobile-web-app-capable" content="yes">/);
  expect(head).toMatch(/<meta name="apple-mobile-web-app-status-bar-style" content="default">/);
  expect(head).toMatch(/<meta name="apple-mobile-web-app-title" content="Ziva's Dashboard">/);
  expect(head).toMatch(/<link rel="apple-touch-icon" href="apple-touch-icon\.png">/);
});

test('manifest and icons the head references resolve', async ({ request }) => {
  const m = await (await request.get('/manifest.json')).json();
  expect(m.display).toBe('standalone');
  expect(m.start_url).toBe('./index.html');
  const sizes = m.icons.map((i: any) => i.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');
  for (const icon of m.icons) {
    const r = await request.get('/' + icon.src);
    expect(r.ok(), `${icon.src} resolves`).toBe(true);
  }
  expect((await request.get('/apple-touch-icon.png')).ok()).toBe(true);
});

test('theme-color meta is live: toggling dark mode rewrites it', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(500);
  const meta = page.locator('meta[name="theme-color"]');
  await expect(meta).toHaveCount(1);
  const before = await meta.getAttribute('content');
  await page.evaluate(() => { (window as any).toggleDarkMode(); });
  const after = await meta.getAttribute('content');
  expect(after).not.toBe(before);
  expect(['#1a1a2e', '#fdf0f3']).toContain(after);
});
