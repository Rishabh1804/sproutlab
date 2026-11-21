import { test, expect, type Page } from '@playwright/test';
import { pinAgeMonths } from './fixtures/clock';

// food-effects-v2 — the nut-introduction guidance, on the Library food pop-up.
//
// History: this guidance first shipped as one heavy knowledge card (renderDietNutIntro →
// #dietNutIntro) with its emergency floor PINNED. Library redesign #5b (#216) retired that
// card from the Guides wing, and the 6-second card (S11, Architect-ratified; design record
// docs/design/library-redesign/11-food-card-6sec-template.html) moved each
// food's guidance onto its own pop-up (libOpenBook → #libPopOv): a verdict band leads, then
// disclosure rows the parent opens; the floor is a row on the card plus a one-tap deep-link
// into the always-reachable Emergency Deck. These guards follow the guidance to that surface.
//
// Guards: (1) benefit-first + an affirming icon (V-3); (2) the severe floor is on the card
// and one tap from full first aid (A-1/V-1, as re-ratified in S11); (3) the never-whole /
// choking form-gate is on the card (A-2); (4) honey is never shelved as "introduce early"
// (V-3 polarity); (5) the card is a 6-second card: the verdict is always shown, rows fold.
//
// Retired with the old card and NOT carried to any live surface (logged in docs/BUGS.md,
// "Guidance dropped when the Library knowledge cards were retired"): the how-to-introduce
// protocol with tree nut's "each nut on its own, a few days apart" (M-γ-1), the LEAP evidence
// line, the "delay" myth, and the high-risk (eczema / egg allergy) note. Their guards went
// with the card; restoring the content is an Architect decision, not a test fix.

// Open a Library book's food pop-up the way a tap on the shelf does (libOpenBook reads the
// key from the tapped button) and return its front face. Asserted pop-up-relative — not
// through the tab chrome, which races the app's deferred switchTab(savedTab) on init.
async function openBook(page: Page, key: string) {
  await page.evaluate((k) => {
    const b = document.createElement('button');
    b.setAttribute('data-arg', k);
    (window as any).libOpenBook(b);
  }, key);
  return page.locator('#libPopOv .fp-front');
}

