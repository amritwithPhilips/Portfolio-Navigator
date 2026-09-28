# AOP 2027 decision policy

## Source and cost basis

Use only `15926_IT AOP2027 Demand.xlsx`. Use `IT Investment Requested 2027 [kEUR]` as cost and divide by 1,000 for MEUR outputs. Preserve submitted, updated, handshaked, and prioritised amounts as separate source fields. Do not substitute one for another.

Submitted benefits are evidence claims, not approved cash flows. Preserve the original amount, text, unit, and period. Do not invent, annualize, discount, or rescale unclear values.

## Funding order

1. **LFR.** Include source Overall AOP decisions `HEALTHY / MUST-DO - P1 - Immediate` and `HEALTHY / MUST-DO - P2 - Scheduled`. Also include `EW-11` Group Functions 7.630 MEUR, `EW-65` Supply Chain 4.160 MEUR, and `EW-71` Finance 6.225 MEUR. These three are approved LFR exceptions even when their Overall AOP decision is blank. Fund P1 before P2, then the designated exceptions. Apply any user-approved LFR coverage percentage and show an obligation gap for the remainder.
2. **Sustain Engineering.** Include only source rows whose `New initiative or Carry-over` value is exactly `Change & Sustain`, after removing LFR. Never add all requests below 0.200 MEUR and never infer the stage from an initiative name containing CCB. Source wording remains visible for traceability.
3. **Hygiene.** Include the following exact source Category variants after removing LFR and Sustain Engineering: `Decomm/Replatforming`, `Decommissioning`, `Continuous Improvement`, `Continous Improvement`, `Continuous Improvement (CI)`, and `Upgrades & Enhancements`.
4. **Carryover.** From remaining source carryover rows, require a numeric `Quantified Benefits (in K€)` value and a benefit/request multiple at or above the configured threshold. Default is 2x; the visible slider runs from 1x to 5x+ in 0.5x steps. Past spend alone does not justify continuation. Minimum Merit Score does not gate this stage.
5. **ROI-Based Portfolio.** All remaining initiatives with numeric benefits compete in one pool. AI initiatives belong here unless an earlier stage applies. Allocate all remaining AOP capacity using merit rank. Rows without numeric benefits remain visible as `Evidence missing / not eligible`.

Regions have no separate funding stage. Regional ownership remains a reporting view and follows the same stage and merit rules. The five stages are mutually exclusive and evaluated in the order above.

## Decision evidence

Use the source Decision band and Overall AOP decision as recorded. Do not recompute the nine underlying waste dimensions for recommendations.

- `HEALTHY - Rank in priority matrix`: eligible to compete, subject to other evidence and affordability rules.
- `CONTAIN - Conditions`: eligible only when the source condition or a reviewed condition is recorded and carried into the decision explanation.
- `HEALTHY / MUST-DO - P1 - Immediate`: LFR, first sequence.
- `HEALTHY / MUST-DO - P2 - Scheduled`: LFR, second sequence.
- `HEALTHY / MUST-DO - priority TBD`: hold pending a reviewed priority unless the user explicitly decides otherwise.
- Blank: unassessed. Keep visible; do not infer Healthy.

## Merit score

Merit totals 100 points for discretionary ordering:

| Dimension | Maximum | Rule |
| --- | ---: | --- |
| Submitted lifetime benefit / requested investment | 50 | Missing or below 1x: 0; 1x to below 2x: 20; 2x to below 3x: 30; 3x to below 5x: 40; 5x or more: 50. Claims above 5x require review before benefit-led automatic allocation. |
| Submitted priority | 25 | Must Do: 25; Must Have: 18; Deprioritised: 5; blank or unrecognised: 0. A Must Do label alone does not create LFR status. |
| Captured Consequence | 15 | Score only from `Impact and Cost of Not Doing`, `Problem Statement`, and `Scope` using the levels below. |
| Decision band | 10 | Healthy: 10; Contain: 6; other or blank: 0. Overall AOP decision conditions still apply. |

Captured Consequence levels:

- 0: no usable consequence in the three source fields.
- 5: a general consequence, problem, or scope is stated, but the harm of not proceeding is unclear.
- 10: the evidence identifies an affected activity or stakeholder and an explicit operational, compliance, customer, financial, or delivery harm.
- 15: level 10 plus a source-stated quantified impact or enterprise, global, multi-region, or company-wide reach.

Retain the exact supporting passages and which of the three fields supplied them. Dependencies identify prerequisites and add no consequence points.

## Lever controls

LFR, Sustain Engineering and Hygiene each have a switchable basis: `% of bucket demand` or `% of Total AOP`. The percentage and resulting MEUR target are visible together. Carryover has only the ROI eligibility threshold. ROI-Based Portfolio automatically receives all AOP remaining after the four reservations.

Keep Minimum Merit Score and the four merit weights in collapsed Advanced configuration. The threshold excludes weak ROI-pool demand; it is not a primary business lever.

## Allocation integrity

Record one allocation and one primary stage per request. Business-led, enterprise-wide, regional, platform, category, and technology-health views may overlap for reporting but never create another allocation.

Fund whole initiatives in priority order. Do not proportionally fund or split an initiative. A configurable tolerance, default 5%, permits the automatic scenario to include a whole initiative slightly above a lever target or Total AOP. Show target-versus-selected delta for each reserved stage and for the portfolio.

BU-led and EW conference choices sit on top of the prioritized view. Require a reason for every manual inclusion or exclusion. An inclusion adds the whole initiative without displacing an automatically selected initiative. It may make the final scenario exceed Total AOP; do not block finalisation, but show the over-budget variance prominently. Exclusion removes the initiative without silently reallocating the frozen scenario.

Reconcile these identities in MEUR:

- requested = allocated + requested-but-unfunded;
- envelope = allocated + unallocated when within budget, or allocated - over-budget variance when above budget;
- stage totals = portfolio allocation;
- business-led + enterprise-wide = portfolio allocation.

If an earlier stage consumes the automatic budget plus tolerance, stop later automatic stages and show the shortfall. A request that does not fit remains unfunded with an explicit reason. Finalising freezes the scenario; Refresh starts a new version from the current authoritative source and settings.
