# AOP2027 v5.6.1 QA and meeting readiness

Technical verification: 152/152 checks pass; 0 fail. All 618 column filters across 20 extract datasets were exercised. This is a build for ExCo/ITLT discussion and scenario review. Final funding and Finance signoff require closure or explicit acceptance of the gaps below.

## Current financial position

| Measure | Exact M€ |
|---|---:|
| Submitted Program demand, including PMI | 287.122900 |
| Base Program demand | 281.932900 |
| Base funding at illustrative 100 M€ | 99.984000 |
| PMI funded on top | 5.190000 |
| Unfunded base demand | 181.948900 |
| Operations AOP | 470.314463039 |
| Total IT funding, including PMI | 575.488463039 |

Financial displays round magnitude upward to one decimal. Rounded components may not add to the displayed total. The inherited engine calculates Program M€ to six decimals; original workbook precision and formulas remain available in the complete snapshots. Operations retains full cached source precision. No source workbooks were edited.

## Meeting gaps

| Gap | Evidence and impact | Action needed before signoff |
|---|---|---|
| F&R charging key absent | 50.066 M€ default F&R funding is retained but cannot be attributed to recipient BUs. The UI and Excel show a pending-allocation row. | Finance provides or approves the charging key. |
| Incomplete requests | 20 missing amounts: 17 unnamed placeholders and 3 named requests. Unknown amounts are not included as invented zero demand. | Demand owners confirm amount, scope and whether placeholders remain in the submission. |
| Source decision errors | Bu-388, Placeholder, BU row 241: Waste score GA241, Waste band GB241 and Overall AOP decision GP241 are #VALUE!. Six further cached errors exist on BU Waste Matrix. | Source owner corrects/recalculates and reissues the workbook. |
| Benefit evidence | 133 programs have no numeric benefit; 127 submitted benefit/request multiples exceed 5x. Source values are retained as lifetime claims. | Business/Finance owners validate units, time horizons and evidence; record accepted exceptions. |
| Rule baseline and budget | v5.6 actual logic/defaults differ from older policy documents. The 100 M€ envelope is illustrative; Optimal uses carry threshold 10x, Sustain 60% bucket and tolerance 0%. | Portfolio owner confirms the engine baseline and leadership confirms the envelope. |
| Formal handoff | This task does not provide named Finance approvals, validated mandatory-obligation citations or a signed Planisware load set. | Record approver, decision date, immutable scenario revision and load mapping before execution. |

## Defects corrected in this build

- Refreshed all Program records, Operations services, service consumption, TCO and platform mappings from the two supplied files.
- Replaced hardcoded Operations KPIs/allocations with refreshed exact values. Removed double counting of sender allocations in TCO and ExCo totals.
- Retained unallocated Program funding visibly; separated PMI on top from BU charges. Added source-based Operations reconciliation to the Finance QA panel.
- Fixed PMI omission and inclusion-scope errors in Excel exports. Added record-level source file, full hash, sheet and row references.
- Isolated browser recovery by source version so an old local draft cannot silently supersede the refresh.
- Expanded refresh fingerprints to include compliance name/year, carryover baseline, payback and allocation keys, without changing funding/scoring functions.
- Rebuilt the data extract with text, exact match, numeric comparison, blank/not-blank and combined filters on every column; sorting, pagination and filtered CSV downloads.

## Test coverage

| Suite | Passed | Total |
|---|---:|---:|
| engine-qa.json | 58 | 58 |
| source-qa.json | 6 | 6 |
| browser-qa.json | 63 | 63 |
| export-qa.json | 20 | 20 |
| refresh-ui-qa.json | 5 | 5 |

Engine tests include four presets, five envelopes, every lever basis, IT Simplification, missing/zero distinctions, additive inclusion/exclusion/partial scope, undo, finalised lock, fork, source migration and evidence-only refresh changes. Browser tests cover all six tabs at 1920 and 1366 pixels, filters, group expansion, independent edits, evidence popup, save/reload, portable import/checksum rejection, finalise/fork, actual workbook refresh and downloaded full/included Excel files.

