#!/bin/bash
# audit-food-library-wiring-v1.sh — food-sub-tab-v1 F-3 ship-gate (11th gate)
#
# Blocks regressions that silently unwire the diet-tab Library surface: the
# search box, the filter-chip rail, the flattened results list, the per-food
# detail sheet (nutrition + allergen/age + Chemistry), and the click/input
# dispatch routes + lazy-render hook that drive them. Mirrors the F-2 10th
# gate's required-presence discipline. Spec: docs/specs/food-sub-tab-v1.md §F-3.
# Charter CV3-006 warmth axis (the Library is the parent-facing browse surface).
#
# Exit 0 = all present; exit 1 = a required wiring is missing (build aborts).
set -euo pipefail

fail() { echo "audit-food-library-wiring-v1: FAIL — $1" >&2; exit 1; }

SPLIT="$(dirname "$0")"

check() {
  # $1 = file, $2 = pattern (grep -F literal), $3 = description
  grep -Fq "$2" "$SPLIT/$1" || fail "$3"
}

count_ge() {
  # $1 = file, $2 = pattern, $3 = min count, $4 = description
  local n; n=$(grep -Fc "$2" "$SPLIT/$1" || true)
  [ "$n" -ge "$3" ] || fail "$4 (found $n, need >= $3)"
}

echo "audit-food-library-wiring-v1: checking F-3 Library surface wiring..." >&2

# ── Template scaffold (4 host nodes + detail-sheet anatomy) ──
check template.html 'id="foodLibSearch"'        'template: search input #foodLibSearch missing'
check template.html 'data-action="foodLibOnSearch" data-action-on="input"' 'template: search input not wired to foodLibOnSearch via the input delegator (data-action + data-action-on="input")'
check template.html 'id="foodLibFilterRail"'    'template: filter rail #foodLibFilterRail missing'
check template.html 'id="foodLibResults"'       'template: results host #foodLibResults missing'
check template.html 'id="foodDetailSheet"'      'template: detail sheet overlay #foodDetailSheet missing'
check template.html 'id="foodDetailTitle"'      'template: detail sheet title #foodDetailTitle missing'
check template.html 'id="foodDetailBody"'       'template: detail sheet body #foodDetailBody missing'

# ── diet.js render + logic surface ──
check diet.js 'function renderFoodLibFilters('  'diet.js: renderFoodLibFilters missing'
check diet.js 'function renderFoodLibResults('  'diet.js: renderFoodLibResults missing'
check diet.js 'function renderFoodDetailSheet(' 'diet.js: renderFoodDetailSheet missing'
check diet.js 'function foodLibOnSearch('       'diet.js: foodLibOnSearch missing'
check diet.js 'function foodLibFilter('         'diet.js: foodLibFilter missing'
check diet.js 'function foodLibDetail('         'diet.js: foodLibDetail missing'
check diet.js 'function foodLibToggleTried('    'diet.js: foodLibToggleTried missing'
check diet.js 'function renderDietLibrary('     'diet.js: renderDietLibrary lazy-render hook missing'
check diet.js 'const FOOD_LIB_FILTERS'          'diet.js: FOOD_LIB_FILTERS registry missing'
# V-M-202 (Architect-ratified): the search index must be the union of the
# nutrition DB AND the safety tables, so the highest-stakes age-gated foods
# (honey/egg/cow-milk) absent from NUTRITION are still findable. Lock the
# union builder + its consumption so the index can't silently revert to
# NUTRITION-only (which would make honey unsearchable again).
check diet.js 'const _FD_SEARCH_INDEX'          'diet.js: _FD_SEARCH_INDEX union builder missing (search would be NUTRITION-only)'
check diet.js '_FD_SEARCH_INDEX.filter'         'diet.js: renderFoodLibResults not consuming the union index'
check diet.js '_FD_SPICE_TIER'                  'diet.js: spice-tier exclusion set missing (per-serving safety caveat)'
# V-K-102: the spice-tier set must carve out the sweeteners sub — jaggery/gur
# are real per-serving iron sources, not ≤1g tadka spices. Without this, a
# "High iron" search would silently suppress jaggery the moment it gains a
# NUTRITION nutrients[] array. Enforce the documented carve-out at build time.
check diet.js "sid === 'sweeteners'"            'diet.js: _FD_SPICE_TIER must exclude the sweeteners sub (jaggery/gur are real iron sources, not tadka spices)'

# ── switchDietSub lazy-render hook ──
check diet.js "subKey === 'library'"            'diet.js: switchDietSub library lazy-render hook missing'

# ── core.js click-dispatch routes ──
count_ge core.js "action === 'foodLibOnSearch'"    1 'core.js: foodLibOnSearch INPUT dispatch route missing (search box would be dead)'
count_ge core.js "action === 'foodLibFilter'"      1 'core.js: foodLibFilter dispatch route missing'
count_ge core.js "action === 'foodLibDetail'"      1 'core.js: foodLibDetail dispatch route missing'
count_ge core.js "action === 'foodLibToggleTried'" 1 'core.js: foodLibToggleTried dispatch route missing'

# ── Chemistry fold present in the detail sheet (Arc B) ──
check diet.js 'entry.chem'                       'diet.js: Chemistry fold (chem) missing from detail sheet'
check diet.js 'antiNutrients'                    'diet.js: chem.antiNutrients row missing'
check diet.js 'bioactives'                       'diet.js: chem.bioactives row missing'

echo "audit-food-library-wiring-v1: PASS (7 template nodes + 10 diet.js functions/registries + lazy hook + 3 dispatch routes + Chemistry fold)" >&2
