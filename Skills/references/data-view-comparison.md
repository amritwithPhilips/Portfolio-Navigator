# Comparing changes across data views | v5.2

## How the same data appears differently

The modeler shows 472 programme rows and 469.7 M€ operations through six tabs. Each tab, filter and lever setting produces a different **view** of the same underlying scenario. Understanding what changes — and what stays constant — is essential for accurate comparison.

## Tab-level views

| Tab | Scope | Rows shown | Editable | Operations |
|-----|-------|------------|----------|------------|
| Demand Overview | All 472 | All | No | Yes (469.7 M€) |
| Program AOP Scenarios | All 472 (split: prioritized + unfunded) | All | Levers only | No |
| Functions & Regions | F&R stream only (~177) | F&R | Yes (amounts, inclusions) | No |
| BU Led | BU stream only (~296) | BU | Yes (amounts, inclusions) | No |
| Operations | None (operations only) | Services/TCO | No | Yes |
| One Portfolio | All 472 + operations | All | No (read-only) | Yes |

**Key insight**: F&R and BU are independently editable views of the **same scenario**. A change in F&R immediately updates the Scenario tab, Overview tab, and all KPIs. There is no separate "F&R scenario" and "BU scenario."

**ExCo dimension (v5.2)**: Every programme maps to one of 16 ExCo members. ExCo filter is the first dropdown on all programme tabs, cascading to Org and Platform. The ExCo Trade-off Cockpit on Tabs 3/4 adds per-leader budget negotiation — enter a target, Apply includes/excludes P4 by merit WITHOUT changing Total AOP.

## Filter-level views

Each tab with filters shows a subset of its rows. Filters affect:
- The table (which rows are visible)
- The bubble chart (which points are plotted)
- The export (filtered rows only)
- The total row (now shows "X of Y" with v4.6)

Filters do **not** affect:
- Funding decisions (filtering never changes who is funded)
- KPI cards (always show full-scope numbers)
- Other tabs (each tab has independent filters)

### Reading the "X of Y" total row (v4.6)

When any filter is active, every total row across all tabs switches to show the filtered value against the unfiltered baseline:

**Engine tables** (F&R, BU, Overview, Prioritized):
```
No filter:  All displayed BURFs (69/180)   111.7 Avg 0.7    48.9 Avg 0.3
Filtered:   All displayed BURFs (1/3 of 180)   0.8 of 111.7    0.2 of 48.9
```

**v4.3 tables** (Demand Split, TCO, Service Catalog):
```
No filter:  Total   472   280.2   469.7   749.9
Filtered:   Total   3 of 472   4.2 of 280.2   9.1 of 469.7   13.3 of 749.9
```

The denominator is always the full unfiltered set for that table. When filters are cleared, the display reverts to the normal format (averages for engine tables, plain totals for v4.3 tables).

### Filter dimensions

**Engine tables** (F&R, BU, Overview): 6 filters + search
- ExCo Leader, BURF Organisation, IT Platform, New/Carryover/Sustain, Investment Area, Funding Status
- Cascading: each filter's option counts reflect the other active filters
- OR within a field, AND across fields

**Demand in Scenario table** (Scenario tab): 3 filters with collapsible BURF groups and pill toggle
- ExCo, Organisation, Platform (cascading). Pill toggle: Prioritised / Not Funded views.

**v4.3 tables** (Demand Split, TCO, Service Catalog): 1–2 filters
- Organisation, Platform (where applicable)

## Lever-level views

Changing a lever or preset recalculates the entire scenario:

| Control | What changes | What stays |
|---------|-------------|------------|
| Total AOP slider | Budget envelope, all funding amounts | Source demand, evidence, merit scores |
| P1/P3/P4 basis + % | Stage target amounts, funded programmes | Classification (which priority each programme belongs to) |
| P2 RoI threshold | Carry-over eligibility | Non-carry-over programmes |
| Merit floor | P4 eligibility | P1/P2/P3 programmes |
| Weights | Merit scores for all programmes | Source evidence, classification |
| Preset buttons | All lever settings at once | Manual overrides (retained) |

### Comparing presets

The Scenario tab includes a preset comparison table showing all four presets side by side with their allocated and unfunded totals at the current Total AOP. Use this to understand the trade-off space before adjusting individual levers.

## Manual decision views

Manual overrides (include/exclude/partial scope) are visible in:
- The programme row's funding status and amount columns
- The decision log (bottom of Scenario tab)
- The "Decision delta" in the KPIs (addition/reduction vs automatic)
- The `Return to automatic` button on each overridden row

When comparing "before and after" a manual decision, the key metrics to check are:
1. **Allocation KPI**: Did total funded go up or down?
2. **Over/Within budget**: Did the decision push over the envelope?
3. **Stream split KPI**: Did the F&R/BU balance shift?
4. **The specific programme's status**: Funded, Partial scope, Excluded, or Not funded

## Cross-tab consistency checks

Because all tabs share one scenario, these equalities always hold:

- F&R funded + BU funded = Portfolio funded (Overview)
- Prioritized table rows = all programmes with final > 0
- Unfunded table rows = all programmes with final = 0 or unfunded > 0
- Tab 1 programme demand = Tab 6 programme demand. Benefits always shown as Hard/Soft separately, never combined.
- Sum of stage allocations = total portfolio allocation
- Operations 469.7 M€ is constant across Demand Overview, Operations, and One Portfolio

If any of these appear inconsistent, it's a filter effect — check whether filters are active on one tab but not the other.

## ExCo Trade-off Cockpit views (v5.2)

The Trade-off Cockpit on Tabs 3 and 4 (below filters, default closed) provides per-ExCo leader budget modelling:

| Column | What it shows |
|--------|--------------|
| Requested | Total demand for that ExCo's organisations |
| Funded | Currently prioritised amount |
| Gap | Requested minus Funded |
| % Funded | Funded / Requested |
| Hard Benefits | Sum of hard benefit claims |
| Soft Benefits | Sum of soft benefit claims |
| Trade-off Budget | User-entered target budget |
| Delta | Trade-off budget minus current funded |
| Progs/Benefits impact | Count + Hard/Soft M EUR added or removed |

Apply includes/excludes P4 programmes by merit. Reset clears all values. Negative deltas supported.

## Hard/Soft benefit columns (v5.2)

All benefit displays across all tabs show Hard and Soft separately:
- **KPIs**: Hard (green) / Soft (amber)
- **Chart summary**: "Committed: X Hard . Y Soft"
- **Bubble tooltip**: Shows benefit classification (Hard Benefit / Soft Benefit / Qualitative Only / No Benefit Data)
- **ExCo Demand Split** (Tab 1): Hard/Soft columns per ExCo group and org sub-row
- **Trade-off Cockpit** (Tabs 3/4): Hard/Soft columns per ExCo leader
