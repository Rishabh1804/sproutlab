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

  // ── food-effects-v2: peanut + tree nut (guided introduction) ──
  // Two records, one shared brief/dashboard (spec §7). foodClass is multi-valued:
  // allergen-introduce-early (encourage) AND choking-by-form (whole = choking).
  // severity 'caution' (amber), NOT 'critical' (rose = acute-toxin honey).
  {
    food:          'peanut',
    aliases:       ['peanuts','groundnut','groundnuts','moongphali','mungfali','peanut butter'],
    foodClass:     ['allergen-introduce-early','choking-by-form'],
    severity:      'caution',
    category:      'legume-nut',           // peanut is a legume, NOT a tree nut
    effect:        'food allergy + choking-by-form',
    minMonth:      6,                      // soft floor (introduce ~6mo); 4 for high-risk under clinician guidance
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy','choking'],
    headline:      'Introduce early (~6 months), in safe form — early peanut lowers allergy risk.',
    whyGood:       'High-value plant protein + healthy fats; early, sustained peanut markedly lowers peanut-allergy risk (LEAP ~81%).',
    earlyIntroBenefit: { claim:'Early + regular peanut helps prevent peanut allergy.',
                         evidence:'LEAP (NEJM 2015): 13.7%→1.9% (low-risk strat), 35.3%→10.6% (sensitised); ~81% overall.',
                         paradigm:'Reverses old "delay to prevent" advice.' },
    safeForm:      { ok:['smooth peanut butter thinned','finely ground peanut / peanut flour'],
                     never:['whole peanuts','chopped peanuts','thick glob of nut butter'],
                     chokingUntilYears:5,
                     note:'Grinding removes the CHOKING risk only — not the allergy risk.' },
    myth:          { claim:'Delay nuts to prevent allergy.',
                     truth:'Reversed — early, sustained introduction (~6mo) helps prevent allergy; delaying may increase risk.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy'],
    timeCourse:    'minutes to ~2 hours after eating; anaphylaxis often within 5–30 min',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Any breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112, use prescribed adrenaline auto-injector.',
    breastfeedingSafe: true,
    culturalNote:  'Groundnut is an Indian vegetarian staple. Smooth thinned peanut butter or finely ground groundnut stirred into food is the safe form.',
    confidence:    'high',
    sources:       ['NEJM LEAP 2015','NEJM EAT 2016','NIAID 2017','AAP','UK NHS','ASCIA 2026','IAP','WHO'],
    dashboard:     'peanut-tree-nut-infant-safety.visual.html',
    brief:         'peanut-tree-nut-infant-safety.md',
    longform:      'peanut-tree-nut-infant-safety.html',
    lastReviewed:  '2026-05-30',
  },
  {
    food:          'tree nut',
    aliases:       ['tree nuts','almond','almonds','badam','walnut','walnuts','akhrot','cashew','cashews','kaju','pistachio','pista','hazelnut','pecan','almond butter','almond paste'],
    foodClass:     ['allergen-introduce-early','choking-by-form'],
    severity:      'caution',
    category:      'tree-nut',
    effect:        'food allergy + choking-by-form',
    minMonth:      6,
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy','choking'],
    headline:      'Introduce early (~6 months), ground or smooth — never whole.',
    whyGood:       'Protein, healthy fats, vitamin E (almond), plant omega-3 (walnut) — high value in a vegetarian diet.',
    earlyIntroBenefit: { claim:'Early, sustained tree-nut introduction supports tolerance.',
                         evidence:'Same early-introduction paradigm as peanut (LEAP/EAT, AAP/NHS/ASCIA); direct tree-nut RCT evidence is thinner than peanut.',
                         paradigm:'Reverses old "delay to prevent" advice.' },
    safeForm:      { ok:['finely ground nuts / nut powder','smooth nut butter/paste thinned','soaked-peeled-ground almond (badam) paste'],
                     never:['whole nuts','chopped nuts','thick glob of nut butter'],
                     chokingUntilYears:5,
                     note:'Grinding removes the CHOKING risk only — not the allergy risk.' },
    myth:          { claim:'A nut allergy means avoid ALL nuts.',
                     truth:'Nuanced — a positive test isn\'t the same as a clinical allergy; many tolerate other nuts. Which to avoid is an allergist\'s call.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy'],
    timeCourse:    'minutes to ~2 hours; anaphylaxis often within 5–30 min',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Any breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112, use prescribed adrenaline auto-injector.',
    breastfeedingSafe: true,
    culturalNote:  'Badam (almond), akhrot (walnut), kaju (cashew) are Indian vegetarian staples. Soaked-peeled-ground almond paste is already a near-ideal infant-safe form.',
    confidence:    'high',
    sources:       ['NEJM EAT 2016','NIAID 2017 (peanut, extrapolated)','AAP','UK NHS','ASCIA 2026','IAP','WHO'],
    dashboard:     'peanut-tree-nut-infant-safety.visual.html',
    brief:         'peanut-tree-nut-infant-safety.md',
    longform:      'peanut-tree-nut-infant-safety.html',
    lastReviewed:  '2026-05-30',
  },

  // ── append the next food here (egg / cow's milk / sesame / salt …) ──
];

/* Node/CommonJS convenience (so the hub OR a build step can require it). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FOOD_EFFECTS_MANIFEST;
}
