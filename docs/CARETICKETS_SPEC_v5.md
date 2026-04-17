# CareTickets — Build-Ready Feature Spec
**Version:** 5.0 · **Created:** 10 April 2026 · **Spec Process:** SPEC_ITERATION_PROCESS.md (8 passes)
**App:** SproutLab · **Author:** Rishabh + Claude (310 scenarios, 15 full passes)

---

## 1. Problem

Parents carry 2–5 active concerns at any time — "she fell yesterday, is she okay?", "her sleep has been bad this week", "she's not gaining weight." These concerns have no home in SproutLab. The data exists across domains (sleep, growth, feeding, illness, poop) but there's no structure to track a concern through to resolution. Parents either forget to follow up, or worry endlessly without a clear "it's okay now" signal.

There is also no justified use for push notifications in SproutLab today. CareTickets provides one.

---

## 2. Solution

A **tracking** system with two categories:

**Incident trackings** (acute) — falls, bumps, ingestion. Frequent check-ins tapering over hours. Answer-driven verdicts. Escalation on red flag symptoms — all matching triggers collected, highest severity action picked. Resolution by consecutive clear checks on resolution-blocking questions.

**Goal trackings** (chronic) — improve sleep, gain weight, food variety. Daily/weekly check-ins. Metric-driven verdicts (answers provide context only). Resolution by sustained metric improvement or threshold confirmation. Illness pauses counters (21-day + 7-day activity heuristic).

### User-Facing Language

| Internal Term | User-Facing |
|---|---|
| CareTicket | Tracking |
| Resolution | "All clear — stop tracking" |
| Escalation | "This needs attention" |
| Check-in | "Quick check" |
| Follow-up | "Reminder to check" |
| Verdict: clear | ✓ sage accent |
| Verdict: watch | "Keep watching" amber accent |
| Verdict: escalate | "Call your doctor" / "Go to ER" rose accent |
| Active | "Watching" |
| Resolved | "All clear" |

### Lifecycle (6 transitions)

```
active → escalated       (trigger — highest severity)
active → resolved        (criteria met + confirm, OR manual close after exhaustion)
escalated → active       (clear check-in + confirm de-escalation)
escalated → escalated    (different/higher trigger — upgrade action)
escalated → resolved     (force-resolve with explicit confirmation + reason)
resolved → active        (reopen — suggest fresh ticket after 2 reopens)
```

Reference time for consecutive-clear counting:
```
refTime = max(createdAt, reopenedAt, deEscalatedAt, escalatedAt)
```

---

## 3. Where It Lives

### Home Tab — Dedicated Zone

Between illness banners and unified alerts card. Render order:

```
1.  Hero score card
2.  Illness banners (fever, diarrhoea, vomiting, cold)
3.  CT entry point chip (pre-first-use only)
4.  CT follow-up banner (in-app notification)
5.  CT ticket zone (post-first-use, max 3 cards + "View all")
6.  CT storage warning (if localStorage fails)
7.  Reminders & alerts (unified card)
8.  Context alerts
9.  Meal progress / Suggestions / TSF / Sleep / Poop
```

### Discovery

- **Pre-first-use:** Standalone "Track a concern" chip (position 3) — always visible, no discovery problem
- **Post-first-use:** Zone header with "+" button (position 5) — `CT_EVER_USED` flag controls visibility
- **QA search intent:** Strong signals (`track`, `tracking`, `monitor this`, `start watching`, `raise concern`) trigger immediately. Weak signals (`fell`, `fall`, `bump`, `hit head`) trigger only if no other classifier matches and no negative signals (`asleep`, `sleep`, `behind`, `apart`) are present.
- Entry point chip and zone are **mutually exclusive** — never two entry points simultaneously

### Card Visual Hierarchy

| Status | Card Tier | Background | Border | Icon |
|---|---|---|---|---|
| Escalated | `card-action` | `var(--rose-light)` | Rose left `var(--accent-w)` | `zi('siren')` |
| Overdue | `card-action` | Domain light-bg | Rose left | Pulsing dot |
| Active | `card` base | Domain light-bg | None | Template icon |
| Clear (approaching resolution) | `card` base | Domain light-bg | Sage left | `zi('check')` |

### Sort Priority (max 3 visible)

```
1. Escalated first
2. Incidents above goals (same status level)
3. Most overdue first (by due time)
4. Exhausted schedule last (Infinity handled, NaN-safe)
```

---

## 4. Notification Architecture (Tier 1 — No Backend)

Main-thread `setTimeout` + `Notification API` + overdue detection on reopen. **No service worker. No IndexedDB.**

| Scenario | Mechanism | Reliability |
|---|---|---|
| App foregrounded | In-app banner (count-based for multiples, 30s auto-dismiss, ticket-ID-tracked) | 100% |
| App backgrounded (tab alive) | `new Notification()` with try/catch guard | High |
| Tab/browser closed | Overdue detection on next `renderHome()` | Catch-up on reopen |

### Timer Management

- `_ctTimers` map: `ticketId → timeoutId`. Clear before set prevents duplicates.
- **Guard: exhausted schedule** → don't schedule (`setTimeout(fn, Infinity)` fires immediately — critical bug prevented)
- **Guard: overflow** → `delay > 2^31-1` → cap at `MAX_TIMEOUT`
- **Guard: concurrent** → don't fire if check-in overlay is open for that ticket
- **Guard: visibility** → foregrounded → in-app banner; hidden → system Notification
- **Guard: permission** → check live `Notification.permission` on every fire + every creation; update stored state
- `_ctNotifiedTickets` map prevents duplicate overdue banner + system notification for same ticket

### Quiet Hours

- 10 PM – 7 AM local time (hardcoded v1; configurable Phase 2)
- Deferred follow-ups: staggered by 2-minute gaps at `CT_QUIET_END`
- **Escalated tickets bypass quiet hours** — medical concern overrides sleep

### Deep Link

