import { test, expect, type Page } from '@playwright/test';

// Issue #6 / V-V-2 / V-M-1 — persistent shared a11y live region (all-regions fix).
//
// The 5 status surfaces (sync indicator, sync activity pill, update toast,
// offline/halted badge, app version) previously each carried their own
// aria-live/role=status on an element toggled via [hidden]. A live region inside
// a display:none ancestor is removed from the accessibility tree, so a same-tick
// unhide-then-write does not reliably announce on older AT. The fix routes all
// announcements through a single persistent #a11yLive region that is ALWAYS in
// the a11y tree (sr-only, never display:none), via _a11yAnnounce().

async function gotoApp(page: Page): Promise<void> {
  await page.goto('/?nosync');
  await page.waitForFunction(() => typeof (window as any)._a11yAnnounce === 'function', null, { timeout: 15_000 });
}

test('#a11yLive persistent region exists and is in the a11y tree (not display:none)', async ({ page }) => {
  await gotoApp(page);
  const live = page.locator('#a11yLive');
  await expect(live).toHaveCount(1);

  const state = await page.evaluate(() => {
    const el = document.getElementById('a11yLive')!;
    const cs = getComputedStyle(el);
    return {
      hidden: el.hasAttribute('hidden'),
      display: cs.display,
      role: el.getAttribute('role'),
      ariaLive: el.getAttribute('aria-live'),
      inHiddenAncestor: !!el.closest('[hidden]'),
    };
  });
  // Must be a polite status region, present and never removed from the a11y tree.
  expect(state.role).toBe('status');
  expect(state.ariaLive).toBe('polite');
  expect(state.hidden).toBe(false);
  expect(state.display).not.toBe('none');
  expect(state.inHiddenAncestor).toBe(false);
});

test('_a11yAnnounce writes into #a11yLive', async ({ page }) => {
  await gotoApp(page);
  const text = await page.evaluate(async () => {
    (window as any)._a11yAnnounce('Test announcement');
    // _a11yAnnounce clears then sets on the next animation frame.
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    return document.getElementById('a11yLive')!.textContent;
  });
  expect(text).toBe('Test announcement');
});

test('going offline announces through #a11yLive (not the badge\'s own aria-live)', async ({ page, context }) => {
  await gotoApp(page);

  // Sanity: the visual surfaces are now visual-only — no per-element live region.
  const attrs = await page.evaluate(() => {
    const ids = ['syncStatus', 'syncActivity', 'updateToast', 'appVersion'];
    const out: Record<string, boolean> = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      out[id] = !!el && (el.hasAttribute('aria-live') || el.getAttribute('role') === 'status');
    });
    const copy = document.querySelector('.offline-badge__copy');
    out['offlineBadgeCopy'] = !!copy && (copy.hasAttribute('aria-live') || copy.getAttribute('role') === 'status');
    return out;
  });
  // None of the visual surfaces should carry their own live region anymore.
  expect(Object.values(attrs).some(Boolean)).toBe(false);

  // Flip offline → the visibility store drives _syncUpdateOfflineBadge, which
  // announces the offline copy through #a11yLive.
  await context.setOffline(true);
  await expect(page.locator('#offlineBadge')).toBeVisible({ timeout: 5_000 });
  await expect
    .poll(async () => page.evaluate(() => document.getElementById('a11yLive')!.textContent), { timeout: 5_000 })
    .toContain('Offline');

  await context.setOffline(false);
});
