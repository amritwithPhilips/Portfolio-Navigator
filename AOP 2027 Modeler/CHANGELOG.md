# AOP 2027 One Portfolio Dashboard — Changelog

## v4.7.0 — Scoring Reform: All 8 Recommendations (24 Sep 2026)
**Complete scoring reform implementing all 8 leadership recommendations. Hybrid benefit scoring, 10x ceiling, payback component, Data Quality removal.**
Engine schema 3→4. Two build phases (A+B) in single release.

### Phase B: Hybrid Benefit Scoring (Recs 2, 3, 4)

#### Rec 3: Qualitative Benefit Scoring Function
- New `qualitativeBenefit(r)` function using deterministic regex analysis (same approach as Captured Consequence)
- Four tiers: 0 (no evidence / trivial text), 10 (general statement), 20 (specific benefit), 30 (quantified non-financial or cross-functional)
- Maximum qualitative score: 30 of 50 points (60% cap preserves quantitative incentive)
- Trivial text filter: "NA", "TBD", "Soft Benefit", text < 10 chars → 0 points

#### Rec 4: Revenue/Productivity Quantification Rule
- Regex scan of `benefitDetails` for revenue/productivity claim keywords
- If keyword found AND no numeric benefit → benefit score = 0, warning added
- Warning: "Revenue/productivity claim requires quantified benefit"
- Current impact: 0 programmes match (EW-28's text doesn't match the specific keyword pattern)

#### Rec 2: Hybrid Benefit Scoring Path
- Scoring priority: Quantitative (ratio-based) → Revenue/Productivity block → Qualitative fallback → None
- New field `benefitSource` on every enriched record: "quantitative" | "qualitative" | "revenue-productivity-unquantified" | "none"
- New field `qualBenefit` with tier detail when qualitative path used
- Programme detail modal shows benefit source label
- Hold updated: "No benefit evidence (quantitative or qualitative)" replaces "Numeric benefits missing"

#### Benefit source distribution (521 programmes)
| Source | Count | Scoring path |
|--------|-------|-------------|
| quantitative | 261 | Ratio-based tiers (Rec 8) |
| qualitative | 21 | Text analysis (17 general, 4 specific) |
| none | 239 | Score 0 (no benefit text or trivial) |
| rev-prod-unquantified | 0 | Score 0 + warning |

#### Qualitative tier distribution (21 programmes)
| Tier | Count | Points |
|------|-------|--------|
| general-statement | 17 | 10 |
| specific-benefit | 4 | 20 |
| quantified-non-financial | 0 | 30 |

### Phase A: Engine Reform + UI (Recs 1, 5, 6, 7, 8)

### Rec 1: Remove Data Quality Card
- Data Quality card removed from Demand Overview (Tab 1). Was operational, not strategic.
- Evidence Gaps row removed from Insights table.
- Data quality checks continue in QA harness and Scenario tab decision rules.

### Rec 7: Benefit Review Ceiling 5x → 10x
- Hold threshold changed from `ratio > 5` to `ratio > 10` in `enrich()`.
- Inline review checkbox label: "Above-10.0x claim reviewed".
- Impact: 13 fewer manual reviews (63 → ~40 held programmes at 10x).

### Rec 8: Redesigned Benefit Scoring Bands
- Old tiers: <1x=0, ≥1x=20, ≥2x=30, ≥3x=40, ≥5x=50.
- New tiers: <1x=0, 1–3x=15, 3–5x=25, 5–7x=35, ≥7x=50.
- Wider bands reduce over-differentiation; maximum reserved for 7x+ initiatives.
- 106 programmes see score reductions; P4 ranking order changes.

### Rec 5: Payback Period as 5th Merit Component
- New field `paybackYears` extracted from source (column aliases: "Payback Period", "Payback", "Payback (Years)").
- Graceful discovery: if column not in source, all score 0 — no error raised.
- Payback tiers: ≤1yr=10, ≤2yr=8, ≤3yr=6, ≤5yr=4, >5yr/missing=0.
- Default weights changed: `[50,25,15,10]` → `[40,25,15,10,10]` (Benefit 40%, Priority 25%, Consequence 15%, Band 10%, Payback 10%).
- 5 weight inputs in Advanced Configuration.
- 5-row merit breakdown in programme detail modal.
- Session schema 3→4; saved scenarios with 4 weights auto-migrate to [40,25,15,10,10].

