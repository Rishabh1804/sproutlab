var QA_INTENTS = [
  // ═══ SLEEP ═══
  {
    id: 'sleep_quality',
    triggers: ['sleep', 'sleeping', 'nap', 'napping', 'night', 'bedtime', 'wake', 'waking', 'wakeup'],
    boosts: ['improve', 'better', 'why', 'how', 'bad', 'poor', 'worse', 'problem'],
    handler: 'answerSleepQuality'
  },
  {
    id: 'sleep_early',
    triggers: ['sleep early', 'earlier bedtime', 'bedtime earlier', 'sleep on time', 'bedtime routine'],
    handler: 'answerSleepEarly'
  },
  {
    id: 'sleep_wakeups',
    triggers: ['wake up', 'waking up', 'night waking', 'wakeups', 'wakes at night', 'disturbed sleep'],
    handler: 'answerSleepWakeups'
  },
  {
    id: 'sleep_naps',
    triggers: ['nap', 'naps', 'napping', 'nap schedule', 'nap transition', 'daytime sleep'],
    exclude: ['night'],
    handler: 'answerNaps'
  },

  // ═══ WEIGHT & GROWTH ═══
  {
    id: 'weight_gain',
    triggers: ['weight', 'gain weight', 'increase weight', 'not gaining', 'underweight', 'thin', 'weight gain'],
    handler: 'answerWeightGain'
  },
  {
    id: 'weight_loss',
    triggers: ['overweight', 'too heavy', 'reduce weight', 'losing weight', 'weight loss'],
    handler: 'answerWeightConcern'
  },
  {
    id: 'growth',
    triggers: ['growth', 'growing', 'height', 'tall', 'short', 'percentile', 'growth chart'],
    handler: 'answerGrowth'
  },

  // ═══ FOOD & NUTRITION ═══
  {
    id: 'food_general',
    triggers: ['feed', 'food', 'eat', 'eating', 'meal', 'what to feed', 'what should i feed', 'diet'],
    handler: 'answerFoodGeneral'
  },
  {
    id: 'food_nutrient',
    triggers: ['iron', 'calcium', 'protein', 'vitamin', 'nutrient', 'nutrition', 'deficiency', 'missing',
               'iron rich', 'calcium rich', 'protein rich', 'zinc rich', 'fibre rich', 'vitamin rich', 'nutrient gap'],
    handler: 'answerNutrientGap'
  },
  {
    id: 'food_variety',
    triggers: ['variety', 'same food', 'repetitive', 'bored', 'new food', 'introduce', 'picky', 'refuses'],
    handler: 'answerFoodVariety'
  },
  {
    id: 'food_safe',
    triggers: ['safe', 'allergy', 'allergic', 'reaction', 'can i give', 'can she eat', 'intolerant'],
    handler: 'answerFoodSafety'
  },
  {
    id: 'food_texture',
    triggers: ['texture', 'puree', 'mash', 'solid', 'finger food', 'lumps', 'chew', 'chewing', 'gagging'],
    handler: 'answerTexture'
  },

  // ═══ POOP ═══
  {
    id: 'poop_general',
    triggers: ['poop', 'stool', 'bowel', 'constipat', 'diarrh', 'loose', 'hard stool'],
    handler: 'answerPoopGeneral'
  },
  {
    id: 'poop_food',
    triggers: ['poop', 'stool', 'food', 'cause', 'trigger', 'after eating', 'food poop'],
    boosts: ['which food', 'what food', 'cause', 'trigger', 'why'],
    handler: 'answerPoopFood'
  },
  {
    id: 'poop_color',
    triggers: ['poop color', 'stool color', 'green poop', 'black poop', 'red poop', 'white poop', 'blood', 'mucus'],
    handler: 'answerPoopColor'
  },

  // ═══ ACTIVITY & MILESTONES ═══
  {
    id: 'activity_general',
    triggers: ['active', 'activity', 'play', 'exercise', 'tummy time', 'physical', 'motor', 'crawl', 'walk', 'stand'],
    handler: 'answerActivityGeneral'
  },
  {
    id: 'activity_sleep',
    triggers: ['activity sleep', 'exercise sleep', 'play sleep', 'active sleep', 'tummy time sleep'],
    handler: 'answerActivitySleep'
  },
  {
    id: 'milestone_general',
    triggers: ['milestone', 'development', 'behind', 'delayed', 'advanced', 'ahead', 'on track'],
    handler: 'answerMilestoneGeneral'
  },
  {
    id: 'milestone_specific',
    triggers: ['crawl', 'walk', 'talk', 'speak', 'sit', 'stand', 'roll', 'babbl', 'word', 'teeth', 'teething'],
    exclude: ['food', 'feed', 'poop'],
    handler: 'answerMilestoneSpecific'
  },

  // ═══ MEDICAL ═══
  {
    id: 'vacc_reaction',
    triggers: ['vaccination reaction', 'vaccine reaction', 'after vaccination', 'after vaccine', 'after shot', 'side effect', 'vacc reaction'],
    handler: 'answerVaccReaction'
  },
  {
    id: 'vaccine',
    triggers: ['vaccine', 'vaccination', 'immuniz', 'shot', 'injection', 'next vaccine'],
    handler: 'answerVaccine'
  },
  {
    id: 'supplement',
    triggers: ['vitamin d', 'vit d', 'd3', 'supplement', 'drops'],
    handler: 'answerSupplement'
  },
  {
    id: 'illness',
    triggers: ['sick', 'ill', 'fever', 'cold', 'cough', 'vomit', 'unwell', 'doctor'],
    handler: 'answerIllness'
  },

  // ═══ OVERALL ═══
  {
    id: 'overall',
    triggers: ['overall', 'how is she', 'how is ziva', 'summary', 'doing', 'okay', 'score', 'report'],
    handler: 'answerOverall'
  },
  {
    id: 'tomorrow',
    triggers: ['tomorrow', 'plan', 'prepare', 'what to do', 'next', 'what should i do'],
    handler: 'answerTomorrow'
  },

  // ═══ STATUS (BN-6) ═══
  {
    id: 'age',
    triggers: ['age', 'old', 'months old', 'how old', 'born', 'birthday'],
    handler: 'answerAge'
  },
  {
    id: 'streak',
    triggers: ['streak', 'consistent', 'consistency', 'logging streak'],
    handler: 'answerStreak'
  },
  {
    id: 'prediction_accuracy',
    triggers: ['prediction accuracy', 'how accurate', 'ql accuracy', 'quick log accuracy', 'prediction'],
    handler: 'answerPredictionAccuracy'
  },
  {
    id: 'favorite_foods',
    triggers: ['favorite food', 'favourite food', 'favorites', 'favourites', 'starred food', 'loved food'],
    handler: 'answerFavoriteFoods'
  },

  // ═══ CARETICKETS ═══
  {
    id: 'ct_create',
    triggers: ['track', 'tracking', 'monitor', 'monitor this', 'start watching', 'raise concern', 'fell', 'fall', 'bump', 'hit head'],
    exclude: ['asleep', 'fall asleep', 'fell asleep', 'sleep track', 'behind', 'apart'],
    handler: 'ctCreate'
  }
];

// ═══════════════════════════════════════════════════════════════
// UNIFIED INTELLIGENCE BAR (UIB) — Session 1
// Multi-mode router: ingredient, symptom, food_safety, QA
// ═══════════════════════════════════════════════════════════════

// ── FOOD NAME RECOGNITION ──

var _iqIntroCache = null;
var _iqIntroCacheAt = 0;

function _iqGetIntroducedBases() {
  var now = Date.now();
  if (_iqIntroCache && (now - _iqIntroCacheAt) < 30000) return _iqIntroCache;
  _iqIntroCache = (foods || []).map(function(f) { return _baseFoodName(f.name).toLowerCase(); });
  _iqIntroCacheAt = now;
  return _iqIntroCache;
}

function _isFoodName(token) {
  var t = token.toLowerCase().trim();
  if (t.length < 2) return false;
  // Exclude common non-food words that might match
  var excludeWords = ['how','is','the','she','her','and','for','not','can','has','was','are','its','too','but','all','had','what','when','does','this','that','with','from','will','just','more','only','very','been','have','also','most','give','baby','safe','help'];
  if (excludeWords.indexOf(t) !== -1) return false;
  // Check NUTRITION keys
  if (NUTRITION[t]) return true;
  // Check normalized alias
  var base = _baseFoodName(t);
  if (NUTRITION[base]) return true;
  // Check introduced foods
  var introSet = _iqGetIntroducedBases();
  if (introSet.indexOf(base) !== -1) return true;
  return false;
}

function _isLikelyFoodList(tokens) {
  var foodCount = 0;
  tokens.forEach(function(t) { if (_isFoodName(t)) foodCount++; });
  return foodCount >= 2;
}

// ── MULTI-MODE INPUT CLASSIFIER ──

function qaClassifyInput(text) {
  if (!text || typeof text !== 'string') return { mode: 'qa', raw: text || '' };
  var lower = text.toLowerCase().replace(/[?!.,]/g, '').trim();
  var tokens = lower.split(/[\s,+&]+/).filter(function(t) { return t.length > 0; });

  // 0. OUTING — check first (specific phrases)
  if (/going out|outing|park visit|picnic|going to (park|mall|market)/.test(lower) ||
      (/\btravel\b/.test(lower) && !/sick|sickness|nausea|vomit/.test(lower)) ||
      (/\boutdoor\b/.test(lower) && !/safe|play safe/.test(lower))) {
    return { mode: 'outing', raw: text };
  }

  // 1. FOOD SAFETY — "can I give", "is X safe", "safe for baby"
  if (/^can (i|we) give|^is .+ safe|^safe to give|^can she (eat|have)|^can baby (eat|have)/.test(lower)) {
    return { mode: 'food_safety', raw: text };
  }

  // 2. SYMPTOM — check before ingredient (symptom keywords are distinct)
  var symptomScore = 0;
  SYMPTOM_DB.forEach(function(entry) {
    entry.keywords.forEach(function(kw) {
      if (lower.indexOf(kw.toLowerCase()) !== -1) symptomScore++;
    });
  });
  if (symptomScore >= 1 && !_isLikelyFoodList(tokens)) {
    return { mode: 'symptom', raw: text };
  }

  // 3. INGREDIENT — 2+ recognized food names
  var foodMatches = tokens.filter(function(t) { return _isFoodName(t); });
  if (foodMatches.length >= 2) {
    return { mode: 'ingredient', foods: foodMatches, raw: text };
  }

  // 4. Single food name without safety prefix → ingredient mode
  //    But not if remaining tokens look like a question (e.g. "how is ragi")
  if (foodMatches.length === 1 && tokens.length <= 3) {
    var qaWords = ['how','is','what','why','when','does','should','can','will','do','are','was','her','she','about','much','many'];
    var hasQAWord = tokens.some(function(t) { return qaWords.indexOf(t) !== -1; });
    if (!hasQAWord) {
      return { mode: 'ingredient', foods: foodMatches, raw: text };
    }
  }

  // 5. TEMPORAL — check for time references
  // Guard: comparison queries ("this week vs last week") must not be caught here
  if (/\bvs\b|\bversus\b|\bcompare|\bcompared\b/.test(lower)) {
    return { mode: 'pattern', subtype: 'compare', raw: text };
  }
  var timeRef = resolveTimeQuery(lower);
  if (timeRef) {
    var isFuture = timeRef.start > today();
    var domain = _qaDetectDomain(lower);
    if (isFuture && !domain) {
      return { mode: 'planning', subtype: 'tomorrow', timeRange: timeRef, raw: text };
    }
    if (domain) {
      return { mode: 'temporal', domain: domain, timeRange: timeRef, raw: text };
    }
    return { mode: 'temporal', domain: null, timeRange: timeRef, raw: text };
  }

  // 6. LOOKBACK — "last poop", "last nap", "when did she last sleep"
  if (/\blast\s+(poop|diaper|nap|sleep|vaccine|vacc|shot|sick|fever|ill)\b/.test(lower) ||
      /when did she last|last time she/.test(lower)) {
    return { mode: 'lookback', raw: text };
  }

  // 6b. FOOD LOOKBACK — "when did she last eat ragi"
  if (/when.*last.*(?:eat|ate|had|gave)\b/.test(lower) ||
      /last\s+time.*(?:eat|ate|had)\b/.test(lower) ||
      /\blast\s+(?:eat|ate|had)\b/.test(lower)) {
    var stripped = lower.replace(/when|did|she|last|eat|ate|had|gave|time|the|some|any/g, '').trim();
    var foodTokens = stripped.split(/\s+/).filter(function(t) { return t.length > 1; });
    return { mode: 'lookback', subtype: 'food', foodQuery: foodTokens.join(' '), raw: text };
  }

  // 7. PATTERN/TREND
  if (/vaccin.*schedule|schedule.*vaccin/.test(lower)) { /* fall through to step 9 */ }
  else if (/routine|schedule|pattern|favorite|likes|dislikes|rejects|improving|progress|concern|worr|getting better/.test(lower)) {
    return { mode: 'pattern', raw: text };
  }

  // 8. PLANNING
  if (/\bdoctor\b.*\b(visit|prep|appointment)\b|\bpediatrician\b/.test(lower)) {
    return { mode: 'planning', subtype: 'doctor', raw: text };
  }
  if (/\bshare\b|\bsend.*summary\b/.test(lower)) {
    return { mode: 'planning', subtype: 'share', raw: text };
  }
  if (/\btomorrow\b.*\bplan\b|\bwhat.*tomorrow\b/.test(lower)) {
    return { mode: 'planning', subtype: 'tomorrow', raw: text };
  }

  // 8b. INGREDIENT PICKER — "what can I make", "ingredient picker", "food combo"
  if (/\bpicker\b|\bingredient\b|\bwhat can (i|we) make\b|\bfood combo\b|\bmeal idea\b|\bcombination\b|\brecipe idea\b|\bcombo\b/.test(lower)) {
    return { mode: 'picker', raw: text };
  }

  // 9. Default → QA (existing intent matching)
  return { mode: 'qa', raw: text };
}

