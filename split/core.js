// ─────────────────────────────────────────
// SVG ICON HELPER — Ziva Sketch icon set
// ─────────────────────────────────────────
function zi(name) { return `<svg class="zi" aria-hidden="true"><use href="#zi-${name}"/></svg>`; }

// ─────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────
const KEYS = {
  avatar:     'ziva_avatar',
  growth:     'ziva_growth',
  feeding:    'ziva_feeding',
  milestones: 'ziva_milestones',
  foods:      'ziva_foods',
  vacc:       'ziva_vacc',
  notes:      'ziva_notes',
  meds:       'ziva_meds',
  visits:     'ziva_visits',
  medChecks:  'ziva_med_checks',
  events:     'ziva_events',
  scrapbook:  'ziva_scrapbook',
  doctors:    'ziva_doctors',
  sleep:      'ziva_sleep',
  poop:       'ziva_poop',
  alertsActive:  'ziva_alerts_active',
  alertsHistory: 'ziva_alerts_history',
  vaccBooked:    'ziva_vacc_booked',
  suggestions:   'ziva_suggestions',
  feverEpisodes: 'ziva_fever_episodes',
  diarrhoeaEpisodes: 'ziva_diarrhoea_episodes',
  vomitingEpisodes: 'ziva_vomiting_episodes',
  coldEpisodes: 'ziva_cold_episodes',
  activityLog: 'ziva_activity_log',
  tomorrowPlanned: 'ziva_tomorrow_planned',
  tomorrowOuting: 'ziva_tomorrow_outing',
  powerOutage: 'ziva_power_outage',
  bugReportPhone: 'ziva_bug_report_phone',
  bugTooltipSeen: 'ziva_bug_tooltip_seen',
  qlPredictions: 'ziva_ql_predictions',
};

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  triggerAutosave();
}

// ─────────────────────────────────────────
// DEFAULT DATA (pre-loaded)
// ─────────────────────────────────────────
const DOB        = new Date(2025, 8, 4, 17, 9); // Sep 4, 2025 at 17:09 IST
const SOLIDS_START = new Date(2026, 2, 6); // Mar 6, 2026

// Default pediatrician (seeded on first load)
const DEFAULT_DOCTORS = [
  {
    name: 'Dr. RK Agarwal',
    phone: '+919835167975',
    phoneDisplay: '+91 98351 67975',
    location: 'https://maps.app.goo.gl/gG64c9BBAf7pGo7MA',
    address: 'Bistupur, Jamshedpur',
    title: 'Pediatrician',
    primary: true,
  }
];

const DEFAULT_GROWTH = [
  { date:'2025-09-04', wt:3.45, ht:50 },
  { date:'2026-03-05', wt:7.12, ht:64 },
  { date:'2026-03-18', wt:7.45, ht:65 },
  { date:'2026-03-20', wt:7.55, ht:66 },
];

const DEFAULT_FEEDING = {
  '2026-03-06': { breakfast:'', lunch:'Khichdi (solids start)', dinner:'Khichdi + veg puree' },
  '2026-03-07': { breakfast:'¼ Banana puree', lunch:'Khichdi + veg puree', dinner:'Khichdi + veg puree' },
  '2026-03-08': { breakfast:'¼ Banana puree', lunch:'Khichdi + veg puree', dinner:'Khichdi + veg puree' },
  '2026-03-09': { breakfast:'Pear puree', lunch:'Khichdi + veg puree', dinner:'Khichdi + veg puree' },
  '2026-03-10': { breakfast:'Pear puree', lunch:'Khichdi + veg puree', dinner:'Khichdi + veg puree' },
  '2026-03-11': { breakfast:'Boiled apple', lunch:'Khichdi + veg puree', dinner:'Khichdi + veg puree' },
  '2026-03-16': { breakfast:'Boiled apple', lunch:'Khichdi + veg puree', dinner:'Avocado + banana + blueberry' },
  '2026-03-17': { breakfast:'Banana puree', lunch:'Rice + masoor dal khichdi, carrot, beetroot, beans + ghee', dinner:'Avocado + banana + blueberry' },
  '2026-03-18': { breakfast:'Apple puree (½)', lunch:'Ragi porridge + apple + almonds + walnut + date + ghee', dinner:'' },
  '2026-03-19': { breakfast:'Banana puree', lunch:'Ragi porridge + apple (no nuts)', dinner:'Avocado + apple + blueberry' },
  '2026-03-20': { breakfast:'Pear puree', lunch:'Ragi porridge + pear + almonds + walnut + ghee', dinner:'Avocado + pear + blueberry' },
  '2026-03-22': { breakfast:'', lunch:'', dinner:'Avocado, Blueberry, apple' },
  '2026-03-23': { breakfast:'', lunch:'Rice, Masoor dal, Beetroot, Carrot, Ghee', dinner:'Avocado, Blueberry, Banana' },
  '2026-03-24': { breakfast:'Apple puree', lunch:'Ragi porridge, Almonds, Walnut, Banana', dinner:'Avocado, Blueberry, Apple puree' },
  '2026-03-25': { breakfast:'Pear', lunch:'Masoor dal khichdi, Beetroot, Carrot, Moringa, Ghee', dinner:'' },
};

const MS_STAGES = ['not_started','emerging','practicing','consistent','mastered'];
const MS_STAGE_META = {
  not_started: { label:'Not Started', icon:zi('target'), pct:0, color:'var(--light)' },
  emerging:    { label:'Emerging',    icon:zi('sprout'), pct:25, color:'var(--tc-amber)' },
  practicing:  { label:'Practicing',  icon:zi('target'), pct:50, color:'#886520' },
  consistent:  { label:'Consistent',  icon:zi('check'), pct:75, color:'var(--tc-sage)' },
  mastered:    { label:'Mastered',    icon:zi('star'), pct:100, color:'#1a7a42' },
};

// ══════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
let growthData, feedingData, milestones, foods, vaccData, notes, meds, visits, medChecks, customEvents, scrapbook, doctors, sleepData, poopData, currentReaction;

// Per-key version tracking — only resets what actually changed
// Bump individual key versions when their defaults change
const KEY_VERSIONS = {
  foods: 'v4',       // Last changed: v1.1 (added mango, date fruit)
  meds: 'v4',        // Last changed: v1.1 (corrected dose)
  milestones: 'v4',  // Last changed: v1.1 (added advanced milestones)
  vacc: 'v4',        // Last changed: v1.1 (split combo vaccines)
  feeding: 'v4',     // Last changed: v1.1 (added more days)
  doctors: 'v9',     // Last changed: v1.6 (added address field)
};

