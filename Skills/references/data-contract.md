# Complete demand and refresh contract | v5.2

Project root: `C:/Users/320126040/Documents/Codex/AOP2027`.
Authoritative input: `AOP 2027 Consolidated Live.xlsx` (SharePoint ITPFM site).
Output data: `AOP 2027 Modeler/Data file/`.
Memory index: `Memory/AOP2027-Demand-Context.md`.
Dashboard: `AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.1.html`.
PRD: `PRD/AOP2027-Modeler-PRD-v5.2.docx`.
Requirements: `PRD/AOP2027-Modeler-Detailed-Requirements-v5.2.docx`.

Retain exact original workbook bytes plus complete rows and formulas in AOP2027-Complete-Workbook-Snapshot.json. Workbook schema: sourceFile, sourceHash (full SHA-256), originalBase64, sheets [{name, rows, formulas keyed by A1 address}].

Current source has EW and BU sheets. Headers auto-detected (engine scans first 10 rows for 'Item No.'). Live workbook has headers at row 4. Zero-ID rows (numeric 0 in Item No.) are filtered. Detect rows by Item No., initiative name or requested amount. Keep 472 evidence records after enterprise-wide charging exclusion. Source: 473 rows (EW 177, BU 296), 285.1 M€ total demand.

## Source fields extracted (26 fields)

Standard fields: item, planisware, org, name, type, newCarry, category, platform, area, priority, cost (K€→M€), benefit (K€→M€), benefitRaw, benefitDetails, impact, problem, scope, dependency, decisionBand, overall, remarks.

New in v4.5: lfrYear (col K: LFR & Compliancy Year), lfrName (col L: LFR & Compliancy Name), baselined (col P: Carry Over Baselined, K€→M€). These fields enable the four-priority eligible-only classification.

New in v5.2: exco (ExCo accountability leader, derived from org via ORG_TO_EXCO), benefitClass ('hard'|'soft'|'qualitative'|'none'), benefitClassLabel (display label), benefitFlag (data quality flags: K EUR suspect, outlier >100M, high ratio >10x, no business case). These fields enable ExCo-level analysis and Hard/Soft benefit separation across all tabs.

Updated in v5.4: benefitClass rule simplified — Hard = Column O contains "Productivity" or "Revenue Increase" with Column S > 0. Soft = all other Column O values with Column S > 0. Cost Avoidance and Process simplification/efficiency gain are now classified as Soft (previously Hard).

Updated in v5.4: ORG_RENAME normalises org names during normalize() — "Greater China (GRC)" → "Greater China", "International Regions (IR) - Overall"/"International Regions (IR)" → "International Regions", "North America (NAR)" → "North America". CoE Marketing – HS (former DMEC) reassigned from Deeptha Khanna to Julia Strandberg. PMI programmes (type="PMI") are auto-funded on top off AOP budget and excluded from prioritisation engine.

Resolve headers by normalised name and subheading, not fixed offsets. Priority before Problem Statement is submitted priority, not later risk priority. Duplicate Waste headings use subheading band. Source unit K€ is divided by 1,000 once for M€. Preserve cached results, original field labels, source sheet/row, Item No., Planisware ID and every source field.

Refresh accepts equivalent EW/Bu schemas. Unknown sheet names, duplicate/missing required headers, duplicate stable IDs or invalid requested numeric values block apply. Stable IDs with unchanged business evidence retain overrides; changed evidence marks them Needs review.

Exports use the engine v5.2.0 exact result: Scenario Summary, Portfolio, Score Evidence, Settings, Decisions and Source Reference. Session schema 4. Engine also exports EXCO_HIERARCHY, ORG_TO_EXCO, excoOf, classifyBenefit. Exports are not a separate financial engine. Refresh using the original schema; restore decisions using a checksummed portable scenario.