test.describe('food-effects-v2 — the nut-introduction guidance (Library food pop-up)', () => {
  test.beforeEach(async ({ page }) => {
    // A 9-month-old: inside the introduction window these cards are written for. Pinned so the
    // spec does not expire as the fixture child grows (cow's milk and honey re-frame at 12 and 24 mo).
    await pinAgeMonths(page, 9);
    await page.goto('/index.html?nosync');
    await page.waitForFunction(() =>
      typeof (window as any).renderDietLibrary === 'function'
      && typeof (window as any).libOpenBook === 'function'
      && typeof (window as any).getFoodEffect === 'function'
      && !!document.getElementById('libPopOv'), null, { timeout: 10_000 });
    // Open the Library via its real lazy-render hook (what switchDietSub calls).
    await page.evaluate(() => (window as any).renderDietLibrary());
  });

  for (const key of ['peanut', 'tree nut']) {
    test(`${key}: the pop-up leads benefit-first, with an affirming (non-warn) icon`, async ({ page }) => {
      const front = await openBook(page, key);
      // The verdict band is the sage "yes" and says the benefit, not a caution.
      const verdict = front.locator('.fp-verdict');
      await expect(verdict).toHaveCount(1);
      await expect(verdict).toHaveClass(/\bfp-verdict--yes\b/);
      await expect(verdict).toContainText(/good to introduce early/i);
      // It carries the affirming tick — never the warn glyph or the siren.
      await expect(verdict.locator('use[href="#zi-check"]')).toHaveCount(1);
      await expect(verdict.locator('use[href="#zi-warn"], use[href="#zi-siren"]')).toHaveCount(0);
      // The benefit reads ABOVE the reaction floor in DOM/reading order.
      const order = await front.evaluate((f) => {
        const v = f.querySelector('.fp-verdict');
        const floor = f.querySelector('.lib-prow--floor');
        if (!v || !floor) return 'missing';
        return (v.compareDocumentPosition(floor) & 4) ? 'benefit-first' : 'floor-first';
      });
      expect(order).toBe('benefit-first');
    });
  }

  test('the severe-reaction floor is on the card and one tap from full first aid (A-1/V-1, S11)', async ({ page }) => {
    const front = await openBook(page, 'peanut');
    // Exactly one floor row, in the anaphylaxis (rose) chrome — not the amber caution variant.
    const floor = front.locator('.lib-prow--floor');
    await expect(floor).toHaveCount(1);
    await expect(floor).not.toHaveClass(/\blib-prow--caution\b/);
    // All three anaphylaxis red flags, and the emergency action (call 112) with them.
    await expect(floor.locator('.lib-prow-signs li')).toHaveCount(3);
    await expect(floor.locator('.lib-prow-act')).toContainText(/112/);
    // The row deep-links to the anaphylaxis card of the Emergency Deck, carrying the food.
    const link = floor.locator('.lib-prow-deck[data-action="libPopToDeck"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('data-arg', 'anaphylaxis');
    await page.evaluate(() => (window as any).libPopToDeck(document.querySelector('#libPopOv .lib-prow-deck')));
    // Child combinators keep each assertion on this card's own front face.
    const card = page.locator('#libDeckOv #ec-anaphylaxis');
    await expect(card).toHaveCount(1);
    await expect(card.locator('> .fp-flip > .fp-front .ec-name')).toContainText(/peanut/i);
    await expect(card.locator('> .fp-flip > .fp-front .ec-call')).toContainText(/112/);
    // And the Deck stands on its own: opened with no food, the same floor is there.
    await page.evaluate(() => { (window as any)._libCloseDeck(); (window as any).libOpenDeck(); });
    await expect(page.locator('#libDeckOv #ec-anaphylaxis > .fp-flip > .fp-front .ec-signs li')).toHaveCount(3);
  });

  for (const key of ['peanut', 'tree nut']) {
    test(`${key}: the form-gate invariant is on the card and not suppressed (A-2)`, async ({ page }) => {
      const forms = (await openBook(page, key)).locator('.lib-prow--forms');
      await expect(forms).toHaveCount(1);
      // The load-bearing distinction: form removes CHOKING, not ALLERGY.
      await expect(forms.locator('.lib-prow-p')).toContainText(/does not remove the allergy risk/i);
      // The "never whole" list is present.
      await expect(forms.locator('.fp-chip--never').first()).toContainText(/whole/i);
    });
  }


  test('honey is never shelved as "introduce early" (V-3 polarity)', async ({ page }) => {
    // The acute-toxin honey record sits on the warn shelf under 12 months — never with the
    // sage encourage books, whatever else changes about the shelves.
    await expect(page.locator('#dietShelvesRoot .lib-group--encourage .lib-book')).not.toHaveCount(0);
    await expect(page.locator('#dietShelvesRoot .lib-group--encourage .lib-book[data-arg="honey"]')).toHaveCount(0);
    await expect(page.locator('#dietShelvesRoot .lib-group--warn .lib-book[data-arg="honey"]')).toHaveCount(1);
  });


  test('the pop-up is a 6-second card: the verdict is always shown, the detail rows fold', async ({ page }) => {
    const front = await openBook(page, 'peanut');
    const r = await front.evaluate((f) => {
      const rows = Array.from(f.querySelectorAll('.lib-prow'));
      const verdict = f.querySelector('.fp-verdict')!;
      const openByDefault = rows.filter((x) => x.classList.contains('open')).length;
      const head = f.querySelector('.lib-prow--forms .lib-prow-head') as HTMLElement;
      (window as any).libPopRow(head);
      return {
        rowKinds: rows.map((x) => (x.className.match(/lib-prow--(why|forms|floor|nutri)/) || [])[1]),
        openByDefault,
        verdictInsideARow: !!verdict.closest('.lib-prow'),
        formsOpensOnTap: head.closest('.lib-prow')!.classList.contains('open'),
      };
    });
    // The four rows, in reading order: why → safe forms → the floor → nutrition.
    expect(r.rowKinds).toEqual(['why', 'forms', 'floor', 'nutri']);
    expect(r.openByDefault, 'every row starts folded').toBe(0);
    expect(r.verdictInsideARow, 'the verdict band is never folded into a row').toBe(false);
    expect(r.formsOpensOnTap, 'a row opens on tap').toBe(true);
  });
});