- Notification click opens `?ct=TICKET_ID`
- Processed post-init via `_ctCheckDeepLink()`
- Suppresses overdue banner for that ticket on the render that opens the check-in
- URL cleaned via `history.replaceState`

---

## 5. Data Model

### Ticket Shape (21 fields)

```javascript
{
  id: 'ct-' + Date.now(),          // Unique ID
  type: 'incident' | 'goal',       // Category type
  category: string,                 // Template key (fall, bump_head, etc.)
  title: string,                    // Display title (newlines stripped on save)
  status: 'active' | 'resolved' | 'escalated',

  // ── Timestamps ──
  createdAt: ISO,                   // Original creation time (immutable)
  resolvedAt: ISO | null,           // Latest resolution time (cleared on reopen)
  escalatedAt: ISO | null,          // Latest escalation time
  deEscalatedAt: ISO | null,        // Latest de-escalation time
  reopenedAt: ISO | null,           // Latest reopen time
  scheduleBaseTime: ISO | null,     // Timer base (null = use createdAt). Set on reopen + de-escalation.

  // ── State History ──
  escalationHistory: [],            // [{ at: ISO, trigger: {field, value}, action: string }]

  // ── Schedule ──
  followUps: [number],              // Minutes from scheduleBaseTime/createdAt
  nextFollowUpIdx: number,          // Index into followUps
  lastCheckInAt: ISO | null,        // Most recent check-in time

  // ── Data ──
  checkIns: [],                     // See check-in shape below
  notes: string,                    // Ongoing user notes
  resolvedNotes: string,            // Reason for manual close / force-resolve

  // ── Goal State ──
  lastSustainedCount: number,       // Persisted sustained-day count (for illness pause)
  firstMetAt: ISO | null,           // When threshold_met metric first passed
  reopenCount: number,              // Number of times reopened
}
```

### Template-Derived Values (read from `CT_TEMPLATES`, never stored on ticket)

```javascript
ctDomainColor(ticket)         → ticket.type === 'incident' ? 'rose' : 'lavender'
ctResolutionCriteria(ticket)  → CT_TEMPLATES[ticket.category]?.resolutionCriteria || { type: 'manual' }
ctEscalationTriggers(ticket)  → CT_TEMPLATES[ticket.category]?.escalationTriggers || []
ctPivotStrategies(ticket)     → CT_TEMPLATES[ticket.category]?.pivotStrategies || []
```

Template changes automatically propagate to all active tickets.

### Check-In Shape

```javascript
{
  time: ISO,
  source: 'notification' | 'manual' | 'quick_clear',
  answers: {
    // bool: true | false | null (null for resolutionBlocking:false via quick-clear)
    // select: option string | null (null if stale/unanswered)
    // text: string (max 500 chars, empty = not answered)
  },
  autoData: {
    recentIllness: [{ type, status, startedAt, durationDays }],  // Summary only, ±6hr window
    recentSleep: { score, duration, date } | null,                // Last night
    recentPoop: [] | null,                                        // Same calendar day
    growthVelocity: { wtGPerWeek, htCmPerMonth } | null,         // Latest entry
  },
  verdict: 'clear' | 'watch' | 'escalate',
}
```

### Resolution Criteria (4 types)

```javascript
// Type 1: consecutive_clear (incidents)
{ type: 'consecutive_clear', count: 3 }
// Counts check-ins with verdict === 'clear' after ctRefTime(ticket). Strict > comparison.

// Type 2: sustained_metric (sleep goal)
{ type: 'sustained_metric', metric: 'dailySleepScore', operator: '>=', value: 70, sustainDays: 5 }
// Walks backward from today (or yesterday if today has no data). Pauses during active illness.

// Type 3: threshold_met (weight, food variety goals)
{ type: 'threshold_met', metric: 'wtGPerWeek', operator: '>=', value: 80, confirmAfterDays: 14 }
// Metric passes → record firstMetAt. Re-check after confirmAfterDays. Resets on regression. Pauses during illness.

// Type 4: manual (custom tickets)
{ type: 'manual' }
// User decides when to resolve.
```

All types support **manual close after schedule exhaustion** regardless of criteria.

---

## 6. Templates

### Incident Templates

#### `fall`
```javascript
{
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
      resolutionBlocking: false },
  ],
  resolutionCriteria: { type: 'consecutive_clear', count: 3 },
  escalationTriggers: [
    { field: 'seizure', value: true, action: 'er_visit' },
    { field: 'vomiting', value: true, action: 'er_visit' },
    { field: 'drowsiness', value: true, action: 'er_visit' },
    { field: 'mobility', value: 'Not moving much', action: 'er_visit' },
    { field: 'crying', value: 'Yes, inconsolable', afterMinutes: 60, action: 'doctor_call' },
  ],
  autoDataSources: ['illness'],
}
```

#### `bump_head`
```javascript
{
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
      resolutionBlocking: false },
  ],
  resolutionCriteria: { type: 'consecutive_clear', count: 3 },
  escalationTriggers: [
    { field: 'seizure', value: true, action: 'er_visit' },
    { field: 'vomiting', value: true, action: 'er_visit' },
    { field: 'drowsiness', value: true, action: 'er_visit' },
    { field: 'pupils', value: 'Unequal', action: 'er_visit' },
  ],
  autoDataSources: ['illness'],
}
```

#### `ingestion`
```javascript
{
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
    { id: 'rash', type: 'bool', label: 'Any rash or hives?' },
  ],
  resolutionCriteria: { type: 'consecutive_clear', count: 2 },
  escalationTriggers: [
    { field: 'breathing', value: 'Labored', action: 'er_visit' },
    { field: 'breathing', value: 'Wheezing', action: 'doctor_call' },
    { field: 'rash', value: true, action: 'doctor_call' },
    { field: 'behavior', value: 'Lethargic', action: 'er_visit' },
  ],
  autoDataSources: ['illness', 'poop'],
}
```

### Goal Templates

