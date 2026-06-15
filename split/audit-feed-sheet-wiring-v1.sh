#!/usr/bin/env bash
# audit-feed-sheet-wiring-v1.sh — feeding-entry structural wiring guard.
# Spec: docs/specs/food-sub-tab-v1-f6-feeding-composer.md (F-6a, ratified
# 2026-06-10), amending docs/specs/food-sub-tab-v1.md §F-2 (ratification #5 —
# hard tap-budget). Updated in the F-6a PR per §Retirements → audit gates.
#
# F-6a extracted the FAB sheet's item-builder into the shared feeding
# composer (_fc*, diet.js) with TWO mounts: the FAB sheet (variant 'sheet')
# and the four Diet→Log cards (variant 'card'). This is a REQUIRED-PRESENCE
# audit: it asserts the wiring enabling the 3-tap-repeat / 6-tap-novel tap
# budgets stays connected across BOTH mounts. If a refactor silently unwires
# the autofill rails or the structured-shape writer, the parent's tap-count
# for the common case explodes and the build fails loud.
#
# Assertions:
#   1. MOUNTS — template carries the four Log-card composer mounts
#      (fc-card-breakfast/lunch/dinner/snack) + the FAB sheet mount
#      (fcSheetMount). Removing any silently kills that surface.
#   2. WRITER CALL — BOTH variants write via _fdWriteStructuredMeal:
#      saveQLFeed (sheet Save) AND _fcCommit (card save-on-action).
#   3. HANDLERS — the composer handlers exist in diet.js:
#      fcApplyRepeat / fcApplyCombo / fcAddItem / fcAdjustQty /
#      fcRemoveItem / fcSkipMeal + the L4 typeahead handler _fcOnTypeahead.
#   4. DISPATCHER — core.js routes each composer action.
#   5. NUTRITION_QTY_DEFAULTS — ≥30 entries (top-used floor).
#   6. CURATED_COMBOS — ≥10 entries spanning all four slots.
#   7. NUTRITION join-integrity (V-K-203) — every qty-default key + every
#      curated-combo item's nutritionRef resolves to a NUTRITION row.
#   8. C1 NO-MATCH ADD-ROW (V-V-210) — the composer's L4 typeahead renders a
#      tappable add-row (data-action="fcAddItem", .fc-dd-add) and the retired
#      "Press Enter to add as new food" copy is ABSENT everywhere.
#   9. NO-PREFILL-ON-PAST-DAYS (V-V-219) — _fcRenderPrefill is gated to today
#      (a dateOf() !== today() early-return).
#  10. NO initFeeding IN CARD COMMIT (F6-1/S1) — the composer's scoped-refresh
#      path must NOT call initFeeding (which would snap a date-navved panel).
#
# Usage:   bash split/audit-feed-sheet-wiring-v1.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - <<'PYEOF'
import re
import sys

FAILS = []

with open('split/template.html') as f:
    template = f.read()
with open('split/intelligence-quicklog.js') as f:
    qlog = f.read()
with open('split/diet.js') as f:
    data_diet = f.read()
with open('split/core.js') as f:
    core = f.read()
with open('split/data.js') as f:
    data = f.read()

# ── 1. Composer mounts ──
if 'id="qlModal-feed"' not in template:
    FAILS.append(('mounts', 'qlModal-feed block not found in template.html'))
required_mounts = ['fcSheetMount', 'fc-card-breakfast', 'fc-card-lunch', 'fc-card-dinner', 'fc-card-snack']
missing = [w for w in required_mounts if 'id="' + w + '"' not in template]
if missing:
    FAILS.append(('mounts', f'missing required composer mount IDs in template: {missing}'))

# ── 2. Writer call — both variants ──
save_match = re.search(r'function saveQLFeed\(\)\s*\{(.*?)^\}', qlog, re.S | re.M)
if not save_match:
    FAILS.append(('writer-call', 'saveQLFeed function not found in intelligence-quicklog.js'))
elif '_fdWriteStructuredMeal' not in save_match.group(1):
    FAILS.append(('writer-call', 'saveQLFeed (sheet Save) does not call _fdWriteStructuredMeal'))
commit_match = re.search(r'function _fcCommit\(inst[^)]*\)\s*\{(.*?)^\}', data_diet, re.S | re.M)
if not commit_match:
    FAILS.append(('writer-call', '_fcCommit function not found in diet.js (card save-on-action writer)'))
