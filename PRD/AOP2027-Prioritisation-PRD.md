# AOP 2027 IT portfolio prioritisation

## Product requirements and conference decision model

**Decision proposal for the final build**  
**Version 1.0 · 15 September 2026**

### Executive recommendation

Build one portfolio decision process with three explicit reservations: validated Legal, Fiscal and Regulatory requirements first, Change and Sustain second, and Region demand third. All remaining eligible demand should compete in a single common pot. BU Led and EW Led should be reporting views of those decisions by default. Separate BU and EW ceilings should remain available as an explicit constrained scenario, with the effect on enterprise value shown.

Adopt configurable scoring with two named profiles. **Reference** reproduces the proposed five dimensions so stakeholders can compare the result with their current approach. **Recommended** gives 30 points to comparable benefits and 25 to impact and cost of not doing. It reduces the combined weight of submitted priority, category and investment area, and awards no points for missing evidence. This directly addresses an important gap in the proposed framework: cost of not doing currently has no scoring dimension.

A score establishes merit. A funding decision additionally requires a valid scope, an affordable amount, evidence appropriate to the decision and satisfaction of dependencies. Mandatory protection comes from validation, not from the label “Protected” or a high score.

The product should help BU Conference and Function Conference choose a feasible portfolio, explain the programs displaced by each choice, and record an agreed amount, reason and accountable approver for every decision. Scenarios and scoring policy must be versioned so that conference participants compare the same source data and assumptions.

### Decisions requested for the final build

- Approve the three-reservation sequence and one common demand pot.
- Pilot the recommended six-dimension profile alongside the reference five-dimension profile.
- Use merit-first selection as the conference baseline, with a verified-value alternative for comparison.
- Approve the initial Region reservation policy. This PRD proposes 10% of the total envelope as a starting sensitivity assumption, not a Philips-approved allocation.
- Confirm the LFR minimum scope amounts and Change and Sustain baseline before finalising their reservation percentages.
- Agree conference approval rights and the evidence needed to move a provisional score into an approved funding decision.

<!-- PAGE -->

## 1 Product scope and current position

### Intended users and outcomes

BU leaders need to see which outcomes receive funding, which are deferred and what their budget changes displace. Function leaders and IT platform owners need to validate shared capabilities, service commitments and cross-BU dependencies. Finance needs one reconciled portfolio with comparable benefits and approved costs. Legal, Tax and Compliance need to confirm mandatory obligations and their minimum viable scope. The portfolio office maintains the program register, scenarios and decision history.

These are proposed product responsibilities. The conference sponsors must assign named owners and approval authority before the final build is used for binding commitments.

### Current file and proposed final product

| Area | Current recreated HTML | Final product requirement |
|---|---|---|
| Funding structure | BU and EW ceilings by default; shared-fund option | LFR, Change and Sustain and Region reservations; common pot by default |
| Scoring | Stored v3 scores; source-adjusted benefits drive competitive selection | Recalculate configurable reference and recommended profiles from versioned evidence |
| Levers | Strategic BU allocation, hygiene, CCB and revenue margin | Three reservations, total envelope, scoring policy and eligibility rules |
| Manual decisions | Shared opt-in, opt-out and amount changes | Add reason, evidence version, decision authority and approval history |
| Data | Embedded HTML dataset and conservative source matches | Updated workbook import with permanent IDs, explicit exceptions and reconciliation |
| Conferences | Live modelling and saved scenarios | Baseline, conference working copy, comparison, conditional decisions and approved snapshot |

The current HTML is a prototype for interaction and arithmetic. It does not implement all requirements in this PRD. The scored workbook is a comparison and preparation artifact; its scores do not constitute funding approval.

### Scope of the final build

Include demand import, data review, reservations, configurable scores and tiers, scenario comparison, program-level explanations, constrained selection, conference decision capture and consistent exports. Preserve the existing visual language and main portfolio views. Add the necessary workflow inside **AOP2027 Scenario Modelling** and the program review interaction.

Exclude automatic interpretation of legal obligations, invented benefit amounts, automatic approval from narrative text, and unrestricted percentage cuts to indivisible programs. Live simultaneous editing requires shared storage and access controls; a standalone HTML file cannot provide reliable multi-user approval history on its own.

<!-- PAGE -->

## 2 Source evidence and reconciliation

### Workbook findings

The source workbook contains **BU Demand**, **EW Demand**, **BU Led Waste Matrix** and **EW Waste Matrix**. Its request amounts reconcile to **279.995 M€**: **167.896 M€ BU Led** and **112.099 M€ EW**. Requested, updated, handshaked and prioritized amounts are separate measures and must not be substituted silently.

The scored workbook retains **506 source records**: 502 rows with item numbers plus four EW requests with no item number. Of these, **481 have a program name** and receive provisional scores; **25 unnamed records** remain visible and are not scored. The four EW requests without item numbers total **4.650 M€**: ISC Hardware Refresh 3 Sites, ISC Stable MES, Agent Atelier, and Innovation & AI Atlas. Temporary source-row labels identify them pending permanent IDs.

This differs from the current HTML’s 485-program representation. Reconcile the two representations before migrating conference decisions. Do not assume that the difference represents new or deleted programs.