// ── MODE INDICATOR UI ──

function _uibShowModeIndicator(mode) {
  var el = document.getElementById('qaModeIndicator');
  if (!el) return;
  var labels = {
    ingredient: { icon: 'bowl', color: 'peach', text: 'Ingredient mode \u2014 finding best combos\u2026' },
    symptom: { icon: 'medical', color: 'rose', text: 'Symptom check \u2014 matching symptoms\u2026' },
    food_safety: { icon: 'shield', color: 'peach', text: 'Food safety check\u2026' },
    outing: { icon: 'sun', color: 'sage', text: 'Outing planner \u2014 adjusting suggestions\u2026' },
    temporal: { icon: 'clock', color: 'indigo', text: 'Looking back\u2026' },
    lookback: { icon: 'scope', color: 'amber', text: 'Searching history\u2026' },
    pattern: { icon: 'chart', color: 'sage', text: 'Analyzing patterns\u2026' },
    planning: { icon: 'bulb', color: 'lav', text: 'Preparing\u2026' }
  };
  var cfg = labels[mode];
  if (!cfg) { el.classList.remove('active'); el.innerHTML = ''; return; }
  el.innerHTML = '<div class="icon icon-' + cfg.color + '">' + zi(cfg.icon) + '</div><span>' + cfg.text + '</span>';
  el.classList.add('active');
}

function _uibClearModeIndicator() {
  var el = document.getElementById('qaModeIndicator');
  if (el) { el.classList.remove('active'); el.innerHTML = ''; }
}

// ── INGREDIENT PICKER UI ──

function _iqRenderPicker() {
  var el = document.getElementById('iqPicker');
  if (!el) return;

  var introduced = (foods || []).map(function(f) { return { name: f.name, base: _baseFoodName(f.name) }; });
  var introSet = new Set(introduced.map(function(f) { return f.base; }));

  // Categorize introduced foods
  var groups = {
    'Grains': ['ragi','rice','oats','dalia','suji','poha','bajra','jowar','sabudana','idli','dosa','khichdi','wheat','barley','amaranth'],
    'Lentils': ['moong dal','masoor dal','toor dal','chana dal','urad dal','rajma'],
    'Vegetables': ['carrot','beetroot','beans','bottle gourd','lauki','spinach','sweet potato','pumpkin','broccoli','zucchini','potato','drumstick','moringa','cucumber','corn'],
    'Fruits': ['banana','apple','pear','avocado','blueberry','mango','papaya','orange','watermelon','pomegranate','date (fruit)','chiku','strawberry','kiwi','litchi','guava','plum','muskmelon','blackberry'],
    'Fats & Nuts': ['ghee','almonds','walnut','flaxseed','sesame','coconut','cashew','peanut','pumpkin seeds','coconut oil'],
    'Dairy': ['curd','paneer','cheese','butter']
  };

  var html = '<div class="iq-picker-title"><div class="icon icon-peach">' + zi('bowl') + '</div> Pick ingredients you have</div>';

  // Search input for new foods
  html += '<div class="iq-search-wrap"><input type="text" class="iq-search-input" id="iqFoodSearch" placeholder="Search for a new ingredient to try\u2026" autocomplete="off"></div>';
  html += '<div id="iqNewResults"></div>';

  var IQ_GROUP_COLOR = {
    'Grains': 'peach',
    'Lentils': 'amber',
    'Vegetables': 'sage',
    'Fruits': 'rose',
    'Fats & Nuts': 'lav',
    'Dairy': 'sky'
  };

  var hasAny = false;
  Object.keys(groups).forEach(function(groupName) {
    var available = groups[groupName].filter(function(f) { return introSet.has(f); });
    if (available.length === 0) return;
    hasAny = true;
    var gc = IQ_GROUP_COLOR[groupName] || 'indigo';
    html += '<div class="iq-group">';
    html += '<div class="iq-group-label iq-label-' + gc + '">' + escHtml(groupName) + '</div>';
    html += '<div class="iq-group-chips">';
    available.forEach(function(f) {
      var display = f.charAt(0).toUpperCase() + f.slice(1);
      html += '<button class="iq-food-chip iq-chip-' + gc + '" data-food="' + escHtml(f) + '">' + escHtml(display) + '</button>';
    });
    html += '</div></div>';
  });

  html += '<div class="iq-submit-row"><button class="iq-submit-btn" id="iqSubmitBtn" disabled>Show best combos</button></div>';

  el.innerHTML = html;
  el.classList.add('active');

  // Chip toggle handlers (event delegation on container)
  function _iqUpdateSubmitState() {
    var selected = el.querySelectorAll('.iq-food-chip.selected, .iq-chip-new.selected');
    var btn = document.getElementById('iqSubmitBtn');
    if (btn) btn.disabled = selected.length < 1;
  }

  el.querySelectorAll('.iq-food-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      this.classList.toggle('selected');
      _iqUpdateSubmitState();
    });
  });

  // Search input handler — search NUTRITION database for new foods
  var searchInput = document.getElementById('iqFoodSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      var query = this.value.trim().toLowerCase();
      var resultsEl = document.getElementById('iqNewResults');
      if (!resultsEl) return;

      if (query.length < 2) {
        resultsEl.innerHTML = '';
        return;
      }

      // Search NUTRITION keys for matches not in introSet
      var matches = [];
      Object.keys(NUTRITION).forEach(function(food) {
        if (introSet.has(food)) return; // Already introduced
        if (food.indexOf(query) !== -1) {
          matches.push(food);
        }
      });

      if (matches.length === 0) {
        resultsEl.innerHTML = '<div class="iq-new-section"><div class="iq-new-label" >' +
          '<div class="icon icon-indigo">' + zi('info') + '</div> No new matches for "' + escHtml(query) + '"</div></div>';
        return;
      }

      var rHtml = '<div class="iq-new-section">';
      rHtml += '<div class="iq-new-label"><div class="icon icon-indigo">' + zi('sparkle') + '</div> New to try</div>';
      rHtml += '<div class="iq-group-chips">';
      matches.slice(0, 12).forEach(function(food) {
        var display = food.charAt(0).toUpperCase() + food.slice(1);
        var nutrients = (NUTRITION[food].nutrients || []).slice(0, 3).join(', ');
        rHtml += '<button class="iq-chip-new" data-food="' + escHtml(food) + '" title="' + escHtml(nutrients) + '">' + escHtml(display) + '</button>';
      });
      rHtml += '</div></div>';
      resultsEl.innerHTML = rHtml;

      // Attach click handlers to new chips
      resultsEl.querySelectorAll('.iq-chip-new').forEach(function(chip) {
        chip.addEventListener('click', function() {
          this.classList.toggle('selected');
          _iqUpdateSubmitState();
        });
      });
    });
  }

  // Submit handler
  var submitBtn = document.getElementById('iqSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var selected = [];
      el.querySelectorAll('.iq-food-chip.selected, .iq-chip-new.selected').forEach(function(chip) {
        selected.push(chip.getAttribute('data-food'));
      });
      if (selected.length === 0) return;
      el.classList.remove('active');
      el.innerHTML = '';
      var classified = { mode: 'ingredient', foods: selected, raw: selected.join(', ') };
      var answer = qaHandleIngredient(classified);
      var answerEl = document.getElementById('qaAnswerContainer');
      if (answer && answerEl) qaRenderAnswer(answerEl, answer);
    });
  }
}

function _iqHidePicker() {
  var el = document.getElementById('iqPicker');
  if (el) { el.classList.remove('active'); el.innerHTML = ''; }
}

// ── MEAL HISTORY MINING ──

function _iqMineMealCombos(selectedFoods) {
  var selectedBases = selectedFoods.map(function(f) { return _baseFoodName(f); });
  var selectedSet = new Set(selectedBases);
  var results = [];

  // Scan feedingData for meals containing any selected food
  var dates = Object.keys(feedingData || {}).sort();
  dates.forEach(function(date) {
    var day = feedingData[date];
    ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
      var mealStr = day[meal];
      if (!mealStr || typeof mealStr !== 'string' || mealStr.trim().length === 0) return;

      // Parse foods from meal string
      var mealFoods = mealStr.split(/[,+]/).map(function(f) { return f.trim(); }).filter(function(f) { return f.length > 1; });
      var mealBases = mealFoods.map(function(f) { return _baseFoodName(f); });

      // Check if any selected food appears in this meal
      var matchCount = 0;
      mealBases.forEach(function(b) { if (selectedSet.has(b)) matchCount++; });
      if (matchCount === 0) return;

      // Get intake data if available
      var intakeKey = meal + '_intake';
      var intake = day[intakeKey] !== undefined && day[intakeKey] !== null ? day[intakeKey] : null;

      // Create combo signature
      var comboKey = mealBases.slice().sort().join('|');

      // Find existing or create new
      var existing = results.find(function(r) { return r.key === comboKey; });
      if (existing) {
        existing.count++;
        existing.dates.push(date);
        if (intake !== null) existing.intakes.push(intake);
      } else {
        results.push({
          key: comboKey,
          foods: mealFoods,
          bases: mealBases,
          meal: meal,
          count: 1,
          dates: [date],
          intakes: intake !== null ? [intake] : [],
          matchCount: matchCount
        });
      }
    });
  });

  // Calculate average intake for each combo
  results.forEach(function(r) {
    if (r.intakes.length > 0) {
      r.avgIntake = r.intakes.reduce(function(a, b) { return a + b; }, 0) / r.intakes.length;
    } else {
      r.avgIntake = null;
    }
    r.lastDate = r.dates[r.dates.length - 1];
  });

  // Sort by match count (how many selected foods it uses) then frequency
  results.sort(function(a, b) {
    return b.matchCount - a.matchCount || b.count - a.count;
  });

  return results;
}

