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
  // privacy-v1: the region is the family's own town when it matches a region we hold contacts
  // for; otherwise the national numbers only (confidence 'default' suppresses the hospital list).
  var city = (typeof profile !== 'undefined' && profile && profile.place && profile.place.city) ? String(profile.place.city).toLowerCase().trim() : '';
  var known = city && Object.keys(EMERGENCY_CONTACTS).find(function(k) { return k === city || String(EMERGENCY_CONTACTS[k].label || '').toLowerCase() === city; });
  return known ? { region: known, confidence: 'known' } : { region: DEFAULT_REGION, confidence: 'default' };
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
// AGE STEP — 1 year+ (the 12-month audit): for a child of one and over the INFANT
//   techniques above are retired from this registry.
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
//   • M-4 anaphylaxis ruled IN — the child is in active allergen introduction;
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
      // Child (1 year+) technique for a child of one and over (the 12-month audit): mouth-to-mouth
      // with the nose pinched, heel of ONE hand, 5 cm — NHS 'How to resuscitate a child' (mod. 2026-08-07).
      // Breathing check + two-hand note + plainer landmark (Maren V-M-266-12; RCUK 2025 paediatric
      // BLS: look, listen and feel for no more than 10 s; lower half of the sternum, two hands if needed).
      'Check the child’s breathing: tilt the head back slightly, lift the chin, and look, listen and feel for breaths for up to 10 seconds. Gasping is not breathing.',
      'Breathing normally: turn the child onto their side (recovery position), call 112, and keep checking the breathing until help arrives.',
      'Not breathing normally: clear any obvious blockage, then give 5 rescue breaths — pinch the nose, seal your mouth over the child’s mouth and blow steadily for about 1 second until the chest rises.',
      '30 chest compressions: heel of one hand in the middle of the chest, on the lower half of the breastbone (not the soft tip at the bottom), arm straight, push down 5 cm (a third of the chest depth) and fast (100–120 a minute) — then 2 breaths. If one hand can\'t push 5 cm, use both hands, one on top of the other. Keep the 30:2 cycle going until help arrives.'
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
      'Call 112 and say “anaphylaxis”. Lay the child down and raise the legs; if breathing is hard, raise the shoulders or sit the child up slightly instead; if vomiting, lay the child on their side. Never stand or walk the child.',
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
      // Child (1 year+) technique for a child of one and over: back blows then ABDOMINAL thrusts —
      // NHS 'How to stop a child from choking' (mod. 2025-09-24). Infant chest thrusts retired.
      // Action-first wording (Vela V-V-266-5); "shout for help" first and ONE round before calling
      // (Maren V-M-266-8 — NHS: call 999 if it doesn't come out after back blows + thrusts).
      'Shout for help. Lay the child face-down across your lap, head low — or support them leaning forward. Up to 5 sharp back blows between the shoulder blades with the heel of your hand; check the mouth after each.',
      'Still stuck? Up to 5 abdominal thrusts: kneel behind the child, arms under the armpits and around the tummy. Fist just above the belly button (below the ribs), other hand over it, pull sharply in and up. Check the mouth after each. Keep off the lower ribs.',
      'Not out after one round? Call 112 (speakerphone), then keep repeating 5 back blows + 5 abdominal thrusts until help arrives. No blind finger sweeps. Once it clears, get the child checked — abdominal thrusts can injure inside.'
    ],
    call112When: [
      'It does not come out after one round of back blows + abdominal thrusts — call, then keep going',
      'The child becomes limp, silent, or stops breathing → start CPR (top of this list)'
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
      'Note the time it starts. Cushion the head and pad around the child with something soft; move hard objects away. Do not lift or move the child unless they are in danger.',
      'Do not restrain the child and do not put anything in their mouth.',
      'When it stops, turn the child onto their side (recovery position) and check nothing is blocking the mouth.'
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
      'Keep the child calm and resting; a responsible adult should stay with them and check closely for at least the first 24 hours.',
      'Any vomiting at all? Call your doctor (or 108) for advice now.'
    ],
    // Child (1 year+) criteria — NHS 'Head injury and concussion' "Call 999 if" list (mod.
    // 2026-06-01), which applies at every age. Maren V-M-266-1: dropping the under-1 line had
    // also dropped the only fall-height and behaviour-change coverage; they are restored here as
    // the all-ages NHS criteria. The bruise/swelling/cut line stays NHS's under-1-only criterion.
    call112When: [
      'Was knocked out, even briefly, or is hard to wake / very drowsy',
      'Fell from higher than 1 metre or down 5 or more stairs',
      'Behaviour has changed — more irritable, crying more than usual, distracted, or losing interest in things around them',
      'New trouble walking, crawling or balancing, or a black eye where the eye itself was not hit',
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
      'Lay the child down and keep pressing. If they look pale, cold, or floppy, raise the legs to help with shock — but never stop pressing on the wound to do it.',
      'Do not wash a heavily-bleeding wound; if an object is embedded, press around it — do not pull it out.'
    ],
    call112When: [
      'Bleeding is severe or will not slow with firm pressure',
      'Blood soaks through, or the child becomes pale, cold, or floppy'
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
      'Cool the burn under cool running water for 20 minutes — start now. Keep the rest of the child warm (a blanket or clothing) and stop if they shiver — little ones lose heat fast.',
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
      'Call 112 now. Do not make the child sick — it can cause more harm.',
      'Find what they swallowed; keep the packaging, container, or a sample to show the doctors.',
      'If drowsy but breathing, lay them on their side; do not give any food or drink — not even water or milk.'
    ],
    call112When: null,
    source: 'NHS',
    teaser: 'Call 112 · don’t make the child sick',
    doc: {
      suspected: 'Swallowed something / possible poison',
      stamps: [ { id: 'swallow', label: 'Swallowed / found at' } ],
      action: { label: 'What was swallowed', value: '____' },
      forTeam: 'child (1 year+) swallowed a possible poison; packaging kept; vomiting NOT induced; please advise and assess.'
    }
  },
  // ── child-sex S3 (2026-10-31): emergency routing for the Body care topics ──────────
  // `sex` (optional, 'f' | 'm'): the Room shows the entry only when childSex() matches
  // (or is still unknown — the profile gate is up then, and an emergency should fail toward
  // showing). Absent = every child. A girl's family never sees torsion.
  // Sources and exact quotes: docs/specs/care-guidance-s3-sources.md §B5 / §X1.
  {
    // NHS 'Testicle lumps and swellings' (A&E/999 for sudden severe testicle pain; "Do not drive
    // to A&E…"); RCH Melbourne CPG 'Acute scrotal pain or swelling' (torsion an emergency;
    // "Torsion within 4 to 6 hours: 80 to 100 percent viability"; rarely neonates, may be
    // painless in neonates; vomiting common; red/blue, dark in neonate); AAP HealthyChildren
    // 'Undescended Testicles' (an undescended testis can twist).
    id: 'testicular-torsion', icon: 'emergency', name: 'Sudden pain or swelling in the scrotum',
    severity: 'urgent', callLead: true, sex: 'm',
    immediate: [
      'Go to the hospital emergency department now. A twisted testis (torsion) is time-critical: surgery within about 4 to 6 hours usually saves it.',
      'Do not wait to see if it settles. If you cannot get there safely and fast, call 112 or 108 for an ambulance.',
      'It can happen in babies and in a testis that has not come down. A young baby may not seem to be in pain, so a swollen, red, blue or dark scrotum counts too.'
    ],
    call112When: null,
    call112Label: 'Go to the emergency department now — call 112 or 108 if you cannot get there fast.',
    source: 'NHS · Royal Children’s Hospital Melbourne · AAP',
    teaser: 'Possible twisted testis — hospital now',
    doc: {
      suspected: 'Possible testicular torsion',
      stamps: [ { id: 'pain', label: 'Pain or swelling started at' } ],
      action: { label: 'Vomiting', value: 'Yes / No' },
      forTeam: 'sudden scrotal pain or swelling from the time above; please assess urgently for testicular torsion.'
    }
  },
  {
    // RCH Melbourne Kids Health Info 'Inguinal hernia' ("You should call an ambulance if your
    // child has an inguinal hernia and they develop any of the following symptoms: …");
    // AAP HealthyChildren 'Inguinal Hernia in Infants & Children' (incarcerated: trapped even
    // when relaxed, pain/tenderness, vomiting, firmer or red — "requires immediate medical
    // attention"; girls get them too). Boys and girls.
    id: 'stuck-hernia', icon: 'bump', name: 'Groin lump that is hard, painful or stuck',
    severity: 'urgent', callLead: true,
    immediate: [
      'A hernia lump that stays out when the child is calm, or is hard, tender or painful, may be stuck (incarcerated). Go to the hospital emergency department now.',
      'Call 112 or 108 for an ambulance if any sign below is present.',
      'Note when the lump became hard or painful, and any vomiting, to tell the doctors.'
    ],
    call112When: [
      'Pain in the groin, or the child seems generally unwell',
      'Vomiting, or a bloated, full tummy',
      'A fever',
      'The lump is red or pale blue-grey and tender',
      'The lump does not change size when the child cries'
    ],
    source: 'Royal Children’s Hospital Melbourne · AAP',
    teaser: 'Possible stuck hernia — hospital now',
    doc: {
      suspected: 'Possible incarcerated inguinal hernia',
      stamps: [ { id: 'stuck', label: 'Lump hard / painful since' } ],
      action: { label: 'Vomiting', value: 'Yes / No' },
      forTeam: 'groin (inguinal) lump that has become hard, painful or irreducible from the time above; please assess urgently for an incarcerated hernia.'
    }
  }
];