| Evidence check | Finding | Product consequence |
|---|---:|---|
| Numeric benefit entries | 189 | Preserve units; numeric format does not establish finance approval |
| Narrative benefit entries | 102 | Retain text and request a reviewed amount; do not parse every number as benefit |
| Strict waste matches | 328 | Match on normalised name, organisation and stream |
| Ambiguous or organisation-different matches | 13 | Require explicit reconciliation |
| No exact waste match | 165 | Keep visible as unassessed; do not assign another program’s evidence |
| Matched records marked validated must-do | 34 | Current requests total 18.507 M€; minimum-scope cost still needs confirmation |

Of the 328 strict matches, 139 have a Healthy band, six have Contain and 183 have no populated band. The waste tabs contain illustrative examples; these are excluded from real demand scoring. Source remarks on examples do not override their actual assessment values or the user’s requirements.

### Import requirements

Preserve source sheet and row, item number, Planisware ID, name and version. Append continuation text to the correct program without treating it as another request. Create a review record for an independently costed row without an ID. Match waste evidence conservatively and display candidate matches for confirmation.

Use source requested investment for the delivered score comparison. Keep EW “Requested Budget Updated” separately until its authority is confirmed. An agreed scope amount may override the scoring investment in the scored workbook, with a recorded reason. Preserve original text and values for audit.

<!-- PAGE -->

## 3 Comparison with the attached scenario model

The screenshot shows funding percentages of individual tranches against a 100.000 M€ envelope. Those percentages have a different denominator from the proposed reservations, which are percentages of the total envelope.

| Screenshot tranche | Funding shown | Allocated M€ | Recommended treatment |
|---|---:|---:|---|
| P1 Mandatory and compliance | 100% | 36.7 | Protect validated minimum scope; validate the obligation and cost |
| P2 Evidenced value | 72% | 42.3 | Select whole viable programs or approved phases from the common pot |
| C2 Change and Sustain | 60% | 11.5 | Establish an approved service baseline and priced work packages |
| C3 Long tail at or below 0.250 M€ | 30% | 5.8 | Consolidate governance where useful; retain program-level merit and traceability |
| C1 Placeholder or reservation | 0% | 0.0 | Hold pending scope and owner; release unsupported reservations |
| C4 Unevidenced new initiative | 0% | 0.0 | Request evidence or record deferral; lack of evidence does not prove no harm |
| C5 Unevidenced carry-over | 5% | 3.7 | Review sunk cost, remaining obligation and viable exit or continuation options |

The rounded funded amounts sum to 100.0 M€. Adding the rounded reductions shown in the screenshot implies approximately 301.5 M€ of original tranche demand. That differs from the attached workbook’s 279.995 M€ and must not be treated as a reconciled dataset. The screenshot’s P1 amount is also not equivalent to the 18.507 M€ current request total for the 34 strict matched, validated records.

### Scenario button comparison

**Recommended Evidence-led reset** is the only preset whose percentages are visible: 100%, 72%, 60%, 30%, 0%, 0% and 5% in the displayed order. Retain it as a legacy benchmark, with its source version and tranche definitions.

**Evidenced core only bands A and B** should become a named score-floor scenario, with explicit evidence gates. The screenshot alone does not reveal its exact underlying parameters. **Flat 33% haircut** should remain a diagnostic affordability comparison; its title would normally mean 67% retained, but the underlying button logic must be checked before claiming exact equivalence. **Reset to full demand** should show the submitted-demand benchmark and funding gap, without implying approval.

The final product should avoid arbitrary partial funding. A 72% allocation to a tranche does not establish that each program can deliver 72% of its outcome at 72% of its cost.

<!-- PAGE -->

## 4 Recommended funding sequence

### One classification per funded amount

Assign each viable program or separately costed phase to one funding route in this order: validated LFR, Change and Sustain, Region, then common pot. Tags may overlap, but money must not. A Region regulatory program funded through LFR remains visible in the Region view without receiving a second Region allocation.

**LFR reservation.** Fund the validated minimum solution for an applicable Legal, Fiscal or Regulatory obligation. Require the named instrument, confirmation of applicability, independent validation, deadline and minimum scope cost. A high score or a submitted Must Do label is insufficient. Waste concerns on mandatory work require a compliant alternative or reduced scope; they do not erase the obligation.

**Change and Sustain reservation.** Cover an approved service baseline using 2026 actual consumption, contracted commitments, service-level requirements and a priced 2027 work plan. Separate the minimum service floor from discretionary enhancements. CCB is a subset of this reservation, not an additional pot. Include approved mandatory security or continuity service requirements through the relevant evidenced route; do not assume that every CCB request is equally essential.

**Region reservation.** Allocate a configurable share to explicitly attributed Region demand that has not already been funded through LFR or Change and Sustain. Region origin must be confirmed rather than inferred permanently from a BU or function name. Rank within this reservation using the same scoring and evidence rules as the common pot.

**Common demand pot.** All other eligible demand competes together, including BU, Function, enterprise-wide, hygiene, AI, new initiatives and carry-overs. Carry-over status alone confers no reservation. Unfunded eligible Region demand can compete here after the Region reservation is allocated. Discretionary Change and Sustain enhancements can compete here once separated from the service floor.