// ── COMBO-LEVEL SCORING ──

function _iqScoreCombo(combo, ctx) {
  var score = 0;
  var reasons = [];

  // A. Nutrient coverage (30%) — how many gaps does this combo fill?
  var gapsFilled = 0;
  var gapNames = [];
  if (ctx.gapSet && ctx.gapSet.size > 0) {
    combo.bases.forEach(function(base) {
      var nut = getNutrition(base);
      if (nut && nut.nutrients) {
        nut.nutrients.forEach(function(n) {
          if (ctx.gapSet.has(n.toLowerCase()) && gapNames.indexOf(n) === -1) {
            gapsFilled++;
            gapNames.push(n);
          }
        });
      }
    });
    if (gapsFilled > 0) {
      score += Math.min(gapsFilled * 10, 30);
      var gapDays = ctx.gapDaysMap && ctx.gapDaysMap[gapNames[0].toLowerCase()] ? ctx.gapDaysMap[gapNames[0].toLowerCase()] : 0;
      reasons.push('Covers ' + gapNames.slice(0, 2).join(' + ') + ' gap' + (gapDays > 0 ? ' (' + gapDays + ' days)' : ''));
    }
  }

  // B. Recency (15%) — when was this combo last served?
  if (combo.lastDate) {
    var daysSince = Math.round((new Date(today()) - new Date(combo.lastDate)) / 86400000);
    if (daysSince >= 5) { score += 15; }
    else if (daysSince >= 3) { score += 10; }
    else if (daysSince >= 1) { score += 5; }
    else { score -= 5; } // served today, penalize
  } else {
    score += 8; // no history, neutral
  }

  // C. Sleep correlation (10%, dinner meals only)
  if (combo.meal === 'dinner') {
    try {
      var bestSleepBase = null;
      var bestDelta = 0;
      combo.bases.forEach(function(base) {
        var corr = _tpGetFoodSleepCorrelation(base);
        if (!corr.insufficient && corr.delta > bestDelta) {
          bestDelta = corr.delta;
          bestSleepBase = base;
        }
      });
      if (bestDelta > 3) {
        score += 10;
        reasons.push('Sleep +' + bestDelta + ' on ' + bestSleepBase + ' nights');
      }
    } catch(e) {}
  }

  // D. Poop correlation (10%)
  try {
    var bestPoopDelta = 0;
    combo.bases.forEach(function(base) {
      var corr = _tpGetFoodPoopCorrelation(base);
      if (!corr.insufficient && corr.delta > bestPoopDelta) {
        bestPoopDelta = corr.delta;
      }
    });
    if (bestPoopDelta > 5) {
      score += 10;
      reasons.push('Poop score +' + bestPoopDelta + ' on these days');
    }
  } catch(e) {}

  // E. Acceptance rate (15%) — avg intake when this combo was served
  if (combo.avgIntake !== null) {
    if (combo.avgIntake >= 0.8) {
      score += 15;
      reasons.push('She finishes ' + Math.round(combo.avgIntake * 100) + '% \u2014 loves it');
    } else if (combo.avgIntake >= 0.5) {
      score += 8;
    } else if (combo.avgIntake < 0.3 && combo.intakes.length >= 3) {
      score -= 10; // she consistently rejects this
    }
  }

  // F. Synergy bonus (10%) — pairings within the combo
  var synergyFound = [];
  for (var i = 0; i < combo.bases.length; i++) {
    for (var j = i + 1; j < combo.bases.length; j++) {
      var syn = getSynergy(combo.bases[i], combo.bases[j]);
      if (syn && synergyFound.indexOf(syn.reason) === -1) {
        synergyFound.push(syn.reason);
        score += 5;
      }
    }
  }
  if (synergyFound.length > 0 && reasons.length < 3) {
    reasons.push(synergyFound[0].replace(/^.*boosts/, 'Boosts').replace(/^.*helps/, 'Helps'));
  }

  // G. Frequency bonus — proven combos rank higher
  if (combo.count >= 4) { score += 8; }
  else if (combo.count >= 2) { score += 4; }

  // G2. Favorites bonus — combos with favorite ingredients
  var hasFav = combo.bases.some(function(base) { return isFoodFavorite(base); });
  if (hasFav) { score += 5; }

  // H. Seasonal fit (part of scoring)
  var seasonalSum = 0;
  combo.bases.forEach(function(base) { seasonalSum += getSeasonalScore(base); });
  var avgSeasonal = combo.bases.length > 0 ? Math.round(seasonalSum / combo.bases.length) : 0;
  score += Math.round(avgSeasonal / 2); // max +5 or -7
  if (avgSeasonal >= 8 && reasons.length < 3) {
    reasons.push('All ingredients in season');
  }

  // Cap reasons at 3
  reasons = reasons.slice(0, 3);

  return { score: score, reasons: reasons };
}

// ── BUILD NEW COMBOS FROM SELECTED FOODS ──

function _iqBuildNewCombos(selectedFoods, ctx) {
  var selectedBases = selectedFoods.map(function(f) { return _baseFoodName(f); });
  var combos = [];

  // Categorize selected foods
  var grains = []; var dals = []; var vegs = []; var fruits = []; var fats = []; var dairy = [];
  var grainList = ['ragi','rice','oats','dalia','suji','poha','bajra','jowar','sabudana','idli','dosa','khichdi','wheat','barley','amaranth'];
  var dalList = ['moong dal','masoor dal','toor dal','chana dal','urad dal','rajma'];
  var vegList = ['carrot','beetroot','beans','bottle gourd','lauki','spinach','sweet potato','pumpkin','broccoli','zucchini','potato','drumstick','moringa','cucumber','corn'];
  var fatList = ['ghee','almonds','walnut','flaxseed','sesame','coconut','cashew','peanut','coconut oil'];
  var dairyList = ['curd','paneer','cheese','butter','yogurt','dahi'];

  selectedBases.forEach(function(b) {
    if (grainList.indexOf(b) !== -1) grains.push(b);
    else if (dalList.indexOf(b) !== -1) dals.push(b);
    else if (vegList.indexOf(b) !== -1) vegs.push(b);
    else if (fatList.indexOf(b) !== -1) fats.push(b);
    else if (dairyList.indexOf(b) !== -1) dairy.push(b);
    else {
      // Check NUTRITION tags to guess
      var nut = getNutrition(b);
      if (nut && nut.tags) {
        if (nut.tags.indexOf('healthy-fats') !== -1 || nut.tags.indexOf('omega-3') !== -1) fats.push(b);
        else if (nut.tags.indexOf('hydrating') !== -1 || nut.tags.indexOf('cooling') !== -1) vegs.push(b);
        else fruits.push(b);
      } else {
        fruits.push(b);
      }
    }
  });

  // Generate combos based on Indian meal patterns
  // Breakfast: grain + fruit, grain + nut
  grains.forEach(function(g) {
    fruits.forEach(function(fr) {
      combos.push({ foods: [g, fr], bases: [g, fr], meal: 'breakfast', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: 2, key: [g, fr].sort().join('|'), isNew: true });
    });
    fats.forEach(function(fat) {
      combos.push({ foods: [g, fat], bases: [g, fat], meal: 'breakfast', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: 2, key: [g, fat].sort().join('|'), isNew: true });
    });
  });

  // Lunch: dal + grain + veg + ghee
  dals.forEach(function(d) {
    var lunchGrains = grains.length > 0 ? grains : [];
    if (lunchGrains.length > 0) {
      lunchGrains.forEach(function(g) {
        if (vegs.length > 0) {
          vegs.forEach(function(v) {
            var parts = [d, g, v];
            if (fats.indexOf('ghee') !== -1) parts.push('ghee');
            combos.push({ foods: parts, bases: parts.map(function(p) { return _baseFoodName(p); }), meal: 'lunch', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: parts.length, key: parts.slice().sort().join('|'), isNew: true });
          });
        } else {
          var parts = [d, g];
          if (fats.indexOf('ghee') !== -1) parts.push('ghee');
          combos.push({ foods: parts, bases: parts.map(function(p) { return _baseFoodName(p); }), meal: 'lunch', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: parts.length, key: parts.slice().sort().join('|'), isNew: true });
        }
      });
    } else {
      // Dal + veg (no grain selected)
      vegs.forEach(function(v) {
        var parts = [d, v];
        if (fats.indexOf('ghee') !== -1) parts.push('ghee');
        combos.push({ foods: parts, bases: parts.map(function(p) { return _baseFoodName(p); }), meal: 'lunch', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: parts.length, key: parts.slice().sort().join('|'), isNew: true });
      });
    }
  });

  // Dinner: fruit combos, veg + fat
  fruits.forEach(function(fr) {
    fats.forEach(function(fat) {
      combos.push({ foods: [fr, fat], bases: [fr, fat], meal: 'dinner', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: 2, key: [fr, fat].sort().join('|'), isNew: true });
    });
    dairy.forEach(function(d) {
      combos.push({ foods: [fr, d], bases: [fr, d], meal: 'dinner', count: 0, dates: [], intakes: [], avgIntake: null, lastDate: null, matchCount: 2, key: [fr, d].sort().join('|'), isNew: true });
    });
  });

  // Dedup
  var seen = new Set();
  var unique = [];
  combos.forEach(function(c) {
    if (!seen.has(c.key)) { seen.add(c.key); unique.push(c); }
  });

  return unique;
}

// ── ENHANCED REASON TEXT ──

function _iqEnhanceReasons(reasons, combo) {
  return reasons.map(function(r) {
    // Enhance nutrient gap reasons
    if (r.indexOf('gap') !== -1 && r.indexOf('Covers') === -1) {
      return 'Covers the ' + r;
    }
    return r;
  });
}

// ── DETERMINE BEST MEAL FIT ──

function _iqMealFit(combo) {
  var fits = [];
  var hasIron = false;
  var isLight = false;
  var hasProtein = false;

  combo.bases.forEach(function(b) {
    var nut = getNutrition(b);
    if (!nut) return;
    if (nut.tags && nut.tags.indexOf('iron-rich') !== -1) hasIron = true;
    if (nut.tags && nut.tags.indexOf('protein-rich') !== -1) hasProtein = true;
    if (nut.tags && (nut.tags.indexOf('easy-digest') !== -1 || nut.tags.indexOf('hydrating') !== -1)) isLight = true;
  });

  if (hasIron) fits.push({ meal: 'breakfast', icon: 'sun', color: 'peach', reason: 'Iron-biased, energy start' });
  if (hasProtein) fits.push({ meal: 'lunch', icon: 'bowl', color: 'sage', reason: 'Protein-rich, main meal' });
  if (isLight) fits.push({ meal: 'dinner', icon: 'moon', color: 'lav', reason: 'Light, easy to digest' });

  // If combo was historically used for a specific meal
  if (combo.meal && combo.count > 0) {
    var existingMeal = fits.find(function(f) { return f.meal === combo.meal; });
    if (!existingMeal) {
      var mealIcons = { breakfast: 'sun', lunch: 'bowl', dinner: 'moon' };
      var mealColors = { breakfast: 'peach', lunch: 'sage', dinner: 'lav' };
      fits.unshift({ meal: combo.meal, icon: mealIcons[combo.meal] || 'bowl', color: mealColors[combo.meal] || 'sage', reason: 'Served as ' + combo.meal + ' ' + combo.count + ' times' });
    }
  }

  return fits.slice(0, 2);
}

