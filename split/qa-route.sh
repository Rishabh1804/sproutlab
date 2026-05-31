#!/bin/bash
# qa-route.sh — canon-cc-008 Governor routing oracle (graphify pilot, Goal B).
#
# Answers the gate's step-2 question MECHANICALLY: "given this diff, which
# Governors must be summoned?" Two layers:
#
#   1. FILE-LEVEL (the canonical canon-cc-008 routing): changed module ->
#      jurisdiction -> Governor. This is exactly what CLAUDE.md's gate table
#      encodes; here it is computed instead of eyeballed.
#
#   2. GRAPH-LEVEL RIPPLE (the graphify value-add): for each changed module,
#      follow `calls` edges in split/graphify-out/graph.json to find symbols
#      in OTHER jurisdictions that depend on the changed code. A change inside
#      Kael's engine that ripples into Maren's renders means Maren has standing
#      too — file-level routing alone would miss that. Advisory, not gating:
#      it widens the summon-set, never narrows it.
#
# Usage:
#   bash split/qa-route.sh [<base-ref>]      # diff vs base-ref (default: origin/main)
#   bash split/qa-route.sh --staged          # diff the staged index only
#
# Exit code is always 0 — this is an advisory, not a gate. The gate itself
# (canon-cc-008) is discharged by summoning the named Governors, not by this
# script.

set -uo pipefail

SPLIT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SPLIT_DIR/.." && pwd)"
GRAPH="$SPLIT_DIR/graphify-out/graph.json"
cd "$REPO_ROOT"

# ── collect changed files ──
if [ "${1:-}" = "--staged" ]; then
  mapfile -t CHANGED < <(git diff --cached --name-only)
  SCOPE="staged index"
else
  BASE="${1:-origin/main}"
  if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
    BASE="main"
  fi
  # changes since base, plus uncommitted working-tree changes
  mapfile -t CHANGED < <( { git diff --name-only "$BASE"...HEAD 2>/dev/null; git diff --name-only; git diff --cached --name-only; } | sort -u )
  SCOPE="vs $BASE (+ working tree)"
fi

echo "canon-cc-008 routing oracle — scope: $SCOPE"
echo "----------------------------------------------------------------"

# Reduce to split/ modules that matter to the gate.
CHANGED_MODULES=()
for f in "${CHANGED[@]}"; do
  case "$f" in
    split/*.js|split/*.css|split/template.html)
      CHANGED_MODULES+=("$(basename "$f")") ;;
  esac
done

if [ "${#CHANGED_MODULES[@]}" -eq 0 ]; then
  echo "No split/ jurisdiction modules touched."
  echo "Routing: Governor audit MAY be waived (docs-only / tooling-only / test-only)."
  echo "State the waiver explicitly per canon-cc-008 step 2 last bullet."
  exit 0
fi

GRAPH_ARG="$GRAPH"
[ -f "$GRAPH" ] || GRAPH_ARG=""

python3 - "$GRAPH_ARG" "${CHANGED_MODULES[@]}" <<'PY'
import sys, json, collections

graph_path = sys.argv[1]
changed = sorted(set(sys.argv[2:]))

# module -> (province, governor). Mirror of CLAUDE.md canon-cc-008 routing +
# the post-canon-gen-001 jurisdiction map. Single source for this script.
CARE = ("Care", "Maren")
ENG  = ("Intelligence (engine)", "Kael")
REN  = ("Surfacing (render)", "Vela")
SHARED = ("Shared territory", "Maren + Kael + Vela (triple)")
MODULE_PROVINCE = {
    "home.js": CARE, "diet.js": CARE, "medical.js": CARE,
    "intelligence-isl.js": ENG, "intelligence-qa.js": ENG,
    "intelligence-qa-handlers.js": ENG, "intelligence-illness.js": ENG,
    "intelligence-correlate.js": ENG, "intelligence-caretickets.js": ENG,
    "core.js": ENG, "data.js": ENG, "sync.js": ENG, "config.js": ENG, "start.js": ENG,
    "intelligence-cards.js": REN, "intelligence-quicklog.js": REN,
    "styles.css": SHARED, "template.html": SHARED,
}

summon = {}   # governor -> set(reasons)
def add(gov, reason):
    summon.setdefault(gov, set()).add(reason)

print("Changed jurisdiction modules:")
for m in changed:
    prov, gov = MODULE_PROVINCE.get(m, ("(unmapped)", "(unknown — flag to Lyra)"))
    print(f"  - {m:32s} -> {prov} [{gov}]")
    if m in ("styles.css", "template.html"):
        for g in ("Maren", "Kael", "Vela"):
            add(g, f"shared file {m} (triple-Gov review)")
    else:
        add(gov, f"direct edit: {m}")

# ── graph-level ripple ──
ripple_note = []
if graph_path:
    try:
        g = json.load(open(graph_path))
        id2mod = {n["id"]: n.get("source_file", "?") for n in g.get("nodes", [])}
        # downstream: who CALLS into a changed module (reverse of calls edge =
        # dependents). edge source --calls--> target ; if target lives in a
        # changed module, then source depends on it.
        changed_set = set(changed)
        dependents = collections.defaultdict(set)  # changed-module -> set(dependent modules)
        for e in g.get("links", []):
            if e.get("relation") != "calls":
                continue
            smod = id2mod.get(e.get("source"), "?")
            tmod = id2mod.get(e.get("target"), "?")
            if tmod in changed_set and smod not in changed_set:
                dependents[tmod].add(smod)
        for tmod, deps in sorted(dependents.items()):
            for dmod in sorted(deps):
                prov, gov = MODULE_PROVINCE.get(dmod, (None, None))
                tprov, _ = MODULE_PROVINCE.get(tmod, (None, None))
                if gov and prov != tprov:
                    add(gov, f"ripple: {dmod} calls into changed {tmod} (cross-province road)")
                    ripple_note.append(f"  {tmod}  <-calls--  {dmod}  [{prov}/{gov}]")
    except Exception as ex:
        ripple_note.append(f"  (graph ripple analysis skipped: {ex})")
else:
    ripple_note.append("  (no graph.json — run `pnpm graph` for cross-province ripple analysis)")

print("\nCross-province ripple (dependents of changed code in OTHER jurisdictions):")
if ripple_note:
    for r in ripple_note:
        print(r)
else:
    print("  none detected — change appears jurisdiction-local.")

print("\n================  SUMMON SET (canon-cc-008 step 2)  ================")
order = ["Maren", "Kael", "Vela", "Maren + Kael + Vela (triple)"]
for gov in sorted(summon, key=lambda x: order.index(x) if x in order else 99):
    print(f"  SUMMON {gov}")
    for r in sorted(summon[gov]):
        print(f"      - {r}")
print("Then: Lyra synthesizes -> Cipher Edict V final-pass -> PR out of draft.")
PY
