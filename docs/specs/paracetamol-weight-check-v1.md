# Paracetamol weight check v1: weight-jump confirm, leftover-risk flow, 0–60 months

**Status:** spec, ratified (Architect, 2026-11-04). Not built. **BUGS:** #161 (the weight-jump check), #162 (WHO weight-for-age past 24 m). **Council:** five seats (Maren, Kael, Carina, Vela, Ceres), all ENDORSE-WITH-AMENDMENTS; Cipher Edict V amended twice, both folded. Full record: [`docs/COUNCIL_2026-11-04_161.md`](../COUNCIL_2026-11-04_161.md).

## 1. Problem
The fever card's paracetamol chip (#284) doses 10–15 mg/kg from the latest weight. Its only weight gate is WHO Anthro's implausible-value flag (weight-for-age z < −6 or > +5). At 14 months that band is about 3.3–16 kg, so a believable typo — 15.9 kg for Ziva's real ~9.5 kg — is dosed: about 1.7× her dose, every 4 hours. And the implausible gate itself stops at 24 months (`getInterpolatedWHO` clamps at the 24 m row), so from her second birthday every weight is read against a 2-year-old's chart.

## 2. Architect decisions (2026-11-04)
| | Decision |
|---|---|
| A | A confirmation is stored in its own synced map key, `KEYS.growthConfirm`, never on the growth row. |
| B | The parent confirms by **retyping the weight** into an empty box, in every variant. The fever card never edits a growth row. |
| C | The residual is accepted with no dose cap, on condition the app carries the **leftover-risk flow** (§5). |
| D | WHO publishes no file version: sha256 + download date is the record. |
| E | The weight-jump check runs to **60 months**. |
| E-7 / F9 | Option (i): the weight-for-age Δz method covers gaps up to **184 days** from a **12-month** start. |
| R | The leftover-risk rules R0, R0b, R1 (split), R2, R2b, R3 and the lo-bound rule (§5) are ratified as written. |

## 3. Sources (canon-cc-013)
| Source | Use | Record |
|---|---|---|
| WHO Child Growth Standards, weight velocity, `ttt-weight-{girls,boys}-{2,3}mon-p.xlsx` (cdn.who.int, fetched 2026-11-03/04) | P1 / P99 increments ≤ 24 m; L, M, S, Delta per row | sha256 below; committed |
| WHO weight velocity 4- and 6-month tables (`lms_weight_{girls,boys}_{4,6}mon_p.pdf`, fetched 2026-11-04) | Δz knots at 122 and 183 d | PDF only; one-time transcription check at build |
| WHO weight-for-age 0–5 y, `tab_wfa_{girls,boys}_p_0_5.xlsx` (the files `WHO_GROWTH` already cites; sha256 unchanged since 2026-10-30) | L, M, S by month, 0–60 m | committed |
| RCH Melbourne CPG "Paracetamol poisoning" (updated July 2023; adapted from Chiew et al., MJA 2020;212(4), online first 2019) | > 200 mg/kg or 10 g / 24 h; > 300 mg/kg or 12 g / 48 h; "Greater than a daily therapeutic dose per day for more than 48 hours in patients who also have abdominal pain, nausea or vomiting"; > 8 h delay raises liver risk | read in full |
| NHS "Paracetamol for children" (reviewed 2 Oct 2025) | max 4 doses / 24 h; 4 h apart; not > 3 days without a doctor or pharmacist; more than the packet → urgent advice (NHS 111); cold-and-flu medicines also contain paracetamol; liver signs: feeling sick, yellow skin or whites of the eyes | read in full |
| BNF "Poisoning, emergency treatment" / TOXBASE | 75 mg/kg in 24 h assessment line | search excerpts + Sheffield Children's and NHS GGC protocols; the BNF page is UK-only and was not read in full |

sha256: girls-2mon `8bb8ccd218175d205b7e72abd8248aef7741d4e602b0929af047e9e4901315ce`; girls-3mon `6da9768fa094c22203c7b4c9bd0f5678ea9321fbb84496b5ee917d954628fc3d`; boys-2mon `5c40eab824a2fc8b5c955871a22ea9ca004a098596a8ddcf9ab9ae0cf71f96e4`; boys-3mon `d750caa05ecaca558dace5a93b8990dd54d7a3f4901896578e17105cfbc8ab99`; wfa girls `cab683c68f937cec0fa8c80a601c4784d5f98230d787a20678d217db98f12f0e`; wfa boys `675e1516ffcdf6273b1cc1370fa34e533d3bd84dfd31fdba93ebc457d907032a`; girls-4mon pdf `c7a92726c14d6489c7e8c4eb836250e6c81ce97c8a6233c3e908ce841bc0da77`; girls-6mon pdf `aa1857113b9a097882cbd44718e3660a216265dac7e283fd179661a6d7df5b55`; boys-4mon pdf `80b6bb4e096ad70d1a91d5098729b8a2e5fadff7b01ffa72b385f3e8b24274f9`; boys-6mon pdf `a75d645240fe17ba8298ebc6d273ba6d30ec0fdb06f3f14c4dcec88a45d160da`.

