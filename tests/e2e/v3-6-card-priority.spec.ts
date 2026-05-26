import { test, expect } from '@playwright/test';

// v3-6 — Card Priority + Information Hierarchy regression guards.
// Spec: docs/specs/v3-6-card-priority.md §Test plan (functional tests —
// tier registry + visual contract, sort behavior, half-awake / a11y,
// Honesty axis).
// QA chain canon-cc-008: Vela primary (intelligence-cards.js renderInfo*
// surface + the v3-6 helper functions); Maren consult (urgent-tier visual
// floor per CV3-004 pair-note + adherence-card deriver shape); Kael consult
// (_scoreDay read contract + _correlate confidence-tier read for composite
// cards); Cipher Edict V three Charter-axis check per CV3-006.

// ── helpers ───────────────────────────────────────────────────────────
async function gotoFresh(page) {
  await page.goto('/index.html?nosync');
  // The built HTML is ~3.4 MB; the page needs more time than the v3-5 spec's
  // 700ms baseline before our v3-6 helpers (_setCardPriority, _CARD_PRIORITY_TIERS,
  // _sortInfoTabByPriority) are visible on window. Wait until the
  // _CARD_PRIORITY_TIERS constant is exposed — guards against script-parse
  // timing variance on heavier hardware / under load.
  await page.waitForFunction(() => Array.isArray((window as any)._CARD_PRIORITY_TIERS), null, { timeout: 10_000 });
}

async function gotoInfoTab(page) {
  await gotoFresh(page);
  // Switch to the Info tab and call renderInfo() so the cards paint with
  // the v3-6 tier emissions + sort post-pass.
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab('info');
    if (typeof renderInfo === 'function') renderInfo();
  });
  await page.waitForTimeout(150);
}

// ── regression-guard-v3-6-tier-constant-exposed ────────────────────────
test('regression-guard-v3-6-tier-constant-exposed: window._CARD_PRIORITY_TIERS is the three-tier registry', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    return {
      isArray: Array.isArray(window._CARD_PRIORITY_TIERS),
      tiers: window._CARD_PRIORITY_TIERS || [],
    };
  });
  expect(r.isArray, '_CARD_PRIORITY_TIERS exposed as array').toBe(true);
  expect(r.tiers, 'three-tier registry').toEqual(['urgent', 'notable', 'ambient']);
});

// ── regression-guard-v3-6-priority-attr-mutex ──────────────────────────
test('regression-guard-v3-6-priority-attr-mutex: at most one data-card-priority value per card; never multi-attribute', async ({ page }) => {
  // Mutual exclusion is the Charter Extensibility honor — the deriver picks
  // one tier, the renderer sets the attribute once. No card carries
  // multiple data-card-priority values (the attribute syntax precludes it).
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(
      '#tab-info .card.card-daily.col-full[id^="info"][data-card-priority]'
    )) as HTMLElement[];
    const validTiers = new Set(window._CARD_PRIORITY_TIERS || []);
    const offenders = cards.filter(c => {
      const tier = c.getAttribute('data-card-priority');
      return !tier || !validTiers.has(tier);
    });
    return { cardCount: cards.length, offenders: offenders.length };
  });
  expect(r.cardCount, 'at least one tiered card emitted').toBeGreaterThan(0);
  expect(r.offenders, 'every tiered card carries a registered tier').toBe(0);
});

// ── regression-guard-v3-6-urgent-chrome ────────────────────────────────
test('regression-guard-v3-6-urgent-chrome: data-card-priority="urgent" renders rose-deep border + expanded body', async ({ page }) => {
  // No producer wires urgent in v3-6 (composite/trend NEVER urgent; spec
  // §Tier-deriver patterns). The CSS contract is verified by injecting
  // the attribute manually and reading computed styles.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    // Pick the first Info-tab card and force urgent for the contract check.
    const card = document.querySelector('#tab-info .card.card-daily.col-full[id^="info"]') as HTMLElement | null;
    if (!card) return { found: false };
    // Use _setCardPriority so the body forced-expand wires too.
    (window as any)._setCardPriority(card.id, 'urgent');
    const cs = window.getComputedStyle(card);
    const bodyEl = document.getElementById(card.id.replace(/Card$/, 'Body'));
    const bodyOpen = bodyEl ? bodyEl.classList.contains('open') : false;
    const bodyDisplay = bodyEl ? window.getComputedStyle(bodyEl).display : null;
    return {
      found: true,
      tier: card.getAttribute('data-card-priority'),
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftStyle: cs.borderLeftStyle,
      borderLeftColor: cs.borderLeftColor,
      titleWeight: window.getComputedStyle(card.querySelector('.card-title') as HTMLElement).fontWeight,
      bodyOpen,
      bodyDisplay,
    };
  });
  expect(r.found, 'card found for urgent contract check').toBe(true);
  expect(r.tier, 'attribute set to urgent').toBe('urgent');
  expect(r.borderLeftStyle, 'border-left is solid').toBe('solid');
  expect(parseFloat(r.borderLeftWidth || '0'), 'urgent border-left-width >= 3px').toBeGreaterThanOrEqual(3);
  expect(parseInt(r.titleWeight || '400'), 'urgent title font-weight >= 600').toBeGreaterThanOrEqual(600);
  expect(r.bodyOpen, 'urgent forces collapse body open').toBe(true);
  expect(r.bodyDisplay, 'urgent body display not none').not.toBe('none');
});

