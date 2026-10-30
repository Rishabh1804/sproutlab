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
  - An attached device waits 8 s first, because the other phone may already have answered.
  - The sync hand-off re-asks while the household's copy still has no sex.
- **Sync.** Newest-ts-wins is unchanged, with one exception. The sex is never cleared: a newer copy without it came from a phone still on the older build, so the answer carries over (`_postReceiveProfile`, which also serves the push merge).
- **A sex change** arriving by sync reloads the app, like a birth-date change, because it redraws every chart and pronoun.

### 2.2 Growth tables
- `WHO_GROWTH = { f: {...}, m: {...} }` in data.js holds P3 / P15 / P50 / P85 / P97 for weight-for-age and length-for-age, 0–24 months.
  - Sources: `tab_wfa_{girls,boys}_p_0_5.xlsx` and `tab_lhfa_{girls,boys}_p_0_2.xlsx` (cdn.who.int, fetched 2026-10-30).
  - The girls' re-extraction matched the existing table value for value.
- `whoT()` (core.js) returns the set for `childSex()`. Every reader goes through it: `getInterpolatedWHO`, both charts and the axis limits. With the sex unknown it returns the girls' set as a stand-in, which only screens hidden under the gate ever read.
- **Velocity, 12–24 months:** WHO's boys' 2-month weight increments (P15 133→53 g, P50 437→376 g, P85 766→713 g) match the girls' to within about 30 g. One band, `GROWTH_VELOCITY_12_24`, fits both.

### 2.3 Copy and helpers
- `childKinWord()` returns girls / boys / children.
- `pron(kind, cap)` covers subj (she/he), obj (her/him), poss (her/his) and refl (herself/himself). With the sex unknown it falls back to they/them/their, but only the gate is visible in that state.
- **The S1 copy:**
  - the growth fact "heavier than N% of girls her age" follows the sex;
  - so does the size comparison "…-month-old girls";
  - the growth help tip is neutral.
- **Chips:** both use the same sage. The choice picks a chart, not a colour.

## 3. S2: pronoun pass (next)
- About 600 she/her sites: data.js 204, recipes.js 109, medical.js 107, diet.js 44, home.js 41, and the rest in the intelligence files.
- Each site goes through `pron()`, or is rewritten to need no pronoun when that reads better. Load-time tables (data.js, recipes.js) are built before the profile loads, so they need render-time substitution or neutral wording.
- **Owners:** Carina (data.js), Ceres (recipes, diet), Maren (home, medical), Kael and Vela (intelligence). This is a large sweep that changes no behaviour.
- **Gate for the PR:** an audit `audit-pronouns.sh` that blocks a bare she/her in render copy.

## 4. S3: sex-specific care content (needs Maren, with cited sources)
These are topics that differ by sex in the 0–24 month range. Each needs a citation (IAP / AAP / NHS), the half-awake test, and Maren's sign-off.
- **Boys:**
  - **Foreskin care.** Never pull back the foreskin of an uncircumcised boy; clean only the outside. It separates naturally, often not until 3–5 years or later.
  - **Undescended testes.** Both testes should be felt in the scrotum by 6 months. If not, see the doctor, because surgery is advised by 6–18 months.
  - **Inguinal hernia vs hydrocele.** A groin or scrotal swelling that is hard, painful or doesn't go back is an emergency (incarcerated hernia). A soft, painless swelling usually settles by 1 year.
  - **Testicular torsion.** Sudden scrotal pain or swelling is an emergency.
  - **Nappy changes.** Point the penis down.
- **Girls:**
  - **Wiping and washing.** Wipe front to back. Don't use bubble baths or perfumed products.
  - **Labial adhesion.** Common, harmless and usually needs no treatment. When to see the doctor.
  - **Newborn discharge** (pseudo-menses) in the first weeks. Not relevant at Ziva's age, but relevant for newborns in a wider release.
- **Both: UTI.** In a fever with no other source, a UTI is a common cause; risk differs by sex and age. Urine testing for fever without a source is a Kael (illness engine) and Maren question.
- **Where it lives:** a small Medical → Body care card, keyed on `childSex()` and age, plus the fever triage hint. Content is Maren's; the render is Vela's.

## 5. S4: infant velocity bands (found during S1)
- The 0–12 month weight bands (150–250 / 100–180 / 70–130 / 55–100 g/week) are copied into about nine sites, and they are narrower than WHO's P15–P85.
  - 9–12 m: WHO is about 21–91 g/week, so a normal infant reads "slow".
  - 0–2 m: the boys' P50 (≈255 g/week) sits above the 250 maximum.
- **Fix:** one WHO-derived, sex-keyed band source like `GROWTH_VELOCITY_12_24`. This doesn't affect a toddler; it matters for a wider release with infants.
- **Also:** the one-time "Growth now uses the WHO charts" note says percentiles "may read lower than before". That only makes sense for this family's migration, so it shouldn't show to a new household.

## 6. Not doing
- **Gender identity vs sex.** WHO growth standards are by sex. The question is worded "Girl or boy", with no third option, because growth needs one of the two charts. A family that doesn't want to answer can't get growth percentiles; that's a v2 question, if it is ever raised.
