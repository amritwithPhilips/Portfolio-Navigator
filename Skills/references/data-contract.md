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

## Benefit data loading validation (added v5.8.0)

**Root cause of v5.8.0 benefit null incident (2026-10-01)**: The modeler HTML embeds a point-in-time snapshot of the source Excel. If teams have not yet populated "Quantified Benefits (in K€)" (BU col 21, EW col 18) when the snapshot is taken, those programs are embedded with `benefit: null` and classified as Qualitative Only — suppressing all monetary benefit from ExCo totals and scoring.

**Mandatory validation on every data refresh:**

1. **Pre-build check**: Before embedding source-data JSON into the modeler HTML, run a benefit null audit:
   - Count BU rows where col 21 is null/0 and the program has a stated priority of "Must Have" or "Must Do" (these should have quantified benefit or explicit qualitative justification)
   - Count EW rows where col 18 is null/0
   - If >20% of all BU programs have null benefit, **BLOCK** the build and require the demand owner to confirm the Excel is complete
   - If any ExCo leader has 0 total benefit across all programs, flag as **DATA INCOMPLETE** — not a scoring artefact

2. **Post-embed verification**: After writing source-data JSON into the HTML, verify:
   - `sum(benefit for r in BU if r.benefit)` > 0 per ExCo leader with at least 5 programs
   - Cross-check total benefit per ExCo against the separately-generated data extract HTML (which reads from the same Excel independently)
   - Maximum allowed delta between modeler-computed total and extract-computed total: **5%** (rounding only)

3. **Data extract is the source of truth**: Always generate the data extract HTML from the current Excel before building the modeler. The extract's benefit totals are the benchmark. If the modeler and extract disagree by >5%, do not publish the modeler — patch the source-data JSON using the extract values (see v5.8.0 benefit patch procedure).

4. **Changelog entry required**: Every data refresh must include a line in CHANGELOG.md stating: `Benefit totals verified: [list per ExCo total] — matches data extract SHA [hash]`.