// ── DETECT NUTRIENT CONFLICTS WITHIN A COMBO ──

function _iqGetWarnings(bases) {
  var warnings = [];
  var tags = [];
  var nutrients = [];
  bases.forEach(function(b) {
    var nut = getNutrition(b);
    if (nut) {
      (nut.tags || []).forEach(function(t) { if (tags.indexOf(t) === -1) tags.push(t); });
      (nut.nutrients || []).forEach(function(n) { if (nutrients.indexOf(n.toLowerCase()) === -1) nutrients.push(n.toLowerCase()); });
    }
  });

  // Iron + Calcium conflict
  var hasIron = tags.indexOf('iron-rich') !== -1;
  var hasCalcium = nutrients.indexOf('calcium') !== -1 && tags.indexOf('bone-health') !== -1;
  if (hasIron && hasCalcium && bases.length > 1) {
    warnings.push('Iron + calcium together may reduce iron absorption \u2014 consider spacing 2 hours apart');
  }

  return warnings;
}

// ── INGREDIENT MODE ANSWER HANDLER ──

function qaHandleIngredient(classified) {
  var selectedFoods = (classified.foods || []).map(function(f) { return _baseFoodName(f); });
  if (selectedFoods.length === 0) return null;

  // Build scoring context
  var ctx = { gapSet: new Set(), gapDaysMap: {}, meal: null };
  try {
    var hm = computeNutrientHeatmap(7);
    if (hm && hm.gaps) {
      hm.gaps.forEach(function(g) {
        ctx.gapSet.add(g.nutrient.toLowerCase());
        ctx.gapDaysMap[g.nutrient.toLowerCase()] = g.gapDays || 0;
      });
    }
  } catch(e) {}

  // 1. Mine historical combos
  var historicalCombos = _iqMineMealCombos(selectedFoods);

  // 2. Score historical combos
  historicalCombos.forEach(function(combo) {
    var scored = _iqScoreCombo(combo, ctx);
    combo.totalScore = scored.score;
    combo.enhancedReasons = _iqEnhanceReasons(scored.reasons, combo);
  });

  // Sort by score
  historicalCombos.sort(function(a, b) { return b.totalScore - a.totalScore; });

  // 3. Build new combos
  var newCombos = _iqBuildNewCombos(selectedFoods, ctx);
  newCombos.forEach(function(combo) {
    var scored = _iqScoreCombo(combo, ctx);
    combo.totalScore = scored.score;
    combo.enhancedReasons = _iqEnhanceReasons(scored.reasons, combo);
  });
  newCombos.sort(function(a, b) { return b.totalScore - a.totalScore; });

  // Remove new combos that duplicate historical ones
  var histKeys = new Set(historicalCombos.map(function(c) { return c.key; }));
  newCombos = newCombos.filter(function(c) { return !histKeys.has(c.key); });

  // Build answer card sections
  var sections = [];
  var displayFoods = selectedFoods.map(function(f) { return f.charAt(0).toUpperCase() + f.slice(1); }).join(', ');

  // Historical combos section
  var histItems = [];
  var topHistory = historicalCombos.slice(0, 3);
  topHistory.forEach(function(combo, idx) {
    var comboDisplay = combo.foods.map(function(f) { return f.trim(); }).filter(function(f) { return f.length > 0; }).join(' + ');
    var meta = [];
    if (combo.count > 0) meta.push('Served ' + combo.count + '\u00d7');
    if (combo.avgIntake !== null) meta.push('intake ' + Math.round(combo.avgIntake * 100) + '%');
    var text = (idx === 0 ? zi('star') + ' ' : '') + comboDisplay;
    if (meta.length > 0) text += ' \u2014 ' + meta.join(' \u00b7 ');
    histItems.push({ text: text, signal: 'good' });
    if (combo.enhancedReasons.length > 0) {
      histItems.push({ text: combo.enhancedReasons.join(' \u00b7 '), signal: 'info' });
    }
  });

  if (histItems.length > 0) {
    sections.push({
      label: 'BASED ON YOUR HISTORY',
      icon: zi('chart'),
      items: histItems
    });
  }

  // New combos section
  var newItems = [];
  var topNew = newCombos.slice(0, 2);
  topNew.forEach(function(combo) {
    var comboDisplay = combo.bases.map(function(f) { return f.charAt(0).toUpperCase() + f.slice(1); }).join(' + ');
    newItems.push({ text: comboDisplay, signal: 'action' });
    if (combo.enhancedReasons.length > 0) {
      newItems.push({ text: combo.enhancedReasons.join(' \u00b7 '), signal: 'info' });
    }
  });

  if (newItems.length > 0) {
    sections.push({
      label: 'NEW COMBOS TO TRY',
      icon: zi('sparkle'),
      items: newItems
    });
  }

  // Best meal fit
  var bestCombo = topHistory[0] || topNew[0];
  if (bestCombo) {
    var fits = _iqMealFit(bestCombo);
    if (fits.length > 0) {
      var fitItems = fits.map(function(f) {
        return { text: f.meal.charAt(0).toUpperCase() + f.meal.slice(1) + ' \u2014 ' + f.reason, signal: 'action', icon: zi(f.icon) };
      });
      sections.push({
        label: 'BEST FOR',
        icon: zi('target'),
        items: fitItems
      });
    }
  }

  // Warnings
  var warnings = _iqGetWarnings(selectedFoods);
  if (warnings.length > 0) {
    sections.push({
      label: 'NOTE',
      icon: zi('warn'),
      items: warnings.map(function(w) { return { text: w, signal: 'warn' }; })
    });
  }

  // Synergy highlights in sections
  var synergies = [];
  for (var si = 0; si < selectedFoods.length; si++) {
    for (var sj = si + 1; sj < selectedFoods.length; sj++) {
      var syn = getSynergy(selectedFoods[si], selectedFoods[sj]);
      if (syn) synergies.push(syn);
    }
  }
  if (synergies.length > 0) {
    sections.push({
      label: 'SYNERGY',
      icon: zi('link'),
      items: synergies.slice(0, 2).map(function(s) { return { text: s.reason, signal: 'good' }; })
    });
  }

  // Empty state: no combos found at all
  if (sections.length === 0) {
    sections.push({
      label: 'WHAT TO TRY',
      icon: zi('bulb'),
      items: [
        { text: 'No proven combos yet with these ingredients \u2014 try logging a few meals with them first', signal: 'info' },
        { text: 'Pair a grain with a fruit or nut for breakfast, dal with vegs for lunch', signal: 'action' }
      ]
    });
  }

  // Confidence
  var confidence = historicalCombos.length > 0
    ? 'Based on ' + Object.keys(feedingData || {}).length + ' days of meal data'
    : 'Limited meal history \u2014 suggestions will improve as you log more meals';

  return {
    icon: 'bowl',
    domain: 'peach',
    title: 'Best combos with ' + displayFoods,
    headline: historicalCombos.length > 0
      ? historicalCombos.length + ' proven combo' + (historicalCombos.length > 1 ? 's' : '') + ' found'
      : 'New combo suggestions',
    sections: sections,
    confidence: confidence,
    dataGap: null
  };
}

// ── FOOD SAFETY MODE ANSWER HANDLER ──

function qaHandleFoodSafety(classified) {
  var raw = classified.raw;
  // Extract food names from query
  var cleaned = raw.toLowerCase().replace(/^can (i|we) give\s*|^is\s+|^safe to give\s*|^can she (eat|have)\s*|^can baby (eat|have)\s*/i, '').replace(/\s*safe\s*$|\?/g, '').trim();
  var rawFoods = cleaned.split(/[+,&]|with|and/).map(function(f) { return f.trim(); }).filter(function(f) { return f.length > 1; });
  if (rawFoods.length === 0) return null;

  var mo = getAgeInMonths();
  var introducedSet = new Set((foods || []).map(function(f) { return _baseFoodName(f.name).toLowerCase(); }));

  var verdict = 'safe';
  var warnings = [];
  var benefits = [];
  var allergenNotes = [];
  var newFoods = [];

  // 1. Age safety
  rawFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    var rule = AGE_RULES[base] || AGE_RULES[food];
    if (rule && mo < rule.minMonth) {
      verdict = 'avoid';
      warnings.push(food + ': ' + rule.reason);
    }
  });

  // 2. Allergens
  rawFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    var alert = ALLERGENS[base] || ALLERGENS[food];
    if (alert) {
      allergenNotes.push(food + ': ' + alert);
      if (verdict === 'safe') verdict = 'caution';
    }
  });

  // 3. Introduction status
  rawFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    if (!introducedSet.has(base) && food.length > 2) {
      newFoods.push(food);
    }
  });
  if (newFoods.length > 1 && verdict !== 'avoid') {
    verdict = 'caution';
    warnings.push('Multiple new foods at once \u2014 introduce each alone for 3 days first');
  }

  // 4. Nutrition highlights
  rawFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    var nut = getNutrition(base);
    if (nut && nut.nutrients) {
      benefits.push(food + ': ' + nut.nutrients.slice(0, 3).join(', '));
    }
  });

  // 5. Synergy check
  var synergies = [];
  for (var i = 0; i < rawFoods.length; i++) {
    for (var j = i + 1; j < rawFoods.length; j++) {
      var syn = getSynergy(_baseFoodName(rawFoods[i]), _baseFoodName(rawFoods[j]));
      if (syn) synergies.push(syn);
    }
  }

  // 6. Ziva's history with this food
  var historyItems = [];
  rawFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    var count = 0;
    var lastDate = null;
    var intakeSum = 0;
    var intakeCount = 0;
    Object.keys(feedingData || {}).forEach(function(date) {
      var day = feedingData[date];
      ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
        var mealStr = day[meal];
        if (mealStr && typeof mealStr === 'string') {
          var mealBases = mealStr.split(/[,+]/).map(function(f) { return _baseFoodName(f.trim()); });
          if (mealBases.indexOf(base) !== -1) {
            count++;
            lastDate = date;
            var intakeKey = meal + '_intake';
            if (day[intakeKey] !== undefined && day[intakeKey] !== null) {
              intakeSum += day[intakeKey];
              intakeCount++;
            }
          }
        }
      });
    });

    if (count > 0) {
      var parts = ['Served ' + count + '\u00d7'];
      if (intakeCount > 0) {
        var avgIntake = Math.round((intakeSum / intakeCount) * 100);
        var label = avgIntake >= 80 ? 'loves it' : avgIntake >= 50 ? 'eats well' : 'often leaves';
        parts.push('avg intake ' + avgIntake + '% (' + label + ')');
      }
      if (lastDate) parts.push('last: ' + lastDate);
      historyItems.push({ text: food + ' \u2014 ' + parts.join(' \u00b7 '), signal: 'info' });
    }
  });

  // Build sections
  var sections = [];
  var verdictText = verdict === 'avoid' ? 'Avoid' : verdict === 'caution' ? 'Caution' : 'Safe';
  var verdictSignal = verdict === 'avoid' ? 'warn' : verdict === 'caution' ? 'warn' : 'good';

  // Safety section
  var safetyItems = [];
  safetyItems.push({ text: verdictText + ' for ' + mo + '-month-old', signal: verdictSignal });
  warnings.forEach(function(w) { safetyItems.push({ text: w, signal: 'warn' }); });
  allergenNotes.forEach(function(a) { safetyItems.push({ text: a, signal: 'warn' }); });
  if (newFoods.length === 1) {
    safetyItems.push({ text: newFoods[0] + ' is new \u2014 introduce alone and watch for 3 days', signal: 'info' });
  }
  sections.push({ label: 'SAFETY', icon: zi('shield'), items: safetyItems });

  // Nutrition section
  if (benefits.length > 0) {
    sections.push({
      label: 'NUTRITION',
      icon: zi('chart'),
      items: benefits.map(function(b) { return { text: b, signal: 'good' }; })
    });
  }

  // Synergies
  if (synergies.length > 0) {
    sections.push({
      label: 'BEST PAIRINGS',
      icon: zi('link'),
      items: synergies.slice(0, 2).map(function(s) { return { text: s.reason, signal: 'good' }; })
    });
  }

  // Ziva's history
  if (historyItems.length > 0) {
    sections.push({
      label: 'ZIVA\'S HISTORY',
      icon: zi('baby'),
      items: historyItems
    });
  }

  return {
    icon: 'shield',
    domain: 'peach',
    title: rawFoods.length === 1 ? 'Can she eat ' + rawFoods[0] + '?' : 'Food safety check',
    headline: verdictText + (verdict === 'safe' ? ' \u2014 good to go' : ''),
    sections: sections,
    confidence: null,
    dataGap: null
  };
}