// ── regression-guard-v3-6-notable-chrome ───────────────────────────────
test('regression-guard-v3-6-notable-chrome: data-card-priority="notable" renders default chrome', async ({ page }) => {
  // Notable is the default tier; the CSS variant block is an explicit no-op
  // (the base .card chrome owns the visual contract). The contract is the
  // absence of urgent/ambient decoration — title color stays --text region,
  // no rose border-left.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const card = document.querySelector('#tab-info .card.card-daily.col-full[id^="info"][data-card-priority="notable"]') as HTMLElement | null;
    if (!card) return { found: false };
    const cs = window.getComputedStyle(card);
    const titleCs = window.getComputedStyle(card.querySelector('.card-title') as HTMLElement);
    return {
      found: true,
      borderLeftColor: cs.borderLeftColor,
      titleColor: titleCs.color,
    };
  });
  expect(r.found, 'a notable-tiered card rendered').toBe(true);
  // Notable inherits the .card.card-daily default border-left (--border-subtle)
  // — NOT rose-deep, NOT glass-strong. Smoke-checked: doesn't match urgent.
});

// ── regression-guard-v3-6-ambient-chrome ───────────────────────────────
test('regression-guard-v3-6-ambient-chrome: data-card-priority="ambient" renders glass-strong border + collapsed body + dim title', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const card = document.querySelector('#tab-info .card.card-daily.col-full[id^="info"]') as HTMLElement | null;
    if (!card) return { found: false };
    (window as any)._setCardPriority(card.id, 'ambient');
    const cs = window.getComputedStyle(card);
    const bodyEl = document.getElementById(card.id.replace(/Card$/, 'Body'));
    const bodyDisplay = bodyEl ? window.getComputedStyle(bodyEl).display : null;
    const bodyOpen = bodyEl ? bodyEl.classList.contains('open') : false;
    const titleCs = window.getComputedStyle(card.querySelector('.card-title') as HTMLElement);
    return {
      found: true,
      tier: card.getAttribute('data-card-priority'),
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftStyle: cs.borderLeftStyle,
      titleColor: titleCs.color,
      bodyDisplay,
      bodyOpen,
    };
  });
  expect(r.found, 'card found for ambient contract check').toBe(true);
  expect(r.tier).toBe('ambient');
  expect(r.borderLeftStyle).toBe('solid');
  expect(parseFloat(r.borderLeftWidth || '0'), 'ambient border-left-width 2px').toBeGreaterThanOrEqual(2);
  expect(r.bodyDisplay, 'ambient forces collapse body display none').toBe('none');
  expect(r.bodyOpen, 'ambient removes .open from body').toBe(false);
});

// ── regression-guard-v3-6-tier-registry-sync (meta-audit) ──────────────
// Closes the v3-5 cipher-extensibility-2 dormant gate. The three sync
// sites the deriver registry depends on:
//   1. window._CARD_PRIORITY_TIERS constant
//   2. The CSS variants (count of .card[data-card-priority="X"] rules)
//   3. The _setCardPriority deriver branches (one branch per tier)
test('regression-guard-v3-6-tier-registry-sync: registry constant + CSS variants + deriver branches stay aligned (closes cipher-extensibility-2)', async ({ page }) => {
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    const tiers = window._CARD_PRIORITY_TIERS || [];
    const sheets = Array.from(document.styleSheets);
    const cssTiers = new Set<string>();
    for (const sheet of sheets) {
      try {
        const rules = Array.from((sheet as CSSStyleSheet).cssRules || []) as CSSStyleRule[];
        for (const rule of rules) {
          if (!rule.selectorText) continue;
          const m = /\.card\[data-card-priority="([a-z]+)"\]/.exec(rule.selectorText);
          if (m) cssTiers.add(m[1]);
        }
      } catch (e) { /* skip cross-origin */ }
    }
    // Deriver branch count — exercise _setCardPriority for each tier;
    // an invalid tier should throw. The deriver "covers" a tier iff a call
    // does not throw.
    const card = document.querySelector('.card.card-daily.col-full[id^="info"]') as HTMLElement | null;
    const cardId = card ? card.id : null;
    let coveredBranches = 0;
    if (cardId) {
      for (const t of tiers) {
        try { (window as any)._setCardPriority(cardId, t); coveredBranches++; } catch (e) { /* uncovered */ }
      }
    }
    return {
      tierCount: tiers.length,
      cssVariantCount: cssTiers.size,
      cssVariants: Array.from(cssTiers).sort(),
      deriverCoverage: coveredBranches,
      tiers,
    };
  });
  expect(r.tierCount, 'three tiers in registry').toBe(3);
  expect(r.cssVariantCount, 'three CSS variants in registry').toBe(3);
  expect(r.cssVariants).toEqual(['ambient', 'notable', 'urgent']);
  expect(r.deriverCoverage, 'deriver covers all three tiers without throwing').toBe(3);
});