function init() {

  // ── M3 Migration: Event Delegation ──
  // Tab buttons
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => { if (btn.dataset.stop) e.stopPropagation(); switchTab(btn.dataset.tab); });
  });
  // Settings tabs
  document.querySelectorAll('.settings-tab[data-stab]').forEach(btn => {
    btn.addEventListener('click', () => switchSettingsTab(btn.dataset.stab));
  });
  // History card collapse
  document.querySelectorAll('[data-collapse-target]').forEach(hdr => {
    hdr.addEventListener('click', () => toggleHistoryCard(hdr.dataset.collapseTarget, hdr.dataset.collapseChevron));
  });
  // Chart zoom
  document.querySelectorAll('.czoom-btn[data-zoom]').forEach(btn => {
    btn.addEventListener('click', () => setChartZoom(btn.dataset.zoomChart, btn.dataset.zoom));
  });
  // Quick modal open
  document.querySelectorAll('[data-quick-modal]').forEach(btn => {
    btn.addEventListener('click', () => { _qlSuggestUsed = false; openQuickModal(btn.dataset.quickModal); });
  });
  // Quick modal close (X buttons)
  document.querySelectorAll('[data-close-quick]').forEach(btn => {
    btn.addEventListener('click', () => { if(btn.dataset.closeQuick) closeQuickModal(btn.dataset.closeQuick); });
  });
  // Modal close
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  // Note filter buttons
  document.querySelectorAll('.ncf-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => filterNotes(btn.dataset.filter));
  });
  // Sleep log filter
  document.querySelectorAll('.sq-btn[data-sleep-filter]').forEach(btn => {
    btn.addEventListener('click', () => filterSleepLog(btn.dataset.sleepFilter));
  });
  // Poop consistency buttons (main form)
  document.querySelectorAll('.pq-btn[data-pcon]').forEach(btn => {
    btn.addEventListener('click', () => setPoopConsistency(btn.dataset.pcon));
  });
  // Poop color buttons (main form)
  document.querySelectorAll('.poop-color-btn[data-pcolor]').forEach(btn => {
    btn.addEventListener('click', () => setPoopColor(btn.dataset.pcolor));
  });
  // Poop amount buttons
  document.querySelectorAll('.pq-btn[data-pamount]').forEach(btn => {
    btn.addEventListener('click', () => setPoopAmount(btn.dataset.pamount));
  });
  // QL meal pills
  document.querySelectorAll('.ql-meal-pill[data-meal]').forEach(pill => {
    pill.addEventListener('click', () => setQLMeal(pill.dataset.meal));
  });
  // QL color dots
  document.querySelectorAll('.ql-color-dot[data-color]').forEach(dot => {
    dot.addEventListener('click', () => setQLColor(dot));
  });
  // QL consistency pills
  document.querySelectorAll('.ql-con-pill[data-con]').forEach(pill => {
    pill.addEventListener('click', () => setQLCon(pill));
  });
  // Activity presets
  document.querySelectorAll('.al-preset[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => alPreset(btn.dataset.preset));
  });
  // Reaction toggles
  document.querySelectorAll('.rtog[data-reaction]').forEach(btn => {
    btn.addEventListener('click', () => setReaction(btn.dataset.reaction));
  });
  // Help toggles (stopPropagation already handled by helper)
  document.querySelectorAll('.help-btn[data-help]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleHelp(btn.dataset.help); });
  });
  // Skip meal buttons
  document.querySelectorAll('.meal-skip-btn[data-skip-meal]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); skipSingleMeal(btn.dataset.skipMeal); });
  });
  // Milestone categories
  document.querySelectorAll('.rtog[data-mcat]').forEach(btn => {
    btn.addEventListener('click', () => setMilestoneCat(btn.dataset.mcat));
  });
  // Vacc slot buttons
  document.querySelectorAll('.vacc-slot-btn[data-slot]').forEach(btn => {
    btn.addEventListener('click', () => selectVaccSlot(btn.dataset.slot));
  });
  // Welcome guide nav
  document.querySelectorAll('[data-wgnav]').forEach(btn => {
    btn.addEventListener('click', () => wgNav(parseInt(btn.dataset.wgnav)));
  });
  // Score popup open
  document.querySelectorAll('[data-open-score]').forEach(el => {
    el.addEventListener('click', () => openScorePopup());
  });
  // Save buttons (QL)
  const qlSaveBtns = {
    'ql-save-feed': saveQLFeed,
    'ql-save-sleep': saveQLSleep,
    'ql-save-nap': saveQLNap,
    'ql-save-poop': saveQLPoop,
    'ql-save-activity': saveActivity,
  };
  Object.entries(qlSaveBtns).forEach(([cls, fn]) => {
    document.querySelectorAll('.' + cls).forEach(btn => {
      btn.addEventListener('click', fn);
    });
  });
  // Tab + scroll-to delegation
  document.querySelectorAll('[data-tab-scroll]').forEach(el => {
    el.addEventListener('click', () => {
      switchTab(el.dataset.tabScroll);
      const targetId = el.dataset.scrollTo;
      const block = el.dataset.scrollBlock || 'start'; setTimeout(() => document.getElementById(targetId)?.scrollIntoView({behavior:'smooth',block:block}), 100);
    });
  });
  // No-op click stoppers
  document.querySelectorAll('[data-noop]').forEach(el => {
    el.addEventListener('click', (e) => e.stopPropagation());
  });
  // Document-level delegated action handler (works for static + dynamic elements)
  document.addEventListener('click', (e) => {
    // ── Chip toggle handler (unified) ──
    var chip = e.target.closest('[data-chip]');
    if (chip) {
      var innerAction = e.target.closest('[data-action]');
      if (innerAction && innerAction !== chip && chip.contains(innerAction)) { /* let action handle */ }
      else {
        var mode = chip.dataset.chip;
        if (mode === 'single') {
          chip.parentElement.querySelectorAll('[data-chip="single"]').forEach(function(s) { s.classList.remove('active'); });
          chip.classList.add('active');
        } else if (mode === 'multi') {
          chip.classList.toggle('active');
        }
      }
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const arg = btn.dataset.arg;
    const arg2 = btn.dataset.arg2;
    const arg3 = btn.dataset.arg3;
    if (btn.dataset.stop) e.stopPropagation();
    _bugLogAction(action, arg);
    // ── Static HTML actions ──
    if (action === 'addQuickNote') addQuickNote();
    else if (action === 'checkFoodCombo') checkFoodCombo();
    else if (action === 'openGrowthModal') openGrowthModal();
    else if (action === 'openGrowthChart') openGrowthChartModal();
    else if (action === 'toggleSettingsSidebar') toggleSettingsSidebar();
    else if (action === 'closeSettingsSidebar') closeSettingsSidebar();
    else if (action === 'closeScorePopup') closeScorePopup();
    else if (action === 'closeAvatarLightbox') closeAvatarLightbox();
    else if (action === 'openAvatarLightbox') openAvatarLightbox();
    else if (action === 'exportData') exportData();
    else if (action === 'shareBackup') shareBackup();
    else if (action === 'promptPWAInstall') promptPWAInstall();
    else if (action === 'showWelcomeGuide') { showWelcomeGuide(); closeSettingsSidebar(); }
    else if (action === 'printDashboard') window.print();
    else if (action === 'importBackup') document.getElementById('importFile').click();
    else if (action === 'changeAvatar') { closeAvatarLightbox(); document.getElementById('avatarInput').click(); }
    else if (action === 'editAvatar') { e.stopPropagation(); document.getElementById('avatarInput').click(); }
    else if (action === 'startSleepClose') { startSleepNow(); closeQuickLogAll(); }
    else if (action === 'saveGrowth') saveGrowthEntry();
    else if (action === 'saveVacc') saveVaccEntry();
    else if (action === 'saveMed') saveMed();
    else if (action === 'saveEvent') saveEvent();
    else if (action === 'resetData') confirmAction('Reset ALL data to defaults? A backup will be downloaded automatically before resetting.', resetAllData, 'Reset');
    else if (action === 'toggleVisitFormShow') toggleVisitForm(true);
    else if (action === 'toggleVisitFormHide') toggleVisitForm(false);
    else if (action === 'dismissWelcomeGuide') dismissWelcomeGuide();
    else if (action === 'toggleHomeVitals') toggleHomeVitals();
    else if (action === 'openScorePopupStop') { e.stopPropagation(); openScorePopup(); }
    else if (action === 'openScorePopup') openScorePopup();
    else if (action === 'openVaccModal') openVaccModal();
    else if (action === 'toggleVaccInfo') toggleVaccInfo();
    else if (action === 'editUpcomingVaccDate') editUpcomingVaccDate();
    else if (action === 'openMedModal') openMedModal();
    else if (action === 'toggleVisitForm') toggleVisitForm();
    else if (action === 'saveVisit') saveVisit();
    else if (action === 'checkSymptoms') checkSymptoms();
    else if (action === 'datePrev') changeDate(-1);
    else if (action === 'dateNext') changeDate(1);
    else if (action === 'saveFeedingDay') saveFeedingDay();
    else if (action === 'addFood') addFood();
    else if (action === 'toggleHomeNotes') toggleHomeNotes();
    else if (action === 'addNote') addNote();
    else if (action === 'clearScrapPhoto') clearScrapPhoto();
    else if (action === 'cancelScrapEdit') cancelScrapEdit();
    else if (action === 'addScrapEntry') addScrapEntry();
    else if (action === 'openMilestoneModal') openMilestoneModal();
    else if (action === 'wakeDown') adjustWakeCount(-1);
    else if (action === 'wakeUp') adjustWakeCount(1);
    else if (action === 'cancelSleepNight') cancelSleepEdit('night');
    else if (action === 'startSleepNight') startSleepNow('night');
    else if (action === 'addSleepEntry') addSleepEntry();
    else if (action === 'cancelSleepNap') cancelSleepEdit('nap');
    else if (action === 'startSleepNap') startSleepNow('nap');
    else if (action === 'addNapEntry') addNapEntry();
    else if (action === 'cancelPoopEdit') cancelPoopEdit();
    else if (action === 'addPoopEntry') addPoopEntry();
    else if (action === 'homeFabAction') homeFabAction();
    else if (action === 'toggleDarkMode') toggleDarkMode();
    else if (action === 'toggleQuickLog') toggleQuickLog();
    else if (action === 'closeQuickLog') closeQuickLog();
    else if (action === 'openQLBackfill') openQLBackfill();
    else if (action === 'closeQuickModal') closeQuickModal();
    else if (action === 'closeQuickModalSelf') { if (e.target === btn) closeQuickModal(); }
    else if (action === 'qlWakeDown') adjQLWake(-1);
    else if (action === 'qlWakeUp') adjQLWake(1);
    else if (action === 'startSleepCloseNight') { startSleepNow('night'); closeQuickLogAll(); }
    else if (action === 'startSleepCloseNap') { startSleepNow('nap'); closeQuickLogAll(); }
    else if (action === 'skipDuration') document.getElementById('alDuration').value = '';
    else if (action === 'dismissFlashSelf') { if (e.target === btn) dismissPostSaveFlash(); }
    else if (action === 'quickSaveNow') quickSaveNow();
    else if (action === 'closeAvatarSelf') { if (e.target === btn) closeAvatarLightbox(); }
    else if (action === 'closeCrop') closeCrop();
    else if (action === 'saveCrop') saveCrop();
    else if (action === 'addGrowthEntry') addGrowthEntry();
    else if (action === 'addVacc') addVacc();
    else if (action === 'saveVaccAppt') saveVaccAppt();
    else if (action === 'saveVaccEdit') saveVaccEdit();
    else if (action === 'addMilestone') addMilestone();
    else if (action === 'saveDoctor') saveDoctor();
    else if (action === 'toggleInsightsPulse') { const ep = document.getElementById('insightsPulseExpanded'); ep.style.display = ep.style.display === 'none' ? '' : 'none'; }
    else if (action === 'startSleepNow') startSleepNow();
    else if (action === 'closeQuickLogAll') closeQuickLogAll();
    // ── Dynamic render actions (with args) ──
    else if (action === 'switchTab') switchTab(arg);
    else if (action === 'switchTrackSub') switchTrackSub(arg);
    else if (action === 'expandMilestones') expandMilestones(arg);
    else if (action === 'togglePlanSection') togglePlanSection(arg);
    else if (action === 'toggleRecoRecipe') toggleRecoRecipe(arg);
    else if (action === 'toggleHistoryMonth') toggleHistoryMonth(arg);
    else if (action === 'toggleHistoryDay') toggleHistoryDay(arg);
    else if (action === 'toggleTipCat') toggleTipCat(arg);
    else if (action === 'expandUpcoming') expandUpcoming(arg);
    else if (action === 'expandActivities') expandActivities(arg);
    else if (action === 'expandMilestoneByIdx') expandMilestoneByIdx(arg);
    else if (action === 'expandActivityType') expandActivityType(arg);
    else if (action === 'toggleMsCat') toggleMsCat(arg);
    else if (action === 'toggleActivityCat') toggleActivityCat(arg);
    else if (action === 'toggleUpcomingCat') toggleUpcomingCat(arg);
    else if (action === 'showHeatmapDetail') showHeatmapDetail(arg);
    else if (action === '_spSwitchTab') _spSwitchTab(arg);
    else if (action === 'editSleepEntry') editSleepEntry(parseInt(arg));
    else if (action === 'goToSleepLog') { switchTab('track'); setTimeout(function() { toggleHistoryCard('sleepLogBody', 'sleepLogChevron'); var el = document.getElementById('sleepLogBody'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); }
    else if (action === 'editPoopEntry') editPoopEntry(parseInt(arg));
    else if (action === 'endSleepNow') endSleepNow(arg);
    else if (action === 'deleteSleepEntry') deleteSleepEntry(parseInt(arg));
    else if (action === 'deletePoopEntry') deletePoopEntry(parseInt(arg));
    else if (action === 'deleteGrowth') deleteGrowth(parseInt(arg));
    else if (action === 'deleteVisit') deleteVisit(parseInt(arg));
    else if (action === 'deleteDoctor') deleteDoctor(parseInt(arg));
    else if (action === 'editDoctor') editDoctor(parseInt(arg));
    else if (action === 'openVaccEditModal') openVaccEditModal(arg);
    else if (action === 'deleteMilestone') deleteMilestone(arg);
    else if (action === 'deleteNote') deleteNote(parseInt(arg));
    else if (action === 'toggleNote') toggleNote(parseInt(arg));
    else if (action === 'clearNotePhoto') clearNotePhoto(parseInt(arg));
    else if (action === 'clearNoteVoice') clearNoteVoice(parseInt(arg));
    else if (action === 'openNotePhoto') openNotePhoto(parseInt(arg));
    else if (action === 'editScrapEntry') editScrapEntry(parseInt(arg));
    else if (action === 'deleteScrapEntry') deleteScrapEntry(parseInt(arg));
    else if (action === 'openScrapPhoto') openScrapPhoto(parseInt(arg));
    else if (action === 'removeActivityChip') removeActivityChip(arg);
    else if (action === 'alSelectSlot') _alSelectSlot(arg);
    else if (action === 'alSelectDuration') _alSelectDuration(arg);
    else if (action === 'alToggleOtherDur') _alToggleOtherDur();
    else if (action === 'alSetCustomDur') _alSetCustomDur();
    else if (action === 'alTapSuggestion') _alTapSuggestion(arg);
    else if (action === 'alPresetTap') _alPresetTap(arg);
    else if (action === 'alTapYesterday') _alTapYesterday(arg);
    else if (action === 'alRepeatAll') _alRepeatAll();
    else if (action === 'alUpgradeYes') _alUpgradeYes(arg);
    else if (action === 'alUpgradeDismiss') _alUpgradeDismiss(arg);
    else if (action === 'deleteEvent') deleteEvent(parseInt(arg));
    else if (action === 'deleteFeedingEntry') deleteFeedingEntry(arg);
    else if (action === 'selectQLBackfillDate') selectQLBackfillDate(arg);
    else if (action === 'startBackfill') startBackfill(arg);
    else if (action === 'fillDietMeal') fillDietMeal(arg);
    else if (action === 'insertDietFood') insertDietFood(arg);
    else if (action === 'navFeedDay') { document.getElementById('feedingDate').value = arg; loadFeedingDay(); switchTab('diet'); }
    else if (action === 'navTabSub') { switchTab(arg); setTimeout(() => switchTrackSub(arg2), 100); }
    else if (action === 'closeScoreAndNav') { closeScorePopup(); setTimeout(() => switchTab(arg), 350); }
    else if (action === 'qlMealAndOpen') { _qlMeal = arg; openQuickModal(arg2); }
    else if (action === 'showHeatmapDetail') showHeatmapDetail(arg, parseInt(arg2), arg3);
    else if (action === 'openDoctorModal') { const a = arg; if (a) openDoctorModal(parseInt(a)); else openDoctorModal(); }
    else if (action === 'openFoodCatModal') openFoodCatModal(arg);
    else if (action === 'switchFoodCatSub') switchFoodCatSub(arg);
    else if (action === 'openVaccApptModal') openVaccApptModal(arg);
    else if (action === 'markVaccBooked') markVaccBooked(arg);
    else if (action === 'vaccMarkDone') _vaccMarkDone([arg], arg2);
    else if (action === 'vaccMarkDoneMulti') {
      const checks = document.querySelectorAll('.vc-complete-checks .vc-check-input:checked');
      const names = [];
      checks.forEach(cb => { const lbl = cb.closest('.vc-complete-check'); if (lbl) { const idx = parseInt(lbl.dataset.vaccIdx); if (vaccData[idx]) names.push(vaccData[idx].name); } });
      if (names.length) _vaccMarkDone(names, arg);
    }
    else if (action === 'vaccShowDelay') {
      const origC = document.getElementById('vaccOriginalContent');
      const ovrl = document.getElementById('vaccCompletionOverlay');
      if (origC) origC.style.display = 'none';
      if (ovrl) {
        ovrl.innerHTML = _vaccRenderDelayCard(arg);
        ovrl.style.display = '';
      }
      _vaccUpdateDelayAssessment(arg);
      const dInput = document.getElementById('vaccDelayDateInput');
      if (dInput) dInput.addEventListener('input', () => _vaccUpdateDelayAssessment(arg));
    }
    else if (action === 'vaccDelayReason') {
      document.querySelectorAll('.vc-delay-chip').forEach(c => c.classList.toggle('active', c.dataset.arg === arg));
      _vaccDelayReason = arg;
    }
    else if (action === 'vaccSaveDelay') _vaccSaveDelay(arg);
    else if (action === 'vaccCancelDelay') { renderVacc(); }
    else if (action === 'vaccSelectSeverity') _vaccHandleSeverity(arg);
    else if (action === 'vaccToggleSymptom') _vaccToggleSymptom(btn);
    else if (action === 'vaccSelectTemp') _vaccSelectChip(btn, 'vc-temp-chip');
    else if (action === 'vaccSelectCry') _vaccSelectChip(btn, 'vc-cry-chip');
    else if (action === 'vaccSaveReaction') _vaccSaveReaction();
    else if (action === 'vaccLogReaction') {
      const names = arg ? JSON.parse(arg) : [];
      _vaccOpenReactionModal(names);
    }
    else if (action === 'vaccAllGood') {
      const names = arg ? JSON.parse(arg) : [];
      const todayStr = today();
      const yesterdayStr = _offsetDateStr(todayStr, -1);
      names.forEach(name => {
        const v = vaccData.find(e => e.name === name && !e.upcoming && !e.reaction && (e.date === todayStr || e.date === yesterdayStr));
        if (v) { v.reaction = 'none'; v.reactionLoggedAt = new Date().toISOString(); }
      });
      save(KEYS.vacc, vaccData);
      _islMarkDirty('medical');
      renderRemindersAndAlerts();
      renderHomeContextAlerts();
    }
    else if (action === 'vaccOverdueDone') {
      const names = arg ? JSON.parse(arg) : [];
      _vaccMarkDone(names, arg2);
    }
    else if (action === 'vaccOverdueDelay') {
      const delayDate = arg;
      switchTab('track');
      setTimeout(() => {
        switchTrackSub('medical');
        setTimeout(() => {
          const origC = document.getElementById('vaccOriginalContent');
          const ovrl = document.getElementById('vaccCompletionOverlay');
          if (origC) origC.style.display = 'none';
          if (ovrl) {
            ovrl.innerHTML = _vaccRenderDelayCard(delayDate);
            ovrl.style.display = '';
          }
          _vaccUpdateDelayAssessment(delayDate);
          const dInput = document.getElementById('vaccDelayDateInput');
          if (dInput) dInput.addEventListener('input', () => _vaccUpdateDelayAssessment(delayDate));
          const vaccCard = document.getElementById('vaccCardInner');
          if (vaccCard) vaccCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }, 100);
    }
    else if (action === 'vaccTimelineTap') _vaccShowTimelineDetail(parseInt(arg));
    else if (action === 'vaccCloseTimelineDetail') _vaccCloseTimelineDetail();
    else if (action === 'vaccOpenReactionEdit') _vaccOpenReactionEdit(parseInt(arg));
    else if (action === 'vaccCloseGuidance') closeModal('vaccReactionModal');
    else if (action === 'logVomitingEpisodeEntry') logVomitingEpisodeEntry();
    else if (action === 'deLogStoolPrompt') deLogStoolPrompt(arg);
    else if (action === 'feLogReadingFromInput') feLogReadingFromInput(arg);
    else if (action === 'feResolvePrompt') feResolvePrompt(arg);
    else if (action === 'deResolvePrompt') deResolvePrompt(arg);
    else if (action === 'voResolvePrompt') voResolvePrompt(arg);
    else if (action === 'ceResolvePrompt') ceResolvePrompt(arg);
    else if (action === 'feToggleAllReadings') feToggleAllReadings();
    else if (action === 'feLogDosePrompt') feLogDosePrompt();
    else if (action === 'deLogFluidPrompt') deLogFluidPrompt();
    else if (action === 'voLogFluidPrompt') voLogFluidPrompt();
    else if (action === 'sgToggleMore') sgToggleMore();
    else if (action === 'sgTapChip') sgTapChip(parseInt(arg));
    else if (action === 'feEditReading') feEditReading(parseInt(arg));
    else if (action === 'feEditDose') feEditDose(parseInt(arg));
    else if (action === 'feEditAction') feEditAction(parseInt(arg));
    else if (action === 'deEditFluid') deEditFluid(parseInt(arg));
    else if (action === 'deEditWetDiaper') deEditWetDiaper(parseInt(arg));
    else if (action === 'deEditStool') deEditStool(parseInt(arg));
    else if (action === 'deEditAction') deEditAction(parseInt(arg));
    else if (action === 'voEditEntry') voEditEntry(parseInt(arg));
    else if (action === 'voEditAction') voEditAction(parseInt(arg));
    else if (action === 'ceEditAction') ceEditAction(parseInt(arg));
    else if (action === 'ceSetSeverity') ceSetSeverity(arg);
    else if (action === 'toggleUpcomingSubcat') toggleUpcomingSubcat(arg);
    else if (action === 'dismissPostSaveFlash') dismissPostSaveFlash();
    else if (action === 'showPsfReview') showPsfReview();
    else if (action === 'openDiversityDetail') openDiversityDetail();
    else if (action === 'openHomeFoodQuery') openHomeFoodQuery();
    else if (action === 'openHomeSymptomChecker') openHomeSymptomChecker();
    else if (action === 'closeHomeFoodQuery') closeHomeFoodQuery();
    else if (action === 'runHomeFoodQuery') runHomeFoodQuery();
    else if (action === 'closeHomeSymptomChecker') closeHomeSymptomChecker();
    else if (action === 'runHomeSymptomCheck') runHomeSymptomCheck();
    else if (action === 'promptFeverTrack') promptFeverTrack();
    else if (action === 'promptDiarrhoeaTrack') promptDiarrhoeaTrack();
    else if (action === 'promptVomitingTrack') promptVomitingTrack();
    else if (action === 'promptColdTrack') promptColdTrack();
    else if (action === 'toggleMed') toggleMed(parseInt(arg));
    else if (action === 'deleteMed') deleteMed(parseInt(arg));
    else if (action === 'cancelSleepInProgress') cancelSleepInProgress(arg);
    else if (action === 'restoreAutosave') restoreAutosave(parseInt(arg));
    else if (action === 'undoLastActivity') undoLastActivity();
    else if (action === 'undoLastQL') undoLastQL();
    else if (action === 'showFullDoctorSummary') showFullDoctorSummary();
    else if (action === 'confirmRegressionCheck') confirmRegressionCheck(arg);
    else if (action === 'expandUpcomingItem') expandUpcomingItem(arg);
    else if (action === 'toggleCorrEvidence') toggleCorrEvidence(arg);
    else if (action === 'resolveMissedMed') resolveMissedMed(arg, arg2, arg3);
    else if (action === 'markMedDone') markMedDone(arg, parseInt(arg2));
    else if (action === 'markMedSkipped') markMedSkipped(arg, parseInt(arg2));
    else if (action === 'overrideMilestoneStatus') { const args = arg.split(',').map(s=>s.trim().replace(/^'|'$/g,'')); overrideMilestoneStatus(...args); }
    else if (action === 'upcomingToMilestone') { const args = arg.split(',').map(s=>s.trim().replace(/^'|'$/g,'')); upcomingToMilestone(...args); }
    else if (action === 'deleteFoodAndRender') { deleteFood(arg); renderFoodCatSubContent(arg2); }
    else if (action === 'navTabSub') { switchTab(arg); setTimeout(() => switchTrackSub(arg2), 100); }
    else if (action === 'closeScoreAndNav') { closeScorePopup(); setTimeout(() => switchTab(arg), 350); }
    else if (action === 'qlMealAndOpen') { _qlMeal = arg; openQuickModal(arg2); }
    else if (action === 'closeAndPromptFever') { closeHomeSymptomChecker(); promptFeverTrack(); }
    else if (action === 'closeAndPromptDiarrhoea') { closeHomeSymptomChecker(); promptDiarrhoeaTrack(); }
    else if (action === 'closeAndPromptVomiting') { closeHomeSymptomChecker(); promptVomitingTrack(); }
    else if (action === 'closeAndPromptCold') { closeHomeSymptomChecker(); promptColdTrack(); }
    else if (action === 'feHomeBannerLog') feHomeBannerLog();
    else if (action === 'deLogStoolQuick') deLogStoolQuick(arg);
    else if (action === 'dismissAlert') dismissAlert(arg, arg2);
    else if (action === 'toggleAlertTip') toggleAlertTip(arg);
    else if (action === 'execAlertAction') execAlertAction(arg);
    else if (action === 'skipMeals') { try { skipMeals(JSON.parse(arg)); } catch(ex) {} }
    else if (action === 'resetQLSheet') resetQLSheet();
    // ── Smart Quick Log actions ──
    else if (action === 'qlOpenFeedPrefill') _qlConfirmSuggest();
    else if (action === 'qlOpenFeed') _qlEditSuggest();
    else if (action === 'qlStartSleep') { _qlSuggestUsed = true; openQuickModal('sleep'); }
    else if (action === 'qlStartNap') { _qlSuggestUsed = true; openQuickModal('nap'); }
    else if (action === 'qlOpenPoop') { _qlSuggestUsed = true; openQuickModal('poop'); }
    else if (action === 'qlOpenActivity') { _qlSuggestUsed = true; openQuickModal('activity'); }
    else if (action === 'qlSwitchSuggest') _qlSwitchSuggest(arg);
    // ── Food Favorites ──
    else if (action === 'foodToggleFavorite') {
      toggleFoodFavorite(arg);
      // Re-render current food category view
      if (_activeFoodCatParent && _activeFoodCatSub) {
        renderFoodCatSubContent(_activeFoodCatParent, _activeFoodCatSub);
      }
    }
    // ── Bug Capture actions ──
    else if (action === 'openBugReporter') { openBugReporter(); closeSettingsSidebar(); }
    else if (action === 'closeBugReporter') closeBugReporter();
    else if (action === 'closeBugReporterSelf') { if (e.target === btn) closeBugReporter(); }
    else if (action === 'bugSendWhatsApp') _bugSendWhatsApp();
    else if (action === 'bugCopyClipboard') _bugCopyClipboard();
    else if (action === 'bugAutoReport') { _bugDismissAutoPrompt(); openBugReporter(true); }
    else if (action === 'bugAutoDismiss') _bugDismissAutoPrompt();
    else if (action === 'bugDismissTooltip') _bugDismissTooltip();
    // ── Today So Far actions ──
    else if (action === 'tsfToggleEvent') {
      _tsfExpandedId = _tsfExpandedId === arg ? null : arg;
      renderTodaySoFar();
    }
    else if (action === 'tsfShowEarlier') {
      _tsfShowAll = true;
      renderTodaySoFar();
    }
    else if (action === 'tsfNudgeTap') {
      // arg = pattern key, arg2 = meal type, arg3 = med name
      if (arg && arg.startsWith('med-') && arg3) {
        // Direct mark done for supplements
        markMedDone(arg3, 0);
        renderTodaySoFar();
      } else if (arg === 'morning-nap' || arg === 'afternoon-nap') {
        openQuickModal('nap');
      } else if (arg === 'afternoon-poop') {
        openQuickModal('poop');
      } else if (arg2) {
        // Feed nudge — pre-select meal type
        _qlMeal = arg2;
        openQuickModal('feed');
        setTimeout(function() {
          document.querySelectorAll('.ql-meal-pill').forEach(function(p) { p.classList.toggle('active', p.dataset.meal === arg2); });
        }, 50);
      } else {
        openQuickModal('feed');
      }
    }
  });

  // ── Input event delegation (for data-action on input fields) ──
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'checkVaccDateShift') checkVaccDateShift();
  });

  // ── Checkbox delegation (vacc completion multi-check) ──
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('vc-check-input')) {
      const label = e.target.closest('.vc-complete-check');
      if (label) label.classList.toggle('checked', e.target.checked);
    }
  });

  
  // Delegated scroll-to handler (works for both static and render code elements)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-scroll-to]');
    if (el && !el.dataset.tabScroll) {
      const targetId = el.dataset.scrollTo;
      const block = el.dataset.scrollBlock || 'start';
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({behavior:'smooth', block: block});
    }
    // Nav to track > medical > card
    const navMed = e.target.closest('[data-nav-track-medical]');
    if (navMed) {
      const cardId = navMed.dataset.navTrackMedical;
      switchTab('track');
      setTimeout(() => { switchTrackSub('medical'); setTimeout(() => { document.getElementById(cardId)?.scrollIntoView({behavior:'smooth'}); }, 100); }, 100);
    }
    // Milestone cat + scroll
    const mcat = e.target.closest('[data-action-mcat]');
    if (mcat) {
      const cat = mcat.dataset.actionMcat;
      toggleMsCat(cat);
      setTimeout(() => document.getElementById('ms-cat-' + cat)?.scrollIntoView({behavior:'smooth', block:'center'}), 50);
    }
  });

    // Populate zi icon placeholders in static HTML
  document.querySelectorAll('.zi-check-placeholder').forEach(el => { el.innerHTML = zi('check'); });
  document.querySelectorAll('.zi-warn-placeholder').forEach(el => { el.innerHTML = zi('warn'); });

  // Selective migration — only reset keys whose version changed
  Object.entries(KEY_VERSIONS).forEach(([key, ver]) => {
    const storedVer = localStorage.getItem('ziva_kv_' + key);
    if (storedVer !== ver) {
      localStorage.removeItem(KEYS[key]);
      localStorage.setItem('ziva_kv_' + key, ver);
    }
  });

  growthData  = load(KEYS.growth, null)     || DEFAULT_GROWTH;
  feedingData = load(KEYS.feeding, null)    || DEFAULT_FEEDING;
  milestones  = load(KEYS.milestones, null) || DEFAULT_MILESTONES;
  foods       = load(KEYS.foods, null)      || DEFAULT_FOODS;
  vaccData    = load(KEYS.vacc, null)       || DEFAULT_VACC;
  notes       = load(KEYS.notes, null)      || [];
  meds        = load(KEYS.meds, null)       || DEFAULT_MEDS;
  visits      = load(KEYS.visits, null)     || [];
  customEvents = load(KEYS.events, null)    || [];
  scrapbook    = load(KEYS.scrapbook, null) || [];
  doctors      = load(KEYS.doctors, null)   || DEFAULT_DOCTORS;
  sleepData    = load(KEYS.sleep, null)     || [];
  poopData     = load(KEYS.poop, null)      || [];

  // Load activity log (evidence-based milestones)
  activityLog  = load(KEYS.activityLog, null) || {};
  if (typeof activityLog !== 'object' || activityLog === null || Array.isArray(activityLog)) activityLog = {};

  // Load tomorrow's planned meals
  _tomorrowPlanned = load(KEYS.tomorrowPlanned, null) || null;

  // Load tomorrow's outing (auto-clears past outings)
  _outingInit();

  // Sanitize: ensure arrays and remove entries missing required fields
  try {
    if (!Array.isArray(sleepData)) sleepData = [];
    if (!Array.isArray(poopData)) poopData = [];
    if (!Array.isArray(growthData)) growthData = DEFAULT_GROWTH.slice();
    if (!Array.isArray(milestones)) milestones = DEFAULT_MILESTONES.slice();
    // Migrate old milestone statuses to 5-stage model
    milestones.forEach(m => migrateMilestoneStatus(m));
    if (!Array.isArray(foods)) foods = DEFAULT_FOODS.slice();
    _deduplicateFoods();
    if (!Array.isArray(vaccData)) vaccData = DEFAULT_VACC.slice();
    if (!Array.isArray(notes)) notes = [];
    if (!Array.isArray(meds)) meds = DEFAULT_MEDS.slice();
    if (!Array.isArray(visits)) visits = [];
    if (!Array.isArray(scrapbook)) scrapbook = [];
    if (typeof feedingData !== 'object' || feedingData === null) feedingData = {};
    if (typeof medChecks !== 'object' || medChecks === null) medChecks = {};
    sleepData = sleepData.filter(e => e && typeof e === 'object' && e.date && e.bedtime && e.wakeTime && e.type);
    poopData = poopData.filter(e => e && typeof e === 'object' && e.date);
  } catch(sanitizeErr) {
    console.warn('Data sanitization error — resetting corrupted stores:', sanitizeErr);
    sleepData = []; poopData = [];
  }
  currentReaction = 'ok';

  // Migrate old milestone format (done:boolean) → new (status string)
  milestones = milestones.map(m => {
    if ('done' in m && !('status' in m)) {
      return { text:m.text, status:m.done?'done':'pending', advanced:m.advanced||false, doneAt:m.done?today():null, inProgressAt:null, cat:m.cat||guessMilestoneCat(m.text) };
    }
    // Ensure cat field exists on all milestones
    if (!m.cat) m.cat = guessMilestoneCat(m.text);
    return m;
  });
  save(KEYS.milestones, milestones);

  // Migrate milestones for evidence-based fields (backward compat)
  milestones.forEach(m => {
    if (m.manualStatus === undefined) {
      if (m.status && m.status !== 'not_started') {
        m.manualStatus = m.status;
        m.manualAt = m.masteredAt || m.consistentAt || m.practicingAt || m.emergingAt || null;
      } else {
        m.manualStatus = null;
      }
      m.autoStatus = null;
      m.evidenceCount = 0;
      m.firstSeen = null;
      m.lastSeen = null;
      m.confidenceHigh = 0;
    }
  });
  // Sync evidence-based statuses on boot (if any activity log entries exist)
  if (Object.keys(activityLog).length > 0) {
    syncMilestoneStatuses();
  }

  // Migrate old grouped vaccination names → individual entries
  const VACC_MIGRATIONS = {
    'birth vaccines (bcg, opv, hep-b)': [
      { name:'BCG', upcoming:false },
      { name:'OPV-0', upcoming:false },
      { name:'Hep B-1', upcoming:false },
    ],
    '6-week combo (dtwp/ipv/hib, hep-b, pcv, rv)': [
      { name:'DTwP/DTaP-1', upcoming:false },
      { name:'Hep B-2', upcoming:false },
      { name:'Hib-1', upcoming:false },
      { name:'IPV-1', upcoming:false },
      { name:'Rotavirus-1', upcoming:false },
      { name:'PCV-1', upcoming:false },
    ],
    '10-week booster': [
      { name:'DTwP/DTaP-2', upcoming:false },
      { name:'Hep B-3', upcoming:false },
      { name:'Hib-2', upcoming:false },
      { name:'IPV-2', upcoming:false },
      { name:'OPV-1', upcoming:false },
      { name:'Rotavirus-2', upcoming:false },
      { name:'PCV-2', upcoming:false },
    ],
    '14-week booster': [
      { name:'DTwP/DTaP-3', upcoming:false },
      { name:'Hep B-4', upcoming:false },
      { name:'Hib-3', upcoming:false },
      { name:'IPV-3', upcoming:false },
      { name:'Rotavirus-3', upcoming:false },
      { name:'PCV-3', upcoming:false },
    ],
    '6-month combo': [
      { name:'TCV', upcoming:false },
      { name:'Influenza-1', upcoming:false },
    ],
    '9-month combo (mmr, opv booster)': [
      { name:'MMR-1', upcoming:false },
      { name:'OPV-2', upcoming:false },
    ],
  };
  let vaccMigrated = false;
  vaccData = vaccData.flatMap(v => {
    const key = v.name.toLowerCase();
    if (VACC_MIGRATIONS[key]) {
      vaccMigrated = true;
      return VACC_MIGRATIONS[key].map(m => ({ ...m, date: v.date, upcoming: v.upcoming }));
    }
    return [v];
  });
  if (vaccMigrated) save(KEYS.vacc, vaccData);

  // Load med check history — a log of { _trackingSince:'YYYY-MM-DD', [date]: { [medName]: 'done:HH:MM' | 'skipped' } }
  medChecks = load(KEYS.medChecks, null) || {};
  // Ensure it's the new format (object of dates, not old single-day format)
  if (medChecks.date && medChecks.checked) {
    // Migrate from old format
    const oldDate = medChecks.date;
    const oldChecked = medChecks.checked;
    medChecks = { _trackingSince: oldDate };
    if (oldDate && Object.keys(oldChecked).length) {
      medChecks[oldDate] = {};
      Object.entries(oldChecked).forEach(([k,v]) => { medChecks[oldDate][k] = 'done:' + v; });
    }
    save(KEYS.medChecks, medChecks);
  }
  // Set tracking start date on first ever use
  if (!medChecks._trackingSince) {
    medChecks._trackingSince = today();
    save(KEYS.medChecks, medChecks);
  }
  // Prune medChecks older than 90 days to prevent unbounded growth
  const pruneDate = new Date();
  pruneDate.setDate(pruneDate.getDate() - 90);
  const pruneKey = toDateStr(pruneDate);
  let pruned = false;
  Object.keys(medChecks).forEach(k => {
    if (k !== '_trackingSince' && k < pruneKey) { delete medChecks[k]; pruned = true; }
  });
  if (pruned) save(KEYS.medChecks, medChecks);

  // Avatar
  const av = load(KEYS.avatar, null);
  if (av) {
    const el = document.getElementById('avatarEl');
    el.innerHTML = `<img src="${av}" alt="Ziva">`;
  }

  updateHeader();
  renderHome();
  renderGrowth();
  renderGrowthFacts();
  initFeeding();
  renderMilestones();
  renderFoods();
  renderVacc();
  renderVaccCoverage();
  renderDoctorContact();
  renderNotes();
  renderScrapbook();
  renderMeds();
  renderVisits();
  renderTips();
  renderActivities();
  renderUpcomingMilestones();
  renderUpcomingEvents();
  initComboChecker();
  renderSleep();
  renderHomeSleep();
  // set foodDate default
  document.getElementById('foodDate').value = today();

  // Restore last active tab on refresh
  const savedTab = localStorage.getItem('ziva_active_tab');
  if (savedTab && savedTab !== 'home') {
    if (TAB_ORDER.includes(savedTab)) {
      switchTab(savedTab);
    } else if (TRACK_SUB_ORDER.includes(savedTab)) {
      // Old saved domain tab → redirect to Track with that sub-tab
      switchTab(savedTab); // switchTab auto-redirects domain names to track
    }
  }

  // Check if data was lost and autosave is available
  setTimeout(checkAutosaveRecovery, 500);
}

// ─────────────────────────────────────────

// ─────────────────────────────────────────
// SCORING SYSTEM
// ─────────────────────────────────────────

const SCORE_LABELS = [
  { min: 90, label: 'excellent', emoji: zi('sparkle'), text: 'Excellent' },
  { min: 75, label: 'great',     emoji: zi('check'), text: 'Great' },
  { min: 60, label: 'good',      emoji: zi('check'), text: 'Good' },
  { min: 45, label: 'fair',      emoji: zi('target'), text: 'Fair' },
  { min: 0,  label: 'attention', emoji: zi('warn'), text: 'Needs attention' },
];

function getScoreLabel(score) {
  for (const sl of SCORE_LABELS) { if (score >= sl.min) return sl; }
  return SCORE_LABELS[SCORE_LABELS.length - 1];
}

// ════════════════════════════════════════
// INTELLIGENCE-AWARE SCORING
// ════════════════════════════════════════

let _modifierCache = {};
let _lastPoopModifier = { score: 70, delta: 0, label: null, confidence: 0, factors: [] };
const NEUTRAL_MODIFIER = Object.freeze({ score: 70, delta: 0, label: null, confidence: 0, factors: Object.freeze([]) });

function _neutralModifier() { return { score: 70, delta: 0, label: null, confidence: 0, factors: [] }; }

function _clearModifierCache() { _modifierCache = {}; _computingSleepMod = false; }

function countDataDays() {
  const allDates = new Set();
  Object.keys(feedingData || {}).forEach(d => allDates.add(d));
  (sleepData || []).forEach(s => { if (s.date) allDates.add(s.date); });
  (poopData || []).forEach(p => { if (p.date) allDates.add(p.date); });
  Object.keys(activityLog || {}).forEach(d => {
    if (Array.isArray(activityLog[d]) && activityLog[d].length > 0) allDates.add(d);
  });
  Object.keys(medChecks || {}).forEach(d => {
    if (d !== '_trackingSince' && medChecks[d]) allDates.add(d);
  });
  return allDates.size;
}

function getModifierWeight() {
  const dd = countDataDays();
  if (dd < 7) return 0;
  if (dd < 14) return 0.10;
  if (dd < 21) return 0.15;
  return 0.20;
}

function applyIntelligenceModifier(baseScore, modifier) {
  const weight = getModifierWeight();
  if (weight === 0) return baseScore;
  const raw = Math.round(baseScore * (1 - weight) + modifier.score * weight);
  return Math.max(baseScore - 10, Math.min(baseScore + 10, raw));
}

function _getModifierLabel(factors) {
  if (!factors || factors.length === 0) return null;
  let maxDev = 0, dominant = null;
  factors.forEach(f => {
    const dev = Math.abs(f.value - 70);
    if (dev > maxDev) { maxDev = dev; dominant = f; }
  });
  if (!dominant || maxDev < 5) return null;
  return dominant.name.toLowerCase() + (dominant.value > 70 ? ' strong' : ' needs work');
}