Visual review covered the six-tab screenshots, Operations table, allocation bridge and extract at meeting screen widths. Test scenarios and controlled workbooks were isolated from the published default.

Limitations: no real-world approval or Planisware load was performed. Assistive-technology certification and a physical ExCo meeting-room/projection test were not performed. Existing chart semantics are retained: the One Portfolio base chart excludes PMI and zero-prioritised rows from its log-scale plot; full records remain in tables.

## Check evidence

| Check | Result | Evidence |
|---|---|---|
| SRC-01 | PASS | Original workbook bytes match declared SHA-256 |
| SRC-02 | PASS | All four program sheets, cached values and formulas preserved |
| SRC-03 | PASS | 464 unique stable IDs |
| SRC-04 | PASS | 20 missing requests retained as null |
| SRC-05 | PASS | No positive amount has a missing program name |
| SRC-06 | PASS | Missing charging key remains absent; no stale key copied |
| REG-01 | PASS | Refresh build matches v5.6 funding engine on identical new input |
| REG-02 | PASS | Funding, scoring, classification and default-setting functions unchanged; refresh fingerprints expanded |
| FIN-01 | PASS | Base requested = allocation + unfunded |
| FIN-02 | PASS | All demand 287.1229; PMI on top 5.19 M€ |
| FIN-03 | PASS | Every source row reconciles including null and zero |
| FIN-04 | PASS | Base streams reconcile |
| FIN-05 | PASS | Base stage allocations reconcile |
| FIN-06 | PASS | No negative or over-request allocation |
| SCORE-01 | PASS | Merit within 0–100 |
| SCORE-02 | PASS | Missing benefits retain unavailable ratio |
| SCORE-03 | PASS | Hard classification limited to Productivity/Revenue |
| SCORE-04 | PASS | ExCo follows preserved hierarchy |
| OPS-01 | PASS | 182 unique Operations service IDs |
| OPS-02 | PASS | Services reconcile to exact Operations total |
| OPS-03 | PASS | Seven recipient TCO clusters reconcile |
| OPS-04 | PASS | 36 consuming-org service allocations reconcile |
| OPS-05 | PASS | Own + region + function allocations reconcile |
| PRESET-optimal | PASS | {"requested":281.9329,"allocation":99.984,"automatic":99.984,"manual":0,"unfunded":181.9489,"available":0.016,"over":0,"count":166,"partial":14,"missing":20} |
| PRESET-protect | PASS | {"requested":281.9329,"allocation":100,"automatic":100,"manual":0,"unfunded":181.9329,"available":0,"over":0,"count":153,"partial":14,"missing":20} |
| PRESET-evidence | PASS | {"requested":281.9329,"allocation":100,"automatic":100,"manual":0,"unfunded":181.9329,"available":0,"over":0,"count":145,"partial":14,"missing":20} |
| PRESET-capacity | PASS | {"requested":281.9329,"allocation":100,"automatic":100,"manual":0,"unfunded":181.9329,"available":0,"over":0,"count":142,"partial":14,"missing":20} |
| BUDGET-50 | PASS | {"requested": 281.9329, "allocation": 49.988, "automatic": 49.988, "manual": 0, "unfunded": 231.9449, "available": 0.012, "over": 0, "count": 71, "partial": 4, "missing": 20} |
| BUDGET-75 | PASS | {"requested": 281.9329, "allocation": 74.997, "automatic": 74.997, "manual": 0, "unfunded": 206.9359, "available": 0.003, "over": 0, "count": 111, "partial": 14, "missing": 20} |
| BUDGET-100 | PASS | {"requested": 281.9329, "allocation": 99.984, "automatic": 99.984, "manual": 0, "unfunded": 181.9489, "available": 0.016, "over": 0, "count": 166, "partial": 14, "missing": 20} |
| BUDGET-150 | PASS | {"requested": 281.9329, "allocation": 148.154, "automatic": 148.154, "manual": 0, "unfunded": 133.7789, "available": 1.846, "over": 0, "count": 244, "partial": 14, "missing": 20} |
| BUDGET-300 | PASS | {"requested": 281.9329, "allocation": 148.154, "automatic": 148.154, "manual": 0, "unfunded": 133.7789, "available": 151.846, "over": 0, "count": 244, "partial": 14, "missing": 20} |
| LEVER-lfr-bucket | PASS | Allocation basis accepted and reconciled |
| LEVER-lfr-aop | PASS | Allocation basis accepted and reconciled |
| LEVER-lfr-amount | PASS | Allocation basis accepted and reconciled |
| LEVER-sustain-bucket | PASS | Allocation basis accepted and reconciled |
| LEVER-sustain-aop | PASS | Allocation basis accepted and reconciled |
| LEVER-sustain-amount | PASS | Allocation basis accepted and reconciled |
| LEVER-value-bucket | PASS | Allocation basis accepted and reconciled |
| LEVER-value-aop | PASS | Allocation basis accepted and reconciled |
| LEVER-value-amount | PASS | Allocation basis accepted and reconciled |
| LEVER-itsimp-bucket | PASS | Allocation basis accepted and reconciled |
| LEVER-itsimp-aop | PASS | Allocation basis accepted and reconciled |
| LEVER-itsimp-amount | PASS | Allocation basis accepted and reconciled |
| MANUAL-01 | PASS | Exclusion does not auto-refill |
| MANUAL-02 | PASS | Undo restores exact funding |
| MANUAL-03 | PASS | Manual addition is additive |
| MANUAL-04 | PASS | Partial manual scope follows entered amount |
| LIFE-01 | PASS | Finalised state rejects financial edit |
| LIFE-02 | PASS | Fork preserves decisions, settings and lineage |
| REFRESH-01 | PASS | Controlled changed/add/remove/unchanged preview |
| REFRESH-02 | PASS | Changed override held; unchanged retained; finalisation blocked |
| REFRESH-03 | PASS | Prior source remains recoverable with child lineage |
| REFRESH-EVIDENCE-lfrName | PASS | Evidence-only source edit detected |
| REFRESH-EVIDENCE-lfrYear | PASS | Evidence-only source edit detected |
| REFRESH-EVIDENCE-baselined | PASS | Evidence-only source edit detected |
| REFRESH-EVIDENCE-payback | PASS | Evidence-only source edit detected |
| REFRESH-04 | PASS | Resolving pending decision enables finalisation |
| INDEPENDENT-01 | PASS | 464 normalized IDs traced to exact source rows |
| INDEPENDENT-02 | PASS | {"unitConversionDifferences": [], "precision": "Preserved v5.6 engine rounds M€ to six decimals; original precision remains in snapshots"} |
| INDEPENDENT-03 | PASS | 182 source service IDs match candidate exactly |
| INDEPENDENT-04 | PASS | All service costs equal cached source cells at full precision |
| INDEPENDENT-05 | PASS | Independent source service total |
| SOURCE-UNCHANGED | PASS | Original program workbook unchanged |
| UI-01 | PASS | Six tabs in expected order |
| UI-1920-demand | PASS | Rendered content, no page-level horizontal overflow |
| UI-1920-scenario | PASS | Rendered content, no page-level horizontal overflow |
| UI-1920-ew | PASS | Rendered content, no page-level horizontal overflow |
| UI-1920-bu | PASS | Rendered content, no page-level horizontal overflow |
| UI-1920-operations | PASS | Rendered content, no page-level horizontal overflow |
| UI-1920-overview | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-demand | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-scenario | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-ew | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-bu | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-operations | PASS | Rendered content, no page-level horizontal overflow |
| UI-1366-overview | PASS | Rendered content, no page-level horizontal overflow |
| UI-FIN-01 | PASS | Total IT and Operations KPIs follow exact refreshed values with upward display rounding |
| UI-FIN-02 | PASS | Missing F&R charging key and PMI are separate allocation rows |
| UI-FIN-03 | PASS | Finance QA has no arithmetic failures; business warnings retained |
| UI-OPS-01 | PASS | 182 services and one footer |
| UI-OPS-02 | PASS | Operations hierarchy expands |
| UI-OPS-03 | PASS | Operations navigation does not affect funding |
| UI-LEVER-01 | PASS | IT Simplification toggle activates fifth bucket |
| UI-LEVER-02 | PASS | Budget edit commits |
| UI-LEVER-03 | PASS | New Scenario resets to 100 M€ |
| UI-FILTER-ew | PASS | ExCo selection narrows view without altering funding |
| UI-EDIT-ew | PASS | Independent program edit persisted: EW-28 |
| UI-POPUP-ew | PASS | Program detail opens with evidence lineage |
| UI-FILTER-bu | PASS | ExCo selection narrows view without altering funding |
| UI-EDIT-bu | PASS | Independent program edit persisted: Bu-68 |
| UI-POPUP-bu | PASS | Program detail opens with evidence lineage |
| UI-LIFE-01 | PASS | Save/reload retains decisions and event history |
| UI-EXPORT-export-json | PASS | Browser download saved portable.json |
| UI-EXPORT-export-full | PASS | Browser download saved full-export.xlsx |
| UI-EXPORT-export-inclusions | PASS | Browser download saved inclusions-export.xlsx |
| PORTABLE-01 | PASS | Portable checksum verified independently |
| PORTABLE-02 | PASS | Portable import in clean browser restores overrides |
| PORTABLE-03 | PASS | Corrupted portable rejected without replacing session |
| UI-LIFE-02 | PASS | Finalise from One Portfolio works |
| UI-LIFE-03 | PASS | Finalised UI has no active program edit controls |
| UI-LIFE-04 | PASS | New working version creates draft with parent lineage |
| EXTRACT-COLS-0 | PASS | Programs: 34 column filters |
| EXTRACT-COLS-1 | PASS | Operations services: 15 column filters |
| EXTRACT-COLS-2 | PASS | Operations consumption: 8 column filters |
| EXTRACT-COLS-3 | PASS | Operations TCO: 9 column filters |
| EXTRACT-COLS-4 | PASS | Program changes: 10 column filters |
| EXTRACT-COLS-5 | PASS | Funding changes: 10 column filters |
| EXTRACT-COLS-6 | PASS | Operations changes: 7 column filters |
| EXTRACT-COLS-7 | PASS | Program raw BU: 201 column filters |
| EXTRACT-COLS-8 | PASS | Program formulas BU: 2 column filters |
| EXTRACT-COLS-9 | PASS | Program raw EW: 67 column filters |
| EXTRACT-COLS-10 | PASS | Program formulas EW: 2 column filters |
| EXTRACT-COLS-11 | PASS | Operations raw AOP2027 Bill of IT: 206 column filters |
| EXTRACT-COLS-12 | PASS | Operations formulas AOP2027 Bill of IT: 2 column filters |
| EXTRACT-COLS-13 | PASS | Operations raw Platform Mapping : 3 column filters |
| EXTRACT-COLS-14 | PASS | Operations raw Platform Service List: 7 column filters |
| EXTRACT-COLS-15 | PASS | Operations raw Comparable AOP2027: 19 column filters |
| EXTRACT-COLS-16 | PASS | Operations formulas Comparable AOP2027: 2 column filters |
| EXTRACT-COLS-17 | PASS | Operations raw AOP Svc. Costs (21.09): 8 column filters |
| EXTRACT-COLS-18 | PASS | Source manifest: 3 column filters |
| EXTRACT-COLS-19 | PASS | Meeting gaps: 3 column filters |
| EXTRACT-NUMERIC | PASS | Numeric greater-than filter independently reconciles |
| EXTRACT-AND | PASS | Numeric and exact text filters combine |
| EXTRACT-MISSING | PASS | Blank request filter returns all 20 missing amounts |
| EXTRACT-CSV | PASS | Filtered CSV includes matching missing-amount program |
| UI-CONSOLE | PASS | [] |
| FULL-ROWS | PASS | {"actual": 464, "expected": 464} |
| FULL-VALUES | PASS | {"differences": []} |
| FULL-EVIDENCE | PASS | Scoring rows match selected export scope |
| FULL-SOURCE | PASS | Every exported record has full source hash, sheet and row |
| FULL-SUMMARY | PASS | {"programFunding": 105.17399999999999, "programDemand": 287.1229, "totalIT": 575.4884630385122} |
| FULL-ALLOCATION | PASS | Allocation table includes pending BU/F&R and PMI rows and reconciles to total IT |
| FULL-COST-SUMMARY | PASS | Cost-summary allocation independently reconciles to total IT |
| FULL-OPS | PASS | All 182 exported service IDs/costs match source |
| FULL-ERRORS | PASS | [] |
| INCLUDED-ROWS | PASS | {"actual": 170, "expected": 170} |
| INCLUDED-VALUES | PASS | {"differences": []} |
| INCLUDED-EVIDENCE | PASS | Scoring rows match selected export scope |
| INCLUDED-SOURCE | PASS | Every exported record has full source hash, sheet and row |
| INCLUDED-SUMMARY | PASS | {"programFunding": 105.17399999999999, "programDemand": 287.1229, "totalIT": 575.4884630385122} |
| INCLUDED-ALLOCATION | PASS | Allocation table includes pending BU/F&R and PMI rows and reconciles to total IT |
| INCLUDED-COST-SUMMARY | PASS | Cost-summary allocation independently reconciles to total IT |
| INCLUDED-OPS | PASS | All 182 exported service IDs/costs match source |
| INCLUDED-ERRORS | PASS | [] |
| FINAL-BROWSER | PASS | No console error after export/display repairs |
| FINAL-UI-ALLOCATION | PASS | {"programExact": "105.174", "operationsExact": "470.31446303851226", "totalExact": "575.4884630385122", "expectedExact": "575.4884630385121"} |
| REFRESH-UI-PREVIEW | PASS | {"fixture": {"change": "EW-46", "remove": "EW-69", "keep": "EW-04", "sourceHash": "f3d2dd19319d6143b75f4efaf133f7445e56a6081409e9a3256ddb23d65b3691"}, "previewText": "Data Refresh Audit Report\n\nGenerated 2026-09-29 15:46 · Source f3d2dd19319d → d4021fa1df1b\n\nRow Count\n464 → 464\n0\nrecords\nTotal Demand\n282.0 M€\n+2.0 M€\nAllocation\n97.7 M€ → 97.8 M€\n+0.2 M€\nEW / BU Shift\nF&R\n+1.7 M€\nBU\n-1.6 M€\nBenefit Shifts\n0\nprogrammes reclassified\nActions Required\n2\n1 critical, 1 warning\nPre-refresh vs Post-refresh KPIs\nMetric\tBefore\tAfter\tDelta\t% Change\nTotal Records\t464\t464\t0\t0.0%\nRequested Demand\t282.0\t284.0\t+2.0\t+0.7%\nAllocated Demand\t97.7\t97.8\t+0.2\t+0.1%\nUnfunded Demand\t184.3\t186.2\t+1.9\t+1.0%\nFunded Count\t164\t161\t-3\t-1.8%\nEW Allocation\t47.8\t49.5\t+1.7\t+3.5%\nBU Allocation\t50.0\t48.4\t-1.6\t-3.1%\nHard Benefits\t7056.6\t7056.6\t0.0\t0.0%\nSoft Benefits\t7823.4\t7924.5\t+101.1\t+1.3%\nLegal and Compliance (Must Do) Demand\t53.2\t55.2\t+2.0\t+3.7%\nLegal and Compliance (Must Do) Allocation\t41.5\t43.2\t+1.7\t+4.0%\nCarry Over demand Demand\t107.6\t107.6\t0.0\t0.0%\nCarry Over demand Allocation\t16.8\t16.8\t0.0\t0.0%\nSustain Engineering and Hygiene Demand\t36.2\t36.2\t0.0\t0.0%\nSustain Engineering and Hy"} |
| REFRESH-UI-APPLY | PASS | {"hash": "d4021fa1df1b85765db37bcdf25019aff442c409f3bea37d5755224a5526cd7f", "parent": "scenario-1790696704743"} |
| REFRESH-UI-HOLDS | PASS | {"EW-04": {"choice": "exclude", "amount": 0, "note": "", "fingerprint": "{\"item\":\"EW-04\",\"planisware\":\"1006377\",\"org\":\"Legal\",\"name\":\"Healthcare Compliance Project Engage\",\"type\":\"Type III - Enterprise wide\",\"newCarry\":\"Carry Over\",\"category\":\"Legal Fiscal, Regulatory & Compliancy\",\"platform\":\"Group Functions & Hyperautomation IT\",\"area\":\"Compliance/Keeping the lights on\",\"priority\":\"Must Do\",\"cost\":2.2,\"benefit\":105,\"benefitDetails\":\"a. Cost avoidance (avoiding penalties) apart from avoiding severe legal, civil and criminal repercussions b. Safeguarding Philips Brands, Preserving Shareholder value by doing business the right way with the right HCPs / HCOs c. Meeting with various Anti-bribary Anti-corruption (ABAC) laws and regulations around the world, including (but not limited to) • U.S. FCPA and UK Bribery Act. • U.S. Department of Justice Criminal Division’s guidance on Evaluation of Corporate Compliance Programs • ISO 37001 (Anti-Bribery Management Systems), the OECD Anti-Bribery Convention and the UN Convention against Corruption (UNCAC)\",\"impact\":\"1) Potential fines from Regulators for potential violations in ABAC, EC&S related regulations 2) Loss of reputation, Brand Value 3) Loss of license to operate in extreme situations\",\"problem\":\"Current solution lacks a traceable fee-for-service engagements with health care professional and health care organizations. Any failure to demonstrate payments are made for bona fi |
| REFRESH-UI-LOCK | PASS | Pending changed-source decision blocks finalisation |
| REFRESH-UI-CONSOLE | PASS | [] |

## Missing requests

| ID | Program | Organisation | Source |
|---|---|---|
| EW-73 | SPINE24 | Information Technology | EW row 70 |
| Bu-213 | IR [C1/C2/C3] Channel Partner Program | Monitoring - HPM (MCH) | BU row 132 |
| EW-173 | ISC IT DRP - DESCARTES | Information Technology | EW row 158 |
| Bu-400 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 247 |
| Bu-401 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 248 |
| Bu-402 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 249 |
| Bu-403 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 250 |
| Bu-404 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 251 |
| Bu-405 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 252 |
| Bu-406 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 253 |
| Bu-407 | (not supplied) | Precision Diagnosis - Magnetic Resonance (MR) | BU row 254 |
| Bu-408 | (not supplied) |  | BU row 255 |
| Bu-453 | (not supplied) |  | BU row 293 |
| Bu-454 | (not supplied) |  | BU row 294 |
| Bu-455 | (not supplied) |  | BU row 295 |
| Bu-456 | (not supplied) |  | BU row 296 |
| Bu-457 | (not supplied) |  | BU row 297 |
| Bu-458 | (not supplied) |  | BU row 298 |
| Bu-459 | (not supplied) |  | BU row 299 |
| Bu-460 | (not supplied) |  | BU row 300 |

## Release hashes

- Model: `887f19493a0313ecd510461d3166a27fdc95c1e118cf2a45dfa938767227184d`
- Extract: `65a0568200c1b3a41fa280105db6a1ba5248fc518d29adacf8e3e1b5ffc0934b`
- Programs: `f3d2dd19319d6143b75f4efaf133f7445e56a6081409e9a3256ddb23d65b3691`
- Operations: `176a6192da3356bcedd9f2babc8318c45977e7658d03172f9e2cb643d22e4668`

Recommendation: use v5.6.1 to review scenarios and agree corrective actions. Record explicit leadership/Finance decisions on the outstanding items before treating the scenario as the final approved AOP.