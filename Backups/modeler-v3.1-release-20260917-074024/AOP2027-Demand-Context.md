# AOP 2027 complete demand context

Updated 17 September 2026. This is a persistent project index, not a claim that an entire workbook permanently occupies the assistant's chat context.

## Retrieve the complete evidence

Project root: `C:/Users/320126040/Documents/Codex/AOP2027`.

- Original source: `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`.
- Exact source copy: `AOP 2027 Modeler/Data file/15926_IT AOP2027 Demand.xlsx`.
- All sheets, cells, values, formulas and original bytes: `AOP 2027 Modeler/Data file/AOP2027-Complete-Workbook-Snapshot.json`.
- Every normalised demand record and source-field lineage: `AOP 2027 Modeler/Data file/AOP2027-Normalized-Demand.json`.
- Reconciled workbook: `AOP 2027 Modeler/Data file/2027 IT Portfolio Prioritisation Model v3.0.xlsx`. The prior unversioned workbook was open during publishing and was preserved unchanged.
- Modeler: `AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling.html`.
- Updated project policy: `Skills/SKILL.md` and references; the matching personal skill is `.codex/skills/aop-prioritization`.
- Product contract: `PRD/AOP2027-Modeler-PRD-v3.0.docx` and `PRD/AOP2027-Modeler-Detailed-Requirements-v3.0.docx`.

The snapshot contains complete EW and Bu sheets, including non-demand rows and all original source columns. Load original rows from `sheets[].rows`; formula text is in `sheets[].formulas`; `originalBase64` restores the exact XLSX. Normalised demand `records[]` contains every source field with its column label, row and sheet. Do not answer row-specific questions only from this summary.

## Reconciled source fixture

SHA-256: `4ca3c6d4295996c1ff3062d22679ef272ee88a38a6050e112014e5ce25e2ba89`.

509 demand rows, 506 source Item Nos. Exact requested demand: 279.595 M€, EW 111.699 M€, BU 167.896 M€. Display: 279.6 M€, 111.7 M€, 167.9 M€ using upward one-decimal rounding. No source-approved Total AOP envelope exists. 100.0 M€ is illustrative.

46 missing requested amounts includes 11 empty and 35 whitespace-only cells. Numeric benefits on 196 rows. Decision Band: 215 Healthy, 14 Contain, 280 blank. Overall AOP decision: 183 Healthy rank, 30 P1, 3 P2, 12 Contain, 1 Priority TBD, 280 blank.

Exact stage demand M€: Legal and Compliance (Must Do) 34.517; Sustain Engineering 12.333; Hygiene 34.902; Carryover 97.375; Value Based Portfolio 100.468. Decommissioning, including carried-over decommissioning, goes to Value after mandatory and Sustain precedence. Display stage values need not add to display total due to upward rounding.

## Current workflow and memory maintenance

Set the AOP scenario, run Function/EW conference, complete it, then run BU Led. Review Overview and finalise. Manual additions are additive and may retain overspend. Global setting changes or reopening EW require both conferences again. Reopening BU requires BU only.

Keep this index with the project. On an accepted demand refresh, save the new complete snapshot and a new scenario version; update hash, dates and reconciled fixtures here. Do not overwrite old decisions or silently merge rows. Browser-only refresh saves locally and exports new snapshots; an assistant updates this project index only when those exported files are supplied or a project refresh is requested.
