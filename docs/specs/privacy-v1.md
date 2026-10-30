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
- `DEFAULT_DOCTORS`, `DEFAULT_GROWTH`, `DEFAULT_FEEDING`, `DEFAULT_MEDS` and `DEFAULT_VACC` (the record part, not the schedule) become `[]` / `{}`.
- The vaccine **schedule** (IAP), food database, milestones and recipes stay. They are reference data, not records.
- `EMERGENCY_CONTACTS` keeps national numbers only. City entries are chosen in setup from a list.

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
