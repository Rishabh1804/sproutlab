import { test, expect } from '@playwright/test';

// food-effects-v2 Phase γ — the persistent ENCOURAGE Info-tab card
// (renderInfoNutIntro → #infoNutIntro). This is the surface that closes the γ
// gap: for an age-appropriate baby (Ziva is past the 6-month soft floor) the
// log-time consequence card never fires, so the benefit / safe-form / watch-for
// guidance lived in FOOD_EFFECTS but was unreachable. This card renders it.
//
// What this guards (spec §4 + the synthesis spine):
//   1. The card renders BENEFIT-FIRST — the sage benefit banner leads, above
//      the severe strip, with an AFFIRMING icon (zi-sprout), never zi-warn (V-3).
//   2. The emergency floor never moves (A-1/V-1): the severeSigns strip renders
//      UNCONDITIONALLY and NON-COLLAPSIBLY — the card has no accordion, the strip
//      has no collapse-body / <details> ancestor, all three red flags present.
//   3. The form-gate invariant (A-2): the "grinding removes choking NOT allergy /
//      never whole" note renders and is not suppressed by the benefit framing.
//   4. Content is sourced from the records (LEAP evidence surfaces); this is an
//      encourage-ONLY surface — honey (acute-toxin) is not given a benefit banner.
//   5. The "delay" myth (the paradigm reversal) and the high-risk cohort note
//      both reach the parent.

test.describe('food-effects-v2 — the encourage card (Phase γ)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderInfoNutIntro === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && Array.isArray((window as any)._CARD_PRIORITY_TIERS), null, { timeout: 10_000 });
    // Activate the Info tab so the panel paints, then render — the card is
    // persistent and age-independent, sourcing only FOOD_EFFECTS constants
    // (no feeding data required).
    await page.evaluate(() => {
      if (typeof (window as any).switchTab === 'function') (window as any).switchTab('info');
      if (typeof (window as any).renderInfo === 'function') (window as any).renderInfo();
    });
    await page.waitForTimeout(150);
  });

  test('renders benefit-first, with an affirming (non-warn) icon', async ({ page }) => {
    const host = page.locator('#infoNutIntro');
    await expect(host.locator('.enc-benefit')).toBeVisible();
    // The benefit banner leads the affirming sprout icon — never the warn glyph.
    await expect(host.locator('.enc-benefit-h use[href="#zi-sprout"]')).toHaveCount(1);
    await expect(host.locator('.enc-benefit use[href="#zi-warn"]')).toHaveCount(0);
    // Benefit banner sits ABOVE the severe strip in DOM/reading order.
    const order = await page.evaluate(() => {
      const h = document.getElementById('infoNutIntro')!;
      const benefit = h.querySelector('.enc-benefit');
      const severe = h.querySelector('.cons-severe');
      if (!benefit || !severe) return 'missing';
      // DOCUMENT_POSITION_FOLLOWING (4) → severe comes after benefit.
      return (benefit.compareDocumentPosition(severe) & 4) ? 'benefit-first' : 'severe-first';
    });
    expect(order).toBe('benefit-first');
  });

  test('the severe-reaction strip is unconditional and non-collapsible (A-1/V-1)', async ({ page }) => {
    const strip = page.locator('#infoNutIntro .cons-severe');
    await expect(strip).toBeVisible();
    // All three anaphylaxis red flags present.
    await expect(strip.locator('.cons-severe-list li')).toHaveCount(3);
    // The card DOES collapse (uniform with every info card), but the strip lives
    // in the always-visible summary slot — NEVER inside the collapse body. So
    // even while the body is collapsed (default) the strip is fully visible.
    await expect(page.locator('#infoNutIntroBody .cons-severe')).toHaveCount(0);
    const bodyCollapsed = await page.evaluate(() => {
      const b = document.getElementById('infoNutIntroBody');
      return b ? getComputedStyle(b).display === 'none' : false;
    });
    expect(bodyCollapsed, 'collapse body starts collapsed').toBe(true);
    await expect(strip).toBeVisible(); // ...and the strip is still visible
    // No <details> accordion, and no hidden ancestor between strip and card.
    expect(await strip.locator('xpath=ancestor::details').count()).toBe(0);
    const hiddenAncestor = await page.evaluate(() => {
      let n: HTMLElement | null = document.querySelector('#infoNutIntro .cons-severe');
      while (n && n.id !== 'infoNutIntroCard') {
        if (getComputedStyle(n).display === 'none') return true;
        n = n.parentElement;
      }
      return false;
    });
    expect(hiddenAncestor).toBe(false);
    // The emergency action (call 112) co-locates with the strip.
    await expect(page.locator('#infoNutIntro .enc-emergency')).toContainText(/112/);
  });

  test('the form-gate invariant renders and is not suppressed (A-2)', async ({ page }) => {
    const note = page.locator('#infoNutIntro .enc-form-note');
    await expect(note).toBeVisible();
    // The load-bearing distinction: form removes CHOKING, not ALLERGY.
    await expect(note).toContainText(/allergy/i);
    // The "never whole" list is present and emphasised.
    await expect(page.locator('#infoNutIntro .enc-form-list.enc-never li').first()).toBeVisible();
  });

  test('M-γ-1: tree-nut attribution guidance is not dropped by the combined card', async ({ page }) => {
    // A combined peanut+tree-nut card must still surface tree nut's distinct
    // "introduce each nut on its own, a few days apart" guidance — otherwise a
    // parent could offer a mixed almond/walnut/cashew paste at once and lose
    // the ability to attribute a reaction. Sourced per-food from the records.
    const proto = page.locator('#infoNutIntro .enc-proto');
    await expect(proto).toContainText(/each nut on its own|few days apart/i);
    // Both foods' keep-offering lines are labelled (no single peanut-only rhythm).
    await expect(proto.locator('.enc-proto-row', { hasText: /Keep offering — Tree nuts/ })).toHaveCount(1);
  });

  test('benefit content is record-sourced (LEAP); honey gets no benefit banner here', async ({ page }) => {
    // The cited evidence reaches the surface.
    await expect(page.locator('#infoNutIntro .enc-evidence')).toContainText(/LEAP/);
    // This is an encourage-only surface: the acute-toxin honey card is not folded
    // in, so its title never appears with a sage benefit banner (V-3 polarity).
    const honeyTitle = await page.evaluate(() => (window as any).getFoodEffect('honey')?.title);
    await expect(page.locator('#infoNutIntro')).not.toContainText(honeyTitle);
  });

  test('the "delay" myth and the high-risk cohort note both reach the parent', async ({ page }) => {
    await expect(page.locator('#infoNutIntro .enc-myth')).toBeVisible();
    await expect(page.locator('#infoNutIntro .enc-myth')).toContainText(/delay/i);
    // High-risk note (eczema / known egg allergy → ask paediatrician) is present.
    await expect(page.locator('#infoNutIntro .enc-highrisk')).toContainText(/eczema/i);
  });
});