#### `sleep_improve`
```javascript
{
  type: 'goal', title: 'Improve sleep', icon: 'goal', domainColor: 'lavender',
  followUps: [1440, 2880, 4320, 5760, 7200, 8640, 10080],
  questions: [
    { id: 'qualitative', type: 'select', label: 'How was last night?',
      options: ['Great', 'Okay', 'Rough', 'Terrible'], clearValue: 'Great' },
    { id: 'notes', type: 'text', label: 'Any observations?' },
  ],
  resolutionCriteria: {
    type: 'sustained_metric', metric: 'dailySleepScore',
    operator: '>=', value: 70, sustainDays: 5,
  },
  escalationTriggers: [],
  autoDataSources: ['sleep'],
  pivotStrategies: [
    'Try earlier bedtime (shift 15 min earlier)',
    'Check room temperature and darkness',
    'Reduce screen/stimulation before bed',
    'Consult pediatrician if no improvement in 2 weeks',
  ],
}
```

#### `weight_gain`
```javascript
{
  type: 'goal', title: 'Increase weight', icon: 'trending-up', domainColor: 'lavender',
  followUps: [4320, 10080, 20160, 30240],
  questions: [
    { id: 'appetite', type: 'select', label: 'Appetite today?',
      options: ['Good', 'Average', 'Poor'], clearValue: 'Good' },
    { id: 'notes', type: 'text', label: 'Any dietary changes?' },
  ],
  resolutionCriteria: {
    type: 'threshold_met', metric: 'wtGPerWeek',
    operator: '>=', value: 80, confirmAfterDays: 14,
  },
  escalationTriggers: [],
  autoDataSources: ['growth'],
  pivotStrategies: [
    'Add calorie-dense foods (ghee, avocado, nut butters)',
    'Increase meal frequency',
    'Check for underlying illness suppressing appetite',
    'Schedule weight check with pediatrician',
  ],
}
```

#### `feeding_variety`
```javascript
{
  type: 'goal', title: 'Improve food variety', icon: 'goal', domainColor: 'lavender',
  followUps: [1440, 2880, 4320, 5760, 7200, 8640, 10080],
  questions: [
    { id: 'newFood', type: 'text', label: 'Any new food tried today?' },
    { id: 'reaction', type: 'select', label: 'Reaction?',
      options: ['Loved it', 'Neutral', 'Rejected', 'No new food'], clearValue: 'Loved it' },
  ],
  resolutionCriteria: {
    type: 'threshold_met', metric: 'uniqueFoods7d',
    operator: '>=', value: 10, confirmAfterDays: 7,
  },
  escalationTriggers: [],
  autoDataSources: ['diet'],
  pivotStrategies: [
    'Rotate presentation — same food, different form',
    'Baby-led weaning for texture exposure',
    'Pair new food with a favorite',
    'Try again in 3 days — rejection ≠ dislike',
  ],
}
```

#### `custom`
```javascript
{
  type: 'goal', title: '', icon: 'clipboard', domainColor: 'lavender',
  followUps: [1440, 2880, 4320, 5760, 7200],
  questions: [
    { id: 'update', type: 'text', label: 'How is it going?' },
  ],
  resolutionCriteria: { type: 'manual' },
  escalationTriggers: [],
  autoDataSources: [],
  pivotStrategies: [],
}
```

---

## 7. Verdict Computation

### Return Shape

```javascript
{ verdict: 'clear' | 'watch' | 'escalate', trigger: null | {field, value, action}, allTriggers: [] }
```

### Incident Tickets — Answer-Driven

1. **Collect ALL matching escalation triggers** (no short-circuit):
   - `answers[trigger.field] === trigger.value`
   - `afterMinutes` check: `elapsed` computed from `ctRefTime(ticket)`, not `createdAt`
   - Pick highest severity via `ACTION_SEVERITY = { doctor_call: 1, er_visit: 2 }`
   - If any match → `{ verdict: 'escalate', trigger: worst, allTriggers: allMatched }`

2. **Check if all blocking questions are clear:**
   - Only evaluate questions where `resolutionBlocking !== false`
   - Bool clear = `false`. Select clear = `clearValue`.
   - Text fields NEVER affect verdict.
   - If any blocking question is `null` (unanswered) → verdict: `watch` (with `missingQuestions` count)
   - All clear → `{ verdict: 'clear' }`
   - Any non-clear → `{ verdict: 'watch' }`

### Goal Tickets — Metric-Driven

- Questions are logged for context, do NOT affect verdict
- `manual` type → always `watch`
- Otherwise: read metric via `ctGetMetricValue`, compare → `clear` or `watch`

### Quick-Clear

- **Incident tickets:** Sets all blocking bool to `false`, blocking select to `clearValue`, non-blocking to `null`, text to `''`. Source: `'quick_clear'`.
- **Goal tickets:** Same, but label says "Quick answer — all defaults" (not "All clear" — metric determines verdict)
- **Escalated tickets:** Label says "Symptoms resolved — all clear now"
- **Disabled on first check-in** if any `onceOnly` text question exists (ingestion)

---

## 8. Check-In Flow

### Pre-Fill Logic

```javascript
function ctPreFillAnswers(ticket) {
  // Read from last check-in; onceOnly reads from first check-in
  // Validate select values against CURRENT template options (stale → null → force re-select)
  // Validate bool values (non-bool type → null)
  // Text (non-onceOnly) → cleared each time
}
```

### Submit Pipeline

```
1. Chip taps → _ctCurrentAnswers (via parseBoolOrString on data-value)
2. Submit → ctCollectAnswers() (override text fields from DOM — catches unfired change events)
3. ctSanitizeAnswers() — validate types, option membership, 500-char cap, null for unknown selects
4. ctComputeVerdict()
5. Build autoData (summaries only — not full episode objects)
6. Push to checkIns
7. Advance nextFollowUpIdx + ctAdvanceToNextFuture (no save inside — caller saves)
8. Single ctSave() with write verification
9. ctScheduleInApp()
10. Post-submission UI:
    - If escalated + clear verdict → de-escalation prompt (inside overlay)
    - If escalate verdict → escalation card with doctor phone
    - Otherwise → confirmation toast (2s) → close overlay → renderHome()
```

