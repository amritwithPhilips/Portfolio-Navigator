# Understanding data through prioritization rules and guardrails | v4.6

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
| Benefit claim above 5.0x | Ratio > 5.0x without review | Inline evidence review |
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

| Component | Max points | Tiers |
|-----------|-----------|-------|
| **Submitted Benefit** (50%) | 50.0 | 0 (<1x), 20 (≥1x), 30 (≥2x), 40 (≥3x), 50 (≥5x) |
| **Submitted Priority** (25%) | 25.0 | Must Do 25, Must Have 18, Deprioritised 5, blank 0 |
| **Captured Consequence** (15%) | 15.0 | 0 (none), 5 (context), 10 (explicit harm), 15 (quantified/enterprise) |
| **Decision Band** (10%) | 10.0 | Healthy 10, Contain 6, blank 0 |

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
4. **Whole-programme tolerance**: The 5% default tolerance allows a slightly oversized programme to be funded rather than wasted budget.
5. **Carry-over cap**: P2 carry-overs are funded at min(Requested, Baselined), not full request — preventing overstatement of business-case-justified amounts.
6. **Immutable finalisation**: A finalised scenario cannot be edited. Fork it to create a new draft.
