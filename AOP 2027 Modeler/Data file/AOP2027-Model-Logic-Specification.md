# AOP 2027 model logic specification

Status: confirmed and implemented in the Excel model, dashboard and AOP prioritisation skill.

## Source authority

Use only `15926_IT AOP2027 Demand.xlsx`, sheets `EW` and `Bu`, for demand evidence and calculations. Preserve the original sheet, row, Item No., Planisware ID, text, values and units. The normalized data package records the source SHA-256 so the model and dashboard can detect a changed source version.

Snapshot reconciliation:

- 509 demand-evidence rows; 506 have an Item No.
- 279.595 M€ requested: 111.699 M€ EW and 167.896 M€ BU.
- 229 populated Decision bands covering 128.406 M€; 280 blank covering 151.189 M€.

## Primary funding stages

1. LFR: source Overall AOP decisions P1 Immediate and P2 Scheduled, plus the approved exceptions EW-11, EW-65 and EW-71.
2. Sustain Engineering: only source rows explicitly classified `Change & Sustain`, after LFR overlap is removed. Display only Sustain Engineering as the stage name; do not infer membership from request size or CCB wording.
3. Hygiene: approved source Category variants for decommissioning/replatforming, Continuous Improvement, and Upgrades & Enhancements, after earlier stages.
4. Carryover: remaining source carryover with numeric Quantified Benefits at or above the configured benefit/request threshold.
5. ROI-Based Portfolio: all remaining initiatives with numeric benefits, ranked by Merit Score. AI enters here unless an earlier stage applies.

Current source bases:

- LFR: 34.517 M€.
- Sustain Engineering: 12.333 M€.
- Combined at full coverage: 46.850 M€.
- Hygiene after LFR and Sustain Engineering precedence: 65.560 M€.

Total AOP is a model input. LFR, Sustain Engineering and Hygiene each use a switchable basis: `% of bucket demand` or `% of Total AOP`. Carryover exposes only a 1x–5x+ threshold in 0.5x steps, default 2x. ROI-Based Portfolio receives all remaining AOP automatically.

## Decision treatment

Use source Decision band and Overall AOP decision. Do not recalculate the nine assessment dimensions for recommendations.

- Healthy - Rank in priority matrix: eligible to compete under its applicable rules.
- Contain - Conditions: eligible only with the condition retained or reviewed.
- P1 Immediate: LFR first sequence.
- P2 Scheduled: LFR second sequence.
- MUST-DO priority TBD: hold pending review.
- Blank: unassessed; keep visible and do not infer Healthy.

## Merit

Merit totals 100 points:

- Submitted lifetime benefit / requested investment: 50.
- Submitted priority: 25.
- Captured Consequence: 15.
- Decision band: 10.

Captured Consequence uses only Impact and Cost of Not Doing, Problem Statement and Scope:

- 0: no usable consequence.
- 5: a general consequence, problem or scope without clear harm.
- 10: a named affected activity or stakeholder plus explicit harm.
- 15: the 10-point evidence plus a quantified impact or enterprise, global, multi-region or company-wide reach.

Retain every supporting passage and source reference.

Minimum Merit Score and weights remain in Advanced configuration. The threshold gates only the ROI pool; it does not gate Carryover and is not a visible primary business lever. Requests without numeric benefits remain visible as `Evidence missing / not eligible`.

Programmes with benefit/cost ratio above 10x receive a **warning** (data review recommended) but are NOT held from automatic funding. The engine prioritises purely based on lever logic and merit score with no hard ROI ceiling constraint (v5.4 change).

## PMI exclusion (v5.4)

PMI programmes (source type = "PMI") are excluded from the prioritisation engine entirely. They are auto-funded at their full requested cost on top off the AOP budget. They are not charged to any BU allocation, do not count in stage demand or targets, and do not consume budget tolerance. PMI total is shown as a separate KPI in Tab 2 and as a note in Tab 6.

## Organisation normalisation (v5.4)

The engine's `ORG_RENAME` constant normalises organisation names during `normalize()`:
- "Greater China (GRC)" → "Greater China"
- "International Regions (IR) - Overall" / "International Regions (IR)" → "International Regions"
- "North America (NAR)" → "North America"

CoE Marketing – HS (former DMEC) maps to Julia Strandberg (Connected Care), not Deeptha Khanna.

## Benefits classification (v5.4)

Classification uses Column O (Investment Area) and Column S (Quantified Benefits in K€):

- **Hard Benefit**: Column O value is "Productivity Savings" or "Revenue Increase", AND Column S > 0.
- **Soft Benefit**: Column O has any other value (Cost Avoidance, Process simplification/efficiency gain, Compliance/Keeping the lights on, Security, Enabling, etc.), AND Column S > 0.
- **Qualitative**: No numeric benefit in Column S, but has text in Impact/Problem/Scope fields.
- **None**: No benefit data at all.

Benefits classification is a display attribute — it does not affect merit scoring, funding allocation, staging or programme eligibility. All tabs, KPIs, tables, popups, filters and Excel exports use this classification.

## Whole initiatives and conference decisions

Fund complete initiatives in priority order; never proportionally split a request. Automatic selection uses a 5% tolerance against each reservation target and Total AOP to fit whole initiatives. Display target-versus-selected delta.

BU Led and EW Led conference checkboxes add to the existing prioritized view. A manual inclusion adds the full initiative without displacing an automatic selection. It may leave the final scenario over budget; show the MEUR and percentage variance and allow finalisation. Manual exclusions remove the initiative. Both decisions require a rationale.

Finalising freezes the source hash, settings, decisions, budget and variance. Refresh creates a new version.

## Excel and dashboard coupling

The Excel model is the auditable decision record. It contains source mapping, normalized records, classifications, merit components, scenario inputs, allocation outputs, manual decisions and explanations.

The dashboard consumes the same normalized records and calculation engine. It does not retain a separate score or allocation path. Every dashboard total reconciles to the Excel model, and every program traces to its model record and original source row.