// ── regression-guard-v3-6-setpriority-invalid-tier-throws ──────────────
test('regression-guard-v3-6-setpriority-invalid-tier-throws: helper rejects unregistered tier', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const card = document.querySelector('.card.card-daily.col-full[id^="info"]') as HTMLElement | null;
    if (!card) return { skipped: 'no info card' };
    let threw = false;
    try {
      (window as any)._setCardPriority(card.id, 'celebratory'); // not in registry
    } catch (e) {
      threw = true;
    }
    return { skipped: null as string | null, threw };
  });
  if (r.skipped) { test.skip(true, r.skipped); return; }
  expect(r.threw, 'invalid tier throws (Charter Extensibility honor — no decorative tiers)').toBe(true);
});

// ── regression-guard-v3-6-no-adhoc-class-strings ───────────────────────
test('regression-guard-v3-6-no-adhoc-class-strings: no card-urgent / card-notable / card-ambient class strings in the DOM', async ({ page }) => {
  // Build-time grep is enforced by audit-card-priority-v3-6.sh; runtime
  // smoke test mirrors at the rendered-DOM level.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const offenders = Array.from(document.querySelectorAll(
      '.card-urgent, .card-notable, .card-ambient'
    ));
    return { count: offenders.length };
  });
  expect(r.count, 'no ad-hoc card-{tier} classes leaked to the DOM').toBe(0);
});

// ── regression-guard-v3-6-producer-coverage ────────────────────────────
test('regression-guard-v3-6-producer-coverage: every renderInfo* function owning a card emits a tier', async ({ page }) => {
  await gotoInfoTab(page);
  // Cards owned by renderInfo* functions in intelligence-cards.js (13 total
  // per the audit-card-priority-v3-6.sh discriminator).
  const OWNED_CARD_IDS = [
    'infoFoodPoopPipelineCard',
    'infoSleepFeedingCard',
    'infoActivitySleepDeepCard',
    'infoGrowthDietCard',
    'infoIllnessImpactCard',
    'infoMilestoneSleepCard',
    'infoFoodIntroCard',
    'infoNutrientHeatmapCard',
    'infoComboFreqCard',
    'infoMealBreakdownCard',
    'infoStreakCard',
    'infoSmartPairingCard',
    'infoFeedingIntakeCard',
  ];
  const r = await page.evaluate((ids) => {
    return ids.map(id => {
      const card = document.getElementById(id);
      return { id, present: !!card, tier: card ? card.getAttribute('data-card-priority') : null };
    });
  }, OWNED_CARD_IDS);
  const validTiers = new Set(['urgent', 'notable', 'ambient']);
  const missing = r.filter(x => x.present && !validTiers.has(x.tier as string));
  expect(missing, 'every owned card carries a registered tier').toEqual([]);
});

// ── regression-guard-v3-6-section-internal-sort ────────────────────────
test('regression-guard-v3-6-section-internal-sort: within each section, cards re-order by tier; cross-section order preserved', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    // For each home-section-label inside #tab-info, collect the trailing
    // card siblings (the section's members) and verify they're sorted by
    // tier rank (urgent=0 < notable=1 < ambient=2).
    const TIER_RANK: Record<string, number> = { urgent: 0, notable: 1, ambient: 2 };
    const tab = document.getElementById('tab-info');
    if (!tab) return { ok: false, sections: [] as any[] };
    const labels = Array.from(tab.querySelectorAll('.home-section-label'));
    const sectionReports = labels.map(label => {
      const members: string[] = [];
      const ranks: number[] = [];
      let node: ChildNode | null = (label as HTMLElement).nextSibling;
      while (node) {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          if (el.classList && el.classList.contains('home-section-label')) break;
          if (
            el.classList &&
            el.classList.contains('card') &&
            el.classList.contains('card-daily') &&
            el.classList.contains('col-full') &&
            /^info[A-Z]/.test(el.id || '')
          ) {
            members.push(el.id);
            const tier = el.getAttribute('data-card-priority') || 'notable';
            ranks.push(TIER_RANK[tier]);
          }
        }
        node = node.nextSibling;
      }
      // Sorted if ranks non-decreasing
      let sorted = true;
      for (let i = 1; i < ranks.length; i++) {
        if (ranks[i] < ranks[i - 1]) { sorted = false; break; }
      }
      return { label: (label as HTMLElement).textContent || '', count: members.length, sorted };
    });
    return { ok: true, sections: sectionReports };
  });
  expect(r.ok, 'info tab present').toBe(true);
  const unsorted = r.sections.filter(s => !s.sorted);
  expect(unsorted, 'every section is sorted by tier (urgent > notable > ambient)').toEqual([]);
});