function _buildModifier(factors) {
  if (!factors || factors.length === 0) return _neutralModifier();
  let wSum = 0, wTotal = 0;
  factors.forEach(f => { wSum += f.value * f.weight; wTotal += f.weight; });
  const score = wTotal > 0 ? Math.round(wSum / wTotal) : 70;
  const label = _getModifierLabel(factors);
  const confidence = Math.min(1, factors.filter(f => f.value !== 70).length / factors.length);
  return { score, delta: 0, label, confidence, factors };
}

function _withDelta(modifier, baseScore, finalScore) {
  return { score: modifier.score, delta: finalScore - baseScore, label: modifier.label, confidence: modifier.confidence, factors: modifier.factors };
}

// ── Expected texture stage by age ──
function _expectedTextureStage(ageMonths) {
  if (ageMonths < 7) return 0;   // puree
  if (ageMonths < 8) return 1;   // mashed
  if (ageMonths < 10) return 2;  // soft
  return 3;                       // finger
}

// ════════════════════════════════════════
// DOMAIN MODIFIERS
// ════════════════════════════════════════

// ── Diet Modifier ──
function computeDietModifier() {
  if (_modifierCache.diet) return _modifierCache.diet;
  const feedDays = Object.keys(feedingData || {}).length;
  if (feedDays < 7) { _modifierCache.diet = _neutralModifier(); return _modifierCache.diet; }

  const factors = [];

  // 1. Variety trend (25%)
  const intro = computeIntroductionRate();
  let varietyVal = 70;
  if (intro && intro.trend) {
    if (intro.trend === 'accelerating') varietyVal = 100;
    else if (intro.trend === 'steady') varietyVal = 70;
    else if (intro.trend === 'slowing') varietyVal = 40;
  }
  factors.push({ name: 'Variety trend', value: varietyVal, weight: 0.25 });

  // 2. Nutrient consistency (25%)
  const bl = computeBaselines();
  let nutrientVal = 70;
  if (bl && bl.nutrientDays) {
    const covered = KEY_NUTRIENTS.filter(n => (bl.nutrientDays[n] || 0) >= 1).length;
    const pct = KEY_NUTRIENTS.length > 0 ? covered / KEY_NUTRIENTS.length : 0;
    nutrientVal = pct >= 0.8 ? 100 : pct >= 0.5 ? 70 : 40;
  }
  factors.push({ name: 'Nutrient consistency', value: nutrientVal, weight: 0.25 });

  // 3. Repetition fatigue (25%)
  const rep = computeFoodRepetition();
  let repVal = 100;
  if (rep) {
    if (rep.fatigued && rep.fatigued.length > 0) repVal = 30;
    else if (rep.warned && rep.warned.length > 0) repVal = 55;
  }
  factors.push({ name: 'Repetition', value: repVal, weight: 0.25 });

  // 4. Texture progression (25%)
  const tex = computeTextureProgression();
  let texVal = 70;
  if (tex && tex.currentStage) {
    const stageIdx = { puree: 0, mashed: 1, soft: 2, finger: 3 };
    const current = stageIdx[tex.currentStage] ?? 1;
    const expected = _expectedTextureStage(ageAt().months);
    const gap = expected - current;
    if (gap <= 0) texVal = 100;
    else if (gap === 1) texVal = 60;
    else texVal = 30;
  }
  factors.push({ name: 'Texture progression', value: texVal, weight: 0.25 });

  _modifierCache.diet = _buildModifier(factors);
  return _modifierCache.diet;
}

// ── Sleep Modifier ──
let _computingSleepMod = false;
function computeSleepModifier() {
  if (_modifierCache.sleep) return _modifierCache.sleep;
  // Recursion guard: computeSleepRegression() calls getDailySleepScore() which calls us
  if (_computingSleepMod) return _neutralModifier();
  const nightCount = sleepData ? sleepData.filter(s => s.type === 'night').length : 0;
  if (nightCount < 5) { _modifierCache.sleep = _neutralModifier(); return _modifierCache.sleep; }

  _computingSleepMod = true;
  try {

  const factors = [];

  // 1. Bedtime consistency (30%) — use driftPerWeek and direction
  const drift = computeBedtimeDrift();
  let bedtimeVal = 70;
  if (drift && !drift.insufficient) {
    const absDrift = Math.abs(drift.driftPerWeek);
    if (drift.direction === 'stable') bedtimeVal = 100;
    else if (absDrift <= 5) bedtimeVal = 85;
    else if (absDrift <= 10) bedtimeVal = 65;
    else if (absDrift <= 20) bedtimeVal = 45;
    else bedtimeVal = 25;
  }
  factors.push({ name: 'Bedtime consistency', value: bedtimeVal, weight: 0.30 });

  // 2. Sleep efficiency trend (25%)
  const eff = computeSleepEfficiency();
  let effVal = 70;
  if (eff && !eff.insufficient) {
    if (eff.trend === 'improving') effVal = 90;
    else if (eff.trend === 'stable') effVal = 70;
    else if (eff.trend === 'declining') effVal = 40;
  }
  factors.push({ name: 'Sleep efficiency', value: effVal, weight: 0.25 });

  // 3. Regression status (25%) — severity field: none/mild/moderate/severe
  const reg = computeSleepRegression();
  let regVal = 80;
  if (reg && !reg.insufficient) {
    if (reg.severity === 'none') regVal = 80;
    else if (reg.severity === 'mild') regVal = 55;
    else if (reg.severity === 'moderate') regVal = 35;
    else if (reg.severity === 'severe') regVal = 25;
  }
  factors.push({ name: 'Regression status', value: regVal, weight: 0.25 });

  // 4. Wake window adherence (20%) — derive from overtired/undertired counts
  const ww = computeWakeWindows();
  let wwVal = 70;
  if (ww && !ww.insufficient && ww.allWindows && ww.allWindows.length > 0) {
    const total = ww.allWindows.length;
    const inRange = total - (ww.overtiredCount || 0) - (ww.undertiredCount || 0);
    const adherence = Math.round((inRange / total) * 100);
    wwVal = adherence >= 80 ? 100 : adherence >= 50 ? 70 : 40;
  }
  factors.push({ name: 'Wake windows', value: wwVal, weight: 0.20 });

  _modifierCache.sleep = _buildModifier(factors);
  return _modifierCache.sleep;

  } finally { _computingSleepMod = false; }
}

// ── Poop Modifier ──
function computePoopModifier() {
  if (_modifierCache.poop) return _modifierCache.poop;
  const poopDays = new Set((poopData || []).map(p => p.date).filter(Boolean)).size;
  if (poopDays < 7) { _modifierCache.poop = _neutralModifier(); return _modifierCache.poop; }

  const factors = [];

  // 1. Consistency trend (35%) — trend: stable/firming/loosening/mixed
  const ct = computeConsistencyTrend(14);
  let ctVal = 70;
  if (ct && !ct.insufficient) {
    if (ct.trend === 'stable') ctVal = 100;
    else if (ct.trend === 'firming') ctVal = 80;
    else if (ct.trend === 'mixed') ctVal = 60;
    else if (ct.trend === 'loosening') ctVal = 40;
  }
  factors.push({ name: 'Consistency trend', value: ctVal, weight: 0.35 });

  // 2. Frequency regularity (25%) — std dev from computeConsistencyTrend data
  let freqVal = 70;
  if (ct && !ct.insufficient && ct.dailyScores && ct.dailyScores.length >= 5) {
    const counts = {};
    (poopData || []).forEach(p => { if (p.date) counts[p.date] = (counts[p.date] || 0) + 1; });
    const last14 = ct.dailyScores.map(d => counts[d.dateStr] || 0);
    const mean = last14.reduce((s, v) => s + v, 0) / last14.length;
    const stdDev = Math.sqrt(last14.reduce((s, v) => s + (v - mean) * (v - mean), 0) / last14.length);
    if (stdDev < 0.5) freqVal = 100;
    else if (stdDev < 1.0) freqVal = 80;
    else if (stdDev < 1.5) freqVal = 60;
    else freqVal = 40;
  }
  factors.push({ name: 'Frequency regularity', value: freqVal, weight: 0.25 });

  // 3. Symptom-free streak (20%)
  let symVal = 100;
  const sortedPoops = (poopData || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  let daysSinceSymptom = 999;
  for (const p of sortedPoops) {
    if (p.blood || p.mucus) {
      daysSinceSymptom = Math.max(0, Math.floor((new Date() - new Date(p.date)) / 86400000));
      break;
    }
  }
  if (daysSinceSymptom >= 14) symVal = 100;
  else if (daysSinceSymptom >= 7) symVal = 80;
  else if (daysSinceSymptom >= 3) symVal = 55;
  else symVal = 30;
  factors.push({ name: 'Symptom-free', value: symVal, weight: 0.20 });

  // 4. Food-poop correlation triggers (20%)
  let trigVal = 80;
  const corr = computeFoodPoopCorrelations();
  if (corr && corr.results && corr.results.length > 0) {
    // Only consider moderate+ confidence with 5+ occurrences
    const triggers = corr.results.filter(r =>
      (r.confidence === 'moderate' || r.confidence === 'high') && r.totalOccurrences >= 5
    );
    if (triggers.length > 0) {
      // Check if any trigger food was eaten today
      const todayFoods = extractDayFoods(today());
      const triggerNames = new Set(triggers.map(t => t.food));
      const eatenTrigger = todayFoods.some(f => triggerNames.has(f));
      trigVal = eatenTrigger ? 40 : 80;
    }
  }
  factors.push({ name: 'Trigger foods', value: trigVal, weight: 0.20 });

  _modifierCache.poop = _buildModifier(factors);
  return _modifierCache.poop;
}

// ── Medical Modifier ──
function computeMedicalModifier() {
  if (_modifierCache.medical) return _modifierCache.medical;
  // Need 14 days of any medical data
  const medDays = Object.keys(medChecks || {}).filter(d => d !== '_trackingSince').length;
  const growthDays = (growthData || []).length;
  const vaccDays = (vaccData || []).length;
  if (medDays + growthDays + vaccDays < 3) { _modifierCache.medical = _neutralModifier(); return _modifierCache.medical; }

  const factors = [];

  // 1. Supplement consistency (30%)
  const supp = computeSupplementAdherence(30);
  let suppVal = 70;
  if (supp && supp.length > 0) {
    const primary = supp[0];
    const rate = primary.adherenceRate;
    if (rate >= 90) suppVal = 100;
    else if (rate >= 70) suppVal = 80;
    else if (rate >= 50) suppVal = 55;
    else suppVal = 30;
  }
  factors.push({ name: 'Supplement consistency', value: suppVal, weight: 0.30 });

  // 2. Growth velocity (30%)
  const gv = computeGrowthVelocity();
  let gvVal = 70;
  if (gv && !gv.insufficient) {
    const wStatus = gv.weight ? gv.weight.status : null;
    const hStatus = gv.height ? gv.height.status : null;
    const status = wStatus || hStatus;
    if (status === 'on-track') gvVal = 90;
    else if (status === 'fast') gvVal = 70;
    else if (status === 'slow') gvVal = 50;
    else if (status === 'plateau') gvVal = 25;
  }
  factors.push({ name: 'Growth velocity', value: gvVal, weight: 0.30 });

  // 3. Illness recovery (20%)
  const episodes = _getAllEpisodes();
  let illVal = 85;
  if (episodes.length > 0) {
    const active = episodes.filter(e => e.status === 'active');
    if (active.length > 0) {
      illVal = 40;
    } else {
      // Check for recently resolved (within 5 days)
      const recent = episodes.filter(e => {
        if (e.status !== 'resolved' || !e.resolvedAt) return false;
        return Math.floor((new Date() - new Date(e.resolvedAt)) / 86400000) < 5;
      });
      if (recent.length > 0) illVal = 65;
    }
  }
  factors.push({ name: 'Illness recovery', value: illVal, weight: 0.20 });

  // 4. Vaccination timeliness (20%)
  let vaccVal = 70;
  if (vaccData && vaccData.length > 0) {
    const due = vaccData.filter(v => v.upcoming);
    const given = vaccData.filter(v => !v.upcoming && v.date);
    if (due.length === 0 && given.length > 0) vaccVal = 100;
    else if (due.length > 0) {
      // Check if any are overdue
      const overdue = due.filter(v => {
        if (!v.dueDate) return false;
        return Math.floor((new Date() - new Date(v.dueDate)) / 86400000) > 28;
      });
      if (overdue.length > 0) vaccVal = 40;
      else {
        const slightlyLate = due.filter(v => {
          if (!v.dueDate) return false;
          return Math.floor((new Date() - new Date(v.dueDate)) / 86400000) > 14;
        });
        vaccVal = slightlyLate.length > 0 ? 80 : 100;
      }
    }
  }
  factors.push({ name: 'Vaccination timeliness', value: vaccVal, weight: 0.20 });

  _modifierCache.medical = _buildModifier(factors);
  return _modifierCache.medical;
}

// ── Milestone Modifier ──
function computeMilestoneModifier() {
  if (_modifierCache.milestones) return _modifierCache.milestones;
  // Need 7 days of activity log
  let actDays = 0;
  const now14 = new Date();
  for (let d = 0; d < 14; d++) {
    const dt = new Date(now14); dt.setDate(dt.getDate() - d);
    const ds = toDateStr(dt);
    if (Array.isArray(activityLog[ds]) && activityLog[ds].length > 0) actDays++;
  }
  if (Object.keys(activityLog || {}).length < 7 && actDays < 3) {
    _modifierCache.milestones = _neutralModifier();
    return _modifierCache.milestones;
  }

  const factors = [];

  // 1. Domain balance (30%) — how many of 4 domains have evidence in last 14d
  const domainRecent = {};
  for (let d = 0; d < 14; d++) {
    const dt = new Date(); dt.setDate(dt.getDate() - d);
    const ds = toDateStr(dt);
    if (Array.isArray(activityLog[ds])) {
      activityLog[ds].forEach(e => {
        (e.domains || []).forEach(dom => { domainRecent[dom] = true; });
      });
    }
  }
  const domainsActive = ['motor', 'language', 'social', 'cognitive'].filter(c => domainRecent[c]).length;
  let domVal = domainsActive === 4 ? 100 : domainsActive === 3 ? 80 : domainsActive === 2 ? 55 : domainsActive === 1 ? 35 : 20;
  factors.push({ name: 'Domain balance', value: domVal, weight: 0.30 });

  // 2. Milestone velocity (25%) — milestones with recent status progression
  let progressing = 0;
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  (milestones || []).forEach(m => {
    const dates = ['emergingAt', 'practicingAt', 'consistentAt', 'masteredAt']
      .map(f => m[f] ? new Date(m[f]) : null)
      .filter(Boolean);
    if (dates.some(d => d >= twoWeeksAgo)) progressing++;
  });
  let velVal = progressing >= 2 ? 100 : progressing >= 1 ? 75 : 30;
  factors.push({ name: 'Milestone velocity', value: velVal, weight: 0.25 });

  // 3. Activity consistency (25%)
  let actConsVal = actDays >= 5 ? 100 : actDays >= 3 ? 75 : actDays >= 1 ? 50 : 20;
  factors.push({ name: 'Activity consistency', value: actConsVal, weight: 0.25 });

  // 4. Regression-free (20%) — check for milestones that reached consistent/mastered but have stale evidence
  let regressionCount = 0;
  (milestones || []).forEach(m => {
    if (!['consistent', 'mastered'].includes(m.status)) return;
    // Check if last evidence is stale (>21 days ago)
    const lastEvDate = m.lastSeen || m.consistentAt || m.masteredAt;
    if (!lastEvDate) return;
    const daysSince = Math.ceil((new Date() - new Date(lastEvDate)) / 86400000);
    if (daysSince > 21) regressionCount++;
  });
  let regFreeVal = regressionCount === 0 ? 85 : regressionCount === 1 ? 55 : 30;
  factors.push({ name: 'Regression-free', value: regFreeVal, weight: 0.20 });

  _modifierCache.milestones = _buildModifier(factors);
  return _modifierCache.milestones;
}

// ── DIET SCORE ──

function calcDietScore(dateStr) {
  dateStr = dateStr || today();
  const entry = feedingData[dateStr];

  // A. Meal Completeness (30%) — intake-weighted
  let intakeSum = 0;
  if (entry) {
    ['breakfast','lunch','dinner'].forEach(m => {
      if (isRealMeal(entry[m])) {
        intakeSum += _miGetIntake(dateStr, m);
      }
    });
  }
  // Intake-weighted: sum of intake fractions for 3 core meals / 3
  const mealScore = Math.round((intakeSum / 3) * 100);

  // B. Food Variety (30%) — 7d rolling
  const vs = computeVarietyScore(7);
  const varietyScore = vs.target > 0 ? Math.min(Math.round((vs.uniqueFoods / vs.target) * 100), 100) : 0;

  // C. Food Group Coverage (20%) — 7d rolling
  const groupScore = vs.groupsTotal > 0 ? Math.round((vs.groupsHit / vs.groupsTotal) * 100) : 0;

  // D. Nutrient Balance (20%) — 7d rolling
  const baselines = computeBaselines();
  const nutrients = baselines.nutrientDays || {};
  const covered = KEY_NUTRIENTS.filter(n => (nutrients[n] || 0) >= 1).length;
  const nutrientScore = Math.round((covered / KEY_NUTRIENTS.length) * 100);

  const baseScore = Math.round(mealScore * 0.30 + varietyScore * 0.30 + groupScore * 0.20 + nutrientScore * 0.20);
  var coreMeals = 0;
  if (entry) { ['breakfast','lunch','dinner'].forEach(function(m) { if (isRealMeal(entry[m])) coreMeals++; }); }
  const modRaw = computeDietModifier();
  let score = applyIntelligenceModifier(baseScore, modRaw);
  // Post-vaccination buffer: don't penalize reduced appetite
  if (_isPostVaccWindow()) score = Math.min(100, score + POST_VACC_DIET_BUFFER);
  const modifier = _withDelta(modRaw, baseScore, score);
  return {
    score, baseScore, modifier, ...getScoreLabel(score),
    components: { meals: mealScore, variety: varietyScore, groups: groupScore, nutrients: nutrientScore },
    detail: {
      mealsLogged: coreMeals, mealsTotal: 3,
      uniqueFoods: vs.uniqueFoods, varietyTarget: vs.target,
      groupsHit: vs.groupsHit, groupsTotal: vs.groupsTotal,
      nutrientsCovered: covered, nutrientsTotal: KEY_NUTRIENTS.length,
      effectiveIntake: coreMeals > 0 ? Math.round((intakeSum / coreMeals) * 100) : null
    }
  };
}

// ── POOP SCORE ──

const CONSISTENCY_SCORES = { soft: 100, normal: 100, loose: 70, hard: 50, watery: 40, pellet: 30 };
const SAFE_POOP_COLORS = ['brown', 'yellow', 'green', 'tan', 'orange', 'mustard'];

function calcPoopScore(dateStr) {
  dateStr = dateStr || today();
  const dayPoops = getPoopsForDate(dateStr);

  if (dayPoops.length === 0) {
    // Carry forward from last known poop
    return _carryForwardPoopScore(dateStr);
  }

  // A. Consistency (40%) — use worst
  let worstConScore = 100;
  dayPoops.forEach(p => {
    const cs = CONSISTENCY_SCORES[p.consistency] ?? 80;
    if (cs < worstConScore) worstConScore = cs;
  });

  // B. Frequency vs baseline (30%)
  const baselines = computeBaselines();
  const baselineFreq = baselines.poopPerDay || 1.0;
  const todayCount = dayPoops.length;
  let freqScore = 100;
  const deviation = Math.abs(todayCount - baselineFreq);
  if (todayCount > baselineFreq * 3) freqScore = 40; // possible diarrhoea
  else freqScore = Math.max(0, Math.round(100 - deviation * 20));

  // C. Color safety (20%)
  let colorScore = 100;
  dayPoops.forEach(p => {
    if (p.color && ['red', 'black', 'white'].includes(p.color)) colorScore = 0;
    else if (p.color && !SAFE_POOP_COLORS.includes(p.color) && colorScore > 0) colorScore = 80;
  });

  // D. Symptom absence (10%)
  let symptomScore = 100;
  dayPoops.forEach(p => {
    if (p.blood) symptomScore = 0;
    else if (p.mucus && symptomScore > 0) symptomScore = 50;
  });

  const worstCon = dayPoops.reduce((w, p) => {
    const cs = CONSISTENCY_SCORES[p.consistency] ?? 80;
    return cs < (CONSISTENCY_SCORES[w] ?? 80) ? (p.consistency || w) : w;
  }, 'soft');

  const baseScore = Math.round(worstConScore * 0.40 + freqScore * 0.30 + colorScore * 0.20 + symptomScore * 0.10);
  const modRaw = computePoopModifier();
  _lastPoopModifier = modRaw;
  const score = applyIntelligenceModifier(baseScore, modRaw);
  const modifier = _withDelta(modRaw, baseScore, score);
  return {
    score, baseScore, modifier, ...getScoreLabel(score), isCarryForward: false,
    components: { consistency: worstConScore, frequency: freqScore, color: colorScore, symptoms: symptomScore },
    detail: {
      poopCount: todayCount, baselineFreq: +baselineFreq.toFixed(1),
      worstConsistency: worstCon,
      colors: [...new Set(dayPoops.map(p => p.color).filter(Boolean))],
      hasBlood: dayPoops.some(p => p.blood), hasMucus: dayPoops.some(p => p.mucus)
    }
  };
}

function _carryForwardPoopScore(dateStr) {
  // Find last poop entry
  const last = getLastPoop();
  if (!last || !last.date) {
    return { score: 50, baseScore: 50, modifier: _lastPoopModifier, ...getScoreLabel(50), isCarryForward: true, components: { consistency: 50, frequency: 50, color: 100, symptoms: 100 } };
  }
  const lastScore = calcPoopScore(last.date);
  if (lastScore.isCarryForward) {
    // Don't recurse infinitely — use the base score
    return { ...lastScore, isCarryForward: true, modifier: _lastPoopModifier };
  }
  const daysSince = Math.floor((new Date(dateStr) - new Date(last.date)) / 86400000);
  const decay = Math.min(daysSince * 2, 60); // max 60 pts decay
  const decayed = Math.max(40, lastScore.score - decay);
  return { score: decayed, baseScore: lastScore.baseScore || lastScore.score, modifier: _lastPoopModifier, ...getScoreLabel(decayed), isCarryForward: true, staleDays: daysSince, components: lastScore.components };
}

// ── MEDICAL SCORE ──

function calcMedicalScore() {
  const mo = (new Date() - DOB) / (30.44 * 86400000);

  // A. Vaccination coverage (40%)
  const ageMap = { 'Birth':0, '6 weeks':1.5, '10 weeks':2.5, '14 weeks':3.5, '6 months':6, '7 months':7,
    '9 months':9, '12 months':12, '15 months':15, '16-18 months':16, '18 months':18, '2 years':24 };
  const dueNow = VACC_SCHEDULE.filter(v => (ageMap[v.age] ?? 99) <= mo + 0.5);
  const givenNames = new Set(vaccData.filter(v => !v.upcoming).map(v => normVacc(v.name)));
  const vaccBookedData = load(KEYS.vaccBooked, null);
  let vaccGiven = 0;
  dueNow.forEach(v => {
    if (givenNames.has(normVacc(v.name))) {
      vaccGiven++;
    } else if (vaccBookedData && normVacc(vaccBookedData.vaccName) === normVacc(v.name)) {
      vaccGiven += 0.85; // booked but not yet given — mostly credited
    }
  });
  const vaccScore = dueNow.length > 0 ? Math.round((vaccGiven / dueNow.length) * 100) : 100;

  // B. Supplement adherence 7d (25%)
  const activeMeds = (meds || []).filter(m => m.active !== false);
  let suppScore = 100;
  if (activeMeds.length > 0) {
    let daysChecked = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      const dayChecks = medChecks[ds];
      if (dayChecks) {
        const anyDone = Object.values(dayChecks).some(v => typeof v === 'string' && v.startsWith('done'));
        if (anyDone) daysChecked++;
      }
    }
    suppScore = Math.round((daysChecked / 7) * 100);
  }

  // C. Growth tracking (20%)
  let growthScore = 0;
  if (growthData.length > 0) {
    const lastEntry = growthData[growthData.length - 1];
    const daysSince = Math.floor((new Date() - new Date(lastEntry.date)) / 86400000);
    if (daysSince <= 14) growthScore = 100;
    else if (daysSince <= 21) growthScore = 80;
    else if (daysSince <= 30) growthScore = 50;
    else growthScore = 20;
    // Bonus for both weight + height
    if (lastEntry.wt && lastEntry.ht && daysSince <= 14) growthScore = Math.min(100, growthScore + 10);
  }

  // D. Doctor visit currency (15%)
  let visitScore = 100;
  const DEV_MONTHS = [6, 9, 12, 15, 18];
  for (const dm of DEV_MONTHS) {
    const dueDate = new Date(DOB);
    dueDate.setMonth(dueDate.getMonth() + dm);
    const daysToDue = Math.floor((dueDate - new Date()) / 86400000);
    if (daysToDue <= 14 && daysToDue >= -30) {
      // This checkup is current or recently due
      const hasVisit = (visits || []).some(v => {
        if (!v.date) return false;
        return Math.abs(Math.floor((new Date(v.date) - dueDate) / 86400000)) <= 21;
      });
      if (hasVisit) { visitScore = 100; break; }
      // Check if vaccination appointment is booked (often doubles as checkup)
      const vbd = load(KEYS.vaccBooked, null);
      if (vbd && vbd.apptDate) { visitScore = 85; break; }
      if (daysToDue >= 0) { visitScore = 90; break; } // upcoming, not yet due
      if (daysToDue >= -14) { visitScore = 70; break; }
      visitScore = 40; break;
    }
  }

  const daysSinceGrowth = growthData.length > 0 ? Math.floor((new Date() - new Date(growthData[growthData.length-1].date)) / 86400000) : null;

  const baseScore = Math.round(vaccScore * 0.40 + suppScore * 0.25 + growthScore * 0.20 + visitScore * 0.15);
  const modRaw = computeMedicalModifier();
  const score = applyIntelligenceModifier(baseScore, modRaw);
  const modifier = _withDelta(modRaw, baseScore, score);
  return {
    score, baseScore, modifier, ...getScoreLabel(score),
    components: { vaccination: vaccScore, supplements: suppScore, growth: growthScore, visits: visitScore },
    detail: {
      vaccGiven: vaccGiven, vaccDue: dueNow.length,
      suppDays: activeMeds.length > 0 ? Math.round(suppScore / 100 * 7) : null, suppTotal: 7,
      daysSinceGrowth: daysSinceGrowth,
      hasBothMeasures: growthData.length > 0 && !!(growthData[growthData.length-1].wt && growthData[growthData.length-1].ht)
    }
  };
}

