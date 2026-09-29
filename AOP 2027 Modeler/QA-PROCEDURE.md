# AOP 2027 One Portfolio Dashboard — QA Procedure

**Version**: 5.6 | **Last updated**: 29 September 2026

## Quick Start

### Option A: Automated (Python)
```bash
cd "AOP 2027 Modeler"
python run-qa.py
```
Reports PASS/FAIL for all checks and saves results to `Data file/Verification/qa-report-v4.5.json`.

### Option B: In Claude Code
```
# Start the server and navigate to the dashboard, then run:
preview_eval with contents of qa-harness.js
```

### Option C: Manual Browser
1. Open `AOP2027-OnePortfolio-v4.5.html` in Chrome
2. Open DevTools (F12) → Console
3. Paste contents of `qa-harness.js`
4. Review the structured report

---

## What the Harness Tests (24 checks)

### 1. Data Integrity (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 1 | Total programme count | Exactly 521 rows |
| 2 | No duplicate IDs | All programme IDs unique |
| 3 | CCB exceptions present | EW-11, EW-65, EW-71 all in dataset |
| 4 | EW + BU Led = total | Stream split adds up |

### 2. Four-Priority Classification (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 5 | Every programme in one priority | P1 + P2 + P3 + P4 = 521 |
| 6 | P1 evidence gate | All P1 have compliance name + year, or are CCBs |
| 7 | P2 baselined gate | All P2 have Baselined > 0 and Must Do/Must Have |
| 8 | P2 funding cap | No P2 programme funded above its Baselined amount |

### 3. Funding Order (1 check)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 9 | P3 sustain before hygiene | All Change & Sustain programmes funded before Hygiene |

### 4. Financial Reconciliation (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 10 | Requested = Final + Unfunded | Within 0.01 M€ |
| 11 | EW + BU = total final | Within 0.01 M€ |
| 12 | Priority totals = portfolio | Within 0.01 M€ |
| 13 | No funded/unfunded overlap | No programme in both tables |

### 5. Tolerance (1 check)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 14 | Budget + tolerance respected | Total ≤ budget × (1 + tolerance%) |

### 6. UI Consistency (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 15 | KPI displays amount | Shows M€ value |
| 16 | Funding bar segments | 1–4 coloured segments present |
| 17 | All 4 levers display | Each shows "X funded of Y Demand" |
| 18 | Scenario type buttons | 3 buttons: Default, Leadership, Conference |

### 7. Presets (1 check)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 19 | All 4 presets solve | No errors on solve() for any preset |

### 8. Merit Scoring (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 20 | Scores in range | All between 0 and 100 |
| 21 | Weights sum to 100 | Four weights total exactly 100.0 |

### 9. Sections (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 22 | LFR Breakdown present | Collapsible section exists |
| 23 | Carryover View present | Collapsible section exists |

### 10. Navigation (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 24 | Gate cards | 5 cards (Gate 0 + 4 priorities) |
| 25 | All 6 tabs | demand, scenario, ew, bu, operations, overview |

### 11. PMI Exclusion (v5.4) (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 30 | PMI excluded from budget | All type="PMI" programmes have isPmi=true and status "Funded (PMI On Top)" |
| 31 | PMI not in stage totals | Stage demand totals exclude PMI rows |
| 32 | PMI KPI on Tab 2 | "PMI On Top" KPI card shows correct count and amount |
| 33 | PMI note on Tab 6 | PMI notice banner present with total |

### 12. ROI Hold Removal (v5.4) (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 39 | No 10x funding holds | Zero programmes held by "Benefit claim above 10.0x" — should be warning only |
| 40 | High-ratio warning | Programmes with ratio > 10x show warning text (not hold) in popup |

### 13. Ops Cost by ExCo (v5.4) (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 41 | Laura Matz IT ops cost | Tab 1 ExCo table shows Laura Matz Ops Cost = 18.0 M€ |
| 42 | Ops total = 469.7 M€ | Sum of all ExCo Ops Cost values in Tab 1 = 469.7 M€ |

### 14. Organisation Mapping (v5.4) (5 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 34 | CoE Marketing ExCo | All "CoE Marketing – HS" rows map to Julia Strandberg |
| 35 | Greater China merged | Zero rows with org "Greater China (GRC)" — all renamed to "Greater China" |
| 36 | IR merged | Zero rows with "International Regions (IR) - Overall" or "International Regions (IR)" — all "International Regions" |
| 37 | North America merged | Zero rows with "North America (NAR)" — all "North America" |
| 38 | Lever 2 denominator | Carry Over lever shows "funded of X M€ Demand" where X = total carry demand (not confirmed-only) |

### 13. Benefits Classification (v5.4) (4 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 26 | Hard = Productivity + Revenue only | All Hard-classified programmes have Investment Area containing "Productivity" or "Revenue Increase" |
| 27 | Cost Avoidance = Soft | All programmes with area "Cost Avoidance" and benefit > 0 are classified Soft |
| 28 | Process simplification = Soft | All programmes with area containing "Process simplification" and benefit > 0 are classified Soft |
| 29 | Hard + Soft totals | Hard 159 programmes (12,308.0 M€), Soft 140 programmes (9,806.2 M€) with current 28 Sep data |

