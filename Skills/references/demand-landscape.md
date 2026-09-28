# Understanding demand | v5.2

## What demand means in this context

Demand is every IT investment request submitted by Philips business units and enterprise functions for AOP 2027. Each row in the source workbook represents one initiative — a programme, project or obligation — with a requested amount in M€, a submitting organisation, evidence fields and classification metadata.

The authoritative source is `AOP 2027 Consolidated Live.xlsx` (SharePoint ITPFM site). It contains two sheets:

- **EW (Enterprise Wide)**: Initiatives that serve the enterprise or cut across multiple business units. Renamed to "Functions & Regions" in all user-facing labels. Current: 177 rows, ~112 M€ requested.
- **Bu (BU Led)**: Initiatives owned and prioritised by individual business units. Current: 296 rows, ~173 M€ requested.

Combined: **472 demand rows, 285.1 M€ requested** (after enterprise-wide charging exclusion).

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

## ExCo accountability hierarchy (v5.2)

Every programme is mapped to one of 16 ExCo members through the `EXCO_HIERARCHY` engine constant and `ORG_TO_EXCO` reverse lookup. The `excoOf()` function handles fuzzy matching for whitespace/encoding differences. ExCo is now the primary grouping dimension alongside organisation.

**BU Leaders (10)**: Deeptha Khanna (PH), Shez Partovi (EI/I&D), Julia Strandberg (Connected Care: HPM, AM&D, SRC), Jie Xue (PD: CT, DXR, MR, PDU), Bert van Meurs (IGT-S, IGT-D, STO), Wim Appelo (ISC, STET-ISC), Ozlem Fidanci (IR, H&S), Jeff DiLullo (NAM), Ling Liu (GCR), Charlotte Hanneman (Finance, Security).

**Enterprise Function Leaders (6)**: Laura Matz (IT), Heidy Schein (People), Steve C de Baca (PS&Q), Carla Silva Peron (Medical), Filip Koek (Audit), Marnix van Ginneken (Legal, Comms, IP&S).

Regional leaders (IR/NAM/GCR) club BU+EW demand together.

## Hard/Soft benefit classification (v5.2)

The `classifyBenefit()` engine function classifies each programme's benefit:

- **Hard**: numeric benefit > 0 AND area in {Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain}. These represent quantifiable financial outcomes.
- **Soft**: numeric benefit > 0 AND area in {Compliance/Keeping the lights on, Security} or other areas. These represent qualitative value, risk avoidance, compliance.
- **Qualitative**: no numeric benefit but has impact/problem text.
- **None**: no benefit data.

Each row is enriched with `benefitClass`, `benefitClassLabel`, `benefitFlag`. Data quality flags: K EUR suspect (impact text = benefit x 1000), outlier (>100M EUR), high ratio (>10x), no business case.

ALL benefit displays across all tabs show Hard/Soft separately — never combined/mixed totals.

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
Source workbook (472 rows)
  → Normalization (engine.js: normalize)
    → Enrichment (engine.js: enrich) — adds merit score, priority stage, holds, exco, benefitClass
      → Allocation (engine.js: solve) — assigns funding in priority order
        → Session state — captures manual overrides, reviews, events
          → Six-tab dashboard — Demand Overview, Scenarios, EW, BU, Operations, One Portfolio
```

Each demand row passes through Gate 0 (evidence check) and is classified into exactly one of four priorities. The engine then allocates funding in priority order, subject to lever settings and whole-programme fit.

## Operations demand

Operations demand (469.7 M€) is separate from programme demand. It represents the pre-aligned cost of running existing IT services — Total Cost of Ownership. Operations costs do not compete with programme demand for the programme envelope; they are shown alongside it in Demand Overview and One Portfolio to give leaders a complete IT cost picture.

## Reading demand in the dashboard

- **Demand Overview (Tab 1)**: KPIs in 2 rows of 4, ExCo Demand Split table with collapsible groups showing per-ExCo requested/prioritised/gap/benefits (Hard/Soft). This is the starting point for understanding "how much are we asking for."
- **Program AOP Scenarios (Tab 2)**: Shows how demand is allocated through the four priorities. The KPIs, funding bar and levers control how the programme envelope is distributed. Lever logic: LFR→Carry-Over→Sustain→Value.
- **EW / BU (Tabs 3–4)**: Detailed per-programme view for each stream, with ExCo→Org→Platform cascading filters, ExCo Trade-off Cockpit, editable funding amounts, and bubble chart with Y-axis toggle.
- **One Portfolio (Tab 6)**: Combined programme + operations view with Total IT AOP (dark blue), F&R/BU split, Finalise and New Working Version buttons.

## Key demand metrics to watch

| Metric | Where | What it tells you |
|--------|-------|-------------------|
| Total Programme Demand | Tab 1 cards, Tab 2 KPIs | How much the organisation is asking for |
| Demand gap | Tab 2 KPI | Requested minus prioritised — the unfunded portion |
| Funded count | Tab 2 KPI, table totals | How many programmes have any allocation |
| Partial scope | Tab 2 KPI | Programmes funded below their full request |
| Missing requests | Tab 2 KPI, data quality | Rows that cannot participate in automatic allocation |