// ── MILESTONE SCORE ──

function calcMilestoneScore() {
  const ageM = ageAt().months;
  const ageMo = Math.floor(ageM);

  // A. Evidence-based completion (35%) — auto-status of age-appropriate milestones
  const brackets = Object.keys(getUpcomingMilestones()).map(Number).sort((a, b) => a - b);
  let expectedItems = [];
  brackets.forEach(br => {
    if (br <= ageMo) {
      const items = getUpcomingMilestones()[br] || [];
      expectedItems = expectedItems.concat(items.filter(it => !it.advanced));
    }
  });
  const msPctMap = {};
  milestones.forEach(m => { msPctMap[m.text.toLowerCase().trim()] = MS_STAGE_META[m.status]?.pct || 0; });
  let expectedProgress = 0;
  let expectedMatchCount = 0;
  expectedItems.forEach(it => {
    const keywords = it.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    let bestPct = 0;
    Object.entries(msPctMap).forEach(([text, pct]) => {
      if (keywords.some(kw => text.includes(kw)) && pct > bestPct) bestPct = pct;
    });
    expectedProgress += bestPct;
    if (bestPct >= 100) expectedMatchCount++;
  });
  const completionRate = expectedItems.length > 0 ? expectedProgress / (expectedItems.length * 100) : 1;
  const completionScore = Math.round(Math.min(completionRate, 1) * 100);

  // B. Category coverage (20%) — all 4 domains have recent evidence
  const categories = ['motor', 'language', 'social', 'cognitive'];
  const hasActivityLog = Object.keys(activityLog).length > 0;

  let catProgressSum = 0;
  if (hasActivityLog) {
    // Evidence-driven: check for recent activity log evidence per domain
    const now14 = new Date();
    const domainRecent = {};
    for (let d = 0; d < 14; d++) {
      const dt = new Date(now14);
      dt.setDate(dt.getDate() - d);
      const ds = toDateStr(dt);
      if (Array.isArray(activityLog[ds])) {
        activityLog[ds].forEach(e => {
          (e.domains || []).forEach(dom => { domainRecent[dom] = (domainRecent[dom] || 0) + 1; });
        });
      }
    }
    categories.forEach(cat => {
      if (domainRecent[cat] > 0) catProgressSum += 1;
    });
  } else {
    // Fallback: milestone presence
    categories.forEach(cat => {
      const catMs = milestones.filter(m => m.cat === cat);
      if (catMs.length > 0 && catMs.some(m => (MS_STAGE_META[m.status]?.pct || 0) > 0)) catProgressSum += 1;
    });
  }
  const catScore = Math.round((catProgressSum / categories.length) * 100);

  // C. Activity engagement (20%) — distinct activity days in last 14 days
  let activityDays14d = 0;
  const now14c = new Date();
  for (let d = 0; d < 14; d++) {
    const dt = new Date(now14c);
    dt.setDate(dt.getDate() - d);
    const ds = toDateStr(dt);
    if (Array.isArray(activityLog[ds]) && activityLog[ds].length > 0) activityDays14d++;
  }

  let trackingScore;
  if (hasActivityLog) {
    // Pure activity engagement scoring
    trackingScore = activityDays14d >= 7 ? 100 : activityDays14d >= 5 ? 85 : activityDays14d >= 3 ? 70 : activityDays14d >= 1 ? 50 : 20;
  } else {
    // Legacy: milestone status activity
    const activeCount = milestones.filter(m => ['emerging','practicing','consistent'].includes(m.status)).length;
    const recentMastered = milestones.filter(m => {
      if (m.status !== 'mastered' || !m.masteredAt) return false;
      return (new Date() - new Date(m.masteredAt)) / 86400000 <= 14;
    }).length;
    if (activeCount >= 2 && recentMastered >= 1) trackingScore = 100;
    else if (activeCount >= 1 || recentMastered >= 1) trackingScore = 75;
    else if (milestones.filter(m => m.status === 'mastered').length > 0) trackingScore = 50;
    else trackingScore = 20;
  }

  // D. Evidence recency (15%) — how recent is the latest evidence
  let lastActivity = null;
  milestones.forEach(m => {
    ['masteredAt','consistentAt','practicingAt','emergingAt'].forEach(field => {
      if (m[field] && (!lastActivity || new Date(m[field]) > lastActivity)) lastActivity = new Date(m[field]);
    });
  });
  Object.entries(activityLog).forEach(([dateStr, entries]) => {
    if (Array.isArray(entries) && entries.length > 0) {
      const d = new Date(dateStr);
      if (!lastActivity || d > lastActivity) lastActivity = d;
    }
  });
  let recencyScore = 30;
  if (lastActivity) {
    const daysSince = Math.floor((new Date() - lastActivity) / 86400000);
    if (daysSince <= 2) recencyScore = 100;
    else if (daysSince <= 5) recencyScore = 85;
    else if (daysSince <= 10) recencyScore = 65;
    else if (daysSince <= 21) recencyScore = 45;
    else if (daysSince <= 30) recencyScore = 35;
  }

  // E. Advanced milestones bonus (10%)
  const advancedDone = milestones.filter(m => m.advanced && (m.status === 'mastered' || m.status === 'consistent')).length;
  const advancedScore = advancedDone >= 3 ? 100 : advancedDone >= 2 ? 80 : advancedDone >= 1 ? 60 : 30;

  const baseScore = Math.round(
    completionScore * 0.35 +
    catScore * 0.20 +
    trackingScore * 0.20 +
    recencyScore * 0.15 +
    advancedScore * 0.10
  );

  const inProgress = milestones.filter(m => ['emerging','practicing','consistent'].includes(m.status)).length;
  const modRaw = computeMilestoneModifier();
  const score = applyIntelligenceModifier(baseScore, modRaw);
  const modifier = _withDelta(modRaw, baseScore, score);
  return {
    score, baseScore, modifier, ...getScoreLabel(score),
    components: { completion: completionScore, categories: catScore, tracking: trackingScore, recency: recencyScore, advanced: advancedScore },
    detail: { expectedTotal: expectedItems.length, expectedDone: expectedMatchCount, catsActive: catProgressSum, inProgress, advancedDone }
  };
}

// ── ZIVA SCORE (holistic) ──

let _lastKnownScores = { sleep: null, diet: null, poop: null, medical: null, milestones: null };

function getSleepScore24h() {
  // Night sleep is logged under the bedtime date (yesterday).
  // Today's sleep score = yesterday's daily score (which includes last night + yesterday's naps).
  // If yesterday has no data, try today (in case sleep was logged under today's date).
  const todayStr = today();
  const yesterday = new Date(todayStr);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  const yesterdayScore = getDailySleepScore(yesterdayStr);
  if (yesterdayScore) return yesterdayScore;

  const todayScore = getDailySleepScore(todayStr);
  if (todayScore) return todayScore;

  return null;
}

function calcZivaScore(dateStr) {
  dateStr = dateStr || today();
  // Use 24h rolling for today's live score, fall back to date-keyed for historical
  const sleepRaw = dateStr === today() ? getSleepScore24h() : getDailySleepScore(dateStr);
  const sleepScore = sleepRaw ? sleepRaw.score : null;
  const dietResult = calcDietScore(dateStr);
  const poopResult = calcPoopScore(dateStr);
  const medResult = calcMedicalScore();
  const msResult = calcMilestoneScore();

  // Weights: sleep 25% + diet 25% + poop 20% + medical 15% + milestones 15%
  const domains = {
    sleep:      { score: sleepScore, weight: 0.25, isStale: false, staleDays: 0, result: sleepRaw },
    diet:       { score: dietResult.score, weight: 0.25, isStale: false, staleDays: 0, result: dietResult },
    poop:       { score: poopResult.score, weight: 0.20, isStale: poopResult.isCarryForward, staleDays: poopResult.staleDays || 0, result: poopResult },
    medical:    { score: medResult.score, weight: 0.15, isStale: false, staleDays: 0, result: medResult },
    milestones: { score: msResult.score, weight: 0.15, isStale: false, staleDays: 0, result: msResult },
  };

  // Handle missing data with carry-forward + decay
  Object.keys(domains).forEach(key => {
    const d = domains[key];
    if (d.score === null || d.score === undefined) {
      // Try carry forward
      if (_lastKnownScores[key] !== null) {
        d.score = Math.max(40, _lastKnownScores[key] - 2);
        d.isStale = true;
        d.staleDays = 1;
      }
    } else {
      _lastKnownScores[key] = d.score;
    }
  });

  // Compute weighted score — only include domains with data
  let totalWeight = 0;
  let weightedSum = 0;
  let dataCompleteness = 0;
  Object.values(domains).forEach(d => {
    if (d.score !== null && d.score !== undefined) {
      weightedSum += d.score * d.weight;
      totalWeight += d.weight;
      dataCompleteness++;
    }
  });

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null;
  if (score === null) return { score: null, domains, dataCompleteness };

  return {
    score, ...getScoreLabel(score),
    domains, dataCompleteness,
    trend: null // filled by getZivaScoreTrend7d
  };
}

function getZivaScoreTrend7d() {
  let current = 0, currentCount = 0;
  let previous = 0, previousCount = 0;
  const todayDate = new Date(today());
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate); d.setDate(d.getDate() - i);
    const zs = calcZivaScore(toDateStr(d));
    if (zs.score !== null) { current += zs.score; currentCount++; }
  }
  for (let i = 7; i < 14; i++) {
    const d = new Date(todayDate); d.setDate(d.getDate() - i);
    const zs = calcZivaScore(toDateStr(d));
    if (zs.score !== null) { previous += zs.score; previousCount++; }
  }
  const avg7d = currentCount > 0 ? Math.round(current / currentCount) : null;
  const avgPrev = previousCount > 0 ? Math.round(previous / previousCount) : null;
  if (avg7d === null) return { avg7d: null, avgPrev: null, direction: 'stable', delta: 0 };
  const delta = avgPrev !== null ? avg7d - avgPrev : 0;
  const direction = delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable';
  return { avg7d, avgPrev, direction, delta };
}
// ─────────────────────────────────────────

