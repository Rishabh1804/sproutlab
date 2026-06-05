// ─────────────────────────────────────────
// FIREBASE CONFIG — loaded before core.js
// API key is client-side by design (§4.1 #6)
// Security enforced via Firestore rules (§10)
// ─────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyCFzxOIvPNY8Va7aH3cLwE2D9rh95IidRo',
  authDomain:        'sproutlab-0409.firebaseapp.com',
  projectId:         'sproutlab-0409',
  storageBucket:     'sproutlab-0409.firebasestorage.app',
  messagingSenderId: '494337592066',
  appId:             '1:494337592066:web:82fcd794422c096915d01b'
};

// Stable-id slug for default milestones. Pure / deterministic.
// Lives in config.js (not core.js) because data.js calls it at parse
// time when baking DEFAULT_MILESTONES — and concat order puts data.js
// BEFORE core.js. (PR-ε.0 §0a — Kael v4 audit.)
function slugify(text) {
  const out = String(text || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out || ('ms-fallback-' + Math.random().toString(36).slice(2, 10));
}

// ─────────────────────────────────────────
// SYMPTOM CHECKER — RENDER-POLICY (D2 phase-spec §2.5/§2.11)
// Per SG-D2-CONFIG-MODULE (ratified) + Kael A-D2-K-5: render-policy
// constants co-locate here, NOT in medical.js. Eliminates the drift
// hazard where a content edit in data.js silently breaks renderer
// behaviour. Build-time order: config.js → data.js → medical.js.
// ─────────────────────────────────────────

const EMERGENCY_CONTACTS = {
  jamshedpur: {
    label: 'Jamshedpur',
    ambulancePrimary:  { number: '108', service: 'National Ambulance Service' },
    emergencyFallback: { number: '112', service: 'Comprehensive Emergency' },
    altAmbulanceServices: [
      { number: '9931114901',      service: 'Gouri Shankar Ambulance (Mango)' },
      { number: '+91 88829 78888', service: 'Medulance (24/7)' }
    ],
    hospitals: [
      { name: 'Tata Main Hospital (TMH)',       number: '0657 6644444' },
      { name: 'MGM Medical College & Hospital', number: '0657 2360859' },
      { name: 'Elite Hospital (Mango)',         number: '0657 6510307' }
    ]
  }
};
const DEFAULT_REGION = 'jamshedpur';

// Maren C-D2-M-6 fold: currentRegion returns a region-context object
// with a confidence flag. Until D3 ships the settings-panel region
// override, every user gets confidence:'default' — renderer suppresses
// the hospital list to avoid presenting Jamshedpur-specific phone
// numbers to a non-Jamshedpur parent. 108/112 CTAs remain (108 national).
function currentRegion() {
  return {
    region: EMERGENCY_CONTACTS[DEFAULT_REGION] ? DEFAULT_REGION : 'jamshedpur',
    confidence: 'default'
  };
}

// SEQUENCE_CRITICAL_IDS: entries whose whatToDo order carries safety
// meaning under stress. Renderer emits <ol> for these ids; <ul> for
// others. Initial set was 7 ids per Maren C-D2-M-1 P0 fold. Post-D2-B
// Aurelius proposal + Maren V-M5 CONFIRM (PR #73 R1 sign-off): removed
// `vomiting` and `fever-high` (cosmetic-order on inspection); added
// `allergic-reaction` (stop-food → assess-airway → call → record).
const SEQUENCE_CRITICAL_IDS = [
  'fall-injury',
  'choking',
  'seizure',
  'breathing-difficulty',
  'head-injury',
  'allergic-reaction'
];

// G-D2-9 boot-time assertion: every id in SEQUENCE_CRITICAL_IDS must
// resolve to a SYMPTOM_DB entry. Deferred via setTimeout(0) because
// config.js loads BEFORE data.js per build.sh; SYMPTOM_DB doesn't
// exist at module-eval time. Dev-mode only (no production noise).
function _scAssertSequenceIds() {
  if (typeof SYMPTOM_DB === 'undefined') return;
  var unresolved = SEQUENCE_CRITICAL_IDS.filter(function(id) {
    return !SYMPTOM_DB.some(function(e) { return e.id === id; });
  });
  if (unresolved.length && typeof window !== 'undefined' && window.SPROUTLAB_DEV_MODE) {
    console.warn('[sc-config] SEQUENCE_CRITICAL_IDS unresolved against SYMPTOM_DB:', unresolved);
  }
}
if (typeof window !== 'undefined') {
  setTimeout(_scAssertSequenceIds, 0);
}

// ─────────────────────────────────────────
// GENERAL_EMERGENCIES — content registry for the landing's General
// Emergency Room (lean-landing-v1 §5.3). Structure is Kael's; the
// first-aid COPY is Maren's BLOCKING floor (§5.3 Safety floor): every
// item's `immediate` steps lead with the call, `call112When` lists the
// red flags (null = call-always for the time-critical items), and
// `source` carries the authority citation. No invented clinical prose —
// all copy is faithful to the cited bodies (NHS / British Red Cross /
// St John Ambulance / NICE NG232 / Resuscitation Council UK).
//
// Content provenance: each entry was adversarially fact-checked against
// current authoritative guidance (deep-research pass, 2026-06-05; key
// claims then primary-source-verified via Firecrawl scrape of the live
// source pages). That pass folded: RCUK 2025 infant CPR + choking
// technique (two-finger → two-THUMB encircling); EpiPen hold-time 10s →
// 3s (device-specific); anaphylaxis lie-flat-legs-raised default; burns
// hypothermia/keep-warm caveat; bleeding limb-elevation (deprecated) →
// leg-raise-for-shock; seizure do-not-move; head-injury infant fall
// threshold + tense-fontanelle / scalp-injury red flags. NUMBERS are
// India-localised (112 unified / 108 ambulance, EMERGENCY_CONTACTS) — the
// PROTOCOLS are UK-sourced (clearest public infant first-aid).
//
// VERIFIED (primary source, 2026-06-05):
//   • Two-thumb infant CPR + choking chest-thrust — confirmed against RCUK
//     live public guidance (resus.org.uk/public-resource/how-do-cpr:
//     "two-thumb encircling technique … both thumbs together in the centre
//     of the chest, hands encircling the chest"; fallback for a lone
//     rescuer is one/two-hand for children >1yr, NOT two-finger) + the 2025
//     paediatric BLS guideline (chest thrusts "as advised for chest
//     compressions, but compressing the sternum more sharply").
//   • EpiPen 3s — confirmed against FDA DailyMed prescribing info + Teva +
//     AAP (healthychildren.org).
//   NOTE: the NHS public CPR page STILL shows the older two-finger infant
//     method, so two UK authorities currently disagree; we cite RCUK (the
//     resuscitation authority) for that line, not NHS. Pediatrician
//     sign-off remains desirable but is no longer a blocking uncertainty.
//
// Render policy:
//   severity 'critical' → pinned-open, hottest, exempt from the accordion
//                         (one item per the locked §5.3 wireframe).
//   severity 'urgent'/'serious' → both render as non-critical accordion
//                         items today (render keys only on 'critical'); the
//                         call chip is driven by callLead, not severity. The
//                         tiers are retained as a content-priority label (N-1).
//   callLead:true       → row shows a "Call 112 now" lead chip even
//                         COLLAPSED (V-3), so the action shows without a tap.
//   call112When:null    → unconditional-call item; the loud "Call 112"
//                         band reads `call112Label` when present, else the
//                         default "Call 112 immediately." (B-1: lets the
//                         unresponsive item carry the lone-rescuer conditional
//                         in the chip itself instead of contradicting it).
//   xlink               → cross-link out (choking-object → food room).
//
// Ordering (M-5 reconciliation): life-threat-first, ids aligned with
// SYMPTOM_DB where they overlap (choking / seizure / head-injury /
// allergic-reaction). Distinct registry from SEQUENCE_CRITICAL_IDS (that
// governs the symptom-checker's whatToDo <ol> step-order); this governs
// the Room's item order. Builder proposal for the Maren audit:
//   • M-4 anaphylaxis ruled IN — Ziva is in active allergen introduction;
//     a sudden airway / whole-body reaction is distinct from choking and
//     poison and the food-room cross-link does not cover it (§5.3 M-4).
//   • Only `unresponsive` is pinned-open per the locked wireframe;
//     anaphylaxis / choking / seizure are urgent + callLead (call chip
//     visible collapsed). Maren to confirm or promote any to critical.
const GENERAL_EMERGENCIES = [
  {
    id: 'unresponsive', icon: 'heart', name: 'Not breathing / unresponsive',
    severity: 'critical', callLead: true,
    immediate: [
      'Shout for help. Someone with you? Have them call 112 now while you start. On your own? Give 1 minute of CPR (steps below) first, then call.',
      'Head to neutral, clear any obvious blockage, then give 5 rescue breaths — seal your mouth over baby’s mouth and nose and blow gently over 1 second until the chest rises.',
      '30 chest compressions: both thumbs together on the centre of the breastbone, hands encircling the chest, push about 4 cm deep (a third of the way) and fast (100–120 a minute) — then 2 breaths. Keep the 30:2 cycle going until help arrives.'
    ],
    call112When: null,
    call112Label: 'Call 112 now — or after 1 minute of CPR if you’re alone.',
    source: 'Resuscitation Council UK 2025 · NHS'
  },
  {
    id: 'allergic-reaction', icon: 'alert-circle', name: 'Severe allergic reaction',
    severity: 'urgent', callLead: true,
    immediate: [
      'If an adrenaline auto-injector (e.g. EpiPen) has been prescribed, use it now — into the outer thigh and hold it in place (EpiPen 3 seconds; if unsure, count to 10). Most families won’t have one — if not, go straight to the next step.',
      'Call 112 and say “anaphylaxis”. Lay baby down and raise their legs; if breathing is hard, raise the shoulders or sit them up slightly instead; if vomiting, lay them on their side. Never stand or walk them.',
      'No better after 5 minutes, or getting worse? Give a second auto-injector — in the other thigh — if you have one.'
    ],
    call112When: [
      'Swelling of the lips, tongue, throat or face',
      'Noisy or struggling breathing, wheeze, or a hoarse cry',
      'Pale, blue, floppy, or suddenly drowsy / unresponsive'
    ],
    source: 'NHS'
  },
  {
    id: 'choking', icon: 'warn', name: 'Choking (object)',
    severity: 'urgent', callLead: true,
    immediate: [
      'Lay baby face-down along your forearm, head low. Give up to 5 sharp back blows between the shoulder blades with the heel of your hand — check the mouth after each.',
      'Still stuck? Turn baby face-up, both thumbs together on the breastbone just below the nipple line (hands around the chest), give up to 5 sharp chest thrusts — check the mouth after each.',
      'Never use abdominal thrusts on a baby, and do not sweep the mouth blindly. Repeat 5 back blows + 5 chest thrusts; call 112 if it does not clear. Even once it clears, get baby checked — chest thrusts can injure inside.'
    ],
    call112When: [
      'The blockage does not clear after the first cycles',
      'Baby becomes limp, silent, or stops breathing → start CPR (top of this list)'
    ],
    xlink: { label: 'Choking on food? →' },
    source: 'Resuscitation Council UK 2025 · NHS · British Red Cross'
  },
  {
    id: 'seizure', icon: 'bolt', name: 'Seizure / fit',
    severity: 'urgent', callLead: true,
    immediate: [
      'Note the time it starts. Cushion the head and pad around them with something soft; move hard objects away. Do not lift or move baby unless they are in danger.',
      'Do not restrain them and do not put anything in their mouth.',
      'When it stops, turn baby onto their side (recovery position) and check nothing is blocking the mouth.'
    ],
    call112When: [
      'It is the first seizure, or it lasts more than 5 minutes',
      'Trouble breathing, one-sided stiffness or twitching, or another seizure follows',
      'Stays very drowsy or unresponsive more than 1 hour afterwards'
    ],
    source: 'NHS'
  },
  {
    id: 'head-injury', icon: 'fall', name: 'Bad fall / head injury',
    severity: 'serious', callLead: false,
    immediate: [
      'Hold something cold (e.g. frozen veg in a tea towel) to the bump for up to 20 minutes.',
      'Keep baby calm and resting; a responsible adult should stay with them and check closely for at least the first 24 hours.'
    ],
    call112When: [
      'Was knocked out, even briefly, or is hard to wake / very drowsy',
      'Repeated vomiting, a fit, or fluid or blood from the nose or ears',
      'A tense or bulging soft spot (fontanelle), or any swelling or cut on the head in a baby',
      'Under 1 year with any vomiting, a worsening or high-pitched cry, or a fall from any height (off a bed, sofa, or changing table, or from your arms)'
    ],
    source: 'NHS · British Red Cross · NICE NG232'
  },
  {
    id: 'bleeding', icon: 'blood-drop', name: 'Heavy bleeding / deep cut',
    severity: 'serious', callLead: false,
    immediate: [
      'Press firmly on the wound with a clean (non-fluffy) cloth or dressing and keep pressing — do not lift to check.',
      'Lay baby down and keep pressing. If baby looks pale, cold, or floppy, raise their legs to help with shock — but never stop pressing on the wound to do it.',
      'Do not wash a heavily-bleeding wound; if an object is embedded, press around it — do not pull it out.'
    ],
    call112When: [
      'Bleeding is severe or will not slow with firm pressure',
      'Blood soaks through, or baby becomes pale, cold, or floppy'
    ],
    source: 'British Red Cross · St John Ambulance'
  },
  {
    id: 'burn', icon: 'flame', name: 'Burn or scald',
    severity: 'serious', callLead: false,
    immediate: [
      'Cool the burn under cool running water for 20 minutes — start now. Keep the rest of baby warm (a blanket or clothing) and stop if they shiver — babies lose heat fast.',
      'Gently remove clothing or anything tight near the burn — but not anything stuck to it.',
      'After cooling, loosely cover with cling film or a clean plastic bag. No creams, ice, butter, or fluffy dressings.'
    ],
    call112When: [
      'The burn is large or deep, or on the face, hands, or genitals',
      'It was caused by chemicals or electricity — or you are unsure',
      'Always seek medical advice for any burn on a baby'
    ],
    source: 'NHS · British Red Cross'
  },
  {
    id: 'poison', icon: 'flask', name: 'Swallowed something / poison',
    severity: 'urgent', callLead: true,
    immediate: [
      'Call 112 now. Do not make baby sick — it can cause more harm.',
      'Find what they swallowed; keep the packaging, container, or a sample to show the doctors.',
      'If drowsy but breathing, lay them on their side; do not give any food or drink — not even water or milk.'
    ],
    call112When: null,
    source: 'NHS'
  }
];
