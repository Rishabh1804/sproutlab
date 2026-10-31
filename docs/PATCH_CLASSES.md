# SproutLab — Patch classes

**What this is:** a catalog of the bug *types* this codebase keeps producing, built from the PR #282 build log (`docs/BUGS.md` → "Child-sex S2–S4 build", entries #1–#56). Each class names the pattern, how to spot it in a diff, what fixed it here, and the guard that now catches it.

**How to use it:**
- **Builder (Lyra):** before opening a PR, run the "Look for" list of every class the diff touches.
- **Governors:** cite the class in a finding (for example "V-M-…, PC-1").
- **Bug log:** tag each new entry with its class, so the classes that keep growing show where the next gate should go.

**Status legend:**
- **Guarded:** a build gate fails the build.
- **Tests:** an e2e spec catches it.
- **Design:** one shared source makes the mistake hard to make.
- **Rule:** a written check only, for Builders and Governors to apply.

The labels were corrected after Carina's audit (V-CA-282b-7), so no class claims a gate it doesn't have.

**Open items from #282:** all 12, plus one found while fixing (#57), are patched in #282: PC-1 #25, #27, #55, #56; PC-2 #4, #33, #38; PC-3 #30, #57; PC-4 #48; PC-5 #51, #54; PC-6 #12, #56.

---

## PC-1 · Time and age semantics: one clock, one age, local dates
**Pattern:** two parts of the app disagree about *when*. Typical causes:
- one card uses today's age and another the age at the measurement;
- a date-only string is parsed as UTC;
- a bracket is cut by rounding in one place and by completed months in another;
- two timestamps tie within the same millisecond.

**Open items patched in #282:**

| # | Item | Patch |
|---|---|---|
| 25 | Band picked by today's age in some callers, measurement age in others | Every velocity is judged at the age of its own latest measurement |
| 27 | Infant bracket floors near P3–P5 at the start of a bracket; no newborn weight-loss window | One-month weight rows from WHO's 1-month tables, looked up at the window midpoint; newborn model with three cited checks: the 14-day window is kept (AAP, Maren); more than 10% loss is flagged (NICE NG75); "back to birth weight?" is judged instead of a rate up to day 21 |
| 55 | `ageMonthsAt('YYYY-MM-DD')` parsed as UTC (HR-12) | Local calendar parse |
| 56 | CareTicket weight goal at weigh-in age untested | e2e pins it |

**Same class, already fixed in #282:** #7, #8, #9 (copied bands drifting apart), #24 (toddler band), #26 (g/day rounding), #29 (CareTicket goal by today's age), #44 and #49 (sync ledger timestamps tying in one millisecond).

**Look for:**
- `ageAt().months` next to a value computed from a *measurement*;
- `new Date('YYYY-MM-DD')` or `Date.parse` on a date-only string;
- `Math.round` versus `Math.floor` on an age that picks a bracket;
- `Date.now()` used to order two events that can happen in the same tick;
- a threshold copied into more than one file.

**Guards:**
- **Guarded:**
  - `audit-growth-age-v1`: no `growthVelocityBand()` call takes today's age, directly or through a variable. Self-tested; it flags 17 sites in the pre-#25 code.
  - `audit-hr12-dateonly-v1`: a per-file ratchet on `new Date(<date-ish>)` parses, which may only fall; a benign site carries `// HR-12`.
- **Design:** `growthVelocityBand()`, `gvAgeAt()` and `ageMonthsAt()` (core.js) are the single band, age and month sources; `_syncNow()` orders all sync-ledger events.
- **Tests:** growth-velocity-bands.spec (bracket edges, age rule, newborn cases), sync-unsynced-ledger F17 (run repeated).
- **Rule:** "one helper, one clock". A new time-derived value goes through the existing helper, never a local copy.
- **Note:** `audit-hr12-v3-3` covers only the v3-3 surface (intelligence-correlate.js and one ISL block). It would not have caught #55; the ratchet above is what covers the rest of split/.

## PC-2 · Match vocabulary versus copy (sex-aware matching)
**Pattern:** words the app *matches* (intent triggers, keyword tables, strippers, word lists) get treated like words it *shows*, or are matched without knowing the child's sex. Typical results: a girl's note about her father counts as her own evidence; a boy's wording finds nothing; a phrase meant for one path is folded wrongly.

