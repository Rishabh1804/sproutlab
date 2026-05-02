// INSIGHTS & TIPS ENGINE
// ─────────────────────────────────────────
const ALL_TIPS = [
  // ── IRON (highest priority at 6–9 months) ──
  {
    type:'info', icon:zi('dot-red'),
    title:'Iron window — act before 9 months',
    body:'Ziva\'s birth iron stores deplete around 8–9 months. Ensure ragi, masoor dal, beetroot, or spinach appear at least 4–5 times a week.',
    condition: d => {
      const ironFoods = ['ragi','masoor dal','beetroot','beans','moong dal','spinach','bajra','jowar','poha','toor dal','chana dal','rajma','pumpkin seeds'];
      return countFoodsInDiary(d, ironFoods) < 4;
    }
  },
  {
    type:'add', icon:zi('spoon'),
    title:'Pair iron with Vitamin C',
    body:'Iron-rich meals absorb up to 3× better with Vitamin C. Add lemon in dal, tomato in khichdi, or pair with mango/orange/amla.',
    condition: d => {
      const iron  = countFoodsInDiary(d, ['ragi','masoor dal','beetroot','moong dal','spinach','bajra','poha']);
      const vitC  = countFoodsInDiary(d, ['lemon','tomato','mango','pear','blueberry','apple','papaya','orange','kiwi','amla','pomegranate','broccoli','strawberry']);
      return iron > 0 && vitC < iron;
    }
  },
  // ── BRAIN DEVELOPMENT ──
  {
    type:'add', icon:zi('brain'),
    title:'Boost brain fats this week',
    body:'Walnut, ghee, flaxseed, and avocado are excellent for brain myelination. Aim for at least one brain-fat source daily.',
    condition: d => countFoodsInDiary(d, ['walnut','ghee','avocado','flaxseed','coconut oil','sesame','paneer']) < 4,
  },
  {
    type:'add', icon:zi('bowl'),
    title:'Omega-3 matters — plant sources count',
    body:'Walnut powder and flaxseed are your best vegetarian omega-3 sources. Add to porridge or dal — even ½ tsp helps.',
    condition: d => countFoodsInDiary(d, ['walnut','flaxseed']) < 2,
  },
  // ── GUT HEALTH ──
  {
    type:'add', icon:zi('siren'),
    title:'Probiotics for gut health',
    body:'Curd, dahi, idli, and dosa are naturally fermented — they build healthy gut flora, which boosts immunity and digestion.',
    condition: d => countFoodsInDiary(d, ['curd','dahi','yogurt','idli','dosa']) < 2,
  },
  // ── CONSTIPATION ──
  {
    type:'watch', icon:zi('diaper'),
    title:'Watch banana frequency',
    body:'Banana has appeared frequently this week. It firms up stools — balance with pear, papaya, prune, or plum if stools are hard.',
    condition: d => countFoodsInDiary(d, ['banana']) >= 4,
  },
  {
    type:'add', icon:zi('spoon'),
    title:'Add pear or papaya for gut comfort',
    body:'Pear\'s sorbitol and papaya\'s enzymes are natural stool softeners — ideal as solids increase. Prune and plum also work well.',
    condition: d => countFoodsInDiary(d, ['pear','papaya','prune','plum']) < 2,
  },
  // ── CALCIUM & BONES ──
  {
    type:'add', icon:zi('ruler'),
    title:'Calcium for bone growth',
    body:'Ragi, sesame (til), curd, paneer, and almonds are your best calcium sources. Aim for 2–3 calcium-rich foods daily.',
    condition: d => countFoodsInDiary(d, ['ragi','almonds','sesame','til','curd','dahi','yogurt','paneer','cheese']) < 3,
  },
  // ── PROTEIN ──
  {
    type:'add', icon:zi('run'),
    title:'Protein variety this week',
    body:'Mix up protein sources — dal, curd, paneer, peanut, and sattu all count. Variety ensures a complete amino acid profile.',
    condition: d => {
      const protFoods = ['moong dal','masoor dal','toor dal','chana dal','urad dal','rajma','paneer','curd','dahi','peanut','sattu'];
      return countFoodsInDiary(d, protFoods) < 4;
    }
  },
  // ── VITAMIN A ──
  {
    type:'add', icon:zi('baby'),
    title:'Vitamin A for eyes & immunity',
    body:'Carrot, sweet potato, pumpkin, mango, and spinach are packed with Vitamin A. Try to include one daily.',
    condition: d => countFoodsInDiary(d, ['carrot','sweet potato','pumpkin','mango','spinach','drumstick','papaya']) < 3,
  },
  // ── HYDRATION ──
  {
    type:'info', icon:zi('drop'),
    title:'Hydrating foods matter',
    body:'As solids increase, water intake matters more. Bottle gourd, cucumber, watermelon, and muskmelon naturally hydrate.',
    condition: d => countFoodsInDiary(d, ['bottle gourd','lauki','cucumber','watermelon','muskmelon','ash gourd','zucchini']) === 0,
  },
  // ── VARIETY ──
  {
    type:'add', icon:zi('spoon'),
    title:'Try a new vegetable this week',
    body:'Sweet potato, pumpkin, broccoli, and drumstick are excellent next introductions — gentle, nutritious, and easy to puree.',
    condition: d => {
      const newVeg = ['sweet potato','spinach','pumpkin','broccoli','zucchini','drumstick','ash gourd','ridge gourd'];
      return countFoodsInDiary(d, newVeg) === 0;
    }
  },
  {
    type:'add', icon:zi('bowl'),
    title:'Explore millets',
    body:'Beyond ragi, try jowar and bajra — both are iron + protein rich and gluten-free. Great as porridge or mixed into khichdi.',
    condition: d => countFoodsInDiary(d, ['jowar','bajra']) === 0,
  },
  {
    type:'add', icon:zi('bowl'),
    title:'Try fermented foods',
    body:'Idli, dosa, and curd are fermented — they improve nutrient absorption and build gut immunity. Great for breakfast.',
    condition: d => countFoodsInDiary(d, ['idli','dosa','curd','dahi','yogurt']) === 0,
  },
  // ── IMMUNE SUPPORT ──
  {
    type:'add', icon:zi('shield'),
    title:'Immunity-boosting foods',
    body:'Turmeric (pinch in dal), amla, kiwi, and broccoli are powerful immune supporters at this age. Small amounts go a long way.',
    condition: d => countFoodsInDiary(d, ['turmeric','amla','kiwi','broccoli','orange']) < 2,
  },
  // ── ZINC ──
  {
    type:'info', icon:zi('bolt'),
    title:'Zinc supports growth & immunity',
    body:'Pumpkin seeds (powdered), sesame, oats, and rajma are great zinc sources. Zinc often gets overlooked but is vital for development.',
    condition: d => countFoodsInDiary(d, ['pumpkin seeds','sesame','til','oats','rajma','cashew','bajra']) < 2,
  },
  // ── HEALTHY FATS ──
  {
    type:'add', icon:zi('spoon'),
    title:'Healthy fats — keep them regular',
    body:'Avocado, ghee, coconut, paneer, and nut butters are key for brain & nerve development at this age. Include daily.',
    condition: d => countFoodsInDiary(d, ['avocado','ghee','coconut','coconut oil','paneer','butter','almonds','walnut','cashew']) < 3,
  },
  // ── AVOID (always show) ──
  {
    type:'avoid', icon:zi('warn'),
    title:'No salt, sugar or jaggery yet',
    body:'Ziva\'s kidneys are not mature enough for added salt. Avoid sugar and jaggery until at least 12 months. Natural sweetness from fruit is fine.',
    condition: () => true,
  },
  {
    type:'avoid', icon:zi('spoon'),
    title:'No honey before 12 months',
    body:'Honey carries risk of infant botulism regardless of form. Strictly avoid until 1 year.',
    condition: () => true,
  },
  {
    type:'avoid', icon:zi('drop'),
    title:'No cow\'s milk as main drink yet',
    body:'Cow\'s milk lacks iron and can stress infant kidneys. Curd and paneer are fine, but milk as a drink should wait until 12 months.',
    condition: () => true,
  },
  {
    type:'avoid', icon:zi('drop'),
    title:'No fruit juice in bottles',
    body:'Juice in bottles causes tooth decay and reduces appetite for solids. If giving juice, use an open cup and limit to 2–3 tsp diluted.',
    condition: () => true,
  },
  // ── TEXTURE PROGRESSION ──
  {
    type:'info', icon:zi('spoon'),
    title:'Time to add texture',
    body:'At 6.5+ months, start moving from smooth purees to slightly mashed food. Tiny soft lumps help develop chewing muscles and prevent texture aversion later.',
    condition: () => {
      const mo = getAgeInMonths();
      return mo >= 6.5;
    }
  },
  {
    type:'info', icon:zi('baby'),
    title:'Finger foods are coming soon',
    body:'By 7–8 months, soft finger foods like steamed carrot sticks, banana pieces, or soft idli strips help develop pincer grasp and self-feeding skills.',
    condition: () => {
      const mo = getAgeInMonths();
      return mo >= 7;
    }
  },
  // ── ALLERGEN INTRODUCTION ──
  {
    type:'info', icon:zi('spoon'),
    title:'Early allergen exposure is protective',
    body:'Research shows introducing peanut, tree nuts, and egg (yolk first) early reduces allergy risk. Give each new allergen for 3 days before the next.',
    condition: d => {
      const introduced = new Set(foods.map(f => f.name.toLowerCase()));
      const allergens = ['peanut','almonds','walnut','cashew','sesame'];
      const tried = allergens.filter(a => introduced.has(a));
      return tried.length < 3;
    }
  },
  // ── SEASONAL ──
  {
    type:'info', icon:zi('flame'),
    title:'Hot weather hydration',
    body:'Jamshedpur summers are intense. Offer extra water sips between meals and include hydrating foods — watermelon, cucumber, bottle gourd, and muskmelon.',
    condition: () => {
      const month = new Date().getMonth(); // 0-indexed
      return month >= 2 && month <= 5; // Mar–Jun
    }
  },
  {
    type:'watch', icon:zi('warn'),
    title:'Monsoon food safety',
    body:'During monsoons, avoid raw/uncooked foods. Stick to freshly cooked, hot meals. Wash all fruits and veggies thoroughly. Curd is fine if homemade and fresh.',
    condition: () => {
      const month = new Date().getMonth();
      return month >= 5 && month <= 8; // Jun–Sep
    }
  },
  // ── MEAL PATTERN ──
  {
    type:'info', icon:zi('clock'),
    title:'Feed iron-rich meals in the morning',
    body:'Iron absorption is highest earlier in the day. Schedule ragi, dal, and beetroot for breakfast or lunch rather than dinner.',
    condition: d => {
      const todayKey = toDateStr(new Date());
      const entry = d[todayKey];
      if (!entry || !entry.dinner) return false;
      const dinnerLower = entry.dinner.toLowerCase();
      return ['ragi','masoor','beetroot','spinach'].some(f => dinnerLower.includes(f));
    }
  },
  {
    type:'add', icon:zi('sprout'),
    title:'Green vegetables gap',
    body:'Spinach, broccoli, beans, and drumstick are iron + folate powerhouses. Aim for at least one green veggie every day.',
    condition: d => countFoodsInDiary(d, ['spinach','broccoli','beans','drumstick','bottle gourd','lauki','zucchini']) < 3,
  },
  {
    type:'add', icon:zi('spoon'),
    title:'Root vegetables for energy',
    body:'Sweet potato, potato, beetroot, and carrot provide sustained energy for active babies. Great as a base for khichdi or mash.',
    condition: d => countFoodsInDiary(d, ['sweet potato','potato','beetroot','carrot']) < 3,
  },
  {
    type:'watch', icon:zi('bowl'),
    title:'Too much rice this week',
    body:'Rice has appeared in most meals. It\'s low in iron and protein. Try replacing some rice meals with ragi, dalia, or oats for better nutrition.',
    condition: d => countFoodsInDiary(d, ['rice']) >= 5 && countFoodsInDiary(d, ['ragi','dalia','oats','jowar','bajra']) < 2,
  },
  {
    type:'add', icon:zi('bowl'),
    title:'Rotate your lentils',
    body:'Each lentil has a different nutrient profile. Rotate moong, masoor, toor, and chana dal through the week for complete amino acids.',
    condition: d => {
      const dals = ['moong dal','masoor dal','toor dal','chana dal'];
      const used = dals.filter(dal => countFoodsInDiary(d, [dal]) > 0);
      return used.length < 2;
    }
  },
  // ── MILLETS ──
  {
    type:'add', icon:zi('bowl'),
    title:'Try a millet rotation',
    body:'Beyond ragi, try jowar (iron + protein), bajra (zinc + iron), and amaranth (complete protein). Each millet has unique nutrients — rotating them covers more bases than rice alone.',
    condition: d => {
      const millets = ['jowar','bajra','amaranth','ragi'];
      return countFoodsInDiary(d, millets) < 2;
    }
  },
  // ── SEEDS ──
  {
    type:'add', icon:zi('spoon'),
    title:'Seed power — tiny but mighty',
    body:'Chia seeds (omega-3), pumpkin seeds (zinc), sesame (calcium), and flaxseed (omega-3) can be ground into powder and added to any porridge. Rotate 2–3 per week.',
    condition: d => {
      const seeds = ['chia','pumpkin seeds','sesame','flaxseed','sunflower seeds'];
      return countFoodsInDiary(d, seeds) === 0;
    }
  },
  // ── CALCIUM ──
  {
    type:'info', icon:zi('ruler'),
    title:'Calcium check — bones are growing fast',
    body:'At this age, calcium needs are high. Best sources: ragi, sesame, curd, paneer, makhana, drumstick leaves, and figs (anjeer). Aim for at least 2 calcium-rich foods daily.',
    condition: d => {
      const calcFoods = ['ragi','sesame','curd','paneer','makhana','drumstick','fig','cheese'];
      return countFoodsInDiary(d, calcFoods) < 2;
    }
  },
  // ── ZINC ──
  {
    type:'info', icon:zi('shield'),
    title:'Zinc for immunity',
    body:'Zinc supports immune function and growth. Good sources: pumpkin seeds, cashew, peanut, rajma, chana dal, bajra, and paneer. Especially important during teething and illness.',
    condition: d => {
      const zincFoods = ['pumpkin seeds','cashew','peanut','rajma','chana dal','bajra','paneer'];
      return countFoodsInDiary(d, zincFoods) === 0;
    }
  },
  // ── FERMENTED FOODS ──
  {
    type:'add', icon:zi('bowl'),
    title:'Fermented foods for gut health',
    body:'Idli, dosa, curd, and curd rice contain natural probiotics that strengthen the gut. Try to include at least one fermented food daily — especially after any illness or antibiotic use.',
    condition: d => {
      const fermented = ['idli','dosa','curd','curd rice','raita','buttermilk'];
      return countFoodsInDiary(d, fermented) === 0;
    }
  },
  // ── HYDRATION ──
  {
    type:'info', icon:zi('drop'),
    title:'Hydration with food',
    body:'Now that solids are increasing, offer water sips between meals. Coconut water, watermelon, cucumber, and soups also count. Dehydration signs: dry lips, fewer wet nappies, dark urine.',
    condition: d => {
      const hydrating = ['watermelon','coconut water','cucumber','soup'];
      return countFoodsInDiary(d, hydrating) === 0;
    }
  },
  // ── FRUITS VARIETY ──
  {
    type:'add', icon:zi('spoon'),
    title:'Expand the fruit basket',
    body:'Beyond banana and apple, try grapes (halved!), strawberry, peach, chiku, papaya, fig, and pomegranate. Different colours = different antioxidants. Aim for 3+ fruit varieties per week.',
    condition: d => {
      const fruits = ['banana','apple','pear','mango','papaya','grapes','strawberry','chiku','pomegranate','blueberry','peach','kiwi','fig','watermelon','orange'];
      const used = fruits.filter(f => countFoodsInDiary(d, [f]) > 0);
      return used.length < 3;
    }
  },
  // ── CONSTIPATION ──
  {
    type:'info', icon:zi('diaper'),
    title:'Natural stool softeners',
    body:'If stools are hard, increase: pear, papaya, prune, fig, oats, sweet potato, and water intake. Reduce: banana, rice, and apple (these can firm stools). Poop tracker can help spot patterns.',
    condition: d => {
      const firming = ['banana','rice','apple'];
      const softening = ['pear','papaya','prune','fig','oats','sweet potato'];
      return countFoodsInDiary(d, firming) > countFoodsInDiary(d, softening);
    }
  },
  // ── TRADITIONAL SUPERFOODS ──
  {
    type:'add', icon:zi('star'),
    title:'Indian superfoods for babies',
    body:'Makhana (calcium), sattu (protein), jaggery (iron), saffron (brain), drumstick (calcium + iron), and amla (Vit C) are traditional Indian baby superfoods. Try adding one new one this week.',
    condition: d => {
      const superfoods = ['makhana','sattu','jaggery','saffron','drumstick','amla'];
      return countFoodsInDiary(d, superfoods) === 0;
    }
  },
  // ── COOKING FATS ──
  {
    type:'info', icon:zi('bowl'),
    title:'Rotate your cooking oils',
    body:'Different oils provide different fatty acids. Rotate ghee (brain fats), coconut oil (MCTs), sesame oil (calcium), and groundnut oil (Vit E) through the week. Avoid refined oils.',
    condition: d => {
      const oils = ['ghee','coconut oil','sesame oil','groundnut oil','mustard oil'];
      const used = oils.filter(o => countFoodsInDiary(d, [o]) > 0);
      return used.length <= 1;
    }
  },
  // ── ALLERGEN INTRODUCTION ──
  {
    type:'info', icon:zi('warn'),
    title:'Early allergen introduction',
    body:'Current research supports early introduction of common allergens: peanut, tree nuts (cashew, walnut, almond), sesame, and wheat. Introduce each alone, one at a time, 3 days apart. Early exposure may reduce allergy risk.',
    condition: d => {
      const allergens = ['peanut','cashew','walnut','almond','sesame','wheat'];
      const introduced = allergens.filter(a => d.foods && d.foods.some(f => f.name.toLowerCase().includes(a)));
      return introduced.length < 3 && d.ageMonths >= 6;
    }
  },
];

function countFoodsInDiary(diaryData, keywords) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  let count = 0;
  Object.entries(diaryData).forEach(([dateKey, entry]) => {
    if (new Date(dateKey) < cutoff) return;
    const all = [entry.breakfast, entry.lunch, entry.dinner, entry.snack].join(' ').toLowerCase();
    if (keywords.some(k => all.includes(k.toLowerCase()))) count++;
  });
  return count;
}

// ─────────────────────────────────────────
// CAN I GIVE THIS? — Offline rule-based food combo checker
// ─────────────────────────────────────────
const COMBO_HISTORY_KEY = 'ziva_combo_history';
let comboHistory = [];
try { comboHistory = JSON.parse(localStorage.getItem(COMBO_HISTORY_KEY)) || []; } catch { comboHistory = []; }
// @@INSERT_DATA_BLOCK_13@@

// Check what nutrient tags a list of food names collectively have
function getFoodTags(foodNames) {
  const allTags = new Set();
  const allNutrients = new Set();
  foodNames.forEach(f => {
    const n = getNutrition(f.trim().toLowerCase());
    if (n) {
      n.tags.forEach(t => allTags.add(t));
      n.nutrients.forEach(nt => allNutrients.add(nt.toLowerCase()));
    }
  });
  return { tags: [...allTags], nutrients: [...allNutrients] };
}
// @@INSERT_DATA_BLOCK_14@@

function initComboChecker() {
  renderComboQuickChips();
  renderComboHistory();
}

function renderComboQuickChips() {
  const el = document.getElementById('comboQuickChips');
  if (!el) return;
  const mo = getAgeInMonths();

  // Each chip has a predicted verdict colour
  const chips = [];
  if (mo < 8) {
    chips.push({ text:'honey', cls:'chip-avoid' });
    chips.push({ text:'egg yolk', cls:'chip-caution' });
    chips.push({ text:'paneer + rice', cls:'chip-safe' });
    chips.push({ text:'peanut butter', cls:'chip-caution' });
    chips.push({ text:'dal + spinach', cls:'chip-safe' });
    chips.push({ text:'sweet potato + ghee', cls:'chip-safe' });
  } else {
    chips.push({ text:'whole egg', cls:'chip-caution' });
    chips.push({ text:'cow milk', cls:'chip-avoid' });
    chips.push({ text:'cheese + paratha', cls:'chip-safe' });
    chips.push({ text:'rajma', cls:'chip-caution' });
    chips.push({ text:'idli + sambar', cls:'chip-safe' });
    chips.push({ text:'oats + banana', cls:'chip-safe' });
  }

  el.innerHTML = `<div style="font-size:var(--fs-sm);color:var(--light);margin-bottom:5px;width:100%;">Try asking:</div>` +
    chips.map(c =>
      `<span class="chip ${c.cls}" onclick="document.getElementById('comboInput').value='${c.text.replace(/'/g, "\\'")}';activateBtn('comboCheckBtn',true);checkFoodCombo()">${c.text}</span>`
    ).join('');
}

