/* ─────────────────────────────────────────────────────────────────────────
 * FOOD-EFFECTS MANIFEST — the single data spine for the Care food-effects layer.
 *
 * One lightweight summary record per researched food. This file is the source
 * of truth that feeds BOTH:
 *   (1) the research hub (docs/research/index.html — the unified dashboard), and
 *   (2) eventually the in-app surfacing layer (data.js FOOD_EFFECTS), so the
 *       research docs and the product never diverge.
 *
 * Each food also has a deep brief: <food>-infant-safety.{md, html, visual.html}.
 * Append one record here whenever a new food brief is completed.
 *
 * foodClass:     acute-toxin | allergen-introduce-early | choking-by-form |
 *                drink-timing | substitute-caveat   (string OR array — multi-class;
 *                v2 taxonomy, food-effects-v2 spec §2; renamed from `tier`)
 * severity:      critical | caution   (render chrome only; decoupled from foodClass per A-4)
 * reactionType:  acute-toxin | allergy | choking | digestive | dental | renal  (array)
 * confidence:    high | moderate | weak   (strength of the evidence base)
 * Numbers/text mirror the verified brief; keep this in sync with the brief.
 * ───────────────────────────────────────────────────────────────────────── */
window.FOOD_EFFECTS_MANIFEST = [
  {
    food:          'honey',
    aliases:       [],
    foodClass:     'acute-toxin',           // v2 taxonomy (was tier:'critical') — see food-effects-v2 spec §2
    severity:      'critical',              // render chrome; decoupled from foodClass (A-4)
    category:      'sweetener',
    effect:        'infant botulism',
    minMonth:      12,
    thresholdBasis:'conservative',          // gut defenses develop ~6mo+ (WHO); 12mo = universal floor
    allergen:      false,
    reactionType:  ['acute-toxin'],
    headline:      'Avoid before 12 months — honey can cause infant botulism.',
    myth:          { claim:'Cooking or baking makes honey safe.',
                     truth:'No — spores survive baking; honey in biscuits/cooked dishes is still unsafe.' },
    watchFor:      ['constipation (often first)','weak/altered cry','poor feeding','floppiness','drooping eyelids'],
    timeCourse:    'within days to a few weeks (commonly 3–30 days)',
    seekCare:      'Medical emergency. Treatable (BabyBIG); recovery usually full with prompt care.',
    breastfeedingSafe: true,
    culturalNote:  'Indian prelacteal practices (janam ghutti, honey on lips/finger) are a real vector.',
    confidence:    'high',
    sources:       ['WHO','US CDC','AAP','UK NHS','India MoHFW/NHM','StatPearls','NEJM'],
    dashboard:     'honey-infant-safety.visual.html',
    brief:         'honey-infant-safety.md',
    longform:      'honey-infant-safety.html',
    lastReviewed:  '2026-05-30',
  },

  // ── append the next food here (whole nuts / egg / cow's milk / salt …) ──
];

/* Node/CommonJS convenience (so the hub OR a build step can require it). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FOOD_EFFECTS_MANIFEST;
}