### `parseBoolOrString`

```javascript
function parseBoolOrString(val) {
  if (val === true || val === 'true') return true;
  if (val === false || val === 'false') return false;
  if (val === null || val === 'null' || val === '' || val === undefined) return null;
  return String(val);
}
```

Critical: HTML `data-value` attributes are always strings. Without this parser, `"false" === false` fails silently — tickets can never reach `clear` verdict.

---

## 9. State Transitions — Complete Handler Specifications

### `ctHandleEscalation(ticket, trigger, allTriggers)`
```
- Push all triggers to escalationHistory with timestamp
- If status !== 'escalated' OR new trigger has higher severity → update escalatedAt
- Set status = 'escalated'
- ctSave()
```

### `ctResolveTicket(ticketId, force)`
```
- If !force: re-verify consecutive_clear criteria (lightweight recount)
- ticket.status = 'resolved'
- ticket.resolvedAt = now
- Clear timer: delete _ctTimers[ticketId]
- delete _ctNotifiedTickets[ticketId]
- ctSave() → renderHome()
```

### `ctReopenTicket(ticketId)`
```
- ticket.status = 'active'
- ticket.resolvedAt = null
- ticket.reopenedAt = now
- ticket.scheduleBaseTime = now
- ticket.nextFollowUpIdx = 0
- ticket.followUps = [...CT_TEMPLATES[ticket.category].followUps]
- ticket.firstMetAt = null
- ticket.lastSustainedCount = 0
- ticket.reopenCount++
- delete _ctNotifiedTickets[ticketId]
- If reopenCount >= 2: show "Reopened N times — consider starting fresh" note
- ctSave() → ctScheduleInApp() → renderHome()
```

### `ctDeEscalate(ticketId)`
```
- ticket.status = 'active'
- ticket.deEscalatedAt = now
- ticket.scheduleBaseTime = now
- ticket.nextFollowUpIdx = 0
- ticket.followUps = [...CT_TEMPLATES[ticket.category].followUps]
- If goal: ticket.firstMetAt = null, ticket.lastSustainedCount = 0
- delete _ctNotifiedTickets[ticketId]
- ctSave() → ctScheduleInApp() → renderHome()
```

### `ctKeepEscalated(ticketId)`
```
- Close check-in overlay (no state change)
- renderHome()
```

### `ctForceResolve(ticketId)`
```
- Show confirmation inside detail overlay:
  [Doctor confirmed she's okay] [I'm confident she's fine] [Other → text input]
- On confirm: ticket.resolvedNotes = selectedReason
- Call ctResolveTicket(ticketId, true)
```

---

## 10. Metric Functions

### `ctGetMetricValue(metric, dateStr)`
Central router:
```javascript
switch (metric) {
  case 'dailySleepScore': return getDailySleepScore(dateStr || today())?.score || null;
  case 'wtGPerWeek': return getGrowthVelocity().wtGPerWeek;
  case 'uniqueFoods7d': return ctUniqueFoods7d();
  default: console.warn('Unknown metric:', metric); return null;
}
```

### `ctUniqueFoods7d()`
- ISL-cached: key `ct:uniqueFoods7d`, dirty on `diet` domain
- Counts unique `normalizeFoodName()` results across last 7 days of `feedingData`
- Returns 0 if no data (valid, not null)

### `ctAvgNightDuration7d()`
- ISL-cached: key `ct:avgNightDur7d`, dirty on `sleep` domain
- Filters: `type === 'night'` OR (`type` absent/undefined AND `calcSleepDuration > 240` minutes)
- Excludes null/zero durations from denominator
- Returns null if no valid nights

