# Privacy v1 — no child's data in the public build

**Status:** draft v0.1 (Lyra, 2026-10-30). **Architect decisions (2026-10-30):** full privacy including git history (option c); the lore moves to a private home; build for wider release (any child, any family); per-person layouts later; privacy first.

## 1. Problem
The public site serves Ziva's record to anyone, without sign-in. The app boots from built-in constants and syncs only when signed in.
- **Data built into the bundle:**
  - date and exact time of birth, and the solids start date;
  - the paediatrician's name, mobile number, map link and area;
  - growth, feeding, vaccine and medicine history;
  - home city: emergency contacts and the weather location.
- **The name:** "Ziva" appears on about 270 source lines.
- **The repo and its history:** CLAUDE.md holds full name, birth details, venue, milestones, care practices and the doctor's advice; there are also `meridian/` (the birth sky and the birthday invite and video) and about 94 docs.

## 2. Rule (new HR-13, mirrors sep-invoicing HR-10)
No child's or family's data in this repository or its build. Real records come only from the signed-in household (Firestore) or the device's own storage. Tests and docs use an invented child (**"Asha"**, born on a fixed test date) and say "the child" in copy notes.

## 3. Design
### 3.1 Profile record
- **Storage:** a synced single doc per household, `/households/{h}/singles/profile`, stored under the local key `KEYS.profile`.
- **Shape:** `{ v:1, child:{ name, dob:'YYYY-MM-DDTHH:mm', solidsStart:'YYYY-MM-DD'|null, sex?:'f'|'m'|null }, place:{ city, tz, lat?, lon? }, ts }`.
- **Getters:** `getDOB()`, `getSolidsStart()`, `childName()`, `childPlace()` replace the `DOB` / `SOLIDS_START` constants and every literal "Ziva" in copy. The ~270 sites go through `childName()`, with pronouns kept neutral where the copy allows.
- **One child per household for v1.** Each family is its own household, which is what the sync model already does. Several children in one household is v2: it means `children/{id}` subcollections and a per-child key prefix, which is a large refactor and is out of scope.

### 3.2 Empty bundle
- `DEFAULT_DOCTORS`, `DEFAULT_GROWTH`, `DEFAULT_FEEDING`, `DEFAULT_MEDS`, `DEFAULT_VACC` (the record part, not the schedule), `DEFAULT_MILESTONES` and `DEFAULT_FOODS` become `[]` / `{}`; all of them held the child's dated records (V-CA-280-18).
- The vaccine **schedule** (IAP), food database, milestones and recipes stay. They are reference data, not records.
- `EMERGENCY_CONTACTS` keeps its regional hospital lists as public reference data. `currentRegion()` shows one only when the family's own town matches it; every family sees the national numbers (108 / 112) (V-CA-280-18).

### 3.3 Gate
At boot, branch on what the app finds:
- **No profile and no records:** show the **Welcome** screen. It offers *Sign in* (join an existing household) or *Start fresh*, which runs a 3-step setup: child's name and birth date, solids start (optional), city. Nothing else renders until a profile exists.
- **Records but no profile:** an existing device from before this change. Ask once with **"Confirm her details"**, prefilled from nothing, because the code no longer knows them. Save the profile and sync it.
- **Signed out, but the profile and records are on the device:** works as today, offline-first. Privacy is about the public build, not about locking out the family's own phone.

### 3.4 Lore, docs and history
- Move the CLAUDE.md "Ziva Context" and naming lore, `meridian/`, the health-detail docs and the handoffs to a **private** repo (Codex, or a new `sproutlab-private`).
- CLAUDE.md keeps the persona and process; the Lyra lore becomes a pointer to the private copy.
- **History purge:** `git filter-repo` removes the paths above and the literal constants (the phone number, the DOB line) from every commit. Then force-push all branches and tags.
  - This rewrites history: open PRs and every clone must be re-cloned.
  - **Needs the Architect's explicit go at execution time.**

### 3.5 Hosting
- Make the GitHub repo **private**.
- GitHub Pages stops on the free plan, so serve production from **Vercel**. It already builds previews of this repo, its Hobby plan deploys private personal repos, and `index.html` is static.
- Point the live URL to the Vercel domain, or a custom domain.
- Keep the Firebase authorised domains in step with the new host.
- Later, a native Android build (Capacitor) can bundle the files on the device. That removes the need for a public host for the app itself; Firebase still syncs. See §6.

### 3.6 Firebase
- The API key is public by design. What protects the data is the **Firestore rules**: `households/{h}/**` readable and writable only by members.
- Audit the deployed rules and add them to the repo as `firestore.rules`.

## 4. Phases (each one PR, through the canon-cc-008 chain)
- **P1 Profile + getters (Carina).** `KEYS.profile`, sync registration, `getDOB()` and the other getters, and the call sites moved off the constants. The behaviour stays identical: until P2, the profile defaults to the current values.
- **P2 Empty bundle + gate.** Delete the seeds, add Welcome, setup and Confirm details, and template the "Ziva" copy with `childName()`. The tests move to the invented child.
  - **Touches:** Carina (foundation), Maren (Home and Medical copy), Ceres (Diet copy), Vela (render), Kael (Q&A copy).
