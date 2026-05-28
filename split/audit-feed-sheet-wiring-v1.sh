#!/usr/bin/env bash
# audit-feed-sheet-wiring-v1.sh — F-2 structural wiring guard.
# Spec: docs/specs/food-sub-tab-v1.md §F-2 (ratification #5 — hard tap-budget).
#
# Unlike the banned-pattern audits (chip taxonomy, card priority, activity
# categories, no-personalised-prediction), this is a REQUIRED-PRESENCE
# audit: it asserts that the wiring enabling the 3-tap-repeat / 4-tap-
# combo / 6-tap-novel tap budgets stays connected. If a refactor silently
# unwires the autofill rails or the structured-shape writer, the parent's
# tap-count for the common case explodes from 4 → 12+ and the build fails
# loud rather than shipping a regression.
#
# Six structural assertions:
#
#   1. TEMPLATE WRAPS — qlModal-feed contains the four F-2 wrap IDs
#      (qlFeedRepeatWrap / qlFeedCombosWrap / qlFeedItemsWrap /
#      qlFeedNextWrap). Removing any silently kills its rail surface.
#
#   2. WRITER CALL — saveQLFeed routes through _fdWriteStructuredMeal.
#      A regression that reverts to direct day[meal] = string writes
#      loses qty/unit/sourceFlow on disk + breaks F-3 review surface.
#
#   3. HANDLERS — the seven F-2 handlers exist:
#      qlFeedApplyRepeat / qlFeedApplyCombo / qlFeedAddItem /
#      qlFeedAdjustQty / qlFeedRemoveItem / qlFeedSkipMeal /
#      qlFeedTypeaheadInput.
#
#   4. DISPATCHER — core.js routes each of the 7 actions. Missing
#      dispatcher line = tappable element is dead.
#
#   5. NUTRITION_QTY_DEFAULTS — ≥30 entries (the top-used floor per
#      ratification #4). Drops below this and the qty stepper falls
#      through to category-resolver defaults for foods that should have
#      explicit values.
#
#   6. CURATED_COMBOS — ≥10 entries spanning all four slots (breakfast/
#      lunch/dinner/snack). L2 cold-start fallback requires variety per
#      slot; below the floor, new parents see thin combo surface.
#
# Usage:   bash split/audit-feed-sheet-wiring-v1.sh   (0 = pass)

set -e
cd "$(dirname "$0")/.."

python3 - <<'PYEOF'
import re
import sys

FAILS = []

# ── 1. Template wraps ──
# The 4 F-2 wrap IDs are F-2-specific + appear nowhere else in the
# codebase, so a file-wide grep is sufficient (avoids brittle balanced-
# brace template parsing). The qlModal-feed block they live inside is
# the only consumer.
with open('split/template.html') as f:
    template = f.read()
if 'id="qlModal-feed"' not in template:
    FAILS.append(('template-wraps', 'qlModal-feed block not found in template.html'))
else:
    required_wraps = ['qlFeedRepeatWrap', 'qlFeedCombosWrap', 'qlFeedItemsWrap', 'qlFeedNextWrap']
    missing = [w for w in required_wraps if 'id="' + w + '"' not in template]
    if missing:
        FAILS.append(('template-wraps', f'missing required F-2 wrap IDs in template: {missing}'))

# ── 2. Writer call ──
with open('split/intelligence-quicklog.js') as f:
    qlog = f.read()
save_match = re.search(r'function saveQLFeed\(\)\s*\{(.*?)^\}', qlog, re.S | re.M)
if not save_match:
    FAILS.append(('writer-call', 'saveQLFeed function not found in intelligence-quicklog.js'))
elif '_fdWriteStructuredMeal' not in save_match.group(1):
    FAILS.append(('writer-call', 'saveQLFeed does not call _fdWriteStructuredMeal — structured shape would not persist'))

# ── 3. Handlers ──
required_handlers = [
    'qlFeedApplyRepeat',
    'qlFeedApplyCombo',
    'qlFeedAddItem',
    'qlFeedAdjustQty',
    'qlFeedRemoveItem',
    'qlFeedSkipMeal',
    'qlFeedTypeaheadInput',
]
missing_handlers = []
for h in required_handlers:
    if not re.search(r'function\s+' + re.escape(h) + r'\s*\(', qlog):
        missing_handlers.append(h)