### Reservation arithmetic

For total envelope B, each reservation amount is its percentage multiplied by B. All three percentages use the same denominator. Their planned sum must not exceed 100%. The planned common pot is B minus the three reservations.

The LFR reservation must cover confirmed minimum scope. If it is insufficient, display the shortfall and require a revised allocation or an explicit unresolved exception. Never silently reduce mandatory scope. Apply the same rule to confirmed minimum service commitments.

Unused reservation returns to the common pot after its owner confirms that all eligible obligations or reserved demand have been considered. Actual funding may therefore be lower than the planned reservation. Show planned reserve, allocated amount, released amount and outstanding obligation separately.

<!-- PAGE -->

## 5 Final recommended lever set

| Navigation in Scenario Modelling | Definition and recommended default |
|---|---|
| Set envelope | Total IT investment available for 2027. Start comparison at 168.000 M€, matching the current HTML; obtain the approved conference amount. |
| Reserve LFR | Percentage of total envelope. Suggest confirmed minimum LFR cost divided by envelope; no arbitrary fixed percentage. |
| Reserve Change and Sustain | Percentage of total envelope. Suggest approved 2027 baseline divided by envelope; show service floor separately. |
| Reserve Region demand | Percentage of total envelope. Proposed starting scenario 10%; compare 15%. Requires policy approval. |
| Review common pot | Calculated balance after reservations and released unused amounts; not an independent competing budget input. |
| Scoring policy | Reference five dimensions or Recommended six dimensions; all weights, tiers, ratio boundaries and band thresholds configurable. |
| Minimum common merit | Recommended starting score 45; evidenced-core sensitivity uses 65. The threshold does not override evidence gates. |
| Benefit assumptions | Common period, benefit class, approved margin and probability treatment. Proposed revenue-margin fallback 15%, visibly provisional. |
| Selection approach | Merit-first baseline; verified-value alternative for comparison. Preserve the chosen objective in each scenario. |
| Funding constraints | One common portfolio by default. Optional BU/EW ceilings, capacity limits or explicit ownership constraints only when approved. |

Percentages support slider movement and direct numeric entry, including decimals. Currency uses M€ in the application. Source K€ values are converted once on import; amounts and units remain traceable. Calculations retain full precision and round only for display.

### Existing levers to replace or reposition

Retire **Strategic BU allocation** as a default funding preference because it conflicts with the requested common-pot approach. Use Region reservation for the specific regional policy and show BU outcomes as a consequence. Retire **IT hygiene reserve** as an independent default: qualifying hygiene programs compete on merit or belong to an evidenced service floor. Keep **CCB capacity** as a drill-down within Change and Sustain, without double counting.

Keep **Matrix-validated versus Intake claim** as a comparison explaining claims that require validation. Intake claim must not become the approval gate for the conference baseline. BU and EW budget levers remain optional constraints; switching them on must disclose the common-pot restriction and lost opportunities.

### Initial reservation calibration

The source-derived candidate requests are 18.507 M€ validated LFR, 30.348 M€ Change and Sustain and 8.355 M€ Region after the preceding classification. These are request totals, not signed minimum commitments. At 168.000 M€, the first two correspond to approximately 11.016% and 18.064%. Use them only as visible calibration references while reviewers confirm scope and baseline. Do not label those percentages final or financially optimal.

<!-- PAGE -->

## 6 Configurable reference scoring

The Reference profile reproduces the proposed framework. It is retained for comparison, not adopted as a complete funding rule.

| Dimension | Maximum | Tiers |
|---|---:|---|
| Priority | 25 | Must Do 25; Must Have 18; Deprioritised 5; blank 10 |
| Category | 20 | LFR 20; Decomm 17; AI 16; Upgrades 10; Continuous Improvement 8; New Feature 6; New Technology 5; blank 4 |
| Investment area | 15 | Compliance 15; Security 14; Process simplification 12; Revenue 11; Productivity 10; Transformation 8; blank 3 |
| Benefits divided by investment | 25 | At least 3x: 25; at least 1.5x and below 3x: 20; at least 0.5x and below 1.5x: 15; above zero and below 0.5x: 10; none: 5 |
| Waste | 15 | Healthy 15; Contain 9; Challenge 3; Exit 0; Not assessed 7 |

The delivered workbook maps **Cost avoidance** to 11 investment-area points, consistent with the prior dashboard. This is an explicit comparison extension because the proposed table omits that source category. It remains configurable.

Tier boundaries must have no gaps or overlapping intervals. Exactly 1.5x receives 20 points and exactly 3x receives 25. Zero or missing investment does not create an infinite ratio. Unclassified source text is not a numeric benefit. An unnamed record is not scored even though the reference defaults would otherwise produce points.

### Bands and actions

| Unrounded score | Reference label | Recommended label | Decision implication |
|---|---|---|---|
| At least 65 through 100 | Protected | High alignment | Recommend proceeding subject to evidence, scope and budget |
| At least 45 and below 65 | Strong | Strong | Confirm scope and affordability |
| At least 25 and below 45 | Discretionary | Discretionary | Justify, phase or defer |
| Below 25 | Weak | Weak | Review exit or redesign; do not dissolve automatically |