elif '_fdWriteStructuredMeal' not in commit_match.group(1):
    FAILS.append(('writer-call', '_fcCommit (card save-on-action) does not call _fdWriteStructuredMeal'))

# ── 3. Handlers ──
required_handlers = [
    'fcApplyRepeat', 'fcApplyCombo', 'fcAddItem', 'fcAdjustQty',
    'fcRemoveItem', 'fcSkipMeal', '_fcOnTypeahead',
]
missing_handlers = [h for h in required_handlers
                    if not re.search(r'function\s+' + re.escape(h) + r'\s*\(', data_diet)]
if missing_handlers:
    FAILS.append(('handlers', f'missing composer handler function(s) in diet.js: {missing_handlers}'))

# ── 4. Dispatcher ──
dispatch_actions = ['fcApplyRepeat', 'fcApplyCombo', 'fcAddItem', 'fcAdjustQty',
                    'fcRemoveItem', 'fcSkipMeal', 'fcTypeaheadInput']
missing_dispatch = [h for h in dispatch_actions
                    if not re.search(r"action\s*===\s*['\"]" + re.escape(h) + r"['\"]", core)]
if missing_dispatch:
    FAILS.append(('dispatcher', f'core.js dispatcher missing route(s) for: {missing_dispatch}'))

# ── 5. NUTRITION_QTY_DEFAULTS count ──
qty_block = re.search(r'window\.NUTRITION_QTY_DEFAULTS\s*=\s*\{(.*?)^\};', data, re.S | re.M)
if not qty_block:
    FAILS.append(('nutrition-qty-defaults', 'NUTRITION_QTY_DEFAULTS registry not found in data.js'))
else:
    entry_count = len(re.findall(r"^\s*'[^']+':\s*\{", qty_block.group(1), re.M))
    if entry_count < 30:
        FAILS.append(('nutrition-qty-defaults', f'NUTRITION_QTY_DEFAULTS has {entry_count} entries (floor: 30)'))

# ── 6. CURATED_COMBOS count + slot coverage ──
combos_block = re.search(r'window\.CURATED_COMBOS\s*=\s*\[(.*?)\];', data, re.S)
if not combos_block:
    FAILS.append(('curated-combos', 'CURATED_COMBOS registry not found in data.js'))
else:
    combos_text = combos_block.group(1)
    combo_count = len(re.findall(r"slot:\s*'[^']+'", combos_text))
    if combo_count < 10:
        FAILS.append(('curated-combos', f'CURATED_COMBOS has {combo_count} entries (floor: 10)'))
    slots_in_combos = set(re.findall(r"slot:\s*'([^']+)'", combos_text))
    missing_slots = {'breakfast', 'lunch', 'dinner', 'snack'} - slots_in_combos
    if missing_slots:
        FAILS.append(('curated-combos', f'CURATED_COMBOS missing slot coverage for: {sorted(missing_slots)}'))

# ── 7. NUTRITION join-integrity (V-K-203) ──
nutr_block = re.search(r'const NUTRITION\s*=\s*\{(.*?)^\};', data, re.S | re.M)
if not nutr_block:
    FAILS.append(('nutrition-join', 'NUTRITION knowledge base not found in data.js'))
else:
    nutr_keys = set(re.findall(r"^\s+'([^']+)'\s*:\s*\{", nutr_block.group(1), re.M))
    def _nutrition_ref(name):
        base = re.sub(r"\s*\([^)]*\)\s*", "", name.lower()).strip()
        if base in nutr_keys:
            return base
        stem = re.sub(r"\s+", " ", re.sub(r"\b(porridge|mash|puree|pure|sauce|roti|chapati|paratha)\b", "", base)).strip()
        if stem and stem != base and stem in nutr_keys:
            return stem
        return base
    if qty_block:
        qty_keys = re.findall(r"^\s*'([^']+)'\s*:\s*\{", qty_block.group(1), re.M)
        orphan_qty = [k for k in qty_keys if k not in nutr_keys]
        if orphan_qty:
            FAILS.append(('nutrition-join', f'NUTRITION_QTY_DEFAULTS keys with no NUTRITION row: {orphan_qty}'))
    if combos_block:
        combo_items = []
        for grp in re.findall(r"items:\s*\[([^\]]*)\]", combos_block.group(1)):
            combo_items += re.findall(r"'([^']+)'", grp)
        orphan_combo = sorted({it for it in set(combo_items) if _nutrition_ref(it) not in nutr_keys})
        if orphan_combo:
            FAILS.append(('nutrition-join', f'CURATED_COMBOS items whose nutritionRef misses NUTRITION: {orphan_combo}'))

