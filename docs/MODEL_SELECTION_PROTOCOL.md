# Model Selection Protocol — the Republic's model-tier doctrine

> **Status:** Drafted 2026-07-27 at Architect request (prompted by a
> circulating "5 Brains Behind Claude" infographic — fact-checked below).
> Province-operative copy lives here (SproutLab); the record copy lives at
> `Codex/docs/specs/MODEL_SELECTION_PROTOCOL.md` per canon-cc-010
> ("records are Codex"). Formal ratification via the canon-cc-027 chain is
> pending; until then this is Architect-commissioned working doctrine.

---

## 1. Why this exists

Every Companion subagent in the Republic previously inherited the session's
main model — usually the most capable (and most expensive) tier — even for
purely mechanical work like grepping a codebase region or running `pnpm build`
and reporting pass/fail. Claude Code lets a subagent pin its own model via
`model:` frontmatter, and Workflow `agent()` calls accept `model` and `effort`
options. This protocol says **which tier does which work**, so credit spend
concentrates where judgment lives and drains away from where it doesn't.

The governing principle, borrowed from the infographic and verified against
Anthropic's own guidance: **start small, move up only when the work demands
it** — with one Republic-specific exception carved out in §4 (the safety
floor: QA audits never economize).

## 2. Fact-check — how true was the infographic?

Verified against the Claude API reference (models + pricing, 2026-07-27):

| Infographic claim | Verdict |
|---|---|
| Haiku 4.5 — quick questions, summaries, extraction; lowest cost | **True.** $1 / $5 per MTok in/out. 200K context (the only current model not at 1M). Fastest tier. |
| Sonnet 5 — the everyday default; writing, research, routine coding | **True, and undersold.** $3 / $15 per MTok (intro $2 / $10 through 2026-08-31). Sonnet 5 is near-Opus on coding and agentic work — it is a genuine daily driver, not just a "business documents" model. |
| Opus 4.7 — "built for deep thinking" | **Real model, but previous-generation.** The 4.7-vs-4.8 "thinking vs execution" split is folk taxonomy, not an official distinction — 4.8 is simply the newer, more capable Opus 4.x. |
| Opus 4.8 — "built for deep execution", higher credit use than 4.7 | **Partly wrong.** Opus 4.7, 4.8, **and Opus 5** are all the same API price ($5 / $25 per MTok). Any felt "credit" difference comes from output volume (thinking + longer responses), not a higher rate. |
| Fable 5 — maximum intelligence, maximum credit use | **True.** $10 / $50 per MTok — 2× Opus. Anthropic's most capable widely-released model; explicitly positioned for the hardest reasoning and long-horizon agentic work, not daily use. |
| "Start small, move up only when the work demands it" | **Sound.** Matches Anthropic's own agent-design guidance: spawn subagents on cheaper models for sub-tasks; keep the main loop on one model. |

**Biggest omission:** the infographic skips **Opus 5** entirely — the *current*
Opus, a drop-in upgrade over 4.8 at the same price, and the recommended Opus
target. Treat the infographic's "Opus 4.7 / 4.8" rows as one collapsed row:
"Opus tier — currently Opus 5."

## 3. The tier ladder

| Tier | Model (alias) | $/MTok in–out | Assigned work in the Republic |
|---|---|---|---|
| 0 — Mechanical | `haiku` (Haiku 4.5) | 1 – 5 | Reconnaissance and pass/fail verification. File location, symbol greps, region mapping, running builds/tests and reporting output verbatim. No judgment, no prose quality requirement. |
| 1 — Drafting | `sonnet` (Sonnet 5) | 3 – 15 | Composition and chronicling. Drafts from a precise brief, session notes, journal/log/chronicle stubs, routine docs. The commanding Companion reviews everything anyway (canon-proc-006), so the review layer absorbs the tier gap. |
| 2 — Judgment | *(inherit — no `model:` field)* | session rate | Builders, Governors, the Censor, the Chronicler's canonical records. Anything signed, safety-bearing, or entering the cc-018 lifecycle runs at the session's model, whatever the Architect set it to. |
| 3 — Summit | `fable` (Fable 5) | 10 – 50 | **Explicit Architect opt-in only.** Ambiguous strategic work, deep research, highest-stakes decisions. Never a default; never pinned in a spec. |

