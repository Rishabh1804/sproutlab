// ─────────────────────────────────────────────────────────────────────────
// intelligence-correlate.js — v3-3 cross-domain correlation primitive (NEW)
// Spec: docs/specs/v3-3-engine-spine.md §Primitive 1
// Region: Kael (engine layer)
//
// Charter alignment (CV3-006):
//   - Honesty: every correlation surface discloses {sampleSize, confidence, n}.
//     Confidence-floor gated; returns null below floor (n < 7 OR |strength| < 0.4).
//   - Extensibility: SIGNAL_EXTRACTORS is a row-addition table. New domain pairs
//     plug in by adding a row — no engine code change.
//   - Warmth: engine-only output; pre-shaped for v3-4 narrative-layer hedge-tier prose.
//
// HR-12 honored: zero raw `new Date()` arithmetic. Date iteration uses _offsetDateStr;
// signal extractors read existing data via string-keyed lookups.
// ─────────────────────────────────────────────────────────────────────────

// SIGNAL_EXTRACTORS — domain×signal → (dateStr) → number|null.
// Each extractor returns a numeric signal for the given day, or null if no data.
// Adding a new domain-signal pair = adding a row here. No engine code change.
const SIGNAL_EXTRACTORS = {
  // ── sleep domain ──
  'sleep:total': function(dateStr) {
    if (typeof sleepData !== 'object' || !sleepData) return null;
    var entries = sleepData[dateStr];
    if (!Array.isArray(entries) || entries.length === 0) return null;
    var totalMin = 0;
    entries.forEach(function(e) {
      if (e && typeof e.duration === 'number' && e.duration > 0) totalMin += e.duration;
    });
    return totalMin > 0 ? (totalMin / 60) : null;  // hours
  },
  'sleep:wakeUps': function(dateStr) {
    if (typeof sleepData !== 'object' || !sleepData) return null;
    var entries = sleepData[dateStr];
    if (!Array.isArray(entries) || entries.length === 0) return null;
    var sum = 0, any = false;
    entries.forEach(function(e) {
      if (e && typeof e.wakeUps === 'number') { sum += e.wakeUps; any = true; }
    });
    return any ? sum : null;
  },
  'sleep:onsetMin': function(dateStr) {
    if (typeof sleepData !== 'object' || !sleepData) return null;
    var entries = sleepData[dateStr];
    if (!Array.isArray(entries) || entries.length === 0) return null;
    // Use the earliest 'night' entry's start time as proxy for onset.
    var nights = entries.filter(function(e) { return e && (e.kind === 'night' || e.type === 'night'); });
    if (nights.length === 0) return null;
    var earliest = nights.reduce(function(min, n) {
      if (!n || !n.startTime) return min;
      var m = _hhmmToMinutes(n.startTime);
      if (m < 0) return min;
      return (min === null || m < min) ? m : min;
    }, null);
    return earliest;
  },

  // ── feeding domain ──
  'feeding:mealCount': function(dateStr) {
    if (typeof feedingData !== 'object' || !feedingData) return null;
    var day = feedingData[dateStr];
    if (!day) return null;
    var slots = ['breakfast', 'lunch', 'dinner', 'snack'];
    var count = 0;
    slots.forEach(function(s) {
      var v = day[s];
      if (!v) return;
      if (typeof v === 'string' && v.trim() && v !== 'null' && v !== 'undefined') count++;
      else if (typeof v === 'object' && v !== null) count++;  // structured shape (post-food-sub-tab)
    });
    return count;
  },
  'feeding:fatRatio': function(dateStr) {
    if (typeof feedingData !== 'object' || !feedingData) return null;
    var day = feedingData[dateStr];
    if (!day) return null;
    if (typeof _detectFatContextNearTime !== 'function') return null;
    var slots = ['breakfast', 'lunch', 'dinner', 'snack'];
    var fatCount = 0, totalCount = 0;
    slots.forEach(function(s) {
      var v = day[s];
      if (!v) return;
      var hasText = (typeof v === 'string' && v.trim() && v !== 'null' && v !== 'undefined') || (typeof v === 'object' && v && v.text);
      if (!hasText) return;
      totalCount++;
      // Best-effort: derive fat status from the meal text via fat-set substring match.
      var text = (typeof v === 'string') ? v : (v.text || '');
      if (typeof _isFatBearingText === 'function' && _isFatBearingText(text)) fatCount++;
    });
    return totalCount > 0 ? (fatCount / totalCount) : null;
  },

  // ── med domain ──
  'med:givenCount': function(dateStr) {
    if (typeof medChecks !== 'object' || !medChecks) return null;
    var day = medChecks[dateStr];
    if (!day || typeof day !== 'object') return null;
    var count = 0;
    Object.keys(day).forEach(function(k) {
      if (k === '_trackingSince') return;
      if (typeof medCheckIsDone === 'function' && medCheckIsDone(day[k])) count++;
    });
    return count;
  },
  'med:withFatRatio': function(dateStr) {
    if (typeof medChecks !== 'object' || !medChecks) return null;
    var day = medChecks[dateStr];
    if (!day || typeof day !== 'object') return null;
    var withFat = 0, total = 0;
    Object.keys(day).forEach(function(k) {
      if (k === '_trackingSince') return;
      if (typeof parseMedCheck !== 'function') return;
      var parsed = parseMedCheck(day[k]);
      if (!parsed || (parsed.status !== 'done' && parsed.status !== 'late')) return;
      total++;
      if (parsed.withFat === true) withFat++;
    });
    return total > 0 ? (withFat / total) : null;
  },

  // ── illness domain ──
  'illness:active': function(dateStr) {
    // Best-effort: check whether any episode was active on dateStr.
    // For "today" we have direct accessors; for historical days we'd need episode date ranges.
    // v1: only compute for today (returns null for past dates without episode-range data).
    if (dateStr !== today()) return null;  // v2 candidate: walk episode ranges
    var active = 0;
    if (typeof getActiveFeverEpisode === 'function' && getActiveFeverEpisode()) active++;
    if (typeof getActiveDiarrhoeaEpisode === 'function' && getActiveDiarrhoeaEpisode()) active++;
    if (typeof getActiveVomitingEpisode === 'function' && getActiveVomitingEpisode()) active++;
    if (typeof getActiveColdEpisode === 'function' && getActiveColdEpisode()) active++;
    return active;
  },

  // ── poop domain ──
  'poop:count': function(dateStr) {
    if (typeof poopData !== 'object' || !poopData) return null;
    var day = poopData[dateStr];
    if (!day) return null;
    if (Array.isArray(day)) return day.length;
    if (typeof day === 'object' && Array.isArray(day.entries)) return day.entries.length;
    return null;
  },

  // ── growth domain (sparse signal; only present on measurement days) ──
  'growth:weightKg': function(dateStr) {
    if (typeof growthData !== 'object' || !growthData) return null;
    var day = growthData[dateStr];
    if (!day || typeof day.weight !== 'number') return null;
    return day.weight;
  },
};