# ── 8. C1 no-match add-row (V-V-210) ──
ta_match = re.search(r'function _fcOnTypeahead\([^)]*\)\s*\{(.*?)^\}', data_diet, re.S | re.M)
if not ta_match:
    FAILS.append(('c1-add-row', '_fcOnTypeahead not found — cannot verify the C1 no-match add-row'))
else:
    body = ta_match.group(1)
    if 'fc-dd-add' not in body or 'fcAddItem' not in body:
        FAILS.append(('c1-add-row', 'L4 typeahead no-match branch lacks the C1 tappable add-row (.fc-dd-add / fcAddItem)'))
# retired false affordance must be gone everywhere
for fn, txt in (('intelligence-quicklog.js', qlog), ('diet.js', data_diet), ('template.html', template)):
    if 'Press Enter to add as new food' in txt:
        FAILS.append(('c1-add-row', f'retired "Press Enter to add as new food" copy still present in {fn}'))

# ── 9. No prefill on past days (V-V-219) ──
prefill_match = re.search(r'function _fcRenderPrefill\(inst\)\s*\{(.*?)^\}', data_diet, re.S | re.M)
if not prefill_match:
    FAILS.append(('no-prefill-past', '_fcRenderPrefill not found — cannot verify the today-only gate'))
elif "inst.dateOf() !== today()" not in prefill_match.group(1):
    FAILS.append(('no-prefill-past', '_fcRenderPrefill is not structurally gated to today (no dateOf() !== today() return)'))

# ── 10. No initFeeding in the card commit / scoped-refresh path (F6-1/S1) ──
scoped_match = re.search(r'function _fcScopedRefresh\(inst\)\s*\{(.*?)^\}', data_diet, re.S | re.M)
if not scoped_match:
    FAILS.append(('no-initfeeding', '_fcScopedRefresh not found — cannot verify the S1 no-initFeeding contract'))
elif 'initFeeding' in scoped_match.group(1):
    FAILS.append(('no-initfeeding', '_fcScopedRefresh calls initFeeding — S1/F6-1 violation (would snap a date-navved panel back to today)'))
if commit_match and 'initFeeding' in commit_match.group(1):
    FAILS.append(('no-initfeeding', '_fcCommit calls initFeeding — S1/F6-1 violation'))

# ── Report ──
if not FAILS:
    print('audit-feed-sheet-wiring-v1: PASS (5 mounts + 2-variant writer + 7 handlers + 7 dispatchers + 30+ qty defaults + 10+ curated combos + NUTRITION join + C1 add-row + no-prefill-past + no-initFeeding-in-commit)')
    sys.exit(0)

print(f'audit-feed-sheet-wiring-v1: FAIL ({len(FAILS)} structural assertion(s) failed)')
for axis, msg in FAILS:
    print(f'  [{axis}] {msg}')
print()
print('Resolution:')
print('  • mounts          — restore the 4 Log-card mounts (fc-card-*) + fcSheetMount in template.html')
print('  • writer-call     — saveQLFeed AND _fcCommit must call _fdWriteStructuredMeal')
print('  • handlers        — restore the fc* composer handlers + _fcOnTypeahead in diet.js')
print('  • dispatcher      — wire each fc* action in core.js click delegation')
print('  • nutrition-qty-defaults — keep ≥30 explicit per-food qty entries')
print('  • curated-combos  — keep ≥10 entries with all 4 slots represented')
print('  • nutrition-join  — every qty-default key + curated-combo nutritionRef must resolve to NUTRITION')
print('  • c1-add-row      — keep the C1 no-match add-row; the "Press Enter" copy must stay retired (V-V-210)')
print('  • no-prefill-past — _fcRenderPrefill must early-return on past days (V-V-219)')
print('  • no-initfeeding  — the card commit/scoped-refresh path must never call initFeeding (F6-1/S1)')
print()
print('Spec: docs/specs/food-sub-tab-v1-f6-feeding-composer.md (F-6a)')
sys.exit(1)
PYEOF
