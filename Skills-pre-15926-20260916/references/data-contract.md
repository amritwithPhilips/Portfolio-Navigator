# Source and refresh contract

## Source workbook

Read the original demand sheets and waste matrices without modifying them. Map by heading, not column number. In the September 2026 workbook the business-led waste sheet and enterprise-wide waste sheet use different column offsets. Confusing them shifts a waste condition into the aggregate score and corrupts validity ratings. Recalculate complete weighted assessments and compare to the supplied aggregate as a check.

Retain Item No., Planisware reference, sheet/row and organisation. Join assessments by exact normalized initiative name, ownership and reporting group. For renamed programs or ownership differences, record the explicit reviewed mapping and verify request amount. Do not apply fuzzy matches silently. Keep unresolved joins visible. The approved snapshot includes documented aliases for the SAP changes program, the ARIS quality-integration program and three regional Finance programs. Exact source references appear in the dashboard records.

All 506 snapshot records remain represented, including 25 unnamed records and four requests with temporary source-row references. Never count a missing amount as an estimated positive request. A zero or missing request has no automatic allocation.

## Engine input

One record per source request. `item` is a unique stable string. Monetary numeric fields below use M€. `null` means missing, not zero benefit.

| Property | Meaning |
|---|---|
| item, planisware, source, matchStatus | Stable reference and source provenance |
| name, org, stream | Initiative, ownership, and BU Led / EW reporting group |
| newCarry, category, platform, area, priority | Submitted classification and business priority |
| costM | Requested 2027 investment, finite non-negative number |
| benefitM, benefitRaw, benefitBasis | Usable explicit lifetime amount or null; original text; interpretation and source period |
| impactRaw, problem, scope, dependency | Original narrative evidence; dependencies may cite request references |
| lfrYear, lfrName | Compliance year and named requirement; generic descriptions remain review cases |
| hygiene, hygieneEvidence | Reviewed eligibility plus source passage; category alone is insufficient |
| wasteNums | Exactly nine integer ratings 1–5 or null, in the rubric order |
| validityRatings | Four integer ratings 1–5 or null, in the validity rubric order |
| wasteMatch | Source assessment: validated, tier, minimumScope, impact, likelihood, deadline, decision and source location when supplied |

The engine recomputes validity, weighted waste, merit components, protected eligibility, regional/carry-over routing and benefits ratio. It does not trust previously cached scores. Recorded validation and Immediate priority are source assessments; preserve their underlying evidence and discrepancies for review.

`AOP.defaults()` returns settings. `AOP.preset(key, current)` uses balanced, confirmed or capacity. `AOP.solve(data, settings)` returns per-record funded amount, reason, stage, components, all financial totals and gaps. `AOP.validateData` and `AOP.validateSettings` validate inputs. An amount is internally rounded to one euro (0.000001 M€), with three-decimal M€ presentation.

## Refresh behaviour

The delivered offline dashboard refreshes from its full demand CSV template, not a partial-update file or the original workbook format. Export the current demand, edit known inputs, and import all rows and headings. Investment/benefit columns are explicitly M€. Original workbook K€ values require conversion by 1,000. Never auto-correct suspicious unit values solely from magnitude.

Keep stable source references. Reject duplicate references, invalid amounts/ratings and unsupported reporting groups before changing live state. Compare old and new evidence per record. Report added, changed and removed rows. Preserve manual decisions; changed/removed source records mark those decisions as needing review. Do not silently apply a reviewed monetary decision to changed evidence. Session files preserve a complete demand snapshot, settings and saved decisions for recovery.

For a fresh original-workbook refresh through Codex, regenerate normalized inputs from the original headings and rubrics, validate joins and unit conversions, then replace or import the normalized data. The skill does not authorize fabricated missing values or source workbook edits.

## Baseline verification only

With the approved September 2026 snapshot, no manual decisions and 100 M€:

| Scenario | Allocated M€ | Requests | Business-led M€ | Enterprise-wide M€ |
|---|---|---|---|---|
| Balanced investment | 94.260 | 134 | 32.550 | 61.710 |
| Confirmed evidence | 59.839 | 80 | 11.179 | 48.660 |
| Reduced change capacity | 85.1716 | 135 | 32.2848 | 52.8868 |

The initial protected amount is 27.796 M€. The eligible Change and Sustain base is 22.921 M€. Balanced investment regional coverage is 5.510 M€, including 4.302 M€ protected, 0.308 M€ Change and Sustain and 0.900 M€ additional demand. These are regression expectations for that source snapshot, never hardcoded funding outputs.