### Rec 6: Payback Period Validation
- Warning (not hold): "Payback period missing for quantified benefit claim" when benefit > 0 and payback null/0.
- 255 programmes currently warned (payback column not yet in source).

### QA Results
- Phase A checks: 19/19 PASS
- All 6 tabs render, zero console errors
- Financial reconciliation: requested 280.2 = allocation 100.0 + unfunded 180.3
- EW + BU = portfolio: 43.2 + 56.7 = 100.0
- All 4 presets solve without error
- "X of Y" filter context preserved from v4.6

### Executive UI Refinements
- **Tab 1 (Demand Overview)**: Replaced two information cards with five KPI-style tiles matching the executive layout of other tabs — Total IT AOP, Program Demand, Operations, Committed Impact, 2026 Run-Rate with YoY delta
- **Tab 2 (Funding Prioritization Gate)**: Rewrote all 5 gate descriptions for executive clarity — shorter, action-oriented language instead of technical detail
- **Tab 2 (Merit Score Framework)**: Rewrote all 5 component descriptions for senior leadership — plain business language, no formula references
- **Tab 2 (Allocation & Evidence Rules)**: Condensed from 4 technical paragraphs to 4 bolded one-liners: funding order, selection method, what blocks funding, financial precision
- **Tab 2 (Decision Log)**: Consolidated from 4 columns to 3 (Revision/Time, Change Origin, Change Details). Details column now shows a business-readable 1-liner instead of raw JSON (e.g., "Included EW-42 at 2.1 M€" instead of `{"id":"EW-42","choice":"include","amount":2.1}`)
- **Tab 5 (Service Catalog)**: Service-level costs trimmed from 4 decimals to 1 decimal (e.g., 3.0 instead of 3.0094)
- **Tab 6 (Allocation Table)**: Added Organisation and Platform filter bar with full "X of Y" total row support. 35 organisations, 2 filter dimensions, cascading counts.
- **Tabs 3, 4, 6**: Removed notice text blocks ("Changes made here update..." and "One Portfolio: Program + Operations...")

### Platform Name Standardization + TCO/Allocation Filter Fix
- **Canonical platform names** defined centrally in `normalizePlatform()` — strips "IT-" prefix, harmonizes all variants
- **Program demand** normalized at render time: "Innovation and Digital IT" → "Innovation and Digital", "Group Functions & Hyperautomation IT" → "Group Functions & Hyperautomation", etc.
- **Operations** normalized via `deptToPlatform()` and `svcToPlatform()` — all "IT-" prefixes removed
- **TCO table** platMap updated to canonical names — filter now shows correct platform options
- **Allocation table** platform filter now shows 8 normalized platforms matching rest of dashboard
- **Service Catalog** all 9 platforms verified with canonical names: Commercial IT, Enterprise Architecture Data & Integration, Group Functions & Hyperautomation, Infrastructure Services, Innovation and Digital, Integrated Supply Chain & Finance, Security Risk & Compliance, Services & Solutions IT, Unallocated
- Q: Why 167 vs 174 services? The embedded ops snapshot was built from an earlier file. The 23 Sep update adds 7 new services (SE002xxx IDs). Needs a full ops data rebuild to close gap.

### Layout and Platform Mapping Refinements

#### Funding Prioritization Gate (Tab 2)
- Gate number and name now displayed inline (e.g., "0 Evidence and decision check")
- Definitions converted to bullet lists, font size 10px
- Removed Demand/Target/Allocated details from gate cards — cleaner executive view

#### Merit Score Framework (Tab 2)
- All 5 components now render in a single row (5-column grid)
- Descriptions converted to bullet lists, font size 10px
- No spillover — each card is compact and scannable

#### Operations Platform Mapping (Tab 5 + Tab 6)
- **Complete platform mapping refresh** from `Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx` — sheet "Platform Service List" (174 services: 160 mapped, 14 unmapped)
- **Two-tier lookup**: Service-level `SVC_PLATFORM_MAP` (174 entries from Platform Service List) falls back to dept-level `DEPT_PLATFORM` (16 IT dept codes)
- **9 platforms** now active: IT-Commercial IT, IT-Infrastructure Services, IT-Innovation and Digital, IT-Integrated Supply Chain and Finance, IT-Ent.Architecture,Data&Integration, IT-Group Functions and Hyperautomation, IT-Security,Risk&Compliance, IT-Services&Solutions IT, Unallocated
- Previously missing: Infrastructure, Security, Innovation, etc. — all now present
- 12 services marked Unallocated (from depts AI Services, AN6, B69+, B72, Transfers) — consistent with the 14 unmapped in source (2 resolved via service-level map)
- Service-level costs trimmed to 1 decimal place
- All platform filters working on Service Catalog + Allocation table

