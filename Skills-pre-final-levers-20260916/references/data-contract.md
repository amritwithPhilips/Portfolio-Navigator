# Source and model data contract

## Workbook source

The sole calculation source is `AOP 2027 Demand/15926_IT AOP2027 Demand.xlsx`, sheets `EW` and `Bu`. Data starts on row 4; rows 1-3 contain headings and prompts. Map by heading because the two sheets have different column positions.

Keep all demand-evidence rows represented, including rows with a missing Item No., missing initiative name, blank request, or blank assessment. A blank amount means missing, not zero demand. A numeric zero remains zero.

## Required normalized fields

| Field | Source or meaning |
| --- | --- |
| `id` | Stable model ID: Item No.; for missing IDs use `sheet-row-<row>` and flag it temporary. |
| `sourceSheet`, `sourceRow` | Exact workbook location. |
| `item`, `planisware`, `name`, `org`, `stream` | Source identity and reporting fields. |
| `newCarry`, `category`, `platform`, `priority` | Submitted classification. |
| `costM` | Requested 2027 investment divided by 1,000. |
| `benefitM`, `benefitRaw` | Unambiguous numeric benefit divided by 1,000; original value/text retained. |
| `impactRaw`, `problem`, `scope`, `dependency` | The three Captured Consequence fields and dependencies. |
| `decisionBand` | Source Decision band (`HEALTHY`, `CONTAIN`, or blank). |
| `overallDecision` | Exact source Overall AOP decision. |
| `sourceValues` | Original relevant cell values for audit and Excel traceability. |

Do not require or normalize the nine underlying waste-dimension ratings for recommendation logic. They may remain visible in the original workbook only.

## Classification flags

- `isLfrDecision`: Overall AOP decision matches P1 Immediate or P2 Scheduled.
- `isDesignatedLfrCcb`: Item No. is `EW-11`, `EW-65`, or `EW-71`.
- `isLfr`: either of the above.
- `isSustainEngineering`: source `New initiative or Carry-over` is `Change & Sustain` or the initiative name contains CCB, and `isLfr` is false.
- `isCarryOver`: source classification contains `Carry Over` and the request is not in an earlier stage.
- `isHygiene`: reviewed evidence identifies decommissioning, lifecycle, or technical-debt scope.

## Source snapshot checks

For the workbook inspected on 16 September 2026:

- 509 demand-evidence rows, including 506 rows with an Item No.;
- 279.595 MEUR requested: 111.699 MEUR on `EW` and 167.896 MEUR on `Bu`;
- 33 source P1/P2 Overall AOP decisions totaling 16.502 MEUR;
- designated LFR CCB demand: 18.015 MEUR (`EW-11` 7.630, `EW-65` 4.160, `EW-71` 6.225);
- LFR baseline after the approved exceptions: 34.517 MEUR;
- Sustain Engineering source base after removing the three exceptions: 12.333 MEUR;
- 229 populated Decision bands totaling 128.406 MEUR; 280 blank totaling 151.189 MEUR.

These are regression expectations for this exact source version, not constants. Recalculate and report any change on refresh.

## Excel and dashboard coupling

The future model workbook must expose stable source IDs, source sheet/row, normalized inputs, calculated classifications, merit components, allocation result, and decision reason. The dashboard must import those model records without maintaining a second independent calculation path.

Use one version identifier derived from the source file metadata and content hash. Save it in the model and dashboard session. Reject or visibly hold manual decisions when their source record or relevant evidence changes.

Every dashboard total must reconcile to an Excel total from the same normalized dataset and settings. Every program detail must show the original source reference and evidence passages.
