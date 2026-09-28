# Understanding data through prioritization rules and guardrails | v5.2

## How to read a programme's funding outcome

Every programme in the modeler has a funding status. To understand **why** it has that status, trace through these layers:

### Layer 1: Classification (which priority?)

The engine classifies each programme into exactly one of four priorities based on source evidence fields. The classification is deterministic — it cannot be overridden by lever settings.

| Priority | Gate | Key fields checked |
|----------|------|--------------------|
| P1: Legal & Compliance | Overall AOP = "must-do - P1/P2" AND LFR Name present AND LFR Year present | `overall`, `lfrName`, `lfrYear` |
| P2: High-Value Carry-Overs | New/Carry-over = "Carry Over" AND Baselined > 0 AND Priority = Must Do/Must Have AND Category ≠ Decomm | `newCarry`, `baselined`, `priority`, `category` |
| P3: Sustain & Hygiene | New/Carry-over = "Change & Sustain" OR Category = CI/Upgrades | `newCarry`, `category` |
| P4: Value Based Portfolio | Everything else (catch-all) | Residual |

**Guardrail**: Programmes that look like P1 or P2 but fail the evidence gate are pushed to P4, not held in their original priority. This is the "eligible-only bucket" principle — P1 and P2 contain only fully-evidenced demand.

### Layer 2: Evidence holds (can it be funded automatically?)

Even within the correct priority, a programme can be **held** from automatic funding if evidence is incomplete:

| Hold | Condition | Resolution |
|------|-----------|------------|
| Program name missing | `name` is blank | Source must be updated |
| No positive requested demand | `cost` is null, zero or negative | Source must supply a positive amount |
| Mandatory priority TBD | Overall AOP says "Priority TBD" | Source must resolve timing |
| Overall AOP decision needs mapping | Unrecognised decision text | Source must use standard values |
| Contain condition needs review | Contain band without recorded condition | Inline evidence review |
| Numeric benefits missing | P3/P4 with no benefit figure | Source must supply benefits |
| Benefit claim above 10.0x | Ratio > 10.0x without review | Inline evidence review |
| Below Carryover threshold | P2 carry-over below RoI slider | Adjust slider or accept manually |
| Below advanced merit floor | P4 below configured merit threshold | Adjust floor or accept manually |

**Guardrail**: Holds prevent automatic selection but do not delete the programme. It remains visible in the unfunded table with its hold reason. A manual override can still fund a held programme (logged as a "manual evidence exception").

### Layer 3: Ranking (what order within each priority?)

Within each priority, programmes compete by merit:

| Priority | Ranking method |
|----------|---------------|
| P1 | P1 Immediate → P2 Scheduled → CCB exceptions; evidence strength within each tier |
| P2 | Benefit/cost ratio → payback → consequence → merit score |
| P3 | Change & Sustain first (all funded), then Hygiene by merit |
| P4 | Evidence strength (benefit + impact preferred), then merit score |

### Layer 4: Fit (does it fit the budget?)

Programmes are funded as **whole initiatives** in ranking order. A programme is skipped if:
- Adding it would exceed the stage target × (1 + tolerance%)
- Adding it would exceed the Total AOP × (1 + tolerance%)

**Guardrail**: The skipped programme stays in the queue — the engine tries the next-ranked programme. There is no forced partial allocation. Skipped programmes appear as "Whole program does not fit stage target" in the unfunded table.

## Merit score breakdown

Merit is a 0–100 composite score used for ranking within priorities:

| Component | Weight | Max points | Tiers |
|-----------|--------|-----------|-------|
| **Submitted Benefit** (40%) | 40 | 50.0 | 0 (<1x), 15 (1-3x), 25 (3-5x), 35 (5-7x), 50 (>=7x). Hybrid: quantitative ratio -> revenue/productivity block -> qualitative fallback (max 30) |
| **Submitted Priority** (25%) | 25 | 25.0 | Must Do 25, Must Have 18, Deprioritised 5, blank 0 |
| **Captured Consequence** (15%) | 15 | 15.0 | 0 (none), 5 (context), 10 (explicit harm), 15 (quantified/enterprise) |
| **Decision Band** (10%) | 10 | 10.0 | Healthy 10, Contain 6, blank 0 |
| **Payback** (10%) | 10 | 10.0 | <=1yr 10, <=2yr 8, <=3yr 6, <=5yr 4, >5yr/missing 0 |

Each component: `raw_points / max_points × configured_weight`. Total = sum of weighted components.

**Guardrail**: Weights must total 100.0. Adjusting weights (in Advanced Configuration) rescales every programme's score. The median merit line on the bubble chart moves with the filtered population; the threshold line reflects the configured merit floor.

## Reading the funding status

| Status | Meaning | Where to investigate |
|--------|---------|---------------------|
| **Funded** | Full request allocated | Check which priority stage funded it |
| **Partial scope** | Less than full request allocated | Manual decision — check decision log |
| **Excluded** | Manually excluded (0 allocation) | Manual decision — check decision log |
| **Not funded** | No allocation, no manual exclusion | Check holds and ranking position |

## Guardrails that protect data integrity

1. **No silent refill**: Excluding a funded programme does not automatically fund the next one. The freed budget appears as "Open to prioritisation."
2. **No zero substitution**: Missing requests and benefits stay as missing — never treated as zero.
3. **No inferred decisions**: Blank Decision Band and blank Overall AOP decision are "Unassessed" — the engine does not guess.
4. **Whole-programme tolerance**: The 0% default tolerance (changed from 5% in v4.5) allows a slightly oversized programme to be funded rather than wasted budget.
5. **Carry-over cap**: P2 carry-overs are funded at min(Requested, Baselined), not full request — preventing overstatement of business-case-justified amounts.
6. **Immutable finalisation**: A finalised scenario cannot be edited. Fork it to create a new draft.
7. **Total AOP protection**: Total AOP changes ONLY when the user manually edits the budget input. ExCo trade-off Apply buttons include/exclude programmes by merit without modifying Total AOP. The "On top off AOP" KPI shows any delta between actual allocation and the user-set budget.
8. **ExCo trade-off constraints**: Trade-off budget inputs affect only P4 programmes within the selected ExCo leader's demand. Negative deltas (target below current funded) exclude lowest-merit P4 programmes. All trade-off decisions are logged. Reset clears all entered values.

## Hard/Soft benefit separation (v5.2)

All benefit displays across all tabs show Hard and Soft benefits separately, never as combined totals:

- **Hard benefits**: Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain. Quantifiable financial outcomes.
- **Soft benefits**: Compliance/Keeping the lights on, Security, and all other areas. Qualitative value and risk avoidance.

KPIs show Hard (green) / Soft (amber). Chart summary: "Committed: X Hard . Y Soft". Bubble tooltips show benefit classification. ExCo Demand Split and Trade-off Cockpit both display Hard/Soft columns.