function checkFoodCombo() {
  const input = document.getElementById('comboInput');
  const query = input.value.trim();
  if (!query) return;

  const resultEl = document.getElementById('comboResult');

  // Check cache
  const cached = comboHistory.find(h => h.q.toLowerCase() === query.toLowerCase());
  if (cached) { renderComboResult(cached.result); return; }

  // Parse foods from query
  const rawFoods = query.split(/[+,&]|with|and/).map(f => f.trim().toLowerCase()).filter(f => f.length > 0);
  const mo = getAgeInMonths();
  const introducedSet = new Set(foods.map(f => f.name.toLowerCase()));
  const introducedNormSet = new Set(foods.map(f => normalizeFoodName(f.name)));

  let verdict = 'safe';
  let verdictEmoji = zi('check');
  let headline = '';
  const warnings = [];
  const benefits = [];
  const newFoods = [];
  const allergenNotes = [];
  let recipeText = '';
  let dos = [];
  let donts = [];
  let pairsWellWith = '';
  let nutritionHighlights = '';

  // ── 1. Check age safety ──
  rawFoods.forEach(food => {
    // Direct match
    const rule = AGE_RULES[food] || AGE_RULES[food.replace(/s$/, '')] || Object.entries(AGE_RULES).find(([k]) => food.includes(k))?.[1];
    if (rule && mo < rule.minMonth) {
      verdict = 'avoid';
      verdictEmoji = zi('warn');
      warnings.push(`${food}: ${rule.reason}`);
    }
  });

  // ── 2. Check allergens ──
  rawFoods.forEach(food => {
    const alert = ALLERGENS[food] || ALLERGENS[food.replace(/s$/, '')] || Object.entries(ALLERGENS).find(([k]) => food.includes(k))?.[1];
    if (alert) {
      allergenNotes.push(`${zi('warn')} ${food}: ${alert}`);
      if (verdict === 'safe') { verdict = 'caution'; verdictEmoji = zi('warn'); }
    }
  });

  // ── 3. Check introduction status (normalized) ──
  rawFoods.forEach(food => {
    const norm = normalizeFoodName(food);
    const isIntroduced = introducedNormSet.has(norm) || [...introducedSet].some(f => f.includes(food) || food.includes(f));
    if (!isIntroduced && food.length > 2) {
      newFoods.push(food);
    }
  });
  if (newFoods.length > 1 && verdict !== 'avoid') {
    verdict = 'caution';
    verdictEmoji = zi('warn');
    warnings.push('Multiple new foods at once — introduce each alone for 3 days first to identify any reactions.');
  }

  // ── 4. Combination logic ──
  const { tags, nutrients } = getFoodTags(rawFoods);
  // Iron + VitC boost
  if (tags.includes('iron-rich') && (tags.includes('vitamin-C') || nutrients.includes('vitamin c'))) {
    benefits.push('Iron + Vitamin C pairing — absorption boosted up to 3×!');
  }
  // Iron + Calcium conflict
  const hasIron = tags.includes('iron-rich');
  const hasCalcium = tags.includes('bone-health') && (nutrients.includes('calcium') || rawFoods.some(f => ['paneer','cheese','curd','yogurt','dahi','sesame','til','ragi'].includes(f)));
  if (hasIron && hasCalcium && rawFoods.length > 1) {
    if (verdict === 'safe') { verdict = 'caution'; verdictEmoji = zi('warn'); }
    warnings.push('Iron + calcium in same meal can reduce iron absorption. Consider spacing them 2 hours apart.');
  }
  // Brain health combo
  if (tags.includes('brain-health') || tags.includes('omega-3')) {
    benefits.push('Contains brain-healthy fats — excellent for neural development at this age.');
  }
  // Constipation risk
  if (rawFoods.includes('banana') && !rawFoods.some(f => ['pear','papaya','prune','plum'].includes(f))) {
    warnings.push('Banana firms stools — balance with pear or papaya if baby is constipated.');
  }
  // Probiotic + prebiotic synergy
  if (rawFoods.some(f => ['curd','dahi','yogurt','idli','dosa'].includes(f)) && rawFoods.some(f => ['banana','oats','ragi'].includes(f))) {
    benefits.push('Probiotic + prebiotic fibre — great for building healthy gut flora!');
  }
  // Fermented food boost
  if (tags.includes('fermented') || tags.includes('gut-health')) {
    benefits.push('Fermented foods provide natural probiotics for gut immunity.');
  }

  // ── 5. Nutrition highlights ──
  if (nutrients.length > 0) {
    nutritionHighlights = [...new Set(nutrients)].slice(0, 8).map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(', ');
  }

  // ── 6. Find recipe ──
  const queryNorm = rawFoods.sort().join(' ');
  // Try exact match
  let recipeMatch = COMBO_RECIPES[queryNorm] || COMBO_RECIPES[query.toLowerCase()];
  // Try individual food
  if (!recipeMatch && rawFoods.length === 1) recipeMatch = COMBO_RECIPES[rawFoods[0]];
  // Try partial key match
  if (!recipeMatch) {
    const key = Object.keys(COMBO_RECIPES).find(k => {
      const kParts = k.split(' ');
      return rawFoods.every(f => kParts.some(kp => kp.includes(f) || f.includes(kp))) ||
             kParts.every(kp => rawFoods.some(f => f.includes(kp) || kp.includes(f)));
    });
    if (key) recipeMatch = COMBO_RECIPES[key];
  }

  if (recipeMatch) {
    recipeText = recipeMatch.recipe;
    dos = recipeMatch.dos || [];
    donts = recipeMatch.donts || [];
  } else {
    // Generate a basic recipe from the nutrition data
    recipeText = generateBasicRecipe(rawFoods, mo);
    dos = generateDos(rawFoods, tags);
    donts = generateDonts(rawFoods, tags, mo);
  }

  // ── 7. Pairing suggestions (synergy-aware) ──
  const synergyPairs = getSynergyPairings(rawFoods);
  if (synergyPairs.length > 0) {
    const lines = synergyPairs.map(s => {
      let line = `${s.emoji} <strong>${s.partner}</strong> — ${s.reason}`;
      if (s.gapsFilled && s.gapsFilled.length > 0) line += ` (fills ${s.gapsFilled.join(', ')} gap)`;
      return line;
    });
    pairsWellWith = lines.join('<br>');
  } else if (hasIron && !tags.includes('vitamin-C')) {
    pairsWellWith = 'Add lemon, orange, mango, or tomato for Vitamin C to boost iron absorption.';
  } else if (tags.includes('vitamin-A') && !tags.includes('healthy-fats')) {
    pairsWellWith = 'Add ghee or coconut oil — fat helps absorb Vitamin A.';
  } else if (tags.includes('protein-rich') && !tags.includes('energy')) {
    pairsWellWith = 'Serve with rice or ragi for a balanced carb + protein meal.';
  } else if (rawFoods.length === 1 && tags.includes('energy')) {
    pairsWellWith = 'Add dal or paneer for protein, and a vegetable for vitamins.';
  }

  // ── 8. Build headline ──
  if (verdict === 'avoid') {
    headline = warnings[0] || 'Not recommended at this age.';
  } else if (verdict === 'caution') {
    headline = 'Can give with some precautions';
    if (newFoods.length > 0) headline = `Introduce ${newFoods.join(', ')} alone first, then combine`;
    if (allergenNotes.length > 0 && newFoods.length === 0) headline = 'Potential allergen — introduce carefully';
  } else {
    if (benefits.length > 0) headline = benefits[0].split('—')[0].trim();
    else if (nutritionHighlights) headline = `Good choice! Rich in ${nutritionHighlights.split(',').slice(0, 3).join(',')}`;
    else headline = 'Looks good for Ziva\'s age!';
  }

  // Vegetarian check
  const nonVeg = rawFoods.filter(f => ['chicken','fish','mutton','lamb','pork','prawn','shrimp','crab','meat'].includes(f));
  if (nonVeg.length > 0) {
    verdict = 'caution';
    verdictEmoji = zi('warn');
    warnings.push(`Ziva follows a vegetarian diet. ${nonVeg.join(', ')} is non-vegetarian.`);
    headline = `Note: ${nonVeg.join(', ')} is non-vegetarian — Ziva\'s diet is vegetarian`;
  }

  const result = {
    verdict, verdict_emoji: verdictEmoji, headline,
    explanation: [...warnings, ...benefits].join('\n') || (verdict === 'safe' ? `All ingredients are age-appropriate for ${Math.floor(mo)} months and have been introduced safely.` : ''),
    nutrition_highlights: nutritionHighlights,
    new_foods: newFoods,
    allergen_notes: allergenNotes,
    recipe: recipeText,
    dos, donts,
    pairs_well_with: pairsWellWith,
    _queryFoods: rawFoods,
  };

  // Cache
  comboHistory.unshift({ q: query, result, ts: new Date().toISOString() });
  if (comboHistory.length > 20) comboHistory = comboHistory.slice(0, 20);
  localStorage.setItem(COMBO_HISTORY_KEY, JSON.stringify(comboHistory));

  renderComboResult(result);
  renderComboHistory();
}
// @@INSERT_DATA_BLOCK_15@@

function classifyFood(food) {
  const f = food.toLowerCase();
  for (const [subcat, info] of Object.entries(FOOD_SUBCATS)) {
    if (info.match.some(m => f.includes(m) || m.includes(f))) return { subcat, ...info };
  }
  return null;
}

function generateBasicRecipe(foodList, mo) {
  const texture = mo < 8 ? 'puree or mash very smooth' : mo < 10 ? 'mash with some soft lumps' : 'chop into small soft pieces';
  const classified = foodList.map(f => ({ name: f, info: classifyFood(f) }));
  const withInfo = classified.filter(c => c.info);
  const without = classified.filter(c => !c.info);

  // Single food with known sub-category — give specific recipe
  if (foodList.length === 1 && withInfo.length === 1) {
    const { name, info } = withInfo[0];
    const steps = [];
    if (info.cook === 'none') {
      steps.push(`1. ${info.method}.`);
      steps.push(`2. ${texture === 'puree or mash very smooth' ? 'Ensure completely smooth' : 'Serve as is or mash lightly'}.`);
      if (!['ghee','butter','oil','cream'].some(x => name.includes(x))) steps.push('3. Add ½ tsp ghee for healthy fats.');
    } else if (info.cook === 'soak+grind') {
      steps.push(`1. Soak ${name} for ${info.time}.`);
      steps.push('2. Peel off skin (for almonds, use warm water).');
      steps.push('3. Grind to very fine paste with 2 tbsp water.');
      steps.push('4. Mix 1 tsp paste into porridge, dal, or warm milk.');
    } else if (info.cook === 'roast+powder') {
      steps.push(`1. Dry roast ${name} on low heat for ${info.time} until fragrant.`);
      steps.push('2. Cool completely, then grind to fine powder.');
      steps.push('3. Store in airtight jar. Add 1 tsp to porridge or dal.');
    } else if (info.cook === 'blanch') {
      steps.push(`1. Wash ${name} thoroughly — 3–4 rinses in running water.`);
      steps.push(`2. Blanch in boiling water for ${info.time}.`);
      steps.push('3. Drain, cool, and puree with 1–2 tbsp water.');
      steps.push('4. Mix 1–2 tsp into dal, khichdi, or roti dough. Add ghee.');
    } else if (info.cook === 'temper') {
      steps.push(`1. ${info.method}.`);
      steps.push('2. Use only a tiny pinch — baby portions need much less than adult.');
      steps.push('3. Always cook with food, never give raw spices.');
    } else {
      steps.push(`1. Wash and prepare ${name}.`);
      steps.push(`2. ${info.method}${info.time !== '0 min' ? ' for ' + info.time : ''}.`);
      steps.push(`3. ${texture}.`);
      steps.push('4. Add ½ tsp ghee. Serve warm.');
    }
    return steps.join('\n');
  }

  // Multi-food combination — group by cooking method
  const groups = {};
  withInfo.forEach(({ name, info }) => {
    const key = info.cook;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ name, info });
  });

  const steps = [];
  let stepN = 1;

  // Soak items first
  const soakItems = [...(groups['soak+grind'] || []), ...(groups['soak+cook'] || []), ...(groups['soak'] || [])];
  if (soakItems.length > 0) {
    steps.push(`${stepN++}. Soak ${soakItems.map(s => s.name).join(' + ')} in advance (${soakItems[0].info.time}).`);
  }

  // Pressure cook items
  const pressureItems = [...(groups['pressure'] || [])];
  const steamItems = [...(groups['steam'] || []), ...(groups['steam/boil'] || []), ...(groups['steam/sauté'] || [])];
  const rawItems = [...(groups['none'] || []), ...(groups['raw'] || [])];
  const blanch = groups['blanch'] || [];
  const porridge = groups['porridge'] || [];
  const griddle = [...(groups['griddle'] || []), ...(groups['steam/griddle'] || [])];

  if (pressureItems.length > 0) {
    steps.push(`${stepN++}. Wash ${pressureItems.map(s => s.name).join(', ')}. Pressure cook with water — ${pressureItems.some(s => s.info.time.includes('5')) ? '5–6' : '3–4'} whistles.`);
  }
  if (porridge.length > 0 && pressureItems.length === 0) {
    steps.push(`${stepN++}. ${porridge[0].info.method} for ${porridge[0].info.time}. Stir continuously to avoid lumps.`);
  }
  if (steamItems.length > 0) {
    steps.push(`${stepN++}. Peel and chop ${steamItems.map(s => s.name).join(', ')}. Steam ${steamItems[0].info.time} until fork-tender.`);
  }
  if (blanch.length > 0) {
    steps.push(`${stepN++}. Wash ${blanch.map(s => s.name).join(', ')} well. Blanch 2–3 min in boiling water, drain and puree.`);
  }
  if (griddle.length > 0) {
    steps.push(`${stepN++}. Prepare ${griddle.map(s => s.name).join(', ')} — ${griddle[0].info.method}.`);
  }

  // Combine and finish
  if (pressureItems.length > 0 || steamItems.length > 0 || porridge.length > 0) {
    steps.push(`${stepN++}. ${texture}. Combine cooked ingredients.`);
  }
  if (rawItems.length > 0) {
    const softFruits = rawItems.filter(r => r.info.cook === 'none' && !['ghee','butter','oil','cream'].some(x => r.name.includes(x)));
    if (softFruits.length > 0) {
      steps.push(`${stepN++}. Mash ${softFruits.map(s => s.name).join(', ')} fresh and ${pressureItems.length > 0 || steamItems.length > 0 ? 'serve alongside or mix in' : 'serve immediately'}.`);
    }
  }

  const hasFat = foodList.some(f => ['ghee','butter','oil','cream','avocado','coconut'].some(x => f.includes(x)));
  if (!hasFat) steps.push(`${stepN++}. Add ½ tsp ghee for healthy fats. Serve warm.`);
  else steps.push(`${stepN++}. Serve warm.`);

  if (without.length > 0 && steps.length <= 2) {
    // Fallback for unrecognised foods
    return `1. Wash and prepare ${foodList.join(', ')}.\n2. ${mo < 8 ? 'Steam until very soft, puree smooth' : 'Cook until soft, mash with some texture'}.\n3. Add ½ tsp ghee. Serve warm.`;
  }

  return steps.join('\n');
}

function generateDos(foodList, tags) {
  const dos = [];
  const foodStr = foodList.join(' ');
  const classified = foodList.map(f => ({ name:f, info:classifyFood(f) })).filter(c => c.info);

  // Tag-based
  if (tags.includes('iron-rich')) dos.push('Pair with Vitamin C source (lemon, tomato, orange) — boosts iron absorption up to 3×');
  if (tags.includes('protein-rich')) dos.push('Great protein source — include in at least 2 meals daily at this age');
  if (tags.includes('brain-health') || tags.includes('omega-3')) dos.push('Brain-healthy fats are critical during rapid neural development');
  if (tags.includes('bone-health')) dos.push('Excellent for bone growth — calcium needs are high during first year');
  if (tags.includes('vitamin-A')) dos.push('Rich in Vitamin A — essential for vision and immune function');
  if (tags.includes('constipation-relief')) dos.push('Natural stool softener — great if baby is constipated');
  if (tags.includes('energy')) dos.push('Good energy food — complex carbs for sustained activity');
  if (tags.includes('gut-health') || tags.includes('fermented')) dos.push('Promotes healthy gut flora — aids digestion and immunity');

  // Sub-category-specific
  const subcats = new Set(classified.map(c => c.info.subcat));
  if (subcats.has('porridge')) dos.push('Porridge consistency adjusts with water — start thin, thicken as baby adapts');
  if (subcats.has('leafy')) dos.push('Leafy greens are best mixed into dal or grain — not as standalone for babies');
  if (subcats.has('rootVeg')) dos.push('Root vegetables are naturally sweet and filling — great first foods');
  if (subcats.has('fermented')) dos.push('Fermented batter (idli/dosa) is easier to digest than regular grain');
  if (subcats.has('nut')) dos.push('Nut pastes are excellent fat + protein — introduce one nut at a time');
  if (subcats.has('seed')) dos.push('Seed powders store well — make a batch and add daily to porridge');
  if (subcats.has('softFruit')) dos.push('Ripe is key — unripe fruit is hard to digest and tastes bitter');
  if (subcats.has('gourdVeg')) dos.push('Gourds are mild and hydrating — ideal for summer and when baby is unwell');
  if (subcats.has('egg')) dos.push('Egg yolk is one of the best single foods for babies — iron, zinc, choline, DHA');
  if (subcats.has('fish')) dos.push('Fish provides DHA for brain development — check thoroughly for bones');
  if (subcats.has('khichdi')) dos.push('Khichdi is the perfect complete meal — protein + carb + easy to digest');

  // Food-specific
  if (foodStr.includes('ragi')) dos.push('Ragi is the best iron + calcium grain for Indian babies — make it a staple');
  if (foodStr.includes('ghee')) dos.push('Ghee helps absorb fat-soluble vitamins (A, D, E, K) and adds calories');
  if (foodStr.includes('curd') || foodStr.includes('dahi')) dos.push('Use homemade curd for freshest probiotics');
  if (foodStr.includes('moringa') || foodStr.includes('drumstick')) dos.push('Moringa has 7× more Vitamin C than orange, 4× calcium of milk');

  if (dos.length === 0) dos.push('Fresh, homemade preparation is always best for babies');
  dos.push('Watch for any reaction for 24 hours after new foods');
  return dos.slice(0, 5);
}

function generateDonts(foodList, tags, mo) {
  const donts = [];
  const foodStr = foodList.join(' ');
  const classified = foodList.map(f => ({ name:f, info:classifyFood(f) })).filter(c => c.info);
  const subcats = new Set(classified.map(c => c.info.subcat));

  donts.push('Don\'t add salt, sugar, or honey (honey unsafe before 12 months)');
  if (mo < 8) donts.push('Puree or mash very smooth — no chunks yet at this age');
  else if (mo < 10) donts.push('Keep pieces soft and small — gag reflex is still developing');

  // Sub-category-specific
  if (subcats.has('nut')) donts.push('Never give whole or chopped nuts — always grind to smooth paste/powder');
  if (subcats.has('seed')) donts.push('Never give whole seeds — always grind to fine powder');
  if (subcats.has('leafy')) donts.push('Don\'t give leafy greens daily — 2–3 times/week is ideal (nitrate/oxalate content)');
  if (subcats.has('curd')) donts.push('Don\'t heat curd/yogurt — kills beneficial bacteria. Room temperature only');
  if (subcats.has('spice')) donts.push('Use barely a pinch — baby portions need 1/10th of adult amounts');
  if (subcats.has('sweetener')) donts.push('Avoid jaggery/gur before 12 months — treated as added sugar by paediatricians');
  if (subcats.has('egg')) donts.push('Avoid egg white initially — introduce yolk only for the first few times');
  if (subcats.has('fish')) donts.push('Check every flake for tiny bones — even "boneless" fillets can have pin bones');
  if (subcats.has('legume')) donts.push('Soak overnight and cook very well — undercooked legumes cause gas and bloating');
  if (subcats.has('tapioca')) donts.push('Must be fully cooked until translucent — undercooked sabudana is hard to digest');
  if (subcats.has('fermented')) donts.push('Don\'t use fermented batter older than 2 days — freshness matters for babies');
  if (subcats.has('cruciferous')) donts.push('Can cause gas in some babies — introduce gradually and watch for discomfort');
  if (subcats.has('juicyFruit')) donts.push('Remove all seeds — even small grape seeds can be a choking hazard');

  // Food-specific
  if (foodStr.includes('banana')) donts.push('Avoid if stools are already firm — banana can worsen constipation');
  if (foodStr.includes('rice') && !foodStr.includes('khichdi')) donts.push('Don\'t make rice the only grain — rotate with ragi, oats, dalia for variety');
  if (foodStr.includes('tomato') || foodStr.includes('citrus') || foodStr.includes('orange') || foodStr.includes('pineapple')) {
    donts.push('May cause rash around mouth — not an allergy, just skin irritation from acid');
  }
  if (foodStr.includes('beetroot')) donts.push('Red/pink stool after beetroot is normal — not blood');
  if (foodStr.includes('potato')) donts.push('Don\'t fry for babies — steam, boil, or bake only');

  donts.push('Don\'t force feed — let baby set the pace and stop when she turns away');
  return donts.slice(0, 5);
}

function renderComboResult(r) {
  const el = document.getElementById('comboResult');
  const vClass = r.verdict === 'safe' ? '' : r.verdict === 'caution' ? ' caution' : ' avoid';
  const vTextClass = r.verdict === 'safe' ? 'safe' : r.verdict === 'caution' ? 'caution' : 'avoid';

  let html = `<div class="combo-result${vClass}">`;
  html += `<div class="combo-verdict ${vTextClass}">${r.verdict_emoji || zi('check')} ${r.headline}</div>`;
  if (r.explanation) html += `<div class="combo-body">${escHtml(r.explanation).replace(/\n/g,'<br>')}</div>`;

  if (r.nutrition_highlights) {
    html += `<div class="combo-section"><div class="combo-section-title">${zi('bowl')} Nutrition</div><div class="combo-body">${r.nutrition_highlights}</div></div>`;
  }

  if (r.new_foods && r.new_foods.length > 0) {
    html += `<div class="combo-section"><div class="combo-section-title">🆕 New foods to introduce first</div><div class="combo-body">${r.new_foods.join(', ')} — introduce each alone for 3 days before combining.</div></div>`;
  }

  if (r.allergen_notes && r.allergen_notes.length > 0) {
    html += `<div class="combo-section"><div class="combo-section-title">${zi('siren')} Allergen alert</div><div class="combo-body">${r.allergen_notes.join('<br>')}</div></div>`;
  }

  if (r.recipe) {
    html += `<div class="combo-section"><div class="combo-section-title">${zi('note')} Recipe</div><div class="combo-recipe">${escHtml(r.recipe).replace(/\n/g,'<br>')}</div></div>`;
  }

  if ((r.dos && r.dos.length) || (r.donts && r.donts.length)) {
    html += `<div class="combo-section"><div class="combo-section-title">${zi('check')} Dos & ${zi('warn')} Don'ts</div><div class="combo-dos">`;
    if (r.dos) r.dos.forEach(d => { html += `<div class="do">${zi('check')} ${escHtml(d)}</div>`; });
    if (r.donts) r.donts.forEach(d => { html += `<div class="dont">${zi('warn')} ${escHtml(d)}</div>`; });
    html += `</div></div>`;
  }

  // Smart synergy-aware pairings (enhanced Feature 5)
  const queryFoods = (r._queryFoods || []);
  if (queryFoods.length > 0 && typeof getSynergyPairings === 'function') {
    const pairings = getSynergyPairings(queryFoods);
    if (pairings.length > 0) {
      html += `<div class="combo-section"><div class="combo-section-title">${zi('handshake')} Smart Pairings</div>`;
      html += `<div class="fx-col g4">`;
      pairings.forEach(p => {
        const gapNote = p.gapsFilled && p.gapsFilled.length > 0 ? ` · fills ${p.gapsFilled.join(', ')}` : '';
        html += `<div class="sp-pair-card ptr"  onclick="document.getElementById('comboInput').value='${escHtml(queryFoods.join(' + '))} + ${escHtml(p.partner)}';activateBtn('comboCheckBtn',true);checkFoodCombo();">
          <div class="sp-pair-foods">${p.emoji} Add <strong>${escHtml(p.partner)}</strong></div>
          <div class="sp-pair-reason">${escHtml(p.reason)}${gapNote}</div>
          <div><span class="sp-pair-type sp-type-${p.type}">${p.type}</span></div>
        </div>`;
      });
      html += `</div></div>`;
    } else if (r.pairs_well_with) {
      html += `<div class="combo-section"><div class="combo-section-title">${zi('handshake')} Pairs well with</div><div class="combo-body">${r.pairs_well_with}</div></div>`;
    }
  } else if (r.pairs_well_with) {
    html += `<div class="combo-section"><div class="combo-section-title">${zi('handshake')} Pairs well with</div><div class="combo-body">${r.pairs_well_with}</div></div>`;
  }

  // Ziva's history with these foods
  const queryFoods2 = r._queryFoods || [];
  if (queryFoods2.length > 0) {
    let historyHtml = '';
    queryFoods2.forEach(food => {
      const h = getFoodHistory(food);
      if (h) historyHtml += h;
    });
    if (historyHtml) {
      html += `<div class="combo-section"><div class="combo-section-title">${zi('note')} Ziva\'s History</div>${historyHtml}</div>`;
    }

    // Sleep correlation
    const sleepHtml = getFoodSleepCorrelation(queryFoods2);
    if (sleepHtml) {
      html += `<div class="combo-section"><div class="combo-section-title">${zi('moon')} Sleep Connection</div>${sleepHtml}</div>`;
    }
  }

  html += `</div>`;
  el.innerHTML = html;
}

function renderComboHistory() {
  const el = document.getElementById('comboHistory');
  if (!el || comboHistory.length === 0) { if (el) el.innerHTML = ''; return; }

  let html = `<div style="font-size:var(--fs-sm);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--light);margin-bottom:6px;">Recent checks</div>`;
  comboHistory.slice(0, 5).forEach(h => {
    const emoji = h.result.verdict === 'safe' ? zi('check') : h.result.verdict === 'caution' ? zi('warn') : zi('warn');
    html += `<div class="combo-hist-item" onclick="document.getElementById('comboInput').value='${h.q.replace(/'/g, "\\'")}';renderComboResult(comboHistory.find(x=>x.q==='${h.q.replace(/'/g, "\\'")}').result)">
      <div class="combo-hist-q">${emoji} ${escHtml(h.q)}</div>
      <div class="combo-hist-a">${escHtml(h.result.headline)}</div>
    </div>`;
  });
  el.innerHTML = html;
}

