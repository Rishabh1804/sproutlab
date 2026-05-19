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
    const confDot = zi('dot-red');
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
    t.textContent = 'Undone';
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
  let toastMsg = capitalize(_qlMeal) + ' logged';
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
        <div class="meal-prog-icon">${zi('skip-forward')}</div>
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
        <div class="meal-prog-icon">${zi('target')}</div>
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
    html += `<div class="mdi-bar"><div class="mdi-bar-fill dyn-fill ${dayColor}" style="--dyn-pct:${pct}%;"></div></div>`;

    // Per-meal mini bars
    html += `<div style="display:flex;gap:var(--sp-4);margin-top:6px;">`;
    ['breakfast','lunch','dinner','snack'].forEach(mk => {
      const md = mdi.meals[mk];
      if (md.foods === 0) return;
      const c = getMdiColor(md.score);
      const barPct = Math.min(md.score, 100);
      html += `<div class="flex-1-min0"><div class="t-xs" style="color:var(--light);text-align:center;">${md.label}</div><div class="mdi-bar"><div class="mdi-bar-fill dyn-fill ${c}" style="--dyn-pct:${barPct}%;"></div></div></div>`;
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
    <span class="dqp-pill" style="font-size:var(--fs-xs);background:var(--rose-light);color:var(--tc-caution);border-color:rgba(220,120,80,0.15);" data-action="openHomeSymptomChecker">${zi('steth')} Symptom checker</span>
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
        <div class="ql-modal-title">${zi('steth')} Symptom Checker</div>
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
  // D1 §2.2 — bind the sticky-CTA shadow-grow listener to the modal scroll container.
  // Home-overlay path only; #symptomResult Medical-tab path has no modal scroll container.
  _scInitStickyShadow(overlay.querySelector('.modal'));
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
    resultEl.innerHTML = '<div class="sc-result sc-mild"><div class="sc-title">No matching symptoms found</div><div class="sc-section-body">Try describing differently, or tap the chips above. If you\'re concerned, always call your paediatrician.</div>' + _scDoctorCardHTML('mild') + '</div>';
    return;
  }

  var SEV_RANK = { emergency: 0, warning: 1, mild: 2 };
  matches.sort(function(a, b) { return (SEV_RANK[a.severity] || 2) - (SEV_RANK[b.severity] || 2) || b.score - a.score; });

  // Delegate to shared renderer (defined in medical.js; loaded earlier per concat order).
  // Home-overlay variant uses closeAndPrompt* actions so the modal closes before the
  // episode-tracking prompt opens \u2014 per \u00A71.2 pre-merge diff gate behavioral drift.
  // D2 V-K9 fold (A-D2-K-11): ageMo dropped from signature.
  resultEl.innerHTML = _renderSymptomCheckerResults(matches, {
    // D1 §2.2 — Home overlay is a true modal scroll container; ship the sticky CTA here.
    stickyFooter: true,
    actions: {
      fever:     'closeAndPromptFever',
      diarrhoea: 'closeAndPromptDiarrhoea',
      vomiting:  'closeAndPromptVomiting',
      cold:      'closeAndPromptCold'
    }
  });
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
    html += `<div class="t-amber">${zi('sparkle')} Not yet in Foods Introduced list</div>`;
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
  showQLToast(mealKeys.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ') + ' marked as skipped');
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
  showQLToast(mealKey.charAt(0).toUpperCase() + mealKey.slice(1) + ' skipped');
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
  showQLToast(mealKey.charAt(0).toUpperCase() + mealKey.slice(1) + ' unskipped');
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
      btn.innerHTML = 'skipped ' + zi('undo');
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
  // V-M-19 amendment: respect the user's diet preference. If settings has
  // dietPref === 'veg', non-veg foods must not surface as "Foods to Try Next."
  // A parent who set a dietary boundary expects the app to honor it everywhere.
  const isVeg = (typeof getDietPref === 'function') && getDietPref() === 'veg';

  // Collect all taxonomy foods not yet introduced
  const candidates = [];
  _foodTaxFlat.forEach(item => {
    const key = item.key.toLowerCase().trim();
    if (introduced.has(key)) return;
    // Diet-preference gate
    if (isVeg && item.pid === 'nonveg') return;
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

  const dirIcon = data.direction === 'later' ? zi('trending-up') : data.direction === 'earlier' ? zi('trending-down') : zi('trending-flat');
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

// PR-EF synthesis (V-K-11 amendment): age-banded wake-loss helper, lifted
// to module scope so both computeSleepEfficiency() and the calendar
// heatmap in renderInfoSleepEfficiency() can read it. Reads the
// WAKE_LOSS_MIN constant defined in core.js.
function _wakeLossFor(dateStr, wakes) {
  const ageMo = ageAt(dateStr).months;
  const perWake = ageMo < 12 ? WAKE_LOSS_MIN['0-12mo']
                : ageMo < 24 ? WAKE_LOSS_MIN['12-24mo']
                : WAKE_LOSS_MIN['24mo+'];
  return wakes * perWake;
}

function computeSleepEfficiency() {
  const nights = _siGetNights(7);
  if (nights.length < 3) return { insufficient: true, count: nights.length, needed: 3 };

  const results = nights.map(n => {
    const dur = calcSleepDuration(n.bedtime, n.wakeTime);
    const wakes = n.wakeUps || 0;
    const lostMin = _wakeLossFor(n.dateStr, wakes);
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
      const lostMin = _wakeLossFor(n.dateStr, n.wakeUps || 0);
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

  const trendIcon = data.trend === 'improving' ? zi('trending-up') : data.trend === 'declining' ? zi('trending-down') : zi('trending-flat');
  summaryEl.innerHTML = '<div class="t-sm">Avg efficiency: <strong>' + data.avgEff + '%</strong> (last ' + data.count + ' nights) <span style="color:' + (data.trend === 'declining' ? 'var(--tc-amber)' : 'var(--tc-sage)') + ';font-weight:600;">' + trendIcon + '</span></div>';

  if (barsEl) {
    let html = '';

    // PR-EF Viz #1: 53-day sleep calendar heatmap — cell color by total
    // night sleep minutes (bands: <240 poor, 240-540 short, 540-720 target,
    // >720 long). Reveals weekend drift and regressions the 7-night view
    // can hide.
    // Card-local SVG renderer; extraction deferred per PR-EF D10.
    const CAL_DAYS = 53;
    const longNights = _siGetNights(CAL_DAYS);
    if (longNights.length > 0) {
      const totalsByDate = {};
      const lossByDate = {};
      longNights.forEach(n => {
        const dur = calcSleepDuration(n.bedtime, n.wakeTime);
        totalsByDate[n.dateStr] = (totalsByDate[n.dateStr] || 0) + (dur.total || 0);
        lossByDate[n.dateStr] = (lossByDate[n.dateStr] || 0) + _wakeLossFor(n.dateStr, n.wakeUps || 0);
      });
      const todayD = new Date(today() + 'T12:00:00');
      const dayCells = [];
      for (let i = CAL_DAYS - 1; i >= 0; i--) {
        const d = new Date(todayD); d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        dayCells.push({ ds, total: totalsByDate[ds] || null, loss: lossByDate[ds] || 0 });
      }
      const VB_W = 280, VB_H = 88, PAD_L = 4, PAD_R = 4, PAD_T = 4, PAD_B = 14;
      const cols = Math.ceil(CAL_DAYS / 7);
      const cellW = (VB_W - PAD_L - PAD_R) / cols;
      const cellH = (VB_H - PAD_T - PAD_B) / 7;
      let svg = '<div class="t-sm fe-sub-label mb-4">Sleep Calendar — last ' + CAL_DAYS + ' nights</div>';
      svg += '<svg class="viz-cal-grid" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" style="width:100%;max-width:480px;display:block;margin:0 auto;">';
      dayCells.forEach((cell, idx) => {
        const col = Math.floor(idx / 7);
        const row = idx % 7;
        const x = PAD_L + col * cellW;
        const y = PAD_T + row * cellH;
        let fill, opacity = 0.9;
        if (cell.total === null) {
          fill = 'var(--surface-alt)';
          opacity = 0.4;
        } else if (cell.total < 240) {
          fill = 'var(--cal-poor)';
        } else if (cell.total < 540) {
          fill = 'var(--cal-short)';
        } else if (cell.total < 720) {
          fill = 'var(--cal-target)';
        } else {
          fill = 'var(--cal-long)';
        }
        const title = cell.total !== null
          ? cell.ds + ' · ' + Math.floor(cell.total / 60) + 'h ' + (cell.total % 60) + 'm' + (cell.loss > 0 ? ' · ' + cell.loss + 'min lost to wakings' : '')
          : cell.ds + ' · no data';
        svg += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, cellW - 1).toFixed(1) + '" height="' + Math.max(1, cellH - 1).toFixed(1) + '" rx="1" fill="' + fill + '" opacity="' + opacity + '"><title>' + title + '</title></rect>';
        // PR-EF V-K-11: wake-loss corner dot — surfaces "disrupted but
        // long-enough" nights that the duration band alone can't distinguish.
        // Threshold 45min ≈ 3+ wakings for a 12mo+ baby or 4+ for an infant.
        if (cell.loss > 45 && cell.total !== null) {
          const dotX = x + cellW - 2.5;
          const dotY = y + 2.5;
          svg += '<circle cx="' + dotX.toFixed(1) + '" cy="' + dotY.toFixed(1) + '" r="1.4" fill="var(--tc-amber)" opacity="0.95"/>';
        }
      });
      // Legend
      const legendY = VB_H - 7;
      const legendItems = [
        { c: 'var(--cal-poor)', label: '<4h' },
        { c: 'var(--cal-short)', label: '4-9h' },
        { c: 'var(--cal-target)', label: '9-12h' },
        { c: 'var(--cal-long)', label: '>12h' }
      ];
      legendItems.forEach((item, i) => {
        const lx = PAD_L + i * 60;
        svg += '<rect x="' + lx + '" y="' + (legendY - 4) + '" width="6" height="6" fill="' + item.c + '" opacity="0.9"/>';
        svg += '<text x="' + (lx + 9) + '" y="' + (legendY + 1) + '" font-size="6.5" fill="var(--mid)" font-family="Nunito">' + item.label + '</text>';
      });
      // V-K-11: corner-dot legend entry for wake-loss disruption
      const dotLx = PAD_L + 4 * 60;
      svg += '<circle cx="' + (dotLx + 3) + '" cy="' + (legendY - 1) + '" r="1.4" fill="var(--tc-amber)" opacity="0.95"/>';
      svg += '<text x="' + (dotLx + 9) + '" y="' + (legendY + 1) + '" font-size="6.5" fill="var(--mid)" font-family="Nunito">disrupted</text>';
      svg += '</svg>';
      html += svg;
    }

    html += '<div class="t-sm fe-sub-label mt-12">Recent Nights</div>';
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
  const trendText = delta !== null ? (delta > 2 ? zi('trending-up') + ' +' + delta + ' vs last week' : delta < -2 ? zi('trending-down') + ' ' + delta + ' vs last week' : zi('trending-flat') + ' stable') : '';
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
    html += zi('clock') + ' Wake-ups: <strong>' + data.avgWakes + '</strong>/night<br>';
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
        icon: zi('timer'), label: 'Nap duration',
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

