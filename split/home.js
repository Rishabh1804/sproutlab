// HEADER / QUICK STATS
// ─────────────────────────────────────────
// ageAt, preciseAge → migrated to core.js

function updateHeader() {
  const todayD = new Date();
  const ageDays = Math.floor((todayD - DOB) / 86400000);
  const { months, days } = preciseAge();
  const solidsDays = Math.floor((todayD - SOLIDS_START) / 86400000);

  // Time-based greeting with moon phase
  const hour = todayD.getHours();
  let greeting, emoji;
  if (hour < 6)       { greeting = 'Good night'; emoji = getMoonPhaseEmoji(todayD); }
  else if (hour < 12) { greeting = 'Good morning'; emoji = zi('sun'); }
  else if (hour < 17) { greeting = 'Good afternoon'; emoji = zi('sun'); }
  else if (hour < 19) { greeting = 'Good evening'; emoji = zi('sun'); }
  else                { greeting = 'Good night'; emoji = getMoonPhaseEmoji(todayD); }

  const greetEl = document.getElementById('greetingText');
  const emojiEl = document.getElementById('greetingEmoji');
  if (greetEl) greetEl.textContent = greeting;
  if (emojiEl) emojiEl.innerHTML = emoji;

  // Date & time
  const dtEl = document.getElementById('headerDateTime');
  if (dtEl) {
    const dayName = todayD.toLocaleDateString('en-IN', { weekday:'long' });
    const dateStr = todayD.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const timeStr = todayD.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    const moonSuffix = (hour >= 19 || hour < 6) ? ` · ${getMoonPhaseEmoji(todayD)} ${getMoonPhaseName(todayD)}` : '';
    dtEl.innerHTML = `${zi('clock')} ${escHtml(dayName)}, ${escHtml(dateStr)} · ${escHtml(timeStr)}${moonSuffix}`;
  }

  document.getElementById('headerSub').textContent =
    `Born 4 Sep 2025 · ${months}m ${days}d · Jamshedpur`;

  // home precise age
  const ageEl = document.getElementById('homePreciseAge');
  if (ageEl) ageEl.textContent = `${months} months, ${days} days`;

  // home stats — weight and height from most recent entries that have each
  const lastWtEntry = getLatestWeight();
  const lastHtEntry = getLatestHeight();
  const wtEl = document.getElementById('homeWeight');
  const htEl = document.getElementById('homeHeight');
  if (wtEl) wtEl.textContent = lastWtEntry ? lastWtEntry.wt + ' kg' : '—';
  if (htEl) htEl.textContent = lastHtEntry ? formatHeight(lastHtEntry.ht) : '—';
  const sdEl = document.getElementById('homeSolidDays');
  if (sdEl) sdEl.textContent = solidsDays;

  // meal logging streak
  const streakEl = document.getElementById('homeStreak');
  if (streakEl) {
    let streak = 0;
    const d = new Date();
    const todayKey = toDateStr(d);
    const todayEntry = feedingData[todayKey];
    const todayLogged = todayEntry && (todayEntry.breakfast || todayEntry.lunch || todayEntry.dinner || todayEntry.snack);
    if (todayLogged) streak++;
    // Count backwards from yesterday
    const check = new Date(d);
    check.setDate(check.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = toDateStr(check);
      const entry = feedingData[key];
      if (entry && (entry.breakfast || entry.lunch || entry.dinner || entry.snack)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    streakEl.textContent = streak;
    const pill = document.getElementById('homeStreakPill');
    if (pill) {
      if (streak >= 7) pill.querySelector('.hsp-icon').innerHTML = zi('flame');
      else if (streak >= 3) pill.querySelector('.hsp-icon').innerHTML = zi('sparkle');
      else pill.querySelector('.hsp-icon').innerHTML = zi('note');
    }
  }

  // sleep pills — last night + avg sleep score
  const sleepPillNight = document.getElementById('homeLastSleep');
  const sleepScorePill = document.getElementById('homeAvgSleepScore');
  if (sleepPillNight) {
    const lastNight = getLastNightSleep();
    if (lastNight) {
      const dur = calcSleepDuration(lastNight.bedtime, lastNight.wakeTime);
      sleepPillNight.textContent = `${dur.h}h ${dur.m}m`;
    } else {
      sleepPillNight.textContent = '—';
    }
  }
  if (sleepScorePill) {
    const avg = getAvgDailySleepScore7d();
    const pill = document.getElementById('homeAvgSleepScorePill');
    if (avg > 0) {
      sleepScorePill.textContent = String(avg);
      if (pill) {
        const iconEl = pill.querySelector('.hsp-icon');
        if (iconEl) iconEl.innerHTML = avg >= 70 ? zi('moon') : avg >= 40 ? zi('target') : zi('warn');
        pill.classList.remove('hsp-sage','hsp-peach','hsp-rose','hsp-indigo');
        pill.classList.add(avg >= 70 ? 'hsp-sage' : avg >= 40 ? 'hsp-peach' : 'hsp-rose');
      }
    } else {
      sleepScorePill.textContent = '—';
      if (pill) {
        pill.classList.remove('hsp-sage','hsp-peach','hsp-rose');
        pill.classList.add('hsp-indigo');
      }
    }
  }

  // next vacc
  const upcoming = vaccData.find(v => v.upcoming);
  if (upcoming) {
    const daysTo = Math.ceil((new Date(upcoming.date) - todayD) / 86400000);
    const dv = document.getElementById('homeVaccDays');
    if (dv) dv.textContent = Math.max(0, daysTo);
  }

  // Update hero card warm elements (Essential Mode home screen feel)
  _updateHeroWarm(hour, months, days);

  // Fetch weather (once per session)
  if (!window._weatherFetched) {
    window._weatherFetched = true;
    fetchWeather();
    // Fetch vaccination day weather advisory (shows 0–2 days before appointment)
    setTimeout(fetchVaccWeatherAdvisory, 1500);
  }
}

// ── Hero Card Warm Treatment (Essential Mode) ──
function _updateHeroWarm(hour, months, days) {
  // Greeting text
  var greetEl = document.getElementById('heroGreetText');
  if (greetEl) {
    var g;
    if (hour < 6) g = 'Good night';
    else if (hour < 12) g = 'Good morning';
    else if (hour < 17) g = 'Good afternoon';
    else if (hour < 19) g = 'Good evening';
    else g = 'Good night';
    greetEl.textContent = g;
  }

  // Age text (warm phrasing) + current time
  var ageEl = document.getElementById('heroAgeText');
  if (ageEl) {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    ageEl.textContent = months + ' months, ' + days + ' days old \u00B7 ' + timeStr;
  }

  // Time-of-day gradient
  var card = document.getElementById('homeVitalsCard');
  if (card) {
    var tod;
    if (hour >= 6 && hour < 12) tod = 'morning';
    else if (hour >= 12 && hour < 17) tod = 'afternoon';
    else if (hour >= 17 && hour < 20) tod = 'evening';
    else tod = 'night';
    card.setAttribute('data-tod', tod);
  }

  // Avatar blurred background
  var bgEl = document.getElementById('heroAvatarBg');
  if (bgEl && !bgEl.style.backgroundImage) {
    try {
      var avatarSrc = localStorage.getItem('ziva_avatar_full');
      if (avatarSrc) {
        bgEl.style.backgroundImage = 'url(' + avatarSrc + ')';
      }
    } catch (e) { /* avatar load is best-effort */ }
  }
}

// Live clock update every minute
setInterval(() => {
  const dtEl = document.getElementById('headerDateTime');
  const now = new Date();
  const hour = now.getHours();
  if (dtEl) {
    const dayName = now.toLocaleDateString('en-IN', { weekday:'long' });
    const dateStr = now.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    const moonSuffix = (hour >= 19 || hour < 6) ? ` · ${getMoonPhaseEmoji(now)} ${getMoonPhaseName(now)}` : '';
    dtEl.innerHTML = `${zi('clock')} ${escHtml(dayName)}, ${escHtml(dateStr)} · ${escHtml(timeStr)}${moonSuffix}`;
  }
  // Update greeting if hour changes
  let greeting, emoji;
  if (hour < 6)       { greeting = 'Good night'; emoji = getMoonPhaseEmoji(now); }
  else if (hour < 12) { greeting = 'Good morning'; emoji = zi('sun'); }
  else if (hour < 17) { greeting = 'Good afternoon'; emoji = zi('sun'); }
  else if (hour < 19) { greeting = 'Good evening'; emoji = zi('sun'); }
  else                { greeting = 'Good night'; emoji = getMoonPhaseEmoji(now); }
  const greetEl = document.getElementById('greetingText');
  const emojiEl = document.getElementById('greetingEmoji');
  if (greetEl) greetEl.textContent = greeting;
  if (emojiEl) emojiEl.innerHTML = emoji;
  // Refresh hero card warm elements
  var age = preciseAge();
  _updateHeroWarm(hour, age.months, age.days);
}, 60000);

function fetchWeather() {
  var weatherEl = document.getElementById('headerWeather');
  if (!weatherEl) return;
  // Jamshedpur coordinates
  var lat = 22.8;
  var lon = 86.18;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia/Kolkata')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.current) {
        var temp = Math.round(data.current.temperature_2m);
        var humidity = data.current.relative_humidity_2m;
        var code = data.current.weather_code;
        var desc = weatherCodeToText(code);
        var icon = weatherCodeToIcon(code);
        weatherEl.innerHTML = icon + ' ' + temp + '\u00B0C \u00B7 ' + escHtml(desc) + ' \u00B7 ' + zi('drop') + ' ' + humidity + '%';
        // Also update hero weather pill (Essential Mode)
        var heroPill = document.getElementById('heroWeatherPill');
        if (heroPill) {
          heroPill.innerHTML = icon + ' ' + temp + '\u00B0C';
        }
      }
    })
    .catch(function() {
      weatherEl.textContent = '';
    });
}

function weatherCodeToText(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45,48].includes(code)) return 'Foggy';
  if ([51,53,55].includes(code)) return 'Drizzle';
  if ([61,63,65].includes(code)) return 'Rain';
  if ([66,67].includes(code)) return 'Freezing rain';
  if ([71,73,75,77].includes(code)) return 'Snow';
  if ([80,81,82].includes(code)) return 'Rain showers';
  if ([85,86].includes(code)) return 'Snow showers';
  if ([95,96,99].includes(code)) return 'Thunderstorm';
  return 'Unknown';
}

function weatherCodeToIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return zi('sun');
  if (code === 3) return '☁️';
  if ([45,48].includes(code)) return '🌫️';
  if ([51,53,55].includes(code)) return '🌦️';
  if ([61,63,65,80,81,82].includes(code)) return '🌧️';
  if ([71,73,75,77,85,86].includes(code)) return '❄️';
  if ([95,96,99].includes(code)) return '⛈️';
  return zi('flame');
}

// ── Vaccination Weather Advisory ──
// Fetches forecast for the appointment date and shows precautions 2 days before
function fetchVaccWeatherAdvisory() {
  const bookedData = load(KEYS.vaccBooked, null);
  const upcoming = vaccData.find(v => v.upcoming);
  if (!bookedData || !upcoming || bookedData.vaccName !== upcoming.name || !bookedData.apptDate) return;

  const apptDate = bookedData.apptDate;
  const daysTo = Math.ceil((new Date(apptDate) - new Date(today())) / 86400000);
  // Only show advisory 0–2 days before appointment (and on the day itself)
  if (daysTo < 0 || daysTo > 2) return;

  const lat = 22.8, lon = 86.18;
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max&timezone=Asia/Kolkata&start_date=${apptDate}&end_date=${apptDate}`)
    .then(r => r.json())
    .then(data => {
      if (!data.daily || !data.daily.time || data.daily.time.length === 0) return;
      const wx = {
        maxTemp: Math.round(data.daily.temperature_2m_max[0]),
        minTemp: Math.round(data.daily.temperature_2m_min[0]),
        code: data.daily.weather_code[0],
        rainChance: data.daily.precipitation_probability_max[0],
        uvIndex: Math.round(data.daily.uv_index_max[0])
      };
      wx.desc = weatherCodeToText(wx.code);
      wx.icon = weatherCodeToIcon(wx.code);
      renderVaccWeatherAdvisory(wx, daysTo, apptDate);
    })
    .catch(() => {});
}

function renderVaccWeatherAdvisory(wx, daysTo, apptDate) {
  // Build precautions based on weather conditions
  const precautions = [];

  if (wx.maxTemp >= 38) {
    precautions.push(zi('flame') + ' Very hot day — keep baby hydrated, carry ORS if needed, avoid peak sun hours');
  } else if (wx.maxTemp >= 34) {
    precautions.push('☀️ Hot day — dress baby in light cotton, carry water, keep baby in shade');
  }

  if (wx.minTemp <= 15) {
    precautions.push(zi('baby') + ' Cool weather — wrap baby warmly, cover hands and feet for the clinic visit');
  }

  if (wx.rainChance >= 70) {
    precautions.push('🌧️ High chance of rain (' + wx.rainChance + '%) — carry rain cover for baby, plan extra travel time');
  } else if (wx.rainChance >= 40) {
    precautions.push('🌦️ Possible rain (' + wx.rainChance + '%) — carry an umbrella just in case');
  }

  if (wx.uvIndex >= 8) {
    precautions.push(zi('sun') + ' Very high UV (' + wx.uvIndex + ') — avoid direct sun on baby\'s skin, use shade');
  } else if (wx.uvIndex >= 6) {
    precautions.push('☀️ High UV (' + wx.uvIndex + ') — keep baby covered during travel to/from clinic');
  }

  if ([95, 96, 99].includes(wx.code)) {
    precautions.push('⛈️ Thunderstorm expected — consider rescheduling if travel is unsafe');
  }

  if ([45, 48].includes(wx.code)) {
    precautions.push('🌫️ Foggy conditions — drive carefully, allow extra travel time');
  }

  // Always add general vaccination day tips
  precautions.push(zi('drop') + ' Extra breastfeed/fluids after vaccination to keep baby comfortable');
  precautions.push(zi('baby') + ' Dress in easy-access clothing (short sleeve or front-open) for the injection');

  const dayLabel = daysTo === 0 ? 'Today' : daysTo === 1 ? 'Tomorrow' : 'In 2 days';
  const weatherSummary = `${wx.icon} ${wx.desc} · ${wx.minTemp}–${wx.maxTemp}°C`;

  const advisoryHtml = `
    <div style="margin-top:8px;padding:10px 14px;border-radius:var(--r-lg);background:var(--sky-light);border-left:var(--accent-w) solid var(--sky);">
      <div style="font-size:var(--fs-sm);font-weight:600;color:var(--tc-sky);margin-bottom:6px;">
        🌤️ Weather advisory — vaccination ${dayLabel} (${formatDate(apptDate)})
      </div>
      <div style="font-size:var(--fs-base);font-weight:600;color:var(--text);margin-bottom:6px;">
        ${weatherSummary}${wx.rainChance > 0 ? ' · 🌧️ ' + wx.rainChance + '% rain' : ''}${wx.uvIndex >= 6 ? ' · UV ' + wx.uvIndex : ''}
      </div>
      <div style="font-size:var(--fs-sm);font-weight:400;color:var(--mid);line-height:1.6;">
        ${precautions.map(p => '<div style="margin-bottom:3px;">' + p + '</div>').join('')}
      </div>
    </div>`;

  // Inject into Medical tab vaccination card
  const vaccBookingEl = document.getElementById('vaccBookingStatus');
  if (vaccBookingEl) {
    vaccBookingEl.innerHTML += advisoryHtml;
  }

  // Inject into Today's Plan area if visible
  const planEl = document.getElementById('todayPlanContent');
  if (planEl && daysTo <= 1) {
    // Find the vaccination plan item and append weather info
    const vaccItems = planEl.querySelectorAll('.plan-item');
    vaccItems.forEach(item => {
      if (item.querySelector('.plan-title') && item.querySelector('.plan-title').innerHTML.includes('zi-syringe')) {
        if (!item.querySelector('.vacc-weather-tip')) {
          const tip = document.createElement('div');
          tip.className = 'vacc-weather-tip';
          tip.innerHTML = `<div style="margin-top:6px;padding:6px 10px;border-radius:var(--r-md);background:var(--sky-light);font-size:var(--fs-sm);font-weight:400;color:var(--mid);">
            ${weatherSummary} — ${precautions[0]}
          </div>`;
          item.appendChild(tip);
        }
      }
    });
  }
}

// ─────────────────────────────────────────
// HOME TAB RENDER
// ─────────────────────────────────────────
function renderHome() {
  _clearModifierCache();
  _postVaccCached = null;
  updateHeader();
  renderHomeFeverBanner();
  renderHomeDiarrhoeaBanner();
  renderHomeVomitingBanner();
  renderHomeColdBanner();
  // ── CareTickets Zone (Phase B) ──
  try { ctRenderEntryPoint(); } catch(e) { console.error('CT entry:', e); }
  try { ctProcessAllOverdue(); } catch(e) { console.error('CT overdue:', e); }
  try { ctRenderFollowUpBanner(); } catch(e) { console.error('CT banner:', e); }
  try { ctRenderZone(); } catch(e) { console.error('CT zone:', e); }
  renderHeroScore();
  renderQABar();
  renderTodaySoFar();
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  renderHomeMealProgress();
  renderHomeSuggestions();
  renderOutingPlannerCard();
  renderTomorrowPrep();
  renderHomeSleep();
  renderHomePoop();
  // v2.3: renderHomeVacc, renderUpcomingEvents, renderDoctorPrep, renderRecoFood,
  // renderHomeActivity, renderPlanPreview, renderWeeklySummary moved to their new tabs
  updateHomeZenState();
  updateStatPillTrends();
  syncVitalsQuick();
}

// Show "all clear" when no action cards are visible
function toggleHomeVitals() {
  if (isEssentialMode()) return; // Essential Mode — vitals stay collapsed
  const collapsed = document.getElementById('homeVitalsCollapsed');
  const expanded = document.getElementById('homeVitalsExpanded');
  const chevron = document.getElementById('homeVitalsChevron');
  if (!collapsed || !expanded) return;
  const isExpanded = expanded.style.display !== 'none';
  expanded.style.display = isExpanded ? 'none' : '';
  if (chevron) chevron.textContent = isExpanded ? '▾' : '▴';
  // Hide quick pills when expanded (full pills visible)
  const quick = document.getElementById('homeVitalsQuick');
  if (quick) quick.style.display = isExpanded ? '' : 'none';
}

function syncVitalsQuick() {
  // Sync weight
  const wt = document.getElementById('homeWeight');
  const wtQ = document.getElementById('homeWeightQuick');
  if (wt && wtQ) wtQ.textContent = wt.textContent;
  // Sync last sleep
  const sl = document.getElementById('homeLastSleep');
  const slQ = document.getElementById('homeLastSleepQuick');
  if (sl && slQ) slQ.textContent = sl.textContent;
  // Sync vacc days
  const vc = document.getElementById('homeVaccDays');
  const vcQ = document.getElementById('homeVaccQuick');
  if (vc && vcQ) vcQ.textContent = vc.textContent;
  // Sync mini score ring
  const scoreNum = document.getElementById('zsNumber');
  const miniNum = document.getElementById('zsNumberMini');
  const miniRing = document.getElementById('zsRingMini');
  if (scoreNum && miniNum && miniRing) {
    const val = scoreNum.textContent;
    if (val && val !== '—') {
      miniNum.textContent = val;
      miniRing.style.display = '';
    }
  }
}

function updateHomeZenState() {
  // v2.3: Zen state is now controlled by renderHomeContextAlerts (unified card)
  // This function is kept for backward compat but is a no-op — zen logic moved to unified renderer
}

// Collapsible "More" section on Home

// Quick note from Home — adds a general note without expanding Notes section
function addQuickNote() {
  const input = document.getElementById('quickNoteInput');
  const txt = input.value.trim();
  if (!txt) return;
  notes.push({ text: txt, done: false, ts: new Date().toISOString(), cat: 'general' });
  save(KEYS.notes, notes);
  input.value = '';
  renderNotes();
  // Flash confirmation
  input.placeholder = 'Saved!';
  setTimeout(() => { input.placeholder = 'Quick note...'; }, 1500);
}

function renderRemindersAndAlerts() {
  const card = document.getElementById('homeUnifiedAlertsCard');
  const el = document.getElementById('unifiedAlertsContent');
  if (!card || !el) return;

  let html = '';
  
  const activeMeds = meds.filter(m => m.active);
  const todayStr = today();
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const ydKey = toDateStr(yd);

  // ── 1. VACCINATION OVERDUE / URGENT + POST-VACC MONITORING ──
  const todayStr2 = today();
  const yesterdayStr2 = _offsetDateStr(todayStr2, -1);
  const upcomingAll = vaccData.filter(v => v.upcoming);

  // Group overdue vaccinations by date
  const overdueGroups = {};
  upcomingAll.forEach(v => {
    const daysTo = Math.ceil((new Date(v.date) - new Date()) / 86400000);
    if (daysTo < 0) { // Only past-due (not same day — same day is Medical tab only)
      const key = v.date;
      if (!overdueGroups[key]) overdueGroups[key] = [];
      overdueGroups[key].push(v);
    }
  });

  for (const [dateKey, group] of Object.entries(overdueGroups)) {
    const daysAgo = Math.floor((new Date(todayStr2) - new Date(dateKey)) / 86400000);
    const agoLabel = daysAgo === 1 ? '1 day ago' : daysAgo + ' days ago';
    const names = group.map(v => v.name);
    const namesJson = escAttr(JSON.stringify(names));
    if (group.length === 1) {
      html += `<div class="info-strip is-danger">
        <span class="info-strip-icon"><svg class="zi"><use href="#zi-siren"/></svg></span>
        <div class="flex-1"><strong class="tc-danger">${escHtml(group[0].name)} overdue</strong>
        <div class="t-sub">Was due ${formatDate(dateKey)} (${agoLabel})</div></div>
        <div class="vc-overdue-btns">
          <button class="btn btn-sage vc-sm-btn" data-action="vaccOverdueDone" data-arg='${namesJson}' data-arg2="${escAttr(dateKey)}">Mark done</button>
          <button class="btn btn-ghost vc-sm-btn" data-action="vaccOverdueDelay" data-arg="${escAttr(dateKey)}">Reschedule</button>
        </div>
      </div>`;
    } else {
      html += `<div class="info-strip is-danger">
        <span class="info-strip-icon"><svg class="zi"><use href="#zi-siren"/></svg></span>
        <div class="flex-1"><strong class="tc-danger">${group.length} vaccinations overdue</strong>
        <div class="t-sub">${names.map(n => escHtml(n)).join(', ')} &middot; was due ${formatDate(dateKey)} (${agoLabel})</div></div>
        <div class="vc-overdue-btns">
          <button class="btn btn-sage vc-sm-btn" data-action="vaccOverdueDone" data-arg='${namesJson}' data-arg2="${escAttr(dateKey)}">Mark all done</button>
          <button class="btn btn-ghost vc-sm-btn" data-action="vaccOverdueDelay" data-arg="${escAttr(dateKey)}">Reschedule</button>
        </div>
      </div>`;
    }
  }

  // Upcoming but not overdue — booked/urgent alerts
  const upcoming = upcomingAll.sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
  if (upcoming) {
    const daysTo = Math.ceil((new Date(upcoming.date) - new Date()) / 86400000);
    const bookedData = load(KEYS.vaccBooked, null);
    const isBooked = bookedData && bookedData.vaccName === upcoming.name;
    const apptLabel = isBooked ? getVaccApptLabel(bookedData) : null;
    const hasApptDetails = isBooked && bookedData.apptDate;
    const apptDaysTo = hasApptDetails ? Math.ceil((new Date(bookedData.apptDate) - new Date()) / 86400000) : null;

    if (daysTo >= 0) {
      if (isBooked && hasApptDetails) {
        if (apptDaysTo <= 0) {
          html += `<div class="info-strip is-success">
            <span class="info-strip-icon"><svg class="zi"><use href="#zi-syringe"/></svg></span>
            <div><strong class="tc-sage">${apptDaysTo === 0 ? 'Today' : 'Overdue'} \u2014 ${escHtml(upcoming.name)}</strong>
            <div class="t-sub">${apptLabel}</div></div>
          </div>`;
        }
      } else if (isBooked && !hasApptDetails) {
        html += `<div class="info-strip is-success ptr" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}">
          <span class="info-strip-icon"><svg class="zi"><use href="#zi-check"/></svg></span>
          <div class="flex-1"><strong class="tc-sage">Booked \u2014 ${escHtml(upcoming.name)}</strong>
          <div class="t-sub">Tap to add appointment date & time</div></div>
        </div>`;
      } else if (daysTo <= 7) {
        html += `<div class="info-strip is-danger">
          <span class="info-strip-icon"><svg class="zi"><use href="#zi-dot-red"/></svg></span>
          <div class="flex-1"><strong class="tc-danger">${daysTo} day${daysTo > 1 ? 's' : ''} to ${escHtml(upcoming.name)}</strong>
          <div class="t-sub">Due ${formatDate(upcoming.date)}</div></div>
          <button class="btn btn-sage vc-sm-btn" data-action="markVaccBooked" data-arg="${escAttr(upcoming.name)}">Book</button>
        </div>`;
      }
    }
  }

  // ── 1b. POST-VACCINATION MONITORING (48h window) ──
  const recentVacc = vaccData.filter(v =>
    !v.upcoming && !v.reaction && (v.date === todayStr2 || v.date === yesterdayStr2)
  );
  if (recentVacc.length > 0) {
    const names = recentVacc.map(v => v.name);
    const namesJson = escAttr(JSON.stringify(names));
    const givenLabel = recentVacc[0].date === todayStr2 ? 'given today' : 'given yesterday';
    const namesLabel = names.length === 1 ? escHtml(names[0]) : names.length + ' vaccinations';
    html += `<div class="vc-monitor-card">
      <div class="vc-monitor-header">${zi('syringe')} <strong>${namesLabel} ${givenLabel}</strong></div>
      <div class="vc-monitor-status">
        <div class="t-sub">Monitor for the next 48 hours</div>
        <div class="vc-monitor-guide">
          <div class="vc-monitor-ok">${zi('check')} Normal: mild fever, fussiness, sleepiness</div>
          <div class="vc-monitor-watch">${zi('warn')} Watch for: fever &gt;102\u00b0F, rash, inconsolable crying, refusal to feed</div>
        </div>
      </div>
      <div class="vc-monitor-actions">
        <button class="btn btn-lav vc-sm-btn" data-action="vaccLogReaction" data-arg='${namesJson}'>Log Reaction</button>
        <button class="btn btn-ghost vc-sm-btn" data-action="vaccAllGood" data-arg='${namesJson}'>All Good \u2014 No Reaction</button>
      </div>
    </div>`;
  }
  // Show summary if reaction already logged
  const loggedRecent = vaccData.filter(v =>
    !v.upcoming && v.reaction && v.reaction !== 'none' && (v.date === todayStr2 || v.date === yesterdayStr2)
  );
  if (loggedRecent.length > 0) {
    const rNames = [...new Set(loggedRecent.map(v => v.name))];
    const symptomIds = [...new Set(loggedRecent.flatMap(v => v.symptoms || []))];
    const symptomLabels = symptomIds.map(id => {
      const s = VACC_REACTION_SYMPTOMS.find(x => x.id === id);
      return s ? s.label : id.replace(/_/g, ' ');
    });
    const sevLabel = loggedRecent[0].reaction.charAt(0).toUpperCase() + loggedRecent[0].reaction.slice(1);
    html += `<div class="vc-monitor-card vc-monitor-logged">
      <div class="vc-monitor-header">${zi('syringe')} <strong>${escHtml(sevLabel)} reaction logged</strong></div>
      <div class="t-sub">${rNames.map(n => escHtml(n)).join(', ')} &middot; ${symptomLabels.map(l => escHtml(l)).join(', ')}</div>
      <div class="t-sub">Monitoring until ${formatDate(_offsetDateStr(loggedRecent[0].date, 2))}</div>
    </div>`;
  }

  // ── 2. MISSED MED DAYS (past, up to 14 days) ──
  if (activeMeds.length) {
    const trackingSince = medChecks._trackingSince || todayStr;
    activeMeds.forEach(m => {
      const startDate = m.start || '2025-09-04';
      const earliest = startDate > trackingSince ? startDate : trackingSince;
      for (let i = 1; i <= 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        if (ds < earliest) continue;
        const dayLog = medChecks[ds];
        if (!dayLog || !dayLog[m.name]) {
          const uid = `missed-${m.name}-${ds}`.replace(/[^a-zA-Z0-9-]/g, '_');
          html += `
          <div class="supp-alert missed" id="${uid}">
            <div class="supp-alert-top">
              <div class="supp-alert-icon">${zi('dot-red')}</div>
              <div class="supp-alert-title">Missed — ${escHtml(m.name)}</div>
              <div class="supp-alert-action">
                <button class="supp-check-btn" data-action="resolveMissedMedDone" data-arg="${escHtml(m.name)}" data-arg2="${ds}">Was given</button>
                <button class="supp-skip-btn" data-action="resolveMissedMedSkipped" data-arg="${escHtml(m.name)}" data-arg2="${ds}">Not given</button>
              </div>
            </div>
            <div class="supp-alert-detail">${escHtml(m.dose || '')} · ${formatDate(ds)}</div>
          </div>`;
        }
      }
    });
  }

  // ── 3. YESTERDAY'S FEEDING MISSING ──
  const ydEntry = feedingData[ydKey];
  const ydFeedMissing = !ydEntry || (!ydEntry.breakfast && !ydEntry.lunch && !ydEntry.dinner && !ydEntry.snack);
  if (ydFeedMissing) {
    html += `<div class="info-strip is-warn tappable" onclick="document.getElementById('feedingDate').value='${ydKey}';loadFeedingDay();switchTab('diet');">
      <span class="info-strip-icon"><svg class="zi"><use href="#zi-warn"/></svg></span>
      <div><strong class="tc-warn">Yesterday's meals not logged</strong>
      <div class="t-sub">${formatDate(ydKey)} · Tap to log retroactively</div></div>
    </div>`;
  }

  // ── 4. TODAY'S MED REMINDERS — only show unresolved ones ──
  let allTodayResolved = true;
  activeMeds.forEach((m, idx) => {
    const dayLog = medChecks[todayStr] || {};
    const status = dayLog[m.name];
    const isDone = status && status.startsWith('done:');
    const isSkipped = status === 'skipped';
    const isResolved = isDone || isSkipped;
    if (!isResolved) allTodayResolved = false;

    if (!isResolved) {
      // Only show unresolved meds
      html += `
      <div class="supp-alert" id="supp-alert-${idx}">
        <div class="supp-alert-top">
          <div class="supp-alert-icon">${zi('warn')}</div>
          <div class="supp-alert-title">Reminder — ${escHtml(m.name)}</div>
          <div class="supp-alert-action">
            <button class="supp-check-btn" data-action="markMedDone" data-arg="${escHtml(m.name)}" data-arg2="${idx}">Done</button>
            <button class="supp-skip-btn" data-action="markMedSkipped" data-arg="${escHtml(m.name)}" data-arg2="${idx}">Skip</button>
          </div>
        </div>
        <div class="supp-alert-detail">${m.dose ? escHtml(m.dose) + ' · ' : ''}${escHtml(m.freq || 'As prescribed')}</div>
      </div>`;
    }
  });

  // If all today's meds are resolved, show a compact summary instead
  if (activeMeds.length > 0 && allTodayResolved) {
    html += `<div style="display:flex;align-items:center;gap:var(--sp-8);padding:8px 12px;border-radius:var(--r-lg);background:var(--sage-light);font-size:var(--fs-base);color:var(--tc-sage);">
      <span><svg class="zi"><use href="#zi-check"/></svg></span> All medications done for today
    </div>`;
  }

  // v2.3: Store HTML — renderHomeContextAlerts will combine and render both
  window._remindersHTML = html;
}

// Mark vaccination as booked — step 1: save booked state, then ask for details
function markVaccBooked(vaccName) {
  save(KEYS.vaccBooked, { vaccName, bookedAt: new Date().toISOString() });
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  renderVacc();
  renderVaccCoverage();
  renderVaccHistory();
  renderHistoryPreviews();
  renderTodayPlan();
  // Open appointment details prompt
  openVaccApptModal(vaccName);
}

function openVaccApptModal(vaccName) {
  const bookedData = load(KEYS.vaccBooked, null);
  const existing = bookedData && bookedData.vaccName === vaccName ? bookedData : {};
  const upcoming = vaccData.find(v => v.upcoming && v.name === vaccName);
  const defaultDate = existing.apptDate || (upcoming ? upcoming.date : today());
  const defaultSlot = existing.apptSlot || 'morning';
  const modalEl = document.getElementById('vaccApptModal');
  if (!modalEl) return; // modal not in DOM yet, skip gracefully
  document.getElementById('vaccApptDate').value = defaultDate;
  document.querySelectorAll('.vacc-slot-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.slot === defaultSlot);
  });
  window._vaccApptName = vaccName;
  openModal('vaccApptModal');
}

function selectVaccSlot(slot) {
  document.querySelectorAll('.vacc-slot-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.slot === slot);
  });
}

function saveVaccAppt() {
  const vaccName = window._vaccApptName;
  const date = document.getElementById('vaccApptDate').value;
  const activeSlot = document.querySelector('.vacc-slot-btn.active');
  const slot = activeSlot ? activeSlot.dataset.slot : 'morning';
  save(KEYS.vaccBooked, { vaccName, bookedAt: new Date().toISOString(), apptDate: date, apptSlot: slot });
  closeModal('vaccApptModal');
  renderRemindersAndAlerts();
  renderHomeContextAlerts();
  renderVacc();
  renderVaccCoverage();
  renderVaccHistory();
  renderHistoryPreviews();
  renderTodayPlan();
  showQLToast(zi('check') + ' Appointment saved — ' + formatDate(date) + ', ' + slot);
  // Fetch weather advisory for the appointment date
  setTimeout(fetchVaccWeatherAdvisory, 500);
}

function getVaccApptLabel(bookedData) {
  if (!bookedData || !bookedData.apptDate) return null;
  return formatDate(bookedData.apptDate) + ', ' + bookedData.apptSlot;
}

function toggleHomeNotes() {
  toggleHistoryCard('notesBody', 'notesChevron');
}

function togglePlanSection(section) {
  const bodyId = section === 'food' ? 'planFoodSection' : 'planActivitySection';
  toggleHistoryCard(bodyId, null);
}

function renderPlanPreview() {
  const el = document.getElementById('planPills');
  if (!el) return;

  // Pick a random food from the rendered recommendations
  const recoEl = document.getElementById('homeRecoFood');
  let foodName = 'View food ideas';
  let foodIcon = zi('bowl');
  let foodColor = 'ds-peach';
  if (recoEl) {
    const items = recoEl.querySelectorAll('.reco-item');
    if (items.length > 0) {
      const pick = items[Math.floor(Math.random() * items.length)];
      const strong = pick.querySelector('strong');
      const icon = pick.querySelector('.reco-icon');
      if (strong) foodName = strong.textContent.replace('🆕 Try new — ', '');
      if (icon) foodIcon = icon.textContent.trim();
      // Colour based on food type
      const nameLower = foodName.toLowerCase();
      if (['ragi','dal','khichdi','oats','bajra','jowar','dalia','idli','sattu','rice','porridge'].some(k => nameLower.includes(k))) foodColor = 'ds-sage';
      else if (['avocado','banana','mango','pear','apple','blueberry','papaya','kiwi','orange','pomegranate','chiku'].some(k => nameLower.includes(k))) foodColor = 'ds-rose';
      else if (['carrot','beetroot','sweet potato','pumpkin','spinach','broccoli','potato','cucumber'].some(k => nameLower.includes(k))) foodColor = 'ds-peach';
      else if (['almond','walnut','cashew','peanut','sesame','flaxseed'].some(k => nameLower.includes(k))) foodColor = 'ds-lav';
      else if (['ghee','curd','paneer','butter'].some(k => nameLower.includes(k))) foodColor = 'ds-sky';
    }
  }

  // Pick a random activity from the rendered activities
  const actEl = document.getElementById('homeActivity');
  let actName = 'View activities';
  let actIcon = zi('target');
  let actColor = 'ds-sage';
  let actCatLabel = '';
  if (actEl) {
    const items = actEl.querySelectorAll('.activity-item');
    if (items.length > 0) {
      const pick = items[Math.floor(Math.random() * items.length)];
      const strong = pick.querySelector('strong');
      const iconEl = pick.querySelector('.activity-icon');
      const catLabel = pick.querySelector('.activity-cat-label');
      if (strong) actName = strong.textContent;
      if (iconEl) actIcon = iconEl.textContent.trim();
      // Colour based on category
      if (pick.classList.contains('motor'))    { actColor = 'ds-sage'; actCatLabel = 'Motor'; }
      if (pick.classList.contains('sensory'))  { actColor = 'ds-lav'; actCatLabel = 'Sensory'; }
      if (pick.classList.contains('language')) { actColor = 'ds-sky'; actCatLabel = 'Language'; }
      if (pick.classList.contains('social'))   { actColor = 'ds-peach'; actCatLabel = 'Social'; }
    }
  }

  el.innerHTML = `
    <div class="diet-stat ${foodColor} flex-1" data-action="togglePlanSection" data-arg="food" >
      <div class="diet-stat-icon">${foodIcon}</div>
      <div class="diet-stat-val ds-val-sm">${escHtml(foodName)}</div>
      <div class="diet-stat-label">Tap for recipe</div>
    </div>
    <div class="diet-stat ${actColor} flex-1" data-action="togglePlanSection" data-arg="activity" >
      <div class="diet-stat-icon">${actIcon}</div>
      <div class="diet-stat-val ds-val-sm">${actName}</div>
      <div class="diet-stat-label">${actCatLabel ? actCatLabel + ' · ' : ''}Tap for details</div>
    </div>
  `;
}

// escAttr → migrated to core.js

function fmtTips(s) {
  if (!s) return '';
  return s.replace(/\{\{OK\}\}/g, '<span class="icon-sage">' + zi('check') + '</span>')
          .replace(/\{\{NO\}\}/g, '<span class="icon-rose">' + zi('warn') + '</span>');
}

function markMedDone(name, idx) {
  const todayStr = today();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  if (!medChecks[todayStr]) medChecks[todayStr] = {};
  medChecks[todayStr][name] = 'done:' + timeStr;
  save(KEYS.medChecks, medChecks);
  _tsfMarkDirty();
  _islMarkDirty('medical');

  const el = document.getElementById('supp-alert-' + idx);
  if (el) {
    el.style.transform = 'scale(0.97)';
    setTimeout(() => { renderRemindersAndAlerts(); renderHomeContextAlerts(); }, 200);
  } else {
    renderRemindersAndAlerts(); renderHomeContextAlerts();
  }
}

function markMedSkipped(name, idx) {
  const todayStr = today();
  if (!medChecks[todayStr]) medChecks[todayStr] = {};
  medChecks[todayStr][name] = 'skipped';
  save(KEYS.medChecks, medChecks);
  _islMarkDirty('medical');

  const el = document.getElementById('supp-alert-' + idx);
  if (el) {
    el.style.transform = 'scale(0.97)';
    setTimeout(() => { renderRemindersAndAlerts(); renderHomeContextAlerts(); }, 200);
  } else {
    renderRemindersAndAlerts(); renderHomeContextAlerts();
  }
}

function resolveMissedMed(name, dateStr, action) {
  if (!medChecks[dateStr]) medChecks[dateStr] = {};
  if (action === 'done') {
    medChecks[dateStr][name] = 'done:late';
  } else {
    medChecks[dateStr][name] = 'skipped';
  }
  save(KEYS.medChecks, medChecks);
  _islMarkDirty('medical');
  renderRemindersAndAlerts(); renderHomeContextAlerts();
}

function renderHomeVacc() {
  const upcoming = vaccData.find(v => v.upcoming);
  const el = document.getElementById('homeVaccCard');
  const wrap = document.getElementById('homeVaccCardWrap');
  if (!wrap || !el) return; // v2.3: card relocated from Home
  if (!upcoming) {
    wrap.style.display = 'none';
    return;
  }
  const todayD = new Date();
  const daysTo = Math.ceil((new Date(upcoming.date) - todayD) / 86400000);
  const safe   = Math.max(0, daysTo);

  // Only show on home screen when due within 7 days
  if (safe > 7) {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  const urgency = safe <= 3 ? 'var(--tc-danger)' : safe <= 7 ? 'var(--tc-caution)' : 'var(--tc-lav)';
  const bookedData = load(KEYS.vaccBooked, null);
  const isBooked = bookedData && bookedData.vaccName === upcoming.name;
  const apptLabel = isBooked ? getVaccApptLabel(bookedData) : null;
  let statusLine = '';
  if (isBooked && apptLabel) {
    statusLine = `<div style="font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;margin-top:4px;">${zi('check')} Booked — ${apptLabel}</div>`;
  } else if (isBooked) {
    statusLine = `<div style="font-size:var(--fs-sm);color:var(--tc-sage);font-weight:600;margin-top:4px;cursor:pointer;" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}">${zi('check')} Booked — tap to add date & time</div>`;
  } else {
    statusLine = safe <= 3 ? '<div style="font-size:var(--fs-sm);color:var(--tc-danger);font-weight:700;margin-top:4px;">' + zi('warn') + ' Due very soon — book your appointment!</div>' : '<div style="font-size:var(--fs-sm);color:var(--tc-caution);font-weight:600;margin-top:4px;">' + zi('clock') + ' Coming up this week</div>';
  }
  el.innerHTML = `
    <div class="fx-center g16">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--lav-light);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="font-family:'Fraunces',serif;font-size:var(--fs-2xl);font-weight:600;color:${urgency};line-height:var(--lh-none);">${safe}</div>
        <div class="micro-label" style="font-size:var(--fs-sm);font-weight:400;">days</div>
      </div>
      <div>
        <div class="t-title">${escHtml(upcoming.name)}</div>
        <div class="t-sub" style="margin-top:3px;">Due ${formatDate(upcoming.date)}</div>
        ${statusLine}
      </div>
    </div>`;
}

// Recommended food: only suggest from introduced foods + one new dish to try
function renderRecoFood() {
  const el = document.getElementById('homeRecoFood');
  if (!el) return; // v2.3: element relocated
  // All recommendations with recipes
  const RECO_POOL = [
    { icon:zi('bowl'), name:'Ragi porridge with ghee', reason:'Best iron + calcium combo for this age', keys:['ragi','ghee'],
      recipe:'1. Dry roast 1 tbsp ragi flour on low heat for 2 min.\n2. Add ½ cup water, stir continuously to avoid lumps.\n3. Cook 5–6 min on low until thick.\n4. Cool slightly, add ½ tsp ghee.\n5. Serve warm.',
      tips:'{{OK}} Use homemade ragi flour for freshness.\n{{OK}} Pair with a Vit-C fruit after for iron absorption.\n{{NO}} Don\'t add salt, sugar, or honey.\n{{NO}} Don\'t make too thick — should be pourable for beginners.' },
    { icon:zi('bowl'), name:'Masoor dal khichdi', reason:'High-iron protein, easier to digest than moong', keys:['masoor dal','rice'],
      recipe:'1. Wash ½ tbsp masoor dal + 1 tbsp rice. Soak 30 min.\n2. Pressure cook with 1 cup water — 3 whistles.\n3. Mash well, add a pinch of turmeric.\n4. Temper with ½ tsp ghee.\n5. Serve warm, semi-liquid consistency.',
      tips:'{{OK}} Masoor dal cooks faster than moong — great for quick meals.\n{{OK}} Add a squeeze of lemon for iron absorption.\n{{NO}} Don\'t add salt or spices yet.\n{{NO}} Avoid whole dal pieces — mash completely.' },
    { icon:zi('spoon'), name:'Avocado mash', reason:'Brain-healthy fats — aim for 3–4×/week', keys:['avocado'],
      recipe:'1. Cut a ripe avocado, scoop out 2–3 tbsp.\n2. Mash with a fork until smooth.\n3. Serve immediately.',
      tips:'{{OK}} Choose ripe (dark, soft) avocados.\n{{OK}} Mix with banana for natural sweetness.\n{{NO}} Don\'t heat or cook — loses nutrients.\n{{NO}} Don\'t store mashed — oxidises quickly.' },
    { icon:zi('spoon'), name:'Pear puree', reason:'Natural stool softener, gentle Vit C', keys:['pear'],
      recipe:'1. Peel and core ½ pear, cut into small pieces.\n2. Steam for 6–8 min until very soft.\n3. Mash or blend until smooth.\n4. Cool and serve.',
      tips:'{{OK}} Steaming preserves more nutrients than boiling.\n{{OK}} Great when baby is constipated.\n{{NO}} Don\'t serve raw until 8+ months.\n{{NO}} Avoid unripe, hard pears.' },
    { icon:zi('spoon'), name:'Carrot + beetroot khichdi', reason:'Vitamin A + iron combo', keys:['carrot','beetroot','rice'],
      recipe:'1. Wash 1 tbsp rice, soak 20 min.\n2. Grate 1 small carrot + 1 small beetroot.\n3. Pressure cook rice + veggies with 1 cup water — 3 whistles.\n4. Mash well, add ½ tsp ghee.\n5. Serve warm.',
      tips:'{{OK}} Beetroot stains — use a bib!\n{{OK}} Carrot adds natural sweetness babies love.\n{{NO}} Don\'t use canned beetroot.\n{{NO}} Remove any hard bits before serving.' },
    { icon:zi('spoon'), name:'Almond-walnut ragi porridge', reason:'Omega-3 + calcium for brain & bones', keys:['almonds','walnut','ragi'],
      recipe:'1. Soak 3 almonds + 1 walnut overnight, peel almonds.\n2. Grind into fine paste with 2 tbsp water.\n3. Dry roast 1 tbsp ragi flour 2 min.\n4. Add nut paste + ½ cup water, stir well.\n5. Cook 5 min on low, add ½ tsp ghee.',
      tips:'{{OK}} Always soak and peel almonds.\n{{OK}} Grind to very fine paste — no chunks.\n{{NO}} Don\'t give whole/chopped nuts — choking hazard.\n{{NO}} Watch for reactions the first 2–3 times.' },
    { icon:zi('spoon'), name:'Mango puree', reason:'Vitamin C boost, pairs well with iron meals', keys:['mango'],
      recipe:'1. Choose a ripe, sweet mango (Alphonso/Banganapalli).\n2. Peel and scoop out 2–3 tbsp flesh.\n3. Mash with fork or blend smooth.\n4. Serve at room temperature.',
      tips:'{{OK}} Serve after an iron-rich meal for Vit-C absorption boost.\n{{OK}} Ripe mangoes only — sour ones cause acidity.\n{{NO}} Don\'t add sugar.\n{{NO}} Limit to 2–3 tbsp as it\'s high in natural sugar.' },
    { icon:zi('spoon'), name:'Banana with ragi', reason:'Energy + iron — easy breakfast', keys:['banana','ragi'],
      recipe:'1. Cook 1 tbsp ragi flour in ½ cup water (5 min, stirring).\n2. Mash ¼ ripe banana.\n3. Mix banana into warm ragi porridge.\n4. Add ½ tsp ghee, serve.',
      tips:'{{OK}} Use ripe bananas (yellow with brown spots).\n{{OK}} Great energy breakfast before play time.\n{{NO}} Don\'t overfeed banana — can cause constipation.\n{{NO}} Avoid if stools are already firm.' },
    { icon:zi('spoon'), name:'Apple + date ragi porridge', reason:'Iron + natural sweetness — no sugar needed', keys:['apple','date (fruit)','ragi'],
      recipe:'1. Soak 1 date for 30 min, remove seed, mash.\n2. Peel + dice ¼ apple, steam 5 min until soft.\n3. Cook 1 tbsp ragi in ½ cup water (5 min).\n4. Mix in apple + date paste + ½ tsp ghee.',
      tips:'{{OK}} Dates add iron + natural sweetness.\n{{OK}} Always remove date seed completely.\n{{NO}} Don\'t use more than 1 date — very sweet.\n{{NO}} Don\'t add honey as sweetener.' },
    { icon:zi('spoon'), name:'Blueberry + avocado mash', reason:'Antioxidant + healthy fats — brain combo', keys:['blueberry','avocado'],
      recipe:'1. Wash 8–10 blueberries, lightly steam 2 min.\n2. Scoop 2 tbsp ripe avocado.\n3. Mash blueberries + avocado together.\n4. Serve immediately.',
      tips:'{{OK}} Steaming blueberries softens the skin.\n{{OK}} Rich purple colour — stains everything!\n{{NO}} Don\'t give whole blueberries — cut or mash.\n{{NO}} Don\'t store — both oxidise fast.' },
    { icon:zi('spoon'), name:'Moong dal khichdi with ghee', reason:'Classic protein + carb + fat balance', keys:['moong dal','rice','ghee'],
      recipe:'1. Wash 1 tbsp moong dal + 1 tbsp rice. Soak 30 min.\n2. Pressure cook with 1 cup water + pinch turmeric — 4 whistles.\n3. Mash until smooth, add ½ tsp ghee.\n4. Serve warm, thin consistency.',
      tips:'{{OK}} The gold standard first food in Indian weaning.\n{{OK}} Add a boiled, mashed veggie for variety.\n{{NO}} Don\'t make too thick for beginners.\n{{NO}} No salt — baby\'s kidneys can\'t handle it.' },
    { icon:zi('spoon'), name:'Carrot + beans khichdi', reason:'Vitamin A + iron + fibre', keys:['carrot','beans','rice'],
      recipe:'1. Finely chop 1 small carrot + 4–5 beans.\n2. Wash 1 tbsp rice + ½ tbsp moong dal, soak 20 min.\n3. Pressure cook all together with 1 cup water — 3 whistles.\n4. Mash well, add ghee.',
      tips:'{{OK}} Beans add iron — great with carrot\'s Vit A.\n{{OK}} Remove bean strings before chopping.\n{{NO}} Don\'t leave any hard chunks.\n{{NO}} Cook until very soft — beans can be tough.' },
    { icon:zi('sprout'), name:'Beetroot + masoor dal', reason:'Double iron — pair with lemon for max absorption', keys:['beetroot','masoor dal'],
      recipe:'1. Grate 1 small beetroot.\n2. Wash ½ tbsp masoor dal, soak 20 min.\n3. Pressure cook together with ¾ cup water — 3 whistles.\n4. Mash, add ½ tsp ghee + few drops lemon.',
      tips:'{{OK}} Double iron source — one of the best combos.\n{{OK}} Lemon squeeze doubles iron absorption.\n{{NO}} Don\'t skip the lemon if possible.\n{{NO}} Beetroot stools turn reddish — normal, not blood!' },
    { icon:zi('spoon'), name:'Avocado + banana + blueberry', reason:'Brain fats + energy + antioxidants', keys:['avocado','banana','blueberry'],
      recipe:'1. Mash 2 tbsp avocado + ¼ banana.\n2. Steam 8 blueberries 2 min, mash.\n3. Mix all three together.\n4. Serve immediately.',
      tips:'{{OK}} No cooking needed — fastest meal ever.\n{{OK}} All three are brain superfoods.\n{{NO}} Make fresh each time.\n{{NO}} Don\'t blend too smooth — some texture is good at 6m+.' },
    { icon:zi('bowl'), name:'Ragi + apple + walnut porridge', reason:'Iron + Vit C + omega-3 — perfect trio', keys:['ragi','apple','walnut'],
      recipe:'1. Soak 1 walnut overnight, grind to paste.\n2. Peel + dice ¼ apple, steam 5 min.\n3. Cook 1 tbsp ragi in ½ cup water (5 min).\n4. Mix in apple + walnut paste + ghee.',
      tips:'{{OK}} Apple\'s Vit C boosts ragi\'s iron absorption.\n{{OK}} Walnut adds brain-healthy omega-3.\n{{NO}} Grind walnut very fine — no pieces.\n{{NO}} Don\'t use raw apple — steam until soft.' },
    { icon:zi('spoon'), name:'Pear + avocado mash', reason:'Soft stools + brain fats in one', keys:['pear','avocado'],
      recipe:'1. Peel ¼ pear, steam 5 min until soft.\n2. Scoop 2 tbsp ripe avocado.\n3. Mash pear + avocado together.\n4. Serve at room temperature.',
      tips:'{{OK}} Best combo when baby is slightly constipated.\n{{OK}} Avocado makes pear creamier.\n{{NO}} Don\'t heat avocado.\n{{NO}} Serve immediately — browns fast.' },
    { icon:zi('spoon'), name:'Almond ragi porridge + mango', reason:'Iron + calcium + Vit C for absorption', keys:['almonds','ragi','mango'],
      recipe:'1. Soak 3 almonds overnight, peel, grind to paste.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix in almond paste + ½ tsp ghee.\n4. Mash 2 tbsp ripe mango, serve alongside.',
      tips:'{{OK}} Mango\'s Vit C helps absorb ragi\'s iron.\n{{OK}} Almond adds protein + calcium.\n{{NO}} Don\'t mix mango into hot porridge — serve side by side.\n{{NO}} Always peel almonds after soaking.' },
    { icon:zi('bowl'), name:'Masoor dal + beetroot + ghee', reason:'Iron powerhouse with healthy fats', keys:['masoor dal','beetroot','ghee'],
      recipe:'1. Grate 1 small beetroot.\n2. Wash ½ tbsp masoor dal, soak 20 min.\n3. Pressure cook with ¾ cup water — 3 whistles.\n4. Mash smooth, stir in ½ tsp ghee.',
      tips:'{{OK}} Highest iron combo in the rotation.\n{{OK}} Ghee helps absorb fat-soluble vitamins.\n{{NO}} Prepare for pink/red stools — completely normal.\n{{NO}} Don\'t skip ghee — baby needs the fat.' },
    { icon:zi('spoon'), name:'Banana + walnut mash', reason:'Energy + omega-3 — quick brain snack', keys:['banana','walnut'],
      recipe:'1. Soak 1 walnut 2 hrs, grind to fine paste.\n2. Mash ¼ ripe banana.\n3. Mix walnut paste into banana.\n4. Serve immediately.',
      tips:'{{OK}} Quickest brain food — under 5 minutes.\n{{OK}} Great mid-morning or afternoon snack.\n{{NO}} Don\'t give walnut pieces — always paste.\n{{NO}} Use ripe bananas only.' },
    { icon:zi('spoon'), name:'Carrot + moong dal soup', reason:'Vitamin A + protein — gentle on tummy', keys:['carrot','moong dal'],
      recipe:'1. Wash ½ tbsp moong dal, soak 20 min.\n2. Peel + dice 1 small carrot.\n3. Boil together in 1 cup water for 15 min or pressure cook 2 whistles.\n4. Blend/mash smooth, add pinch turmeric + ghee.',
      tips:'{{OK}} Soupy consistency — great when baby is unwell.\n{{OK}} Carrot sweetness makes babies love this.\n{{NO}} Don\'t add salt or stock cubes.\n{{NO}} Strain if baby is under 6.5 months.' },
    { icon:zi('bowl'), name:'Ragi + banana + date porridge', reason:'Iron + energy + natural sweetness', keys:['ragi','banana','date (fruit)'],
      recipe:'1. Cook 1 tbsp ragi flour in ½ cup water (5 min).\n2. Soak 1 date 30 min, deseed, mash.\n3. Mash ¼ banana.\n4. Mix date paste + banana into warm ragi.\n5. Add ½ tsp ghee.',
      tips:'{{OK}} Date adds iron on top of ragi\'s iron.\n{{OK}} Banana makes it creamy and filling.\n{{NO}} Don\'t use more than 1 date.\n{{NO}} Always deseed completely.' },
    { icon:zi('spoon'), name:'Carrot + apple + ghee puree', reason:'Vitamin A + Vit C + healthy fats', keys:['carrot','apple','ghee'],
      recipe:'1. Peel + dice ½ carrot + ¼ apple.\n2. Steam together 8–10 min until soft.\n3. Mash smooth, add ½ tsp ghee.\n4. Serve warm.',
      tips:'{{OK}} Sweet combo — babies rarely refuse this.\n{{OK}} Apple\'s Vit C helps absorb carrot\'s iron.\n{{NO}} Don\'t skip the ghee — fats aid Vit A absorption.\n{{NO}} Peel apple for easier digestion.' },
    { icon:zi('bowl'), name:'Masoor dal + carrot khichdi', reason:'Iron + Vitamin A — growth duo', keys:['masoor dal','carrot','rice'],
      recipe:'1. Wash ½ tbsp masoor dal + 1 tbsp rice, soak 20 min.\n2. Grate ½ small carrot.\n3. Pressure cook all with 1 cup water — 3 whistles.\n4. Mash, add ghee + pinch turmeric.',
      tips:'{{OK}} Carrot adds sweetness masoor dal lacks.\n{{OK}} Complete protein + carb + vit A meal.\n{{NO}} Mash thoroughly — masoor stays grainy.\n{{NO}} Don\'t add salt.' },
    { icon:zi('spoon'), name:'Banana + avocado + ghee', reason:'Triple fat combo — superb for brain development', keys:['banana','avocado','ghee'],
      recipe:'1. Mash ¼ banana + 2 tbsp avocado.\n2. Mix well, add ½ tsp melted ghee.\n3. Serve immediately.',
      tips:'{{OK}} Three sources of healthy fats in one meal.\n{{OK}} No cooking needed — under 3 min.\n{{NO}} Serve fresh — both fruits oxidise.\n{{NO}} Don\'t overfeed — very calorie dense.' },
    { icon:zi('spoon'), name:'Moong dal + beetroot soup', reason:'Protein + iron — vibrant and nutritious', keys:['moong dal','beetroot'],
      recipe:'1. Wash ½ tbsp moong dal, soak 20 min.\n2. Grate 1 small beetroot.\n3. Pressure cook with ¾ cup water — 3 whistles.\n4. Mash smooth, add ghee.',
      tips:'{{OK}} Beautiful pink colour — visually appealing.\n{{OK}} Iron from both beetroot and dal.\n{{NO}} Pink stools are normal with beetroot.\n{{NO}} Don\'t use store-bought beetroot juice.' },
    { icon:zi('bowl'), name:'Ragi + pear + ghee porridge', reason:'Iron + digestive comfort + healthy fats', keys:['ragi','pear','ghee'],
      recipe:'1. Peel ¼ pear, steam 5 min, mash.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix pear puree + ½ tsp ghee into porridge.',
      tips:'{{OK}} Pear keeps stools soft when ragi firms them.\n{{OK}} Perfect balanced breakfast.\n{{NO}} Don\'t serve pear raw for under 8m.\n{{NO}} Stir continuously to avoid ragi lumps.' },
    { icon:zi('spoon'), name:'Blueberry + banana + walnut', reason:'Antioxidants + energy + omega-3', keys:['blueberry','banana','walnut'],
      recipe:'1. Steam 10 blueberries 2 min, mash.\n2. Mash ¼ banana.\n3. Soak 1 walnut 2 hrs, grind to paste.\n4. Mix all three.',
      tips:'{{OK}} Brain superfood trio.\n{{OK}} Walnut paste makes it creamy.\n{{NO}} Always grind walnut to paste.\n{{NO}} Stains heavily — bib essential.' },
    { icon:zi('spoon'), name:'Beetroot + carrot + rice', reason:'Iron + Vitamin A + easy carbs', keys:['beetroot','carrot','rice'],
      recipe:'1. Grate ½ beetroot + ½ carrot.\n2. Wash 1 tbsp rice, soak 20 min.\n3. Pressure cook all with 1 cup water — 3 whistles.\n4. Mash well, add ghee.',
      tips:'{{OK}} Two root veggies = earthy sweetness.\n{{OK}} Rice makes it filling and smooth.\n{{NO}} Mash very well — both veggies can be fibrous.\n{{NO}} Don\'t be alarmed by red stools.' },
    { icon:zi('spoon'), name:'Apple + blueberry puree', reason:'Vitamin C + antioxidants — immune booster', keys:['apple','blueberry'],
      recipe:'1. Peel + dice ¼ apple, steam 5 min.\n2. Steam 10 blueberries 2 min.\n3. Mash both together.\n4. Serve warm or at room temp.',
      tips:'{{OK}} Double Vit C — great after iron meals.\n{{OK}} Natural purple-pink colour babies love.\n{{NO}} Steam both — raw is hard on gums.\n{{NO}} Don\'t add sugar — already sweet.' },
    { icon:zi('spoon'), name:'Almond + date + ghee paste', reason:'Iron + calcium + brain fats — power snack', keys:['almonds','date (fruit)','ghee'],
      recipe:'1. Soak 4 almonds overnight, peel.\n2. Soak 1 date 30 min, deseed.\n3. Grind almonds + date with 1 tbsp water to smooth paste.\n4. Mix in ½ tsp ghee. Serve 1 tsp at a time.',
      tips:'{{OK}} Concentrated nutrition — small portions.\n{{OK}} Can store in fridge for 2 days.\n{{NO}} Don\'t give more than 1 tsp per serving.\n{{NO}} Grind to absolutely smooth paste.' },
    { icon:zi('bowl'), name:'Masoor dal + pear puree', reason:'Iron + Vit C + stool softener', keys:['masoor dal','pear'],
      recipe:'1. Cook ½ tbsp masoor dal in ½ cup water — soft.\n2. Steam ¼ pear, mash.\n3. Mix pear puree into cooked dal.\n4. Add ghee.',
      tips:'{{OK}} Pear\'s Vit C boosts masoor\'s iron absorption.\n{{OK}} Gentle combo for sensitive tummies.\n{{NO}} Don\'t cook pear into dal — add after.\n{{NO}} Serve warm, not hot.' },
    { icon:zi('bowl'), name:'Ragi + beetroot porridge', reason:'Double iron powerhouse', keys:['ragi','beetroot'],
      recipe:'1. Grate 1 small beetroot, steam 5 min, puree.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix beetroot puree into ragi.\n4. Add ½ tsp ghee.',
      tips:'{{OK}} Two of the best plant iron sources combined.\n{{OK}} Pair with lemon or mango for absorption.\n{{NO}} Will stain everything pink — plan accordingly.\n{{NO}} Don\'t add salt.' },
    { icon:zi('spoon'), name:'Mango + banana mash', reason:'Vitamin C + energy — tropical delight', keys:['mango','banana'],
      recipe:'1. Mash 2 tbsp ripe mango.\n2. Mash ¼ ripe banana.\n3. Mix together.\n4. Serve immediately.',
      tips:'{{OK}} Naturally sweet — babies love this combo.\n{{OK}} Great after an iron-rich lunch.\n{{NO}} Only ripe, sweet mangoes.\n{{NO}} Limit portion — high sugar content.' },
    { icon:zi('spoon'), name:'Carrot + ghee + rice porridge', reason:'Vitamin A + fats for absorption + energy', keys:['carrot','ghee','rice'],
      recipe:'1. Grate 1 small carrot.\n2. Cook 1 tbsp rice in ¾ cup water until very soft.\n3. Add carrot, cook 5 more min.\n4. Mash, add ½ tsp ghee.',
      tips:'{{OK}} Ghee helps absorb carrot\'s Vitamin A.\n{{OK}} Mild, sweet, easy first meal.\n{{NO}} Don\'t skip the ghee — it\'s nutritionally important.\n{{NO}} Mash very smooth for beginners.' },
    { icon:zi('spoon'), name:'Blueberry + pear mash', reason:'Antioxidant + digestive comfort', keys:['blueberry','pear'],
      recipe:'1. Peel ¼ pear, steam 5 min.\n2. Steam 10 blueberries 2 min.\n3. Mash both together.\n4. Serve at room temp.',
      tips:'{{OK}} Pear softens stools, blueberry adds antioxidants.\n{{OK}} Beautiful purple colour.\n{{NO}} Don\'t give whole blueberries.\n{{NO}} Steam both for easier digestion.' },
  ];

  // New dish suggestions
  const NEW_DISH_POOL = [
    { icon:zi('spoon'), name:'Sweet potato mash', reason:'Vitamin A powerhouse — try introducing this week', newFood:'sweet potato',
      recipe:'1. Peel 1 small sweet potato, cut into cubes.\n2. Steam for 10–12 min until very soft.\n3. Mash with fork, add ½ tsp ghee.\n4. Serve warm.',
      tips:'{{OK}} Naturally sweet — babies usually love it.\n{{OK}} Rich orange = loaded with Vitamin A.\n{{NO}} Don\'t microwave — steam preserves nutrients.\n{{NO}} Introduce alone first to check for reactions.' },
    { icon:zi('sprout'), name:'Spinach dal khichdi', reason:'Double iron — dal + spinach with a dash of lemon', newFood:'spinach',
      recipe:'1. Wash 5–6 spinach leaves, blanch 2 min in boiling water.\n2. Chop finely or puree.\n3. Cook 1 tbsp rice + ½ tbsp moong dal — 3 whistles.\n4. Mix in spinach puree + ghee + lemon drops.',
      tips:'{{OK}} Blanching reduces oxalates in spinach.\n{{OK}} Lemon is essential for iron absorption here.\n{{NO}} Don\'t use raw spinach for babies.\n{{NO}} Don\'t reheat spinach dishes — make fresh.' },
    { icon:zi('spoon'), name:'Pumpkin puree', reason:'Vitamin A + iron, naturally sweet, easy to digest', newFood:'pumpkin',
      recipe:'1. Peel + cube 2 tbsp pumpkin.\n2. Steam 8–10 min until fork-tender.\n3. Mash smooth, add ghee.\n4. Can mix with ragi for a fuller meal.',
      tips:'{{OK}} Naturally sweet — no need for any sweetener.\n{{OK}} Orange flesh = rich in beta-carotene.\n{{NO}} Remove all seeds and skin.\n{{NO}} Don\'t use canned pumpkin.' },
    { icon:zi('spoon'), name:'Broccoli puree with ghee', reason:'Iron + calcium + Vit C — rare triple combo', newFood:'broccoli',
      recipe:'1. Cut 3–4 small broccoli florets.\n2. Steam 7–8 min until very soft.\n3. Blend/mash with 2 tbsp cooking water.\n4. Add ½ tsp ghee, serve.',
      tips:'{{OK}} One of the most nutrient-dense veggies.\n{{OK}} Steam, don\'t boil — keeps the Vit C.\n{{NO}} May cause gas — start small.\n{{NO}} Don\'t use the thick stem — florets only.' },
    { icon:zi('spoon'), name:'Oats porridge', reason:'Iron + fibre + magnesium — great breakfast grain', newFood:'oats',
      recipe:'1. Grind 1 tbsp oats to powder.\n2. Cook in ½ cup water on low for 5 min.\n3. Add mashed fruit (banana/apple) + ghee.\n4. Serve warm.',
      tips:'{{OK}} Use plain rolled oats — not instant/flavoured.\n{{OK}} Grind fine for first few times.\n{{NO}} Don\'t use flavoured oats packets.\n{{NO}} Watch for gluten reaction if family history.' },
    { icon:zi('bowl'), name:'Curd rice', reason:'Probiotics for gut health + easy to digest', newFood:'curd',
      recipe:'1. Cook 1 tbsp rice until very soft and mushy.\n2. Cool slightly, mix in 1 tbsp fresh curd.\n3. Mash well until creamy.\n4. Serve at room temperature.',
      tips:'{{OK}} Homemade curd is best — fresh probiotics.\n{{OK}} Great for hot weather — cooling food.\n{{NO}} Don\'t heat curd — kills good bacteria.\n{{NO}} Don\'t give cold — room temperature only.' },
    { icon:zi('bowl'), name:'Paneer mash', reason:'Calcium + protein powerhouse for growth', newFood:'paneer',
      recipe:'1. Take 1 tbsp fresh paneer, crumble.\n2. Steam for 3 min to soften.\n3. Mash smooth with fork.\n4. Mix into khichdi or dal for protein boost.',
      tips:'{{OK}} Use fresh, homemade paneer if possible.\n{{OK}} Great protein source for vegetarian babies.\n{{NO}} Don\'t fry — steam or crumble raw.\n{{NO}} Avoid market paneer with preservatives.' },
    { icon:zi('spoon'), name:'Papaya mash', reason:'Digestive enzymes + Vit C — great stool softener', newFood:'papaya',
      recipe:'1. Choose a ripe papaya (orange flesh, soft).\n2. Scoop out 2–3 tbsp, remove all seeds.\n3. Mash with fork until smooth.\n4. Serve immediately.',
      tips:'{{OK}} Natural digestive enzymes help tummy.\n{{OK}} Best fruit for constipation relief.\n{{NO}} Only ripe papaya — raw papaya is not safe.\n{{NO}} Remove every single black seed.' },
    { icon:zi('spoon'), name:'Cucumber raita', reason:'Hydrating + cooling with probiotics from curd', newFood:'cucumber',
      recipe:'1. Peel + grate ¼ cucumber.\n2. Mix with 2 tbsp fresh curd.\n3. Serve at room temperature.',
      tips:'{{OK}} Perfect for hot weather.\n{{OK}} Probiotics from curd + hydration from cucumber.\n{{NO}} Don\'t give chilled — room temp only.\n{{NO}} Peel and deseed for young babies.' },
    { icon:zi('bowl'), name:'Toor dal khichdi', reason:'Protein + iron — new legume variety', newFood:'toor dal',
      recipe:'1. Wash ½ tbsp toor dal + 1 tbsp rice, soak 30 min.\n2. Pressure cook with 1 cup water — 4 whistles.\n3. Mash smooth, add turmeric + ghee.',
      tips:'{{OK}} Slightly sweeter taste than moong/masoor.\n{{OK}} Staple comfort food across India.\n{{NO}} Needs more water and cooking than moong.\n{{NO}} Mash very well — toor can be grainy.' },
    { icon:zi('spoon'), name:'Potato + carrot mash', reason:'Energy + Vitamin A — easy comfort food', newFood:'potato',
      recipe:'1. Peel + cube 1 small potato + ½ carrot.\n2. Boil or steam 10–12 min until very soft.\n3. Mash together, add ½ tsp ghee + pinch turmeric.',
      tips:'{{OK}} Potato gives quick energy.\n{{OK}} Carrot adds colour, sweetness, and Vit A.\n{{NO}} Don\'t fry — boil or steam only.\n{{NO}} No salt or butter.' },
    { icon:zi('bowl'), name:'Jowar porridge', reason:'Iron + protein millet — gluten-free alternative', newFood:'jowar',
      recipe:'1. Dry roast 1 tbsp jowar flour 2 min.\n2. Add ½ cup water, stir continuously.\n3. Cook 5 min on low until thick.\n4. Add ghee + mashed fruit.',
      tips:'{{OK}} Gluten-free — safe for sensitive babies.\n{{OK}} Higher protein than rice.\n{{NO}} Stir continuously to prevent lumps.\n{{NO}} Don\'t make too thick — should be pourable.' },
    { icon:zi('bowl'), name:'Bajra porridge', reason:'Iron + zinc rich millet — great for growth', newFood:'bajra',
      recipe:'1. Dry roast 1 tbsp bajra flour 2 min.\n2. Add ½ cup water, stir well.\n3. Cook 5–6 min on low.\n4. Add ghee + jaggery-free date paste for sweetness.',
      tips:'{{OK}} Rich in iron and zinc — growth minerals.\n{{OK}} Warming food — great for winter.\n{{NO}} Don\'t give in very hot weather — it\'s heating.\n{{NO}} Introduce after 7 months.' },
    { icon:zi('spoon'), name:'Chiku puree', reason:'Natural sweetness + iron + calcium', newFood:'chiku',
      recipe:'1. Choose a ripe, soft chiku.\n2. Peel, remove seeds, scoop out 2–3 tbsp flesh.\n3. Mash smooth with fork.\n4. Serve immediately.',
      tips:'{{OK}} Naturally one of the sweetest fruits.\n{{OK}} Contains iron — unusual for a fruit.\n{{NO}} Always remove ALL seeds — choking hazard.\n{{NO}} Only use very ripe ones — unripe causes irritation.' },
    { icon:zi('drop'), name:'Watermelon juice (sips)', reason:'Hydrating + Vit C — refreshing on warm days', newFood:'watermelon',
      recipe:'1. Cut 3–4 small cubes of seedless watermelon.\n2. Mash through a strainer to extract juice.\n3. Offer 2–3 tsp in a cup — not a bottle.',
      tips:'{{OK}} Best hydration food in hot weather.\n{{OK}} Natural electrolytes.\n{{NO}} Don\'t give in large quantities — mostly water.\n{{NO}} Remove every seed — choking risk.' },
    { icon:zi('sparkle'), name:'Pomegranate juice', reason:'Iron + Vit C — boosts haemoglobin', newFood:'pomegranate',
      recipe:'1. Extract seeds from ¼ pomegranate.\n2. Blend lightly and strain for juice.\n3. Offer 2–3 tsp diluted with equal water.',
      tips:'{{OK}} One of the best iron + Vit C combos.\n{{OK}} Helps with anaemia prevention.\n{{NO}} Always strain — seed pieces are a choking hazard.\n{{NO}} Dilute for babies — pure juice is too strong.' },
    { icon:zi('spoon'), name:'Kiwi mash', reason:'Vitamin C powerhouse — great iron-absorption booster', newFood:'kiwi',
      recipe:'1. Peel 1 ripe kiwi, scoop flesh.\n2. Mash with fork — seeds are fine to eat.\n3. Serve 1–2 tbsp.',
      tips:'{{OK}} Highest Vit C per gram of any common fruit.\n{{OK}} Serve after ragi/dal meals for iron boost.\n{{NO}} May cause mouth tingling — start small.\n{{NO}} Avoid if family has allergy history.' },
    { icon:zi('spoon'), name:'Cashew ragi porridge', reason:'Brain fats + iron + zinc from cashew', newFood:'cashew',
      recipe:'1. Soak 3 cashews 2 hrs, grind to paste.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix cashew paste + ghee into porridge.',
      tips:'{{OK}} Cashew adds creamy texture babies love.\n{{OK}} Zinc supports immune system.\n{{NO}} Always grind to smooth paste.\n{{NO}} Watch for tree nut reactions first 2–3 times.' },
    { icon:zi('spoon'), name:'Peanut chutney with idli', reason:'Protein + healthy fats — traditional combo', newFood:'peanut',
      recipe:'1. Dry roast 1 tbsp peanuts, cool.\n2. Grind to very smooth paste with 2 tbsp water.\n3. Serve alongside soft steamed idli.',
      tips:'{{OK}} High protein + iron from peanuts.\n{{OK}} Traditional South Indian first food.\n{{NO}} Grind to absolutely smooth paste.\n{{NO}} Introduce peanuts early but watch for allergy.' },
    { icon:zi('spoon'), name:'Flaxseed ragi porridge', reason:'Omega-3 + iron — brain & blood builder', newFood:'flaxseed',
      recipe:'1. Dry roast ½ tsp flaxseeds, grind to powder.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix in flax powder + ghee.',
      tips:'{{OK}} Best plant source of omega-3.\n{{OK}} Must be ground — whole seeds pass undigested.\n{{NO}} Don\'t use more than ½ tsp — powerful fibre.\n{{NO}} Grind fresh each time — oxidises quickly.' },
    { icon:zi('spoon'), name:'Sesame ragi porridge', reason:'Calcium + iron from sesame — bone builder', newFood:'sesame',
      recipe:'1. Dry roast ½ tsp white sesame seeds.\n2. Grind to fine powder.\n3. Cook 1 tbsp ragi in ½ cup water (5 min).\n4. Mix in sesame powder + ghee.',
      tips:'{{OK}} Sesame has more calcium per gram than milk.\n{{OK}} Combined with ragi — double calcium.\n{{NO}} Use white sesame — milder taste.\n{{NO}} Grind fine — whole seeds are choking risk.' },
    { icon:zi('spoon'), name:'Orange segments', reason:'Vitamin C burst — pair after iron-rich meals', newFood:'orange',
      recipe:'1. Peel a sweet orange, separate 2–3 segments.\n2. Remove membrane and seeds.\n3. Mash flesh gently or let baby suck on segments.\n4. Start with juice squeezed from 1 segment.',
      tips:'{{OK}} Best when served right after ragi/dal meals.\n{{OK}} Vit C doubles iron absorption.\n{{NO}} Start with juice, not whole segments.\n{{NO}} Avoid sour oranges — choose sweet mosambi/malta.' },
    { icon:zi('bowl'), name:'Sattu porridge', reason:'Protein-dense, cooling, traditional weaning food', newFood:'sattu',
      recipe:'1. Mix 1 tbsp sattu flour in ½ cup water.\n2. Cook on low 3–4 min, stirring.\n3. Add ghee + mashed banana for sweetness.',
      tips:'{{OK}} Traditional Bihar/Jharkhand weaning food.\n{{OK}} Higher protein than most grains.\n{{NO}} Don\'t make too thick.\n{{NO}} Use roasted sattu — not raw gram flour.' },
    { icon:zi('bowl'), name:'Dalia porridge', reason:'Fibre + protein + iron — wholesome grain', newFood:'dalia',
      recipe:'1. Wash 1 tbsp broken wheat (dalia).\n2. Pressure cook with 1 cup water — 3 whistles.\n3. Mash smooth, add ghee + mashed fruit.',
      tips:'{{OK}} Whole grain — more fibre than rice.\n{{OK}} Filling and satisfying.\n{{NO}} Cook until very soft — can be chewy.\n{{NO}} Introduce after 7 months.' },
    { icon:zi('bowl'), name:'Idli (soft, steamed)', reason:'Fermented = gut-friendly, easy protein', newFood:'idli',
      recipe:'1. Use homemade idli batter (rice + urad dal).\n2. Steam mini idlis 10 min.\n3. Mash with sambar water or curd.\n4. Add ghee.',
      tips:'{{OK}} Fermentation creates natural probiotics.\n{{OK}} Soft texture — easy for gums.\n{{NO}} Don\'t give with spicy sambar — use plain dal water.\n{{NO}} Homemade batter preferred — no preservatives.' },
    { icon:zi('spoon'), name:'Grape mash (seedless)', reason:'Vitamin C + antioxidants — juicy finger food', newFood:'grapes',
      recipe:'1. Wash 8–10 seedless grapes thoroughly.\n2. Cut each grape in half lengthwise (quarters for <9m).\n3. Mash lightly with fork or serve as halves for BLW.\n4. Can also blend into puree.',
      tips:'{{OK}} Always cut lengthwise — round shape is a choking hazard.\n{{OK}} Green, black, or red — all equally nutritious.\n{{NO}} NEVER give whole grapes — always halve at minimum.\n{{NO}} Remove skin if baby struggles with texture.' },
    { icon:zi('spoon'), name:'Strawberry mash', reason:'Vitamin C powerhouse — bright colour babies love', newFood:'strawberry',
      recipe:'1. Wash 3–4 ripe strawberries.\n2. Remove stems, mash with fork.\n3. Serve 1–2 tbsp — can mix with curd.\n4. For first time, serve alone to check reaction.',
      tips:'{{OK}} Highest Vit C of common berries.\n{{OK}} Natural sweetness — no sugar needed.\n{{NO}} Can cause mild rash around mouth — usually harmless.\n{{NO}} Wash very thoroughly — pesticide-prone fruit.' },
    { icon:zi('bowl'), name:'Rajma mash', reason:'Protein + iron + fibre — hearty legume', newFood:'rajma',
      recipe:'1. Soak ¼ cup rajma overnight (12 hrs minimum).\n2. Pressure cook with 2 cups water — 6–7 whistles until very soft.\n3. Mash smooth — no whole beans.\n4. Add ghee + pinch turmeric.',
      tips:'{{OK}} High protein + iron — great for vegetarian babies.\n{{OK}} Overnight soaking is essential for digestibility.\n{{NO}} Undercooked rajma is toxic — cook until mushy.\n{{NO}} Can cause gas — start with 1–2 tbsp.' },
    { icon:'🫛', name:'Peas puree', reason:'Protein + Vit C + natural sweetness', newFood:'peas',
      recipe:'1. Boil ¼ cup fresh/frozen peas 5 min.\n2. Blend smooth with 2 tbsp cooking water.\n3. Strain through sieve to remove skins.\n4. Add ghee, serve warm.',
      tips:'{{OK}} Naturally sweet — babies usually love it.\n{{OK}} Fresh or frozen equally nutritious.\n{{NO}} Strain to remove tough skins for young babies.\n{{NO}} Don\'t use canned peas — too salty.' },
    { icon:zi('spoon'), name:'Sweet corn puree', reason:'Energy + natural sweetness + Vit B', newFood:'corn',
      recipe:'1. Boil ¼ cup corn kernels 8–10 min until soft.\n2. Blend smooth.\n3. Strain through sieve to remove hull.\n4. Mix with ghee or curd.',
      tips:'{{OK}} Naturally sweet — great mixed into khichdi.\n{{OK}} Straining removes the indigestible hull.\n{{NO}} Don\'t give whole kernels — choking risk.\n{{NO}} Avoid canned corn.' },
    { icon:zi('bowl'), name:'Coconut milk porridge', reason:'Healthy fats + iron absorption — tropical taste', newFood:'coconut',
      recipe:'1. Cook 1 tbsp ragi/rice in ½ cup water (5 min).\n2. Add 2 tbsp fresh coconut milk.\n3. Stir well, cook 1 more min.\n4. Add mashed fruit for sweetness.',
      tips:'{{OK}} Healthy MCT fats — good for brain.\n{{OK}} Fresh coconut milk preferred over canned.\n{{NO}} Don\'t use coconut cream — too rich.\n{{NO}} Start small — check for reaction first.' },
    { icon:zi('spoon'), name:'Tomato dal soup', reason:'Vitamin C + iron from dal — tangy and warming', newFood:'tomato',
      recipe:'1. Blanch 1 small tomato, peel and deseed.\n2. Cook ½ tbsp moong dal with tomato in 1 cup water — 3 whistles.\n3. Mash smooth, add ghee + pinch jeera.',
      tips:'{{OK}} Vitamin C from tomato boosts dal\'s iron absorption.\n{{OK}} Blanching + deseeding removes acidity.\n{{NO}} Don\'t use raw tomato for young babies.\n{{NO}} Avoid if baby has reflux — acidic.' },
    { icon:zi('bowl'), name:'Suji halwa', reason:'Iron + quick energy — classic Indian baby food', newFood:'suji',
      recipe:'1. Dry roast 1 tbsp suji (semolina) on low until fragrant.\n2. Add ½ cup water slowly, stir continuously.\n3. Cook 3–4 min until thick.\n4. Add ½ tsp ghee + mashed fruit.',
      tips:'{{OK}} Quick to make — 5 minutes total.\n{{OK}} Add dry fruit powder for nutrition boost.\n{{NO}} Stir continuously — lumps form fast.\n{{NO}} Cool before serving — retains heat.' },
    { icon:zi('bowl'), name:'Poha (flattened rice)', reason:'Iron-fortified + light + easy to digest', newFood:'poha',
      recipe:'1. Wash 2 tbsp thin poha, soak in water 2 min.\n2. Drain, mash gently.\n3. Mix with mashed banana or curd.\n4. Add ghee.',
      tips:'{{OK}} Iron-fortified during processing.\n{{OK}} Very light — good for when appetite is low.\n{{NO}} Use thin poha, not thick — easier to mash.\n{{NO}} Don\'t overcook — becomes gummy.' },
    { icon:zi('spoon'), name:'Makhana porridge', reason:'Calcium + protein — light and allergen-free', newFood:'makhana',
      recipe:'1. Dry roast 10 makhana (fox nuts) until crisp.\n2. Grind to fine powder.\n3. Cook in ½ cup milk/water for 3–4 min.\n4. Add ghee + mashed fruit.',
      tips:'{{OK}} High calcium and protein, low allergen risk.\n{{OK}} Traditional Indian superfood.\n{{NO}} Grind very fine — pieces are choking hazard.\n{{NO}} Don\'t add salt or spices.' },
    { icon:zi('spoon'), name:'Butter rice', reason:'Healthy fats + energy — comfort food for fussy days', newFood:'butter',
      recipe:'1. Cook 1 tbsp rice until very soft.\n2. Mash well.\n3. Add ½ tsp fresh white butter (makhan).\n4. Mix until creamy.',
      tips:'{{OK}} White butter is better than yellow — less processed.\n{{OK}} Great for underweight babies — calorie-dense.\n{{NO}} Use unsalted butter only.\n{{NO}} Don\'t give when baby has cold/cough — can increase mucus.' },
    { icon:zi('bowl'), name:'Chana dal porridge', reason:'Protein + zinc + iron — hearty legume', newFood:'chana dal',
      recipe:'1. Wash ½ tbsp chana dal, soak 2 hrs.\n2. Pressure cook with 1 cup water — 4 whistles.\n3. Mash very smooth, add ghee + turmeric.',
      tips:'{{OK}} Highest protein among common dals.\n{{OK}} Rich in zinc — immune booster.\n{{NO}} Needs thorough soaking and cooking — tough legume.\n{{NO}} Can cause gas — introduce gradually.' },
    { icon:zi('bowl'), name:'Cheese rice (soft)', reason:'Calcium + protein + fat — creamy comfort food', newFood:'cheese',
      recipe:'1. Cook 1 tbsp rice until mushy.\n2. Grate 1 tbsp mild cheddar or fresh cheese.\n3. Mix into warm rice until melted.\n4. Add a pinch of turmeric.',
      tips:'{{OK}} Good calcium source for non-milk protein.\n{{OK}} Use mild, low-salt varieties.\n{{NO}} Avoid processed cheese slices.\n{{NO}} Don\'t use blue cheese or strong flavours.' },
    { icon:zi('bowl'), name:'Sabudana kheer', reason:'Energy + easy digestion — great during illness', newFood:'sabudana',
      recipe:'1. Soak 1 tbsp sabudana (sago) in water for 2 hrs.\n2. Cook in ½ cup milk/water until translucent (8–10 min).\n3. Add mashed fruit + ghee.',
      tips:'{{OK}} Very easy to digest — ideal for sick days.\n{{OK}} Quick energy from starch.\n{{NO}} Soak well — unsoaked sabudana is hard to digest.\n{{NO}} Low in protein — pair with dal or curd.' },
    { icon:zi('sprout'), name:'Drumstick dal', reason:'Calcium + iron + Vit C from moringa', newFood:'drumstick',
      recipe:'1. Scrape flesh from 1 drumstick pod (discard fibrous shell).\n2. Cook with ½ tbsp moong dal + ½ cup water — 3 whistles.\n3. Mash smooth, add ghee.',
      tips:'{{OK}} Drumstick is a calcium + iron superfood.\n{{OK}} Only use the soft inner flesh.\n{{NO}} Discard the tough outer shell completely.\n{{NO}} Don\'t give the fibrous strings.' },
    { icon:zi('spoon'), name:'Yam (suran) mash', reason:'Energy + fibre + Vitamin C', newFood:'yam',
      recipe:'1. Peel and cube 2 tbsp yam.\n2. Boil or steam 12–15 min until very soft.\n3. Mash smooth, add ghee + turmeric.',
      tips:'{{OK}} Starchy and filling — good energy source.\n{{OK}} High in potassium.\n{{NO}} Must be fully cooked — raw yam causes itching.\n{{NO}} Peel carefully — some varieties irritate skin.' },
    { icon:zi('spoon'), name:'Raw banana sabzi mash', reason:'Prebiotic fibre + potassium — gut-friendly', newFood:'raw banana',
      recipe:'1. Peel 1 small raw banana (kachha kela), cube.\n2. Pressure cook with ½ cup water — 2 whistles.\n3. Mash smooth, add ghee + pinch jeera powder.',
      tips:'{{OK}} Prebiotic fibre feeds good gut bacteria.\n{{OK}} Helps with loose stools.\n{{NO}} Must be cooked — never raw.\n{{NO}} Don\'t confuse with ripe banana — different food entirely.' },
    { icon:zi('bowl'), name:'Urad dal porridge', reason:'Protein + iron + calcium — fermentation-ready legume', newFood:'urad dal',
      recipe:'1. Wash ½ tbsp urad dal, soak 3 hrs.\n2. Pressure cook with 1 cup water — 4 whistles.\n3. Mash very smooth, add ghee + turmeric.',
      tips:'{{OK}} Highest protein among dals.\n{{OK}} Base of idli/dosa batter — already familiar.\n{{NO}} Can cause gas — start small.\n{{NO}} Needs thorough cooking — very tough raw.' },
    { icon:zi('bowl'), name:'Amaranth porridge', reason:'Complete protein + calcium — gluten-free superfood', newFood:'amaranth',
      recipe:'1. Dry roast 1 tbsp amaranth (rajgira) flour 2 min.\n2. Add ½ cup water, stir continuously.\n3. Cook 5 min until thick.\n4. Add ghee + mashed fruit.',
      tips:'{{OK}} Complete protein — rare for a grain.\n{{OK}} Gluten-free and easy to digest.\n{{NO}} Stir well — lumps form easily.\n{{NO}} Introduce after 7 months.' },
    { icon:zi('bowl'), name:'Barley water + porridge', reason:'Fibre + cooling + UTI prevention', newFood:'barley',
      recipe:'1. Wash 1 tbsp barley, soak 2 hrs.\n2. Cook in 1 cup water until very soft (15 min).\n3. For water: strain and offer liquid. For porridge: mash barley + ghee.',
      tips:'{{OK}} Barley water is cooling — great in summer.\n{{OK}} Traditionally used for UTI prevention.\n{{NO}} Contains gluten — watch for sensitivity.\n{{NO}} Cook until very mushy.' },
    { icon:zi('drop'), name:'Chia seed pudding', reason:'Omega-3 + calcium + fibre — tiny superfood', newFood:'chia seeds',
      recipe:'1. Soak 1 tsp chia seeds in ¼ cup milk/water for 2 hrs (or overnight).\n2. Seeds form a gel — mash any clumps.\n3. Mix with mashed fruit + ghee.',
      tips:'{{OK}} Omega-3 content rivals flaxseed.\n{{OK}} Pre-soaking is essential — seeds expand 10×.\n{{NO}} Never give dry — swelling can cause choking.\n{{NO}} Start with ½ tsp — very high fibre.' },
    { icon:zi('spoon'), name:'Jaggery ragi porridge', reason:'Iron + natural sweetener — traditional combo', newFood:'jaggery',
      recipe:'1. Cook 1 tbsp ragi in ½ cup water (5 min).\n2. Dissolve ½ tsp organic jaggery powder in warm water, strain.\n3. Mix into porridge + ghee.',
      tips:'{{OK}} Natural iron source — much better than sugar.\n{{OK}} Traditional sweetener for baby food in India.\n{{NO}} Don\'t use before 8 months.\n{{NO}} Use organic — commercial jaggery may have chemicals.\n{{NO}} Very small amount — still a sugar.' },
    { icon:zi('sprout'), name:'Saffron milk rice', reason:'Brain tonic + immunity — Ayurvedic tradition', newFood:'saffron',
      recipe:'1. Soak 1–2 saffron strands in 1 tsp warm milk for 10 min.\n2. Cook 1 tbsp rice until mushy.\n3. Mix saffron milk into rice + ghee.',
      tips:'{{OK}} Traditional brain tonic in Ayurveda.\n{{OK}} Anti-inflammatory + immunity booster.\n{{NO}} Use only 1–2 strands — very potent.\n{{NO}} Use genuine saffron — fakes are common.' },
    { icon:zi('sprout'), name:'Cauliflower puree', reason:'Vitamin C + folate — mild taste for picky eaters', newFood:'cauliflower',
      recipe:'1. Cut 3–4 small cauliflower florets.\n2. Steam 8–10 min until very soft.\n3. Mash smooth with cooking water + ghee.',
      tips:'{{OK}} Very mild taste — easy for first-timers.\n{{OK}} Good source of Vit C and folate.\n{{NO}} May cause gas — start small.\n{{NO}} Use only florets — stem is too fibrous.' },
    { icon:zi('spoon'), name:'Peach puree', reason:'Vitamin A + C + natural sweetness', newFood:'peach',
      recipe:'1. Choose a ripe, soft peach.\n2. Peel, remove pit, cut into pieces.\n3. Steam 5 min until very soft.\n4. Mash smooth, serve warm or cool.',
      tips:'{{OK}} Naturally sweet and fragrant.\n{{OK}} Good source of Vit A for eye health.\n{{NO}} Remove pit completely — contains trace cyanide.\n{{NO}} Peel skin for young babies.' },
    { icon:zi('bowl'), name:'Fig (anjeer) puree', reason:'Calcium + iron + fibre — natural laxative', newFood:'fig',
      recipe:'1. Soak 2 dried figs in warm water for 1 hr.\n2. Blend into smooth paste with soaking water.\n3. Mix into porridge or serve alongside curd.',
      tips:'{{OK}} Excellent calcium source — rare for a fruit.\n{{OK}} Natural stool softener for constipation.\n{{NO}} Dried figs are very sweet — use sparingly.\n{{NO}} Fresh figs preferred when in season.' },
    { icon:zi('bowl'), name:'Dosa (soft, thin)', reason:'Fermented = probiotics + protein from urad dal', newFood:'dosa',
      recipe:'1. Use homemade batter (rice + urad dal, fermented overnight).\n2. Make thin, soft dosas on low heat.\n3. Tear into small pieces, serve with dal or curd.',
      tips:'{{OK}} Fermented = natural probiotics for gut.\n{{OK}} Thin and soft — easy for baby gums.\n{{NO}} Don\'t make crispy — soft only.\n{{NO}} Serve with plain dal, not spicy chutney.' },
    { icon:zi('spoon'), name:'Pumpkin seed ragi porridge', reason:'Zinc + iron + protein — immunity builder', newFood:'pumpkin seeds',
      recipe:'1. Dry roast 1 tsp pumpkin seeds, grind to powder.\n2. Cook 1 tbsp ragi in ½ cup water (5 min).\n3. Mix in seed powder + ghee.',
      tips:'{{OK}} Highest zinc of any seed — key for immunity.\n{{OK}} Good iron source too.\n{{NO}} Always grind to powder — whole seeds are choking risk.\n{{NO}} Don\'t use salted/flavoured seeds.' },
    { icon:'🫑', name:'Capsicum rice', reason:'Vitamin C + colour variety — mild bell pepper', newFood:'capsicum',
      recipe:'1. Deseed ¼ red/yellow capsicum, chop fine.\n2. Sauté lightly in ½ tsp ghee 3 min.\n3. Mix into cooked, mashed rice.\n4. Mash everything smooth.',
      tips:'{{OK}} Red/yellow are sweeter than green.\n{{OK}} Very high Vitamin C content.\n{{NO}} Remove seeds and white membrane.\n{{NO}} Cook well — raw capsicum is too tough.' },
  ];

  // Build set of introduced food names (lowercase)
  const introduced = new Set(foods.map(f => f.name.toLowerCase()));

  // Filter RECO_POOL: ALL keys must be in introduced foods
  const eligible = RECO_POOL.filter(r =>
    r.keys.every(k => introduced.has(k.toLowerCase()))
  );

  // Get last 5 days of diary for freshness scoring
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 5);
  const recentMeals = Object.entries(feedingData)
    .filter(([d]) => new Date(d) >= cutoff)
    .map(([,e]) => [e.breakfast,e.lunch,e.dinner,e.snack].join(' ').toLowerCase())
    .join(' ');

  // Prefer items not eaten recently
  const scored = eligible.map(r => ({
    ...r, recent: r.keys.some(k => recentMeals.includes(k.toLowerCase()))
  }));
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const notRecent = scored.filter(r => !r.recent);
  const pool = notRecent.length >= 2 ? notRecent : scored;

  let html = '';
  let recoIdx = 0;

  // Pick 2 from introduced foods
  if (pool.length > 0) {
    const pick1 = pool[doy % pool.length];
    const pick2 = pool[(doy + 3) % pool.length];
    const picks = pick1 === pick2 ? [pick1] : [pick1, pick2];
    html += picks.map(p => {
      const id = 'reco-recipe-' + (recoIdx++);
      return `
      <div class="reco-item" style="flex-direction:column;align-items:stretch;">
        <div class="fx-start g8">
          <div class="reco-icon">${p.icon}</div>
          <div class="reco-body flex-1">
            <strong>${p.name}</strong>
            <span>${p.reason}</span>
          </div>
          <button class="btn btn-ghost" style="font-size:var(--fs-sm);flex-shrink:0;padding:5px 10px;" data-action="toggleRecoRecipe" data-arg="${id}">View recipe</button>
        </div>
        <div id="${id}" style="display:none;margin-top:10px;padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--glass-strong);font-size:var(--fs-base);line-height:1.6;">
          <div class="t-title mb-8">${zi('note')} Recipe</div>
          <div style="color:var(--text);white-space:pre-line;">${p.recipe}</div>
          <div class="t-title" style="margin-top:8px;margin-bottom:4px;"><span class="zi-check-placeholder"></span> Dos & <span class="zi-warn-placeholder"></span> Don'ts</div>
          <div style="color:var(--mid);white-space:pre-line;">${fmtTips(p.tips)}</div>
        </div>
      </div>`;
    }).join('');
  } else {
    html += '<div class="t-sub-light py-4">Add more foods to the introduced list to get personalised recommendations.</div>';
  }

  // Pick 1 new dish — food NOT yet introduced
  const newEligible = NEW_DISH_POOL.filter(n => !introduced.has(n.newFood.toLowerCase()));
  if (newEligible.length > 0) {
    const newPick = newEligible[doy % newEligible.length];
    const id = 'reco-recipe-' + (recoIdx++);
    html += `
      <div class="reco-item" style="background:var(--lav-light);border:1.5px dashed rgba(201,184,232,0.5);margin-top:6px;flex-direction:column;align-items:stretch;">
        <div class="fx-start g8">
          <div class="reco-icon">${newPick.icon}</div>
          <div class="reco-body flex-1">
            <strong>🆕 Try new — ${newPick.name}</strong>
            <span>${newPick.reason}</span>
          </div>
          <button class="btn btn-ghost" style="font-size:var(--fs-sm);flex-shrink:0;padding:5px 10px;" data-action="toggleRecoRecipe" data-arg="${id}">View recipe</button>
        </div>
        <div id="${id}" style="display:none;margin-top:10px;padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--glass);font-size:var(--fs-base);line-height:1.6;">
          <div class="t-title mb-8">${zi('note')} Recipe</div>
          <div style="color:var(--text);white-space:pre-line;">${newPick.recipe}</div>
          <div class="t-title" style="margin-top:8px;margin-bottom:4px;"><span class="zi-check-placeholder"></span> Dos & <span class="zi-warn-placeholder"></span> Don'ts</div>
          <div style="color:var(--mid);white-space:pre-line;">${fmtTips(newPick.tips)}</div>
        </div>
      </div>`;
  }

  el.innerHTML = html;
}

function toggleRecoRecipe(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Pick one activity for today, rotated daily
function renderHomeActivity() {
  const el = document.getElementById('homeActivity');
  if (!el) return; // v2.3: element relocated
  const acts = getFilteredActivities();
  if (!acts.length) { el.innerHTML = '<div class="t-sub-light">All activities up to date!</div>'; return; }
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(),0,0)) / 86400000);

  const catMeta = {
    motor:    { icon:zi('run'), label:'Motor' },
    sensory:  { icon:zi('palette'), label:'Sensory' },
    language: { icon:zi('chat'), label:'Language' },
    social:   { icon:zi('handshake'), label:'Social' },
  };

  // Group by type
  const groups = {};
  acts.forEach(a => {
    if (!groups[a.type]) groups[a.type] = [];
    groups[a.type].push(a);
  });

  // Pick one from each available category, rotated daily
  const catOrder = ['motor','sensory','language','social'];
  const picks = [];
  catOrder.forEach(cat => {
    const pool = groups[cat];
    if (!pool || pool.length === 0) return;
    picks.push(pool[doy % pool.length]);
  });

  if (picks.length === 0) {
    el.innerHTML = '<div class="t-sub-light">No activities available right now.</div>';
    return;
  }

  el.innerHTML = picks.map(a => {
    const meta = catMeta[a.type] || { icon:zi('target'), label: a.type };
    return `
    <div class="activity-item ${a.type} mb-8">
      <div class="activity-icon">${a.icon}</div>
      <div class="activity-body">
        <strong>${a.title}</strong>
        <span>${a.desc}</span>
        <span class="activity-cat-label ${a.type}">${meta.icon} ${meta.label}</span>
      </div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────

// VACCINATION HISTORY (History tab)
// ─────────────────────────────────────────
function renderVaccHistory() {
  const container = document.getElementById('vaccHistoryContent');
  if (!container) return;

  const past = vaccData.filter(v => !v.upcoming).sort((a, b) => new Date(b.date) - new Date(a.date));
  const upcoming = vaccData.find(v => v.upcoming);
  const total = past.length + (upcoming ? 1 : 0);

  // Build a lookup from VACC_SCHEDULE by normalized name
  const schedLookup = {};
  VACC_SCHEDULE.forEach(s => { schedLookup[normVacc(s.name)] = s; });

  let html = '';

  // Upcoming vaccination highlight
  if (upcoming) {
    const daysTo = Math.max(0, Math.ceil((new Date(upcoming.date) - new Date()) / 86400000));
    const urgency = daysTo <= 7 ? 'var(--tc-danger)' : daysTo <= 14 ? 'var(--tc-caution)' : 'var(--tc-lav)';
    const uInfo = schedLookup[normVacc(upcoming.name)];
    const bookedData = load(KEYS.vaccBooked, null);
    const isBooked = bookedData && bookedData.vaccName === upcoming.name;
    const apptLabel = isBooked ? getVaccApptLabel(bookedData) : null;
    const bookingBadge = isBooked
      ? (apptLabel
        ? `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:var(--sp-8);padding:3px 10px;border-radius:var(--r-full);background:var(--surface-sage);"><span class="status-good-xs">${zi('check')} Booked</span><span style="font-size:var(--fs-xs);font-weight:400;color:var(--mid);">${apptLabel}</span></div>`
        : `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:var(--sp-8);padding:3px 10px;border-radius:var(--r-full);background:var(--surface-sage);cursor:pointer;" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}"><span class="status-good-xs">${zi('check')} Booked</span><span style="font-size:var(--fs-xs);font-weight:400;color:var(--light);">Add date & time</span></div>`)
      : (daysTo <= 14 ? `<div class="mt-6"><button class="btn btn-sage vc-book-btn" data-action="markVaccBooked" data-arg="${escAttr(upcoming.name)}">${zi('clock')} Book appointment</button></div>` : '');
    html += `
      <div style="display:flex;align-items:center;gap:var(--sp-12);padding:14px 16px;border-radius:var(--r-xl);background:var(--lav-light);border-left:var(--accent-w) solid ${urgency};margin-bottom:14px;">
        <div style="font-size:var(--icon-lg);">⏳</div>
        <div class="flex-1">
          <div style="font-size:var(--fs-sm);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--light);margin-bottom:2px;">Next due</div>
          <div class="t-title" style="font-size:var(--fs-md);">${escHtml(upcoming.name)}</div>
          <div style="font-size:var(--fs-sm);color:${urgency};margin-top:2px;">${formatDate(upcoming.date)} · ${daysTo} days away</div>
          ${uInfo ? `<div class="t-sub mt-4">${zi('shield')} ${escHtml(uInfo.protects)}</div>
          <div style="font-size:var(--fs-sm);color:var(--light);margin-top:2px;">${zi('list')} ${escHtml(uInfo.notes)}</div>` : ''}
          ${bookingBadge}
        </div>
      </div>`;
  }

  // Past vaccinations timeline
  if (past.length === 0) {
    html += '<div style="color:var(--light);font-size:var(--fs-base);padding:8px 0;">No vaccinations recorded yet.</div>';
  } else {
    html += '<div class="fx-col g8">';
    past.forEach((v, idx) => {
      const ageAtVacc = ageAtDate(v.date);
      const info = schedLookup[normVacc(v.name)];
      const infoId = 'vacc-info-' + idx;
      const realIdx = vaccData.indexOf(v);
      const dateFlag = v.dateChangeReason ? `<div style="font-size:var(--fs-xs);color:var(--tc-warn);margin-top:1px;">${zi('note')} ${escHtml(v.dateChangeReason)}</div>` : '';
      html += `
        <div style="border-radius:var(--r-lg);background:var(--glass);border-left:var(--accent-w) solid var(--lavender);overflow:hidden;">
          <div style="display:flex;align-items:center;gap:var(--sp-8);padding:8px 10px;cursor:pointer;" data-action="toggleVaccHistoryInfo" data-arg="${infoId}">
            <span class="t-sm"><span class="zi-check-placeholder"></span></span>
            <span class="t-sm">${zi('syringe')}</span>
            <div class="flex-1-min">
              <div class="t-title fw-600">${escHtml(v.name)}</div>
              <div style="font-size:var(--fs-sm);color:var(--tc-lav);">${formatDate(v.date)} · ${ageAtVacc}</div>
              ${dateFlag}
              ${_renderAttribution(v)}
            </div>
            <button data-action="openVaccEditModal" data-stop="1" data-arg="${realIdx}" class="btn-icon-edit" aria-label="Edit date">Edit</button>
            ${info ? '<span style="font-size:var(--icon-xs);color:var(--light);">ⓘ</span>' : ''}
          </div>
          ${info ? `<div id="${infoId}" style="display:none;padding:8px 12px 10px 38px;border-top:1px solid rgba(201,184,232,0.2);">
            <div style="font-size:var(--fs-sm);color:var(--text);line-height:var(--lh-relaxed);">
              <div class="fx-start g8 mb-4">
                <span class="shrink-0">${zi('shield')}</span>
                <span><strong>Protects against:</strong> ${escHtml(info.protects)}</span>
              </div>
              <div class="fx-start g8 mb-4">
                <span class="shrink-0">${zi('clock')}</span>
                <span><strong>Typically given:</strong> ${escHtml(info.age)} · ${escHtml(info.notes)}</span>
              </div>
              ${(() => { const g = getVaccGuidance(v.name); return g.note ? '<div class="fx-start g8 mb-4"><span class="shrink-0">' + zi('bulb') + '</span><span>' + escHtml(g.note) + '</span></div>' : ''; })()}
            </div>
          </div>` : ''}
        </div>`;
    });
    html += '</div>';
  }

  container.innerHTML = html;
}
// MILESTONE_TIDBITS → migrated to data.js

function guessMilestoneCat(text) {
  const t = text.toLowerCase();
  // Motor keywords
  if (/roll|sit|stand|crawl|walk|cruise|grasp|pincer|reach|step|climb|pull|push|kick|hold|transfer|feed|spoon|tooth|teeth/.test(t)) return 'motor';
  // Language keywords
  if (/babbl|talk|word|speak|say|mama|dada|name|respond|sound|voice|language|consonant|point/.test(t)) return 'language';
  // Cognitive keywords
  if (/object|permanence|understand|follow|instruction|cause|effect|stack|block|puzzle|no\b|remember/.test(t)) return 'cognitive';
  // Social keywords
  if (/wave|clap|smile|laugh|stranger|separation|peek|imitat|social|sleep|bye|anxiety|play/.test(t)) return 'social';
  return 'motor'; // default
}

function getMilestoneTidbits(milestoneText) {
  const lower = milestoneText.toLowerCase();
  return MILESTONE_TIDBITS.find(t => t.match.some(m => lower.includes(m))) || null;
}

// renderMilestones — facade for the milestones-tab data-mutation-hook entry
// point (8 external callsites in home / core / intel / medical). PR-α split
// (Stability sub-phase 2): orchestrator-only — body extracted to per-surface
// renderers so SYNC_RENDER_DEPS can dispatch each independently. Persistence
// write-through retained at facade level: setMilestoneStatus / deleteMilestone
// / addMilestone (this file) all rely on this save() as the de-facto save
// floor and don't independently persist before invoking renderMilestones.
// (Care/Maren E1' carve-out at PR-α charter; render-functions-must-be-pure
// candidate landing deferred until those 3 callsites save explicitly.)
function renderMilestones() {
  save(KEYS.milestones, milestones);
  renderMilestoneList();
  renderCategoryWheels();
  renderRegressionAlerts();
  renderMilestoneTimeline();
  renderRecentEvidence();
  renderActiveMilestones();
}

// renderMilestoneList — extracted from renderMilestones (PR-α). Owns the
// #milestoneList element only: category-grouped 5-stage milestone display.
function renderMilestoneList() {
  const list = document.getElementById('milestoneList');
  if (!list) return;
  list.innerHTML = '';

  if (milestones.length === 0) {
    list.innerHTML = '<div class="t-sub-light py-4">No milestones tracked yet.</div>';
    return;
  }

  const catMeta = {
    motor:     { icon:zi('run'), label:'Motor',     color:'sage' },
    language:  { icon:zi('chat'), label:'Language',   color:'sky' },
    social:    { icon:zi('handshake'), label:'Social',     color:'peach' },
    cognitive: { icon:zi('brain'), label:'Cognitive',  color:'lav' },
  };

  const groups = {};
  milestones.forEach((m, i) => {
    const cat = m.cat || 'motor';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ ...m, _i: i });
  });

  // Sort: mastered first (newest), then by stage descending
  const stageOrder = { mastered:0, consistent:1, practicing:2, emerging:3, not_started:4 };
  Object.values(groups).forEach(arr => arr.sort((a, b) => {
    if (stageOrder[a.status] !== stageOrder[b.status]) return stageOrder[a.status] - stageOrder[b.status];
    if (a.status === 'mastered' && b.status === 'mastered') return (b.masteredAt || '').localeCompare(a.masteredAt || '');
    return 0;
  }));

  const catOrder = ['motor', 'language', 'social', 'cognitive'];
  let html = '<div class="ms-cats">';

  catOrder.forEach(cat => {
    const items = groups[cat];
    if (!items || items.length === 0) return;
    const meta = catMeta[cat];
    const masteredCount = items.filter(m => m.status === 'mastered').length;
    const activeCount = items.filter(m => ['emerging','practicing','consistent'].includes(m.status)).length;
    const avgPct = items.length > 0 ? Math.round(items.reduce((s, m) => s + (MS_STAGE_META[m.status]?.pct || 0), 0) / items.length) : 0;
    const catId = 'ms-cat-' + cat;

    html += `
      <div>
        <div class="ms-cat-card ${cat}" id="${catId}" data-action="toggleMsCat" data-arg="${cat}">
          <div class="ms-cat-top">
            <div class="ms-cat-icon">${meta.icon}</div>
            <div class="ms-cat-info">
              <div class="ms-cat-name">${meta.label}</div>
              <div class="ms-cat-count">${masteredCount} mastered${activeCount ? ', ' + activeCount + ' active' : ''} · ${avgPct}% avg</div>
            </div>
            <div class="ms-cat-chevron">▾</div>
          </div>
        </div>
        <div class="ms-cat-items ${cat}" id="ms-cat-items-${cat}">`;

    items.forEach(m => {
      const stageMeta = MS_STAGE_META[m.status] || MS_STAGE_META.not_started;
      const stageIdx = MS_STAGES.indexOf(m.status);
      const cls = m.status;

      // Progress bar segments (4 segments for 4 transitions)
      let progressHtml = '<div class="ms-progress-bar">';
      for (let s = 1; s <= 4; s++) {
        const filled = stageIdx >= s ? ` filled-${s}` : '';
        progressHtml += `<div class="ms-progress-seg${filled}"></div>`;
      }
      progressHtml += '</div>';
      progressHtml += `<div class="ms-stage-label" style="color:${stageMeta.color};">${stageMeta.icon} ${stageMeta.label} · ${stageMeta.pct}%</div>`;

      // Meta badges
      let metaHtml = '<div class="milestone-meta">';
      if (m.status === 'mastered' && m.masteredAt) {
        metaHtml += `<span class="milestone-meta-badge meta-done"><svg class="zi"><use href="#zi-star"/></svg> Mastered</span>`;
        metaHtml += `<span class="milestone-meta-badge meta-age">at ${ageAtDate(m.masteredAt)}</span>`;
      } else if (m.status === 'consistent' && m.consistentAt) {
        metaHtml += `<span class="milestone-meta-badge meta-done" style="background:var(--surface-sage);color:var(--tc-sage);">${zi('check')} Consistent</span>`;
        metaHtml += `<span class="milestone-meta-badge meta-age">since ${ageAtDate(m.consistentAt)}</span>`;
      } else if (m.status === 'practicing' && m.practicingAt) {
        metaHtml += `<span class="milestone-meta-badge meta-progress">${zi('hourglass')} Practicing</span>`;
        metaHtml += `<span class="milestone-meta-badge meta-age">since ${ageAtDate(m.practicingAt)}</span>`;
      } else if (m.status === 'emerging' && m.emergingAt) {
        metaHtml += `<span class="milestone-meta-badge meta-progress" style="background:var(--surface-amber);color:var(--tc-amber);">${zi('sprout')} Emerging</span>`;
        metaHtml += `<span class="milestone-meta-badge meta-age">since ${ageAtDate(m.emergingAt)}</span>`;
      }
      if (m.emergingAt && m.masteredAt) {
        metaHtml += `<span class="milestone-meta-badge meta-time">${daysBetween(m.emergingAt, m.masteredAt)}d journey</span>`;
      }
      // Evidence-based badge (if any evidence exists)
      if (m.evidenceCount > 0) {
        const confLabel = m.confidenceHigh > 0 ? m.confidenceHigh + ' high' : '';
        metaHtml += `<span class="milestone-meta-badge" style="background:var(--surface-sky);color:var(--tc-sky);">${zi('chart')} ${m.evidenceCount} evidence${confLabel ? ' · ' + confLabel : ''}</span>`;
      }
      if (m.autoStatus && m.manualStatus && m.autoStatus !== m.manualStatus) {
        metaHtml += `<span class="milestone-meta-badge" style="background:var(--surface-lav);color:var(--tc-lav);">Edit Override (engine: ${m.autoStatus})</span>`;
      }
      metaHtml += '</div>';

      const tidbitData = (m.status !== 'not_started') ? getMilestoneTidbits(m.text) : null;
      const tidbitId = 'tidbit-' + m._i;
      const evidId = 'evid-' + m._i;

      // Next stage button — hide behind override when evidence engine is active
      const nextStageIdx = stageIdx + 1;
      const nextStage = nextStageIdx < MS_STAGES.length ? MS_STAGES[nextStageIdx] : null;
      const nextMeta = nextStage ? MS_STAGE_META[nextStage] : null;
      const prevStage = stageIdx > 0 ? MS_STAGES[stageIdx - 1] : null;

      // Build evidence expansion (if evidence exists for this milestone)
      let evidHtml = '';
      if (m.evidenceCount > 0) {
        // Find the BEST keyword for this milestone (highest score wins)
        let bestKw = null, bestScore = 0;
        Object.entries(KEYWORD_TO_MILESTONE).forEach(([k, v]) => {
          if (!v) return;
          const score = milestoneKeywordScore(m.text, k);
          if (score > bestScore) { bestScore = score; bestKw = k; }
        });
        if (bestKw) {
          const evList = getMilestoneEvidence(bestKw).slice(0, 5);
          let evItems = evList.map(ev => {
            const confDot = ev.confidence === 'high' ? '●' : ev.confidence === 'medium' ? '●' : '●';
            return `<div class="al-evid-item">${ev.date} — "${escHtml((ev.text||'').substring(0, 40))}" ${confDot} ${ev.confidence}</div>`;
          }).join('');
          if (m.evidenceCount > 5) evItems += `<div class="al-evid-more">+${m.evidenceCount - 5} more</div>`;
          evidHtml = `<button class="ms-tidbit-toggle" data-action="toggleDisplayBlock" data-arg="${evidId}" data-stop="1">${zi('chart')} View evidence ▾</button>
            <div id="${evidId}" class="al-evid-box" style="display:none;">${evItems}</div>`;
        }
      }

      html += `
          <div class="milestone-item ${cls}" data-ms-idx="${m._i}">
            <div class="ms-top-row">
              <div class="milestone-check">${stageMeta.icon}</div>
              <div class="milestone-text">
                <strong>${escHtml(m.text)}</strong>
                ${metaHtml}
                ${evidHtml}
                ${tidbitData ? `<button class="ms-tidbit-toggle" data-action="toggleDisplayFlex" data-arg="${tidbitId}" data-stop="1"><svg class="zi"><use href="#zi-bulb"/></svg> Learn more ▾</button>` : ''}
              </div>
              ${m.advanced ? '<span class="badge-adv"><svg class="zi"><use href="#zi-star"/></svg> Advanced</span>' : ''}
              <div class="milestone-actions">
                ${nextStage ? `<button class="ms-action-btn" data-action="overrideMilestoneStatus" data-stop="1" data-arg="${m._i},'${nextStage}'" aria-label="Override to ${escAttr(nextMeta.label)}" title="Override: ${escAttr(nextMeta.label)}">Edit ${escHtml(nextMeta.label)}</button>` : ''}
                ${prevStage ? `<button class="ms-action-btn" data-action="overrideMilestoneStatus" data-stop="1" data-arg="${m._i},'${prevStage}'" aria-label="Move back">↩</button>` : ''}
                <button class="ms-action-btn del-ms" data-action="deleteMilestone" data-stop="1" data-arg="${m._i})" aria-label="Delete milestone">×</button>
              </div>
            </div>
            ${progressHtml}
            ${tidbitData ? `<div class="ms-tidbits" id="${tidbitId}" style="display:none;">
              <div class="ms-tidbit tidbit-unlocks"><div class="ms-tidbit-icon">${zi('star')}</div><div class="ms-tidbit-text"><strong>What this unlocks:</strong> ${tidbitData.unlocks}</div></div>
              <div class="ms-tidbit tidbit-doctor"><div class="ms-tidbit-icon">${zi('steth')}</div><div class="ms-tidbit-text"><strong>Doctor context:</strong> ${tidbitData.doctor}</div></div>
              <div class="ms-tidbit tidbit-fun"><div class="ms-tidbit-icon">${zi('sparkle')}</div><div class="ms-tidbit-text"><strong>Fun fact:</strong> ${tidbitData.funFact}</div></div>
            </div>` : ''}
          </div>`;
    });

    html += `
        </div>
      </div>`;
  });

  html += '</div>';
  list.innerHTML = html;
}

// Generic category card toggle — used by milestones, foods, tips, activities, upcoming
function toggleCatCard(cardId, itemsId) {
  const card = document.getElementById(cardId);
  const items = document.getElementById(itemsId);
  if (!items) return;
  const isOpen = items.classList.contains('open');
  if (isOpen) {
    items.classList.remove('open');
    if (card) card.classList.remove('expanded');
  } else {
    items.classList.add('open');
    if (card) card.classList.add('expanded');
  }
}

function toggleMsCat(cat) { toggleCatCard('ms-cat-' + cat, 'ms-cat-items-' + cat); }

// Expand only specific categories and highlight matching items
function expandAndHighlight(containerId, filter) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear any previous highlights
  document.querySelectorAll('.ms-pill-highlight').forEach(el => el.classList.remove('ms-pill-highlight'));

  if (containerId === 'milestoneList') {
    // Close all categories first
    document.querySelectorAll('.ms-cat-items').forEach(el => el.classList.remove('open'));
    document.querySelectorAll('.ms-cat-card').forEach(el => el.classList.remove('expanded'));

    // Find matching milestones and open their categories
    const openedCats = new Set();
    milestones.forEach((m, i) => {
      if (!filter(m, i)) return;
      // Open this milestone's category
      const cat = m.cat || 'motor';
      if (!openedCats.has(cat)) {
        const items = document.getElementById('ms-cat-items-' + cat);
        const card = document.getElementById('ms-cat-' + cat);
        if (items) { items.classList.add('open'); }
        if (card) { card.classList.add('expanded'); }
        openedCats.add(cat);
      }
      // Highlight the item
      const itemEl = document.querySelector(`[data-ms-idx="${i}"]`);
      if (itemEl) itemEl.classList.add('ms-pill-highlight');
    });
  }

  // Scroll to the first highlighted item, or fall back to container
  const firstHighlight = container.querySelector('.ms-pill-highlight');
  const scrollTarget = firstHighlight || container;
  setTimeout(() => scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function expandMilestones(filterType) {
  const filters = {
    done: m => isMsDone(m),
    in_progress: m => isMsActive(m),
    advanced: m => m.advanced && isMsDone(m),
  };
  expandAndHighlight('milestoneList', filters[filterType] || filters.done);
}

function expandUpcoming() {
  const container = document.getElementById('upcomingMilestoneList');
  if (!container) return;
  // Clear old highlights
  document.querySelectorAll('.ms-pill-highlight').forEach(el => el.classList.remove('ms-pill-highlight'));
  // Open all upcoming categories and subcats
  document.querySelectorAll('.upc-items').forEach(el => el.classList.add('open'));
  document.querySelectorAll('.upc-subcat').forEach(el => el.classList.add('expanded'));
  document.querySelectorAll('.upc-subcat-items').forEach(el => el.classList.add('open'));
  setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function expandActivities() {
  const container = document.getElementById('activityList');
  if (!container) return;
  document.querySelectorAll('.ms-pill-highlight').forEach(el => el.classList.remove('ms-pill-highlight'));
  document.querySelectorAll('.act-cat-items').forEach(el => el.classList.add('open'));
  document.querySelectorAll('.act-cat-card').forEach(el => el.classList.add('expanded'));
  setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// Expand and highlight a single milestone by its array index
function expandMilestoneByIdx(idx) {
  expandAndHighlight('milestoneList', (m, i) => i === idx);
}

// Expand and highlight a single upcoming milestone by text match
function expandUpcomingItem(text) {
  const container = document.getElementById('upcomingMilestoneList');
  if (!container) return;
  document.querySelectorAll('.ms-pill-highlight').forEach(el => el.classList.remove('ms-pill-highlight'));

  // Close all upcoming categories first
  document.querySelectorAll('.upc-items').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.upcoming-cat-card').forEach(el => el.classList.remove('expanded'));
  document.querySelectorAll('.upc-subcat').forEach(el => el.classList.remove('expanded'));

  // Find the matching item by text
  const allItems = container.querySelectorAll('.upcoming-item');
  let matched = false;
  allItems.forEach(item => {
    const strong = item.querySelector('strong');
    if (!strong || matched) return;
    if (strong.textContent.trim().toLowerCase().includes(text.toLowerCase().substring(0, 20))) {
      matched = true;
      item.classList.add('ms-pill-highlight');

      // Walk up and open each parent container
      let el = item.parentElement;
      while (el && el !== container) {
        // .upc-subcat needs .expanded (controls .upc-subcat-items visibility)
        if (el.classList.contains('upc-subcat')) el.classList.add('expanded');
        // .upc-items needs .open
        if (el.classList.contains('upc-items')) el.classList.add('open');
        // .upcoming-cat-card needs .expanded
        if (el.classList.contains('upcoming-cat-card')) el.classList.add('expanded');
        el = el.parentElement;
      }
      // The upcoming-cat-card is a sibling of upc-items, not a parent
      // Find it by going to the upc-items' previousElementSibling
      const upcItems = item.closest('.upc-items');
      if (upcItems && upcItems.previousElementSibling && upcItems.previousElementSibling.classList.contains('upcoming-cat-card')) {
        upcItems.previousElementSibling.classList.add('expanded');
      }

      setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  });
  if (!matched) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Expand only one activity category by type
function expandActivityType(type) {
  const container = document.getElementById('activityList');
  if (!container) return;
  document.querySelectorAll('.ms-pill-highlight').forEach(el => el.classList.remove('ms-pill-highlight'));
  document.querySelectorAll('.act-cat-items').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.act-cat-card').forEach(el => el.classList.remove('expanded'));
  const items = document.getElementById('act-items-' + type);
  const card = document.getElementById('act-cat-' + type);
  if (items) items.classList.add('open');
  if (card) card.classList.add('expanded');
  setTimeout(() => (card || container).scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

// Override milestone status (manual override — used when evidence engine is active)
function overrideMilestoneStatus(i, newStatus) {
  const m = milestones[i];
  if (newStatus === 'not_started') {
    // Reverting to not_started = clear override, let engine decide
    m.manualStatus = null;
    m.manualAt = null;
  } else {
    m.manualStatus = newStatus;
    m.manualAt = today();
  }
  // Call existing setMilestoneStatus for date stamps and rendering
  setMilestoneStatus(i, newStatus);
}

function setMilestoneStatus(i, newStatus) {
  const expandedMsCats = [];
  document.querySelectorAll('.ms-cat-items.open').forEach(el => expandedMsCats.push(el.id));
  const expandedUpcCats = [];
  document.querySelectorAll('.upc-items.open').forEach(el => expandedUpcCats.push(el.id));
  const expandedUpcSubs = [];
  document.querySelectorAll('.upc-subcat.expanded').forEach(el => expandedUpcSubs.push(el.id));

  const m = milestones[i];
  const todayStr = today();
  m.status = newStatus;

  // Set date stamps for each stage (only if not already set)
  if (newStatus === 'emerging') {
    m.emergingAt = m.emergingAt || todayStr;
  } else if (newStatus === 'practicing') {
    m.emergingAt = m.emergingAt || todayStr;
    m.practicingAt = m.practicingAt || todayStr;
  } else if (newStatus === 'consistent') {
    m.emergingAt = m.emergingAt || todayStr;
    m.practicingAt = m.practicingAt || todayStr;
    m.consistentAt = m.consistentAt || todayStr;
  } else if (newStatus === 'mastered') {
    m.emergingAt = m.emergingAt || todayStr;
    m.practicingAt = m.practicingAt || todayStr;
    m.consistentAt = m.consistentAt || todayStr;
    m.masteredAt = todayStr;
  } else if (newStatus === 'not_started') {
    m.emergingAt = null; m.practicingAt = null; m.consistentAt = null; m.masteredAt = null;
  }

  // Log to milestone timeline
  logMilestoneEvent(m.text, newStatus, todayStr);

  // Legacy compat fields
  m.doneAt = m.masteredAt || null;
  m.inProgressAt = m.emergingAt || null;

  renderMilestones();
  renderUpcomingMilestones();
  renderActivities();
  renderHomeActivity();
  renderMilestoneTimeline();

  // Restore expanded state
  expandedMsCats.forEach(id => {
    const items = document.getElementById(id);
    const card = document.getElementById(id.replace('ms-cat-items-', 'ms-cat-'));
    if (items) items.classList.add('open');
    if (card) card.classList.add('expanded');
  });
  expandedUpcCats.forEach(id => {
    const items = document.getElementById(id);
    const card = document.getElementById(id.replace('upc-items-', 'upc-cat-'));
    if (items) items.classList.add('open');
    if (card) card.classList.add('expanded');
  });
  expandedUpcSubs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('expanded');
  });
}

// Milestone timeline log
function logMilestoneEvent(text, stage, date) {
  const log = load('ziva_milestone_log', []);
  log.unshift({ text, stage, date, ts: new Date().toISOString() });
  if (log.length > 200) log.length = 200;
  save('ziva_milestone_log', log);
}

// ageAtDate, daysBetween → migrated to core.js
function deleteMilestone(i) {
  const expandedMsCats = [];
  document.querySelectorAll('.ms-cat-items.open').forEach(el => expandedMsCats.push(el.id));
  milestones.splice(i,1);
  renderMilestones();
  renderUpcomingMilestones();
  expandedMsCats.forEach(id => {
    const items = document.getElementById(id);
    const card = document.getElementById(id.replace('ms-cat-items-', 'ms-cat-'));
    if (items) items.classList.add('open');
    if (card) card.classList.add('expanded');
  });
}
let _milestoneCat = 'motor';
function setMilestoneCat(cat) {
  _milestoneCat = cat;
  ['motor','language','social','cognitive'].forEach(c => {
    const btn = document.getElementById('mcat-' + c);
    btn.className = c === cat ? 'rtog active-ok' : 'rtog';
  });
}
function openMilestoneModal() {
  document.getElementById('mText').value = '';
  document.getElementById('mAdv').checked = false;
  setMilestoneCat('motor');
  activateBtn('milestoneSaveBtn', false);
  openModal('milestoneModal');
}
function addMilestone() {
  const t = document.getElementById('mText').value.trim();
  if (!t) return;
  milestones.push({ text:t, status:'mastered', advanced:document.getElementById('mAdv').checked, masteredAt:today(), emergingAt:today(), cat:_milestoneCat, doneAt:today(), inProgressAt:today() });
  logMilestoneEvent(t, 'mastered', today());
  closeModal('milestoneModal');
  renderMilestones();
  renderUpcomingMilestones();
  renderActivities();
}

/* ── Category Progress Wheels ── */
function renderCategoryWheels() {
  const el = document.getElementById('msCatWheels');
  if (!el) return;

  const catMeta = {
    motor:     { icon:zi('run'), label:'Motor',     color:'var(--tc-sage)' },
    language:  { icon:zi('chat'), label:'Language',   color:'#3a7090' },
    social:    { icon:zi('handshake'), label:'Social',     color:'#966525' },
    cognitive: { icon:zi('brain'), label:'Cognitive',  color:'var(--tc-lav)' },
  };

  const R = 22, C = 2 * Math.PI * R;

  // Compute evidence counts per domain from activityLog
  const domainEvidence = { motor: 0, language: 0, social: 0, cognitive: 0 };
  const domainDays = { motor: new Set(), language: new Set(), social: new Set(), cognitive: new Set() };
  Object.entries(activityLog).forEach(([dateStr, entries]) => {
    if (!Array.isArray(entries)) return;
    entries.forEach(e => {
      (e.domains || []).forEach(d => {
        if (domainEvidence[d] !== undefined) {
          domainEvidence[d] += (e.evidence || []).length;
          domainDays[d].add(dateStr);
        }
      });
    });
  });

  let html = '';
  ['motor','language','social','cognitive'].forEach(cat => {
    const meta = catMeta[cat];
    const catMs = milestones.filter(m => (m.cat || 'motor') === cat);
    const avgPct = catMs.length > 0 ? Math.round(catMs.reduce((s, m) => s + (MS_STAGE_META[m.status]?.pct || 0), 0) / catMs.length) : 0;
    const fill = C - (avgPct / 100) * C;
    const evCount = domainEvidence[cat];
    const dayCount = domainDays[cat].size;
    const evidLabel = evCount > 0 ? evCount + ' ev · ' + dayCount + 'd' : '';

    html += '<div class="ms-cat-wheel" data-action-mcat="' + cat + '">' +
      '<svg viewBox="0 0 50 50">' +
        '<circle class="mcw-track" cx="25" cy="25" r="' + R + '"/>' +
        '<circle class="mcw-fill" cx="25" cy="25" r="' + R + '" stroke="' + meta.color + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + fill + '"/>' +
      '</svg>' +
      '<div class="ms-cat-wheel-pct" style="color:' + meta.color + ';">' + avgPct + '%</div>' +
      '<div class="ms-cat-wheel-label">' + meta.label + '</div>' +
      (evidLabel ? '<div class="ms-cat-wheel-ev">' + evidLabel + '</div>' : '') +
    '</div>';
  });
  el.innerHTML = html;
}

/* ── Regression Detection ── */
function renderRegressionAlerts() {
  const el = document.getElementById('msRegressionAlerts');
  if (!el) return;

  const now = Date.now();
  const REGRESSION_DAYS = 30;
  const regressions = [];

  milestones.forEach((m, i) => {
    if (m.status !== 'consistent' && m.status !== 'mastered') return;

    // Evidence-based regression: check if activity log has gone quiet for this milestone
    let bestKw = null, bestScore = 0;
    Object.entries(KEYWORD_TO_MILESTONE).forEach(([k, v]) => {
      if (!v) return;
      const score = milestoneKeywordScore(m.text, k);
      if (score > bestScore) { bestScore = score; bestKw = k; }
    });

    if (bestKw && m.evidenceCount > 0) {
      // Use evidence-based regression detection
      const isRegressing = checkEvidenceRegression(bestKw, m.autoStatus || m.status);
      if (isRegressing) {
        const evidence = getMilestoneEvidence(bestKw);
        const lastEvDate = evidence.length > 0 ? evidence[0].date : null;
        const daysSince = lastEvDate ? Math.round((now - new Date(lastEvDate).getTime()) / 86400000) : 99;
        regressions.push({ idx: i, text: m.text, status: m.status, daysSince, stageDate: lastEvDate, source: 'evidence' });
        return; // Don't double-count
      }
    }

    // Fallback: legacy regression check based on stage date
    const stageDate = m.status === 'mastered' ? m.masteredAt : m.consistentAt;
    if (!stageDate) return;
    const daysSince = Math.round((now - new Date(stageDate).getTime()) / 86400000);
    if (daysSince >= REGRESSION_DAYS) {
      regressions.push({ idx: i, text: m.text, status: m.status, daysSince, stageDate, source: 'date' });
    }
  });

  if (regressions.length === 0) { el.innerHTML = ''; return; }

  let html = '';
  regressions.slice(0, 5).forEach(r => {
    const stageMeta = MS_STAGE_META[r.status];
    const sourceLabel = r.source === 'evidence' ? 'No new evidence for ' + r.daysSince + 'd' : 'Last updated ' + r.daysSince + 'd ago';
    html += '<div class="ms-regression-alert" data-action="confirmRegressionCheck" data-arg="' + r.idx + '">' +
      '<span class="ms-regr-icon">' + zi('hourglass') + '</span>' +
      '<div class="ms-regr-body">' +
        '<div class="ms-regr-title">Still ' + stageMeta.label.toLowerCase() + '? "' + escHtml(r.text) + '"</div>' +
        '<div class="ms-regr-meta">' + sourceLabel + ' · Tap to confirm or adjust</div>' +
      '</div>' +
      '<span class="collapse-chevron">›</span>' +
    '</div>';
  });
  el.innerHTML = html;
}

function confirmRegressionCheck(idx) {
  const m = milestones[idx];
  const stageMeta = MS_STAGE_META[m.status];
  const stages = MS_STAGES.filter(s => s !== 'not_started');
  const options = stages.map(s => {
    const sm = MS_STAGE_META[s];
    return `<button class="ms-action-btn flex-1"  onclick="setMilestoneStatus(${idx},'${s}');this.closest('.confirm-overlay').remove();">${sm.icon} ${sm.label}</button>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
  overlay.innerHTML = `<div class="modal" style="max-width:360px;">
    <h3>Update: ${escHtml(m.text)}</h3>
    <p style="font-size:var(--fs-sm);color:var(--mid);margin-bottom:12px;">Currently ${stageMeta.icon} ${stageMeta.label}. Where is Ziva now?</p>
    <div style="display:flex;gap:var(--sp-8);flex-wrap:wrap;">${options}</div>
    <div class="modal-btns" style="margin-top:12px;">
      <button class="btn btn-ghost" onclick="this.closest('.confirm-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/* ── Milestone Timeline ── */
function renderMilestoneTimeline() {
  const el = document.getElementById('msTimelineContent');
  if (!el) return;

  const log = load('ziva_milestone_log', []);

  // Also build timeline from milestone date stamps if log is empty
  let events = log.slice(0, 30);

  // If no log exists yet, reconstruct from milestone data
  if (events.length === 0) {
    milestones.forEach(m => {
      if (m.emergingAt) events.push({ text: m.text, stage: 'emerging', date: m.emergingAt, ts: m.emergingAt });
      if (m.practicingAt) events.push({ text: m.text, stage: 'practicing', date: m.practicingAt, ts: m.practicingAt });
      if (m.consistentAt) events.push({ text: m.text, stage: 'consistent', date: m.consistentAt, ts: m.consistentAt });
      if (m.masteredAt) events.push({ text: m.text, stage: 'mastered', date: m.masteredAt, ts: m.masteredAt });
    });
    events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    events = events.slice(0, 30);
  }

  if (events.length === 0) {
    el.innerHTML = '<div class="t-sub-light" style="padding:8px 0;">No milestone events yet. Progress milestones to see the journey here.</div>';
    return;
  }

  let html = '<div class="ms-timeline">';
  events.forEach(ev => {
    const sm = MS_STAGE_META[ev.stage] || MS_STAGE_META.not_started;
    const dateStr = ev.date ? formatDate(ev.date) : '';
    const ageStr = ev.date ? ageAtDate(ev.date) : '';
    html += `<div class="ms-tl-item">
      <div class="ms-tl-dot" style="background:${sm.color};color:white;">${sm.icon}</div>
      <div class="ms-tl-body">
        <div class="ms-tl-text">${escHtml(ev.text)} → ${sm.label}</div>
        <div class="ms-tl-meta">${dateStr} · ${ageStr}</div>
      </div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

// ─── Recent Evidence Feed (last 7 days of logged activities — grouped by day) ───
function renderRecentEvidence() {
  const feedEl = document.getElementById('recentEvidenceFeed');
  if (!feedEl) return;

  // Gather last 7 days of activity entries
  const now = new Date();
  const dayGroups = {};
  for (let d = 0; d < 7; d++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    const dateStr = toDateStr(dt);
    const dayEntries = Array.isArray(activityLog[dateStr]) ? activityLog[dateStr] : [];
    if (dayEntries.length > 0) {
      dayGroups[dateStr] = dayEntries.map(e => ({ ...e, _date: dateStr }));
    }
  }

  const dayKeys = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));
  if (dayKeys.length === 0) {
    feedEl.style.display = 'none';
    return;
  }

  feedEl.style.display = '';
  const domainIcons = { motor: zi('run'), language: zi('chat'), social: zi('handshake'), cognitive: zi('brain'), sensory: zi('sparkle') };
  const todayStr = today();
  const yesterdayStr = toDateStr(new Date(Date.now() - 86400000));

  let html = '<div class="micro-label text-center mb-4 fw-600" >Recent Activity Evidence</div>';

  dayKeys.forEach((dateStr, dayIdx) => {
    const entries = dayGroups[dateStr].sort((a, b) => (b.ts || b._date).localeCompare(a.ts || a._date));
    const dayLabel = dateStr === todayStr ? 'Today' : dateStr === yesterdayStr ? 'Yesterday' : formatDate(dateStr);

    // Day summary: count by domain
    const domainCounts = {};
    let totalEvidence = 0;
    entries.forEach(e => {
      (e.domains || []).forEach(d => { domainCounts[d] = (domainCounts[d] || 0) + 1; });
      totalEvidence += (e.evidence || []).length;
    });
    const summaryChips = Object.entries(domainCounts).map(([d, c]) =>
      '<span class="al-feed-summary-chip al-chip al-chip-' + d + '">' + (domainIcons[d] || '') + ' ' + d + ' ×' + c + '</span>'
    ).join('');

    const dayBodyId = 'al-feed-day-' + dayIdx;
    const isToday = dateStr === todayStr;

    html += '<div class="al-feed-day">';
    html += '<div class="al-feed-day-header ptr" data-action="toggleDisplayBlock" data-arg="' + dayBodyId + '">' +
      dayLabel + ' — ' + entries.length + ' activit' + (entries.length === 1 ? 'y' : 'ies') + ' · ' + totalEvidence + ' evidence' +
      '<span style="float:right;">▾</span></div>';
    html += '<div class="al-feed-summary">' + summaryChips + '</div>';

    html += '<div id="' + dayBodyId + '" class="al-feed-list" style="display:' + (isToday ? 'block' : 'none') + ';">';
    entries.forEach(e => {
      const domainChips = (e.domains || []).map(d =>
        '<span class="al-chip al-chip-' + d + '">' + (domainIcons[d] || '') + ' ' + d + '</span>'
      ).join(' ');
      const evidCount = (e.evidence || []).length;
      const timeStr = e.ts ? new Date(e.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      const durStr = e.duration ? e.duration + ' min' : 'obs';
      html += '<div class="al-feed-entry">' +
        '<div class="al-feed-time">' + timeStr + '</div>' +
        '<div class="al-feed-body">' +
          '<div class="al-feed-text">' + escHtml(e.text) + '</div>' +
          '<div class="al-feed-chips">' + domainChips + '</div>' +
          _renderAttribution(e) +
        '</div>' +
        '<div class="al-feed-meta">' + durStr + ' · ' + evidCount + ' ev</div>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
  });

  feedEl.innerHTML = html;
}

// ─────────────────────────────────────────
function renderVisits() {
  save(KEYS.visits, visits);
  const list = document.getElementById('visitList');
  list.innerHTML = '';
  if (!visits.length) {
    list.innerHTML = '<div class="t-sub-light py-4">No visits recorded yet.</div>';
    return;
  }
  const sorted = [...visits].map((v,i)=>({...v,_i:i})).sort((a,b)=>new Date(b.date)-new Date(a.date));
  sorted.forEach(v => {
    const div = document.createElement('div');
    div.className = 'visit-item';
    div.innerHTML = `
      <div class="visit-header">
        <div>
          <div class="visit-date">${formatDate(v.date)}</div>
          ${v.doctor ? `<div class="visit-doctor">${zi('steth')} ${escHtml(v.doctor)}</div>` : ''}
          ${v.reason ? `<div class="visit-doctor">${zi('list')} ${escHtml(v.reason)}</div>` : ''}
          ${_renderAttribution(v)}
        </div>
        <div class="visit-actions">
          <button class="note-btn del-note-btn" data-action="deleteVisit" data-arg="${v._i}">&times;</button>
        </div>
      </div>
      ${v.notes ? `<div class="visit-notes-text">${escHtml(v.notes)}</div>` : ''}
    `;
    list.appendChild(div);
  });
}

function toggleVisitForm() {
  const f = document.getElementById('visitForm');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  if (f.style.display === 'flex') {
    document.getElementById('visitDate').value = today();
    activateBtn('visitSaveBtn', true);
  }
}

function saveVisit() {
  const date   = document.getElementById('visitDate').value;
  const doctor = document.getElementById('visitDoctor').value.trim();
  const reason = document.getElementById('visitReason').value.trim();
  const notes  = document.getElementById('visitNotes').value.trim();
  if (!date) return;
  visits.push({ date, doctor, reason, notes });
  document.getElementById('visitDoctor').value = '';
  document.getElementById('visitReason').value = '';
  document.getElementById('visitNotes').value  = '';
  toggleVisitForm();
  renderVisits();
}

function deleteVisit(i) {
  confirmAction('Delete this visit record?', () => {
    visits.splice(i,1);
    renderVisits();
  });
}

// ─────────────────────────────────────────
// MEDICATION LOG (History tab)
// ─────────────────────────────────────────
function renderMedLog() {
  const container = document.getElementById('medLogEntries');
  if (!container) return;
  container.innerHTML = '';

  // Gather all dated entries from medChecks (skip _trackingSince key)
  const entries = [];
  Object.entries(medChecks).forEach(([dateKey, val]) => {
    if (dateKey.startsWith('_')) return;
    if (typeof val !== 'object') return;
    Object.entries(val).forEach(([medName, status]) => {
      entries.push({ date: dateKey, name: medName, status });
    });
  });

  // Sort newest first
  entries.sort((a, b) => (b.date||'').localeCompare(a.date||'') || (a.name||'').localeCompare(b.name||''));


  if (entries.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No medication log entries yet. Mark meds as done/skipped on the Home tab.</div>';
    return;
  }

  // Group by month
  const months = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!months[mk]) months[mk] = [];
    months[mk].push(e);
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let html = '';

  Object.entries(months).forEach(([monthKey, items]) => {
    const [year, mon] = monthKey.split('-');
    const monthLabel = `${monthNames[parseInt(mon) - 1]} ${year}`;
    const monthId = 'ml-' + monthKey;
    const givenCount = items.filter(e => e.status.startsWith('done')).length;
    const skippedCount = items.filter(e => e.status === 'skipped').length;

    html += `<div class="history-month" id="${monthId}">
      <div class="history-month-header" data-action="toggleHistoryMonth" data-arg="${monthId}" style="background:linear-gradient(135deg,var(--sky-light),var(--sky-light));border-color:rgba(168,207,224,0.4);">
        <div class="hm-icon">${zi('pill')}</div>
        <div class="hm-info">
          <div class="hm-name">${monthLabel}</div>
          <div class="hm-count">${givenCount} given · ${skippedCount} skipped · ${items.length} total</div>
        </div>
        <div class="hm-chevron">▾</div>
      </div>
      <div class="hm-days" style="border-color:rgba(168,207,224,0.4);background:rgba(232,244,250,0.2);">`;

    // Group by date within month
    const byDate = {};
    items.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    Object.entries(byDate).forEach(([dateKey, dayItems]) => {
      const dayNum = new Date(dateKey).getDate();
      const dayName = new Date(dateKey).toLocaleDateString('en-IN', { weekday: 'short' });

      html += `<div style="padding:6px 8px;border-radius:var(--r-md);background:var(--glass);margin-bottom:4px;border-left:var(--accent-w) solid var(--sky);">`;
      html += `<div style=""font-weight:600;font-size:var(--fs-sm);color:var(--tc-sky);margin-bottom:4px;">${dayName}, ${dayNum} ${monthNames[parseInt(mon) - 1]}</div>`;

      dayItems.forEach(e => {
        const isDone = e.status.startsWith('done');
        const timeStr = isDone ? e.status.replace('done:', '') : '';
        const icon = isDone ? zi('check') : '⏭️';
        const label = isDone ? 'Given' : 'Skipped';
        const color = isDone ? '#3a7060' : '#926030';
        const timePart = timeStr && timeStr !== 'late' ? ` at ${timeStr}` : timeStr === 'late' ? ' (logged late)' : '';

        html += `
          <div style="display:flex;align-items:center;gap:var(--sp-8);padding:3px 0;font-size:var(--fs-base);">
            <span>${icon}</span>
            <span style="flex:1;color:var(--text);font-weight:600;">${escHtml(e.name)}</span>
            <span style="font-size:var(--fs-sm);color:${color};font-weight:600;">${label}${timePart}</span>
          </div>`;
      });

      html += `</div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

// ─────────────────────────────────────────

// FEEDING
// ─────────────────────────────────────────
function initFeeding() {
  const t = today();
  document.getElementById('feedingDate').value = t;
  renderFoodChips();
  loadFeedingDay();
  renderDietStats();
}

function renderDietStats() {
  const el = document.getElementById('dietStats');
  const todayD = new Date();
  const solidsDays = Math.floor((todayD - SOLIDS_START) / 86400000);
  const totalFoods = foods.length;
  const watchFoods = foods.filter(f => f.reaction === 'watch').length;

  // Most frequent food this week
  const freqs = {};
  foods.forEach(f => { freqs[f.name] = getFoodFrequency(f.name); });
  const sorted = Object.entries(freqs).sort((a,b) => b[1] - a[1]);
  const topFood = sorted[0] ? sorted[0] : ['—', 0];

  // Iron count this week
  const ironFoods = ['ragi','masoor dal','beetroot','beans','moong dal','spinach','bajra','jowar','poha','toor dal'];
  const ironCount = countFoodsInDiary(feedingData, ironFoods);

  // Days logged this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const daysLogged = Object.keys(feedingData).filter(d => new Date(d) >= weekAgo).length;

  const ironAlert = ironCount < 4;

  el.innerHTML = `
    <div class="diet-stat ds-sage" data-scroll-to="foodsGrid" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-sprout"/></svg></div>
      <div class="diet-stat-val">${solidsDays}</div>
      <div class="diet-stat-label">Days on solids</div>
    </div>
    <div class="diet-stat ds-sky" data-scroll-to="foodsGrid" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-spoon"/></svg></div>
      <div class="diet-stat-val">${totalFoods}</div>
      <div class="diet-stat-label">Foods introduced</div>
    </div>
    <div class="diet-stat ds-peach" data-scroll-to="foodsGrid" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-star"/></svg></div>
      <div class="diet-stat-val ds-val-sm">${topFood[0]}</div>
      <div class="diet-stat-label">${topFood[1]}×/wk · most frequent</div>
    </div>
    <div class="diet-stat ds-lav" data-tab="history">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-list"/></svg></div>
      <div class="diet-stat-val">${daysLogged}/7</div>
      <div class="diet-stat-label">Days logged this wk</div>
    </div>
    <div class="diet-stat ${ironAlert ? 'alert' : 'ds-rose'}" data-scroll-to="tipsList" data-scroll-block="start">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-dot-red"/></svg></div>
      <div class="diet-stat-val">${ironCount}/7</div>
      <div class="diet-stat-label">Iron days this wk</div>
    </div>
    ${watchFoods > 0 ? `<div class="diet-stat alert">
      <div class="diet-stat-icon"><svg class="zi"><use href="#zi-warn"/></svg></div>
      <div class="diet-stat-val">${watchFoods}</div>
      <div class="diet-stat-label">Foods to watch</div>
    </div>` : ''}
  `;
  renderDomainHero('diet');
}

// ─────────────────────────────────────────
// FEEDING HISTORY
// ─────────────────────────────────────────
function renderFeedingHistory() {
  const container = document.getElementById('historyEntries');
  const statsEl = document.getElementById('historyStats');
  container.innerHTML = '';

  const sorted = Object.keys(feedingData).sort((a,b) => new Date(b) - new Date(a));
  const filledDays = sorted.filter(d => {
    const e = feedingData[d];
    return e.breakfast || e.lunch || e.dinner || e.snack;
  });


  // History stats
  if (statsEl) {
    const totalMeals = filledDays.reduce((sum, d) => {
      const e = feedingData[d];
      return sum + (e.breakfast ? 1 : 0) + (e.lunch ? 1 : 0) + (e.dinner ? 1 : 0) + (e.snack ? 1 : 0);
    }, 0);
    const firstDay = filledDays.length ? filledDays[filledDays.length - 1] : null;
    const streak = calcLoggingStreak();

    const doneMs = milestones.filter(m => isMsDone(m));
    const pastVacc = vaccData.filter(v => !v.upcoming).length;
    const growthEntries = growthData.length;
    const latestDone = doneMs.filter(m => m.doneAt).sort((a,b) => new Date(b.doneAt) - new Date(a.doneAt));
    const latestMs = latestDone[0] || doneMs[doneMs.length - 1];

    statsEl.innerHTML = `
      <div class="diet-stat ds-peach" data-scroll-to="historyEntries" data-scroll-block="start">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-bowl"/></svg></div>
        <div class="diet-stat-val">${filledDays.length}</div>
        <div class="diet-stat-label">Meals</div>
      </div>
      <div class="diet-stat ds-lav" data-scroll-to="vaccHistBody" data-scroll-block="start">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-syringe"/></svg></div>
        <div class="diet-stat-val">${pastVacc}</div>
        <div class="diet-stat-label">Vaccines</div>
      </div>
      <div class="diet-stat ds-sage" data-scroll-to="milestoneHistory" data-scroll-block="start">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-star"/></svg></div>
        <div class="diet-stat-val">${doneMs.length}</div>
        <div class="diet-stat-label">Milestones</div>
      </div>
      <div class="diet-stat ds-rose" data-scroll-to="growthHistoryCard" data-scroll-block="start">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-chart"/></svg></div>
        <div class="diet-stat-val">${growthEntries}</div>
        <div class="diet-stat-label">Growth</div>
      </div>
    `;
  }

  if (filledDays.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No entries yet. Save meals from the Diet tab to see history here.</div>';
    return;
  }

  // Group by month
  const months = {};
  filledDays.forEach(dateKey => {
    const d = new Date(dateKey);
    const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push(dateKey);
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let html = '';

  Object.entries(months).forEach(([monthKey, days]) => {
    const [year, mon] = monthKey.split('-');
    const monthLabel = `${monthNames[parseInt(mon) - 1]} ${year}`;
    const monthId = 'hm-' + monthKey;

    html += `<div class="history-month" id="${monthId}">
      <div class="history-month-header" data-action="toggleHistoryMonth" data-arg="${monthId}">
        <div class="hm-icon">${zi('clock')}</div>
        <div class="hm-info">
          <div class="hm-name">${monthLabel}</div>
          <div class="hm-count">${days.length} days · ${days.reduce((s, d) => {
            const e = feedingData[d];
            return s + (e.breakfast?1:0) + (e.lunch?1:0) + (e.dinner?1:0) + (e.snack?1:0);
          }, 0)} meals</div>
        </div>
        <div class="hm-chevron">▾</div>
      </div>
      <div class="hm-days">`;

    days.forEach(dateKey => {
      const entry = feedingData[dateKey];
      const dayId = 'hd-' + dateKey;
      const dayNum = new Date(dateKey).getDate();
      const dayName = new Date(dateKey).toLocaleDateString('en-IN', { weekday:'short' });

      // Build a short summary for the collapsed view
      const parts = [entry.breakfast, entry.lunch, entry.dinner, entry.snack].filter(Boolean);
      const summary = parts.join(' · ');
      const mealCount = parts.length;

      const bInsight = entry.breakfast ? getMealInsight(entry.breakfast) : null;
      const lInsight = entry.lunch ? getMealInsight(entry.lunch) : null;
      const dInsight = entry.dinner ? getMealInsight(entry.dinner) : null;
      const sInsight = entry.snack ? getMealInsight(entry.snack) : null;

      html += `
        <div class="history-day" id="${dayId}">
          <div class="history-day-header" data-action="toggleHistoryDay" data-arg="${dayId}">
            <div class="hd-date">${dayName}, ${dayNum}</div>
            <div class="hd-summary">${mealCount} meal${mealCount > 1 ? 's' : ''} — ${summary}</div>
            <div class="hd-chevron">▾</div>
          </div>
          <div class="hd-content">
            ${entry.breakfast ? `<div class="history-meal-row"><span class="history-meal-label">${zi('sun')} Break.${entry.breakfast_time ? ' <span class="t-xs fw-400-op" >' + formatTimeShort(entry.breakfast_time) + '</span>' : ''}</span><span class="history-meal-val">${escHtml(entry.breakfast)}</span> ${_miRenderChip(_miGetIntake(dateKey, 'breakfast'))}</div>` : ''}
            ${bInsight ? `<div class="history-meal-insight"><span class="hmi-icon">${zi('sparkle')}</span><span>${bInsight}</span></div>` : ''}
            ${entry.lunch ? `<div class="history-meal-row"><span class="history-meal-label">${zi('sun')} Lunch${entry.lunch_time ? ' <span class="t-xs fw-400-op" >' + formatTimeShort(entry.lunch_time) + '</span>' : ''}</span><span class="history-meal-val">${escHtml(entry.lunch)}</span> ${_miRenderChip(_miGetIntake(dateKey, 'lunch'))}</div>` : ''}
            ${lInsight ? `<div class="history-meal-insight"><span class="hmi-icon">${zi('sparkle')}</span><span>${lInsight}</span></div>` : ''}
            ${entry.dinner ? `<div class="history-meal-row"><span class="history-meal-label">${zi('moon')} Dinner${entry.dinner_time ? ' <span class="t-xs fw-400-op" >' + formatTimeShort(entry.dinner_time) + '</span>' : ''}</span><span class="history-meal-val">${escHtml(entry.dinner)}</span> ${_miRenderChip(_miGetIntake(dateKey, 'dinner'))}</div>` : ''}
            ${dInsight ? `<div class="history-meal-insight"><span class="hmi-icon">${zi('sparkle')}</span><span>${dInsight}</span></div>` : ''}
            ${entry.snack ? `<div class="history-meal-row"><span class="history-meal-label">${zi('spoon')} Snack${entry.snack_time ? ' <span class="t-xs fw-400-op" >' + formatTimeShort(entry.snack_time) + '</span>' : ''}</span><span class="history-meal-val">${escHtml(entry.snack)}</span></div>` : ''}
            ${sInsight ? `<div class="history-meal-insight"><span class="hmi-icon">${zi('sparkle')}</span><span>${sInsight}</span></div>` : ''}
            <div class="fx g8 fx-end mt-8">
              <button class="ms-action-btn" data-action="navFeedDay" data-stop="1" data-arg="${dateKey}">Edit</button>
              <button class="ms-action-btn del-ms" data-action="deleteFeedingEntry" data-arg="${dateKey}" data-stop="1">&times; Delete</button>
            </div>
          </div>
        </div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function toggleHistoryMonth(id) {
  document.getElementById(id)?.classList.toggle('expanded');
}
function toggleHistoryDay(id) {
  document.getElementById(id)?.classList.toggle('expanded');
}

function calcLoggingStreak() {
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (entry && (entry.breakfast || entry.lunch || entry.dinner || entry.snack)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function deleteFeedingEntry(dateKey) {
  confirmAction('Delete feeding entry for this day?', () => {
    delete feedingData[dateKey];
    save(KEYS.feeding, feedingData);
    renderFeedingHistory();
  });
}

// ─────────────────────────────────────────
// FOODS INTRODUCED
// ─────────────────────────────────────────

// Count how many times a food appears in the last 7 days of feeding diary
function getFoodFrequency(foodName) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const name = foodName.toLowerCase();
  let count = 0;
  Object.entries(feedingData).forEach(([dateKey, entry]) => {
    if (new Date(dateKey) < cutoff) return;
    const allMeals = [entry.breakfast, entry.lunch, entry.dinner, entry.snack].join(' ').toLowerCase();
    if (allMeals.includes(name)) count++;
  });
  return count;
}

function freqLabel(count) {
  if (count >= 4) return { label:'Frequent', cls:'freq-high' };
  if (count >= 2) return { label:'Moderate', cls:'freq-medium' };
  if (count === 1) return { label:'Rare', cls:'freq-low' };
  return { label:'Not this week', cls:'freq-none' };
}
// @@INSERT_DATA_BLOCK_8@@

const _foodTaxFlat = [];
Object.entries(FOOD_TAX).forEach(([pid, parent]) => {
  Object.entries(parent.subs).forEach(([sid, sub]) => {
    sub.keys.forEach(k => _foodTaxFlat.push({ key: k, pid, sid }));
  });
});
// @@INSERT_DATA_BLOCK_9@@

function _categorizeFoods() {
  const cachedCats = JSON.parse(localStorage.getItem('ziva_food_categories') || '{}');
  const grouped = {};
  Object.keys(FOOD_TAX).forEach(p => {
    grouped[p] = {};
    Object.keys(FOOD_TAX[p].subs).forEach(s => { grouped[p][s] = []; });
  });
  foods.forEach((f, i) => {
    const lower = f.name.toLowerCase().trim();
    const base = _baseFoodName(lower);
    let placed = false;
    // Try exact key match first, then base food match, then substring
    for (const { key, pid, sid } of _foodTaxFlat) {
      if (lower === key || base === key || lower.includes(key) || key.includes(base)) {
        grouped[pid][sid].push({ ...f, _i: i });
        placed = true;
        break;
      }
    }
    if (!placed && cachedCats[lower]) {
      const cat = cachedCats[lower];
      if (grouped[cat]) {
        const firstSub = Object.keys(grouped[cat])[0];
        if (firstSub) { grouped[cat][firstSub].push({ ...f, _i: i }); placed = true; }
      }
    }
    // Fallback: try classifyFoodToGroup which uses broader matching
    if (!placed) {
      const cls = classifyFoodToGroup(lower) || classifyFoodToGroup(base);
      if (cls && grouped[cls.group]) {
        const firstSub = Object.keys(grouped[cls.group])[0];
        if (firstSub) { grouped[cls.group][firstSub].push({ ...f, _i: i }); placed = true; }
      }
    }
    // Final fallback: genuinely unknown — skip rather than misclassify into spices
    if (!placed) {
      // Put in best-guess group or first group of the taxonomy
      const guess = _guessGroupFromNutrition(lower);
      if (guess && grouped[guess]) {
        const firstSub = Object.keys(grouped[guess])[0];
        if (firstSub) grouped[guess][firstSub].push({ ...f, _i: i });
      }
    }
  });
  return grouped;
}
// @@INSERT_DATA_BLOCK_10@@
// _baseFoodName, normalizeFoodName → migrated to core.js

// Guess food group from nutrition tags
function _guessGroupFromNutrition(name) {
  const nut = getNutrition(name) || getNutrition(_baseFoodName(name));
  if (!nut) return null;
  const tags = nut.tags || [];
  if (tags.includes('fermented') || tags.includes('gut-health')) return 'grains'; // idli, dosa
  if (tags.includes('healthy-fats') || tags.includes('omega-3')) return 'nuts';
  if (tags.includes('hydrating') || tags.includes('cooling')) return 'vegs';
  if (tags.includes('bone-health') && tags.includes('protein-rich')) return 'dairy';
  if (tags.includes('iron-rich') || tags.includes('protein-rich')) return 'grains';
  if (tags.includes('vitamin-C') || tags.includes('antioxidant')) return 'fruits';
  return null;
}

// Deduplicate foods array — merge entries that are form variants of the same base food
function _deduplicateFoods() {
  if (!foods || foods.length === 0) return;
  const seen = {}; // baseName → index in deduped array
  const deduped = [];

  foods.forEach(f => {
    const lower = f.name.toLowerCase().trim();
    const base = _baseFoodName(lower);
    const key = base || lower;

    if (seen.hasOwnProperty(key)) {
      // Merge: keep earliest date, escalate reaction to 'watch' if either is watch
      const existing = deduped[seen[key]];
      if (f.date && (!existing.date || f.date < existing.date)) existing.date = f.date;
      if (f.reaction === 'watch') existing.reaction = 'watch';
    } else {
      seen[key] = deduped.length;
      // Use the cleanest name: prefer shorter or capitalized version
      const cleanName = f.name.trim();
      deduped.push({ name: cleanName, reaction: f.reaction, date: f.date });
    }
  });

  if (deduped.length < foods.length) {
    foods = deduped;
    save(KEYS.foods, foods);
  }
}

function renderFoods() {
  save(KEYS.foods, foods);
  const grid = document.getElementById('foodsGrid');
  const countEl = document.getElementById('foodsTotalCount');
  if (countEl) countEl.textContent = `${foods.length} foods`;

  const grouped = _categorizeFoods();
  const isVeg = getDietPref() === 'veg';
  const parentOrder = isVeg
    ? ['grains','fruits','vegs','dairy','nuts','spices']
    : ['grains','fruits','vegs','dairy','nuts','spices','nonveg'];

  let html = '<div class="food-cats">';

  parentOrder.forEach(pid => {
    const parent = FOOD_TAX[pid];
    const col = parent.color;
    let parentTotal = 0, parentCount = 0;
    Object.entries(parent.subs).forEach(([sid, sub]) => {
      parentTotal += sub.keys.length;
      parentCount += grouped[pid][sid].length;
    });

    const pct = parentTotal > 0 ? Math.round((parentCount / parentTotal) * 100) : 0;
    const barColor = pct >= 50 ? _foodTextMap[col] : 'var(--light)';

    html += `
      <div>
        <div class="food-cat-card" data-action="openFoodCatModal" data-arg="${pid}" style="background:${_foodColorMap[col]};border-color:${_foodBorderMap[col]};cursor:pointer;">
          <div class="fc-icon">${parent.icon}</div>
          <div class="fc-name">${parent.label}</div>
          <div class="fc-count">${parentCount} of ${parentTotal}</div>
          <div style="width:100%;height:4px;border-radius:2px;background:rgba(0,0,0,0.06);margin-top:6px;">
            <div class="dyn-fill" style="--dyn-pct:${pct}%;height:100%;border-radius:2px;background:${barColor};transition:width var(--ease-slow);"></div>
          </div>
        </div>
      </div>`;
  });

  html += '</div>';
  grid.innerHTML = html;
}

let _activeFoodCatParent = null;
let _activeFoodCatSub = null;

function openFoodCatModal(pid) {
  _activeFoodCatParent = pid;
  const parent = FOOD_TAX[pid];
  const col = parent.color;
  const grouped = _categorizeFoods();

  document.getElementById('foodCatModalTitle').innerHTML = `${parent.icon} ${parent.label}`;

  const subIds = Object.keys(parent.subs);
  const tabsEl = document.getElementById('foodCatModalTabs');
  tabsEl.style.background = _foodColorMap[col];

  tabsEl.innerHTML = subIds.map((sid, i) => {
    const sub = parent.subs[sid];
    const count = grouped[pid][sid].length;
    const total = sub.keys.length;
    return `<button class="settings-tab${i===0?' active-st':''}" id="fct-${sid}" data-action="switchFoodCatSub" data-arg="${pid}" data-arg2="${sid}" style="font-size:var(--fs-xs);padding:6px 8px;gap:var(--sp-4);">
      ${sub.icon} ${sub.label} <span style="opacity:0.6;font-size:var(--fs-xs);">${count}/${total}</span>
    </button>`;
  }).join('');

  _activeFoodCatSub = subIds[0];
  renderFoodCatSubContent(pid, subIds[0]);
  openModal('foodCatModal');
}

function switchFoodCatSub(pid, sid) {
  _activeFoodCatSub = sid;
  const parent = FOOD_TAX[pid];
  const col = parent.color;
  Object.keys(parent.subs).forEach(s => {
    const tab = document.getElementById('fct-' + s);
    if (tab) {
      tab.classList.toggle('active-st', s === sid);
      if (s === sid) {
        tab.style.background = 'white';
        tab.style.color = _foodTextMap[col];
      } else {
        tab.style.background = 'transparent';
        tab.style.color = 'var(--mid)';
      }
    }
  });
  renderFoodCatSubContent(pid, sid);
}

function renderFoodCatSubContent(pid, sid) {
  const bodyEl = document.getElementById('foodCatModalBody');
  const parent = FOOD_TAX[pid];
  const sub = parent.subs[sid];
  const col = parent.color;
  const grouped = _categorizeFoods();
  const items = grouped[pid][sid];
  const introducedLower = new Set(foods.map(f => f.name.toLowerCase()));

  let html = '';

  if (items.length > 0) {
    html += `<div class="foods-grid">
      ${items.map(f => {
        const freq = getFoodFrequency(f.name);
        const fl = freqLabel(freq);
        return `<div class="food-tag ${f.reaction}">
          <div class="food-tag-top">
            <span class="food-tag-name">${escHtml(f.name)}</span>
            <button class="food-fav-star${isFoodFavorite(f.name) ? ' active' : ''}" data-action="foodToggleFavorite" data-stop="1" data-arg="${escHtml(f.name)}" title="Favorite">${zi('star')}</button>
            <button class="food-del" data-action="deleteFoodAndRender" data-stop="1" data-arg="${f._i}" data-arg2="'${pid}','${sid}'" title="Remove">×</button>
          </div>
          <span class="food-tag-date">${f.date ? formatDate(f.date) : 'No date'}</span>
          <span class="freq-badge ${fl.cls}">${fl.label} · ${freq}×/wk</span>
        </div>`;
      }).join('')}
    </div>`;
  } else {
    html += `<div style="padding:16px;text-align:center;color:var(--light);font-size:var(--fs-base);">No foods introduced yet</div>`;
  }

  const introducedBases = new Set(foods.map(f => _baseFoodName(f.name.toLowerCase().trim())));
  const introducedLowerFull = new Set(foods.map(f => f.name.toLowerCase().trim()));
  const remaining = sub.keys.filter(k => {
    // Check exact match, base match, or substring match (either direction)
    if (introducedLowerFull.has(k)) return false;
    if (introducedBases.has(k)) return false;
    // Check if any introduced food contains this key or vice versa
    for (const base of introducedBases) {
      if (base.includes(k) || k.includes(base)) return false;
    }
    return true;
  });
  if (remaining.length > 0) {
    html += `<div style="margin-top:10px;padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:${_foodColorMap[col]};border:1px solid ${_foodBorderMap[col]};">
      <div style="font-size:var(--fs-sm);font-weight:600;color:${_foodTextMap[col]};margin-bottom:6px;">Not yet tried (${remaining.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--sp-4);">
        ${remaining.map(r => `<span style="font-size:var(--fs-xs);padding:3px 8px;border-radius:var(--r-md);background:var(--glass-strong);color:var(--mid);">${r}</span>`).join('')}
      </div>
    </div>`;
  }

  bodyEl.innerHTML = html;
}

function setReaction(r) {
  currentReaction = r;
  document.getElementById('rtog-ok').className    = 'rtog' + (r==='ok'?' active-ok':'');
  document.getElementById('rtog-watch').className = 'rtog' + (r==='watch'?' active-watch':'');
}

function addFood() {
  const val = document.getElementById('foodInput').value.trim();
  const dt  = document.getElementById('foodDate').value;
  if (!val) return;

  // Check if base food already exists
  const base = _baseFoodName(val.toLowerCase());
  const existingIdx = foods.findIndex(f => {
    const fb = _baseFoodName(f.name.toLowerCase().trim());
    return fb === base || fb.includes(base) || base.includes(fb);
  });
  if (existingIdx >= 0) {
    // Update existing: keep earlier date, escalate reaction
    const existing = foods[existingIdx];
    if (dt && (!existing.date || dt < existing.date)) existing.date = dt;
    if (currentReaction === 'watch') existing.reaction = 'watch';
  } else {
    foods.push({ name:val, reaction:currentReaction, date:dt||today() });
  }

  document.getElementById('foodInput').value = '';
  document.getElementById('foodDate').value = today();
  renderFoods();

  // If food isn't in the built-in database, prompt for manual tagging
  const lower = val.toLowerCase();
  if (!NUTRITION[lower] && !nutritionCache[lower]) {
    showNutrientTagModal(val);
  }
}

function deleteFood(i) {
  confirmAction('Delete this food?', () => {
    foods.splice(i,1);
    renderFoods();
  });
}
// @@INSERT_DATA_BLOCK_11@@

// Build lookup for fast synergy checking
const _synergyIndex = {};
FOOD_SYNERGIES.forEach(([f1, f2, reason, type]) => {
  const key1 = f1 + '|' + f2;
  const key2 = f2 + '|' + f1;
  _synergyIndex[key1] = { food1: f1, food2: f2, reason, type };
  _synergyIndex[key2] = { food1: f2, food2: f1, reason, type };
});

function getSynergy(food1, food2) {
  // Direct match
  const direct = _synergyIndex[food1 + '|' + food2];
  if (direct) return direct;
  // Substring match (e.g. 'carrot puree' contains 'carrot')
  for (const [f1, f2, reason, type] of FOOD_SYNERGIES) {
    if ((food1.includes(f1) || f1.includes(food1)) && (food2.includes(f2) || f2.includes(food2))) {
      return { food1: f1, food2: f2, reason, type };
    }
    if ((food1.includes(f2) || f2.includes(food1)) && (food2.includes(f1) || f1.includes(food2))) {
      return { food1: f2, food2: f1, reason, type };
    }
  }
  return null;
}

function getMealSynergies(mealStr) {
  if (!mealStr) return [];
  const mealFoods = [];
  mealStr.split(/[,+]/).forEach(f => {
    const clean = f.trim().toLowerCase();
    if (clean.length > 1) mealFoods.push(clean);
  });
  const found = [];
  for (let a = 0; a < mealFoods.length; a++) {
    for (let b = a + 1; b < mealFoods.length; b++) {
      const syn = getSynergy(mealFoods[a], mealFoods[b]);
      if (syn) found.push(syn);
    }
  }
  return found;
}
// @@INSERT_DATA_BLOCK_12@@

// ── AI-powered nutrition lookup for unknown foods ──
// Cached in localStorage so each food is only looked up once
const NUTRITION_CACHE_KEY = 'ziva_nutrition_cache';
let nutritionCache = {};
try { nutritionCache = JSON.parse(localStorage.getItem(NUTRITION_CACHE_KEY)) || {}; } catch { nutritionCache = {}; }

function getNutrition(foodName) {
  const lower = foodName.toLowerCase();
  if (NUTRITION[lower]) return NUTRITION[lower];
  if (nutritionCache[lower]) return nutritionCache[lower];
  // Try normalized name
  const norm = normalizeFoodName(lower);
  if (norm !== lower) {
    if (NUTRITION[norm]) return NUTRITION[norm];
    if (nutritionCache[norm]) return nutritionCache[norm];
  }
  return null;
}

function saveManualNutrition(foodName, nutrients, tags, category) {
  const lower = foodName.toLowerCase();
  nutritionCache[lower] = { nutrients, tags };
  localStorage.setItem(NUTRITION_CACHE_KEY, JSON.stringify(nutritionCache));
  if (category && ['grains','fruits','vegs','dairy','nuts'].includes(category)) {
    const cats = JSON.parse(localStorage.getItem('ziva_food_categories') || '{}');
    cats[lower] = category;
    localStorage.setItem('ziva_food_categories', JSON.stringify(cats));
  }
  renderFoods();
  renderTips();
}

function showNutrientTagModal(foodName) {
  const lower = foodName.toLowerCase();
  if (NUTRITION[lower] || nutritionCache[lower]) return; // already known

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px;">
      <h3>${zi('note')} Tag "${escHtml(foodName)}"</h3>
      <div style="font-size:var(--fs-base);color:var(--mid);margin-bottom:12px;">Help the dashboard understand this food's nutrition. Tap what applies:</div>

      <div class="section-label-light">Category</div>
      <div class="fx-wrap g4 mb-12" id="ntm-cats">
        ${['grains','fruits','vegs','dairy','nuts'].map(c => {
          const labels = {grains: zi('bowl') + ' Grain/Lentil', fruits: zi('spoon') + ' Fruit', vegs: zi('spoon') + ' Vegetable', dairy: zi('drop') + ' Dairy/Fat', nuts: zi('spoon') + ' Nut/Seed'};
          return `<button class="rtog" data-cat="${c}" onclick="this.parentElement.querySelectorAll('.rtog').forEach(b=>b.className='rtog');this.className='rtog active-ok'">${labels[c]}</button>`;
        }).join('')}
      </div>

      <div class="section-label-light">Key nutrients</div>
      <div class="fx-wrap g4 mb-12" id="ntm-nutrients">
        ${['iron','calcium','protein','vitamin C','vitamin A','fibre','healthy fats','omega-3','zinc','folate','potassium','magnesium','antioxidants','carbs','vitamin E','vitamin K','probiotics'].map(n => `<button class="rtog" data-nut="${n}" onclick="this.classList.toggle('active-ok')">${n}</button>`).join('')}
      </div>

      <div class="section-label-light">Properties</div>
      <div class="fx-wrap g4 mb-12" id="ntm-tags">
        ${['iron-rich','brain-health','bone-health','protein-rich','healthy-fats','vitamin-C','vitamin-A','omega-3','digestive','energy','immune-boost','antioxidant','gut-health','hydrating','cooling','anti-inflammatory','easy-digest','gluten-free','constipation-relief','fermented'].map(t => `<button class="rtog" data-tag="${t}" onclick="this.classList.toggle('active-ok')">${t.replace(/-/g,' ')}</button>`).join('')}
      </div>

      <div class="modal-btns">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Skip</button>
        <button class="btn btn-sage" onclick="
          const cats=this.closest('.modal').querySelector('#ntm-cats .active-ok');
          const nuts=[...this.closest('.modal').querySelectorAll('#ntm-nutrients .active-ok')].map(b=>b.dataset.nut);
          const tags=[...this.closest('.modal').querySelectorAll('#ntm-tags .active-ok')].map(b=>b.dataset.tag);
          saveManualNutrition('${lower}',nuts.length?nuts:['unknown'],tags.length?tags:[],cats?cats.dataset.cat:'');
          this.closest('.modal-overlay').remove();
        ">Save Tags</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// Resolve a meal string to matched nutrition entries
function parseMealNutrition(mealStr) {
  if (!mealStr) return [];
  const lower = mealStr.toLowerCase();
  const matched = [];
  // Check built-in database
  Object.entries(NUTRITION).forEach(([key, val]) => {
    if (lower.includes(key)) matched.push({ food:key, ...val });
  });
  // Also check cached AI lookups
  Object.entries(nutritionCache).forEach(([key, val]) => {
    if (lower.includes(key) && !matched.some(m => m.food === key)) {
      matched.push({ food:key, ...val });
    }
  });
  return matched;
}

function getMealInsight(mealStr) {
  const items = parseMealNutrition(mealStr);
  if (items.length === 0) return null;

  const allTags      = items.flatMap(i => i.tags);
  const allNutrients = [...new Set(items.flatMap(i => i.nutrients))];
  const parts        = [];

  // Iron + Vit C synergy (most important for this age)
  if (allTags.includes('iron-rich')) {
    const ironFoods = items.filter(i=>i.tags.includes('iron-rich')).map(i=>i.food);
    const hasVitC   = allTags.includes('vitamin-C') || allTags.includes('iron-absorption');
    parts.push(`Rich in iron (${ironFoods.join(', ')})${hasVitC ? ' — Vitamin C in this meal boosts iron absorption ' + zi('target') : ''}`);
  }
  // Brain health
  if (allTags.includes('brain-health')) {
    const bf = items.filter(i=>i.tags.includes('brain-health')).map(i=>i.food);
    parts.push(`Brain-boosting — ${bf.join(', ')} provide healthy fats & support myelination ${zi('brain')}`);
  }
  // Gut health / probiotics
  if (allTags.includes('gut-health') || allTags.includes('fermented')) {
    const gf = items.filter(i=>i.tags.includes('gut-health') || i.tags.includes('fermented')).map(i=>i.food);
    parts.push(`Probiotic-rich (${gf.join(', ')}) — great for building healthy gut flora`);
  }
  // Bone health
  if (allTags.includes('bone-health') && !allTags.includes('iron-rich')) {
    const bf = items.filter(i=>i.tags.includes('bone-health')).map(i=>i.food);
    parts.push(`Good for bones & teeth — calcium from ${bf.join(', ')}`);
  }
  // Immune boost
  if (allTags.includes('immune-boost') && !allTags.includes('iron-rich') && !allTags.includes('brain-health')) {
    parts.push('Supports immune system development');
  }
  // Vitamin A / eye health
  if (allTags.includes('vitamin-A') && !allTags.includes('iron-rich')) {
    parts.push('Good source of Vitamin A for eye & immune health');
  }
  // Anti-inflammatory
  if (allTags.includes('anti-inflammatory')) {
    const af = items.filter(i=>i.tags.includes('anti-inflammatory')).map(i=>i.food);
    parts.push(`Anti-inflammatory benefits from ${af.join(', ')}`);
  }
  // Omega-3
  if (allTags.includes('omega-3') && !allTags.includes('brain-health')) {
    parts.push('Contains omega-3 for brain & nerve development');
  }
  // Hydrating
  if (allTags.includes('hydrating')) {
    parts.push('Hydrating — good for hot days & digestion');
  }
  // Constipation relief
  if (allTags.includes('constipation-relief')) {
    const cf = items.filter(i=>i.tags.includes('constipation-relief')).map(i=>i.food);
    parts.push(`${cf.join(', ')} helps keep stools soft`);
  }
  // Digestive / easy digest
  if (allTags.includes('digestive') && !allTags.includes('constipation-relief') && !allTags.includes('gut-health')) {
    parts.push('Gentle on digestion');
  }
  // Complete meal
  if (allTags.includes('complete-meal')) {
    parts.push('Well-rounded carb + protein combo');
  }
  // Protein-rich (if not already covered by iron or brain)
  if (allTags.includes('protein-rich') && !allTags.includes('iron-rich') && !allTags.includes('brain-health')) {
    const pf = items.filter(i=>i.tags.includes('protein-rich')).map(i=>i.food);
    parts.push(`Good protein from ${pf.join(', ')} — supports growth`);
  }
  // Antioxidant
  if (allTags.includes('antioxidant') && parts.length < 2) {
    parts.push('Rich in antioxidants for cellular protection');
  }
  // Fallback
  if (parts.length === 0 && allNutrients.length > 0) {
    parts.push(`Contains ${allNutrients.slice(0,4).join(', ')}`);
  }

  // Action tips
  if (allTags.includes('iron-rich') && !allTags.includes('vitamin-C') && !allTags.includes('iron-absorption')) {
    parts.push(zi('bulb') + ' Tip: add lemon, tomato, or a Vit-C fruit to boost iron absorption');
  }
  if (allTags.includes('healthy-fats') && allTags.includes('iron-rich') && allTags.includes('vitamin-C')) {
    parts.push(zi('sparkle') + ' Excellent combo — iron + fat + Vit C = maximum absorption');
  }

  // Synergy detection from FOOD_SYNERGIES database
  const synergies = getMealSynergies(mealStr);
  if (synergies.length > 0) {
    // Show up to 2 synergies, avoid duplicating iron+vitC already covered above
    const shown = new Set();
    synergies.forEach(syn => {
      if (shown.size >= 2) return;
      const key = syn.food1 + syn.food2;
      if (shown.has(key)) return;
      // Skip if iron+vitC synergy already mentioned above
      if (syn.type === 'absorption' && syn.reason.includes('iron absorption') && allTags.includes('iron-rich') && (allTags.includes('vitamin-C') || allTags.includes('iron-absorption'))) return;
      shown.add(key);
      const emoji = syn.type === 'absorption' ? zi('link') : syn.type === 'complete' ? zi('sparkle') : zi('sprout');
      parts.push(`${emoji} ${syn.reason}`);
    });
  }

  return parts.join(' · ');
}

function updateMealInsight(meal) {
  const val = document.getElementById('meal-' + meal).value;
  const insight = getMealInsight(val);
  const box  = document.getElementById('insight-' + meal);
  const text = document.getElementById('insight-' + meal + '-text');
  if (insight) {
    // Add diversity hint for multi-food meals
    let diversityHint = '';
    const foodItems = val.split(/[,+]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
    if (foodItems.length >= 2) {
      const groupSet = new Set();
      foodItems.forEach(f => { const cls = classifyFoodToGroup(f); if (cls) groupSet.add(cls.groupLabel); });
      if (groupSet.size >= 3) diversityHint = ' · ' + zi('rainbow') + ' ' + groupSet.size + ' food groups';
      else if (groupSet.size === 1 && foodItems.length >= 3) diversityHint = ' · ' + zi('hourglass') + ' all from ' + [...groupSet][0].toLowerCase();
    }
    text.innerHTML = insight + diversityHint;
    box.style.display = 'flex';
  } else {
    box.style.display = 'none';
  }
}

// ─────────────────────────────────────────

// MILESTONES TAB QUICK STATS
// ─────────────────────────────────────────
// renderMilestoneStats — owns #milestoneStats pill grid + the milestones
// domain-hero card. PR-α split: #milestoneHighlights extracted to its own
// renderer (renderMilestoneHighlights) so SYNC_RENDER_DEPS dispatches each
// surface independently and the function becomes single-target.
function renderMilestoneStats() {
  const el = document.getElementById('milestoneStats');
  if (!el) return;

  const doneMs = milestones.filter(m => isMsDone(m));
  const inProgress = milestones.filter(m => isMsActive(m)).length;
  const pending = milestones.filter(m => !isMsStarted(m)).length;
  const advanced = milestones.filter(m => m.advanced && isMsDone(m)).length;
  const acts = typeof getFilteredActivities === 'function' ? getFilteredActivities() : [];

  let totalEvidence = 0;
  Object.values(activityLog).forEach(entries => {
    if (Array.isArray(entries)) totalEvidence += entries.length;
  });

  el.innerHTML = `
      <div class="diet-stat ds-sage" data-action="expandMilestones" data-arg="done">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-check"/></svg></div>
        <div class="diet-stat-val">${doneMs.length}</div>
        <div class="diet-stat-label">Done</div>
      </div>
      <div class="diet-stat ds-peach" data-action="expandMilestones" data-arg="in_progress">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-halfcircle"/></svg></div>
        <div class="diet-stat-val">${inProgress}</div>
        <div class="diet-stat-label">In prog.</div>
      </div>
      <div class="diet-stat ds-lav" data-action="expandUpcoming">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-hourglass"/></svg></div>
        <div class="diet-stat-val">${pending}</div>
        <div class="diet-stat-label">Pending</div>
      </div>
      ${advanced > 0 ? `<div class="diet-stat ds-rose" data-action="expandMilestones" data-arg="advanced">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-star"/></svg></div>
        <div class="diet-stat-val">${advanced}</div>
        <div class="diet-stat-label">Adv.</div>
      </div>` : ''}
      ${totalEvidence > 0 ? `<div class="diet-stat ds-sky">
        <div class="diet-stat-icon">${zi('chart')}</div>
        <div class="diet-stat-val">${totalEvidence}</div>
        <div class="diet-stat-label">Evidence</div>
      </div>` : `<div class="diet-stat ds-sky" data-action="expandActivities">
        <div class="diet-stat-icon"><svg class="zi"><use href="#zi-target"/></svg></div>
        <div class="diet-stat-val">${acts.length}</div>
        <div class="diet-stat-label">Activities</div>
      </div>`}
  `;

  renderDomainHero('milestones');
}

// renderMilestoneHighlights — extracted from renderMilestoneStats (PR-α).
// Owns the #milestoneHighlights card: Latest-achieved + Coming-up-next +
// Try-this-activity strips.
function renderMilestoneHighlights() {
  const hlEl = document.getElementById('milestoneHighlights');
  if (!hlEl) return;

  const doneMs = milestones.filter(m => isMsDone(m));
  const acts = typeof getFilteredActivities === 'function' ? getFilteredActivities() : [];
  const latestDone = doneMs.filter(m => m.doneAt).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  const latestMs = latestDone[0] || doneMs[doneMs.length - 1];
  const catIcons = { motor:zi('run'), language:zi('chat'), social:zi('handshake'), cognitive:zi('brain') };

  const mo = getAgeInMonths();
  const brackets = Object.keys(getUpcomingMilestones()).map(Number).sort((a, b) => a - b);
  let nextMilestone = null;
  let nextMonth = null;
  const doneTexts = milestones.filter(m => isMsDone(m)).map(m => m.text.toLowerCase().trim());
  for (const br of brackets) {
    if (br < mo) continue;
    const items = getUpcomingMilestones()[br] || [];
    const notDone = items.filter(item => {
      return !doneTexts.includes(item.text.toLowerCase().trim());
    });
    const nonAdvanced = notDone.filter(i => !i.advanced);
    if (nonAdvanced.length) { nextMilestone = nonAdvanced[0]; nextMonth = br; break; }
    if (notDone.length) { nextMilestone = notDone[0]; nextMonth = br; break; }
  }

  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const randomAct = acts.length ? acts[(doy + 7) % acts.length] : null;

  let hlHtml = '';

  if (latestMs) {
    const ci = catIcons[latestMs.cat] || zi('star');
    const dateInfo = latestMs.doneAt ? formatDate(latestMs.doneAt.split('T')[0]) + ' · ' + ageAtDate(latestMs.doneAt) : '';
    const latestIdx = milestones.indexOf(latestMs);
    hlHtml += `
      <div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--sage-light);cursor:pointer;" data-action="expandMilestoneByIdx" data-arg="${latestIdx}">
        <span class="info-strip-icon">${ci}</span>
        <div class="flex-1-min">
          <div class="micro-label">Latest achieved</div>
          <div style="font-weight:600;font-size:var(--fs-base);color:var(--tc-sage);">${escHtml(latestMs.text)}${latestMs.advanced ? ' <svg class="zi"><use href="#zi-star"/></svg>' : ''}</div>
          ${dateInfo ? `<div class="t-sub mt-2">${dateInfo}</div>` : ''}
        </div>
      </div>`;
  }

  if (nextMilestone) {
    hlHtml += `
      <div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--lav-light);cursor:pointer;" data-action="expandUpcomingItem" data-arg="${escHtml(nextMilestone.text)}">
        <span class="info-strip-icon">${nextMilestone.icon}</span>
        <div class="flex-1-min">
          <div class="micro-label">Coming up next</div>
          <div style="font-weight:600;font-size:var(--fs-base);color:var(--tc-lav);">${escHtml(nextMilestone.text)}</div>
          <div class="t-sub mt-2">Expected around ${nextMonth} months</div>
        </div>
      </div>`;
  }

  if (randomAct) {
    hlHtml += `
      <div style="display:flex;align-items:flex-start;gap:var(--sp-8);padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--sky-light);cursor:pointer;" data-action="expandActivityType" data-arg="${randomAct.type}">
        <span class="info-strip-icon">${randomAct.icon}</span>
        <div class="flex-1-min">
          <div class="micro-label">Try this activity</div>
          <div style="font-weight:600;font-size:var(--fs-base);color:var(--tc-sky);">${escHtml(randomAct.title)}</div>
          <div class="t-sub mt-2">${escHtml(randomAct.desc)}</div>
        </div>
      </div>`;
  }

  hlEl.innerHTML = hlHtml || '<div class="t-sub-light">No highlights yet.</div>';
  hlEl.style.display = hlHtml ? '' : 'none';
}

function renderFoodChips() {
  // No-op — autocomplete is now inline on the input itself
  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.meal-input-wrap')) {
      document.querySelectorAll('.meal-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

// Get the last "token" being typed (after last comma)
function getLastToken(val) {
  const parts = val.split(',');
  return parts[parts.length - 1].trim();
}

function onMealFocus(meal) {
  const inp = document.getElementById('meal-' + meal);
  const token = getLastToken(inp.value);
  if (token.length > 0) {
    showMealDropdown(meal, token);
  }
}

function onMealInput(meal) {
  const inp = document.getElementById('meal-' + meal);
  const token = getLastToken(inp.value);
  updateMealInsight(meal);
  updateFeedingSaveBtn();
  if (token.length >= 1) {
    showMealDropdown(meal, token);
  } else {
    closeMealDropdown(meal);
  }
}

function updateFeedingSaveBtn() {
  const b = document.getElementById('meal-breakfast')?.value.trim();
  const l = document.getElementById('meal-lunch')?.value.trim();
  const d = document.getElementById('meal-dinner')?.value.trim();
  activateBtn('saveFeedBtn', b || l || d);
}

function showMealDropdown(meal, query) {
  const dd = document.getElementById('md-' + meal);
  const q = query.toLowerCase();
  let html = '';
  let totalMatches = 0;
  const isVeg = getDietPref() === 'veg';

  Object.entries(FOOD_SUGGESTIONS).forEach(([cat, items]) => {
    // Hide non-veg category when diet pref is vegetarian
    if (isVeg && cat.includes('Non-Veg')) return;
    const filtered = items.filter(f => f.toLowerCase().includes(q));
    if (filtered.length === 0) return;
    html += `<div class="meal-dd-cat">${cat}</div>`;
    filtered.forEach(food => {
      totalMatches++;
      html += `<div class="meal-dd-item" onmousedown="pickMealFood('${meal}','${food.replace(/'/g, "\\'")}')">
        ${highlightMatch(food, q)}
      </div>`;
    });
  });

  // Always show "Add as new food" at the bottom if query doesn't exactly match
  const allFoods = Object.values(FOOD_SUGGESTIONS).flat();
  const exactMatch = allFoods.some(f => f.toLowerCase() === q);
  if (query.length >= 2 && !exactMatch) {
    const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
    html += `<div class="meal-dd-add" onmousedown="addNewFoodFromMeal('${meal}','${capitalized.replace(/'/g, "\\'")}')">
      ＋ Add "<strong>${escHtml(capitalized)}</strong>" as new food
    </div>`;
  }

  if (totalMatches === 0 && query.length < 2) {
    html = '<div class="meal-dd-empty">Keep typing to search...</div>';
  }

  dd.innerHTML = html;
  dd.classList.add('open');
}

function highlightMatch(food, query) {
  const idx = food.toLowerCase().indexOf(query);
  if (idx === -1) return escHtml(food);
  const before = food.slice(0, idx);
  const match = food.slice(idx, idx + query.length);
  const after = food.slice(idx + query.length);
  return `${escHtml(before)}<span style="color:var(--tc-rose);font-weight:700;">${escHtml(match)}</span>${escHtml(after)}`;
}

function closeMealDropdown(meal) {
  document.getElementById('md-' + meal).classList.remove('open');
}

function pickMealFood(meal, food) {
  const inp = document.getElementById('meal-' + meal);
  const parts = inp.value.split(',').map(s => s.trim()).filter(Boolean);
  // Replace the last token (what user was typing) with the picked food
  if (parts.length > 0) {
    parts[parts.length - 1] = food;
  } else {
    parts.push(food);
  }
  inp.value = parts.join(', ') + ', ';
  closeMealDropdown(meal);
  updateMealInsight(meal);
  inp.focus();
  // Auto-add to Foods Introduced if not already tracked (base food matching)
  const lower = food.toLowerCase().trim();
  const base = _baseFoodName(lower);
  const alreadyIntroduced = foods.some(f => {
    const fb = _baseFoodName(f.name.toLowerCase().trim());
    return fb === base || fb.includes(base) || base.includes(fb);
  });
  if (!alreadyIntroduced && lower.length > 1) {
    foods.push({ name: food, reaction: 'ok', date: today() });
    save(KEYS.foods, foods);
    renderFoods();
  }
}

function addNewFoodFromMeal(meal, foodName) {
  // Check if base food already introduced
  const base = _baseFoodName(foodName.toLowerCase().trim());
  const alreadyExists = foods.some(f => {
    const fb = _baseFoodName(f.name.toLowerCase().trim());
    return fb === base || fb.includes(base) || base.includes(fb);
  });
  if (!alreadyExists) {
    foods.push({ name: foodName, reaction: 'ok', date: today() });
    save(KEYS.foods, foods);
    renderFoods();
  }

  // Add to FOOD_SUGGESTIONS under a dynamic "Added" category so it shows in future searches
  if (!FOOD_SUGGESTIONS['Added']) FOOD_SUGGESTIONS['Added'] = [];
  if (!FOOD_SUGGESTIONS['Added'].includes(foodName)) {
    FOOD_SUGGESTIONS['Added'].push(foodName);
  }

  // Manual nutrition tagging for unknown foods
  const lower = foodName.toLowerCase();
  if (!NUTRITION[lower] && !nutritionCache[lower]) {
    showNutrientTagModal(foodName);
  }

  // Pick it into the meal input
  pickMealFood(meal, foodName);
}

function loadFeedingDay() {
  const d = document.getElementById('feedingDate').value;
  const entry = feedingData[d] || { breakfast:'', lunch:'', dinner:'', snack:'' };
  ['breakfast','lunch','dinner','snack'].forEach(m => {
    const input = document.getElementById('meal-' + m);
    const timeInput = document.getElementById('mealtime-' + m);
    const val = entry[m] || '';
    if (val === '—skipped—') {
      input.value = '';
      input.disabled = true;
      if (timeInput) { timeInput.value = ''; timeInput.disabled = true; }
    } else {
      input.value = val;
      input.disabled = false;
      if (timeInput) {
        timeInput.value = entry[m + '_time'] || '';
        timeInput.disabled = false;
      }
    }
  });
  ['breakfast','lunch','dinner','snack'].forEach(m => updateMealInsight(m));
  updateFeedingSaveBtn();
  updateMealSkipButtons();
  renderDietQuickPicker();
  renderDietIntelBanner();
  _miRenderDietTabIntake();
}

// ── Diet Quick Picker: per-meal frequent + same-as zones ──

function renderDietQuickPicker() {
  const currentDate = document.getElementById('feedingDate')?.value || today();
  const topFoods = getTopMeals(6);

  // Get previous days' meals for same-as pills
  const prevDays = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(currentDate); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (entry) prevDays.push({ offset: i, date: ds, entry });
  }

  const MEAL_KEYS = ['breakfast','lunch','dinner','snack'];
  const MEAL_LABELS = { breakfast:'B', lunch:'L', dinner:'D', snack:'S' };
  const DAY_LABELS = { 1:'Yd', 2:'2d ago', 3:'3d ago' };

  MEAL_KEYS.forEach(meal => {
    const zone = document.getElementById('dqp-' + meal);
    if (!zone) return;

    const inp = document.getElementById('meal-' + meal);
    const isDisabled = inp && inp.disabled;
    const hasValue = inp && inp.value && inp.value !== '—skipped—';

    // Don't show pills if meal already has content or is skipped
    if (isDisabled || hasValue) {
      zone.innerHTML = '';
      zone.classList.remove('has-pills');
      return;
    }

    let pills = [];

    // 1. Same-as: same meal slot from previous days
    prevDays.forEach(pd => {
      const val = pd.entry[meal];
      if (!val || val === '—skipped—') return;
      const short = val.length > 22 ? val.substring(0, 20) + '…' : val;
      const label = DAY_LABELS[pd.offset] || pd.offset + 'd';
      pills.push(`<div class="dqp-same" data-action="fillDietMeal" data-arg="${escAttr(meal)}" data-arg2="${escHtml(val)}" title="${escAttr(val)}">${label} <span class="op-60">${escHtml(short)}</span></div>`);
    });

    // 2. Same-as: today's OTHER meal slots that already have content
    const todayEntry = feedingData[currentDate] || {};
    const MEAL_EMOJI = { breakfast:zi('sun'), lunch:zi('sun'), dinner:zi('moon'), snack:zi('spoon') };
    MEAL_KEYS.forEach(otherMeal => {
      if (otherMeal === meal) return;
      const val = document.getElementById('meal-' + otherMeal)?.value || todayEntry[otherMeal] || '';
      if (!val || val === '—skipped—') return;
      const short = val.length > 20 ? val.substring(0, 18) + '…' : val;
      pills.push(`<div class="dqp-same" data-action="fillDietMeal" data-arg="${escAttr(meal)}" data-arg2="${escHtml(val)}" title="${escAttr(val)}">${MEAL_EMOJI[otherMeal]} ${MEAL_LABELS[otherMeal]} <span class="op-60">${escHtml(short)}</span></div>`);
    });

    // 2. Top frequent foods for this meal slot (from meal-specific history)
    const mealFreq = getMealSlotTopFoods(meal, 4);
    mealFreq.forEach(f => {
      pills.push(`<div class="dqp-pill" data-action="insertDietFood" data-arg="${escAttr(meal)}" data-arg2="${escHtml(f.name)}" title="${f.count}× in ${MEAL_LABELS[meal]}">${escHtml(f.name)}</div>`);
    });

    // 3. If no meal-specific foods, show general top foods
    if (mealFreq.length === 0 && topFoods.length > 0) {
      topFoods.slice(0, 3).forEach(f => {
        pills.push(`<div class="dqp-pill" data-action="insertDietFood" data-arg="${escAttr(meal)}" data-arg2="${escHtml(f.name)}" title="${f.count}× logged">${escHtml(f.name)}</div>`);
      });
    }

    if (pills.length > 0) {
      zone.innerHTML = '<div class="dqp-pills">' + pills.join('') + '</div>';
      zone.classList.add('has-pills');
    } else {
      zone.innerHTML = '';
      zone.classList.remove('has-pills');
    }
  });
}

// ── Diet Intelligence Banner: reaction window + synergy suggestions ──

function renderDietIntelBanner() {
  const el = document.getElementById('dietIntelBanner');
  if (!el) return;
  const currentDate = document.getElementById('feedingDate')?.value || today();
  if (currentDate !== today()) { el.innerHTML = ''; return; }

  let html = '';

  // 0. Fever diet guidance (if active episode)
  html += renderDietFeverBanner();

  // 0b. Diarrhoea diet guidance (if active episode)
  html += renderDietDiarrhoeaBanner();

  // 0c. Vomiting diet guidance
  if (getActiveVomitingEpisode()) {
    html += '<div class="fe-diet-banner"><div class="fe-diet-title">' + zi('siren') + ' Vomiting Active — Diet Guidance</div><div class="fe-diet-body">' +
      '<strong>Prioritize:</strong> Breast milk (most important), small frequent feeds, ORS in tiny sips after vomiting stops for 30 min.<br><br>' +
      '<strong>Avoid:</strong> Large feeds, fruit juices, new foods, forcing feeds. Wait 20–30 min after vomiting before offering milk.<br><br>' +
      '<em>Small amounts frequently — 1–2 tsp at a time — is better than a full feed.</em></div></div>';
  }

  // 0d. Cold diet guidance
  if (getActiveColdEpisode()) {
    html += '<div class="fe-diet-banner" style="border-left-color:var(--tc-sky);"><div class="fe-diet-title t-sky" >' + zi('siren') + ' Cold Active — Diet Guidance</div><div class="fe-diet-body">' +
      '<strong>Prioritize:</strong> Warm breast milk, warm soups (dal water, clear veg soup), khichdi, warm ragi porridge. Fluids help thin mucus.<br><br>' +
      '<strong>Avoid:</strong> Cold foods, ice, new introductions. Appetite may be reduced — this is normal.<br><br>' +
      '<em>Feed in an upright position. Use saline drops before feeds to clear the nose.</em></div></div>';
  }

  // 1. New food reaction window (3-day rule)
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentIntros = (foods || []).filter(f => {
    if (!f.date) return false;
    const fDate = new Date(f.date);
    return fDate >= threeDaysAgo && f.date !== today();
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (recentIntros.length > 0) {
    const newest = recentIntros[0];
    const introDate = new Date(newest.date);
    const clearDate = new Date(introDate); clearDate.setDate(clearDate.getDate() + 3);
    const daysLeft = Math.ceil((clearDate - new Date()) / 86400000);
    if (daysLeft > 0) {
      html += `<div class="dib-card dib-reaction">🆕 <strong>${escHtml(newest.name)}</strong> introduced ${formatDate(newest.date)} — watch window: <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''} left</strong>. Avoid new foods until ${formatDate(toDateStr(clearDate))}.</div>`;
    }
  }

  // 2. Proactive meal combo suggestions — based on actual meal archetypes from history
  const todayEntry = feedingData[currentDate] || {};
  const MEAL_KEYS = ['breakfast','lunch','dinner','snack'];
  const todayFoodsPerMeal = {};
  const emptyMeals = [];
  MEAL_KEYS.forEach(m => {
    const val = document.getElementById('meal-' + m)?.value || todayEntry[m] || '';
    if (isRealMeal(val)) {
      todayFoodsPerMeal[m] = val.split(/[,+]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 1);
    } else if (val !== '—skipped—') {
      emptyMeals.push(m);
    }
  });

  const allTodayFoods = Object.values(todayFoodsPerMeal).flat();

  if (emptyMeals.length > 0) {
    const nextMeal = emptyMeals[0];
    const templates = getMealTemplates(nextMeal);
    const MEAL_LABELS_FULL = { breakfast:'breakfast', lunch:'lunch', dinner:'dinner', snack:'snack' };

    if (templates.length > 0) {
      // Pick templates that don't fully duplicate today's foods
      const best = templates.filter(t => {
        const overlap = t.foods.filter(f => allTodayFoods.some(tf => tf.includes(f) || f.includes(tf)));
        return overlap.length < t.foods.length;
      }).slice(0, 2);

      if (best.length > 0) {
        html += '<div class="dib-card dib-synergy">';
        html += '<div style="font-weight:600;margin-bottom:6px;">\u{1F4A1} ' + capitalize(MEAL_LABELS_FULL[nextMeal]) + ' ideas from Ziva\'s favorites</div>';
        best.forEach(function(t, idx) {
          var comboStr = t.foods.map(function(f){ return capitalize(f); }).join(', ');
          html += '<div class="dib-combo-row" data-action="fillDietMeal" data-arg="' + escAttr(nextMeal) + '" data-arg2="' + escHtml(comboStr) + '" style="cursor:pointer;display:flex;align-items:center;gap:var(--sp-8);padding:6px 0;' + (idx > 0 ? 'border-top:1px solid rgba(0,0,0,0.05);' : '') + '">';
          html += '<div class="flex-1-min0">';
          html += '<span class="t-sm" style="font-weight:600;color:var(--text);">' + escHtml(t.label) + '</span>';
          html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:3px;">';
          t.foods.forEach(function(f) {
            html += '<span class="dib-synergy-pill" style="pointer-events:none;">' + escHtml(capitalize(f)) + '</span>';
          });
          html += '</div>';
          if (t.reason) html += '<div class="t-xs" style="color:var(--light);margin-top:2px;">' + escHtml(t.reason) + '</div>';
          html += '</div>';
          html += '<span style="color:var(--light);font-size:var(--fs-sm);">tap \u2192</span>';
          html += '</div>';
        });
        html += '</div>';
      }
    }

    // Fallback: if no templates, show pair-based synergy suggestions
    if (templates.length === 0 && allTodayFoods.length > 0) {
      var suggestions = [];
      var seen = new Set();
      var introducedSet = new Set((foods || []).map(function(f){ return f.name.toLowerCase().trim(); }));

      allTodayFoods.forEach(function(food) {
        FOOD_SYNERGIES.forEach(function(syn) {
          var f1 = syn[0], f2 = syn[1], reason = syn[2], type = syn[3];
          var match = null, partner = null;
          if (food.includes(f1) || f1.includes(food)) { match = f1; partner = f2; }
          else if (food.includes(f2) || f2.includes(food)) { match = f2; partner = f1; }
          if (!match || !partner) return;
          if (allTodayFoods.some(function(tf){ return tf.includes(partner) || partner.includes(tf); })) return;
          if (![...introducedSet].some(function(f){ return f.includes(partner) || partner.includes(f); })) return;
          if (seen.has(partner)) return;
          seen.add(partner);
          suggestions.push({ match: match, partner: partner, reason: reason, type: type });
        });
      });

      if (suggestions.length > 0) {
        var top = suggestions.slice(0, 3);
        html += '<div class="dib-card dib-synergy">\u{1F517} For ' + MEAL_LABELS_FULL[nextMeal] + ', try pairing with today\'s meals: ';
        top.forEach(function(s) {
          var emoji = s.type === 'absorption' ? '\u{1F517}' : s.type === 'complete' ? '\u2728' : '\u{1F33F}';
          html += '<span class="dib-synergy-pill" data-action="insertDietFood" data-arg="' + escAttr(nextMeal) + '" data-arg2="' + escHtml(s.partner) + '" title="' + escAttr(s.reason) + '">' + emoji + ' ' + escHtml(s.partner) + '</span> ';
        });
        html += '</div>';
      }
    }
  }

  el.innerHTML = html;
}

// ── Meal Template Engine: mines feeding history for archetype combos ──

function getMealTemplates(mealKey) {
  var combos = {};
  var dates = Object.keys(feedingData).sort();

  dates.forEach(function(ds) {
    var entry = feedingData[ds];
    var val = entry && entry[mealKey];
    if (!isRealMeal(val)) return;
    var foodItems = val.split(/[,+]/).map(function(f){ return f.trim().toLowerCase(); }).filter(function(f){ return f.length > 1; });
    if (foodItems.length < 2) return;

    var bases = foodItems.map(function(f){ return _baseFoodName(f); });
    var key = bases.slice().sort().join('|');

    if (!combos[key]) {
      combos[key] = { foods: bases, display: foodItems, count: 0, lastDate: ds };
    }
    combos[key].count++;
    combos[key].lastDate = ds;
  });

  var sorted = Object.values(combos)
    .sort(function(a, b) { return b.count - a.count || b.lastDate.localeCompare(a.lastDate); });

  var templates = [];
  var seenBases = new Set();

  sorted.forEach(function(combo) {
    var baseKey = combo.foods.slice().sort().join('|');
    var isDup = false;
    for (var seen of seenBases) {
      var seenFoods = seen.split('|');
      var overlap = combo.foods.filter(function(f){ return seenFoods.includes(f); }).length;
      if (overlap >= Math.ceil(combo.foods.length * 0.6)) { isDup = true; break; }
    }
    if (isDup) return;
    seenBases.add(baseKey);

    var groups = new Set();
    combo.foods.forEach(function(f) {
      var cls = classifyFoodToGroup(f);
      if (cls) groups.add(cls.groupLabel);
    });

    var label = '';
    var reason = '';
    var hasGrain = combo.foods.some(function(f){ return ['ragi','rice','oats','bajra','wheat'].some(function(g){ return f.includes(g); }); });
    var hasDal = combo.foods.some(function(f){ return ['dal','moong','masoor','toor','khichdi'].some(function(g){ return f.includes(g); }); });
    var hasFruit = combo.foods.some(function(f){ return ['banana','apple','pear','avocado','mango','blueberry','grape','orange','date','blackberry'].some(function(g){ return f.includes(g); }); });
    var hasVeg = combo.foods.some(function(f){ return ['carrot','beetroot','spinach','moringa','drumstick','bottle gourd','lauki','beans','pumpkin','broccoli'].some(function(g){ return f.includes(g); }); });
    var hasNut = combo.foods.some(function(f){ return ['almond','walnut','cashew','peanut'].some(function(g){ return f.includes(g); }); });
    var hasFat = combo.foods.some(function(f){ return ['ghee','coconut oil','butter'].some(function(g){ return f.includes(g); }); });

    if (hasGrain && hasDal && hasVeg) {
      label = '\u{1F35A} Khichdi + veggies';
      reason = 'Complete protein + iron + vitamins';
    } else if (hasGrain && hasDal) {
      label = '\u{1F35A} Grain + dal combo';
      reason = 'Complete protein \u2014 amino acid balance';
    } else if (hasGrain && hasNut && hasFruit) {
      label = '\u{1F33E} Porridge + fruit + nuts';
      reason = 'Energy + healthy fats + brain development';
    } else if (hasGrain && hasFruit) {
      label = '\u{1F33E} Porridge + fruit';
      reason = 'Energy + vitamins + gentle on tummy';
    } else if (hasFruit && combo.foods.length >= 3) {
      label = '\u{1F353} Fruit bowl';
      reason = 'Vitamins + hydration + antioxidants';
    } else if (hasFruit && combo.foods.length >= 2) {
      label = '\u{1F34E} Fruit mix';
      reason = 'Variety of vitamins + easy digestion';
    } else if (hasVeg && combo.foods.length >= 2) {
      label = '\u{1F955} Veggie medley';
      reason = 'Iron + fibre + micronutrients';
    } else {
      label = '\u{1F37D}\uFE0F ' + combo.count + '\u00D7 combo';
      reason = groups.size + ' food group' + (groups.size !== 1 ? 's' : '');
    }

    templates.push({
      foods: combo.display,
      label: label,
      reason: reason,
      count: combo.count,
      groups: groups.size,
      lastDate: combo.lastDate
    });
  });

  return templates.slice(0, 5);
}

// ── TODAY'S SUGGESTIONS + ADOPTION TRACKER (v2.8) ──

let _suggestionsData = {};
try { _suggestionsData = JSON.parse(localStorage.getItem(KEYS.suggestions)) || {}; } catch { _suggestionsData = {}; }

function pruneOldSuggestions() {
  const keys = Object.keys(_suggestionsData).sort();
  if (keys.length <= 45) return;
  keys.slice(0, keys.length - 45).forEach(k => delete _suggestionsData[k]);
}

function getTypeAdoptionRate(type, days) {
  const todayDate = new Date(today());
  let adopted = 0, total = 0;
  for (let i = 1; i <= days; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dayData = _suggestionsData[ds];
    if (!dayData || !dayData.items) continue;
    dayData.items.forEach(item => {
      if (item.type === type) {
        total++;
        if (item.adopted) adopted++;
      }
    });
  }
  return total > 0 ? adopted / total : 0;
}

function _sgNextEmptyMeal() {
  const entry = feedingData[today()] || {};
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  for (const m of order) {
    const val = entry[m];
    if (val === SKIPPED_MEAL) continue; // skip skipped meals
    if (!val || !isRealMeal(val)) return m;
  }
  return null;
}

function generateDailySuggestions() {
  const todayStr = today();
  const activeFever = getActiveFeverEpisode();
  const activeDiarrhoea = getActiveDiarrhoeaEpisode();
  const activeVomiting = getActiveVomitingEpisode();
  const activeCold = getActiveColdEpisode();
  const isIllness = !!(activeFever || activeDiarrhoea || activeVomiting || activeCold);

  // Already generated today? Reuse — unless illness state changed
  if (_suggestionsData[todayStr] && _suggestionsData[todayStr].generated) {
    const wasIllnessMode = !!_suggestionsData[todayStr]._feverMode;
    if (isIllness === wasIllnessMode) {
      return _suggestionsData[todayStr];
    }
    // Illness state changed — regenerate
    delete _suggestionsData[todayStr];
  }

  pruneOldSuggestions();

  const introducedSet = new Set((foods || []).map(f => f.name.toLowerCase().trim()));
  if (introducedSet.size < 3) return null; // too few foods to suggest

  // ── ILLNESS MODE: override suggestions when fever or diarrhoea is active ──
  if (isIllness) {
    const illnessFoods = activeFever ? getFeverDietFoods() : activeDiarrhoea ? getDiarrhoeaDietFoods() : getFeverDietFoods();
    const todayFoods = extractDayFoods(todayStr);
    const todayBases = new Set(todayFoods.map(f => _baseFoodName(f)));
    const eligible = illnessFoods.filter(f => !todayBases.has(_baseFoodName(f)));

    const items = [];
    // Hydration suggestions
    const hydraFoods = eligible.filter(f => {
      const nut = getNutrition(f) || getNutrition(_baseFoodName(f));
      return nut && (nut.tags.includes('hydrating') || nut.tags.includes('cooling'));
    }).slice(0, 2);
    if (hydraFoods.length > 0) {
      items.push({ id: 'sg-ill-hydra', type: 'hydration', foods: hydraFoods, reason: 'Hydration — essential during illness', emoji: 'drop', adopted: false, matchedMeal: null, matchedAt: null });
    }
    // Easy-digest suggestions
    const easyFoods = eligible.filter(f => {
      if (hydraFoods.includes(f)) return false;
      const nut = getNutrition(f) || getNutrition(_baseFoodName(f));
      return nut && nut.tags.includes('easy-digest');
    }).slice(0, 2);
    if (easyFoods.length > 0) {
      items.push({ id: 'sg-ill-easy', type: 'nutrient-gap', foods: easyFoods, reason: 'Light, easy-digest foods for recovery', emoji: 'medical', adopted: false, matchedMeal: null, matchedAt: null });
    }
    // General gentle foods
    const remaining = eligible.filter(f => !hydraFoods.includes(f) && !easyFoods.includes(f)).slice(0, 2);
    if (remaining.length > 0) {
      items.push({ id: 'sg-ill-gentle', type: 'template', foods: remaining, reason: 'Gentle foods — offer small amounts', emoji: 'bowl', adopted: false, matchedMeal: null, matchedAt: null });
    }

    const dayEntry = { generated: new Date().toISOString(), items: items.slice(0, 4), adoptionRate: 0, _feverMode: true, _illnessNote: 'Illness mode — focusing on gentle, hydrating foods' };
    _suggestionsData[todayStr] = dayEntry;
    save(KEYS.suggestions, _suggestionsData);
    return dayEntry;
  }

  const todayFoods = extractDayFoods(todayStr);
  const todayFoodSet = new Set(todayFoods);

  // Reaction window: exclude foods introduced in last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentIntroNames = new Set(
    (foods || []).filter(f => f.date && new Date(f.date) >= threeDaysAgo)
      .map(f => _baseFoodName(f.name.toLowerCase().trim()))
  );

  // Already used today
  const todayBases = new Set(todayFoods.map(f => _baseFoodName(f)));

  function isEligible(food) {
    const base = _baseFoodName(food.toLowerCase().trim());
    if (recentIntroNames.has(base)) return false;
    if (todayBases.has(base)) return false;
    if (!introducedSet.has(food) && ![...introducedSet].some(i => _baseFoodName(i) === base)) return false;
    return true;
  }

  const candidates = [];
  const usedFoods = new Set(); // dedup across suggestions

  // 1. Nutrient gap suggestions
  try {
    const heatmap = computeNutrientHeatmap(7);
    const gaps = heatmap.gaps || [];
    gaps.slice(0, 3).forEach(gap => {
      const providers = [...introducedSet].filter(f => {
        if (!isEligible(f)) return false;
        if (usedFoods.has(_baseFoodName(f))) return false;
        const nut = getNutrition(f) || getNutrition(_baseFoodName(f));
        return nut && nut.nutrients && nut.nutrients.some(n => n.toLowerCase() === gap.toLowerCase());
      }).slice(0, 2);
      if (providers.length === 0) return;
      providers.forEach(f => usedFoods.add(_baseFoodName(f)));
      // Check for absorption booster
      const nutrientEmoji = { iron: 'drop', calcium: 'shield', protein: 'run', 'vitamin c': 'sprout', fibre: 'sprout', 'vitamin a': 'sparkle', 'omega-3': 'brain', zinc: 'shield' };
      const emoji = nutrientEmoji[gap.toLowerCase()] || 'drop';
      let reason = gap + ' gap — ' + providers.join(' + ');
      if (gap.toLowerCase() === 'iron') {
        const vitCFood = [...introducedSet].find(f =>
          isEligible(f) && !usedFoods.has(_baseFoodName(f)) &&
          (getNutrition(f) || getNutrition(_baseFoodName(f)))?.nutrients?.some(n => n.toLowerCase() === 'vitamin c')
        );
        if (vitCFood) {
          providers.push(vitCFood);
          usedFoods.add(_baseFoodName(vitCFood));
          reason = 'Iron gap — ' + providers.slice(0, -1).join(', ') + ' + ' + vitCFood + ' boosts absorption';
        }
      }
      candidates.push({
        id: 'sg-gap-' + gap.toLowerCase().replace(/\s/g, ''),
        type: 'nutrient-gap',
        foods: providers,
        reason: reason,
        emoji: emoji,
        adopted: false, matchedMeal: null, matchedAt: null
      });
    });
  } catch (e) { /* nutrient gap best effort */ }

  // 2. Synergy suggestions
  try {
    const pairings = computeSmartPairings();
    // unusedPairs: both foods not yet paired together (food1, food2)
    // todayActionable: one food already in today's meals (food), partner is the suggestion (partner)
    const synItems = [];
    (pairings.unusedPairs || []).forEach(pair => {
      const pairFoods = [pair.food1, pair.food2].filter(f => f && isEligible(f) && !usedFoods.has(_baseFoodName(f)));
      if (pairFoods.length >= 2) {
        synItems.push({ foods: pairFoods, reason: pair.reason || 'Untried synergy pairing' });
      }
    });
    (pairings.todayActionable || []).forEach(pair => {
      // partner is the one to suggest; food is already in today's meals
      if (pair.partner && isEligible(pair.partner) && !usedFoods.has(_baseFoodName(pair.partner))) {
        const partnerDisplay = pair.partner;
        const todayDisplay = pair.food || '';
        const reason = pair.reason ? pair.reason : ('Pairs with today\'s ' + todayDisplay);
        synItems.push({ foods: [partnerDisplay], reason: reason, pairWith: todayDisplay });
      }
    });
    synItems.slice(0, 2).forEach(si => {
      si.foods.forEach(f => usedFoods.add(_baseFoodName(f)));
      candidates.push({
        id: 'sg-syn-' + si.foods.map(f => _baseFoodName(f)).join('-'),
        type: 'synergy',
        foods: si.foods,
        reason: si.reason,
        emoji: 'sparkle',
        adopted: false, matchedMeal: null, matchedAt: null
      });
    });
  } catch (e) { /* synergy best effort */ }

  // 3. Template suggestions
  try {
    const nextMeal = _sgNextEmptyMeal() || 'lunch';
    const templates = getMealTemplates(nextMeal);
    templates.slice(0, 2).forEach(tpl => {
      const tplFoods = (tpl.foods || tpl.display || [])
        .filter(f => isEligible(f) && !usedFoods.has(_baseFoodName(f)));
      if (tplFoods.length < 2) return;
      tplFoods.forEach(f => usedFoods.add(_baseFoodName(f)));
      candidates.push({
        id: 'sg-tpl-' + tplFoods.slice(0, 2).map(f => _baseFoodName(f)).join('-'),
        type: 'template',
        foods: tplFoods,
        reason: (tpl.label ? tpl.label.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+\s*/u, '') + ' — ' : '') + (tpl.reason || 'Familiar combo'),
        emoji: 'bowl',
        adopted: false, matchedMeal: null, matchedAt: null
      });
    });
  } catch (e) { /* template best effort */ }

  // 4. Hydration suggestion
  try {
    const hydra = computeHydrationIntelligence(7);
    if (hydra.season === 'hot' || hydra.season === 'warm') {
      const hydraFoodsList = ['watermelon', 'cucumber', 'coconut water', 'buttermilk', 'lauki', 'musk melon', 'curd'];
      const eligible = hydraFoodsList.filter(f =>
        isEligible(f) && !usedFoods.has(_baseFoodName(f)) &&
        ([...introducedSet].some(i => _baseFoodName(i) === _baseFoodName(f)))
      ).slice(0, 2);
      if (eligible.length > 0) {
        eligible.forEach(f => usedFoods.add(_baseFoodName(f)));
        const tempStr = hydra.avgTemp ? ' (' + hydra.avgTemp + '°C)' : '';
        candidates.push({
          id: 'sg-hyd-' + todayStr,
          type: 'hydration',
          foods: eligible,
          reason: 'Hydration — ' + (hydra.season === 'hot' ? 'hot' : 'warm') + ' day' + tempStr,
          emoji: 'drop',
          adopted: false, matchedMeal: null, matchedAt: null
        });
      }
    }
  } catch (e) { /* hydration best effort */ }

  // Rank by priority × (1 + adoption boost)
  const basePriority = { 'nutrient-gap': 4, 'synergy': 3, 'template': 2, 'hydration': 1 };
  candidates.forEach(c => {
    const boost = getTypeAdoptionRate(c.type, 14);
    c._score = (basePriority[c.type] || 1) * (1 + boost);
  });
  candidates.sort((a, b) => b._score - a._score);

  const items = candidates.slice(0, 4).map((c, i) => ({
    id: c.id || ('sg-' + i),
    type: c.type,
    foods: c.foods,
    reason: c.reason,
    emoji: c.emoji,
    adopted: false,
    matchedMeal: null,
    matchedAt: null
  }));

  const dayEntry = {
    generated: new Date().toISOString(),
    items: items,
    adoptionRate: 0,
    _feverMode: false
  };

  _suggestionsData[todayStr] = dayEntry;
  save(KEYS.suggestions, _suggestionsData);
  return dayEntry;
}

function renderHomeSuggestions() {
  const card = document.getElementById('homeSuggestionsCard');
  const content = document.getElementById('homeSuggestionsContent');
  const counter = document.getElementById('homeSuggestionsCount');
  if (!card || !content) return;

  const data = generateDailySuggestions();
  if (!data || !data.items || data.items.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = '';
  const items = data.items;
  const adopted = items.filter(i => i.adopted).length;
  const total = items.length;
  if (counter) counter.textContent = adopted > 0 ? adopted + '/' + total + ' used' : '';

  const TAG_CLASS = { 'nutrient-gap': 'sg-tag-gap', 'synergy': 'sg-tag-syn', 'template': 'sg-tag-tpl', 'hydration': 'sg-tag-hyd' };
  const TAG_LABEL = { 'nutrient-gap': 'gap', 'synergy': 'synergy', 'template': 'favourite', 'hydration': 'hydration' };
  const todayStr = today();
  const isToday = true; // we only show today's suggestions on Home

  // Show 3 by default, 4th behind "show more"
  const showCount = 3;
  let html = '';

  // Illness mode header
  if (data._illnessNote) {
    html += '<div style="font-size:var(--fs-xs);color:var(--tc-caution);font-weight:600;padding:var(--sp-4) 0;">' + escHtml(data._illnessNote) + '</div>';
  }

  items.forEach((item, idx) => {
    const hidden = idx >= showCount ? ' style="display:none;" data-sg-extra' : '';
    const statusIcon = item.adopted ? zi('check') : '';
    const statusClass = item.adopted ? 'sg-status-used' : 'sg-status-pending';

    html += '<div class="sg-row"' + hidden + '>';
    html += '<div class="sg-row-icon">' + zi(item.emoji || 'bulb') + '</div>';
    html += '<div class="sg-row-body">';
    html += '<div class="sg-chips">';
    item.foods.forEach(f => {
      const display = f.charAt(0).toUpperCase() + f.slice(1);
      const escaped = escHtml(f).replace(/'/g, "\\'").replace(/"/g, '&quot;');
      html += '<span class="sg-chip" data-action="sgTapChip" data-arg="' + escaped + '">' + escHtml(display) + '</span>';
    });
    const tagCls = TAG_CLASS[item.type] || 'sg-tag-gap';
    const tagLabel = TAG_LABEL[item.type] || item.type;
    html += '<span class="sg-tag ' + tagCls + '">' + tagLabel + '</span>';
    html += '</div>';
    html += '<div class="sg-reason">' + escHtml(item.reason) + '</div>';
    html += '</div>';
    html += '<div class="sg-status ' + statusClass + '">' + statusIcon + '</div>';
    html += '</div>';
  });

  if (items.length > showCount) {
    html += '<div class="sg-more-toggle" id="sgMoreToggle" data-action="sgToggleMore">Show 1 more ▾</div>';
  }

  content.innerHTML = html;
}
// @@INSERT_DATA_BLOCK_18@@

function getSeasonalAvailability(foodBase) {
  var month = new Date().getMonth();
  var entry = SEASONAL_AVAILABILITY[foodBase];
  if (!entry) return 'unknown';
  if (entry.months.indexOf(month) !== -1) return entry.availability;
  return entry.other || 'unavailable';
}

function getSeasonalScore(foodBase) {
  var avail = getSeasonalAvailability(foodBase);
  if (avail === 'peak') return 10;
  if (avail === 'available') return 5;
  if (avail === 'scarce') return -5;
  if (avail === 'unavailable') return -15;
  return 0; // unknown = neutral
}

function getSeasonalHighlights() {
  var month = new Date().getMonth();
  var peaks = [];
  Object.keys(SEASONAL_AVAILABILITY).forEach(function(food) {
    var entry = SEASONAL_AVAILABILITY[food];
    if (entry.months.indexOf(month) !== -1 && entry.availability === 'peak') {
      // Only include non-staple foods (staples are always peak — boring)
      var staples = ['rice','ragi','potato','ghee','curd','almonds','walnut','date (fruit)','masoor dal','moong dal','paneer','oats','flaxseed','sesame','banana','papaya','coconut'];
      if (staples.indexOf(food) === -1) peaks.push(food);
    }
  });
  return peaks;
}

// ── Food Acceptance Tracking (MEAL_INTAKE_SPEC §7) ──

function computeFoodAcceptance(windowDays) {
  windowDays = windowDays || 30;
  var todayD = new Date(today());
  var foodMap = {}; // base → { timesServed, totalIntake, intakes[], dates[] }

  for (var i = 0; i < windowDays; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var entry = feedingData[ds];
    if (!entry) continue;

    var meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    meals.forEach(function(meal) {
      var mealStr = entry[meal];
      if (!mealStr || typeof mealStr !== 'string' || mealStr.trim() === '') return;
      var intake = _miGetIntake(ds, meal);
      var mealFoods = mealStr.split(',').map(function(f) { return _baseFoodName(f.trim().toLowerCase()); }).filter(function(f) { return f.length > 0; });
      mealFoods.forEach(function(base) {
        if (!foodMap[base]) foodMap[base] = { timesServed: 0, totalIntake: 0, intakes: [], dates: [] };
        foodMap[base].timesServed++;
        foodMap[base].totalIntake += intake;
        foodMap[base].intakes.push(intake);
        foodMap[base].dates.push(ds);
      });
    });
  }

  var result = [];
  Object.keys(foodMap).forEach(function(base) {
    var data = foodMap[base];
    var avgIntake = data.timesServed > 0 ? data.totalIntake / data.timesServed : 0.75;
    // Trend: compare first 3 (most recent) vs last 3 (oldest)
    var trend = 'stable';
    if (data.intakes.length >= 6) {
      var recent3 = (data.intakes[0] + data.intakes[1] + data.intakes[2]) / 3;
      var last3Idx = data.intakes.length;
      var oldest3 = (data.intakes[last3Idx - 1] + data.intakes[last3Idx - 2] + data.intakes[last3Idx - 3]) / 3;
      if (recent3 - oldest3 > 0.15) trend = 'improving';
      else if (oldest3 - recent3 > 0.15) trend = 'declining';
    }
    result.push({
      food: base,
      timesServed: data.timesServed,
      avgIntake: Math.round(avgIntake * 100) / 100,
      trend: trend,
      lastDate: data.dates[0] || null
    });
  });

  result.sort(function(a, b) { return b.timesServed - a.timesServed; });
  return result;
}

var _acceptanceRateCache = {};
var _acceptanceRateCacheAt = 0;

function getFoodAcceptanceRate(foodBase) {
  // Per-run cache (30s TTL) — this function is called per-food in scoring loops
  var now = Date.now();
  if (now - _acceptanceRateCacheAt > 30000) {
    _acceptanceRateCache = {};
    _acceptanceRateCacheAt = now;
  }
  if (_acceptanceRateCache.hasOwnProperty(foodBase)) return _acceptanceRateCache[foodBase];

  var todayD = new Date(today());
  var total = 0, count = 0;
  for (var i = 0; i < 30; i++) {
    var d = new Date(todayD); d.setDate(d.getDate() - i);
    var ds = toDateStr(d);
    var entry = feedingData[ds];
    if (!entry) continue;
    var meals = ['breakfast', 'lunch', 'dinner', 'snack'];
    meals.forEach(function(meal) {
      var mealStr = entry[meal];
      if (!mealStr || typeof mealStr !== 'string') return;
      var mealFoods = mealStr.split(',').map(function(f) { return _baseFoodName(f.trim().toLowerCase()); });
      if (mealFoods.indexOf(foodBase) !== -1) {
        total += _miGetIntake(ds, meal);
        count++;
      }
    });
  }
  var result = count >= 1 ? Math.round((total / count) * 100) / 100 : null;
  _acceptanceRateCache[foodBase] = result;
  return result;
}

function getAcceptanceLabel(rate) {
  if (rate === null) return '';
  if (rate >= 0.9) return 'loves it';
  if (rate >= 0.7) return 'eats well';
  if (rate >= 0.5) return 'mixed';
  return 'often rejects';
}

// ── Outing Planner ──

var _tomorrowOuting = null;

function _outingInit() {
  _tomorrowOuting = load(KEYS.tomorrowOuting, null);
  // Auto-clear past or invalid outings
  if (_tomorrowOuting && _tomorrowOuting.date) {
    var outingDate = new Date(_tomorrowOuting.date);
    if (isNaN(outingDate.getTime())) {
      // Malformed date — clear
      _tomorrowOuting = null;
      localStorage.removeItem(KEYS.tomorrowOuting);
      return;
    }
    var now = new Date();
    // Clear if outing date has fully passed (it's now 2+ days ago)
    if (now - outingDate > 2 * 86400000) {
      _tomorrowOuting = null;
      localStorage.removeItem(KEYS.tomorrowOuting);
    }
  }
}

function _outingRenderForm() {
  var el = document.getElementById('outingForm');
  if (!el) return;

  var html = '<div class="outing-form-title"><div class="icon icon-sage">' + zi('sun') + '</div> Planning an outing?</div>';

  html += '<div class="outing-row">';
  html += '<div class="outing-row-label">Duration</div>';
  html += '<div class="outing-chips" data-outing-group="duration">';
  html += '<button class="outing-chip" data-outing-val="1.5">1\u20132 hrs</button>';
  html += '<button class="outing-chip" data-outing-val="3">2\u20134 hrs</button>';
  html += '<button class="outing-chip" data-outing-val="5">4+ hrs</button>';
  html += '</div></div>';

  html += '<div class="outing-row">';
  html += '<div class="outing-row-label">Time of day</div>';
  html += '<div class="outing-chips" data-outing-group="timeSlot">';
  html += '<button class="outing-chip" data-outing-val="morning">Morning</button>';
  html += '<button class="outing-chip" data-outing-val="afternoon">Afternoon</button>';
  html += '<button class="outing-chip" data-outing-val="evening">Evening</button>';
  html += '</div></div>';

  html += '<button class="outing-submit-btn" id="outingSubmitBtn">Get suggestions</button>';

  el.innerHTML = html;
  el.classList.add('active');

  // Pre-select if outing already saved
  if (_tomorrowOuting) {
    _outingPreselectChips(el);
  }

  // Chip selection handlers
  el.querySelectorAll('.outing-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var group = this.parentElement.getAttribute('data-outing-group');
      this.parentElement.querySelectorAll('.outing-chip').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Submit handler
  var submitBtn = el.querySelector('#outingSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      _outingSave(el);
    });
  }
}

function _outingPreselectChips(el) {
  if (!_tomorrowOuting) return;
  var durChips = el.querySelectorAll('[data-outing-group="duration"] .outing-chip');
  durChips.forEach(function(c) {
    if (parseFloat(c.getAttribute('data-outing-val')) === _tomorrowOuting.duration) c.classList.add('selected');
  });
  var timeChips = el.querySelectorAll('[data-outing-group="timeSlot"] .outing-chip');
  timeChips.forEach(function(c) {
    if (c.getAttribute('data-outing-val') === _tomorrowOuting.timeSlot) c.classList.add('selected');
  });
}

function _outingSave(el) {
  var durSel = el.querySelector('[data-outing-group="duration"] .outing-chip.selected');
  var timeSel = el.querySelector('[data-outing-group="timeSlot"] .outing-chip.selected');
  if (!durSel || !timeSel) {
    // Highlight unselected groups briefly
    if (!durSel) { var dg = el.querySelector('[data-outing-group="duration"]'); if (dg) { dg.style.outline = '2px solid var(--tc-caution)'; setTimeout(function() { dg.style.outline = ''; }, 1500); } }
    if (!timeSel) { var tg = el.querySelector('[data-outing-group="timeSlot"]'); if (tg) { tg.style.outline = '2px solid var(--tc-caution)'; setTimeout(function() { tg.style.outline = ''; }, 1500); } }
    return;
  }

  var outingDate = _outingTargetDate();
  var duration = parseFloat(durSel.getAttribute('data-outing-val'));
  var timeSlot = timeSel.getAttribute('data-outing-val');

  // Determine which meal is affected by the outing
  var portableMeal = null;
  if (duration >= 2) {
    if (timeSlot === 'morning') portableMeal = 'breakfast';
    else if (timeSlot === 'afternoon') portableMeal = 'lunch';
    else if (timeSlot === 'evening') portableMeal = 'dinner';
  }

  _tomorrowOuting = {
    date: outingDate,
    duration: duration,
    timeSlot: timeSlot,
    portableMeal: portableMeal,
    skipActivitySlot: timeSlot
  };

  save(KEYS.tomorrowOuting, _tomorrowOuting);

  // Now generate the answer card
  el.classList.remove('active');
  el.innerHTML = '';
  var classified = { mode: 'outing', raw: 'outing ' + timeSlot + ' ' + duration + 'hrs' };
  _qaExecuteOuting(classified);
}

function _outingTargetDate() {
  // Before 6 PM → plan is for today; after 6 PM → plan is for tomorrow
  var hour = new Date().getHours();
  return hour < 18 ? today() : _offsetDateStr(today(), 1);
}

function _outingTargetLabel() {
  var hour = new Date().getHours();
  return hour < 18 ? 'today' : 'tomorrow';
}

function _outingHideForm() {
  var el = document.getElementById('outingForm');
  if (el) { el.classList.remove('active'); el.innerHTML = ''; }
}

function _outingClear() {
  _tomorrowOuting = null;
  localStorage.removeItem(KEYS.tomorrowOuting);
}
// @@INSERT_DATA_BLOCK_19@@

function openOutingBriefing() {
  if (!_tomorrowOuting) return;
  // Remove any existing overlay
  var existing = document.getElementById('obOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'ob-overlay';
  overlay.id = 'obOverlay';
  document.body.appendChild(overlay);

  // Render loading state
  overlay.innerHTML = '<div class="ob-card"><div class="ob-header"><div class="ob-header-left"><div class="ob-title"><span class="icon icon-sage">' + zi('sun') + '</span> Outing Briefing</div><div class="ob-subtitle">Loading weather\u2026</div></div><button class="ob-close" id="obClose">\u00D7</button></div><div class="ob-body" id="obBody"><div class="ob-section ob-loading"><span class="icon icon-sage">' + zi('hourglass') + '</span></div></div></div>';

  // Trigger open animation
  requestAnimationFrame(function() { overlay.classList.add('open'); });
  document.body.style.overflow = 'hidden';

  // Close handlers
  overlay.querySelector('#obClose').addEventListener('click', closeOutingBriefing);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeOutingBriefing();
  });

  // Fetch weather and render
  _outingFetchForecast().then(function(wx) {
    _obRender(wx);
  });
}

function closeOutingBriefing() {
  var overlay = document.getElementById('obOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(function() { overlay.remove(); }, 300);
}

function _obRender(wx) {
  var body = document.getElementById('obBody');
  if (!body) return;
  var outing = _tomorrowOuting;
  if (!outing) return;

  var ageM = getAgeInMonths();
  var forLabel = outing.date === today() ? 'Today' : 'Tomorrow';
  var timeLabel = outing.timeSlot.charAt(0).toUpperCase() + outing.timeSlot.slice(1);

  // Update subtitle
  var sub = document.querySelector('.ob-subtitle');
  if (sub) sub.textContent = timeLabel + ' \u00B7 ~' + outing.duration + ' hrs \u00B7 ' + forLabel;

  var html = '';

  // 1. Weather
  html += _obRenderWeather(wx);

  // 2. Pack list
  html += _obRenderPackList(wx, ageM);

  // 3. Portable meal (only if outing overlaps meal time)
  if (outing.portableMeal && outing.duration >= 2) {
    html += _obRenderMeal(outing);
  }

  // 4. Hydration
  var hydCtx = _getHydrationContext();
  html += _obRenderHydration(hydCtx, wx);

  // 5. Dress code
  html += _obRenderDressCode(wx);

  // 6. Activity coverage
  html += _obRenderActivity(outing);

  // 7. Medical
  html += _obRenderMedical();

  // Clear outing button
  html += '<button class="ob-clear-btn" id="obClearBtn">Clear Outing</button>';

  body.innerHTML = html;

  // Wire pack list checkboxes
  _obWirePackList(body);

  // Wire clear button
  var clearBtn = body.querySelector('#obClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Clear the outing plan?')) {
        _outingClear();
        closeOutingBriefing();
        if (typeof renderOutingPlannerCard === 'function') renderOutingPlannerCard();
        if (typeof renderTomorrowPrep === 'function') renderTomorrowPrep();
      }
    });
  }
}

function _obRenderWeather(wx) {
  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-sky">' + zi('sun') + '</span> WEATHER</div>';

  if (!wx) {
    html += '<div class="ob-dress-code">Weather data unavailable</div>';
    html += '</div>';
    return html;
  }

  var temp = wx.maxTemp;
  var desc = weatherCodeToText(wx.code);
  var icon = weatherCodeToIcon(wx.code);
  var humidity = wx.humidity;
  var uv = wx.uvIndex;
  var rain = wx.rainChance;

  html += '<div class="ob-weather-grid">';
  html += '<div class="ob-weather-stat"><strong>' + icon + ' ' + temp + '\u00B0C</strong></div>';
  html += '<div class="ob-weather-stat">' + escHtml(desc) + '</div>';
  html += '<div class="ob-weather-stat"><span class="icon icon-sky">' + zi('drop') + '</span> Humidity ' + humidity + '%</div>';
  if (uv !== null && uv !== undefined) {
    var uvLabel = uv >= 11 ? 'Extreme' : uv >= 8 ? 'Very High' : uv >= 6 ? 'High' : uv >= 3 ? 'Moderate' : 'Low';
    html += '<div class="ob-weather-stat"><span class="icon icon-amber">' + zi('sun') + '</span> UV: ' + uv + ' (' + uvLabel + ')</div>';
  }
  if (rain !== null && rain !== undefined) {
    html += '<div class="ob-weather-stat"><span class="icon icon-sky">' + zi('drop') + '</span> Rain: ' + rain + '%</div>';
  }
  html += '</div>';

  // Advisory
  var advisory = _obGetAdvisory(temp, uv, rain);
  if (advisory) {
    var severeClass = (temp >= 40 || (uv !== null && uv >= 8)) ? ' severe' : '';
    html += '<div class="ob-weather-advisory' + severeClass + '"><span class="icon">' + zi('warn') + '</span> ' + escHtml(advisory) + '</div>';
  }

  html += '</div>';
  return html;
}

function _obGetAdvisory(temp, uv, rain) {
  // Pick highest severity
  if (temp >= 40) return 'Extreme heat \u2014 strongly consider postponing or keeping outing under 1 hour';
  if (temp >= 35) return 'Very hot \u2014 stay in shade, avoid direct sun between 11 AM \u2013 3 PM';
  if (uv !== null && uv >= 8) return 'Very high UV \u2014 sun hat mandatory, avoid midday sun';
  if (temp >= 30) return 'Warm day \u2014 keep baby in shade, offer fluids frequently';
  if (uv !== null && uv >= 6) return 'High UV \u2014 apply baby-safe sunscreen if out > 30 min';
  if (rain !== null && rain > 50) return 'Rain likely \u2014 carry rain cover for stroller/carrier';
  if (rain !== null && rain > 20) return 'Possible rain \u2014 pack an umbrella';
  if (temp < 15) return 'Cold \u2014 warm layers, cover extremities, limit outdoor time';
  if (temp < 20) return 'Cool weather \u2014 dress in layers, carry a blanket';
  return null;
}

function _obGetPackList(wx, ageM) {
  var items = [];
  var temp = wx ? wx.maxTemp : 30;
  var uv = wx ? wx.uvIndex : null;
  var rain = wx ? wx.rainChance : null;
  var duration = _tomorrowOuting ? _tomorrowOuting.duration : 3;

  // Base list (always)
  items.push('Water bottle (200ml+)');
  items.push('2\u20133 diapers + wipes + disposal bags');
  items.push('Change mat / waterproof sheet');
  items.push('Extra outfit (spit-up / spills)');
  items.push('Muslin cloth / thin blanket');

  // Age-adaptive
  if (ageM < 3) {
    items.push('Swaddle');
    items.push('Head support for carrier');
    items.push('Nursing cover');
  } else if (ageM < 6) {
    // Check teething
    if (_obIsTeethingActive()) items.push('Teething ring');
    items.push('Play mat');
  } else if (ageM < 9) {
    items.push('Portable food (see meal plan below)');
    items.push('Feeding spoon + bib');
    items.push('Sippy cup');
    if (_obIsTeethingActive()) items.push('Teething ring');
  } else if (ageM < 12) {
    items.push('Finger foods in container');
    items.push('Sippy cup + bib');
  } else {
    items.push('Snack container');
    items.push('Sippy cup');
    items.push('Small toy or book');
  }

  // Condition-adaptive
  if (temp >= 30) {
    items.push('Coconut water / ORS sachet');
    items.push('Sun hat');
  }
  if (temp >= 35) {
    items.push('Extra water');
    items.push('Cotton cap');
  }
  if (uv !== null && uv >= 6) {
    if (ageM >= 6) items.push('Baby-safe sunscreen');
    if (!items.some(function(i) { return i.indexOf('Sun hat') >= 0; })) items.push('Sun hat');
  }
  if (rain !== null && rain > 20) {
    items.push('Rain cover / umbrella');
  }
  if (temp < 20) {
    items.push('Warm hat + socks');
    items.push('Blanket');
  }

  // Duration-adaptive
  if (duration > 3) {
    items.push('Extra diapers (double)');
    items.push('Extra outfit (#2)');
  }

  // Medical context
  var vitD3Needed = _obCheckVitD3();
  if (vitD3Needed) items.push('Vitamin D3 drops');

  if (_obIsTeethingActive() && !items.some(function(i) { return i.indexOf('Teething') >= 0; })) {
    items.push('Teething ring (chilled if possible)');
  }

  var activeIllness = _obGetActiveIllness();
  if (activeIllness) {
    items.push('Thermometer + prescribed medication');
  }

  var postVacc = _obCheckPostVaccine();
  if (postVacc) {
    items.push('Paracetamol (Calpol) \u2014 post-vaccine');
  }

  // Deduplicate (preserve order, keep first occurrence)
  var seen = {};
  items = items.filter(function(item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });

  return items;
}

function _obRenderPackList(wx, ageM) {
  var items = _obGetPackList(wx, ageM);
  var total = items.length;

  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-sage">' + zi('check') + '</span> PACK LIST</div>';
  html += '<div class="ob-pack-progress"><span id="obPackCount">0 of ' + total + ' packed</span><div class="ob-pack-bar"><div class="ob-pack-bar-fill" id="obPackBar"></div></div></div>';
  html += '<div class="ob-pack-list">';

  items.forEach(function(item, idx) {
    html += '<div class="ob-pack-item" data-ob-idx="' + idx + '">';
    html += '<div class="ob-pack-check"><span class="icon">' + zi('check') + '</span></div>';
    html += '<div class="ob-pack-label">' + escHtml(item) + '</div>';
    html += '</div>';
  });

  html += '</div></div>';
  return html;
}

function _obWirePackList(body) {
  var items = body.querySelectorAll('.ob-pack-item');
  var total = items.length;

  items.forEach(function(item) {
    item.addEventListener('click', function() {
      this.classList.toggle('checked');
      // Update progress
      var checked = body.querySelectorAll('.ob-pack-item.checked').length;
      var countEl = document.getElementById('obPackCount');
      var barEl = document.getElementById('obPackBar');
      if (countEl) countEl.textContent = checked + ' of ' + total + ' packed';
      if (barEl) barEl.style.width = (total > 0 ? Math.round(checked / total * 100) : 0) + '%';
    });
  });
}

function _obRenderMeal(outing) {
  var portableMeals = _outingGetPortableMeals(outing.portableMeal);
  if (!portableMeals || portableMeals.length === 0) return '';

  var mealLabel = outing.portableMeal.toUpperCase();
  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-peach">' + zi('bowl') + '</span> PORTABLE ' + escHtml(mealLabel) + '</div>';

  // Starred pick
  var top = portableMeals[0];
  var acceptRate = getFoodAcceptanceRate(top.base);
  var acceptLabel = acceptRate > 0 ? ', she eats ' + Math.round(acceptRate) + '%' : '';

  html += '<div class="ob-meal-pick">';
  html += '<div class="ob-meal-star"><span class="icon">' + zi('star') + '</span> ' + escHtml(top.name) + '</div>';
  html += '<div class="ob-meal-reason">' + escHtml(top.reason + acceptLabel) + '</div>';
  html += '</div>';

  // Alternatives
  for (var i = 1; i < portableMeals.length; i++) {
    html += '<div class="ob-meal-alt"><span class="icon icon-sage">' + zi('sparkle') + '</span> Alt: ' + escHtml(portableMeals[i].name) + '</div>';
  }

  // Prep tips
  var tips = [];
  portableMeals.forEach(function(p) {
    var base = p.base;
    if (PORTABLE_PREP_TIPS[base]) tips.push(PORTABLE_PREP_TIPS[base]);
  });
  if (tips.length > 0) {
    html += '<div class="ob-meal-tip"><span class="icon">' + zi('bulb') + '</span> ' + escHtml(tips.slice(0, 2).join(' ')) + '</div>';
  }

  html += '</div>';
  return html;
}

function _obRenderHydration(hydCtx, wx) {
  var temp = wx ? wx.maxTemp : null;
  var html = '';
  var sectionClass = 'ob-section';
  var iconColor = 'sky';

  // When briefing is open, outing exists, so hydCtx should be active.
  // Use hydCtx level if available; derive from wx temp as fallback only.
  var level = 'note';
  if (hydCtx && hydCtx.active) {
    level = hydCtx.level;
  } else if (temp !== null) {
    // Fallback: hydCtx unavailable (e.g. weather cache miss in _getTomorrowTemp)
    if (temp >= 35) level = 'prominent';
    else if (temp >= 30) level = 'full';
    else level = 'note';
  } else {
    return '';
  }

  if (level === 'prominent') {
    sectionClass += ' ob-hydration-prominent';
    iconColor = 'rose';
  } else if (level === 'full') {
    sectionClass += ' ob-hydration-full';
  }

  html += '<div class="' + sectionClass + '">';
  html += '<div class="ob-section-title"><span class="icon icon-' + iconColor + '">' + zi('drop') + '</span> HYDRATION</div>';
  html += '<div class="ob-hydration-schedule">';

  var ageM = getAgeInMonths();

  if (level === 'prominent') {
    html += '<div class="ob-hydration-item"><span class="icon icon-rose">' + zi('flame') + '</span> Very hot day \u2014 hydration critical</div>';
    html += '<div class="ob-hydration-item"><span class="icon icon-rose">' + zi('drop') + '</span> Breastfeed every 1.5 hrs (not 2)</div>';
    if (ageM >= 6) {
      html += '<div class="ob-hydration-item"><span class="icon icon-rose">' + zi('drop') + '</span> Offer water sips between feeds</div>';
    }
    html += '<div class="ob-hydration-item"><span class="icon icon-rose">' + zi('bowl') + '</span> Coconut water if out > 2 hrs</div>';
    html += '<div class="ob-hydration-item"><span class="icon icon-rose">' + zi('warn') + '</span> Watch for: flushed skin, fussiness, fewer wet diapers</div>';
  } else if (level === 'full') {
    html += '<div class="ob-hydration-item"><span class="icon icon-sky">' + zi('drop') + '</span> Warm day \u2014 offer fluids frequently</div>';
    if (ageM >= 6) {
      html += '<div class="ob-hydration-item"><span class="icon icon-sky">' + zi('drop') + '</span> Offer water sips every 30 min</div>';
    }
    html += '<div class="ob-hydration-item"><span class="icon icon-sky">' + zi('bowl') + '</span> Carry coconut water or buttermilk</div>';
  } else {
    html += '<div class="ob-hydration-item"><span class="icon icon-sky">' + zi('drop') + '</span> Carry water \u2014 offer sips every 30 min</div>';
  }

  html += '</div></div>';
  return html;
}

function _obRenderDressCode(wx) {
  if (!wx) return '';
  var temp = wx.maxTemp;
  var code = '';
  if (temp >= 35) code = 'Loose cotton, light colors only. No synthetic fabrics. Sun hat mandatory.';
  else if (temp >= 30) code = 'Light cotton outfit, sun hat recommended. Carry a thin muslin for shade.';
  else if (temp >= 25) code = 'Comfortable cotton outfit. Light jacket in bag if going to AC places.';
  else if (temp >= 20) code = 'Light layers \u2014 cotton base + thin jacket. Socks recommended.';
  else if (temp >= 15) code = 'Warm layers \u2014 cotton inner + warm outer. Hat, socks, blanket.';
  else code = 'Full warm outfit \u2014 thermals if available, warm hat, mittens, blanket.';

  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-lav">' + zi('baby') + '</span> DRESS CODE</div>';
  html += '<div class="ob-dress-code">' + escHtml(code) + '</div>';
  html += '</div>';
  return html;
}

function _obRenderActivity(outing) {
  var slot = outing.timeSlot;
  var covers = '';
  var focus = '';

  // Infer activity domains from outing
  if (slot === 'morning') {
    covers = 'Morning outing covers motor + sensory domains';
    focus = 'Focus on language at home \u2014 afternoon board book session.';
  } else if (slot === 'afternoon') {
    covers = 'Afternoon outing covers motor + sensory domains';
    focus = 'Focus on language at home \u2014 morning board book session.';
  } else {
    covers = 'Evening outing covers sensory + social domains';
    focus = 'Motor + language activities earlier in the day.';
  }

  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-sage">' + zi('run') + '</span> ACTIVITY</div>';
  html += '<div class="ob-activity-note">' + escHtml(covers) + ' ' + escHtml(focus) + '</div>';
  html += '</div>';
  return html;
}

function _obRenderMedical() {
  var items = [];

  // Vit D3 check
  var vitD3 = _obCheckVitD3();
  if (vitD3) {
    items.push({ icon: 'pill', color: 'sky', text: 'Give Vit D3 before leaving (if not already given today)' });
  }

  // Next vaccination
  var nextVacc = _obGetNextVaccine();
  if (nextVacc) {
    items.push({ icon: 'syringe', color: 'lav', text: nextVacc });
  }

  // Active illness
  var illness = _obGetActiveIllness();
  if (illness) {
    items.push({ icon: 'siren', color: 'rose', text: 'Active ' + illness + ' \u2014 carry prescribed meds, monitor temperature' });
  }

  // Post-vaccine
  var postVacc = _obCheckPostVaccine();
  if (postVacc) {
    items.push({ icon: 'shield', color: 'amber', text: postVacc });
  }

  if (items.length === 0) return '';

  var html = '<div class="ob-section">';
  html += '<div class="ob-section-title"><span class="icon icon-sky">' + zi('medical') + '</span> MEDICAL</div>';

  items.forEach(function(item) {
    html += '<div class="ob-medical-item"><span class="icon icon-' + item.color + '">' + zi(item.icon) + '</span> ' + escHtml(item.text) + '</div>';
  });

  html += '</div>';
  return html;
}

// ── Outing Briefing Helpers ──

function _obIsTeethingActive() {
  // Check milestones for teething-related entries
  if (!milestones) return false;
  var now = Date.now();
  return milestones.some(function(m) {
    if (!m || !m.name) return false;
    var name = m.name.toLowerCase();
    if (name.indexOf('teeth') < 0 && name.indexOf('teething') < 0) return false;
    // If milestone is in progress (emerging/practicing)
    return m.status === 'emerging' || m.status === 'practicing';
  });
}

function _obCheckVitD3() {
  // Check if Vit D3 hasn't been given today
  var todayStr = today();
  var dayEntry = medChecks ? medChecks[todayStr] : null;
  if (!dayEntry) return true;
  // Check all meds for D3
  var d3Given = false;
  var d3Found = false;
  var activeMeds = (meds || []).filter(function(m) { return m.active; });
  activeMeds.forEach(function(m) {
    if (m.name && m.name.toLowerCase().indexOf('d3') >= 0) {
      d3Found = true;
      var status = dayEntry[m.name];
      if (status && status.indexOf('done') === 0) d3Given = true;
    }
  });
  // If no D3 med tracked, or D3 not given today
  if (!d3Given) return true;
  return false;
}

function _obGetNextVaccine() {
  if (!vaccData) return null;
  var todayStr = today();
  var todayMs = new Date(todayStr).getTime();
  var nextVacc = null;
  var nextDate = null;

  vaccData.forEach(function(v) {
    if (!v.upcoming || !v.date) return;
    var vDate = new Date(v.date);
    var diffDays = Math.ceil((vDate.getTime() - todayMs) / 86400000);
    if (diffDays >= 0 && diffDays <= 7) {
      if (!nextDate || v.date < nextDate) {
        nextDate = v.date;
        nextVacc = v.name;
      }
    }
  });

  if (nextVacc && nextDate) {
    var diffDays = Math.ceil((new Date(nextDate).getTime() - todayMs) / 86400000);
    if (diffDays === 0) return 'Next vaccine: ' + nextVacc + ' (today)';
    return 'Next vaccine: ' + nextVacc + ' on ' + formatDate(nextDate) + ' (' + diffDays + ' day' + (diffDays !== 1 ? 's' : '') + ' away)';
  }
  return null;
}

function _obGetActiveIllness() {
  try {
    var episodes = _getAllEpisodes();
    var active = episodes.filter(function(ep) { return ep.status === 'active'; });
    if (active.length === 0) return null;
    return active.map(function(ep) { return ep.illnessType; }).join(', ');
  } catch(e) { return null; }
}

function _obCheckPostVaccine() {
  if (!vaccData) return null;
  var todayStr = today();
  var todayMs = new Date(todayStr).getTime();

  // Check if any vaccine was given in the last 48 hours
  var recent = vaccData.filter(function(v) {
    if (v.upcoming || !v.date) return false;
    var vMs = new Date(v.date).getTime();
    return (todayMs - vMs) >= 0 && (todayMs - vMs) <= 2 * 86400000;
  });

  if (recent.length > 0) {
    return 'Post-vaccine day \u2014 watch for fever, carry Calpol';
  }
  return null;
}

function renderOutingPlannerCard() {
  var card = document.getElementById('outingPlannerCard');
  var content = document.getElementById('outingPlannerContent');
  if (!card || !content) return;

  card.style.display = '';
  var label = _outingTargetLabel(); // 'today' or 'tomorrow'

  if (_tomorrowOuting && _tomorrowOuting.date) {
    // Check if outing is for today or tomorrow — match label
    var isForToday = _tomorrowOuting.date === today();
    var isForTomorrow = _tomorrowOuting.date === _offsetDateStr(today(), 1);
    if (!isForToday && !isForTomorrow) {
      // Stale outing from a past date — clear it
      _outingClear();
    }
  }

  if (_tomorrowOuting) {
    // Outing is planned — show compact badge with details
    var o = _tomorrowOuting;
    var forLabel = o.date === today() ? 'Today' : 'Tomorrow';
    var html = '<div class="tp-outing-toggle active">';
    html += '<div>';
    html += '<div class="tp-outing-toggle-label"><span class="icon icon-sage">' + zi('sun') + '</span> ' + forLabel + '\'s Outing</div>';
    html += '<div class="tp-outing-toggle-sub">' + escHtml(o.timeSlot.charAt(0).toUpperCase() + o.timeSlot.slice(1)) + ' \u00B7 ~' + o.duration + ' hrs';
    if (o.portableMeal) html += ' \u00B7 Portable ' + o.portableMeal;
    html += '</div>';
    html += '</div>';
    html += '<button class="outing-clear-btn" id="outingCardClear">\u00D7 Clear</button>';
    html += '</div>';
    content.innerHTML = html;

    var clr = content.querySelector('#outingCardClear');
    if (clr) {
      clr.addEventListener('click', function(e) {
        e.stopPropagation();
        _outingClear();
        renderOutingPlannerCard();
        // Re-render TP if visible
        if (typeof renderTomorrowPrep === 'function') renderTomorrowPrep();
      });
    }
    // Tap badge to open briefing
    var toggle = content.querySelector('.tp-outing-toggle.active');
    if (toggle) {
      toggle.addEventListener('click', function() { openOutingBriefing(); });
    }
  } else {
    // No outing — show toggle with inline config
    var html = '<div class="tp-outing-toggle" id="outingCardToggle">';
    html += '<div>';
    html += '<div class="tp-outing-toggle-label"><span class="icon icon-sage">' + zi('sun') + '</span> Going out ' + label + '?</div>';
    html += '<div class="tp-outing-toggle-sub">Adjusts meals, hydration, and activities</div>';
    html += '</div>';
    html += '<label class="toggle-switch-wrap"><input type="checkbox" class="toggle-switch-input" id="outingCardSwitch"><span class="toggle-track"></span></label>';
    html += '</div>';

    html += '<div class="tp-outing-config" id="outingCardConfig">';
    html += '<div class="outing-row-label">Duration</div>';
    html += '<div class="outing-chips" data-outing-group="duration">';
    html += '<button class="outing-chip" data-outing-val="1.5">1\u20132 hrs</button>';
    html += '<button class="outing-chip" data-outing-val="3">2\u20134 hrs</button>';
    html += '<button class="outing-chip" data-outing-val="5">4+ hrs</button>';
    html += '</div>';
    html += '<div class="outing-row-label" style="margin-top:var(--sp-6);">Time of day</div>';
    html += '<div class="outing-chips" data-outing-group="timeSlot">';
    html += '<button class="outing-chip" data-outing-val="morning">Morning</button>';
    html += '<button class="outing-chip" data-outing-val="afternoon">Afternoon</button>';
    html += '<button class="outing-chip" data-outing-val="evening">Evening</button>';
    html += '</div>';
    html += '<button class="outing-submit-btn" id="outingCardSaveBtn">Save outing plan</button>';
    html += '</div>';

    content.innerHTML = html;

    // Toggle handler
    var sw = content.querySelector('#outingCardSwitch');
    if (sw) {
      sw.addEventListener('change', function() {
        var cfg = content.querySelector('#outingCardConfig');
        var tog = content.querySelector('#outingCardToggle');
        if (this.checked) {
          if (cfg) cfg.classList.add('open');
          if (tog) tog.classList.add('active');
        } else {
          if (cfg) cfg.classList.remove('open');
          if (tog) tog.classList.remove('active');
        }
      });
    }

    // Chip handlers
    content.querySelectorAll('#outingCardConfig .outing-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        this.parentElement.querySelectorAll('.outing-chip').forEach(function(c) { c.classList.remove('selected'); });
        this.classList.add('selected');
      });
    });

    // Save handler
    var saveBtn = content.querySelector('#outingCardSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var cfg = content.querySelector('#outingCardConfig');
        if (!cfg) return;
        var durSel = cfg.querySelector('[data-outing-group="duration"] .outing-chip.selected');
        var timeSel = cfg.querySelector('[data-outing-group="timeSlot"] .outing-chip.selected');
        if (!durSel || !timeSel) {
          if (!durSel) { var dg = cfg.querySelector('[data-outing-group="duration"]'); if (dg) { dg.style.outline = '2px solid var(--tc-caution)'; setTimeout(function() { dg.style.outline = ''; }, 1500); } }
          if (!timeSel) { var tg = cfg.querySelector('[data-outing-group="timeSlot"]'); if (tg) { tg.style.outline = '2px solid var(--tc-caution)'; setTimeout(function() { tg.style.outline = ''; }, 1500); } }
          return;
        }
        var targetDate = _outingTargetDate();
        var duration = parseFloat(durSel.getAttribute('data-outing-val'));
        var timeSlot = timeSel.getAttribute('data-outing-val');
        var portableMeal = null;
        if (duration >= 2) {
          if (timeSlot === 'morning') portableMeal = 'breakfast';
          else if (timeSlot === 'afternoon') portableMeal = 'lunch';
          else if (timeSlot === 'evening') portableMeal = 'dinner';
        }
        _tomorrowOuting = { date: targetDate, duration: duration, timeSlot: timeSlot, portableMeal: portableMeal, skipActivitySlot: timeSlot };
        save(KEYS.tomorrowOuting, _tomorrowOuting);
        renderOutingPlannerCard();
        if (typeof renderTomorrowPrep === 'function') renderTomorrowPrep();
      });
    }
  }
}

// Fetch tomorrow's forecast for outing planning
function _outingFetchForecast() {
  var targetDate = _tomorrowOuting ? _tomorrowOuting.date : _outingTargetDate();
  var wx = getWeatherForDate(targetDate);
  // If we have cached data with uvIndex already, return it
  if (wx && wx.uvIndex !== undefined) return Promise.resolve(wx);

  var lat = 22.8, lon = 86.18;
  return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&daily=temperature_2m_max,relative_humidity_2m_max,weather_code,uv_index_max,precipitation_probability_max&timezone=Asia/Kolkata&start_date=' + targetDate + '&end_date=' + targetDate)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.daily && data.daily.time && data.daily.time.length > 0) {
        var wxData = {
          maxTemp: Math.round(data.daily.temperature_2m_max[0]),
          humidity: Math.round(data.daily.relative_humidity_2m_max[0]),
          code: data.daily.weather_code[0],
          uvIndex: data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[0]) : null,
          rainChance: data.daily.precipitation_probability_max ? Math.round(data.daily.precipitation_probability_max[0]) : null
        };
        _weatherCache[targetDate] = wxData;
        saveWeatherCache();
        return wxData;
      }
      return null;
    })
    .catch(function() { return null; });
}

// ── Outing Answer Card ──

function qaHandleOuting(classified) {
  // Show the outing form for user to fill in details
  _outingRenderForm();
  return null; // answer card generated after form submit
}

function _qaExecuteOuting(classified) {
  var answerEl = document.getElementById('qaAnswerContainer');
  if (!answerEl) return;

  _outingFetchForecast().then(function(wx) {
    var temp = wx ? wx.maxTemp : null;
    var outing = _tomorrowOuting;
    if (!outing) return;

    var sections = [];
    var headline = 'Outing planned: ' + outing.timeSlot + ', ~' + outing.duration + ' hours';

    // Meal adjustments
    if (outing.portableMeal) {
      var portableIdeas = _outingGetPortableMeals(outing.portableMeal);
      sections.push({
        label: 'PORTABLE ' + outing.portableMeal.toUpperCase(),
        icon: zi('bowl'),
        items: portableIdeas.map(function(p) { return { text: p.name + ' \u2014 ' + p.reason, signal: 'good' }; })
      });
    }

    // Compensatory meal
    if (outing.timeSlot === 'afternoon' && outing.portableMeal === 'lunch') {
      sections.push({
        label: 'DINNER ADJUSTMENT',
        icon: zi('moon'),
        items: [{ text: 'Plan a heavier dinner to compensate for lighter portable lunch \u2014 dal + rice + veg combo recommended', signal: 'info' }]
      });
    }

    // Hydration (only relevant outdoors)
    if (temp !== null && temp >= 30) {
      var hydItems = [];
      hydItems.push({ text: 'Pack coconut water or buttermilk \u2014 offer breast milk every 1.5 hrs instead of 2 hrs', signal: 'info' });
      if (temp >= 35) {
        hydItems.push({ text: 'Very hot day (' + temp + '\u00B0C) \u2014 consider early morning outing or shorter duration', signal: 'warn' });
      }
      hydItems.push({ text: 'Carry ORS sachet as backup', signal: 'neutral' });
      sections.push({ label: 'HYDRATION PLAN', icon: zi('drop'), items: hydItems });
    }

    // Activity adjustment
    sections.push({
      label: 'ACTIVITY NOTE',
      icon: zi('run'),
      items: [{ text: outing.timeSlot.charAt(0).toUpperCase() + outing.timeSlot.slice(1) + ' motor activity covered by the outing \u2014 focus on language or cognitive at home', signal: 'good' }]
    });

    // Pack list
    var packItems = ['Water bottle', 'Banana or mashed fruit', 'Sun hat'];
    if (temp !== null && temp >= 32) packItems.push('Coconut water');
    if (outing.duration >= 3) packItems.push('Extra change of clothes');
    sections.push({
      label: 'PACK LIST',
      icon: zi('check'),
      items: [{ text: packItems.join(', '), signal: 'neutral' }]
    });

    var answer = {
      icon: 'sun',
      domain: 'activity',
      title: 'Outing Plan',
      headline: headline,
      sections: sections,
      dataGap: temp !== null ? 'Forecast: ' + temp + '\u00B0C' : 'Weather data unavailable'
    };

    qaRenderAnswer(answerEl, answer);
  });
}

function _outingGetPortableMeals(meal) {
  // Foods that are portable (no reheating, won't spoil in 2-3 hrs)
  var portableFoods = [
    { name: 'Banana', reason: 'Easy to carry, energy-dense', base: 'banana' },
    { name: 'Ragi ladoo', reason: 'Pre-made, iron-rich, portable', base: 'ragi' },
    { name: 'Date + nut ball', reason: 'Energy-dense, no-spill', base: 'date (fruit)' },
    { name: 'Mashed avocado in container', reason: 'Healthy fats, easy to feed', base: 'avocado' },
    { name: 'Apple puree (pre-made)', reason: 'Can be pre-made and carried', base: 'apple' },
    { name: 'Sattu drink', reason: 'Cooling, protein-rich, easy to carry', base: 'sattu' }
  ];

  // Filter to introduced foods only
  var introduced = (foods || []).map(function(f) { return _baseFoodName(f.name.toLowerCase().trim()); });
  var introSet = new Set(introduced);
  var eligible = portableFoods.filter(function(p) {
    return introSet.has(p.base);
  });

  if (eligible.length < 2) {
    eligible.push({ name: 'Banana mash', reason: 'Always portable, always available', base: 'banana' });
  }

  // Favorites boost: sort favorite foods first
  eligible.sort(function(a, b) {
    var af = isFoodFavorite(a.base) ? 1 : 0;
    var bf = isFoodFavorite(b.base) ? 1 : 0;
    return bf - af;
  });

  return eligible.slice(0, 3);
}

// ── Hydration Context ──

var _powerOutageCached = null;
var _powerOutageCachedAt = 0;

function _isHydrationActive() {
  // Hydration is only relevant when baby is outdoors (outing) or AC is down (power outage)
  if (_tomorrowOuting) return true;
  // Cache powerOutage for 30 seconds to avoid localStorage reads in hot loops
  var now = Date.now();
  if (_powerOutageCached === null || now - _powerOutageCachedAt > 30000) {
    _powerOutageCached = !!load(KEYS.powerOutage, false);
    _powerOutageCachedAt = now;
  }
  return _powerOutageCached;
}

function _getTomorrowTemp() {
  // Use outing date if planned, otherwise tomorrow
  var targetDate = _tomorrowOuting && _tomorrowOuting.date ? _tomorrowOuting.date : _offsetDateStr(today(), 1);
  var wx = getWeatherForDate(targetDate);
  return wx ? wx.maxTemp : null;
}

function _getHydrationContext() {
  // Returns null if hydration is noise (indoors + AC), otherwise returns context object
  if (!_isHydrationActive()) return null;

  var temp = _getTomorrowTemp();
  if (temp === null) return null;

  var isOuting = !!_tomorrowOuting;
  var level = 'none'; // none | note | full | prominent

  if (isOuting) {
    if (temp >= 35) level = 'prominent';
    else if (temp >= 30) level = 'full';
    else level = 'note';
  } else {
    // Power outage mode — no AC
    if (temp >= 35) level = 'prominent';
    else if (temp >= 32) level = 'full';
    else if (temp >= 30) level = 'note';
  }

  return {
    active: level !== 'none',
    level: level,
    temp: temp,
    isOuting: isOuting,
    isPowerOutage: !isOuting,
    scoringBoost: level === 'prominent' ? 20 : level === 'full' ? 15 : level === 'note' ? 8 : 0
  };
}

// ── Power Outage Toggle Init ──

function _initPowerOutageToggle() {
  var toggle = document.getElementById('settingsPowerOutage');
  if (!toggle) return;
  toggle.checked = !!load(KEYS.powerOutage, false);
  toggle.addEventListener('change', function() {
    save(KEYS.powerOutage, this.checked);
    _powerOutageCached = this.checked;
    _powerOutageCachedAt = Date.now();
  });
}

// ── Mine Meal Patterns from History ──

function _tpMineMealPatterns() {
  var patterns = { breakfast: { combos: [] }, lunch: { combos: [] }, dinner: { combos: [] } };
  var comboMap = { breakfast: {}, lunch: {}, dinner: {} };
  var feedDates = Object.keys(feedingData).sort();

  feedDates.forEach(function(ds) {
    var entry = feedingData[ds];
    if (!entry) return;
    ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
      var mealStr = entry[meal];
      if (!mealStr || typeof mealStr !== 'string' || mealStr.trim() === '') return;
      var mealFoods = mealStr.split(',').map(function(f) { return _baseFoodName(f.trim().toLowerCase()); }).filter(function(f) { return f.length > 0; });
      if (mealFoods.length === 0) return;

      var key = mealFoods.slice().sort().join('|');
      if (!comboMap[meal][key]) {
        comboMap[meal][key] = { foods: mealFoods, count: 0, dates: [], totalIntake: 0 };
      }
      comboMap[meal][key].count++;
      comboMap[meal][key].dates.push(ds);
      comboMap[meal][key].totalIntake += _miGetIntake(ds, meal);
    });
  });

  ['breakfast', 'lunch', 'dinner'].forEach(function(meal) {
    var combos = Object.values(comboMap[meal]);
    combos.forEach(function(c) {
      c.avgIntake = c.count > 0 ? Math.round((c.totalIntake / c.count) * 100) / 100 : 0.75;
      c.lastDate = c.dates.length > 0 ? c.dates[c.dates.length - 1] : null;
    });
    combos.sort(function(a, b) { return b.count - a.count; });
    patterns[meal].combos = combos;
  });

  return patterns;
}

// ════════════════════════════════════════

// MILESTONE HISTORY (History tab)
// ─────────────────────────────────────────
function renderMilestoneHistory() {
  const container = document.getElementById('milestoneHistoryContent');
  if (!container) return;

  const done = milestones.filter(m => isMsDone(m));
  const inProgress = milestones.filter(m => isMsActive(m));
  const all = [...done, ...inProgress];


  if (all.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No milestones recorded yet.</div>';
    return;
  }

  // Latest milestone at top
  const latest = done.filter(m => m.doneAt).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  const latestMs = latest[0] || done[done.length - 1];

  const catMeta = {
    motor:    { icon:zi('run'), color:'var(--sage)', bg:'var(--sage-light)', textColor:'#3a7060' },
    language: { icon:zi('chat'), color:'var(--sky)', bg:'var(--sky-light)', textColor:'#3a7090' },
    social:   { icon:zi('handshake'), color:'var(--peach)', bg:'var(--peach-light)', textColor:'#926030' },
    cognitive:{ icon:zi('brain'), color:'var(--lavender)', bg:'var(--lav-light)', textColor:'var(--tc-lav)' },
  };

  let html = '';

  // Latest milestone highlight
  if (latestMs) {
    const cat = latestMs.cat || 'motor';
    const cm = catMeta[cat] || catMeta.motor;
    html += `
      <div style="display:flex;align-items:center;gap:var(--sp-12);padding:14px 16px;border-radius:var(--r-xl);background:${cm.bg};border-left:var(--accent-w) solid ${cm.color};margin-bottom:14px;">
        <div style="font-size:var(--icon-lg);">${cm.icon}</div>
        <div class="flex-1">
          <div style="font-size:var(--fs-sm);font-weight:600;text-transform:uppercase;letter-spacing:var(--ls-wide);color:var(--light);margin-bottom:2px;">Latest milestone</div>
          <div class="t-title" style="font-size:var(--fs-md);">${escHtml(latestMs.text)}</div>
          <div style="font-size:var(--fs-sm);color:${cm.textColor};margin-top:2px;">
            ${latestMs.doneAt ? zi('check') + ' Achieved ' + formatDate(latestMs.doneAt.split('T')[0]) + ' · ' + ageAtDate(latestMs.doneAt) : zi('check') + ' Achieved'}
            ${latestMs.advanced ? ' · <svg class="zi"><use href="#zi-star"/></svg> Advanced' : ''}
          </div>
        </div>
      </div>`;
  }

  // Timeline — all milestones sorted by date
  const timeline = [];
  done.forEach(m => {
    timeline.push({ ...m, sortDate: m.doneAt || '', type: 'done' });
  });
  inProgress.forEach(m => {
    timeline.push({ ...m, sortDate: m.inProgressAt || '', type: 'in_progress' });
  });
  timeline.sort((a, b) => {
    if (!a.sortDate && !b.sortDate) return 0;
    if (!a.sortDate) return 1;
    if (!b.sortDate) return -1;
    return new Date(b.sortDate) - new Date(a.sortDate);
  });

  html += '<div class="fx-col g8">';

  timeline.forEach(m => {
    const cat = m.cat || 'motor';
    const cm = catMeta[cat] || catMeta.motor;
    const isDone = m.type === 'done';
    const statusIcon = isDone ? zi('check') : zi('target');
    const statusText = isDone
      ? (m.doneAt ? formatDate(m.doneAt.split('T')[0]) + ' · ' + ageAtDate(m.doneAt) : 'Achieved')
      : (m.inProgressAt ? 'Started ' + formatDate(m.inProgressAt.split('T')[0]) + ' · ' + ageAtDate(m.inProgressAt) : 'In progress');

    html += `
      <div style="display:flex;align-items:center;gap:var(--sp-8);padding:8px 10px;border-radius:var(--r-lg);background:var(--glass);border-left:var(--accent-w) solid ${cm.color};">
        <span class="t-sm">${statusIcon}</span>
        <span class="t-sm">${cm.icon}</span>
        <div class="flex-1-min">
          <div class="t-title fw-600">${escHtml(m.text)}${m.advanced ? ' <svg class="zi"><use href="#zi-star"/></svg>' : ''}</div>
          <div style="font-size:var(--fs-sm);color:${cm.textColor};">${statusText}</div>
          ${_renderAttribution(m)}
        </div>
      </div>`;
  });

  html += '</div>';
  container.innerHTML = html;
}

function toggleHistoryCard(bodyId, chevronId) {
  const body = document.getElementById(bodyId);
  const chevron = document.getElementById(chevronId);
  if (!body.classList.contains('open')) {
    body.style.display = 'block';
    requestAnimationFrame(() => { body.classList.add('open'); });
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    if (bodyId === 'weightChartBody') setTimeout(() => drawChart(), 80);
    if (bodyId === 'heightChartBody') setTimeout(() => drawHeightChart(), 80);
  } else {
    body.classList.remove('open');
    setTimeout(() => { body.style.display = 'none'; }, 300);
    if (chevron) chevron.style.transform = '';
  }
}

// ─────────────────────────────────────────

// POOP TRACKER
// ─────────────────────────────────────────
let _poopColor = 'yellow';
let _poopConsistency = 'normal';
let _poopAmount = 'medium';
let _poopEditIdx = null;

const POOP_COLORS = {
  yellow:  { hex:'#e8c840', label:'Yellow' },
  green:   { hex:'#6b9e4a', label:'Green' },
  brown:   { hex:'#8b6914', label:'Brown' },
  dark:    { hex:'#3d2b1f', label:'Dark Brown' },
  orange:  { hex:'#e0882a', label:'Orange' },
  red:     { hex:'#c0392b', label:'Red' },
  white:   { hex:'#f0ede6', label:'White/Pale' },
  black:   { hex:'#1a1a1a', label:'Black' },
  tan:     { hex:'#d2b48c', label:'Tan' },
  mustard: { hex:'#c8a030', label:'Mustard' },
};

function _poopColorDot(colorKey) {
  const col = POOP_COLORS[colorKey] || POOP_COLORS.yellow;
  return '<span class="poop-color-circle pcc-sm" style="background:' + col.hex + ';"></span>';
}

const POOP_CONSISTENCY = {
  runny:   { label:'Runny' },
  soft:    { label:'Soft' },
  normal:  { label:'Normal' },
  hard:    { label:'Hard' },
  pellets: { label:'Pellets' },
  loose:   { label:'Loose' },
  watery:  { label:'Watery' },
};

const POOP_ALERT_COLORS = ['red','white','black'];

function setPoopColor(c) {
  _poopColor = c;
  document.querySelectorAll('.poop-color-btn').forEach(btn => {
    btn.classList.toggle('active-pq', btn.id === 'pc-' + c);
  });
}

function setPoopConsistency(c) {
  _poopConsistency = c;
  ['runny','soft','normal','hard','pellets'].forEach(v => {
    const el = document.getElementById('pcon-' + v);
    if (el) el.classList.toggle('active-pq', v === c);
  });
}

function setPoopAmount(a) {
  _poopAmount = a;
  ['small','medium','large'].forEach(v => {
    const el = document.getElementById('pamt-' + v);
    if (el) el.classList.toggle('active-pq', v === a);
  });
}

function updatePoopDayLabel() {
  updateSleepDayLabel('poopDate', 'poopDayLabel');
}

function getPoopsForDate(dateStr) {
  return poopData.filter(p => p.date === dateStr);
}

function getLastPoop() {
  if (poopData.length === 0) return null;
  const sorted = [...poopData].sort((a, b) => {
    const cmp = (b.date||'').localeCompare(a.date||'');
    if (cmp !== 0) return cmp;
    return (b.time || '').localeCompare(a.time || '');
  });
  return sorted[0];
}

function getAvgPoop7d() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  const counts = days.map(d => getPoopsForDate(d).length);
  const daysWithData = counts.filter(c => c > 0).length;
  if (daysWithData === 0) return 0;
  const total = counts.reduce((a, b) => a + b, 0);
  return +(total / 7).toFixed(1);
}

function getPoopStreak() {
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (true) {
    const ds = toDateStr(d);
    if (getPoopsForDate(ds).length === 0) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getTimeSinceLastPoop() {
  const last = getLastPoop();
  if (!last) return '—';
  const lastDate = new Date(last.date + 'T' + (last.time || '12:00'));
  const now = new Date();
  const diffMs = now - lastDate;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return '<1h ago';
  if (diffH < 24) return diffH + 'h ago';
  const diffD = Math.floor(diffH / 24);
  return diffD + 'd ago';
}

function addPoopEntry() {
  const dateEl = document.getElementById('poopDate');
  const timeEl = document.getElementById('poopTime');
  const notesEl = document.getElementById('poopNotes');
  const bloodEl = document.getElementById('poopBlood');
  const mucusEl = document.getElementById('poopMucus');
  const date = dateEl.value;
  const time = timeEl.value;
  if (!date) {
    alert('Please select a date.');
    return;
  }

  const entry = {
    date,
    time: time || null,
    color: _poopColor,
    consistency: _poopConsistency,
    amount: _poopAmount,
    blood: bloodEl.checked,
    mucus: mucusEl.checked,
    notes: notesEl.value.trim(),
    ts: new Date().toISOString()
  };

  if (_poopEditIdx !== null) {
    poopData[_poopEditIdx] = entry;
    _poopEditIdx = null;
  } else {
    poopData.push(entry);
  }

  poopData.sort((a, b) => {
    const cmp = (b.date||'').localeCompare(a.date||'');
    if (cmp !== 0) return cmp;
    return (b.time || '').localeCompare(a.time || '');
  });
  save(KEYS.poop, poopData);
  _tsfMarkDirty();
  resetPoopForm();
  _islMarkDirty('poop');
  renderPoop();
  renderHomePoop();
  setTimeout(drawPoopChart, 60);
}

function editPoopEntry(idx) {
  const entry = poopData[idx];
  if (!entry) return;
  _poopEditIdx = idx;
  document.getElementById('poopDate').value = entry.date;
  document.getElementById('poopTime').value = entry.time || '';
  document.getElementById('poopNotes').value = entry.notes || '';
  document.getElementById('poopBlood').checked = !!entry.blood;
  document.getElementById('poopMucus').checked = !!entry.mucus;
  setPoopColor(entry.color || 'yellow');
  setPoopConsistency(entry.consistency || 'normal');
  setPoopAmount(entry.amount || 'medium');
  updatePoopDayLabel();
  document.getElementById('poopSaveBtn').textContent = '✓ Update Poop Log';
  document.getElementById('poopCancelBtn').style.display = '';
  document.getElementById('poopFormCard').scrollIntoView({ behavior:'smooth', block:'start' });
}

function cancelPoopEdit() {
  _poopEditIdx = null;
  resetPoopForm();
}

function resetPoopForm() {
  document.getElementById('poopTime').value = '';
  document.getElementById('poopNotes').value = '';
  document.getElementById('poopBlood').checked = false;
  document.getElementById('poopMucus').checked = false;
  setPoopColor('yellow');
  setPoopConsistency('normal');
  setPoopAmount('medium');
  document.getElementById('poopSaveBtn').textContent = 'Save Poop Log';
  document.getElementById('poopCancelBtn').style.display = 'none';
  _poopEditIdx = null;
}

function deletePoopEntry(idx) {
  confirmAction('Delete this poop entry?', () => {
    const wasEditingThis = _poopEditIdx === idx;
    const wasEditingLater = _poopEditIdx !== null && _poopEditIdx > idx;
    poopData.splice(idx, 1);
    save(KEYS.poop, poopData);
    if (wasEditingThis) {
      resetPoopForm();
    } else if (wasEditingLater) {
      _poopEditIdx--;
    }
    renderPoop();
    renderHomePoop();
    setTimeout(drawPoopChart, 60);
  }, 'Delete');
}

function renderPoop() {
  const dateEl = document.getElementById('poopDate');
  if (dateEl && !dateEl.value) dateEl.value = today();
  updatePoopDayLabel();
  renderPoopStats();
  renderPoopLog();
  renderPoopGuide();
}

function renderPoopStats() {
  const el = document.getElementById('poopStats');
  if (!el) return;

  const todayPoops = getPoopsForDate(today());
  const avg = getAvgPoop7d();
  const timeSince = getTimeSinceLastPoop();
  const streak = getPoopStreak();

  el.innerHTML = `
    <div class="home-stat-pill hsp-amber" data-scroll-to="poopLogCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-diaper"/></svg></div>
      <div class="hsp-val">${todayPoops.length}</div>
      <div class="hsp-label">Today</div>
    </div>
    <div class="home-stat-pill hsp-amber" data-scroll-to="poopChartCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-bars"/></svg></div>
      <div class="hsp-val">${avg > 0 ? avg : '—'}</div>
      <div class="hsp-label">Avg / day (7d)</div>
    </div>
    <div class="home-stat-pill hsp-amber" data-scroll-to="poopLogCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-timer"/></svg></div>
      <div class="hsp-val">${timeSince}</div>
      <div class="hsp-label">Last poop</div>
    </div>
    <div class="home-stat-pill hsp-amber" data-scroll-to="poopLogCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-flame"/></svg></div>
      <div class="hsp-val">${streak > 0 ? streak + 'd' : '—'}</div>
      <div class="hsp-label">Log streak</div>
    </div>
  `;
  renderDomainHero('poop');
}

function renderPoopLog() {
  const el = document.getElementById('poopLogList');
  const countEl = document.getElementById('poopLogCount');
  const previewEl = document.getElementById('poopLogPreview');
  if (!el) return;

  if (countEl) countEl.textContent = `${poopData.length} entries`;

  // Preview
  if (previewEl) {
    const todayPoops = getPoopsForDate(today());
    const last = getLastPoop();
    let html = '';
    if (todayPoops.length > 0) {
      const colors = todayPoops.map(p => _poopColorDot(p.color)).join(' ');
      html += `<div class="info-strip is-amber"><span><svg class="zi"><use href="#zi-diaper"/></svg></span><div><strong class="tc-amber">${todayPoops.length} poop${todayPoops.length>1?'s':''} today</strong> ${colors}<div class="t-sub">${todayPoops.map(p => formatTimeShort(p.time)).filter(t => t !== '—').join(', ') || 'Times not logged'}</div></div></div>`;
    } else if (last) {
      html += `<div class="info-strip is-amber"><span><svg class="zi"><use href="#zi-diaper"/></svg></span><div><strong class="tc-amber">Last: ${formatDate(last.date)}</strong><div class="t-sub">${getTimeSinceLastPoop()} · ${POOP_COLORS[last.color]?.label || last.color} · ${POOP_CONSISTENCY[last.consistency]?.label || last.consistency}</div></div></div>`;
    } else {
      html = `<div class="info-strip is-neutral"><span><svg class="zi"><use href="#zi-diaper"/></svg></span><div class="t-sub">No poop entries yet</div></div>`;
    }
    // Alert for concerning colours
    const recentAlerts = poopData.filter(p => {
      const daysDiff = Math.floor((new Date() - new Date(p.date)) / 86400000);
      return daysDiff <= 2 && (POOP_ALERT_COLORS.includes(p.color) || p.blood);
    });
    if (recentAlerts.length > 0) {
      html += `<div class="info-strip is-danger mt-6"><span><svg class="zi"><use href="#zi-warn"/></svg></span><div><strong>Talk to your doctor</strong><div class="t-sub">${recentAlerts[0].blood ? 'Blood detected' : (POOP_COLORS[recentAlerts[0].color]?.label || recentAlerts[0].color) + ' colour'} — may need attention</div></div></div>`;
    }
    previewEl.innerHTML = html;
  }

  // Full log
  const recent = poopData.slice(0, 30);
  if (recent.length === 0) {
    el.innerHTML = `<div class="t-sub" style="text-align:center;padding:20px;">No entries yet. Log Ziva's first poop!</div>`;
    return;
  }

  el.innerHTML = recent.map((p) => {
    const realIdx = poopData.indexOf(p);
    const col = POOP_COLORS[p.color] || POOP_COLORS.yellow;
    const con = POOP_CONSISTENCY[p.consistency] || POOP_CONSISTENCY.normal;
    const amtLabel = { small:'S', medium:'M', large:'L' }[p.amount] || 'M';
    const flagBadges = [];
    if (p.blood) flagBadges.push(`<span class="poop-badge" style="background:var(--rose-light);color:var(--tc-rose);">${zi('drop')} Blood</span>`);
    if (p.mucus) flagBadges.push(`<span class="poop-badge" style="background:var(--sky-light);color:var(--tc-sky);">${zi('drop')} Mucus</span>`);
    if (POOP_ALERT_COLORS.includes(p.color)) flagBadges.push(`<span class="poop-badge" style="background:var(--rose-light);color:var(--tc-rose);">${zi('warn')}</span>`);
    const notesHtml = p.notes ? `<div class="t-sub">${escHtml(p.notes)}</div>` : '';
    return `
      <div class="poop-entry-card">
        <div class="poop-entry-header">
          <div data-action="editPoopEntry" data-arg="${realIdx}" style="cursor:pointer;flex:1;">
            <div class="poop-entry-time">${zi('diaper')} ${formatTimeShort(p.time)} <span class="poop-color-circle" style="background:${col.hex};margin-left:4px;"></span></div>
            <div class="poop-entry-meta">
              <span class="t-sub">${formatDate(p.date)}</span>
              <span class="poop-badge badge-amber" >${col.label}</span>
              <span class="poop-badge badge-amber" >${con.label}</span>
              <span class="poop-badge badge-amber" >${amtLabel}</span>
              ${flagBadges.join('')}
            </div>
            ${_renderAttribution(p)}
          </div>
          <div class="d-flex items-center gap-4">
            <button data-action="editPoopEntry" data-arg="${realIdx}" class="btn-icon-amber" aria-label="Edit entry">Edit</button>
            <button data-action="deletePoopEntry" data-arg="${realIdx}" class="btn-icon-delete" aria-label="Delete entry">&times;</button>
          </div>
        </div>
        ${notesHtml}
      </div>
    `;
  }).join('');
}

let _poopChart = null;
function drawPoopChart() {
  const canvas = document.getElementById('poopChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');

  const labels = [];
  const countData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    labels.push(d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric' }));
    countData.push(getPoopsForDate(ds).length);
  }

  if (_poopChart) _poopChart.destroy();
  const _ct = getChartTheme();
  _poopChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Poops',
        data: countData,
        backgroundColor: countData.map(c => c === 0 ? 'rgba(232,184,109,0.2)' : 'rgba(232,184,109,0.7)'),
        borderRadius: _ct.barRadius,
        barPercentage: _ct.barPercentage,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          ..._ct.tooltip,
          callbacks: {
            label: ctx => `${ctx.raw} poop${ctx.raw !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: { grid: { display:false }, ticks: { color:_ct.textColor, font:_ct.font } },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: _ct.textColor,
            font: _ct.font,
            callback: v => Number.isInteger(v) ? v : ''
          },
          grid: { color:_ct.gridColor(0.15) },
          title: { display:true, text:'Count', color:_ct.textColor, font:_ct.font }
        }
      }
    }
  });

  // Insight
  const insightEl = document.getElementById('poopChartInsight');
  if (insightEl) {
    const total = countData.reduce((a, b) => a + b, 0);
    const daysWithData = countData.filter(c => c > 0).length;
    if (total === 0) {
      insightEl.textContent = 'Start logging to see trends here.';
    } else {
      const avg = (total / 7).toFixed(1);
      insightEl.textContent = `7-day total: ${total} poops · ~${avg}/day · ${daysWithData}/7 days tracked`;
    }
  }
}

function renderPoopGuide() {
  const el = document.getElementById('poopGuide');
  if (!el) return;

  const ageM = ageAt().months;

  const categories = [
    {
      id: 'colors', icon: zi('palette'), label: 'Colour Guide', color: 'amber',
      tips: [
        { icon:zi('warn'), title:'Yellow / Mustard', text:'Completely normal for breastfed babies. Seedy, loose texture is typical. This is the gold standard (literally) for healthy baby poop.' },
        { icon:zi('dot-red'), title:'Brown / Tan', text:'Normal, especially after starting solids. Colour darkens as the diet diversifies. Most common colour for formula-fed and older babies.' },
        { icon:zi('check'), title:'Green', text:'Usually normal — can be caused by green vegetables (spinach, peas), iron supplements, or fast gut transit. Occasional green is fine; persistent green with diarrhoea warrants a call to the doctor.' },
        { icon:zi('warn'), title:'Orange', text:'Normal. Often seen after eating carrots, sweet potatoes, or squash. Nothing to worry about.' },
        { icon:'⬛', title:'Dark Brown', text:'Normal for older babies on a varied solid diet. Can also indicate iron-rich foods.' },
        { icon:zi('dot-red'), title:'Red ' + zi('warn'), text:'May indicate blood. Could be from beet/tomato (harmless) or an anal fissure, allergy, or infection. Contact your paediatrician if you see red and she hasn\'t eaten red foods.' },
        { icon:zi('warn'), title:'White / Pale ' + zi('warn'), text:'Rare but potentially serious. May indicate a bile duct issue. Contact your paediatrician promptly if you see chalky white or very pale stools.' },
        { icon:zi('warn'), title:'Black ' + zi('warn'), text:'Normal only in the first few days (meconium) or with iron supplements. After the newborn period, black tarry stools can indicate upper GI bleeding — contact your doctor.' },
      ]
    },
    {
      id: 'consistency', icon: zi('note'), label: 'Consistency Guide (Baby Bristol Scale)', color: 'sky',
      tips: [
        { icon:zi('drop'), title:'Type 1: Runny / Watery', text:'Very loose, mostly liquid. One or two episodes can be normal, but persistent watery stools may indicate diarrhoea or infection. Watch for dehydration signs (dry lips, fewer wet nappies, lethargy).' },
        { icon:zi('warn'), title:'Type 2: Soft / Mushy', text:'Soft, pudding-like consistency. This is normal and healthy for most babies, especially breastfed ones. The "ideal" baby poop.' },
        { icon:zi('check'), title:'Type 3: Formed / Normal', text:'Soft but holds shape, like a small sausage. Common once solids are established. Easy to pass — this is healthy.' },
        { icon:zi('warn'), title:'Type 4: Hard / Firm', text:'Compact and difficult to pass. May indicate constipation. Ensure adequate fluid intake, offer water with meals, and try fibre-rich foods (pear, prune, oats).' },
        { icon:zi('warn'), title:'Type 5: Pellets / Pebbles', text:'Small, round, hard balls. A sign of constipation. Baby may strain or cry. Increase fluids and fibre. If persistent (>3 days), consult your paediatrician.' },
      ]
    },
    {
      id: 'frequency', icon: zi('chart'), label: 'Frequency by Age', color: 'sage',
      tips: ageM <= 8 ? [
        { icon:zi('baby'), title:'6–8 months: 1–4 times/day', text:'Wide range is normal. Some babies go after every meal, others once a day. Breastfed babies can even skip days. As solids increase, frequency often decreases and consistency firms up.' },
        { icon:zi('timer'), title:'When to worry: no poop for 3+ days', text:'If she hasn\'t pooped in 3+ days AND seems uncomfortable (straining, crying, hard belly), consult your paediatrician. Some breastfed babies normally go less often.' },
        { icon:zi('chart'), title:'Solids change everything', text:'When starting solids, poop colour, smell, and frequency all change. This is normal. New foods = new poop. Give the gut 2–3 days to adjust to each new food.' },
        { icon:zi('spoon'), title:'Food-poop connection', text:'Track which foods cause changes. Common culprits: bananas (can constipate), prunes (loosen), iron-fortified cereal (darker, firmer). Use the Diet tab alongside this tracker.' },
      ] : [
        { icon:zi('baby'), title:'9–12 months: 1–3 times/day', text:'As the diet diversifies, most babies settle into a pattern of 1–3 poops per day. The poop becomes more formed and adult-like as more solids replace milk feeds.' },
        { icon:zi('timer'), title:'When to worry: no poop for 3+ days', text:'Constipation becomes more common with an all-solid diet. Ensure adequate water intake between meals. Prunes, pears, and whole grains help keep things moving.' },
        { icon:zi('siren'), title:'Diarrhoea alert', text:'3+ very watery stools in a day may indicate gastroenteritis. Monitor for dehydration (dry lips, reduced urine, lethargy). Offer ORS if needed and consult your doctor.' },
        { icon:zi('spoon'), title:'Diet matters more now', text:'With a wider diet, you\'ll see undigested bits (corn, peas, raisins) — this is normal. The gut is still developing and can\'t break down all fibre yet.' },
      ]
    },
    {
      id: 'warning', icon: zi('siren'), label: 'When to Call the Doctor', color: 'rose',
      tips: [
        { icon:zi('siren'), title:'Blood in stool', text:'Any visible blood (red streaks, dark tarry stool) that isn\'t explained by diet (beets, tomatoes) should be reported to your paediatrician.' },
        { icon:zi('warn'), title:'White or very pale stool', text:'Chalky white stools may indicate a liver or bile duct problem. This is uncommon but needs prompt evaluation.' },
        { icon:zi('drop'), title:'Persistent diarrhoea (>24h)', text:'More than 3 very watery stools in a row, especially with fever, vomiting, or lethargy, needs medical attention. Risk of dehydration is real in babies.' },
        { icon:zi('warn'), title:'Straining with hard stools for 3+ days', text:'Occasional straining is normal, but persistent hard pellets with crying indicate constipation that may need dietary changes or medical advice.' },
        { icon:zi('drop'), title:'Mucus with other symptoms', text:'Small amounts of mucus are normal. But mucus with blood, fever, or diarrhoea could indicate infection or allergy.' },
        { icon:zi('siren'), title:'Foul smell + colour change + fever', text:'This combination can indicate infection. Trust your instincts — if something seems off, it\'s always OK to call your doctor.' },
      ]
    },
  ];

  el.innerHTML = categories.map(cat => {
    const bgMap = { amber:'var(--amber-light)', sky:'var(--sky-light)', sage:'var(--sage-light)', rose:'var(--rose-light)' };
    const tcMap = { amber:'var(--tc-amber)', sky:'#3a7090', sage:'#3a7060', rose:'#b0485e' };
    return `
      <div class="tip-cat-card" style="border-radius:var(--r-xl);overflow:hidden;border:1.5px solid ${bgMap[cat.color]||'var(--amber-light)'};">
        <div class="tc-top" onclick="this.parentElement.classList.toggle('tc-open')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${bgMap[cat.color]||'var(--amber-light)'};cursor:pointer;">
          <div class="d-flex items-center gap-8">
            <span style="font-size:var(--icon-base);">${cat.icon}</span>
            <span style="font-size:var(--fs-base);font-weight:600;color:${tcMap[cat.color]||'var(--tc-amber)'};">${cat.label}</span>
            <span class="t-sub">${cat.tips.length} tips</span>
          </div>
          <span class="collapse-chevron" style="color:${tcMap[cat.color]||'var(--tc-amber)'};">▾</span>
        </div>
        <div style="display:none;padding:10px 14px;" class="tc-body">
          ${cat.tips.map(t => `
            <div style="display:flex;gap:var(--sp-12);align-items:flex-start;margin-bottom:10px;">
              <span style="font-size:var(--icon-base);flex-shrink:0;margin-top:2px;">${t.icon}</span>
              <div>
                <div style="font-size:var(--fs-sm);font-weight:600;color:var(--text);margin-bottom:2px;">${t.title}</div>
                <div class="t-sub" style="line-height:var(--lh-normal)5;">${t.text}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Toggle open/close
  el.querySelectorAll('.tip-cat-card .tc-top').forEach(top => {
    top.onclick = function() {
      const body = this.nextElementSibling;
      if (body.style.display === 'none') {
        body.style.display = '';
      } else {
        body.style.display = 'none';
      }
    };
  });
}

function renderHomePoop() {
  const card = document.getElementById('homePoopCard');
  const el = document.getElementById('homePoopContent');
  if (!card || !el) return;

  const todayPoops = getPoopsForDate(today());
  const last = getLastPoop();

  // Update home stat pill
  const homePoopVal = document.getElementById('homePoopToday');
  if (homePoopVal) homePoopVal.textContent = todayPoops.length;

  if (!last) {
    card.style.display = '';
    el.innerHTML = `<div class="info-strip is-amber tappable" data-tab="poop">
      <span><svg class="zi"><use href="#zi-diaper"/></svg></span>
      <div><strong class="tc-amber">No poop logged yet</strong>
      <div class="t-sub">Tap to start tracking Ziva's diapers</div></div>
    </div>`;
    return;
  }

  card.style.display = '';
  let html = '';

  if (todayPoops.length > 0) {
    const colors = todayPoops.map(p => _poopColorDot(p.color)).join(' ');
    html += `<div class="info-strip is-amber">
      <span><svg class="zi"><use href="#zi-diaper"/></svg></span>
      <div><strong class="tc-amber">${todayPoops.length} poop${todayPoops.length>1?'s':''} today</strong> ${colors}
      <div class="t-sub">${todayPoops.map(p => formatTimeShort(p.time)).filter(t => t !== '—').join(', ') || ''}</div></div>
    </div>`;
  } else {
    html += `<div class="info-strip is-amber op-60" >
      <span><svg class="zi"><use href="#zi-diaper"/></svg></span>
      <div class="t-sub">No poops logged today · Last: ${getTimeSinceLastPoop()}</div>
    </div>`;
  }

  // Alert for concerning colours or blood
  const recentAlerts = poopData.filter(p => {
    const daysDiff = Math.floor((new Date() - new Date(p.date)) / 86400000);
    return daysDiff <= 2 && (POOP_ALERT_COLORS.includes(p.color) || p.blood);
  });
  if (recentAlerts.length > 0) {
    const alert = recentAlerts[0];
    const reason = alert.blood ? 'Blood detected in stool' : `${POOP_COLORS[alert.color]?.label || alert.color} stool colour`;
    html += `<div style="margin-top:8px;padding:var(--sp-12) 14px;border-radius:var(--r-lg);background:var(--rose-light);border-left:var(--accent-w) solid var(--rose);">
      <div style="font-size:var(--fs-sm);font-weight:700;color:var(--tc-rose);margin-bottom:4px;">${zi('warn')} Talk to your doctor</div>
      <div class="t-sub" style="line-height:var(--lh-normal);">${reason} on ${formatDate(alert.date)}. This may need medical attention — consult Dr. ${getPrimaryDoctor()?.name || 'your paediatrician'}.</div>
    </div>`;
  }

  el.innerHTML = html;
}

function renderPoopHistoryPreview() {
  const el = document.getElementById('poopHistPreview');
  if (!el) return;

  const last = getLastPoop();
  if (last) {
    const col = POOP_COLORS[last.color] || POOP_COLORS.yellow;
    el.innerHTML = `<div class="info-strip is-amber">
      <span><svg class="zi"><use href="#zi-diaper"/></svg></span>
      <div><strong class="tc-amber">Last: ${formatDate(last.date)} · ${col.label}</strong>
      <div class="t-sub">${getTimeSinceLastPoop()} · ${poopData.length} total entries</div></div>
    </div>`;
  } else {
    el.innerHTML = `<div class="info-strip is-neutral">
      <span><svg class="zi"><use href="#zi-diaper"/></svg></span>
      <div class="t-mid">No poop data logged yet</div>
    </div>`;
  }

  // Full history
  const bodyEl = document.getElementById('poopHistoryContent');
  if (!bodyEl) return;

  if (poopData.length === 0) {
    bodyEl.innerHTML = `<div class="t-sub" style="text-align:center;padding:16px;">No entries yet.</div>`;
    return;
  }

  const grouped = {};
  poopData.forEach(p => {
    if (!grouped[p.date]) grouped[p.date] = [];
    grouped[p.date].push(p);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  bodyEl.innerHTML = dates.map(date => {
    const entries = grouped[date];
    const rows = entries.map(p => {
      const col = POOP_COLORS[p.color] || POOP_COLORS.yellow;
      const con = POOP_CONSISTENCY[p.consistency] || POOP_CONSISTENCY.normal;
      const flags = [];
      if (p.blood) flags.push(zi('drop'));
      if (p.mucus) flags.push(zi('drop'));
      const note = p.notes ? ` · ${escHtml(p.notes)}` : '';
      return `<div style="display:flex;align-items:center;gap:var(--sp-8);padding:4px 0;flex-wrap:wrap;">
        <span class="poop-color-circle" style="background:${col.hex};"></span>
        <span style="font-size:var(--fs-base);">${formatTimeShort(p.time)}</span>
        <span class="poop-badge badge-amber" >${col.label}</span>
        <span class="poop-badge badge-amber" >${con.label}</span>
        ${flags.map(f => `<span class="t-sm">${f}</span>`).join('')}
        <span class="t-sub">${note}</span>
        ${_renderAttribution(p)}
      </div>`;
    }).join('');
    return `<div style="padding:8px 0;border-bottom:1px solid var(--amber-light);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-size:var(--fs-base);color:var(--tc-amber);">${formatDate(date)} · ${ageAtDate(date)}</strong>
        <span class="t-sub">${entries.length} poop${entries.length>1?'s':''}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────

// HISTORY PREVIEWS (collapsed card summaries)
// ─────────────────────────────────────────
function renderHistoryPreviews() {
  

  // ── FEEDING PREVIEW ──
  const feedPrev = document.getElementById('feedHistPreview');
  if (feedPrev) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const ydKey = toDateStr(yesterday);
    const todayKey = today();
    const todayEntry = feedingData[todayKey];
    const ydEntry = feedingData[ydKey];

    // Check if yesterday is missing
    const ydMissing = !ydEntry || (!ydEntry.breakfast && !ydEntry.lunch && !ydEntry.dinner && !ydEntry.snack);
    const todayMissing = !todayEntry || (!todayEntry.breakfast && !todayEntry.lunch && !todayEntry.dinner && !todayEntry.snack);

    if (ydMissing) {
      feedPrev.innerHTML = `<div class="info-strip is-warn">
        <span><svg class="zi"><use href="#zi-warn"/></svg></span>
        <div><strong class="tc-warn">Yesterday not logged</strong>
        <div class="t-sub">${formatDate(ydKey)} · Tap to log retroactively</div></div>
      </div>`;
      feedPrev.onclick = () => { document.getElementById('feedingDate').value = ydKey; loadFeedingDay(); switchTab('diet'); };
      feedPrev.style.cursor = 'pointer';
    } else if (todayEntry && (todayEntry.breakfast || todayEntry.lunch || todayEntry.dinner || todayEntry.snack)) {
      const parts = [todayEntry.breakfast, todayEntry.lunch, todayEntry.dinner, todayEntry.snack].filter(Boolean);
      feedPrev.innerHTML = `<div class="info-strip is-sage">
        <span><svg class="zi"><use href="#zi-check"/></svg></span>
        <div><strong class="tc-sage">Today · ${parts.length} meal${parts.length > 1 ? 's' : ''} logged</strong>
        <div class="t-sub">${parts.join(' · ').substring(0, 80)}${parts.join(' · ').length > 80 ? '…' : ''}</div></div>
      </div>`;
      feedPrev.onclick = null;
      feedPrev.style.cursor = 'default';
    } else {
      feedPrev.innerHTML = `<div class="info-strip is-peach">
        <span><svg class="zi"><use href="#zi-bowl"/></svg></span>
        <div><strong class="t-caution">No meals logged today yet</strong>
        <div class="t-sub">Tap to go to diet tab</div></div>
      </div>`;
      feedPrev.onclick = () => switchTab('diet');
      feedPrev.style.cursor = 'pointer';
    }
  }

  // ── MEDICATION PREVIEW ──
  const medPrev = document.getElementById('medLogPreview');
  if (medPrev) {
    const todayKey = today();
    const ydKey = (() => { const d = new Date(); d.setDate(d.getDate()-1); return toDateStr(d); })();
    const todayChecks = medChecks[todayKey] || {};
    const ydChecks = medChecks[ydKey] || {};
    const activeMeds = meds.filter(m => m.active);

    // Check yesterday for missed/skipped
    const ydMissed = activeMeds.filter(m => !ydChecks[m.name]);
    const ydSkipped = activeMeds.filter(m => ydChecks[m.name] === 'skipped');

    if (ydMissed.length > 0) {
      medPrev.innerHTML = `<div class="info-strip is-danger">
        <span><svg class="zi"><use href="#zi-siren"/></svg></span>
        <div><strong class="tc-danger">Yesterday's meds not logged</strong>
        <div class="t-sub">${ydMissed.map(m => m.name).join(', ')} · ${formatDate(ydKey)}</div></div>
      </div>`;
    } else if (ydSkipped.length > 0) {
      medPrev.innerHTML = `<div class="info-strip is-warn">
        <span><svg class="zi"><use href="#zi-warn"/></svg></span>
        <div><strong class="tc-warn">Skipped yesterday</strong>
        <div class="t-sub">${ydSkipped.map(m => m.name).join(', ')} · ${formatDate(ydKey)}</div></div>
      </div>`;
    } else {
      // Show today's status
      const todayDone = activeMeds.filter(m => todayChecks[m.name] && todayChecks[m.name].startsWith('done'));
      if (todayDone.length === activeMeds.length && activeMeds.length > 0) {
        medPrev.innerHTML = `<div class="info-strip is-sage">
          <span><svg class="zi"><use href="#zi-check"/></svg></span>
          <div><strong class="tc-sage">All meds given today</strong>
          <div class="t-sub">${todayDone.map(m => m.name).join(', ')}</div></div>
        </div>`;
      } else if (activeMeds.length > 0) {
        medPrev.innerHTML = `<div class="info-strip is-sky">
          <span><svg class="zi"><use href="#zi-pill"/></svg></span>
          <div><strong class="tc-sky">${todayDone.length}/${activeMeds.length} given today</strong>
          <div class="t-sub">Pending: ${activeMeds.filter(m => !todayChecks[m.name]).map(m => m.name).join(', ') || 'None'}</div></div>
        </div>`;
      } else {
        medPrev.innerHTML = `<div class="info-strip is-neutral">
          <span><svg class="zi"><use href="#zi-pill"/></svg></span>
          <div class="t-mid">No active medications</div>
        </div>`;
      }
    }
  }

  // ── MILESTONE PREVIEW ──
  const msPrev = document.getElementById('msHistPreview');
  if (msPrev) {
    const done = milestones.filter(m => isMsDone(m));
    const latest = done.filter(m => m.doneAt).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
    const latestMs = latest[0] || done[done.length - 1];

    if (latestMs) {
      const catMeta = { motor:zi('run'), language:zi('chat'), social:zi('handshake'), cognitive:zi('brain') };
      const catIcon = catMeta[latestMs.cat] || zi('star');
      msPrev.innerHTML = `<div class="info-strip is-sage">
        <span>${catIcon}</span>
        <div><strong class="tc-sage">Latest: ${escHtml(latestMs.text)}${latestMs.advanced ? ' <svg class="zi"><use href="#zi-star"/></svg>' : ''}</strong>
        <div class="t-sub">${latestMs.doneAt ? formatDate(latestMs.doneAt.split('T')[0]) + ' · ' + ageAtDate(latestMs.doneAt) : 'Achieved'} · ${done.length} total</div></div>
      </div>`;
    } else {
      msPrev.innerHTML = `<div class="info-strip is-neutral">
        <span><svg class="zi"><use href="#zi-star"/></svg></span>
        <div class="t-mid">No milestones achieved yet</div>
      </div>`;
    }
  }

  // ── VACCINATION PREVIEW ──
  const vaccPrev = document.getElementById('vaccHistPreview');
  if (vaccPrev) {
    const upcoming = vaccData.find(v => v.upcoming);
    const past = vaccData.filter(v => !v.upcoming);
    const latestPast = past.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const bookedData = load(KEYS.vaccBooked, null);
    const isBooked = upcoming && bookedData && bookedData.vaccName === upcoming.name;
    const apptLabel = isBooked ? getVaccApptLabel(bookedData) : null;

    if (upcoming) {
      const daysTo = Math.max(0, Math.ceil((new Date(upcoming.date) - new Date()) / 86400000));
      if (isBooked) {
        // Booked — show green status with appointment details
        const detail = apptLabel
          ? `${zi('check')} Booked · ${apptLabel}`
          : `${zi('check')} Booked · <span style="cursor:pointer;text-decoration:underline;" data-action="openVaccApptModal" data-arg="${escAttr(upcoming.name)}">Add date & time</span>`;
        vaccPrev.innerHTML = `<div class="info-strip is-success">
          <span><svg class="zi"><use href="#zi-syringe"/></svg></span>
          <div><strong class="tc-sage">${daysTo} day${daysTo !== 1 ? 's' : ''} to ${escHtml(upcoming.name)}</strong>
          <div class="t-sub">${formatDate(upcoming.date)} · ${detail}</div></div>
        </div>`;
      } else if (daysTo <= 0) {
        // Overdue!
        vaccPrev.innerHTML = `<div class="info-strip is-danger">
          <span><svg class="zi"><use href="#zi-siren"/></svg></span>
          <div><strong class="tc-danger">Vaccination overdue!</strong>
          <div class="t-sub">${escHtml(upcoming.name)} · was due ${formatDate(upcoming.date)}</div></div>
        </div>`;
      } else if (daysTo <= 7) {
        vaccPrev.innerHTML = `<div class="info-strip is-danger">
          <span><svg class="zi"><use href="#zi-dot-red"/></svg></span>
          <div><strong class="tc-danger">${daysTo} day${daysTo > 1 ? 's' : ''} to vaccination</strong>
          <div class="t-sub">${escHtml(upcoming.name)} · ${formatDate(upcoming.date)} · <span class="ptr" style="text-decoration:underline;" data-action="markVaccBooked" data-arg="${escAttr(upcoming.name)}">Book now</span></div></div>
        </div>`;
      } else if (daysTo <= 14) {
        vaccPrev.innerHTML = `<div class="info-strip is-warn">
          <span><svg class="zi"><use href="#zi-warn"/></svg></span>
          <div><strong class="tc-warn">${daysTo} days to vaccination</strong>
          <div class="t-sub">${escHtml(upcoming.name)} · ${formatDate(upcoming.date)}</div></div>
        </div>`;
      } else {
        vaccPrev.innerHTML = `<div class="info-strip is-lav">
          <span><svg class="zi"><use href="#zi-syringe"/></svg></span>
          <div><strong class="tc-lav">Next: ${escHtml(upcoming.name)}</strong>
          <div class="t-sub">${formatDate(upcoming.date)} · ${daysTo} days away · ${past.length} completed</div></div>
        </div>`;
      }
    } else if (latestPast) {
      vaccPrev.innerHTML = `<div class="info-strip is-sage">
        <span><svg class="zi"><use href="#zi-check"/></svg></span>
        <div><strong class="tc-sage">Latest: ${escHtml(latestPast.name)}</strong>
        <div class="t-sub">${formatDate(latestPast.date)} · ${past.length} total completed</div></div>
      </div>`;
    } else {
      vaccPrev.innerHTML = `<div class="info-strip is-neutral">
        <span><svg class="zi"><use href="#zi-syringe"/></svg></span>
        <div class="t-mid">No vaccinations recorded</div>
      </div>`;
    }
  }

  // ── GROWTH HISTORY PREVIEW ──
  const growthPrev = document.getElementById('growthHistPreview');
  if (growthPrev) {
    const lwHist = getLatestWeight();
    const lhHist = getLatestHeight();
    if (lwHist || lhHist) {
      const parts = [];
      let pctStr = '';
      if (lwHist) {
        const wtWho = getGrowthRef(ageMonthsAt(lwHist.date));
        const wtP = calcPercentile(lwHist.wt, wtWho.w3, wtWho.w50, wtWho.w97, wtWho.w15, wtWho.w85);
        parts.push(lwHist.wt + ' kg');
        pctStr = wtP.text;
      }
      if (lhHist) parts.push(formatHeight(lhHist.ht));
      const latestDate = lwHist && lhHist ? (new Date(lwHist.date) > new Date(lhHist.date) ? lwHist.date : lhHist.date) : (lwHist || lhHist).date;
      const daysSince = Math.floor((new Date() - new Date(latestDate)) / 86400000);
      growthPrev.innerHTML = `<div class="info-strip is-rose">
        <span><svg class="zi"><use href="#zi-chart"/></svg></span>
        <div><strong class="tc-rose">Latest: ${parts.join(' · ')}${pctStr ? ' (' + pctStr + ')' : ''}</strong>
        <div class="t-sub">${formatDate(latestDate)} · ${daysSince} days ago · ${growthData.length} total measurements</div></div>
      </div>`;
    } else {
      growthPrev.innerHTML = `<div class="info-strip is-neutral">
        <span><svg class="zi"><use href="#zi-chart"/></svg></span>
        <div class="t-mid">No measurements recorded</div>
      </div>`;
    }
  }

  // ── NOTES PREVIEW ──
  const notesPrev = document.getElementById('notesHistPreview');
  if (notesPrev) {
    const active = notes.filter(n => !n.done).length;
    const withPhotos = notes.filter(n => n.photo).length;
    const total = notes.length;
    if (total > 0) {
      const catCounts = {};
      notes.forEach(n => { const c = n.category || 'general'; catCounts[c] = (catCounts[c] || 0) + 1; });
      const catSummary = Object.entries(catCounts).map(([c, n]) => `${n} ${c}`).join(' · ');
      notesPrev.innerHTML = `<div class="info-strip is-peach">
        <span><svg class="zi"><use href="#zi-note"/></svg></span>
        <div><strong class="t-caution">${total} note${total > 1 ? 's' : ''} · ${active} active${withPhotos > 0 ? ' · ' + withPhotos + ' ' + zi('camera') : ''}</strong>
        <div class="t-sub">${catSummary}</div></div>
      </div>`;
    } else {
      notesPrev.innerHTML = `<div class="info-strip is-neutral">
        <span><svg class="zi"><use href="#zi-note"/></svg></span>
        <div class="t-mid">No notes yet</div>
      </div>`;
    }
  }
}

function renderNotesHistory() {
  const container = document.getElementById('notesHistoryContent');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No notes yet. Add notes from the Home tab.</div>';
    return;
  }

  const catIcons = { general:zi('note'), diet:zi('bowl'), medical:zi('medical'), milestone:zi('star'), growth:zi('chart') };
  const catColors = { general:'var(--peach-light)', diet:'var(--sage-light)', medical:'var(--lav-light)', milestone:'#fff8e1', growth:'var(--rose-light)' };
  const catBorders = { general:'var(--peach)', diet:'var(--sage)', medical:'var(--lavender)', milestone:'#ffd166', growth:'var(--rose)' };

  // Sort by date, newest first
  const sorted = [...notes].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  let html = '<div class="fx-col g8">';
  sorted.forEach(n => {
    const cat = n.category || 'general';
    const icon = catIcons[cat] || zi('note');
    const bg = catColors[cat] || 'var(--warm)';
    const border = catBorders[cat] || 'var(--peach)';
    const dateStr = formatDate(n.ts.split('T')[0]);
    const timeStr = new Date(n.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    html += `
      <div style="border-radius:var(--r-lg);padding:var(--sp-12) 14px;background:${bg};border-left:var(--accent-w) solid ${border};${n.done ? 'opacity:0.6;' : ''}">
        <div class="fx-start g8">
          <span style="font-size:var(--icon-sm);flex-shrink:0;">${n.done ? '<span class="zi-check-placeholder"></span>' : icon}</span>
          <div class="flex-1-min">
            <div style="font-size:var(--fs-base);color:var(--text);line-height:var(--lh-relaxed);${n.done ? 'text-decoration:line-through;color:var(--mid);' : ''}">${escHtml(n.text || '(Note)')}</div>
            ${n.photo ? `<div class="mt-6"><img src="${n.photo}" alt="Note photo" style="max-width:100%;max-height:120px;border-radius:var(--r-md);object-fit:cover;cursor:pointer;" data-action="openNotePhoto" data-arg="${notes.indexOf(n)}"></div>` : ''}
            ${n.voice ? `<div class="mt-6">${n.voiceLabel ? '<div class="t-sub" style="font-weight:600;margin-bottom:2px;">' + zi('camera') + ' ' + escHtml(n.voiceLabel) + '</div>' : ''}<audio src="${n.voice}" controls style="height:28px;max-width:100%;"></audio></div>` : ''}
            <div class="t-sub mt-4">
              ${dateStr} · ${timeStr}
              <span class="badge-sm" style="background:var(--glass-strong);margin-left:4px;">${cat}</span>
              ${n.done ? ' · Completed' : ''}
            </div>
            ${_renderAttribution(n)}
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  html += '</div>';
  container.innerHTML = html;
}

function renderScrapbookHistory() {
  const container = document.getElementById('scrapbookHistoryContent');
  if (!container) return;

  // Scrapbook preview
  const prevEl = document.getElementById('scrapHistPreview');
  if (prevEl) {
    
    if (scrapbook.length > 0) {
      prevEl.innerHTML = `<div class="info-strip is-rose">
        <span><svg class="zi"><use href="#zi-camera"/></svg></span>
        <div><strong class="tc-rose">${scrapbook.length} memor${scrapbook.length === 1 ? 'y' : 'ies'}</strong></div>
      </div>`;
    } else {
      prevEl.innerHTML = `<div class="info-strip is-neutral">
        <span><svg class="zi"><use href="#zi-camera"/></svg></span>
        <div class="t-mid">No scrapbook entries yet</div>
      </div>`;
    }
  }

  if (scrapbook.length === 0) {
    container.innerHTML = '<div class="t-sub-light fe-center-action" >No memories yet. Add them from the Home tab Scrapbook.</div>';
    return;
  }

  const sorted = [...scrapbook].sort((a, b) => new Date(b.date || b.ts) - new Date(a.date || a.ts));
  let html = '<div class="fx-col g8">';
  sorted.forEach((entry) => {
    const origIdx = scrapbook.indexOf(entry);
    const entryDate = entry.date || entry.ts.split('T')[0];
    const dateStr = formatDate(entryDate);
    const { months, days } = ageAtScrapDate(entryDate);
    html += `
      <div class="scrap-entry">
        <div class="scrap-photo" data-action="openScrapPhoto" data-arg="${origIdx}">
          <img src="${entry.photo}" alt="${escHtml(entry.title || 'Memory')}">
        </div>
        <div class="scrap-body">
          <div class="scrap-title">${escHtml(entry.title || 'Untitled')}</div>
          ${entry.desc ? `<div class="scrap-desc">${escHtml(entry.desc)}</div>` : ''}
          <div class="scrap-meta">${dateStr} · ${months}m ${days}d old</div>
        </div>
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ─────────────────────────────────────────

// ██ CONTEXTUAL ALERTS ENGINE (v2.0b)
// ══════════════════════════════════════════════════════════════

// ── Storage ──
function loadAlertState()   { return load(KEYS.alertsActive, { dismissed: {} }); }
function saveAlertState(s)  { save(KEYS.alertsActive, s); }
function loadAlertHistory() { return load(KEYS.alertsHistory, []); }
function saveAlertHistory(h){ save(KEYS.alertsHistory, h); }

function logAlertEvent(alertKey, eventType, alertTitle, alertSeverity) {
  const h = loadAlertHistory();
  h.unshift({ key: alertKey, event: eventType, title: alertTitle || alertKey, ts: new Date().toISOString(), severity: alertSeverity || null });
  // Keep last 200 events
  if (h.length > 200) h.length = 200;
  saveAlertHistory(h);
}

function dismissAlert(alertKey, alertTitle) {
  const state = loadAlertState();
  state.dismissed[alertKey] = new Date().toISOString();
  saveAlertState(state);
  logAlertEvent(alertKey, 'dismissed', alertTitle);
  // Animate out all scoped instances
  const safePart = alertKey.replace(/[^a-zA-Z0-9-]/g, '_');
  let found = false;
  ['ins-', 'insw-', 'hm-', 'hmw-', ''].forEach(scope => {
    const el = document.getElementById('ca-' + scope + safePart);
    if (el) { el.classList.add('dismissing'); found = true; }
  });
  if (found) {
    setTimeout(() => { renderRemindersAndAlerts(); renderHomeContextAlerts(); renderInsightsAlerts(); }, 300);
  } else {
    renderRemindersAndAlerts();
    renderHomeContextAlerts();
    renderInsightsAlerts();
  }
}

function toggleAlertTip(alertKey) {
  const el = document.getElementById('ca-tip-' + alertKey.replace(/[^a-zA-Z0-9-]/g, '_'));
  if (el) el.classList.toggle('open');
}

// ── Severity helpers ──
const SEV_ORDER = { action: 0, watch: 1, info: 2, positive: 3 };
const SEV_CLASS = { action: 'ca-action', watch: 'ca-watch', info: 'ca-info', positive: 'ca-positive' };
const SEV_BADGE = { action: 'sev-action', watch: 'sev-watch', info: 'sev-info', positive: 'sev-positive' };
const SEV_LABEL = { action: zi('siren') + ' Action', watch: zi('warn') + ' Watch', info: zi('check') + ' Info', positive: zi('party') + ' Win' };

// Sanitize alert keys to safe alphanumeric + dash only
function sanitizeAlertKey(s) { return s.replace(/[^a-zA-Z0-9-]/g, '_'); }

// ══════════════════════════════════════════════════════════
// ██ PERSONALIZED BASELINES ENGINE
// ══════════════════════════════════════════════════════════
const KEY_NUTRIENTS = ['iron', 'calcium', 'protein', 'vitamin C', 'fibre', 'vitamin A', 'omega-3', 'zinc'];
// SKIPPED_MEAL, isRealMeal → migrated to core.js
let _cachedBaselines = null;
let _baselinesComputedAt = 0;

function computeBaselines() {
  // Cache for 60 seconds to avoid recomputing on every render
  const now = Date.now();
  if (_cachedBaselines && now - _baselinesComputedAt < 60000) return _cachedBaselines;

  const todayStr = today();
  const b = {};

  // ── Poop baselines (7d) ──
  const poop7d = getDateWindow(7, 0);
  const poopIn7d = poopData.filter(p => poop7d.includes(p.date));
  b.poopPerDay = poop7d.length > 0 ? +(poopIn7d.length / 7).toFixed(1) : null;
  // Avg gap between poops
  const sortedPoopDates = [...new Set(poopIn7d.map(p => p.date))].sort();
  if (sortedPoopDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < sortedPoopDates.length; i++) {
      totalGap += Math.floor((new Date(sortedPoopDates[i]) - new Date(sortedPoopDates[i - 1])) / 86400000);
    }
    b.poopAvgGapDays = +(totalGap / (sortedPoopDates.length - 1)).toFixed(1);
  } else { b.poopAvgGapDays = null; }
  // Dominant consistency (mode)
  const consCounts = {};
  poopIn7d.forEach(p => { consCounts[p.consistency || 'normal'] = (consCounts[p.consistency || 'normal'] || 0) + 1; });
  b.poopDominantConsistency = Object.keys(consCounts).length > 0
    ? Object.entries(consCounts).sort((a, b) => b[1] - a[1])[0][0] : null;
  // Consistency streak (for positive alerts)
  const allPoopSorted = poopData.slice().sort((a, c) => ((c.date||'') + (c.time||'')).localeCompare((a.date||'') + (a.time||'')));
  let consistentPoopStreak = 0;
  for (let i = 0; i < allPoopSorted.length; i++) {
    const c = allPoopSorted[i].consistency || 'normal';
    if (c === 'normal' || c === 'soft') consistentPoopStreak++;
    else break;
  }
  b.poopConsistentStreak = consistentPoopStreak;

  // ── Meal baselines (7d) ──
  let mealsTotal = 0, mealsLoggedDays = 0, fullMealDays = 0;
  poop7d.forEach(ds => {
    const entry = feedingData[ds];
    if (entry) {
      const count = ['breakfast', 'lunch', 'dinner'].filter(m => isRealMeal(entry[m])).length;
      mealsTotal += count;
      if (count > 0) mealsLoggedDays++;
      if (count >= 3) fullMealDays++;
    }
  });
  b.mealsPerDay = mealsLoggedDays > 0 ? +(mealsTotal / 7).toFixed(1) : null;
  b.fullMealDays7d = fullMealDays;
  // Consecutive full-meal days — count days where all 3 are accounted for (logged or skipped)
  let mealStreak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    const accounted = entry ? ['breakfast', 'lunch', 'dinner'].filter(m => entry[m]).length : 0;
    if (accounted >= 3) mealStreak++;
    else break;
  }
  b.mealLoggingStreak = mealStreak;

  // ── Sleep baselines (30d) ──
  const sleep30d = getDateWindow(30, 0);
  const sleepScores = [];
  let firstSleepThrough = false;
  sleep30d.forEach(ds => {
    const sc = getDailySleepScore(ds);
    if (sc) sleepScores.push(sc.score);
  });
  b.sleepAvg30d = sleepScores.length > 0 ? Math.floor(sleepScores.reduce((s, v) => s + v, 0) / sleepScores.length) : null;
  if (sleepScores.length >= 2) {
    const mean = b.sleepAvg30d;
    const variance = sleepScores.reduce((s, v) => s + (v - mean) ** 2, 0) / sleepScores.length;
    b.sleepStdDev = Math.floor(Math.sqrt(variance));
  } else { b.sleepStdDev = null; }
  // Sleep score streak ≥75
  let sleepGoodStreak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const sc = getDailySleepScore(ds);
    if (sc && sc.score >= 75) sleepGoodStreak++;
    else break;
  }
  b.sleepGoodStreak = sleepGoodStreak;
  // First-ever 0-wakeup night check
  const allNights = sleepData.filter(e => e.type === 'night');
  b.hasEverSleptThrough = allNights.some(n => getWakeCount(n) === 0);
  b.sleptThroughCount = allNights.filter(n => getWakeCount(n) === 0).length;
  // Check if LAST night was first-ever sleep through
  const lastNight = allNights.sort((a, c) => (c.date || '').localeCompare(a.date || ''))[0];
  b.lastNightSleepThrough = lastNight && getWakeCount(lastNight) === 0;
  b.isFirstEverSleepThrough = b.lastNightSleepThrough && b.sleptThroughCount === 1;

  // ── Supplement adherence (D3) ──
  const activeMeds = meds.filter(m => m.active);
  activeMeds.forEach(m => {
    const mKey = sanitizeAlertKey(m.name);
    let streak = 0;
    for (let i = 0; i < 90; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      // Skip today if not yet resolved
      if (i === 0) {
        const dayLog = medChecks[ds] || {};
        const status = dayLog[m.name];
        if (!status || (!status.startsWith('done:') && status !== 'skipped')) continue;
        if (status.startsWith('done:')) { streak++; continue; }
        break; // skipped breaks streak
      }
      const dayLog = medChecks[ds] || {};
      const status = dayLog[m.name];
      if (status && status.startsWith('done:')) { streak++; }
      else break;
    }
    b['suppStreak_' + mKey] = streak;

    // 30d adherence
    let given30 = 0, total30 = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      const trackStart = medChecks._trackingSince || todayStr;
      if (ds < trackStart) continue;
      if (ds < (m.start || '2025-09-04')) continue;
      total30++;
      const dayLog = medChecks[ds] || {};
      if (dayLog[m.name] && dayLog[m.name].startsWith('done:')) given30++;
    }
    b['suppAdherence30_' + mKey] = total30 > 0 ? Math.floor((given30 / total30) * 100) : null;
    b['suppGiven30_' + mKey] = given30;
    b['suppTotal30_' + mKey] = total30;
  });

  // ── Food variety (7d) ──
  const foodsThisWeek = foods.filter(f => f.date && poop7d.includes(f.date));
  b.newFoodsThisWeek = foodsThisWeek.length;

  // ── Nutrient analysis (7d) ──
  const nutrientDays = {}; // nutrient → count of days it appeared
  const ironVitCPairDays = []; // days where iron + vit C appeared in same meal
  const dailyNutrients = {}; // date → Set of nutrients
  let sameMealStreak = 0;
  let lastMealText = null;
  KEY_NUTRIENTS.forEach(n => { nutrientDays[n] = 0; });

  poop7d.forEach(ds => {
    const entry = feedingData[ds];
    if (!entry) return;
    const dayNutrients = new Set();
    let dayHasIronVitC = false;

    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
      if (!isRealMeal(entry[meal])) return;
      const items = parseMealNutrition(entry[meal]);
      const mealNutrients = new Set(items.flatMap(i => i.nutrients || []));
      const mealTags = new Set(items.flatMap(i => i.tags || []));
      mealNutrients.forEach(n => dayNutrients.add(n));
      // Iron + Vit C synergy check per meal
      if ((mealTags.has('iron-rich') || mealNutrients.has('iron')) &&
          (mealTags.has('vitamin-C') || mealTags.has('iron-absorption') || mealNutrients.has('vitamin C'))) {
        dayHasIronVitC = true;
      }
    });

    dailyNutrients[ds] = dayNutrients;
    KEY_NUTRIENTS.forEach(n => {
      if (dayNutrients.has(n)) nutrientDays[n]++;
    });
    if (dayHasIronVitC) ironVitCPairDays.push(ds);
  });

  b.nutrientDays = nutrientDays;
  b.ironVitCPairCount = ironVitCPairDays.length;
  b.nutrientGroupsCovered = KEY_NUTRIENTS.filter(n => nutrientDays[n] >= 2).length; // 2+ days = "covered"
  b.dailyNutrients = dailyNutrients;

  // Days without iron (consecutive, from today backwards)
  b.daysWithoutIron = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dn = dailyNutrients[ds];
    if (dn && dn.has('iron')) break;
    b.daysWithoutIron++;
  }
  // Days without calcium
  b.daysWithoutCalcium = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dn = dailyNutrients[ds];
    if (dn && dn.has('calcium')) break;
    b.daysWithoutCalcium++;
  }
  // Days without protein
  b.daysWithoutProtein = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const dn = dailyNutrients[ds];
    if (dn && dn.has('protein')) break;
    b.daysWithoutProtein++;
  }

  // Same meal monotony (consecutive days with identical meal text)
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = toDateStr(d);
    const entry = feedingData[ds];
    if (!entry) break;
    const meals = [entry.breakfast, entry.lunch, entry.dinner, entry.snack].filter(Boolean).join('|');
    if (i === 0) { lastMealText = meals; sameMealStreak = 1; }
    else if (meals === lastMealText && meals) { sameMealStreak++; }
    else break;
  }
  b.sameMealStreak = sameMealStreak;

  // Iron-rich days count (for positive alert)
  b.ironDays7d = nutrientDays['iron'] || 0;

  // ── Growth (reuse existing) ──
  const velocity = getGrowthVelocity();
  b.wtGPerWeek = velocity.wtGPerWeek;
  b.wtInHealthyRange = false;
  if (velocity.wtGPerWeek != null) {
    const ageM = ageAt().months;
    const expMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
    const expMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
    b.wtInHealthyRange = velocity.wtGPerWeek >= expMin && velocity.wtGPerWeek <= expMax;
    // Check if healthy for 4+ weeks
    b.growthConsistentWeeks = velocity.wtEntryCount >= 3 ? Math.min(Math.floor(velocity.wtSpanDays / 7), 8) : 0;
  }

  _cachedBaselines = b;
  _baselinesComputedAt = now;
  return b;
}

// ══════════════════════════════════════════════════════════
// ESCALATING_TIPS → migrated to data.js


// Vitamin D3 dos and don'ts (rotated through tips for D3 alerts)
const D3_KNOWLEDGE = {
  dos: [
    'Give at the same time daily — consistency builds habit and ensures steady levels.',
    'Give with or after a fat-containing meal (ghee, oil, milk) — Vitamin D is fat-soluble and absorbs better with fat.',
    'Continue through summer — Indian sun exposure alone isn\'t sufficient for infants due to skin sensitivity guidelines (no direct sun under 12mo).',
    '400-800 IU daily is the standard paediatric recommendation for infants (IAP/AAP guidelines).',
    'Drop directly into the mouth or onto the nipple/spoon — ensures the full dose is taken.',
    'Store drops in a cool, dark place. Check expiry date regularly.',
  ],
  donts: [
    'Don\'t exceed 1000 IU/day without paediatrician guidance — excess Vitamin D can cause calcium buildup.',
    'Don\'t mix into a full bottle or cup — baby may not finish, leading to underdosing.',
    'Don\'t skip because "she gets sunlight" — infants under 12 months should avoid direct sun exposure (AAP recommendation).',
    'Don\'t double up if a dose is missed — just continue with the regular dose the next day.',
    'Don\'t stop at 12 months — most paediatricians recommend continuing through the second year, especially for breastfed babies.',
  ],
};

function getEscalatedTip(alertId, overrideTip) {
  const tips = ESCALATING_TIPS[alertId];
  if (!tips || tips.length === 0) return overrideTip || '';

  // Count previous dismissals of this alert ID in history
  const hist = loadAlertHistory();
  const dismissCount = hist.filter(h => h.event === 'dismissed' && h.key && h.key.startsWith(alertId)).length;

  const tierIndex = Math.min(Math.floor(dismissCount / 2), tips.length - 1);
  return tips[tierIndex];
}

function getD3Tip(streak) {
  // Rotate through dos/don'ts based on context
  const allTips = [...D3_KNOWLEDGE.dos, ...D3_KNOWLEDGE.donts];
  const idx = Math.floor(Date.now() / 86400000) % allTips.length; // rotate daily
  const mainTip = allTips[idx];
  if (streak >= 7) return zi('check') + ' ' + D3_KNOWLEDGE.dos[Math.floor(Date.now() / 86400000) % D3_KNOWLEDGE.dos.length];
  return zi('bulb') + ' ' + mainTip;
}

// ══════════════════════════════════════════════════════════
// ██ CROSS-ALERT SYNTHESIS
// ══════════════════════════════════════════════════════════
const SYNTHESIS_RULES = [
  {
    ids: ['sleep-score-drop', 'hard-stool-streak', 'food-reaction'],
    title: 'New food → digestive upset → poor sleep',
    body: 'A new food was introduced, followed by hard stools and disrupted sleep. These are likely connected. Simplify Ziva\'s diet for a couple of days and monitor.',
    tip: 'Go back to well-tolerated foods (dal-rice, ragi porridge) for 2-3 days. Keep up fluids. Sleep should recover as digestion settles.',
    icon: zi('link'), severity: 'watch',
  },
  {
    ids: ['sleep-score-drop', 'hard-stool-streak'],
    title: 'Constipation may be disrupting sleep',
    body: 'Hard stools and poor sleep often go together — abdominal discomfort makes it hard to settle at night.',
    tip: 'Focus on hydration and high-fibre foods during the day. A warm bath before bed can help with both constipation and sleep.',
    icon: zi('link'), severity: 'watch',
  },
  {
    ids: ['food-reaction', 'hard-stool-streak'],
    title: 'New food + hard stools — likely dietary adjustment',
    body: 'A recently introduced food coincides with hard stools. Ziva\'s gut may need time to adjust to the new food.',
    tip: 'Pause the new food for a few days. If stools normalize, try reintroducing in smaller quantities. Mark the food as "Watch" in the diet tab.',
    icon: zi('link'), severity: 'watch',
  },
  {
    ids: ['sleep-score-drop', 'food-reaction'],
    title: 'New food may be affecting sleep',
    body: 'A new food was introduced around the same time sleep quality dropped. Digestive discomfort from new foods can disrupt sleep.',
    tip: 'Monitor for 48 hours. If sleep doesn\'t improve, pause the new food and see if sleep recovers.',
    icon: zi('link'), severity: 'watch',
  },
  {
    ids: ['no-feed-today', 'sleep-score-drop'],
    title: 'Tired and not eating — could be teething or illness',
    body: 'Poor sleep combined with reduced appetite is a classic sign of teething, a growth spurt, or mild illness.',
    tip: 'Watch for fever, drooling, or gum rubbing (teething signs). Offer cold teething toys and softer foods. This usually passes in a few days.',
    icon: zi('link'), severity: 'watch',
  },
  {
    ids: ['poop-gap', 'hard-stool-streak'],
    title: 'Constipation — no poop + hard stools pattern',
    body: 'Extended poop gap combined with hard stools when she does go. This is a clear constipation pattern.',
    tip: 'Increase water intake, add prune/pear/papaya to meals, reduce rice and banana. Tummy massage before feeds. If no improvement in 2-3 days, consult your paediatrician.',
    icon: zi('link'), severity: 'action',
  },
  {
    ids: ['food-correlation', 'hard-stool-streak'],
    title: 'Repeated food → hard stool pattern confirmed',
    body: 'A specific food has been correlated with hard stools, and the hard stool streak is active right now. The evidence strongly suggests a dietary cause.',
    tip: 'Pause the flagged food for one week and monitor stool consistency. If stools normalise, reintroduce in small amounts to confirm. Mark the food as "Watch" in the diet tab.',
    icon: zi('link'), severity: 'action',
  },
];

function applyCrossSynthesis(alerts) {
  const activeIds = new Set(alerts.map(a => a.id));
  let synthesized = [];
  const consumedIds = new Set();

  // Try rules from most-specific (most ids) to least
  const sortedRules = SYNTHESIS_RULES.slice().sort((a, b) => b.ids.length - a.ids.length);

  for (const rule of sortedRules) {
    // Check if all required IDs are present and not already consumed
    if (rule.ids.every(id => activeIds.has(id) && !consumedIds.has(id))) {
      // Create synthesized alert
      const highestSev = rule.ids.reduce((best, id) => {
        const a = alerts.find(al => al.id === id);
        return a && (SEV_ORDER[a.severity] || 2) < (SEV_ORDER[best] || 2) ? a.severity : best;
      }, rule.severity || 'watch');

      const primaryAlert = alerts.find(a => a.id === rule.ids[0]);
      synthesized.push({
        id: 'synthesis-' + rule.ids.join('+'),
        key: 'synthesis-' + rule.ids.join('+') + '-' + today(),
        severity: highestSev,
        icon: rule.icon,
        title: rule.title,
        body: rule.body,
        tip: rule.tip,
        action: primaryAlert ? primaryAlert.action : null,
        tab: primaryAlert ? primaryAlert.tab : null,
        dismissable: true,
        _synthesizedFrom: rule.ids,
      });
      rule.ids.forEach(id => consumedIds.add(id));
    }
  }

  // Keep non-consumed alerts + add synthesized ones
  const remaining = alerts.filter(a => !consumedIds.has(a.id));
  return { alerts: [...synthesized, ...remaining], synthesisNarrative: synthesized.length > 0 ? synthesized[0].title : null };
}

// ── Core engine: compute all active alerts ──
function computeAlerts() {
  const alerts = [];
  const todayStr = today();
  const nowH = new Date().getHours();
  const ageM = ageAt().months;
  const state = loadAlertState();
  const bl = computeBaselines();

  // Helper: check if dismissed
  function isDismissed(key) { return !!state.dismissed[key]; }

  // ═══════════════════════════════════════
  // WARNING ALERTS (with escalating tips)
  // ═══════════════════════════════════════

  // ─── 1. NO FEED LOGGED TODAY (11 AM – 7 PM only; after 7 PM, #15 handles it) ───
  if (nowH >= 11 && nowH < 19) {
    const todayEntry = feedingData[todayStr];
    const hasMeal = todayEntry && (todayEntry.breakfast || todayEntry.lunch || todayEntry.dinner || todayEntry.snack);
    if (!hasMeal) {
      const key = 'no-feed-today-' + todayStr;
      if (!isDismissed(key)) {
        alerts.push({
          id: 'no-feed-today', key,
          severity: 'watch', icon: zi('bowl'),
          title: 'No meals logged today',
          body: 'It\'s past 11 AM and no meals have been logged for Ziva today.',
          tip: getEscalatedTip('no-feed-today'),
          action: { label: 'Log Feed', fn: 'openQuickModal("feed")' },
          tab: 'diet', dismissable: true
        });
      }
    }
  }

  // ─── 2. POOP GAP (escalating, baseline-aware) ───
  const sortedPoop = poopData.slice().sort((a, b) => ((b.date||'') + (b.time||'')).localeCompare((a.date||'') + (a.time||'')));
  if (sortedPoop.length > 0) {
    const lastPoopDate = sortedPoop[0].date;
    const daysSince = Math.floor((new Date(todayStr) - new Date(lastPoopDate)) / 86400000);
    // Use baseline gap to set thresholds — if Ziva normally goes every 2 days, 4 is abnormal
    // If normally every day, 3 is abnormal
    const baseGap = bl.poopAvgGapDays || 1;
    const infoThresh = Math.max(3, Math.floor(baseGap + 1.5));
    const watchThresh = Math.max(4, Math.floor(baseGap + 2.5));
    const actionThresh = Math.max(6, Math.floor(baseGap + 4));
    if (daysSince >= infoThresh) {
      const sev = daysSince >= actionThresh ? 'action' : daysSince >= watchThresh ? 'watch' : 'info';
      const key = 'poop-gap-' + lastPoopDate;
      if (!isDismissed(key)) {
        const aboveBaseline = bl.poopAvgGapDays ? ' (her usual is every ' + bl.poopAvgGapDays + ' days)' : '';
        const bodyText = daysSince >= actionThresh
          ? 'This is getting long' + aboveBaseline + ' — watch for straining, hard belly, or discomfort. Consider calling your paediatrician.'
          : daysSince >= watchThresh
          ? 'Longer than usual' + aboveBaseline + '. Watch for discomfort signs like straining or fussiness.'
          : 'Some babies skip days, especially breastfed ones. Keep an eye on comfort.';
        alerts.push({
          id: 'poop-gap', key,
          severity: sev, icon: zi('diaper'),
          title: daysSince + ' days without poop',
          body: bodyText,
          tip: getEscalatedTip('poop-gap'),
          action: { label: 'Log Poop', fn: 'openQuickModal("poop")' },
          tab: 'poop', dismissable: true
        });
      }
    }
  } else {
    const key = 'poop-gap-nodata';
    if (!isDismissed(key)) {
      alerts.push({
        id: 'poop-gap', key,
        severity: 'info', icon: zi('diaper'),
        title: 'Start tracking poop',
        body: 'No poop entries yet. Tracking frequency and consistency helps spot digestive issues early.',
        tip: getEscalatedTip('poop-gap-nodata'),
        action: { label: 'Log Poop', fn: 'openQuickModal("poop")' },
        tab: 'poop', dismissable: true
      });
    }
  }

  // ─── 3. HARD STOOL STREAK ───
  if (sortedPoop.length >= 3) {
    let hardStreak = 0;
    for (let i = 0; i < sortedPoop.length && i < 10; i++) {
      if (sortedPoop[i].consistency === 'hard' || sortedPoop[i].consistency === 'pellets') {
        hardStreak++;
      } else { break; }
    }
    if (hardStreak >= 3) {
      const key = 'hard-stool-' + sortedPoop[0].date;
      if (!isDismissed(key)) {
        alerts.push({
          id: 'hard-stool-streak', key,
          severity: 'watch', icon: zi('warn'),
          title: hardStreak + ' hard stools in a row',
          body: 'Consecutive hard or pellet-like stools may indicate constipation. Increase water and fibre-rich foods.',
          tip: getEscalatedTip('hard-stool-streak'),
          action: { label: 'View Diet', fn: 'switchTab("diet")' },
          tab: 'poop', dismissable: true
        });
      }
    }
  }

  // ─── 4. SLEEP SCORE DROP (baseline-aware) ───
  const sleepTrend = getSleepTrend7d();
  if (sleepTrend.score.current != null && sleepTrend.score.trend.delta != null) {
    const drop = -sleepTrend.score.trend.delta;
    // Use baseline std dev to determine significance — drop should be > 1 std dev
    const threshold = bl.sleepStdDev != null && bl.sleepStdDev > 5 ? Math.max(12, bl.sleepStdDev) : 15;
    if (drop >= threshold) {
      const weekStart = getDateWindow(7, 0)[0];
      const key = 'sleep-drop-' + weekStart;
      if (!isDismissed(key)) {
        alerts.push({
          id: 'sleep-score-drop', key,
          severity: 'watch', icon: zi('moon'),
          title: 'Sleep score dropped ' + Math.round(drop) + ' pts this week',
          body: 'Avg sleep score went from ' + (sleepTrend.score.current + Math.round(drop)) + ' to ' + sleepTrend.score.current + '. This could be a sleep regression, teething, or growth spurt.',
          tip: getEscalatedTip('sleep-score-drop'),
          action: { label: 'View Sleep', fn: 'switchTab("sleep")' },
          tab: 'sleep', dismissable: true
        });
      }
    }
  }

  // ─── 5. FOOD REACTION SUSPECT ───
  const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = toDateStr(twoDaysAgo);
  const recentNewFoods = foods.filter(f => f.date && f.date >= twoDaysAgoStr && f.date <= todayStr);
  if (recentNewFoods.length > 0) {
    const recentPoop = sortedPoop.filter(p => p.date >= twoDaysAgoStr && p.date <= todayStr);
    const unusualPoop = recentPoop.filter(p =>
      p.consistency === 'runny' || p.consistency === 'hard' || p.consistency === 'pellets' ||
      p.color === 'red' || p.color === 'black' || p.color === 'white' ||
      p.blood || p.mucus
    );
    if (unusualPoop.length > 0) {
      const foodNames = recentNewFoods.map(f => f.name).join(', ');
      const key = sanitizeAlertKey('food-reaction-' + recentNewFoods[0].date + '-' + recentNewFoods[0].name);
      if (!isDismissed(key)) {
        const poopDesc = unusualPoop.map(p => {
          const parts = [];
          if (p.consistency && p.consistency !== 'normal' && p.consistency !== 'soft') parts.push(p.consistency);
          if (p.blood) parts.push('blood');
          if (p.mucus) parts.push('mucus');
          if (p.color && ['red','black','white'].includes(p.color)) parts.push(p.color + ' colour');
          return parts.join(', ');
        }).filter(Boolean).join('; ');
        alerts.push({
          id: 'food-reaction', key,
          severity: 'watch', icon: zi('warn'),
          title: 'Possible food reaction — ' + foodNames,
          body: 'New food introduced within 48 hours (' + foodNames + ') and unusual poop detected' + (poopDesc ? ' (' + poopDesc + ')' : '') + '. Could be a reaction.',
          tip: getEscalatedTip('food-reaction'),
          action: { label: 'View Foods', fn: 'switchTab("diet")' },
          tab: 'diet', dismissable: true
        });
      }
    }
  }

  // ─── 6. DEVELOPMENTAL CHECK-UP DUE ───
  const DEV_CHECKUP_MONTHS = [6, 9, 12, 15, 18];
  for (const mo of DEV_CHECKUP_MONTHS) {
    const dueDate = new Date(DOB);
    dueDate.setMonth(dueDate.getMonth() + mo);
    const daysToDue = Math.floor((dueDate - new Date()) / 86400000);
    if (daysToDue <= 14 && daysToDue >= -14) {
      const hasVisit = (visits || []).some(v => {
        if (!v.date) return false;
        const diff = Math.abs(Math.floor((new Date(v.date) - dueDate) / 86400000));
        return diff <= 14;
      });
      if (!hasVisit) {
        const key = 'dev-checkup-' + mo + 'mo';
        if (!isDismissed(key)) {
          alerts.push({
            id: 'dev-checkup-due', key,
            severity: 'info', icon: zi('steth'),
            title: mo + '-month developmental check-up ' + (daysToDue > 0 ? 'due in ' + daysToDue + ' days' : daysToDue === 0 ? 'due today' : Math.abs(daysToDue) + ' days overdue'),
            body: 'Well-baby visits at ' + mo + ' months cover growth assessment, developmental milestones, and vaccination review.',
            tip: getEscalatedTip('dev-checkup-due'),
            action: { label: 'View Medical', fn: 'switchTab("medical")' },
            tab: 'medical', dismissable: true
          });
        }
      }
    }
  }

  // ─── 7. FOOD VARIETY STALE ───
  const recentFoodDates = foods.filter(f => f.date).map(f => f.date).sort().reverse();
  if (recentFoodDates.length > 0) {
    const lastNewFood = recentFoodDates[0];
    const daysSinceNew = Math.floor((new Date(todayStr) - new Date(lastNewFood)) / 86400000);
    if (daysSinceNew >= 14) {
      const key = 'food-variety-' + lastNewFood;
      if (!isDismissed(key)) {
        alerts.push({
          id: 'food-variety-stale', key,
          severity: 'info', icon: zi('rainbow'),
          title: 'No new food in ' + daysSinceNew + ' days',
          body: 'Introducing variety helps develop taste preferences and ensures nutritional balance. Time to try something new!',
          tip: getEscalatedTip('food-variety-stale'),
          action: { label: 'View Diet', fn: 'switchTab("diet")' },
          tab: 'diet', dismissable: true
        });
      }
    }
  }

  // ─── 8. VACCINATION REMINDER ───
  const upcoming = vaccData.find(v => v.upcoming);
  if (upcoming && upcoming.date) {
    const daysTo = Math.ceil((new Date(upcoming.date) - new Date()) / 86400000);
    const bookedData = load(KEYS.vaccBooked, null);
    const isBooked = bookedData && bookedData.vaccName === upcoming.name;
    if (daysTo > 7 && daysTo <= 14 && !isBooked) {
      const key = sanitizeAlertKey('vacc-reminder-' + upcoming.name);
      if (!isDismissed(key)) {
        alerts.push({
          id: 'vacc-reminder', key,
          severity: 'info', icon: zi('syringe'),
          title: upcoming.name + ' vaccination in ' + daysTo + ' days',
          body: 'Scheduled for ' + formatDate(upcoming.date) + '. Book the appointment if you haven\'t already.',
          tip: getEscalatedTip('vacc-reminder'),
          action: { label: 'View Vaccines', fn: 'switchTab("medical")' },
          tab: 'medical', dismissable: true
        });
      }
    }
  }

  // ─── 9. SUPPLEMENT STREAK BROKEN ───
  const activeMeds = meds.filter(m => m.active);
  activeMeds.forEach(m => {
    const mKey = sanitizeAlertKey(m.name);
    const streak = bl['suppStreak_' + mKey] || 0;
    // Check if yesterday was a miss (streak is 0 but there was a prior streak)
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const ydStr = toDateStr(yd);
    const ydLog = medChecks[ydStr] || {};
    const ydStatus = ydLog[m.name];
    const wasMissedYd = ydStr >= (medChecks._trackingSince || todayStr) && ydStr >= (m.start || '2025-09-04') && (!ydStatus || ydStatus === 'skipped');
    // Count how long the prior streak was before it broke
    if (wasMissedYd && streak === 0) {
      let priorStreak = 0;
      for (let i = 2; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        const dl = medChecks[ds] || {};
        if (dl[m.name] && dl[m.name].startsWith('done:')) priorStreak++;
        else break;
      }
      if (priorStreak >= 3) {
        const key = 'supp-streak-broken-' + mKey + '-' + ydStr;
        if (!isDismissed(key)) {
          alerts.push({
            id: 'supp-streak-broken', key,
            severity: 'watch', icon: zi('pill'),
            title: m.name + ' streak broken after ' + priorStreak + ' days',
            body: 'Yesterday\'s dose was missed or skipped, breaking a ' + priorStreak + '-day streak.',
            tip: getEscalatedTip('supp-streak-broken'),
            action: { label: 'View Medical', fn: 'switchTab("medical")' },
            tab: 'medical', dismissable: true
          });
        }
      }
    }
  });

  // ─── 10. LOW IRON ───
  if (bl.daysWithoutIron >= 3 && bl.mealLoggingStreak >= 2) {
    const key = 'low-iron-' + todayStr.substring(0, 7) + '-' + bl.daysWithoutIron;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'low-iron', key,
        severity: bl.daysWithoutIron >= 5 ? 'watch' : 'info', icon: zi('drop'),
        title: 'No iron-rich foods in ' + bl.daysWithoutIron + ' days',
        body: 'Iron is critical at ' + ageM + ' months as breastmilk iron stores deplete after 6 months. Add ragi, masoor dal, beetroot, or spinach.',
        tip: getEscalatedTip('low-iron'),
        action: { label: 'View Diet', fn: 'switchTab("diet")' },
        tab: 'diet', dismissable: true
      });
    }
  }

  // ─── 11. LOW CALCIUM ───
  if (bl.daysWithoutCalcium >= 4 && bl.mealLoggingStreak >= 2) {
    const key = 'low-calcium-' + todayStr.substring(0, 7) + '-' + bl.daysWithoutCalcium;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'low-calcium', key,
        severity: 'info', icon: zi('ruler'),
        title: 'No calcium-rich foods in ' + bl.daysWithoutCalcium + ' days',
        body: 'Calcium supports bone development and teeth. Add ragi, paneer, yoghurt, or sesame seeds.',
        tip: getEscalatedTip('low-calcium'),
        action: { label: 'View Diet', fn: 'switchTab("diet")' },
        tab: 'diet', dismissable: true
      });
    }
  }

  // ─── 12. LOW PROTEIN ───
  if (bl.daysWithoutProtein >= 2 && bl.mealLoggingStreak >= 2) {
    const key = 'low-protein-' + todayStr.substring(0, 7) + '-' + bl.daysWithoutProtein;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'low-protein', key,
        severity: bl.daysWithoutProtein >= 4 ? 'watch' : 'info', icon: zi('run'),
        title: bl.daysWithoutProtein + ' days without protein-rich foods',
        body: 'Protein is essential for growth and muscle development. Include dal, paneer, curd, egg (if introduced), or nut pastes.',
        tip: getEscalatedTip('low-protein'),
        action: { label: 'View Diet', fn: 'switchTab("diet")' },
        tab: 'diet', dismissable: true
      });
    }
  }

  // ─── 13. IRON WITHOUT VIT C PAIRING ───
  if (bl.ironDays7d >= 3 && bl.ironVitCPairCount === 0) {
    const key = 'iron-no-vitc-' + todayStr.substring(0, 7);
    if (!isDismissed(key)) {
      alerts.push({
        id: 'iron-no-vitc', key,
        severity: 'info', icon: zi('target'),
        title: 'Iron meals missing Vitamin C pairing',
        body: 'Ziva had iron-rich foods ' + bl.ironDays7d + ' times this week but never paired with Vitamin C, which can double iron absorption.',
        tip: getEscalatedTip('iron-no-vitc'),
        action: { label: 'View Diet', fn: 'switchTab("diet")' },
        tab: 'diet', dismissable: true
      });
    }
  }

  // ─── 14. MEAL MONOTONY ───
  if (bl.sameMealStreak >= 3) {
    const key = 'meal-monotony-' + todayStr;
    if (!isDismissed(key)) {
      alerts.push({
        id: 'meal-monotony', key,
        severity: 'info', icon: zi('hourglass'),
        title: 'Same meals for ' + bl.sameMealStreak + ' days in a row',
        body: 'Ziva has been eating the exact same meals for ' + bl.sameMealStreak + ' days. Variety ensures broader nutrient coverage and builds taste acceptance.',
        tip: getEscalatedTip('meal-monotony'),
        action: { label: 'View Diet', fn: 'switchTab("diet")' },
        tab: 'diet', dismissable: true
      });
    }
  }

  // ─── 15. MISSING MEAL (end-of-day prompt, also covers 0-meal after 7 PM) ───
  if (nowH >= 19) {
    const todayEntry = feedingData[todayStr] || {};
    const loggedMeals = ['breakfast', 'lunch', 'dinner'].filter(m => todayEntry[m]);
    const missingMeals = ['breakfast', 'lunch', 'dinner'].filter(m => !todayEntry[m]);
    if (missingMeals.length >= 1) {
      const missingLabels = missingMeals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ');
      const key = 'missing-meal-' + todayStr;
      if (!isDismissed(key)) {
        const firstMissing = missingMeals[0];
        const sev = loggedMeals.length === 0 ? 'watch' : 'info';
        const bodyMsg = loggedMeals.length === 0
          ? 'No meals logged today. Log what Ziva ate or mark meals as skipped.'
          : loggedMeals.length + '/3 meals logged. Log the rest or skip if Ziva didn\'t eat.';
        alerts.push({
          id: 'missing-meal', key,
          severity: sev, icon: zi('bowl'),
          title: loggedMeals.length === 0 ? 'No meals logged today' : missingLabels + ' not logged today',
          body: bodyMsg,
          tip: 'Logging every meal — even "skipped" or "just breastmilk" — helps build an accurate picture of intake patterns.',
          action: { label: 'Log ' + firstMissing.charAt(0).toUpperCase() + firstMissing.slice(1), fn: '_qlMeal="' + firstMissing + '";openQuickModal("feed")' },
          tab: 'diet', dismissable: true
        });
      }
    }
  }

  // ─── 16. REPEAT OFFENDER (food-poop correlation) ───
  const corrData = computeFoodPoopCorrelations();
  corrData.results.forEach(r => {
    if (r.status !== 'suspected' && r.status !== 'likely') return;
    const key = sanitizeAlertKey('food-correlation-' + r.food);
    if (isDismissed(key)) return;
    const pct = Math.round(r.correlationRate * 100);
    const conTypes = Object.keys(r.breakdown.consistency).filter(k => k !== 'normal' && k !== 'soft').join('/');
    alerts.push({
      id: 'food-correlation', key,
      severity: r.status === 'likely' ? 'action' : 'watch',
      icon: zi('flask'),
      title: capitalize(r.food) + ' linked to ' + (conTypes || 'abnormal') + ' stool (' + pct + '%)',
      body: capitalize(r.food) + ' has been followed by unusual poop ' + r.abnormalAfter + ' out of ' + r.totalOccurrences + ' times (' + r.confidence + ' confidence).',
      tip: getEscalatedTip('food-correlation'),
      action: { label: 'View Evidence', fn: 'switchTab("insights")' },
      tab: 'insights', dismissable: true
    });
  });

  // ─── 17. FOOD GROUP GAP ───
  const vsData = computeVarietyScore(7);
  const gapAlerts = vsData.gaps.concat(vsData.subcategoryGaps)
    .sort((a, b) => (b.daysSince || 99) - (a.daysSince || 99))
    .slice(0, 2); // max 2 at once
  gapAlerts.forEach(g => {
    const gapLabel = g.sub ? g.label : g.label;
    const key = sanitizeAlertKey('food-group-gap-' + (g.sub || g.group));
    if (isDismissed(key)) return;
    alerts.push({
      id: 'food-group-gap', key,
      severity: 'info', icon: zi('rainbow'),
      title: 'No ' + gapLabel.toLowerCase() + ' in ' + (g.daysSince !== null ? g.daysSince + ' days' : 'recorded history'),
      body: 'Dietary variety is important for balanced nutrition. Try adding foods from this group.',
      tip: getEscalatedTip('food-group-gap') || g.suggestion,
      action: { label: 'View Diet', fn: 'switchTab("diet")' },
      tab: 'diet', dismissable: true
    });
  });

  // ─── 18. DINNER→BEDTIME GAP WARNING ───
  {
    const todayEntry = feedingData[todayStr];
    const dinnerTime = todayEntry && todayEntry.dinner_time;
    if (dinnerTime && nowH >= 18) {
      // Find tonight's bedtime — check sleep in-progress or last night's data
      let bedtime = null;
      const sip = load('ziva_sleep_inprogress', null);
      if (sip && sip.type === 'night' && sip.startTime) {
        bedtime = sip.startTime;
      } else {
        // Check if tonight's sleep already logged
        const tonightSleep = sleepData.filter(s => s.type === 'night' && s.date === todayStr);
        if (tonightSleep.length > 0) bedtime = tonightSleep[tonightSleep.length - 1].bedtime;
      }
      if (bedtime) {
        const dinnerMins = parseInt(dinnerTime.split(':')[0]) * 60 + parseInt(dinnerTime.split(':')[1]);
        const bedMins = parseInt(bedtime.split(':')[0]) * 60 + parseInt(bedtime.split(':')[1]);
        const gapMins = bedMins >= dinnerMins ? bedMins - dinnerMins : (bedMins + 1440) - dinnerMins;
        if (gapMins > 0 && gapMins < 60) {
          const key = 'dinner-bed-gap-' + todayStr;
          if (!isDismissed(key)) {
            alerts.push({
              id: 'dinner-bed-gap', key,
              severity: 'watch', icon: zi('clock'),
              title: 'Dinner→bed gap is only ' + gapMins + ' min',
              body: 'Ziva had dinner at ' + formatTimeShort(dinnerTime) + ' and bedtime was ' + formatTimeShort(bedtime) + '. A gap under 60 minutes can cause discomfort, reflux, or restless sleep.',
              tip: 'Aim for 60–90 minutes between the last meal and bedtime. Tomorrow, try shifting dinner 15–20 minutes earlier.',
              action: { label: 'View Sleep', fn: 'switchTab("sleep")' },
              tab: 'sleep', dismissable: true
            });
          }
        }
      }
    }
  }

  // ─── 19. NEW FOOD REACTION WINDOW (3-day rule) ───
  {
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentIntros = (foods || []).filter(f => {
      if (!f.date) return false;
      const fDate = new Date(f.date);
      return fDate >= threeDaysAgo && f.date !== todayStr;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (recentIntros.length > 0) {
      const newest = recentIntros[0];
      const introDate = new Date(newest.date);
      const clearDate = new Date(introDate); clearDate.setDate(clearDate.getDate() + 3);
      const daysLeft = Math.ceil((clearDate - new Date()) / 86400000);
      if (daysLeft > 0) {
        const key = 'reaction-window-' + sanitizeAlertKey(newest.name);
        if (!isDismissed(key)) {
          const clearDateStr = toDateStr(clearDate);
          alerts.push({
            id: 'reaction-window', key,
            severity: 'info', icon: '🆕',
            title: newest.name + ' — watch window (' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left)',
            body: newest.name + ' was introduced on ' + formatDate(newest.date) + '. Wait until ' + formatDate(clearDateStr) + ' before introducing another new food, so any reactions can be clearly attributed.',
            tip: 'Watch for: rashes, unusual fussiness, vomiting, diarrhoea, or changes in poop within 48–72 hours of a new food.',
            action: { label: 'View Foods', fn: 'switchTab("diet")' },
            tab: 'diet', dismissable: true
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════
  // POSITIVE ALERTS (🎉)
  // ═══════════════════════════════════════

  // ─── P1. FIRST SLEEP-THROUGH ───
  if (bl.isFirstEverSleepThrough) {
    const key = 'positive-first-sleepthrough';
    alerts.push({
      id: 'first-sleepthrough', key,
      severity: 'positive', icon: zi('sparkle'),
      title: 'First full night\'s sleep!',
      body: 'Ziva slept through the night with zero wake-ups for the first time ever! This is a huge milestone.',
      tip: 'This doesn\'t mean every night will be like this — but it shows she CAN do it. Keep the same bedtime routine that worked.',
      action: { label: 'View Sleep', fn: 'switchTab("sleep")' },
      tab: 'sleep', dismissable: false
    });
  }

  // ─── P2. SLEEP SCORE STREAK ───
  if (bl.sleepGoodStreak >= 3) {
    const key = 'positive-sleep-streak-' + bl.sleepGoodStreak;
    const msg = bl.sleepGoodStreak >= 7 ? 'A full week of great sleep!' : bl.sleepGoodStreak + ' days of good sleep in a row!';
    alerts.push({
      id: 'sleep-streak', key,
      severity: 'positive', icon: zi('moon'),
      title: msg,
      body: 'Sleep score has been 75+ for ' + bl.sleepGoodStreak + ' consecutive days. Whatever you\'re doing is working.',
      tip: 'Consistency is key — keep the same bedtime, routine, and sleep environment. Note what\'s working so you can replicate it.',
      action: null, tab: 'sleep', dismissable: false
    });
  }

  // ─── P3. CONSISTENT DIGESTION ───
  if (bl.poopConsistentStreak >= 7) {
    const key = 'positive-digestion-' + Math.floor(bl.poopConsistentStreak / 7);
    alerts.push({
      id: 'consistent-digestion', key,
      severity: 'positive', icon: zi('check'),
      title: 'Digestion has been stable for ' + bl.poopConsistentStreak + '+ entries',
      body: 'All recent poops have been normal or soft consistency. Ziva\'s tummy is happy!',
      tip: 'Stable digestion means her gut is adjusting well to her current diet. A great time to try a new food if you haven\'t recently.',
      action: null, tab: 'poop', dismissable: false
    });
  }

  // ─── P4. FOOD VARIETY WIN ───
  if (bl.newFoodsThisWeek >= 3) {
    const key = 'positive-food-variety-' + todayStr.substring(0, 7); // monthly key
    alerts.push({
      id: 'food-variety-win', key,
      severity: 'positive', icon: zi('rainbow'),
      title: bl.newFoodsThisWeek + ' new foods this week!',
      body: 'Great variety — exposure to different tastes and textures in the first year shapes lifelong food preferences.',
      tip: 'Keep it up! Remember the 3-day rule for each new food to spot any reactions.',
      action: null, tab: 'diet', dismissable: false
    });
  }

  // ─── P5. MEAL LOGGING STREAK ───
  if (bl.mealLoggingStreak >= 5) {
    const key = 'positive-meal-streak-' + Math.floor(bl.mealLoggingStreak / 5);
    alerts.push({
      id: 'meal-logging-streak', key,
      severity: 'positive', icon: zi('note'),
      title: bl.mealLoggingStreak + '-day meal logging streak!',
      body: 'All 3 meals logged for ' + bl.mealLoggingStreak + ' consecutive days. Consistent tracking gives the best insights.',
      tip: 'Your data is building a clear picture of Ziva\'s eating patterns. The more consistent the logging, the better the insights.',
      action: null, tab: 'diet', dismissable: false
    });
  }

  // ─── P6. GROWTH ON TRACK ───
  if (bl.wtInHealthyRange && bl.growthConsistentWeeks >= 4) {
    const key = 'positive-growth-' + todayStr.substring(0, 7);
    alerts.push({
      id: 'growth-on-track', key,
      severity: 'positive', icon: zi('chart'),
      title: 'Growth on track for ' + bl.growthConsistentWeeks + '+ weeks',
      body: 'Weight velocity (' + bl.wtGPerWeek + ' g/week) is within the healthy range. Ziva is growing beautifully.',
      tip: 'Consistent, healthy weight gain is more important than hitting a specific number. Keep up the balanced nutrition.',
      action: null, tab: 'growth', dismissable: false
    });
  }

  // ─── P7. SUPPLEMENT STREAK ───
  activeMeds.forEach(m => {
    const mKey = sanitizeAlertKey(m.name);
    const streak = bl['suppStreak_' + mKey] || 0;
    if (streak >= 7) {
      const milestoneLabel = streak >= 30 ? 'A full month' : streak >= 14 ? '2 weeks straight' : '1 week';
      const milestoneMsg = streak >= 30
        ? 'Vitamin D consistency is key for bone development and calcium absorption.'
        : streak >= 14
        ? 'Ziva\'s calcium absorption is well-supported with consistent D3.'
        : 'Building strong bones with daily D3!';
      const key = 'positive-supp-' + mKey + '-' + Math.floor(streak / 7);
      alerts.push({
        id: 'supp-streak', key,
        severity: 'positive', icon: zi('pill'),
        title: milestoneLabel + ' of consistent ' + m.name + '!',
        body: streak + '-day streak. ' + milestoneMsg,
        tip: getD3Tip(streak),
        action: null, tab: 'medical', dismissable: false
      });
    }
  });

  // ─── P8. IRON-RICH WEEK ───
  if (bl.ironDays7d >= 5) {
    const key = 'positive-iron-week-' + todayStr.substring(0, 7);
    alerts.push({
      id: 'iron-rich-week', key,
      severity: 'positive', icon: zi('drop'),
      title: 'Iron-rich week — ' + bl.ironDays7d + '/7 days!',
      body: 'Ziva had iron-rich foods on ' + bl.ironDays7d + ' of the last 7 days. This is excellent for preventing anaemia and supporting brain development.',
      tip: bl.ironVitCPairCount >= 2 ? 'And you paired iron with Vitamin C ' + bl.ironVitCPairCount + ' times — maximum absorption!' : 'Tip: pair iron meals with Vitamin C (lemon, amla, orange) to boost absorption even further.',
      action: null, tab: 'diet', dismissable: false
    });
  }

  // ─── P9. GREAT NUTRIENT BALANCE ───
  if (bl.nutrientGroupsCovered >= 5) {
    const covered = KEY_NUTRIENTS.filter(n => (bl.nutrientDays || {})[n] >= 2).join(', ');
    const key = 'positive-nutrient-balance-' + todayStr.substring(0, 7);
    alerts.push({
      id: 'nutrient-balance', key,
      severity: 'positive', icon: zi('scale'),
      title: bl.nutrientGroupsCovered + ' of 8 nutrient groups covered this week!',
      body: 'Great nutritional diversity: ' + covered + '. A balanced diet supports all-round development.',
      tip: 'You\'re covering most key nutrients. To complete the picture, look for any gaps in: ' +
        KEY_NUTRIENTS.filter(n => (bl.nutrientDays || {})[n] < 2).join(', ') + '.',
      action: null, tab: 'diet', dismissable: false
    });
  }

  // ─── P10. IRON + VIT C SYNERGY ───
  if (bl.ironVitCPairCount >= 3) {
    const key = 'positive-iron-vitc-' + todayStr.substring(0, 7);
    alerts.push({
      id: 'iron-vitc-synergy', key,
      severity: 'positive', icon: zi('target'),
      title: 'Iron + Vitamin C paired ' + bl.ironVitCPairCount + ' times this week!',
      body: 'Pairing iron-rich foods with Vitamin C can double iron absorption. You\'re doing this consistently — excellent practice.',
      tip: 'This is one of the most impactful nutrition habits for babies. Keep it up — lemon on khichdi, amla after ragi, or mango with dal all work perfectly.',
      action: null, tab: 'diet', dismissable: false
    });
  }

  // ═══════════════════════════════════════
  // FEVER EPISODE ALERTS
  // ═══════════════════════════════════════
  try {
    const feverAlerts = computeFeverAlerts();
    feverAlerts.forEach(a => alerts.push(a));
  } catch(e) { /* fever alerts best effort */ }

  try {
    const deAlerts = computeDiarrhoeaAlerts();
    deAlerts.forEach(a => alerts.push(a));
  } catch(e) { /* diarrhoea alerts best effort */ }

  try {
    const voAlerts = computeVomitingAlerts();
    voAlerts.forEach(a => alerts.push(a));
  } catch(e) { /* vomiting alerts best effort */ }

  try {
    const ceAlerts = computeColdAlerts();
    ceAlerts.forEach(a => alerts.push(a));
  } catch(e) { /* cold alerts best effort */ }

  // ═══════════════════════════════════════
  // SORT, SYNTHESIS, AUTO-CLEAR, LOG
  // ═══════════════════════════════════════

  // ── Sort by severity (action → watch → info → positive) ──
  alerts.sort((a, b) => (SEV_ORDER[a.severity] || 3) - (SEV_ORDER[b.severity] || 3));

  // ── Cross-alert synthesis ──
  const warningAlerts = alerts.filter(a => a.severity !== 'positive');
  const positiveAlerts = alerts.filter(a => a.severity === 'positive');
  const { alerts: synthesizedWarnings, synthesisNarrative } = applyCrossSynthesis(warningAlerts);
  const finalAlerts = [...synthesizedWarnings, ...positiveAlerts];

  // ── Auto-clear: remove dismissed entries whose condition no longer exists ──
  const activeKeys = new Set(finalAlerts.map(a => a.key));
  const st = loadAlertState();
  let changed = false;
  for (const dKey of Object.keys(st.dismissed)) {
    if (!activeKeys.has(dKey)) {
      logAlertEvent(dKey, 'resolved', dKey);
      delete st.dismissed[dKey];
      changed = true;
    }
  }
  if (changed) saveAlertState(st);

  // ── Auto-resolve: mark previously triggered alerts as resolved if condition cleared ──
  // Only check alerts triggered in last 14 days to avoid processing ancient history
  const resolveHist = loadAlertHistory();
  const d14ms = 14 * 86400000;
  const unresolvedKeys = new Set();
  resolveHist.forEach(h => {
    const ts = h.ts ? new Date(h.ts).getTime() : 0;
    if (h.event === 'triggered' && (Date.now() - ts) < d14ms) unresolvedKeys.add(h.key);
    if (h.event === 'resolved') unresolvedKeys.delete(h.key);
  });
  unresolvedKeys.forEach(uk => {
    if (!activeKeys.has(uk)) {
      logAlertEvent(uk, 'resolved', uk);
    }
  });

  // ── Log newly triggered alerts (deduplicated per day) ──
  const prevTriggered = _prevAlertKeys || new Set();
  const currentKeys = new Set(finalAlerts.map(a => a.key));
  if (!prevTriggered.size) {
    const hist = loadAlertHistory();
    const triggeredToday = new Set(
      hist.filter(h => h.event === 'triggered' && h.ts && h.ts.startsWith(todayStr)).map(h => h.key)
    );
    for (const a of finalAlerts) {
      if (!triggeredToday.has(a.key)) {
        logAlertEvent(a.key, 'triggered', a.title, a.severity);
      }
    }
  } else {
    for (const a of finalAlerts) {
      if (!prevTriggered.has(a.key)) {
        logAlertEvent(a.key, 'triggered', a.title, a.severity);
      }
    }
  }
  _prevAlertKeys = currentKeys;

  // Attach synthesis narrative for UI
  finalAlerts._synthesisNarrative = synthesisNarrative;

  return finalAlerts;
}
let _prevAlertKeys = null;

// ── Render a single alert card HTML ──
const _alertActionRegistry = {};
function execAlertAction(key) {
  const fn = _alertActionRegistry[key];
  if (fn) { try { (new Function(fn))(); } catch(e) { console.warn('Alert action error:', e); } }
}
function renderAlertCardHTML(a, scope) {
  const safeKey = (scope || '') + a.key.replace(/[^a-zA-Z0-9-]/g, '_');
  const sevClass = SEV_CLASS[a.severity] || 'ca-info';
  const sevBadge = SEV_BADGE[a.severity] || 'sev-info';
  const sevLabel = SEV_LABEL[a.severity] || zi('check') + ' Info';
  // Register action fn safely
  if (a.action && a.action.fn) _alertActionRegistry[safeKey] = a.action.fn;
  return `<div class="ctx-alert ${sevClass}" id="ca-${safeKey}">
    ${a.dismissable ? `<button class="ctx-alert-dismiss" data-action="dismissAlert" data-stop="1" data-arg="${escAttr(a.key)}" data-arg2="${escAttr(a.title)}" aria-label="Dismiss">&times;</button>` : ''}
    <div class="ctx-alert-top">
      <div class="ctx-alert-icon">${a.icon}</div>
      <div class="ctx-alert-body">
        <div class="ctx-alert-title">${escHtml(a.title)} <span class="ctx-alert-sev ${sevBadge}">${sevLabel}</span></div>
        <div class="ctx-alert-msg">${escHtml(a.body)}</div>
        ${a.tip ? `<div class="ctx-alert-tip-toggle" data-action="toggleAlertTip" data-arg="${safeKey}" data-stop="1">${zi('bulb')} Tips & advice ▾</div>
        <div class="ctx-alert-tip" id="ca-tip-${safeKey}">${escHtml(a.tip)}</div>` : ''}
        <div class="ctx-alert-actions">
          ${a.action ? `<button class="ctx-alert-btn cab-primary" data-action="execAlertAction" data-arg="${safeKey}" data-stop="1">${escHtml(a.action.label)}</button>` : ''}
          ${a.tab ? `<button class="ctx-alert-btn cab-secondary" data-action="switchTab" data-arg="${escAttr(a.tab)}" data-stop="1">View details</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Render alerts on Insights tab (full list) ──
function renderInsightsAlerts() {
  const alertsCard = document.getElementById('insightsAlertsCard');
  const alertsEl = document.getElementById('insightsAlertsContent');
  const alertsCountEl = document.getElementById('insightsAlertsCount');
  const winsCard = document.getElementById('insightsWinsCard');
  const winsEl = document.getElementById('insightsWinsContent');
  const winsCountEl = document.getElementById('insightsWinsCount');

  const alerts = computeAlerts();
  const warnings = alerts.filter(a => a.severity !== 'positive');
  const positives = alerts.filter(a => a.severity === 'positive');

  // ── Needs Attention card (warnings only) ──
  if (alertsCard && alertsEl) {
    if (warnings.length === 0) {
      alertsCard.style.display = 'none';
    } else {
      alertsCard.style.display = '';
      if (alertsCountEl) alertsCountEl.textContent = warnings.length + ' alert' + (warnings.length !== 1 ? 's' : '');
      let html = '';
      if (alerts._synthesisNarrative) {
        html += `<div class="ca-synthesis-narrative">${zi('link')} Pattern detected: ${escHtml(alerts._synthesisNarrative)}</div>`;
      }
      html += warnings.map(a => renderAlertCardHTML(a, 'ins-')).join('');
      alertsEl.innerHTML = html;
    }
  }

  // ── Wins card (positives only) ──
  if (winsCard && winsEl) {
    if (positives.length === 0) {
      winsCard.style.display = 'none';
    } else {
      winsCard.style.display = '';
      if (winsCountEl) winsCountEl.textContent = positives.length + ' win' + (positives.length !== 1 ? 's' : '');
      winsEl.innerHTML = positives.map(a => renderAlertCardHTML(a, 'insw-')).join('');
    }
  }
}

// ── Render alerts on Home — UNIFIED (v2.3: merged reminders + context alerts + wins) ──
function renderHomeContextAlerts() {
  const card = document.getElementById('homeUnifiedAlertsCard');
  const el = document.getElementById('unifiedAlertsContent');
  const countEl = document.getElementById('unifiedAlertsCount');
  const zenEl = document.getElementById('homeZenState');
  if (!card || !el) return;

  // v2.3: Grab reminders HTML from renderRemindersAndAlerts()
  const remindersHTML = window._remindersHTML || '';

  const alerts = computeAlerts();
  const actionAlerts = alerts.filter(a => a.severity === 'action');
  const watchAlerts = alerts.filter(a => a.severity === 'watch');
  const infoAlerts = alerts.filter(a => a.severity === 'info');
  const positiveAlerts = alerts.filter(a => a.severity === 'positive');

  // Essential Mode: only show action-level alerts (vaccine due, no-feed), hide watch/info
  const essential = isEssentialMode();
  const homeWarnings = essential
    ? actionAlerts
    : [...actionAlerts, ...watchAlerts.slice(0, 3)];
  const homePositives = essential ? [] : positiveAlerts.slice(0, 2);
  const remainingWarnings = actionAlerts.length + watchAlerts.length + infoAlerts.length - homeWarnings.length;
  const remainingPositives = positiveAlerts.length - homePositives.length;

  let contextHTML = '';

  // Synthesis narrative (cross-alert pattern detection)
  if (alerts._synthesisNarrative && homeWarnings.length > 0) {
    contextHTML += `<div class="ca-synthesis-narrative">${zi('link')} ${escHtml(alerts._synthesisNarrative)}</div>`;
  }

  // Warning alerts
  contextHTML += homeWarnings.map(a => renderAlertCardHTML(a, 'hm-')).join('');
  if (remainingWarnings > 0) {
    contextHTML += `<div class="ca-view-all" data-tab-scroll="insights" data-scroll-to="insightsAlertsCard" data-scroll-block="center">+ ${remainingWarnings} more alert${remainingWarnings !== 1 ? 's' : ''} in Insights <span class="ca-badge">${remainingWarnings}</span> →</div>`;
  }

  // Combine: reminders first (urgent), then context alerts, then wins
  let combined = remindersHTML;

  // Divider between reminders and context alerts
  if (remindersHTML && contextHTML) {
    combined += `<div style="border-top:1px solid var(--border-subtle);margin:4px 0;"></div>`;
  }
  combined += contextHTML;

  // Divider before wins
  if ((remindersHTML || contextHTML) && homePositives.length > 0) {
    combined += `<div style="border-top:1px solid var(--border-subtle);margin:4px 0;"></div>`;
  }

  // Wins
  combined += homePositives.map(a => renderAlertCardHTML(a, 'hmw-')).join('');
  if (remainingPositives > 0) {
    combined += `<div class="ca-view-all" data-tab-scroll="insights" data-scroll-to="insightsWinsCard" data-scroll-block="center">+ ${remainingPositives} more win${remainingPositives !== 1 ? 's' : ''} in Insights →</div>`;
  }

  const hasAnything = combined.trim().length > 0;
  if (hasAnything) {
    card.style.display = '';
    const totalCount = homeWarnings.length + homePositives.length + (remindersHTML ? 1 : 0);
    if (countEl) countEl.textContent = '';
    el.innerHTML = combined;
    if (zenEl) zenEl.style.display = 'none';
  } else {
    card.style.display = 'none';
    if (zenEl) zenEl.style.display = '';
  }
}

// ── Render alert history in History tab ──
function renderAlertHistory() {
  const card = document.getElementById('alertHistoryCard');
  const el = document.getElementById('alertHistoryContent');
  const prevEl = document.getElementById('alertHistPreview');
  if (!el) return;

  const history = loadAlertHistory();

  // Preview
  if (prevEl) {
    const triggered = history.filter(h => h.event === 'triggered').length;
    const resolved = history.filter(h => h.event === 'resolved').length;
    const dismissed = history.filter(h => h.event === 'dismissed').length;
    if (history.length === 0) {
      prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">No alert history yet</span></div>';
    } else {
      let pills = '';
      if (triggered > 0) pills += `<span class="ins-preview-pill ipp-warn">${triggered} triggered</span>`;
      if (resolved > 0)  pills += `<span class="ins-preview-pill ipp-good">${resolved} resolved</span>`;
      if (dismissed > 0) pills += `<span class="ins-preview-pill ipp-neutral">${dismissed} dismissed</span>`;
      prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
    }
  }

  if (history.length === 0) {
    el.innerHTML = '<div class="alert-hist-empty">No alert events yet. Alerts will appear here as they are triggered, dismissed, or resolved.</div>';
    return;
  }

  // Show last 50 events
  const shown = history.slice(0, 50);
  let html = '';
  shown.forEach(h => {
    const dotClass = h.event === 'triggered' ? 'ahd-triggered' : h.event === 'resolved' ? 'ahd-resolved' : 'ahd-dismissed';
    const eventLabel = h.event === 'triggered' ? 'Triggered' : h.event === 'resolved' ? 'Resolved' : 'Dismissed';
    const eventIcon = h.event === 'triggered' ? zi('bell') : h.event === 'resolved' ? zi('check') : zi('bell');
    const ts = h.ts ? new Date(h.ts) : null;
    const timeStr = ts && !isNaN(ts) ? ts.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) + ' · ' + ts.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : 'Unknown time';
    html += `<div class="alert-hist-item">
      <div class="alert-hist-dot ${dotClass}"></div>
      <div class="alert-hist-body">
        <div class="alert-hist-title">${eventIcon} ${escHtml(h.title || h.key)}</div>
        <div class="alert-hist-meta">${eventLabel} · ${timeStr}</div>
      </div>
    </div>`;
  });
  if (history.length > 50) {
    html += `<div class="alert-hist-empty">Showing 50 of ${history.length} events</div>`;
  }
  el.innerHTML = html;
}

// ── RENDER INSIGHTS TAB ──
// ══════════════════════════════════════════════════════════
// ██ INSIGHTS POPUP (Quick View from bottom-left FAB)
// ══════════════════════════════════════════════════════════
// ██ TODAY'S PLAN (Insights Tab — full version)
// ══════════════════════════════════════════════════════════

function renderTodayPlan() {
  const el = document.getElementById('todayPlanContent');
  const dateEl = document.getElementById('todayPlanDate');
  if (!el) return;

  const todayStr = today();
  const nowH = new Date().getHours();
  const ageM = ageAt().months;
  const bl = computeBaselines();
  const todayEntry = feedingData[todayStr] || {};

  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });

  let items = [];

  // ═══ UPCOMING MEDICAL (vaccination + doctor visits) ═══
  const upcomingVacc = vaccData.find(v => v.upcoming);
  const bookedData = load(KEYS.vaccBooked, null);
  const vaccIsBooked = bookedData && upcomingVacc && bookedData.vaccName === upcomingVacc.name;
  const vaccHasAppt = vaccIsBooked && bookedData.apptDate;

  if (upcomingVacc) {
    if (vaccHasAppt) {
      // Booked with appointment details
      const apptDaysTo = Math.ceil((new Date(bookedData.apptDate) - new Date(todayStr)) / 86400000);
      if (apptDaysTo === 0) {
        // Today is the appointment — inject into the correct time slot (handled below in the slot blocks)
        window._vaccApptToday = { name: upcomingVacc.name, slot: bookedData.apptSlot, label: getVaccApptLabel(bookedData) };
      } else if (apptDaysTo > 0 && apptDaysTo <= 3) {
        // Appointment in 1–3 days — show heads-up at top
        items.push({
          time: apptDaysTo === 1 ? 'Tmrw' : apptDaysTo + 'd',
          icon: zi('syringe'), title: upcomingVacc.name,
          detail: zi('check') + ' Booked — ' + getVaccApptLabel(bookedData),
          tag: 'med', done: true, htmlDetail: true
        });
      } else if (apptDaysTo < 0) {
        // Appointment was in the past but vaccine not given yet — overdue
        items.push({
          time: 'Due', icon: zi('syringe'), title: upcomingVacc.name,
          detail: zi('warn') + ' Appointment was ' + formatDate(bookedData.apptDate) + ' — reschedule',
          tag: 'med', done: false, htmlDetail: true
        });
      }
      // Beyond 3 days — don't clutter the plan
    } else if (vaccIsBooked && !vaccHasAppt) {
      // Booked but no details — nudge to add date
      items.push({
        time: zi('clock'), icon: zi('syringe'), title: upcomingVacc.name,
        detail: '' + zi('check') + ' Booked — tap to add appointment date & time',
        tag: 'med', done: false, htmlDetail: true,
        action: `openVaccApptModal('${escAttr(upcomingVacc.name)}')`
      });
    } else {
      // Not booked — show as urgent item at top
      const vaccDaysTo = Math.ceil((new Date(upcomingVacc.date) - new Date()) / 86400000);
      if (vaccDaysTo >= 0 && vaccDaysTo <= 7) {
        items.push({
          time: vaccDaysTo === 0 ? 'Today' : vaccDaysTo + 'd',
          icon: zi('syringe'), title: upcomingVacc.name,
          detail: 'Book your appointment — due ' + formatDate(upcomingVacc.date),
          tag: 'med', done: false
        });
      }
    }
  }

  // Other medical events (doctor visits, checkups — not vaccinations)
  const upcomingEvents = getUpcomingEvents(7);
  const otherMedEvents = upcomingEvents.filter(ev =>
    (ev.type === 'medical' || (ev.title && (ev.title.toLowerCase().includes('doctor') || ev.title.toLowerCase().includes('checkup')))) &&
    !(ev.title && upcomingVacc && ev.title.includes(upcomingVacc.name))
  );
  otherMedEvents.forEach(ev => {
    const daysUntil = Math.round((new Date(ev.date) - new Date(todayStr)) / 86400000);
    items.push({
      time: daysUntil === 0 ? 'Today' : daysUntil + 'd',
      icon: ev.icon || zi('medical'), title: ev.title || ev.name,
      detail: formatDate(ev.date), tag: 'med', done: false
    });
  });

  // ═══ MORNING BLOCK ═══
  items.push({ section: 'Morning' });

  // Vaccination appointment (morning slot)
  if (window._vaccApptToday && window._vaccApptToday.slot === 'morning') {
    items.push({
      time: 'AM', icon: zi('syringe'), title: window._vaccApptToday.name,
      detail: 'Vaccination appointment today — ' + window._vaccApptToday.label,
      tag: 'med', done: false
    });
  }

  // D3 supplement
  const d3Med = meds.find(m => m.active && m.name.toLowerCase().includes('d3'));
  if (d3Med) {
    const d3Done = medChecks[todayStr] && medChecks[todayStr][d3Med.name] && medChecks[todayStr][d3Med.name].startsWith('done:');
    items.push({
      time: '9 AM', icon: zi('pill'), title: d3Med.name,
      detail: d3Done ? '<svg class="zi"><use href="#zi-check"/></svg> Done today' : d3Med.dose + ' — give with or after a feed for best absorption',
      tag: 'med', done: d3Done, htmlDetail: d3Done
    });
  }

  // Breakfast
  const bfDone = isRealMeal(todayEntry.breakfast);
  const bfNutrientGap = bl.nutrientDays ? KEY_NUTRIENTS.filter(n => (bl.nutrientDays[n] || 0) < 2) : [];
  let bfSuggestion = '';
  if (!bfDone) {
    if (bfNutrientGap.includes('iron')) bfSuggestion = 'Try ragi porridge — excellent iron source for this age';
    else if (bfNutrientGap.includes('calcium')) bfSuggestion = 'Ragi or almond porridge for calcium boost';
    else if (bfNutrientGap.includes('protein')) bfSuggestion = 'Add almond paste or dal water to porridge for protein';
    else bfSuggestion = 'Porridge (ragi/oats/dalia) with ghee is a balanced start';
  }
  items.push({
    time: '8–9', icon: zi('sun'), title: 'Breakfast',
    detail: bfDone ? zi('check') + ' ' + escHtml(todayEntry.breakfast) : bfSuggestion,
    tag: 'food', done: bfDone, htmlDetail: bfDone,
    action: bfDone ? null : '_qlMeal="breakfast";openQuickModal("feed")'
  });

  // Morning nap
  const todaySleep = sleepData.filter(e => e.date === todayStr);
  const hasMorningNap = todaySleep.some(e => e.type === 'nap' && e.bedtime && parseInt(e.bedtime) < 12);
  const napWindowStart = ageM <= 7 ? '9:00' : '9:30';
  const napDuration = ageM <= 7 ? '1–1.5 hours' : '45 min – 1 hour';
  items.push({
    time: '9:30', icon: zi('zzz'), title: 'Morning nap',
    detail: hasMorningNap ? zi('check') + ' Logged' : 'Aim for ' + napDuration + '. Watch for yawning, eye rubbing, fussiness.',
    tag: 'sleep', done: hasMorningNap, htmlDetail: hasMorningNap
  });

  // Tummy time / motor activity — check if already logged today
  const acts = typeof getFilteredActivities === 'function' ? getFilteredActivities() : [];
  const todayActivities = Array.isArray(activityLog[todayStr]) ? activityLog[todayStr] : [];

  // Prioritize under-evidenced domains
  const domainEvCounts = { motor: 0, language: 0, social: 0, cognitive: 0, sensory: 0 };
  Object.values(activityLog).forEach(dayEntries => {
    if (!Array.isArray(dayEntries)) return;
    dayEntries.forEach(e => { (e.domains || []).forEach(d => { domainEvCounts[d] = (domainEvCounts[d] || 0) + 1; }); });
  });
  const underEvidenced = Object.entries(domainEvCounts).sort((a, b) => a[1] - b[1]);
  const weakestDomain = underEvidenced[0]?.[0] || 'motor';

  // Pick a prioritized activity: prefer weakest domain if different from motor
  let priorityAct = null;
  if (weakestDomain !== 'motor') {
    priorityAct = acts.find(a => a.type === weakestDomain);
  }

  const motorAct = acts.find(a => a.type === 'motor');
  const motorLogged = todayActivities.some(e => (e.domains || []).includes('motor'));
  const motorTitle = motorAct ? motorAct.title : 'Tummy time & play';
  items.push({
    time: '10:30', icon: zi('run'), title: motorTitle,
    detail: motorLogged ? zi('check') + ' Logged today' : (motorAct ? motorAct.desc.substring(0, 80) + (motorAct.desc.length > 80 ? '…' : '') : '3-5 sessions daily, 5 min each. Builds core strength for crawling.'),
    tag: 'play', done: motorLogged, htmlDetail: motorLogged,
    action: motorLogged ? null : 'openActivityLogPrefilled(\'' + escAttr(motorTitle.split(' — ')[0]) + '\', 5, \'plan\')'
  });

  // ═══ MIDDAY BLOCK ═══
  items.push({ section: 'Midday' });

  // Vaccination appointment (afternoon slot)
  if (window._vaccApptToday && window._vaccApptToday.slot === 'afternoon') {
    items.push({
      time: 'PM', icon: zi('syringe'), title: window._vaccApptToday.name,
      detail: 'Vaccination appointment today — ' + window._vaccApptToday.label,
      tag: 'med', done: false
    });
  }

  // Lunch
  const lnDone = isRealMeal(todayEntry.lunch);
  let lnSuggestion = '';
  if (!lnDone) {
    if (bfNutrientGap.includes('iron') && bfNutrientGap.includes('vitamin C'))
      lnSuggestion = 'Masoor dal khichdi + lemon squeeze — iron + vit C combo';
    else if (bfNutrientGap.includes('protein'))
      lnSuggestion = 'Dal khichdi with ghee — protein + carbs + fat';
    else
      lnSuggestion = 'Vegetable khichdi or dal rice — a balanced lunch';
  }
  items.push({
    time: '12–1', icon: zi('sun'), title: 'Lunch',
    detail: lnDone ? zi('check') + ' ' + escHtml(todayEntry.lunch) : lnSuggestion,
    tag: 'food', done: lnDone, htmlDetail: lnDone,
    action: lnDone ? null : '_qlMeal="lunch";openQuickModal("feed")'
  });

  // Afternoon nap
  const hasAfternoonNap = todaySleep.some(e => e.type === 'nap' && e.bedtime && parseInt(e.bedtime) >= 12);
  items.push({
    time: '1:30', icon: zi('zzz'), title: 'Afternoon nap',
    detail: hasAfternoonNap ? '' + zi('check') + ' Logged' : 'Usually the longest nap. Dim the room, white noise helps.',
    tag: 'sleep', done: hasAfternoonNap, htmlDetail: hasAfternoonNap
  });

  // Language/sensory activity — prefer under-evidenced domain
  const langAct = priorityAct || acts.find(a => a.type === 'language' || a.type === 'sensory');
  if (langAct) {
    const langDomain = langAct.type || 'language';
    const langLogged = todayActivities.some(e => (e.domains || []).includes(langDomain));
    items.push({
      time: '3 PM', icon: langAct.icon || zi('chat'), title: langAct.title,
      detail: langLogged ? zi('check') + ' Logged today' : langAct.desc.substring(0, 80) + (langAct.desc.length > 80 ? '…' : ''),
      tag: 'play', done: langLogged, htmlDetail: langLogged,
      action: langLogged ? null : 'openActivityLogPrefilled(\'' + escAttr(langAct.title.split(' — ')[0]) + '\', 5, \'plan\')'
    });
  }

  // ═══ EVENING BLOCK ═══
  items.push({ section: 'Evening' });

  // Vaccination appointment (evening slot)
  if (window._vaccApptToday && window._vaccApptToday.slot === 'evening') {
    items.push({
      time: 'Eve', icon: zi('syringe'), title: window._vaccApptToday.name,
      detail: 'Vaccination appointment today — ' + window._vaccApptToday.label,
      tag: 'med', done: false
    });
  }

  // Monthly birthday (show from 2 days before through the day)
  const monthlyBdays = getZivaMonthDays();
  const upcomingBday = monthlyBdays.find(ev => {
    const daysUntil = Math.round((new Date(ev.date) - new Date(todayStr)) / 86400000);
    return daysUntil >= 0 && daysUntil <= 2;
  });
  if (upcomingBday) {
    const bdayDays = Math.round((new Date(upcomingBday.date) - new Date(todayStr)) / 86400000);
    const bdayActivities = getEventActivities(upcomingBday) || [];
    const activityTip = bdayActivities.length > 0 ? bdayActivities[Math.floor(Math.random() * bdayActivities.length)].text : '';
    let bdayDetail = '';
    if (bdayDays === 0) {
      bdayDetail = zi('party') + ' Today! ' + (activityTip || 'Take a monthly photo and celebrate!');
    } else if (bdayDays === 1) {
      bdayDetail = 'Tomorrow! Plan a photo session or special outfit.';
    } else {
      bdayDetail = 'In 2 days — prep a monthly photo setup or new food to mark the day.';
    }
    items.push({
      time: bdayDays === 0 ? 'Today' : bdayDays === 1 ? 'Tmrw' : '2d',
      icon: zi('sprout'), title: upcomingBday.title,
      detail: bdayDetail, tag: 'event', done: false, htmlDetail: true
    });
  }

  // Dinner
  const dnDone = isRealMeal(todayEntry.dinner);
  let dnSuggestion = '';
  if (!dnDone) {
    if (bfNutrientGap.includes('fibre'))
      dnSuggestion = 'Vegetable soup or bottle gourd dal — light on tummy, good fibre';
    else
      dnSuggestion = 'Keep dinner light — moong dal soup, ragi porridge, or veg mash';
  }
  items.push({
    time: '6–7', icon: zi('moon'), title: 'Dinner',
    detail: dnDone ? zi('check') + ' ' + escHtml(todayEntry.dinner) : dnSuggestion,
    tag: 'food', done: dnDone, htmlDetail: dnDone,
    action: dnDone ? null : '_qlMeal="dinner";openQuickModal("feed")'
  });

  // Snack
  const skDone = isRealMeal(todayEntry.snack);
  items.push({
    time: '10–4', icon: zi('spoon'), title: 'Snack',
    detail: skDone ? zi('check') + ' ' + escHtml(todayEntry.snack) : 'A quick bite between meals — fruit mash, ragi biscuit, or curd',
    tag: 'food', done: skDone, htmlDetail: skDone,
    action: skDone ? null : '_qlMeal="snack";openQuickModal("feed")'
  });

  // Bedtime routine
  const lastNights = sleepData.filter(e => e.type === 'night').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  let avgBedtime = null;
  if (lastNights.length >= 3) {
    const slice = lastNights.slice(0, 5);
    let sum = 0, count = 0;
    slice.forEach(n => {
      if (!n.bedtime) return;
      const [h, m] = n.bedtime.split(':').map(Number);
      sum += h * 60 + m; count++;
    });
    if (count >= 2) avgBedtime = sum / count;
  }
  const bedtimeStr = avgBedtime ? Math.floor(avgBedtime / 60) + ':' + String(Math.floor(avgBedtime % 60)).padStart(2, '0') : '8:00';

  items.push({
    time: bedtimeStr.replace(/^(\d):/, '0$1:').substring(0, 5), icon: zi('moon'), title: 'Wind down → bedtime',
    detail: 'Bath → dim lights → feed → bed. ' + (avgBedtime ? 'Her usual bedtime is around ' + bedtimeStr.substring(0, 5) + '.' : 'Aim for consistent bedtime.'),
    tag: 'sleep'
  });

  // ═══ LOOKOUTS (all day) ═══
  const lookouts = [];

  // Poop lookout
  const sortedPoop = poopData.slice().sort((a, b) => ((b.date||'') + (b.time||'')).localeCompare((a.date||'') + (a.time||'')));
  if (sortedPoop.length > 0) {
    const daysSinceLastPoop = Math.floor((new Date(todayStr) - new Date(sortedPoop[0].date)) / 86400000);
    const todayPoopCount = poopData.filter(p => p.date === todayStr).length;
    if (daysSinceLastPoop >= 2 && todayPoopCount === 0) {
      lookouts.push({ icon: zi('diaper'), text: daysSinceLastPoop + ' days since last poop — watch for straining or discomfort. Offer extra water and fibre-rich foods.', tag: 'poop' });
    }
    if (bl.poopDominantConsistency === 'hard') {
      lookouts.push({ icon: zi('warn'), text: 'Recent stools have been hard. Prioritise pear, papaya, extra water today. Reduce banana and rice.', tag: 'poop' });
    }
  }

  // Teething lookout (based on age)
  if (ageM >= 5 && ageM <= 10) {
    const recentNotes = (notes || []).filter(n => {
      const nDate = n.date ? n.date.split('T')[0] : '';
      return nDate >= toDateStr(new Date(Date.now() - 7 * 86400000));
    });
    const teethingMentioned = recentNotes.some(n => /teeth|teething|drool|gum/i.test(n.text));
    if (teethingMentioned) {
      lookouts.push({ icon: zi('baby'), text: 'Teething signs noted recently. Expect fussiness, disrupted sleep, reduced appetite. Cold teething ring helps.', tag: 'lookout' });
    }
  }

  // Iron pairing lookout
  if (bl.ironDays7d >= 3 && bl.ironVitCPairCount < 1) {
    lookouts.push({ icon: zi('target'), text: 'Pair today\'s iron meals with Vitamin C (lemon, amla, orange) — doubles iron absorption.', tag: 'food' });
  }

  // Vaccination lookout
  if (upcomingVacc && upcomingVacc.date) {
    const lookoutDaysTo = Math.ceil((new Date(upcomingVacc.date) - new Date()) / 86400000);
    if (lookoutDaysTo >= 0 && lookoutDaysTo <= 7) {
      if (vaccHasAppt) {
        const apptLabel = getVaccApptLabel(bookedData);
        lookouts.push({ icon: zi('syringe'), text: upcomingVacc.name + ' — appointment ' + apptLabel, tag: 'med' });
      } else if (vaccIsBooked) {
        lookouts.push({ icon: zi('syringe'), text: upcomingVacc.name + ' — booked, add appointment details for reminders.', tag: 'med' });
      } else {
        lookouts.push({ icon: zi('syringe'), text: upcomingVacc.name + ' due in ' + lookoutDaysTo + ' day' + (lookoutDaysTo !== 1 ? 's' : '') + '. Book your appointment.', tag: 'med' });
      }
    }
  }

  // Sleep pattern lookout
  if (bl.sleepAvg30d != null && bl.sleepAvg30d < 60) {
    lookouts.push({ icon: zi('moon'), text: 'Sleep quality has been low recently. Focus on consistent bedtime and a calm wind-down routine tonight.', tag: 'sleep' });
  }

  // Milestone lookouts
  const msScore = calcMilestoneScore();
  const msDet = msScore.detail || {};
  // In-progress milestones nudge
  const inProgressMs = milestones.filter(m => isMsActive(m));
  if (inProgressMs.length > 0) {
    const oldest = inProgressMs.sort((a, b) => (a.inProgressAt || '').localeCompare(b.inProgressAt || ''))[0];
    const daysIP = oldest.inProgressAt ? Math.floor((new Date() - new Date(oldest.inProgressAt)) / 86400000) : null;
    if (daysIP && daysIP >= 7) {
      lookouts.push({ icon: zi('trophy'), text: '"' + oldest.text + '" has been in-progress for ' + daysIP + ' days. Try focused practice today.', tag: 'milestone' });
    }
  }
  // Next expected milestones not yet started
  const ageMo = Math.floor(ageAt().months);
  const brackets = Object.keys(getUpcomingMilestones()).map(Number).sort((a, b) => a - b);
  const currentBracket = brackets.find(br => br >= ageMo) || brackets[brackets.length - 1];
  const expectedItems = (getUpcomingMilestones()[currentBracket] || []).filter(it => !it.advanced);
  const doneTexts = new Set(milestones.filter(m => isMsDone(m) || isMsActive(m)).map(m => m.text.toLowerCase().trim()));
  const notStarted = expectedItems.filter(it => {
    const keywords = it.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return !([...doneTexts].some(dt => keywords.some(kw => dt.includes(kw))));
  });
  if (notStarted.length > 0) {
    const next = notStarted[0];
    lookouts.push({ icon: zi('target'), text: 'Expected at ' + currentBracket + ' months: "' + next.text + '" — ' + next.desc.substring(0, 60) + '…', tag: 'milestone' });
  }

  // ═══ RENDER ═══
  let html = '';

  // v2.4: Filter out completed items — they're already logged in History
  const pendingItems = items.filter(item => !item.done);

  // Remove section headers that have no pending items after them
  const cleanedItems = [];
  for (let i = 0; i < pendingItems.length; i++) {
    if (pendingItems[i].section) {
      // Check if any non-section items follow before the next section
      let hasContent = false;
      for (let j = i + 1; j < pendingItems.length; j++) {
        if (pendingItems[j].section) break;
        hasContent = true; break;
      }
      if (hasContent) cleanedItems.push(pendingItems[i]);
    } else {
      cleanedItems.push(pendingItems[i]);
    }
  }

  if (cleanedItems.length === 0) {
    html = `<div style="text-align:center;padding:16px 0;">
      <div style="font-size:var(--fs-2xl);margin-bottom:4px;">${zi('sparkle')}</div>
      <div style="font-family:'Fraunces',serif;font-size:var(--fs-md);font-weight:600;color:var(--tc-sage);">All done for today!</div>
      <div class="t-sub mt-4">Every task completed. Enjoy the rest of your day.</div>
    </div>`;
  } else {
    cleanedItems.forEach(item => {
      if (item.section) {
        html += `<div class="plan-section-label">${item.section}</div>`;
        return;
      }
      const actionAttr = item.action ? ` onclick="${item.action}" class="ptr"` : '';
      html += `<div class="plan-item"${actionAttr}>
        <div class="plan-time">${item.time}</div>
        <div class="plan-icon">${item.icon}</div>
        <div class="plan-body">
          <div class="plan-title">${escHtml(item.title)}</div>
          <div class="plan-detail"><span class="plan-tag pt-${item.tag || 'food'}">${item.tag || ''}</span>${item.htmlDetail ? (item.detail || '') : escHtml(item.detail || '')}</div>
        </div>
      </div>`;
    });
  }

  if (lookouts.length > 0) {
    html += '<div class="plan-section-label">Lookouts</div>';
    lookouts.forEach(l => {
      html += `<div class="plan-item">
        <div class="plan-time"></div>
        <div class="plan-icon">${l.icon}</div>
        <div class="plan-body">
          <div class="plan-detail"><span class="plan-tag pt-${l.tag || 'lookout'}">${l.tag}</span>${escHtml(l.text)}</div>
        </div>
      </div>`;
    });
  }

  el.innerHTML = html;
  window._vaccApptToday = null; // cleanup
}

function renderInsights() {
  renderTodayPlan();
  renderInsightsAlerts();
  renderInsightsPulse();
  renderTrendChips();
  renderCorrelationCard();
  renderInsightsCross();
  renderAlertIntelligence();
}

// v2.4: Trend chips — compact rows replacing 7 individual insight cards
function renderTrendChips() {
  const container = document.getElementById('trendChipsContainer');
  if (!container) return;

  const ageM = ageAt().months;
  const sleepT = getSleepTrend7d();
  const poopT = getPoopTrend7d();
  const feedT = getFeedingTrend7d();
  const velocity = getGrowthVelocity();
  const vs = computeVarietyScore(7);
  const bl = computeBaselines();
  const d3Med = meds.find(m => m.active && m.name.toLowerCase().includes('d3'));

  const chips = [];

  // Growth
  if (velocity.wtGPerWeek != null) {
    const expMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
    const expMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
    const ok = velocity.wtGPerWeek >= expMin && velocity.wtGPerWeek <= expMax;
    chips.push({ icon:zi('chart'), label:'Growth', value: velocity.wtGPerWeek + 'g/wk', delta: ok ? zi('check') + ' healthy' : zi('warn') + ' check', cls: ok ? 'tc-good' : 'tc-warn', tab:'growth' });
  } else {
    chips.push({ icon:zi('chart'), label:'Growth', value:'Need 2+ measurements', delta:'—', cls:'tc-neutral', tab:'growth' });
  }

  // Sleep
  if (sleepT.score.current != null) {
    const cls = sleepT.score.current >= 70 ? 'tc-good' : sleepT.score.current >= 40 ? 'tc-warn' : 'tc-bad';
    const arrow = sleepT.score.trend.arrow || '';
    chips.push({ icon:zi('moon'), label:'Sleep', value: sleepT.score.current + '/100' + (arrow ? ' ' + arrow : ''), delta: sleepT.score.trend.text || '', cls, tab:'sleep' });
  } else {
    chips.push({ icon:zi('moon'), label:'Sleep', value:'No data yet', delta:'—', cls:'tc-neutral', tab:'sleep' });
  }

  // Digestion
  if (poopT.freq.current > 0) {
    const normal = poopT.freq.current >= 1 && poopT.freq.current <= 4;
    chips.push({ icon:zi('diaper'), label:'Digestion', value: poopT.freq.current + '/day', delta: normal ? zi('check') + ' normal' : zi('warn') + ' check', cls: normal ? 'tc-good' : 'tc-warn', tab:'poop' });
  } else {
    chips.push({ icon:zi('diaper'), label:'Digestion', value:'No data yet', delta:'—', cls:'tc-neutral', tab:'poop' });
  }

  // Feeding
  const todayEntry = feedingData[today()] || {};
  const mealsLogged = ['breakfast','lunch','dinner'].filter(m => todayEntry[m] && todayEntry[m] !== '—skipped—').length;
  chips.push({ icon:zi('bowl'), label:'Feeding', value: mealsLogged + '/3 today', delta: feedT.streak > 0 ? zi('flame') + feedT.streak + 'd' : '', cls: mealsLogged >= 2 ? 'tc-good' : mealsLogged >= 1 ? 'tc-warn' : 'tc-bad', tab:'diet' });

  // Food Variety
  const varPct = vs.target > 0 ? Math.min(Math.round((vs.uniqueFoods / vs.target) * 100), 100) : 0;
  const varCls = varPct >= 70 ? 'tc-good' : varPct >= 40 ? 'tc-warn' : 'tc-bad';
  chips.push({ icon:zi('rainbow'), label:'Variety', value: vs.uniqueFoods + ' foods (7d)', delta: varPct + '/100', cls: varCls, tab:'diet' });

  // Nutrients
  const nutrientDays = bl.nutrientDays || {};
  const covered = Object.values(nutrientDays).filter(v => v >= 2).length;
  const total = Math.max(Object.keys(nutrientDays).length, 5);
  chips.push({ icon:zi('bowl'), label:'Nutrients', value: covered + '/' + total + ' groups', delta: covered >= total ? 'balanced' : 'gaps', cls: covered >= total ? 'tc-good' : 'tc-warn', tab:'diet' });

  // Vitamin D3
  if (d3Med) {
    const todayStr = today();
    const d3Done = medChecks[todayStr] && medChecks[todayStr][d3Med.name] && medChecks[todayStr][d3Med.name].startsWith('done:');
    chips.push({ icon:zi('sun'), label:'Vitamin D3', value: d3Done ? 'Done today' : 'Pending', delta: d3Done ? zi('check') : 'pending', cls: d3Done ? 'tc-good' : 'tc-warn', tab:'medical' });
  }

  let html = '';
  chips.forEach((c, i) => {
    html += `<div class="trend-chip" data-action="switchTab" data-arg="${escAttr(c.tab)}" data-stop="1">
      <span class="trend-chip-icon">${c.icon}</span>
      <div class="trend-chip-body">
        <div class="trend-chip-label">${c.label}</div>
        <div class="trend-chip-value">${c.value}</div>
      </div>
      <span class="trend-chip-delta ${c.cls}">${c.delta}</span>
      <span class="trend-chip-chevron">▾</span>
    </div>`;
  });

  container.innerHTML = html;
}

function renderInsightsStats() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsStats() {
  const el = document.getElementById('insightsStats');
  if (!el) return;

  const sleepT = getSleepTrend7d();
  const poopT = getPoopTrend7d();
  const feedT = getFeedingTrend7d();
  const latestWt = getLatestWeight();
  const velocity = getGrowthVelocity();

  // Weight pill
  const wtVal = latestWt ? latestWt.wt + ' kg' : '—';
  const wtColor = latestWt ? 'hsp-rose' : 'hsp-rose';

  // Sleep score pill
  const sleepVal = sleepT.score.current != null ? sleepT.score.current + '/100' : '—';
  const sleepColor = sleepT.score.current >= 70 ? 'hsp-sage' : sleepT.score.current >= 40 ? 'hsp-peach' : sleepT.score.current != null ? 'hsp-rose' : 'hsp-indigo';

  // Poop frequency pill
  const poopVal = poopT.freq.current > 0 ? poopT.freq.current + '/d' : '—';
  const poopColor = poopT.freq.current >= 1 && poopT.freq.current <= 4 ? 'hsp-sage' : poopT.freq.current > 0 ? 'hsp-peach' : 'hsp-amber';

  // Foods variety pill
  const foodVal = feedT.variety.current > 0 ? feedT.variety.current : '—';
  const foodColor = feedT.varietyScore >= 2 ? 'hsp-sage' : feedT.varietyScore >= 1 ? 'hsp-peach' : 'hsp-rose';

  // Growth velocity pill
  const velVal = velocity.wtGPerWeek != null ? velocity.wtGPerWeek + 'g' : '—';
  const ageM = ageAt().months;
  const expMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
  const expMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
  const velInRange = velocity.wtGPerWeek != null && velocity.wtGPerWeek >= expMin && velocity.wtGPerWeek <= expMax;
  const velColor = velocity.wtGPerWeek != null ? (velInRange ? 'hsp-sage' : 'hsp-peach') : 'hsp-rose';

  el.innerHTML = `
    <div class="home-stat-pill ${wtColor}" data-scroll-to="insightsGrowthCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-scale"/></svg></div>
      <div class="hsp-val">${wtVal}</div>
      <div class="hsp-label">Weight</div>
    </div>
    <div class="home-stat-pill ${sleepColor}" data-scroll-to="insightsSleepCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-zzz"/></svg></div>
      <div class="hsp-val">${sleepVal}</div>
      <div class="hsp-label">Sleep 7d</div>
    </div>
    <div class="home-stat-pill ${poopColor}" data-scroll-to="insightsPoopCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-diaper"/></svg></div>
      <div class="hsp-val">${poopVal}</div>
      <div class="hsp-label">Poop avg</div>
    </div>
    <div class="home-stat-pill ${foodColor}" data-scroll-to="insightsFeedCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-rainbow"/></svg></div>
      <div class="hsp-val">${foodVal}</div>
      <div class="hsp-label">Foods/wk</div>
    </div>
    <div class="home-stat-pill ${velColor}" data-scroll-to="insightsGrowthCard" data-scroll-block="start">
      <div class="hsp-icon"><svg class="zi"><use href="#zi-bolt"/></svg></div>
      <div class="hsp-val">${velVal}</div>
      <div class="hsp-label">Gain/wk</div>
    </div>
  `;
  // Add Ziva Score and Milestone pills dynamically
  const zsR = calcZivaScore();
  if (zsR.score !== null) {
    const zsColor = zsR.score >= 75 ? 'hsp-sage' : zsR.score >= 60 ? 'hsp-peach' : 'hsp-rose';
    el.innerHTML += `<div class="home-stat-pill ${zsColor}"><div class="hsp-icon"><svg class="zi"><use href="#zi-sparkle"/></svg></div><div class="hsp-val">${zsR.score}</div><div class="hsp-label">Ziva Score</div></div>`;
  }
  const msR = calcMilestoneScore();
  const msColor = msR.score >= 75 ? 'hsp-sage' : msR.score >= 45 ? 'hsp-peach' : 'hsp-rose';
  el.innerHTML += `<div class="home-stat-pill ${msColor}" data-action="switchTab" data-arg="milestones"><div class="hsp-icon"><svg class="zi"><use href="#zi-trophy"/></svg></div><div class="hsp-val">${msR.score}</div><div class="hsp-label">Milestones</div></div>`;
}

function renderInsightsPulse() {
  const el = document.getElementById('insightsPulseText');
  const expandedEl = document.getElementById('insightsPulseExpanded');
  if (!el) return;
  el.textContent = getPulseNarrative();

  if (expandedEl) {
    // v2.4: Merged weekly summary data into Pulse expanded view
    const sleepT = getSleepTrend7d();
    const poopT = getPoopTrend7d();
    const feedT = getFeedingTrend7d();
    const zs = calcZivaScore();
    const trend = getZivaScoreTrend7d();
    const vs = computeVarietyScore(7);
    const dietS = calcDietScore();
    const medS = calcMedicalScore();
    const msScore = calcMilestoneScore();
    const msDetail = msScore.detail || {};

    // Week range label
    const todayDate = new Date(today());
    const weekStart = new Date(todayDate);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekLabel = formatDate(toDateStr(weekStart)).split(',')[0] + ' – ' + formatDate(today()).split(',')[0];

    const rows = [];
    if (zs.score !== null) rows.push({ icon:zi('sparkle'), label:'Ziva Score', val: (trend.avg7d || zs.score) + '/100', cls: zs.score >= 70 ? 'tc-good' : zs.score >= 40 ? 'tc-warn' : 'tc-bad' });
    if (sleepT.score.current != null) rows.push({ icon:zi('moon'), label:'Sleep', val: sleepT.score.current + '/100', cls: sleepT.score.current >= 70 ? 'tc-good' : sleepT.score.current >= 40 ? 'tc-warn' : 'tc-bad' });
    rows.push({ icon:zi('bowl'), label:'Diet', val: dietS.score + ' · ' + vs.uniqueFoods + ' foods', cls: dietS.score >= 70 ? 'tc-good' : dietS.score >= 40 ? 'tc-warn' : 'tc-bad' });
    if (poopT.freq.current > 0) {
      const normal = poopT.freq.current >= 1 && poopT.freq.current <= 4;
      rows.push({ icon:zi('diaper'), label:'Digestion', val: poopT.freq.current + '/day', cls: normal ? 'tc-good' : 'tc-warn' });
    }
    rows.push({ icon:zi('medical'), label:'Medical', val: medS.score + '/100', cls: medS.score >= 70 ? 'tc-good' : medS.score >= 40 ? 'tc-warn' : 'tc-bad' });
    rows.push({ icon:zi('trophy'), label:'Milestones', val: msScore.score + '/100 · ' + (msDetail.inProgress || 0) + ' active', cls: msScore.score >= 75 ? 'tc-good' : msScore.score >= 45 ? 'tc-warn' : 'tc-bad' });

    let html = `<div style="font-size:var(--fs-xs);color:var(--light);margin-bottom:6px;">${weekLabel}</div>`;
    rows.forEach(r => {
      html += `<div style="display:flex;align-items:center;gap:var(--sp-8);padding:6px 0;border-bottom:1px solid var(--border-subtle);">
        <span style="font-size:var(--icon-base);flex-shrink:0;">${r.icon}</span>
        <span style="flex:1;font-size:var(--fs-sm);font-weight:600;color:var(--text);">${r.label}</span>
        <span class="trend-chip-delta ${r.cls} t-sm" >${r.val}</span>
      </div>`;
    });
    expandedEl.innerHTML = html;
  }
}

function renderInsightsGrowth() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsGrowth() {
  const el = document.getElementById('insightsGrowthContent');
  const prevEl = document.getElementById('insightsGrowthPreview');
  if (!el) return;

  const velocity = getGrowthVelocity();
  const narratives = getGrowthNarrative(velocity);
  const pctNarrative = getPercentileNarrative();

  if (velocity.wtEntryCount < 2 && velocity.htEntryCount < 2) {
    el.innerHTML = '<div class="t-sub fe-center-action" >Need at least 2 growth entries to show trends.</div>';
    if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">Need 2+ measurements</span></div>';
    return;
  }

  // Preview strip
  if (prevEl) {
    const ageM = ageAt().months;
    let pills = '';
    if (velocity.wtGPerWeek != null) {
      const expMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
      const expMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
      const ok = velocity.wtGPerWeek >= expMin && velocity.wtGPerWeek <= expMax;
      pills += `<span class="ins-preview-pill ${ok ? 'ipp-good' : 'ipp-warn'}">${zi('scale')} ${velocity.wtGPerWeek}g/wk</span>`;
    }
    const latestWt = getLatestWeight();
    if (latestWt) {
      const daysSince = Math.floor((new Date() - new Date(latestWt.date)) / 86400000);
      if (daysSince > 7) pills += `<span class="ins-preview-pill ipp-warn">${zi('clock')} ${daysSince}d since weigh-in</span>`;
    }
    if (pctNarrative) pills += `<span class="ins-preview-pill ipp-info">${zi('chart')} ${pctNarrative.match(/\d+\w*\s*percentile/)?.[0] || 'tracking'}</span>`;
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  let html = '';
  const ageM = ageAt().months;

  // Velocity rows
  if (velocity.wtGPerWeek != null) {
    const expectedMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
    const expectedMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
    const inRange = velocity.wtGPerWeek >= expectedMin && velocity.wtGPerWeek <= expectedMax;
    const cls = inRange ? 'trend-up' : velocity.wtGPerWeek < expectedMin ? 'trend-down' : 'trend-flat';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('scale')}</div>
      <div class="ir-body">
        <div class="ir-label">Weight velocity (4-week)</div>
        <div class="ir-value">${velocity.wtGPerWeek} g/week <span class="ir-delta ${cls}">${inRange ? zi('check') + ' healthy' : velocity.wtGPerWeek < expectedMin ? '↓ below range' : '↑ above range'}</span></div>
      </div>
    </div>`;
  }

  if (velocity.htCmPerMonth != null) {
    const expectedMin = ageM <= 3 ? 2.5 : ageM <= 6 ? 1.5 : ageM <= 9 ? 1.2 : 1.0;
    const expectedMax = ageM <= 3 ? 4.0 : ageM <= 6 ? 2.8 : ageM <= 9 ? 2.0 : 1.6;
    const inRange = velocity.htCmPerMonth >= expectedMin && velocity.htCmPerMonth <= expectedMax;
    const cls = inRange ? 'trend-up' : velocity.htCmPerMonth < expectedMin ? 'trend-down' : 'trend-flat';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('ruler')}</div>
      <div class="ir-body">
        <div class="ir-label">Height velocity (4-week)</div>
        <div class="ir-value">${velocity.htCmPerMonth} cm/month <span class="ir-delta ${cls}">${inRange ? zi('check') + ' healthy' : velocity.htCmPerMonth < expectedMin ? '↓ below range' : '↑ above range'}</span></div>
      </div>
    </div>`;
  }

  // ── Weight-for-height ratio ──
  const latestWt = getLatestWeight();
  const latestHt = getLatestHeight();
  if (latestWt && latestHt) {
    const wfh = +(latestWt.wt / (latestHt.ht / 100)).toFixed(1); // kg per metre
    // WHO: healthy range is roughly BMI 14-19 for infants
    // Simpler: weight(kg) / height(cm) ratio — healthy ~0.10-0.14 at 6-12mo
    const ratio = +(latestWt.wt / latestHt.ht).toFixed(3);
    const isProportional = ratio >= 0.095 && ratio <= 0.145;
    const cls = isProportional ? 'trend-up' : 'trend-down';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('ruler')}</div>
      <div class="ir-body">
        <div class="ir-label">Weight-for-height</div>
        <div class="ir-value">${latestWt.wt} kg / ${latestHt.ht} cm <span class="ir-delta ${cls}">${isProportional ? zi('check') + ' proportional' : ratio < 0.095 ? '↓ underweight for length' : '↑ heavy for length'}</span></div>
      </div>
    </div>`;
  }

  // ── Growth spurt detection ──
  if (velocity.wtEntryCount >= 3) {
    const wtEntries = growthData.filter(r => r.wt != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
    const last3 = wtEntries.slice(-3);
    if (last3.length >= 3) {
      const recentDays = Math.max(1, Math.round((new Date(last3[2].date) - new Date(last3[1].date)) / 86400000));
      const recentGPerDay = Math.round(((last3[2].wt - last3[1].wt) * 1000) / recentDays);
      const priorDays = Math.max(1, Math.round((new Date(last3[1].date) - new Date(last3[0].date)) / 86400000));
      const priorGPerDay = Math.round(((last3[1].wt - last3[0].wt) * 1000) / priorDays);
      if (priorGPerDay > 0 && recentGPerDay > priorGPerDay * 1.8 && recentGPerDay > 20) {
        html += `<div class="insight-narrative in-lav">${zi('sparkle')} <strong>Possible growth spurt detected!</strong> Gained ${Math.round(recentGPerDay * recentDays)}g in ${recentDays} days (${recentGPerDay}g/day vs usual ${priorGPerDay}g/day). Expect increased hunger, fussiness, and disrupted sleep — this is normal and temporary.</div>`;
      }
    }
  }

  // ── Measurement gap alert ──
  if (latestWt) {
    const daysSince = Math.floor((new Date() - new Date(latestWt.date)) / 86400000);
    const idealDays = ageM <= 3 ? 7 : ageM <= 6 ? 7 : ageM <= 9 ? 10 : 14;
    if (daysSince > idealDays) {
      html += `<div class="insight-narrative in-amber">${zi('scale')} Last weigh-in was <strong>${daysSince} days ago</strong> (${formatDate(latestWt.date)}). At ${ageM} months, aim for every ${idealDays} days to track growth accurately.</div>`;
    }
  }
  if (latestHt) {
    const daysSince = Math.floor((new Date() - new Date(latestHt.date)) / 86400000);
    const idealDays = ageM <= 3 ? 14 : ageM <= 6 ? 14 : 21;
    if (daysSince > idealDays) {
      html += `<div class="insight-narrative in-amber">${zi('ruler')} Last height check was <strong>${daysSince} days ago</strong>. Measure every ${idealDays} days at this age.</div>`;
    }
  }

  // Narratives
  narratives.forEach(n => {
    html += `<div class="insight-narrative">${escHtml(n)}</div>`;
  });

  if (pctNarrative) {
    html += `<div class="insight-narrative in-lav">${escHtml(pctNarrative)}</div>`;
  }

  el.innerHTML = html;
}

function renderInsightsSleep() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsSleep() {
  const el = document.getElementById('insightsSleepContent');
  const prevEl = document.getElementById('insightsSleepPreview');
  if (!el) return;

  const trend = getSleepTrend7d();
  if (trend.dataPoints === 0) {
    el.innerHTML = '<div class="t-sub fe-center-action" >No sleep data in the last 7 days.</div>';
    if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">No data this week</span></div>';
    return;
  }

  // Preview strip
  if (prevEl) {
    let pills = '';
    if (trend.score.current != null) {
      const cls = trend.score.current >= 70 ? 'ipp-good' : trend.score.current >= 40 ? 'ipp-warn' : 'ipp-bad';
      pills += `<span class="ins-preview-pill ${cls}">${zi('zzz')} ${trend.score.current}/100</span>`;
      if (trend.score.trend.arrow) pills += `<span class="ins-preview-pill ipp-neutral">${trend.score.trend.text}</span>`;
    }
    if (trend.wakes.current != null) {
      const cls = trend.wakes.current <= 1 ? 'ipp-good' : trend.wakes.current <= 2 ? 'ipp-warn' : 'ipp-bad';
      pills += `<span class="ins-preview-pill ${cls}">⏰ ${trend.wakes.current} wakes</span>`;
    }
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  let html = '';

  // Score row
  if (trend.score.current != null) {
    const emoji = trend.score.current >= 70 ? zi('moon') : trend.score.current >= 40 ? zi('moon') : zi('warn');
    html += `<div class="insight-row">
      <div class="ir-icon">${emoji}</div>
      <div class="ir-body">
        <div class="ir-label">Sleep score (7-day avg)</div>
        <div class="ir-value">${trend.score.current}/100 <span class="ir-delta ${trend.score.trend.cls}">${trend.score.trend.text ? trend.score.trend.text + ' pts' : ''}</span></div>
      </div>
    </div>`;
  }

  // Duration row
  if (trend.duration.current != null) {
    const h = Math.floor(trend.duration.current / 60);
    const m = trend.duration.current % 60;
    const deltaMin = trend.duration.trend.delta;
    const deltaText = deltaMin !== 0 ? `${trend.duration.trend.arrow} ${Math.abs(deltaMin)} min` : '→ stable';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('moon')}</div>
      <div class="ir-body">
        <div class="ir-label">Avg night sleep</div>
        <div class="ir-value">${h}h ${m}m <span class="ir-delta ${trend.duration.trend.cls}">${deltaText}</span></div>
      </div>
    </div>`;
  }

  // ── Total sleep vs WHO target ──
  const last7 = getDateWindow(7, 0);
  const dailyTotals = [];
  last7.forEach(ds => {
    const entries = getSleepForDate(ds);
    if (entries.length > 0) {
      const totalMin = entries.reduce((sum, s) => sum + calcSleepDuration(s.bedtime, s.wakeTime).total, 0);
      dailyTotals.push(totalMin);
    }
  });
  if (dailyTotals.length > 0) {
    const avgTotalMin = Math.round(dailyTotals.reduce((a,b) => a+b, 0) / dailyTotals.length);
    const avgH = Math.floor(avgTotalMin / 60);
    const avgM = avgTotalMin % 60;
    const ageM = ageAt().months;
    const targetMin = ageM <= 4 ? 840 : ageM <= 12 ? 720 : 660; // WHO: 14h / 12h / 11h
    const targetMax = ageM <= 4 ? 1020 : ageM <= 12 ? 960 : 840; // 17h / 16h / 14h
    const targetLabel = ageM <= 4 ? '14–17h' : ageM <= 12 ? '12–16h' : '11–14h';
    const inRange = avgTotalMin >= targetMin && avgTotalMin <= targetMax;
    const cls = inRange ? 'trend-up' : avgTotalMin < targetMin ? 'trend-down' : 'trend-flat';
    html += `<div class="insight-row">
      <div class="ir-icon">⏱️</div>
      <div class="ir-body">
        <div class="ir-label">Avg total sleep / day (night + naps)</div>
        <div class="ir-value">${avgH}h ${avgM}m <span class="ir-delta ${cls}">${inRange ? '✓ within WHO ' + targetLabel : avgTotalMin < targetMin ? '↓ below WHO ' + targetLabel : '↑ above WHO ' + targetLabel}</span></div>
      </div>
    </div>`;
  }

  // Wake-ups row
  if (trend.wakes.current != null) {
    const wakeCls = trend.wakes.trend.direction === 'down' ? 'trend-up' : trend.wakes.trend.direction === 'up' ? 'trend-down' : 'trend-flat';
    html += `<div class="insight-row">
      <div class="ir-icon">⏰</div>
      <div class="ir-body">
        <div class="ir-label">Avg wake-ups / night</div>
        <div class="ir-value">${trend.wakes.current} <span class="ir-delta ${wakeCls}">${trend.wakes.trend.text || ''}</span></div>
      </div>
    </div>`;
  }

  // Bedtime row
  if (trend.bedtime.current != null) {
    const deltaMin = trend.bedtime.trend.delta;
    const bedCls = deltaMin < -10 ? 'trend-up' : deltaMin > 10 ? 'trend-down' : 'trend-flat';
    const deltaText = Math.abs(deltaMin) > 10 ? `${deltaMin > 0 ? '↑' : '↓'} ${Math.abs(deltaMin)} min ${deltaMin > 0 ? 'later' : 'earlier'}` : '→ stable';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('moon')}</div>
      <div class="ir-body">
        <div class="ir-label">Avg bedtime</div>
        <div class="ir-value">${formatBedtimeMin(trend.bedtime.current)} <span class="ir-delta ${bedCls}">${deltaText}</span></div>
      </div>
    </div>`;
  }

  // Nap summary
  if (trend.napCount.current != null) {
    const napMinText = trend.napMins.current != null ? ` · ${Math.floor(trend.napMins.current / 60)}h ${trend.napMins.current % 60}m total` : '';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('zzz')}</div>
      <div class="ir-body">
        <div class="ir-label">Avg naps / day</div>
        <div class="ir-value">${trend.napCount.current}${napMinText}</div>
      </div>
    </div>`;
  }

  // ── Nap-to-night ratio ──
  if (trend.duration.current != null && trend.napMins.current != null && trend.napMins.current > 0 && trend.duration.current > 0) {
    const nightPct = Math.round((trend.duration.current / (trend.duration.current + trend.napMins.current)) * 100);
    const napPct = 100 - nightPct;
    const ageM = ageAt().months;
    const idealNapPct = ageM <= 4 ? 35 : ageM <= 8 ? 25 : 20;
    const tooMuchNap = napPct > idealNapPct + 10;
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('scale')}</div>
      <div class="ir-body">
        <div class="ir-label">Nap-to-night ratio</div>
        <div class="ir-value">${napPct}% nap / ${nightPct}% night <span class="ir-delta ${tooMuchNap ? 'trend-down' : 'trend-up'}">${tooMuchNap ? zi('warn') + ' naps may be too long' : 'balanced'}</span></div>
      </div>
    </div>`;
  }

  // ── Best / Worst night this week ──
  const nightScores = [];
  last7.forEach(ds => {
    const entries = getSleepForDate(ds).filter(e => e.type === 'night');
    entries.forEach(n => {
      const sc = calcSleepScore(n);
      if (sc) nightScores.push({ date: ds, score: sc.score, bedtime: n.bedtime, wakes: getWakeCount(n), dur: calcSleepDuration(n.bedtime, n.wakeTime) });
    });
  });
  if (nightScores.length >= 2) {
    const best = nightScores.reduce((a,b) => a.score >= b.score ? a : b);
    const worst = nightScores.reduce((a,b) => a.score <= b.score ? a : b);
    if (best.score !== worst.score) {
      const bestDay = new Date(best.date).toLocaleDateString('en-IN', { weekday:'short' });
      const worstDay = new Date(worst.date).toLocaleDateString('en-IN', { weekday:'short' });
      html += `<div class="insight-narrative">${zi('trophy')} <strong>Best night: ${bestDay}</strong> — score ${best.score}, ${best.dur.h}h ${best.dur.m}m, bedtime ${formatTimeShort(best.bedtime)}, ${best.wakes} wakes. What was different?</div>`;
      html += `<div class="insight-narrative in-rose">${zi('warn')} <strong>Worst night: ${worstDay}</strong> — score ${worst.score}, ${worst.dur.h}h ${worst.dur.m}m, bedtime ${formatTimeShort(worst.bedtime)}, ${worst.wakes} wakes.</div>`;
    }
  }

  // ── Bedtime consistency score ──
  if (nightScores.length >= 3) {
    const bedMins = nightScores.filter(n => n.bedtime).map(n => {
      const [bh, bm] = n.bedtime.split(':').map(Number);
      if (isNaN(bh)) return null;
      let m = bh * 60 + bm;
      if (bh < 6) m += 24 * 60;
      return m;
    }).filter(m => m != null);
    const mean = bedMins.reduce((a,b) => a+b, 0) / bedMins.length;
    const variance = bedMins.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / bedMins.length;
    const stdDev = Math.round(Math.sqrt(variance));
    const consistency = stdDev <= 15 ? 'Very consistent' : stdDev <= 30 ? 'Fairly consistent' : stdDev <= 60 ? 'Variable' : 'Highly variable';
    const cls = stdDev <= 15 ? 'trend-up' : stdDev <= 30 ? 'trend-flat' : 'trend-down';
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('ruler')}</div>
      <div class="ir-body">
        <div class="ir-label">Bedtime consistency</div>
        <div class="ir-value">${consistency} <span class="ir-delta ${cls}">±${stdDev} min spread</span></div>
      </div>
    </div>`;
    if (stdDev > 30) {
      html += `<div class="insight-narrative in-amber">${zi('target')} Bedtime varies by ±${stdDev} minutes. Consistent bedtimes (within 15–20 min) help set the circadian rhythm and improve sleep quality.</div>`;
    }
  }

  // ── Wake-up clustering ──
  if (nightScores.length >= 3 && sleepData.length > 0) {
    // Analyze wake-up times from notes or estimate from data
    // Since we don't have exact wake-up timestamps, analyze bedtime + wake patterns
    const highWakeNights = nightScores.filter(n => n.wakes >= 3);
    if (highWakeNights.length >= 2) {
      const avgBedOfBad = Math.round(highWakeNights.filter(n => n.bedtime).reduce((s,n) => {
        const [bh,bm] = n.bedtime.split(':').map(Number);
        if (isNaN(bh)) return s;
        let m = bh*60+bm; if(bh<6) m+=24*60;
        return s+m;
      }, 0) / Math.max(1, highWakeNights.filter(n => n.bedtime).length));
      html += `<div class="insight-pattern">
        <div class="ip-icon">${zi('scope')}</div>
        <div class="ip-text">${highWakeNights.length} of ${nightScores.length} nights had 3+ wake-ups. On those nights, avg bedtime was ${formatBedtimeMin(avgBedOfBad)}. Earlier bedtimes or adjusting the last nap may help.</div>
      </div>`;
    }
  }

  // Patterns
  const patterns = getSleepPatterns();
  if (patterns.length > 0) {
    html += `<div style="margin-top:8px;font-family:'Fraunces',serif;font-size:var(--fs-base);font-weight:600;color:var(--text);">${zi('scope')} Patterns Detected</div>`;
    patterns.forEach(p => {
      html += `<div class="insight-pattern">
        <div class="ip-icon">${p.icon}</div>
        <div class="ip-text">${escHtml(p.text)}</div>
      </div>`;
    });
  }

  el.innerHTML = html;
}

function renderInsightsPoop() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsPoop() {
  const el = document.getElementById('insightsPoopContent');
  const prevEl = document.getElementById('insightsPoopPreview');
  if (!el) return;

  const trend = getPoopTrend7d();
  if (trend.totalThisWeek === 0 && trend.totalLastWeek === 0) {
    el.innerHTML = '<div class="t-sub fe-center-action" >No poop data in the last 14 days.</div>';
    if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">No data</span></div>';
    return;
  }

  // Preview strip
  if (prevEl) {
    let pills = '';
    const lastPoop = getLastPoop();
    if (lastPoop) {
      const h = Math.floor((new Date() - new Date(lastPoop.date + 'T' + (lastPoop.time||'12:00'))) / 3600000);
      const cls = h < 24 ? 'ipp-good' : h < 72 ? 'ipp-info' : 'ipp-warn';
      pills += `<span class="ins-preview-pill ${cls}">${zi('clock')} ${h < 24 ? h + 'h ago' : Math.floor(h/24) + 'd ago'}</span>`;
    }
    const normal = trend.freq.current >= 1 && trend.freq.current <= 4;
    pills += `<span class="ins-preview-pill ${normal ? 'ipp-good' : 'ipp-warn'}">${zi('diaper')} ${trend.freq.current}/day</span>`;
    if (trend.topColor) {
      const col = POOP_COLORS[trend.topColor] || {};
      pills += `<span class="ins-preview-pill ipp-neutral">${_poopColorDot(trend.topColor)} ${col.label||trend.topColor}</span>`;
    }
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  let html = '';

  // ── Days since last poop (prominent) ──
  const lastPoop = getLastPoop();
  if (lastPoop) {
    const lastTime = new Date(lastPoop.date + 'T' + (lastPoop.time || '12:00'));
    const hoursAgo = Math.floor((new Date() - lastTime) / 3600000);
    const ageM = ageAt().months;
    let statusText, statusCls;
    if (hoursAgo < 24) {
      statusText = zi('check') + ' recent'; statusCls = 'trend-up';
    } else if (hoursAgo < 72) {
      statusText = 'normal gap'; statusCls = 'trend-flat';
    } else if (hoursAgo < 120) {
      statusText = ageM <= 6 ? 'normal for breastfed' : zi('warn') + ' getting long';
      statusCls = ageM <= 6 ? 'trend-flat' : 'trend-down';
    } else {
      statusText = zi('warn') + ' consult if uncomfortable'; statusCls = 'trend-down';
    }
    const label = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ${hoursAgo % 24}h ago`;
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('clock')}</div>
      <div class="ir-body">
        <div class="ir-label">Since last poop</div>
        <div class="ir-value">${label} <span class="ir-delta ${statusCls}">${statusText}</span></div>
      </div>
    </div>`;
  }

  // Frequency row
  html += `<div class="insight-row">
    <div class="ir-icon">${zi('chart')}</div>
    <div class="ir-body">
      <div class="ir-label">Daily frequency (7-day avg)</div>
      <div class="ir-value">${trend.freq.current}/day <span class="ir-delta ${trend.freq.trend.cls}">${trend.freq.trend.text ? trend.freq.trend.text + '/d' : ''}</span></div>
    </div>
  </div>`;

  // Most common colour + consistency
  if (trend.topColor) {
    const col = POOP_COLORS[trend.topColor] || { hex:'#e8c840', label:trend.topColor };
    html += `<div class="insight-row">
      <div class="ir-icon">${_poopColorDot(trend.topColor)}</div>
      <div class="ir-body">
        <div class="ir-label">Most common colour</div>
        <div class="ir-value">${escHtml(col.label)} <span class="fs-xs-mid">(${trend.topColorCount}×)</span></div>
      </div>
    </div>`;
  }
  if (trend.topCons) {
    const con = POOP_CONSISTENCY[trend.topCons] || { label:trend.topCons };
    html += `<div class="insight-row">
      <div class="ir-icon">${zi('diaper')}</div>
      <div class="ir-body">
        <div class="ir-label">Most common consistency</div>
        <div class="ir-value">${escHtml(con.label)} <span class="fs-xs-mid">(${trend.topConsCount}×)</span></div>
      </div>
    </div>`;
  }

  // Longest gap
  if (trend.longestGapH > 0) {
    const gapLabel = trend.longestGapH >= 24 ? `${Math.floor(trend.longestGapH / 24)}d ${trend.longestGapH % 24}h` : `${trend.longestGapH}h`;
    const concerning = trend.longestGapH >= 96;
    html += `<div class="insight-row">
      <div class="ir-icon">⏱️</div>
      <div class="ir-body">
        <div class="ir-label">Longest gap this week</div>
        <div class="ir-value">${gapLabel} ${concerning ? '<span class="ir-delta trend-down">' + zi('warn') + ' watch</span>' : ''}</div>
      </div>
    </div>`;
  }

  // ── Colour stability narrative ──
  const colorKeys = Object.keys(trend.colorDist);
  if (colorKeys.length > 0) {
    const healthyColors = ['yellow','green','brown'];
    const allHealthy = colorKeys.every(c => healthyColors.includes(c));
    const alertColors = colorKeys.filter(c => POOP_ALERT_COLORS.includes(c));
    if (allHealthy && colorKeys.length <= 2) {
      html += `<div class="insight-narrative">${zi('palette')} <strong>Colour: healthy and consistent.</strong> All stools this week are ${colorKeys.map(c => (POOP_COLORS[c]||{}).label||c).join(' / ').toLowerCase()} — normal for this age.</div>`;
    } else if (alertColors.length > 0) {
      html += `<div class="insight-narrative in-rose">${zi('siren')} <strong>Concerning colour detected:</strong> ${alertColors.map(c => (POOP_COLORS[c]||{}).label||c).join(', ')} stool this week. Consult your paediatrician if it persists.</div>`;
    } else if (colorKeys.length >= 3) {
      html += `<div class="insight-narrative in-amber">${zi('palette')} <strong>Colour is variable</strong> — ${colorKeys.length} different colours this week. Some variation is normal with new foods.</div>`;
    }
  }

  // ── Consistency trend narrative ──
  if (trend.totalThisWeek >= 3) {
    const thisWeekDates = getDateWindow(7, 0);
    const consCounts = {};
    thisWeekDates.forEach(ds => {
      getPoopsForDate(ds).forEach(p => {
        if (p.consistency) consCounts[p.consistency] = (consCounts[p.consistency] || 0) + 1;
      });
    });
    const hardCount = (consCounts.hard || 0) + (consCounts.pellets || 0);
    const runnyCount = consCounts.runny || 0;
    if (hardCount >= 3) {
      html += `<div class="insight-narrative in-rose">${zi('warn')} <strong>${hardCount} hard/pellet stools</strong> this week. Consider increasing water, prune puree, or high-fibre foods.</div>`;
    } else if (runnyCount >= 3) {
      html += `<div class="insight-narrative in-amber">${zi('drop')} <strong>${runnyCount} runny stools</strong> this week. Could be teething, a new food, or a mild bug. Watch for dehydration.</div>`;
    } else if (consCounts.normal && consCounts.normal >= Math.floor(trend.totalThisWeek * 0.6)) {
      html += `<div class="insight-narrative">${zi('check')} <strong>Consistency is mostly normal</strong> — ${consCounts.normal} of ${trend.totalThisWeek} stools. Healthy digestion.</div>`;
    }
  }

  // Colour distribution mini bar
  if (Object.keys(trend.colorDist).length > 1) {
    const total = Object.values(trend.colorDist).reduce((a,b) => a + b, 0);
    const bars = Object.entries(trend.colorDist)
      .sort((a,b) => b[1] - a[1])
      .map(([c, count]) => {
        const col = POOP_COLORS[c] || { hex:'#ccc' };
        const pct = Math.round((count / total) * 100);
        return `<div style="flex:${count};height:8px;background:${col.hex};border-radius:var(--r-sm);" title="${escAttr((POOP_COLORS[c]||{}).label||c)}: ${count} (${pct}%)"></div>`;
      }).join('');
    html += `<div style="margin-top:4px;">
      <div class="ir-label" style="margin-bottom:4px;">Colour distribution (7d)</div>
      <div style="display:flex;gap:var(--sp-4);border-radius:var(--r-sm);overflow:hidden;">${bars}</div>
    </div>`;
  }

  el.innerHTML = html;
}

function renderInsightsFeed() { /* v2.4: DORMANT — insights cards replaced by trend chips. Retained for future inline-expand. */ if(true)return;} function _orig_renderInsightsFeed() {
  const el = document.getElementById('insightsFeedContent');
  const prevEl = document.getElementById('insightsFeedPreview');
  if (!el) return;

  const trend = getFeedingTrend7d();
  if (trend.meals.current === 0 && trend.meals.previous === 0) {
    el.innerHTML = '<div class="t-sub fe-center-action" >No feeding data in the last 14 days.</div>';
    if (prevEl) prevEl.innerHTML = '<div class="ins-preview"><span class="ins-preview-pill ipp-neutral">No data</span></div>';
    return;
  }

  // Preview strip
  if (prevEl) {
    let pills = '';
    const mealPct = Math.round((trend.meals.current / 21) * 100);
    const mealCls = mealPct >= 80 ? 'ipp-good' : mealPct >= 50 ? 'ipp-warn' : 'ipp-bad';
    pills += `<span class="ins-preview-pill ${mealCls}">${zi('bowl')} ${trend.meals.current}/21 meals</span>`;
    const vsCls = trend.varietyScore >= 2 ? 'ipp-good' : trend.varietyScore >= 1 ? 'ipp-warn' : 'ipp-bad';
    pills += `<span class="ins-preview-pill ${vsCls}">${zi('rainbow')} ${trend.variety.current} foods</span>`;
    prevEl.innerHTML = `<div class="ins-preview">${pills}</div>`;
  }

  let html = '';

  // Meals logged
  html += `<div class="insight-row">
    <div class="ir-icon">${zi('bowl')}</div>
    <div class="ir-body">
      <div class="ir-label">Meals logged (7 days)</div>
      <div class="ir-value">${trend.meals.current} / 21 <span class="ir-delta ${trend.meals.trend.cls}">${trend.meals.trend.text || ''}</span></div>
    </div>
  </div>`;

  // Variety
  html += `<div class="insight-row">
    <div class="ir-icon">${zi('rainbow')}</div>
    <div class="ir-body">
      <div class="ir-label">Unique foods this week</div>
      <div class="ir-value">${trend.variety.current} <span class="ir-delta ${trend.variety.trend.cls}">${trend.variety.trend.text || ''}</span></div>
    </div>
  </div>`;

  // Variety score
  const vs = trend.varietyScore;
  const vsLabel = vs >= 2 ? 'Great variety!' : vs >= 1 ? 'Good, keep exploring' : 'Try introducing more variety';
  html += `<div class="insight-narrative${vs >= 2 ? '' : vs >= 1 ? ' in-amber' : ' in-rose'}">
    ${zi('sprout')} Food variety score: <strong>${vs} unique foods/day</strong> — ${vsLabel}.
  </div>`;

  // ── New food introduction pace ──
  const solidsDays = Math.floor((new Date() - SOLIDS_START) / 86400000);
  if (solidsDays > 0) {
    const solidsWeeks = Math.max(1, Math.floor(solidsDays / 7));
    const totalFoods = foods.length;
    const pacePerWeek = +(totalFoods / solidsWeeks).toFixed(1);

    // Foods introduced in last 7 days
    const weekAgoStr = toDateStr((() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })());
    const newThisWeek = foods.filter(f => f.date && f.date >= weekAgoStr).length;

    // Foods introduced in last 30 days
    const monthAgoStr = toDateStr((() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })());
    const newThisMonth = foods.filter(f => f.date && f.date >= monthAgoStr).length;

    const paceOk = pacePerWeek >= 1;
    html += `<div class="insight-row">
      <div class="ir-icon">🆕</div>
      <div class="ir-body">
        <div class="ir-label">New food introduction pace</div>
        <div class="ir-value">${newThisWeek} this week · ${newThisMonth} this month <span class="ir-delta ${paceOk ? 'trend-up' : 'trend-down'}">${paceOk ? zi('check') + ' on track' : '↓ try 1–2/week'}</span></div>
      </div>
    </div>`;

    html += `<div class="insight-narrative in-indigo">${zi('chart')} <strong>${totalFoods} foods introduced</strong> over ${solidsWeeks} weeks (avg ${pacePerWeek}/week). ${pacePerWeek >= 1.5 ? 'Excellent exploration pace!' : pacePerWeek >= 1 ? 'Good pace — keep introducing new tastes and textures.' : 'Aim for 1–2 new foods per week for allergen exposure and palate development.'}</div>`;
  }

  // ── Weekly Nutrient Coverage ──
  const bl = computeBaselines();
  if (bl.nutrientDays && bl.mealLoggingStreak >= 1) {
    html += '<div style="margin-top:12px;"><div class="ir-label" style="margin-bottom:8px;font-weight:600;">' + zi('flask') + ' Weekly Nutrient Coverage (7 days)</div>';
    const nutrientEmoji = { 'iron':zi('drop'), 'calcium':zi('ruler'), 'protein':zi('run'), 'vitamin C':zi('bowl'), 'fibre':zi('bowl'), 'vitamin A':zi('scope'), 'omega-3':zi('brain'), 'zinc':zi('shield') };
    KEY_NUTRIENTS.forEach(n => {
      const days = bl.nutrientDays[n] || 0;
      const pct = Math.floor((days / 7) * 100);
      const barColor = days >= 5 ? 'var(--sage)' : days >= 3 ? 'var(--amber)' : 'var(--rose)';
      const label = days >= 5 ? zi('check') + ' great' : days >= 3 ? '→ fair' : days <= 1 ? '↓ low' : '↓ needs more';
      html += `<div style="display:flex;align-items:center;gap:var(--sp-8);margin-bottom:4px;">
        <span style="font-size:var(--icon-sm);width:20px;text-align:center;">${nutrientEmoji[n] || '•'}</span>
        <span style="font-size:var(--fs-sm);color:var(--text);width:65px;font-weight:600;">${n.charAt(0).toUpperCase() + n.slice(1)}</span>
        <div style="flex:1;height:8px;background:rgba(0,0,0,0.06);border-radius:var(--r-sm);overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:var(--r-sm);transition:width var(--ease-slow);"></div>
        </div>
        <span style="font-size:var(--fs-xs);color:var(--light);width:48px;text-align:right;">${days}/7d</span>
        <span style="font-size:var(--fs-xs);font-weight:600;color:${days >= 5 ? 'var(--tc-sage)' : days >= 3 ? 'var(--tc-amber)' : 'var(--tc-rose)'};width:50px;">${label}</span>
      </div>`;
    });
    // Iron + Vit C synergy
    if (bl.ironDays7d >= 1) {
      html += `<div style="margin-top:6px;font-size:var(--fs-sm);color:var(--mid);">${zi('target')} Iron + Vit C paired: <strong>${bl.ironVitCPairCount}/7</strong> days${bl.ironVitCPairCount >= 3 ? ' — excellent synergy!' : bl.ironVitCPairCount >= 1 ? ' — good start, aim for more pairings.' : ' — try adding lemon/amla to iron meals.'}</div>`;
    }
    html += '</div>';
  }

  el.innerHTML = html;
}


// ─────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// CARETICKETS — Phase B Home Zone Rendering
// ═══════════════════════════════════════════════════════════════

function ctRenderEntryPoint() {
  var el = document.getElementById('ctEntryPoint');
  if (!el) return;
  var everUsed = localStorage.getItem('ctEverUsed');
  if (everUsed) {
    el.innerHTML = '';
    return;
  }
  // Pre-first-use: show standalone chip
  var activeCount = _careTickets.filter(function(t) {
    return t.status === 'active' || t.status === 'escalated';
  }).length;
  var dimmed = activeCount >= CT_MAX_ACTIVE ? ' ct-dimmed' : '';
  el.innerHTML =
    '<div class="col-full ct-zone-wrap">' +
      '<div class="chip ct-entry-chip' + dimmed + '" data-action="ctRaiseTicket">' +
        zi('clipboard') + ' Track a concern' +
      '</div>' +
    '</div>';
}

function ctRenderFollowUpBanner() {
  var el = document.getElementById('ctFollowUpBanner');
  if (!el) return;
  var now = Date.now();
  var overdue = _careTickets.filter(function(t) {
    if (t.status !== 'active' && t.status !== 'escalated') return false;
    var due = ctNextDueTime(t);
    return due !== Infinity && due < now;
  });
  // Filter out already-notified tickets
  overdue = overdue.filter(function(t) {
    return !_ctNotifiedTickets[t.id];
  });
  if (overdue.length === 0) {
    el.innerHTML = '';
    _ctBannerTicketId = null;
    return;
  }
  var html = '';
  if (overdue.length === 1) {
    var t = overdue[0];
    var isEsc = t.status === 'escalated';
    _ctBannerTicketId = t.id;
    html =
      '<div class="col-full ct-zone-wrap">' +
        '<div class="ct-banner">' +
          '<div class="ct-banner-text">' +
            zi('follow-up') + ' ' + escHtml(t.title) + ' needs a check-in' +
          '</div>' +
          '<div class="chip ct-banner-btn" data-action="ctOpenCheckIn" data-id="' + escAttr(t.id) + '">' +
            'Quick check' +
          '</div>' +
        '</div>' +
      '</div>';
  } else {
    _ctBannerTicketId = null;
    html =
      '<div class="col-full ct-zone-wrap">' +
        '<div class="ct-banner">' +
          '<div class="ct-banner-text">' +
            zi('follow-up') + ' ' + overdue.length + ' trackings need check-ins' +
          '</div>' +
          '<div class="chip ct-banner-btn" data-action="ctViewOverdue">' +
            'Review' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  el.innerHTML = html;

  // Auto-dismiss banner after 30 seconds
  if (html) {
    setTimeout(function() {
      var bannerEl = document.getElementById('ctFollowUpBanner');
      if (bannerEl && bannerEl.innerHTML) {
        bannerEl.innerHTML = '';
        _ctBannerTicketId = null;
      }
    }, 30000);
  }
}

function ctRenderZone() {
  var el = document.getElementById('ctZone');
  if (!el) return;
  var everUsed = localStorage.getItem('ctEverUsed');
  if (!everUsed) {
    el.innerHTML = '';
    return;
  }
  var active = _careTickets.filter(function(t) {
    return t.status === 'active' || t.status === 'escalated';
  });
  var sorted = ctSortTickets(active);
  var visible = sorted.slice(0, 3);
  var totalActive = sorted.length;

  // Zone header with "+" button
  var html =
    '<div class="col-full ct-zone-wrap">' +
      '<div class="ct-zone-header">' +
        '<span>Trackings</span>' +
        '<div class="ct-zone-add" data-action="ctRaiseTicket" role="button" aria-label="Add tracking">+</div>' +
      '</div>';

  if (visible.length === 0) {
    html += '</div>';
    el.innerHTML = html;
    return;
  }

  var now = Date.now();
  visible.forEach(function(t) {
    var tpl = CT_TEMPLATES[t.category] || {};
    var color = ctDomainColor(t);
    var typeClass = t.type === 'incident' ? ' ct-incident' : ' ct-goal';

    // Status modifiers
    var statusClass = '';
    var isOverdue = false;
    var isApproaching = false;
    var isExhausted = false;
    var dueTime = ctNextDueTime(t);

    if (t.status === 'escalated') {
      statusClass = ' ct-escalated';
    } else if (dueTime === Infinity) {
      isExhausted = true;
    } else if (dueTime < now) {
      statusClass = ' ct-overdue';
      isOverdue = true;
    }

    // Approaching resolution: consecutive clears > 0 but not yet resolved
    if (!statusClass && !isExhausted && t.status === 'active') {
      var clears = ctConsecutiveClears(t);
      if (clears > 0) {
        statusClass = ' ct-approaching';
        isApproaching = true;
      }
    }

    // Build card
    var iconName = tpl.icon || 'clipboard';
    if (t.status === 'escalated') iconName = 'siren';
    if (isApproaching) iconName = 'check';

    html += '<div class="card ct-card' + typeClass + statusClass + '" data-action="ctOpenDetail" data-id="' + escAttr(t.id) + '">';
    html += '<div class="card-title">';
    html += '<div class="icon icon-' + escAttr(color) + '">' + zi(iconName) + '</div>';
    html += escHtml(t.title);
    html += '</div>';

    // Status info line
    html += '<div class="ct-card-meta">';
    if (isOverdue) {
      html += '<span class="ct-overdue-dot"></span>';
      html += 'Check-in overdue ' + ctTimeAgo(new Date(dueTime).toISOString());
    } else if (isExhausted) {
      html += 'Check in anytime or stop tracking';
    } else if (t.status === 'escalated') {
      html += 'Escalated ' + ctTimeAgo(t.escalatedAt);
    } else if (dueTime !== Infinity) {
      html += 'Next check ' + ctTimeUntil(new Date(dueTime).toISOString());
    }
    html += '</div>';

    // Quick check button
    html += '<div class="ct-card-actions">';
    html += '<div class="chip ct-banner-btn" data-action="ctOpenCheckIn" data-id="' + escAttr(t.id) + '" data-stop="1">';
    html += zi('follow-up') + ' Quick check';
    html += '</div>';
    html += '</div>';

    html += '</div>';
  });

  // View all link
  if (totalActive > 3) {
    html += '<div class="ct-view-all" data-action="ctViewAll">View all (' + totalActive + ')</div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

// ── CareTickets action stubs removed — all actions handled by ctHandleOverlayAction in intelligence.js ──
