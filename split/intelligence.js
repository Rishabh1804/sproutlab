// SMART Q&A — Phase 1: Search bar + Intent matching + 6 handlers
// ═══════════════════════════════════════════════════════════════

var _qaCache = {};
var _qaPlaceholderIdx = 0;
var _qaPlaceholderTimer = null;
var _qaCardRef = null;

function _qaHandleFocus() {
  if (_qaCardRef) _qaCardRef.classList.add('qa-active');
}
function _qaHandleBlur() {
  setTimeout(function() {
    var suggestEl = document.getElementById('qaSuggest');
    var chipsEl = document.getElementById('qaChips');
    if (suggestEl) { suggestEl.innerHTML = ''; suggestEl.classList.remove('active'); }
    if (chipsEl) chipsEl.style.display = '';
    _qaCheckDeactivate(_qaCardRef);
  }, 200);
}

var QA_PLACEHOLDERS = [
  'How is she doing?',
  'ragi, banana \u2014 best combos?',
  'Can I give honey?',
  'She has a rash\u2026',
  'Going out tomorrow',
  'What nutrients is she missing?',
  'Which food helps sleep?',
  'carrot, dal, ghee \u2014 what to make?',
  'How do I improve sleep?'
];

// ── TYPEAHEAD SUGGESTION POOL ──

var QA_SUGGEST_POOL = [
  // Sleep
  { text: 'How is her sleep?', color: 'indigo' },
  { text: 'Why is sleep bad?', color: 'indigo' },
  { text: 'How to improve sleep?', color: 'indigo' },
  { text: 'Sleep yesterday', color: 'indigo' },
  { text: 'Best activities for sleep?', color: 'indigo' },
  { text: 'Nap schedule', color: 'indigo' },
  { text: 'How many wake-ups?', color: 'indigo' },
  { text: 'Earlier bedtime tips', color: 'indigo' },
  // Diet
  { text: 'What should I feed today?', color: 'peach' },
  { text: 'What did she eat yesterday?', color: 'peach' },
  { text: 'What nutrients is she missing?', color: 'peach' },
  { text: 'Food variety tips', color: 'peach' },
  { text: 'Texture progression', color: 'peach' },
  { text: 'Can I give honey?', color: 'peach' },
  { text: 'Can she eat egg?', color: 'peach' },
  { text: 'Iron-rich foods', color: 'peach' },
  // Poop
  { text: 'Poop update', color: 'amber' },
  { text: 'How to improve poop?', color: 'amber' },
  { text: 'Poop yesterday', color: 'amber' },
  { text: 'Poop color meaning', color: 'amber' },
  { text: 'Which foods affect poop?', color: 'amber' },
  { text: 'Constipation help', color: 'amber' },
  // Medical
  { text: 'Vitamin D3 adherence', color: 'sky' },
  { text: 'Vitamin D supplement', color: 'sky' },
  { text: 'Next vaccine', color: 'sky' },
  { text: 'Vaccination schedule', color: 'sky' },
  { text: 'Fever', color: 'sky' },
  { text: 'Cold and cough', color: 'sky' },
  { text: 'Vomiting', color: 'sky' },
  { text: 'Diarrhoea', color: 'sky' },
  { text: 'Rash', color: 'sky' },
  { text: 'Teething', color: 'sky' },
  // Growth
  { text: 'How is her growth?', color: 'rose' },
  { text: 'Weight gain tips', color: 'rose' },
  { text: 'Growth percentile', color: 'rose' },
  // Milestones
  { text: 'Milestone progress', color: 'lav' },
  { text: 'Is she on track?', color: 'lav' },
  { text: 'Crawling progress', color: 'lav' },
  // Activities
  { text: 'Best activities for her age?', color: 'sage' },
  { text: 'Activities for motor skills', color: 'sage' },
  { text: 'Tummy time tips', color: 'sage' },
  // Temporal
  { text: 'Yesterday', color: 'indigo' },
  { text: 'This week', color: 'indigo' },
  { text: 'Last week', color: 'indigo' },
  { text: 'This month', color: 'indigo' },
  // Overall
  { text: 'How is she doing?', color: 'rose' },
  { text: 'Overall score', color: 'rose' },
  { text: 'Going out tomorrow', color: 'sage' },
  { text: 'Doctor visit prep', color: 'sky' },
  { text: 'Share today', color: 'indigo' },
  // Session B: Lookback + Pattern + Planning
  { text: 'Last poop', color: 'amber' },
  { text: 'Last nap', color: 'lav' },
  { text: 'When did she last eat ragi?', color: 'peach' },
  { text: 'What is her routine?', color: 'indigo' },
  { text: 'What does she like?', color: 'peach' },
  { text: 'Foods she rejects', color: 'peach' },
  { text: 'What is improving?', color: 'sage' },
  { text: 'Any concerns?', color: 'amber' },
  { text: 'This week vs last week', color: 'indigo' },
  { text: 'How old is she?', color: 'rose' },
  { text: 'Logging streak', color: 'amber' },
  { text: 'Tomorrow plan', color: 'lav' },
  // Ingredient picker
  { text: 'What can I make?', color: 'peach' },
  { text: 'Ingredient picker', color: 'peach' },
  { text: 'Meal combo ideas', color: 'peach' }
];

function _qaUpdateSuggestions(text) {
  var el = document.getElementById('qaSuggest');
  var chipsEl = document.getElementById('qaChips');
  if (!el) return;

  if (!text || text.length < 2) {
    el.innerHTML = '';
    el.classList.remove('active');
    if (chipsEl) chipsEl.style.display = '';
    return;
  }

  var lower = text.toLowerCase();
  var matches = [];

  // For short inputs (2-3 chars), match word boundaries only to avoid noise
  // For longer inputs (4+), allow full substring matching
  if (lower.length <= 3) {
    var wordStartRx = new RegExp('\\b' + lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    matches = QA_SUGGEST_POOL.filter(function(s) {
      return wordStartRx.test(s.text.toLowerCase());
    });
  } else {
    matches = QA_SUGGEST_POOL.filter(function(s) {
      return s.text.toLowerCase().indexOf(lower) !== -1;
    });
  }

  // Multi-token fallback for longer inputs
  if (matches.length < 3 && lower.length >= 3) {
    var tokens = lower.split(/\s+/);
    QA_SUGGEST_POOL.forEach(function(s) {
      if (matches.indexOf(s) !== -1) return;
      var sLower = s.text.toLowerCase();
      var allMatch = tokens.every(function(t) { return t.length >= 2 && sLower.indexOf(t) !== -1; });
      if (allMatch) matches.push(s);
    });
  }

  // Dedupe and limit
  var seen = {};
  matches = matches.filter(function(m) {
    if (seen[m.text]) return false;
    seen[m.text] = true;
    return true;
  }).slice(0, 5);

  if (matches.length === 0) {
    el.innerHTML = '';
    el.classList.remove('active');
    if (chipsEl) chipsEl.style.display = '';
    return;
  }

  // Hide chips when suggestions are active (Bug C fix)
  if (chipsEl) chipsEl.style.display = 'none';

  var html = '';
  matches.forEach(function(m) {
    html += '<button class="qa-suggest-item qa-chip-' + m.color + '" data-qa-suggest="' + escHtml(m.text) + '">' + escHtml(m.text) + '</button>';
  });
  el.innerHTML = html;
  el.classList.add('active');

  // Event delegation for suggestion taps
  el.querySelectorAll('[data-qa-suggest]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var val = this.getAttribute('data-qa-suggest');
      var input = document.getElementById('qaInput');
      if (input) input.value = val;
      el.innerHTML = '';
      el.classList.remove('active');
      if (chipsEl) chipsEl.style.display = '';
      qaExecuteQuery(val);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// INTELLIGENCE SERVICE LAYER (ISL) — Session A
// Cache, domain data accessors, temporal parsing, day summary
// ═══════════════════════════════════════════════════════════════

const _islCache = {};
const _islDirtyDomains = new Set();
const _islCacheTime = {};

function _islGetCached(cacheKey, domain, computeFn) {
  var ttl = 30000;
  if (!_islDirtyDomains.has(domain) &&
      _islCacheTime[cacheKey] &&
      Date.now() - _islCacheTime[cacheKey] < ttl &&
      _islCache[cacheKey]) {
    return _islCache[cacheKey];
  }
  _islCache[cacheKey] = computeFn();
  _islCacheTime[cacheKey] = Date.now();
  _islDirtyDomains.delete(domain);
  return _islCache[cacheKey];
}

function _islMarkDirty(domain) {
  _islDirtyDomains.add(domain);
  if (domain === 'diet') _qlMealWindowCache = null;
  Object.keys(_islCache).forEach(function(k) {
    if (k.startsWith('summary:') || k.startsWith(domain + ':')) delete _islCache[k];
  });
  Object.keys(_islCacheTime).forEach(function(k) {
    if (k.startsWith('summary:') || k.startsWith(domain + ':')) delete _islCacheTime[k];
  });
}

function _islClearAll() {
  Object.keys(_islCache).forEach(function(k) { delete _islCache[k]; });
  Object.keys(_islCacheTime).forEach(function(k) { delete _islCacheTime[k]; });
  _islDirtyDomains.clear();
}

// ── Step 1: resolveTimeQuery() ──

function resolveTimeQuery(text) {
  var lower = text.toLowerCase().replace(/[?!.,]/g, '').trim();
  var todayStr = today();
  var todayD = new Date(todayStr + 'T12:00:00');

  // "yesterday"
  if (/\byesterday\b/.test(lower)) {
    var yd = new Date(todayD); yd.setDate(yd.getDate() - 1);
    return { start: toDateStr(yd), end: toDateStr(yd), label: 'Yesterday' };
  }

  // "today" / "today so far"
  if (/\btoday\b/.test(lower)) {
    return { start: todayStr, end: todayStr, label: 'Today' };
  }

  // "tomorrow"
  if (/\btomorrow\b/.test(lower)) {
    var tm = new Date(todayD); tm.setDate(tm.getDate() + 1);
    return { start: toDateStr(tm), end: toDateStr(tm), label: 'Tomorrow' };
  }

  // "this week"
  if (/\bthis\s+week\b/.test(lower)) {
    var dow = todayD.getDay(); // 0=Sun
    var monOff = dow === 0 ? -6 : 1 - dow;
    var wkStart = new Date(todayD); wkStart.setDate(wkStart.getDate() + monOff);
    return { start: toDateStr(wkStart), end: todayStr, label: 'This Week' };
  }

  // "last week" / "previous week"
  if (/\b(last|previous)\s+week\b/.test(lower)) {
    var dow2 = todayD.getDay();
    var monOff2 = dow2 === 0 ? -6 : 1 - dow2;
    var thisMonday = new Date(todayD); thisMonday.setDate(thisMonday.getDate() + monOff2);
    var lwEnd = new Date(thisMonday); lwEnd.setDate(lwEnd.getDate() - 1);
    var lwStart = new Date(lwEnd); lwStart.setDate(lwStart.getDate() - 6);
    return { start: toDateStr(lwStart), end: toDateStr(lwEnd), label: 'Last Week' };
  }

  // "this month"
  if (/\bthis\s+month\b/.test(lower)) {
    var mStart = todayStr.substring(0, 8) + '01';
    return { start: mStart, end: todayStr, label: 'This Month' };
  }

  // "last month" / "previous month"
  if (/\b(last|previous)\s+month\b/.test(lower)) {
    var lmd = new Date(todayD.getFullYear(), todayD.getMonth() - 1, 1);
    var lme = new Date(todayD.getFullYear(), todayD.getMonth(), 0);
    return { start: toDateStr(lmd), end: toDateStr(lme), label: 'Last Month' };
  }

  // "last N days" / "past N days"
  var lastN = lower.match(/\b(?:last|past)\s+(\d+)\s+days?\b/);
  if (lastN) {
    var n = parseInt(lastN[1], 10);
    if (n > 0 && n <= 90) {
      var ns = new Date(todayD); ns.setDate(ns.getDate() - n + 1);
      return { start: toDateStr(ns), end: todayStr, label: 'Last ' + n + ' days' };
    }
  }

  // "N days ago"
  var daysAgo = lower.match(/\b(\d+)\s+days?\s+ago\b/);
  if (daysAgo) {
    var ago = parseInt(daysAgo[1], 10);
    if (ago > 0 && ago <= 90) {
      var ad = new Date(todayD); ad.setDate(ad.getDate() - ago);
      return { start: toDateStr(ad), end: toDateStr(ad), label: ago + ' days ago' };
    }
  }

  // Day names: "monday", "tuesday" etc. → most recent past occurrence
  var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (var di = 0; di < dayNames.length; di++) {
    var dayRx = new RegExp('\\b' + dayNames[di] + '\\b');
    if (dayRx.test(lower)) {
      var targetDay = di;
      var diff = (todayD.getDay() - targetDay + 7) % 7;
      if (diff === 0) diff = 7; // "monday" on Monday = last Monday
      var dd = new Date(todayD); dd.setDate(dd.getDate() - diff);
      var lbl = dayNames[di].charAt(0).toUpperCase() + dayNames[di].slice(1);
      return { start: toDateStr(dd), end: toDateStr(dd), label: lbl };
    }
  }

  // Specific date: "march 20", "april 5", "mar 15" — check BEFORE bare month names
  var monthShort = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var dateMatch = lower.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/);
  if (dateMatch) {
    var mIdx = -1;
    for (var si = 0; si < monthShort.length; si++) {
      if (dateMatch[1].startsWith(monthShort[si])) { mIdx = si; break; }
    }
    if (mIdx >= 0) {
      var dayNum = parseInt(dateMatch[2], 10);
      var sdYear = todayD.getFullYear();
      var sd = new Date(sdYear, mIdx, dayNum);
      if (toDateStr(sd) > todayStr) sd = new Date(sdYear - 1, mIdx, dayNum);
      var sdStr = toDateStr(sd);
      var sdLabel = sd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return { start: sdStr, end: sdStr, label: sdLabel };
    }
  }

  // Month names: "march", "february" etc. → that month in current or previous year
  // Guard: "may" and "march" are ambiguous (modal verb / action verb).
  // Require temporal context for these: preceded by "in/last/this/during/since/how was" or query ≤3 words.
  var monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  var ambiguousMonths = { 'may': true, 'march': true };
  for (var mi = 0; mi < monthNames.length; mi++) {
    var mRx = new RegExp('\\b' + monthNames[mi] + '\\b');
    if (mRx.test(lower)) {
      if (ambiguousMonths[monthNames[mi]]) {
        var hasCtx = /\b(in|last|this|during|since|before|after|how was|what happened|how about)\b/.test(lower);
        var isShort = lower.split(/\s+/).length <= 3;
        if (!hasCtx && !isShort) continue; // skip — likely verb/modal usage
      }
      var yr = mi <= todayD.getMonth() ? todayD.getFullYear() : todayD.getFullYear() - 1;
      var msD = new Date(yr, mi, 1);
      var meD = new Date(yr, mi + 1, 0);
      // If future month in current year, use previous year
      if (toDateStr(msD) > todayStr) {
        msD = new Date(yr - 1, mi, 1);
        meD = new Date(yr - 1, mi + 1, 0);
      }
      var endCap = toDateStr(meD) > todayStr ? todayStr : toDateStr(meD);
      var mLabel = monthNames[mi].charAt(0).toUpperCase() + monthNames[mi].slice(1);
      return { start: toDateStr(msD), end: endCap, label: mLabel };
    }
  }

  return null;
}

// ── Step 2: getDomainData('sleep') ──

function getDomainData(domain, startDate, endDate) {
  var cacheKey = domain + ':' + startDate + ':' + endDate;
  return _islGetCached(cacheKey, domain, function() {
    if (domain === 'sleep') return _islSleepData(startDate, endDate);
    if (domain === 'diet') return _islDietData(startDate, endDate);
    if (domain === 'poop') return _islPoopData(startDate, endDate);
    if (domain === 'medical') return _islMedicalData(startDate, endDate);
    if (domain === 'milestones') return _islMilestoneData(startDate, endDate);
    if (domain === 'activities') return _islActivityData(startDate, endDate);
    return {};
  });
}

function _islDateRange(startDate, endDate) {
  var dates = [];
  var cur = new Date(startDate + 'T12:00:00');
  var end = new Date(endDate + 'T12:00:00');
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function _islSleepData(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var nights = [];
  var naps = [];
  var totalNightMin = 0;
  var totalNapMin = 0;
  var nightScores = [];

  dates.forEach(function(ds) {
    var dayEntries = sleepData.filter(function(s) { return s.date === ds; });
    dayEntries.forEach(function(s) {
      var dur = calcSleepDuration(s.bedtime, s.wakeTime);
      if (s.type === 'night') {
        nights.push({ date: ds, bedtime: s.bedtime, wakeTime: s.wakeTime, duration: dur.total, wakeUps: getWakeCount(s) });
        totalNightMin += dur.total;
      } else {
        naps.push({ date: ds, start: s.bedtime, end: s.wakeTime, duration: dur.total, napType: s.napType || classifyNapType(s.bedtime) });
        totalNapMin += dur.total;
      }
    });
    var sc = getDailySleepScore(ds);
    if (sc) nightScores.push(sc.score);
  });

  var avgNightMin = nights.length > 0 ? Math.round(totalNightMin / nights.length) : 0;
  var avgNapMin = naps.length > 0 ? Math.round(totalNapMin / Math.max(1, dates.filter(function(ds) { return naps.some(function(n) { return n.date === ds; }); }).length)) : 0;

  return {
    nights: nights,
    naps: naps,
    totalNightMin: totalNightMin,
    totalNapMin: totalNapMin,
    avgNightMin: avgNightMin,
    avgNapMin: avgNapMin,
    avgNightScore: nightScores.length > 0 ? Math.round(nightScores.reduce(function(a, b) { return a + b; }, 0) / nightScores.length) : null,
    dayCount: dates.length,
    daysWithData: nights.length
  };
}

// ── Step 3: getDomainData('diet') ──

function _islDietData(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var days = [];
  var totalMeals = 0;
  var totalIntake = 0;
  var intakeCount = 0;
  var dietScores = [];
  var allFoods = new Set();

  dates.forEach(function(ds) {
    var entry = feedingData[ds];
    var meals = { breakfast: null, lunch: null, dinner: null, snack: null };
    var mealTimes = {};
    var mealCount = 0;
    if (entry) {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(m) {
        if (isRealMeal(entry[m])) {
          meals[m] = entry[m];
          mealCount++;
          if (m !== 'snack') {
            var intk = _miGetIntake(ds, m);
            totalIntake += intk;
            intakeCount++;
          }
          // Extract food names
          (entry[m] || '').split(',').forEach(function(f) {
            var t = f.trim().toLowerCase();
            if (t && t !== SKIPPED_MEAL) allFoods.add(t);
          });
        }
        if (entry[m + '_time']) mealTimes[m] = entry[m + '_time'];
      });
    }
    totalMeals += mealCount;
    days.push({ date: ds, meals: meals, mealTimes: mealTimes, mealCount: mealCount });
    var sc = calcDietScore(ds);
    if (sc && mealCount > 0) dietScores.push(sc.score);
  });

  var daysFullyLogged = days.filter(function(d) { return d.mealCount >= 3; }).length;

  return {
    days: days,
    totalMeals: totalMeals,
    avgMealsPerDay: dates.length > 0 ? +(totalMeals / dates.length).toFixed(1) : 0,
    avgIntake: intakeCount > 0 ? Math.round((totalIntake / intakeCount) * 100) : null,
    avgDietScore: dietScores.length > 0 ? Math.round(dietScores.reduce(function(a, b) { return a + b; }, 0) / dietScores.length) : null,
    daysFullyLogged: daysFullyLogged,
    uniqueFoods: allFoods.size,
    allFoods: Array.from(allFoods),
    dayCount: dates.length,
    daysWithData: days.filter(function(d) { return d.mealCount > 0; }).length
  };
}

// ── Step 4: getDomainData('poop') ──

function _islPoopData(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var entries = [];
  var poopScores = [];

  dates.forEach(function(ds) {
    var dayPoops = getPoopsForDate(ds);
    dayPoops.forEach(function(p) {
      entries.push({ date: ds, time: p.time, consistency: p.consistency, color: p.color, blood: p.blood, mucus: p.mucus, notes: p.notes });
    });
    var sc = calcPoopScore(ds);
    if (sc && !sc.isCarryForward) poopScores.push(sc.score);
  });

  var totalCount = entries.length;
  var daysWithPoop = new Set(entries.map(function(e) { return e.date; })).size;
  var consistencies = {};
  entries.forEach(function(e) {
    if (e.consistency) consistencies[e.consistency] = (consistencies[e.consistency] || 0) + 1;
  });
  var mostCommon = Object.keys(consistencies).sort(function(a, b) { return consistencies[b] - consistencies[a]; })[0] || null;

  return {
    entries: entries,
    totalCount: totalCount,
    avgPerDay: dates.length > 0 ? +(totalCount / dates.length).toFixed(1) : 0,
    daysWithPoop: daysWithPoop,
    mostCommonConsistency: mostCommon,
    consistencyBreakdown: consistencies,
    avgPoopScore: poopScores.length > 0 ? Math.round(poopScores.reduce(function(a, b) { return a + b; }, 0) / poopScores.length) : null,
    hasBlood: entries.some(function(e) { return e.blood; }),
    hasMucus: entries.some(function(e) { return e.mucus; }),
    dayCount: dates.length,
    daysWithData: daysWithPoop
  };
}

// ── Step 5: getDomainData('medical') ──

function _islMedicalData(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var activeMeds = (meds || []).filter(function(m) { return m.active !== false; });
  var suppDays = 0;
  var suppTotal = 0;
  var d3Times = [];

  dates.forEach(function(ds) {
    var dayChecks = medChecks[ds];
    if (dayChecks) {
      var anyDone = false;
      Object.keys(dayChecks).forEach(function(name) {
        var val = dayChecks[name];
        if (typeof val === 'string' && val.startsWith('done')) {
          anyDone = true;
          // Extract D3 time
          if (/d3|vitamin d/i.test(name)) {
            var timePart = val.replace('done:', '').replace('done', '');
            if (timePart) d3Times.push(timePart);
          }
        }
      });
      if (anyDone) suppDays++;
    }
    suppTotal++;
  });

  // Vaccination status
  var completed = vaccData.filter(function(v) { return !v.upcoming; });
  var upcoming = vaccData.filter(function(v) { return v.upcoming; }).sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });

  // Growth — latest in range
  var rangeGrowth = growthData.filter(function(g) { return g.date >= startDate && g.date <= endDate; });

  // Illness episodes in range
  var illnessEps = [];
  ['feverEpisodes', 'diarrhoeaEpisodes', 'vomitingEpisodes', 'coldEpisodes'].forEach(function(key) {
    var eps = load(KEYS[key], []);
    if (Array.isArray(eps)) {
      eps.forEach(function(ep) {
        if (ep.startedAt && ep.startedAt.substring(0, 10) >= startDate && ep.startedAt.substring(0, 10) <= endDate) {
          illnessEps.push({ type: key.replace('Episodes', ''), started: ep.startedAt, resolved: ep.resolvedAt || null });
        }
      });
    }
  });

  var medScore = calcMedicalScore();

  return {
    suppAdherence: suppTotal > 0 ? Math.round((suppDays / suppTotal) * 100) : null,
    suppDays: suppDays,
    suppTotal: suppTotal,
    d3Times: d3Times,
    vaccCompleted: completed.length,
    vaccUpcoming: upcoming.length > 0 ? upcoming[0] : null,
    growthInRange: rangeGrowth,
    illnessEpisodes: illnessEps,
    avgMedicalScore: medScore ? medScore.score : null,
    dayCount: dates.length,
    daysWithData: suppDays
  };
}

// ── Step 6: getDomainData('milestones') ──

function _islMilestoneData(startDate, endDate) {
  var progressed = [];
  var regressed = [];
  var active = [];

  (milestones || []).forEach(function(m) {
    // Check for progression in range
    ['masteredAt', 'consistentAt', 'practicingAt', 'emergingAt'].forEach(function(field) {
      if (m[field]) {
        var d = m[field].substring(0, 10);
        if (d >= startDate && d <= endDate) {
          progressed.push({ text: m.text, status: m.status, date: d, cat: m.cat });
        }
      }
    });
    // Active milestones
    if (['emerging', 'practicing', 'consistent'].includes(m.status)) {
      active.push({ text: m.text, status: m.status, cat: m.cat });
    }
  });

  // Activity evidence in range
  var activityEvidence = 0;
  var dates = _islDateRange(startDate, endDate);
  dates.forEach(function(ds) {
    if (Array.isArray(activityLog[ds])) {
      activityLog[ds].forEach(function(e) {
        if (e.evidence && e.evidence.length > 0) activityEvidence++;
      });
    }
  });

  var msScore = calcMilestoneScore();

  return {
    progressed: progressed,
    regressed: regressed,
    active: active,
    activityEvidence: activityEvidence,
    avgMilestoneScore: msScore ? msScore.score : null,
    dayCount: dates.length,
    daysWithData: progressed.length > 0 ? 1 : 0
  };
}

// ── Step 7: getDomainData('activities') ──

function _islActivityData(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var entries = [];
  var totalDuration = 0;

  dates.forEach(function(ds) {
    if (Array.isArray(activityLog[ds])) {
      activityLog[ds].forEach(function(e) {
        entries.push({ date: ds, text: e.text, ts: e.ts, duration: e.duration || 0, type: e.type, domains: e.domains || [] });
        totalDuration += (e.duration || 0);
      });
    }
  });

  var daysWithActivity = new Set(entries.map(function(e) { return e.date; })).size;

  return {
    entries: entries,
    totalCount: entries.length,
    totalDuration: totalDuration,
    avgPerDay: dates.length > 0 ? +(entries.length / dates.length).toFixed(1) : 0,
    daysWithActivity: daysWithActivity,
    dayCount: dates.length,
    daysWithData: daysWithActivity
  };
}

// ── Step 9: generateDaySummary() + ISL_THRESHOLDS ──

var ISL_THRESHOLDS = {
  GOOD_NIGHT_DURATION_MIN: 600,
  BEDTIME_DRIFT_WARN_MIN: 45,
  FULL_DAY_MEALS: 3,
  FULL_WEEK_PCT: 0.7,
  NUTRIENT_GAP_WARN: 2,
  D3_ADHERENCE_GOOD_PCT: 90
};

function generateDaySummary(dateStr) {
  dateStr = dateStr || today();
  var cacheKey = 'summary:day:' + dateStr;
  return _islGetCached(cacheKey, 'summary', function() {
    return _islBuildDaySummary(dateStr);
  });
}

function _islBuildDaySummary(dateStr) {
  var sl = getDomainData('sleep', dateStr, dateStr);
  var dt = getDomainData('diet', dateStr, dateStr);
  var pp = getDomainData('poop', dateStr, dateStr);
  var md = getDomainData('medical', dateStr, dateStr);
  var ms = getDomainData('milestones', dateStr, dateStr);
  var ac = getDomainData('activities', dateStr, dateStr);

  // Count events
  var events = sl.nights.length + sl.naps.length + dt.totalMeals + pp.totalCount + ac.totalCount;

  // Scores
  var sleepScore = sl.avgNightScore;
  var dietScore = dt.avgDietScore;
  var poopScore = pp.avgPoopScore;
  var medicalScore = md.avgMedicalScore;
  var milestoneScore = ms.avgMilestoneScore;
  var scores = { sleep: sleepScore, diet: dietScore, poop: poopScore, medical: medicalScore, milestones: milestoneScore, overall: null };
  var validScores = [sleepScore, dietScore, poopScore, medicalScore, milestoneScore].filter(function(s) { return s !== null; });
  scores.overall = validScores.length > 0 ? Math.round(validScores.reduce(function(a, b) { return a + b; }, 0) / validScores.length) : null;

  // Generate highlights and concerns
  var result = _islGenerateHighlights(sl, dt, pp, md, ms, ac, dateStr);

  // Meal summary
  var dayEntry = feedingData[dateStr] || {};
  var meals = {
    breakfast: isRealMeal(dayEntry.breakfast) ? dayEntry.breakfast : null,
    lunch: isRealMeal(dayEntry.lunch) ? dayEntry.lunch : null,
    dinner: isRealMeal(dayEntry.dinner) ? dayEntry.dinner : null,
    snack: isRealMeal(dayEntry.snack) ? dayEntry.snack : null
  };

  // Sleep summary string
  var sleepSummary = 'No sleep data';
  if (sl.nights.length > 0 || sl.naps.length > 0) {
    var parts = [];
    if (sl.nights.length > 0) {
      var nh = Math.floor(sl.avgNightMin / 60);
      var nm = sl.avgNightMin % 60;
      parts.push(nh + 'h ' + nm + 'm night');
    }
    if (sl.naps.length > 0) {
      parts.push(sl.naps.length + ' nap' + (sl.naps.length !== 1 ? 's' : ''));
    }
    sleepSummary = parts.join(' + ');
  }

  // Poop summary string
  var poopSummary = 'No poop data';
  if (pp.totalCount > 0) {
    poopSummary = pp.totalCount + ' poop' + (pp.totalCount !== 1 ? 's' : '');
    if (pp.mostCommonConsistency) poopSummary += ' · ' + pp.mostCommonConsistency;
  }

  // Activity summary string
  var activitySummary = 'No activities';
  if (ac.totalCount > 0) {
    var actTexts = ac.entries.slice(0, 3).map(function(e) { return e.text; });
    activitySummary = actTexts.join(', ');
    if (ac.totalCount > 3) activitySummary += ' +' + (ac.totalCount - 3) + ' more';
  }

  // Label
  var dateD = new Date(dateStr + 'T12:00:00');
  var dayLabel = dateD.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  var tStr = today();
  var label = dateStr === tStr ? 'Today (' + dayLabel + ')' : dayLabel;
  if (dateStr === _islYesterday()) label = 'Yesterday (' + dayLabel + ')';

  return {
    date: dateStr,
    label: label,
    events: events,
    scores: scores,
    highlights: result.highlights,
    concerns: result.concerns,
    meals: meals,
    sleepSummary: sleepSummary,
    poopSummary: poopSummary,
    activitySummary: activitySummary
  };
}

function _islYesterday() {
  var d = new Date(); d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

function _islGenerateHighlights(sl, dt, pp, md, ms, ac, dateStr) {
  var highlights = [];
  var concerns = [];

  // Sleep highlights
  if (sl.nights.length > 0) {
    if (sl.avgNightMin >= ISL_THRESHOLDS.GOOD_NIGHT_DURATION_MIN) {
      var sh = Math.floor(sl.avgNightMin / 60);
      var sm = sl.avgNightMin % 60;
      highlights.push({ domain: 'sleep', text: sh + 'h ' + sm + 'm night sleep — above target', signal: 'good' });
    } else if (sl.avgNightMin > 0) {
      var sh2 = Math.floor(sl.avgNightMin / 60);
      var sm2 = sl.avgNightMin % 60;
      concerns.push({ domain: 'sleep', text: sh2 + 'h ' + sm2 + 'm night sleep — below 10h target', signal: 'warn' });
    }
    // Bedtime drift check (vs 7d avg)
    if (sl.nights[0] && sl.nights[0].bedtime) {
      var avg7 = getAvgSleep7d();
      var avgBedtime7 = _islAvgBedtime7d();
      if (avgBedtime7 !== null) {
        var bedParts = sl.nights[0].bedtime.split(':').map(Number);
        var bedMin = bedParts[0] * 60 + bedParts[1];
        if (bedParts[0] < 6) bedMin += 24 * 60;
        var drift = bedMin - avgBedtime7;
        if (Math.abs(drift) >= ISL_THRESHOLDS.BEDTIME_DRIFT_WARN_MIN) {
          concerns.push({ domain: 'sleep', text: 'Bedtime ' + sl.nights[0].bedtime + ' — ' + Math.abs(drift) + ' min ' + (drift > 0 ? 'later' : 'earlier') + ' than avg', signal: 'warn' });
        }
      }
    }
  }

  // Diet highlights
  var coreMeals = [dt.days[0]].filter(function(d) { return d; }).reduce(function(count, d) { return d.mealCount >= 3 ? 3 : d.mealCount; }, 0);
  if (dt.days.length > 0 && dt.days[0]) coreMeals = dt.days[0].mealCount;
  if (coreMeals >= ISL_THRESHOLDS.FULL_DAY_MEALS) {
    var mealTexts = [];
    var dayMeals = dt.days[0] ? dt.days[0].meals : {};
    if (dayMeals.breakfast) mealTexts.push(dayMeals.breakfast);
    if (dayMeals.lunch) mealTexts.push(dayMeals.lunch);
    if (dayMeals.dinner) mealTexts.push(dayMeals.dinner);
    highlights.push({ domain: 'diet', text: 'All 3 meals logged' + (mealTexts.length > 0 ? ' — ' + mealTexts.join(', ') : ''), signal: 'good' });
  } else if (coreMeals > 0) {
    concerns.push({ domain: 'diet', text: coreMeals + '/3 meals logged', signal: 'warn' });
  }

  // Poop highlights
  if (pp.totalCount > 0) {
    if (!pp.hasBlood && !pp.hasMucus && pp.mostCommonConsistency && ['normal', 'soft'].includes(pp.mostCommonConsistency)) {
      highlights.push({ domain: 'poop', text: pp.totalCount + ' poop' + (pp.totalCount !== 1 ? 's' : '') + ' · ' + pp.mostCommonConsistency, signal: 'good' });
    } else if (pp.hasBlood) {
      concerns.push({ domain: 'poop', text: 'Blood in stool detected — consult pediatrician', signal: 'action' });
    } else if (pp.hasMucus) {
      concerns.push({ domain: 'poop', text: 'Mucus in stool — monitor', signal: 'warn' });
    }
  }

  // Medical highlights — D3 adherence
  if (md.suppTotal > 0) {
    if (md.suppDays > 0) {
      highlights.push({ domain: 'medical', text: 'Vit D3 given' + (md.d3Times.length > 0 ? ' at ' + md.d3Times[0] : ''), signal: 'good' });
    } else {
      concerns.push({ domain: 'medical', text: 'Vit D3 missed', signal: 'warn' });
    }
  }

  // Milestone highlights
  if (ms.progressed.length > 0) {
    ms.progressed.forEach(function(p) {
      highlights.push({ domain: 'milestones', text: p.text + ' — ' + p.status, signal: 'good' });
    });
  }

  // Activity highlights
  if (ac.totalCount > 0) {
    highlights.push({ domain: 'activities', text: ac.totalCount + ' activit' + (ac.totalCount !== 1 ? 'ies' : 'y') + ' logged' + (ac.totalDuration > 0 ? ' (' + ac.totalDuration + ' min)' : ''), signal: 'good' });
  }

  return { highlights: highlights, concerns: concerns };
}

function _islAvgBedtime7d() {
  var totalMin = 0;
  var count = 0;
  for (var i = 1; i <= 7; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var dayNights = sleepData.filter(function(s) { return s.date === ds && s.type === 'night' && s.bedtime; });
    if (dayNights.length > 0) {
      var parts = dayNights[0].bedtime.split(':').map(Number);
      var min = parts[0] * 60 + parts[1];
      if (parts[0] < 6) min += 24 * 60;
      totalMin += min;
      count++;
    }
  }
  return count > 0 ? Math.round(totalMin / count) : null;
}

// ── Step 10: Domain detection helper ──

function _qaDetectDomain(text) {
  if (/sleep|nap|night|bedtime|wake/.test(text)) return 'sleep';
  if (/eat|ate|meal|food|breakfast|lunch|dinner|snack|feed|fed/.test(text)) return 'diet';
  if (/poop|diaper|stool|potty/.test(text)) return 'poop';
  if (/activity|play|tummy|exercise/.test(text)) return 'activities';
  if (/vaccine|vacc|shot|d3|vitamin|supplement|medicine/.test(text)) return 'medical';
  if (/milestone|crawl|stand|walk|talk|babbl/.test(text)) return 'milestones';
  return null;
}

// Domain → color mapping for answer cards
var ISL_DOMAIN_COLOR = {
  sleep: 'indigo',
  diet: 'peach',
  poop: 'amber',
  medical: 'sky',
  milestones: 'lav',
  activities: 'sage'
};

// Domain → icon mapping
var ISL_DOMAIN_ICON = {
  sleep: 'moon',
  diet: 'bowl',
  poop: 'diaper',
  medical: 'pill',
  milestones: 'star',
  activities: 'run'
};

// ── Step 13: generateRangeSummary() ──

function generateRangeSummary(startDate, endDate) {
  var cacheKey = 'summary:range:' + startDate + ':' + endDate;
  return _islGetCached(cacheKey, 'summary', function() {
    return _islBuildRangeSummary(startDate, endDate);
  });
}

function _islBuildRangeSummary(startDate, endDate) {
  var dates = _islDateRange(startDate, endDate);
  var dayCount = dates.length;

  // Gather domain data for full range
  var sl = getDomainData('sleep', startDate, endDate);
  var dt = getDomainData('diet', startDate, endDate);
  var pp = getDomainData('poop', startDate, endDate);
  var md = getDomainData('medical', startDate, endDate);
  var ms = getDomainData('milestones', startDate, endDate);
  var ac = getDomainData('activities', startDate, endDate);

  // Avg scores from day summaries
  var scoreArr = [];
  var allHighlights = [];
  var allConcerns = [];
  dates.forEach(function(ds) {
    var sum = generateDaySummary(ds);
    if (sum.scores.overall !== null) scoreArr.push(sum.scores.overall);
    sum.highlights.forEach(function(h) { allHighlights.push(h); });
    sum.concerns.forEach(function(c) { allConcerns.push(c); });
  });

  var avgOverall = scoreArr.length > 0 ? Math.round(scoreArr.reduce(function(a, b) { return a + b; }, 0) / scoreArr.length) : null;

  // Domain avg scores
  var avgScores = {
    sleep: sl.avgNightScore,
    diet: dt.avgDietScore !== undefined ? dt.avgDietScore : null,
    poop: pp.avgPoopScore !== undefined ? pp.avgPoopScore : null,
    medical: md.avgMedicalScore !== undefined ? md.avgMedicalScore : null,
    milestones: ms.avgMilestoneScore !== undefined ? ms.avgMilestoneScore : null,
    overall: avgOverall
  };

  // Patterns — meal/nap/poop text summaries
  var mealPattern = dt.totalMeals > 0 ? (dt.daysFullyLogged + '/' + dayCount + ' days fully logged, ' + dt.uniqueFoods + ' unique foods') : 'No meals logged';
  var napPattern = sl.naps.length > 0 ? (sl.naps.length + ' naps total, avg ' + Math.floor(sl.avgNapMin / 60) + 'h ' + (sl.avgNapMin % 60) + 'm/day') : 'No naps logged';
  var poopPattern = pp.totalCount > 0 ? (pp.avgPerDay + '/day avg, mostly ' + (pp.mostCommonConsistency || 'normal')) : 'No poops logged';

  // Milestone progress
  var milestoneProgress = ms.progressed.map(function(p) {
    return { text: p.text, from: '', to: p.status };
  });

  // New foods (unique foods introduced in this range that weren't in prior 30 days)
  var newFoods = [];
  if (dt.days) {
    var rangeSet = {};
    dt.days.forEach(function(day) {
      var m = day.meals;
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(slot) {
        if (m[slot]) {
          m[slot].split(',').forEach(function(f) {
            var base = _baseFoodName(f.trim().toLowerCase());
            if (base) rangeSet[base] = true;
          });
        }
      });
    });
    // Check which were new (first appearance in this range)
    var priorStart = _offsetDateStr(startDate, -30);
    var priorEnd = _offsetDateStr(startDate, -1);
    var priorDt = getDomainData('diet', priorStart, priorEnd);
    var priorSet = {};
    if (priorDt.days) {
      priorDt.days.forEach(function(day) {
        var m = day.meals;
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(slot) {
          if (m[slot]) {
            m[slot].split(',').forEach(function(f) {
              var base = _baseFoodName(f.trim().toLowerCase());
              if (base) priorSet[base] = true;
            });
          }
        });
      });
    }
    Object.keys(rangeSet).forEach(function(base) {
      if (!priorSet[base]) newFoods.push(base);
    });
  }

  var topHighlights = _islDedupeItems(allHighlights).slice(0, 5);
  var topConcerns = _islDedupeItems(allConcerns).slice(0, 4);

  return {
    range: { start: startDate, end: endDate },
    label: _islShortDate(startDate) + ' \u2013 ' + _islShortDate(endDate),
    dayCount: dayCount,
    avgScores: avgScores,
    highlights: topHighlights,
    concerns: topConcerns,
    patterns: { meals: mealPattern, naps: napPattern, poop: poopPattern },
    milestoneProgress: milestoneProgress,
    newFoods: newFoods
  };
}

// ═══ END ISL ═══

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
    var text = (idx === 0 ? '\u2605 ' : '') + comboDisplay;
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
  var signalIcons = { good: zi('check'), warn: zi('warn'), action: '→', info: zi('info'), neutral: '·' };
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

// ═══ HANDLER HELPERS ═══

// ── SESSION B: LOOKBACK HANDLER ──

function _qaHandleLookback(classified) {
  var lower = classified.raw.toLowerCase().replace(/[?!.,]/g, '').trim();

  // Food lookback (BN-1: compound name matching first, then individual tokens)
  if (classified.subtype === 'food') {
    return _qaFoodLookback(classified.foodQuery);
  }

  // Domain-specific lookback
  if (/\blast\s+(poop|diaper)\b/.test(lower)) return _qaLastPoop();
  if (/\blast\s+(nap)\b/.test(lower)) return _qaLastNap();
  if (/\blast\s+(vaccine|vacc|shot)\b/.test(lower)) return _qaLastVaccine();
  if (/\blast\s+(sick|fever|ill)\b/.test(lower) || /when.*last.*sick/.test(lower)) return _qaLastIllness();
  if (/\blast\s+(sleep|night)\b/.test(lower)) return _qaLastSleep();

  // Generic "when did she last" — try to detect from remaining tokens
  var stripped = lower.replace(/when|did|she|last|time|the/g, '').trim();
  if (/eat|ate|had|fed/.test(stripped)) return _qaFoodLookback(stripped.replace(/eat|ate|had|fed/g, '').trim());
  if (/poop|diaper/.test(stripped)) return _qaLastPoop();
  if (/nap/.test(stripped)) return _qaLastNap();
  if (/sleep/.test(stripped)) return _qaLastSleep();

  return null;
}

function _qaFoodLookback(foodQuery) {
  if (!foodQuery || foodQuery.trim().length === 0) {
    return { title: 'Food Lookback', headline: 'What food are you looking for?', icon: 'scope', domain: 'peach', sections: [], dataGap: 'Try: "When did she last eat ragi?" or "Last time she had dal rice"' };
  }

  var query = foodQuery.trim().toLowerCase();
  var todayD = new Date(today());
  var bestMatch = null;
  var bestDate = null;
  var bestMeal = null;
  var bestMealText = null;

  // BN-1: Try compound name first ("dal rice"), then individual tokens
  var searchTerms = [query];
  var tokens = query.split(/\s+/).filter(function(t) { return t.length > 1; });
  if (tokens.length > 1) {
    tokens.forEach(function(t) { searchTerms.push(t); });
  }

  for (var i = 0; i < 90 && !bestMatch; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var entry = feedingData[ds];
    if (!entry) continue;

    var meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (var mi = 0; mi < meals.length; mi++) {
      var mealStr = entry[meals[mi]];
      if (!mealStr || typeof mealStr !== 'string') continue;
      var mealLower = mealStr.toLowerCase();

      for (var si = 0; si < searchTerms.length; si++) {
        if (mealLower.indexOf(searchTerms[si]) !== -1) {
          bestMatch = searchTerms[si];
          bestDate = ds;
          bestMeal = meals[mi];
          bestMealText = mealStr;
          break;
        }
      }
      if (bestMatch) break;
    }
  }

  if (!bestMatch) {
    return { title: 'Food Lookback', headline: 'No record of "' + query + '" in the last 90 days', icon: 'scope', domain: 'peach', sections: [], dataGap: 'This food hasn\'t been logged recently.' };
  }

  var daysAgo = Math.round((todayD - new Date(bestDate)) / 86400000);
  var daysAgoText = daysAgo === 0 ? 'Today' : (daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago');
  var mealLabel = bestMeal.charAt(0).toUpperCase() + bestMeal.slice(1);
  var intake = _miGetIntake(bestDate, bestMeal);
  var intakeText = intake >= 0.9 ? 'Most' : (intake >= 0.5 ? 'Some' : (intake >= 0.25 ? 'Little' : 'Unknown'));

  // Count occurrences in last 30 days
  var count30 = 0;
  for (var j = 0; j < 30; j++) {
    var d2 = new Date(todayD); d2.setDate(d2.getDate() - j);
    var ds2 = toDateStr(d2);
    var e2 = feedingData[ds2];
    if (!e2) continue;
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(m) {
      if (e2[m] && e2[m].toLowerCase().indexOf(bestMatch) !== -1) count30++;
    });
  }

  var items = [
    { text: formatDate(bestDate) + ' \u2014 ' + mealLabel, signal: 'neutral' },
    { text: bestMealText, signal: 'neutral' },
    { text: 'Intake: ' + intakeText + ' \u00b7 ' + daysAgoText, signal: 'info' }
  ];
  if (count30 > 0) {
    var acceptance = getFoodAcceptanceRate(_baseFoodName(bestMatch));
    var accText = acceptance >= 0.85 ? 'loves it' : (acceptance >= 0.6 ? 'likes it' : (acceptance >= 0.4 ? 'sometimes' : 'limited'));
    items.push({ text: 'Served ' + count30 + ' time' + (count30 !== 1 ? 's' : '') + ' in last 30 days \u2014 ' + accText, signal: acceptance >= 0.6 ? 'good' : 'warn' });
  }

  return {
    title: 'Last time she had ' + bestMatch,
    headline: daysAgoText,
    icon: 'scope',
    domain: 'peach',
    sections: [{ label: 'Details', icon: zi('bowl'), items: items }]
  };
}

function _qaLastPoop() {
  // Scan poopData directly for latest entry (sorted by date desc, then time desc)
  var sorted = (poopData || []).filter(function(p) { return p.date; }).sort(function(a, b) {
    var dc = b.date.localeCompare(a.date);
    if (dc !== 0) return dc;
    return (b.time || '').localeCompare(a.time || '');
  });
  if (sorted.length === 0) return { title: 'Last Poop', headline: 'No poops logged', icon: 'scope', domain: 'amber', sections: [] };

  var e = sorted[0];
  var daysAgo = Math.round((new Date(today() + 'T12:00:00') - new Date(e.date + 'T12:00:00')) / 86400000);
  var daysText = daysAgo === 0 ? 'Today' : (daysAgo === 1 ? 'Yesterday' : daysAgo + ' days ago');
  var items = [
    { text: formatDate(e.date) + (e.time ? ' at ' + formatTimeShort(e.time) : ''), signal: 'neutral' },
    { text: 'Consistency: ' + (e.consistency || 'Not recorded'), signal: ['normal', 'soft'].indexOf(e.consistency) !== -1 ? 'good' : 'warn' }
  ];
  if (e.color) items.push({ text: 'Color: ' + e.color, signal: 'neutral' });
  if (e.blood) items.push({ text: 'Blood noted', signal: 'action' });

  return { title: 'Last Poop', headline: daysText, icon: 'scope', domain: 'amber', sections: [{ label: 'Details', icon: zi('diaper'), items: items }] };
}

function _qaLastNap() {
  for (var i = 0; i < 7; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var naps = (sleepData || []).filter(function(s) { return s.date === ds && s.type === 'nap'; });
    if (naps.length > 0) {
      var n = naps[0];
      var dur = calcSleepDuration(n.bedtime, n.wakeTime);
      var daysText = i === 0 ? 'Today' : (i === 1 ? 'Yesterday' : i + ' days ago');
      return {
        title: 'Last Nap', headline: daysText, icon: 'scope', domain: 'lav',
        sections: [{ label: 'Details', icon: zi('zzz'), items: [
          { text: formatDate(ds) + ' \u00b7 ' + formatTimeShort(n.bedtime) + ' \u2013 ' + formatTimeShort(n.wakeTime), signal: 'neutral' },
          { text: 'Duration: ' + Math.floor(dur.total / 60) + 'h ' + (dur.total % 60) + 'm', signal: dur.total >= 45 ? 'good' : 'warn' }
        ]}]
      };
    }
  }
  return { title: 'Last Nap', headline: 'No naps logged in last 7 days', icon: 'scope', domain: 'lav', sections: [] };
}

function _qaLastSleep() {
  for (var i = 0; i < 7; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var nights = (sleepData || []).filter(function(s) { return s.date === ds && s.type === 'night' && s.bedtime; });
    if (nights.length > 0) {
      var n = nights[0];
      var dur = calcSleepDuration(n.bedtime, n.wakeTime);
      var daysText = i === 0 ? 'Last night' : (i === 1 ? '2 nights ago' : i + ' nights ago');
      return {
        title: 'Last Night Sleep', headline: daysText, icon: 'scope', domain: 'indigo',
        sections: [{ label: 'Details', icon: zi('moon'), items: [
          { text: formatTimeShort(n.bedtime) + ' \u2013 ' + formatTimeShort(n.wakeTime), signal: 'neutral' },
          { text: Math.floor(dur.total / 60) + 'h ' + (dur.total % 60) + 'm total', signal: dur.total >= ISL_THRESHOLDS.GOOD_NIGHT_DURATION_MIN ? 'good' : 'warn' },
          { text: (n.wakeUps || 0) + ' wake-up' + ((n.wakeUps || 0) !== 1 ? 's' : ''), signal: (n.wakeUps || 0) <= 1 ? 'good' : 'warn' }
        ]}]
      };
    }
  }
  return { title: 'Last Night Sleep', headline: 'No night sleep logged recently', icon: 'scope', domain: 'indigo', sections: [] };
}

function _qaLastVaccine() {
  var completed = (vaccData || []).filter(function(v) { return v.given && v.date; }).sort(function(a, b) { return b.date.localeCompare(a.date); });
  if (completed.length === 0) return { title: 'Last Vaccination', headline: 'No completed vaccinations on record', icon: 'scope', domain: 'sky', sections: [] };
  var last = completed[0];
  var daysAgo = Math.round((new Date(today()) - new Date(last.date)) / 86400000);
  return {
    title: 'Last Vaccination', headline: last.name, icon: 'scope', domain: 'sky',
    sections: [{ label: 'Details', icon: zi('syringe'), items: [
      { text: formatDate(last.date) + ' (' + daysAgo + ' days ago)', signal: 'neutral' },
      { text: last.name + (last.dose ? ' \u2014 Dose ' + last.dose : ''), signal: 'good' }
    ]}]
  };
}

function _qaLastIllness() {
  var episodes = [];
  try { episodes = _getAllEpisodes(); } catch(e) {}
  var past = episodes.filter(function(ep) { return ep.status !== 'active'; }).sort(function(a, b) { return (b.startDate || '').localeCompare(a.startDate || ''); });
  if (past.length === 0) return { title: 'Last Illness', headline: 'No past illness episodes on record', icon: 'scope', domain: 'sky', sections: [] };
  var ep = past[0];
  return {
    title: 'Last Illness', headline: ep.type || 'Unknown', icon: 'scope', domain: 'sky',
    sections: [{ label: 'Details', icon: zi('medical'), items: [
      { text: (ep.type || 'Illness') + ' \u2014 started ' + formatDate(ep.startDate || ''), signal: 'neutral' },
      { text: 'Duration: ' + (ep.durationDays || '?') + ' days', signal: 'info' }
    ]}]
  };
}

// ── SESSION B: PATTERN/TREND HANDLER ──

function _qaHandlePattern(classified) {
  var lower = classified.raw.toLowerCase();
  if (classified.subtype === 'compare') return _qaCompare(lower);
  if (/routine|schedule|pattern/.test(lower) && !/vaccin/.test(lower)) return _qaRoutine();
  if (/favorite|likes/.test(lower)) return _qaFoodLikes();
  if (/dislikes|rejects/.test(lower)) return _qaFoodDislikes();
  if (/improving|progress|getting better/.test(lower)) return _qaTrends('improving');
  if (/concern|worr/.test(lower)) return _qaTrends('concerns');
  return _qaRoutine(); // Default pattern query → routine
}

function _qaRoutine() {
  // BN-2: Scan feedingData directly for meal timestamps
  var todayD = new Date(today());
  var mealTimes = { breakfast: [], lunch: [], dinner: [], snack: [] };
  var napStarts = [];
  var bedtimes = [];
  var wakeTimes = [];

  for (var i = 0; i < 7; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);

    // Meal times from feedingData
    var entry = feedingData[ds];
    if (entry) {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(m) {
        if (entry[m + '_time']) {
          var parts = entry[m + '_time'].split(':').map(Number);
          if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            mealTimes[m].push(parts[0] * 60 + parts[1]);
          }
        }
      });
    }

    // Sleep times
    var dayNights = (sleepData || []).filter(function(s) { return s.date === ds && s.type === 'night' && s.bedtime; });
    if (dayNights.length > 0) {
      var n = dayNights[0];
      var bParts = n.bedtime.split(':').map(Number);
      if (!isNaN(bParts[0])) {
        var bedMin = bParts[0] * 60 + (bParts[1] || 0);
        if (bParts[0] < 6) bedMin += 1440; // After midnight
        bedtimes.push(bedMin);
      }
      if (n.wakeTime) {
        var wParts = n.wakeTime.split(':').map(Number);
        if (!isNaN(wParts[0])) wakeTimes.push(wParts[0] * 60 + (wParts[1] || 0));
      }
    }

    var dayNaps = (sleepData || []).filter(function(s) { return s.date === ds && s.type === 'nap' && s.bedtime; });
    dayNaps.forEach(function(nap) {
      var nParts = nap.bedtime.split(':').map(Number);
      if (!isNaN(nParts[0])) napStarts.push(nParts[0] * 60 + (nParts[1] || 0));
    });
  }

  // Convert minute averages back to HH:MM
  function avgMinToTime(arr) {
    if (arr.length === 0) return null;
    var avg = Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
    var h = Math.floor((avg % 1440) / 60);
    var m = avg % 60;
    return formatTimeShort(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
  }

  var schedule = [];
  var wakeAvg = avgMinToTime(wakeTimes);
  if (wakeAvg) schedule.push({ time: wakeAvg, label: 'Wake up', sort: wakeTimes.reduce(function(a,b){return a+b;},0)/wakeTimes.length });
  var bfAvg = avgMinToTime(mealTimes.breakfast);
  if (bfAvg) schedule.push({ time: bfAvg, label: 'Breakfast', sort: mealTimes.breakfast.reduce(function(a,b){return a+b;},0)/mealTimes.breakfast.length });

  // Morning nap (naps before 13:00)
  var mornNaps = napStarts.filter(function(t) { return t < 780; });
  var aftNaps = napStarts.filter(function(t) { return t >= 780; });
  var mornAvg = avgMinToTime(mornNaps);
  if (mornAvg) schedule.push({ time: mornAvg, label: 'Morning nap', sort: mornNaps.reduce(function(a,b){return a+b;},0)/mornNaps.length });

  var lunchAvg = avgMinToTime(mealTimes.lunch);
  if (lunchAvg) schedule.push({ time: lunchAvg, label: 'Lunch', sort: mealTimes.lunch.reduce(function(a,b){return a+b;},0)/mealTimes.lunch.length });

  var aftAvg = avgMinToTime(aftNaps);
  if (aftAvg) schedule.push({ time: aftAvg, label: 'Afternoon nap', sort: aftNaps.reduce(function(a,b){return a+b;},0)/aftNaps.length });

  var dinAvg = avgMinToTime(mealTimes.dinner);
  if (dinAvg) schedule.push({ time: dinAvg, label: 'Dinner', sort: mealTimes.dinner.reduce(function(a,b){return a+b;},0)/mealTimes.dinner.length });

  var bedAvg = avgMinToTime(bedtimes);
  if (bedAvg) schedule.push({ time: bedAvg, label: 'Bedtime', sort: bedtimes.reduce(function(a,b){return a+b;},0)/bedtimes.length });

  // Sort by time of day
  schedule.sort(function(a, b) { return a.sort - b.sort; });

  if (schedule.length === 0) {
    return { title: 'Ziva\'s Routine', headline: 'Not enough data yet', icon: 'clock', domain: 'indigo', sections: [], dataGap: 'Log meals and sleep with times to build a routine picture.' };
  }

  var items = schedule.map(function(s) {
    return { text: s.time + '  ' + s.label, signal: 'neutral' };
  });

  // Add poop + D3 summary
  var pp = getDomainData('poop', _offsetDateStr(today(), -6), today());
  if (pp.totalCount > 0) items.push({ text: 'Poop: avg ' + pp.avgPerDay + '/day, mostly ' + (pp.mostCommonConsistency || 'normal'), signal: 'neutral', icon: zi('diaper') });

  var md = getDomainData('medical', _offsetDateStr(today(), -6), today());
  if (md.suppAdherence !== null) items.push({ text: 'Vit D3: ' + md.suppAdherence + '% adherence', signal: md.suppAdherence >= ISL_THRESHOLDS.D3_ADHERENCE_GOOD_PCT ? 'good' : 'warn', icon: zi('pill') });

  var age = ageAt();
  return {
    title: 'Ziva\'s Typical Day',
    headline: 'Based on last 7 days avg',
    icon: 'clock',
    domain: 'indigo',
    sections: [{ label: age.months + ' months ' + age.days + ' days old', icon: zi('baby'), items: items }]
  };
}

function _qaFoodLikes() {
  var acceptance = computeFoodAcceptance(30);
  if (acceptance.length === 0) {
    return { title: 'Favorite Foods', headline: 'No food data yet', icon: 'star', domain: 'peach', sections: [], dataGap: 'Log meals to track food preferences.' };
  }

  var liked = acceptance.filter(function(f) { return f.avgIntake >= 0.6 && f.timesServed >= 2; }).slice(0, 8);
  if (liked.length === 0) {
    return { title: 'Favorite Foods', headline: 'Not enough data to determine preferences', icon: 'star', domain: 'peach', sections: [] };
  }

  var items = liked.map(function(f) {
    var intakePct = Math.round(f.avgIntake * 100);
    var trendIcon = f.trend === 'improving' ? ' (improving)' : (f.trend === 'declining' ? ' (declining)' : '');
    return { text: f.food + ' \u2014 ' + intakePct + '% avg intake, served ' + f.timesServed + 'x' + trendIcon, signal: f.avgIntake >= 0.75 ? 'good' : 'neutral' };
  });

  return {
    title: 'Foods She Likes',
    headline: liked.length + ' favorites in last 30 days',
    icon: 'star',
    domain: 'peach',
    sections: [{ label: 'Top Foods', icon: zi('bowl'), items: items }]
  };
}

function _qaFoodDislikes() {
  var acceptance = computeFoodAcceptance(30);
  if (acceptance.length === 0) {
    return { title: 'Foods She Rejects', headline: 'No food data yet', icon: 'warn', domain: 'peach', sections: [], dataGap: 'Log meals to track food preferences.' };
  }

  var disliked = acceptance.filter(function(f) { return f.avgIntake < 0.4 && f.timesServed >= 2; }).slice(0, 6);
  if (disliked.length === 0) {
    return { title: 'Foods She Rejects', headline: 'No consistently rejected foods found', icon: 'check', domain: 'peach', sections: [] };
  }

  var items = disliked.map(function(f) {
    var intakePct = Math.round(f.avgIntake * 100);
    return { text: f.food + ' \u2014 only ' + intakePct + '% avg intake (' + f.timesServed + ' attempts)', signal: 'warn' };
  });

  return {
    title: 'Foods She Rejects',
    headline: disliked.length + ' low-acceptance foods',
    icon: 'warn',
    domain: 'peach',
    sections: [{ label: 'Low Acceptance', icon: zi('bowl'), items: items }],
    confidence: 'Based on last 30 days'
  };
}

function _qaTrends(mode) {
  var domains = ['sleep', 'diet', 'poop', 'medical', 'milestones'];
  var labels = { sleep: 'Sleep', diet: 'Diet', poop: 'Poop', medical: 'Medical', milestones: 'Milestones' };

  // Compare last 7 days vs 7 days before that
  var curStart = _offsetDateStr(today(), -6);
  var curEnd = today();
  var prevStart = _offsetDateStr(today(), -13);
  var prevEnd = _offsetDateStr(today(), -7);

  var items = [];

  domains.forEach(function(dom) {
    try {
      var cur = getDomainData(dom, curStart, curEnd);
      var prev = getDomainData(dom, prevStart, prevEnd);
      var curScore = _islDomainAvgScore(cur, dom);
      var prevScore = _islDomainAvgScore(prev, dom);
      if (curScore === null || prevScore === null) return;

      var diff = curScore - prevScore;
      var isImproving = diff > 2;
      var isDeclining = diff < -2;

      if (mode === 'improving' && isImproving) {
        items.push({ text: labels[dom] + ': ' + prevScore + ' \u2192 ' + curScore + ' (+' + diff + ')', signal: 'good' });
      } else if (mode === 'concerns' && isDeclining) {
        items.push({ text: labels[dom] + ': ' + prevScore + ' \u2192 ' + curScore + ' (' + diff + ')', signal: 'warn' });
      } else if (mode === 'concerns' && curScore < 60) {
        items.push({ text: labels[dom] + ': score ' + curScore + ' \u2014 below target', signal: 'warn' });
      }
    } catch(e) {}
  });

  // Milestone evidence for improving
  if (mode === 'improving') {
    var ms = getDomainData('milestones', curStart, curEnd);
    ms.progressed.forEach(function(p) {
      items.push({ text: p.text + ' \u2192 ' + p.status, signal: 'good' });
    });
  }

  var title = mode === 'improving' ? 'What\'s Improving' : 'Areas of Concern';
  var icon = mode === 'improving' ? 'sparkle' : 'warn';
  var color = mode === 'improving' ? 'sage' : 'amber';

  if (items.length === 0) {
    var noDataMsg = mode === 'improving' ? 'Things are steady \u2014 no significant improvements detected this week vs last' : 'No major concerns detected. Keep it up!';
    return { title: title, headline: noDataMsg, icon: icon, domain: color, sections: [] };
  }

  return {
    title: title,
    headline: items.length + ' trend' + (items.length !== 1 ? 's' : '') + ' detected',
    icon: icon,
    domain: color,
    sections: [{ label: 'Last 7 days vs previous 7 days', icon: zi('chart'), items: items }]
  };
}

function _islDomainAvgScore(data, domain) {
  if (domain === 'sleep') return data.avgNightScore;
  if (domain === 'diet') return data.avgDietScore !== undefined ? data.avgDietScore : null;
  if (domain === 'poop') return data.avgPoopScore !== undefined ? data.avgPoopScore : null;
  if (domain === 'medical') return data.avgMedicalScore !== undefined ? data.avgMedicalScore : null;
  if (domain === 'milestones') return data.avgMilestoneScore !== undefined ? data.avgMilestoneScore : null;
  return null;
}

function _qaCompare(text) {
  // Determine comparison periods (default: this week vs last week)
  var isMonth = /month/.test(text);
  var curStart, curEnd, prevStart, prevEnd, label;

  if (isMonth) {
    var now = new Date();
    curStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    curEnd = today();
    var pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevStart = toDateStr(pm);
    prevEnd = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));
    label = 'This Month vs Last Month';
  } else {
    // This week vs last week (Mon-Sun)
    var nowD = new Date();
    var dayOfWeek = nowD.getDay() || 7; // Mon=1..Sun=7
    curStart = _offsetDateStr(today(), -(dayOfWeek - 1));
    curEnd = today();
    prevEnd = _offsetDateStr(curStart, -1);
    prevStart = _offsetDateStr(prevEnd, -6);
    label = 'This Week vs Last Week';
  }

  var cur = generateRangeSummary(curStart, curEnd);
  var prev = generateRangeSummary(prevStart, prevEnd);

  var items = [];
  var domains = ['sleep', 'diet', 'poop', 'medical', 'milestones'];
  var domainLabels = { sleep: 'Sleep', diet: 'Diet', poop: 'Poop', medical: 'Medical', milestones: 'Milestones' };

  domains.forEach(function(dom) {
    var curS = cur.avgScores[dom];
    var prevS = prev.avgScores[dom];
    if (curS !== null && prevS !== null) {
      var diff = curS - prevS;
      var arrow = diff > 0 ? '+' + diff : '' + diff;
      var signal = diff > 2 ? 'good' : (diff < -2 ? 'warn' : 'neutral');
      var dir = diff > 2 ? 'better' : (diff < -2 ? 'declining' : 'stable');
      items.push({ text: domainLabels[dom] + ': ' + prevS + ' \u2192 ' + curS + ' (' + arrow + ') \u2014 ' + dir, signal: signal });
    }
  });

  if (cur.avgScores.overall !== null && prev.avgScores.overall !== null) {
    var oDiff = cur.avgScores.overall - prev.avgScores.overall;
    items.push({ text: 'Overall: ' + prev.avgScores.overall + ' \u2192 ' + cur.avgScores.overall + ' (' + (oDiff > 0 ? '+' : '') + oDiff + ')', signal: oDiff > 0 ? 'good' : (oDiff < -2 ? 'warn' : 'neutral') });
  }

  if (items.length === 0) {
    return { title: label, headline: 'Not enough data for comparison', icon: 'chart', domain: 'indigo', sections: [], dataGap: 'Need logged data in both periods to compare.' };
  }

  return {
    title: label,
    headline: cur.dayCount + ' days current \u00b7 ' + prev.dayCount + ' days previous',
    icon: 'chart',
    domain: 'indigo',
    sections: [{ label: 'Score Comparison', icon: zi('chart'), items: items }],
    actions: [{ id: 'share-summary', label: 'Share', icon: 'link', color: 'indigo' }]
  };
}

// ── SESSION B: PLANNING HANDLER ──

function _qaHandlePlanning(classified) {
  if (classified.subtype === 'doctor') return _qaDoctorPrep();
  if (classified.subtype === 'tomorrow') return _qaTomorrowPlan();
  if (classified.subtype === 'share') return _qaShareToday();
  return null;
}

function _qaDoctorPrep() {
  var age = ageAt();
  var items = [];

  // Age
  items.push({ text: 'Age: ' + age.months + ' months ' + age.days + ' days', signal: 'neutral', icon: zi('baby') });

  // Growth
  var gd = getDomainData('medical', _offsetDateStr(today(), -30), today());
  if (gd.growthInRange.length > 0) {
    var lg = gd.growthInRange[gd.growthInRange.length - 1];
    var parts = [];
    if (lg.wt) parts.push(lg.wt + ' kg');
    if (lg.ht) parts.push(lg.ht + ' cm');
    items.push({ text: 'Last measurement: ' + parts.join(', ') + ' (' + formatDate(lg.date) + ')', signal: 'info' });
  }

  // Vaccination status
  if (gd.vaccUpcoming) {
    var vDays = Math.ceil((new Date(gd.vaccUpcoming.date) - new Date()) / 86400000);
    items.push({ text: 'Next vaccine: ' + gd.vaccUpcoming.name + (vDays > 0 ? ' in ' + vDays + ' days' : ' \u2014 due now'), signal: vDays <= 3 ? 'action' : 'info' });
  }

  // D3 adherence
  if (gd.suppAdherence !== null) {
    items.push({ text: 'D3 adherence (30d): ' + gd.suppAdherence + '%', signal: gd.suppAdherence >= ISL_THRESHOLDS.D3_ADHERENCE_GOOD_PCT ? 'good' : 'warn' });
  }

  // Recent concerns from last 7 days
  var recent = generateRangeSummary(_offsetDateStr(today(), -6), today());
  if (recent.concerns.length > 0) {
    recent.concerns.slice(0, 3).forEach(function(c) {
      items.push({ text: c.text, signal: 'warn' });
    });
  }

  // Recent illness
  if (gd.illnessEpisodes.length > 0) {
    items.push({ text: gd.illnessEpisodes.length + ' illness episode(s) in last 30 days', signal: 'warn' });
  }

  // Milestone highlights
  var ms = getDomainData('milestones', _offsetDateStr(today(), -30), today());
  if (ms.progressed.length > 0) {
    ms.progressed.slice(0, 3).forEach(function(p) {
      items.push({ text: 'Milestone: ' + p.text + ' \u2192 ' + p.status, signal: 'good' });
    });
  }

  // ── Vaccination reaction history (Session B) ──
  var vaccReactionItems = [];
  var withReaction = vaccData.filter(function(v) { return !v.upcoming && v.reaction; })
    .sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  if (withReaction.length > 0) {
    withReaction.slice(0, 5).forEach(function(v) {
      var sev = v.reaction.charAt(0).toUpperCase() + v.reaction.slice(1);
      var syms = _vaccSymptomLabels(v.symptoms);
      var signal = v.reaction === 'none' ? 'good' : v.reaction === 'mild' ? 'info' : 'warn';
      vaccReactionItems.push({ text: v.name + ': ' + sev + (syms ? ' \u2014 ' + syms : ''), signal: signal });
    });
    // Add trend analysis for families with 2+ reactions
    var familiesSeen = new Set();
    withReaction.forEach(function(v) { familiesSeen.add(_vaccFamilyKey(v.name)); });
    familiesSeen.forEach(function(fam) {
      var seriesData = withReaction.filter(function(v) { return _vaccFamilyKey(v.name) === fam; });
      if (seriesData.length >= 2) {
        var trend = _vaccReactionTrend(seriesData);
        if (trend.trend !== 'insufficient') {
          vaccReactionItems.push({ text: fam + ': ' + trend.label, signal: trend.trend === 'decreasing' ? 'good' : trend.trend === 'increasing' ? 'warn' : 'info' });
        }
      }
    });
  }

  var sections = [{ label: 'Key Info for Pediatrician', icon: zi('medical'), items: items }];
  if (vaccReactionItems.length > 0) {
    sections.push({ label: 'Vaccination Reactions', icon: zi('syringe'), items: vaccReactionItems });
  }

  return {
    title: 'Doctor Visit Prep',
    headline: 'Ziva \u00b7 ' + age.months + ' months',
    icon: 'steth',
    domain: 'sky',
    sections: sections,
    actions: [{ id: 'share-summary', label: 'Share', icon: 'link', color: 'indigo' }],
    _summaryData: { label: 'Doctor Visit Prep', highlights: items.filter(function(i) { return i.signal === 'good'; }), concerns: items.filter(function(i) { return i.signal === 'warn' || i.signal === 'action'; }), scores: {} }
  };
}

function _qaTomorrowPlan() {
  // Reuse existing Tomorrow's Prep system
  try {
    var prep = generateTomorrowPrep();
    if (!prep) return null;

    var items = [];

    // Meal suggestions
    if (prep.meals) {
      ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
        if (prep.meals[meal]) {
          var mLabel = meal.charAt(0).toUpperCase() + meal.slice(1);
          var foods = prep.meals[meal].foods || [];
          if (foods.length > 0) {
            items.push({ text: mLabel + ': ' + foods.slice(0, 3).map(function(f) { return f.food || f; }).join(', '), signal: 'neutral' });
          }
        }
      });
    }

    // Alerts
    if (prep.alerts && prep.alerts.length > 0) {
      prep.alerts.forEach(function(a) {
        items.push({ text: a.text || a, signal: 'warn' });
      });
    }

    if (items.length === 0) {
      items.push({ text: 'No specific suggestions \u2014 you\'re on track', signal: 'good' });
    }

    return {
      title: 'Tomorrow\'s Plan',
      headline: formatDate(_offsetDateStr(today(), 1)),
      icon: 'bulb',
      domain: 'lav',
      sections: [{ label: 'Suggestions', icon: zi('sparkle'), items: items }]
    };
  } catch(e) {
    return { title: 'Tomorrow\'s Plan', headline: 'Couldn\'t generate plan', icon: 'bulb', domain: 'lav', sections: [], dataGap: 'Log more data to get personalized suggestions.' };
  }
}

function _qaShareToday() {
  var summary = generateDaySummary(today());
  var text = formatSummaryAsText(summary);
  return {
    title: 'Share Today\'s Summary',
    headline: 'Ziva \u00b7 ' + formatDate(today()),
    icon: 'link',
    domain: 'indigo',
    sections: [{ label: 'Preview', icon: zi('note'), items: [
      { text: summary.scores.overall !== null ? 'Score: ' + summary.scores.overall : 'Events: ' + summary.events, signal: 'neutral' }
    ].concat(
      summary.sleepSummary && summary.sleepSummary !== 'No sleep data' ? [{ text: summary.sleepSummary, signal: 'neutral' }] : []
    ).concat(
      summary.poopSummary && summary.poopSummary !== 'No poop data' ? [{ text: summary.poopSummary, signal: 'neutral' }] : []
    ).concat(
      summary.activitySummary && summary.activitySummary !== 'No activities' ? [{ text: summary.activitySummary, signal: 'neutral' }] : []
    )}],
    actions: [
      { id: 'share-copy', label: 'Copy Text', icon: 'note', color: 'indigo' },
      { id: 'share-whatsapp', label: 'WhatsApp', icon: 'link', color: 'sage' }
    ],
    _summaryData: summary,
    _shareText: text
  };
}

// ── formatSummaryAsText ──

function formatSummaryAsText(summary) {
  var age = ageAt();
  var lines = [];
  lines.push('*Ziva (' + age.months + 'mo ' + age.days + 'd) \u2014 ' + (summary.label || formatDate(summary.date || today())) + '*');
  if (summary.scores && summary.scores.overall !== null) lines.push('Score: ' + summary.scores.overall + '/100');
  lines.push('');

  if (summary.highlights && summary.highlights.length > 0) {
    lines.push('*Highlights*');
    summary.highlights.forEach(function(h) { lines.push('\u2713 ' + h.text); });
    lines.push('');
  }

  if (summary.concerns && summary.concerns.length > 0) {
    lines.push('*Heads Up*');
    summary.concerns.forEach(function(c) { lines.push('\u26a0 ' + c.text); });
    lines.push('');
  }

  if (summary.meals) {
    var mealParts = [];
    if (summary.meals.breakfast) mealParts.push('B: ' + summary.meals.breakfast);
    if (summary.meals.lunch) mealParts.push('L: ' + summary.meals.lunch);
    if (summary.meals.dinner) mealParts.push('D: ' + summary.meals.dinner);
    if (mealParts.length > 0) lines.push(mealParts.join(' | '));
  }

  if (summary.sleepSummary && summary.sleepSummary !== 'No sleep data') lines.push(summary.sleepSummary);
  if (summary.poopSummary && summary.poopSummary !== 'No poop data') lines.push(summary.poopSummary);
  if (summary.activitySummary && summary.activitySummary !== 'No activities') lines.push(summary.activitySummary);

  lines.push('');
  lines.push('_via SproutLab_');
  return lines.join('\n');
}

// ── AGE + STREAK HANDLERS (BN-6) ──

function qaAnswerAge() {
  var age = ageAt();
  var totalDays = Math.floor((new Date() - DOB) / 86400000);
  var weeksOld = Math.floor(totalDays / 7);

  return {
    title: 'Ziva\'s Age',
    headline: age.months + ' months ' + age.days + ' days old',
    icon: 'baby',
    domain: 'rose',
    sections: [{ label: 'Details', icon: zi('clock'), items: [
      { text: totalDays + ' days old (' + weeksOld + ' weeks)', signal: 'neutral' },
      { text: 'Born: 4 September 2025', signal: 'neutral' },
      { text: 'Birth weight: 3.45 kg, 50 cm', signal: 'neutral' }
    ]}]
  };
}

function qaAnswerStreak() {
  var todayD = new Date(today());
  var streak = 0;

  // Pre-build date sets for O(1) lookup
  var sleepDates = {};
  (sleepData || []).forEach(function(s) { if (s.date) sleepDates[s.date] = true; });
  var poopDates = {};
  (poopData || []).forEach(function(p) { if (p.date) poopDates[p.date] = true; });

  // Count consecutive days with at least 1 event logged
  for (var i = 0; i < 365; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var hasData = false;
    if (feedingData[ds] && (feedingData[ds].breakfast || feedingData[ds].lunch || feedingData[ds].dinner)) hasData = true;
    if (!hasData && sleepDates[ds]) hasData = true;
    if (!hasData && poopDates[ds]) hasData = true;
    if (hasData) streak++;
    else break;
  }

  var signal = streak >= 14 ? 'good' : (streak >= 7 ? 'neutral' : 'warn');
  var msg = streak >= 30 ? 'Amazing consistency!' : (streak >= 14 ? 'Great streak \u2014 keep it up!' : (streak >= 7 ? 'Building momentum' : 'Let\'s build a streak'));

  return {
    title: 'Logging Streak',
    headline: streak + ' day' + (streak !== 1 ? 's' : '') + ' in a row',
    icon: 'flame',
    domain: 'amber',
    sections: [{ label: msg, icon: zi('flame'), items: [
      { text: streak + ' consecutive days with data logged', signal: signal },
      { text: 'Counts meals, sleep, and poop entries', signal: 'neutral' }
    ]}]
  };
}

function _qaGetSleepScores7d() {
  if (_qaCache._sleep7d) return _qaCache._sleep7d;
  var scores = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var sc = getDailySleepScore(ds);
    if (sc) scores.push({ dateStr: ds, score: sc.score, wakes: sc.wakes, totalMin: sc.totalMin, napCount: sc.napCount, dayIndex: i });
  }
  _qaCache._sleep7d = scores;
  return scores;
}

function _qaGetSleepScores7dPrev() {
  if (_qaCache._sleep7dPrev) return _qaCache._sleep7dPrev;
  var scores = [];
  for (var i = 7; i < 14; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var sc = getDailySleepScore(ds);
    if (sc) scores.push({ dateStr: ds, score: sc.score, wakes: sc.wakes, totalMin: sc.totalMin, dayIndex: i });
  }
  _qaCache._sleep7dPrev = scores;
  return scores;
}

function _qaAvg(arr) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce(function(s, v) { return s + v; }, 0) / arr.length);
}

function _qaPoopScores7d() {
  if (_qaCache._poop7d) return _qaCache._poop7d;
  var scores = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var sc = calcPoopScore(ds);
    if (sc && !sc.isCarryForward) scores.push(sc);
  }
  _qaCache._poop7d = scores;
  return scores;
}

function _qaActivityDays14d() {
  if (_qaCache._act14d) return _qaCache._act14d;
  var days = 0;
  var domainCounts = {};
  for (var i = 0; i < 14; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    if (Array.isArray(activityLog[ds]) && activityLog[ds].length > 0) {
      days++;
      activityLog[ds].forEach(function(e) {
        (e.domains || []).forEach(function(dom) {
          domainCounts[dom] = (domainCounts[dom] || 0) + 1;
        });
      });
    }
  }
  var result = { days: days, domainCounts: domainCounts };
  _qaCache._act14d = result;
  return result;
}

// ═══ HANDLER: SLEEP QUALITY ═══

function qaAnswerSleepQuality(intentId) {
  var scores = _qaGetSleepScores7d();
  var prevScores = _qaGetSleepScores7dPrev();

  if (scores.length < 3) {
    return {
      icon: 'moon', domain: 'indigo', title: 'Sleep Quality', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log ' + (5 - scores.length) + ' more nights of sleep to see patterns', signal: 'info' },
        { text: 'Track bedtime, wake time, and wake-ups each night', signal: 'action' }
      ]}],
      confidence: null,
      dataGap: 'Need ' + (5 - scores.length) + ' more nights of sleep data'
    };
  }

  var avgScore = _qaAvg(scores.map(function(s) { return s.score; }));
  var prevAvg = prevScores.length >= 3 ? _qaAvg(prevScores.map(function(s) { return s.score; })) : null;
  var trend = prevAvg !== null ? avgScore - prevAvg : null;
  var trendStr = trend !== null ? (trend > 0 ? ' (↑' + trend + ' from last week)' : trend < 0 ? ' (↓' + Math.abs(trend) + ' from last week)' : ' (stable)') : '';

  var headline = 'Score: ' + avgScore + '/100 this week' + trendStr;

  var dataItems = [];
  var actionItems = [];

  // Bedtime drift
  try {
    var drift = computeBedtimeDrift();
    if (!drift.insufficient) {
      if (drift.direction === 'later') {
        dataItems.push({ text: 'Bedtime drifted ' + Math.abs(drift.driftPerWeek) + ' min later this week', signal: 'warn' });
        // Suggest pulling back 15 min from current avg
        var targetStr = _siMinToBedtime(drift.avgBedtime - 15);
        actionItems.push({ text: 'Aim for ' + targetStr + ' bedtime (pull back 15 min)', signal: 'action' });
      } else if (drift.direction === 'earlier') {
        dataItems.push({ text: 'Bedtime shifted ' + Math.abs(drift.driftPerWeek) + ' min earlier — great trend', signal: 'good' });
      } else {
        dataItems.push({ text: 'Bedtime is stable at ' + drift.avgBedtimeStr, signal: 'good' });
      }
    }
  } catch(e) {}

  // Wake-ups trend
  var avgWakes = _qaAvg(scores.map(function(s) { return s.wakes; }));
  if (avgWakes <= 1) {
    dataItems.push({ text: 'Averaging ' + avgWakes + ' wake-up per night — excellent', signal: 'good' });
  } else if (avgWakes >= 3) {
    dataItems.push({ text: 'Averaging ' + avgWakes + ' wake-ups per night', signal: 'warn' });
  } else {
    dataItems.push({ text: 'Averaging ' + avgWakes + ' wake-ups per night', signal: 'info' });
  }

  // Sleep regression
  try {
    var reg = computeSleepRegression();
    if (!reg.insufficient) {
      if (reg.severity === 'none') {
        dataItems.push({ text: 'No sleep regression detected', signal: 'good' });
      } else {
        dataItems.push({ text: reg.severityLabel + ' detected — ' + reg.maxConsecBad + ' consecutive bad nights', signal: 'warn' });
        if (reg.causes && reg.causes.length > 0) {
          dataItems.push({ text: 'Possible cause: ' + reg.causes[0].text, signal: 'info' });
        }
      }
    }
  } catch(e) {}

  // Cross-domain: dinner gap
  try {
    if (typeof renderInfoSleepFeeding === 'function') {
      // Compute dinner-to-bedtime gap effect
      var fdData = feedingData || {};
      var gapBuckets = { short: [], medium: [], long: [] };
      scores.forEach(function(s) {
        var dayEntry = fdData[s.dateStr];
        if (!dayEntry || !dayEntry.dinner_time) return;
        var bedEntry = (sleepData || []).find(function(sl) { return sl.date === s.dateStr && sl.type === 'night'; });
        if (!bedEntry || !bedEntry.bedtime) return;
        var dParts = dayEntry.dinner_time.split(':').map(Number);
        var bParts = bedEntry.bedtime.split(':').map(Number);
        var gapMin = (bParts[0] * 60 + bParts[1]) - (dParts[0] * 60 + dParts[1]);
        if (gapMin < 0) gapMin += 1440;
        if (gapMin < 60) gapBuckets.short.push(s.score);
        else if (gapMin < 90) gapBuckets.medium.push(s.score);
        else gapBuckets.long.push(s.score);
      });
      if (gapBuckets.short.length >= 2 && gapBuckets.long.length >= 1) {
        var shortAvg = _qaAvg(gapBuckets.short);
        var longAvg = _qaAvg(gapBuckets.long);
        if (longAvg > shortAvg + 5) {
          dataItems.push({ text: 'Dinner gap <60 min correlates with worse sleep (' + shortAvg + ' vs ' + longAvg + ')', signal: 'warn' });
          actionItems.push({ text: 'Try dinner 90+ minutes before bedtime', signal: 'action' });
        }
      }
    }
  } catch(e) {}

  // General actions
  if (actionItems.length === 0) {
    actionItems.push({ text: 'Keep a consistent bedtime routine', signal: 'action' });
  }
  actionItems.push({ text: 'Morning tummy time or motor play helps nighttime sleep', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'moon', domain: 'indigo', title: 'Sleep Quality', headline: headline,
    sections: sections,
    confidence: 'Based on ' + scores.length + ' nights' + (prevScores.length > 0 ? ' + ' + prevScores.length + ' prior' : ''),
    dataGap: null
  };
}

// ═══ HANDLER: WEIGHT / GROWTH ═══

function qaAnswerWeightGain(intentId) {
  var gv = computeGrowthVelocity();

  if (gv.insufficient) {
    return {
      icon: 'ruler', domain: 'rose', title: 'Growth & Weight', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Need at least 2 weight measurements to track growth', signal: 'info' },
        { text: 'Log weight in the Growth tab', signal: 'action' }
      ]}],
      confidence: null,
      dataGap: 'Need ' + (2 - gv.count) + ' more measurement(s)'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var headline = '';

  // Weight velocity
  if (gv.weight) {
    var w = gv.weight;
    headline = w.latest.wt + ' kg — ';
    if (w.status === 'on-track') {
      headline += 'gaining well (' + w.gPerDay + ' g/day)';
      dataItems.push({ text: 'Weight gain: ' + w.gPerDay + ' g/day — on track for ' + w.expectedRange.label, signal: 'good' });
    } else if (w.status === 'slow') {
      headline += 'gaining slowly (' + w.gPerDay + ' g/day)';
      dataItems.push({ text: 'Weight gain: ' + w.gPerDay + ' g/day — below expected ' + w.expectedRange.min + '-' + w.expectedRange.max + ' g/day', signal: 'warn' });
      actionItems.push({ text: 'Add calorie-dense foods: ghee, banana, avocado, nut butters', signal: 'action' });
    } else if (w.status === 'plateau') {
      headline += 'weight plateau detected';
      dataItems.push({ text: 'Only ' + w.gainG + 'g gained in ' + w.daysBetween + ' days', signal: 'warn' });
      actionItems.push({ text: 'Consider adding an extra meal or calorie-dense toppings', signal: 'action' });
    } else if (w.status === 'fast') {
      headline += 'gaining quickly (' + w.gPerDay + ' g/day)';
      dataItems.push({ text: 'Weight gain: ' + w.gPerDay + ' g/day — above expected range', signal: 'info' });
    }

    if (w.totalGainG) {
      dataItems.push({ text: 'Total gain since birth: ' + Math.round(w.totalGainG) + 'g (' + (w.totalGainG / 1000).toFixed(1) + ' kg)', signal: 'info' });
    }

    if (w.stale) {
      dataItems.push({ text: 'Last weighed ' + w.daysSince + ' days ago — consider a new measurement', signal: 'warn' });
      actionItems.push({ text: 'Weigh Ziva to update growth tracking', signal: 'action' });
    }
  }

  // Height velocity
  if (gv.height) {
    var h = gv.height;
    if (h.status === 'on-track') {
      dataItems.push({ text: 'Height: ' + h.latest.ht + ' cm, growing ' + h.cmPerMonth + ' cm/month — on track', signal: 'good' });
    } else if (h.status === 'slow') {
      dataItems.push({ text: 'Height growth: ' + h.cmPerMonth + ' cm/month — below expected', signal: 'warn' });
    } else {
      dataItems.push({ text: 'Height: ' + h.latest.ht + ' cm, growing ' + h.cmPerMonth + ' cm/month', signal: 'info' });
    }
  }

  // Percentile crossings
  if (gv.crossings && gv.crossings.length > 0) {
    var lastCross = gv.crossings[gv.crossings.length - 1];
    if (lastCross.direction === 'dropping') {
      dataItems.push({ text: 'Percentile dropped from ' + Math.round(lastCross.from) + 'th to ' + Math.round(lastCross.to) + 'th', signal: 'warn' });
      actionItems.push({ text: 'Discuss percentile change with pediatrician at next visit', signal: 'action' });
    } else {
      dataItems.push({ text: 'Percentile climbed from ' + Math.round(lastCross.from) + 'th to ' + Math.round(lastCross.to) + 'th', signal: 'good' });
    }
  }

  // Diet link
  try {
    var diet = calcDietScore();
    if (diet.score < 60 && (intentId === 'weight_gain' || (gv.weight && gv.weight.status === 'slow'))) {
      dataItems.push({ text: 'Diet score is ' + diet.score + '/100 — nutrition gaps may affect weight gain', signal: 'warn' });
      actionItems.push({ text: 'Focus on nutrient-dense meals (see Food tab)', signal: 'action' });
    }
    // Low intake + slow gain is the key insight
    if (diet.detail.effectiveIntake !== null && diet.detail.effectiveIntake < 60 && gv.weight && gv.weight.status !== 'on-track') {
      dataItems.push({ text: 'Low meal intake (' + diet.detail.effectiveIntake + '%) may explain slow weight gain', signal: 'warn' });
      actionItems.push({ text: 'Try smaller, more frequent meals with calorie-dense foods', signal: 'action' });
    }
  } catch(e) {}

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Continue regular weigh-ins every 1-2 weeks', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'ruler', domain: 'rose', title: 'Growth & Weight', headline: headline || 'Growth data available',
    sections: sections,
    confidence: 'Based on ' + ((growthData || []).length) + ' measurements',
    dataGap: null
  };
}

// ═══ HANDLER: FOOD GENERAL ═══

function qaAnswerFoodGeneral(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = '';

  // Diet score
  try {
    var diet = calcDietScore();
    headline = 'Diet score: ' + diet.score + '/100 today';
    if (diet.score >= 70) {
      dataItems.push({ text: 'Diet quality is good (' + diet.score + '/100)', signal: 'good' });
    } else if (diet.score >= 40) {
      dataItems.push({ text: 'Diet quality is fair (' + diet.score + '/100) — room to improve', signal: 'warn' });
    } else {
      dataItems.push({ text: 'Diet quality is low (' + diet.score + '/100)', signal: 'warn' });
    }

    dataItems.push({ text: diet.detail.mealsLogged + ' of 3 core meals logged today', signal: diet.detail.mealsLogged >= 3 ? 'good' : 'info' });

    // Effective intake
    if (diet.detail.effectiveIntake !== null && diet.detail.effectiveIntake !== undefined) {
      if (diet.detail.effectiveIntake < 50) {
        dataItems.push({ text: 'Average intake: ' + diet.detail.effectiveIntake + '% — she\'s eating less than half of served portions', signal: 'warn' });
      } else if (diet.detail.effectiveIntake < 75) {
        dataItems.push({ text: 'Average intake: ' + diet.detail.effectiveIntake + '% of served portions', signal: 'info' });
      }
    }
  } catch(e) {
    headline = 'Food & Nutrition';
  }

  // Nutrient gaps
  try {
    var hm = computeNutrientHeatmap(7);
    if (hm && hm.gaps && hm.gaps.length > 0) {
      var gapNames = hm.gaps.slice(0, 3);
      dataItems.push({ text: 'Nutrient gaps this week: ' + gapNames.join(', '), signal: 'warn' });

      // Food suggestions for gaps
      gapNames.forEach(function(n) {
        try {
          var suggestion = _suggestFoodForNutrient(n.toLowerCase());
          if (suggestion && suggestion !== 'a variety of foods') {
            actionItems.push({ text: 'For ' + n + ': try ' + suggestion, signal: 'action' });
          }
        } catch(e2) {}
      });
    } else {
      dataItems.push({ text: 'All key nutrients covered this week', signal: 'good' });
    }
  } catch(e) {}

  // Food variety
  try {
    var vs = computeVarietyScore(7);
    if (vs.uniqueFoods < vs.target) {
      dataItems.push({ text: 'Variety: ' + vs.uniqueFoods + ' unique foods this week (target: ' + vs.target + ')', signal: 'warn' });
      actionItems.push({ text: 'Try introducing a new food this week', signal: 'action' });
    } else {
      dataItems.push({ text: 'Good variety: ' + vs.uniqueFoods + ' unique foods this week', signal: 'good' });
    }
  } catch(e) {}

  // Food repetition
  try {
    var rep = computeFoodRepetition();
    if (rep && rep.all && rep.all.length > 0) {
      var topRep = rep.all[0];
      dataItems.push({ text: 'Most repeated: ' + topRep.food + ' (' + topRep.days + ' of ' + topRep.totalDays + ' days)', signal: topRep.pct >= 60 ? 'warn' : 'info' });
    }
  } catch(e) {}

  // Texture
  try {
    var tex = computeTextureProgression();
    if (tex && tex.currentStage) {
      // Compute expected stage from age
      var texAgeM = ageAt().months;
      var expectedTex = texAgeM < 7 ? 'puree' : texAgeM < 8 ? 'mashed' : texAgeM < 10 ? 'soft' : 'finger';
      var texStageIdx = { puree: 0, mashed: 1, soft: 2, finger: 3 };
      if ((texStageIdx[tex.currentStage] || 0) < (texStageIdx[expectedTex] || 0)) {
        var texLabels = { puree: 'puree', mashed: 'mashed/porridge', soft: 'soft chunks', finger: 'finger food' };
        dataItems.push({ text: 'Texture: mostly ' + (texLabels[tex.currentStage] || tex.currentStage) + ' (expected: ' + (texLabels[expectedTex] || expectedTex) + ' by this age)', signal: 'info' });
        actionItems.push({ text: 'Consider advancing to ' + (texLabels[expectedTex] || expectedTex) + ' textures', signal: 'action' });
      }
    }
  } catch(e) {}

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Keep rotating food groups across meals', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'bowl', domain: 'peach', title: 'Food & Nutrition', headline: headline,
    sections: sections,
    confidence: 'Based on 7-day rolling data',
    dataGap: null
  };
}

// ═══ HANDLER: POOP GENERAL ═══

function qaAnswerPoopGeneral(intentId) {
  var scores = _qaPoopScores7d();

  if (scores.length < 2) {
    return {
      icon: 'diaper', domain: 'amber', title: 'Poop Patterns', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log poop consistency, color, and any symptoms', signal: 'info' },
        { text: 'Need at least 3 days of data for patterns', signal: 'action' }
      ]}],
      confidence: null,
      dataGap: 'Need more poop data'
    };
  }

  var avgScore = _qaAvg(scores.map(function(s) { return s.score; }));
  var headline = 'Score: ' + avgScore + '/100 this week';

  var dataItems = [];
  var actionItems = [];

  // Consistency trend
  try {
    var ct = computeConsistencyTrend(7);
    if (ct && !ct.insufficient && ct.mostCommon) {
      if (ct.mostCommon === 'soft' || ct.mostCommon === 'normal') {
        dataItems.push({ text: 'Consistency: mostly ' + ct.mostCommon + ' — healthy pattern', signal: 'good' });
      } else if (ct.mostCommon === 'hard' || ct.mostCommon === 'pellet' || ct.mostCommon === 'pellets') {
        dataItems.push({ text: 'Consistency: mostly ' + ct.mostCommon + ' — possible constipation', signal: 'warn' });
        actionItems.push({ text: 'Add fibre-rich foods: pear, prune, sweet potato, oats', signal: 'action' });
        actionItems.push({ text: 'Ensure adequate water/liquid intake', signal: 'action' });
      } else if (ct.mostCommon === 'loose' || ct.mostCommon === 'watery' || ct.mostCommon === 'runny') {
        dataItems.push({ text: 'Consistency: mostly ' + ct.mostCommon + ' — monitor for diarrhoea', signal: 'warn' });
        actionItems.push({ text: 'Try binding foods: rice, banana, apple, toast', signal: 'action' });
      }
    }
  } catch(e) {}

  // Frequency
  try {
    var bl = computeBaselines();
    if (bl && bl.poopPerDay !== null && bl.poopPerDay !== undefined) {
      var freq = bl.poopPerDay;
      dataItems.push({ text: 'Average frequency: ' + freq + ' per day', signal: freq >= 0.5 && freq <= 4 ? 'good' : 'info' });
    }
  } catch(e) {}

  // Colors
  var allColors = [];
  scores.forEach(function(s) {
    if (s.detail && s.detail.colors) {
      s.detail.colors.forEach(function(c) { if (allColors.indexOf(c) === -1) allColors.push(c); });
    }
  });
  if (allColors.length > 0) {
    var unsafe = allColors.filter(function(c) { return ['red', 'black', 'white'].indexOf(c) !== -1; });
    if (unsafe.length > 0) {
      dataItems.push({ text: 'Concerning colors detected: ' + unsafe.join(', ') + ' — consult pediatrician', signal: 'warn' });
    } else {
      dataItems.push({ text: 'Colors normal: ' + allColors.join(', '), signal: 'good' });
    }
  }

  // Symptoms
  var hasBlood = scores.some(function(s) { return s.detail && s.detail.hasBlood; });
  var hasMucus = scores.some(function(s) { return s.detail && s.detail.hasMucus; });
  if (hasBlood) {
    dataItems.push({ text: 'Blood detected in stool — consult pediatrician', signal: 'warn' });
  }
  if (hasMucus) {
    dataItems.push({ text: 'Mucus present in recent stool(s)', signal: 'info' });
  }

  // Food-poop correlations
  try {
    var fpc = computeFoodPoopCorrelations();
    if (fpc && fpc.results && fpc.results.length > 0) {
      var flagged = fpc.results.filter(function(r) { return r.status === 'likely' || r.status === 'suspected'; });
      if (flagged.length > 0) {
        var triggerNames = flagged.slice(0, 3).map(function(f) { return f.food; });
        dataItems.push({ text: 'Possible trigger foods: ' + triggerNames.join(', '), signal: 'info' });
      }
    }
    if (fpc && fpc.clearFoods > 0) {
      dataItems.push({ text: fpc.clearFoods + ' of ' + fpc.totalTrackedFoods + ' tracked foods show no poop issues', signal: 'good' });
    }
  } catch(e) {}

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Continue logging consistency and color for better patterns', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'diaper', domain: 'amber', title: 'Poop Patterns', headline: headline,
    sections: sections,
    confidence: 'Based on ' + scores.length + ' days of data',
    dataGap: null
  };
}

// ═══ HANDLER: ACTIVITY GENERAL ═══

function qaAnswerActivityGeneral(intentId) {
  var actData = _qaActivityDays14d();
  var dataItems = [];
  var actionItems = [];

  if (actData.days < 2) {
    return {
      icon: 'run', domain: 'sage', title: 'Activities & Milestones', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log activities (tummy time, play, reading) to see patterns', signal: 'info' },
        { text: 'Even 1-2 logged days will start showing insights', signal: 'action' }
      ]}],
      confidence: null,
      dataGap: 'Need more activity data'
    };
  }

  var headline = actData.days + ' active days in last 2 weeks';

  // Activity consistency
  if (actData.days >= 10) {
    dataItems.push({ text: actData.days + ' of 14 days had logged activities — great consistency', signal: 'good' });
  } else if (actData.days >= 5) {
    dataItems.push({ text: actData.days + ' of 14 days had logged activities — decent coverage', signal: 'info' });
  } else {
    dataItems.push({ text: 'Only ' + actData.days + ' of 14 days had activities — try to be more consistent', signal: 'warn' });
    actionItems.push({ text: 'Aim for at least 1 activity per day', signal: 'action' });
  }

  // Domain balance
  var domains = ['motor', 'language', 'social', 'cognitive', 'sensory'];
  var domainLabels = { motor: 'Motor', language: 'Language', social: 'Social', cognitive: 'Cognitive', sensory: 'Sensory' };
  var dc = actData.domainCounts;
  var coveredDomains = domains.filter(function(d) { return (dc[d] || 0) > 0; });
  var missingDomains = domains.filter(function(d) { return (dc[d] || 0) === 0; });

  if (missingDomains.length === 0) {
    dataItems.push({ text: 'All 5 developmental domains covered — balanced stimulation', signal: 'good' });
  } else if (missingDomains.length <= 2) {
    var missingLabels = missingDomains.map(function(d) { return domainLabels[d]; });
    dataItems.push({ text: 'Missing domains: ' + missingLabels.join(', '), signal: 'warn' });
    // Suggest activities for weakest domain
    var domainActivities = {
      motor: 'tummy time, crawling practice, or reaching for toys',
      language: 'reading books, singing songs, or naming objects',
      social: 'peek-a-boo, mirror play, or social games',
      cognitive: 'stacking blocks, cause-and-effect toys, or problem solving',
      sensory: 'texture exploration, water play, or music'
    };
    actionItems.push({ text: 'Try ' + (domainActivities[missingDomains[0]] || 'new activities') + ' for ' + domainLabels[missingDomains[0]], signal: 'action' });
  } else {
    dataItems.push({ text: 'Only ' + coveredDomains.length + ' of 5 domains covered — expand activity variety', signal: 'warn' });
  }

  // Strongest domain
  var strongest = null;
  var strongestCount = 0;
  domains.forEach(function(d) {
    if ((dc[d] || 0) > strongestCount) { strongest = d; strongestCount = dc[d]; }
  });
  if (strongest) {
    dataItems.push({ text: 'Strongest focus: ' + domainLabels[strongest] + ' (' + strongestCount + ' sessions)', signal: 'info' });
  }

  // Milestone score
  try {
    var ms = calcMilestoneScore();
    if (ms.score !== null && ms.score !== undefined) {
      if (ms.score >= 70) {
        dataItems.push({ text: 'Milestone score: ' + ms.score + '/100 — on track', signal: 'good' });
      } else if (ms.score >= 40) {
        dataItems.push({ text: 'Milestone score: ' + ms.score + '/100 — some areas need attention', signal: 'warn' });
      } else {
        dataItems.push({ text: 'Milestone score: ' + ms.score + '/100 — focus on activity engagement', signal: 'warn' });
      }
      if (ms.detail && ms.detail.inProgress > 0) {
        dataItems.push({ text: ms.detail.inProgress + ' milestones currently in progress', signal: 'info' });
      }
    }
  } catch(e) {}

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Morning motor activity helps nighttime sleep quality', signal: 'action' });
  }
  actionItems.push({ text: 'Rotate between domains daily for balanced development', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'run', domain: 'sage', title: 'Activities & Milestones', headline: headline,
    sections: sections,
    confidence: 'Based on 14-day activity log',
    dataGap: null
  };
}

// ═══ HANDLER: OVERALL ═══

function qaAnswerOverall(intentId) {
  var dataItems = [];
  var actionItems = [];

  try {
    var zs = calcZivaScore();
    if (zs.score === null) {
      return {
        icon: 'lotus', domain: 'rose', title: 'Overall Status', headline: 'Not enough data yet',
        sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
          { text: 'Log sleep, meals, and poop to see the Ziva Score', signal: 'info' },
          { text: 'Each domain needs at least a few days of data', signal: 'action' }
        ]}],
        confidence: null,
        dataGap: 'Need more data across domains'
      };
    }

    var headline = 'Ziva Score: ' + zs.score + '/100';
    var trend = getZivaScoreTrend7d();
    if (trend && trend.delta) {
      if (trend.delta > 0) headline += ' (↑' + trend.delta + ')';
      else if (trend.delta < 0) headline += ' (↓' + Math.abs(trend.delta) + ')';
    }

    // Domain breakdown
    var domainNames = { sleep: 'Sleep', diet: 'Diet', poop: 'Poop', medical: 'Medical', milestones: 'Milestones' };
    var domainIcons = { sleep: zi('moon'), diet: zi('bowl'), poop: zi('diaper'), medical: zi('medical'), milestones: zi('target') };
    var weakest = null;
    var weakestScore = 101;
    var strongest = null;
    var strongestScore = -1;

    Object.keys(zs.domains).forEach(function(key) {
      var d = zs.domains[key];
      if (d.score !== null && d.score !== undefined) {
        var signal = d.score >= 70 ? 'good' : d.score >= 40 ? 'warn' : 'warn';
        var staleNote = d.isStale ? ' (stale)' : '';
        dataItems.push({ text: domainNames[key] + ': ' + d.score + '/100' + staleNote, signal: signal, icon: domainIcons[key] });
        if (d.score < weakestScore) { weakestScore = d.score; weakest = key; }
        if (d.score > strongestScore) { strongestScore = d.score; strongest = key; }
      }
    });

    // Strongest
    if (strongest) {
      dataItems.push({ text: 'Strongest: ' + domainNames[strongest] + ' — keep it up!', signal: 'good' });
    }

    // Action for weakest
    if (weakest && weakestScore < 70) {
      var domainActions = {
        sleep: 'Focus on consistent bedtime and morning activity',
        diet: 'Add variety and fill nutrient gaps',
        poop: 'Monitor consistency and adjust fibre/hydration',
        medical: 'Check vaccination and supplement schedule',
        milestones: 'Increase daily activity engagement across domains'
      };
      actionItems.push({ text: domainActions[weakest] || 'Focus on ' + domainNames[weakest], signal: 'action' });
    }

    // Supplement check
    try {
      var suppAdh = computeSupplementAdherence(7);
      if (suppAdh && suppAdh.length > 0) {
        suppAdh.forEach(function(s) {
          if (s.adherenceRate < 80) {
            actionItems.push({ text: s.name + ' adherence: ' + s.adherenceRate + '% — try not to miss doses', signal: 'action' });
          }
        });
      }
    } catch(e) {}

    // Vaccination
    try {
      var nextVacc = (vaccData || []).find(function(v) { return v.upcoming; });
      if (nextVacc) {
        var vaccDate = nextVacc.date || nextVacc.dueDate;
        if (vaccDate) {
          var daysUntil = Math.round((new Date(vaccDate) - new Date(today())) / 86400000);
          if (daysUntil <= 7 && daysUntil >= 0) {
            actionItems.push({ text: 'Vaccination due in ' + daysUntil + ' day(s): ' + (nextVacc.name || 'scheduled vaccine'), signal: 'action' });
          }
        }
      }
    } catch(e) {}

    if (actionItems.length === 0) {
      actionItems.push({ text: 'Everything looks good — keep up the great work!', signal: 'good' });
    }

    var sections = [];
    if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 7) });
    if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

    return {
      icon: 'lotus', domain: 'rose', title: 'Overall Status', headline: headline,
      sections: sections,
      confidence: 'Based on ' + zs.dataCompleteness + ' of 5 domains with data',
      dataGap: zs.dataCompleteness < 5 ? 'Some domains need more data for a complete picture' : null
    };
  } catch(e) {
    return {
      icon: 'lotus', domain: 'rose', title: 'Overall Status', headline: 'Unable to compute score',
      sections: [{ label: 'WHAT TO DO', icon: zi('info'), items: [
        { text: 'Log sleep, meals, and poop to build your Ziva Score', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need more data'
    };
  }
}

// ═══ HANDLER: SLEEP EARLY (bedtime focus) ═══

function qaAnswerSleepEarly(intentId) {
  var scores = _qaGetSleepScores7d();
  if (scores.length < 3) {
    return {
      icon: 'moon', domain: 'indigo', title: 'Earlier Bedtime', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log ' + (5 - scores.length) + ' more nights to analyse bedtime patterns', signal: 'info' },
        { text: 'Record exact bedtime each night', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need more sleep data'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var headline = 'Earlier Bedtime';

  try {
    var drift = computeBedtimeDrift();
    if (!drift.insufficient) {
      headline = 'Average bedtime: ' + drift.avgBedtimeStr;
      if (drift.direction === 'later') {
        dataItems.push({ text: 'Bedtime is drifting ' + Math.abs(drift.driftPerWeek) + ' min later each week', signal: 'warn' });
      } else if (drift.direction === 'earlier') {
        dataItems.push({ text: 'Bedtime is trending earlier — good progress', signal: 'good' });
      } else {
        dataItems.push({ text: 'Bedtime is stable at ' + drift.avgBedtimeStr, signal: 'good' });
      }

      // Find earliest bedtime in the week
      var bedtimes = [];
      (sleepData || []).forEach(function(sl) {
        if (sl.type !== 'night' || !sl.bedtime) return;
        var idx = scores.findIndex(function(s) { return s.dateStr === sl.date; });
        if (idx < 0) return;
        var parts = sl.bedtime.split(':').map(Number);
        bedtimes.push({ date: sl.date, min: parts[0] * 60 + parts[1], score: scores[idx].score });
      });
      if (bedtimes.length >= 3) {
        bedtimes.sort(function(a, b) { return a.min - b.min; });
        var earliest = bedtimes[0];
        var latest = bedtimes[bedtimes.length - 1];
        var range = latest.min - earliest.min;
        if (range > 30) {
          dataItems.push({ text: 'Bedtime range: ' + _siMinToBedtime(earliest.min) + ' to ' + _siMinToBedtime(latest.min) + ' (' + range + ' min spread)', signal: 'warn' });
          actionItems.push({ text: 'Narrow the spread — consistency matters more than exact time', signal: 'action' });
        }
        // Correlate early bedtime with better sleep
        var earlyHalf = bedtimes.slice(0, Math.floor(bedtimes.length / 2));
        var lateHalf = bedtimes.slice(Math.ceil(bedtimes.length / 2));
        var earlyAvgScore = _qaAvg(earlyHalf.map(function(b) { return b.score; }));
        var lateAvgScore = _qaAvg(lateHalf.map(function(b) { return b.score; }));
        if (earlyAvgScore > lateAvgScore + 5) {
          dataItems.push({ text: 'Earlier bedtimes correlate with better sleep (' + earlyAvgScore + ' vs ' + lateAvgScore + ')', signal: 'good' });
        }
      }

      // Ideal window from age targets
      var ageM = ageAt().months;
      var targets = getSleepTargets(Math.floor(ageM));
      if (targets && targets.idealBedtime) {
        actionItems.push({ text: 'Ideal bedtime for ' + Math.floor(ageM) + ' months: ' + targets.idealBedtime, signal: 'action' });
      }

      // Practical suggestions
      if (drift.direction === 'later' || (drift.avgBedtime && drift.avgBedtime > 21 * 60)) {
        var pullTarget = drift.avgBedtime ? _siMinToBedtime(drift.avgBedtime - 15) : '';
        if (pullTarget) actionItems.push({ text: 'Pull back 15 min this week — target ' + pullTarget, signal: 'action' });
      }
    }
  } catch(e) {}

  actionItems.push({ text: 'Start wind-down routine 30 min before target bedtime', signal: 'action' });
  actionItems.push({ text: 'Dim lights and reduce stimulation from 7 PM', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'moon', domain: 'indigo', title: 'Earlier Bedtime', headline: headline,
    sections: sections,
    confidence: 'Based on ' + scores.length + ' nights of data',
    dataGap: null
  };
}

// ═══ HANDLER: SLEEP WAKEUPS ═══

function qaAnswerSleepWakeups(intentId) {
  var scores = _qaGetSleepScores7d();
  var prevScores = _qaGetSleepScores7dPrev();

  if (scores.length < 3) {
    return {
      icon: 'moon', domain: 'indigo', title: 'Night Wake-ups', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log ' + (5 - scores.length) + ' more nights with wake-up counts', signal: 'info' },
        { text: 'Record number of wake-ups each night', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need more sleep data'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var avgWakes = _qaAvg(scores.map(function(s) { return s.wakes; }));
  var prevAvgWakes = prevScores.length >= 3 ? _qaAvg(prevScores.map(function(s) { return s.wakes; })) : null;
  var trendStr = '';
  if (prevAvgWakes !== null) {
    var diff = avgWakes - prevAvgWakes;
    if (diff > 0.5) trendStr = ' (↑' + diff.toFixed(1) + ' from last week)';
    else if (diff < -0.5) trendStr = ' (↓' + Math.abs(diff).toFixed(1) + ' — improving)';
    else trendStr = ' (stable)';
  }
  var headline = 'Avg ' + avgWakes.toFixed(1) + ' wake-ups/night' + trendStr;

  if (avgWakes <= 1) {
    dataItems.push({ text: avgWakes.toFixed(1) + ' wake-ups/night — excellent for this age', signal: 'good' });
  } else if (avgWakes <= 2) {
    dataItems.push({ text: avgWakes.toFixed(1) + ' wake-ups/night — normal range', signal: 'info' });
  } else {
    dataItems.push({ text: avgWakes.toFixed(1) + ' wake-ups/night — higher than typical', signal: 'warn' });
  }

  // Find worst vs best nights
  var sorted = scores.slice().sort(function(a, b) { return b.wakes - a.wakes; });
  if (sorted.length >= 3 && sorted[0].wakes > sorted[sorted.length - 1].wakes + 1) {
    var worstDate = new Date(sorted[0].dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    dataItems.push({ text: 'Worst night: ' + sorted[0].wakes + ' wakeups (' + worstDate + ')', signal: 'warn' });
    var bestDate = new Date(sorted[sorted.length - 1].dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    dataItems.push({ text: 'Best night: ' + sorted[sorted.length - 1].wakes + ' wakeups (' + bestDate + ')', signal: 'good' });
  }

  // Regression check
  try {
    var reg = computeSleepRegression();
    if (!reg.insufficient && reg.severity !== 'none') {
      dataItems.push({ text: reg.severityLabel + ' — ' + reg.maxConsecBad + ' consecutive disrupted nights', signal: 'warn' });
      if (reg.causes && reg.causes.length > 0) {
        dataItems.push({ text: 'Possible cause: ' + reg.causes[0].text, signal: 'info' });
      }
    }
  } catch(e) {}

  // Actions
  var ageM = ageAt().months;
  if (avgWakes > 2) {
    actionItems.push({ text: 'Check if wake-ups follow a pattern (same time each night)', signal: 'action' });
    actionItems.push({ text: 'Ensure last nap ends 3+ hours before bedtime', signal: 'action' });
  }
  if (ageM >= 6) {
    actionItems.push({ text: 'At ' + Math.floor(ageM) + ' months, 0-2 wakeups is typical', signal: 'info' });
  }
  actionItems.push({ text: 'Keep room dark and cool (20-22°C) through the night', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'moon', domain: 'indigo', title: 'Night Wake-ups', headline: headline,
    sections: sections,
    confidence: 'Based on ' + scores.length + ' nights' + (prevScores.length > 0 ? ' + ' + prevScores.length + ' prior' : ''),
    dataGap: null
  };
}

// ═══ HANDLER: NAPS ═══

function qaAnswerNaps(intentId) {
  var scores = _qaGetSleepScores7d();
  if (scores.length < 2) {
    return {
      icon: 'zzz', domain: 'lav', title: 'Nap Patterns', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log naps to see patterns and recommendations', signal: 'info' },
        { text: 'Track nap start time, duration, and quality', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need nap data'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var ageM = ageAt().months;
  var ageMo = Math.floor(ageM);

  // Nap counts from sleep scores
  var napCounts = scores.filter(function(s) { return s.napCount !== undefined && s.napCount !== null; }).map(function(s) { return s.napCount; });
  var avgNaps = napCounts.length > 0 ? _qaAvg(napCounts) : null;

  // Expected naps by age
  var expectedNaps = ageMo < 4 ? '3-4' : ageMo < 9 ? '2-3' : ageMo < 15 ? '2' : '1';
  var headline = avgNaps !== null ? 'Avg ' + avgNaps.toFixed(1) + ' naps/day (expected: ' + expectedNaps + ')' : 'Nap Analysis';

  if (avgNaps !== null) {
    var expectedMin = ageMo < 4 ? 3 : ageMo < 9 ? 2 : ageMo < 15 ? 2 : 1;
    var expectedMax = ageMo < 4 ? 4 : ageMo < 9 ? 3 : ageMo < 15 ? 2 : 1;
    if (avgNaps >= expectedMin && avgNaps <= expectedMax + 0.5) {
      dataItems.push({ text: avgNaps.toFixed(1) + ' naps/day — right on track for ' + ageMo + ' months', signal: 'good' });
    } else if (avgNaps < expectedMin) {
      dataItems.push({ text: avgNaps.toFixed(1) + ' naps/day — fewer than expected ' + expectedNaps + ' for this age', signal: 'warn' });
    } else {
      dataItems.push({ text: avgNaps.toFixed(1) + ' naps/day — more than typical ' + expectedNaps + ' for this age', signal: 'info' });
    }
  }

  // Nap-to-nighttime correlation
  var withNaps = scores.filter(function(s) { return s.napCount > 0; });
  var withoutNaps = scores.filter(function(s) { return s.napCount === 0; });
  if (withNaps.length >= 2 && withoutNaps.length >= 1) {
    var napAvgScore = _qaAvg(withNaps.map(function(s) { return s.score; }));
    var noNapAvgScore = _qaAvg(withoutNaps.map(function(s) { return s.score; }));
    if (napAvgScore > noNapAvgScore + 5) {
      dataItems.push({ text: 'Days with naps have better night sleep (' + napAvgScore + ' vs ' + noNapAvgScore + ')', signal: 'good' });
    } else if (noNapAvgScore > napAvgScore + 5) {
      dataItems.push({ text: 'Days without naps actually had better night sleep', signal: 'info' });
    }
  }

  // Nap schedule targets
  var targets = getSleepTargets(ageMo);
  if (targets) {
    if (targets.napHours) {
      dataItems.push({ text: 'Target nap duration: ' + targets.napHours + ' hours total per day', signal: 'info' });
    }
    if (targets.wakeWindow) {
      actionItems.push({ text: 'Wake window: ' + targets.wakeWindow + ' between naps', signal: 'action' });
    }
  }

  // Transition guidance
  if (ageMo >= 7 && ageMo <= 9) {
    actionItems.push({ text: 'Approaching 3-to-2 nap transition — watch for longer wake windows', signal: 'info' });
  } else if (ageMo >= 13 && ageMo <= 16) {
    actionItems.push({ text: 'Approaching 2-to-1 nap transition — if resisting second nap, try one longer midday nap', signal: 'info' });
  }

  actionItems.push({ text: 'Keep nap environment dark and consistent', signal: 'action' });
  if (ageMo < 12) {
    actionItems.push({ text: 'Aim to end last nap 3+ hours before bedtime', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'zzz', domain: 'lav', title: 'Nap Patterns', headline: headline,
    sections: sections,
    confidence: 'Based on ' + scores.length + ' days of sleep data',
    dataGap: null
  };
}

// ═══ HANDLER: WEIGHT CONCERN (overweight) ═══

function qaAnswerWeightConcern(intentId) {
  var gv = computeGrowthVelocity();
  if (gv.insufficient) {
    return {
      icon: 'scale', domain: 'rose', title: 'Weight Check', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Need at least 2 weight measurements to analyse', signal: 'info' },
        { text: 'Log weight in the Growth tab', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need more weight data'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var headline = 'Weight Analysis';

  if (gv.weight) {
    var w = gv.weight;
    headline = w.latest.wt + ' kg (gaining ' + w.gPerDay + ' g/day)';
    if (w.status === 'fast') {
      dataItems.push({ text: 'Weight gain is above typical range (' + w.gPerDay + ' g/day vs expected ' + w.expectedRange.min + '-' + w.expectedRange.max + ')', signal: 'warn' });
    } else if (w.status === 'on-track') {
      dataItems.push({ text: 'Weight gain is within normal range (' + w.gPerDay + ' g/day)', signal: 'good' });
    } else {
      dataItems.push({ text: 'Weight gain: ' + w.gPerDay + ' g/day (expected ' + w.expectedRange.min + '-' + w.expectedRange.max + ')', signal: 'info' });
    }
  }

  if (gv.latestPercentile !== null) {
    if (gv.latestPercentile > 85) {
      dataItems.push({ text: 'Weight at ' + gv.latestPercentile + 'th percentile — above average', signal: 'info' });
    } else {
      dataItems.push({ text: 'Weight at ' + gv.latestPercentile + 'th percentile — within normal range', signal: 'good' });
    }
  }

  // Proportionality
  if (gv.proportionFlag) {
    dataItems.push({ text: 'Weight (' + gv.proportionFlag.weightPct + 'th pct) and height (' + gv.proportionFlag.heightPct + 'th pct) are on different curves', signal: 'info' });
  }

  // At this age, rapid weight gain is rarely a concern
  var ageM = ageAt().months;
  if (ageM < 12) {
    actionItems.push({ text: 'At ' + Math.floor(ageM) + ' months, being on a higher percentile is usually fine', signal: 'good' });
    actionItems.push({ text: 'Focus on nutrient-dense foods, not calorie restriction', signal: 'action' });
  }
  actionItems.push({ text: 'Discuss any concerns with your pediatrician at the next visit', signal: 'action' });
  actionItems.push({ text: 'Encourage active play — motor activity supports healthy growth', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'scale', domain: 'rose', title: 'Weight Check', headline: headline,
    sections: sections,
    confidence: gv.weight ? 'Based on ' + (gv.percentiles || []).length + ' measurements' : null,
    dataGap: null
  };
}

// ═══ HANDLER: GROWTH (height + overall) ═══

function qaAnswerGrowth(intentId) {
  var gv = computeGrowthVelocity();
  if (gv.insufficient) {
    return {
      icon: 'ruler', domain: 'rose', title: 'Growth Analysis', headline: 'Not enough data yet',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Need at least 2 measurements to track growth velocity', signal: 'info' },
        { text: 'Log weight and height in the Growth tab', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need 2+ growth measurements'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var headline = 'Growth Analysis';

  // Weight
  if (gv.weight) {
    var w = gv.weight;
    dataItems.push({ text: 'Weight: ' + w.latest.wt + ' kg (' + (w.stale ? 'measured ' + w.daysSince + ' days ago' : 'recent'), signal: w.stale ? 'warn' : 'good' });
    var wSignal = w.status === 'on-track' ? 'good' : w.status === 'slow' || w.status === 'plateau' ? 'warn' : 'info';
    dataItems.push({ text: 'Weight velocity: ' + w.gPerDay + ' g/day (' + w.status.replace('-', ' ') + ')', signal: wSignal });
  }

  // Height
  if (gv.height) {
    var h = gv.height;
    dataItems.push({ text: 'Height: ' + h.latest.ht + ' cm (' + h.cmPerMonth + ' cm/month)', signal: h.status === 'on-track' ? 'good' : 'warn' });
  }

  // Percentile
  if (gv.latestPercentile !== null) {
    var pctSignal = gv.latestPercentile < 3 || gv.latestPercentile > 97 ? 'warn' : 'good';
    dataItems.push({ text: 'Weight percentile: ' + gv.latestPercentile + 'th', signal: pctSignal });
  }

  // Crossings
  if (gv.crossings && gv.crossings.length > 0) {
    var lastCross = gv.crossings[gv.crossings.length - 1];
    dataItems.push({ text: 'Percentile shift: ' + lastCross.direction + ' from ' + lastCross.from + 'th to ' + lastCross.to + 'th', signal: 'warn' });
    actionItems.push({ text: 'Discuss percentile crossing with pediatrician', signal: 'action' });
  }

  // Proportionality
  if (gv.proportionFlag) {
    dataItems.push({ text: 'Weight and height on different curves — check proportionality', signal: 'info' });
  }

  // Staleness
  if (gv.weight && gv.weight.stale) {
    actionItems.push({ text: 'Weight data is ' + gv.weight.daysSince + ' days old — time for a new measurement', signal: 'action' });
  }
  if (gv.height && gv.height.stale) {
    actionItems.push({ text: 'Height data is ' + gv.height.daysSince + ' days old — measure again', signal: 'action' });
  }

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Growth is on track — next measurement in 2-4 weeks', signal: 'good' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'ruler', domain: 'rose', title: 'Growth Analysis', headline: headline,
    sections: sections,
    confidence: 'Based on ' + (gv.percentiles || []).length + ' measurements',
    dataGap: null
  };
}

// ═══ HANDLER: NUTRIENT GAP ═══

function qaAnswerNutrientGap(intentId) {
  var query = (_qaCache._queryText || '').toLowerCase();

  // Detect specific nutrient from query
  var targetNutrient = null;
  var nutrientKeys = ['iron', 'calcium', 'protein', 'vitamin c', 'vitamin a', 'fibre', 'omega-3', 'zinc', 'folate', 'potassium', 'magnesium'];
  for (var ni = 0; ni < nutrientKeys.length; ni++) {
    if (query.indexOf(nutrientKeys[ni]) !== -1) { targetNutrient = nutrientKeys[ni]; break; }
  }
  // Also check tag-based aliases
  if (!targetNutrient && /\bvitamin\b/.test(query)) targetNutrient = /\bc\b/.test(query) ? 'vitamin c' : (/\ba\b/.test(query) ? 'vitamin a' : null);

  // If specific nutrient detected → deep nutrient-specific card
  if (targetNutrient) return _qaDeepNutrientCard(targetNutrient);

  // Generic: enhanced gap overview
  return _qaGenericNutrientGaps();
}

function _qaDeepNutrientCard(nutrient) {
  var sections = [];
  var nutrientLabel = nutrient.charAt(0).toUpperCase() + nutrient.slice(1);

  // 1. COVERAGE: How many days this week had this nutrient? (from heatmap)
  var coverageItems = [];
  try {
    var hm = computeNutrientHeatmap(7);
    if (hm && hm.grid && hm.grid[nutrient]) {
      var daysCovered = 0;
      var totalLogged = 0;
      var recentSources = [];
      hm.grid[nutrient].forEach(function(count, dayIdx) {
        if (hm.hasData[dayIdx]) totalLogged++;
        if (count > 0 && hm.hasData[dayIdx]) {
          daysCovered++;
          var sources = hm.foodSources[nutrient + ':' + dayIdx] || [];
          sources.forEach(function(f) { if (recentSources.indexOf(f) === -1) recentSources.push(f); });
        }
      });
      if (totalLogged > 0) {
        var pct = Math.round((daysCovered / totalLogged) * 100);
        var signal = daysCovered >= Math.ceil(totalLogged * 0.7) ? 'good' : (daysCovered >= 2 ? 'warn' : 'action');
        coverageItems.push({ text: nutrientLabel + ' covered ' + daysCovered + '/' + totalLogged + ' logged days this week (' + pct + '%)', signal: signal });
        if (recentSources.length > 0) {
          coverageItems.push({ text: 'Recent sources: ' + recentSources.slice(0, 5).join(', '), signal: 'neutral' });
        }
        // Days since last covered
        var lastCoveredIdx = -1;
        for (var li = hm.grid[nutrient].length - 1; li >= 0; li--) {
          if (hm.grid[nutrient][li] > 0) { lastCoveredIdx = li; break; }
        }
        if (lastCoveredIdx >= 0) {
          var daysAgo = hm.grid[nutrient].length - 1 - lastCoveredIdx;
          if (daysAgo > 0) coverageItems.push({ text: 'Last covered: ' + daysAgo + ' day' + (daysAgo !== 1 ? 's' : '') + ' ago', signal: daysAgo >= 3 ? 'warn' : 'info' });
        }
      } else {
        coverageItems.push({ text: 'No meal data this week to check ' + nutrientLabel + ' coverage', signal: 'info' });
      }
    }
  } catch(e) {}
  if (coverageItems.length > 0) sections.push({ label: 'THIS WEEK\'S COVERAGE', icon: zi('chart'), items: coverageItems });

  // 2. RICH FOODS: All foods from NUTRITION that contain this nutrient, with acceptance
  var richFoodItems = [];
  var acceptance = [];
  try { acceptance = computeFoodAcceptance(30); } catch(e) {}
  var acceptMap = {};
  acceptance.forEach(function(f) { acceptMap[f.food] = f; });

  var allRichFoods = [];
  Object.keys(NUTRITION).forEach(function(food) {
    var entry = NUTRITION[food];
    var hasNutrient = (entry.nutrients || []).some(function(n) { return n.toLowerCase() === nutrient; });
    var hasTag = (entry.tags || []).some(function(t) { return t.toLowerCase().indexOf(nutrient.replace(/\s+/g, '-')) !== -1; });
    if (hasNutrient || hasTag) {
      allRichFoods.push(food);
    }
  });

  // Split into served (with acceptance data) vs. untried
  var served = [];
  var untried = [];
  allRichFoods.forEach(function(food) {
    var base = _baseFoodName(food);
    if (acceptMap[base]) {
      served.push({ food: food, acc: acceptMap[base] });
    } else {
      untried.push(food);
    }
  });

  // Sort served by acceptance (most liked first)
  served.sort(function(a, b) { return b.acc.avgIntake - a.acc.avgIntake; });

  if (served.length > 0) {
    served.slice(0, 5).forEach(function(s) {
      var intakePct = Math.round(s.acc.avgIntake * 100);
      var accLabel = intakePct >= 85 ? 'loves it' : (intakePct >= 60 ? 'likes it' : (intakePct >= 40 ? 'sometimes' : 'low'));
      var signal = intakePct >= 60 ? 'good' : (intakePct >= 40 ? 'neutral' : 'warn');
      richFoodItems.push({ text: s.food + ' \u2014 ' + intakePct + '% intake (' + accLabel + ', served ' + s.acc.timesServed + 'x)', signal: signal });
    });
  }
  if (richFoodItems.length > 0) sections.push({ label: 'HER ' + nutrientLabel.toUpperCase() + '-RICH FOODS', icon: zi('bowl'), items: richFoodItems });

  // 3. TRY NEXT: Foods she hasn't had or hasn't had recently
  var tryItems = [];
  if (untried.length > 0) {
    // Prioritize age-appropriate, common Indian foods
    tryItems.push({ text: 'Not yet tried: ' + untried.slice(0, 6).join(', '), signal: 'action' });
  }
  // Low-acceptance iron foods to retry
  var lowAcc = served.filter(function(s) { return s.acc.avgIntake < 0.4; });
  if (lowAcc.length > 0) {
    tryItems.push({ text: 'Retry (low acceptance): ' + lowAcc.slice(0, 3).map(function(s) { return s.food; }).join(', '), signal: 'warn' });
  }
  // Foods she likes that are iron-rich — serve more often
  var liked = served.filter(function(s) { return s.acc.avgIntake >= 0.7 && s.acc.timesServed < 5; });
  if (liked.length > 0) {
    tryItems.push({ text: 'Serve more often (she likes these): ' + liked.slice(0, 3).map(function(s) { return s.food; }).join(', '), signal: 'good' });
  }

  // 4. TIPS: Nutrient-specific absorption and pairing advice
  var tips = _qaNutrientTips(nutrient);
  if (tips.length > 0) {
    tryItems = tryItems.concat(tips);
  }

  if (tryItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: tryItems });

  // No data at all
  if (sections.length === 0) {
    return {
      icon: 'bowl', domain: 'peach', title: nutrientLabel + '-Rich Foods',
      headline: 'Not enough data',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log meals with specific food names to track ' + nutrientLabel, signal: 'info' }
      ]}],
      dataGap: 'Need detailed meal data'
    };
  }

  var headline = allRichFoods.length + ' ' + nutrientLabel + '-rich foods available';
  if (served.length > 0) headline += ' \u00b7 ' + served.length + ' served recently';

  return {
    icon: 'bowl', domain: 'peach',
    title: nutrientLabel + '-Rich Foods',
    headline: headline,
    sections: sections,
    confidence: 'Based on 7-day heatmap + 30-day food data'
  };
}

function _qaNutrientTips(nutrient) {
  var tips = {
    'iron': [
      { text: 'Pair iron foods with vitamin C (tomato, amla, orange) for 2-3x better absorption', signal: 'info' },
      { text: 'Avoid giving milk/curd alongside iron-rich meals \u2014 calcium blocks iron absorption', signal: 'info' },
      { text: 'Best time: breakfast or lunch when absorption is highest', signal: 'info' }
    ],
    'calcium': [
      { text: 'Vitamin D3 helps calcium absorption \u2014 ensure daily D3 drops', signal: 'info' },
      { text: 'Don\'t pair calcium-rich foods with iron-rich foods in the same meal', signal: 'info' }
    ],
    'protein': [
      { text: 'Combine grains + lentils (khichdi, dal-rice) for complete protein', signal: 'info' },
      { text: 'Paneer, curd, and egg are high-quality protein sources', signal: 'info' }
    ],
    'vitamin c': [
      { text: 'Vitamin C degrades with heat \u2014 add citrus/tomato as garnish rather than cooking', signal: 'info' },
      { text: 'Pair with iron-rich meals to boost iron absorption', signal: 'info' }
    ],
    'fibre': [
      { text: 'Increase fibre gradually to avoid gas or bloating', signal: 'info' },
      { text: 'Pair with adequate fluids to prevent constipation', signal: 'info' }
    ],
    'vitamin a': [
      { text: 'Fat-soluble: add a little ghee or oil to improve absorption', signal: 'info' }
    ],
    'omega-3': [
      { text: 'Ground flaxseed or walnut powder can be added to porridge', signal: 'info' }
    ],
    'zinc': [
      { text: 'Soaking and sprouting lentils/grains increases zinc bioavailability', signal: 'info' }
    ]
  };
  return tips[nutrient] || [];
}

function _qaGenericNutrientGaps() {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Nutrient Analysis';

  try {
    var hm = computeNutrientHeatmap(7);
    if (!hm) {
      return {
        icon: 'bowl', domain: 'peach', title: 'Nutrient Gaps', headline: 'Not enough data',
        sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
          { text: 'Log meals with specific foods to track nutrients', signal: 'info' },
          { text: 'Include food names, not just "khichdi" \u2014 list ingredients', signal: 'action' }
        ]}],
        confidence: null, dataGap: 'Need detailed meal data'
      };
    }

    if (hm.gaps && hm.gaps.length > 0) {
      headline = hm.gaps.length + ' nutrient gap' + (hm.gaps.length > 1 ? 's' : '') + ' this week';
      hm.gaps.forEach(function(gap) {
        // Show which foods could fill the gap
        var richFoods = [];
        Object.keys(NUTRITION).forEach(function(food) {
          if ((NUTRITION[food].nutrients || []).some(function(n) { return n.toLowerCase() === gap.toLowerCase(); })) {
            richFoods.push(food);
          }
        });
        var foodSuggestion = richFoods.length > 0 ? richFoods.slice(0, 4).join(', ') : _suggestFoodForNutrient(gap.toLowerCase());
        dataItems.push({ text: gap + ' \u2014 missing this week. Try: ' + foodSuggestion, signal: 'warn' });
      });
    } else {
      headline = 'All key nutrients covered';
      dataItems.push({ text: 'No nutrient gaps detected this week', signal: 'good' });
    }

    // Strong coverage
    if (hm.strong && hm.strong.length > 0) {
      dataItems.push({ text: 'Strong coverage: ' + hm.strong.slice(0, 4).join(', '), signal: 'good' });
    }

    // Per-nutrient coverage summary
    HEATMAP_NUTRIENTS.forEach(function(n) {
      if (hm.grid[n.key]) {
        var hits = hm.grid[n.key].filter(function(v, i) { return v > 0 && hm.hasData[i]; }).length;
        var total = hm.hasData.filter(Boolean).length;
        if (total > 0 && hits < total) {
          // Show coverage gaps with specific food suggestions inline
        }
      }
    });
  } catch(e) {
    headline = 'Nutrient Analysis';
  }

  // Actionable tips
  actionItems.push({ text: 'Pair iron-rich foods with vitamin C for better absorption', signal: 'info' });
  actionItems.push({ text: 'Rotate food groups across meals for complete coverage', signal: 'action' });

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 5) });

  return {
    icon: 'bowl', domain: 'peach', title: 'Nutrient Gaps', headline: headline,
    sections: sections,
    confidence: 'Based on 7-day meal data',
    dataGap: null
  };
}

// ═══ HANDLER: FOOD VARIETY ═══

function qaAnswerFoodVariety(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Food Variety';

  try {
    var vs = computeVarietyScore(7);
    headline = vs.uniqueFoods + ' unique foods this week (target: ' + vs.target + ')';

    if (vs.uniqueFoods >= vs.target) {
      dataItems.push({ text: 'Good variety: ' + vs.uniqueFoods + ' unique foods this week', signal: 'good' });
    } else {
      dataItems.push({ text: 'Below target: ' + vs.uniqueFoods + '/' + vs.target + ' unique foods', signal: 'warn' });
    }
  } catch(e) {}

  // Repetition analysis
  try {
    var rep = computeFoodRepetition();
    if (rep && rep.all && rep.all.length > 0) {
      var topRep = rep.all[0];
      var repSignal = topRep.pct >= 60 ? 'warn' : topRep.pct >= 40 ? 'info' : 'good';
      dataItems.push({ text: 'Most repeated: ' + topRep.food + ' (' + topRep.days + ' of ' + topRep.totalDays + ' days)', signal: repSignal });
      if (rep.all.length > 1) {
        dataItems.push({ text: 'Second most: ' + rep.all[1].food + ' (' + rep.all[1].days + ' days)', signal: 'info' });
      }
      if (topRep.pct >= 60) {
        actionItems.push({ text: 'Rotate ' + topRep.food + ' with alternatives — try skipping it for 2 days', signal: 'action' });
      }
    }
  } catch(e) {}

  // Introduction rate
  var introCount = 0;
  var recentFoods = [];
  try {
    (foods || []).forEach(function(f) {
      if (!f.date) return;
      var daysSince = Math.round((new Date(today()) - new Date(f.date)) / 86400000);
      if (daysSince <= 7) { introCount++; recentFoods.push(f.name); }
    });
    if (introCount > 0) {
      dataItems.push({ text: introCount + ' new food' + (introCount > 1 ? 's' : '') + ' introduced this week: ' + recentFoods.join(', '), signal: 'good' });
    } else {
      dataItems.push({ text: 'No new foods introduced this week', signal: 'warn' });
      actionItems.push({ text: 'Try one new food — single-ingredient, morning meal for safety', signal: 'action' });
    }
  } catch(e) {}

  // Suggest untried foods
  var safeUntriedDefaults = ['Sweet potato', 'Pumpkin', 'Spinach', 'Oats', 'Papaya', 'Pear', 'Curd', 'Paneer'];
  var triedNames = (foods || []).map(function(f) { return f.name.toLowerCase(); });
  var suggestions = safeUntriedDefaults.filter(function(s) { return triedNames.indexOf(s.toLowerCase()) < 0; });
  if (suggestions.length > 0) {
    actionItems.push({ text: 'Try next: ' + suggestions.slice(0, 3).join(', '), signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'bowl', domain: 'peach', title: 'Food Variety', headline: headline,
    sections: sections,
    confidence: 'Based on 7-day meal data + ' + (foods || []).length + ' introduced foods',
    dataGap: null
  };
}

// ═══ HANDLER: FOOD SAFETY ═══

function qaAnswerFoodSafety(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Food Safety & Reactions';

  var reactionFoods = [];
  var okFoods = [];
  var watchFoods = [];

  (foods || []).forEach(function(f) {
    if (f.reaction === 'bad' || f.reaction === 'mild') {
      reactionFoods.push(f);
    } else if (f.reaction === 'watch') {
      watchFoods.push(f);
    } else {
      okFoods.push(f);
    }
  });

  headline = okFoods.length + ' safe, ' + reactionFoods.length + ' reactions, ' + watchFoods.length + ' watching';

  if (reactionFoods.length > 0) {
    reactionFoods.forEach(function(f) {
      var severity = f.reaction === 'bad' ? 'warn' : 'info';
      dataItems.push({ text: f.name + ' — ' + (f.reaction === 'bad' ? 'negative reaction' : 'mild reaction') + (f.date ? ' (introduced ' + f.date + ')' : ''), signal: severity });
    });
  } else {
    dataItems.push({ text: 'No food reactions recorded — all introduced foods are safe', signal: 'good' });
  }

  if (watchFoods.length > 0) {
    watchFoods.forEach(function(f) {
      dataItems.push({ text: f.name + ' — still being monitored', signal: 'info' });
    });
  }

  dataItems.push({ text: okFoods.length + ' foods confirmed safe', signal: 'good' });

  // Reaction window foods (introduced in last 3 days)
  var recentIntro = (foods || []).filter(function(f) {
    if (!f.date) return false;
    var d = Math.round((new Date(today()) - new Date(f.date)) / 86400000);
    return d <= 3 && d >= 0;
  });
  if (recentIntro.length > 0) {
    recentIntro.forEach(function(f) {
      var daysAgo = Math.round((new Date(today()) - new Date(f.date)) / 86400000);
      actionItems.push({ text: f.name + ' introduced ' + daysAgo + ' day(s) ago — still in reaction window', signal: 'warn' });
    });
    actionItems.push({ text: 'Wait 3 days before introducing another new food', signal: 'action' });
  }

  // General guidance
  var ageM = ageAt().months;
  if (ageM < 8) {
    actionItems.push({ text: 'At ' + Math.floor(ageM) + ' months, avoid honey, whole nuts, cow\'s milk as main drink', signal: 'info' });
  }
  if (reactionFoods.length > 0) {
    actionItems.push({ text: 'Reintroduce reaction foods after 2-4 weeks with pediatrician guidance', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'warn', domain: 'amber', title: 'Food Safety & Reactions', headline: headline,
    sections: sections,
    confidence: 'Based on ' + (foods || []).length + ' introduced foods',
    dataGap: null
  };
}

// ═══ HANDLER: TEXTURE PROGRESSION ═══

function qaAnswerTexture(intentId) {
  var dataItems = [];
  var actionItems = [];

  try {
    var tex = computeTextureProgression();
    if (!tex || !tex.currentStage) {
      return {
        icon: 'spoon', domain: 'peach', title: 'Texture Progression', headline: 'Not enough data',
        sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
          { text: 'Log more detailed meal descriptions to track texture', signal: 'info' },
          { text: 'Mention words like puree, mashed, soft, finger food in meals', signal: 'action' }
        ]}],
        confidence: null, dataGap: 'Need detailed meal data'
      };
    }

    var texLabels = { puree: 'Puree', mashed: 'Mashed/Porridge', soft: 'Soft chunks', finger: 'Finger food' };
    var stageIdx = { puree: 0, mashed: 1, soft: 2, finger: 3 };
    var ageM = ageAt().months;
    var ageMo = Math.floor(ageM);
    var expectedTex = ageMo < 7 ? 'puree' : ageMo < 8 ? 'mashed' : ageMo < 10 ? 'soft' : 'finger';
    var headline = 'Current: ' + texLabels[tex.currentStage] + ' (expected: ' + texLabels[expectedTex] + ')';

    var currentIdx = stageIdx[tex.currentStage] || 0;
    var expectedIdx = stageIdx[expectedTex] || 0;

    if (currentIdx >= expectedIdx) {
      dataItems.push({ text: 'Texture is age-appropriate or ahead — great progress', signal: 'good' });
    } else {
      dataItems.push({ text: 'Currently at ' + texLabels[tex.currentStage] + ' stage — expected ' + texLabels[expectedTex] + ' by ' + ageMo + ' months', signal: 'warn' });
      actionItems.push({ text: 'Gradually advance to ' + texLabels[expectedTex] + ' textures', signal: 'action' });
    }

    // Stage percentages
    if (tex.stageCounts) {
      var total = Object.values(tex.stageCounts).reduce(function(s, v) { return s + v; }, 0);
      if (total > 0) {
        Object.keys(tex.stageCounts).forEach(function(stage) {
          var pct = Math.round(tex.stageCounts[stage] / total * 100);
          if (pct > 0) {
            dataItems.push({ text: texLabels[stage] + ': ' + pct + '% of meals', signal: 'info' });
          }
        });
      }
    }

    // First seen dates
    if (tex.firstSeen) {
      Object.keys(tex.firstSeen).forEach(function(stage) {
        if (stageIdx[stage] >= 1) {
          dataItems.push({ text: texLabels[stage] + ' first tried: ' + tex.firstSeen[stage], signal: 'info' });
        }
      });
    }

    // Guidance by stage
    if (currentIdx < expectedIdx) {
      var nextStage = Object.keys(stageIdx).find(function(k) { return stageIdx[k] === currentIdx + 1; });
      if (nextStage) {
        var stageExamples = {
          mashed: 'mashed banana, avocado, sweet potato',
          soft: 'soft-cooked carrot cubes, steamed broccoli florets',
          finger: 'toast strips, ripe mango pieces, steamed veggie sticks'
        };
        if (stageExamples[nextStage]) {
          actionItems.push({ text: 'Try ' + texLabels[nextStage] + ': ' + stageExamples[nextStage], signal: 'action' });
        }
      }
    }

    actionItems.push({ text: 'Gagging is normal and different from choking — it\'s a learning reflex', signal: 'info' });
  } catch(e) {
    return {
      icon: 'spoon', domain: 'peach', title: 'Texture Progression', headline: 'Unable to compute',
      sections: [{ label: 'WHAT TO DO', icon: zi('info'), items: [
        { text: 'Log meals with texture descriptions to enable analysis', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need meal data with texture info'
    };
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'spoon', domain: 'peach', title: 'Texture Progression', headline: headline,
    sections: sections,
    confidence: 'Based on meal texture analysis',
    dataGap: null
  };
}

// ═══ HANDLER: POOP-FOOD CORRELATION ═══

function qaAnswerPoopFood(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Food-Poop Connection';

  try {
    var corr = computeFoodPoopCorrelations();
    if (!corr || (!corr.triggers && !corr.helpers)) {
      var pScores = _qaPoopScores7d();
      if (pScores.length < 3) {
        return {
          icon: 'diaper', domain: 'amber', title: 'Food-Poop Connection', headline: 'Not enough data',
          sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
            { text: 'Log both meals and poops for at least 5 days', signal: 'info' },
            { text: 'The more data, the better the correlations', signal: 'action' }
          ]}],
          confidence: null, dataGap: 'Need 5+ days of meal + poop data'
        };
      }
    }

    if (corr) {
      // Trigger foods (foods that correlate with worse poop)
      if (corr.triggers && corr.triggers.length > 0) {
        headline = corr.triggers.length + ' trigger food' + (corr.triggers.length > 1 ? 's' : '') + ' identified';
        corr.triggers.forEach(function(t) {
          dataItems.push({ text: t.food + ' — linked to ' + (t.effect || 'digestive changes'), signal: 'warn' });
        });
        actionItems.push({ text: 'Reduce or eliminate trigger foods for 3-5 days to confirm', signal: 'action' });
      }

      // Helper foods (foods that correlate with better poop)
      if (corr.helpers && corr.helpers.length > 0) {
        corr.helpers.forEach(function(h) {
          dataItems.push({ text: h.food + ' — associated with better digestion', signal: 'good' });
        });
        actionItems.push({ text: 'Include more of the helper foods in regular meals', signal: 'action' });
      }

      // Transit window
      if (corr.transitWindow) {
        dataItems.push({ text: 'Typical transit window: ' + corr.transitWindow + ' hours', signal: 'info' });
      }
    }
  } catch(e) {}

  if (dataItems.length === 0) {
    dataItems.push({ text: 'No strong food-poop correlations found yet', signal: 'info' });
    dataItems.push({ text: 'Need more data to detect patterns — keep logging both meals and poops', signal: 'info' });
  }

  // General fibre guidance
  actionItems.push({ text: 'High-fibre foods (banana, pear, prunes) help regulate digestion', signal: 'action' });
  if (actionItems.length < 3) {
    actionItems.push({ text: 'Watch for changes 12-24 hours after introducing new foods', signal: 'info' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'diaper', domain: 'amber', title: 'Food-Poop Connection', headline: headline,
    sections: sections,
    confidence: 'Based on meal + poop correlation analysis',
    dataGap: null
  };
}

// ═══ HANDLER: POOP COLOR ═══

function qaAnswerPoopColor(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Poop Color Analysis';

  // Gather recent poop colors
  var colorCounts = {};
  var recentPoops = [];
  (poopData || []).forEach(function(p) {
    if (!p.date || !p.color) return;
    var daysSince = Math.round((new Date(today()) - new Date(p.date)) / 86400000);
    if (daysSince <= 14) {
      colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
      recentPoops.push(p);
    }
  });

  if (recentPoops.length < 2) {
    return {
      icon: 'diaper', domain: 'amber', title: 'Poop Color', headline: 'Not enough data',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log poop color for at least a few entries to see patterns', signal: 'info' },
        { text: 'Use the color picker when logging poop', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need poop color data'
    };
  }

  // Distribution
  var totalPoops = recentPoops.length;
  var safeColors = ['brown', 'yellow', 'green', 'tan', 'orange', 'mustard'];
  var dominantColor = Object.entries(colorCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
  headline = 'Most common: ' + dominantColor[0] + ' (' + dominantColor[1] + '/' + totalPoops + ')';

  Object.entries(colorCounts).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(entry) {
    var color = entry[0];
    var count = entry[1];
    var pct = Math.round(count / totalPoops * 100);
    var isSafe = safeColors.indexOf(color) >= 0;
    dataItems.push({ text: color.charAt(0).toUpperCase() + color.slice(1) + ': ' + count + ' times (' + pct + '%)', signal: isSafe ? 'good' : 'warn' });
  });

  // Blood or mucus flags
  var bloodCount = recentPoops.filter(function(p) { return p.blood; }).length;
  var mucusCount = recentPoops.filter(function(p) { return p.mucus; }).length;
  if (bloodCount > 0) {
    dataItems.push({ text: 'Blood detected in ' + bloodCount + ' stool(s) — monitor closely', signal: 'warn' });
    actionItems.push({ text: 'Blood in stool warrants a pediatrician visit if persistent', signal: 'action' });
  }
  if (mucusCount > 0) {
    dataItems.push({ text: 'Mucus in ' + mucusCount + ' stool(s)', signal: 'info' });
  }

  // Color guidance
  var colorGuide = {
    green: 'Usually normal — can be from leafy greens, iron supplements, or fast transit',
    black: 'May indicate iron supplements or upper GI bleeding — see doctor if not on iron',
    red: 'Could be from beets/tomatoes or indicate lower GI issue — see doctor if no red food eaten',
    white: 'Unusual — may indicate a bile duct issue — see doctor promptly'
  };
  Object.keys(colorCounts).forEach(function(c) {
    if (colorGuide[c]) {
      actionItems.push({ text: c.charAt(0).toUpperCase() + c.slice(1) + ': ' + colorGuide[c], signal: c === 'white' || c === 'black' || c === 'red' ? 'warn' : 'info' });
    }
  });

  if (actionItems.length === 0) {
    actionItems.push({ text: 'Normal range: brown, yellow, green, tan, orange, mustard', signal: 'good' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'diaper', domain: 'amber', title: 'Poop Color', headline: headline,
    sections: sections,
    confidence: 'Based on ' + totalPoops + ' entries over 14 days',
    dataGap: null
  };
}

// ═══ HANDLER: ACTIVITY-SLEEP CORRELATION ═══

function qaAnswerActivitySleep(intentId) {
  var scores = _qaGetSleepScores7d();
  var actData = _qaActivityDays14d();

  if (scores.length < 3 || actData.days < 3) {
    return {
      icon: 'run', domain: 'sage', title: 'Activity-Sleep Link', headline: 'Not enough data',
      sections: [{ label: 'WHAT WE NEED', icon: zi('info'), items: [
        { text: 'Log both activities and sleep for at least 5 days', signal: 'info' },
        { text: 'The more data, the clearer the correlation', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need 5+ days of both activity and sleep data'
    };
  }

  var dataItems = [];
  var actionItems = [];
  var headline = 'How Activities Affect Sleep';

  // Correlate: days with activities vs without
  var activeSleepScores = [];
  var inactiveSleepScores = [];
  for (var i = 0; i < 14; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var sleepScore = scores.find(function(s) { return s.dateStr === ds; });
    if (!sleepScore) continue;
    var hasActivity = Array.isArray(activityLog[ds]) && activityLog[ds].length > 0;
    if (hasActivity) activeSleepScores.push(sleepScore.score);
    else inactiveSleepScores.push(sleepScore.score);
  }

  if (activeSleepScores.length >= 2 && inactiveSleepScores.length >= 1) {
    var activeAvg = _qaAvg(activeSleepScores);
    var inactiveAvg = _qaAvg(inactiveSleepScores);
    if (activeAvg > inactiveAvg + 5) {
      dataItems.push({ text: 'Active days → better sleep (avg ' + activeAvg + ' vs ' + inactiveAvg + ')', signal: 'good' });
    } else if (inactiveAvg > activeAvg + 5) {
      dataItems.push({ text: 'Interestingly, inactive days had better sleep (' + inactiveAvg + ' vs ' + activeAvg + ')', signal: 'info' });
    } else {
      dataItems.push({ text: 'Activity and sleep scores are similar on active vs rest days', signal: 'info' });
    }
  }

  // Domain effects
  var domainNames = { motor: 'Motor', language: 'Language', social: 'Social', cognitive: 'Cognitive' };
  if (actData.domainCounts) {
    var topDomain = Object.entries(actData.domainCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
    if (topDomain) {
      dataItems.push({ text: 'Most logged domain: ' + domainNames[topDomain[0]] + ' (' + topDomain[1] + ' activities in 14 days)', signal: 'info' });
    }
  }

  dataItems.push({ text: actData.days + ' active days in the last 14 days', signal: actData.days >= 7 ? 'good' : actData.days >= 3 ? 'info' : 'warn' });

  // Actions
  actionItems.push({ text: 'Morning motor activities (tummy time, crawling) have the strongest sleep benefit', signal: 'action' });
  actionItems.push({ text: 'Avoid stimulating play within 1 hour of bedtime', signal: 'action' });
  if (actData.days < 7) {
    actionItems.push({ text: 'Aim for daily activity — even 15 min of floor play helps', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'run', domain: 'sage', title: 'Activity-Sleep Link', headline: headline,
    sections: sections,
    confidence: 'Based on ' + actData.days + ' active days + ' + scores.length + ' sleep nights',
    dataGap: null
  };
}

// ═══ HANDLER: MILESTONE GENERAL ═══

function qaAnswerMilestoneGeneral(intentId) {
  var dataItems = [];
  var actionItems = [];

  try {
    var ms = calcMilestoneScore();
    var headline = 'Milestone Score: ' + ms.score + '/100';

    // Category breakdown
    var categories = ['motor', 'language', 'social', 'cognitive'];
    var catIcons = { motor: zi('run'), language: zi('chat'), social: zi('handshake'), cognitive: zi('brain') };
    var catNames = { motor: 'Motor', language: 'Language', social: 'Social', cognitive: 'Cognitive' };
    categories.forEach(function(cat) {
      var catMs = (milestones || []).filter(function(m) { return m.cat === cat; });
      var mastered = catMs.filter(function(m) { return m.status === 'mastered'; }).length;
      var inProgress = catMs.filter(function(m) { return ['emerging','practicing','consistent'].includes(m.status); }).length;
      if (catMs.length > 0) {
        var signal = mastered > 0 ? 'good' : inProgress > 0 ? 'info' : 'warn';
        dataItems.push({ text: catNames[cat] + ': ' + mastered + ' mastered, ' + inProgress + ' in progress', signal: signal, icon: catIcons[cat] });
      }
    });

    // In-progress milestones
    var inProgressMs = (milestones || []).filter(function(m) { return ['emerging','practicing','consistent'].includes(m.status); });
    if (inProgressMs.length > 0) {
      dataItems.push({ text: inProgressMs.length + ' milestone' + (inProgressMs.length > 1 ? 's' : '') + ' currently being worked on', signal: 'good' });
    }

    // Stalled milestones (in progress but no recent evidence)
    var stalled = (milestones || []).filter(function(m) {
      if (!['emerging','practicing'].includes(m.status)) return false;
      var lastDate = m.lastSeen || m.emergingAt || m.practicingAt;
      if (!lastDate) return true;
      var daysSince = Math.round((new Date() - new Date(lastDate)) / 86400000);
      return daysSince > 12;
    });
    if (stalled.length > 0) {
      stalled.forEach(function(m) {
        actionItems.push({ text: m.text + ' appears stalled — try targeted activities', signal: 'warn' });
      });
    }

    // Score components
    if (ms.components) {
      if (ms.components.recency < 50) {
        actionItems.push({ text: 'Log recent activities to keep milestone tracking current', signal: 'action' });
      }
      if (ms.components.categories < 50) {
        var missing = categories.filter(function(cat) {
          return !(milestones || []).some(function(m) { return m.cat === cat && m.status !== 'not-started'; });
        });
        if (missing.length > 0) {
          actionItems.push({ text: 'Missing activity in: ' + missing.map(function(c) { return catNames[c]; }).join(', '), signal: 'action' });
        }
      }
    }

    if (actionItems.length === 0) {
      actionItems.push({ text: 'Milestones look great — keep engaging across all domains', signal: 'good' });
    }

    var sections = [];
    if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
    if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

    return {
      icon: 'target', domain: 'lav', title: 'Milestones & Development', headline: headline,
      sections: sections,
      confidence: 'Based on ' + (milestones || []).length + ' tracked milestones',
      dataGap: null
    };
  } catch(e) {
    return {
      icon: 'target', domain: 'lav', title: 'Milestones', headline: 'Unable to compute',
      sections: [{ label: 'WHAT TO DO', icon: zi('info'), items: [
        { text: 'Log milestones and activities to enable tracking', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Need milestone data'
    };
  }
}

// ═══ HANDLER: MILESTONE SPECIFIC ═══

function qaAnswerMilestoneSpecific(intentId) {
  // Extract specific milestone from the query text
  var queryText = _qaCache._queryText || '';
  var milestoneKeywords = {
    'crawl': ['crawl', 'crawling'],
    'walk': ['walk', 'walking', 'step'],
    'talk': ['talk', 'talking', 'speak', 'speaking', 'word'],
    'sit': ['sit', 'sitting'],
    'stand': ['stand', 'standing'],
    'roll': ['roll', 'rolling'],
    'babbl': ['babble', 'babbling', 'babbl'],
    'teeth': ['teeth', 'teething', 'tooth']
  };

  var targetKeyword = null;
  Object.entries(milestoneKeywords).forEach(function(entry) {
    entry[1].forEach(function(kw) {
      if (queryText.includes(kw) && !targetKeyword) targetKeyword = entry[0];
    });
  });

  var dataItems = [];
  var actionItems = [];

  // Find matching milestones
  var matched = (milestones || []).filter(function(m) {
    if (!targetKeyword) return false;
    return m.text.toLowerCase().includes(targetKeyword);
  });

  if (matched.length === 0 && targetKeyword) {
    // No tracked milestone for this keyword
    var headline = (targetKeyword.charAt(0).toUpperCase() + targetKeyword.slice(1)) + ' — Not Tracked Yet';
    dataItems.push({ text: 'No milestone logged for "' + targetKeyword + '" yet', signal: 'info' });
    actionItems.push({ text: 'Add this milestone in the Milestones section to start tracking', signal: 'action' });

    // Age-appropriate guidance
    var ageM = ageAt().months;
    var ageGuide = {
      'crawl': { typical: '7-10', text: 'Most babies crawl between 7-10 months' },
      'walk': { typical: '9-18', text: 'Independent walking typically happens 9-18 months' },
      'talk': { typical: '12-18', text: 'First words usually appear 12-18 months' },
      'sit': { typical: '5-7', text: 'Independent sitting typically develops 5-7 months' },
      'stand': { typical: '8-12', text: 'Pulling to stand usually happens 8-12 months' },
      'roll': { typical: '4-6', text: 'Rolling both ways typically happens 4-6 months' },
      'babbl': { typical: '6-9', text: 'Babbling with consonants typically starts 6-9 months' },
      'teeth': { typical: '6-12', text: 'First teeth usually appear 6-12 months' }
    };
    if (ageGuide[targetKeyword]) {
      dataItems.push({ text: ageGuide[targetKeyword].text, signal: 'info' });
    }

    var sections = [];
    if (dataItems.length > 0) sections.push({ label: 'STATUS', icon: zi('chart'), items: dataItems });
    if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems });
    return {
      icon: 'target', domain: 'lav', title: headline, headline: headline,
      sections: sections, confidence: null, dataGap: null
    };
  }

  if (matched.length > 0) {
    var m = matched[0];
    var statusLabels = { mastered: 'Mastered', consistent: 'Consistent', practicing: 'Practicing', emerging: 'Emerging', 'not-started': 'Not started' };
    var headline = m.text + ' — ' + (statusLabels[m.status] || m.status);

    var signal = m.status === 'mastered' ? 'good' : m.status === 'consistent' || m.status === 'practicing' ? 'info' : 'warn';
    dataItems.push({ text: 'Status: ' + (statusLabels[m.status] || m.status), signal: signal });

    if (m.evidenceCount > 0) {
      dataItems.push({ text: 'Evidence count: ' + m.evidenceCount + ' observations', signal: 'good' });
    }
    if (m.firstSeen) {
      dataItems.push({ text: 'First observed: ' + m.firstSeen, signal: 'info' });
    }
    if (m.lastSeen) {
      var daysSince = Math.round((new Date() - new Date(m.lastSeen)) / 86400000);
      if (daysSince > 7) {
        dataItems.push({ text: 'Last seen ' + daysSince + ' days ago — may need more practice', signal: 'warn' });
        actionItems.push({ text: 'Create opportunities for ' + m.text.toLowerCase() + ' in daily play', signal: 'action' });
      } else {
        dataItems.push({ text: 'Last observed ' + daysSince + ' day(s) ago', signal: 'good' });
      }
    }
    if (m.masteredAt) {
      dataItems.push({ text: 'Mastered on: ' + m.masteredAt, signal: 'good' });
    }

    // Activity suggestions
    var activitySuggestions = {
      motor: 'Floor play, tummy time, obstacle courses, reaching games',
      language: 'Read together, narrate activities, sing songs, respond to babbling',
      social: 'Peek-a-boo, mirror play, social interactions with other babies',
      cognitive: 'Object permanence games, stacking toys, cause-and-effect toys'
    };
    if (m.cat && activitySuggestions[m.cat] && m.status !== 'mastered') {
      actionItems.push({ text: 'Try: ' + activitySuggestions[m.cat], signal: 'action' });
    }

    var sections = [];
    if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 5) });
    if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 3) });

    return {
      icon: 'target', domain: 'lav', title: m.text, headline: headline,
      sections: sections,
      confidence: m.evidenceCount > 0 ? 'Based on ' + m.evidenceCount + ' observations' : null,
      dataGap: null
    };
  }

  // Fallback: no keyword matched
  return qaAnswerMilestoneGeneral(intentId);
}

// ═══ HANDLER: VACCINE ═══

function qaAnswerVaccine(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Vaccination Status';

  var allVacc = vaccData || [];
  var completed = allVacc.filter(function(v) { return !v.upcoming && v.date; });
  var upcoming = allVacc.filter(function(v) { return v.upcoming; });

  headline = completed.length + ' completed, ' + upcoming.length + ' upcoming';

  // Recent vaccinations
  var recent = completed.filter(function(v) {
    var daysSince = Math.round((new Date(today()) - new Date(v.date)) / 86400000);
    return daysSince <= 30 && daysSince >= 0;
  });
  if (recent.length > 0) {
    recent.forEach(function(v) {
      var daysSince = Math.round((new Date(today()) - new Date(v.date)) / 86400000);
      dataItems.push({ text: v.name + ' — given ' + daysSince + ' day(s) ago', signal: 'good' });
    });
  }

  dataItems.push({ text: completed.length + ' vaccinations completed to date', signal: 'good' });

  // Next upcoming
  if (upcoming.length > 0) {
    var sortedUp = upcoming.slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
    var next = sortedUp[0];
    if (next.date) {
      var daysUntil = Math.round((new Date(next.date) - new Date(today())) / 86400000);
      var urgency = daysUntil <= 0 ? 'warn' : daysUntil <= 7 ? 'action' : 'info';
      if (daysUntil <= 0) {
        dataItems.push({ text: next.name + ' is due today or overdue', signal: 'warn' });
        actionItems.push({ text: 'Schedule ' + next.name + ' as soon as possible', signal: 'action' });
      } else {
        dataItems.push({ text: 'Next: ' + next.name + ' due in ' + daysUntil + ' day(s) (' + next.date + ')', signal: urgency });
      }
    } else {
      dataItems.push({ text: 'Next: ' + next.name + ' — date not set', signal: 'warn' });
      actionItems.push({ text: 'Schedule ' + next.name + ' with your pediatrician', signal: 'action' });
    }

    // Booked appointment check
    try {
      var booked = JSON.parse(localStorage.getItem('ziva_vacc_booked') || 'null');
      if (booked && booked.apptDate) {
        var apptDays = Math.round((new Date(booked.apptDate) - new Date(today())) / 86400000);
        if (apptDays >= 0) {
          dataItems.push({ text: 'Appointment booked for ' + booked.apptDate + ' (' + apptDays + ' day(s) away)', signal: 'good' });
        }
      }
    } catch(e) {}

    // Show other upcoming
    if (sortedUp.length > 1) {
      var others = sortedUp.slice(1, 3).map(function(v) { return v.name + (v.date ? ' (' + v.date + ')' : ''); }).join(', ');
      dataItems.push({ text: 'Also upcoming: ' + others, signal: 'info' });
    }
  } else {
    dataItems.push({ text: 'No upcoming vaccinations scheduled', signal: 'good' });
  }

  if (actionItems.length === 0 && upcoming.length > 0) {
    actionItems.push({ text: 'Keep vaccination records updated after each visit', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 3) });

  return {
    icon: 'syringe', domain: 'sky', title: 'Vaccinations', headline: headline,
    sections: sections,
    confidence: 'Based on ' + allVacc.length + ' vaccination records',
    dataGap: null
  };
}

// ═══ HANDLER: VACCINATION REACTION ═══

function qaAnswerVaccReaction(intentId) {
  var dataItems = [];
  var actionItems = [];
  var completed = vaccData.filter(function(v) { return !v.upcoming && v.date; });
  var withReaction = completed.filter(function(v) { return v.reaction; });

  if (withReaction.length === 0) {
    return {
      icon: 'syringe', domain: 'lav', title: 'Vaccination Reactions',
      headline: 'No reaction data yet',
      sections: [{ label: 'STATUS', icon: zi('info'), items: [
        { text: completed.length + ' vaccinations completed but no reactions logged', signal: 'info' },
        { text: 'Log reactions from the Medical tab \u2192 Past Vaccinations list', signal: 'action' }
      ]}],
      confidence: null, dataGap: 'Log reactions after each vaccination for pattern analysis'
    };
  }

  var headline = withReaction.length + ' reactions logged across ' + completed.length + ' doses';

  // Recent reactions (last 5)
  var recent = withReaction.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 5);
  recent.forEach(function(v) {
    var sev = v.reaction.charAt(0).toUpperCase() + v.reaction.slice(1);
    var syms = _vaccSymptomLabels(v.symptoms);
    var signal = v.reaction === 'none' ? 'good' : v.reaction === 'mild' ? 'info' : v.reaction === 'moderate' ? 'warn' : 'action';
    dataItems.push({ text: v.name + ': ' + sev + (syms ? ' \u2014 ' + syms : ''), signal: signal });
  });

  // Pattern analysis by family
  var familiesSeen = new Set();
  withReaction.forEach(function(v) { familiesSeen.add(_vaccFamilyKey(v.name)); });
  familiesSeen.forEach(function(fam) {
    var seriesNames = VACC_SERIES[fam];
    if (!seriesNames || seriesNames.length < 2) return;
    var seriesData = withReaction.filter(function(v) { return _vaccFamilyKey(v.name) === fam; });
    if (seriesData.length >= 2) {
      var trend = _vaccReactionTrend(seriesData);
      if (trend.trend !== 'insufficient') {
        dataItems.push({ text: fam + ': ' + trend.label, signal: trend.trend === 'decreasing' ? 'good' : trend.trend === 'increasing' ? 'warn' : 'info' });
      }
    }
  });

  // Most recent correlation
  var lastReacted = withReaction.filter(function(v) { return v.reaction !== 'none'; })
    .sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); })[0];
  if (lastReacted) {
    var corr = _vaccPostCorrelation(lastReacted.date);
    if (corr.hasData) {
      if (corr.sleepDelta !== 0) {
        actionItems.push({ text: 'After ' + lastReacted.name + ': sleep ' + (corr.sleepDelta > 0 ? '+' : '') + corr.sleepDelta + ' min vs usual', signal: corr.sleepDelta < -30 ? 'warn' : 'info' });
      }
      if (corr.feedDelta !== 0) {
        actionItems.push({ text: 'After ' + lastReacted.name + ': intake ' + (corr.feedDelta > 0 ? '+' : '') + corr.feedDelta + '% vs usual', signal: corr.feedDelta < -15 ? 'warn' : 'info' });
      }
    }
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'REACTION HISTORY', icon: zi('chart'), items: dataItems.slice(0, 8) });
  if (actionItems.length > 0) sections.push({ label: 'IMPACT ON ROUTINE', icon: zi('link'), items: actionItems.slice(0, 4) });

  return {
    icon: 'syringe', domain: 'lav', title: 'Vaccination Reactions', headline: headline,
    sections: sections,
    confidence: 'Based on ' + withReaction.length + ' reaction logs',
    dataGap: null
  };
}

// ═══ HANDLER: SUPPLEMENT ═══

function qaAnswerSupplement(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Supplement Tracking';

  try {
    var supp = computeSupplementAdherence(30);
    if (!supp || supp.length === 0) {
      return {
        icon: 'pill', domain: 'sky', title: 'Supplements', headline: 'No supplements tracked',
        sections: [{ label: 'STATUS', icon: zi('info'), items: [
          { text: 'No active supplements found — add them in the Medical tab', signal: 'info' },
          { text: 'Vitamin D3 is recommended for breastfed babies', signal: 'action' }
        ]}],
        confidence: null, dataGap: null
      };
    }

    supp.forEach(function(s) {
      headline = s.name + ': ' + s.adherenceRate + '% adherence';

      // Adherence rate
      var adhSignal = s.adherenceRate >= 90 ? 'good' : s.adherenceRate >= 70 ? 'info' : 'warn';
      dataItems.push({ text: 'Adherence: ' + s.adherenceRate + '% (' + s.doneCount + '/' + s.totalDays + ' days)', signal: adhSignal });

      // Streak
      if (s.currentStreak > 0) {
        dataItems.push({ text: 'Current streak: ' + s.currentStreak + ' consecutive days', signal: s.currentStreak >= 7 ? 'good' : 'info' });
      } else {
        dataItems.push({ text: 'Streak broken — missed recently', signal: 'warn' });
      }

      // Longest streak
      if (s.longestStreak > s.currentStreak) {
        dataItems.push({ text: 'Best streak: ' + s.longestStreak + ' days', signal: 'info' });
      }

      // Timing analysis
      if (s.timing) {
        var timeStr = _siMinToBedtime(s.timing.avgMin);
        dataItems.push({ text: 'Usual time: ' + s.timing.bestWindow + ' (' + s.timing.consistency.toLowerCase() + ')', signal: s.timing.consistency === 'Consistent' ? 'good' : 'info' });
      }

      // Trend
      if (s.trend === 'improving') {
        dataItems.push({ text: 'Trend: improving — adherence is getting better', signal: 'good' });
      } else if (s.trend === 'declining') {
        dataItems.push({ text: 'Trend: declining — adherence dropped recently', signal: 'warn' });
        actionItems.push({ text: 'Set a daily reminder to get back on track', signal: 'action' });
      }

      // Flagged days
      if (s.flaggedDays && s.flaggedDays.length > 0) {
        dataItems.push({ text: 'Most likely to miss on: ' + s.flaggedDays.join(', '), signal: 'warn' });
        actionItems.push({ text: 'Set extra reminders for ' + s.flaggedDays.join(', '), signal: 'action' });
      }

      // Today's status
      var todayEntry = (medChecks || {})[today()];
      var todayStatus = todayEntry ? todayEntry[s.name] : undefined;
      if (!todayStatus) {
        actionItems.push({ text: 'Not given today yet — don\'t forget!', signal: 'action' });
      } else if (todayStatus.indexOf('done') === 0) {
        var timeGiven = todayStatus.replace('done:', '');
        actionItems.push({ text: 'Given today at ' + timeGiven, signal: 'good' });
      }
    });
  } catch(e) {
    return {
      icon: 'pill', domain: 'sky', title: 'Supplements', headline: 'Unable to compute',
      sections: [{ label: 'STATUS', icon: zi('info'), items: [
        { text: 'Check supplement setup in the Medical tab', signal: 'action' }
      ]}],
      confidence: null, dataGap: null
    };
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'pill', domain: 'sky', title: 'Supplement Tracking', headline: headline,
    sections: sections,
    confidence: 'Based on 30-day adherence data',
    dataGap: null
  };
}

// ═══ HANDLER: ILLNESS ═══

function qaAnswerIllness(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Health Status';

  try {
    var episodes = _getAllEpisodes();
    var active = episodes.filter(function(e) { return e.status === 'active'; });
    var resolved = episodes.filter(function(e) { return e.status === 'resolved'; });

    if (episodes.length === 0) {
      return {
        icon: 'medical', domain: 'sky', title: 'Health Status', headline: 'No illness episodes recorded',
        sections: [{ label: 'STATUS', icon: zi('check'), items: [
          { text: 'No illness episodes on record — great!', signal: 'good' },
          { text: 'Use the Illness Tracker when symptoms appear', signal: 'info' }
        ]}],
        confidence: null, dataGap: null
      };
    }

    // Active illnesses
    if (active.length > 0) {
      headline = active.length + ' active illness episode' + (active.length > 1 ? 's' : '');
      active.forEach(function(ep) {
        var dur = Math.max(1, Math.ceil((new Date() - new Date(ep.startedAt)) / 86400000));
        var typeLabel = ep.illnessType.charAt(0).toUpperCase() + ep.illnessType.slice(1);
        dataItems.push({ text: typeLabel + ' — active for ' + dur + ' day(s)', signal: 'warn' });
      });

      // Illness-appropriate food
      actionItems.push({ text: 'Offer light, easy-to-digest foods (rice porridge, dal water, banana)', signal: 'action' });
      actionItems.push({ text: 'Keep up breast/formula feeds — hydration is key', signal: 'action' });

      // When to see doctor
      if (active.some(function(e) { return e.illnessType === 'fever'; })) {
        actionItems.push({ text: 'See doctor if fever persists >3 days or exceeds 102°F/39°C', signal: 'warn' });
      }
      if (active.some(function(e) { return e.illnessType === 'diarrhoea'; })) {
        actionItems.push({ text: 'Watch for dehydration signs (dry lips, fewer wet diapers, listlessness)', signal: 'warn' });
      }
    } else {
      headline = 'No active illness — ' + resolved.length + ' past episode(s)';
      dataItems.push({ text: 'No active illness right now', signal: 'good' });
    }

    // Recent resolved
    var recentResolved = resolved.filter(function(e) {
      var daysSince = Math.round((new Date() - new Date(e.resolvedAt || e.startedAt)) / 86400000);
      return daysSince <= 14;
    });
    if (recentResolved.length > 0) {
      recentResolved.forEach(function(ep) {
        var dur = _episodeDurationDays(ep);
        var typeLabel = ep.illnessType.charAt(0).toUpperCase() + ep.illnessType.slice(1);
        var endDate = ep.resolvedAt ? new Date(ep.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
        dataItems.push({ text: typeLabel + ' — resolved after ' + dur + ' day(s)' + (endDate ? ' (' + endDate + ')' : ''), signal: 'good' });
      });
      if (active.length === 0) {
        actionItems.push({ text: 'Recovery period — continue nutrient-rich meals to rebuild', signal: 'action' });
      }
    }

    // History summary
    if (episodes.length > 3) {
      var typeCounts = {};
      episodes.forEach(function(e) { typeCounts[e.illnessType] = (typeCounts[e.illnessType] || 0) + 1; });
      var summary = Object.entries(typeCounts).map(function(e) { return e[1] + ' ' + e[0]; }).join(', ');
      dataItems.push({ text: 'Total episodes: ' + summary, signal: 'info' });
    }
  } catch(e) {
    return {
      icon: 'medical', domain: 'sky', title: 'Health Status', headline: 'Unable to load illness data',
      sections: [{ label: 'STATUS', icon: zi('info'), items: [
        { text: 'Use the Illness Tracker to log symptoms', signal: 'action' }
      ]}],
      confidence: null, dataGap: null
    };
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 6) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 4) });

  return {
    icon: 'medical', domain: 'sky', title: 'Health Status', headline: headline,
    sections: sections,
    confidence: 'Based on illness tracker data',
    dataGap: null
  };
}

// ═══ HANDLER: TOMORROW ═══

function qaAnswerTomorrow(intentId) {
  var dataItems = [];
  var actionItems = [];
  var headline = 'Tomorrow\'s Plan';

  // Check if Tomorrow's Prep data exists
  var tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  var tomorrowStr = toDateStr(tomorrowDate);
  var tomorrowDay = tomorrowDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  headline = 'Plan for ' + tomorrowDay;

  // Meal suggestions based on gaps
  try {
    var hm = computeNutrientHeatmap(7);
    if (hm && hm.gaps && hm.gaps.length > 0) {
      dataItems.push({ text: 'Nutrient gaps to fill: ' + hm.gaps.slice(0, 3).join(', '), signal: 'warn' });
      hm.gaps.slice(0, 2).forEach(function(gap) {
        try {
          var sug = _suggestFoodForNutrient(gap.toLowerCase());
          if (sug && sug !== 'a variety of foods') {
            actionItems.push({ text: 'Include ' + sug + ' for ' + gap, signal: 'action' });
          }
        } catch(e2) {}
      });
    } else {
      dataItems.push({ text: 'Nutrients are well covered — keep up the variety', signal: 'good' });
    }
  } catch(e) {}

  // Sleep target
  try {
    var drift = computeBedtimeDrift();
    if (!drift.insufficient && drift.direction === 'later') {
      var target = _siMinToBedtime(drift.avgBedtime - 15);
      actionItems.push({ text: 'Bedtime target: ' + target + ' (pulling back 15 min)', signal: 'action' });
    }
  } catch(e) {}

  // Activity suggestion
  var actData = _qaActivityDays14d();
  if (actData.domainCounts) {
    var catNames = { motor: 'Motor', language: 'Language', social: 'Social', cognitive: 'Cognitive' };
    var weakestDomain = null;
    var weakestCount = Infinity;
    ['motor', 'language', 'social', 'cognitive'].forEach(function(dom) {
      var count = actData.domainCounts[dom] || 0;
      if (count < weakestCount) { weakestCount = count; weakestDomain = dom; }
    });
    if (weakestDomain) {
      var domainActivities = {
        motor: 'tummy time, crawling practice, or standing exercises',
        language: 'reading, singing, or narrating activities',
        social: 'peek-a-boo, mirror play, or social interaction',
        cognitive: 'stacking toys, object permanence games, or puzzle play'
      };
      actionItems.push({ text: 'Focus on ' + catNames[weakestDomain] + ': ' + (domainActivities[weakestDomain] || 'age-appropriate activities'), signal: 'action' });
    }
  }

  // Vaccination reminder
  try {
    var nextVacc = (vaccData || []).find(function(v) { return v.upcoming && v.date; });
    if (nextVacc) {
      var daysUntil = Math.round((new Date(nextVacc.date) - new Date(today())) / 86400000);
      if (daysUntil <= 3 && daysUntil >= 0) {
        dataItems.push({ text: 'Vaccination ' + nextVacc.name + ' due in ' + daysUntil + ' day(s)', signal: 'warn' });
      }
    }
  } catch(e) {}

  // Supplement reminder
  try {
    var supp = computeSupplementAdherence(7);
    if (supp && supp.length > 0) {
      supp.forEach(function(s) {
        if (s.adherenceRate < 80) {
          actionItems.push({ text: 'Don\'t forget ' + s.name + ' tomorrow (adherence: ' + s.adherenceRate + '%)', signal: 'action' });
        }
      });
    }
  } catch(e) {}

  if (dataItems.length === 0 && actionItems.length === 0) {
    dataItems.push({ text: 'Log more data to get personalised tomorrow plans', signal: 'info' });
    actionItems.push({ text: 'Track meals, sleep, and activities for better recommendations', signal: 'action' });
  }

  var sections = [];
  if (dataItems.length > 0) sections.push({ label: 'WHAT THE DATA SHOWS', icon: zi('chart'), items: dataItems.slice(0, 4) });
  if (actionItems.length > 0) sections.push({ label: 'WHAT TO TRY', icon: zi('bulb'), items: actionItems.slice(0, 5) });

  return {
    icon: 'sun', domain: 'peach', title: 'Tomorrow\'s Plan', headline: headline,
    sections: sections,
    confidence: 'Based on recent trends and gaps',
    dataGap: null
  };
}

// ═══ SMART Q&A — END ═══

function sgToggleMore() {
  const extras = document.querySelectorAll('[data-sg-extra]');
  const toggle = document.getElementById('sgMoreToggle');
  if (!toggle || extras.length === 0) return;
  const isHidden = extras[0].style.display === 'none';
  extras.forEach(el => el.style.display = isHidden ? '' : 'none');
  toggle.textContent = isHidden ? 'Show less ▴' : ('Show ' + extras.length + ' more ▾');
}

function sgTapChip(food) {
  // Find next empty meal and open Quick Log with prefill
  const nextMeal = _sgNextEmptyMeal();
  if (!nextMeal) {
    showQLToast('All meals are filled for today');
    return;
  }
  openQuickLog();
  openQuickModal('feed');
  // Set meal + prefill after modal opens (openQuickModal resets _qlMeal via detectMealType)
  setTimeout(function() {
    _qlMeal = nextMeal;
    const inp = document.getElementById('qlFeedInput');
    if (inp) {
      inp.value = food;
      inp.focus();
      updateQLFeedDropdown();
    }
    // Select correct meal pill
    document.querySelectorAll('.ql-meal-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.meal === nextMeal);
    });
  }, 50);
}

function matchSuggestionsAfterSave(dateStr) {
  const dayData = _suggestionsData[dateStr];
  if (!dayData || !dayData.items) return;

  const dayFoods = extractDayFoods(dateStr);
  const dayBases = new Set(dayFoods.map(f => _baseFoodName(f)));

  let changed = false;
  dayData.items.forEach(item => {
    if (item.adopted) return; // already matched
    // Check if any suggested food appears in today's meals
    const match = item.foods.some(f => {
      const base = _baseFoodName(f.toLowerCase().trim());
      return dayBases.has(base) || dayFoods.some(df => df.includes(f.toLowerCase().trim()) || f.toLowerCase().trim().includes(df));
    });
    if (match) {
      item.adopted = true;
      item.matchedAt = new Date().toISOString();
      // Find which meal it matched
      const entry = feedingData[dateStr] || {};
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(m => {
        if (item.matchedMeal) return;
        const val = (entry[m] || '').toLowerCase();
        if (item.foods.some(f => val.includes(f.toLowerCase().trim()))) {
          item.matchedMeal = m;
        }
      });
      changed = true;
    }
  });

  if (changed) {
    const adoptedCount = dayData.items.filter(i => i.adopted).length;
    dayData.adoptionRate = adoptedCount / dayData.items.length;
    save(KEYS.suggestions, _suggestionsData);
    // Refresh Home card if visible
    const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
    if (curTab === 'home') renderHomeSuggestions();
  }
}

function computeAdoptionStats(windowDays) {
  windowDays = windowDays || 30;
  const todayDate = new Date(today());
  const days = [];
  let totalAdopted = 0, totalItems = 0;
  const byType = { 'nutrient-gap': { adopted: 0, total: 0 }, 'synergy': { adopted: 0, total: 0 }, 'template': { adopted: 0, total: 0 }, 'hydration': { adopted: 0, total: 0 } };
  const foodAdopted = {}, foodIgnored = {};

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayData = _suggestionsData[ds];

    if (!dayData || !dayData.items || dayData.items.length === 0) {
      days.push({ date: ds, rate: null, items: 0 });
      continue;
    }

    const dayAdopted = dayData.items.filter(it => it.adopted).length;
    const dayTotal = dayData.items.length;
    const rate = dayTotal > 0 ? dayAdopted / dayTotal : 0;
    days.push({ date: ds, rate: rate, items: dayTotal, adopted: dayAdopted });

    totalAdopted += dayAdopted;
    totalItems += dayTotal;

    dayData.items.forEach(item => {
      if (byType[item.type]) {
        byType[item.type].total++;
        if (item.adopted) byType[item.type].adopted++;
      }
      (item.foods || []).forEach(f => {
        const base = _baseFoodName(f.toLowerCase().trim());
        if (item.adopted) {
          foodAdopted[base] = (foodAdopted[base] || 0) + 1;
        } else if (ds !== today()) {
          // only count as ignored if day is in the past
          foodIgnored[base] = (foodIgnored[base] || 0) + 1;
        }
      });
    });
  }

  const overallRate = totalItems > 0 ? totalAdopted / totalItems : 0;

  // Weekly trend: compare last 7 days vs previous 7
  const recentDays = days.slice(-7).filter(d => d.rate !== null);
  const prevDays = days.slice(-14, -7).filter(d => d.rate !== null);
  const recentAvg = recentDays.length > 0 ? recentDays.reduce((s, d) => s + d.rate, 0) / recentDays.length : 0;
  const prevAvg = prevDays.length > 0 ? prevDays.reduce((s, d) => s + d.rate, 0) / prevDays.length : 0;
  let trend = 'stable';
  if (recentDays.length >= 2 && prevDays.length >= 2) {
    if (recentAvg > prevAvg + 0.1) trend = 'improving';
    else if (recentAvg < prevAvg - 0.1) trend = 'declining';
  }

  // Top adopted/ignored (last 14 days)
  const topAdopted = Object.entries(foodAdopted).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topIgnored = Object.entries(foodIgnored).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return { days, overallRate, totalAdopted, totalItems, byType, trend, topAdopted, topIgnored };
}

function renderInfoAdoption() {
  const card = document.getElementById('infoAdoptionCard');
  const summaryEl = document.getElementById('infoAdoptionSummary');
  const heatmapEl = document.getElementById('infoAdoptionHeatmap');
  const typesEl = document.getElementById('infoAdoptionTypes');
  const foodsEl = document.getElementById('infoAdoptionFoods');
  if (!card || !summaryEl) return;

  const data = computeAdoptionStats(30);

  // Need at least 2 days of data to show the card
  const daysWithData = data.days.filter(d => d.rate !== null).length;
  if (daysWithData < 2) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  // Summary line
  const pct = Math.round(data.overallRate * 100);
  const trendIcon = data.trend === 'improving' ? '↗' : data.trend === 'declining' ? '↘' : '→';
  const trendColor = data.trend === 'improving' ? 'var(--tc-sage)' : data.trend === 'declining' ? 'var(--tc-amber)' : 'var(--light)';
  const trendLabel = data.trend === 'improving' ? 'improving' : data.trend === 'declining' ? 'declining' : 'steady';
  summaryEl.innerHTML = '<div class="fx-row g8 fx-row-wrap" >' +
    '<div class="t-sm fw-600" >' + pct + '% overall</div>' +
    '<div class="t-sm t-light" >·</div>' +
    '<div class="t-sm" style="color:' + trendColor + ';font-weight:500;">' + trendIcon + ' ' + trendLabel + '</div>' +
    '</div>';

  // Heatmap: 7 columns, start from Monday
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let hmHtml = '<div class="sa-heatmap">';
  // Day headers
  DAY_LABELS.forEach(d => { hmHtml += '<div class="sa-day-label">' + d + '</div>'; });

  // Pad to start on correct weekday (Monday = 0)
  const firstDate = new Date(data.days[0].date);
  const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0 .. Sun=6
  for (let p = 0; p < firstDow; p++) {
    hmHtml += '<div class="sa-cell sa-cell-empty"></div>';
  }

  const todayStr = today();
  data.days.forEach(d => {
    const isToday = d.date === todayStr;
    let cls = 'sa-cell';
    if (d.rate === null) {
      cls += ' sa-cell-empty';
    } else {
      const r = d.rate;
      if (r >= 0.8) cls += ' sa-cell-100';
      else if (r >= 0.6) cls += ' sa-cell-75';
      else if (r >= 0.4) cls += ' sa-cell-50';
      else if (r > 0) cls += ' sa-cell-25';
      else cls += ' sa-cell-0';
    }
    if (isToday) cls += ' sa-cell-today';
    const title = d.rate !== null ? (d.date + ': ' + Math.round(d.rate * 100) + '% (' + d.adopted + '/' + d.items + ')') : (d.date + ': no suggestions');
    hmHtml += '<div class="' + cls + '" title="' + title + '"></div>';
  });
  hmHtml += '</div>';
  if (heatmapEl) heatmapEl.innerHTML = hmHtml;

  // Type breakdown
  const typeConfig = [
    { key: 'nutrient-gap', icon: zi('drop'), label: 'Nutrient gap', fillCls: 'sa-type-fill-gap' },
    { key: 'synergy', icon: zi('sparkle'), label: 'Synergy', fillCls: 'sa-type-fill-syn' },
    { key: 'template', icon: zi('bowl'), label: 'Template', fillCls: 'sa-type-fill-tpl' },
    { key: 'hydration', icon: zi('drop'), label: 'Hydration', fillCls: 'sa-type-fill-hyd' },
  ];
  let typesHtml = '';
  typeConfig.forEach(tc => {
    const d = data.byType[tc.key];
    const pct = d.total > 0 ? Math.round((d.adopted / d.total) * 100) : 0;
    const fillW = d.total > 0 ? pct : 0;
    typesHtml += '<div class="sa-type-row">';
    typesHtml += '<div class="sa-type-icon">' + tc.icon + '</div>';
    typesHtml += '<div class="sa-type-label">' + tc.label + '</div>';
    typesHtml += '<div class="sa-type-bar"><div class="sa-type-fill ' + tc.fillCls + '" style="width:' + fillW + '%;"></div></div>';
    typesHtml += '<div class="sa-type-pct" style="color:' + (pct >= 60 ? 'var(--tc-sage)' : pct >= 30 ? 'var(--tc-amber)' : 'var(--tc-rose)') + ';">' + pct + '%</div>';
    typesHtml += '</div>';
  });
  if (typesEl) typesEl.innerHTML = typesHtml;

  // Top adopted / often skipped
  let foodsHtml = '';
  if (data.topAdopted.length > 0) {
    foodsHtml += '<div class="sa-foods">Top adopted: <strong>' +
      data.topAdopted.map(([f, c]) => f + ' (' + c + '×)').join(', ') +
      '</strong></div>';
  }
  if (data.topIgnored.length > 0) {
    foodsHtml += '<div class="sa-foods">Often skipped: ' +
      data.topIgnored.map(([f, c]) => f + ' (0/' + c + ')').join(', ') +
      '</div>';
  }
  if (foodsEl) foodsEl.innerHTML = foodsHtml;
}

// ── EPISODE ENTRY EDIT/DELETE SYSTEM (shared across all illness trackers) ──

/**
 * Returns the current time as HH:MM string
 */
function _epNowTimeStr() { return new Date().toTimeString().slice(0, 5); }

/**
 * Converts a HH:MM time string to a full ISO string for today (or yesterday if time > now suggesting it was yesterday)
 */
function _epTimeToISO(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return new Date().toISOString();
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // If the selected time is >2h in the future, assume they meant yesterday
  if (d.getTime() > Date.now() + 7200000) d.setDate(d.getDate() - 1);
  return d.toISOString();
}

/**
 * Returns HTML for a shared time picker row used before log chips
 * @param {string} id - unique id prefix for the time input
 */
function _epTimePickerHTML(id) {
  return '<div class="ep-time-row">' +
    '<label>⏱ Time:</label>' +
    '<input type="time" id="' + id + 'TimeInput" value="' + _epNowTimeStr() + '">' +
    '<span class="ep-now-btn" onclick="document.getElementById(\'' + id + 'TimeInput\').value=_epNowTimeStr()">Now</span>' +
    '</div>';
}

/**
 * Gets the selected time from a time picker as ISO string
 */
function _epGetSelectedTime(id) {
  const el = document.getElementById(id + 'TimeInput');
  return el ? _epTimeToISO(el.value) : new Date().toISOString();
}

/**
 * Opens an edit bottom sheet for an episode entry.
 * @param {object} opts
 *   - title: string (e.g. "Edit Stool Entry")
 *   - fields: array of { label, id, type, value, options? }
 *   - onSave: function(values) called with { id: newValue } map
 *   - onDelete: function() called when delete is tapped
 */
function _epEditEntry(opts) {
  const overlay = document.createElement('div');
  overlay.className = 'ep-edit-overlay';

  let fieldsHTML = '';
  (opts.fields || []).forEach(f => {
    fieldsHTML += '<div class="ep-edit-field">';
    fieldsHTML += '<div class="ep-edit-label">' + escHtml(f.label) + '</div>';
    if (f.type === 'time') {
      const timeVal = f.value ? (typeof f.value === 'string' && f.value.includes('T') ? f.value.split('T')[1].slice(0, 5) : f.value) : _epNowTimeStr();
      fieldsHTML += '<input type="time" class="ep-edit-input" id="epEdit_' + f.id + '" value="' + timeVal + '">';
    } else if (f.type === 'select' && f.options) {
      fieldsHTML += '<select class="ep-edit-input" id="epEdit_' + f.id + '">';
      f.options.forEach(o => {
        const sel = o.value === f.value ? ' selected' : '';
        fieldsHTML += '<option value="' + escHtml(o.value) + '"' + sel + '>' + escHtml(o.label) + '</option>';
      });
      fieldsHTML += '</select>';
    } else if (f.type === 'number') {
      fieldsHTML += '<input type="number" class="ep-edit-input" id="epEdit_' + f.id + '" value="' + (f.value || '') + '" step="' + (f.step || '0.1') + '" inputmode="decimal">';
    } else {
      fieldsHTML += '<input type="text" class="ep-edit-input" id="epEdit_' + f.id + '" value="' + escHtml(f.value || '') + '">';
    }
    fieldsHTML += '</div>';
  });

  overlay.innerHTML = '<div class="ep-edit-sheet">' +
    '<div class="ep-edit-title">' + escHtml(opts.title || 'Edit Entry') + '</div>' +
    fieldsHTML +
    '<div class="ep-edit-btns">' +
    '<button class="btn btn-rose" id="epEditDelete">Delete</button>' +
    '<button class="btn btn-ghost" id="epEditCancel">Cancel</button>' +
    '<button class="btn btn-sky" id="epEditSave">Save</button>' +
    '</div></div>';

  document.body.appendChild(overlay);

  overlay.querySelector('#epEditCancel').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.querySelector('#epEditDelete').onclick = () => {
    overlay.remove();
    if (opts.onDelete) {
      confirmAction('Delete this entry?', opts.onDelete, 'Delete');
    }
  };

  overlay.querySelector('#epEditSave').onclick = () => {
    const values = {};
    (opts.fields || []).forEach(f => {
      const el = document.getElementById('epEdit_' + f.id);
      if (el) values[f.id] = el.value;
    });
    overlay.remove();
    if (opts.onSave) opts.onSave(values);
  };
}


// ── FEVER EPISODE TRACKING (v2.9) ──

let _feverEpisodes = [];
try { _feverEpisodes = JSON.parse(localStorage.getItem(KEYS.feverEpisodes)) || []; } catch { _feverEpisodes = []; }
if (!Array.isArray(_feverEpisodes)) _feverEpisodes = [];

let _feverCountdownInterval = null;

function getActiveFeverEpisode() {
  return _feverEpisodes.find(e => e.status === 'active') || null;
}

function getFeverSeverity(tempF) {
  if (tempF >= 104) return { tier: 'critical', label: 'Critical — seek care', checkMins: 15, color: 'var(--tc-danger)' };
  if (tempF >= 102.1) return { tier: 'high', label: 'High fever', checkMins: 30, color: 'var(--tc-danger)' };
  if (tempF >= 100.5) return { tier: 'moderate', label: 'Moderate', checkMins: 60, color: 'var(--tc-caution)' };
  if (tempF >= 99.1) return { tier: 'mild', label: 'Mild fever', checkMins: 120, color: 'var(--tc-amber)' };
  return { tier: 'low-grade', label: 'Low-grade', checkMins: 240, color: 'var(--tc-amber)' };
}

function getParacetamolDose(weightKg) {
  if (!weightKg || weightKg < 3) return null;
  const lowMg = Math.round(weightKg * 10);
  const highMg = Math.round(weightKg * 15);
  // Crocin drops: 100mg/ml
  const lowMl = (lowMg / 100).toFixed(1);
  const highMl = (highMg / 100).toFixed(1);
  return { lowMg, highMg, lowMl, highMl, display: lowMl + '–' + highMl + ' ml' };
}

function pruneFeverEpisodes() {
  if (_feverEpisodes.length > 20) {
    _feverEpisodes = _feverEpisodes.slice(-20);
  }
}

function startFeverEpisode(tempF, source) {
  // Don't create if one is already active
  if (getActiveFeverEpisode()) return getActiveFeverEpisode();
  pruneFeverEpisodes();
  const now = new Date().toISOString();
  const episode = {
    id: 'fe-' + Date.now(),
    status: 'active',
    startedAt: now,
    resolvedAt: null,
    readings: [{ time: now, temp: tempF, notes: '' }],
    doses: [],
    actions: [],
    peakTemp: tempF,
    triggerSource: source || 'manual',
    notes: '',
    resolvedNotes: ''
  };
  _feverEpisodes.push(episode);
  save(KEYS.feverEpisodes, _feverEpisodes);
  _startFeverCountdown();
  return episode;
}

function logFeverReading(tempF, timeStr, notes) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  const time = timeStr || new Date().toISOString();
  ep.readings.push({ time: time, temp: tempF, notes: notes || '' });
  if (tempF > ep.peakTemp) ep.peakTemp = tempF;
  save(KEYS.feverEpisodes, _feverEpisodes);
  renderFeverEpisodeCard();
  renderHomeFeverBanner();
}

function logFeverDose(medicine, dose, timeStr, notes) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.doses.push({
    time: timeStr || new Date().toISOString(),
    medicine: medicine || 'Crocin / Paracetamol',
    dose: dose || '',
    notes: notes || ''
  });
  save(KEYS.feverEpisodes, _feverEpisodes);
  renderFeverEpisodeCard();
}

function logFeverAction(action, timeStr) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.actions.push({
    time: timeStr || new Date().toISOString(),
    action: action
  });
  save(KEYS.feverEpisodes, _feverEpisodes);
  renderFeverEpisodeCard();
}

function resolveFeverEpisode(notes) {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  ep.status = 'resolved';
  ep.resolvedAt = new Date().toISOString();
  ep.resolvedNotes = notes || '';
  save(KEYS.feverEpisodes, _feverEpisodes);
  _stopFeverCountdown();
  renderFeverEpisodeCard();
  renderFeverHistory();
  renderHomeFeverBanner();
  renderHome();
}

function getFeverCheckCountdown() {
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) return null;
  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const lastTime = new Date(lastReading.time).getTime();
  const elapsed = (Date.now() - lastTime) / 60000; // minutes
  const remaining = sev.checkMins - elapsed;
  return { remaining: Math.round(remaining), total: sev.checkMins, overdue: remaining <= 0, elapsed: Math.round(elapsed) };
}

function getFeverDoseCountdown() {
  const ep = getActiveFeverEpisode();
  if (!ep || ep.doses.length === 0) return null;
  const lastDose = ep.doses[ep.doses.length - 1];
  const lastTime = new Date(lastDose.time).getTime();
  const elapsed = (Date.now() - lastTime) / 60000;
  const minGap = 240; // 4 hours
  const remaining = minGap - elapsed;
  return { remaining: Math.round(remaining), available: remaining <= 0, elapsed: Math.round(elapsed) };
}

function _feverDurationStr(ep) {
  const start = new Date(ep.startedAt).getTime();
  const end = ep.resolvedAt ? new Date(ep.resolvedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return h + 'h ' + (m > 0 ? m + 'm' : '');
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return d + 'd ' + (rh > 0 ? rh + 'h' : '');
}

function _feverTimeAgo(isoStr) {
  const mins = Math.round((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const h = Math.floor(mins / 60);
  if (h < 24) return h + 'h ' + (mins % 60 > 0 ? (mins % 60) + 'm' : '') + ' ago';
  return Math.floor(h / 24) + 'd ago';
}

function _feverTimeShort(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function _feverSparklineSVG(readings) {
  if (!readings || readings.length < 2) return '';
  const w = 200, h = 40, pad = 4;
  const temps = readings.map(r => r.temp);
  const minT = Math.min(...temps) - 0.5;
  const maxT = Math.max(...temps) + 0.5;
  const range = maxT - minT || 1;
  const points = readings.map((r, i) => {
    const x = pad + (i / (readings.length - 1)) * (w - pad * 2);
    const y = h - pad - ((r.temp - minT) / range) * (h - pad * 2);
    return x + ',' + y;
  });
  // Threshold lines
  const y99 = h - pad - ((99 - minT) / range) * (h - pad * 2);
  const y102 = h - pad - ((102 - minT) / range) * (h - pad * 2);
  let svg = '<svg class="fe-sparkline" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">';
  // Reference lines
  if (y99 > pad && y99 < h - pad) {
    svg += '<line x1="' + pad + '" y1="' + y99 + '" x2="' + (w - pad) + '" y2="' + y99 + '" stroke="rgba(240,180,80,0.3)" stroke-width="1" stroke-dasharray="4,3"/>';
  }
  if (y102 > pad && y102 < h - pad) {
    svg += '<line x1="' + pad + '" y1="' + y102 + '" x2="' + (w - pad) + '" y2="' + y102 + '" stroke="rgba(224,112,112,0.3)" stroke-width="1" stroke-dasharray="4,3"/>';
  }
  // Line
  svg += '<polyline points="' + points.join(' ') + '" fill="none" stroke="var(--tc-caution)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  // Dots
  readings.forEach((r, i) => {
    const x = pad + (i / (readings.length - 1)) * (w - pad * 2);
    const y = h - pad - ((r.temp - minT) / range) * (h - pad * 2);
    const sev = getFeverSeverity(r.temp);
    const dotColor = sev.color;
    svg += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + dotColor + '"/>';
  });
  svg += '</svg>';
  return svg;
}

function renderFeverEpisodeCard() {
  const card = document.getElementById('feverEpisodeCard');
  if (!card) return;
  const ep = getActiveFeverEpisode();
  if (!ep) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  if (ep.readings.length === 0) {
    // All readings deleted — show minimal card with just the log input
    const nowTime = new Date().toTimeString().slice(0, 5);
    card.style.borderLeft = '4px solid var(--tc-amber)';
    card.innerHTML = '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Fever Episode</div><span class="t-sm t-light">' + _feverDurationStr(ep) + '</span></div>' +
      '<div style="text-align:center;padding:var(--sp-8);font-size:var(--fs-sm);color:var(--light);">No readings logged yet</div>' +
      '<div class="fe-input-row"><span class="t-sm">'+zi('flame')+'</span><input type="number" id="feverTempInput" step="0.1" min="95" max="108" placeholder="°F" inputmode="decimal"><input type="time" id="feverTimeInput" value="' + nowTime + '"><button class="btn btn-sage" data-action="feLogReadingFromInput" data-arg="" style="padding:8px 14px;">Log</button></div>' +
      '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="feResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
    return; // feverTempInput/feverTimeInput reused — mutually exclusive with full card below
  }

  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const checkCD = getFeverCheckCountdown();
  const doseCD = getFeverDoseCountdown();
  const duration = _feverDurationStr(ep);

  // Card border color
  card.style.borderLeft = '4px solid ' + sev.color;

  // Get weight for dose calc
  const latestWeight = growthData.length > 0 ? growthData[growthData.length - 1].wt : null;
  const doseInfo = getParacetamolDose(latestWeight);

  let html = '';

  // Header
  html += '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Fever Episode</div>';
  html += '<span class="t-sm t-light">' + duration + '</span></div>';

  // Temperature display
  html += '<div class="fe-temp-display" style="color:' + sev.color + ';">' + lastReading.temp.toFixed(1) + '°F</div>';
  html += '<div class="text-center"><span class="fe-severity fe-severity-' + sev.tier + '">' + sev.label + '</span></div>';
  html += '<div class="fe-last-reading">Last reading: ' + _feverTimeShort(lastReading.time) + ' (' + _feverTimeAgo(lastReading.time) + ')</div>';

  // Sparkline
  if (ep.readings.length >= 2) {
    html += _feverSparklineSVG(ep.readings);
  }

  // Quick temp input
  const nowTime = new Date().toTimeString().slice(0, 5);
  html += '<div class="fe-input-row">';
  html += '<span class="t-sm">' + zi('flame') + '</span>';
  html += '<input type="number" id="feverTempInput" step="0.1" min="95" max="108" placeholder="°F" inputmode="decimal">';
  html += '<input type="time" id="feverTimeInput" value="' + nowTime + '">';
  html += '<button class="btn btn-sage" data-action="feLogReadingFromInput" data-arg="" style="padding:8px 14px;">Log</button>';
  html += '</div>';

  // Countdown
  if (checkCD) {
    const pct = Math.max(0, Math.min(100, ((checkCD.total - Math.max(0, checkCD.remaining)) / checkCD.total) * 100));
    const isOverdue = checkCD.overdue;
    let cdText = '';
    if (isOverdue) {
      cdText = '<span style="color:var(--tc-danger);font-weight:700;">Overdue — ' + Math.abs(checkCD.remaining) + 'm</span>';
    } else if (checkCD.remaining <= 15) {
      cdText = '<span class="t-amber">' + checkCD.remaining + 'm</span>';
    } else {
      const h = Math.floor(checkCD.remaining / 60);
      const m = checkCD.remaining % 60;
      cdText = (h > 0 ? h + 'h ' : '') + m + 'm';
    }
    html += '<div class="fe-countdown" id="feverCheckCountdown">';
    html += '<div class="fe-countdown-text">Next check: ' + cdText + '</div>';
    html += '<div class="fe-countdown-bar"><div class="fe-countdown-fill' + (isOverdue ? ' fe-overdue' : '') + '" style="width:' + pct + '%;' + (isOverdue ? '' : 'background:' + sev.color + ';') + '"></div></div>';
    html += '</div>';
  }

  // Readings timeline
  html += '<div class="fe-section-title">Readings</div>';
  const showReadings = ep.readings.slice().reverse();
  const maxShow = 5;
  html += '<div class="fe-timeline">';
  showReadings.slice(0, maxShow).forEach((r, i) => {
    const rs = getFeverSeverity(r.temp);
    const origIdx = ep.readings.length - 1 - i;
    html += '<div class="fe-tl-entry ep-entry-tap" data-action="feEditReading" data-arg="' + origIdx + '">';
    html += '<div class="fe-tl-dot" style="background:' + rs.color + ';"></div>';
    if (i < Math.min(showReadings.length, maxShow) - 1) html += '<div class="fe-tl-line"></div>';
    html += '<div class="fe-tl-time">' + _feverTimeShort(r.time) + '</div>';
    html += '<div class="fe-tl-temp" style="color:' + rs.color + ';">' + r.temp.toFixed(1) + '°F</div>';
    if (r.notes) html += '<div class="fe-tl-notes">' + escHtml(r.notes) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  if (showReadings.length > maxShow) {
    html += '<div class="fe-more-toggle" data-action="feToggleAllReadings">Show ' + (showReadings.length - maxShow) + ' earlier ▾</div>';
  }

  // Medicine section
  html += '<div class="fe-section-title">Medicine</div>';
  if (ep.doses.length > 0) {
    ep.doses.slice().reverse().forEach((d, i) => {
      const origIdx = ep.doses.length - 1 - i;
      html += '<div class="fe-dose-row ep-entry-tap" data-action="feEditDose" data-arg="' + origIdx + '">'+zi('pill')+' ' + escHtml(d.medicine) + ' ' + escHtml(d.dose) + ' at ' + _feverTimeShort(d.time) + '</div>';
    });
    if (doseCD) {
      if (doseCD.available) {
        html += '<div class="fe-dose-next">Next dose available now (if needed, as advised by doctor)</div>';
      } else {
        const dh = Math.floor(doseCD.remaining / 60);
        const dm = doseCD.remaining % 60;
        html += '<div class="fe-dose-next t-light" >Next dose available in ' + (dh > 0 ? dh + 'h ' : '') + dm + 'm (min 4h gap)</div>';
      }
    }
  } else {
    html += '<div class="fe-dose-row" style="color:var(--light);font-size:var(--fs-xs);">No medicine logged yet</div>';
  }
  // Log dose button
  const defaultDose = doseInfo ? doseInfo.display : '';
  html += '<div style="padding:var(--sp-4) 0;"><span class="fe-action-chip" data-action="feLogDosePrompt">+ Log Crocin dose' + (defaultDose ? ' (' + defaultDose + ')' : '') + '</span></div>';

  // Actions section
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('feAction');
  const ACTION_CHIPS = ['Lukewarm sponging', 'Breastfed', 'Fluids given', 'Changed clothes', 'Doctor called'];
  html += '<div class="fe-action-chips">';
  ACTION_CHIPS.forEach(a => {
    html += '<span class="fe-action-chip" onclick="logFeverAction(\'' + a.replace(/'/g, "\\'") + '\', _epGetSelectedTime(\'feAction\'))">' + a + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 5).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="feEditAction" data-arg="' + origIdx + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div>';
  html += '<div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Keep Ziva lightly dressed — do not over-bundle</li>';
  html += '<li>Offer breast milk or fluids frequently</li>';
  html += '<li>Sponge with lukewarm water (never cold)</li>';
  if (sev.tier === 'high' || sev.tier === 'critical') {
    html += '<li class="status-action">'+zi('siren')+' Call doctor — temperature is ' + lastReading.temp.toFixed(1) + '°F</li>';
  } else {
    html += '<li>Call doctor if fever exceeds 102°F or lasts > 48 hours</li>';
  }
  html += '</ul></div>';

  // Escalation warnings
  const escalations = _computeFeverEscalations(ep);
  if (escalations.length > 0) {
    escalations.forEach(e => {
      html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:' + (e.severity === 'emergency' ? 'var(--surface-rose)' : 'var(--surface-caution)') + ';font-size:var(--fs-sm);font-weight:600;color:' + (e.severity === 'emergency' ? 'var(--tc-danger)' : 'var(--tc-caution)') + ';">' + e.icon + ' ' + escHtml(e.text) + '</div>';
    });
  }

  // Breaking check: 2 consecutive readings < 99
  const recentTwo = ep.readings.slice(-2);
  if (recentTwo.length >= 2 && recentTwo.every(r => r.temp < 99)) {
    html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' Temperature normalizing — continue monitoring for 6 hours before resolving</div>';
  }

  // Resolve button
  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="feResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';

  // Disclaimer
  html += '<div class="source-attribution">Guidance only — not medical advice. Trust your instincts and call your paediatrician when in doubt.</div>';

  card.innerHTML = html;
}

function _computeFeverEscalations(ep) {
  const warnings = [];
  if (ep.readings.length === 0) return warnings;
  const lastReading = ep.readings[ep.readings.length - 1];

  // Temp >= 104
  if (lastReading.temp >= 104) {
    warnings.push({ severity: 'emergency', icon: zi('siren'), text: 'Temperature is critically high — seek immediate medical attention' });
  }

  // Temp >= 102 for 2+ readings
  const highReadings = ep.readings.filter(r => r.temp >= 102);
  if (highReadings.length >= 2 && lastReading.temp < 104) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Multiple readings above 102°F — consider calling doctor' });
  }

  // Episode > 48 hours
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Fever persisting > 48 hours — call your paediatrician' });
  }

  // 3+ doses in 12 hours
  const last12h = Date.now() - 12 * 3600000;
  const recentDoses = ep.doses.filter(d => new Date(d.time).getTime() > last12h);
  if (recentDoses.length >= 3) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Multiple doses in 12 hours — verify dosing frequency with doctor' });
  }

  // Temperature rising across 3 consecutive readings
  if (ep.readings.length >= 3) {
    const last3 = ep.readings.slice(-3);
    if (last3[2].temp > last3[1].temp && last3[1].temp > last3[0].temp) {
      warnings.push({ severity: 'warning', icon: zi('chart'), text: 'Temperature trending upward across last 3 readings' });
    }
  }

  return warnings;
}

function feLogReadingFromInput() {
  const tempInput = document.getElementById('feverTempInput');
  const timeInput = document.getElementById('feverTimeInput');
  if (!tempInput) return;
  const tempF = parseFloat(tempInput.value);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) {
    tempInput.focus();
    return;
  }
  // Build ISO time from time input
  const timeVal = timeInput ? timeInput.value : '';
  let isoTime = new Date().toISOString();
  if (timeVal) {
    const [hh, mm] = timeVal.split(':');
    const d = new Date();
    d.setHours(parseInt(hh), parseInt(mm), 0, 0);
    isoTime = d.toISOString();
  }

  // If no active episode, start one
  if (!getActiveFeverEpisode()) {
    if (tempF >= 99) {
      startFeverEpisode(tempF, 'manual');
      renderFeverEpisodeCard();
      renderHomeFeverBanner();
      renderFeverHistory();
      showQLToast(zi('flame') + ' Fever episode started — ' + tempF.toFixed(1) + '°F');
    } else {
      showQLToast('Temperature is normal (' + tempF.toFixed(1) + '°F)');
    }
  } else {
    logFeverReading(tempF, isoTime, '');
    showQLToast(zi('flame') + ' Reading logged — ' + tempF.toFixed(1) + '°F');
  }
  tempInput.value = '';
}

function feLogDosePrompt() {
  const ep = getActiveFeverEpisode();
  if (!ep) return;
  const latestWeight = growthData.length > 0 ? growthData[growthData.length - 1].wt : null;
  const doseInfo = getParacetamolDose(latestWeight);
  const defaultDose = doseInfo ? doseInfo.lowMl + ' ml' : '';
  const dose = prompt('Crocin / Paracetamol dose given:', defaultDose);
  if (dose === null) return;
  logFeverDose('Crocin / Paracetamol', dose, null, '');
  showQLToast(zi('pill') + ' Dose logged');
}

// ── Fever Edit/Delete ──

function feEditReading(idx) {
  const ep = getActiveFeverEpisode();
  if (!ep || !ep.readings[idx]) return;
  const r = ep.readings[idx];
  _epEditEntry({
    title: 'Edit Temperature Reading',
    fields: [
      { label: 'Temperature (°F)', id: 'temp', type: 'number', value: r.temp, step: '0.1' },
      { label: 'Time', id: 'time', type: 'time', value: r.time },
      { label: 'Notes', id: 'notes', type: 'text', value: r.notes || '' }
    ],
    onSave: function(v) {
      ep.readings[idx].temp = parseFloat(v.temp) || r.temp;
      ep.readings[idx].time = _epTimeToISO(v.time);
      ep.readings[idx].notes = v.notes || '';
      ep.peakTemp = Math.max(...ep.readings.map(x => x.temp));
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard(); renderHomeFeverBanner();
      showQLToast(zi('flame') + ' Reading updated');
    },
    onDelete: function() {
      ep.readings.splice(idx, 1);
      if (ep.readings.length > 0) ep.peakTemp = Math.max(...ep.readings.map(x => x.temp));
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard(); renderHomeFeverBanner();
      showQLToast(zi('flame') + ' Reading deleted');
    }
  });
}

function feEditDose(idx) {
  const ep = getActiveFeverEpisode();
  if (!ep || !ep.doses[idx]) return;
  const d = ep.doses[idx];
  _epEditEntry({
    title: 'Edit Medicine Dose',
    fields: [
      { label: 'Medicine', id: 'medicine', type: 'text', value: d.medicine },
      { label: 'Dose', id: 'dose', type: 'text', value: d.dose },
      { label: 'Time', id: 'time', type: 'time', value: d.time }
    ],
    onSave: function(v) {
      ep.doses[idx].medicine = v.medicine || d.medicine;
      ep.doses[idx].dose = v.dose || d.dose;
      ep.doses[idx].time = _epTimeToISO(v.time);
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast(zi('pill') + ' Dose updated');
    },
    onDelete: function() {
      ep.doses.splice(idx, 1);
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast(zi('pill') + ' Dose deleted');
    }
  });
}

function feEditAction(idx) {
  const ep = getActiveFeverEpisode();
  if (!ep || !ep.actions[idx]) return;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time);
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      ep.actions.splice(idx, 1);
      save(KEYS.feverEpisodes, _feverEpisodes);
      renderFeverEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function feResolvePrompt() {
  confirmAction('Has Ziva\'s temperature been normal (below 99°F) for at least 6 hours?', function() {
    resolveFeverEpisode('');
    showQLToast('' + zi('check') + ' Fever episode resolved');
  }, 'Resolve');
}

function feToggleAllReadings() {
  // Re-render with all readings shown — toggle via a flag
  // Simple approach: just re-render the card (readings are already in the data)
  renderFeverEpisodeCard();
}

function renderHomeFeverBanner() {
  const banner = document.getElementById('homeFeverBanner');
  if (!banner) return;
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = '';
  const lastReading = ep.readings[ep.readings.length - 1];
  const sev = getFeverSeverity(lastReading.temp);
  const checkCD = getFeverCheckCountdown();

  let cdText = '';
  if (checkCD) {
    if (checkCD.overdue) {
      cdText = 'Check overdue';
    } else {
      const h = Math.floor(checkCD.remaining / 60);
      const m = checkCD.remaining % 60;
      cdText = 'Next check: ' + (h > 0 ? h + 'h ' : '') + m + 'm';
    }
  }

  banner.innerHTML = '<div class="fe-home-banner fe-home-banner-' + sev.tier + '" data-nav-track-medical="feverEpisodeCard">' +
    '<div class="fe-home-banner-info">' +
    '<div class="fe-home-banner-temp" style="color:' + sev.color + ';">' + zi('flame') + ' ' + lastReading.temp.toFixed(1) + '°F · ' + sev.label + ' · ' + _feverTimeAgo(lastReading.time) + '</div>' +
    '<div class="fe-home-banner-sub">' + cdText + '</div>' +
    '</div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="feHomeBannerLog" data-stop="1" >' + zi('note') + ' Log</button>' +
    '</div>';
}

function feHomeBannerLog() {
  // Open a mini prompt for temperature
  const tempStr = prompt('Current temperature (°F):');
  if (tempStr === null) return;
  const tempF = parseFloat(tempStr);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) return;
  if (!getActiveFeverEpisode()) {
    if (tempF >= 99) startFeverEpisode(tempF, 'home-banner');
    else { showQLToast('Temperature is normal'); return; }
  } else {
    logFeverReading(tempF, null, '');
  }
  showQLToast(zi('flame') + ' ' + tempF.toFixed(1) + '°F logged');
  renderHome();
}

function renderFeverHistory() {
  const card = document.getElementById('feverHistoryCard');
  const summary = document.getElementById('feverHistorySummary');
  const body = document.getElementById('feverHistoryBody');
  if (!card || !summary || !body) return;

  const resolved = _feverEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  const last = resolved[resolved.length - 1];
  const lastDate = last.resolvedAt ? formatDate(last.resolvedAt.split('T')[0]) : '';
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (lastDate ? ' · last: ' + lastDate : '') + '</div>';

  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const startD = formatDate(ep.startedAt.split('T')[0]);
    const endD = ep.resolvedAt ? formatDate(ep.resolvedAt.split('T')[0]) : '';
    const dur = _feverDurationStr(ep);
    const doseCount = ep.doses.length;
    const readingCount = ep.readings.length;

    html += '<div class="fe-history-entry">';
    html += '<div class="fe-history-date">' + startD + (endD && endD !== startD ? ' — ' + endD : '') + ' · Peak: ' + ep.peakTemp.toFixed(1) + '°F</div>';
    html += '<div class="fe-history-detail">Duration: ' + dur + ' · ' + readingCount + ' reading' + (readingCount !== 1 ? 's' : '');
    if (doseCount > 0) html += ' · Crocin ×' + doseCount;
    html += '</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeFeverAlerts() {
  const alerts = [];
  const ep = getActiveFeverEpisode();
  if (!ep || ep.readings.length === 0) return alerts;

  const state = loadAlertState();
  function isDismissed(key) { return !!state.dismissed[key]; }
  const todayStr = today();

  // Check due
  const checkCD = getFeverCheckCountdown();
  if (checkCD && checkCD.overdue) {
    const key = 'fever-check-due-' + todayStr + '-' + ep.readings.length;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-check-due', key,
        severity: 'watch', icon: zi('flame'),
        title: 'Temperature check due',
        body: 'Last reading was ' + _feverTimeAgo(ep.readings[ep.readings.length - 1].time) + '. Time to check again.',
        action: { label: 'Log Reading', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' },
        tab: 'medical', dismissable: true
      });
    }
  }

  // Dose available
  const doseCD = getFeverDoseCountdown();
  if (doseCD && doseCD.available && ep.readings[ep.readings.length - 1].temp >= 100) {
    const key = 'fever-dose-avail-' + todayStr + '-' + ep.doses.length;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-dose-available', key,
        severity: 'info', icon: zi('pill'),
        title: 'Crocin dose available',
        body: 'Next dose is safe to give (if needed, as advised by doctor). Last dose was ' + _feverTimeAgo(ep.doses[ep.doses.length - 1].time) + '.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Escalation
  const escalations = _computeFeverEscalations(ep);
  escalations.forEach((e, i) => {
    const key = 'fever-esc-' + todayStr + '-' + i;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'fever-escalation', key,
        severity: e.severity === 'emergency' ? 'urgent' : 'watch', icon: e.icon,
        title: e.text,
        body: '',
        tab: 'medical', dismissable: true
      });
    }
  });

  // Breaking
  if (ep.readings.length >= 2) {
    const last2 = ep.readings.slice(-2);
    if (last2.every(r => r.temp < 99)) {
      alerts.push({
        id: 'fever-breaking', key: 'fever-breaking-' + todayStr,
        severity: 'positive', icon: zi('check'),
        title: 'Temperature normalizing',
        body: 'Last 2 readings are below 99°F. Continue monitoring — consider resolving if stable for 6 hours.',
        action: { label: 'Review', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' },
        tab: 'medical', dismissable: true
      });
    }
  }

  return alerts;
}

function renderDietFeverBanner() {
  const el = document.getElementById('dietIntelBanner');
  if (!el) return '';
  const ep = getActiveFeverEpisode();
  if (!ep) return '';

  return '<div class="fe-diet-banner">' +
    '<div class="fe-diet-title">' + zi('flame') + ' Fever Active — Diet Guidance</div>' +
    '<div class="fe-diet-body">' +
    '<strong>Prioritize:</strong> Breast milk (most important), light foods (khichdi, dal water, curd rice, banana, rice porridge), hydrating foods (coconut water, ORS, soups).<br><br>' +
    '<strong>Avoid:</strong> New food introductions, heavy proteins, fried foods. Do not force meals if Ziva refuses.<br><br>' +
    '<em>Appetite loss during fever is normal. Offer small amounts frequently.</em>' +
    '</div></div>';
}

function getFeverDietFoods() {
  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const feverFoods = ['khichdi', 'curd', 'banana', 'rice', 'rice porridge', 'dal', 'dal water',
    'coconut water', 'buttermilk', 'pomegranate', 'apple', 'mashed potato', 'idli',
    'sabudana', 'oats porridge', 'ragi porridge', 'curd rice'];
  return feverFoods.filter(f => {
    const base = _baseFoodName(f);
    return [...introducedSet].some(i => _baseFoodName(i) === base || i.includes(f) || f.includes(i));
  });
}

function promptFeverTrack(tempGuess) {
  const ep = getActiveFeverEpisode();
  if (ep) {
    showQLToast('Fever episode already active');
    return;
  }
  const tempStr = prompt('Enter current temperature (°F) to start tracking:', tempGuess || '');
  if (tempStr === null) return;
  const tempF = parseFloat(tempStr);
  if (isNaN(tempF) || tempF < 95 || tempF > 108) return;
  startFeverEpisode(tempF, 'symptom-checker');
  showQLToast(zi('flame') + ' Fever episode started — ' + tempF.toFixed(1) + '°F');
  // Navigate to medical tab
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() {
    renderFeverEpisodeCard();
    renderHomeFeverBanner();
    renderFeverHistory();
    document.getElementById('feverEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function _startFeverCountdown() {
  if (_feverCountdownInterval) return;
  _feverCountdownInterval = setInterval(function() {
    if (!getActiveFeverEpisode()) { _stopFeverCountdown(); return; }
    // Update only the countdown text elements
    const checkEl = document.getElementById('feverCheckCountdown');
    if (checkEl) {
      const cd = getFeverCheckCountdown();
      if (cd) {
        const isOverdue = cd.overdue;
        let text = '';
        if (isOverdue) text = '<span style="color:var(--tc-danger);font-weight:700;">Overdue — ' + Math.abs(cd.remaining) + 'm</span>';
        else {
          const h = Math.floor(cd.remaining / 60);
          const m = cd.remaining % 60;
          text = (h > 0 ? h + 'h ' : '') + m + 'm';
        }
        const textEl = checkEl.querySelector('.fe-countdown-text');
        if (textEl) textEl.innerHTML = 'Next check: ' + text;
        const pct = Math.max(0, Math.min(100, ((cd.total - Math.max(0, cd.remaining)) / cd.total) * 100));
        const fillEl = checkEl.querySelector('.fe-countdown-fill');
        if (fillEl) {
          fillEl.style.width = pct + '%';
          fillEl.classList.toggle('fe-overdue', isOverdue);
        }
      }
    }
    // Update Home banner countdown
    const bannerSub = document.querySelector('.fe-home-banner-sub');
    if (bannerSub) {
      const cd = getFeverCheckCountdown();
      if (cd) {
        if (cd.overdue) bannerSub.textContent = 'Check overdue';
        else {
          const h = Math.floor(cd.remaining / 60);
          const m = cd.remaining % 60;
          bannerSub.textContent = 'Next check: ' + (h > 0 ? h + 'h ' : '') + m + 'm';
        }
      }
    }
  }, 60000);
}

function _stopFeverCountdown() {
  if (_feverCountdownInterval) {
    clearInterval(_feverCountdownInterval);
    _feverCountdownInterval = null;
  }
}

// On load: start countdown if active episode exists
if (getActiveFeverEpisode()) _startFeverCountdown();

// ── DIARRHOEA EPISODE TRACKING (v2.9) ──

let _diarrhoeaEpisodes = [];
try { _diarrhoeaEpisodes = JSON.parse(localStorage.getItem(KEYS.diarrhoeaEpisodes)) || []; } catch { _diarrhoeaEpisodes = []; }
if (!Array.isArray(_diarrhoeaEpisodes)) _diarrhoeaEpisodes = [];

function getActiveDiarrhoeaEpisode() {
  return _diarrhoeaEpisodes.find(e => e.status === 'active') || null;
}

function getDiarrhoeaSeverity(stoolCount24h, hasBlood, hasMucus) {
  if (hasBlood || stoolCount24h >= 8) return { tier: 'severe', label: 'Severe — call doctor', color: 'var(--tc-danger)' };
  if (hasMucus || stoolCount24h >= 5) return { tier: 'moderate', label: 'Moderate', color: 'var(--tc-caution)' };
  return { tier: 'mild', label: 'Mild', color: 'var(--tc-amber)' };
}

function _deStoolsInLast24h(ep) {
  const cutoff = Date.now() - 24 * 3600000;
  return ep.stools.filter(s => new Date(s.time).getTime() > cutoff);
}

function _deHasFlag(ep, flag) {
  return ep.stools.some(s => s[flag]);
}

function pruneDiarrhoeaEpisodes() {
  if (_diarrhoeaEpisodes.length > 20) _diarrhoeaEpisodes = _diarrhoeaEpisodes.slice(-20);
}

function startDiarrhoeaEpisode(source) {
  if (getActiveDiarrhoeaEpisode()) return getActiveDiarrhoeaEpisode();
  pruneDiarrhoeaEpisodes();
  const now = new Date().toISOString();
  const episode = {
    id: 'de-' + Date.now(),
    status: 'active',
    startedAt: now,
    resolvedAt: null,
    stools: [],       // { time, consistency, color, blood, mucus, notes }
    fluids: [],       // { time, type, amount, notes }
    wetDiapers: [],   // { time, notes }
    actions: [],      // { time, action }
    triggerSource: source || 'manual',
    notes: '',
    resolvedNotes: ''
  };
  _diarrhoeaEpisodes.push(episode);
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  return episode;
}

function logDiarrhoeaStool(consistency, color, blood, mucus, timeStr, notes) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.stools.push({
    time: timeStr || new Date().toISOString(),
    consistency: consistency || 'watery',
    color: color || '',
    blood: !!blood,
    mucus: !!mucus,
    notes: notes || ''
  });
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
  renderHomeDiarrhoeaBanner();
}

function logDiarrhoeaFluid(type, amount, timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.fluids.push({
    time: timeStr || new Date().toISOString(),
    type: type || 'ORS',
    amount: amount || '',
    notes: ''
  });
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function logDiarrhoeaWetDiaper(timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.wetDiapers.push({ time: timeStr || new Date().toISOString(), notes: '' });
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function logDiarrhoeaAction(action, timeStr) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
}

function resolveDiarrhoeaEpisode(notes) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return;
  ep.status = 'resolved';
  ep.resolvedAt = new Date().toISOString();
  ep.resolvedNotes = notes || '';
  save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
  renderDiarrhoeaEpisodeCard();
  renderDiarrhoeaHistory();
  renderHomeDiarrhoeaBanner();
  renderHome();
}

function _deDurationStr(ep) {
  const start = new Date(ep.startedAt).getTime();
  const end = ep.resolvedAt ? new Date(ep.resolvedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return mins + 'm';
  const h = Math.floor(mins / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd ' + (h % 24 > 0 ? (h % 24) + 'h' : '');
}

function _deWetDiapersToday(ep) {
  const todayStr = today();
  return ep.wetDiapers.filter(w => w.time && w.time.startsWith(todayStr)).length;
}

function _computeDiarrhoeaEscalations(ep) {
  const warnings = [];
  const recent24 = _deStoolsInLast24h(ep);

  if (ep.stools.some(s => s.blood)) {
    warnings.push({ severity: 'emergency', icon: zi('siren'), text: 'Blood in stool detected — call doctor immediately' });
  }
  if (ep.stools.some(s => s.mucus) && recent24.length >= 4) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Mucus with frequent stools — consult paediatrician' });
  }
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Diarrhoea persisting > 48 hours — call your paediatrician' });
  }
  const wetToday = _deWetDiapersToday(ep);
  if (wetToday < 4 && new Date().getHours() >= 14) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: 'Only ' + wetToday + ' wet diapers today — watch for dehydration' });
  }
  if (recent24.length >= 8) {
    warnings.push({ severity: 'warning', icon: zi('warn'), text: recent24.length + ' stools in 24 hours — risk of dehydration, push fluids' });
  }
  // Improvement: if last 3 stools are soft/normal
  if (ep.stools.length >= 3) {
    const last3 = ep.stools.slice(-3);
    if (last3.every(s => s.consistency === 'soft' || s.consistency === 'normal')) {
      warnings.push({ severity: 'positive', icon: zi('check'), text: 'Last 3 stools are improving — consistency normalizing' });
    }
  }
  return warnings;
}

function renderDiarrhoeaEpisodeCard() {
  const card = document.getElementById('diarrhoeaEpisodeCard');
  if (!card) return;
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const recent24 = _deStoolsInLast24h(ep);
  const hasBlood = _deHasFlag(ep, 'blood');
  const hasMucus = _deHasFlag(ep, 'mucus');
  const sev = getDiarrhoeaSeverity(recent24.length, hasBlood, hasMucus);
  const duration = _deDurationStr(ep);
  const wetToday = _deWetDiapersToday(ep);
  const totalFluids = ep.fluids.length;

  card.style.borderLeft = '4px solid ' + sev.color;

  let html = '';

  // Header
  html += '<div class="card-header"><div class="card-title"><div class="icon icon-amber"><svg class="zi"><use href="#zi-diaper"/></svg></div> Active Diarrhoea Episode</div>';
  html += '<span class="t-sm t-light">' + duration + '</span></div>';

  // Stool count display
  html += '<div class="de-stool-count" style="color:' + sev.color + ';">' + recent24.length + ' stools <span class="fs-sm-500">in 24h</span></div>';
  html += '<div class="text-center"><span class="de-severity de-severity-' + sev.tier + '">' + sev.label + '</span></div>';
  html += '<div style="font-size:var(--fs-xs);color:var(--light);text-align:center;margin-top:var(--sp-4);">Total: ' + ep.stools.length + ' stools · ' + totalFluids + ' fluid entries</div>';

  // Hydration tracker
  html += '<div class="fe-section-title">' + zi('drop') + ' Hydration</div>';
  const hydraTarget = 6; // min wet diapers per day
  const hydPct = Math.min(100, Math.round((wetToday / hydraTarget) * 100));
  const hydColor = wetToday >= 6 ? 'var(--tc-sage)' : wetToday >= 4 ? 'var(--tc-amber)' : 'var(--tc-danger)';
  html += '<div class="de-hydra-bar">';
  html += '<div class="de-hydra-label">Wet diapers today</div>';
  html += '<div class="de-hydra-track"><div class="de-hydra-fill" style="width:' + hydPct + '%;background:' + hydColor + ';"></div></div>';
  html += '<div class="de-hydra-count" style="color:' + hydColor + ';">' + wetToday + '/' + hydraTarget + '</div>';
  html += '</div>';
  html += _epTimePickerHTML('deHydra');
  html += '<div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;padding:var(--sp-4) 0;">';
  html += '<span class="fe-action-chip" onclick="logDiarrhoeaWetDiaper(_epGetSelectedTime(\'deHydra\'))">🩲 Log wet diaper</span>';
  html += '<span class="fe-action-chip" data-action="deLogFluidPrompt">'+zi('drop')+' Log fluid</span>';
  html += '</div>';
  if (ep.fluids.length > 0) {
    ep.fluids.slice().reverse().slice(0, 3).forEach((f, i) => {
      const origIdx = ep.fluids.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditFluid" data-arg="' + origIdx + '">' + _feverTimeShort(f.time) + ' — ' + escHtml(f.type) + (f.amount ? ' (' + escHtml(f.amount) + ')' : '') + '</div>';
    });
  }
  if (ep.wetDiapers.length > 0) {
    ep.wetDiapers.slice().reverse().slice(0, 3).forEach((w, i) => {
      const origIdx = ep.wetDiapers.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditWetDiaper" data-arg="' + origIdx + '">' + _feverTimeShort(w.time) + ' — 🩲 Wet diaper</div>';
    });
  }

  // Log stool
  html += '<div class="fe-section-title">Stool Log</div>';
  html += _epTimePickerHTML('deStool');
  html += '<div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;padding:var(--sp-4) 0;">';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'watery\'">'+zi('drop')+' Watery</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'runny\'">'+zi('warn')+' Runny</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'soft\'">'+zi('check')+' Soft</span>';
  html += '<span class="fe-action-chip" data-action="deLogStoolPrompt" data-arg="\'normal\'">' + zi('check') + ' Normal</span>';
  html += '</div>';
  html += '<div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;padding:0 0 var(--sp-4);">';
  html += '<label style="font-size:var(--fs-xs);display:flex;align-items:center;gap:4px;"><input type="checkbox" id="deStoolBlood"> ' + zi('drop') + ' Blood</label>';
  html += '<label style="font-size:var(--fs-xs);display:flex;align-items:center;gap:4px;"><input type="checkbox" id="deStoolMucus"> Mucus</label>';
  html += '</div>';

  // Recent stools
  if (ep.stools.length > 0) {
    const conEmoji = { watery: zi('drop'), runny: zi('drop'), soft: zi('diaper'), normal: zi('check'), hard: zi('warn'), loose: zi('drop') };
    const showStools = ep.stools.slice().reverse().slice(0, 6);
    showStools.forEach((s, i) => {
      const origIdx = ep.stools.length - 1 - i;
      const emoji = conEmoji[s.consistency] || zi('diaper');
      let flags = '';
      if (s.blood) flags += ' ' + zi('drop');
      if (s.mucus) flags += ' ' + zi('drop');
      html += '<div class="de-stool-entry ep-entry-tap" data-action="deEditStool" data-arg="' + origIdx + '">';
      html += '<span>' + emoji + '</span>';
      html += '<span style="font-size:var(--fs-xs);color:var(--light);min-width:60px;">' + _feverTimeShort(s.time) + '</span>';
      html += '<span class="fs-sm-500">' + (s.consistency || 'loose') + flags + '</span>';
      if (s.notes) html += '<span style="font-size:var(--fs-xs);color:var(--light);margin-left:auto;">' + escHtml(s.notes) + '</span>';
      html += '</div>';
    });
    if (ep.stools.length > 6) {
      html += '<div class="fe-more-toggle">' + (ep.stools.length - 6) + ' earlier entries</div>';
    }
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('deAction');
  const DE_ACTIONS = ['Breastfed', 'ORS given', 'Applied diaper cream', 'Changed diaper', 'Doctor called', 'Washed hands'];
  html += '<div class="fe-action-chips">';
  DE_ACTIONS.forEach(a => {
    html += '<span class="fe-action-chip" onclick="logDiarrhoeaAction(\'' + a.replace(/'/g, "\\'") + '\', _epGetSelectedTime(\'deAction\'))">' + a + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 5).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditAction" data-arg="' + origIdx + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div>';
  html += '<div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Continue breastfeeding — most important</li>';
  html += '<li>Offer ORS in small, frequent sips</li>';
  html += '<li>Avoid fruit juices and sugary drinks</li>';
  html += '<li>Keep diaper area clean and dry — use barrier cream</li>';
  html += '<li>Count wet diapers — minimum 6/day indicates adequate hydration</li>';
  if (sev.tier === 'severe') {
    html += '<li class="status-action">'+zi('siren')+' Seek medical attention — blood/mucus or severe frequency</li>';
  } else {
    html += '<li>Call doctor if: blood/mucus in stool, <4 wet diapers/day, sunken fontanelle, or persists >48 hours</li>';
  }
  html += '</ul></div>';

  // Escalation warnings
  const escalations = _computeDiarrhoeaEscalations(ep);
  escalations.forEach(e => {
    const bgColor = e.severity === 'emergency' ? 'var(--surface-rose)' : e.severity === 'positive' ? 'var(--surface-sage)' : 'var(--surface-caution)';
    const textColor = e.severity === 'emergency' ? 'var(--tc-danger)' : e.severity === 'positive' ? 'var(--tc-sage)' : 'var(--tc-caution)';
    html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:' + bgColor + ';font-size:var(--fs-sm);font-weight:600;color:' + textColor + ';">' + e.icon + ' ' + escHtml(e.text) + '</div>';
  });

  // Resolve
  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="deResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice. Trust your instincts and call your paediatrician when in doubt.</div>';

  card.innerHTML = html;
}

function deLogStoolPrompt(consistency) {
  const bloodEl = document.getElementById('deStoolBlood');
  const mucusEl = document.getElementById('deStoolMucus');
  const blood = bloodEl ? bloodEl.checked : false;
  const mucus = mucusEl ? mucusEl.checked : false;

  if (!getActiveDiarrhoeaEpisode()) {
    startDiarrhoeaEpisode('manual');
  }
  const timeStr = _epGetSelectedTime('deStool');
  logDiarrhoeaStool(consistency, '', blood, mucus, timeStr, '');
  // Reset checkboxes
  if (bloodEl) bloodEl.checked = false;
  if (mucusEl) mucusEl.checked = false;
  showQLToast(zi('diaper') + ' Stool logged — ' + consistency);
}

function deLogFluidPrompt() {
  const FLUID_TYPES = ['ORS', 'Breast milk', 'Coconut water', 'Dal water', 'Water', 'Buttermilk'];
  const type = prompt('Fluid type:\n' + FLUID_TYPES.map((f, i) => (i + 1) + '. ' + f).join('\n') + '\n\nEnter name or number:', 'ORS');
  if (type === null) return;
  const resolved = FLUID_TYPES[parseInt(type) - 1] || type;
  const timeStr = _epGetSelectedTime('deHydra');
  logDiarrhoeaFluid(resolved, '', timeStr);
  showQLToast(zi('drop') + ' ' + resolved + ' logged');
}

// ── Diarrhoea Edit/Delete ──

function deEditStool(idx) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep || !ep.stools[idx]) return;
  const s = ep.stools[idx];
  _epEditEntry({
    title: 'Edit Stool Entry',
    fields: [
      { label: 'Consistency', id: 'consistency', type: 'select', value: s.consistency,
        options: [{value:'watery',label:zi('drop')+' Watery'},{value:'runny',label:zi('warn')+' Runny'},{value:'soft',label:zi('check')+' Soft'},{value:'normal',label:'' + zi('check') + ' Normal'},{value:'hard',label:zi('warn')+' Hard'}] },
      { label: 'Time', id: 'time', type: 'time', value: s.time },
      { label: 'Notes', id: 'notes', type: 'text', value: s.notes || '' }
    ],
    onSave: function(v) {
      ep.stools[idx].consistency = v.consistency || s.consistency;
      ep.stools[idx].time = _epTimeToISO(v.time);
      ep.stools[idx].notes = v.notes || '';
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard(); renderHomeDiarrhoeaBanner();
      showQLToast(zi('diaper') + ' Stool entry updated');
    },
    onDelete: function() {
      ep.stools.splice(idx, 1);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard(); renderHomeDiarrhoeaBanner();
      showQLToast('Stool entry deleted');
    }
  });
}

function deEditFluid(idx) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep || !ep.fluids[idx]) return;
  const f = ep.fluids[idx];
  _epEditEntry({
    title: 'Edit Fluid Entry',
    fields: [
      { label: 'Type', id: 'type', type: 'text', value: f.type },
      { label: 'Amount', id: 'amount', type: 'text', value: f.amount || '' },
      { label: 'Time', id: 'time', type: 'time', value: f.time }
    ],
    onSave: function(v) {
      ep.fluids[idx].type = v.type || f.type;
      ep.fluids[idx].amount = v.amount || '';
      ep.fluids[idx].time = _epTimeToISO(v.time);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast(zi('drop') + ' Fluid entry updated');
    },
    onDelete: function() {
      ep.fluids.splice(idx, 1);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Fluid entry deleted');
    }
  });
}

function deEditWetDiaper(idx) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep || !ep.wetDiapers[idx]) return;
  const w = ep.wetDiapers[idx];
  _epEditEntry({
    title: 'Edit Wet Diaper Entry',
    fields: [
      { label: 'Time', id: 'time', type: 'time', value: w.time }
    ],
    onSave: function(v) {
      ep.wetDiapers[idx].time = _epTimeToISO(v.time);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('🩲 Wet diaper updated');
    },
    onDelete: function() {
      ep.wetDiapers.splice(idx, 1);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Wet diaper deleted');
    }
  });
}

function deEditAction(idx) {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep || !ep.actions[idx]) return;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      ep.actions.splice(idx, 1);
      save(KEYS.diarrhoeaEpisodes, _diarrhoeaEpisodes);
      renderDiarrhoeaEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function deResolvePrompt() {
  confirmAction('Has Ziva\'s stool consistency returned to normal? (No loose/watery stools for at least 12 hours)', function() {
    resolveDiarrhoeaEpisode('');
    showQLToast('' + zi('check') + ' Diarrhoea episode resolved');
  }, 'Resolve');
}

function renderHomeDiarrhoeaBanner() {
  const banner = document.getElementById('homeDiarrhoeaBanner');
  if (!banner) return;
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';

  const recent24 = _deStoolsInLast24h(ep);
  const sev = getDiarrhoeaSeverity(recent24.length, _deHasFlag(ep, 'blood'), _deHasFlag(ep, 'mucus'));
  const wetToday = _deWetDiapersToday(ep);
  const duration = _deDurationStr(ep);

  const bannerCls = sev.tier === 'severe' ? 'de-home-banner de-home-banner-severe' : 'de-home-banner';
  banner.innerHTML = '<div class="' + bannerCls + '" data-nav-track-medical="diarrhoeaEpisodeCard">' +
    '<div class="fe-home-banner-info">' +
    '<div class="fe-home-banner-temp" style="color:' + sev.color + ';">' + zi('diaper') + ' ' + recent24.length + ' stools/24h · ' + sev.label + ' · ' + duration + '</div>' +
    '<div class="fe-home-banner-sub">Wet diapers today: ' + wetToday + '/6' + (wetToday < 4 ? ' ' + zi('warn') : '') + '</div>' +
    '</div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="deLogStoolQuick" data-stop="1" >' + zi('note') + ' Log</button>' +
    '</div>';
}

function deLogStoolQuick() {
  if (!getActiveDiarrhoeaEpisode()) return;
  deLogStoolPrompt('watery');
}

function renderDiarrhoeaHistory() {
  const card = document.getElementById('diarrhoeaHistoryCard');
  const summary = document.getElementById('diarrhoeaHistorySummary');
  const body = document.getElementById('diarrhoeaHistoryBody');
  if (!card || !summary || !body) return;

  const resolved = _diarrhoeaEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  const last = resolved[resolved.length - 1];
  const lastDate = last.resolvedAt ? formatDate(last.resolvedAt.split('T')[0]) : '';
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (lastDate ? ' · last: ' + lastDate : '') + '</div>';

  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const startD = formatDate(ep.startedAt.split('T')[0]);
    const endD = ep.resolvedAt ? formatDate(ep.resolvedAt.split('T')[0]) : '';
    const dur = _deDurationStr(ep);
    html += '<div class="fe-history-entry">';
    html += '<div class="fe-history-date">' + startD + (endD && endD !== startD ? ' — ' + endD : '') + '</div>';
    html += '<div class="fe-history-detail">Duration: ' + dur + ' · ' + ep.stools.length + ' stools · ' + ep.fluids.length + ' fluid entries · ' + ep.wetDiapers.length + ' wet diapers logged</div>';
    if (ep.resolvedNotes) html += '<div class="fe-history-detail">' + escHtml(ep.resolvedNotes) + '</div>';
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeDiarrhoeaAlerts() {
  const alerts = [];
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return alerts;

  const state = loadAlertState();
  function isDismissed(key) { return !!state.dismissed[key]; }
  const todayStr = today();
  const recent24 = _deStoolsInLast24h(ep);

  // Wet diaper warning
  const wetToday = _deWetDiapersToday(ep);
  if (wetToday < 4 && new Date().getHours() >= 14) {
    const key = 'de-wet-low-' + todayStr;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-wet-low', key,
        severity: 'watch', icon: '🩲',
        title: 'Only ' + wetToday + ' wet diapers today',
        body: 'During diarrhoea, minimum 6 wet diapers/day indicates adequate hydration. Push fluids — ORS, breast milk, coconut water.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Blood/mucus alert
  if (_deHasFlag(ep, 'blood')) {
    const key = 'de-blood-' + ep.id;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-blood', key,
        severity: 'urgent', icon: zi('siren'),
        title: 'Blood detected in stool',
        body: 'Blood in stool during diarrhoea needs immediate medical attention. Call your paediatrician.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Duration > 48h
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 48) {
    const key = 'de-persist-' + ep.id;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'de-persist', key,
        severity: 'watch', icon: zi('warn'),
        title: 'Diarrhoea persisting > 48 hours',
        body: 'Consult your paediatrician if loose stools continue beyond 48 hours.',
        tab: 'medical', dismissable: true
      });
    }
  }

  // Improving
  if (ep.stools.length >= 3) {
    const last3 = ep.stools.slice(-3);
    if (last3.every(s => s.consistency === 'soft' || s.consistency === 'normal')) {
      alerts.push({
        id: 'de-improving', key: 'de-improving-' + todayStr,
        severity: 'positive', icon: zi('check'),
        title: 'Stool consistency improving',
        body: 'Last 3 stools are soft/normal. Continue monitoring — consider resolving if stable for 12 hours.',
        tab: 'medical', dismissable: true
      });
    }
  }

  return alerts;
}

function getDiarrhoeaDietFoods() {
  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const deFoods = ['khichdi', 'curd', 'banana', 'rice', 'rice porridge', 'dal', 'dal water',
    'coconut water', 'pomegranate', 'apple', 'mashed potato', 'idli', 'curd rice',
    'sabudana', 'oats porridge', 'ragi porridge', 'buttermilk'];
  return deFoods.filter(f => {
    const base = _baseFoodName(f);
    return [...introducedSet].some(i => _baseFoodName(i) === base || i.includes(f) || f.includes(i));
  });
}

function renderDietDiarrhoeaBanner() {
  const ep = getActiveDiarrhoeaEpisode();
  if (!ep) return '';
  return '<div class="fe-diet-banner">' +
    '<div class="fe-diet-title">' + zi('diaper') + ' Diarrhoea Active — Diet Guidance</div>' +
    '<div class="fe-diet-body">' +
    '<strong>Prioritize:</strong> Breast milk (most important), ORS in small sips, BRAT foods (banana, rice, apple, toast/idli), curd for probiotics, khichdi, dal water.<br><br>' +
    '<strong>Avoid:</strong> Fruit juices, sugary drinks, high-fibre foods, new food introductions, dairy (except curd/buttermilk). Do not force meals.<br><br>' +
    '<em>Small, frequent feeds are better than large meals. Continue breastfeeding throughout.</em>' +
    '</div></div>';
}

function promptDiarrhoeaTrack() {
  const ep = getActiveDiarrhoeaEpisode();
  if (ep) { showQLToast('Diarrhoea episode already active'); return; }
  startDiarrhoeaEpisode('symptom-checker');
  showQLToast(zi('diaper') + ' Diarrhoea episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() {
    renderDiarrhoeaEpisodeCard();
    renderHomeDiarrhoeaBanner();
    renderDiarrhoeaHistory();
    document.getElementById('diarrhoeaEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ── VOMITING EPISODE TRACKING (v2.9) ──

let _vomitingEpisodes = [];
try { _vomitingEpisodes = JSON.parse(localStorage.getItem(KEYS.vomitingEpisodes)) || []; } catch { _vomitingEpisodes = []; }
if (!Array.isArray(_vomitingEpisodes)) _vomitingEpisodes = [];

function getActiveVomitingEpisode() { return _vomitingEpisodes.find(e => e.status === 'active') || null; }

function startVomitingEpisode(source) {
  if (getActiveVomitingEpisode()) return getActiveVomitingEpisode();
  if (_vomitingEpisodes.length > 20) _vomitingEpisodes = _vomitingEpisodes.slice(-20);
  const now = new Date().toISOString();
  const ep = { id: 'vo-' + Date.now(), status: 'active', startedAt: now, resolvedAt: null,
    episodes: [], fluids: [], wetDiapers: [], actions: [], triggerSource: source || 'manual', notes: '', resolvedNotes: '' };
  _vomitingEpisodes.push(ep);
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  return ep;
}

function logVomitingEpisodeEntry(type, timeStr, notes) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.episodes.push({ time: timeStr || new Date().toISOString(), type: type || 'vomit', notes: notes || '' });
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  renderVomitingEpisodeCard(); renderHomeVomitingBanner();
}

function logVomitingFluid(type, timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.fluids.push({ time: timeStr || new Date().toISOString(), type: type || 'Breast milk' });
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function logVomitingWetDiaper(timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.wetDiapers.push({ time: timeStr || new Date().toISOString() });
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function logVomitingAction(action, timeStr) {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  renderVomitingEpisodeCard();
}

function resolveVomitingEpisode() {
  const ep = getActiveVomitingEpisode();
  if (!ep) return;
  ep.status = 'resolved'; ep.resolvedAt = new Date().toISOString();
  save(KEYS.vomitingEpisodes, _vomitingEpisodes);
  renderVomitingEpisodeCard(); renderVomitingHistory(); renderHomeVomitingBanner(); renderHome();
}

function _voEpisodesIn12h(ep) {
  const cutoff = Date.now() - 12 * 3600000;
  return ep.episodes.filter(e => new Date(e.time).getTime() > cutoff);
}

function _voWetToday(ep) {
  const t = today();
  return ep.wetDiapers.filter(w => w.time && w.time.startsWith(t)).length;
}

function renderVomitingEpisodeCard() {
  const card = document.getElementById('vomitingEpisodeCard');
  if (!card) return;
  const ep = getActiveVomitingEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const recent12 = _voEpisodesIn12h(ep);
  const dur = _feverDurationStr(ep);
  const wetToday = _voWetToday(ep);
  const isProjectile = ep.episodes.some(e => e.type === 'projectile');
  const hasBile = ep.episodes.some(e => e.type === 'bile');
  const sevColor = (isProjectile || hasBile || recent12.length >= 4) ? 'var(--tc-danger)' : recent12.length >= 2 ? 'var(--tc-caution)' : 'var(--tc-amber)';
  const sevLabel = (isProjectile || hasBile) ? 'Seek care' : recent12.length >= 4 ? 'Frequent' : recent12.length >= 2 ? 'Monitor' : 'Mild';

  card.style.borderLeft = '4px solid ' + sevColor;
  let html = '<div class="card-header"><div class="card-title"><div class="icon icon-rose"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Vomiting Episode</div><span class="t-sm t-light">' + dur + '</span></div>';
  html += '<div class="ve-count-display" style="color:' + sevColor + ';">' + recent12.length + ' episode' + (recent12.length !== 1 ? 's' : '') + ' <span class="fs-sm-500">in 12h</span></div>';
  html += '<div class="text-center"><span class="fe-severity" style="background:rgba(220,120,80,0.12);color:' + sevColor + ';">' + sevLabel + '</span></div>';

  // Hydration
  html += '<div class="fe-section-title">' + zi('drop') + ' Hydration</div>';
  const hydPct = Math.min(100, Math.round((wetToday / 6) * 100));
  const hydColor = wetToday >= 6 ? 'var(--tc-sage)' : wetToday >= 4 ? 'var(--tc-amber)' : 'var(--tc-danger)';
  html += '<div class="de-hydra-bar"><div class="de-hydra-label">Wet diapers today</div><div class="de-hydra-track"><div class="de-hydra-fill" style="width:' + hydPct + '%;background:' + hydColor + ';"></div></div><div class="de-hydra-count" style="color:' + hydColor + ';">' + wetToday + '/6</div></div>';
  html += _epTimePickerHTML('voHydra');
  html += '<div class="fe-action-chips"><span class="fe-action-chip" onclick="logVomitingWetDiaper(_epGetSelectedTime(\'voHydra\'))">'+zi('drop')+' Wet diaper</span><span class="fe-action-chip" data-action="voLogFluidPrompt">'+zi('drop')+' Log fluid</span></div>';

  // Log vomiting
  html += '<div class="fe-section-title">Vomiting Log</div>';
  html += _epTimePickerHTML('voLog');
  html += '<div class="fe-action-chips">';
  html += '<span class="fe-action-chip" onclick="logVomitingEpisodeEntry(\'spit-up\', _epGetSelectedTime(\'voLog\'))">'+zi('warn')+' Spit-up</span>';
  html += '<span class="fe-action-chip" onclick="logVomitingEpisodeEntry(\'vomit\', _epGetSelectedTime(\'voLog\'))">'+zi('siren')+' Vomit</span>';
  html += '<span class="fe-action-chip" onclick="logVomitingEpisodeEntry(\'projectile\', _epGetSelectedTime(\'voLog\'))">'+zi('siren')+' Projectile</span>';
  html += '<span class="fe-action-chip" onclick="logVomitingEpisodeEntry(\'bile\', _epGetSelectedTime(\'voLog\'))">'+zi('warn')+' Bile/green</span>';
  html += '</div>';

  if (ep.episodes.length > 0) {
    ep.episodes.slice().reverse().slice(0, 6).forEach((e, i) => {
      const origIdx = ep.episodes.length - 1 - i;
      const icon = e.type === 'projectile' ? zi('siren') : e.type === 'bile' ? '●' : e.type === 'spit-up' ? zi('warn') : zi('siren');
      html += '<div class="de-stool-entry ep-entry-tap" data-action="voEditEntry" data-arg="' + origIdx + '"><span>' + icon + '</span><span style="font-size:var(--fs-xs);color:var(--light);min-width:60px;">' + _feverTimeShort(e.time) + '</span><span class="fs-sm-500">' + (e.type || 'vomit') + '</span></div>';
    });
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('voAction');
  html += '<div class="fe-action-chips">';
  ['Kept upright 30min', 'Small feed given', 'Breastfed', 'Doctor called'].forEach(a => {
    html += '<span class="fe-action-chip" onclick="logVomitingAction(\'' + a.replace(/'/g, "\\'") + '\', _epGetSelectedTime(\'voAction\'))">' + a + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 4).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="voEditAction" data-arg="' + origIdx + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div><div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Keep Ziva upright for 20–30 minutes after feeds</li>';
  html += '<li>Offer small, frequent feeds — not large volumes</li>';
  html += '<li>Continue breastfeeding normally</li>';
  html += '<li>Avoid new foods until vomiting stops</li>';
  if (isProjectile || hasBile) html += '<li class="status-action">'+zi('siren')+' Projectile/bile vomiting — seek immediate medical attention</li>';
  else html += '<li>Call doctor if vomiting persists >12 hours or contains blood/bile</li>';
  html += '</ul></div>';

  // Escalations
  if (isProjectile) html += '<div class="alert-block-danger">' + zi('siren') + ' Projectile vomiting detected — seek medical attention</div>';
  if (hasBile) html += '<div class="alert-block-danger">' + zi('siren') + ' Green/bile vomiting — seek immediate care</div>';
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 12 && !isProjectile && !hasBile) html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:var(--surface-caution);font-size:var(--fs-sm);font-weight:600;color:var(--tc-caution);">' + zi('warn') + ' Vomiting persisting >12 hours — call your paediatrician</div>';

  // Recovery check
  if (ep.episodes.length >= 2) {
    const lastEpTime = new Date(ep.episodes[ep.episodes.length - 1].time).getTime();
    const hoursSinceLast = (Date.now() - lastEpTime) / 3600000;
    if (hoursSinceLast >= 6) {
      html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' No vomiting for ' + Math.round(hoursSinceLast) + ' hours — may be resolving</div>';
    }
  }

  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="voResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice.</div>';
  card.innerHTML = html;
}

function voLogFluidPrompt() {
  const type = prompt('Fluid given:', 'Breast milk');
  if (type === null) return;
  const timeStr = _epGetSelectedTime('voHydra');
  logVomitingFluid(type, timeStr);
  showQLToast(zi('drop') + ' ' + type + ' logged');
}

// ── Vomiting Edit/Delete ──

function voEditEntry(idx) {
  const ep = getActiveVomitingEpisode();
  if (!ep || !ep.episodes[idx]) return;
  const e = ep.episodes[idx];
  _epEditEntry({
    title: 'Edit Vomiting Entry',
    fields: [
      { label: 'Type', id: 'type', type: 'select', value: e.type,
        options: [{value:'spit-up',label:zi('warn')+' Spit-up'},{value:'vomit',label:zi('siren')+' Vomit'},{value:'projectile',label:zi('siren')+' Projectile'},{value:'bile',label:zi('warn')+' Bile/green'}] },
      { label: 'Time', id: 'time', type: 'time', value: e.time },
      { label: 'Notes', id: 'notes', type: 'text', value: e.notes || '' }
    ],
    onSave: function(v) {
      ep.episodes[idx].type = v.type || e.type;
      ep.episodes[idx].time = _epTimeToISO(v.time);
      ep.episodes[idx].notes = v.notes || '';
      save(KEYS.vomitingEpisodes, _vomitingEpisodes);
      renderVomitingEpisodeCard(); renderHomeVomitingBanner();
      showQLToast(zi('siren') + ' Entry updated');
    },
    onDelete: function() {
      ep.episodes.splice(idx, 1);
      save(KEYS.vomitingEpisodes, _vomitingEpisodes);
      renderVomitingEpisodeCard(); renderHomeVomitingBanner();
      showQLToast('Entry deleted');
    }
  });
}

function voEditAction(idx) {
  const ep = getActiveVomitingEpisode();
  if (!ep || !ep.actions[idx]) return;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time);
      save(KEYS.vomitingEpisodes, _vomitingEpisodes);
      renderVomitingEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      ep.actions.splice(idx, 1);
      save(KEYS.vomitingEpisodes, _vomitingEpisodes);
      renderVomitingEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function voResolvePrompt() {
  confirmAction('Has vomiting stopped for at least 6 hours?', function() { resolveVomitingEpisode(); showQLToast('' + zi('check') + ' Vomiting episode resolved'); }, 'Resolve');
}

function renderHomeVomitingBanner() {
  const banner = document.getElementById('homeVomitingBanner');
  if (!banner) return;
  const ep = getActiveVomitingEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const recent12 = _voEpisodesIn12h(ep);
  const dur = _feverDurationStr(ep);
  banner.innerHTML = '<div class="ve-home-banner" data-nav-track-medical="vomitingEpisodeCard">' +
    '<div class="fe-home-banner-info"><div class="fe-home-banner-temp t-caution" >' + zi('siren') + ' ' + recent12.length + ' vomiting episodes/12h · ' + dur + '</div>' +
    '<div class="fe-home-banner-sub">Wet diapers: ' + _voWetToday(ep) + '/6</div></div>' +
    '<button class="btn btn-sage btn-sm-inline" data-action="logVomitingEpisodeEntry" data-stop="1" data-arg="\'vomit\'" >' + zi('note') + ' Log</button></div>';
}

function renderVomitingHistory() {
  const card = document.getElementById('vomitingHistoryCard');
  const summary = document.getElementById('vomitingHistorySummary');
  const body = document.getElementById('vomitingHistoryBody');
  if (!card || !summary || !body) return;
  const resolved = _vomitingEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';
  const last = resolved[resolved.length - 1];
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (last.resolvedAt ? ' · last: ' + formatDate(last.resolvedAt.split('T')[0]) : '') + '</div>';
  let html = '';
  resolved.slice().reverse().forEach(ep => {
    html += '<div class="fe-history-entry"><div class="fe-history-date">' + formatDate(ep.startedAt.split('T')[0]) + ' · ' + _feverDurationStr(ep) + '</div>';
    html += '<div class="fe-history-detail">' + ep.episodes.length + ' episodes · ' + ep.fluids.length + ' fluids logged</div>';
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeVomitingAlerts() {
  const alerts = [];
  const ep = getActiveVomitingEpisode();
  if (!ep) return alerts;
  const state = loadAlertState();
  const todayStr = today();

  if (ep.episodes.some(e => e.type === 'projectile' || e.type === 'bile')) {
    const key = 'vo-emergency-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-emergency', key, severity: 'urgent', icon: zi('siren'), title: 'Projectile/bile vomiting — seek care', body: '', tab: 'medical', dismissable: true });
  }
  const durationH = (Date.now() - new Date(ep.startedAt).getTime()) / 3600000;
  if (durationH > 12) {
    const key = 'vo-persist-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-persist', key, severity: 'watch', icon: zi('warn'), title: 'Vomiting persisting >12 hours', body: 'Call your paediatrician.', tab: 'medical', dismissable: true });
  }
  if (_voWetToday(ep) < 4 && new Date().getHours() >= 14) {
    const key = 'vo-wet-' + todayStr;
    if (!state.dismissed[key]) alerts.push({ id: 'vo-wet-low', key, severity: 'watch', icon: '🩲', title: 'Only ' + _voWetToday(ep) + ' wet diapers — watch hydration', body: '', tab: 'medical', dismissable: true });
  }
  return alerts;
}

function promptVomitingTrack() {
  if (getActiveVomitingEpisode()) { showQLToast('Vomiting episode already active'); return; }
  startVomitingEpisode('symptom-checker');
  showQLToast(zi('siren') + ' Vomiting episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() { renderVomitingEpisodeCard(); renderHomeVomitingBanner(); renderVomitingHistory(); document.getElementById('vomitingEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

// ── COLD / COUGH EPISODE TRACKING (v2.9) ──

let _coldEpisodes = [];
try { _coldEpisodes = JSON.parse(localStorage.getItem(KEYS.coldEpisodes)) || []; } catch { _coldEpisodes = []; }
if (!Array.isArray(_coldEpisodes)) _coldEpisodes = [];

function getActiveColdEpisode() { return _coldEpisodes.find(e => e.status === 'active') || null; }

function startColdEpisode(source) {
  if (getActiveColdEpisode()) return getActiveColdEpisode();
  if (_coldEpisodes.length > 20) _coldEpisodes = _coldEpisodes.slice(-20);
  const now = new Date().toISOString();
  const ep = { id: 'ce-' + Date.now(), status: 'active', startedAt: now, resolvedAt: null,
    dailyLogs: [],    // { date, symptoms: [...], severity: 1-5, notes }
    actions: [],
    triggerSource: source || 'manual', notes: '', resolvedNotes: '' };
  _coldEpisodes.push(ep);
  save(KEYS.coldEpisodes, _coldEpisodes);
  return ep;
}

function logColdDailySymptoms(symptoms, severity, notes) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayStr = today();
  // Replace today's log if already exists
  const existing = ep.dailyLogs.findIndex(l => l.date === todayStr);
  const entry = { date: todayStr, time: new Date().toISOString(), symptoms: symptoms || [], severity: severity || 3, notes: notes || '' };
  if (existing >= 0) ep.dailyLogs[existing] = entry;
  else ep.dailyLogs.push(entry);
  save(KEYS.coldEpisodes, _coldEpisodes);
  renderColdEpisodeCard(); renderHomeColdBanner();
}

function logColdAction(action, timeStr) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  ep.actions.push({ time: timeStr || new Date().toISOString(), action: action });
  save(KEYS.coldEpisodes, _coldEpisodes);
  renderColdEpisodeCard();
}

function resolveColdEpisode() {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  ep.status = 'resolved'; ep.resolvedAt = new Date().toISOString();
  save(KEYS.coldEpisodes, _coldEpisodes);
  renderColdEpisodeCard(); renderColdHistory(); renderHomeColdBanner(); renderHome();
}

function renderColdEpisodeCard() {
  const card = document.getElementById('coldEpisodeCard');
  if (!card) return;
  const ep = getActiveColdEpisode();
  if (!ep) { card.style.display = 'none'; return; }
  card.style.display = '';

  const dur = _feverDurationStr(ep);
  const dayCount = ep.dailyLogs.length;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);
  const latestSeverity = todayLog ? todayLog.severity : (ep.dailyLogs.length > 0 ? ep.dailyLogs[ep.dailyLogs.length - 1].severity : 3);
  const sevColor = latestSeverity >= 4 ? 'var(--tc-caution)' : 'var(--tc-sky)';

  card.style.borderLeft = '4px solid ' + sevColor;
  let html = '<div class="card-header"><div class="card-title"><div class="icon icon-sky"><svg class="zi"><use href="#zi-medical"/></svg></div> Active Cold / Cough</div><span class="t-sm t-light">' + dur + '</span></div>';
  html += '<div class="ce-day-display">Day ' + durationDays + '</div>';
  html += '<div style="text-align:center;font-size:var(--fs-xs);color:var(--light);">' + dayCount + ' daily log' + (dayCount !== 1 ? 's' : '') + ' recorded</div>';

  // Today's symptom log
  html += '<div class="fe-section-title">Today\'s Symptoms</div>';
  const COLD_SYMPTOMS = ['Runny nose', 'Stuffy nose', 'Cough', 'Sneezing', 'Phlegm', 'Watery eyes', 'Mild fever', 'Poor appetite', 'Fussiness'];
  const todaySymptoms = todayLog ? new Set(todayLog.symptoms) : new Set();
  html += '<div class="fe-action-chips">';
  COLD_SYMPTOMS.forEach(s => {
    const active = todaySymptoms.has(s);
    html += '<span class="fe-action-chip" style="' + (active ? 'background:var(--sage);color:white;' : '') + '" onclick="ceToggleSymptom(\'' + s.replace(/'/g, "\\'") + '\')">' + (active ? '✓ ' : '') + s + '</span>';
  });
  html += '</div>';

  // Severity slider
  html += '<div style="padding:var(--sp-8) 0;"><div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:4px;">Severity today (1=mild, 5=severe):</div>';
  html += '<div style="display:flex;gap:var(--sp-4);align-items:center;">';
  for (let i = 1; i <= 5; i++) {
    const isActive = latestSeverity === i;
    const color = i <= 2 ? 'var(--tc-sage)' : i <= 3 ? 'var(--tc-amber)' : 'var(--tc-caution)';
    html += '<span class="fe-action-chip" style="' + (isActive ? 'background:' + color + ';color:white;border-color:' + color + ';' : '') + 'min-width:32px;justify-content:center;" onclick="ceSetSeverity(' + i + ')">' + i + '</span>';
  }
  html += '</div></div>';

  // Daily log history
  if (ep.dailyLogs.length > 0) {
    html += '<div class="fe-section-title">Daily Log</div>';
    ep.dailyLogs.slice().reverse().slice(0, 7).forEach(l => {
      const sevDots = '●'.repeat(l.severity) + '○'.repeat(5 - l.severity);
      html += '<div class="ce-symptom-row"><span style="font-size:var(--fs-xs);color:var(--light);min-width:55px;">' + formatDate(l.date) + '</span>';
      html += '<span style="font-size:var(--fs-xs);letter-spacing:2px;" title="Severity ' + l.severity + '/5">' + sevDots + '</span>';
      html += '<span style="font-size:var(--fs-xs);color:var(--mid);flex:1;min-width:0;">' + (l.symptoms.length > 0 ? l.symptoms.slice(0, 3).join(', ') : 'no symptoms logged') + '</span></div>';
    });
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('ceAction');
  html += '<div class="fe-action-chips">';
  ['Saline drops', 'Steam inhalation', 'Humidifier on', 'Elevated mattress', 'Breastfed', 'Doctor called'].forEach(a => {
    html += '<span class="fe-action-chip" onclick="logColdAction(\'' + a.replace(/'/g, "\\'") + '\', _epGetSelectedTime(\'ceAction\'))">' + a + '</span>';
  });
  html += '</div>';
  if (ep.actions.length > 0) {
    ep.actions.slice().reverse().slice(0, 4).forEach((a, i) => {
      const origIdx = ep.actions.length - 1 - i;
      html += '<div class="fe-action-entry ep-entry-tap" data-action="ceEditAction" data-arg="' + origIdx + '">' + _feverTimeShort(a.time) + ' — ' + escHtml(a.action) + '</div>';
    });
  }

  // Guidance
  html += '<div class="fe-section-title">Guidance</div><div class="fe-guidance"><ul class="ep-list">';
  html += '<li>Use saline drops (Nasivion Mini) before feeds</li>';
  html += '<li>Run humidifier or steam inhalation (steamy bathroom 5–10 min)</li>';
  html += '<li>Elevate head end of mattress slightly</li>';
  html += '<li>Do NOT give OTC cold/cough medicines</li>';
  html += '<li>Do NOT use Vicks or menthol on babies</li>';
  if (durationDays > 7) html += '<li style="color:var(--tc-caution);font-weight:600;">' + zi('warn') + ' Cold persisting >7 days — consult paediatrician</li>';
  else html += '<li>Call doctor if: rapid breathing, wheezing, blue lips, or cough >7 days</li>';
  html += '</ul></div>';

  if (durationDays > 7) html += '<div style="padding:8px 12px;border-radius:var(--r-md);margin:var(--sp-4) 0;background:var(--surface-caution);font-size:var(--fs-sm);font-weight:600;color:var(--tc-caution);">' + zi('warn') + ' Cold/cough for ' + durationDays + ' days — consider doctor visit</div>';

  // Improvement
  if (ep.dailyLogs.length >= 2) {
    const last2 = ep.dailyLogs.slice(-2);
    if (last2[1].severity <= 2 && last2[0].severity > last2[1].severity) {
      html += '<div style="padding:10px 12px;border-radius:var(--r-md);margin:var(--sp-8) 0;background:rgba(58,112,96,0.08);font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;">' + zi('check') + ' Severity improving — trending down</div>';
    }
  }

  html += '<div class="fe-resolve"><button class="btn btn-ghost w-full" data-action="ceResolvePrompt" data-arg="" >' + zi('check') + ' Mark Resolved</button></div>';
  html += '<div class="source-attribution">Guidance only — not medical advice.</div>';
  card.innerHTML = html;
}

function ceToggleSymptom(symptom) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const currentSymptoms = todayLog ? [...todayLog.symptoms] : [];
  const currentSev = todayLog ? todayLog.severity : 3;
  const idx = currentSymptoms.indexOf(symptom);
  if (idx >= 0) currentSymptoms.splice(idx, 1);
  else currentSymptoms.push(symptom);
  logColdDailySymptoms(currentSymptoms, currentSev, '');
}

function ceSetSeverity(sev) {
  const ep = getActiveColdEpisode();
  if (!ep) return;
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const currentSymptoms = todayLog ? todayLog.symptoms : [];
  logColdDailySymptoms(currentSymptoms, sev, '');
}

function ceResolvePrompt() {
  confirmAction('Has the cold/cough resolved? (Symptoms mostly cleared for 24+ hours)', function() { resolveColdEpisode(); showQLToast(zi('check') + ' Cold episode resolved'); }, 'Resolve');
}

// ── Cold Edit/Delete ──

function ceEditAction(idx) {
  const ep = getActiveColdEpisode();
  if (!ep || !ep.actions[idx]) return;
  const a = ep.actions[idx];
  _epEditEntry({
    title: 'Edit Action',
    fields: [
      { label: 'Action', id: 'action', type: 'text', value: a.action },
      { label: 'Time', id: 'time', type: 'time', value: a.time }
    ],
    onSave: function(v) {
      ep.actions[idx].action = v.action || a.action;
      ep.actions[idx].time = _epTimeToISO(v.time);
      save(KEYS.coldEpisodes, _coldEpisodes);
      renderColdEpisodeCard();
      showQLToast('Action updated');
    },
    onDelete: function() {
      ep.actions.splice(idx, 1);
      save(KEYS.coldEpisodes, _coldEpisodes);
      renderColdEpisodeCard();
      showQLToast('Action deleted');
    }
  });
}

function renderHomeColdBanner() {
  const banner = document.getElementById('homeColdBanner');
  if (!banner) return;
  const ep = getActiveColdEpisode();
  if (!ep) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);
  const todayLog = ep.dailyLogs.find(l => l.date === today());
  const logged = todayLog ? '✓ Logged' : 'Not logged yet';
  banner.innerHTML = '<div class="ce-home-banner" data-nav-track-medical="coldEpisodeCard">' +
    '<div class="fe-home-banner-info"><div class="fe-home-banner-temp t-sky" >' + zi('siren') + ' Cold/Cough · Day ' + durationDays + '</div>' +
    '<div class="fe-home-banner-sub">Today: ' + logged + '</div></div>' +
    '<button class="btn btn-sage btn-sm-inline" onclick="event.stopPropagation();switchTab(\'track\');setTimeout(function(){switchTrackSub(\'medical\');},100);" >' + zi('note') + ' Log</button></div>';
}

function renderColdHistory() {
  const card = document.getElementById('coldHistoryCard');
  const summary = document.getElementById('coldHistorySummary');
  const body = document.getElementById('coldHistoryBody');
  if (!card || !summary || !body) return;
  const resolved = _coldEpisodes.filter(e => e.status === 'resolved');
  if (resolved.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';
  const last = resolved[resolved.length - 1];
  summary.innerHTML = '<div class="t-sm t-light">' + resolved.length + ' episode' + (resolved.length !== 1 ? 's' : '') + (last.resolvedAt ? ' · last: ' + formatDate(last.resolvedAt.split('T')[0]) : '') + '</div>';
  let html = '';
  resolved.slice().reverse().forEach(ep => {
    const days = Math.ceil((new Date(ep.resolvedAt || Date.now()).getTime() - new Date(ep.startedAt).getTime()) / 86400000);
    html += '<div class="fe-history-entry"><div class="fe-history-date">' + formatDate(ep.startedAt.split('T')[0]) + ' · ' + days + ' day' + (days !== 1 ? 's' : '') + '</div>';
    html += '<div class="fe-history-detail">' + ep.dailyLogs.length + ' daily logs · ' + ep.actions.length + ' actions</div>';
    html += _renderAttribution(ep);
    html += '</div>';
  });
  body.innerHTML = html;
}

function computeColdAlerts() {
  const alerts = [];
  const ep = getActiveColdEpisode();
  if (!ep) return alerts;
  const state = loadAlertState();
  const todayStr = today();
  const durationDays = Math.ceil((Date.now() - new Date(ep.startedAt).getTime()) / 86400000);

  // Daily log reminder
  const todayLog = ep.dailyLogs.find(l => l.date === todayStr);
  if (!todayLog && new Date().getHours() >= 10) {
    const key = 'ce-log-' + todayStr;
    if (!state.dismissed[key]) alerts.push({ id: 'ce-log-reminder', key, severity: 'info', icon: zi('siren'), title: 'Cold/cough — log today\'s symptoms', body: 'Day ' + durationDays + '. Tap to update today\'s symptom check.', action: { label: 'Log', fn: 'switchTab("track");setTimeout(function(){switchTrackSub("medical");},100);' }, tab: 'medical', dismissable: true });
  }
  if (durationDays > 7) {
    const key = 'ce-persist-' + ep.id;
    if (!state.dismissed[key]) alerts.push({ id: 'ce-persist', key, severity: 'watch', icon: zi('warn'), title: 'Cold/cough for ' + durationDays + ' days', body: 'Consider consulting your paediatrician.', tab: 'medical', dismissable: true });
  }
  return alerts;
}

function promptColdTrack() {
  if (getActiveColdEpisode()) { showQLToast('Cold episode already active'); return; }
  startColdEpisode('symptom-checker');
  showQLToast(zi('siren') + ' Cold/cough episode started');
  switchTab('track');
  setTimeout(function() { switchTrackSub('medical'); }, 100);
  setTimeout(function() { renderColdEpisodeCard(); renderHomeColdBanner(); renderColdHistory(); document.getElementById('coldEpisodeCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

// Get top foods for a specific meal slot
function getMealSlotTopFoods(mealKey, n) {
  const counts = {};
  Object.values(feedingData).forEach(day => {
    const val = day[mealKey];
    if (!val || val === '—skipped—') return;
    val.split(',').forEach(item => {
      const trimmed = item.trim();
      if (trimmed.length <= 2) return;
      const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
      if (!counts[normalized]) counts[normalized] = { display: trimmed, count: 0 };
      counts[normalized].count++;
    });
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(m => ({ name: m.display.charAt(0).toUpperCase() + m.display.slice(1), count: m.count }));
}

function insertDietFood(meal, food) {
  const inp = document.getElementById('meal-' + meal);
  if (!inp || inp.disabled) return;
  const current = inp.value.trim();
  inp.value = current ? current + ', ' + food : food;
  updateMealInsight(meal);
  // Hide the zone after inserting since meal now has content
  const zone = document.getElementById('dqp-' + meal);
  if (zone) { zone.innerHTML = ''; zone.classList.remove('has-pills'); }
  renderDietIntelBanner();
  inp.focus();
}

function fillDietMeal(meal, value) {
  const inp = document.getElementById('meal-' + meal);
  if (!inp || inp.disabled) return;
  inp.value = value;
  updateMealInsight(meal);
  // Hide the zone after filling
  const zone = document.getElementById('dqp-' + meal);
  if (zone) { zone.innerHTML = ''; zone.classList.remove('has-pills'); }
  renderDietIntelBanner();
  inp.focus();
}

function saveFeedingDay() {
  const d = document.getElementById('feedingDate').value;
  const existing = feedingData[d] || {};
  feedingData[d] = {
    breakfast: document.getElementById('meal-breakfast').disabled ? (existing.breakfast || '') : document.getElementById('meal-breakfast').value,
    lunch:     document.getElementById('meal-lunch').disabled ? (existing.lunch || '') : document.getElementById('meal-lunch').value,
    dinner:    document.getElementById('meal-dinner').disabled ? (existing.dinner || '') : document.getElementById('meal-dinner').value,
    snack:     document.getElementById('meal-snack').disabled ? (existing.snack || '') : document.getElementById('meal-snack').value,
  };
  // Save optional meal times
  ['breakfast','lunch','dinner','snack'].forEach(m => {
    const timeVal = document.getElementById('mealtime-' + m)?.value || '';
    if (timeVal) {
      feedingData[d][m + '_time'] = timeVal;
    } else if (existing[m + '_time']) {
      feedingData[d][m + '_time'] = existing[m + '_time'];
    }
    // Preserve existing intake values
    if (existing[m + '_intake'] !== undefined) {
      feedingData[d][m + '_intake'] = existing[m + '_intake'];
    }
  });
  save(KEYS.feeding, feedingData);
  _tsfMarkDirty();
  _islMarkDirty('diet');
  // Auto-introduce any new foods from all meal slots
  autoIntroduceFoodsFromDay(d);
  renderFeedingHistory();
  renderTips();
  renderFoods();
  renderDietStats();
  renderDietIntelBanner();
  showPostSaveFlash(d);
  matchSuggestionsAfterSave(d);
  _miRenderDietTabIntake();
}

// ── Post-Save Nutrition Flash ──

let _psfTimer = null;
let _lastPsfData = null; // Persisted flash data for home card

function showPostSaveFlash(dateStr) {
  const overlay = document.getElementById('psfOverlay');
  if (!overlay) return;

  const entry = feedingData[dateStr];
  if (!entry) return;

  const MEALS = ['breakfast','lunch','dinner','snack'];
  const MEAL_LABELS = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' };
  const MEAL_EMOJI = { breakfast:zi('sun'), lunch:zi('bolt'), dinner:zi('moon'), snack:zi('spoon') };
  const NUTRIENT_EMOJI = { iron:zi('flame'), calcium:zi('ruler'), protein:zi('run'), 'vitamin C':zi('spoon'), fibre:zi('bowl'), 'vitamin A':zi('baby'), 'omega-3':zi('brain'), zinc:zi('shield') };

  // 1. Gather all nutrients from today's meals
  const allNutrients = new Set();
  const allTags = new Set();
  const allFoods = [];
  const mealFoods = {};
  let loggedMeals = 0;
  let emptyMeals = [];

  MEALS.forEach(m => {
    const val = entry[m];
    if (!isRealMeal(val)) {
      if (val !== '—skipped—') emptyMeals.push(m);
      return;
    }
    loggedMeals++;
    mealFoods[m] = val;
    const items = parseMealNutrition(val);
    items.forEach(item => {
      (item.nutrients || []).forEach(n => allNutrients.add(n));
      (item.tags || []).forEach(t => allTags.add(t));
      allFoods.push(item.food);
    });
  });

  if (loggedMeals === 0) {
    // Nothing logged — just show quick confirmation
    _psfFallbackToast();
    return;
  }

  // 2. Covered vs missing key nutrients
  const covered = KEY_NUTRIENTS.filter(n => allNutrients.has(n));
  const missing = KEY_NUTRIENTS.filter(n => !allNutrients.has(n));

  // 3. Food group diversity
  const groupSet = new Set();
  allFoods.forEach(f => {
    const cls = classifyFoodToGroup(f);
    if (cls) groupSet.add(cls.groupLabel);
  });

  // 4. Detect synergies present in today's meals
  const synergiesFound = [];
  const allFoodLower = allFoods.map(f => f.toLowerCase());
  FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
    const hasF1 = allFoodLower.some(f => f.includes(f1) || f1.includes(f));
    const hasF2 = allFoodLower.some(f => f.includes(f2) || f2.includes(f));
    if (hasF1 && hasF2) synergiesFound.push({ reason, type });
  });

  // 5. Build next-meal suggestion
  let tipHtml = '';
  if (missing.length > 0 && emptyMeals.length > 0) {
    const topGap = missing[0]; // Most important missing nutrient (iron first in KEY_NUTRIENTS)
    const nextMeal = emptyMeals[0];
    // Find introduced foods that provide this nutrient
    const providers = (foods || []).filter(f => {
      const nut = getNutrition(f.name);
      return nut && nut.nutrients && nut.nutrients.some(n => n.toLowerCase() === topGap.toLowerCase());
    }).slice(0, 3).map(f => f.name);

    if (providers.length > 0) {
      // Check if any synergy partner exists for the suggestion
      let synergyHint = '';
      providers.forEach(p => {
        if (synergyHint) return;
        FOOD_SYNERGIES.forEach(([f1, f2, reason]) => {
          if (synergyHint) return;
          const pLow = p.toLowerCase();
          if (pLow.includes(f1) || f1.includes(pLow)) {
            const partner = (foods || []).find(fi => fi.name.toLowerCase().includes(f2));
            if (partner) synergyHint = ' + ' + partner.name + ' (better absorption)';
          } else if (pLow.includes(f2) || f2.includes(pLow)) {
            const partner = (foods || []).find(fi => fi.name.toLowerCase().includes(f1));
            if (partner) synergyHint = ' + ' + partner.name + ' (better absorption)';
          }
        });
      });

      tipHtml = `<div class="psf-tip">${zi('bulb')} For <strong>${MEAL_LABELS[nextMeal].toLowerCase()}</strong>, try <strong>${escHtml(providers[0])}${synergyHint ? escHtml(synergyHint) : ''}</strong> to add ${NUTRIENT_EMOJI[topGap] || ''} ${topGap}</div>`;
    } else {
      tipHtml = `<div class="psf-tip">${zi('bulb')} ${MEAL_LABELS[nextMeal]} is open — a good chance to add ${NUTRIENT_EMOJI[topGap] || ''} ${topGap}</div>`;
    }
  } else if (missing.length > 0 && emptyMeals.length === 0) {
    // All meals logged but some nutrients missing
    const topGap = missing[0];
    tipHtml = `<div class="psf-tip">${zi('bulb')} Tomorrow, aim to include a ${topGap} source like ${_suggestFoodForNutrient(topGap)}</div>`;
  } else if (missing.length === 0) {
    tipHtml = `<div class="psf-tip" style="background:rgba(58,112,96,0.08);color:var(--tc-sage);font-weight:600;">${zi('sparkle')} All 8 key nutrients covered today!</div>`;
  }

  // 6. Build header summary
  const headerText = loggedMeals === 1
    ? MEAL_LABELS[MEALS.find(m => isRealMeal(entry[m]))] + ' saved'
    : loggedMeals + ' meals saved';
  const subText = covered.length + '/' + KEY_NUTRIENTS.length + ' key nutrients · ' + groupSet.size + ' food group' + (groupSet.size !== 1 ? 's' : '');

  // 7. Synergy line
  let synergyHtml = '';
  if (synergiesFound.length > 0) {
    const best = synergiesFound[0];
    const emoji = best.type === 'absorption' ? zi('link') : best.type === 'complete' ? zi('sparkle') : zi('sprout');
    synergyHtml = `<div class="psf-synergy">${emoji} ${escHtml(best.reason)}</div>`;
  }

  // 8. Render
  let nutrientHtml = '';
  covered.forEach(n => {
    nutrientHtml += `<span class="psf-nut">${NUTRIENT_EMOJI[n] || '·'} ${n}</span>`;
  });
  // Show up to 3 missing
  missing.slice(0, 3).forEach(n => {
    nutrientHtml += `<span class="psf-nut missed">${NUTRIENT_EMOJI[n] || '·'} ${n}</span>`;
  });
  if (missing.length > 3) {
    nutrientHtml += `<span class="psf-nut missed">+${missing.length - 3} more</span>`;
  }

  // Persist for home card
  _lastPsfData = {
    dateStr, headerText, subText, covered: [...covered], missing: [...missing],
    synergy: synergiesFound.length > 0 ? synergiesFound[0] : null,
    tipHtml, nutrientHtml, synergyHtml, groups: groupSet.size, loggedMeals
  };

  overlay.innerHTML = `<div class="psf-card">
    <div class="psf-header">
      <div class="psf-check">${zi('check')}</div>
      <div>
        <div class="psf-title">${headerText}</div>
        <div class="psf-subtitle">${subText}</div>
      </div>
    </div>
    <div class="psf-body">
      <div class="psf-nutrients">${nutrientHtml}</div>
      ${synergyHtml}
      ${tipHtml}
    </div>
    <button class="psf-dismiss" data-action="dismissPostSaveFlash">Tap to dismiss</button>
  </div>`;

  overlay.classList.add('open');

  // Show intake prompt after brief delay to let user see nutrition summary first
  var intakeDateStr = dateStr;
  setTimeout(function() { _miShowPostSavePrompt(intakeDateStr); }, 300);

  // Auto-dismiss after 10s (extended from 6s to give time for intake selection)
  if (_psfTimer) clearTimeout(_psfTimer);
  _psfTimer = setTimeout(dismissPostSaveFlash, 10000);
}

function dismissPostSaveFlash() {
  const overlay = document.getElementById('psfOverlay');
  if (overlay) overlay.classList.remove('open');
  if (_psfTimer) { clearTimeout(_psfTimer); _psfTimer = null; }
  // Refresh home to show persisted summary
  renderHomeMealProgress();
}

function openDiversityDetail() {
  switchTab('info');
  // Wait for info tab to render, then expand and scroll to Meal Breakdown
  setTimeout(() => {
    const body = document.getElementById('infoMealBreakdownBody');
    const chevron = document.getElementById('infoMealBreakdownChevron');
    if (body && body.style.display === 'none') {
      body.style.display = '';
      if (chevron) chevron.textContent = '▴';
    }
    const card = document.getElementById('infoMealBreakdownCard');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function showPsfReview() {
  if (!_lastPsfData) return;
  const d = _lastPsfData;
  const overlay = document.getElementById('psfOverlay');
  if (!overlay) return;

  overlay.innerHTML = `<div class="psf-card">
    <div class="psf-header">
      <div class="psf-check">${zi('check')}</div>
      <div>
        <div class="psf-title">${d.headerText}</div>
        <div class="psf-subtitle">${d.subText}</div>
      </div>
    </div>
    <div class="psf-body">
      <div class="psf-nutrients">${d.nutrientHtml}</div>
      ${d.synergyHtml}
      ${d.tipHtml}
    </div>
    <button class="psf-dismiss" data-action="dismissPostSaveFlash">Tap to dismiss</button>
  </div>`;

  overlay.classList.add('open');
  if (_psfTimer) clearTimeout(_psfTimer);
  // No auto-dismiss on review — user taps to close
}

function _suggestFoodForNutrient(nutrient) {
  const suggestions = {
    iron: 'ragi, spinach, or masoor dal',
    calcium: 'ragi, curd, or paneer',
    protein: 'moong dal, paneer, or curd',
    'vitamin C': 'orange, tomato, or amla',
    fibre: 'banana, oats, or sweet potato',
    'vitamin A': 'carrot, sweet potato, or mango',
    'omega-3': 'walnuts, flaxseed, or avocado',
    zinc: 'bajra, oats, or dal'
  };
  return suggestions[nutrient] || 'a variety of foods';
}

function _psfFallbackToast() {
  const btn = document.getElementById('saveFeedBtn');
  if (btn) { btn.textContent = 'Saved!'; setTimeout(() => btn.textContent = 'Save', 1500); }
}

// Scan all meals for a given date and auto-add new foods to Foods Introduced
function autoIntroduceFoodsFromDay(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return;
  let added = false;
  ['breakfast','lunch','dinner','snack'].forEach(meal => {
    if (!isRealMeal(entry[meal])) return;
    entry[meal].split(/[,+]/).forEach(f => {
      const clean = f.trim();
      if (clean.length <= 1) return;
      const base = _baseFoodName(clean.toLowerCase());
      const alreadyExists = foods.some(fi => {
        const fb = _baseFoodName(fi.name.toLowerCase().trim());
        return fb === base || fb.includes(base) || base.includes(fb);
      });
      if (!alreadyExists) {
        foods.push({ name: clean, reaction: 'ok', date: dateStr });
        added = true;
      }
    });
  });
  if (added) save(KEYS.foods, foods);
}

function changeDate(dir) {
  const inp = document.getElementById('feedingDate');
  const d = new Date(inp.value);
  d.setDate(d.getDate() + dir);
  inp.value = toDateStr(d);
  loadFeedingDay();
}

// ─────────────────────────────────────────

// v1.9 — QUICK LOG FAB
// ─────────────────────────────────────────
let _qlOpen = false;
let _qlMeal = 'breakfast';
let _qlWake = 0;
let _qlColor = 'yellow';
let _qlCon = 'normal';
let _qlScrollY = 0;

function qlLockBody() {
  _qlScrollY = window.scrollY;
  document.documentElement.classList.add('ql-locked');
  document.body.classList.add('ql-locked');
  document.body.style.top = -_qlScrollY + 'px';
}

function qlUnlockBody() {
  document.documentElement.classList.remove('ql-locked');
  document.body.classList.remove('ql-locked');
  document.body.style.top = '';
  window.scrollTo(0, _qlScrollY);
}

function toggleQuickLog() {
  if (_qlOpen) { closeQuickLog(); }
  else { openQuickLog(); }
}

function openQuickLog() {
  _qlOpen = true;
  qlLockBody();
  document.getElementById('qlFab').classList.add('ql-fab-open');
  document.getElementById('qlSheetOverlay').classList.add('open');
  document.getElementById('qlSheet').classList.add('open');
  // Smart Quick Log: render predictions if not in backfill mode
  if (!_qlBackfillDate) {
    _qlActivePredictions = _qlPredict();
    _qlRenderSuggest(_qlActivePredictions);
  }
}

function closeQuickLog() {
  _qlOpen = false;
  _qlSuggestUsed = false;
  _qlActivePredictions = [];
  qlUnlockBody();
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlSheet').classList.remove('open');
  var sw = document.getElementById('qlSuggestWrap');
  if (sw) { sw.classList.add('ql-suggest-hidden'); sw.innerHTML = ''; }
}

function openQuickModal(type) {
  // Close sheet visually but keep body locked
  document.getElementById('qlSheet').classList.remove('open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  _qlOpen = false;
  // Body stays locked — modal takes over

  // Pre-fill defaults
  if (type === 'feed') {
    _qlMeal = detectMealType();
    if (!_qlBackfillDate) _qlBackfillDate = null; // ensure reset for non-backfill
    document.querySelectorAll('.ql-meal-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.meal === _qlMeal);
    });
    document.getElementById('qlFeedInput').value = '';
    const qlTimeEl = document.getElementById('qlFeedTime');
    if (qlTimeEl) qlTimeEl.value = '';
    const qlDD = document.getElementById('qlFeedDropdown');
    if (qlDD) qlDD.classList.remove('open');
    renderQLSameAsPills();
    renderQLFreqPills();
    // Reset intake pills to default (Most)
    _miWireQLIntakePills();
    // Hide backfill UI unless in backfill mode
    const bfWrap = document.getElementById('qlBackfillWrap');
    if (bfWrap) bfWrap.style.display = _qlBackfillDate ? '' : 'none';
  }
  if (type === 'sleep') {
    _qlWake = 0;
    document.getElementById('qlWakeVal').textContent = '0';
    // Same-as-last: pre-fill from most recent night entry
    const lastNight = sleepData.filter(e => e.type === 'night').sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    if (lastNight) {
      document.getElementById('qlSleepBed').value = lastNight.bedtime || '20:00';
      document.getElementById('qlSleepWake').value = lastNight.wakeTime || '06:00';
      _qlWake = getWakeCount(lastNight);
      document.getElementById('qlWakeVal').textContent = _qlWake;
    } else {
      document.getElementById('qlSleepBed').value = '20:00';
      document.getElementById('qlSleepWake').value = '06:00';
    }
  }
  if (type === 'nap') {
    // Round current time to nearest 15 min for start
    const now = new Date();
    const mins = Math.round(now.getMinutes() / 15) * 15;
    now.setMinutes(mins, 0, 0);
    const startStr = now.toTimeString().slice(0, 5);
    document.getElementById('qlNapStart').value = startStr;
    document.getElementById('qlNapEnd').value = '';
  }
  if (type === 'poop') {
    // Same-as-last: pre-fill from most recent poop
    const lastPoop = poopData.slice().sort((a, b) => ((b.date||'') + (b.time||'')).localeCompare((a.date||'') + (a.time||'')))[0];
    if (lastPoop) {
      _qlColor = lastPoop.color || 'yellow';
      _qlCon = lastPoop.consistency || 'normal';
    } else {
      _qlColor = 'yellow';
      _qlCon = 'normal';
    }
    document.querySelectorAll('.ql-color-dot').forEach(d => d.classList.toggle('active', d.dataset.color === _qlColor));
    document.querySelectorAll('.ql-con-pill').forEach(p => p.classList.toggle('active', p.dataset.con === _qlCon));
    // Pre-fill time to now
    document.getElementById('qlPoopTime').value = new Date().toTimeString().slice(0, 5);
  }
  if (type === 'activity') {
    // BN-4: Reset stale state from previous modal opens
    _alLastSuggestionText = null;
    _alDetectedEvidence = [];
    _alPrefillSource = _alPrefillSource || 'manual';
    _alOtherDurVisible = false;

    document.getElementById('alTextInput').value = _alPrefillText || '';

    // Inject slot + duration containers (first open only)
    _alInjectSlotDurContainers();

    // Auto-select current time slot
    _alSelectedSlot = _alCurrentSlot();
    _alRenderTimeSlots();

    // Duration: use prefill if available, else default to null (skip)
    if (_alPrefillDuration) {
      _alSelectedDuration = parseInt(_alPrefillDuration);
    } else {
      _alSelectedDuration = null;
    }
    _alRenderDurationChips();

    if (_alPrefillText) {
      // Pre-fill: classify immediately (skip debounce)
      const result = classifyActivity(_alPrefillText);
      _alDetectedEvidence = result.evidence;
      renderActivityChips();
    } else {
      document.getElementById('alDetectChips').innerHTML = '<div class="al-detect-empty">Type above to auto-detect milestones</div>';
    }
    _alPrefillText = null;
    _alPrefillDuration = null;
    // Session B: render suggestions, yesterday, domain nudge
    _alRenderSessionB();
  }
  document.getElementById('qlModal-' + type).classList.add('open');
}

function closeQuickModal() {
  document.querySelectorAll('.ql-modal-overlay').forEach(m => m.classList.remove('open'));
  _qlBackfillDate = null;
  _alPrefillSource = 'manual'; // Reset activity source on cancel
  ['sleep', 'nap', 'poop'].forEach(t => {
    const el = document.getElementById('qlBf-' + t);
    if (el) el.remove();
  });
  // Return to bottom sheet instead of exiting entirely
  resetQLSheet();
  openQuickLog();
}

function closeQuickLogAll() {
  // Close everything — modal + sheet + unlock body (used after successful save)
  document.querySelectorAll('.ql-modal-overlay').forEach(m => m.classList.remove('open'));
  document.getElementById('qlSheet').classList.remove('open');
  document.getElementById('qlSheetOverlay').classList.remove('open');
  document.getElementById('qlFab').classList.remove('ql-fab-open');
  qlUnlockBody();
  _qlOpen = false;
  _qlSuggestUsed = false;
  _qlActivePredictions = [];
  _qlBackfillDate = null;
  // Clean up injected backfill date pickers from non-feed modals
  ['sleep', 'nap', 'poop'].forEach(t => {
    const el = document.getElementById('qlBf-' + t);
    if (el) el.remove();
  });
  // Reset bottom sheet to default options
  resetQLSheet();
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOG: Modal handlers
// ═══════════════════════════════════════════════════════════════

let _alDetectedEvidence = [];
let _alPrefillText = null;
let _alPrefillDuration = null;
let _alPrefillSource = 'manual';
let _alInputTimer = null;
let _alSelectedSlot = null;
let _alSelectedDuration = null;
let _alOtherDurVisible = false;
let _alLastSuggestionText = null;
let _alSlotsInjected = false;

// ── Time Slots (Component 1) ──
const SLOT_MIDPOINTS = {
  morning:   { h: 8, m: 30 },
  afternoon: { h: 13, m: 30 },
  evening:   { h: 18, m: 30 },
  night:     { h: 22, m: 0 },
};

const SLOT_META = [
  { key: 'morning',   label: 'Morning',   short: 'AM',    icon: 'sun',  range: '6–11' },
  { key: 'afternoon', label: 'Afternoon', short: 'PM',    icon: 'sun',  range: '11–4' },
  { key: 'evening',   label: 'Evening',   short: 'Eve',   icon: 'moon', range: '4–9' },
  { key: 'night',     label: 'Night',     short: 'Night', icon: 'star', range: '9–5' },
];

const AL_DURATION_CHIPS = [5, 10, 15, 20, 30];

function _alCurrentSlot() {
  var h = new Date().getHours();
  if (h >= 6 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

function _alSlotToTimestamp(slot) {
  var now = new Date();
  var currentSlot = _alCurrentSlot();
  var baseDate = _qlBackfillDate ? new Date(_qlBackfillDate + 'T12:00:00') : new Date();
  if (slot === currentSlot && !_qlBackfillDate) {
    return now.toISOString();
  }
  var mp = SLOT_MIDPOINTS[slot];
  baseDate.setHours(mp.h, mp.m, 0, 0);
  return baseDate.toISOString();
}

function _alRenderTimeSlots() {
  var container = document.getElementById('alSlotRow');
  if (!container) return;
  var html = '<div class="al-slot-label">' + zi('clock') + ' When</div><div class="al-slot-chips">';
  SLOT_META.forEach(function(s) {
    var cls = _alSelectedSlot === s.key ? ' active' : '';
    html += '<button class="al-slot' + cls + '" data-action="alSelectSlot" data-arg="' + s.key + '">' +
      '<span class="al-slot-icon">' + zi(s.icon) + '</span>' +
      '<span class="al-slot-text">' + escHtml(s.label) + '</span>' +
      '</button>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function _alSelectSlot(slot) {
  _alSelectedSlot = slot;
  _alRenderTimeSlots();
}

function _alRenderDurationChips() {
  var container = document.getElementById('alDurRow');
  if (!container) return;
  var html = '<div class="al-dur-label">' + zi('clock') + ' Duration</div><div class="al-dur-chips">';
  AL_DURATION_CHIPS.forEach(function(d) {
    var cls = (_alSelectedDuration === d && !_alOtherDurVisible) ? ' active' : '';
    html += '<button class="al-dur-chip' + cls + '" data-action="alSelectDuration" data-arg="' + d + '">' + d + ' min</button>';
  });
  // Other chip
  var otherCls = _alOtherDurVisible ? ' active' : '';
  html += '<button class="al-dur-chip al-dur-chip-other' + otherCls + '" data-action="alToggleOtherDur">Other</button>';
  // Skip chip
  var skipCls = (_alSelectedDuration === null && !_alOtherDurVisible) ? ' active' : '';
  html += '<button class="al-dur-chip al-dur-chip-skip' + skipCls + '" data-action="alSelectDuration" data-arg="skip">Skip</button>';
  html += '</div>';
  // Other inline input
  if (_alOtherDurVisible) {
    var curVal = (typeof _alSelectedDuration === 'number' && AL_DURATION_CHIPS.indexOf(_alSelectedDuration) === -1) ? _alSelectedDuration : '';
    html += '<div class="al-dur-custom-row"><input type="number" id="alDurCustom" class="al-dur-custom" inputmode="numeric" min="1" max="180" placeholder="Minutes" value="' + curVal + '"><button class="al-dur-custom-go" data-action="alSetCustomDur">' + zi('check') + '</button></div>';
  }
  container.innerHTML = html;
}

function _alSelectDuration(val) {
  if (val === 'skip') {
    _alSelectedDuration = null;
    _alOtherDurVisible = false;
  } else {
    _alSelectedDuration = parseInt(val);
    _alOtherDurVisible = false;
  }
  _alRenderDurationChips();
}

function _alToggleOtherDur() {
  _alOtherDurVisible = !_alOtherDurVisible;
  if (!_alOtherDurVisible) {
    // Toggled off — revert to skip if no preset selected
    if (typeof _alSelectedDuration === 'number' && AL_DURATION_CHIPS.indexOf(_alSelectedDuration) === -1) {
      _alSelectedDuration = null;
    }
  }
  _alRenderDurationChips();
  if (_alOtherDurVisible) {
    var inp = document.getElementById('alDurCustom');
    if (inp) inp.focus();
  }
}

function _alSetCustomDur() {
  var inp = document.getElementById('alDurCustom');
  if (!inp) return;
  var val = parseInt(inp.value);
  if (isNaN(val) || val <= 0) {
    _alSelectedDuration = null;
  } else {
    _alSelectedDuration = val;
  }
  // Keep other visible so user can adjust
}

function _alInjectSlotDurContainers() {
  // Inject slot + duration containers, hide old time picker + duration input
  if (_alSlotsInjected) return;
  var timeEl = document.getElementById('alTime');
  var durEl = document.getElementById('alDuration');
  if (!timeEl || !durEl) return;

  // Hide old time picker row — walk up to find the wrapper
  var timeRow = timeEl.closest('.ql-field') || timeEl.parentElement;
  if (timeRow) timeRow.style.display = 'none';

  // Hide old duration row
  var durRow = durEl.closest('.ql-field') || durEl.parentElement;
  if (durRow) durRow.style.display = 'none';

  // Hide old skip button if it exists
  var skipBtn = document.querySelector('#qlModal-activity .al-skip-btn, #qlModal-activity [data-action="alSkipDuration"]');
  if (skipBtn) {
    var skipRow = skipBtn.closest('.ql-field') || skipBtn.parentElement;
    if (skipRow && skipRow !== durRow) skipRow.style.display = 'none';
  }

  // Insert duration chips container before the hidden dur row
  var durContainer = document.createElement('div');
  durContainer.id = 'alDurRow';
  durContainer.className = 'al-dur-row';
  durRow.parentElement.insertBefore(durContainer, durRow);

  // Insert slot row container before the hidden time row
  var slotContainer = document.createElement('div');
  slotContainer.id = 'alSlotRow';
  slotContainer.className = 'al-slot-row';
  timeRow.parentElement.insertBefore(slotContainer, timeRow);

  _alSlotsInjected = true;
}

const AL_DOMAIN_META = {
  motor:     { icon: zi('run'), label: 'Motor' },
  language:  { icon: zi('chat'), label: 'Language' },
  social:    { icon: zi('handshake'), label: 'Social' },
  cognitive: { icon: zi('brain'), label: 'Cognitive' },
  sensory:   { icon: zi('sparkle'), label: 'Sensory' }
};

function onActivityInputChange() {
  clearTimeout(_alInputTimer);
  _alInputTimer = setTimeout(() => {
    const text = (document.getElementById('alTextInput').value || '').trim();
    const chipsEl = document.getElementById('alDetectChips');
    if (!text) {
      _alDetectedEvidence = [];
      chipsEl.innerHTML = '<div class="al-detect-empty">Type above to auto-detect milestones</div>';
      return;
    }
    const result = classifyActivity(text);
    _alDetectedEvidence = result.evidence;
    renderActivityChips();
  }, 300);
}

function renderActivityChips() {
  const chipsEl = document.getElementById('alDetectChips');
  if (_alDetectedEvidence.length === 0) {
    chipsEl.innerHTML = '<div class="al-detect-empty">No milestones detected — add context for better matching</div>';
    return;
  }
  // Group by domain
  const byDomain = {};
  _alDetectedEvidence.forEach(ev => {
    if (!byDomain[ev.domain]) byDomain[ev.domain] = [];
    byDomain[ev.domain].push(ev);
  });
  let html = '';
  Object.entries(byDomain).forEach(([domain, evs]) => {
    const meta = AL_DOMAIN_META[domain] || { icon: '?', label: domain };
    const milestoneLabels = evs.map(e => e.milestone.replace(/_/g, ' ')).join(', ');
    const confDot = evs.some(e => e.confidence === 'high') ? '●' : evs.some(e => e.confidence === 'medium') ? '●' : '●';
    html += `<div class="al-chip al-chip-${domain}" data-domain="${domain}">
      ${confDot} ${meta.icon} ${meta.label}: ${milestoneLabels}
      <button class="al-chip-x" data-action="removeActivityChip" data-arg="${domain}" aria-label="Remove">&times;</button>
    </div>`;
  });
  chipsEl.innerHTML = html;
}

function removeActivityChip(domain) {
  _alDetectedEvidence = _alDetectedEvidence.filter(ev => ev.domain !== domain);
  renderActivityChips();
}

function alPreset(text) {
  const input = document.getElementById('alTextInput');
  const existing = input.value.trim();
  input.value = existing ? existing + ', ' + text : text;
  onActivityInputChange();
}

function openActivityLogPrefilled(text, duration, source) {
  _alPrefillText = text || '';
  _alPrefillDuration = duration || null;
  _alPrefillSource = source || 'plan';
  openQuickModal('activity');
}

function saveActivity() {
  const text = (document.getElementById('alTextInput').value || '').trim();
  if (!text) return;

  // Duration from chip state (handles custom "Other" input too)
  var duration = _alSelectedDuration;
  if (_alOtherDurVisible) {
    var customInp = document.getElementById('alDurCustom');
    if (customInp && customInp.value) {
      var cv = parseInt(customInp.value);
      duration = (isNaN(cv) || cv <= 0) ? null : cv;
    }
  }

  // Timestamp from slot selection
  const ts = _alSlotToTimestamp(_alSelectedSlot || _alCurrentSlot());

  // Create entry with detected evidence (user may have removed some chips)
  const entry = {
    id: 'act_' + Date.now(),
    text: text,
    type: duration ? 'activity' : 'observation',
    duration: duration,
    ts: ts,
    source: _alPrefillSource || 'manual',
    domains: [...new Set(_alDetectedEvidence.map(e => e.domain))],
    evidence: _alDetectedEvidence.map(e => ({
      milestone: e.milestone,
      confidence: e.confidence,
      context: e.context
    }))
  };

  const dateStr = _qlBackfillDate || today();
  if (!activityLog[dateStr]) activityLog[dateStr] = [];
  activityLog[dateStr].push(entry);
  save(KEYS.activityLog, activityLog);
  _tsfMarkDirty();

  _islMarkDirty('activities');
  _islMarkDirty('milestones');
  // Set undo state
  _lastActivityUndo = { dateStr, entryId: entry.id };

  // Sync milestones
  syncMilestoneStatuses();

  // Close and show toast
  _qlLogAction('activity', _qlSuggestUsed);
  closeQuickLogAll();
  _alPrefillSource = 'manual';

  // Show toast with undo
  const domainStr = entry.domains.length > 0 ? ' · ' + entry.domains.map(d => (AL_DOMAIN_META[d]?.icon || '') + ' ' + (AL_DOMAIN_META[d]?.label || d)).join(', ') : '';
  const bfStr = (_qlBackfillDate && _qlBackfillDate !== today()) ? ' for ' + formatDate(_qlBackfillDate) : '';
  const toast = document.getElementById('qlToast');
  toast.innerHTML = zi('check') + ' Activity logged' + bfStr + domainStr + ' <button class="al-undo-btn" data-action="undoLastActivity">Undo</button>';
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); _lastActivityUndo = null; }, 5000);

  // Re-render relevant sections (renderMilestones calls renderCategoryWheels + renderRecentEvidence internally)
  renderMilestones();
  renderTodayPlan();
  renderHomeActivity();
  // Session B: check for milestone auto-upgrade prompt
  _alCheckAutoUpgrade(entry);
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOG: Session B — Intelligence Layer (Steps 4–9)
// Milestone suggestions, yesterday repeat, domain nudge, auto-upgrade
// ═══════════════════════════════════════════════════════════════

let _alUpgradePrompted = {};
let _alSuggestInjected = false;
var _alUpgradeTimerId = null;

// escHtml doesn't escape " — this helper does, for safe JSON in data-arg attributes
function _alAttrSafe(s) {
  return escHtml(s).replace(/"/g, '&quot;');
}

// ── Step 4: Active milestone → suggestion matching ──

function _alGetSuggestionMilestones() {
  var active = (milestones || []).filter(function(m) {
    return ['emerging','practicing','consistent'].indexOf(m.status) !== -1;
  });
  var matched = [];
  for (var i = 0; i < active.length; i++) {
    var m = active[i];
    var keys = Object.keys(MILESTONE_ACTIVITIES);
    for (var j = 0; j < keys.length; j++) {
      if (typeof matchesMilestoneKeyword === 'function' && matchesMilestoneKeyword(m.text, keys[j])) {
        matched.push({ milestone: m, keyword: keys[j], activities: MILESTONE_ACTIVITIES[keys[j]] });
        break;
      }
    }
  }
  var stagePri = { practicing: 0, emerging: 1, consistent: 2 };
  matched.sort(function(a, b) {
    var sa = stagePri[a.milestone.status] !== undefined ? stagePri[a.milestone.status] : 3;
    var sb = stagePri[b.milestone.status] !== undefined ? stagePri[b.milestone.status] : 3;
    if (sa !== sb) return sa - sb;
    var ea = typeof getMilestoneEvidence === 'function' ? getMilestoneEvidence(a.keyword).length : 0;
    var eb = typeof getMilestoneEvidence === 'function' ? getMilestoneEvidence(b.keyword).length : 0;
    return eb - ea;
  });
  return matched.slice(0, 3);
}

// ── Step 5: Dedup + render suggestions ──

function _alWordOverlap(textA, textB) {
  // BN-5: filter words < 3 chars
  var wordsA = textA.toLowerCase().split(/\s+/).filter(function(w) { return w.length >= 3; });
  var wordsB = textB.toLowerCase().split(/\s+/).filter(function(w) { return w.length >= 3; });
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  var setA = {};
  wordsA.forEach(function(w) { setA[w] = true; });
  var setB = {};
  wordsB.forEach(function(w) { setB[w] = true; });
  var intersection = 0;
  Object.keys(setA).forEach(function(w) { if (setB[w]) intersection++; });
  var union = {};
  wordsA.concat(wordsB).forEach(function(w) { union[w] = true; });
  var unionSize = Object.keys(union).length;
  return unionSize > 0 ? intersection / unionSize : 0;
}

function _alDeduplicateSuggestions(groups) {
  var seen = [];
  return groups.map(function(g) {
    var filtered = g.activities.filter(function(act) {
      for (var i = 0; i < seen.length; i++) {
        if (_alWordOverlap(act.text, seen[i].text) > 0.7) return false;
      }
      return true;
    });
    filtered.forEach(function(a) { seen.push(a); });
    return { milestone: g.milestone, keyword: g.keyword, activities: filtered };
  }).filter(function(g) { return g.activities.length > 0; });
}

function _alRenderSuggestions() {
  var container = document.getElementById('alSuggestSection');
  if (!container) return;
  if (_alPrefillSource === 'plan') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  var groups = _alGetSuggestionMilestones();
  if (groups.length === 0) {
    // Fallback: static presets
    var presets = ['Tummy time', 'Reading', 'Water play', 'Music', 'Sensory play', 'Peek-a-boo'];
    var html = '<div class="al-suggest-group"><div class="al-suggest-group-label">' +
      zi('sparkle') + ' Quick picks</div><div class="al-suggest-cards">';
    presets.forEach(function(p) {
      html += '<button class="al-suggest-card al-suggest-card-fallback" data-action="alPresetTap" data-arg="' + escHtml(p) + '">' +
        '<span class="al-suggest-text">' + escHtml(p) + '</span></button>';
    });
    html += '</div></div>';
    container.innerHTML = html;
    return;
  }

  var deduped = _alDeduplicateSuggestions(groups.map(function(g) {
    return { milestone: g.milestone, keyword: g.keyword, activities: g.activities.slice(0, 2) };
  }));

  var html = '';
  deduped.forEach(function(g) {
    var statusLabel = g.milestone.status.charAt(0).toUpperCase() + g.milestone.status.slice(1);
    var pat = EVIDENCE_PATTERNS.find(function(p) { return p.milestone === g.keyword; });
    var domain = pat ? pat.domain : 'motor';
    html += '<div class="al-suggest-group" data-domain="' + domain + '">';
    html += '<div class="al-suggest-group-label">' + zi('target') + ' For: ' +
      escHtml(g.milestone.text) + ' <span class="al-suggest-stage">(' + escHtml(statusLabel) + ')</span></div>';
    html += '<div class="al-suggest-cards">';
    g.activities.forEach(function(act) {
      var payload = JSON.stringify({ keyword: g.keyword, text: act.text, duration: act.duration, tip: act.tip || '', icon: act.icon || 'run' });
      html += '<button class="al-suggest-card" data-action="alTapSuggestion" data-arg="' + _alAttrSafe(payload) + '">' +
        '<span class="al-suggest-icon">' + zi(act.icon || 'run') + '</span>' +
        '<span class="al-suggest-text">' + escHtml(act.text) + '</span>' +
        '<span class="al-suggest-dur">' + act.duration + ' min</span>' +
        '</button>';
    });
    html += '</div></div>';
  });
  container.innerHTML = html;
}

// ── Step 6: Suggestion tap handler ──

function _alTapSuggestion(argStr) {
  var data;
  try { data = JSON.parse(argStr); } catch(e) { return; }
  var textarea = document.getElementById('alTextInput');
  if (!textarea) return;
  textarea.value = data.text;
  _alLastSuggestionText = data.text;

  // Set duration chip
  if (data.duration) {
    _alOtherDurVisible = false;
    _alSelectedDuration = data.duration;
    if (AL_DURATION_CHIPS.indexOf(data.duration) === -1) {
      _alOtherDurVisible = true;
    }
    _alRenderDurationChips();
  }

  // Set evidence directly — bypass classifier (per spec)
  var pat = EVIDENCE_PATTERNS.find(function(p) { return p.milestone === data.keyword; });
  _alDetectedEvidence = [{
    milestone: data.keyword,
    confidence: 'high',
    context: 'suggestion_tap',
    domain: pat ? pat.domain : 'motor'
  }];
  renderActivityChips();

  // Show tip line
  var tipEl = document.getElementById('alSuggestTip');
  if (tipEl && data.tip) {
    tipEl.innerHTML = zi('bulb') + ' ' + escHtml(data.tip);
    tipEl.style.display = '';
  } else if (tipEl) {
    tipEl.innerHTML = '';
    tipEl.style.display = 'none';
  }
}

function _alPresetTap(text) {
  // Fallback preset tap — same as existing alPreset but clears first
  var textarea = document.getElementById('alTextInput');
  if (!textarea) return;
  textarea.value = text;
  onActivityInputChange();
}

// Tip line clearing on textarea input
function _alCheckTipClear() {
  if (!_alLastSuggestionText) return;
  var textarea = document.getElementById('alTextInput');
  if (!textarea) return;
  if (textarea.value !== _alLastSuggestionText) {
    _alLastSuggestionText = null;
    var tipEl = document.getElementById('alSuggestTip');
    if (tipEl) { tipEl.innerHTML = ''; tipEl.style.display = 'none'; }
    // Classifier re-engages via existing oninput → onActivityInputChange
  }
}

// ── Step 7: Yesterday Activities ──

function _alGetYesterdayActivities() {
  var todayStr = today();
  var d = new Date(); d.setDate(d.getDate() - 1);
  var yesterday = toDateStr(d);
  var entries = activityLog[yesterday] || [];
  if (entries.length === 0) return [];

  // Suppress if today already has 3+ activities
  var todayEntries = activityLog[todayStr] || [];
  if (todayEntries.length >= 3) return [];

  // Diversify by domain — one per domain first, then fill
  var byDomain = {};
  entries.forEach(function(e) {
    var dom = (e.domains && e.domains.length > 0) ? e.domains[0] : '_none';
    if (!byDomain[dom]) byDomain[dom] = [];
    byDomain[dom].push(e);
  });
  var result = [];
  var usedIds = {};
  Object.keys(byDomain).forEach(function(dom) {
    if (result.length < 3) {
      result.push(byDomain[dom][0]);
      usedIds[byDomain[dom][0].id] = true;
    }
  });
  for (var i = 0; i < entries.length && result.length < 3; i++) {
    if (!usedIds[entries[i].id]) result.push(entries[i]);
  }
  return result.slice(0, 3);
}

function _alRenderYesterday() {
  var container = document.getElementById('alYesterdaySection');
  if (!container) return;
  if (_alPrefillSource === 'plan') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  var items = _alGetYesterdayActivities();
  if (items.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  var html = '<div class="al-yesterday-label">' + zi('clock') + ' Yesterday</div>';
  html += '<div class="al-yesterday-items">';
  items.forEach(function(item) {
    var dom = (item.domains && item.domains[0]) ? item.domains[0] : '';
    var meta = AL_DOMAIN_META[dom] || { icon: zi('run'), label: '' };
    var durStr = item.duration ? ' · ' + item.duration + 'm' : '';
    var payload = JSON.stringify({ text: item.text, duration: item.duration || null });
    html += '<button class="al-yesterday-item" data-domain="' + (dom || 'motor') + '" data-action="alTapYesterday" data-arg="' + _alAttrSafe(payload) + '">' +
      '<span class="al-yesterday-icon">' + meta.icon + '</span>' +
      '<span class="al-yesterday-text">' + escHtml(item.text) + durStr + '</span></button>';
  });
  html += '</div>';
  html += '<button class="al-yesterday-repeat" data-action="alRepeatAll">' + zi('hourglass') + ' Repeat all</button>';
  container.innerHTML = html;
}

function _alTapYesterday(argStr) {
  var data;
  try { data = JSON.parse(argStr); } catch(e) { return; }
  var textarea = document.getElementById('alTextInput');
  if (!textarea) return;
  textarea.value = data.text || '';
  if (data.duration) {
    _alOtherDurVisible = false;
    _alSelectedDuration = data.duration;
    if (AL_DURATION_CHIPS.indexOf(data.duration) === -1) _alOtherDurVisible = true;
    _alRenderDurationChips();
  }
  onActivityInputChange();
}

function _alRepeatAll() {
  var items = _alGetYesterdayActivities();
  if (items.length === 0) return;
  var dateStr = _qlBackfillDate || today();
  var entryIds = [];
  var baseNow = Date.now();

  items.forEach(function(item, i) {
    // BN-1: +1s offset per entry to avoid duplicate TSF event IDs
    var ts = new Date(baseNow + i * 1000).toISOString();
    var entry = {
      id: 'act_' + (baseNow + i),
      text: item.text,
      type: item.duration ? 'activity' : 'observation',
      duration: item.duration || null,
      ts: ts,
      source: 'repeat_yesterday',
      domains: item.domains || [],
      evidence: item.evidence || []
    };
    if (!activityLog[dateStr]) activityLog[dateStr] = [];
    activityLog[dateStr].push(entry);
    entryIds.push(entry.id);
  });

  save(KEYS.activityLog, activityLog);
  _tsfMarkDirty();
  _islMarkDirty('activities');
  _islMarkDirty('milestones');
  syncMilestoneStatuses();

  _lastActivityUndo = { dateStr: dateStr, entryIds: entryIds };
  closeQuickLogAll();

  var toast = document.getElementById('qlToast');
  toast.innerHTML = zi('check') + ' ' + items.length + ' activities logged · <button class="al-undo-btn" data-action="undoLastActivity">Undo</button>';
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); _lastActivityUndo = null; }, 5000);

  renderMilestones();
  renderTodayPlan();
  renderHomeActivity();
}

// Override undoLastActivity to handle both single (entryId) and batch (entryIds)
function undoLastActivity() {
  if (!_lastActivityUndo) return;
  var dateStr = _lastActivityUndo.dateStr;
  var entryId = _lastActivityUndo.entryId;
  var entryIds = _lastActivityUndo.entryIds;
  if (!activityLog[dateStr]) { _lastActivityUndo = null; return; }

  if (entryIds && entryIds.length > 0) {
    var idSet = {};
    entryIds.forEach(function(id) { idSet[id] = true; });
    activityLog[dateStr] = activityLog[dateStr].filter(function(e) { return !idSet[e.id]; });
  } else if (entryId) {
    activityLog[dateStr] = activityLog[dateStr].filter(function(e) { return e.id !== entryId; });
  }

  if (activityLog[dateStr].length === 0) delete activityLog[dateStr];
  save(KEYS.activityLog, activityLog);
  _tsfMarkDirty();
  _islMarkDirty('activities');
  _islMarkDirty('milestones');
  _lastActivityUndo = null;

  var toast = document.getElementById('qlToast');
  if (toast) {
    toast.innerHTML = zi('check') + ' Undone';
    setTimeout(function() { toast.classList.remove('show'); }, 2000);
  }
  syncMilestoneStatuses();
  renderMilestones();
  renderTodayPlan();
  renderHomeActivity();
}

// ── Step 8: Domain Balance Nudge ──

function _alGetDomainNudge() {
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
  var cutoffStr = toDateStr(cutoff);
  var domainCounts = {};

  Object.keys(activityLog).forEach(function(dateStr) {
    if (dateStr < cutoffStr) return;
    (activityLog[dateStr] || []).forEach(function(entry) {
      if (!entry.evidence) return;
      entry.evidence.forEach(function(ev) {
        // BN-6: Map domain via EVIDENCE_PATTERNS, not KEYWORD_TO_MILESTONE
        var pat = EVIDENCE_PATTERNS.find(function(p) { return p.milestone === ev.milestone; });
        var domain = pat ? pat.domain : (ev.domain || null);
        if (domain) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
    });
  });

  var totalEntries = 0;
  Object.keys(domainCounts).forEach(function(k) { totalEntries += domainCounts[k]; });
  if (totalEntries < 3) return null;

  // Suppress if suggestion groups already cover 3+ distinct domains
  var groups = _alGetSuggestionMilestones();
  var suggestDomains = {};
  groups.forEach(function(g) {
    var pat = EVIDENCE_PATTERNS.find(function(p) { return p.milestone === g.keyword; });
    if (pat) suggestDomains[pat.domain] = true;
  });
  if (Object.keys(suggestDomains).length >= 3) return null;

  var standardDomains = ['motor', 'language', 'social', 'cognitive', 'sensory'];
  var domainCount = 0;
  standardDomains.forEach(function(d) { if (domainCounts[d]) domainCount++; });
  var avg = totalEntries / Math.max(domainCount, 1);

  var lowest = null;
  var lowestCount = Infinity;
  standardDomains.forEach(function(d) {
    var count = domainCounts[d] || 0;
    // Only nudge if domain has at least one active milestone
    var hasActive = (milestones || []).some(function(m) {
      if (['emerging','practicing','consistent'].indexOf(m.status) === -1) return false;
      return EVIDENCE_PATTERNS.some(function(p) {
        return p.domain === d && typeof matchesMilestoneKeyword === 'function' && matchesMilestoneKeyword(m.text, p.milestone);
      });
    });
    if (!hasActive) return;
    if (count < lowestCount) { lowestCount = count; lowest = d; }
  });

  if (!lowest) return null;
  if (lowestCount >= avg * 0.5) return null;

  // Suppress if today already has activity in this domain
  var todayEntries = activityLog[today()] || [];
  var hasDomain = todayEntries.some(function(e) { return e.domains && e.domains.indexOf(lowest) !== -1; });
  if (hasDomain) return null;

  // Get 2 suggestions for nudge domain via EVIDENCE_PATTERNS → MILESTONE_ACTIVITIES (BN-6)
  var suggestions = [];
  Object.keys(MILESTONE_ACTIVITIES).forEach(function(key) {
    var pat = EVIDENCE_PATTERNS.find(function(p) { return p.milestone === key; });
    if (pat && pat.domain === lowest) {
      MILESTONE_ACTIVITIES[key].forEach(function(a) {
        if (suggestions.length < 2) suggestions.push({ text: a.text, duration: a.duration, tip: a.tip || '', icon: a.icon || 'run', keyword: key });
      });
    }
  });

  return { domain: lowest, count: lowestCount, avgCount: avg, suggestions: suggestions };
}

function _alRenderDomainNudge() {
  var container = document.getElementById('alDomainNudge');
  if (!container) return;
  if (_alPrefillSource === 'plan') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  var nudge = _alGetDomainNudge();
  if (!nudge) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = '';
  var meta = AL_DOMAIN_META[nudge.domain] || { icon: zi('sparkle'), label: nudge.domain };
  var html = '<div class="al-domain-nudge" data-domain="' + nudge.domain + '">';
  html += '<div class="al-domain-nudge-text">' + meta.icon + ' ' + escHtml(meta.label) + ' could use attention this week</div>';
  if (nudge.suggestions.length > 0) {
    html += '<div class="al-domain-nudge-links">Try: ';
    nudge.suggestions.forEach(function(s, i) {
      if (i > 0) html += ' · ';
      var payload = JSON.stringify({ keyword: s.keyword, text: s.text, duration: s.duration, tip: s.tip, icon: s.icon });
      html += '<button class="al-nudge-link" data-action="alTapSuggestion" data-arg="' + _alAttrSafe(payload) + '">' + escHtml(s.text) + '</button>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

// ── Step 9: Confidence Auto-Upgrade Prompt ──

function _alCheckAutoUpgrade(entry) {
  if (!entry || !entry.evidence || entry.evidence.length === 0) return;
  if (typeof computeAutoStatus !== 'function') return;

  var stagePri = { not_started: 0, emerging: 1, practicing: 2, consistent: 3, mastered: 4 };
  var bestCandidate = null;
  var bestEvCount = 0;

  entry.evidence.forEach(function(ev) {
    var keyword = ev.milestone;
    var m = (milestones || []).find(function(mi) {
      return typeof matchesMilestoneKeyword === 'function' && matchesMilestoneKeyword(mi.text, keyword);
    });
    if (!m) return;
    if (m.manualOverride) return;

    var currentStage = stagePri[m.status] || 0;
    var autoStatus = computeAutoStatus(keyword);
    var autoStage = stagePri[autoStatus] || 0;
    if (autoStage <= currentStage) return;

    var evCount = typeof getMilestoneEvidence === 'function' ? getMilestoneEvidence(keyword).length : 0;
    if (_alUpgradePrompted[keyword] !== undefined && evCount < _alUpgradePrompted[keyword] + 2) return;

    if (evCount > bestEvCount) {
      bestEvCount = evCount;
      bestCandidate = { keyword: keyword, milestone: m, currentStatus: m.status, newStatus: autoStatus, evidenceCount: evCount };
    }
  });

  if (!bestCandidate) return;
  // Small delay so undo toast settles visually
  var cand = bestCandidate;
  setTimeout(function() { _alShowUpgradeToast(cand); }, 600);
}

function _alShowUpgradeToast(candidate) {
  var toast = document.getElementById('alUpgradeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'alUpgradeToast';
    toast.className = 'al-upgrade-toast';
    document.body.appendChild(toast);
  }
  var newLabel = candidate.newStatus.charAt(0).toUpperCase() + candidate.newStatus.slice(1);
  var curLabel = candidate.currentStatus.charAt(0).toUpperCase() + candidate.currentStatus.slice(1);

  toast.innerHTML = '<div class="al-upgrade-text">' + zi('target') + ' "' + escHtml(candidate.milestone.text) +
    '" has ' + candidate.evidenceCount + ' observations</div>' +
    '<div class="al-upgrade-sub">Move from ' + escHtml(curLabel) + ' → ' + escHtml(newLabel) + '?</div>' +
    '<div class="al-upgrade-actions">' +
      '<button class="al-upgrade-yes" data-action="alUpgradeYes" data-arg="' + escHtml(candidate.keyword) + ',' + escHtml(candidate.newStatus) + '">Yes, upgrade</button>' +
      '<button class="al-upgrade-dismiss" data-action="alUpgradeDismiss" data-arg="' + escHtml(candidate.keyword) + ',' + candidate.evidenceCount + '">Not yet</button>' +
    '</div>';
  toast.classList.add('show');
  if (_alUpgradeTimerId) clearTimeout(_alUpgradeTimerId);
  _alUpgradeTimerId = setTimeout(function() { toast.classList.remove('show'); _alUpgradeTimerId = null; }, 8000);
}

function _alUpgradeYes(argStr) {
  if (_alUpgradeTimerId) { clearTimeout(_alUpgradeTimerId); _alUpgradeTimerId = null; }
  var parts = argStr.split(',');
  var keyword = parts[0];
  var newStatus = parts[1];
  if (typeof overrideMilestoneStatus === 'function') {
    overrideMilestoneStatus(keyword, newStatus);
  }
  if (typeof syncMilestoneStatuses === 'function') syncMilestoneStatuses();
  if (typeof renderMilestones === 'function') renderMilestones();

  var toast = document.getElementById('alUpgradeToast');
  if (toast) {
    toast.innerHTML = '<div class="al-upgrade-text">' + zi('check') + ' ' +
      escHtml(keyword.replace(/_/g, ' ')) + ' → ' + escHtml(newStatus) + '</div>';
    setTimeout(function() { toast.classList.remove('show'); }, 2500);
  }
}

function _alUpgradeDismiss(argStr) {
  if (_alUpgradeTimerId) { clearTimeout(_alUpgradeTimerId); _alUpgradeTimerId = null; }
  var parts = argStr.split(',');
  var keyword = parts[0];
  var evCount = parseInt(parts[1]);
  _alUpgradePrompted[keyword] = evCount;
  var toast = document.getElementById('alUpgradeToast');
  if (toast) toast.classList.remove('show');
}

// ── DOM injection + master render ──

function _alInjectSuggestContainers() {
  if (_alSuggestInjected) return;
  var modal = document.getElementById('qlModal-activity');
  if (!modal) return;
  var textarea = document.getElementById('alTextInput');
  if (!textarea) return;
  var textareaRow = textarea.closest('.ql-field') || textarea.parentElement;
  if (!textareaRow) return;

  // Hide existing preset buttons
  modal.querySelectorAll('.ql-presets, .al-presets').forEach(function(el) { el.style.display = 'none'; });
  // Also hide any individual preset buttons that might not be in a wrapper
  modal.querySelectorAll('[data-action="alPreset"]').forEach(function(el) {
    var row = el.closest('.ql-field, .ql-presets, .al-presets') || el.parentElement;
    if (row) row.style.display = 'none';
  });

  // Inject Session B containers BEFORE textarea row
  var wrapper = document.createElement('div');
  wrapper.id = 'alSessionBContainer';
  wrapper.innerHTML =
    '<div id="alYesterdaySection" class="al-yesterday-section"></div>' +
    '<div id="alSuggestSection" class="al-suggest-section"></div>' +
    '<div id="alDomainNudge" class="al-domain-nudge-section"></div>' +
    '<div id="alSeparator" class="al-separator">' + zi('note') + ' or type your own</div>';
  textareaRow.parentElement.insertBefore(wrapper, textareaRow);

  // Inject tip line AFTER textarea row
  var tipLine = document.createElement('div');
  tipLine.id = 'alSuggestTip';
  tipLine.className = 'al-suggest-tip';
  tipLine.style.display = 'none';
  textareaRow.parentElement.insertBefore(tipLine, textareaRow.nextSibling);

  // Wire tip-clearing listener (supplements existing oninput for classifier)
  textarea.addEventListener('input', _alCheckTipClear);

  _alSuggestInjected = true;
}

function _alRenderSessionB() {
  _alInjectSuggestContainers();
  _alRenderYesterday();
  _alRenderSuggestions();
  _alRenderDomainNudge();
  // Clear tip line on fresh open
  var tipEl = document.getElementById('alSuggestTip');
  if (tipEl) { tipEl.innerHTML = ''; tipEl.style.display = 'none'; }
  // Show/hide separator based on whether suggestions are visible
  var sep = document.getElementById('alSeparator');
  var suggestEl = document.getElementById('alSuggestSection');
  var yesterdayEl = document.getElementById('alYesterdaySection');
  var hasSuggestions = suggestEl && suggestEl.style.display !== 'none' && suggestEl.innerHTML !== '';
  var hasYesterday = yesterdayEl && yesterdayEl.style.display !== 'none' && yesterdayEl.innerHTML !== '';
  if (sep) sep.style.display = (hasSuggestions || hasYesterday) ? '' : 'none';
}

// ═══════════════════════════════════════════════════════════════

// SMART QUICK LOG — Adaptive Meal Windows
// ═══════════════════════════════════════════════════════════════

var _qlMealWindowCache = null;

function _qlComputeMealWindow() {
  if (_qlMealWindowCache) return _qlMealWindowCache;
  var defaults = {
    breakfast: { start: 420, end: 690 },
    lunch:     { start: 690, end: 1020 },
    dinner:    { start: 1020, end: 1380 }
  };
  var result = { breakfast: null, lunch: null, dinner: null };
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
  var cutoffStr = toDateStr(cutoff);
  var mealTimes = { breakfast: [], lunch: [], dinner: [] };

  Object.keys(feedingData).forEach(function(dateStr) {
    if (dateStr < cutoffStr) return;
    var day = feedingData[dateStr];
    ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
      if (!day[meal] || !day[meal].trim()) return;
      var tKey = meal + '_time';
      if (day[tKey]) {
        var parts = day[tKey].split(':');
        var mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (!isNaN(mins)) mealTimes[meal].push(mins);
      }
    });
  });

  ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
    var times = mealTimes[meal].slice().sort(function(a, b) { return a - b; });
    var n = times.length;
    if (n >= 7) {
      var q1 = times[Math.floor(n * 0.25)];
      var q3 = times[Math.floor(n * 0.75)];
      result[meal] = { start: Math.max(0, q1 - 60), end: Math.min(1440, q3 + 60) };
    } else if (n >= 3) {
      result[meal] = { start: Math.max(0, times[0] - 60), end: Math.min(1440, times[n - 1] + 60) };
    } else {
      result[meal] = defaults[meal];
    }
  });

  _qlMealWindowCache = result;
  return result;
}

function detectMealType() {
  var windows = _qlComputeMealWindow();
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin >= windows.breakfast.start && nowMin < windows.breakfast.end) return 'breakfast';
  if (nowMin >= windows.lunch.start && nowMin < windows.lunch.end) return 'lunch';
  if (nowMin >= windows.dinner.start && nowMin < windows.dinner.end) return 'dinner';
  return 'snack';
}

// ═══════════════════════════════════════════════════════════════
// SMART QUICK LOG — Prediction Engine
// ═══════════════════════════════════════════════════════════════

var _qlActivePredictions = [];
var _qlSuggestUsed = false;

function _qlPredictFood(meal) {
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  var cutoffStr = toDateStr(cutoff);
  var todayStr = today();
  var counts = {};
  var dayCount = 0;

  Object.keys(feedingData).forEach(function(dateStr) {
    if (dateStr < cutoffStr || dateStr > todayStr) return;
    var day = feedingData[dateStr];
    if (!day[meal] || !day[meal].trim()) return;
    dayCount++;
    day[meal].split(',').forEach(function(item) {
      var name = item.trim();
      if (name.length < 2) return;
      var base = _baseFoodName(name);
      if (!counts[base]) counts[base] = { name: name, freq: 0 };
      counts[base].freq++;
    });
  });

  if (dayCount < 3) return null;

  // Exclude foods already served today for this meal
  var todayDay = feedingData[todayStr];
  var todayFoods = new Set();
  if (todayDay && todayDay[meal]) {
    todayDay[meal].split(',').forEach(function(item) {
      todayFoods.add(_baseFoodName(item.trim()));
    });
  }

  var scored = Object.keys(counts).filter(function(base) {
    return !todayFoods.has(base);
  }).map(function(base) {
    var c = counts[base];
    var score = c.freq * 1.0 + (isFoodFavorite(c.name) ? 0.5 : 0);
    return { name: c.name, score: score };
  }).sort(function(a, b) { return b.score - a.score; });

  if (scored.length === 0) return null;
  var top = scored.slice(0, 2).map(function(s) { return s.name; });
  return top.join(' + ');
}

function _qlPredictionKey(prediction) {
  return prediction.type === 'feed' ? 'feed:' + prediction.meal : prediction.type;
}

function _qlPredict() {
  var predictions = [];
  var todayStr = today();
  var now = new Date();
  var nowMin = now.getHours() * 60 + now.getMinutes();
  var ipRaw = localStorage.getItem(SLEEP_INPROGRESS_KEY);

  // 1. SLEEP — bedtime window (19:00-22:00), no night sleep today, no active session
  if (!ipRaw && nowMin >= 1140 && nowMin <= 1320) {
    var hasNightToday = sleepData.some(function(e) { return e.date === todayStr && e.type === 'night'; });
    if (!hasNightToday) {
      predictions.push({ type: 'sleep', action: 'Start', label: 'Bedtime', icon: 'moon', color: 'indigo' });
    }
  }

  // 2. NAP — count-based with 8:30-17:00 time guard
  if (!ipRaw && nowMin >= 510 && nowMin < 1020) {
    var last7 = [];
    for (var d = 1; d <= 7; d++) {
      var dd = new Date(); dd.setDate(dd.getDate() - d);
      var ds = toDateStr(dd);
      var dayNaps = sleepData.filter(function(e) { return e.date === ds && e.type === 'nap'; }).length;
      last7.push(dayNaps);
    }
    var avgNaps = last7.length > 0 ? Math.round(last7.reduce(function(a, b) { return a + b; }, 0) / last7.length) : 2;
    var todayNaps = sleepData.filter(function(e) { return e.date === todayStr && e.type === 'nap'; }).length;
    if (todayNaps < Math.max(avgNaps, 1)) {
      predictions.push({ type: 'nap', action: 'Start', label: 'Nap time', icon: 'zzz', color: 'lav' });
    }
  }

  // 3. FEED — adaptive meal window, only if meal not yet logged
  var mealType = detectMealType();
  if (mealType !== 'snack') {
    var todayDay = feedingData[todayStr];
    var mealLogged = todayDay && todayDay[mealType] && todayDay[mealType].trim();
    if (!mealLogged) {
      var foodPred = _qlPredictFood(mealType);
      var mealColors = { breakfast: 'peach', lunch: 'sage', dinner: 'lav' };
      predictions.push({
        type: 'feed', meal: mealType, foods: foodPred,
        label: capitalize(mealType) + ' time' + (foodPred ? ' \u00b7 ' + foodPred + '?' : ''),
        icon: 'bowl', color: mealColors[mealType] || 'peach'
      });
    }
  }

  // 4. POOP — no poop today, past noon
  if (nowMin >= 720) {
    var todayPoops = poopData.filter(function(e) { return e.date === todayStr; }).length;
    if (todayPoops === 0) {
      predictions.push({ type: 'poop', label: 'Log poop', icon: 'diaper', color: 'amber' });
    }
  }

  // 5. ACTIVITY — no activity today, afternoon
  if (nowMin >= 720) {
    var todayActs = activityLog[todayStr];
    if (!todayActs || todayActs.length === 0) {
      predictions.push({ type: 'activity', label: 'Log activity', icon: 'run', color: 'sage' });
    }
  }

  return predictions;
}

// ═══════════════════════════════════════════════════════════════
// SMART QUICK LOG — Suggest Card Rendering
// ═══════════════════════════════════════════════════════════════

function _qlRenderSuggest(predictions) {
  var wrap = document.getElementById('qlSuggestWrap');
  if (!wrap) return;
  if (!predictions || predictions.length === 0) {
    wrap.classList.add('ql-suggest-hidden');
    wrap.innerHTML = '';
    return;
  }
  wrap.classList.remove('ql-suggest-hidden');

  var chipHtml = '';
  if (predictions.length > 1) {
    chipHtml = '<div class="chip-row-scroll">';
    predictions.forEach(function(p, i) {
      var label = p.type === 'feed' ? capitalize(p.meal || 'Feed') : capitalize(p.type);
      chipHtml += '<span class="chip-base chip-compact chip-' + p.color + (i === 0 ? ' active' : '') + '" data-chip="single" data-action="qlSwitchSuggest" data-arg="' + i + '">' + label + '</span>';
    });
    chipHtml += '</div>';
  }

  var bodyHtml = _qlRenderSuggestBody(predictions[0]);

  wrap.innerHTML = '<div class="ql-suggest card card-compact">' + chipHtml + '<div id="qlSuggestBody">' + bodyHtml + '</div></div>';
}

function _qlRenderSuggestBody(p) {
  var html = '<div class="card-header"><div class="card-icon icon icon-' + p.color + '">' + zi(p.icon) + '</div><div class="card-title">' + escHtml(p.label) + '</div></div>';
  html += '<div class="card-body">';

  if (p.type === 'feed' && p.foods) {
    html += '<div class="ql-suggest-foods">' + escHtml(p.foods) + '</div>';
  }

  html += '<div class="ql-suggest-actions">';
  if (p.type === 'feed') {
    if (p.foods) {
      html += '<button class="btn-primary bp-' + p.color + '" data-action="qlOpenFeedPrefill">Log this</button>';
    }
    html += '<button class="btn-ghost" data-action="qlOpenFeed">Edit first</button>';
  } else if (p.type === 'sleep') {
    html += '<button class="btn-primary bp-' + p.color + '" data-action="qlStartSleep">Start sleep</button>';
  } else if (p.type === 'nap') {
    html += '<button class="btn-primary bp-' + p.color + '" data-action="qlStartNap">Start nap</button>';
  } else if (p.type === 'poop') {
    html += '<button class="btn-primary bp-' + p.color + '" data-action="qlOpenPoop">Log poop</button>';
  } else if (p.type === 'activity') {
    html += '<button class="btn-primary bp-' + p.color + '" data-action="qlOpenActivity">Log activity</button>';
  }
  html += '</div></div>';
  return html;
}

function _qlSwitchSuggest(idx) {
  idx = parseInt(idx);
  if (!_qlActivePredictions || idx < 0 || idx >= _qlActivePredictions.length) return;
  var body = document.getElementById('qlSuggestBody');
  if (body) body.innerHTML = _qlRenderSuggestBody(_qlActivePredictions[idx]);
}

function _qlConfirmSuggest() {
  _qlSuggestUsed = true;
  var pred = _qlActivePredictions.find(function(p) { return p.type === 'feed'; });
  if (!pred) return;
  _qlMeal = pred.meal;
  openQuickModal('feed');
  setTimeout(function() {
    document.querySelectorAll('.ql-meal-pill').forEach(function(p) { p.classList.toggle('active', p.dataset.meal === pred.meal); });
    if (pred.foods) {
      var inp = document.getElementById('qlFeedInput');
      if (inp) inp.value = pred.foods;
    }
  }, 50);
}

function _qlEditSuggest() {
  _qlSuggestUsed = true;
  var pred = _qlActivePredictions.find(function(p) { return p.type === 'feed'; });
  var meal = pred ? pred.meal : detectMealType();
  _qlMeal = meal;
  openQuickModal('feed');
  setTimeout(function() {
    document.querySelectorAll('.ql-meal-pill').forEach(function(p) { p.classList.toggle('active', p.dataset.meal === meal); });
  }, 50);
}

// ═══════════════════════════════════════════════════════════════
// SMART QUICK LOG — Post-Save Micro-Insights
// ═══════════════════════════════════════════════════════════════

function _qlFeedInsight() {
  try {
    var todayStr = today();
    var day = feedingData[todayStr];
    if (!day) return null;
    var mealCount = ['breakfast', 'lunch', 'dinner'].filter(function(m) { return day[m] && day[m].trim(); }).length;
    if (mealCount >= 3) return '3rd meal today \u2014 great variety!';

    var food = document.getElementById('qlFeedInput')?.value?.trim() || '';
    if (food) {
      var base = _baseFoodName(food);
      var isNew = !foods.some(function(f) { return _baseFoodName(f.name) === base; });
      if (isNew) return 'New food! Watch for reactions over 3 days.';

      var yestStr = toDateStr(new Date(new Date().setDate(new Date().getDate() - 1)));
      var yest = feedingData[yestStr];
      if (yest && yest[_qlMeal]) {
        var yestBases = yest[_qlMeal].split(',').map(function(f) { return _baseFoodName(f.trim()); });
        if (yestBases.indexOf(base) >= 0) return 'Same as yesterday \u2014 must be a favorite!';
      }
    }

    if (mealCount === 1) return 'Day started! 2 more meals to go.';
  } catch(e) {}
  return null;
}

function _qlSleepInsight() {
  try {
    var todayStr = today();
    var todayNaps = sleepData.filter(function(e) { return e.date === todayStr && e.type === 'nap'; });
    if (todayNaps.length === 2) return '2 naps today \u2014 solid rest.';

    var lastNap = todayNaps[todayNaps.length - 1];
    if (lastNap && lastNap.bedtime && lastNap.wakeTime) {
      var sP = lastNap.bedtime.split(':'), eP = lastNap.wakeTime.split(':');
      var durMin = (parseInt(eP[0]) * 60 + parseInt(eP[1])) - (parseInt(sP[0]) * 60 + parseInt(sP[1]));
      if (durMin > 120) return 'Long nap! Monitor bedtime \u2014 may shift later.';
    }

    var nightEntries = sleepData.filter(function(e) { return e.date === todayStr && e.type === 'night'; });
    if (nightEntries.length > 0) {
      var ne = nightEntries[nightEntries.length - 1];
      if (ne.bedtime && ne.wakeTime) {
        var bP = ne.bedtime.split(':'), wP = ne.wakeTime.split(':');
        var bedMin = parseInt(bP[0]) * 60 + parseInt(bP[1]);
        var wakeMin = parseInt(wP[0]) * 60 + parseInt(wP[1]);
        var dur = wakeMin > bedMin ? wakeMin - bedMin : (1440 - bedMin) + wakeMin;
        var durH = Math.round(dur / 60 * 10) / 10;
        if (dur >= 600) return 'Great night! ' + durH + 'h of sleep.';
        if (dur < 480) return 'Short night \u2014 might need an early nap.';
      }
    }
  } catch(e) {}
  return null;
}

function _qlPoopInsight() {
  try {
    var todayStr = today();
    var todayPoops = poopData.filter(function(e) { return e.date === todayStr; });
    var count = todayPoops.length;

    if (count >= 3) return count + ' poops today \u2014 above average.';

    if (_qlCon === 'normal' || _qlCon === 'formed') return 'Healthy poop \u2014 digestion looks good.';

    if (_qlColor === 'green') return 'Green is normal \u2014 often from leafy foods.';

    if (count === 1) {
      var weekPoops = poopData.filter(function(e) {
        var d = new Date(e.date);
        var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      }).length;
      var avg = weekPoops > 0 ? Math.round(weekPoops / 7 * 10) / 10 : 0;
      return 'First today \u2014 ' + avg + ' per day this week.';
    }
  } catch(e) {}
  return null;
}

// ═══════════════════════════════════════════════════════════════
// SMART QUICK LOG — Accuracy Tracking
// ═══════════════════════════════════════════════════════════════

function _qlLogAction(actionType, fromSuggest) {
  var history = load(KEYS.qlPredictions, []);
  var entry = {
    ts: new Date().toISOString(),
    predicted: _qlActivePredictions.map(function(p) { return _qlPredictionKey(p); }),
    actual: actionType,
    fromSuggest: !!fromSuggest
  };
  history.push(entry);
  // Prune entries older than 30 days
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  var cutoffStr = cutoff.toISOString();
  history = history.filter(function(e) { return e.ts >= cutoffStr; });
  save(KEYS.qlPredictions, history);
}

function qaAnswerPredictionAccuracy() {
  var history = load(KEYS.qlPredictions, []);
  // Exclude entries with empty predicted array
  var valid = history.filter(function(e) { return e.predicted && e.predicted.length > 0; });
  var total = valid.length;
  if (total < 5) {
    return {
      icon: 'target', domain: 'indigo', title: 'Prediction Accuracy',
      sections: [{ label: 'Not enough data', items: [{ text: 'Need at least 5 saves with active predictions. Current: ' + total, signal: 'info' }] }],
      confidence: 'Need more data to calculate accuracy'
    };
  }
  var top1 = 0, topN = 0;
  valid.forEach(function(e) {
    if (e.predicted[0] === e.actual) top1++;
    if (e.predicted.indexOf(e.actual) >= 0) topN++;
  });
  var fromSuggest = valid.filter(function(e) { return e.fromSuggest; }).length;
  return {
    icon: 'target', domain: 'indigo', title: 'Prediction Accuracy',
    sections: [{
      label: 'Metrics (' + total + ' saves)',
      items: [
        { text: 'Top-1 accuracy: ' + Math.round(top1 / total * 100) + '%', signal: top1 / total >= 0.5 ? 'good' : 'warn' },
        { text: 'Top-N accuracy: ' + Math.round(topN / total * 100) + '%', signal: topN / total >= 0.7 ? 'good' : 'warn' },
        { text: fromSuggest + ' of ' + total + ' saves used the suggestion card', signal: 'info' }
      ]
    }],
    confidence: 'Based on last 30 days of Quick Log saves'
  };
}

function qaAnswerFavoriteFoods() {
  var favs = foods.filter(function(f) { return f.favorite === true; });
  if (favs.length === 0) {
    return {
      icon: 'star', domain: 'amber', title: 'Favorite Foods',
      sections: [{ label: 'None yet', items: [{ text: 'Star foods in the food browser to mark favorites', signal: 'info' }] }],
      confidence: 'No favorites marked yet'
    };
  }
  var items = favs.map(function(f) {
    var freq = getFoodFrequency(f.name);
    var fl = freqLabel(freq);
    return { text: f.name + ' \u2014 ' + fl.label + ' (' + freq + '\u00d7/wk)', signal: 'good' };
  });
  return {
    icon: 'star', domain: 'amber', title: 'Favorite Foods',
    sections: [{ label: favs.length + ' favorite' + (favs.length !== 1 ? 's' : ''), items: items }],
    confidence: 'Favorites are used to boost meal predictions and suggestions'
  };
}

function setQLMeal(meal) {
  _qlMeal = meal;
  document.querySelectorAll('.ql-meal-pill').forEach(p => p.classList.toggle('active', p.dataset.meal === meal));
}

function adjQLWake(delta) {
  _qlWake = Math.max(0, Math.min(10, _qlWake + delta));
  document.getElementById('qlWakeVal').textContent = _qlWake;
}

function setQLColor(el) {
  _qlColor = el.dataset.color;
  document.querySelectorAll('.ql-color-dot').forEach(d => d.classList.toggle('active', d === el));
}

function setQLCon(el) {
  _qlCon = el.dataset.con;
  document.querySelectorAll('.ql-con-pill').forEach(p => p.classList.toggle('active', p === el));
}

let _lastQLUndo = null;

function showQLToast(msg, duration, undoFn) {
  const t = document.getElementById('qlToast');
  if (undoFn) {
    _lastQLUndo = undoFn;
    t.innerHTML = msg + ' <span data-action="undoLastQL" data-stop="1" style="text-decoration:underline;font-weight:700;cursor:pointer;margin-left:8px;">Undo</span>';
  } else {
    _lastQLUndo = null;
    t.innerHTML = msg;
  }
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); _lastQLUndo = null; }, duration || 2000);
}

function undoLastQL() {
  if (_lastQLUndo) {
    try { _lastQLUndo(); } catch(e) { console.warn('Undo error:', e); }
    _lastQLUndo = null;
    const t = document.getElementById('qlToast');
    t.textContent = '↩️ Undone';
    setTimeout(() => t.classList.remove('show'), 1200);
    // Refresh views
    const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
    if (curTab === 'diet') { initFeeding(); renderDietStats(); }
    if (curTab === 'poop') { renderPoop(); }
    if (curTab === 'sleep') { renderSleep(); }
    if (curTab === 'home') renderHome();
  }
}

// ── Quick Log Save Functions ──

function saveQLFeed() {
  const food = document.getElementById('qlFeedInput').value.trim();
  if (!food) { document.getElementById('qlFeedInput').focus(); return; }
  const dateStr = _qlBackfillDate || today();

  // Load feeding data and merge into the correct day
  const feeding = load(KEYS.feeding, {}) || {};
  if (!feeding[dateStr]) feeding[dateStr] = { breakfast:'', lunch:'', dinner:'', snack:'' };
  const day = feeding[dateStr];

  // Capture prev value for undo BEFORE mutation
  const undoMealKey = _qlMeal;
  const prevMealValue = day[undoMealKey] || '';

  day[_qlMeal] = day[_qlMeal] ? day[_qlMeal] + ', ' + food : food;
  // Save meal time if entered
  const qlTime = document.getElementById('qlFeedTime')?.value;
  if (qlTime) day[_qlMeal + '_time'] = qlTime;
  // Save intake level from QL pills
  if (_qlSelectedIntake && _qlMeal !== 'snack') {
    day[_qlMeal + '_intake'] = _qlSelectedIntake;
  }
  save(KEYS.feeding, feeding);
  feedingData = feeding;
  _tsfMarkDirty();

  _islMarkDirty('diet');
  // Auto-introduce new foods
  autoIntroduceFoodsFromDay(dateStr);

  // Build nutrient flash for toast
  const NUTRIENT_EMOJI = { iron:zi('drop'), calcium:zi('ruler'), protein:zi('run'), 'vitamin C':zi('bowl'), fibre:zi('bowl'), 'vitamin A':zi('scope'), 'omega-3':zi('brain'), zinc:zi('shield') };
  let toastMsg = '✓ ' + capitalize(_qlMeal) + ' logged';
  if (_qlBackfillDate && _qlBackfillDate !== today()) {
    toastMsg += ' for ' + formatDate(_qlBackfillDate);
  }
  let hasNutrientFlash = false;
  try {
    const items = parseMealNutrition(food);
    if (items.length > 0) {
      const allNutrients = [...new Set(items.flatMap(i => i.nutrients || []))];
      const allTags = new Set(items.flatMap(i => i.tags || []));
      const keyHits = KEY_NUTRIENTS.filter(n => allNutrients.includes(n));
      if (keyHits.length > 0) {
        hasNutrientFlash = true;
        const emojis = keyHits.slice(0, 3).map(n => (NUTRIENT_EMOJI[n] || '') + ' ' + n).join(' + ');
        toastMsg += ' · ' + emojis;
        // Iron + Vit C synergy check
        if ((allTags.has('iron-rich') || allNutrients.includes('iron')) &&
            (allTags.has('vitamin-C') || allTags.has('iron-absorption') || allNutrients.includes('vitamin C'))) {
          toastMsg += ' — great pairing!';
        }
      }
    }
  } catch(e) { /* nutrient flash is best-effort */ }

  _qlBackfillDate = null; // reset backfill

  // Smart QL: compute insight BEFORE closing modal
  var qlInsight = _qlFeedInsight();
  // Accuracy tracking
  _qlLogAction('feed:' + _qlMeal, _qlSuggestUsed);

  // Build undo function
  const undoDateStr = dateStr;
  const undoFn = () => {
    const f = load(KEYS.feeding, {}) || {};
    if (f[undoDateStr]) { f[undoDateStr][undoMealKey] = prevMealValue; save(KEYS.feeding, f); feedingData = f; _islMarkDirty('diet'); }
  };

  closeQuickLogAll();
  if (!hasNutrientFlash && qlInsight) toastMsg += ' \u00b7 ' + qlInsight;
  showQLToast(toastMsg, hasNutrientFlash ? 4000 : 3000, undoFn);
  matchSuggestionsAfterSave(dateStr);

  // Refresh if on diet tab or home
  const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (curTab === 'diet') { initFeeding(); renderDietStats(); }
  if (curTab === 'home') renderHome();
}

function saveQLSleep() {
  const bed = document.getElementById('qlSleepBed').value;
  const wake = document.getElementById('qlSleepWake').value;
  if (!bed || !wake) return;
  const dateStr = _qlBackfillDate || today();

  const entry = {
    date: dateStr,
    type: 'night',
    bedtime: bed,
    wakeTime: wake,
    wakeUps: _qlWake,
    notes: ''
  };
  sleepData.push(entry);
  save(KEYS.sleep, sleepData);
  _tsfMarkDirty();

  _islMarkDirty('sleep');
  // Smart QL: compute insight BEFORE close
  var qlInsight = _qlSleepInsight();
  _qlLogAction('sleep', _qlSuggestUsed);
  const undoFn = () => {
    const idx = sleepData.indexOf(entry);
    if (idx >= 0) { sleepData.splice(idx, 1); save(KEYS.sleep, sleepData); _islMarkDirty('sleep'); }
  };

  _qlBackfillDate = null;
  closeQuickLogAll();
  var sleepToastMsg = zi('check') + ' Sleep logged' + (dateStr !== today() ? ' for ' + formatDate(dateStr) : '') + (qlInsight ? ' \u00b7 ' + qlInsight : '');
  showQLToast(sleepToastMsg, 3000, undoFn);

  const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (curTab === 'sleep') { renderSleep(); setTimeout(drawSleepChart, 60); }
  if (curTab === 'home') { renderHome(); renderHomeSleep(); }
}

function saveQLNap() {
  const start = document.getElementById('qlNapStart').value;
  const end = document.getElementById('qlNapEnd').value;
  if (!start || !end) return;
  const dateStr = _qlBackfillDate || today();

  const entry = {
    date: dateStr,
    type: 'nap',
    bedtime: start,
    wakeTime: end,
    wakeUps: 0,
    notes: ''
  };
  sleepData.push(entry);
  save(KEYS.sleep, sleepData);
  _tsfMarkDirty();

  _islMarkDirty('sleep');
  // Smart QL: compute insight BEFORE close
  var qlNapInsight = _qlSleepInsight();
  _qlLogAction('nap', _qlSuggestUsed);
  const undoFn = () => {
    const idx = sleepData.indexOf(entry);
    if (idx >= 0) { sleepData.splice(idx, 1); save(KEYS.sleep, sleepData); _islMarkDirty('sleep'); }
  };

  _qlBackfillDate = null;
  closeQuickLogAll();
  var napToastMsg = zi('check') + ' Nap logged' + (dateStr !== today() ? ' for ' + formatDate(dateStr) : '') + (qlNapInsight ? ' \u00b7 ' + qlNapInsight : '');
  showQLToast(napToastMsg, 3000, undoFn);

  const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (curTab === 'sleep') { renderSleep(); setTimeout(drawSleepChart, 60); }
  if (curTab === 'home') { renderHome(); renderHomeSleep(); }
}

function saveQLPoop() {
  const dateStr = _qlBackfillDate || today();
  const timeStr = document.getElementById('qlPoopTime').value || new Date().toTimeString().slice(0, 5);

  const entry = {
    date: dateStr,
    time: timeStr,
    color: _qlColor,
    consistency: _qlCon,
    amount: 'medium',
    blood: false,
    mucus: false,
    notes: ''
  };
  poopData.push(entry);
  save(KEYS.poop, poopData);
  _tsfMarkDirty();

  _islMarkDirty('poop');
  // Smart QL: compute insight BEFORE close
  var qlPoopIns = _qlPoopInsight();
  _qlLogAction('poop', _qlSuggestUsed);
  const undoFn = () => {
    const idx = poopData.indexOf(entry);
    if (idx >= 0) { poopData.splice(idx, 1); save(KEYS.poop, poopData); _islMarkDirty('poop'); }
  };

  _qlBackfillDate = null;
  closeQuickLogAll();
  var poopToastMsg = zi('check') + ' Poop logged' + (dateStr !== today() ? ' for ' + formatDate(dateStr) : '') + (qlPoopIns ? ' \u00b7 ' + qlPoopIns : '');
  showQLToast(poopToastMsg, 3000, undoFn);

  const curTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (curTab === 'poop') { renderPoop(); setTimeout(drawPoopChart, 60); }
  if (curTab === 'home') renderHome();
}

// capitalize → migrated to core.js

// ─────────────────────────────────────────

// TODAY SO FAR — Smart Card (tsf-*)
// ═══════════════════════════════════════════════════════

let _tsfExpandedId = null;
let _tsfShowAll = false;
let _tsfPatternCache = null;
let _tsfAnchorCache = null;
let _tsfCacheDirty = true;
let _tsfCacheTime = 0;

function _tsfMarkDirty() { _tsfCacheDirty = true; }

function _tsfTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0]), m = parseInt(parts[1]);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function _tsfMinutesToDisplay(min) {
  if (min === null || min === undefined) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? h12 + ' ' + ampm : h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function _tsfFormatTime(timeStr) {
  const min = _tsfTimeToMinutes(timeStr);
  if (min === null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? String(h12) : h12 + ':' + String(m).padStart(2, '0');
}

function _tsfInferMealTime(meal, todayEntry) {
  const defaults = { breakfast: 480, lunch: 720, snack: 930, dinner: 1140 };
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  let inferred = defaults[meal] || 720;

  // If adjacent meals have times, infer relative to them
  if (todayEntry) {
    const idx = order.indexOf(meal);
    // Check next meal for upper bound
    for (let i = idx + 1; i < order.length; i++) {
      const nextTime = _tsfTimeToMinutes(todayEntry[order[i] + '_time']);
      if (nextTime !== null) {
        inferred = Math.min(inferred, nextTime - 180);
        break;
      }
    }
    // Check prev meal for lower bound
    for (let i = idx - 1; i >= 0; i--) {
      const prevTime = _tsfTimeToMinutes(todayEntry[order[i] + '_time']);
      if (prevTime !== null) {
        inferred = Math.max(inferred, prevTime + 120);
        break;
      }
    }
  }
  return { timeMin: Math.max(360, Math.min(inferred, 1380)), inferred: true };
}

function _tsfIsMealLogged(todayEntry, meal) {
  if (!todayEntry) return false;
  const foods = todayEntry[meal] || '';
  const time = todayEntry[meal + '_time'] || '';
  return (typeof foods === 'string' && foods.trim().length > 0) || (typeof time === 'string' && time.trim().length > 0);
}

function _tsfCollectEvents() {
  const t = today();
  const todayEntry = feedingData[t] || {};
  const events = [];
  const noTimeEvents = [];
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealIcons = { breakfast: 'sun', lunch: 'sun', dinner: 'moon', snack: 'spoon' };
  const mealColors = { breakfast: 'peach', lunch: 'sage', dinner: 'lav', snack: 'amber' };

  // ── Meals ──
  meals.forEach(meal => {
    if (!_tsfIsMealLogged(todayEntry, meal)) return;
    const timeStr = todayEntry[meal + '_time'] || '';
    const timeMin = _tsfTimeToMinutes(timeStr);
    const intakeRaw = todayEntry[meal + '_intake'];
    const intakeLabels = { '0.25': 'Few bites', '0.5': 'Half', '0.75': 'Most', '1': 'All' };
    const intake = intakeRaw != null ? (intakeLabels[String(intakeRaw)] || String(intakeRaw)) : '';
    const foods = todayEntry[meal] || '';
    let inferred = false;

    let finalTimeMin = timeMin;
    let displayTime = _tsfFormatTime(timeStr);

    if (finalTimeMin === null) {
      const inf = _tsfInferMealTime(meal, todayEntry);
      finalTimeMin = inf.timeMin;
      inferred = true;
      displayTime = '~' + _tsfMinutesToDisplay(finalTimeMin);
    }

    events.push({
      id: 'feed-' + meal,
      type: 'feed',
      time: timeStr || null,
      timeMin: finalTimeMin,
      label: meal.charAt(0).toUpperCase() + meal.slice(1),
      detail: intake,
      icon: zi(mealIcons[meal]),
      color: mealColors[meal],
      inferred: inferred,
      displayTime: displayTime,
      meal: meal,
      foods: foods
    });
  });

  // ── Night sleep (yesterday's latest wakeTime) ──
  const yesterday = _offsetDateStr(t, -1);
  const lastNightEntries = sleepData.filter(function(s) { return s.date === yesterday && s.type === 'night' && s.wakeTime; });
  if (lastNightEntries.length > 0) {
    const lastNight = lastNightEntries.sort(function(a, b) { return (b.wakeTime || '').localeCompare(a.wakeTime || ''); })[0];
    const wakeMin = _tsfTimeToMinutes(lastNight.wakeTime);
    if (wakeMin !== null && wakeMin < 720) {
      const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
      events.push({
        id: 'sleep-' + lastNight.wakeTime,
        type: 'sleep',
        time: lastNight.wakeTime,
        timeMin: wakeMin,
        label: 'Night sleep',
        detail: dur.h + 'h ' + dur.m + 'm',
        icon: zi('moon'),
        color: 'indigo',
        inferred: false,
        displayTime: _tsfFormatTime(lastNight.wakeTime),
        bedtime: lastNight.bedtime,
        wakeTime: lastNight.wakeTime,
        wakeUps: lastNight.wakeUps || 0
      });
    }
  }

  // ── Naps today ──
  sleepData.filter(function(s) { return s.date === t && s.type === 'nap' && s.bedtime && s.wakeTime; }).forEach(function(nap) {
    const bedMin = _tsfTimeToMinutes(nap.bedtime);
    if (bedMin === null) return;
    const dur = calcSleepDuration(nap.bedtime, nap.wakeTime);
    events.push({
      id: 'nap-' + nap.bedtime,
      type: 'nap',
      time: nap.bedtime,
      timeMin: bedMin,
      label: 'Nap',
      detail: dur.h + 'h ' + dur.m + 'm',
      icon: zi('zzz'),
      color: 'lav',
      inferred: false,
      displayTime: _tsfFormatTime(nap.bedtime),
      bedtime: nap.bedtime,
      wakeTime: nap.wakeTime,
      wakeUps: nap.wakeUps || 0
    });
  });

  // ── Active sleep in progress ──
  try {
    const ipRaw = localStorage.getItem(SLEEP_INPROGRESS_KEY);
    if (ipRaw) {
      const ip = JSON.parse(ipRaw);
      if (ip && ip.startTime) {
        const startMin = _tsfTimeToMinutes(ip.startTime);
        if (startMin !== null) {
          const now = new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes();
          let elapsedMin = nowMin - startMin;
          if (elapsedMin < 0) elapsedMin += 1440;
          const isNight = ip.type === 'night';
          const isCalm = isNight && elapsedMin >= 120;
          events.push({
            id: 'sleep-inprogress',
            type: isNight ? 'sleep' : 'nap',
            time: ip.startTime,
            timeMin: startMin,
            label: isNight ? 'Night sleep' : 'Nap',
            detail: (elapsedMin >= 60 ? Math.floor(elapsedMin / 60) + 'h ' : '') + (elapsedMin % 60) + 'm so far',
            icon: zi(isNight ? 'moon' : 'zzz'),
            color: isNight ? 'indigo' : 'lav',
            inferred: false,
            displayTime: _tsfFormatTime(ip.startTime),
            isLive: true,
            isCalm: isCalm
          });
        }
      }
    }
  } catch(e) { /* ignore corrupt in-progress */ }

  // ── Poop today ──
  poopData.filter(function(p) { return p.date === t; }).forEach(function(p, idx) {
    const timeMin = _tsfTimeToMinutes(p.time);
    if (timeMin === null) {
      noTimeEvents.push({
        id: 'poop-notime-' + idx,
        type: 'poop',
        time: null,
        timeMin: null,
        label: 'Poop' + (p.consistency ? ' \u00b7 ' + p.consistency : '') + (p.color ? ' \u00b7 ' + p.color : ''),
        detail: '',
        icon: zi('diaper'),
        color: 'amber',
        inferred: false,
        displayTime: '',
        poopEntry: p
      });
      return;
    }
    const labelParts = ['Poop'];
    if (p.consistency) labelParts.push(p.consistency);
    if (p.color) labelParts.push(p.color);
    events.push({
      id: 'poop-' + (p.time || '') + '-' + idx,
      type: 'poop',
      time: p.time,
      timeMin: timeMin,
      label: labelParts.join(' \u00b7 '),
      detail: '',
      icon: zi('diaper'),
      color: 'amber',
      inferred: false,
      displayTime: _tsfFormatTime(p.time),
      poopEntry: p
    });
  });

  // ── Activities today ──
  const todayActivities = activityLog[t] || [];
  todayActivities.forEach(function(act) {
    let timeMin = null;
    let displayTime = '';
    let timeStr = null;
    if (act.ts) {
      try {
        const d = new Date(act.ts);
        if (!isNaN(d.getTime())) {
          timeMin = d.getHours() * 60 + d.getMinutes();
          timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          displayTime = _tsfFormatTime(timeStr);
        }
      } catch(e) {}
    }
    // Truncate label at last whole word before 30 chars
    let label = act.text || 'Activity';
    if (label.length > 30) {
      label = label.substring(0, 30).replace(/\s+\S*$/, '');
    }
    const ev = {
      id: 'activity-' + (act.ts || act.id || ''),
      type: 'activity',
      time: timeStr,
      timeMin: timeMin,
      label: label,
      detail: act.duration ? act.duration + ' min' : '',
      icon: zi('run'),
      color: 'sage',
      inferred: false,
      displayTime: displayTime,
      fullText: act.text || '',
      domains: act.domains || [],
      duration: act.duration
    };
    if (timeMin !== null) {
      events.push(ev);
    } else {
      noTimeEvents.push(ev);
    }
  });

  // ── Supplements (medChecks) today ──
  const todayMedChecks = medChecks[t] || {};
  Object.keys(todayMedChecks).forEach(function(medName) {
    const val = todayMedChecks[medName];
    if (typeof val !== 'string') return;
    let timeStr = null;
    let timeMin = null;
    let displayTime = '';
    if (val.startsWith('done:')) {
      const timePart = val.replace('done:', '').trim();
      if (timePart !== 'late') {
        timeMin = _tsfTimeToMinutes(timePart);
        timeStr = timePart;
        displayTime = _tsfFormatTime(timePart);
      }
    }
    const ev = {
      id: 'med-' + medName,
      type: 'med',
      time: timeStr,
      timeMin: timeMin,
      label: medName,
      detail: val.startsWith('done:') ? 'Done' : val === 'skipped' ? 'Skipped' : '',
      icon: zi('pill'),
      color: 'sky',
      inferred: false,
      displayTime: displayTime,
      status: val
    };
    if (timeMin !== null) {
      events.push(ev);
    } else if (val !== 'skipped') {
      noTimeEvents.push(ev);
    }
  });

  // ── CareTickets events ──
  try {
    var ctEvents = ctGetTSFEvents();
    ctEvents.forEach(function(ev) { events.push(ev); });
  } catch(e) { /* CT not loaded yet */ }

  // Sort by timeMin ascending
  events.sort(function(a, b) { return (a.timeMin || 0) - (b.timeMin || 0); });

  return { events: events, noTimeEvents: noTimeEvents };
}

function _tsfGetAnchor() {
  if (!_tsfCacheDirty && _tsfAnchorCache !== null && Date.now() - _tsfCacheTime < 1800000) return _tsfAnchorCache;
  const t = today();
  let totalEvents = 0;
  let daysWithData = 0;
  for (let i = 1; i <= 7; i++) {
    const d = _offsetDateStr(t, -i);
    let dayCount = 0;
    // Meals
    const fe = feedingData[d] || {};
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(m) {
      if ((fe[m] && fe[m].trim()) || (fe[m + '_time'] && fe[m + '_time'].trim())) dayCount++;
    });
    // Sleep
    sleepData.filter(function(s) { return s.date === d; }).forEach(function() { dayCount++; });
    // Poop
    poopData.filter(function(p) { return p.date === d; }).forEach(function() { dayCount++; });
    // Activities
    (activityLog[d] || []).forEach(function() { dayCount++; });
    // Meds
    const mc = medChecks[d] || {};
    Object.keys(mc).forEach(function(k) { if (mc[k] && mc[k].toString().startsWith('done')) dayCount++; });
    if (dayCount > 0) {
      totalEvents += dayCount;
      daysWithData++;
    }
  }
  let anchor = daysWithData >= 7 ? Math.round(totalEvents / daysWithData) : 6;
  if (anchor < 6) anchor = 6;
  _tsfAnchorCache = anchor;
  return anchor;
}

function _tsfDetectPatterns() {
  if (!_tsfCacheDirty && _tsfPatternCache !== null && Date.now() - _tsfCacheTime < 1800000) return _tsfPatternCache;
  const t = today();
  const patternDefs = [
    { key: 'breakfast', type: 'feed', meal: 'breakfast', minDays: 5, wStart: 360, wEnd: 600, label: 'Breakfast usually around {time}', icon: zi('sun'), color: 'peach', nudgeAction: 'feed', nudgeMeal: 'breakfast' },
    { key: 'morning-nap', type: 'nap', minDays: 4, wStart: 480, wEnd: 690, label: 'Morning nap usually ~{time}', icon: zi('zzz'), color: 'lav', nudgeAction: 'nap' },
    { key: 'lunch', type: 'feed', meal: 'lunch', minDays: 5, wStart: 630, wEnd: 840, label: 'Lunch usually around {time}', icon: zi('sun'), color: 'sage', nudgeAction: 'feed', nudgeMeal: 'lunch' },
    { key: 'afternoon-nap', type: 'nap', minDays: 4, wStart: 750, wEnd: 990, label: 'Afternoon nap usually ~{time}', icon: zi('zzz'), color: 'lav', nudgeAction: 'nap' },
    { key: 'snack', type: 'feed', meal: 'snack', minDays: 4, wStart: 840, wEnd: 1020, label: 'Snack usually around {time}', icon: zi('spoon'), color: 'amber', nudgeAction: 'feed', nudgeMeal: 'snack' },
    { key: 'dinner', type: 'feed', meal: 'dinner', minDays: 5, wStart: 1020, wEnd: 1230, label: 'Dinner usually around {time}', icon: zi('moon'), color: 'lav', nudgeAction: 'feed', nudgeMeal: 'dinner' },
    { key: 'afternoon-poop', type: 'poop', minDays: 3, wStart: 720, wEnd: 1020, label: 'Poop usually around {time}', icon: zi('diaper'), color: 'amber', nudgeAction: 'poop' },
    { key: 'med-Vitamin D3 Drops', type: 'med', medName: 'Vitamin D3 Drops', minDays: 5, wStart: 0, wEnd: 1440, label: 'Vit D3 usually by {time}', icon: zi('pill'), color: 'sky', nudgeAction: 'med' }
  ];

  const patterns = [];

  patternDefs.forEach(function(def) {
    let matchDays = 0;
    let totalMin = 0;
    let timedDayCount = 0;

    for (let i = 1; i <= 7; i++) {
      const d = _offsetDateStr(t, -i);
      let found = false;
      let foundMin = null;

      if (def.type === 'feed' && def.meal) {
        const fe = feedingData[d] || {};
        if (_tsfIsMealLogged(fe, def.meal)) {
          const mt = _tsfTimeToMinutes(fe[def.meal + '_time']);
          if (mt !== null && mt >= def.wStart && mt <= def.wEnd) {
            found = true;
            foundMin = mt;
          } else if (mt === null) {
            // Meal logged without time — counts as a match but doesn't contribute to avg time
            found = true;
          }
        }
      } else if (def.type === 'nap') {
        sleepData.filter(function(s) { return s.date === d && s.type === 'nap' && s.bedtime; }).forEach(function(s) {
          const sm = _tsfTimeToMinutes(s.bedtime);
          if (sm !== null && sm >= def.wStart && sm <= def.wEnd) {
            if (!found) { found = true; foundMin = sm; }
          }
        });
      } else if (def.type === 'poop') {
        poopData.filter(function(p) { return p.date === d && p.time; }).forEach(function(p) {
          const pm = _tsfTimeToMinutes(p.time);
          if (pm !== null && pm >= def.wStart && pm <= def.wEnd) {
            if (!found) { found = true; foundMin = pm; }
          }
        });
      } else if (def.type === 'med' && def.medName) {
        const mc = medChecks[d] || {};
        const val = mc[def.medName];
        if (val && typeof val === 'string' && val.startsWith('done:')) {
          const timePart = val.replace('done:', '').trim();
          const mm = _tsfTimeToMinutes(timePart);
          found = true;
          if (mm !== null) foundMin = mm;
        }
      }

      if (found) {
        matchDays++;
        if (foundMin !== null) { totalMin += foundMin; timedDayCount++; }
      }
    }

    if (matchDays >= def.minDays) {
      const avgMin = timedDayCount > 0 ? Math.round(totalMin / timedDayCount) : null;
      patterns.push({
        key: def.key,
        type: def.type,
        meal: def.meal || null,
        medName: def.medName || null,
        avgTimeMin: avgMin,
        avgTimeStr: avgMin !== null ? _tsfMinutesToDisplay(avgMin) : null,
        dayCount: matchDays,
        icon: def.icon,
        color: def.color,
        label: def.label,
        windowStart: def.wStart,
        windowEnd: def.wEnd,
        nudgeAction: def.nudgeAction,
        nudgeMeal: def.nudgeMeal || null
      });
    }
  });

  _tsfPatternCache = patterns;
  return patterns;
}

function _tsfGetNudges() {
  const patterns = _tsfDetectPatterns();
  const t = today();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayEntry = feedingData[t] || {};
  const todayMC = medChecks[t] || {};
  const nudges = [];

  // Priority order: Nap > Supplement > Feed > Poop
  const priorityOrder = ['nap', 'med', 'feed', 'poop'];

  // Sort patterns by priority
  const sortedPatterns = patterns.slice().sort(function(a, b) {
    return priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type);
  });

  sortedPatterns.forEach(function(pat) {
    if (nudges.length >= 3) return;
    if (pat.avgTimeMin === null) return;

    // Don't nudge if not past expected time + 30 min
    if (nowMin < pat.avgTimeMin + 30) return;

    // Expire: don't nudge if 4+ hours past pattern time
    if (nowMin > pat.avgTimeMin + 240) return;

    // Check if already logged today
    let alreadyLogged = false;

    if (pat.type === 'feed' && pat.meal) {
      alreadyLogged = _tsfIsMealLogged(todayEntry, pat.meal);
    } else if (pat.type === 'nap') {
      // Check for nap in this pattern's window
      alreadyLogged = sleepData.some(function(s) {
        if (s.date !== t || s.type !== 'nap' || !s.bedtime) return false;
        const sm = _tsfTimeToMinutes(s.bedtime);
        return sm !== null && sm >= pat.windowStart && sm <= pat.windowEnd;
      });
      // Also check active sleep in progress
      try {
        const ipRaw = localStorage.getItem(SLEEP_INPROGRESS_KEY);
        if (ipRaw) {
          const ip = JSON.parse(ipRaw);
          if (ip && ip.type === 'nap') alreadyLogged = true;
        }
      } catch(e) {}
    } else if (pat.type === 'poop') {
      // Check for poop in this pattern's window
      alreadyLogged = poopData.some(function(p) {
        if (p.date !== t) return false;
        const pm = _tsfTimeToMinutes(p.time);
        return pm !== null && pm >= pat.windowStart && pm <= pat.windowEnd;
      });
    } else if (pat.type === 'med' && pat.medName) {
      const mc = todayMC[pat.medName];
      alreadyLogged = mc && typeof mc === 'string' && (mc.startsWith('done') || mc === 'skipped');
    }

    if (alreadyLogged) return;

    const labelStr = pat.label.replace('{time}', pat.avgTimeStr || '');
    let actionStr = 'Not logged yet';
    if (pat.type === 'nap') actionStr += ' \u00b7 Log nap \u2192';
    else if (pat.type === 'feed') actionStr += ' \u00b7 Log ' + (pat.meal || 'meal') + ' \u2192';
    else if (pat.type === 'poop') actionStr += ' \u00b7 Log poop \u2192';
    else if (pat.type === 'med') actionStr += ' \u00b7 Mark done \u2192';

    nudges.push({
      key: pat.key,
      type: pat.type,
      meal: pat.meal,
      medName: pat.medName,
      icon: pat.icon,
      color: pat.color,
      label: labelStr,
      action: actionStr,
      nudgeAction: pat.nudgeAction,
      nudgeMeal: pat.nudgeMeal
    });
  });

  return nudges;
}

function _tsfRenderEventExpanded(ev) {
  let html = '';
  if (ev.type === 'feed') {
    if (ev.foods) html += '<div>' + escHtml(ev.foods) + '</div>';
    if (ev.detail) html += '<div>Intake: ' + escHtml(ev.detail) + '</div>';
  } else if (ev.type === 'sleep' || ev.type === 'nap') {
    if (ev.bedtime) html += '<div>Bedtime: ' + escHtml(ev.bedtime) + '</div>';
    if (ev.wakeTime) html += '<div>Wake: ' + escHtml(ev.wakeTime) + '</div>';
    if (ev.detail) html += '<div>Duration: ' + escHtml(ev.detail) + '</div>';
    if (ev.wakeUps) html += '<div>Wake-ups: ' + ev.wakeUps + '</div>';
  } else if (ev.type === 'poop' && ev.poopEntry) {
    const p = ev.poopEntry;
    if (p.consistency) html += '<div>Consistency: ' + escHtml(p.consistency) + '</div>';
    if (p.color) html += '<div>Color: ' + escHtml(p.color) + '</div>';
    if (p.amount) html += '<div>Amount: ' + escHtml(p.amount) + '</div>';
    if (p.blood) html += '<div>Blood: Yes</div>';
    if (p.mucus) html += '<div>Mucus: Yes</div>';
    if (p.notes) html += '<div>Notes: ' + escHtml(p.notes) + '</div>';
  } else if (ev.type === 'activity') {
    if (ev.fullText) html += '<div>' + escHtml(ev.fullText) + '</div>';
    if (ev.duration) html += '<div>Duration: ' + ev.duration + ' min</div>';
    if (ev.domains && ev.domains.length > 0) html += '<div>Domains: ' + escHtml(ev.domains.join(', ')) + '</div>';
  } else if (ev.type === 'med') {
    if (ev.status) html += '<div>Status: ' + escHtml(ev.status.replace('done:', 'Done at ')) + '</div>';
  }
  return html || '<div>No additional details</div>';
}

function renderTodaySoFar() {
  const card = document.getElementById('tsfCard');
  const el = document.getElementById('tsfContent');
  if (!card || !el) return;

  // Always show (including Essential Mode)
  card.style.display = '';

  // Collect events fresh (today's data changes frequently)
  const collected = _tsfCollectEvents();
  const allEvents = collected.events;
  const noTimeEvents = collected.noTimeEvents;
  const totalCount = allEvents.length + noTimeEvents.length;

  // Cache management for patterns/anchor
  if (_tsfCacheDirty || Date.now() - _tsfCacheTime > 1800000) {
    _tsfPatternCache = null;
    _tsfAnchorCache = null;
  }

  const anchor = _tsfGetAnchor();
  const nudges = _tsfGetNudges();
  const patterns = _tsfPatternCache || [];
  const allNudgesResolved = nudges.length === 0 && patterns.length > 0 && totalCount > 0;

  // Mark cache as clean
  _tsfCacheDirty = false;
  _tsfCacheTime = Date.now();

  // ── Header (uses standard card-header pattern) ──
  let html = '<div class="card-header">';
  html += '<div class="card-title"><div class="icon icon-indigo">' + zi('clock') + '</div> Today So Far</div>';
  html += '<span class="tsf-header-count">' + totalCount + ' event' + (totalCount !== 1 ? 's' : '') + ' logged';
  if (allNudgesResolved) {
    html += ' <span class="tsf-caught-up"><span class="icon icon-sage">' + zi('check') + '</span> All caught up</span>';
  }
  html += '</span>';
  html += '</div>';

  // ── Warmth bar ──
  const fillPct = Math.min(totalCount / (anchor || 6), 1.0) * 100;
  let warmthLevel = 1;
  if (fillPct >= 90) warmthLevel = 5;
  else if (fillPct >= 67) warmthLevel = 4;
  else if (fillPct >= 44) warmthLevel = 3;
  else if (fillPct >= 20) warmthLevel = 2;
  html += '<div class="tsf-warmth-bar"><div class="tsf-warmth-fill" data-level="' + warmthLevel + '" style="width:' + Math.max(fillPct, 3) + '%"></div></div>';

  // ── Empty state ──
  if (totalCount === 0) {
    html += '<div class="tsf-empty">No events logged yet';
    html += '<div class="tsf-empty-action" data-action="toggleQuickLog">Start with breakfast?</div>';
    html += '</div>';
    el.innerHTML = html;
    return;
  }

  // ── Event list with soft cap ──
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const SOFT_CAP = 8;
  let visibleEvents = allEvents;
  let hiddenCount = 0;

  if (allEvents.length > SOFT_CAP && !_tsfShowAll) {
    // Show first event + most recent 7
    const firstEvent = allEvents.slice(0, 1);
    const recentEvents = allEvents.slice(-(SOFT_CAP - 1));
    hiddenCount = allEvents.length - SOFT_CAP;
    visibleEvents = firstEvent;
    // Add "show earlier" placeholder
    visibleEvents = visibleEvents.concat([{ _showEarlier: true, count: hiddenCount }]).concat(recentEvents);
  }

  html += '<div class="tsf-event-list">';

  let nowMarkerPlaced = false;

  visibleEvents.forEach(function(ev) {
    // "Show earlier" row
    if (ev._showEarlier) {
      html += '<div class="tsf-show-earlier" data-action="tsfShowEarlier">Show earlier \u00b7 +' + ev.count + ' more</div>';
      return;
    }

    // Insert Now marker before first event after current time
    if (!nowMarkerPlaced && ev.timeMin !== null && ev.timeMin > nowMin && !ev.isLive) {
      html += '<div class="tsf-now">Now \u00b7 ' + _tsfMinutesToDisplay(nowMin) + '</div>';
      nowMarkerPlaced = true;
    }

    const isExpanded = _tsfExpandedId === ev.id;
    const inferredClass = ev.inferred ? ' tsf-event-inferred' : '';
    const liveClass = ev.isLive ? ' tsf-event-live' : '';
    const expandedClass = isExpanded ? ' tsf-event-expanded' : '';
    const calmAttr = ev.isCalm ? ' data-calm="true"' : '';

    html += '<div class="tsf-event-wrap' + expandedClass + '">';
    html += '<div class="tsf-event' + inferredClass + liveClass + '" data-action="tsfToggleEvent" data-arg="' + escHtml(ev.id) + '"' + calmAttr + '>';
    html += '<div class="tsf-event-time">' + escHtml(ev.displayTime || '') + '</div>';

    // Icon with domain color
    const iconColorClass = ev.color === 'peach' ? 'icon-peach' : ev.color === 'sage' ? 'icon-sage' : ev.color === 'lav' ? 'icon-lav' : ev.color === 'amber' ? 'icon-amber' : ev.color === 'indigo' ? 'icon-indigo' : ev.color === 'sky' ? 'icon-sky' : 'icon-indigo';
    html += '<div class="tsf-event-icon"><div class="icon ' + iconColorClass + '">' + ev.icon + '</div></div>';

    html += '<div class="tsf-event-body">';
    html += '<div class="tsf-event-label">' + escHtml(ev.label) + '</div>';
    if (ev.detail) {
      html += '<div class="tsf-event-detail">' + escHtml(ev.detail) + '</div>';
    }
    html += '</div>';
    html += '</div>';

    // Expanded detail
    if (isExpanded) {
      html += '<div class="tsf-event-expanded-detail">' + _tsfRenderEventExpanded(ev) + '</div>';
    }
    html += '</div>'; // close tsf-event-wrap
  });

  // Now marker after all events if not yet placed
  if (!nowMarkerPlaced) {
    html += '<div class="tsf-now">Now \u00b7 ' + _tsfMinutesToDisplay(nowMin) + '</div>';
  }

  html += '</div>'; // end tsf-event-list

  // ── No-time events (above nudges, below Now) ──
  if (noTimeEvents.length > 0) {
    html += '<div class="tsf-no-time">';
    html += '<div class="tsf-no-time-label">Time not logged</div>';
    noTimeEvents.forEach(function(ev) {
      const isExpanded = _tsfExpandedId === ev.id;
      const expandedClass = isExpanded ? ' tsf-event-expanded' : '';
      const iconColorClass = ev.color === 'amber' ? 'icon-amber' : ev.color === 'sage' ? 'icon-sage' : ev.color === 'sky' ? 'icon-sky' : 'icon-indigo';
      html += '<div class="tsf-event-wrap' + expandedClass + '">';
      html += '<div class="tsf-event" data-action="tsfToggleEvent" data-arg="' + escHtml(ev.id) + '">';
      html += '<div class="tsf-event-time"></div>';
      html += '<div class="tsf-event-icon"><div class="icon ' + iconColorClass + '">' + ev.icon + '</div></div>';
      html += '<div class="tsf-event-body">';
      html += '<div class="tsf-event-label">' + escHtml(ev.label) + '</div>';
      if (ev.detail) html += '<div class="tsf-event-detail">' + escHtml(ev.detail) + '</div>';
      html += '</div></div>';
      if (isExpanded) {
        html += '<div class="tsf-event-expanded-detail">' + _tsfRenderEventExpanded(ev) + '</div>';
      }
      html += '</div>'; // close tsf-event-wrap
    });
    html += '</div>';
  }

  // ── Nudges ──
  if (nudges.length > 0) {
    html += '<div class="tsf-nudges">';
    nudges.forEach(function(n) {
      html += '<div class="tsf-nudge tsf-nudge-' + n.color + '" data-action="tsfNudgeTap" data-arg="' + escHtml(n.key) + '"';
      if (n.nudgeMeal) html += ' data-arg2="' + escHtml(n.nudgeMeal) + '"';
      if (n.medName) html += ' data-arg3="' + escHtml(n.medName) + '"';
      html += '>';
      const nudgeIconColor = n.color === 'lav' ? 'icon-lav' : n.color === 'sky' ? 'icon-sky' : n.color === 'peach' ? 'icon-peach' : n.color === 'sage' ? 'icon-sage' : n.color === 'amber' ? 'icon-amber' : 'icon-indigo';
      html += '<div class="tsf-nudge-icon"><div class="icon ' + nudgeIconColor + '">' + n.icon + '</div></div>';
      html += '<div class="tsf-nudge-body">';
      html += '<div class="tsf-nudge-text">' + escHtml(n.label) + '</div>';
      html += '<div class="tsf-nudge-action">' + escHtml(n.action) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
}

function renderHomeMealProgress() {
  const card = document.getElementById('homeMealProgressCard');
  const el = document.getElementById('homeMealProgressContent');
  if (!card || !el) return;

  const todayEntry = feedingData[today()] || {};
  const meals = [
    { key: 'breakfast', label: 'B', icon: zi('sun'), full: 'breakfast' },
    { key: 'lunch', label: 'L', icon: zi('sun'), full: 'lunch' },
    { key: 'dinner', label: 'D', icon: zi('moon'), full: 'dinner' },
    { key: 'snack', label: 'S', icon: zi('spoon'), full: 'snack' },
  ];

  const logged = meals.filter(m => todayEntry[m.key]).length;

  let html = '<div class="meal-progress">';
  meals.forEach(m => {
    const value = todayEntry[m.key];
    if (value === '—skipped—') {
      html += `<div class="meal-prog-slot mps-done" style="opacity:0.5;" data-tab="diet">
        <div class="meal-prog-icon">⏭️</div>
        <div class="meal-prog-label">${m.label}</div>
        <div class="meal-prog-food t-light" >skipped</div>
      </div>`;
    } else if (value) {
      const short = value.length > 20 ? value.substring(0, 18) + '…' : value;
      const _miVal = _miGetIntake(today(), m.key);
      const _miLv = _miLevelFor(_miVal);
      html += `<div class="meal-prog-slot mps-done" data-tab="diet">
        <div class="meal-prog-icon"><span class="zi-check-placeholder"></span></div>
        <div class="meal-prog-label">${m.label}</div>
        <div class="meal-prog-food">${escHtml(short)}</div>
        <div class="mi-prog-row">${_miRenderBar(_miVal)} <span class="mi-prog-label">${escHtml(_miLv.label)}</span></div>
      </div>`;
    } else {
      html += `<div class="meal-prog-slot mps-empty" onclick="_qlMeal='${m.full}';openQuickModal('feed')">
        <div class="meal-prog-icon">⬜</div>
        <div class="meal-prog-label">${m.label}</div>
        <div class="meal-prog-food t-light" >tap to log</div>
      </div>`;
    }
  });
  html += '</div>';

  // Count real meals (not skipped)
  const realMeals = meals.filter(m => todayEntry[m.key] && todayEntry[m.key] !== '—skipped—').length;
  const skipped = meals.filter(m => todayEntry[m.key] === '—skipped—').length;
  const empty = meals.filter(m => !todayEntry[m.key]).length;

  if (realMeals === 3) {
    html += `<div style="text-align:center;font-size:var(--fs-xs);color:var(--tc-sage);margin-top:6px;font-weight:600;">${zi('check')} All meals logged today</div>`;
  } else if (empty > 0) {
    const emptyNames = meals.filter(m => !todayEntry[m.key]).map(m => m.full);
    html += `<div style="text-align:center;font-size:var(--fs-xs);color:var(--light);margin-top:6px;">${realMeals}/3 logged${skipped > 0 ? ' · ' + skipped + ' skipped' : ''} · <span style="color:var(--tc-sky);cursor:pointer;" onclick="skipMeals(['${emptyNames.join("','")}'])">Skip remaining</span></div>`;
  } else {
    html += `<div style="text-align:center;font-size:var(--fs-xs);color:var(--tc-sage);margin-top:6px;font-weight:600;">${zi('check')} All accounted for (${realMeals} logged, ${skipped} skipped)</div>`;
  }

  // ── Meal Diversity Index (visible in Essential Mode) ──
  if (realMeals >= 2) {
    const mdi = computeMealDiversity(today());
    const dayColor = getMdiColor(mdi.dayScore);
    const dayTextColor = getMdiTextColor(mdi.dayScore);
    const dayLabel = mdi.dayScore >= 60 ? 'Great variety' : mdi.dayScore >= 35 ? 'OK variety' : 'Low variety';
    const pct = Math.min(mdi.dayScore, 100);

    html += `<div class="mdi-home-wrap ptr" data-action="openDiversityDetail" >`;
    html += `<div class="mdi-home-row"><span style="font-weight:600;color:var(--mid);font-size:var(--fs-xs);">Today's diversity</span><span style="margin-left:auto;font-weight:700;font-size:var(--fs-xs);color:${dayTextColor};">${dayLabel} · ${mdi.totalGroups} group${mdi.totalGroups !== 1 ? 's' : ''}</span></div>`;
    html += `<div class="mdi-bar"><div class="mdi-bar-fill ${dayColor}" style="width:${pct}%;"></div></div>`;

    // Per-meal mini bars
    html += `<div style="display:flex;gap:var(--sp-4);margin-top:6px;">`;
    ['breakfast','lunch','dinner','snack'].forEach(mk => {
      const md = mdi.meals[mk];
      if (md.foods === 0) return;
      const c = getMdiColor(md.score);
      const barPct = Math.min(md.score, 100);
      html += `<div class="flex-1-min0"><div class="t-xs" style="color:var(--light);text-align:center;">${md.label}</div><div class="mdi-bar"><div class="mdi-bar-fill ${c}" style="width:${barPct}%;"></div></div></div>`;
    });
    html += `</div>`;

    if (mdi.rutFood) {
      html += `<div class="t-xs" style="color:var(--tc-amber);margin-top:4px;">${zi('hourglass')} ${mdi.rutFood} appears a lot today — try swapping one meal</div>`;
    }
    html += `</div>`;
  }

  // ── Persisted Post-Save Summary ──
  if (_lastPsfData && _lastPsfData.dateStr === today()) {
    const d = _lastPsfData;
    html += `<div class="psf-home-wrap" data-action="showPsfReview">`;
    html += `<div style="display:flex;align-items:center;gap:var(--sp-8);margin-bottom:6px;">`;
    html += `<span style="font-weight:600;color:var(--mid);font-size:var(--fs-xs);">Nutrition snapshot</span>`;
    html += `<span style="margin-left:auto;font-size:var(--fs-xs);color:var(--light);">${d.covered.length}/${d.covered.length + d.missing.length} nutrients · tap to review</span>`;
    html += `</div>`;
    html += `<div class="psf-nutrients" style="margin-bottom:0;">${d.nutrientHtml}</div>`;
    html += `</div>`;
  }

  // Food query + symptom checker shortcuts — accessible from Home, visible in Essential Mode
  html += `<div style="margin-top:8px;text-align:center;display:flex;justify-content:center;gap:var(--sp-8);flex-wrap:wrap;">
    <span class="dqp-pill" style="font-size:var(--fs-xs);" data-action="openHomeFoodQuery">${zi('scope')} Can I give this?</span>
    <span class="dqp-pill" style="font-size:var(--fs-xs);background:var(--rose-light);color:var(--tc-caution);border-color:rgba(220,120,80,0.15);" data-action="openHomeSymptomChecker">🩺 Symptom checker</span>
  </div>`;

  el.innerHTML = html;
}

// Open "Can I Give This?" from Home without tab switch
function openHomeFoodQuery() {
  // Create a modal overlay with the food checker
  const existing = document.getElementById('homeFoodQueryOverlay');
  if (existing) { existing.remove(); document.body.style.overflow = ''; return; }

  const overlay = document.createElement('div');
  overlay.id = 'homeFoodQueryOverlay';
  overlay.className = 'modal-overlay open';
  overlay.style.overscrollBehavior = 'contain';
  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;max-height:85vh;overflow-y:auto;padding:20px;">
      <div class="ql-modal-header">
        <div class="ql-modal-title">${zi('scope')} Can I Give This?</div>
        <button class="ql-modal-close" data-action="closeHomeFoodQuery">&times;</button>
      </div>
      <div>
        <div class="guidance-text">Check any food — safety, nutrition, best pairings, and Ziva's history with it.</div>
        <div class="flex-gap8-wrap-mb">
          <input type="text" id="homeFoodQueryInput" placeholder="e.g. kiwi, paneer + rice..." style="flex:1;min-width:160px;padding:10px 14px;border-radius:var(--r-lg);border:1.5px solid var(--sage-light);font-family:'Nunito',sans-serif;font-size:var(--fs-base);background:var(--sage-light);color:var(--text);outline:none;" onkeydown="if(event.key==='Enter')runHomeFoodQuery()">
          <button class="btn btn-sage" data-action="runHomeFoodQuery" style="min-width:70px;">Check</button>
        </div>
        <div id="homeFoodQueryResult"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.onclick = e => { if (e.target === overlay) closeHomeFoodQuery(); };
  setTimeout(() => document.getElementById('homeFoodQueryInput')?.focus(), 200);
}

function closeHomeFoodQuery() {
  const el = document.getElementById('homeFoodQueryOverlay');
  if (el) el.remove();
  document.body.style.overflow = '';
}

function openHomeSymptomChecker() {
  const existing = document.getElementById('homeSymptomOverlay');
  if (existing) { existing.remove(); document.body.style.overflow = ''; return; }

  const overlay = document.createElement('div');
  overlay.id = 'homeSymptomOverlay';
  overlay.className = 'modal-overlay open';
  overlay.style.overscrollBehavior = 'contain';

  // Build quick chips HTML
  const chipsHtml = SYMPTOM_QUICK_CHIPS.map(s =>
    '<span class="sc-quick-chip" onclick="document.getElementById(\'homeSymptomInput\').value=\'' + s + '\';runHomeSymptomCheck()">' + s + '</span>'
  ).join('');

  overlay.innerHTML = `
    <div class="modal" style="max-width:420px;max-height:85vh;overflow-y:auto;padding:20px;">
      <div class="ql-modal-header">
        <div class="ql-modal-title">🩺 Symptom Checker</div>
        <button class="ql-modal-close" data-action="closeHomeSymptomChecker">&times;</button>
      </div>
      <div>
        <div class="guidance-text">Describe what you're noticing — get age-appropriate guidance and know when to call the doctor.</div>
        <div class="flex-gap8-wrap-mb">
          <input type="text" id="homeSymptomInput" placeholder="e.g. fever, rash, not eating..." style="flex:1;min-width:160px;padding:10px 14px;border-radius:var(--r-lg);border:1.5px solid var(--sage-light);font-family:'Nunito',sans-serif;font-size:var(--fs-base);background:var(--sage-light);color:var(--text);outline:none;" onkeydown="if(event.key==='Enter')runHomeSymptomCheck()">
          <button class="btn btn-sage" data-action="runHomeSymptomCheck" style="min-width:70px;">Check</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:var(--sp-4);margin-bottom:10px;">${chipsHtml}</div>
        <div id="homeSymptomResult"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  overlay.onclick = e => { if (e.target === overlay) closeHomeSymptomChecker(); };
  setTimeout(() => document.getElementById('homeSymptomInput')?.focus(), 200);
}

function closeHomeSymptomChecker() {
  const el = document.getElementById('homeSymptomOverlay');
  if (el) el.remove();
  document.body.style.overflow = '';
}

function runHomeSymptomCheck() {
  const input = document.getElementById('homeSymptomInput');
  const query = (input?.value || '').trim();
  if (!query) return;
  const resultEl = document.getElementById('homeSymptomResult');
  if (!resultEl) return;

  // Run the symptom matching logic directly
  const queryLower = query.toLowerCase();
  const mo = getAgeInMonths();
  const matches = [];

  SYMPTOM_DB.forEach(function(entry) {
    var score = 0;
    entry.keywords.forEach(function(kw) {
      if (queryLower.includes(kw.toLowerCase())) score += 2;
      var words = kw.toLowerCase().split(' ');
      words.forEach(function(w) {
        if (w.length > 3 && queryLower.includes(w)) score += 1;
      });
    });
    if (score > 0) {
      var finalSeverity = entry.severity;
      if (entry.condition && entry.condition(queryLower, mo)) finalSeverity = 'emergency';
      matches.push({ entry: entry, score: score, severity: finalSeverity });
    }
  });

  if (matches.length === 0) {
    resultEl.innerHTML = '<div class="sc-result sc-mild"><div class="sc-title">No matching symptoms found</div><div class="sc-section-body">Try describing differently, or tap the chips above. If you\'re concerned, always call your paediatrician.</div>' + _scDoctorCardHTML(false) + '</div>';
    return;
  }

  var SEV_RANK = { emergency: 0, warning: 1, mild: 2 };
  matches.sort(function(a, b) { return (SEV_RANK[a.severity] || 2) - (SEV_RANK[b.severity] || 2) || b.score - a.score; });

  var html = '';
  var shown = matches.slice(0, 2);
  var hasEmergency = shown.some(function(m) { return m.severity === 'emergency'; });

  shown.forEach(function(m) {
    var e = m.entry;
    var sevClass = m.severity === 'emergency' ? 'sc-emergency' : m.severity === 'warning' ? 'sc-warning' : 'sc-mild';
    var sevLabel = m.severity === 'emergency' ? '\u{1F6A8} Emergency' : m.severity === 'warning' ? '\u26A0\uFE0F Monitor closely' : '\u2705 Usually manageable';
    html += '<div class="sc-result ' + sevClass + '">';
    html += '<span class="sc-sev-badge">' + sevLabel + '</span>';
    html += '<div class="sc-title">' + escHtml(e.title) + '</div>';
    html += '<div class="sc-section"><div class="sc-section-title">What to do</div><div class="sc-section-body">' + escHtml(e.whatToDo) + '</div></div>';
    html += '<div class="sc-section"><div class="sc-section-title">Precautions</div><div class="sc-section-body">' + escHtml(e.precautions) + '</div></div>';
    if (e.emergency) {
      html += '<div class="sc-section"><div class="sc-section-title" style="color:' + (m.severity === 'emergency' ? 'var(--tc-danger)' : 'var(--tc-caution)') + ';">\u{1F6A8} When to seek emergency care</div>';
      html += '<div class="sc-section-body fw-600" >' + escHtml(e.emergency) + '</div></div>';
    }
    html += '</div>';
  });

  if (hasEmergency || shown.some(function(m) { return m.entry.callDoctor; })) {
    html += _scDoctorCardHTML(hasEmergency);
  }

  // Track this fever CTA
  var isFeverMatch = shown.some(function(m) { return m.entry.id === 'fever-high' || m.entry.id === 'fever-mild'; });
  if (isFeverMatch && !getActiveFeverEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="closeAndPromptFever" >'+zi('flame')+' Track this fever</button></div>';
  } else if (isFeverMatch && getActiveFeverEpisode()) {
    html += '<div class="fe-center-status">'+zi('flame')+' Fever episode already being tracked</div>';
  }

  // Track this diarrhoea CTA
  var isDiarrhoeaMatch = shown.some(function(m) { return m.entry.id === 'diarrhoea'; });
  if (isDiarrhoeaMatch && !getActiveDiarrhoeaEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="closeAndPromptDiarrhoea" >'+zi('diaper')+' Track this diarrhoea</button></div>';
  } else if (isDiarrhoeaMatch && getActiveDiarrhoeaEpisode()) {
    html += '<div class="fe-center-status">'+zi('diaper')+' Diarrhoea episode already being tracked</div>';
  }

  var isVomitMatch = shown.some(function(m) { return m.entry.id === 'vomiting'; });
  if (isVomitMatch && !getActiveVomitingEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="closeAndPromptVomiting" >'+zi('siren')+' Track this vomiting</button></div>';
  } else if (isVomitMatch && getActiveVomitingEpisode()) {
    html += '<div class="fe-center-status">'+zi('siren')+' Vomiting episode already being tracked</div>';
  }

  var isColdMatch = shown.some(function(m) { return m.entry.id === 'cough-cold'; });
  if (isColdMatch && !getActiveColdEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="closeAndPromptCold" >'+zi('siren')+' Track this cold/cough</button></div>';
  } else if (isColdMatch && getActiveColdEpisode()) {
    html += '<div class="fe-center-status">'+zi('siren')+' Cold episode already being tracked</div>';
  }

  html += '<div style="font-size:var(--fs-xs);color:var(--light);margin-top:10px;line-height:var(--lh-relaxed);font-style:italic;">This is guidance only, not medical advice. When in doubt, always call your paediatrician.</div>';
  resultEl.innerHTML = html;
}

function runHomeFoodQuery() {
  const input = document.getElementById('homeFoodQueryInput');
  const query = input?.value.trim();
  if (!query) return;

  // Reuse the existing checkFoodCombo logic but render into our modal
  const resultEl = document.getElementById('homeFoodQueryResult');
  if (!resultEl) return;

  // Parse foods from query
  const rawFoods = query.split(/[+,&]|with|and/).map(f => f.trim().toLowerCase()).filter(f => f.length > 0);
  const mo = getAgeInMonths();
  const introducedSet = new Set(foods.map(f => f.name.toLowerCase()));

  // Build the result using checkFoodCombo's logic — call it and capture
  document.getElementById('comboInput').value = query;
  checkFoodCombo();
  const comboResultEl = document.getElementById('comboResult');
  let resultHtml = comboResultEl ? comboResultEl.innerHTML : '';

  // Add Ziva's history with this food
  let historyHtml = '';
  rawFoods.forEach(food => {
    const history = getFoodHistory(food);
    if (history) historyHtml += history;
  });

  // Add sleep correlation if available
  let sleepHtml = getFoodSleepCorrelation(rawFoods);

  if (historyHtml) resultHtml += `<div class="combo-section"><div class="combo-section-title">${zi('list')} Ziva's History</div>${historyHtml}</div>`;
  if (sleepHtml) resultHtml += `<div class="combo-section"><div class="combo-section-title">${zi('zzz')} Sleep Connection</div>${sleepHtml}</div>`;

  resultEl.innerHTML = resultHtml;
}

// Get Ziva's history with a specific food — last given, frequency, reaction, poop after
function getFoodHistory(foodName) {
  const lower = foodName.toLowerCase().trim();
  const base = _baseFoodName(lower);

  // Find in foods introduced
  const introduced = foods.find(f => {
    const fb = _baseFoodName(f.name.toLowerCase().trim());
    return fb === base || fb.includes(base) || base.includes(fb);
  });

  // Find last time given in feeding data
  let lastDate = null, lastMeal = null, timesSeen = 0;
  const sortedDates = Object.keys(feedingData).sort().reverse();
  for (const ds of sortedDates) {
    const entry = feedingData[ds];
    if (!entry) continue;
    for (const meal of ['breakfast','lunch','dinner','snack']) {
      if (!isRealMeal(entry[meal])) continue;
      if (entry[meal].toLowerCase().includes(base) || entry[meal].toLowerCase().includes(lower)) {
        timesSeen++;
        if (!lastDate) { lastDate = ds; lastMeal = meal; }
      }
    }
  }

  if (!introduced && !lastDate) return '';

  let html = '<div class="combo-body">';

  if (introduced) {
    const rxLabel = introduced.reaction === 'watch' ? '<span class="t-amber">' + zi('warn') + ' Watch</span>' : '<span class="t-sage">' + zi('check') + ' Fine</span>';
    html += `<div>Introduced: ${formatDate(introduced.date)} · Reaction: ${rxLabel}</div>`;
  } else {
    html += `<div class="t-amber">🆕 Not yet in Foods Introduced list</div>`;
  }

  if (lastDate) {
    const timeStr = feedingData[lastDate]?.[lastMeal + '_time'];
    html += `<div>Last given: ${formatDate(lastDate)} at ${lastMeal}${timeStr ? ' (' + formatTimeShort(timeStr) + ')' : ''} · ${timesSeen}× total</div>`;

    // Check poop after last time
    const nextDay = addDays(lastDate, 1);
    const poopsAfter = poopData.filter(p => p.date === lastDate || p.date === nextDay);
    if (poopsAfter.length > 0) {
      const worst = poopsAfter.reduce((w, p) => {
        const rank = { pellet:0, hard:1, watery:2, loose:3, normal:4, soft:5 };
        return (rank[p.consistency] ?? 5) < (rank[w] ?? 5) ? p.consistency : w;
      }, 'soft');
      const poopOk = worst === 'soft' || worst === 'normal';
      html += `<div>Poop after: ${poopOk ? zi('check') + ' normal' : zi('warn') + ' ' + worst}</div>`;
    }
  }

  html += '</div>';
  return html;
}

// Compute food→sleep correlation for specific foods
function getFoodSleepCorrelation(rawFoods) {
  if (sleepData.length < 5) return '';

  const MEAL_KEYS = ['breakfast','lunch','dinner','snack'];
  const foodLowers = rawFoods.map(f => f.toLowerCase().trim());
  const bases = foodLowers.map(f => _baseFoodName(f));

  // For each night sleep, check if any of the query foods appeared in that day's meals
  let withFood = [], withoutFood = [];

  sleepData.filter(s => s.type === 'night' && s.bedtime && s.wakeTime).forEach(s => {
    const dur = calcSleepDuration(s.bedtime, s.wakeTime);
    if (!dur || dur.total <= 0) return;

    const dayFoods = extractDayFoods(s.date);
    const prevDay = addDays(s.date, -1);
    const prevFoods = extractDayFoods(prevDay);
    const allDayFoods = [...dayFoods, ...prevFoods]; // dinner could be night-before

    const hasFood = bases.some(base =>
      allDayFoods.some(df => df.includes(base) || base.includes(df))
    );

    const nightData = { duration: dur.total, wakeups: s.wakeUps || 0 };
    if (hasFood) withFood.push(nightData);
    else withoutFood.push(nightData);
  });

  if (withFood.length < 2 || withoutFood.length < 2) return '';

  const avgWith = Math.round(withFood.reduce((s, n) => s + n.duration, 0) / withFood.length);
  const avgWithout = Math.round(withoutFood.reduce((s, n) => s + n.duration, 0) / withoutFood.length);
  const wakeWith = +(withFood.reduce((s, n) => s + n.wakeups, 0) / withFood.length).toFixed(1);
  const wakeWithout = +(withoutFood.reduce((s, n) => s + n.wakeups, 0) / withoutFood.length).toFixed(1);

  const diffMin = avgWith - avgWithout;
  const foodLabel = rawFoods.join(' + ');

  let html = '<div class="combo-body">';
  html += `<div>With ${escHtml(foodLabel)}: <strong>${Math.floor(avgWith/60)}h ${avgWith%60}m</strong> avg sleep · ${wakeWith} wakeups <span class="t-light">(${withFood.length} nights)</span></div>`;
  html += `<div>Without: <strong>${Math.floor(avgWithout/60)}h ${avgWithout%60}m</strong> avg · ${wakeWithout} wakeups <span class="t-light">(${withoutFood.length} nights)</span></div>`;

  if (Math.abs(diffMin) >= 15) {
    const better = diffMin > 0;
    html += `<div style="margin-top:4px;color:${better ? 'var(--tc-sage)' : 'var(--tc-amber)'};">
      ${better ? zi('check') : zi('warn')} ${Math.abs(diffMin)} min ${better ? 'longer' : 'shorter'} sleep on days with ${escHtml(foodLabel)}
      ${!better && wakeWith > wakeWithout ? ' · more wakeups too' : ''}
    </div>`;
  } else {
    html += `<div class="t-light" style="margin-top:4px;">No significant sleep difference detected (need more data)</div>`;
  }

  html += '</div>';
  return html;
}

function skipMeals(mealKeys) {
  const dateStr = today();
  if (!feedingData[dateStr]) feedingData[dateStr] = { breakfast:'', lunch:'', dinner:'', snack:'' };
  mealKeys.forEach(m => {
    if (!feedingData[dateStr][m]) feedingData[dateStr][m] = '—skipped—';
  });
  save(KEYS.feeding, feedingData);
  renderHomeMealProgress();
  updateMealSkipButtons();
  showQLToast('⏭️ ' + mealKeys.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ') + ' marked as skipped');
}

function skipSingleMeal(mealKey) {
  const dateStr = document.getElementById('feedingDate')?.value || today();
  if (!feedingData[dateStr]) feedingData[dateStr] = { breakfast:'', lunch:'', dinner:'', snack:'' };

  // If already skipped → unskip
  if (feedingData[dateStr][mealKey] === '—skipped—') {
    unskipSingleMeal(mealKey);
    return;
  }

  if (feedingData[dateStr][mealKey] && feedingData[dateStr][mealKey] !== '—skipped—') return; // already has food
  feedingData[dateStr][mealKey] = '—skipped—';
  save(KEYS.feeding, feedingData);
  const input = document.getElementById('meal-' + mealKey);
  if (input) { input.value = ''; input.placeholder = 'Skipped'; input.disabled = true; }
  const timeInput = document.getElementById('mealtime-' + mealKey);
  if (timeInput) { timeInput.value = ''; timeInput.disabled = true; }
  updateMealSkipButtons();
  renderHomeMealProgress();
  renderDietQuickPicker();
  showQLToast('⏭️ ' + mealKey.charAt(0).toUpperCase() + mealKey.slice(1) + ' skipped');
}

function unskipSingleMeal(mealKey) {
  const dateStr = document.getElementById('feedingDate')?.value || today();
  if (!feedingData[dateStr]) return;
  feedingData[dateStr][mealKey] = '';
  save(KEYS.feeding, feedingData);
  const input = document.getElementById('meal-' + mealKey);
  if (input) { input.value = ''; input.placeholder = 'Type to search foods...'; input.disabled = false; }
  const timeInput = document.getElementById('mealtime-' + mealKey);
  if (timeInput) { timeInput.value = ''; timeInput.disabled = false; }
  updateMealSkipButtons();
  renderHomeMealProgress();
  renderDietQuickPicker();
  showQLToast('↩️ ' + mealKey.charAt(0).toUpperCase() + mealKey.slice(1) + ' unskipped');
}

function updateMealSkipButtons() {
  const dateStr = document.getElementById('feedingDate')?.value || today();
  const isToday = dateStr === today();
  const entry = feedingData[dateStr] || {};
  ['breakfast','lunch','dinner','snack'].forEach(m => {
    const btn = document.getElementById('skip-' + m);
    const input = document.getElementById('meal-' + m);
    if (!btn) return;
    const val = entry[m] || '';
    if (val === '—skipped—') {
      btn.style.display = '';
      btn.textContent = 'skipped ↩';
      btn.classList.add('skipped');
      btn.title = 'Tap to unskip';
      if (input) { input.value = ''; input.placeholder = 'Skipped'; input.disabled = true; }
    } else if (val && val.trim()) {
      btn.style.display = 'none'; // has food, no skip needed
      if (input) input.disabled = false;
    } else {
      btn.style.display = isToday ? '' : 'none'; // show skip only for today's empty meals
      btn.textContent = 'skip';
      btn.classList.remove('skipped');
      if (input) { input.disabled = false; input.placeholder = 'Type to search foods...'; }
    }
  });
}

// ── Expanded same-as pills (yesterday's all meals) ──
function renderQLSameAsPills() {
  const wrap = document.getElementById('qlSameAsWrap');
  const pills = document.getElementById('qlSameAsPills');
  if (!wrap || !pills) return;

  const todayEntry = feedingData[today()] || {};
  const meals = [];
  const seen = new Set();
  function add(label, value) {
    if (value && !seen.has(value)) { meals.push({ label, value }); seen.add(value); }
  }

  // Today's meals
  add(zi('sun')+' Today B', todayEntry.breakfast);
  add(zi('sun')+' Today L', todayEntry.lunch);
  add(zi('moon')+' Today D', todayEntry.dinner);
  add(zi('spoon')+' Today S', todayEntry.snack);

  // Yesterday's meals (all three)
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const ydEntry = feedingData[toDateStr(yd)] || {};
  add(zi('clock')+' Yd B', ydEntry.breakfast);
  add(zi('clock')+' Yd L', ydEntry.lunch);
  add(zi('clock')+' Yd D', ydEntry.dinner);

  if (meals.length === 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';
  pills.innerHTML = meals.map(m =>
    `<button class="btn-ghost" style="font-size:var(--fs-xs);padding:5px 10px;border-radius:var(--r-2xl);" onclick="document.getElementById('qlFeedInput').value='${escHtml(m.value).replace(/'/g, "\\'")}';this.closest('#qlSameAsWrap').style.display='none';">${m.label}</button>`
  ).join('');
}

// Close QL dropdown on blur
document.addEventListener('focusout', function(e) {
  if (e.target && e.target.id === 'qlFeedInput') {
    setTimeout(() => {
      const dd = document.getElementById('qlFeedDropdown');
      if (dd) dd.classList.remove('open');
    }, 200);
  }
});

// Detect mobile keyboard open/close via visualViewport
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const isKeyboard = window.visualViewport.height < window.innerHeight * 0.75;
    document.querySelectorAll('.ql-modal-overlay.open').forEach(overlay => {
      overlay.classList.toggle('ql-keyboard-open', isKeyboard);
    });
  });
}

// ═════════════════════════════════════════
// INTELLIGENCE LAYER v2 — INFO (PRE-ALPHA)
// ═════════════════════════════════════════

// ── FOOD INTELLIGENCE: INTRODUCTION RATE ──

function computeIntroductionRate() {
  if (!foods || !foods.length) return { weeks: [], total: 0, avgPerWeek: 0, trend: 'no data' };

  // Sort foods by date
  const sorted = foods.slice().sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = new Date(sorted[0].date);
  const todayDate = new Date(today());

  // Group by ISO week (Monday-start)
  const weekMap = {}; // weekStartStr → {weekStart, count, foods:[]}
  sorted.forEach(f => {
    const d = new Date(f.date);
    // Get Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const weekKey = toDateStr(monday);
    if (!weekMap[weekKey]) weekMap[weekKey] = { weekStart: weekKey, count: 0, foods: [] };
    weekMap[weekKey].count++;
    weekMap[weekKey].foods.push({ name: f.name, date: f.date, reaction: f.reaction });
  });

  // Build continuous week array (fill gaps with 0)
  const weeks = [];
  const cursor = new Date(firstDate);
  const curDay = cursor.getDay();
  cursor.setDate(cursor.getDate() - curDay + (curDay === 0 ? -6 : 1)); // back to Monday

  while (cursor <= todayDate) {
    const wk = toDateStr(cursor);
    weeks.push(weekMap[wk] || { weekStart: wk, count: 0, foods: [] });
    cursor.setDate(cursor.getDate() + 7);
  }

  const total = sorted.length;
  const avgPerWeek = weeks.length > 0 ? +(total / weeks.length).toFixed(1) : 0;

  // Trend: compare last 2 weeks vs previous 2 weeks
  let trend = 'steady';
  if (weeks.length >= 4) {
    const recent = weeks.slice(-2).reduce((s, w) => s + w.count, 0);
    const prev = weeks.slice(-4, -2).reduce((s, w) => s + w.count, 0);
    if (recent > prev + 1) trend = 'accelerating';
    else if (recent < prev - 1) trend = 'slowing';
  } else if (weeks.length >= 2) {
    const last = weeks[weeks.length - 1].count;
    const prev = weeks[weeks.length - 2].count;
    if (last > prev + 1) trend = 'accelerating';
    else if (last < prev - 1) trend = 'slowing';
  }

  // This week's count
  const thisWeek = weeks.length > 0 ? weeks[weeks.length - 1] : { count: 0, foods: [] };

  return { weeks, total, avgPerWeek, trend, thisWeek };
}

function getUntriedSuggestions(n) {
  n = n || 5;
  const introduced = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const ageM = ageAt().months;

  // Collect all taxonomy foods not yet introduced
  const candidates = [];
  _foodTaxFlat.forEach(item => {
    const key = item.key.toLowerCase().trim();
    if (introduced.has(key)) return;
    // Age gate: skip nuts for <8m (whole), skip honey for <12m
    if (key === 'honey' && ageM < 12) return;
    if (key === 'peanut' && ageM < 8) return;
    if (key === 'whole egg' && ageM < 8) return;

    const group = FOOD_TAX[item.pid];
    const sub = group?.subs?.[item.sid];
    const nutrition = getNutrition(key);

    candidates.push({
      name: item.key,
      group: item.pid,
      groupLabel: group?.label || item.pid,
      subLabel: sub?.label || item.sid,
      nutrients: nutrition?.nutrients || [],
      tags: nutrition?.tags || [],
      reason: null // filled below
    });
  });

  // Compute current nutrient gaps (last 7 days)
  const KEY_NUT = ['iron', 'calcium', 'protein', 'vitamin C', 'fibre', 'vitamin A', 'omega-3', 'zinc'];
  const nutCounts = {};
  KEY_NUT.forEach(n => nutCounts[n] = 0);
  const todayDate = new Date(today());
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayFoods = extractDayFoods(ds);
    dayFoods.forEach(f => {
      const nut = getNutrition(f);
      if (nut?.nutrients) {
        nut.nutrients.forEach(n => { if (nutCounts.hasOwnProperty(n)) nutCounts[n]++; });
      }
    });
  }
  const gaps = KEY_NUT.filter(n => nutCounts[n] < 2); // <2 servings in 7 days = gap

  // Compute food group coverage gaps
  const groupCounts = {};
  Object.keys(FOOD_TAX).forEach(g => groupCounts[g] = 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    extractDayFoods(ds).forEach(f => {
      const cls = classifyFoodToGroup(f);
      if (cls) groupCounts[cls.group]++;
    });
  }
  const groupGaps = Object.keys(FOOD_TAX).filter(g => groupCounts[g] === 0 && g !== 'spices');

  // Score candidates: nutrient gap fill (3pts each), group gap fill (2pts), has nutrition data (1pt)
  candidates.forEach(c => {
    let score = 0;
    const reasons = [];

    // Nutrient gap fill
    const nutFills = c.nutrients.filter(n => gaps.includes(n));
    if (nutFills.length > 0) {
      score += nutFills.length * 3;
      reasons.push('Rich in ' + nutFills.slice(0, 2).join(', ') + ' — gap this week');
    }

    // Group gap fill
    if (groupGaps.includes(c.group)) {
      score += 2;
      if (!reasons.length) reasons.push('No ' + c.groupLabel.toLowerCase() + ' in 7 days');
    }

    // Has known nutrition (we can tell user what it provides)
    if (c.nutrients.length > 0) score += 1;

    // Default reason
    if (!reasons.length) {
      if (c.nutrients.length > 0) reasons.push(c.nutrients.slice(0, 2).join(', '));
      else reasons.push('New ' + c.groupLabel.toLowerCase() + ' to explore');
    }

    c._score = score;
    c.reason = reasons[0];
  });

  // Sort by score desc, take top n
  candidates.sort((a, b) => b._score - a._score);
  return candidates.slice(0, n);
}

// ── RENDER INFO TAB ──

let _infoRendered = false;

// ── SLEEP INTELLIGENCE (Info tab) ──

function _siGetNights(days) {
  const nights = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = sleepData.find(s => s.date === ds && s.type === 'night' && s.bedtime && s.wakeTime);
    if (entry) nights.push({ ...entry, dateStr: ds, dayIndex: i });
  }
  return nights;
}

function _siBedtimeToMin(bt) {
  if (!bt) return null;
  const [h, m] = bt.split(':').map(Number);
  // Normalize: 6PM=0, 7PM=60, midnight=360, 2AM=480
  let min = (h * 60 + m) - 1080; // 18:00 = 0
  if (min < -360) min += 1440; // before 12PM wraps
  return min;
}

function _siMinToBedtime(min) {
  let totalMin = min + 1080; // reverse normalize
  if (totalMin >= 1440) totalMin -= 1440;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function computeBedtimeDrift() {
  const nights = _siGetNights(21);
  if (nights.length < 5) return { insufficient: true, count: nights.length, needed: 5 };

  const points = nights.map(n => ({
    day: n.dayIndex,
    min: _siBedtimeToMin(n.bedtime),
    date: n.dateStr,
    bedtime: n.bedtime
  })).filter(p => p.min !== null).reverse(); // oldest first

  if (points.length < 5) return { insufficient: true, count: points.length, needed: 5 };

  // Linear regression
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  points.forEach((p, i) => { sumX += i; sumY += p.min; sumXY += i * p.min; sumX2 += i * i; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // slope is min/day. Convert to min/week
  const driftPerWeek = Math.round(slope * 7);
  const avgBedtime = sumY / n;
  const direction = driftPerWeek > 3 ? 'later' : driftPerWeek < -3 ? 'earlier' : 'stable';

  // Ideal range from targets
  const st = getSleepTargets(ageAt().months);

  return {
    insufficient: false,
    points,
    slope,
    intercept,
    driftPerWeek,
    avgBedtime,
    avgBedtimeStr: _siMinToBedtime(avgBedtime),
    direction,
    idealStart: st.bedtimeStart,
    idealEnd: st.bedtimeEnd,
    count: points.length
  };
}

function renderInfoSleepBedtimeDrift() {
  const summaryEl = document.getElementById('infoSleepBedtimeDriftSummary');
  const chartEl = document.getElementById('infoSleepBedtimeDriftChart');
  const insightEl = document.getElementById('infoSleepBedtimeDriftInsights');
  if (!summaryEl) return;

  const data = computeBedtimeDrift();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' nights of data (have ' + data.count + ')</div>';
    if (chartEl) chartEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const dirIcon = data.direction === 'later' ? '↗' : data.direction === 'earlier' ? '↙' : '→';
  const dirColor = data.direction === 'stable' ? 'var(--tc-sage)' : 'var(--tc-amber)';
  summaryEl.innerHTML = '<div class="t-sm"><span style="color:' + dirColor + ';font-weight:700;">' + dirIcon + '</span> Avg bedtime: <strong>' + data.avgBedtimeStr + '</strong> · ' +
    (data.direction === 'stable' ? 'Stable' : Math.abs(data.driftPerWeek) + 'min/' + (data.direction === 'later' ? 'week later' : 'week earlier')) + '</div>';

  // SVG dot chart
  if (chartEl) {
    const w = 280, h = 100, pad = 30;
    const pts = data.points;
    const minY = Math.min(...pts.map(p => p.min)) - 15;
    const maxY = Math.max(...pts.map(p => p.min)) + 15;
    const scaleX = (i) => pad + (i / (pts.length - 1)) * (w - 2 * pad);
    const yRange = Math.max(maxY - minY, 1);
    const scaleY = (v) => h - pad - ((v - minY) / yRange) * (h - 2 * pad);

    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:320px;display:block;margin:0 auto;">';

    // Ideal bedtime band
    const idealStartMin = (data.idealStart - 18) * 60;
    const idealEndMin = (data.idealEnd - 18) * 60;
    const bandLow = Math.max(idealStartMin, minY);
    const bandHigh = Math.min(idealEndMin, maxY);
    if (bandHigh > bandLow) {
      svg += '<rect x="' + pad + '" y="' + scaleY(bandHigh) + '" width="' + (w - 2 * pad) + '" height="' + Math.abs(scaleY(bandLow) - scaleY(bandHigh)) + '" fill="rgba(155,168,216,0.1)" rx="3"/>';
    }

    // Trendline
    const trendY0 = scaleY(data.intercept);
    const trendY1 = scaleY(data.intercept + data.slope * (pts.length - 1));
    svg += '<line x1="' + pad + '" y1="' + trendY0 + '" x2="' + (w - pad) + '" y2="' + trendY1 + '" stroke="rgba(155,168,216,0.5)" stroke-width="1.5" stroke-dasharray="4,3"/>';

    // Dots
    pts.forEach((p, i) => {
      svg += '<circle cx="' + scaleX(i) + '" cy="' + scaleY(p.min) + '" r="3.5" fill="var(--tc-indigo)" opacity="0.8"/>';
    });

    // Y-axis labels
    const labelMin = _siMinToBedtime(minY + 10);
    const labelMax = _siMinToBedtime(maxY - 10);
    svg += '<text x="2" y="' + (h - pad + 4) + '" font-size="8" fill="var(--light)">' + labelMin + '</text>';
    svg += '<text x="2" y="' + (pad + 4) + '" font-size="8" fill="var(--light)">' + labelMax + '</text>';

    svg += '</svg>';
    chartEl.innerHTML = svg;
  }

  if (insightEl) {
    let html = '';
    if (data.direction === 'later' && Math.abs(data.driftPerWeek) >= 5) {
      html += '<div class="si-insight si-insight-warn">Bedtime is creeping ' + Math.abs(data.driftPerWeek) + ' min later per week. Try starting the routine 15 minutes earlier.</div>';
    } else if (data.direction === 'stable') {
      html += '<div class="si-insight si-insight-good">Bedtime is consistent — great for sleep quality.</div>';
    } else if (data.direction === 'earlier') {
      html += '<div class="si-insight si-insight-info">Bedtime trending earlier by ~' + Math.abs(data.driftPerWeek) + ' min/week.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Sleep Efficiency ──

function computeSleepEfficiency() {
  const nights = _siGetNights(7);
  if (nights.length < 3) return { insufficient: true, count: nights.length, needed: 3 };

  const results = nights.map(n => {
    const dur = calcSleepDuration(n.bedtime, n.wakeTime);
    const wakes = n.wakeUps || 0;
    const lostMin = wakes * 10;
    const effectiveMin = Math.max(0, dur.total - lostMin);
    const efficiency = dur.total > 0 ? Math.round((effectiveMin / dur.total) * 100) : 0;
    return { dateStr: n.dateStr, totalMin: dur.total, effectiveMin, wakes, efficiency };
  });

  const avgEff = Math.round(results.reduce((s, r) => s + r.efficiency, 0) / results.length);
  const best = results.reduce((a, b) => a.efficiency > b.efficiency ? a : b);
  const worst = results.reduce((a, b) => a.efficiency < b.efficiency ? a : b);
  const prevWeek = _siGetNights(14).slice(7);
  let trend = 'stable';
  if (prevWeek.length >= 3) {
    const prevResults = prevWeek.map(n => {
      const dur = calcSleepDuration(n.bedtime, n.wakeTime);
      const lostMin = (n.wakeUps || 0) * 10;
      return dur.total > 0 ? Math.round(((dur.total - lostMin) / dur.total) * 100) : 0;
    });
    const prevAvg = Math.round(prevResults.reduce((s, v) => s + v, 0) / prevResults.length);
    if (avgEff > prevAvg + 3) trend = 'improving';
    else if (avgEff < prevAvg - 3) trend = 'declining';
  }

  return { insufficient: false, results: results.reverse(), avgEff, best, worst, trend, count: results.length };
}

function renderInfoSleepEfficiency() {
  const summaryEl = document.getElementById('infoSleepEfficiencySummary');
  const barsEl = document.getElementById('infoSleepEfficiencyBars');
  const insightEl = document.getElementById('infoSleepEfficiencyInsights');
  if (!summaryEl) return;

  const data = computeSleepEfficiency();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' nights of data (have ' + data.count + ')</div>';
    if (barsEl) barsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const trendIcon = data.trend === 'improving' ? '↑' : data.trend === 'declining' ? '↓' : '→';
  summaryEl.innerHTML = '<div class="t-sm">Avg efficiency: <strong>' + data.avgEff + '%</strong> (last ' + data.count + ' nights) <span style="color:' + (data.trend === 'declining' ? 'var(--tc-amber)' : 'var(--tc-sage)') + ';font-weight:600;">' + trendIcon + '</span></div>';

  if (barsEl) {
    let html = '';
    data.results.forEach(r => {
      const color = r.efficiency >= 85 ? 'var(--tc-sage)' : r.efficiency >= 70 ? 'var(--tc-amber)' : 'var(--tc-danger)';
      const dayLabel = formatDate(r.dateStr).slice(0, 6);
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + dayLabel + '</div>';
      html += '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + r.efficiency + '%;background:' + color + ';"></div></div>';
      html += '<div class="si-bar-val" style="color:' + color + ';">' + r.efficiency + '%</div>';
      html += '</div>';
    });
    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val t-sage" >' + data.best.efficiency + '%</div><div class="si-stat-label">Best night</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val t-amber" >' + data.worst.efficiency + '%</div><div class="si-stat-label">Worst night</div></div>';
    html += '</div>';
    barsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.avgEff < 80) {
      html += '<div class="si-insight si-insight-warn">Frequent wake-ups are reducing sleep quality. Check for teething, hunger, or room temperature.</div>';
    } else if (data.avgEff >= 90) {
      html += '<div class="si-insight si-insight-good">Excellent sleep efficiency — Ziva is sleeping through most of the night.</div>';
    } else {
      html += '<div class="si-insight si-insight-info">Sleep efficiency is in the normal range. Fewer wake-ups would push it higher.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Wake Windows ──

function computeWakeWindows() {
  // Get days with both nap and night data
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayEntries = sleepData.filter(s => s.date === ds && s.bedtime && s.wakeTime);
    if (dayEntries.length === 0) continue;
    // Also check previous night (wakeTime carries into this day)
    const prevD = new Date(d); prevD.setDate(prevD.getDate() - 1);
    const prevDs = toDateStr(prevD);
    const prevNight = sleepData.find(s => s.date === prevDs && s.type === 'night' && s.wakeTime);

    const naps = dayEntries.filter(s => s.type === 'nap').sort((a, b) => a.bedtime.localeCompare(b.bedtime));
    const tonight = dayEntries.find(s => s.type === 'night');

    if (naps.length === 0 && !tonight) continue;

    // Build wake windows: gaps between end of one sleep and start of next
    const sleepBlocks = [];
    if (prevNight) sleepBlocks.push({ type: 'night', wake: prevNight.wakeTime, bed: prevNight.bedtime });
    naps.forEach(n => sleepBlocks.push({ type: 'nap', wake: n.wakeTime, bed: n.bedtime }));
    if (tonight) sleepBlocks.push({ type: 'night', wake: tonight.wakeTime, bed: tonight.bedtime });

    const windows = [];
    for (let j = 0; j < sleepBlocks.length - 1; j++) {
      const wakeTime = sleepBlocks[j].wake;
      const nextBed = sleepBlocks[j + 1].bed;
      if (!wakeTime || !nextBed) continue;
      const [wh, wm] = wakeTime.split(':').map(Number);
      const [bh, bm] = nextBed.split(':').map(Number);
      let wakeMin = wh * 60 + wm;
      let bedMin = bh * 60 + bm;
      if (bedMin < wakeMin) bedMin += 1440; // overnight
      const gapMin = bedMin - wakeMin;
      if (gapMin > 0 && gapMin < 720) { // reasonable range
        windows.push({ fromWake: wakeTime, toBed: nextBed, gapMin, isLast: j === sleepBlocks.length - 2 });
      }
    }

    if (windows.length > 0) {
      days.push({ dateStr: ds, windows, naps: naps.length, sleepBlocks });
    }
  }

  if (days.length < 3) return { insufficient: true, count: days.length, needed: 3 };

  const ageM = ageAt().months;
  // Age-appropriate ideal wake windows (minutes)
  let idealMin, idealMax;
  if (ageM <= 6) { idealMin = 120; idealMax = 150; }
  else if (ageM <= 9) { idealMin = 135; idealMax = 180; }
  else if (ageM <= 12) { idealMin = 150; idealMax = 210; }
  else { idealMin = 180; idealMax = 300; }

  const allWindows = days.flatMap(d => d.windows);
  const avgGap = Math.round(allWindows.reduce((s, w) => s + w.gapMin, 0) / allWindows.length);
  const lastWindows = allWindows.filter(w => w.isLast);
  const avgLastGap = lastWindows.length > 0 ? Math.round(lastWindows.reduce((s, w) => s + w.gapMin, 0) / lastWindows.length) : avgGap;

  const overtiredCount = allWindows.filter(w => w.gapMin > idealMax + 30).length;
  const undertiredCount = allWindows.filter(w => w.gapMin < idealMin - 30).length;

  return {
    insufficient: false, days, allWindows, avgGap, avgLastGap,
    idealMin, idealMax, overtiredCount, undertiredCount,
    today: days.find(d => d.dateStr === today()),
    count: days.length
  };
}

function renderInfoSleepWakeWindows() {
  const summaryEl = document.getElementById('infoSleepWakeWindowsSummary');
  const timelineEl = document.getElementById('infoSleepWakeWindowsTimeline');
  const insightEl = document.getElementById('infoSleepWakeWindowsInsights');
  if (!summaryEl) return;

  const data = computeWakeWindows();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' days with nap+night data (have ' + data.count + ')</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const idealStr = Math.floor(data.idealMin / 60) + 'h ' + (data.idealMin % 60) + 'm–' + Math.floor(data.idealMax / 60) + 'h ' + (data.idealMax % 60) + 'm';
  const avgH = Math.floor(data.avgGap / 60);
  const avgM = data.avgGap % 60;
  const inRange = data.avgGap >= data.idealMin && data.avgGap <= data.idealMax;
  summaryEl.innerHTML = '<div class="t-sm">Avg wake window: <strong>' + avgH + 'h ' + avgM + 'm</strong> ' +
    '<span style="color:' + (inRange ? 'var(--tc-sage)' : 'var(--tc-amber)') + ';">(ideal: ' + idealStr + ')</span></div>';

  if (timelineEl) {
    let html = '';
    // Show today's wake windows as a visual timeline
    const showDay = data.today || data.days[0];
    if (showDay) {
      html += '<div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:var(--sp-4);">' + formatDate(showDay.dateStr) + '</div>';
      html += '<div class="si-ww-segment">';
      showDay.sleepBlocks.forEach((b, i) => {
        // Sleep block
        const dur = calcSleepDuration(b.bed, b.wake);
        html += '<div class="si-ww-block si-ww-sleep" title="Sleep">' + (b.type === 'night' ? zi('moon') : zi('zzz')) + '<span>' + dur.h + 'h' + (dur.m > 0 ? dur.m : '') + '</span></div>';
        // Wake window after this block (if not last)
        if (i < showDay.windows.length) {
          const ww = showDay.windows[i];
          const wwH = Math.floor(ww.gapMin / 60);
          const wwM = ww.gapMin % 60;
          const wwColor = ww.gapMin > data.idealMax ? 'rgba(240,180,80,0.15)' : ww.gapMin < data.idealMin ? 'rgba(155,168,216,0.15)' : 'rgba(58,112,96,0.1)';
          const wwTextColor = ww.gapMin > data.idealMax ? 'var(--tc-amber)' : ww.gapMin < data.idealMin ? 'var(--tc-indigo)' : 'var(--tc-sage)';
          html += '<div class="si-ww-block si-ww-wake" style="background:' + wwColor + ';color:' + wwTextColor + ';">'+zi('sun')+'<span>' + wwH + 'h' + (wwM > 0 ? wwM : '') + '</span></div>';
        }
      });
      html += '</div>';
    }

    // Stats
    html += '<div class="si-stat-grid">';
    const avgLastH = Math.floor(data.avgLastGap / 60);
    const avgLastM = data.avgLastGap % 60;
    html += '<div class="si-stat"><div class="si-stat-val">' + avgH + 'h ' + avgM + 'm</div><div class="si-stat-label">Avg window</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + avgLastH + 'h ' + avgLastM + 'm</div><div class="si-stat-label">Avg last window</div></div>';
    html += '</div>';
    timelineEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.avgLastGap > data.idealMax + 30) {
      html += '<div class="si-insight si-insight-warn">Last wake window before bed is too long (' + Math.floor(data.avgLastGap / 60) + 'h ' + (data.avgLastGap % 60) + 'm). Try fitting an extra nap or moving bedtime earlier.</div>';
    }
    if (data.overtiredCount >= 3) {
      html += '<div class="si-insight si-insight-warn">' + data.overtiredCount + ' overtired windows detected this week — may cause harder settling.</div>';
    }
    if (data.overtiredCount === 0 && data.undertiredCount === 0 && inRange) {
      html += '<div class="si-insight si-insight-good">Wake windows are well-timed for Ziva\'s age. Nice work.</div>';
    }
    if (data.undertiredCount >= 3) {
      html += '<div class="si-insight si-insight-info">' + data.undertiredCount + ' short wake windows — Ziva may not be tired enough, which can cause nap refusal.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Weekly Report Card ──

function computeSleepReport() {
  const scores = [];
  const details = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const sc = getDailySleepScore(ds);
    if (sc) {
      scores.push(sc.score);
      details.push({ dateStr: ds, ...sc });
    }
  }
  if (scores.length < 3) return { insufficient: true, count: scores.length, needed: 3 };

  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const best = details.reduce((a, b) => a.score > b.score ? a : b);
  const worst = details.reduce((a, b) => a.score < b.score ? a : b);

  // Previous week for comparison
  const prevScores = [];
  for (let i = 7; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const sc = getDailySleepScore(toDateStr(d));
    if (sc) prevScores.push(sc.score);
  }
  const prevAvg = prevScores.length >= 3 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : null;

  // Avg total sleep, naps, wakes
  const avgTotalMin = details.length > 0 ? Math.round(details.reduce((s, d) => s + (d.totalMin || 0), 0) / details.length) : 0;
  const avgNaps = details.length > 0 ? (details.reduce((s, d) => s + (d.napCount || 0), 0) / details.length).toFixed(1) : '0';
  const avgWakes = details.length > 0 ? (details.reduce((s, d) => s + (d.wakes || 0), 0) / details.length).toFixed(1) : '0';

  // Bedtime consistency (std dev of bedtimes)
  const nights = _siGetNights(7);
  const bedtimeMins = nights.map(n => _siBedtimeToMin(n.bedtime)).filter(m => m !== null);
  let bedtimeStdDev = 0;
  if (bedtimeMins.length >= 3) {
    const mean = bedtimeMins.reduce((a, b) => a + b, 0) / bedtimeMins.length;
    bedtimeStdDev = Math.round(Math.sqrt(bedtimeMins.reduce((s, v) => s + (v - mean) * (v - mean), 0) / bedtimeMins.length));
  }

  // Weakest component
  let weakest = '';
  const avgWakeNum = parseFloat(avgWakes);
  if (avgWakeNum >= 2.5) weakest = 'Wake-ups are the biggest drag on your score';
  else if (avgTotalMin < 720) weakest = 'Total sleep duration is below target';
  else if (bedtimeStdDev > 30) weakest = 'Inconsistent bedtime is affecting scores';

  return {
    insufficient: false, avgScore, best, worst, prevAvg, details,
    avgTotalMin, avgNaps, avgWakes, bedtimeStdDev, weakest,
    count: scores.length
  };
}

function renderInfoSleepReport() {
  const summaryEl = document.getElementById('infoSleepReportSummary');
  const detailsEl = document.getElementById('infoSleepReportDetails');
  const insightEl = document.getElementById('infoSleepReportInsights');
  if (!summaryEl) return;

  const data = computeSleepReport();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' days of data (have ' + data.count + ')</div>';
    if (detailsEl) detailsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const lbl = getScoreLabel(data.avgScore);
  const delta = data.prevAvg !== null ? data.avgScore - data.prevAvg : null;
  const trendText = delta !== null ? (delta > 2 ? '↑ +' + delta + ' vs last week' : delta < -2 ? '↓ ' + delta + ' vs last week' : '→ stable') : '';
  const trendColor = delta !== null && delta < -2 ? 'var(--tc-danger)' : 'var(--tc-sage)';
  summaryEl.innerHTML = '<div class="t-sm">Sleep score: <strong>' + data.avgScore + '/100</strong> — ' + lbl.text +
    (trendText ? ' <span style="color:' + trendColor + ';font-weight:600;">' + trendText + '</span>' : '') + '</div>';

  if (detailsEl) {
    let html = '<div class="si-report-hero">';

    // Score ring (Ziva Score style)
    const ringClass = 'zs-score-' + lbl.label;
    html += '<div class="si-report-ring ' + ringClass + '" style="background:' + _siRingBg(lbl.label) + ';border-color:' + _siRingBorder(lbl.label) + ';">';
    html += '<div class="si-report-number" style="color:' + _siRingText(lbl.label) + ';">' + data.avgScore + '</div>';
    html += '<div class="si-report-label" style="color:' + _siRingText(lbl.label) + ';">' + lbl.text + '</div>';
    html += '</div>';

    // Stats column
    html += '<div class="si-report-stats">';
    const totalH = Math.floor(data.avgTotalMin / 60);
    const totalM = data.avgTotalMin % 60;
    html += '<div style="font-size:var(--fs-xs);color:var(--mid);line-height:1.6;">';
    html += '' + zi('zzz') + ' Avg total: <strong>' + totalH + 'h ' + totalM + 'm</strong><br>';
    html += '' + zi('zzz') + ' Avg naps: <strong>' + data.avgNaps + '</strong>/day<br>';
    html += '⏰ Wake-ups: <strong>' + data.avgWakes + '</strong>/night<br>';
    html += '' + zi('clock') + ' Bedtime ±' + data.bedtimeStdDev + 'min';
    html += '</div>';

    // Mini sparkline
    html += '<div class="si-sparkline mt-8" >';
    const maxScore = Math.max(...data.details.map(d => d.score), 1);
    data.details.slice().reverse().forEach(d => {
      const pct = Math.round((d.score / 100) * 100);
      const color = d.score >= 70 ? 'var(--tc-sage)' : d.score >= 40 ? 'var(--tc-amber)' : 'var(--tc-danger)';
      html += '<div class="si-spark-bar" style="height:' + Math.max(4, pct) + '%;background:' + color + ';" title="' + formatDate(d.dateStr) + ': ' + d.score + '"></div>';
    });
    html += '</div>';
    html += '</div></div>';

    // Best/worst
    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val t-sage" >' + data.best.score + '</div><div class="si-stat-label">Best: ' + formatDate(data.best.dateStr).slice(0, 6) + '</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val t-amber" >' + data.worst.score + '</div><div class="si-stat-label">Worst: ' + formatDate(data.worst.dateStr).slice(0, 6) + '</div></div>';
    html += '</div>';
    detailsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.weakest) {
      html += '<div class="si-insight si-insight-warn">' + data.weakest + ' this week.</div>';
    }
    if (data.avgScore >= 75) {
      html += '<div class="si-insight si-insight-good">Strong sleep week — keep the routine consistent.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// Ring color helpers (match Ziva Score ring styling)
function _siRingBg(label) {
  const m = { excellent:'linear-gradient(135deg,#d4f5e0,#b8eacc)', great:'linear-gradient(135deg,#e0f0fa,#cce5f5)', good:'linear-gradient(135deg,#fef6e8,#fcecd0)', fair:'linear-gradient(135deg,#fef0e0,#fce0c0)', attention:'linear-gradient(135deg,#fde8ed,#f8d0d8)' };
  return m[label] || m.good;
}
function _siRingBorder(label) {
  const m = { excellent:'#6fcf97', great:'#7fb8d8', good:'#e8c86d', fair:'#e8a050', attention:'var(--tc-danger)' };
  return m[label] || m.good;
}
function _siRingText(label) {
  const m = { excellent:'#1a7a42', great:'#2a6a8a', good:'#8a6520', fair:'#8a5020', attention:'#a03030' };
  return m[label] || m.good;
}

// ── Nap Transition Readiness ──

function computeNapTransition() {
  const ageM = ageAt().months;
  const st = getSleepTargets(ageM);
  const [napMin, napMax] = st.napIdeal;

  // Gather 14 days of data
  const dayData = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const naps = sleepData.filter(s => s.date === ds && s.type === 'nap');
    const night = sleepData.find(s => s.date === ds && s.type === 'night');
    dayData.push({ dateStr: ds, naps, night, napCount: naps.length });
  }

  const daysWithData = dayData.filter(d => d.naps.length > 0 || d.night);
  if (daysWithData.length < 7) return { insufficient: true, count: daysWithData.length, needed: 7 };

  const avgNaps = dayData.reduce((s, d) => s + d.napCount, 0) / 14;

  // Signal 1: Nap count dropping below target
  const lowNapDays = dayData.filter(d => d.napCount < napMin && (d.naps.length > 0 || d.night)).length;
  const napCountDrop = lowNapDays >= 4;

  // Signal 2: Short naps (<30min) increasing
  const allNaps = dayData.flatMap(d => d.naps);
  const shortNaps = allNaps.filter(n => {
    const dur = calcSleepDuration(n.bedtime, n.wakeTime);
    return dur.total < 30;
  });
  const shortNapRate = allNaps.length > 0 ? shortNaps.length / allNaps.length : 0;
  const shortNapsRising = shortNapRate > 0.3;

  // Signal 3: Bedtime pushing later
  const drift = computeBedtimeDrift();
  const bedtimeLater = !drift.insufficient && drift.direction === 'later' && Math.abs(drift.driftPerWeek) >= 5;

  // Signal 4: Last nap ending later (>4:30PM avg)
  const lastNapEnds = [];
  dayData.forEach(d => {
    if (d.naps.length > 0) {
      const sorted = d.naps.slice().sort((a, b) => b.wakeTime.localeCompare(a.wakeTime));
      const [h, m] = sorted[0].wakeTime.split(':').map(Number);
      lastNapEnds.push(h * 60 + m);
    }
  });
  const avgLastNapEnd = lastNapEnds.length > 0 ? lastNapEnds.reduce((a, b) => a + b, 0) / lastNapEnds.length : 0;
  const lateLastNap = avgLastNapEnd > 16.5 * 60; // after 4:30 PM

  // Signal 5: Fighting/refusing naps (days with 0 naps when > 6 months)
  const napRefusalDays = dayData.filter(d => d.napCount === 0 && d.night).length;
  const napRefusal = napRefusalDays >= 3 && ageM >= 8;

  const signals = [
    { label: 'Nap count below target', met: napCountDrop, detail: lowNapDays + '/14 days below ' + napMin + ' naps' },
    { label: 'Short naps increasing', met: shortNapsRising, detail: Math.round(shortNapRate * 100) + '% of naps <30min' },
    { label: 'Bedtime drifting later', met: bedtimeLater, detail: drift.insufficient ? 'Not enough data' : (drift.driftPerWeek > 0 ? '+' + drift.driftPerWeek + 'min/week' : 'Stable') },
    { label: 'Last nap ending late', met: lateLastNap, detail: lastNapEnds.length > 0 ? 'Avg end: ' + Math.floor(avgLastNapEnd / 60) + ':' + String(Math.round(avgLastNapEnd % 60)).padStart(2, '0') : 'No data' },
    { label: 'Nap refusal days', met: napRefusal, detail: napRefusalDays + ' days with 0 naps' }
  ];

  const metCount = signals.filter(s => s.met).length;
  const readiness = Math.round((metCount / signals.length) * 100);

  // Typical transition age
  let transitionNote = '';
  if (ageM < 12) transitionNote = 'Most babies transition from 2 to 1 nap between 12–18 months. At ' + ageM + ' months, Ziva is not expected to be ready yet.';
  else if (ageM <= 18) transitionNote = 'Ziva is in the typical transition window (12–18 months). Watch these signals closely.';
  else transitionNote = 'At ' + ageM + ' months, Ziva may be ready if signals align.';

  return {
    insufficient: false, signals, metCount, readiness,
    avgNaps: avgNaps.toFixed(1), transitionNote, ageM,
    count: daysWithData.length
  };
}

function renderInfoSleepNapTransition() {
  const summaryEl = document.getElementById('infoSleepNapTransitionSummary');
  const checklistEl = document.getElementById('infoSleepNapTransitionChecklist');
  const insightEl = document.getElementById('infoSleepNapTransitionInsights');
  if (!summaryEl) return;

  const data = computeNapTransition();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' days of data (have ' + data.count + ')</div>';
    if (checklistEl) checklistEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const statusText = data.metCount <= 1 ? 'Not ready' : data.metCount <= 3 ? 'Some signals' : 'Approaching';
  const statusColor = data.metCount <= 1 ? 'var(--tc-sage)' : data.metCount <= 3 ? 'var(--tc-amber)' : 'var(--tc-caution)';
  summaryEl.innerHTML = '<div class="t-sm"><span style="color:' + statusColor + ';font-weight:700;">' + statusText + '</span> — ' + data.metCount + '/5 transition signals · Avg ' + data.avgNaps + ' naps/day</div>';

  if (checklistEl) {
    let html = '';
    data.signals.forEach(s => {
      html += '<div class="si-check-row">';
      html += '<div class="si-check-icon">' + (s.met ? zi('check') : zi('warn')) + '</div>';
      html += '<div class="si-check-text">' + s.label + '</div>';
      html += '<div class="si-check-status" style="color:' + (s.met ? 'var(--tc-amber)' : 'var(--light)') + ';">' + s.detail + '</div>';
      html += '</div>';
    });

    // Readiness bar
    const barColor = data.readiness <= 20 ? 'var(--tc-sage)' : data.readiness <= 60 ? 'var(--tc-amber)' : 'var(--tc-caution)';
    html += '<div class="si-readiness-bar"><div class="si-readiness-fill" style="width:' + data.readiness + '%;background:' + barColor + ';"></div></div>';
    html += '<div style="font-size:var(--fs-2xs);color:var(--light);text-align:center;">Readiness: ' + data.readiness + '%</div>';
    checklistEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '<div class="si-insight si-insight-info">' + data.transitionNote + '</div>';
    insightEl.innerHTML = html;
  }
}

// ── Day-Night Nap Correlation ──

function computeDayNightCorrelation() {
  // Gather 21 days: for each day, get nap stats + that night's sleep quality
  const dayPairs = [];
  for (let i = 0; i < 21; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const naps = sleepData.filter(s => s.date === ds && s.type === 'nap' && s.bedtime && s.wakeTime);
    const night = sleepData.find(s => s.date === ds && s.type === 'night' && s.bedtime && s.wakeTime);
    if (!night || naps.length === 0) continue;

    let napTotalMin = 0;
    naps.forEach(n => { napTotalMin += calcSleepDuration(n.bedtime, n.wakeTime).total; });
    const nightDur = calcSleepDuration(night.bedtime, night.wakeTime);
    const wakes = getWakeCount(night);
    const nightScore = getDailySleepScore(ds);
    if (!nightScore) continue;

    // Last nap end → bedtime gap
    const sortedNaps = naps.slice().sort((a, b) => b.wakeTime.localeCompare(a.wakeTime));
    const lastNapEnd = sortedNaps[0].wakeTime;
    const [lnh, lnm] = lastNapEnd.split(':').map(Number);
    const [bh, bm] = night.bedtime.split(':').map(Number);
    let lastGapMin = (bh * 60 + bm) - (lnh * 60 + lnm);
    if (lastGapMin < 0) lastGapMin += 1440;

    dayPairs.push({
      dateStr: ds, napCount: naps.length, napTotalMin,
      nightMin: nightDur.total, wakes, score: nightScore.score,
      lastGapMin
    });
  }

  if (dayPairs.length < 5) return { insufficient: true, count: dayPairs.length, needed: 5 };

  // Bucket by nap count
  const napBuckets = {};
  dayPairs.forEach(p => {
    if (!napBuckets[p.napCount]) napBuckets[p.napCount] = [];
    napBuckets[p.napCount].push(p);
  });

  const bucketStats = Object.keys(napBuckets).sort((a, b) => a - b).map(k => {
    const items = napBuckets[k];
    const avgScore = Math.round(items.reduce((s, p) => s + p.score, 0) / items.length);
    const avgWakes = (items.reduce((s, p) => s + p.wakes, 0) / items.length).toFixed(1);
    const avgNapMin = Math.round(items.reduce((s, p) => s + p.napTotalMin, 0) / items.length);
    return { napCount: parseInt(k), days: items.length, avgScore, avgWakes, avgNapMin };
  });

  // Optimal nap count (highest avg score with >=2 data points)
  const validBuckets = bucketStats.filter(b => b.days >= 2);
  const optimal = validBuckets.length > 0 ? validBuckets.reduce((a, b) => a.avgScore > b.avgScore ? a : b) : null;

  // Nap duration sweet spot: bucket by 30-min bands
  const durBands = {};
  dayPairs.forEach(p => {
    const band = Math.floor(p.napTotalMin / 30) * 30;
    const label = band < 30 ? '<30m' : band < 60 ? '30m' : Math.floor(band / 60) + 'h' + (band % 60 > 0 ? band % 60 + 'm' : '');
    if (!durBands[band]) durBands[band] = { label, scores: [] };
    durBands[band].scores.push(p.score);
  });
  const bandStats = Object.keys(durBands).sort((a, b) => a - b).map(k => {
    const b = durBands[k];
    return { band: parseInt(k), label: b.label, avgScore: Math.round(b.scores.reduce((a, c) => a + c, 0) / b.scores.length), days: b.scores.length };
  });
  const bestBand = bandStats.filter(b => b.days >= 2).reduce((a, b) => (a && a.avgScore >= b.avgScore) ? a : b, null);

  // Last-gap correlation: short vs long gap
  const avgGap = Math.round(dayPairs.reduce((s, p) => s + p.lastGapMin, 0) / dayPairs.length);
  const shortGap = dayPairs.filter(p => p.lastGapMin < avgGap);
  const longGap = dayPairs.filter(p => p.lastGapMin >= avgGap);
  const shortAvgScore = shortGap.length > 0 ? Math.round(shortGap.reduce((s, p) => s + p.score, 0) / shortGap.length) : 0;
  const longAvgScore = longGap.length > 0 ? Math.round(longGap.reduce((s, p) => s + p.score, 0) / longGap.length) : 0;

  return {
    insufficient: false, dayPairs, bucketStats, optimal,
    bandStats, bestBand, avgGap, shortAvgScore, longAvgScore,
    count: dayPairs.length
  };
}

function renderInfoSleepDayNight() {
  const summaryEl = document.getElementById('infoSleepDayNightSummary');
  const chartEl = document.getElementById('infoSleepDayNightChart');
  const insightEl = document.getElementById('infoSleepDayNightInsights');
  if (!summaryEl) return;

  const data = computeDayNightCorrelation();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' days with nap+night data (have ' + data.count + ')</div>';
    if (chartEl) chartEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  // Summary
  const optText = data.optimal ? data.optimal.napCount + ' nap' + (data.optimal.napCount !== 1 ? 's' : '') + ' → avg score ' + data.optimal.avgScore : 'No clear pattern';
  summaryEl.innerHTML = '<div class="t-sm">Best nights follow <strong>' + optText + '</strong> · ' + data.count + ' days analyzed</div>';

  if (chartEl) {
    let html = '';

    // Nap count → night score bars
    html += '<div class="si-sub-label mb-4" >Nap count vs night score</div>';
    data.bucketStats.forEach(b => {
      const color = b.avgScore >= 70 ? 'var(--tc-sage)' : b.avgScore >= 40 ? 'var(--tc-amber)' : 'var(--tc-danger)';
      const isOpt = data.optimal && b.napCount === data.optimal.napCount;
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + b.napCount + ' nap' + (b.napCount !== 1 ? 's' : '') + '</div>';
      html += '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + b.avgScore + '%;background:' + color + ';' + (isOpt ? 'box-shadow:0 0 0 2px ' + color + ';' : '') + '"></div></div>';
      html += '<div class="si-bar-val" style="color:' + color + ';">' + b.avgScore + '</div>';
      html += '</div>';
    });

    // Nap duration bands
    if (data.bandStats.length > 1) {
      html += '<div class="si-sub-label fe-section-gap" >Nap duration vs night score</div>';
      data.bandStats.forEach(b => {
        const color = b.avgScore >= 70 ? 'var(--tc-sage)' : b.avgScore >= 40 ? 'var(--tc-amber)' : 'var(--tc-danger)';
        const isBest = data.bestBand && b.band === data.bestBand.band;
        html += '<div class="si-bar-row">';
        html += '<div class="si-bar-label">' + b.label + '</div>';
        html += '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + b.avgScore + '%;background:' + color + ';' + (isBest ? 'box-shadow:0 0 0 2px ' + color + ';' : '') + '"></div></div>';
        html += '<div class="si-bar-val" style="color:' + color + ';">' + b.avgScore + ' <span style="font-size:var(--fs-2xs);color:var(--light);font-weight:400;">(' + b.days + 'd)</span></div>';
        html += '</div>';
      });
    }

    // Last gap stat
    html += '<div class="si-stat-grid" style="margin-top:var(--sp-12);">';
    const gapH = Math.floor(data.avgGap / 60);
    const gapM = data.avgGap % 60;
    html += '<div class="si-stat"><div class="si-stat-val">' + gapH + 'h ' + gapM + 'm</div><div class="si-stat-label">Avg last-nap gap</div></div>';
    const gapDelta = data.longAvgScore - data.shortAvgScore;
    const gapColor = Math.abs(gapDelta) < 5 ? 'var(--light)' : gapDelta > 0 ? 'var(--tc-sage)' : 'var(--tc-amber)';
    html += '<div class="si-stat"><div class="si-stat-val" style="color:' + gapColor + ';">' + (gapDelta > 0 ? '+' : '') + gapDelta + '</div><div class="si-stat-label">Longer gap effect</div></div>';
    html += '</div>';

    chartEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.optimal && data.bucketStats.length > 1) {
      const others = data.bucketStats.filter(b => b.napCount !== data.optimal.napCount && b.days >= 2);
      if (others.length > 0) {
        const worstBucket = others.reduce((a, b) => a.avgScore < b.avgScore ? a : b);
        const delta = data.optimal.avgScore - worstBucket.avgScore;
        if (delta >= 10) {
          html += '<div class="si-insight si-insight-good">' + data.optimal.napCount + ' nap' + (data.optimal.napCount !== 1 ? 's' : '') + ' produce night scores ' + delta + ' points higher than ' + worstBucket.napCount + ' nap' + (worstBucket.napCount !== 1 ? 's' : '') + '.</div>';
        }
      }
    }
    if (data.bestBand) {
      html += '<div class="si-insight si-insight-info">Best nights follow ~' + data.bestBand.label + ' of total daytime nap (avg score ' + data.bestBand.avgScore + ').</div>';
    }
    const gapDelta = data.longAvgScore - data.shortAvgScore;
    if (gapDelta >= 8) {
      html += '<div class="si-insight si-insight-info">A longer gap between last nap and bedtime correlates with better nights (+' + gapDelta + ' pts).</div>';
    } else if (gapDelta <= -8) {
      html += '<div class="si-insight si-insight-warn">A longer gap before bed is linked to worse sleep (' + gapDelta + ' pts). Ziva may be getting overtired.</div>';
    }
    if (!html) {
      html = '<div class="si-insight si-insight-info">No strong pattern yet — more data will reveal nap-night correlations.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Best Night Predictor ──

function computeBestNightPredictor() {
  // Gather 30 days of multi-factor data
  const nightData = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const night = sleepData.find(s => s.date === ds && s.type === 'night' && s.bedtime && s.wakeTime);
    if (!night) continue;

    const sc = getDailySleepScore(ds);
    if (!sc) continue;

    const naps = sleepData.filter(s => s.date === ds && s.type === 'nap' && s.bedtime && s.wakeTime);
    let napTotalMin = 0;
    naps.forEach(n => { napTotalMin += calcSleepDuration(n.bedtime, n.wakeTime).total; });

    // Bedtime in normalized minutes
    const btMin = _siBedtimeToMin(night.bedtime);

    // Dinner foods
    const feedEntry = feedingData[ds];
    const dinnerFoods = feedEntry && feedEntry.dinner ? feedEntry.dinner.split(',').map(f => normalizeFoodName(f.trim()).toLowerCase()).filter(Boolean) : [];
    const hasDinner = dinnerFoods.length > 0;

    // Last nap gap
    let lastGapMin = null;
    if (naps.length > 0) {
      const sortedNaps = naps.slice().sort((a, b) => b.wakeTime.localeCompare(a.wakeTime));
      const [lnh, lnm] = sortedNaps[0].wakeTime.split(':').map(Number);
      const [bh, bm] = night.bedtime.split(':').map(Number);
      let gap = (bh * 60 + bm) - (lnh * 60 + lnm);
      if (gap < 0) gap += 1440;
      if (gap > 0 && gap < 720) lastGapMin = gap;
    }

    nightData.push({
      dateStr: ds, score: sc.score, napCount: naps.length,
      napTotalMin, btMin, dinnerFoods, hasDinner, lastGapMin,
      wakes: getWakeCount(night)
    });
  }

  if (nightData.length < 7) return { insufficient: true, count: nightData.length, needed: 7 };

  const avgScore = Math.round(nightData.reduce((s, n) => s + n.score, 0) / nightData.length);

  // Split into good (above avg) and bad (below avg) nights
  const goodNights = nightData.filter(n => n.score >= avgScore + 5);
  const badNights = nightData.filter(n => n.score < avgScore - 5);

  const factors = [];

  // Factor 1: Bedtime range
  const goodBtMins = goodNights.filter(n => n.btMin !== null).map(n => n.btMin);
  const badBtMins = badNights.filter(n => n.btMin !== null).map(n => n.btMin);
  if (goodBtMins.length >= 2 && badBtMins.length >= 2) {
    const goodAvgBt = Math.round(goodBtMins.reduce((a, b) => a + b, 0) / goodBtMins.length);
    const badAvgBt = Math.round(badBtMins.reduce((a, b) => a + b, 0) / badBtMins.length);
    const delta = goodAvgBt - badAvgBt;
    if (Math.abs(delta) >= 10) {
      factors.push({
        icon: zi('moon'), label: 'Bedtime',
        detail: 'Best nights: ' + _siMinToBedtime(goodAvgBt) + ' avg · Worst: ' + _siMinToBedtime(badAvgBt),
        impact: delta < 0 ? 'Earlier is better' : 'Later is better',
        impactVal: Math.abs(delta),
        positive: true
      });
    }
  }

  // Factor 2: Nap count
  const goodNapAvg = goodNights.length > 0 ? (goodNights.reduce((s, n) => s + n.napCount, 0) / goodNights.length).toFixed(1) : 0;
  const badNapAvg = badNights.length > 0 ? (badNights.reduce((s, n) => s + n.napCount, 0) / badNights.length).toFixed(1) : 0;
  if (goodNights.length >= 2 && badNights.length >= 2) {
    const delta = (parseFloat(goodNapAvg) - parseFloat(badNapAvg)).toFixed(1);
    if (Math.abs(delta) >= 0.3) {
      factors.push({
        icon: zi('zzz'), label: 'Nap count',
        detail: 'Good nights avg: ' + goodNapAvg + ' · Bad nights: ' + badNapAvg,
        impact: (delta > 0 ? '+' : '') + delta + ' naps',
        impactVal: Math.abs(parseFloat(delta)) * 20,
        positive: parseFloat(delta) > 0
      });
    }
  }

  // Factor 3: Nap duration
  const goodNapDur = goodNights.filter(n => n.napTotalMin > 0);
  const badNapDur = badNights.filter(n => n.napTotalMin > 0);
  if (goodNapDur.length >= 2 && badNapDur.length >= 2) {
    const goodAvg = Math.round(goodNapDur.reduce((s, n) => s + n.napTotalMin, 0) / goodNapDur.length);
    const badAvg = Math.round(badNapDur.reduce((s, n) => s + n.napTotalMin, 0) / badNapDur.length);
    const delta = goodAvg - badAvg;
    if (Math.abs(delta) >= 15) {
      factors.push({
        icon: '⏱', label: 'Nap duration',
        detail: 'Good nights: ' + Math.floor(goodAvg / 60) + 'h ' + (goodAvg % 60) + 'm · Bad: ' + Math.floor(badAvg / 60) + 'h ' + (badAvg % 60) + 'm',
        impact: (delta > 0 ? '+' : '') + delta + ' min',
        impactVal: Math.abs(delta),
        positive: delta > 0
      });
    }
  }

  // Factor 4: Last wake window before bed
  const goodGaps = goodNights.filter(n => n.lastGapMin !== null);
  const badGaps = badNights.filter(n => n.lastGapMin !== null);
  if (goodGaps.length >= 2 && badGaps.length >= 2) {
    const goodAvg = Math.round(goodGaps.reduce((s, n) => s + n.lastGapMin, 0) / goodGaps.length);
    const badAvg = Math.round(badGaps.reduce((s, n) => s + n.lastGapMin, 0) / badGaps.length);
    const delta = goodAvg - badAvg;
    if (Math.abs(delta) >= 10) {
      factors.push({
        icon: zi('sun'), label: 'Last wake window',
        detail: 'Good nights: ' + Math.floor(goodAvg / 60) + 'h ' + (goodAvg % 60) + 'm · Bad: ' + Math.floor(badAvg / 60) + 'h ' + (badAvg % 60) + 'm',
        impact: (delta > 0 ? 'Longer' : 'Shorter') + ' is better',
        impactVal: Math.abs(delta),
        positive: true
      });
    }
  }

  // Factor 5: Dinner foods — find foods that appear more on good vs bad nights
  const goodFoods = {};
  const badFoods = {};
  goodNights.forEach(n => n.dinnerFoods.forEach(f => { goodFoods[f] = (goodFoods[f] || 0) + 1; }));
  badNights.forEach(n => n.dinnerFoods.forEach(f => { badFoods[f] = (badFoods[f] || 0) + 1; }));
  const sleepFriendlyFoods = [];
  const sleepDisruptFoods = [];
  Object.keys(goodFoods).forEach(f => {
    const goodRate = goodNights.length > 0 ? goodFoods[f] / goodNights.length : 0;
    const badRate = badNights.length > 0 ? (badFoods[f] || 0) / badNights.length : 0;
    if (goodRate >= 0.3 && goodRate > badRate + 0.15) sleepFriendlyFoods.push(f);
  });
  Object.keys(badFoods).forEach(f => {
    const badRate = badNights.length > 0 ? badFoods[f] / badNights.length : 0;
    const goodRate = goodNights.length > 0 ? (goodFoods[f] || 0) / goodNights.length : 0;
    if (badRate >= 0.3 && badRate > goodRate + 0.15) sleepDisruptFoods.push(f);
  });
  if (sleepFriendlyFoods.length > 0) {
    factors.push({
      icon: zi('bowl'), label: 'Sleep-friendly dinners',
      detail: sleepFriendlyFoods.slice(0, 4).join(', '),
      impact: 'Correlates with better nights',
      impactVal: 15,
      positive: true
    });
  }
  if (sleepDisruptFoods.length > 0) {
    factors.push({
      icon: zi('warn'), label: 'Dinner watch list',
      detail: sleepDisruptFoods.slice(0, 4).join(', '),
      impact: 'Correlates with worse nights',
      impactVal: 15,
      positive: false
    });
  }

  // Sort factors by impact
  factors.sort((a, b) => b.impactVal - a.impactVal);

  // Best night recipe
  const bestNight = nightData.reduce((a, b) => a.score > b.score ? a : b);

  return {
    insufficient: false, factors, avgScore,
    goodCount: goodNights.length, badCount: badNights.length,
    bestNight, sleepFriendlyFoods, sleepDisruptFoods,
    count: nightData.length
  };
}

function renderInfoSleepBestNight() {
  const summaryEl = document.getElementById('infoSleepBestNightSummary');
  const factorsEl = document.getElementById('infoSleepBestNightFactors');
  const insightEl = document.getElementById('infoSleepBestNightInsights');
  if (!summaryEl) return;

  const data = computeBestNightPredictor();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need ' + data.needed + ' nights of data (have ' + data.count + ')</div>';
    if (factorsEl) factorsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const factorCount = data.factors.length;
  summaryEl.innerHTML = '<div class="t-sm"><strong>' + factorCount + ' factor' + (factorCount !== 1 ? 's' : '') + '</strong> identified from ' + data.count + ' nights · Avg score ' + data.avgScore + '</div>';

  if (factorsEl) {
    let html = '';
    if (data.factors.length === 0) {
      html = '<div class="si-nodata">No clear patterns found yet — more data will reveal what drives Ziva\'s best nights.</div>';
    } else {
      data.factors.forEach(f => {
        const impactColor = f.positive ? 'var(--tc-sage)' : 'var(--tc-amber)';
        html += '<div class="si-factor-row">';
        html += '<div class="si-factor-icon">' + f.icon + '</div>';
        html += '<div class="si-factor-text"><div class="fw-600">' + f.label + '</div><div style="font-size:var(--fs-2xs);color:var(--light);">' + f.detail + '</div></div>';
        html += '<div class="si-factor-impact" style="color:' + impactColor + ';">' + f.impact + '</div>';
        html += '</div>';
      });
    }

    // Best night card
    const bn = data.bestNight;
    html += '<div class="si-stat-grid" style="margin-top:var(--sp-12);">';
    html += '<div class="si-stat"><div class="si-stat-val t-sage" >' + bn.score + '</div><div class="si-stat-label">Best night</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + bn.napCount + '</div><div class="si-stat-label">Naps that day</div></div>';
    html += '</div>';

    factorsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    // Generate the "recipe" for a good night
    const positiveFactors = data.factors.filter(f => f.positive);
    if (positiveFactors.length >= 2) {
      html += '<div class="si-insight si-insight-good">Best night recipe: ' + positiveFactors.slice(0, 3).map(f => f.label.toLowerCase()).join(' + ') + '.</div>';
    }
    if (data.sleepDisruptFoods.length > 0) {
      html += '<div class="si-insight si-insight-warn">Watch these dinner foods — they appear more often before poor sleep: ' + data.sleepDisruptFoods.slice(0, 3).join(', ') + '.</div>';
    }
    if (!html) {
      html = '<div class="si-insight si-insight-info">Keep logging — patterns become clearer with 2+ weeks of data.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Sleep Regression Detection ──

function computeSleepRegression() {
  // Gather 30 days of daily sleep scores
  const dayScores = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const sc = getDailySleepScore(ds);
    if (sc) dayScores.push({ dateStr: ds, score: sc.score, wakes: sc.wakes, dayIndex: i });
  }

  if (dayScores.length < 10) return { insufficient: true, count: dayScores.length, needed: 10 };

  // Split into baseline (days 14–30) and recent (days 0–13)
  const recent = dayScores.filter(d => d.dayIndex < 14);
  const baseline = dayScores.filter(d => d.dayIndex >= 14);

  if (baseline.length < 3 || recent.length < 3) return { insufficient: true, count: dayScores.length, needed: 14, reason: 'baseline' };

  const baselineAvg = Math.round(baseline.reduce((s, d) => s + d.score, 0) / baseline.length);
  const recentAvg = Math.round(recent.reduce((s, d) => s + d.score, 0) / recent.length);
  const scoreDrop = baselineAvg - recentAvg;

  const baselineWakes = (baseline.reduce((s, d) => s + d.wakes, 0) / baseline.length).toFixed(1);
  const recentWakes = (recent.reduce((s, d) => s + d.wakes, 0) / recent.length).toFixed(1);
  const wakeIncrease = (parseFloat(recentWakes) - parseFloat(baselineWakes)).toFixed(1);

  // Detect consecutive bad nights (below baseline avg - 10)
  const threshold = baselineAvg - 10;
  let maxConsecBad = 0;
  let currentStreak = 0;
  const recentChron = recent.slice().sort((a, b) => b.dayIndex - a.dayIndex); // oldest first
  recentChron.forEach(d => {
    if (d.score < threshold) { currentStreak++; maxConsecBad = Math.max(maxConsecBad, currentStreak); }
    else currentStreak = 0;
  });

  // Regression severity
  let severity = 'none';
  let severityLabel = 'No regression';
  let severityColor = 'var(--tc-sage)';
  if (scoreDrop >= 20 && maxConsecBad >= 5) {
    severity = 'severe';
    severityLabel = 'Significant regression';
    severityColor = 'var(--tc-danger)';
  } else if (scoreDrop >= 12 && maxConsecBad >= 3) {
    severity = 'moderate';
    severityLabel = 'Moderate regression';
    severityColor = 'var(--tc-amber)';
  } else if (scoreDrop >= 6 && maxConsecBad >= 2) {
    severity = 'mild';
    severityLabel = 'Mild dip';
    severityColor = 'var(--tc-caution)';
  }

  // Cross-reference: recent milestones
  const recentMilestones = (milestones || []).filter(m => {
    if (!isMsStarted(m)) return false;
    const mDate = m.emergingAt || m.practicingAt || m.consistentAt || m.masteredAt;
    if (!mDate) return false;
    const dayDiff = (new Date() - new Date(mDate)) / 86400000;
    return dayDiff >= 0 && dayDiff <= 21;
  }).map(m => {
    const stage = m.status || 'unknown';
    return { text: m.text, stage, cat: m.cat || '' };
  });

  // Cross-reference: recent vaccinations
  const recentVaccs = (vaccData || []).filter(v => {
    if (v.upcoming || !v.date) return false;
    const dayDiff = (new Date() - new Date(v.date)) / 86400000;
    return dayDiff >= 0 && dayDiff <= 14;
  }).map(v => ({ name: v.name || v.vaccine || 'Vaccine', date: v.date }));

  // Possible causes
  const causes = [];
  const motorMs = recentMilestones.filter(m => m.cat === 'Gross Motor' || m.cat === 'Fine Motor');
  if (motorMs.length > 0 && severity !== 'none') {
    causes.push({ icon: zi('run'), text: 'Motor milestone burst: ' + motorMs.map(m => m.text).slice(0, 2).join(', ') });
  }
  if (recentVaccs.length > 0 && severity !== 'none') {
    causes.push({ icon: zi('syringe'), text: 'Recent vaccination: ' + recentVaccs.map(v => v.name).slice(0, 2).join(', ') + ' (' + formatDate(recentVaccs[0].date) + ')' });
  }
  const cogMs = recentMilestones.filter(m => m.cat === 'Cognitive' || m.cat === 'Language');
  if (cogMs.length > 0 && severity !== 'none') {
    causes.push({ icon: zi('brain'), text: 'Cognitive/language leap: ' + cogMs.map(m => m.text).slice(0, 2).join(', ') });
  }
  if (recentMilestones.length >= 3 && severity !== 'none') {
    causes.push({ icon: zi('sparkle'), text: 'Developmental leap — ' + recentMilestones.length + ' milestones progressing simultaneously' });
  }
  const ageM = ageAt().months;
  // Known regression windows
  const regressionWindows = [
    { ageStart: 3.5, ageEnd: 4.5, label: '4-month regression' },
    { ageStart: 7.5, ageEnd: 9, label: '8-month regression' },
    { ageStart: 11, ageEnd: 13, label: '12-month regression' },
    { ageStart: 17, ageEnd: 19, label: '18-month regression' },
    { ageStart: 23, ageEnd: 25, label: '24-month regression' }
  ];
  const ageWindow = regressionWindows.find(w => ageM >= w.ageStart && ageM <= w.ageEnd);
  if (ageWindow && severity !== 'none') {
    causes.push({ icon: zi('clock'), text: 'Age-typical: ' + ageWindow.label + ' window (common at this age)' });
  }

  return {
    insufficient: false, dayScores, recent, baseline,
    baselineAvg, recentAvg, scoreDrop, baselineWakes, recentWakes, wakeIncrease,
    maxConsecBad, severity, severityLabel, severityColor,
    recentMilestones, recentVaccs, causes, ageWindow,
    count: dayScores.length
  };
}

function renderInfoSleepRegression() {
  const summaryEl = document.getElementById('infoSleepRegressionSummary');
  const timelineEl = document.getElementById('infoSleepRegressionTimeline');
  const insightEl = document.getElementById('infoSleepRegressionInsights');
  if (!summaryEl) return;

  const data = computeSleepRegression();
  if (data.insufficient) {
    const msg = data.reason === 'baseline'
      ? 'Need at least 2 weeks of sleep data to establish a baseline for regression detection (' + data.count + ' days logged so far)'
      : 'Need ' + data.needed + ' days of data (have ' + data.count + ')';
    summaryEl.innerHTML = '<div class="si-nodata">' + msg + '</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  // Summary
  summaryEl.innerHTML = '<div class="t-sm"><span style="color:' + data.severityColor + ';font-weight:700;">' + data.severityLabel + '</span> — recent avg ' + data.recentAvg + ' vs baseline ' + data.baselineAvg + '</div>';

  if (timelineEl) {
    let html = '';

    // Score timeline bars (recent 14 days, oldest→newest)
    html += '<div class="si-sub-label mb-4" >Last 14 nights</div>';
    const recentSorted = data.recent.slice().sort((a, b) => b.dayIndex - a.dayIndex); // oldest first
    html += '<div class="si-regression-bar">';
    recentSorted.forEach(d => {
      const pct = Math.max(8, d.score);
      const color = d.score >= 70 ? 'var(--tc-sage)' : d.score >= 40 ? 'var(--tc-amber)' : 'var(--tc-danger)';
      html += '<div class="si-reg-col" style="height:' + pct + '%;background:' + color + ';" title="' + formatDate(d.dateStr) + ': ' + d.score + '"></div>';
    });
    html += '</div>';

    // Baseline reference line label
    html += '<div style="display:flex;justify-content:space-between;margin-top:2px;">';
    html += '<div class="si-reg-label">' + (recentSorted.length > 0 ? formatDate(recentSorted[0].dateStr).slice(0, 6) : '') + '</div>';
    html += '<div class="si-reg-label">Today</div>';
    html += '</div>';

    // Stats
    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val" style="color:' + (data.scoreDrop >= 10 ? 'var(--tc-danger)' : 'var(--tc-sage)') + ';">' + (data.scoreDrop > 0 ? '-' : '+') + Math.abs(data.scoreDrop) + '</div><div class="si-stat-label">Score change</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val" style="color:' + (parseFloat(data.wakeIncrease) > 0.5 ? 'var(--tc-amber)' : 'var(--tc-sage)') + ';">' + (parseFloat(data.wakeIncrease) > 0 ? '+' : '') + data.wakeIncrease + '</div><div class="si-stat-label">Wake change</div></div>';
    html += '</div>';

    // Possible causes
    if (data.causes.length > 0) {
      html += '<div class="si-sub-label fe-section-gap" >Possible causes</div>';
      data.causes.forEach(c => {
        html += '<div class="si-reg-cause"><div class="si-reg-cause-icon">' + c.icon + '</div><div class="si-reg-cause-text">' + c.text + '</div></div>';
      });
    }

    timelineEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.severity === 'none') {
      html += '<div class="si-insight si-insight-good">No sleep regression detected. Ziva\'s sleep has been stable.</div>';
    } else if (data.severity === 'mild') {
      html += '<div class="si-insight si-insight-info">A mild dip is normal — it often resolves within a few days. Keep the routine consistent.</div>';
    } else if (data.severity === 'moderate') {
      html += '<div class="si-insight si-insight-warn">Moderate regression lasting ' + data.maxConsecBad + ' consecutive bad nights. Stick to the bedtime routine and avoid introducing new sleep associations.</div>';
    } else {
      html += '<div class="si-insight si-insight-warn">Significant sleep disruption detected. This is likely developmental and typically lasts 1–3 weeks. Maintain consistency — this will pass.</div>';
    }
    if (data.ageWindow && data.severity !== 'none') {
      html += '<div class="si-insight si-insight-info">Ziva is in the ' + data.ageWindow.label + ' window — a well-documented period of sleep disruption tied to neurological development.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ════════════════════════════════════════

// CROSS-DOMAIN INTELLIGENCE — 6 Cards
// ════════════════════════════════════════════════════════════════

// ── Helper: extract individual food names from a meal string ──
function _cdParseMealFoods(mealStr) {
  if (!mealStr || typeof mealStr !== 'string') return [];
  return mealStr.split(/[,+]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
}

// ── Helper: get all foods eaten on a specific date ──
function _cdGetFoodsForDate(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return [];
  const all = [];
  ['breakfast','lunch','dinner','snack'].forEach(m => {
    _cdParseMealFoods(entry[m]).forEach(f => {
      const norm = typeof normalizeFoodName === 'function' ? normalizeFoodName(f) : f;
      if (norm) all.push(norm);
    });
  });
  return [...new Set(all)];
}

// ── Helper: count meals logged on a date ──
function _cdCountMeals(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return 0;
  let c = 0;
  ['breakfast','lunch','dinner'].forEach(m => { if (entry[m] && entry[m].trim()) c++; });
  return c;
}

// ── Helper: get last meal time on a date ──
function _cdGetLastMealTime(dateStr) {
  const entry = feedingData[dateStr];
  if (!entry) return null;
  // Check in reverse order: snack, dinner, lunch, breakfast
  const meals = ['snack','dinner','lunch','breakfast'];
  for (const m of meals) {
    const timeKey = m + '_time';
    if (entry[m] && entry[m].trim() && entry[timeKey]) return entry[timeKey];
  }
  return null;
}

// ── Helper: time string to minutes ──
function _cdTimeToMin(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

// ── Helper: bedtime for a date (night sleep entry) ──
function _cdGetBedtime(dateStr) {
  const entries = getSleepForDate(dateStr);
  const night = entries.find(s => s.type === 'night');
  if (!night || !night.bedtime) return null;
  return night.bedtime;
}

// ── Helper: bar HTML ──
function _cdBarHtml(label, value, maxVal, suffix, color, rawLabel) {
  const pct = maxVal > 0 ? Math.min(100, Math.max(4, Math.round((value / maxVal) * 100))) : 4;
  return '<div class="cd-bar-row">' +
    '<div class="cd-bar-label">' + (rawLabel ? label : escHtml(label)) + '</div>' +
    '<div class="cd-bar-track"><div class="cd-bar-fill" style="width:' + pct + '%;background:' + (color || 'var(--tc-sage)') + ';"></div></div>' +
    '<div class="cd-bar-val">' + value + (suffix || '') + '</div>' +
    '</div>';
}

// ════════════════════════════════════════
// Card 1: Food → Poop Pipeline
// ════════════════════════════════════════

function renderInfoFoodPoopPipeline() {
  var sumEl = document.getElementById('infoFoodPoopPipelineSummary');
  var trigEl = document.getElementById('infoFoodPoopPipelineTriggers');
  var safeEl = document.getElementById('infoFoodPoopPipelineSafe');
  var insEl = document.getElementById('infoFoodPoopPipelineInsights');
  if (!sumEl) return;

  // Collect poop-scored days
  var poopDays = {};
  (poopData || []).forEach(function(p) {
    if (!p.date) return;
    if (!poopDays[p.date]) poopDays[p.date] = [];
    poopDays[p.date].push(p);
  });

  var poopDateList = Object.keys(poopDays).sort();
  if (poopDateList.length < 5) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 5 days of poop data for pipeline analysis</div>';
    if (trigEl) trigEl.innerHTML = '';
    if (safeEl) safeEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  // Build food → poop score map with transit window (D+0, D+1, D+2)
  var foodMap = {}; // food → [{score, dayOffset}]
  var allScores = [];
  var transitWeights = [1.0, 0.7, 0.3];

  poopDateList.forEach(function(poopDate) {
    var ps = calcPoopScore(poopDate);
    if (!ps || ps.isCarryForward) return;
    allScores.push(ps.score);

    // Look back 0-2 days for foods eaten
    for (var offset = 0; offset <= 2; offset++) {
      var d = new Date(poopDate + 'T12:00:00');
      d.setDate(d.getDate() - offset);
      var foodDate = toDateStr(d);
      var dayFoods = _cdGetFoodsForDate(foodDate);
      dayFoods.forEach(function(food) {
        if (!foodMap[food]) foodMap[food] = [];
        foodMap[food].push({ score: ps.score, dayOffset: offset, weight: transitWeights[offset] });
      });
    }
  });

  if (allScores.length < 5) {
    sumEl.innerHTML = '<div class="si-nodata">Need more poop-scored days for pipeline analysis</div>';
    if (trigEl) trigEl.innerHTML = '';
    if (safeEl) safeEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  var baseline = Math.round(allScores.reduce(function(a, b) { return a + b; }, 0) / allScores.length);

  // Compute weighted average per food (min 3 occurrences)
  var foodResults = [];
  Object.keys(foodMap).forEach(function(food) {
    var entries = foodMap[food];
    if (entries.length < 3) return;
    var wSum = 0, wCount = 0;
    entries.forEach(function(e) { wSum += e.score * e.weight; wCount += e.weight; });
    var avg = Math.round(wSum / wCount);
    var diff = avg - baseline;
    // Find best transit day
    var offsetBuckets = [[], [], []];
    entries.forEach(function(e) { offsetBuckets[e.dayOffset].push(e.score); });
    var worstOffset = 0, worstAvg = avg;
    offsetBuckets.forEach(function(bucket, idx) {
      if (bucket.length >= 2) {
        var bAvg = Math.round(bucket.reduce(function(a, b) { return a + b; }, 0) / bucket.length);
        if (bAvg < worstAvg) { worstAvg = bAvg; worstOffset = idx; }
      }
    });
    foodResults.push({ food: food, avg: avg, diff: diff, count: entries.length, worstOffset: worstOffset });
  });

  var triggers = foodResults.filter(function(f) { return f.diff <= -15; }).sort(function(a, b) { return a.diff - b.diff; });
  var safeFoods = foodResults.filter(function(f) { return f.diff >= 10; }).sort(function(a, b) { return b.diff - a.diff; });
  var totalTracked = foodResults.length;

  sumEl.innerHTML = '<div class="t-sm"><strong>' + totalTracked + '</strong> foods tracked · <strong>' + triggers.length + '</strong> trigger' + (triggers.length !== 1 ? 's' : '') + ' · baseline ' + baseline + '</div>';

  // Triggers
  if (trigEl) {
    var html = '';
    if (triggers.length > 0) {
      html += '<div class="cd-section-label">Trigger Foods</div>';
      triggers.slice(0, 5).forEach(function(t) {
        html += '<div class="cd-food-item">';
        html += '<div class="cd-food-name">' + escHtml(t.food) + '</div>';
        html += '<div class="cd-pill cd-pill-neg">' + t.diff + ' pts</div>';
        html += '<div class="cd-food-meta">' + t.count + '× · worst D+' + t.worstOffset + '</div>';
        html += '</div>';
      });
    } else {
      html += '<div class="si-insight si-insight-good">No trigger foods detected — all foods within normal poop score range</div>';
    }
    trigEl.innerHTML = html;
  }

  // Safe foods
  if (safeEl) {
    var sHtml = '';
    if (safeFoods.length > 0) {
      sHtml += '<div class="cd-section-label">Safe Foods</div>';
      safeFoods.slice(0, 5).forEach(function(s) {
        sHtml += '<div class="cd-food-item">';
        sHtml += '<div class="cd-food-name">' + escHtml(s.food) + '</div>';
        sHtml += '<div class="cd-pill cd-pill-pos">+' + s.diff + ' pts</div>';
        sHtml += '<div class="cd-food-meta">' + s.count + '×</div>';
        sHtml += '</div>';
      });
    }
    safeEl.innerHTML = sHtml;
  }

  // Insights
  if (insEl) {
    var iHtml = '';
    if (triggers.length > 0) {
      var top = triggers[0];
      iHtml += '<div class="si-insight si-insight-warn">' + escHtml(top.food) + ' correlates with lower poop scores (' + top.diff + ' pts) ' + (top.worstOffset > 0 ? top.worstOffset + ' day' + (top.worstOffset > 1 ? 's' : '') + ' later' : 'same day') + ' across ' + top.count + ' meals</div>';
    }
    if (safeFoods.length > 0) {
      iHtml += '<div class="si-insight si-insight-good">Best poop days follow: ' + safeFoods.slice(0, 3).map(function(s) { return escHtml(s.food); }).join(', ') + '</div>';
    }
    if (!iHtml) {
      iHtml = '<div class="si-insight si-insight-info">Building food-poop correlations — more data will improve accuracy</div>';
    }
    insEl.innerHTML = iHtml;
  }
}

// ════════════════════════════════════════
// Card 2: Sleep ↔ Feeding Patterns
// ════════════════════════════════════════

function renderInfoSleepFeeding() {
  var sumEl = document.getElementById('infoSleepFeedingSummary');
  var gapEl = document.getElementById('infoSleepFeedingGap');
  var compEl = document.getElementById('infoSleepFeedingMealComp');
  var insEl = document.getElementById('infoSleepFeedingInsights');
  if (!sumEl) return;

  // Pair feeding day D with sleep night D
  var pairs = [];
  var feedDates = Object.keys(feedingData).sort();
  feedDates.forEach(function(dateStr) {
    var sleepScore = getDailySleepScore(dateStr);
    if (!sleepScore) return;
    var lastMealTime = _cdGetLastMealTime(dateStr);
    var bedtime = _cdGetBedtime(dateStr);
    var mealCount = _cdCountMeals(dateStr);
    var foodCount = _cdGetFoodsForDate(dateStr).length;
    pairs.push({
      date: dateStr,
      sleepScore: sleepScore.score,
      wakes: sleepScore.wakes,
      lastMealMin: _cdTimeToMin(lastMealTime),
      bedtimeMin: _cdTimeToMin(bedtime),
      mealCount: mealCount,
      foodCount: foodCount
    });
  });

  if (pairs.length < 5) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 5 days with both feeding and sleep data</div>';
    if (gapEl) gapEl.innerHTML = '';
    if (compEl) compEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  // 2a: Dinner-to-bedtime gap analysis
  var gapBuckets = { '<60': [], '60-90': [], '90-120': [], '>120': [] };
  pairs.forEach(function(p) {
    if (p.lastMealMin === null || p.bedtimeMin === null) return;
    var bedAdj = p.bedtimeMin;
    if (bedAdj < 6 * 60) bedAdj += 24 * 60; // handle after-midnight bedtimes
    var lastAdj = p.lastMealMin;
    var gap = bedAdj - lastAdj;
    if (gap < 0) return; // meal after bedtime — skip
    if (gap < 60) gapBuckets['<60'].push(p.sleepScore);
    else if (gap < 90) gapBuckets['60-90'].push(p.sleepScore);
    else if (gap < 120) gapBuckets['90-120'].push(p.sleepScore);
    else gapBuckets['>120'].push(p.sleepScore);
  });

  // 2b: Meal completeness
  var complete = pairs.filter(function(p) { return p.mealCount >= 3; });
  var incomplete = pairs.filter(function(p) { return p.mealCount < 3; });
  var compAvg = complete.length >= 2 ? Math.round(complete.reduce(function(a, p) { return a + p.sleepScore; }, 0) / complete.length) : null;
  var incAvg = incomplete.length >= 2 ? Math.round(incomplete.reduce(function(a, p) { return a + p.sleepScore; }, 0) / incomplete.length) : null;

  // Find best gap bucket
  var bestBucket = null, bestAvg = 0;
  var gapSummaries = [];
  Object.keys(gapBuckets).forEach(function(label) {
    var arr = gapBuckets[label];
    if (arr.length < 2) return;
    var avg = Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
    gapSummaries.push({ label: label, avg: avg, count: arr.length });
    if (avg > bestAvg) { bestAvg = avg; bestBucket = label; }
  });

  var summaryText = '';
  if (bestBucket) {
    var overallAvg = Math.round(pairs.reduce(function(a, p) { return a + p.sleepScore; }, 0) / pairs.length);
    var diff = bestAvg - overallAvg;
    summaryText = 'Dinner gap ' + bestBucket + ' min → ' + (diff >= 0 ? '+' : '') + diff + ' sleep';
  } else {
    summaryText = pairs.length + ' feeding-sleep pairs analyzed';
  }
  sumEl.innerHTML = '<div class="t-sm">' + summaryText + '</div>';

  // Gap bars
  if (gapEl) {
    var html = '';
    if (gapSummaries.length > 0) {
      html += '<div class="cd-section-label">Dinner-to-Bedtime Gap</div>';
      var maxAvg = Math.max.apply(null, gapSummaries.map(function(g) { return g.avg; }));
      gapSummaries.forEach(function(g) {
        var color = g.label === bestBucket ? 'var(--tc-sage)' : 'var(--tc-amber)';
        html += _cdBarHtml(g.label + ' min', g.avg, maxAvg, '', color);
      });
    } else {
      html += '<div class="si-nodata">Need meal times logged to analyze dinner-to-bedtime gap</div>';
    }
    gapEl.innerHTML = html;
  }

  // Meal completeness
  if (compEl) {
    var cHtml = '<div class="cd-section-label">Meal Completeness</div>';
    if (compAvg !== null && incAvg !== null) {
      var mDiff = compAvg - incAvg;
      var maxS = Math.max(compAvg, incAvg);
      cHtml += _cdBarHtml('All 3 meals', compAvg, maxS, '', 'var(--tc-sage)');
      cHtml += _cdBarHtml('Incomplete', incAvg, maxS, '', 'var(--tc-amber)');
      cHtml += '<div class="cd-align-end"><span class="cd-pill ' + (mDiff > 0 ? 'cd-pill-pos' : mDiff < -3 ? 'cd-pill-neg' : 'cd-pill-neutral') + '">' + (mDiff >= 0 ? '+' : '') + mDiff + ' pts difference</span></div>';
    } else {
      cHtml += '<div class="si-nodata">Need more complete vs incomplete meal days for comparison</div>';
    }
    compEl.innerHTML = cHtml;
  }

  // Insights
  if (insEl) {
    var iHtml = '';
    if (bestBucket) {
      iHtml += '<div class="si-insight si-insight-good">Best sleep follows a ' + bestBucket + ' min gap after the last meal (avg ' + bestAvg + ')</div>';
    }
    if (compAvg !== null && incAvg !== null && compAvg - incAvg >= 5) {
      iHtml += '<div class="si-insight si-insight-info">Complete meal days show better sleep scores (+' + (compAvg - incAvg) + ' pts)</div>';
    }
    if (!iHtml) {
      iHtml = '<div class="si-insight si-insight-info">Building sleep-feeding correlations — log meal times for deeper insights</div>';
    }
    insEl.innerHTML = iHtml;
  }
}

// ════════════════════════════════════════
// Card 3: Activity → Sleep Quality (Deep)
// ════════════════════════════════════════

function renderInfoActivitySleepDeep() {
  var sumEl = document.getElementById('infoActivitySleepDeepSummary');
  var timEl = document.getElementById('infoActivitySleepDeepTiming');
  var intEl = document.getElementById('infoActivitySleepDeepIntensity');
  var domEl = document.getElementById('infoActivitySleepDeepDomains');
  var insEl = document.getElementById('infoActivitySleepDeepInsights');
  if (!sumEl) return;

  // Pair activity day D with sleep night D
  var pairs = [];
  var allDates = new Set();
  // Collect dates from last 60 days
  for (var i = 0; i < 60; i++) {
    var d = new Date(); d.setDate(d.getDate() - i);
    allDates.add(toDateStr(d));
  }

  allDates.forEach(function(dateStr) {
    var sleepScore = getDailySleepScore(dateStr);
    if (!sleepScore) return;

    var entries = Array.isArray(activityLog[dateStr]) ? activityLog[dateStr] : [];
    var totalDur = 0;
    var timingBuckets = { morning: false, afternoon: false, evening: false };
    var domainSet = new Set();

    entries.forEach(function(e) {
      totalDur += (e.duration || 0);
      (e.domains || []).forEach(function(dm) { domainSet.add(dm); });
      if (e.ts) {
        var h = new Date(e.ts).getHours();
        if (h >= 5 && h < 12) timingBuckets.morning = true;
        else if (h >= 12 && h < 17) timingBuckets.afternoon = true;
        else timingBuckets.evening = true;
      }
    });

    // Classify timing
    var timingLabel = 'none';
    var activeSlots = Object.keys(timingBuckets).filter(function(k) { return timingBuckets[k]; });
    if (activeSlots.length > 1) timingLabel = 'mixed';
    else if (activeSlots.length === 1) timingLabel = activeSlots[0];

    pairs.push({
      date: dateStr, sleepScore: sleepScore.score,
      hasActivity: entries.length > 0, totalDur: totalDur,
      timing: timingLabel, domains: [...domainSet], entryCount: entries.length
    });
  });

  if (pairs.length < 10) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 10 days with sleep data for activity-sleep deep analysis</div>';
    if (timEl) timEl.innerHTML = '';
    if (intEl) intEl.innerHTML = '';
    if (domEl) domEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  // 3a: Timing analysis
  var timingGroups = {};
  ['morning','afternoon','evening','mixed','none'].forEach(function(t) {
    timingGroups[t] = pairs.filter(function(p) { return p.timing === t; });
  });

  var timingSummaries = [];
  var timingLabels = { morning:'Morning', afternoon:'Afternoon', evening:'Evening', mixed:'Mixed', none:'No activity' };
  Object.keys(timingGroups).forEach(function(t) {
    var arr = timingGroups[t];
    if (arr.length < 3) return;
    var avg = Math.round(arr.reduce(function(a, p) { return a + p.sleepScore; }, 0) / arr.length);
    timingSummaries.push({ key: t, label: timingLabels[t], avg: avg, count: arr.length });
  });
  timingSummaries.sort(function(a, b) { return b.avg - a.avg; });

  // 3b: Intensity analysis
  var intensityGroups = { '0 min': [], '1-15': [], '15-30': [], '30+': [] };
  pairs.forEach(function(p) {
    if (p.totalDur === 0) intensityGroups['0 min'].push(p.sleepScore);
    else if (p.totalDur <= 15) intensityGroups['1-15'].push(p.sleepScore);
    else if (p.totalDur <= 30) intensityGroups['15-30'].push(p.sleepScore);
    else intensityGroups['30+'].push(p.sleepScore);
  });

  var intensitySummaries = [];
  Object.keys(intensityGroups).forEach(function(k) {
    var arr = intensityGroups[k];
    if (arr.length < 3) return;
    var avg = Math.round(arr.reduce(function(a, b) { return a + b; }, 0) / arr.length);
    intensitySummaries.push({ label: k, avg: avg, count: arr.length });
  });

  // 3c: Domain effects
  var domainNames = ['motor','language','social','cognitive','sensory'];
  var domainEffects = [];
  var overallAvg = Math.round(pairs.reduce(function(a, p) { return a + p.sleepScore; }, 0) / pairs.length);

  domainNames.forEach(function(dom) {
    var withDom = pairs.filter(function(p) { return p.domains.includes(dom); });
    var withoutDom = pairs.filter(function(p) { return !p.domains.includes(dom) && p.hasActivity; });
    if (withDom.length < 3) return;
    var withAvg = Math.round(withDom.reduce(function(a, p) { return a + p.sleepScore; }, 0) / withDom.length);
    var diff = withAvg - overallAvg;
    domainEffects.push({ domain: dom, avg: withAvg, diff: diff, count: withDom.length });
  });
  domainEffects.sort(function(a, b) { return b.diff - a.diff; });

  // Summary
  var bestInsight = '';
  if (timingSummaries.length > 0 && timingSummaries[0].key !== 'none') {
    bestInsight = timingSummaries[0].label + ' → best sleep (+' + (timingSummaries[0].avg - overallAvg) + ')';
  } else if (domainEffects.length > 0 && domainEffects[0].diff > 0) {
    bestInsight = domainEffects[0].domain + ' days → +' + domainEffects[0].diff + ' sleep';
  } else {
    bestInsight = pairs.filter(function(p) { return p.hasActivity; }).length + ' active days analyzed';
  }
  sumEl.innerHTML = '<div class="t-sm">' + bestInsight + '</div>';

  // Timing bars
  if (timEl) {
    var html = '';
    if (timingSummaries.length > 0) {
      html += '<div class="cd-section-label">Activity Timing</div>';
      var tMax = Math.max.apply(null, timingSummaries.map(function(t) { return t.avg; }));
      timingSummaries.forEach(function(t, idx) {
        html += _cdBarHtml(t.label, t.avg, tMax, '', idx === 0 ? 'var(--tc-sage)' : 'var(--tc-amber)');
      });
    }
    timEl.innerHTML = html;
  }

  // Intensity bars
  if (intEl) {
    var iHtml = '';
    if (intensitySummaries.length > 0) {
      iHtml += '<div class="cd-section-label">Activity Duration</div>';
      var iMax = Math.max.apply(null, intensitySummaries.map(function(s) { return s.avg; }));
      intensitySummaries.forEach(function(s) {
        iHtml += _cdBarHtml(s.label + ' min', s.avg, iMax, '', 'var(--tc-sage)');
      });
    }
    intEl.innerHTML = iHtml;
  }

  // Domain effects
  if (domEl) {
    var dHtml = '';
    if (domainEffects.length > 0) {
      dHtml += '<div class="cd-section-label">Domain Effect on Sleep</div>';
      domainEffects.forEach(function(de) {
        var cls = de.diff > 3 ? 'cd-pill-pos' : de.diff < -3 ? 'cd-pill-neg' : 'cd-pill-neutral';
        dHtml += '<div class="cd-food-item">';
        dHtml += '<div class="cd-food-name cd-capitalize">' + escHtml(de.domain) + '</div>';
        dHtml += '<div class="cd-pill ' + cls + '">' + (de.diff >= 0 ? '+' : '') + de.diff + '</div>';
        dHtml += '<div class="cd-food-meta">' + de.count + ' days</div>';
        dHtml += '</div>';
      });
    }
    domEl.innerHTML = dHtml;
  }

  // Insights
  if (insEl) {
    var isHtml = '';
    if (timingSummaries.length > 0 && timingSummaries[0].key !== 'none') {
      isHtml += '<div class="si-insight si-insight-good">' + timingSummaries[0].label + ' activities correlate with best sleep quality</div>';
    }
    if (domainEffects.length > 0 && domainEffects[0].diff >= 5) {
      isHtml += '<div class="si-insight si-insight-info">' + escHtml(domainEffects[0].domain.charAt(0).toUpperCase() + domainEffects[0].domain.slice(1)) + ' activities show strongest positive sleep correlation (+' + domainEffects[0].diff + ' pts)</div>';
    }
    if (!isHtml) {
      isHtml = '<div class="si-insight si-insight-info">More activity logging will reveal timing and domain patterns</div>';
    }
    insEl.innerHTML = isHtml;
  }
}

// ════════════════════════════════════════
// Card 4: Growth Velocity ↔ Diet Adequacy
// ════════════════════════════════════════

function renderInfoGrowthDiet() {
  var sumEl = document.getElementById('infoGrowthDietSummary');
  var perEl = document.getElementById('infoGrowthDietPeriod');
  var nutEl = document.getElementById('infoGrowthDietNutrients');
  var insEl = document.getElementById('infoGrowthDietInsights');
  if (!sumEl) return;

  if (!growthData || growthData.length < 2) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 2 weight measurements for growth-diet analysis</div>';
    if (perEl) perEl.innerHTML = '';
    if (nutEl) nutEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  var sorted = [...growthData].sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  var last = sorted[sorted.length - 1];
  var prev = sorted[sorted.length - 2];

  var daysBetweenMeasurements = Math.max(1, Math.round((new Date(last.date) - new Date(prev.date)) / 86400000));
  var wtDiffG = Math.round((last.wt - prev.wt) * 1000);
  var velocity = Math.round((wtDiffG / daysBetweenMeasurements) * 100) / 100;

  // Velocity assessment (WHO guidance for 6-12 months: ~10-15 g/day is normal)
  var velLabel = 'normal';
  if (velocity < 5) velLabel = 'slow';
  else if (velocity > 20) velLabel = 'rapid';

  // Diet metrics during the growth period
  var periodDates = [];
  for (var i = 0; i < daysBetweenMeasurements && i < 60; i++) {
    var d = new Date(prev.date + 'T12:00:00');
    d.setDate(d.getDate() + i);
    periodDates.push(toDateStr(d));
  }

  var feedingDays = periodDates.filter(function(ds) { return feedingData[ds]; });
  if (feedingDays.length < 3) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 3 feeding days in the growth measurement window</div>';
    if (perEl) perEl.innerHTML = '';
    if (nutEl) nutEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  var totalMeals = 0, totalFoods = 0;
  var nutrientDayCoverage = {};
  KEY_NUTRIENTS.forEach(function(n) { nutrientDayCoverage[n] = 0; });

  feedingDays.forEach(function(ds) {
    totalMeals += _cdCountMeals(ds);
    var dayFoods = _cdGetFoodsForDate(ds);
    totalFoods += dayFoods.length;

    // Check nutrients via getFoodTags
    var tags = getFoodTags(dayFoods);
    KEY_NUTRIENTS.forEach(function(n) {
      var nLower = n.toLowerCase();
      if (tags.nutrients.includes(nLower)) {
        nutrientDayCoverage[n]++;
      }
    });
  });

  var avgMeals = Math.round((totalMeals / feedingDays.length) * 10) / 10;
  var avgVariety = Math.round((totalFoods / feedingDays.length) * 10) / 10;

  sumEl.innerHTML = '<div class="t-sm">Velocity <strong>' + velocity + ' g/day</strong> · <strong>' + avgMeals + '</strong> meals/day · diet ' + (velLabel === 'slow' ? zi('warn') : zi('check')) + '</div>';

  // Period details
  if (perEl) {
    var pHtml = '<div class="cd-section-label">Current Growth Period</div>';
    pHtml += '<div class="si-stat-grid">';
    pHtml += '<div class="si-stat"><div class="si-stat-val">' + velocity + '</div><div class="si-stat-label">g/day velocity</div></div>';
    pHtml += '<div class="si-stat"><div class="si-stat-val">' + (wtDiffG >= 0 ? '+' : '') + wtDiffG + 'g</div><div class="si-stat-label">' + daysBetweenMeasurements + ' days</div></div>';
    pHtml += '</div>';
    pHtml += '<div class="cd-meta">' + formatDate(prev.date) + ' → ' + formatDate(last.date) + ' · ' + prev.wt + ' → ' + last.wt + ' kg</div>';
    perEl.innerHTML = pHtml;
  }

  // Nutrient coverage
  if (nutEl) {
    var nHtml = '<div class="cd-section-label">Diet During This Period</div>';
    nHtml += '<div class="si-stat-grid">';
    nHtml += '<div class="si-stat"><div class="si-stat-val">' + avgMeals + '</div><div class="si-stat-label">Avg meals/day</div></div>';
    nHtml += '<div class="si-stat"><div class="si-stat-val">' + avgVariety + '</div><div class="si-stat-label">Avg foods/day</div></div>';
    nHtml += '</div>';

    var NUTRIENT_EMOJI = { iron:zi('drop'), calcium:zi('ruler'), protein:zi('run'), 'vitamin C':zi('bowl'), fibre:zi('bowl'), 'vitamin A':zi('scope'), 'omega-3':zi('brain'), zinc:zi('shield') };
    KEY_NUTRIENTS.forEach(function(n) {
      var coveragePct = Math.round((nutrientDayCoverage[n] / feedingDays.length) * 100);
      var color = coveragePct >= 70 ? 'var(--tc-sage)' : coveragePct >= 40 ? 'var(--tc-amber)' : 'var(--tc-rose)';
      nHtml += _cdBarHtml((NUTRIENT_EMOJI[n] || '') + ' ' + escHtml(n), coveragePct, 100, '%', color, true);
    });
    nutEl.innerHTML = nHtml;
  }

  // Insights
  if (insEl) {
    var iHtml = '';
    if (velLabel === 'slow') {
      var lowNutrients = KEY_NUTRIENTS.filter(function(n) {
        return (nutrientDayCoverage[n] / feedingDays.length) < 0.5;
      });
      if (lowNutrients.length > 0) {
        iHtml += '<div class="si-insight si-insight-warn">Slow growth velocity coincides with low ' + lowNutrients.slice(0, 2).join(' and ') + ' coverage — consider adding rich sources</div>';
      } else {
        iHtml += '<div class="si-insight si-insight-warn">Growth velocity is below typical range (' + velocity + ' g/day) — monitor at next weigh-in</div>';
      }
    } else {
      iHtml += '<div class="si-insight si-insight-good">Growth velocity is ' + velLabel + ' at ' + velocity + ' g/day with ' + avgMeals + ' meals/day</div>';
    }
    var covered = KEY_NUTRIENTS.filter(function(n) { return (nutrientDayCoverage[n] / feedingDays.length) >= 0.5; });
    if (covered.length < KEY_NUTRIENTS.length) {
      var gaps = KEY_NUTRIENTS.filter(function(n) { return (nutrientDayCoverage[n] / feedingDays.length) < 0.5; });
      iHtml += '<div class="si-insight si-insight-info">Nutrient gaps during this period: ' + gaps.join(', ') + '</div>';
    }
    insEl.innerHTML = iHtml;
  }
}

// ════════════════════════════════════════
// Card 5: Illness Impact Radius
// ════════════════════════════════════════

function renderInfoIllnessImpact() {
  var sumEl = document.getElementById('infoIllnessImpactSummary');
  var epEl = document.getElementById('infoIllnessImpactEpisodes');
  var aggEl = document.getElementById('infoIllnessImpactAggregate');
  var insEl = document.getElementById('infoIllnessImpactInsights');
  if (!sumEl) return;

  var episodes = _getAllEpisodes().filter(function(e) {
    if (!e.startedAt) return false;
    var daysAgo = Math.floor((new Date() - new Date(e.startedAt)) / 86400000);
    return daysAgo <= 90;
  });

  if (episodes.length === 0) {
    sumEl.innerHTML = '<div class="si-nodata">No illness episodes in the last 90 days</div>';
    if (epEl) epEl.innerHTML = '';
    if (aggEl) aggEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  // Helper: avg score over a date range
  function avgDomainScore(scoreFn, startDate, endDate) {
    var scores = [];
    var current = new Date(startDate + 'T12:00:00');
    var end = new Date(endDate + 'T12:00:00');
    while (current <= end) {
      var ds = toDateStr(current);
      var sc = scoreFn(ds);
      if (sc !== null && typeof sc === 'object' && sc.score !== undefined) scores.push(sc.score);
      else if (typeof sc === 'number') scores.push(sc);
      current.setDate(current.getDate() + 1);
    }
    return scores.length > 0 ? Math.round(scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) : null;
  }

  function avgFoodsPerDay(startDate, endDate) {
    var counts = [];
    var current = new Date(startDate + 'T12:00:00');
    var end = new Date(endDate + 'T12:00:00');
    while (current <= end) {
      var ds = toDateStr(current);
      var c = _cdGetFoodsForDate(ds).length;
      counts.push(c);
      current.setDate(current.getDate() + 1);
    }
    return counts.length > 0 ? Math.round((counts.reduce(function(a, b) { return a + b; }, 0) / counts.length) * 10) / 10 : null;
  }

  function avgActivitiesPerDay(startDate, endDate) {
    var counts = [];
    var current = new Date(startDate + 'T12:00:00');
    var end = new Date(endDate + 'T12:00:00');
    while (current <= end) {
      var ds = toDateStr(current);
      var entries = Array.isArray(activityLog[ds]) ? activityLog[ds] : [];
      counts.push(entries.length);
      current.setDate(current.getDate() + 1);
    }
    return counts.length > 0 ? Math.round((counts.reduce(function(a, b) { return a + b; }, 0) / counts.length) * 10) / 10 : null;
  }

  var totalSickDays = 0;
  var domainImpacts = { sleep: [], diet: [], poop: [], activity: [] };
  var episodeResults = [];
  var mostImpacted = null, worstDelta = 0;

  episodes.forEach(function(ep) {
    var startDate = ep.startedAt.slice(0, 10);
    var endDate = ep.resolvedAt ? ep.resolvedAt.slice(0, 10) : today();
    var duration = _episodeDurationDays(ep);
    totalSickDays += duration;

    // 7-day pre-illness baseline
    var baseStart = new Date(startDate + 'T12:00:00');
    baseStart.setDate(baseStart.getDate() - 7);
    var baseStartStr = toDateStr(baseStart);
    var baseEndD = new Date(startDate + 'T12:00:00');
    baseEndD.setDate(baseEndD.getDate() - 1);
    var baseEndStr = toDateStr(baseEndD);

    var result = {
      type: ep.illnessType, emoji: ep.emoji || zi('flame'),
      startDate: startDate, endDate: endDate, duration: duration,
      status: ep.status || 'resolved',
      domains: {}
    };

    // Sleep
    var baseSleep = avgDomainScore(getDailySleepScore, baseStartStr, baseEndStr);
    var illSleep = avgDomainScore(getDailySleepScore, startDate, endDate);
    if (baseSleep !== null && illSleep !== null) {
      var delta = illSleep - baseSleep;
      result.domains.sleep = { before: baseSleep, during: illSleep, delta: delta };
      domainImpacts.sleep.push(delta);
      if (Math.abs(delta) > worstDelta) { worstDelta = Math.abs(delta); mostImpacted = 'sleep'; }
    }

    // Diet
    var baseDiet = avgFoodsPerDay(baseStartStr, baseEndStr);
    var illDiet = avgFoodsPerDay(startDate, endDate);
    if (baseDiet !== null && illDiet !== null && baseDiet > 0) {
      var dietPct = Math.round(((illDiet - baseDiet) / baseDiet) * 100);
      result.domains.diet = { before: baseDiet, during: illDiet, deltaPct: dietPct };
      domainImpacts.diet.push(dietPct);
      if (Math.abs(dietPct) > worstDelta) { worstDelta = Math.abs(dietPct); mostImpacted = 'diet'; }
    }

    // Poop
    var basePoop = avgDomainScore(calcPoopScore, baseStartStr, baseEndStr);
    var illPoop = avgDomainScore(calcPoopScore, startDate, endDate);
    if (basePoop !== null && illPoop !== null) {
      var pDelta = illPoop - basePoop;
      result.domains.poop = { before: basePoop, during: illPoop, delta: pDelta };
      domainImpacts.poop.push(pDelta);
      if (Math.abs(pDelta) > worstDelta) { worstDelta = Math.abs(pDelta); mostImpacted = 'poop'; }
    }

    // Activity
    var baseAct = avgActivitiesPerDay(baseStartStr, baseEndStr);
    var illAct = avgActivitiesPerDay(startDate, endDate);
    if (baseAct !== null && illAct !== null && baseAct > 0) {
      var actPct = Math.round(((illAct - baseAct) / baseAct) * 100);
      result.domains.activity = { before: baseAct, during: illAct, deltaPct: actPct };
      domainImpacts.activity.push(actPct);
      if (Math.abs(actPct) > worstDelta) { worstDelta = Math.abs(actPct); mostImpacted = 'activity'; }
    }

    episodeResults.push(result);
  });

  sumEl.innerHTML = '<div class="t-sm"><strong>' + episodes.length + '</strong> episode' + (episodes.length !== 1 ? 's' : '') + ' · ' + totalSickDays + ' sick days' + (mostImpacted ? ' · ' + mostImpacted + ' most hit' : '') + '</div>';

  // Episode details
  if (epEl) {
    var html = '';
    episodeResults.forEach(function(r) {
      html += '<div class="cd-episode">';
      html += '<div class="cd-episode-title">' + r.emoji + ' ' + escHtml(r.type.charAt(0).toUpperCase() + r.type.slice(1)) + ' <span class="cd-episode-date">(' + formatDate(r.startDate) + ' – ' + formatDate(r.endDate) + ' · ' + r.duration + 'd)</span></div>';

      if (r.domains.sleep) {
        var sc = r.domains.sleep;
        var col = sc.delta < -5 ? 'var(--tc-rose)' : sc.delta > 5 ? 'var(--tc-sage)' : 'var(--light)';
        html += '<div class="cd-episode-row"><div class="cd-episode-domain">Sleep</div><div class="cd-episode-vals">' + sc.before + ' → ' + sc.during + '</div><div class="cd-episode-delta" style="color:' + col + ';">' + (sc.delta >= 0 ? '+' : '') + sc.delta + '</div></div>';
      }
      if (r.domains.diet) {
        var dc = r.domains.diet;
        var dCol = dc.deltaPct < -20 ? 'var(--tc-rose)' : 'var(--light)';
        html += '<div class="cd-episode-row"><div class="cd-episode-domain">Diet</div><div class="cd-episode-vals">' + dc.before + ' → ' + dc.during + ' foods/day</div><div class="cd-episode-delta" style="color:' + dCol + ';">' + (dc.deltaPct >= 0 ? '+' : '') + dc.deltaPct + '%</div></div>';
      }
      if (r.domains.poop) {
        var pc = r.domains.poop;
        var pCol = pc.delta < -5 ? 'var(--tc-rose)' : pc.delta > 5 ? 'var(--tc-sage)' : 'var(--light)';
        html += '<div class="cd-episode-row"><div class="cd-episode-domain">Poop</div><div class="cd-episode-vals">' + pc.before + ' → ' + pc.during + '</div><div class="cd-episode-delta" style="color:' + pCol + ';">' + (pc.delta >= 0 ? '+' : '') + pc.delta + '</div></div>';
      }
      if (r.domains.activity) {
        var ac = r.domains.activity;
        var aCol = ac.deltaPct < -30 ? 'var(--tc-rose)' : 'var(--light)';
        html += '<div class="cd-episode-row"><div class="cd-episode-domain">Activity</div><div class="cd-episode-vals">' + ac.before + ' → ' + ac.during + '/day</div><div class="cd-episode-delta" style="color:' + aCol + ';">' + (ac.deltaPct >= 0 ? '+' : '') + ac.deltaPct + '%</div></div>';
      }
      html += '</div>';
    });
    epEl.innerHTML = html;
  }

  // Aggregate
  if (aggEl) {
    var aHtml = '<div class="cd-section-label">Aggregate (90 days)</div>';
    aHtml += '<div class="si-stat-grid">';
    aHtml += '<div class="si-stat"><div class="si-stat-val">' + totalSickDays + '</div><div class="si-stat-label">Total sick days</div></div>';
    aHtml += '<div class="si-stat"><div class="si-stat-val">' + episodes.length + '</div><div class="si-stat-label">Episodes</div></div>';
    aHtml += '</div>';

    if (domainImpacts.sleep.length > 0) {
      var avgSleepImpact = Math.round(domainImpacts.sleep.reduce(function(a, b) { return a + b; }, 0) / domainImpacts.sleep.length);
      aHtml += '<div class="cd-meta">Avg sleep impact: ' + (avgSleepImpact >= 0 ? '+' : '') + avgSleepImpact + ' pts during illness</div>';
    }
    aggEl.innerHTML = aHtml;
  }

  // Insights
  if (insEl) {
    var iHtml = '';
    if (mostImpacted) {
      iHtml += '<div class="si-insight si-insight-warn">' + escHtml(mostImpacted.charAt(0).toUpperCase() + mostImpacted.slice(1)) + ' is the most affected domain during illness</div>';
    }
    if (domainImpacts.sleep.length > 0) {
      var avgSI = Math.round(domainImpacts.sleep.reduce(function(a, b) { return a + b; }, 0) / domainImpacts.sleep.length);
      if (avgSI < -10) {
        iHtml += '<div class="si-insight si-insight-info">Sleep takes the biggest hit during illness (' + avgSI + ' pts avg) — expect disrupted nights for a few days post-recovery</div>';
      }
    }
    if (!iHtml) {
      iHtml = '<div class="si-insight si-insight-info">Illness impact data is building — patterns will emerge with more episodes</div>';
    }
    insEl.innerHTML = iHtml;
  }
}

// ════════════════════════════════════════
// Card 6: Milestone Burst ↔ Sleep Regression
// ════════════════════════════════════════

function renderInfoMilestoneSleepCorrelation() {
  var sumEl = document.getElementById('infoMilestoneSleepSummary');
  var tlEl = document.getElementById('infoMilestoneSleepTimeline');
  var burstEl = document.getElementById('infoMilestoneSleepBursts');
  var insEl = document.getElementById('infoMilestoneSleepInsights');
  if (!sumEl) return;

  // Build weekly data for last 60 days (8-9 weeks)
  var weeks = [];
  var now = new Date();
  var numWeeks = 8;

  for (var w = numWeeks - 1; w >= 0; w--) {
    var weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (w * 7));
    var weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    var evidenceCount = 0;
    var sleepScores = [];
    var domainEvidence = {};

    for (var d = 0; d < 7; d++) {
      var day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      var ds = toDateStr(day);

      // Count milestone evidence from activity log
      var entries = Array.isArray(activityLog[ds]) ? activityLog[ds] : [];
      entries.forEach(function(e) {
        var evCount = Array.isArray(e.evidence) ? e.evidence.length : 0;
        evidenceCount += evCount;
        if (evCount > 0 && Array.isArray(e.domains)) {
          e.domains.forEach(function(dom) {
            domainEvidence[dom] = (domainEvidence[dom] || 0) + evCount;
          });
        }
      });

      // Sleep score
      var sc = getDailySleepScore(ds);
      if (sc) sleepScores.push(sc.score);
    }

    var avgSleep = sleepScores.length > 0 ? Math.round(sleepScores.reduce(function(a, b) { return a + b; }, 0) / sleepScores.length) : null;

    weeks.push({
      weekNum: numWeeks - w,
      startDate: toDateStr(weekStart),
      endDate: toDateStr(weekEnd),
      evidence: evidenceCount,
      avgSleep: avgSleep,
      domains: domainEvidence
    });
  }

  // Check minimum data
  var weeksWithBothData = weeks.filter(function(w) { return w.evidence > 0 && w.avgSleep !== null; });
  if (weeksWithBothData.length < 4) {
    sumEl.innerHTML = '<div class="si-nodata">Need at least 4 weeks of activity + sleep data for milestone-sleep analysis</div>';
    if (tlEl) tlEl.innerHTML = '';
    if (burstEl) burstEl.innerHTML = '';
    if (insEl) insEl.innerHTML = '';
    return;
  }

  // Compute moving averages (2-week window)
  for (var i = 0; i < weeks.length; i++) {
    var windowEvidence = [];
    var windowSleep = [];
    for (var j = Math.max(0, i - 1); j <= i; j++) {
      windowEvidence.push(weeks[j].evidence);
      if (weeks[j].avgSleep !== null) windowSleep.push(weeks[j].avgSleep);
    }
    weeks[i].maEvidence = Math.round(windowEvidence.reduce(function(a, b) { return a + b; }, 0) / windowEvidence.length);
    weeks[i].maSleep = windowSleep.length > 0 ? Math.round(windowSleep.reduce(function(a, b) { return a + b; }, 0) / windowSleep.length) : null;
  }

  // Flag bursts (evidence ≥ 2× moving average) and regressions (sleep ≥ 10 below MA)
  var bursts = [];
  var regressions = [];
  weeks.forEach(function(w) {
    w.isBurst = w.maEvidence > 0 && w.evidence >= w.maEvidence * 2 && w.evidence >= 4;
    w.isRegression = w.maSleep !== null && w.avgSleep !== null && (w.maSleep - w.avgSleep) >= 10;
    if (w.isBurst) bursts.push(w);
    if (w.isRegression) regressions.push(w);
  });

  // Check co-occurrence (burst within ±1 week of regression)
  var coOccurrences = 0;
  bursts.forEach(function(b) {
    var bIdx = weeks.indexOf(b);
    for (var k = Math.max(0, bIdx - 1); k <= Math.min(weeks.length - 1, bIdx + 1); k++) {
      if (weeks[k].isRegression) { coOccurrences++; break; }
    }
  });

  sumEl.innerHTML = '<div class="t-sm"><strong>' + bursts.length + '</strong> burst' + (bursts.length !== 1 ? 's' : '') + ' detected · <strong>' + coOccurrences + '</strong> overlap' + (coOccurrences !== 1 ? 's' : '') + ' with sleep dips</div>';

  // Timeline
  if (tlEl) {
    var html = '<div class="cd-section-label">Weekly Timeline</div>';
    html += '<div class="cd-timeline-row cd-timeline-hdr"><div>Week</div><div>Evidence</div><div>Sleep</div><div>Burst</div><div>Dip</div></div>';
    weeks.forEach(function(w) {
      html += '<div class="cd-timeline-row">';
      html += '<div class="cd-tl-week">W' + w.weekNum + '</div>';
      html += '<div' + (w.isBurst ? ' class="cd-burst"' : '') + '>' + w.evidence + '</div>';
      html += '<div' + (w.isRegression ? ' class="cd-regr"' : '') + '>' + (w.avgSleep !== null ? w.avgSleep : '–') + '</div>';
      html += '<div>' + (w.isBurst ? '★' : '·') + '</div>';
      html += '<div>' + (w.isRegression ? zi('warn') : '·') + '</div>';
      html += '</div>';
    });
    tlEl.innerHTML = html;
  }

  // Burst analysis
  if (burstEl) {
    var bHtml = '';
    if (bursts.length > 0) {
      bHtml += '<div class="cd-section-label">Burst Analysis</div>';
      bursts.forEach(function(b) {
        var topDomain = '';
        var maxEv = 0;
        Object.keys(b.domains).forEach(function(dom) {
          if (b.domains[dom] > maxEv) { maxEv = b.domains[dom]; topDomain = dom; }
        });
        var bIdx = weeks.indexOf(b);
        var hadRegression = false;
        for (var k = Math.max(0, bIdx - 1); k <= Math.min(weeks.length - 1, bIdx + 1); k++) {
          if (weeks[k].isRegression) hadRegression = true;
        }
        bHtml += '<div class="cd-episode">';
        bHtml += '<div class="cd-episode-title">★ W' + b.weekNum + (topDomain ? ' — ' + topDomain + ' burst' : '') + ' (' + b.evidence + ' evidence)</div>';
        if (hadRegression) {
          bHtml += '<div class="cd-burst-note-neg">Sleep dip detected near this burst</div>';
        } else {
          bHtml += '<div class="cd-burst-note-pos">No sleep disruption around this burst</div>';
        }
        bHtml += '</div>';
      });
    } else {
      bHtml += '<div class="si-nodata">No milestone bursts detected yet — keep logging activities</div>';
    }
    burstEl.innerHTML = bHtml;
  }

  // Insights
  if (insEl) {
    var iHtml = '';
    if (bursts.length > 0 && coOccurrences > 0) {
      var rate = Math.round((coOccurrences / bursts.length) * 100);
      iHtml += '<div class="si-insight si-insight-warn">' + coOccurrences + ' of ' + bursts.length + ' milestone bursts coincided with sleep disruption (' + rate + '%) — consistent with developmental leap patterns</div>';
    } else if (bursts.length > 0 && coOccurrences === 0) {
      iHtml += '<div class="si-insight si-insight-good">Milestone bursts detected without sleep disruption — Ziva handles developmental leaps well</div>';
    }
    if (bursts.length === 0 && weeksWithBothData.length >= 4) {
      iHtml += '<div class="si-insight si-insight-info">No milestone bursts detected in the last ' + numWeeks + ' weeks — steady development pace</div>';
    }
    if (!iHtml) {
      iHtml = '<div class="si-insight si-insight-info">More weeks of data will improve burst detection accuracy</div>';
    }
    insEl.innerHTML = iHtml;
  }
}

function renderInfo() {
  renderInfoFoodIntro();
  renderInfoNutrientHeatmap();
  renderInfoComboFreq();
  renderInfoMealBreakdown();
  renderInfoSmartPairing();
  renderInfoAdoption();
  renderInfoRepetition();
  renderInfoTexture();
  renderInfoSleepBedtimeDrift();
  renderInfoSleepEfficiency();
  renderInfoSleepWakeWindows();
  renderInfoSleepReport();
  renderInfoSleepNapTransition();
  renderInfoSleepDayNight();
  renderInfoSleepBestNight();
  renderInfoSleepRegression();
  renderInfoPoopConsistencyTrend();
  renderInfoPoopFrequency();
  renderInfoPoopFoodDelay();
  renderInfoPoopFoodWatch();
  renderInfoPoopColorAnomaly();
  renderInfoPoopAmountTrend();
  renderInfoPoopSymptoms();
  renderInfoPoopReport();
  renderInfoIllnessFreq();
  renderInfoVaccFever();
  renderInfoIllnessFood();
  renderInfoRecovery();
  renderInfoIllnessSleep();
  renderInfoFoodReaction();
  renderInfoHydration();
  renderInfoSupplementAdherence();
  renderInfoVaccRecovery();
  renderInfoGrowthVelocity();
  renderInfoFoodPoopPipeline();
  renderInfoSleepFeeding();
  renderInfoActivitySleepDeep();
  renderInfoGrowthDiet();
  renderInfoIllnessImpact();
  renderInfoMilestoneSleepCorrelation();
  renderInfoActivityConsistency();
  renderInfoMilestoneVelocity();
  renderInfoActivityCorrelation();
  renderInfoVisitPrep();
}

function renderInfoFoodIntro() {
  const data = computeIntroductionRate();
  const summaryEl = document.getElementById('infoFoodIntroSummary');
  const chartEl = document.getElementById('infoFoodIntroChart');
  const tryEl = document.getElementById('infoFoodIntroTry');
  if (!summaryEl) return;

  // Trend badge
  const trendConfig = {
    accelerating: { icon: '↗', color: 'var(--tc-sage)', label: 'Accelerating' },
    steady:       { icon: '→', color: 'var(--light)',   label: 'Steady' },
    slowing:      { icon: '↘', color: 'var(--tc-amber)',label: 'Slowing' },
    'no data':    { icon: '–', color: 'var(--light)',   label: 'No data' }
  };
  const t = trendConfig[data.trend] || trendConfig['steady'];

  // Summary line
  summaryEl.innerHTML = `
    <div class="fx-row g12 fx-row-wrap" >
      <div class="t-base fw-600" >${data.thisWeek.count} new this week</div>
      <div class="t-sm t-light" >·</div>
      <div class="t-sm t-light" >${data.total} total introduced</div>
      <div class="t-sm t-light" >·</div>
      <div class="t-sm" style="color:${t.color};font-weight:500;">${t.icon} ${t.label}</div>
    </div>
  `;

  // Week-by-week bar chart (last 8 weeks max)
  const displayWeeks = data.weeks.slice(-8);
  const maxCount = Math.max(...displayWeeks.map(w => w.count), 1);

  let chartHtml = '<div class="t-sm fe-sub-label" >Weekly Introduction Rate</div>';
  chartHtml += '<div class="info-intro-chart">';
  displayWeeks.forEach(w => {
    const pct = Math.max((w.count / maxCount) * 100, 4);
    const weekDate = new Date(w.weekStart);
    const label = weekDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const foodNames = w.foods.map(f => f.name).join(', ') || 'None';
    chartHtml += `
      <div class="info-intro-bar-col" title="${foodNames}">
        <div class="t-xs" style="color:var(--mid);font-weight:600;">${w.count}</div>
        <div class="info-intro-bar-track">
          <div class="info-intro-bar" style="height:${pct}%"></div>
        </div>
        <div class="t-xs t-light" >${label}</div>
      </div>`;
  });
  chartHtml += '</div>';

  // This week's foods detail
  if (data.thisWeek.foods.length > 0) {
    chartHtml += '<div class="fx-wrap g4 mt-8">';
    data.thisWeek.foods.forEach(f => {
      const rxClass = f.reaction === 'watch' ? 'is-warn' : 'is-sage';
      chartHtml += `<span class="info-food-chip ${rxClass}">${escHtml(f.name)}</span>`;
    });
    chartHtml += '</div>';
  }

  chartEl.innerHTML = chartHtml;

  // "Foods to Try" suggestions
  const suggestions = getUntriedSuggestions(5);
  let tryHtml = '<div class="t-sm fe-sub-label" >Foods to Try Next</div>';
  if (suggestions.length === 0) {
    tryHtml += '<div class="t-sm t-light">Amazing — you\'ve covered the full taxonomy!</div>';
  } else {
    tryHtml += '<div class="fx-col g4">';
    suggestions.forEach(s => {
      tryHtml += `
        <div class="list-item li-row">
          <div class="li-body">
            <strong>${escHtml(s.name)}</strong>
            <span class="t-sm t-light">${escHtml(s.groupLabel)} · ${escHtml(s.reason)}</span>
          </div>
        </div>`;
    });
    tryHtml += '</div>';
  }

  tryEl.innerHTML = tryHtml;
}

// ── FOOD INTELLIGENCE: WEEKLY NUTRIENT HEATMAP ──

const HEATMAP_NUTRIENTS = [
  { key: 'iron',      label: 'Iron',    cssClass: 'nh-row-iron',    emoji: zi('drop') },
  { key: 'calcium',   label: 'Calcium', cssClass: 'nh-row-calcium', emoji: zi('ruler') },
  { key: 'protein',   label: 'Protein', cssClass: 'nh-row-protein', emoji: zi('run') },
  { key: 'vitamin C', label: 'Vit C',   cssClass: 'nh-row-vitc',    emoji: zi('bowl') },
  { key: 'fibre',     label: 'Fibre',   cssClass: 'nh-row-fibre',   emoji: zi('bowl') },
  { key: 'vitamin A', label: 'Vit A',   cssClass: 'nh-row-vita',    emoji: zi('bowl') },
  { key: 'omega-3',   label: 'Omega-3', cssClass: 'nh-row-omega3',  emoji: zi('bowl') },
  { key: 'zinc',      label: 'Zinc',    cssClass: 'nh-row-zinc',    emoji: zi('bowl') },
];

function computeNutrientHeatmap(windowDays) {
  windowDays = windowDays || 7;
  const todayDate = new Date(today());
  const days = [];
  const grid = {}; // nutrient → [count per day]
  const foodSources = {}; // 'nutrient:dayIdx' → [food names]
  const hasData = []; // per day: true if any meal logged

  HEATMAP_NUTRIENTS.forEach(n => { grid[n.key] = []; });

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayIdx = windowDays - 1 - i;
    days.push(ds);

    // Count nutrients for this day
    const nutCount = {};
    const nutFoods = {};
    HEATMAP_NUTRIENTS.forEach(n => { nutCount[n.key] = 0; nutFoods[n.key] = []; });

    const entry = feedingData[ds];
    let dayHasMeals = false;
    if (entry) {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        if (!isRealMeal(entry[meal])) return;
        dayHasMeals = true;
        const items = parseMealNutrition(entry[meal]);
        items.forEach(item => {
          (item.nutrients || []).forEach(n => {
            if (nutCount.hasOwnProperty(n)) {
              nutCount[n]++;
              if (!nutFoods[n].includes(item.food)) nutFoods[n].push(item.food);
            }
          });
        });
      });
    }
    hasData.push(dayHasMeals);

    HEATMAP_NUTRIENTS.forEach(n => {
      grid[n.key].push(nutCount[n.key]);
      foodSources[n.key + ':' + dayIdx] = nutFoods[n.key];
    });
  }

  // Summary stats — only count days with data
  const daysWithData = hasData.filter(Boolean).length;
  const gaps = [];
  const strong = [];
  HEATMAP_NUTRIENTS.forEach(n => {
    const daysHit = grid[n.key].filter((v, i) => v > 0 && hasData[i]).length;
    if (daysWithData >= 3 && daysHit <= 1) gaps.push(n.label);
    if (daysWithData >= 5 && daysHit >= Math.min(5, daysWithData)) strong.push(n.label);
  });

  return { days, grid, foodSources, gaps, strong, hasData, daysWithData };
}

function renderInfoNutrientHeatmap() {
  const data = computeNutrientHeatmap(7);
  const summaryEl = document.getElementById('infoHeatmapSummary');
  const gridEl = document.getElementById('infoHeatmapGrid');
  const detailEl = document.getElementById('infoHeatmapDetail');
  if (!summaryEl) return;

  // Summary line
  let summaryText;
  if (data.daysWithData === 0) {
    summaryText = '<span class="t-light">No meals logged this week — start logging to see nutrient coverage</span>';
  } else if (data.gaps.length === 0) {
    summaryText = `<span class="stat-val-sage">Good coverage</span> <span class="t-light">· ${data.daysWithData} day${data.daysWithData > 1 ? 's' : ''} tracked</span>`;
  } else {
    summaryText = `<span class="stat-val-amber">${data.gaps.length} gap${data.gaps.length > 1 ? 's' : ''}</span> <span class="t-light">· ${data.gaps.join(', ')}</span>`;
  }
  summaryEl.innerHTML = `<div class="t-sm">${summaryText}</div>`;

  // Day headers
  let gridHtml = '<div class="nh-grid">';
  gridHtml += '<div class="nh-header"></div>';
  data.days.forEach((ds, i) => {
    const d = new Date(ds);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
    const isToday = ds === today();
    const noData = !data.hasData[i];
    gridHtml += `<div class="nh-header" style="${isToday ? 'color:var(--tc-rose);font-weight:700;' : ''}${noData ? 'opacity:0.4;' : ''}">${dayName}</div>`;
  });

  // Nutrient rows
  HEATMAP_NUTRIENTS.forEach(n => {
    gridHtml += `<div class="nh-label">${n.emoji} ${n.label}</div>`;
    data.grid[n.key].forEach((count, dayIdx) => {
      const noData = !data.hasData[dayIdx];
      const foods = data.foodSources[n.key + ':' + dayIdx] || [];

      if (noData) {
        // No meals logged — distinct "no data" cell
        gridHtml += `<div class="nh-cell nh-nodata" title="No meals logged">–</div>`;
      } else if (count === 0) {
        // Meals logged but nutrient absent — real gap
        gridHtml += `<div class="nh-cell nh-0 ${n.cssClass}" title="Gap" onclick="showHeatmapDetail('${n.key}',${dayIdx},'${data.days[dayIdx]}')">·</div>`;
      } else {
        // Nutrient present — colored fill, tap to see sources
        const level = count <= 2 ? 1 : count <= 4 ? 2 : 3;
        gridHtml += `<div class="nh-cell nh-${level} ${n.cssClass}" title="${foods.join(', ')}" onclick="showHeatmapDetail('${n.key}',${dayIdx},'${data.days[dayIdx]}')"></div>`;
      }
    });
  });
  gridHtml += '</div>';

  // Legend
  gridHtml += `<div class="fx-row g8 mt-8" style="align-items:center;justify-content:center;flex-wrap:wrap;">
    <div class="nh-cell nh-nodata" style="width:18px;height:18px;min-height:auto;font-size:var(--fs-2xs);aspect-ratio:auto;">–</div><span class="t-xs t-light">No data</span>
    <div class="nh-cell nh-0" style="width:18px;height:18px;min-height:auto;font-size:var(--fs-2xs);aspect-ratio:auto;">·</div><span class="t-xs t-light">Gap</span>
    <div style="width:18px;height:18px;border-radius:var(--r-sm);background:rgba(140,190,160,0.25);"></div><span class="t-xs t-light">Some</span>
    <div style="width:18px;height:18px;border-radius:var(--r-sm);background:rgba(140,190,160,0.55);"></div><span class="t-xs t-light">Good</span>
    <div style="width:18px;height:18px;border-radius:var(--r-sm);background:rgba(140,190,160,0.85);"></div><span class="t-xs t-light">Rich</span>
  </div>`;

  gridEl.innerHTML = gridHtml;

  // Strong nutrients callout
  if (data.strong.length > 0) {
    detailEl.innerHTML = `<div class="t-sm t-sage" ><strong>Strong this week:</strong> ${data.strong.join(', ')}</div>`;
  } else {
    detailEl.innerHTML = '';
  }
}

// Tap-to-reveal: show which foods provided a nutrient on a specific day
let _nhDetailOpen = null;
function showHeatmapDetail(nutrientKey, dayIdx, dateStr) {
  const data = computeNutrientHeatmap(7);
  const foods = data.foodSources[nutrientKey + ':' + dayIdx] || [];
  const count = data.grid[nutrientKey][dayIdx] || 0;
  const nutInfo = HEATMAP_NUTRIENTS.find(n => n.key === nutrientKey);
  const dayLabel = new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  const detailEl = document.getElementById('infoHeatmapDetail');
  if (!detailEl) return;

  const detailId = nutrientKey + ':' + dayIdx;
  if (_nhDetailOpen === detailId) {
    const panel = detailEl.querySelector('.nh-detail-panel');
    if (panel) panel.classList.remove('open');
    _nhDetailOpen = null;
    return;
  }
  _nhDetailOpen = detailId;

  let content;
  if (foods.length > 0) {
    content = `<strong>${nutInfo.emoji} ${nutInfo.label}</strong> on ${dayLabel} — from ${foods.join(', ')} (${count} source${count > 1 ? 's' : ''})`;
  } else {
    content = `<strong>${nutInfo.emoji} ${nutInfo.label}</strong> on ${dayLabel} — no sources in logged meals. Try adding ${nutInfo.key === 'iron' ? 'ragi, spinach, or dal' : nutInfo.key === 'calcium' ? 'curd, paneer, or ragi' : nutInfo.key === 'omega-3' ? 'walnut, flaxseed, or ghee' : nutInfo.key === 'zinc' ? 'dal, oats, or sesame' : 'more variety'}.`;
  }

  detailEl.innerHTML = `<div class="nh-detail-panel open">${content}</div>`;
}

// ── FOOD INTELLIGENCE: COMBO FREQUENCY ──

function computeFoodCombos(windowDays) {
  windowDays = windowDays || 30;
  const todayDate = new Date(today());
  const pairCounts = {}; // "food1|food2" → { count, meals: [{date, meal}], dates:[] }
  let totalMeals = 0;

  // Track per-day meal combos for streak detection
  const dayMealPairs = {}; // date → Set of pair keys

  for (let i = 0; i < windowDays; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (!entry) continue;

    if (!dayMealPairs[ds]) dayMealPairs[ds] = new Set();

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      if (!isRealMeal(entry[meal])) return;
      totalMeals++;

      const mealFoods = [];
      entry[meal].split(/[,+]/).forEach(f => {
        const clean = f.trim().toLowerCase();
        if (clean.length > 1) mealFoods.push(clean);
      });

      for (let a = 0; a < mealFoods.length; a++) {
        for (let b = a + 1; b < mealFoods.length; b++) {
          const pair = [mealFoods[a], mealFoods[b]].sort().join('|');
          if (!pairCounts[pair]) pairCounts[pair] = { count: 0, meals: [], dates: [] };
          pairCounts[pair].count++;
          if (pairCounts[pair].meals.length < 5) {
            pairCounts[pair].meals.push({ date: ds, meal });
          }
          if (!pairCounts[pair].dates.includes(ds)) pairCounts[pair].dates.push(ds);
          dayMealPairs[ds].add(pair);
        }
      }
    });
  }

  // Cross-reference with poop correlations
  let poopFlags = {};
  try {
    const corr = computeFoodPoopCorrelations();
    if (corr && corr.results) {
      corr.results.forEach(r => { poopFlags[r.food] = r.status; });
    }
  } catch (e) {}

  // Get nutrient gaps for scoring
  const heatmap = computeNutrientHeatmap(7);
  const currentGaps = new Set((heatmap.gaps || []).map(g => g.toLowerCase()));

  // Enrich each pair with nutritional intelligence
  const allPairs = Object.entries(pairCounts).map(([key, val]) => {
    const [food1, food2] = key.split('|');
    const items1 = parseMealNutrition(food1);
    const items2 = parseMealNutrition(food2);
    const allNutrients = [...new Set([...items1.flatMap(i => i.nutrients || []), ...items2.flatMap(i => i.nutrients || [])])];
    const allTags = [...new Set([...items1.flatMap(i => i.tags || []), ...items2.flatMap(i => i.tags || [])])];

    // Nutrient density: count of key nutrients covered
    const KEY_NUT = ['iron','calcium','protein','vitamin C','fibre','vitamin A','omega-3','zinc'];
    const keyNutsHit = KEY_NUT.filter(n => allNutrients.includes(n));
    const density = keyNutsHit.length;

    // Synergy check
    const synergy = getSynergy(food1, food2);

    // Gap-filling
    const gapsFilled = allNutrients.filter(n => currentGaps.has(n.toLowerCase()));

    // Poop flags
    const flag1 = poopFlags[food1];
    const flag2 = poopFlags[food2];
    const poopSafe = !flag1 && !flag2;
    const poopRisk = (flag1 === 'likely' || flag1 === 'suspected' || flag2 === 'likely' || flag2 === 'suspected');

    // Iron + VitC synergy (even if not in FOOD_SYNERGIES)
    const hasIronVitC = (allTags.includes('iron-rich') || allNutrients.includes('iron')) &&
                        (allNutrients.includes('vitamin C') || allTags.includes('vitamin-C') || allTags.includes('iron-absorption'));

    // Frequency verdict
    let freqVerdict, freqColor;
    if (val.count >= 8) { freqVerdict = 'Very frequent'; freqColor = 'var(--tc-amber)'; }
    else if (val.count >= 5) { freqVerdict = 'Frequent'; freqColor = 'var(--tc-sage)'; }
    else if (val.count >= 2) { freqVerdict = 'Regular'; freqColor = 'var(--mid)'; }
    else { freqVerdict = 'Tried once'; freqColor = 'var(--light)'; }

    // Recommendation
    let recommendation, recIcon;
    if (poopRisk) {
      recommendation = 'Reduce — linked to poop issues';
      recIcon = zi('warn');
    } else if (synergy && density >= 3) {
      recommendation = val.count >= 8 ? 'Great combo but vary meals too' : 'Excellent — increase frequency';
      recIcon = zi('star');
    } else if (synergy || hasIronVitC) {
      recommendation = val.count >= 8 ? 'Good synergy — maintain but add variety' : 'Good synergy — can increase';
      recIcon = zi('check');
    } else if (density >= 4) {
      recommendation = val.count >= 8 ? 'Nutrient-dense but overused — rotate alternatives' : 'Nutrient-dense — great to continue';
      recIcon = zi('check');
    } else if (density >= 2) {
      recommendation = val.count >= 8 ? 'Decent but repetitive — try swapping one food' : 'Decent — keep in rotation';
      recIcon = zi('check');
    } else if (density <= 1 && val.count >= 3) {
      recommendation = 'Low nutrient density — pair with iron/calcium source';
      recIcon = zi('chart');
    } else {
      recommendation = density === 0 ? 'Unknown nutrition — tag these foods' : 'OK — keep exploring';
      recIcon = zi('warn');
    }

    // Streak detection: consecutive days this pair appeared
    let maxStreak = 0, currentStreak = 0;
    const sortedDates = val.dates.sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { currentStreak = 1; }
      else {
        const prev = new Date(sortedDates[i - 1]);
        const cur = new Date(sortedDates[i]);
        const diff = Math.round((cur - prev) / 86400000);
        currentStreak = diff === 1 ? currentStreak + 1 : 1;
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    }

    return {
      food1, food2, count: val.count, meals: val.meals, dates: val.dates,
      density, keyNutsHit, synergy, gapsFilled, hasIronVitC,
      poopSafe, poopRisk, flag1, flag2,
      freqVerdict, freqColor, recommendation, recIcon,
      maxStreak, allNutrients, allTags,
    };
  });

  allPairs.sort((a, b) => b.count - a.count);

  const topPairs = allPairs.filter(p => p.count >= 2).slice(0, 10);
  const oncePairs = allPairs.filter(p => p.count === 1).slice(0, 6);
  const totalUniquePairs = allPairs.length;

  const ruttiness = totalMeals > 0 && topPairs.length > 0
    ? Math.round((topPairs[0].count / totalMeals) * 100) : 0;
  const uniqueness = totalMeals > 0
    ? Math.round((totalUniquePairs / totalMeals) * 100) : 0;

  // Best combo (highest density + synergy)
  const bestCombo = [...allPairs].sort((a, b) => {
    const sa = (a.density * 2) + (a.synergy ? 5 : 0) + (a.hasIronVitC ? 3 : 0) - (a.poopRisk ? 10 : 0);
    const sb = (b.density * 2) + (b.synergy ? 5 : 0) + (b.hasIronVitC ? 3 : 0) - (b.poopRisk ? 10 : 0);
    return sb - sa;
  })[0] || null;

  return { topPairs, oncePairs, totalUniquePairs, totalMeals, ruttiness, uniqueness, poopFlags, bestCombo };
}

function renderInfoComboFreq() {
  const data = computeFoodCombos(30);
  const summaryEl = document.getElementById('infoComboSummary');
  const topEl = document.getElementById('infoComboTop');
  const onceEl = document.getElementById('infoComboOnce');
  if (!summaryEl) return;

  if (data.totalMeals === 0) {
    summaryEl.innerHTML = '<div class="t-sm t-light">No meals logged yet</div>';
    topEl.innerHTML = '';
    onceEl.innerHTML = '';
    return;
  }

  // Summary with best combo highlight
  let summaryHtml = `<div class="fx-row g12 fx-row-wrap" >
    <div class="t-sm"><strong>${data.totalUniquePairs}</strong> <span class="t-light">unique combos from ${data.totalMeals} meals</span></div>
    <div class="t-sm t-light" >·</div>
    <div class="t-sm" style="color:${data.uniqueness >= 60 ? 'var(--tc-sage)' : data.uniqueness >= 35 ? 'var(--tc-amber)' : 'var(--tc-rose)'};font-weight:600;">${data.uniqueness}% variety</div>
  </div>`;
  if (data.bestCombo && data.bestCombo.density >= 3) {
    summaryHtml += `<div class="t-xs mt-4 t-sage" >${zi('star')} Best combo: <strong>${escHtml(data.bestCombo.food1)} + ${escHtml(data.bestCombo.food2)}</strong> (${data.bestCombo.density} key nutrients${data.bestCombo.synergy ? ' + synergy' : ''})</div>`;
  }
  summaryEl.innerHTML = summaryHtml;

  // Top combos with full intelligence
  let topHtml = '<div class="t-sm fe-sub-label" >Most Frequent Pairs</div>';
  if (data.topPairs.length === 0) {
    topHtml += '<div class="t-sm t-light">Not enough data yet — need meals with 2+ foods</div>';
  } else {
    topHtml += '<div class="fx-col g8">';
    data.topPairs.forEach(p => {
      const barPct = Math.max((p.count / data.topPairs[0].count) * 100, 8);

      // Nutrient badges
      let nutBadges = '';
      if (p.keyNutsHit.length > 0) {
        const NUT_EMOJI = { iron:zi('drop'), calcium:zi('ruler'), protein:zi('run'), 'vitamin C':zi('bowl'), fibre:zi('bowl'), 'vitamin A':zi('bowl'), 'omega-3':zi('bowl'), zinc:zi('bowl') };
        nutBadges = p.keyNutsHit.slice(0, 4).map(n => `<span title="${n}">${NUT_EMOJI[n] || '•'}</span>`).join('');
      }

      // Synergy badge
      let synergyBadge = '';
      if (p.synergy) {
        const emoji = p.synergy.type === 'absorption' ? zi('link') : p.synergy.type === 'complete' ? zi('sparkle') : zi('sprout');
        synergyBadge = `<span class="t-xs" style="color:var(--tc-lav);font-weight:600;">${emoji} ${p.synergy.type}</span>`;
      } else if (p.hasIronVitC) {
        synergyBadge = '<span class="t-xs" style="color:var(--tc-lav);font-weight:600;">'+zi('link')+' iron+vitC</span>';
      }

      // Poop badge
      let poopBadge = '';
      if (p.poopRisk) {
        const flagFood = p.flag1 ? p.food1 : p.food2;
        poopBadge = `<span class="t-xs t-rose" >${zi('warn')} ${flagFood} poop issue</span>`;
      }

      // Streak badge
      let streakBadge = '';
      if (p.maxStreak >= 3) {
        streakBadge = `<span class="t-xs t-amber" >${zi('flame')} ${p.maxStreak}-day streak</span>`;
      }

      // Density indicator
      const densityLabel = p.density >= 4 ? 'Nutrient-rich' : p.density >= 2 ? 'Decent' : p.density === 0 ? 'Unknown' : 'Light';
      const densityColor = p.density >= 4 ? 'var(--tc-sage)' : p.density >= 2 ? 'var(--mid)' : 'var(--light)';

      topHtml += `<div class="list-item li-row" style="position:relative;overflow:hidden;flex-wrap:wrap;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${barPct}%;background:var(--sage-light);border-radius:var(--r-xl);z-index:0;"></div>
        <div class="li-body" style="position:relative;z-index:1;min-width:0;">
          <div class="fx-row g4 fx-row-wrap" >
            <strong>${escHtml(p.food1)} + ${escHtml(p.food2)}</strong>
            <span class="t-xs" style="color:${p.freqColor};font-weight:600;">${p.count}×</span>
            ${nutBadges ? `<span class="t-xs">${nutBadges}</span>` : ''}
          </div>
          <div class="fx-row g8" style="flex-wrap:wrap;margin-top:2px;">
            <span class="t-xs" style="color:${densityColor};font-weight:500;">${densityLabel} · ${p.density}/8</span>
            ${synergyBadge}${poopBadge}${streakBadge}
          </div>
          <div class="t-xs" style="margin-top:2px;">${p.recIcon} <span class="t-mid">${p.recommendation}</span></div>
        </div>
      </div>`;
    });
    topHtml += '</div>';
  }
  topEl.innerHTML = topHtml;

  // Tried once — worth revisiting
  let onceHtml = '';
  if (data.oncePairs.length > 0) {
    onceHtml = '<div class="t-sm fe-sub-label" >Tried Once — Worth Revisiting?</div>';
    onceHtml += '<div class="fx-col g4">';
    data.oncePairs.forEach(p => {
      let reason = '';
      if (p.synergy) {
        const emoji = p.synergy.type === 'absorption' ? zi('link') : p.synergy.type === 'complete' ? zi('sparkle') : zi('sprout');
        reason = emoji + ' ' + p.synergy.reason;
      } else if (p.gapsFilled.length > 0) {
        reason = 'Fills gap: ' + p.gapsFilled.slice(0, 2).join(', ');
      } else if (p.hasIronVitC) {
        reason = zi('link') + ' Iron + Vitamin C synergy';
      } else if (p.density >= 4) {
        reason = p.keyNutsHit.slice(0, 3).join(', ');
      } else if (p.poopSafe && p.density > 0) {
        reason = 'No poop issues · ' + p.keyNutsHit.slice(0, 2).join(', ');
      } else {
        reason = 'Try again to build data';
      }

      onceHtml += `<div class="list-item li-row">
        <div class="li-body">
          <strong>${escHtml(p.food1)} + ${escHtml(p.food2)}</strong>
          <span class="t-sm t-light">${reason}${p.density > 0 ? ' · ' + p.density + '/8 nutrients' : ''}</span>
        </div>
      </div>`;
    });
    onceHtml += '</div>';
  }
  onceEl.innerHTML = onceHtml;
}

// ── FOOD INTELLIGENCE: MEAL NUTRIENT BREAKDOWN (Feature 4) ──

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', short: 'B', emoji: zi('sun'), color: 'rgba(240,180,140,0.7)' },
  { key: 'lunch',    label: 'Lunch',     short: 'L', emoji: zi('sun'), color: 'rgba(140,190,160,0.7)' },
  { key: 'dinner',   label: 'Dinner',    short: 'D', emoji: zi('moon'), color: 'rgba(130,185,210,0.7)' },
  { key: 'snack',    label: 'Snack',     short: 'S', emoji: zi('spoon'), color: 'rgba(180,160,220,0.7)' },
];
const KEY_NUTRIENTS_MB = ['iron', 'calcium', 'protein', 'vitamin C', 'fibre', 'vitamin A', 'omega-3', 'zinc'];

function computeMealBreakdown(windowDays) {
  windowDays = windowDays || 7;
  const todayDate = new Date(today());
  // Per-meal aggregate: nutrientHits, totalNutrients, mealCount, uniqueFoods
  const mealStats = {};
  MEAL_SLOTS.forEach(m => {
    mealStats[m.key] = { nutrientHits: {}, totalNutrientCount: 0, mealCount: 0, uniqueFoods: new Set(), dayScores: [] };
    KEY_NUTRIENTS_MB.forEach(n => { mealStats[m.key].nutrientHits[n] = 0; });
  });

  // Per-day breakdown for today's detail view
  const todayBreakdown = {};
  const dailyDistributions = []; // [{date, meals:{breakfast:score,...}, total}]

  for (let i = 0; i < windowDays; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (!entry) continue;

    const dayDist = { date: ds, meals: {}, total: 0 };

    MEAL_SLOTS.forEach(m => {
      const val = entry[m.key];
      if (!isRealMeal(val)) {
        dayDist.meals[m.key] = 0;
        return;
      }
      mealStats[m.key].mealCount++;
      const items = parseMealNutrition(val);
      const dayNutrients = new Set();

      items.forEach(item => {
        if (!mealStats[m.key].uniqueFoods.has(item.food)) mealStats[m.key].uniqueFoods.add(item.food);
        (item.nutrients || []).forEach(n => {
          if (KEY_NUTRIENTS_MB.includes(n)) {
            mealStats[m.key].nutrientHits[n]++;
            dayNutrients.add(n);
          }
        });
      });

      const mealScore = dayNutrients.size; // how many key nutrients this meal hits
      mealStats[m.key].totalNutrientCount += mealScore;
      mealStats[m.key].dayScores.push(mealScore);
      dayDist.meals[m.key] = mealScore;
      dayDist.total += mealScore;

      // Today's detail
      if (i === 0) {
        todayBreakdown[m.key] = {
          foods: items.map(it => it.food),
          nutrients: [...dayNutrients],
          score: mealScore
        };
      }
    });

    if (dayDist.total > 0) dailyDistributions.push(dayDist);
  }

  // Compute per-meal density score (avg nutrients per meal)
  const mealDensity = {};
  let totalAllNutrients = 0;
  MEAL_SLOTS.forEach(m => {
    const s = mealStats[m.key];
    mealDensity[m.key] = s.mealCount > 0 ? +(s.totalNutrientCount / s.mealCount).toFixed(1) : 0;
    totalAllNutrients += s.totalNutrientCount;
  });

  // Distribution: what % of total nutrient hits does each meal carry?
  const distribution = {};
  MEAL_SLOTS.forEach(m => {
    distribution[m.key] = totalAllNutrients > 0
      ? Math.round((mealStats[m.key].totalNutrientCount / totalAllNutrients) * 100)
      : 0;
  });

  // Alerts
  const alerts = [];
  // Check if one meal carries >55% of all nutrition
  MEAL_SLOTS.forEach(m => {
    if (distribution[m.key] > 55 && mealStats[m.key].mealCount >= 3) {
      alerts.push({ type: 'warn', text: `${m.label} carries ${distribution[m.key]}% of all nutrients — try spreading nutrition more evenly across meals.` });
    }
  });
  // Check for consistently empty meals
  MEAL_SLOTS.forEach(m => {
    if (mealStats[m.key].mealCount >= 3 && mealDensity[m.key] < 1) {
      alerts.push({ type: 'warn', text: `${m.label} averages <1 key nutrient per meal — consider adding an iron or calcium source.` });
    }
  });
  // Check for good balance
  const densities = MEAL_SLOTS.map(m => mealDensity[m.key]).filter(d => d > 0);
  if (densities.length >= 3) {
    const max = Math.max(...densities);
    const min = Math.min(...densities);
    if (max - min <= 1.5) {
      alerts.push({ type: 'good', text: 'Nutrients are well distributed across meals — great balance!' });
    }
  }
  // Check for a star meal
  MEAL_SLOTS.forEach(m => {
    if (mealDensity[m.key] >= 4 && mealStats[m.key].mealCount >= 3) {
      alerts.push({ type: 'good', text: `${m.label} is your nutrient powerhouse — averaging ${mealDensity[m.key]} key nutrients per meal.` });
    }
  });

  // Weekly per-meal heatmap data (last 7 days, per meal slot, nutrient density)
  const weeklyGrid = []; // [{date, scores:{breakfast:n, ...}}]
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    const row = { date: ds, scores: {} };
    MEAL_SLOTS.forEach(m => {
      if (!entry || !isRealMeal(entry[m.key])) { row.scores[m.key] = -1; return; } // -1 = no data
      const items = parseMealNutrition(entry[m.key]);
      const nuts = new Set();
      items.forEach(item => { (item.nutrients || []).forEach(n => { if (KEY_NUTRIENTS_MB.includes(n)) nuts.add(n); }); });
      row.scores[m.key] = nuts.size;
    });
    weeklyGrid.push(row);
  }

  return { mealStats, mealDensity, distribution, todayBreakdown, alerts, weeklyGrid, totalAllNutrients };
}

function renderInfoMealBreakdown() {
  const data = computeMealBreakdown(7);
  const summaryEl = document.getElementById('infoMealBreakdownSummary');
  const gridEl = document.getElementById('infoMealBreakdownGrid');
  const alertsEl = document.getElementById('infoMealBreakdownAlerts');
  const weeklyEl = document.getElementById('infoMealBreakdownWeekly');
  if (!summaryEl) return;

  if (data.totalAllNutrients === 0) {
    summaryEl.innerHTML = '<div class="t-sm t-light">No meals with recognized nutrition this week</div>';
    gridEl.innerHTML = '';
    alertsEl.innerHTML = '';
    weeklyEl.innerHTML = '';
    return;
  }

  // Find strongest meal
  let strongest = null; let strongestVal = 0;
  MEAL_SLOTS.forEach(m => {
    if (data.mealDensity[m.key] > strongestVal) { strongestVal = data.mealDensity[m.key]; strongest = m; }
  });

  summaryEl.innerHTML = `<div class="fx-row g12 fx-row-wrap" >
    <div class="t-sm"><strong>${strongest ? strongest.emoji + ' ' + strongest.label : '—'}</strong> <span class="t-light">is the strongest meal</span></div>
    <div class="t-sm t-light" >·</div>
    <div class="t-sm t-light" >${strongestVal} avg nutrients</div>
  </div>`;

  // Per-meal density cards
  const maxDensity = Math.max(...MEAL_SLOTS.map(m => data.mealDensity[m.key]), 1);
  let gridHtml = '<div class="t-sm fe-sub-label" >Nutrient Density by Meal</div>';
  gridHtml += '<div class="mb-meal-grid">';
  MEAL_SLOTS.forEach(m => {
    const density = data.mealDensity[m.key];
    const pct = Math.round((density / 8) * 100); // out of 8 key nutrients max
    const stats = data.mealStats[m.key];
    const topNutrients = Object.entries(stats.nutrientHits).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 3).map(([k]) => k);

    gridHtml += `<div class="mb-meal-card">
      <div class="mb-meal-label">${m.emoji} ${m.label}</div>
      <div class="mb-meal-score" style="color:${density >= 3 ? 'var(--tc-sage)' : density >= 1.5 ? 'var(--tc-amber)' : 'var(--light)'};">${density}</div>
      <div class="mb-meal-nutrients">${topNutrients.length > 0 ? topNutrients.join(', ') : 'no data'}</div>
      <div class="mb-meal-bar" style="width:${Math.max(pct, 4)}%;background:${m.color};"></div>
    </div>`;
  });
  gridHtml += '</div>';

  // Distribution bar
  gridHtml += '<div class="t-sm" style="font-weight:600;color:var(--mid);margin-top:var(--sp-16);margin-bottom:var(--sp-4);">Daily Distribution</div>';
  gridHtml += '<div class="mb-dist-bar">';
  MEAL_SLOTS.forEach(m => {
    const pct = data.distribution[m.key];
    if (pct > 0) {
      gridHtml += `<div class="mb-dist-seg" style="flex:${pct};background:${m.color};" title="${m.label}: ${pct}%">${pct > 12 ? m.short : ''}</div>`;
    }
  });
  gridHtml += '</div>';
  gridHtml += '<div class="fx-row g12 mt-4" style="justify-content:center;flex-wrap:wrap;">';
  MEAL_SLOTS.forEach(m => {
    gridHtml += `<div class="fx-row g4" style="align-items:center;"><div style="width:10px;height:10px;border-radius:var(--r-sm);background:${m.color};"></div><span class="t-xs t-light">${m.short} ${data.distribution[m.key]}%</span></div>`;
  });
  gridHtml += '</div>';

  gridEl.innerHTML = gridHtml;

  // Alerts
  if (data.alerts.length > 0) {
    let alertHtml = '<div class="fx-col g4">';
    data.alerts.forEach(a => {
      const cls = a.type === 'warn' ? 'alert-warn' : 'alert-good';
      const icon = a.type === 'warn' ? zi('warn') : zi('check');
      alertHtml += `<div class="mb-alert-item ${cls}"><span>${icon}</span><span>${a.text}</span></div>`;
    });
    alertHtml += '</div>';
    alertsEl.innerHTML = alertHtml;
  } else {
    alertsEl.innerHTML = '';
  }

  // Weekly mini-heatmap (7 days × 4 meals)
  let weeklyHtml = '<div class="t-sm fe-sub-label" >7-Day Meal Quality</div>';
  // Header row
  weeklyHtml += '<div class="mb-weekly-row">';
  weeklyHtml += '<div></div>';
  MEAL_SLOTS.forEach(m => {
    weeklyHtml += `<div class="t-xs" style="text-align:center;color:var(--light);font-weight:600;">${m.short}</div>`;
  });
  weeklyHtml += '</div>';

  data.weeklyGrid.forEach(row => {
    const d = new Date(row.date);
    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    const isToday = row.date === today();
    weeklyHtml += '<div class="mb-weekly-row">';
    weeklyHtml += `<div class="t-xs" style="color:${isToday ? 'var(--tc-rose)' : 'var(--light)'};font-weight:${isToday ? '700' : '500'};">${dayLabel}</div>`;
    MEAL_SLOTS.forEach((m, mi) => {
      const score = row.scores[m.key];
      if (score === -1) {
        weeklyHtml += '<div class="mb-weekly-cell" style="background:rgba(0,0,0,0.03);color:var(--light);font-size:var(--fs-2xs);">–</div>';
      } else {
        const alpha = score === 0 ? 0.08 : Math.min(0.2 + (score / 8) * 0.6, 0.8);
        const baseColor = MEAL_SLOTS[mi].color.replace(/[\d.]+\)$/, `${alpha})`);
        weeklyHtml += `<div class="mb-weekly-cell" style="background:${baseColor};color:${score >= 3 ? 'var(--tc-sage)' : score > 0 ? 'var(--mid)' : 'var(--light)'};font-size:var(--fs-xs);">${score}</div>`;
      }
    });
    weeklyHtml += '</div>';
  });

  weeklyEl.innerHTML = weeklyHtml;
}

// ── FOOD INTELLIGENCE: SMART PAIRING SUGGESTIONS (Feature 5) ──

function computeSmartPairings() {
  const introducedRaw = (foods || []).map(f => f.name.toLowerCase().trim());
  const introducedSet = new Set(introducedRaw);
  const introducedNormSet = new Set(introducedRaw.map(f => normalizeFoodName(f)));
  const todayFoods = extractDayFoods(today());
  const todayFoodSet = new Set(todayFoods);

  // Current nutrient gaps (from heatmap data)
  const heatmap = computeNutrientHeatmap(7);
  const currentGaps = heatmap.gaps.map(g => g.toLowerCase());
  const gapSet = new Set(currentGaps);

  // Helper: does a meal-logged food string match a synergy base name?
  // Uses normalization so "carrot puree" → "carrot", "moringa" → "drumstick", etc.
  function _mealFoodMatches(mealItem, synergyName) {
    const norm = normalizeFoodName(mealItem);
    if (norm === synergyName || norm.includes(synergyName) || synergyName.includes(norm)) return true;
    // Also check raw (for compound items like "khichdi (masoor dal)")
    if (mealItem.includes(synergyName) || synergyName.includes(mealItem)) return true;
    return false;
  }

  // Khichdi-style compound foods: a single logged item that implies multiple base foods
  const COMPOUND_FOODS = {
    'khichdi': ['rice', 'dal', 'moong dal'],
    'masoor dal khichdi': ['rice', 'masoor dal'],
    'moong dal khichdi': ['rice', 'moong dal'],
    'dal khichdi': ['rice', 'dal'],
    'curd rice': ['rice', 'curd'],
    'dahi rice': ['rice', 'curd'],
    'dal rice': ['rice', 'dal'],
    'idli': ['rice', 'urad dal'],
    'dosa': ['rice', 'urad dal'],
  };

  // Expand a meal-logged food into all base foods it represents
  function _expandMealFood(mealItem) {
    const result = [mealItem];
    for (const [compound, components] of Object.entries(COMPOUND_FOODS)) {
      if (mealItem.includes(compound)) {
        components.forEach(c => result.push(c));
      }
    }
    return result;
  }

  // Expand a meal's food list, deduplicating
  function _expandMealFoods(mealFoods) {
    const all = [];
    mealFoods.forEach(f => _expandMealFood(f).forEach(e => all.push(e)));
    return [...new Set(all)];
  }

  // Build set of synergy keys that have been used in any recent meal
  const usedSynergyKeys = new Set(); // "f1|f2" keys
  const todayDate = new Date(today());
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (!entry) continue;

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      if (!isRealMeal(entry[meal])) return;
      const raw = entry[meal].split(/[,+]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
      const expanded = _expandMealFoods(raw);

      // Check every synergy against this expanded meal
      FOOD_SYNERGIES.forEach(([f1, f2]) => {
        const hasF1 = expanded.some(e => _mealFoodMatches(e, f1));
        const hasF2 = expanded.some(e => _mealFoodMatches(e, f2));
        if (hasF1 && hasF2) {
          usedSynergyKeys.add(f1 + '|' + f2);
        }
      });
    });
  }

  // 1. Classify synergies as used vs unused
  const usedPairs = [];
  const unusedPairs = [];

  FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
    // Check if both synergy foods are introduced (using normalized names)
    const f1Introduced = introducedNormSet.has(f1) || [...introducedSet].some(f => f.includes(f1) || f1.includes(f));
    const f2Introduced = introducedNormSet.has(f2) || [...introducedSet].some(f => f.includes(f2) || f2.includes(f));
    if (!f1Introduced || !f2Introduced) return;

    // Find display names for the matched foods
    const f1Match = [...introducedSet].find(f => normalizeFoodName(f) === f1 || f.includes(f1) || f1.includes(f)) || f1;
    const f2Match = [...introducedSet].find(f => normalizeFoodName(f) === f2 || f.includes(f2) || f2.includes(f)) || f2;

    const paired = usedSynergyKeys.has(f1 + '|' + f2);

    const entry = { food1: f1Match, food2: f2Match, reason, type, synergyFood1: f1, synergyFood2: f2 };

    // Score by: gap-filling (3), today-actionable (2), type=absorption (1)
    let score = 0;
    const n1 = getNutrition(f1Match);
    const n2 = getNutrition(f2Match);
    const allNuts = [...new Set([...(n1?.nutrients || []), ...(n2?.nutrients || [])])];
    const gapsFilled = allNuts.filter(n => gapSet.has(n.toLowerCase()));
    if (gapsFilled.length > 0) { score += gapsFilled.length * 3; entry.gapsFilled = gapsFilled; }
    if (todayFoodSet.has(f1Match) || todayFoodSet.has(f2Match)) score += 2;
    if (type === 'absorption') score += 1;
    entry._score = score;

    if (paired) usedPairs.push(entry);
    else unusedPairs.push(entry);
  });

  unusedPairs.sort((a, b) => b._score - a._score);
  usedPairs.sort((a, b) => b._score - a._score);

  // 2. Gap-filling pairing suggestions (not synergy-based)
  const gapSuggestions = [];
  if (currentGaps.length > 0) {
    currentGaps.forEach(gap => {
      // Find introduced foods that provide this nutrient
      const providers = [...introducedSet].filter(f => {
        const nut = getNutrition(f);
        return nut?.nutrients?.some(n => n.toLowerCase() === gap);
      }).slice(0, 3);
      if (providers.length > 0) {
        gapSuggestions.push({ nutrient: gap, foods: providers });
      }
    });
  }

  // 3. Today-actionable: synergies from today's foods with untried partners
  const todayExpanded = _expandMealFoods(todayFoods);
  const todayActionable = [];
  const seenActionable = new Set();
  todayExpanded.forEach(food => {
    FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
      let match = null, partner = null;
      if (_mealFoodMatches(food, f1)) { match = f1; partner = f2; }
      else if (_mealFoodMatches(food, f2)) { match = f2; partner = f1; }
      if (!match || !partner) return;
      // Partner not already in today's meals
      if (todayExpanded.some(tf => _mealFoodMatches(tf, partner))) return;
      // Partner must be introduced (check normalized)
      if (!introducedNormSet.has(partner) && ![...introducedSet].some(f => f.includes(partner) || partner.includes(f))) return;
      // Deduplicate
      const key = match + '|' + partner;
      if (seenActionable.has(key)) return;
      seenActionable.add(key);
      todayActionable.push({ food: match, partner, reason, type });
    });
  });

  return {
    unusedPairs: unusedPairs.slice(0, 6),
    usedPairs: usedPairs.slice(0, 4),
    gapSuggestions,
    todayActionable: todayActionable.slice(0, 3),
    totalSynergies: FOOD_SYNERGIES.length,
    usedCount: usedPairs.length,
    unusedCount: unusedPairs.length
  };
}

function renderInfoSmartPairing() {
  const data = computeSmartPairings();
  const summaryEl = document.getElementById('infoSmartPairingSummary');
  const topEl = document.getElementById('infoSmartPairingTop');
  const gapsEl = document.getElementById('infoSmartPairingGaps');
  const unusedEl = document.getElementById('infoSmartPairingUnused');
  if (!summaryEl) return;

  const totalKnown = data.usedCount + data.unusedCount;
  if (totalKnown === 0) {
    summaryEl.innerHTML = '<div class="t-sm t-light">Introduce more foods to unlock synergy pairings</div>';
    topEl.innerHTML = '';
    gapsEl.innerHTML = '';
    unusedEl.innerHTML = '';
    return;
  }

  const pctUsed = totalKnown > 0 ? Math.round((data.usedCount / totalKnown) * 100) : 0;
  summaryEl.innerHTML = `<div class="fx-row g12 fx-row-wrap" >
    <div class="t-sm"><strong>${data.usedCount}</strong><span class="t-light"> of ${totalKnown} synergies used</span></div>
    <div class="t-sm t-light" >·</div>
    <div class="t-sm" style="color:${pctUsed >= 50 ? 'var(--tc-sage)' : pctUsed >= 25 ? 'var(--tc-amber)' : 'var(--tc-rose)'};font-weight:600;">${pctUsed}% coverage</div>
  </div>`;

  // Today's actionable pairings
  let topHtml = '';
  if (data.todayActionable.length > 0) {
    topHtml += '<div class="t-sm fe-sub-label" >Add Today</div>';
    topHtml += '<div class="fx-col g4">';
    data.todayActionable.forEach(a => {
      const emoji = a.type === 'absorption' ? zi('link') : a.type === 'complete' ? zi('sparkle') : zi('sprout');
      topHtml += `<div class="sp-pair-card">
        <div class="sp-pair-foods">${emoji} Add <strong>${escHtml(a.partner)}</strong> to pair with ${escHtml(a.food)}</div>
        <div class="sp-pair-reason">${escHtml(a.reason)}</div>
        <div><span class="sp-pair-type sp-type-${a.type}">${a.type}</span></div>
      </div>`;
    });
    topHtml += '</div>';
  }
  topEl.innerHTML = topHtml;

  // Gap-filling suggestions
  let gapHtml = '';
  if (data.gapSuggestions.length > 0) {
    gapHtml += '<div class="t-sm fe-sub-label" >Fill Nutrient Gaps</div>';
    gapHtml += '<div class="fx-col g4">';
    data.gapSuggestions.forEach(g => {
      gapHtml += `<div class="list-item li-row">
        <div class="li-body">
          <span class="sp-gap-chip">${escHtml(g.nutrient)}</span>
          <span class="t-sm t-light" style="margin-top:2px;">Try ${g.foods.map(f => '<strong>' + escHtml(f) + '</strong>').join(', ')}</span>
        </div>
      </div>`;
    });
    gapHtml += '</div>';
  }
  gapsEl.innerHTML = gapHtml;

  // Unused synergy pairs to try
  let unusedHtml = '';
  if (data.unusedPairs.length > 0) {
    unusedHtml += '<div class="t-sm fe-sub-label" >Untried Synergies</div>';
    unusedHtml += '<div class="fx-col g4">';
    data.unusedPairs.forEach(p => {
      const emoji = p.type === 'absorption' ? zi('link') : p.type === 'complete' ? zi('sparkle') : zi('sprout');
      let extra = '';
      if (p.gapsFilled && p.gapsFilled.length > 0) {
        extra = ` · fills ${p.gapsFilled.slice(0, 2).join(', ')} gap`;
      }
      unusedHtml += `<div class="sp-pair-card">
        <div class="sp-pair-foods">${emoji} ${escHtml(p.food1)} + ${escHtml(p.food2)}</div>
        <div class="sp-pair-reason">${escHtml(p.reason)}${extra}</div>
        <div><span class="sp-pair-type sp-type-${p.type}">${p.type}</span></div>
      </div>`;
    });
    unusedHtml += '</div>';
  }
  unusedEl.innerHTML = unusedHtml;
}

// ── ENHANCE checkFoodCombo with synergy-aware pairing suggestions ──

function getSynergyPairings(rawFoods) {
  const suggestions = [];
  const seen = new Set();
  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  const mo = getAgeInMonths();
  rawFoods.forEach(food => {
    FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
      let match = null, partner = null;
      if (food.includes(f1) || f1.includes(food)) { match = f1; partner = f2; }
      else if (food.includes(f2) || f2.includes(food)) { match = f2; partner = f1; }
      if (!match || !partner) return;
      // Don't suggest if partner is already in the query
      if (rawFoods.some(rf => rf.includes(partner) || partner.includes(rf))) return;
      // Age-safety check
      const rule = AGE_RULES[partner] || AGE_RULES[partner.replace(/s$/, '')] || Object.entries(AGE_RULES).find(([k]) => partner.includes(k))?.[1];
      if (rule && mo < rule.minMonth) return;
      // Must be already introduced
      if (![...introducedSet].some(f => f.includes(partner) || partner.includes(f))) return;
      const key = partner;
      if (seen.has(key)) return;
      seen.add(key);
      const emoji = type === 'absorption' ? zi('link') : type === 'complete' ? zi('sparkle') : zi('sprout');
      suggestions.push({ partner, reason, type, emoji, matchedWith: food });
    });
  });

  // Also check nutrient gaps
  const heatmap = computeNutrientHeatmap(7);
  const gapNutrients = new Set(heatmap.gaps.map(g => g.toLowerCase()));

  // Score: gap-filling first, then absorption type
  suggestions.forEach(s => {
    const nut = getNutrition(s.partner);
    const gapsFilled = (nut?.nutrients || []).filter(n => gapNutrients.has(n.toLowerCase()));
    s._score = gapsFilled.length * 3 + (s.type === 'absorption' ? 2 : 1);
    s.gapsFilled = gapsFilled;
  });
  suggestions.sort((a, b) => b._score - a._score);
  return suggestions.slice(0, 4);
}

// ── CROSS-DOMAIN: HYDRATION INTELLIGENCE ──

const WEATHER_CACHE_KEY = 'ziva_weather_cache';
let _weatherCache = {};
try { _weatherCache = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY)) || {}; } catch { _weatherCache = {}; }

function saveWeatherCache() {
  // Keep last 60 days max
  const keys = Object.keys(_weatherCache).sort();
  if (keys.length > 60) {
    keys.slice(0, keys.length - 60).forEach(k => delete _weatherCache[k]);
  }
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(_weatherCache));
}

// Fetch historical weather for a date range from open-meteo archive API
let _weatherFetchInFlight = false;
function fetchHistoricalWeather(startDate, endDate) {
  if (_weatherFetchInFlight) return Promise.resolve();
  _weatherFetchInFlight = true;
  const lat = 22.8, lon = 86.18;
  return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,relative_humidity_2m_max,weather_code&timezone=Asia/Kolkata&start_date=${startDate}&end_date=${endDate}`)
    .then(r => r.json())
    .then(data => {
      _weatherFetchInFlight = false;
      if (data.daily && data.daily.time) {
        data.daily.time.forEach((d, i) => {
          _weatherCache[d] = {
            maxTemp: Math.round(data.daily.temperature_2m_max[i]),
            humidity: Math.round(data.daily.relative_humidity_2m_max[i]),
            code: data.daily.weather_code[i],
          };
        });
        saveWeatherCache();
      }
    })
    .catch(() => { _weatherFetchInFlight = false; });
}

function getWeatherForDate(dateStr) {
  return _weatherCache[dateStr] || null;
}

// Compute hydration score for a day: count of hydrating/cooling foods
function computeDayHydration(dateStr) {
  const dayFoods = extractDayFoods(dateStr);
  let hydraCount = 0;
  const hydraFoods = [];
  dayFoods.forEach(f => {
    const nut = getNutrition(f);
    if (nut && (nut.tags.includes('hydrating') || nut.tags.includes('cooling'))) {
      hydraCount++;
      hydraFoods.push(f);
    }
    // Also count explicit hydrating items not in NUTRITION
    if (['coconut water','buttermilk','chaas','lassi','nimbu pani','lemon water','ors'].some(h => f.includes(h))) {
      if (!hydraFoods.includes(f)) { hydraCount++; hydraFoods.push(f); }
    }
  });
  return { hydraCount, hydraFoods, hasMeals: dayFoods.length > 0 };
}

// Get worst poop consistency for a date
function getPoopConsistencyForDate(dateStr) {
  const dayPoops = poopData.filter(p => p.date === dateStr);
  if (dayPoops.length === 0) return null;
  const CON_RANK = { pellet:0, hard:1, watery:2, loose:3, normal:4, soft:5 };
  let worst = 'soft';
  dayPoops.forEach(p => {
    if ((CON_RANK[p.consistency] ?? 5) < (CON_RANK[worst] ?? 5)) worst = p.consistency;
  });
  return worst;
}

// ═══════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CARETICKETS — Data Engine (Phase A Foundation)
// ═══════════════════════════════════════════════════════════════

// ── Module-Level Variables ──
// _careTickets is declared in core.js global line
var _ctCurrentAnswers = {};
var _ctTimers = {};
var _ctNotifiedTickets = {};
var _ctBannerTicketId = null;
var _ctDeepLinkPending = null;
var _ctResizeHandler = null;
var _ctStorageUpdating = false;
var _ctSelectedTemplate = null;

// ── Constants ──
var CT_QUIET_START = 22;
var CT_QUIET_END = 7;
var CT_PRUNE_DAYS = 180;
var CT_MAX_ACTIVE = 8;
var CT_DETAIL_VISIBLE = 5;
var CT_SHARE_MAX_CHECKINS = 10;
var ACTION_SEVERITY = { doctor_call: 1, er_visit: 2 };
var MAX_TIMEOUT = 2147483647;

// ── Templates ──
var CT_TEMPLATES = {
  fall: {
    type: 'incident', title: 'Fall', icon: 'fall', domainColor: 'rose',
    followUps: [15, 30, 60, 120, 240, 480],
    questions: [
      { id: 'seizure', type: 'bool', label: 'Any seizure or convulsion?' },
      { id: 'vomiting', type: 'bool', label: 'Any vomiting?' },
      { id: 'drowsiness', type: 'bool', label: 'Any unusual drowsiness?' },
      { id: 'mobility', type: 'select', label: 'Moving normally?',
        options: ['Yes', 'Favoring one side', 'Not moving much'], clearValue: 'Yes' },
      { id: 'crying', type: 'select', label: 'Is she still crying?',
        options: ['Yes, inconsolable', 'Whimpering', 'Stopped'], clearValue: 'Stopped' },
      { id: 'swelling', type: 'bool', label: 'Swelling or bruise visible?',
        resolutionBlocking: false }
    ],
    resolutionCriteria: { type: 'consecutive_clear', count: 3 },
    escalationTriggers: [
      { field: 'seizure', value: true, action: 'er_visit' },
      { field: 'vomiting', value: true, action: 'er_visit' },
      { field: 'drowsiness', value: true, action: 'er_visit' },
      { field: 'mobility', value: 'Not moving much', action: 'er_visit' },
      { field: 'crying', value: 'Yes, inconsolable', afterMinutes: 60, action: 'doctor_call' }
    ],
    autoDataSources: ['illness'],
    pivotStrategies: []
  },
  bump_head: {
    type: 'incident', title: 'Head bump', icon: 'bump', domainColor: 'rose',
    followUps: [15, 30, 60, 120, 240, 480, 720],
    questions: [
      { id: 'seizure', type: 'bool', label: 'Any seizure or convulsion?' },
      { id: 'vomiting', type: 'bool', label: 'Any vomiting?' },
      { id: 'drowsiness', type: 'bool', label: 'Any unusual drowsiness or confusion?' },
      { id: 'pupils', type: 'select', label: 'Pupils look normal?',
        options: ['Yes, equal size', 'Unequal', 'Not sure'], clearValue: 'Yes, equal size' },
      { id: 'crying', type: 'select', label: 'Is she still crying?',
        options: ['Yes, inconsolable', 'Whimpering', 'Stopped'], clearValue: 'Stopped' },
      { id: 'swelling', type: 'bool', label: 'Bump or swelling on head?',
        resolutionBlocking: false }
    ],
    resolutionCriteria: { type: 'consecutive_clear', count: 3 },
    escalationTriggers: [
      { field: 'seizure', value: true, action: 'er_visit' },
      { field: 'vomiting', value: true, action: 'er_visit' },
      { field: 'drowsiness', value: true, action: 'er_visit' },
      { field: 'pupils', value: 'Unequal', action: 'er_visit' }
    ],
    autoDataSources: ['illness'],
    pivotStrategies: []
  },
  ingestion: {
    type: 'incident', title: 'Ate something concerning', icon: 'alert-circle', domainColor: 'rose',
    followUps: [15, 30, 60, 120, 240],
    questions: [
      { id: 'substance', type: 'text', label: 'What did she eat/drink?', onceOnly: true },
      { id: 'quantity', type: 'text', label: 'How much (estimate)?', onceOnly: true },
      { id: 'breathing', type: 'select', label: 'Breathing normally?',
        options: ['Yes', 'Wheezing', 'Labored'], clearValue: 'Yes' },
      { id: 'behavior', type: 'select', label: 'Behavior?',
        options: ['Normal', 'Irritable', 'Lethargic'], clearValue: 'Normal' },
      { id: 'vomiting', type: 'bool', label: 'Any vomiting?' },
      { id: 'rash', type: 'bool', label: 'Any rash or hives?' }
    ],
    resolutionCriteria: { type: 'consecutive_clear', count: 2 },
    escalationTriggers: [
      { field: 'breathing', value: 'Labored', action: 'er_visit' },
      { field: 'breathing', value: 'Wheezing', action: 'doctor_call' },
      { field: 'rash', value: true, action: 'doctor_call' },
      { field: 'behavior', value: 'Lethargic', action: 'er_visit' }
    ],
    autoDataSources: ['illness', 'poop'],
    pivotStrategies: []
  },
  sleep_improve: {
    type: 'goal', title: 'Improve sleep', icon: 'goal', domainColor: 'lavender',
    followUps: [1440, 2880, 4320, 5760, 7200, 8640, 10080],
    questions: [
      { id: 'qualitative', type: 'select', label: 'How was last night?',
        options: ['Great', 'Okay', 'Rough', 'Terrible'], clearValue: 'Great' },
      { id: 'notes', type: 'text', label: 'Any observations?' }
    ],
    resolutionCriteria: {
      type: 'sustained_metric', metric: 'dailySleepScore',
      operator: '>=', value: 70, sustainDays: 5
    },
    escalationTriggers: [],
    autoDataSources: ['sleep'],
    pivotStrategies: [
      'Try earlier bedtime (shift 15 min earlier)',
      'Check room temperature and darkness',
      'Reduce screen/stimulation before bed',
      'Consult pediatrician if no improvement in 2 weeks'
    ]
  },
  weight_gain: {
    type: 'goal', title: 'Increase weight', icon: 'trending-up', domainColor: 'lavender',
    followUps: [4320, 10080, 20160, 30240],
    questions: [
      { id: 'appetite', type: 'select', label: 'Appetite today?',
        options: ['Good', 'Average', 'Poor'], clearValue: 'Good' },
      { id: 'notes', type: 'text', label: 'Any dietary changes?' }
    ],
    resolutionCriteria: {
      type: 'threshold_met', metric: 'wtGPerWeek',
      operator: '>=', value: 80, confirmAfterDays: 14
    },
    escalationTriggers: [],
    autoDataSources: ['growth'],
    pivotStrategies: [
      'Add calorie-dense foods (ghee, avocado, nut butters)',
      'Increase meal frequency',
      'Check for underlying illness suppressing appetite',
      'Schedule weight check with pediatrician'
    ]
  },
  feeding_variety: {
    type: 'goal', title: 'Improve food variety', icon: 'goal', domainColor: 'lavender',
    followUps: [1440, 2880, 4320, 5760, 7200, 8640, 10080],
    questions: [
      { id: 'newFood', type: 'text', label: 'Any new food tried today?' },
      { id: 'reaction', type: 'select', label: 'Reaction?',
        options: ['Loved it', 'Neutral', 'Rejected', 'No new food'], clearValue: 'Loved it' }
    ],
    resolutionCriteria: {
      type: 'threshold_met', metric: 'uniqueFoods7d',
      operator: '>=', value: 10, confirmAfterDays: 7
    },
    escalationTriggers: [],
    autoDataSources: ['diet'],
    pivotStrategies: [
      'Rotate presentation \u2014 same food, different form',
      'Baby-led weaning for texture exposure',
      'Pair new food with a favorite',
      'Try again in 3 days \u2014 rejection does not equal dislike'
    ]
  },
  custom: {
    type: 'goal', title: '', icon: 'clipboard', domainColor: 'lavender',
    followUps: [1440, 2880, 4320, 5760, 7200],
    questions: [
      { id: 'update', type: 'text', label: 'How is it going?' }
    ],
    resolutionCriteria: { type: 'manual' },
    escalationTriggers: [],
    autoDataSources: [],
    pivotStrategies: []
  }
};

// ── Template-Derived Accessors ──

function ctDomainColor(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  return tpl ? tpl.domainColor : (ticket.type === 'incident' ? 'rose' : 'lavender');
}

function ctResolutionCriteria(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  return (tpl && tpl.resolutionCriteria) ? tpl.resolutionCriteria : { type: 'manual' };
}

function ctEscalationTriggers(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  return (tpl && tpl.escalationTriggers) ? tpl.escalationTriggers : [];
}

function ctPivotStrategies(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  return (tpl && tpl.pivotStrategies) ? tpl.pivotStrategies : [];
}

// ── Core Utility Functions ──

function ctRefTime(ticket) {
  var times = [
    new Date(ticket.createdAt).getTime() || 0,
    new Date(ticket.reopenedAt).getTime() || 0,
    new Date(ticket.deEscalatedAt).getTime() || 0,
    new Date(ticket.escalatedAt).getTime() || 0
  ];
  return Math.max.apply(null, times);
}

function ctNextDueTime(ticket) {
  if (!ticket.followUps || ticket.nextFollowUpIdx >= ticket.followUps.length) return Infinity;
  var base = ticket.scheduleBaseTime || ticket.createdAt;
  var baseMs = new Date(base).getTime();
  if (isNaN(baseMs) || baseMs <= 0) return Infinity;
  return baseMs + ticket.followUps[ticket.nextFollowUpIdx] * 60000;
}

function ctCompare(val, operator, threshold) {
  if (val === null || val === undefined || isNaN(val)) return false;
  switch (operator) {
    case '>=': return val >= threshold;
    case '>':  return val > threshold;
    case '<=': return val <= threshold;
    case '<':  return val < threshold;
    case '==': return val === threshold;
    default: return false;
  }
}

function ctGetMetricValue(metric, dateStr) {
  switch (metric) {
    case 'dailySleepScore':
      var sc = getDailySleepScore(dateStr || today());
      return (sc && sc.score !== undefined) ? sc.score : null;
    case 'wtGPerWeek':
      var gv = getGrowthVelocity();
      return (gv && gv.wtGPerWeek !== undefined) ? gv.wtGPerWeek : null;
    case 'uniqueFoods7d':
      return ctUniqueFoods7d();
    default:
      console.warn('CareTickets: unknown metric:', metric);
      return null;
  }
}

function parseBoolOrString(val) {
  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  if (val === null || val === 'null' || val === '' || val === undefined) return null;
  return String(val);
}

function ctTimeAgo(isoStr) {
  if (!isoStr) return '';
  var ms = Date.now() - new Date(isoStr).getTime();
  if (isNaN(ms) || ms < 0) return 'just now';
  var mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  var days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return days + ' days ago';
  var weeks = Math.floor(days / 7);
  return weeks + (weeks === 1 ? ' week ago' : ' weeks ago');
}

function ctTimeUntil(isoStr) {
  if (!isoStr) return '';
  var ms = new Date(isoStr).getTime() - Date.now();
  if (isNaN(ms) || ms <= 0) return 'now';
  var mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return 'in ' + mins + ' min';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return 'in ' + hrs + 'h';
  var days = Math.floor(hrs / 24);
  return 'in ' + days + (days === 1 ? ' day' : ' days');
}

// ── Metric Functions ──

function ctUniqueFoods7d() {
  return _islGetCached('ct:uniqueFoods7d', 'diet', function() {
    var seen = {};
    var count = 0;
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var cutoffStr = toDateStr(cutoff);
    var fd = feedingData || {};
    Object.keys(fd).forEach(function(dateStr) {
      if (dateStr < cutoffStr) return;
      var entry = fd[dateStr];
      if (!entry || typeof entry !== 'object') return;
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(function(meal) {
        var val = entry[meal];
        if (!val || typeof val !== 'string') return;
        val.split(/[,\+&]/).forEach(function(item) {
          var norm = normalizeFoodName(item.trim());
          if (norm && !seen[norm]) { seen[norm] = true; count++; }
        });
      });
    });
    return count;
  });
}

function ctAvgNightDuration7d() {
  return _islGetCached('ct:avgNightDur7d', 'sleep', function() {
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    var cutoffStr = toDateStr(cutoff);
    var total = 0;
    var validCount = 0;
    (sleepData || []).forEach(function(s) {
      if (!s || !s.date || s.date < cutoffStr) return;
      if (!s.bedtime || !s.wakeTime) return;
      var dur = calcSleepDuration(s.bedtime, s.wakeTime);
      var durMin = dur ? dur.total : null;
      var isNight = s.type === 'night' || (!s.type && durMin && durMin > 240);
      if (!isNight) return;
      if (durMin === null || durMin === 0) return;
      total += durMin;
      validCount++;
    });
    return validCount > 0 ? (total / validCount) : null;
  });
}

// ── Illness Detection ──

function ctLastEpisodeActivity(ep) {
  var latest = new Date(ep.startedAt).getTime() || 0;
  if (ep.readings && Array.isArray(ep.readings)) {
    ep.readings.forEach(function(r) {
      var t = new Date(r.time || r.date || r.at).getTime();
      if (t > latest) latest = t;
    });
  }
  if (ep.entries && Array.isArray(ep.entries)) {
    ep.entries.forEach(function(e) {
      var t = new Date(e.time || e.date || e.at).getTime();
      if (t > latest) latest = t;
    });
  }
  if (ep.doses && Array.isArray(ep.doses)) {
    ep.doses.forEach(function(d) {
      var t = new Date(d.time || d.date || d.at).getTime();
      if (t > latest) latest = t;
    });
  }
  if (ep.lastUpdated) {
    var t = new Date(ep.lastUpdated).getTime();
    if (t > latest) latest = t;
  }
  return latest;
}

function ctHasActiveIllness() {
  var episodes;
  try { episodes = _getAllEpisodes(); } catch(e) { return false; }
  if (!Array.isArray(episodes)) return false;
  return episodes.some(function(e) {
    if (e.status !== 'active') return false;
    var daysSince = Math.ceil((Date.now() - new Date(e.startedAt).getTime()) / 86400000);
    if (daysSince <= 21) return true;
    var lastActivity = ctLastEpisodeActivity(e);
    var daysSinceActivity = Math.ceil((Date.now() - lastActivity) / 86400000);
    return daysSinceActivity <= 7;
  });
}

// ── Verdict Computation ──

function ctSanitizeAnswers(ticket, raw) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return raw || {};
  var safe = raw || {};
  var clean = {};
  var questions = tpl.questions || [];
  questions.forEach(function(q) {
    var val = safe[q.id];
    if (q.type === 'bool') {
      if (val === true || val === false) { clean[q.id] = val; }
      else if (val === 'true') { clean[q.id] = true; }
      else if (val === 'false') { clean[q.id] = false; }
      else { clean[q.id] = null; }
    } else if (q.type === 'select') {
      if (val !== null && val !== undefined && q.options && q.options.indexOf(String(val)) !== -1) {
        clean[q.id] = String(val);
      } else {
        clean[q.id] = null;
      }
    } else if (q.type === 'text') {
      var s = (val !== null && val !== undefined) ? String(val) : '';
      if (s.length > 500) s = s.substring(0, 500);
      clean[q.id] = s;
    }
  });
  return clean;
}

function ctComputeVerdict(ticket, answers) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return { verdict: 'watch', trigger: null, allTriggers: [] };

  // ── Incident: answer-driven ──
  if (ticket.type === 'incident') {
    var triggers = ctEscalationTriggers(ticket);
    var matched = [];
    var elapsed = Date.now() - ctRefTime(ticket);
    triggers.forEach(function(tr) {
      if (answers[tr.field] === tr.value) {
        if (tr.afterMinutes !== undefined) {
          if (elapsed < tr.afterMinutes * 60000) return;
        }
        matched.push(tr);
      }
    });
    if (matched.length > 0) {
      var worst = matched[0];
      for (var i = 1; i < matched.length; i++) {
        if ((ACTION_SEVERITY[matched[i].action] || 0) > (ACTION_SEVERITY[worst.action] || 0)) {
          worst = matched[i];
        }
      }
      return { verdict: 'escalate', trigger: worst, allTriggers: matched };
    }
    // Check blocking questions for clear
    var questions = tpl.questions || [];
    var allClear = true;
    var hasMissing = false;
    questions.forEach(function(q) {
      if (q.resolutionBlocking === false) return;
      if (q.type === 'text') return;
      var val = answers[q.id];
      if (val === null || val === undefined) { hasMissing = true; allClear = false; return; }
      if (q.type === 'bool') {
        if (val !== false) allClear = false;
      } else if (q.type === 'select') {
        if (val !== q.clearValue) allClear = false;
      }
    });
    if (hasMissing) return { verdict: 'watch', trigger: null, allTriggers: [] };
    return { verdict: allClear ? 'clear' : 'watch', trigger: null, allTriggers: [] };
  }

  // ── Goal: metric-driven ──
  var criteria = ctResolutionCriteria(ticket);
  if (criteria.type === 'manual') return { verdict: 'watch', trigger: null, allTriggers: [] };
  var metricVal = ctGetMetricValue(criteria.metric);
  var passes = ctCompare(metricVal, criteria.operator, criteria.value);
  return { verdict: passes ? 'clear' : 'watch', trigger: null, allTriggers: [] };
}

// ── Resolution Functions ──

function ctConsecutiveClears(ticket) {
  var ref = ctRefTime(ticket);
  var checks = ticket.checkIns || [];
  var count = 0;
  for (var i = checks.length - 1; i >= 0; i--) {
    var ci = checks[i];
    if (new Date(ci.time).getTime() <= ref) break;
    if (ci.verdict === 'clear') { count++; }
    else { break; }
  }
  return count;
}

function ctSustainedDays(ticket) {
  var criteria = ctResolutionCriteria(ticket);
  if (!criteria || criteria.type !== 'sustained_metric') {
    return { count: 0, paused: false, reason: null, noData: true };
  }
  if (ctHasActiveIllness()) {
    return { count: ticket.lastSustainedCount || 0, paused: true, reason: 'illness', noData: false };
  }
  var count = 0;
  var d = new Date();
  var todayStr = toDateStr(d);
  var val = ctGetMetricValue(criteria.metric, todayStr);
  if (val === null) {
    d.setDate(d.getDate() - 1);
  }
  for (var step = 0; step < 60; step++) {
    var ds = toDateStr(d);
    var mv = ctGetMetricValue(criteria.metric, ds);
    if (mv === null) break;
    if (!ctCompare(mv, criteria.operator, criteria.value)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  if (count !== (ticket.lastSustainedCount || 0)) {
    ticket.lastSustainedCount = count;
    ctSave();
  }
  return { count: count, paused: false, reason: null, noData: (count === 0 && val === null) };
}

function ctCheckThresholdMet(ticket) {
  var criteria = ctResolutionCriteria(ticket);
  if (!criteria || criteria.type !== 'threshold_met') {
    return { met: false, daysHeld: 0, paused: false };
  }
  var metricVal = ctGetMetricValue(criteria.metric);
  var passes = ctCompare(metricVal, criteria.operator, criteria.value);
  var ill = ctHasActiveIllness();
  if (passes) {
    if (!ticket.firstMetAt) {
      ticket.firstMetAt = new Date().toISOString();
      ctSave();
    }
    var daysHeld = Math.floor((Date.now() - new Date(ticket.firstMetAt).getTime()) / 86400000);
    return { met: daysHeld >= criteria.confirmAfterDays, daysHeld: daysHeld, paused: false };
  }
  // Not passing
  if (ill) {
    var dh = ticket.firstMetAt ? Math.floor((Date.now() - new Date(ticket.firstMetAt).getTime()) / 86400000) : 0;
    return { met: false, daysHeld: dh, paused: true };
  }
  if (ticket.firstMetAt) {
    ticket.firstMetAt = null;
    ctSave();
  }
  return { met: false, daysHeld: 0, paused: false };
}

// ── Ticket Lifecycle ──

function ctCreateTicket(category, customTitle) {
  var tpl = CT_TEMPLATES[category];
  if (!tpl) return null;
  var title = (category === 'custom') ? (customTitle || '').replace(/[\r\n]/g, ' ').trim() : tpl.title;
  if (category === 'custom' && !title) return null;
  var now = new Date().toISOString();
  return {
    id: 'ct-' + Date.now(),
    type: tpl.type,
    category: category,
    title: title,
    status: 'active',
    createdAt: now,
    resolvedAt: null,
    escalatedAt: null,
    deEscalatedAt: null,
    reopenedAt: null,
    scheduleBaseTime: null,
    escalationHistory: [],
    followUps: tpl.followUps.slice(),
    nextFollowUpIdx: 0,
    lastCheckInAt: null,
    checkIns: [],
    notes: '',
    resolvedNotes: '',
    lastSustainedCount: 0,
    firstMetAt: null,
    reopenCount: 0
  };
}

function ctSave() {
  try {
    save(KEYS.careTickets, _careTickets);
    // Write verification
    var stored = localStorage.getItem(KEYS.careTickets);
    if (stored === null) {
      ctShowStorageWarning();
    }
  } catch(e) {
    console.error('CareTickets save failed:', e);
    ctShowStorageWarning();
  }
}

// ctShowStorageWarning moved to Phase D section

function ctSortTickets(tickets) {
  return tickets.slice().sort(function(a, b) {
    // Escalated first
    var aEsc = a.status === 'escalated' ? 1 : 0;
    var bEsc = b.status === 'escalated' ? 1 : 0;
    if (aEsc !== bEsc) return bEsc - aEsc;
    // Incidents above goals
    var aInc = a.type === 'incident' ? 1 : 0;
    var bInc = b.type === 'incident' ? 1 : 0;
    if (aInc !== bInc) return bInc - aInc;
    // By due time (most overdue first)
    var aDue = ctNextDueTime(a);
    var bDue = ctNextDueTime(b);
    // Infinity-safe: both Infinity → stable (0), one Infinity → push to end
    if (aDue === Infinity && bDue === Infinity) return 0;
    if (aDue === Infinity) return 1;
    if (bDue === Infinity) return -1;
    return aDue - bDue;
  });
}

function ctAdvanceToNextFuture(ticket) {
  var now = Date.now();
  var skipped = 0;
  var base = new Date(ticket.scheduleBaseTime || ticket.createdAt).getTime();
  if (isNaN(base) || base <= 0) return 0;
  while (ticket.nextFollowUpIdx < ticket.followUps.length) {
    var dueMs = base + ticket.followUps[ticket.nextFollowUpIdx] * 60000;
    if (dueMs > now) break;
    ticket.nextFollowUpIdx++;
    skipped++;
  }
  return skipped;
}

function ctProcessAllOverdue() {
  var anySaved = false;
  _careTickets.forEach(function(t) {
    if (t.status !== 'active' && t.status !== 'escalated') return;
    var skipped = ctAdvanceToNextFuture(t);
    if (skipped > 0) anySaved = true;
  });
  if (anySaved) ctSave();
}

function ctPruneResolved() {
  var cutoff = Date.now() - CT_PRUNE_DAYS * 86400000;
  var before = _careTickets.length;
  _careTickets = _careTickets.filter(function(t) {
    if (t.status !== 'resolved') return true;
    var resolvedMs = new Date(t.resolvedAt).getTime();
    return isNaN(resolvedMs) || resolvedMs > cutoff;
  });
  if (_careTickets.length < before) ctSave();
}

function ctValidateTickets() {
  var changed = false;
  var now = Date.now();
  var fiveMinFuture = now + 5 * 60000;
  _careTickets = _careTickets.filter(function(t) {
    if (!t || !t.id || !t.createdAt) { changed = true; return false; }
    return true;
  });
  _careTickets.forEach(function(t) {
    // type
    if (t.type !== 'incident' && t.type !== 'goal') {
      t.type = CT_TEMPLATES[t.category] ? CT_TEMPLATES[t.category].type : 'goal';
      changed = true;
    }
    // category
    if (!CT_TEMPLATES[t.category]) {
      t.category = 'custom';
      changed = true;
    }
    // title
    if (typeof t.title !== 'string') { t.title = CT_TEMPLATES[t.category].title || 'Tracking'; changed = true; }
    // status
    if (['active', 'resolved', 'escalated'].indexOf(t.status) === -1) { t.status = 'active'; changed = true; }
    // Timestamp fields — corruption + future correction
    var tsFields = ['createdAt', 'resolvedAt', 'escalatedAt', 'deEscalatedAt', 'reopenedAt', 'scheduleBaseTime'];
    tsFields.forEach(function(f) {
      if (t[f] !== null && t[f] !== undefined) {
        var ms = new Date(t[f]).getTime();
        if (isNaN(ms)) { t[f] = (f === 'createdAt') ? new Date().toISOString() : null; changed = true; }
        else if (ms > fiveMinFuture) { t[f] = new Date().toISOString(); changed = true; }
      }
    });
    // Status consistency
    if (t.status === 'resolved' && !t.resolvedAt) {
      t.resolvedAt = t.lastCheckInAt || t.createdAt;
      changed = true;
    }
    if (t.status === 'escalated' && !t.escalatedAt) {
      t.escalatedAt = t.createdAt;
      changed = true;
    }
    // escalationHistory
    if (!Array.isArray(t.escalationHistory)) { t.escalationHistory = []; changed = true; }
    // followUps
    if (!Array.isArray(t.followUps)) {
      var tpl = CT_TEMPLATES[t.category];
      t.followUps = tpl ? tpl.followUps.slice() : [1440, 2880, 4320, 5760, 7200];
      changed = true;
    } else {
      var beforeFollowUps = t.followUps.length;
      t.followUps = t.followUps.filter(function(v) { return typeof v === 'number' && v >= 0; });
      if (t.followUps.length !== beforeFollowUps) changed = true;
    }
    // nextFollowUpIdx
    if (typeof t.nextFollowUpIdx !== 'number' || t.nextFollowUpIdx < 0) {
      t.nextFollowUpIdx = 0; changed = true;
    }
    if (t.nextFollowUpIdx > t.followUps.length) {
      t.nextFollowUpIdx = t.followUps.length; changed = true;
    }
    // lastCheckInAt — recover from checkIns
    if (t.lastCheckInAt !== null && t.lastCheckInAt !== undefined) {
      var lms = new Date(t.lastCheckInAt).getTime();
      if (isNaN(lms)) {
        var cis = t.checkIns || [];
        t.lastCheckInAt = cis.length > 0 ? cis[cis.length - 1].time : null;
        changed = true;
      }
    }
    // checkIns
    if (!Array.isArray(t.checkIns)) { t.checkIns = []; changed = true; }
    else {
      var beforeLen = t.checkIns.length;
      t.checkIns = t.checkIns.filter(function(ci) {
        return ci && ci.time && ci.verdict;
      });
      t.checkIns.sort(function(a, b) {
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      });
      if (t.checkIns.length !== beforeLen) changed = true;
    }
    // notes, resolvedNotes
    if (typeof t.notes !== 'string') { t.notes = ''; changed = true; }
    if (typeof t.resolvedNotes !== 'string') { t.resolvedNotes = ''; changed = true; }
    // lastSustainedCount
    if (typeof t.lastSustainedCount !== 'number') { t.lastSustainedCount = 0; changed = true; }
    // firstMetAt
    if (t.firstMetAt !== null && t.firstMetAt !== undefined) {
      if (isNaN(new Date(t.firstMetAt).getTime())) { t.firstMetAt = null; changed = true; }
    }
    // reopenCount
    if (typeof t.reopenCount !== 'number' || t.reopenCount < 0) { t.reopenCount = 0; changed = true; }
  });
  if (changed) ctSave();
}

// ── Notification Text ──

function ctNotificationText(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (ticket.status === 'escalated') {
    return 'Urgent: ' + escHtml(ticket.title) + ' needs attention';
  }
  if (ticket.type === 'incident') {
    var elapsed = ctTimeAgo(ticket.createdAt);
    return escHtml(ticket.title) + ' \u2014 time for a quick check (' + elapsed + ')';
  }
  // Goal
  var goalTexts = {
    sleep_improve: 'How was last night? Quick check on sleep progress',
    weight_gain: 'Time for a weight check-in',
    feeding_variety: 'Any new foods today? Quick food variety check',
    custom: 'Time to check in on: ' + escHtml(ticket.title)
  };
  return goalTexts[ticket.category] || ('Check in: ' + escHtml(ticket.title));
}

// ── Pre-Fill and Collection ──

function ctPreFillAnswers(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return {};
  var checks = ticket.checkIns || [];
  var lastCI = checks.length > 0 ? checks[checks.length - 1] : null;
  var firstCI = checks.length > 0 ? checks[0] : null;
  var prefilled = {};
  (tpl.questions || []).forEach(function(q) {
    if (q.onceOnly && firstCI && firstCI.answers) {
      prefilled[q.id] = firstCI.answers[q.id] !== undefined ? firstCI.answers[q.id] : null;
      return;
    }
    if (q.type === 'text') {
      prefilled[q.id] = '';
      return;
    }
    if (!lastCI || !lastCI.answers) { prefilled[q.id] = null; return; }
    var val = lastCI.answers[q.id];
    // Validate select against current options
    if (q.type === 'select') {
      if (val !== null && val !== undefined && q.options && q.options.indexOf(String(val)) !== -1) {
        prefilled[q.id] = String(val);
      } else {
        prefilled[q.id] = null;
      }
      return;
    }
    // Validate bool
    if (q.type === 'bool') {
      if (val === true || val === false) {
        prefilled[q.id] = val;
      } else {
        prefilled[q.id] = null;
      }
      return;
    }
    prefilled[q.id] = null;
  });
  return prefilled;
}

function ctCollectAnswers(ticketId) {
  var ticket = _careTickets.find(function(t) { return t.id === ticketId; });
  if (!ticket) return _ctCurrentAnswers;
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return _ctCurrentAnswers;
  var answers = {};
  Object.keys(_ctCurrentAnswers).forEach(function(k) { answers[k] = _ctCurrentAnswers[k]; });
  // Override text fields from DOM (catches unfired change events)
  (tpl.questions || []).forEach(function(q) {
    if (q.type !== 'text') return;
    if (q.onceOnly && ticket.checkIns && ticket.checkIns.length > 0) return;
    var el = document.getElementById('ct-q-' + q.id);
    if (el) answers[q.id] = el.value || '';
  });
  return answers;
}

function ctCanQuickClear(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return false;
  // Disabled on first check-in if onceOnly text questions exist
  if ((!ticket.checkIns || ticket.checkIns.length === 0)) {
    var hasOnceOnly = (tpl.questions || []).some(function(q) {
      return q.onceOnly && q.type === 'text';
    });
    if (hasOnceOnly) return false;
  }
  return true;
}

function ctIsCheckInComplete(ticket) {
  var tpl = CT_TEMPLATES[ticket.category];
  if (!tpl) return false;
  var questions = tpl.questions || [];
  return questions.every(function(q) {
    if (q.resolutionBlocking === false) return true;
    if (q.type === 'text') return true;
    var val = _ctCurrentAnswers[q.id];
    return val !== null && val !== undefined;
  });
}

function ctGetPrimaryDoctor() {
  var docs = (typeof doctors !== 'undefined' && Array.isArray(doctors)) ? doctors : [];
  var primary = docs.find(function(d) { return d.primary && d.phone; });
  if (primary) return primary;
  var anyPhone = docs.find(function(d) { return d.phone; });
  return anyPhone || null;
}

// ═══════════════════════════════════════════════════════════════
// CARETICKETS — Overlays + Interaction (Phase C)
// ═══════════════════════════════════════════════════════════════

// ── Overlay collision guard ──
function _ctOverlayOpen() {
  return !!(document.querySelector('.ct-picker-scrim') ||
            document.querySelector('.ct-checkin-scrim') ||
            document.querySelector('.ct-detail-scrim'));
}

// ── 1. Template Picker Overlay ──

function ctOpenTemplatePicker() {
  if (_ctOverlayOpen()) return;
  // Max active guard
  var activeCount = _careTickets.filter(function(t) {
    return t.status === 'active' || t.status === 'escalated';
  }).length;
  if (activeCount >= CT_MAX_ACTIVE) {
    showQLToast(zi('warn') + ' Maximum 8 active trackings');
    return;
  }
  history.pushState(null, '', '');
  _ctSelectedTemplate = null;

  var scrim = document.createElement('div');
  scrim.className = 'ct-picker-scrim';
  var body = document.createElement('div');
  body.className = 'ct-picker-body';

  var html = '';
  // Header
  html += '<div class="ct-overlay-header">';
  html += '<span class="ct-overlay-title">Track a concern</span>';
  html += '<span class="ct-close-btn" data-action="ctClose" data-arg="picker">' + zi('check').replace('zi-check', 'zi-check').replace('<svg', '<svg').replace('</svg>', '') + '</span>';
  // Use × text instead
  html = '';
  html += '<div class="ct-overlay-header">';
  html += '<span class="ct-overlay-title">Track a concern</span>';
  html += '<span class="ct-close-btn" data-action="ctClose" data-arg="picker">&times;</span>';
  html += '</div>';

  // Disclaimer (first-time only)
  if (_careTickets.length === 0) {
    html += '<div class="ct-disclaimer">This helps you remember to check in \u2014 it\'s not medical advice. Always call your doctor if you\'re worried.</div>';
  }

  // Age caveat (> 12 months)
  var dobMs = new Date('2025-09-04').getTime();
  var ageMonths = Math.floor((Date.now() - dobMs) / (30.44 * 86400000));
  if (ageMonths > 12) {
    html += '<div class="ct-age-note">Ziva is ' + ageMonths + ' months old. Tracking targets are set for 6\u201312 months \u2014 check with your pediatrician.</div>';
  }

  // Incident templates
  html += '<div class="ct-section-label">Something happened</div>';
  html += '<div class="ct-chips-row">';
  var incidents = ['fall', 'bump_head', 'ingestion'];
  incidents.forEach(function(cat) {
    var tpl = CT_TEMPLATES[cat];
    html += '<span class="chip ct-template-chip ct-incident-tpl" data-action="ctSelectTemplate" data-arg="' + escAttr(cat) + '">' + zi(tpl.icon) + ' ' + escHtml(tpl.title) + '</span>';
  });
  html += '</div>';

  // Goal templates
  html += '<div class="ct-section-label">Track a goal</div>';
  html += '<div class="ct-chips-row">';
  var goals = ['sleep_improve', 'weight_gain', 'feeding_variety', 'custom'];
  goals.forEach(function(cat) {
    var tpl = CT_TEMPLATES[cat];
    var label = cat === 'custom' ? 'Custom tracking' : tpl.title;
    html += '<span class="chip ct-template-chip" data-action="ctSelectTemplate" data-arg="' + escAttr(cat) + '">' + zi(tpl.icon) + ' ' + escHtml(label) + '</span>';
  });
  html += '</div>';

  // Title input area (hidden initially)
  html += '<div class="ct-title-area ct-hidden" id="ctTitleArea">';
  html += '<input type="text" class="ct-text-input" id="ctTitleInput" placeholder="" maxlength="100" data-action="ctInputAnswer" data-arg="title" />';
  html += '<div class="ct-helper-text" id="ctTitleHelper"></div>';
  html += '</div>';

  // Duplicate warning (hidden initially)
  html += '<div class="ct-dupe-warn ct-hidden" id="ctDupeWarn">You already have an active tracking for this</div>';

  // Confirm button
  html += '<div class="ct-submit-area">';
  html += '<span class="chip" data-action="ctConfirmCreate" id="ctConfirmBtn" disabled>Start tracking</span>';
  html += '</div>';

  body.innerHTML = html;
  scrim.appendChild(body);

  // Outside tap closes (Flow overlay)
  scrim.addEventListener('click', function(e) {
    if (e.target === scrim) ctCloseOverlay('picker');
  });

  document.body.appendChild(scrim);
}

function ctSelectTemplate(category) {
  _ctSelectedTemplate = category;
  var tpl = CT_TEMPLATES[category];
  if (!tpl) return;

  // Toggle active class
  var chips = document.querySelectorAll('.ct-template-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.toggle('active', chips[i].getAttribute('data-arg') === category);
  }

  // Title input
  var titleArea = document.getElementById('ctTitleArea');
  var titleInput = document.getElementById('ctTitleInput');
  var titleHelper = document.getElementById('ctTitleHelper');
  if (category === 'custom') {
    titleArea.classList.remove('ct-hidden');
    titleInput.placeholder = 'What are you tracking?';
    titleHelper.textContent = 'Give it a name';
    titleInput.value = '';
    titleInput.focus();
  } else {
    titleArea.classList.add('ct-hidden');
    titleInput.value = '';
    titleHelper.textContent = '';
  }

  // Duplicate warning (goal types only)
  var dupeWarn = document.getElementById('ctDupeWarn');
  if (tpl.type === 'goal' && category !== 'custom') {
    var hasDupe = _careTickets.some(function(t) {
      return t.category === category && (t.status === 'active' || t.status === 'escalated');
    });
    dupeWarn.classList.toggle('ct-hidden', !hasDupe);
  } else {
    dupeWarn.classList.add('ct-hidden');
  }

  // Update confirm button state
  _ctUpdatePickerConfirm();
}

function _ctUpdatePickerConfirm() {
  var btn = document.getElementById('ctConfirmBtn');
  if (!btn) return;
  if (!_ctSelectedTemplate) {
    btn.setAttribute('disabled', 'disabled');
    return;
  }
  if (_ctSelectedTemplate === 'custom') {
    var input = document.getElementById('ctTitleInput');
    var hasTitle = input && input.value.trim().length > 0;
    if (hasTitle) btn.removeAttribute('disabled');
    else btn.setAttribute('disabled', 'disabled');
  } else {
    btn.removeAttribute('disabled');
  }
}

function ctConfirmCreate() {
  if (!_ctSelectedTemplate) return;
  var category = _ctSelectedTemplate;
  var titleInput = document.getElementById('ctTitleInput');
  var title = titleInput ? titleInput.value.trim() : '';
  if (category === 'custom' && !title) return;

  var ticket = ctCreateTicket(category, title);
  if (!ticket) return;

  _careTickets.push(ticket);
  localStorage.setItem('ctEverUsed', '1');
  ctSave();
  ctScheduleInApp(ticket);

  // Notification permission prompt on first ticket creation
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    ctRequestNotificationPermission();
  }

  showQLToast(zi('check') + ' Tracking started');
  ctCloseOverlay('picker');
  renderHome();
}

// ── 2. Check-In Overlay ──

function ctOpenCheckIn(ticketId) {
  if (_ctOverlayOpen()) return;
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var tpl = CT_TEMPLATES[t.category];
  if (!tpl) return;

  // Duplicate check-in guard
  if (t.lastCheckInAt && (Date.now() - new Date(t.lastCheckInAt).getTime()) < 60000) {
    if (typeof confirmAction === 'function') {
      confirmAction('Last check-in was less than a minute ago. Submit another?', function() {
        _ctRenderCheckIn(t, tpl);
      });
      return;
    }
  }
  _ctRenderCheckIn(t, tpl);
}

function _ctRenderCheckIn(t, tpl) {
  history.pushState(null, '', '');
  _ctCurrentAnswers = {};
  var prefilled = ctPreFillAnswers(t);
  Object.keys(prefilled).forEach(function(k) { _ctCurrentAnswers[k] = prefilled[k]; });

  var scrim = document.createElement('div');
  scrim.className = 'ct-checkin-scrim';
  var body = document.createElement('div');
  body.className = 'ct-checkin-body';

  var isIncident = t.type === 'incident';
  var html = '';

  // Header
  html += '<div class="ct-checkin-header">';
  html += '<div class="ct-overlay-header">';
  html += '<span class="ct-overlay-title">' + zi(tpl.icon) + ' ' + escHtml(t.title) + '</span>';
  html += '<span class="ct-close-btn" data-action="ctClose" data-arg="checkin">&times;</span>';
  html += '</div>';
  html += '<div class="ct-card-meta">Started ' + ctTimeAgo(t.createdAt);
  if (t.lastCheckInAt) html += ' &middot; Last check-in ' + ctTimeAgo(t.lastCheckInAt);
  html += '</div>';
  html += '</div>';

  // Escalation context
  if (t.status === 'escalated' && t.escalationHistory && t.escalationHistory.length > 0) {
    var lastEsc = t.escalationHistory[t.escalationHistory.length - 1];
    html += '<div class="ct-escalation-card">';
    html += '<div class="ct-esc-header">' + zi('siren') + ' This needs attention</div>';
    if (lastEsc.trigger) {
      var q = (tpl.questions || []).find(function(qq) { return qq.id === lastEsc.trigger.field; });
      if (q) html += '<div class="ct-card-meta">' + escHtml(q.label) + ': ' + escHtml(String(lastEsc.trigger.value)) + '</div>';
    }
    html += '<div class="ct-card-meta">Trust your instincts \u2014 seek help if worried, don\'t wait for the app.</div>';
    html += '</div>';
  }

  // OnceOnly read-only strip
  var firstCI = (t.checkIns && t.checkIns.length > 0) ? t.checkIns[0] : null;
  var questions = tpl.questions || [];
  questions.forEach(function(q) {
    if (!q.onceOnly) return;
    if (!firstCI || !firstCI.answers || firstCI.answers[q.id] === undefined || firstCI.answers[q.id] === null || firstCI.answers[q.id] === '') return;
    html += '<div class="ct-readonly-strip"><strong>' + escHtml(q.label) + '</strong> ' + escHtml(String(firstCI.answers[q.id])) + '</div>';
  });

  // Auto-data display (goal tickets)
  if (t.type === 'goal') {
    var autoHtml = '';
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('sleep') !== -1) {
      var ss = ctGetMetricValue('dailySleepScore');
      if (ss !== null) autoHtml += 'Sleep score: ' + ss + '/100. ';
    }
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('growth') !== -1) {
      var wv = ctGetMetricValue('wtGPerWeek');
      if (wv !== null) autoHtml += 'Weight velocity: ' + Math.round(wv) + ' g/week. ';
    }
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('diet') !== -1) {
      var uf = ctGetMetricValue('uniqueFoods7d');
      if (uf !== null) autoHtml += 'Unique foods (7d): ' + uf + '. ';
    }
    if (autoHtml) html += '<div class="ct-auto-data">' + autoHtml + '</div>';
  }

  // Preamble
  html += '<div class="ct-preamble">' + (isIncident ? 'How is she right now?' : 'Quick update') + '</div>';

  // Quick-clear button
  if (ctCanQuickClear(t)) {
    var qcLabel = t.status === 'escalated' ? 'Symptoms resolved \u2014 all clear now' :
                  (isIncident ? 'All clear \u2014 no concerns' : 'Quick answer \u2014 all defaults');
    html += '<span class="chip ct-quick-clear" data-action="ctQuickClear" data-id="' + escAttr(t.id) + '">' + zi('check') + ' ' + escHtml(qcLabel) + '</span>';
  }

  // Questions
  html += '<div class="ct-questions">';
  questions.forEach(function(q) {
    // Skip onceOnly that already have answers
    if (q.onceOnly && firstCI && firstCI.answers && (firstCI.answers[q.id] !== undefined && firstCI.answers[q.id] !== null && firstCI.answers[q.id] !== '')) return;

    html += '<div class="ct-question">';
    html += '<div class="ct-question-label">' + escHtml(q.label) + '</div>';

    if (q.type === 'bool') {
      var boolClass = isIncident ? 'ct-incident-bool' : 'ct-goal-bool';
      var trueActive = (_ctCurrentAnswers[q.id] === true) ? ' active' : '';
      var falseActive = (_ctCurrentAnswers[q.id] === false) ? ' active' : '';
      html += '<div class="ct-chips-row">';
      html += '<span class="ct-bool-chip ' + boolClass + trueActive + '" data-action="ctSelectAnswer" data-arg="' + escAttr(q.id) + '" data-value="true">Yes</span>';
      html += '<span class="ct-bool-chip ' + boolClass + falseActive + '" data-action="ctSelectAnswer" data-arg="' + escAttr(q.id) + '" data-value="false">No</span>';
      html += '</div>';
    } else if (q.type === 'select') {
      var ansClass = isIncident ? 'ct-incident-ans' : '';
      html += '<div class="ct-chips-row">';
      (q.options || []).forEach(function(opt) {
        var isActive = (_ctCurrentAnswers[q.id] === opt) ? ' active' : '';
        html += '<span class="chip ct-answer-chip ' + ansClass + isActive + '" data-action="ctSelectAnswer" data-arg="' + escAttr(q.id) + '" data-value="' + escAttr(opt) + '">' + escHtml(opt) + '</span>';
      });
      html += '</div>';
    } else if (q.type === 'text') {
      var textVal = _ctCurrentAnswers[q.id] || '';
      html += '<textarea class="ct-text-input" id="ct-q-' + escAttr(q.id) + '" data-action="ctInputAnswer" data-arg="' + escAttr(q.id) + '" maxlength="500" placeholder="...">' + escHtml(textVal) + '</textarea>';
    }

    html += '</div>';
  });
  html += '</div>';

  // Sticky submit
  var complete = ctIsCheckInComplete(t);
  html += '<div class="ct-submit-area">';
  html += '<span class="chip" data-action="ctSubmitCheckIn" data-id="' + escAttr(t.id) + '"' + (complete ? '' : ' disabled') + '>Submit</span>';
  html += '</div>';

  body.innerHTML = html;
  scrim.appendChild(body);

  // No outside tap close for check-in (has form data)
  document.body.appendChild(scrim);

  // visualViewport resize listener for mobile keyboard
  if (typeof visualViewport !== 'undefined' && visualViewport) {
    _ctResizeHandler = function() {
      var submitArea = scrim.querySelector('.ct-submit-area');
      if (submitArea) {
        var offset = window.innerHeight - visualViewport.height;
        submitArea.style.paddingBottom = offset > 0 ? offset + 'px' : '0';
      }
    };
    visualViewport.addEventListener('resize', _ctResizeHandler);
  }
}

function ctSelectAnswer(questionId, rawValue) {
  var value = parseBoolOrString(rawValue);
  _ctCurrentAnswers[questionId] = value;

  // Toggle active class on chips in same question group
  var chips = document.querySelectorAll('[data-action="ctSelectAnswer"][data-arg="' + escAttr(questionId) + '"]');
  for (var i = 0; i < chips.length; i++) {
    var chipVal = parseBoolOrString(chips[i].getAttribute('data-value'));
    chips[i].classList.toggle('active', chipVal === value);
  }

  // Re-check submit state
  _ctUpdateCheckInSubmit();
}

function ctInputAnswer(questionId) {
  var el = document.getElementById('ct-q-' + questionId);
  if (el) _ctCurrentAnswers[questionId] = el.value || '';
  _ctUpdateCheckInSubmit();
  // Also handle picker title input
  if (questionId === 'title') _ctUpdatePickerConfirm();
}

function _ctUpdateCheckInSubmit() {
  var scrim = document.querySelector('.ct-checkin-scrim');
  if (!scrim) return;
  var submitBtn = scrim.querySelector('[data-action="ctSubmitCheckIn"]');
  if (!submitBtn) return;
  var ticketId = submitBtn.getAttribute('data-id');
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  if (ctIsCheckInComplete(t)) submitBtn.removeAttribute('disabled');
  else submitBtn.setAttribute('disabled', 'disabled');
}

function ctQuickClear(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var tpl = CT_TEMPLATES[t.category];
  if (!tpl) return;

  var questions = tpl.questions || [];
  questions.forEach(function(q) {
    if (q.type === 'bool') {
      _ctCurrentAnswers[q.id] = (q.resolutionBlocking !== false) ? false : null;
    } else if (q.type === 'select') {
      _ctCurrentAnswers[q.id] = (q.resolutionBlocking !== false && q.clearValue) ? q.clearValue : null;
    } else if (q.type === 'text') {
      _ctCurrentAnswers[q.id] = '';
    }
  });

  ctSubmitCheckIn(ticketId, 'quick_clear');
}

function ctSubmitCheckIn(ticketId, source) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var tpl = CT_TEMPLATES[t.category];
  if (!tpl) return;

  // 1. Collect (override text from DOM)
  var raw = ctCollectAnswers(ticketId);
  // 2. Sanitize
  var answers = ctSanitizeAnswers(t, raw);
  // 3. Verdict
  var result = ctComputeVerdict(t, answers);
  // 4. AutoData
  var autoData = _ctBuildAutoData(tpl);
  // 5. Build check-in
  var checkIn = {
    time: new Date().toISOString(),
    source: source || 'manual',
    answers: answers,
    autoData: autoData,
    verdict: result.verdict
  };
  // 6. Push
  t.checkIns.push(checkIn);
  t.lastCheckInAt = checkIn.time;
  // 7. Advance schedule
  ctAdvanceToNextFuture(t);

  // 8. Handle verdict
  if (result.verdict === 'escalate') {
    ctHandleEscalation(t, result.trigger, result.allTriggers);
    // 9. Schedule next (runs for all paths)
    ctScheduleInApp(t);
    _ctShowEscalationCard(t, result.trigger);
    return; // Don't close overlay
  }
  if (result.verdict === 'clear' && t.status === 'escalated') {
    ctSave();
    // 9. Schedule next (runs for all paths)
    ctScheduleInApp(t);
    _ctShowDeEscalationPrompt(t);
    return; // Don't close overlay
  }

  // Normal flow
  ctSave();
  // 9. Schedule next (runs for all paths)
  ctScheduleInApp(t);
  delete _ctNotifiedTickets[ticketId];
  showQLToast(zi('check') + ' Check-in submitted');
  ctCloseOverlay('checkin');
  renderHome();
}

function _ctBuildAutoData(tpl) {
  var ad = { recentIllness: [], recentSleep: null, recentPoop: null, growthVelocity: null };
  try {
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('illness') !== -1) {
      var eps = (typeof _getAllEpisodes === 'function') ? _getAllEpisodes() : [];
      ad.recentIllness = eps.filter(function(e) { return e.status === 'active'; }).slice(0, 3).map(function(e) {
        return { type: e.type || 'unknown', status: e.status, startedAt: e.startedAt, durationDays: Math.ceil((Date.now() - new Date(e.startedAt).getTime()) / 86400000) };
      });
    }
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('sleep') !== -1) {
      var ss = getDailySleepScore(today());
      if (ss) ad.recentSleep = { score: ss.score, duration: ss.totalMinutes || null, date: today() };
    }
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('growth') !== -1) {
      var gv = (typeof getGrowthVelocity === 'function') ? getGrowthVelocity() : null;
      if (gv) ad.growthVelocity = { wtGPerWeek: gv.wtGPerWeek || null, htCmPerMonth: gv.htCmPerMonth || null };
    }
    if (tpl.autoDataSources && tpl.autoDataSources.indexOf('poop') !== -1) {
      ad.recentPoop = (poopData || []).filter(function(p) { return p.date === today(); });
    }
  } catch(e) { console.warn('CT autoData build error:', e); }
  return ad;
}

function _ctShowEscalationCard(ticket, trigger) {
  var scrim = document.querySelector('.ct-checkin-scrim');
  if (!scrim) return;
  var body = scrim.querySelector('.ct-checkin-body');
  if (!body) return;

  var actionText = (trigger && trigger.action === 'er_visit') ? 'Go to the emergency room now' : 'Call your doctor';
  var html = '';
  html += '<div class="ct-escalation-card">';
  html += '<div class="ct-overlay-title">' + zi('siren') + ' ' + escHtml(actionText) + '</div>';
  html += '<div class="ct-divider"></div>';

  var doc = ctGetPrimaryDoctor();
  if (doc) {
    html += '<div class="ct-card-meta">' + escHtml(doc.name || 'Doctor') + '</div>';
    html += '<a href="tel:' + escAttr(doc.phone) + '" class="ct-phone-number">' + escHtml(doc.phone) + '</a>';
    html += '<span class="chip ct-answer-chip" data-action="ctCopyPhone" data-arg="' + escAttr(doc.phone) + '">Copy number</span>';
  } else {
    html += '<div class="ct-card-meta">No doctor configured \u2014 add one in Medical tab</div>';
  }

  html += '<div class="ct-divider"></div>';
  html += '<div class="ct-card-meta">Trust your instincts \u2014 seek help if worried, don\'t wait for the app.</div>';
  html += '<div class="ct-divider"></div>';
  html += '<span class="chip ct-answer-chip" data-action="ctKeepEscalated" data-id="' + escAttr(ticket.id) + '">Continue monitoring</span>';
  html += '</div>';

  body.innerHTML = html;
}

function _ctShowDeEscalationPrompt(ticket) {
  var scrim = document.querySelector('.ct-checkin-scrim');
  if (!scrim) return;
  var body = scrim.querySelector('.ct-checkin-body');
  if (!body) return;

  var html = '<div class="ct-deescalate-prompt">';
  html += '<div class="ct-overlay-title">Symptoms seem to have improved</div>';
  html += '<div class="ct-divider"></div>';
  html += '<div class="ct-chips-row">';
  html += '<span class="chip ct-resolve-btn" data-action="ctDeEscalate" data-id="' + escAttr(ticket.id) + '">' + zi('check') + ' Situation improved</span>';
  html += '<span class="chip ct-answer-chip" data-action="ctKeepEscalated" data-id="' + escAttr(ticket.id) + '">Continue monitoring</span>';
  html += '</div>';
  html += '</div>';

  body.innerHTML = html;
}

// ── 3. Detail/History Overlay ──

function ctOpenDetail(ticketId) {
  if (_ctOverlayOpen()) return;
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var tpl = CT_TEMPLATES[t.category];
  if (!tpl) return;

  history.pushState(null, '', '');

  var scrim = document.createElement('div');
  scrim.className = 'ct-detail-scrim';
  var body = document.createElement('div');
  body.className = 'ct-detail-body';

  var html = '';

  // Header
  html += '<div class="ct-overlay-header">';
  html += '<span class="ct-overlay-title">' + zi(tpl.icon) + ' ' + escHtml(t.title) + '</span>';
  var badgeClass = t.status === 'escalated' ? 'ct-rose' : (t.status === 'resolved' ? 'ct-sage' : 'ct-amber');
  var badgeText = t.status === 'escalated' ? 'Needs attention' : (t.status === 'resolved' ? 'All clear' : 'Watching');
  html += '<span class="ct-status-badge ' + badgeClass + '">' + escHtml(badgeText) + '</span>';
  html += '<span class="ct-close-btn" data-action="ctClose" data-arg="detail">&times;</span>';
  html += '</div>';

  // Info line
  html += '<div class="ct-card-meta">Started ' + ctTimeAgo(t.createdAt) + ' &middot; ' + t.checkIns.length + ' check-ins</div>';

  // Reopen count note
  if (t.reopenCount >= 2) {
    html += '<div class="ct-reopen-note">Reopened ' + t.reopenCount + ' times \u2014 consider starting fresh</div>';
  }

  // Timeline (reverse chronological)
  html += '<div class="ct-divider"></div>';

  // Combine check-ins and escalation events chronologically
  var events = [];
  (t.checkIns || []).forEach(function(ci, idx) {
    events.push({ type: 'checkin', data: ci, time: new Date(ci.time).getTime(), idx: idx });
  });
  (t.escalationHistory || []).forEach(function(esc) {
    events.push({ type: 'escalation', data: esc, time: new Date(esc.at).getTime() });
  });
  events.sort(function(a, b) { return b.time - a.time; }); // Most recent first

  var totalEvents = events.length;
  events.forEach(function(ev, i) {
    var isOlder = i >= CT_DETAIL_VISIBLE;
    if (isOlder) html += '<div class="ct-timeline-entry ct-older-hidden">';
    else html += '<div class="ct-timeline-entry">';

    if (ev.type === 'escalation') {
      html += '<div class="ct-timeline-time">' + ctTimeAgo(ev.data.at) + '</div>';
      var escTrigger = ev.data.trigger || {};
      var escQ = (tpl.questions || []).find(function(q) { return q.id === escTrigger.field; });
      html += '<div class="ct-timeline-verdict ct-verdict-escalate">' + zi('siren') + ' Escalated \u2014 ' + escHtml(ev.data.action === 'er_visit' ? 'Go to ER' : 'Call doctor') + '</div>';
      if (escQ) html += '<div class="ct-timeline-answers">' + escHtml(escQ.label) + ': ' + escHtml(String(escTrigger.value)) + '</div>';
    } else {
      var ci = ev.data;
      html += '<div class="ct-timeline-time">' + ctTimeAgo(ci.time) + '</div>';
      var verdictLabel = ci.verdict === 'clear' ? 'All clear' : (ci.verdict === 'escalate' ? 'Escalated' : 'Keep watching');
      var verdictClass = ci.verdict === 'clear' ? 'ct-verdict-clear' : (ci.verdict === 'escalate' ? 'ct-verdict-escalate' : 'ct-verdict-watch');
      html += '<div class="ct-timeline-verdict ' + verdictClass + '">' + escHtml(verdictLabel) + '</div>';

      if (ci.source === 'quick_clear') {
        html += '<div class="ct-timeline-answers">Quick check \u2014 all clear</div>';
      } else if (ci.answers) {
        var answerLines = [];
        (tpl.questions || []).forEach(function(q) {
          var v = ci.answers[q.id];
          if (v !== null && v !== undefined && v !== '') {
            answerLines.push(escHtml(q.label) + ': ' + escHtml(String(v)));
          }
        });
        if (answerLines.length > 0) html += '<div class="ct-timeline-answers">' + answerLines.join('<br>') + '</div>';
      }
    }
    html += '</div>';
    if (i < totalEvents - 1) {
      html += '<div class="ct-entry-divider' + (isOlder ? ' ct-older-hidden' : '') + '"></div>';
    }
  });

  // Show earlier toggle
  var olderCount = Math.max(0, totalEvents - CT_DETAIL_VISIBLE);
  if (olderCount > 0) {
    html += '<div class="ct-entry-divider"></div>';
    html += '<span class="chip ct-answer-chip" data-action="ctShowOlderCheckIns">Show earlier (' + olderCount + ')</span>';
  }

  // Action buttons
  html += '<div class="ct-detail-actions">';
  if (t.status === 'active' || t.status === 'escalated') {
    html += '<span class="chip ct-banner-btn" data-action="ctOpenCheckIn" data-id="' + escAttr(t.id) + '">' + zi('follow-up') + ' Check in</span>';

    // Resolve button — only if criteria met or schedule exhausted
    var criteria = ctResolutionCriteria(t);
    var canResolve = false;
    if (criteria.type === 'consecutive_clear') {
      canResolve = ctConsecutiveClears(t) >= criteria.count;
    } else if (criteria.type === 'sustained_metric') {
      canResolve = ctSustainedDays(t).count >= criteria.sustainDays;
    } else if (criteria.type === 'threshold_met') {
      canResolve = ctCheckThresholdMet(t).met;
    } else if (criteria.type === 'manual') {
      canResolve = true;
    }
    // Also allow if schedule exhausted
    if (t.nextFollowUpIdx >= t.followUps.length) canResolve = true;

    if (canResolve) {
      html += '<span class="chip ct-resolve-btn" data-action="ctResolveTicket" data-id="' + escAttr(t.id) + '">' + zi('resolve') + ' All clear \u2014 stop tracking</span>';
    }

    if (t.status === 'escalated') {
      html += '<span class="chip ct-answer-chip" data-action="ctForceResolve" data-id="' + escAttr(t.id) + '">Force resolve</span>';
    }
  }
  if (t.status === 'resolved') {
    html += '<span class="chip ct-banner-btn" data-action="ctReopenTicket" data-id="' + escAttr(t.id) + '">Reopen</span>';
  }
  html += '<span class="chip ct-answer-chip" data-action="ctShareSummary" data-id="' + escAttr(t.id) + '">' + zi('link') + ' Share</span>';
  html += '<span class="chip ct-answer-chip" data-action="ctDeleteTicket" data-id="' + escAttr(t.id) + '">Remove</span>';
  html += '</div>';

  body.innerHTML = html;
  scrim.appendChild(body);

  // Outside tap closes (Read overlay)
  scrim.addEventListener('click', function(e) {
    if (e.target === scrim) ctCloseOverlay('detail');
  });

  document.body.appendChild(scrim);
}

// ── 4. State Transition Handlers ──

function ctHandleEscalation(ticket, trigger, allTriggers) {
  var now = new Date().toISOString();
  (allTriggers || []).forEach(function(tr) {
    ticket.escalationHistory.push({ at: now, trigger: { field: tr.field, value: tr.value }, action: tr.action });
  });
  // Update escalatedAt if new or higher severity
  if (ticket.status !== 'escalated' || !ticket.escalatedAt) {
    ticket.escalatedAt = now;
  } else if (trigger) {
    var currentSev = 0;
    var lastEsc = ticket.escalationHistory.length > 1 ? ticket.escalationHistory[ticket.escalationHistory.length - 2] : null;
    if (lastEsc) currentSev = ACTION_SEVERITY[lastEsc.action] || 0;
    if ((ACTION_SEVERITY[trigger.action] || 0) > currentSev) ticket.escalatedAt = now;
  }
  ticket.status = 'escalated';
  ctSave();
}

function ctResolveTicket(ticketId, force) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;

  if (!force) {
    var criteria = ctResolutionCriteria(t);
    if (criteria.type === 'consecutive_clear') {
      var clears = ctConsecutiveClears(t);
      if (clears < criteria.count && t.nextFollowUpIdx < t.followUps.length) return;
    }
  }

  t.status = 'resolved';
  t.resolvedAt = new Date().toISOString();
  if (_ctTimers[ticketId]) { clearTimeout(_ctTimers[ticketId]); delete _ctTimers[ticketId]; }
  delete _ctNotifiedTickets[ticketId];
  ctSave();

  // Close detail overlay if open
  if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
  renderHome();
  showQLToast(zi('resolve') + ' Tracking resolved');
}

function ctReopenTicket(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var now = new Date().toISOString();
  t.status = 'active';
  t.resolvedAt = null;
  t.reopenedAt = now;
  t.scheduleBaseTime = now;
  t.nextFollowUpIdx = 0;
  var tpl = CT_TEMPLATES[t.category];
  if (tpl) t.followUps = tpl.followUps.slice();
  t.firstMetAt = null;
  t.lastSustainedCount = 0;
  t.reopenCount = (t.reopenCount || 0) + 1;
  delete _ctNotifiedTickets[ticketId];
  ctSave();
  ctScheduleInApp(t);
  if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
  renderHome();
  if (t.reopenCount >= 2) {
    showQLToast(zi('warn') + ' Reopened ' + t.reopenCount + ' times \u2014 consider starting fresh');
  } else {
    showQLToast(zi('check') + ' Tracking reopened');
  }
}

function ctDeEscalate(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var now = new Date().toISOString();
  t.status = 'active';
  t.deEscalatedAt = now;
  t.scheduleBaseTime = now;
  t.nextFollowUpIdx = 0;
  var tpl = CT_TEMPLATES[t.category];
  if (tpl) t.followUps = tpl.followUps.slice();
  if (t.type === 'goal') { t.firstMetAt = null; t.lastSustainedCount = 0; }
  delete _ctNotifiedTickets[ticketId];
  ctSave();
  ctScheduleInApp(t);
  ctCloseOverlay('checkin');
  renderHome();
  showQLToast(zi('check') + ' Status updated');
}

function ctKeepEscalated(ticketId) {
  ctCloseOverlay('checkin');
  renderHome();
}

function ctForceResolve(ticketId) {
  var detailBody = document.querySelector('.ct-detail-body');
  if (!detailBody) return;

  var html = '<div class="ct-resolve-prompt">';
  html += '<div class="ct-overlay-title">Why are you resolving this?</div>';
  html += '<div class="ct-divider"></div>';
  html += '<div class="ct-chips-row" id="ctForceReasons">';
  var reasons = ['Doctor confirmed she\'s okay', 'I\'m confident she\'s fine', 'Other'];
  reasons.forEach(function(r) {
    html += '<span class="chip ct-reason-chip" data-action="ctForceResolveReason" data-id="' + escAttr(ticketId) + '" data-arg="' + escAttr(r) + '">' + escHtml(r) + '</span>';
  });
  html += '</div>';
  html += '<div class="ct-title-area ct-hidden" id="ctForceOtherArea">';
  html += '<textarea class="ct-text-input" id="ctForceOtherInput" maxlength="200" placeholder="Reason..."></textarea>';
  html += '</div>';
  html += '<div class="ct-submit-area ct-hidden" id="ctForceConfirmArea">';
  html += '<span class="chip" data-action="ctForceResolveConfirm" data-id="' + escAttr(ticketId) + '">Confirm resolve</span>';
  html += '</div>';
  html += '</div>';

  detailBody.innerHTML = html;
}

var _ctForceResolveReason = null;

function ctForceResolveReason(ticketId, reason) {
  _ctForceResolveReason = reason;

  // Toggle active on reason chips
  var chips = document.querySelectorAll('#ctForceReasons .ct-reason-chip');
  for (var i = 0; i < chips.length; i++) {
    chips[i].classList.toggle('active', chips[i].getAttribute('data-arg') === reason);
  }

  var otherArea = document.getElementById('ctForceOtherArea');
  var confirmArea = document.getElementById('ctForceConfirmArea');
  if (reason === 'Other') {
    otherArea.classList.remove('ct-hidden');
  } else {
    otherArea.classList.add('ct-hidden');
  }
  confirmArea.classList.remove('ct-hidden');
}

function ctForceResolveConfirm(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var reason = _ctForceResolveReason || '';
  if (reason === 'Other') {
    var otherInput = document.getElementById('ctForceOtherInput');
    reason = otherInput ? otherInput.value.trim() : 'Other';
  }
  t.resolvedNotes = reason;
  _ctForceResolveReason = null;
  ctResolveTicket(ticketId, true);
}

function ctDeleteTicket(ticketId) {
  if (typeof confirmAction === 'function') {
    confirmAction('Remove this tracking? This cannot be undone.', function() {
      _ctDoDelete(ticketId);
    });
  } else {
    _ctDoDelete(ticketId);
  }
}

function _ctDoDelete(ticketId) {
  if (_ctTimers[ticketId]) { clearTimeout(_ctTimers[ticketId]); delete _ctTimers[ticketId]; }
  delete _ctNotifiedTickets[ticketId];
  _careTickets = _careTickets.filter(function(t) { return t.id !== ticketId; });
  ctSave();
  if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
  if (document.querySelector('.ct-checkin-scrim')) ctCloseOverlay('checkin');
  renderHome();
  showQLToast(zi('check') + ' Tracking removed');
}

function ctShareSummary(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var text = ctBuildShareSummary(t);
  if (navigator.share) {
    navigator.share({ title: t.title + ' \u2014 tracking summary', text: text }).catch(function() {});
  } else {
    _qaClipboardFallback(text);
    showQLToast(zi('check') + ' Copied to clipboard');
  }
}

function ctBuildShareSummary(ticket) {
  var tpl = CT_TEMPLATES[ticket.category] || {};
  var lines = [];
  lines.push(ticket.title + ' \u2014 ' + (ticket.status === 'resolved' ? 'All clear' : (ticket.status === 'escalated' ? 'Needs attention' : 'Watching')));
  lines.push('Started: ' + new Date(ticket.createdAt).toLocaleDateString());
  if (ticket.scheduleBaseTime && ticket.scheduleBaseTime !== ticket.createdAt) {
    lines.push('Schedule rebased: ' + new Date(ticket.scheduleBaseTime).toLocaleDateString());
  }
  lines.push('Total check-ins: ' + ticket.checkIns.length);
  lines.push('');

  // Timeline — last CT_SHARE_MAX_CHECKINS
  var events = [];
  (ticket.checkIns || []).forEach(function(ci) {
    events.push({ type: 'checkin', data: ci, time: new Date(ci.time).getTime() });
  });
  (ticket.escalationHistory || []).forEach(function(esc) {
    events.push({ type: 'escalation', data: esc, time: new Date(esc.at).getTime() });
  });
  events.sort(function(a, b) { return a.time - b.time; });
  var recent = events.slice(-CT_SHARE_MAX_CHECKINS);

  recent.forEach(function(ev) {
    if (ev.type === 'escalation') {
      var d = ev.data;
      lines.push('[' + new Date(d.at).toLocaleString() + '] ESCALATION \u2014 ' + (d.action || ''));
    } else {
      var ci = ev.data;
      var verdictStr = ci.verdict === 'clear' ? 'All clear' : (ci.verdict === 'escalate' ? 'Escalated' : 'Watching');
      if (ci.source === 'quick_clear') {
        lines.push('[' + new Date(ci.time).toLocaleString() + '] Quick check \u2014 all clear');
      } else {
        var ansStr = '';
        if (ci.answers && tpl.questions) {
          tpl.questions.forEach(function(q) {
            var v = ci.answers[q.id];
            if (v !== null && v !== undefined && v !== '') ansStr += q.label + ': ' + v + '; ';
          });
        }
        lines.push('[' + new Date(ci.time).toLocaleString() + '] ' + verdictStr + (ansStr ? ' \u2014 ' + ansStr : ''));
      }
    }
  });

  if (ticket.status === 'resolved') {
    lines.push('');
    lines.push('Resolved: ' + new Date(ticket.resolvedAt).toLocaleDateString());
    if (ticket.resolvedNotes) lines.push('Note: ' + ticket.resolvedNotes);
  }

  return lines.join('\n');
}

function ctShowOlderCheckIns() {
  var entries = document.querySelectorAll('.ct-older-hidden');
  for (var i = 0; i < entries.length; i++) {
    entries[i].classList.remove('ct-older-hidden');
  }
  // Hide the "Show earlier" button
  var btn = document.querySelector('[data-action="ctShowOlderCheckIns"]');
  if (btn) btn.classList.add('ct-hidden');
}

function ctCopyPhone(phoneStr) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(phoneStr).then(function() {
      showQLToast(zi('check') + ' Number copied');
    });
  } else {
    _qaClipboardFallback(phoneStr);
    showQLToast(zi('check') + ' Number copied');
  }
}

// ── 5. Close Handler ──

function ctCloseOverlay(type) {
  var selectors = {
    picker: '.ct-picker-scrim',
    checkin: '.ct-checkin-scrim',
    detail: '.ct-detail-scrim'
  };
  var sel = selectors[type];
  if (!sel) return;
  var el = document.querySelector(sel);
  if (el) el.remove();

  if (type === 'checkin') {
    if (_ctResizeHandler && typeof visualViewport !== 'undefined' && visualViewport) {
      visualViewport.removeEventListener('resize', _ctResizeHandler);
    }
    _ctResizeHandler = null;
    _ctCurrentAnswers = {};
  }
  if (type === 'picker') {
    _ctSelectedTemplate = null;
  }
}

// ── 6. Overlay Action Handler ──

function ctHandleOverlayAction(action, el) {
  var arg = el ? (el.getAttribute('data-arg') || '') : '';
  var id = el ? (el.getAttribute('data-id') || '') : '';

  switch (action) {
    case 'ctRaiseTicket':
      if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
      ctOpenTemplatePicker();
      return true;
    case 'ctSelectTemplate':
      ctSelectTemplate(arg);
      return true;
    case 'ctConfirmCreate':
      ctConfirmCreate();
      return true;
    case 'ctOpenCheckIn':
      if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
      ctOpenCheckIn(id);
      return true;
    case 'ctQuickClear':
      ctQuickClear(id);
      return true;
    case 'ctSelectAnswer':
      ctSelectAnswer(arg, el ? el.getAttribute('data-value') : '');
      return true;
    case 'ctInputAnswer':
      ctInputAnswer(arg);
      return true;
    case 'ctSubmitCheckIn':
      ctSubmitCheckIn(id);
      return true;
    case 'ctResolveTicket':
      ctResolveTicket(id);
      return true;
    case 'ctReopenTicket':
      ctReopenTicket(id);
      return true;
    case 'ctForceResolve':
      ctForceResolve(id);
      return true;
    case 'ctForceResolveReason':
      ctForceResolveReason(id, arg);
      return true;
    case 'ctForceResolveConfirm':
      ctForceResolveConfirm(id);
      return true;
    case 'ctDeEscalate':
      ctDeEscalate(id);
      return true;
    case 'ctKeepEscalated':
      ctKeepEscalated(id);
      return true;
    case 'ctOpenDetail':
      ctOpenDetail(id);
      return true;
    case 'ctShareSummary':
      ctShareSummary(id);
      return true;
    case 'ctShareNotify':
      ctShareNotify(id);
      return true;
    case 'ctDeleteTicket':
      ctDeleteTicket(id);
      return true;
    case 'ctDismissOverdue':
      var t = _careTickets.find(function(tk) { return tk.id === id; });
      if (t) { ctAdvanceToNextFuture(t); ctSave(); renderHome(); }
      return true;
    case 'ctCopyPhone':
      ctCopyPhone(arg);
      return true;
    case 'ctShowOlderCheckIns':
      ctShowOlderCheckIns();
      return true;
    case 'ctClose':
      ctCloseOverlay(arg);
      return true;
    case 'ctViewAll':
      showQLToast(zi('clipboard') + ' Coming soon');
      return true;
    case 'ctViewOverdue':
      showQLToast(zi('clipboard') + ' Coming soon');
      return true;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// CARETICKETS — Notifications, Integration, Polish (Phase D)
// ═══════════════════════════════════════════════════════════════

// ── 7. Scheduling + Notification Firing ──

function ctScheduleInApp(ticket) {
  if (!ticket || !ticket.id) return;
  // Clear existing timer
  if (_ctTimers[ticket.id]) {
    clearTimeout(_ctTimers[ticket.id]);
    delete _ctTimers[ticket.id];
  }
  // Guard: only active/escalated
  if (ticket.status !== 'active' && ticket.status !== 'escalated') return;
  // Guard: exhausted schedule — don't schedule (setTimeout(fn, Infinity) fires immediately)
  var dueMs = ctNextDueTime(ticket);
  if (dueMs === Infinity) return;
  var delay = dueMs - Date.now();
  if (delay <= 0) return; // Already overdue — banner handles it
  // Guard: overflow — cap at MAX_TIMEOUT
  if (delay > MAX_TIMEOUT) delay = MAX_TIMEOUT;

  _ctTimers[ticket.id] = setTimeout(function() {
    delete _ctTimers[ticket.id];
    ctFireNotification(ticket.id);
  }, delay);
}

function ctFireNotification(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  if (t.status !== 'active' && t.status !== 'escalated') return;
  // Guard: concurrent — don't fire if check-in overlay is open for this ticket
  var openCI = document.querySelector('.ct-checkin-scrim [data-action="ctSubmitCheckIn"][data-id="' + ticketId + '"]');
  if (openCI) return;
  // Guard: dedup
  if (_ctNotifiedTickets[ticketId]) return;

  // Quiet hours check (escalated bypasses)
  if (t.status !== 'escalated') {
    var h = new Date().getHours();
    if (h >= CT_QUIET_START || h < CT_QUIET_END) {
      _ctDeferToQuietEnd(t);
      return;
    }
  }

  _ctNotifiedTickets[ticketId] = true;

  // Guard: visibility — foregrounded vs hidden
  if (document.visibilityState === 'hidden' || document.hidden) {
    // System notification
    _ctSystemNotify(t);
  }
  // Always render in-app banner on next renderHome
  renderHome();
}

function _ctDeferToQuietEnd(ticket) {
  if (_ctTimers[ticket.id]) {
    clearTimeout(_ctTimers[ticket.id]);
    delete _ctTimers[ticket.id];
  }
  // Calculate ms until CT_QUIET_END today or tomorrow
  var now = new Date();
  var target = new Date(now);
  target.setHours(CT_QUIET_END, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  // Stagger by 2 minutes per ticket index to avoid burst
  var activeIdx = 0;
  for (var i = 0; i < _careTickets.length; i++) {
    if (_careTickets[i].id === ticket.id) break;
    if (_careTickets[i].status === 'active' || _careTickets[i].status === 'escalated') activeIdx++;
  }
  var delay = target.getTime() - now.getTime() + (activeIdx * 120000);
  if (delay > MAX_TIMEOUT) delay = MAX_TIMEOUT;

  _ctTimers[ticket.id] = setTimeout(function() {
    delete _ctTimers[ticket.id];
    ctFireNotification(ticket.id);
  }, delay);
}

function _ctSystemNotify(ticket) {
  try {
    if (typeof Notification === 'undefined') return;
    // Live permission check
    var perm = Notification.permission;
    save(KEYS.notifPermission, perm);
    if (perm !== 'granted') return;
    var text = ctNotificationText(ticket);
    // Strip HTML from text
    var plain = text.replace(/<[^>]*>/g, '');
    var n = new Notification('SproutLab', {
      body: plain,
      tag: 'ct-' + ticket.id,
      data: { ticketId: ticket.id }
    });
    n.onclick = function() {
      window.focus();
      // Set deep link param for processing
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('ct', ticket.id);
        history.replaceState(null, '', url.toString());
      } catch(e) {}
      _ctCheckDeepLink();
      n.close();
    };
  } catch(e) {
    console.warn('CT system notification failed:', e);
  }
}

// ── 8. Permission Flow + Deep Link ──

function ctRequestNotificationPermission() {
  if (typeof Notification === 'undefined') {
    save(KEYS.notifPermission, 'unavailable');
    return;
  }
  var perm = Notification.permission;
  save(KEYS.notifPermission, perm);
  if (perm === 'default') {
    Notification.requestPermission().then(function(result) {
      save(KEYS.notifPermission, result);
    }).catch(function() {});
  }
}

function _ctCheckDeepLink() {
  try {
    var url = new URL(window.location.href);
    var ctParam = url.searchParams.get('ct');
    if (!ctParam) return;
    // Clean URL
    url.searchParams.delete('ct');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    // Suppress overdue banner for this ticket
    _ctNotifiedTickets[ctParam] = true;
    // Open check-in
    var t = _careTickets.find(function(tk) { return tk.id === ctParam; });
    if (t && (t.status === 'active' || t.status === 'escalated')) {
      // Close any existing overlay first
      if (document.querySelector('.ct-checkin-scrim')) ctCloseOverlay('checkin');
      if (document.querySelector('.ct-picker-scrim')) ctCloseOverlay('picker');
      if (document.querySelector('.ct-detail-scrim')) ctCloseOverlay('detail');
      setTimeout(function() { ctOpenCheckIn(ctParam); }, 100);
    }
  } catch(e) {
    console.warn('CT deep link error:', e);
  }
}

// ── 9. TSF Events ──

function ctGetTSFEvents() {
  var events = [];
  var t = today();
  var todayStart = new Date(t).getTime();
  var todayEnd = todayStart + 86400000;

  _careTickets.forEach(function(ticket) {
    var tpl = CT_TEMPLATES[ticket.category] || {};
    var color = ctDomainColor(ticket);
    var iconName = tpl.icon || 'clipboard';
    var count = 0;

    // Creation event (if created today)
    var createdMs = new Date(ticket.createdAt).getTime();
    if (createdMs >= todayStart && createdMs < todayEnd && count < 3) {
      var createdTime = new Date(ticket.createdAt);
      var timeStr = (createdTime.getHours() < 10 ? '0' : '') + createdTime.getHours() + ':' +
                    (createdTime.getMinutes() < 10 ? '0' : '') + createdTime.getMinutes();
      events.push({
        id: 'ct-created-' + ticket.id,
        type: 'careticket',
        time: timeStr,
        timeMin: createdTime.getHours() * 60 + createdTime.getMinutes(),
        label: 'Started tracking: ' + escHtml(ticket.title),
        detail: '',
        icon: zi(iconName),
        color: color,
        inferred: false,
        displayTime: _tsfFormatTime(timeStr)
      });
      count++;
    }

    // Latest check-in today
    var todayCheckins = (ticket.checkIns || []).filter(function(ci) {
      var ms = new Date(ci.time).getTime();
      return ms >= todayStart && ms < todayEnd;
    });
    if (todayCheckins.length > 0 && count < 3) {
      var latest = todayCheckins[todayCheckins.length - 1];
      var ciTime = new Date(latest.time);
      var ciTimeStr = (ciTime.getHours() < 10 ? '0' : '') + ciTime.getHours() + ':' +
                      (ciTime.getMinutes() < 10 ? '0' : '') + ciTime.getMinutes();
      var verdictIcon = latest.verdict === 'clear' ? 'check' : (latest.verdict === 'escalate' ? 'siren' : 'follow-up');
      var detailText = todayCheckins.length > 1 ? (todayCheckins.length + ' check-ins today') : '';
      events.push({
        id: 'ct-checkin-' + ticket.id,
        type: 'careticket',
        time: ciTimeStr,
        timeMin: ciTime.getHours() * 60 + ciTime.getMinutes(),
        label: escHtml(ticket.title) + ' check-in',
        detail: detailText,
        icon: zi(verdictIcon),
        color: color,
        inferred: false,
        displayTime: _tsfFormatTime(ciTimeStr)
      });
      count++;
    }

    // Resolution event (if resolved today)
    if (ticket.status === 'resolved' && ticket.resolvedAt && count < 3) {
      var resolvedMs = new Date(ticket.resolvedAt).getTime();
      if (resolvedMs >= todayStart && resolvedMs < todayEnd) {
        var resTime = new Date(ticket.resolvedAt);
        var resTimeStr = (resTime.getHours() < 10 ? '0' : '') + resTime.getHours() + ':' +
                         (resTime.getMinutes() < 10 ? '0' : '') + resTime.getMinutes();
        events.push({
          id: 'ct-resolved-' + ticket.id,
          type: 'careticket',
          time: resTimeStr,
          timeMin: resTime.getHours() * 60 + resTime.getMinutes(),
          label: escHtml(ticket.title) + ' resolved',
          detail: '',
          icon: zi('resolve'),
          color: 'sage',
          inferred: false,
          displayTime: _tsfFormatTime(resTimeStr)
        });
      }
    }
  });

  return events;
}

// ── 10. QA Intent — CareTickets ──

function ctShouldTriggerCreate(text) {
  var lower = text.toLowerCase().replace(/[?!.,]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  var strongSignals = ['track', 'tracking', 'monitor', 'monitor this', 'start watching', 'raise concern'];
  var weakSignals = ['fell', 'fall', 'bump', 'hit head', 'hit her head', 'ate something'];
  var negativeSignals = ['asleep', 'sleep', 'behind', 'apart', 'fall asleep', 'fell asleep', 'sleep track'];

  // Check negative signals
  var hasNegative = negativeSignals.some(function(neg) { return lower.indexOf(neg) !== -1; });

  // Strong signals trigger immediately
  var hasStrong = strongSignals.some(function(sig) { return lower.indexOf(sig) !== -1; });
  if (hasStrong && !hasNegative) return true;

  // Weak signals only if no negative and no other classifier matched
  var hasWeak = weakSignals.some(function(sig) { return lower.indexOf(sig) !== -1; });
  if (hasWeak && !hasNegative) return 'weak';

  return false;
}

// ── 11. Share Notify (creation message) ──

function ctShareNotify(ticketId) {
  var t = _careTickets.find(function(tk) { return tk.id === ticketId; });
  if (!t) return;
  var tpl = CT_TEMPLATES[t.category] || {};
  var lines = [];
  lines.push('Started tracking: ' + t.title);
  lines.push('Type: ' + (t.type === 'incident' ? 'Incident' : 'Goal'));
  lines.push('Started: ' + new Date(t.createdAt).toLocaleString());
  if (t.type === 'incident') {
    lines.push('Follow-ups: ' + t.followUps.length + ' scheduled checks');
    lines.push('First check-in in ' + t.followUps[0] + ' minutes');
  } else {
    lines.push('Check-ins: ' + (tpl.followUps || []).length + ' scheduled');
  }
  lines.push('');
  lines.push('Open SproutLab to check in or view details.');

  var text = lines.join('\n');
  if (navigator.share) {
    navigator.share({ title: t.title + ' \u2014 tracking started', text: text }).catch(function() {});
  } else {
    _qaClipboardFallback(text);
    showQLToast(zi('check') + ' Copied to clipboard');
  }
}

// ── 12. Storage Warning (renders in #ctStorageWarn) ──

function ctShowStorageWarning() {
  var el = document.getElementById('ctStorageWarn');
  if (!el) {
    console.warn('CareTickets: localStorage write failed or missing');
    return;
  }
  el.innerHTML =
    '<div class="col-full ct-zone-wrap">' +
      '<div class="ct-storage-warn">' +
        zi('warn') + ' Tracking data may not be saved. Your browser storage is full or unavailable. ' +
        'Export a backup from Settings to avoid losing data.' +
      '</div>' +
    '</div>';
}

// ── 13. Schedule All Active Tickets ──

function ctScheduleAllActive() {
  _careTickets.forEach(function(t) {
    if (t.status === 'active' || t.status === 'escalated') {
      ctScheduleInApp(t);
    }
  });
}

// ── 14. Storage Event Listener (multi-tab sync) ──

function _ctInitStorageListener() {
  window.addEventListener('storage', function(e) {
    if (e.key === KEYS.careTickets && !_ctStorageUpdating) {
      _ctStorageUpdating = true;
      try {
        _careTickets = Array.isArray(JSON.parse(e.newValue)) ? JSON.parse(e.newValue) : [];
      } catch(err) {
        _careTickets = [];
      }
      renderHome();
      setTimeout(function() { _ctStorageUpdating = false; }, 1000);
    }
  });
}

// ── Back button support ──
window.addEventListener('popstate', function() {
  if (document.querySelector('.ct-checkin-scrim')) { ctCloseOverlay('checkin'); return; }
  if (document.querySelector('.ct-picker-scrim')) { ctCloseOverlay('picker'); return; }
  if (document.querySelector('.ct-detail-scrim')) { ctCloseOverlay('detail'); return; }
});