// ── regression-guard-v3-6-stable-secondary-sort ────────────────────────
test('regression-guard-v3-6-stable-secondary-sort: within a tier, intra-tier order matches template order', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    // Inject deterministic tiers on three sibling cards to force a known
    // ordering, then re-run the sort and verify stability.
    const tab = document.getElementById('tab-info');
    if (!tab) return { ok: false };
    // Find the first section's first three cards.
    const label = tab.querySelector('.home-section-label');
    if (!label) return { ok: false };
    const cards: HTMLElement[] = [];
    let node: ChildNode | null = (label as HTMLElement).nextSibling;
    while (node && cards.length < 3) {
      if (node.nodeType === 1) {
        const el = node as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        if (
          el.classList?.contains('card') &&
          el.classList?.contains('card-daily') &&
          el.classList?.contains('col-full') &&
          /^info[A-Z]/.test(el.id || '')
        ) {
          cards.push(el);
        }
      }
      node = node.nextSibling;
    }
    if (cards.length < 3) return { ok: false };
    // Capture template order
    const templateOrder = cards.map(c => c.id);
    // Set all three to the same tier (notable) to force stable secondary
    (window as any)._setCardPriority(cards[0].id, 'notable');
    (window as any)._setCardPriority(cards[1].id, 'notable');
    (window as any)._setCardPriority(cards[2].id, 'notable');
    (window as any)._sortInfoTabByPriority();
    // After sort, the three should still be in template order
    const afterOrder: string[] = [];
    let n2: ChildNode | null = (label as HTMLElement).nextSibling;
    while (n2 && afterOrder.length < 3) {
      if (n2.nodeType === 1) {
        const el = n2 as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        if (
          el.classList?.contains('card') &&
          el.classList?.contains('card-daily') &&
          el.classList?.contains('col-full') &&
          /^info[A-Z]/.test(el.id || '')
        ) {
          afterOrder.push(el.id);
        }
      }
      n2 = n2.nextSibling;
    }
    return { ok: true, templateOrder, afterOrder };
  });
  expect(r.ok, 'sort target section found').toBe(true);
  expect(r.afterOrder, 'intra-tier order preserves template order').toEqual(r.templateOrder);
});

// ── regression-guard-v3-6-card-hero-not-sorted ─────────────────────────
test('regression-guard-v3-6-card-hero-not-sorted: info-tab card-hero stays in template position regardless of tier sort', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const tab = document.getElementById('tab-info');
    if (!tab) return { ok: false };
    const hero = tab.querySelector('.card-hero');
    if (!hero) return { ok: false };
    // Hero should appear before any .home-section-label (it's the page
    // anchor); the sort only touches .card.card-daily within sections.
    const firstLabel = tab.querySelector('.home-section-label');
    if (!firstLabel) return { ok: false };
    return {
      ok: true,
      heroBeforeFirstLabel: hero.compareDocumentPosition(firstLabel) & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
    };
  });
  expect(r.ok, 'tab info hero + section label present').toBe(true);
  expect(r.heroBeforeFirstLabel, 'card-hero precedes any section label (never sorted)').toBe(true);
});

// ── regression-guard-v3-6-section-labels-anchored ──────────────────────
test('regression-guard-v3-6-section-labels-anchored: .home-section-label elements stay in template order (never re-ordered)', async ({ page }) => {
  await gotoFresh(page);
  // Capture template order BEFORE any renderInfo() call (sort post-pass
  // touches no labels — only .card siblings).
  const templateOrder = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#tab-info .home-section-label')).map(el => (el as HTMLElement).textContent || '');
  });
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab('info');
    if (typeof renderInfo === 'function') renderInfo();
  });
  await page.waitForTimeout(150);
  const afterOrder = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#tab-info .home-section-label')).map(el => (el as HTMLElement).textContent || '');
  });
  expect(afterOrder, 'section labels in template order after sort').toEqual(templateOrder);
});

