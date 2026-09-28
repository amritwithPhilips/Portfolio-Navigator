# Decision bands and Overall AOP decisions

The source workbook contains the operative assessment outputs. Model recommendations use these outputs rather than re-evaluating the nine underlying waste dimensions.

## Source fields

On `EW`, Decision band is column `AY` and Overall AOP decision is `BM`. On `Bu`, Decision band is `AW` and Overall AOP decision is `BK`. Resolve fields by heading and the row-2 subheading (`band`) rather than relying on letters.

Normalize whitespace and dash variants for matching, but preserve the exact source text for display and audit.

## Model treatment

| Source value | Model treatment |
| --- | --- |
| Decision band `HEALTHY` | 10 decision-band merit points. |
| Decision band `CONTAIN` | 6 decision-band merit points and carry conditions into the decision explanation. |
| Blank Decision band | 0 points and status `Unassessed`. |
| Overall decision `HEALTHY - Rank in priority matrix` | May compete under the applicable stage and evidence rules. |
| Overall decision `CONTAIN - Conditions` | May compete only with its condition retained or reviewed. |
| Overall decision `HEALTHY / MUST-DO - P1 - Immediate` | LFR, first sequence. |
| Overall decision `HEALTHY / MUST-DO - P2 - Scheduled` | LFR, second sequence. |
| Overall decision `HEALTHY / MUST-DO - priority TBD` | Hold for priority review. |
| Blank Overall decision | Keep visible as unassessed; do not infer a decision. |

The approved exceptions `EW-11`, `EW-65`, and `EW-71` enter LFR regardless of blank Overall AOP decision. Preserve the exception reason and source initiative name.
