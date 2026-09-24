# Philips One Portfolio Dashboard design and user journey | v4.5

Controlling design: AOP2027-OnePortfolio-v4.5.html in `AOP 2027 Modeler/`. Preserve its compact Philips header, blue controls, tabs, Frutiger/Calibri local font stack, white panels, grouped table and status colours. Primary #0B5ED7; dark #00126E; light #BDF0FF; background #FAFBFC; border #D5DAE0.

Exactly six tabs in order: Demand Overview, Program AOP Scenarios, Enterprise Wide, BU Led, Operations, AOP 2027 : One Portfolio. The order supports a natural review flow, but Enterprise Wide and BU Led have no completion, validation or unlock dependency.

## Program AOP Scenarios (Tab 2)

Sections: (1) five KPIs and horizontal funding bar with four priority segments; (2) four funding levers — P1/P3/P4 with basis toggles (% bucket, % AOP, M€), P2 with RoI threshold slider (0x–5x); four presets; advanced configuration below; save and exports; (3) LFR Demand Breakdown collapsed section (Immediate / Scheduled / CCB sub-tiers, moved-to-P4 count); (4) Carryover Baseline View collapsed section (True Carryovers with baselined cap, moved-to-P4 count); (5) Funding Prioritization Gate with one evidence gate and four priority cards; (6) Merit Score Framework, collapsed by default; (7) Demand Prioritized, open by default with multi-select BUR, Platform and Priority filters; (8) Demand Not Funded, open by default; (9) decision log, source data and rules, collapsed by default.

Lever display: "X M€ funded of Y M€ Demand" (single line, nowrap). All four funded amounts match the funding bar and KPI total.

## EW / BU Led / Overview tabs

Six stream-wide KPIs; cascading organisation, platform, demand type, area and status multi-checkbox filters plus search; full-width bubble plot; grouped editable table. OR within field, AND across fields. Filters affect chart/table/export, never funding.

## Demand tables

All demand tables open collapsed at Organisation level. Each Organisation summary reports child and funded counts, representative band, average merit, summed requested/prioritised/unfunded amounts, summed numeric benefits and evidence count. First column and header sticky during scrolling.

## Bubble chart

Original request on logarithmic y, merit on x, requested-demand bubble area. Two reference lines: actual median merit and configured merit threshold. Hover shows ID, program, Organisation, request, final, benefit, score, stage and status.

## Operations tab

Six KPIs, 3-level collapsible hierarchy (BU Cluster → Sub-Org → Services), service catalog, checkbox filters. Read-only: Operations costs are pre-aligned and do not change with programme decisions.

## One Portfolio tab

Five header KPIs (Total IT AOP, Operations AOP, Prioritised Programme AOP, Split, Committed Benefit). Organisation IT Cost Allocation table. Read-only programme table. Finalise/Fork controls. Source Decision Coverage.