function renderTips() {
  const list = document.getElementById('tipsList');
  const countEl = document.getElementById('tipsCount');
  list.innerHTML = '';
  const active = ALL_TIPS.filter(t => {
    try { return t.condition(feedingData); } catch { return false; }
  });

  // Generate dynamic synergy tips based on today's meals
  const todayEntry = feedingData[today()];
  if (todayEntry) {
    const todayFoods = [];
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      if (!isRealMeal(todayEntry[meal])) return;
      todayEntry[meal].split(/[,+]/).forEach(f => {
        const clean = f.trim().toLowerCase();
        if (clean.length > 1) todayFoods.push(clean);
      });
    });

    // Find synergy suggestions: foods in today's meals that have synergy partners not yet used today
    const todaySet = new Set(todayFoods);
    const suggestedSynergies = [];
    const seen = new Set();
    todayFoods.forEach(food => {
      FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
        let match = null, partner = null;
        if (food.includes(f1) || f1.includes(food)) { match = f1; partner = f2; }
        else if (food.includes(f2) || f2.includes(food)) { match = f2; partner = f1; }
        if (!match || !partner) return;
        // Check partner not already in today's meals
        const partnerUsed = todayFoods.some(tf => tf.includes(partner) || partner.includes(tf));
        if (partnerUsed) return;
        const key = match + '|' + partner;
        if (seen.has(key)) return;
        seen.add(key);
        suggestedSynergies.push({ food: match, partner, reason, type });
      });
    });

    // Add up to 3 synergy tips
    suggestedSynergies.slice(0, 3).forEach(syn => {
      const emoji = syn.type === 'absorption' ? zi('link') : syn.type === 'complete' ? zi('sparkle') : zi('sprout');
      active.push({
        type: 'add',
        icon: emoji,
        title: `Add ${syn.partner} today`,
        body: `${syn.reason}. You already have ${syn.food} in today's meals — pairing with ${syn.partner} would boost nutrition.`,
      });
    });
  }
  if (countEl) countEl.textContent = `${active.length} active`;
  if (active.length === 0) {
    list.innerHTML = '<div class="tips-empty">Great variety this week — no specific tips right now! ' + zi('sparkle') + '</div>';
    return;
  }

  const typeMeta = {
    avoid: { icon:zi('warn'), label:'Avoid', desc:'foods & practices to skip' },
    watch: { icon:zi('warn'), label:'Watch Out', desc:'things to monitor' },
    info:  { icon:zi('info'), label:'Good to Know', desc:'nutritional context' },
    add:   { icon:zi('check'), label:'Add to Diet', desc:'foods to include more' },
  };

  const groups = {};
  active.forEach(t => {
    if (!groups[t.type]) groups[t.type] = [];
    groups[t.type].push(t);
  });

  const typeOrder = ['avoid','watch','info','add'];
  let html = '<div class="tip-cats">';

  typeOrder.forEach(type => {
    const items = groups[type];
    if (!items || items.length === 0) return;
    const meta = typeMeta[type];
    const catId = 'tc-' + type;

    html += `
      <div>
        <div class="tip-cat-card tc-${type}" id="${catId}" data-action="toggleTipCat" data-arg="${type}">
          <div class="tc-top">
            <div class="tc-icon">${meta.icon}</div>
            <div class="tc-info-wrap">
              <div class="tc-name">${meta.label}</div>
              <div class="tc-count">${items.length} ${meta.desc}</div>
            </div>
            <div class="tc-chevron">▾</div>
          </div>
        </div>
        <div class="tc-items tc-${type}" id="tc-items-${type}">
          ${items.map(t => `
            <div class="tip-item ${t.type}">
              <div class="tip-icon">${t.icon}</div>
              <div class="tip-body">
                <strong>${t.title}</strong>
                <span>${t.body}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  });

  html += '</div>';
  list.innerHTML = html;
}

function toggleTipCat(type) { toggleCatCard('tc-' + type, 'tc-items-' + type); }
// @@INSERT_DATA_BLOCK_16@@
const _foodGroupCache = {};

function classifyFoodToGroup(foodName) {
  const key = foodName.toLowerCase().trim();
  if (_foodGroupCache[key]) return _foodGroupCache[key];
  for (const [gid, group] of Object.entries(FOOD_TAX)) {
    for (const [sid, sub] of Object.entries(group.subs)) {
      for (const k of sub.keys) {
        if (key.includes(k) || k.includes(key)) {
          const result = { group: gid, sub: sid, groupLabel: group.label, subLabel: sub.label };
          _foodGroupCache[key] = result;
          return result;
        }
      }
    }
  }
  _foodGroupCache[key] = null;
  return null;
}

function getVarietyTarget(ageMonths) {
  const mo = Math.min(Math.max(Math.floor(ageMonths), 6), 12);
  return VARIETY_TARGETS[mo] || 10;
}

function extractDayFoods(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return [];
  const foods = [];
  ['breakfast','lunch','dinner','snack'].forEach(m => {
    const val = entry[m];
    if (!val || val === SKIPPED_MEAL) return;
    val.split(/[,+]/).forEach(f => {
      const clean = f.trim().toLowerCase();
      if (clean.length > 1) foods.push(clean);
    });
  });
  return [...new Set(foods)];
}

function computeVarietyScore(windowDays) {
  windowDays = windowDays || 7;
  const todayStr = today();
  const todayDate = new Date(todayStr);
  const ageM = ageAt().months;
  const target = getVarietyTarget(ageM);
  const allFoods = new Set();
  const groupHits = {};
  const groupLastDate = {};
  const subHits = {};

  // Initialize groups
  const activeGroups = [];
  Object.keys(FOOD_TAX).forEach(gid => {
    groupHits[gid] = new Set();
    groupLastDate[gid] = null;
    Object.keys(FOOD_TAX[gid].subs).forEach(sid => {
      subHits[gid + ':' + sid] = null; // last date
    });
  });

  // Scan window
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayFoods = extractDayFoods(ds);
    dayFoods.forEach(f => {
      allFoods.add(f);
      const cls = classifyFoodToGroup(f);
      if (cls) {
        groupHits[cls.group].add(f);
        if (!groupLastDate[cls.group] || ds > groupLastDate[cls.group]) groupLastDate[cls.group] = ds;
        const subKey = cls.group + ':' + cls.sub;
        if (!subHits[subKey] || ds > subHits[subKey]) subHits[subKey] = ds;
      }
    });
  }

  // Determine active groups (exclude nonveg if never used in history)
  const hasNonveg = Object.keys(feedingData).some(d => {
    const e = feedingData[d];
    const all = [e.breakfast, e.lunch, e.dinner].join(' ').toLowerCase();
    return FOOD_TAX.nonveg && Object.values(FOOD_TAX.nonveg.subs).some(s => s.keys.some(k => all.includes(k)));
  });
  Object.keys(FOOD_TAX).forEach(gid => {
    if (gid === 'nonveg' && !hasNonveg) return;
    if (gid === 'spices') return; // spices are flavor, not a food group target
    activeGroups.push(gid);
  });

  const groupCoverage = {};
  activeGroups.forEach(gid => {
    const daysSince = groupLastDate[gid] ? Math.floor((todayDate - new Date(groupLastDate[gid])) / 86400000) : null;
    groupCoverage[gid] = {
      hit: groupHits[gid].size > 0,
      count: groupHits[gid].size,
      lastDate: groupLastDate[gid],
      daysSince: daysSince
    };
  });
  const groupsHit = activeGroups.filter(g => groupCoverage[g].hit).length;
  const groupsTotal = activeGroups.length;

  // Gaps: food groups absent 7+ days
  const gaps = [];
  activeGroups.forEach(gid => {
    const gc = groupCoverage[gid];
    if (gc.daysSince === null || gc.daysSince >= 7) {
      gaps.push({
        group: gid, label: FOOD_TAX[gid].label,
        daysSince: gc.daysSince, suggestion: getGroupSuggestion(gid, null)
      });
    }
  });

  // Subcategory gaps for vegs (leafy is important)
  const subcategoryGaps = [];
  ['vegs'].forEach(gid => {
    Object.keys(FOOD_TAX[gid].subs).forEach(sid => {
      const subKey = gid + ':' + sid;
      const lastD = subHits[subKey];
      const daysSince = lastD ? Math.floor((todayDate - new Date(lastD)) / 86400000) : null;
      if ((daysSince === null || daysSince >= 7) && sid === 'leafy') {
        subcategoryGaps.push({
          group: gid, sub: sid, label: FOOD_TAX[gid].subs[sid].label,
          daysSince: daysSince, suggestion: getGroupSuggestion(gid, sid)
        });
      }
    });
  });

  // Trend vs previous window
  const prevFoods = new Set();
  const prevGroupsHit = new Set();
  for (let i = windowDays; i < windowDays * 2; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayFoods = extractDayFoods(ds);
    dayFoods.forEach(f => {
      prevFoods.add(f);
      const cls = classifyFoodToGroup(f);
      if (cls && activeGroups.includes(cls.group)) prevGroupsHit.add(cls.group);
    });
  }

  const score = target > 0 ? Math.min(+(allFoods.size / target).toFixed(1), 2.0) : 0;
  let rating = 'needs work';
  if (score >= 1.0) rating = 'great';
  else if (score >= 0.8) rating = 'good';
  else if (score >= 0.5) rating = 'building';

  return {
    uniqueFoods: allFoods.size, target, score, rating,
    groupCoverage, groupsHit, groupsTotal,
    gaps, subcategoryGaps,
    trend: {
      uniqueFoodsDelta: allFoods.size - prevFoods.size,
      groupsDelta: groupsHit - prevGroupsHit.size,
      direction: allFoods.size > prevFoods.size ? 'improving' : allFoods.size < prevFoods.size ? 'declining' : 'stable'
    }
  };
}
// @@INSERT_DATA_BLOCK_17@@

function getGroupSuggestion(group, sub) {
  if (sub && SUB_SUGGESTIONS[group + ':' + sub]) return SUB_SUGGESTIONS[group + ':' + sub];
  return GROUP_SUGGESTIONS[group] || 'Try adding variety from this group';
}

// ─────────────────────────────────────────
// FOOD-POOP CORRELATION ENGINE
// ─────────────────────────────────────────

let _cachedCorrelations = null;
let _correlationsComputedAt = 0;
let _correlationsDataHash = '';

function _corrDataHash() {
  return Object.keys(feedingData).length + ':' + poopData.length;
}

function computeFoodPoopCorrelations() {
  const now = Date.now();
  const hash = _corrDataHash();
  if (_cachedCorrelations && (now - _correlationsComputedAt) < 60000 && hash === _correlationsDataHash) {
    return _cachedCorrelations;
  }

  // 1. Build date→foods map
  const dateFoods = {};
  Object.keys(feedingData).forEach(dateStr => {
    dateFoods[dateStr] = extractDayFoods(dateStr);
  });

  // 2. Build date→poopProfile map
  const datePoops = {};
  const ABNORMAL_CON = ['hard', 'pellet', 'watery', 'loose'];
  const ALERT_COLORS = ['red', 'black', 'white'];
  poopData.forEach(p => {
    if (!p.date) return;
    if (!datePoops[p.date]) datePoops[p.date] = { entries: [], isAbnormal: false, worstConsistency: 'soft' };
    const dp = datePoops[p.date];
    dp.entries.push(p);
    if (ABNORMAL_CON.includes(p.consistency)) dp.isAbnormal = true;
    if (p.color && ALERT_COLORS.includes(p.color)) dp.isAbnormal = true;
    if (p.blood) dp.isAbnormal = true;
    if (p.mucus) dp.isAbnormal = true;
    // Track worst consistency
    const CON_RANK = { pellet: 0, watery: 1, hard: 2, loose: 3, normal: 4, soft: 5 };
    const curRank = CON_RANK[dp.worstConsistency] ?? 5;
    const newRank = CON_RANK[p.consistency] ?? 4;
    if (newRank < curRank) dp.worstConsistency = p.consistency;
  });

  // 3. Count food occurrences across all dates
  const foodDates = {}; // food → [date1, date2, ...]
  Object.entries(dateFoods).forEach(([dateStr, foodList]) => {
    foodList.forEach(f => {
      if (!foodDates[f]) foodDates[f] = [];
      foodDates[f].push(dateStr);
    });
  });

  // 4. For each food with 3+ appearances, compute correlation
  const watchSet = new Set((foods || []).filter(f => f.reaction === 'watch').map(f => f.name.toLowerCase().trim()));
  const results = [];

  Object.entries(foodDates).forEach(([food, dates]) => {
    if (dates.length < 2) return; // need at least 2 occurrences
    const isWatch = watchSet.has(food);
    if (dates.length < 3 && !isWatch) return; // need 3+ unless watch list

    let totalWithPoopData = 0;
    let abnormalAfter = 0;
    const conBreakdown = {};
    const colorFlags = {};
    const symptomFlags = { blood: 0, mucus: 0 };
    const evidence = [];

    dates.forEach(eatDate => {
      // Check lag window: same day + next day
      const nextDay = addDays(eatDate, 1);
      const windowDates = [eatDate, nextDay];
      let foundPoop = false;
      let windowAbnormal = false;
      let worstCon = 'soft';
      let worstColor = null;
      let hasSym = false;

      windowDates.forEach(wd => {
        const dp = datePoops[wd];
        if (!dp) return;
        foundPoop = true;
        if (dp.isAbnormal) windowAbnormal = true;
        const CON_RANK = { pellet: 0, watery: 1, hard: 2, loose: 3, normal: 4, soft: 5 };
        if ((CON_RANK[dp.worstConsistency] ?? 5) < (CON_RANK[worstCon] ?? 5)) worstCon = dp.worstConsistency;
        dp.entries.forEach(p => {
          if (p.color && ALERT_COLORS.includes(p.color)) worstColor = p.color;
          if (p.blood) symptomFlags.blood++;
          if (p.mucus) symptomFlags.mucus++;
        });
      });

      if (!foundPoop) return;
      totalWithPoopData++;
      if (windowAbnormal) abnormalAfter++;
      conBreakdown[worstCon] = (conBreakdown[worstCon] || 0) + 1;
      if (worstColor) colorFlags[worstColor] = (colorFlags[worstColor] || 0) + 1;

      evidence.push({
        ate: eatDate, poopDate: datePoops[eatDate] ? eatDate : nextDay,
        consistency: worstCon, color: worstColor || 'normal',
        abnormal: windowAbnormal
      });
    });

    if (totalWithPoopData < 2) return;
    if (totalWithPoopData < 3 && !isWatch) return;

    const correlationRate = totalWithPoopData > 0 ? abnormalAfter / totalWithPoopData : 0;
    let confidence = 'insufficient';
    if (totalWithPoopData >= 8) confidence = 'high';
    else if (totalWithPoopData >= 5) confidence = 'moderate';
    else if (totalWithPoopData >= 3) confidence = 'low';

    let status = 'clear';
    const watchThreshold = isWatch ? 0.2 : 0.3;
    if (correlationRate >= 0.7 && (confidence === 'moderate' || confidence === 'high')) status = 'likely';
    else if (correlationRate >= 0.5 && (confidence === 'moderate' || confidence === 'high')) status = 'suspected';
    else if (correlationRate >= watchThreshold && confidence !== 'insufficient') status = 'watch';

    if (status !== 'clear') {
      results.push({
        food, totalOccurrences: totalWithPoopData, abnormalAfter,
        correlationRate, confidence, status, isWatchList: isWatch,
        breakdown: { consistency: conBreakdown, colors: colorFlags, symptoms: symptomFlags },
        dates: evidence.slice(-5).reverse()
      });
    }
  });

  // Sort: likely → suspected → watch, then by correlationRate desc
  const STATUS_RANK = { likely: 0, suspected: 1, watch: 2 };
  results.sort((a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status]) || (b.correlationRate - a.correlationRate));

  // Count clear foods
  const totalTrackedFoods = Object.keys(foodDates).filter(f => foodDates[f].length >= 3).length;
  const flaggedFoods = results.length;

  _cachedCorrelations = { results, totalTrackedFoods, clearFoods: totalTrackedFoods - flaggedFoods, computedAt: now };
  _correlationsComputedAt = now;
  _correlationsDataHash = hash;
  return _cachedCorrelations;
}



// Tomorrow's Prep — Evening Planning Card
// ════════════════════════════════════════

// Planned meals carry-forward storage
let _tomorrowPlanned = null;

function shouldShowTomorrowPrep() {
  var hour = new Date().getHours();
  if (hour < 18) return false; // before 6 PM
  // Hide if tomorrow already has meals logged
  var tomorrow = _offsetDateStr(today(), 1);
  var tomorrowEntry = feedingData[tomorrow];
  if (tomorrowEntry && isRealMeal(tomorrowEntry.breakfast)) return false;
  // Need minimum data to generate smart suggestions
  if ((foods || []).length < 5) return false;
  return true;
}

// ── Meal suggestion engine ──

function _tpGetRecencyDays(foodBase) {
  var todayStr = today();
  var todayD = new Date(todayStr);
  for (var i = 0; i < 30; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var dayFoods = extractDayFoods(ds);
    if (dayFoods.some(function(f) { return _baseFoodName(f) === foodBase; })) return i;
  }
  return 30;
}

function _tpGetFoodSleepCorrelation(foodBase) {
  // Average sleep score on nights when this food was in dinner vs overall
  var withFood = [], without = [];
  var feedDates = Object.keys(feedingData).sort();
  feedDates.forEach(function(ds) {
    var sc = getDailySleepScore(ds);
    if (!sc) return;
    var dinnerFoods = [];
    var entry = feedingData[ds];
    if (entry && isRealMeal(entry.dinner)) {
      entry.dinner.split(/[,+]/).forEach(function(f) {
        var c = f.trim().toLowerCase();
        if (c.length > 1) dinnerFoods.push(_baseFoodName(c));
      });
    }
    if (dinnerFoods.includes(foodBase)) withFood.push(sc.score);
    else without.push(sc.score);
  });
  if (withFood.length < 2 || without.length < 2) return { delta: 0, count: withFood.length, insufficient: true };
  var avg = Math.round(withFood.reduce(function(a, b) { return a + b; }, 0) / withFood.length);
  var avgAll = Math.round(without.reduce(function(a, b) { return a + b; }, 0) / without.length);
  return { delta: avg - avgAll, count: withFood.length, insufficient: false };
}

function _tpGetFoodPoopCorrelation(foodBase) {
  // Average poop score on days when this food was eaten vs overall
  var withFood = [], without = [];
  var feedDates = Object.keys(feedingData).sort();
  feedDates.forEach(function(ds) {
    var ps = calcPoopScore(ds);
    if (!ps || ps.isCarryForward) return;
    var dayFoods = extractDayFoods(ds).map(function(f) { return _baseFoodName(f); });
    if (dayFoods.includes(foodBase)) withFood.push(ps.score);
    else without.push(ps.score);
  });
  if (withFood.length < 2 || without.length < 2) return { delta: 0, count: withFood.length, insufficient: true };
  var avg = Math.round(withFood.reduce(function(a, b) { return a + b; }, 0) / withFood.length);
  var avgAll = Math.round(without.reduce(function(a, b) { return a + b; }, 0) / without.length);
  return { delta: avg - avgAll, count: withFood.length, insufficient: false };
}

function _tpFoodFrequency30d(foodBase) {
  var count = 0;
  var todayD = new Date(today());
  for (var i = 0; i < 30; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var dayFoods = extractDayFoods(ds).map(function(f) { return _baseFoodName(f); });
    if (dayFoods.includes(foodBase)) count++;
  }
  return count;
}

// Score cache — cleared per generateTomorrowPrep() call
var _tpScoreCache = {};

function _tpScoreFood(foodName, ctx) {
  var base = _baseFoodName(foodName.toLowerCase().trim());
  var cacheKey = base + '|' + (ctx.meal || '');
  if (_tpScoreCache[cacheKey]) return _tpScoreCache[cacheKey];
  var nut = getNutrition(foodName) || getNutrition(base);
  var score = 0;
  var reasons = [];

  // 1. Nutrient gap fill (30%)
  var gapFill = 0;
  if (nut && nut.nutrients && ctx.gapSet) {
    nut.nutrients.forEach(function(n) {
      if (ctx.gapSet.has(n.toLowerCase())) gapFill++;
    });
    if (gapFill > 0) {
      var gapNames = nut.nutrients.filter(function(n) { return ctx.gapSet.has(n.toLowerCase()); });
      var gapDays = ctx.gapDaysMap && ctx.gapDaysMap[gapNames[0].toLowerCase()] ? ctx.gapDaysMap[gapNames[0].toLowerCase()] : 0;
      score += gapFill * 30;
      reasons.push('Covers ' + gapNames[0] + ' gap' + (gapDays > 0 ? ' (' + gapDays + ' days)' : ''));
    }
  }

  // 2. Recency gap (20%)
  var recency = _tpGetRecencyDays(base);
  if (recency >= 7) { score += 20; reasons.push('Last served ' + recency + ' days ago \u2014 good rotation pick'); }
  else if (recency >= 4) { score += 12; }
  else { score += 4; }

  // 3. Sleep correlation (15%) — only for dinner
  if (ctx.meal === 'dinner') {
    var sleepCorr = _tpGetFoodSleepCorrelation(base);
    if (!sleepCorr.insufficient && sleepCorr.delta > 3) {
      score += 15;
      reasons.push('Sleep +' + sleepCorr.delta + ' pts on ' + base + ' nights');
    } else if (!sleepCorr.insufficient && sleepCorr.delta < -5) {
      score -= 10;
    }
  }

  // 4. Poop correlation (15%)
  var poopCorr = _tpGetFoodPoopCorrelation(base);
  if (!poopCorr.insufficient && poopCorr.delta > 5) {
    score += 15;
    reasons.push('Poop score +' + poopCorr.delta + ' on ' + base + ' days');
  } else if (!poopCorr.insufficient && poopCorr.delta < -10) {
    score -= 10;
  }

  // 5. Familiarity (10%)
  var freq = _tpFoodFrequency30d(base);
  if (freq >= 3) {
    score += 10;
  } else if (freq >= 1) {
    score += 5;
  }

  // 6. Texture progression (5%)
  if (ctx.textureData) {
    var currentStage = ctx.textureData.currentStage || 'mashed';
    var stageOrder = { puree: 0, mashed: 1, soft: 2, finger: 3 };
    var foodTexture = _classifyMealTexture(foodName) || 'mashed';
    if (stageOrder[foodTexture] === (stageOrder[currentStage] || 0) + 1) {
      score += 5;
      reasons.push('Texture step-up (' + currentStage + ' \u2192 ' + foodTexture + ')');
    } else if (stageOrder[foodTexture] >= stageOrder[currentStage]) {
      score += 2;
    }
  }

  // 7. Acceptance rate (10%) — from meal intake data
  var acceptance = getFoodAcceptanceRate(base);
  if (acceptance !== null && freq >= 2) {
    var pct = Math.round(acceptance * 100);
    if (acceptance >= 0.8) { score += 10; reasons.push('She finishes ' + pct + '% \u2014 ' + getAcceptanceLabel(acceptance)); }
    else if (acceptance >= 0.5) { score += 5; }
    else { score -= 5; reasons.push('Avg intake only ' + pct + '% \u2014 ' + getAcceptanceLabel(acceptance)); }
  }

  // 8. Seasonal availability (5%)
  var seasonScore = getSeasonalScore(base);
  score += Math.round(seasonScore / 2); // max +5 or -7
  if (seasonScore >= 10) {
    reasons.push('In peak season');
  } else if (seasonScore <= -10) {
    reasons.push('Hard to find this season');
  }

  // 9. Hydration context (conditional, only when active)
  if (ctx.hydrationCtx && ctx.hydrationCtx.active && nut) {
    var isHydrating = nut.tags && (nut.tags.indexOf('hydrating') !== -1 || nut.tags.indexOf('cooling') !== -1);
    if (isHydrating) {
      var hBoost = ctx.hydrationCtx.scoringBoost || 8;
      score += hBoost;
      if (hBoost >= 15) reasons.push('Hydrating \u2014 important for outdoor day');
    }
  }

  // Enhanced reason text: cap at 2
  reasons = reasons.slice(0, 2);

  var result = { food: foodName, base: base, score: score, reasons: reasons, nutrients: nut ? nut.nutrients : [] };
  _tpScoreCache[cacheKey] = result;
  return result;
}

