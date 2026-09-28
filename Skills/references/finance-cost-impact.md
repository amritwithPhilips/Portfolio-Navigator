# Finance processes and cost impact | v5.2

## The two pillars of IT cost

Philips AOP 2027 IT cost has two independent pillars:

| Pillar | Amount | Nature | Editable in modeler |
|--------|--------|--------|---------------------|
| **Programme demand** | 285.1 M€ requested (472 rows) | Competitive — allocated through prioritisation | Yes (levers, manual decisions) |
| **Operations (TCO)** | 469.7 M€ | Pre-aligned — cost of running existing IT | No |

**Total IT AOP = Prioritised Programme AOP + Operations AOP**

At the default 100 M€ illustrative envelope: Total IT = 100 + 469.7 = 569.7 M€. Total AOP changes ONLY via manual user edit — ExCo trade-off Apply does not modify it. The One Portfolio tab shows this combined figure.

## Programme cost flow

```
Source requested amount (K€ in source → M€ in modeler)
  → Classification into P1/P2/P3/P4
    → Lever-controlled stage targets
      → Whole-programme allocation in ranking order
        → Final prioritised amount per programme
          → Organisation-level programme allocation
```

### Key financial calculations

**Requested demand** = sum of all source `IT Investment Requested 2027` values (K€ / 1000 = M€). Current: 285.1 M€ (472 rows after enterprise-wide charging exclusion).

**Indicative envelope** = Total AOP setting (default 100 M€). This is illustrative — no source-approved envelope exists.

**Stage targets** = lever settings applied to bucket demand or AOP:
- `% of bucket`: target = bucket_demand × percentage / 100
- `% of AOP`: target = Total_AOP × percentage / 100
- `M€ allocation`: target = entered amount directly

**Allocated amount** = sum of all programmes' `final` values. May exceed Total AOP by up to the tolerance % (default 5%).

**Demand gap** = Requested − Allocated. Shows how much demand remains unfunded.

**Over-budget variance** = max(0, Allocated − Total AOP). Displayed as a warning KPI when > 0.

## How lever changes affect cost

| Lever change | Cost impact | What moves |
|-------------|-------------|------------|
| Increase Total AOP | More budget available → more P4 programmes funded | P4 funded count goes up |
| Decrease P1 % | Less budget for LFRs → some P1 may not fit | Freed budget passes to later stages |
| Increase P2 RoI threshold | Fewer carry-overs eligible → less P2 spend | Ineligible carry-overs fall to P4 |
| Decrease P3 % | Less Sustain/Hygiene budget → Hygiene programmes unfunded first | Change & Sustain unaffected (funded first within P3) |
| Increase P4 % | More Value budget → more merit-ranked programmes funded | Lower-merit programmes get included |
| Tighten tolerance | Fewer near-boundary programmes fit | More precise but more programmes skipped |

**Budget waterfall**: Unused P1 budget does not explicitly "pass" to P2 — each stage has its own target. But the Total AOP cap is shared, so if P1 underspends, more room exists under the portfolio ceiling for later stages.

## Partial scope

A programme can be funded at less than its full request through a manual decision. This creates:
- `final` = the reduced amount (e.g., 1.5 M€ of a 3.0 M€ request)
- `unfunded` = the gap (1.5 M€)
- `status` = "Partial scope"

Partial scope is always a manual decision — the engine funds whole programmes only.

## Benefits and cost-benefit analysis

**Submitted benefits** are lifetime benefit claims from the source workbook (K€ → M€). They are:
- Never converted to annual cash
- Never adjusted by scope percentage
- Never fabricated for missing values
- Used only for merit scoring (benefit/request ratio) and the P2 RoI threshold

**Benefit/request ratio** = benefit ÷ requested. Tiers: <1x, ≥1x, ≥2x, ≥3x, ≥5x. Drives 50% of the default merit score weight.

**The modeler does not calculate ROI, NPV, IRR or payback period.** These require assumptions not present in the source data. The benefit figure is a submitted claim, not a validated financial projection.

### Hard/Soft benefit classification (v5.4)

Benefits are classified by the `classifyBenefit()` engine function using source Column O (Investment Area) and Column S (Quantified Benefits):