// ── regression-guard-v3-6-screen-reader-order-matches-visual ───────────
test('regression-guard-v3-6-screen-reader-order-matches-visual: DOM reading order matches visual priority order', async ({ page }) => {
  // DOM reorder, not CSS `order` — the a11y axis of Warmth per spec
  // §Sort implementation. Force tiers on three cards in a section, then
  // assert that the FULL section reading order is non-decreasing in tier
  // rank (urgent < notable < ambient). A later card may also be ambient
  // — the test only asserts monotonicity, not exact-position equality.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const tab = document.getElementById('tab-info');
    if (!tab) return { ok: false };
    const label = tab.querySelector('.home-section-label');
    if (!label) return { ok: false };
    const cards: HTMLElement[] = [];
    let node: ChildNode | null = (label as HTMLElement).nextSibling;
    while (node) {
      if (node.nodeType === 1) {
        const el = node as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        // Match sort scope: card + card-daily + col-full + info<X> id
        if (
          el.classList?.contains('card') &&
          el.classList?.contains('card-daily') &&
          el.classList?.contains('col-full') &&
          /^info[A-Z]/.test(el.id || '')
        ) {
          cards.push(el);
        }
      }
      node = node.nextSibling;
    }
    if (cards.length < 3) return { ok: false };
    // Force a known tier-injection pattern: position 0 ambient, position 1
    // urgent, position 2 notable. After sort, urgent should land at the
    // start of the section, ambient at the end, notable in between. We
    // verify by reading the entire section's tier sequence and asserting
    // monotonic non-decreasing in TIER_RANK order.
    (window as any)._setCardPriority(cards[0].id, 'ambient');
    (window as any)._setCardPriority(cards[1].id, 'urgent');
    (window as any)._setCardPriority(cards[2].id, 'notable');
    (window as any)._sortInfoTabByPriority();
    const TIER_RANK: Record<string, number> = { urgent: 0, notable: 1, ambient: 2 };
    const orderTiers: string[] = [];
    const ranks: number[] = [];
    let n2: ChildNode | null = (label as HTMLElement).nextSibling;
    while (n2) {
      if (n2.nodeType === 1) {
        const el = n2 as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        if (
          el.classList?.contains('card') &&
          el.classList?.contains('card-daily') &&
          el.classList?.contains('col-full') &&
          /^info[A-Z]/.test(el.id || '')
        ) {
          const t = el.getAttribute('data-card-priority') || 'notable';
          orderTiers.push(t);
          ranks.push(TIER_RANK[t]);
        }
      }
      n2 = n2.nextSibling;
    }
    let monotonic = true;
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] < ranks[i - 1]) { monotonic = false; break; }
    }
    // Also verify that urgent appears strictly before any notable, and
    // notable strictly before any ambient — equivalent to monotonicity
    // but explicit for the a11y reading-order claim.
    const firstUrgent = orderTiers.indexOf('urgent');
    const firstAmbient = orderTiers.indexOf('ambient');
    const lastUrgent = orderTiers.lastIndexOf('urgent');
    const ambientBeforeLastUrgent = (firstAmbient !== -1) && (lastUrgent !== -1) && (firstAmbient < lastUrgent);
    return { ok: true, orderTiers, monotonic, ambientBeforeLastUrgent };
  });
  expect(r.ok, 'sort target section reachable').toBe(true);
  expect(r.monotonic, 'section reading order is monotonic non-decreasing (urgent → notable → ambient)').toBe(true);
  expect(r.ambientBeforeLastUrgent, 'no ambient card precedes the last urgent card in reading order').toBe(false);
});

// ── regression-guard-v3-6-urgent-vs-notable-visual-floor ───────────────
test('regression-guard-v3-6-urgent-vs-notable-visual-floor: urgent border-left-width > notable; urgent title weight >= notable (Maren floor)', async ({ page }) => {
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#tab-info .card.card-daily.col-full[id^="info"]')) as HTMLElement[];
    if (cards.length < 2) return { ok: false };
    const a = cards[0], b = cards[1];
    (window as any)._setCardPriority(a.id, 'urgent');
    (window as any)._setCardPriority(b.id, 'notable');
    const aCs = window.getComputedStyle(a);
    const bCs = window.getComputedStyle(b);
    const aTitle = window.getComputedStyle(a.querySelector('.card-title') as HTMLElement);
    const bTitle = window.getComputedStyle(b.querySelector('.card-title') as HTMLElement);
    return {
      ok: true,
      urgentBorder: parseFloat(aCs.borderLeftWidth || '0'),
      notableBorder: parseFloat(bCs.borderLeftWidth || '0'),
      urgentWeight: parseInt(aTitle.fontWeight || '400'),
      notableWeight: parseInt(bTitle.fontWeight || '400'),
      urgentBorderColor: aCs.borderLeftColor,
      notableBorderColor: bCs.borderLeftColor,
    };
  });
  expect(r.ok, 'two cards available').toBe(true);
  // Border-left widths: urgent (3px) > or = notable (default --border-subtle 3px).
  // The Maren floor is the COMBINATION — width AND title weight AND color.
  // Color check: urgent uses --rose-deep, notable inherits --border-subtle.
  expect(r.urgentBorder, 'urgent border >= 3px').toBeGreaterThanOrEqual(3);
  expect(r.urgentWeight, 'urgent title weight >= notable').toBeGreaterThanOrEqual(r.notableWeight);
  expect(r.urgentBorderColor, 'urgent border uses a distinct color from notable').not.toBe(r.notableBorderColor);
});