// Build meal combos (base + add-in, possibly + fat)
function _tpBuildCombos(meal, ctx) {
  var introduced = (foods || []).map(function(f) { return f.name.toLowerCase().trim(); });
  var introducedSet = new Set(introduced);

  // Reaction window exclusion: foods introduced in last 3 days
  var threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  var recentIntroNames = new Set(
    (foods || []).filter(function(f) { return f.date && new Date(f.date) >= threeDaysAgo; })
      .map(function(f) { return _baseFoodName(f.name.toLowerCase().trim()); })
  );

  // Reaction watch list
  var reactionFoods = new Set();
  if (typeof currentReaction !== 'undefined' && currentReaction && currentReaction.food) {
    reactionFoods.add(_baseFoodName(currentReaction.food.toLowerCase()));
  }

  function isEligible(foodName) {
    var base = _baseFoodName(foodName.toLowerCase().trim());
    if (recentIntroNames.has(base)) return false;
    if (reactionFoods.has(base)) return false;
    if (ctx.usedAcrossMeals && ctx.usedAcrossMeals.has(base)) return false;
    return true;
  }

  var yesterday = _offsetDateStr(today(), -1);
  var combos = [];

  // ═══ PHASE 1: Mine historical patterns ═══
  try {
    var patterns = ctx.minedPatterns || _tpMineMealPatterns();
    var historicalCombos = patterns[meal] ? patterns[meal].combos : [];

    historicalCombos.forEach(function(hc) {
      // Check all foods are eligible
      var allEligible = hc.foods.every(function(f) {
        return isEligible(f) && (introducedSet.has(f) || Array.from(introducedSet).some(function(i) { return _baseFoodName(i) === f; }));
      });
      if (!allEligible) return;

      // Skip if served yesterday (recency dedup)
      if (hc.lastDate === yesterday) return;

      // Acceptance filter: reject combos with <30% avg intake when we have 5+ servings
      if (hc.count >= 5 && hc.avgIntake < 0.3) return;

      // Score each food in the combo
      var totalScore = 0;
      var allReasons = [];
      hc.foods.forEach(function(f) {
        var fScore = _tpScoreFood(f, ctx);
        totalScore += fScore.score;
        allReasons = allReasons.concat(fScore.reasons);
      });

      // Combo-level bonuses
      // Acceptance bonus
      if (hc.count >= 3 && hc.avgIntake >= 0.7) {
        totalScore += 15;
        allReasons.push('She eats ' + Math.round(hc.avgIntake * 100) + '% of this combo (' + hc.count + ' times)');
      }

      // Synergy bonus within combo (max +8)
      var hasSynergy = false;
      for (var si = 0; si < hc.foods.length && !hasSynergy; si++) {
        for (var sj = si + 1; sj < hc.foods.length && !hasSynergy; sj++) {
          var syn = getSynergy(hc.foods[si], hc.foods[sj]);
          if (syn) { totalScore += 8; hasSynergy = true; }
        }
      }

      // Seasonal boost for the combo
      var seasonalSum = 0;
      hc.foods.forEach(function(f) { seasonalSum += getSeasonalScore(f); });
      if (hc.foods.length > 0) {
        totalScore += Math.round(seasonalSum / hc.foods.length / 2);
      }

      // Historical frequency bonus — proven combos rank higher
      if (hc.count >= 4) totalScore += 10;
      else if (hc.count >= 2) totalScore += 5;

      combos.push({
        foods: hc.foods,
        score: totalScore,
        reasons: allReasons.slice(0, 3),
        bases: hc.foods.map(function(f) { return _baseFoodName(f); }),
        source: 'history',
        historyCount: hc.count,
        avgIntake: hc.avgIntake
      });
    });
  } catch (e) { /* best effort history mining */ }

  // ═══ PHASE 2: Generate new combos if fewer than 3 survived ═══
  if (combos.length < 3) {
    var fallbackCombos = _tpBuildCombosLegacy(meal, ctx, introducedSet, isEligible);
    fallbackCombos.forEach(function(fc) {
      fc.source = 'generated';
      combos.push(fc);
    });
  }

  // Sort by score descending
  combos.sort(function(a, b) { return b.score - a.score; });

  // Deduplicate — no two combos with identical base sets
  var seen = new Set();
  var unique = [];
  combos.forEach(function(c) {
    var key = c.bases.slice().sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(c);
  });

  return unique;
}

// Legacy combo builder — used as fallback when history < 7 days
function _tpBuildCombosLegacy(meal, ctx, introducedSet, isEligible) {
  // Categorize introduced foods
  var grainBases = ['ragi', 'rice', 'oats', 'dalia', 'suji', 'poha', 'bajra', 'jowar', 'sabudana', 'idli', 'dosa', 'khichdi'];
  var dalBases = ['moong dal', 'masoor dal', 'toor dal', 'chana dal', 'urad dal', 'rajma'];
  var vegBases = ['carrot', 'beetroot', 'beans', 'bottle gourd', 'lauki', 'spinach', 'sweet potato', 'pumpkin', 'broccoli', 'zucchini', 'potato', 'drumstick'];
  var fruitBases = ['banana', 'apple', 'pear', 'avocado', 'blueberry', 'mango', 'papaya', 'orange', 'grape', 'watermelon', 'pomegranate', 'blackberry', 'date (fruit)'];
  var fatBases = ['ghee', 'almonds', 'walnut', 'flaxseed', 'sesame', 'coconut'];
  var dairyBases = ['curd', 'paneer', 'cheese'];

  function filterAvailable(arr) {
    return arr.filter(function(f) {
      return isEligible(f) && (introducedSet.has(f) || Array.from(introducedSet).some(function(i) { return _baseFoodName(i) === _baseFoodName(f); }));
    });
  }

  var avGrains = filterAvailable(grainBases);
  var avDals = filterAvailable(dalBases);
  var avVegs = filterAvailable(vegBases);
  var avFruits = filterAvailable(fruitBases);
  var avFats = filterAvailable(fatBases);
  var avDairy = filterAvailable(dairyBases);

  var combos = [];

  if (meal === 'breakfast') {
    avGrains.forEach(function(g) {
      var gScore = _tpScoreFood(g, ctx);
      avFruits.forEach(function(fr) {
        var frScore = _tpScoreFood(fr, ctx);
        var comboScore = gScore.score + frScore.score;
        if (gScore.nutrients.some(function(n) { return n.toLowerCase() === 'iron'; })) comboScore += 15;
        var syn = getSynergy(_baseFoodName(g), _baseFoodName(fr));
        var reasons = gScore.reasons.concat(frScore.reasons);
        if (syn) reasons.push(syn.reason.replace(/^.*boosts/, 'boosts'));
        combos.push({ foods: [g, fr], score: comboScore, reasons: reasons.slice(0, 3), bases: [_baseFoodName(g), _baseFoodName(fr)] });
      });
      avFats.forEach(function(fat) {
        if (fat === 'ghee' && g === 'khichdi') return;
        var fatScore = _tpScoreFood(fat, ctx);
        var comboScore = gScore.score + fatScore.score;
        if (gScore.nutrients.some(function(n) { return n.toLowerCase() === 'iron'; })) comboScore += 15;
        combos.push({ foods: [g, fat], score: comboScore, reasons: gScore.reasons.concat(fatScore.reasons).slice(0, 3), bases: [_baseFoodName(g), _baseFoodName(fat)] });
      });
    });
    avFruits.forEach(function(fr) {
      avDairy.forEach(function(d) {
        var frScore = _tpScoreFood(fr, ctx);
        var dScore = _tpScoreFood(d, ctx);
        combos.push({ foods: [fr, d], score: frScore.score + dScore.score, reasons: frScore.reasons.concat(dScore.reasons).slice(0, 3), bases: [_baseFoodName(fr), _baseFoodName(d)] });
      });
    });
  } else if (meal === 'lunch') {
    var lunchBases = avDals.concat(avGrains.filter(function(g) { return ['khichdi', 'rice', 'idli', 'dosa'].indexOf(_baseFoodName(g)) !== -1; }));
    lunchBases.forEach(function(base) {
      var bScore = _tpScoreFood(base, ctx);
      avVegs.forEach(function(v) {
        var vScore = _tpScoreFood(v, ctx);
        var comboScore = bScore.score + vScore.score;
        if (bScore.nutrients.some(function(n) { return n.toLowerCase() === 'protein'; })) comboScore += 15;
        combos.push({ foods: [base, v], score: comboScore, reasons: bScore.reasons.concat(vScore.reasons).slice(0, 3), bases: [_baseFoodName(base), _baseFoodName(v)] });
      });
      avFats.filter(function(f) { return f === 'ghee'; }).forEach(function(fat) {
        var fatScore = _tpScoreFood(fat, ctx);
        combos.push({ foods: [base, fat], score: bScore.score + fatScore.score, reasons: bScore.reasons.concat(fatScore.reasons).slice(0, 3), bases: [_baseFoodName(base), _baseFoodName(fat)] });
      });
    });
    avGrains.filter(function(g) { return _baseFoodName(g) === 'rice'; }).forEach(function(g) {
      avDals.forEach(function(d) {
        var gS = _tpScoreFood(g, ctx);
        var dS = _tpScoreFood(d, ctx);
        avVegs.slice(0, 3).forEach(function(v) {
          var vS = _tpScoreFood(v, ctx);
          combos.push({ foods: [d + ' + ' + g, v], score: gS.score + dS.score + vS.score, reasons: dS.reasons.concat(vS.reasons).slice(0, 3), bases: [_baseFoodName(g), _baseFoodName(d), _baseFoodName(v)] });
        });
      });
    });
  } else if (meal === 'dinner') {
    var lightFoods = avVegs.concat(avFruits);
    lightFoods.forEach(function(f) {
      var fScore = _tpScoreFood(f, Object.assign({}, ctx, { meal: 'dinner' }));
      var nut = getNutrition(f) || getNutrition(_baseFoodName(f));
      var isLight = nut && (nut.tags.indexOf('easy-digest') !== -1 || nut.tags.indexOf('hydrating') !== -1 || nut.tags.indexOf('cooling') !== -1);
      var comboScore = fScore.score + (isLight ? 15 : 0);
      var reasons = fScore.reasons.slice();
      if (isLight) reasons.push('Light dinner \u2014 better sleep');
      avFats.slice(0, 2).forEach(function(fat) {
        var fatScore = _tpScoreFood(fat, ctx);
        var syn = getSynergy(_baseFoodName(f), _baseFoodName(fat));
        var cReasons = reasons.concat(fatScore.reasons);
        if (syn) cReasons.push(syn.reason.replace(/^.*helps/, 'helps'));
        combos.push({ foods: [f, fat], score: comboScore + fatScore.score, reasons: cReasons.slice(0, 3), bases: [_baseFoodName(f), _baseFoodName(fat)] });
      });
      combos.push({ foods: [f], score: comboScore, reasons: reasons.slice(0, 3), bases: [_baseFoodName(f)] });
    });
    for (var vi = 0; vi < avVegs.length; vi++) {
      for (var vj = vi + 1; vj < avVegs.length && vj < vi + 3; vj++) {
        var v1Score = _tpScoreFood(avVegs[vi], Object.assign({}, ctx, { meal: 'dinner' }));
        var v2Score = _tpScoreFood(avVegs[vj], Object.assign({}, ctx, { meal: 'dinner' }));
        combos.push({ foods: [avVegs[vi], avVegs[vj]], score: v1Score.score + v2Score.score + 10, reasons: v1Score.reasons.concat(v2Score.reasons).slice(0, 3), bases: [_baseFoodName(avVegs[vi]), _baseFoodName(avVegs[vj])] });
      }
    }
  }

  return combos;
}

function generateMealOptions(meal, count, ctx) {
  var combos = _tpBuildCombos(meal, ctx);
  // Take top N, mark starred if contains favorite foods
  var result = combos.slice(0, count).map(function(c, i) {
    var hasFav = c.bases.some(function(b) { return isFoodFavorite(b); });
    return {
      foods: c.foods.map(function(f) { return f.charAt(0).toUpperCase() + f.slice(1); }),
      reason: c.reasons.join(' · '),
      starred: hasFav || i === 0,
      bases: c.bases
    };
  });
  // Track used food bases to prevent cross-meal repetition
  result.forEach(function(r) {
    (r.bases || []).forEach(function(b) {
      if (ctx.usedAcrossMeals) ctx.usedAcrossMeals.add(b);
    });
  });
  return result;
}

function generateSnackOption(ctx) {
  // Simple: "repeat lunch leftovers" or a fruit/curd option
  var avFruits = (foods || []).filter(function(f) {
    var base = _baseFoodName(f.name.toLowerCase().trim());
    var nut = getNutrition(f.name) || getNutrition(base);
    return nut && (nut.tags.includes('energy') || nut.tags.includes('digestive'));
  }).map(function(f) { return f.name; });

  if (avFruits.length > 0) {
    // Deterministic pick based on today's date to avoid flicker on re-render
    var dateHash = today().split('-').reduce(function(a, b) { return a + parseInt(b, 10); }, 0);
    var pick = avFruits[dateHash % Math.min(avFruits.length, 3)];
    return { foods: ['Repeat lunch leftovers or ' + pick], reason: 'Snack is optional — best between lunch and dinner if hungry' };
  }
  return { foods: ['Repeat lunch leftovers or banana mash'], reason: 'Snack is optional — best between lunch and dinner if hungry' };
}

// ── Activity suggestions ──

function _tpGenerateActivitySuggestions() {
  var suggestions = [];

  // Domain balance from activity log
  var domainCounts = { motor: 0, language: 0, social: 0, cognitive: 0, sensory: 0 };
  var totalEntries = 0;
  var todayD = new Date(today());
  for (var i = 0; i < 14; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var entries = Array.isArray(activityLog[ds]) ? activityLog[ds] : [];
    entries.forEach(function(e) {
      if (e.domains && Array.isArray(e.domains)) {
        e.domains.forEach(function(dom) {
          if (domainCounts[dom] !== undefined) domainCounts[dom]++;
        });
      }
      totalEntries++;
    });
  }

  // Sort domains by count (weakest first)
  var domainList = Object.entries(domainCounts).sort(function(a, b) { return a[1] - b[1]; });

  // Activity name suggestions per domain
  var domainActivities = {
    motor: { name: 'Tummy time or crawling practice', icon: zi('run'), duration: '10 min' },
    language: { name: 'Board book + pointing game', icon: zi('book'), duration: '10 min' },
    social: { name: 'Peekaboo or mirror play', icon: zi('baby'), duration: '10 min' },
    cognitive: { name: 'Shape sorter or stacking cups', icon: zi('brain'), duration: '10 min' },
    sensory: { name: 'Textured toys or water play', icon: zi('palette'), duration: '10 min' }
  };

  // Stalled milestones — check for milestones in 'emerging' or 'practicing' that need evidence
  var stalledMs = [];
  (milestones || []).forEach(function(m) {
    if (!m.status || m.status === 'not_started' || m.status === 'mastered' || m.status === 'consistent') return;
    // Check if evidence has been added recently
    var lastEvidence = m.lastEvidenceAt || m.emergingAt || m.practicingAt;
    if (lastEvidence) {
      var daysSince = Math.floor((new Date() - new Date(lastEvidence)) / 86400000);
      if (daysSince >= 5) stalledMs.push({ name: m.name, domain: m.domain, daysSince: daysSince });
    }
  });

  // Morning: weakest domain
  if (domainList.length > 0) {
    var weakest = domainList[0];
    var act = domainActivities[weakest[0]] || domainActivities.motor;
    var reason = weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1) + ' domain weakest this week';
    // Check for stalled milestone in this domain
    var stalledInDomain = stalledMs.find(function(m) { return m.domain === weakest[0]; });
    if (stalledInDomain) {
      reason += ' · "' + stalledInDomain.name + '" milestone needs evidence';
    }
    suggestions.push({ time: 'Morning', name: act.name + ' (' + act.duration + ')', icon: act.icon, reason: reason, domain: weakest[0] });
  }

  // Afternoon: second-weakest domain (different from morning)
  if (domainList.length > 1) {
    var second = domainList[1];
    var act2 = domainActivities[second[0]] || domainActivities.language;
    var reason2 = second[0].charAt(0).toUpperCase() + second[0].slice(1) + ' domain could use more practice';
    var stalledIn2 = stalledMs.find(function(m) { return m.domain === second[0]; });
    if (stalledIn2) {
      reason2 += ' · "' + stalledIn2.name + '" stalled ' + stalledIn2.daysSince + ' days';
    }
    suggestions.push({ time: 'Afternoon', name: act2.name + ' (' + act2.duration + ')', icon: act2.icon, reason: reason2, domain: second[0] });
  }

  // Fallback if no activity log data
  if (totalEntries === 0 && suggestions.length === 0) {
    suggestions.push({ time: 'Morning', name: 'Tummy time (10 min)', icon: zi('run'), reason: 'Motor practice helps build strength', domain: 'motor' });
    suggestions.push({ time: 'Afternoon', name: 'Board book + pointing (10 min)', icon: zi('book'), reason: 'Language development through reading together', domain: 'language' });
  }

  return suggestions;
}

// ── Sleep note ──

function _tpGenerateSleepNote() {
  var notes = [];

  // 1. Bedtime drift
  try {
    var drift = computeBedtimeDrift();
    if (!drift.insufficient) {
      if (drift.direction === 'later') {
        var idealTime = drift.idealStart ? (drift.idealStart > 12 ? (drift.idealStart - 12) : drift.idealStart) + ':00 PM' : '7:30 PM';
        // Suggest the earlier ideal
        notes.push({ title: 'Aim for ' + idealTime + ' bedtime', reason: 'Bedtime drifted ' + Math.abs(drift.driftPerWeek) + ' min later this week · avg now ' + drift.avgBedtimeStr });
      } else if (drift.direction === 'earlier') {
        notes.push({ title: 'Bedtime trending earlier', reason: 'Shifted ' + Math.abs(drift.driftPerWeek) + ' min earlier this week — monitor for over-tiredness' });
      }
    }
  } catch (e) { /* best effort */ }

  // 2. Dinner gap insight (from cross-domain data)
  try {
    var feedDates = Object.keys(feedingData).sort();
    var gapScores = { short: [], medium: [], long: [] };
    feedDates.forEach(function(ds) {
      var sc = getDailySleepScore(ds);
      if (!sc) return;
      var lastMeal = _cdGetLastMealTime(ds);
      var bedtime = _cdGetBedtime(ds);
      if (!lastMeal || !bedtime) return;
      var lastMin = _cdTimeToMin(lastMeal);
      var bedMin = _cdTimeToMin(bedtime);
      if (lastMin === null || bedMin === null) return;
      if (bedMin < 360) bedMin += 1440; // after midnight
      var gap = bedMin - lastMin;
      if (gap < 0) return;
      if (gap < 60) gapScores.short.push(sc.score);
      else if (gap < 120) gapScores.medium.push(sc.score);
      else gapScores.long.push(sc.score);
    });
    // Find best gap bucket with enough data
    var bestGap = null, bestAvg = 0;
    [['short', '<60'], ['medium', '60-120'], ['long', '>120']].forEach(function(pair) {
      var arr = gapScores[pair[0]];
      if (arr.length >= 3) {
        var avg = Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
        if (avg > bestAvg) { bestAvg = avg; bestGap = pair[1]; }
      }
    });
    if (bestGap && notes.length < 2) {
      notes.push({ title: bestGap + '-min dinner gap works best', reason: 'Based on ' + (gapScores.short.length + gapScores.medium.length + gapScores.long.length) + ' nights of data' });
    }
  } catch (e) { /* best effort */ }

  // 3. Sleep regression
  try {
    var regr = computeSleepRegression();
    if (!regr.insufficient && regr.severity !== 'none') {
      notes.push({ title: regr.severityLabel + ' detected', reason: 'Expect some disruption — extra comfort may help' });
    }
  } catch (e) { /* best effort */ }

  // 4. Nap transition
  try {
    var nap = computeNapTransition();
    if (nap && !nap.insufficient && nap.metCount >= 3) {
      notes.push({ title: 'Nap transition signals building', reason: nap.metCount + '/5 signals met — ' + (nap.transitionNote || 'consider adjusting nap schedule') });
    }
  } catch (e) { /* best effort */ }

  // Fallback
  if (notes.length === 0) {
    notes.push({ title: 'Keep up the bedtime routine', reason: 'Consistent bedtime routine is working well' });
  }

  return notes.slice(0, 2);
}

// ── Heads-up items ──

function _tpGatherHeadsUp() {
  var items = [];

  // 1. Vaccination upcoming
  try {
    var upcoming = (vaccData || []).find(function(v) { return v.upcoming; });
    if (upcoming) {
      var daysTo = Math.ceil((new Date(upcoming.date) - new Date()) / 86400000);
      if (daysTo >= 0 && daysTo <= 7) {
        var bookedData = load(KEYS.vaccBooked, null);
        var isBooked = bookedData && bookedData.vaccName === upcoming.name;
        items.push({
          icon: zi('syringe'),
          text: upcoming.name + ' in ' + daysTo + ' day' + (daysTo !== 1 ? 's' : '') + (isBooked ? ' — booked' : ' — confirm appointment'),
          action: 'medical'
        });
      }
    }
  } catch (e) { /* best effort */ }

  // 2. Supplement adherence
  try {
    var suppData = computeSupplementAdherence(7);
    if (suppData && suppData.length > 0) {
      suppData.forEach(function(s) {
        var missed = s.totalDays - s.doneCount;
        if (missed >= 3) {
          items.push({ icon: zi('pill'), text: s.name + ' — missed ' + missed + ' of last 7 days, resume tomorrow', action: 'track' });
        } else {
          items.push({ icon: zi('pill'), text: s.name + ' — ' + s.doneCount + '/' + s.totalDays + ' days this week' + (s.doneCount >= 5 ? ' (keep going!)' : ''), action: 'track' });
        }
      });
    }
  } catch (e) { /* best effort */ }

  // 3. Growth measurement recency
  try {
    if (growthData && growthData.length > 0) {
      var lastMeas = growthData[growthData.length - 1];
      if (lastMeas && lastMeas.date) {
        var daysSince = Math.floor((new Date() - new Date(lastMeas.date)) / 86400000);
        if (daysSince >= 14) {
          items.push({ icon: zi('ruler'), text: 'Last measured ' + daysSince + ' days ago — time to weigh and measure', action: 'growth' });
        }
      }
    }
  } catch (e) { /* best effort */ }

  // 4. Food reaction window
  try {
    (foods || []).forEach(function(f) {
      if (!f.date) return;
      var daysSinceIntro = Math.floor((new Date() - new Date(f.date)) / 86400000);
      if (daysSinceIntro >= 0 && daysSinceIntro <= 3) {
        items.push({ icon: zi('baby'), text: 'Day ' + (daysSinceIntro + 1) + ' of ' + f.name + ' introduction — watch for reactions', action: 'diet' });
      }
    });
  } catch (e) { /* best effort */ }

  return items.slice(0, 3);
}

// ── Main orchestrator ──