### Combined QA Result: 25/25 PASS — EXCO READY
- Phase A checks (A1–A12): All pass — DQ removed, 10x threshold, 5 components, weights correct
- Phase B checks (B1–B8): All pass — benefitSource on all rows, qualitative capped, rev/prod scored 0
- Regression (R1–R14): All pass — reconciliation, stream split, stages, classification, presets, tabs, scores
- Financial reconciliation: 280.2 = 100.0 + 180.2 (±0.01)
- Source distribution: 261 quantitative, 21 qualitative, 239 none, 0 rev-prod-unquantified
- All 4 presets solve; all 6 tabs render; zero console errors

## v5.0.0 — Data Layer Separation (24 Sep 2026)
**Data layer separated from decision engine. Refresh button. QA harness.**

### Data Layer
- New `prepare_data.py`: unified data preparation from any demand XLSX
- Produces `AOP2027-Demand-Data.json` companion file alongside HTML
- Dashboard fetches JSON on load; falls back to embedded data if missing
- "Refresh Data" button re-fetches and validates without rebuild

### QA Harness
- In-browser `AOPDataQA.validate()` runs 13 checks on every data load
- Visual health report: pass/fail/warn badges with summary statistics
- Critical checks (missing sheets, columns, negative costs, duplicates) block the engine
- Warning checks (row count drift, HPM presence, decision band coverage) allow with notice
- Before/after comparison table shown on refresh

### Architecture
- Data layer: `prepare_data.py` + `AOP2027-Demand-Data.json` (no decisions)
- QA layer: `qa.js` (browser) + checks in `prepare_data.py` (double validation)
- Decision layer: `engine.js` (unchanged — pure functions)
- Persistence: IndexedDB + portable JSON (unchanged)
- Build: `build_v5.py` single-pass, optional `--embed` for offline distribution

### Files Added
- `Data file/Implementation/qa.js` — browser QA harness module
- `Data file/prepare_data.py` — unified data preparation script
- `build_v5.py` — clean single-pass build script
- `Data file/AOP2027-Demand-Data.json` — companion data file
- `AOP2027-IT-Portfolio-Scenario-Modelling-v5.0.html` — dashboard with data layer separation

### Files Modified
- `Data file/Implementation/app.js` — async boot, fetch chain, refresh button, QA panel
- `Data file/Implementation/app.css` — QA report styles

## Data Source Pivot Guide (23 Sep 2026)
**Impact analysis and refresh instructions for pivoting from local `15926_IT AOP2027 Demand.xlsx` to SharePoint `AOP 2027 Consolidated Live.xlsx`.**

- Full data flow traced across all three pipelines (v3.x, OnePortfolio, v4.x)
- 9 code path changes identified across `prepare.py`, `extract_data.py`, `build_v4.py`, `build_v4_final.py`, `parse_xlsx.mjs`, and `Model-Logic-Specification.md`
- Structural compatibility checks: sheet names (`EW`/`Bu`), column headers, org labels
- HPM before-snapshot: 53 rows, 19.228 M EUR across 6 categories
- QA verification script and before/after template for HPM validation
- Saved scenario impact: source hash change triggers `needs-review` on all overrides
- See `Data file/DATA-SOURCE-PIVOT-GUIDE.md` for complete instructions

## v4.6.0 — Dynamic Total Row with Filter Context (23 Sep 2026)
**All filterable tables now show "X of Y" format in their total row when filters are active.**

### Engine Tables (Scenario/Prioritized, EW, BU, Overview)
- **Total row identity**: Shows `(funded/shown of total)` when filtered, e.g. `(120/300 of 521)`
- **Numeric columns** (Requested, Prioritised, Unfunded, Benefits): Show `sum of baseline` instead of `Avg mean` when filtered
- **Evidence column**: Shows `X of filtered (total total)` when filtered
- **Funding status**: Shows `funded of baseline funded` when filtered
- **Baseline passed via `allRows`**: `table()` accepts 4th parameter; `stream()` and `scenario()` supply unfiltered rows
- When filters are cleared, totals revert to the standard aggregate with averages