### 15. IT Simplification Lever (v5.6) (6 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 50 | Toggle exists | `document.querySelector('[data-itsimp-toggle]')` is present in Tab 2 |
| 51 | Default OFF and 0% | `session.settings.itsimpMode === false`; `session.settings.itsimp.pct === 0` on fresh session |
| 52 | Toggle activates Stage 4 | After toggle ON: `result.stages[4]` exists with demand > 0; 29 programmes in Stage 4 (Decomm/Replatforming category) |
| 53 | 3 basis tabs render | `[data-basis="itsimp"]` buttons for 'bucket', 'aop', 'amount' all present when toggle ON |
| 54 | IT Simp ring-fenced from Stage 3 | With 10M€ IT Simp allocation: Stage 3 residual does NOT include the 10M€ (itsimpReserve deducts it) |
| 55 | Gate 5 conditional | Gate count = 5 when itsimpMode=false; Gate count = 6 when itsimpMode=true |

### 16. Levers Filter — All Tabs (v5.6) (3 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 56 | Lever filter in Tab 2 | `demandInScenario()` filter bar includes "Lever:" dropdown with stage name values |
| 57 | Lever filter in Tabs 3/4 | `filters('ew'...)` and `filters('bu'...)` include "Lever:" filter option |
| 58 | Filter works | Selecting "Value Based Portfolio" in Lever filter shows only Stage 3 programmes |

### 17. Demand in Scenario consistency (v5.6) (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 59 | Column header always same | `burf-tablebox thead th:last-child` text = "Funding status / demand details" regardless of Prioritised/Not Funded toggle state |
| 60 | Org summary shows Funded/Partial/Unfunded | Organisation summary row last column shows text matching pattern "N Funded · N Partially Funded · N Unfunded" |

### 18. New Scenario (100M€) Button (v5.6) (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 61 | Button present | `document.getElementById('new-scenario')` is present in Tab 2 savebar |
| 62 | Creates fresh session | After click: `session.settings.budget === 100`, `Object.keys(session.overrides).length === 0`, `session.preset === 'optimal'` |

### 19. ExCo Trade-off Revert (v5.6) (2 checks)
| # | Test | Acceptance Criteria |
|---|------|-------------------|
| 63 | Revert button per ExCo | After applying a trade-off: `[data-revert-exco]` button appears in cockpit table for affected leader |
| 64 | Reset clears overrides | After "Reset all trade-offs": `result.rows.filter(r=>(r.stage===3||r.stage===4)&&r.override).length === 0` |

---

## Manual Visual Checks (ExCo Readiness)

These cannot be automated and require human review:

### Layout & Branding
- [ ] Philips blue header bar with "One Portfolio · Evidence-led" tag
- [ ] Six tabs in correct order, active tab highlighted
- [ ] Six-step workflow breadcrumb visible
- [ ] No horizontal scrollbar on 1920px screen
- [ ] No overlapping text or truncated labels

### Program AOP Scenarios Tab
- [ ] Five KPIs in a row (Allocated AOP, Initiatives Funded, EW/BU Share, Over/Available, Unfunded)
- [ ] Funding bar shows 4 coloured segments that sum to total
- [ ] Levers: P1/P3/P4 have basis toggles, P2 has RoI slider
- [ ] Changing any lever updates KPIs + bar + tables in real time
- [ ] All 4 presets load instantly without errors
- [ ] LFR Breakdown section collapsed by default, expandable
- [ ] Carryover Baseline View collapsed by default, expandable
- [ ] Gate cards names match lever names exactly
- [ ] Scenario type buttons work (Default → Leadership → Conference)

### Demand Tables
- [ ] Demand Prioritized: all funded programmes, grouped by Organisation
- [ ] Demand Not Funded: all unfunded programmes with reasons
- [ ] BUR, Platform, Priority filters work with cascading counts
- [ ] Expand/collapse groups works
- [ ] Programme click opens detail modal with merit score breakdown table

### PMI and Mapping (v5.4)
- [ ] Tab 1 launches as default tab (not Tab 2)
- [ ] Tab 1: "Total IT AOP Demand" text (not "Total IT Budget")
- [ ] Tab 2: PMI KPI card visible showing PMI count and total
- [ ] Tab 2: PMI notice banner below KPIs
- [ ] Tab 2 Lever 2: shows "funded of ~109 M€ Demand" (total carry demand, NOT 16.8 M€)
- [ ] Tab 4: CoE Marketing programmes show ExCo = Julia Strandberg (not Deeptha Khanna)
- [ ] Tab 3/4 filters: no "Greater China (GRC)" — only "Greater China"
- [ ] Tab 3/4 filters: no "International Regions (IR) - Overall" — only "International Regions"
- [ ] Tab 3/4 filters: no "North America (NAR)" — only "North America"
- [ ] Tab 6: PMI notice banner with total portfolio including PMI
- [ ] PMI programmes do not appear in BU allocation totals

