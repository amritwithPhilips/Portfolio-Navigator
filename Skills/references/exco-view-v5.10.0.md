# Current release v5.10.0 — ExCo correction build

30 September 2026. Current modeler: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.10.0.html. Preserves v5.7.0, v5.8.0, v5.9.0 and both source workbooks.

Restores Tab 2 Carryover ROI slider and numeric input, 0–10x in 0.5 steps. Confirmed Must Do/Must Have baselines remain ROI-exempt at min(request, approved baseline). For other carryovers, 10x is baseline-only; lower thresholds admit otherwise eligible requests with benefit/request at least the threshold. At 0x there is no ratio filter. Default 10x retains Optimal 99.963 M€ base funding and 575.467463 M€ total IT. Old portable scenarios lacking carryPolicy retain baseline-only eligibility until the ROI control is edited. New settings record carryPolicy roi-v1. Submitted lifetime benefit/request is not annual cash ROI.

Overall State replaces Company position and the all-leaders option. ExCo Compare options is removed. My portfolio, Decisions and Funding opportunities show direct Opt in / Opt out / Partial funding / Automatic actions, with preview, rationale, undo and finalized-state lock. Requested budget, Hard Benefits and score sort both ways. Missing hard benefit sorts last. ExCo reuses the detailed-tabs bubble chart renderer; axis and color synchronize both ways.

Scenario Excel downloads select current or saved revision and complete / inclusions / current filters. Downloading a snapshot never changes the live scenario. Filenames and Scenario Selection identify scenario and revision. Selected Programs contains the requested rows; finance/source evidence remains full-scenario. Tab 2 retains current download and adds downloads next to saved revisions. All funding decisions share one finance engine and source allocation ledger; 22.6303317536% EW unallocated, separate PMI and fixed Operations remain unchanged.

Validation: 2237 assertions passed, 53 scenario configurations including all 21 ROI positions, original-workbook replay, five explicit correction workflows, real saved/current/filtered/inclusion Excel downloads and compatibility checks. Evidence: ExCo-QA-report-v5.10.0.html and Data file/ExCo-20260930-v5.10.0. PRD and requirements: PRD/AOP2027-Modeler-PRD-and-Requirements-v5.10.0.html. Canonical engine and versioned engine-v5.10.0.js are updated.

---
Retained history follows; this section supersedes conflicting carryover ROI and ExCo UI guidance.