### v4.3 Tables (Demand, Operations, Service Catalog)
- **tblDemandSplit**: All four data columns now update — Count, Program Demand, Operations Cost, and Total IT Demand all show "X of Y" (previously only Count and Program Demand updated; Ops and Total were static)
- **tcoTbl**: Total row AOP2027 Costs column now shows filtered sum of visible cluster costs vs 469.7 baseline
- **svcCatalog**: AOP2027 and AOP2026 cost columns now show "X of Y" when platform filter is active
- **Generic fallback**: Any future v4.3 table gets count and demand "X of Y" by default

### Out of Scope
- Unfunded table (no filter bar)
- Allocation table (sort only, no filter)

## v4.5.0 — Clean Rebuild (22 Sep 2026)
**Single-pass build from v4.3 base. 45 patches, zero accumulated debt.**

### Engine: Four-Priority Funding Structure (replaces v3.5 five-stage model)
- **Four priorities**: Legal and Compliance (Must Do), High-Value Carry-Overs, Sustain Engineering and Hygiene, Value Based Portfolio
- **Eligible-only buckets**: P1 contains only LFRs with compliance name AND year + CCBs (18 progs, 24.8 M€). P2 contains only baselined carry-overs with Must Do/Must Have (23 progs, 27.1 M€). Ineligible demand classified directly to P4 — no "held" status.
- **True Carryover validation**: P2 funding capped at min(Requested, Baselined) for each carry-over
- **P3 funding order**: Change & Sustain funded first (100%), then Hygiene (CI, Upgrades) ranked by merit score
- **P4 catch-all**: Receives all demand not qualifying for P1/P2/P3 including LFRs without evidence (7.0 M€) and carry-overs without baseline (64.8 M€)
- **New data fields**: `lfrYear`, `lfrName`, `baselined` extracted from source columns K, L, P

### Engine: Lever Controls
- **Lever 1 (LFR)**: Basis toggle (% bucket, % AOP, M€ allocation) — v4.3 style
- **Lever 2 (Carry-Overs)**: RoI threshold slider (0x–5x, 0.5 step) — controls eligibility, not budget
- **Lever 3 (Sustain+Hygiene)**: Basis toggle (% bucket, % AOP, M€ allocation)
- **Lever 4 (Value)**: Basis toggle — respects lever cap via updated `valueTarget()`
- **Live slider updates**: `input` event handler for real-time re-render during slider drag

### Engine: Presets
- **Optimal Segmentation**: 100% bucket LFR, 0x carry, 100% bucket sustain, 100% bucket value
- **Protect Commitments**: 100% bucket LFR, 2x carry, 100% bucket sustain, 10% AOP value
- **Tighten Carryover Evidence**: 100% bucket LFR, 3x carry, 75% bucket sustain, 15% AOP value
- **Release Sustain Capacity**: 44% bucket LFR, 0x carry, 75% bucket sustain, 20% AOP value

### Program AOP Scenarios (Tab 2)
- **KPI**: Shows "X programmes funded" and "Over/Within budget" — removed per-stage breakdown
- **Funding bar**: Four segments with consistent colors matching lever display
- **Lever display**: Shows "X M€ funded of Y M€ Demand" (actual allocation, not theoretical target)
- **LFR Demand Breakdown**: Collapsed section showing Immediate / Scheduled / CCB sub-tiers. Note shows how many LFRs moved to P4.
- **Carryover Baseline View**: Collapsed section showing True Carryovers with baselined cap. Note shows how many carry-overs moved to P4.
- **Funding Prioritization Gate**: 5 cards (Gate 0 + 4 priorities) with names aligned to levers
- **Removed**: "Selected limits and funded demand" reconciliation table
- **Three scenario types**: Default (Vanilla), Leadership, Conference tracked in session

### Cleanup
- Removed scenario type system entirely (Default/Leadership/Conference buttons, status bar reference, createSession, fork, click handler, all `scenarioType` references)
- Removed "Scenario type: Default (Vanilla)" text from controls
- Tolerance default changed from 5% to **0%** — no overshoot, exact budget adherence
- QA harness updated: 28 checks including tolerance=0 and no-scenario-type assertions