function generateTomorrowPrep() {
  _tpScoreCache = {}; // Clear per-run cache
  var tomorrow = _offsetDateStr(today(), 1);
  var tomorrowDate = new Date(tomorrow);
  var tomorrowDow = tomorrowDate.toLocaleDateString('en-IN', { weekday: 'short' });
  var tomorrowDay = tomorrowDate.getDate();

  // 1. Compute context
  var heatmap = null;
  var gapSet = new Set();
  var gapDaysMap = {};
  try {
    heatmap = computeNutrientHeatmap(7);
    if (heatmap && heatmap.gaps) {
      heatmap.gaps.forEach(function(g) { gapSet.add(g.toLowerCase()); });
      // Compute days since nutrient last seen
      if (heatmap.grid) {
        Object.keys(heatmap.grid).forEach(function(nKey) {
          var arr = heatmap.grid[nKey];
          var lastSeen = -1;
          for (var i = arr.length - 1; i >= 0; i--) {
            if (arr[i] > 0) { lastSeen = arr.length - 1 - i; break; }
          }
          gapDaysMap[nKey] = lastSeen >= 0 ? lastSeen : 7;
        });
      }
    }
  } catch (e) { /* best effort */ }

  var textureData = null;
  try { textureData = computeTextureProgression(); } catch (e) { /* best effort */ }

  // Hydration context — only active when outdoors or power outage
  var hydrationCtx = _getHydrationContext();

  // Mine meal patterns once — shared across all 3 meal calls
  var minedPatterns = null;
  try { minedPatterns = _tpMineMealPatterns(); } catch (e) { /* best effort */ }

  var usedAcrossMeals = new Set();
  var ctx = { gapSet: gapSet, gapDaysMap: gapDaysMap, textureData: textureData, usedAcrossMeals: usedAcrossMeals, meal: 'breakfast', hydrationCtx: hydrationCtx, minedPatterns: minedPatterns };

  // 2. Generate meal suggestions (outing-aware)
  var outing = _tomorrowOuting;
  var breakfast, lunch, dinner;

  if (outing && outing.portableMeal) {
    // Generate portable meals for the affected slot
    var portableMeals = _outingGetPortableMeals(outing.portableMeal);
    var portableResult = portableMeals.map(function(p, i) {
      return {
        foods: [p.name],
        reason: p.reason,
        starred: isFoodFavorite(p.base) || i === 0,
        bases: [p.base],
        portable: true
      };
    });
    // Track portable food bases to prevent cross-meal duplication
    portableResult.forEach(function(pr) {
      (pr.bases || []).forEach(function(b) { usedAcrossMeals.add(b); });
    });

    // Non-affected meals generated normally
    if (outing.portableMeal === 'breakfast') {
      breakfast = portableResult;
      lunch = generateMealOptions('lunch', 3, Object.assign({}, ctx, { meal: 'lunch' }));
      dinner = generateMealOptions('dinner', 3, Object.assign({}, ctx, { meal: 'dinner' }));
    } else if (outing.portableMeal === 'lunch') {
      breakfast = generateMealOptions('breakfast', 3, Object.assign({}, ctx, { meal: 'breakfast' }));
      lunch = portableResult;
      // Heavier dinner to compensate
      dinner = generateMealOptions('dinner', 3, Object.assign({}, ctx, { meal: 'dinner' }));
    } else {
      breakfast = generateMealOptions('breakfast', 3, Object.assign({}, ctx, { meal: 'breakfast' }));
      lunch = generateMealOptions('lunch', 3, Object.assign({}, ctx, { meal: 'lunch' }));
      dinner = portableResult;
    }
  } else {
    breakfast = generateMealOptions('breakfast', 3, Object.assign({}, ctx, { meal: 'breakfast' }));
    lunch = generateMealOptions('lunch', 3, Object.assign({}, ctx, { meal: 'lunch' }));
    dinner = generateMealOptions('dinner', 3, Object.assign({}, ctx, { meal: 'dinner' }));
  }
  var snack = generateSnackOption(ctx);

  // 3. Activity suggestions (outing-aware)
  var activities = _tpGenerateActivitySuggestions();
  if (outing && outing.skipActivitySlot) {
    // Mark that motor activity is covered by the outing
    activities = activities.map(function(act) {
      if (act.domain === 'motor') {
        return Object.assign({}, act, { reason: outing.timeSlot.charAt(0).toUpperCase() + outing.timeSlot.slice(1) + ' outing covers motor \u2014 ' + act.reason });
      }
      return act;
    });
  }

  // 4. Sleep note
  var sleepNotes = _tpGenerateSleepNote();

  // 5. Heads up
  var headsUp = _tpGatherHeadsUp();

  // 6. Outing pack list
  if (outing) {
    var temp = _getTomorrowTemp();
    var packItems = ['Water bottle', 'Banana or mashed fruit', 'Sun hat'];
    if (temp !== null && temp >= 32) packItems.push('Coconut water');
    if (outing.duration >= 3) packItems.push('Extra clothes');
    headsUp.unshift({ icon: zi('sun'), text: 'Pack for outing: ' + packItems.join(', '), action: '' });
  }

  // 7. Seasonal highlights
  var seasonalPeaks = getSeasonalHighlights();
  var seasonalTip = null;
  if (seasonalPeaks.length > 0) {
    var displayPeaks = seasonalPeaks.slice(0, 3).map(function(f) { return f.charAt(0).toUpperCase() + f.slice(1); });
    seasonalTip = displayPeaks.join(', ') + ' in season';
  }

  return {
    tomorrow: tomorrow,
    tomorrowDow: tomorrowDow,
    tomorrowDay: tomorrowDay,
    breakfast: breakfast,
    lunch: lunch,
    dinner: dinner,
    snack: snack,
    activities: activities,
    sleepNotes: sleepNotes,
    headsUp: headsUp,
    gapCount: gapSet.size,
    hydrationCtx: hydrationCtx,
    outing: outing,
    seasonalTip: seasonalTip
  };
}

// ── Renderer ──

function renderTomorrowPrep() {
  var card = document.getElementById('tomorrowPrepCard');
  var dateEl = document.getElementById('tomorrowPrepDate');
  var subtitleEl = document.getElementById('tomorrowPrepSubtitle');
  var content = document.getElementById('tomorrowPrepContent');
  if (!card || !content) return;

  if (!shouldShowTomorrowPrep()) {
    card.style.display = 'none';
    return;
  }

  var data = generateTomorrowPrep();
  if (!data) { card.style.display = 'none'; return; }

  card.style.display = '';
  if (dateEl) dateEl.textContent = data.tomorrowDow + ' ' + data.tomorrowDay;

  var gapCount = data.gapCount || 0;
  if (subtitleEl) {
    var subtitleParts = ['Based on this week\'s patterns'];
    if (gapCount > 0) subtitleParts.push(gapCount + ' nutrient gap' + (gapCount > 1 ? 's' : '') + ' to fill');
    if (data.seasonalTip) subtitleParts.push(data.seasonalTip);
    subtitleEl.textContent = subtitleParts.join(' \u00B7 ');
  }

  var html = '';

  // ── Outing badge (read-only — toggle is on the standalone card above) ──
  if (data.outing) {
    var forLabel = data.outing.date === today() ? 'Today' : 'Tomorrow';
    html += '<div class="outing-active-badge"><div class="icon icon-sage">' + zi('sun') + '</div> ';
    html += escHtml(forLabel) + ': ' + escHtml(data.outing.timeSlot.charAt(0).toUpperCase() + data.outing.timeSlot.slice(1)) + ' outing \u00B7 ~' + data.outing.duration + ' hrs';
    html += '</div>';
  }

  // ── Hydration section (when active + prominent = above meals) ──
  if (data.hydrationCtx && data.hydrationCtx.active && data.hydrationCtx.level === 'prominent') {
    html += _tpRenderHydrationSection(data.hydrationCtx);
  }

  // ── Meal sections ──
  var mealSections = [
    { key: 'breakfast', label: 'BREAKFAST', icon: zi('sun'), options: data.breakfast },
    { key: 'lunch', label: 'LUNCH', icon: zi('bolt'), options: data.lunch },
    { key: 'dinner', label: 'DINNER', icon: zi('moon'), options: data.dinner }
  ];

  mealSections.forEach(function(section) {
    var count = section.options.length;
    if (count === 0) {
      html += '<div class="tp-meal-section">' + section.icon + ' ' + section.label + '</div>';
      html += '<div class="tp-option-reason">Not enough food data to suggest \u2014 try introducing more foods</div>';
      return;
    }
    var portableNote = '';
    if (data.outing && data.outing.portableMeal === section.key) {
      portableNote = ' \u00B7 ' + zi('sun') + ' Portable';
    }
    html += '<div class="tp-meal-section">' + section.icon + ' ' + section.label + ' \u2014 ' + count + ' option' + (count !== 1 ? 's' : '') + portableNote + '</div>';
    html += '<div class="tp-meal-options">';
    section.options.forEach(function(opt, idx) {
      var starredClass = opt.starred ? ' tp-starred' : '';
      html += '<div class="tp-option' + starredClass + '" data-tp-meal="' + section.key + '" data-tp-idx="' + idx + '">';
      html += '<div class="tp-option-foods">';
      if (opt.starred) html += '<span class="tp-option-star">' + zi('star') + '</span> ';
      html += escHtml(opt.foods.join(' + '));
      html += '</div>';
      if (opt.reason) {
        html += '<div class="tp-option-reason">' + escHtml(opt.reason) + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  });

  // ── Snack ──
  if (data.snack) {
    html += '<div class="tp-meal-section">' + zi('spoon') + ' SNACK \u2014 1 suggestion</div>';
    html += '<div class="tp-meal-options">';
    html += '<div class="tp-option" data-tp-meal="snack">';
    html += '<div class="tp-option-foods">' + escHtml(data.snack.foods[0]) + '</div>';
    html += '<div class="tp-option-reason">' + escHtml(data.snack.reason) + '</div>';
    html += '</div></div>';
  }

  // ── Hydration section (when active but not prominent = between meals and activities) ──
  if (data.hydrationCtx && data.hydrationCtx.active && data.hydrationCtx.level !== 'prominent') {
    html += _tpRenderHydrationSection(data.hydrationCtx);
  }

  // ── Activities ──
  if (data.activities.length > 0) {
    html += '<hr class="tp-section-divider">';
    html += '<div class="tp-section-label">Activities</div>';
    data.activities.forEach(function(act) {
      html += '<div class="tp-activity-row" data-tp-activity="' + escHtml(act.domain || '') + '">';
      html += '<div class="tp-activity-icon">' + act.icon + '</div>';
      html += '<div class="tp-activity-body">';
      html += '<div class="tp-activity-title">' + escHtml(act.time) + ': ' + escHtml(act.name) + '</div>';
      html += '<div class="tp-activity-reason">' + escHtml(act.reason) + '</div>';
      html += '</div></div>';
    });
  }

  // ── Sleep note ──
  if (data.sleepNotes && data.sleepNotes.length > 0) {
    html += '<hr class="tp-section-divider">';
    html += '<div class="tp-section-label">Sleep Note</div>';
    data.sleepNotes.forEach(function(note) {
      html += '<div class="tp-sleep-note">';
      html += '<div class="tp-sleep-icon">' + zi('moon') + '</div>';
      html += '<div class="tp-sleep-body">';
      html += '<div class="tp-sleep-title">' + escHtml(note.title) + '</div>';
      html += '<div class="tp-sleep-reason">' + escHtml(note.reason) + '</div>';
      html += '</div></div>';
    });
  }

  // ── Heads up ──
  if (data.headsUp.length > 0) {
    html += '<hr class="tp-section-divider">';
    html += '<div class="tp-section-label">Heads Up</div>';
    data.headsUp.forEach(function(item) {
      html += '<div class="tp-headsup-row" data-tp-action="' + escHtml(item.action || '') + '">';
      html += '<div class="tp-headsup-icon">' + item.icon + '</div>';
      html += '<div class="tp-headsup-text">' + escHtml(item.text) + '</div>';
      html += '</div>';
    });
  }

  content.innerHTML = html;

  // ── Attach tap handlers ──
  content.querySelectorAll('.tp-option').forEach(function(el) {
    el.addEventListener('click', function() {
      var meal = el.getAttribute('data-tp-meal');
      var foodsText = el.querySelector('.tp-option-foods');
      if (!meal || !foodsText) return;
      var foodStr = foodsText.textContent.trim();
      _tpPlanMeal(meal, foodStr);
    });
  });

  content.querySelectorAll('.tp-headsup-row').forEach(function(el) {
    el.addEventListener('click', function() {
      var action = el.getAttribute('data-tp-action');
      if (action === 'medical') switchTab('medical');
      else if (action === 'growth') switchTab('growth');
      else if (action === 'diet') switchTab('diet');
      else if (action === 'track') switchTab('track');
    });
  });

  // (Outing toggle is on the standalone card — TP badge opens briefing)
  var tpBadge = content.querySelector('.outing-active-badge');
  if (tpBadge) {
    tpBadge.addEventListener('click', function() { openOutingBriefing(); });
  }
}

function _tpRenderHydrationSection(hydCtx) {
  var isProminent = hydCtx.level === 'prominent';
  var cls = 'tp-hydration-section' + (isProminent ? ' prominent' : '');
  var html = '<div class="' + cls + '">';
  html += '<div class="tp-hydration-title"><div class="icon icon-' + (isProminent ? 'rose' : 'sky') + '">' + zi('drop') + '</div> ';
  html += isProminent ? 'HYDRATION \u2014 IMPORTANT' : 'Hydration Note';
  html += '</div>';
  html += '<div class="tp-hydration-items">';

  var temp = hydCtx.temp;
  var source = hydCtx.isOuting ? 'outdoor outing' : 'no AC (power outage mode)';
  var ic = isProminent ? 'rose' : 'sky';
  function hIcon(name) { return '<span class="icon icon-' + ic + '">' + zi(name) + '</span>'; }

  if (isProminent && temp >= 35) {
    html += '<div class="tp-hydration-item">' + hIcon('flame') + ' Very hot day (' + temp + '\u00B0C) with ' + source + ' \u2014 prioritize hydration</div>';
    html += '<div class="tp-hydration-item">' + hIcon('drop') + ' Offer breast milk every 1.5 hrs instead of 2 hrs</div>';
    html += '<div class="tp-hydration-item">' + hIcon('bowl') + ' Include lauki, coconut water, or watermelon in meals</div>';
    if (hydCtx.isOuting) {
      html += '<div class="tp-hydration-item">' + hIcon('sun') + ' Consider early morning outing or shorter duration</div>';
    }
  } else if (hydCtx.level === 'full') {
    html += '<div class="tp-hydration-item">' + hIcon('drop') + ' Warm day (' + temp + '\u00B0C) with ' + source + ' \u2014 include hydrating foods</div>';
    html += '<div class="tp-hydration-item">' + hIcon('bowl') + ' Try lauki, coconut water, or buttermilk</div>';
  } else {
    html += '<div class="tp-hydration-item">' + hIcon('drop') + ' ' + temp + '\u00B0C with ' + source + ' \u2014 keep hydrating foods handy</div>';
  }

  html += '</div></div>';
  return html;
}

function _tpPlanMeal(meal, foodStr) {
  if (!_tomorrowPlanned) _tomorrowPlanned = {};

  // Toggle: if already planned with this food, unplan it
  if (_tomorrowPlanned[meal] === foodStr) {
    delete _tomorrowPlanned[meal];
    save(KEYS.tomorrowPlanned, _tomorrowPlanned);
    // Remove visual feedback from all options for this meal
    var opts = document.querySelectorAll('.tp-option[data-tp-meal="' + meal + '"]');
    opts.forEach(function(opt) {
      opt.classList.remove('tp-option-planned');
      var check = opt.querySelector('.tp-planned-check');
      if (check) check.remove();
    });
    return;
  }

  // Plan this food for tomorrow
  _tomorrowPlanned[meal] = foodStr;
  save(KEYS.tomorrowPlanned, _tomorrowPlanned);

  // Visual feedback — highlight selected, unhighlight others
  var opts = document.querySelectorAll('.tp-option[data-tp-meal="' + meal + '"]');
  opts.forEach(function(opt) {
    var thisFood = opt.querySelector('.tp-option-foods').textContent.trim();
    if (thisFood === foodStr) {
      opt.classList.add('tp-option-planned');
      var existing = opt.querySelector('.tp-planned-check');
      if (!existing) {
        var check = document.createElement('div');
        check.className = 'tp-planned-check';
        check.innerHTML = zi('check') + ' Planned for tomorrow';
        opt.appendChild(check);
      }
    } else {
      opt.classList.remove('tp-option-planned');
      var check = opt.querySelector('.tp-planned-check');
      if (check) check.remove();
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// MEAL INTAKE TRACKING
// ═══════════════════════════════════════════════════════════════

var MI_LEVELS = [
  { value: 0.25, icon: 'spoon',      label: 'Few bites', cls: '25' },
  { value: 0.50, icon: 'halfcircle', label: 'Half', cls: '50' },
  { value: 0.75, icon: 'bowl',       label: 'Most', cls: '75' },
  { value: 1.0,  icon: 'star',       label: 'All', cls: '100' }
];

function _miGetIntake(dateStr, meal) {
  var entry = feedingData[dateStr];
  if (!entry) return 0.75;
  var val = entry[meal + '_intake'];
  if (val === 0.25 || val === 0.5 || val === 0.75 || val === 1.0) return val;
  return 0.75; // default
}

function _miSetIntake(dateStr, meal, value) {
  if (!feedingData[dateStr]) return;
  feedingData[dateStr][meal + '_intake'] = value;
  save(KEYS.feeding, feedingData);
  _islMarkDirty('diet');
}

function _miLevelFor(value) {
  for (var i = 0; i < MI_LEVELS.length; i++) {
    if (MI_LEVELS[i].value === value) return MI_LEVELS[i];
  }
  return MI_LEVELS[2]; // default "Most"
}

// Render intake bar (4-segment mini bar)
function _miRenderBar(intake) {
  var segs = Math.round(intake * 4);
  var cls = intake >= 1.0 ? '100' : intake >= 0.75 ? '75' : intake >= 0.5 ? '50' : '25';
  var html = '<span class="mi-bar">';
  for (var i = 0; i < 4; i++) {
    html += '<span class="mi-bar-seg' + (i < segs ? ' filled-' + cls : '') + '"></span>';
  }
  html += '</span>';
  return html;
}

// Render intake chip (colored pill with label)
function _miRenderChip(intake) {
  var lv = _miLevelFor(intake);
  return '<span class="mi-chip mi-chip-' + lv.cls + '">' + _miRenderBar(intake) + ' ' + escHtml(lv.label) + '</span>';
}

// ── POST-SAVE INTAKE PROMPT ──

function _miShowPostSavePrompt(dateStr) {
  var entry = feedingData[dateStr];
  if (!entry) return;

  // Find which meals need intake (have content but no explicit intake set)
  var mealsToPrompt = [];
  ['breakfast', 'lunch', 'dinner'].forEach(function(m) {
    if (isRealMeal(entry[m]) && entry[m] !== '—skipped—') {
      var existing = entry[m + '_intake'];
      if (existing !== 0.25 && existing !== 0.5 && existing !== 0.75 && existing !== 1.0) {
        mealsToPrompt.push(m);
      }
    }
  });

  if (mealsToPrompt.length === 0) return;

  var overlay = document.getElementById('psfOverlay');
  if (!overlay || !overlay.classList.contains('open')) return;

  // Inject intake prompt into the existing PSF card
  var card = overlay.querySelector('.psf-card');
  if (!card) return;

  // Don't add twice
  if (card.querySelector('.mi-prompt')) return;

  var promptDiv = document.createElement('div');
  promptDiv.className = 'mi-prompt';

  var label = mealsToPrompt.length === 1
    ? 'How much ' + mealsToPrompt[0] + ' did she eat?'
    : 'How much did she eat?';
  var html = '<div class="mi-prompt-label">' + escHtml(label) + '</div>';
  html += '<div class="mi-buttons">';
  MI_LEVELS.forEach(function(lv) {
    html += '<button class="mi-btn" data-mi-val="' + lv.value + '">';
    html += '<div class="mi-btn-icon">' + zi(lv.icon) + '</div>';
    html += '<div class="mi-btn-label">' + escHtml(lv.label) + '</div>';
    html += '</button>';
  });
  html += '</div>';
  html += '<button class="mi-skip" data-mi-skip="1">Skip</button>';

  promptDiv.innerHTML = html;

  // Insert before dismiss button
  var dismissBtn = card.querySelector('.psf-dismiss');
  if (dismissBtn) {
    card.insertBefore(promptDiv, dismissBtn);
  } else {
    card.appendChild(promptDiv);
  }

  // Wire button handlers
  promptDiv.querySelectorAll('.mi-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var val = parseFloat(this.getAttribute('data-mi-val'));
      mealsToPrompt.forEach(function(m) {
        _miSetIntake(dateStr, m, val);
      });
      // Visual feedback
      promptDiv.querySelectorAll('.mi-btn').forEach(function(b) { b.classList.remove('mi-selected'); });
      this.classList.add('mi-selected');
      // Auto-dismiss after brief feedback
      setTimeout(function() { dismissPostSaveFlash(); }, 600);
    });
  });

  promptDiv.querySelector('.mi-skip').addEventListener('click', function() {
    dismissPostSaveFlash();
  });
}

// ── INLINE INTAKE EDITOR (Diet tab per-meal) ──

function _miRenderInlineEditor(dateStr, meal) {
  var entry = feedingData[dateStr];
  if (!entry || !isRealMeal(entry[meal]) || entry[meal] === '—skipped—') return '';
  var current = _miGetIntake(dateStr, meal);

  var html = '<div class="mi-inline" data-mi-meal="' + meal + '" data-mi-date="' + dateStr + '">';
  MI_LEVELS.forEach(function(lv) {
    var active = lv.value === current ? ' mi-active' : '';
    html += '<button class="mi-inline-btn' + active + '" data-mi-ival="' + lv.value + '">' + zi(lv.icon) + ' ' + escHtml(lv.label) + '</button>';
  });
  html += '</div>';
  return html;
}

function _miWireInlineEditors() {
  document.querySelectorAll('.mi-inline').forEach(function(row) {
    var meal = row.getAttribute('data-mi-meal');
    var dateStr = row.getAttribute('data-mi-date');
    row.querySelectorAll('.mi-inline-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var val = parseFloat(this.getAttribute('data-mi-ival'));
        _miSetIntake(dateStr, meal, val);
        // Update visual
        row.querySelectorAll('.mi-inline-btn').forEach(function(b) { b.classList.remove('mi-active'); });
        this.classList.add('mi-active');
        // Refresh home if visible
        if (document.getElementById('homeTab')?.style.display !== 'none') {
          renderHomeMealProgress();
        }
      });
    });
  });
}

// ── INTAKE DISPLAY HELPERS ──

var _qlSelectedIntake = 0.75; // default for Quick Log

function _miWireQLIntakePills() {
  _qlSelectedIntake = 0.75;
  var container = document.getElementById('qlIntakePills');
  if (!container) return;
  container.querySelectorAll('.ql-intake-pill').forEach(function(btn) {
    btn.classList.toggle('active', parseFloat(btn.getAttribute('data-mi-qlval')) === 0.75);
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      _qlSelectedIntake = parseFloat(this.getAttribute('data-mi-qlval'));
      container.querySelectorAll('.ql-intake-pill').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
    });
  });
}

function _miEffectiveIntake(dateStr) {
  var entry = feedingData[dateStr];
  if (!entry) return null;
  var sum = 0;
  var count = 0;
  ['breakfast', 'lunch', 'dinner'].forEach(function(m) {
    if (isRealMeal(entry[m]) && entry[m] !== '—skipped—') {
      sum += _miGetIntake(dateStr, m);
      count++;
    }
  });
  return count > 0 ? Math.round((sum / count) * 100) : null;
}

// ── DIET TAB INTAKE DISPLAY ──

function _miRenderDietTabIntake() {
  var dateStr = document.getElementById('feedingDate')?.value || today();
  var entry = feedingData[dateStr];

  ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(m) {
    // Find or create the intake container after the meal insight
    var mealCard = document.querySelector('.meal-card.' + m);
    if (!mealCard) return;

    // Remove existing intake editor
    var existing = mealCard.querySelector('.mi-inline');
    if (existing) existing.remove();

    // Only show if meal has real content
    if (!entry || !isRealMeal(entry[m]) || entry[m] === '—skipped—') return;

    var editorHtml = _miRenderInlineEditor(dateStr, m);
    if (!editorHtml) return;

    // Insert after the meal insight (or after the input wrap if no insight)
    var insight = mealCard.querySelector('.meal-insight');
    var inputWrap = mealCard.querySelector('.meal-input-wrap');
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorHtml;
    var editorEl = tempDiv.firstElementChild;

    if (insight) {
      insight.parentNode.insertBefore(editorEl, insight.nextSibling);
    } else if (inputWrap) {
      inputWrap.parentNode.insertBefore(editorEl, inputWrap.nextSibling);
    } else {
      mealCard.appendChild(editorEl);
    }
  });

  _miWireInlineEditors();
}

// ═══ MEAL INTAKE — END ═══

// ═══════════════════════════════════════════════════════════════

// FOOD FAVORITES
// ═══════════════════════════════════════════════════════════════

function isFoodFavorite(foodName) {
  var base = _baseFoodName(foodName);
  var entry = foods.find(function(f) { return _baseFoodName(f.name) === base; });
  return entry && entry.favorite === true;
}

function toggleFoodFavorite(foodName) {
  var base = _baseFoodName(foodName);
  var idx = foods.findIndex(function(f) { return _baseFoodName(f.name) === base; });
  if (idx === -1) return;
  foods[idx].favorite = !foods[idx].favorite;
  save(KEYS.foods, foods);
}

// ═══════════════════════════════════════════════════════════════

// RENDER: HERO SCORE, VARIETY, NUTRIENT, CORRELATION, WEEKLY
// ─────────────────────────────────────────