Use the unrounded score for bands and ties. The interface may display one decimal place. The word Protected must not be confused with legal or budget protection.

The reference framework awards 29 points when all five inputs are missing. Must Do plus LFR category plus Compliance area already gives 60 points; default benefit and waste points can take an unvalidated program to 72. This is why the final product needs evidence gates and a separate recommended profile.

<!-- PAGE -->

## 7 Recommended scoring and tiers

### Proposed weights

| Dimension | Reference | Recommended | Reason for change |
|---|---:|---:|---|
| Priority | 25 | 15 | Retain sponsor intent while reducing self-classification dominance |
| Category | 20 | 10 | Keep program-type relevance without duplicating mandatory protection |
| Investment area | 15 | 10 | Preserve alignment with intended outcomes |
| Comparable benefits | 25 | 30 | Give greater weight to evidenced economic contribution |
| Waste | 15 | 10 | Retain quality differentiation; apply serious waste decisions as eligibility gates |
| Impact and cost of not doing | 0 | 25 | Represent a major decision input omitted from the reference framework |
| Total | 100 | 100 | Validate totals before applying a scoring policy |

Use the same nonmissing category, priority and investment-area tier ordering as Reference. Convert a tier into its share of the dimension maximum, then multiply by the selected profile weight. For example, Must Have is 18/25 of the Priority dimension, giving 10.8 points under a 15-point weight.

Under Recommended, missing priority, category, investment area, benefits or waste assessment receives zero points for that dimension and a visible evidence issue. Missing does not mean the program has no value; it means the score cannot assert that value yet. Healthy, Contain and Challenge retain their relative waste tiers. Exit remains zero and is subject to the eligibility decision.

### Impact and cost of not doing

The 25-point dimension has two configurable parts. **Expected avoidable loss** contributes up to 15 points, using reviewed loss divided by the current viable investment: at least 3x gives 15; at least 1.5x gives 12; at least 0.5x gives 9; above zero gives 6; missing or zero gives 0. Reviewed expected loss equals the evidenced consequence amount multiplied by its probability over the agreed period.

**Impact severity** contributes up to 10 points: tier 1 gives 2, tier 2 gives 4, tier 3 gives 6, tier 4 gives 8 and tier 5 gives 10. Tier 0 or missing gives zero. Define the tiers as minor local inconvenience; measurable local disruption; material BU or process disruption; severe multi-unit, customer or control impact; and critical enterprise, safety or licence-to-operate impact. Require evidence and risk-owner review for the chosen tier.

Recorded waste-assessment impact tiers may provide a provisional input when matched to the same scope. They are not inferred from keywords in free text. The workbook preserves them and allows a reviewed replacement. Expected loss remains blank until reviewed. Avoid giving monetary credit twice to the same saving or avoided loss through both benefits and cost of not doing.

<!-- PAGE -->

## 8 Benefits and evidence rules

### Comparable economic value

Retain the submitted quantified benefit, its original unit, narrative explanation and the approved comparable amount separately. A numeric entry is a source value, not proof of a valid period or scale. Convert K€ to M€ by dividing by 1,000 exactly once.

Classify benefits as cash savings, productivity with evidenced realisation, incremental revenue contribution, cost avoidance, risk exposure or unclassified. Revenue should use an approved contribution margin rather than gross revenue. Productivity should identify whether capacity is released, redeployed or monetised. Risk exposure is reported separately unless Finance approves an expected avoidable-loss estimate for the relevant comparison.

Use a consistent decision horizon. The recommended production default is the agreed 2027 economic effect, with later-year benefits shown separately. If a different multi-year horizon is selected, include the corresponding cost horizon and record it in the scenario. Do not mix a lifetime benefit numerator with one-year investment without disclosure.

### Source parsing and review

Do not automatically treat dates, percentages, multiple alternatives or embedded quantities as money. Narrative benefits require a reviewed structured amount, unit and period. Preserve the text so reviewers can trace the interpretation.

A benefit-to-investment ratio of 50x or more is a proposed unit-review trigger, not proof of a unit error. The engine must never automatically divide a large claim by 1,000. The scored workbook shows the reference score using the submitted numeric amount, flags the ratio, and withholds that amount from recommended comparable benefit until a reviewed replacement is entered.

For example, **Symphony Eye** has a numeric source benefit of 202.000 M€ against a 4.000 M€ request, giving 50.5x. The earlier HTML used a different correction. The new scored workbook retains the attached workbook’s value and explicitly flags it; it does not silently carry forward the earlier correction.

### Required evidence before automatic funding

Require an identifiable sponsor, costed viable scope, measurable outcome, supported score inputs, decision-relevant dependencies and the relevant route approval. A high provisional score does not waive those requirements. For LFR, require the regulatory validation and minimum solution; for Change and Sustain, require the approved service baseline; for Region, require attribution and ownership.

Problem Statement and Scope explain the causal link between the investment and the outcome. They are evidence to review, not arbitrary text-length scoring criteria. Assistance may suggest classifications or missing information, but a human reviewer must confirm any interpretation that changes a funding decision.