### Engine: Budget Allocation Fix
- **Critical fix**: `spent[]` tracker now uses `r.automatic` (capped funded amount) instead of `r.cost` (raw request). P2 carry-overs previously inflated the spent tracker by 10.8 M€ (27.1 requested vs 16.3 capped), starving P4 of budget.
- **P2 fundable demand**: New `fundableDemand` field on stage results. P2 lever now shows "16.3 funded of 16.3 Demand" (sum of baselined caps) instead of "16.3 of 27.2" (raw requests).
- **Optimal preset**: P3 set to 20 M€ allocation (not 100% bucket), ensuring the full 100 M€ envelope is distributed: P1 24.8 + P2 16.3 + P3 21.0 + P4 43.0 = 105.0 (within 5% tolerance).

### Engine: Hold Fix
- P2 carry-overs exempt from "Numeric benefits missing" hold — baselined business case IS the evidence
- P2 carry-overs exempt from "Benefit claim above 5.0x" hold — same rationale
- P3 sustain/hygiene already exempt from benefit holds
- Only P4 (Value Based) programmes subject to benefit and 5x review holds
- Result: P2 now funds all 23 eligible carry-overs at full baselined cap (16.3 M€ vs 9.3 M€ before)

### QA Harness (29 checks)
- `qa-harness.js`: 29-check browser-side test suite — data, classification, holds, reconciliation, UI, presets, scoring, lever display
- `run-qa.py`: Automated Python runner with Selenium headless and manual fallback
- `QA-PROCEDURE.md`: Full procedure with automated + manual visual checklist
- New checks: P2 all eligible (no holds), P2 total=cap, P1 zero holds, P3 no benefit holds, lever display consistency
- Baseline result: **29/29 PASS — EXCO READY**

### OC-01: Dynamic Total Row (Demand Overview)
- Filtered count shows "X of 521" format instead of replacing the total
- Filtered demand shows "Y of 280.2" format with denominator baseline preserved

### OC-07: Business-Readable Change Log (Excel Export)
- Added "Change Log" sheet to every Excel download
- Columns: Date & Time, Action, Programme ID, Programme Name, Organisation, Origin Tab, Old Value, New Value, Business Note, Revision
- Actions translated to human-readable: "Included programme", "Excluded programme", "Evidence review", etc.
- Settings/preset changes excluded (only programme-level decisions)

### OC-10: Three Scenario Types
- Three scenario type buttons: Default (Vanilla), Leadership, Conference
- Active type highlighted, shown in status bar and controls section
- Scenario type preserved when forking
- Type is a workflow label — all engine functionality works identically across types

### OC-16: Per-Programme Score Breakdown
- Programme detail modal now shows a labelled merit score breakdown table
- Columns: Component, Raw score, Weight, Weighted score
- Shows all four components: Submitted Benefit, Submitted Priority, Captured Consequence, Decision Band
- Total row with final merit score

### Skill Update
- All reference files updated from v3.2 five-stage to v4.5 four-priority model
- `SKILL.md`: four priorities, six tabs, eligible-only classification, CHANGELOG default behavior
- `decision-policy.md`: full four-priority classification rules, P2 RoI threshold, P3 sustain-first, eligible-only buckets
- `dashboard-design.md`: six-tab layout, lever descriptions, LFR/Carryover breakdown sections
- `data-contract.md`: 22 source fields including lfrYear, lfrName, baselined
- `executive-approach.md`: four-priority classification, three scenario types

### PRD v4.5b
- Added Document Navigation (clickable table of contents)
- Appendix A: Demand Classification Logic — deterministic rules, catch-all description, dynamic bucket summary
- Appendix B: Quantified Benefit Textual Scoring — 0–10 rubric, integration options, Byronie discussion block
- Updated OC register: 6 items marked BUILT, 2 new items (OC-18, OC-19)
- All priority descriptions now logic-based (source fields + conditions), not hardcoded numbers

### Infrastructure
- Engine version: 4.5.0, schema: 4
- IndexedDB: Philips-AOP2027-v4.5
- Source fields added: lfrYear (col K), lfrName (col L), baselined (col P)

---