**Open items patched in #282:**

| # | Item | Patch |
|---|---|---|
| 4 | Possessive name "Arjun's nap" folded to "she nap" | Possessive folds to "her" |
| 33 | `qaWords` 'he' for every sex (Hinglish "he" = "hai") | 'he' removed; a boy's "he" is already folded |
| 38 | he-forms matching a girl's note about her father | Matcher skips the other sex's forms |

**Same class, already fixed in #282:** #1 (raw query not folded), #6 (keywords had girls' forms only), #28 ("his egg" echo), #30 (head-injury phrasing), #31 (unbounded stripper), #46 and #53 (head-injury keywords, both forms).

**Look for:**
- a new keyword or trigger that contains a pronoun;
- a matcher that runs on raw text without `_qaNameAsShe`;
- a regex alternation with no `\b`;
- a word list changed "for every sex".

**Guards:**
- **Tests:** qa-boy.spec and qa-sex-aware-match.spec (possessive fold, Hinglish for both sexes, classifyActivity per sex).
- **Note:** `audit-pronouns-v1` checks copy, not matching. It lists match vocabulary in its allowlist but would not catch #33 or #38.
- **Rule:** match vocabulary stays canonical (she/her) plus a fold, or lists both forms *and* filters by `childSex()`.

## PC-3 · Dead or unreachable paths
**Pattern:** a fix or keyword lands in a function nothing calls, so it protects nothing.

| # | Item | Patch |
|---|---|---|
| 30 | `ctShouldTriggerCreate` has no callers; a keyword was added there | Removed: its lists had drifted from the live `ct_create` intent |
| 57 | Home's "healthy growth for N weeks" alert read `wtSpanDays`, which was never set (NaN), so it could never fire | `getGrowthVelocity` sets it |

