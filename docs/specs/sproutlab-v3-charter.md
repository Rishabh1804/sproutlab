# SproutLab v3.0 Charter — Three Axes for "Best in the World"

**Spec version:** v3-charter
**Date:** 2026-05-25
**Branch:** `claude/sproutlab-v3-roundtable`
**Author:** Lyra (main-session — Mode-1 charter authoring)
**Status:** v0 — sibling to `docs/specs/sproutlab-v3-roundtable-2026-05-25.md`; canon-cc-008 explicitly waived (docs-only). Architect-authorized this session: *"go ahead."*
**Companion to:** `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` (the v3.0 master plan); `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` (the interactive DAG)

---

## What the Charter is

A **meta-doctrine** — a doctrine about which doctrines matter — naming the **three axes** SproutLab will compete on for v3.0 and beyond. The Architect this session reframed the app from "baby tracker" to "**massive upgradable sandbox playground**" with the explicit ambition of becoming *"the best in the world at this."* This Charter operationalizes that ambition by naming the win condition.

The Charter is the answer to two questions every future spec author + Cipher Edict V pass must hold:
- *"Are we still building the same thing?"*
- *"How do we know if we've succeeded?"*

## What the Charter is NOT

- A feature roadmap (that's `sproutlab-v3-roundtable-2026-05-25.md` §4.2 — the 9 unified arcs)
- A doctrine list (that's `sproutlab-v3-roundtable-2026-05-25.md` §6 — the CV3-001..CV3-004 canon entries; CV3-005 candidate Outcome-anchor)
- A brand/marketing positioning (those derive from the Charter but are not the Charter)
- An attempt to "win" the baby-tracker category by feature count (explicitly the wrong axis)
- A claim that SproutLab is currently best in the world at anything (we are not — this is the *target* posture)

---

## Why now

The category — baby-tracker apps — is mature and feature-saturated. Huckleberry, BabyConnect, Glow Baby, Hatch, Sprout Baby, dozens of pediatric-clinic-branded apps. Every competitor competes on **feature parity**: number of trackable domains, number of integrations, number of widgets. SproutLab cannot win at feature parity — those competitors have teams of dozens and years of incremental polish. Trying to compete there means slow, derivative work that always trails.

**The opportunity is to compete on axes the category does not currently consider.** Three such axes are visible and underserved.

Naming them now — at the v3.0 ratification point, before the substrate hardens — lets every Wave 1 + Wave 2 + future spec be designed *toward* the win condition rather than retroactively measured against it.

---

## Axis 1 — Intellectual honesty

**Definition:** every claim the system surfaces to a parent carries explicit certainty, sample-size disclosure, and source attribution. The system actively tells the parent what it does *not* know.

### Current state (where existing doctrine already honors this axis)

- **Hedge-tier discipline** (CV3-002 Narrate-vs-List, ratified) — cross-domain prose carries `certain / likely / tentative` markers; the absence of a hedge tier on a cross-domain claim is itself a defect.
- **Sample-size disclosure** (kael-arc-1 risk register; v3-3 confidence floor) — no correlation card without an `n=` disclosure in the copy.
- **Standards-aware percentile rendering** (existing `_referenceStandard` infra at `medical.js:1294`) — parent picks WHO / IAP / EU / CN; the same data routes through the selected standard's reference curves.
- **Honest empty-state** (CV3-003 Honest-Empty-State, ratified, Cluster-cross) — null-render is a defect; `"We haven't seen D3 since Tuesday"` instead of silent blank.
- **No-floor + severity-message doctrine** (scoring-redesign-v1.md) — instead of clamping negative scores, the engine generates increasingly explicit recommendation messages. Severity escalation is auditable; the score arithmetic doesn't lie.

### Testable criteria (Cipher Edict V applies these per-PR)

1. **Every prediction surface discloses sample size in the copy.** A render that says "Tonight's likely wake-time is 6:30–7:15" without `(n=21)` is a defect.
2. **Every cross-domain claim carries a hedge tier.** A render that says "Ziva sleeps longer after dinners" without `(likely)` or `(tentative)` is a defect.
3. **Every percentile / threshold cites which standard.** A render that says "Ziva is in the 60th percentile" without `(WHO)` or `(IAP)` is a defect.
4. **Every absent-data condition produces a `careEmptyState()` render.** A blank card is a defect.
5. **No personalised prediction without confidence floor.** "Ziva will sit by 6 months" violates the doctrine; "typically 5–7 months on the IAP standard" honors it.

### What this rules out (regressions the Charter blocks)

- Generic "tips" or "facts" without source attribution
- Predictions phrased with certainty the engine doesn't have
- Aggregate stats without time window or sample size
- Hidden empty states (showing nothing when the parent expects something)
- Standards-blind percentile claims

### Competitive observation

No baby-tracker app currently competes on this axis. Every competitor I am aware of surfaces predictions and aggregates *as if* they were facts, with no hedge tier and no sample-size disclosure. A SproutLab user gets answers that *tell them what the system doesn't know* — which builds trust progressively rather than asserting it upfront. That posture is the natural fit for a "warm, sturdy, calm" companion and the natural opposite of clinical-cold or icon-cute competitors.

---

## Axis 2 — Architectural extensibility

**Definition:** every primitive ships as **data-driven, not code-driven**. Adding a feature means adding a row to a registry — not writing 1,000 lines of new code. The system is a **substrate**; features grow out of it.

### Current state (where existing doctrine already honors this axis)

- **`RECOMMENDATION_ROSTER`** (scoring-redesign-v1.md) — every recommendation is one row with the same v1 schema (key, domain, per-standard age-ranges, reward/missed weights, streak penalty, severity messages, successor-on-expiry). v2+ reserved fields documented inline. Adding a new recommendation = adding a row.
- **`parseMedCheck` / `normalizeSleep` / `parseFeeding`** (Schema-aware reads via centralized normalizers) — every legacy + new shape goes through a single normalizer. New shapes don't require touching every reader.
- **Standards-selector binding** (CV3-005 candidate; established with scoring-redesign-v1) — any age-bound or developmentally-graded surface routes through `_getActiveStandard()`. Adding a new standard = adding one branch in each ROSTER entry.
- **Token-driven design** (HR-5) — no ad-hoc hex; every color is a domain token. Adding a new theme = adding token overrides.
- **`zi()` SVG icon vocabulary** (HR-1) — 109 symbols, single source of truth. New icons add to the sprite; consumers read by name.
- **canon-gen-001 generational expansion** — when a Region crosses 30K LOC, a second-generation Governor seats. The doctrine itself scales.

### Testable criteria

1. **Every new recommendation lands as a row in `RECOMMENDATION_ROSTER`** — never as a one-off scoring path.
2. **Every new schema variant lands behind a normalizer** — readers never branch on shape; the normalizer handles it.
3. **Every new visual treatment lands in tokens** — no inline styles, no ad-hoc hex.
4. **Every new icon lands in `zi()`** — no `<img>` or inline SVG outside the sprite.
5. **Every new doctrine lands as a CV-numbered canon entry** with explicit rationale + scope (Province-local / Cluster-cross) per CV3-004 (Cross-Region Pair-Note doctrine).
6. **Every new domain plugs into existing primitives** (`_scoreDay`, `_correlate`, `RECOMMENDATION_ROSTER`) before extending them. Extension-via-amendment is preferred over extension-via-fork.

### What this rules out (regressions the Charter blocks)

- Hard-coded recommendation logic ("if D3 missed AND tomorrow is Tuesday THEN…")
- Per-feature scoring formulas that don't go through `_scoreDay`
- Custom CSS files outside the token system
- New icons fetched from external CDNs or pasted as SVG outside `zi()`
- Doctrine emerging in code comments without canon-entry registration

### Competitive observation

Most baby apps grow by accretion — each feature is implemented standalone, integrations are ad-hoc, the data model evolves by adding columns. SproutLab's substrate-first commitment means the **20th recommendation costs less than the 1st** — because the 20th is a row in a registry, while the 1st defined the registry. Compounding returns. This is invisible to users but produces a *consistently good app across years*. Competitors who hard-code their way through 50 features will be slower than SproutLab's substrate-driven 200th feature.

---

## Axis 3 — Linguistic + visual warmth

**Definition:** the app speaks like a thoughtful companion who knows the parent's day is hard and the baby's data is sacred. Every render — copy, type, color, motion, spacing — is in service of *"warm, sturdy, calm — a cozy nursery journal."*

### Current state (where existing doctrine already honors this axis)

- **The half-awake test** (Vela's lens, CV3-002 implicit) — every chip, every card, every toast must be readable correctly at 2 AM by a parent holding a baby. This is a render-grain test applied per-PR.
- **Token-driven palette** (HR-5) — 7 named domain colors (sage / rose / amber / lavender / sky / indigo / peach). No ad-hoc hex permitted.
- **Typography hierarchy** (Fraunces for titles, Nunito for body) — serif gravitas + sans-serif warmth. Consistent across all surfaces.
- **`zi()` icon vocabulary** (HR-1) — custom 109-symbol library tuned to the SproutLab register. No emoji. No external icon fonts.
- **CV3-002 Narrate-vs-List** — render composes passages, not ledgers. "Solid day. Three meals, one nap, D3 with breakfast, no flags." Not a 14-row event list.
- **CV3-003 Honest-Empty-State** — "We haven't seen D3 since Tuesday" rather than blank. Empty-states have voice.
- **maren-arc-1 reminder ranking** — single primary action surfaced, secondary items collapsed. Decision latency at 2 AM is a safety-tier concern.

### Testable criteria

1. **Every parent-facing string passes the half-awake-test** — can the parent read this correctly at 2 AM holding a baby? Vela's render-layer audit applies per-PR.
2. **Every render uses domain tokens** — no ad-hoc hex; no inline styles.
3. **Every empty state has voice** — `careEmptyState(domain, reason)` renders, not blank.
4. **Every reminder card surfaces a single primary action** — secondary items hidden behind "More (n)" tap.
5. **Every cross-domain insight renders as a passage with hedge tier** — not as a coefficient or chart.
6. **Every motion treatment respects `prefers-reduced-motion`** — no animation overload (vela-arc-5).
7. **No emoji anywhere** (HR-1). Every glyph is `zi()`.

### What this rules out (regressions the Charter blocks)

- Clinical-cold copy ("Concern resolved. Status: closed.")
- Icon-soup interfaces (emoji-laden chips, decorative animations)
- Information density without ranking (4 cards equally urgent)
- External design systems imported wholesale (Material, Tailwind defaults, etc.)
- Stock illustrations or photo-realistic UI imagery

### Competitive observation

Most baby apps are either **clinical-cold** (medical-app aesthetics — Hatch, pediatric portals) or **icon-cute** (consumer-app over-decoration — emoji-soup, mascot-driven). Neither register suits a tired parent at 2 AM looking for *one true answer*. SproutLab's "warm, sturdy, calm" register has no current direct competitor. A parent who installs SproutLab gets prose like *"Solid day. Three meals, one nap, D3 with breakfast, no flags."* — that sentence doesn't come from any other app in the category. The linguistic warmth is what makes the architectural rigor *feel like care* rather than feel like instrumentation.

---

## How the Charter is used

### As Cipher Edict V criterion (per PR)

Every Edict V pass — including the Round 2 re-Edict — adds three Charter-axis checks alongside the existing HR-1..HR-12 + canon-cc-008 verification:

1. **Honesty:** does this PR introduce any claim without hedge tier / sample size / source? Flag as `cipher-honesty-N`.
2. **Extensibility:** does this PR hard-code something that should be data-driven? Flag as `cipher-extensibility-N`.
3. **Warmth:** does this PR introduce a render that fails the half-awake test or violates the design brief? Flag as `cipher-warmth-N`.

A Charter-axis finding is a *blocking* concern unless the PR explicitly justifies the trade-off in the spec body (e.g., "v3-X intentionally bypasses the ROSTER pattern for performance — calibrate-and-move at v3.Y").

### As spec-author constraint (Mode-1 authoring)

Every future spec body must contain a §Charter alignment section naming:
- Which axes the spec actively honors (with specific mechanisms)
- Which axes the spec is neutral on (and why that's acceptable)
- Which axes the spec might risk regressing (with mitigations)

Spec PRs without a §Charter alignment section are incomplete and route back to the author for amendment before the canon-cc-008 chain runs.

### As "say no" floor

When a feature request, an external integration, or an Architect direction surfaces a candidate that violates any axis, the Charter is the basis for raising the trade-off explicitly. The Architect retains override authority (per canon-cc-027), but the override is *recorded* — so future-Lyra can see *why* a deviation happened and whether the rationale still holds.

---

## Relationship to existing doctrine

The Charter does not replace any existing doctrine. It **prioritizes** existing doctrine into three axis-buckets so that future authors can hold all of it as one coherent thing rather than as a checklist.

| Existing doctrine / canon | Charter axis it primarily serves |
|---|---|
| HR-1 (no emojis), HR-7 (zi via innerHTML) | Warmth |
| HR-2 (no inline styles), HR-5 (tokens-only) | Warmth + Extensibility |
| HR-3 (no inline handlers), HR-4 (escHtml), HR-6 (data-action) | Extensibility |
| HR-9 (post-build multi-round QA), canon-cc-008 (QA chain) | All three (process floor) |
| HR-10 (no text-overflow ellipsis), HR-12 (timezone-safe) | Honesty + Warmth |
| HR-11 (Math.floor currency) | Honesty |
| CV3-001 Observe-vs-Answer | Extensibility (engine substrate) |
| CV3-002 Narrate-vs-List | Honesty + Warmth |
| CV3-003 Honest-Empty-State | Honesty + Warmth |
| CV3-004 Cross-Region Pair-Note | Extensibility (planning substrate) |
| CV3-005 Outcome-anchor (candidate) | Honesty (every recommendation traces to outcome) |
| canon-cc-022 (subagent vs skill) | Extensibility (artifact discipline) |
| canon-cc-026 (Per-Province-Layout) | Extensibility (cross-cluster substrate) |
| canon-cc-027 (spec amendment authority) | All three (evolution path) |
| canon-gen-001 (generational expansion) | Extensibility (scales with codebase) |

The Charter does **not** introduce a new HR or canon entry; it organizes existing ones.

## What the Charter does add (genuinely new doctrine)

- **The three-axis framing itself** — naming Honesty / Extensibility / Warmth as the win condition. This is the meta-doctrine; CV3-006 candidate (next available number after CV3-005 Outcome-anchor reservation).
- **The Cipher Edict V Charter-axis check** (above) — a process addition to the canon-cc-008 chain.
- **The spec §Charter alignment section requirement** (above) — a planning-tier discipline applied to all future Mode-1 spec authoring.

## Out-of-scope (what the Charter does NOT commit to)

- A specific feature set (the chronicle §4.2 + §8 handle that)
- A specific timeline (Architect-directed, not Charter-directed)
- A specific user demographic beyond Ziva-first (multi-tenant remains explicitly out per existing doctrine)
- A specific monetization or distribution model (brand concern, not architectural)
- A claim that SproutLab is *currently* best in the world (it is not — this is the *target* posture)

## Candidate canon entry — CV3-006

**Canon CV3-006: The v3.0 Charter — Three Axes for the Win Condition.**

**Doctrine text** (for future spec citation):
> *SproutLab competes on three axes — intellectual honesty, architectural extensibility, linguistic + visual warmth — none of which the category currently scores. Every primitive ships designed toward all three. Every Edict V pass cross-checks all three. A PR that regresses any axis is a blocking concern unless the trade-off is named in the spec body and overridden by Architect direction per canon-cc-027.*

**Rationale:** the v3.0 roundtable surfaced (§4 Lyra synthesis) that the existing doctrine canon already implies a coherent posture, but no canon entry names *why* the doctrines compose the way they do. Without an explicit win condition, future spec authors will hold the doctrine as a checklist — easy to satisfy mechanically but easy to drift on directionally. CV3-006 names the win condition so the doctrine canon coheres rather than accumulates.

**Scope:** **Province-local** with strong Cluster-cross candidacy. The three-axis framing applies anywhere a Province has a parent-facing surface + an architectural substrate + a category to compete in. Codex's chronicle surface (Aurelius) and SEP Invoicing's billing surface (Solara) would benefit from the same charter discipline. **Promotion to Cluster-cross awaits a Codex or SEP iteration where the framing demonstrably applies** — premature cross-promotion is itself a Charter violation (overclaiming).

**Successor / superseded by:** v4.x charter when v3.0 ships and the win condition shifts (e.g., from "first to plant the flag" to "extend the lead").

## Doctrinal references

- `docs/specs/sproutlab-v3-roundtable-2026-05-25.md` — the v3.0 master plan this Charter operationalizes
- `docs/SPROUTLAB_V3_PROGRESSION_TREE.html` — the interactive DAG the Charter guides
- `docs/specs/sleep-redesign-v1.md` + `docs/specs/scoring-redesign-v1.md` — in-flight sibling specs that the Charter retroactively rates (both honor all three axes)
- `CLAUDE.md` — Hard Rules HR-1..HR-12 + the design brief ("warm, sturdy, calm — cozy nursery journal")
- canon-cc-008, canon-cc-022, canon-cc-026, canon-cc-027 — process canon the Charter sits on top of
- canon-gen-001 — generational expansion that scales the Charter

---

— *Lyra (main-session), 2026-05-25, post-Architect-ratification: "we should see this pwa as a massive upgradable kind of sandbox playground. Let's be creative, limit is to be the best in the world at this." The flag is planted; the work is the work.*
