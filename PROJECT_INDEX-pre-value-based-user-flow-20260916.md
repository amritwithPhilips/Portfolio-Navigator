# AOP 2027 project index

Active project folder: `C:\Users\320126040\Documents\Codex\AOP2027`

Last reviewed and refreshed: 16 September 2026. Calculation artifacts use only `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`.

## Current decision artifacts

| Path | Purpose | Verification |
| --- | --- | --- |
| `Approach/AOP2027-Executive-Prioritisation-Approach.pdf` | Two-page executive funding, evidence and scenario approach. | 2 A4 pages, rendered and visually inspected. |
| `Approach/AOP2027-Detailed-Prioritisation-Approach.pdf` | Detailed decision paper covering executive overview, source baseline, funding order, levers, merit, scenarios and governance. | 6 A4 pages, rendered and visually inspected. Display values use upward rounding to one decimal. |
| `Approach/AOP2027-CIO-Prioritisation-Approach.pptx` | Three-slide CIO and ITLT presentation covering the demand baseline, decision evidence gaps, fixed funding order, levers, merit framework and AOP finalisation. | 3 slides built from the mandatory Philips template; structure, 16:9 dimensions, Calibri Light/Calibri fonts, native tables and first-party import validated; all slides rendered and visually inspected. |
| `AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling.html` | Standalone interactive dashboard with five visible levers, prioritized portfolio, BU/EW conference views, variance and frozen versions. | Browser-tested for live recalculation and additive conference inclusion. |
| `AOP 2027 Modeler/Data file/2027 IT Portfolio Prioritisation Model.xlsx` | Auditable Excel model coupled to the dashboard by normalized IDs, source hash, classifications, score rules and allocation order. | Eight sheets rendered; checks PASS; no formula errors found. |
| `AOP 2027 Modeler/Data file/AOP2027-Normalized-Demand.json` | Normalized dashboard/model input for 509 source rows. | Source hash `4ca3c6d4295996c1ff3062d22679ef272ee88a38a6050e112014e5ce25e2ba89`. |
| `AOP 2027 Modeler/Data file/AOP2027-Normalized-Demand.csv` | Flat source register for audit and analysis. | 509 records represented. |
| `AOP 2027 Modeler/Data file/AOP2027-Model-Logic-Specification.md` | Confirmed allocation, merit, evidence, whole-initiative and version rules. | Reconciles with the skill, workbook and dashboard. |

## Authoritative demand and reference material

| Path | Treatment |
| --- | --- |
| `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx` | Sole calculation and evidence source. |
| `AOP 2027 Demand/2027 IT Portfolio Prioritisation Model.xlsx` | Layout reference only; its older figures are not reused. |
| `PRD/` | Historical requirements and review material; not a calculation source. |

## Reusable policy package

`Skills/` is the validated `aop-prioritization` skill. Start with `Skills/SKILL.md`.

| Path | Purpose |
| --- | --- |
| `Skills/assets/engine.js` | Shared deterministic allocation engine used by the dashboard and reproduced in Excel formulas. |
| `Skills/scripts/prepare_source.py` | Normalizes the authoritative EW and Bu sheets and records the source hash. |
| `Skills/references/decision-policy.md` | Five-stage precedence, levers, merit, tolerance and conference rules. |
| `Skills/references/data-contract.md` | Source mapping, normalized fields, reconciliation and version contract. |
| `Skills/references/dashboard-design.md` | Visible controls, prioritized and conference views, interactions and QA. |
| `Skills/references/decision-bands.md` | Treatment of source Decision Band and Overall AOP decision. |
| `Skills/references/executive-approach.md` | Concise executive narrative for the current source snapshot. |

## Executive communication skills

| Path | Purpose |
| --- | --- |
| `Reusable Skills/amrit-executive-writing/SKILL.md` | Executive report, decision paper, update, recap and email writing in Amrit's leadership style. |
| `Reusable Skills/philips-executive-presentation-dashboard-designer/SKILL.md` | Philips-branded CIO, ITLT, BU and senior stakeholder presentation and dashboard design rules. The bundled Default Philips Template is mandatory for every PowerPoint. |
| `Reusable Skills/philips-executive-presentation-dashboard-designer/assets/Default Philips Template.pptx` | Approved standard PowerPoint template; SHA-256 `91003acc4f6c96e4e093feb9de8efdc0d0f0797a1bbaee9a2f8bd9dd47c0330f`. |

Both skills are also installed in the personal Codex skills directory for reuse across projects.

## Current source reconciliation

- 509 demand-evidence rows; 279.595 M€ requested.
- EW: 111.699 M€; BU: 167.896 M€.
- LFR: 34.517 M€, including EW-11, EW-65 and EW-71.
- Sustain Engineering after LFR precedence: 12.333 M€.
- Hygiene after LFR and Sustain Engineering precedence: 65.560 M€.
- Default demonstration scenario: Total AOP 100.000 M€ and 5% whole-initiative tolerance; 102.592 M€ automatically selected, a 2.592 M€ visible over-budget variance.

## Backups

- `Approach/AOP2027-Executive-Prioritisation-Approach-pre-final-levers-20260916.pdf`
- `AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-pre-final-levers-20260916.html`
- `Skills-pre-final-levers-20260916/`
- Earlier pre-15926 backups remain preserved.
