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
// AGE STEP — 1 year+ (2026-09-24, the 12-month audit): Ziva turned one on
//   2026-09-04, so the INFANT techniques above are retired from this registry.
//   `unresponsive` and `choking` now carry the CHILD (1 year to puberty) protocol,
//   verified against the live NHS pages: "How to resuscitate a child" (mod.
//   2026-08-07: 5 rescue breaths, heel of 1 hand on the lower third of the
//   breastbone, 5 cm, 30:2, lone rescuer ~1 min before calling) and "How to stop
//   a child from choking" (mod. 2025-09-24: back blows then abdominal thrusts,
//   fist between navel and ribs, inwards and upwards, keep off the lower ribs).
//   Head injury: the under-1 bruise/swelling line is dropped, and the NHS all-ages criteria (fall >1 m or
//   5 stairs, behaviour change, walking/balance, black eye) are added (Maren V-M-266-1).
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
      // Child (1 year+) technique since Ziva turned one (2026-09-24 12-month audit): mouth-to-mouth
      // with the nose pinched, heel of ONE hand, 5 cm — NHS 'How to resuscitate a child' (mod. 2026-08-07).
      'Tilt the head back slightly and lift the chin, clear any obvious blockage, then give 5 rescue breaths — pinch her nose, seal your mouth over hers and blow steadily for about 1 second until the chest rises.',
      '30 chest compressions: heel of one hand on the lower third of the breastbone, arm straight, push down 5 cm (a third of the chest depth) and fast (100–120 a minute) — then 2 breaths. Keep the 30:2 cycle going until help arrives.'
    ],
    call112When: null,
    call112Label: 'Call 112 now — or after 1 minute of CPR if you’re alone.',
    source: 'Resuscitation Council UK 2025 · NHS',
    teaser: '5 rescue breaths, then start compressions',
    doc: {
      suspected: 'Not breathing / unresponsive',
      stamps: [ { id: 'collapse', label: 'Found unresponsive at' }, { id: 'cpr', label: 'CPR started at' } ],
      action: { label: 'Rescue breaths + compressions given', value: 'Yes / No' },
      forTeam: 'child (1 year+) found unresponsive; rescue breaths and chest compressions given from the time above; please assess airway, breathing, circulation.'
    }
  },
  {
    id: 'allergic-reaction', icon: 'alert-circle', name: 'Severe allergic reaction',
    severity: 'urgent', callLead: true,
    immediate: [
      // Hold-time: EpiPen delivers in ≤3s; parent-facing copy says "slowly count to 10" so a panicking parent guarantees the dose without arbitrating 3-vs-10 (Maren V-M-237). Kept consistent with the food-room anaphylaxis card (data.js EMERGENCY_PROTOCOL.anaphylaxis).
      'If an adrenaline auto-injector (e.g. EpiPen) has been prescribed, use it now — into the outer thigh and hold it in place; slowly count to 10 to be sure. Most families won’t have one — if not, go straight to the next step.',
      'Call 112 and say “anaphylaxis”. Lay her down and raise her legs; if breathing is hard, raise her shoulders or sit her up slightly instead; if vomiting, lay her on her side. Never stand or walk her.',
      'No better after 5 minutes, or getting worse? Give a second auto-injector — in the other thigh — if you have one.'
    ],
    call112When: [
      'Swelling of the lips, tongue, throat or face',
      'Noisy or struggling breathing, wheeze, or a hoarse cry',
      'Pale, blue, floppy, or suddenly drowsy / unresponsive'
    ],
    source: 'NHS',
    teaser: 'Auto-injector · lie flat, legs up',
    doc: {
      suspected: 'Severe allergic reaction (anaphylaxis)',
      stamps: [ { id: 'reaction', label: 'Reaction started at' }, { id: 'adren', label: 'Adrenaline given at' } ],
      action: { label: 'Adrenaline given', value: 'Yes / No' },
      forTeam: 'suspected anaphylaxis; see the adrenaline-given line; please observe for a biphasic reaction.'
    }
  },
  {
    id: 'choking', icon: 'warn', name: 'Choking (object)',
    severity: 'urgent', callLead: true,
    immediate: [
      // Child (1 year+) technique since Ziva turned one: back blows then ABDOMINAL thrusts —
      // NHS 'How to stop a child from choking' (mod. 2025-09-24). Infant chest thrusts retired.
      // Action-first wording (Vela V-V-266-5); "shout for help" first and ONE round before calling
      // (Maren V-M-266-8 — NHS: call 999 if it doesn't come out after back blows + thrusts).
      'Shout for help. Lay her face-down across your lap, head low — or support her leaning forward. Up to 5 sharp back blows between the shoulder blades with the heel of your hand; check the mouth after each.',
      'Still stuck? Up to 5 abdominal thrusts: kneel behind her, arms under her armpits and around her tummy. Fist just above the belly button (below the ribs), other hand over it, pull sharply in and up. Check the mouth after each. Keep off the lower ribs.',
      'Not out after one round? Call 112 (speakerphone), then keep repeating 5 back blows + 5 abdominal thrusts until help arrives. No blind finger sweeps. Once it clears, get her checked — abdominal thrusts can injure inside.'
    ],
    call112When: [
      'It does not come out after one round of back blows + abdominal thrusts — call, then keep going',
      'She becomes limp, silent, or stops breathing → start CPR (top of this list)'
    ],
    xlink: { label: 'Choking on food? →', room: 'food', hazard: 'choking' },
    source: 'Resuscitation Council UK 2025 · NHS · British Red Cross',
    teaser: '5 back blows + 5 abdominal thrusts',
    doc: {
      suspected: 'Choking (airway obstruction)',
      stamps: [ { id: 'reaction', label: 'Choking started at' }, { id: 'call', label: '112 called at' } ],
      action: { label: 'Back blows + abdominal thrusts given · cleared', value: 'Yes / No' },
      forTeam: 'child (1 year+) choking; back blows and abdominal thrusts given; please assess the airway and for abdominal injury from the thrusts.'
    }
  },
  {
    id: 'seizure', icon: 'bolt', name: 'Seizure / fit',
    severity: 'urgent', callLead: true,
    immediate: [
      'Note the time it starts. Cushion her head and pad around her with something soft; move hard objects away. Do not lift or move her unless she is in danger.',
      'Do not restrain her and do not put anything in her mouth.',
      'When it stops, turn her onto her side (recovery position) and check nothing is blocking the mouth.'
    ],
    call112When: [
      'It is the first seizure, or it lasts more than 5 minutes',
      'Trouble breathing, one-sided stiffness or twitching, or another seizure follows',
      'Stays very drowsy or unresponsive more than 1 hour afterwards'
    ],
    source: 'NHS',
    teaser: 'Time it · cushion the head · don’t restrain',
    doc: {
      suspected: 'Seizure / fit',
      stamps: [ { id: 'start', label: 'Seizure started at' }, { id: 'stop', label: 'Seizure stopped at' } ],
      action: { label: 'First seizure', value: 'Yes / No' },
      forTeam: 'child (1 year+) seizure; note the start and stop times above; please assess.'
    }
  },
  {
    id: 'head-injury', icon: 'fall', name: 'Bad fall / head injury',
    severity: 'serious', callLead: false,
    immediate: [
      'Hold something cold (e.g. frozen veg in a tea towel) to the bump for up to 20 minutes.',
      'Keep her calm and resting; a responsible adult should stay with her and check closely for at least the first 24 hours.',
      'Any vomiting at all? Call your doctor (or 108) for advice now.'
    ],
    // Child (1 year+) criteria — NHS 'Head injury and concussion' "Call 999 if" list (mod.
    // 2026-06-01), which applies at every age. Maren V-M-266-1: dropping the under-1 line had
    // also dropped the only fall-height and behaviour-change coverage; they are restored here as
    // the all-ages NHS criteria. The bruise/swelling/cut line stays NHS's under-1-only criterion.
    call112When: [
      'Was knocked out, even briefly, or is hard to wake / very drowsy',
      'Fell from higher than 1 metre or down 5 or more stairs',
      'Her behaviour has changed — more irritable, crying more than usual, distracted, or losing interest in things around her',
      'New trouble walking, crawling or balancing, or a black eye where she did not hit her eye',
      'Repeated vomiting, a fit, or clear fluid or blood from the nose or ears',
      'A tense or bulging soft spot (fontanelle — it can stay open until about 18 months)'
    ],
    source: 'NHS · British Red Cross · NICE NG232',
    teaser: 'Cold compress · watch closely 24h',
    doc: {
      suspected: 'Head injury (fall)',
      stamps: [ { id: 'fall', label: 'Time of the fall' } ],
      action: { label: 'Knocked out / any vomiting', value: 'Yes / No' },
      forTeam: 'child (1 year+) head injury from a fall; note any loss of consciousness, vomiting, or change in behaviour; please assess.'
    }
  },
  {
    id: 'bleeding', icon: 'blood-drop', name: 'Heavy bleeding / deep cut',
    severity: 'serious', callLead: false,
    immediate: [
      'Press firmly on the wound with a clean (non-fluffy) cloth or dressing and keep pressing — do not lift to check.',
      'Lay her down and keep pressing. If she looks pale, cold, or floppy, raise her legs to help with shock — but never stop pressing on the wound to do it.',
      'Do not wash a heavily-bleeding wound; if an object is embedded, press around it — do not pull it out.'
    ],
    call112When: [
      'Bleeding is severe or will not slow with firm pressure',
      'Blood soaks through, or she becomes pale, cold, or floppy'
    ],
    source: 'British Red Cross · St John Ambulance',
    teaser: 'Press firmly · don’t lift to check',
    doc: {
      suspected: 'Heavy bleeding / deep cut',
      stamps: [ { id: 'start', label: 'Bleeding started at' } ],
      action: { label: 'Firm pressure applied · slowing', value: 'Yes / No' },
      forTeam: 'heavy bleeding; firm pressure applied; note the site and whether it is slowing; please assess.'
    }
  },
  {
    id: 'burn', icon: 'flame', name: 'Burn or scald',
    severity: 'serious', callLead: false,
    immediate: [
      'Cool the burn under cool running water for 20 minutes — start now. Keep the rest of her warm (a blanket or clothing) and stop if she shivers — little ones lose heat fast.',
      'Gently remove clothing or anything tight near the burn — but not anything stuck to it.',
      'After cooling, loosely cover with cling film or a clean plastic bag. No creams, ice, butter, or fluffy dressings.'
    ],
    call112When: [
      'The burn is large or deep, or on the face, hands, or genitals',
      'It was caused by chemicals or electricity — or you are unsure',
      'Always seek medical advice for any burn on a baby or young child'
    ],
    source: 'NHS · British Red Cross',
    teaser: 'Cool under water 20 min · keep warm',
    doc: {
      suspected: 'Burn / scald',
      stamps: [ { id: 'burn', label: 'Time of the burn' }, { id: 'cool', label: 'Cooling started at' } ],
      action: { label: 'Cause (heat / chemical / electrical)', value: '____' },
      forTeam: 'child (1 year+) burn or scald; cooled under running water; note the cause and the site; please assess depth and area.'
    }
  },
  {
    id: 'poison', icon: 'flask', name: 'Swallowed something / poison',
    severity: 'urgent', callLead: true,
    immediate: [
      'Call 112 now. Do not make her sick — it can cause more harm.',
      'Find what they swallowed; keep the packaging, container, or a sample to show the doctors.',
      'If drowsy but breathing, lay them on their side; do not give any food or drink — not even water or milk.'
    ],
    call112When: null,
    source: 'NHS',
    teaser: 'Call 112 · don’t make her sick',
    doc: {
      suspected: 'Swallowed something / possible poison',
      stamps: [ { id: 'swallow', label: 'Swallowed / found at' } ],
      action: { label: 'What was swallowed', value: '____' },
      forTeam: 'child (1 year+) swallowed a possible poison; packaging kept; vomiting NOT induced; please advise and assess.'
    }
  }
];