- **P3 Repo hygiene.** Move the lore, docs and `meridian/` to the private repo, add HR-13 to CLAUDE.md, and add an audit gate (`audit-no-child-data.sh`) that blocks known personal tokens and patterns: phone numbers, the DOB literal, the old name list.
- **P4 Host switch and history purge.** Done with the Architect: repo to private, Vercel production, filter-repo plus force-push.
- **P5 (release track).** Per-person layouts and widgets, then several children, then a native APK.

## 5. Risks
- The family's existing phones need one prompt to confirm her details. Their records are untouched, because they live in localStorage and Firestore, not in the seeds.
- Copy that reads warmly with a name ("Ziva's day") must still read warmly with any name. The half-awake test applies to all copy.
- A history rewrite cannot un-publish anything already cloned or cached elsewhere. It shrinks the exposure; it doesn't erase it.

## 6. Decisions (Architect, 2026-10-30)
1. **Private home for the lore:** the private repo **MyFin**. CLAUDE.md lore, `meridian/`, the health-detail docs and the handoffs move there in P3.
2. **Domain:** production on Vercel, under the household's one domain **somaelectro.co.in**. The proposal is a subdomain, e.g. `sproutlab.somaelectro.co.in`: a CNAME at the DNS host pointing to Vercel, plus that domain in Firebase's authorised domains.
3. **Native app:** **Capacitor** (P5). It bundles the files on the device and works offline, with Firebase sync.

## 7. As built (P1 + P2, PR #280)
- **P1.** The profile record: `KEYS.profile` at `singles/profile`, newest-ts merge on receive and push, and getters. `DOB`, `SOLIDS_START` and `_ZIVA_DOB` are now refreshed lets.
- **P2a, the gate.**
  - Welcome / set up / Confirm details, plus Settings → Your child's details.
  - A record counts only when non-empty. An attached device waits 8 s for the household's profile before it asks.
  - Setup reads the age back once, and refuses a birth date later than the child's own records. A save, or a synced birth-date change, reloads the app so every screen is redrawn.
  - A profile typed before joining is provisional (`pre`) and yields to the household's. The household seed writes the profile only when none exists.
- **P2a, the empty bundle.** The seven seeds are empty, and the two one-family migrations are retired. The e2e fixture is synthetic: an invented child, shifted dates, changed values and generic medicines.
- **P2b, the profile drives the app.**
  - Name: `childNameHtml()` / `childNameCapHtml()`, neutral copy in load-time tables, and template slots. The name is stored clean (`_profCleanName`).
  - The born line and visit summary come from the profile. "Sprout Score" replaces "Ziva Score", and the app is titled SproutLab.
  - The town drives weather (geocoded once into a device-local cache, `ziva_geo_cache`, never synced) and the emergency region. With no town there is no weather line.
- **Safety from the audit.**
  - No Library allergen suggestions before solids, or before an age gate.
  - "No doses logged yet" replaces a red Missing list, and vaccines are left out of the score until the first dose.
  - The Q&A reads the child's name as "she", so a name never trips a keyword.

## 8. Deferred (decisions or follow-ups)
- **Boys' growth references and the child's sex.** Growth is rated against the girls' WHO tables, and setup does not ask sex. The app stays fine for this family, but a release blocker for other families: ask sex in setup, and withhold percentile verdicts until the boys' tables exist (V-M-280-3; Architect decision).
- **Pronouns.** Copy says she/her in hundreds of places. This becomes a pronoun pass keyed on the profile (V-M-280-8, V-C-280-9).
- **Pre-solids floor across Diet** (V-C-280-5), **day-zero alarm fatigue** (alerts on a family's first day, Vela pair-note), **empty-state polish** (V-V-280-10) and the **Sprout Score on zero data**.
- **`ALWAYS_POPULATED_KEYS` membership** now that no key is seeded: a deleted doctor or food can be resurrected by the other phone. Review before release (V-CA-280-14).
- **Household name vs profile name**: two sources; prefill household creation from the profile (Carina).
- **Identifiers still carry the old name.** The bundle keeps `ziva_*` storage keys, `calcZivaScore`, `_ZIVA_DOB` and `.ziva-score-hero`. These are code names, not personal data, but a key migration in P3/P5 should retire them (Cipher #4). Until then, the claim is "no child's data in the bundle", not "no 'Ziva' in the bundle".
- **Small polish:** a `body.prf-open` class instead of setting `style.overflow` (Cipher #6); cache a failed geocode so an unresolvable town isn't retried on every load (Cipher #13).
- **P3 audit-gate seed patterns (Cipher):** `turned one`, the birth date in any format (excluding the Krishna Janmashtami holiday entry), `\d+\.\d mo`, `bed-shares`, `Caldikind-P`, phone numbers, `Jamshedpur` outside the regional emergency dataset.
