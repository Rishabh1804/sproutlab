# WHO growth source files

Committed so the build can check the app's WHO tables against the originals (`split/audit-who-wfa-v1.mjs`). WHO publishes no file version, so each file is recorded by sha256 and download date (Architect decision D, 2026-11-04; spec `docs/specs/paracetamol-weight-check-v1.md` §3).

| File | What | Source | Downloaded | sha256 |
|---|---|---|---|---|
| `tab_wfa_girls_p_0_5.xlsx` | Weight-for-age, girls, 0–60 months: L, M, S and P0.1–P99.9 by month | WHO Child Growth Standards: https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/tab_wfa_girls_p_0_5.xlsx | 2026-10-30 (re-fetched 2026-11-04, unchanged) | `cab683c68f937cec0fa8c80a601c4784d5f98230d787a20678d217db98f12f0e` |
| `tab_wfa_boys_p_0_5.xlsx` | Weight-for-age, boys, 0–60 months | the same path, `tab_wfa_boys_p_0_5.xlsx` | same | `675e1516ffcdf6273b1cc1370fa34e533d3bd84dfd31fdba93ebc457d907032a` |

| `ttt-weight-girls-2mon-p.xlsx` | Weight velocity, girls, 2-month increments (g), P1–P99 + L/M/S/Delta | https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-velocity/ttt-weight-girls-2mon-p.xlsx | 2026-11-03 (re-fetched 2026-11-04, unchanged) | `8bb8ccd218175d205b7e72abd8248aef7741d4e602b0929af047e9e4901315ce` |
| `ttt-weight-girls-3mon-p.xlsx` | girls, 3-month | same path | same | `6da9768fa094c22203c7b4c9bd0f5678ea9321fbb84496b5ee917d954628fc3d` |
| `ttt-weight-boys-2mon-p.xlsx` | boys, 2-month | same path | same | `5c40eab824a2fc8b5c955871a22ea9ca004a098596a8ddcf9ab9ae0cf71f96e4` |
| `ttt-weight-boys-3mon-p.xlsx` | boys, 3-month | same path | 2026-11-04 | `d750caa05ecaca558dace5a93b8990dd54d7a3f4901896578e17105cfbc8ab99` |
| `lms_weight_girls_4mon_p.pdf` | girls, 4-month (PDF only) | same path | 2026-11-04 | `c7a92726c14d6489c7e8c4eb836250e6c81ce97c8a6233c3e908ce841bc0da77` |
| `lms_weight_girls_6mon_p.pdf` | girls, 6-month (PDF only) | same path | 2026-11-04 | `aa1857113b9a097882cbd44718e3660a216265dac7e283fd179661a6d7df5b55` |
| `lms_weight_boys_4mon_p.pdf` | boys, 4-month (PDF only) | same path | 2026-11-04 | `80b6bb4e096ad70d1a91d5098729b8a2e5fadff7b01ffa72b385f3e8b24274f9` |
| `lms_weight_boys_6mon_p.pdf` | boys, 6-month (PDF only) | same path | 2026-11-04 | `a75d645240fe17ba8298ebc6d273ba6d30ec0fdb06f3f14c4dcec88a45d160da` |

Read by `WHO_WFA_LMS` (split/data.js) → `whoWfaZ()` (split/core.js), and by `WHO_WT_VELOCITY` / `WHO_WT_VELOCITY_LONG` / `WHO_WT_DZ_KNOTS` → `gvWeightJumpCheck()` (the #161 weight-jump check). Checked each build by `split/audit-who-wfa-v1.mjs` and `split/audit-who-velocity-v1.mjs`. The PDFs cannot be re-read by the build: their one row each (ending at 24 months) was transcribed with `pdftotext -layout` and is checked against its own L/M/S.