<!-- PAGE -->

## 9 Selection logic and Merit line

### Conference baseline using merit first

After reserving and allocating protected obligations, score eligible Region and common-pot candidates using the selected policy. Apply the configured minimum score to competitive work. Sort by unrounded score descending, then reviewed expected loss, comparable benefit, smaller viable investment and permanent program ID.

Select the highest-ranked affordable viable program or phase. If it cannot fit, retain it as **Does not fit** and continue to the next candidate. Never divide a program to fill the final space unless a separately costed phase has an approved outcome. Unused money is allowed when no eligible viable work fits.

Dependencies are part of affordability. Add the cost of unfunded prerequisites before considering a dependent program. Evaluate mutually exclusive alternatives as alternatives, and count shared capabilities and shared benefits once. Reject dependency cycles for review. Respect approved platform delivery capacity as a constraint, not as an informal afterthought.

This approach prioritises merit order. It does not claim the mathematically highest total economic return across every possible combination. The product must disclose that objective rather than using “optimised” without defining what is optimised.

### Verified value alternative

Offer a scenario that maximises supported net economic value within the same mandatory commitments, reservations, score floor and capacity constraints. Use comparable benefit plus deduplicated expected avoidable loss minus relevant incremental cost. Only monetised, reviewed inputs enter that objective. Nonmonetary severity still affects the score and eligibility.

The alternative must show programs added and displaced relative to merit-first, their scores, benefits, loss exposure and cost. If an exact solution is not established, disclose the best feasible result and remaining optimisation gap. Do not label a heuristic selection a proven maximum.

### Merit line presentation

Show the lowest score among automatically funded competitive programs and identify the relevant pot. A protected mandate or service minimum can sit below it. An unaffordable or dependency-blocked program can sit above it. Manual inclusions and exclusions must be visibly marked and excluded from the automatic reference calculation.

Show separate Region and common-pot references when both routes are used. BU Led and EW Led inherit the underlying decisions and display the applicable references and exceptions; they must not independently recalculate a competing portfolio merely because a user filters the view.

Every program must show its route, current score, selected amount, reason, evidence issues and displacement explanation. “Below the Merit line” alone is not enough when the actual reason is missing evidence, cost or a dependency.

<!-- PAGE -->

## 10 Recommended scenario catalogue

Every scenario stores the source version, envelope, reservation amounts and percentages, scoring profile and tier version, benefit assumptions, score floor, selection approach, constraints and manual decisions. A preset creates a new working scenario; it must not overwrite the agreed baseline.

| Scenario | Parameter change from baseline | Conference question |
|---|---|---|
| R0 Recommended conference baseline | 168.000 M€ planning envelope; validated LFR minimum; approved C&S baseline; Region 10%; score floor 45; Recommended profile; merit-first | Which defensible portfolio should be proposed? |
| R1 Evidenced core | Raise common and Region competitive score floor to 65; preserve protected commitments | What remains if we fund only the strongest evidenced cases? |
| R2 Verified value | Use supported net-value optimisation; retain floor 45 and the same reservations | What economic value changes if we relax strict merit ordering? |
| R3 Region pressure | Region reservation 15% instead of 10%; common pot reduces by five percentage points | Which enterprise opportunities are displaced by more Region funding? |
| R4 Service continuity | C&S allowance at 110% of approved baseline; preserve its minimum service floor | What is the cost of additional service capacity? |
| R5 Envelope pressure | Reduce total envelope by 10%; preserve approved minimum LFR and service amounts; recompute their percentages | What survives a lower envelope, and are minimum commitments still affordable? |
| R6 Full demand benchmark | Display all submitted demand, currently 279.995 M€; no funding approval implied | How large is the affordability and evidence gap? |

R0’s 168.000 M€ envelope and 10% Region share are proposed planning settings. LFR and C&S percentages must be derived from the approved amounts; the source request totals are calibration references only. If percentages exceed the available envelope, display an infeasible scenario. Do not cap them silently.

### Comparison requirements

Compare planned reserves, actual allocations, released reserves, common pot, program counts, comparable benefits, expected avoidable loss, nonmonetary impact, mandate/service shortfalls, data gaps and BU/Function/Region outcomes. Display added, removed and repriced programs with reasons. Use the same source version for an apples-to-apples comparison, or show the data-version difference explicitly.

Preserve the screenshot’s reset and haircut views as labelled legacy benchmarks if needed. They must not silently change the recommended reservation percentages or imply that arbitrary partial funding delivers a viable outcome.

<!-- PAGE -->

## 11 End to end user flow

### Prepare and review the baseline

1. Open **AOP2027 Scenario Modelling → Import demand**. Select the updated workbook and review record counts, money units, duplicate IDs, missing identifiers and waste matches.
2. Open **Review data**. Resolve high-impact benefit-unit issues, missing costs, ambiguous matches, LFR evidence and program dependencies. Keep unresolved records visible with named owners.
3. Open **Set envelope and reservations**. Enter the conference envelope, review derived LFR and C&S requirements, choose the Region percentage and inspect the calculated common pot.
4. Open **Scoring policy**. Compare Reference and Recommended profiles, review changed ranks and confirm the policy version. Apply any tier or weight changes to the whole comparable candidate set.
5. Select **Create baseline**. Review selected programs, shortfalls and evidence coverage. Freeze the source and policy versions for the conference working session.

