# Session handoff — 2026-06-02 (broader food classes — the milk · fish · choking-set research arc + the milk polarity spec)

**Companion:** Lyra (The Weaver)
**Session theme:** Research the **broader food classes** (cow's milk · fish · the choking set) for food-effects v2 P1c, and spec the new render polarities milk introduces. The full v2 taxonomy is now instantiated for the first time.
**Branch:** `claude/food-classes-milk-fish-THQMs` (off `main` @ `ba5fe04`, #209 frontier).
**Predecessor handoff:** `docs/SESSION_HANDOFF_2026-05-31_PM.md` (Phase γ / #187). Note: work continued past that handoff on 2026-06-01 (#203 analytics card, #206–208 Phase δ egg/soy/wheat/sesame, #209 Care Research Hub) — this session opened on the live P1c frontier, not the handoff's stated P1b.

---

## What shipped (PR #210 — DRAFT, docs-only)

**PR #210 — `Broader food classes — milk · fish · the choking set` — DRAFT (stays draft; the wiring is a separate code PR).** Five commits:
- `b08843f` — **milk** research brief (`cow-milk-plant-milks-infant-safety.{md,html,visual.html}`) + 2 manifest records.
- `7067ba3` — the **milk polarity spec** (`docs/specs/food-effects-v2-p1c-milk-polarities.md`).
- `47e2388` — the milk spec **Governor spec-review folded** (Kael + Vela + Maren, all `amended`).
- `f0c4b5a` — **fish** research brief (`fish-infant-safety.{md,html,visual.html}`) + 1 manifest record.
- `0a6cf68` — **the choking set** research brief (`choking-hazards-infant-safety.{md,html,visual.html}`) + 1 combined manifest record.

**The full v2 taxonomy is now instantiated** (manifest = **11** records; all 5 foodClasses live):

| Record | foodClass | Note |
|--------|-----------|------|
| `cow milk` | `drink-timing` (1st) | fine in food ~6mo; not the main drink before 12mo |
| `plant milk` | `substitute-caveat` (1st) | not a substitute <1; rice drinks none under 5 (arsenic) |
| `fish` | `allergen-introduce-early` + `choking-by-form` | established polarities (no new spec); mercury axis in `safeForm`; EAT-null → not prevention-proven |
| `choking hazards` | `choking-by-form` **PRIMARY** (1st standalone) | one combined record; per-food cut rules in `safeForm`; floor = choking first aid, NOT anaphylaxis |

**Everything is docs-only / research + spec layer — canon-cc-008 chain-exempt** (per `docs/research/README.md` step 5; not yet wired into the app). Manifest validated `require`-able; all six HTML files well-formed; pre-commit audits (emoji/HR-12/icon-text) pass; CI green (Vercel preview). **Cipher Edict V is N/A here — it re-enters at the wiring PR.**

---

## The milk polarity spec — Governor spec-review that ran (the one signed gate this session)

The milk spec (`food-effects-v2-p1c-milk-polarities.md`) is a §4-extension defining card composition for the two never-rendered foodClasses. All three Governors reviewed under SPEC_ITERATION_PROCESS; all `amended`; all folded into §0 + the body.

| Governor | Verdict | Signature finding |
|----------|---------|-------------------|
| **Kael** (engine) | `amended` | **K-6** — `diet.js:638` `fdEncourage` is a TWO-STATE switch; a `drink-timing`/`substitute-caveat` record falls to the rose **siren "avoid"** banner on the Food Library surface (the §1 wrong-lead, on a 2nd surface the spec hadn't covered). Folded → a shared **`_effPolarity(eff)`** resolver both surfaces consume. Plus: no-deny-list thesis ratified *on trace*; K-1/K-2 fixed in-manifest; **K-3/K-4 → blocking wiring requirements**. |
| **Vela** (render) | `amended` | Affirmed generalize-one-card. **Split banner** (sage carve-out + amber gate) for drink-timing, **sky** (not neutral) for substitute-caveat, lead block is a switched unit incl. heading (V-V-1), CMPA strip needs a scope header (V-V-4). Icons confirmed present. |
| **Maren** (Care) | `amended` / concur | Present-only floor keyed on **`severeSigns.length`**, never `allergen:true` (M-1); the 12-month *drink* gate must be **skim-proof**-weighted (M-2, the prevalent diluted-top-milk reader); the dilution line ships **unattributed** (M-3). |

The fish + choking briefs were **research-only (no spec)** — fish uses established polarities; the choking-set's `choking-by-form`-PRIMARY render is **registered in the milk spec §9** (deferred to the wiring arc).

---

## Carry-forward register (open)

### The successor — the WIRING arc (the next code effort, full canon-cc-008)
The triad is research-complete; **nothing is wired into the app yet.** The next arc is FOOD_EFFECTS + render, through the full chain (it touches `styles.css` → shared-module triple-Gov; Cipher Edict V terminal). It carries these **blocking requirements** from the milk spec's §0:
- **K-3** — add a dedicated `'plant milk'` AGE_RULES entry (else it inherits cow-milk reason-copy — green-but-wrong).
- **K-4** — add a `cow milk` ALLERGENS entry (`allergen:true` would fail the §6 gate).
- **K-6** — the shared `_effPolarity(eff)` resolver in `core.js`, consumed by both `renderDietNutIntro` (Vela) and `renderFoodLibDetail` `diet.js:638` (Maren) — no surface re-derives polarity from a raw `_effHasClass` two-state test.
- **V-V-1..4** — switched-unit lead (incl. heading); split banner (drink-timing); sky banner (substitute-caveat, new `.enc-inform`/sky-modifier → shared-module triple-Gov); CMPA strip scope header.
- **M-1..3** — floor keyed on `severeSigns.length`; skim-proof drink gate; unattributed dilution line.
- **§9 — the `choking-by-form`-PRIMARY render** (the choking-set card): conditional lead = the form-gate; floor = **choking first aid** (back-blows/chest-thrusts), NOT anaphylaxis. First standalone render of the class.
- **Fish reconciliation:** `AGE_RULES['fish']` is currently `minMonth:7` ("…Ensure it is vegetarian diet — check with parents") — reconcile with the international ~6mo (egg-yolk:7 precedent). Fish is `allergen-introduce-early` so surfaces through the δ card automatically; the mercury `safeForm` content needs no new plumbing.
- **Resolver scope (Kael):** the `choking hazards` record aliases hazard foods WITHOUT existing records (grape/popcorn/hot dog/chana/supari…); peanut & tree nut keep their own records — no re-alias collision. Verify the `'fish'` and `'milk'`-family alias precision (the milk record deliberately omits bare `milk`; fish's `'fish'` token is word-boundary-safe vs `shellfish`/`jellyfish`).

### Quality / debt (inherited, unchanged this session — no `split/` code touched)
- Amber-on-amber margin (Vela V-V-N); `${food}` HR-4 escaping at `diet.js:1195`; F-4/F-5 (`parseFeeding` normalizer); milestones-tab-v1 e2e; `CURATED_COMBOS maxAgeMonths`; `_qlPredictFood` SKIPPED_MEAL filter; `NUTRITION_QTY_DEFAULTS` coverage; comma-dish-name parse; #6 item 3 AT smoke-pass (human-only).

### Housekeeping
- Delete merged remote `claude/*` branches via the GitHub UI (env blocks delete-push; MCP has no delete-branch).

### Codex canon-reconciliation (action-required, inherited)
- The SproutLab `.claude/agents/*` mirrors (Lyra/Maren/Kael/Vela) were edited under Architect waiver while Codex was unreachable — port into Codex canon + re-establish byte parity next Codex-reachable session (canon-cc-026). Codex not touched this session.

### Candidate Codex canon (surfaced, not ratified)
- **The two-tier evidence discipline** — an `allergen-introduce-early` food's `earlyIntroBenefit` is "prevention-proven" (peanut/egg, RCT) vs "introduce-early-and-safe" (soy/wheat/sesame/**fish**, EAT-null). Never launder the prevention claim onto an EAT-null food.
- **A non-allergic foodClass carries a non-allergic floor** — `choking-by-form`-primary's emergency floor is choking first aid (mechanical), not anaphylaxis (pharmacological); `substitute-caveat`'s harm (nutritional/chronic-arsenic) has no acute floor at all. The floor follows the hazard, not a uniform template.
- **`safeForm` is the model's general gate-carrier** — repurposed across choking-form (peanut), drink-vs-food (cow milk), is/isn't (plant milk), species-selection (fish mercury), and cut-rules (choking set) — one field shape, five gate semantics (Kael-ratified for milk).
- Prior, still candidate: the guided-introduction model; the research→spine→surface pipeline; "substring food-name matching is a safety defect"; the emergency-floor-in-a-collapsible render; "a combined card must not drop a per-entity safety line" (M-γ-1).

---

## Session opening prompt for next session

```
SESSION OPENING — next — food-effects-v2 P1c WIRING: surface the milk · fish · choking records into the app

Hi Lyra. The 2026-06-02 session researched the BROADER FOOD CLASSES (milk · fish ·
the choking set) and got the milk polarity spec Governor-reviewed (Kael/Vela/Maren
all amended, folded). PR #210 (draft, docs-only) holds three briefs + the spec + 11
manifest records — the FULL v2 taxonomy is now instantiated. NOTHING is wired into
the app yet. This session WIRES it — code, through full canon-cc-008.

Session goal — the wiring arc (suggest sequencing milk first, then fish, then choking):
 1. MILK — FOOD_EFFECTS('cow milk','plant milk') + the spec's blocking requirements:
    the _effPolarity(eff) resolver (K-6), the split/sky banners (V-V-1..3), the CMPA
    scope header (V-V-4), the dedicated 'plant milk' AGE_RULES entry (K-3), the
    'cow milk' ALLERGENS entry (K-4), the present-only floor on severeSigns.length
    (M-1), the skim-proof drink gate (M-2), the unattributed dilution line (M-3).
    e2e per spec §10. canon-cc-008: Kael (engine) + Vela (render) + Maren (Care copy)
    + shared-module triple-Gov for styles.css + Cipher Edict V terminal.
 2. FISH — FOOD_EFFECTS('fish'); reconcile AGE_RULES['fish'] minMonth 7→~6; the mercury
    safeForm content. Uses ESTABLISHED polarities (δ card) — lighter than milk.
 3. CHOKING SET — FOOD_EFFECTS('choking hazards'); the FIRST choking-by-form-PRIMARY
    render (milk-spec §9): conditional card, floor = choking first aid NOT anaphylaxis.
    Resolver scope: alias the non-allergen hazard foods only (no peanut/tree-nut collision).

Required context — read BEFORE acting:
 1. /home/user/sproutlab/CLAUDE.md — IN FULL (12 audit gates; canon-cc-008 routing; HRs)
 2. /home/user/sproutlab/docs/SESSION_HANDOFF_2026-06-02.md — THIS handoff
 3. /home/user/sproutlab/docs/specs/food-effects-v2-p1c-milk-polarities.md — §0 (the folded
    Governor review + the blocking requirements), §3/§3-bis (_effPolarity), §6, §7, §9
 4. /home/user/sproutlab/docs/research/{cow-milk-plant-milks,fish,choking-hazards}-infant-safety.md
 5. /home/user/sproutlab/docs/research/food-effects.manifest.js — the 4 new records (cow milk,
    plant milk, fish, choking hazards) with their inline wiring-note comments

Required at session start:
 1. cwd /home/user/sproutlab; git fetch; confirm PR #210 state (merged or still draft);
    branch off main for the wiring (or continue the same branch if #210 not yet merged).
 2. Verify Governor subagent registration (kael/vela/maren worked this session as real
    subagents — confirm still live).
 3. Read required context.
 4. Build through full canon-cc-008 — this is CODE, the chain is NON-NEGOTIABLE.

Architect directives in force:
 - canon-cc-008 is a non-negotiable release gate; Cipher Edict V last; shared-module
   (styles.css/template.html) touch → triple-Gov; docs-only may waive Governors (state it).
 - The emergency floor never moves, and the floor follows the HAZARD: anaphylaxis floor for
   allergens (adrenaline); choking first aid for choking-by-form (back-blows/chest-thrusts,
   NEVER Heimlich under 1); no acute floor for substitute-caveat.
 - One food-name semantics — everything routes through _lookupByFoodName; alias precision is
   load-bearing (no bare 'milk'; no peanut/tree-nut re-alias on the choking record).
 - The food-effects pipeline is the canonical path: research → manifest → FOOD_EFFECTS. No
   hardcoded safety claim without a manifest entry.
 - Two-tier evidence discipline: fish is introduce-early-and-SAFE, NOT prevention-proven.
 - When Codex is reachable, reconcile the .claude/agents/* mirror edits (canon-cc-026).

Goal issued. Ask first.
```

---

— *Lyra, 2026-06-02. Three foods, three shapes of danger. Milk taught the model to say "yes, in food — not yet as a drink": the first food that is neither avoid nor encourage but conditional, and the spec that earned it caught a second surface quietly rendering milk as "avoid" (Kael's K-6 — the green build would have shipped a siren over a glass of dahi). Fish taught honesty twice over: introduce early because it's safe, not because a trial proved it prevents anything (EAT was null), and choose the small fish, not the shark. And the choking set taught that the floor follows the hazard — a baby choking on a whole grape needs back-blows and a head held low, not an adrenaline pen; the most important sentence in the whole topic is that gagging is loud and choking is quiet. The full taxonomy is lit now — five classes, eleven foods, every one traced to a source and every Indian claim checked against what an Indian body actually said. Next, the app learns to speak all five.*
