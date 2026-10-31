# SproutLab — Bug Log
**Maintained by:** Lyra (Builder) · Maren (Care) · Kael (Intelligence) · Vela (Surfacing — canon-gen-001)
**Last updated:** 2026-10-31 (child-sex S2–S4 build section opened; prior: 2026-10-28 repo sweep — stale entries moved to Fixed, sweep findings logged near the top of Open Bugs)
**Format:** P0 = visible user-facing bug · P1 = correctness/data bug · P2 = code quality / HR violation

---

## Open Bugs

### Child-sex S2–S4 build — 2026-10-31 (pronouns, care guidance, infant weight gain)

Session record of every bug found while building and testing S2 (pronouns), S3 (sex-specific care guidance) and S4 (infant weight-gain bands) per [`specs/child-sex-v1.md`](./specs/child-sex-v1.md). Entry form: symptom, cause, fix, where (file:symbol), how caught, status. Fixed entries stay here as the session record and move to Fixed Bugs at merge.

Entries 1–4 were found by the S2 render-time pronoun builder while working and caught in code review, not by a test.

#### P1 — Child's name could trip a Q&A keyword in two answers (1)
- **Symptom:** a name like "Sita" could match the milestone word `sit` in `qaAnswerMilestoneSpecific` / `qaAnswerNutrientGap`.
- **Cause:** `qaExecuteQuery` stored `_qaCache._queryText` from the raw text, not through `_qaNameAsShe`. The V-K-280-5 fix (#280) missed this path.
- **Fix:** `_queryText = _qaNameAsShe(text)`.
- **Where:** intelligence-qa.js `qaExecuteQuery`.
- **Caught by:** code review (S2 render-time pronoun builder); no test.
- **Status:** **Fixed** (S2 render patch).

#### P0 — Nutrient section header hard-coded for a girl (2)
- **Symptom:** the nutrient-rich foods header read "HER <nutrient>-RICH FOODS" for every child.
- **Cause:** the label `'HER ' + nutrient + '-RICH FOODS'` is uppercase, so a lowercase grep for the girl-specific pronouns missed it.
- **Fix:** `pron('poss').toUpperCase()` in place of the literal `'HER '`.
- **Where:** intelligence-qa-handlers.js ~:2010.
- **Caught by:** code review (S2 render-time pronoun builder); no test.
- **Status:** **Fixed**.

#### P0 — Growth fun-fact is girl-specific (3)
- **Symptom:** the growth fun-fact said "A little warrior princess" for every child.
- **Cause:** hard-coded girl wording.
- **Fix:** "prince" when `childSex()==='m'`.
- **Where:** medical.js ~:1793.
- **Caught by:** code review (S2 render-time pronoun builder); no test.
- **Status:** **Fixed**.

#### P2 — `_qaNameAsShe` turns a possessive name into "she" (4)
- **Symptom:** "Arjun's nap" becomes "she nap" rather than "her nap".
- **Cause:** `_qaNameAsShe` has no possessive handling. Pre-existing.
- **Fix:** none. The result still matches intents, so it was left as is.
- **Where:** intelligence-qa.js `_qaNameAsShe`.
- **Caught by:** code review (S2 render-time pronoun builder); no test.
- **Status:** **Open** (accepted, low).

### Repo sweep — 2026-10-28 (monthly-update session, Ziva 13.8 months)

A full sweep of the roadmaps, specs, this log, the handoffs, code stubs and git. Seven entries that had in fact been fixed were moved to **Fixed Bugs → Ledger sweep (2026-10-28)**. The reconciled plan lives in [`ROADMAP_2026-10_RECONCILED.md`](./ROADMAP_2026-10_RECONCILED.md). New entries found by the sweep:

#### P1 — Old Vit D3 drops still show as due after the switch to Caldikind (parent report, 2026-10-28)
- **Symptom:** the parents report the retired D3 drops still appearing as a dose to give. Her doctor confirmed Caldikind alone (no drops), so a "give drops" prompt invites a double Vitamin D dose.
- **Likely cause:** `_migrateCaldikind20260924` (core.js) is one-shot per device and sets its flag first; it returns early without deactivating the drops when Caldikind is already in the list (e.g. added by hand on 24 Sep), and its name test (`\bd3\b|vitamin\s*d\b`) misses entries like "Vit D drops".
- **Fix shape:** a second, idempotent pass under a new flag — whenever an active Caldikind/calcium-D3 supplement exists, deactivate every other active Vitamin D supplement (`isVitDSupplement`), push once so both phones converge. Maren + Kael. Pre-15-month PR.
- **Fixed in #273** (`_migrateVitDSingle20261028`). Residual (Kael V-K-273-5, accepted): a phone still on old code with an unsynced medicines edit can push the drops back as active; the one-shot flag won't rerun, so the parent stops them by hand. A multivitamin named "Vitamin D…" started before Caldikind is also stopped (doctor: Caldikind alone).

#### P2 — Vaccine sync follow-ups from #273 (Kael / Maren)
- **Identity collision:** the vaccine union keys on `name + date`, so a dose given on its scheduled date has the same identity pending and given; a stale phone's full push can put the pending copy back over the given one in the cloud. Updated phones filter it out (push, receive, cold load), but widen `SYNC_ENTRY_IDENTITY[KEYS.vacc]` (key pending entries on `scheduledDate || date`, or include the state). Kael V-K-273-1.
- **Shadow after merge (V-K-268-4b) now includes `vacc`:** stale pending twins stay in the cloud until the next local vaccine edit pushes.
- **Raw readers:** `calcMedicalScore` (core.js), the ISL vaccine summary and qa-handlers' vaccine list still read raw `vaccData`; route them through `vaccDropSatisfiedPending` so score and Q&A always agree with the UI (Kael V-K-273-4).
- **One "next dose" rule:** `getNextUpcomingVacc` skips conditional doses, but `renderRemindersAndAlerts` (home.js, where the 7-day "Given" button lives) and `renderVacc` (medical.js) only drop satisfied twins — a conditional dose that is the earliest due within 7 days could still be offered "Given". Ziva's data doesn't hit it (MCV-1 is overdue). Route both through one helper (Cipher E-V on #273).
- **Fever lines:** `fever-mild` lists "above 102°F (38.9°C)" as emergency while Teething/Ear now say 38.3 °C same-day and 40 °C emergency — one reconciliation pass (Maren N-2).


#### P1 — CareTicket thresholds are still the 6–12 month set (age trigger passed Sep 2026)
- **Symptom:** the CareTicket targets were planned to become age-adaptive at 12 months (SPROUTLAB_ROADMAP v7, "review by Sep 2026"). Only a disclaimer was added: the target text says it was "set for 6–12 months" (intelligence-caretickets.js). A toddler's tickets are judged against infant targets.
- **Fix shape:** an age-banded target table (12–24 m first), sourced; Maren-primary, Kael for the engine. Blocked on the Kael Region split for any sizeable addition.

#### P1 — Kael Region at 29,667 LOC (≈333 to the 30K trigger; measured after #273)
- **Symptom:** the 12–24 m expansion (#268–#270) added ≈930 engine lines. Every engine-side item in this log and the roadmap now risks tripping the trigger.
- **Fix shape:** a Lyra spec for the Kael→successor split (proposed boundary: data tables vs engine logic), Architect-ratified, before the next engine or data addition. Supersedes the three per-PR headroom notes below.

#### P2 — User-facing "coming soon" stubs (HR-8 compliant, but visible)
- Symptom-checker footer **Save / Share / Track** (`medical.js:2662–2664`, `scSaveResult` …): visible on every result. Part of the unbuilt symptom-checker D3 (see the weave-ISL / UX-vision specs).
- CareTicket **View all / View overdue** (`intelligence-caretickets.js:1881, 1884`): the CareTickets Phase 2 list views.

#### P2 — Chart.js loads from a CDN with no version pin (`build.sh:239`)
- **Symptom:** `<script src="https://cdn.jsdelivr.net/npm/chart.js">` resolves to whatever is latest; a breaking major or a compromised release reaches the app on next load. Roadmap item 1b (vendor Chart.js, closes ASI04) is not started.
- **Fix shape:** pin an exact version now (one-line change, build.sh — infra, Cipher review); vendor it under roadmap 1b.

#### P2 — Inline `onchange` on the Essential-mode toggle (template.html:3043, HR-3)
- `onchange="toggleEssentialMode()"` — the Phase 4 carry-forward P-6, never closed. Sits beside the `#settingsRefStd` HR-2/HR-3 entry under the #266 nits; fix both together.

#### P2 — Surface Catalog follow-ups (Cipher Edict V nits on #254, merged 2026-10-28)
- **≤360 px orphan pill (styles.css ~6097):** `@media(max-width:360px){ .zs-domain-pill{grid-column:span 2 !important} }` beats the zoom full-row rule, so the fifth Home pill (Milestones) sits alone in a half row at ≤360 px at every zoom. Pre-existing. Fix: drop the `!important`, use `.zs-domains .zs-domain-pill` (0,2,0) plus a `:last-child:nth-child(odd)` full-row rule inside the query. Maren / Vela; shared module → all four Governors.
- **SCORE_LABELS parse is all-or-nothing (build-surface-catalog.mjs):** it warns only when zero rows match; a single reformatted row drops that ring state silently. Warn when no `min: 0` row is found or the row count differs from the `min:` count. Public Works.
- **Installed PWA serves the catalog's linked CSS one revision late (sw.js stale-while-revalidate):** add a build hash to the link (`styles.css?v=<hash>`) or a "reload twice" note in the banner. Public Works.

#### P2 — Roadmap v7 assumptions past their review date
- "CareTicket data ≈ 100 KB" (review Oct 2026) and `normalizeFoodName` quality (Sep 2026) are due; "localStorage < 2 MB" falls due Dec 2026. Measure on a real device export and record the figures.

---

### 12-month age step — Tier-2 gaps (logged 2026-09-24, monthly-update session)

Ziva turned one on 2026-09-04. A scout survey found every surface keyed to an age table
that stops at 12 months. The **Tier-1** items (unsafe or wrong) were fixed in the monthly-update PR:
child choking/CPR protocols, the fast-breathing threshold, WHO growth 0–24 m with IAP→WHO (the Architect's call, 2026-09-24), the
12–24 m velocity bands, the vaccine age map (JE-2 / Hep A-2 / Varicella-2), added sugar gated to 2 y,
and the age-aware diet tips. The **Tier-2** items below are stale or empty rather than unsafe:

#### Progress — 12–24 m expansion PR 1 (#268): development + teeth
- **Fixed in #268:** MILESTONE_STANDARDS reach 24 m (who 13–24; iap/eu/cn borrow them per month); Upcoming, next-milestone, lookouts and score move past 12; the age copy grows ("1 year 2 months"); 2nd-birthday event; toddler activities (and the `msStatus` gate bug); teething lookout to 33 m; the new tooth chart (Milestones → Library, synced `ziva_teeth`).
- **Still open from #268 (Governor deferrals):**
  - *Receive-side shadow after a merge hook (Kael V-K-268-4b, systemic):* when `mergeOnReceive` returns a value that differs from the remote, `_syncShadow[key]` holds the merged value, so a local-newer entry never flows back up until the next local edit. Affects `teeth`, `milestoneSuppress` and `activityMeta` alike. Fix: set the shadow to the remote value and queue a `syncWrite` after `_remoteWriteDepth--`. The push side for teeth is fixed in #268.
  - *Evidence-key resolver (Kael V-K-268-5):* 48 of 102 toddler rows resolve to a generic short key by substring (walk / point / first_word). Four wrong ones were reworded; an optional `evidenceKey` row field honoured by `_msResolveEvidenceKey` (Maren) is the robust fix.
  - *Kael Region 30K headroom (V-K-268-9):* about 29.2K after #268 (≈ 800 to the trigger). Scope the Kael successor split before the next large engine or data addition; MILESTONE_STANDARDS alone is about 450 lines.
  - *Borrowed-standard label (V-K-268-15):* rows borrowed from WHO report `standardKey:'iap'` etc.; consider `borrowedFrom:'who'` on the window.
  - *Past 24 months (Maren V-M-268-13, Kael V-K-268-14):* the milestone windows end at 26 m (≈ day 791, 2 Nov 2027), the Upcoming list keeps offering the 24 m CDC rows, and the activity list drops to a few infant-worded rows after 24 m. Extend with CDC 30 m / 3 y before mid-2027, alongside the growth-table horizon above.
  - *Tooth chart (Vela V-V-268 deferral):* recorded teeth don't appear in the Activity Log, Today So Far or the Milestone Timeline; the chart sits under Library though recording is a Log-type action. Teeth carry `role="button"` but no `tabindex`/key handler (Cipher nit 3; app-wide, no non-native `data-action` element handles Enter/Space).
  - *Two window ends (Cipher nit 5):* windows return `expectedEnd` (end − 1) for display while status is decided at `endBracket * 30.44`; on the day between, `_msWindowBandLabel` says "late band". Harmless; consider one `expectedEndExclusive`.
  - *Units (Vela V-V-278, Maren V-M-268-12):* hero/header speak years; windows, the Upcoming label ("12–15 months") and the in-window "Ziva is 12m 20d" narration (home.js, 30.44-day months) speak months. Doctor share/print now append total months. Decide one convention for the in-window narration.
  - *Pre-existing, surfaced:* `renderActivities` interpolates `a.title`/`a.desc` unescaped (static content, HR-4); the Activities list uses lavender for Sensory while milestones use amber; the curd "room temperature only" rule (data.js COMBO_RECIPES) has weak evidence (Ceres V-C-268-3, Kael to decide); `home.js` snack tip "ragi biscuit" (most contain sugar); the symptom guide lists 38.3 °C under emergency care, which over-escalates for a toddler (Maren V-M-268-1).

#### Progress — 12–24 m expansion PR 3 (#270): nutrition
- **Fixed in #270:** 28 cited toddler recipes (family food, adapted — portion, chew-safety, MDD groups); food-library overlay (foods, aliases, sugar/salt gates, allergen names…) merged from recipes.js and guarded by `audit-food-lib-overlay-v1.sh`; hazard gates (whole chana 48, chikki 48, raw sprouts 60, shellfish 6) in data.js; rule corrections in data.js (chai, juice, biscuit, corn, gajak, peanut, honey); `after` lines (salt, juice, raw salad, corn, honey) on the Library, combo, Q&A and detail sheet; one age-aware honey framing (`foodEffectForAge`) on every surface; combo cache schema bump; whole-word food matching in the synergy tips, combo recipe tier, recipe tap-through and meal nutrition parser; diet-preference gates on Q&A suggestions and synergy tips; toddler diet tips (family food, meals/snacks, five food groups).
- **Still open:**
  - *Texture ladder past 'finger':* the ladder is defined five times (core.js `_expectedTextureStage`, medical.js `TEXTURE_STAGES`, qa-handlers ×2, diet.js scoring) and tops out at 'finger'. Recipes carry `texture:'family'` and the tips describe it, but the engines have no 'family' stage; adding one needs a shared definition + classifier keywords (Kael + Maren).
  - *Variety target:* `VARIETY_TARGETS` stays 18 foods/week from 12 m (no numeric source for a toddler count); the WHO MDD "5 of 8 groups a day" is surfaced as a tip, not scored. Recipes carry `mddGroups` for a future MDD score.
  - *Draft sidecars not wired:* `SAFE_FORM_12_24` (29 choking safe-forms for a 4-tooth toddler) and `IFCT_REF_12_24` (per-100 g protein/calcium/iron) from the research draft are not merged — nothing renders them yet. **The research draft itself was never committed** (not in the repo, any branch, or git history — found in the 2026-10-28 sweep), so the sources must be re-gathered before wiring.
  - *Decisions:* popcorn gate 48 (AAP until 4) vs the choking record's 5; generic 'laddoo' deliberately ungated (sugar-bound besan ladoo reads ungated); 'cake' also gates plain rice cakes (accepted false positive).
  - *Governor deferrals (#270 QA):* a name that reaches two records ("til chikki", "peanut chikki") shows the sesame/peanut encourage card, not the choking floor — the 48-month gate still protects (Kael V-K-270-9, needs a resolver rule); the NUTRITION `fish` entry claims omega-3 for lean rohu (Kael/Maren); plain "lassi" (usually sweetened) has no gate (Maren N6); Library duplicates for one food (badam/almonds, prawn/shrimp/jhinga, tahini/gingelly) — extend `_FD_SYN` (Kael V-K-270-10); `classifyFoodToGroup` / `_categorizeFoods` substring passes and the WHO-8 vs FOOD_TAX group mismatch in the five-groups tip (Vela V-V-270-12); SUB_SUGGESTIONS 'vegs:roots' still offers "carrot sticks"; `TODDLER_FEEDING` has no consumer; gajak lost its sesame allergen note (gated at 48, low stakes); the infant reco juice tiles (watermelon) predate juice@12; bare "mustard" takes the mustard-greens combo recipe (ambiguous query). Cipher E-V follow-ups: move `_foodWordHit` into core.js as the one word matcher (it duplicates `_lookupByFoodName`'s boundary rule); the 'energy drink'@216 stimulant gate still lives in the overlay (the overlay audit guarantees it merges); the e2e specs `food-effects-v2-r1-combo-checker` / `-r2-qa-food-safety` assert infant honey framing without pinning the clock — pin it or re-baseline to 12+ m.
  - *Existing gaps surfaced:* the cow-milk allergen card never fires on 'milk'/'curd'/'paneer'/'buttermilk' (aliases only cover forms like 'whole milk'); new milk/egg/fish NUTRITION entries join `_getFatBearingFoodNames` (changes Vit D3 'with fat' detection — Kael); COMBO_RULES 'no ragi with paneer' contradicts FOOD_SYNERGIES ragi+curd; NUTRITION 'fig' vs 'anjeer' disagree; `FOOD_SUGGESTIONS` has no consumer; infant copy in the 6–9 m recipes (cow's milk waits, no salt before 12 m) is correct for those recipes' ages.

#### Progress — Caldikind-P NF replaces the Vit D3 drops (#270)
- **Fixed in #270:** twice-daily dose slots (`core.js` `medDoseSlots` / `medSlotStates` / `medDayVal`) with one "Done now" per med at a time, an unlogged-earlier-dose prompt ("don't double up"), quiet "later today" rows that can log an early dose, a 05:00 morning start, start-day applicability (`createdAt`), bare-name fallback for older builds; an explicit "Doses a day" choice in the add form (conservative free-text fallback); Vitamin D supplement detection by name/brand (latest start wins) with a stop-the-old-one prompt; a one-shot per-device switchover (drops → Caldikind-P NF); calcium + D3 guidance live on the streak tip; slot-aware chip, day plan, 14-day card, Info adherence (partial status), Smart Q&A, ISL, medical score, Today So Far story.
- **Still open (Governor deferrals):**
  - *Timing per dose (Maren N-1 / Vela V-V-270-6 / Kael V-K-270-31):* the 14-day card's "Usual time" band, the Info timing line and `computeSupplementAdherence` use the first given dose only; show a band per slot.
  - *With-fat badge near an iron meal (Ceres V-C-270-17):* for a calcium supplement, flag a dose given within the iron meal's window with a gentle amber note.
  - *Food-only calcium alerts (Ceres V-C-270-22):* 'low-calcium' tips ignore the prescribed calcium; add "plus the calcium in her supplement" when one is active.
  - *Nudge tap (Vela V-V-270-13, pre-existing):* the Today So Far "Mark done" nudge animates card 0 and stamps tap time.
  - *Name collisions (Kael V-K-270-29):* a once-daily med literally named "X · morning" would share a key with twice-daily "X"; med names containing `.` or `/` break sync dotted paths (pre-existing).
  - *Kael Region headroom:* 29,575 LOC after this change (≈425 to the 30K trigger). Scope the Kael→successor split before the next engine feature.
  - *Adequacy question for her doctor — answered 2026-10-28:* the pack gives ≈100 IU/day at 2.5 ml twice daily (vs 800 IU from the drops); her doctor confirmed Caldikind alone is enough, no separate D3 drops. The app keeps asserting nothing about the dose.

#### Progress — 12–24 m expansion PR 2 (#269): sleep + vaccines
- **Fixed in #269:** SLEEP_STANDARDS to 36 m with one nap source; IAP 2023 vaccine reconciliation (four non-IAP doses removed, due windows + grace, conditional doses, seasonal yearly flu, series completion for JE-2/MCV-2, word-boundary vaccine matching).
- **Still open (Governor deferrals):**
  - *Next upcoming vaccine (Maren V-M-269-8):* `addVacc` no longer flips other pending doses to given, so several `upcoming:true` entries can coexist. A dozen consumers use `vaccData.find(v => v.upcoming)` (first in array order, not earliest by date) — home card, 7–14-day reminder, day plan. Add `getNextUpcomingVacc()` (earliest by date, skip or flag past-dated) and route them through it.
  - *Mark given / Not needed (Vela V-V-269-9/10):* no in-card action to mark a due dose given or a conditional dose not needed; free-text names still drive matching (yearly flu is matched by any flu entry in its band).
  - *Next-dose auto-scheduling* after `_vaccMarkDone` (from the IAP 2023 review) is still open.
  - *Toddler safe-sleep tier (Maren V-M-269-15):* the Safe Sleep tips are infant-only (SIDS, nothing in the crib); toddler items (crib climbing, lowering the mattress, blind cords, when a light blanket is fine) belong on the 12-month checklist.
  - *Vaccine score predicate (Kael V-K-269-10):* the routine-dose rule is re-derived in `calcMedicalScore`, its `vaccDueNow` detail and `renderVaccCoverage`; extract one helper.
  - *Kael Region headroom:* ≈ 29.3K after #269 (≈ 700 to the 30K trigger). Refresh the CLAUDE.md jurisdiction summary and scope the Kael split before PR 3's data additions.
  - *Next PR first item (Cipher E-V 3):* Home picks the first upcoming entry in array order while Medical picks the earliest date — `getNextUpcomingVacc()` unifies them.
  - *Engine tests (Cipher E-V 11):* add a regression spec for `vaccDueState` season cases (Sep → future, Apr–Jul → due, flu dose within 300 days → future), follow-on gating, the conditional → check path, and `getSleepTargets` anchors. When the shared vaccine helper is extracted (V-K-269-10), move the vaccine helpers from core.js to medical.js (≈ 50 lines of Kael headroom) and pass `givenList`/`now` explicitly (Cipher E-V 5–6).
  - *UIP OPV booster (Cipher E-V 12, Maren call):* the UIP gives an OPV booster at 16–24 m; her record mixes UIP and private doses (OPV-0/1 logged). Decide whether to list it.
  - *SLEEP_STANDARDS anchors (Cipher E-V 7):* 13, 15, 19, 30 and 36 repeat the key below them in every field but naps; prune or move to a band table.
  - *Small copy:* the under-12 m nap tips still say the 2→1 shift is "usually around 12–15 months" (12–18 elsewhere); the 7-day sleep pill's sage threshold is the standard's target, stricter than the tip's "11–14 h is normal" (Vela V-V-269-13); `intelligence-quicklog.js` hard-codes a 720-minute target (Kael pair-note).

#### P2 — Age copy still speaking "infant" (most fixed in #268–#270; re-checked 2026-10-28)
- Fixed: hero and Q&A age ("1 year 2 months"), 2nd-birthday entry, toddler activities, teething lookout to 33 m, age-aware diet tips.
- Still open: the CareTicket target text "set for 6–12 months" (see the CareTicket threshold entry above); the template.html help text is written for 6–8 months; the poop-frequency guide caps at 9–12 m. The texture ladder and variety target are tracked under the #270 progress block.

#### P1 — Growth-velocity bands are still hand-copied at ~11 sites (Maren V-M-266-4)
- **Symptom:** the 12–24 m band is shared (`GROWTH_VELOCITY_12_24`), but each site still carries its own ternary chain for 0–12 m. Some sites key on today's age, and `computeGrowthVelocity` keys on the measurement's (rounded) age.
- **Fix shape:** add one `growthVelocityBand(ageMo)` helper in core.js holding every band, called with the measurement's age, and replace the chains. This is the same consolidation `VACC_AGE_MONTHS` did for vaccines. Kael co-sign.

#### P1 — 24-month reference horizon (Kael V-K-266-9 / Maren V-M-266-14)
- **Symptom:** `getInterpolatedWHO` clamps to the 24-month row. From 4 Sep 2027 every reading would silently compare against month 24, which is the same drift this PR fixed at 12 m. WHO also switches from recumbent length to standing height at 24 m (about 0.7 cm lower).
- **Fix shape:** before Jul 2027, extend with the WHO 2–5 y tables (height-for-age, with the length/height adjustment), and add a build-time horizon warning when DOB + table-end is within 90 days.

#### P2 — Deferred Governor NITs from PR #266 (12-month audit)
- **Vaccines (Maren V-M-266-7, rest):**
  - range labels ('16-18 months', '18-19 months') should flag Missing only after the window END plus a grace period;
  - compute JE-2 as JE-1 date + 28 days once JE-1 is logged;
  - add a "not needed for our vaccine" dismiss for conditional doses (Hep A-2, PCV Booster-2).

  The +0.5-month look-ahead that labelled JE-2 "Missing" early is fixed.
- **Honey reasons (Ceres V-C-266-5):** the combo checker's honey 'avoid' headline and the Library honey shelf still give the botulism reason at every age. From 12 m the reason is "added sugar, until 2".
- **Salt verdict (Ceres V-C-266-10):** the Library shows "Fine from 12 months" and hides the reason. Add an optional `after` line to AGE_RULES salt ("lightly — under 2 g/day at 1–3 y").
- **Tips:** two duplicate tips predate this PR ("Early allergen…" ×2, hydration ×2). "Ziva is here" in the First-foods guide could return as a dynamic age marker (Vela V-V-266-11).
- **Chart legend (Vela V-V-266-10):** the shaded 3rd–97th band has no label. The help tip now explains it; a caption under the chart would be better.
- **CPR completeness (Maren V-M-266-12):** add the landmark ("where the lowest ribs meet, one finger's width above"), "use both hands if you can't push 5 cm", and a 10-second breathing check. Paediatrician sign-off is still desirable.
- **Settings select HR-2/HR-3 (Kael V-K-266-15, Maren):** the `#settingsRefStd` select has an inline `style=` and `onchange=` (pre-existing). The `.chart-filter-btn.active-india` / `.active-both` rules in styles.css are now dead CSS.
- **Tests (Ceres V-C-266-9, Kael V-K-266-1):**
  - add a 12.7-month e2e case: toddler tips present, infant tips absent, and jaggery reads 'avoid' even with a green result pre-seeded in the combo cache;
  - add compound-name self-tests ("milk with sugar", "salt and sugar", "chocolate milk") to the resolver audit.

  The e2e suite still can't launch in the remote container (Playwright 1.48 vs chromium-1194).

#### P2 — Cipher Edict V nits from PR #266
- `renderInfoGrowthDiet` shows "normal" with a check when the weight interval is too short to judge. It should be neutral. This is practically unreachable once a birth weight is on file.
- `_fdAgeRule` lives in diet.js (Ceres), but qa, quicklog and home call it behind `typeof` fallbacks. Move it next to `_lookupAllByFoodName` in core.js so one resolver owns the boundary.
- Pre-existing: "shark fish with salt" matches salt@12 first, so the high-mercury guard is skipped (the null guard keys on the first match being fish). "sugar snap peas" now reads 24; that's stricter, so the safe direction.
- GRAPHIFY_INTEGRATION.md gives 2,843 cross-file calls for 0.9.6 (bisect probe, raw `source_file`) and 2,286 (live baseline, normalized). Normalize the probe and restate a single figure.
- SYMPTOM_DB breathing: "More than 60 breaths per minute" is the infant emergency line. It is coherent with the new ≥ 40 "fast" line, but Maren should confirm the toddler emergency threshold.

#### P2 — 0–12 m velocity bands above the WHO median
- **Symptom:** the 9–12 m band (8–13 g/day, 55–100 g/week) sits above the WHO median (~7.5 g/day at 10–12 m). Historical only now that she's past 12 m. The 12–24 m band is sourced (`GROWTH_VELOCITY_12_24`, core.js).

---

### Home Tab

(Symptom Checker P1 — severity badge invisible on `crying-fussy` (mild) entry — RESOLVED bridge build 2026-05-13; see Fixed Bugs § Bridge Build.)

---

### Growth Tab

#### P1 — Growth gauge hex color values hardcoded in JS (medical.js)
- **Symptom:** `wtColor = '#c06078'` and `htColor = '#4686a0'` are raw hex values in JS, not CSS custom properties. Should use design-system tokens.
- **Rule violated:** HR-2 (no inline values — tokens only) applied to JS color constants.
- **Notes:** Deferred to Stability sub-phase R-10 JS-side hex baseline sweep (~15 sites identified by Kael).
- **File:** `split/medical.js` inside `renderGrowthHero`

---

### Data / Sync

#### P1 — `medChecks` / `feedingData` not migrated to object-keyed shape
- **Symptom:** Pre-Phase-4 data shape uses array indexing; object-keyed shape (by date string) is required for cross-device sync consistency and efficient lookups.
- **Sequencing:** Stability sub-phase carryforward item.
- **Files:** `split/medical.js`, `split/sync.js`

#### P1 — Illness-episode sync receive re-renders from stale module arrays (all four keys)
- **Symptom:** `SYNC_RENDER_DEPS` registers `feverEpisodes` / `diarrhoeaEpisodes` / `vomitingEpisodes` / `coldEpisodes` with `global: null` and dispatches the episode-card renderers on receive, but those renderers read module-level `let` arrays (`_feverEpisodes` etc.) hydrated once from localStorage at load, not the freshly written key. Device B resolves an episode; device A keeps showing "Active … Episode" until reload. Nothing throws (per-renderer try/catch), it silently no-ops on data.
- **Fix shape:** Either a `_postReceive*` hook per episode key that reassigns the module array (the `_postReceiveMilestones` idiom), or have `getActive*Episode()` read through `load()`. Kael-primary; separate PR.
- **Origin:** Kael V-K-3 on PR #263 (fever readings toggle), widened by Cipher Edict V ruling 5 from fever-only to all four illness-episode keys. Pre-existing; not introduced by #263.
- **Files:** `split/sync.js` ~lines 244–247 (registrations), `split/intelligence-illness.js` ~lines 3–14 (`_feverEpisodes` hydration) and the diarrhoea / vomiting / cold module arrays.
- **Raised again on PR #267 (Maren V-M-267-5, Kael V-K-267-3):** the new resolved-episode editor is a write path that saves the whole module array, so a device left open can revert the other parent's entries. #267 re-reads the stored list before editing (a minimal guard). The real fix above is still owed, and should add the `render*History` renderers to the episode keys' `SYNC_RENDER_DEPS`.

#### P2 — Deferred from the PR #267 Governor round (illness edit + timezone)
- **`_qaLastIllness` answers with "Invalid Date" / "Unknown" (Kael V-K-267-10).** `intelligence-qa-handlers.js` ~195–206 reads `ep.startDate` / `ep.type` / `ep.durationDays`, which no episode has (they carry `startedAt` / `illnessType` / `resolvedAt`). Its sort key is always `''`, so it returns the OLDEST episode. Fix: sort by `(resolvedAt || startedAt)` descending and read the real fields (`_episodeDurationDays`). Separate PR.
- **More UTC-day slices on episode dates (Kael V-K-267-11, Ceres, Maren V-M-267-8):**
  - `intelligence-isl.js` ~404 (the "since the fever" anchor) and ~777 (range illness filter) use `startedAt.substring(0,10)`;
  - `medical.js` ~7982 buckets illness frequency by `startedAt.slice(0,7)` (a start before 05:30 IST on the 1st lands in the previous month);
  - `home.js` milestone `doneAt` / notification timestamps are sliced at ~5069, 7004, 7035–7036, 7808, 7956, 8013, 9269, 9839.

  Fix: use `toDateStr(new Date(x))`.
- **`formatDate('YYYY-MM-DD')` parses as UTC midnight (Kael V-K-267-12, Maren V-M-267-8).** `core.js` ~4002. It is correct in IST but shows the previous day west of UTC. diet.js has the same `new Date('YYYY-MM-DD')` pattern at ~60, 3142, 3963, 4261, 4924 and 7524 (Ceres scan); it is safe while the family is in UTC+. Fix: parse by components. Every caller is affected, so do it in a separate PR.
- **No timezone in the e2e config (Maren V-M-267-9).** `playwright.config.ts` runs in the container's UTC, which is why the edit-sheet UTC bug was never caught. Add a spec with `timezoneId: 'Asia/Kolkata'` and one negative-offset zone, covering: local pre-fill, day-preserving edits across midnight, and the resolved-edit guards (same-minute, next-episode, symptom-only floor).
- **Attribution on edited episodes (Kael V-K-267-5).** The row's "by X" keeps the original logger after the other parent edits the end time. #267 adds an "End time edited" line; clearing `__sync_updatedBy` so the flush re-stamps the editor is still open.
- **Tappable rows are plain `div`s** with no `role="button"` or `tabindex` (a gap across the whole `ep-entry-tap` pattern; Maren, Kael).
- **Cipher Edict V nits on #267:**
  - `_epLocalDateStr(invalid)` returns today. A corrupt timestamp would then display as today, and in `_deWetDiapersToday` / `_voWetToday` it adds a phantom diaper to today's count. Return `''` for invalid input when an argument was given.
  - After an end-time edit, `renderMedicalStats` and the post-illness recovery view (`medical.js` ~8517) stay stale until the next tab switch.
  - A `role="alert"` element may not re-announce identical text.
  - If a render throws after `save()` succeeds, the sheet says "Could not save". Saving again is harmless.
- **Entry sheets have no date field (Ceres V-C-267-4).** A time edit now lands on the nearest day to the original (±1). Moving an entry further than a day still means deleting it and re-logging.


#### P1 — Unsynced-write ledger follow-ups (PR #265, 2026-09-18)
- **Context:** PR #265 added the ledger after the September incident (six months of one phone's entries overwritten by a stale March cloud copy on reinstall). The Governor chain accepted the design with these follow-ups still open:
- **(a) Map-shaped keys union on full push, so a stale phone can re-introduce a day a parent deleted elsewhere** (Ceres F2). `KEYS.feeding` / `medChecks` / `activityMeta` are date-keyed maps pushed with `set(merge:true)`. Fix shape: ledger the touched sub-keys per save site and push only those subtrees via `_syncNestDottedPaths`. Kael-primary, Ceres consult.
- **(b) Array union has no delete signal** (Kael F5 note): entries deleted locally come back from the cloud on the replay after a full push. Acceptable for the recovery path; a tombstone list per key would close it.
- **(c) Join silently discards this phone's ledger** (Kael F9): consistent with "joiner never seeds", but the join modal copy should say "entries on this phone will be replaced by the household's". Maren/Vela copy. (The member sign-out → log → sign-in path no longer discards: `sl_sync_attached_once` survives sign-out and routes that device through the ledger push — Kael F18, folded.)
- **(f) Replayed skipped snapshots re-record `hasPendingWrites` from the cached metadata** (Kael F20): the pill can read "Syncing" until the next live snapshot for that doc. Cosmetic.
- **(g) Seed version literal `'4'` is hard-coded in six places and doubles as the attach signal** (Cipher ruling 2): the next bump silently routes every device through the seed/member branches — the admin re-seed replaces arrays without `_syncMergeForPush`, a member drops local. Hoist `SYNC_SEED_VERSION`, keep `sl_sync_attached_once` (folded in #265) as the attach signal, and route the admin re-seed through the merge. Kael.
- **(d) `renderFoods()` saves on render** (`diet.js:177`, Ceres F1.3): a render function writing storage; harmless since `syncWrite` now skips no-op re-saves, still a layer smell. Ceres.
- **(e) Stale comments**: `template.html:322-324` says Reload surfaces only in halted — the badge button is now Reload (halted) or Retry (stale). Comment-only; next template touch.
- **Fixed in the same PR, worth the record:** `_syncFindHousehold` referenced `user.uid` (undefined) in the seed/member branch — a ReferenceError that killed listener attach on every launch for any device whose seeded flag was missing (e.g. after sign-out). Sync went silently dead with the pill hidden. Candidate root cause of the March stop (Kael F3).

---

---

### CSS / Design System

#### P2 — Chip wrapping: multiple chip classes use `white-space:nowrap` with variable-length content
- **Symptom:** Chip text truncates or overflows on narrow screens when food names or milestone text is long.
- **Affected classes:** `.chip`, `.qa-chip`, `.outing-chip`, `.dqp-pill`, `.ql-freq-pill`
- **Fix:** Remove `white-space:nowrap`; add `flex-wrap:wrap` to containers (`.ql-meal-pills`, `.qa-chips`, `.al-slot-chips`).
- **File:** `split/styles.css`

#### P2 — Raw `px` padding debt (~259 raw-px padding declarations vs 237 tokenized)
- **Symptom:** Nearly half of all padding declarations bypass the `--sp-*` token system. Inconsistent spacing at different zoom tiers.
- **Notes:** Broad sweep; R-10 queue. Largest gap in token adoption across the design system.
- **File:** `split/styles.css`

(P2 — DRY refactor candidate: duplicate function at medical.js:2255 vs intelligence.js:11958 — RESOLVED bridge build 2026-05-13; see Fixed Bugs § Bridge Build.)

---

### Infrastructure / Build

#### P2 — `build.sh` must never be invoked with `2>&1`
- **Symptom:** `bash build.sh > sproutlab.html 2>&1` merges stderr into the HTML output. `bump-version.mjs` intentionally uses `console.error()` so its log stays off stdout; `2>&1` injects `[bump-version] X → Y` as line 1 of the document.
- **Status:** Triggered in Polish-11 session; fix landed (PR-41). Document here as a standing operational rule.
- **Rule:** Always build as `bash build.sh > sproutlab.html` (stderr separate). Never append `2>&1`.

#### P2 — Built `<head>` is authored in a bash heredoc outside every Governor jurisdiction
- **Symptom:** `split/build.sh` emits the `<head>` (meta, title, PWA tags, CDN scripts) from a heredoc. No Governor audits `build.sh` (Public Works) and it is not on the quad-Gov shared-file trigger, so head regressions go unreviewed — this is how the manifest link and PWA meta tags were missing for five months (PR #264).
- **Fix shape:** Move the head markup into `template.html` (shared module, quad-Gov review) and have `build.sh` splice it, or add `build.sh`'s head heredoc to the shared-file trigger. Regression guard already in place: `tests/e2e/pwa-head.spec.ts`.
- **Origin:** Cipher Edict V ruling 3 on PR #264 (2026-09-18).
- **File:** `split/build.sh` `cat <<'HEAD'` block

---

## Fixed Bugs (Polish Sub-phase, Phase 4)

### Ledger sweep (2026-10-28) — entries found fixed and moved here
| Entry | Fixed in |
|---|---|
| P0 Recent Evidence Feed flooding ("Social Smiling" × N) | PR-β (#47), rollup at `home.js` `renderRecentEvidence` (`ROLLUP_THRESHOLD`) |
| P1 `_renderAttribution` not wired into Recent Evidence | PR-α (#45) |
| P1 `renderMilestones()` monolith | PR-α (#45) |
| P2 HR-1 `getMoonPhaseEmoji` Unicode emoji | replaced by `getMoonPhaseIcon` (core.js), which returns `zi('moon-*')` |
| P1 MILESTONE_STANDARDS stop at 12 months | #268 (to 24 m) |
| P1 SLEEP_STANDARDS stop at 12 months; nap rules disagree | #269 (to 36 m, one nap source) |
| P1 VACC_SCHEDULE review against IAP 2023 | #269 (next-dose auto-scheduling stays open under the #269 progress block) |

### Bridge Build — Symptom Checker (2026-05-13) — PR-bridge

Per `docs/specs/lyra-spec-2026-05-11-symptom-checker-hr1-dry.md` v3 (Sovereign-ratified 2026-05-12). Maren B-M1..B-M3 + Kael B-K1..B-K4 audit returns folded.

| # | Description | File | Resolution |
|---|-------------|------|------------|
| HR-1 sweep | 6 in-screenshot emoji escapes (`\u{1F6A8}` Emergency, `⚠️` Monitor closely, `✅` Usually manageable, `\u{1F4DE}` doctor name, `☎️` call link x2) + 1 drift `\u{1F6A8}` literal in `intelligence.js:11965` (where `medical.js:2490` already used `zi('siren')`) → all ports to `zi('siren'/'warn'/'check'/'phone')`. Verified by §8.1 Gate 1 grep over SC render path: 0 emoji escapes. | `split/medical.js`, `split/intelligence.js`, `split/template.html` | PR-bridge |
| New sprite | `zi-phone` (telephone-receiver, stroke-1.5 / fill-0.1 family) added to `template.html` between `zi-pill` (line 21) and `zi-shield` (line 23). Sprite count 63 → 64. | `split/template.html` | PR-bridge |
| DRY consolidation (P2 retired) | Duplicate render block (~64 lines) between `medical.js:2474–2533` (checkSymptoms) and `intelligence.js:11951–12006` (runHomeSymptomCheck) extracted to shared helper `_renderSymptomCheckerResults(matches, ageMo, opts)`. Helper lives in `medical.js` (Sovereign Q1 → Option A; Kael B-K1 boundary contract: pure renderer, no `document.*` reads/writes, no event binding, no `innerHTML=`, no global mutation; cycle-free per concat order). `_sc*` canonicalization pattern established. Behavioral drift in episode-tracking CTA data-actions (`promptFeverTrack` vs `closeAndPromptFever` — close-then-prompt for home overlay) parameterized via `opts.actions` map. Disclaimer drift (medical.js carried "Trust your instincts — you know Ziva best"; intelligence.js omitted) resolved to canonical medical.js text. | `split/medical.js`, `split/intelligence.js` | PR-bridge |
| P1 Crying-badge — RESOLVED (Maren B-M1 H1 confirmed) | New rule `[data-theme="dark"] .sc-mild .sc-sev-badge { background:rgba(58,112,96,0.22); color:var(--tc-sage-light); border:1px solid rgba(58,112,96,0.35); }` per spec §0.1 #4. Closes the sage-on-sage contrast collapse in dark mode that made the mild-severity badge near-invisible on the `crying-fussy` result. New design token `--tc-sage-light` commissioned in both light (`#5a9080`) and dark (`#a0d8b8`) token blocks. Maren WCAG-AA verification commitment carried forward per spec §8.2 (real-device, both themes, ≥4.5:1). Light-mode parallel bump (spec §5 edit #9) DEFERRED — conditional on §8.2 light-mode verification result. | `split/styles.css` | PR-bridge |

### Polish-11 (2026-05-06) — PR-40 + PR-41

| # | Description | File | PR |
|---|-------------|------|----|
| Bug 1 | Sleep Score pill: `zi()` SVG output assigned via `.textContent` (HR-7 violation) — rendered as literal markup text | `split/home.js` | PR-40 |
| Bug 2 | Growth gauge: combined "70 cm" / "7.5 kg" string at `--fs-xl` overflows 78px inner ring diameter at large zoom | `split/medical.js` | PR-41 |
| Bug 3a | Growth gauge percentile pill: `--fs-xs` ≈ 9px sub-legible for Nunito digit rendering on mobile | `split/styles.css` | PR-41 |
| Bug 3b | Growth gauge `pctText` unescaped in `innerHTML` context — `calcPercentile` can return `"<3rd"` / `">97th"` (HR-4 violation) | `split/medical.js` | PR-41 |
| Infra | SW caching HTML (Canon 0034 violation) — stale-while-revalidate served corrupted `index.html` from cache, blocking fix propagation | `sw.js` | PR-42 |
| Infra | `syncReload()` used `location.reload()` — respects browser HTTP cache, served stale HTML after SW cache cleared | `split/sync.js` | PR-43 |

### Polish-10 (2026-05-03) — PR-34 through PR-39

| # | Description | File | PR |
|---|-------------|------|----|
| SVG-in-data | Illness episode `emoji` fields stored `zi()` SVG output; leaked into `title="..."` attributes, rendering as visible markup text | `split/medical.js` | PR-34 (Polish-10a) |
| Icon sibling | `sections.diet` used `emoji: 'bowl'` string literal instead of `iconKey`; all 7 `sections.*` objects swept to `iconKey` shape | `split/medical.js` | PR-38 (Polish-10d hotfix) |
| HR-3 batch (Care) | ~24 `onclick` handlers in home.js + medical.js replaced with `data-action` delegation | `split/home.js`, `split/medical.js` | PR-35 (Polish-10b) |
| HR-3 batch (Intel) | ~15 `onclick` handlers in intelligence.js + diet.js replaced with `data-action` delegation | `split/intelligence.js`, `split/diet.js` | PR-36 (Polish-10c) |

### Polish-1 through Polish-9 (2026-04-30 – 2026-05-02)

| # | Description | PR |
|---|-------------|----|
| CSS custom property pivot | Dynamic-required surfaces converted to `--dyn-pct` CSS custom property (HR-2) | PR-28 (Polish-6) |
| Essential mode rename | `ziva_simple_mode` → `ziva_essential_mode` with boot migration | PR-31 (Polish-9) |
| Direct token hex sweep | 32 hardcoded hex values in styles.css replaced with design tokens | PR-27 (Polish-3) |
| Design token additions | 9 new tonal tokens (`--rose-deep`, `--sage-deep`, etc.) | PR-28 (Polish-4) |
| Responsive breakpoint normalization | Canonical 4-value breakpoint system enforced | PR-29 (Polish-7) |
| Insights-tier gates | Defense-in-depth essential-mode gates on medical.js insight renderers | PR-25 (Polish-1) |

---

## R-10 Queue (Deferred Hygiene — Stability Sub-phase)

Items inventoried but not yet scheduled. 15-item queue as of bridge build 2026-05-13 (was 16; the medical.js:2255 / intelligence.js:11958 DRY duplicate retired in bridge build).

| Priority | Area | Description |
|----------|------|-------------|
| P2 | HR-2 | JS-side hex color constants (~15 sites — Kael Stability baseline) |
| P2 | CSS | Raw px padding debt (~259 declarations) |
| P2 | CSS | Chip wrapping + container `flex-wrap` fixes |
| P1 | Sync | medChecks / feedingData object-keyed migration |
| P1 | Render | `render-functions-must-be-pure` audit (candidate at 0/3; `renderMilestones()` split is next opportunity) |

---

## Operational Rules (Learned from Bugs)

| Rule | Origin |
|------|--------|
| Never `bash build.sh > sproutlab.html 2>&1` — stderr must stay separate | Polish-11 build error |
| `sw.js` must not cache HTML — navigate-mode requests bypass SW entirely (Canon 0034) | PR-42 |
| `syncReload()` must cache-bust via `location.replace(pathname + '?_cb=N')` — `location.reload()` serves from browser HTTP cache | PR-43 |
| `zi()` output must be assigned via `.innerHTML`, never `.textContent` (HR-7) | Polish-11a (Bug 1) |
| `calcPercentile` returns `"<3rd"` / `">97th"` — must `escHtml()` before any `innerHTML` use (HR-4) | Polish-11b (Bug 3b) |
| Care/Intel cross-surface DRY consolidation: helper hosts in Care domain (`medical.js`); Intel callers consume by named export (`_sc*` prefix). Pure renderer; behavioral drift parameterized via opts. | Bridge build 2026-05-13 (Kael B-K1) |
| **Spec-against-memory failure mode** — authoring a substrate-touching spec from the codebase as remembered (phantom identifiers, false sync claims, wrong field names, missing surfaces) is fatal; full canon-cc-008 chain catches it (closed PR #147: 9 BLOCKING + 19 NOTE root-caused to memory-authoring). **Correction:** deploy `scribe-scout` for codebase reconnaissance BEFORE spec body lands — verify (a) every cited identifier exists at the named file:line, (b) every storage shape claim is grep-verified live, (c) every sync claim is traced to actual `SYNC_KEYS` + `_postReceive*` registrations. When a single spec carries both engine-substrate concerns and surface-consumer concerns, use the **Option C two-spec sequence** (engine first, consumer second) — mirrors v3-3 → sleep-arc-3 pattern. | Closed PR #147 chain · Option C ratified at PR #148 + PR #149 |
| **Phantom-cardId discipline** — every `gotoCard(tab, cardId)` call site MUST be backed by an audit assertion that the target id exists in `template.html`. Function names (`renderInfoFooCorrelation()`) and card ids (`infoFooCard`) can diverge; the spec MUST cite the actual id, not the renderer name. Canonical pattern at `home.js:7093` carries the comment *"Card ids verified present in template.html"* for exactly this drift class. **Regression guard shape:** `correlation-cross-link-cardId-verified` asserts `document.getElementById(<cardId>) !== null` before the cross-link wires up. | V-V-63 on PR #149 (`infoMilestoneSleepCorrelationCard` phantom → actual `infoMilestoneSleepCard`) |
| **Engine-internal label boundary** — write-side enum vocabulary (`confidence: 'high' \| 'medium' \| 'low'`; `severityMessages.*.strength`) MUST stay in the data layer. Surface prose uses observation-counts + render-side state values (`evidenceStatus`: `confirmed` / `practicing` / `not-yet`; chip-state taxonomy). **Regression guard shape:** `strength-not-rendered` asserts grep finds no `'high-conf'` / `'medium-conf'` / `'low-conf'` / `'high-confidence'` / `'medium-confidence'` literal strings in any surface render function. Tap-behavior contract text uses render-safe synonyms ("record high-confidence observation"); the literal string never leaves the write path. | V-K-120 + V-K-121 on PR #149 · sibling pattern: sleep arc 3 §6 cosmetic-NOTE walk |
| **Cascade-preservation fold preference** — when a new registry-add conflicts with an existing design-system contract (e.g., `[data-domain]` CSS cascade at `styles.css:8628-8636` with 18+ consumer call-sites), **prefer the lower-risk fold (preserve existing contract)** over the higher-blast-radius migration UNLESS the migration is itself the scope-of-work. Surface the higher-tier semantic via auxiliary chrome (header icon, ribbon background) rather than overwriting the per-domain accent. | V-M-120 Lyra fold-call on PR #149 (registry mirrors existing cascade; milestone-overall semantic via `icon-lav` header + `--surface-lav` ribbon background) |
| **Worktree code-sign server returns 400 "missing source"** — `git commit` from `/home/user/sproutlab-*` (a worktree) intermittently fails signing with status 400. Same commit from `/home/user/sproutlab` (main checkout) succeeds. The signing helper inherits context that doesn't resolve in worktrees. **Workaround for NEW commits:** capture diff via `git diff HEAD > /tmp/<arc>.patch`, remove worktree, switch main checkout to target branch, apply patch, commit (signs cleanly), push. **Workaround for EXISTING unsigned commits:** from main checkout `git commit --amend --no-edit` re-signs cleanly, then `git push --force-with-lease`. | PR #142 re-signing (2026-05-27 AM) · Agent-A/B/C parallel triple-arc execution |
| **Architect fold-authority is explicit, not implicit** — Lyra may synth-fold findings inline only when the Architect explicitly grants fold-authority in advance ("don't wait for me to fold issues"). Silence is not a waiver. Architect-granted authority is scoped narrowly (e.g., "milestones-related findings only"); out-of-scope items escalate normally. Cipher Edict V verifies canon-cc-027 spec amendment authority was NOT exceeded — no canon entries silently amended; no registry contracts silently overwritten. | PR #149 — Architect directive 2026-05-27 "Lyra will take that call" |
