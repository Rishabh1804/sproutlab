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