// NOTES
// ─────────────────────────────────────────
let _noteFilter = 'all';
let _notePhotoPending = null;
let _noteVoicePending = null; // base64 audio
let _noteVoiceLabel = ''; // user-assigned label for voice note
// Voice note via system recorder — uses <input capture="user"> to open native app
function previewNoteVoice(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    _noteVoicePending = reader.result;
    renderNoteAttachments();
    updateNoteSaveBtn();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function renderNoteAttachments() {
  const area = document.getElementById('noteAttachments');
  if (!area) return;
  let html = '';
  if (_notePhotoPending) {
    html += `<div class="note-attach-preview">
      <img src="${_notePhotoPending}" alt="Photo">
      <button class="note-attach-del" data-action="clearNotePhoto" aria-label="Remove photo">×</button>
    </div>`;
  }
  if (_noteVoicePending) {
    html += `<div class="note-attach-preview" style="flex-direction:column;align-items:stretch;gap:var(--sp-4);">
      <div class="d-flex items-center gap-4">
        ${zi('camera')} <audio src="${_noteVoicePending}" controls style="flex:1;height:28px;"></audio>
        <button class="note-attach-del" data-action="clearNoteVoice" aria-label="Remove voice">×</button>
      </div>
      <input type="text" id="voiceLabelInput" placeholder="Label (e.g. Dr visit feedback)" value="${escAttr(_noteVoiceLabel)}" oninput="_noteVoiceLabel=this.value" style="padding:4px 8px;border-radius:var(--r-md);border:1.5px solid var(--peach-light);font-family:'Nunito',sans-serif;font-size:var(--fs-sm);background:var(--peach-light);color:var(--text);outline:none;">
    </div>`;
  }
  area.innerHTML = html;
  updateNoteSaveBtn();
}

function updateNoteSaveBtn() {
  const btn = document.getElementById('noteSaveBtn');
  if (!btn) return;
  const txt = document.getElementById('noteInput')?.value.trim();
  const hasContent = (txt && txt.length > 0) || _notePhotoPending || _noteVoicePending;
  btn.style.opacity = hasContent ? '1' : '0.4';
  btn.style.pointerEvents = hasContent ? 'auto' : 'none';
}

function previewNotePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      _notePhotoPending = canvas.toDataURL('image/jpeg', 0.8);
      renderNoteAttachments();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function clearNotePhoto() {
  _notePhotoPending = null;
  const input = document.getElementById('notePhotoInput');
  if (input) input.value = '';
  renderNoteAttachments();
}

function clearNoteVoice() {
  _noteVoicePending = null;
  _noteVoiceLabel = '';
  renderNoteAttachments();
}

function renderNotes(filterCat) {
  save(KEYS.notes, notes);
  const cat = filterCat || _noteFilter;
  _noteFilter = cat;
  const list = document.getElementById('notesList');
  const count = document.getElementById('notesCount');

  // Update filter button states
  document.querySelectorAll('.ncf-btn').forEach(b => b.classList.remove('active'));
  const filterBtns = document.querySelectorAll('.ncf-btn');
  filterBtns.forEach(b => {
    const btnCat = b.textContent.trim().toLowerCase().replace(/[^a-z]/g, '');
    if ((cat === 'all' && btnCat === 'all') ||
        (cat === 'general' && btnCat === 'general') ||
        (cat === 'diet' && btnCat === 'diet') ||
        (cat === 'medical' && btnCat === 'medical') ||
        (cat === 'milestone' && btnCat === 'milestone') ||
        (cat === 'growth' && btnCat === 'growth')) {
      b.classList.add('active');
    }
  });

  const active = notes.filter(n => !n.done).length;
  count.textContent = active > 0 ? `${active} active` : notes.length ? 'All done ✓' : '';
  list.innerHTML = '';

  const filtered = cat === 'all' ? notes : notes.filter(n => (n.category || 'general') === cat);

  if (filtered.length === 0) {
    list.innerHTML = `<div style="color:var(--light);font-size:var(--fs-base);padding:4px 0;">${cat === 'all' ? 'No notes yet — add observations, questions, memories.' : 'No ' + cat + ' notes yet.'}</div>`;
    return;
  }

  const catIcons = { general:zi('note'), diet:zi('bowl'), medical:zi('medical'), milestone:zi('star'), growth:zi('chart') };

  // show active first, then done
  const sorted = [...filtered].map((n,i) => {
    const origIdx = notes.indexOf(n);
    return {...n, _i:origIdx};
  }).sort((a,b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(b.ts) - new Date(a.ts);
  });

  sorted.forEach(n => {
    const noteCategory = n.category || 'general';
    const catIcon = catIcons[noteCategory] || zi('note');
    const div = document.createElement('div');
    div.className = 'note-item' + (n.done ? ' done' : '');
    div.innerHTML = `
      <div class="note-top">
        <div class="flex-1-min">
          <div class="note-text">${escHtml(n.text)}</div>
          ${n.photo ? `<div class="note-photo" data-action="openNotePhoto" data-arg="${n._i}"><img src="${n.photo}" alt="Note photo"></div>` : ''}
          ${n.voice ? `<div class="mt-6">${n.voiceLabel ? '<div class="t-sub" style="font-weight:600;margin-bottom:2px;">' + zi('camera') + ' ' + escHtml(n.voiceLabel) + '</div>' : ''}<audio src="${n.voice}" controls style="height:32px;max-width:100%;"></audio></div>` : ''}
          <div class="note-date">
            ${formatDate(n.ts.split('T')[0])} ${n.done ? '· Completed' : ''}
            ${n.photo ? zi('camera') + ' ' : ''}${n.voice ? zi('camera') + ' ' : ''}
            <span class="note-cat-badge ${noteCategory}">${catIcon} ${noteCategory}</span>
          </div>
        </div>
        <div class="note-actions">
          <button class="note-btn complete-btn" data-action="toggleNote" data-arg="${n._i}">${n.done ? '↩' : zi('check')}</button>
          <button class="note-btn del-note-btn" data-action="deleteNote" data-arg="${n._i}">&times;</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function filterNotes(cat) {
  _noteFilter = cat;
  // Update active button
  document.querySelectorAll('.ncf-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderNotes(cat);
}

function addNote() {
  const txt = document.getElementById('noteInput').value.trim();
  if (!txt && !_notePhotoPending && !_noteVoicePending) return;
  const category = document.getElementById('noteCatSelect').value;
  notes.push({
    text: txt,
    done: false,
    ts: new Date().toISOString(),
    category: category,
    photo: _notePhotoPending || null,
    voice: _noteVoicePending || null,
    voiceLabel: _noteVoiceLabel || null,
  });
  document.getElementById('noteInput').value = '';
  clearNotePhoto();
  clearNoteVoice();
  renderNoteAttachments();
  renderNotes();
}

function toggleNote(i) {
  notes[i].done = !notes[i].done;
  renderNotes();
}

function deleteNote(i) {
  confirmAction('Delete this note?', () => {
    notes.splice(i,1);
    renderNotes();
  });
}

function openNotePhoto(i) {
  const note = notes[i];
  if (!note || !note.photo) return;
  const lb = document.getElementById('avatarLightbox');
  document.getElementById('lbImage').src = note.photo;
  document.getElementById('lbSub').textContent = formatDate(note.ts.split('T')[0]) + ' · ' + (note.category || 'general');
  lb.querySelector('.lb-name').textContent = note.text ? note.text.slice(0, 50) : 'Photo note';
  lb.classList.add('open');
  history.pushState({ overlay: 'lightbox' }, '');
}

// ─────────────────────────────────────────
// SCRAPBOOK
// ─────────────────────────────────────────
let _scrapPhotoPending = null;

function renderScrapbook() {
  save(KEYS.scrapbook, scrapbook);
  const list = document.getElementById('scrapbookList');
  const count = document.getElementById('scrapbookCount');
  if (!list) return;

  count.textContent = scrapbook.length > 0 ? `${scrapbook.length} memor${scrapbook.length === 1 ? 'y' : 'ies'}` : '';
  list.innerHTML = '';

  if (scrapbook.length === 0) {
    list.innerHTML = '<div style="color:var(--light);font-size:var(--fs-base);padding:8px 0;text-align:center;">No memories yet — tap "Add a Memory" to start your scrapbook.</div>';
    return;
  }

  const sorted = [...scrapbook].sort((a, b) => new Date(b.date || b.ts) - new Date(a.date || a.ts));
  sorted.forEach((entry) => {
    const origIdx = scrapbook.indexOf(entry);
    const entryDate = entry.date || entry.ts.split('T')[0];
    const dateStr = formatDate(entryDate);
    const { months, days } = ageAtScrapDate(entry.date || entry.ts);
    const div = document.createElement('div');
    div.className = 'scrap-entry';
    div.innerHTML = `
      <div class="scrap-photo" data-action="openScrapPhoto" data-arg="${origIdx}">
        <img src="${entry.photo}" alt="${escHtml(entry.title || 'Memory')}">
      </div>
      <div class="scrap-body">
        <div class="scrap-title">${escHtml(entry.title || 'Untitled')}</div>
        ${entry.desc ? `<div class="scrap-desc">${escHtml(entry.desc)}</div>` : ''}
        <div class="scrap-meta">${dateStr} · ${months}m ${days}d old</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--sp-4);align-self:flex-start;flex-shrink:0;">
        <button class="note-btn" data-action="editScrapEntry" data-arg="${origIdx}" aria-label="Edit memory">Edit</button>
        <button class="note-btn del-note-btn" data-action="deleteScrapEntry" data-arg="${origIdx}" aria-label="Delete memory">&times;</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function ageAtScrapDate(dateOrTs) { return ageAt(dateOrTs); }

function previewScrapPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      _scrapPhotoPending = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById('scrapPhotoThumb').src = _scrapPhotoPending;
      document.getElementById('scrapPreviewArea').style.display = 'block';
      activateBtn('scrapSaveBtn', true);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function clearScrapPhoto() {
  _scrapPhotoPending = null;
  document.getElementById('scrapPreviewArea').style.display = 'none';
  document.getElementById('scrapPhotoInput').value = '';
  document.getElementById('scrapTitle').value = '';
  document.getElementById('scrapDesc').value = '';
  document.getElementById('scrapDate').value = today();
  activateBtn('scrapSaveBtn', false);
}

let _scrapEditIdx = null; // null = adding new, number = editing existing

function addScrapEntry() {
  const title = document.getElementById('scrapTitle').value.trim();
  const desc = document.getElementById('scrapDesc').value.trim();
  const date = document.getElementById('scrapDate').value;

  if (_scrapEditIdx !== null) {
    // Editing existing entry
    const entry = scrapbook[_scrapEditIdx];
    entry.title = title || 'Untitled';
    entry.desc = desc;
    entry.date = date || entry.date || today();
    if (_scrapPhotoPending) entry.photo = _scrapPhotoPending;
    cancelScrapEdit();
  } else {
    // Adding new
    if (!_scrapPhotoPending) return;
    scrapbook.push({
      photo: _scrapPhotoPending,
      title: title || 'Untitled',
      desc: desc,
      date: date || today(),
      ts: new Date().toISOString(),
    });
    clearScrapPhoto();
  }
  renderScrapbook();
}

function editScrapEntry(i) {
  const entry = scrapbook[i];
  if (!entry) return;
  _scrapEditIdx = i;

  // Show the form with existing data
  document.getElementById('scrapPreviewArea').style.display = 'block';
  document.getElementById('scrapPhotoThumb').src = entry.photo;
  document.getElementById('scrapTitle').value = entry.title || '';
  document.getElementById('scrapDesc').value = entry.desc || '';
  document.getElementById('scrapDate').value = entry.date || entry.ts.split('T')[0];
  _scrapPhotoPending = null; // only set if user picks a new photo

  // Update button text and show cancel
  document.getElementById('scrapSaveBtn').textContent = 'Update Memory';
  activateBtn('scrapSaveBtn', true);
  document.getElementById('scrapCancelEditBtn').style.display = '';

  // Scroll to form
  document.getElementById('scrapPreviewArea').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelScrapEdit() {
  _scrapEditIdx = null;
  clearScrapPhoto();
  document.getElementById('scrapSaveBtn').textContent = 'Save Memory';
  document.getElementById('scrapCancelEditBtn').style.display = 'none';
}

function deleteScrapEntry(i) {
  confirmAction('Delete this memory?', () => {
    scrapbook.splice(i, 1);
    if (_scrapEditIdx === i) cancelScrapEdit();
    else if (_scrapEditIdx !== null && _scrapEditIdx > i) _scrapEditIdx--;
    renderScrapbook();
  });
}

function openScrapPhoto(i) {
  const entry = scrapbook[i];
  if (!entry || !entry.photo) return;
  const lb = document.getElementById('avatarLightbox');
  document.getElementById('lbImage').src = entry.photo;
  const entryDate = entry.date || entry.ts.split('T')[0];
  const { months, days } = ageAtScrapDate(entryDate);
  document.getElementById('lbSub').textContent = `${formatDate(entryDate)} · ${months}m ${days}d old`;
  lb.querySelector('.lb-name').textContent = entry.title || 'Memory';
  lb.classList.add('open');
  history.pushState({ overlay: 'lightbox' }, '');
}

// ── Universal button activation ──
function activateBtn(btnId, hasContent) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (hasContent) {
    btn.classList.remove('disabled-state');
  } else {
    btn.classList.add('disabled-state');
  }
}

function escHtml(s) {
  if (typeof s !== 'string') s = s == null ? '' : String(s);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
function normVacc(n) { return n.toLowerCase().replace(/[^a-z0-9]/g, ''); }

// ─────────────────────────────────────────
// SHARED UTILITIES (migrated from feature modules → core)
// ─────────────────────────────────────────
function escAttr(s) { return s.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function ageAt(date) {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d)) return { months: 0, days: 0 };
  let months = d.getMonth() - DOB.getMonth() + (d.getFullYear() - DOB.getFullYear()) * 12;
  let days = d.getDate() - DOB.getDate();
  if (days < 0) {
    months--;
    const prev = new Date(d.getFullYear(), d.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) { months = 0; days = 0; }
  return { months, days };
}
function preciseAge() { return ageAt(); }
function getAgeInMonths() { return ageAt().months; }
function ageAtDate(dateStr) {
  const { months, days } = ageAt(dateStr);
  return `${months}m ${days}d`;
}
function daysBetween(d1, d2) {
  return Math.round(Math.abs(new Date(d2) - new Date(d1)) / 86400000);
}

function _offsetDateStr(baseDate, offsetDays) {
  var d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return toDateStr(d);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}
function formatTimeShort(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')}${suffix}`;
}

function _baseFoodName(name) {
  let base = name.toLowerCase().trim();
  // Strip leading quantity fractions and measurements
  base = base.replace(/^[½¼¾⅓⅔]\s*/, '');
  base = base.replace(/^[\d.]+\s*(g|ml|tsp|tbsp|cup|piece|pcs?|slice|nos?\.?)\s*/i, '');
  // Direct alias match first (before any stripping)
  if (_FOOD_ALIASES[base]) return _FOOD_ALIASES[base];
  // Strip parenthetical qualifiers: "(cow)", "(moringa)", "(lauki)", "(fruit)", etc.
  const withoutParen = base.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (_FOOD_ALIASES[withoutParen]) return _FOOD_ALIASES[withoutParen];
  // Strip form words
  let stripped = withoutParen;
  _FORM_WORDS.forEach(w => { stripped = stripped.replace(new RegExp('\\b' + w + '\\b', 'g'), ''); });
  stripped = stripped.replace(/\s+/g, ' ').trim();
  if (_FOOD_ALIASES[stripped]) return _FOOD_ALIASES[stripped];
  // Depluralize simple trailing 's'
  const singular = stripped.endsWith('s') && stripped.length > 3 ? stripped.slice(0, -1) : stripped;
  if (_FOOD_ALIASES[singular]) return _FOOD_ALIASES[singular];
  return stripped || withoutParen || base;
}
function normalizeFoodName(raw) { return _baseFoodName(raw || ''); }

const SKIPPED_MEAL = '—skipped—';
function isRealMeal(val) { return val && val !== SKIPPED_MEAL; }

// ─────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────
// ── Avatar: Crop + Lightbox ──
let _cropState = { imgSrc:null, x:0, y:0, zoom:100, dragging:false, startX:0, startY:0, imgW:0, imgH:0 };

function handleAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    _cropState.imgSrc = ev.target.result;
    openCropModal(ev.target.result);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function openCropModal(src) {
  const overlay = document.getElementById('cropOverlay');
  const img = document.getElementById('cropImage');
  const zoom = document.getElementById('cropZoom');

  img.onload = () => {
    _cropState.imgW = img.naturalWidth;
    _cropState.imgH = img.naturalHeight;
    // Base scale: LARGER dimension fits in 280px (so image is slightly smaller than circle)
    // Then default zoom at 120% so image overflows the circle on both axes, enabling drag
    const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
    _cropState.baseScale = 280 / maxDim;
    _cropState.zoom = 150; // Start at 150% so image overflows circle on both sides
    _cropState.x = 0;
    _cropState.y = 0;
    zoom.value = 150;
    zoom.min = 80;  // Allow zooming out to see more of the photo
    zoom.max = 350;
    updateCropPosition();
    overlay.classList.add('open');
    history.pushState({ overlay: 'crop' }, '');
  };
  img.src = src;

  // Touch/mouse drag handlers
  const container = document.getElementById('cropContainer');
  container.onpointerdown = startCropDrag;
  container.onpointermove = moveCropDrag;
  container.onpointerup = endCropDrag;
  container.onpointercancel = endCropDrag;
}

function updateCropZoom() {
  _cropState.zoom = parseInt(document.getElementById('cropZoom').value);
  updateCropPosition();
}

function updateCropPosition() {
  const img = document.getElementById('cropImage');
  // Actual scale = baseScale * (zoom/100)
  const scale = _cropState.baseScale * (_cropState.zoom / 100);
  const w = _cropState.imgW * scale;
  const h = _cropState.imgH * scale;

  // Clamp so image always covers the 280px circle
  const maxX = Math.max(0, (w - 280) / 2);
  const maxY = Math.max(0, (h - 280) / 2);
  _cropState.x = Math.max(-maxX, Math.min(maxX, _cropState.x));
  _cropState.y = Math.max(-maxY, Math.min(maxY, _cropState.y));

  img.style.width = w + 'px';
  img.style.height = h + 'px';
  img.style.left = ((280 - w) / 2 + _cropState.x) + 'px';
  img.style.top = ((280 - h) / 2 + _cropState.y) + 'px';
}

function startCropDrag(e) {
  e.preventDefault();
  const container = document.getElementById('cropContainer');
  container.setPointerCapture(e.pointerId);
  _cropState.pointers = _cropState.pointers || {};
  _cropState.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };

  const pIds = Object.keys(_cropState.pointers);
  if (pIds.length === 1) {
    // Single finger — start drag
    _cropState.dragging = true;
    _cropState.startX = e.clientX - _cropState.x;
    _cropState.startY = e.clientY - _cropState.y;
  } else if (pIds.length === 2) {
    // Two fingers — start pinch
    _cropState.dragging = false;
    const p = Object.values(_cropState.pointers);
    _cropState.pinchStartDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    _cropState.pinchStartZoom = _cropState.zoom;
  }
}

function moveCropDrag(e) {
  e.preventDefault();
  if (!_cropState.pointers) return;
  _cropState.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };

  const pIds = Object.keys(_cropState.pointers);
  if (pIds.length === 2) {
    // Pinch zoom
    const p = Object.values(_cropState.pointers);
    const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    const ratio = dist / _cropState.pinchStartDist;
    const newZoom = Math.round(Math.max(80, Math.min(350, _cropState.pinchStartZoom * ratio)));
    _cropState.zoom = newZoom;
    document.getElementById('cropZoom').value = newZoom;
    updateCropPosition();
  } else if (_cropState.dragging && pIds.length === 1) {
    // Single finger drag
    _cropState.x = e.clientX - _cropState.startX;
    _cropState.y = e.clientY - _cropState.startY;
    updateCropPosition();
  }
}

function endCropDrag(e) {
  if (_cropState.pointers) {
    delete _cropState.pointers[e.pointerId];
    if (Object.keys(_cropState.pointers).length === 0) {
      _cropState.dragging = false;
    } else if (Object.keys(_cropState.pointers).length === 1) {
      // One finger remaining after pinch — reset drag origin
      const remaining = Object.values(_cropState.pointers)[0];
      _cropState.dragging = true;
      _cropState.startX = remaining.x - _cropState.x;
      _cropState.startY = remaining.y - _cropState.y;
    }
  }
}

function saveCrop() {
  const img = document.getElementById('cropImage');
  const scale = _cropState.baseScale * (_cropState.zoom / 100);
  const w = _cropState.imgW * scale;
  const h = _cropState.imgH * scale;

  // Calculate crop region in original image coordinates
  const offsetX = (280 - w) / 2 + _cropState.x;
  const offsetY = (280 - h) / 2 + _cropState.y;
  const srcX = -offsetX / scale;
  const srcY = -offsetY / scale;
  const srcSize = 280 / scale;

  // Draw cropped square
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 200, 200);
  const croppedSrc = canvas.toDataURL('image/jpeg', 0.85);

  // Store full original (resized to max 800px for lightbox)
  const fullCanvas = document.createElement('canvas');
  const maxFull = 800;
  let fw = _cropState.imgW, fh = _cropState.imgH;
  if (fw > maxFull || fh > maxFull) {
    const ratio = Math.min(maxFull / fw, maxFull / fh);
    fw = Math.round(fw * ratio); fh = Math.round(fh * ratio);
  }
  fullCanvas.width = fw; fullCanvas.height = fh;
  fullCanvas.getContext('2d').drawImage(img, 0, 0, fw, fh);
  const fullSrc = fullCanvas.toDataURL('image/jpeg', 0.85);

  if (_tabAvatarCropMode && _currentTabForAvatar) {
    // Save to tab-specific avatar
    try {
      localStorage.setItem(getTabAvatarKey(_currentTabForAvatar), croppedSrc);
      localStorage.setItem(getTabAvatarFullKey(_currentTabForAvatar), fullSrc);
    } catch {}
    _tabAvatarCropMode = false;
    _currentTabForAvatar = null;
  } else {
    // Save as main avatar (Home tab)
    const el = document.getElementById('avatarEl');
    el.innerHTML = `<img src="${croppedSrc}" alt="Ziva">`;
    save(KEYS.avatar, croppedSrc);
    try { localStorage.setItem('ziva_avatar_full', fullSrc); } catch {}
  }

  closeCrop();
}

function closeCrop() {
  _cropState.pointers = {};
  _cropState.dragging = false;
  _tabAvatarCropMode = false;
  _currentTabForAvatar = null;
  const overlay = document.getElementById('cropOverlay');
  if (overlay.classList.contains('open')) {
    overlay.classList.remove('open');
    if (history.state?.overlay === 'crop') history.back();
  }
}

function openAvatarLightbox() {
  const full = localStorage.getItem('ziva_avatar_full');
  const thumb = load(KEYS.avatar, null);
  const src = full || thumb;
  if (!src) return; // no photo set, don't open lightbox

  const lb = document.getElementById('avatarLightbox');
  document.getElementById('lbImage').src = src;
  const { months, days } = preciseAge();
  document.getElementById('lbSub').textContent = `${months} months, ${days} days old`;
  lb.classList.add('open');
  history.pushState({ overlay: 'lightbox' }, '');
}

function closeAvatarLightbox() {
  const lb = document.getElementById('avatarLightbox');
  if (lb.classList.contains('open')) {
    lb.classList.remove('open');
    // Reset lightbox name back to default
    lb.querySelector('.lb-name').innerHTML = 'Ziva ' + zi('sprout');
    if (history.state?.overlay === 'lightbox') history.back();
  }
}

// ─────────────────────────────────────────
// PER-TAB AVATARS
// ─────────────────────────────────────────
let _currentTabForAvatar = null; // tracks which tab we're setting avatar for
let _tabAvatarCropMode = false;  // flag to route crop save to tab avatar

function getActiveTab() {
  const active = document.querySelector('.tab-panel.active');
  if (!active) return 'home';
  return active.id.replace('tab-', '');
}

function getTabAvatarKey(tab) { return 'ziva_avatar_tab_' + tab; }
function getTabAvatarFullKey(tab) { return 'ziva_avatar_tab_' + tab + '_full'; }

function getTabAvatar(tab) {
  // Return tab-specific avatar, or fall back to main avatar
  const tabAv = localStorage.getItem(getTabAvatarKey(tab));
  if (tabAv) return tabAv;
  return load(KEYS.avatar, null);
}

function getTabAvatarFull(tab) {
  const tabFull = localStorage.getItem(getTabAvatarFullKey(tab));
  if (tabFull) return tabFull;
  return localStorage.getItem('ziva_avatar_full');
}

// ─────────────────────────────────────────

// TABS
// ─────────────────────────────────────────
const TAB_ORDER = ['home','growth','track','insights','history','info'];
const TRACK_SUB_ORDER = ['diet','sleep','poop','medical','milestones'];
const TRACK_SUB_CONFIG = [
  { key:'diet', icon:zi('bowl'), label:'Diet' },
  { key:'sleep', icon:zi('moon'), label:'Sleep' },
  { key:'poop', icon:zi('diaper'), label:'Poop' },
  { key:'medical', icon:zi('medical'), label:'Medical' },
  { key:'milestones', icon:zi('star'), label:'Milestones' },
];
let _activeTrackSub = localStorage.getItem('ziva_track_sub') || 'diet';

function homeFabAction() {
  const currentTab = localStorage.getItem('ziva_active_tab') || 'home';
  if (currentTab === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    switchTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function getAlertNavAction(alertKey, alertTitle) {
  const k = (alertKey || '').toLowerCase();
  const t = (alertTitle || '').toLowerCase();
  if (k.includes('vacc'))       return "switchTab('medical');setTimeout(()=>document.getElementById('medVaccCard')?.scrollIntoView({behavior:'smooth',block:'start'}),150)";
  if (k.includes('poop') || k.includes('stool') || k.includes('digestion'))
                                return "switchTab('poop')";
  if (k.includes('sleep'))      return "switchTab('sleep')";
  if (k.includes('missing-meal') || k.includes('no-feed')) {
    const meal = ['dinner','lunch','breakfast','snack'].find(m => t.includes(m));
    if (meal) return "switchTab('diet');setTimeout(()=>{const el=document.getElementById('meal-" + meal + "');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.focus()}},200)";
    return "switchTab('diet');setTimeout(()=>{const el=document.getElementById('meal-breakfast');if(el){el.scrollIntoView({behavior:'smooth',block:'center'})}},200)";
  }
  if (k.includes('feed') || k.includes('meal') || k.includes('food') || k.includes('iron') || k.includes('calcium') || k.includes('protein') || k.includes('nutrient') || k.includes('variety') || k.includes('diet'))
                                return "switchTab('diet')";
  if (k.includes('supp') || k.includes('med') || k.includes('dev-checkup'))
                                return "switchTab('medical')";
  if (k.includes('growth'))     return "switchTab('growth')";
  if (k.includes('milestone'))  return "switchTab('milestones')";
  return "switchTab('insights');setTimeout(()=>{const el=document.getElementById('insightsAlertsCard');if(el){el.scrollIntoView({behavior:'smooth',block:'center'})}},150)";
}

function switchTab(name) {
  _islClearAll();
  _clearModifierCache();
  _tsfExpandedId = null;
  _tsfShowAll = false;
  // Redirect domain tabs to Track tab
  if (TRACK_SUB_ORDER.includes(name)) {
    const sub = name;
    name = 'track';
    _activeTrackSub = sub;
  }

  // Hide all top-level tab panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  // Hide all track sub-panels
  document.querySelectorAll('.track-sub-panel').forEach(p => p.classList.remove('active'));
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  // Activate the selected top-level panel
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');
  const idx = TAB_ORDER.indexOf(name);
  const activeBtn = document.querySelectorAll('.tab-btn')[idx];
  if (activeBtn) activeBtn.classList.add('active');
  localStorage.setItem('ziva_active_tab', name);

  // Auto-scroll tab bar to centre the active tab
  if (activeBtn) scrollTabIntoView(activeBtn);

  // Toggle header: full on Home only
  const fullHeader = document.getElementById('headerFull');
  fullHeader.style.display = name === 'home' ? '' : 'none';

  if (name === 'growth') { renderGrowthStats(); setTimeout(() => { drawChart(); drawHeightChart(); }, 60); }
  if (name === 'track') {
    switchTrackSub(_activeTrackSub);
  }
  if (name === 'history') { renderHistoryPreviews(); renderFeedingHistory(); renderMedLog(); renderMilestoneHistory(); renderVaccHistory(); renderGrowthHistory(); renderNotesHistory(); renderScrapbookHistory(); renderSleepHistoryPreview(); renderPoopHistoryPreview(); renderAlertHistory(); renderNotes(); renderScrapbook(); }
  if (name === 'insights') { renderInsights(); }
  if (name === 'info') { renderInfo(); }
  window.scrollTo({ top: 0 });
}

function switchTrackSub(sub) {
  if (!TRACK_SUB_ORDER.includes(sub)) sub = 'diet';
  _activeTrackSub = sub;
  localStorage.setItem('ziva_track_sub', sub);

  // Toggle sub-panels
  document.querySelectorAll('.track-sub-panel').forEach(p => p.classList.remove('active'));
  const subPanel = document.getElementById('tab-' + sub);
  if (subPanel) subPanel.classList.add('active');

  // Render sub-tab bar
  renderTrackSubBar();
  // Render track score hero
  // renderTrackHero(); // removed in v2.5 Balance — Track score hero removed

  // Trigger sub-tab renders
  if (sub === 'medical') { renderMedicalStats(); orderMedicalCards(); renderVaccPastList(); renderDoctorPrep(); initSymptomChips(); renderFeverEpisodeCard(); renderFeverHistory(); renderDiarrhoeaEpisodeCard(); renderDiarrhoeaHistory(); renderVomitingEpisodeCard(); renderVomitingHistory(); renderColdEpisodeCard(); renderColdHistory(); }
  if (sub === 'diet') renderDietStats();
  if (sub === 'milestones') renderMilestoneStats();
  if (sub === 'sleep') { renderSleep(); setTimeout(drawSleepChart, 60); }
  if (sub === 'poop') { renderPoop(); setTimeout(drawPoopChart, 60); }

  window.scrollTo({ top: 0 });
}

function renderTrackSubBar() {
  const el = document.getElementById('trackSubBar');
  if (!el) return;
  const zs = calcZivaScore();
  el.innerHTML = TRACK_SUB_CONFIG.map(t => {
    const active = _activeTrackSub === t.key ? ' active' : '';
    let scoreHtml = '';
    if (zs && zs.score !== null) {
      const d = zs.domains[t.key];
      const sv = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : '';
      if (sv !== '') scoreHtml = ` <span class="tsb-score">${sv}</span>`;
    }
    // In-progress sleep indicator
    let sipDot = '';
    if (t.key === 'sleep' && localStorage.getItem(SLEEP_INPROGRESS_KEY)) {
      sipDot = '<span class="sip-tab-dot"></span>';
    }
    return `<button class="track-sub-btn${active}" data-key="${t.key}" data-action="switchTrackSub" data-arg="${t.key}">
      <span class="tsb-icon">${t.icon}</span>${scoreHtml}${sipDot}
    </button>`;
  }).join('');

  // Scroll active sub-tab into view
  const activeEl = el.querySelector('.track-sub-btn.active');
  if (activeEl) activeEl.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
}

function renderTrackHero() { /* v2.5 Balance: DORMANT — Track score hero removed (duplicated Home hero). */ if(true)return;
  const el = document.getElementById('trackScoreHero');
  if (!el) return;
  const zs = calcZivaScore();
  if (!zs || zs.score === null) { el.style.display = 'none'; return; }
  el.style.display = '';

  const lbl = getScoreLabel(zs.score);
  const trend = getZivaScoreTrend7d();
  let trendText = '→ stable';
  if (trend.delta > 2) trendText = '↑ +' + trend.delta + ' vs last week';
  else if (trend.delta < -2) trendText = '↓ ' + trend.delta + ' vs last week';

  const ringColors = {
    excellent: 'background:linear-gradient(135deg, #d4f5e0, #b8eacc); border-color:#6fcf97; color:#1a7a42;',
    great: 'background:linear-gradient(135deg, #e0f0fa, #cce5f5); border-color:#7fb8d8; color:#2a6a8a;',
    good: 'background:linear-gradient(135deg, #fef6e8, #fcecd0); border-color:#e8c86d; color:#8a6520;',
    fair: 'background:linear-gradient(135deg, #fef0e0, #fce0c0); border-color:#e8a050; color:#8a5020;',
    attention: 'background:linear-gradient(135deg, #fde8ed, #f8d0d8); border-color:var(--tc-danger); color:#a03030;'
  };
  const ringStyle = ringColors[lbl.label] || ringColors.good;

  // Build domain pills — same architecture as home hero
  const domainPills = TRACK_SUB_CONFIG.map(dc => {
    const d = zs.domains[dc.key];
    const scoreVal = d && d.score !== null && d.score !== undefined ? Math.round(d.score) : null;
    const score = scoreVal !== null ? scoreVal : '—';
    const staleClass = d && d.isStale ? ' zsd-stale' : '';
    const levelClass = scoreVal !== null ? ' zsd-' + getScoreLabel(scoreVal).label : '';
    const activeClass = _activeTrackSub === dc.key ? ' border:2px solid var(--tc-rose);' : '';
    return `<div class="zs-domain-pill${staleClass}${levelClass}" style="${activeClass}" data-action="switchTrackSub" data-arg="${dc.key}">
      <div class="zsd-icon">${dc.icon}</div>
      <div class="zsd-text"><div class="zsd-score">${score}</div><div class="zsd-label">${dc.label}</div></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="ziva-score-hero">
      <div class="zs-ring" style="${ringStyle}" data-open-score="1">
        <div class="zs-number">${zs.score}</div>
        <div class="zs-label">Ziva Score</div>
        <div class="zs-trend">${trendText}</div>
      </div>
      <div class="zs-domains">${domainPills}</div>
    </div>`;
}

// ── Swipe navigation + Safe Exit ──
(function() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let touchStartClientX = 0; // clientX for edge detection (viewport-relative)
  let _swipeTouchTarget = null;

  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartClientX = e.changedTouches[0].clientX;
    _swipeTouchTarget = e.target;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    // Check if swipe tabs is enabled
    if (localStorage.getItem('ziva_swipe_tabs') === 'off') return;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    // Only trigger if horizontal swipe is dominant and long enough
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;

    // Don't swipe if interacting with inputs, textareas, or scrollable containers
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    // Don't swipe if touch started inside a horizontally scrollable element
    if (_swipeTouchTarget) {
      var el = _swipeTouchTarget;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'hidden' && getComputedStyle(el).overflowX !== 'visible') return;
        el = el.parentElement;
      }
    }

    // Don't swipe if any overlay, modal, lightbox, or popup is open
    if (document.querySelector('.modal-overlay.open, .crop-overlay.open, .avatar-lightbox.open, .confirm-overlay, .ql-sheet.open, .ql-modal-overlay.open, .score-popup.open, .insights-popup.open')) return;

    // ── Edge swipe detection (right edge → left swipe = back/exit gesture) ──
    const screenW = window.innerWidth;
    const isRightEdgeSwipe = touchStartClientX > screenW * 0.90 && dx < -60;

    if (isRightEdgeSwipe) {
      handleSafeExit();
      return;
    }

    const currentTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
    const currentIdx = TAB_ORDER.indexOf(currentTab);
    if (currentIdx === -1) return;

    // If on Track tab, swipe cycles through sub-tabs instead of top-level tabs
    if (currentTab === 'track') {
      const subIdx = TRACK_SUB_ORDER.indexOf(_activeTrackSub);
      if (dx < -60 && subIdx < TRACK_SUB_ORDER.length - 1) {
        switchTrackSub(TRACK_SUB_ORDER[subIdx + 1]);
      } else if (dx > 60 && subIdx > 0) {
        switchTrackSub(TRACK_SUB_ORDER[subIdx - 1]);
      } else if (dx > 60 && subIdx === 0) {
        // At first sub-tab, swipe right goes to previous top-level tab
        switchTab(TAB_ORDER[currentIdx - 1]);
      } else if (dx < -60 && subIdx === TRACK_SUB_ORDER.length - 1) {
        // At last sub-tab, swipe left goes to next top-level tab
        if (currentIdx < TAB_ORDER.length - 1) switchTab(TAB_ORDER[currentIdx + 1]);
      }
      return;
    }

    if (dx < -60 && currentIdx < TAB_ORDER.length - 1) {
      // Swipe left → next tab
      switchTab(TAB_ORDER[currentIdx + 1]);
    } else if (dx > 60 && currentIdx > 0) {
      // Swipe right → previous tab
      switchTab(TAB_ORDER[currentIdx - 1]);
    }
  }
})();

// ── Safe Exit — two-step: go home first, then confirm ──
function handleSafeExit() {
  const currentTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));

  if (currentTab !== 'home') {
    // Step 1: go to Home first
    switchTab('home');
    return;
  }

  // Step 2: already on Home — confirm exit
  confirmAction(zi('check') + ' Exit dashboard?\n\nYour data will be auto-saved before closing.', () => {
    // Force autosave to the older slot
    forceAutosave();
    // Try to close the tab
    setTimeout(() => {
      window.close();
      // If window.close() didn't work (tab not opened by script), show confirmation
      setTimeout(() => {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(20,15,15,0.92);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:var(--sp-16);';
        msg.innerHTML = `
          <div style="font-size:var(--fs-3xl);"><span class="zi-check-placeholder"></span></div>
          <div style="font-family:'Fraunces',serif;font-size:var(--fs-xl);color:white;font-weight:600;">Data saved</div>
          <div style="font-size:var(--fs-base);color:rgba(255,255,255,0.6);">You can safely close this tab now.</div>
        `;
        document.body.appendChild(msg);
        msg.onclick = () => msg.remove();
      }, 300);
    }, 200);
  }, 'Exit');
}