function renderHeroScore() {
  const el = document.getElementById('homeHeroScore');
  if (!el) return;
  const zs = calcZivaScore();
  if (zs.score === null) { el.style.display = 'none'; return; }
  el.style.display = '';

  // Remove old score class, add new
  el.className = 'ziva-score-hero zs-score-' + zs.label;

  const trend = getZivaScoreTrend7d();
  const trendEl = document.getElementById('zsTrend');
  const numEl = document.getElementById('zsNumber');
  numEl.textContent = zs.score;

  if (trendEl) {
    if (trend.delta > 2) { trendEl.textContent = '↑ +' + trend.delta + ' vs last week'; trendEl.className = 'zs-trend'; }
    else if (trend.delta < -2) { trendEl.textContent = '↓ ' + trend.delta + ' vs last week'; trendEl.className = 'zs-trend trend-down'; }
    else { trendEl.textContent = '→ stable'; trendEl.className = 'zs-trend'; }
  }

  // Domain pills
  const domEl = document.getElementById('zsDomains');
  if (!domEl) return;
  const domainConfig = [
    { key: 'sleep', icon: zi('moon'), label: 'Sleep', tab: 'sleep' },
    { key: 'diet', icon: zi('bowl'), label: 'Diet', tab: 'diet' },
    { key: 'poop', icon: zi('diaper'), label: 'Poop', tab: 'poop' },
    { key: 'medical', icon: zi('medical'), label: 'Medical', tab: 'medical' },
    { key: 'milestones', icon: zi('trophy'), label: 'Milestones', tab: 'milestones' },
  ];
  domEl.innerHTML = domainConfig.map(dc => {
    const d = zs.domains[dc.key];
    const scoreVal = d.score !== null && d.score !== undefined ? Math.round(d.score) : null;
    const score = scoreVal !== null ? scoreVal : '—';
    const staleClass = d.isStale ? ' zsd-stale' : '';
    const levelClass = scoreVal !== null ? ' zsd-' + getScoreLabel(scoreVal).label : '';
    return `<div class="zs-domain-pill${staleClass}${levelClass}" data-action="switchTab" data-arg="${dc.key}">
      <div class="zsd-icon">${dc.icon}</div>
      <div class="zsd-text"><div class="zsd-score">${score}</div><div class="zsd-label">${dc.label}</div></div>
    </div>`;
  }).join('');

  // Score popup will be opened on demand via taps
}

/* ── Domain Score Hero Cards (per tab) ── */
function renderDomainHero(domainKey) {
  const el = document.getElementById(domainKey + 'DomainHero');
  if (!el) return;

  const zs = calcZivaScore();
  if (!zs || zs.score === null) { el.style.display = 'none'; return; }

  const d = zs.domains[domainKey];
  if (!d || d.score === null || d.score === undefined) { el.style.display = 'none'; return; }

  el.style.display = '';
  const score = Math.round(d.score);
  const lbl = getScoreLabel(score);
  const defs = _spGetDomainDefs(zs);
  const dom = defs.find(x => x.key === domainKey);
  if (!dom) { el.style.display = 'none'; return; }

  const comps = dom.components();
  const staleClass = d.isStale ? ' dsh-stale' : '';
  const weight = d ? Math.round(d.weight * 100) + '%' : '';

  const ringClass = 'dsh-ring-' + (lbl.label || 'good');

  const domNames = { sleep:'Sleep Score', diet:'Diet Score', poop:'Poop Score', medical:'Medical Score', milestones:'Milestone Score' };
  const domSubs = {
    sleep: 'Based on duration, wake-ups, bedtime & naps',
    diet: 'Based on meals, variety, groups & nutrients',
    poop: 'Based on consistency, frequency, color & symptoms',
    medical: 'Based on vaccines, supplements, growth & checkups',
    milestones: 'Based on completion, categories, tracking & recency'
  };

  let html = `<div class="domain-score-hero dsh-${domainKey}${staleClass}">
    <div class="dsh-top">
      <div class="dsh-ring ${ringClass}" data-action="openScorePopup" data-arg="${domainKey}">
        <div class="dsh-number">${score}</div>
        <div class="dsh-label">${domNames[domainKey].split(' ')[0]}</div>
        <div class="dsh-emoji">${lbl.emoji}</div>
      </div>
      <div class="dsh-info">
        <div class="dsh-domain-name">${lbl.emoji} ${lbl.label.charAt(0).toUpperCase() + lbl.label.slice(1)}</div>
        <div class="dsh-domain-sublabel">${domSubs[domainKey]} · ${weight} of Ziva Score</div>
      </div>
    </div>
    <div class="dsh-components">`;

  comps.forEach(c => {
    if (c.isTrend) return; // Trends line not shown in overview pills
    const barClass = c.score >= 70 ? 'dcb-high' : c.score >= 40 ? 'dcb-mid' : 'dcb-low';
    const pillClass = c.score >= 70 ? 'dcp-high' : c.score >= 40 ? 'dcp-mid' : 'dcp-low';
    const shortDetail = c.detail && c.detail.length > 28 ? c.detail.substring(0, 26) + '…' : (c.detail || '');
    html += `<div class="dsh-comp-pill ${pillClass}" data-action="openScorePopup" data-arg="${domainKey}">
      <div class="dcp-bar ${barClass}">${c.score}</div>
      <div class="dcp-text">
        <div class="dcp-name">${c.name} <span class="dcp-weight">${c.weight}</span></div>
        <div class="dcp-detail">${shortDetail}</div>
      </div>
    </div>`;
  });

  html += `</div></div>`;
  el.innerHTML = html;
}

/* ── Score Popup system ── */
let _spActiveTab = 'overview';
let _spZivaScore = null;

function openScorePopup(focusDomain) {
  _spZivaScore = calcZivaScore();
  if (!_spZivaScore || _spZivaScore.score === null) return;
  _spActiveTab = focusDomain || 'overview';
  document.getElementById('scorePopup').classList.add('open');
  document.getElementById('scorePopupOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  _spRenderHero();
  _spRenderTabs();
  _spRenderBody();
}

function closeScorePopup() {
  document.getElementById('scorePopup').classList.remove('open');
  document.getElementById('scorePopupOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function _spSwitchTab(key) {
  _spActiveTab = key;
  _spRenderTabs();
  _spRenderBody();
  // Scroll active tab into view
  const activeEl = document.querySelector('.sp-tab.active');
  if (activeEl) activeEl.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
}

function _spRenderHero() {
  const el = document.getElementById('spHero');
  if (!el || !_spZivaScore) return;
  const zs = _spZivaScore;
  const lbl = getScoreLabel(zs.score);
  const trend = getZivaScoreTrend7d();
  let trendText = '→ stable';
  if (trend.delta > 2) trendText = '↑ +' + trend.delta + ' vs last week';
  else if (trend.delta < -2) trendText = '↓ ' + trend.delta + ' vs last week';

  // Ring color classes
  const ringColors = {
    excellent: 'background:linear-gradient(135deg, #d4f5e0, #b8eacc); border-color:#6fcf97; color:#1a7a42;',
    great: 'background:linear-gradient(135deg, #e0f0fa, #cce5f5); border-color:#7fb8d8; color:#2a6a8a;',
    good: 'background:linear-gradient(135deg, #fef6e8, #fcecd0); border-color:#e8c86d; color:#8a6520;',
    fair: 'background:linear-gradient(135deg, #fef0e0, #fce0c0); border-color:#e8a050; color:#8a5020;',
    attention: 'background:linear-gradient(135deg, #fde8ed, #f8d0d8); border-color:var(--tc-danger); color:#a03030;'
  };
  const ringStyle = ringColors[lbl.label] || ringColors.good;

  el.innerHTML = `
    <div class="sp-ring" style="${ringStyle}">
      <div class="sp-ring-num">${zs.score}</div>
      <div class="sp-ring-label">Score</div>
    </div>
    <div class="sp-hero-meta">
      <div class="sp-hero-level">${lbl.emoji} ${lbl.label.charAt(0).toUpperCase() + lbl.label.slice(1)}</div>
      <div class="sp-hero-trend">${trendText}</div>
    </div>`;
}

function _spRenderTabs() {
  const el = document.getElementById('spTabBar');
  if (!el || !_spZivaScore) return;
  const zs = _spZivaScore;

  const tabs = [
    { key:'overview', icon:zi('bars'), label:'Overview', score:null },
    { key:'sleep', icon:zi('moon'), label:'Sleep' },
    { key:'diet', icon:zi('bowl'), label:'Diet' },
    { key:'poop', icon:zi('diaper'), label:'Poop' },
    { key:'medical', icon:zi('medical'), label:'Medical' },
    { key:'milestones', icon:zi('trophy'), label:'Milestones' },
  ];

  el.innerHTML = tabs.map(t => {
    const active = _spActiveTab === t.key ? ' active' : '';
    let scoreHtml = '';
    if (t.key !== 'overview') {
      const d = zs.domains[t.key];
      const sv = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : '—';
      scoreHtml = ` <span class="sp-tab-score">${sv}</span>`;
    }
    return `<div class="sp-tab${active}" data-action="_spSwitchTab" data-arg="${t.key}">
      <span class="sp-tab-icon">${t.icon}</span>${t.label}${scoreHtml}
    </div>`;
  }).join('');
}

function _spGetDomainDefs(zs) {
  return [
    {
      key: 'sleep', icon: zi('moon'), name: 'Sleep', tab: 'sleep',
      tip: (() => { const s = getSleepTargets(ageAt().months); return 'A consistent bedtime between ' + s.bedtimeStart + ':00–' + s.bedtimeEnd + ':00 and age-appropriate naps improve sleep quality scores (' + s.label + ' standard).'; })(),
      components: () => {
        const r = zs.domains.sleep.result;
        if (!r) return [{ name: 'No data', weight: '', score: 0, detail: 'Log sleep to see score breakdown' }];
        const ageM2 = ageAt().months;
        const st = getSleepTargets(ageM2);
        const durTarget = st.totalTarget / 60;
        const totalMin = r.totalMin || (r.detail ? r.detail.totalMin : 0) || 0;
        const wakeVal = r.wakes !== undefined ? r.wakes : (r.detail ? r.detail.wakes : 0) || 0;
        const napVal = r.napCount !== undefined ? r.napCount : (r.detail ? r.detail.napCount : 0) || 0;
        const [napMin, napMax] = st.napIdeal;
        const durDetail = totalMin ? (totalMin / 60).toFixed(1) + 'h total (target: ' + durTarget.toFixed(0) + 'h, ' + st.label + ')' : 'No data';
        const comps = r.components || {};
        const durScore = comps.duration !== undefined ? comps.duration : (totalMin ? Math.round(Math.min(totalMin / st.totalTarget, 1) * 100) : 0);
        const wakeScoreVal = comps.wakeups !== undefined ? comps.wakeups : [100,85,70,50,30,15,0][Math.min(wakeVal, 6)];
        const bedScoreVal = comps.bedtime !== undefined ? comps.bedtime : 50;
        const napScoreVal = comps.naps !== undefined ? comps.naps : ((napVal >= napMin && napVal <= napMax) ? 100 : napVal === napMax + 1 ? 70 : (napVal === napMin - 1 && napMin > 0) ? 60 : napVal === 0 ? 0 : 40);
        const items = [
          { name: 'Duration', weight: '40%', score: durScore, detail: durDetail, tab: 'sleep' },
          { name: 'Wake-ups', weight: '30%', score: wakeScoreVal, detail: wakeVal + ' wake-up' + (wakeVal !== 1 ? 's' : ''), tab: 'sleep' },
          { name: 'Bedtime', weight: '15%', score: bedScoreVal, detail: 'Ideal: ' + st.bedtimeStart + ':00–' + st.bedtimeEnd + ':00 (' + st.label + ')', tab: 'sleep' },
          { name: 'Naps', weight: '15%', score: napScoreVal, detail: napVal + ' nap' + (napVal !== 1 ? 's' : '') + ' (ideal: ' + napMin + '–' + napMax + ')', tab: 'sleep' },
        ];
        if (r.modifier && r.modifier.delta !== 0 && getModifierWeight() > 0 && !isEssentialMode()) {
          items.push({ name: 'Trends', weight: '', score: null, isTrend: true, delta: r.modifier.delta, label: r.modifier.label, tab: 'insights' });
        }
        return items;
      }
    },
    {
      key: 'diet', icon: zi('bowl'), name: 'Diet', tab: 'diet',
      tip: 'Aim for 3 meals daily + snack as bonus with diverse foods across all food groups. Variety is key!',
      components: () => {
        const r = zs.domains.diet.result;
        if (!r) return [];
        const d = r.detail || {};
        const items = [
          { name: 'Meals', weight: '30%', score: r.components.meals,
            detail: (d.mealsLogged || 0) + '/' + (d.mealsTotal || 3) + ' meals logged today', tab: 'diet' },
          { name: 'Variety', weight: '30%', score: r.components.variety,
            detail: (d.uniqueFoods || 0) + ' unique foods this week (target: ' + (d.varietyTarget || 10) + ')', tab: 'diet' },
          { name: 'Groups', weight: '20%', score: r.components.groups,
            detail: (d.groupsHit || 0) + '/' + (d.groupsTotal || 6) + ' food groups covered', tab: 'diet' },
          { name: 'Nutrients', weight: '20%', score: r.components.nutrients,
            detail: (d.nutrientsCovered || 0) + '/' + (d.nutrientsTotal || 8) + ' key nutrients this week', tab: 'insights' },
        ];
        if (r.modifier && r.modifier.delta !== 0 && getModifierWeight() > 0 && !isEssentialMode()) {
          items.push({ name: 'Trends', weight: '', score: null, isTrend: true, delta: r.modifier.delta, label: r.modifier.label, tab: 'insights' });
        }
        return items;
      }
    },
    {
      key: 'poop', icon: zi('diaper'), name: 'Poop', tab: 'poop',
      tip: 'Normal baby poop is soft and brownish-yellow. Track consistency to spot dietary sensitivities early.',
      components: () => {
        const r = zs.domains.poop.result;
        if (!r) return [];
        const d = r.detail || {};
        if (r.isCarryForward) return [
          { name: 'Carry-forward', weight: '', score: r.score,
            detail: 'No poop today — using last score' + (r.staleDays ? ' (' + r.staleDays + 'd ago, −' + (r.staleDays * 2) + ' decay)' : ''), tab: 'poop' }
        ];
        const items = [
          { name: 'Consistency', weight: '40%', score: r.components.consistency,
            detail: 'Worst today: ' + capitalize(d.worstConsistency || 'normal'), tab: 'poop' },
          { name: 'Frequency', weight: '30%', score: r.components.frequency,
            detail: (d.poopCount || 0) + ' poops (baseline: ' + (d.baselineFreq || '?') + '/day)', tab: 'poop' },
          { name: 'Color', weight: '20%', score: r.components.color,
            detail: d.colors && d.colors.length ? 'Colors: ' + d.colors.join(', ') : 'All normal colors', tab: 'poop' },
          { name: 'Symptoms', weight: '10%', score: r.components.symptoms,
            detail: d.hasBlood ? zi('warn') + ' Blood detected' : d.hasMucus ? zi('warn') + ' Mucus detected' : zi('check') + ' No blood or mucus', tab: 'poop' },
        ];
        if (r.modifier && r.modifier.delta !== 0 && getModifierWeight() > 0 && !isEssentialMode()) {
          items.push({ name: 'Trends', weight: '', score: null, isTrend: true, delta: r.modifier.delta, label: r.modifier.label, tab: 'insights' });
        }
        return items;
      }
    },
    {
      key: 'medical', icon: zi('medical'), name: 'Medical', tab: 'medical',
      tip: 'Keep vaccinations on schedule and log Vitamin D3 daily for best scores.',
      components: () => {
        const r = zs.domains.medical.result;
        if (!r) return [];
        const d = r.detail || {};
        const items = [
          { name: 'Vaccines', weight: '40%', score: r.components.vaccination,
            detail: (d.vaccGiven || 0) + '/' + (d.vaccDue || 0) + ' age-due vaccines given', tab: 'medical' },
          { name: 'Supplements', weight: '25%', score: r.components.supplements,
            detail: d.suppDays !== null ? d.suppDays + '/7 days given this week' : 'No active supplements', tab: 'medical' },
          { name: 'Growth', weight: '20%', score: r.components.growth,
            detail: d.daysSinceGrowth !== null ? 'Last measured ' + d.daysSinceGrowth + 'd ago' + (d.hasBothMeasures ? ' (wt+ht)' : '') : 'No measurements', tab: 'growth' },
          { name: 'Checkup', weight: '15%', score: r.components.visits,
            detail: r.components.visits >= 90 ? 'Checkup on track' : r.components.visits >= 85 ? 'Appointment booked' : 'Developmental checkup may be due', tab: 'medical' },
        ];
        if (r.modifier && r.modifier.delta !== 0 && getModifierWeight() > 0 && !isEssentialMode()) {
          items.push({ name: 'Trends', weight: '', score: null, isTrend: true, delta: r.modifier.delta, label: r.modifier.label, tab: 'insights' });
        }
        return items;
      }
    },
    {
      key: 'milestones', icon: zi('trophy'), name: 'Milestones', tab: 'milestones',
      tip: 'Mark milestones as in-progress to boost tracking scores. Every baby develops at their own pace!',
      components: () => {
        const r = zs.domains.milestones.result;
        if (!r) return [];
        const d = r.detail || {};
        const items = [
          { name: 'Completion', weight: '35%', score: r.components.completion,
            detail: (d.expectedDone || 0) + '/' + (d.expectedTotal || 0) + ' age-expected milestones done', tab: 'milestones' },
          { name: 'Categories', weight: '25%', score: r.components.categories,
            detail: (d.catsActive || 0) + '/4 domains active (motor, language, social, cognitive)', tab: 'milestones' },
          { name: 'Tracking', weight: '20%', score: r.components.tracking,
            detail: (d.inProgress || 0) + ' in-progress milestones', tab: 'milestones' },
          { name: 'Advanced', weight: '10%', score: r.components.advanced,
            detail: (d.advancedDone || 0) + ' advanced milestones achieved', tab: 'milestones' },
          { name: 'Recency', weight: '10%', score: r.components.recency,
            detail: r.components.recency >= 80 ? 'Active in last week' : 'Last activity over a week ago', tab: 'milestones' },
        ];
        if (r.modifier && r.modifier.delta !== 0 && getModifierWeight() > 0 && !isEssentialMode()) {
          items.push({ name: 'Trends', weight: '', score: null, isTrend: true, delta: r.modifier.delta, label: r.modifier.label, tab: 'insights' });
        }
        return items;
      }
    },
  ];
}

function _spRenderBody() {
  const el = document.getElementById('spBody');
  if (!el || !_spZivaScore) return;
  const zs = _spZivaScore;

  if (_spActiveTab === 'overview') {
    _spRenderOverview(el, zs);
    return;
  }

  const defs = _spGetDomainDefs(zs);
  const dom = defs.find(d => d.key === _spActiveTab);
  if (!dom) return;

  const d = zs.domains[dom.key];
  const domScore = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : '—';
  const domLevel = typeof domScore === 'number' ? getScoreLabel(domScore) : null;
  const weight = d ? Math.round(d.weight * 100) + '%' : '';
  const comps = dom.components();

  // Score badge color
  const badgeColors = {
    excellent:'background:rgba(45,134,89,0.12); color:#1a7a42;',
    great:'background:rgba(127,184,216,0.12); color:#2a6a8a;',
    good:'background:rgba(232,200,109,0.12); color:#8a6520;',
    fair:'background:rgba(232,160,80,0.12); color:#8a5020;',
    attention:'background:rgba(224,112,112,0.12); color:#a03030;'
  };
  const badgeStyle = domLevel ? badgeColors[domLevel.label] || '' : '';

  let html = `<div class="sp-domain-card">
    <div class="sp-domain-title">
      <span class="sp-domain-title-icon">${dom.icon}</span>
      <span class="sp-domain-title-text">${dom.name} <span style="font-weight:400;font-size:var(--fs-xs);color:var(--light);">${weight}</span></span>
      <span class="sp-domain-title-score" style="${badgeStyle}">${domScore}</span>
    </div>`;

  comps.forEach(c => {
    if (c.isTrend) {
      // Intelligence modifier trend line
      const sign = c.delta > 0 ? '+' : '';
      const trendClass = c.delta > 0 ? 'sp-trend-up' : c.delta < 0 ? 'sp-trend-down' : 'sp-trend-flat';
      html += '<div class="sp-trend-line">';
      html += '<span class="sp-trend-icon icon-sky">' + zi('chart') + '</span>';
      html += '<span class="sp-trend-label">Trends</span>';
      html += '<span class="sp-trend-delta ' + trendClass + '">' + sign + c.delta + '</span>';
      if (c.label) html += '<span class="sp-trend-detail">' + escHtml(c.label) + '</span>';
      html += '</div>';
      return;
    }
    const barClass = c.score >= 70 ? 'spb-high' : c.score >= 40 ? 'spb-mid' : 'spb-low';
    const scoreColor = c.score >= 70 ? 'color:#1a7a42;' : c.score >= 40 ? 'color:#8a6520;' : 'color:#a03030;';
    html += `<div class="sp-comp">
      <div class="sp-comp-header">
        <div class="sp-comp-name">${c.name}</div>
        <div class="sp-comp-weight">${c.weight}</div>
        <div class="sp-comp-score" style="${scoreColor}">${c.score}</div>
      </div>
      <div class="sp-comp-bar"><div class="sp-comp-bar-fill dyn-fill ${barClass}" style="--dyn-pct:${c.score}%"></div></div>`;
    if (c.detail) {
      html += `<div class="sp-comp-detail">${c.detail}</div>`;
      if (c.tab) {
        html += `<div class="sp-comp-action" onclick="closeScorePopup();setTimeout(()=>switchTab('${c.tab}'),350)">Go to ${capitalize(c.tab)} →</div>`;
      }
    }
    html += `</div>`;
  });

  if (dom.tip) {
    html += `<div class="sp-tip">${zi('bulb')} ${dom.tip}</div>`;
  }

  html += `</div>`;
  el.innerHTML = html;
  el.scrollTop = 0;
}

function _spRenderOverview(el, zs) {
  const defs = _spGetDomainDefs(zs);

  let html = '<div class="sp-overview-grid">';
  defs.forEach(dom => {
    const d = zs.domains[dom.key];
    const sv = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : '—';
    const lbl = typeof sv === 'number' ? getScoreLabel(sv) : null;
    const staleTag = d && d.isStale ? ' opacity:0.55;' : '';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColors = isDark ? {
      excellent:'background:linear-gradient(135deg, #1e3028, #1a2e24); border-color:rgba(111,207,151,0.2);',
      great:'background:linear-gradient(135deg, #1e2838, #1a2634); border-color:rgba(127,184,216,0.2);',
      good:'background:linear-gradient(135deg, #302818, #2e2614); border-color:rgba(232,200,109,0.2);',
      fair:'background:linear-gradient(135deg, #302018, #2e1e14); border-color:rgba(232,160,80,0.2);',
      attention:'background:linear-gradient(135deg, #302020, #2e1a1a); border-color:rgba(224,112,112,0.2);'
    } : {
      excellent:'background:linear-gradient(135deg, #e8f5ef, #d8efdf); border-color:rgba(111,207,151,0.35);',
      great:'background:linear-gradient(135deg, #e5f0f8, #d5e8f4); border-color:rgba(127,184,216,0.35);',
      good:'background:linear-gradient(135deg, #fef8ee, #fdf0d8); border-color:rgba(232,200,109,0.35);',
      fair:'background:linear-gradient(135deg, #fef3e5, #fce5c8); border-color:rgba(232,160,80,0.35);',
      attention:'background:linear-gradient(135deg, #fef0f0, #fcdcdc); border-color:rgba(224,112,112,0.35);'
    };
    const scoreColor = lbl ? (isDark ? {
      excellent:'color:#7ac0a0;', great:'color:#80b8d8;', good:'color:#d4b040;', fair:'color:#e8a050;', attention:'color:#f09090;'
    } : {
      excellent:'color:#1a7a42;', great:'color:#2a6a8a;', good:'color:#8a6520;', fair:'color:#8a5020;', attention:'color:#a03030;'
    })[lbl.label] || '' : '';
    const bg = lbl ? bgColors[lbl.label] || '' : '';
    html += `<div class="sp-overview-item" style="${bg}${staleTag}" data-action="_spSwitchTab" data-arg="${dom.key}">
      <div class="sp-overview-icon">${dom.icon}</div>
      <div class="sp-overview-score" style="${scoreColor}">${d && d.isStale ? '~' : ''}${sv}</div>
      <div class="sp-overview-name">${dom.name}</div>
      <div class="sp-overview-sublabel">${lbl ? lbl.emoji + ' ' + lbl.label.charAt(0).toUpperCase() + lbl.label.slice(1) : ''}</div>
    </div>`;
  });
  html += '</div>';

  // Weight breakdown
  html += '<div style="padding:8px 0 0;">';
  html += '<div style="font-size:var(--fs-xs);font-weight:600;color:var(--mid);text-transform:uppercase;letter-spacing:var(--ls-wide);margin-bottom:8px;">Weight Distribution</div>';
  defs.forEach(dom => {
    const d = zs.domains[dom.key];
    const w = d ? Math.round(d.weight * 100) : 0;
    const sv = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : 0;
    const barClass = sv >= 70 ? 'spb-high' : sv >= 40 ? 'spb-mid' : 'spb-low';
    html += `<div style="display:flex;align-items:center;gap:var(--sp-8);padding:4px 0;cursor:pointer;" data-action="_spSwitchTab" data-arg="${dom.key}">
      <span style="font-size:var(--icon-xs);">${dom.icon}</span>
      <span style="font-size:var(--fs-xs);color:var(--mid);width:70px;">${dom.name}</span>
      <span style="font-size:var(--fs-xs);color:var(--light);width:28px;text-align:center;">${w}%</span>
      <div class="sp-comp-bar flex-1" ><div class="sp-comp-bar-fill dyn-fill ${barClass}" style="--dyn-pct:${sv}%"></div></div>
      <span style="font-size:var(--fs-xs);font-weight:600;width:28px;text-align:right;">${sv}</span>
    </div>`;
  });
  html += '</div>';

  html += `<div class="sp-tip">${zi('bulb')} Tap any domain above to see its full breakdown. Scores update as you log data throughout the day.</div>`;

  el.innerHTML = html;
  el.scrollTop = 0;
}

// Swipe-down to close score popup + horizontal swipe between tabs
const SP_TAB_ORDER = ['overview','sleep','diet','poop','medical','milestones'];

(function() {
  let _spTouchStartY = 0, _spTouchStartX = 0, _spTouchOnTabBar = false;

  function initScorePopupTouch() {
    const popup = document.getElementById('scorePopup');
    if (!popup) return;

    popup.addEventListener('touchstart', function(e) {
      _spTouchStartY = e.touches[0].clientY;
      _spTouchStartX = e.touches[0].clientX;
      // Track if touch started on the tab bar (don't intercept its horizontal scroll)
      _spTouchOnTabBar = !!e.target.closest('.sp-tab-bar');
      e.stopPropagation();
    }, {passive:true});

    popup.addEventListener('touchmove', function(e) {
      e.stopPropagation();
    }, {passive:true});

    popup.addEventListener('touchend', function(e) {
      e.stopPropagation();
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const dy = endY - _spTouchStartY;
      const dx = endX - _spTouchStartX;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Horizontal swipe between tabs (only on body, not tab bar)
      if (!_spTouchOnTabBar && absDx > 50 && absDx > absDy * 1.2) {
        const curIdx = SP_TAB_ORDER.indexOf(_spActiveTab);
        if (dx < -50 && curIdx < SP_TAB_ORDER.length - 1) {
          _spSwitchTab(SP_TAB_ORDER[curIdx + 1]);
        } else if (dx > 50 && curIdx > 0) {
          _spSwitchTab(SP_TAB_ORDER[curIdx - 1]);
        }
        return;
      }

      // Vertical swipe down to close (only when body not scrolled)
      if (dy > 80 && absDy > absDx) {
        const spBody = document.getElementById('spBody');
        if (!spBody || spBody.scrollTop <= 0) closeScorePopup();
      }
    }, {passive:true});
  }

  function initScoreOverlayTouch() {
    const overlay = document.getElementById('scorePopupOverlay');
    if (!overlay) return;
    overlay.addEventListener('touchstart', function(e) { e.stopPropagation(); }, {passive:true});
    overlay.addEventListener('touchmove', function(e) { e.stopPropagation(); }, {passive:true});
    overlay.addEventListener('touchend', function(e) { e.stopPropagation(); }, {passive:true});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initScorePopupTouch(); initScoreOverlayTouch(); });
  } else {
    initScorePopupTouch(); initScoreOverlayTouch();
  }
})();

