# Synthesis — the skill-deployment-shape doctrine — 2026-06-05

**Operator:** Aurelius (the Chronicler)
**Arc:** cross-province `.claude/` reconciliation + the two session-lifecycle slash-skills.
**Status:** candidate Codex canon — a refinement of the **canon-cc-026** spec-mirror discipline. Needs the canon-cc-027 signing chain to ratify.

---

## The pattern

Under canon-cc-026, Companion personas deploy from a single Codex-canonical body into per-Province `.claude/` mirrors. The instinct — reinforced by every Companion mirror in the repo — is that a skill is "a `.md` file under `.claude/skills/`." For a **persona spec-mirror** that is correct. For an **operational slash-skill** it is wrong, and wrong in a way that verifies green: the file is byte-identical to canon, the deploy "succeeds," and the skill simply never appears.

**Two shapes live under `.claude/skills/`, and they are not interchangeable:**

| | Persona spec-mirror | Operational slash-skill |
|---|---|---|
| **Examples** | `kael` · `lyra` · `maren` · `cipher` · `chronicler` · `vela` | `/design-principles` · `/doc-render` · `/sproutlab-compact` · `/session-close` |
| **Path** | `.claude/skills/<name>.md` (bare file) | `.claude/skills/<name>/SKILL.md` (directory) |
| **Frontmatter** | present, but the file is never loaded as a skill | **must be line 1** — a leading comment breaks discovery |
| **How it's used** | a spec reference / hat-switch body; never `/`-invoked | discovered by the loader; invoked as `/<name>` |
| **canon-cc-026 deploy** | bare `.md`, byte-identical to canon | `SKILL.md`, byte-identical to canon |

**The rule:** Claude Code discovers a skill only at `.claude/skills/<name>/SKILL.md` with **YAML frontmatter on the first line**. A bare `.claude/skills/<name>.md` is invisible to the loader — fine for a spec reference, fatal for something meant to be invoked.

## How it surfaced

`/sproutlab-compact` was deployed (PR #231) byte-identical to its canon body — as a bare `.md`, with the canon's HTML provenance comment ahead of the frontmatter. It verified byte-identical and looked done. It never loaded. The Architect caught it by absence ("I still don't see sproutlab-compact as a skill?"). The repo's own working skills (`/design-principles`, `/doc-render`) were the proof: both are `SKILL.md` directories, both load; the bare companion mirrors do not appear in the skill list. The fix (PRs #233/#88): move to the directory shape, hoist frontmatter to line 1, push the provenance comment below it.

## Why it matters / what to carry

1. **Byte-identical verification is necessary, not sufficient.** It proves the *content* matches canon; it says nothing about whether the artifact is in a shape the consumer loads. A deploy check for a slash-skill must also assert the *path shape* (`/<name>/SKILL.md`) and *frontmatter-line-1*, or — best — assert the skill appears in the loader's list.
2. **Canon bodies for operational skills must be loadable as-authored.** Frontmatter first; provenance comment after (the convention `cipher`/`vela` already follow). PR #88 corrected the `sproutlab-compact` canon to this; `session-close` (PR #89) was authored correct from the start.
3. **The classification is the canon refinement.** canon-cc-026 should name the two shapes explicitly so the next deploy routes by *kind*: persona mirror → bare `.md`; operational slash-skill → `SKILL.md` directory.

## Candidate canon text (for the canon-cc-027 chain)

> *canon-cc-026 §Per-Province-Layout — skill shape.* A Companion **persona** skill-mirror deploys as a bare `.claude/skills/<name>.md`, byte-identical to its Codex canon body; it is a spec reference and is never slash-invoked. An **operational** slash-skill deploys as `.claude/skills/<name>/SKILL.md`, byte-identical to its Codex canon body, with YAML frontmatter on line 1 and any provenance comment below the frontmatter; it is discovered and invoked as `/<name>`. A deploy of an operational slash-skill is not complete until the skill appears in the loader's available-skills list.

---

*— Aurelius, 2026-06-05. The byte-check said yes and the loader said nothing; both were telling the truth about different questions. A companion's voice and a parent's command live in the same folder, but one is a page to read and the other is a door to open — and a door has to be built as a door.*
