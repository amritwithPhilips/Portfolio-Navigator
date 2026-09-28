# AOP 2027 modeler review closure | v3.0

Reviewed scope: the current user instructions, v2 PRD and detailed requirements, latest approach, controlling Philips HTML, source workbook, rule engine, local CIO journey and saved/refreshable scenario outputs.

Conclusion: **zero known open gaps within this reviewed local-modeler scope**, after specification correction, calculation tests, browser regression and workbook parity checks. This does not mean source evidence is complete or that leadership has approved the illustrative budget. This is a single-editor local tool, not an authenticated multi-user approval system.

## Review and correction record

| Gap or overlap | Correction and verification | Status |
|---|---|---|
| Old build approval pause conflicted with the current request | v3 documents and skill recognise current local-build authority. | Closed |
| Tab order confused conference order | Keep four requested tabs; workflow explicitly runs Function/EW before BU Led. | Closed |
| BU could change before Function review | BU edits remain read-only until Function checkpoint completes. | Closed |
| Conference completion had no persistent meaning | Checkpoints retain stream allocations and revision; no duplicate funding. | Closed |
| Later global settings could silently invalidate prior agreement | Recalculate, retain overrides, clear both checkpoints and show reconfirmation notice. | Closed |
| Reopening EW versus BU was undefined | EW reopen clears both; BU reopen preserves EW. | Closed |
| Finalised scenarios could mutate | Freeze financial state; fork and refresh create a new working version. | Closed |
| Manual additions versus rebalancing overlapped | Add without displacement; exclusions do not refill. Over-budget finalisation tested. | Closed |
| Automatic whole programs versus manual scope edits conflicted | Automatic is full request or zero; inline manual amount is explicit partial scope. | Closed |
| Tolerance could compound across stages | One portfolio limit, stage caps and skip-to-next selection; no forced minimum spend. | Closed |
| Six gates implied six budget buckets | Gate 0 checks evidence only; five mutually exclusive allocations. | Closed |
| Decommissioning could remain in carried-over demand | Route to Value after mandatory/Sustain precedence, even when carried over. | Closed |
| Stage baseline therefore no longer reconciled | Exact stage sum 279.595 M€; corrected Carryover 97.375 and Value 100.468 M€. | Closed |
| CCB, small-request and waste-scoring logic survived in skills | Updated active project/personal policies and shared engine; removed obsolete routing from active instructions. | Closed |
| Contain could defeat validated mandatory priority | Retain obligation with condition-review warning; discretionary Contain requires a condition. | Closed |
| Missing and zero benefits/amounts were conflated | Typed handling, explicit missing evidence, no invented values or benefits. | Closed |
| Missing-request count ignored nonbreaking spaces | Corrected from 11 empty cells to 46 empty/whitespace cells. | Closed |
| Carryover threshold could be bypassed via Value | Retain classified Carryover on failed threshold; no rerouting. | Closed |
| Captured Consequence lacked source traceability | Three approved narrative fields, stored passages, transparent tier and reviewed rationale. | Closed |
| Rounded values could overwrite source precision | Upward one-decimal display; exact calculations and Excel values; entering/leaving unchanged input does not edit. | Closed |
| Source request could be replaced by a prioritised amount | Preserve request and benefit denominator; manual scope affects final allocation only. | Closed |
| Refresh could migrate stale or temporary IDs | Fingerprint-based migration, changed decisions held, temporary IDs conservative, prior version saved. | Closed |
| Excel shared formulas caused false refresh changes | Shared-formula translation fixed; original workbook reimport reports 509 unchanged rows. | Closed |
| Tables, chart and exports could calculate independently | All consume the same deterministic result; row-level Excel parity verified. | Closed |
| Filters had ambiguous OR/AND semantics | OR within each field; AND across fields; cascading options and retained zero-match selections. | Closed |
| Funding popups interrupted conferences | Checkbox/amount edits inline, auto-log; program-name popup read-only. | Closed |
| Save/reopen could lose the source or decisions | Full snapshot persistence and checksummed portable scenarios; malformed/stale states rejected. | Closed |
| Existing modeler chart left unused space | Responsive full-width chart and six stream cards; desktop/narrow-screen checks. | Closed |
| Raw uppercase Decision Band could colour incorrectly | Normalise case for chart colours, retain original field text. | Closed |
| Tiny log-axis values produced duplicate rounded labels | Explicit K€ ticks below 0.1 M€; all tick numbers retain one decimal. | Closed |
| Complete demand was not persistently retrievable | Original XLSX, full cells/formulas snapshot, normalised rows and project memory index delivered. | Closed |

## Verification evidence

- Engine suite: 22 named checks, including 48 preset/envelope/tolerance combinations, conference order, manual variance, finalisation and invalid saved-state rejection.
- Browser suite: 10 named end-to-end checks, including Function → BU Led → finalisation, real Excel download, original-source refresh, portable import, local recovery and responsive layout.
- Workbook: all 509 IDs and requested, automatic, final, unfunded and merit values reconcile to the engine. Browser export matches its finalised portable scenario. Four Excel reconciliation formulas return zero within numeric precision; native Excel opens and renders the workbook.
- Documents: Word-rendered PRD has 12 pages and Detailed Requirements 18 pages; all seven original image references remain in both. All pages visually inspected.
- Skill: front matter, metadata, linked references and byte-for-byte engine alignment verified. The packaged Python validator could not load PyYAML, so its applicable checks were repeated with a dependency-free validator. No skill functionality depends on PyYAML.

Machine-readable evidence is in `AOP 2027 Modeler/Data file/Verification/`.

Publication note: the prior unversioned model workbook was open in another application. The release workbook is `2027 IT Portfolio Prioritisation Model v3.0.xlsx`; the open prior workbook was not closed or overwritten. Project context points to the v3.0 workbook.

## Conditions retained for the CIO

1. Enter the intended Total AOP. The 100.0 M€ starting value is illustrative, not source-approved.
2. Use organisation filters to conduct the Function reviews in EW; complete the Function conference only after the intended Function decisions are captured.
3. Conduct BU Led reviews next, complete that checkpoint, then inspect all outcomes and variance in Overview.
4. Finalise and export both the full Excel portfolio and portable scenario. Browser storage is not a substitute for a saved backup.
5. Resolve business evidence with its owners. The source still contains 46 missing requested amounts, 280 blank bands and 280 blank Overall AOP decisions. These are disclosed data gaps, not hidden or fabricated fixes.

Tests cover the supplied 509-row source in current desktop Chrome and native Microsoft Office. Larger-dataset performance targets and multi-user enterprise deployment are not claimed as validated. The algorithm is deterministic priority allocation, not a claim of global economic optimisation.
