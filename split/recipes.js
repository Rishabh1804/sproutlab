// ═══════════════════════════════════════════════════════════════════════
// recipes.js — Diet → Recipes corpus (food-sub-tab Recipes, WIRING_PLAN §3)
// Spec: docs/design/recipes-tab/WIRING_PLAN.md (+ SESSION_HANDOFF.md, LOCKED.md)
//
// A structured, cited recipe corpus for 6–12-month complementary feeding.
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
//   • No honey / added salt / added sugar < 12 m (fruit sweetens).
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

  // ─── 12 m+ catalog item — age-gated, never suggested for an under-1 (honey) ───
  {
    id: 'banana-honey-toast', title: 'Banana & Honey Toast (12 m+)', slot: 'snack', minAgeMonths: 12, prepMinutes: 5,
    ingredients: [{ name: 'bread', qty: '1 slice, soft', g: 25 }, { name: 'banana', qty: '½, mashed', g: 25 }, { name: 'honey', qty: '½ tsp (12 m+ only)', g: 5 }],
    foodGroups: ['grains', 'fruits'], cuisine: 'Global',
    steps: [
      'Lightly toast a soft slice of whole-wheat bread, remove crusts, cut into soft fingers.',
      'Spread with mashed banana.',
      'For ONE-YEAR-OLDS AND OVER ONLY, drizzle ½ tsp honey.',
      'Serve as soft fingers.',
    ],
    dos: ['Only from the first birthday — honey is for 12 m+', 'Soft fingers suit self-feeding toddlers', 'Whole-wheat bread adds fibre'],
    donts: ['NEVER give honey before 12 months — risk of infant botulism', 'No honey of any kind for a baby — raw, cooked, or baked', 'Cut bread into soft, manageable fingers'],
    source: ['who', 'nhs'],
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
  jaggery:{eps:['caramel-sweet'],noun:'jaggery',strict:'go easy — added sugar'},
  honey:{eps:['golden'],noun:'honey',strict:'honey — only from age 1'}, oil:{eps:['light'],noun:'oil'},
  // spices & herbs
  turmeric:{eps:['golden','earthy'],noun:'turmeric'}, cinnamon:{eps:['warm','sweet'],noun:'cinnamon'},
  cumin:{eps:['warm','earthy'],noun:'cumin'}, coriander:{eps:['fresh','herby'],noun:'coriander'},
  mint:{eps:['cool','fresh'],noun:'mint'}, ginger:{eps:['warming','zingy'],noun:'ginger'},
  // fold-completeness (K-T-2): keys present in the fingerprint icon map must also
  // carry a voice, or a recipe paints a colour band for an unnamed ingredient.
  poha:{eps:['light','flaky'],noun:'poha'}, okra:{eps:['tender','green'],noun:'okra'},
  cabbage:{eps:['crisp','leafy'],noun:'cabbage'}, brinjal:{eps:['silky','mellow'],noun:'brinjal'},
  mushroom:{eps:['earthy','tender'],noun:'mushroom'}, onion:{eps:['sweet','mellow'],noun:'onion'},
  strawberry:{eps:['sweet','fragrant'],noun:'strawberry'}, grapes:{eps:['juicy','sweet'],noun:'grape',fold:'halved'},
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

// Export on window — mirrors the data.js `window.CURATED_COMBOS = …` pattern so
// consumers (diet.js renderDietRecipes, core.js openRecipeInTab) read a global.
window.RECIPES = RECIPES;
window.RECIPES_BY_ID = RECIPES_BY_ID;
window.RECIPE_SOURCES = RECIPE_SOURCES;
window.recipeFoodIcon = recipeFoodIcon;
window._recipeComposeTagline = _recipeComposeTagline;