### `ctSustainedDays(ticket)`
- Walks backward from today (or yesterday if today's metric is null)
- Counts consecutive days where `ctGetMetricValue(metric, dateStr)` passes threshold
- **Illness pause:** If `ctHasActiveIllness()`, returns `{ count: ticket.lastSustainedCount, paused: true }`
- Saves `lastSustainedCount` only if changed (conditional save — no redundant writes during render)
- Returns `{ count, paused, reason, noData }`

### `ctCheckThresholdMet(ticket)`
- Reads `ctResolutionCriteria(ticket)`
- Uses `ctHasActiveIllness()` for illness pause (same function as sustained — Bug 287 consistency)
- If passing and `firstMetAt` is null → set `firstMetAt = now`, save
- If passing and `firstMetAt` set → compute `daysHeld`; if `>= confirmAfterDays` → met
- If not passing and no illness → reset `firstMetAt = null`, save
- If not passing and illness active → pause (don't reset)
- Conditional saves — only when `firstMetAt` actually changes
- Returns `{ met, daysHeld, paused }`

### `ctHasActiveIllness()`
```javascript
function ctHasActiveIllness() {
  return _getAllEpisodes().some(e => {
    if (e.status !== 'active') return false;
    const daysSince = Math.ceil((Date.now() - new Date(e.startedAt).getTime()) / 86400000);
    if (daysSince <= 21) return true;
    // > 21 days — check for recent activity
    const lastActivity = ctLastEpisodeActivity(e);
    const daysSinceActivity = Math.ceil((Date.now() - lastActivity) / 86400000);
    return daysSinceActivity <= 7;
  });
}
```

### `ctLastEpisodeActivity(ep)`
Checks `ep.readings`, `ep.entries`, `ep.doses`, `ep.lastUpdated` via optional chaining. Returns latest timestamp or falls back to `ep.startedAt`.

---

## 11. Overlays

### Template Picker (Flow)
- Close: × button, outside tap, back button
- Contains: disclaimer (first-time only), age caveat (> 12 months), template chips grouped by type, title input with helper text, duplicate goal warning, confirm button
- `ctCanQuickClear` check for ingestion (onceOnly text → quick-clear disabled on first check-in)

### Check-In (Flow)
- Close: × button only (has form data), back button
- Contains: context header (title + time + last check-in), escalation context (if escalated), onceOnly read-only strip, auto-data display (goal), question preamble, quick-clear button (if allowed), questions (medical priority order), sticky submit button
- `visualViewport.resize` listener added on open, removed on close
- Bool chips: semantic coloring for incidents (Yes=rose, No=sage). Domain coloring for goals.
- Submit disabled until all `resolutionBlocking` questions answered (non-blocking can be null)
- Duplicate check-in guard: if last check-in < 60 seconds ago, show confirmation
- 7 questions fit on iPhone with scrolling; sticky submit always visible

### Detail/History (Read)
- Close: × button, outside tap, back button
- Contains: title, creation time, status, timeline (last 5 expanded, older behind "Show earlier" toggle), action buttons (Check in, Resolve, Reopen, Share, Delete), reopen count note
- Force-resolve confirmation renders inside this overlay (content swap)
- De-escalation prompt renders inside check-in overlay (content swap)
- Escalation card shows doctor phone (tap-to-call + copyable number)

### All Overlays
- Render at `document.body` level (never inside tab content)
- Push `history.pushState` on open (pilot — back button support)
- Guard: don't open if another overlay is active (selector check)
- All overlays try/catch wrapped in `renderHome()`

---

## 12. Integration

### Today So Far
New data source via `ctGetTSFEvents()`:
- Ticket creation event (if created today)
- Latest check-in event (if any check-ins today, with count)
- Resolution event (if resolved today)
- Max 3 events per ticket. Domain-colored. Icon from template or verdict.

### QA Search Intent
- `ctShouldTriggerCreate(text)` checks strong/weak signals with negative filtering
- QA bar cleared and deactivated before template picker opens
- Registered in `qaMatchIntent` as `ct_create`

### Export/Import
- 3 KEYS in export: `careTickets`, `notifPermission`, `ctEverUsed`
- On import: reload `_careTickets`, run `ctValidateTickets`, rebuild timers via `ctScheduleInApp`

### Clear All Data
```javascript
Object.keys(_ctTimers).forEach(id => clearTimeout(_ctTimers[id]));
_ctTimers = {};
_ctNotifiedTickets = {};
_careTickets = [];
```

### Multi-Tab Sync
```javascript
window.addEventListener('storage', function(e) {
  if (e.key === KEYS.careTickets && !_ctStorageUpdating) {
    _ctStorageUpdating = true;
    _careTickets = Array.isArray(JSON.parse(e.newValue)) ? JSON.parse(e.newValue) : [];
    renderHome();
    setTimeout(() => { _ctStorageUpdating = false; }, 1000);
  }
});
```

### Bug Capture System
`KEYS.careTickets` added to bug report export data.

### Error Isolation
```javascript
// In renderHome():
try { ctRenderEntryPoint(); } catch(e) { console.error('CT entry:', e); }
try { ctProcessAllOverdue(); } catch(e) { console.error('CT overdue:', e); }
try { ctRenderFollowUpBanner(); } catch(e) { console.error('CT banner:', e); }
try { ctRenderZone(); } catch(e) { console.error('CT zone:', e); }
```

---

## 13. Medical Safety

### Disclaimer (first ticket creation)
```
"This helps you remember to check in — it's not medical advice. Always call your doctor if you're worried."
```

### Age Caveat (shown on template picker when Ziva > 12 months)
```
"Ziva is N months old. Tracking targets are set for 6–12 months — check with your pediatrician."
```

### Per-Escalation Inline Note
```
"Trust your instincts — seek help if worried, don't wait for the app."
```

### Per-Resolution Inline Note
```
"Only stop tracking if you're confident she's okay."
```

### Escalation Card — Doctor Lookup
```javascript
function ctGetPrimaryDoctor() {
  const doc = (doctors || []).find(d => d.primary && d.phone);
  return doc || (doctors || []).find(d => d.phone) || null;
}
// If null: "No doctor configured — add one in Medical tab"
// If found: tap-to-call link + copyable phone number
```

---

## 14. Validation (`ctValidateTickets`)

Runs on app init after data load. Fixes corrupted data before first render.

| Field | Validation |
|---|---|
| Entry exists | `t && t.id && t.createdAt` — remove broken entries |
| type | Enum: `incident`, `goal` |
| category | Must exist in `CT_TEMPLATES` → fallback: `custom` |
| title | String type |
| status | Enum: `active`, `resolved`, `escalated` |
| Timestamp fields (6) | Corruption → fix or null. Future (> 5min) → correct to now |
| Status consistency | resolved without resolvedAt → use lastCheckInAt. escalated without escalatedAt → use createdAt |
| escalationHistory | Array |
| followUps | Array, elements must be `number >= 0` |
| nextFollowUpIdx | Number >= 0, capped at `followUps.length` |
| lastCheckInAt | Corruption → recover from last check-in time |
| checkIns | Array, entries validated (time + verdict must exist), sorted by time |
| notes, resolvedNotes | String |
| lastSustainedCount | Number |
| firstMetAt | Corruption → null |
| reopenCount | Number >= 0 |

### Pruning
Resolved tickets older than 180 days are permanently removed:
```javascript
const CT_PRUNE_DAYS = 180;
```

---

## 15. CSS

### Specificity Strategy
All modifiers on `.chip` and `.card` use compound selectors: `.chip.ct-*`, `.card.ct-card.ct-*`.

### Complete Class List

**Cards:** `.card.ct-card`, `.card.ct-card.ct-incident`, `.card.ct-card.ct-goal`, `.card.ct-card.ct-escalated`, `.card.ct-card.ct-overdue`, `.card.ct-card.ct-approaching`

**Chips:** `.chip.ct-quick-clear`, `.chip.ct-answer-chip`, `.chip.ct-bool-chip[data-value="false"].active`, `.chip.ct-bool-chip[data-value="true"].active`, `.chip.ct-banner-btn`, `.chip.ct-resolve-btn`, `.chip.ct-template-chip`, `.chip.ct-reason-chip`, `.chip.ct-entry-chip`, `.chip.ct-entry-chip.ct-dimmed`

**Overlays:** `.ct-picker-scrim`, `.ct-picker-body`, `.ct-checkin-scrim`, `.ct-checkin-body`, `.ct-checkin-header`, `.ct-submit-area`, `.ct-detail-scrim`, `.ct-detail-body`

**Text/layout:** `.ct-card-meta`, `.ct-divider`, `.ct-resolve-prompt`, `.ct-deescalate-prompt`, `.ct-escalation-card`, `.ct-confirmation`, `.ct-confirmation.ct-sage`, `.ct-confirmation.ct-amber`, `.ct-disclaimer`, `.ct-age-note`, `.ct-storage-warn`, `.ct-phone-number`, `.ct-older-hidden`, `.ct-hidden`, `.ct-banner`, `.ct-overdue-dot`, `.ct-reopen-note`, `.ct-readonly-strip`, `.ct-auto-data`, `.ct-questions`, `.ct-question`, `.ct-question-label`, `.ct-chips-row`, `.ct-text-input`, `.ct-status-badge`, `.ct-status-badge.ct-rose`, `.ct-status-badge.ct-amber`, `.ct-entry-divider`, `.ct-toast`, `.ct-toast-fade`, `.ct-card-actions`, `.ct-preamble`

### Dark Mode
All colors via domain tokens with existing dark variants. No new dark-mode-specific CSS needed. HR-7 compliant.

### Animation
```css
@keyframes ct-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.ct-overdue-dot { animation: ct-pulse 1.5s var(--ease-med) infinite; }
```

---

## 16. Icons

### 8 New zi() Icons (62 total)

| Name | Usage | Notes |
|---|---|---|
| `fall` | Fall template card/picker | Figure/arrow-down concept |
| `bump` | Head bump template | Head/impact concept |
| `alert-circle` | Ingestion template | Circle with ! (distinct from `warn` triangle) |
| `trending-up` | Weight gain, sustained display | Arrow trending upward |
| `goal` | Sleep/food variety goals | Flag or finish-line concept |
| `clipboard` | Custom template, zone header, CTA | Clipboard/checklist |
| `follow-up` | Check-in button, notification banner | Clock with arrow |
| `resolve` | Resolve button, resolution prompt | Circle with check (distinct from `check`) |

All symbols use `viewBox="0 0 24 24"`. Defined in template.html SVG sprite.

---

## 17. Actions (24)

| Action | Trigger | Handler |
|---|---|---|
| `ctRaiseTicket` | CTA chip / zone "+" / QA intent | Open template picker |
| `ctSelectTemplate` | Template chip in picker | Highlight, populate title, check duplicates |
| `ctConfirmCreate` | "Start tracking" button | Validate → create → save → schedule → toast → close |
| `ctOpenCheckIn` | "Quick check" button (`stopPropagation`) | Open check-in overlay with pre-fill |
| `ctQuickClear` | "All clear" button | Auto-fill defaults → submit |
| `ctSubmitCheckIn` | "Submit" button | Collect → sanitize → verdict → save → schedule → UI |
| `ctSelectAnswer` | Chip tap in check-in | Update `_ctCurrentAnswers` + chip UI + submit state |
| `ctInputAnswer` | Text input change | Sync `_ctCurrentAnswers` (text also read from DOM on submit) |
| `ctResolveTicket` | "All clear — stop tracking" | Re-verify criteria (non-force) → resolve |
| `ctReopenTicket` | "Reopen" in history | Reset schedule + goal state |
| `ctForceResolve` | "Force resolve" on escalated | Show reason confirmation |
| `ctForceResolveReason` | Reason chip/text in confirmation | Set resolvedNotes → resolve(force) |
| `ctDeEscalate` | "Situation improved" | Reset to active + schedule |
| `ctKeepEscalated` | "Continue monitoring" | Close overlay |
| `ctOpenDetail` | Tap card body | Open detail overlay |
| `ctViewAll` | "View all (N)" link | List overlay, all active |
| `ctViewOverdue` | "Review" on multi-ticket banner | List overlay, overdue filter |
| `ctShareSummary` | "Share" in detail | Build text → navigator.share / clipboard |
| `ctShareNotify` | "Notify someone" on creation | Build creation message → share |
| `ctDeleteTicket` | "Remove" + confirmation | Clear timer → remove → save |
| `ctDismissOverdue` | "Skip" on overdue card | Advance nextFollowUpIdx → save → schedule |
| `ctCopyPhone` | Phone number tap in escalation | Copy to clipboard |
| `ctShowOlderCheckIns` | "Show earlier" in detail | Toggle `ct-older-hidden` class |
| `ctClose` | × button on any overlay | arg = `picker` / `checkin` / `detail` → per-type cleanup |

---

## 18. Module-Level Variables

```javascript
var _careTickets = [];
var _ctCurrentAnswers = {};
var _ctTimers = {};                    // ticketId → timeoutId
var _ctNotifiedTickets = {};           // ticketId → true (dedup)
var _ctBannerTicketId = null;          // Current banner ticket
var _ctDeepLinkPending = null;         // ?ct= param pending
var _ctResizeHandler = null;           // visualViewport listener ref
var _ctStorageUpdating = false;        // Multi-tab echo guard
var _ctSelectedTemplate = null;        // Current template in picker

const CT_QUIET_START = 22;
const CT_QUIET_END = 7;
const CT_PRUNE_DAYS = 180;
const CT_MAX_ACTIVE = 8;
const CT_DETAIL_VISIBLE = 5;
const CT_SHARE_MAX_CHECKINS = 10;
const ACTION_SEVERITY = { doctor_call: 1, er_visit: 2 };
const MAX_TIMEOUT = 2147483647;
```

---

## 19. Init Sequence

```
1. DOMContentLoaded
2. loadData():
   - _careTickets = Array.isArray(load(KEYS.careTickets, null)) ? ... : []
3. runMigrations()
4. ctValidateTickets()
5. ctPruneResolved()
6. renderHome():
   a. updateHeader()
   b. renderHomeFeverBanner() etc.
   c. try { ctRenderEntryPoint() }
   d. try { ctProcessAllOverdue() }        ← before zone render
   e. try { ctRenderFollowUpBanner() }
   f. try { ctRenderZone() }
   g. renderRemindersAndAlerts()
   h. ... rest of home
7. Schedule timers: active tickets → ctScheduleInApp(each)
8. _ctCheckDeepLink()
9. Register storage event listener
```

---

## 20. Share Summary

```javascript
function ctBuildShareSummary(ticket) {
  // Header: title, started time, scheduleBaseTime (if rebased), total check-ins, status
  // Timeline: last 10 check-ins with answers, verdicts, escalation events from escalationHistory
  // Quick-clear check-ins: "Quick check — all clear"
  // Escalation events interleaved chronologically
  // Footer: status + resolvedNotes if any
}
```

Shared via `navigator.share()` or clipboard fallback (`_qaClipboardFallback`).

---

## 21. Edge Cases

| Case | Handling |
|---|---|
| Empty state (first use) | Zone hidden. Entry chip visible. |
| Max 8 active | Entry chip dimmed + disabled. Creation blocked with toast. |
| All follow-ups exhausted | "Check in anytime or stop tracking" card with manual close. |
| Midnight boundary | Auto-data uses 24hr window, not `today()`. |
| Overdue pile-up (app closed for hours) | `ctAdvanceToNextFuture` skips to next future. Shows "Missed N checks." |
| Duplicate fall tickets | Disambiguated by start time in card title. |
| Sparse data (no sleep logged) | "Log sleep data to track progress" message. |
| Goal during illness | Sustained counter pauses (freezes, doesn't reset). |
| Template version change | Pre-fill validates against current options. New questions appear unanswered. |
| Clock manipulation | Future timestamps corrected on init. |
| localStorage full | Write verification + storage warning banner. |
| Network offline | Fully offline — no dependencies. |
| Tab closed during timer | Overdue detection on reopen. |
| Multiple tabs | `storage` event listener with echo guard. |

---

## 22. What This Does NOT Include (v1)

| Excluded | Rationale |
|---|---|
| Illness-type incident templates | Covered by existing illness episode system |
| Auto-ticket creation from data events | Phase 2 — avoid notification spam |
| Multi-caretaker real-time sync | Needs backend |
| Firebase/FCM push | Needs backend (Tier 2) |
| Historical analytics | Future — data is retained 180 days |
| Doctor-facing export | Future |
| Handoff mode | Share summary covers v1 |
| Score Popup integration | Phase 2 |
| Tomorrow's Plan awareness | Phase 2 |
| Outing Planner awareness | Phase 2 |
| Configurable quiet hours | Phase 2 |
| Age-adaptive thresholds | Phase 2 — disclaimer + caveat cover v1 |
| Template versioning (data-driven) | Phase 2 |
| Ticket rename after creation | Future |

---

## 23. Known Assumptions

| # | Assumption | Monitoring Signal | Fix Path |
|---|---|---|---|
| 1 | Medical thresholds calibrated for 6–12 month infants | Weight goal never resolves at 18+ months | Phase 2: age-adaptive thresholds |
| 2 | Prune window 180 days is sufficient | User can't find old incident data | Phase 2: archive summaries permanently |
| 3 | Quiet hours 10 PM – 7 AM fit the family | Notifications at 9:30 PM are disruptive | Phase 2: configurable |
| 4 | `normalizeFoodName()` quality is adequate | Food variety count seems wrong | Improve core normalization |
| 5 | Weight velocity from 2-point window is reliable | Premature goal resolution | Phase 2: require min 3 data points |
| 6 | Goal follow-ups capped at 7 prevent fatigue | User ignores all daily notifications | Phase 2: adaptive frequency |
| 7 | QA intent keywords are sufficient for discovery | User can't find feature | Phase 2: expand keywords + contextual suggestions |
| 8 | `getDailySleepScore` O(N) scan is fast enough | Noticeable lag at 1000+ entries | Index sleep data by date |
| 9 | Template-derived values should propagate immediately | Template change confuses user with active ticket | Review tickets before deploying changes |
| 10 | All browser APIs used are stable | API deprecation | All are web standards as of April 2026 |
| 11 | Notification permission can be revoked externally | Notifications silently stop working | Live permission check on every fire + creation |
| 12 | CareTickets data ~100KB at 6 months | localStorage approaching limit | Monitor total data size |
| 13 | Custom tickets as manual-resolution is adequate | User wants structured custom goals | Phase 2: custom metric binding |
| 14 | Single-device is acceptable for v1 | Second caretaker has no visibility | Phase 2: multi-caretaker sync |
| 15 | 21-day illness heuristic correctly handles chronic conditions | Chronic condition permanently pauses goals | Heuristic degrades gracefully |
| 16 | Multiple reopens produce confusing history | Ticket reopened 5+ times | Suggest fresh ticket after 2 reopens |

---

## 24. Implementation Plan

### Phase A: Foundation (~560 lines)
- KEYS + global vars + init (core.js) — ~30 lines
- CT_TEMPLATES constant (intelligence.js) — ~180 lines
- All data functions: verdict, metrics, utilities, validation — ~350 lines

### Phase B: Home Zone Rendering (~400 lines)
- template.html: 4 zone divs + 8 SVG symbols — ~50 lines
- styles.css: all `ct-*` classes — ~200 lines
- home.js: ctRenderEntryPoint, ctRenderZone, ctRenderFollowUpBanner — ~150 lines

### Phase C: Overlays + Interaction (~590 lines)
- Template picker overlay — ~120 lines
- Check-in overlay (form, chips, pre-fill, quick-clear, sticky submit) — ~250 lines
- Detail/history overlay — ~120 lines
- De-escalation prompt + escalation card + force-resolve — ~100 lines

### Phase D: Notifications, Integration, Polish (~580 lines)
- Scheduling + notification firing + quiet hours + banner queue — ~130 lines
- Permission flow + deep link — ~50 lines
- TSF events + QA intent + negative signals — ~70 lines
- Export/import/clear-all + storage listener + bug capture — ~45 lines
- Error isolation + disclaimers + creation toast + storage warning — ~75 lines
- Share summary + share notify — ~80 lines
- Init sequence wiring — ~30 lines

**Estimated total: ~2,130 lines**

### Build Session File Uploads

| Session | Files | Focus |
|---|---|---|
| 1 (Phase A) | core.js, intelligence.js, DESIGN_PRINCIPLES | Foundation + data layer |
| 2 (Phase B) | template.html, styles.css, home.js, intelligence.js (from session 1) | Zone rendering |
| 3 (Phase C) | intelligence.js (from session 2), styles.css | Overlays + interaction |
| 4 (Phase D) | intelligence.js (from session 3), home.js, core.js | Integration + polish |

---

## 25. QA Checklist

### Hard Rule Checks
- [ ] HR-1: Zero emojis in new code — all icons via zi()
- [ ] HR-2: Zero `style="..."` in new HTML — use CSS classes + classList.toggle
- [ ] HR-3: Zero `onclick=`/`onchange=`/`oninput=` — all via `data-action`
- [ ] HR-4: Zero raw px in new CSS (except 1px borders, header heights, transforms)
- [ ] HR-5: Zero `text-overflow: ellipsis` — titles wrap, never truncate
- [ ] HR-6: All new surfaces use domain colors (rose/lavender/sage/amber)
- [ ] HR-7: All new bg/color CSS uses tokens with dark variants
- [ ] HR-8: All interactive elements ≥ 36×36px tap target
- [ ] HR-9: Overlays classified (Read/Act/Flow), close behavior matches
- [ ] HR-10: No inline formatting — escHtml, escAttr, formatDate, formatTimeShort
- [ ] HR-11: No `white-space:nowrap` on variable-content chips
- [ ] HR-12: All user text through escHtml() — title, notes, resolvedNotes, text answers

### CareTickets-Specific Checks
- [ ] Every `select` question has `clearValue` defined and it exists in `options`
- [ ] Every escalation trigger references a field that exists in the template's questions
- [ ] `parseBoolOrString` is called on every `data-value` read
- [ ] `ctSanitizeAnswers` runs before `ctComputeVerdict`
- [ ] All overlay opens check for existing overlays first
- [ ] `ctAdvanceToNextFuture` does NOT call `ctSave` — caller saves
- [ ] `ctNextDueTime` guards: exhausted schedule → `Infinity`, corrupted base → `Infinity`
- [ ] `ctSortTickets` guards: `Infinity - Infinity` → stable (explicit check)
- [ ] `ctScheduleInApp` guards: exhausted → don't schedule, delay > MAX_TIMEOUT → cap
- [ ] `ctSustainedDays` and `ctCheckThresholdMet` both use `ctHasActiveIllness()` (not raw episode check)
- [ ] `ctRefTime` uses `|| 0` pattern (not `new Date(null)`) to handle null/undefined fields
- [ ] All template-derived values read via accessor functions (not stored on ticket)
- [ ] `_ctNotifiedTickets` cleared on resolve, reopen, de-escalate, delete
- [ ] `visualViewport.resize` listener removed on check-in overlay close
- [ ] Function declarations used (not const arrow functions) for build-order hoisting

### Design Principle Scores (post-build)
| Principle | Score |
|---|---|
| 1. Emphasis / Dominance | /5 |
| 2. Unity / Rhythm | /5 |
| 3. Hierarchy | /5 |
| 4. Balance | /5 |
| 5. Proportion / Scale | /5 |
| 6. Contrast | /5 |
| 7. Similarity | /5 |

---

## Spec Process Summary

| Pass | Focus | Findings |
|---|---|---|
| Pass 1 (×4) | Core concept | Lifecycle, two categories, warm language, discovery entry point |
| Pass 2 (×4) | Data flow | 21-field model, 4 resolution types, split verdict logic, template-derived accessors |
| Pass 3 (×4) | Integration | 20 surfaces mapped, TSF integration, QA intent, error isolation |
| Pass 4 (×15) | Bugs | 310 scenarios: 8 critical, 31 high, 86 medium — all fixed |
| Pass 5 (×3) | Drift | 16 known assumptions with monitoring signals |
| Pass 6 (×2) | Builder questions | Init sequence, HTML structures, CSS classes, handler routing, all answered |
| Pass 7 (×2) | Consistency | Field counts, action counts, function counts verified. Dead references removed. |
| Pass 8 (×2) | Completion | Zero criticals/highs in last 40+ scenarios. Spec declared build-ready. |

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 10 Apr 2026 | Initial concept + Pass 1 |
| 2.0 | 10 Apr 2026 | Consolidated after 4 Pass 4 runs. SW/IDB removed. Verdict clearValue fix. |
| 3.0 | 10 Apr 2026 | Full rebase after 7 Pass 4 runs. Notification architecture rebuilt. Quick-clear, quiet hours, medical disclaimer added. |
| 4.0 | 10 Apr 2026 | scheduleBaseTime added. Resolution suggestion simplified. 3 fields cut. |
| 5.0 | 10 Apr 2026 | 4 template-derived fields removed (25→21). Discovery entry point added. Post-creation toast. Seizure question. Illness detection consistency fix. Final build-ready. |

---

*This document follows SPEC_ITERATION_PROCESS.md v1.0. It is the canonical spec for CareTickets. Every build session reads this before writing code.*
