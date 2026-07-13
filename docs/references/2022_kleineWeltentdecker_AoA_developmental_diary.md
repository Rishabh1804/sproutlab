# Reference — The kleineWeltentdecker App (AoA developmental diary)

**Stored/analysed:** 2026-07-11 (the Borders sitting, follow-on). Architect-supplied.
**Citation:** Daum, M. M., Bleiker, M., Wermelinger, S., Kurthen, I., Maffongelli, L., Antognini, K., Beisert, M., & Gampe, A. (2022). *The kleineWeltentdecker App — A smartphone-based developmental diary.* **Behavior Research Methods, 54, 2522–2544.** https://doi.org/10.3758/s13428-021-01755-7
**Type:** Peer-reviewed methods paper (open access, © The Authors). We store this analysis + citation, not the copyrighted PDF.
**Why it matters to us in one line:** it is a validated, published instrument that independently converges on SproutLab's core theses — longitudinal single-child tracking and cross-domain skill interdependence — and hands us three concrete engine upgrades.

---

## What it is
A smartphone "developmental diary" (birth→6 years) where caregivers log the **emergence** of skills across four domains (cognition, language, motor, social-emotional; plus pragmatic language). Validated on **2,385 children** (filtered from 5,067). Built by a University of Zurich developmental-psychology group. The name means "young world explorers."

## A — Methods worth adopting (the engine ideas)
1. **Age-of-Attainment (AoA), not present/absent.** They do NOT ask "does the 12-mo walk?" at fixed checkpoints. They capture *the point in time a skill first emerges.* This "shifts age from being a predictor to being the outcome." **SproutLab implication (Kael/Maren):** our milestone tracking should record the **first-emergence date** as a first-class field, not just a checkbox — the AoA *is* the datum, and it's what makes cross-domain correlation possible.
2. **Adaptive item selection + re-prompting.** The app selects the next question by the *earliest possible age* a skill appeared in its norm sample, and re-asks any "No" item every ~2 weeks until observed — so it misses neither early nor late attainers. **SproutLab implication:** maps directly onto our ISL + notification architecture; a smarter, norm-anchored milestone prompt cadence.
3. **Experience sampling / push cadence.** Weekly-to-monthly prompts, caregiver-selectable, answerable any time. Low-burden, high-density. We already have the notification spine (CareTickets); this is a proven cadence model.

## B — Findings that VALIDATE SproutLab's thesis
- **"Skills do not develop in isolation"** is a stated central pillar of the paper — nearly verbatim Lyra's cross-domain thesis.
- **Concrete cross-domain result:** the AoA of **Sharing Attention** (early joint attention, a *social* skill) relates to the AoA of **First Word** (a *language* skill). A social→language correlation, empirically shown. **This is exactly what `intelligence-correlate.js` exists to surface** — and this paper is a *citable, peer-reviewed grounding* for that feature (satisfies our provenance/HR-13-spirit "cited corpus" discipline). Ceres's "provenance before the plate" applied to intelligence claims.

## C — The content layer (the "blog" insight, pre-figured)
For **every milestone item**, they authored caregiver-facing content: precursors, the development *around* the milestone, examples, contextual info, and **advice on how to foster progress / which "training" fits this phase.** **Key design lesson for our blog idea:** the most powerful parent content is **contextual to the child's current AoA state**, surfaced at the moment it's relevant — not (only) a generic chronological article feed. A Kinedu-style blog is good; a blog whose articles *surface themselves* when Ziva reaches the relevant window is the SproutLab-native version (weaves into Today So Far / the ISL).

## D — Validation & psychometrics (what's reliable, and our n=1 caveat)
- Reliability: **excellent for language, good for motor, below-acceptable for cognition** (cognition items ask caregivers to run little "experiments" — high burden, high interpretation variance).
- No effect of caregiver education/sex-of-rater on data quality (good objectivity); girls showed earlier language AoAs (well-established).
- **Our caveat:** we are n=1 (Ziva). We cannot validate psychometrically. But this tells us *which domains parent-report is trustworthy in* (language/motor solid; cognition needs care) — directly informs where SproutLab should trust vs. hedge its milestone inferences.

## E — Internationalisation (validates English + Hindi)
Ships in **four languages** (German, French, Italian, British English), "range can be expanded at any time." Confirms the Architect's English+Hindi instinct is normal, not exotic; i18n here is a solved, additive pattern. **SproutLab implication:** the app has **no i18n framework today** — this is the real engineering lift behind a bilingual blog/app, not the content itself.

## F — Data-quality caveat that ties to our security doctrine
The paper is candid that **caregiver-collected ("citizen science") data introduces variability**, especially for complex observation tasks. This is the *benign* cousin of the ASI06/07 ingest problem: even non-malicious parent input is noisy. Reinforces the Borders doctrine — validate/quarantine at ingest, and surface confidence, don't launder it (Kael/Ceres).

## G — Roadmap implications (compartmentalised)
- **Engine (Kael):** add first-emergence-date (AoA) as a first-class milestone field; norm-anchored adaptive re-prompt cadence.
- **Intelligence (Kael/Lyra):** cite this paper as grounding for `intelligence-correlate.js`; consider surfacing a social→language correlation card when the data supports it.
- **Content (Ceres/Vela/Lyra):** the blog should be *milestone-contextual*, reusing the `/doc-render` markdown→HTML-view pattern; static, no backend needed.
- **Surfacing (Vela):** contextual content must pass the half-awake test and carry a visible provenance/verified-by badge.
- **Shared:** i18n framework is a prerequisite for Hindi — scope it as its own foundation, not a bolt-on.

## H — Honest limits / where we differ
Their app **caps at 6 years** and is a *research instrument* (population data collection), not a consumer product. SproutLab's evolving-with-the-child thesis (tracking→learning→education, one child, past 6) is *beyond* this paper's scope — it validates our foundation and then stops exactly where our white space begins.
