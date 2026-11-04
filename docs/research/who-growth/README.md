# WHO growth source files

Committed so the build can check the app's WHO tables against the originals (`split/audit-who-wfa-v1.mjs`). WHO publishes no file version, so each file is recorded by sha256 and download date (Architect decision D, 2026-11-04; spec `docs/specs/paracetamol-weight-check-v1.md` §3).

| File | What | Source | Downloaded | sha256 |
|---|---|---|---|---|
| `tab_wfa_girls_p_0_5.xlsx` | Weight-for-age, girls, 0–60 months: L, M, S and P0.1–P99.9 by month | WHO Child Growth Standards: https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/tab_wfa_girls_p_0_5.xlsx | 2026-10-30 (re-fetched 2026-11-04, unchanged) | `cab683c68f937cec0fa8c80a601c4784d5f98230d787a20678d217db98f12f0e` |
| `tab_wfa_boys_p_0_5.xlsx` | Weight-for-age, boys, 0–60 months | the same path, `tab_wfa_boys_p_0_5.xlsx` | same | `675e1516ffcdf6273b1cc1370fa34e533d3bd84dfd31fdba93ebc457d907032a` |

Read by `WHO_WFA_LMS` (split/data.js) → `whoWfaZ()` (split/core.js). The weight-velocity files for the #161 weight-jump check join this folder in PR 2.