### Make a decision during a conference

6. Open **BU Led**, **EW Led** or **Total Portfolio** and filter to the discussion topic. Filtering changes the view, not the global allocation.
7. Expand an organisation and select a program. Review Problem Statement, Scope, benefits, cost of not doing, waste decision, dependencies and current funding reason.
8. Choose **Include**, **Exclude**, **Approve phase** or **Change prioritized amount**. Enter a reason and the applicable evidence or scope version. The engine shows displaced programs and recalculates all totals.
9. Return to **Scenario Modelling → Compare scenarios**. Compare the proposal with the baseline and the relevant stress scenario. Review common-pot consequences across BU and Functions, not only the filtered organisation.
10. Choose **Record conference decision**. Mark the decision Proposed, Conditional or Approved according to the participant’s authority. Capture outstanding conditions and their owner.

### Publish an agreed version

11. Open **Review exceptions**. Resolve over-budget states, mandatory or service shortfalls and unresolved conditions required for approval.
12. Choose **Approve baseline** through the configured approval flow, then **Export conference pack**. Save the program decisions, funding reconciliation, scenario settings, score explanations and open actions together.

The current HTML supports parts of steps 3, 6 through 9 and scenario saving. Import governance, reviewed scoring, role-based approval and an authoritative conference baseline are requirements for the final build.

<!-- PAGE -->

## 12 BU Conference operating model

### Preparation

Before the conference, the BU sponsor and Finance review the BU’s requested and agreed investment, benefit units and outcome ownership. Region leaders confirm demand attribution. IT platform owners identify shared capabilities, prerequisite work and service commitments. Legal, Tax and Compliance validate obligations that will enter the LFR reservation.

The portfolio office freezes the source and scoring-policy versions and distributes the baseline and relevant scenario differences. Requests with missing evidence appear in an action list, with the missing item stated explicitly. A blank benefit should not become an automatic statement that the program has no consequence.

### Proposed 75 minute agenda

| Time | Navigation and discussion | Decision output |
|---|---|---|
| 0 to 10 minutes | Scenario Modelling → Executive summary | Confirm envelope, reservations, policy version and unresolved constraints |
| 10 to 25 minutes | BU Led → BU and Region views | Confirm local outcomes, evidence gaps and Region attribution |
| 25 to 50 minutes | Open programs near the Merit reference and major exceptions | Agree scope, include/exclude/phase proposals and documented reasons |
| 50 to 65 minutes | Compare R0, R3 and R5 | Evaluate Region pressure and lower-envelope consequences across the common pot |
| 65 to 75 minutes | Review decisions and actions | Record BU recommendations, conditions and escalation owners |

### Decision principles

The BU Conference recommends outcomes and tradeoffs within one portfolio. It must not assume that every euro released by one BU automatically belongs to that BU. Show the resulting common-pot allocation and the programs that benefit elsewhere.

When a BU requests an inclusion, show its agreed amount and the programs displaced by the global rule. If the request has a justified strategic exception, record it as a manual decision with its authority and reason. Do not alter scoring weights for a single program to conceal the exception.

If the BU seeks a lower scope amount, require a viable phase and updated benefit treatment. A percentage budget reduction by itself is not a delivery plan. If a shared platform program serves several BUs, confirm one owner and one investment total with a separate attribution view.

### Required conference output

Export the BU recommendations, before/after funding, benefits and impact changes, manual exceptions, Region allocation, shared dependencies and open evidence actions. Record whether each recommendation is conditional and who can approve it. Final portfolio funding remains subject to the agreed cross-conference governance.

<!-- PAGE -->

## 13 Function Conference operating model

### Preparation and shared commitments

Function and IT platform owners review enterprise and shared demand, approved service levels, contract commitments and CCB consumption. Finance validates the 2027 Change and Sustain baseline and the realisation of claimed savings. The portfolio office brings forward the BU recommendations and identifies conflicts, duplicate outcomes and shared prerequisites.

Use the same frozen source version and scoring policy as BU Conference. If evidence or costs changed, create a revised scenario and show the reconciliation rather than silently replacing the prior discussion baseline.

### Proposed 90 minute agenda

| Time | Navigation and discussion | Decision output |
|---|---|---|
| 0 to 15 minutes | Scenario Modelling → LFR and service obligations | Confirm validated minimum amounts and unresolved shortfalls |
| 15 to 35 minutes | EW Led → Function and platform views | Review service baseline, CCB, shared programs and ownership |
| 35 to 60 minutes | Total Portfolio → Common pot | Resolve dependencies, overlap, alternatives and BU/Function conflicts |
| 60 to 75 minutes | Compare R0, R2 and R4 | Compare merit-first, verified value and extra service capacity |
| 75 to 90 minutes | Review exceptions and conference pack | Agree portfolio recommendation, conditions and approval route |

### Resolving conflicts

