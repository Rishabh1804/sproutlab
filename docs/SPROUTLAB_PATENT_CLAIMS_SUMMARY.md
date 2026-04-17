# SproutLab — Novel Technical Claims Summary
**Prepared:** 10 April 2026
**Purpose:** IP attorney consultation — patentability assessment
**Applicant:** Rishabh Jain, Jamshedpur, Jharkhand, India
**App:** SproutLab — baby development tracker PWA
**Public URL:** rishabh1804.github.io/sproutlab (note: live — public disclosure implications)

---

## 1. Executive Summary

SproutLab is a single-file Progressive Web Application (PWA) for infant health tracking that goes beyond logging to provide cross-domain intelligence, data-aware concern tracking, and automated medical escalation. The system operates entirely client-side (no backend, no cloud) using localStorage, making it privacy-first by architecture.

Three clusters of potentially novel inventions are described below.

---

## 2. Claim Cluster A — CareTickets: Data-Aware Concern Tracking with Automated Medical Escalation

### Problem Solved
Existing baby tracking applications log health data (sleep, feeding, growth, illness) but provide no mechanism to anchor a parental concern, follow up on it with structured check-ins, evaluate resolution against live health data, or escalate to medical intervention based on symptom combinations.

### Novel System

A concern tracking system for infant health monitoring comprising:

**Claim A1 — Dual-category tracking with split verdict logic:**
A system that classifies parental concerns into two categories — incident (acute events such as falls, bumps, ingestion) and goal (chronic improvement targets such as sleep, weight, food variety) — where each category uses a fundamentally different verdict computation method: incident verdicts are driven by structured symptom questionnaire answers, while goal verdicts are driven by automated evaluation of continuously collected health metrics, with questionnaire answers serving as contextual metadata only.

**Claim A2 — Template-driven medical questionnaire with severity-ranked escalation:**
A system of pre-defined incident templates containing medically-prioritized symptom questions, where each question has an explicit "clear value" and an optional "resolution blocking" flag, and where escalation triggers are evaluated collectively (not short-circuited) across all matching triggers to select the highest-severity medical action (e.g., "call doctor" vs "visit ER"), using a defined severity ranking.

**Claim A3 — Automated metric resolution with illness-aware pause:**
A goal tracking system that automatically evaluates resolution criteria against live health data (sleep scores, weight velocity, dietary diversity metrics) and pauses the resolution counter during detected illness episodes without resetting progress, using a time-bounded heuristic (configurable window with recent-activity check) to distinguish genuinely active illness from forgotten/stale episode records.

**Claim A4 — Reference-time state machine for lifecycle tracking:**
A concern lifecycle management system with six defined state transitions (active, escalated, resolved, with reopen and de-escalation paths) where the reference time for evaluating resolution progress is dynamically computed as the maximum of all status-change timestamps (creation, escalation, de-escalation, reopen), ensuring that progress counters correctly reset on every state transition without requiring explicit counter management.

**Claim A5 — Schedule-based notification with quiet-hour bypass:**
A notification scheduling system for health monitoring that uses main-thread timers with overdue detection on application reopen as a fallback, incorporating quiet hours (configurable do-not-disturb window) with an explicit bypass for medically escalated concerns, and count-based banner aggregation when multiple follow-ups fire simultaneously.

### Prior Art Distinction
Existing infant tracking apps (Huckleberry, Baby Tracker, Glow Baby, Sprout Baby) provide data logging and basic insights. None implement a structured concern tracking lifecycle with data-aware verdict computation, medical escalation with severity ranking, or illness-aware metric resolution pausing. The CareTickets system bridges the gap between passive data collection and active parental decision support.

---

## 3. Claim Cluster B — Cross-Domain Infant Health Intelligence

### Problem Solved
Baby health data is logged across isolated domains (sleep, feeding, poop, growth, illness, milestones, activity). Existing apps display each domain independently. No existing consumer app correlates data across domains to surface non-obvious patterns — e.g., that a specific food combination correlates with better sleep, or that activity levels predict poop patterns.

### Novel System

**Claim B1 — Intelligence Service Layer (ISL) with domain-dirty caching:**
A client-side data intelligence architecture comprising a centralized service layer that provides domain-specific data access functions (sleep, diet, poop, medical, milestones, activities) with a cache invalidation system where each domain is independently marked "dirty" when its underlying data changes, and cached computations are only recomputed for affected domains.

**Claim B2 — Cross-domain correlation engine for infant health:**
A system that automatically computes correlations between infant health domains, including: food-sleep correlations (which foods or food combinations precede better/worse sleep), activity-sleep correlations (activity types and durations that predict sleep quality), food-poop correlations (dietary inputs that predict digestive patterns), illness-vaccination correlations (temporal proximity analysis between vaccinations and illness episodes), and growth-feeding correlations (dietary diversity impact on weight/height velocity).

**Claim B3 — Evidence-based milestone auto-promotion from activity logs:**
A developmental milestone tracking system that automatically classifies unstructured activity log entries against a pattern database (500+ classification patterns with confidence scoring), maps matched activities to developmental milestones across motor, language, social, and cognitive domains, and automatically promotes milestone status through a defined progression (not started → emerging → practicing → consistent → mastered) based on evidence frequency, recency, and confidence levels, with regression detection when evidence ceases.

**Claim B4 — Holistic daily health scoring with cross-domain weighting:**
A composite health scoring system for infants that combines sleep quality (25%), dietary quality (25%), digestive health (20%), medical status (15%), and developmental progress (15%) into a single daily score using a base-modifier architecture (80% base score + 20% intelligence modifiers capped at ±10 points), with carry-forward decay for missing data and domain-specific staleness detection.