function forceAutosave() {
  try {
    const snapshot = buildSnapshot();
    // Overwrite the older slot
    const ts1 = localStorage.getItem(AUTOSAVE_TS_KEYS[0]);
    const ts2 = localStorage.getItem(AUTOSAVE_TS_KEYS[1]);
    const last1 = ts1 ? new Date(ts1).getTime() : 0;
    const last2 = ts2 ? new Date(ts2).getTime() : 0;
    const slotIdx = last1 <= last2 ? 0 : 1;
    localStorage.setItem(AUTOSAVE_KEYS[slotIdx], JSON.stringify(snapshot));
    localStorage.setItem(AUTOSAVE_TS_KEYS[slotIdx], new Date().toISOString());
  } catch {
    // Storage full — silent fail
  }
}

// ── Fallback: auto-save on tab close ──
window.addEventListener('beforeunload', () => {
  forceAutosave();
});

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────
function today() {
  return toDateStr(new Date());
}
function toDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function formatDate(s) {
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
// Moon phase — Hindu Tithi system (30 tithis per lunar month)
// Shukla Paksha (waxing): Pratipada → Purnima (tithis 1-15)
// Krishna Paksha (waning): Pratipada → Amavasya (tithis 16-30)
// Reference: known Amavasya (new moon) on 6 Jan 2000 00:18 UTC
const SYNODIC = 29.53058770576;
const REF_AMAVASYA = new Date('2000-01-06T18:14:00+05:30');

function getLunarDay(date) {
  const daysSince = (date - REF_AMAVASYA) / 86400000;
  const phase = ((daysSince % SYNODIC) + SYNODIC) % SYNODIC; // 0 = Amavasya
  return phase; // 0-29.53 continuous
}

function getTithiIndex(date) {
  // Each tithi = SYNODIC/30 days ≈ 0.984 days
  const phase = getLunarDay(date);
  return Math.floor(phase / (SYNODIC / 30)) % 30; // 0-29
}

function getMoonPhaseEmoji(date) {
  const tithi = getTithiIndex(date);
  // Map 30 tithis to 8 moon emojis
  if (tithi === 0)                    return '🌑'; // Amavasya
  if (tithi >= 1  && tithi <= 3)      return '🌒'; // Shukla early
  if (tithi >= 4  && tithi <= 7)      return '🌓'; // Shukla Ashtami
  if (tithi >= 8  && tithi <= 11)     return '🌔'; // Shukla late
  if (tithi >= 12 && tithi <= 15)     return '🌕'; // Purnima
  if (tithi >= 16 && tithi <= 18)     return '🌖'; // Krishna early
  if (tithi >= 19 && tithi <= 22)     return '🌗'; // Krishna Ashtami
  if (tithi >= 23 && tithi <= 26)     return '🌘'; // Krishna late
  return '🌑'; // approaching Amavasya
}

function getMoonPhaseName(date) {
  const tithi = getTithiIndex(date);
  const TITHI_NAMES = [
    'अमावस्या (Amavasya)',           // 0 — new moon
    'शुक्ल प्रतिपदा (Pratipada)',      // 1
    'शुक्ल द्वितीया (Dwitiya)',        // 2
    'शुक्ल तृतीया (Tritiya)',          // 3
    'शुक्ल चतुर्थी (Chaturthi)',       // 4
    'शुक्ल पंचमी (Panchami)',          // 5
    'शुक्ल षष्ठी (Shashthi)',          // 6
    'शुक्ल सप्तमी (Saptami)',          // 7
    'शुक्ल अष्टमी (Ashtami)',          // 8
    'शुक्ल नवमी (Navami)',             // 9
    'शुक्ल दशमी (Dashami)',            // 10
    'शुक्ल एकादशी (Ekadashi)',        // 11
    'शुक्ल द्वादशी (Dwadashi)',        // 12
    'शुक्ल त्रयोदशी (Trayodashi)',     // 13
    'शुक्ल चतुर्दशी (Chaturdashi)',    // 14
    'पूर्णिमा (Purnima)',              // 15 — full moon
    'कृष्ण प्रतिपदा (Pratipada)',      // 16
    'कृष्ण द्वितीया (Dwitiya)',        // 17
    'कृष्ण तृतीया (Tritiya)',          // 18
    'कृष्ण चतुर्थी (Chaturthi)',       // 19
    'कृष्ण पंचमी (Panchami)',          // 20
    'कृष्ण षष्ठी (Shashthi)',          // 21
    'कृष्ण सप्तमी (Saptami)',          // 22
    'कृष्ण अष्टमी (Ashtami)',          // 23
    'कृष्ण नवमी (Navami)',             // 24
    'कृष्ण दशमी (Dashami)',            // 25
    'कृष्ण एकादशी (Ekadashi)',        // 26
    'कृष्ण द्वादशी (Dwadashi)',        // 27
    'कृष्ण त्रयोदशी (Trayodashi)',     // 28
    'कृष्ण चतुर्दशी (Chaturdashi)',    // 29
  ];
  return TITHI_NAMES[tithi] || 'अमावस्या (Amavasya)';
}

function toggleHelp(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}
function openModal(id)  {
  document.getElementById(id).classList.add('open');
  history.pushState({ overlay: id }, '');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if(e.target===el) { el.classList.remove('open'); if (history.state?.overlay) history.back(); }
  });
});

// ── Back gesture / back button closes overlays instead of leaving the page ──
window.addEventListener('popstate', e => {
  const state = e.state;
  // Close any open overlay
  const cropOverlay = document.getElementById('cropOverlay');
  if (cropOverlay && cropOverlay.classList.contains('open')) { closeCrop(); return; }
  const lightbox = document.getElementById('avatarLightbox');
  if (lightbox && lightbox.classList.contains('open')) { closeAvatarLightbox(); return; }
  // Close any open modal
  const openModal = document.querySelector('.modal-overlay.open');
  if (openModal) { openModal.classList.remove('open'); return; }
  // Close any open confirm dialog
  const confirm = document.querySelector('.confirm-overlay');
  if (confirm) { confirm.remove(); return; }
});

function confirmAction(msg, callback, btnText) {
  const label = btnText || (msg.toLowerCase().startsWith('delete') ? 'Delete' : 'Confirm');
  const btnCls = label === 'Delete' ? 'btn btn-rose' : label === 'Reset' ? 'btn btn-rose' : 'btn btn-sky';
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <p>${msg}</p>
      <div class="confirm-btns">
        <button class="btn btn-ghost" id="confirmNo">Cancel</button>
        <button class="${btnCls}" id="confirmYes">${label}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirmNo').onclick = () => overlay.remove();
  overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); callback(); };
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// ─────────────────────────────────────────
// SETTINGS / EXPORT / IMPORT
// ─────────────────────────────────────────
function openSettingsSidebar() {
  const sidebar = document.getElementById('settingsSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  sidebar.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  switchSettingsTab('general');
  // Update save meta
  const lastTs = localStorage.getItem('ziva_last_saved');
  const meta = document.getElementById('sidebarLastSaved');
  if (meta && lastTs) meta.textContent = 'Last saved: ' + formatSavedTime(lastTs);
}

function closeSettingsSidebar() {
  const sidebar = document.getElementById('settingsSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleSettingsSidebar() {
  const sidebar = document.getElementById('settingsSidebar');
  if (sidebar && sidebar.classList.contains('open')) closeSettingsSidebar();
  else openSettingsSidebar();
}

function quickSaveNow() {
  // No confirmation — immediate save
  exportData();
  const now = new Date().toISOString();
  localStorage.setItem('ziva_last_saved', now);
  updateLastSavedDisplay();
  // Visual feedback
  const meta = document.getElementById('sidebarLastSaved');
  if (meta) meta.innerHTML = zi('check') + ' Saved just now';
  const btn = document.getElementById('tabSaveBtn');
  if (btn) {
    btn.innerHTML = zi('check');
    setTimeout(() => { btn.innerHTML = zi('bars'); }, 1500);
  }
}

// Keep old quickSave as alias
function quickSave() { quickSaveNow(); }

// ── Sidebar swipe gestures ──
(function() {
  let sx = 0, sy = 0, edgeSwipe = false;
  // Right swipe from left edge opens sidebar
  document.addEventListener('touchstart', e => {
    const x = e.changedTouches[0].clientX;
    sx = e.changedTouches[0].screenX;
    sy = e.changedTouches[0].screenY;
    edgeSwipe = x < 25; // within 25px of left edge
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - sx;
    const dy = e.changedTouches[0].screenY - sy;
    if (Math.abs(dy) > Math.abs(dx) * 0.7) return;
    // Don't trigger sidebar swipe if score popup or other overlay is open
    if (document.querySelector('.score-popup.open')) return;
    // Open: right swipe from left edge
    if (edgeSwipe && dx > 60) {
      const sidebar = document.getElementById('settingsSidebar');
      if (sidebar && !sidebar.classList.contains('open')) {
        openSettingsSidebar();
        return;
      }
    }
    // Close: left swipe while sidebar is open
    if (dx < -60) {
      const sidebar = document.getElementById('settingsSidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        closeSettingsSidebar();
      }
    }
    edgeSwipe = false;
  }, { passive: true });
})();

function switchSettingsTab(tab) {
  // Toggle sub-tab buttons
  ['general','display','data','recovery'].forEach(t => {
    const btn = document.getElementById('st-' + t);
    const pane = document.getElementById('sp-' + t);
    if (btn) btn.classList.toggle('active-st', t === tab);
    if (pane) pane.classList.toggle('active-sp', t === tab);
  });
  // Lazy-load tab-specific data
  if (tab === 'data') updateStorageUsage();
  if (tab === 'recovery') { updateLastSavedDisplay(); renderAutosaveInfo(); }
  if (tab === 'display') renderDisplaySettings();
  if (tab === 'general') {
    const swipeEl = document.getElementById('settingsSwipeTabs');
    if (swipeEl) swipeEl.checked = localStorage.getItem('ziva_swipe_tabs') !== 'off';
    const dietEl = document.getElementById('settingsDietPref');
    if (dietEl) dietEl.value = getDietPref();
    const refStdEl = document.getElementById('settingsRefStd');
    if (refStdEl) refStdEl.value = _referenceStandard;
    _initPowerOutageToggle();
  }
}

function saveSwipePref() {
  const on = document.getElementById('settingsSwipeTabs').checked;
  localStorage.setItem('ziva_swipe_tabs', on ? 'on' : 'off');
}

// ── Settings sub-tab swipe ──
(function() {
  const STABS = ['general','display','data','recovery'];
  let sx = 0, sy = 0;
  document.addEventListener('touchstart', e => {
    const wrap = e.target.closest('.settings-pane-wrap');
    if (!wrap) return;
    sx = e.changedTouches[0].screenX;
    sy = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const wrap = e.target.closest('.settings-pane-wrap');
    if (!wrap) return;
    const dx = e.changedTouches[0].screenX - sx;
    const dy = e.changedTouches[0].screenY - sy;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
    const cur = STABS.findIndex(t => document.getElementById('sp-' + t)?.classList.contains('active-sp'));
    if (cur === -1) return;
    if (dx < -50 && cur < STABS.length - 1) switchSettingsTab(STABS[cur + 1]);
    else if (dx > 50 && cur > 0) switchSettingsTab(STABS[cur - 1]);
  }, { passive: true });
})();

// ── Food category modal sub-tab swipe ──
(function() {
  let sx = 0, sy = 0;
  document.addEventListener('touchstart', e => {
    if (!e.target.closest('#foodCatModalBody')) return;
    sx = e.changedTouches[0].screenX;
    sy = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!e.target.closest('#foodCatModalBody')) return;
    if (!_activeFoodCatParent) return;
    const dx = e.changedTouches[0].screenX - sx;
    const dy = e.changedTouches[0].screenY - sy;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
    const parent = FOOD_TAX[_activeFoodCatParent];
    if (!parent) return;
    const subIds = Object.keys(parent.subs);
    const cur = subIds.indexOf(_activeFoodCatSub);
    if (cur === -1) return;
    if (dx < -50 && cur < subIds.length - 1) switchFoodCatSub(_activeFoodCatParent, subIds[cur + 1]);
    else if (dx > 50 && cur > 0) switchFoodCatSub(_activeFoodCatParent, subIds[cur - 1]);
  }, { passive: true });
})();

// ── Quick Log swipe-down to dismiss ──
(function() {
  let sy = 0;
  document.addEventListener('touchstart', e => {
    if (!e.target.closest('.ql-sheet, .ql-modal')) return;
    sy = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!e.target.closest('.ql-sheet, .ql-modal')) return;
    const dy = e.changedTouches[0].screenY - sy;
    if (dy > 80) {
      // Swipe down — close whatever is open
      const modalOpen = document.querySelector('.ql-modal-overlay.open');
      if (modalOpen) {
        closeQuickModal();
      } else if (document.getElementById('qlSheet').classList.contains('open')) {
        closeQuickLog();
      }
    }
  }, { passive: true });
})();

function saveHeightUnitPref() {
  const unit = document.getElementById('settingsHeightUnit').value;
  localStorage.setItem('ziva_height_unit', unit);
  // Re-render anything showing height
  renderGrowth();
  updateHeader();
}

function saveDietPref() {
  const pref = document.getElementById('settingsDietPref').value;
  localStorage.setItem('ziva_diet_pref', pref);
}

function getDietPref() {
  return localStorage.getItem('ziva_diet_pref') || 'veg';
}

function updateStorageUsage() {
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB typical localStorage limit

  // Calculate total and per-category usage
  let totalBytes = 0;
  const categories = {};

  // Define friendly names and group keys
  const keyGroups = {
    'Growth':      ['ziva_growth'],
    'Feeding':     ['ziva_feeding'],
    'Vaccines':    ['ziva_vacc'],
    'Milestones':  ['ziva_milestones'],
    'Foods':       ['ziva_foods'],
    'Notes':       ['ziva_notes'],
    'Scrapbook':   ['ziva_scrapbook'],
    'Meds':        ['ziva_meds', 'ziva_med_checks'],
    'Visits':      ['ziva_visits'],
    'Doctors':     ['ziva_doctors'],
    'Events':      ['ziva_events'],
    'Sleep':       ['ziva_sleep'],
    'Poop':        ['ziva_poop'],
    'Autosave':    ['ziva_autosave_1', 'ziva_autosave_2'],
    'Avatars':     ['ziva_avatar', 'ziva_avatar_full'],
  };

  // Add tab avatars to the Avatars group
  ['growth','medical','diet','milestones','history','sleep','poop'].forEach(tab => {
    keyGroups['Avatars'].push('ziva_avatar_tab_' + tab);
    keyGroups['Avatars'].push('ziva_avatar_tab_' + tab + '_full');
  });

  // Measure each group
  Object.entries(keyGroups).forEach(([label, keys]) => {
    let groupBytes = 0;
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) groupBytes += key.length + val.length;
    });
    // Also count nutrition cache and food categories
    if (label === 'Foods') {
      ['ziva_food_categories', 'ziva_nutrition_cache'].forEach(k => {
        const v = localStorage.getItem(k);
        if (v) groupBytes += k.length + v.length;
      });
    }
    categories[label] = groupBytes * 2; // JS strings are UTF-16 = 2 bytes per char
    totalBytes += groupBytes * 2;
  });

  // Also count misc keys
  const miscKeys = Object.keys(KEY_VERSIONS).map(k => 'ziva_kv_' + k);
  let miscBytes = 0;
  miscKeys.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) miscBytes += (k.length + v.length) * 2;
  });
  totalBytes += miscBytes;

  const pct = Math.min(100, (totalBytes / MAX_BYTES) * 100);
  const usedKB = (totalBytes / 1024).toFixed(1);
  const maxKB = (MAX_BYTES / 1024).toFixed(0);

  // Update bar
  const bar = document.getElementById('storageBar');
  const text = document.getElementById('storageText');
  bar.style.width = pct + '%';
  bar.style.background = pct > 80 ? 'var(--tc-danger)' : pct > 60 ? 'var(--tc-caution)' : 'var(--sky)';
  text.textContent = `${usedKB} KB / ${maxKB} KB (${pct.toFixed(1)}%)`;

  // Build breakdown chips — top 3 visible, rest collapsed
  const breakdown = document.getElementById('storageBreakdown');
  const sorted = Object.entries(categories).filter(([,b]) => b > 0).sort((a,b) => b[1] - a[1]);

  const makeChip = ([label, bytes]) => {
    const kb = (bytes / 1024).toFixed(1);
    const catPct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(0) : 0;
    return `<span style="font-size:var(--fs-xs);padding:3px 8px;border-radius:var(--r-md);background:var(--card-bg);color:var(--mid);border:1px solid rgba(168,207,224,0.3);">${label} ${kb}KB <span style="opacity:0.5;">${catPct}%</span></span>`;
  };

  const top3 = sorted.slice(0, 3).map(makeChip).join('');
  const rest = sorted.slice(3);

  if (rest.length === 0) {
    breakdown.innerHTML = top3;
  } else {
    const restChips = rest.map(makeChip).join('');
    breakdown.innerHTML = top3 +
      `<span id="storageMoreBtn" style="font-size:var(--fs-xs);padding:3px 8px;border-radius:var(--r-md);background:var(--warm);color:var(--light);border:1px solid rgba(168,207,224,0.2);cursor:pointer;" onclick="document.getElementById('storageRestChips').style.display='flex';this.style.display='none';">+ ${rest.length} more</span>` +
      `<div id="storageRestChips" style="display:none;flex-wrap:wrap;gap:var(--sp-8);width:100%;">${restChips}` +
      `<span style="font-size:var(--fs-xs);padding:3px 8px;border-radius:var(--r-md);background:var(--warm);color:var(--light);border:1px solid rgba(168,207,224,0.2);cursor:pointer;" onclick="document.getElementById('storageRestChips').style.display='none';document.getElementById('storageMoreBtn').style.display='';">▴ less</span></div>`;
  }
}

function exportData() {
  const data = {};
  Object.entries(KEYS).forEach(([k, v]) => {
    const val = localStorage.getItem(v);
    if (val) data[v] = JSON.parse(val);
  });
  data.ziva_avatar = localStorage.getItem(KEYS.avatar);
  data.ziva_avatar_full = localStorage.getItem('ziva_avatar_full');
  // Per-tab avatars
  ['growth','medical','diet','milestones','history','sleep','poop'].forEach(tab => {
    const tk = 'ziva_avatar_tab_' + tab;
    const fk = tk + '_full';
    const tv = localStorage.getItem(tk);
    const fv = localStorage.getItem(fk);
    if (tv) data[tk] = tv;
    if (fv) data[fk] = fv;
  });
  // Save per-key versions
  Object.keys(KEY_VERSIONS).forEach(k => {
    const v = localStorage.getItem('ziva_kv_' + k);
    if (v) data['ziva_kv_' + k] = v;
  });
  data._exportDate = new Date().toISOString();

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ziva-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function shareBackup() {
  // Build the same data object as exportData
  const data = {};
  Object.entries(KEYS).forEach(([k, v]) => {
    const val = localStorage.getItem(v);
    if (val) data[v] = JSON.parse(val);
  });
  data.ziva_avatar = localStorage.getItem(KEYS.avatar);
  data.ziva_avatar_full = localStorage.getItem('ziva_avatar_full');
  ['growth','medical','diet','milestones','history','sleep','poop'].forEach(tab => {
    const tk = 'ziva_avatar_tab_' + tab;
    const fk = tk + '_full';
    const tv = localStorage.getItem(tk);
    const fv = localStorage.getItem(fk);
    if (tv) data[tk] = tv;
    if (fv) data[fk] = fv;
  });
  Object.keys(KEY_VERSIONS).forEach(k => {
    const v = localStorage.getItem('ziva_kv_' + k);
    if (v) data['ziva_kv_' + k] = v;
  });
  data._exportDate = new Date().toISOString();

  const jsonStr = JSON.stringify(data, null, 2);
  const file = new File([jsonStr], `ziva-backup-${today()}.json`, { type: 'application/json' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({
      title: "Ziva's Dashboard Backup",
      text: `Backup from ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`,
      files: [file]
    }).catch(() => {
      // User cancelled share — fall back to download
      exportData();
    });
  } else {
    // Fallback: download file directly
    exportData();
  }
}

function formatSavedTime(isoStr) {
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  let relative;
  if (diffMin < 1) relative = 'just now';
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHr < 24) relative = `${diffHr}h ago`;
  else if (diffDays === 1) relative = 'yesterday';
  else relative = `${diffDays}d ago`;

  const timeStr = d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  const dateStr = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  return `${dateStr}, ${timeStr} (${relative})`;
}

function updateLastSavedDisplay() {
  const ts = localStorage.getItem('ziva_last_saved');
  const infoEl = document.getElementById('lastSavedInfo');
  const textEl = document.getElementById('lastSavedText');
  if (!infoEl || !textEl) return;
  if (ts) {
    infoEl.style.display = '';
    textEl.textContent = formatSavedTime(ts);
  } else {
    infoEl.style.display = 'none';
  }
}

// ─────────────────────────────────────────
// AUTOSAVE — rolling 2-slot localStorage snapshots
// ─────────────────────────────────────────
const AUTOSAVE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const AUTOSAVE_KEYS = ['ziva_autosave_1', 'ziva_autosave_2'];
const AUTOSAVE_TS_KEYS = ['ziva_autosave_ts_1', 'ziva_autosave_ts_2'];

function buildSnapshot() {
  const data = {};
  Object.entries(KEYS).forEach(([k, v]) => {
    const val = localStorage.getItem(v);
    if (val) data[v] = JSON.parse(val);
  });
  data.ziva_avatar = localStorage.getItem(KEYS.avatar);
  // Skip avatar_full and tab avatars in autosave — too large, saves space
  Object.keys(KEY_VERSIONS).forEach(k => {
    const v = localStorage.getItem('ziva_kv_' + k);
    if (v) data['ziva_kv_' + k] = v;
  });
  data._autosaveDate = new Date().toISOString();
  return data;
}

function triggerAutosave() {
  const now = Date.now();
  // Check if enough time has passed since last autosave
  const ts1 = localStorage.getItem(AUTOSAVE_TS_KEYS[0]);
  const ts2 = localStorage.getItem(AUTOSAVE_TS_KEYS[1]);
  const last1 = ts1 ? new Date(ts1).getTime() : 0;
  const last2 = ts2 ? new Date(ts2).getTime() : 0;
  const lastAutosave = Math.max(last1, last2);

  if (now - lastAutosave < AUTOSAVE_INTERVAL_MS) return; // Too soon

  // Pick the older slot to overwrite (round-robin)
  const slotIdx = last1 <= last2 ? 0 : 1;

  try {
    const snapshot = buildSnapshot();
    localStorage.setItem(AUTOSAVE_KEYS[slotIdx], JSON.stringify(snapshot));
    localStorage.setItem(AUTOSAVE_TS_KEYS[slotIdx], new Date().toISOString());
  } catch {
    // localStorage full — silently skip
  }
}

function getAutosaveInfo(slotIdx) {
  const ts = localStorage.getItem(AUTOSAVE_TS_KEYS[slotIdx]);
  const data = localStorage.getItem(AUTOSAVE_KEYS[slotIdx]);
  if (!ts || !data) return null;
  return { ts, size: data.length, slotIdx };
}

function restoreAutosave(slotIdx) {
  const raw = localStorage.getItem(AUTOSAVE_KEYS[slotIdx]);
  if (!raw) { alert('Autosave slot is empty.'); return; }
  try {
    const data = JSON.parse(raw);
    const dateLabel = data._autosaveDate ? formatSavedTime(data._autosaveDate) : 'unknown';
    confirmAction(`Restore from autosave ${slotIdx + 1}?\n\nSnapshot from: ${dateLabel}\n\nThis will replace all current data. A backup will be downloaded first.`, () => {
      exportData(); // Safety backup before restore
      setTimeout(() => {
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('ziva_')) {
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          }
        });
        location.reload();
      }, 500);
    }, 'Restore');
  } catch {
    alert('Autosave data is corrupted.');
  }
}

