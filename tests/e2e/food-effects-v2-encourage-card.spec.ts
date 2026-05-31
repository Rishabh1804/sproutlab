import { test, expect } from '@playwright/test';

// food-effects-v2 — the guided-introduction KNOWLEDGE card (renderDietNutIntro
// → #dietNutIntro), living in Diet → Library (the knowledge base), NOT the Info
// analytics tab. It surfaces the peanut + tree-nut benefit / safe-form / watch-for
// guidance from FOOD_EFFECTS so a parent can consume it as reference.
//
// The card is rendered via the real Library lazy hook (renderDietLibrary →
// renderDietNutIntro), and asserted CARD-RELATIVE (counts / DOM position / the
// collapse body's display) — not through the active-tab chrome, which races the
// app's deferred switchTab(savedTab) on init (the food-library-f3 spec sidesteps
// the same way). What we test is the card's internal contract, not which tab is
// currently shown.
//
// Guards: (1) benefit-first + affirming icon (V-3); (2) the severe floor is PINNED
// outside the collapse body, never folds (A-1/V-1); (3) the never-whole/choking
// form-gate is pinned (A-2); (4) record-sourced (LEAP), honey gets no banner;
// (5) the myth + high-risk note reach the body; (6) the bulk collapses, floor pinned.

// Is `sel` shown within the card — i.e. no display:none ancestor between it and
// #dietNutIntroCard? (Stops at the card, so the hidden inactive-tab panel above
// the card doesn't count — we're testing the card's own structure.)
const SHOWN_IN_CARD = (sel: string) => {
  let n: HTMLElement | null = document.querySelector(sel);
  if (!n) return false;
  while (n && n.id !== 'dietNutIntroCard') {
    if (getComputedStyle(n).display === 'none') return false;
    n = n.parentElement;
  }
  return !!n; // reached the card without hitting display:none
};