// Helper for confidence classification.
function _correlateConfidenceLabel(sampleSize, strength) {
  var s = Math.abs(strength);
  if (sampleSize >= 21 && s >= 0.7) return 'high';
  if (sampleSize >= 14 && s >= 0.5) return 'medium';
  if (sampleSize >= 7 && s >= 0.4) return 'low';
  return null;  // below confidence floor
}

// Pearson correlation on two parallel arrays (already filtered to matched pairs).
function _pearson(xs, ys) {
  var n = xs.length;
  if (n < 2) return 0;
  var meanX = 0, meanY = 0;
  for (var i = 0; i < n; i++) { meanX += xs[i]; meanY += ys[i]; }
  meanX /= n; meanY /= n;
  var num = 0, denomX = 0, denomY = 0;
  for (var j = 0; j < n; j++) {
    var dx = xs[j] - meanX;
    var dy = ys[j] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  var denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return num / denom;
}

// _correlate — the cross-domain correlation primitive.
// Spec contract per docs/specs/v3-3-engine-spine.md §Primitive 1.
//
// Inputs:
//   domainA, domainB: 'sleep' | 'feeding' | 'med' | 'illness' | 'poop' | 'growth' (extensible)
//   windowDays: rolling window in days (e.g. 14, 30)
//   opts: { signalA, signalB, lagDays?, confidenceFloor?, endDate? }
//     signalA, signalB: required; the SIGNAL_EXTRACTORS key suffixes after 'domain:'
//     lagDays: max ±lag to scan in days (default 3)
//     confidenceFloor: minimum |strength| to consider valid (default 0.4)
//     endDate: window end (default today())
//
// Returns: { lag, strength, confidence, sampleSize, points[], domainA, domainB, signalA, signalB, windowDays }
// OR null if sampleSize < 7 OR best |strength| < confidenceFloor.
function _correlate(domainA, domainB, windowDays, opts) {
  opts = opts || {};
  if (!opts.signalA || !opts.signalB) return null;
  var keyA = domainA + ':' + opts.signalA;
  var keyB = domainB + ':' + opts.signalB;
  var extA = SIGNAL_EXTRACTORS[keyA];
  var extB = SIGNAL_EXTRACTORS[keyB];
  if (!extA || !extB) return null;
  if (typeof windowDays !== 'number' || windowDays < 7) windowDays = 14;
  var endDate = (typeof opts.endDate === 'string') ? opts.endDate : today();
  var floor = (typeof opts.confidenceFloor === 'number') ? opts.confidenceFloor : 0.4;
  var maxLag = (typeof opts.lagDays === 'number') ? Math.max(0, Math.min(7, opts.lagDays)) : 3;

  // Pull aligned daily values. Drop days where either extractor returns null/undefined/NaN.
  var rawPoints = [];  // [{date, valA, valB}, ...]
  for (var i = 0; i < windowDays; i++) {
    var ds = _offsetDateStr(endDate, -(windowDays - 1 - i));
    var a = extA(ds), b = extB(ds);
    if (a === null || a === undefined || isNaN(a)) continue;
    if (b === null || b === undefined || isNaN(b)) continue;
    rawPoints.push({ date: ds, valA: a, valB: b });
  }
  if (rawPoints.length < 7) return null;

  // Scan lags [-maxLag, +maxLag]; pick strongest |strength|.
  var bestLag = 0, bestStrength = 0, bestN = rawPoints.length;
  for (var lag = -maxLag; lag <= maxLag; lag++) {
    var xs = [], ys = [];
    for (var k = 0; k < rawPoints.length; k++) {
      var idxA = k;
      var idxB = k + lag;
      if (idxB < 0 || idxB >= rawPoints.length) continue;
      xs.push(rawPoints[idxA].valA);
      ys.push(rawPoints[idxB].valB);
    }
    if (xs.length < 7) continue;
    var s = _pearson(xs, ys);
    if (Math.abs(s) > Math.abs(bestStrength)) {
      bestStrength = s;
      bestLag = lag;
      bestN = xs.length;
    }
  }

  // Apply confidence floor.
  if (Math.abs(bestStrength) < floor) return null;
  var conf = _correlateConfidenceLabel(bestN, bestStrength);
  if (!conf) return null;

  return {
    lag: bestLag,
    strength: bestStrength,
    confidence: conf,
    sampleSize: bestN,
    points: rawPoints,
    domainA: domainA,
    domainB: domainB,
    signalA: opts.signalA,
    signalB: opts.signalB,
    windowDays: windowDays,
  };
}

// Convenience: list every available {domain, signal} pair the engine can correlate.
// Useful for v3-4 narrative layer + R-1 adaptive layer enumeration.
function _correlateAvailableSignals() {
  var out = {};
  Object.keys(SIGNAL_EXTRACTORS).forEach(function(key) {
    var parts = key.split(':');
    if (parts.length !== 2) return;
    if (!out[parts[0]]) out[parts[0]] = [];
    out[parts[0]].push(parts[1]);
  });
  return out;
}
