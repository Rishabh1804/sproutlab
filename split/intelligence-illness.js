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
    html += '<div class="fe-more-toggle" data-action="feToggleAllReadings">Show ' + (showReadings.length - maxShow) + ' earlier ' + zi('chevron-down') + '</div>';
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
    html += '<span class="fe-action-chip" data-action="logFeverAction" data-arg="feAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
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
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
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
  html += '<div class="kc-row-flex-wrap">';
  html += '<span class="fe-action-chip" data-action="logDiarrhoeaWetDiaper" data-arg="deHydra">' + zi('diaper') + ' Log wet diaper</span>';
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
      html += '<div class="fe-action-entry ep-entry-tap" data-action="deEditWetDiaper" data-arg="' + origIdx + '">' + _feverTimeShort(w.time) + ' — ' + zi('diaper') + ' Wet diaper</div>';
    });
  }

  // Log stool
  html += '<div class="fe-section-title">Stool Log</div>';
  html += _epTimePickerHTML('deStool');
  html += '<div class="kc-row-flex-wrap">';
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
    html += '<span class="fe-action-chip" data-action="logDiarrhoeaAction" data-arg="deAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
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
        // <option> elements render text-only — zi() SVG was leaking as literal
        // text via escHtml at intelligence.js:6831. Plain labels.
        options: [{value:'watery',label:'Watery'},{value:'runny',label:'Runny'},{value:'soft',label:'Soft'},{value:'normal',label:'Normal'},{value:'hard',label:'Hard'}] },
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
      showQLToast(zi('diaper') + ' Wet diaper updated');
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
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
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
        severity: 'watch', icon: zi('diaper'),
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
  html += '<div class="fe-action-chips"><span class="fe-action-chip" data-action="logVomitingWetDiaper" data-arg="voHydra">'+zi('drop')+' Wet diaper</span><span class="fe-action-chip" data-action="voLogFluidPrompt">'+zi('drop')+' Log fluid</span></div>';

  // Log vomiting
  html += '<div class="fe-section-title">Vomiting Log</div>';
  html += _epTimePickerHTML('voLog');
  html += '<div class="fe-action-chips">';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="spit-up">'+zi('warn')+' Spit-up</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="vomit">'+zi('siren')+' Vomit</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="projectile">'+zi('siren')+' Projectile</span>';
  html += '<span class="fe-action-chip" data-action="logVomitingEpisodeEntry" data-arg="voLog" data-arg2="bile">'+zi('warn')+' Bile/green</span>';
  html += '</div>';

  if (ep.episodes.length > 0) {
    ep.episodes.slice().reverse().slice(0, 6).forEach((e, i) => {
      const origIdx = ep.episodes.length - 1 - i;
      const icon = e.type === 'projectile' ? zi('siren') : e.type === 'bile' ? zi('dot-red') : e.type === 'spit-up' ? zi('warn') : zi('siren');
      html += '<div class="de-stool-entry ep-entry-tap" data-action="voEditEntry" data-arg="' + origIdx + '"><span>' + icon + '</span><span style="font-size:var(--fs-xs);color:var(--light);min-width:60px;">' + _feverTimeShort(e.time) + '</span><span class="fs-sm-500">' + (e.type || 'vomit') + '</span></div>';
    });
  }

  // Actions
  html += '<div class="fe-section-title">Actions</div>';
  html += _epTimePickerHTML('voAction');
  html += '<div class="fe-action-chips">';
  ['Kept upright 30min', 'Small feed given', 'Breastfed', 'Doctor called'].forEach(a => {
    html += '<span class="fe-action-chip" data-action="logVomitingAction" data-arg="voAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
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
        // <option> renders text-only; zi() decoration was leaking as literal text.
        options: [{value:'spit-up',label:'Spit-up'},{value:'vomit',label:'Vomit'},{value:'projectile',label:'Projectile'},{value:'bile',label:'Bile/green'}] },
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
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
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
    if (!state.dismissed[key]) alerts.push({ id: 'vo-wet-low', key, severity: 'watch', icon: zi('diaper'), title: 'Only ' + _voWetToday(ep) + ' wet diapers — watch hydration', body: '', tab: 'medical', dismissable: true });
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
    html += '<span class="fe-action-chip" style="' + (active ? 'background:var(--sage);color:white;' : '') + '" data-action="ceToggleSymptom" data-arg="' + escAttr(s) + '">' + (active ? zi('check') + ' ' : '') + escHtml(s) + '</span>';
  });
  html += '</div>';

  // Severity slider
  html += '<div style="padding:var(--sp-8) 0;"><div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:4px;">Severity today (1=mild, 5=severe):</div>';
  html += '<div style="display:flex;gap:var(--sp-4);align-items:center;">';
  for (let i = 1; i <= 5; i++) {
    const isActive = latestSeverity === i;
    const color = i <= 2 ? 'var(--tc-sage)' : i <= 3 ? 'var(--tc-amber)' : 'var(--tc-caution)';
    html += '<span class="fe-action-chip" style="' + (isActive ? 'background:' + color + ';color:white;border-color:' + color + ';' : '') + 'min-width:32px;justify-content:center;" data-action="ceSetSeverity" data-arg="' + i + '">' + i + '</span>';
  }
  html += '</div></div>';

  // Daily log history
  if (ep.dailyLogs.length > 0) {
    html += '<div class="fe-section-title">Daily Log</div>';
    ep.dailyLogs.slice().reverse().slice(0, 7).forEach(l => {
      const sevDots = zi('dot-red').repeat(l.severity) + zi('dot-empty').repeat(5 - l.severity);
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
    html += '<span class="fe-action-chip" data-action="logColdAction" data-arg="ceAction" data-arg2="' + escAttr(a) + '">' + escHtml(a) + '</span>';
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
  // V-M-41 shield (PR-D) — `'Resolve'` btnText prevents 'Confirm' fallback;
  // split/audit-resolve-shield.sh fails the build if dropped. Parent reads
  // this at midnight post-episode — 'Resolve' names the action verb
  // explicitly; 'Confirm' is action-ambiguous on a "Has X resolved?" prompt.
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
  const logged = todayLog ? 'Logged' : 'Not logged yet';
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
      if (chevron) chevron.innerHTML = zi('chevron-up');
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