/* ── Alert Intelligence Card ── */
function renderAlertIntelligence() {
  const card = document.getElementById('insightsAlertIntelCard');
  const prevEl = document.getElementById('insightsAlertIntelPreview');
  const bodyEl = document.getElementById('insightsAlertIntelContent');
  if (!card || !bodyEl) return;

  const history = loadAlertHistory();
  if (history.length < 3) { card.style.display = 'none'; return; }
  card.style.display = '';

  const now = Date.now();
  const d14 = 14 * 86400000;
  const d7 = 7 * 86400000;

  // Build alert profiles: group by alert key, track lifecycle
  const profiles = {};
  history.forEach(h => {
    const k = h.key || 'unknown';
    if (!profiles[k]) profiles[k] = { key: k, title: h.title || k, triggers: [], dismissals: [], resolutions: [], isPositive: k.startsWith('positive-') };
    const ts = h.ts ? new Date(h.ts).getTime() : 0;
    if (h.event === 'triggered') profiles[k].triggers.push(ts);
    else if (h.event === 'dismissed') profiles[k].dismissals.push(ts);
    else if (h.event === 'resolved') profiles[k].resolutions.push(ts);
    if (h.severity === 'positive') profiles[k].isPositive = true;
  });

  // Classify each alert
  const concerns = [];   // Currently active (triggered recently, not resolved)
  const recurring = [];  // Triggered 3+ times
  const resolved = [];   // Was active, now resolved

  Object.values(profiles).forEach(p => {
    const lastTrigger = p.triggers.length ? Math.max(...p.triggers) : 0;
    const lastResolve = p.resolutions.length ? Math.max(...p.resolutions) : 0;
    const lastDismiss = p.dismissals.length ? Math.max(...p.dismissals) : 0;
    const triggerCount = p.triggers.length;
    const isActive = lastTrigger > lastResolve && (now - lastTrigger) < d14;
    const isResolved = lastResolve > lastTrigger && lastResolve > 0;
    const isRecurring = triggerCount >= 3;

    // Recent triggers (last 14d)
    const recentTriggers = p.triggers.filter(t => (now - t) < d14).length;
    // Previous 14d triggers
    const prevTriggers = p.triggers.filter(t => (now - t) >= d14 && (now - t) < d14 * 2).length;
    // Trend
    let trend = 'stable';
    if (recentTriggers > prevTriggers + 1) trend = 'worsening';
    else if (recentTriggers < prevTriggers - 1) trend = 'improving';
    else if (isResolved) trend = 'improving';

    const daysSinceLast = lastTrigger ? Math.round((now - lastTrigger) / 86400000) : null;
    const daysSinceResolved = lastResolve ? Math.round((now - lastResolve) / 86400000) : null;

    const entry = {
      ...p,
      triggerCount,
      recentTriggers,
      isActive,
      isResolved,
      isRecurring,
      trend,
      daysSinceLast,
      daysSinceResolved,
      lastTrigger,
      lastResolve,
    };

    if (isActive && !isResolved && !p.isPositive) concerns.push(entry);
    if (isRecurring && !isResolved && !p.isPositive) recurring.push(entry);
    if (isResolved && triggerCount >= 2 && !p.isPositive) resolved.push(entry);
  });

  // Filter out vaccination alerts if appointment is booked
  const vaccBooked = load(KEYS.vaccBooked, null);
  if (vaccBooked && vaccBooked.vaccName) {
    const vaccKey = sanitizeAlertKey('vacc-reminder-' + vaccBooked.vaccName);
    [concerns, recurring, resolved].forEach(arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].key === vaccKey) arr.splice(i, 1);
      }
    });
  }

  // Dedup: if something is in concerns AND recurring, keep in both (they serve different purposes)
  // Sort
  concerns.sort((a, b) => b.lastTrigger - a.lastTrigger);
  recurring.sort((a, b) => b.triggerCount - a.triggerCount);
  resolved.sort((a, b) => b.lastResolve - a.lastResolve);

  // Preview
  if (prevEl) {
    const total = concerns.length + recurring.length + resolved.length;
    if (total === 0) {
      prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-good">No notable alert patterns</span></div>';
      return;
    }
    let pills = '';
    if (concerns.length) pills += `<span class="ins-preview-pill ipp-warn">${concerns.length} active</span>`;
    if (recurring.length) pills += `<span class="ins-preview-pill ipp-neutral">${recurring.length} recurring</span>`;
    if (resolved.length) pills += `<span class="ins-preview-pill ipp-good">${resolved.length} resolved</span>`;
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  // Body
  let html = '';

  // Summary bar
  html += '<div class="ai-summary-bar">';
  if (concerns.length) html += `<div class="ai-summary-stat ai-ss-concern">${zi('siren')} ${concerns.length} active</div>`;
  if (recurring.length) html += `<div class="ai-summary-stat ai-ss-recurring">${zi('warn')} ${recurring.length} recurring</div>`;
  if (resolved.length) html += `<div class="ai-summary-stat ai-ss-resolved">${zi('check')} ${resolved.length} resolved</div>`;
  html += '</div>';

  // Active Concerns
  if (concerns.length) {
    html += `<div class="ai-section-label">${zi('siren')} Active Concerns <span class="ai-section-count">(${concerns.length})</span></div>`;
    concerns.slice(0, 5).forEach(c => {
      const trendIcon = c.trend === 'worsening' ? zi('chart') : c.trend === 'improving' ? zi('chart') : '→';
      const trendClass = c.trend === 'worsening' ? 'ait-worsening' : c.trend === 'improving' ? 'ait-improving' : 'ait-stable';
      const trendLabel = c.trend === 'worsening' ? 'Getting worse' : c.trend === 'improving' ? 'Improving' : 'Stable';
      const daysStr = c.daysSinceLast !== null ? c.daysSinceLast + 'd ago' : '';
      html += `<div class="ai-item ai-concern ptr" onclick="${getAlertNavAction(c.key, c.title)}" >
        <div class="ai-item-header">
          <span class="ai-item-icon">${zi('warn')}</span>
          <span class="ai-item-title">${escHtml(_cleanAlertTitle(c.title))}</span>
          <span class="ai-item-badge ai-badge-active">${daysStr}</span>
        </div>
        <div class="ai-item-detail">Triggered ${c.triggerCount} time${c.triggerCount !== 1 ? 's' : ''}, ${c.recentTriggers} in the last 2 weeks. ${c.dismissals.length > 0 ? 'Dismissed ' + c.dismissals.length + '× but keeps returning.' : 'Tap the alert to dismiss or take action.'}</div>
        <div class="ai-item-meta">
          <span class="ai-item-trend ${trendClass}">${trendIcon} ${trendLabel}</span>
        </div>
      </div>`;
    });
  }

  // Recurring Patterns
  const recurringOnly = recurring.filter(r => !concerns.find(c => c.key === r.key));
  if (recurringOnly.length) {
    html += `<div class="ai-section-label">${zi('warn')} Recurring Patterns <span class="ai-section-count">(${recurringOnly.length})</span></div>`;
    recurringOnly.slice(0, 5).forEach(c => {
      const trendIcon = c.trend === 'worsening' ? zi('chart') : c.trend === 'improving' ? zi('chart') : '→';
      const trendClass = c.trend === 'worsening' ? 'ait-worsening' : c.trend === 'improving' ? 'ait-improving' : 'ait-stable';
      const trendLabel = c.trend === 'worsening' ? 'Getting worse' : c.trend === 'improving' ? 'Improving' : 'Stable';
      html += `<div class="ai-item ai-recurring ptr" onclick="${getAlertNavAction(c.key, c.title)}" >
        <div class="ai-item-header">
          <span class="ai-item-icon">${zi('hourglass')}</span>
          <span class="ai-item-title">${escHtml(_cleanAlertTitle(c.title))}</span>
          <span class="ai-item-badge ai-badge-recurring">${c.triggerCount}× total</span>
        </div>
        <div class="ai-item-detail">Keeps coming back — triggered ${c.recentTriggers} time${c.recentTriggers !== 1 ? 's' : ''} recently. ${c.trend === 'improving' ? 'Frequency is decreasing though.' : c.trend === 'worsening' ? 'Getting more frequent.' : 'Holding steady.'}</div>
        <div class="ai-item-meta">
          <span class="ai-item-trend ${trendClass}">${trendIcon} ${trendLabel}</span>
        </div>
      </div>`;
    });
  }

  // Resolved Wins
  if (resolved.length) {
    html += `<div class="ai-section-label">${zi('check')} Resolved <span class="ai-section-count">(${resolved.length})</span></div>`;
    resolved.slice(0, 5).forEach(c => {
      const resolvedAgo = c.daysSinceResolved !== null ? c.daysSinceResolved + 'd ago' : '';
      html += `<div class="ai-item ai-resolved">
        <div class="ai-item-header">
          <span class="ai-item-icon">${zi('party')}</span>
          <span class="ai-item-title">${escHtml(_cleanAlertTitle(c.title))}</span>
          <span class="ai-item-badge ai-badge-resolved">resolved ${resolvedAgo}</span>
        </div>
        <div class="ai-item-detail">Was triggered ${c.triggerCount} time${c.triggerCount !== 1 ? 's' : ''} before being resolved. ${c.triggerCount >= 4 ? 'This was a persistent issue — great that it\'s fixed!' : 'Handled quickly.'}</div>
      </div>`;
    });
  }

  if (!concerns.length && !recurringOnly.length && !resolved.length) {
    html = '<div style="font-size:var(--fs-sm);color:var(--mid);padding:8px 0;">Not enough alert history to detect patterns yet. Keep logging — patterns will emerge as alerts accumulate over days and weeks.</div>';
  }

  bodyEl.innerHTML = html;
}