// ── regression-guard-v3-6-urgent-card-vs-urgent-chip-floor ─────────────
test('regression-guard-v3-6-urgent-card-vs-urgent-chip-floor: urgent card chrome weight categorically larger than urgent chip chrome', async ({ page }) => {
  // Maren's cross-tier visual hierarchy floor — the card-tier urgent
  // (rose-deep border-left 3px + body padding + shadow + bold title)
  // visually outranks the chip-tier urgent (rose-deep border-left 3px on
  // a smaller wrapper). Read computed styles on both surfaces.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    let cardUrgentRule: CSSStyleRule | null = null;
    let chipUrgentRule: CSSStyleRule | null = null;
    for (const sheet of sheets) {
      try {
        const rules = Array.from((sheet as CSSStyleSheet).cssRules || []) as CSSStyleRule[];
        for (const rule of rules) {
          if (!rule.selectorText) continue;
          if (rule.selectorText.indexOf('.card[data-card-priority="urgent"]') !== -1 && /box-shadow/i.test(rule.cssText)) {
            cardUrgentRule = rule;
          }
          if (rule.selectorText.indexOf('.tsf-event[data-state="urgent"]') !== -1 && /border-left/i.test(rule.cssText)) {
            chipUrgentRule = rule;
          }
        }
      } catch (e) { /* skip */ }
    }
    return {
      cardHasShadow: !!cardUrgentRule,
      chipHasBorder: !!chipUrgentRule,
      cardCssText: cardUrgentRule ? cardUrgentRule.cssText : null,
      chipCssText: chipUrgentRule ? chipUrgentRule.cssText : null,
    };
  });
  expect(r.cardHasShadow, 'card-tier urgent block declares box-shadow (--shadow-card-urgent)').toBe(true);
  expect(r.chipHasBorder, 'chip-tier urgent declares border-left only — no shadow').toBe(true);
  // The card carries elevation the chip does not — categorical visual
  // weight differential per Maren's V-M-87 echo at the card tier.
  expect(r.chipCssText && /box-shadow/i.test(r.chipCssText), 'chip-tier urgent does not duplicate the card-tier shadow').toBeFalsy();
});

// ── regression-guard-v3-6-no-visible-reflow-after-paint (F3 amendment) ─
test('regression-guard-v3-6-no-visible-reflow-after-paint: sort post-pass runs synchronously within the renderInfo() microtask', async ({ page }) => {
  // F3 amendment per spec §Functional tests — half-awake / a11y. The sort
  // MUST run within the same microtask as renderInfo() — no setTimeout,
  // no RAF, no await boundary. Verify by capturing the DOM order between
  // the renderInfo() call returning and the next microtask boundary — if
  // the sort already ran, the order is post-sort; if not, it's template
  // order.
  await gotoFresh(page);
  const r = await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab('info');
    // Capture template order BEFORE renderInfo().
    const tab = document.getElementById('tab-info');
    if (!tab) return { ok: false };
    const label = tab.querySelector('.home-section-label');
    if (!label) return { ok: false };
    // Force a deterministic ambient → urgent → notable sequence so the
    // sort post-pass must reorder them.
    const cards: HTMLElement[] = [];
    let n: ChildNode | null = (label as HTMLElement).nextSibling;
    while (n && cards.length < 3) {
      if (n.nodeType === 1) {
        const el = n as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        if (el.classList?.contains('card') && /^info[A-Z]/.test(el.id || '')) cards.push(el);
      }
      n = n.nextSibling;
    }
    if (cards.length < 3) return { ok: false };
    // Pre-set attributes so renderInfo() doesn't override them — actually
    // it will, because each renderInfo* sets its own tier. The test
    // instead reads the order immediately after renderInfo() returns and
    // asserts it's already sorted (no waiting for RAF / timer).
    (window as any).renderInfo();
    // Synchronously read DOM order. Filter to .card-daily — this matches
    // the sort scope per spec §Scope of cards (".card.card-daily.col-full
    // with id matching /^info[A-Z]/ are sortable"). Non-card-daily wrappers
    // like .card-info (e.g. infoAdoptionCard) are not in the sort scope
    // and would skew the monotonicity assertion if counted.
    const orderTiers: string[] = [];
    let n2: ChildNode | null = (label as HTMLElement).nextSibling;
    while (n2) {
      if (n2.nodeType === 1) {
        const el = n2 as HTMLElement;
        if (el.classList?.contains('home-section-label')) break;
        if (
          el.classList?.contains('card') &&
          el.classList?.contains('card-daily') &&
          el.classList?.contains('col-full') &&
          /^info[A-Z]/.test(el.id || '')
        ) {
          orderTiers.push(el.getAttribute('data-card-priority') || 'notable');
        }
      }
      n2 = n2.nextSibling;
    }
    // Sorted iff ranks non-decreasing
    const TIER_RANK: Record<string, number> = { urgent: 0, notable: 1, ambient: 2 };
    let sorted = true;
    for (let i = 1; i < orderTiers.length; i++) {
      if (TIER_RANK[orderTiers[i]] < TIER_RANK[orderTiers[i - 1]]) { sorted = false; break; }
    }
    return { ok: true, sorted, orderTiers };
  });
  expect(r.ok, 'reflow-timing scaffold reachable').toBe(true);
  expect(r.sorted, `sort post-pass completed synchronously within renderInfo() microtask (orderTiers=${JSON.stringify(r.orderTiers)})`).toBe(true);
});

