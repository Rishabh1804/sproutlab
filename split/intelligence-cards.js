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

  // Co-occurrence window: burst within ±1 week of regression. The ±1-week
  // pad accommodates the empirical lag between developmental burst and sleep
  // disruption — sleep dips often trail the burst by 3-7 days as the cognitive
  // load consolidates. Tighter (same-week only) would miss the trailing dips;
  // wider (±2 weeks) would over-attribute coincident-but-unrelated dips.
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
      html += '<div>' + (w.isBurst ? zi('star') : '·') + '</div>';
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
        bHtml += '<div class="cd-episode-title">' + zi('star') + ' W' + b.weekNum + (topDomain ? ' — ' + topDomain + ' burst' : '') + ' (' + b.evidence + ' evidence)</div>';
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
  renderInfoFeedingIntake();
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
  renderInfoVaccGantt();
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
    accelerating: { icon: zi('trending-up'),   color: 'var(--tc-sage)', label: 'Accelerating' },
    steady:       { icon: zi('trending-flat'), color: 'var(--light)',   label: 'Steady' },
    slowing:      { icon: zi('trending-down'), color: 'var(--tc-amber)',label: 'Slowing' },
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

  // V-K-28 amendment: the bars carried floating numbers (5, 4, 6, ...) with
  // no label naming the unit. A parent reading the chart couldn't tell whether
  // the numbers were foods, meals, or combos. Add a "foods / week" sub-label
  // under the chart title so the value-axis intent is explicit.
  let chartHtml = '<div class="t-sm fe-sub-label" >Weekly Introduction Rate <span class="t-light" style="font-weight:400;">— foods / week</span></div>';
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
          <div class="info-intro-bar dyn-fill-h" style="--dyn-pct:${pct}%"></div>
        </div>
        <div class="t-xs t-light" >${label}</div>
      </div>`;
  });
  chartHtml += '</div>';

  // PR-EF Viz #3: food intro timeline — horizontal scatter where each dot
  // is one food at its intro date, vertically positioned by food group,
  // colored by reaction (safe/watch/avoid). Reveals per-food granularity
  // the weekly aggregate bars hide.
  // Card-local SVG renderer; extraction deferred per PR-EF cross-cutting D10.
  const allFoods = data.weeks.flatMap(w => w.foods);
  if (allFoods.length >= 3) {
    const VB_W = 320, VB_H = 140, PAD_L = 50, PAD_R = 8, PAD_T = 8, PAD_B = 20;
    const dates = allFoods.map(f => new Date(f.date).getTime()).filter(t => !isNaN(t));
    const tMin = Math.min(...dates), tMax = Math.max(...dates);
    const tRange = Math.max(1, tMax - tMin);
    // Build lane index from groups seen in the data
    const groupMap = {};
    let nextLane = 0;
    allFoods.forEach(f => {
      const cls = (typeof classifyFoodToGroup === 'function') ? classifyFoodToGroup(f.name) : null;
      const groupLabel = cls ? cls.groupLabel : 'Other';
      if (!(groupLabel in groupMap)) { groupMap[groupLabel] = nextLane++; }
    });
    const laneCount = Math.max(1, nextLane);
    const laneH = (VB_H - PAD_T - PAD_B) / laneCount;
    const reactColor = { safe: 'var(--tc-sage)', watch: 'var(--tc-amber)', avoid: 'var(--tc-rose)' };
    let svg = '<div class="t-sm fe-sub-label mt-12">Food Intro Timeline</div>';
    svg += '<svg class="viz-food-timeline" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" style="width:100%;max-width:480px;display:block;margin:0 auto;">';
    // Lane labels + gridlines
    Object.entries(groupMap).forEach(([label, idx]) => {
      const y = PAD_T + idx * laneH + laneH / 2;
      svg += '<line x1="' + PAD_L + '" y1="' + y + '" x2="' + (VB_W - PAD_R) + '" y2="' + y + '" stroke="var(--surface-alt)" stroke-width="0.5"/>';
      // V-K-29 amendment: was `label.slice(0, 8)` — produced fragments like
      // "Grains G", "Vegetab #" because the 8-char cut landed mid-word (and
      // mid-ampersand for compound labels like "Grains & Cereals"). Now
      // split on a word/ampersand boundary and take the leading token, which
      // gives compact-but-complete lane labels (Grains, Vegetables, Fruits,
      // Dairy, Nuts, Other, Spices). HR-10 spirit: no text-overflow,
      // truncate at word boundaries instead.
      const shortLabel = label.split(/\s*[&,]\s*|\s+/)[0];
      svg += '<text x="' + (PAD_L - 4) + '" y="' + (y + 3) + '" text-anchor="end" font-size="7" fill="var(--mid)" font-family="Nunito">' + escHtml(shortLabel) + '</text>';
    });
    // Dots
    allFoods.forEach(f => {
      const t = new Date(f.date).getTime();
      if (isNaN(t)) return;
      const x = PAD_L + ((t - tMin) / tRange) * (VB_W - PAD_L - PAD_R);
      const cls = (typeof classifyFoodToGroup === 'function') ? classifyFoodToGroup(f.name) : null;
      const groupLabel = cls ? cls.groupLabel : 'Other';
      const y = PAD_T + groupMap[groupLabel] * laneH + laneH / 2;
      const color = reactColor[f.reaction] || 'var(--tc-sage)';
      const dateLabel = new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.5" fill="' + color + '" opacity="0.75"><title>' + escHtml(f.name) + ' · ' + escHtml(dateLabel) + ' · ' + escHtml(f.reaction || 'safe') + '</title></circle>';
    });
    // X-axis date labels (endpoints)
    const startLbl = new Date(tMin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endLbl = new Date(tMax).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    svg += '<text x="' + PAD_L + '" y="' + (VB_H - 4) + '" font-size="7" fill="var(--mid)" font-family="Nunito">' + escHtml(startLbl) + '</text>';
    svg += '<text x="' + (VB_W - PAD_R) + '" y="' + (VB_H - 4) + '" text-anchor="end" font-size="7" fill="var(--mid)" font-family="Nunito">' + escHtml(endLbl) + '</text>';
    svg += '</svg>';
    chartHtml += svg;
  }

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

  // V-M-17 amendment: "Foods to Try" used to render one list-item per
  // suggestion with `<strong>{name}</strong> · {group} · {reason}`. When
  // multiple suggestions shared an identical reason (e.g. five non-veg foods
  // all carrying "No non-veg in 7 days"), the parent saw five visually
  // identical lines — stuck-state masquerading as recommendations. Now group
  // by reason: one heading per gap, chips for each food. Fewer lines, clearer
  // signal, and the eye reads "consider this category" rather than five
  // duplicates.
  const suggestions = getUntriedSuggestions(8);
  let tryHtml = '<div class="t-sm fe-sub-label" >Foods to Try Next</div>';
  if (suggestions.length === 0) {
    tryHtml += '<div class="t-sm t-light">Amazing — you\'ve covered the full taxonomy!</div>';
  } else {
    // Group by reason text. Preserve first-occurrence order for stable rendering.
    const groups = [];
    const reasonIdx = {};
    suggestions.forEach(s => {
      const key = (s.reason || 'Explore something new') + '||' + (s.groupLabel || '');
      if (reasonIdx[key] == null) {
        reasonIdx[key] = groups.length;
        groups.push({ reason: s.reason || 'Explore something new', groupLabel: s.groupLabel || '', items: [] });
      }
      groups[reasonIdx[key]].items.push(s);
    });
    tryHtml += '<div class="fx-col g8">';
    groups.forEach(g => {
      // If the gap has 3+ suggestions, render as a category heading + chips.
      // For 1-2 suggestions, keep the legacy list-item format so single
      // recommendations don't lose their per-item visual weight.
      if (g.items.length >= 3) {
        tryHtml += '<div class="li-row" style="flex-direction:column;align-items:flex-start;gap:var(--sp-4);">';
        tryHtml += '<div><strong>' + escHtml(g.reason) + '</strong>'
          + (g.groupLabel ? ' <span class="t-sm t-light">· ' + escHtml(g.groupLabel) + '</span>' : '')
          + '</div>';
        tryHtml += '<div class="fx-wrap g4">';
        g.items.forEach(it => {
          tryHtml += '<span class="info-food-chip is-sage">' + escHtml(it.name) + '</span>';
        });
        tryHtml += '</div></div>';
      } else {
        g.items.forEach(s => {
          tryHtml += '<div class="list-item li-row"><div class="li-body">'
            + '<strong>' + escHtml(s.name) + '</strong>'
            + '<span class="t-sm t-light">' + escHtml(s.groupLabel || '') + ' · ' + escHtml(s.reason || '') + '</span>'
            + '</div></div>';
        });
      }
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
        gridHtml += `<div class="nh-cell nh-0 ${n.cssClass}" title="Gap" data-action="showHeatmapDetail" data-arg="${escAttr(n.key)}" data-arg2="${dayIdx}" data-arg3="${escAttr(data.days[dayIdx])}">·</div>`;
      } else {
        // Nutrient present — colored fill, tap to see sources
        const level = count <= 2 ? 1 : count <= 4 ? 2 : 3;
        gridHtml += `<div class="nh-cell nh-${level} ${n.cssClass}" title="${escAttr(foods.join(', '))}" data-action="showHeatmapDetail" data-arg="${escAttr(n.key)}" data-arg2="${dayIdx}" data-arg3="${escAttr(data.days[dayIdx])}"></div>`;
      }
    });
  });
  gridHtml += '</div>';

  // Legend
  gridHtml += `<div class="fx-row g8 mt-8" style="align-items:center;justify-content:center;flex-wrap:wrap;">
    <div class="nh-cell nh-nodata" style="width:18px;height:18px;min-height:auto;font-size:var(--fs-2xs);aspect-ratio:auto;">–</div><span class="t-xs t-light">No data</span>
    <div class="nh-cell nh-0" style="width:18px;height:18px;min-height:auto;font-size:var(--fs-2xs);aspect-ratio:auto;">·</div><span class="t-xs t-light">Gap</span>
    <div class="nh-legend-swatch" style="background:rgba(140,190,160,0.25);"></div><span class="t-xs t-light">Some</span>
    <div class="nh-legend-swatch" style="background:rgba(140,190,160,0.55);"></div><span class="t-xs t-light">Good</span>
    <div class="nh-legend-swatch" style="background:rgba(140,190,160,0.85);"></div><span class="t-xs t-light">Rich</span>
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
        // Sliding window: 1-day tolerance. Combo on day 1 + day 3 still streaks
        // (1-day skip allowed for parent's logging gaps). diff === 0 idempotent.
        currentStreak = (diff >= 1 && diff <= 2) ? currentStreak + 1
                       : (diff === 0 ? currentStreak : 1);
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
  const COMBO_WINDOW_DAYS = 30;
  const data = computeFoodCombos(COMBO_WINDOW_DAYS);
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
    <div class="t-sm"><strong>${data.totalUniquePairs}</strong> <span class="t-light">unique combos from ${data.totalMeals} meals in last ${COMBO_WINDOW_DAYS}d</span></div>
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
        nutBadges = p.keyNutsHit.slice(0, 4).map(n => `<span title="${escAttr(n)}">${NUT_EMOJI[n] || '•'}</span>`).join('');
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
    const pct = Math.round((density / KEY_NUTRIENTS.length) * 100); // out of key-nutrient count (was hardcoded 8)
    const stats = data.mealStats[m.key];
    const topNutrients = Object.entries(stats.nutrientHits).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 3).map(([k]) => k);

    gridHtml += `<div class="mb-meal-card">
      <div class="mb-meal-label">${m.emoji} ${m.label}</div>
      <div class="mb-meal-score" style="color:${density >= 3 ? 'var(--tc-sage)' : density >= 1.5 ? 'var(--tc-amber)' : 'var(--light)'};">${density}</div>
      <div class="mb-meal-nutrients">${topNutrients.length > 0 ? topNutrients.join(', ') : 'no data'}</div>
      <div class="mb-meal-bar dyn-fill" style="--dyn-pct:${Math.max(pct, 4)}%;background:${m.color};"></div>
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
      // Split on comma, plus, ampersand, and connecting words "with"/"and" —
      // prevents "rice with dal" or "carrot & spinach" from parsing as one food.
      const raw = entry[meal].split(/[,+&]| with |\s+and\s+/i).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
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

// ── PR-EF Viz #4: FEEDING INTAKE STACKED BAR ──
// Surfaces the per-meal _intake fields (none/partial/full) from feedingData
// across the last 28 days as a stacked vertical bar per day. Refusal
// patterns and weekend gaps become visible at a glance.
function renderInfoFeedingIntake() {
  const summaryEl = document.getElementById('infoFeedingIntakeSummary');
  const chartEl = document.getElementById('infoFeedingIntakeChart');
  const insightEl = document.getElementById('infoFeedingIntakeInsight');
  if (!summaryEl || !chartEl) return;

  const WINDOW_DAYS = 28;
  const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
  const todayD = new Date(today() + 'T12:00:00');
  const days = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(todayD); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds] || {};
    const meals = MEAL_KEYS.map(k => {
      const intake = entry[k + '_intake'];
      const hasMeal = !!entry[k] && entry[k] !== SKIPPED_MEAL;
      if (!hasMeal) return 'missing';
      if (intake === 1 || intake === '1' || intake === 'full') return 'full';
      if (intake === 0.5 || intake === '0.5' || intake === 'partial') return 'partial';
      if (intake === 0 || intake === '0' || intake === 'none') return 'none';
      return 'untagged'; // meal logged but intake not recorded
    });
    days.push({ ds, meals });
  }

  // Aggregate stats
  let fullCt = 0, partialCt = 0, noneCt = 0, untaggedCt = 0, missingCt = 0;
  days.forEach(d => d.meals.forEach(m => {
    if (m === 'full') fullCt++;
    else if (m === 'partial') partialCt++;
    else if (m === 'none') noneCt++;
    else if (m === 'untagged') untaggedCt++;
    else missingCt++;
  }));
  const taggedTotal = fullCt + partialCt + noneCt;
  const fullPct = taggedTotal > 0 ? Math.round((fullCt / taggedTotal) * 100) : 0;

  if (taggedTotal === 0) {
    summaryEl.innerHTML = '<div class="t-sm t-light">No intake data tagged yet — add intake levels in the food log to surface refusal patterns.</div>';
    chartEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  summaryEl.innerHTML = `<div class="fx-row g12 fx-row-wrap">
    <div class="t-sm"><strong>${fullPct}%</strong> <span class="t-light">meals eaten fully</span></div>
    <div class="t-sm t-light">·</div>
    <div class="t-sm t-light">last ${WINDOW_DAYS}d · ${taggedTotal} tagged meals</div>
  </div>`;

  // Stacked bar SVG — card-local renderer; extraction deferred per PR-EF D10.
  const VB_W = 320, VB_H = 100, PAD_L = 20, PAD_R = 8, PAD_T = 4, PAD_B = 16;
  const colWidth = (VB_W - PAD_L - PAD_R) / WINDOW_DAYS;
  const barW = Math.max(2, colWidth - 1);
  const cellH = (VB_H - PAD_T - PAD_B) / MEAL_KEYS.length;
  const stateColor = {
    full:     'var(--tc-sage)',
    partial:  'var(--tc-amber)',
    none:     'var(--tc-rose)',
    untagged: 'var(--surface-alt)',
    missing:  'transparent'
  };
  let svg = '<svg class="viz-intake-bar" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" style="width:100%;max-width:480px;display:block;margin:0 auto;">';
  // Meal-row labels
  MEAL_KEYS.forEach((k, idx) => {
    const y = PAD_T + idx * cellH + cellH / 2 + 2;
    svg += '<text x="' + (PAD_L - 4) + '" y="' + y.toFixed(1) + '" text-anchor="end" font-size="7" fill="var(--mid)" font-family="Nunito">' + k.charAt(0).toUpperCase() + '</text>';
  });
  // Cells
  days.forEach((d, dIdx) => {
    const x = PAD_L + dIdx * colWidth;
    d.meals.forEach((state, mIdx) => {
      const y = PAD_T + mIdx * cellH;
      const fill = stateColor[state] || stateColor.missing;
      if (state === 'missing') {
        // Diagonal-stripe hatch via small pattern marks
        svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + (cellH - 1).toFixed(1) + '" fill="var(--surface-sage)" opacity="0.3"/>';
      } else {
        svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + (cellH - 1).toFixed(1) + '" fill="' + fill + '" opacity="0.85"><title>' + d.ds + ' · ' + MEAL_KEYS[mIdx] + ' · ' + state + '</title></rect>';
      }
    });
  });
  // X-axis endpoint labels
  const startLbl = new Date(days[0].ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endLbl = new Date(days[days.length - 1].ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  svg += '<text x="' + PAD_L + '" y="' + (VB_H - 4) + '" font-size="7" fill="var(--mid)" font-family="Nunito">' + escHtml(startLbl) + '</text>';
  svg += '<text x="' + (VB_W - PAD_R) + '" y="' + (VB_H - 4) + '" text-anchor="end" font-size="7" fill="var(--mid)" font-family="Nunito">' + escHtml(endLbl) + '</text>';
  svg += '</svg>';
  // Legend
  svg += '<div class="fx-row g8 fx-row-wrap mt-4 t-xs t-light">';
  svg += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--tc-sage);vertical-align:middle;margin-right:2px;"></span> Full</span>';
  svg += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--tc-amber);vertical-align:middle;margin-right:2px;"></span> Partial</span>';
  svg += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--tc-rose);vertical-align:middle;margin-right:2px;"></span> None</span>';
  svg += '<span><span style="display:inline-block;width:10px;height:10px;background:var(--surface-alt);vertical-align:middle;margin-right:2px;"></span> Untagged</span>';
  svg += '</div>';
  chartEl.innerHTML = svg;

  // Insights
  if (insightEl) {
    let iHtml = '';
    if (noneCt >= 3) {
      iHtml += '<div class="si-insight si-insight-warn">' + zi('warn') + ' ' + noneCt + ' meal' + (noneCt !== 1 ? 's' : '') + ' refused in last ' + WINDOW_DAYS + 'd — watch for pattern by meal slot or food type.</div>';
    } else if (fullPct >= 80 && taggedTotal >= 10) {
      iHtml += '<div class="si-insight si-insight-good">' + zi('check') + ' Strong intake — ' + fullPct + '% of tagged meals eaten fully.</div>';
    }
    if (untaggedCt > taggedTotal) {
      iHtml += '<div class="si-insight si-insight-info">' + zi('info') + ' Most meals are untagged. Tagging intake levels (full / partial / none) unlocks refusal-pattern detection.</div>';
    }
    insightEl.innerHTML = iHtml;
  }
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

