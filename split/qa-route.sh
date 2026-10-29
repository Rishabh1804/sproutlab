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
#   3. REFERENCE CONSULT (D4, 2026-10-29): registries and constants in the
#      foundation files (AGE_RULES, FOOD_EFFECTS, ALLERGENS, KEYS, SYNC_KEYS,
#      SYNC_RENDER_DEPS…) are read by NAME, never called, so the graph has no
#      edge to them. For each top-level name a foundation hunk touches, every
#      other Governor whose files reference it is added as a scoped consult —
#      "primary by file, consult by consumer". Also advisory, also widen-only.
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
  DIFF_MODE="staged"
else
  BASE="${1:-origin/main}"
  if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
    BASE="main"
  fi
  # changes since base, plus uncommitted working-tree changes
  mapfile -t CHANGED < <( { git diff --name-only "$BASE"...HEAD 2>/dev/null; git diff --name-only; git diff --cached --name-only; } | sort -u )
  SCOPE="vs $BASE (+ working tree)"
  DIFF_MODE="$BASE"
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

python3 - "$GRAPH_ARG" "$DIFF_MODE" "${CHANGED_MODULES[@]}" <<'PY'
import sys, json, collections, re, subprocess, glob, os

graph_path = sys.argv[1]
diff_mode = sys.argv[2]
changed = sorted(set(sys.argv[3:]))

