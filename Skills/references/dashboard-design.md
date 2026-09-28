# Philips One Portfolio Dashboard design and user journey | v5.2

Controlling design: AOP2027-IT-Portfolio-Scenario-Modelling-v5.1.html in `AOP 2027 Modeler/`. Engine v5.2.0, session schema 4. Preserve its compact Philips header, blue controls, tabs, Frutiger/Calibri local font stack, white panels, grouped table and status colours. Primary #0B5ED7; dark #00126E; light #BDF0FF; background #FAFBFC; border #D5DAE0.

Exactly six tabs in order: Demand Overview, Program AOP Scenarios, Functions & Regions, BU Led, Operations, AOP 2027 : One Portfolio. The order supports a natural review flow, but Functions & Regions and BU Led have no completion, validation or unlock dependency.

Global ExCo filter is the first filter dropdown on all programme tabs (Tabs 2, 3, 4, Overview). Cascading: ExCo Leader narrows Org options, Org narrows Platform. AND logic across fields.

## Program AOP Scenarios (Tab 2)

Sections: (1) five KPIs and horizontal funding bar with four priority segments; (2) four funding levers — P1 with LFR verified demand slider (5% tick-mark steps), P2 with RoI threshold (baseline carry-overs always funded), P3/P4 with basis toggles (% bucket, % AOP, M€); all four levers in a single row (4-column grid); input boxes centre-aligned; allocation text: amount in Philips blue bold, single line; four presets (Optimal default, blue-highlighted); advanced configuration below; save and exports; (3) LFR Demand Breakdown collapsed section; (4) Carryover Baseline View collapsed section; (5) Funding Prioritization Gate with one evidence gate and four priority cards; (6) Merit Score Framework, 5 components in single row (40/25/15/10/10 weights), collapsed by default; (7) Demand in Scenario table with collapsible BURF groups, pill toggle Prioritised/Not Funded, cascading ExCo→Org→Platform filters; (8) decision log, source data and rules, collapsed by default.

Lever display: "X M€ funded of Y M€ Demand" (single line, nowrap, amount in Philips blue bold). All four funded amounts match the funding bar and KPI total.

## Functions & Regions / BU Led / Overview tabs (Tabs 3, 4, 6)

ExCo filter first, then cascading organisation, platform, demand type, area and status multi-checkbox filters plus search. All filter dropdowns auto-close after selection. OR within field, AND across fields. Filters affect chart/table/export, never funding.

**ExCo Trade-off Cockpit** (Tabs 3 and 4 only): Below filters, default closed. Per-ExCo row: Requested, Funded, Gap, % Funded, Hard Benefits, Soft Benefits, Trade-off Budget input, Delta, Progs/Benefits impact. Apply includes/excludes P4 programmes by merit WITHOUT changing Total AOP. Reset clears all trade-off values. Negative deltas supported (enter target below current funded to model reductions).

Six stream-wide KPIs; full-width bubble plot with Y-axis pill toggle (Requested/Prioritised vs Hard Benefits on Tabs 3/4/6; no toggle on Tab 2). Right-side legend panel with per-category aggregated M€ values. Summary line on Tabs 3/4/6: "X / Y Programmes funded for a total N M€". No median/merit text on Tabs 3/4/6 (kept on Tab 2 only). Grouped editable table.

## Demand tables

All demand tables open collapsed at Organisation level. Each Organisation summary reports child and funded counts, representative band, average merit, summed requested/prioritised/unfunded amounts, summed numeric benefits and evidence count. First column and header sticky during scrolling.

## Tab 1 KPI layout (v5.2)

Row 1: Total IT AOP Demand (dark blue) | Program Demand | Operations | IT AOP 2026 (dark, showing Program AOP + Operations AOP).
Row 2: Committed Benefits (Hard green / Soft amber) | 2026 Program AOP | 2026 Operations AOP.

ExCo Demand Split table with collapsible groups replaces flat organisation list.

## Bubble chart

Original request (or Hard Benefits when Y-axis toggled) on logarithmic y, merit on x, requested-demand bubble area. Y-axis toggle is a pill-style switch (blue, matching Prioritised/Not Funded toggle). Right-side legend with per-category M€. Summary line: "X / Y Programmes funded... Committed: X Hard · Y Soft". Hover shows ID, program, Organisation, ExCo leader, request, final, benefit (Hard/Soft), score, stage and status. Two reference lines on Tab 2 only: actual median merit and configured merit threshold.

## Operations tab

Six KPIs, 3-level collapsible hierarchy (BU Cluster → Sub-Org → Services), service catalog, checkbox filters. Read-only: Operations costs are pre-aligned and do not change with programme decisions.

## One Portfolio tab

Five header KPIs in a single row: Total IT AOP (dark blue), Operations AOP (white), Prioritised Programme AOP, Split ("F&R X | BU Y M€" single-line), Committed Benefits (Hard/Soft). Organisation IT Cost Allocation table. Read-only programme table. Finalise scenario and New Working Version buttons only (Export buttons removed). New Working Version performs full reset: Optimal preset, empty overrides, empty reviews, empty trade-offs, cleared decision log.