A later conference may propose a change to an earlier recommendation, but it must preserve the prior decision and show the delta, rationale and affected owners. Approved mandatory or minimum service commitments require the corresponding authority to change. A Function decision cannot silently remove a BU-approved outcome that depends on it.

For enterprise capabilities, identify the cost once, attach benefiting BUs and Functions as attribution, and record who owns realisation. Consolidation should reduce duplicate investment or scope; it should not erase the underlying demand or create multiple benefits from the same outcome.

### Approval and publication

The final decision authority, Finance and relevant obligation owners approve the consolidated baseline according to the configured governance. The product records who approved what, when, against which evidence and scenario version. Do not assume a particular Philips governance body or delegate authority solely because someone can edit the file.

Publish the consolidated funding totals, program decisions, conditions, unresolved actions and change history. Preserve the current agreed baseline separately from ongoing what-if scenarios. The standalone prototype can support a facilitated session with one operator; simultaneous conference editing requires a shared application with conflict handling.

<!-- PAGE -->

## 14 Workbook requirements and scored demand

### Delivered workbook structure

| Tab | Purpose |
|---|---|
| Overview | Source reconciliation, score comparison and instructions |
| Scored demand | Reference and recommended dimension scores, bands, common merit rank, evidence issues and conference inputs |
| Demand details | Source requests, benefit text, problem, scope, dependencies and mapped waste evidence |
| Score settings | Editable weights, tier points, thresholds, band boundaries and comparison assumptions |
| Scenario options | Proposed scenarios and reservation semantics |
| Data requirements | Missing decision inputs, validation rules and proposed accountable roles |
| Waste evidence | Real source assessment records with source locations; examples excluded |

The workbook preserves 506 source records and gives provisional scores to 481 named demands. The remaining unnamed records are visible as not scored. All numeric monetary columns are converted to M€; verbatim source narratives retain their original wording and units for audit.

### Inputs to add or confirm for the production register

Keep permanent program ID, Planisware ID, owner, origin, benefiting organisations and source version. Add an agreed 2027 investment basis, minimum viable scope, costed phase options and approval date. Keep submitted, updated, handshaked and agreed amounts distinct.

For benefits, capture class, amount, unit, time horizon, probability or margin where relevant, realisation owner, evidence link and Finance approval. For cost of not doing, capture consequence, amount, probability, period, impact severity, deadline and overlap with benefits. Keep nonmonetary impact separately visible.

For LFR, capture authority, instrument, entity and jurisdiction applicability, deadline, independent validation, minimum scope cost and reviewer. For Change and Sustain, capture 2026 actuals, utilisation, service floor, contract commitments, 2027 work packages and discretionary enhancements. For Region, capture explicit origin, beneficiary and approval owner.

For waste, capture the nine ratings, weighted score, band, overall decision, evidence, assessor, date and assessed scope version. For dependencies, capture prerequisite IDs, shared capability links, mutual exclusions and jointly realised benefits. For each decision, capture scenario version, selection, amount, status, reason, conditions, approver and timestamp.

### Scored workbook use

Edit yellow inputs only when supporting the relevant decision: agreed scope investment, approved comparable benefit, reviewed expected loss, reviewed impact tier and conference decision. Review **Score settings** before changing policy. Such changes recalculate the score comparison across the entire register. The workbook does not assert automatic funding, enforce all production eligibility rules or replace conference approval.

<!-- PAGE -->

## 15 Functional and nonfunctional requirements

### Required capabilities

**PR01 Import and reconcile.** Import all source demand, retain provenance, distinguish placeholders and independent missing-ID requests, and require resolution of duplicate or ambiguous identities before final approval.

**PR02 Configure reservations.** Support direct percentages and amounts with one authoritative envelope. Enforce one classification per funded amount, nonnegative values and reservation arithmetic. Display minimum commitments, actual allocation, releases and shortfalls.

**PR03 Configure scoring.** Store profile weights, tiers, thresholds, mappings and version. Validate a 100-point total, nonoverlapping ratio boundaries and valid band limits. Recalculate scores and explanations from the chosen source version.

**PR04 Allocate and explain.** Apply eligibility, reservations, common-pot rules, dependencies and capacity. Record an explicit reason for every selected and unselected program. Keep comparison objectives distinct.

**PR05 Edit in both directions.** Changes to levers or budgets recalculate every view. Include, exclude or amount edits from BU Led, EW Led or Total Portfolio update Scenario Modelling and all financial summaries. Preserve explicit manual decisions; report infeasibility when they conflict.

**PR06 Compare and freeze.** Save complete scenario snapshots, compare additions/removals/repricing, record conference outcomes and retain approved baselines. A source or scoring change creates a new version.

**PR07 Export.** Export the chosen scenario, source and policy versions, program decisions, scores, funding reconciliation, benefits and loss treatment, exceptions and actions. Every monetary output uses the declared unit consistently.

### Operating requirements

For a facilitated conference, target a typical scenario refresh within two seconds for the current scale of roughly 500 source records. Establish measured performance limits with larger fixtures and dependencies before release; this is an acceptance target, not a measured promise for the final product.