### Per-Companion assignment

| Companion / worker | Frontmatter `model:` | Rationale |
|---|---|---|
| scribe-scout | `haiku` | Read-only recon; returns paths and line numbers. |
| scribe-verify | `haiku` | Mechanical checks; reports failing output verbatim — no interpretation. |
| scribe-draft | `sonnet` | Composition from a brief; commanding Companion reviews the return. |
| scribe-record | `sonnet` | Chronicle stubs and running notes; Sonnet's writing is strong. |
| Lyra (Builder) | *(none — inherit)* | Spec authoring and architecture decisions are judgment work. |
| Maren / Ceres / Kael / Vela (Governors) | *(none — inherit)* | Safety floor — see §4. |
| Cipher (Censor) | *(none — inherit)* | The Edict V final-pass is the last gate before merge. |
| Chronicler (Aurelius) | *(none — inherit)* | Subagent modes produce canonical, attributable records (committee synthesis, cc-017 artifacts); dissent-preservation is judgment work. In-transcript skill-mode chronicling runs at session model by construction. |

## 4. The safety floor (non-negotiable)

**The canon-cc-008 QA chain never runs below the session model.** SproutLab is
a health-intelligence tracker for Ziva; a Governor audit that misses a
medication-timing bug or a mis-rendered fever threshold because it ran on a
cheaper model is a false economy of the worst kind. This is why the Governors,
Cipher, and Lyra carry **no** `model:` field: a pinned model is a ceiling as
well as a floor — if the Architect runs a session on Fable, a spec pinned to
`opus` would silently *downgrade* the audit. Inheriting means the chain always
runs at whatever tier the Architect chose for the session.

Corollary: economize on the *inputs* to judgment (scouting, drafting,
verification runs), never on the judgment itself.

## 5. Mechanics — where model choice actually attaches

1. **Subagent frontmatter** (`.claude/agents/*.md`): `model: haiku | sonnet |
   opus | fable`, or omit to inherit the session model. This is the primary
   lever and the one this protocol wires.
2. **Agent-tool / Workflow calls**: `agent(prompt, {model, effort})` — same
   aliases. Default is inherit; only override per this ladder. Use
   `effort: "low"` for Scribe-tier mechanical stages, default (`high`) for
   everything else, `xhigh` only for the hardest verify/judge stages.
3. **Skills cannot pin a model.** A skill invocation (the hat-switch
   register-flip of canon-cc-022) runs in-session, at the session model,
   always. Model economy is therefore a *subagent-mode* concern only — another
   reason the artifact test matters: if the work is mechanical and separable,
   it belongs in a (cheap) subagent, not a skill.
4. **Session model** is the Architect's choice (`/model`), outside this
   protocol's scope. The ladder composes with any session model because
   judgment tiers inherit.

## 6. Rules of thumb for un-rostered work

- Formatting, extraction, classification, one-line lookups → Haiku.
- Writing, summarizing, routine coding, most daily work → Sonnet.
- Multi-file builds, architecture, anything that will be *signed* → session
  model (Opus 5 or better).
- Reserve Fable for work that genuinely earns it — and say so explicitly in
  the brief, so the spend is a decision, not a drift.

## 7. Amendment path

Working doctrine pending ratification. Amendments follow the canon-cc-027
signing chain once ratified; until then the Architect may revise directly.
Model IDs and prices in §2–§3 should be re-verified against the live model
catalog whenever Anthropic ships a new family — the tier *structure* is the
durable part, the model names are the perishable part.
