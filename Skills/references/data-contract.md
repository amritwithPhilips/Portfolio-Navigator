# Complete demand and refresh contract | v4.5

Project root: `C:/Users/320126040/Documents/Codex/AOP2027`.
Authoritative input: `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`.
Output data: `AOP 2027 Modeler/Data file/`.
Memory index: `Memory/AOP2027-Demand-Context.md`.
Dashboard: `AOP 2027 Modeler/AOP2027-OnePortfolio-v4.7.html`.
PRD: `PRD/AOP2027-Modeler-PRD-v4.0.docx` (supersedes v3.2).
Requirements: `PRD/AOP2027-Modeler-Detailed-Requirements-v4.0.docx` (supersedes v3.2).

Retain exact original workbook bytes plus complete rows and formulas in AOP2027-Complete-Workbook-Snapshot.json. Workbook schema: sourceFile, sourceHash (full SHA-256), originalBase64, sheets [{name, rows, formulas keyed by A1 address}].

Current source has EW and Bu. Headers are row 1, subheadings row 2, prompts row 3, demand starts row 4. Detect rows by Item No., initiative name or requested amount. Keep 509 evidence records, including 3 temporary row IDs. The source has 506 Item No. references.

## Source fields extracted (22 fields)

Standard fields: item, planisware, org, name, type, newCarry, category, platform, area, priority, cost (K€→M€), benefit (K€→M€), benefitRaw, benefitDetails, impact, problem, scope, dependency, decisionBand, overall, remarks.

New in v4.5: lfrYear (col K: LFR & Compliancy Year), lfrName (col L: LFR & Compliancy Name), baselined (col P: Carry Over Baselined, K€→M€). These fields enable the four-priority eligible-only classification.

Resolve headers by normalised name and subheading, not fixed offsets. Priority before Problem Statement is submitted priority, not later risk priority. Duplicate Waste headings use subheading band. Source unit K€ is divided by 1,000 once for M€. Preserve cached results, original field labels, source sheet/row, Item No., Planisware ID and every source field.

Refresh accepts equivalent EW/Bu schemas. Unknown sheet names, duplicate/missing required headers, duplicate stable IDs or invalid requested numeric values block apply. Stable IDs with unchanged business evidence retain overrides; changed evidence marks them Needs review.

Exports use the engine's exact result: Scenario Summary, Portfolio, Score Evidence, Settings, Decisions and Source Reference. Exports are not a separate financial engine. Refresh using the original schema; restore decisions using a checksummed portable scenario.