Support keyboard access, readable tables, visible numeric input units, clear focus and direct percent entry. Preserve the current visual style. Avoid relying on colour alone to identify funding or evidence state.

Keep confidential portfolio data local or within the approved enterprise environment. Shared deployment needs authentication, named roles, access control, an audit history and concurrent-edit conflict handling. Scoring and validation must be deterministic and reproducible. A saved source version and policy version must reproduce the same automatic outcome.

<!-- PAGE -->

## 16 Worked examples and acceptance criteria

### Worked examples

**Reservations.** For an illustrative 100.000 M€ envelope, reservations of 20% LFR, 15% Change and Sustain and 10% Region leave a planned 55.000 M€ common pot. If confirmed LFR scope costs 18.000 M€ and its owner releases 2.000 M€, the common pot becomes 57.000 M€. These are illustrative values, not source-derived recommendations.

**No double counting.** A 0.500 M€ Region program that is validated LFR consumes LFR funding once. It contributes 0.500 M€ to Region reporting, but does not also consume the Region reservation.

**Score boundary.** A program with 1.500 M€ benefit and 1.000 M€ investment receives the 1.5x tier. Under Reference, that is 20 benefit points; under a 30-point Recommended weight, it is 24 points. Missing impact contributes zero until evidence is provided.

**Budget fit.** If only 0.400 M€ remains, a 0.600 M€ program is marked Does not fit. A lower-ranked viable 0.300 M€ program may be selected. The chart must explain the resulting exception around the Merit reference.

### Acceptance tests for the final engine

| Test | Required outcome |
|---|---|
| Source reconciliation | All records accounted for; 279.995 M€ source request total reconciles; no dropped missing-ID requests |
| Blank inputs | Missing names are not scored; zero cost creates no infinite benefit ratio; missing evidence adds no Recommended points |
| Tier boundaries | Exactly 0.5x, 1.5x and 3x map once and correctly; weights and band boundaries validate |
| Benefit units | Narrative numbers are not auto-approved; large ratios prompt review without automatic rescaling |
| Reservations | Common denominator; totals within envelope; unused money released once; LFR/Region overlap counted once |
| Minimum commitments | Insufficient LFR or service funding creates a visible unresolved shortfall |
| Scenario sensitivity | Compare at least R0 through R5 with constrained budgets and program-level deltas |
| Manual decisions | Include, exclude and amount changes reconcile across all views and persist across lever changes |
| Dependencies | Prerequisite costs, alternatives, shared benefits and capacity constraints are enforced |
| Conference history | Prior decisions preserved; changed authority, data and scoring versions are visible |
| Reproducibility | Same data, policy, constraints and overrides produce the same outcome and export |

Repeat the established three-round QA approach: calculation and data tests, complete user-flow tests, then visual and regression checks. The previous HTML’s QA results do not certify the future features in this PRD.

<!-- PAGE -->

## 17 Release decisions and implementation sequence

### Recommended sequence

First, reconcile the program register and import the attached demand and waste data with stable identifiers. Retain the scored workbook as the transparent comparison of Reference and Recommended policy. Finance and the relevant owners resolve unit, scope and evidence issues before automatic funding approval.

Second, implement versioned scoring and the three-reservation model. Confirm approved minimum LFR and Change and Sustain amounts, Region policy and common-pot eligibility. Demonstrate program-level explanations and scenario differences before adding conference approval functions.

Third, connect the common portfolio to BU Led, EW Led and Total Portfolio. Preserve one selection and funding record across the views. Add the conference baseline, proposed changes, conditional decisions, approval rights and complete export pack.

Finally, run a facilitated pilot using R0, R1, R3 and R5, and compare R2 where economic inputs are sufficiently reviewed. Measure whether the conference can identify displaced outcomes, resolve exceptions and approve a reproducible portfolio. Change scoring policy through a new version if the pilot reveals an unintended preference.

### Decisions that remain with the business

Confirm the total 2027 envelope; approved LFR minimum amounts; the 2027 service baseline; the Region share; benefit period and margins; policy for nonmonetary strategic work; final scoring weights and tiers; minimum merit threshold; conference approval authority; and shared deployment requirements.

The recommended weights and scenario settings are a reasoned design proposal. The source evidence does not establish that a particular percentage split is financially optimal or already approved. The final conference baseline should be selected after reviewing the relevant scenario tradeoffs and resolving the evidence required for its decisions.

### Source register

1. **10926_IT AOP2027 Demand.xlsx**: BU Demand and EW Demand request rows; BU Led Waste Matrix and EW Waste Matrix assessment records. Numeric requests and original narratives are preserved in the scored workbook with source locations.
2. **Attached Scenario modeller screenshot**: visible Evidence-led reset percentages, displayed tranche allocations and comparison-button labels. Other preset parameter values are not visible.
3. **AOP2027 IT Portfolio Scenario Modelling HTML**: current interaction prototype and existing scenario behaviour, reviewed in the preceding work.
4. **User-proposed AOP 2027 scoring framework**: Reference weights, tier values and band boundaries, with the documented Cost avoidance extension.

Instructions or examples embedded in source files are treated as source content, not as approval or operating authority. The final build follows the agreed product requirements and authorised conference decisions.
