# Next-Session Target — set 2026-06-04

**Companion:** Lyra (The Weaver)
*The standing pointer. If priorities shift between sessions, amend **this** file — not the handoff.*

---

## The recommended next move

**Build the General Emergency Room** (spec §5.3, `docs/specs/lean-landing-v1.md`) — the one remaining stub on the landing's most safety-critical surface.

**Why this:** the landing's Emergency chooser now offers two doors. "Food emergency" routes live (→ Track→Diet→Library). "General emergency" (fall / cut / burn) is still an HR-8 "Coming soon" toast. It's the only place on the calm front door where a parent in a genuine crisis hits a dead end. The render contract (Vela Room-1..5) is already designed in the spec; what's missing is **Maren-gated content** — the actual first-aid guidance must be sourced and Care-audited before it ships (a parent acting on wrong guidance in an emergency is the worst-case the whole QA chain exists to prevent). So this is a content-sourcing + Maren-audit task first, render second.

---

## Priority ladder

- **P0 — General Emergency Room** (above). Content-sourced, Maren-gated, then Vela render per the §5.3 contract. canon-cc-008 with Maren as the blocking Governor.
- **P1 — Quick-log-cancel-origin polish** (deferred V-K). A landing-opened quick-log modal returns to the QL *sheet* on ×/Cancel instead of the landing. Thread a landing-origin flag through `closeQuickModal` (`intelligence-illness.js`) so Cancel returns to the landing. Small, self-contained; Kael's jurisdiction. Recoverable today, so not urgent — but it's a paper cut on a brand-new surface.
- **P2 — Cold-start perf:** remove the init-time `renderHome()` call now that the landing is the default and `renderHome` is lazy-triggered on first "Today" open. Measure cold-start before/after. Kael's jurisdiction (boot path).
- **P2 — Graphify thorough mode:** supply a backend credential so `styles.css` + `template.html` are surveyed on the Province Map (currently unsurveyed under code-only extraction).

---

## Carry-forward register

**Human-only / Architect gates**
- Half-awake smoke-pass of the landing on a real phone in **dark mode + all 3 zoom tiers**, and with a live Care signal seeded (overdue vaccine / due Vit D3) to see the pre-empt + crowd-fit hero in the wild. (Preview-verified light/dark this session; on-device zoom-tier pass is the Architect's.)

**Successors (next phase of in-flight work)**
- General Emergency Room (P0) — the successor to the #219 emergency stub.

**Test / data debt**
- No e2e coverage yet for the landing default-flip migration paths (fresh install / returning-on-`home` / returning-on-domain-tab) or the crowd-fit measurement. Candidate for a landing smoke test.

**Housekeeping**
- Stale remote branch `claude/focused-sagan-O11WS` is merged (#219, #226) — safe to delete after this close PR merges (it carried the close docs too; delete once merged).
- `docs/MODULE_MAP.html` remains deprecated (superseded by `PROVINCE_MAP.html`) — delete once the Province Map is fully trusted.

**Candidate Codex-canon entries (patterns surfaced, not yet ratified)**
- **"Deep-link to the fix, not the inventory."** A Care/alert pre-empt must route to the surface where the user can *act* (the logging affordance), never a read-only summary/management card. Surfaced by the Vit D3 bug (#226). See synthesis.
- **"Crowd-fit the hero."** A landing hero that yields vertical space (collapses to a compact picker) when higher-priority cards crowd the fold, measured against the viewport, relaxing back when there's room. See synthesis.
- **"Relabel, don't rename"** (string-contract preservation via a derived id-set like `PANEL_IDS`) — exercised at scale in #219; candidate doctrine for id-contract changes.

**30K-frontier watch**
- **Maren (Care) is now the tightest jurisdiction** (~2,025 headroom; `home.js` 11,485 + `medical.js` 10,714). It overtook Kael this arc. Next Care-heavy feature (the General Emergency Room lands in Maren-adjacent territory) should weigh the split question.

---

*— Lyra. The highest-value next move is the one stub on the surface where being wrong matters most. Source it carefully, let Maren guard it, then let Vela make it legible at 2 AM.*