function checkAutosaveRecovery() {
  // Check if primary data is missing but autosave exists
  const hasGrowth = localStorage.getItem(KEYS.growth);
  const hasFeeding = localStorage.getItem(KEYS.feeding);
  const hasMilestones = localStorage.getItem(KEYS.milestones);

  // If at least one core key has user data, no recovery needed
  if (hasGrowth || hasFeeding || hasMilestones) return;

  // Check if any autosave exists
  const slot0 = getAutosaveInfo(0);
  const slot1 = getAutosaveInfo(1);
  if (!slot0 && !slot1) return;

  // Pick the most recent autosave
  const best = (slot0 && slot1) ? (slot0.ts > slot1.ts ? slot0 : slot1) :
               (slot0 || slot1);

  const dateLabel = formatSavedTime(best.ts);
  confirmAction(`Your data appears to be missing, but an autosave was found from ${dateLabel}.\n\nWould you like to restore it?`, () => {
    restoreAutosave(best.slotIdx);
  }, 'Restore');
}

function renderAutosaveInfo() {
  const el = document.getElementById('autosaveSlots');
  if (!el) return;

  const slot0 = getAutosaveInfo(0);
  const slot1 = getAutosaveInfo(1);

  if (!slot0 && !slot1) {
    el.innerHTML = '<div class="t-sub">No autosaves yet. Autosave triggers when data is written and 30+ minutes have passed since the last autosave.</div>';
    return;
  }

  let html = '';
  [slot0, slot1].forEach((slot, i) => {
    if (!slot) {
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;opacity:0.4;">
        <span class="t-sub">Slot ${i + 1}: empty</span>
      </div>`;
    } else {
      const sizeKB = (slot.size / 1024).toFixed(1);
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;">
        <div>
          <div style="font-size:var(--fs-sm);font-weight:600;color:var(--tc-sage);">Slot ${i + 1}</div>
          <div class="t-sub">${formatSavedTime(slot.ts)} · ${sizeKB} KB</div>
        </div>
        <button class="btn btn-sage" data-action="restoreAutosave" data-arg="${i}" style="padding:6px 14px;font-size:var(--fs-sm);">Restore</button>
      </div>`;
    }
  });
  el.innerHTML = html;
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      confirmAction(`Import backup from ${data._exportDate ? formatDate(data._exportDate.split('T')[0]) : 'unknown date'}? This will replace all current data.`, () => {
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('ziva_')) {
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          }
        });
        location.reload();
      }, 'Import');
    } catch (err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetAllData() {
  // Always export a backup first
  exportData();
  // Short delay to let the download trigger before clearing
  setTimeout(() => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    Object.keys(KEY_VERSIONS).forEach(k => localStorage.removeItem('ziva_kv_' + k));
    localStorage.removeItem('ziva_avatar_full');
    localStorage.removeItem('ziva_active_tab');
    localStorage.removeItem('ziva_height_unit');
    localStorage.removeItem('ziva_swipe_tabs');
    localStorage.removeItem('ziva_theme');
    localStorage.removeItem('ziva_last_saved');
    localStorage.removeItem('ziva_autosave_1');
    localStorage.removeItem('ziva_autosave_2');
    localStorage.removeItem('ziva_autosave_ts_1');
    localStorage.removeItem('ziva_autosave_ts_2');
    localStorage.removeItem('ziva_food_categories');
    localStorage.removeItem('ziva_nutrition_cache');
    localStorage.removeItem('ziva_diet_pref');
    ['growth','medical','diet','milestones','history','sleep','poop'].forEach(tab => {
      localStorage.removeItem('ziva_avatar_tab_' + tab);
      localStorage.removeItem('ziva_avatar_tab_' + tab + '_full');
    });
    location.reload();
  }, 500);
}

// ─────────────────────────────────────────

// v1.9 — DARK MODE
// ─────────────────────────────────────────
// ─────────────────────────────────────────
// WELCOME GUIDE
// ─────────────────────────────────────────

let _wgStep = 0;
const _wgTotalSteps = 5;

function showWelcomeGuide() {
  const el = document.getElementById('welcomeGuide');
  if (!el) return;
  _wgStep = 0;
  el.style.display = '';
  wgRender();
  switchTab('home');
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function dismissWelcomeGuide() {
  const el = document.getElementById('welcomeGuide');
  if (el) el.style.display = 'none';
  localStorage.setItem('ziva_guide_seen', 'true');
}

function wgNav(dir) {
  _wgStep = Math.max(0, Math.min(_wgTotalSteps - 1, _wgStep + dir));
  if (_wgStep >= _wgTotalSteps - 1 && dir > 0) {
    // Last step — next becomes "Got it!"
  }
  wgRender();
}

function wgRender() {
  // Show active step
  document.querySelectorAll('.wg-step').forEach((el, i) => {
    el.classList.toggle('active', i === _wgStep);
  });

  // Dots
  const dotsEl = document.getElementById('wgDots');
  if (dotsEl) {
    dotsEl.innerHTML = Array.from({ length: _wgTotalSteps }, (_, i) =>
      `<div class="wg-dot${i === _wgStep ? ' active' : ''}"></div>`
    ).join('');
  }

  // Nav buttons
  const prevBtn = document.getElementById('wgPrev');
  const nextBtn = document.getElementById('wgNext');
  if (prevBtn) prevBtn.style.display = _wgStep === 0 ? 'none' : '';
  if (nextBtn) {
    if (_wgStep === _wgTotalSteps - 1) {
      nextBtn.textContent = 'Got it ✓';
      nextBtn.onclick = dismissWelcomeGuide;
    } else {
      nextBtn.textContent = 'Next →';
      nextBtn.onclick = () => wgNav(1);
    }
  }

  // Subtitle
  const sub = document.getElementById('wgSubtitle');
  if (sub) sub.textContent = `Step ${_wgStep + 1} of ${_wgTotalSteps}`;
}

function initWelcomeGuide() {
  const seen = localStorage.getItem('ziva_guide_seen');
  if (!seen) {
    // First open — show guide after a short delay so the app renders first
    setTimeout(showWelcomeGuide, 500);
  }
}

// ─────────────────────────────────────────
// ESSENTIAL MODE (internally: simple-mode class, ziva_simple_mode localStorage key)
// ─────────────────────────────────────────

function isSimpleMode() {
  return document.body.classList.contains('simple-mode');
}

function toggleSimpleMode() {
  const on = document.getElementById('settingsSimpleMode')?.checked ?? true;
  if (on) {
    document.body.classList.add('simple-mode');
    localStorage.setItem('ziva_simple_mode', 'true');
    // Collapse vitals card if expanded
    var expanded = document.getElementById('homeVitalsExpanded');
    var chevron = document.getElementById('homeVitalsChevron');
    var quick = document.getElementById('homeVitalsQuick');
    if (expanded) expanded.style.display = 'none';
    if (chevron) chevron.textContent = '▾';
    if (quick) quick.style.display = '';
  } else {
    document.body.classList.remove('simple-mode');
    localStorage.setItem('ziva_simple_mode', 'false');
  }
  // If currently on a hidden tab, redirect to home
  const currentTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (on && (currentTab === 'insights' || currentTab === 'info')) {
    switchTab('home');
  }
  // Re-render home to apply alert filtering
  if (currentTab === 'home') {
    renderHomeContextAlerts();
  }
  // Reset zoom to mode default
  setZoomLevel(on ? 'med' : 'low');
}

function initSimpleMode() {
  const saved = localStorage.getItem('ziva_simple_mode');
  // Default to Essential Mode ON (new users and existing users without preference)
  const isSimple = saved !== 'false';
  if (isSimple) {
    document.body.classList.add('simple-mode');
  }
  const toggle = document.getElementById('settingsSimpleMode');
  if (toggle) toggle.checked = isSimple;
}

// ── Text Zoom ──
function setZoomLevel(level) {
  const valid = ['low','med','high'];
  if (!valid.includes(level)) level = 'low';
  const html = document.documentElement;
  if (level === 'low') {
    html.removeAttribute('data-zoom');
  } else {
    html.setAttribute('data-zoom', level);
  }
  localStorage.setItem('ziva_zoom_level', level);
  // Sync slider if open
  const slider = document.getElementById('settingsZoomSlider');
  if (slider) slider.value = valid.indexOf(level);
}

function initZoomLevel() {
  const saved = localStorage.getItem('ziva_zoom_level');
  if (saved) {
    setZoomLevel(saved);
  } else {
    // Infer from Essential Mode
    const isSimple = document.body.classList.contains('simple-mode');
    setZoomLevel(isSimple ? 'med' : 'low');
  }
}

function renderDisplaySettings() {
  // Sync dark mode toggle
  const darkEl = document.getElementById('settingsDarkMode');
  if (darkEl) darkEl.checked = document.documentElement.getAttribute('data-theme') === 'dark';
  // Sync Essential Mode toggle
  const simpleEl = document.getElementById('settingsSimpleMode');
  if (simpleEl) simpleEl.checked = document.body.classList.contains('simple-mode');
  // Sync zoom slider
  const slider = document.getElementById('settingsZoomSlider');
  if (slider) {
    const level = localStorage.getItem('ziva_zoom_level') || 'low';
    slider.value = ['low','med','high'].indexOf(level);
  }
}

function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('ziva_theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('ziva_theme', 'dark');
  }
  updateDarkToggleIcon();
  // Update PWA theme-color meta tag
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = !isDark ? '#1a1a2e' : '#fdf0f3';
  // Sync settings checkbox if open
  const darkEl = document.getElementById('settingsDarkMode');
  if (darkEl) darkEl.checked = !isDark;
  // Redraw charts with updated colours
  const currentTab = TAB_ORDER.find(t => document.getElementById('tab-' + t)?.classList.contains('active'));
  if (currentTab === 'growth') { setTimeout(() => { drawChart(); drawHeightChart(); }, 60); }
  if (currentTab === 'sleep') { setTimeout(drawSleepChart, 60); }
  if (currentTab === 'poop') { setTimeout(drawPoopChart, 60); }
}

function updateDarkToggleIcon() {
  const btn = document.getElementById('darkToggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = isDark ? zi('sun') : zi('moon');
  btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

function initDarkMode() {
  const saved = localStorage.getItem('ziva_theme');
  // Auto-detect system preference if no saved preference
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = '#1a1a2e';
  }
  updateDarkToggleIcon();
}

// ─────────────────────────────────────────
// v1.9 — TAB BAR AUTO-SCROLL
// ─────────────────────────────────────────
function scrollTabIntoView(btn) {
  if (!btn) return;
  const bar = btn.closest('.tab-bar');
  if (!bar) return;
  const barRect = bar.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const scrollLeft = bar.scrollLeft + (btnRect.left - barRect.left) - (barRect.width / 2) + (btnRect.width / 2);
  bar.scrollTo({ left: scrollLeft, behavior: 'smooth' });
}

// ─────────────────────────────────────────
// v1.9 — UNIFIED CHART THEME
// ─────────────────────────────────────────
function getChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#b0a0b8' : '#806c6c';
  return {
    font: { family: 'Nunito', size: 10 },
    textColor,
    gridColor: (alpha = 0.12) => isDark ? `rgba(180,160,200,${alpha})` : `rgba(200,170,200,${alpha})`,
    tooltip: {
      backgroundColor: isDark ? '#3a2e40' : '#3d2e2e',
      titleColor: isDark ? '#e8e0ec' : '#fdf0f3',
      bodyColor: textColor,
      cornerRadius: 10,
    },
    legend: {
      boxWidth: 12,
      padding: 8,
      font: { family: 'Nunito', size: 11 },
      color: textColor,
    },
    barRadius: 6,
    barPercentage: 0.6,
  };
}

// ─────────────────────────────────────────
// INSIGHTS — TREND ENGINE (v2.0a)
// ─────────────────────────────────────────

// Generic trend calculator: compare two values, return arrow + delta + direction
function getTrend(current, previous, threshold, decimals) {
  if (current == null || previous == null) return { arrow:'', delta:0, direction:'flat', cls:'trend-flat', text:'' };
  const dec = decimals != null ? decimals : 1;
  const delta = +(current - previous).toFixed(dec);
  const absDelta = Math.abs(delta);
  if (absDelta <= threshold) return { arrow:'→', delta:0, direction:'flat', cls:'trend-flat', text:'→ stable' };
  if (delta > 0) return { arrow:'↑', delta, direction:'up', cls:'trend-up', text:'↑ +' + absDelta.toFixed(dec) };
  return { arrow:'↓', delta, direction:'down', cls:'trend-down', text:'↓ -' + absDelta.toFixed(dec) };
}

