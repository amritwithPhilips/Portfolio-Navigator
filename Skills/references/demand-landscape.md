# Understanding demand | v4.6

## What demand means in this context

Demand is every IT investment request submitted by Philips business units and enterprise functions for AOP 2027. Each row in the source workbook represents one initiative — a programme, project or obligation — with a requested amount in M€, a submitting organisation, evidence fields and classification metadata.

The authoritative source is `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`. It contains two sheets:

- **EW (Enterprise Wide)**: Initiatives that serve the enterprise or cut across multiple business units. Current: 180 rows, 111.7 M€ requested.
- **Bu (BU Led)**: Initiatives owned and prioritised by individual business units. Current: 341 rows, 168.6 M€ requested (display: 167.9 M€ due to rounding).

Combined: **521 demand rows, 280.2 M€ requested** (display values, upward one-decimal rounding).

## Demand types

Every initiative has a `New/Carry-over` classification:

| Type | Meaning | Count (approx.) |
|------|---------|-----------------|
| **New** | First-time request for AOP 2027 | ~200 |
| **Carry Over** | Continuation of a prior-year approved programme | ~130 |
| **Change & Sustain** | Ongoing engineering needed to keep current systems running | ~90 |

Carry-overs with a confirmed baseline (Carry Over Baselined > 0) are treated differently from carry-overs without one. Only baselined carry-overs with Must Do/Must Have priority qualify for the dedicated P2 funding stage.

## Investment areas and categories

Demand is further classified by:

- **Category**: Legal and Compliance, Continuous Improvement, Upgrades & Enhancements, Decomm/Replatforming, AI Enablement, New Features, etc. Category drives which funding priority a programme enters.
- **Investment area**: Business-defined grouping (e.g., Digital Commerce, Supply Chain, R&D Platform). Used for filtering, not for funding order.
- **Leading IT Platform**: The primary technology platform (e.g., Commercial IT, Services & Solutions IT). Used for filtering and organisation-level analysis.

## Data quality indicators

Not all demand rows are complete:

| Gap | Count | Impact |
|-----|-------|--------|
| Missing requested amount | 46 | Cannot be automatically funded; visible but excluded from allocation |
| Missing Decision Band | 280 | Unassessed — no band score contribution; not an adverse judgement |
| Missing Overall AOP decision | 280 | Unassessed — holds automatic funding for that row |
| Missing benefits | ~313 | No benefit/request ratio; affects merit score and P2 eligibility |

These gaps are **kept visible** — they are never filled with zero or inferred. The Demand Overview tab's Data Quality card surfaces these counts.

## How demand flows through the modeler

```
Source workbook (521 rows)
  → Normalization (engine.js: normalize)
    → Enrichment (engine.js: enrich) — adds merit score, priority stage, holds
      → Allocation (engine.js: solve) — assigns funding in priority order
        → Session state — captures manual overrides, reviews, events
          → Six-tab dashboard — Demand Overview, Scenarios, EW, BU, Operations, One Portfolio
```

Each demand row passes through Gate 0 (evidence check) and is classified into exactly one of four priorities. The engine then allocates funding in priority order, subject to lever settings and whole-programme fit.

## Operations demand

Operations demand (469.7 M€) is separate from programme demand. It represents the pre-aligned cost of running existing IT services — Total Cost of Ownership. Operations costs do not compete with programme demand for the programme envelope; they are shown alongside it in Demand Overview and One Portfolio to give leaders a complete IT cost picture.

## Reading demand in the dashboard

- **Demand Overview (Tab 1)**: High-level cards showing programme and operations totals, data quality, and the organisation split table. This is the starting point for understanding "how much are we asking for."
- **Program AOP Scenarios (Tab 2)**: Shows how demand is allocated through the four priorities. The KPIs, funding bar and levers control how the 100 M€ (illustrative) envelope is distributed.
- **EW / BU (Tabs 3–4)**: Detailed per-programme view for each stream, with filters and editable funding amounts.
- **One Portfolio (Tab 6)**: Combined programme + operations view showing each organisation's total IT charge.

## Key demand metrics to watch

| Metric | Where | What it tells you |
|--------|-------|-------------------|
| Total Programme Demand | Tab 1 cards, Tab 2 KPIs | How much the organisation is asking for |
| Demand gap | Tab 2 KPI | Requested minus prioritised — the unfunded portion |
| Funded count | Tab 2 KPI, table totals | How many programmes have any allocation |
| Partial scope | Tab 2 KPI | Programmes funded below their full request |
| Missing requests | Tab 2 KPI, data quality | Rows that cannot participate in automatic allocation |
