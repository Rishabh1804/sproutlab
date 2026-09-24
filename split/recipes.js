// ═══════════════════════════════════════════════════════════════════════
// recipes.js — Diet → Recipes corpus (food-sub-tab Recipes, WIRING_PLAN §3)
// Spec: docs/design/recipes-tab/WIRING_PLAN.md (+ SESSION_HANDOFF.md, LOCKED.md)
//
// A structured, cited recipe corpus for complementary feeding (6–12 m) and the
// toddler year (12–24 m, family food adapted — texture/portion/choking/mddGroups).
// Distinct from the flat COMBO_RECIPES map (data.js): each entry carries
// structured ingredients (in the form the LIVE resolver classifies), a meal
// slot, an age gate, FOOD_TAX food-groups (for gap-fill scoring + card
// colour), steps/dos/donts, cuisine, and a per-recipe SOURCE citation —
// "no assumptions" (WIRING_PLAN §6). This is the curated, deep-researched
// spine; it is the SOLE source for the catalog render. The legacy
// COMBO_RECIPES map stays as-is and still powers the combo-checker; folding
// its uncited, slot-less entries into THIS cited catalog is a deferred
// follow-up (cipher Edict-V honesty nit, PR #223) — not done here, because
// they lack the structured slot/age/citation fields the catalog renders.
//
// SAFETY INVARIANTS baked in (RECIPE_RESEARCH.md, cross-verified ≥2 sources):
//   • No honey / added salt < 12 m; no added sugar — honey included — < 24 m (fruit sweetens;
//     WHO free sugars + DGA 2020–25 count honey as added sugar; 2026-09-24 12-month audit).
//   • Allergens (egg, fish, nuts, dairy, sesame) introduced early ~6 m, one
//     at a time — never laundered as a prevention claim.
//   • Nuts NEVER whole — ground fine / smooth paste (choking).
//   • Egg fully cooked; fish boneless + low-mercury species; cow milk only in
//     cooking < 12 m, not as the main drink.
//   • minAgeMonths ≥ max(ingredient age-gate); the app's AGE_RULES /
//     FOOD_EFFECTS table WINS on any disagreement (the recipe flags, never
//     overrides — enforced live at render, WIRING_PLAN §5 Pass B).
//
// ALIAS-PRECEDENCE DISCIPLINE (the fish/milk lesson, NEXT_SESSION_TARGET):
//   every `ingredients[].name` is stored in the form the live
//   _lookupByFoodName resolver classifies correctly — verified per-recipe at
//   authoring, pinned by tests/e2e/diet-recipes.spec.ts against the resolver.
//   "egg" → eggs (not "egg"≠eggplant); "rohu fish" → fish (low-mercury, not
//   the bare-fish green leak); honey → acute-toxin avoid (never suggested).
//
// Jurisdiction: Kael (file/engine — concat + window export), Maren (CONTENT —
// sources, age gates, allergen/choking forms; clinically audited at the gate).
// ═══════════════════════════════════════════════════════════════════════

// Source shorthand — the Tier-1 authoritative bodies from RECIPE_RESEARCH.md.
// Per-gram Indian ratios are RD-sourced best-practice; every nutrition/safety
// claim traces to these. (Citations are organisation + document, not deep
// per-page URLs — the framework, not a fabricated locator.)
const RECIPE_SOURCES = {
  who:    { org: 'WHO', doc: 'Complementary feeding (IYCF) 2023 · NBK596423' },
  whopaho:{ org: 'WHO/PAHO', doc: 'Guiding principles for complementary feeding · NBK148957' },
  iap:    { org: 'IAP', doc: 'Infant & Young Child Feeding Guidelines · Ch-040' },
  icmr:   { org: 'ICMR-NIN', doc: 'Dietary Guidelines for Indians 2024' },
  nhs:    { org: 'NHS', doc: 'Start4Life — baby weaning & first foods' },
  aap:    { org: 'AAP', doc: 'HealthyChildren — starting solid foods' },
  // 12–24 m toddler extension (2026-09-24, PR 3) — fetched 2026-09-24:
  whonb:    { org: 'WHO', doc: 'Guiding principles for feeding non-breastfed children 6–24 months (2005)' },
  whoiycf:  { org: 'WHO/UNICEF', doc: 'Indicators for assessing IYCF practices (2021) · MDD' },
  iap16:    { org: 'IAP', doc: 'IYCF Guidelines 2016 · Indian Pediatr 53:703–713 · Table II' },
  nhsbsl:   { org: 'NHS', doc: 'Best Start in Life — 1 year and beyond · Preparing food safely' },
  nhssalt:  { org: 'NHS', doc: 'Salt in your diet — 1–3 years ≤ 2 g/day' },
  nhsteeth: { org: 'NHS', doc: 'Baby teething — eruption timeline' },
  her:      { org: 'AAP/HER', doc: 'Recommended drinks for young children 0–5 (2019 consensus)' },
  unicefin: { org: 'UNICEF India', doc: 'Early childhood nutrition' },
};