if missing_handlers:
    FAILS.append(('handlers', f'missing F-2 handler function(s) in intelligence-quicklog.js: {missing_handlers}'))

# ── 4. Dispatcher ──
with open('split/core.js') as f:
    core = f.read()
missing_dispatch = []
for h in required_handlers:
    # Match either: action === 'handlerName'  OR  routes through handlerName
    if not re.search(r"action\s*===\s*['\"]" + re.escape(h) + r"['\"]", core):
        missing_dispatch.append(h)
if missing_dispatch:
    FAILS.append(('dispatcher', f'core.js dispatcher missing route(s) for: {missing_dispatch}'))

# ── 5. NUTRITION_QTY_DEFAULTS count ──
with open('split/data.js') as f:
    data = f.read()
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
    # Slot coverage
    slots_in_combos = set(re.findall(r"slot:\s*'([^']+)'", combos_text))
    expected_slots = {'breakfast', 'lunch', 'dinner', 'snack'}
    missing_slots = expected_slots - slots_in_combos
    if missing_slots:
        FAILS.append(('curated-combos', f'CURATED_COMBOS missing slot coverage for: {sorted(missing_slots)}'))

# ── 7. NUTRITION join-integrity (V-K-203) ──
# The qty-defaults registry and curated-combo items are only load-bearing if
# they join to a real NUTRITION row — F-5 nutrient compute keys off
# nutritionRef, and the qty resolver's explicit override depends on the key
# existing. This enforces the contract the nutritionRef comment claims but
# the gate never actually checked (a typo'd or suffix-only food would ship
# green, contributing zero nutrient signal). Ref derivation mirrors
# _fdNutritionRef in data.js: paren-strip, then prep-suffix-stripped stem.
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
    # 7a. every explicit qty-default key resolves to a NUTRITION row
    if qty_block:
        qty_keys = re.findall(r"^\s*'([^']+)'\s*:\s*\{", qty_block.group(1), re.M)
        orphan_qty = [k for k in qty_keys if k not in nutr_keys]
        if orphan_qty:
            FAILS.append(('nutrition-join', f'NUTRITION_QTY_DEFAULTS keys with no NUTRITION row: {orphan_qty}'))
    # 7b. every curated-combo item's derived nutritionRef resolves to NUTRITION
    if combos_block:
        combo_items = []
        for grp in re.findall(r"items:\s*\[([^\]]*)\]", combos_block.group(1)):
            combo_items += re.findall(r"'([^']+)'", grp)
        orphan_combo = sorted({it for it in set(combo_items) if _nutrition_ref(it) not in nutr_keys})
        if orphan_combo:
            FAILS.append(('nutrition-join', f'CURATED_COMBOS items whose nutritionRef misses NUTRITION: {orphan_combo}'))

# ── Report ──
if not FAILS:
    print(f'audit-feed-sheet-wiring-v1: PASS (4 template wraps + 1 writer call + 7 handlers + 7 dispatchers + 30+ qty defaults + 10+ curated combos with full slot coverage + NUTRITION join-integrity)')
    sys.exit(0)

print(f'audit-feed-sheet-wiring-v1: FAIL ({len(FAILS)} structural assertion(s) failed)')
for axis, msg in FAILS:
    print(f'  [{axis}] {msg}')
print()
print('Resolution:')
print('  • template-wraps  — restore the 4 F-2 wrap IDs in qlModal-feed (template.html)')
print('  • writer-call     — saveQLFeed must call _fdWriteStructuredMeal(dateStr, meal, payload)')
print('  • handlers        — add/restore the F-2 handler functions in intelligence-quicklog.js')
print('  • dispatcher      — wire each handler in core.js click delegation block')
print('  • nutrition-qty-defaults — keep ≥30 explicit per-food qty entries (top-used floor)')
print('  • curated-combos  — keep ≥10 entries with all 4 slots represented')
print('  • nutrition-join  — every qty-default key + curated-combo nutritionRef must resolve to a NUTRITION row')
print()
print('Spec: docs/specs/food-sub-tab-v1.md §F-2 / ratification #5 hard tap-budget')
sys.exit(1)
PYEOF
