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
    summary.highlights.forEach(function(h) { lines.push(h.text); });
    lines.push('');
  }

  if (summary.concerns && summary.concerns.length > 0) {
    lines.push('*Heads Up*');
    summary.concerns.forEach(function(c) { lines.push(c.text); });
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
  // V-K-1-followup — uses SAFE_POOP_COLORS from core.js directly (previously
  // a duplicated literal; consolidated to single-source on the PR-A cycle).
  var dominantColor = Object.entries(colorCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
  headline = 'Most common: ' + dominantColor[0] + ' (' + dominantColor[1] + '/' + totalPoops + ')';

  Object.entries(colorCounts).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(entry) {
    var color = entry[0];
    var count = entry[1];
    var pct = Math.round(count / totalPoops * 100);
    var isSafe = SAFE_POOP_COLORS.indexOf(color) >= 0;
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
    actionItems.push({ text: 'Normal range: yellow, green, brown, dark, orange', signal: 'good' });
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
  toggle.innerHTML = isHidden ? 'Show less ' + zi('chevron-up') : 'Show ' + extras.length + ' more ' + zi('chevron-down');
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
  const trendIcon = data.trend === 'improving' ? zi('trending-up') : data.trend === 'declining' ? zi('trending-down') : zi('trending-flat');
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
    const adoptDetail = d.rate !== null ? {
      title: 'Suggestion Adoption', subtitle: formatDate(d.date), domain: 'lav', icon: 'sparkle',
      rows: [
        { label: 'Date', value: formatDate(d.date) },
        { label: 'Adopted', value: d.adopted + ' of ' + d.items },
        { label: 'Adoption rate', value: Math.round(d.rate * 100) + '%' }
      ]
    } : null;
    const adoptAttr = adoptDetail ? ' data-action="vizShowDetail" data-arg="' + vizArg(adoptDetail) + '"' : '';
    hmHtml += '<div class="' + cls + '" title="' + title + '"' + adoptAttr + '></div>';
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
    const typeDetail = {
      title: tc.label + ' Suggestions', subtitle: 'Adoption breakdown', domain: 'lav', icon: 'sparkle',
      rows: [
        { label: 'Type', value: tc.label },
        { label: 'Adopted', value: d.adopted + ' of ' + d.total },
        { label: 'Adoption rate', value: pct + '%' }
      ]
    };
    typesHtml += '<div class="sa-type-row" data-action="vizShowDetail" data-arg="' + vizArg(typeDetail) + '">';
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
    '<label>' + zi('timer') + ' Time:</label>' +
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