test.describe('food-effects-v2 — the nut-introduction knowledge card (Library)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && !!document.getElementById('dietNutIntro'), null, { timeout: 10_000 });
    // Open the Library via its real lazy-render hook (what switchDietSub calls).
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  test('renders benefit-first, with an affirming (non-warn) icon', async ({ page }) => {
    const host = page.locator('#dietNutIntro');
    await expect(host.locator('.enc-benefit')).toHaveCount(1);
    // The benefit banner leads the affirming sprout icon — never the warn glyph.
    await expect(host.locator('.enc-benefit-h use[href="#zi-sprout"]')).toHaveCount(1);
    await expect(host.locator('.enc-benefit use[href="#zi-warn"]')).toHaveCount(0);
    // Benefit banner sits ABOVE the severe strip in DOM/reading order, and both
    // are in the pinned host (not the collapse body).
    const order = await page.evaluate(() => {
      const h = document.getElementById('dietNutIntro')!;
      const benefit = h.querySelector('.enc-benefit');
      const severe = h.querySelector('.cons-severe');
      if (!benefit || !severe) return 'missing';
      return (benefit.compareDocumentPosition(severe) & 4) ? 'benefit-first' : 'severe-first';
    });
    expect(order).toBe('benefit-first');
  });

  test('the severe-reaction strip is pinned and never folds (A-1/V-1)', async ({ page }) => {
    // The strip lives in the pinned host, never the collapse body.
    await expect(page.locator('#dietNutIntro .cons-severe')).toHaveCount(1);
    await expect(page.locator('#dietNutIntroBody .cons-severe')).toHaveCount(0);
    // All three anaphylaxis red flags present.
    await expect(page.locator('#dietNutIntro .cons-severe-list li')).toHaveCount(3);
    // The collapse body starts collapsed, yet the strip is shown within the card
    // (no display:none ancestor up to the card) and has no <details> accordion.
    const r = await page.evaluate((shownSrc) => {
      const SHOWN = new Function('sel', 'return (' + shownSrc + ')(sel)') as (s: string) => boolean;
      const body = document.getElementById('dietNutIntroBody');
      return {
        bodyCollapsed: body ? getComputedStyle(body).display === 'none' : false,
        stripShown: SHOWN('#dietNutIntro .cons-severe'),
        detailsAncestors: document.querySelectorAll('#dietNutIntro .cons-severe').length
          && !!document.querySelector('#dietNutIntro .cons-severe')!.closest('details'),
      };
    }, SHOWN_IN_CARD.toString());
    expect(r.bodyCollapsed, 'collapse body starts collapsed').toBe(true);
    expect(r.stripShown, 'severe strip shown within the card while collapsed').toBe(true);
    expect(r.detailsAncestors, 'severe strip not inside a <details>').toBe(false);
    // The emergency action (call 112) co-locates with the strip.
    await expect(page.locator('#dietNutIntro .enc-emergency')).toContainText(/112/);
  });

  test('the form-gate invariant is pinned and not suppressed (A-2)', async ({ page }) => {
    const note = page.locator('#dietNutIntro .enc-form-note');
    await expect(note).toHaveCount(1);
    // The load-bearing distinction: form removes CHOKING, not ALLERGY.
    await expect(note).toContainText(/allergy/i);
    // The "never whole" list is present.
    await expect(page.locator('#dietNutIntro .enc-form-list.enc-never li').first()).toHaveCount(1);
    // Pinned (not in the collapse body) and shown within the card.
    await expect(page.locator('#dietNutIntroBody .enc-form-note')).toHaveCount(0);
    const shown = await page.evaluate((src) =>
      (new Function('sel', 'return (' + src + ')(sel)') as any)('#dietNutIntro .enc-form-note'),
      SHOWN_IN_CARD.toString());
    expect(shown).toBe(true);
  });

  test('M-γ-1: tree-nut attribution guidance is not dropped by the combined card', async ({ page }) => {
    // A combined peanut+tree-nut card must still surface tree nut's distinct
    // "introduce each nut on its own, a few days apart" guidance — otherwise a
    // parent could offer a mixed almond/walnut/cashew paste at once and lose
    // the ability to attribute a reaction. Sourced per-food from the records.
    const proto = page.locator('#dietNutIntroCard .enc-proto');
    await expect(proto).toContainText(/each nut on its own|few days apart/i);
    // Both foods' keep-offering lines are labelled (no single peanut-only rhythm).
    await expect(proto.locator('.enc-proto-row', { hasText: /Keep offering — Tree nuts/ })).toHaveCount(1);
  });

  test('benefit content is record-sourced (LEAP); honey gets no benefit banner here', async ({ page }) => {
    // The cited evidence reaches the surface.
    await expect(page.locator('#dietNutIntro .enc-evidence')).toContainText(/LEAP/);
    // This is an encourage-only card: the acute-toxin honey record is not folded
    // in, so its title never appears with a sage benefit banner (V-3 polarity).
    const honeyTitle = await page.evaluate(() => (window as any).getFoodEffect('honey')?.title);
    await expect(page.locator('#dietNutIntroCard')).not.toContainText(honeyTitle);
  });

  test('the "delay" myth and the high-risk cohort note both reach the parent (in the body)', async ({ page }) => {
    // Both are calm-secondary detail, so they live in the collapse body.
    await expect(page.locator('#dietNutIntroBody .enc-myth')).toContainText(/delay/i);
    await expect(page.locator('#dietNutIntroBody .enc-highrisk')).toContainText(/eczema/i);
  });

  test('the card collapses meaningfully: the how-to bulk is in the body, the floor is pinned', async ({ page }) => {
    // The card must collapse to a compact form, not sit permanently expanded.
    const r = await page.evaluate(() => {
      const body = document.getElementById('dietNutIntroBody')!;
      const pinned = document.getElementById('dietNutIntro')!;
      return {
        bodyCollapsedByDefault: getComputedStyle(body).display === 'none',
        // the bulk (how-to protocol) is in the collapse body…
        protoInBody: body.querySelectorAll('.enc-proto').length,
        protoInPinned: pinned.querySelectorAll('.enc-proto').length,
        // …while the essentials are pinned (and not in the body).
        benefitPinned: pinned.querySelectorAll('.enc-benefit').length,
        formNotePinned: pinned.querySelectorAll('.enc-form-note').length,
        severePinned: pinned.querySelectorAll('.cons-severe').length,
        benefitInBody: body.querySelectorAll('.enc-benefit').length,
        severeInBody: body.querySelectorAll('.cons-severe').length,
      };
    });
    expect(r.bodyCollapsedByDefault, 'collapse body hidden by default').toBe(true);
    expect(r.protoInBody, 'how-to protocol is the collapsible bulk').toBe(1);
    expect(r.protoInPinned).toBe(0);
    expect(r.benefitPinned).toBe(1);
    expect(r.formNotePinned).toBe(1);
    expect(r.severePinned).toBe(1);
    expect(r.benefitInBody + r.severeInBody, 'essentials never in the collapse body').toBe(0);
  });
});
