# Memory.md
**Scope:** Persistent institutional knowledge across all repos
**Owner:** The Consul (cross-repo overseer)
**Updated:** 15 April 2026

---

## The Architect

**Rishabh Jain**, age 33, based in Jharkhand, India.
CA by background. Business Manager at Soma Electro Products (zinc electroplating). Creative Head for AdapTea (green tea brand). Solo PWA developer.

### Personal
- Has a young daughter whose development is tracked in SproutLab.
- Interests: cosmology (Kardashev scales, astrobiology), physics documentaries, sci-fi, data visualization, 3D modeling, YouTube content creation.
- Follows Indian stock markets. Uses 6% inflation assumption in financial planning.
- Location holidays: Jharkhand state + national Indian holidays.

### Professional Expertise
- Industrial manufacturing: hot-dip galvanizing, zinc electroplating, trivalent passivation
- Cyanide zinc plating setup with trivalent blue passivation (Growel 1728)
- Long-term: chip/ATMP manufacturing plant (East Singhbhum), PCB assembly startup

## Project Status Snapshot

### Codex (Active)
- Phase 5 complete: Chapter Detail View + Apocrypha + Schisms rename
- Phase 4 content backfill pending (6 chapters via Aurelius snippets)
- Snippet pipeline bugs identified, specced across 6 files, not yet written
- RPG Design Dissertation v1.0 produced (57 pages, seed document)

### SproutLab (Active)
- CareTickets Phase D complete and deployed
- Device Sync operational (Firebase Auth + Firestore)
- ISL + Smart Q&A + UIB all operational
- Next: Device sync refinements, then new features per roadmap

### SEP Invoicing (Active)
- Phase 8D complete: IM desktop table + detail panel
- Gate Challan module architected but not built
- Phase 4+ scope: invoice preview/print refinements
- SEP constitutional restructuring (effective 1 Apr 2026) largely complete

### BusinessAI Simulation (Queued)
- Multi-entity business spanning trading, industry, logistics
- First meeting: informal discussion to set agendas
- Claude addressed as "BAI" in these sessions

## Architectural Decisions Log

### Canon Highlights (cross-repo)
| Canon | Scope | Decision |
|-------|-------|----------|
| 0033 | codex | build.sh outputs directly to files, no stdout redirect |
| 0034 | global | SWs never cache HTML — prevents chicken-and-egg loop |
| HR-1→12 | sproutlab | 12 hard rules, originated in SproutLab, inform all repos |
| Billing vs Logistics | sep | IM (billing spine) and GC (logistics spine) are parallel, not sequential |

### Methodology Decisions
- **8-pass SPEC_ITERATION_PROCESS** originated from Today So Far spec (35 issues found across 8 iterations). Now applied to all complex features.
- **Split-file architecture** adopted after SproutLab monolith hit ~2MB. Migration M1–M3 pain documented; all new repos start split.
- **Aurelius snippet format** is the canonical content import mechanism. Core principle: minimal manual input.
- **QA multi-round** continues until only cosmetic bugs remain. Caught 8 critical bugs pre-build in CareTickets spec alone.

## Companion Registry (Quick Reference)

| Name | Role | Archetype | Repo |
|------|------|-----------|------|
| Aurelius | Builder | The Chronicler | Codex |
| Lyra | Builder | The Weaver | SproutLab |
| Solara | Builder | The Strategist | SEP Invoicing |
| Cipher | Censor (QA) | The Codewright | All repos |
| The Consul | Overseer | Meta-companion | Cross-repo |

## Session Patterns

- **Work environment:** Termux on Android, Claude.ai chat, Claude Code (local + web)
- **File transfer:** mv from ~/storage/downloads/ to split/
- **Build verification:** Check timestamps of root/index.html after every build
- **Git:** Always --no-pager, descriptive commits, never force push
- **Session rhythm:** Spec → Build → QA rounds → Handoff doc → Deploy