// ── SYMPTOM MODE ANSWER HANDLER ──

function qaHandleSymptom(classified) {
  var query = classified.raw.toLowerCase().trim();
  var mo = getAgeInMonths();
  var matches = [];

  SYMPTOM_DB.forEach(function(entry) {
    var score = 0;
    entry.keywords.forEach(function(kw) {
      if (query.indexOf(kw.toLowerCase()) !== -1) score += 2;
      var words = kw.toLowerCase().split(' ');
      words.forEach(function(w) {
        if (w.length > 3 && query.indexOf(w) !== -1) score += 1;
      });
    });
    if (score > 0) {
      var finalSeverity = entry.severity;
      if (entry.condition && entry.condition(query, mo)) {
        finalSeverity = 'emergency';
      }
      matches.push({ entry: entry, score: score, severity: finalSeverity });
    }
  });

  if (matches.length === 0) return null;

  // Sort: emergency first, then by score
  var SEV_RANK = { emergency: 0, warning: 1, mild: 2 };
  matches.sort(function(a, b) {
    return (SEV_RANK[a.severity] || 2) - (SEV_RANK[b.severity] || 2) || b.score - a.score;
  });

  var top = matches.slice(0, 2);
  var sections = [];

  top.forEach(function(m) {
    var e = m.entry;
    var sevLabel = m.severity === 'emergency' ? 'Emergency' : m.severity === 'warning' ? 'Monitor closely' : 'Usually manageable';

    // What to do
    sections.push({
      label: 'WHAT TO DO \u2014 ' + escHtml(e.title),
      icon: m.severity === 'emergency' ? zi('siren') : zi('medical'),
      items: [
        { text: sevLabel, signal: m.severity === 'emergency' ? 'warn' : m.severity === 'warning' ? 'warn' : 'good' },
        { text: e.whatToDo, signal: 'action' }
      ]
    });

    // Precautions
    sections.push({
      label: 'PRECAUTIONS',
      icon: zi('shield'),
      items: [{ text: e.precautions, signal: 'info' }]
    });

    // When to call doctor
    if (e.emergency) {
      sections.push({
        label: 'WHEN TO SEEK CARE',
        icon: zi('siren'),
        items: [{ text: e.emergency, signal: 'warn' }]
      });
    }
  });

  var isEmergency = top.some(function(m) { return m.severity === 'emergency'; });

  // Map symptom to trackable episode
  var symptomTrackMap = {
    'fever-high': 'track-fever-high',
    'fever-mild': 'track-fever',
    'vomiting': 'track-vomiting',
    'diarrhoea': 'track-diarrhoea',
    'cough-cold': 'track-cold'
  };
  var actions = [];
  var trackId = symptomTrackMap[top[0].entry.id];
  if (trackId) {
    var trackMapping = _qaSymptomTrackMap[trackId];
    if (trackMapping) {
      var alreadyActive = trackMapping.getActive();
      if (alreadyActive) {
        actions.push({ id: trackId, label: trackMapping.label + ' tracking active — view', icon: 'chart', color: 'sage' });
      } else {
        actions.push({ id: trackId, label: 'Start ' + trackMapping.label + ' tracking', icon: 'medical', color: 'rose' });
      }
    }
  }

  return {
    icon: 'medical',
    domain: isEmergency ? 'rose' : 'sky',
    title: top[0].entry.title,
    headline: top[0].severity === 'emergency' ? 'Seek immediate attention' : top[0].severity === 'warning' ? 'Monitor closely' : 'Usually manageable at home',
    sections: sections,
    actions: actions,
    confidence: null,
    dataGap: 'This is general guidance, not medical advice. When in doubt, call your paediatrician.'
  };
}

// ── INTENT MATCHING ──

function qaMatchIntent(input) {
  var text = input.toLowerCase().replace(/[?!.,]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  var tokens = text.split(/\s+/);

  var bestIntent = null;
  var bestScore = 0;

  QA_INTENTS.forEach(function(intent) {
    var score = 0;

    intent.triggers.forEach(function(trigger) {
      if (trigger.indexOf(' ') !== -1) {
        if (text.indexOf(trigger) !== -1) score += 10;
      } else {
        if (tokens.some(function(t) { return t === trigger || t.indexOf(trigger) === 0; })) score += 3;
      }
    });

    if (intent.boosts && score > 0) {
      intent.boosts.forEach(function(b) {
        if (tokens.indexOf(b) !== -1 || text.indexOf(b) !== -1) score += 2;
      });
    }

    if (intent.exclude) {
      if (intent.exclude.some(function(ex) { return text.indexOf(ex) !== -1; })) score = 0;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  });

  return bestScore >= 3 ? bestIntent : null;
}

// ── CONTEXTUAL QUICK QUESTIONS ──

var _qaChipsCache = null;
var _qaChipsCacheAt = 0;

function qaGetContextualQuickQuestions() {
  // Cache for 60 seconds to avoid expensive compute calls on every renderHome
  var now = Date.now();
  if (_qaChipsCache && (now - _qaChipsCacheAt) < 60000) return _qaChipsCache;

  var questions = [];

  // Always first: Yesterday
  questions.push({ text: 'Yesterday', intent: '_isl_yesterday', context: false });

  // Weekend: This week / Weekly highlights
  var dow = new Date().getDay();
  if (dow === 0 || dow === 6) {
    questions.push({ text: 'This week', intent: '_isl_this_week', context: true });
  } else {
    questions.push({ text: 'Tomorrow\'s plan', intent: '_isl_tomorrow', context: false });
  }

  // Contextual chips
  try {
    var sleepScore = getSleepScore24h();
    if (sleepScore && sleepScore.score < 70) {
      questions.push({ text: 'How\'s her sleep?', intent: 'sleep_quality', context: true });
    }
  } catch(e) {}

  try {
    var todayEntry = feedingData[today()] || {};
    var mealsLogged = 0;
    if (todayEntry.breakfast) mealsLogged++;
    if (todayEntry.lunch) mealsLogged++;
    if (todayEntry.dinner) mealsLogged++;
    if (mealsLogged < 2) {
      questions.push({ text: 'What to feed?', intent: 'food_general', context: true });
    }
  } catch(e) {}

  try {
    var todayPoop = (poopData || []).filter(function(p) { return p.date === today(); });
    if (todayPoop.length === 0) {
      questions.push({ text: 'Poop update', intent: 'poop_general', context: true });
    }
  } catch(e) {}

  // Doctor prep if vaccine due within 14 days
  try {
    var nextVacc = (vaccData || []).find(function(v) { return v.upcoming && v.date; });
    if (nextVacc) {
      var daysUntil = Math.round((new Date(nextVacc.date) - new Date(today())) / 86400000);
      if (daysUntil <= 14 && daysUntil >= 0) {
        questions.push({ text: 'Doctor prep', intent: '_isl_doctor', context: true });
      }
    }
  } catch(e) {}

  // Share today if well-logged day (5+ events)
  try {
    var todaySummary = generateDaySummary(today());
    if (todaySummary.events >= 5) {
      questions.push({ text: 'Share today', intent: '_isl_share', context: true });
    }
  } catch(e) {}

  // Fill defaults if under 5
  var defaults = [
    { text: 'What can I make?', intent: '_uib_picker' },
    { text: 'Her routine', intent: '_isl_routine' },
    { text: 'What does she like?', intent: '_isl_likes' },
    { text: 'Is she on track?', intent: 'milestone_general' }
  ];

  defaults.forEach(function(d) {
    if (questions.length < 5 && !questions.some(function(q) { return q.intent === d.intent; })) {
      questions.push({ text: d.text, intent: d.intent, context: false });
    }
  });

  var result = questions.slice(0, 5);
  _qaChipsCache = result;
  _qaChipsCacheAt = Date.now();
  return result;
}

// ── SEARCH BAR RENDERER ──

function renderQABar() {
  var container = document.getElementById('smartQAContainer');
  if (!container) return;

  var input = document.getElementById('qaInput');
  var clearBtn = document.getElementById('qaClear');
  var chipsEl = document.getElementById('qaChips');

  if (!input || !chipsEl) return;

  // Render quick chips
  var chips = qaGetContextualQuickQuestions();
  var chipsHtml = '';
  var _qaIntentColor = {
    overall: 'rose', sleep_quality: 'indigo', sleep_early: 'indigo', sleep_wakeups: 'indigo', sleep_naps: 'lav',
    food_general: 'peach', food_nutrient: 'peach', food_variety: 'peach', food_safe: 'amber', food_texture: 'peach',
    weight_gain: 'rose', weight_loss: 'rose', growth: 'rose',
    poop_general: 'amber', poop_food: 'amber', poop_color: 'amber',
    activity_general: 'sage', activity_sleep: 'sage', milestone_general: 'lav', milestone_specific: 'lav',
    vaccine: 'sky', supplement: 'sky', illness: 'sky', tomorrow: 'peach',
    _uib_picker: 'peach', _uib_symptom: 'sky', _uib_outing: 'sage',
    _isl_yesterday: 'indigo', _isl_this_week: 'indigo', _isl_tomorrow: 'lav',
    _isl_doctor: 'sky', _isl_share: 'indigo', _isl_routine: 'indigo', _isl_likes: 'peach',
    age: 'rose', streak: 'amber'
  };
  chips.forEach(function(c) {
    var colorCls = _qaIntentColor[c.intent] || 'rose';
    var cls = 'qa-chip qa-chip-' + colorCls + (c.context ? ' qa-chip-context' : '');
    chipsHtml += '<button class="' + cls + '" data-qa-intent="' + escHtml(c.intent) + '" data-qa-text="' + escHtml(c.text) + '">' + escHtml(c.text) + '</button>';
  });
  chipsEl.innerHTML = chipsHtml;

  // Chip tap handlers
  chipsEl.querySelectorAll('.qa-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var intentId = this.getAttribute('data-qa-intent');
      var text = this.getAttribute('data-qa-text');
      // UIB special chips
      if (intentId === '_uib_picker') {
        input.value = '';
        clearBtn.style.display = 'none';
        _uibClearModeIndicator();
        var answerEl = document.getElementById('qaAnswerContainer');
        if (answerEl) answerEl.innerHTML = '';
        _iqRenderPicker();
        return;
      }
      if (intentId === '_uib_symptom') {
        input.value = '';
        input.focus();
        input.placeholder = 'Describe symptoms: rash, fever, cough\u2026';
        clearBtn.style.display = 'none';
        _iqHidePicker();
        return;
      }
      if (intentId === '_uib_outing') {
        input.value = '';
        clearBtn.style.display = 'none';
        _uibShowModeIndicator('outing');
        _iqHidePicker();
        var answerEl = document.getElementById('qaAnswerContainer');
        if (answerEl) answerEl.innerHTML = '';
        _outingRenderForm();
        return;
      }
      // ISL chip mappings
      var islChipMap = {
        '_isl_yesterday': 'Yesterday',
        '_isl_this_week': 'This week',
        '_isl_tomorrow': 'Tomorrow plan',
        '_isl_doctor': 'Doctor visit prep',
        '_isl_share': 'Share today',
        '_isl_routine': 'What is her routine',
        '_isl_likes': 'What does she like'
      };
      if (islChipMap[intentId]) { text = islChipMap[intentId]; }
      input.value = text;
      clearBtn.style.display = '';
      _iqHidePicker();
      qaExecuteQuery(text);
    });
  });

  // Input handler
  input.removeEventListener('keydown', _qaHandleKeydown);
  input.addEventListener('keydown', _qaHandleKeydown);

  // Input change for clear button
  input.removeEventListener('input', _qaHandleInput);
  input.addEventListener('input', _qaHandleInput);

  // Clear button
  clearBtn.removeEventListener('click', _qaHandleClear);
  clearBtn.addEventListener('click', _qaHandleClear);

  // Start placeholder rotation
  _qaStartPlaceholderRotation(input);

  // ── QA bar active state (search-bar feel: chips hidden until focused) ──
  var qaCard = container.querySelector('.qa-card');
  if (qaCard) {
    // Remove previous listeners to avoid stacking on re-render
    input.removeEventListener('focus', _qaHandleFocus);
    input.removeEventListener('blur', _qaHandleBlur);
    // Store qaCard reference for the handlers
    _qaCardRef = qaCard;
    input.addEventListener('focus', _qaHandleFocus);
    input.addEventListener('blur', _qaHandleBlur);
    // If input already has content or answer is showing, activate immediately
    if (input.value.length > 0) qaCard.classList.add('qa-active');
    var answerEl = document.getElementById('qaAnswerContainer');
    if (answerEl && answerEl.innerHTML.trim().length > 0) qaCard.classList.add('qa-active');
  }
}