## v4.3.2 (18 Sep 2026)
### Operations Tab
- **3-level EW-style hierarchy**: Organisation → Sub-Org → Services, using exact v3.5 `burf-table` CSS classes
- **Columns renamed**: AOP2027 Costs M€, Own Consumption (M€ | %), Regions to BU (M€ | %), Functions & CoEs (M€ | %), Δ vs AOP2026 M€
- **Collapse/expand**: Click ▶ on BU cluster to show sub-orgs, click ▶ on sub-org to show services
- **Service costs in M€**: Converted from K€ to match program table format
- **Filter**: Organisation checkbox filter matching EW tab style
- **Sort**: AOP2027 Costs (High→Low / Low→High) dropdown
- **Total row**: 469.7 M€ at bottom, correct across all columns

### Demand Overview Tab
- Removed blue line from Operations card
- Fixed platform filter counts (org-level not program-level)
- Cascading filter counts update dynamically
- Total row updates on filter
- Clear All button works
- Committed Impact renamed to "(Proposed)"
- Removed Qualitative Benefits row

## v4.3 (18 Sep 2026)
### Demand Overview (Tab 1)
- Added "Total Program Demand" and "Total Operations Demand" summary lines in cards
- Committed Impact shows funded program benefits: BU Led | EW (renamed to "Proposed")
- Removed Qualitative Benefits row from Program card
- Operations card: removed redundant "Total Operations AOP 2027" line, shows 2026 Run-Rate + breakdown grid (BU Own 317.6, Regions 63.5, Functions 88.5)
- Checkbox filters (Organisation, Platform) with cascading dynamic counts
- Filter counts update when cross-filtering applied
- Total row updates dynamically on filter (count + program demand)
- Sort dropdown: Program Demand, Operations Cost, Total IT (High/Low)
- Clear All button resets all filters
- Operations cost mapped at sub-org level (MR→38.0, CT→25.3, etc.) not parent cluster
- Platform filter uses dept-code-to-platform mapping (AN3→Security, BL8→Commercial IT, etc.)
- Fixed platform filter to use data attributes for matching

### Program AOP Scenarios (Tab 2)
- Renamed from "AOP Scenarios" to "Program AOP Scenarios"
- All v3.5 functionality preserved (5 levers, 4 presets, bubble chart, editable tables)

### Enterprise Wide (Tab 3) / BU Led (Tab 4)
- All v3.5 functionality preserved
- "BURF" renamed to "Organisation" throughout
- Bubble chart: compact color legend only (removed long explanatory text)

### Operations (Tab 5)
- 6 KPIs: Total 469.7M, 2026 Run-Rate, ΔYoY, BU Own, Regions, Functions
- 3-level collapsible hierarchy: BU Cluster → Sub-Org → Services Opted In
- Columns: AOP2027 Costs M€, Own Consumption (M€|%), Regions to BU (M€|%), Functions & CoEs (M€|%), Δ vs AOP2026
- Checkbox filter with sort dropdown
- Service drill-down: pre-computed from Bill of IT (AOP2027 Dataset sheet)
- Service listing styled to match program table format
- Regions and Functions shown as cost allocators (net to 0 at BU level)

### AOP 2027 : One Portfolio (Tab 6)
- Renamed from "AOP2027 : Overview"
- Header KPIs: Total IT AOP, Operations AOP, Prioritized Program AOP, Split, Committed Benefit
- Heading renamed to "AOP2027 : Program Demand Overview"
- Removed chart summary text ("Showing X of Y records...")
- Organisation IT Cost Allocation table: Program Funded + Operations Cost per org
- Grand total: 469.7M ops + program funded

### Removed
- Conferences tab (removed in v4.1)

### Infrastructure
- Source data: 17926_IT AOP2027 Demand.xlsx (parsed via v3.5 AOPWorkbook.read())
- Operations data: Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx
- Service mapping: pre-computed from AOP2027 Dataset sheet (36 sub-orgs, ~3000 service entries)
- IndexedDB: Philips-AOP2027-v4.3
- Workflow: 6-step (Demand Overview → Program Scenarios → EW → BU Led → Operations → One Portfolio)

---

## v3.5 (Base)
- Original v3.5 from ChatGPT/AOP 2027/Modeller
- 4 tabs: AOP Scenarios, Enterprise Wide, BU Led, AOP2027 : Overview
- Full AOP engine: normalize, enrich, solve, transact
- AOPWorkbook: XLSX read/write
- IndexedDB persistence, portable JSON export/import
- Source: 15926_IT AOP2027 Demand.xlsx
