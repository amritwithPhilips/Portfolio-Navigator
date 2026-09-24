# Finance processes and cost impact | v4.6

## The two pillars of IT cost

Philips AOP 2027 IT cost has two independent pillars:

| Pillar | Amount | Nature | Editable in modeler |
|--------|--------|--------|---------------------|
| **Programme demand** | ~280 M€ requested | Competitive — allocated through prioritisation | Yes (levers, manual decisions) |
| **Operations (TCO)** | 469.7 M€ | Pre-aligned — cost of running existing IT | No |

**Total IT AOP = Prioritised Programme AOP + Operations AOP**

At the default 100 M€ illustrative envelope: Total IT = 100 + 469.7 = 569.7 M€. The One Portfolio tab shows this combined figure.

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

**Requested demand** = sum of all source `IT Investment Requested 2027` values (K€ ÷ 1000 = M€). Current: 280.2 M€ (display, upward-rounded).

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

## Rounding rules

- **Display**: Upward one-decimal rounding of magnitude, preserving sign/direction. 0.0451 → 0.1, not 0.0.
- **Calculation**: Full source precision (6 decimal places internally).
- **Export**: Full precision in Excel and JSON. Display rounding in HTML only.
- **Caveat**: Independently rounded stage figures need not sum to the rounded total. This is a display artefact, not an error.

## EW / BU stream split

The Scenario tab KPI shows the EW and BU Led share of total programme allocation:

```
EW 48.9 M€ (48.9%)  |  BU Led 51.1 M€ (51.1%)
```

This split is an outcome of the merit-based allocation, not a constraint. There is no enforced 50/50 or any preset split target. Leadership may choose to adjust the split through manual decisions.