### Prior Art Distinction
Individual domain tracking exists in numerous apps. Huckleberry provides sleep pattern detection. Glow Baby tracks milestones. No existing consumer app performs automated cross-domain correlation, evidence-based milestone promotion from activity logs, or composite scoring with intelligence modifiers across 5+ health domains simultaneously.

---

## 4. Claim Cluster C — Specification-Driven Development Methodology

### Problem Solved
Software specification processes for consumer health applications lack systematic methods for identifying logic errors, medical safety gaps, and long-term drift risks before implementation.

### Novel Method

**Claim C1 — Multi-pass specification review with diminishing-return convergence detection:**
A method for producing build-ready software specifications comprising eight sequential review passes, each with a defined lens (concept, data flow, integration, immediate bugs, temporal drift, builder questions, consistency, completion), where the completion signal is detected by measuring the severity trend of discovered issues across passes — when critical and high-severity discoveries drop to zero for multiple consecutive passes while findings shift to cosmetic/polish issues, the specification is declared build-ready.

**Claim C2 — Scenario-based exhaustive bug detection for health-critical applications:**
A method for validating health-critical application logic comprising iterative scenario walkthroughs (demonstrated at 310 scenarios across 15 passes) covering: state machine transition verification, data serialization round-trips, concurrent mutation analysis, medical safety content review, multi-user interaction modeling, error recovery paths, and long-term data drift projection, with severity classification (critical/high/medium/low) and tracked fix verification.

### Prior Art Distinction
Existing specification methods (IEEE 830, agile user stories, BDD) do not incorporate: medical safety content review as a formal pass, diminishing-return convergence detection as a completion signal, or long-term temporal drift analysis (what breaks in 3–6 months as infant development progresses).

---

## 5. Architectural Innovation — Privacy-First Client-Side Health Intelligence

**Claim D1 — Complete health intelligence system with zero server dependency:**
An infant health monitoring system that performs cross-domain correlation, automated milestone classification, composite health scoring, concern tracking with medical escalation, and notification scheduling entirely within a client-side web application using browser localStorage for persistence and no server-side computation, data transmission, or cloud storage — ensuring complete data privacy by architectural design rather than policy compliance.

### Prior Art Distinction
Existing health tracking apps that provide intelligence features (pattern detection, correlations, scoring) require server-side computation and cloud data storage. SproutLab achieves equivalent or superior intelligence capabilities entirely client-side, making it architecturally impossible for health data to leave the user's device.

---

## 6. Public Disclosure Timeline

| Date | Event | Disclosure Level |
|------|-------|-----------------|
| Mar 2026 | SproutLab v2.0 deployed to GitHub Pages | Public — basic tracking features |
| Mar–Apr 2026 | Intelligence layer built (v2.1–v2.38) | Public — each deployment adds features |
| 9 Apr 2026 | Architecture split (Phases 1–3) | Public — code structure visible on GitHub |
| 10 Apr 2026 | CareTickets spec completed | Private — spec document not published |
| Pending | CareTickets build + deployment | Will become public on deployment |

**Critical note for attorney:** The intelligence features (Claims B1–B4) and basic tracking are already publicly deployed. CareTickets (Claims A1–A5) exists only as a specification document and has not been deployed. The specification methodology (Claims C1–C2) is documented in private files.

**Indian Patent Act consideration:** Under Section 3(k), "a mathematical or business method or a computer programme per se or algorithms" are not patentable. However, technical implementations that produce a "technical effect" or solve a "technical problem" may be patentable when claimed as a system/apparatus rather than a method/algorithm. The claims above are framed as systems and methods with specific technical effects (medical escalation, health correlation, developmental tracking).

---

## 7. Recommended Discussion Points with Attorney

1. **Section 3(k) analysis:** Do the cross-domain correlation engine and data-aware verdict computation constitute "technical effects" beyond a "computer programme per se"?

2. **Priority date strategy:** Given public deployment of intelligence features, is a provisional application still viable for the deployed features, or should we focus on the unpublished CareTickets system?

3. **Provisional vs complete:** Should we file a provisional application for CareTickets immediately (before deployment) and a separate one for the specification methodology?

4. **International filing:** If Indian patent is granted, is PCT filing worthwhile for a solo developer, or is the cost prohibitive relative to enforcement capability?

5. **Trade secret alternative:** For the specification methodology (Claims C1–C2), would trade secret protection be more practical than patent protection?

6. **Defensive publication:** If patent costs are prohibitive, would publishing a detailed technical paper establish prior art to prevent others from patenting similar systems?

---

## 8. Supporting Documentation Available

| Document | Pages | Content |
|----------|:-----:|---------|
| CARETICKETS_SPEC_v5.md | ~50 | Full 310-scenario spec with data model, state machine, templates |
| DESIGN_PRINCIPLES.md | ~25 | Design system with 12 hard rules, 7 scoring principles |
| SPEC_ITERATION_PROCESS.md | ~12 | The 8-pass methodology |
| ARCHITECTURE_SPLIT_PLAN.md | ~15 | Split architecture design |
| Source code (GitHub) | 55,367 lines | Complete implementation (intelligence layer live) |
| Session transcripts | ~100+ pages | Development history with rationale for every decision |

All documents authored by Rishabh Jain with AI assistance (Claude, Anthropic). Attorney should assess IP ownership implications of AI-assisted development under current Indian IP law.

---

*This document is prepared for attorney consultation purposes only. It does not constitute a patent application or legal advice.*
