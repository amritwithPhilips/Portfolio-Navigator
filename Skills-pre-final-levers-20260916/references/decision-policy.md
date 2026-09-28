# AOP 2027 decision policy

## Source and cost basis

Use only `15926_IT AOP2027 Demand.xlsx`. Use `IT Investment Requested 2027 [kEUR]` as cost and divide by 1,000 for MEUR outputs. Preserve submitted, updated, handshaked, and prioritised amounts as separate source fields. Do not substitute one for another.

Submitted benefits are evidence claims, not approved cash flows. Preserve the original amount, text, unit, and period. Do not invent, annualize, discount, or rescale unclear values.

## Funding order

1. **LFR.** Include source Overall AOP decisions `HEALTHY / MUST-DO - P1 - Immediate` and `HEALTHY / MUST-DO - P2 - Scheduled`. Also include `EW-11` Group Functions 7.630 MEUR, `EW-65` Supply Chain 4.160 MEUR, and `EW-71` Finance 6.225 MEUR. These three are approved LFR exceptions even when their Overall AOP decision is blank. Fund P1 before P2, then the designated exceptions. Apply any user-approved LFR coverage percentage and show an obligation gap for the remainder.
2. **Sustain Engineering.** Include source rows classified as `Change & Sustain` or named CCB, after removing every LFR request. A source name may retain CCB for traceability; model labels use Sustain Engineering. Pooled proportional coverage is permitted. Reduced coverage is a capacity decision, not proof that outcomes remain deliverable.
3. **Carry-over commitments.** Give earlier consideration to eligible work already started when its usable submitted lifetime benefit meets the configured multiple of the 2027 request. Past spend alone does not justify continuation.
4. **Decommissioning and hygiene.** Reserve funding for evidenced retirement, lifecycle, technical-debt, and decommissioning work. A defined scope and supporting source text are required. Preserve unused reservation unless the user releases it.
5. **ROI-driven demand.** All remaining eligible requests compete in one pool. Fund whole affordable programs unless a reviewed amount and reason define a viable phase.

Regions have no separate funding stage. Regional ownership remains a reporting view and follows the same stage and merit rules.

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

## Allocation integrity

Record one allocation and one primary stage per request. Business-led, enterprise-wide, regional, platform, category, and technology-health views may overlap for reporting but never create another allocation.

Require a reason for every reviewed inclusion, exclusion, or amount change. Never silently overspend, change a request amount, replace a blank decision, or apply a decision to changed source evidence.

Reconcile these identities in MEUR:

- requested = allocated + requested-but-unfunded;
- envelope = allocated + unallocated;
- stage totals = portfolio allocation;
- business-led + enterprise-wide = portfolio allocation.

If LFR exceeds the envelope, stop later automatic stages and show the shortfall. A request that does not fit remains unfunded with an explicit reason; do not partially fund it unless the applicable stage permits pooled coverage or a reviewed viable amount exists.