**Look for:**
- a change inside a function that grep finds no caller for, including `data-action` strings and dispatcher maps;
- a property read (`obj.x`) that its producer never sets (#57).

**Guards:** **Rule:** before editing a function to fix behaviour, prove it is reachable (grep its callers and dispatcher entries). Before reading a property, grep that its producer sets it.

## PC-4 · Escape at the render boundary (HR-4)
**Pattern:** text goes into `innerHTML` without `escHtml`, usually where it "is only a constant today".

| # | Item | Patch |
|---|---|---|
| 48 | Sleep-regression cause text unescaped in quicklog | `escHtml` at the boundary; sibling builds checked |

**Look for:** string concatenation into `innerHTML` of anything not literal: `x.text`, a label, a name, a value that passed through a lookup (`msLabel`, `pron` and `childKinWord` return constants, but the thing beside them may not).

**Guards:** **Rule:** HR-4. An HR-4 audit gate is the logical next guard (candidate).

## PC-5 · Gate coverage: a gate that can't fail, or misses a surface
**Pattern:** a build gate passes because it doesn't look where the problem is, or because its scanner silently broke.

| # | Item | Patch |
|---|---|---|
| 51 | Pronoun gate ignored template attribute copy | Scans placeholder, aria-label, title and alt |
| 54 | Pronoun gate had no self-tests | 16 adversarial fixtures run first; a scanner regression fails the build |

**Same class, already fixed in #282:** #46 (gate failed on new keywords, caught before shipping), #50 (substring allow entries), #52 (missing anchor switched a rule off).

**Look for:** a new audit gate without fixtures; an allowlist matched by substring; a rule keyed on an anchor that could be renamed.

**Guards:**
- **Guarded:** `audit-pronouns-v1` self-test.
- **Rule:** every new gate ships with fixtures for its pass and fail cases and a stale-entry check.

## PC-6 · Test infrastructure and coverage
**Pattern:** tests pass or fail for reasons unrelated to the code: a hard-coded origin, a phrasing that never reaches the path under test, a state-machine edge left unpinned.

| # | Item | Patch |
|---|---|---|
| 12 | Fixture origin hard-coded to 127.0.0.1:5173 | Origin derived from the served port |
| 56 | CareTicket weigh-in-age goal unpinned | e2e added (with PC-1) |

**Same class, already fixed in #282:** #18 (no boy-profile safety-copy test), #47 (test phrasings caught by an earlier branch).

**Look for:** literal ports or origins in tests; a test that asserts a *mode* without checking that the input reaches it; a fix with no test that fails without it.

**Guards:**
- **Design:** playwright.config rewrites the fixture origin to the served port. This is a fix, not a gate: nothing blocks a new hard-coded origin, so the Rule below applies.
- **Rule:** a fix lands with a test that fails on the old code. "Flaky" is a root cause to find, not a label (F17 was a real race).

## PC-7 · Rewording weakens a safety meaning
**Pattern:** a neutral rewrite (pronouns, tone) drops the subject or softens a limit, and a safety line reads differently at 2 AM. No open items remain; this is the class most likely to recur in any copy pass.

**Already fixed in #282:**
- #14: litchi lost "the child".
- #15: an oily-fish limit read as a target.
- #16: allergen ladders lost "to whom".
- #17: a molar claim went stale.
- #19 and #20: care guidance told parents to wait (newborn testes, fever under 3 months).
- #21 and #23: false reassurance (newborn bleeding, hydrocele before hernia).
- #42: "turn him back".

**Look for:** a passive voice that drops who must act; "suggests" or "up to" replacing "no more than"; a claim with no age bound; reassurance placed before "see the doctor"; any wait advice without its age floor.

**Guards:**
- **Rule:** Ceres and Maren sign off every changed safety line, line by line, and every care claim cites a source quote (canon-cc-013).
- **Tests:** body-care.spec checks age bounds and sources.

## PC-8 · Record keys used as display text
**Pattern:** a field is both what users read and the key stored records point to, so editing the copy orphans data.

**Already fixed in #282:** #5 and #34 (milestone `text` is the record key; display now comes from `label` via `msLabel()`), #45 (a slug rendered as a title).

**Look for:** `slugify(x.text)`, records matched by display strings, a copy pass touching a field that appears in `KEYS`-stored data.

**Guards:**
- **Guarded:** `audit-pronouns-v1` requires a label on any pronoun-bearing milestone key; milestone-labels.spec freezes the slugs.
- **Rule:** never reword a field before proving it isn't a key; give it a display field instead.

## PC-9 · Cited registries drift from their source
**Pattern:** a table of cited values (WHO bands, food effects, vaccine schedule) is typed or derived by hand. It drifts from its source, or the derivation itself is wrong even though every number matches. Proposed by Carina (V-CA-282b-7).

**Items:**
- #7, #8 and #9: hand-typed bands copied into about 10 places, narrower than WHO.
- #24: the one-row toddler band.
- #26: g/day rounding.
- #27: the one-month rows' method.
- V-CA-282b-1: 2-month intervals used for a 4-week window.
- V-CA-282b-5: hCmWk rounded inward.
- V-CA-282-3: food-effects manifest drift.

**Look for:**
- a number with no citation comment;
- a derivation whose window or interval doesn't match how the app measures (2-month increments against a 4-week window);
- rounding that goes inward on a band edge;
- a registry and its manifest or doc edited in only one place.

**Guards:**
- **Guarded:** `audit-food-effects-sync-v1` (precedent: keys only).
- **Rule:** every cited registry row states its source file, fetch date, method and rounding, and the PR body shows the recompute.
- **Candidate (Carina owns):** `audit-growth-bands-provenance-v1`. It would commit the WHO tables as CSVs with a manifest of URLs and fetch dates under docs/research/, recompute the bands by the documented method, and fail on drift.

## Guard backlog (candidates, by owner)
1. `audit-growth-bands-provenance-v1` (PC-9). Owner: Carina.
2. HR-4 render-boundary gate (PC-4). Owners: Carina (`escHtml` root) and Cipher.
3. A record-shape freeze test for `KEYS`-stored records, generalising milestone-labels.spec (PC-8). Owner: Carina.
4. A schema test that every property readers take from `getGrowthVelocity()` is set (PC-3). Owners: Carina and Kael.
5. A test-origin rule: one exported baseURL helper; no spec builds its own origin (PC-6).