// Each recipe:
//   { id, title, slot, minAgeMonths, prepMinutes,
//     ingredients:[{name, qty, g}], // name = the LIVE-resolver classifying form;
//                                   // g = grams (drives the quantity-weighted
//                                   // generative fingerprint §9.3; trace items
//                                   // ghee/oil/spices excluded at render)
//     foodGroups:[FOOD_TAX gid],   // gap-fill scoring + card colour
//     steps:[…], dos:[…], donts:[…],
//     cuisine, source:[sourceKey…] }
const RECIPES = [
  // ─────────────────────────── BREAKFAST ───────────────────────────
  {
    id: 'ragi-banana-porridge', title: 'Ragi Banana Porridge', slot: 'breakfast', minAgeMonths: 7, prepMinutes: 12,
    ingredients: [{ name: 'ragi', qty: '1 tbsp (24 g)', g: 24 }, { name: 'banana', qty: '¼, mashed (20 g)', g: 20 }],
    foodGroups: ['grains', 'fruits'], cuisine: 'Indian',
    steps: [
      'Dry-roast 1 tbsp ragi flour on low for 2 min until fragrant.',
      'Add ½ cup water, whisk continuously to avoid lumps, cook 5–6 min until thick.',
      'Loosen with a little expressed breastmilk or water off the heat.',
      'Cool slightly, fold in mashed banana. Serve warm.',
    ],
    dos: ['Whisk continuously for a smooth, lump-free porridge', "Banana's vitamin C helps the ragi iron absorb", 'Cook to a thick, spoonable consistency'],
    donts: ['No added sugar — ripe banana sweetens', 'Use water or expressed breastmilk; cow’s milk as a main drink waits until 12 months', 'Serve fresh, not stored'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'oats-apple-porridge', title: 'Oats & Apple Porridge', slot: 'breakfast', minAgeMonths: 7, prepMinutes: 10,
    ingredients: [{ name: 'oats', qty: '1 tbsp ground (24 g)', g: 24 }, { name: 'apple', qty: '¼ grated (20 g)', g: 20 }, { name: 'cinnamon', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'fruits', 'spices'], cuisine: 'Global',
    steps: [
      'Grind 1 tbsp plain rolled oats to a coarse powder.',
      'Cook in ½ cup water on low for 5 min, stirring.',
      'Add grated apple and a pinch of cinnamon, cook 2 min until soft.',
      'Cool to warm and serve.',
    ],
    dos: ['Use plain rolled oats, not flavoured instant packets', 'Apple is grated and cooked — never raw at this age', 'Cinnamon adds warmth, no sugar needed'],
    donts: ['No added sugar or honey', "Don't make it too thick for a beginner", 'Watch for a gluten reaction if there is family history'],
    source: ['nhs', 'aap'],
  },
  {
    id: 'almond-ragi-kheer', title: 'Almond Ragi Kheer (12 m+)', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 18,
    ingredients: [{ name: 'milk', qty: '½ cup (in cooking)', g: 60 }, { name: 'ragi', qty: '1 tbsp (15 g)', g: 15 }, { name: 'date', qty: '1, deseeded paste', g: 8 }, { name: 'almond', qty: '¼ tsp ground (3 g)', g: 3 }],
    foodGroups: ['dairy', 'grains', 'fruits', 'nuts'], cuisine: 'Indian',
    steps: [
      'Soak 2 almonds, peel, and grind to an absolutely smooth paste.',
      'Soak 1 date 15 min, deseed, mash to a paste.',
      'Cook 1 tbsp ragi in ½ cup whole milk on low, stirring, until thick (6–8 min).',
      'Stir in the almond and date paste, cook 1 min. Cool and serve.',
    ],
    dos: ['Cow’s milk as the main liquid is a first-birthday food — this is a 12 m+ treat', 'Grind almond to a completely smooth paste — never whole', 'Date provides all the sweetness needed'],
    donts: ['Not before 12 months — cow’s milk as a main drink/liquid waits until the first birthday', 'NEVER serve whole or chopped nuts — choking risk', 'No added sugar'],
    source: ['iap', 'aap'],
  },
  {
    id: 'suji-veg-upma', title: 'Suji & Veg Upma', slot: 'breakfast', minAgeMonths: 8, prepMinutes: 15,
    ingredients: [{ name: 'suji', qty: '2 tbsp (30 g)', g: 30 }, { name: 'carrot', qty: '2 tbsp grated', g: 20 }, { name: 'peas', qty: '1 tbsp, mashed', g: 12 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'vegs', 'dairy'], cuisine: 'Indian',
    steps: [
      'Dry-roast 2 tbsp suji on low until aromatic, set aside.',
      'In ½ tsp ghee, soften grated carrot and mashed peas for 2 min.',
      'Add 1 cup water, bring to a simmer, then rain in the suji while stirring.',
      'Cook 3–4 min until soft and fluffy. Mash any lumps. Serve warm.',
    ],
    dos: ['Roast the suji for a non-sticky upma', 'Grate vegetables fine and cook until very soft', 'A little ghee adds energy density'],
    donts: ['No salt before 12 months', "Don't leave whole peas — mash them (choking)", 'Skip mustard-seed tempering and green chilli'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'poha-peas-potato', title: 'Poha with Peas & Potato', slot: 'breakfast', minAgeMonths: 8, prepMinutes: 12,
    ingredients: [{ name: 'poha', qty: '3 tbsp (30 g)', g: 30 }, { name: 'potato', qty: '2 tbsp, boiled & mashed', g: 30 }, { name: 'peas', qty: '1 tbsp, mashed', g: 12 }, { name: 'turmeric', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'vegs', 'spices'], cuisine: 'Indian',
    steps: [
      'Rinse 3 tbsp thin poha in a sieve until just soft, drain.',
      'Soften boiled mashed potato and mashed peas with a pinch of turmeric in ½ tsp ghee.',
      'Fold in the poha with a splash of water, cover and steam 3 min.',
      'Mash lightly to an even, soft texture. Serve warm.',
    ],
    dos: ['Use thin poha — it softens easily', 'Mash peas and potato well', 'A pinch of turmeric is gentle and anti-inflammatory'],
    donts: ['No salt or green chilli', "Don't use thick poha for young babies", 'Serve fresh — poha dries out'],
    source: ['icmr', 'iap'],
  },
  {
    id: 'banana-oats-egg-pancake', title: 'Banana Oats Egg Pancake', slot: 'breakfast', minAgeMonths: 8, prepMinutes: 10,
    ingredients: [{ name: 'banana', qty: '½, mashed', g: 25 }, { name: 'oats', qty: '1 tbsp ground', g: 20 }, { name: 'egg', qty: '1, well beaten', g: 50 }],
    foodGroups: ['fruits', 'grains', 'nonveg'], cuisine: 'Global',
    steps: [
      'Mash ½ ripe banana smooth.',
      'Mix in 1 tbsp finely ground oats and 1 well-beaten egg to a thick batter.',
      'Cook small thin pancakes on a lightly greased tawa on low until fully set on both sides.',
      'Cool and tear into soft pieces. Egg must be cooked through — firm, no runny centre.',
    ],
    dos: ['Cook the egg fully — firm white and yolk', 'Introduce egg on its own for 3 days first', 'Soft finger-food texture suits 8 m+'],
    donts: ['Never serve runny or undercooked egg', 'No added sugar — banana sweetens', 'Watch for an egg reaction the first few times'],
    source: ['nhs', 'aap'],
  },
  {
    id: 'dalia-porridge', title: 'Broken-Wheat Dalia Porridge', slot: 'breakfast', minAgeMonths: 8, prepMinutes: 15,
    ingredients: [{ name: 'dalia', qty: '2 tbsp (30 g)', g: 30 }, { name: 'date', qty: '1, paste', g: 8 }],
    foodGroups: ['grains', 'fruits'], cuisine: 'Indian',
    steps: [
      'Dry-roast 2 tbsp dalia (broken wheat) 2 min.',
      'Pressure-cook with ½ cup water until very soft (2–3 whistles).',
      'Add ½ cup water (or expressed breastmilk) and mashed date, simmer 3 min until creamy.',
      'Mash to an even texture. Serve warm.',
    ],
    dos: ['Cook dalia until very soft', 'Date sweetens naturally', 'Good source of fibre and iron'],
    donts: ['No added sugar', 'Skip if there is a known wheat (gluten) reaction', 'Cow’s milk as a main drink waits until 12 months — use water or breastmilk here'],
    source: ['iap', 'icmr'],
  },

  // ─────────────────────────── LUNCH ───────────────────────────
  {
    id: 'moong-dal-khichdi', title: 'Moong Dal Khichdi', slot: 'lunch', minAgeMonths: 7, prepMinutes: 20,
    ingredients: [{ name: 'rice', qty: '1 tbsp (12 g)', g: 12 }, { name: 'moong dal', qty: '½ tbsp (8 g)', g: 8 }, { name: 'ghee', qty: '½ tsp', g: 3 }, { name: 'turmeric', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'dairy', 'spices'], cuisine: 'Indian',
    steps: [
      'Wash 1 tbsp rice and ½ tbsp moong dal, soak 20 min.',
      'Pressure-cook with 1 cup water and a pinch of turmeric — 4 whistles.',
      'Mash smooth, stir in ½ tsp ghee.',
      'Adjust to a semi-liquid, spoonable consistency. Serve warm.',
    ],
    dos: ['The classic first khichdi — cereal + pulse is a complete protein', 'Mash very smooth for beginners', 'Ghee adds brain-healthy fats'],
    donts: ['No salt or spices beyond turmeric', "Don't make it too thick", 'Serve fresh'],
    source: ['iap', 'whopaho'],
  },
  {
    id: 'veg-moong-khichdi', title: 'Veg & Moong Khichdi', slot: 'lunch', minAgeMonths: 8, prepMinutes: 25,
    ingredients: [{ name: 'rice', qty: '1 tbsp (15 g)', g: 15 }, { name: 'moong dal', qty: '½ tbsp (10 g)', g: 10 }, { name: 'carrot', qty: '2 tbsp (20 g)', g: 20 }, { name: 'pumpkin', qty: '2 tbsp (20 g)', g: 20 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'vegs', 'dairy'], cuisine: 'Indian',
    steps: [
      'Wash rice and moong dal, soak 20 min.',
      'Add diced carrot and pumpkin, a pinch of turmeric, and 1 cup water.',
      'Pressure-cook 4 whistles until everything is very soft.',
      'Mash, stir in ghee, and serve warm.',
    ],
    dos: ['A balanced one-pot — grain, pulse and two vegetables', 'Beta-carotene from carrot and pumpkin', 'Cook until everything mashes easily'],
    donts: ['No salt', "Don't leave vegetable chunks — mash well", 'Introduce each new vegetable on its own first'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'dal-rice-palak', title: 'Dal–Rice with Palak', slot: 'lunch', minAgeMonths: 8, prepMinutes: 25,
    ingredients: [{ name: 'rice', qty: '3 tbsp (45 g)', g: 45 }, { name: 'toor dal', qty: '1½ tbsp (25 g)', g: 25 }, { name: 'spinach', qty: '1 tbsp, blanched (15 g)', g: 15 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'vegs', 'dairy'], cuisine: 'Indian',
    steps: [
      'Blanch a few spinach (palak) leaves 2 min, chop fine or puree.',
      'Pressure-cook rice and toor dal soft with a pinch of turmeric.',
      'Fold in the spinach and cook 2 min.',
      'Mash with ghee and a few drops of lemon for iron absorption. Serve warm.',
    ],
    dos: ['Iron from dal + palak, with vitamin C to help it along', 'Blanch spinach first to reduce oxalates', 'A leafy-green everyday lunch'],
    donts: ["Don't use raw spinach", "Don't reheat — make fresh", 'No salt'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'masoor-lauki-rice', title: 'Masoor Dal & Bottle Gourd Rice', slot: 'lunch', minAgeMonths: 7, prepMinutes: 20,
    ingredients: [{ name: 'rice', qty: '2 tbsp', g: 30 }, { name: 'masoor dal', qty: '1 tbsp', g: 15 }, { name: 'bottle gourd', qty: '2 tbsp, diced', g: 25 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'vegs', 'dairy'], cuisine: 'Indian',
    steps: [
      'Wash rice and masoor dal, soak 20 min.',
      'Add peeled, diced bottle gourd (lauki) and a pinch of turmeric.',
      'Pressure-cook with ¾ cup water — 3 whistles until very soft.',
      'Mash, add ghee, serve warm.',
    ],
    dos: ['Bottle gourd is light and easy to digest', 'Masoor cooks soft quickly', 'Gentle on little tummies'],
    donts: ['No salt', 'Peel the gourd fully', 'Taste the gourd — discard if bitter'],
    source: ['icmr', 'iap'],
  },
  {
    id: 'soft-curd-rice', title: 'Soft Curd Rice', slot: 'lunch', minAgeMonths: 8, prepMinutes: 10,
    ingredients: [{ name: 'rice', qty: '2 tbsp, very soft', g: 30 }, { name: 'curd', qty: '1 tbsp, fresh', g: 40 }],
    foodGroups: ['grains', 'dairy'], cuisine: 'Indian',
    steps: [
      'Cook 2 tbsp rice until very soft and mashable.',
      'Cool to room temperature.',
      'Mash 1 tbsp fresh homemade curd into the rice until creamy.',
      'Serve at room temperature.',
    ],
    dos: ['Use fresh homemade curd', 'Great for hot weather — cooling and probiotic', 'Serve at room temperature'],
    donts: ["Don't heat the curd — it kills the good bacteria", "Don't serve fridge-cold", 'No salt or tempering'],
    source: ['icmr', 'iap'],
  },
  {
    id: 'paneer-veg-pulao', title: 'Paneer & Veg Soft Pulao', slot: 'lunch', minAgeMonths: 9, prepMinutes: 20,
    ingredients: [{ name: 'rice', qty: '3 tbsp', g: 30 }, { name: 'paneer', qty: '1 tbsp, crumbled', g: 15 }, { name: 'carrot', qty: '1 tbsp, grated', g: 20 }, { name: 'peas', qty: '1 tbsp, mashed', g: 12 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'dairy', 'vegs'], cuisine: 'Indian',
    steps: [
      'Soften grated carrot and mashed peas in ½ tsp ghee for 2 min.',
      'Add washed rice and water, cook until very soft.',
      'Fold in crumbled fresh paneer, cook 2 min more.',
      'Mash lightly to a soft, even texture. Serve warm.',
    ],
    dos: ['Calcium + protein from paneer', 'Use fresh homemade paneer, crumbled small', 'A gentle, mild pulao — no whole spices'],
    donts: ['No salt or garam masala', 'Avoid market paneer with preservatives', 'Crumble paneer small — no cubes (choking)'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'rohu-fish-rice', title: 'Rohu Fish & Rice Mash', slot: 'lunch', minAgeMonths: 8, prepMinutes: 18,
    ingredients: [{ name: 'rice', qty: '3 tbsp', g: 30 }, { name: 'rohu fish', qty: '1 tbsp, cooked & deboned', g: 15 }, { name: 'ghee', qty: '½ tsp', g: 3 }, { name: 'turmeric', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'nonveg', 'dairy'], cuisine: 'Indian',
    steps: [
      'Steam a small piece of rohu with a pinch of turmeric until flaky.',
      'Flake it completely and check meticulously for bones.',
      'Mash into soft-cooked rice with ½ tsp ghee.',
      'Serve warm, deboned and smooth.',
    ],
    dos: ['Choose low-mercury freshwater fish like rohu or pomfret', 'Debone meticulously — check twice', 'Omega-3 for brain development; introduce on its own first'],
    donts: ['Never high-mercury fish (seer/surmai, shark, swordfish)', "Don't leave any bone", 'Watch for a fish reaction the first few times'],
    source: ['aap', 'nhs'],
  },

  // ─────────────────────────── DINNER ───────────────────────────
  {
    id: 'carrot-beet-potato-mash', title: 'Carrot Beetroot Potato Mash', slot: 'dinner', minAgeMonths: 7, prepMinutes: 20,
    ingredients: [{ name: 'carrot', qty: '3 tbsp (40 g)', g: 40 }, { name: 'beetroot', qty: '2 tbsp (30 g)', g: 30 }, { name: 'potato', qty: '3 tbsp (40 g)', g: 40 }, { name: 'ghee', qty: '¼ tsp', g: 3 }],
    foodGroups: ['vegs', 'dairy'], cuisine: 'Indian',
    steps: [
      'Peel and dice carrot, beetroot and potato.',
      'Steam 10–12 min until very soft.',
      'Mash together with a little ghee.',
      'Serve warm — a ruby, beta-carotene-rich bowl.',
    ],
    dos: ['Steam to preserve nutrients', 'Beta-carotene and folate', 'A little fat helps absorb vitamin A'],
    donts: ['Use a bib — beetroot stains, and pink stools are normal', 'No salt', "Don't use canned vegetables"],
    source: ['icmr', 'nhs'],
  },
  {
    id: 'sweet-potato-moong-mash', title: 'Sweet Potato & Moong Mash', slot: 'dinner', minAgeMonths: 7, prepMinutes: 18,
    ingredients: [{ name: 'sweet potato', qty: '½ small (50 g)', g: 50 }, { name: 'moong dal', qty: '1 tbsp', g: 12 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['vegs', 'grains', 'dairy'], cuisine: 'Indian',
    steps: [
      'Steam cubed sweet potato 10 min until very soft.',
      'Separately cook moong dal soft with a pinch of turmeric.',
      'Mash together with ½ tsp ghee.',
      'Serve warm.',
    ],
    dos: ['Naturally sweet — babies love it', 'Sweet potato is rich in vitamin A', 'Ghee helps the fat-soluble vitamins absorb'],
    donts: ['No salt or sugar', 'Steam, don\'t microwave', 'Mash smooth for younger babies'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'palak-paneer-rice', title: 'Palak Paneer Rice', slot: 'dinner', minAgeMonths: 9, prepMinutes: 18,
    ingredients: [{ name: 'rice', qty: '3 tbsp', g: 30 }, { name: 'paneer', qty: '1 tbsp, crumbled', g: 15 }, { name: 'spinach', qty: '1 tbsp, blanched', g: 15 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'dairy', 'vegs'], cuisine: 'Indian',
    steps: [
      'Blanch spinach 2 min, puree smooth.',
      'Fold the spinach puree into soft-cooked rice.',
      'Add crumbled fresh paneer and ½ tsp ghee, warm through 2 min.',
      'Mash to a soft texture. Serve warm.',
    ],
    dos: ['Iron from palak + calcium and protein from paneer', 'Blanch spinach first', 'Crumble paneer small'],
    donts: ['No salt', "Don't reheat spinach dishes — make fresh", 'Avoid market paneer'],
    source: ['iap', 'icmr'],
  },
  {
    id: 'chicken-rice-bowl', title: 'Soft Chicken & Rice Bowl', slot: 'dinner', minAgeMonths: 9, prepMinutes: 25,
    ingredients: [{ name: 'rice', qty: '3 tbsp', g: 30 }, { name: 'chicken', qty: '1 tbsp, shredded', g: 15 }, { name: 'carrot', qty: '1 tbsp, grated', g: 20 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'nonveg', 'vegs'], cuisine: 'Global',
    steps: [
      'Boil a small piece of boneless chicken until fully cooked and tender.',
      'Shred finely or pulse to a soft mince — no strings or chunks.',
      'Cook soft rice with grated carrot.',
      'Mash the chicken into the rice with ½ tsp ghee. Serve warm.',
    ],
    dos: ['Cook chicken thoroughly — no pink', 'Shred or mince very fine (choking)', 'Iron and protein; introduce on its own first'],
    donts: ['Never undercooked chicken', "Don't leave stringy or chunky pieces", 'No salt or masala'],
    source: ['aap', 'nhs'],
  },
  {
    id: 'mixed-veg-dal-soup', title: 'Mixed Veg & Dal Soup', slot: 'dinner', minAgeMonths: 8, prepMinutes: 20,
    ingredients: [{ name: 'moong dal', qty: '1 tbsp', g: 12 }, { name: 'carrot', qty: '1 tbsp', g: 20 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'bottle gourd', qty: '1 tbsp', g: 25 }],
    foodGroups: ['grains', 'vegs'], cuisine: 'Indian',
    steps: [
      'Pressure-cook moong dal with diced carrot, tomato and bottle gourd until very soft.',
      'Blend or mash to a smooth soup.',
      'Strain lightly if needed for a younger baby; add ½ tsp ghee.',
      'Serve warm in a sippy bowl or spoon.',
    ],
    dos: ['A light, hydrating, protein-rich soup', 'Good when a baby is recovering or off solids', 'Vitamin C from tomato helps iron absorb'],
    donts: ['No salt', 'Cool to warm before serving', 'Introduce tomato on its own first if new'],
    source: ['whopaho', 'icmr'],
  },

  // ─────────────────────────── SNACK ───────────────────────────
  {
    id: 'curd-banana-bowl', title: 'Curd & Banana Bowl', slot: 'snack', minAgeMonths: 8, prepMinutes: 3,
    ingredients: [{ name: 'curd', qty: '3 tbsp (60 g)', g: 60 }, { name: 'banana', qty: '¼, mashed (25 g)', g: 25 }],
    foodGroups: ['dairy', 'fruits'], cuisine: 'Indian',
    steps: [
      'Whisk 3 tbsp fresh full-fat curd smooth.',
      'Fold in ¼ mashed ripe banana.',
      'Serve at room temperature.',
    ],
    dos: ['Calcium and probiotics, no cooking', 'Use fresh full-fat homemade curd', 'Banana sweetens — no sugar'],
    donts: ["Don't serve fridge-cold", "Don't add honey or sugar", 'Make fresh'],
    source: ['icmr', 'nhs'],
  },
  {
    id: 'carrot-moong-mash', title: 'Carrot Moong Mash', slot: 'snack', minAgeMonths: 6, prepMinutes: 18,
    ingredients: [{ name: 'carrot', qty: '3 tbsp, grated', g: 20 }, { name: 'moong dal', qty: '2 tbsp', g: 12 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['vegs', 'grains', 'dairy'], cuisine: 'Indian',
    steps: [
      'Grate carrot and wash moong dal.',
      'Pressure-cook together with ¾ cup water and a pinch of turmeric — 3 whistles.',
      'Mash smooth with ½ tsp ghee.',
      'Serve warm.',
    ],
    dos: ['Vitamin A + easy protein', 'Carrot adds natural sweetness', 'A good early first-foods combo from 6 m'],
    donts: ['No salt', 'Cook until very soft', 'Mash smooth'],
    source: ['whopaho', 'iap'],
  },
  {
    id: 'avocado-banana-mash', title: 'Avocado & Banana Mash', slot: 'snack', minAgeMonths: 6, prepMinutes: 3,
    ingredients: [{ name: 'avocado', qty: '2 tbsp', g: 30 }, { name: 'banana', qty: '¼, mashed', g: 25 }],
    foodGroups: ['fruits'], cuisine: 'Global',
    steps: [
      'Scoop 2 tbsp ripe avocado.',
      'Mash with ¼ ripe banana until smooth.',
      'Serve immediately.',
    ],
    dos: ['No cooking — brain-healthy fats from both', 'Under 3 minutes to prepare', 'A great no-cook first food from 6 m'],
    donts: ['Both oxidise fast — serve fresh', "Don't store mashed", "Don't blend too smooth — a little texture is good"],
    source: ['aap', 'nhs'],
  },
  {
    id: 'stewed-apple-date', title: 'Stewed Apple & Date', slot: 'snack', minAgeMonths: 6, prepMinutes: 10,
    ingredients: [{ name: 'apple', qty: '½, peeled & diced', g: 40 }, { name: 'date', qty: '1, deseeded', g: 8 }],
    foodGroups: ['fruits'], cuisine: 'Global',
    steps: [
      'Peel, core and dice ½ apple.',
      'Steam with 1 deseeded date for 6–7 min until very soft.',
      'Mash or puree smooth.',
      'Cool and serve.',
    ],
    dos: ['A natural, gentle stool-softener', 'Date adds iron and sweetness', 'Steam to preserve nutrients'],
    donts: ['Deseed the date completely', "Don't serve apple raw before 8 months", 'No added sugar'],
    source: ['nhs', 'iap'],
  },
  {
    id: 'mango-curd-bowl', title: 'Mango & Curd Bowl', slot: 'snack', minAgeMonths: 8, prepMinutes: 3,
    ingredients: [{ name: 'mango', qty: '2 tbsp, ripe', g: 30 }, { name: 'curd', qty: '1 tbsp, fresh', g: 40 }],
    foodGroups: ['fruits', 'dairy'], cuisine: 'Indian',
    steps: [
      'Mash 2 tbsp ripe mango smooth.',
      'Fold in 1 tbsp fresh curd.',
      'Serve at room temperature.',
    ],
    dos: ['Vitamin C from mango + probiotics from curd', 'Use only ripe, sweet mango', 'A great summer snack'],
    donts: ["Don't heat the curd", 'Limit mango — high natural sugar', 'Use fresh homemade curd'],
    source: ['icmr', 'iap'],
  },

  // ─── 2 y+ catalog item — age-gated. Honey clears the botulism gate at 12 m but it is a free
  //     sugar, so like jaggery it waits for the 24 m added-sugar gate (Ceres V-C-266-5). Withheld
  //     from Suggested until then; shown in the catalog with its age badge. ───
  {
    id: 'banana-honey-toast', title: 'Banana & Honey Toast (2 y+)', slot: 'snack', minAgeMonths: 24, prepMinutes: 5,
    ingredients: [{ name: 'bread', qty: '1 slice, soft', g: 25 }, { name: 'banana', qty: '½, mashed', g: 25 }, { name: 'honey', qty: '½ tsp (2 y+ only)', g: 5 }],
    foodGroups: ['grains', 'fruits'], cuisine: 'Global',
    steps: [
      'Lightly toast a soft slice of whole-wheat bread, remove crusts, cut into soft fingers.',
      'Spread with mashed banana.',
      'From 2 years only, drizzle ½ tsp honey. Before that, the banana is sweet enough.',
      'Serve as soft fingers.',
    ],
    dos: ['Honey only from 2 years — it is an added sugar', 'Soft fingers suit self-feeding toddlers', 'Whole-wheat bread adds fibre'],
    donts: ['NEVER give honey before 12 months — risk of infant botulism', 'No added sugar, honey included, before 2 years', 'Cut bread into soft, manageable fingers'],
    source: ['who', 'nhs'],
  },
  // ═══ 12–24 m TODDLER EXTENSION (2026-09-24, 12–24 m PR 3) ═══
  // Family food, adapted: texture 'family', a toddler portion, per-recipe choking
  // prep for a toddler without molars, allergens, and WHO MDD groups (mddGroups —
  // separate from FOOD_TAX foodGroups, which files dals under grains and ghee under
  // dairy). No salt in her portion, no added sugar/jaggery/honey before 2.
  // ─────────────────────────── BREAKFAST ───────────────────────────
  {
    id: 'mini-veg-idli-sambar', title: 'Mini Veg Idli with Lauki Sambar', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '3–4 mini idlis + ¼ medium katori sambar (≈ ¾ katori in all)',
    ingredients: [{ name: 'rice', qty: 'idli batter, ~3 tbsp (rice part 30 g)', g: 30 }, { name: 'urad dal', qty: 'in the batter (10 g)', g: 10 }, { name: 'carrot', qty: '1 tbsp, finely grated', g: 15 }, { name: 'toor dal', qty: '2 tsp, for sambar (10 g)', g: 10 }, { name: 'bottle gourd', qty: '2 tbsp, diced', g: 25 }, { name: 'tomato', qty: '1 tbsp, chopped', g: 15 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: [], choking: ['Idli is soft enough to squash between finger and thumb — tear into strips', 'Remove curry leaves and any whole spice from the sambar before serving'],
    cuisine: 'Indian',
    steps: [
      'Stir finely grated carrot into fermented idli batter; steam in a mini-idli plate 10–12 min.',
      'For the sambar, pressure-cook toor dal with diced lauki, tomato and a pinch of turmeric until very soft (3 whistles).',
      'Mash the sambar, temper with ½ tsp ghee and a pinch of cumin. Leave out chilli, and use sambar powder only if it has no salt or chilli.',
      'Take her portion out before salting the family pot. Tear the idlis into strips and dip or pour the sambar over.',
    ],
    dos: ['Fermented batter is easy to digest, and cereal plus pulse makes good protein', 'Let her pick up the strips herself — self-feeding is the point at this age', 'Ghee in the tadka adds energy'],
    donts: ['No salt in her portion — keep salt at a bare minimum (≤ 2 g a day at 1–3 y)', 'No chilli or store sambar masala with salt', "Don't serve hard, day-old idli — steam it fresh"],
    source: ['iap16', 'icmr', 'nhssalt'],
  },
  {
    id: 'soft-ragi-dosa-curd', title: 'Soft Ragi Dosa Strips with Curd', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '1 small soft dosa (≈ 40 g flour) + 2 tbsp curd',
    ingredients: [{ name: 'ragi', qty: '2 tbsp flour (20 g)', g: 20 }, { name: 'suji', qty: '1 tbsp (15 g)', g: 15 }, { name: 'curd', qty: '2 tbsp in batter + 2 tbsp to dip', g: 60 }, { name: 'carrot', qty: '1 tbsp, finely grated', g: 15 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'dairy', 'vegs'], mddGroups: ['grains', 'dairy', 'vitA'], allergens: ['wheat', 'cow milk'], choking: ['Cook soft and pliable, not crisp — crisp dosa shatters into sharp shards', 'Cut into finger-length strips'],
    cuisine: 'Indian',
    steps: [
      'Whisk ragi flour, suji and 2 tbsp curd with water to a pourable batter; rest 10 min.',
      'Stir in finely grated carrot.',
      'Spread a small, slightly thick dosa on a low-heat tawa with ½ tsp ghee; cover and cook 2 min per side until set but soft.',
      'Cool, cut into strips and serve with plain curd to dip.',
    ],
    dos: ['Ragi is rich in calcium and iron, and ICMR-NIN suggests 20% of a child’s cereal come from millets', 'Covering the tawa keeps the dosa soft', 'Curd dip helps her self-feed'],
    donts: ['No salt in her portion', 'No sugar or jaggery — ragi and curd need neither', "Don't serve crisp or browned edges"],
    source: ['icmr', 'iap16', 'nhsbsl'],
  },
  {
    id: 'tomato-carrot-mini-uttapam', title: 'Tomato–Carrot Mini Uttapam', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '2 mini uttapams (≈ ¾ medium katori)',
    ingredients: [{ name: 'rice', qty: 'dosa batter, ~3 tbsp (rice part 30 g)', g: 30 }, { name: 'urad dal', qty: 'in the batter (10 g)', g: 10 }, { name: 'tomato', qty: '1 tbsp, deseeded, very finely chopped', g: 15 }, { name: 'carrot', qty: '1 tbsp, finely grated', g: 15 }, { name: 'onion', qty: '1 tsp, finely grated', g: 5 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: [], choking: ['Grate the vegetables and press them into the batter so they cook soft — no raw chunks on top', 'Cut into small wedges'],
    cuisine: 'Indian',
    steps: [
      'Pour small, thick rounds of dosa batter on a low-heat tawa.',
      'Scatter finely grated carrot, onion and deseeded tomato on top and press them in gently.',
      'Drizzle ½ tsp ghee, cover and cook 3 min; flip and cook 1 min until the vegetables are soft.',
      'Cool and cut into small wedges.',
    ],
    dos: ['Vitamin-A-rich carrot plus tomato in a food she can hold', 'Covering steams the topping soft', 'A good way to use leftover dosa batter'],
    donts: ['No salt in her portion', 'No green chilli', "Don't leave raw or crunchy vegetable pieces"],
    source: ['iap16', 'icmr', 'nhsbsl'],
  },
  {
    id: 'besan-palak-chilla', title: 'Besan–Palak Chilla Fingers', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '1 small chilla cut into 4–5 fingers (≈ 30 g besan)',
    ingredients: [{ name: 'besan', qty: '3 tbsp (30 g)', g: 30 }, { name: 'spinach', qty: '2 tbsp, blanched & finely chopped', g: 25 }, { name: 'tomato', qty: '1 tbsp, deseeded & finely chopped', g: 15 }, { name: 'curd', qty: '1 tbsp in batter', g: 20 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['pulses', 'vitA', 'otherFV'], allergens: ['cow milk'], choking: ['Cook through so the centre is not gummy', 'Finger-sized strips'],
    cuisine: 'Indian',
    steps: [
      'Blanch spinach 2 min, squeeze and chop very fine.',
      'Whisk besan with curd, water and a pinch of turmeric to a smooth, thick-pouring batter; fold in spinach and tomato.',
      'Spread a small, thin chilla on a greased tawa over low heat; cover and cook 2 min per side until cooked through but soft.',
      'Cool and cut into fingers.',
    ],
    dos: ['Pulse plus dark leafy greens, with tomato vitamin C to help the iron absorb', 'An egg-free, high-protein breakfast', 'Blanching spinach first is kinder to tummies'],
    donts: ['No salt or ajwain-salt mix in her portion', 'No green chilli', "Don't undercook — raw besan is hard to digest"],
    source: ['icmr', 'who', 'nhsbsl'],
  },
  {
    id: 'veg-poha-ground-peanut', title: 'Veg Poha with Ground Peanut', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 12,
    texture: 'family', portion: '¾ medium katori (≈ 40 g poha, raw)',
    ingredients: [{ name: 'poha', qty: '4 tbsp thin poha (40 g)', g: 40 }, { name: 'peas', qty: '1 tbsp, cooked & squashed', g: 15 }, { name: 'carrot', qty: '1 tbsp, finely grated', g: 15 }, { name: 'peanut', qty: '1 tsp, roasted & ground to powder', g: 5 }, { name: 'lemon', qty: 'a few drops', g: 2 }, { name: 'oil', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'nuts'], mddGroups: ['grains', 'vitA', 'otherFV'], allergens: ['peanut'], choking: ['NEVER whole peanuts (the usual poha topping) — grind to a powder', 'Squash each pea', 'Remove curry leaves and mustard seeds if she gags on them'],
    cuisine: 'Indian',
    steps: [
      'Rinse thin poha until soft; drain.',
      'Soften grated carrot and cooked peas in 1 tsp oil with a pinch of turmeric and cumin, 2 min.',
      'Fold in the poha with a splash of water, cover and steam 2–3 min until very soft.',
      'Off the heat, stir in the ground peanut and a few drops of lemon. Squash any whole peas.',
    ],
    dos: ['Ground peanut keeps regular peanut exposure going in a choking-safe form', 'Lemon’s vitamin C helps the iron in poha absorb', 'Thin poha softens fully'],
    donts: ['Whole or halved peanuts are a choking risk under 5 — powder only', 'No salt or sugar in her portion (family poha often has both)', 'No sev or namkeen topping'],
    source: ['nhsbsl', 'icmr', 'whopaho'],
  },
  {
    id: 'paneer-paratha-fingers', title: 'Soft Paneer Paratha Fingers', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 20,
    texture: 'family', portion: '1 small paratha (≈ 30 g atta) + 2 tbsp curd',
    ingredients: [{ name: 'wheat flour', qty: '3 tbsp atta (30 g)', g: 30 }, { name: 'paneer', qty: '2 tbsp, finely crumbled (25 g)', g: 25 }, { name: 'coriander', qty: '1 tsp, very finely chopped', g: 2 }, { name: 'curd', qty: '2 tbsp, to dip', g: 40 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'dairy', 'spices'], mddGroups: ['grains', 'dairy'], allergens: ['wheat', 'cow milk'], choking: ['Crumble paneer fine — no cubes', 'Roll thin and cook soft; tear into strips'],
    cuisine: 'Indian',
    steps: [
      'Knead atta with water to a soft dough; rest 10 min.',
      'Mix finely crumbled fresh paneer with a pinch of cumin powder and chopped coriander.',
      'Stuff a small ball of dough, roll gently thin, and cook on a medium tawa with a little ghee until soft-cooked on both sides.',
      'Cool, cut into fingers, and serve with curd.',
    ],
    dos: ['Protein and calcium from paneer in a food she can hold', 'Fresh homemade paneer is softest', 'Curd makes the strips easier to chew'],
    donts: ['No salt in her portion', 'No green chilli or ajwain-heavy stuffing', "Don't make it crisp — keep it soft"],
    source: ['iap16', 'icmr', 'nhs'],
  },
  {
    id: 'egg-bhurji-soft-roti', title: 'Soft Egg Bhurji with Roti', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 12,
    texture: 'family', portion: '1 egg bhurji (≈ ½ medium katori) + ½ soft roti',
    ingredients: [{ name: 'egg', qty: '1, beaten', g: 50 }, { name: 'tomato', qty: '1 tbsp, deseeded & finely chopped', g: 15 }, { name: 'onion', qty: '1 tsp, finely grated', g: 5 }, { name: 'wheat flour', qty: '½ roti (15 g atta)', g: 15 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['nonveg', 'vegs', 'grains', 'dairy'], mddGroups: ['eggs', 'grains', 'otherFV'], allergens: ['egg', 'wheat'], choking: ['Scramble into soft, small curds — no rubbery sheets', 'Tear the roti into strips'],
    cuisine: 'Indian',
    steps: [
      'Soften grated onion and tomato in 1 tsp ghee with a pinch of turmeric, 2 min.',
      'Pour in the beaten egg and stir on low heat until fully set — no runny egg.',
      'Break into small, soft curds.',
      'Serve with soft roti strips. Take her share out before any salt or chilli goes into the family pan.',
    ],
    dos: ['Egg is an animal-source food, which WHO advises daily (meat, fish or egg)', 'Cook until both white and yolk are set', 'Keep offering egg regularly once it is tolerated'],
    donts: ['Never runny or undercooked egg', 'No salt or green chilli in her portion', 'Hidden unless the diet preference includes egg'],
    source: ['who', 'nhs', 'icmr'],
  },
  {
    id: 'ragi-oats-milk-porridge-pear', title: 'Ragi–Oats Milk Porridge with Pear', slot: 'breakfast', minAgeMonths: 12, prepMinutes: 12,
    texture: 'family', portion: '¾ medium katori (uses ~100 ml of her daily milk)',
    ingredients: [{ name: 'ragi', qty: '1 tbsp flour (12 g)', g: 12 }, { name: 'oats', qty: '1 tbsp (12 g)', g: 12 }, { name: 'milk', qty: '½ cup whole milk (100 ml)', g: 100 }, { name: 'pear', qty: '2 tbsp, ripe, peeled, soft-diced', g: 25 }],
    foodGroups: ['grains', 'dairy', 'fruits'], mddGroups: ['grains', 'dairy', 'otherFV'], allergens: ['cow milk'], choking: ['Use very ripe pear or stew it soft; dice small'],
    cuisine: 'Indian',
    steps: [
      'Whisk ragi flour into ½ cup water with no lumps; add oats.',
      'Cook on low, stirring, 5 min; add ½ cup whole milk and simmer 2 min more.',
      'Fold in soft-diced ripe pear (stew it 3 min first if it is firm).',
      'Cool to warm. Leave it thick enough to scoop with a spoon or fingers.',
    ],
    dos: ['From 12 m cow’s milk can be cooked in freely — count it toward her daily milk', 'Pear sweetens with no added sugar', 'Two whole grains in one bowl'],
    donts: ['No sugar, jaggery or honey — all count as added sugar before 2', 'Count this milk toward the ~500 ml daily ceiling', 'No flavoured "health drink" powders (added sugar)'],
    source: ['who', 'icmr', 'her'],
  },

  // ─────────────────────────── LUNCH ───────────────────────────
  {
    id: 'dal-chawal-lauki-sabzi', title: 'Dal–Chawal with Lauki Sabzi', slot: 'lunch', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '¾–1 medium katori dal-chawal + 2 tbsp sabzi',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'toor dal', qty: '1 tbsp (15 g)', g: 15 }, { name: 'bottle gourd', qty: '¼ small katori, diced (35 g)', g: 35 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'ghee', qty: '1½ tsp', g: 7 }, { name: 'cumin', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'vegs', 'dairy', 'spices'], mddGroups: ['grains', 'pulses', 'otherFV'], allergens: [], choking: ['Rice cooked soft enough to squash; mash lightly if she is still gumming', 'Lauki cooked until it falls apart'],
    cuisine: 'Indian',
    steps: [
      'Cook rice soft. Pressure-cook toor dal with tomato and turmeric until creamy.',
      'For the sabzi, cook diced lauki with a pinch of cumin in ½ tsp ghee, covered, until very soft.',
      'Temper the dal with 1 tsp ghee and cumin. Take her portion out before salt or chilli.',
      'Serve rice with dal poured over and the lauki alongside; mash together lightly if needed.',
    ],
    dos: ['The family plate, adapted — cereal plus pulse in about a 3:1 ratio', 'Rice and dal are soft enough for four teeth', 'Let her eat with her fingers or a spoon'],
    donts: ['No salt in her portion (≤ 2 g/day total at 1–3 y)', 'No red chilli or garam masala', 'Taste the lauki raw first and throw it out if it is bitter'],
    source: ['icmr', 'iap16', 'nhssalt'],
  },
  {
    id: 'toddler-veg-khichdi', title: 'Toddler Veg Khichdi', slot: 'lunch', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '¾–1 medium katori',
    ingredients: [{ name: 'rice', qty: '3 tbsp (30 g)', g: 30 }, { name: 'moong dal', qty: '1 tbsp (15 g)', g: 15 }, { name: 'carrot', qty: '2 tbsp, diced small', g: 20 }, { name: 'beans', qty: '1 tbsp, finely chopped', g: 15 }, { name: 'peas', qty: '1 tbsp', g: 10 }, { name: 'ghee', qty: '1½ tsp', g: 7 }, { name: 'cumin', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'vegs', 'dairy', 'spices'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: [], choking: ['Cook until the vegetables mash between finger and thumb', 'Squash peas'],
    cuisine: 'Indian',
    steps: [
      'Wash rice and moong dal; soak 15 min.',
      'Temper cumin in 1 tsp ghee, add diced carrot, beans and peas, stir 1 min.',
      'Add rice, dal, a pinch of turmeric and 2½ cups water; pressure-cook 4 whistles.',
      'Stir to a soft, spoonable texture with some small soft pieces. Top with ½ tsp ghee.',
    ],
    dos: ['Now a textured khichdi with soft pieces, not a purée — texture helps her learn to chew', 'Three vegetables, one pot', 'Ghee adds energy for a busy toddler'],
    donts: ['No salt in her portion', 'Remove any whole spice (bay leaf, clove, peppercorn)', 'Serve fresh; do not re-heat twice'],
    source: ['whopaho', 'iap16', 'icmr'],
  },
  {
    id: 'dal-palak-roti', title: 'Dal Palak with Soft Roti', slot: 'lunch', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '½ medium katori dal palak + 1 small roti in strips',
    ingredients: [{ name: 'moong dal', qty: '1 tbsp (15 g)', g: 15 }, { name: 'spinach', qty: '¼ big katori, blanched (25 g)', g: 25 }, { name: 'tomato', qty: '2 tbsp (35 g)', g: 35 }, { name: 'wheat flour', qty: '1 small roti (40 g atta)', g: 40 }, { name: 'ghee', qty: '1½ tsp', g: 7 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: ['wheat'], choking: ['Tear roti into strips and dunk them in dal to soften', 'Chop spinach finely — long leaf strands can make her gag'],
    cuisine: 'Indian',
    steps: [
      'Pressure-cook moong dal with tomato and turmeric until soft.',
      'Blanch spinach 2 min, chop fine, stir into the dal and simmer 3 min.',
      'Temper with ghee and cumin. Take her portion out before salting.',
      'Make a thin, soft roti, brush with ghee, and tear into strips to dip.',
    ],
    dos: ['Dark leafy greens (vitamin A and iron) plus tomato vitamin C', 'Roti strips are a good self-feeding food', 'Matches the ICMR-NIN 1–3 y lunch pattern (cereal + pulse + greens + tomato + oil)'],
    donts: ['No salt in her portion', "Don't skip blanching the spinach", 'No chilli'],
    source: ['icmr', 'iap16', 'nhsbsl'],
  },
  {
    id: 'rajma-chawal-mashed', title: 'Rajma–Chawal, Toddler Style', slot: 'lunch', minAgeMonths: 12, prepMinutes: 40,
    texture: 'family', portion: '¾ medium katori rice + 2 tbsp mashed rajma + 1 tbsp curd',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'rajma', qty: '1 tbsp dry, soaked overnight (15 g)', g: 15 }, { name: 'tomato', qty: '2 tbsp, puréed', g: 35 }, { name: 'onion', qty: '1 tsp, grated', g: 5 }, { name: 'curd', qty: '1 tbsp', g: 20 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'dairy', 'otherFV'], allergens: ['cow milk'], choking: ['Squash EVERY bean — a whole kidney bean is the right size to choke on', 'Rajma must be very soft; mash to a coarse paste'],
    cuisine: 'Indian',
    steps: [
      'Soak rajma 8–10 h, drain, and pressure-cook in fresh water until completely soft (6–8 whistles).',
      'Cook grated onion and puréed tomato in ghee until jammy; add the rajma and simmer 5 min.',
      'Take her portion out before salt or chilli; mash the beans to a coarse paste.',
      'Serve over soft rice with a spoon of curd.',
    ],
    dos: ['Kidney beans for protein and iron; curd cools and adds calcium', 'Use soaked, fully cooked dry rajma, not canned (salty)', 'Start with small amounts — beans can cause gas'],
    donts: ['Never undercooked rajma — raw or undercooked kidney beans are unsafe', 'No whole beans', 'No salt or garam masala in her portion'],
    source: ['icmr', 'nhsbsl', 'who'],
  },
  {
    id: 'chana-sweet-potato-rice', title: 'Soft Chana & Sweet Potato with Rice', slot: 'lunch', minAgeMonths: 12, prepMinutes: 40,
    texture: 'family', portion: '¾ medium katori (rice + 2 tbsp chana-shakarkandi mash)',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'chana', qty: '1 tbsp dry kabuli chana, soaked (15 g)', g: 15 }, { name: 'sweet potato', qty: '2 tbsp, diced (35 g)', g: 35 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'ghee', qty: '1 tsp', g: 5 }, { name: 'cumin', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'vegs', 'dairy', 'spices'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: [], choking: ['Squash every chickpea flat — whole chana is on the app’s choking list', 'Peel chickpea skins if she gags on them'],
    cuisine: 'Indian',
    steps: [
      'Soak kabuli chana overnight; pressure-cook until it squashes easily (7–8 whistles).',
      'Steam diced sweet potato until soft.',
      'Cook tomato in ghee with cumin and turmeric; add chana and sweet potato, mash together coarsely.',
      'Serve with soft rice. Take her share out before salt or chole masala.',
    ],
    dos: ['Orange sweet potato is rich in vitamin A', 'Pulses are what WHO names when meat, fish or egg are limited', 'Squashing is quick — press with the back of a fork'],
    donts: ['No roasted or whole chana (choking)', 'No salt or packaged chole masala in her portion', 'Introduce slowly — chana can cause gas'],
    source: ['who', 'nhsbsl', 'icmr'],
  },
  {
    id: 'thayir-sadam-veg', title: 'Veg Curd Rice (Thayir Sadam)', slot: 'lunch', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '¾ medium katori',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g), cooked very soft', g: 40 }, { name: 'curd', qty: '3 tbsp, fresh (60 g)', g: 60 }, { name: 'carrot', qty: '1 tbsp, grated & steamed', g: 15 }, { name: 'cucumber', qty: '1 tbsp, peeled & finely grated', g: 15 }, { name: 'ghee', qty: '½ tsp, for tempering', g: 3 }],
    foodGroups: ['grains', 'dairy', 'vegs'], mddGroups: ['grains', 'dairy', 'vitA', 'otherFV'], allergens: ['cow milk'], choking: ['Grate cucumber finely — no raw chunks', 'Leave out whole curry leaves, urad dal and mustard seeds from the tempering, or strain them'],
    cuisine: 'Indian',
    steps: [
      'Cook rice very soft and mash lightly; cool to room temperature.',
      'Mix in fresh curd, steamed grated carrot and finely grated cucumber.',
      'Temper a pinch of cumin in ½ tsp ghee and pour it over (strain out any whole seeds she cannot manage).',
      'Serve at room temperature.',
    ],
    dos: ['Cooling, probiotic, a summer staple in Jamshedpur heat', 'Counts toward the ICMR-NIN 350 ml a day of milk/curd', 'Two vegetables slipped in'],
    donts: ['No salt in her portion', "Don't heat the curd", "Don't serve fridge-cold"],
    source: ['icmr', 'iap16', 'nhsbsl'],
  },
  {
    id: 'rohu-fish-curry-rice', title: 'Rohu Fish Curry with Rice', slot: 'lunch', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '¾ medium katori rice + 1 tbsp flaked fish (≈ 25 g) in gravy',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'rohu fish', qty: '1 small piece, deboned (25 g)', g: 25 }, { name: 'tomato', qty: '2 tbsp, puréed', g: 35 }, { name: 'bottle gourd', qty: '2 tbsp, diced', g: 25 }, { name: 'oil', qty: '1 tsp mustard oil, well heated', g: 5 }, { name: 'turmeric', qty: 'a pinch', g: 1 }],
    foodGroups: ['grains', 'nonveg', 'vegs', 'spices'], mddGroups: ['grains', 'flesh', 'otherFV'], allergens: ['fish'], choking: ['Rohu has many fine Y-bones — flake by hand and check twice', 'Take the flesh from the thick middle cut, which has fewer small bones'],
    cuisine: 'Indian (Bengal/Jharkhand)',
    steps: [
      'Rub the fish with turmeric; poach it in the gravy rather than frying.',
      'Cook puréed tomato and diced lauki in heated oil with turmeric until soft; add water and simmer the fish 6–8 min until it flakes.',
      'Lift out her piece, flake it with your fingers and remove every bone.',
      'Mash the flaked fish and lauki into soft rice with a little gravy. Take her portion out before salt or chilli.',
    ],
    dos: ['Low-mercury freshwater fish — fish gives long-chain omega-3 (ICMR-NIN: fatty fish is the richest source)', 'Matches the ICMR-NIN 1–3 y chart (25 g fish instead of pulse)', 'The local jhol, made mild'],
    donts: ['Never high-mercury fish (seer/surmai, shark, king mackerel)', 'No bones — check by hand, twice', 'Hidden unless the diet preference includes fish'],
    source: ['icmr', 'nhsbsl', 'who'],
  },
  {
    id: 'aloo-gobhi-matar-roti', title: 'Aloo–Gobhi–Matar with Roti', slot: 'lunch', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '½ medium katori sabzi + 1 small roti + 2 tbsp curd',
    ingredients: [{ name: 'potato', qty: '2 tbsp, diced (30 g)', g: 30 }, { name: 'cauliflower', qty: '2 tbsp small florets (30 g)', g: 30 }, { name: 'peas', qty: '1 tbsp', g: 10 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'wheat flour', qty: '1 small roti (40 g atta)', g: 40 }, { name: 'curd', qty: '2 tbsp', g: 40 }, { name: 'ghee', qty: '1½ tsp', g: 7 }],
    foodGroups: ['vegs', 'grains', 'dairy'], mddGroups: ['grains', 'dairy', 'otherFV'], allergens: ['wheat', 'cow milk'], choking: ['Cook cauliflower until a floret squashes flat — no firm stems', 'Squash peas; cut potato small'],
    cuisine: 'Indian',
    steps: [
      'Cook diced potato, small cauliflower florets and peas with tomato, turmeric and a splash of water, covered, until very soft.',
      'Take her portion out before salt, chilli or amchur.',
      'Mash lightly so the pieces hold together.',
      'Serve with roti strips and a spoon of curd.',
    ],
    dos: ['A classic sabzi, cooked a little softer than the adults’ version', 'Curd on the side adds dairy and moisture', 'Cauliflower adds variety — a different vegetable family'],
    donts: ['No salt or chilli in her portion', "Don't serve dry, stir-fried, crunchy pieces", 'Hold back amchur and garam masala for her'],
    source: ['nhsbsl', 'icmr', 'iap16'],
  },

  // ─────────────────────────── DINNER ───────────────────────────
  {
    id: 'veg-dalia-khichdi', title: 'Savoury Vegetable Dalia Khichdi', slot: 'dinner', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '¾–1 medium katori',
    ingredients: [{ name: 'dalia', qty: '3 tbsp (35 g)', g: 35 }, { name: 'moong dal', qty: '2 tsp (10 g)', g: 10 }, { name: 'pumpkin', qty: '2 tbsp, diced', g: 25 }, { name: 'beans', qty: '1 tbsp, finely chopped', g: 15 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: ['wheat'], choking: ['Cook dalia until each grain is soft and swollen', 'Chop beans finely'],
    cuisine: 'Indian',
    steps: [
      'Dry-roast dalia 2 min in ½ tsp ghee.',
      'Add moong dal, diced pumpkin, beans, tomato, turmeric and 2 cups water.',
      'Pressure-cook 4–5 whistles until very soft.',
      'Stir to a soft, textured porridge; finish with ½ tsp ghee. Take her portion out before salting.',
    ],
    dos: ['Whole-grain wheat with fibre, plus pulse', 'Pumpkin is vitamin-A rich', 'Light and filling for dinner'],
    donts: ['No salt in her portion', 'Skip if there is a known wheat reaction', "Don't serve it watery — thick enough to hold on a spoon"],
    source: ['icmr', 'whopaho', 'iap16'],
  },
  {
    id: 'paneer-bhurji-roti', title: 'Paneer–Tomato Bhurji with Roti', slot: 'dinner', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '½ medium katori bhurji + 1 small roti',
    ingredients: [{ name: 'paneer', qty: '3 tbsp, crumbled (30 g)', g: 30 }, { name: 'tomato', qty: '2 tbsp (35 g)', g: 35 }, { name: 'peas', qty: '1 tbsp', g: 10 }, { name: 'wheat flour', qty: '1 small roti (40 g atta)', g: 40 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['dairy', 'vegs', 'grains'], mddGroups: ['dairy', 'grains', 'otherFV'], allergens: ['cow milk', 'wheat'], choking: ['Crumble paneer small; keep it moist', 'Squash peas'],
    cuisine: 'Indian',
    steps: [
      'Cook chopped tomato and peas in ghee with turmeric until soft and saucy.',
      'Crumble in fresh paneer; warm through 2 min with a splash of water so it stays soft.',
      'Take her share out before salt or chilli; squash the peas.',
      'Serve with roti strips.',
    ],
    dos: ['Quick vegetarian protein and calcium', 'Soft, moist bhurji is easy on four teeth', 'Paneer made from whole milk'],
    donts: ['No salt in her portion', "Don't overcook — paneer turns rubbery", 'Avoid market paneer with additives when you can'],
    source: ['icmr', 'nhsbsl', 'iap16'],
  },
  {
    id: 'methi-thepla-curd', title: 'Soft Methi Thepla with Curd', slot: 'dinner', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '1 small thepla + 3 tbsp curd',
    ingredients: [{ name: 'wheat flour', qty: '3 tbsp atta (30 g)', g: 30 }, { name: 'besan', qty: '1 tbsp (10 g)', g: 10 }, { name: 'methi', qty: '2 tbsp fresh leaves, finely chopped (25 g)', g: 25 }, { name: 'curd', qty: '1 tbsp in dough + 3 tbsp to dip', g: 80 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'dairy', 'vitA'], allergens: ['wheat', 'cow milk'], choking: ['Roll thin and cook soft (not the dry travel thepla)', 'Chop methi very finely'],
    cuisine: 'Indian (Gujarati)',
    steps: [
      'Knead atta, besan, finely chopped methi, a pinch of turmeric and curd into a soft dough.',
      'Roll small, thin theplas.',
      'Cook on a medium tawa with a little ghee until soft-cooked with light spots.',
      'Cut into strips; serve with curd.',
    ],
    dos: ['Methi is a dark leafy green — ICMR-NIN lists methi roti as an everyday way to add greens', 'Curd softens each bite', 'A good make-ahead dinner (fresh the same day)'],
    donts: ['No salt, sugar or chilli in her dough', "Don't serve crisp, dry theplas", 'Use fresh methi, not kasuri methi in quantity (bitter)'],
    source: ['icmr', 'iap16', 'nhsbsl'],
  },
  {
    id: 'soft-egg-curry-rice', title: 'Mild Egg Curry with Rice', slot: 'dinner', minAgeMonths: 12, prepMinutes: 25,
    texture: 'family', portion: '½ egg, chopped, in 3 tbsp gravy + ¾ medium katori rice',
    ingredients: [{ name: 'egg', qty: '½ hard-boiled, chopped small (25 g)', g: 25 }, { name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'tomato', qty: '2 tbsp, puréed', g: 35 }, { name: 'onion', qty: '1 tsp, grated', g: 5 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['nonveg', 'grains', 'vegs', 'dairy'], mddGroups: ['eggs', 'grains', 'otherFV'], allergens: ['egg'], choking: ['Chop the boiled egg small — never a whole or halved egg', 'Mash the yolk into the gravy so it is not dry'],
    cuisine: 'Indian',
    steps: [
      'Boil an egg 10 min until fully firm; cool, peel and chop small.',
      'Cook grated onion and puréed tomato in ghee with turmeric until jammy; add water and simmer to a thin gravy.',
      'Take her portion out before salt or chilli; stir in the chopped egg.',
      'Serve over soft rice.',
    ],
    dos: ['Matches the ICMR-NIN 1–3 y chart ("egg ½")', 'Both white and yolk cooked firm', 'Egg gives iron and vitamin B12, which vegetarian diets can run short of'],
    donts: ['No runny yolk', 'No salt or garam masala in her portion', 'Hidden unless the diet preference includes egg'],
    source: ['icmr', 'who', 'nhs'],
  },
  {
    id: 'sambar-rice-veg', title: 'Sambar Rice with Pumpkin & Carrot', slot: 'dinner', minAgeMonths: 12, prepMinutes: 30,
    texture: 'family', portion: '¾–1 medium katori',
    ingredients: [{ name: 'rice', qty: '4 tbsp raw (40 g)', g: 40 }, { name: 'toor dal', qty: '1 tbsp (15 g)', g: 15 }, { name: 'pumpkin', qty: '2 tbsp, diced', g: 25 }, { name: 'carrot', qty: '1 tbsp, diced', g: 15 }, { name: 'tomato', qty: '1 tbsp', g: 15 }, { name: 'ghee', qty: '1½ tsp', g: 7 }],
    foodGroups: ['grains', 'vegs', 'dairy'], mddGroups: ['grains', 'pulses', 'vitA', 'otherFV'], allergens: [], choking: ['Remove curry leaves, dried red chilli and any tamarind fibre', 'Vegetables cooked until they fall apart'],
    cuisine: 'Indian (South)',
    steps: [
      'Pressure-cook rice and toor dal together with diced pumpkin, carrot, tomato and turmeric (4–5 whistles).',
      'Mash to a soft, textured consistency.',
      'Temper a pinch of cumin in ghee (no chilli) and stir in.',
      'Take her portion out before salt or sambar powder.',
    ],
    dos: ['A one-pot bisi-bele-style dinner with two vitamin-A vegetables', 'Easy to batch-cook for the family'],
    donts: ['No salt or chilli-sambar powder in her portion', "Don't leave hard drumstick pieces", 'Serve fresh'],
    source: ['icmr', 'iap16', 'whopaho'],
  },
  {
    id: 'moong-chilla-paneer', title: 'Moong Dal Chilla with Paneer', slot: 'dinner', minAgeMonths: 12, prepMinutes: 20,
    texture: 'family', portion: '1 small chilla with 1 tbsp paneer, in strips',
    ingredients: [{ name: 'moong dal', qty: '2 tbsp, soaked & ground (25 g)', g: 25 }, { name: 'paneer', qty: '1 tbsp, crumbled (15 g)', g: 15 }, { name: 'carrot', qty: '1 tbsp, finely grated', g: 15 }, { name: 'coriander', qty: '1 tsp, finely chopped', g: 2 }, { name: 'ghee', qty: '1 tsp', g: 5 }],
    foodGroups: ['grains', 'dairy', 'vegs', 'spices'], mddGroups: ['pulses', 'dairy', 'vitA'], allergens: ['cow milk'], choking: ['Cook soft, not crisp', 'Crumble paneer fine'],
    cuisine: 'Indian',
    steps: [
      'Soak moong dal 3 h; grind with a little water to a smooth batter.',
      'Stir in grated carrot, coriander and a pinch of turmeric.',
      'Spread a small chilla on a low tawa with ghee; sprinkle crumbled paneer, cover and cook until set; fold over.',
      'Cool and cut into strips.',
    ],
    dos: ['High-protein vegetarian dinner — pulse plus dairy', 'Soaked, ground moong is gentle on the tummy', 'Good finger food'],
    donts: ['No salt or green chilli in her portion', "Don't let it brown crisp", 'Serve fresh'],
    source: ['icmr', 'nhsbsl', 'who'],
  },

  // ─────────────────────────── SNACK ───────────────────────────
  {
    id: 'soft-fruit-bowl-quartered', title: 'Soft Fruit Bowl', slot: 'snack', minAgeMonths: 12, prepMinutes: 5,
    texture: 'family', portion: '½ medium katori (≈ 50–75 g fruit)',
    ingredients: [{ name: 'banana', qty: '¼, sliced into soft pieces', g: 25 }, { name: 'papaya', qty: '2 tbsp ripe, diced', g: 25 }, { name: 'grapes', qty: '3, QUARTERED lengthways', g: 15 }],
    foodGroups: ['fruits'], mddGroups: ['vitA', 'otherFV'], allergens: [], choking: ['QUARTER grapes — never whole, and halving is not enough', 'Ripe, soft fruit only; peel and seed'],
    cuisine: 'Indian',
    steps: [
      'Dice ripe papaya and banana into soft, small pieces.',
      'Quarter each grape lengthways (cut into 4).',
      'Serve in a bowl for her to pick up with her fingers.',
    ],
    dos: ['Ripe papaya is vitamin-A rich', 'Whole fruit instead of juice — WHO says limit 100% juice', 'Good practice for her pincer grasp'],
    donts: ['No chaat masala or salt', 'No sugar or honey drizzle', 'Always seated and supervised while eating'],
    source: ['nhsbsl', 'who', 'icmr'],
  },
  {
    id: 'ragi-banana-mini-pancakes', title: 'Ragi–Banana Mini Pancakes', slot: 'snack', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '3 mini pancakes (≈ ½ medium katori)',
    ingredients: [{ name: 'ragi', qty: '2 tbsp flour (20 g)', g: 20 }, { name: 'banana', qty: '½ ripe, mashed', g: 40 }, { name: 'curd', qty: '1 tbsp', g: 20 }, { name: 'ghee', qty: '½ tsp', g: 3 }],
    foodGroups: ['grains', 'fruits', 'dairy'], mddGroups: ['grains', 'otherFV'], allergens: ['cow milk'], choking: ['Soft, spongy — squashes between finger and thumb'],
    cuisine: 'Indian',
    steps: [
      'Mash ripe banana; whisk in ragi flour, curd and a splash of water to a thick batter.',
      'Drop spoonfuls onto a low-heat greased tawa; cover and cook 2 min per side until set through.',
      'Cool before serving.',
    ],
    dos: ['Banana sweetens with no added sugar', 'Egg-free, so it suits every diet preference', 'Easy to hold'],
    donts: ['No sugar, jaggery or honey', "Don't cook on high heat — the outside burns before the middle sets", 'Serve the same day'],
    source: ['icmr', 'who', 'nhsbsl'],
  },
  {
    id: 'steamed-veg-sticks-chana-til-dip', title: 'Steamed Veg Sticks with Chana–Til Dip', slot: 'snack', minAgeMonths: 12, prepMinutes: 20,
    texture: 'family', portion: '4–5 soft sticks + 2 tbsp dip',
    ingredients: [{ name: 'carrot', qty: '3–4 batons, steamed soft', g: 30 }, { name: 'sweet potato', qty: '2 batons, steamed soft', g: 25 }, { name: 'chana', qty: '2 tbsp cooked kabuli chana, puréed', g: 30 }, { name: 'sesame', qty: '½ tsp, ground (til paste)', g: 3 }, { name: 'curd', qty: '1 tbsp, to loosen', g: 20 }, { name: 'lemon', qty: 'a few drops', g: 2 }],
    foodGroups: ['vegs', 'grains', 'nuts', 'dairy'], mddGroups: ['vitA', 'pulses', 'dairy'], allergens: ['sesame', 'cow milk'], choking: ['Steam carrot until a baton squashes between finger and thumb — raw carrot is a named choking food', 'Batons about finger size, not coins'],
    cuisine: 'Indian-fusion',
    steps: [
      'Steam carrot and sweet potato batons 8–10 min until very soft.',
      'Purée cooked chana with ground sesame, curd and a few drops of lemon to a smooth dip.',
      'Serve the soft batons with the dip.',
    ],
    dos: ['Sesame is an allergen worth keeping in her diet regularly once tolerated', 'Two vitamin-A vegetables', 'Dipping is good fine-motor practice'],
    donts: ['Never raw carrot sticks at this age', 'No salt in the dip', 'No whole sesame seeds sprinkled on top — use ground'],
    source: ['whopaho', 'nhsbsl', 'icmr'],
  },
  {
    id: 'sweet-potato-jeera-bites', title: 'Sweet Potato Jeera Bites', slot: 'snack', minAgeMonths: 12, prepMinutes: 15,
    texture: 'family', portion: '½ medium katori soft cubes',
    ingredients: [{ name: 'sweet potato', qty: '½ small, cubed (50 g)', g: 50 }, { name: 'ghee', qty: '½ tsp', g: 3 }, { name: 'cumin', qty: 'a pinch, roasted & ground', g: 1 }, { name: 'lemon', qty: 'a few drops', g: 2 }],
    foodGroups: ['vegs', 'dairy', 'spices'], mddGroups: ['vitA'], allergens: [], choking: ['Steam until fork-soft; cubes no bigger than a fingertip, or thick fingers she can bite'],
    cuisine: 'Indian',
    steps: [
      'Steam sweet potato cubes 10 min until very soft.',
      'Toss in warm ghee with ground roasted cumin and a few drops of lemon.',
      'Cool and serve.',
    ],
    dos: ['Shakarkandi chaat without the salt and chaat masala', 'Vitamin A plus a little fat to absorb it', 'Naturally sweet'],
    donts: ['No chaat masala or black salt (both salty)', "Don't roast crisp", 'No sugar'],
    source: ['icmr', 'nhssalt', 'nhsbsl'],
  },
  {
    id: 'curd-papaya-nut-dust', title: 'Curd with Papaya & Almond Dust', slot: 'snack', minAgeMonths: 12, prepMinutes: 5,
    texture: 'family', portion: '½ medium katori',
    ingredients: [{ name: 'curd', qty: '4 tbsp full-fat (80 g)', g: 80 }, { name: 'papaya', qty: '2 tbsp ripe, mashed', g: 25 }, { name: 'almond', qty: '1 tsp, ground to a fine powder', g: 5 }],
    foodGroups: ['dairy', 'fruits', 'nuts'], mddGroups: ['dairy', 'vitA'], allergens: ['cow milk', 'tree nut'], choking: ['Almond ground to a FINE powder — never whole, halved or slivered'],
    cuisine: 'Indian',
    steps: [
      'Whisk fresh full-fat curd smooth.',
      'Fold in mashed ripe papaya.',
      'Dust with finely ground almond. Serve at room temperature.',
    ],
    dos: ['Keeps regular tree-nut exposure going in a safe form', 'Full-fat dairy until 2', 'Papaya sweetens — no sugar needed'],
    donts: ['No whole or chopped nuts (choking risk under 5)', 'No sugar, jaggery or honey', "Don't use flavoured or sweetened yoghurt"],
    source: ['nhsbsl', 'nhs', 'icmr'],
  },
  {
    id: 'jeera-chaas', title: 'Plain Jeera Chaas', slot: 'snack', minAgeMonths: 12, prepMinutes: 3,
    texture: 'family', portion: '¼–½ cup (50–100 ml) in an open cup, with a meal or snack',
    ingredients: [{ name: 'buttermilk', qty: '2 tbsp curd whisked into ¼ cup water', g: 40 }, { name: 'cumin', qty: 'a pinch, roasted & ground', g: 1 }],
    foodGroups: ['dairy', 'spices'], mddGroups: ['dairy'], allergens: ['cow milk'], choking: [],
    cuisine: 'Indian',
    steps: [
      'Whisk 2 tbsp fresh curd with ¼ cup water until smooth.',
      'Add a pinch of roasted ground cumin.',
      'Serve in an open or free-flow cup.',
    ],
    dos: ['Open-cup practice — NHS advises moving off bottles after 1', 'Hydrating in hot weather', 'Counts toward ICMR-NIN milk/curd'],
    donts: ['No salt or black salt (adult chaas is usually salted)', 'No sugar (no sweet lassi before 2)', 'Not a replacement for water or breast milk'],
    source: ['nhs', 'icmr', 'who'],
  },
];

// ── Food-icon map — ingredient base name → { icon: zif-* sprite id, c: food
// colour } (WIRING_PLAN §7 zif sub-system; colours from the ratified
// docs/design/taglines.mjs EP bank + gen-hero.mjs). The zif sprite (97 symbols)
// lives in template.html; flesh uses currentColor so the consumer sets the hue
// via a --zif-c custom property (the established diet.js dynamic-colour idiom).
// Lookup is LONGEST-KEY-FIRST so "moong dal"→dal, "rohu fish"→fish, "sweet
// potato"→sweetpotato resolve before their shorter substrings.
const FOOD_ICON = {
  // grains & cereals
  rice: { icon: 'rice', c: '#d8c79f' }, ragi: { icon: 'millet', c: '#b06a44' },
  oats: { icon: 'oats', c: '#d4bb7c' }, wheat: { icon: 'wheat', c: '#d9a945' },
  bread: { icon: 'wheat', c: '#d9a945' }, suji: { icon: 'suji', c: '#e7dcc2' },
  poha: { icon: 'suji', c: '#e7dcc2' }, dalia: { icon: 'dalia', c: '#d8c0a0' },
  barley: { icon: 'barley', c: '#d6c486' }, quinoa: { icon: 'quinoa', c: '#d2b288' },
  corn: { icon: 'corn', c: '#ecc84e' },
  // dals & legumes
  'moong dal': { icon: 'dal', c: '#9bb24a' }, 'toor dal': { icon: 'dal', c: '#e8bd4e' },
  'masoor dal': { icon: 'dal', c: '#d98a55' }, 'chana dal': { icon: 'dal', c: '#cda05c' },
  'urad dal': { icon: 'dal', c: '#7a7066' }, dal: { icon: 'dal', c: '#9bb24a' },
  chana: { icon: 'chana', c: '#cda05c' }, rajma: { icon: 'rajma', c: '#9c4338' },
  peanut: { icon: 'peanut', c: '#d9b27a' }, sprouts: { icon: 'sprouts', c: '#86c258' },
  // vegetables
  carrot: { icon: 'carrot', c: '#e8843a' }, spinach: { icon: 'spinach', c: '#5a9a42' },
  'sweet potato': { icon: 'sweetpotato', c: '#c56b3e' }, potato: { icon: 'potato', c: '#cda36a' },
  beetroot: { icon: 'beetroot', c: '#9c3b6b' }, pumpkin: { icon: 'pumpkin', c: '#e2913f' },
  'bottle gourd': { icon: 'bottlegourd', c: '#9bbe63' }, peas: { icon: 'peas', c: '#86c258' },
  tomato: { icon: 'tomato', c: '#d6473b' }, beans: { icon: 'beans', c: '#6aa83f' },
  broccoli: { icon: 'broccoli', c: '#4f8a3a' }, cauliflower: { icon: 'cauliflower', c: '#e7e2cf' },
  drumstick: { icon: 'drumstick', c: '#6aa83f' }, zucchini: { icon: 'zucchini', c: '#4f7a3a' },
  // fruits
  banana: { icon: 'banana', c: '#e9c44a' }, apple: { icon: 'apple', c: '#d2473f' },
  pear: { icon: 'pear', c: '#bcc758' }, mango: { icon: 'mango', c: '#f0a83a' },
  avocado: { icon: 'avocado', c: '#5f7f33' }, date: { icon: 'date', c: '#7a4a2c' },
  papaya: { icon: 'papaya', c: '#e88a4a' }, pomegranate: { icon: 'pomegranate', c: '#c23a52' },
  blueberry: { icon: 'blueberry', c: '#5560a8' }, coconut: { icon: 'coconut', c: '#9c7a52' },
  // dairy & fats
  curd: { icon: 'curd', c: '#e4ddcd' }, paneer: { icon: 'paneer', c: '#cdbf93' },
  milk: { icon: 'milk', c: '#cdbf93' }, ghee: { icon: 'ghee', c: '#e8b94f' },
  cheese: { icon: 'cheese', c: '#edc85e' }, butter: { icon: 'butter', c: '#f0d480' },
  buttermilk: { icon: 'buttermilk', c: '#f1ede2' },
  // nuts & seeds
  almond: { icon: 'almond', c: '#b9824e' }, walnut: { icon: 'walnut', c: '#a9743f' },
  cashew: { icon: 'cashew', c: '#e6d6b4' }, pistachio: { icon: 'pistachio', c: '#9bbf5a' },
  sesame: { icon: 'sesame', c: '#c8b890' }, chia: { icon: 'chia', c: '#4a4038' },
  flaxseed: { icon: 'flaxseed', c: '#a5743f' },
  // proteins
  egg: { icon: 'egg', c: '#efe6d0' }, fish: { icon: 'fish', c: '#86a6b6' },
  chicken: { icon: 'chicken', c: '#d59a62' }, prawn: { icon: 'prawn', c: '#e89a7a' },
  mutton: { icon: 'mutton', c: '#c8746a' },
  // spices & sweeteners
  turmeric: { icon: 'turmeric', c: '#e0962e' }, cinnamon: { icon: 'cinnamon', c: '#a5623a' },
  cumin: { icon: 'cumin', c: '#9c7548' }, coriander: { icon: 'coriander', c: '#5a9a42' },
  mint: { icon: 'mint', c: '#5aa05a' }, ginger: { icon: 'ginger', c: '#d6b483' },
  jaggery: { icon: 'jaggery', c: '#a5623a' }, honey: { icon: 'honey', c: '#e8a93a' },
  oil: { icon: 'oil', c: '#ecc86a' },
  // 12–24 m extension ('methi' borrows the spinach glyph — no zif-methi sprite)
  besan:    { icon: 'chana', c: '#cda05c' },
  methi:    { icon: 'spinach', c: '#5a9a42' },   // stand-in: no zif-methi sprite
  onion:    { icon: 'onion', c: '#c98fa0' },
  cucumber: { icon: 'cucumber', c: '#7fae5a' },
  lemon:    { icon: 'lemon', c: '#e9d24a' },
  grapes:   { icon: 'grapes', c: '#8fae4a' },
};
// Longest-key-first index for substring resolution.
const _FOOD_ICON_KEYS = Object.keys(FOOD_ICON).sort((a, b) => b.length - a.length);

// Resolve an ingredient name to its food icon + colour. Returns the matched
// { icon, c } or a neutral fallback ({ icon: 'bowl' is a zi() glyph, c: null }
// → caller renders the monochrome zi('bowl') when icon has no zif).
function recipeFoodIcon(name) {
  const n = (name || '').toLowerCase();
  if (FOOD_ICON[n]) return FOOD_ICON[n];
  for (const k of _FOOD_ICON_KEYS) {
    if (n.indexOf(k) !== -1) return FOOD_ICON[k];
  }
  return null;
}

// ── §9.5 Tagline composer (ported from docs/design/taglines.mjs) ─────────
// The generative "voice" line for any recipe/combo: each ingredient
// contributes an epithet + noun; the minor-share ratio picks the connector so
// quantity shows in the words. Soft prep-cautions FOLD into the phrase (ground
// almond / halved grape); STRICT no's (honey / added sugar) keep a prominent
// LEADING clause. Epithets rotate by a day-seed (fresh daily, deterministic
// within a day). Adapted to the app's global-script style (no ES exports);
// keyed by zif icon id (recipeFoodIcon(name).icon) so it shares one vocabulary.
const RECIPE_EP = {
  // grains & cereals
  rice:{eps:['soft','gentle','silky'],noun:'rice'}, millet:{eps:['earthy','iron-rich','nutty'],noun:'ragi'},
  oats:{eps:['wholesome','warm','hearty'],noun:'oats'}, wheat:{eps:['hearty','wholesome'],noun:'wheat'},
  suji:{eps:['smooth','light'],noun:'suji'}, corn:{eps:['sweet','sunny'],noun:'corn'},
  dalia:{eps:['hearty','nutty'],noun:'dalia'}, barley:{eps:['nutty','wholesome'],noun:'barley'},
  quinoa:{eps:['nutty','light'],noun:'quinoa'},
  // legumes & pulses
  dal:{eps:['savoury','soupy','hearty'],noun:'dal'}, chana:{eps:['nutty','hearty'],noun:'chana'},
  rajma:{eps:['hearty','earthy'],noun:'rajma'}, peanut:{eps:['nutty','rich'],noun:'peanut',fold:'ground'},
  sprouts:{eps:['fresh','green'],noun:'sprouts'},
  // vegetables
  carrot:{eps:['sweet','bright','sunny'],noun:'carrot'}, spinach:{eps:['leafy','green','iron-rich'],noun:'spinach'},
  beans:{eps:['crisp','green'],noun:'green beans'}, bottlegourd:{eps:['light','soothing'],noun:'bottle gourd'},
  beetroot:{eps:['earthy','ruby','sweet'],noun:'beetroot'}, pumpkin:{eps:['silky','golden','sweet'],noun:'pumpkin'},
  sweetpotato:{eps:['velvety','golden','creamy'],noun:'sweet potato'}, potato:{eps:['soft','comforting'],noun:'potato'},
  broccoli:{eps:['green','tender'],noun:'broccoli'}, cauliflower:{eps:['mild','tender'],noun:'cauliflower'},
  tomato:{eps:['tangy','bright'],noun:'tomato'}, peas:{eps:['sweet','green'],noun:'peas'},
  drumstick:{eps:['earthy','green'],noun:'drumstick'}, zucchini:{eps:['soft','mild'],noun:'zucchini'},
  // fruits
  banana:{eps:['creamy','sweet','soft'],noun:'banana'}, pear:{eps:['juicy','gentle'],noun:'pear'},
  apple:{eps:['sweet','stewed','crisp'],noun:'apple'}, mango:{eps:['golden','silky','sweet'],noun:'mango'},
  avocado:{eps:['buttery','creamy'],noun:'avocado'}, blueberry:{eps:['sweet','jewel-like'],noun:'blueberry'},
  date:{eps:['caramel-sweet','rich'],noun:'date'}, coconut:{eps:['creamy','rich'],noun:'coconut'},
  pomegranate:{eps:['ruby','jewel-like'],noun:'pomegranate'},
  // dairy & eggs
  paneer:{eps:['mild','soft','milky'],noun:'paneer'}, milk:{eps:['creamy','gentle'],noun:'milk'},
  ghee:{eps:['rich','golden'],noun:'ghee'}, curd:{eps:['cooling','tangy','creamy'],noun:'curd'},
  cheese:{eps:['savoury','melty'],noun:'cheese'}, butter:{eps:['rich','soft'],noun:'butter'},
  buttermilk:{eps:['cooling','tangy'],noun:'buttermilk'}, egg:{eps:['protein-rich','soft'],noun:'egg',fold:'cooked'},
  // nuts & seeds
  almond:{eps:['nutty','buttery'],noun:'almond',fold:'ground'}, walnut:{eps:['earthy','rich'],noun:'walnut',fold:'ground'},
  cashew:{eps:['buttery','mild'],noun:'cashew',fold:'ground'}, sesame:{eps:['nutty','toasty'],noun:'sesame',fold:'ground'},
  chia:{eps:['tiny','nutty'],noun:'chia',fold:'soaked'}, flaxseed:{eps:['nutty','wholesome'],noun:'flaxseed',fold:'ground'},
  // proteins
  fish:{eps:['tender','omega-rich'],noun:'fish',fold:'boneless'}, chicken:{eps:['lean','tender'],noun:'chicken',fold:'shredded'},
  prawn:{eps:['tender','sweet'],noun:'prawn'}, mutton:{eps:['rich','tender'],noun:'mutton',fold:'soft-cooked'},
  // fats & sweeteners
  jaggery:{eps:['caramel-sweet'],noun:'jaggery',strict:'no added sugar before 2'},
  honey:{eps:['golden'],noun:'honey',strict:'honey — only from age 2 (added sugar)'}, oil:{eps:['light'],noun:'oil'},
  // spices & herbs
  turmeric:{eps:['golden','earthy'],noun:'turmeric'}, cinnamon:{eps:['warm','sweet'],noun:'cinnamon'},
  cumin:{eps:['warm','earthy'],noun:'cumin'}, coriander:{eps:['fresh','herby'],noun:'coriander'},
  mint:{eps:['cool','fresh'],noun:'mint'}, ginger:{eps:['warming','zingy'],noun:'ginger'},
  // fold-completeness (K-T-2): keys present in the fingerprint icon map must also
  // carry a voice, or a recipe paints a colour band for an unnamed ingredient.
  poha:{eps:['light','flaky'],noun:'poha'}, okra:{eps:['tender','green'],noun:'okra'},
  cabbage:{eps:['crisp','leafy'],noun:'cabbage'}, brinjal:{eps:['silky','mellow'],noun:'brinjal'},
  mushroom:{eps:['earthy','tender'],noun:'mushroom'}, onion:{eps:['sweet','mellow'],noun:'onion'},
  strawberry:{eps:['sweet','fragrant'],noun:'strawberry'}, grapes:{eps:['juicy','sweet'],noun:'grape',fold:'quartered'},
  papaya:{eps:['soft','sweet'],noun:'papaya'}, orange:{eps:['juicy','bright'],noun:'orange'},
  pistachio:{eps:['nutty','green'],noun:'pistachio',fold:'ground'}, pumpkinseed:{eps:['nutty','crunchy'],noun:'pumpkin seed',fold:'ground'},
  tofu:{eps:['silky','mild'],noun:'tofu'},
};
const _recipeConnector = s =>
  s < 0.12 ? 'with just a hint of' : s < 0.22 ? 'with a touch of' :
  s < 0.33 ? 'with a little' : s < 0.45 ? 'balanced with' : 'meets';
const _recEpOf = (it, seed) => it.eps[seed % it.eps.length];
const _recNounOf = it => it.fold ? `${it.fold} ${it.noun}` : it.noun;

// parts: [{id, w}] (id = a RECIPE_EP key; w = grams) · seed: day-seed.
// Returns { strict:[lead clauses], body }. Render strict first (prominent).
function _recipeComposeTagline(parts, seed) {
  seed = seed || 0;
  const items = parts.map(p => ({ ...RECIPE_EP[p.id], w: p.w })).filter(i => i.noun).sort((a, b) => b.w - a.w);
  if (!items.length) return { strict: [], body: '' };
  const total = items.reduce((s, i) => s + i.w, 0) || 1;
  const strict = [...new Set(items.filter(i => i.strict).map(i => i.strict))];
  const dom = items[0];
  let body;
  if (items.length === 1) {
    body = `${_recEpOf(dom, seed)} ${_recNounOf(dom)}`;
  } else if (items.length === 2) {
    const m = items[1], con = _recipeConnector(m.w / total);
    body = con === 'meets'
      ? `${_recEpOf(dom, seed)} ${_recNounOf(dom)} meets ${_recEpOf(m, seed)} ${_recNounOf(m)}`
      : `${_recEpOf(dom, seed)} ${_recNounOf(dom)}, ${con} ${_recNounOf(m)}`;
  } else {
    const mids = items.slice(1, -1).map(_recNounOf);
    const last = items.at(-1), lastCon = (last.w / total) < 0.15 ? 'a touch of' : 'a little';
    body = `${_recEpOf(dom, seed)} ${_recNounOf(dom)}, with ${mids.join(', ')} and ${lastCon} ${_recNounOf(last)}`;
  }
  return { strict, body };
}

// O(1) lookup for the tap-through dispatcher (openRecipeInTab) + render helpers.
const RECIPES_BY_ID = RECIPES.reduce((m, r) => { m[r.id] = r; return m; }, {});

// ── Responsive-feeding portion GUIDANCE by age band (Maren CONTENT) ──────────
// The amount to OFFER at a feed — a guide, never a target. Babies self-regulate;
// the framing must stay responsive-feeding (let appetite lead, never force).
// Amounts cross-verified: WHO IYCF 2023 (NBK596423) + WHO/PAHO guiding principles
// + IAP IYCF — the canonical complementary-feeding quantities (tbsp equivalents at
// 1 cup = 16 tbsp ≈ 240 ml, so ½ cup ≈ 8 tbsp, ¾ cup ≈ 12 tbsp):
//   6–8 m:  2–3 tbsp per feed, building toward ~½ cup · 2–3 meals/day
//   9–11 m: ~½ cup (≈ 8 tbsp · 125 ml) · 3–4 meals + 1–2 snacks
//   12 m+:  ~¾–1 cup (≈ 12–16 tbsp · 190–250 ml) · 3–4 meals + 1–2 snacks
// Snacks are roughly half a meal portion. Source keys map into RECIPE_SOURCES.
const RECIPE_SERVING = [
  { maxMonth: 8,   meal: '2–3 tbsp, building toward about ½ cup (≈ 8 tbsp)', snack: '1–2 tbsp' },
  { maxMonth: 11,  meal: 'about ½ cup (≈ 8 tbsp · 125 ml)',                  snack: '2–3 tbsp' },
  { maxMonth: 999, meal: 'about ¾–1 cup (≈ 12–16 tbsp · 190–250 ml)',       snack: 'about ½ cup (≈ 8 tbsp)' },
];
// Resolve the offer-amount for a recipe's slot at a given age (snacks ~half a meal).
function _recipeServing(slot, ageMonths) {
  const band = RECIPE_SERVING.find(b => ageMonths <= b.maxMonth) || RECIPE_SERVING[RECIPE_SERVING.length - 1];
  return (slot === 'snack') ? band.snack : band.meal;
}


// ── Toddler (12–24 m) feeding reference. Each fact carries source keys that point into
//    RECIPE_SOURCES ∪ RECIPE_SOURCES_12_24. Frame everything as responsive feeding:
//    amounts are what to OFFER, never targets.
const TODDLER_FEEDING = {
  ageBand: { minMonth: 12, maxMonth: 23 },
  icon: 'bowl', // zi('bowl') — exists in template.html

  // (a) Portions and meal frequency
  meals: {
    perDay: '3–4 meals + 1–2 snacks',
    detail: 'Breastfed: 3–4 meals of family food plus 1–2 nutritious snacks as she wants them. ' +
            'Not breastfed: 4–5 meals (milk feeds count) + 1–2 snacks.',
    snackDefinition: 'Food eaten between meals, usually self-fed and easy to prepare — e.g. a piece of fruit, or chapati with nut paste.',
    source: ['whopaho', 'who', 'iap16', 'icmr', 'whonb', 'nhsbsl'],
  },
  portion: {
    meal: '¾–1 cup/bowl (250 ml) per meal — about ¾–1 medium (200 ml) katori of cooked food',
    snack: 'about ½ medium katori',
    energy: '~550 kcal/day from food other than breast milk (≈ 380–515 g/day of family foods), if breast milk intake is average',
    responsive: 'Offer, then let her appetite decide. Encourage without forcing, and let her self-feed even if it is messy.',
    source: ['iap16', 'whopaho', 'who'],
  },
  // ICMR-NIN DGI 2024 Table 1.6 — daily RAW amounts for a 1–3 y child of ~12.9 kg (1+ to 3 y 11 m).
  icmrDaily1to3y: {
    cerealsMilletsG: 100, pulsesBeansG: 50, greenLeafyVegG: 50, otherVegG: 100, rootsTubersG: 50,
    fruitsG: '60–75', nutsG: 10, milkCurdMl: 350, fatsOilsG: 20, kcal: 1110, proteinG: 38,
    notes: [
      '20% of cereals (raw weight) from millets such as ragi, jowar or bajra',
      'For non-vegetarians, 30 g of pulses may be swapped for meat or eggs',
      'No added sugar for children under 2 — added sugars include table sugar, jaggery and honey',
      'Per main meal (1–3 y diet chart): cereal 40 g · pulse 10–15 g (or egg ½ / fish or chicken 25 g) · vegetables 30–35 g · greens 25 g · oil/ghee 6–7 g · fruit 25 g; milk 150 ml early morning + 150 ml evening; nuts 10 g',
    ],
    source: ['icmr'],
  },

  // (b) The "family food" texture stage, after 'finger'
  texture: {
    key: 'family', after: 'finger', proposedStageIndex: 4,
    label: 'Family food, adapted',
    definition: 'From about 12 months, the same foods the family eats, in smaller portions, cut into small pieces or ' +
                'lightly mashed as needed. Every piece should be soft enough to squash between finger and thumb, ' +
                'because a toddler without molars mashes with her gums.',
    rules: [
      'Take her portion out BEFORE adding salt, chilli, sugar or strong masala',
      'Remove whole spices, curry leaves and tough skins',
      'Cook hard vegetables until soft; grate raw ones finely; never raw carrot sticks',
      'Quarter small round foods (grapes, cherry tomatoes, berries)',
      'Squash whole pulses (chana, rajma, peas)',
      'Nuts and seeds only ground, as a powder or smooth paste — no whole nuts under 5',
      'Remove every bone from fish and meat',
      'Offer textured food and finger foods; keep moving her on from purées',
    ],
    teethNote: 'First molars usually come in around 12 months, canines around 18 months and second molars around 24 months. ' +
               'Until then, keep pieces soft enough to mash with her gums.',
    source: ['whopaho', 'iap16', 'nhsbsl', 'nhsteeth'],
  },

  // (c) Variety target (dietary diversity)
  variety: {
    target: '≥ 5 of 8 food groups per day (WHO/UNICEF Minimum Dietary Diversity)',
    groups: {
      breastmilk: 'Breast milk',
      grains:     'Grains, roots, tubers & plantains (rice, wheat, ragi, poha, potato)',
      pulses:     'Pulses, nuts & seeds (dals, rajma, chana, besan, ground peanut/til)',
      dairy:      'Dairy (milk, curd, paneer, cheese) — ghee/butter do NOT count',
      flesh:      'Flesh foods (fish, chicken, meat)',
      eggs:       'Eggs',
      vitA:       'Vitamin-A-rich fruit & veg (carrot, pumpkin, orange sweet potato, spinach, methi, ripe mango, ripe papaya)',
      otherFV:    'Other fruit & veg (lauki, tomato, peas, beans, cauliflower, onion, cucumber, banana, pear, grapes)',
    },
    daily: [
      'Animal-source foods daily (meat, fish or eggs) — WHO strong recommendation',
      'Fruit and vegetables daily',
      'Pulses, nuts and seeds often, especially when meat/fish/eggs or vegetables are limited (e.g. vegetarian days)',
    ],
    indiaFive: 'ICMR-NIN (India) version: 5 foods every day — cereals/millets · pulses/egg/meat · nuts & oilseeds · breast milk/milk & milk products · vegetables/greens & fruit',
    vegetarianNote: 'On a vegetarian day she can still reach 5 of 8 without flesh or eggs: breast milk + grains + pulses + dairy + both fruit/veg groups = 6.',
    source: ['whoiycf', 'who', 'icmr'],
  },

  // (d) Milk
  milk: {
    breastfeeding: 'Continue breastfeeding to 2 years or beyond',
    cowMilk: 'From 12 months, pasteurised whole cow’s (or buffalo) milk can be her main drink alongside breast milk and water; curd and plain yoghurt also count',
    amount: 'About 350 ml/day of milk/curd (ICMR-NIN). If she is not breastfed, ~300–500 ml/day, or ~200–400 ml if she eats other animal foods regularly, per WHO guidance',
    ceiling: 'Keep total cow’s milk to about 500 ml/day or less so it does not displace iron-rich foods (synthesised ceiling — see flag F1)',
    cup: 'Offer it in an open or free-flow cup, not a bottle — move off bottles after 1',
    fullFat: 'Whole (full-fat) milk and dairy until 2',
    avoid: [
      'Toddler, growing-up and "goodnight" milks — unnecessary',
      'Sweetened or flavoured milks and malt/health-drink powders — added sugar',
      'Rice drinks under 5 (arsenic); other plant drinks are not a dairy replacement except unsweetened fortified soy',
      'Tea and coffee',
    ],
    source: ['who', 'whopaho', 'whonb', 'icmr', 'nhs', 'nhsbsl', 'her'],
  },

  // Salt and sugar (shared floor)
  saltSugar: {
    salt: 'No more than 2 g salt/day at 1–3 years (≈ 0.8 g sodium). She does not need added salt — ICMR-NIN: reduce salt "to the bare minimum". If a pinch goes into the family pot, use iodised salt, and take her portion out first when you can.',
    sugar: 'No added sugar before 2 — this includes jaggery, honey and mishri (ICMR-NIN lists jaggery and honey as added sugar; WHO: no foods high in sugar, no sugar-sweetened drinks, no non-sugar sweeteners). Honey is also a botulism risk under 1.',
    juice: 'Whole fruit instead of juice; if juice is given at all, limit it, dilute it, and serve it only with meals',
    source: ['nhssalt', 'icmr', 'who', 'nhs'],
  },
};

// Export on window — mirrors the data.js `window.CURATED_COMBOS = …` pattern so
// consumers (diet.js renderDietRecipes, core.js openRecipeInTab) read a global.
window.RECIPES = RECIPES;
window.RECIPES_BY_ID = RECIPES_BY_ID;
window.RECIPE_SOURCES = RECIPE_SOURCES;
window.recipeFoodIcon = recipeFoodIcon;
window._recipeComposeTagline = _recipeComposeTagline;
window._recipeServing = _recipeServing;