function _qaCheckDeactivate(qaCard) {
  if (!qaCard) { qaCard = document.querySelector('.qa-card'); }
  if (!qaCard) return;
  var input = document.getElementById('qaInput');
  var answerEl = document.getElementById('qaAnswerContainer');
  var picker = document.getElementById('iqPicker');
  var outing = document.getElementById('outingForm');
  // Stay active if: input focused, input has value, answer showing, picker showing, or outing form showing
  var inputFocused = input && document.activeElement === input;
  var hasValue = input && input.value.length > 0;
  var hasAnswer = answerEl && answerEl.innerHTML.trim().length > 0;
  var hasPicker = picker && picker.style.display !== 'none' && picker.innerHTML.trim().length > 0;
  var hasOuting = outing && outing.style.display !== 'none' && outing.innerHTML.trim().length > 0;
  if (!inputFocused && !hasValue && !hasAnswer && !hasPicker && !hasOuting) {
    qaCard.classList.remove('qa-active');
  }
}

function _qaHandleKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    var text = e.target.value.trim();
    if (text) {
      var suggestEl = document.getElementById('qaSuggest');
      if (suggestEl) { suggestEl.innerHTML = ''; suggestEl.classList.remove('active'); }
      qaExecuteQuery(text);
      e.target.blur();
    }
  }
}

function _qaHandleInput(e) {
  var clearBtn = document.getElementById('qaClear');
  if (clearBtn) clearBtn.style.display = e.target.value.length > 0 ? '' : 'none';
  _qaUpdateSuggestions(e.target.value.trim());
}

function _qaHandleClear() {
  var input = document.getElementById('qaInput');
  var clearBtn = document.getElementById('qaClear');
  var answerEl = document.getElementById('qaAnswerContainer');
  var suggestEl = document.getElementById('qaSuggest');
  if (input) { input.value = ''; input.focus(); }
  if (clearBtn) clearBtn.style.display = 'none';
  if (answerEl) answerEl.innerHTML = '';
  if (suggestEl) { suggestEl.innerHTML = ''; suggestEl.classList.remove('active'); }
  _uibClearModeIndicator();
  _iqHidePicker();
  _outingHideForm();
}

function _qaStartPlaceholderRotation(input) {
  if (_qaPlaceholderTimer) clearInterval(_qaPlaceholderTimer);
  _qaPlaceholderIdx = 0;
  input.placeholder = QA_PLACEHOLDERS[0];
  _qaPlaceholderTimer = setInterval(function() {
    if (document.activeElement === input) return;
    if (input.value.length > 0) return;
    _qaPlaceholderIdx = (_qaPlaceholderIdx + 1) % QA_PLACEHOLDERS.length;
    input.placeholder = QA_PLACEHOLDERS[_qaPlaceholderIdx];
  }, 5000);
}

// ── QUERY EXECUTION ──

function qaExecuteQuery(text) {
  _qaCache = {};
  _qaCache._queryText = text.toLowerCase().replace(/[?!.,]/g, '').trim();
  var answerEl = document.getElementById('qaAnswerContainer');
  if (!answerEl) return;

  // UIB: classify input mode first
  var classified = qaClassifyInput(text);
  _iqHidePicker();

  // Route to appropriate handler
  var answer = null;
  try {
    if (classified.mode === 'temporal') {
      _uibShowModeIndicator('temporal');
      answer = _qaHandleTemporal(classified);
    } else if (classified.mode === 'lookback') {
      _uibShowModeIndicator('lookback');
      answer = _qaHandleLookback(classified);
    } else if (classified.mode === 'pattern') {
      _uibShowModeIndicator('pattern');
      answer = _qaHandlePattern(classified);
    } else if (classified.mode === 'planning') {
      _uibShowModeIndicator('planning');
      answer = _qaHandlePlanning(classified);
    } else if (classified.mode === 'picker') {
      _uibShowModeIndicator('ingredient');
      _iqRenderPicker();
      return;
    } else if (classified.mode === 'ingredient') {
      _uibShowModeIndicator('ingredient');
      answer = qaHandleIngredient(classified);
    } else if (classified.mode === 'outing') {
      _uibShowModeIndicator('outing');
      _outingHideForm();
      qaHandleOuting(classified);
      return; // Form shown async — don't fall through to no-match
    } else if (classified.mode === 'symptom') {
      _uibShowModeIndicator('symptom');
      answer = qaHandleSymptom(classified);
    } else if (classified.mode === 'food_safety') {
      _uibShowModeIndicator('food_safety');
      answer = qaHandleFoodSafety(classified);
    } else {
      // QA mode — existing intent matching
      _uibClearModeIndicator();
      var intent = qaMatchIntent(text);
      if (!intent) {
        qaRenderNoMatch(answerEl);
        return;
      }
      var handler = intent.handler;
      if (handler === 'answerSleepQuality') answer = qaAnswerSleepQuality(intent.id);
      else if (handler === 'answerSleepEarly') answer = qaAnswerSleepEarly(intent.id);
      else if (handler === 'answerSleepWakeups') answer = qaAnswerSleepWakeups(intent.id);
      else if (handler === 'answerNaps') answer = qaAnswerNaps(intent.id);
      else if (handler === 'answerWeightGain') answer = qaAnswerWeightGain(intent.id);
      else if (handler === 'answerWeightConcern') answer = qaAnswerWeightConcern(intent.id);
      else if (handler === 'answerGrowth') answer = qaAnswerGrowth(intent.id);
      else if (handler === 'answerFoodGeneral') answer = qaAnswerFoodGeneral(intent.id);
      else if (handler === 'answerNutrientGap') answer = qaAnswerNutrientGap(intent.id);
      else if (handler === 'answerFoodVariety') answer = qaAnswerFoodVariety(intent.id);
      else if (handler === 'answerFoodSafety') answer = qaAnswerFoodSafety(intent.id);
      else if (handler === 'answerTexture') answer = qaAnswerTexture(intent.id);
      else if (handler === 'answerPoopGeneral') answer = qaAnswerPoopGeneral(intent.id);
      else if (handler === 'answerPoopFood') answer = qaAnswerPoopFood(intent.id);
      else if (handler === 'answerPoopColor') answer = qaAnswerPoopColor(intent.id);
      else if (handler === 'answerActivityGeneral') answer = qaAnswerActivityGeneral(intent.id);
      else if (handler === 'answerActivitySleep') answer = qaAnswerActivitySleep(intent.id);
      else if (handler === 'answerMilestoneGeneral') answer = qaAnswerMilestoneGeneral(intent.id);
      else if (handler === 'answerMilestoneSpecific') answer = qaAnswerMilestoneSpecific(intent.id);
      else if (handler === 'answerVaccReaction') answer = qaAnswerVaccReaction(intent.id);
      else if (handler === 'answerVaccine') answer = qaAnswerVaccine(intent.id);
      else if (handler === 'answerSupplement') answer = qaAnswerSupplement(intent.id);
      else if (handler === 'answerIllness') answer = qaAnswerIllness(intent.id);
      else if (handler === 'answerOverall') answer = qaAnswerOverall(intent.id);
      else if (handler === 'answerTomorrow') answer = qaAnswerTomorrow(intent.id);
      else if (handler === 'answerAge') answer = qaAnswerAge(intent.id);
      else if (handler === 'answerStreak') answer = qaAnswerStreak(intent.id);
      else if (handler === 'answerPredictionAccuracy') answer = qaAnswerPredictionAccuracy();
      else if (handler === 'answerFavoriteFoods') answer = qaAnswerFavoriteFoods();
      else if (handler === 'ctCreate') {
        // Open template picker instead of showing an answer
        var qaInput = document.querySelector('.uib-input');
        if (qaInput) { qaInput.value = ''; qaInput.blur(); }
        _uibClearModeIndicator();
        ctOpenTemplatePicker();
        return;
      }
      else answer = null;
    }
  } catch(e) {
    answer = null;
  }

  if (answer) {
    qaRenderAnswer(answerEl, answer);
  } else {
    _uibClearModeIndicator();
    qaRenderNoMatch(answerEl);
  }
}

// ── ANSWER CARD RENDERER ──

function qaRenderAnswer(container, answer) {
  var signalIcons = { good: zi('check'), warn: zi('warn'), action: zi('arrow-right'), info: zi('info'), neutral: '·' };
  var signalClasses = { good: 'qa-item-good', warn: 'qa-item-warn', action: 'qa-item-action', info: 'qa-item-info', neutral: 'qa-item-neutral' };

  var domainCls = answer.domain ? ' qa-answer-' + answer.domain : '';
  var html = '<div class="qa-answer' + domainCls + '">';

  // Header with zi icon
  var iconHtml = answer.icon ? '<div class="icon icon-' + (answer.domain || 'rose') + '"><svg class="zi"><use href="#zi-' + answer.icon + '"/></svg></div>' : '';
  html += '<div class="qa-answer-header">';
  html += iconHtml;
  html += '<div class="qa-answer-title-group">';
  html += '<div class="qa-answer-title">' + escHtml(answer.title) + '</div>';
  if (answer.headline) html += '<div class="qa-answer-headline">' + escHtml(answer.headline) + '</div>';
  html += '</div>';
  html += '<button class="qa-answer-close" id="qaAnswerClose" aria-label="Close">&times;</button>';
  html += '</div>';

  // Sections
  if (answer.sections) {
    answer.sections.forEach(function(sec) {
      html += '<div class="qa-section">';
      html += '<div class="qa-section-label"><span class="qa-section-label-icon">' + sec.icon + '</span> ' + escHtml(sec.label) + '</div>';
      if (sec.items) {
        sec.items.forEach(function(item) {
          var cls = signalClasses[item.signal] || 'qa-item-neutral';
          var icon = item.icon || signalIcons[item.signal] || '·';
          html += '<div class="qa-item ' + cls + '">';
          html += '<span class="qa-item-signal">' + icon + '</span>';
          html += '<span class="qa-item-text">' + escHtml(item.text) + '</span>';
          html += '</div>';
        });
      }
      html += '</div>';
    });
  }

  // Actions (CTA buttons)
  if (answer.actions && answer.actions.length > 0) {
    html += '<div class="qa-actions">';
    answer.actions.forEach(function(act) {
      var colorCls = act.color ? ' qa-action-' + act.color : '';
      html += '<button class="qa-action-btn' + colorCls + '" data-qa-action="' + escHtml(act.id) + '">';
      if (act.icon) html += '<span class="qa-action-icon">' + zi(act.icon) + '</span>';
      html += escHtml(act.label);
      html += '</button>';
    });
    html += '</div>';
  }

  // Data gap
  if (answer.dataGap) {
    html += '<div class="qa-data-gap">' + escHtml(answer.dataGap) + '</div>';
  }

  // Confidence
  if (answer.confidence) {
    html += '<div class="qa-confidence">' + escHtml(answer.confidence) + '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // Close button
  var closeBtn = document.getElementById('qaAnswerClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      container.innerHTML = '';
      setTimeout(function() { _qaCheckDeactivate(); }, 50);
    });
  }

  // Action buttons
  container.querySelectorAll('[data-qa-action]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var actionId = this.getAttribute('data-qa-action');
      _qaHandleAction(actionId, container);
    });
  });
}

