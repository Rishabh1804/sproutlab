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
check template.html 'data-input-action="foodLibOnSearch"' 'template: search input not wired to foodLibOnSearch'
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
check diet.js '_FD_SPICE_TIER'                  'diet.js: spice-tier exclusion set missing (per-serving safety caveat)'

# ── switchDietSub lazy-render hook ──
check diet.js "subKey === 'library'"            'diet.js: switchDietSub library lazy-render hook missing'

# ── core.js click-dispatch routes ──
count_ge core.js "action === 'foodLibFilter'"      1 'core.js: foodLibFilter dispatch route missing'
count_ge core.js "action === 'foodLibDetail'"      1 'core.js: foodLibDetail dispatch route missing'
count_ge core.js "action === 'foodLibToggleTried'" 1 'core.js: foodLibToggleTried dispatch route missing'

# ── Chemistry fold present in the detail sheet (Arc B) ──
check diet.js 'entry.chem'                       'diet.js: Chemistry fold (chem) missing from detail sheet'
check diet.js 'antiNutrients'                    'diet.js: chem.antiNutrients row missing'
check diet.js 'bioactives'                       'diet.js: chem.bioactives row missing'

echo "audit-food-library-wiring-v1: PASS (7 template nodes + 10 diet.js functions/registries + lazy hook + 3 dispatch routes + Chemistry fold)" >&2