**Judgment, labelled:** 60 mg/kg/day (15 × 4, the app's ceiling) read as RCH's "daily therapeutic dose"; the call-now tier at ≥ 75; R2's continuous-stretch reading of "more than 48 hours"; R2b's calendar-date count; the R0b 2× cut; the R2 liver-sign proxies for nausea in a toddler and their call-now mapping; R3's "children lose weight when ill"; carrying the 24 m Δz calibration to 60 m; diarrhoea and spit-up excluded as GI signs.

## 4. The weight-jump check
### 4.1 Registry (PR 1)
- One WHO weight-for-age L/M/S table, 0–60 months by month, per sex, from the committed `tab_wfa` files; one `whoWfaZ(wtKg, ageMo, sex)`. Linear interpolation of L, M, S. WHO restricted z beyond ±3 (step in SD2→SD3 units), log form when |L| < 1e-6. `sex` is explicit; never `whoT()` (it falls back to girls).
- The velocity table (P1 / P99 and L, M, S, Delta per row; 2- and 3-month, girls and boys) is its own registry, ≤ 24 m. Knot days named: 61 / 91 / 122 / 183. **Amended at build (#287, V-CA-287-7):** it lands in PR 2 with its first consumer, `gvWeightJumpCheck`.
- A dependency-free build audit re-extracts each committed xlsx (zlib + XML), recomputes P columns from L/M/S (velocity ±1 g; weight-for-age ±0.05 kg) and refuses to pass if a file is missing.
- `WHO_GROWTH`'s weight columns are **bound** to the weight-for-age registry by the build audit: every cell must equal the committed file's P column exactly (WHO's published 0.1 kg value). **Amended at build (#287, Maren V-M-287-1, Carina V-CA-287-1):** bound, not derived — deriving would move displayed percentiles at medical.js's 14 `whoT()` sites by up to 0.05 kg, a change for its own PR. Copy that reads `whoWfaZ` states no centile (V-M-287-2).
- `paraWeightPlausible` moves to `whoWfaZ` — this closes #162. **Interim (#287, Kael V-K-287-1, Maren V-M-287-3):** the exact flag sits 0.3–1.7 kg higher than the old approximate one at 3–24 months, so until the chip's confirm state ships (PR 4) a weigh-in at ≤ 24 months must also pass the old approximate ceiling (z ≤ +5 from (P97 − P50)/1.881); PR 1 never widens what is dosed at ≤ 24 months (past 24 months the exact flag admits more by design — the #162 fix, decision E — the pre-#161 typo exposure PR 4 closes). Removed in PR 4; the build warns from 2027-08-01 while it exists.
- New chip outcomes (#287): a weigh-in dated before the birth date → `baddate` ("dated before {poss} birth date"); a weigh-in past day 1826 → `outofrange`, calm copy: "The weight check here covers children up to age 5, so it can't work out a dose from {poss} weight. Ask your doctor or chemist for the dose." (Kael V-K-287-2, Maren V-M-287-4, Vela V-V-287-1/-2).
- **One age clock:** days / 30.4375 from `gvDaysBetween(dob, date)`; one boundary, 60.0 m = day 1826. An interpolation fraction > 1 fails closed.
- Placement: data.js beside `WHO_GROWTH` or core.js beside `GROWTH_VELOCITY_BANDS` — Carina's call.

### 4.2 The check (`gvWeightJumpCheck`, PR 2)
- **Pairs:** the `gvWeightWindow` pair, and the latest vs the immediately previous row when it differs. `confirm` if either is out of band. The anchor is the row `getLatestWeight()` returns, compared by date + wt.
- **One total method predicate** over (start age, end age, gap), tested as a table:
  - end ≤ 24.0 m and gap ≤ 92 d → **velocity**: increment within [min(P1, 0), P99] of the row starting at floor(start age), clamped; gap ≤ 61 d uses the 2-month table, 62–92 the 3-month. Stated in the code: this deliberately differs from `gvBandAge` (the band containing the pair, not the centre of a rate).
  - start ≥ 12.0 m, both ages ≤ 60.0 m, gap ≤ 184 d → **Δz**: z(latest at its age) − z(previous at its age) within [−kDown(gap), +kUp(gap)]; knots per sex at 61 / 91 / 122 / 183 d (girls +0.53/−0.54, +0.62/−0.60, +0.71/−0.66, +0.84/−0.81; boys +0.52/−0.54, +0.59/−0.59, +0.67/−0.64, +0.76/−0.77), linear in days between knots, ≤ 61 holds the 61 knot, 183 held to 184. The loss side never confirms a weight ≥ the previous weight.
  - anything else → **nocompare** → `confirm`.
- **Fail closed (PC-5):** written as `!(x >= lo && x <= hi)` → `confirm`. Missing row, unknown sex, non-finite gap, weight ≤ 0, age past 60.0 m, an implausible row in the pair, two different weights on one date (`samedate`), any exception → `confirm`. The loss guard never short-circuits the up test.
- Output: `{ verdict: ok|confirm, variant: jump-up|jump-down|nocompare|samedate|implausible|outofrange|error, method, pairs[], anchor }`. When several pairs fail, the variant shown is ranked: samedate → outofrange → implausible → jump-up → jump-down → nocompare (the record first, then a jump, then "couldn't compare"). **Built in #161 PR 2:** `WHO_WT_VELOCITY` (2-/3-month rows, copied by script), `WHO_WT_VELOCITY_LONG` (the 4-/6-month rows ending at 24 m, transcribed from WHO's PDFs and checked against their own L/M/S) and `WHO_WT_DZ_KNOTS` (recomputed by `split/audit-who-velocity-v1.mjs` each build); not wired to the chip until PR 4.
- Advisory build warning from 2030-06-01 while no source past 60 m is registered.

### 4.3 Confirm persistence (`KEYS.growthConfirm`)
- `{ 'YYYY-MM-DD': <wt number> }`; confirmed only while `typeof c === 'number' && c === row.wt`. A confirm never writes the growth array (Carina: the array is replaced whole and the recovery push merges same-date rows local-wins, so a confirm on the row could resurrect a fixed typo already confirmed).
- Own merge in `_syncMergeForPush` and a `mergeOnReceive`: same value both sides → keep; different values for a date → drop the entry (the chip asks again). Model on `activityMeta`. Not persist-defaults. Armed atomically: `KEYS`, `SYNC_KEYS`, `SYNC_RENDER_DEPS` (fever card + load-alert renderer), assign/read cases, export/reset via `KEYS`.
- The handler binds to the **displayed** date + weight (`data-arg`, `data-arg2`); finds the row by date + wt equality; writes nothing if no row matches. Accepted residual: a phone whose growth is dirty for another reason can bring its own confirmed typo row back (two coinciding events).

### 4.4 The chip `confirm` state (PR 4/5)
- A new state with **no dose object**, after `implausible` / `nodose`, before `pick`; carries `form`. Explicit render branches for `confirm` and `noweight`; the bare `else` becomes a fail-closed unknown-state line (no dose + "ask your doctor or chemist"); one list of chip states with a test that each has a branch. `feLogDosePrompt` pre-fills only on `ok` (unchanged).
- **Surface (Vela, Maren):** the confirm block leads the paracetamol section. The two weights side by side with dates and the change ("15.9 kg · 3 Nov / 9.5 kg · 12 Sep — 6.4 kg more in 7 weeks"), then the sentence. Filled primary: "Change the weight". Retype box starts empty; parseFloat compared at 0.01 kg; comma decimal accepted; non-finite rejected; on mismatch "You typed 9.5 kg; Growth has 15.9 kg." and a route to Growth (delete-and-re-add until Growth gains an edit path). The countdown's "can be given now" ends "…once the weight below is checked". Tiers: jump/loss amber, no-comparison calm, red only for hard stops. Escape line inside the block, full contrast: "If {subj} needs medicine now, ask your doctor or chemist for the dose." After a confirmed loss: "A real drop in weight while {subj} is unwell is worth telling your doctor." then "Keep offering breast milk and fluids often." No confirm control on Home. House `.btn`, 44 px, stack at large zoom, U+00A0 inserted before escHtml (a literal `&nbsp;` double-escapes), data-action via the core.js dispatcher, HR-12 dates.
- `_emDocVitals` (diet.js; also read by intelligence-cards.js:1921 / :2054 and `_emDocWho`) prints the weigh-in date always and "not yet checked" when the check trips. The doctor-visit export (medical.js:742) does the same or is logged DEFERRABLE under Maren.
- `renderFeverEpisodeCard` joins `SYNC_RENDER_DEPS[KEYS.growth]`.

## 5. The leftover-risk flow (decision C; PR 4)
### 5.1 Reference weight
- **D** = the 24 h total ÷ the dosing weight. **R** = the 24 h total ÷ **W_ref** (R ≥ D).
- W_ref = the latest weight if confirmed by retyping or with no earlier weigh-in within 184 d; otherwise min(latest, every earlier in-window weigh-in **projected along its own weight-for-age z** to the latest date). No sex → min(latest, previous). Non-finite → min(latest, previous) → else load unknown.

### 5.2 Dose amounts
- One shared parser: comma decimal, ml / mg, ranges. Each dose → [lo, hi] mg: mg exact; ml + bottle exact; ml with no bottle ×24..×100; unreadable → [0, ∞]. Paracetamol only (word list incl. combination products; a renamed ibuprofen excluded).
- Total: over if lo-sum crosses; under only if hi-sum doesn't; else unknown. **Escalate on lo only;** a hi-only crossing → verdict `check` + "Which bottle…?" (V-M-C161F-6). Unknown never clears.
- Reads `load(KEYS.feverEpisodes)` fresh; an active paracetamol-named med in `KEYS.meds` → load unknown, reason named.

### 5.3 The rules (ratified)
Tiers: calm / amber / red ("Call your doctor today", the NHS 111 urgent-advice equivalent — judgment) / call now.
- **R0 dose beyond the packet:** logged < 4 h after the previous dose, or the 5th+ in the rolling 24 h → **red**; never call-now on its own; the higher of R0b / R1 wins and folds R0's line in; runs with no weight; never blocks logging. Copy (a): "This dose was {h} h {m} min after the last one. Doses close together happen, especially at night. NHS advice is to check with a doctor whenever a dose goes beyond what the packet says. Call your doctor today and tell them: {n} doses, {mg} mg in the last 24 hours, the last at {time}. Give no more paracetamol until {nextTime}." Copy (b): "That's {n} doses in 24 hours. The packet allows 4. …" {nextTime} = the later of 4 h after the last dose and the oldest of 4 leaving the window.
- **R0b one dose bigger than one dose:** lo > the chip's top dose for W_ref + one 0.1 ml step → red; lo ≥ 2× the chip top → call now (2× = judgment). "That dose is bigger than one dose for {wt} kg: {mg} mg, where the most for one dose is {top} mg. Call your doctor {today|now} and tell them the amount and the bottle. Give no more paracetamol until they say."
- **R1 rolling 24 h:** R ≤ 60 calm ("Last 24 h: {n} doses, {mg} mg."); 60 < D < 75 amber ("That's more than the usual most for a day for {wt} kg. Give no more paracetamol until {time}."); **D ≤ 60 < R → amber weight question**, verdict `check` ("These doses fit {pos} newest weight, {wt} kg. But {wt} kg is more than {pos} weigh-in on {date} ({prev} kg) would suggest. If {wt} kg is too high, the last 24 hours are over the usual most for a day. Check the weight before the next dose: weigh {obj} again, or check the number." chips "{wt} kg is right" → retype confirm, "Fix the weight / Add a weight"); D ≥ 75 → call now; R ≥ 75 > D → red + the weight question.
- **R2 more than 48 hours (RCH):** Kael's sweep over the 72 h alert window — the longest stretch with the rolling-24 h total on W_ref above 60: met > 48 h / maybe (only on hi) / no. Met only on R → the weight question first. With a GI sign in 48 h (vomit / projectile / bile, or new "Tummy pain" / "Seems sick" chips on `ep.actions`) → call now: "… Call your doctor now. {Pron} may need a blood test. Tell them: {n} doses, {mg} mg in the last 48 hours." Without → amber + "Has {pron} been sick or had tummy pain?" chips + "Call your doctor now if {pron} seems to feel sick (gagging, retching, or refusing food and drink), or if {pos} skin or the whites of {pos} eyes look yellow. Yellow skin is harder to see on brown skin, so check the whites of the eyes." An empty symptom log is never "no". Maybe → amber "We couldn't read every dose amount…".
- **R2b more than 3 days (NHS):** a dose on each of 4 consecutive local dates → amber: "This is the {4th} day of paracetamol. NHS advice is to speak to a doctor or pharmacist before giving it for more than 3 days."
- **R3 weigh again:** fever > 48 h or active vomiting / diarrhoea, a dose in 24 h, latest weigh-in predates the illness → amber: "If you can, weigh {obj} again before the next dose." + "Add a weight".
- Extra line: "Check other medicines' labels. Some cold syrups also contain paracetamol."
- Fold, don't duplicate: the escalation at intelligence-illness.js:570 gains "Tell them about the paracetamol: {n} doses, {mg} mg in the last 24 h"; :516 unchanged for < 48 h.

### 5.4 Engine
- `getParacetamolLoad()` (pure `_paraLoadFrom`) + `getParacetamolNextDose()` → verdict `available | wait | check | hold` + reasons. The card line, the Home alert and the "dose available" notification read only the verdict; "safe to give" only when available and the load is under. Logging is never blocked.
- `computeParacetamolLoadAlerts()` keyed on the latest dose time; runs while any dose is < 72 h old whatever the episode status; R2 also renders in the vomiting / diarrhoea cards. Dismissal keyed on (dose time, tier).
- Thresholds in one cited `PARA_LOAD_THRESHOLDS` table (dailyMax 60, assess 75, ANZ 200 / 300, multiDayHours 48, windowHours 72); its comment records the accepted residual.
- Render deps: vomitingEpisodes, diarrhoeaEpisodes, growth, growthConfirm, meds, medChecks; and when a dose ages out of the window.
- **Prerequisite (PR 3):** the illness-episode sync stale-array / lost-write P1 is fixed for feverEpisodes, vomitingEpisodes and diarrhoeaEpisodes before or with this flow.

## 6. Accepted residual
Worst true load that passes the check (four top doses, a typo at the band edge, real weight = previous, z0 −2..+2): ≤ 24 m velocity arm ≤ 72.8 (girls) / 72.0 (boys) mg/kg/day; Δz from 12 m up to 184 d ≤ 77.1 / 74.4; from 24 m ≤ 75.1 / 72.5. Below 75 is not guaranteed past ~157 d for girls. These cases read D = 60, R ≈ 65–67 → the R1 weight question: the next dose is held until the weight is checked. The case that survives is the same wrong number retyped at the confirm. References: BNF/TOXBASE 75 mg/kg/24 h; RCH > 200 mg/kg/24 h; RCH's > 48 h-with-GI criterion is met at > 60, which R2 catches.

## 7. Build order (separate PRs)
1. Registry: weight-for-age L/M/S, committed sources, sha256, build audit, `whoWfaZ` with restricted z; `paraWeightPlausible` on it (#162) with the interim ceiling; `WHO_GROWTH` weight columns bound by audit; `outofrange` / before-birth chip outcomes. Summon: Carina primary, Maren (consumer), Kael. (#287)
2. Velocity registry + `gvWeightJumpCheck` (velocity + Δz, the method predicate, fail-closed); converge `ageMonthsAt` and the WHO clock or name the gap first (V-CA-287-6). Summon: Carina, Kael, Maren.
3. Illness-episode sync lost-write fix. Summon: Carina, Kael.
4. `KEYS.growthConfirm`; the chip `confirm` state and retype UI; remove the interim ceiling (`_paraInterimCeilingOk`, §4.1); the leftover-risk flow; `_emDocVitals`; render deps. Summon: all five Governors + core trio for styles.css; name Maren by hand on `PARA_LOAD_THRESHOLDS` (qa-route won't route it).
5. Next: the entry-time check in `addGrowthEntry` on the same helper (closes Maren D4).
Each PR: canon-cc-008 chain, then Cipher.

## 8. Self-tests
- E (9, Kael): a 23–25 m continuity sweep along median / P3 / P97 paths at 2-, 3-, 6-month gaps (no `nocompare` from the method switch; a one-digit typo always confirms); P97 at 36 and 60 m plausible (#162 regression); restricted z vs WHO Anthro outputs; 60.1 m / empty table / unknown sex / non-finite gap / non-number weight → confirm; the mixed pair (A-5); `samedate`; an implausible previous row; gap > 184; today = 2027-09-05 and 2030-09-05.
- C (18, Kael): see the council record; plus the R1 split, the lo-bound rule and dismissal-by-tier.

## 9. DEFERRABLE
Doses can't be logged outside a fever episode (surface says "doses logged in the app"); counting `medChecks` doses; the "3+ in 12 h" escalation counts the current episode only; `getActiveIllnessPosture` reads fields that don't exist; a renamed ibuprofen in the 4-in-24 count; dose timestamp = logging time; totals on `_emDocVitals` and the export; no-re-dose-after-vomit copy; conditional z (Cole 1995); a Δz fallback under 24 m for > 92-day pairs starting ≥ 6 m; a drift audit of `WHO_GROWTH`; 30.44 vs 30.4375 in `ageMonthsAt`; a "(checked)" marker on the ok line and the Growth row; a cited "feeding when unwell" Library card; the Growth-vs-meals reader skipping unconfirmed tripped rows until PR 5.