function _cleanAlertTitle(title) {
  // Clean up raw alert keys to be human-readable
  if (!title) return 'Unknown alert';
  return title
    .replace(/^food-correlation-/i, 'Food reaction: ')
    .replace(/^food-group-gap-/i, 'Missing food group: ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function renderCorrelationCard() {
  const prevEl = document.getElementById('insightsCorrPreview');
  const bodyEl = document.getElementById('insightsCorrContent');
  if (!prevEl || !bodyEl) return;

  const corr = computeFoodPoopCorrelations();
  const results = corr.results;

  // Preview
  if (results.length === 0) {
    prevEl.innerHTML = '<div style="font-size:var(--fs-xs);color:var(--tc-sage);">' + zi('check') + ' No patterns detected — keep logging for insights</div>';
    bodyEl.innerHTML = '<div style="font-size:var(--fs-sm);color:var(--mid);">Correlations appear after the same food is eaten 3+ times with poop data in the following 24–48h window. Keep logging meals and poops consistently.</div>';
    return;
  }

  const topItem = results[0];
  const pct = Math.round(topItem.correlationRate * 100);
  prevEl.innerHTML = `<div style="font-size:var(--fs-xs);color:var(--tc-caution);">${zi('warn')} ${results.length} food${results.length > 1 ? 's' : ''} flagged — top: <b>${capitalize(topItem.food)}</b> → ${topItem.breakdown.consistency ? Object.keys(topItem.breakdown.consistency).filter(k => k !== 'normal' && k !== 'soft').join('/') || 'abnormal' : 'abnormal'} ${pct}%</div>`;

  // Full body
  let html = '';
  results.forEach((r, idx) => {
    const rpct = Math.round(r.correlationRate * 100);
    const statusClass = 'corr-' + r.status;
    const rateClass = rpct >= 60 ? 'cr-high' : rpct >= 40 ? 'cr-mid' : 'cr-low';
    const conList = Object.entries(r.breakdown.consistency).filter(([k]) => k !== 'normal' && k !== 'soft').map(([k, v]) => k + ' (' + v + '×)').join(', ');
    const watchBadge = r.isWatchList ? ' <span class="score-badge sb-fair">' + zi('warn') + ' Watch</span>' : '';

    html += `<div class="corr-item ${statusClass}">
      <div class="corr-header">
        <span class="corr-food">${capitalize(escHtml(r.food))}${watchBadge}</span>
        <span class="corr-rate ${rateClass}">${rpct}% (${r.abnormalAfter}/${r.totalOccurrences})</span>
      </div>
      <div class="corr-detail">${conList || 'Abnormal poop pattern'} · Confidence: ${r.confidence}</div>
      <div class="corr-evidence" data-action="toggleCorrEvidence" data-arg="${idx}"><span class="collapse-chevron" id="corrChev-${idx}">▾</span> View evidence (last ${r.dates.length})</div>
      <div class="corr-evidence-trail" id="corrEvidence-${idx}">
        ${r.dates.map(d => `<div class="corr-ev-row">${zi('bowl')} ${formatDate(d.ate)} → ${zi('diaper')} ${formatDate(d.poopDate)} · ${d.consistency}${d.abnormal ? ' ' + zi('warn') : ' ' + zi('check')}</div>`).join('')}
      </div>
    </div>`;
  });

  if (corr.clearFoods > 0) {
    html += `<div class="corr-clear">${zi('check')} ${corr.clearFoods} food${corr.clearFoods > 1 ? 's' : ''} tracked with no issues</div>`;
  }

  bodyEl.innerHTML = html;
}

function toggleCorrEvidence(idx) {
  const el = document.getElementById('corrEvidence-' + idx);
  const chev = document.getElementById('corrChev-' + idx);
  if (el) {
    el.classList.toggle('open');
    if (chev) chev.style.transform = el.classList.contains('open') ? 'rotate(180deg)' : '';
  }
}

function renderVarietyCard() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderVarietyCard() {
  const prevEl = document.getElementById('insightsVarietyPreview');
  const bodyEl = document.getElementById('insightsVarietyContent');
  if (!prevEl || !bodyEl) return;

  const vs = computeVarietyScore(7);
  const pct = vs.target > 0 ? Math.min(Math.round((vs.uniqueFoods / vs.target) * 100), 100) : 0;
  const ratingBadge = vs.rating === 'great' ? 'sb-excellent' : vs.rating === 'good' ? 'sb-good' : vs.rating === 'building' ? 'sb-fair' : 'sb-attention';

  // Preview
  prevEl.innerHTML = `<div class="fs-xs-mid">${vs.uniqueFoods} / ${vs.target} foods · ${vs.groupsHit}/${vs.groupsTotal} groups <span class="score-badge ${ratingBadge}">${vs.rating}</span></div>`;

  // Full body
  let html = '';
  // Variety bar
  html += `<div class="fs-sm-600">${vs.uniqueFoods} / ${vs.target} unique foods this week</div>`;
  html += `<div class="variety-bar"><div class="variety-bar-fill dyn-fill" style="--dyn-pct:${pct}%"></div></div>`;

  // Food group icons
  html += '<div class="variety-groups">';
  Object.entries(vs.groupCoverage).forEach(([gid, gc]) => {
    const icon = FOOD_TAX[gid] ? FOOD_TAX[gid].icon : '?';
    const status = gc.hit ? zi('check') : zi('warn');
    html += `<div class="variety-group">${icon}<span class="vg-status">${status}</span></div>`;
  });
  html += '</div>';

  // Gaps
  vs.gaps.forEach(g => {
    html += `<div class="variety-gap">${zi('warn')} No ${g.label.toLowerCase()} in ${g.daysSince !== null ? g.daysSince + ' days' : 'recorded history'}</div>`;
    html += `<div class="variety-gap-suggestion">→ ${g.suggestion}</div>`;
  });
  vs.subcategoryGaps.forEach(g => {
    html += `<div class="variety-gap">${zi('warn')} No ${g.label.toLowerCase()} in ${g.daysSince !== null ? g.daysSince + ' days' : 'recorded history'}</div>`;
    html += `<div class="variety-gap-suggestion">→ ${g.suggestion}</div>`;
  });

  // Trend
  if (vs.trend.uniqueFoodsDelta !== 0 || vs.trend.groupsDelta !== 0) {
    const arrow = vs.trend.direction === 'improving' ? zi('chart') : vs.trend.direction === 'declining' ? zi('chart') : '→';
    const parts = [];
    if (vs.trend.uniqueFoodsDelta !== 0) parts.push((vs.trend.uniqueFoodsDelta > 0 ? '+' : '') + vs.trend.uniqueFoodsDelta + ' foods');
    if (vs.trend.groupsDelta !== 0) parts.push((vs.trend.groupsDelta > 0 ? '+' : '') + vs.trend.groupsDelta + ' group' + (Math.abs(vs.trend.groupsDelta) > 1 ? 's' : ''));
    html += `<div style="font-size:var(--fs-xs);color:var(--mid);margin-top:6px;">vs last week: ${parts.join(', ')} ${arrow}</div>`;
  }

  bodyEl.innerHTML = html;
}

function renderNutrientRadar() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderNutrientRadar() {
  const prevEl = document.getElementById('insightsNutrientPreview');
  const bodyEl = document.getElementById('insightsNutrientContent');
  if (!prevEl || !bodyEl) return;

  const baselines = computeBaselines();
  const nutrients = baselines.nutrientDays || {};
  const EMOJI_MAP = { iron: zi('drop'), calcium: zi('ruler'), protein: zi('run'), 'vitamin C': zi('bowl'), fibre: zi('bowl'), 'vitamin A': zi('scope'), 'omega-3': zi('brain'), zinc: zi('shield') };
  const covered = KEY_NUTRIENTS.filter(n => (nutrients[n] || 0) >= 1).length;

  // Preview
  prevEl.innerHTML = `<div class="fs-xs-mid">${covered}/${KEY_NUTRIENTS.length} nutrients covered this week</div>`;

  // Full body
  let html = '';
  KEY_NUTRIENTS.forEach(n => {
    const days = nutrients[n] || 0;
    const pct = Math.min(Math.round((days / 7) * 100), 100);
    const barClass = pct >= 70 ? 'nb-high' : pct >= 40 ? 'nb-mid' : 'nb-low';
    html += `<div class="nutrient-row">
      <div class="nutrient-emoji">${EMOJI_MAP[n] || '•'}</div>
      <div class="nutrient-name">${capitalize(n)}</div>
      <div class="nutrient-bar-wrap"><div class="nutrient-bar-fill dyn-fill ${barClass}" style="--dyn-pct:${pct}%"></div></div>
      <div class="nutrient-count">${days}/7d</div>
    </div>`;
  });

  // Iron + Vit C synergy
  const ironVitC = baselines.ironVitCPairings || 0;
  if (ironVitC > 0) {
    html += `<div style="font-size:var(--fs-xs);color:var(--tc-sage);margin-top:6px;">Iron + Vit C paired: ${ironVitC} time${ironVitC > 1 ? 's' : ''}</div>`;
  }

  bodyEl.innerHTML = html;
}

function renderWeeklySummary() {
  const el = document.getElementById('homeWeeklySummary');
  const contentEl = document.getElementById('homeWeeklySummaryContent');
  if (!el || !contentEl) return;

  // Compute weekly data
  const zs = calcZivaScore();
  const trend = getZivaScoreTrend7d();
  const sleepT = getSleepTrend7d();
  const poopT = getPoopTrend7d();
  const feedT = getFeedingTrend7d();
  const vs = computeVarietyScore(7);
  const corr = computeFoodPoopCorrelations();
  const dietS = calcDietScore();
  const medS = calcMedicalScore();

  // Find week range
  const todayDate = new Date(today());
  const weekStart = new Date(todayDate);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekLabel = formatDate(toDateStr(weekStart)).split(',')[0] + ' – ' + formatDate(today()).split(',')[0];

  // Recent milestones
  const recentMs = (milestones || []).filter(m => {
    if (m.status !== 'done' || !m.doneAt) return false;
    const d = new Date(m.doneAt);
    return (todayDate - d) / 86400000 <= 7;
  });

  el.style.display = '';
  let html = `<div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:8px;">${weekLabel}</div>`;

  const rows = [];
  if (zs.score !== null) rows.push({ icon: zi('sparkle'), label: 'Ziva Score', val: trend.avg7d || zs.score, delta: trend.delta });
  if (sleepT.score.current != null) rows.push({ icon: zi('moon'), label: 'Sleep', val: sleepT.score.current + '/100' });
  rows.push({ icon: zi('bowl'), label: 'Diet', val: dietS.score + ' · ' + vs.uniqueFoods + ' foods' });
  if (poopT.freq.current > 0) rows.push({ icon: zi('diaper'), label: 'Poop', val: poopT.freq.current + '/day' });
  rows.push({ icon: zi('medical'), label: 'Medical', val: medS.score + '/100' });
  const msScore = calcMilestoneScore();
  const msDetail = msScore.detail;
  rows.push({ icon: zi('trophy'), label: 'Milestones', val: msScore.score + '/100 · ' + msDetail.inProgress + ' active' + (recentMs.length > 0 ? ' · ' + recentMs.length + ' new' : '') });
  if (corr.results.length > 0) rows.push({ icon: zi('warn'), label: 'Watch', val: corr.results[0].food + ' pattern' });

  rows.forEach(r => {
    const deltaHtml = r.delta ? `<div class="weekly-delta${r.delta < 0 ? ' wd-down' : ''}">${r.delta > 0 ? '+' : ''}${r.delta}</div>` : '';
    html += `<div class="weekly-row">
      <div class="weekly-icon">${r.icon}</div>
      <div class="weekly-label">${r.label}</div>
      <div class="weekly-val">${r.val}</div>
      ${deltaHtml}
    </div>`;
  });

  contentEl.innerHTML = html;
}
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// D3 SUPPLEMENT INSIGHTS
// ─────────────────────────────────────────

function renderInsightsD3() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsD3() {
  const el = document.getElementById('insightsD3Content');
  const prevEl = document.getElementById('insightsD3Preview');
  if (!el) return;

  const bl = computeBaselines();
  const d3Med = meds.find(m => m.active && m.name.toLowerCase().includes('d3'));
  if (!d3Med) {
    if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">No active D3 supplement</span></div>';
    el.innerHTML = '<div class="t-sub fe-center-action" >No active Vitamin D3 supplement being tracked.</div>';
    return;
  }

  const mKey = sanitizeAlertKey(d3Med.name);
  const streak = bl['suppStreak_' + mKey] || 0;
  const adherence = bl['suppAdherence30_' + mKey];
  const given30 = bl['suppGiven30_' + mKey] || 0;
  const total30 = bl['suppTotal30_' + mKey] || 0;

  // Preview
  if (prevEl) {
    let pills = '';
    const adhCls = adherence >= 90 ? 'ipp-good' : adherence >= 70 ? 'ipp-warn' : 'ipp-bad';
    if (adherence != null) pills += `<span class="ins-preview-pill ${adhCls}">${zi('pill')} ${adherence}% adherence</span>`;
    if (streak > 0) pills += `<span class="ins-preview-pill ipp-good">${zi('flame')} ${streak}d streak</span>`;
    else pills += `<span class="ins-preview-pill ipp-neutral">No active streak</span>`;
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  let html = '';

  // Adherence row
  html += `<div class="insight-row">
    <div class="ir-icon">${zi('pill')}</div>
    <div class="ir-body">
      <div class="ir-label">30-day adherence</div>
      <div class="ir-value">${given30}/${total30} days <span class="ir-delta ${adherence >= 90 ? 'trend-up' : adherence >= 70 ? 'trend-flat' : 'trend-down'}">${adherence != null ? adherence + '%' : '—'}</span></div>
    </div>
  </div>`;

  // Streak row
  const streakEmoji = streak >= 30 ? zi('trophy') : streak >= 14 ? zi('star') : streak >= 7 ? zi('flame') : streak > 0 ? zi('chart') : zi('hourglass');
  html += `<div class="insight-row">
    <div class="ir-icon">${streakEmoji}</div>
    <div class="ir-body">
      <div class="ir-label">Current streak</div>
      <div class="ir-value">${streak} day${streak !== 1 ? 's' : ''} <span class="ir-delta ${streak >= 7 ? 'trend-up' : streak > 0 ? 'trend-flat' : 'trend-down'}">${streak >= 30 ? zi('trophy') + ' champion' : streak >= 14 ? zi('star') + ' solid' : streak >= 7 ? zi('flame') + ' building' : streak > 0 ? 'keep going' : 'restart today'}</span></div>
    </div>
  </div>`;

  // Brand/dose info
  html += `<div class="insight-row">
    <div class="ir-icon">${zi('list')}</div>
    <div class="ir-body">
      <div class="ir-label">Current supplement</div>
      <div class="ir-value">${escHtml(d3Med.name)}${d3Med.brand ? ' · ' + escHtml(d3Med.brand) : ''}</div>
    </div>
  </div>`;
  if (d3Med.dose) {
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('drop')}</div>
      <div class="ir-body">
        <div class="ir-label">Dose</div>
        <div class="ir-value">${escHtml(d3Med.dose)} · ${escHtml(d3Med.freq || 'Once daily')}</div>
      </div>
    </div>`;
  }

  // Dos & Don'ts
  html += '<div style="margin-top:8px;">';
  html += '<div class="ir-label" style="margin-bottom:6px;font-weight:600;">' + zi('check') + ' Dos</div>';
  D3_KNOWLEDGE.dos.forEach(tip => {
    html += `<div style="font-size:var(--fs-sm);color:var(--mid);padding:3px 0 3px 16px;line-height:var(--lh-normal);">• ${escHtml(tip)}</div>`;
  });
  html += '<div class="ir-label" style="margin-top:8px;margin-bottom:6px;font-weight:600;">' + zi('warn') + ' Don\'ts</div>';
  D3_KNOWLEDGE.donts.forEach(tip => {
    html += `<div style="font-size:var(--fs-sm);color:var(--mid);padding:3px 0 3px 16px;line-height:var(--lh-normal);">• ${escHtml(tip)}</div>`;
  });
  html += '</div>';

  el.innerHTML = html;
}

// ─────────────────────────────────────────
// CROSS-DATA INSIGHTS
// ─────────────────────────────────────────

function renderInsightsCross() {
  const el = document.getElementById('insightsCrossContent');
  const prevEl = document.getElementById('insightsCrossPreview');
  if (!el) return;

  // Preview
  if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-info">' + zi('link') + ' Sleep × Meals × Growth</span></div>';

  let html = '';
  const last14 = getDateWindow(14, 0);

  // ── Sleep vs Feeding correlation ──
  const daysWithMealCount = [];
  last14.forEach(ds => {
    const sc = getDailySleepScore(ds);
    if (sc == null) return;
    const entry = feedingData[ds];
    const mealsLogged = entry ? ['breakfast','lunch','dinner','snack'].filter(m => entry[m]).length : 0;
    daysWithMealCount.push({ date: ds, score: sc.score, meals: mealsLogged });
  });

  if (daysWithMealCount.length >= 5) {
    const fullMealDays = daysWithMealCount.filter(d => d.meals >= 3);
    const partialMealDays = daysWithMealCount.filter(d => d.meals < 3 && d.meals > 0);
    const noMealDays = daysWithMealCount.filter(d => d.meals === 0);

    const avgFull = fullMealDays.length > 0 ? Math.round(fullMealDays.reduce((s,d) => s + d.score, 0) / fullMealDays.length) : null;
    const avgPartial = partialMealDays.length > 0 ? Math.round(partialMealDays.reduce((s,d) => s + d.score, 0) / partialMealDays.length) : null;
    const avgNone = noMealDays.length > 0 ? Math.round(noMealDays.reduce((s,d) => s + d.score, 0) / noMealDays.length) : null;

    // Build comparison if we have at least 2 groups
    const groups = [];
    if (avgFull != null && fullMealDays.length >= 2) groups.push({ label: '3 meals', avg: avgFull, n: fullMealDays.length });
    if (avgPartial != null && partialMealDays.length >= 2) groups.push({ label: '1–2 meals', avg: avgPartial, n: partialMealDays.length });
    if (avgNone != null && noMealDays.length >= 2) groups.push({ label: '0 meals', avg: avgNone, n: noMealDays.length });

    if (groups.length >= 2) {
      const best = groups.reduce((a,b) => a.avg >= b.avg ? a : b);
      const worst = groups.reduce((a,b) => a.avg <= b.avg ? a : b);

      html += `<div class="insight-row">
        <div class="ir-icon">${zi('bowl')}${zi('moon')}</div>
        <div class="ir-body">
          <div class="ir-label">Sleep vs meals (14-day)</div>
          <div class="ir-value">${groups.map(g => `${g.label}: <strong>${g.avg}</strong>`).join(' · ')}</div>
        </div>
      </div>`;

      if (best.avg - worst.avg >= 5) {
        html += `<div class="insight-narrative in-indigo">${zi('link')} On days with <strong>${best.label} logged</strong>, avg sleep score is <strong>${best.avg}</strong> vs <strong>${worst.avg}</strong> on ${worst.label} days. ${best.label === '3 meals' ? 'Full meals may help Ziva sleep better — well-fed babies settle easier.' : 'Interesting pattern — keep logging to see if it holds.'}</div>`;
      }
    }
  }

  // ── Growth vs Feeding correlation ──
  const wtEntries = growthData.filter(r => r.wt != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
  if (wtEntries.length >= 3) {
    // For each weight measurement gap, calculate meals logged per day in that period
    const periods = [];
    for (let i = 1; i < wtEntries.length; i++) {
      const startDate = new Date(wtEntries[i-1].date);
      const endDate = new Date(wtEntries[i].date);
      const days = Math.max(1, Math.round((endDate - startDate) / 86400000));
      if (days < 3 || days > 60) continue; // skip too-short or too-long gaps

      let mealsTotal = 0;
      const d = new Date(startDate);
      for (let j = 0; j < days; j++) {
        const ds = toDateStr(d);
        const entry = feedingData[ds];
        if (entry) mealsTotal += ['breakfast','lunch','dinner','snack'].filter(m => entry[m]).length;
        d.setDate(d.getDate() + 1);
      }
      const mealsPerDay = +(mealsTotal / days).toFixed(1);
      const gainGPerDay = Math.round(((wtEntries[i].wt - wtEntries[i-1].wt) * 1000) / days);
      periods.push({ mealsPerDay, gainGPerDay, days, from: wtEntries[i-1].date, to: wtEntries[i].date });
    }

    if (periods.length >= 2) {
      // Sort by mealsPerDay and compare top half vs bottom half
      const sorted = [...periods].sort((a,b) => b.mealsPerDay - a.mealsPerDay);
      const topHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
      const bottomHalf = sorted.slice(Math.ceil(sorted.length / 2));

      const avgGainTop = Math.round(topHalf.reduce((s,p) => s + p.gainGPerDay, 0) / topHalf.length);
      const avgGainBottom = Math.round(bottomHalf.reduce((s,p) => s + p.gainGPerDay, 0) / bottomHalf.length);
      const avgMealsTop = +(topHalf.reduce((s,p) => s + p.mealsPerDay, 0) / topHalf.length).toFixed(1);
      const avgMealsBottom = +(bottomHalf.reduce((s,p) => s + p.mealsPerDay, 0) / bottomHalf.length).toFixed(1);

      html += `<div class="insight-row">
        <div class="ir-icon">${zi('bowl')}${zi('chart')}</div>
        <div class="ir-body">
          <div class="ir-label">Growth vs meals</div>
          <div class="ir-value">${avgMealsTop} meals/d → ${avgGainTop}g/d · ${avgMealsBottom} meals/d → ${avgGainBottom}g/d</div>
        </div>
      </div>`;

      if (avgGainTop > avgGainBottom + 2) {
        html += `<div class="insight-narrative">${zi('chart')} Periods with <strong>more meals logged</strong> (${avgMealsTop}/day) correlate with <strong>higher weight gain</strong> (${avgGainTop}g/day vs ${avgGainBottom}g/day). Consistent feeding supports steady growth.</div>`;
      }
    }
  }

  if (html === '') {
    html = '<div class="t-sub fe-center-action" >Need more data across categories to find cross-data patterns. Keep logging!</div>';
  }

  el.innerHTML = html;
}

// ── Quick Log Feed: Autocomplete + Same-As ──
function updateQLFeedDropdown() {
  const input = document.getElementById('qlFeedInput');
  const dd = document.getElementById('qlFeedDropdown');
  if (!input || !dd) return;

  const raw = input.value;
  // Get the last token after the last comma (user is typing this part)
  const parts = raw.split(',');
  const query = parts[parts.length - 1].trim();

  if (query.length < 1) {
    dd.classList.remove('open');
    dd.innerHTML = '';
    return;
  }

  const q = query.toLowerCase();
  const isVeg = getDietPref() === 'veg';
  let html = '';
  let totalMatches = 0;

  Object.entries(FOOD_SUGGESTIONS).forEach(([cat, items]) => {
    if (isVeg && cat.includes('Non-Veg')) return;
    const filtered = items.filter(f => f.toLowerCase().includes(q));
    if (filtered.length === 0) return;
    html += `<div class="meal-dd-cat">${cat}</div>`;
    filtered.slice(0, 8).forEach(food => {
      totalMatches++;
      html += `<div class="meal-dd-item" onmousedown="pickQLFood('${food.replace(/'/g, "\\'")}')">${highlightMatch(food, q)}</div>`;
    });
  });

  if (totalMatches === 0 && query.length < 2) {
    html = '<div class="meal-dd-empty">Keep typing to search...</div>';
  } else if (totalMatches === 0) {
    html = `<div class="meal-dd-empty">No match — type freely</div>`;
  }

  dd.innerHTML = html;
  dd.classList.add('open');
}

function pickQLFood(food) {
  const input = document.getElementById('qlFeedInput');
  const dd = document.getElementById('qlFeedDropdown');
  const parts = input.value.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length > 0) {
    parts[parts.length - 1] = food;
  } else {
    parts.push(food);
  }
  input.value = parts.join(', ') + ', ';
  dd.classList.remove('open');
  input.focus();
  // Auto-add to Foods Introduced if not already tracked (base food matching)
  const lower = food.toLowerCase().trim();
  const base = _baseFoodName(lower);
  const alreadyIntroduced = foods.some(f => {
    const fb = _baseFoodName(f.name.toLowerCase().trim());
    return fb === base || fb.includes(base) || base.includes(fb);
  });
  if (!alreadyIntroduced && lower.length > 1) {
    foods.push({ name: food, reaction: 'ok', date: today() });
    save(KEYS.foods, foods);
  }
}

// ── Backfill mode ──
let _qlBackfillDate = null;

function openQLBackfill() {
  // Hide suggest card — predictions are for today, not backfill dates
  var sw = document.getElementById('qlSuggestWrap');
  if (sw) { sw.classList.add('ql-suggest-hidden'); sw.innerHTML = ''; }
  // Show a type selector within the bottom sheet, then date selector in the modal
  const sheet = document.getElementById('qlSheet');
  const opts = sheet.querySelector('.ql-options');
  if (!opts) return;
  opts.innerHTML = `
    <div style="font-size:var(--fs-sm);color:var(--light);text-align:center;margin-bottom:4px;">What do you want to backfill?</div>
    <div class="ql-option qo-feed" data-action="startBackfill" data-arg="feed">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-bowl"/></svg></span><span class="ql-option-label">Feed</span>
    </div>
    <div class="ql-option qo-sleep" data-action="startBackfill" data-arg="sleep">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-moon"/></svg></span><span class="ql-option-label">Sleep</span>
    </div>
    <div class="ql-option qo-nap" data-action="startBackfill" data-arg="nap">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-sleep"/></svg></span><span class="ql-option-label">Nap</span>
    </div>
    <div class="ql-option qo-poop" data-action="startBackfill" data-arg="poop">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-diaper"/></svg></span><span class="ql-option-label">Poop</span>
    </div>
    <div style="text-align:center;margin-top:4px;">
      <span style="font-size:var(--fs-xs);color:var(--tc-sky);cursor:pointer;" data-action="resetQLSheet">← Back</span>
    </div>`;
}

function resetQLSheet() {
  var sw = document.getElementById('qlSuggestWrap');
  if (sw) { sw.classList.add('ql-suggest-hidden'); sw.innerHTML = ''; }
  const opts = document.getElementById('qlSheet')?.querySelector('.ql-options');
  if (!opts) return;
  opts.innerHTML = `
    <div class="ql-option qo-feed" data-quick-modal="feed">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-bowl"/></svg></span><span class="ql-option-label">Feed</span>
    </div>
    <div class="ql-option qo-sleep" data-quick-modal="sleep">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-moon"/></svg></span><span class="ql-option-label">Sleep</span>
    </div>
    <div class="ql-option qo-nap" data-quick-modal="nap">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-sleep"/></svg></span><span class="ql-option-label">Nap</span>
    </div>
    <div class="ql-option qo-poop" data-quick-modal="poop">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-diaper"/></svg></span><span class="ql-option-label">Poop</span>
    </div>
    <div class="ql-option qo-feed" data-action="openQLBackfill">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-note"/></svg></span><span class="ql-option-label">Backfill</span>
    </div>
    <div class="ql-option qo-activity" data-quick-modal="activity">
      <span class="ql-option-icon"><svg class="zi"><use href="#zi-run"/></svg></span><span class="ql-option-label">Activity</span>
    </div>`;
  // Re-bind click listeners on newly created elements
  opts.querySelectorAll('[data-quick-modal]').forEach(function(btn) {
    btn.addEventListener('click', function() { _qlSuggestUsed = false; openQuickModal(btn.dataset.quickModal); });
  });
}

function startBackfill(type) {
  _qlBackfillDate = '';
  openQuickModal(type);
  // Show backfill date selector in the modal
  const bfWrap = document.getElementById('qlBackfillWrap');
  if (bfWrap) {
    bfWrap.style.display = '';
    const pills = document.getElementById('qlBackfillPills');
    if (pills) {
      let html = '';
      for (let i = 1; i <= 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        const label = i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', weekday:'short' });
        html += `<div class="ql-bf-pill" data-date="${ds}" onclick="selectQLBackfillDate('${ds}', this)">${label}</div>`;
      }
      pills.innerHTML = html;
    }
  }
  // For non-feed modals, inject the backfill date selector if not present
  if (type !== 'feed') {
    const modal = document.getElementById('qlModal-' + type);
    if (modal && !modal.querySelector('#qlBackfillWrap')) {
      // Clone the backfill wrap into the non-feed modal
      const form = modal.querySelector('.ql-form');
      if (form) {
        const bfDiv = document.createElement('div');
        bfDiv.id = 'qlBf-' + type;
        bfDiv.innerHTML = `<label class="micro-label">Date</label><div class="ql-bf-row" id="qlBfPills-${type}"></div>`;
        form.insertBefore(bfDiv, form.firstChild);
        const pillsEl = document.getElementById('qlBfPills-' + type);
        if (pillsEl) {
          let html = '';
          for (let i = 1; i <= 7; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = toDateStr(d);
            const label = i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', weekday:'short' });
            html += `<div class="ql-bf-pill" data-date="${ds}" onclick="selectQLBackfillDate('${ds}', this)">${label}</div>`;
          }
          pillsEl.innerHTML = html;
        }
      }
    }
  }
}

function selectQLBackfillDate(ds, el) {
  _qlBackfillDate = ds;
  document.querySelectorAll('.ql-bf-pill').forEach(p => p.classList.toggle('active', p.dataset.date === ds));
}

// ── Frequent meal pills ──
function getTopMeals(n) {
  const counts = {};
  Object.values(feedingData).forEach(day => {
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      if (!day[meal]) return;
      // Split by comma and count each item — normalize for dedup
      day[meal].split(',').forEach(item => {
        const trimmed = item.trim();
        if (trimmed.length <= 2) return;
        const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
        if (!counts[normalized]) counts[normalized] = { display: trimmed, count: 0 };
        counts[normalized].count++;
      });
    });
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(m => ({ name: m.display.charAt(0).toUpperCase() + m.display.slice(1), count: m.count }));
}

function renderQLFreqPills() {
  const wrap = document.getElementById('qlFreqWrap');
  const el = document.getElementById('qlFreqPills');
  if (!wrap || !el) return;

  const top = getTopMeals(5);
  if (top.length === 0) { wrap.style.display = 'none'; return; }

  wrap.style.display = '';
  el.innerHTML = top.map(m =>
    `<div class="ql-freq-pill" onclick="document.getElementById('qlFeedInput').value='${escHtml(m.name).replace(/'/g, "\\'")}';document.getElementById('qlFeedInput').focus();" title="${m.count}× logged">${escHtml(m.name)}</div>`
  ).join('');
}

// ── Meal progress on Home ──

// ── MEAL DIVERSITY INDEX ──
// Shannon entropy-based diversity per meal slot + today aggregate

function computeMealDiversity(dateStr) {
  dateStr = dateStr || today();
  const entry = feedingData[dateStr];
  const meals = ['breakfast','lunch','dinner','snack'];
  const mealLabels = { breakfast:'B', lunch:'L', dinner:'D', snack:'S' };
  const results = {};
  let totalFoods = 0;
  const allGroups = new Set();
  const allFoodsList = [];

  meals.forEach(m => {
    if (!entry || !isRealMeal(entry[m])) {
      results[m] = { foods: 0, groups: 0, entropy: 0, score: 0, label: mealLabels[m], items: [] };
      return;
    }
    const foodItems = entry[m].split(/[,+]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
    const groupSet = new Set();
    foodItems.forEach(f => {
      const cls = classifyFoodToGroup(f);
      if (cls) { groupSet.add(cls.group); allGroups.add(cls.group); }
      allFoodsList.push(f);
    });

    // Shannon entropy: -Σ(p * log2(p)) across food groups
    const groupCounts = {};
    foodItems.forEach(f => {
      const cls = classifyFoodToGroup(f);
      const g = cls ? cls.group : '_other';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const total = foodItems.length;
    let entropy = 0;
    if (total > 1) {
      Object.values(groupCounts).forEach(c => {
        const p = c / total;
        if (p > 0) entropy -= p * Math.log2(p);
      });
    }

    // Normalize to 0-100 score: max entropy for N groups = log2(N)
    const maxEntropy = total > 1 ? Math.log2(Math.min(Object.keys(groupCounts).length, 5)) : 1;
    const score = total === 0 ? 0 : total === 1 ? 20 : Math.round(Math.min((entropy / Math.max(maxEntropy, 0.01)) * 60 + (groupSet.size * 10), 100));

    results[m] = { foods: total, groups: groupSet.size, entropy: +entropy.toFixed(2), score, label: mealLabels[m], items: foodItems };
    totalFoods += total;
  });

  // Day-level aggregate
  const dayGroupCounts = {};
  allFoodsList.forEach(f => {
    const cls = classifyFoodToGroup(f);
    const g = cls ? cls.group : '_other';
    dayGroupCounts[g] = (dayGroupCounts[g] || 0) + 1;
  });
  let dayEntropy = 0;
  if (allFoodsList.length > 1) {
    Object.values(dayGroupCounts).forEach(c => {
      const p = c / allFoodsList.length;
      if (p > 0) dayEntropy -= p * Math.log2(p);
    });
  }
  const maxDayEntropy = allFoodsList.length > 1 ? Math.log2(Math.min(Object.keys(dayGroupCounts).length, 7)) : 1;
  const dayScore = allFoodsList.length === 0 ? 0 : allFoodsList.length === 1 ? 15 : Math.round(Math.min((dayEntropy / Math.max(maxDayEntropy, 0.01)) * 55 + (allGroups.size * 8), 100));

  // Rut detection: is any single food >40% of all items today?
  const foodFreq = {};
  allFoodsList.forEach(f => { foodFreq[f] = (foodFreq[f] || 0) + 1; });
  let rutFood = null;
  Object.entries(foodFreq).forEach(([f, c]) => {
    if (allFoodsList.length >= 3 && (c / allFoodsList.length) > 0.4) rutFood = f;
  });

  return { meals: results, dayScore, dayEntropy: +dayEntropy.toFixed(2), totalFoods, totalGroups: allGroups.size, rutFood };
}

function getMdiColor(score) {
  return score >= 60 ? 'mdi-great' : score >= 35 ? 'mdi-ok' : 'mdi-low';
}

function getMdiTextColor(score) {
  return score >= 60 ? 'var(--tc-sage)' : score >= 35 ? 'var(--tc-amber)' : 'var(--tc-rose)';
}

// ═══════════════════════════════════════════════════════