// ── SYMPTOM TRACK ACTION HANDLER ──

var _qaSymptomTrackMap = {
  'track-fever': { getActive: getActiveFeverEpisode, start: function() { return startFeverEpisode(100, 'search'); }, tab: 'medical', label: 'Fever' },
  'track-fever-high': { getActive: getActiveFeverEpisode, start: function() { return startFeverEpisode(103, 'search'); }, tab: 'medical', label: 'Fever' },
  'track-diarrhoea': { getActive: getActiveDiarrhoeaEpisode, start: function() { return startDiarrhoeaEpisode('search'); }, tab: 'medical', label: 'Diarrhoea' },
  'track-vomiting': { getActive: getActiveVomitingEpisode, start: function() { return startVomitingEpisode('search'); }, tab: 'medical', label: 'Vomiting' },
  'track-cold': { getActive: getActiveColdEpisode, start: function() { return startColdEpisode('search'); }, tab: 'medical', label: 'Cold' }
};

function _qaHandleAction(actionId, container) {
  // Share actions
  if (actionId === 'share-summary' || actionId === 'share-copy' || actionId === 'share-whatsapp') {
    _qaHandleShareAction(actionId, container);
    return;
  }

  var mapping = _qaSymptomTrackMap[actionId];
  if (!mapping) return;

  var active = mapping.getActive();
  if (active) {
    // Already tracking — navigate to medical tab
    switchTab('medical');
    return;
  }

  // Start episode
  mapping.start();
  _islMarkDirty('medical');

  // Update button to show confirmation
  var btn = container.querySelector('[data-qa-action="' + actionId + '"]');
  if (btn) {
    btn.innerHTML = zi('check') + ' ' + escHtml(mapping.label) + ' tracking started';
    btn.classList.add('qa-action-done');
    btn.disabled = true;
  }

  // Navigate to medical tab after brief delay
  setTimeout(function() { switchTab('medical'); }, 1200);
}

function _qaHandleShareAction(actionId, container) {
  // Try to get summary data from the answer card
  var summaryText = '';
  try {
    // Build text from current answer card content
    var titleEl = container.querySelector('.qa-answer-title');
    var headEl = container.querySelector('.qa-answer-headline');
    var items = container.querySelectorAll('.qa-item-text');
    var lines = [];
    if (titleEl) lines.push('*' + titleEl.textContent + '*');
    if (headEl) lines.push(headEl.textContent);
    lines.push('');
    items.forEach(function(el) { lines.push(el.textContent); });
    lines.push('');
    lines.push('_via SproutLab_');
    summaryText = lines.join('\n');
  } catch(e) {
    summaryText = 'SproutLab Summary';
  }

  if (actionId === 'share-whatsapp') {
    var waUrl = 'https://wa.me/?text=' + encodeURIComponent(summaryText);
    window.open(waUrl, '_blank');
  } else {
    // Copy to clipboard (share-summary and share-copy)
    var onCopied = function() {
      var btn = container.querySelector('[data-qa-action="' + actionId + '"]');
      if (btn) {
        btn.innerHTML = zi('check') + ' Copied';
        btn.classList.add('qa-action-done');
        setTimeout(function() {
          btn.innerHTML = (actionId === 'share-copy' ? zi('note') : zi('link')) + ' Share';
          btn.classList.remove('qa-action-done');
        }, 2000);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).then(onCopied).catch(function() {
        _qaClipboardFallback(summaryText);
        onCopied();
      });
    } else {
      _qaClipboardFallback(summaryText);
      onCopied();
    }
  }
}

function _qaClipboardFallback(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function qaRenderNoMatch(container) {
  var cats = [
    { text: 'Sleep', intent: 'sleep_quality', color: 'indigo' },
    { text: 'Food', intent: 'food_general', color: 'peach' },
    { text: 'Growth', intent: 'weight_gain', color: 'rose' },
    { text: 'Poop', intent: 'poop_general', color: 'amber' },
    { text: 'Activities', intent: 'activity_general', color: 'sage' },
    { text: 'Milestones', intent: 'milestone_general', color: 'lav' },
    { text: 'Overall', intent: 'overall', color: 'rose' }
  ];

  var html = '<div class="qa-answer"><div class="qa-no-match">';
  html += '<div class="qa-no-match-label">I couldn\'t find a specific answer for that. Here\'s what I can help with:</div>';
  html += '<div class="qa-cat-chips">';
  cats.forEach(function(c) {
    html += '<button class="qa-chip qa-chip-' + c.color + '" data-qa-fallback="' + c.intent + '">' + escHtml(c.text) + '</button>';
  });
  html += '</div></div></div>';
  container.innerHTML = html;

  container.querySelectorAll('[data-qa-fallback]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var intent = this.getAttribute('data-qa-fallback');
      var input = document.getElementById('qaInput');
      if (input) input.value = this.textContent;
      qaExecuteQuery(this.textContent);
    });
  });
}

// ═══ TEMPORAL QUERY HANDLER + DAY SUMMARY CARD ═══

function _qaHandleTemporal(classified) {
  var tr = classified.timeRange;
  if (!tr) return null;

  var isSingleDay = tr.start === tr.end;
  var domain = classified.domain || null;

  if (domain) {
    // Domain-scoped temporal card
    return _qaRenderDomainTemporal(domain, tr);
  }

  if (isSingleDay) {
    // Full day summary card
    var summary = generateDaySummary(tr.start);
    if (summary.events === 0) {
      return {
        title: tr.label,
        headline: 'No data logged for this day',
        icon: 'clock',
        domain: 'indigo',
        sections: [],
        dataGap: 'Start logging meals, sleep, and activities to see insights here.'
      };
    }
    return _qaFormatDaySummaryCard(summary, tr.label);
  }

  // Multi-day → full range summary with VS delta
  return _qaRenderMultiDayBasic(tr);
}

function _qaFormatDaySummaryCard(summary, timeLabel) {
  var sections = [];

  // HIGHLIGHTS section
  if (summary.highlights.length > 0) {
    sections.push({
      label: 'Highlights',
      icon: zi('check'),
      items: summary.highlights.map(function(h) {
        return { text: h.text, signal: h.signal };
      })
    });
  }

  // HEADS UP section
  if (summary.concerns.length > 0) {
    sections.push({
      label: 'Heads Up',
      icon: zi('warn'),
      items: summary.concerns.map(function(c) {
        return { text: c.text, signal: c.signal };
      })
    });
  }

  // SUMMARY section
  var summaryItems = [];
  if (summary.meals) {
    var mealParts = [];
    if (summary.meals.breakfast) mealParts.push('B: ' + summary.meals.breakfast);
    if (summary.meals.lunch) mealParts.push('L: ' + summary.meals.lunch);
    if (summary.meals.dinner) mealParts.push('D: ' + summary.meals.dinner);
    if (mealParts.length > 0) {
      summaryItems.push({ text: mealParts.join(' · '), signal: 'neutral', icon: zi('bowl') });
    }
  }
  if (summary.sleepSummary !== 'No sleep data') {
    summaryItems.push({ text: summary.sleepSummary, signal: 'neutral', icon: zi('moon') });
  }
  if (summary.poopSummary !== 'No poop data') {
    summaryItems.push({ text: summary.poopSummary, signal: 'neutral', icon: zi('diaper') });
  }
  if (summary.activitySummary !== 'No activities') {
    summaryItems.push({ text: summary.activitySummary, signal: 'neutral', icon: zi('run') });
  }

  if (summaryItems.length > 0) {
    sections.push({
      label: 'Summary',
      icon: zi('list'),
      items: summaryItems
    });
  }

  var scoreText = summary.scores.overall !== null ? ('Score: ' + summary.scores.overall + ' · ' + summary.events + ' events logged') : (summary.events + ' events logged');

  // BN-5: Share button on all summary cards
  var actions = [
    { id: 'share-summary', label: 'Share', icon: 'link', color: 'indigo' }
  ];

  return {
    title: timeLabel || summary.label,
    headline: scoreText,
    icon: 'clock',
    domain: 'indigo',
    sections: sections,
    actions: actions,
    confidence: summary.scores.overall !== null ? _islScoreWord(summary.scores.overall) + ' day overall' : null,
    _summaryData: summary
  };
}

function _islScoreWord(score) {
  if (score >= 80) return 'Great';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs attention';
}

