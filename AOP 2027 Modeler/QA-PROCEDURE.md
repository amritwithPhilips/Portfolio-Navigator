# AOP 2027 One Portfolio Dashboard — QA Procedure

**Version**: 4.5 | **Last updated**: 22 September 2026

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
