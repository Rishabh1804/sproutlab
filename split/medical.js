// EVIDENCE-BASED MILESTONES: Classification Engine + Evidence Accumulator
// ══════════════════════════════════════════════════════════════════════

const CONF_ORDER = { high: 3, medium: 2, low: 1 };

const PROMOTION_RULES = {
  emerging:    { minEvidence: 1,  minHighConfidence: 0, minDays: 1, minSpanDays: 0,  description: 'First observation of behavior' },
  practicing:  { minEvidence: 3,  minHighConfidence: 1, minDays: 3, minSpanDays: 5,  description: 'Repeated behavior seen multiple times' },
  consistent:  { minEvidence: 6,  minHighConfidence: 3, minDays: 5, minSpanDays: 10, description: 'Reliable, frequent behavior' },
  mastered:    { minEvidence: 10, minHighConfidence: 5, minDays: 7, minSpanDays: 14, description: 'Well-established, sustained behavior' }
};
// @@INSERT_DATA_BLOCK_1@@

function matchesMilestoneKeyword(milestoneText, keyword) {
  const searchTerm = KEYWORD_TO_MILESTONE[keyword];
  if (!searchTerm) return false;
  return milestoneText.toLowerCase().includes(searchTerm.toLowerCase());
}

// Ranked match: returns how well a milestone text matches a keyword (higher = better)
// Used by evidence expansion to pick the BEST keyword for a given milestone
function milestoneKeywordScore(milestoneText, keyword) {
  const searchTerm = KEYWORD_TO_MILESTONE[keyword];
  if (!searchTerm) return 0;
  const text = milestoneText.toLowerCase();
  const term = searchTerm.toLowerCase();
  if (!text.includes(term)) return 0;
  // Start-of-text match is strongest (e.g. "sit" in "Sitting independently")
  if (text.startsWith(term)) return 3;
  // Start-of-word match (after space/paren) is medium
  const idx = text.indexOf(term);
  if (idx > 0 && /[\s(]/.test(text[idx - 1])) return 2;
  // Substring match is weakest (e.g. "sit" in "from sitting")
  return 1;
}

// ─── Classification Engine ───
function classifyActivity(inputText) {
  const text = inputText.toLowerCase().trim();
  const tokens = text.split(/[\s,;.!?]+/).filter(Boolean);
  const matches = [];

  for (const pattern of EVIDENCE_PATTERNS) {
    const hasKeyword = pattern.keywords.some(kw => {
      if (kw.includes(' ')) return text.includes(kw);
      return tokens.includes(kw) || tokens.some(t => t.startsWith(kw));
    });
    if (!hasKeyword) continue;
    if (pattern.exclude && pattern.exclude.some(ex => text.includes(ex))) continue;
    if (pattern.require && !pattern.require.some(req => text.includes(req))) continue;

    matches.push({
      milestone: pattern.milestone,
      domain: pattern.domain,
      confidence: pattern.confidence,
      context: pattern.context
    });
  }

  // Deduplicate: keep highest confidence per milestone
  const best = {};
  matches.forEach(m => {
    const key = m.milestone;
    if (!best[key] || CONF_ORDER[m.confidence] > CONF_ORDER[best[key].confidence]) {
      best[key] = m;
    }
  });

  const evidence = Object.values(best);
  const domains = [...new Set(evidence.map(e => e.domain))];
  return { domains, evidence };
}

// ─── Evidence Ledger (computed from activityLog) ───
let activityLog = {};

function getMilestoneEvidence(milestoneKeyword) {
  const evidence = [];
  Object.entries(activityLog).forEach(([date, entries]) => {
    if (!Array.isArray(entries)) return;
    entries.forEach(entry => {
      (entry.evidence || []).forEach(ev => {
        if (ev.milestone === milestoneKeyword) {
          evidence.push({ date, entryId: entry.id, confidence: ev.confidence, context: ev.context, type: entry.type, text: entry.text });
        }
      });
    });
  });
  return evidence.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Auto-Promotion Engine ───
function computeAutoStatus(milestoneKeyword) {
  const evidence = getMilestoneEvidence(milestoneKeyword);
  if (evidence.length === 0) return 'not_started';

  const uniqueDays = new Set(evidence.map(e => e.date));
  const highConf = evidence.filter(e => e.confidence === 'high');
  const dates = evidence.map(e => new Date(e.date)).sort((a, b) => a - b);
  const spanDays = dates.length > 1
    ? Math.ceil((dates[dates.length - 1] - dates[0]) / 86400000)
    : 0;

  const stats = {
    count: evidence.length,
    highCount: highConf.length,
    dayCount: uniqueDays.size,
    spanDays
  };

  for (const stage of ['mastered', 'consistent', 'practicing', 'emerging']) {
    const rule = PROMOTION_RULES[stage];
    if (stats.count >= rule.minEvidence &&
        stats.highCount >= rule.minHighConfidence &&
        stats.dayCount >= rule.minDays &&
        stats.spanDays >= rule.minSpanDays) {
      return stage;
    }
  }
  return 'not_started';
}

// ─── Regression Detection ───
function checkEvidenceRegression(milestoneKeyword, currentAutoStatus) {
  if (!['consistent', 'mastered'].includes(currentAutoStatus)) return false;
  const evidence = getMilestoneEvidence(milestoneKeyword);
  if (evidence.length === 0) return false;
  const lastDate = new Date(evidence[0].date);
  const daysSince = Math.ceil((new Date() - lastDate) / 86400000);
  return daysSince > 21;
}

// ─── Sync All Milestone Statuses (runs after every log entry) ───
function syncMilestoneStatuses() {
  const allKeywords = [...new Set(EVIDENCE_PATTERNS.map(p => p.milestone))];

  allKeywords.forEach(keyword => {
    const autoStatus = computeAutoStatus(keyword);
    if (autoStatus === 'not_started') return;

    // Find matching milestone in milestones array
    let ms = milestones.find(m => matchesMilestoneKeyword(m.text, keyword));

    if (!ms) {
      // Evidence exists for a milestone not in the array — only create if keyword maps to a real milestone
      if (!KEYWORD_TO_MILESTONE[keyword]) return;
      ms = {
        text: createMilestoneLabel(keyword),
        cat: domainForKeyword(keyword),
        status: 'not_started',
        advanced: false,
        manualStatus: null,
        manualAt: null,
        autoStatus: null,
        evidenceCount: 0,
        firstSeen: null,
        lastSeen: null,
        confidenceHigh: 0
      };
      milestones.push(ms);
    }

    // Update auto fields
    ms.autoStatus = autoStatus;
    const evidence = getMilestoneEvidence(keyword);
    ms.evidenceCount = evidence.length;
    ms.firstSeen = evidence[evidence.length - 1]?.date || null;
    ms.lastSeen = evidence[0]?.date || null;
    ms.confidenceHigh = evidence.filter(e => e.confidence === 'high').length;

    // Auto-clear manual override when engine catches up (spec: "manual flag is cleared")
    if (ms.manualStatus) {
      const stageRank = { not_started: 0, emerging: 1, practicing: 2, consistent: 3, mastered: 4 };
      if ((stageRank[ms.autoStatus] || 0) >= (stageRank[ms.manualStatus] || 0)) {
        ms.manualStatus = null;
        ms.manualAt = null;
      }
    }

    // Update effective status (respect manual override)
    const prevStatus = ms.status;
    ms.status = ms.manualStatus || ms.autoStatus;

    // Update date fields for backward compatibility
    if (ms.status !== prevStatus) {
      const now = today();
      if (ms.status === 'emerging' && !ms.emergingAt) ms.emergingAt = ms.firstSeen || now;
      if (ms.status === 'practicing' && !ms.practicingAt) ms.practicingAt = now;
      if (ms.status === 'consistent' && !ms.consistentAt) ms.consistentAt = now;
      if (ms.status === 'mastered' && !ms.masteredAt) ms.masteredAt = now;

      // Log to milestone timeline if promoted
      const stageOrder = { not_started: 0, emerging: 1, practicing: 2, consistent: 3, mastered: 4 };
      if ((stageOrder[ms.status] || 0) > (stageOrder[prevStatus] || 0)) {
        logMilestoneEvent(ms.text, ms.status, now);
      }
    }
  });

  save(KEYS.milestones, milestones);
}

// Helper: generate a label from a keyword
function createMilestoneLabel(keyword) {
  const labels = {
    sit: 'Sitting independently', roll: 'Rolling', crawl: 'Crawling',
    pull_to_stand: 'Pulls to stand', cruise: 'Cruising along furniture', walk: 'Walking independently',
    head_control: 'Head control', climb: 'Climbing',
    grasp: 'Grasping objects', pincer: 'Pincer grasp', transfer: 'Transferring objects hand to hand',
    stack: 'Stacking blocks', bang: 'Banging objects together',
    finger_feed: 'Finger feeding', spoon: 'Using a spoon', cup_drink: 'Drinking from cup',
    teething: 'Teething',
    coo: 'Cooing', babble: 'Babbling', first_word: 'First words',
    mama_dada: 'Says mama/dada', mama_dada_meaning: 'Says mama/dada with meaning',
    respond_name: 'Responds to name', understand_words: 'Understands simple words',
    point: 'Pointing', gesture: 'Using gestures', follow_instructions: 'Follows simple instructions',
    social_smile: 'Social smiling', wave: 'Waving bye-bye', clap: 'Clapping',
    object_permanence: 'Object permanence', separation_anxiety: 'Separation awareness',
    independent_sleep: 'Sleeps independently',
    cause_effect: 'Understands cause and effect', shape_sort: 'Shape sorting',
    pretend_play: 'Pretend play', two_word: 'Two-word phrases',
  };
  return labels[keyword] || keyword.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Helper: get domain for a keyword from patterns
function domainForKeyword(keyword) {
  const p = EVIDENCE_PATTERNS.find(pat => pat.milestone === keyword);
  return p ? p.domain : 'motor';
}

// ─── Undo support ───
let _lastActivityUndo = null;

// undoLastActivity → lives in intelligence.js (handles batch undo + TSF dirty)

// ── Step 1: Active Milestones Section (evidence-driven primary view) ──
function renderActiveMilestones() {
  const el = document.getElementById('msActiveMilestones');
  if (!el) return;

  // Collect milestones with evidence (active = emerging/practicing/consistent)
  const catIcons = { motor: zi('run'), language: zi('chat'), social: zi('handshake'), cognitive: zi('brain') };
  const active = milestones.map((m, i) => ({ ...m, _i: i }))
    .filter(m => m.evidenceCount > 0 && ['emerging', 'practicing', 'consistent', 'mastered'].includes(m.status))
    .sort((a, b) => {
      // Active first, then mastered; within same stage, most recent evidence first
      const stageRank = { emerging: 2, practicing: 3, consistent: 4, mastered: 1 };
      const ra = stageRank[a.status] || 0, rb = stageRank[b.status] || 0;
      if (ra !== rb) return rb - ra;
      return (b.lastSeen || '').localeCompare(a.lastSeen || '');
    });

  if (active.length === 0) { el.style.display = 'none'; return; }
  el.style.display = '';

  const activeOnly = active.filter(m => m.status !== 'mastered');
  const recentMastered = active.filter(m => m.status === 'mastered').slice(0, 3);
  const shown = [...activeOnly, ...recentMastered];

  let html = '<div class="micro-label text-center mb-4 fw-600" >Active Milestones</div>';
  html += '<div class="ms-active-list">';

  shown.forEach(m => {
    const cat = m.cat || 'motor';
    const stageMeta = MS_STAGE_META[m.status] || MS_STAGE_META.not_started;
    const pct = stageMeta.pct;
    const icon = catIcons[cat] || zi('star');

    // Date range
    let dateRange = '';
    if (m.firstSeen && m.lastSeen) {
      const span = daysBetween(m.firstSeen, m.lastSeen);
      dateRange = 'First: ' + formatDate(m.firstSeen) + ' · Last: ' + formatDate(m.lastSeen) + ' · ' + span + 'd span';
    } else if (m.firstSeen) {
      dateRange = 'First seen: ' + formatDate(m.firstSeen);
    }

    // Override badge
    let overrideHtml = '';
    if (m.autoStatus && m.manualStatus && m.autoStatus !== m.manualStatus) {
      overrideHtml = '<span class="ms-active-override">Edit Override (engine: ' + m.autoStatus + ')</span>';
    }

    // Evidence expansion
    let bestKw = null, bestScore = 0;
    Object.entries(KEYWORD_TO_MILESTONE).forEach(([k, v]) => {
      if (!v) return;
      const score = milestoneKeywordScore(m.text, k);
      if (score > bestScore) { bestScore = score; bestKw = k; }
    });
    let evidHtml = '';
    const evidId = 'ms-active-evid-' + m._i;
    if (bestKw && m.evidenceCount > 0) {
      const evList = getMilestoneEvidence(bestKw).slice(0, 5);
      let evItems = evList.map(ev => {
        const confDot = ev.confidence === 'high' ? '●' : ev.confidence === 'medium' ? '●' : '●';
        return '<div class="al-evid-item">' + ev.date + ' — "' + escHtml((ev.text || '').substring(0, 40)) + '" ' + confDot + ' ' + ev.confidence + '</div>';
      }).join('');
      if (m.evidenceCount > 5) evItems += '<div class="al-evid-more">+' + (m.evidenceCount - 5) + ' more</div>';
      evidHtml = '<button class="ms-tidbit-toggle" onclick="event.stopPropagation();document.getElementById(\'' + evidId + '\').style.display=document.getElementById(\'' + evidId + '\').style.display===\'none\'?\'block\':\'none\'">' + zi('chart') + ' View evidence ▾</button>' +
        '<div id="' + evidId + '" class="al-evid-box" style="display:none;">' + evItems + '</div>';
    }

    // Confidence indicator
    const confPct = m.evidenceCount > 0 ? Math.round((m.confidenceHigh / m.evidenceCount) * 100) : 0;

    html += '<div class="ms-active-item ' + cat + '">' +
      '<div class="ms-active-top">' +
        '<div class="ms-active-icon">' + icon + '</div>' +
        '<div class="ms-active-body">' +
          '<div class="ms-active-name">' + escHtml(m.text) + '</div>' +
          '<div class="ms-active-stage" style="color:' + stageMeta.color + ';">' + stageMeta.icon + ' ' + stageMeta.label + ' · ' + m.evidenceCount + ' observations' + (confPct > 0 ? ' · ' + confPct + '% high-conf' : '') + '</div>' +
          (dateRange ? '<div class="ms-active-dates">' + dateRange + '</div>' : '') +
          _renderAttribution(m) +
        '</div>' +
        overrideHtml +
      '</div>' +
      '<div class="ms-active-prog">' +
        '<div class="ms-active-bar"><div class="ms-active-fill stage-' + m.status + '" style="width:' + pct + '%;"></div></div>' +
        '<div class="ms-active-obs">' + pct + '%</div>' +
      '</div>' +
      evidHtml +
    '</div>';
  });

  html += '</div>';
  el.innerHTML = html;
}

// ── End of Evidence-Based Milestones Engine ──

// Migration: old status → new status
function migrateMilestoneStatus(m) {
  if (m.status === 'in_progress') m.status = 'practicing';
  if (m.status === 'done') m.status = 'mastered';
  if (m.status === 'pending') m.status = 'not_started';
  if (!MS_STAGES.includes(m.status)) m.status = 'not_started';
  // Migrate date fields
  if (m.doneAt && !m.masteredAt) m.masteredAt = m.doneAt;
  if (m.inProgressAt && !m.emergingAt) m.emergingAt = m.inProgressAt;
  return m;
}

// Status check helpers
function isMsDone(m) { return m.status === 'mastered' || m.status === 'done'; }
function isMsActive(m) { return ['emerging','practicing','consistent','in_progress'].includes(m.status); }
function isMsStarted(m) { return m.status !== 'not_started' && m.status !== 'pending'; }
function getMsDoneDate(m) { return m.masteredAt || m.doneAt || null; }
function getMsStartDate(m) { return m.emergingAt || m.inProgressAt || null; }
// @@INSERT_DATA_BLOCK_2@@


// DOCTOR VISIT PREP
// ─────────────────────────────────────────
function renderDoctorPrep() {
  const card = document.getElementById('doctorPrepCard');
  const el = document.getElementById('doctorPrepContent');
  if (!card || !el) return;

  // Find next upcoming vaccination (proxy for next doctor visit)
  const upcoming = vaccData.find(v => v.upcoming);
  const nextVisit = visits.find(v => new Date(v.date) >= new Date());
  const visitDate = upcoming ? upcoming.date : (nextVisit ? nextVisit.date : null);

  if (!visitDate) { card.style.display = 'none'; return; }

  const daysTo = Math.ceil((new Date(visitDate) - new Date()) / 86400000);
  if (daysTo > 14 || daysTo < -1) { card.style.display = 'none'; return; }

  card.style.display = '';

  const { months, days } = preciseAge();
  const last = growthData[growthData.length - 1];
  const moExact = last ? ageMonthsAt(last.date) : getAgeInMonths();
  const who = getGrowthRef(moExact);

  // Growth summary — use independent weight/height lookups
  let growthSummary = '';
  const lw = getLatestWeight();
  if (lw) {
    const wtWho = getGrowthRef(ageMonthsAt(lw.date));
    const wtP = calcPercentile(lw.wt, wtWho.w3, wtWho.w50, wtWho.w97, wtWho.w15, wtWho.w85);
    growthSummary = `${zi('scale')} ${lw.wt} kg (${wtP.text} %ile)`;
  }
  const lh = getLatestHeight();
  if (lh) {
    const htWho = getGrowthRef(ageMonthsAt(lh.date));
    const htP = calcPercentile(lh.ht, htWho.h3, htWho.h50, htWho.h97, htWho.h15, htWho.h85);
    growthSummary += `${growthSummary ? ' · ' : ''}${zi('ruler')} ${lh.ht} cm (${htP.text} %ile)`;
  }

  // Milestones achieved
  const achieved = milestones.filter(m => isMsDone(m));
  const inProgress = milestones.filter(m => isMsActive(m));

  // Watch foods
  const watchFoods = foods.filter(f => f.reaction === 'watch');

  // Active meds
  const activeMeds = meds.filter(m => m.active);

  // Active notes (concerns)
  const activeNotes = notes.filter(n => !n.done);

  // Vaccination status
  const pastVacc = vaccData.filter(v => !v.upcoming);

  const urgencyColor = daysTo <= 3 ? 'var(--tc-danger)' : daysTo <= 7 ? 'var(--tc-caution)' : '#3a7060';

  el.innerHTML = `
    <div class="fx-center g8 mb-12">
      <div style="font-family:'Fraunces',serif;font-size:var(--fs-xl);font-weight:600;color:${urgencyColor};">${Math.max(0, daysTo)}</div>
      <div>
        <div style="font-weight:400;font-size:var(--fs-base);">days to visit</div>
        <div class="t-sub">${formatDate(visitDate)}${upcoming ? ' · ' + upcoming.name : ''}</div>
      </div>
    </div>
    <div class="fx-wrap g8">
      <div class="diet-stat ds-rose" data-tab="growth">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-baby"/></svg></div>
        <div class="diet-stat-val ds-val-sm">${months}m ${days}d</div>
        <div class="diet-stat-label">Age</div>
      </div>
      ${(() => { const lwp = getLatestWeight(); if (!lwp) return ''; const ww = getGrowthRef(ageMonthsAt(lwp.date)); return `<div class="diet-stat ds-rose" data-tab="growth">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-scale"/></svg></div>
        <div class="diet-stat-val ds-val-sm">${lwp.wt} kg</div>
        <div class="diet-stat-label">${calcPercentile(lwp.wt, ww.w3, ww.w50, ww.w97, ww.w15, ww.w85).text}</div>
      </div>`; })()}
      ${(() => { const lh = getLatestHeight(); if (!lh) return ''; const hw = getGrowthRef(ageMonthsAt(lh.date)); return `<div class="diet-stat ds-sky" data-tab="growth">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-ruler"/></svg></div>
        <div class="diet-stat-val ds-val-sm">${formatHeight(lh.ht)}</div>
        <div class="diet-stat-label">${calcPercentile(lh.ht, hw.h3, hw.h50, hw.h97, hw.h15, hw.h85).text}</div>
      </div>`; })()}
      <div class="diet-stat ds-sage" data-action="switchTab" data-arg="milestones">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-star"/></svg></div>
        <div class="diet-stat-val">${achieved.length}</div>
        <div class="diet-stat-label">Milestones</div>
      </div>
      <div class="diet-stat ds-lav" data-tab="medical">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-syringe"/></svg></div>
        <div class="diet-stat-val">${pastVacc.length}</div>
        <div class="diet-stat-label">Vaccines</div>
      </div>
      <div class="diet-stat ds-peach" data-tab="diet">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-spoon"/></svg></div>
        <div class="diet-stat-val">${foods.length}</div>
        <div class="diet-stat-label">Foods${watchFoods.length ? ' · ' + zi('warn') + watchFoods.length : ''}</div>
      </div>
      ${activeNotes.length ? `<div class="diet-stat alert" data-action="toggleHomeNotes">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-note"/></svg></div>
        <div class="diet-stat-val">${activeNotes.length}</div>
        <div class="diet-stat-label">To discuss</div>
      </div>` : ''}
    </div>
    <button class="btn-primary bp-sage" style="margin-top:10px;width:100%;" data-action="showFullDoctorSummary">${zi('note')} Full Summary</button>
  `;
}

function showFullDoctorSummary() {
  const { months, days } = preciseAge();
  const last = growthData[growthData.length - 1];
  const moExact = last ? ageMonthsAt(last.date) : getAgeInMonths();
  const who = getGrowthRef(moExact);

  const lines = [];
  lines.push('PAEDIATRICIAN VISIT SUMMARY');
  lines.push('═══════════════════════════════');
  lines.push('');
  lines.push('BABY Ziva Jain · ' + months + ' months, ' + days + ' days old');
  lines.push('BORN Born 4 Sep 2025 · Jamshedpur');
  lines.push('');

  // Growth
  lines.push('SECTION_GROWTH GROWTH');
  const lwDoc = getLatestWeight();
  const lhDoc = getLatestHeight();
  if (lwDoc) {
    const wtWho = getGrowthRef(ageMonthsAt(lwDoc.date));
    const wtP = calcPercentile(lwDoc.wt, wtWho.w3, wtWho.w50, wtWho.w97, wtWho.w15, wtWho.w85);
    lines.push('  Weight: ' + lwDoc.wt + ' kg (' + wtP.text + ' percentile)');
  }
  if (lhDoc) {
    const htWho = getGrowthRef(ageMonthsAt(lhDoc.date));
    const htP = calcPercentile(lhDoc.ht, htWho.h3, htWho.h50, htWho.h97, htWho.h15, htWho.h85);
    lines.push('  Height: ' + lhDoc.ht + ' cm (' + htP.text + ' percentile)');
  }
  if (lwDoc || lhDoc) {
    lines.push('  Last measured: ' + formatDate((lwDoc || lhDoc).date));
    const birth = growthData[0];
    const birthHt = birth.ht ?? 0;
    const birthWt = birth.wt ?? 0;
    if (lwDoc) lines.push('  Weight gain since birth: ' + (lwDoc.wt - birthWt).toFixed(2) + ' kg');
    if (lhDoc) lines.push('  Height gain since birth: ' + (lhDoc.ht - birthHt) + ' cm');
  }

  // Vaccinations
  lines.push('');
  lines.push('SECTION_VACC VACCINATIONS');
  vaccData.filter(v => !v.upcoming).forEach(v => {
    lines.push('  OK ' + v.name + ' — ' + formatDate(v.date));
  });
  const upcoming = vaccData.find(v => v.upcoming);
  if (upcoming) lines.push('  PENDING Due: ' + upcoming.name + ' — ' + formatDate(upcoming.date));

  // Milestones
  lines.push('');
  lines.push('SECTION_MS MILESTONES ACHIEVED');
  milestones.filter(m => isMsDone(m)).forEach(m => {
    lines.push('  OK ' + m.text + (m.doneAt ? ' (at ' + ageAtDate(m.doneAt) + ')' : '') + (m.advanced ? ' [Advanced]' : ''));
  });
  const ip = milestones.filter(m => isMsActive(m));
  if (ip.length) {
    lines.push('');
    lines.push('SECTION_IP IN PROGRESS');
    ip.forEach(m => { lines.push('  IP ' + m.text + (m.inProgressAt ? ' (since ' + ageAtDate(m.inProgressAt) + ')' : '')); });
  }

  // Medications
  lines.push('');
  lines.push('SECTION_MED MEDICATIONS');
  meds.forEach(m => {
    lines.push('  ' + (m.active ? '●' : '⏸') + ' ' + m.name + (m.dose ? ' · ' + m.dose : '') + (m.freq ? ' · ' + m.freq : ''));
  });

  // Diet
  lines.push('');
  lines.push('SECTION_DIET DIET (' + foods.length + ' foods introduced)');
  lines.push('  Solids started: 6 Mar 2026');
  const watchFoods = foods.filter(f => f.reaction === 'watch');
  if (watchFoods.length) {
    lines.push('  WATCH Watch: ' + watchFoods.map(f => f.name).join(', '));
  }

  // Notes/Concerns
  const activeNotes = notes.filter(n => !n.done);
  if (activeNotes.length) {
    lines.push('');
    lines.push('SECTION_NOTES OPEN CONCERNS');
    activeNotes.forEach(n => { lines.push('  • ' + n.text); });
  }

  lines.push('');
  lines.push('═══════════════════════════════');
  lines.push('Generated from Ziva\'s Dashboard');

  const text = lines.join('\n');
  // Clean text for copy/share — strip internal markers
  const cleanText = text.replace(/^SECTION_\w+ /gm, '').replace(/^BABY /gm, '').replace(/^BORN /gm, '').replace(/^  OK /gm, '  ✓ ').replace(/^  WATCH /gm, '  ⚠ ').replace(/^  PENDING /gm, '  ... ').replace(/^  IP /gm, '  ◔ ').replace(/\[Advanced\]/g, '★ Advanced');

  // Open a clean printable summary
  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Ziva — Visit Summary</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;padding:24px;max-width:600px;margin:0 auto;color:#333;font-size:var(--icon-sm);line-height:1.6;}
        h1{font-size:var(--icon-md);margin:0 0 4px;} h2{font-size:var(--icon-sm);margin:18px 0 4px;text-transform:uppercase;letter-spacing:var(--ls-normal);color:#888;border-bottom:1px solid #eee;padding-bottom:4px;}
        .meta{color:#888;font-size:var(--icon-xs);margin-bottom:16px;}
        .item{margin:2px 0;} .check{color:var(--tc-sage);} .warn{color:var(--tc-caution);} .adv{color:var(--tc-rose);}
        .actions{display:flex;gap:var(--sp-8);margin:20px 0;} .actions button{padding:10px 20px;border:none;border-radius:var(--r-lg);font-size:var(--icon-sm);font-weight:600;cursor:pointer;}
        .btn-print{background:var(--tc-sage);color:white;} .btn-copy{background:var(--tc-sky);color:white;} .btn-share{background:#7e66b4;color:white;}
        @media print{.actions{display:none !important;}}
      </style></head><body>`);
    
    printWin.document.write(`<h1>${zi('steth')} Paediatrician Visit Summary</h1>`);
    printWin.document.write(`<div class="meta">Ziva Jain · ${months}m ${days}d · Generated ${formatDate(today())}</div>`);
    printWin.document.write(`<div class="actions">`);
    printWin.document.write(`<button class="btn-print" data-action="printDashboard">${zi('note')} Print</button>`);
    printWin.document.write(`<button class="btn-copy" onclick="navigator.clipboard.writeText(document.getElementById('raw').textContent).then(()=>this.textContent='Copied!')">${zi('note')} Copy</button>`);
    if (navigator.share) {
      printWin.document.write(`<button class="btn-share" onclick="navigator.share({title:'Ziva Visit Summary',text:document.getElementById('raw').textContent})">${zi('note')} Share</button>`);
    }
    printWin.document.write(`</div>`);

    // Formatted HTML version with zi icons
    const _sectionIcons = {SECTION_GROWTH:zi('chart'),SECTION_VACC:zi('syringe'),SECTION_MS:zi('star'),SECTION_IP:zi('target'),SECTION_MED:zi('pill'),SECTION_DIET:zi('bowl'),SECTION_NOTES:zi('note')};
    const sections = text.split('\n');
    let html = '';
    sections.forEach(line => {
      if (line.startsWith('═') || line.startsWith('PAEDIATRICIAN')) return;
      const secMatch = line.match(/^(SECTION_\w+)\s(.+)/);
      if (secMatch) html += `<h2>${_sectionIcons[secMatch[1]] || ''} ${secMatch[2]}</h2>`;
      else if (line.startsWith('  OK ')) html += `<div class="item check">${zi('check')} ${line.trim().slice(3)}</div>`;
      else if (line.startsWith('  WATCH ')) html += `<div class="item warn">${zi('warn')} ${line.trim().slice(6)}</div>`;
      else if (line.startsWith('  PENDING ')) html += `<div class="item warn">${zi('clock')} ${line.trim().slice(8)}</div>`;
      else if (line.startsWith('  IP ')) html += `<div class="item tc-lav">${zi('target')} ${line.trim().slice(3)}</div>`;
      else if (line.includes('[Advanced]')) html += `<div class="item adv">${line.trim().replace('[Advanced]', zi('star') + ' Advanced')}</div>`;
      else if (line.startsWith('BABY ')) html += `<div style="font-weight:600;font-size:var(--icon-sm);">${zi('baby')} ${line.slice(5)}</div>`;
      else if (line.startsWith('BORN ')) html += `<div class="meta">${zi('clock')} ${line.slice(5)}</div>`;
      else if (line.startsWith('  •')) html += `<div class="item">${line.trim()}</div>`;
      else if (line.startsWith('  ')) html += `<div class="item">${line.trim()}</div>`;
      else if (line.startsWith('Generated')) html += `<div class="meta" style="margin-top:16px;">${line}</div>`;
      else if (line.trim()) html += `<div>${line}</div>`;
    });
    printWin.document.write(html);
    printWin.document.write(`<pre id="raw" style="display:none;">${cleanText.replace(/</g,'&lt;')}</pre>`);
    printWin.document.write(`</body></html>`);
    printWin.document.close();
  } else {
    // Fallback for popup blockers
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanText).then(() => alert('Summary copied to clipboard!')).catch(() => prompt('Copy:', cleanText));
    } else {
      prompt('Copy the summary below:', cleanText);
    }
  }
}
function renderGrowthFacts() {
  const el = document.getElementById('growthFacts');
  if (!el) return;
  const facts = [];
  const mo   = Math.round(getAgeInMonths());
  const lh   = getLatestHeight();
  const lwFact = getLatestWeight();

  // Weight velocity — compare two most recent entries with weight
  const wtEntries = growthData.filter(r => r.wt != null);
  if (wtEntries.length >= 2) {
    const wtLast = wtEntries[wtEntries.length - 1];
    const wtPrev = wtEntries[wtEntries.length - 2];
    const wtGain = ((wtLast.wt - wtPrev.wt) * 1000).toFixed(0);
    const daysDiff = Math.max(1, Math.round((new Date(wtLast.date) - new Date(wtPrev.date)) / 86400000));
    const gPerDay = Math.round(wtGain / daysDiff);
    if (gPerDay >= 15 && gPerDay <= 40) {
      facts.push({ type:'positive', icon:zi('party'), title:`Gaining ${gPerDay}g/day — right on track!`, body:`The expected rate at ${mo} months is 15–30g/day. Ziva is growing beautifully.` });
    } else if (gPerDay > 40) {
      facts.push({ type:'info', icon:zi('bars'), title:`Gaining ${gPerDay}g/day — healthy appetite!`, body:`Above average gain — completely fine at this stage as she is establishing her growth curve on solids.` });
    }
  }

  // Height velocity
  const htEntries = growthData.filter(r => r.ht != null);
  if (htEntries.length >= 2) {
    const htLast = htEntries[htEntries.length - 1];
    const htPrev = htEntries[htEntries.length - 2];
    const htGain = htLast.ht - htPrev.ht;
    if (htGain > 0) facts.push({ type:'positive', icon:zi('ruler'), title:`Grew ${htGain} cm since last height measurement`, body:`Linear growth is the best indicator of long-term nutritional health. This is a strong positive sign.` });
  }

  if (lwFact) {
    const moExact = ageMonthsAt(lwFact.date);
    const whoInterp = getGrowthRef(moExact);
    const pctW = calcPercentile(lwFact.wt, whoInterp.w3, whoInterp.w50, whoInterp.w97, whoInterp.w15, whoInterp.w85);
    facts.push({ type:'info', icon:zi('scale'), title:`Weight at ${pctW.text} percentile`, body:`This means Ziva is heavier than ${pctW.pct}% of girls her age on the WHO growth standard. Anything between 3rd–97th is healthy.` });
  }
  if (lh) {
    const htWho = getGrowthRef(ageMonthsAt(lh.date));
    const pctH = calcPercentile(lh.ht, htWho.h3, htWho.h50, htWho.h97, htWho.h15, htWho.h85);
    facts.push({ type:'info', icon:zi('ruler'), title:`Height at ${pctH.text} percentile`, body:`Consistent height percentile over time matters more than the exact number. Watch the trend across visits.` });
  }
  if (lwFact) {
    const birth = growthData.find(r => r.wt != null);
    const totalGain = (lwFact.wt - birth.wt).toFixed(2);
    facts.push({ type:'positive', icon:zi('sprout'), title:`Gained ${totalGain} kg since birth`, body:`From ${birth.wt} kg at birth to ${lwFact.wt} kg now — more than doubled her birth weight, which is a classic healthy 6-month milestone.` });
  }

  // WHO context
  facts.push({ type:'info', icon:zi('bulb'), title:'Why consistent tracking matters', body:`Weight and height trends over time give your paediatrician the clearest picture of Ziva\'s health — a single reading means less than the pattern across visits. Keep logging!` });

  el.innerHTML = facts.map(f => `
    <div class="growth-fact ${f.type}">
      <div class="growth-fact-icon">${f.icon}</div>
      <div class="growth-fact-body">
        <strong>${f.title}</strong>
        <span>${f.body}</span>
      </div>
    </div>`).join('');
}
// @@INSERT_DATA_BLOCK_3@@

// ── Ziva's monthly milestones (auto-generated from DOB) ──
function getZivaMonthDays() {
  const events = [];
  for (let m = 7; m <= 24; m++) {
    const d = new Date(DOB);
    d.setMonth(d.getMonth() + m);
    const dateStr = toDateStr(d);
    if (m === 12) continue; // skip — covered by "1st Birthday" in INDIAN_HOLIDAYS
    events.push({ date:dateStr, title:`Ziva turns ${m} months`, type:'birthday', icon:zi('sprout'), auto:true });
  }
  return events;
}
// @@INSERT_DATA_BLOCK_4@@

function getEventActivities(ev) {
  if (ev.type === 'birthday') return EVENT_ACTIVITIES.birthday;
  if (ev.type === 'vacation') return EVENT_ACTIVITIES.vacation;
  if (ev.type === 'family')   return EVENT_ACTIVITIES.family;
  if (ev.type === 'holiday') {
    // Try to match by holiday name
    const specific = Object.entries(EVENT_ACTIVITIES.holiday).find(([key]) =>
      key !== '_default' && ev.title.toLowerCase().includes(key.toLowerCase())
    );
    if (specific) return specific[1];
    return EVENT_ACTIVITIES.holiday._default;
  }
  return null;
}

function getUpcomingEvents(daysAhead) {
  const todayStr = today();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffStr = toDateStr(cutoff);

  const all = [];

  // 1. Indian holidays
  INDIAN_HOLIDAYS.forEach(h => {
    if (h.date >= todayStr && h.date <= cutoffStr) {
      all.push({ ...h, source:'holiday' });
    }
  });

  // 2. Ziva monthly days
  getZivaMonthDays().forEach(z => {
    if (z.date >= todayStr && z.date <= cutoffStr) {
      all.push({ ...z, source:'auto' });
    }
  });

  // 3. Custom events (with yearly recurrence check)
  customEvents.forEach((ev, i) => {
    if (ev.yearly) {
      // Check if the recurring date falls in our window this year and next
      [0, 1].forEach(yearOffset => {
        const d = new Date(ev.date);
        d.setFullYear(new Date().getFullYear() + yearOffset);
        const ds = toDateStr(d);
        if (ds >= todayStr && ds <= cutoffStr) {
          all.push({ ...ev, date:ds, _i:i, source:'custom' });
        }
      });
    } else {
      if (ev.date >= todayStr && ev.date <= cutoffStr) {
        all.push({ ...ev, _i:i, source:'custom' });
      }
    }
  });

  // Sort by date
  all.sort((a, b) => (a.date||'').localeCompare(b.date||''));
  return all;
}

function renderUpcomingEvents() {
  const card = document.getElementById('upcomingEventsCard');
  const el = document.getElementById('upcomingEventsContent');
  if (!card || !el) return;

  const events = getUpcomingEvents(7);
  if (events.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  const todayStr = today();
  let html = '';

  events.forEach(ev => {
    const isToday = ev.date === todayStr;
    const daysUntil = Math.round((new Date(ev.date) - new Date(todayStr)) / 86400000);
    const when = isToday ? 'Today' : daysUntil === 1 ? 'Tomorrow' : formatDate(ev.date);
    const urgency = isToday ? 'border-left:var(--accent-w) solid var(--rose);background:var(--blush);' :
                    daysUntil <= 2 ? 'border-left:var(--accent-w) solid var(--peach);background:var(--peach-light);' :
                    'border-left:var(--accent-w) solid var(--sage);background:var(--warm);';
    const _evIcon = ev.icon;
    const typeIcon = (_evIcon && _evIcon.length <= 12 ? zi(_evIcon) : _evIcon) || (ev.type === 'birthday' ? zi('party') : ev.type === 'holiday' ? zi('star') : ev.type === 'vacation' ? zi('baby') : ev.type === 'family' ? zi('baby') : zi('note'));
    const typeBadge = ev.type === 'birthday' ? 'background:var(--rose-light);color:var(--tc-rose);' :
                      ev.type === 'holiday'  ? 'background:var(--peach-light);color:var(--tc-caution);' :
                      ev.type === 'vacation' ? 'background:var(--sky-light);color:var(--tc-sky);' :
                      ev.type === 'family'   ? 'background:var(--sage-light);color:var(--tc-sage);' :
                      'background:var(--glass);color:var(--mid);';

    const activities = getEventActivities(ev);
    const actId = 'ev-act-' + ev.date + '-' + (ev._i || ev.title.replace(/\W/g,'').slice(0,10));

    html += `
      <div style="padding:var(--sp-12) 14px;border-radius:var(--r-xl);margin-bottom:8px;${urgency}">
        <div class="fx-center g8">
          <div style="font-size:var(--icon-lg);flex-shrink:0;">${typeIcon}</div>
          <div class="flex-1-min">
            <div class="t-title">${escHtml(ev.title)}</div>
            <div style="display:flex;gap:var(--sp-8);align-items:center;margin-top:3px;flex-wrap:wrap;">
              <span style="font-size:var(--fs-sm);font-weight:700;padding:2px 8px;border-radius:var(--r-lg);${typeBadge}">${ev.type}</span>
              <span class="t-sub">${when}${daysUntil > 0 ? ' · ' + daysUntil + 'd away' : ''}</span>
            </div>
          </div>
          ${ev.source === 'custom' ? `<button class="del-btn" data-action="deleteEvent" data-stop="1" data-arg="${ev._i}" title="Delete">×</button>` : ''}
        </div>
        ${activities ? `
          <button class="ms-tidbit-toggle mt-6" onclick="const e=document.getElementById('${actId}');e.style.display=e.style.display==='none'?'flex':'none';">
            ${zi('star')} Ziva activity ideas ▾
          </button>
          <div id="${actId}" style="display:none;margin-top:6px;flex-direction:column;gap:var(--sp-4);">
            ${activities.map(a => `
              <div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:6px 10px;border-radius:var(--r-md);background:var(--glass-strong);font-size:var(--fs-base);color:var(--mid);line-height:var(--lh-normal);">
                <span class="shrink-0">${a.icon}</span>
                <span>${a.text}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>`;
  });

  el.innerHTML = html;
}

function openEventModal() {
  document.getElementById('evTitle').value = '';
  document.getElementById('evDate').value = today();
  document.getElementById('evType').value = 'birthday';
  document.getElementById('evYearly').checked = true;
  activateBtn('eventSaveBtn', false);
  openModal('eventModal');
}

function saveEvent() {
  const title = document.getElementById('evTitle').value.trim();
  const date = document.getElementById('evDate').value;
  const type = document.getElementById('evType').value;
  const yearly = document.getElementById('evYearly').checked;
  if (!title || !date) return;
  customEvents.push({ title, date, type, yearly, icon: type === 'birthday' ? 'party' : type === 'holiday' ? 'star' : type === 'vacation' ? 'baby' : type === 'family' ? 'baby' : 'note' });
  save(KEYS.events, customEvents);
  closeModal('eventModal');
  renderUpcomingEvents();
}

function deleteEvent(i) {
  confirmAction('Delete this event?', () => {
    customEvents.splice(i, 1);
    save(KEYS.events, customEvents);
    renderUpcomingEvents();
  });
}
// @@INSERT_DATA_BLOCK_5@@

// Get latest entry that has a weight value
function getLatestWeight() {
  for (let i = growthData.length - 1; i >= 0; i--) {
    if (growthData[i].wt != null) return growthData[i];
  }
  return null;
}

// Get latest entry that has a height value
function getLatestHeight() {
  for (let i = growthData.length - 1; i >= 0; i--) {
    if (growthData[i].ht != null) return growthData[i];
  }
  return null;
}

function ageMonthsAt(dateStr) {
  const d = new Date(dateStr);
  return (d - DOB) / (30.44 * 86400000);
}

// Normal CDF using Abramowitz & Stegun approximation
function normalCDF(z) {
  if (z < -6) return 0;
  if (z > 6) return 1;
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429;
  const p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t * Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

function calcPercentile(val, p3, p50, p97, p15, p85) {
  if (val <= p3) return { text:'<3rd', pct:2 };
  if (val >= p97) return { text:'>97th', pct:98 };

  // Compute z-score using multiple reference points for accuracy
  // z-values: P3=-1.88, P15=-1.04, P50=0, P85=1.04, P97=1.88
  let z;
  if (p15 !== undefined && p85 !== undefined) {
    if (val <= p15) {
      z = -1.04 + (-1.88 - (-1.04)) * (p15 - val) / (p15 - p3);
    } else if (val <= p50) {
      z = -1.04 * (p50 - val) / (p50 - p15);
    } else if (val <= p85) {
      z = 1.04 * (val - p50) / (p85 - p50);
    } else {
      z = 1.04 + (1.88 - 1.04) * (val - p85) / (p97 - p85);
    }
  } else {
    // Fallback: 3-point
    if (val <= p50) {
      z = -1.88 * (p50 - val) / (p50 - p3);
    } else {
      z = 1.88 * (val - p50) / (p97 - p50);
    }
  }

  const pct = Math.round(normalCDF(z) * 100);
  const clamped = Math.max(3, Math.min(97, pct));
  const suffix = [11,12,13].includes(clamped%100) ? 'th' :
    clamped%10===1 ? 'st' : clamped%10===2 ? 'nd' : clamped%10===3 ? 'rd' : 'th';
  return { text: clamped + suffix, pct: clamped };
}

function getInterpolatedWHO(moExact) {
  const lo = Math.floor(moExact);
  const hi = Math.min(lo + 1, 12);
  const frac = moExact - lo;
  const li = Math.min(lo, 12);
  const hi2 = Math.min(hi, 12);
  return {
    w3:  WHO_W3[li]  + (WHO_W3[hi2]  - WHO_W3[li])  * frac,
    w50: WHO_W50[li] + (WHO_W50[hi2] - WHO_W50[li]) * frac,
    w97: WHO_W97[li] + (WHO_W97[hi2] - WHO_W97[li]) * frac,
    w15: WHO_W15[li] + (WHO_W15[hi2] - WHO_W15[li]) * frac,
    w85: WHO_W85[li] + (WHO_W85[hi2] - WHO_W85[li]) * frac,
    h3:  WHO_H3[li]  + (WHO_H3[hi2]  - WHO_H3[li])  * frac,
    h50: WHO_H50[li] + (WHO_H50[hi2] - WHO_H50[li]) * frac,
    h97: WHO_H97[li] + (WHO_H97[hi2] - WHO_H97[li]) * frac,
    h15: WHO_H15[li] + (WHO_H15[hi2] - WHO_H15[li]) * frac,
    h85: WHO_H85[li] + (WHO_H85[hi2] - WHO_H85[li]) * frac,
  };
}

function renderGrowthInsightsPreview() {
  const el = document.getElementById('growthInsightsPreview');
  if (!el) return;
  const factsEl = document.getElementById('growthFacts');
  if (!factsEl) return;

  // Count facts by category
  const facts = factsEl.querySelectorAll('.growth-fact');
  let positive = 0, info = 0;
  facts.forEach(f => {
    if (f.classList.contains('positive')) positive++;
    else if (f.classList.contains('info')) info++;
  });

  if (facts.length === 0) {
    el.innerHTML = '<div class="t-sub-light">Add measurements to see insights.</div>';
    return;
  }

  el.innerHTML = `
    <div class="fx-wrap g8">
      ${positive > 0 ? `<div class="diet-stat ds-sage flex-1" data-collapse-target="growthInsightsBody" data-collapse-chevron="growthInsightsChevron" >
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-party"/></svg></div>
        <div class="diet-stat-val">${positive}</div>
        <div class="diet-stat-label">Positive</div>
      </div>` : ''}
      ${info > 0 ? `<div class="diet-stat ds-sky flex-1" data-collapse-target="growthInsightsBody" data-collapse-chevron="growthInsightsChevron" >
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-info"/></svg></div>
        <div class="diet-stat-val">${info}</div>
        <div class="diet-stat-label">Info</div>
      </div>` : ''}
      <div class="diet-stat ds-lav flex-1" data-collapse-target="growthInsightsBody" data-collapse-chevron="growthInsightsChevron" >
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-bars"/></svg></div>
        <div class="diet-stat-val">${facts.length}</div>
        <div class="diet-stat-label">Total insights</div>
      </div>
    </div>`;
}

// Growth history for the History tab
function renderGrowthHistory() {
  const container = document.getElementById('growthHistoryContent');
  if (!container) return;

  if (growthData.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No measurements recorded yet.</div>';
    return;
  }

  const sorted = [...growthData].sort((a, b) => new Date(b.date) - new Date(a.date));
  let html = '<div class="fx-col g8">';

  sorted.forEach((r, i) => {
    const origIdx = growthData.indexOf(r);
    const moExact = ageMonthsAt(r.date);
    const who = getGrowthRef(moExact);
    const wtP = r.wt != null ? calcPercentile(r.wt, who.w3, who.w50, who.w97, who.w15, who.w85) : null;
    const htP = r.ht != null ? calcPercentile(r.ht, who.h3, who.h50, who.h97, who.h15, who.h85) : null;

    const parts = [];
    if (r.wt != null) parts.push(`${zi('scale')} ${r.wt} kg (${wtP.text})`);
    if (r.ht != null) parts.push(`${zi('ruler')} ${r.ht} cm (${htP.text})`);

    html += `
      <div style="display:flex;align-items:center;gap:var(--sp-8);padding:8px 12px;border-radius:var(--r-xl);background:var(--glass);border-left:var(--accent-w) solid var(--rose);">
        <div class="flex-1-min">
          <div class="t-title fw-600">${formatDate(r.date)} · ${ageAtDate(r.date)}</div>
          <div class="t-sub">${parts.join(' · ')}</div>
          ${_renderAttribution(r)}
        </div>
        <button class="del-btn" data-action="deleteGrowth" data-arg="${origIdx}" aria-label="Delete entry">×</button>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderGrowth() {
  growthData.sort((a,b) => new Date(a.date) - new Date(b.date));
  save(KEYS.growth, growthData);

  // Latest entry preview + next measurement date
  const preview = document.getElementById('growthLatestPreview');

  // Latest percentiles — use independent latest weight and height
  const lastWt = getLatestWeight();
  const lastHt = getLatestHeight();

  if (lastWt) {
    const moExact = ageMonthsAt(lastWt.date);
    const who = getGrowthRef(moExact);
    const wtPctResult = calcPercentile(lastWt.wt, who.w3, who.w50, who.w97, who.w15, who.w85);
    document.getElementById('latestWt').textContent = lastWt.wt + ' kg';
    document.getElementById('wtPct').textContent = wtPctResult.text;
    document.getElementById('pbadge-wtpct').className = 'pbadge pb-rose';
    document.getElementById('pbadge-wt').className = 'pbadge pb-sage';
  }

  if (lastHt) {
    const moExact = ageMonthsAt(lastHt.date);
    const who = getGrowthRef(moExact);
    const htPctResult = calcPercentile(lastHt.ht, who.h3, who.h50, who.h97, who.h15, who.h85);
    document.getElementById('latestHt').textContent = formatHeight(lastHt.ht);
    document.getElementById('htPct').textContent = htPctResult.text;
    document.getElementById('pbadge-htpct').className = 'pbadge pb-sky';
    document.getElementById('pbadge-ht').className = 'pbadge pb-lav';
  } else {
    document.getElementById('latestHt').textContent = '—';
    document.getElementById('htPct').textContent = '—';
  }

  drawChart();
  drawHeightChart();
  renderVelocity();
  renderSizeComparison();
  renderWeighInReminder();
  renderGrowthInsightsPreview();
}

// Indian Synthetic Growth Reference (Khadilkar 2019) — Girls, 0-12 months
// Based on NFHS/ICMR data representing typical Indian infant growth
// P50 values are approximately WHO 25th-30th percentile
const IND_W50 = [3.0,3.9,4.7,5.4,5.9,6.4,6.7,7.0,7.3,7.5,7.8,8.0,8.2];
const IND_W3  = [2.2,2.9,3.5,4.0,4.4,4.8,5.1,5.4,5.6,5.8,6.0,6.2,6.3];
const IND_W97 = [3.9,5.1,6.1,7.0,7.7,8.3,8.7,9.1,9.5,9.8,10.1,10.4,10.7];
const IND_H50 = [48.0,52.5,55.8,58.5,60.8,62.7,64.3,65.8,67.2,68.5,69.8,71.0,72.2];
const IND_H3  = [44.5,48.6,51.5,54.0,56.2,58.0,59.6,61.0,62.3,63.5,64.7,65.8,66.8];
const IND_H97 = [51.5,56.4,60.1,63.0,65.4,67.4,69.0,70.6,72.1,73.5,74.9,76.2,77.4];

// Euro-Growth Study (Haschke et al. 2000) — European girls, months 0–12
const EU_W50 = [3.3,4.3,5.2,5.9,6.5,7.0,7.4,7.7,8.0,8.3,8.6,8.8,9.1];
const EU_W3  = [2.5,3.3,4.0,4.6,5.1,5.5,5.8,6.1,6.4,6.6,6.8,7.0,7.2];
const EU_W97 = [4.3,5.6,6.7,7.6,8.3,8.9,9.4,9.9,10.3,10.7,11.0,11.3,11.6];
const EU_H50 = [49.5,54.0,57.4,60.2,62.4,64.3,66.0,67.5,69.0,70.4,71.7,73.0,74.3];
const EU_H3  = [46.0,50.2,53.2,55.8,58.0,59.9,61.5,63.0,64.4,65.7,66.9,68.0,69.1];
const EU_H97 = [53.0,57.8,61.6,64.6,66.8,68.7,70.5,72.0,73.6,75.1,76.5,78.0,79.5];

// Chinese National Growth Standards (Li et al. 2009, Capital Institute of Pediatrics) — girls, months 0–12
const CN_W50 = [3.2,4.2,5.1,5.8,6.3,6.8,7.2,7.5,7.8,8.1,8.4,8.6,8.8];
const CN_W3  = [2.4,3.1,3.8,4.4,4.8,5.2,5.5,5.8,6.1,6.3,6.5,6.7,6.9];
const CN_W97 = [4.1,5.4,6.5,7.4,8.1,8.7,9.2,9.6,10.0,10.4,10.7,11.0,11.3];
const CN_H50 = [49.0,53.5,56.9,59.6,61.8,63.7,65.4,66.9,68.3,69.7,71.0,72.2,73.4];
const CN_H3  = [45.4,49.5,52.5,55.0,57.2,59.0,60.6,62.0,63.4,64.7,65.9,67.0,68.1];
const CN_H97 = [52.6,57.5,61.3,64.2,66.4,68.4,70.2,71.8,73.2,74.7,76.1,77.4,78.7];

// Chart filter state
let _referenceStandard = localStorage.getItem('ziva_reference_standard') || 'iap';
// Migrate old 'india' key to 'iap'
if (_referenceStandard === 'india') { _referenceStandard = 'iap'; localStorage.setItem('ziva_reference_standard', 'iap'); }

function getInterpolatedEU(moExact) {
  const lo = Math.floor(moExact), hi = Math.min(lo+1,12), f = moExact-lo;
  const li = Math.min(lo,12), h2 = Math.min(hi,12);
  return {
    w3:EU_W3[li]+(EU_W3[h2]-EU_W3[li])*f, w50:EU_W50[li]+(EU_W50[h2]-EU_W50[li])*f, w97:EU_W97[li]+(EU_W97[h2]-EU_W97[li])*f,
    h3:EU_H3[li]+(EU_H3[h2]-EU_H3[li])*f, h50:EU_H50[li]+(EU_H50[h2]-EU_H50[li])*f, h97:EU_H97[li]+(EU_H97[h2]-EU_H97[li])*f,
  };
}

function getInterpolatedCN(moExact) {
  const lo = Math.floor(moExact), hi = Math.min(lo+1,12), f = moExact-lo;
  const li = Math.min(lo,12), h2 = Math.min(hi,12);
  return {
    w3:CN_W3[li]+(CN_W3[h2]-CN_W3[li])*f, w50:CN_W50[li]+(CN_W50[h2]-CN_W50[li])*f, w97:CN_W97[li]+(CN_W97[h2]-CN_W97[li])*f,
    h3:CN_H3[li]+(CN_H3[h2]-CN_H3[li])*f, h50:CN_H50[li]+(CN_H50[h2]-CN_H50[li])*f, h97:CN_H97[li]+(CN_H97[h2]-CN_H97[li])*f,
  };
}

function getGrowthRef(moExact) {
  if (_referenceStandard === 'iap') return getInterpolatedIND(moExact);
  if (_referenceStandard === 'eu') return getInterpolatedEU(moExact);
  if (_referenceStandard === 'cn') return getInterpolatedCN(moExact);
  return getInterpolatedWHO(moExact);
}

function setReferenceStandard(std) {
  _referenceStandard = std;
  localStorage.setItem('ziva_reference_standard', std);
  // Update all displays that depend on the standard
  drawChart();
  drawHeightChart();
  updatePercentileBadges();
  renderVelocity();
  renderSizeComparison();
  renderGrowthHero();
  renderMilestoneStats();
  renderUpcomingMilestones();
  renderActivities();
  // Re-render sleep stats if on sleep tab
  if (document.getElementById('tab-sleep')?.classList.contains('active')) {
    renderSleepStats();
    renderSleep();
  }
  // Update settings UI
  const sel = document.getElementById('settingsRefStd');
  if (sel) sel.value = std;
}


function updatePercentileBadges() {
  const lwBadge = getLatestWeight();
  if (!lwBadge) return;
  const moExact = ageMonthsAt(lwBadge.date);
  const ref = getGrowthRef(moExact);
  const stdLabel = _referenceStandard === 'iap' ? 'India' : _referenceStandard === 'eu' ? 'EU' : _referenceStandard === 'cn' ? 'China' : 'WHO';

  // Weight percentile
  const wtBadge = document.getElementById('pbadge-wtpct');
  const wtEl = document.getElementById('wtPct');
  const wtP = calcPercentile(lwBadge.wt, ref.w3, ref.w50, ref.w97, ref.w15, ref.w85);
  wtEl.textContent = wtP.text;
  wtBadge.className = 'pbadge pb-rose';
  wtBadge.querySelector('.pbadge-label').textContent = 'Weight %ile (' + stdLabel + ')';

  // Height percentile
  const htBadge = document.getElementById('pbadge-htpct');
  const htEl = document.getElementById('htPct');
  const lhBadge = getLatestHeight();
  if (lhBadge) {
    const htMo = ageMonthsAt(lhBadge.date);
    const htRef = getGrowthRef(htMo);
    const htP = calcPercentile(lhBadge.ht, htRef.h3, htRef.h50, htRef.h97, htRef.h15, htRef.h85);
    htEl.textContent = htP.text;
    htBadge.className = 'pbadge pb-sky';
    htBadge.querySelector('.pbadge-label').textContent = 'Height %ile (' + stdLabel + ')';
  }
}

// ── Chart Zoom System ──
let _chartZoom = { wt: 'all', ht: 'all' };

function setChartZoom(chart, range) {
  _chartZoom[chart] = range;
  // Update pill buttons
  const rowId = chart === 'wt' ? 'wtChartZoom' : 'htChartZoom';
  const activeClass = chart === 'wt' ? 'active' : 'active-sky';
  document.querySelectorAll('#' + rowId + ' .czoom-btn').forEach(b => {
    b.classList.remove('active', 'active-sky');
    if (b.textContent.toLowerCase().replace(/\s/g,'') === range) b.classList.add(activeClass);
  });
  if (chart === 'wt') drawChart();
  else drawHeightChart();
}

function getChartZoomRange(chart) {
  const range = _chartZoom[chart] || 'all';
  if (range === 'all') return null; // use default 0–12m

  const now = new Date();
  let startDate;
  if (range === '1w') startDate = new Date(now - 7 * 86400000);
  else if (range === '2w') startDate = new Date(now - 14 * 86400000);
  else if (range === '1m') startDate = new Date(now - 30 * 86400000);
  else if (range === '3m') startDate = new Date(now - 91 * 86400000);
  else return null;

  const minMonth = ageMonthsAt(toDateStr(startDate));
  const maxMonth = ageMonthsAt(today());
  // Add small padding (0.3 months each side)
  return { min: Math.max(0, minMonth - 0.3), max: maxMonth + 0.3, range };
}

function renderChartContext(chart, zoom) {
  const ctxEl = document.getElementById(chart === 'wt' ? 'wtChartContext' : 'htChartContext');
  if (!ctxEl) return;
  if (!zoom) { ctxEl.style.display = 'none'; return; }

  const entries = chart === 'wt'
    ? growthData.filter(r => r.wt != null && ageMonthsAt(r.date) >= zoom.min && ageMonthsAt(r.date) <= zoom.max)
    : growthData.filter(r => r.ht != null && ageMonthsAt(r.date) >= zoom.min && ageMonthsAt(r.date) <= zoom.max);

  if (entries.length < 2) {
    ctxEl.innerHTML = `<div style="font-size:var(--fs-xs);color:var(--light);padding:4px 0;">Not enough data points in this range for trend analysis.</div>`;
    ctxEl.style.display = '';
    return;
  }

  const first = entries[0], last = entries[entries.length - 1];
  const days = Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / 86400000));

  let html = '';
  if (chart === 'wt') {
    const diff = (last.wt - first.wt);
    const gainG = Math.round(diff * 1000);
    const dailyG = Math.round(gainG / days);
    const sign = diff >= 0 ? '+' : '';
    const color = diff >= 0 ? 'var(--tc-sage)' : 'var(--tc-rose)';
    html = `<div style="display:flex;gap:var(--sp-12);flex-wrap:wrap;font-size:var(--fs-xs);">
      <span style="color:${color};font-weight:600;">${sign}${(diff).toFixed(2)} kg</span>
      <span class="t-mid">${dailyG} g/day over ${days}d</span>
      <span class="t-light">${entries.length} measurements</span>
    </div>`;
  } else {
    const diff = (last.ht - first.ht);
    const sign = diff >= 0 ? '+' : '';
    const color = diff >= 0 ? 'var(--tc-sky)' : 'var(--tc-rose)';
    html = `<div style="display:flex;gap:var(--sp-12);flex-wrap:wrap;font-size:var(--fs-xs);">
      <span style="color:${color};font-weight:600;">${sign}${diff.toFixed(1)} cm</span>
      <span class="t-mid">${(diff/days*7).toFixed(1)} cm/week over ${days}d</span>
      <span class="t-light">${entries.length} measurements</span>
    </div>`;
  }
  ctxEl.innerHTML = html;
  ctxEl.style.display = '';
}

function drawChart() {
  const ctx = document.getElementById('growthChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (window._growthChartInst) window._growthChartInst.destroy();

  const allPoints = growthData.filter(r => r.wt != null).map(r => ({ x: ageMonthsAt(r.date), y: r.wt, date: r.date }));
  const zoom = getChartZoomRange('wt');
  const zivaPoints = zoom
    ? allPoints.filter(p => p.x >= zoom.min - 0.5 && p.x <= zoom.max + 0.5)
    : allPoints;

  // Render context info for zoomed view
  renderChartContext('wt', zoom);

  // Compute axis bounds
  let xMin = 0, xMax = 12, yMin = 2, yMax = 12;
  if (zoom && zivaPoints.length > 0) {
    xMin = Math.max(0, Math.floor(zoom.min));
    xMax = Math.min(12, Math.ceil(zoom.max));
    if (xMax - xMin < 1) xMax = xMin + 1;
    const vals = zivaPoints.map(p => p.y);
    const dataMin = Math.min(...vals);
    const dataMax = Math.max(...vals);
    const padding = Math.max(0.3, (dataMax - dataMin) * 0.25);
    yMin = Math.max(0, Math.floor((dataMin - padding) * 2) / 2);
    yMax = Math.ceil((dataMax + padding) * 2) / 2;
  }
  const f = _referenceStandard;
  const datasets = [];

  if (f === 'who') {
    datasets.push({ label:'WHO 97th', data: WHO_W97.map((y,x)=>({x,y})), borderColor:'rgba(200,170,200,0.3)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'WHO 3rd',  data: WHO_W3.map((y,x)=>({x,y})),  borderColor:'rgba(200,170,200,0.3)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(200,170,200,0.08)', fill:'-1', tension:0.4 });
    datasets.push({ label:'WHO 50th', data: WHO_W50.map((y,x)=>({x,y})), borderColor:'rgba(180,130,160,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[4,3], tension:0.4 });
  }
  if (f === 'iap') {
    datasets.push({ label:'India 97th', data: IND_W97.map((y,x)=>({x,y})), borderColor:'rgba(255,165,0,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'India 3rd',  data: IND_W3.map((y,x)=>({x,y})),  borderColor:'rgba(255,165,0,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(255,165,0,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'India 50th', data: IND_W50.map((y,x)=>({x,y})), borderColor:'rgba(255,140,0,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  if (f === 'eu') {
    datasets.push({ label:'EU 97th', data: EU_W97.map((y,x)=>({x,y})), borderColor:'rgba(70,130,180,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'EU 3rd',  data: EU_W3.map((y,x)=>({x,y})),  borderColor:'rgba(70,130,180,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(70,130,180,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'EU 50th', data: EU_W50.map((y,x)=>({x,y})), borderColor:'rgba(70,130,180,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  if (f === 'cn') {
    datasets.push({ label:'CN 97th', data: CN_W97.map((y,x)=>({x,y})), borderColor:'rgba(220,60,60,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'CN 3rd',  data: CN_W3.map((y,x)=>({x,y})),  borderColor:'rgba(220,60,60,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(220,60,60,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'CN 50th', data: CN_W50.map((y,x)=>({x,y})), borderColor:'rgba(220,60,60,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  const wtPointR = zoom ? 7 : 5;
  const wtHoverR = zoom ? 10 : 7;
  datasets.push({ label:'Ziva', data: zivaPoints, borderColor:'#f2a8b8', backgroundColor:'#f2a8b8', borderWidth:zoom ? 3 : 2.5, pointRadius:wtPointR, pointHoverRadius:wtHoverR, pointBorderColor:'white', pointBorderWidth:2, fill:false, tension:0.3 });

  const legendFilter = f === 'iap' ? ['India 50th','Ziva'] : f === 'eu' ? ['EU 50th','Ziva'] : f === 'cn' ? ['CN 50th','Ziva'] : ['WHO 50th','Ziva'];
  const _ct = getChartTheme();

  window._growthChartInst = new Chart(ctx.getContext('2d'), {
    type:'line',
    data:{ labels: Array.from({length:13}, (_,i) => i+'m'), datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:true, position:'bottom', labels:{ boxWidth:_ct.legend.boxWidth, padding:_ct.legend.padding, font:{size:9,family:'Nunito'}, color:_ct.textColor, filter: item => legendFilter.includes(item.text) } },
        tooltip:{ ..._ct.tooltip, callbacks:{
          title: i => {
            const ageStr = `Age: ${i[0].parsed.x.toFixed(1)}m`;
            if (zoom && i[0].dataset.label === 'Ziva') {
              const pt = zivaPoints[i[0].dataIndex];
              return pt && pt.date ? `${ageStr} · ${formatDate(pt.date)}` : ageStr;
            }
            return ageStr;
          },
          label: i => `${i.dataset.label}: ${i.parsed.y} kg`
        } }
      },
      scales:{
        x:{ type:'linear', min:xMin, max:xMax, ticks:{ callback:v=>zoom?(v%1===0?v+'m':v.toFixed(1)+'m'):v+'m', color:_ct.textColor, font:_ct.font, maxTicksLimit: zoom ? 8 : 13 }, grid:{color:_ct.gridColor()}, border:{color:_ct.gridColor(0.2)} },
        y:{ min:yMin, max:yMax, ticks:{ callback:v=>v+'kg', color:_ct.textColor, font:_ct.font }, grid:{color:_ct.gridColor()}, border:{color:_ct.gridColor(0.2)} }
      }
    }
  });
}

// ── HEIGHT CHART ──
function drawHeightChart() {
  const ctx = document.getElementById('heightChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (window._heightChartInst) window._heightChartInst.destroy();

  const allHtPoints = growthData.filter(r => r.ht).map(r => ({ x: ageMonthsAt(r.date), y: r.ht, date: r.date }));
  if (allHtPoints.length === 0) {
    ctx.parentElement.innerHTML = '<div style="font-size:var(--fs-base);color:var(--light);padding:20px 0;text-align:center;">Add height measurements to see the chart.</div>';
    return;
  }
  const zoom = getChartZoomRange('ht');
  const zivaHtPoints = zoom
    ? allHtPoints.filter(p => p.x >= zoom.min - 0.5 && p.x <= zoom.max + 0.5)
    : allHtPoints;

  // Render context info for zoomed view
  renderChartContext('ht', zoom);

  // Compute axis bounds
  let xMin = 0, xMax = 12, yMin = 44, yMax = 80;
  if (zoom && zivaHtPoints.length > 0) {
    xMin = Math.max(0, Math.floor(zoom.min));
    xMax = Math.min(12, Math.ceil(zoom.max));
    if (xMax - xMin < 1) xMax = xMin + 1;
    const vals = zivaHtPoints.map(p => p.y);
    const dataMin = Math.min(...vals);
    const dataMax = Math.max(...vals);
    const padding = Math.max(1, (dataMax - dataMin) * 0.25);
    yMin = Math.max(0, Math.floor(dataMin - padding));
    yMax = Math.ceil(dataMax + padding);
  }

  const f = _referenceStandard;
  const datasets = [];

  if (f === 'who') {
    datasets.push({ label:'WHO 97th', data: WHO_H97.map((y,x)=>({x,y})), borderColor:'rgba(168,207,224,0.3)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'WHO 3rd',  data: WHO_H3.map((y,x)=>({x,y})),  borderColor:'rgba(168,207,224,0.3)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(168,207,224,0.08)', fill:'-1', tension:0.4 });
    datasets.push({ label:'WHO 50th', data: WHO_H50.map((y,x)=>({x,y})), borderColor:'rgba(100,160,190,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[4,3], tension:0.4 });
  }
  if (f === 'iap') {
    datasets.push({ label:'India 97th', data: IND_H97.map((y,x)=>({x,y})), borderColor:'rgba(255,165,0,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'India 3rd',  data: IND_H3.map((y,x)=>({x,y})),  borderColor:'rgba(255,165,0,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(255,165,0,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'India 50th', data: IND_H50.map((y,x)=>({x,y})), borderColor:'rgba(255,140,0,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  if (f === 'eu') {
    datasets.push({ label:'EU 97th', data: EU_H97.map((y,x)=>({x,y})), borderColor:'rgba(70,130,180,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'EU 3rd',  data: EU_H3.map((y,x)=>({x,y})),  borderColor:'rgba(70,130,180,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(70,130,180,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'EU 50th', data: EU_H50.map((y,x)=>({x,y})), borderColor:'rgba(70,130,180,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  if (f === 'cn') {
    datasets.push({ label:'CN 97th', data: CN_H97.map((y,x)=>({x,y})), borderColor:'rgba(220,60,60,0.25)', borderWidth:1, pointRadius:0, fill:false, tension:0.4 });
    datasets.push({ label:'CN 3rd',  data: CN_H3.map((y,x)=>({x,y})),  borderColor:'rgba(220,60,60,0.25)', borderWidth:1, pointRadius:0, backgroundColor:'rgba(220,60,60,0.06)', fill:'-1', tension:0.4 });
    datasets.push({ label:'CN 50th', data: CN_H50.map((y,x)=>({x,y})), borderColor:'rgba(220,60,60,0.6)', borderWidth:1.5, pointRadius:0, fill:false, borderDash:[6,3], tension:0.4 });
  }
  const htPointR = zoom ? 7 : 5;
  const htHoverR = zoom ? 10 : 7;
  datasets.push({ label:'Ziva', data: zivaHtPoints, borderColor:'#a8cfe0', backgroundColor:'#a8cfe0', borderWidth:zoom ? 3 : 2.5, pointRadius:htPointR, pointHoverRadius:htHoverR, pointBorderColor:'white', pointBorderWidth:2, fill:false, tension:0.3 });

  const legendFilter = f === 'iap' ? ['India 50th','Ziva'] : f === 'eu' ? ['EU 50th','Ziva'] : f === 'cn' ? ['CN 50th','Ziva'] : ['WHO 50th','Ziva'];
  const _ct = getChartTheme();

  window._heightChartInst = new Chart(ctx.getContext('2d'), {
    type:'line',
    data:{ labels: Array.from({length:13}, (_,i) => i+'m'), datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:true, position:'bottom', labels:{ boxWidth:_ct.legend.boxWidth, padding:_ct.legend.padding, font:{size:9,family:'Nunito'}, color:_ct.textColor, filter: item => legendFilter.includes(item.text) } },
        tooltip:{ ..._ct.tooltip, callbacks:{
          title: i => {
            const ageStr = `Age: ${i[0].parsed.x.toFixed(1)}m`;
            if (zoom && i[0].dataset.label === 'Ziva') {
              const pt = zivaHtPoints[i[0].dataIndex];
              return pt && pt.date ? `${ageStr} · ${formatDate(pt.date)}` : ageStr;
            }
            return ageStr;
          },
          label: i => `${i.dataset.label}: ${i.parsed.y} cm`
        } }
      },
      scales:{
        x:{ type:'linear', min:xMin, max:xMax, ticks:{ callback:v=>zoom?(v%1===0?v+'m':v.toFixed(1)+'m'):v+'m', color:_ct.textColor, font:_ct.font, maxTicksLimit: zoom ? 8 : 13 }, grid:{color:_ct.gridColor()}, border:{color:_ct.gridColor(0.2)} },
        y:{ min:yMin, max:yMax, ticks:{ callback:v=>v+'cm', color:_ct.textColor, font:_ct.font }, grid:{color:_ct.gridColor()}, border:{color:_ct.gridColor(0.2)} }
      }
    }
  });
}

// ── GROWTH VELOCITY ──
function getInterpolatedIND(moExact) {
  const lo = Math.floor(moExact), hi = Math.min(lo+1,12), f = moExact-lo;
  const li = Math.min(lo,12), h2 = Math.min(hi,12);
  return {
    w3:IND_W3[li]+(IND_W3[h2]-IND_W3[li])*f, w50:IND_W50[li]+(IND_W50[h2]-IND_W50[li])*f, w97:IND_W97[li]+(IND_W97[h2]-IND_W97[li])*f,
    h3:IND_H3[li]+(IND_H3[h2]-IND_H3[li])*f, h50:IND_H50[li]+(IND_H50[h2]-IND_H50[li])*f, h97:IND_H97[li]+(IND_H97[h2]-IND_H97[li])*f,
  };
}

function renderVelocity() {
  const el = document.getElementById('velocityContent');

  // Need at least 2 weight entries for velocity
  const wtEntries = growthData.filter(r => r.wt != null);
  if (wtEntries.length < 2) {
    el.innerHTML = '<div class="t-sub-light">Need at least 2 weight measurements to calculate velocity.</div>';
    return;
  }

  const lastWt = wtEntries[wtEntries.length - 1];
  const prevWt = wtEntries[wtEntries.length - 2];
  const days = Math.max(1, Math.round((new Date(lastWt.date) - new Date(prevWt.date)) / 86400000));
  const mo = Math.round(getAgeInMonths());
  const moExact = ageMonthsAt(lastWt.date);
  const ref = _referenceStandard === 'iap' ? getInterpolatedIND(moExact) : getGrowthRef(moExact);
  const refLabel = _referenceStandard === 'iap' ? 'India' : _referenceStandard === 'eu' ? 'EU' : _referenceStandard === 'cn' ? 'China' : 'WHO';

  // Weight velocity
  const wtGainG = Math.round((lastWt.wt - prevWt.wt) * 1000);
  const gPerDay = Math.round(wtGainG / days);
  const expectedMin = mo <= 3 ? 25 : mo <= 6 ? 15 : mo <= 9 ? 10 : 8;
  const expectedMax = mo <= 3 ? 35 : mo <= 6 ? 25 : mo <= 9 ? 18 : 14;
  const wtPctFill = Math.min(100, Math.max(5, ((gPerDay - 0) / (expectedMax * 1.5)) * 100));
  const wtColor = (gPerDay >= expectedMin && gPerDay <= expectedMax * 1.3) ? 'var(--tc-sage)' : gPerDay < expectedMin ? 'var(--tc-caution)' : 'var(--tc-sky)';

  // Position relative to reference 50th
  const wtPct = calcPercentile(lastWt.wt, ref.w3, ref.w50, ref.w97);

  let html = '<div class="velocity-gauges">';

  html += `
    <div class="velocity-gauge vg-sage">
      <div class="vg-icon">${zi('bolt')}</div>
      <div class="vg-info">
        <div><span class="vg-value" style="color:${wtColor};">${gPerDay}</span><span class="vg-unit">g/day</span></div>
        <div class="vg-label">Gain rate</div>
        <div class="vg-context">Expected: ${expectedMin}–${expectedMax}</div>
      </div>
    </div>`;

  html += `
    <div class="velocity-gauge vg-rose">
      <div class="vg-icon">${zi('chart')}</div>
      <div class="vg-info">
        <div><span class="vg-value tc-rose">+${wtGainG}</span><span class="vg-unit">g</span></div>
        <div class="vg-label">In ${days} days</div>
        <div class="vg-context">${formatDate(prevWt.date)} → ${formatDate(lastWt.date)}</div>
      </div>
    </div>`;

  // Height velocity — compare two most recent entries with height
  const htEntries = growthData.filter(r => r.ht != null);
  if (htEntries.length >= 2) {
    const htLast = htEntries[htEntries.length - 1];
    const htPrev = htEntries[htEntries.length - 2];
    const htDays = Math.max(1, Math.round((new Date(htLast.date) - new Date(htPrev.date)) / 86400000));
    const htGainCm = (htLast.ht - htPrev.ht).toFixed(1);
    const cmPerWeek = ((htLast.ht - htPrev.ht) / (htDays / 7)).toFixed(1);
    const expCmWk = mo <= 6 ? '0.4–0.6' : '0.2–0.4';
    const htColor = parseFloat(cmPerWeek) > 0 ? 'var(--tc-sky)' : 'var(--tc-caution)';
    html += `
      <div class="velocity-gauge vg-sky">
        <div class="vg-icon">${zi('ruler')}</div>
        <div class="vg-info">
          <div><span class="vg-value" style="color:${htColor};">+${htGainCm}</span><span class="vg-unit">cm · ${cmPerWeek}/wk</span></div>
          <div class="vg-label">Height gain</div>
          <div class="vg-context">Expected: ~${expCmWk} cm/wk</div>
        </div>
      </div>`;
  }

  const birth = growthData.find(r => r.wt != null);
  const ratio = (lastWt.wt / birth.wt).toFixed(1);
  const doubled = lastWt.wt >= birth.wt * 2;
  html += `
    <div class="velocity-gauge vg-lav">
      <div class="vg-icon">${zi('sparkle')}</div>
      <div class="vg-info">
        <div><span class="vg-value" style="color:${doubled ? 'var(--tc-sage)' : 'var(--tc-lav)'};">${ratio}×</span><span class="vg-unit">birth wt</span></div>
        <div class="vg-label">${doubled ? 'Doubled!' : 'Approaching 2×'}</div>
        <div class="vg-context">${refLabel}: ${wtPct.text} · ${birth.wt}→${lastWt.wt} kg</div>
      </div>
    </div>`;

  html += '</div>';
  el.innerHTML = html;
}

// ── FUN SIZE COMPARISONS ──
function renderSizeComparison() {
  const el = document.getElementById('sizeComparison');
  const lwSize = getLatestWeight();
  const lhSize = getLatestHeight();
  if (!lwSize && !lhSize) { el.innerHTML = ''; return; }

  const wt = lwSize ? lwSize.wt : null;
  const ht = lhSize ? lhSize.ht : null;

  // Weight tidbits — multiple per range, randomly picked
  const wtTidbits = [
    { max:3.5, pool:[
      { icon:zi('spoon'), text:'About as heavy as a large pineapple', sub:'Tropical-sized bundle of joy' },
      { icon:zi('bowl'), text:'Weighs about 3 coconuts', sub:'Nature\'s own weight measure' },
      { icon:zi('book'), text:'About the weight of a thick hardcover novel', sub:'A real page-turner, this one' },
    ]},
    { max:5.0, pool:[
      { icon:zi('drop'), text:'About as heavy as a medium watermelon', sub:'Sweet and round — just like her' },
      { icon:zi('baby'), text:'About the weight of a newborn kitten… times two!', sub:'Twice the cuteness too' },
      { icon:zi('brain'), text:'Weighs as much as 10 cricket balls', sub:'Bowled over by this little one' },
      { icon:zi('star'), text:'About the weight of a large stuffed teddy', sub:'Even more huggable though' },
    ]},
    { max:6.5, pool:[
      { icon:zi('run'), text:'About the weight of a bowling ball', sub:'Rolling through milestones like strikes' },
      { icon:zi('baby'), text:'Heavier than a Chihuahua puppy', sub:'And way more entertaining' },
      { icon:zi('baby'), text:'About the weight of a packed school bag', sub:'Carrying the weight of all your love' },
      { icon:zi('spoon'), text:'As heavy as 3 large mangoes', sub:'The sweetest harvest of all' },
    ]},
    { max:7.5, pool:[
      { icon:zi('drop'), text:'As heavy as a large watermelon — and twice as sweet!', sub:(wt*1000).toFixed(0) + ' grams of pure joy' },
      { icon:zi('baby'), text:'About as heavy as a miniature dachshund puppy', sub:'Same energy too, probably' },
      { icon:zi('brain'), text:'Weighs about 3 laptops stacked up', sub:'Processing cuteness at full speed' },
      { icon:zi('run'), text:'About the weight of 12 basketballs', sub:'Slam dunking every milestone' },
      { icon:zi('brain'), text:'As heavy as 15 standard bricks', sub:'Building the foundation of a great life' },
      { icon:zi('baby'), text:'Almost as heavy as a full-grown cat', sub:'With way more personality' },
    ]},
    { max:8.5, pool:[
      { icon:zi('baby'), text:'About the weight of a full-grown house cat', sub:'Equally curious, equally adorable' },
      { icon:zi('star'), text:'Almost as heavy as a small guitar', sub:'Making music with every giggle' },
      { icon:zi('run'), text:'Weighs as much as 130 tennis balls', sub:'Love-all in this game of life' },
      { icon:zi('note'), text:'About the weight of a bag of rice', sub:'The most precious grain of all' },
    ]},
    { max:10.0, pool:[
      { icon:zi('brain'), text:'About the weight of 4 MacBook Airs stacked up', sub:'More powerful than all of them combined' },
      { icon:zi('star'), text:'About as heavy as an acoustic guitar', sub:'Strumming heartstrings daily' },
      { icon:zi('baby'), text:'About the weight of a beagle puppy', sub:'Equally floppy, equally lovable' },
      { icon:zi('run'), text:'Heavier than most dumbbells at the gym', sub:'The best workout is carrying this one' },
    ]},
    { max:12, pool:[
      { icon:zi('baby'), text:'About the weight of a beagle puppy', sub:'Growing fast and strong' },
      { icon:zi('star'), text:'About as heavy as a full-size guitar', sub:'A rockstar in the making' },
      { icon:zi('note'), text:'About the weight of a carry-on suitcase', sub:'Packed with love and adventure' },
    ]},
  ];

  // Height tidbits — multiple per range
  const htTidbits = [
    { max:52, pool:[
      { icon:zi('run'), text:'About the length of a cricket bat handle', sub:'Ready for her first innings' },
      { icon:zi('spoon'), text:'About as long as a baguette', sub:'Freshly baked perfection' },
      { icon:zi('sprout'), text:'As tall as a medium sunflower', sub:'Growing towards the sun' },
    ]},
    { max:56, pool:[
      { icon:zi('star'), text:'About the length of a ukulele', sub:'Tiny but mighty' },
      { icon:zi('star'), text:'Taller than most teddy bears', sub:'The real thing is always better' },
      { icon:zi('baby'), text:'About the length of a folded umbrella', sub:'Sunshine on rainy days' },
    ]},
    { max:60, pool:[
      { icon:zi('star'), text:'About as tall as a large teddy bear', sub:'The most huggable height' },
      { icon:zi('target'), text:'As long as an archery arrow', sub:'Always hitting the target' },
      { icon:zi('run'), text:'About the length of a traditional sword', sub:'A little warrior princess' },
    ]},
    { max:64, pool:[
      { icon:zi('run'), text:'About the length of a full cricket stump', sub:'Stumped by her cuteness' },
      { icon:zi('run'), text:'About the length of toddler skis', sub:'Ready for adventure' },
      { icon:zi('star'), text:'As long as a banjo', sub:'Playing a tune with every kick' },
    ]},
    { max:68, pool:[
      { icon:zi('star'), text:'About as tall as a violin (with bow)', sub:'A symphony in motion' },
      { icon:zi('run'), text:'Almost as long as a skateboard', sub:'Rolling through life' },
      { icon:zi('baby'), text:'About the same length as a golden retriever puppy', sub:'Same level of adorable' },
      { icon:zi('bowl'), text:'As tall as a mature wheat stalk', sub:'Growing strong in the fields of love' },
      { icon:zi('ruler'), text:'She\'s grown ' + (ht ? (ht - growthData[0].ht).toFixed(0) : '—') + ' cm since birth!', sub:'That\'s like adding a whole ruler length' },
    ]},
    { max:72, pool:[
      { icon:zi('run'), text:'About as long as a skateboard', sub:'Cruising through milestones' },
      { icon:zi('star'), text:'Almost as long as a half-size guitar', sub:'Rockstar height achieved' },
      { icon:zi('baby'), text:'About the height of a small side table', sub:'Reaching new heights daily' },
    ]},
    { max:80, pool:[
      { icon:zi('star'), text:'Almost as long as a guitar!', sub:'Full-size rockstar incoming' },
      { icon:zi('baby'), text:'About a third of a standard door height', sub:'Knocking on the door of toddlerhood' },
      { icon:zi('run'), text:'About the length of a hockey stick', sub:'Scoring goals every day' },
    ]},
  ];

  let html = '';

  // Weight tidbit — random pick from matching range
  const wtRange = wtTidbits.find(t => wt <= t.max) || wtTidbits[wtTidbits.length - 1];
  const wtPick = wtRange.pool[Math.floor(Math.random() * wtRange.pool.length)];
  html += `
    <div class="size-item si-rose">
      <div class="size-icon">${wtPick.icon}</div>
      <div class="size-body">
        <strong>${wt} kg — ${wtPick.text}</strong>
        <span>${wtPick.sub}</span>
      </div>
    </div>`;

  // Height tidbit — random pick from matching range
  if (ht) {
    const htRange = htTidbits.find(t => ht <= t.max) || htTidbits[htTidbits.length - 1];
    const htPick = htRange.pool[Math.floor(Math.random() * htRange.pool.length)];
    html += `
      <div class="size-item si-sky">
        <div class="size-icon">${htPick.icon}</div>
        <div class="size-body">
          <strong>${ht} cm — ${htPick.text}</strong>
          <span>${htPick.sub}</span>
        </div>
      </div>`;
  }

  // Fun fact based on percentile — uses active filter
  if (!wt) { el.innerHTML = html; return; }
  const moExact = ageMonthsAt(lwSize.date);
  const ref = _referenceStandard === 'iap' ? getInterpolatedIND(moExact) : getGrowthRef(moExact);
  const refLabel = _referenceStandard === 'iap' ? 'Indian national' : _referenceStandard === 'eu' ? 'Euro-Growth' : _referenceStandard === 'cn' ? 'Chinese national' : 'WHO';
  const pctArgs = _referenceStandard === 'iap'
    ? [wt, ref.w3, ref.w50, ref.w97]
    : [wt, ref.w3, ref.w50, ref.w97, ref.w15, ref.w85];
  const pctResult = calcPercentile(...pctArgs);
  const pctVal = pctResult.pct;
  let funFact = '';
  if (pctVal >= 40 && pctVal <= 60) funFact = 'Right in the middle of the pack — textbook healthy growth! ' + zi('book');
  else if (pctVal > 60 && pctVal <= 85) funFact = 'On the sturdier side — she\'s got a strong frame building! ' + zi('run');
  else if (pctVal > 85) funFact = 'Big and thriving — some babies are just built bigger, and that\'s great! ' + zi('sparkle');
  else if (pctVal >= 15 && pctVal < 40) funFact = 'Petite but perfectly on her own curve — consistency matters most! ' + zi('sprout');
  else if (pctVal < 15) funFact = 'On the smaller side — keep tracking the trend, your paediatrician will guide you! ' + zi('star');

  if (funFact) {
    html += `
      <div class="size-item si-lav">
        <div class="size-icon">${zi('chart')}</div>
        <div class="size-body">
          <strong>${funFact}</strong>
          <span>Compared to ${refLabel} growth standards for ${Math.round(moExact)}-month-old girls</span>
        </div>
      </div>`;
  }

  el.innerHTML = html;
}

// ── MEASUREMENT REMINDERS (weight + height) ──
function renderWeighInReminder() {
  const homeCard = document.getElementById('homeMeasureReminder');
  if (!homeCard) return;
  if (growthData.length === 0) {
    homeCard.style.display = 'none';
    return;
  }

  const mo = getAgeInMonths();

  // Weight tracking
  const lastWtEntry = getLatestWeight();
  const wtDaysSince = lastWtEntry ? Math.round((new Date() - new Date(lastWtEntry.date)) / 86400000) : 999;
  const wtIdealDays = mo <= 7 ? 7 : mo <= 9 ? 14 : 30;
  const wtDaysUntil = Math.max(0, wtIdealDays - wtDaysSince);
  const wtDue = wtDaysUntil <= 1;

  // Height tracking
  const lastHt = getLatestHeight();
  const htDaysSince = lastHt ? Math.round((new Date() - new Date(lastHt.date)) / 86400000) : 999;
  const htIdealDays = mo <= 9 ? 14 : 30;
  const htDaysUntil = Math.max(0, htIdealDays - htDaysSince);
  const htDue = htDaysUntil <= 1;
  const noHeight = !lastHt;

  // Only show on home when something is due
  if (!wtDue && !htDue && !noHeight) {
    homeCard.style.display = 'none';
    return;
  }

  let html = '';
  if (wtDue) {
    html += `<div class="weighin-alert due" style="margin-bottom:8px;cursor:pointer;" data-action="openGrowthModal">
      <div class="weighin-icon">${zi('scale')}</div>
      <div class="weighin-body">
        <strong>Weigh-in due — last was ${wtDaysSince} days ago</strong>
        <span>Tap to add measurement</span>
      </div>
    </div>`;
  }
  if (noHeight) {
    html += `<div class="weighin-alert due" data-action="openGrowthModal">
      <div class="weighin-icon">${zi('ruler')}</div>
      <div class="weighin-body">
        <strong>No height recorded yet</strong>
        <span>Tap to add a height measurement</span>
      </div>
    </div>`;
  } else if (htDue) {
    html += `<div class="weighin-alert due" data-action="openGrowthModal">
      <div class="weighin-icon">${zi('ruler')}</div>
      <div class="weighin-body">
        <strong>Height check due — last was ${htDaysSince} days ago</strong>
        <span>Tap to add measurement</span>
      </div>
    </div>`;
  }

  homeCard.style.display = 'block';
  homeCard.innerHTML = html;
}

// addDays → migrated to core.js

function deleteGrowth(i) {
  confirmAction('Delete this growth entry?', () => {
    growthData.splice(i, 1);
    renderGrowth();
    renderGrowthHistory();
    updateHeader();
  });
}
function openGrowthModal() {
  document.getElementById('gDate').value = today();
  document.getElementById('gWeight').value = '';
  document.getElementById('gHeight').value = '';
  document.getElementById('gWeightCheck').checked = false;
  document.getElementById('gHeightCheck').checked = false;
  document.getElementById('gHeightConvert').style.display = 'none';
  const defaultUnit = localStorage.getItem('ziva_height_unit') || 'ft';
  document.getElementById('gHeightUnit').value = defaultUnit;
  updateGrowthSaveBtn();
  openModal('growthModal');
}

// Auto-check the checkbox when user starts typing
function autoCheckField(checkboxId) {
  const cb = document.getElementById(checkboxId);
  if (cb && !cb.checked) cb.checked = true;
}

function updateGrowthSaveBtn() {
  const btn = document.getElementById('growthSaveBtn');
  if (!btn) return;
  const d = document.getElementById('gDate').value;
  const wtChecked = document.getElementById('gWeightCheck').checked;
  const htChecked = document.getElementById('gHeightCheck').checked;
  const w = parseFloat(document.getElementById('gWeight').value);
  const h = parseFloat(document.getElementById('gHeight').value);
  const hasWeight = wtChecked && !isNaN(w) && w > 0;
  const hasHeight = htChecked && !isNaN(h) && h > 0;
  const hasContent = d && (hasWeight || hasHeight);
  btn.style.opacity = hasContent ? '1' : '0.4';
  btn.style.pointerEvents = hasContent ? 'auto' : 'none';
}

function convertHeight() {
  const val = parseFloat(document.getElementById('gHeight').value);
  const unit = document.getElementById('gHeightUnit').value;
  const convEl = document.getElementById('gHeightConvert');

  if (isNaN(val) || val <= 0) {
    convEl.style.display = 'none';
    return;
  }

  let cm;
  if (unit === 'cm') {
    cm = val;
    const totalIn = cm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const remainIn = (totalIn % 12).toFixed(1);
    convEl.textContent = `= ${totalIn.toFixed(1)} in · ${ft}′ ${remainIn}″`;
  } else if (unit === 'in') {
    cm = val * 2.54;
    const ft = Math.floor(val / 12);
    const remainIn = (val % 12).toFixed(1);
    convEl.textContent = `= ${cm.toFixed(1)} cm · ${ft}′ ${remainIn}″`;
  } else if (unit === 'ft') {
    // Treat input as decimal feet (e.g., 2.2 = 2 feet 2.4 inches)
    const wholeFt = Math.floor(val);
    const decimalPart = val - wholeFt;
    const inches = decimalPart * 10; // 2.2 → 2 ft 2 in (intuitive input)
    const totalIn = wholeFt * 12 + inches;
    cm = totalIn * 2.54;
    convEl.textContent = `= ${wholeFt}′ ${inches.toFixed(1)}″ · ${cm.toFixed(1)} cm`;
  }
  convEl.style.display = 'block';
}

function getHeightInCm() {
  const val = parseFloat(document.getElementById('gHeight').value);
  const unit = document.getElementById('gHeightUnit').value;
  if (isNaN(val) || val <= 0) return null;

  if (unit === 'cm') return val;
  if (unit === 'in') return val * 2.54;
  if (unit === 'ft') {
    const wholeFt = Math.floor(val);
    const inches = (val - wholeFt) * 10;
    return (wholeFt * 12 + inches) * 2.54;
  }
  return val;
}

function addGrowthEntry() {
  const d = document.getElementById('gDate').value;
  const wtChecked = document.getElementById('gWeightCheck').checked;
  const htChecked = document.getElementById('gHeightCheck').checked;
  const w = parseFloat(document.getElementById('gWeight').value);
  const htCm = getHeightInCm();

  if (!d) return;
  const hasWeight = wtChecked && !isNaN(w) && w > 0;
  const hasHeight = htChecked && htCm && htCm > 0;
  if (!hasWeight && !hasHeight) return;

  growthData.push({
    date: d,
    wt: hasWeight ? w : null,
    ht: hasHeight ? Math.round(htCm * 10) / 10 : null,
  });
  closeModal('growthModal');
  _islMarkDirty('medical');
  renderGrowth();
  updateHeader();
}

// Height display helper — converts cm to the user's preferred unit
function formatHeight(cm) {
  if (!cm) return '—';
  const unit = localStorage.getItem('ziva_height_unit') || 'ft';
  if (unit === 'cm') return cm + ' cm';
  const totalIn = cm / 2.54;
  if (unit === 'in') return totalIn.toFixed(1) + ' in';
  // feet and inches
  const ft = Math.floor(totalIn / 12);
  const remainIn = (totalIn % 12).toFixed(1);
  return `${ft}′ ${remainIn}″`;
}

// ─────────────────────────────────────────
// GROWTH TAB QUICK STATS
// ─────────────────────────────────────────
function renderGrowthStats() {
  renderGrowthHero();
}

function renderGrowthHero() {
  const el = document.getElementById('growthHeroContent');
  if (!el) return;

  const lastWtE = getLatestWeight();
  const lastHtE = getLatestHeight();
  const { months, days } = preciseAge();
  const ageStr = `${months}m ${days}d`;

  // Compute percentiles
  let wtPct = null, htPct = null, wtVal = '—', htVal = '—';
  let wtPctNum = 50, htPctNum = 50;
  if (lastWtE) {
    const who = getGrowthRef(ageMonthsAt(lastWtE.date));
    const p = calcPercentile(lastWtE.wt, who.w3, who.w50, who.w97, who.w15, who.w85);
    wtPct = p;
    wtPctNum = parseInt(p.text) || 50;
    wtVal = lastWtE.wt + ' kg';
  }
  if (lastHtE) {
    const who = getGrowthRef(ageMonthsAt(lastHtE.date));
    const p = calcPercentile(lastHtE.ht, who.h3, who.h50, who.h97, who.h15, who.h85);
    htPct = p;
    htPctNum = parseInt(p.text) || 50;
    htVal = formatHeight(lastHtE.ht);
  }

  // Gain rate
  let gainStr = '—', gainLabel = 'Gain rate';
  const wtEntries = growthData.filter(r => r.wt != null);
  if (wtEntries.length >= 2) {
    const wL = wtEntries[wtEntries.length - 1];
    const wP = wtEntries[wtEntries.length - 2];
    const gainG = Math.round((wL.wt - wP.wt) * 1000);
    const dd = Math.max(1, Math.round((new Date(wL.date) - new Date(wP.date)) / 86400000));
    gainStr = Math.round(gainG / dd) + ' g/day';
  }

  // Days since last measurement
  const last = growthData[growthData.length - 1];
  let lastMeasuredStr = '—';
  if (last) {
    const daysSince = Math.floor((new Date() - new Date(last.date)) / 86400000);
    lastMeasuredStr = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : daysSince + 'd ago';
  }

  // SVG gauge ring helper
  const R = 42, C = 2 * Math.PI * R;
  function gaugeRing(pctNum, val, unit, pctText, label, color, bgColor) {
    const fill = Math.max(3, Math.min(97, pctNum));
    const offset = C - (fill / 100) * C;
    const pctBg = pctNum >= 25 && pctNum <= 75 ? 'rgba(111,207,151,0.15)' : pctNum >= 10 && pctNum <= 90 ? 'rgba(232,200,109,0.15)' : 'rgba(224,112,112,0.15)';
    const pctColor = pctNum >= 25 && pctNum <= 75 ? '#1a7a42' : pctNum >= 10 && pctNum <= 90 ? '#8a6520' : '#a03030';
    return `<div class="gh-gauge">
      <div class="gh-gauge-ring" data-action="openGrowthModal">
        <svg viewBox="0 0 100 100">
          <circle class="gh-track" cx="50" cy="50" r="${R}"/>
          <circle class="gh-fill" cx="50" cy="50" r="${R}" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="gh-gauge-inner">
          <div class="gh-gauge-val" style="color:${color};">${val}</div>
          <div class="gh-gauge-unit">${unit}</div>
          ${pctText ? `<div class="gh-gauge-pct" style="background:${pctBg};color:${pctColor};">${pctText}</div>` : ''}
        </div>
      </div>
      <div class="gh-gauge-label">${label}</div>
    </div>`;
  }

  const wtColor = '#c06078';
  const htColor = '#4686a0';

  let html = '<div class="growth-hero">';

  // Age label
  html += `<div style="text-align:center;margin-bottom:2px;">
    <span style="font-size:var(--fs-xs);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-normal);color:var(--mid);">Age: ${ageStr}</span>
  </div>`;

  // Gauge rings
  html += '<div class="gh-gauges">';
  html += gaugeRing(wtPctNum, wtVal, 'weight', wtPct ? wtPct.text : null, 'Weight', wtColor);
  html += gaugeRing(htPctNum, htVal, 'height', htPct ? htPct.text : null, 'Height', htColor);
  html += '</div>';

  // Meta pills row
  html += '<div class="gh-meta-row">';
  html += `<div class="gh-meta-pill" data-scroll-to="velocityContent" data-scroll-block="center">
    <span class="gh-meta-icon">${zi('bolt')}</span>
    <div class="gh-meta-text">
      <div class="gh-meta-val">${gainStr}</div>
      <div class="gh-meta-label">${gainLabel}</div>
    </div>
  </div>`;
  html += `<div class="gh-meta-pill" data-action="openGrowthModal">
    <span class="gh-meta-icon">${zi('clock')}</span>
    <div class="gh-meta-text">
      <div class="gh-meta-val">${lastMeasuredStr}</div>
      <div class="gh-meta-label">Last measured</div>
    </div>
  </div>`;
  html += `<div class="gh-meta-pill">
    <span class="gh-meta-icon">${zi('list')}</span>
    <div class="gh-meta-text">
      <div class="gh-meta-val">${growthData.length}</div>
      <div class="gh-meta-label">Entries</div>
    </div>
  </div>`;
  html += '</div>';

  html += '</div>';
  el.innerHTML = html;
}

// ─────────────────────────────────────────
// MEDICAL TAB QUICK STATS
// ─────────────────────────────────────────
function renderMedicalStats() {
  const el = document.getElementById('medicalStats');
  if (!el) return;

  const pastVacc = vaccData.filter(v => !v.upcoming);
  const upcoming = vaccData.find(v => v.upcoming);
  const daysToVacc = upcoming ? Math.max(0, Math.ceil((new Date(upcoming.date) - new Date()) / 86400000)) : '—';
  const activeMeds = meds.filter(m => m.active);
  const totalVisits = visits.length;

  // Med adherence this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  let givenCount = 0, totalDays = 0;
  Object.entries(medChecks).forEach(([dateKey, val]) => {
    if (dateKey.startsWith('_') || typeof val !== 'object') return;
    if (new Date(dateKey) < weekAgo) return;
    totalDays++;
    Object.values(val).forEach(s => { if (s.startsWith('done')) givenCount++; });
  });

  el.innerHTML = `
    <div class="diet-stat ds-lav" data-scroll-to="medVaccCoverage" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-syringe"/></svg></div>
      <div class="diet-stat-val">${pastVacc.length}</div>
      <div class="diet-stat-label">Vaccinations done</div>
    </div>
    <div class="diet-stat ds-lav" data-scroll-to="vaccCountdown" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-hourglass"/></svg></div>
      <div class="diet-stat-val">${daysToVacc}</div>
      <div class="diet-stat-label">Days to next</div>
    </div>
    <div class="diet-stat ds-sky" data-scroll-to="medList" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-pill"/></svg></div>
      <div class="diet-stat-val">${activeMeds.length}</div>
      <div class="diet-stat-label">Active meds</div>
    </div>
    <div class="diet-stat ds-sage" data-scroll-to="medList" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-check"/></svg></div>
      <div class="diet-stat-val">${givenCount}/${totalDays > 0 ? totalDays : '—'}</div>
      <div class="diet-stat-label">Adherence this wk</div>
    </div>
    <div class="diet-stat ds-peach" data-scroll-to="visitList" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-steth"/></svg></div>
      <div class="diet-stat-val">${totalVisits}</div>
      <div class="diet-stat-label">Doctor visits</div>
    </div>
  `;
  renderDomainHero('medical');
}

// ─────────────────────────────────────────
// MEDICAL TAB — DYNAMIC CARD ORDERING & COLOUR
// ─────────────────────────────────────────
function orderMedicalCards() {
  const grid = document.getElementById('medicalGrid');
  if (!grid) return;

  const vaccCard = document.getElementById('medVaccCard');
  const medsCard = document.getElementById('medMedsCard');
  const visitsCard = document.getElementById('medVisitsCard');
  const coverageCard = document.getElementById('medVaccCoverage');
  // Hotfix (post-PR-9 surfacing) — `medStatsCard` was removed from
  // template.html in commit 16c644e (April 10 2026, "Phase 2: Bulk token
  // migration + remove empty stat card wrappers") and replaced with a
  // bare `#medicalStats` div. orderMedicalCards' getElementById was not
  // updated alongside, leaving statsCard always null. The unguarded
  // appendChild(null) at the bottom of this function threw TypeError on
  // every call. This bug has been latent for ~2 weeks; it surfaced in
  // production via the trace handleSwipe → switchTrackSub → orderMedicalCards.
  // Fix: null-guard each appendChild so removed/renamed cards become
  // ordering no-ops rather than fatal exceptions.
  const statsCard = document.getElementById('medStatsCard');

  // Calculate urgency scores
  const upcoming = vaccData.find(v => v.upcoming);
  const vaccDays = upcoming ? Math.ceil((new Date(upcoming.date) - new Date()) / 86400000) : 999;

  // Find next upcoming doctor visit
  const futureVisits = visits.filter(v => new Date(v.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextVisit = futureVisits[0];
  const visitDays = nextVisit ? Math.ceil((new Date(nextVisit.date) - new Date()) / 86400000) : 999;

  // Today's med status
  const todayKey = today();
  const activeMeds = meds.filter(m => m.active);
  const todayChecks = medChecks[todayKey] || {};
  const medsPending = activeMeds.filter(m => !todayChecks[m.name]).length;

  // Build ordered list: stats always first, then priority cards
  const cards = [];

  // Score each card (lower = higher priority)
  const vaccScore = vaccDays <= 0 ? -10 : vaccDays <= 2 ? -5 : vaccDays <= 7 ? 0 : vaccDays <= 14 ? 5 : 10;
  const medsScore = medsPending > 0 ? -3 : 3; // Daily meds always fairly high unless done
  const visitsScore = visitDays <= 1 ? -4 : visitDays <= 3 ? 1 : visitDays <= 7 ? 6 : 10;

  cards.push({ el: vaccCard, score: vaccScore, id: 'vacc' });
  cards.push({ el: medsCard, score: medsScore, id: 'meds' });
  cards.push({ el: coverageCard, score: 15, id: 'coverage' });
  cards.push({ el: visitsCard, score: visitsScore, id: 'visits' });

  // Sort by score (lowest first = highest priority)
  cards.sort((a, b) => a.score - b.score);

  // Remove any previously injected section labels
  grid.querySelectorAll('.med-section-label').forEach(el => el.remove());

  // Create section label elements
  function makeSectionLabel(text, tier) {
    const div = document.createElement('div');
    div.className = `home-section-label sec-t${tier||2} col-full med-section-label`;
    div.textContent = text;
    return div;
  }

  // Reorder DOM: stats first, then action label + action cards, then records label + info cards
  // Hotfix: filter out cards with null .el (removed/renamed elements; see
  // medStatsCard comment above) before classList queries so a missing card
  // doesn't propagate as TypeError.
  const livingCards = cards.filter(c => c.el && c.el.classList);
  const actionCards = livingCards.filter(c => c.el.classList.contains('card-action'));
  const infoCards = livingCards.filter(c => c.el.classList.contains('card-info'));

  if (statsCard) grid.appendChild(statsCard);

  if (actionCards.length > 0) {
    grid.appendChild(makeSectionLabel('Action Items', 1));
    actionCards.forEach(c => grid.appendChild(c.el));
  }

  if (infoCards.length > 0) {
    grid.appendChild(makeSectionLabel('Records', 3));
    infoCards.forEach(c => grid.appendChild(c.el));
  }

  // Colour-code vaccination card
  if (vaccCard) {
    const circle = document.getElementById('vaccCountdownCircle');
    const inner = document.getElementById('vaccCardInner');
    vaccCard.style.borderLeft = '4px solid transparent';

    if (vaccDays <= 0) {
      // Red — overdue
      vaccCard.style.borderLeft = '4px solid var(--tc-danger)';
      vaccCard.style.background = 'var(--surface-danger)';
      if (circle) circle.style.boxShadow = '0 4px 14px rgba(224,112,112,0.3)';
      if (inner) inner.style.background = 'linear-gradient(135deg, #fde8ed, #fff0f0)';
    } else if (vaccDays <= 2) {
      // Red — imminent
      vaccCard.style.borderLeft = '4px solid var(--tc-danger)';
      vaccCard.style.background = 'var(--surface-danger)';
      if (circle) circle.style.boxShadow = '0 4px 14px rgba(224,112,112,0.3)';
      if (inner) inner.style.background = 'linear-gradient(135deg, #fde8ed, #fff5f5)';
    } else if (vaccDays <= 7) {
      // Amber — soon
      vaccCard.style.borderLeft = '4px solid #ffc107';
      vaccCard.style.background = 'var(--surface-warn)';
      if (circle) circle.style.boxShadow = '0 4px 14px rgba(255,193,7,0.3)';
      if (inner) inner.style.background = 'var(--surface-warn-grad)';
    } else {
      // Blue — no worry
      vaccCard.style.borderLeft = '4px solid var(--sky)';
      vaccCard.style.background = 'var(--white)';
      if (circle) circle.style.boxShadow = '0 4px 14px rgba(201,184,232,0.3)';
      if (inner) inner.style.background = 'linear-gradient(135deg, var(--lav-light), var(--sky-light))';
    }
  }

  // Colour-code doctor visits card
  if (visitsCard) {
    visitsCard.style.borderLeft = '4px solid transparent';
    if (visitDays <= 0) {
      visitsCard.style.borderLeft = '4px solid var(--tc-danger)';
      visitsCard.style.background = 'var(--surface-danger)';
    } else if (visitDays <= 1) {
      visitsCard.style.borderLeft = '4px solid var(--tc-danger)';
      visitsCard.style.background = 'var(--surface-danger)';
    } else if (visitDays <= 3) {
      visitsCard.style.borderLeft = '4px solid #ffc107';
      visitsCard.style.background = 'var(--surface-warn)';
    } else {
      visitsCard.style.borderLeft = '4px solid var(--sage)';
      visitsCard.style.background = 'var(--white)';
    }
  }

  // Colour-code medications card
  if (medsCard) {
    medsCard.style.borderLeft = '4px solid transparent';
    if (medsPending > 0) {
      medsCard.style.borderLeft = '4px solid #ffc107';
      medsCard.style.background = 'var(--surface-neutral)';
    } else if (activeMeds.length > 0) {
      medsCard.style.borderLeft = '4px solid var(--sage)';
      medsCard.style.background = 'var(--white)';
    } else {
      medsCard.style.borderLeft = '4px solid var(--sky)';
      medsCard.style.background = 'var(--white)';
    }
  }
}

// ─────────────────────────────────────────
// VACCINATION
// ─────────────────────────────────────────
function getPrimaryDoctor() {
  return doctors.find(d => d.primary) || doctors[0] || null;
}


// ── Symptom Checker ──

// SYMPTOM_DB → migrated to data.js

const SYMPTOM_QUICK_CHIPS = ['Fever','Cough/Cold','Rash','Vomiting','Not eating','Teething','Constipation','Crying a lot','Fall/injury'];

function initSymptomChips() {
  const el = document.getElementById('symptomQuickChips');
  if (!el) return;
  el.innerHTML = SYMPTOM_QUICK_CHIPS.map(s =>
    '<span class="sc-quick-chip" onclick="document.getElementById(\'symptomInput\').value=\'' + s + '\';checkSymptoms()">' + s + '</span>'
  ).join('');
}

function checkSymptoms() {
  const input = document.getElementById('symptomInput');
  const query = (input?.value || '').trim().toLowerCase();
  if (!query) return;
  const resultEl = document.getElementById('symptomResult');
  if (!resultEl) return;

  const mo = getAgeInMonths();
  const matches = [];

  SYMPTOM_DB.forEach(function(entry) {
    var score = 0;
    entry.keywords.forEach(function(kw) {
      if (query.includes(kw.toLowerCase())) score += 2;
      // Partial match
      var words = kw.toLowerCase().split(' ');
      words.forEach(function(w) {
        if (w.length > 3 && query.includes(w)) score += 1;
      });
    });
    if (score > 0) {
      // Check condition function for severity upgrade
      var finalSeverity = entry.severity;
      if (entry.condition && entry.condition(query, mo)) {
        finalSeverity = 'emergency';
      }
      matches.push({ entry: entry, score: score, severity: finalSeverity });
    }
  });

  if (matches.length === 0) {
    resultEl.innerHTML = '<div class="sc-result sc-mild"><div class="sc-title">No matching symptoms found</div><div class="sc-section-body">Try describing what you\'re seeing differently, or check the quick chips above. If you\'re concerned about Ziva, always trust your instincts and call your paediatrician.</div>' + _scDoctorCardHTML(false) + '</div>';
    return;
  }

  // Sort: emergency first, then by score
  var SEV_RANK = { emergency: 0, warning: 1, mild: 2 };
  matches.sort(function(a, b) {
    return (SEV_RANK[a.severity] || 2) - (SEV_RANK[b.severity] || 2) || b.score - a.score;
  });

  // Show top 2 matches max
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

    html += '<div class="sc-section"><div class="sc-section-title">What to do</div>';
    html += '<div class="sc-section-body">' + escHtml(e.whatToDo) + '</div></div>';

    html += '<div class="sc-section"><div class="sc-section-title">Precautions</div>';
    html += '<div class="sc-section-body">' + escHtml(e.precautions) + '</div></div>';

    if (e.emergency) {
      html += '<div class="sc-section"><div class="sc-section-title" style="color:' + (m.severity === 'emergency' ? 'var(--tc-danger)' : 'var(--tc-caution)') + ';">' + zi('siren') + ' When to seek emergency care</div>';
      html += '<div class="sc-section-body fw-600" >' + escHtml(e.emergency) + '</div></div>';
    }
    html += '</div>';
  });

  // Show doctor contact if any match calls for it or is emergency
  if (hasEmergency || shown.some(function(m) { return m.entry.callDoctor; })) {
    html += _scDoctorCardHTML(hasEmergency);
  }

  // Track this fever CTA
  var isFeverMatch = shown.some(function(m) { return m.entry.id === 'fever-high' || m.entry.id === 'fever-mild'; });
  if (isFeverMatch && !getActiveFeverEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="promptFeverTrack" >'+zi('flame')+' Track this fever</button></div>';
  } else if (isFeverMatch && getActiveFeverEpisode()) {
    html += '<div class="fe-center-status">'+zi('flame')+' Fever episode already being tracked</div>';
  }

  var isDiarrhoeaMatch = shown.some(function(m) { return m.entry.id === 'diarrhoea'; });
  if (isDiarrhoeaMatch && !getActiveDiarrhoeaEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="promptDiarrhoeaTrack" >'+zi('diaper')+' Track this diarrhoea</button></div>';
  } else if (isDiarrhoeaMatch && getActiveDiarrhoeaEpisode()) {
    html += '<div class="fe-center-status">'+zi('diaper')+' Diarrhoea episode already being tracked</div>';
  }

  var isVomitMatch = shown.some(function(m) { return m.entry.id === 'vomiting'; });
  if (isVomitMatch && !getActiveVomitingEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="promptVomitingTrack" >'+zi('siren')+' Track this vomiting</button></div>';
  } else if (isVomitMatch && getActiveVomitingEpisode()) {
    html += '<div class="fe-center-status">'+zi('siren')+' Vomiting episode already being tracked</div>';
  }

  var isColdMatch = shown.some(function(m) { return m.entry.id === 'cough-cold'; });
  if (isColdMatch && !getActiveColdEpisode()) {
    html += '<div class="fe-center-action"><button class="btn btn-sage w-full" data-action="promptColdTrack" >'+zi('siren')+' Track this cold/cough</button></div>';
  } else if (isColdMatch && getActiveColdEpisode()) {
    html += '<div class="fe-center-status">'+zi('siren')+' Cold episode already being tracked</div>';
  }

  // Disclaimer
  html += '<div style="font-size:var(--fs-xs);color:var(--light);margin-top:10px;line-height:var(--lh-relaxed);font-style:italic;">This is guidance only, not medical advice. When in doubt, always call your paediatrician. Trust your instincts \u2014 you know Ziva best.</div>';

  resultEl.innerHTML = html;
}

function _scDoctorCardHTML(isEmergency) {
  var doc = getPrimaryDoctor();
  if (!doc) {
    return '<div class="sc-doctor-card"><span style="font-size:var(--fs-sm);color:var(--mid);">No doctor saved yet \u2014 </span><a href="#" onclick="event.preventDefault();openDoctorModal()" style="color:var(--tc-sage) !important;font-weight:600;">+ Add Doctor</a></div>';
  }
  var html = '<div class="sc-doctor-card">';
  html += '<div class="flex-1-min0">';
  html += '<div style="font-weight:700;color:var(--text);font-size:var(--fs-sm);">' + (isEmergency ? '\u{1F4DE} ' : '') + escHtml(doc.name) + (doc.title ? ' \u00B7 ' + escHtml(doc.title) : '') + '</div>';
  if (doc.phone) {
    html += '<a href="tel:' + doc.phone + '" style="font-size:var(--fs-md);display:inline-block;margin-top:4px;">' + (isEmergency ? '\u260E\uFE0F Call Now: ' : '\u260E\uFE0F ') + escHtml(doc.phoneDisplay || doc.phone) + '</a>';
  }
  if (doc.address) {
    html += '<div style="font-size:var(--fs-xs);color:var(--light);margin-top:2px;">' + escHtml(doc.address) + '</div>';
  }
  html += '</div>';
  if (doc.location) {
    html += '<a href="' + doc.location + '" target="_blank" rel="noopener" style="font-size:var(--fs-xl);text-decoration:none;">'+zi('target')+'</a>';
  }
  html += '</div>';
  return html;
}

function renderDoctorContact() {
  const card = document.getElementById('doctorContactCard');
  if (!card) return;
  save(KEYS.doctors, doctors);

  if (doctors.length === 0) {
    card.innerHTML = `
      <div class="fx-center fx-between py-4">
        <div class="t-sub-light">No doctors added yet</div>
        <button class="btn btn-sage" data-action="openDoctorModal">+ Add Doctor</button>
      </div>`;
    return;
  }

  let html = '';
  doctors.forEach((doc, i) => {
    html += `
      <div style="${i > 0 ? 'margin-top:10px;padding-top:10px;border-top:1px solid rgba(181,213,197,0.2);' : ''}">
        <div class="fx-start g8">
          <div style="width:36px;height:36px;border-radius:50%;background:${doc.primary ? 'var(--sage-light)' : 'var(--warm)'};display:flex;align-items:center;justify-content:center;font-size:var(--icon-base);flex-shrink:0;margin-top:2px;">🩺</div>
          <div class="flex-1-min">
            <div class="t-title">${escHtml(doc.name)} ${doc.primary ? '<span class="badge-sm" style="background:var(--sage-light);color:var(--tc-sage);">Primary</span>' : ''}</div>
            <div class="t-sub mt-2">${escHtml(doc.title || '')}</div>
            ${doc.phoneDisplay ? `<div class="t-sub mt-4"><a href="tel:${doc.phone}" style="color:var(--mid);text-decoration:none;">${zi('info')} ${escHtml(doc.phoneDisplay)}</a></div>` : ''}
            ${doc.address ? `<div class="t-sub" style="margin-top:3px;">${doc.location ? `<a href="${doc.location}" target="_blank" rel="noopener" style="color:var(--mid);text-decoration:none;">${zi('target')} ${escHtml(doc.address)}</a>` : `${zi('target')} ${escHtml(doc.address)}`}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:var(--sp-8);align-items:center;margin-top:8px;padding-left:46px;">
          ${doc.phone ? `<a href="tel:${doc.phone}" class="doctor-cta-call">${zi('info')} Call</a>` : ''}
          ${doc.location ? `<a href="${doc.location}" target="_blank" rel="noopener" class="doctor-cta-map">${zi('target')} Map</a>` : ''}
          <div style="margin-left:auto;display:flex;gap:var(--sp-4);">
            <button class="note-btn" data-action="editDoctor" data-arg="${i}" aria-label="Edit doctor">Edit</button>
            <button class="note-btn del-note-btn" data-action="deleteDoctor" data-arg="${i}" aria-label="Remove doctor">&times;</button>
          </div>
        </div>
      </div>`;
  });

  html += `<div style="margin-top:10px;display:flex;justify-content:flex-end;">
    <button class="btn btn-sage" data-action="openDoctorModal">+ Add Doctor</button>
  </div>`;

  card.innerHTML = html;
}

let _doctorEditIdx = null;

function openDoctorModal() {
  _doctorEditIdx = null;
  document.getElementById('doctorModalTitle').textContent = '🩺 Add Doctor';
  document.getElementById('docName').value = '';
  document.getElementById('docTitle').value = '';
  document.getElementById('docPhone').value = '';
  document.getElementById('docAddress').value = '';
  document.getElementById('docLocation').value = '';
  document.getElementById('docPrimary').checked = doctors.length === 0;
  document.getElementById('doctorSaveBtn').textContent = 'Save';
  activateBtn('doctorSaveBtn', false);
  openModal('doctorModal');
}

function editDoctor(i) {
  const doc = doctors[i];
  if (!doc) return;
  _doctorEditIdx = i;
  document.getElementById('doctorModalTitle').textContent = '🩺 Edit Doctor';
  document.getElementById('docName').value = doc.name || '';
  document.getElementById('docTitle').value = doc.title || '';
  document.getElementById('docPhone').value = doc.phone || '';
  document.getElementById('docAddress').value = doc.address || '';
  document.getElementById('docLocation').value = doc.location || '';
  document.getElementById('docPrimary').checked = !!doc.primary;
  document.getElementById('doctorSaveBtn').textContent = 'Update';
  activateBtn('doctorSaveBtn', true);
  openModal('doctorModal');
}

function saveDoctor() {
  const name = document.getElementById('docName').value.trim();
  if (!name) return;
  const phone = document.getElementById('docPhone').value.trim();
  const isPrimary = document.getElementById('docPrimary').checked;

  if (isPrimary) doctors.forEach(d => d.primary = false);

  const docData = {
    name,
    title: document.getElementById('docTitle').value.trim(),
    phone: phone,
    phoneDisplay: phone ? phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 $2 $3') : '',
    address: document.getElementById('docAddress').value.trim(),
    location: document.getElementById('docLocation').value.trim(),
    primary: isPrimary || doctors.length === 0,
  };

  if (_doctorEditIdx !== null) {
    // Preserve primary status if not changing it
    if (!isPrimary && doctors[_doctorEditIdx].primary) docData.primary = true;
    doctors[_doctorEditIdx] = docData;
  } else {
    doctors.push(docData);
  }

  _doctorEditIdx = null;
  closeModal('doctorModal');
  renderDoctorContact();
}

function deleteDoctor(i) {
  const wasPrimary = doctors[i].primary;
  confirmAction(`Remove ${doctors[i].name}?`, () => {
    doctors.splice(i, 1);
    if (wasPrimary && doctors.length > 0) doctors[0].primary = true;
    renderDoctorContact();
  });
}

function renderVacc() {
  save(KEYS.vacc, vaccData);
  const today_d = new Date();

  // Restore original DOM structure (hide overlay, show original)
  const origContent = document.getElementById('vaccOriginalContent');
  const overlay = document.getElementById('vaccCompletionOverlay');
  if (origContent) origContent.style.display = '';
  if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; }

  // Find upcoming
  const upcomingAll = vaccData.filter(v => v.upcoming).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const upcoming = upcomingAll[0];
  if (upcoming) {
    const days = Math.ceil((new Date(upcoming.date) - today_d) / 86400000);
    const safeD = Math.max(0, days);

    // ── Completion prompt when daysTo <= 0 ──
    if (days <= 0) {
      // Group all due on same date
      const dueOnDate = upcomingAll.filter(v => v.date === upcoming.date);
      const allDismissed = dueOnDate.every(v => _vaccCompletionDismissed.has(v.name));
      if (!allDismissed) {
        if (origContent) origContent.style.display = 'none';
        if (overlay) {
          overlay.innerHTML = _vaccRenderCompletionCard(dueOnDate);
          overlay.style.display = '';
        }
        document.getElementById('vaccInfoPanel').style.display = 'none';
        var _prepEl = document.getElementById('vaccPrepCard');
        if (_prepEl) _prepEl.innerHTML = '';
        renderHomeVacc();
        return;
      }
      // All dismissed — fall through to show next non-dismissed upcoming
      const nextAfter = upcomingAll.find(v => v.date !== upcoming.date);
      if (nextAfter) {
        const d2 = Math.ceil((new Date(nextAfter.date) - today_d) / 86400000);
        const sd2 = Math.max(0, d2);
        document.getElementById('vaccCountdown').textContent = sd2;
        document.getElementById('vaccNextDate').textContent = 'Due: ' + formatDate(nextAfter.date);
        document.getElementById('vaccNextName').textContent = nextAfter.name;
        _vaccRenderPrepCard();
        renderHomeVacc();
        return;
      }
    }

    document.getElementById('vaccCountdown').textContent = safeD;
    document.getElementById('vaccNextDate').textContent = 'Due: ' + formatDate(upcoming.date);
    document.getElementById('vaccNextName').textContent = upcoming.name;
    document.getElementById('vaccNameTapHint').style.display = '';
    const editBtn = document.getElementById('vaccUpcomingEditBtn');
    if (editBtn) editBtn.style.display = '';
    // Render the info panel content (hidden until tapped)
    renderVaccInfoPanel(upcoming.name);
    renderHomeVacc();
    _vaccRenderPrepCard();
    const hvd = document.getElementById('homeVaccDays');
    if (hvd) hvd.textContent = safeD;

    // Show booking status on Medical tab
    const bsEl = document.getElementById('vaccBookingStatus');
    if (bsEl) {
      const bookedData = load(KEYS.vaccBooked, null);
      const isBooked = bookedData && bookedData.vaccName === upcoming.name;
      if (isBooked) {
        const apptLabel = getVaccApptLabel(bookedData);
        if (apptLabel) {
          bsEl.innerHTML = `<div class="vc-booked-pill" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}">
            <span class="status-good-xs"><span class="zi-check-placeholder"></span> Booked</span>
            <span class="vc-booked-detail">${apptLabel}</span>
          </div>`;
        } else {
          bsEl.innerHTML = `<div class="vc-booked-pill" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}">
            <span class="status-good-xs"><span class="zi-check-placeholder"></span> Booked</span>
            <span class="vc-booked-detail-light">Tap to add date & time</span>
          </div>`;
        }
        bsEl.style.display = '';
      } else {
        if (safeD <= 14) {
          bsEl.innerHTML = `<button class="btn btn-sage vc-book-btn" data-action="markVaccBooked" data-arg="${escAttr(upcoming.name)}">${zi('clock')} Book appointment</button>`;
          bsEl.style.display = '';
        } else {
          bsEl.style.display = 'none';
        }
      }
    }
  } else {
    document.getElementById('vaccCountdown').textContent = '\u2014';
    document.getElementById('vaccNextDate').textContent = 'No upcoming vaccination set';
    document.getElementById('vaccNextName').textContent = '';
    document.getElementById('vaccNameTapHint').style.display = 'none';
    document.getElementById('vaccInfoPanel').style.display = 'none';
    const editBtn = document.getElementById('vaccUpcomingEditBtn');
    if (editBtn) editBtn.style.display = 'none';
    var prepEl = document.getElementById('vaccPrepCard');
    if (prepEl) prepEl.innerHTML = '';
  }
}

// ── Vaccination Info Panel ──
// VACC_GUIDANCE → migrated to data.js

function getVaccGuidance(vaccName) {
  const lower = vaccName.toLowerCase();
  // Match to the most specific guidance
  for (const [key, guidance] of Object.entries(VACC_GUIDANCE)) {
    if (key === '_default') continue;
    if (lower.includes(key)) return { ...VACC_GUIDANCE._default, ...guidance };
  }
  return VACC_GUIDANCE._default;
}
// @@INSERT_DATA_BLOCK_6@@

function _vaccFamilyKey(vaccName) {
  const cleaned = vaccName.replace(/[-\u2013]\d+$/,'').trim();
  for (const family of Object.keys(VACC_SERIES)) {
    if (cleaned.toLowerCase().includes(family.toLowerCase())) return family;
  }
  return cleaned;
}

// ── Step 11: Series history lookup ──
function _getVaccSeriesHistory(vaccName) {
  const family = _vaccFamilyKey(vaccName);
  const seriesNames = VACC_SERIES[family];
  if (!seriesNames) return [];
  const normSet = new Set(seriesNames.map(function(n) { return n.toLowerCase(); }));
  return vaccData
    .filter(function(v) { return !v.upcoming && normSet.has(v.name.toLowerCase()); })
    .sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
}

// ── Step 12: Reaction pattern trend ──
const _VACC_SEV_SCORE = { none: 0, mild: 1, moderate: 2, severe: 3 };

function _vaccReactionTrend(history) {
  var withReaction = history.filter(function(v) { return v.reaction; });
  if (withReaction.length < 2) return { trend: 'insufficient', label: 'Not enough data' };
  var scores = withReaction.map(function(v) { return _VACC_SEV_SCORE[v.reaction] || 0; });
  // Simple linear slope
  var n = scores.length;
  var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (var i = 0; i < n; i++) {
    sumX += i; sumY += scores[i]; sumXY += i * scores[i]; sumXX += i * i;
  }
  var slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  if (slope < -0.15) return { trend: 'decreasing', label: 'Reactions decreasing over doses' };
  if (slope > 0.15) return { trend: 'increasing', label: 'Reactions increasing over doses' };
  return { trend: 'stable', label: 'Reactions consistent across doses' };
}

function _vaccPatternSummary(vaccName) {
  var history = _getVaccSeriesHistory(vaccName);
  if (history.length === 0) return null;
  var withReaction = history.filter(function(v) { return v.reaction; });
  if (withReaction.length === 0) return null;
  var trend = _vaccReactionTrend(history);
  var family = _vaccFamilyKey(vaccName);
  // Check if any entries were from multi-vaccine visits
  var hasMultiVisit = withReaction.some(function(v) {
    return vaccData.filter(function(o) { return o.visitGroup && o.visitGroup === v.visitGroup && o.name !== v.name; }).length > 0;
  });
  return { history: withReaction, trend: trend, family: family, hasMultiVisit: hasMultiVisit };
}

// ── Step 15: Post-vaccination correlation via ISL ──
function _vaccPostCorrelation(vaccDate) {
  try {
    var nextDay = _offsetDateStr(vaccDate, 1);
    var postSleep = getDomainData('sleep', vaccDate, nextDay);
    var postDiet = getDomainData('diet', vaccDate, nextDay);
    var preStart = _offsetDateStr(vaccDate, -7);
    var preEnd = _offsetDateStr(vaccDate, -1);
    var preSleep = getDomainData('sleep', preStart, preEnd);
    var preDiet = getDomainData('diet', preStart, preEnd);
    var sleepDelta = (postSleep.avgNightMin || 0) - (preSleep.avgNightMin || 0);
    var feedDelta = (postDiet.avgIntake !== null ? postDiet.avgIntake : 0) - (preDiet.avgIntake !== null ? preDiet.avgIntake : 0);
    var hasData = (postSleep.daysWithData > 0 || postDiet.daysWithData > 0) && (preSleep.daysWithData > 0 || preDiet.daysWithData > 0);
    return { sleepDelta: sleepDelta, feedDelta: feedDelta, hasData: hasData };
  } catch(e) { return { sleepDelta: 0, feedDelta: 0, hasData: false }; }
}
// @@INSERT_DATA_BLOCK_7@@

// ── Session dismissal tracking ──
let _vaccCompletionDismissed = new Set();

// ── Post-vacc window cache (reset per render cycle) ──
let _postVaccCached = null;

function _isPostVaccWindow() {
  if (_postVaccCached !== null) return _postVaccCached;
  const todayStr = today();
  const yesterdayStr = _offsetDateStr(todayStr, -1);
  _postVaccCached = vaccData.some(v =>
    !v.upcoming && (v.date === todayStr || v.date === yesterdayStr)
  );
  return _postVaccCached;
}

// ── Smart Completion Flow ──

function _vaccGetDueGroups() {
  const todayD = new Date();
  const upcomingAll = vaccData.filter(v => v.upcoming);
  const groups = {};
  upcomingAll.forEach(v => {
    const days = Math.ceil((new Date(v.date) - todayD) / 86400000);
    if (days <= 0) {
      const key = v.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
  });
  return groups;
}

function _vaccRenderCompletionCard(dueVaccines) {
  const todayStr = today();
  const dueDate = dueVaccines[0].date;
  // Use string comparison for same-day check, floor for past days
  const dueLabel = dueDate >= todayStr ? 'Due today' : (function() {
    const d = Math.floor((new Date(todayStr) - new Date(dueDate)) / 86400000);
    return d === 1 ? 'Due yesterday' : d + ' days overdue';
  })();

  if (dueVaccines.length === 1) {
    const v = dueVaccines[0];
    return `<div class="vc-complete-card">
      <div class="vc-complete-prompt">
        <div class="vc-complete-title">${zi('syringe')} ${escHtml(v.name)}</div>
        <div class="t-sub">${dueLabel} &middot; ${formatDate(dueDate)}</div>
        <div class="vc-complete-q">Was the vaccination given?</div>
      </div>
      <div class="vc-complete-actions">
        <button class="btn btn-sage" data-action="vaccMarkDone" data-arg="${escAttr(v.name)}" data-arg2="${escAttr(dueDate)}">Yes, done today</button>
        <button class="btn btn-ghost" data-action="vaccShowDelay" data-arg="${escAttr(dueDate)}">Not yet</button>
      </div>
    </div>`;
  }

  // Multi-vaccine day — checkbox card
  let checks = '';
  dueVaccines.forEach(v => {
    const idx = vaccData.indexOf(v);
    checks += `<label class="vc-complete-check checked" data-vacc-idx="${idx}">
      <input type="checkbox" checked class="vc-check-input"> ${escHtml(v.name)}
    </label>`;
  });
  return `<div class="vc-complete-card vc-complete-multi">
    <div class="vc-complete-prompt">
      <div class="vc-complete-title">${zi('syringe')} ${dueVaccines.length} vaccinations ${dueLabel.toLowerCase()}</div>
      <div class="t-sub">${formatDate(dueDate)}</div>
      <div class="vc-complete-q">Which were given?</div>
      <div class="vc-complete-checks">${checks}</div>
    </div>
    <div class="vc-complete-actions">
      <button class="btn btn-sage" data-action="vaccMarkDoneMulti" data-arg="${escAttr(dueDate)}">Mark selected as done</button>
      <button class="btn btn-ghost" data-action="vaccShowDelay" data-arg="${escAttr(dueDate)}">None given yet</button>
    </div>
  </div>`;
}

function _vaccMarkDone(vaccNames, dueDate) {
  const todayStr = today();
  const doneNames = [];
  vaccNames.forEach(name => {
    const v = vaccData.find(e => e.upcoming && e.name === name);
    if (!v) return;
    v.scheduledDate = v.scheduledDate || v.date;
    v.date = todayStr;
    v.upcoming = false;
    v.visitGroup = todayStr;
    doneNames.push(name);
  });
  // Clear booked appointment if matches any
  const bookedData = load(KEYS.vaccBooked, null);
  if (bookedData && doneNames.includes(bookedData.vaccName)) {
    save(KEYS.vaccBooked, null);
  }
  save(KEYS.vacc, vaccData);
  _islMarkDirty('medical');
  _postVaccCached = null;
  // Re-render to update Medical tab under the modal
  renderVacc();
  renderVaccCoverage();
  renderVaccPastList();
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  updateHeader();
  // Open reaction modal
  _vaccOpenReactionModal(doneNames);
}

function _vaccRenderDelayCard(dueDate) {
  const dueVaccines = vaccData.filter(v => v.upcoming && v.date === dueDate);
  if (!dueVaccines.length) return '';
  const names = dueVaccines.map(v => escHtml(v.name)).join(', ');
  const defaultNew = _offsetDateStr(dueDate, 7);

  // Find most restrictive safety window
  let minSafe = 999;
  let mostRestrictiveFamily = '_default';
  dueVaccines.forEach(v => {
    const fam = _vaccFamilyKey(v.name);
    const safety = VACC_DELAY_SAFETY[fam] || VACC_DELAY_SAFETY._default;
    if (safety.safe < minSafe) {
      minSafe = safety.safe;
      mostRestrictiveFamily = fam;
    }
  });

  const chips = [
    { id: 'baby_unwell', label: 'Baby was unwell' },
    { id: 'rescheduled', label: 'Rescheduled' },
    { id: 'doctor_advised', label: 'Doctor advised delay' },
    { id: 'other', label: 'Other' },
  ];
  let chipHtml = chips.map(c =>
    `<button class="vc-delay-chip" data-action="vaccDelayReason" data-arg="${c.id}">${c.label}</button>`
  ).join('');

  return `<div class="vc-delay-card" id="vaccDelayCard">
    <div class="vc-complete-title">${zi('syringe')} ${dueVaccines.length > 1 ? dueVaccines.length + ' vaccinations' : escHtml(dueVaccines[0].name)}</div>
    <div class="t-sub mb-8">${formatDate(dueDate)}</div>
    <div class="vc-delay-q">Why ${dueVaccines.length > 1 ? "weren't these" : "wasn't it"} given?</div>
    <div class="vc-delay-reasons">${chipHtml}</div>
    <label class="micro-label mt-10">New date</label>
    <input type="date" class="modal-input" id="vaccDelayDateInput" value="${defaultNew}">
    <div id="vaccDelayAssessment" class="mt-8"></div>
    <div class="vc-complete-actions mt-10">
      <button class="btn btn-lav" data-action="vaccSaveDelay" data-arg="${escAttr(dueDate)}">Save${dueVaccines.length > 1 ? ' for all ' + dueVaccines.length : ''}</button>
      <button class="btn btn-ghost" data-action="vaccCancelDelay">Cancel</button>
    </div>
  </div>`;
}

function _vaccUpdateDelayAssessment(dueDate) {
  const el = document.getElementById('vaccDelayAssessment');
  const dateInput = document.getElementById('vaccDelayDateInput');
  if (!el || !dateInput) return;
  const newDate = dateInput.value;
  if (!newDate) { el.innerHTML = ''; return; }

  const dueVaccines = vaccData.filter(v => v.upcoming && v.date === dueDate);
  // Use scheduled date (first scheduled) for delay calculation
  const scheduledDate = dueVaccines[0]?.scheduledDate || dueDate;
  const delayDays = Math.round((new Date(newDate).getTime() - new Date(scheduledDate).getTime()) / 86400000);

  if (delayDays <= 0) { el.innerHTML = ''; return; }

  // Most restrictive safety window
  let minSafe = 999, minConcern = 999, bestNote = '';
  dueVaccines.forEach(v => {
    const fam = _vaccFamilyKey(v.name);
    const safety = VACC_DELAY_SAFETY[fam] || VACC_DELAY_SAFETY._default;
    if (safety.safe < minSafe) {
      minSafe = safety.safe;
      minConcern = safety.concern;
      bestNote = safety.note;
    }
  });

  let statusClass, statusIcon, statusMsg;
  if (delayDays <= minSafe) {
    statusClass = 'vc-assess-safe';
    statusIcon = zi('check');
    statusMsg = 'Within safe delay window (up to ' + minSafe + ' days)';
  } else if (delayDays <= minConcern) {
    statusClass = 'vc-assess-warn';
    statusIcon = zi('warn');
    statusMsg = 'Approaching recommended limit \u2014 schedule soon';
  } else {
    statusClass = 'vc-assess-danger';
    statusIcon = zi('warn');
    statusMsg = 'Beyond recommended delay \u2014 consult pediatrician';
  }

  el.innerHTML = `<div class="vc-delay-assessment ${statusClass}">
    <div class="vc-assess-header">${statusIcon} <span>${statusMsg}</span></div>
    <div class="t-sub">Scheduled: ${formatDate(scheduledDate)} &middot; New: ${formatDate(newDate)} &middot; Delay: ${delayDays} days</div>
    <div class="t-sub mt-4">${escHtml(bestNote)}</div>
  </div>`;
}

let _vaccDelayReason = '';

function _vaccSaveDelay(dueDate) {
  const dateInput = document.getElementById('vaccDelayDateInput');
  if (!dateInput || !dateInput.value) return;
  const newDate = dateInput.value;
  const dueVaccines = vaccData.filter(v => v.upcoming && v.date === dueDate);
  dueVaccines.forEach(v => {
    v.scheduledDate = v.scheduledDate || v.date;
    v.date = newDate;
    if (_vaccDelayReason) v.delayReason = _vaccDelayReason;
  });
  _vaccDelayReason = '';
  save(KEYS.vacc, vaccData);
  _islMarkDirty('medical');
  renderVacc();
  renderVaccCoverage();
  renderVaccPastList();
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  updateHeader();
}

// ── Reaction Logging Modal ──

function _vaccOpenReactionModal(vaccNames) {
  if (!vaccNames || !vaccNames.length) return;
  const modal = document.getElementById('vaccReactionModal');
  if (!modal) return;
  const content = document.getElementById('vaccReactionContent');
  if (!content) return;

  const namesLabel = vaccNames.length === 1 ? escHtml(vaccNames[0]) : vaccNames.length + ' vaccinations';
  const namesList = vaccNames.length > 1 ? '<div class="t-sub mt-4">' + vaccNames.map(n => escHtml(n)).join(', ') + '</div>' : '';
  const todayStr = today();

  let symptomChips = VACC_REACTION_SYMPTOMS.map(s =>
    `<button class="vc-symptom-chip" data-symptom="${s.id}" data-action="vaccToggleSymptom">${zi(s.icon)} ${s.label}</button>`
  ).join('');

  const tempChips = ['Normal','99-100\u00b0F','100-101\u00b0F','101+\u00b0F'].map(t =>
    `<button class="vc-temp-chip" data-action="vaccSelectTemp" data-arg="${t}">${t}</button>`
  ).join('');

  const cryChips = ['< 30 min','30 min-1 hr','1-2 hrs','2+ hrs'].map(c =>
    `<button class="vc-cry-chip" data-action="vaccSelectCry" data-arg="${c}">${c}</button>`
  ).join('');

  content.innerHTML = `<div class="vc-reaction-form" data-vacc-names="${escAttr(JSON.stringify(vaccNames))}">
    <h3 class="modal-title">How is Ziva after ${namesLabel}?</h3>
    ${namesList}
    <div class="t-sub mb-10">Given today &middot; ${formatDate(todayStr)}</div>

    <div class="micro-label">Reaction</div>
    <div class="vc-reaction-severity">
      <button class="vc-severity-chip" data-action="vaccSelectSeverity" data-arg="none">None</button>
      <button class="vc-severity-chip" data-action="vaccSelectSeverity" data-arg="mild">Mild</button>
      <button class="vc-severity-chip" data-action="vaccSelectSeverity" data-arg="moderate">Moderate</button>
      <button class="vc-severity-chip" data-action="vaccSelectSeverity" data-arg="severe">Severe</button>
    </div>

    <div id="vaccReactionDetails" class="vc-reaction-details vc-hidden">
      <div class="micro-label mt-10">What are you seeing?</div>
      <div class="vc-symptom-chips">${symptomChips}</div>
      <div id="vaccSevereAlert" class="vc-severe-alert vc-hidden">
        <div class="vc-severe-msg">${zi('siren')} If baby is inconsolable, has high fever (102\u00b0F+), seizures, or difficulty breathing, seek emergency care immediately.</div>
      </div>
      <div class="micro-label mt-10">Temperature</div>
      <div class="vc-temp-row">${tempChips}</div>
      <div class="micro-label mt-10">How long did crying last?</div>
      <div class="vc-cry-row">${cryChips}</div>
      <div class="micro-label mt-10">Notes</div>
      <textarea id="vaccReactionNotes" class="modal-input vc-reaction-notes" rows="2" placeholder="Any additional observations..."></textarea>
    </div>

    <div id="vaccReactionSaveWrap" class="vc-hidden mt-10">
      <button class="btn btn-lav" data-action="vaccSaveReaction" id="vaccReactionSaveBtn">Save Reaction Log</button>
    </div>
  </div>`;
  openModal('vaccReactionModal');
}

function _vaccHandleSeverity(severity) {
  const detailsEl = document.getElementById('vaccReactionDetails');
  const saveWrap = document.getElementById('vaccReactionSaveWrap');
  const severeAlert = document.getElementById('vaccSevereAlert');
  const chips = document.querySelectorAll('.vc-severity-chip');
  chips.forEach(c => c.classList.toggle('active', c.dataset.arg === severity));

  if (severity === 'none') {
    if (detailsEl) detailsEl.classList.add('vc-hidden');
    if (saveWrap) saveWrap.classList.remove('vc-hidden');
    if (severeAlert) severeAlert.classList.add('vc-hidden');
  } else {
    if (detailsEl) detailsEl.classList.remove('vc-hidden');
    if (saveWrap) saveWrap.classList.remove('vc-hidden');
    if (severeAlert) severeAlert.classList.toggle('vc-hidden', severity !== 'severe');
  }
}

function _vaccToggleSymptom(btn) {
  btn.classList.toggle('active');
  // Clear validation outline if any symptom is now selected
  const section = btn.closest('.vc-symptom-chips');
  if (section) section.style.outline = '';
}

function _vaccSelectChip(btn, groupClass) {
  const row = btn.closest('.' + groupClass.replace('-chip','') + '-row') || btn.parentElement;
  row.querySelectorAll('.' + groupClass).forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function _vaccSaveReaction() {
  const form = document.querySelector('.vc-reaction-form');
  if (!form) return;
  const vaccNames = JSON.parse(form.dataset.vaccNames || '[]');
  const activeSev = form.querySelector('.vc-severity-chip.active');
  if (!activeSev) return;
  const severity = activeSev.dataset.arg;

  let symptoms = [], temperature = null, cryDuration = null, notes = '';
  if (severity !== 'none') {
    const activeSymptoms = form.querySelectorAll('.vc-symptom-chip.active');
    if (activeSymptoms.length === 0) {
      // Require at least 1 symptom for non-none
      const symptomSection = form.querySelector('.vc-symptom-chips');
      if (symptomSection) symptomSection.style.outline = '2px solid var(--tc-danger)';
      return;
    }
    activeSymptoms.forEach(s => symptoms.push(s.dataset.symptom));
    const activeTemp = form.querySelector('.vc-temp-chip.active');
    if (activeTemp) temperature = activeTemp.dataset.arg;
    const activeCry = form.querySelector('.vc-cry-chip.active');
    if (activeCry) cryDuration = activeCry.dataset.arg;
    const notesEl = document.getElementById('vaccReactionNotes');
    if (notesEl) notes = notesEl.value.trim();
  }

  // Save on matching entries
  const todayStr = today();
  const yesterdayStr = _offsetDateStr(todayStr, -1);
  const editIdx = form.dataset.editIdx ? parseInt(form.dataset.editIdx) : null;

  if (editIdx !== null && vaccData[editIdx]) {
    // Direct edit of a specific entry (from past list / timeline tap)
    const v = vaccData[editIdx];
    v.reaction = severity;
    v.symptoms = symptoms;
    if (temperature) v.temperature = temperature;
    if (cryDuration) v.cryDuration = cryDuration;
    if (notes) v.reactionNotes = notes;
    v.reactionLoggedAt = new Date().toISOString();
  } else {
    // Standard save: today/yesterday entries (post-completion flow)
    vaccNames.forEach(name => {
      const v = vaccData.find(e => e.name === name && !e.upcoming &&
        (e.date === todayStr || e.date === yesterdayStr || e.visitGroup === todayStr || e.visitGroup === yesterdayStr));
      if (v) {
        v.reaction = severity;
        v.symptoms = symptoms;
        if (temperature) v.temperature = temperature;
        if (cryDuration) v.cryDuration = cryDuration;
        if (notes) v.reactionNotes = notes;
        v.reactionLoggedAt = new Date().toISOString();
      }
    });
  }
  save(KEYS.vacc, vaccData);
  _islMarkDirty('medical');

  // Show post-save guidance
  _vaccShowGuidance(vaccNames, severity);
}

function _vaccShowGuidance(vaccNames, severity) {
  const content = document.getElementById('vaccReactionContent');
  if (!content) return;

  // Get family-specific guidance (use first vaccine for family)
  const family = _vaccFamilyKey(vaccNames[0]);
  const familyG = VACC_REACTION_GUIDANCE[family] || {};
  const defaultG = VACC_REACTION_GUIDANCE._default;
  const merged = { ...defaultG, ...familyG };

  const mainText = merged[severity] || merged.mild || '';
  const callDoc = merged.callDoctor || defaultG.callDoctor || '';
  const noteText = merged.note || '';
  const namesLabel = vaccNames.length === 1 ? escHtml(vaccNames[0]) : vaccNames.map(n => escHtml(n)).join(', ');

  content.innerHTML = `<div class="vc-guidance-card">
    <h3 class="modal-title">${zi('check')} Reaction logged</h3>
    <div class="t-sub mb-10">${namesLabel}</div>
    <div class="vc-guidance-section">
      <div class="micro-label">What to expect</div>
      <div class="vc-guidance-text">${escHtml(mainText)}</div>
    </div>
    ${severity !== 'none' ? `<div class="vc-guidance-section vc-guidance-warn">
      <div class="micro-label">${zi('warn')} Call doctor if</div>
      <div class="vc-guidance-text">${escHtml(callDoc)}</div>
    </div>` : ''}
    ${noteText ? `<div class="vc-guidance-section"><div class="t-sub">${escHtml(noteText)}</div></div>` : ''}
    <button class="btn btn-ghost mt-10" data-action="vaccCloseGuidance">Close</button>
  </div>`;

  // Re-render everything
  renderVacc();
  renderVaccCoverage();
  renderVaccPastList();
  renderMedicalStats();
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  updateHeader();
}

function renderVaccInfoPanel(vaccName) {
  const panel = document.getElementById('vaccInfoPanel');
  if (!panel) return;

  // Look up schedule info
  const schedInfo = VACC_SCHEDULE.find(s => normVacc(s.name) === normVacc(vaccName));
  const guidance = getVaccGuidance(vaccName);

  let html = `<div style="padding:14px;border-radius:var(--r-xl);background:linear-gradient(135deg,var(--lav-light),var(--lav-light));border:1.5px solid rgba(110,94,154,0.15);margin-top:10px;">`;

  // Protects against
  if (schedInfo) {
    html += `<div class="fx-start g8 mb-8">
      <span class="t-icon shrink-0">${zi('shield')}</span>
      <div>
        <div class="t-title">Protects against</div>
        <div class="t-sub" style="font-size:var(--fs-base);margin-top:2px;">${escHtml(schedInfo.protects)}</div>
      </div>
    </div>`;
    html += `<div class="fx-start g8 mb-8">
      <span class="t-icon shrink-0">${zi('clock')}</span>
      <div>
        <div class="t-title">Typically given</div>
        <div class="t-sub" style="font-size:var(--fs-base);margin-top:2px;">${escHtml(schedInfo.age)} · ${escHtml(schedInfo.notes)}</div>
      </div>
    </div>`;
  }

  // Note
  if (guidance.note) {
    html += `<div class="fx-start g8 mb-8">
      <span class="t-icon shrink-0">${zi('bulb')}</span>
      <div style="font-size:var(--fs-base);color:var(--mid);line-height:var(--lh-relaxed);">${escHtml(guidance.note)}</div>
    </div>`;
  }

  // Dos
  if (guidance.dos && guidance.dos.length > 0) {
    html += `<div class="mb-8">
      <div class="guidance-section-title-do"><span class="zi-check-placeholder"></span> Do</div>
      ${guidance.dos.map(d => `<div class="guidance-bullet"><span class="guidance-bullet-marker">·</span>${escHtml(d)}</div>`).join('')}
    </div>`;
  }

  // Don'ts
  if (guidance.donts && guidance.donts.length > 0) {
    html += `<div class="mb-8">
      <div class="guidance-section-title-dont"><span class="zi-warn-placeholder"></span> Don't</div>
      ${guidance.donts.map(d => `<div class="guidance-bullet"><span class="guidance-bullet-marker">·</span>${escHtml(d)}</div>`).join('')}
    </div>`;
  }

  // When to call
  if (guidance.whenToCall) {
    const doc = getPrimaryDoctor();
    html += `<div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--glass-strong);border-left:var(--accent-w) solid var(--tc-caution);">
      <span class="t-icon shrink-0">${zi('info')}</span>
      <div class="flex-1">
        <div style="font-size:var(--fs-sm);color:var(--mid);line-height:var(--lh-relaxed);">${escHtml(guidance.whenToCall)}</div>
        ${doc && doc.phone ? `<a href="tel:${doc.phone}" style="display:inline-flex;align-items:center;gap:var(--sp-8);margin-top:6px;padding:6px 14px;border-radius:var(--r-xl);background:var(--tc-sage);color:white;text-decoration:none;font-size:var(--fs-base);font-weight:700;font-family:'Nunito',sans-serif;">
          ${zi('info')} Call ${escHtml(doc.name)}
        </a>` : ''}
      </div>
    </div>`;
  }

  html += `</div>`;
  panel.innerHTML = html;
}

function toggleVaccInfo() {
  const panel = document.getElementById('vaccInfoPanel');
  const hint = document.getElementById('vaccNameTapHint');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    hint.textContent = 'Tap to hide ▴';
  } else {
    panel.style.display = 'none';
    hint.textContent = 'Tap for details ▾';
  }
}

function openVaccModal() {
  document.getElementById('vName').value = '';
  document.getElementById('vDate').value = today();
  document.getElementById('vUpcoming').checked = false;
  activateBtn('vaccSaveBtn', false);
  openModal('vaccModal');
}
function addVacc() {
  const name = document.getElementById('vName').value.trim();
  const date = document.getElementById('vDate').value;
  const upcoming = document.getElementById('vUpcoming').checked;
  if (!name || !date) return;
  if (upcoming) vaccData.forEach(v => v.upcoming = false);
  vaccData.push({ name, date, upcoming });
  _islMarkDirty('medical');
  closeModal('vaccModal');
  renderVacc();
  renderVaccCoverage();
  updateHeader();
}

// ── Vaccination Date Edit ──
let _vaccEditIdx = null;

function openVaccEditModal(idx) {
  const entry = vaccData[idx];
  if (!entry) return;
  _vaccEditIdx = idx;
  document.getElementById('vaccEditName').innerHTML = zi('syringe') + ' ' + escHtml(entry.name);
  document.getElementById('vaccEditDate').value = entry.date;
  document.getElementById('vaccEditReason').value = entry.dateChangeReason || '';
  // Reset flag and reason display
  document.getElementById('vaccEditDateFlag').style.display = 'none';
  document.getElementById('vaccEditReasonWrap').style.display = 'none';
  // Store original date for comparison
  document.getElementById('vaccEditDate').dataset.scheduledDate = entry.scheduledDate || entry.date;
  checkVaccDateShift();
  openModal('vaccEditModal');
}

function checkVaccDateShift() {
  const dateEl = document.getElementById('vaccEditDate');
  const flagEl = document.getElementById('vaccEditDateFlag');
  const reasonWrap = document.getElementById('vaccEditReasonWrap');
  const saveBtn = document.getElementById('vaccEditSaveBtn');
  if (!dateEl || !flagEl || _vaccEditIdx === null) return;

  const newDate = dateEl.value;
  const entry = vaccData[_vaccEditIdx];
  const origDate = dateEl.dataset.scheduledDate || entry.date;

  if (!newDate) {
    flagEl.style.display = 'none';
    reasonWrap.style.display = 'none';
    return;
  }

  const origMs = new Date(origDate).getTime();
  const newMs = new Date(newDate).getTime();
  const diffDays = Math.round((newMs - origMs) / 86400000);
  const absDiff = Math.abs(diffDays);

  if (absDiff <= 3) {
    // Within tolerance — no flag needed
    flagEl.style.display = 'none';
    reasonWrap.style.display = 'none';
    activateBtn('vaccEditSaveBtn', true);
  } else {
    // Beyond tolerance — flag and require reason
    const direction = diffDays > 0 ? 'later' : 'earlier';
    flagEl.style.display = '';
    flagEl.innerHTML = `<div style="padding:8px 12px;border-radius:var(--r-lg);background:var(--peach-light);border-left:var(--accent-w) solid var(--border-warn);">
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--tc-warn);">${zi('warn')} ${absDiff} days ${direction} than scheduled</div>
      <div class="t-sub mt-2">Original date: ${formatDate(origDate)} · New date: ${formatDate(newDate)}</div>
      <div class="t-sub mt-2">Changes beyond ±3 days need a reason for your records.</div>
    </div>`;
    reasonWrap.style.display = '';
    // Enable save only if reason is provided
    const reason = document.getElementById('vaccEditReason').value.trim();
    activateBtn('vaccEditSaveBtn', reason.length > 0);
  }
}

function saveVaccEdit() {
  if (_vaccEditIdx === null) return;
  const entry = vaccData[_vaccEditIdx];
  const dateEl = document.getElementById('vaccEditDate');
  const reasonEl = document.getElementById('vaccEditReason');
  const newDate = dateEl.value;
  if (!newDate) return;

  const origDate = dateEl.dataset.scheduledDate || entry.date;
  const diffDays = Math.abs(Math.round((new Date(newDate).getTime() - new Date(origDate).getTime()) / 86400000));

  // If beyond ±3 days, require reason
  if (diffDays > 3) {
    const reason = reasonEl.value.trim();
    if (!reason) {
      alert('Please provide a reason for the date change.');
      return;
    }
    entry.scheduledDate = entry.scheduledDate || origDate;
    entry.dateChangeReason = reason;
  } else {
    // Within tolerance — clear reason but keep scheduledDate (never cleared)
    delete entry.dateChangeReason;
  }

  entry.date = newDate;
  save(KEYS.vacc, vaccData);
  _vaccEditIdx = null;
  closeModal('vaccEditModal');
  renderVacc();
  renderVaccCoverage();
  renderVaccPastList();
  renderMedicalStats();
  updateHeader();
}

function editUpcomingVaccDate() {
  const upcoming = vaccData.find(v => v.upcoming);
  if (!upcoming) return;
  const idx = vaccData.indexOf(upcoming);
  openVaccEditModal(idx);
}

function renderVaccPastList() {
  const el = document.getElementById('vaccPastList');
  const countEl = document.getElementById('vaccPastCount');
  if (!el) return;

  const past = vaccData.filter(v => !v.upcoming).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (countEl) countEl.textContent = past.length + ' doses';

  if (past.length === 0) {
    el.innerHTML = '<div class="t-sub fe-center-action">No vaccinations recorded yet.</div>';
    var tlEl = document.getElementById('vaccTimeline');
    if (tlEl) tlEl.innerHTML = '';
    return;
  }

  el.innerHTML = past.map(v => {
    const realIdx = vaccData.indexOf(v);
    const reasonNote = v.dateChangeReason ? `<div class="fs-xs tc-warn">${zi('note')} ${escHtml(v.dateChangeReason)}</div>` : '';
    // Reaction badge
    let badge = '';
    if (v.reaction === 'none') {
      badge = `<span class="vc-reaction-badge vc-badge-none" data-action="vaccOpenReactionEdit" data-arg="${realIdx}">${zi('check')} None</span>`;
    } else if (v.reaction === 'mild') {
      const symLabels = _vaccSymptomLabels(v.symptoms);
      badge = `<span class="vc-reaction-badge vc-badge-mild" data-action="vaccOpenReactionEdit" data-arg="${realIdx}">${zi('warn')} Mild${symLabels ? ' \u00b7 ' + escHtml(symLabels) : ''}</span>`;
    } else if (v.reaction === 'moderate') {
      const symLabels = _vaccSymptomLabels(v.symptoms);
      badge = `<span class="vc-reaction-badge vc-badge-moderate" data-action="vaccOpenReactionEdit" data-arg="${realIdx}">${zi('warn')} Moderate${symLabels ? ' \u00b7 ' + escHtml(symLabels) : ''}</span>`;
    } else if (v.reaction === 'severe') {
      badge = `<span class="vc-reaction-badge vc-badge-severe" data-action="vaccOpenReactionEdit" data-arg="${realIdx}">${zi('siren')} Severe</span>`;
    } else {
      badge = `<span class="vc-reaction-badge vc-badge-nolog" data-action="vaccOpenReactionEdit" data-arg="${realIdx}">${zi('note')} Log reaction</span>`;
    }
    return `<div class="vc-past-item">
      <span class="icon-lav vc-past-icon">${zi('syringe')}</span>
      <div class="flex-1-min">
        <div class="fs-sm-600">${escHtml(v.name)}</div>
        <div class="fs-xs tc-lav">${formatDate(v.date)} \u00b7 ${ageAtDate(v.date)}</div>
        ${reasonNote}
        <div class="mt-4">${badge}</div>
      </div>
      <button data-action="openVaccEditModal" data-arg="${realIdx}" class="btn-icon-edit" aria-label="Edit date">Edit</button>
    </div>`;
  }).join('');
  // Also render timeline
  renderVaccTimeline();
}

function _vaccSymptomLabels(symptoms) {
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) return '';
  return symptoms.slice(0, 3).map(function(id) {
    var s = VACC_REACTION_SYMPTOMS.find(function(x) { return x.id === id; });
    return s ? s.label : id;
  }).join(', ');
}

// ── Step 13: Next vaccination prep card ──
function _vaccRenderPrepCard() {
  var el = document.getElementById('vaccPrepCard');
  if (!el) return;
  var upcoming = vaccData.filter(function(v) { return v.upcoming; }).sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  if (upcoming.length === 0) { el.innerHTML = ''; return; }
  var next = upcoming[0];
  var summary = _vaccPatternSummary(next.name);
  if (!summary || summary.history.length === 0) { el.innerHTML = ''; return; }

  var family = summary.family;
  var rows = summary.history.map(function(v) {
    var sev = v.reaction ? v.reaction.charAt(0).toUpperCase() + v.reaction.slice(1) : 'No data';
    var syms = _vaccSymptomLabels(v.symptoms);
    return '<div class="vc-pattern-row">' + zi('syringe') + ' <span class="fw-600">' + escHtml(v.name) + ':</span> ' + escHtml(sev) + (syms ? ' \u2014 ' + escHtml(syms) : '') + '</div>';
  }).join('');

  var trendHtml = summary.trend.trend !== 'insufficient'
    ? '<div class="vc-pattern-trend">' + zi('chart') + ' ' + escHtml(summary.trend.label) + '</div>'
    : '';

  // Prediction with hedging (Assumption 5)
  var lastSev = summary.history[summary.history.length - 1].reaction || 'none';
  var expectText = '';
  if (summary.trend.trend === 'decreasing') {
    expectText = 'Based on previous reactions, expect milder effects. Keep comfort measures ready.';
  } else if (summary.trend.trend === 'increasing') {
    expectText = 'Recent reactions have been increasing. Monitor closely and consult your pediatrician if concerned.';
  } else if (lastSev !== 'none') {
    expectText = 'Previous reactions were ' + lastSev + '. Expect a similar level. Keep comfort measures ready.';
  } else {
    expectText = 'Previous doses were well-tolerated. Expect minimal side effects.';
  }
  var hedgeNote = summary.hasMultiVisit
    ? '<div class="fs-2xs tc-light mt-4">Based on visits that included ' + escHtml(family) + ', not ' + escHtml(family) + ' specifically.</div>'
    : '';

  // DTwP-specific: DTaP consideration
  var considerHtml = '';
  if (family === 'DTwP' && (lastSev === 'moderate' || lastSev === 'severe')) {
    considerHtml = '<div class="vc-prep-consider">' + zi('bulb') + ' DTaP (acellular) has fewer side effects than DTwP (whole cell). Discuss with your doctor.</div>';
  }

  // Correlation from most recent dose
  var lastEntry = summary.history[summary.history.length - 1];
  var corr = _vaccPostCorrelation(lastEntry.date);
  var corrHtml = '';
  if (corr.hasData) {
    var parts = [];
    if (corr.sleepDelta !== 0) parts.push('<div class="vc-impact-row">' + zi('moon') + ' Sleep: ' + (corr.sleepDelta > 0 ? '+' : '') + corr.sleepDelta + ' min vs usual</div>');
    if (corr.feedDelta !== 0) parts.push('<div class="vc-impact-row">' + zi('spoon') + ' Intake: ' + (corr.feedDelta > 0 ? '+' : '') + corr.feedDelta + '% vs usual</div>');
    if (parts.length > 0) corrHtml = '<div class="mt-6"><div class="fs-2xs fw-600 tc-lav">LAST TIME IMPACT</div>' + parts.join('') + '</div>';
  }

  el.innerHTML = '<div class="vc-pattern-card">' +
    '<div class="vc-pattern-title">' + zi('shield') + ' Preparing for ' + escHtml(next.name) + '</div>' +
    '<div class="fs-2xs fw-600 tc-lav">BASED ON PREVIOUS REACTIONS</div>' +
    rows + trendHtml +
    '<div class="vc-prep-expect">' + escHtml(expectText) + hedgeNote + '</div>' +
    considerHtml + corrHtml +
    '</div>';
}

// ── Step 16: Vaccination timeline view ──
function renderVaccTimeline() {
  var el = document.getElementById('vaccTimeline');
  if (!el) return;

  // Build IAP age groups from VACC_SCHEDULE
  var ageOrder = ['Birth', '6 weeks', '10 weeks', '14 weeks', '6 months', '7 months', '9 months',
    '12 months', '13 months', '15 months', '16-18 months', '18-19 months', '2 years', '4-6 years'];
  var ageGroups = {};
  ageOrder.forEach(function(age) { ageGroups[age] = []; });
  VACC_SCHEDULE.forEach(function(s) {
    if (!ageGroups[s.age]) ageGroups[s.age] = [];
    ageGroups[s.age].push(s.name);
  });

  // Match vaccData entries to schedule names
  var vaccByName = {};
  vaccData.forEach(function(v) {
    vaccByName[v.name.toLowerCase()] = v;
  });

  var hasAnyPast = vaccData.some(function(v) { return !v.upcoming; });
  if (!hasAnyPast) { el.innerHTML = ''; return; }

  var cols = '';
  ageOrder.forEach(function(age) {
    var names = ageGroups[age];
    if (!names || names.length === 0) return;
    // Check if any vaccine in this group has data
    var hasSomeData = names.some(function(n) { return vaccByName[n.toLowerCase()]; });
    var hasSomeUpcoming = names.some(function(n) {
      var v = vaccByName[n.toLowerCase()];
      return v && v.upcoming;
    });
    // Only show columns up to current age + 1 group ahead
    if (!hasSomeData && !hasSomeUpcoming) return;

    var dots = names.map(function(name) {
      var v = vaccByName[name.toLowerCase()];
      if (!v) return '';
      var dotClass = 'vc-dot-nodata';
      if (v.upcoming) {
        dotClass = 'vc-dot-upcoming';
      } else if (v.reaction === 'none') {
        dotClass = 'vc-dot-none';
      } else if (v.reaction === 'mild') {
        dotClass = 'vc-dot-mild';
      } else if (v.reaction === 'moderate') {
        dotClass = 'vc-dot-moderate';
      } else if (v.reaction === 'severe') {
        dotClass = 'vc-dot-severe';
      }
      // Delay badge: >7 days late from scheduledDate
      var delayBadge = '';
      if (!v.upcoming && v.scheduledDate && v.date) {
        var delayDays = Math.floor((new Date(v.date) - new Date(v.scheduledDate)) / 86400000);
        if (delayDays > 7) delayBadge = '<span class="vc-timeline-delay">D</span>';
      }
      var idx = vaccData.indexOf(v);
      return '<div class="vc-timeline-dot ' + dotClass + '" data-action="vaccTimelineTap" data-arg="' + idx + '" title="' + escAttr(name) + '">' +
        delayBadge +
        '</div>';
    }).filter(Boolean).join('');

    if (dots) {
      var shortAge = age.replace(' months', 'm').replace(' weeks', 'w').replace(' years', 'y');
      cols += '<div class="vc-timeline-col">' +
        '<div class="vc-timeline-label">' + escHtml(shortAge) + '</div>' +
        '<div class="vc-timeline-dots">' + dots + '</div>' +
        '</div>';
    }
  });

  if (!cols) { el.innerHTML = ''; return; }

  el.innerHTML = '<div class="vc-timeline mt-8 mb-8">' +
    '<div class="fs-2xs fw-600 tc-lav mb-4">VACCINATION TIMELINE</div>' +
    '<div class="vc-timeline-scroll">' + cols + '</div>' +
    '<div class="fs-2xs tc-light mt-4">' +
    '<span class="vc-timeline-dot vc-dot-none vc-legend-dot"></span> No reaction ' +
    '<span class="vc-timeline-dot vc-dot-mild vc-legend-dot ml-6"></span> Mild ' +
    '<span class="vc-timeline-dot vc-dot-moderate vc-legend-dot ml-6"></span> Moderate ' +
    '<span class="vc-timeline-dot vc-dot-severe vc-legend-dot ml-6"></span> Severe ' +
    '<span class="vc-timeline-dot vc-dot-nodata vc-legend-dot ml-6"></span> No data ' +
    '<span class="vc-timeline-dot vc-dot-upcoming vc-legend-dot ml-6"></span> Upcoming' +
    '</div></div>';
}

// Timeline dot tap → detail bottom sheet
var _vaccTimelineDetailEl = null;
function _vaccShowTimelineDetail(idx) {
  var v = vaccData[idx];
  if (!v) return;
  // Remove existing detail sheet
  if (_vaccTimelineDetailEl) { _vaccTimelineDetailEl.remove(); _vaccTimelineDetailEl = null; }

  var sev = v.reaction ? v.reaction.charAt(0).toUpperCase() + v.reaction.slice(1) : null;
  var syms = _vaccSymptomLabels(v.symptoms);
  var reactionHtml = '';
  if (sev) {
    reactionHtml = '<div class="vc-detail-reaction">' +
      '<div class="fs-sm fw-600">Reaction: ' + escHtml(sev) + '</div>' +
      (syms ? '<div class="fs-xs tc-mid mt-2">Symptoms: ' + escHtml(syms) + '</div>' : '') +
      (v.temperature ? '<div class="fs-xs tc-mid mt-2">Temperature: ' + escHtml(v.temperature) + '</div>' : '') +
      (v.cryDuration ? '<div class="fs-xs tc-mid mt-2">Crying: ' + escHtml(v.cryDuration) + '</div>' : '') +
      (v.reactionNotes ? '<div class="fs-xs tc-mid mt-2">Notes: ' + escHtml(v.reactionNotes) + '</div>' : '') +
      '</div>';
  } else if (!v.upcoming) {
    reactionHtml = '<div class="vc-detail-reaction"><div class="fs-sm tc-light">No reaction logged</div></div>';
  }

  var delayInfo = '';
  if (v.scheduledDate && v.date && v.scheduledDate !== v.date) {
    var dd = Math.floor((new Date(v.date) - new Date(v.scheduledDate)) / 86400000);
    if (dd > 0) delayInfo = '<div class="fs-xs tc-amber mt-4">' + zi('clock') + ' Given ' + dd + ' days after scheduled date</div>';
  }

  var detail = document.createElement('div');
  detail.className = 'vc-timeline-detail';
  detail.innerHTML = '<div class="vc-detail-header">' +
    '<div class="vc-detail-name">' + zi('syringe') + ' ' + escHtml(v.name) + '</div>' +
    '<button class="ql-modal-close" data-action="vaccCloseTimelineDetail">&times;</button>' +
    '</div>' +
    '<div class="vc-detail-date">' + (v.upcoming ? 'Due: ' : 'Given: ') + formatDate(v.date) + ' \u00b7 ' + ageAtDate(v.date) + '</div>' +
    delayInfo +
    reactionHtml +
    '<div class="vc-detail-actions">' +
    '<button class="btn btn-lav vc-sm-btn" data-action="openVaccEditModal" data-arg="' + idx + '">Edit Date</button>' +
    (!v.upcoming ? '<button class="btn btn-sky vc-sm-btn" data-action="vaccOpenReactionEdit" data-arg="' + idx + '">' + (v.reaction ? 'Edit Reaction' : 'Log Reaction') + '</button>' : '') +
    '</div>';

  document.body.appendChild(detail);
  _vaccTimelineDetailEl = detail;
  // Close on outside tap
  setTimeout(function() {
    document.addEventListener('click', _vaccTimelineDetailOutside);
  }, 50);
}

function _vaccCloseTimelineDetail() {
  if (_vaccTimelineDetailEl) { _vaccTimelineDetailEl.remove(); _vaccTimelineDetailEl = null; }
  document.removeEventListener('click', _vaccTimelineDetailOutside);
}

function _vaccTimelineDetailOutside(e) {
  if (_vaccTimelineDetailEl && !_vaccTimelineDetailEl.contains(e.target) && !e.target.closest('.vc-timeline-dot')) {
    _vaccCloseTimelineDetail();
  }
}

// Open reaction modal for editing existing entry
function _vaccOpenReactionEdit(idx) {
  var v = vaccData[idx];
  if (!v) return;
  _vaccCloseTimelineDetail();
  _vaccOpenReactionModal([v.name]);
  // Store the target entry index for save targeting (older entries outside 48h window)
  var form = document.querySelector('.vc-reaction-form');
  if (form) form.dataset.editIdx = idx;
  // Pre-fill with existing data after modal renders
  setTimeout(function() {
    if (v.reaction) {
      _vaccHandleSeverity(v.reaction);
    }
    if (v.symptoms && Array.isArray(v.symptoms)) {
      v.symptoms.forEach(function(id) {
        var chip = document.querySelector('.vc-symptom-chip[data-symptom="' + id + '"]');
        if (chip) chip.classList.add('active');
      });
    }
    if (v.temperature) {
      var tc = document.querySelector('.vc-temp-chip[data-arg="' + v.temperature + '"]');
      if (tc) tc.classList.add('active');
    }
    if (v.cryDuration) {
      var cc = document.querySelector('.vc-cry-chip[data-arg="' + v.cryDuration + '"]');
      if (cc) cc.classList.add('active');
    }
    if (v.reactionNotes) {
      var notes = document.getElementById('vaccReactionNotes');
      if (notes) notes.value = v.reactionNotes;
    }
  }, 100);
}

// ── VACCINATION COVERAGE CROSS-CHECK ──
function renderVaccCoverage() {
  const previewEl = document.getElementById('vaccCoveragePreview');
  const contentEl = document.getElementById('vaccCoverageContent');
  if (!previewEl || !contentEl) return;

  // Use precise fractional months (not Math.floor) for accurate schedule matching
  const mo = (new Date() - DOB) / (30.44 * 86400000);
  const givenNames = new Set(vaccData.filter(v => !v.upcoming).map(v => v.name.toLowerCase()));

  // Determine which scheduled vaccines are due by now
  const ageMap = { 'Birth':0, '6 weeks':1.5, '10 weeks':2.5, '14 weeks':3.5, '6 months':6, '7 months':7,
    '9 months':9, '12 months':12, '15 months':15, '16-18 months':16, '18 months':18, '2 years':24, '4-6 years':48 };

  const dueNow = VACC_SCHEDULE.filter(v => (ageMap[v.age] ?? 99) <= mo + 0.5);
  const upcoming = VACC_SCHEDULE.filter(v => {
    const am = ageMap[v.age] ?? 99;
    return am > mo + 0.5 && am <= mo + 6;
  });

  // Match given vaccines to schedule using normalized names
  // Normalize: strip everything except letters and digits for bulletproof matching
  const givenNorm = new Set([...givenNames].map(normVacc));

  let givenCount = 0, missingCount = 0, optionalMissing = 0;
  const missing = [];
  const given = [];

  dueNow.forEach(v => {
    const isGiven = givenNorm.has(normVacc(v.name));
    if (isGiven) { givenCount++; given.push(v); }
    else {
      if (v.type === 'private') optionalMissing++;
      else missingCount++;
      missing.push(v);
    }
  });

  const totalDue = dueNow.length;
  const pastCount = vaccData.filter(v => !v.upcoming).length;
  const pct = totalDue > 0 ? Math.round((givenCount / totalDue) * 100) : 100;

  // Preview pills
  const mandatoryMissing = missing.filter(v => v.type === 'iap');
  const recMissing = missing.filter(v => v.type === 'iap-rec');
  const pvtMissing = missing.filter(v => v.type === 'private');

  previewEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:var(--sp-8);">
    <div class="diet-stat ${missingCount === 0 ? 'ds-sage' : 'ds-rose'}" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val">${givenCount}/${totalDue}</div>
      <div class="diet-stat-label">IAP schedule</div>
    </div>
    <div class="diet-stat ds-sky" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val">${pastCount}</div>
      <div class="diet-stat-label">Doses logged</div>
    </div>
    ${mandatoryMissing.length > 0 ? `<div class="diet-stat" style="background:var(--surface-danger);border-color:rgba(224,112,112,0.3);" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val t-danger" >${mandatoryMissing.length}</div>
      <div class="diet-stat-label">Missing</div>
    </div>` : ''}
    ${recMissing.length > 0 ? `<div class="diet-stat" style="background:var(--peach-light);border-color:rgba(255,193,7,0.3);" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val tc-warn">${recMissing.length}</div>
      <div class="diet-stat-label">Rec'd</div>
    </div>` : ''}
    ${pvtMissing.length > 0 ? `<div class="diet-stat ds-lav" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val">${pvtMissing.length}</div>
      <div class="diet-stat-label">Optional</div>
    </div>` : ''}
    <div class="diet-stat ds-sky" data-collapse-target="vaccCoverageBody" data-collapse-chevron="vaccCoverageChevron">
      <div class="diet-stat-val">${upcoming.length}</div>
      <div class="diet-stat-label">Next up</div>
    </div>
  </div>`;

  // Full content
  let html = '';

  // Missing mandatory
  if (mandatoryMissing.length > 0) {
    html += `<div class="section-label-danger">${zi('siren')} Missing — IAP Mandatory</div>`;
    mandatoryMissing.forEach(v => {
      html += renderVaccItem(v, 'missing');
    });
  }

  // Missing recommended
  if (recMissing.length > 0) {
    html += `<div class="section-label-warn">${zi('warn')} Missing — IAP Recommended</div>`;
    recMissing.forEach(v => {
      html += renderVaccItem(v, 'recommended');
    });
  }

  // Missing optional
  if (pvtMissing.length > 0) {
    html += `<div class="section-label-info">${zi('info')} Not given — Private/Optional</div>`;
    pvtMissing.forEach(v => {
      html += renderVaccItem(v, 'optional');
    });
  }

  // Given vaccines
  if (given.length > 0) {
    html += `<div style="font-size:var(--fs-sm);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--tc-sage);margin:12px 0 6px;">${zi('check')} Given (${given.length})</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:var(--sp-4);">`;
    given.forEach(v => {
      html += `<span style="font-size:var(--fs-sm);padding:3px 8px;border-radius:var(--r-lg);background:var(--sage-light);color:var(--tc-sage);">${escHtml(v.name)}</span>`;
    });
    html += `</div>`;
  }

  // Upcoming
  if (upcoming.length > 0) {
    html += `<div style="font-size:var(--fs-sm);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--tc-sky);margin:12px 0 6px;">${zi('clock')} Coming up (next 6 months)</div>`;
    upcoming.forEach(v => {
      html += renderVaccItem(v, 'upcoming');
    });
  }

  if (totalDue === 0) {
    html = '<div style="font-size:var(--fs-base);color:var(--light);padding:8px 0;">No vaccines due yet based on age.</div>';
  }

  contentEl.innerHTML = html;
}

function renderVaccItem(v, status) {
  const colors = {
    missing: { bg:'var(--surface-danger)', border:'var(--tc-danger)', badge:'#fde8ed', badgeText:'#c44058', badgeLabel:'MISSING' },
    recommended: { bg:'var(--surface-warn)', border:'#ffc107', badge:'#fff8e1', badgeText:'#856404', badgeLabel:'RECOMMENDED' },
    optional: { bg:'var(--sky-light)', border:'var(--sky)', badge:'var(--lav-light)', badgeText:'var(--tc-lav)', badgeLabel:'OPTIONAL' },
    upcoming: { bg:'var(--lav-light)', border:'var(--lavender)', badge:'var(--sky-light)', badgeText:'#3a7090', badgeLabel:v.age },
  };
  const c = colors[status];
  // Show booking status for upcoming vaccines
  let bookingHtml = '';
  if (status === 'upcoming' || status === 'missing') {
    const bookedData = load(KEYS.vaccBooked, null);
    const isBooked = bookedData && bookedData.vaccName === v.name;
    if (isBooked) {
      const apptLabel = getVaccApptLabel(bookedData);
      bookingHtml = apptLabel
        ? `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:var(--sp-4);padding:2px 8px;border-radius:var(--r-full);background:var(--surface-sage);font-size:var(--fs-xs);"><span style="font-weight:600;color:var(--tc-sage);">${zi('check')} Booked</span><span style="font-weight:400;color:var(--mid);">${apptLabel}</span></div>`
        : `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:var(--sp-4);padding:2px 8px;border-radius:var(--r-full);background:var(--surface-sage);font-size:var(--fs-xs);cursor:pointer;" data-action="openVaccApptModal" data-arg="${escAttr(v.name)}"><span style="font-weight:600;color:var(--tc-sage);">${zi('check')} Booked</span><span style="font-weight:400;color:var(--light);">Add date</span></div>`;
    }
  }
  return `<div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:8px 10px;border-radius:var(--r-lg);background:${c.bg};border-left:var(--accent-w) solid ${c.border};margin-bottom:4px;">
    <div class="flex-1-min">
      <div class="t-title fw-600">${v.name} <span style="font-size:var(--fs-xs);padding:1px 6px;border-radius:var(--r-md);background:${c.badge};color:${c.badgeText};font-weight:700;">${c.badgeLabel}</span></div>
      <div class="t-sub mt-2">${zi('shield')} ${v.protects}</div>
      <div style="font-size:var(--fs-sm);color:var(--light);margin-top:1px;">Due: ${v.age} · ${v.notes}</div>
      ${bookingHtml}
    </div>
  </div>`;
}

// ─────────────────────────────────────────

// MEDICATIONS & SUPPLEMENTS
// ─────────────────────────────────────────
function renderMeds() {
  save(KEYS.meds, meds);
  const list = document.getElementById('medList');
  list.innerHTML = '';
  if (meds.length === 0) {
    list.innerHTML = '<div class="med-empty">No medications or supplements added yet.</div>';
    return;
  }
  // active first, then inactive
  const sorted = [...meds].map((m,i) => ({...m, _i:i}))
    .sort((a,b) => (a.active === b.active) ? 0 : a.active ? -1 : 1);
  sorted.forEach(m => {
    const div = document.createElement('div');
    div.className = 'med-item' + (m.active ? '' : ' inactive');
    div.innerHTML = `
      <div class="med-dot"></div>
      <div class="med-body">
        <div class="med-name">${escHtml(m.name)} <span class="med-status-badge">${m.active ? 'Active' : 'Stopped'}</span></div>
        <div class="med-detail">
          ${m.dose ? `<span>${zi('pill')} ${escHtml(m.dose)}</span>` : ''}
          ${m.freq ? ` &nbsp;·&nbsp; <span>${zi('clock')} ${escHtml(m.freq)}</span>` : ''}
          ${m.start ? ` &nbsp;·&nbsp; <span>${zi('clock')} Since ${formatDate(m.start)}</span>` : ''}
        </div>
        ${m.brand ? `<div class="med-brand">${zi('target')} ${escHtml(m.brand)}</div>` : ''}
        ${m.notes ? `<div class="med-detail" style="margin-top:4px;font-style:italic;">${escHtml(m.notes)}</div>` : ''}
        ${_renderAttribution(m)}
      </div>
      <div class="med-actions">
        <button class="med-btn toggle-btn" data-action="toggleMed" data-arg="${m._i}">${m.active ? '⏸ Stop' : '▶ Resume'}</button>
        <button class="med-btn del-med-btn" data-action="deleteMed" data-arg="${m._i}">&times;</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function openMedModal() {
  document.getElementById('medName').value  = '';
  document.getElementById('medDose').value  = '';
  document.getElementById('medBrand').value = '';
  document.getElementById('medFreq').value  = '';
  document.getElementById('medStart').value = today();
  document.getElementById('medNotes').value = '';
  activateBtn('medSaveBtn', false);
  openModal('medModal');
}

function saveMed() {
  const name = document.getElementById('medName').value.trim();
  if (!name) return;
  meds.push({
    name,
    dose:  document.getElementById('medDose').value.trim(),
    brand: document.getElementById('medBrand').value.trim(),
    freq:  document.getElementById('medFreq').value.trim(),
    start: document.getElementById('medStart').value,
    notes: document.getElementById('medNotes').value.trim(),
    active: true,
  });
  closeModal('medModal');
  _islMarkDirty('medical');
  renderMeds();
}

function toggleMed(i) {
  meds[i].active = !meds[i].active;
  renderMeds();
}

function deleteMed(i) {
  confirmAction('Delete this medication?', () => {
    meds.splice(i,1);
    renderMeds();
  });
}

// ─────────────────────────────────────────

// RECOMMENDED ACTIVITIES (milestone-driven)
// ─────────────────────────────────────────
// getAgeInMonths → migrated to core.js

// Helper: get milestone status by partial text match
function msStatus(keyword) {
  const kw = keyword.toLowerCase();
  const match = milestones.find(m => m.text.toLowerCase().includes(kw));
  return match ? match.status : 'unknown';
}

const DYNAMIC_ACTIVITIES = [
  // ── MOTOR: Pre-crawling ──
  { type:'motor', icon:zi('run'), title:'Tummy time — build core strength',
    desc:'3–5 sessions daily, 5 min each. This is the foundation for crawling, sitting, and all gross motor skills.',
    condition: (mo) => mo <= 8 && msStatus('crawl') !== 'done' },

  { type:'motor', icon:zi('baby'), title:'Supported sitting practice',
    desc:'Sit her with pillows around for safety and let her balance. Reaching for toys while sitting builds core stability.',
    condition: (mo) => msStatus('sit') !== 'done' && mo >= 5 },

  { type:'motor', icon:zi('baby'), title:'Object transfer hand to hand',
    desc:'Give a toy in one hand and encourage passing to the other. Builds bilateral brain coordination.',
    condition: (mo) => msStatus('transfer') !== 'done' && mo >= 5 && mo <= 9 },

  { type:'motor', icon:zi('baby'), title:'Encourage crawling',
    desc:'Place a favourite toy just out of reach during tummy time. Creates motivation to move forward — belly crawling counts!',
    condition: (mo) => msStatus('crawl') === 'in_progress' || (msStatus('crawl') !== 'done' && mo >= 6) },

  { type:'motor', icon:zi('run'), title:'Supported standing',
    desc:'She\'s already pulling to stand — encourage brief standing at a stable surface. Builds leg strength and balance for cruising.',
    condition: (mo) => msStatus('pull') === 'done' && msStatus('cruis') !== 'done' },

  { type:'motor', icon:zi('run'), title:'Cruising practice',
    desc:'Place toys along furniture to encourage stepping sideways while holding on. This bridges standing and walking.',
    condition: (mo) => msStatus('cruis') === 'in_progress' || (msStatus('pull') === 'done' && msStatus('walk') !== 'done' && mo >= 7) },

  { type:'motor', icon:zi('run'), title:'Supported walking',
    desc:'Hold both hands and let her step forward. Gradually shift to one hand as confidence builds.',
    condition: (mo) => msStatus('cruis') === 'done' && msStatus('walk') !== 'done' },

  { type:'motor', icon:zi('baby'), title:'Stack & knock blocks',
    desc:'Stack 2–3 soft blocks and let her knock them down. Builds spatial understanding and cause-effect learning.',
    condition: (mo) => msStatus('stack') !== 'done' && mo >= 7 },

  { type:'motor', icon:zi('note'), title:'Banging & dropping toys',
    desc:'Let her bang safe objects together or drop them from the highchair. She is learning cause-and-effect.',
    condition: (mo) => mo >= 6 && mo <= 10 && msStatus('bang') !== 'done' },

  // ── MOTOR: Fine motor ──
  { type:'motor', icon:zi('baby'), title:'Pincer grasp practice',
    desc:'Offer small soft foods (puffs, peas) or safe objects to pick up with thumb and forefinger. Key fine motor milestone.',
    condition: (mo) => msStatus('pincer') !== 'done' && mo >= 7 },

  { type:'motor', icon:zi('spoon'), title:'Self-feeding with spoon',
    desc:'Let her hold a pre-loaded spoon during meals. It will be messy but builds oral motor skills and independence.',
    condition: (mo) => mo >= 7 && msStatus('finger feed') !== 'done' },

  { type:'motor', icon:zi('spoon'), title:'Finger food practice',
    desc:'Offer soft finger foods she can grasp. Builds pincer grasp, hand-to-mouth coordination, and chewing skills.',
    condition: (mo) => msStatus('finger feed') === 'in_progress' || (msStatus('finger feed') !== 'done' && mo >= 6) },

  // ── LANGUAGE ──
  { type:'language', icon:zi('chat'), title:'Talk and narrate constantly',
    desc:'Describe everything you do — "Now we\'re putting on your shirt." Quantity and variety of words drive language circuits.',
    condition: (mo) => mo <= 12 },

  { type:'language', icon:zi('book'), title:'Read picture books daily',
    desc:'Simple high-contrast or cloth books with faces and objects. Point and name things. Builds visual tracking and vocabulary.',
    condition: (mo) => mo >= 5 },

  { type:'language', icon:zi('chat'), title:'Name body parts',
    desc:'Touch her nose, ears, toes while saying the name clearly. Repetition builds word-object associations.',
    condition: (mo) => mo >= 6 && msStatus('understand') !== 'done' },

  { type:'language', icon:zi('chat'), title:'Imitation games — copy her sounds',
    desc:'Repeat her babbles back, then add new sounds. Turn-taking in vocalisation is the root of conversation.',
    condition: (mo) => msStatus('babbl') === 'done' || msStatus('babbl') === 'in_progress' },

  { type:'language', icon:zi('target'), title:'Respond to name — reinforce it',
    desc:'Call her name from different positions and reward with a smile when she turns. Strengthens name recognition.',
    condition: (mo) => msStatus('respond') === 'in_progress' },

  { type:'language', icon:zi('list'), title:'Simple instructions practice',
    desc:'"Give me the ball", "clap your hands" — one-step commands with gestures help her link words to actions.',
    condition: (mo) => mo >= 8 && msStatus('follow') !== 'done' },

  // ── SENSORY ──
  { type:'sensory', icon:zi('star'), title:'Music & rhythm time',
    desc:'Sing nursery rhymes, clap rhythms, or play gentle music. Babies are highly responsive to rhythm — it stimulates auditory processing.',
    condition: (mo) => mo <= 12 },

  { type:'sensory', icon:zi('sprout'), title:'Texture exploration',
    desc:'Let her touch different safe textures — soft cloth, smooth spoon, cool bowl, bumpy ball. Sensory variety accelerates brain development.',
    condition: (mo) => mo >= 5 && mo <= 10 },

  { type:'sensory', icon:zi('drop'), title:'Water play',
    desc:'Splashing in a basin or during bath time. Pouring, scooping — builds sensory awareness and fine motor skills.',
    condition: (mo) => mo >= 5 },

  { type:'sensory', icon:zi('star'), title:'Instrument exploration',
    desc:'Simple shakers, soft drums, or bells. Let her make noise — it builds cause-and-effect understanding and auditory processing.',
    condition: (mo) => mo >= 6 },

  { type:'sensory', icon:zi('palette'), title:'Food-safe finger painting',
    desc:'Smear a little puree on a tray and let her explore with fingers. Rich tactile experience — great for sensory-averse babies too.',
    condition: (mo) => mo >= 7 },

  // ── SOCIAL ──
  { type:'social', icon:'🪞', title:'Mirror play',
    desc:'Hold her in front of a mirror. She\'ll study her face and expressions — builds self-awareness and social cognition.',
    condition: (mo) => mo >= 5 && mo <= 10 },

  { type:'social', icon:zi('baby'), title:'Peek-a-boo',
    desc:'Classic for a reason — builds object permanence and anticipation. Try variations: hide behind a cloth, under a box.',
    condition: (mo) => mo >= 5 && msStatus('object perm') !== 'done' },

  { type:'social', icon:zi('baby'), title:'Practise waving bye-bye',
    desc:'Model waving every time someone leaves. She\'ll start imitating — a key social communication milestone.',
    condition: (mo) => msStatus('wave') !== 'done' && mo >= 6 },

  { type:'social', icon:zi('baby'), title:'Clapping games',
    desc:'Clap your hands and encourage her to copy. "Pat-a-cake" is perfect. Builds motor planning and social imitation.',
    condition: (mo) => msStatus('clap') !== 'done' && mo >= 7 },

  { type:'social', icon:'🫣', title:'Manage stranger anxiety gently',
    desc:'Separation anxiety is normal at 8–10 months. Don\'t force interactions — let her warm up at her own pace.',
    condition: (mo) => msStatus('separation') === 'in_progress' || (mo >= 8 && mo <= 11) },

  { type:'social', icon:zi('baby'), title:'Pointing practice',
    desc:'Point at objects and name them. Encourage her to point too — "Where\'s the dog?" Pointing is a major communication milestone.',
    condition: (mo) => msStatus('point') !== 'done' && mo >= 8 },
];

function getFilteredActivities() {
  const mo = getAgeInMonths();
  return DYNAMIC_ACTIVITIES.filter(a => {
    try { return a.condition(mo); } catch { return false; }
  });
}

function renderActivities() {
  const label = document.getElementById('activityAgeLabel');
  const list = document.getElementById('activityList');
  const activities = getFilteredActivities();
  const mo = getAgeInMonths();

  if (activities.length === 0) {
    label.textContent = '';
    list.innerHTML = '<div class="t-sub-light py-4">All caught up — great work! Activities update as milestones progress.</div>';
    return;
  }

  label.textContent = `${activities.length} activities · ${mo} months`;

  // Group by type
  const catMeta = {
    motor:    { icon:zi('run'), label:'Motor' },
    sensory:  { icon:zi('palette'), label:'Sensory' },
    language: { icon:zi('chat'), label:'Language' },
    social:   { icon:zi('handshake'), label:'Social' },
  };

  const groups = {};
  activities.forEach(a => {
    if (!groups[a.type]) groups[a.type] = [];
    groups[a.type].push(a);
  });

  let html = '<div class="activity-cats">';

  Object.entries(groups).forEach(([type, items]) => {
    const meta = catMeta[type] || { icon:zi('target'), label: type };
    const catId = 'act-cat-' + type;

    html += `
      <div>
        <div class="activity-cat-card ${type}" id="${catId}" data-action="toggleActivityCat" data-arg="${type}">
          <div class="act-cat-top">
            <div class="act-cat-icon">${meta.icon}</div>
            <div class="act-cat-info">
              <div class="act-cat-name">${meta.label}</div>
              <div class="act-cat-count">${items.length} ${items.length === 1 ? 'activity' : 'activities'}</div>
            </div>
            <div class="act-cat-chevron">▾</div>
          </div>
        </div>
        <div class="act-cat-items ${type}" id="act-items-${type}">
          ${items.map(a => `
            <div class="activity-item ${a.type}">
              <div class="activity-icon">${a.icon}</div>
              <div class="activity-body">
                <strong>${a.title}</strong>
                <span>${a.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  });

  html += '</div>';
  list.innerHTML = html;
}

function toggleActivityCat(type) { toggleCatCard('act-cat-' + type, 'act-items-' + type); }

// ─────────────────────────────────────────
// UPCOMING MILESTONES
// ─────────────────────────────────────────
// ── Milestone Standards ──

function getUpcomingMilestones() {
  return MILESTONE_STANDARDS[_referenceStandard] || MILESTONE_STANDARDS.who;
}
// @@INSERT_DATA_BLOCK_20@@

function renderUpcomingMilestones() {
  const mo = getAgeInMonths();
  const label = document.getElementById('upcomingAgeLabel');
  const list = document.getElementById('upcomingMilestoneList');
  label.textContent = `${mo}–${mo + 3} months`;

  const achievedTexts = milestones.filter(m => isMsDone(m)).map(m => m.text.toLowerCase().trim());
  const inProgressTexts = milestones.filter(m => isMsActive(m)).map(m => m.text.toLowerCase().trim());

  // Exact match only — "Babbling" should NOT match "Begins consonant babbling"
  // These are different milestones. Only match if texts are identical.
  function matchesMilestone(upcomingText, milestoneTexts) {
    const lt = upcomingText.toLowerCase().trim();
    return milestoneTexts.some(mt => lt === mt || mt === lt);
  }

  let items = [];
  for (let m = mo; m <= mo + 3; m++) {
    const bracket = Object.keys(getUpcomingMilestones()).map(Number).sort((a,b)=>a-b).filter(b => b <= m).pop();
    const ms = getUpcomingMilestones()[bracket] || [];
    ms.forEach(item => {
      if (items.some(i => i.text === item.text)) return;
      const isAchieved = matchesMilestone(item.text, achievedTexts);
      if (isAchieved) return;
      const isIP = matchesMilestone(item.text, inProgressTexts);
      items.push({ ...item, month: bracket, currentStatus: isIP ? 'in_progress' : 'pending' });
    });
  }

  if (items.length === 0) {
    list.innerHTML = '<div class="t-sub-light py-4">No upcoming milestones data for this age range.</div>';
    return;
  }

  const stateMeta = {
    pending:     { icon:zi('target'), label:'Coming Up', desc:'to watch for' },
    in_progress: { icon:zi('target'),  label:'In Progress', desc:'started' },
  };
  const catMeta = {
    motor:     { icon:zi('run'), label:'Motor' },
    language:  { icon:zi('chat'), label:'Language' },
    social:    { icon:zi('handshake'), label:'Social' },
    cognitive: { icon:zi('brain'), label:'Cognitive' },
  };

  // Group: status → category → items
  const stateGroups = {};
  items.forEach(item => {
    const s = item.currentStatus;
    const c = item.cat || 'motor';
    if (!stateGroups[s]) stateGroups[s] = {};
    if (!stateGroups[s][c]) stateGroups[s][c] = [];
    stateGroups[s][c].push(item);
  });

  // Sort items within each sub-group
  Object.values(stateGroups).forEach(cats => {
    Object.values(cats).forEach(arr => arr.sort((a, b) => {
      if (a.advanced !== b.advanced) return a.advanced ? 1 : -1;
      return a.month - b.month;
    }));
  });

  const stateOrder = ['pending', 'in_progress'];
  const catOrder = ['motor', 'language', 'social', 'cognitive'];

  let html = '<div class="upcoming-cats">';

  stateOrder.forEach(status => {
    const cats = stateGroups[status];
    if (!cats) return;
    const totalCount = Object.values(cats).reduce((s, a) => s + a.length, 0);
    const meta = stateMeta[status];
    const catId = 'upc-cat-' + status;

    html += `
      <div>
        <div class="upcoming-cat-card ${status}" id="${catId}" data-action="toggleUpcomingCat" data-arg="${status}">
          <div class="upc-top">
            <div class="upc-icon">${meta.icon}</div>
            <div class="upc-info">
              <div class="upc-name">${meta.label}</div>
              <div class="upc-count">${totalCount} ${meta.desc}</div>
            </div>
            <div class="upc-chevron">▾</div>
          </div>
        </div>
        <div class="upc-items ${status}" id="upc-items-${status}">`;

    catOrder.forEach(cat => {
      const catItems = cats[cat];
      if (!catItems || catItems.length === 0) return;
      const cm = catMeta[cat] || { icon:zi('target'), label: cat };
      const subcatId = `upc-sub-${status}-${cat}`;

      html += `
          <div class="upc-subcat" id="${subcatId}">
            <div class="upc-subcat-header ${cat}" onclick="event.stopPropagation();toggleUpcomingSubcat('${subcatId}')">
              <div class="upc-subcat-icon">${cm.icon}</div>
              <div class="upc-subcat-label">${cm.label}</div>
              <div class="upc-subcat-count">${catItems.length}</div>
              <div class="upc-subcat-chevron">▾</div>
            </div>
            <div class="upc-subcat-items ${cat}">
              <div class="upcoming-list">
                ${catItems.map(item => renderUpcomingItem(item)).join('')}
              </div>
            </div>
          </div>`;
    });

    html += `
        </div>
      </div>`;
  });

  html += '</div>';
  list.innerHTML = html;
}

function renderUpcomingItem(item) {
  const isDone = item.currentStatus === 'done';
  const isIP = item.currentStatus === 'in_progress';
  const itemClass = isDone ? 'done' : isIP ? 'in-progress' : (item.advanced ? 'advanced' : 'normal');

  let actionsHtml = '';
  const catArg = `'${item.cat || 'motor'}'`;
  if (isDone) {
    actionsHtml = '<span class="upcoming-badge achieved-badge">' + zi('check') + ' Achieved</span>';
  } else if (isIP) {
    actionsHtml = `<button class="ms-action-btn" onclick="event.stopPropagation();upcomingToMilestone('${escAttr(item.text)}', ${item.advanced}, 'done', ${catArg})">${zi('check')} Done</button>`;
  } else {
    actionsHtml = `
      <button class="ms-action-btn" onclick="event.stopPropagation();upcomingToMilestone('${escAttr(item.text)}', ${item.advanced}, 'in_progress', ${catArg})">${zi('target')} Started</button>
      <button class="ms-action-btn" onclick="event.stopPropagation();upcomingToMilestone('${escAttr(item.text)}', ${item.advanced}, 'done', ${catArg})">${zi('check')} Done</button>
    `;
  }

  return `
    <div class="upcoming-item ${itemClass}">
      <div class="upcoming-icon">${item.icon}</div>
      <div class="upcoming-body">
        <strong>${escHtml(item.text)}</strong>
        <span>${escHtml(item.desc)}</span>
        <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;margin-top:5px;align-items:center;">
          <span class="upcoming-badge age-badge">${item.month}+ months</span>
          ${item.advanced ? '<span class="upcoming-badge adv-badge"><svg class="zi"><use href="#zi-star"/></svg> Advanced</span>' : ''}
          ${actionsHtml}
        </div>
      </div>
    </div>`;
}

function toggleUpcomingCat(status) { toggleCatCard('upc-cat-' + status, 'upc-items-' + status); }

function toggleUpcomingSubcat(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('expanded');
}

function upcomingToMilestone(text, advanced, status, cat) {
  // Remember which categories are currently expanded before re-render
  const expandedCats = [];
  document.querySelectorAll('.upc-items.open').forEach(el => expandedCats.push(el.id));
  const expandedSubs = [];
  document.querySelectorAll('.upc-subcat.expanded').forEach(el => expandedSubs.push(el.id));

  const todayStr = today();
  const existing = milestones.find(m => m.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    if (status === 'in_progress') {
      existing.status = 'in_progress';
      existing.inProgressAt = existing.inProgressAt || todayStr;
      existing.doneAt = null;
    } else if (status === 'done') {
      existing.status = 'done';
      existing.doneAt = todayStr;
    }
    if (cat && !existing.cat) existing.cat = cat;
  } else {
    milestones.push({
      text,
      status,
      advanced: !!advanced,
      doneAt: status === 'done' ? todayStr : null,
      inProgressAt: status === 'in_progress' ? todayStr : null,
      cat: cat || guessMilestoneCat(text),
    });
  }
  save(KEYS.milestones, milestones);
  renderMilestones();
  renderUpcomingMilestones();
  renderActivities();
  renderHomeActivity();

  // Restore expanded state after re-render
  expandedCats.forEach(id => {
    const items = document.getElementById(id);
    const card = document.getElementById(id.replace('upc-items-', 'upc-cat-'));
    if (items) items.classList.add('open');
    if (card) card.classList.add('expanded');
  });
  expandedSubs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('expanded');
  });
}

// ─────────────────────────────────────────
// SLEEP TRACKER
// ─────────────────────────────────────────
// Sleep quality is now auto-calculated from duration + bedtime
let _wakeCount = 0;

function adjustWakeCount(delta) {
  _wakeCount = Math.max(0, Math.min(10, _wakeCount + delta));
  const valEl = document.getElementById('wakeCountVal');
  const labelEl = document.getElementById('wakeCountLabel');
  if (valEl) valEl.textContent = _wakeCount;
  if (labelEl) {
    if (_wakeCount === 0) labelEl.textContent = 'No wake-ups';
    else if (_wakeCount === 1) labelEl.textContent = '1 wake-up';
    else labelEl.textContent = _wakeCount + ' wake-ups';
  }
}

// Extract wake count from either old format {count:N} or new format (plain number)
function getWakeCount(entry) {
  if (!entry || entry.wakeUps == null) return 0;
  if (typeof entry.wakeUps === 'number') return entry.wakeUps;
  if (typeof entry.wakeUps === 'object' && entry.wakeUps.count) return entry.wakeUps.count;
  return 0;
}
// @@INSERT_DATA_BLOCK_21@@

function getSleepTargets(ageMonths) {
  const std = SLEEP_STANDARDS[_referenceStandard] || SLEEP_STANDARDS.who;
  const m = Math.max(6, Math.min(12, Math.round(ageMonths)));
  return {
    nightTarget: std.nightTarget[m] || 660,
    nightMin: std.nightMin[m] || 600,
    totalTarget: std.totalTarget[m] || 840,
    totalFloor: std.totalFloor[m] || 540,
    bedtimeStart: std.bedtimeStart,
    bedtimeEnd: std.bedtimeEnd,
    napIdeal: std.naps[m] || [2,3],
    label: std.label,
  };
}

function calcSleepScore(entry) {
  if (!entry || entry.type !== 'night') return null;
  const dur = calcSleepDuration(entry.bedtime, entry.wakeTime);
  const totalMin = dur.total;

  const ageM = ageAt().months;
  const st = getSleepTargets(ageM);

  // --- Duration score (40%) ---
  const targetMin = st.nightTarget;
  const minFloor = st.nightMin;
  let durScore;
  if (totalMin >= targetMin) durScore = 100;
  else if (totalMin <= minFloor) durScore = 0;
  else durScore = Math.round(((totalMin - minFloor) / (targetMin - minFloor)) * 100);

  // --- Wake-ups score (40%) ---
  const wakes = getWakeCount(entry);
  const wakeScoreMap = [100, 85, 70, 50, 30, 15, 0];
  const wakeScore = wakes >= 6 ? 0 : (wakeScoreMap[wakes] ?? 0);

  // --- Bedtime score (20%) ---
  if (!entry.bedtime) return { score: Math.round(durScore * 0.4 + wakeScore * 0.4), dur: durScore, wake: wakeScore, bed: 0 };
  const [bh, bm] = entry.bedtime.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  if (bh < 6) bedMin += 24 * 60;
  const idealStart = st.bedtimeStart * 60;
  const idealEnd = st.bedtimeEnd * 60;
  let bedScore;
  if (bedMin >= idealStart && bedMin <= idealEnd) bedScore = 100;
  else {
    const distMin = bedMin < idealStart ? idealStart - bedMin : bedMin - idealEnd;
    bedScore = Math.max(0, Math.round(100 - (distMin / 60) * 40));
  }

  const score = Math.round(durScore * 0.4 + wakeScore * 0.4 + bedScore * 0.2);
  const label = score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor';
  const emoji = score >= 70 ? zi('moon') : score >= 40 ? zi('moon') : zi('warn');
  return { score, label, emoji };
}

function getSleepScoreBadge(entry) {
  const s = calcSleepScore(entry);
  if (!s) return '';
  const cls = 'sq-' + s.label;
  return `<span class="sleep-quality-badge ${cls}">${s.emoji} ${s.score}</span>`;
}

function getDailySleepScore(dateStr) {
  const entries = getSleepForDate(dateStr);
  if (entries.length === 0) return null;

  const ageM = ageAt().months;
  const st = getSleepTargets(ageM);
  const nightEntries = entries.filter(s => s.type === 'night');
  const napEntries = entries.filter(s => s.type === 'nap');

  // Total sleep duration (night + naps)
  let totalMin = 0;
  entries.forEach(s => { totalMin += calcSleepDuration(s.bedtime, s.wakeTime).total; });

  // --- Total sleep score (40%) ---
  const targetTotal = st.totalTarget;
  const floorTotal = st.totalFloor;
  let totalScore;
  if (totalMin >= targetTotal) totalScore = 100;
  else if (totalMin <= floorTotal) totalScore = 0;
  else totalScore = Math.round(((totalMin - floorTotal) / (targetTotal - floorTotal)) * 100);

  // --- Wake-ups score (30%) ---
  const nightEntry = nightEntries[0];
  const wakes = getWakeCount(nightEntry);
  const wakeScoreMap = [100, 85, 70, 50, 30, 15, 0];
  const wakeScore = wakes >= 6 ? 0 : (wakeScoreMap[wakes] ?? 0);

  // --- Bedtime score (15%) ---
  let bedScore = 50;
  if (nightEntry && nightEntry.bedtime) {
    const [bh] = nightEntry.bedtime.split(':').map(Number);
    let bedMin = bh * 60 + parseInt(nightEntry.bedtime.split(':')[1], 10);
    if (isNaN(bedMin)) bedMin = 20 * 60;
    if (bh < 6) bedMin += 24 * 60;
    const idealStart = st.bedtimeStart * 60;
    const idealEnd = st.bedtimeEnd * 60;
    if (bedMin >= idealStart && bedMin <= idealEnd) bedScore = 100;
    else {
      const distMin = bedMin < idealStart ? idealStart - bedMin : bedMin - idealEnd;
      bedScore = Math.max(0, Math.round(100 - (distMin / 60) * 40));
    }
  }

  // --- Nap count score (15%) ---
  const napCount = napEntries.length;
  const [napMin, napMax] = st.napIdeal;
  let napScore;
  if (napCount >= napMin && napCount <= napMax) napScore = 100;
  else if (napCount === napMax + 1) napScore = 70;
  else if (napCount === napMin - 1 && napMin > 0) napScore = 60;
  else if (napCount === 0) napScore = 0;
  else napScore = 40;

  const baseScore = Math.round(totalScore * 0.4 + wakeScore * 0.3 + bedScore * 0.15 + napScore * 0.15);
  const modRaw = computeSleepModifier();
  let score = applyIntelligenceModifier(baseScore, modRaw);
  // Post-vaccination buffer: don't penalize disrupted sleep
  if (_isPostVaccWindow()) score = Math.min(100, score + POST_VACC_SLEEP_BUFFER);
  const modifier = _withDelta(modRaw, baseScore, score);
  return {
    score, baseScore, modifier,
    ...getScoreLabel(score),
    components: { duration: totalScore, wakeups: wakeScore, bedtime: bedScore, naps: napScore },
    detail: { totalMin, napCount, wakes, bedtimeActual: nightEntry ? nightEntry.bedtime : null, napCountIdeal: st.napIdeal },
    // Backward compat
    totalMin, napCount, wakes,
    label: score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor',
    emoji: score >= 70 ? zi('moon') : score >= 40 ? zi('moon') : zi('warn')
  };
}

function getAvgDailySleepScore7d() {
  const scores = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const sc = getDailySleepScore(ds);
    if (sc) scores.push(sc.score);
  }
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function classifyNapType(startTime) {
  if (!startTime) return 'morning';
  const h = parseInt(startTime.split(':')[0], 10);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 16) return 'afternoon';
  if (h >= 16 && h < 20) return 'evening';
  return 'night'; // 20-4
}

function calcSleepDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return { h: 0, m: 0, total: 0 };
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  if (isNaN(bh) || isNaN(wh)) return { h: 0, m: 0, total: 0 };
  let totalMin = (wh * 60 + wm) - (bh * 60 + bm);
  if (totalMin <= 0) totalMin += 24 * 60; // overnight
  return { h: Math.floor(totalMin / 60), m: totalMin % 60, total: totalMin };
}

function getLastNightSleep() {
  const nights = sleepData.filter(s => s.type === 'night' && s.date && s.bedtime);
  nights.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return nights[0] || null;
}

function getTodayNaps() {
  const t = today();
  return sleepData.filter(s => s.type === 'nap' && s.date === t);
}

function getSleepForDate(dateStr) {
  return sleepData.filter(s => s.date === dateStr);
}

function getDailyTotalSleep(dateStr) {
  const entries = getSleepForDate(dateStr);
  let totalMin = 0;
  entries.forEach(s => {
    const d = calcSleepDuration(s.bedtime, s.wakeTime);
    totalMin += d.total;
  });
  return totalMin;
}

function getAvgSleep7d() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  const totals = days.map(d => getDailyTotalSleep(d)).filter(t => t > 0);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}


let _sleepEditIdx = null; // null = add mode, number = editing that index

function addSleepEntry() {
  const dateEl = document.getElementById('sleepDate');
  const bedEl = document.getElementById('sleepBedtime');
  const wakeEl = document.getElementById('sleepWakeTime');
  const notesEl = document.getElementById('sleepNotes');
  const date = dateEl.value;
  const bedtime = bedEl.value;
  const wakeTime = wakeEl.value;
  if (!date || !bedtime || !wakeTime) {
    alert('Please fill in date, bedtime, and wake time.');
    return;
  }

  const entry = {
    date, bedtime, wakeTime,
    type: 'night',
    wakeUps: _wakeCount,
    notes: notesEl.value.trim(),
    ts: new Date().toISOString()
  };

  if (_sleepEditIdx !== null) {
    sleepData[_sleepEditIdx] = entry;
    _sleepEditIdx = null;
  } else {
    const existing = sleepData.findIndex(s => s.date === date && s.type === 'night');
    if (existing !== -1) {
      if (!confirm('A night sleep entry already exists for ' + formatDate(date) + '. Replace it?')) return;
      sleepData.splice(existing, 1);
    }
    sleepData.push(entry);
  }

  sleepData.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || '').localeCompare(a.ts || ''));
  save(KEYS.sleep, sleepData);
  _tsfMarkDirty();
  resetSleepForm('night');
  _islMarkDirty('sleep');
  renderSleep();
  renderHomeSleep();
  setTimeout(drawSleepChart, 60);
}

function addNapEntry() {
  const dateEl = document.getElementById('napDate');
  const startEl = document.getElementById('napStart');
  const endEl = document.getElementById('napEnd');
  const notesEl = document.getElementById('napNotes');
  const date = dateEl.value;
  const start = startEl.value;
  const end = endEl.value;
  if (!date || !start || !end) {
    alert('Please fill in date, start, and end time.');
    return;
  }

  const entry = {
    date, bedtime: start, wakeTime: end,
    type: 'nap',
    napType: classifyNapType(start),
    quality: null,
    notes: notesEl.value.trim(),
    ts: new Date().toISOString()
  };

  if (_sleepEditIdx !== null) {
    sleepData[_sleepEditIdx] = entry;
    _sleepEditIdx = null;
  } else {
    sleepData.push(entry);
  }

  sleepData.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || '').localeCompare(a.ts || ''));
  save(KEYS.sleep, sleepData);
  _tsfMarkDirty();
  resetSleepForm('nap');
  _islMarkDirty('sleep');
  renderSleep();
  renderHomeSleep();
  setTimeout(drawSleepChart, 60);
}

// ── Real-time sleep/nap tracking ──

const SLEEP_INPROGRESS_KEY = 'ziva_sleep_inprogress';

function startSleepNow(type) {
  const now = new Date();
  let timeStr, dateStr, startTs;

  if (type === 'night') {
    // Check if bedtime field has a value
    const bedField = document.getElementById('sleepBedtime');
    const dateField = document.getElementById('sleepDate');
    const fieldTime = bedField?.value;
    const fieldDate = dateField?.value;
    if (fieldTime) {
      timeStr = fieldTime;
      dateStr = fieldDate || toDateStr(now);
      // Build a proper timestamp from the entered date+time
      const built = new Date(dateStr + 'T' + timeStr + ':00');
      startTs = built.toISOString();
    } else {
      timeStr = now.toTimeString().slice(0, 5);
      dateStr = toDateStr(now);
      startTs = now.toISOString();
    }
  } else {
    // Nap — check napStart field
    const startField = document.getElementById('napStart');
    const dateField = document.getElementById('napDate');
    const fieldTime = startField?.value;
    const fieldDate = dateField?.value;
    if (fieldTime) {
      timeStr = fieldTime;
      dateStr = fieldDate || toDateStr(now);
      const built = new Date(dateStr + 'T' + timeStr + ':00');
      startTs = built.toISOString();
    } else {
      timeStr = now.toTimeString().slice(0, 5);
      dateStr = toDateStr(now);
      startTs = now.toISOString();
    }
  }

  // Check if there's already an in-progress entry
  const existing = localStorage.getItem(SLEEP_INPROGRESS_KEY);
  if (existing) {
    const ep = JSON.parse(existing);
    const elabel = ep.type === 'night' ? 'sleep' : 'nap';
    if (!confirm(`A ${elabel} is already in progress (started ${formatTimeShort(ep.startTime)}). Replace it?`)) return;
  }

  const entry = {
    type,
    date: dateStr,
    startTime: timeStr,
    startTs,
  };

  localStorage.setItem(SLEEP_INPROGRESS_KEY, JSON.stringify(entry));

  const label = type === 'night' ? 'Bedtime' : 'Nap';
  showQLToast(`▶ ${label} started at ${formatTimeShort(timeStr)}`, 3000);

  renderSleepInProgressBanner();
  updateSleepTabIndicator();
  renderHomeSleep();
}

function endSleepNow() {
  const raw = localStorage.getItem(SLEEP_INPROGRESS_KEY);
  if (!raw) return;
  const ip = JSON.parse(raw);

  const now = new Date();
  let endTime;

  // Check if the user entered a wake/end time in the form
  if (ip.type === 'night') {
    const wakeField = document.getElementById('sleepWakeTime');
    endTime = (wakeField?.value) || now.toTimeString().slice(0, 5);
  } else {
    const endField = document.getElementById('napEnd');
    endTime = (endField?.value) || now.toTimeString().slice(0, 5);
  }

  const entry = {
    date: ip.date,
    bedtime: ip.startTime,
    wakeTime: endTime,
    type: ip.type,
    notes: '',
    ts: now.toISOString(),
  };

  if (ip.type === 'nap') {
    entry.napType = classifyNapType(ip.startTime);
    entry.quality = null;
  } else {
    entry.wakeUps = 0;
  }

  sleepData.push(entry);
  sleepData.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || '').localeCompare(a.ts || ''));
  save(KEYS.sleep, sleepData);
  _tsfMarkDirty();

  _islMarkDirty('sleep');
  localStorage.removeItem(SLEEP_INPROGRESS_KEY);

  const dur = calcSleepDuration(ip.startTime, endTime);
  const label = ip.type === 'night' ? 'Night sleep' : 'Nap';
  showQLToast(`${zi('check')} ${label} logged — ${dur.h}h ${dur.m}m`, 3000);

  renderSleep();
  renderHomeSleep();
  renderSleepInProgressBanner();
  updateSleepTabIndicator();
  setTimeout(drawSleepChart, 60);
}

function cancelSleepInProgress() {
  localStorage.removeItem(SLEEP_INPROGRESS_KEY);
  renderSleepInProgressBanner();
  updateSleepTabIndicator();
}

// Refresh the pulsing dot on the sleep sub-tab button
function updateSleepTabIndicator() {
  const sleepBtn = document.querySelector('.track-sub-btn[data-key="sleep"]');
  if (!sleepBtn) return;
  const existingDot = sleepBtn.querySelector('.sip-tab-dot');
  const hasIP = !!localStorage.getItem(SLEEP_INPROGRESS_KEY);
  if (hasIP && !existingDot) {
    sleepBtn.insertAdjacentHTML('beforeend', '<span class="sip-tab-dot"></span>');
  } else if (!hasIP && existingDot) {
    existingDot.remove();
  }
}

let _sipInterval = null;

function renderSleepInProgressBanner() {
  const banner = document.getElementById('sleepInProgressBanner');
  if (!banner) return;

  const raw = localStorage.getItem(SLEEP_INPROGRESS_KEY);
  if (!raw) {
    banner.style.display = 'none';
    banner.innerHTML = '';
    if (_sipInterval) { clearInterval(_sipInterval); _sipInterval = null; }
    return;
  }

  const ip = JSON.parse(raw);
  const label = ip.type === 'night' ? '' + zi('moon') + ' Night sleep' : zi('zzz') + ' Nap';

  function updateElapsed() {
    const started = new Date(ip.startTs);
    const now = new Date();
    const diffMs = now - started;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    const elapsed = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;

    banner.innerHTML = `<div class="sip-banner">
      <div class="sip-pulse"></div>
      <div>
        <div class="t-sm" style="font-weight:600;color:var(--tc-indigo);">${label} in progress</div>
        <div class="t-xs t-light">Started ${formatTimeShort(ip.startTime)}</div>
      </div>
      <div class="sip-elapsed">${elapsed}</div>
      <button class="sip-end-btn" data-action="endSleepNow" data-arg="">■ End Now</button>
      <button class="btn btn-ghost" style="font-size:var(--fs-xs);padding:4px 8px;" data-action="cancelSleepInProgress">&times;</button>
    </div>`;
  }

  banner.style.display = '';
  updateElapsed();

  if (_sipInterval) clearInterval(_sipInterval);
  _sipInterval = setInterval(updateElapsed, 30000); // update every 30s
}

function editSleepEntry(idx) {
  const entry = sleepData[idx];
  if (!entry) return;
  _sleepEditIdx = idx;

  if (entry.type === 'night') {
    document.getElementById('sleepDate').value = entry.date;
    document.getElementById('sleepBedtime').value = entry.bedtime;
    document.getElementById('sleepWakeTime').value = entry.wakeTime;
    document.getElementById('sleepNotes').value = entry.notes || '';
    _wakeCount = getWakeCount(entry);
    document.getElementById('wakeCountVal').textContent = _wakeCount;
    adjustWakeCount(0); // update label
    updateSleepDayLabel('sleepDate', 'sleepDayLabel');
    const btn = document.getElementById('sleepSaveBtn');
    btn.innerHTML = zi('check') + ' Update Sleep Log';
    document.getElementById('sleepCancelBtn').style.display = '';
    document.getElementById('sleepNightCard').scrollIntoView({ behavior:'smooth', block:'start' });
  } else {
    document.getElementById('napDate').value = entry.date;
    document.getElementById('napStart').value = entry.bedtime;
    document.getElementById('napEnd').value = entry.wakeTime;
    document.getElementById('napNotes').value = entry.notes || '';
    const btn = document.getElementById('napSaveBtn');
    btn.textContent = '✓ Update Nap';
    document.getElementById('napCancelBtn').style.display = '';
    document.getElementById('sleepNapCard').scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

function cancelSleepEdit(type) {
  _sleepEditIdx = null;
  resetSleepForm(type);
}

function resetSleepForm(type) {
  if (type === 'night') {
    document.getElementById('sleepBedtime').value = '';
    document.getElementById('sleepWakeTime').value = '';
    document.getElementById('sleepNotes').value = '';
    _wakeCount = 0;
    document.getElementById('wakeCountVal').textContent = '0';
    const labelEl = document.getElementById('wakeCountLabel');
    if (labelEl) labelEl.textContent = 'No wake-ups';
    const btn = document.getElementById('sleepSaveBtn');
    btn.textContent = 'Save Sleep Log';
    document.getElementById('sleepCancelBtn').style.display = 'none';
  } else {
    document.getElementById('napStart').value = '';
    document.getElementById('napEnd').value = '';
    document.getElementById('napNotes').value = '';
    const btn = document.getElementById('napSaveBtn');
    btn.textContent = 'Save Nap';
    document.getElementById('napCancelBtn').style.display = 'none';
  }
  _sleepEditIdx = null;
}

function deleteSleepEntry(idx) {
  confirmAction('Delete this sleep entry?', () => {
    const wasEditingThis = _sleepEditIdx === idx;
    const wasEditingLater = _sleepEditIdx !== null && _sleepEditIdx > idx;
    sleepData.splice(idx, 1);
    save(KEYS.sleep, sleepData);
    // Handle edit state
    if (wasEditingThis) {
      // Was editing the deleted entry — cancel edit
      const type = document.getElementById('sleepCancelBtn').style.display !== 'none' ? 'night' : 'nap';
      resetSleepForm(type);
    } else if (wasEditingLater) {
      // Was editing an entry after the deleted one — shift index down
      _sleepEditIdx--;
    }
    renderSleep();
    renderHomeSleep();
    setTimeout(drawSleepChart, 60);
  }, 'Delete');
}

// formatTimeShort → migrated to core.js

function updateSleepDayLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (!input || !label) return;
  if (!input.value) { label.textContent = ''; return; }
  const d = new Date(input.value + 'T00:00:00');
  if (isNaN(d)) { label.textContent = ''; return; }
  const todayStr = today();
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const ydStr = toDateStr(yd);
  let dayText = d.toLocaleDateString('en-IN', { weekday:'long' });
  if (input.value === todayStr) dayText = 'Today · ' + d.toLocaleDateString('en-IN', { weekday:'short' });
  else if (input.value === ydStr) dayText = 'Yesterday · ' + d.toLocaleDateString('en-IN', { weekday:'short' });
  label.textContent = dayText;
}

function renderSleep() {
  // Set default dates
  const dateEl = document.getElementById('sleepDate');
  const napDateEl = document.getElementById('napDate');
  if (dateEl && !dateEl.value) dateEl.value = today();
  if (napDateEl && !napDateEl.value) napDateEl.value = today();

  // Update day-of-week labels
  updateSleepDayLabel('sleepDate', 'sleepDayLabel');
  updateSleepDayLabel('napDate', 'napDayLabel');

  renderSleepInProgressBanner();
  renderSleepStats();
  renderSleepLog();
  renderSleepTips();
}

function renderSleepStats() {
  const el = document.getElementById('sleepStats');
  if (!el) return;

  const ageM = ageAt().months;
  const lastNight = getLastNightSleep();
  const todayNaps = getTodayNaps();
  const avgMin = getAvgSleep7d();

  // --- Last night pill ---
  let lastNightStr = '—';
  let lastNightColor = 'hsp-indigo';
  if (lastNight) {
    const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
    lastNightStr = `${dur.h}h ${dur.m}m`;
    const st = getSleepTargets(ageM);
    const targetNight = st.nightTarget;
    const okNight = st.nightMin;
    lastNightColor = dur.total >= targetNight ? 'hsp-sage' : dur.total >= okNight ? 'hsp-peach' : 'hsp-rose';
  }

  // --- Naps today pill ---
  const napTotalMin = todayNaps.reduce((sum, n) => sum + calcSleepDuration(n.bedtime, n.wakeTime).total, 0);
  const napH = Math.floor(napTotalMin / 60);
  const napM = napTotalMin % 60;
  const idealNaps = ageM <= 8 ? [2, 3] : [2];
  let napColor = 'hsp-indigo';
  if (todayNaps.length > 0) {
    napColor = idealNaps.includes(todayNaps.length) ? 'hsp-sage' :
      (todayNaps.length === 1 || todayNaps.length === 4) ? 'hsp-peach' : 'hsp-rose';
  }

  // --- 7-day avg pill ---
  const avgH = Math.floor(avgMin / 60);
  const avgM2 = avgMin % 60;
  let avgColor = 'hsp-indigo';
  if (avgMin > 0) {
    const targetTotal = ageM <= 8 ? 780 : 720; // 13h / 12h
    const okTotal = ageM <= 8 ? 600 : 540;     // 10h / 9h
    avgColor = avgMin >= targetTotal ? 'hsp-sage' : avgMin >= okTotal ? 'hsp-peach' : 'hsp-rose';
  }

  // --- Daily sleep score pill (today, or yesterday if no data today) ---
  let scoreToday = getDailySleepScore(today());
  if (!scoreToday) {
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    scoreToday = getDailySleepScore(toDateStr(yd));
  }
  const scoreVal = scoreToday ? `${scoreToday.emoji} ${scoreToday.score}` : '—';
  const scoreLabel = scoreToday ? (scoreToday.score >= 70 ? 'hsp-sage' : scoreToday.score >= 40 ? 'hsp-peach' : 'hsp-rose') : 'hsp-indigo';

  el.innerHTML = `
    <div class="home-stat-pill ${lastNightColor}" data-scroll-to="sleepLogCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-moon"/></svg></div>
      <div class="hsp-val">${lastNightStr}</div>
      <div class="hsp-label">Last night</div>
    </div>
    <div class="home-stat-pill ${napColor}" data-scroll-to="sleepNapCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-sleep"/></svg></div>
      <div class="hsp-val">${todayNaps.length > 0 ? napH + 'h ' + napM + 'm' : '—'}</div>
      <div class="hsp-label">${todayNaps.length} nap${todayNaps.length !== 1 ? 's' : ''} today</div>
    </div>
    <div class="home-stat-pill ${avgColor}" data-scroll-to="sleepChartCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-bars"/></svg></div>
      <div class="hsp-val">${avgMin > 0 ? avgH + 'h ' + avgM2 + 'm' : '—'}</div>
      <div class="hsp-label">7-day avg</div>
    </div>
    <div class="home-stat-pill ${scoreLabel}" data-scroll-to="sleepChartCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-star"/></svg></div>
      <div class="hsp-val">${scoreVal}</div>
      <div class="hsp-label">Daily score</div>
    </div>
  `;
  renderDomainHero('sleep');
}

let _sleepLogFilter = 'all';

function filterSleepLog(filter) {
  _sleepLogFilter = filter;
  ['all','night','nap'].forEach(f => {
    const btn = document.getElementById('sleepLogFilter-' + f);
    if (btn) btn.classList.toggle('active-sq', f === filter);
  });
  renderSleepLog();
}

function renderSleepLog() {
  const el = document.getElementById('sleepLogList');
  const countEl = document.getElementById('sleepLogCount');
  const previewEl = document.getElementById('sleepLogPreview');
  if (!el) return;

  const filtered = _sleepLogFilter === 'all' ? sleepData :
    sleepData.filter(s => s.type === _sleepLogFilter);
  const recent = filtered.slice(0, 20);

  // Counts
  const nightCount = sleepData.filter(s => s.type === 'night').length;
  const napCount = sleepData.filter(s => s.type === 'nap').length;
  if (countEl) countEl.textContent = `${nightCount} nights · ${napCount} naps`;

  // Preview (always visible, outside collapse)
  if (previewEl) {
    const lastNight = getLastNightSleep();
    const todayNaps = getTodayNaps();
    let previewHtml = '';
    if (lastNight) {
      const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
      const scoreBadge = getSleepScoreBadge(lastNight);
      const lastNightIdx = sleepData.indexOf(lastNight);
      const wakeN = getWakeCount(lastNight);
      const wakeTxt = wakeN > 0 ? ` · ${wakeN}× woke` : '';
      previewHtml += `<div class="info-strip is-indigo tappable" data-action="editSleepEntry" data-arg="${lastNightIdx}"><span><svg class="zi"><use href="#zi-moon"/></svg></span><div><strong class="tc-indigo">Last night: ${dur.h}h ${dur.m}m</strong>${scoreBadge ? ' ' + scoreBadge : ''}<div class="t-sub">${formatTimeShort(lastNight.bedtime)} → ${formatTimeShort(lastNight.wakeTime)} · ${formatDate(lastNight.date)}${wakeTxt}</div></div><span style="font-size:var(--icon-sm);color:var(--tc-indigo);flex-shrink:0;">Edit</span></div>`;
    }
    if (todayNaps.length > 0) {
      const napTotal = todayNaps.reduce((sum, n) => sum + calcSleepDuration(n.bedtime, n.wakeTime).total, 0);
      previewHtml += `<div class="info-strip is-lav tappable" style="margin-top:6px;cursor:pointer;" data-action="goToSleepLog"><span><svg class="zi"><use href="#zi-sleep"/></svg></span><div><strong class="tc-lav">${todayNaps.length} nap${todayNaps.length>1?'s':''} today · ${Math.floor(napTotal/60)}h ${napTotal%60}m</strong><div class="t-sub">Tap to view & edit logs</div></div><span class="t-lav" style="font-size:var(--fs-xs);">${zi('chart')}</span></div>`;
    }
    if (!lastNight && todayNaps.length === 0) {
      previewHtml = `<div class="info-strip is-neutral"><span><svg class="zi"><use href="#zi-moon"/></svg></span><div class="t-sub">No sleep entries yet</div></div>`;
    }
    previewEl.innerHTML = previewHtml;
  }

  // Full log (inside collapse)
  if (recent.length === 0) {
    el.innerHTML = `<div class="t-sub" style="text-align:center;padding:20px;">No ${_sleepLogFilter === 'all' ? '' : _sleepLogFilter + ' '}entries yet.</div>`;
    return;
  }

  el.innerHTML = recent.map((s, i) => {
    // Find real index in sleepData (not filtered)
    const realIdx = sleepData.indexOf(s);
    const dur = calcSleepDuration(s.bedtime, s.wakeTime);
    const napTypeIcons = { morning:zi('sun'), afternoon:zi('sun'), evening:zi('sun'), night:zi('moon') };
    const napTypeLabels = { morning:'Morning nap', afternoon:'Afternoon nap', evening:'Evening nap', night:'Night nap' };
    const typeIcon = s.type === 'night' ? zi('moon') : (napTypeIcons[s.napType] || zi('zzz'));
    const typeLabel = s.type === 'night' ? 'Night' : (napTypeLabels[s.napType] || 'Nap');
    const qualBadge = s.type === 'night' ? getSleepScoreBadge(s) : '';
    const wakeN = getWakeCount(s);
    const wakeBadge = (s.type === 'night' && wakeN > 0) ?
      `<span class="sleep-quality-badge sq-fair">${wakeN}× woke</span>` :
      (s.type === 'night' ? `<span class="sleep-quality-badge sq-good">slept through</span>` : '');
    const notesHtml = s.notes ? `<div class="t-sub">${escHtml(s.notes)}</div>` : '';
    // Color code: night = indigo, nap = lavender
    const cardBg = s.type === 'night' ? 'var(--indigo-light)' : 'var(--lav-light)';
    const cardBorder = s.type === 'night' ? 'rgba(155,168,216,0.3)' : 'rgba(201,184,232,0.3)';
    const timeColor = s.type === 'night' ? 'var(--tc-indigo)' : 'var(--tc-lav)';
    const durBg = s.type === 'night' ? 'rgba(155,168,216,0.25)' : 'rgba(201,184,232,0.25)';
    const durColor = s.type === 'night' ? 'var(--tc-indigo)' : 'var(--tc-lav)';
    return `
      <div class="sleep-entry-card" style="background:${cardBg};border-color:${cardBorder};">
        <div class="sleep-entry-header">
          <div data-action="editSleepEntry" data-arg="${realIdx}" style="cursor:pointer;flex:1;">
            <div class="sleep-entry-times" style="color:${timeColor};">${typeIcon} ${formatTimeShort(s.bedtime)} → ${formatTimeShort(s.wakeTime)}</div>
            <div class="sleep-entry-meta">
              <span class="t-sub">${formatDate(s.date)} · ${typeLabel}</span>
              ${qualBadge}
              ${wakeBadge}
            </div>
            ${_renderAttribution(s)}
          </div>
          <div class="d-flex items-center gap-4">
            <div class="sleep-entry-duration" style="background:${durBg};color:${durColor};">${dur.h}h ${dur.m}m</div>
            <button data-action="editSleepEntry" data-arg="${realIdx}" style="background:none;border:none;font-size:var(--icon-sm);color:${timeColor};padding:4px;cursor:pointer;" aria-label="Edit entry">Edit</button>
            <button data-action="deleteSleepEntry" data-arg="${realIdx}" class="btn-icon-delete" aria-label="Delete entry">&times;</button>
          </div>
        </div>
        ${notesHtml}
      </div>
    `;
  }).join('');
}

let _sleepChart = null;
function drawSleepChart() {
  const canvas = document.getElementById('sleepChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');

  // Last 7 days
  const labels = [];
  const nightData = [];
  const napData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    labels.push(d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric' }));

    const entries = getSleepForDate(ds);
    let nightMin = 0, napMin = 0;
    entries.forEach(s => {
      const dur = calcSleepDuration(s.bedtime, s.wakeTime);
      if (s.type === 'night') nightMin += dur.total;
      else napMin += dur.total;
    });
    nightData.push(+(nightMin / 60).toFixed(1));
    napData.push(+(napMin / 60).toFixed(1));
  }

  if (_sleepChart) _sleepChart.destroy();
  const _ct = getChartTheme();
  _sleepChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Night',
          data: nightData,
          backgroundColor: 'rgba(155,168,216,0.7)',
          borderRadius: _ct.barRadius,
          barPercentage: _ct.barPercentage,
        },
        {
          label: 'Naps',
          data: napData,
          backgroundColor: 'rgba(201,184,232,0.6)',
          borderRadius: _ct.barRadius,
          barPercentage: _ct.barPercentage,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position:'bottom', labels: { ..._ct.legend } },
        tooltip: {
          ..._ct.tooltip,
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}h`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display:false }, ticks: { color:_ct.textColor, font:_ct.font } },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 16,
          grid: { color:_ct.gridColor(0.15) },
          ticks: { color:_ct.textColor, font:_ct.font, callback: v => v + 'h' },
          title: { display:true, text:'Hours', color:_ct.textColor, font:_ct.font }
        }
      }
    }
  });

  // Insight text
  const insightEl = document.getElementById('sleepChartInsight');
  if (insightEl) {
    const avg = getAvgSleep7d();
    if (avg === 0) {
      insightEl.textContent = 'Start logging sleep to see trends here.';
    } else {
      const h = Math.floor(avg / 60);
      const m = avg % 60;
      const target = 14 * 60; // 14 hours recommended for 6-8 months
      const pct = Math.round((avg / target) * 100);
      insightEl.textContent = `7-day average: ${h}h ${m}m (${pct}% of recommended ~14h total for this age)`;
    }
  }
}

function renderSleepTips() {
  const el = document.getElementById('sleepTips');
  if (!el) return;

  const ageM = ageAt().months;

  // Categorised tips database — age-adaptive
  const categories = [
    {
      id: 'routine', icon: zi('book'), label: 'Bedtime Routine', color: 'lav',
      tips: ageM <= 8 ? [
        { icon:zi('moon'), title:'Bath → Massage → Feed → Story → Sleep', text:'A predictable 15–20 min routine signals wind-down. Keep the sequence the same every night — the predictability is what builds the sleep association.' },
        { icon:zi('clock'), title:'Ideal bedtime: 6:30–8:00 PM', text:'Most babies this age do best with an early bedtime. Watch for sleepy cues (eye rubbing, yawning, fussiness) — catching the window matters more than the clock.' },
        { icon:zi('moon'), title:'Screen-free zone', text:'No screens for at least 1 hour before bed. Blue light suppresses melatonin production even in infants.' },
        { icon:zi('star'), title:'Consistent sleep cue', text:'A specific lullaby, white noise pattern, or phrase ("time to sleep") used every night builds a strong association over time.' },
      ] : [
        { icon:zi('moon'), title:'Keep the routine consistent', text:'At 9–12 months, separation anxiety peaks. A strong, predictable routine provides security — same time ±15 minutes, same sequence.' },
        { icon:zi('clock'), title:'Ideal bedtime: 7:00–8:00 PM', text:'Slightly later than younger months. Watch for the second wind — if she gets past her sleep window, cortisol spikes make falling asleep harder.' },
        { icon:zi('book'), title:'Add a short book', text:'Board books before bed build both sleep associations and early literacy. 1–2 short books is perfect.' },
        { icon:zi('baby'), title:'Goodbye ritual', text:'A brief, warm goodbye ritual ("goodnight, I love you, see you in the morning") helps with separation anxiety at this age.' },
      ]
    },
    {
      id: 'environment', icon: zi('flame'), label: 'Sleep Environment', color: 'sky',
      tips: [
        { icon:zi('flame'), title:'Room temp: 20–22°C', text:'Overheating is a bigger risk than being cold. Dress in one more layer than you\'d wear. Feel the back of her neck — it should be warm, not sweaty.' },
        { icon:zi('moon'), title:'Darkness matters', text:'Use blackout curtains. Even small light leaks can disrupt melatonin. A dim red/orange night light is OK if needed for feeds — avoid white/blue light.' },
        { icon:zi('bell'), title:'White noise', text:'Consistent white noise (not music) at 50–65 dB helps mask household sounds. Place the machine across the room, not right next to the crib.' },
        { icon:zi('moon'), title:'Safe sleep surface', text:'Firm, flat mattress. No pillows, loose blankets, bumpers, or soft toys in the crib. Back sleeping position.' },
        { icon:zi('baby'), title:'Familiar scent', text:'A parent-scented cloth (worn against your skin for a day) placed near — but not in — the crib can be soothing. Remove before sleep for safety.' },
      ]
    },
    {
      id: 'naps', icon: zi('zzz'), label: 'Nap Guide', color: 'sage',
      tips: ageM <= 8 ? [
        { icon:zi('timer'), title:'Wake windows: 2–3 hours', text:'At 6–8 months, she can handle 2–3 hours of awake time between naps. First wake window is usually shortest (2h), last is longest (2.5–3h).' },
        { icon:zi('list'), title:'2–3 naps per day', text:'The third nap typically drops around 7–8 months. It\'s usually a short catnap (20–30 min) in the late afternoon.' },
        { icon:'⏱️', title:'Ideal nap lengths', text:'Morning nap: 1–1.5h. Afternoon nap: 1–2h. Third nap (if taken): 20–30 min. Short naps (<30 min) are common and not a problem if night sleep is solid.' },
        { icon:zi('warn'), title:'Don\'t force naps', text:'If she\'s not tired, 10–15 min of quiet time in the crib is fine. Forced naps create negative sleep associations.' },
      ] : [
        { icon:zi('timer'), title:'Wake windows: 3–4 hours', text:'At 9–12 months, awake windows stretch. First: 3h, second: 3.5h, before bed: 3.5–4h.' },
        { icon:zi('list'), title:'2 naps per day', text:'Most babies drop to 2 naps by 9 months. If the second nap is consistently refused, she may be ready for the 2-to-1 transition (usually around 12–15 months).' },
        { icon:'⏱️', title:'Ideal nap lengths', text:'Morning: 1–1.5h. Afternoon: 1–2h. Total daytime sleep: 2–3 hours. More than 3.5h of daytime sleep may steal from night sleep.' },
        { icon:zi('sun'), title:'Cap late naps', text:'End the last nap by 3:30–4:00 PM to protect bedtime. A nap that runs too late pushes bedtime and fragments the night.' },
      ]
    },
    {
      id: 'night', icon: zi('moon'), label: 'Night Sleep', color: 'indigo',
      tips: ageM <= 8 ? [
        { icon:zi('drop'), title:'Night feeds: 1–2 normal', text:'At 6–8 months, 1–2 feeds per night is developmentally normal. True hunger feeds are quick and business-like — she feeds and goes back to sleep easily.' },
        { icon:'⏳', title:'Pause before responding', text:'Wait 2–3 minutes before going in. Babies cycle through light sleep every 45–60 min and often self-settle with brief fussing.' },
        { icon:zi('bars'), title:'Target: 11–12h night', text:'Total night sleep should be 11–12 hours including wake-ups. If she\'s consistently getting less than 10h, the schedule may need adjusting.' },
        { icon:zi('hourglass'), title:'Split nights', text:'If she wakes for 1+ hour in the middle of the night, she may be getting too much daytime sleep or have too early a bedtime.' },
      ] : [
        { icon:zi('drop'), title:'Night weaning readiness', text:'By 9–12 months, most babies can sleep through without a feed. If she still wakes, it may be habit rather than hunger. Consult your pediatrician.' },
        { icon:zi('bars'), title:'Target: 11–12h night', text:'Total night sleep of 11–12 hours. Early morning waking (before 6 AM) often means bedtime is too late or too early — experiment in 15-min increments.' },
        { icon:zi('hourglass'), title:'Sleep regressions', text:'The 8–10 month regression is real — linked to crawling, pulling up, separation anxiety. It\'s temporary (2–4 weeks). Stay consistent with the routine.' },
        { icon:zi('moon'), title:'Self-settling', text:'The ability to fall asleep independently is the single biggest predictor of sleeping through the night. If she needs rocking/feeding to sleep, she\'ll need it at every wake-up.' },
      ]
    },
    {
      id: 'development', icon: zi('brain'), label: 'Sleep & Development', color: 'peach',
      tips: [
        { icon:zi('brain'), title:'Sleep fuels growth', text:'Growth hormone is primarily released during deep sleep. Consistent, adequate sleep directly supports physical growth, brain development, and immune function.' },
        { icon:zi('warn'), title:'Overtiredness spiral', text:'An overtired baby produces cortisol and adrenaline, making it harder to fall asleep and stay asleep. Catch sleepy cues early — prevention is easier than correction.' },
        { icon:zi('baby'), title:'Teething and sleep', text:'Teething can disrupt sleep for 2–3 days around each tooth. Offer a cold teether before bed. Pain relief (consult doctor) may help on rough nights — but don\'t blame every bad night on teething.' },
        { icon:zi('chart'), title:'Developmental leaps', text:'Major motor milestones (crawling, standing, walking) temporarily disrupt sleep. She may practice new skills in her sleep. This is normal and passes in 1–2 weeks.' },
        { icon:zi('flame'), title:'Illness recovery', text:'After illness, sleep patterns may take 1–2 weeks to normalise. Return to the pre-illness routine as soon as she\'s recovered — don\'t create new habits during sick days.' },
      ]
    },
    {
      id: 'safety', icon: zi('shield'), label: 'Safe Sleep', color: 'rose',
      tips: [
        { icon:zi('baby'), title:'Always on the back', text:'Place her on her back for every sleep. Once she can roll both ways independently, she can find her own position — but always start on the back.' },
        { icon:zi('warn'), title:'Nothing in the crib', text:'No pillows, blankets, bumpers, stuffed animals, or positioners. A fitted sheet on a firm mattress is all that\'s needed.' },
        { icon:zi('sprout'), title:'Air circulation', text:'A ceiling fan or gentle air circulation reduces SIDS risk. Keep the room ventilated but not drafty.' },
        { icon:zi('shield'), title:'Smoke-free environment', text:'No smoking in the house or around the baby. Secondhand and thirdhand smoke significantly increase SIDS risk.' },
      ]
    },
  ];

  // Render as collapsible category cards (same pattern as diet tips)
  let html = '<div class="fx-col g8">';
  const colorMap = { lav:'var(--lav-light)', sky:'var(--sky-light)', sage:'var(--sage-light)',
    indigo:'var(--indigo-light)', peach:'var(--peach-light)', rose:'var(--rose-light)' };
  const textColorMap = { lav:'var(--tc-lav)', sky:'var(--tc-sky)', sage:'var(--tc-sage)',
    indigo:'var(--tc-indigo)', peach:'var(--tc-caution)', rose:'var(--tc-rose)' };

  categories.forEach(cat => {
    const bg = colorMap[cat.color] || 'var(--indigo-light)';
    const tc = textColorMap[cat.color] || 'var(--tc-indigo)';
    const catId = 'sleepGuide-' + cat.id;
    html += `
      <div>
        <div style="padding:10px 14px;border-radius:var(--r-lg);background:${bg};cursor:pointer;display:flex;align-items:center;gap:var(--sp-8);justify-content:space-between;" data-collapse-target="${catId}-items" data-collapse-chevron="${catId}-chev">
          <div class="d-flex items-center gap-8">
            <span style="font-size:var(--icon-md);">${cat.icon}</span>
            <div>
              <div style="font-weight:600;font-size:var(--fs-base);color:${tc};">${cat.label}</div>
              <div class="t-sub">${cat.tips.length} tips</div>
            </div>
          </div>
          <span class="collapse-chevron" id="${catId}-chev">▾</span>
        </div>
        <div id="${catId}-items" style="display:none;padding:8px 0;">
          ${cat.tips.map(t => `
            <div style="display:flex;gap:var(--sp-12);align-items:flex-start;padding:8px 12px;border-radius:var(--r-lg);background:${bg};margin-top:4px;">
              <span class="t-icon shrink-0">${t.icon}</span>
              <div>
                <div style="font-weight:600;font-size:var(--fs-sm);color:${tc};">${t.title}</div>
                <div class="t-sub" style="line-height:var(--lh-relaxed);">${t.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
  // Re-bind collapse listeners on dynamically created elements
  el.querySelectorAll('[data-collapse-target]').forEach(function(hdr) {
    hdr.addEventListener('click', function() { toggleHistoryCard(hdr.dataset.collapseTarget, hdr.dataset.collapseChevron); });
  });
}

function renderHomeSleep() {
  const card = document.getElementById('homeSleepCard');
  const el = document.getElementById('homeSleepContent');
  if (!card || !el) return;

  const lastNight = getLastNightSleep();
  const todayNaps = getTodayNaps();

  // Check for in-progress sleep/nap
  const ipRaw = localStorage.getItem(SLEEP_INPROGRESS_KEY);
  const hasInProgress = !!ipRaw;

  if (!lastNight && todayNaps.length === 0 && !hasInProgress) {
    card.style.display = '';
    el.innerHTML = `<div class="info-strip is-indigo tappable" data-tab="sleep">
      <span><svg class="zi"><use href="#zi-moon"/></svg></span>
      <div><strong class="tc-indigo">No sleep logged yet</strong>
      <div class="t-sub">Tap to start tracking Ziva's sleep</div></div>
    </div>`;
    return;
  }

  card.style.display = '';
  let html = '';

  // In-progress banner on Home
  if (hasInProgress) {
    const ip = JSON.parse(ipRaw);
    const started = new Date(ip.startTs);
    const diffMs = Date.now() - started.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    const elapsed = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
    const label = ip.type === 'night' ? '' + zi('moon') + ' Sleep' : zi('zzz') + ' Nap';
    html += `<div class="sip-banner" style="margin-bottom:8px;">
      <div class="sip-pulse"></div>
      <div>
        <div class="t-sm" style="font-weight:600;color:var(--tc-indigo);">${label} in progress · ${elapsed}</div>
        <div class="t-xs t-light">Since ${formatTimeShort(ip.startTime)}</div>
      </div>
      <button class="sip-end-btn" data-action="endSleepNow" data-arg="">■ End</button>
    </div>`;
  }

  if (lastNight) {
    const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
    const sc = calcSleepScore(lastNight);
    const scoreBadge = getSleepScoreBadge(lastNight);
    const noteTxt = lastNight.notes ? ` · ${escHtml(lastNight.notes)}` : '';
    html += `<div class="info-strip is-indigo">
      <span><svg class="zi"><use href="#zi-moon"/></svg></span>
      <div><strong class="tc-indigo">${dur.h}h ${dur.m}m night sleep</strong>${scoreBadge ? ' ' + scoreBadge : ''}
      <div class="t-sub">${formatTimeShort(lastNight.bedtime)} → ${formatTimeShort(lastNight.wakeTime)} · ${formatDate(lastNight.date)}${noteTxt}</div></div>
    </div>`;
  }

  if (todayNaps.length > 0) {
    const napTotal = todayNaps.reduce((sum, n) => sum + calcSleepDuration(n.bedtime, n.wakeTime).total, 0);
    const nh = Math.floor(napTotal / 60);
    const nm = napTotal % 60;
    const napDetails = todayNaps.map(n => formatTimeShort(n.bedtime) + '–' + formatTimeShort(n.wakeTime)).join(', ');
    html += `<div class="info-strip is-indigo mt-6">
      <span><svg class="zi"><use href="#zi-sleep"/></svg></span>
      <div><strong class="tc-indigo">${todayNaps.length} nap${todayNaps.length>1?'s':''} · ${nh}h ${nm}m</strong>
      <div class="t-sub">${napDetails}</div></div>
    </div>`;
  } else {
    html += `<div class="info-strip is-indigo" style="margin-top:6px;opacity:0.6;">
      <span><svg class="zi"><use href="#zi-sleep"/></svg></span>
      <div class="t-sub">No naps logged today</div>
    </div>`;
  }

  // Show tips if last night scored poor (<40)
  if (lastNight) {
    const sc = calcSleepScore(lastNight);
    if (sc && sc.label === 'poor') {
      const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
      const tips = [];
      if (dur.total < 9 * 60) {
        tips.push({ icon:zi('timer'), text:'Short night sleep can signal overtiredness. Try moving bedtime 15–30 min earlier tonight.' });
      }
      tips.push({ icon:zi('flame'), text:'Check room temp (20–22°C) and ensure the room is dark. Even small light leaks disrupt sleep cycles.' });
      tips.push({ icon:zi('book'), text:'A consistent 15–20 min wind-down routine (bath → massage → feed → story) helps signal sleep time.' });
      const [bh] = (lastNight.bedtime || '20:00').split(':').map(Number);
      if (bh >= 21 || bh < 6) {
        tips.push({ icon:zi('clock'), text:'Late bedtime detected. Babies this age do best with bedtime between 7–8 PM — earlier often means better sleep.' });
      }

      html += `<div style="margin-top:8px;padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--peach-light);border-left:var(--accent-w) solid var(--peach);">
        <div style="font-size:var(--fs-sm);font-weight:600;color:var(--tc-caution);margin-bottom:6px;">${zi('bulb')} Tips for tonight (score: ${sc.score}/100)</div>
        ${tips.map(t => `<div style="display:flex;gap:var(--sp-8);align-items:flex-start;margin-bottom:4px;">
          <span style="font-size:var(--icon-sm);flex-shrink:0;">${t.icon}</span>
          <div class="t-sub" style="line-height:var(--lh-normal);">${t.text}</div>
        </div>`).join('')}
      </div>`;
    }
  }

  el.innerHTML = html;
}

function renderSleepHistoryPreview() {
  const el = document.getElementById('sleepHistPreview');
  if (!el) return;

  const lastNight = getLastNightSleep();
  if (lastNight) {
    const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
    const sc = calcSleepScore(lastNight);
    const scoreTxt = sc ? ` · ${sc.emoji} ${sc.score}` : '';
    el.innerHTML = `<div class="info-strip is-indigo">
      <span><svg class="zi"><use href="#zi-moon"/></svg></span>
      <div><strong class="tc-indigo">Last night: ${dur.h}h ${dur.m}m${scoreTxt}</strong>
      <div class="t-sub">${formatDate(lastNight.date)} · ${formatTimeShort(lastNight.bedtime)} → ${formatTimeShort(lastNight.wakeTime)} · ${sleepData.length} total entries</div></div>
    </div>`;
  } else {
    el.innerHTML = `<div class="info-strip is-neutral">
      <span><svg class="zi"><use href="#zi-moon"/></svg></span>
      <div class="t-mid">No sleep data logged yet</div>
    </div>`;
  }

  // Full history
  const bodyEl = document.getElementById('sleepHistoryContent');
  if (!bodyEl) return;

  if (sleepData.length === 0) {
    bodyEl.innerHTML = `<div class="t-sub" style="text-align:center;padding:16px;">No entries yet.</div>`;
    return;
  }

  // Group by date
  const grouped = {};
  sleepData.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  bodyEl.innerHTML = dates.map(date => {
    const entries = grouped[date];
    const dayTotal = getDailyTotalSleep(date);
    const dtH = Math.floor(dayTotal / 60);
    const dtM = dayTotal % 60;
    const rows = entries.map(s => {
      const dur = calcSleepDuration(s.bedtime, s.wakeTime);
      const icon = s.type === 'night' ? zi('moon') : zi('zzz');
      const qual = s.type === 'night' ? getSleepScoreBadge(s) : '';
      const note = s.notes ? `<span class="t-sub"> · ${escHtml(s.notes)}</span>` : '';
      return `<div style="display:flex;align-items:center;gap:var(--sp-8);padding:4px 0;flex-wrap:wrap;">
        <span>${icon}</span>
        <span style="font-size:var(--fs-base);">${formatTimeShort(s.bedtime)} → ${formatTimeShort(s.wakeTime)}</span>
        <span class="sleep-entry-duration">${dur.h}h ${dur.m}m</span>
        ${qual}${note}
        ${_renderAttribution(s)}
      </div>`;
    }).join('');
    return `<div style="padding:8px 0;border-bottom:1px solid var(--indigo-light);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:var(--fs-base);color:var(--tc-indigo);">${formatDate(date)} · ${ageAtDate(date)}</strong>
        <span class="t-sub">${dtH}h ${dtM}m total</span>
      </div>
      ${rows}
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────

// POOP INTELLIGENCE — 8 Features
// ════════════════════════════════════════

// ── Helper: gather poop entries for a window ──
function _piGetPoops(windowDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = toDateStr(cutoff);
  return poopData.filter(p => p.date && p.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
}

// ── Helper: poop color hex values ──
const POOP_COLOR_HEX = {
  yellow: '#e8c84a', green: '#6aa84f', brown: '#8B6914', dark: '#5a4a2a',
  orange: '#e8913a', red: '#d04040', white: '#e0ddd4', black: '#2a2a2a'
};

// ── Feature 1: Consistency Trend ──

function computeConsistencyTrend(windowDays) {
  windowDays = windowDays || 14;
  const entries = _piGetPoops(windowDays);
  const CON_SCALE = { runny: 1, loose: 1, watery: 1, soft: 2, normal: 3, hard: 4, pellets: 5, pellet: 5 };
  // Group by date
  const dayMap = {};
  entries.forEach(p => {
    if (!dayMap[p.date]) dayMap[p.date] = [];
    dayMap[p.date].push(p);
  });
  const days = Object.keys(dayMap).sort();
  if (days.length < 5) return { insufficient: true, count: days.length, needed: 5 };

  // Daily avg consistency score
  const dailyScores = days.map(d => {
    const vals = dayMap[d].map(p => CON_SCALE[p.consistency] ?? 3);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { dateStr: d, avg, count: vals.length };
  });

  // Split into recent 7d vs previous 7d
  const recent = dailyScores.slice(-7);
  const previous = dailyScores.slice(0, -7);
  const recentAvg = recent.reduce((s, d) => s + d.avg, 0) / recent.length;
  const prevAvg = previous.length > 0 ? previous.reduce((s, d) => s + d.avg, 0) / previous.length : recentAvg;

  // Trend direction
  const delta = recentAvg - prevAvg;
  let trend = 'stable';
  if (delta >= 0.5) trend = 'firming';
  else if (delta <= -0.5) trend = 'loosening';

  // Std deviation for "mixed" detection
  const allVals = dailyScores.map(d => d.avg);
  const mean = allVals.reduce((s, v) => s + v, 0) / allVals.length;
  const stdDev = Math.sqrt(allVals.reduce((s, v) => s + (v - mean) * (v - mean), 0) / allVals.length);
  if (stdDev > 1.5) trend = 'mixed';

  // Alert: 5+ consecutive days firming/loosening
  let consecutiveFirm = 0, consecutiveLoose = 0, firmAlert = false, looseAlert = false;
  dailyScores.forEach(d => {
    if (d.avg >= 3.5) { consecutiveFirm++; consecutiveLoose = 0; }
    else if (d.avg <= 2.0) { consecutiveLoose++; consecutiveFirm = 0; }
    else { consecutiveFirm = 0; consecutiveLoose = 0; }
    if (consecutiveFirm >= 5) firmAlert = true;
    if (consecutiveLoose >= 5) looseAlert = true;
  });

  // Most common consistency
  const conCounts = {};
  entries.forEach(p => { conCounts[p.consistency] = (conCounts[p.consistency] || 0) + 1; });
  const mostCommon = Object.entries(conCounts).sort((a, b) => b[1] - a[1])[0];

  // Consistency color map for bars
  const CON_COLORS = { runny: 'var(--tc-sky)', loose: 'var(--tc-sky)', watery: 'var(--tc-sky)', soft: 'var(--tc-sage)', normal: '#6fcf97', hard: 'var(--tc-amber)', pellets: 'var(--tc-danger)', pellet: 'var(--tc-danger)' };

  // Per-day consistency distribution (for stacked bar)
  const dayDistributions = dailyScores.map(d => {
    const dist = {};
    dayMap[d.dateStr].forEach(p => { dist[p.consistency] = (dist[p.consistency] || 0) + 1; });
    const total = dayMap[d.dateStr].length;
    return { dateStr: d.dateStr, dist, total };
  });

  const CON_LABEL = { runny: 'Runny', loose: 'Loose', watery: 'Watery', soft: 'Soft', normal: 'Normal', hard: 'Hard', pellets: 'Pellets', pellet: 'Pellets' };
  const avgLabel = recentAvg <= 1.5 ? 'Runny' : recentAvg <= 2.5 ? 'Soft' : recentAvg <= 3.5 ? 'Normal' : recentAvg <= 4.5 ? 'Hard' : 'Pellets';

  return {
    insufficient: false, trend, recentAvg: +recentAvg.toFixed(1), prevAvg: +prevAvg.toFixed(1),
    avgLabel, mostCommon: mostCommon ? mostCommon[0] : 'normal', stdDev: +stdDev.toFixed(1),
    firmAlert, looseAlert, dailyScores, dayDistributions, conCounts,
    CON_COLORS, CON_LABEL, count: days.length
  };
}

function renderInfoPoopConsistencyTrend() {
  const summaryEl = document.getElementById('infoPoopConsistencySummary');
  const barsEl = document.getElementById('infoPoopConsistencyBars');
  const insightEl = document.getElementById('infoPoopConsistencyInsights');
  if (!summaryEl) return;

  const data = computeConsistencyTrend();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need 5 days of data (have ' + data.count + ')</div>';
    if (barsEl) barsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const trendIcon = data.trend === 'firming' ? '↗' : data.trend === 'loosening' ? '↘' : data.trend === 'mixed' ? '↕' : '→';
  const trendColor = (data.trend === 'firming' || data.trend === 'loosening') ? 'var(--tc-amber)' : data.trend === 'mixed' ? 'var(--tc-caution)' : 'var(--tc-sage)';
  const trendLabel = data.trend.charAt(0).toUpperCase() + data.trend.slice(1);
  summaryEl.innerHTML = '<div class="t-sm"><span style="color:' + trendColor + ';font-weight:600;">' + trendIcon + ' ' + trendLabel + '</span> · avg consistency: <strong>' + data.avgLabel + '</strong></div>';

  if (barsEl) {
    let html = '<div class="si-sub-label mb-4" >Daily consistency</div>';
    const displayDays = data.dayDistributions.slice(-10);
    const conOrder = ['runny', 'watery', 'loose', 'soft', 'normal', 'hard', 'pellets', 'pellet'];
    displayDays.forEach(d => {
      const dayLabel = formatDate(d.dateStr).slice(0, 6);
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + dayLabel + '</div>';
      html += '<div class="si-bar-track" style="display:flex;overflow:hidden;">';
      conOrder.forEach(con => {
        const count = d.dist[con] || 0;
        if (count === 0) return;
        const pct = (count / d.total) * 100;
        html += '<div style="width:' + pct + '%;height:100%;background:' + data.CON_COLORS[con] + ';"></div>';
      });
      html += '</div>';
      html += '<div class="si-bar-val" style="font-size:var(--fs-2xs);color:var(--light);">' + d.total + '</div>';
      html += '</div>';
    });

    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val t-amber" >' + data.recentAvg + '</div><div class="si-stat-label">Recent avg</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val t-light" >' + data.prevAvg + '</div><div class="si-stat-label">Previous avg</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + (data.CON_LABEL[data.mostCommon] || data.mostCommon) + '</div><div class="si-stat-label">Most common</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.count + '</div><div class="si-stat-label">Days tracked</div></div>';
    html += '</div>';
    barsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.firmAlert) {
      html += '<div class="si-insight si-insight-warn">Consistency has been firming over the past week. Try more fluids and fibre-rich foods (pear, prune, oats).</div>';
    } else if (data.looseAlert) {
      html += '<div class="si-insight si-insight-warn">Stools have been getting looser. Check for new foods, teething, or possible infection.</div>';
    } else if (data.trend === 'mixed') {
      html += '<div class="si-insight si-insight-info">Consistency has been quite variable — check if specific foods are causing swings.</div>';
    } else {
      html += '<div class="si-insight si-insight-good">Consistency has been stable and healthy — great digestive balance.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 2: Frequency Pattern ──

function computePoopFrequencyPattern(windowDays) {
  windowDays = windowDays || 14;
  const entries = _piGetPoops(windowDays);
  // Build daily counts
  const dayCounts = {};
  const dayTimes = {};
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    dayCounts[ds] = 0;
    dayTimes[ds] = [];
  }
  entries.forEach(p => {
    if (dayCounts[p.date] !== undefined) {
      dayCounts[p.date]++;
      if (p.time) dayTimes[p.date].push(p.time);
    }
  });
  const days = Object.keys(dayCounts).sort();
  const counts = days.map(d => dayCounts[d]);
  const daysWithData = counts.filter(c => c > 0).length;
  if (daysWithData < 5) return { insufficient: true, count: daysWithData, needed: 5 };

  // Averages
  const avg7d = counts.slice(-7).reduce((s, v) => s + v, 0) / 7;
  const avg14d = counts.reduce((s, v) => s + v, 0) / windowDays;

  // Time-of-day buckets
  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  Object.values(dayTimes).forEach(times => {
    times.forEach(t => {
      const h = parseInt(t.split(':')[0], 10);
      if (h >= 5 && h < 11) buckets.morning++;
      else if (h >= 11 && h < 16) buckets.afternoon++;
      else if (h >= 16 && h < 21) buckets.evening++;
      else buckets.night++;
    });
  });
  const totalBucket = Object.values(buckets).reduce((s, v) => s + v, 0);
  const mostCommonTime = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];

  // Variability
  const meanCount = counts.reduce((s, v) => s + v, 0) / counts.length;
  const stdDev = Math.sqrt(counts.reduce((s, v) => s + (v - meanCount) * (v - meanCount), 0) / counts.length);
  const zeroDays = counts.filter(c => c === 0).length;
  const regularity = Math.max(0, Math.min(100, Math.round(100 - stdDev * 20 - zeroDays * 10)));

  // Longest gap
  let longestGapH = 0;
  for (let i = 1; i < entries.length; i++) {
    const prev = new Date(entries[i - 1].date + 'T' + (entries[i - 1].time || '12:00'));
    const curr = new Date(entries[i].date + 'T' + (entries[i].time || '12:00'));
    const gapH = (curr - prev) / 3600000;
    if (gapH > longestGapH) longestGapH = gapH;
  }

  // Alerts
  const lastPoop = getLastPoop();
  let gapAlert = false, gapHours = 0;
  if (lastPoop) {
    const lastTs = new Date(lastPoop.date + 'T' + (lastPoop.time || '12:00'));
    gapHours = Math.round((Date.now() - lastTs.getTime()) / 3600000);
    if (gapHours >= 48) gapAlert = true;
  }

  const todayCount = dayCounts[today()] || 0;
  const highCountAlert = todayCount >= 4;

  const freqTrend = avg14d > 0 && avg7d < avg14d - 0.5 ? 'dropping' : avg7d > avg14d + 0.5 ? 'increasing' : 'stable';

  return {
    insufficient: false, avg7d: +avg7d.toFixed(1), avg14d: +avg14d.toFixed(1),
    buckets, totalBucket, mostCommonTime, regularity, longestGapH: Math.round(longestGapH),
    zeroDays, gapAlert, gapHours, highCountAlert, todayCount, freqTrend,
    dayCounts, days, count: daysWithData
  };
}

function renderInfoPoopFrequency() {
  const summaryEl = document.getElementById('infoPoopFrequencySummary');
  const barsEl = document.getElementById('infoPoopFrequencyBars');
  const insightEl = document.getElementById('infoPoopFrequencyInsights');
  if (!summaryEl) return;

  const data = computePoopFrequencyPattern();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need 5 days of data (have ' + data.count + ')</div>';
    if (barsEl) barsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const timeLabel = data.mostCommonTime.charAt(0).toUpperCase() + data.mostCommonTime.slice(1);
  summaryEl.innerHTML = '<div class="t-sm">Avg <strong>' + data.avg7d + '</strong>/day · Most common: <strong>' + timeLabel + '</strong> · Regularity: <strong>' + data.regularity + '%</strong></div>';

  if (barsEl) {
    let html = '';
    // Time-of-day distribution
    html += '<div class="si-sub-label mb-4" >Time of day</div>';
    const bucketLabels = { morning: zi('sun') + ' Morning', afternoon: zi('sun') + ' Afternoon', evening: zi('sun') + ' Evening', night: '' + zi('moon') + ' Night' };
    html += '<div class="si-stat-grid">';
    Object.entries(data.buckets).forEach(([k, v]) => {
      const pct = data.totalBucket > 0 ? Math.round((v / data.totalBucket) * 100) : 0;
      html += '<div class="si-stat"><div class="si-stat-val t-amber" >' + pct + '%</div><div class="si-stat-label">' + bucketLabels[k] + '</div></div>';
    });
    html += '</div>';

    // Daily count bars
    html += '<div class="si-sub-label fe-section-gap" >Daily poops</div>';
    const displayDays = data.days.slice(-10);
    const maxCount = Math.max(...displayDays.map(d => data.dayCounts[d]), 1);
    displayDays.forEach(d => {
      const count = data.dayCounts[d];
      const pct = Math.max(4, (count / maxCount) * 100);
      const color = count === 0 ? 'var(--tc-danger)' : count >= 4 ? 'var(--tc-caution)' : 'var(--tc-amber)';
      const dayLabel = formatDate(d).slice(0, 6);
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + dayLabel + '</div>';
      html += '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + pct + '%;background:' + color + ';"></div></div>';
      html += '<div class="si-bar-val" style="color:' + color + ';">' + count + '</div>';
      html += '</div>';
    });

    // Stats
    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.avg7d + '</div><div class="si-stat-label">7d avg</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.avg14d + '</div><div class="si-stat-label">14d avg</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.longestGapH + 'h</div><div class="si-stat-label">Longest gap</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.zeroDays + '</div><div class="si-stat-label">Zero days</div></div>';
    html += '</div>';
    barsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.gapAlert) {
      html += '<div class="si-insight si-insight-warn">It\'s been ' + data.gapHours + ' hours since the last poop. Watch for straining or discomfort.</div>';
    }
    if (data.highCountAlert) {
      html += '<div class="si-insight si-insight-warn">' + data.todayCount + ' poops today — monitor for diarrhoea signs.</div>';
    }
    if (data.freqTrend === 'dropping') {
      html += '<div class="si-insight si-insight-info">Frequency has dropped from ' + data.avg14d + ' to ' + data.avg7d + '/day. Could be dietary — check fibre intake.</div>';
    }
    if (data.regularity >= 70 && !data.gapAlert && !data.highCountAlert) {
      html += '<div class="si-insight si-insight-good">Ziva has a regular pattern — most poops happen in the ' + data.mostCommonTime + '.</div>';
    } else if (data.regularity < 50 && !data.gapAlert && !data.highCountAlert) {
      html += '<div class="si-insight si-insight-info">Poop timing is unpredictable. This is normal at this age but watch for discomfort.</div>';
    } else if (!data.gapAlert && !data.highCountAlert && data.freqTrend !== 'dropping') {
      html += '<div class="si-insight si-insight-info">Moderate regularity — Ziva\'s pattern is developing. Avg ' + data.avg7d + '/day.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 3: Food-Poop Delay ──

function computeFoodPoopDelay(windowDays) {
  windowDays = windowDays || 30;
  const correlations = computeFoodPoopCorrelations();
  if (!correlations || !correlations.results || correlations.results.length === 0) {
    return { insufficient: true, reason: 'no-correlations' };
  }

  const flagged = correlations.results.filter(r => r.status === 'watch' || r.status === 'suspected' || r.status === 'likely');
  if (flagged.length === 0) return { insufficient: true, reason: 'no-flagged' };

  const MEAL_ESTIMATES = { breakfast: '08:00', lunch: '12:00', dinner: '18:00', snack: '15:00' };
  const foodDelays = [];
  let allDelays = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);
  const cutoffStr = toDateStr(cutoffDate);

  flagged.forEach(corr => {
    const foodName = corr.food;
    const delays = [];
    const consistencies = {};

    // Find all dates food was eaten (within window)
    Object.keys(feedingData).forEach(dateStr => {
      if (dateStr < cutoffStr) return;
      const entry = feedingData[dateStr];
      if (!entry) return;
      let foundMeal = null;
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        const val = entry[meal];
        if (!val) return;
        const normalized = val.split(/[,+]/).map(f => normalizeFoodName(f.trim()));
        if (normalized.includes(normalizeFoodName(foodName))) foundMeal = meal;
      });
      if (!foundMeal) return;

      // Estimate food time
      const foodTime = entry[foundMeal + 'Time'] || MEAL_ESTIMATES[foundMeal];

      // Find poops 6–48h after
      const foodTs = new Date(dateStr + 'T' + foodTime).getTime();
      const minTs = foodTs + 6 * 3600000;
      const maxTs = foodTs + 48 * 3600000;

      poopData.forEach(p => {
        if (!p.date) return;
        const poopTs = new Date(p.date + 'T' + (p.time || '12:00')).getTime();
        if (poopTs >= minTs && poopTs <= maxTs) {
          const delayH = (poopTs - foodTs) / 3600000;
          delays.push(delayH);
          allDelays.push(delayH);
          if (p.consistency) consistencies[p.consistency] = (consistencies[p.consistency] || 0) + 1;
        }
      });
    });

    if (delays.length >= 2) {
      const avgDelay = delays.reduce((s, v) => s + v, 0) / delays.length;
      const minDelay = Math.min(...delays);
      const maxDelay = Math.max(...delays);
      const usualCon = Object.entries(consistencies).sort((a, b) => b[1] - a[1])[0];
      foodDelays.push({
        food: foodName, avgDelayH: +avgDelay.toFixed(1), minDelayH: +minDelay.toFixed(1),
        maxDelayH: +maxDelay.toFixed(1), usualConsistency: usualCon ? usualCon[0] : 'normal',
        occurrences: delays.length, status: corr.status
      });
    }
  });

  if (foodDelays.length === 0) return { insufficient: true, reason: 'no-delay-data' };

  const globalAvg = allDelays.length > 0 ? +(allDelays.reduce((s, v) => s + v, 0) / allDelays.length).toFixed(1) : 0;
  foodDelays.sort((a, b) => a.avgDelayH - b.avgDelayH);
  const fastest = foodDelays[0];
  const slowest = foodDelays[foodDelays.length - 1];

  return { insufficient: false, foodDelays, globalAvg, fastest, slowest, count: foodDelays.length };
}

function renderInfoPoopFoodDelay() {
  // Polish-1: defense-in-depth + perf gate — Info tab is CSS-hidden in
  // essential-mode (styles.css: body.essential-mode .tab-btn[aria-label="Info tab"]
  // { display:none; }) so the rendered output is unreachable to the user.
  // JS-layer early-return saves the wasted CPU and backs the CSS gate.
  // Defense-in-depth, not user-visible parity (see charter §6 P-5 for the
  // broader 19-renderer audit deferred to Stability sub-phase candidate).
  if (typeof isEssentialMode === 'function' && isEssentialMode()) return;
  const summaryEl = document.getElementById('infoPoopFoodDelaySummary');
  const listEl = document.getElementById('infoPoopFoodDelayList');
  const insightEl = document.getElementById('infoPoopFoodDelayInsights');
  if (!summaryEl) return;

  const data = computeFoodPoopDelay();
  if (data.insufficient) {
    const msg = data.reason === 'no-correlations' ? 'Need food-poop correlation data first' :
      data.reason === 'no-flagged' ? 'No flagged foods detected — all clear' : 'Need more food-poop pairs for delay analysis';
    summaryEl.innerHTML = '<div class="si-nodata">' + msg + '</div>';
    if (listEl) listEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  summaryEl.innerHTML = '<div class="t-sm">Avg gut transit: <strong>~' + data.globalAvg + 'h</strong> · <strong>' + data.count + '</strong> foods tracked</div>';

  if (listEl) {
    let html = '';
    data.foodDelays.forEach(fd => {
      const statusIcon = fd.status === 'likely' ? '●' : fd.status === 'suspected' ? zi('warn') : '●';
      const conLabel = fd.usualConsistency.charAt(0).toUpperCase() + fd.usualConsistency.slice(1);
      html += '<div class="si-factor-row">';
      html += '<div class="si-factor-icon">' + statusIcon + '</div>';
      html += '<div class="si-factor-text"><strong>' + escHtml(fd.food) + '</strong> → ' + conLabel + ' <span class="t-light">(' + fd.occurrences + '×)</span></div>';
      html += '<div class="si-factor-impact t-amber" >' + fd.minDelayH + '–' + fd.maxDelayH + 'h</div>';
      html += '</div>';
    });

    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val t-sage" >' + escHtml(data.fastest.food) + '</div><div class="si-stat-label">Fastest (~' + data.fastest.avgDelayH + 'h)</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val t-amber" >' + escHtml(data.slowest.food) + '</div><div class="si-stat-label">Slowest (~' + data.slowest.avgDelayH + 'h)</div></div>';
    html += '</div>';
    listEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    data.foodDelays.forEach(fd => {
      if (fd.status === 'likely' || fd.status === 'suspected') {
        html += '<div class="si-insight si-insight-warn">' + escHtml(fd.food) + ' correlates with ' + fd.usualConsistency + ' stools (' + fd.occurrences + '× observed) with ~' + fd.avgDelayH + 'h delay.</div>';
      }
    });
    if (!html) {
      html += '<div class="si-insight si-insight-info">Tracking food-to-poop timing for flagged foods. More data will improve accuracy.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 4: New Food Watch Window ──

function computeNewFoodWatch() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekAgoStr = toDateStr(weekAgo);

  // Find recently introduced foods
  const recentFoods = (foods || []).filter(f => f.date && f.date >= weekAgoStr);
  if (recentFoods.length === 0) return { insufficient: true, reason: 'no-new-foods' };

  const ABNORMAL_CON = ['hard', 'pellets', 'runny', 'watery'];
  const watches = [];

  recentFoods.forEach(food => {
    const introDate = new Date(food.date + 'T08:00:00');
    const windowEnd = new Date(introDate.getTime() + 72 * 3600000);
    const hoursElapsed = (now - introDate) / 3600000;
    const isOpen = hoursElapsed < 72;
    const hoursRemaining = Math.max(0, 72 - hoursElapsed);

    // Collect poops within the 72h window
    const windowPoops = poopData.filter(p => {
      if (!p.date) return false;
      const pTs = new Date(p.date + 'T' + (p.time || '12:00'));
      return pTs >= introDate && pTs <= windowEnd;
    });

    // Flag abnormals
    const abnormals = windowPoops.filter(p =>
      ABNORMAL_CON.includes(p.consistency) ||
      ['red', 'white', 'black'].includes(p.color) ||
      p.blood || p.mucus
    );

    let status = 'no-data';
    if (windowPoops.length > 0 && abnormals.length > 0) status = 'flagged';
    else if (windowPoops.length > 0 && abnormals.length === 0 && !isOpen) status = 'clear';
    else if (windowPoops.length > 0 && abnormals.length === 0 && isOpen) status = 'watching';
    else if (windowPoops.length === 0 && isOpen) status = 'watching';
    else if (windowPoops.length === 0 && !isOpen) status = 'no-data';

    const progressPct = Math.min(100, Math.round((hoursElapsed / 72) * 100));
    const normalPoops = windowPoops.length - abnormals.length;

    watches.push({
      name: food.name, introDate: food.date, status, isOpen,
      hoursElapsed: Math.round(hoursElapsed), hoursRemaining: Math.round(hoursRemaining),
      progressPct, totalPoops: windowPoops.length, normalPoops,
      abnormals: abnormals.map(p => ({ consistency: p.consistency, color: p.color })),
      reaction: food.reaction
    });
  });

  const active = watches.filter(w => w.isOpen);
  const resolved = watches.filter(w => !w.isOpen);

  return { insufficient: false, watches, active, resolved, count: watches.length };
}

function renderInfoPoopFoodWatch() {
  // Polish-1: defense-in-depth + perf gate — see renderInfoPoopFoodDelay
  // header for full rationale (Info tab CSS-hidden in essential-mode; JS gate
  // saves CPU + backs the CSS gate; broader 19-renderer audit deferred to
  // charter §6 P-5).
  if (typeof isEssentialMode === 'function' && isEssentialMode()) return;
  const summaryEl = document.getElementById('infoPoopFoodWatchSummary');
  const listEl = document.getElementById('infoPoopFoodWatchList');
  const insightEl = document.getElementById('infoPoopFoodWatchInsights');
  if (!summaryEl) return;

  const data = computeNewFoodWatch();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">No new foods introduced in the last 7 days</div>';
    if (listEl) listEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.active.length + '</strong> active watch(es) · <strong>' + data.resolved.length + '</strong> recently resolved</div>';

  if (listEl) {
    let html = '';
    // Active watches first
    if (data.active.length > 0) {
      html += '<div class="si-sub-label mb-4" >Active</div>';
      data.active.forEach(w => {
        const icon = w.status === 'flagged' ? zi('warn') : '●';
        html += '<div class="si-check-row">';
        html += '<div class="si-check-icon">' + icon + '</div>';
        html += '<div class="si-check-text"><strong>' + escHtml(w.name) + '</strong> — ' + w.hoursElapsed + 'h ago, watching for ' + w.hoursRemaining + ' more hours';
        if (w.totalPoops > 0) html += ' (' + w.normalPoops + ' normal poop' + (w.normalPoops !== 1 ? 's' : '') + ')';
        html += '</div></div>';
        html += '<div class="pi-watch-progress"><div class="pi-watch-fill" style="width:' + w.progressPct + '%;background:' + (w.status === 'flagged' ? 'var(--tc-caution)' : 'var(--tc-amber)') + ';"></div></div>';
      });
    }

    // Resolved
    if (data.resolved.length > 0) {
      html += '<div class="si-sub-label fe-section-gap" >Recently resolved</div>';
      data.resolved.forEach(w => {
        const icon = w.status === 'clear' ? zi('check') : w.status === 'flagged' ? zi('warn') : zi('info');
        const detail = w.status === 'clear' ? 'no adverse reactions' :
          w.status === 'flagged' ? w.abnormals.map(a => a.consistency || a.color).join(', ') + ' detected' : 'no poop data';
        html += '<div class="si-check-row">';
        html += '<div class="si-check-icon">' + icon + '</div>';
        html += '<div class="si-check-text">' + escHtml(w.name) + ' — ' + detail + '</div>';
        html += '</div>';
      });
    }
    listEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    data.watches.forEach(w => {
      if (w.status === 'flagged') {
        const issues = w.abnormals.map(a => a.consistency || a.color).join(', ');
        html += '<div class="si-insight si-insight-warn">' + escHtml(w.name) + ' may have caused ' + issues + '. Consider waiting a few days before offering again.</div>';
      } else if (w.status === 'clear') {
        html += '<div class="si-insight si-insight-good">3-day watch for ' + escHtml(w.name) + ' complete — no adverse reactions detected.</div>';
      } else if (w.status === 'watching') {
        const daysDone = Math.floor(w.hoursElapsed / 24);
        html += '<div class="si-insight si-insight-info">Watching ' + escHtml(w.name) + ' — ' + daysDone + ' of 3 days complete. So far, so good.</div>';
      }
    });
    if (!html) {
      html += '<div class="si-insight si-insight-info">All recent food watches are pending data.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 5: Color Anomaly Detection ──

function computePoopColorAnomalies(windowDays) {
  windowDays = windowDays || 14;
  const entries = _piGetPoops(windowDays);
  const daysSet = new Set(entries.map(p => p.date));
  if (daysSet.size < 5) return { insufficient: true, count: daysSet.size, needed: 5 };

  // Color distribution
  const colorDist = {};
  entries.forEach(p => {
    if (p.color) colorDist[p.color] = (colorDist[p.color] || 0) + 1;
  });
  const colorTotal = Object.values(colorDist).reduce((s, v) => s + v, 0);
  const total = colorTotal || entries.length;
  const dominant = Object.entries(colorDist).sort((a, b) => b[1] - a[1])[0];
  const dominantColor = dominant ? dominant[0] : 'brown';

  // Build timeline (per day, ordered)
  const dayEntries = {};
  entries.forEach(p => {
    if (!dayEntries[p.date]) dayEntries[p.date] = [];
    dayEntries[p.date].push(p.color || 'brown');
  });

  // Anomaly detection
  const anomalies = [];
  const ALERT_COLORS = ['red', 'white', 'black'];

  // Check diet cross-reference for context
  const dietFoods48h = (dateStr) => {
    const recentDietFoods = [];
    for (let i = 0; i <= 2; i++) {
      const d = new Date(dateStr);
      d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      recentDietFoods.push(...extractDayFoods(ds));
    }
    return recentDietFoods;
  };

  // Check meds for iron
  const hasIronSupplement = (meds || []).some(m => m.active && /iron|feronia|ferrous/i.test(m.name + ' ' + (m.brand || '')));

  entries.forEach(p => {
    if (!p.color) return;
    if (!ALERT_COLORS.includes(p.color) && !(p.color === 'green' && colorDist.green && colorDist.green / total > 0.5)) return;

    const recentFoods = dietFoods48h(p.date);
    let context = '', severity = 'needs-attention';

    if (p.color === 'red') {
      const hasBeet = recentFoods.some(f => /beet|tomato/i.test(f));
      if (hasBeet) { context = 'Beetroot/tomato in recent diet — likely diet-related'; severity = 'diet-related'; }
      else { context = 'No dietary explanation — monitor and consult doctor if it recurs'; severity = 'needs-attention'; }
    } else if (p.color === 'white') {
      context = 'Pale/white stool can indicate a bile duct issue — contact paediatrician';
      severity = 'urgent';
    } else if (p.color === 'black') {
      if (hasIronSupplement) { context = 'Iron supplement active — likely normal'; severity = 'diet-related'; }
      else { context = 'No iron supplement found — possible upper GI concern, contact doctor'; severity = 'urgent'; }
    } else if (p.color === 'green') {
      const hasGreens = recentFoods.some(f => /spinach|peas|palak|broccoli/i.test(f));
      if (hasGreens) { context = 'Leafy greens in recent diet — likely food-related'; severity = 'diet-related'; }
      else { context = 'Frequent green stools — could be teething, fast transit, or mild infection'; severity = 'safe'; }
    }

    anomalies.push({ date: p.date, color: p.color, context, severity });
  });

  // Overall severity
  let overallSeverity = 'safe';
  if (anomalies.some(a => a.severity === 'urgent')) overallSeverity = 'urgent';
  else if (anomalies.some(a => a.severity === 'needs-attention')) overallSeverity = 'needs-attention';
  else if (anomalies.some(a => a.severity === 'diet-related')) overallSeverity = 'diet-related';

  const severityLabel = { safe: 'All clear', 'diet-related': 'Diet-related', 'needs-attention': 'Watch', urgent: 'Alert' };

  return {
    insufficient: false, colorDist, total, dominantColor, anomalies, dayEntries,
    overallSeverity, severityLabel: severityLabel[overallSeverity] || 'Safe',
    count: daysSet.size, POOP_COLOR_HEX
  };
}

function renderInfoPoopColorAnomaly() {
  const summaryEl = document.getElementById('infoPoopColorSummary');
  const timelineEl = document.getElementById('infoPoopColorTimeline');
  const insightEl = document.getElementById('infoPoopColorInsights');
  if (!summaryEl) return;

  const data = computePoopColorAnomalies();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need 5 days of data (have ' + data.count + ')</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const domLabel = data.dominantColor.charAt(0).toUpperCase() + data.dominantColor.slice(1);
  const sevColor = data.overallSeverity === 'urgent' ? 'var(--tc-danger)' : data.overallSeverity === 'needs-attention' ? 'var(--tc-caution)' : 'var(--tc-sage)';
  summaryEl.innerHTML = '<div class="t-sm"><strong>' + domLabel + '</strong> dominant · ' + data.total + ' entries · <span style="color:' + sevColor + ';font-weight:600;">' + data.severityLabel + '</span></div>';

  if (timelineEl) {
    let html = '';

    // Color distribution bar
    html += '<div class="si-sub-label mb-4" >Color distribution</div>';
    html += '<div class="si-bar-track" style="display:flex;overflow:hidden;height:20px;">';
    const sortedColors = Object.entries(data.colorDist).sort((a, b) => b[1] - a[1]);
    sortedColors.forEach(([color, count]) => {
      const pct = (count / data.total) * 100;
      const hex = POOP_COLOR_HEX[color] || '#8B6914';
      html += '<div style="width:' + pct + '%;background:' + hex + ';height:100%;" title="' + color + ': ' + count + '"></div>';
    });
    html += '</div>';
    // Color legend
    html += '<div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;margin-top:var(--sp-4);">';
    sortedColors.forEach(([color, count]) => {
      const hex = POOP_COLOR_HEX[color] || '#8B6914';
      html += '<div style="display:flex;align-items:center;gap:4px;font-size:var(--fs-2xs);color:var(--light);">';
      html += '<div class="pi-color-dot" style="width:10px;height:10px;background:' + hex + ';"></div>';
      html += color + ' (' + count + ')</div>';
    });
    html += '</div>';

    // Color timeline
    html += '<div class="si-sub-label fe-section-gap" >Color timeline (last 14 days)</div>';
    const days = Object.keys(data.dayEntries).sort();
    days.forEach(d => {
      const dayLabel = formatDate(d).slice(0, 6);
      html += '<div style="display:flex;align-items:center;gap:var(--sp-4);margin-bottom:2px;">';
      html += '<div style="font-size:var(--fs-2xs);color:var(--light);min-width:42px;text-align:right;">' + dayLabel + '</div>';
      html += '<div class="pi-color-timeline">';
      data.dayEntries[d].forEach(c => {
        const hex = POOP_COLOR_HEX[c] || '#8B6914';
        html += '<div class="pi-color-dot" style="background:' + hex + ';" title="' + c + '"></div>';
      });
      html += '</div></div>';
    });

    // Anomaly cards
    if (data.anomalies.length > 0) {
      html += '<div class="si-sub-label fe-section-gap" >Anomalies</div>';
      const seen = new Set();
      data.anomalies.forEach(a => {
        const key = a.date + a.color;
        if (seen.has(key)) return;
        seen.add(key);
        const emoji = a.color === 'red' ? '●' : a.color === 'black' ? zi('dot-red') : a.color === 'white' ? zi('dot-red') : '●';
        html += '<div class="si-reg-cause"><div class="si-reg-cause-icon">' + emoji + '</div><div class="si-reg-cause-text">' + a.color.charAt(0).toUpperCase() + a.color.slice(1) + ' stool on ' + formatDate(a.date) + ' — ' + a.context + '</div></div>';
      });
    }

    timelineEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.overallSeverity === 'safe') {
      html += '<div class="si-insight si-insight-good">Healthy color range. Brown and yellow are expected at Ziva\'s age.</div>';
    } else if (data.overallSeverity === 'diet-related') {
      html += '<div class="si-insight si-insight-info">Some color variations detected but all appear diet-related — no concern.</div>';
    } else if (data.overallSeverity === 'needs-attention') {
      html += '<div class="si-insight si-insight-warn">Unusual stool color detected without dietary explanation. Monitor and consult doctor if it recurs.</div>';
    } else {
      html += '<div class="si-insight si-insight-warn">Concerning stool color detected — please contact your paediatrician.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 6: Amount Trend ──

function computePoopAmountTrend(windowDays) {
  windowDays = windowDays || 14;
  const entries = _piGetPoops(windowDays);
  const AMOUNT_SCALE = { small: 1, medium: 2, large: 3 };

  // Group by date
  const dayMap = {};
  entries.forEach(p => {
    if (!dayMap[p.date]) dayMap[p.date] = [];
    dayMap[p.date].push(p);
  });
  const days = Object.keys(dayMap).sort();
  if (days.length < 5) return { insufficient: true, count: days.length, needed: 5 };

  // Daily avg amount
  const dailyAmounts = days.map(d => {
    const vals = dayMap[d].map(p => AMOUNT_SCALE[p.amount] ?? 2);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { dateStr: d, avg, count: vals.length };
  });

  // 7d averages
  const recent = dailyAmounts.slice(-7);
  const previous = dailyAmounts.slice(0, -7);
  const recentAvg = recent.reduce((s, d) => s + d.avg, 0) / recent.length;
  const prevAvg = previous.length > 0 ? previous.reduce((s, d) => s + d.avg, 0) / previous.length : recentAvg;

  let trend = 'stable';
  if (recentAvg - prevAvg >= 0.3) trend = 'larger';
  else if (recentAvg - prevAvg <= -0.3) trend = 'smaller';

  const avgLabel = recentAvg <= 1.4 ? 'Small' : recentAvg <= 2.4 ? 'Medium' : 'Large';

  // Most common amount
  const amountCounts = {};
  entries.forEach(p => { amountCounts[p.amount || 'medium'] = (amountCounts[p.amount || 'medium'] || 0) + 1; });
  const mostCommon = Object.entries(amountCounts).sort((a, b) => b[1] - a[1])[0];

  // Large-after-gap detection
  let largeAfterGap = 0;
  const sorted = [...entries].sort((a, b) => (a.date + (a.time || '12:00')).localeCompare(b.date + (b.time || '12:00')));
  for (let i = 1; i < sorted.length; i++) {
    const prevTs = new Date(sorted[i - 1].date + 'T' + (sorted[i - 1].time || '12:00'));
    const currTs = new Date(sorted[i].date + 'T' + (sorted[i].time || '12:00'));
    const gapH = (currTs - prevTs) / 3600000;
    if (gapH >= 24 && sorted[i].amount === 'large') largeAfterGap++;
  }

  // Cross-reference: small + hard = constipation signal
  let constipationSignal = false, diarrhoeaSignal = false;
  entries.forEach(p => {
    if (p.amount === 'small' && (p.consistency === 'hard' || p.consistency === 'pellets')) constipationSignal = true;
    if (p.amount === 'large' && (p.consistency === 'runny' || p.consistency === 'watery')) diarrhoeaSignal = true;
  });

  return {
    insufficient: false, trend, recentAvg: +recentAvg.toFixed(1), prevAvg: +prevAvg.toFixed(1),
    avgLabel, mostCommon: mostCommon ? mostCommon[0] : 'medium', largeAfterGap,
    constipationSignal, diarrhoeaSignal, dailyAmounts, count: days.length
  };
}

function renderInfoPoopAmountTrend() {
  const summaryEl = document.getElementById('infoPoopAmountSummary');
  const barsEl = document.getElementById('infoPoopAmountBars');
  const insightEl = document.getElementById('infoPoopAmountInsights');
  if (!summaryEl) return;

  const data = computePoopAmountTrend();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need 5 days of data (have ' + data.count + ')</div>';
    if (barsEl) barsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const trendIcon = data.trend === 'larger' ? '↗' : data.trend === 'smaller' ? '↘' : '→';
  summaryEl.innerHTML = '<div class="t-sm">Avg amount: <strong>' + data.avgLabel + '</strong> · Trend: <strong>' + trendIcon + ' ' + data.trend + '</strong></div>';

  if (barsEl) {
    let html = '<div class="si-sub-label mb-4" >Daily amounts</div>';
    const displayDays = data.dailyAmounts.slice(-10);
    displayDays.forEach(d => {
      const dayLabel = formatDate(d.dateStr).slice(0, 6);
      const pct = Math.round((d.avg / 3) * 100);
      const amtLabel = d.avg <= 1.4 ? 'S' : d.avg <= 2.4 ? 'M' : 'L';
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + dayLabel + '</div>';
      html += '<div class="pi-amount-track"><div class="pi-amount-fill" style="width:' + pct + '%;"></div></div>';
      html += '<div class="si-bar-val t-amber" >' + amtLabel + '</div>';
      html += '</div>';
    });

    html += '<div class="si-stat-grid">';
    const mcLabel = (data.mostCommon || 'medium').charAt(0).toUpperCase() + (data.mostCommon || 'medium').slice(1);
    html += '<div class="si-stat"><div class="si-stat-val">' + mcLabel + '</div><div class="si-stat-label">Most common</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val">' + data.largeAfterGap + '</div><div class="si-stat-label">Large after gap</div></div>';
    html += '</div>';
    barsEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.trend === 'smaller') {
      html += '<div class="si-insight si-insight-warn">Poop amounts have been getting smaller — watch for constipation signs.</div>';
    } else if (data.largeAfterGap >= 2) {
      html += '<div class="si-insight si-insight-info">Several large poops after long gaps — Ziva may be holding. Check for discomfort.</div>';
    } else if (data.constipationSignal) {
      html += '<div class="si-insight si-insight-warn">Small + hard stools detected — a constipation signal. Increase fluids and fibre.</div>';
    } else if (data.diarrhoeaSignal) {
      html += '<div class="si-insight si-insight-warn">Large + runny stools detected — possible diarrhoea. Monitor hydration.</div>';
    } else {
      html += '<div class="si-insight si-insight-good">Consistent amounts — healthy pattern.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 7: Symptom Tracker ──

function computePoopSymptomTracker(windowDays) {
  windowDays = windowDays || 30;
  const entries = _piGetPoops(windowDays);
  if (entries.length === 0) return { insufficient: true, count: 0, needed: 1 };

  const bloodEntries = entries.filter(p => p.blood);
  const mucusEntries = entries.filter(p => p.mucus);
  const cooccurrence = entries.filter(p => p.blood && p.mucus).length;

  if (bloodEntries.length === 0 && mucusEntries.length === 0) {
    // Still build timeline (all clean days) for visual consistency
    const cleanTimeline = [];
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      cleanTimeline.push({ dateStr: toDateStr(d), hasBlood: false, hasMucus: false, hasAny: false });
    }
    return {
      insufficient: false, severity: 'none', bloodCount: 0, mucusCount: 0, cooccurrence: 0,
      trend: 'stable', triggerFoods: [], illnessRelated: [], timeline: cleanTimeline,
      lastBloodDate: null, lastMucusDate: null, count: entries.length
    };
  }

  // Trend: recent 14d vs previous 14d
  const mid = new Date();
  mid.setDate(mid.getDate() - 14);
  const midStr = toDateStr(mid);
  const recentSymptoms = entries.filter(p => p.date >= midStr && (p.blood || p.mucus)).length;
  const prevSymptoms = entries.filter(p => p.date < midStr && (p.blood || p.mucus)).length;
  let trend = 'stable';
  if (recentSymptoms > prevSymptoms + 1) trend = 'increasing';
  else if (recentSymptoms < prevSymptoms - 1) trend = 'decreasing';

  // Severity
  let severity = 'rare';
  if (bloodEntries.length >= 3) severity = 'concerning';
  else if (bloodEntries.length + mucusEntries.length >= 3) severity = 'recurring';

  // Trigger foods (foods eaten 24–48h before symptom entries)
  const triggerFoods = {};
  const symptomDates = [...new Set([...bloodEntries, ...mucusEntries].map(p => p.date))];
  symptomDates.forEach(dateStr => {
    for (let lag = 1; lag <= 2; lag++) {
      const d = new Date(dateStr);
      d.setDate(d.getDate() - lag);
      const lagFoods = extractDayFoods(toDateStr(d));
      lagFoods.forEach(f => {
        const norm = normalizeFoodName(f);
        triggerFoods[norm] = (triggerFoods[norm] || 0) + 1;
      });
    }
  });
  const topTriggers = Object.entries(triggerFoods).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Illness cross-reference
  const illnessRelated = [];
  const episodes = _getAllEpisodes();
  symptomDates.forEach(dateStr => {
    const dateMs = new Date(dateStr).getTime();
    episodes.forEach(ep => {
      const range = _episodeDateRange(ep);
      if (dateMs >= range.startMs && dateMs <= range.endMs) {
        illnessRelated.push({ date: dateStr, illness: ep.illnessType });
      }
    });
  });

  // Timeline: per day, mark symptom presence
  const allDays = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayPoops = entries.filter(p => p.date === ds);
    const hasBlood = dayPoops.some(p => p.blood);
    const hasMucus = dayPoops.some(p => p.mucus);
    allDays.push({ dateStr: ds, hasBlood, hasMucus, hasAny: hasBlood || hasMucus });
  }

  const lastBlood = bloodEntries.length > 0 ? bloodEntries[bloodEntries.length - 1].date : null;
  const lastMucus = mucusEntries.length > 0 ? mucusEntries[mucusEntries.length - 1].date : null;

  return {
    insufficient: false, severity, bloodCount: bloodEntries.length, mucusCount: mucusEntries.length,
    cooccurrence, trend, triggerFoods: topTriggers, illnessRelated, timeline: allDays,
    lastBloodDate: lastBlood, lastMucusDate: lastMucus, count: entries.length
  };
}

function renderInfoPoopSymptoms() {
  const summaryEl = document.getElementById('infoPoopSymptomsSummary');
  const timelineEl = document.getElementById('infoPoopSymptomsTimeline');
  const insightEl = document.getElementById('infoPoopSymptomsInsights');
  if (!summaryEl) return;

  const data = computePoopSymptomTracker();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need at least 1 poop entry (have ' + data.count + ')</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const sevLabel = data.severity.charAt(0).toUpperCase() + data.severity.slice(1);
  const sevColor = data.severity === 'concerning' ? 'var(--tc-danger)' : data.severity === 'recurring' ? 'var(--tc-caution)' : 'var(--tc-sage)';
  summaryEl.innerHTML = '<div class="t-sm"><span style="color:' + sevColor + ';font-weight:600;">' + sevLabel + '</span> · blood: ' + data.bloodCount + ', mucus: ' + data.mucusCount + ' in 30d</div>';

  if (timelineEl) {
    let html = '';

    // 30-day dot timeline
    html += '<div class="si-sub-label mb-4" >Last 30 days</div>';
    html += '<div class="pi-symptom-row">';
    data.timeline.forEach(d => {
      const color = d.hasBlood ? 'var(--tc-danger)' : d.hasMucus ? 'var(--tc-caution)' : 'var(--warm)';
      const border = d.hasAny ? 'none' : '1px solid rgba(0,0,0,0.06)';
      html += '<div class="pi-symptom-dot" style="background:' + color + ';border:' + border + ';" title="' + formatDate(d.dateStr) + (d.hasBlood ? ' — blood' : '') + (d.hasMucus ? ' — mucus' : '') + '"></div>';
    });
    html += '</div>';

    // Trigger foods
    if (data.triggerFoods.length > 0) {
      html += '<div class="si-sub-label fe-section-gap" >Potential trigger foods</div>';
      data.triggerFoods.forEach(([food, count]) => {
        html += '<div class="si-factor-row">';
        html += '<div class="si-factor-icon">'+zi('bowl')+'</div>';
        html += '<div class="si-factor-text">' + escHtml(food) + '</div>';
        html += '<div class="si-factor-impact t-caution" >' + count + '× before symptoms</div>';
        html += '</div>';
      });
    }

    // Stat grid
    html += '<div class="si-stat-grid">';
    html += '<div class="si-stat"><div class="si-stat-val t-danger" >' + (data.lastBloodDate ? formatDate(data.lastBloodDate).slice(0, 6) : '—') + '</div><div class="si-stat-label">Last blood</div></div>';
    html += '<div class="si-stat"><div class="si-stat-val t-caution" >' + (data.lastMucusDate ? formatDate(data.lastMucusDate).slice(0, 6) : '—') + '</div><div class="si-stat-label">Last mucus</div></div>';
    html += '</div>';
    timelineEl.innerHTML = html;
  }

  if (insightEl) {
    let html = '';
    if (data.severity === 'none') {
      html += '<div class="si-insight si-insight-good">No blood or mucus detected in 30 days — healthy.</div>';
    } else if (data.severity === 'rare') {
      if (data.mucusCount > 0 && data.bloodCount === 0) {
        html += '<div class="si-insight si-insight-info">Isolated mucus detected — small amounts are normal. Monitor.</div>';
      } else {
        html += '<div class="si-insight si-insight-info">Rare symptom occurrence — continue monitoring.</div>';
      }
    } else if (data.severity === 'concerning') {
      html += '<div class="si-insight si-insight-warn">Blood detected ' + data.bloodCount + ' times this month. Please consult your paediatrician.</div>';
    } else {
      html += '<div class="si-insight si-insight-warn">Recurring symptoms detected. Monitor patterns and discuss with your doctor.</div>';
    }
    if (data.illnessRelated.length > 0) {
      const types = [...new Set(data.illnessRelated.map(i => i.illness))].join(', ');
      html += '<div class="si-insight si-insight-info">Some symptoms coincided with active illness (' + types + ') — likely illness-related.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Feature 8: Poop Score Report Card ──

function computePoopReport(windowDays) {
  windowDays = windowDays || 7;
  const scores = [];
  const details = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const sc = calcPoopScore(ds);
    if (sc && !sc.isCarryForward) {
      scores.push(sc.score);
      details.push({ dateStr: ds, ...sc });
    }
  }
  if (scores.length < 3) return { insufficient: true, count: scores.length, needed: 3 };

  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const best = details.reduce((a, b) => a.score > b.score ? a : b);
  const worst = details.reduce((a, b) => a.score < b.score ? a : b);

  // Previous week
  const prevScores = [];
  for (let i = windowDays; i < windowDays * 2; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const sc = calcPoopScore(toDateStr(d));
    if (sc && !sc.isCarryForward) prevScores.push(sc.score);
  }
  const prevAvg = prevScores.length >= 3 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : null;

  // Component averages
  const avgConsistency = Math.round(details.reduce((s, d) => s + (d.components.consistency || 0), 0) / details.length);
  const avgFrequency = Math.round(details.reduce((s, d) => s + (d.components.frequency || 0), 0) / details.length);
  const avgColor = Math.round(details.reduce((s, d) => s + (d.components.color || 0), 0) / details.length);
  const avgSymptoms = Math.round(details.reduce((s, d) => s + (d.components.symptoms || 0), 0) / details.length);

  // Weakest component
  const components = [
    { name: 'consistency', score: avgConsistency, advice: 'Consistency is the biggest drag on your score — try more fibre' },
    { name: 'frequency', score: avgFrequency, advice: 'Frequency has been irregular — track meal timing alongside poops' },
    { name: 'color', score: avgColor, advice: 'Unusual colors detected this week — check diet or consult doctor' },
    { name: 'symptoms', score: avgSymptoms, advice: 'Blood or mucus detected — discuss with your paediatrician' }
  ];
  const weakest = components.reduce((a, b) => a.score < b.score ? a : b);

  return {
    insufficient: false, avgScore, best, worst, prevAvg, details,
    avgConsistency, avgFrequency, avgColor, avgSymptoms, weakest,
    count: scores.length
  };
}

function renderInfoPoopReport() {
  const summaryEl = document.getElementById('infoPoopReportSummary');
  const detailsEl = document.getElementById('infoPoopReportDetails');
  const insightEl = document.getElementById('infoPoopReportInsights');
  if (!summaryEl) return;

  const data = computePoopReport();
  if (data.insufficient) {
    summaryEl.innerHTML = '<div class="si-nodata">Need 3 days of poop data (have ' + data.count + ')</div>';
    if (detailsEl) detailsEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  const lbl = getScoreLabel(data.avgScore);
  const delta = data.prevAvg !== null ? data.avgScore - data.prevAvg : null;
  const trendText = delta !== null ? (delta > 2 ? '↑ +' + delta + ' vs last week' : delta < -2 ? '↓ ' + delta + ' vs last week' : '→ stable') : '';
  const trendColor = delta !== null && delta < -2 ? 'var(--tc-danger)' : 'var(--tc-sage)';
  summaryEl.innerHTML = '<div class="t-sm">Poop score: <strong>' + data.avgScore + '/100</strong> — ' + lbl.text +
    (trendText ? ' <span style="color:' + trendColor + ';font-weight:600;">' + trendText + '</span>' : '') + '</div>';

  if (detailsEl) {
    let html = '<div class="si-report-hero">';

    // Score ring (amber theme)
    html += '<div class="si-report-ring" style="background:' + _siRingBg(lbl.label) + ';border-color:' + _siRingBorder(lbl.label) + ';">';
    html += '<div class="si-report-number" style="color:' + _siRingText(lbl.label) + ';">' + data.avgScore + '</div>';
    html += '<div class="si-report-label" style="color:' + _siRingText(lbl.label) + ';">' + lbl.text + '</div>';
    html += '</div>';

    // Stats column
    html += '<div class="si-report-stats">';
    html += '<div style="font-size:var(--fs-xs);color:var(--mid);line-height:1.6;">';
    html += '' + zi('diaper') + ' Consistency: <strong>' + data.avgConsistency + '</strong>/100<br>';
    html += '' + zi('chart') + ' Frequency: <strong>' + data.avgFrequency + '</strong>/100<br>';
    html += '' + zi('palette') + ' Color: <strong>' + data.avgColor + '</strong>/100<br>';
    html += '🩺 Symptoms: <strong>' + data.avgSymptoms + '</strong>/100';
    html += '</div>';

    // Mini sparkline
    html += '<div class="si-sparkline mt-8" >';
    data.details.slice().reverse().forEach(d => {
      const pct = Math.max(4, d.score);
      const color = d.score >= 70 ? 'var(--tc-sage)' : d.score >= 40 ? 'var(--tc-amber)' : 'var(--tc-danger)';
      html += '<div class="si-spark-bar" style="height:' + pct + '%;background:' + color + ';" title="' + formatDate(d.dateStr) + ': ' + d.score + '"></div>';
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
    if (data.weakest.score < 80) {
      html += '<div class="si-insight si-insight-warn">' + data.weakest.advice + '.</div>';
    }
    if (data.avgScore >= 75) {
      html += '<div class="si-insight si-insight-good">Strong poop week — keep the diet consistent.</div>';
    } else if (data.avgScore >= 50) {
      html += '<div class="si-insight si-insight-info">Some digestive variability this week. Review flagged days for patterns.</div>';
    } else {
      html += '<div class="si-insight si-insight-warn">Poop health needs attention this week. Check consistency and frequency patterns above.</div>';
    }
    insightEl.innerHTML = html;
  }
}

// ── Activity Intelligence Card 1: Consistency & Domain Balance ──
function renderInfoActivityConsistency() {
  const summaryEl = document.getElementById('infoActivityConsistencySummary');
  const dotsEl = document.getElementById('infoActivityConsistencyDots');
  const domainsEl = document.getElementById('infoActivityConsistencyDomains');
  const insightsEl = document.getElementById('infoActivityConsistencyInsights');
  if (!summaryEl) return;

  const totalDays = Object.keys(activityLog).length;
  if (totalDays === 0) {
    summaryEl.innerHTML = '<span class="si-nodata">Log activities to see consistency data</span>';
    if (dotsEl) dotsEl.innerHTML = '';
    if (domainsEl) domainsEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // 14-day dot calendar
  const now = new Date();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let activeDays = 0, streak = 0, maxStreak = 0, currentStreak = 0;
  const domainTotals = {};
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  const dowDays = [0, 0, 0, 0, 0, 0, 0];
  let dotHtml = '<div class="si-sub-label mb-4" >14-Day Activity Calendar</div>';
  // Day-of-week header (separate grid, not inside dot grid)
  dotHtml += '<div class="ai-dot-cal">';
  dayLabels.forEach(l => { dotHtml += '<div class="ai-dot-label">' + l + '</div>'; });
  dotHtml += '</div>';

  // 14 dots — start from 13 days ago to today
  const dots = [];
  for (let d = 13; d >= 0; d--) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    const ds = toDateStr(dt);
    const entries = Array.isArray(activityLog[ds]) ? activityLog[ds] : [];
    const count = entries.length;
    dots.push({ ds, count, dow: dt.getDay() });
    if (count > 0) {
      activeDays++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      entries.forEach(e => {
        (e.domains || []).forEach(dom => { domainTotals[dom] = (domainTotals[dom] || 0) + 1; });
      });
    } else {
      currentStreak = 0;
    }
    dowDays[dt.getDay()]++;
    if (count > 0) dowCounts[dt.getDay()]++;
  }

  // Check if current streak extends to today
  streak = 0;
  for (let d = 0; d >= -13; d--) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    const ds = toDateStr(dt);
    if (Array.isArray(activityLog[ds]) && activityLog[ds].length > 0) streak++;
    else break;
  }

  // Pad dots to start on correct day of week
  const firstDow = dots[0] ? new Date(dots[0].ds).getDay() : 0;
  dotHtml += '<div class="ai-dot-cal">';
  for (let i = 0; i < firstDow; i++) dotHtml += '<div></div>';
  dots.forEach(d => {
    const cls = d.count >= 3 ? 'active-3' : d.count >= 2 ? 'active-2' : d.count >= 1 ? 'active' : '';
    dotHtml += '<div class="ai-dot ' + cls + '" title="' + d.ds + ': ' + d.count + ' activities"></div>';
  });
  dotHtml += '</div>';

  // Summary
  summaryEl.innerHTML = '<span class="t-sm t-mid" >' + activeDays + '/14 active days · ' + streak + 'd streak · ' + maxStreak + 'd best</span>';

  if (dotsEl) dotsEl.innerHTML = dotHtml;

  // Domain balance bars
  if (domainsEl) {
    const domainColors = { motor: 'var(--sage)', language: '#6aafcc', social: '#d4a04a', cognitive: 'var(--lavender)', sensory: '#c87070' };
    const allDomains = ['motor', 'language', 'social', 'cognitive', 'sensory'];
    const maxDom = Math.max(...allDomains.map(d => domainTotals[d] || 0), 1);
    let dHtml = '<div class="si-sub-label mb-4" >Domain Distribution</div>';
    allDomains.forEach(d => {
      const count = domainTotals[d] || 0;
      const pct = Math.round((count / maxDom) * 100);
      dHtml += '<div class="ai-domain-bar">' +
        '<div class="ai-domain-label">' + d + '</div>' +
        '<div class="ai-domain-track"><div class="ai-domain-fill" style="width:' + pct + '%;background:' + (domainColors[d] || 'var(--sage)') + ';"></div></div>' +
        '<div class="ai-domain-val">' + count + '</div>' +
      '</div>';
    });
    domainsEl.innerHTML = dHtml;
  }

  // Insights
  if (insightsEl) {
    let iHtml = '';
    // Day-of-week pattern
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let bestDow = 0, worstDow = 0;
    dowCounts.forEach((c, i) => {
      if (c > dowCounts[bestDow]) bestDow = i;
      if (c < dowCounts[worstDow]) worstDow = i;
    });
    if (dowCounts[bestDow] > 0 && dowCounts[bestDow] !== dowCounts[worstDow]) {
      iHtml += '<div class="si-insight si-insight-info">Most active on ' + dowNames[bestDow] + 's, least on ' + dowNames[worstDow] + 's</div>';
    }

    // Domain imbalance
    const domArr = Object.entries(domainTotals).sort((a, b) => b[1] - a[1]);
    if (domArr.length >= 2 && domArr[0][1] >= 3 * (domArr[domArr.length - 1][1] || 1)) {
      iHtml += '<div class="si-insight si-insight-warn">' + domArr[0][0].charAt(0).toUpperCase() + domArr[0][0].slice(1) + ' activities are ' + Math.round(domArr[0][1] / Math.max(domArr[domArr.length - 1][1], 1)) + '× ' + domArr[domArr.length - 1][0] + ' — consider more ' + domArr[domArr.length - 1][0] + ' activities</div>';
    }

    if (streak >= 3) {
      iHtml += '<div class="si-insight si-insight-good">' + streak + '-day activity streak — great consistency!</div>';
    } else if (activeDays < 4) {
      iHtml += '<div class="si-insight si-insight-warn">Only ' + activeDays + '/14 active days — try logging daily activities</div>';
    }

    insightsEl.innerHTML = iHtml;
  }
}

// ── Activity Intelligence Card 2: Milestone Velocity Tracker ──
function renderInfoMilestoneVelocity() {
  const summaryEl = document.getElementById('infoMilestoneVelocitySummary');
  const listEl = document.getElementById('infoMilestoneVelocityList');
  const insightsEl = document.getElementById('infoMilestoneVelocityInsights');
  if (!summaryEl) return;

  // Find all milestones with evidence that aren't mastered yet
  const inProgress = milestones.filter(m => m.evidenceCount > 0 && ['emerging', 'practicing', 'consistent'].includes(m.status));
  const stalled = [];
  const progressing = [];

  if (inProgress.length === 0) {
    summaryEl.innerHTML = '<span class="si-nodata">Log activities to track milestone velocity</span>';
    if (listEl) listEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  const todayDate = new Date(today());
  inProgress.forEach(m => {
    if (!m.firstSeen || !m.lastSeen) return;
    const firstDate = new Date(m.firstSeen);
    const lastDate = new Date(m.lastSeen);
    const daysSinceFirst = Math.max(1, Math.round((todayDate - firstDate) / 86400000));
    const daysSinceLast = Math.round((todayDate - lastDate) / 86400000);
    const rate = m.evidenceCount / daysSinceFirst; // evidence per day

    // Project next promotion
    const stageRank = { emerging: 1, practicing: 2, consistent: 3, mastered: 4 };
    const currentRank = stageRank[m.status] || 0;
    let nextStage = null, neededEvidence = 0;
    for (const stage of ['practicing', 'consistent', 'mastered']) {
      if ((stageRank[stage] || 0) > currentRank) {
        nextStage = stage;
        neededEvidence = Math.max(0, PROMOTION_RULES[stage].minEvidence - m.evidenceCount);
        break;
      }
    }
    const projectedDays = rate > 0 && neededEvidence > 0 ? Math.round(neededEvidence / rate) : null;

    const item = { ...m, daysSinceFirst, daysSinceLast, rate, nextStage, neededEvidence, projectedDays };
    if (daysSinceLast > 12) stalled.push(item);
    else progressing.push(item);
  });

  // Sort progressing by rate descending
  progressing.sort((a, b) => b.rate - a.rate);
  stalled.sort((a, b) => b.daysSinceLast - a.daysSinceLast);

  summaryEl.innerHTML = '<span class="t-sm t-mid" >' + progressing.length + ' progressing · ' + stalled.length + ' stalled</span>';

  if (listEl) {
    let html = '';
    if (progressing.length > 0) {
      html += '<div class="si-sub-label mb-4" >Progressing</div>';
      progressing.forEach(m => {
        const rateStr = m.rate >= 1 ? m.rate.toFixed(1) + '/day' : (m.rate * 7).toFixed(1) + '/week';
        let projStr = '';
        if (m.projectedDays && m.nextStage) {
          projStr = ' · → ' + m.nextStage + ' in ~' + m.projectedDays + 'd';
        }
        html += '<div class="ai-velocity-item">' +
          '<div class="ai-velocity-name">' + escHtml(m.text) + '</div>' +
          '<div class="ai-velocity-rate">' + rateStr + projStr + '</div>' +
        '</div>';
      });
    }
    if (stalled.length > 0) {
      html += '<div class="si-sub-label fe-section-gap" >Stalled</div>';
      stalled.forEach(m => {
        html += '<div class="ai-velocity-item">' +
          '<div class="ai-velocity-name">' + escHtml(m.text) + '</div>' +
          '<div class="ai-velocity-rate ai-velocity-stale">No evidence for ' + m.daysSinceLast + 'd</div>' +
        '</div>';
      });
    }
    listEl.innerHTML = html;
  }

  if (insightsEl) {
    let iHtml = '';
    if (progressing.length > 0) {
      const fastest = progressing[0];
      iHtml += '<div class="si-insight si-insight-good">Fastest progress: "' + escHtml(fastest.text) + '" at ' + (fastest.rate >= 1 ? fastest.rate.toFixed(1) + ' ev/day' : (fastest.rate * 7).toFixed(1) + ' ev/week') + '</div>';
    }
    if (stalled.length > 0) {
      iHtml += '<div class="si-insight si-insight-warn">' + stalled.length + ' milestone' + (stalled.length > 1 ? 's' : '') + ' stalled — consider targeted activities for ' + escHtml(stalled[0].text) + '</div>';
    }
    insightsEl.innerHTML = iHtml;
  }
}

// ── Activity Intelligence Card 3: Activity ↔ Outcome Correlations ──
function renderInfoActivityCorrelation() {
  const summaryEl = document.getElementById('infoActivityCorrelationSummary');
  const rowsEl = document.getElementById('infoActivityCorrelationRows');
  const insightsEl = document.getElementById('infoActivityCorrelationInsights');
  if (!summaryEl) return;

  const totalDays = Object.keys(activityLog).length;
  if (totalDays < 3) {
    summaryEl.innerHTML = '<span class="si-nodata">Need 3+ days of activity data for correlations</span>';
    if (rowsEl) rowsEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Collect 30 days of data: activity count vs sleep score, poop score, feeding count
  const now = new Date();
  const activeDays = [], inactiveDays = [];

  for (let d = 0; d < 30; d++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    const ds = toDateStr(dt);
    const entries = Array.isArray(activityLog[ds]) ? activityLog[ds] : [];
    const actCount = entries.length;

    // Sleep score for this day
    const sleepObj = typeof getDailySleepScore === 'function' ? getDailySleepScore(ds) : null;
    const sleepScore = sleepObj && typeof sleepObj.score === 'number' ? sleepObj.score : null;

    // Poop score
    const poopObj = typeof calcPoopScore === 'function' ? calcPoopScore(ds) : null;
    const poopScore = poopObj && typeof poopObj.score === 'number' ? poopObj.score : null;

    // Motor activity check
    const hasMotor = entries.some(e => (e.domains || []).includes('motor'));

    const day = { ds, actCount, sleepScore, poopScore, hasMotor };
    if (actCount > 0) activeDays.push(day);
    else inactiveDays.push(day);
  }

  const correlations = [];

  // Sleep quality on active vs inactive days
  const activeSleep = activeDays.filter(d => d.sleepScore !== null).map(d => d.sleepScore);
  const inactiveSleep = inactiveDays.filter(d => d.sleepScore !== null).map(d => d.sleepScore);
  if (activeSleep.length >= 2 && inactiveSleep.length >= 2) {
    const avgActive = Math.round(activeSleep.reduce((s, v) => s + v, 0) / activeSleep.length);
    const avgInactive = Math.round(inactiveSleep.reduce((s, v) => s + v, 0) / inactiveSleep.length);
    const diff = avgActive - avgInactive;
    correlations.push({
      label: 'Sleep score on active vs inactive days',
      valActive: avgActive, valInactive: avgInactive, diff,
      unit: '/100'
    });
  }

  // Poop regularity on active vs inactive days
  const activePoop = activeDays.filter(d => d.poopScore !== null).map(d => d.poopScore);
  const inactivePoop = inactiveDays.filter(d => d.poopScore !== null).map(d => d.poopScore);
  if (activePoop.length >= 2 && inactivePoop.length >= 2) {
    const avgActive = Math.round(activePoop.reduce((s, v) => s + v, 0) / activePoop.length);
    const avgInactive = Math.round(inactivePoop.reduce((s, v) => s + v, 0) / inactivePoop.length);
    const diff = avgActive - avgInactive;
    correlations.push({
      label: 'Poop score on active vs inactive days',
      valActive: avgActive, valInactive: avgInactive, diff,
      unit: '/100'
    });
  }

  // Motor activity days vs sleep
  const motorDays = activeDays.filter(d => d.hasMotor && d.sleepScore !== null);
  const nonMotorDays = [...activeDays.filter(d => !d.hasMotor), ...inactiveDays].filter(d => d.sleepScore !== null);
  if (motorDays.length >= 2 && nonMotorDays.length >= 2) {
    const avgMotor = Math.round(motorDays.map(d => d.sleepScore).reduce((s, v) => s + v, 0) / motorDays.length);
    const avgNonMotor = Math.round(nonMotorDays.map(d => d.sleepScore).reduce((s, v) => s + v, 0) / nonMotorDays.length);
    const diff = avgMotor - avgNonMotor;
    correlations.push({
      label: 'Sleep after motor activities vs no motor',
      valActive: avgMotor, valInactive: avgNonMotor, diff,
      unit: '/100'
    });
  }

  // Multi-activity days (2+) vs single activity days
  const multiActive = activeDays.filter(d => d.actCount >= 2 && d.sleepScore !== null);
  const singleActive = activeDays.filter(d => d.actCount === 1 && d.sleepScore !== null);
  if (multiActive.length >= 2 && singleActive.length >= 2) {
    const avgMulti = Math.round(multiActive.map(d => d.sleepScore).reduce((s, v) => s + v, 0) / multiActive.length);
    const avgSingle = Math.round(singleActive.map(d => d.sleepScore).reduce((s, v) => s + v, 0) / singleActive.length);
    const diff = avgMulti - avgSingle;
    correlations.push({
      label: 'Sleep on 2+ activity days vs 1 activity',
      valActive: avgMulti, valInactive: avgSingle, diff,
      unit: '/100'
    });
  }

  summaryEl.innerHTML = '<span class="t-sm t-mid" >' + correlations.length + ' correlations found across ' + (activeDays.length + inactiveDays.length) + ' days</span>';

  if (rowsEl) {
    if (correlations.length === 0) {
      rowsEl.innerHTML = '<div class="si-nodata">Not enough overlapping data yet</div>';
    } else {
      let html = '';
      correlations.forEach(c => {
        const diffCls = c.diff > 3 ? 'ai-corr-pos' : c.diff < -3 ? 'ai-corr-neg' : 'ai-corr-neutral';
        const diffSign = c.diff > 0 ? '+' : '';
        html += '<div class="ai-corr-row">' +
          '<div class="ai-corr-label">' + c.label + '</div>' +
          '<div class="ai-corr-val">' + c.valActive + ' vs ' + c.valInactive + '</div>' +
          '<span class="ai-corr-diff ' + diffCls + '">' + diffSign + c.diff + '</span>' +
        '</div>';
      });
      rowsEl.innerHTML = html;
    }
  }

  if (insightsEl) {
    let iHtml = '';
    correlations.forEach(c => {
      if (Math.abs(c.diff) >= 5) {
        const better = c.diff > 0 ? 'active' : 'inactive';
        iHtml += '<div class="si-insight ' + (c.diff > 0 ? 'si-insight-good' : 'si-insight-info') + '">' + c.label + ': ' + (c.diff > 0 ? '+' : '') + c.diff + ' points on ' + better + ' days</div>';
      }
    });
    if (iHtml === '' && correlations.length > 0) {
      iHtml = '<div class="si-insight si-insight-info">No strong correlations yet — more data will reveal patterns</div>';
    }
    insightsEl.innerHTML = iHtml;
  }
}

// ════════════════════════════════════════════════════════════════

// MEDICAL INTELLIGENCE (v2.10)
// ═══════════════════════════════════════

// ── Helper: collect ALL resolved + active episodes across 4 types ──
function _getAllEpisodes() {
  const episodes = [];
  (_feverEpisodes || []).forEach(e => episodes.push({ ...e, illnessType: 'fever', emoji: zi('flame') }));
  (_diarrhoeaEpisodes || []).forEach(e => episodes.push({ ...e, illnessType: 'diarrhoea', emoji: zi('diaper') }));
  (_vomitingEpisodes || []).forEach(e => episodes.push({ ...e, illnessType: 'vomiting', emoji: zi('siren') }));
  (_coldEpisodes || []).forEach(e => episodes.push({ ...e, illnessType: 'cold', emoji: zi('siren') }));
  return episodes.sort((a, b) => (a.startedAt || '').localeCompare(b.startedAt || ''));
}

function _episodeDurationDays(ep) {
  const start = new Date(ep.startedAt);
  const end = ep.resolvedAt ? new Date(ep.resolvedAt) : new Date();
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

function _episodeDateRange(ep) {
  const s = new Date(ep.startedAt);
  const e = ep.resolvedAt ? new Date(ep.resolvedAt) : new Date();
  return { startDate: toDateStr(s), endDate: toDateStr(e), startMs: s.getTime(), endMs: e.getTime() };
}

// ════════════════════════════════════════
// 1. ILLNESS FREQUENCY ANALYSIS
// ════════════════════════════════════════

function computeIllnessFrequency() {
  const all = _getAllEpisodes();
  if (all.length === 0) return null;

  // Count by type
  const typeCounts = { fever: 0, diarrhoea: 0, vomiting: 0, cold: 0 };
  all.forEach(e => { if (typeCounts[e.illnessType] !== undefined) typeCounts[e.illnessType]++; });

  // Monthly breakdown for timeline (last 6 months)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const label = d.toLocaleDateString('en-IN', { month: 'short' });
    months.push({ key, label, episodes: [] });
  }
  all.forEach(ep => {
    const epMonth = (ep.startedAt || '').slice(0, 7);
    const m = months.find(mo => mo.key === epMonth);
    if (m) m.episodes.push(ep);
  });

  // Frequency per 30 days (rolling)
  const resolved = all.filter(e => e.status === 'resolved');
  const last60 = resolved.filter(e => {
    const d = new Date(e.startedAt);
    return (now - d) < 60 * 86400000;
  });
  const freqPer30 = last60.length > 0 ? (last60.length / 2).toFixed(1) : '0';

  // Average gap between episodes
  let avgGapDays = null;
  if (resolved.length >= 2) {
    const sorted = resolved.slice().sort((a, b) => (a.startedAt || '').localeCompare(b.startedAt || ''));
    let gapSum = 0;
    for (let i = 1; i < sorted.length; i++) {
      gapSum += (new Date(sorted[i].startedAt) - new Date(sorted[i - 1].startedAt)) / 86400000;
    }
    avgGapDays = Math.round(gapSum / (sorted.length - 1));
  }

  // Average duration
  const resolvedDurations = resolved.map(e => _episodeDurationDays(e));
  const avgDuration = resolvedDurations.length > 0 ? (resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length).toFixed(1) : null;

  // Insights
  const insights = [];
  const last60Days = all.filter(e => (now - new Date(e.startedAt)) < 60 * 86400000);
  if (last60Days.length >= 3) {
    insights.push({ type: 'warn', text: last60Days.length + ' illness episodes in the last 2 months — worth discussing with your paediatrician at the next visit.' });
  }
  // Co-occurring illness detection (last 6 months only, deduplicated by type pair)
  const seenPairs = new Set();
  const recent = all.filter(e => (now - new Date(e.startedAt)) < 180 * 86400000);
  coLoop:
  for (let i = 0; i < recent.length; i++) {
    for (let j = i + 1; j < recent.length; j++) {
      if (recent[i].illnessType === recent[j].illnessType) continue;
      const pairKey = [recent[i].illnessType, recent[j].illnessType].sort().join('+');
      if (seenPairs.has(pairKey)) continue;
      const a = _episodeDateRange(recent[i]);
      const b = _episodeDateRange(recent[j]);
      if (a.startMs <= b.endMs && b.startMs <= a.endMs) {
        seenPairs.add(pairKey);
        insights.push({
          type: 'info',
          text: recent[i].emoji + ' ' + recent[i].illnessType + ' and ' + recent[j].emoji + ' ' + recent[j].illnessType + ' overlapped around ' +
            formatDate(recent[i].startedAt).replace(/, \d{4}$/, '') + '. Co-occurring illnesses can be harder on babies — good to flag with your doctor.'
        });
        if (seenPairs.size >= 2) break coLoop; // cap at 2 overlap insights
      }
    }
  }

  return { all, typeCounts, months, freqPer30, avgGapDays, avgDuration, totalResolved: resolved.length, insights };
}

function renderInfoIllnessFreq() {
  const summaryEl = document.getElementById('infoIllnessFreqSummary');
  const timelineEl = document.getElementById('infoIllnessFreqTimeline');
  const breakdownEl = document.getElementById('infoIllnessFreqBreakdown');
  const insightsEl = document.getElementById('infoIllnessFreqInsights');
  if (!summaryEl) return;

  const data = computeIllnessFrequency();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">No illness episodes recorded yet</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (breakdownEl) breakdownEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  const activeCount = data.all.filter(e => e.status === 'active').length;
  const activeBadge = activeCount > 0 ? ' · <span style="color:var(--tc-rose);font-weight:600;">' + activeCount + ' active</span>' : '';
  summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.all.length + ' episode' + (data.all.length !== 1 ? 's' : '') +
    '</strong> total' + activeBadge + (data.avgDuration ? ' · <span class="t-light">avg ' + data.avgDuration + ' days</span>' : '') + '</div>';

  // Timeline — 6-month horizontal bar chart
  const typeColors = { fever: 'var(--tc-rose)', diarrhoea: 'var(--tc-amber)', vomiting: 'var(--tc-caution)', cold: 'var(--tc-sky)' };
  let tlHtml = '<div class="mi-timeline">';
  data.months.forEach(m => {
    tlHtml += '<div class="mi-tl-row"><div class="mi-tl-month">' + m.label + '</div><div class="mi-tl-bar">';
    if (m.episodes.length === 0) {
      tlHtml += '<div class="fs-xs-light">—</div>';
    } else {
      m.episodes.forEach(ep => {
        const dur = _episodeDurationDays(ep);
        const w = Math.max(12, Math.min(dur * 18, 120));
        const color = typeColors[ep.illnessType] || 'var(--light)';
        tlHtml += '<div class="mi-tl-block mi-' + ep.illnessType + '" style="width:' + w + 'px;background:' + color + ';" title="' +
          ep.emoji + ' ' + ep.illnessType + ' · ' + dur + 'd · ' + formatDate(ep.startedAt).replace(/, \d{4}$/, '') + '"></div>';
      });
    }
    tlHtml += '</div></div>';
  });
  tlHtml += '</div>';
  tlHtml += '<div class="mi-legend">';
  [['fever', zi('flame'), 'Fever'], ['diarrhoea', zi('diaper'), 'Diarrhoea'], ['vomiting', zi('siren'), 'Vomiting'], ['cold', zi('siren'), 'Cold']].forEach(([k, em, lbl]) => {
    if (data.typeCounts[k] > 0) {
      tlHtml += '<div class="mi-legend-item"><div class="mi-legend-dot" style="background:' + typeColors[k] + ';"></div>' + lbl + ' (' + data.typeCounts[k] + ')</div>';
    }
  });
  tlHtml += '</div>';
  if (timelineEl) timelineEl.innerHTML = tlHtml;

  // Breakdown stats
  let bHtml = '<div class="si-stat-grid">';
  bHtml += '<div class="si-stat"><div class="si-stat-val">' + data.freqPer30 + '</div><div class="si-stat-label">per 30 days</div></div>';
  bHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgGapDays !== null ? data.avgGapDays + 'd' : '–') + '</div><div class="si-stat-label">avg gap</div></div>';
  bHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgDuration || '–') + '</div><div class="si-stat-label">avg duration (days)</div></div>';
  bHtml += '<div class="si-stat"><div class="si-stat-val">' + data.totalResolved + '</div><div class="si-stat-label">resolved</div></div>';
  bHtml += '</div>';
  if (breakdownEl) breakdownEl.innerHTML = bHtml;

  // Insights
  if (insightsEl) {
    if (data.insights.length > 0) {
      insightsEl.innerHTML = data.insights.map(ins =>
        '<div class="si-insight ' + (ins.type === 'warn' ? 'si-insight-warn' : '') + '">' + ins.text + '</div>'
      ).join('');
    } else {
      insightsEl.innerHTML = '';
    }
  }
}

// ════════════════════════════════════════
// 2. VACCINATION ↔ FEVER CORRELATION
// ════════════════════════════════════════

function computeVaccFeverCorrelation() {
  const pastVacc = (vaccData || []).filter(v => !v.upcoming && v.date);
  const feverEps = (_feverEpisodes || []).filter(e => e.startedAt);
  if (pastVacc.length === 0) return null;

  // Group vaccinations by date
  const vaccByDate = {};
  pastVacc.forEach(v => {
    if (!vaccByDate[v.date]) vaccByDate[v.date] = [];
    vaccByDate[v.date].push(v.name);
  });

  const results = [];
  const vaccDates = Object.keys(vaccByDate).sort();
  let feverWithin72hCount = 0;

  vaccDates.forEach(vDate => {
    const vMs = new Date(vDate).getTime();
    const names = vaccByDate[vDate];

    // Look for fever episodes starting within 72h of vaccination
    const matchingFever = feverEps.find(fe => {
      const feMs = new Date(fe.startedAt).getTime();
      const diffH = (feMs - vMs) / 3600000;
      return diffH >= 0 && diffH <= 72;
    });

    const entry = {
      date: vDate,
      vaccines: names,
      hadFever: !!matchingFever,
      feverEpisode: matchingFever || null,
      peakTemp: matchingFever ? matchingFever.peakTemp : null,
      feverDuration: matchingFever ? _episodeDurationDays(matchingFever) : null
    };
    if (matchingFever) feverWithin72hCount++;
    results.push(entry);
  });

  const feverRate = vaccDates.length > 0 ? Math.round((feverWithin72hCount / vaccDates.length) * 100) : 0;

  // Insights
  const insights = [];
  if (feverWithin72hCount > 0) {
    insights.push({
      type: 'info',
      text: 'Post-vaccination fever occurred after ' + feverWithin72hCount + ' of ' + vaccDates.length +
        ' vaccination dates (' + feverRate + '%). This is common and usually resolves within 24-48 hours.'
    });
  }
  // Check if specific vaccines caused fever more often
  const vaccFeverMap = {};
  results.forEach(r => {
    r.vaccines.forEach(v => {
      if (!vaccFeverMap[v]) vaccFeverMap[v] = { total: 0, fever: 0 };
      vaccFeverMap[v].total++;
      if (r.hadFever) vaccFeverMap[v].fever++;
    });
  });

  return { results, feverWithin72hCount, totalVaccDates: vaccDates.length, feverRate, insights, vaccFeverMap };
}

function renderInfoVaccFever() {
  const summaryEl = document.getElementById('infoVaccFeverSummary');
  const timelineEl = document.getElementById('infoVaccFeverTimeline');
  const insightsEl = document.getElementById('infoVaccFeverInsights');
  if (!summaryEl) return;

  const data = computeVaccFeverCorrelation();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">No vaccination data available</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  if (data.feverWithin72hCount > 0) {
    summaryEl.innerHTML = '<div class="t-sm">'+zi('flame')+' Fever after <strong>' + data.feverWithin72hCount + '/' + data.totalVaccDates +
      '</strong> vaccination dates <span class="t-light">(' + data.feverRate + '% rate)</span></div>';
  } else {
    summaryEl.innerHTML = '<div class="t-sm" style="color:var(--tc-sage);font-weight:500;">' + zi('check') + ' No post-vaccination fevers detected across ' + data.totalVaccDates + ' vaccination dates</div>';
  }

  // Timeline — show most recent 5, toggle for rest
  const CAP = 5;
  const showAll = data.results.length <= CAP;
  const visibleResults = showAll ? data.results : data.results.slice(-CAP);
  const hiddenCount = data.results.length - visibleResults.length;

  function _vaccRow(r) {
    const dotColor = r.hadFever ? 'var(--tc-rose)' : 'var(--tc-sage)';
    let h = '<div class="mi-vacc-row">';
    h += '<div class="mi-vacc-dot" style="background:' + dotColor + ';"></div>';
    h += '<div class="mi-vacc-info">';
    h += '<div class="mi-vacc-name">' + r.vaccines.join(', ') + '</div>';
    h += '<div class="mi-vacc-detail">' + formatDate(r.date) + '</div>';
    if (r.hadFever) {
      h += '<div class="mi-vacc-fever">'+zi('flame')+' Fever within 72h — peak ' + (r.peakTemp || '?') + '°F, lasted ' + (r.feverDuration || '?') + ' day(s)</div>';
    }
    h += '</div></div>';
    return h;
  }

  let tlHtml = '';
  if (!showAll) {
    tlHtml += '<div class="t-xs t-light" style="margin-bottom:var(--sp-4);cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'\':\'none\';this.textContent=this.nextElementSibling.style.display===\'none\'?\'Show ' + hiddenCount + ' earlier ▾\':\'Hide earlier ▴\';">Show ' + hiddenCount + ' earlier ▾</div>';
    tlHtml += '<div style="display:none;">';
    data.results.slice(0, hiddenCount).forEach(r => { tlHtml += _vaccRow(r); });
    tlHtml += '</div>';
  }
  visibleResults.forEach(r => { tlHtml += _vaccRow(r); });
  if (timelineEl) timelineEl.innerHTML = tlHtml;

  // Insights
  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 3. ILLNESS ↔ FOOD CORRELATION
// ════════════════════════════════════════

function computeIllnessFoodCorrelation() {
  // Cross-reference diarrhoea and vomiting episode start dates with foods logged 24-48h prior
  const targetEpisodes = [
    ...(_diarrhoeaEpisodes || []).map(e => ({ ...e, illnessType: 'diarrhoea', emoji: zi('diaper') })),
    ...(_vomitingEpisodes || []).map(e => ({ ...e, illnessType: 'vomiting', emoji: zi('siren') }))
  ].filter(e => e.startedAt);

  if (targetEpisodes.length === 0) return null;

  const foodOccurrences = {}; // foodName -> { total episodes where present, episode details }

  targetEpisodes.forEach(ep => {
    const epStart = new Date(ep.startedAt);
    // Look at foods 24-48h before episode start
    const foodsInWindow = new Set();

    for (let h = 12; h <= 48; h += 12) {
      const checkDate = toDateStr(new Date(epStart.getTime() - h * 3600000));
      const dayData = feedingData[checkDate];
      if (!dayData) continue;

      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        if (!dayData[meal]) return;
        const mealFoods = dayData[meal].split(/[,+&]/).map(f => _baseFoodName(f.trim())).filter(f => f);
        mealFoods.forEach(f => foodsInWindow.add(f));
      });
    }

    foodsInWindow.forEach(food => {
      if (!foodOccurrences[food]) foodOccurrences[food] = { count: 0, episodes: [] };
      foodOccurrences[food].count++;
      foodOccurrences[food].episodes.push({
        type: ep.illnessType,
        emoji: ep.emoji,
        date: ep.startedAt
      });
    });
  });

  // Score: foods that appear before multiple illness episodes are suspicious
  // But filter out foods that are eaten daily (they'll correlate with everything)
  const totalIllnessEps = targetEpisodes.length;
  const feedDates = Object.keys(feedingData);
  const totalFeedDays = feedDates.length || 1;

  const correlations = Object.entries(foodOccurrences)
    .map(([food, data]) => {
      // How often is this food eaten overall?
      let daysWithFood = 0;
      feedDates.forEach(d => {
        const day = feedingData[d];
        const allMeals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean).join(',');
        if (allMeals.toLowerCase().includes(food.toLowerCase())) daysWithFood++;
      });
      const foodFreq = daysWithFood / totalFeedDays;
      const illnessRate = data.count / totalIllnessEps;

      // Suspicion score: high if food appears before illness often, but isn't eaten every day
      const suspicion = foodFreq > 0 ? illnessRate / foodFreq : illnessRate;

      return {
        food,
        illnessCount: data.count,
        totalEpisodes: totalIllnessEps,
        daysEaten: daysWithFood,
        totalDays: totalFeedDays,
        foodFreq: Math.round(foodFreq * 100),
        suspicion: Math.round(suspicion * 100) / 100,
        episodes: data.episodes
      };
    })
    .filter(c => c.illnessCount >= 2 || (c.illnessCount >= 1 && c.suspicion > 1.5))
    .sort((a, b) => b.suspicion - a.suspicion)
    .slice(0, 8);

  // Insights
  const insights = [];
  const highSuspicion = correlations.filter(c => c.suspicion > 2 && c.illnessCount >= 2);
  highSuspicion.forEach(c => {
    insights.push({
      type: 'warn',
      text: c.food + ' was eaten 24-48h before ' + c.illnessCount + ' of ' + c.totalEpisodes +
        ' diarrhoea/vomiting episodes, but is only eaten ' + c.foodFreq + '% of days. Worth watching.'
    });
  });

  return { correlations, totalEpisodes: totalIllnessEps, insights };
}

function renderInfoIllnessFood() {
  const summaryEl = document.getElementById('infoIllnessFoodSummary');
  const corrEl = document.getElementById('infoIllnessFoodCorrelations');
  const insightsEl = document.getElementById('infoIllnessFoodInsights');
  if (!summaryEl) return;

  const data = computeIllnessFoodCorrelation();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">No diarrhoea or vomiting episodes to cross-reference</div>';
    if (corrEl) corrEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  if (data.correlations.length > 0) {
    summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.correlations.length + ' food' + (data.correlations.length !== 1 ? 's' : '') +
      '</strong> linked to illness episodes <span class="t-light">· analysing ' + data.totalEpisodes + ' episode(s)</span></div>';
  } else {
    summaryEl.innerHTML = '<div class="t-sm t-sage" >' + zi('check') + ' No clear food-illness patterns detected across ' + data.totalEpisodes + ' episode(s)</div>';
  }

  // Correlation bars
  if (corrEl && data.correlations.length > 0) {
    const maxSusp = Math.max(...data.correlations.map(c => c.suspicion), 1);
    let html = '';
    data.correlations.forEach(c => {
      const pct = Math.round((c.suspicion / maxSusp) * 100);
      const barColor = c.suspicion > 2 ? 'var(--tc-rose)' : c.suspicion > 1 ? 'var(--tc-amber)' : 'var(--tc-sage)';
      const emojiList = c.episodes.map(e => e.emoji).join('');
      html += '<div class="mi-food-row">';
      html += '<div class="mi-food-name">' + c.food + '</div>';
      html += '<div class="mi-food-bar"><div class="mi-food-fill" style="width:' + pct + '%;background:' + barColor + ';"></div></div>';
      html += '<div class="mi-food-count" title="Before ' + c.illnessCount + '/' + c.totalEpisodes + ' episodes">' + emojiList + ' ' + c.illnessCount + '/' + c.totalEpisodes + '</div>';
      html += '</div>';
    });
    corrEl.innerHTML = html;
  } else if (corrEl) {
    corrEl.innerHTML = '';
  }

  // Insights
  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight si-insight-warn">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 4. POST-ILLNESS RECOVERY
// ════════════════════════════════════════

function computePostIllnessRecovery() {
  const resolved = _getAllEpisodes().filter(e => e.status === 'resolved' && e.resolvedAt);
  if (resolved.length === 0) return null;

  const recoveries = [];

  resolved.forEach(ep => {
    const resolveDate = toDateStr(new Date(ep.resolvedAt));
    const startDate = toDateStr(new Date(ep.startedAt));
    const dur = _episodeDurationDays(ep);

    // Weight recovery: find closest weight before and after illness
    const gSorted = (growthData || []).filter(g => g.wt).sort((a, b) => a.date.localeCompare(b.date));
    let wtBefore = null, wtAfter = null;
    for (let i = gSorted.length - 1; i >= 0; i--) {
      if (gSorted[i].date <= startDate) { wtBefore = gSorted[i]; break; }
    }
    for (let i = 0; i < gSorted.length; i++) {
      if (gSorted[i].date >= resolveDate) { wtAfter = gSorted[i]; break; }
    }

    // Appetite recovery: compare meals/day during illness vs 7 days after
    let mealsPerDayDuring = null, mealsPerDayAfter = null;
    const epRange = _episodeDateRange(ep);
    let illMeals = 0, illDays = 0, recMeals = 0, recDays = 0;

    const resolveDateObj = new Date(resolveDate + 'T00:00:00');
    const startDateObj = new Date(startDate + 'T00:00:00');
    for (let d = new Date(startDateObj); d <= resolveDateObj; d.setDate(d.getDate() + 1)) {
      const ds = toDateStr(d);
      const fd = feedingData[ds];
      if (fd) {
        const count = [fd.breakfast, fd.lunch, fd.dinner, fd.snack].filter(m => m && m.trim()).length;
        illMeals += count;
        illDays++;
      }
    }
    for (let i = 1; i <= 7; i++) {
      const d = new Date(resolveDateObj.getTime() + i * 86400000);
      const ds = toDateStr(d);
      const fd = feedingData[ds];
      if (fd) {
        const count = [fd.breakfast, fd.lunch, fd.dinner, fd.snack].filter(m => m && m.trim()).length;
        recMeals += count;
        recDays++;
      }
    }
    if (illDays > 0) mealsPerDayDuring = (illMeals / illDays).toFixed(1);
    if (recDays > 0) mealsPerDayAfter = (recMeals / recDays).toFixed(1);

    recoveries.push({
      illnessType: ep.illnessType,
      emoji: ep.emoji,
      startDate,
      resolveDate,
      duration: dur,
      wtBefore: wtBefore ? { wt: wtBefore.wt, date: wtBefore.date } : null,
      wtAfter: wtAfter ? { wt: wtAfter.wt, date: wtAfter.date } : null,
      weightChange: (wtBefore && wtAfter) ? Math.round((wtAfter.wt - wtBefore.wt) * 100) / 100 : null,
      mealsPerDayDuring,
      mealsPerDayAfter,
      appetiteRecovery: (mealsPerDayDuring && mealsPerDayAfter) ? (parseFloat(mealsPerDayAfter) >= parseFloat(mealsPerDayDuring) ? 'recovered' : 'still low') : null
    });
  });

  // Insights
  const insights = [];
  const wtDrops = recoveries.filter(r => r.weightChange !== null && r.weightChange < 0);
  if (wtDrops.length > 0) {
    insights.push({
      type: 'info',
      text: 'Weight dipped during ' + wtDrops.length + ' illness episode(s). Small dips are normal — steady recovery over 1-2 weeks is expected.'
    });
  }
  const lowAppetite = recoveries.filter(r => r.appetiteRecovery === 'still low');
  if (lowAppetite.length > 0) {
    insights.push({
      type: 'warn',
      text: 'Appetite took longer than a week to recover after ' + lowAppetite.length + ' episode(s). Offer favourite foods and small frequent meals.'
    });
  }

  return { recoveries: recoveries.slice(-5), insights };
}

function renderInfoRecovery() {
  const summaryEl = document.getElementById('infoRecoverySummary');
  const weightEl = document.getElementById('infoRecoveryWeight');
  const appetiteEl = document.getElementById('infoRecoveryAppetite');
  const insightsEl = document.getElementById('infoRecoveryInsights');
  if (!summaryEl) return;

  const data = computePostIllnessRecovery();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">No resolved episodes to analyse</div>';
    if (weightEl) weightEl.innerHTML = '';
    if (appetiteEl) appetiteEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  const withWt = data.recoveries.filter(r => r.weightChange !== null);
  const withApp = data.recoveries.filter(r => r.appetiteRecovery);
  summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.recoveries.length + '</strong> resolved episode(s) analysed' +
    (withWt.length > 0 ? ' · <span class="t-light">' + withWt.length + ' with weight data</span>' : '') + '</div>';

  // Recovery entries
  let html = '';
  data.recoveries.forEach(r => {
    html += '<div class="mi-recovery-entry">';
    html += '<div class="mi-recovery-header">';
    html += '<div class="mi-recovery-type" style="color:' + (r.illnessType === 'fever' ? 'var(--tc-rose)' : r.illnessType === 'diarrhoea' ? 'var(--tc-amber)' : r.illnessType === 'cold' ? 'var(--tc-sky)' : 'var(--tc-caution)') + ';">' + r.emoji + ' ' + r.illnessType + '</div>';
    html += '<div class="mi-recovery-dates">' + formatDate(r.startDate).replace(/, \d{4}$/, '') + ' → ' + formatDate(r.resolveDate).replace(/, \d{4}$/, '') + ' (' + r.duration + 'd)</div>';
    html += '</div>';

    if (r.weightChange !== null) {
      const sign = r.weightChange >= 0 ? '+' : '';
      const color = r.weightChange < 0 ? 'var(--tc-rose)' : 'var(--tc-sage)';
      html += '<div class="mi-recovery-metric"><div class="mi-recovery-label">Weight change</div><div class="mi-recovery-val" style="color:' + color + ';">' + sign + r.weightChange + ' kg</div></div>';
    }
    if (r.mealsPerDayDuring !== null) {
      html += '<div class="mi-recovery-metric"><div class="mi-recovery-label">Meals/day during illness</div><div class="mi-recovery-val">' + r.mealsPerDayDuring + '</div></div>';
    }
    if (r.mealsPerDayAfter !== null) {
      const appColor = r.appetiteRecovery === 'recovered' ? 'var(--tc-sage)' : 'var(--tc-amber)';
      html += '<div class="mi-recovery-metric"><div class="mi-recovery-label">Meals/day after (7d)</div><div class="mi-recovery-val" style="color:' + appColor + ';">' + r.mealsPerDayAfter + (r.appetiteRecovery === 'recovered' ? ' ' + zi('check') : ' ↓') + '</div></div>';
    }
    html += '</div>';
  });

  if (weightEl) weightEl.innerHTML = html;
  if (appetiteEl) appetiteEl.innerHTML = '';

  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight ' + (ins.type === 'warn' ? 'si-insight-warn' : '') + '">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 5. ILLNESS ↔ SLEEP IMPACT
// ════════════════════════════════════════

function computeIllnessSleepImpact() {
  const allEpisodes = _getAllEpisodes().filter(e => e.startedAt);
  if (allEpisodes.length === 0 || !sleepData || sleepData.length === 0) return null;

  // Build a date → illness map
  const illnessDays = {};
  allEpisodes.forEach(ep => {
    const range = _episodeDateRange(ep);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ds = toDateStr(d);
      if (!illnessDays[ds]) illnessDays[ds] = [];
      illnessDays[ds].push(ep.illnessType);
    }
  });

  // Compute sleep metrics for last 28 days with illness overlay
  const now = new Date();
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const ds = toDateStr(d);
    const nightSleep = sleepData.find(s => s.date === ds && s.type === 'night');
    let durationH = null;
    if (nightSleep && nightSleep.bedtime && nightSleep.wakeTime) {
      const [bh, bm] = nightSleep.bedtime.split(':').map(Number);
      const [wh, wm] = nightSleep.wakeTime.split(':').map(Number);
      let mins = (wh * 60 + wm) - (bh * 60 + bm);
      if (mins < 0) mins += 1440;
      durationH = Math.round(mins / 6) / 10; // 1 decimal
    }
    const sick = illnessDays[ds] || [];
    days.push({
      date: ds,
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2),
      hasSleep: !!nightSleep,
      duration: durationH,
      wakeUps: nightSleep ? (nightSleep.wakeUps || 0) : null,
      isSick: sick.length > 0,
      illnessTypes: sick
    });
  }

  // Compute averages: sick nights vs healthy nights
  const sickNights = days.filter(d => d.isSick && d.hasSleep);
  const healthyNights = days.filter(d => !d.isSick && d.hasSleep);

  const avgSickDuration = sickNights.length > 0 ? (sickNights.reduce((s, d) => s + (d.duration || 0), 0) / sickNights.length).toFixed(1) : null;
  const avgHealthyDuration = healthyNights.length > 0 ? (healthyNights.reduce((s, d) => s + (d.duration || 0), 0) / healthyNights.length).toFixed(1) : null;
  const avgSickWakeUps = sickNights.length > 0 ? (sickNights.reduce((s, d) => s + (d.wakeUps || 0), 0) / sickNights.length).toFixed(1) : null;
  const avgHealthyWakeUps = healthyNights.length > 0 ? (healthyNights.reduce((s, d) => s + (d.wakeUps || 0), 0) / healthyNights.length).toFixed(1) : null;

  const insights = [];
  if (avgSickDuration && avgHealthyDuration) {
    const diff = (parseFloat(avgHealthyDuration) - parseFloat(avgSickDuration)).toFixed(1);
    if (diff > 0.5) {
      insights.push({ type: 'info', text: 'Ziva sleeps about ' + diff + 'h less on sick nights (' + avgSickDuration + 'h vs ' + avgHealthyDuration + 'h healthy). Disruption is normal during illness.' });
    }
  }
  if (avgSickWakeUps && avgHealthyWakeUps) {
    const diff = (parseFloat(avgSickWakeUps) - parseFloat(avgHealthyWakeUps)).toFixed(1);
    if (diff > 0.5) {
      insights.push({ type: 'info', text: 'Wake-ups increase by ~' + diff + ' per night during illness (' + avgSickWakeUps + ' vs ' + avgHealthyWakeUps + ' healthy).' });
    }
  }

  // Build 4-week grid (7 cols)
  const weeks = [];
  for (let w = 0; w < 4; w++) {
    weeks.push(days.slice(w * 7, (w + 1) * 7));
  }

  return { days, weeks, sickNights: sickNights.length, healthyNights: healthyNights.length, avgSickDuration, avgHealthyDuration, avgSickWakeUps, avgHealthyWakeUps, insights };
}

function renderInfoIllnessSleep() {
  const summaryEl = document.getElementById('infoIllnessSleepSummary');
  const overlayEl = document.getElementById('infoIllnessSleepOverlay');
  const insightsEl = document.getElementById('infoIllnessSleepInsights');
  if (!summaryEl) return;

  const data = computeIllnessSleepImpact();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">Need both sleep and illness data to analyse</div>';
    if (overlayEl) overlayEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  if (data.sickNights > 0) {
    summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.sickNights + '</strong> sick night(s) in last 28 days · ' +
      (data.avgSickDuration ? '<span class="t-light">' + data.avgSickDuration + 'h avg vs ' + data.avgHealthyDuration + 'h healthy</span>' : '') + '</div>';
  } else {
    summaryEl.innerHTML = '<div class="t-sm t-sage" >' + zi('check') + ' No illness-disrupted nights in the last 28 days</div>';
  }

  // 4-week grid: each cell shows duration + color-coded by sick/healthy/nodata
  let gridHtml = '<div class="t-sm" style="font-weight:600;color:var(--mid);margin-bottom:var(--sp-4);">28-Day Sleep & Illness Overlay</div>';
  gridHtml += '<div class="mi-sleep-grid">';

  // Day headers — use actual weekday labels from first week
  gridHtml += '<div class="mi-sleep-header"></div>';
  const firstWeek = data.weeks[0] || [];
  for (let c = 0; c < 7; c++) {
    const dayLabel = firstWeek[c] ? firstWeek[c].day : '';
    gridHtml += '<div class="mi-sleep-header">' + dayLabel + '</div>';
  }

  // Rows (weeks)
  data.weeks.forEach((week, wi) => {
    gridHtml += '<div class="mi-sleep-label">W' + (wi + 1) + '</div>';
    week.forEach(day => {
      if (!day.hasSleep) {
        gridHtml += '<div class="mi-sleep-cell mi-sleep-nodata" title="' + day.date + '">–</div>';
      } else {
        const cls = day.isSick ? 'mi-sleep-sick' : (day.wakeUps >= 3 ? 'mi-sleep-disrupted' : 'mi-sleep-normal');
        const label = day.duration ? day.duration + 'h' : '?';
        const tip = day.date + (day.isSick ? ' · sick' : '') + ' · ' + (day.wakeUps || 0) + ' wake-ups';
        gridHtml += '<div class="mi-sleep-cell ' + cls + '" title="' + tip + '">' + label + '</div>';
      }
    });
    // Pad if week has fewer than 7 days
    for (let p = week.length; p < 7; p++) {
      gridHtml += '<div class="mi-sleep-cell mi-sleep-nodata">–</div>';
    }
  });
  gridHtml += '</div>';

  // Legend
  gridHtml += '<div class="mi-legend mt-8" >';
  gridHtml += '<div class="mi-legend-item"><div class="mi-legend-dot" style="background:rgba(140,190,160,0.4);"></div>Healthy</div>';
  gridHtml += '<div class="mi-legend-item"><div class="mi-legend-dot" style="background:rgba(230,100,100,0.3);"></div>Sick night</div>';
  gridHtml += '<div class="mi-legend-item"><div class="mi-legend-dot" style="background:rgba(240,180,100,0.3);"></div>Disrupted (3+ wakes)</div>';
  gridHtml += '</div>';

  if (overlayEl) overlayEl.innerHTML = gridHtml;

  // Stats cards
  if (data.sickNights > 0) {
    let statsHtml = '<div class="si-stat-grid">';
    statsHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgSickDuration || '–') + '</div><div class="si-stat-label">avg sick night (h)</div></div>';
    statsHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgHealthyDuration || '–') + '</div><div class="si-stat-label">avg healthy night (h)</div></div>';
    statsHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgSickWakeUps || '–') + '</div><div class="si-stat-label">wake-ups (sick)</div></div>';
    statsHtml += '<div class="si-stat"><div class="si-stat-val">' + (data.avgHealthyWakeUps || '–') + '</div><div class="si-stat-label">wake-ups (healthy)</div></div>';
    statsHtml += '</div>';
    if (overlayEl) overlayEl.innerHTML += statsHtml;
  }

  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 6. NEW FOOD → REACTION TIMELINE
// ════════════════════════════════════════

function computeFoodReactionTimeline() {
  if (!foods || foods.length === 0) return null;

  // For each introduced food, check if any illness started within 48h of introduction
  const allEpisodes = _getAllEpisodes().filter(e => e.startedAt);

  const timelines = foods.map(f => {
    const introDate = f.date;
    if (!introDate) return null;
    const introMs = new Date(introDate).getTime();

    const events = [{ type: 'introduced', date: introDate, label: 'Introduced' }];

    // Check for illness episodes starting within 48h after introduction
    const nearbyEpisodes = allEpisodes.filter(ep => {
      const epMs = new Date(ep.startedAt).getTime();
      const diffH = (epMs - introMs) / 3600000;
      return diffH >= 0 && diffH <= 48;
    });

    nearbyEpisodes.forEach(ep => {
      events.push({
        type: 'symptom',
        date: ep.startedAt,
        label: ep.emoji + ' ' + ep.illnessType,
        illnessType: ep.illnessType,
        resolved: ep.status === 'resolved'
      });
    });

    // Check reaction status from foods array
    const status = f.reaction === 'ok' ? 'ok' : f.reaction === 'watch' ? 'watch' : f.reaction === 'reaction' ? 'reaction' : 'ok';

    return {
      name: f.name,
      introDate,
      status,
      events,
      hasIllnessLink: nearbyEpisodes.length > 0,
      nearbyEpisodeCount: nearbyEpisodes.length
    };
  }).filter(Boolean);

  // Sort: foods with illness links first, then by date descending
  timelines.sort((a, b) => {
    if (a.hasIllnessLink && !b.hasIllnessLink) return -1;
    if (!a.hasIllnessLink && b.hasIllnessLink) return 1;
    return (b.introDate || '').localeCompare(a.introDate || '');
  });

  const withLinks = timelines.filter(t => t.hasIllnessLink);
  const insights = [];
  if (withLinks.length > 0) {
    insights.push({
      type: 'info',
      text: withLinks.length + ' food(s) had illness episodes start within 48h of introduction. Correlation is not causation — but worth noting for your paediatrician.'
    });
  }

  return { timelines, withLinks: withLinks.length, total: timelines.length, insights };
}

function renderInfoFoodReaction() {
  const summaryEl = document.getElementById('infoFoodReactionSummary');
  const timelineEl = document.getElementById('infoFoodReactionTimeline');
  const insightsEl = document.getElementById('infoFoodReactionInsights');
  if (!summaryEl) return;

  const data = computeFoodReactionTimeline();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">No introduced foods to analyse</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  summaryEl.innerHTML = '<div class="t-sm"><strong>' + data.total + '</strong> foods tracked' +
    (data.withLinks > 0 ? ' · <span class="stat-val-amber">' + data.withLinks + ' with illness overlap</span>' : ' · <span class="stat-val-sage">no illness overlaps</span>') + '</div>';

  // Show foods with illness links first, then last 5 others
  if (timelineEl) {
    const toShow = data.timelines.filter(t => t.hasIllnessLink);
    // Add recent introductions (up to 5) that don't have links
    const recent = data.timelines.filter(t => !t.hasIllnessLink).slice(0, 5);
    const display = [...toShow, ...recent];

    let html = '';
    display.forEach(t => {
      const statusCls = t.status === 'ok' ? 'mi-frt-status-ok' : t.status === 'watch' ? 'mi-frt-status-watch' : 'mi-frt-status-react';
      const statusLabel = t.status === 'ok' ? zi('check') + ' OK' : t.status === 'watch' ? zi('scope') + ' Watch' : zi('warn') + ' Reaction';

      html += '<div class="mi-frt-entry">';
      html += '<div class="mi-frt-header">';
      html += '<div class="mi-frt-food">' + t.name + '</div>';
      html += '<div class="mi-frt-status ' + statusCls + '">' + statusLabel + '</div>';
      html += '</div>';

      // Visual timeline: dot → line → dot
      html += '<div class="mi-frt-timeline">';
      t.events.forEach((ev, i) => {
        const dotColor = ev.type === 'introduced' ? 'var(--tc-sage)' : ev.type === 'symptom' ? 'var(--tc-rose)' : 'var(--tc-sage)';
        if (i > 0) html += '<div class="mi-frt-line"></div>';
        html += '<div class="mi-frt-node">';
        html += '<div class="mi-frt-dot" style="background:' + dotColor + ';" title="' + ev.label + '"></div>';
        html += '<div class="mi-frt-event">' + ev.label + '<br>' + formatDate(ev.date).replace(/, \d{4}$/, '') + '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    });

    timelineEl.innerHTML = html;
  }

  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight ' + (ins.type === 'warn' ? 'si-insight-warn' : '') + '">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 7. FOOD REPETITION FATIGUE
// ════════════════════════════════════════

function computeFoodRepetition() {
  const dates = Object.keys(feedingData).sort();
  if (dates.length < 5) return null;

  // Look at last 14 days of feeding data
  const now = new Date();
  const recentDates = dates.filter(d => (now - new Date(d)) < 14 * 86400000).sort();
  if (recentDates.length < 5) return null;

  // Count food appearances per day (how many days out of recent does each food appear)
  const foodDayCount = {}; // food → number of days it appeared in
  const totalDays = recentDates.length;

  recentDates.forEach(d => {
    const day = feedingData[d];
    if (!day) return;
    const allMeals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean).join(',');
    const dayFoods = new Set();
    allMeals.split(/[,+&]/).forEach(f => {
      const base = _baseFoodName(f.trim());
      if (base && base.length > 1) dayFoods.add(base);
    });
    dayFoods.forEach(f => {
      if (!foodDayCount[f]) foodDayCount[f] = { count: 0, mealDates: [] };
      foodDayCount[f].count++;
      foodDayCount[f].mealDates.push(d);
    });
  });

  // Find foods appearing in >60% of days over 5+ day stretches
  const fatigued = [];
  const warned = [];

  Object.entries(foodDayCount).forEach(([food, data]) => {
    const pct = Math.round((data.count / totalDays) * 100);

    // Check for consecutive streak of 5+ days
    let maxStreak = 1, streak = 1;
    const sortedDates = data.mealDates.sort();
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const gap = Math.round((curr - prev) / 86400000);
      if (gap <= 1) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }

    if (pct >= 60 && maxStreak >= 5) {
      fatigued.push({ food, pct, days: data.count, totalDays, streak: maxStreak });
    } else if (pct >= 50 && maxStreak >= 4) {
      warned.push({ food, pct, days: data.count, totalDays, streak: maxStreak });
    }
  });

  // Sort by percentage descending
  fatigued.sort((a, b) => b.pct - a.pct);
  warned.sort((a, b) => b.pct - a.pct);
  const all = [...fatigued, ...warned].slice(0, 8);

  const insights = [];
  if (fatigued.length > 0) {
    insights.push({
      type: 'warn',
      text: fatigued.map(f => f.food).join(', ') + (fatigued.length === 1 ? ' appears' : ' appear') +
        ' in most meals. Try rotating with alternatives to ensure nutrient variety and prevent food fatigue.'
    });
  }
  if (fatigued.length === 0 && warned.length === 0) {
    insights.push({
      type: 'good',
      text: 'Good variety in the last 2 weeks — no food is dominating the diet.'
    });
  }

  return { fatigued, warned, all, totalDays, insights };
}

function renderInfoRepetition() {
  const summaryEl = document.getElementById('infoRepetitionSummary');
  const barsEl = document.getElementById('infoRepetitionBars');
  const insightsEl = document.getElementById('infoRepetitionInsights');
  if (!summaryEl) return;

  const data = computeFoodRepetition();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">Need at least 5 days of meal data</div>';
    if (barsEl) barsEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary
  if (data.fatigued.length > 0) {
    summaryEl.innerHTML = '<div class="t-sm"><span class="stat-val-amber">' + zi('warn') + ' ' + data.fatigued.length +
      ' food' + (data.fatigued.length !== 1 ? 's' : '') + ' over-repeated</span> <span class="t-light">in the last ' + data.totalDays + ' days</span></div>';
  } else if (data.warned.length > 0) {
    summaryEl.innerHTML = '<div class="t-sm"><span class="t-amber">' + data.warned.length +
      ' nearing repetition</span> <span class="t-light">· ' + data.totalDays + ' days analysed</span></div>';
  } else {
    summaryEl.innerHTML = '<div class="t-sm" style="color:var(--tc-sage);font-weight:500;">' + zi('check') + ' Good food variety across ' + data.totalDays + ' days</div>';
  }

  // Bar chart
  if (barsEl && data.all.length > 0) {
    let html = '<div class="t-xs t-light mb-4" >Food frequency over ' + data.totalDays + ' days (threshold: 60%)</div>';
    data.all.forEach(f => {
      const isFatigued = f.pct >= 60 && f.streak >= 5;
      const barColor = isFatigued ? 'var(--tc-rose)' : f.pct >= 50 ? 'var(--tc-amber)' : 'var(--tc-sage)';
      html += '<div class="mi-food-row">';
      html += '<div class="mi-food-name">' + f.food + '</div>';
      html += '<div class="mi-food-bar"><div class="mi-food-fill" style="width:' + f.pct + '%;background:' + barColor + ';"></div></div>';
      html += '<div class="mi-food-count">' + f.pct + '% · ' + f.streak + 'd</div>';
      html += '</div>';
    });
    // 60% threshold line label
    html += '<div class="t-xs t-light" style="text-align:right;margin-top:2px;">streak = consecutive days</div>';
    barsEl.innerHTML = html;
  } else if (barsEl) {
    barsEl.innerHTML = '';
  }

  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight ' + (ins.type === 'warn' ? 'si-insight-warn' : ins.type === 'good' ? 'si-insight-good' : '') + '">' + ins.text + '</div>'
    ).join('');
  }
}

// ════════════════════════════════════════
// 8. TEXTURE PROGRESSION TRACKING
// ════════════════════════════════════════

const TEXTURE_STAGES = [
  { key: 'puree', label: 'Purees', icon: zi('bowl'), keywords: ['puree', 'pureed', 'strained', 'juice'], color: 'rgba(170,130,200,0.7)' },
  { key: 'mashed', label: 'Mashed / Porridge', icon: zi('spoon'), keywords: ['mashed', 'porridge', 'khichdi', ' dal ', ' dal,', 'halwa', 'sheera', 'cereal', 'oatmeal', 'dalia', 'suji', 'ragi porridge', 'rice porridge', 'congee'], color: 'var(--tc-amber)' },
  { key: 'soft', label: 'Soft Chunks', icon: zi('bowl'), keywords: ['boiled', 'steamed', 'soft', 'cooked', 'idli', 'dosa', 'paratha', 'roti', 'chapati', 'upma', 'poha', 'pancake'], color: 'var(--tc-sage)' },
  { key: 'finger', label: 'Finger Foods', icon: zi('baby'), keywords: ['finger', 'stick', 'wedge', 'slice', 'toast', 'biscuit', 'cracker', 'puff', 'makhana', 'cheerio'], color: 'var(--tc-sky)' }
];

function _classifyMealTexture(mealText) {
  if (!mealText || !mealText.trim()) return null;
  const lower = ' ' + mealText.toLowerCase().replace(/[,+&()/]/g, ' ') + ' ';

  // Check from most advanced to least — finger food keywords override softer ones
  for (let i = TEXTURE_STAGES.length - 1; i >= 0; i--) {
    const stage = TEXTURE_STAGES[i];
    if (stage.keywords.some(kw => lower.includes(kw))) return stage.key;
  }

  // Default heuristic: if food names are bare (no texture keyword), classify by age context
  // Whole fruit/veg names without "puree"/"mashed" suggest soft/finger stage
  const bareWords = ['banana', 'avocado', 'apple', 'pear', 'blueberry', 'mango', 'papaya', 'curd', 'yogurt', 'paneer', 'cheese', 'egg'];
  if (bareWords.some(w => lower.includes(w))) return 'soft';

  return 'mashed'; // conservative default for unclassified entries
}

function computeTextureProgression() {
  const dates = Object.keys(feedingData).sort();
  if (dates.length < 3) return null;

  // Classify each day's dominant texture
  const dayTextures = [];
  dates.forEach(d => {
    const day = feedingData[d];
    if (!day) return;
    const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean);
    if (meals.length === 0) return;

    const textures = meals.map(m => _classifyMealTexture(m)).filter(Boolean);
    if (textures.length === 0) return;

    // Dominant texture = most advanced texture present that day
    const stageOrder = { puree: 0, mashed: 1, soft: 2, finger: 3 };
    const maxTexture = textures.reduce((best, t) => stageOrder[t] > stageOrder[best] ? t : best, textures[0]);
    const allTextures = [...new Set(textures)];

    dayTextures.push({
      date: d,
      dominant: maxTexture,
      all: allTextures,
      isMixed: allTextures.length > 1
    });
  });

  if (dayTextures.length === 0) return null;

  // Compute stage percentages across all days
  const stageCounts = { puree: 0, mashed: 0, soft: 0, finger: 0 };
  dayTextures.forEach(dt => {
    dt.all.forEach(t => { if (stageCounts[t] !== undefined) stageCounts[t]++; });
  });
  const total = dayTextures.length;

  // Current stage = dominant texture in most recent 5 days
  const recent = dayTextures.slice(-5);
  const recentDominants = recent.map(d => d.dominant);
  const recentCounts = {};
  recentDominants.forEach(t => { recentCounts[t] = (recentCounts[t] || 0) + 1; });
  const stageIdx = { puree: 0, mashed: 1, soft: 2, finger: 3 };
  const currentStage = Object.entries(recentCounts).sort((a, b) => b[1] - a[1] || (stageIdx[b[0]] || 0) - (stageIdx[a[0]] || 0))[0][0];

  // First appearance of each stage
  const firstSeen = {};
  dayTextures.forEach(dt => {
    dt.all.forEach(t => {
      if (!firstSeen[t]) firstSeen[t] = dt.date;
    });
  });

  // Weekly breakdown (last 6 weeks)
  const now = new Date();
  const weeks = [];
  for (let w = 5; w >= 0; w--) {
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w + 1) * 7);
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7);
    const weekLabel = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const weekDays = dayTextures.filter(dt => {
      const dtDate = new Date(dt.date);
      return dtDate >= weekStart && dtDate < weekEnd;
    });
    const weekTextures = {};
    weekDays.forEach(wd => {
      wd.all.forEach(t => { weekTextures[t] = (weekTextures[t] || 0) + 1; });
    });
    weeks.push({ label: weekLabel, textures: weekTextures, totalDays: weekDays.length });
  }

  // Insights
  const insights = [];
  const currentIdx = stageIdx[currentStage];
  const stageInfo = TEXTURE_STAGES[currentIdx];

  if (currentIdx === 0 && total >= 14) {
    insights.push({ type: 'warn', text: 'Still mostly purees after 2+ weeks of solids. Consider introducing mashed textures to support chewing development.' });
  } else if (currentIdx <= 1 && total >= 21) {
    insights.push({ type: 'info', text: 'Mostly purees and mashed foods. Around 7-8 months, babies benefit from soft chunks and finger foods for oral motor development.' });
  }

  // Check for regression (going back to purees after advancing)
  if (dayTextures.length >= 10) {
    const firstHalf = dayTextures.slice(0, Math.floor(dayTextures.length / 2));
    const secondHalf = dayTextures.slice(Math.floor(dayTextures.length / 2));
    const firstAvg = firstHalf.reduce((s, d) => s + stageIdx[d.dominant], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + stageIdx[d.dominant], 0) / secondHalf.length;
    if (secondAvg < firstAvg - 0.3) {
      insights.push({ type: 'warn', text: 'Texture seems to be going backwards recently. If Ziva is refusing chunks, try offering both purees and chunks at the same meal.' });
    }
  }

  if (stageCounts.finger > 0) {
    insights.push({ type: 'good', text: 'Finger foods are being introduced — great for pincer grasp development and self-feeding confidence.' });
  }

  return { dayTextures, stageCounts, total, currentStage, currentStageInfo: stageInfo, firstSeen, weeks, insights };
}

function renderInfoTexture() {
  const summaryEl = document.getElementById('infoTextureSummary');
  const timelineEl = document.getElementById('infoTextureTimeline');
  const insightsEl = document.getElementById('infoTextureInsights');
  if (!summaryEl) return;

  const data = computeTextureProgression();
  if (!data) {
    summaryEl.innerHTML = '<div class="mi-nodata">Need at least 3 days of meal data</div>';
    if (timelineEl) timelineEl.innerHTML = '';
    if (insightsEl) insightsEl.innerHTML = '';
    return;
  }

  // Summary — current stage
  const stageInfo = data.currentStageInfo;
  summaryEl.innerHTML = '<div class="t-sm">Current: <strong>' + stageInfo.icon + ' ' + stageInfo.label + '</strong> <span class="t-light">· ' + data.total + ' days analysed</span></div>';

  // Stage progression — vertical timeline with bars
  if (timelineEl) {
    let html = '';

    // Stage breakdown
    TEXTURE_STAGES.forEach((stage, i) => {
      const count = data.stageCounts[stage.key] || 0;
      const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
      const isCurrent = stage.key === data.currentStage;
      const firstDate = data.firstSeen[stage.key];

      html += '<div class="mi-tex-stage">';
      html += '<div class="mi-tex-icon" style="background:' + (count > 0 ? stage.color : 'var(--surface-alt)') + ';' + (isCurrent ? 'box-shadow:0 0 0 2px ' + stage.color + ';' : '') + '">' + stage.icon + '</div>';
      html += '<div class="mi-tex-info">';
      html += '<div class="mi-tex-label">' + stage.label + (isCurrent ? ' <span style="font-size:var(--fs-xs);color:' + stage.color + ';">● current</span>' : '') + '</div>';
      if (count > 0) {
        html += '<div class="mi-tex-detail">' + count + ' day' + (count !== 1 ? 's' : '') + ' (' + pct + '%)' + (firstDate ? ' · first: ' + formatDate(firstDate).replace(/, \d{4}$/, '') : '') + '</div>';
        html += '<div class="mi-tex-bar"><div class="mi-tex-fill" style="width:' + pct + '%;background:' + stage.color + ';"></div></div>';
      } else {
        html += '<div class="mi-tex-detail t-light" >Not yet introduced</div>';
      }
      html += '</div></div>';
      if (i < TEXTURE_STAGES.length - 1) {
        html += '<div class="mi-tex-connector"></div>';
      }
    });

    // Weekly texture heatmap
    const activeWeeks = data.weeks.filter(w => w.totalDays > 0);
    if (activeWeeks.length > 0) {
      html += '<div class="t-sm" style="font-weight:600;color:var(--mid);margin-top:var(--sp-16);margin-bottom:var(--sp-4);">Weekly Texture Mix</div>';
      html += '<div class="mi-tex-week-grid" style="grid-template-columns:56px repeat(' + TEXTURE_STAGES.length + ', 1fr);">';
      // Headers
      html += '<div class="mi-tex-week-label"></div>';
      TEXTURE_STAGES.forEach(s => {
        html += '<div style="text-align:center;font-size:var(--fs-2xs);color:var(--light);">' + s.icon + '</div>';
      });
      // Rows
      activeWeeks.forEach(w => {
        html += '<div class="mi-tex-week-label">' + w.label + '</div>';
        TEXTURE_STAGES.forEach(s => {
          const count = w.textures[s.key] || 0;
          if (count === 0) {
            html += '<div class="mi-tex-week-cell t-light" >·</div>';
          } else {
            const cls = 'mi-tex-' + s.key;
            html += '<div class="mi-tex-week-cell ' + cls + '">' + count + '</div>';
          }
        });
      });
      html += '</div>';
    }

    timelineEl.innerHTML = html;
  }

  if (insightsEl) {
    insightsEl.innerHTML = data.insights.map(ins =>
      '<div class="si-insight ' + (ins.type === 'warn' ? 'si-insight-warn' : ins.type === 'good' ? 'si-insight-good' : '') + '">' + ins.text + '</div>'
    ).join('');
  }
}

function computeHydrationIntelligence(windowDays) {
  windowDays = windowDays || 7;
  const todayDate = new Date(today());
  const days = [];

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const wx = getWeatherForDate(ds);
    const hydra = computeDayHydration(ds);
    const poop = getPoopConsistencyForDate(ds);

    days.push({
      date: ds,
      temp: wx ? wx.maxTemp : null,
      humidity: wx ? wx.humidity : null,
      wxCode: wx ? wx.code : null,
      hydraCount: hydra.hydraCount,
      hydraFoods: hydra.hydraFoods,
      hasMeals: hydra.hasMeals,
      poopConsistency: poop,
    });
  }

  // Correlations
  let hotDays = 0, hotDaysHard = 0, hotDaysHydrated = 0;
  let coolDays = 0, coolDaysHard = 0;
  const alerts = [];

  days.forEach(d => {
    if (d.temp === null) return;
    if (d.temp >= 34) {
      hotDays++;
      if (d.poopConsistency === 'hard' || d.poopConsistency === 'pellet') hotDaysHard++;
      if (d.hydraCount >= 1) hotDaysHydrated++;
    } else if (d.temp < 28) {
      coolDays++;
      if (d.poopConsistency === 'hard' || d.poopConsistency === 'pellet') coolDaysHard++;
    }
  });

  // Heat→hard poop correlation
  const hotHardRate = hotDays >= 2 ? (hotDaysHard / hotDays) : null;
  const coolHardRate = coolDays >= 2 ? (coolDaysHard / coolDays) : null;
  if (hotHardRate !== null && hotHardRate > 0.3 && (coolHardRate === null || hotHardRate > coolHardRate + 0.15)) {
    alerts.push({ icon: zi('flame'), text: `Hard stools are ${Math.round(hotHardRate * 100)}% more likely on hot days (≥34°C) — increase hydrating foods on hot days` });
  }

  // Today's weather advisory
  const todayData = days[days.length - 1];
  if (todayData.temp !== null && todayData.temp >= 34 && todayData.hasMeals && todayData.hydraCount === 0) {
    alerts.unshift({ icon: zi('drop'), text: `It's ${todayData.temp}°C today and no hydrating foods logged yet — try watermelon, lauki, coconut water, or buttermilk` });
  } else if (todayData.temp !== null && todayData.temp >= 34 && todayData.hydraCount >= 1) {
    alerts.push({ icon: zi('check'), text: `Hot day (${todayData.temp}°C) but hydration covered — ${todayData.hydraFoods.join(', ')}` });
  }

  // Seasonal pattern
  const avgTemp = days.filter(d => d.temp !== null).reduce((s, d) => s + d.temp, 0) / Math.max(days.filter(d => d.temp !== null).length, 1);
  let season = 'moderate';
  if (avgTemp >= 34) season = 'hot';
  else if (avgTemp >= 28) season = 'warm';
  else if (avgTemp < 20) season = 'cool';

  const seasonTip = season === 'hot' ? 'Summer peak — prioritize lauki, watermelon, coconut water, buttermilk, cucumber daily'
    : season === 'warm' ? 'Warm weather — include at least 1 hydrating food per day'
    : season === 'cool' ? 'Cool weather — warm soups and sattu are great for hydration + warmth'
    : null;

  return { days, alerts, hotDays, hotDaysHard, hotDaysHydrated, season, seasonTip, avgTemp: Math.round(avgTemp) };
}

function renderInfoHydration() {
  const summaryEl = document.getElementById('infoHydrationSummary');
  const gridEl = document.getElementById('infoHydrationGrid');
  const alertsEl = document.getElementById('infoHydrationAlerts');
  const corrEl = document.getElementById('infoHydrationCorr');
  if (!summaryEl) return;

  // Check if we need to fetch weather data
  const todayStr = today();
  const startDate = toDateStr(new Date(new Date(todayStr).getTime() - 6 * 86400000));
  const needsFetch = !_weatherCache[todayStr] || !_weatherCache[startDate];

  if (needsFetch) {
    // Fetch last 14 days for correlation data
    const fetchStart = toDateStr(new Date(new Date(todayStr).getTime() - 13 * 86400000));
    summaryEl.innerHTML = '<div class="t-sm t-light">Loading weather data...</div>';
    fetchHistoricalWeather(fetchStart, todayStr).then(() => {
      _renderHydrationContent();
    });
  } else {
    _renderHydrationContent();
  }
}

function _renderHydrationContent() {
  const summaryEl = document.getElementById('infoHydrationSummary');
  const gridEl = document.getElementById('infoHydrationGrid');
  const alertsEl = document.getElementById('infoHydrationAlerts');
  const corrEl = document.getElementById('infoHydrationCorr');
  if (!summaryEl) return;

  const data = computeHydrationIntelligence(7);

  // Summary
  const daysWithWeather = data.days.filter(d => d.temp !== null).length;
  if (daysWithWeather === 0) {
    summaryEl.innerHTML = '<div class="t-sm t-light">Weather data unavailable — check connection</div>';
    gridEl.innerHTML = '';
    alertsEl.innerHTML = '';
    corrEl.innerHTML = '';
    return;
  }

  const seasonEmoji = data.season === 'hot' ? zi('flame') : data.season === 'warm' ? zi('sun') : data.season === 'cool' ? zi('sprout') : zi('sun');
  summaryEl.innerHTML = `<div class="t-sm">${seasonEmoji} <strong>${data.avgTemp}°C avg</strong> <span class="t-light">this week</span>${data.alerts.length > 0 ? ` · <span class="stat-val-amber">${data.alerts.length} alert${data.alerts.length > 1 ? 's' : ''}</span>` : ' · <span class="stat-val-sage">hydration OK</span>'}</div>`;

  // 3-row grid: Temperature | Hydrating Foods | Poop Consistency
  let gridHtml = '<div class="t-sm" style="font-weight:600;color:var(--mid);margin-bottom:var(--sp-4);">7-Day Hydration Map</div>';
  gridHtml += '<div class="hy-grid">';

  // Headers
  gridHtml += '<div class="hy-header"></div>';
  data.days.forEach(d => {
    const dt = new Date(d.date);
    const dayName = dt.toLocaleDateString('en-IN', { weekday:'short' }).slice(0, 2);
    const isToday = d.date === today();
    gridHtml += `<div class="hy-header" style="${isToday ? 'color:var(--tc-rose);font-weight:700;' : ''}">${dayName}</div>`;
  });

  // Row 1: Temperature
  gridHtml += '<div class="hy-label">' + zi('flame') + ' Temp</div>';
  data.days.forEach(d => {
    if (d.temp === null) {
      gridHtml += '<div class="hy-cell hy-nodata">–</div>';
    } else {
      const cls = d.temp >= 34 ? 'hy-temp-hot' : d.temp >= 28 ? 'hy-temp-warm' : 'hy-temp-cool';
      gridHtml += `<div class="hy-cell ${cls}">${d.temp}°</div>`;
    }
  });

  // Row 2: Hydrating food count
  gridHtml += '<div class="hy-label">' + zi('drop') + ' Hydra</div>';
  data.days.forEach(d => {
    if (!d.hasMeals) {
      gridHtml += '<div class="hy-cell hy-nodata">–</div>';
    } else {
      const lvl = d.hydraCount === 0 ? 'hy-hydra-0' : d.hydraCount <= 1 ? 'hy-hydra-1' : d.hydraCount <= 2 ? 'hy-hydra-2' : 'hy-hydra-3';
      const label = d.hydraCount === 0 ? '·' : d.hydraCount;
      gridHtml += `<div class="hy-cell ${lvl}" title="${d.hydraFoods.join(', ') || 'none'}">${label}</div>`;
    }
  });

  // Row 3: Poop consistency
  gridHtml += '<div class="hy-label">' + zi('diaper') + ' Poop</div>';
  data.days.forEach(d => {
    if (d.poopConsistency === null) {
      gridHtml += '<div class="hy-cell hy-nodata">–</div>';
    } else {
      const cls = (d.poopConsistency === 'hard' || d.poopConsistency === 'pellet') ? 'hy-poop-hard'
        : (d.poopConsistency === 'watery' || d.poopConsistency === 'loose') ? 'hy-poop-loose'
        : 'hy-poop-ok';
      const label = d.poopConsistency.slice(0, 3);
      gridHtml += `<div class="hy-cell ${cls}">${label}</div>`;
    }
  });

  gridHtml += '</div>';

  // Legend
  gridHtml += '<div class="fx-row g8 mt-8" style="align-items:center;justify-content:center;flex-wrap:wrap;">';
  gridHtml += '<div class="hy-cell hy-temp-hot dot-16" >H</div><span class="t-xs t-light">≥34°</span>';
  gridHtml += '<div class="hy-cell hy-temp-warm dot-16" >W</div><span class="t-xs t-light">28-33°</span>';
  gridHtml += '<div class="hy-cell hy-hydra-2" style="width:16px;height:16px;min-height:auto;aspect-ratio:auto;"></div><span class="t-xs t-light">Hydrated</span>';
  gridHtml += '<div class="hy-cell hy-poop-hard dot-16" >!</div><span class="t-xs t-light">Hard</span>';
  gridHtml += '</div>';

  gridEl.innerHTML = gridHtml;

  // Alerts
  if (data.alerts.length > 0) {
    let alertHtml = '';
    data.alerts.forEach(a => {
      alertHtml += `<div class="hy-alert-item"><span>${a.icon}</span><span>${a.text}</span></div>`;
    });
    alertsEl.innerHTML = alertHtml;
  } else {
    alertsEl.innerHTML = '';
  }

  // Season tip
  if (data.seasonTip) {
    corrEl.innerHTML = `<div class="t-sm t-mid" ><strong>Season tip:</strong> ${data.seasonTip}</div>`;
  } else {
    corrEl.innerHTML = '';
  }
}

// ════════════════════════════════════════
// MEDICAL INTELLIGENCE PHASE 2
// ════════════════════════════════════════

// ── Feature 1: Supplement Adherence & Timing ──

function computeSupplementAdherence(windowDays) {
  if (windowDays === undefined) windowDays = 30;
  const activeMeds = (meds || []).filter(function(m) { return m.active; });
  if (activeMeds.length === 0) return null;
  var todayStr = today();
  var todayD = new Date(todayStr);
  var trackingSince = (medChecks && medChecks._trackingSince) ? medChecks._trackingSince : null;
  var results = [];

  activeMeds.forEach(function(med) {
    var medStart = med.start || trackingSince || todayStr;
    var doneCount = 0, skippedCount = 0, missedCount = 0, lateCount = 0;
    var times = []; // minutes since midnight
    var streakCurrent = 0, streakLongest = 0, streakRunning = true;
    var dayOfWeekMisses = [0,0,0,0,0,0,0]; // Sun-Sat
    var dayOfWeekTotal = [0,0,0,0,0,0,0];
    var calendar = []; // {date, status}
    var recentDone = 0, recentTotal = 0, prevDone = 0, prevTotal = 0;

    for (var i = 0; i < windowDays; i++) {
      var d = new Date(todayD);
      d.setDate(d.getDate() - i);
      var ds = toDateStr(d);
      if (ds < medStart) continue;
      if (ds > todayStr) continue;
      var dayEntry = medChecks ? medChecks[ds] : null;
      var status = dayEntry ? dayEntry[med.name] : undefined;
      var dow = d.getDay();

      var calStatus = 'missed';
      if (status && status.indexOf('done') === 0) {
        var timeStr = status.replace('done:', '');
        if (timeStr === 'late') {
          lateCount++;
          calStatus = 'late';
          doneCount++; // late still counts as done for adherence
        } else {
          doneCount++;
          calStatus = 'done';
          // Parse time
          var parsed = _parseSupplementTime(timeStr);
          if (parsed !== null) times.push(parsed);
        }
      } else if (status === 'skipped') {
        skippedCount++;
        calStatus = 'skipped';
        dayOfWeekMisses[dow]++;
      } else if (ds === todayStr) {
        // Today with no entry yet — don't count as missed, skip entirely
        continue;
      } else {
        missedCount++;
        calStatus = 'missed';
        dayOfWeekMisses[dow]++;
      }

      dayOfWeekTotal[dow]++;

      // Streak (counting from today backward)
      if (streakRunning) {
        if (calStatus === 'done' || calStatus === 'late') {
          streakCurrent++;
        } else {
          streakRunning = false;
        }
      }

      // Trend: first 14 days = recent, next 14 = previous
      if (i < 14) { recentTotal++; if (calStatus === 'done' || calStatus === 'late') recentDone++; }
      else if (i < 28) { prevTotal++; if (calStatus === 'done' || calStatus === 'late') prevDone++; }

      calendar.push({ date: ds, status: calStatus });
    }

    // Longest streak in window
    var tempStreak = 0;
    // calendar is newest-first, iterate oldest-first for longest streak
    for (var j = calendar.length - 1; j >= 0; j--) {
      if (calendar[j].status === 'done' || calendar[j].status === 'late') {
        tempStreak++;
        if (tempStreak > streakLongest) streakLongest = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    var totalDays = doneCount + skippedCount + missedCount;
    var adherenceRate = totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0;
    var onTimeRate = totalDays > 0 ? Math.round(((doneCount - lateCount) / totalDays) * 100) : 0;

    // Timing analysis
    var timingAnalysis = null;
    if (times.length >= 3) {
      var avgMin = Math.round(times.reduce(function(s,v){return s+v;}, 0) / times.length);
      var variance = times.reduce(function(s,v){return s + (v - avgMin) * (v - avgMin);}, 0) / times.length;
      var stdDev = Math.round(Math.sqrt(variance));
      var earliest = Math.min.apply(null, times);
      var latest = Math.max.apply(null, times);
      var consistency = stdDev < 60 ? 'Consistent' : (stdDev < 120 ? 'Variable' : 'Irregular');
      // Most common window
      var windows = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      times.forEach(function(t) {
        if (t >= 300 && t < 660) windows.morning++;
        else if (t >= 660 && t < 960) windows.afternoon++;
        else if (t >= 960 && t < 1260) windows.evening++;
        else windows.night++;
      });
      var bestWindow = 'morning';
      var bestWindowCount = 0;
      Object.keys(windows).forEach(function(k) { if (windows[k] > bestWindowCount) { bestWindowCount = windows[k]; bestWindow = k; } });
      timingAnalysis = { avgMin: avgMin, stdDev: stdDev, earliest: earliest, latest: latest, consistency: consistency, bestWindow: bestWindow };
    }

    // Day-of-week pattern
    var flaggedDays = [];
    for (var dow2 = 0; dow2 < 7; dow2++) {
      if (dayOfWeekTotal[dow2] >= 2 && dayOfWeekMisses[dow2] / dayOfWeekTotal[dow2] >= 0.5) {
        flaggedDays.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow2]);
      }
    }

    // Trend
    var recentRate = recentTotal > 0 ? Math.round((recentDone / recentTotal) * 100) : 0;
    var prevRate = prevTotal > 0 ? Math.round((prevDone / prevTotal) * 100) : 0;
    var trend = recentTotal < 7 ? 'insufficient' : (recentRate > prevRate + 10 ? 'improving' : (recentRate < prevRate - 10 ? 'declining' : 'stable'));

    results.push({
      name: med.name,
      adherenceRate: adherenceRate,
      onTimeRate: onTimeRate,
      doneCount: doneCount,
      skippedCount: skippedCount,
      missedCount: missedCount,
      lateCount: lateCount,
      currentStreak: streakCurrent,
      longestStreak: streakLongest,
      totalDays: totalDays,
      timing: timingAnalysis,
      flaggedDays: flaggedDays,
      calendar: calendar,
      trend: trend,
      recentRate: recentRate,
      prevRate: prevRate
    });
  });

  return results.length > 0 ? results : null;
}

function _parseSupplementTime(str) {
  // Parse 'HH:MM am/pm' or 'HH:MM AM/PM' to minutes since midnight
  if (!str || str === 'late') return null;
  str = str.trim().toLowerCase();
  var match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return null;
  var h = parseInt(match[1], 10);
  var m = parseInt(match[2], 10);
  var ampm = match[3];
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + m;
}

function _minutesToTimeStr(mins) {
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 || 12;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function renderInfoSupplementAdherence() {
  var data = computeSupplementAdherence(30);
  var summaryEl = document.getElementById('infoSupplementSummary');
  var calEl = document.getElementById('infoSupplementCalendar');
  var gridEl = document.getElementById('infoSupplementGrid');
  var timingEl = document.getElementById('infoSupplementTiming');
  var insightEl = document.getElementById('infoSupplementInsight');
  if (!summaryEl) return;

  if (!data || data.length === 0) {
    summaryEl.innerHTML = '<span class="t-sm t-light" >No active supplements being tracked</span>';
    if (calEl) calEl.innerHTML = '';
    if (gridEl) gridEl.innerHTML = '';
    if (timingEl) timingEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  var med = data[0]; // Primary supplement (Vitamin D3)

  // Summary
  var timingLabel = med.timing ? med.timing.consistency : 'N/A';
  var trendIcon = med.trend === 'improving' ? '↗' : (med.trend === 'declining' ? '↘' : '→');
  summaryEl.innerHTML = '<span class="t-sm t-mid" >' + escHtml(med.name) + ': ' + med.adherenceRate + '% adherence · ' + med.currentStreak + ' day streak · Timing: ' + timingLabel + ' ' + trendIcon + '</span>';

  // 30-day dot calendar (newest first in data, display oldest→newest left→right)
  if (calEl) {
    var html = '<div class="si-sub-label">Last 30 Days</div>';
    html += '<div class="mi-adherence-row">';
    var calSorted = med.calendar.slice().reverse(); // oldest first
    calSorted.forEach(function(c) {
      var cls = 'mi-adh-' + c.status;
      var sym = c.status === 'done' ? zi('check') : (c.status === 'skipped' ? '–' : (c.status === 'late' ? zi('check') : '—'));
      var dateLabel = new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      html += '<div class="mi-adherence-dot ' + cls + '" title="' + dateLabel + ': ' + c.status + '">' + sym + '</div>';
    });
    html += '</div>';
    // Legend
    html += '<div class="mi-legend" style="margin-top:var(--sp-4);">';
    html += '<div class="mi-legend-item"><div class="mi-adherence-dot mi-adh-done dot-10" ></div> Done</div>';
    html += '<div class="mi-legend-item"><div class="mi-adherence-dot mi-adh-missed dot-10" ></div> Missed</div>';
    html += '<div class="mi-legend-item"><div class="mi-adherence-dot mi-adh-skipped dot-10" ></div> Skipped</div>';
    html += '<div class="mi-legend-item"><div class="mi-adherence-dot mi-adh-late dot-10" ></div> Late</div>';
    html += '</div>';
    calEl.innerHTML = html;
  }

  // Stat grid
  if (gridEl) {
    var avgTimeStr = med.timing ? _minutesToTimeStr(med.timing.avgMin) : '—';
    gridEl.innerHTML = '<div class="si-stat-grid">' +
      '<div class="si-stat"><div class="si-stat-val" style="color:' + (med.adherenceRate >= 90 ? 'var(--tc-sage)' : (med.adherenceRate >= 70 ? 'var(--tc-amber)' : 'var(--tc-rose)')) + ';">' + med.adherenceRate + '%</div><div class="si-stat-label">Adherence</div></div>' +
      '<div class="si-stat"><div class="si-stat-val t-indigo" >' + med.currentStreak + '</div><div class="si-stat-label">Current streak</div></div>' +
      '<div class="si-stat"><div class="si-stat-val">' + avgTimeStr + '</div><div class="si-stat-label">Avg time</div></div>' +
      '<div class="si-stat"><div class="si-stat-val t-rose" >' + (med.missedCount + med.skippedCount) + '</div><div class="si-stat-label">Missed/skipped</div></div>' +
      '</div>';
  }

  // Timing analysis
  if (timingEl) {
    if (med.timing) {
      var tHtml = '<div class="si-sub-label">Timing Pattern</div>';
      tHtml += '<div style="font-size:var(--fs-sm);color:var(--mid);margin-top:var(--sp-4);">Usually given in the <strong>' + med.timing.bestWindow + '</strong> · Average: ' + _minutesToTimeStr(med.timing.avgMin) + ' · Range: ' + _minutesToTimeStr(med.timing.earliest) + ' – ' + _minutesToTimeStr(med.timing.latest) + '</div>';
      if (med.flaggedDays.length > 0) {
        tHtml += '<div style="font-size:var(--fs-sm);color:var(--tc-amber);margin-top:var(--sp-4);">' + zi('warn') + ' Tends to be missed on ' + med.flaggedDays.join(', ') + '</div>';
      }
      timingEl.innerHTML = tHtml;
    } else {
      timingEl.innerHTML = '<div class="fs-xs-light">Need more data for timing analysis</div>';
    }
  }

  // Insight
  if (insightEl) {
    var iHtml = '';
    if (med.adherenceRate === 100) {
      iHtml = '<div class="si-insight si-insight-good">100% adherence this month — excellent consistency!</div>';
    } else if (med.adherenceRate >= 90) {
      iHtml = '<div class="si-insight si-insight-good">Strong adherence at ' + med.adherenceRate + '%. ' + (med.missedCount + med.skippedCount) + ' missed days — try setting a daily alarm.</div>';
    } else if (med.adherenceRate >= 70) {
      iHtml = '<div class="si-insight si-insight-warn">Adherence has room for improvement at ' + med.adherenceRate + '%.' + (med.flaggedDays.length > 0 ? ' Most misses happen on ' + med.flaggedDays.join(', ') + '.' : '') + '</div>';
    } else {
      iHtml = '<div class="si-insight si-insight-warn">' + escHtml(med.name) + ' was missed ' + (med.missedCount + med.skippedCount) + ' times this month. Consider linking it to a fixed daily routine (e.g., after morning feed).</div>';
    }
    if (med.timing) {
      if (med.timing.consistency === 'Consistent') {
        iHtml += '<div class="si-insight si-insight-info">Usually given around ' + _minutesToTimeStr(med.timing.avgMin) + ' — consistent timing helps absorption.</div>';
      } else if (med.timing.consistency !== 'Consistent') {
        iHtml += '<div class="si-insight si-insight-info">Administration time varies by ±' + Math.round(med.timing.stdDev) + ' minutes. A fixed time each day is ideal.</div>';
      }
    }
    insightEl.innerHTML = iHtml;
  }
}

// ── Feature 2: Vaccination Recovery Tracking ──

function computeVaccRecovery() {
  var pastVacc = (vaccData || []).filter(function(v) { return !v.upcoming && v.date; });
  if (pastVacc.length === 0) return null;

  // Group by date
  var vaccByDate = {};
  pastVacc.forEach(function(v) {
    if (!vaccByDate[v.date]) vaccByDate[v.date] = [];
    vaccByDate[v.date].push(v.name);
  });
  var vaccDates = Object.keys(vaccByDate).sort();

  // Get fever correlation data
  var feverData = computeVaccFeverCorrelation();
  var feverByDate = {};
  if (feverData && feverData.results) {
    feverData.results.forEach(function(r) {
      feverByDate[r.date] = r;
    });
  }

  var profiles = [];
  var totalSleepRecDays = 0, sleepRecCount = 0;
  var totalPoopRecDays = 0, poopRecCount = 0;

  vaccDates.forEach(function(vDate) {
    var vaccines = vaccByDate[vDate];

    // Sleep impact: 7 days pre + 7 days post
    var sleepBaseline = _getAvgScore(vDate, -7, -1, 'sleep');
    var sleepPost = [];
    var sleepRecoveryDays = null;
    var sleepWorstDay = null;
    var sleepWorstDelta = 0;

    if (sleepBaseline !== null && sleepBaseline.count >= 3) {
      for (var d = 0; d <= 6; d++) {
        var ds = _offsetDateStr(vDate, d);
        var sleepObj = getDailySleepScore(ds);
        var score = (sleepObj && typeof sleepObj.score === 'number') ? sleepObj.score : null;
        if (score !== null) {
          sleepPost.push({ day: d, score: score, delta: score - sleepBaseline.avg });
          if (score - sleepBaseline.avg < sleepWorstDelta) {
            sleepWorstDelta = score - sleepBaseline.avg;
            sleepWorstDay = d;
          }
        } else {
          sleepPost.push({ day: d, score: null, delta: null });
        }
      }
      // Recovery: first day score >= baseline - 5
      for (var r = 0; r < sleepPost.length; r++) {
        if (sleepPost[r].score !== null && sleepPost[r].score >= sleepBaseline.avg - 5) {
          sleepRecoveryDays = r;
          break;
        }
      }
      if (sleepRecoveryDays === null && sleepPost.length > 0) sleepRecoveryDays = 7; // not recovered within window
      if (sleepRecoveryDays !== null) { totalSleepRecDays += sleepRecoveryDays; sleepRecCount++; }
    }

    // Poop impact
    var poopBaseline = _getAvgScore(vDate, -7, -1, 'poop');
    var poopPost = [];
    var poopRecoveryDays = null;
    var poopWorstDay = null;
    var poopWorstDelta = 0;

    if (poopBaseline !== null && poopBaseline.count >= 3) {
      for (var p = 0; p <= 6; p++) {
        var pds = _offsetDateStr(vDate, p);
        var pScore = calcPoopScore(pds);
        var pVal = (pScore && typeof pScore.score === 'number') ? pScore.score : null;
        if (pVal !== null) {
          poopPost.push({ day: p, score: pVal, delta: pVal - poopBaseline.avg });
          if (pVal - poopBaseline.avg < poopWorstDelta) {
            poopWorstDelta = pVal - poopBaseline.avg;
            poopWorstDay = p;
          }
        } else {
          poopPost.push({ day: p, score: null, delta: null });
        }
      }
      for (var r2 = 0; r2 < poopPost.length; r2++) {
        if (poopPost[r2].score !== null && poopPost[r2].score >= poopBaseline.avg - 5) {
          poopRecoveryDays = r2;
          break;
        }
      }
      if (poopRecoveryDays === null && poopPost.length > 0) poopRecoveryDays = 7;
      if (poopRecoveryDays !== null) { totalPoopRecDays += poopRecoveryDays; poopRecCount++; }
    }

    // Fever info
    var feverInfo = feverByDate[vDate] || null;

    profiles.push({
      date: vDate,
      vaccines: vaccines,
      sleep: {
        baseline: sleepBaseline ? sleepBaseline.avg : null,
        postScores: sleepPost,
        recoveryDays: sleepRecoveryDays,
        worstDay: sleepWorstDay,
        insufficient: sleepBaseline === null || sleepBaseline.count < 3
      },
      poop: {
        baseline: poopBaseline ? poopBaseline.avg : null,
        postScores: poopPost,
        recoveryDays: poopRecoveryDays,
        worstDay: poopWorstDay,
        insufficient: poopBaseline === null || poopBaseline.count < 3
      },
      fever: {
        occurred: feverInfo ? feverInfo.hadFever : false,
        peakTemp: feverInfo ? feverInfo.peakTemp : null,
        durationDays: feverInfo ? feverInfo.feverDuration : null
      }
    });
  });

  var avgSleepRec = sleepRecCount > 0 ? Math.round(totalSleepRecDays / sleepRecCount * 10) / 10 : null;
  var avgPoopRec = poopRecCount > 0 ? Math.round(totalPoopRecDays / poopRecCount * 10) / 10 : null;
  var feverRateVal = feverData ? feverData.feverRate : 0;

  // Upcoming prediction
  var upcoming = (vaccData || []).filter(function(v) { return v.upcoming; }).sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  var nextVacc = upcoming.length > 0 ? upcoming[0] : null;
  var prediction = null;
  if (nextVacc && profiles.length > 0) {
    var daysUntil = Math.ceil((new Date(nextVacc.date) - new Date(today())) / 86400000);
    prediction = {
      name: nextVacc.name,
      date: nextVacc.date,
      daysUntil: daysUntil,
      expectedSleepDays: avgSleepRec,
      expectedPoopDays: avgPoopRec,
      feverLikely: feverRateVal > 50
    };
  }

  return {
    profiles: profiles,
    avgSleepRecovery: avgSleepRec,
    avgPoopRecovery: avgPoopRec,
    feverRate: feverRateVal,
    totalVaccDates: vaccDates.length,
    prediction: prediction
  };
}

// _offsetDateStr → migrated to core.js

function _getAvgScore(baseDate, fromDay, toDay, type) {
  var total = 0, count = 0;
  for (var i = fromDay; i <= toDay; i++) {
    var ds = _offsetDateStr(baseDate, i);
    var score = null;
    if (type === 'sleep') {
      var sleepResult = getDailySleepScore(ds);
      score = (sleepResult && typeof sleepResult.score === 'number') ? sleepResult.score : null;
    } else if (type === 'poop') {
      var ps = calcPoopScore(ds);
      score = (ps && typeof ps.score === 'number') ? ps.score : null;
    }
    if (score !== null && typeof score === 'number') {
      total += score;
      count++;
    }
  }
  return count > 0 ? { avg: Math.round(total / count), count: count } : null;
}

function renderInfoVaccRecovery() {
  var data = computeVaccRecovery();
  var summaryEl = document.getElementById('infoVaccRecoverySummary');
  var listEl = document.getElementById('infoVaccRecoveryList');
  var gridEl = document.getElementById('infoVaccRecoveryGrid');
  var predictEl = document.getElementById('infoVaccRecoveryPredict');
  if (!summaryEl) return;

  if (!data || data.profiles.length === 0) {
    summaryEl.innerHTML = '<span class="t-sm t-light" >No past vaccinations to analyze</span>';
    if (listEl) listEl.innerHTML = '';
    if (gridEl) gridEl.innerHTML = '';
    if (predictEl) predictEl.innerHTML = '';
    return;
  }

  // Summary
  var sleepStr = data.avgSleepRecovery !== null ? data.avgSleepRecovery + 'd sleep' : '—';
  var poopStr = data.avgPoopRecovery !== null ? data.avgPoopRecovery + 'd poop' : '—';
  var nextStr = data.prediction ? ' · Next: ' + escHtml(data.prediction.name) + ' in ' + data.prediction.daysUntil + ' days' : '';
  summaryEl.innerHTML = '<span class="t-sm t-mid" >Avg recovery: ' + sleepStr + ', ' + poopStr + nextStr + '</span>';

  // Per-vaccination rows
  if (listEl) {
    var html = '<div class="si-sub-label">Per-Vaccination Recovery</div>';
    // Show last 4 vaccination dates (most relevant)
    var showProfiles = data.profiles.slice(-4).reverse();
    showProfiles.forEach(function(p) {
      var dateLabel = new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
      var vaccNames = p.vaccines.length <= 2 ? p.vaccines.join(', ') : p.vaccines.slice(0, 2).join(', ') + ' +' + (p.vaccines.length - 2);
      var sleepRec = p.sleep.insufficient ? '—' : (p.sleep.recoveryDays !== null ? p.sleep.recoveryDays + 'd' : '—');
      var poopRec = p.poop.insufficient ? '—' : (p.poop.recoveryDays !== null ? p.poop.recoveryDays + 'd' : '—');
      var feverBadge = p.fever.occurred ? '<span style="color:var(--tc-rose);font-size:var(--fs-xs);font-weight:500;">'+zi('flame')+' ' + (p.fever.peakTemp ? p.fever.peakTemp + '°' : 'Yes') + '</span>' : '<span style="color:var(--tc-sage);font-size:var(--fs-xs);">No fever</span>';

      html += '<div class="si-check-row" style="flex-wrap:wrap;">';
      html += '<div style="flex:1;min-width:120px;"><div class="fs-sm-600">' + dateLabel + '</div><div class="fs-xs-light">' + escHtml(vaccNames) + '</div></div>';
      html += '<div style="display:flex;gap:var(--sp-12);align-items:center;flex-wrap:wrap;">';
      html += '<span class="fs-xs-mid">'+zi('zzz')+' ' + sleepRec + '</span>';
      html += '<span class="fs-xs-mid">'+zi('diaper')+' ' + poopRec + '</span>';
      html += feverBadge;
      html += '</div></div>';
    });
    listEl.innerHTML = html;
  }

  // Stat grid
  if (gridEl) {
    gridEl.innerHTML = '<div class="si-stat-grid">' +
      '<div class="si-stat"><div class="si-stat-val t-indigo" >' + (data.avgSleepRecovery !== null ? data.avgSleepRecovery + 'd' : '—') + '</div><div class="si-stat-label">Avg sleep recovery</div></div>' +
      '<div class="si-stat"><div class="si-stat-val t-amber" >' + (data.avgPoopRecovery !== null ? data.avgPoopRecovery + 'd' : '—') + '</div><div class="si-stat-label">Avg poop recovery</div></div>' +
      '<div class="si-stat"><div class="si-stat-val t-rose" >' + data.feverRate + '%</div><div class="si-stat-label">Fever rate</div></div>' +
      '<div class="si-stat"><div class="si-stat-val">' + data.totalVaccDates + '</div><div class="si-stat-label">Vacc dates</div></div>' +
      '</div>';
  }

  // Prediction
  if (predictEl) {
    if (data.prediction) {
      var pred = data.prediction;
      var pHtml = '<div class="si-insight si-insight-info">';
      pHtml += '<strong>' + escHtml(pred.name) + '</strong> is due ' + new Date(pred.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (pred.daysUntil >= 0) pHtml += ' (' + pred.daysUntil + ' days away)';
      pHtml += '. ';
      if (pred.expectedSleepDays !== null) {
        pHtml += 'Based on past patterns, expect ~' + pred.expectedSleepDays + ' days of sleep disruption';
        if (pred.expectedPoopDays !== null) pHtml += ' and ~' + pred.expectedPoopDays + ' days of poop changes';
        pHtml += '. ';
      }
      if (pred.feverLikely) {
        pHtml += 'Fever is likely — keep paracetamol ready.';
      } else {
        pHtml += 'Fever is less common based on history.';
      }
      pHtml += '</div>';
      predictEl.innerHTML = pHtml;
    } else {
      predictEl.innerHTML = '';
    }
  }
}

// ── Feature 3: Growth Velocity Alerts ──

function computeGrowthVelocity() {
  var gd = (growthData || []).filter(function(g) { return g.date; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  if (gd.length < 2) return { insufficient: true, needed: 2, count: gd.length };

  var todayStr = today();

  // WEIGHT VELOCITY
  var weightEntries = gd.filter(function(g) { return typeof g.wt === 'number' && g.wt > 0; });
  var weightResult = null;
  if (weightEntries.length >= 2) {
    var wLatest = weightEntries[weightEntries.length - 1];
    var wPrev = weightEntries[weightEntries.length - 2];
    var wDaysBetween = Math.max(1, Math.round((new Date(wLatest.date) - new Date(wPrev.date)) / 86400000));
    var wGainG = Math.round((wLatest.wt - wPrev.wt) * 1000);
    var gPerDay = Math.round(wGainG / wDaysBetween * 10) / 10;

    // Expected velocity by age
    var ageMo = ageMonthsAt(wLatest.date);
    var expectedRange;
    if (ageMo < 3) expectedRange = { min: 25, max: 35, label: '0–3 months' };
    else if (ageMo < 6) expectedRange = { min: 15, max: 25, label: '3–6 months' };
    else if (ageMo < 9) expectedRange = { min: 10, max: 18, label: '6–9 months' };
    else expectedRange = { min: 8, max: 13, label: '9–12 months' };

    var wStatus;
    if (gPerDay < expectedRange.min * 0.5) wStatus = 'plateau';
    else if (gPerDay < expectedRange.min) wStatus = 'slow';
    else if (gPerDay > expectedRange.max * 1.3) wStatus = 'fast';
    else wStatus = 'on-track';

    // Plateau detection
    var isPlateau = wGainG < 50 && wDaysBetween >= 14;
    if (isPlateau) wStatus = 'plateau';

    // Freshness
    var daysSinceWeight = Math.round((new Date(todayStr) - new Date(wLatest.date)) / 86400000);
    var weightStale = daysSinceWeight > 21;

    // Total gain since birth
    var birthWeight = weightEntries[0].wt;
    var totalGainG = Math.round((wLatest.wt - birthWeight) * 1000);

    weightResult = {
      latest: wLatest,
      prev: wPrev,
      gPerDay: gPerDay,
      gainG: wGainG,
      daysBetween: wDaysBetween,
      expectedRange: expectedRange,
      status: wStatus,
      isPlateau: isPlateau,
      daysSince: daysSinceWeight,
      stale: weightStale,
      totalGainG: totalGainG
    };
  }

  // HEIGHT VELOCITY
  var heightEntries = gd.filter(function(g) { return typeof g.ht === 'number' && g.ht > 0; });
  var heightResult = null;
  if (heightEntries.length >= 2) {
    var hLatest = heightEntries[heightEntries.length - 1];
    var hPrev = heightEntries[heightEntries.length - 2];
    var hDaysBetween = Math.max(1, Math.round((new Date(hLatest.date) - new Date(hPrev.date)) / 86400000));
    var cmGain = Math.round((hLatest.ht - hPrev.ht) * 10) / 10;
    var cmPerMonth = Math.round(cmGain / hDaysBetween * 30.44 * 10) / 10;

    var hAgeMo = ageMonthsAt(hLatest.date);
    var hExpected = (hAgeMo < 6) ? { min: 2.0, max: 3.5 } : { min: 1.0, max: 2.5 };
    var hStatus = cmPerMonth < hExpected.min ? 'slow' : (cmPerMonth > hExpected.max ? 'fast' : 'on-track');

    var daysSinceHeight = Math.round((new Date(todayStr) - new Date(hLatest.date)) / 86400000);

    heightResult = {
      latest: hLatest,
      prev: hPrev,
      cmPerMonth: cmPerMonth,
      cmGain: cmGain,
      daysBetween: hDaysBetween,
      expectedRange: hExpected,
      status: hStatus,
      daysSince: daysSinceHeight,
      stale: daysSinceHeight > 30
    };
  }

  // PERCENTILE TRACKING
  var percentiles = [];
  weightEntries.forEach(function(we) {
    var ageMo = ageMonthsAt(we.date);
    var ref = getGrowthRef(ageMo);
    if (ref && ref.wt) {
      var pctResult = calcPercentile(we.wt, ref.wt.p3, ref.wt.p50, ref.wt.p97, ref.wt.p15, ref.wt.p85);
      percentiles.push({ date: we.date, weight: we.wt, percentile: pctResult.pct });
    }
  });

  // Crossing detection
  var crossings = [];
  for (var i = 1; i < percentiles.length; i++) {
    var diff = percentiles[i].percentile - percentiles[i - 1].percentile;
    if (Math.abs(diff) > 15) {
      crossings.push({
        from: percentiles[i - 1].percentile,
        to: percentiles[i].percentile,
        direction: diff > 0 ? 'climbing' : 'dropping',
        date: percentiles[i].date
      });
    }
  }

  var latestPercentile = percentiles.length > 0 ? percentiles[percentiles.length - 1].percentile : null;

  // Weight-for-height check
  var proportionFlag = null;
  if (latestPercentile !== null && heightEntries.length > 0) {
    var hLatestEntry = heightEntries[heightEntries.length - 1];
    var hAgeMo2 = ageMonthsAt(hLatestEntry.date);
    var hRef = getGrowthRef(hAgeMo2);
    if (hRef && hRef.ht) {
      var hPctResult = calcPercentile(hLatestEntry.ht, hRef.ht.p3, hRef.ht.p50, hRef.ht.p97, hRef.ht.p15, hRef.ht.p85);
      if (Math.abs(latestPercentile - hPctResult.pct) > 30) {
        proportionFlag = { weightPct: latestPercentile, heightPct: hPctResult.pct };
      }
    }
  }

  return {
    insufficient: false,
    weight: weightResult,
    height: heightResult,
    percentiles: percentiles,
    latestPercentile: latestPercentile,
    crossings: crossings,
    proportionFlag: proportionFlag
  };
}

function renderInfoGrowthVelocity() {
  var data = computeGrowthVelocity();
  var summaryEl = document.getElementById('infoGrowthVelocitySummary');
  var barEl = document.getElementById('infoGrowthVelocityBar');
  var pctEl = document.getElementById('infoGrowthVelocityPercentile');
  var gridEl = document.getElementById('infoGrowthVelocityGrid');
  var insightEl = document.getElementById('infoGrowthVelocityInsight');
  if (!summaryEl) return;

  if (data.insufficient) {
    summaryEl.innerHTML = '<span class="t-sm t-light" >Need ' + data.needed + ' weight entries (have ' + data.count + ')</span>';
    if (barEl) barEl.innerHTML = '';
    if (pctEl) pctEl.innerHTML = '';
    if (gridEl) gridEl.innerHTML = '';
    if (insightEl) insightEl.innerHTML = '';
    return;
  }

  // Summary line
  var wStr = data.weight ? data.weight.gPerDay + 'g/day (' + data.weight.status + ')' : '—';
  var hStr = data.height ? data.height.cmPerMonth + 'cm/mo (' + data.height.status + ')' : '—';
  var pStr = data.latestPercentile !== null ? Math.round(data.latestPercentile) + 'th' : '—';
  summaryEl.innerHTML = '<span class="t-sm t-mid" >Weight: ' + wStr + ' · Height: ' + hStr + ' · ' + pStr + ' percentile</span>';

  // Velocity bar
  if (barEl && data.weight) {
    var w = data.weight;
    var rangeMin = Math.max(0, w.expectedRange.min - 5);
    var rangeMax = w.expectedRange.max + 10;
    var totalRange = rangeMax - rangeMin;
    var expLeftPct = Math.round(((w.expectedRange.min - rangeMin) / totalRange) * 100);
    var expWidthPct = Math.round(((w.expectedRange.max - w.expectedRange.min) / totalRange) * 100);
    var markerPct = Math.max(0, Math.min(100, Math.round(((w.gPerDay - rangeMin) / totalRange) * 100)));
    var markerColor = w.status === 'on-track' ? 'var(--tc-sage)' : (w.status === 'slow' || w.status === 'plateau' ? 'var(--tc-amber)' : 'var(--tc-sky)');

    var bHtml = '<div class="si-sub-label">Weight Velocity (' + w.expectedRange.label + ' expected: ' + w.expectedRange.min + '–' + w.expectedRange.max + ' g/day)</div>';
    bHtml += '<div class="mi-velocity-range">';
    bHtml += '<div class="mi-velocity-expected" style="left:' + expLeftPct + '%;width:' + expWidthPct + '%;"></div>';
    bHtml += '<div class="mi-velocity-marker" style="left:' + markerPct + '%;background:' + markerColor + ';"></div>';
    bHtml += '</div>';
    bHtml += '<div style="display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--light);"><span>' + rangeMin + '</span><span style="color:var(--text);font-weight:600;">' + w.gPerDay + ' g/day</span><span>' + rangeMax + '</span></div>';
    barEl.innerHTML = bHtml;
  } else if (barEl) {
    barEl.innerHTML = '';
  }

  // Percentile trend
  if (pctEl && data.percentiles.length >= 2) {
    var html = '<div class="si-sub-label">Percentile History</div>';
    data.percentiles.slice(-5).forEach(function(p) {
      var dateLabel = new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      var pctVal = Math.round(p.percentile);
      var color = pctVal < 15 ? 'var(--tc-amber)' : (pctVal > 85 ? 'var(--tc-sky)' : 'var(--tc-sage)');
      html += '<div class="si-bar-row">';
      html += '<div class="si-bar-label">' + dateLabel + '</div>';
      html += '<div class="si-bar-track"><div class="si-bar-fill" style="width:' + pctVal + '%;background:' + color + ';"></div></div>';
      html += '<div class="si-bar-val" style="color:' + color + ';">' + pctVal + 'th</div>';
      html += '</div>';
    });
    if (data.crossings.length > 0) {
      var latest = data.crossings[data.crossings.length - 1];
      var crossColor = latest.direction === 'climbing' ? 'si-insight-good' : 'si-insight-warn';
      html += '<div class="si-insight ' + crossColor + '">Crossed from ' + Math.round(latest.from) + 'th to ' + Math.round(latest.to) + 'th percentile — ' + latest.direction + '.</div>';
    }
    pctEl.innerHTML = html;
  } else if (pctEl) {
    pctEl.innerHTML = '';
  }

  // Stat grid
  if (gridEl) {
    var latestWt = data.weight ? data.weight.latest.wt + ' kg' : '—';
    var latestHt = data.height ? data.height.latest.ht + ' cm' : '—';
    var daysSince = data.weight ? data.weight.daysSince + 'd ago' : '—';
    var totalGain = data.weight ? (data.weight.totalGainG / 1000).toFixed(1) + ' kg' : '—';
    gridEl.innerHTML = '<div class="si-stat-grid">' +
      '<div class="si-stat"><div class="si-stat-val">' + latestWt + '</div><div class="si-stat-label">Latest weight</div></div>' +
      '<div class="si-stat"><div class="si-stat-val">' + latestHt + '</div><div class="si-stat-label">Latest height</div></div>' +
      '<div class="si-stat"><div class="si-stat-val">' + daysSince + '</div><div class="si-stat-label">Since measurement</div></div>' +
      '<div class="si-stat"><div class="si-stat-val t-sage" >' + totalGain + '</div><div class="si-stat-label">Total gain</div></div>' +
      '</div>';
  }

  // Insights
  if (insightEl) {
    var iHtml = '';
    if (data.weight) {
      var w2 = data.weight;
      if (w2.status === 'on-track') {
        iHtml += '<div class="si-insight si-insight-good">Weight gain of ' + w2.gPerDay + 'g/day is right in the expected range for ' + w2.expectedRange.label + '.</div>';
      } else if (w2.status === 'slow') {
        iHtml += '<div class="si-insight si-insight-warn">Weight gain has slowed to ' + w2.gPerDay + 'g/day — expected is ' + w2.expectedRange.min + '–' + w2.expectedRange.max + 'g/day. Review caloric intake.</div>';
      } else if (w2.status === 'plateau') {
        iHtml += '<div class="si-insight si-insight-warn">Only ' + w2.gainG + 'g gained in the last ' + w2.daysBetween + ' days. This could be normal after illness or a dietary gap.</div>';
      } else if (w2.status === 'fast') {
        iHtml += '<div class="si-insight si-insight-info">Weight gain at ' + w2.gPerDay + 'g/day is above the expected range. Monitor proportionality.</div>';
      }
      if (w2.stale) {
        iHtml += '<div class="si-insight si-insight-warn">Last weight measurement was ' + w2.daysSince + ' days ago. Time for a weigh-in!</div>';
      }
    }
    if (data.height && data.height.stale) {
      iHtml += '<div class="si-insight si-insight-warn">Last height measurement was ' + data.height.daysSince + ' days ago. Time for a measurement!</div>';
    }
    if (data.proportionFlag) {
      iHtml += '<div class="si-insight si-insight-info">Weight (' + Math.round(data.proportionFlag.weightPct) + 'th) and height (' + Math.round(data.proportionFlag.heightPct) + 'th) percentiles differ significantly. Mention this at the next visit.</div>';
    }
    insightEl.innerHTML = iHtml;
  }
}

// ── Feature 4: Doctor Visit Preparation ──

function computeVisitPrep() {
  var todayStr = today();
  // Find last visit
  var pastVisits = (visits || []).filter(function(v) { return v.date && v.date <= todayStr; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  var lastVisit = pastVisits.length > 0 ? pastVisits[pastVisits.length - 1] : null;
  var sinceDate = lastVisit ? lastVisit.date : toDateStr(DOB);
  var daysSince = Math.round((new Date(todayStr) - new Date(sinceDate)) / 86400000);

  var changes = 0;
  var sections = {};

  // 1. Growth changes
  var growthSince = (growthData || []).filter(function(g) { return g.date > sinceDate; });
  var weightGrowth = growthSince.filter(function(g) { return typeof g.wt === 'number' && g.wt > 0; });
  var heightGrowth = growthSince.filter(function(g) { return typeof g.ht === 'number' && g.ht > 0; });
  var gvData = computeGrowthVelocity();
  var weightDelta = null, heightDelta = null;
  if (weightGrowth.length >= 1) {
    var allW = (growthData || []).filter(function(g) { return typeof g.wt === 'number' && g.wt > 0 && g.date <= sinceDate; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
    var refW = allW.length > 0 ? allW[allW.length - 1].wt : null;
    var latestW = weightGrowth[weightGrowth.length - 1].wt;
    if (refW !== null) weightDelta = Math.round((latestW - refW) * 1000);
  }
  if (heightGrowth.length >= 1) {
    var allH = (growthData || []).filter(function(g) { return typeof g.ht === 'number' && g.ht > 0 && g.date <= sinceDate; }).sort(function(a, b) { return a.date.localeCompare(b.date); });
    var refH = allH.length > 0 ? allH[allH.length - 1].ht : null;
    var latestH = heightGrowth[heightGrowth.length - 1].ht;
    if (refH !== null) heightDelta = Math.round((latestH - refH) * 10) / 10;
  }
  var latestPct = (gvData && !gvData.insufficient) ? gvData.latestPercentile : null;
  sections.growth = {
    emoji: zi('scale'),
    label: 'Growth',
    items: [],
    hasData: weightGrowth.length > 0 || heightGrowth.length > 0
  };
  if (weightDelta !== null) { sections.growth.items.push('Gained ' + weightDelta + 'g'); changes++; }
  if (heightDelta !== null) { sections.growth.items.push('Grew ' + heightDelta + 'cm'); changes++; }
  if (latestPct !== null) sections.growth.items.push(Math.round(latestPct) + 'th percentile');
  if (gvData && !gvData.insufficient && gvData.weight) sections.growth.items.push(gvData.weight.status + ' velocity');

  // 2. Milestone changes
  var newMilestones = (milestones || []).filter(function(m) {
    return isMsDone(m) && m.masteredAt && m.masteredAt > sinceDate;
  });
  var inProgressMs = (milestones || []).filter(function(m) { return isMsActive(m); });
  sections.milestones = {
    emoji: zi('brain'),
    label: 'Milestones',
    items: [],
    hasData: newMilestones.length > 0 || inProgressMs.length > 0
  };
  if (newMilestones.length > 0) {
    var topMs = newMilestones.slice(-3).map(function(m) { return m.text; });
    sections.milestones.items.push(newMilestones.length + ' new: ' + topMs.join(', '));
    changes += newMilestones.length;
  }
  if (inProgressMs.length > 0) {
    sections.milestones.items.push(inProgressMs.length + ' in progress');
  }

  // 2b. Activity log summary since last visit
  var actDaysSince = 0;
  var actTotalEntries = 0;
  var actDomainCounts = {};
  var actAutoPromoted = 0;
  Object.entries(activityLog || {}).forEach(function(pair) {
    var dateStr = pair[0];
    var entries = pair[1];
    if (dateStr > sinceDate && Array.isArray(entries)) {
      if (entries.length > 0) actDaysSince++;
      actTotalEntries += entries.length;
      entries.forEach(function(e) {
        (e.domains || []).forEach(function(d) { actDomainCounts[d] = (actDomainCounts[d] || 0) + 1; });
      });
    }
  });
  // Count auto-promoted milestones (those with autoStatus and no manualStatus)
  (milestones || []).forEach(function(m) {
    if (m.autoStatus && m.autoStatus !== 'not_started' && !m.manualStatus) {
      if (m.firstSeen && m.firstSeen > sinceDate) actAutoPromoted++;
    }
  });
  sections.activities = {
    emoji: zi('run'),
    label: 'Activities',
    items: [],
    hasData: actTotalEntries > 0
  };
  if (actTotalEntries > 0) {
    sections.activities.items.push(actTotalEntries + ' activities logged across ' + actDaysSince + ' days');
    var domList = Object.entries(actDomainCounts).sort(function(a, b) { return b[1] - a[1]; }).map(function(p) { return p[0] + ': ' + p[1]; }).join(', ');
    if (domList) sections.activities.items.push(domList);
    if (actAutoPromoted > 0) sections.activities.items.push(actAutoPromoted + ' milestones auto-promoted');
  }

  // 3. Sleep summary (last 7 days)
  var sleepScores = [];
  for (var si = 0; si < 7; si++) {
    var sds = _offsetDateStr(todayStr, -si);
    var sObj = getDailySleepScore(sds);
    var sscore = (sObj && typeof sObj.score === 'number') ? sObj.score : null;
    if (sscore !== null) sleepScores.push(sscore);
  }
  var avgSleep = sleepScores.length > 0 ? Math.round(sleepScores.reduce(function(s,v){return s+v;},0) / sleepScores.length) : null;
  var regData = computeSleepRegression();
  sections.sleep = {
    emoji: zi('moon'),
    label: 'Sleep',
    items: [],
    hasData: sleepScores.length > 0
  };
  if (avgSleep !== null) sections.sleep.items.push('Score ' + avgSleep + '/100 (7d avg)');
  if (regData && regData.inRegression) { sections.sleep.items.push('Sleep regression active'); changes++; }

  // 4. Diet summary
  var newFoodsSince = (foods || []).filter(function(f) { return f.date && f.date > sinceDate; });
  sections.diet = {
    emoji: 'bowl',
    label: 'Diet',
    items: [],
    hasData: newFoodsSince.length > 0
  };
  if (newFoodsSince.length > 0) {
    sections.diet.items.push(newFoodsSince.length + ' new foods introduced');
    changes += newFoodsSince.length;
    var reactionFoods = newFoodsSince.filter(function(f) { return f.reaction && f.reaction !== 'ok'; });
    if (reactionFoods.length > 0) sections.diet.items.push(reactionFoods.length + ' with reactions');
  }

  // 5. Poop summary (last 7d)
  var poopScores = [];
  for (var pi = 0; pi < 7; pi++) {
    var pds = _offsetDateStr(todayStr, -pi);
    var psc = calcPoopScore(pds);
    if (psc && typeof psc.score === 'number') poopScores.push(psc.score);
  }
  var avgPoop = poopScores.length > 0 ? Math.round(poopScores.reduce(function(s,v){return s+v;},0) / poopScores.length) : null;
  sections.poop = {
    emoji: zi('diaper'),
    label: 'Poop',
    items: [],
    hasData: poopScores.length > 0
  };
  if (avgPoop !== null) sections.poop.items.push('Score ' + avgPoop + '/100 (7d avg)');

  // 6. Medical summary
  var vaccSince = (vaccData || []).filter(function(v) { return !v.upcoming && v.date && v.date > sinceDate; });
  var episodesSince = _getAllEpisodes().filter(function(e) { return e.startedAt && e.startedAt > sinceDate; });
  var suppData = computeSupplementAdherence(Math.min(daysSince, 90));
  var suppRate = (suppData && suppData.length > 0) ? suppData[0].adherenceRate : null;

  sections.medical = {
    emoji: zi('pill'),
    label: 'Medical',
    items: [],
    hasData: vaccSince.length > 0 || episodesSince.length > 0 || suppRate !== null
  };
  if (vaccSince.length > 0) { sections.medical.items.push(vaccSince.length + ' vaccine doses given'); changes += vaccSince.length; }
  if (episodesSince.length > 0) { sections.medical.items.push(episodesSince.length + ' illness episodes'); changes += episodesSince.length; }
  if (suppRate !== null) sections.medical.items.push('Supplement adherence: ' + suppRate + '%');

  // Active concerns
  var concerns = [];
  if (gvData && !gvData.insufficient) {
    if (gvData.weight && (gvData.weight.status === 'slow' || gvData.weight.status === 'plateau')) {
      concerns.push({ type: 'warn', text: 'Weight gain is ' + gvData.weight.status + ' (' + gvData.weight.gPerDay + 'g/day)' });
    }
    if (gvData.weight && gvData.weight.stale) {
      concerns.push({ type: 'info', text: 'Weight measurement is ' + gvData.weight.daysSince + ' days old' });
    }
    if (gvData.crossings && gvData.crossings.length > 0) {
      var lastCross = gvData.crossings[gvData.crossings.length - 1];
      if (lastCross.direction === 'dropping') {
        concerns.push({ type: 'warn', text: 'Percentile dropped from ' + Math.round(lastCross.from) + 'th to ' + Math.round(lastCross.to) + 'th' });
      }
    }
    if (gvData.proportionFlag) {
      concerns.push({ type: 'info', text: 'Weight/height percentile mismatch (' + Math.round(gvData.proportionFlag.weightPct) + ' vs ' + Math.round(gvData.proportionFlag.heightPct) + ')' });
    }
  }
  if (regData && regData.inRegression) {
    concerns.push({ type: 'warn', text: 'Sleep regression detected' });
  }
  // Active illness
  var activeEps = _getAllEpisodes().filter(function(e) { return e.status === 'active'; });
  activeEps.forEach(function(e) {
    concerns.push({ type: 'warn', text: 'Active ' + e.illnessType + ' episode' });
  });

  return {
    lastVisit: lastVisit,
    sinceDate: sinceDate,
    daysSince: daysSince,
    changes: changes,
    sections: sections,
    concerns: concerns,
    overdue: daysSince > 45
  };
}

function renderInfoVisitPrep() {
  var data = computeVisitPrep();
  var summaryEl = document.getElementById('infoVisitPrepSummary');
  var sectionsEl = document.getElementById('infoVisitPrepSections');
  var concernsEl = document.getElementById('infoVisitPrepConcerns');
  var insightEl = document.getElementById('infoVisitPrepInsight');
  if (!summaryEl) return;

  // Summary
  var sinceLabel = data.lastVisit ? new Date(data.sinceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'birth';
  summaryEl.innerHTML = '<span class="t-sm t-mid" >' + data.daysSince + ' days since last visit (' + sinceLabel + ') · ' + data.changes + ' changes to discuss</span>';

  // Sections
  if (sectionsEl) {
    var html = '';
    var sectionOrder = ['growth', 'milestones', 'activities', 'sleep', 'diet', 'poop', 'medical'];
    sectionOrder.forEach(function(key) {
      var sec = data.sections[key];
      if (!sec) return;
      var itemStr = sec.items.length > 0 ? sec.items.join(' · ') : 'No changes';
      var itemColor = sec.hasData ? 'var(--mid)' : 'var(--light)';
      html += '<div class="si-check-row">';
      html += '<span style="font-size:var(--fs-md);width:24px;text-align:center;">' + sec.emoji + '</span>';
      html += '<div class="flex-1"><div class="fs-sm-600">' + sec.label + '</div>';
      html += '<div style="font-size:var(--fs-xs);color:' + itemColor + ';">' + escHtml(itemStr) + '</div></div>';
      html += '</div>';
    });
    sectionsEl.innerHTML = html;
  }

  // Concerns
  if (concernsEl) {
    if (data.concerns.length > 0) {
      var cHtml = '<div class="si-sub-label">Active Concerns</div>';
      data.concerns.forEach(function(c) {
        var cls = c.type === 'warn' ? 'si-insight-warn' : 'si-insight-info';
        cHtml += '<div class="si-insight ' + cls + '">' + escHtml(c.text) + '</div>';
      });
      concernsEl.innerHTML = cHtml;
    } else {
      concernsEl.innerHTML = '';
    }
  }

  // Insight
  if (insightEl) {
    var iHtml = '';
    if (data.concerns.length === 0 && data.changes > 0) {
      iHtml = '<div class="si-insight si-insight-good">All clear since last visit. Routine checkup items only.</div>';
    } else if (data.concerns.length > 0) {
      iHtml = '<div class="si-insight si-insight-info">Key items to discuss: ' + data.concerns.map(function(c) { return c.text; }).join('; ') + '.</div>';
    }
    if (data.overdue) {
      iHtml += '<div class="si-insight si-insight-warn">Consider scheduling a visit — it\'s been ' + data.daysSince + ' days since the last one.</div>';
    }
    insightEl.innerHTML = iHtml;
  }
}

// ─────────────────────────────────────────