// Get dates array for a window ending at offsetDays before today
function getDateWindow(windowDays, offsetDays) {
  const dates = [];
  for (let i = 0; i < windowDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

// ── GROWTH VELOCITY (4-week rolling window) ──
function getGrowthVelocity() {
  const wtEntries = growthData.filter(r => r.wt != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const htEntries = growthData.filter(r => r.ht != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const result = { wtGPerWeek:null, htCmPerMonth:null, wtEntryCount:wtEntries.length, htEntryCount:htEntries.length };

  if (wtEntries.length >= 2) {
    const latest = wtEntries[wtEntries.length - 1];
    // Find entry closest to 28 days before latest
    const targetDate = new Date(latest.date);
    targetDate.setDate(targetDate.getDate() - 28);
    let best = wtEntries[0];
    for (const e of wtEntries) {
      if (new Date(e.date) <= targetDate) best = e;
      else break;
    }
    // If best is the same as latest, use the entry before latest
    if (best.date === latest.date && wtEntries.length >= 2) best = wtEntries[wtEntries.length - 2];
    const days = Math.max(1, Math.round((new Date(latest.date) - new Date(best.date)) / 86400000));
    const gainG = Math.round((latest.wt - best.wt) * 1000);
    result.wtGPerWeek = Math.floor((gainG / days) * 7);
    result.wtDays = days;
    result.wtLatest = latest;
    result.wtPrevious = best;
  }

  if (htEntries.length >= 2) {
    const latest = htEntries[htEntries.length - 1];
    const targetDate = new Date(latest.date);
    targetDate.setDate(targetDate.getDate() - 28);
    let best = htEntries[0];
    for (const e of htEntries) {
      if (new Date(e.date) <= targetDate) best = e;
      else break;
    }
    if (best.date === latest.date && htEntries.length >= 2) best = htEntries[htEntries.length - 2];
    const days = Math.max(1, Math.round((new Date(latest.date) - new Date(best.date)) / 86400000));
    const gainCm = latest.ht - best.ht;
    result.htCmPerMonth = +((gainCm / days) * 30.44).toFixed(1);
    result.htDays = days;
  }

  return result;
}

// Growth velocity interpretation
function getGrowthNarrative(velocity) {
  const lines = [];
  const ageM = ageAt().months;

  if (velocity.wtGPerWeek != null) {
    const gw = velocity.wtGPerWeek;
    // WHO-based expected ranges by age (girls, g/week)
    const expectedMin = ageM <= 3 ? 150 : ageM <= 6 ? 100 : ageM <= 9 ? 70 : 55;
    const expectedMax = ageM <= 3 ? 250 : ageM <= 6 ? 180 : ageM <= 9 ? 130 : 100;
    let interp;
    if (gw >= expectedMin && gw <= expectedMax) {
      interp = `gaining ${gw}g/week — healthy pace for ${ageM} months`;
    } else if (gw < expectedMin) {
      interp = `gaining ${gw}g/week — below typical range (${expectedMin}–${expectedMax}g/week). Monitor closely`;
    } else {
      interp = `gaining ${gw}g/week — above typical range (${expectedMin}–${expectedMax}g/week). Likely a growth spurt`;
    }
    const windowText = velocity.wtDays >= 21 ? `over ${Math.round(velocity.wtDays / 7)} weeks` : `over ${velocity.wtDays} days`;
    lines.push(`${zi('scale')} Weight: ${interp} (${windowText})`);
  }

  if (velocity.htCmPerMonth != null) {
    const cm = velocity.htCmPerMonth;
    const expectedMin = ageM <= 3 ? 2.5 : ageM <= 6 ? 1.5 : ageM <= 9 ? 1.2 : 1.0;
    const expectedMax = ageM <= 3 ? 4.0 : ageM <= 6 ? 2.8 : ageM <= 9 ? 2.0 : 1.6;
    let interp;
    if (cm >= expectedMin && cm <= expectedMax) {
      interp = `growing ${cm} cm/month — on track`;
    } else if (cm < expectedMin) {
      interp = `growing ${cm} cm/month — slower than typical (${expectedMin}–${expectedMax})`;
    } else {
      interp = `growing ${cm} cm/month — faster than typical (${expectedMin}–${expectedMax})`;
    }
    lines.push(`${zi('ruler')} Height: ${interp}`);
  }

  return lines;
}

// Percentile tracking narrative
function getPercentileNarrative() {
  const wtEntries = growthData.filter(r => r.wt != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
  if (wtEntries.length < 2) return null;

  const latest = wtEntries[wtEntries.length - 1];
  const moExact = ageMonthsAt(latest.date);
  const ref = getGrowthRef(moExact);
  const currentPct = calcPercentile(latest.wt, ref.w3, ref.w50, ref.w97, ref.w15 != null ? ref.w15 : undefined, ref.w85 != null ? ref.w85 : undefined);

  // Check older entry for trend
  const older = wtEntries.length >= 3 ? wtEntries[Math.floor(wtEntries.length / 2)] : wtEntries[0];
  const olderMo = ageMonthsAt(older.date);
  const olderRef = getGrowthRef(olderMo);
  const olderPct = calcPercentile(older.wt, olderRef.w3, olderRef.w50, olderRef.w97, olderRef.w15 != null ? olderRef.w15 : undefined, olderRef.w85 != null ? olderRef.w85 : undefined);

  const timeDiffWeeks = Math.round((new Date(latest.date) - new Date(older.date)) / (7 * 86400000));
  const timeLabel = timeDiffWeeks >= 4 ? `${Math.round(timeDiffWeeks / 4)} month${Math.round(timeDiffWeeks / 4) > 1 ? 's' : ''}` : `${timeDiffWeeks} weeks`;

  if (currentPct.text === olderPct.text) {
    return `${zi('chart')} Tracking along the ${currentPct.text} percentile for ${timeLabel} — very consistent.`;
  }
  // Try to detect crossing
  const curNum = currentPct.pct || 50;
  const oldNum = olderPct.pct || 50;
  const diff = curNum - oldNum;
  if (Math.abs(diff) <= 10) {
    return `${zi('chart')} Holding steady near the ${currentPct.text} percentile (was ${olderPct.text} ${timeLabel} ago).`;
  }
  if (diff > 0) {
    return `${zi('chart')} Moving up from ${olderPct.text} to ${currentPct.text} percentile over ${timeLabel} — gaining ground.`;
  }
  return `${zi('chart')} Drifted from ${olderPct.text} to ${currentPct.text} percentile over ${timeLabel} — worth monitoring.`;
}

// ── SLEEP TREND (7d vs prior 7d) ──
function getSleepTrend7d() {
  const thisWeek = getDateWindow(7, 0);
  const lastWeek = getDateWindow(7, 7);

  function calcWindowStats(dates) {
    const scores = [], durations = [], wakes = [], bedtimes = [], napCounts = [], napMins = [];
    dates.forEach(ds => {
      const sc = getDailySleepScore(ds);
      if (sc) {
        scores.push(sc.score);
        napCounts.push(sc.napCount);
      }
      const entries = getSleepForDate(ds);
      const nights = entries.filter(e => e.type === 'night');
      const naps = entries.filter(e => e.type === 'nap');
      nights.forEach(n => {
        if (!n.bedtime || !n.wakeTime) return;
        durations.push(calcSleepDuration(n.bedtime, n.wakeTime).total);
        wakes.push(getWakeCount(n));
        const [bh, bm] = n.bedtime.split(':').map(Number);
        if (isNaN(bh)) return;
        let bedMin = bh * 60 + bm;
        if (bh < 6) bedMin += 24 * 60;
        bedtimes.push(bedMin);
      });
      let napTotal = 0;
      naps.forEach(n => { napTotal += calcSleepDuration(n.bedtime, n.wakeTime).total; });
      if (naps.length > 0) napMins.push(napTotal);
    });
    const avg = arr => arr.length === 0 ? null : Math.round(arr.reduce((a,b) => a+b, 0) / arr.length);
    return {
      avgScore: avg(scores),
      avgDuration: avg(durations),
      avgWakes: durations.length > 0 ? +(wakes.reduce((a,b) => a+b, 0) / wakes.length).toFixed(1) : null,
      avgBedtime: avg(bedtimes),
      avgNapCount: scores.length > 0 ? +(napCounts.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : null,
      avgNapMins: avg(napMins),
      dataPoints: scores.length,
    };
  }

  const current = calcWindowStats(thisWeek);
  const previous = calcWindowStats(lastWeek);

  return {
    score: { current: current.avgScore, previous: previous.avgScore, trend: getTrend(current.avgScore, previous.avgScore, 3, 0) },
    duration: { current: current.avgDuration, previous: previous.avgDuration, trend: getTrend(current.avgDuration, previous.avgDuration, 10, 0) },
    wakes: { current: current.avgWakes, previous: previous.avgWakes, trend: getTrend(current.avgWakes, previous.avgWakes, 0.3, 1) },
    bedtime: { current: current.avgBedtime, previous: previous.avgBedtime, trend: getTrend(current.avgBedtime, previous.avgBedtime, 10, 0) },
    napCount: { current: current.avgNapCount, previous: previous.avgNapCount, trend: getTrend(current.avgNapCount, previous.avgNapCount, 0.3, 1) },
    napMins: { current: current.avgNapMins, previous: previous.avgNapMins, trend: getTrend(current.avgNapMins, previous.avgNapMins, 10, 0) },
    dataPoints: current.dataPoints,
  };
}

// Format minutes as bedtime string
function formatBedtimeMin(min) {
  if (min == null) return '—';
  let m = min;
  if (m >= 24 * 60) m -= 24 * 60;
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hh}:${String(mm).padStart(2, '0')} ${ampm}`;
}

// ── SLEEP PATTERN DETECTION ──
function getSleepPatterns() {
  const patterns = [];
  const last14 = getDateWindow(14, 0);

  // Collect night entries from last 14 days
  const nights = [];
  last14.forEach(ds => {
    const entries = getSleepForDate(ds).filter(e => e.type === 'night');
    entries.forEach(n => {
      if (!n.bedtime || !n.wakeTime) return;
      const [bh, bm] = n.bedtime.split(':').map(Number);
      if (isNaN(bh)) return;
      let bedMin = bh * 60 + bm;
      if (bh < 6) bedMin += 24 * 60;
      nights.push({ date: ds, bedMin, wakes: getWakeCount(n), dur: calcSleepDuration(n.bedtime, n.wakeTime).total });
    });
  });

  if (nights.length < 3) return patterns;

  // Pattern: Late bedtime → more wake-ups
  const lateNights = nights.filter(n => n.bedMin > 20.5 * 60); // after 8:30 PM
  const earlyNights = nights.filter(n => n.bedMin <= 20.5 * 60);
  if (lateNights.length >= 2 && earlyNights.length >= 2) {
    const avgWakesLate = +(lateNights.reduce((s,n) => s + n.wakes, 0) / lateNights.length).toFixed(1);
    const avgWakesEarly = +(earlyNights.reduce((s,n) => s + n.wakes, 0) / earlyNights.length).toFixed(1);
    if (avgWakesLate > avgWakesEarly + 0.5) {
      patterns.push({
        icon: zi('clock'),
        text: `Bedtime after 8:30 PM correlates with more wake-ups (${avgWakesLate} avg vs ${avgWakesEarly} when earlier). Consider an earlier bedtime.`,
      });
    }
  }

  // Pattern: Short sleep duration trend
  const recentNights = nights.slice(0, 7);
  const avgDur = recentNights.reduce((s,n) => s + n.dur, 0) / recentNights.length;
  if (avgDur < 9 * 60 && recentNights.length >= 3) {
    const avgH = Math.floor(avgDur / 60);
    const avgM = Math.round(avgDur % 60);
    patterns.push({
      icon: '⏰',
      text: `Average night sleep is ${avgH}h ${avgM}m (last 7 entries) — below the 9–11h target for this age. Overtiredness may be a factor.`,
    });
  }

  // Pattern: Frequent wake-ups (3+ average)
  const avgWakes = +(recentNights.reduce((s,n) => s + n.wakes, 0) / recentNights.length).toFixed(1);
  if (avgWakes >= 3 && recentNights.length >= 3) {
    patterns.push({
      icon: zi('moon'),
      text: `Averaging ${avgWakes} wake-ups per night. Common causes: teething, hunger, room temperature, or sleep associations that need resettling.`,
    });
  }

  // Pattern: Improving trend
  if (nights.length >= 6) {
    const first3 = nights.slice(-3);
    const last3 = nights.slice(0, 3);
    const avgFirst = first3.reduce((s,n) => s + n.wakes, 0) / 3;
    const avgLast = last3.reduce((s,n) => s + n.wakes, 0) / 3;
    if (avgFirst - avgLast >= 1) {
      patterns.push({
        icon: zi('party'),
        text: `Wake-ups are improving! Down from ${avgFirst.toFixed(1)} to ${avgLast.toFixed(1)} avg over the past 2 weeks. Keep it up!`,
      });
    }
  }

  return patterns;
}

// ── POOP TREND (7d vs prior 7d) ──
function getPoopTrend7d() {
  const thisWeek = getDateWindow(7, 0);
  const lastWeek = getDateWindow(7, 7);

  function calcWindowStats(dates) {
    let totalCount = 0;
    const colorCounts = {};
    const consCounts = {};
    const gaps = [];
    let allPoops = [];

    dates.forEach(ds => {
      const dayPoops = getPoopsForDate(ds);
      totalCount += dayPoops.length;
      dayPoops.forEach(p => {
        colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
        consCounts[p.consistency] = (consCounts[p.consistency] || 0) + 1;
        allPoops.push(p);
      });
    });

    // Most common
    const topColor = Object.entries(colorCounts).sort((a,b) => b[1] - a[1])[0];
    const topCons = Object.entries(consCounts).sort((a,b) => b[1] - a[1])[0];

    // Longest gap
    const sorted = allPoops.sort((a,b) => {
      const cmp = (a.date||'').localeCompare(b.date||'');
      return cmp !== 0 ? cmp : (a.time || '').localeCompare(b.time || '');
    });
    let maxGapH = 0;
    for (let i = 1; i < sorted.length; i++) {
      const t1 = new Date(sorted[i-1].date + 'T' + (sorted[i-1].time || '12:00'));
      const t2 = new Date(sorted[i].date + 'T' + (sorted[i].time || '12:00'));
      const gapH = Math.floor((t2 - t1) / 3600000);
      if (gapH > maxGapH) maxGapH = gapH;
    }

    return {
      avgPerDay: dates.length > 0 ? +(totalCount / dates.length).toFixed(1) : 0,
      total: totalCount,
      topColor: topColor ? topColor[0] : null,
      topColorCount: topColor ? topColor[1] : 0,
      topCons: topCons ? topCons[0] : null,
      topConsCount: topCons ? topCons[1] : 0,
      longestGapH: maxGapH,
      colorDist: colorCounts,
    };
  }

  const current = calcWindowStats(thisWeek);
  const previous = calcWindowStats(lastWeek);

  return {
    freq: { current: current.avgPerDay, previous: previous.avgPerDay, trend: getTrend(current.avgPerDay, previous.avgPerDay, 0.3, 1) },
    topColor: current.topColor,
    topColorCount: current.topColorCount,
    topCons: current.topCons,
    topConsCount: current.topConsCount,
    longestGapH: current.longestGapH,
    colorDist: current.colorDist,
    totalThisWeek: current.total,
    totalLastWeek: previous.total,
  };
}

// ── FEEDING TREND (7d vs prior 7d) ──
function getFeedingTrend7d() {
  const thisWeek = getDateWindow(7, 0);
  const lastWeek = getDateWindow(7, 7);

  function calcWindowStats(dates) {
    let mealsLogged = 0;
    const foodSet = new Set();
    dates.forEach(ds => {
      const entry = feedingData[ds];
      if (entry) {
        ['breakfast','lunch','dinner','snack'].forEach(meal => {
          if (entry[meal]) {
            mealsLogged++;
            // Extract food names from meal text
            const text = entry[meal];
            if (text) {
              text.split(/[,+&;]/).forEach(f => {
                const clean = f.trim().toLowerCase();
                if (clean.length > 1) foodSet.add(clean);
              });
            }
          }
        });
      }
    });
    return { mealsLogged, uniqueFoods: foodSet.size, foodSet };
  }

  const current = calcWindowStats(thisWeek);
  const previous = calcWindowStats(lastWeek);

  return {
    meals: { current: current.mealsLogged, previous: previous.mealsLogged, trend: getTrend(current.mealsLogged, previous.mealsLogged, 1, 0) },
    variety: { current: current.uniqueFoods, previous: previous.uniqueFoods, trend: getTrend(current.uniqueFoods, previous.uniqueFoods, 1, 0) },
    varietyScore: current.uniqueFoods > 0 ? +(current.uniqueFoods / 7).toFixed(1) : 0,
  };
}

// ── PULSE NARRATIVE ──
function getPulseNarrative() {
  const parts = [];
  const { months, days } = preciseAge();

  // Weight
  const latestWt = getLatestWeight();
  if (latestWt) {
    const moExact = ageMonthsAt(latestWt.date);
    const ref = getGrowthRef(moExact);
    const pct = calcPercentile(latestWt.wt, ref.w3, ref.w50, ref.w97);
    parts.push(`weight at ${latestWt.wt} kg (${pct.text} percentile)`);
  }

  // Sleep
  const sleepTrend = getSleepTrend7d();
  if (sleepTrend.score.current != null) {
    const dir = sleepTrend.score.trend.direction;
    const scoreWord = sleepTrend.score.current >= 70 ? 'good' : sleepTrend.score.current >= 40 ? 'fair' : 'needs attention';
    const trendWord = dir === 'up' ? ', improving' : dir === 'down' ? ', declining' : '';
    parts.push(`sleep score ${sleepTrend.score.current}/100 (${scoreWord}${trendWord})`);
  }

  // Poop
  const poopTrend = getPoopTrend7d();
  if (poopTrend.freq.current > 0) {
    const normal = poopTrend.freq.current >= 1 && poopTrend.freq.current <= 4;
    parts.push(`${poopTrend.freq.current}/day poops${normal ? ' (normal)' : ''}`);
  }

  // Feeding
  const feedTrend = getFeedingTrend7d();
  if (feedTrend.variety.current > 0) {
    parts.push(`${feedTrend.variety.current} unique foods this week`);
  }

  if (parts.length === 0) return 'Start logging data to see weekly insights here!';
  return `This week at ${months}m ${days}d: ${parts.join(', ')}.`;
}

// ── STAT PILL TREND UPDATER ──
function updateStatPillTrends() {
  // Weight trend
  const wtTrendEl = document.getElementById('homeTrendWeight');
  if (wtTrendEl) {
    const wtEntries = growthData.filter(r => r.wt != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
    if (wtEntries.length >= 2) {
      const latest = wtEntries[wtEntries.length - 1];
      const targetDate = new Date(latest.date);
      targetDate.setDate(targetDate.getDate() - 28);
      let prev = wtEntries[0];
      for (const e of wtEntries) {
        if (new Date(e.date) <= targetDate) prev = e;
        else break;
      }
      if (prev.date === latest.date && wtEntries.length >= 2) prev = wtEntries[wtEntries.length - 2];
      const trend = getTrend(latest.wt, prev.wt, 0.05, 2);
      wtTrendEl.className = 'hsp-trend ' + trend.cls;
      wtTrendEl.textContent = trend.text ? trend.text + ' kg' : '';
    } else {
      wtTrendEl.textContent = '';
    }
  }

  // Height trend
  const htTrendEl = document.getElementById('homeTrendHeight');
  if (htTrendEl) {
    const htEntries = growthData.filter(r => r.ht != null).sort((a,b) => (a.date||'').localeCompare(b.date||''));
    if (htEntries.length >= 2) {
      const latest = htEntries[htEntries.length - 1];
      const targetDate = new Date(latest.date);
      targetDate.setDate(targetDate.getDate() - 28);
      let prev = htEntries[0];
      for (const e of htEntries) {
        if (new Date(e.date) <= targetDate) prev = e;
        else break;
      }
      if (prev.date === latest.date && htEntries.length >= 2) prev = htEntries[htEntries.length - 2];
      const trend = getTrend(latest.ht, prev.ht, 0.5, 1);
      htTrendEl.className = 'hsp-trend ' + trend.cls;
      htTrendEl.textContent = trend.text ? trend.text + ' cm' : '';
    } else {
      htTrendEl.textContent = '';
    }
  }

  // Sleep score trend (7d vs prior 7d)
  const slTrendEl = document.getElementById('homeTrendSleep');
  if (slTrendEl) {
    const sleepT = getSleepTrend7d();
    if (sleepT.score.current != null && sleepT.score.previous != null) {
      const t = sleepT.score.trend;
      slTrendEl.className = 'hsp-trend ' + t.cls;
      slTrendEl.textContent = t.text ? t.text + ' pts' : '';
    } else {
      slTrendEl.textContent = '';
    }
  }

  // Poop trend (avg/day 7d vs prior 7d)
  const ppTrendEl = document.getElementById('homeTrendPoop');
  if (ppTrendEl) {
    const poopT = getPoopTrend7d();
    if (poopT.freq.current > 0 || poopT.freq.previous > 0) {
      ppTrendEl.className = 'hsp-trend trend-flat';
      ppTrendEl.textContent = `avg ${poopT.freq.current}/d`;
    } else {
      ppTrendEl.textContent = '';
    }
  }
}

// ══════════════════════════════════════════════════════════════

// PWA — SERVICE WORKER & INSTALL
// ─────────────────────────────────────────

// Register a minimal service worker for PWA installability
if ('serviceWorker' in navigator) {
  // Create an inline service worker via blob URL
  const swCode = `
    self.addEventListener('install', e => self.skipWaiting());
    self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', e => {
      // Network-first strategy — offline fallback not needed for this app
      e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status:503 })));
    });
  `;
  const swBlob = new Blob([swCode], { type: 'application/javascript' });
  const swURL = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swURL, { scope: '/sproutlab/beta/' }).catch(() => {
    // Blob SW may fail due to scope restrictions — that's fine,
    // PWA will still work with manifest for add-to-homescreen on most browsers
  });
}

// Capture the beforeinstallprompt for "Add to Home Screen" button
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  // Show install button in settings if available
  const btn = document.getElementById('pwaInstallBtn');
  if (btn) btn.style.display = '';
});

function promptPWAInstall() {
  if (_deferredInstallPrompt) {
    _deferredInstallPrompt.prompt();
    _deferredInstallPrompt.userChoice.then(() => {
      _deferredInstallPrompt = null;
      const btn = document.getElementById('pwaInstallBtn');
      if (btn) btn.style.display = 'none';
    });
  }
}

// Detect if running as installed PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// ═══════════════════════════════════════════════════
// ██ BUG CAPTURE SYSTEM
// ═══════════════════════════════════════════════════

// ── Action log (rolling buffer of last 10 actions) ──
let _bugActionLog = [];
const BUG_ACTION_LOG_MAX = 10;

function _bugLogAction(action, arg) {
  _bugActionLog.push({
    action: action,
    arg: arg || null,
    time: new Date().toLocaleTimeString('en-IN', { hour12: false })
  });
  if (_bugActionLog.length > BUG_ACTION_LOG_MAX) _bugActionLog.shift();
}

// ── Error capture ──
let _bugLastError = null;
let _bugLastErrorTime = 0;
let _bugLastAutoPrompt = 0;

window.onerror = function(msg, source, line, col, error) {
  _bugLastError = {
    message: String(msg).substring(0, 200),
    source: (source || '').split('/').pop(),
    line: line,
    col: col,
    stack: error && error.stack ? error.stack.substring(0, 500) : ''
  };
  _bugLastErrorTime = Date.now();

  // Auto-prompt (Path C) — throttled, not in Simple Mode
  var simple = false;
  try { simple = isSimpleMode(); } catch(e2) {}
  if (!simple && Date.now() - _bugLastAutoPrompt > 300000) {
    _bugLastAutoPrompt = Date.now();
    _bugShowAutoPrompt();
  }
};

window.onunhandledrejection = function(event) {
  var reason = event.reason;
  _bugLastError = {
    message: String(reason && reason.message ? reason.message : reason).substring(0, 200),
    source: 'promise',
    line: 0,
    col: 0,
    stack: reason && reason.stack ? reason.stack.substring(0, 500) : ''
  };
  _bugLastErrorTime = Date.now();
};

// ── State snapshot ──
function _bugCaptureState() {
  var currentTab = 'home';
  try {
    var tabs = ['home','growth','track','insights','info'];
    for (var i = 0; i < tabs.length; i++) {
      var p = document.getElementById('tab-' + tabs[i]);
      if (p && p.classList.contains('active')) { currentTab = tabs[i]; break; }
    }
  } catch(e) {}

  var subTab = null;
  try { if (currentTab === 'track') subTab = _activeTrackSub || null; } catch(e) {}

  var zivaScore = null;
  var domainScores = {};
  try {
    // Use last-known scores to avoid expensive recalculation during crash context
    // _lastKnownScores is already maintained by calcZivaScore on every render cycle
    if (typeof _lastKnownScores !== 'undefined') {
      Object.keys(_lastKnownScores).forEach(function(k) {
        if (_lastKnownScores[k] !== null) domainScores[k] = _lastKnownScores[k];
      });
    }
    // Grab the displayed Ziva Score from the DOM if available
    var scoreEl = document.getElementById('zsNumber');
    if (scoreEl && scoreEl.textContent) {
      var parsed = parseInt(scoreEl.textContent, 10);
      if (!isNaN(parsed)) zivaScore = parsed;
    }
  } catch(e) {}

  var activeAlertCount = 0;
  try {
    var alertEls = document.querySelectorAll('.al-card');
    activeAlertCount = alertEls ? alertEls.length : 0;
  } catch(e) {}

  var activeIllness = null;
  try { activeIllness = _obGetActiveIllness(); } catch(e) {}

  var outingPlanned = false;
  try { outingPlanned = !!_tomorrowOuting; } catch(e) {}

  var dataDays = 0;
  try { dataDays = countDataDays(); } catch(e) {}

  var modWeight = 0;
  try { modWeight = getModifierWeight(); } catch(e) {}

  return {
    build: 'v2.31',
    timestamp: new Date().toISOString(),
    tab: currentTab,
    subTab: subTab,
    simpleMode: isSimpleMode(),
    darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
    screen: window.innerWidth + 'x' + window.innerHeight,
    dpr: window.devicePixelRatio || 1,
    userAgent: navigator.userAgent,
    zivaScore: zivaScore,
    domainScores: domainScores,
    dataDays: dataDays,
    modifierWeight: modWeight,
    activeAlerts: activeAlertCount,
    activeIllness: activeIllness,
    outingPlanned: outingPlanned,
    recentActions: _bugActionLog.slice()
  };
}

// ── Format for WhatsApp / clipboard ──
function _bugFormatMessage(state, description, errorObj) {
  var d = new Date();
  var dateStr = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  var timeStr = d.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit', hour12:true });

  var lines = [];
  lines.push('*SproutLab Bug Report*');
  lines.push('Build: ' + state.build + ' \u00B7 ' + dateStr + ', ' + timeStr);
  lines.push('');

  if (description) {
    lines.push('*What happened:*');
    lines.push(description);
    lines.push('');
  }

  lines.push('*Context:*');
  lines.push('Tab: ' + state.tab + (state.subTab ? ' > ' + state.subTab : '') +
    ' \u00B7 ' + (state.darkMode ? 'Dark' : 'Light') + ' mode' +
    ' \u00B7 Essential Mode ' + (state.simpleMode ? 'ON' : 'OFF'));
  lines.push('Screen: ' + state.screen + ' \u00B7 DPR: ' + state.dpr);

  if (state.zivaScore !== null) {
    lines.push('Ziva Score: ' + state.zivaScore + ' \u00B7 Data: ' + state.dataDays + ' days');
  }
  if (state.modifierWeight > 0) {
    lines.push('Modifier: ' + Math.round(state.modifierWeight * 100) + '% active');
  }
  if (state.activeAlerts > 0) lines.push('Active alerts: ' + state.activeAlerts);
  if (state.activeIllness) lines.push('Active illness: ' + state.activeIllness);
  if (state.outingPlanned) lines.push('Outing planned');
  lines.push('');

  if (state.recentActions.length > 0) {
    lines.push('*Last actions:*');
    state.recentActions.forEach(function(a) {
      lines.push(a.time + ' ' + a.action + (a.arg ? '(' + a.arg + ')' : ''));
    });
    lines.push('');
  }

  if (errorObj) {
    lines.push('*Error:*');
    lines.push(errorObj.message);
    if (errorObj.line) lines.push('Line ' + errorObj.line + ' \u00B7 ' + (errorObj.source || ''));
    if (errorObj.stack) lines.push('Stack: ' + errorObj.stack.substring(0, 300));
  }

  return lines.join('\n');
}

// ── Render context section inside modal ──
function _bugRenderContext(state) {
  var el = document.getElementById('bugContextSection');
  if (!el) return;

  var html = '<div class="bug-context-title"><span class="icon icon-amber">' + zi('scope') + '</span> CAPTURED CONTEXT</div>';

  html += '<div class="bug-context-row">';
  html += '<span class="bug-context-label">Tab:</span> ' + escHtml(state.tab);
  if (state.subTab) html += ' &rsaquo; ' + escHtml(state.subTab);
  html += ' &middot; ' + (state.darkMode ? 'Dark' : 'Light') + ' mode';
  html += ' &middot; Essential Mode ' + (state.simpleMode ? 'ON' : 'OFF');
  html += '</div>';

  html += '<div class="bug-context-row"><span class="bug-context-label">Build:</span> ' + escHtml(state.build) +
    ' &middot; Screen: ' + escHtml(state.screen) + '</div>';

  if (state.zivaScore !== null) {
    html += '<div class="bug-context-row"><span class="bug-context-label">Ziva Score:</span> ' + state.zivaScore +
      ' &middot; Data days: ' + state.dataDays + '</div>';
  }

  if (state.recentActions.length > 0) {
    var showCount = Math.min(state.recentActions.length, 3);
    var recent = state.recentActions.slice(-showCount);
    html += '<div class="bug-context-row"><span class="bug-context-label">Last ' + showCount + ' actions:</span></div>';
    recent.forEach(function(a) {
      html += '<div class="bug-context-row bug-context-action">' +
        escHtml(a.time) + ' ' + escHtml(a.action) + (a.arg ? '(' + escHtml(a.arg) + ')' : '') + '</div>';
    });
  }

  el.innerHTML = html;
}

// ── Render error section inside modal ──
function _bugRenderError(errorObj) {
  var el = document.getElementById('bugErrorSection');
  if (!el) return;

  if (!errorObj) {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';

  var agoSec = Math.round((Date.now() - _bugLastErrorTime) / 1000);
  var agoStr = agoSec < 60 ? agoSec + ' seconds ago' : Math.round(agoSec / 60) + ' minutes ago';

  var html = '<div class="bug-error-title"><span class="icon icon-rose">' + zi('siren') + '</span> ERROR DETECTED</div>';
  html += '<div class="bug-error-msg">' + escHtml(errorObj.message) + '</div>';
  html += '<div class="bug-error-meta">';
  if (errorObj.line) html += 'Line ' + errorObj.line;
  if (errorObj.source) html += ' &middot; ' + escHtml(errorObj.source);
  html += ' &middot; ' + agoStr;
  html += '</div>';

  el.innerHTML = html;
}

// ── Open / Close bug reporter ──
let _bugCapturedState = null;

function openBugReporter(fromAutoPrompt) {
  _bugCapturedState = _bugCaptureState();

  var subtitleEl = document.getElementById('bugSubtitle');
  if (subtitleEl) {
    var d = new Date();
    subtitleEl.textContent = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit', hour12:true });
  }

  var textarea = document.getElementById('bugDescription');
  if (textarea) {
    textarea.value = '';
    if (fromAutoPrompt && _bugLastError) {
      textarea.placeholder = 'The app encountered an error. What were you trying to do?';
    } else {
      textarea.placeholder = 'Describe what you saw or what is not working.';
    }
  }

  // Decide error to show: only if recent (< 5 min)
  var errorToShow = null;
  if (_bugLastError && (Date.now() - _bugLastErrorTime) < 300000) {
    errorToShow = _bugLastError;
  }

  _bugRenderContext(_bugCapturedState);
  _bugRenderError(errorToShow);

  var overlay = document.getElementById('bugOverlay');
  if (overlay) overlay.classList.add('open');
}

function closeBugReporter() {
  var overlay = document.getElementById('bugOverlay');
  if (overlay) overlay.classList.remove('open');
  _bugCapturedState = null;
}

// ── Send via WhatsApp ──
function _bugSendWhatsApp() {
  if (!_bugCapturedState) return;
  var desc = (document.getElementById('bugDescription') || {}).value || '';
  var errorObj = (_bugLastError && (Date.now() - _bugLastErrorTime) < 300000) ? _bugLastError : null;
  var text = _bugFormatMessage(_bugCapturedState, desc, errorObj);

  if (navigator.share) {
    navigator.share({ title: 'SproutLab Bug Report', text: text }).catch(function() {
      _bugOpenWhatsApp(text);
    });
  } else {
    _bugOpenWhatsApp(text);
  }
  closeBugReporter();
}

function _bugOpenWhatsApp(text) {
  var phone = _bugGetPhone();
  var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  window.open(url, '_blank');
}

function _bugGetPhone() {
  return localStorage.getItem(KEYS.bugReportPhone) || '918709688336';
}

// ── Copy to clipboard ──
function _bugCopyClipboard() {
  if (!_bugCapturedState) return;
  var desc = (document.getElementById('bugDescription') || {}).value || '';
  var errorObj = (_bugLastError && (Date.now() - _bugLastErrorTime) < 300000) ? _bugLastError : null;
  var text = _bugFormatMessage(_bugCapturedState, desc, errorObj);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showQLToast(zi('check') + ' Bug report copied');
    }).catch(function() {
      _bugFallbackCopy(text);
    });
  } else {
    _bugFallbackCopy(text);
  }
  closeBugReporter();
}

function _bugFallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showQLToast(zi('check') + ' Bug report copied'); }
  catch(e) { showQLToast(zi('warn') + ' Copy failed'); }
  document.body.removeChild(ta);
}

// ── Auto-prompt (Path C) ──
function _bugShowAutoPrompt() {
  var el = document.getElementById('bugAutoPrompt');
  if (!el) return;
  el.classList.add('open');
  _bugAutoPromptTimer = setTimeout(function() {
    _bugDismissAutoPrompt();
  }, 8000);
}
let _bugAutoPromptTimer = null;

function _bugDismissAutoPrompt() {
  var el = document.getElementById('bugAutoPrompt');
  if (el) el.classList.remove('open');
  if (_bugAutoPromptTimer) { clearTimeout(_bugAutoPromptTimer); _bugAutoPromptTimer = null; }
}

// ── FAB long-press (Path B) ──
let _bugFabPressTimer = null;
let _bugFabStartX = 0;
let _bugFabStartY = 0;
let _bugFabDidLongPress = false;

function _bugInitFabLongPress() {
  var fab = document.getElementById('qlFab');
  if (!fab) return;

  fab.addEventListener('pointerdown', function(e) {
    _bugFabStartX = e.clientX;
    _bugFabStartY = e.clientY;
    _bugFabDidLongPress = false;
    _bugFabPressTimer = setTimeout(function() {
      _bugFabPressTimer = null;
      _bugFabDidLongPress = true;
      openBugReporter();
    }, 500);
  });

  fab.addEventListener('pointerup', function() {
    if (_bugFabPressTimer) { clearTimeout(_bugFabPressTimer); _bugFabPressTimer = null; }
  });
  fab.addEventListener('pointercancel', function() {
    if (_bugFabPressTimer) { clearTimeout(_bugFabPressTimer); _bugFabPressTimer = null; }
  });
  fab.addEventListener('pointermove', function(e) {
    // Cancel if finger moves too far (accidental drag)
    if (_bugFabPressTimer) {
      var dx = Math.abs(e.clientX - _bugFabStartX);
      var dy = Math.abs(e.clientY - _bugFabStartY);
      if (dx > 10 || dy > 10) {
        clearTimeout(_bugFabPressTimer);
        _bugFabPressTimer = null;
      }
    }
  });

  // Intercept click after long-press to prevent toggleQuickLog from firing
  fab.addEventListener('click', function(e) {
    if (_bugFabDidLongPress) {
      e.preventDefault();
      e.stopImmediatePropagation();
      _bugFabDidLongPress = false;
    }
  }, true); // capture phase — runs before delegation handler
}

// ── First-time tooltip ──
function _bugShowTooltipIfNew() {
  if (localStorage.getItem(KEYS.bugTooltipSeen)) return;
  var el = document.getElementById('bugTooltip');
  if (!el) return;

  setTimeout(function() {
    el.classList.add('open');
    setTimeout(function() {
      _bugDismissTooltip();
    }, 10000);
  }, 2000); // slight delay after app load
}

function _bugDismissTooltip() {
  var el = document.getElementById('bugTooltip');
  if (el) el.classList.remove('open');
  localStorage.setItem(KEYS.bugTooltipSeen, '1');
}

// ── Init ──
function _bugInit() {
  _bugInitFabLongPress();
  _bugShowTooltipIfNew();
}