# module -> (province, governor). Mirror of CLAUDE.md canon-cc-008 routing +
# the post-canon-gen-001 jurisdiction map. Single source for this script.
CARE = ("Care", "Maren")
NUTR = ("Nutrition", "Ceres")
ENG  = ("Intelligence (engine)", "Kael")
REN  = ("Surfacing (render)", "Vela")
FND  = ("Foundation (data & sync)", "Carina")
SHARED = ("Shared territory", "Maren + Ceres + Vela (core trio; Kael / Carina conditional)")
# Single roster: every fail-safe widen loop and the print order read this, so
# no Governor list is ever hand-copied (D4).
GOVERNORS = ("Maren", "Ceres", "Kael", "Vela", "Carina")
SHARED_TRIO = ("Maren", "Ceres", "Vela")
MODULE_PROVINCE = {
    "home.js": CARE, "medical.js": CARE,
    "diet.js": NUTR, "recipes.js": NUTR,
    "intelligence-isl.js": ENG, "intelligence-qa.js": ENG,
    "intelligence-qa-handlers.js": ENG, "intelligence-illness.js": ENG,
    "intelligence-correlate.js": ENG, "intelligence-caretickets.js": ENG,
    "core.js": FND, "data.js": FND, "sync.js": FND, "config.js": FND, "start.js": FND,
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
        # Option C (D4): the render-heavy trio always reviews; Kael and Carina
        # join when this diff also touches their Region (direct edit or ripple,
        # computed below) — Carina also on any sprite <symbol> change.
        for g in SHARED_TRIO:
            add(g, f"shared file {m} (core-trio review)")
    else:
        add(gov, f"direct edit: {m}")

def file_diff(path):
    """-U0 diff of one file in the same scope as the changed-file list."""
    cmds = ([["git", "diff", "--cached", "-U0", "--", path]] if diff_mode == "staged" else
            [["git", "diff", "-U0", f"{diff_mode}...HEAD", "--", path], ["git", "diff", "-U0", "--", path],
             ["git", "diff", "--cached", "-U0", "--", path]])
    out = []
    for c in cmds:
        try:
            out.append(subprocess.run(c, capture_output=True, text=True).stdout)
        except Exception:
            pass
    return "\n".join(out)

# Carina joins a template.html review when the zi()/zif sprite changes.
if "template.html" in changed and re.search(r"^[+-].*</?symbol\b", file_diff("split/template.html"), re.M):
    add("Carina", "shared file template.html: zi()/zif sprite <symbol> changed (sprite integrity)")

# ── graph-level ripple ──
ripple_note = []
if graph_path:
    try:
        g = json.load(open(graph_path))
        # Normalize source_file to a split/-relative module name. The prefix follows the directory
        # graphify runs from (repo root -> "split/core.js"), not its version. Unnormalized, no ripple
        # edge ever matched `changed` and the oracle SILENTLY reported "jurisdiction-local"
        # (2026-09-24 regression) — the under-summon class.
        # Same rule as build-province-map.mjs modName (V-K-266-12).
        def modname(f):
            f = str(f or "?").replace("\\", "/")
            if "/split/" in f:
                return f.rsplit("/split/", 1)[1]
            while f.startswith("./"):
                f = f[2:]
            return f[len("split/"):] if f.startswith("split/") else f
        id2mod = {n["id"]: modname(n.get("source_file")) for n in g.get("nodes", [])}
        # Direction invariant (V-K-G2): the graph is undirected (directed:false); the
        # ripple below assumes edge source=caller, target=callee. networkx does not
        # guarantee endpoint stability on undirected graphs across graphify versions.
        # If that convention ever flips, the ripple inverts and SILENTLY UNDER-SUMMONS
        # a Governor — a canon-cc-008 short-circuit in advisory clothing. Fail-loud +
        # fail-safe: known leaf utilities are callees only and MUST have zero outgoing
        # `calls`. If that breaks, widen to ALL Governors rather than trust the ripple.
        id2label = {n["id"]: (n.get("label") or n.get("norm_label") or "") for n in g.get("nodes", [])}
        LEAVES = {"escHtml", "zi", "escAttr"}
        out_calls = collections.Counter()
        for e in g.get("links", []):
            if e.get("relation") == "calls":
                out_calls[id2label.get(e.get("source"), "")] += 1
        if any(out_calls.get(lf, 0) > 0 for lf in LEAVES):
            ripple_note.append("  !! DIRECTION INVARIANT BROKEN (V-K-G2): a known leaf has outgoing calls;")
            ripple_note.append("     ripple may be inverted. FAIL-SAFE: summoning ALL Governors.")
            for gname in GOVERNORS:
                add(gname, "fail-safe: graph edge-direction invariant broken (V-K-G2)")
        # Resolution invariant: the modules are script-globals that call each other
        # constantly, so zero cross-file calls means the extractor stopped resolving
        # them (graphifyy 0.9.7+), and every ripple below would read "none". Same
        # fail-safe as V-K-G2: widen to ALL Governors rather than trust silence.
        calls = [e for e in g.get("links", []) if e.get("relation") == "calls"]
        xfile = sum(1 for e in calls if id2mod.get(e.get("source")) != id2mod.get(e.get("target")))
        # Baseline 2026-09-24: 4,296 calls / 2,286 cross-file (53%). Mirrors build-province-map.mjs.
        if len(calls) < 500 or xfile / max(1, len(calls)) < 0.15:
            ripple_note.append(f"  !! CROSS-FILE RESOLUTION BROKEN: {len(calls)} calls edges, {xfile} cross-file;")
            ripple_note.append("     ripple is blind (pin graphifyy==0.9.6). FAIL-SAFE: summoning ALL Governors.")
            for gname in GOVERNORS:
                add(gname, "fail-safe: graph cross-file call resolution broken")
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

# ── reference consult (D4): names a foundation hunk touches, read elsewhere ──
consult_note = []
DECL = re.compile(r"(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)")
for m in changed:
    if MODULE_PROVINCE.get(m) != FND:
        continue
    names = set()
    for line in file_diff(f"split/{m}").splitlines():
        if line.startswith("@@"):
            hd = DECL.search(line.split("@@")[-1])      # enclosing top-level declaration
            if hd: names.add(hd.group(1))
        elif line[:1] in "+-" and not line.startswith(("+++", "---")):
            hd = DECL.match(line[1:].lstrip())
            if hd: names.add(hd.group(1))
    names = {n for n in names if len(n) >= 4}
    # SYNC_RENDER_DEPS names renderers as strings ('renderDietStats'): a changed
    # row arms a re-render in the Region that DEFINES that function.
    targets = set()
    for line in file_diff(f"split/{m}").splitlines():
        if line[:1] in "+-" and not line.startswith(("+++", "---")):
            targets.update(re.findall(r"['\"]((?:render|draw)[A-Za-z0-9_]+)['\"]", line))
    for t in sorted(targets):
        for other in sorted(glob.glob("split/*.js")):
            om = os.path.basename(other)
            prov, gov = MODULE_PROVINCE.get(om, (None, None))
            if not gov or MODULE_PROVINCE.get(om) == FND:
                continue
            try:
                if re.search(r"function\s+" + re.escape(t) + r"\s*\(", open(other, encoding="utf-8").read()):
                    add(gov, f"consult: {m} names renderer {t} defined in {om}")
                    consult_note.append(f"  {m}:'{t}'  --renders-->  {om}  [{prov}/{gov}]")
            except Exception:
                pass
    for other in sorted(glob.glob("split/*.js")):
        om = os.path.basename(other)
        prov, gov = MODULE_PROVINCE.get(om, (None, None))
        if not gov or MODULE_PROVINCE.get(om) == FND:
            continue
        try:
            text = open(other, encoding="utf-8").read()
        except Exception:
            continue
        for n in sorted(names):
            if re.search(r"(?<![\w$])" + re.escape(n) + r"(?![\w$])", text):
                add(gov, f"consult: {om} reads {n} (reference ripple from {m})")
                consult_note.append(f"  {m}:{n}  <-reads--  {om}  [{prov}/{gov}]")

# Care-content in the foundation (V-M-275-2): records whose CONTENT is parent-facing
# care guidance always summon Maren on consequence, even when only a render or
# engine file reads them (GENERAL_EMERGENCIES is read only by cards.js).
CARE_CONTENT = re.compile(r"^(GENERAL_EMERGENCIES|VACC_\w+|SAFE_POOP_COLORS|POOP_COLOR\w*|medDoseSlots|vitDSupplement|getNextUpcomingVacc|calcMedicalScore)$")
for m in changed:
    if MODULE_PROVINCE.get(m) != FND:
        continue
    for line in file_diff(f"split/{m}").splitlines():
        hd = None
        if line.startswith("@@"):
            hd = DECL.search(line.split("@@")[-1])
        elif line[:1] in "+-" and not line.startswith(("+++", "---")):
            hd = DECL.match(line[1:].lstrip())
        if hd and CARE_CONTENT.match(hd.group(1)):
            add("Maren", f"consult: care-content {hd.group(1)} in {m} (care consequence)")
            consult_note.append(f"  {m}:{hd.group(1)}  care-content  [Care/Maren]")

print("\nCross-province ripple (dependents of changed code in OTHER jurisdictions):")
if ripple_note:
    for r in ripple_note:
        print(r)
else:
    print("  none detected — change appears jurisdiction-local.")

print("\nReference consult (foundation registries/constants read in OTHER jurisdictions):")
if consult_note:
    for r in consult_note:
        print(r)
else:
    print("  none — no foundation hunk, or its names are not read elsewhere.")

print("\n================  SUMMON SET (canon-cc-008 step 2)  ================")
order = list(GOVERNORS)
for gov in sorted(summon, key=lambda x: order.index(x) if x in order else 99):
    print(f"  SUMMON {gov}")
    for r in sorted(summon[gov]):
        print(f"      - {r}")
print("Then: Lyra synthesizes -> Cipher Edict V final-pass -> PR out of draft.")
PY
