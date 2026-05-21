import { test, expect } from '@playwright/test';

// PR-I — viz interactivity layer. Confirms the vizDetailPopup primitive and
// per-cell data-action="vizShowDetail" wiring work end to end: a tap on a
// viz data element opens a domain-accented detail card, and every close
// path (X button, backdrop, hardware back) dismisses it.

async function openInfoTab(page) {
  // The Info tab is hidden under essential-mode (the default); opt out before
  // init runs so the tab button is visible and clickable.
  await page.addInitScript(() => {
    try { window.localStorage.setItem('ziva_essential_mode', 'false'); } catch {}
  });
  await page.goto('/index.html?nosync');
  await page.locator('.tab-bar').waitFor({ state: 'visible' });
  const infoBtn = page.locator('.tab-bar .tab-btn[data-tab="info"]');
  await infoBtn.scrollIntoViewIfNeeded();
  // The tab delegation may not be wired the instant `load` fires; retry the
  // click until the Info panel actually activates (renderInfo() runs then).
  await expect(async () => {
    await infoBtn.click();
    await expect(page.locator('#tab-info')).toHaveClass(/\bactive\b/, { timeout: 1500 });
  }).toPass({ timeout: 12_000 });
  await page.locator('[data-action="vizShowDetail"]').first().waitFor({ state: 'attached', timeout: 10_000 });
  // Info-tab cards ship collapsed (collapse-body display:none). Expand them so
  // the viz inside is visible — mirrors a parent tapping a card open.
  await page.evaluate(() => {
    document.querySelectorAll('#tab-info .collapse-body').forEach((b) => {
      (b as HTMLElement).style.display = '';
      b.classList.add('open');
    });
  });
  await page.locator('[data-action="vizShowDetail"]:visible').first()
    .waitFor({ state: 'visible', timeout: 10_000 });
}

// Returns the first viz data element that is actually visible on screen.
function firstVisibleViz(page) {
  return page.locator('[data-action="vizShowDetail"]:visible').first();
}

test('info tab renders many tappable viz elements', async ({ page }) => {
  await openInfoTab(page);
  const count = await page.locator('[data-action="vizShowDetail"]').count();
  expect(count).toBeGreaterThan(20);
});

test('tapping a viz element opens the detail popup', async ({ page }) => {
  await openInfoTab(page);
  const viz = firstVisibleViz(page);
  await viz.scrollIntoViewIfNeeded();
  await viz.click();
  const overlay = page.locator('.viz-detail-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay.locator('.viz-detail-title')).not.toBeEmpty();
  await expect(overlay.locator('.viz-detail-card')).toBeVisible();
});

test('X button closes the popup', async ({ page }) => {
  await openInfoTab(page);
  const viz = firstVisibleViz(page);
  await viz.scrollIntoViewIfNeeded();
  await viz.click();
  await expect(page.locator('.viz-detail-overlay')).toBeVisible();
  await page.locator('.viz-detail-close').click();
  await expect(page.locator('.viz-detail-overlay')).toHaveCount(0);
});

test('backdrop tap and hardware back both close the popup', async ({ page }) => {
  await openInfoTab(page);
  const viz = firstVisibleViz(page);
  await viz.scrollIntoViewIfNeeded();
  await viz.click();
  await expect(page.locator('.viz-detail-overlay')).toBeVisible();
  // Backdrop tap — click the overlay at a corner, away from the card.
  await page.locator('.viz-detail-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('.viz-detail-overlay')).toHaveCount(0);
  // Re-open, then close via hardware back.
  await viz.scrollIntoViewIfNeeded();
  await viz.click();
  await expect(page.locator('.viz-detail-overlay')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.viz-detail-overlay')).toHaveCount(0);
});

test('popup renders detail rows and a domain accent', async ({ page }) => {
  await openInfoTab(page);
  const viz = firstVisibleViz(page);
  await viz.scrollIntoViewIfNeeded();
  await viz.click();
  const card = page.locator('.viz-detail-card');
  await expect(card).toBeVisible();
  // The card carries one of the seven domain-accent classes.
  await expect(card).toHaveClass(/viz-detail-(sage|rose|amber|lav|sky|indigo|peach)/);
  // At least one label/value detail row rendered.
  await expect(card.locator('.viz-detail-row').first()).toBeVisible();
});