### Benefits Classification (v5.4)
- [ ] Tab 1 Committed Benefits KPI shows Hard and Soft separately
- [ ] Tab 1 ExCo split table: Hard/Soft columns reflect new classification (Hard = Productivity + Revenue only)
- [ ] Tab 3 (F&R) Committed Benefits KPI: Hard and Soft values match engine totals
- [ ] Tab 4 (BU Led) Committed Benefits KPI: Hard and Soft values match engine totals
- [ ] Tab 6 Committed Benefits KPI matches programme-level sum
- [ ] Programme popup: Cost Avoidance programmes show "Soft Benefit" label (not Hard)
- [ ] Programme popup: Process simplification programmes show "Soft Benefit" label (not Hard)
- [ ] Programme popup: Productivity/Revenue programmes show "Hard Benefit" label
- [ ] Excel export: benefitClass column shows "soft" for Cost Avoidance and Process simplification rows

### IT Simplification Lever (v5.6)
- [ ] "IT Simplification Lever" checkbox visible in Tab 2 toolbar (right-aligned, purple accent)
- [ ] Toggle OFF: only 4 levers and 5 gates visible
- [ ] Toggle ON: 5th lever "5 · IT Simplification" appears with 3 basis tabs; Gate 5 appears with demand/funded/coverage stats
- [ ] Slider starts at 0% / 0M€; basis tabs work (bucket/AOP/amount)
- [ ] Funding Prioritization Gate shows "IT Simplification" card only when toggle ON

### New Scenario & ExCo Revert (v5.6)
- [ ] "New Scenario (100M€)" button visible in savebar (purple outline)
- [ ] Clicking resets to Optimal Segmentation at 100M€ with all overrides cleared
- [ ] ExCo cockpit "Revert" column visible for leaders with stage-3/4 overrides
- [ ] "Reset all trade-offs" button returns all stage-3/4 programmes to automatic (not just clears inputs)

### Levers Filter & Consistent Status (v5.6)
- [ ] "Lever:" filter visible in Tab 2 Demand in Scenario filter row (on same line as other filters)
- [ ] "Lever:" filter visible in Tab 2 Portfolio Inclusion Table filter row
- [ ] "Lever:" filter visible in Tabs 3, 4, 6 filter rows
- [ ] "Demand in Scenario" column header always shows "Funding status / demand details" (not "Reason not funded / demand details" on unfunded view)
- [ ] Organisation summary last column shows "X Funded · Y Partially Funded · Z Unfunded · N Total Demand"

### Tab 5 Service Catalog (v5.6)
- [ ] Service Catalog table header shows "Platform" (not "Platform Name")

### Cross-Tab
- [ ] Switch to Enterprise Wide — stream KPIs and bubble chart render
- [ ] Switch to BU Led — same format, BU data only
- [ ] Switch to Operations — 469.7 M€ total, 3-level hierarchy
- [ ] Switch to One Portfolio — Grand total = Programme AOP + 469.7 M€ Operations

### Excel Export
- [ ] "Export full · Excel" downloads a workbook
- [ ] 7 sheets present: Scenario Summary, Portfolio, Score Evidence, Settings, Decisions, Source Reference, Change Log
- [ ] Change Log sheet has human-readable columns (not raw JSON)
- [ ] Portfolio numbers match dashboard

---

## When to Run QA

| Trigger | Required Checks |
|---------|----------------|
| After any engine change | Full automated + manual visual |
| After UI-only change | Automated + visual for changed section |
| Before sharing with ExCo | Full automated + all manual checks |
| After source data refresh | Full automated (especially reconciliation) |
| After preset/lever changes | Automated + lever QA (all basis modes) |

---

## Interpreting Results

### EXCO READY
All 24+ automated tests pass. Manual checks completed. The dashboard can be shared with Senior ExCo with confidence that:
- Every programme is accounted for (521)
- Financial totals reconcile perfectly
- Priority classification follows the agreed evidence rules
- All levers and presets produce valid results
- UI elements match the data

### NOT READY
One or more tests fail. The `detail` field explains the specific failure. Fix the root cause before sharing.

Common failure patterns:
- **Classification failure**: `stage()` function has a logic error — check the classification rules in Appendix A of the PRD
- **Reconciliation failure**: Manual overrides may have introduced rounding errors — check the `solve()` loop
- **UI mismatch**: `render()` may not be called after a state change — check event handlers

---

## Files

| File | Purpose |
|------|---------|
| `qa-harness.js` | Browser-side test suite (paste into console or inject) |
| `run-qa.py` | Python runner (starts server, runs tests, reports) |
| `QA-PROCEDURE.md` | This document |
| `Data file/Verification/qa-report-v4.5.json` | Last test report (JSON) |