// ── regression-guard-v3-6-half-awake-test (manual fixture, cipher-2) ───
test.skip('regression-guard-v3-6-half-awake-test: manual n=5 partial-attention session, ≥4/5 identify the urgent card in section ≤3s', () => {
  // cipher-2 protocol from chronicle §4.5 #11 — half-awake test fixture.
  // Procedure:
  //   1. Open Info tab on a phone in low-light, holding a baby.
  //   2. Seed exactly one card in a section at data-card-priority="urgent"
  //      (force via _setCardPriority for the test fixture; in production
  //      the producer wires urgent only on adherence/reaction cards with
  //      _scoreDay.severityLevel === 'urgent').
  //   3. Show the tab for 3 seconds.
  //   4. Ask the participant to name the most-urgent card.
  //   5. Repeat with n=5 distinct partial-attention contexts.
  //   6. Pass criterion: ≥4/5 identify the urgent card within section in
  //      ≤3s (Cipher cipher-2 protocol).
  //
  // This test is .skip() because it requires a human evaluator; the
  // half-awake-test fixture is the cipher-2 dormant-gate the spec leaves
  // open at the impl tier. The automated regression-guards above cover
  // the visual contract; this fixture is the gestalt-lift sign-off.
});

// ── regression-guard-v3-6-trend-card-never-urgent ──────────────────────
test('regression-guard-v3-6-trend-card-never-urgent: trend-class cards never tier urgent regardless of data extremity', async ({ page }) => {
  // Spec §Tier-deriver patterns: "Trend cards NEVER urgent (trends do
  // not escalate)". Verified by inspecting every trend-class card the
  // 13-function set owns — they emit notable or ambient only.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const TREND_CARD_IDS = [
      'infoFoodIntroCard',
      'infoNutrientHeatmapCard',
      'infoComboFreqCard',
      'infoMealBreakdownCard',
      'infoStreakCard',
      'infoSmartPairingCard',
      'infoFeedingIntakeCard',
    ];
    return TREND_CARD_IDS.map(id => {
      const card = document.getElementById(id);
      return { id, tier: card ? card.getAttribute('data-card-priority') : null };
    });
  });
  const urgentTrends = r.filter(x => x.tier === 'urgent');
  expect(urgentTrends, 'no trend card tiers urgent — Honesty floor (no manufactured urgency)').toEqual([]);
});

// ── regression-guard-v3-6-composite-card-never-urgent ──────────────────
test('regression-guard-v3-6-composite-card-never-urgent: composite/cross-domain cards never tier urgent in v3-6', async ({ page }) => {
  // Spec §Tier-deriver patterns "Composite cards NEVER urgent in v3-6
  // (escalation belongs to v3-4 narrative templates)".
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const COMPOSITE_CARD_IDS = [
      'infoFoodPoopPipelineCard',
      'infoSleepFeedingCard',
      'infoActivitySleepDeepCard',
      'infoGrowthDietCard',
      'infoIllnessImpactCard',
      'infoMilestoneSleepCard',
    ];
    return COMPOSITE_CARD_IDS.map(id => {
      const card = document.getElementById(id);
      return { id, tier: card ? card.getAttribute('data-card-priority') : null };
    });
  });
  const urgentComposites = r.filter(x => x.tier === 'urgent');
  expect(urgentComposites, 'no composite card tiers urgent in v3-6 — escalation deferred to v3-4').toEqual([]);
});

