# Child sex v1: growth standard, pronouns and sex-specific care

**Status:** S1 built (Lyra, 2026-10-30). **Architect decision (2026-10-30):** the app asks the child's sex. It picks the WHO growth standard and may bring in other information and how-tos. This closes the release blocker in privacy-v1 §8 (V-M-280-3).

## 1. Problem
- **Growth.** WHO publishes separate growth standards for girls and boys. The app only had the girls' tables. A boy at the boys' median weight (9.6 kg at 12 months) read as about the 70th percentile on the girls' chart. A boy at the girls' 3rd percentile is close to the boys' 1st.
- **Copy.** Copy says she/her in about 600 places.
- **Care.** There are a few care topics that differ by sex. The app has none of them yet.

## 2. S1: the question and the growth standard (this PR)
### 2.1 Profile
- `child.sex` is `'f' | 'm' | null`. `_profNormalize` turns anything else into null.
- **Setup, Confirm and Edit** ask **Girl or boy** as two radio chips. The answer is required, with this note: "Growth is compared with the WHO chart for girls or for boys." The read-back key includes it.
- **A profile saved before the question** (the #280 build) gets a one-question gate, **One more detail**. It has no Cancel, and Cancel from Settings → Your child's details brings the question straight back.
  - It shows at boot on every phone, with no attached-device wait, so growth is never visible on a stand-in chart (V-M-281-6). If the other phone answers first, its profile arrives by sync and closes the question.
  - The sync hand-off re-asks while the household's copy still has no sex.
- **Two-tap read-back.**
  - Setup, Confirm and Edit echo the chart: "…with growth read on the WHO chart for girls."
  - The one-question gate also says it back once before saving, and the toast after the reload names the chart.
  - A mis-tap at 2 AM moves every percentile, so it must be visible (V-M-281-2, V-V-281-3).
- **Sync.** Newest-ts-wins is unchanged, with one exception. The sex is never cleared: a newer copy without it came from a phone still on the older build, so the answer carries over (`_postReceiveProfile`, which also serves the push merge).
- **A sex change** arriving by sync reloads the app, like a birth-date change, because it redraws every chart and pronoun. The toast names the new chart (V-M-281-4).

### 2.2 Growth tables
- `WHO_GROWTH = { f: {...}, m: {...} }` in data.js holds P3 / P15 / P50 / P85 / P97 for weight-for-age and length-for-age, 0–24 months.
  - Sources: `tab_wfa_{girls,boys}_p_0_5.xlsx` and `tab_lhfa_{girls,boys}_p_0_2.xlsx` (cdn.who.int, fetched 2026-10-30).
  - The girls' re-extraction matched the existing table value for value.
- `whoT()` (core.js) returns the set for `childSex()`. Every reader goes through it: `getInterpolatedWHO`, both charts and the axis limits. With the sex unknown it returns the girls' set as a stand-in. The gate is up from boot on every phone and the app behind it is inert, so nothing visible reads it.
- **Naming the chart:** the percentile badges ("WHO girls"), the chart key ("WHO 50th (girls)") and the visit summary for the doctor (the sex on the BABY line, plus "percentile, WHO girls") all name it (V-M-281-1, -5, V-V-281-9).
- **Velocity, 12–24 months:** one band, `GROWTH_VELOCITY_12_24`, fits both sexes.
  - Weight: WHO's boys' 2-month increments (P15 133→53 g, P50 437→376 g, P85 766→713 g) match the girls' to within about 30 g.
  - Length: the boys' increments (2-month P5 1.0→0.4 cm, P50 2.3→1.7 cm, P85 3.1→2.6 cm) match the girls' to within about 0.05 cm a month.
  - Both are cited in core.js (V-M-281-7).

### 2.3 Copy and helpers
- `childKinWord()` returns girls / boys / children.
- `pron(kind, cap)` covers subj (she/he), obj (her/him), poss (her/his) and refl (herself/himself). With the sex unknown it falls back to they/them/their, but only the gate is visible in that state.
- **The S1 copy:** every growth card that names the chart also uses the right pronoun (V-V-281-1, -2):
  - the growth fact "heavier than N% of girls her age" follows the sex, as do the "triple her birth weight" fact and the size comparison;
  - the gain line is neutral;
  - the growth help tip is neutral too: "children of the same age and sex".
- **The one-time note retired:** "Growth now uses the WHO charts" is gone (V-M-281-3). It meant something only to this family, a month ago.
- **Chips:** both use the same sage. The choice picks a chart, not a colour.

## 3. S2: pronoun pass (next)
- About 600 she/her sites: data.js 204, recipes.js 109, medical.js 107, diet.js 44, home.js 41, and the rest in the intelligence files.
- Each site goes through `pron()`, or is rewritten to need no pronoun when that reads better. Load-time tables (data.js, recipes.js) are built before the profile loads, so they need render-time substitution or neutral wording.
- **Owners:** Carina (data.js), Ceres (recipes, diet), Maren (home, medical), Kael and Vela (intelligence). This is a large sweep that changes no behaviour.
- **Gate for the PR:** an audit `audit-pronouns.sh` that blocks a bare she/her in render copy.
- **Rules from the S1 audit:**
  - **"her" has two meanings for a boy:** "his" (possessive) and "him" (object). A regex can't tell them apart, so no regex substitution goes on load-time text. Recipes.js and data.js get neutral wording ("No salt in the child's portion"), which stays static and auditable. Render-time sites pick `pron('poss')` or `pron('obj')` by hand. Ceres signs off every change to safety-gate wording, line by line (V-C-281-2).
  - **Don't touch the citation key `her`** (AAP/HER, recipes.js:59, :566). Rename it to `aapher` at both sites in one change, and exclude keys, `source:` arrays and comments from the audit (V-C-281-1).
  - **The Q&A match vocabulary is not render copy.** That means the intent triggers, the classifier regexes, `excludeWords`, `qaWords` and the lookback strippers. These stay canonical she/her and go on the audit's allowlist. Running them through `pron()` at load time would read "they" and switch the intents off (V-K-281-2).
  - **Q&A input:** `_qaNameAsShe` also folds he/him/his/himself to the canonical subject when `childSex()==='m'`. Add he/him/his and they/them/their to `excludeWords` / `qaWords` (V-K-281-1, V-C-281-3).
  - **Q&A titles and chips** ("Can she eat …?", "How's her sleep?") go through `pron()` at render time (V-K-281-3).
  - **Vela's order:** quicklog's nap verdict ("at her age" → "at this age"), home.js, Smart Q&A text, illness, then the load-time tables.

## 4. S3: sex-specific care content (needs Maren, with cited sources)
These are topics that differ by sex in the 0–24 month range. Each needs a citation (IAP / AAP / NHS), the half-awake test, and Maren's sign-off.
- **Boys:**
  - **Foreskin care.** Never pull back the foreskin of an uncircumcised boy; clean only the outside. It separates naturally, often not until 3–5 years or later. Ballooning when passing urine is normal. Redness, swelling or straining means see the doctor. Add care after circumcision too, since many boys in India are circumcised after the newborn period.
  - **Undescended testes.** Both testes should be felt in the scrotum by 6 months. If not, see the doctor, because surgery is advised by 6–18 months.
  - **Hydrocele.** A soft, painless scrotal swelling that stays the same size usually settles by 1–2 years.
  - **Testicular torsion.** Sudden scrotal pain or swelling is an emergency: time-critical, about 6 hours, and possible in infants and with an undescended testis.
  - **Nappy changes.** Point the penis down.
- **Girls:**
  - **Wiping and washing.** Wipe front to back. Don't use bubble baths or perfumed products.
  - **Labial adhesion.** Common, harmless and usually needs no treatment. Never try to separate it at home. See the doctor if passing urine is hard or there are UTIs.
  - **Newborn discharge** (pseudo-menses) in the first weeks. Not relevant at Ziva's age, but relevant for newborns in a wider release.
- **Both:**
  - **Inguinal hernia** (girls get them too, and an ovary can be caught in one), corrected per V-M-281 §S3:
    1. A lump in the groin that comes and goes, bigger with crying: see the doctor soon for a surgical review. Don't wait.
    2. Hard, painful, won't go back, or with vomiting: emergency (incarcerated).
  - **Newborn breast swelling,** in both sexes.
  - **UTI.** In a fever with no other source, a UTI is a common cause. Risk is higher for uncircumcised boys under 12 months and for girls. Anchor to AAP 2011 (febrile 2–24 m) and the Indian Society of Pediatric Nephrology UTI guideline. Kael and Maren co-own the fever-triage hint.
- **Emergency routing.** Torsion and an incarcerated hernia also go into `GENERAL_EMERGENCIES` (Carina) and the emergency-room cards (Vela), not only a Body-care card.
- **Sources** (each needed before Maren signs off): undescended testes, AUA 2014 (refer by 6 months corrected age, surgery by 18 months); IAP / AAP / NHS for the rest.
- **Where it lives:** a small Medical → Body care card, keyed on `childSex()` and age, plus the fever triage hint. Content is Maren's; the render is Vela's.

## 5. S4: infant velocity bands (found during S1)
- The 0–12 month weight bands (150–250 / 100–180 / 70–130 / 55–100 g/week) are copied into about nine sites, and they are narrower than WHO's P15–P85.
  - 9–12 m: WHO is about 21–91 g/week, so a normal infant reads "slow".
  - 0–2 m: the boys' P50 (≈255 g/week) sits above the 250 maximum.
- **Fix:** one WHO-derived, sex-keyed band source like `GROWTH_VELOCITY_12_24`. This doesn't affect a toddler.
- **This is a wider-release blocker for any household with a child under 12 months** (V-M-281-8): S1 opened the gate to other families, so wrong infant verdicts would sit behind it. Maren audits the consolidation; six of the sites are in home.js.
- **Also:** the 12–24 month length band's lower edge (0.6 cm a month) sits near WHO's P10–P15 late in the second year (girls' 2-month P15 at 22–24 m is 0.45 cm a month), so it can call a normal toddler "slower than typical". Review it with the infant bands.

## 6. Not doing
- **Gender identity vs sex.** WHO growth standards are by sex. The question is worded "Girl or boy", with no third option, because growth needs one of the two charts. A family that doesn't want to answer can't get growth percentiles; that's a v2 question, if it is ever raised.
