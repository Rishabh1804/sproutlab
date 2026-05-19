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

// Throughout SproutLab, `new Date(dateStr + 'T12:00:00')` constructs a Date
// at local-noon for a given YYYY-MM-DD. The noon anchor is intentional and
// HR-12-compliant: it sidesteps DST transitions (which shift midnight to
// 11pm/1am of the prior day in some zones) and keeps day-of-week / age-in-days
// arithmetic stable across DST boundaries. Do not "simplify" to midnight.
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