| Class | Condition | Areas (Column O) |
|-------|-----------|-------------------|
| **Hard** | benefit > 0 AND area is Productivity or Revenue | Revenue Increase, Productivity Savings |
| **Soft** | benefit > 0 AND any other area | Cost Avoidance, Process simplification/efficiency gain, Compliance/Keeping the lights on, Security, Enabling, and all other areas |
| **Qualitative** | No numeric benefit, has impact text | N/A |
| **None** | No benefit data | N/A |

**v5.4 change**: Cost Avoidance (8 programmes, 1,714.9 M€) and Process simplification/efficiency gain (50 programmes, 372.5 M€) moved from Hard to Soft. Total reclassified: 58 programmes, 2,087.4 M€.

Current totals (28 Sep 2026 data): Hard 159 programmes / 12,308.0 M€, Soft 140 programmes / 9,806.2 M€.

All financial displays show Hard and Soft benefits separately. KPIs: Hard (blue) / Soft (black). Data quality flags: K€ suspect, outlier (>100M€), high ratio (>10x), no business case.

## ExCo-level Operations Cost (v5.4)

Operations cost per ExCo leader is derived from the Bill of IT workbook (columns DT-FC), scaled proportionally from the raw 940.6 M€ to match the 469.7 M€ TCO total. Key values: Jie Xue 81.2 M€, Julia Strandberg 76.0 M€, Deeptha Khanna 64.9 M€, Bert van Meurs 58.2 M€, Laura Matz (IT) 18.0 M€. Tab 1 ExCo demand split table uses these values.

## Operations cost structure

Operations 469.7 M€ breaks down by allocation type:

| Component | Amount | Meaning |
|-----------|--------|---------|
| BU Own Consumption | 317.6 M€ | Direct IT costs consumed by BUs |
| From Regions | 63.5 M€ | Region IT costs allocated to BUs |
| From Functions & CoEs | 88.5 M€ | Central function costs allocated to BUs |
| **Total** | **469.7 M€** | Full operations TCO |

The TCO table on the Operations tab shows this at BU cluster → sub-org → service granularity. Year-on-year delta (Δ vs AOP2026) shows cost movement.

## Organisation IT charge (One Portfolio)

The allocation table on Tab 6 combines both pillars per organisation:

```
Organisation IT Charge = Programme Funded Amount + Operations TCO
```

Example: If Precision Diagnosis has 8.4 M€ programme funding and 85.2 M€ operations, its total IT charge is 93.6 M€.

This is the figure that flows into the Philips AOP as each organisation's IT budget line.

## ExCo-level financial aggregation (v5.2)

Every programme maps to one of 16 ExCo members via the engine's `EXCO_HIERARCHY` constant. Financial views aggregate by ExCo:

- **Tab 1 (ExCo Demand Split)**: Per-ExCo requested, prioritised, gap, % funded, hard/soft benefits, operations cost. Collapsible groups expand to show constituent organisations.
- **Tabs 3/4 (ExCo Trade-off Cockpit)**: Per-ExCo requested, funded, gap, hard/soft benefits, trade-off budget input. Apply includes/excludes P4 programmes by merit WITHOUT modifying Total AOP. Delta shows the difference between entered budget and current funded. Negative deltas exclude lowest-merit P4 programmes.
- **Total AOP protection**: The "On top off AOP" KPI on Tabs 3/4 shows the delta between actual allocation and user-set budget. Tab 2 shows "On top off: +X M€" (red) or "Under budget: X M€" (green).

## Rounding rules

- **Display**: Upward one-decimal rounding of magnitude, preserving sign/direction. 0.0451 → 0.1, not 0.0.
- **Calculation**: Full source precision (6 decimal places internally).
- **Export**: Full precision in Excel and JSON. Display rounding in HTML only.
- **Caveat**: Independently rounded stage figures need not sum to the rounded total. This is a display artefact, not an error.

## F&R / BU stream split (v5.2)

The Scenario tab and Tab 6 KPI show the F&R and BU Led share of total programme allocation:

```
F&R 52.3 M€  |  BU 47.7 M€
```

This split is an outcome of the merit-based allocation, not a constraint. There is no enforced 50/50 or any preset split target. Leadership may choose to adjust the split through manual decisions.