function _qaRenderDomainTemporal(domain, tr) {
  var data = getDomainData(domain, tr.start, tr.end);
  var color = ISL_DOMAIN_COLOR[domain] || 'indigo';
  var icon = ISL_DOMAIN_ICON[domain] || 'chart';
  var isSingleDay = tr.start === tr.end;
  var title = (domain.charAt(0).toUpperCase() + domain.slice(1)) + ' — ' + tr.label;
  var items = [];

  if (domain === 'sleep') {
    if (data.nights.length === 0 && data.naps.length === 0) {
      return { title: title, headline: 'No sleep data for this period', icon: icon, domain: color, sections: [], dataGap: 'Log sleep entries to see insights.' };
    }
    if (data.nights.length > 0) {
      var nh = Math.floor(data.avgNightMin / 60);
      var nm = data.avgNightMin % 60;
      items.push({ text: (isSingleDay ? '' : 'Avg ') + 'night sleep: ' + nh + 'h ' + nm + 'm', signal: data.avgNightMin >= ISL_THRESHOLDS.GOOD_NIGHT_DURATION_MIN ? 'good' : 'warn' });
      if (isSingleDay && data.nights[0]) {
        items.push({ text: 'Bedtime: ' + data.nights[0].bedtime + ' · Wake: ' + data.nights[0].wakeTime, signal: 'neutral' });
        if (data.nights[0].wakeUps > 0) items.push({ text: data.nights[0].wakeUps + ' wake-up' + (data.nights[0].wakeUps !== 1 ? 's' : ''), signal: 'info' });
      } else {
        items.push({ text: data.daysWithData + '/' + data.dayCount + ' nights logged', signal: 'neutral' });
      }
    }
    if (data.naps.length > 0) {
      var totalNapH = Math.floor(data.avgNapMin / 60);
      var totalNapM = data.avgNapMin % 60;
      items.push({ text: data.naps.length + ' nap' + (data.naps.length !== 1 ? 's' : '') + (data.avgNapMin > 0 ? ' · avg ' + totalNapH + 'h ' + totalNapM + 'm total' : ''), signal: 'neutral' });
    }
    if (data.avgNightScore !== null) items.push({ text: 'Sleep score: ' + data.avgNightScore, signal: data.avgNightScore >= 70 ? 'good' : 'warn' });
  }

  else if (domain === 'diet') {
    if (data.daysWithData === 0) {
      return { title: title, headline: 'No meals logged for this period', icon: icon, domain: color, sections: [], dataGap: 'Log meals to see diet insights.' };
    }
    items.push({ text: data.totalMeals + ' meals logged across ' + data.daysWithData + ' day' + (data.daysWithData !== 1 ? 's' : ''), signal: 'neutral' });
    items.push({ text: data.daysFullyLogged + '/' + data.dayCount + ' days fully logged (3+ meals)', signal: data.daysFullyLogged >= Math.ceil(data.dayCount * ISL_THRESHOLDS.FULL_WEEK_PCT) ? 'good' : 'warn' });
    if (data.avgIntake !== null) items.push({ text: 'Avg intake: ' + data.avgIntake + '%', signal: data.avgIntake >= 70 ? 'good' : 'warn' });
    if (data.uniqueFoods > 0) items.push({ text: data.uniqueFoods + ' unique foods', signal: 'info' });
    // Show meals if single day
    if (isSingleDay && data.days[0]) {
      var dm = data.days[0].meals;
      var mealList = [];
      if (dm.breakfast) mealList.push('B: ' + dm.breakfast);
      if (dm.lunch) mealList.push('L: ' + dm.lunch);
      if (dm.dinner) mealList.push('D: ' + dm.dinner);
      if (dm.snack) mealList.push('S: ' + dm.snack);
      if (mealList.length > 0) items.push({ text: mealList.join(' · '), signal: 'neutral' });
    }
    if (data.avgDietScore !== null) items.push({ text: 'Diet score: ' + data.avgDietScore, signal: data.avgDietScore >= 70 ? 'good' : 'warn' });
  }

  else if (domain === 'poop') {
    if (data.totalCount === 0) {
      return { title: title, headline: 'No poops logged for this period', icon: icon, domain: color, sections: [], dataGap: 'Log poop entries to see insights.' };
    }
    items.push({ text: data.totalCount + ' poop' + (data.totalCount !== 1 ? 's' : '') + ' across ' + data.daysWithPoop + ' day' + (data.daysWithPoop !== 1 ? 's' : ''), signal: 'neutral' });
    items.push({ text: 'Avg ' + data.avgPerDay + '/day', signal: 'neutral' });
    if (data.mostCommonConsistency) items.push({ text: 'Most common: ' + data.mostCommonConsistency, signal: ['normal', 'soft'].includes(data.mostCommonConsistency) ? 'good' : 'warn' });
    if (data.hasBlood) items.push({ text: 'Blood detected — consult pediatrician', signal: 'action' });
    if (data.hasMucus) items.push({ text: 'Mucus detected — monitor', signal: 'warn' });
    if (data.avgPoopScore !== null) items.push({ text: 'Poop score: ' + data.avgPoopScore, signal: data.avgPoopScore >= 70 ? 'good' : 'warn' });
  }

  else if (domain === 'medical') {
    if (data.suppAdherence !== null) {
      items.push({ text: 'D3 adherence: ' + data.suppAdherence + '% (' + data.suppDays + '/' + data.suppTotal + ' days)', signal: data.suppAdherence >= ISL_THRESHOLDS.D3_ADHERENCE_GOOD_PCT ? 'good' : 'warn' });
    }
    if (data.vaccUpcoming) {
      var vDays = Math.ceil((new Date(data.vaccUpcoming.date) - new Date()) / 86400000);
      items.push({ text: 'Next vaccine: ' + data.vaccUpcoming.name + (vDays > 0 ? ' in ' + vDays + ' days' : ' — due'), signal: vDays <= 7 ? 'action' : 'info' });
    }
    if (data.growthInRange.length > 0) {
      var lg = data.growthInRange[data.growthInRange.length - 1];
      var parts = [];
      if (lg.wt) parts.push(lg.wt + ' kg');
      if (lg.ht) parts.push(lg.ht + ' cm');
      items.push({ text: 'Growth: ' + parts.join(', ') + ' (' + formatDate(lg.date) + ')', signal: 'info' });
    }
    if (data.illnessEpisodes.length > 0) {
      items.push({ text: data.illnessEpisodes.length + ' illness episode' + (data.illnessEpisodes.length !== 1 ? 's' : '') + ' in period', signal: 'warn' });
    }
    if (data.avgMedicalScore !== null) items.push({ text: 'Medical score: ' + data.avgMedicalScore, signal: data.avgMedicalScore >= 70 ? 'good' : 'warn' });
  }

  else if (domain === 'milestones') {
    if (data.progressed.length === 0 && data.active.length === 0) {
      return { title: title, headline: 'No milestone activity for this period', icon: icon, domain: color, sections: [], dataGap: 'Log activities to track milestone progress.' };
    }
    if (data.progressed.length > 0) {
      data.progressed.forEach(function(p) {
        items.push({ text: p.text + ' — ' + p.status, signal: 'good' });
      });
    }
    if (data.active.length > 0) {
      items.push({ text: data.active.length + ' milestone' + (data.active.length !== 1 ? 's' : '') + ' in progress', signal: 'info' });
    }
    if (data.activityEvidence > 0) items.push({ text: data.activityEvidence + ' evidence observations', signal: 'neutral' });
    if (data.avgMilestoneScore !== null) items.push({ text: 'Milestone score: ' + data.avgMilestoneScore, signal: data.avgMilestoneScore >= 70 ? 'good' : 'warn' });
  }

  else if (domain === 'activities') {
    if (data.totalCount === 0) {
      return { title: title, headline: 'No activities logged for this period', icon: icon, domain: color, sections: [], dataGap: 'Log activities to see insights.' };
    }
    items.push({ text: data.totalCount + ' activit' + (data.totalCount !== 1 ? 'ies' : 'y') + ' across ' + data.daysWithActivity + ' day' + (data.daysWithActivity !== 1 ? 's' : ''), signal: 'neutral' });
    if (data.totalDuration > 0) items.push({ text: 'Total duration: ' + data.totalDuration + ' min', signal: 'info' });
    // Show recent activities
    var recent = data.entries.slice(0, 4);
    recent.forEach(function(e) {
      items.push({ text: e.text + (e.duration ? ' (' + e.duration + ' min)' : ''), signal: 'neutral' });
    });
    if (data.totalCount > 4) items.push({ text: '+' + (data.totalCount - 4) + ' more activities', signal: 'neutral' });
  }

  return {
    title: title,
    headline: data.dayCount + ' day' + (data.dayCount !== 1 ? 's' : '') + ' · ' + (data.daysWithData || 0) + ' with data',
    icon: icon,
    domain: color,
    sections: items.length > 0 ? [{ label: 'Details', icon: zi(icon), items: items }] : [],
    confidence: null
  };
}

function _qaRenderMultiDayBasic(tr) {
  var summary = generateRangeSummary(tr.start, tr.end);

  // BN-3: Compute VS delta by calling generateRangeSummary for previous period
  var rangeDays = _islDateRange(tr.start, tr.end).length;
  var prevEnd = _offsetDateStr(tr.start, -1);
  var prevStart = _offsetDateStr(tr.start, -rangeDays);
  var prevSummary = null;
  try { prevSummary = generateRangeSummary(prevStart, prevEnd); } catch(e) {}

  var sections = [];

  // HIGHLIGHTS section
  if (summary.highlights.length > 0) {
    sections.push({ label: 'Highlights', icon: zi('check'), items: summary.highlights.map(function(h) { return { text: h.text, signal: h.signal }; }) });
  }

  // HEADS UP section
  if (summary.concerns.length > 0) {
    sections.push({ label: 'Heads Up', icon: zi('warn'), items: summary.concerns.map(function(c) { return { text: c.text, signal: c.signal }; }) });
  }

  // PATTERNS section
  var patItems = [];
  if (summary.patterns.meals !== 'No meals logged') patItems.push({ text: 'Meals: ' + summary.patterns.meals, signal: 'neutral', icon: zi('bowl') });
  if (summary.patterns.naps !== 'No naps logged') patItems.push({ text: 'Naps: ' + summary.patterns.naps, signal: 'neutral', icon: zi('moon') });
  if (summary.patterns.poop !== 'No poops logged') patItems.push({ text: 'Poop: ' + summary.patterns.poop, signal: 'neutral', icon: zi('diaper') });
  if (summary.newFoods.length > 0) patItems.push({ text: summary.newFoods.length + ' new food' + (summary.newFoods.length !== 1 ? 's' : '') + ': ' + summary.newFoods.slice(0, 3).join(', '), signal: 'good', icon: zi('sparkle') });
  if (patItems.length > 0) {
    sections.push({ label: 'Patterns', icon: zi('chart'), items: patItems });
  }

  // VS PREVIOUS PERIOD section
  if (prevSummary && prevSummary.avgScores.overall !== null && summary.avgScores.overall !== null) {
    var vsItems = [];
    var domains = ['sleep', 'diet', 'poop', 'medical', 'milestones'];
    var domainLabels = { sleep: 'Sleep', diet: 'Diet', poop: 'Poop', medical: 'Medical', milestones: 'Milestones' };
    domains.forEach(function(dom) {
      var cur = summary.avgScores[dom];
      var prev = prevSummary.avgScores[dom];
      if (cur !== null && prev !== null) {
        var diff = cur - prev;
        var arrow = diff > 0 ? '+' + diff : '' + diff;
        var signal = diff > 2 ? 'good' : (diff < -2 ? 'warn' : 'neutral');
        vsItems.push({ text: domainLabels[dom] + ': ' + prev + ' \u2192 ' + cur + ' (' + arrow + ')', signal: signal });
      }
    });
    var overallDiff = summary.avgScores.overall - prevSummary.avgScores.overall;
    if (vsItems.length > 0) {
      vsItems.push({ text: 'Overall: ' + prevSummary.avgScores.overall + ' \u2192 ' + summary.avgScores.overall + ' (' + (overallDiff > 0 ? '+' : '') + overallDiff + ')', signal: overallDiff > 0 ? 'good' : (overallDiff < -2 ? 'warn' : 'neutral') });
      sections.push({ label: 'VS Previous Period', icon: zi('chart'), items: vsItems });
    }
  }

  var headline = '';
  if (summary.avgScores.overall !== null) {
    headline += 'Avg Score: ' + summary.avgScores.overall;
    if (prevSummary && prevSummary.avgScores.overall !== null) {
      var od = summary.avgScores.overall - prevSummary.avgScores.overall;
      headline += ' (' + (od > 0 ? '+' : '') + od + ' vs prev)';
    }
    headline += ' \u00b7 ';
  }
  headline += summary.dayCount + ' days';

  // BN-5: Share button on all summary cards
  var actions = [
    { id: 'share-summary', label: 'Share', icon: 'link', color: 'indigo' }
  ];

  return {
    title: tr.label + ' (' + summary.label + ')',
    headline: headline,
    icon: 'chart',
    domain: 'indigo',
    sections: sections,
    actions: actions,
    confidence: summary.avgScores.overall !== null ? _islScoreWord(summary.avgScores.overall) + ' period overall' : null,
    _summaryData: summary,
    _timeRange: tr
  };
}

function _islShortDate(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function _islDedupeItems(items) {
  var seen = {};
  return items.filter(function(item) {
    // Dedupe by domain + first 30 chars
    var key = (item.domain || '') + ':' + item.text.substring(0, 30);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

