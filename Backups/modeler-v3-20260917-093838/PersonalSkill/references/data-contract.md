# Complete demand and refresh contract

Project root: `C:/Users/320126040/Documents/Codex/AOP2027`.
Authoritative input: `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`.
Output data: `AOP 2027 Modeler/Data file/`.
Memory index: `Memory/AOP2027-Demand-Context.md`.

Retain exact original workbook bytes plus complete rows and formulas in AOP2027-Complete-Workbook-Snapshot.json. Workbook schema: sourceFile, sourceHash (full SHA-256), originalBase64, sheets [{name, rows, formulas keyed by A1 address}]. The original workbook is never overwritten by scenario edits.

Current source has EW and Bu. Headers are row 1, subheadings row 2, prompts row 3, demand starts row 4. Detect rows by Item No., initiative name or requested amount. Keep 509 evidence records, including 3 temporary row IDs. The source has 506 Item No. references. Blank and NBSP-only requested cells are missing: 46, not 11. Numeric benefits: 196. Recorded Decision Band: 215 Healthy, 14 Contain, 280 blank. Overall: 183 Healthy rank, 30 P1, 3 P2, 12 Contain, 1 TBD, 280 blank.

Resolve headers by normalised name and subheading, not fixed offsets. Priority before Problem Statement is submitted priority, not later risk priority. Duplicate Waste headings use subheading band. Source unit K€ is divided by 1,000 once for M€. Preserve cached results and shared formulas, original field labels, source sheet/row, original Item No., Planisware ID and every source field. Preserve missing vs zero and source requested vs handshaked/prioritised evidence.

Refresh accepts equivalent EW/Bu schemas. Unknown sheet names, duplicate/missing required headers, duplicate stable IDs or invalid requested numeric values block apply with an explicit correction message. Reject arbitrary model-output workbooks as a demand source. Do not guess mappings or silently substitute model amounts.

Validate the entire candidate before applying. Show source mapping, added/changed/removed/unchanged IDs, totals and evidence coverage. Keep prior source/scenario. Stable IDs with unchanged business evidence retain overrides; changed evidence marks them Needs review. Temporary row IDs are held on any changed source hash. Never transfer by row/name alone. Original bytes and complete values remain available for download. Blank source fields remain in the memory snapshot even when suppressed from the program popup.

Before publishing a refresh change, run a controlled equivalent-workbook test with at least one deliberate stable-record change, one addition, one removal and one unchanged decision. The preview must list every material evidence difference, including any formula recalculation caused by the workbook writer. Confirm preview before apply, changed override hold, unchanged override retention, new source hash, child scenario creation, previous revision recovery and finalisation blocked until held decisions are resolved. Refresh must not create conference checkpoints or EW/BU edit dependencies.

Exports use the engine's exact result: Scenario Summary, Portfolio, Score Evidence, Settings, Decisions and Source Reference. The separately generated baseline workbook adds Reconciliation formulas. Preserve original precision; upward-one-decimal values are a display layer only. Exports are not a separate editable financial engine. Refresh using the original schema; restore decisions using a checksummed portable scenario.
