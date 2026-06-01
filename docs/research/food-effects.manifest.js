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

  // ── food-effects Phase δ: egg, soy, wheat, sesame (the four remaining big-9 allergens) ──
  // TWO-TIER evidence discipline (verified 2026-06-01): EGG is prevention-PROVEN
  // (PETIT RCT + EAT) and may make peanut-style confident claims. SOY / WHEAT /
  // SESAME are introduce-early-and-SAFE but prevention is NOT RCT-proven — EAT
  // (NEJM 2016) found "no significant effects with respect to milk, sesame, fish,
  // or wheat" (soy untested in EAT). Their earlyIntroBenefit is framed honestly:
  // "don't delay, it's safe" — never "early intro prevents this allergy."
  // All four are foodClass:'allergen-introduce-early' (sage/encourage, NOT honey's
  // rose acute-toxin) — the evidence base for the polarity-aware banner (Phase δ).
  // `aliases` are deliberately culinary-rich so wiring into FOOD_EFFECTS closes the
  // Kael B-1 resolution gap (tofu→soy, roti→wheat, til→sesame, anda→egg).
  // minMonth:6 follows AAP/NHS/ASCIA (~6mo, not before 4); NOTE for wiring — the
  // app's AGE_RULES carries egg-yolk:7 / whole-egg:8, to be reconciled with Maren.
  {
    food:          'egg',
    aliases:       ['eggs','anda','egg yolk','whole egg','boiled egg','hard-boiled egg','scrambled egg','omelette','omelet'],
    foodClass:     'allergen-introduce-early',
    severity:      'caution',
    category:      'egg',
    effect:        'food allergy',
    minMonth:      6,                      // AAP/NHS ~6mo (not before 4); reconcile with AGE_RULES egg-yolk:7 at wiring
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy'],
    headline:      'Introduce early (~6 months), well-cooked — early egg lowers allergy risk.',
    whyGood:       'Complete protein, choline, iron, vitamin D — and early, regular well-cooked egg helps prevent egg allergy.',
    earlyIntroBenefit: { claim:'Early, regular well-cooked egg helps prevent egg allergy.',
                         evidence:'PETIT (Lancet 2017): heated egg + eczema care cut egg allergy 38%→8% at 12mo (P=0.0001). EAT (NEJM 2016): per-protocol 5.5%→1.4% (P=0.009).',
                         paradigm:'Reverses old "delay egg to prevent allergy" advice.' },
    safeForm:      { ok:['well-cooked egg — mashed hard-boiled, scrambled, or baked into soft food','start with cooked yolk; offer whole egg once yolk is tolerated'],
                     never:['raw or runny egg','lightly-cooked egg (no British-Lion-mark assurance exists in India)'],
                     note:'Cook until BOTH white and yolk are solid — this is the studied safe form and removes the salmonella risk.' },
    myth:          { claim:'Delay egg to prevent allergy.',
                     truth:'Reversed — early, regular well-cooked egg helps prevent egg allergy; delaying may increase risk.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy'],
    timeCourse:    'minutes to ~2 hours after eating; anaphylaxis often within 5–30 min',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Any breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112, use prescribed adrenaline auto-injector.',
    breastfeedingSafe: true,
    culturalNote:  'No British-Lion-mark assured-egg scheme in India — default to fully-cooked egg (solid white and yolk). Egg allergy is common in infancy but usually outgrown by school age.',
    confidence:    'high',
    sources:       ['Lancet PETIT 2017','NEJM EAT 2016','AAP','UK NHS','ASCIA 2026','NIAID 2017'],
    dashboard:     'egg-infant-safety.visual.html',
    brief:         'egg-infant-safety.md',
    longform:      'egg-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },
  {
    food:          'soy',
    aliases:       ['soya','soybean','soya bean','tofu','edamame','soya chunks','soya granules','soya nuggets','soy milk','soya milk','tempeh','miso','natto','tamari','tvp','textured vegetable protein'],
    foodClass:     'allergen-introduce-early',
    severity:      'caution',
    category:      'legume',
    effect:        'food allergy (incl. FPIES)',
    minMonth:      6,
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy','digestive'],   // digestive = FPIES (non-IgE), a classic soy presentation
    headline:      'Introduce around 6 months — don\'t delay. Soft tofu, not whole edamame.',
    whyGood:       'Valuable plant protein for a vegetarian diet (tofu, soya chunks) — introduce early alongside other solids.',
    earlyIntroBenefit: { claim:'Introduce around 6 months; don\'t delay allergens.',
                         evidence:'AAP/NHS/ASCIA advise early introduction of soy among the major allergens; early intro is SAFE, but no RCT proves early soy prevents soy allergy (soy was not among EAT\'s prevention-positive foods).',
                         paradigm:'Don\'t delay — but no proven soy-specific prevention claim.' },
    safeForm:      { ok:['soft / silken tofu, smushable or blended','well-cooked soybeans mashed','soy yoghurt; soya stirred into food'],
                     never:['whole edamame or whole soybeans (round, firm — a choking risk)','soy milk as a main drink in the first year (not a breastmilk/formula substitute)'],
                     note:'Shell and mash edamame at 6mo; halve cooked beans at 9mo. Soft tofu needs no choking prep.' },
    myth:          { claim:'Soy isn\'t recommended for babies.',
                     truth:'That advice is about soy infant FORMULA for allergy prevention — not soy FOODS like tofu, which are fine to introduce around 6 months.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting or diarrhoea'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy','repeated forceful vomiting + lethargy hours later (possible FPIES)'],
    timeCourse:    'IgE: minutes to ~2 hours. FPIES (non-IgE): delayed — profuse repeated vomiting + lethargy/pallor 1–4 hours after eating.',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112. Repeated forceful vomiting with lethargy/pallor hours after a soy feed (possible FPIES): seek urgent care even without a rash.',
    breastfeedingSafe: true,
    culturalNote:  'Soya chunks/granules are everyday vegetarian protein in India — a concentrated soy-protein form. Some cow\'s-milk-allergic babies also react to soy; introduce as a minor ingredient first.',
    confidence:    'high',
    sources:       ['AAP','UK NHS','ASCIA','NIAID 2017','FARE','CHOP (FPIES)','NEJM EAT 2016'],
    dashboard:     'soy-infant-safety.visual.html',
    brief:         'soy-infant-safety.md',
    longform:      'soy-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },
  {
    food:          'wheat',
    aliases:       ['atta','maida','wheat flour','suji','sooji','rava','semolina','dalia','broken wheat','roti','chapati','phulka','paratha','naan','bread','pasta','sevai','vermicelli','durum','couscous','bulgur','seitan'],
    foodClass:     'allergen-introduce-early',
    severity:      'caution',
    category:      'grain',
    effect:        'food allergy (distinct from celiac disease)',
    minMonth:      6,
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy'],
    headline:      'Introduce around 6 months — don\'t delay. Soft cereal or softened roti.',
    whyGood:       'Staple grain — soft wheat cereal, well-cooked pasta, or softened roti; introduce early alongside other solids.',
    earlyIntroBenefit: { claim:'Introduce around 6 months; don\'t delay.',
                         evidence:'AAP/NHS/ASCIA advise early introduction; EAT (NEJM 2016) verified NO significant prevention effect for wheat — early intro is SAFE but does NOT prevent wheat allergy.',
                         paradigm:'Don\'t delay — but no proven wheat-specific prevention claim.' },
    safeForm:      { ok:['soft wheat / multigrain cereal or porridge','well-cooked soft pasta','roti / chapati torn small and softened in milk, dal, or sabzi','suji / dalia cooked soft'],
                     never:['large or doughy bread pieces (fresh soft bread balls up into a sticky clump — toast it or use firm strips)','loose cooked wheat / dalia that scatters in the mouth (mash or bind it)'],
                     note:'Wheat ALLERGY is separate from celiac disease — see myth.' },
    myth:          { claim:'Wheat allergy and gluten intolerance / celiac disease are the same.',
                     truth:'Different conditions — wheat allergy is an immune (IgE) food allergy with rapid reactions; celiac is a separate autoimmune reaction to gluten needing medical diagnosis, not emergency care. This record is about wheat allergy.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting or diarrhoea','eczema flare'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy'],
    timeCourse:    'minutes to ~2 hours after eating; anaphylaxis often within 5–30 min',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Any breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112, use prescribed adrenaline auto-injector. (Celiac is NOT an emergency — chronic; needs a doctor\'s diagnosis.)',
    breastfeedingSafe: true,
    culturalNote:  'Atta, maida, suji/rava, dalia, sevai are all wheat. Soft cereal and softened roti are ideal early forms. Wheat allergy is commonly outgrown in early childhood.',
    confidence:    'high',
    sources:       ['AAP','UK NHS','ASCIA','NIAID 2017','NEJM EAT 2016','ESPGHAN 2016 (celiac/gluten)'],
    dashboard:     'wheat-infant-safety.visual.html',
    brief:         'wheat-infant-safety.md',
    longform:      'wheat-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },
  {
    food:          'sesame',
    aliases:       ['til','tahini','gingelly','gingelly oil','sesame seeds','sesame oil','sim sim','benne','gomashio','hummus','halva','halwa','gajak','til laddoo'],
    foodClass:     'allergen-introduce-early',
    severity:      'caution',
    category:      'seed',
    effect:        'food allergy (often lifelong)',
    minMonth:      6,
    thresholdBasis:'developmental-readiness',
    allergen:      true,
    reactionType:  ['allergy'],
    headline:      'Introduce around 6 months, as thinned tahini — never a thick glob.',
    whyGood:       'Seed source of calcium, iron and healthy fats; offer as smooth tahini thinned into food.',
    earlyIntroBenefit: { claim:'Introduce around 6 months; don\'t delay.',
                         evidence:'AAP/NHS/ASCIA name sesame among allergens to introduce early; EAT (NEJM 2016) verified NO significant prevention effect for sesame — early intro is SAFE but not proven to prevent sesame allergy. (Sesame is the US 9th major allergen, FASTER Act, labeling since Jan 1 2023 — US-only; does not apply to Indian/home foods.)',
                         paradigm:'Don\'t delay — but no proven sesame-specific prevention claim.' },
    safeForm:      { ok:['smooth tahini (sesame paste) thinned with water, milk, or puree','finely ground sesame stirred into food'],
                     never:['a thick glob of tahini (sticky — a choking risk; thin it, like nut butter)','whole sesame seeds in quantity for a young infant'],
                     note:'Same "thin the sticky glob" rule as peanut butter. Unrefined / cold-pressed gingelly (sesame) oil can still carry allergenic protein.' },
    myth:          { claim:'Sesame allergy is outgrown like egg or milk.',
                     truth:'Usually not — sesame allergy tends to be lifelong (~70–80% persist), so first exposures and ongoing care matter more than for commonly-outgrown allergens.' },
    watchFor:      ['hives / rash','swelling (mouth, eyes, lips)','vomiting'],
    severeSigns:   ['trouble breathing / wheeze','face/lip/tongue swelling','floppy, pale, or very sleepy'],
    timeCourse:    'minutes to ~2 hours after eating; anaphylaxis often within 5–30 min',
    seekCare:      'Mild single-system: stop, monitor, call doctor. Any breathing trouble, face/throat swelling, or floppiness: EMERGENCY — call 112, use prescribed adrenaline auto-injector. Sesame is a leading anaphylaxis trigger — watch closely.',
    breastfeedingSafe: true,
    culturalNote:  'Til is deeply embedded — til laddoo, gajak (peak around Makar Sankranti), chutneys, gingelly oil. Thin tahini into dal, khichdi, curd, or fruit puree; avoid loose til seeds from laddoo/gajak for young infants.',
    confidence:    'high',
    sources:       ['AAP','UK NHS','ASCIA','FDA FASTER Act 2021','NEJM EAT 2016','J Asthma Allergy (persistence)','JAMA Netw Open 2019'],
    dashboard:     'sesame-infant-safety.visual.html',
    brief:         'sesame-infant-safety.md',
    longform:      'sesame-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },

  // ── food-effects-v2 P1c: cow's milk + plant milks (the "broader food classes") ──
  // TWO records, one shared brief/dashboard (cow-milk-plant-milks-infant-safety.*),
  // mirroring the peanut/tree-nut precedent (spec §7). These instantiate the TWO
  // never-used foodClasses in the v2 taxonomy (spec §2):
  //   cow milk   = 'drink-timing'      (fine IN FOOD ~6mo; not the main DRINK before 12mo)
  //   plant milk = 'substitute-caveat' (no plant milk replaces breastmilk/formula <1; rice = arsenic)
  // NEITHER is allergen-introduce-early — NO earlyIntroBenefit (milk is not an "introduce
  // early to prevent allergy" food; EAT found NO prevention effect for milk). `safeForm`
  // is repurposed as the DRINK-vs-FOOD gate (ok = food forms / fortified age-1 forms;
  // never = the gated drink uses). The CMPA allergic axis (watchFor/severeSigns) rides
  // ALONGSIDE the timing axis on the cow-milk record — milk is the most common infant allergen.
  // OPEN for the P1c polarity spec + Kael/Vela spec-review (these two classes have no card
  // composition yet): (1) how drink-timing / substitute-caveat render (no benefit banner —
  // what leads?); (2) reactionType has no 'nutritional' / 'chronic-toxin' value for
  // iron-deficiency-anaemia or rice arsenic — cow-milk uses in-enum honest values; plant
  // milk uses [] (its harm is not an acute reaction; spec may add a value); (3) does a
  // drink-timing card carry the severe (anaphylaxis) floor? Provisional: YES, present-only,
  // whenever dairy is being introduced (CMPA). All resolved at spec-review, not here.
  {
    food:          'cow milk',
    // K-1 (Kael): 'top feed' DROPPED — in Indian logs it frequently means FORMULA, not
    // cow milk; firing the drink-timing card on a formula log is a Care-defect. 'top milk'
    // kept (unambiguously cow/buffalo dilute-milk). Bare 'doodh' deliberately UNALIASED
    // (co-occurs in 'haldi doodh', a spiced-milk food — same precision reason as bare 'milk').
    aliases:       ['cow\'s milk','buffalo milk','bhains ka doodh','gaay ka doodh','animal milk','whole milk','full-fat milk','top milk','dairy milk','full cream milk'],
    foodClass:     'drink-timing',
    severity:      'caution',              // amber timing-caution, NOT rose acute-toxin
    category:      'dairy',
    effect:        'iron-deficiency anaemia + renal solute load (as a main drink before 12mo)',
    minMonth:      12,                     // as a MAIN DRINK; dairy IN FOOD is fine from ~6mo (the carve-out)
    thresholdBasis:'physiological',        // gut occult blood loss ceases ~12mo; immature renal solute tolerance
    allergen:      true,                   // CMPA — most common infant food allergy (a SEPARATE axis from timing)
    reactionType:  ['renal','digestive','allergy'],  // renal/digestive = timing harms (renal load, occult GI blood loss); allergy = CMPA
    headline:      'Fine in food from ~6 months (dahi, paneer, milk in khichdi) — but not as the main drink before 12 months.',
    whyGood:       'Dairy IN FOOD is excellent from ~6 months — dahi/curd, paneer and cheese give calcium, protein, B12 and healthy fats. The caution is only about milk AS THE MAIN DRINK before 1 year.',
    safeForm:      { ok:['dahi / curd, paneer, and pasteurised full-fat cheese from ~6 months','small amounts of milk cooked into khichdi, porridge or cereal','from 12 months: whole (full-fat) milk as a main drink, ~500 ml (≈2 cups)/day maximum'],
                     never:['cow\'s or buffalo milk as the MAIN DRINK before 12 months','diluted / sweetened "top milk" as a breastmilk or formula substitute','unpasteurised milk, and mould-ripened (brie/camembert), blue, or ripened-goat cheese at any infant age','skimmed / low-fat milk as a main drink before age 2'],
                     note:'The drink is gated; the dairy is not. Breastmilk or first infant formula is the milk under 12 months. Diluting cow/buffalo milk adds no iron and still displaces breastmilk.' },
    howToIntroduce:{ amount:'From 12 months: ~500 ml (≈2 cups) of whole milk per day maximum — more is linked to iron deficiency.',
                     when:'As a main drink from 12 months. Dairy IN FOOD (dahi / paneer / cheese / milk in cooking) from ~6 months.',
                     watch:'When introducing dairy in food, watch ~2 hours for a cow\'s-milk-protein-allergy reaction (milk is the most common infant allergen).',
                     highRiskNote:'' },
    myth:          { claim:'Cow\'s/buffalo milk makes a baby strong and fat — give it early.',
                     truth:'Before 12 months as a main drink it causes iron-deficiency anaemia and strains the kidneys. Breastmilk or formula is the milk under 1; dairy belongs in food, not as the drink.' },
    watchFor:      ['hives / rash','swelling (lips, face, eyes)','vomiting','diarrhoea or bloody stool (non-IgE CMPA)','eczema flare'],
    severeSigns:   ['trouble breathing / wheeze','tongue or throat swelling','hoarse cry','floppy, pale, or very sleepy'],
    timeCourse:    'CMPA — IgE: minutes to ~2 h; non-IgE: delayed ~48 h–1 week (GI-predominant, bloody stool). Iron deficiency from milk-as-drink: gradual over weeks–months.',
    seekCare:      'CMPA mild single-system: stop, monitor, call doctor. Breathing trouble, tongue/throat swelling, hoarse cry, or floppiness: EMERGENCY — call 112/108, use prescribed adrenaline auto-injector (antihistamine does NOT treat anaphylaxis). Most children outgrow CMPA by 3–5; reintroduction (the milk ladder) is a clinician\'s call.',
    breastfeedingSafe: true,
    culturalNote:  'Early "top feeding" with cow/buffalo milk (often diluted + sugared) before 6–12 months is common in India and harmful — buffalo milk is even higher in fat/protein (heavier renal load). IAP: "avoid only milk feeds; use milk to prepare foods." India\'s young-child anaemia is ~67% (NFHS-5). The exact "no milk as a main drink before 12 months" rule is the international bodies\' line (AAP/ESPGHAN), NOT attributed to an Indian body.',
    confidence:    'high',
    sources:       ['AAP','UK NHS','US CDC','ESPGHAN','WHO','Ziegler 2011 (Nutrition Reviews)','ASCIA (CMPA)','IAP Ch-040','MoHFW/NHM IYCF','NFHS-5'],
    dashboard:     'cow-milk-plant-milks-infant-safety.visual.html',
    brief:         'cow-milk-plant-milks-infant-safety.md',
    longform:      'cow-milk-plant-milks-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },
  {
    food:          'plant milk',
    // NOTE: 'soy milk' / 'soya milk' already alias to the SOY allergen record in data.js —
    // left there (soy is the allergen exception); soy is cross-referenced in copy, not re-aliased.
    // K-2 (Kael): 'badam milk'/'badam doodh' ADDED — the Hindi-English code-switch form an
    // Indian parent actually types for almond-milk drink (English-only 'almond milk' missed it).
    aliases:       ['almond milk','badam milk','badam doodh','oat milk','rice milk','rice drink','cashew milk','coconut milk drink','plant-based milk','plant milks','vegan milk','toddler milk','growing-up milk','follow-on milk drink'],
    foodClass:     'substitute-caveat',
    severity:      'caution',
    category:      'plant-milk',
    effect:        'inadequate substitute for breastmilk/formula (<1); rice-drink arsenic (<5)',
    minMonth:      12,                     // not a substitute under 12mo; rice drinks excluded under 5
    thresholdBasis:'nutritional-adequacy',
    allergen:      false,                  // soy milk is the allergen exception — handled on the soy record
    reactionType:  [],                     // honest: no acute reaction; harm is nutritional inadequacy + chronic arsenic. No enum value fits — spec may add 'nutritional'. (hub `arr()` handles []; plant milk correctly absent from the Reactions cross-cut.)
    headline:      'Not a milk substitute under 1. Rice drinks: none under 5 (arsenic). From age 1, fortified soy/oat only as part of a varied diet.',
    whyGood:       'From age 1, unsweetened, calcium-fortified soy or oat milk can be PART of a varied diet. Fortified soy is the only plant milk nutritionally close to cow\'s milk.',
    safeForm:      { ok:['from 12 months: unsweetened, calcium-fortified soy or oat milk, as PART of a varied diet (not the sole drink for an under-2)'],
                     never:['ANY plant milk as a breastmilk or formula substitute before 12 months','RICE drinks for any child under 5 years (inorganic arsenic) — eating rice the grain is still fine','unfortified plant milk as a main drink','almond milk as a main drink (too low in protein and fat)','carton soy DRINK as infant formula (soy formula is a separate, prescribed product)'],
                     note:'No plant milk replaces breastmilk or formula under 1. After age 1, ranking: fortified soy ≈ oat > almond (low protein) > rice (arsenic — avoid under 5). "Toddler / growing-up milks" are unnecessary (AAP).' },
    myth:          { claim:'Plant milk (almond/oat/rice) is a healthy milk substitute for my baby or toddler.',
                     truth:'Not under 1 — it replaces neither breastmilk nor formula. Rice drinks are unsafe under 5 (arsenic); almond milk is too low in protein/fat. From age 1, fortified soy/oat can be part of a varied diet.' },
    watchFor:      ['soy milk only: hives / rash, swelling, vomiting — soy is a major allergen (see the soy record)'],
    timeCourse:    'Nutritional inadequacy: gradual. Arsenic (rice drinks): a chronic/cumulative-exposure concern, not an acute reaction.',
    seekCare:      'Not an emergency food. If a plant milk has been the main drink for an under-1 (or a rice drink given to an under-5), switch and discuss iron/nutrition with your doctor.',
    breastfeedingSafe: true,
    culturalNote:  'Marketed "toddler"/"growing-up" milks are unnecessary (AAP) and their promotion for children up to 36 months is restricted under the WHO Code. In India, prefer dahi/paneer plus (from 12 months) whole cow\'s milk over carton plant drinks for a young child.',
    confidence:    'high',
    sources:       ['UK NHS','UK FSA (arsenic)','USDA DGA 2020-2025','AAP (toddler milk)','WHO (Code)'],
    dashboard:     'cow-milk-plant-milks-infant-safety.visual.html',
    brief:         'cow-milk-plant-milks-infant-safety.md',
    longform:      'cow-milk-plant-milks-infant-safety.html',
    lastReviewed:  '2026-06-01',
  },

  // ── append the next food here (fish / salt …) ──
];

/* Node/CommonJS convenience (so the hub OR a build step can require it). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FOOD_EFFECTS_MANIFEST;
}