// ─────────────────────────────────────────
// BODY_CARE_GUIDANCE — child-sex S3 (docs/specs/child-sex-v1.md §4). The care topics that
// differ by sex in the 0–24 month range, read by medical.js renderBodyCare() (Medical →
// Body care card), filtered on childSex() and ageAt().months.
//
// Why config.js: this is CARE CONTENT — Maren's, like GENERAL_EMERGENCIES just above, whose
// torsion and stuck-hernia rows are its emergency twins. Both registries are small, static and
// load-time; data.js holds the large engine/food registries.
//
// Entry shape: { id, sex: 'f'|'m'|'both', ageMinMo, ageMaxMo (inclusive, whole months),
//   title, points[], seeDoctorIf[], emergencyIf[], sources: [{ org, title, url }] }.
// Copy is NEUTRAL STATIC wording (load-time table, built before the profile loads — no
// pron(); child-sex §3 "no regex substitution on load-time text"). Render-time strings in
// medical.js may use childKinWord().
//
// canon-cc-013: every line traces to a quoted, fetched source in
// docs/specs/care-guidance-s3-sources.md (one section per topic; disagreements marked there).
// An entry with no sources is never rendered (renderBodyCare filters it out), so a missing
// citation hides the entry rather than shipping an unsourced claim.
const BODY_CARE_SOURCES = {
  nhsPhim:   { org: 'NHS', title: 'Tight foreskin (phimosis)', url: 'https://www.nhs.uk/conditions/phimosis/' },
  nhsCirc:   { org: 'NHS', title: 'Circumcision', url: 'https://www.nhs.uk/conditions/circumcision-in-boys/' },
  nhsUdt:    { org: 'NHS', title: 'Undescended testicles', url: 'https://www.nhs.uk/conditions/undescended-testicles/' },
  nhsLump:   { org: 'NHS', title: 'Testicle lumps and swellings', url: 'https://www.nhs.uk/conditions/testicle-lumps-and-swellings/' },
  nhsNappy:  { org: 'NHS', title: 'How to change your baby’s nappy', url: 'https://www.nhs.uk/baby/caring-for-a-newborn/how-to-change-your-babys-nappy/' },
  nhsUti:    { org: 'NHS', title: 'Urinary tract infections (UTIs)', url: 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/' },
  aapUncirc: { org: 'AAP', title: 'Care for an uncircumcised penis', url: 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Care-for-an-uncircumcised-penis.aspx' },
  aapPenis:  { org: 'AAP', title: 'How to care for your baby’s penis', url: 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Caring-For-Your-Sons-Penis.aspx' },
  aapUdt:    { org: 'AAP', title: 'Undescended testicles: what parents need to know', url: 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/Undescended-Testicles.aspx' },
  aapHydro:  { org: 'AAP', title: 'Scrotal swelling in children: what is a hydrocele?', url: 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/Communicating-Hydrocele.aspx' },
  aapHernia: { org: 'AAP', title: 'Inguinal hernia in infants and children', url: 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/Inguinal-Hernia.aspx' },
  aapLabial: { org: 'AAP', title: 'Labial adhesions in babies and children', url: 'https://healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/Labial-Adhesions.aspx' },
  aapUti:    { org: 'AAP', title: 'Detecting urinary tract infections', url: 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/Detecting-Urinary-Tract-Infections.aspx' },
  aua:       { org: 'AUA', title: 'Evaluation and treatment of cryptorchidism (2014, reviewed 2025)', url: 'https://www.auanet.org/guidelines-and-quality/guidelines/cryptorchidism-guideline' },
  rchHernia: { org: 'RCH Melbourne', title: 'Inguinal hernia', url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Inguinal_hernia/' },
  rchUdt:    { org: 'RCH Melbourne', title: 'Undescended testes', url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Undescended_testes/' },
  rchScrot:  { org: 'RCH Melbourne', title: 'Acute scrotal pain or swelling (clinical guideline)', url: 'https://www.rch.org.au/clinicalguide/guideline_index/Acute_scrotal_pain_or_swelling/' },
  rchVulvo:  { org: 'RCH Melbourne', title: 'Vulvovaginitis', url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Vulvovaginitis/' },
  rchUti:    { org: 'RCH Melbourne', title: 'Urinary tract infection (clinical guideline)', url: 'https://www.rch.org.au/clinicalguide/guideline_index/Urinary_tract_infection/' },
  ispn2011:  { org: 'Indian Society of Pediatric Nephrology', title: 'Revised statement on management of UTI (Indian Pediatr 2011)', url: 'https://indianpediatrics.net/sep2011/sep-709-717.htm' },
  ispn2023:  { org: 'Indian Society of Pediatric Nephrology', title: 'UTI and VUR guidelines 2023: key updates', url: 'https://indianjnephrol.org/management-of-urinary-tract-infections-and-vesicoureteric-reflux-key-updates-from-revised-indian-society-of-pediatric-nephrology-guidelines-2023/' },
  sg2005:    { org: 'Arch Dis Child', title: 'Circumcision for the prevention of UTI in boys: systematic review (2005)', url: 'https://pubmed.ncbi.nlm.nih.gov/15890696/' },
  khLabial:  { org: 'Nemours KidsHealth', title: 'Labial adhesions', url: 'https://kidshealth.org/en/parents/labial-adhesions.html' },
  ouhLabial: { org: 'Oxford University Hospitals NHS', title: 'Labial adhesions: information for parents', url: 'https://www.ouh.nhs.uk/media/b5gjseqi/80373adhesions.pdf' },
  akhDiaper: { org: 'SickKids AboutKidsHealth', title: 'How to change a diaper', url: 'https://www.aboutkidshealth.ca/how-to-change-a-diaper' },
  mlHorm:    { org: 'MedlinePlus', title: 'Hormonal effects in newborns', url: 'https://medlineplus.gov/ency/article/001911.htm' }
};

const BODY_CARE_GUIDANCE = (function(S) { return [
  // ── Boys ─────────────────────────────────────────────────────────────────────────
  { // §B1 — NHS-PHIM, NHS-CIRC, AAP-UNCIRC, NHS-NAPPY
    id: 'foreskin-care', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'Foreskin care (not circumcised)',
    points: [
      'Never pull back the foreskin. At this age it is still attached to the head of the penis, and forcing it can cause pain, bleeding and tears.',
      'Clean the penis like the rest of the nappy area, with warm water. Cotton buds and antiseptics are not needed.',
      'A tight foreskin is normal. Most boys’ foreskins do not pull back before age 5, and some not until 10 or older.',
      'The tip may bulge or balloon while passing urine as the foreskin starts to separate. This usually stops by itself.',
      'Avoid perfumed soap and talcum powder on the penis; they can irritate it.'
    ],
    seeDoctorIf: [
      'The foreskin is red, swollen or sore',
      'Urine only ever comes out as a trickle, or passing urine seems uncomfortable',
      'Bleeding, a thick discharge or a bad smell from under the foreskin',
      'Ballooning keeps happening and does not stop'
    ],
    emergencyIf: [
      'The foreskin has been pulled back and will not go back over the head of the penis (paraphimosis)'
    ],
    sources: [S.nhsPhim, S.nhsCirc, S.aapUncirc, S.nhsNappy]
  },
  { // §B2 — AAP-PENIS, NHS-CIRC
    id: 'circumcision-care', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'After a circumcision',
    points: [
      'For the first few days the tip may look red, with a yellowish film. Both mean it is healing, and they fade within about a week.',
      'Keep the area clean: wash gently and pat dry, or let it air dry. If poo gets on it, wipe it gently.',
      'After a circumcision under anaesthetic, healing takes 4 to 6 weeks. Some swelling, bruising and a little bleeding are normal for 1 to 2 weeks.',
      'Follow the aftercare the surgeon gives you; it comes first.'
    ],
    seeDoctorIf: [
      'Redness that does not settle, swelling, or crusted yellow sores',
      'Pus, discharge or a smell from the wound, or the wound opens up again',
      'Call the doctor the same day for bleeding that does not stop, a high temperature, or great difficulty passing urine'
    ],
    emergencyIf: [
      'No urine at all can be passed'
    ],
    sources: [S.aapPenis, S.nhsCirc]
  },
  { // §B3 — AUA (statements 3, 4, 11), AAP-UDT, NHS-UDT, RCH-UDT
    id: 'undescended-testes', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'Both testes in the scrotum',
    points: [
      'Both testes should be in the scrotum. When one is not at birth, it often comes down by itself in the first 3 months.',
      'The doctor checks the testes at routine visits.',
      'A testis that slips up when the child is cold or excited and then comes back down (retractile) often needs no surgery. Let the doctor decide.',
      'When a testis has not come down by 6 months, specialists advise surgery within the next year, ideally before 18 months.'
    ],
    seeDoctorIf: [
      'A testis still cannot be seen or felt in the scrotum at 6 months (corrected for early birth)',
      'Neither testis is in the scrotum: see the doctor sooner, from about 8 weeks',
      'A testis that used to be in the scrotum can no longer be found'
    ],
    emergencyIf: [
      'Pain in the groin or scrotum when a testis has not come down: it may have twisted'
    ],
    sources: [S.aua, S.aapUdt, S.nhsUdt, S.rchUdt]
  },
  { // §B4 — AAP-HYDRO, RCH-SCROT, NHS-LUMP (referral age disagrees: AAP 1 y / 12–18 m, RCH 2 y)
    id: 'hydrocele', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'Fluid swelling in the scrotum (hydrocele)',
    points: [
      'A hydrocele is fluid around a testis that makes the scrotum swell. Many newborn boys have one, and it is usually not painful.',
      'It may look bigger after crying and smaller after lying down, and can change size over weeks.',
      'Most go away on their own, often by about the first birthday.',
      'A hydrocele can look like a hernia, so have the doctor check any swelling of the scrotum.'
    ],
    seeDoctorIf: [
      'A new swelling of the scrotum, for a first check',
      'It is still there after the first birthday'
    ],
    emergencyIf: [
      'Sudden pain in the scrotum or groin together with swelling'
    ],
    sources: [S.aapHydro, S.rchScrot, S.nhsLump]
  },
  { // §B5 — NHS-LUMP, RCH-SCROT, AAP-UDT; emergency twin: GENERAL_EMERGENCIES 'testicular-torsion'
    id: 'testicular-torsion', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'Sudden pain in the scrotum (torsion)',
    points: [
      'A twisted testis (torsion) cuts off its blood supply. It is an emergency: surgery within about 4 to 6 hours usually saves it.',
      'It is rare in babies but can happen, and is more likely in a testis that has not come down. A young baby may not seem to be in pain.',
      'Vomiting is common with it.'
    ],
    seeDoctorIf: [],
    emergencyIf: [
      'Sudden, severe pain in the scrotum or groin',
      'Scrotal pain together with vomiting or tummy pain',
      'The scrotum is swollen and looks red, blue or dark'
    ],
    sources: [S.nhsLump, S.rchScrot, S.aapUdt]
  },
  { // §B6 — AKH-DIAPER, NHS-NAPPY
    id: 'nappy-boys', sex: 'm', ageMinMo: 0, ageMaxMo: 24,
    title: 'Nappy changes',
    points: [
      'Clean around the testes and penis. There is no need to pull back the foreskin.',
      'When fastening the nappy, point the penis down so urine does not leak up the front.'
    ],
    seeDoctorIf: [],
    emergencyIf: [],
    sources: [S.akhDiaper, S.nhsNappy]
  },
  // ── Girls ────────────────────────────────────────────────────────────────────────
  { // §G1 — NHS-NAPPY, NHS-UTI, RCH-VULVO
    id: 'wiping-washing', sex: 'f', ageMinMo: 0, ageMaxMo: 24,
    title: 'Wiping and washing',
    points: [
      'Wipe and clean from front to back, to keep germs from poo away from the vagina.',
      'Use plain warm water or fragrance-free, alcohol-free wipes.',
      'Avoid bubble baths, antibacterial products and scented soap. Use little soap and rinse it off well.',
      'Change wet or dirty nappies promptly.'
    ],
    seeDoctorIf: [
      'Redness or soreness that bothers the child or does not settle',
      'Blood-stained discharge',
      'A fever with pain when passing urine: a urine test may be needed'
    ],
    emergencyIf: [],
    sources: [S.nhsNappy, S.nhsUti, S.rchVulvo]
  },
  { // §G2 — AAP-LABIAL, OUH-LABIAL, KH-LABIAL. Not seen in newborns (OUH): from 3 months.
    id: 'labial-adhesion', sex: 'f', ageMinMo: 3, ageMaxMo: 24,
    title: 'Labia stuck together (labial adhesion)',
    points: [
      'Sometimes the inner lips (labia) stick together and partly cover the opening. It is common, most often under age 2.',
      'It is usually harmless and most need no treatment. About 8 in 10 separate on their own within a year.',
      'Never try to pull the labia apart yourself. If treatment is needed, the doctor will show you exactly what to do.',
      'Irritation from wet nappies or harsh soaps can play a part, so gentle washing and prompt nappy changes help.'
    ],
    seeDoctorIf: [
      'The opening looks closed or partly blocked',
      'Passing urine seems hard, or urine dribbles out afterwards',
      'Urinary tract infections'
    ],
    emergencyIf: [],
    sources: [S.aapLabial, S.ouhLabial, S.khLabial]
  },
  { // §G3 — NHS-NAPPY, MEDLINE-HORM (newborn only)
    id: 'newborn-discharge', sex: 'f', ageMinMo: 0, ageMaxMo: 1,
    title: 'Newborn discharge',
    points: [
      'In the first days, a white discharge, and sometimes slight bleeding like a mini period, can show in the nappy. It comes from the mother’s hormones and is nothing to worry about.',
      'The labia may look puffy for the same reason.'
    ],
    seeDoctorIf: [],
    emergencyIf: [],
    sources: [S.nhsNappy, S.mlHorm]
  },
  // ── Both ─────────────────────────────────────────────────────────────────────────
  { // §X1 — AAP-HERNIA, RCH-HERNIA; emergency twin: GENERAL_EMERGENCIES 'stuck-hernia'
    id: 'inguinal-hernia', sex: 'both', ageMinMo: 0, ageMaxMo: 24,
    title: 'A lump in the groin (hernia)',
    points: [
      'A hernia is a soft bulge in the groin, scrotum or labia that comes and goes. It gets bigger with crying or straining and smaller when the child is relaxed or asleep.',
      'Girls get them too, and an ovary can be caught in one.',
      'A hernia needs a surgical repair, so see the doctor soon. Do not wait, even if the lump has gone down.'
    ],
    seeDoctorIf: [
      'Any lump or bulge in the groin, scrotum or labia'
    ],
    emergencyIf: [
      'The lump stays out when the child is calm, or is hard, tender or painful',
      'A known hernia with vomiting, a bloated tummy, fever, or the child seems unwell',
      'The lump looks red or blue-grey'
    ],
    sources: [S.aapHernia, S.rchHernia]
  },
  { // §X2 — MEDLINE-HORM (newborn only)
    id: 'newborn-breasts', sex: 'both', ageMinMo: 0, ageMaxMo: 1,
    title: 'Newborn breast swelling',
    points: [
      'Breast swelling is common in newborn boys and girls. It comes from the mother’s hormones and goes by about the second week.',
      'A little milky fluid may leak from the nipples. This usually stops within 2 weeks.',
      'Do not squeeze or massage the breasts; it can cause an infection (abscess).'
    ],
    seeDoctorIf: [],
    emergencyIf: [],
    sources: [S.mlHorm]
  },
  { // §X3 — ISPN-2011, ISPN-2023, AAP-UTI, RCH-UTI, SG-2005, NHS-UTI. Kael + Maren co-own.
    id: 'fever-uti', sex: 'both', ageMinMo: 0, ageMaxMo: 24,
    title: 'Fever with no clear cause (urine infection)',
    points: [
      'Under age 2, a urinary tract infection (UTI) is an important cause of fever with no other obvious source, and the fever may be the only sign.',
      'Only a urine test can tell. If a fever has no clear cause, ask the doctor whether one is needed.',
      'UTIs are more common in girls. Boys who are not circumcised have a higher risk than circumcised boys, though it is still low.',
      'Early treatment matters: a delay raises the risk of kidney scarring.'
    ],
    seeDoctorIf: [
      'A fever with no cold, cough, diarrhoea or other clear cause, especially if it lasts more than 2 days',
      'Pain when passing urine, cloudy urine, or blood in the urine'
    ],
    emergencyIf: [
      'Very drowsy, confused, or hard to wake'
    ],
    sources: [S.ispn2023, S.ispn2011, S.aapUti, S.rchUti, S.nhsUti, S.sg2005]
  }
]; })(BODY_CARE_SOURCES);
