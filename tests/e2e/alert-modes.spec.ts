import { test, expect } from '@playwright/test';

// PR-K Phase 2 — the 4-mode alert model.
// Verifies: mode-derived clear controls render correctly; dismiss / acknowledge
// / snooze actually persist (the gap PR-J's win-× exposed — positive alerts
// pushed unconditionally with no filter); safety-locked alerts cannot be
// permanently silenced.

test('alert cards render the clear control derived from their mode', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.locator('#homeUnifiedAlertsCard, #homeZenState').first().waitFor({ state: 'attached' });
  await page.waitForTimeout(800);

  // Win cards (id ca-hmw-...) carry a warm "Got it", never a corner ×.
  const winCards = page.locator('[id^="ca-hmw-"]');
  for (let i = 0; i < await winCards.count(); i++) {
    const card = winCards.nth(i);
    await expect(card.locator('.cab-ack'), 'win card has a "Got it" control').toHaveCount(1);
    await expect(card.locator('.ctx-alert-dismiss'), 'win card has no corner ×').toHaveCount(0);
  }
});

test('dismiss / acknowledge / snooze persist across recompute', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    const alerts = computeAlerts();
    // Pick the first alert that is NOT safety-locked — those resist clearing.
    const target = alerts.find(a => !a.safetyLocked);
    if (!target) return { skipped: true };
    const mode = getAlertMode(target);
    const before = computeAlerts().some(a => a.key === target.key);
    if (mode === 'acknowledge') acknowledgeAlert(target.key, target.title);
    else if (mode === 'snooze') snoozeAlert(target.key, target.title);
    else dismissAlert(target.key, target.title);
    const after = computeAlerts().some(a => a.key === target.key);
    return { skipped: false, mode, before, after };
  });

  if (result.skipped) test.skip(true, 'seed produced no clearable alert');
  expect(result.before, 'alert was present before clearing').toBe(true);
  expect(result.after, `alert is gone after ${result.mode}`).toBe(false);
});

test('safety-locked alerts cannot be permanently dismissed', async ({ page }) => {
  await page.goto('/index.html?nosync');
  await page.waitForTimeout(800);

  const result = await page.evaluate(() => {
    // A safety-locked alert always resolves to 'snooze' mode, never 'dismiss'.
    const locked = { severity: 'info', safetyLocked: true, key: 'x', title: 't' };
    const plainInfo = { severity: 'info', key: 'y', title: 't' };
    const lockedAction = { severity: 'action', safetyLocked: true, key: 'z', title: 't' };
    return {
      lockedMode: getAlertMode(locked),
      plainMode: getAlertMode(plainInfo),
      actionMode: getAlertMode(lockedAction),
    };
  });

  expect(result.lockedMode, 'safety-locked info → snooze, never dismiss').toBe('snooze');
  expect(result.plainMode, 'plain info → dismiss').toBe('dismiss');
  expect(result.actionMode, 'action stays action even when locked').toBe('action');
});