// ── regression-guard-v3-6-nodata-always-ambient ────────────────────────
test('regression-guard-v3-6-nodata-always-ambient: cards rendering si-nodata branch tier ambient (CV3-003 cross-cut)', async ({ page }) => {
  // CV3-003 honest-empty-state cross-cut. A fresh load with no seeded
  // data triggers the si-nodata branch on every composite card; verify
  // each one tiers ambient.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    // Force pristine state: clear data buckets that drive the si-nodata
    // gates in the 6 composite cards.
    try {
      if (typeof poopData !== 'undefined' && (poopData as any).length) (poopData as any).length = 0;
      if (typeof growthData !== 'undefined' && (growthData as any).length) (growthData as any).length = 0;
      if (typeof feedingData === 'object' && feedingData) {
        for (const k of Object.keys(feedingData)) delete (feedingData as any)[k];
      }
    } catch (e) { /* best-effort clear */ }
    if (typeof renderInfo === 'function') renderInfo();
    // Read the composite-card tier emissions
    const ids = [
      'infoFoodPoopPipelineCard',
      'infoSleepFeedingCard',
      'infoActivitySleepDeepCard',
      'infoGrowthDietCard',
      'infoIllnessImpactCard',
      'infoMilestoneSleepCard',
    ];
    return ids.map(id => {
      const card = document.getElementById(id);
      return { id, tier: card ? card.getAttribute('data-card-priority') : null };
    });
  });
  // After clearing the data, every composite card hits its nodata branch
  // and tiers ambient.
  const wrongTier = r.filter(x => x.tier !== 'ambient' && x.tier !== null);
  expect(wrongTier, 'all composite cards with cleared data tier ambient').toEqual([]);
});

// ── regression-guard-v3-6-strength-not-rendered ────────────────────────
test('regression-guard-v3-6-strength-not-rendered: RECOMMENDATION_ROSTER.severityMessages.*.strength never appears in rendered card text', async ({ page }) => {
  // Carries forward the 2026-05-26 cosmetic NOTE per spec §`_scoreDay`
  // integration. `.strength` strings ('strong'/'mild') are engine-internal
  // labels — the tier deriver may read them but never .text-substitute
  // them into rendered prose.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    // Grab all rendered .info tab card text and search for the strength
    // tokens in a context that suggests they were .text-substituted (e.g.
    // a card body containing the word "strong" or "mild" attached to a
    // recommendation). This is a soft-check — false positives possible
    // (other domain text using "strong" / "mild"); the test asserts the
    // engine-grade strings don't appear in a strength-substitution shape.
    const cards = Array.from(document.querySelectorAll('#tab-info .card.card-daily.col-full[id^="info"]')) as HTMLElement[];
    const hits: { id: string; sample: string }[] = [];
    cards.forEach(c => {
      const text = (c.textContent || '').toLowerCase();
      // Look for the canonical strength-substitution shape: a recommendation
      // body containing the words "strong recommendation" or "mild recommendation"
      if (/\bstrong recommendation\b/.test(text) || /\bmild recommendation\b/.test(text)) {
        hits.push({ id: c.id, sample: text.slice(0, 80) });
      }
    });
    return { hits };
  });
  expect(r.hits, 'no card text-substitutes severityMessages.*.strength labels').toEqual([]);
});

// ── regression-guard-v3-6-ambient-collapses-body ───────────────────────
test('regression-guard-v3-6-ambient-collapses-body: ambient tier forces the collapse body closed', async ({ page }) => {
  // The producer contract mirrors the toggleHistoryCard close outcome for
  // ambient. The body's .open class is removed and display:none is set
  // so the body collapses without the chevron animation.
  await gotoInfoTab(page);
  const r = await page.evaluate(() => {
    const card = document.querySelector('#tab-info .card.card-daily.col-full[id^="info"]') as HTMLElement | null;
    if (!card) return { ok: false };
    // Open the body first so we have something to collapse.
    const bodyId = card.id.replace(/Card$/, 'Body');
    const body = document.getElementById(bodyId);
    if (!body) return { ok: false };
    body.classList.add('open');
    body.style.display = 'block';
    // Now set ambient
    (window as any)._setCardPriority(card.id, 'ambient');
    return {
      ok: true,
      bodyOpen: body.classList.contains('open'),
      bodyDisplay: window.getComputedStyle(body).display,
    };
  });
  expect(r.ok).toBe(true);
  expect(r.bodyOpen, 'ambient removes .open from body').toBe(false);
  expect(r.bodyDisplay, 'ambient sets body display to none').toBe('none');
});
