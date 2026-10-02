# Current release — v5.9.1, 2 October 2026

This section supersedes contradictory historical guidance below. Current build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.1.html. Base: v5.8_1.html.

## v5.9.1 patch 3 — Tab 1 Proposed Benefits, Tab 2 column toggle, Tab 3/4 simplified status (2 Oct 2026)

### Tab 1 — Proposed Benefits (renamed from Committed Benefits)
- KPI renamed to "Proposed Benefits" to reflect it now shows all demand benefits, not just funded.
- Benefit computation changed from `funded.filter(...)` to `all.filter(...)` — captures total benefits identified by all ExCo leaders across the full demand portfolio.
- Values: 7160.2 M€ Hard / 7916.0 M€ Soft (was 6740.9 / 4875.6 funded-only).

### Tab 2 — Demand in Scenario column toggle
- Requested column always shows total demand in both Prioritised and Not Funded toggle views.
- Prioritised toggle: shows Prioritised (M€) column, hides Unfunded column.
- Not Funded toggle: shows Unfunded (M€) column, hides Prioritised column.
- Column count reduced from 8 to 7 per view (cleaner layout).
- Summary row and program rows both respect the toggle.

### Tabs 3/4 — Simplified funding status column
- Status cell simplified from 5+ detail lines to 3: status pill, reason, and lever name.
- Removed: "New/Carry · Stage", "Overall decision", "Benefit evidence", "Warnings".
- Tab 2 retains full detail for scenario comparison.

## v5.9.1 patch 2 — ExCo tradeoff all-stage, popup redesign, low-funding table restyle (2 Oct 2026)

### ExCo Trade-off Cockpit — all stages now eligible
- **Root cause**: both engine `tradeoff()` and cockpit preview filtered on `r.stage>=3`, excluding stage 0–2 programs. Leaders like Wim Appelo (all 7 unfunded programs in Carry Over stage 1) showed "+12.8 M€ delta" but "Programs unlocked: 0".
- **Fix**: removed `r.stage>=3` gate from engine increase/decrease paths and cockpit preview. All eligible unfunded programs now participate in trade-off budget allocation by merit score, regardless of lever stage.
- **Validation**: automated test across all 20 ExCo/stream combinations — every combo with unfunded eligible programs now correctly shows programs unlocking when budget is increased.

### Organizations with Low Funding Coverage — restyled
- Renamed from "⚠ Organizations with Low Funding Coverage — N orgs below 20%" to "Organizations with Low Funding Coverage".
- Table class changed to `portfolio burf-table` (same as Demand in Scenario) for consistent styling.
- Column layout: Organisation | Unfunded | Requested (M€) | Funded (M€) | % Funded | Reasons.

### Program detail popup — redesigned layout
- **Section 1**: Program name + prioritization status badge (green/amber/red)
- **Section 2**: Unique ID · Organisation · Funding Type (lever)
- **Section 3**: Demand | Prioritised Demand (on blue-grey background card)
- **Section 4**: Funding Rationale — highlighted card with left border colour by type
- **Section 5**: Details Overview — data quality table with ✅ (good for scoring) / ⚠ (present but insufficient) / ❌ (no data) per field
- **Section 6**: Merit Score table (unchanged)
- **Section 7**: Submitted Details — auto-collapsed `<details>` so popup fits on screen without scroll

## v5.9.1 — Optimal preset, 1-decimal rule, ExCo cockpit fix, low-funding panel, source panel removal (2 Oct 2026)

### Req 1 — Optimal scenario: Lever 3 fixed at 20 M€, rest in Lever 4
- `preset('optimal')` sustain lever changed from `{basis:'bucket',pct:60}` to `{basis:'amount',amount:20}` — Lever 3 (Sustain Engineering) is now capped at exactly 20 M€ in the Optimal Segmentation scenario.
- Lever 4 (Value Based Portfolio) continues to auto-fit via `_autoValue:true` / `autoValueCeiling()`, capturing all remaining budget after Levers 1–3.

### Req 2 — Hard rule: all displayed numbers use exactly 1 decimal place
- `fmt(requested/budget*100, 0)` → `fmt(..., 1)` in demand-vs-envelope table (was showing 0 dp for the budget utilisation %).
- `d.amount.toFixed(d.amount%1?2:0)` → `Number(d.amount.toFixed(1))` for the AOP 2026 Spend chip (was showing 0 or 2 dp depending on whether value was integer).
- `(bandPct*100).toFixed(0)` → `toFixed(1)` in QA decision-bands line.
- Available and over-budget display `.toFixed(6)` → `.toFixed(1)` in scenario KPI and stream table cells.

### Req 3 — ExCo Trade-off Cockpit: stage filter aligned with engine
- Cockpit preview (increase delta) filter changed from `r.stage===3` → `r.stage>=3` for unfunded programs.
- Cockpit preview (decrease delta) filter changed from `r.stage===3` → `r.stage>=3` for funded programs.
- These align the display preview with the `tradeoff()` engine function which already correctly uses `r.stage>=3`. With IT Simplification mode OFF (default) there are no stage-4 programs so results are unchanged; the fix activates when IT Simp lever is enabled.

### Req 4 — Organizations with funding below 20%: data-backed analysis panel
- New `lowFundingOrgsPanel(rows)` function added before `scenario()` in the UI IIFE.
- Panel renders in the Scenario tab, after the Merit Score Framework, showing all organisations receiving < 20% of their requested budget.
- Current scenario: **9 organisations** below 20% threshold (ISC 9%, People function 3%, Patient Safety & Quality 0%, Innovation & Design Ops 16%, North America 0%, Precision Diagnosis DXR 0%, AM&D 12%, Health & Safety 0%, Unknown 0%).
- **Data-backed reasons generated per org** from: stage distribution (early-lever exhaustion, Value-stage concentration), merit score band, hard/soft benefit split, and per-program cost profile.
- Key finding: ISC (25.8 M€ requested, only 9% funded) has all 7 unfunded programs in Carry Over (Lever 2) — largest programs are 10.1 M€ and 8.25 M€, exhausting the carry-over lever envelope before ISC's tail demand is reached.

### Req 5 — Remove Source completeness and decision readiness panel
- Removed `window.renderSourceAttention=function(state){...}` declaration and both call sites.
- The "Source completeness and decision readiness · N programs retained · N paybacks parsed · N missing requests" panel no longer appears above the main content area.

---

# Previous release — v5.8.0, 1 October 2026

This section supersedes contradictory historical guidance below. Current build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html. Current PRD and detailed requirements: PRD/*-v5.7.0.docx. QA and detailed comparisons are in AOP 2027 Modeler/QA-report.html and Detailed-data-comparison.html, with reproducible evidence in Data file/Finance-20260930-v5.7.0.

## v5.8.0 — Multi-item UX and data update (2 Oct 2026)

### Scoring (Item 1)
- Scores auto-recomputed from patched benefit data — no additional code change required. All previously null-benefit programs now contribute benefit points to merit scoring via the existing `enrich()` ratio ladder.

### Benefit loading validation added to PRD (Item 2)
- Added mandatory benefit null validation rules to `Skills/references/data-contract.md`: pre-build check (>20% null = block), post-embed cross-check against data extract, 5% max delta tolerance, and required changelog entry per refresh.

### Ops Cost column — function/region leaders (Item 3)
- Added 10 missing ExCo leaders to `EXCO_OPS_COST`: Laura Matz, Wim Appelo, Charlotte Hanneman, Özlem Fidanci, Jeff DiLullo, Ling Liu, Heidy Schein, Steve C de Baca, Carla Rosana Goulart Silva Peron, Filip Koek — all with value 0.0 (their IT costs are allocated into BU TCO via `functionAlloc` and `regionAlloc`).
- Demand Split table now shows `0.0` (annotated tooltip: "Costs allocated into BU TCO") for these leaders instead of `—`.
- Description note updated from "shown as —" to "shown as 0.0".

### IT Cost Allocation text (Item 4)
- Removed pre-table narrative paragraph ("BU Led: direct BU programme funding...").
- Replaced post-table numbers paragraph ("Prioritised Programme AOP: X M€...") with a 4-bullet summary list below the table — no live M€ numbers that could be misread out of context.

### Source decision coverage collapsed by default (Item 5)
- Section now uses `<details>/<summary>` — collapsed on page load. User clicks "► Source decision coverage" to expand. No change to content.

### Default page load (Item 6)
- Confirmed: `tab='demand'` is the hardcoded default — Tab 1 (Demand Overview) loads on every fresh open. No IndexedDB tab-restore logic found.

### Programme → Program terminology (Item 7)
- Replaced all 5 user-visible occurrences of "programme" with "Program" (case-corrected). Applies to IT Cost Allocation bullets and two narrative data fields. No tab labels were affected.

### New data extract (Item 8)
- Authoritative extract is `Data file/ExCo-20260930-v5.8.0/AOP2027-Data-Extract.html` — generated from Excel `299262020.xlsx` which carries all correct benefit values. This extract is the benefit validation baseline for v5.8.0.

## v5.8.0 — Benefit data fix: all 158 null-benefit programs corrected (1 Oct 2026)

### Benefit data patch
- **Root cause**: v5.8.0 was built from Excel `110261530.xlsx` captured before teams populated the "Quantified Benefits (in K€)" column — 258 BU programs and 49 EW programs had `benefit: null` in the embedded source-data, suppressing all monetary benefit from ExCo totals and scoring.
- **Fix**: `col[21]` (BU benefit) and `col[18]` (EW benefit) patched in-place using values from the authoritative data extract (`299262020.xlsx`). 154 BU + 4 EW programs updated.
- **Impact**: Total portfolio benefit corrected from **897.7 M€ → 14,857.7 M€** across all 17 ExCo leaders.
- **PH (Deeptha Khanna)**: was **4.0 M€** (2 programs) → now **120.0 M€** (39 programs, 93.0 hard / 27.1 soft).
- All other leaders confirmed aligned with data extract: Julia Strandberg 4891 M€, Özlem Fidanci 4742 M€, Jie Xue 1896 M€, Marnix 1632 M€, Bert van Meurs 1183 M€ (5 M€ residual from unmatched program IDs), Shez Partovi 137 M€, Laura Matz 112 M€, Wim Appelo 69 M€.
- Benefit scores for previously-null programs now correctly influence the automatic prioritisation — programs with real benefit claims now compete on merit.

## v5.8.0 — Data refresh, PMI update, AOP 2026 Spend lines (1 Oct 2026)

**Source**: AOP 2027 Consolidated Live 110261530.xlsx | SHA-256: 8058eb8ba9fc

### Data refresh
- Source changed from `AOP 2027 Consolidated Live 299262020.xlsx` to `AOP 2027 Consolidated Live 110261530.xlsx` (1 Oct 2026 15:30 extract)
- Programs: 447 → 437 active (excl. PMI); total with PMI: 442
- Requested demand: 327.1 M€ → 279.9 M€ base (271.7 + 8.2 PMI)
- EW: 108.4 M€ (167 programs), BU: 163.2 M€ (270 programs)
- PMI: 5.2 M€ → **8.2 M€** (+3.0M, new Bu-453 "Delta/Epsilon" under Finance)

### Key data changes by ExCo
- **Shez Partovi** (EI): 16.8 → 13.9 M€ (−2.9M) — 6 EI programs zeroed
- **Bert van Meurs** (IGT+STO): 52.6 → 50.1 M€ (−2.5M) — STO decomm consolidated
- **Jie Xue** (PD): 15.3 → 15.2 M€ (−0.1M) — 8 MR placeholders added

### Decomm data improvements
- STO: 4 overlapping decomm programs removed (Bu-449/450/451/452 = 2.7M€), replaced by 2 consolidated entries (Bu-420, Bu-444)
- EW-189 reclassified to Decomm at 0€ (was 3.0M€ under Finance)
- Bu-263 carry-over corrected from "New Initiative" to "Change & Sustain"
- Decomm total: 35.2 → 32.5 M€

### Program-level changes
- Added: 23 programs (mostly placeholders, plus Bu-453 PMI 3.0M€)
- Removed: 6 programs (Bu-384, Bu-449/450/451/452, Bu-458)
- Value changes: 16 programs (primarily EI reductions)

### AOP 2026 Spend lines (Tab 2)
- Each lever card now shows an AOP 2026 reference line below the allocation selection:
  - L1 (LFR): 32 M€
  - L2 (Carryover excl. LFR, Decomm): 122.11 M€
  - L3 (C&S, Upgrades & CI excl. LFR, Carryover): 9.39 M€
  - L4 (Other excl. LFR, Carryover, C&S, Upgrade & CI): 16.85 M€
  - L5 (Decommissioning): 4.36 M€
- Deep blue (#00126E) background, white text, consistent with Philips brand

### Header update
- Header now shows: "One Portfolio Navigator · v5.8.0 · Built {date} {time} with Demand Details at 1.10.26 at 15:30"
- Timestamp derived from source filename (110261530 = 1.10.26 at 15:30)

### Tab 6 fixes
- **Cost allocation table fixed**: New workbook stores allocations as k€ amounts (not fractions). Engine now auto-detects scale: divides by program cost to get fractions for BU programs, divides by 100 for EW charging key (percentage sums ~42%)
- **Removed debug sections**: EW charging percentages, Traceable finance ledger, and Finance QA badge no longer rendered in Tab 6
- **Prioritized Programs AOP excludes PMI**: KPI shows 100.0 M€ (base programs only). PMI 8.2 M€ shown separately in its own KPI. Total IT AOP (578.5 M€) includes all three: Programs + Operations + PMI

### QA
- Zero console errors
- All 6 tabs render correctly
- Cost allocation table reconciles: Grand Total ✓ at 578.5 M€ (BU 41.7 + F&R 58.3 + Ops 470.4)
- Engine recalculates all scoring, funding and charging from new data
- ExCo hierarchy, benefits classification, lever cascade all operational
- Operations data unchanged (470.4 M€)

## v5.7.1 — ExCo LFR decisions, Carry Over ROI lever, header update (30 Sep – 1 Oct 2026)

### Tab 1: ExCo Demand table simplified
- Removed columns: Prioritised M€, Gap M€, % Funded. Table now shows: ExCo Leader/Organisation, Programs, Requested M€, Benefits M€, Hard/Soft, Ops Cost M€.
- Ops Cost shows for BU-cluster ExCo members (from Bill of IT). Enterprise function leaders show dash (their costs are allocated into BU TCO).

### Tab 2: Demand in Scenario table
- Evid. column removed from all table instances.
- Group counts show funded/total for ALL programs in that org (e.g. "(1/7)"), not just the filtered view.

### UI: L4 ceiling tick, L2 default basis
- L4 slider: red tick on the grid marks the budget ceiling. Moves dynamically when upstream levers change.
- L2 (Carry Over): defaults to "% of bucket demand" basis matching other levers.
- Tab 2 Demand in Scenario: Evid. column removed. Group counts show funded/total for ALL programs in that org (not just filtered view).
- Session migration: carry basis auto-corrected from 'amount' to 'bucket' on recovery.

### Lever cascade — L4 sole absorber (corrected)
- **New**: `rebalance(settings, changedKey, data)` function in the engine. When any lever is adjusted, all downstream levers auto-scale proportionally to maintain the Total AOP budget.
- Order is strict: L1 → L2 → L3 → L4 → L5. Changing L1 scales L2/L3/L4. Changing L2 scales L3/L4. Changing L3 scales L4. Upstream levers are never affected.
- Wired into both slider drag (input event) and numeric input (change event) handlers.
- Rebalance only fires when downstream targets exceed remaining budget. If budget has headroom, no adjustment.

### ExCo LFR decisions as ranking demotion (not permanent exclude)
- Opt-out programs marked `lfrVerified=false` and `lfrOptOut=true` in `enrich()`. They rank below verified in Lever 1 but remain fundable at higher slider settings.
- ExCo feedback displayed as warning on program row: "ExCo LFR opt-out: {leader} — {feedback}". Detail popup shows "ExCo LFR Opt-Out (deprioritised)" rationale type.
- No permanent overrides applied. `createSession()` starts with empty overrides.

### Fix: Total AOP respects budget (100 M€)
- **Root cause**: Excluded LFR programs (ExCo opt-outs) consumed budget in the solve loop's `spent[]` array before overrides zeroed their `final`. The residual available for Value was reduced by 7 M€ of phantom spending.
- **Fix**: Excluded programs are now skipped at the top of the funding loop (`continue`). They don't increment `spent[]` or `automatic`. Budget freed for downstream stages.
- **Result**: Default Optimal at 100 M€ → L1 37.9 + L2 16.8 + L3 20.6 + L4 24.8 = **100.0 M€ fully allocated**. L4 at 100% bucket fills remaining budget naturally.
- Value lever slider shows full 0-100% range; the solve engine caps funding at the residual.

### 1. Lever 2 — Carry Over demand slider (engine + UI)
- **Converted from fixed display to standard 3-mode slider** (% of bucket demand, % of Total AOP, Allocation M€), matching Levers 1, 3, 4.
- Carry-over programs now **ranked by ROI** (benefit/cost ratio). Previously confirmed baselines were funded first with no slider control.
- All carry-over programs are eligible. Removed the hold "No confirmed approved baseline for Carry Over funding" — all carry-overs compete on ROI within the slider target.
- Confirmed baselines remain capped at `min(requested, approved baseline)`. Non-baseline carry-overs use full request amount.
- Settings: `carry` changed from `number` (ROI threshold 0-10) to `{basis, pct, amount}` lever object. Old sessions auto-migrate via `validateSettings()`.
- Presets updated: Optimal/Protect/Evidence at 100% bucket, Capacity at 75% bucket.

### 2. Baselined carry data
- The confirmed 16.8 M€ baseline carry demand is preserved as `confirmedCarryDemand` in stages output.
- Lever 2 allocation selection shows actual % funded (e.g. "56.3 M€ funded of 107.6 M€ Demand (52.3%)").

### 3. Funding Prioritization Gate and rules text updated
- Gate 2 (Carry Over): "All prior-year carry-over demand ranked by ROI. Confirmed baselines pre-selected within slider target. Slider controls funding envelope."
- Allocation rules: "All carry-over records enter the lever and are ranked by ROI. The slider controls the overall funding envelope."
- Preset comparison table: P2 column renamed from "Baseline cap" to "Carry Over / 100% ROI".
- Optimal description: "ROI-ranked Carry Over" replaces "baselined Carry Over".

### 4. Old static text removed
- "Confirmed business cases funded at approved baseline cap. No ROI threshold. Funding = min(requested, approved baseline)." — no longer rendered (lever mode changed from `roi` to standard `lever`).

### 5. LFR ExCo opt-in/opt-out decisions (67 decisions, 30 Sep 2026)
- **32 opt-out programs excluded** from LFR with ExCo feedback captured in override notes.
- **40 opt-in programs** confirmed in LFR — no change needed.
- Feedback appears in Funding Rationale popup as "ExCo LFR Decision" type, e.g. "Manual exclusion: ExCo LFR opt-out: Charlotte Hanneman — NDA, separate bucket (on top off)".
- Decisions embedded as `LFR_EXCO_DECISIONS` constant. Applied automatically on new session creation via `applyLfrDecisions()`.
- Opt-out by ExCo: Laura Matz (6), Ling Liu (5), Julia Strandberg (5), Steve C de Baca (4), Charlotte Hanneman (3), Marnix van Ginneken (2), Carla Peron (2), Özlem Fidanci (2), Shez Partovi (1), Bert van Meurs (1), Jie Xue (1).
- Impact: LFR funded drops from 43.8 M€ to 36.8 M€ (7.0 M€ released). 32 programs excluded.

### 6. Header updated
- From: `One Portfolio · Evidence-led · v5.7.0`
- To: `One Portfolio Navigator · v5.7.1 · Built {date} {time}` — dynamic build timestamp.
- Page title updated to "AOP27 One Portfolio Navigator v5.7.1".
- Rule VERSION constant updated to `5.7.1`.
- IndexedDB namespace updated to `v5.7.1` (separate storage from v5.7.0).

### Scenario impact summary (Optimal Segmentation at 100 M€)
| Stage | v5.7.0 demand | v5.7.0 funded | v5.7.1 demand | v5.7.1 funded | Delta |
|---|---|---|---|---|---|
| LFR | 53.1 M€ | 43.8 M€ | 53.1 M€ | 36.8 M€ | -7.0 M€ (32 opt-out exclusions) |
| Carry Over | 107.5 M€ | 16.8 M€ | 107.5 M€ | 56.2 M€ | +39.4 M€ (ROI slider, holds removed) |
| Sustain | 34.4 M€ | 20.7 M€ | 34.4 M€ | 0.0 M€ | -20.7 M€ (budget consumed by carry) |
| Value | 85.1 M€ | 18.9 M€ | 85.0 M€ | 0.0 M€ | -18.9 M€ (budget consumed by carry) |
| **Total** | — | **99.9 M€** | — | **93.0 M€** | **-6.9 M€** |

Note: The carry lever at 100% now funds many more carry-over programs (previously held). Users should adjust the carry slider down to release budget for Sustain and Value stages.

---

## v5.7.0 (build 2), 30 September 2026

433 active Programs; demand 285.2129 M€ including 5.19 PMI. Default 100 M€ Optimal funds 99.963 M€ base, plus PMI and 470.314463 M€ Operations = 575.467463 M€. BU row 276 is a charging key only; exclude 40 M€. Correct its fraction vector by the confirmed 1,000 factor and retain 22.6303317536% unallocated. All Programs types use source recipient fractions; Operations retains own/Region/Function allocation without duplicate sender costs.

### Build 2 changes (30 Sep 2026)

1. **Cost allocation table consolidation (Tab 6):** Replaced 10-column granular table with consolidated 5-column view matching ExCo report format — Organisation, BU Led (M€), Functions & Regions (M€), Operations Cost (M€), Total IT Charge (M€). Sorted by total descending. Functions/Regions distributed via Type II keys shown as a separate row. Footer includes programme/operations AOP summary.
2. **Decimal consistency:** All user-visible numbers enforce X.X (one decimal). Internal ledger and export retain full precision.
3. **Lever 4 (Value Based Portfolio) clarity:**
   - All lever allocation selections now show actual funded percentage (e.g. "18.9 M€ funded of 85.1 M€ Demand (22.2%)") instead of absolute amounts only.
   - Decomm/Replatform programs are scored and ranked together with all stage 3 demand. The `isItSimp` flag tracks eligibility without changing stage assignment when IT Simplification is off.
   - When IT Simplification is toggled on, the lever pre-populates with the funded Decomm amount from Value (e.g. if 2 M€ of 27 M€ Decomm demand was funded, slider starts at 2 M€). Toggling off resets to zero.
   - IT Simplification lever shows contextual text: "Decomm/Replatform demand pre-prioritized from Value: X M€ of Y M€ total IT Simplification demand."
4. **Tab 6 Excel download:** Added "Download Excel" button in the Finalise Scenario toolbar row, exporting the complete scenario workbook.

Confirmed carry uses approved baseline cap with no ROI threshold. Benefits accepted without benefit-only holds. Nine missing-request and four invalid-decision rows are audit-only. F&R/BU request and merit edits preserve source data; ExCo trade-offs are isolated by stream. The shared finance ledger drives UI/export reconciliation. Data extract supports every column in 22 datasets. No formal external handoff is required. Unallocated balances are explicitly disclosed in QA.

---

## Historical context (superseded where inconsistent above)

## v5.6.1 — 29 September Programs and Operations refresh

Programs: 464 records, 287.1229 M€ including 5.19 M€ PMI. Operations: 182 services, 470.3144630385122 M€, fully reconciled to consuming organisations and recipient TCO. Source workbooks unchanged. Source snapshots, comparison, exact changes and QA are in Data file/Refresh-20260929-v5.6.1.

The build refreshes data, makes Operations displays source-driven, repairs PMI/allocation and inclusion-export reconciliation, adds Excel source references, separates browser storage by source, expands evidence-change fingerprints, and adds all-column filtering to the data extract. Funding, scoring and default-setting functions are preserved from v5.6.

QA: 152/152 checks passed, including 618 column filters across 20 datasets. Discussion/review use only until source and business gaps are resolved or explicitly accepted: missing F&R charging key; 20 missing requests; Bu-388 cached decision errors; benefit validation; policy/envelope alignment; Finance/Planisware approvals. Full details: QA-report.html.

# AOP 2027 One Portfolio Dashboard — Changelog

## v5.6.1 — Excel Export v2 — 8-tab executive export with ExCo, Cost Summary, IT Simplification (29 Sep 2026)

**Enhancement to v5.6.0. Excel export (`exportExcel()`) fully rewritten. No engine changes.**

### Excel Export — `write()` function (XLSX writer)
- **Fix: "Cannot apply changes" Excel repair prompt** — root causes eliminated:
  1. `t="inlineStr"` changed to `t="str"` (formula-string type) — removes legacy format flag
  2. Added `<fileVersion appName="xl" lastEdited="7" rupBuild="22228"/>` + `<bookViews>` to workbook.xml — prevents "older version of Excel" banner
  3. `<autoFilter>` now only emitted for data-table sheets (`s.filter === true`) — was incorrectly applied to all 4 sheets including the Scenario Overview
  4. Freeze pane (`<pane ySplit>`) only applied where `s.freezeRow > 0` — not on narrative/summary sheets
- **Fix: 6 decimal places** — `numFmt formatCode="0.000000"` → `"#,##0.0"` (1dp with thousands separator)
- **New: Rich styles** — 8 cell formats, 3 fonts, 5 fills:
  - `rowStyles[r]=0` normal data; `=1` Philips dark-blue header (white bold); `=2` mid-blue section header; `=3` light-blue subtotal (bold)
- **New: `colWidths[]` and `freezeRow` per-sheet options** — proper column sizing for each tab
- **New: second numFmt** `0.0%` for percentage cells

### Excel Export — `sheets()` function (8 tabs, was 4)

| Tab | Name | What's new |
|-----|------|------------|
| 1 | Scenario Overview | Added IT Simplification lever section; added ExCo accountability summary with funded/unfunded/hard-benefit/soft-benefit per leader; section/subtotal row styling |
| 2 | Programmes | **All programmes** (was funded only) + `Funded Yes/No` indicator column + `ExCo Leader` column + `Prog Type` column; autoFilter on row 1 |
| 3 | Cost Summary *(NEW)* | Section 1: ExCo × Type 1/2/3 cross-tab (count + requested + funded M€); Section 2: Stage × Type funded breakdown; Section 3: BU cluster IT cost allocation |
| 4 | Levers & Settings *(NEW)* | All 5 levers (LFR, Carry-RoI, Sustain, Value, **IT Simplification**) with basis/target/demand/allocated/prog count/% funded; merit weights; budget; export scope |
| 5 | Operations Overview | Unchanged content; new row styles |
| 6 | Scoring Evidence | `ExCo Leader` column added |
| 7 | Decisions Log *(NEW)* | Full event audit trail with `ExCo Leader` column |
| 8 | Change Log *(NEW)* | Simplified chronological override log with `ExCo Leader` column |

### Type 1/2/3 classification (Cost Summary)
- **Type 1 — BU Led**: `r.type` field contains "BU Led"
- **Type 2 — Cross BU**: `r.type` field contains "Cross BU"
- **Type 3 — F&R**: `r.type` field contains "F&R"
- Classification is dynamic — groups by actual `r.type` values, sorted BU Led → Cross BU → F&R

---

## v5.6.0 — IT Simplification lever, Levers filter, ExCo revert, fresh session (29 Sep 2026)

**Side-version built from v5.5.0. Inherits all v5.5 defect fixes. Confidence carry-forward: 43.3/100 (v5.5 baseline). Five functional improvements added; no engine calculation regressions.**

### Feature: IT Simplification — Optional 5th Lever

**Toggle "IT Simplification Lever"** added to the Tab 2 scenario toolbar. When ON, programmes with `category` containing "Decomm" or "Replatforming" are separated from Stage 3 (Value Based Portfolio) into a new Stage 4 — IT Simplification.

- **Engine**: `isITSimpProgram(r)` identifies candidates via `category.toLowerCase().indexOf('decomm')>=0 || indexOf('replatform')>=0`
- **Default**: `itsimp:{basis:'bucket',pct:0}`, `itsimpMode:false` — no budget reserved until user acts
- **Lever**: Full 3-basis support — % of bucket demand / % of Total AOP / Allocation (M€) — matching Levers 3 and 4
- **Budget mechanics**: `itsimpReserve()` deducts IT Simplification allocation from `valueTarget()`, ring-fencing Stage 3 from consuming the IT Simplification envelope
- **STAGES**: Now 5 entries: `['Legal and Compliance (Must Do)','Carry Over demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification']`
- **Funding Gate**: Gate 5 "IT Simplification" shown conditionally when toggle is ON, with demand/funded/coverage stats
- **Toggle initialises**: `itsimp={basis:'bucket',pct:0}` on first activation; stored in `session.settings`
- **Live data**: 29 programmes (category "Decomm/Replatforming") correctly extracted; 0M€ default (configurable)
- **Addresses**: L2-05 audit finding (4-stage vs 5-stage policy gap from v5.5 QA cycle)

### Feature: Levers Filter — All Tabs

`stageName` dimension added as **"Lever"** filter to every filter bar:
- `filters()` function → Tabs 3 / 4 / 6
- `demandInScenario()` filter row → Tab 2 Demand in Scenario
- `portfolioInclusionTable()` filter row → Tab 2 Portfolio Inclusion Table

All filters remain on one row; no new filter row created.

### Feature: Demand in Scenario — Consistent Funding Status

- Column header: always **"Funding status / demand details"** (was conditional on Prioritised/Not Funded toggle — now fixed)
- Organisation summary row: always shows **"X Funded · Y Partially Funded · Z Unfunded · N Total Demand · M holds"** drawn from `allOrgMap` (all programmes, not just the current view)
- `summaryRow()` gains `fullRows` parameter; `fstatus` precomputed before the return statement

### Feature: Service Catalog — Platform Column Header (Tab 5)

Column header renamed **"Platform Name" → "Platform"** in the Service Catalog table (`#svcCatalog`).

### Feature: New Scenario (100M€) Button

**"New Scenario (100M€)"** button added to the scenario savebar (purple outline, purple label). Clicking creates a fresh `AOP.createSession(session.data)` with budget=100M€ and the Optimal Segmentation preset, clearing all overrides, reviews and ExCo trade-offs. Resolves: users could not return to the default optimal scenario from a heavily customised state.

### Feature: ExCo Trade-off Revert

- **Per-ExCo Revert button**: "Revert" button (red outline) appears in the last column of the ExCo cockpit table for any leader with stage-3/4 programme overrides — reverts only that leader's decisions to automatic
- **Updated "Reset all trade-offs"**: Now also reverts all stage-3/4 programme overrides in addition to clearing pending input values — fully restores automatic prioritisation
- Resolves: applied ExCo trade-offs could not be undone after the "Apply" action was committed

### Engine

- VERSION: `5.5.0` → `5.6.0`
- New functions: `isITSimpProgram(r)`, `itsimpReserve()` in `solve()`
- `validateSettings()`: full itsimp validation for all 3 bases
- `switchBasis()`: 'itsimp' added as valid key with `si=4`
- `defaults()`: includes `itsimp:{basis:'bucket',pct:0}`, `itsimpMode:false`

### QA / Audit

- Syntax: Node.js `--check` PASS on main script
- Runtime: no console errors on load, Tab 2 render, IT Simplification toggle ON/OFF
- Stage 4: 29 programmes correctly classified at 0M€ default; `itsimpReserve()` correctly ring-fences Stage 3
- Lever: 3 basis tabs render correctly; `switchBasis` handler wired
- Fresh session: creates `{basis:'bucket',pct:0}` at 100M€ ✓
- ExCo revert: per-ExCo and global reset both clear stage-3/4 overrides ✓
- **Remaining open** (carried from v5.5): L1-04 (15 missing ops services), L2-04 (130 ops cost differences)

---

## v5.5.0 — Defect-fix build: PMI double-count, Ops over-count, KPI restore, a11y (29 Sep 2026)

**Pure defect-fix build. Validation cycle 20260929T063821Z: confidence 43.3/100 (up from 40.5, baseline 34.9). UI/UX defects 0 (was 9). L2-08 metadata now PASS. Completed 18/32 automated cases; 14 pending owner/data decisions outside code scope.**

### Critical: UX-09 — PMI no longer double-counted in Demand Split footer
- Root cause: `result.rows` already contains PMI rows (engine does `rows.concat(pmiRows)`), so `gTotDem`/`gTotFund` already included PMI. The footer then added `pmiInfo.requested`/`pmiInfo.funded` a second time.
- Fix: Removed the redundant `+pmiInfo.count`, `+pmiInfo.requested`, `+pmiInfo.funded` additions from the Total row. PMI disclosure row above the footer is retained as a visual highlight only.
- Effect: Footer Requested corrects from 292.24 M€ → 287.05 M€; Funded from 110.37 M€ → 105.18 M€; count from 447 → 443.

### Critical: UX-10 — Ops footer total uses authoritative OPS metadata (not summed EXCO map)
- Root cause: `gTotOps` summed `EXCO_OPS_COST` for every ExCo leader including Functions/Regions whose costs are already allocated into BU totals, yielding 568.5 M€ instead of 469.7 M€.
- Fix: Footer total Ops cell and footer note now use `OPS.meta.opsTotal2027` (fallback 469.7) — the source-verified total.
- ExCo-level ops rows still show their individual BU-cluster allocations; only the total row is corrected.

### High: UX-02 — PMI On Top KPI restored to One Portfolio (Tab 6)
- Root cause: A "clean exec view" patch at Tab 6 activation replaced the entire KPI block with 5 hard-coded tiles, discarding the PMI card that the original builder had added.
- Fix: Tab 6 KPI replacement now reads `aop.result.pmi` and appends the PMI tile when programmes are present; column count sets `--kpi-cols` CSS variable (5 or 6).

### High: UX-03 — Operations AOP tile in Tab 6 derives from OPS metadata
- Root cause: Same "exec view" patch hardcoded `469.7 M€` literal in both the Ops tile and the Total IT tile.
- Fix: Both tiles now use `(OPS.meta.opsTotal2027)||469.7` so they follow an approved Operations refresh.

### High: UX-04 — Unfunded bubbles and median merit line restored in One Portfolio chart
- Root cause: Another patch hid unfunded bubbles and removed the median line as a cosmetic choice with no design exception logged; validation flagged the suppression as a defect.
- Fix: Removed the hiding loops for `circle[data-bubble]` (unfunded) and `.median-line/.median-label/.median-value`. Full demand is now visible in the bubble chart.

### High: UX-08 — Finance QA reconciliation status now visible in One Portfolio view
- Root cause: `renderFinanceQA()` existed and was tested in exports but was never injected into the DOM render path for Tab 6.
- Fix: After the allocation table is inserted, `AOPDataQA.validateFinance()` + `AOPDataQA.renderFinanceQA()` run and the resulting panel is inserted before the third `.panel` in the overview. Errors are silently caught so a QA failure never breaks the render.

### Medium: UX-05 — Demand Overview KPI grid is now responsive
- Root cause: Inline `style="grid-template-columns:repeat(N,1fr)"` on `.stream-kpis` overrode all media queries, making the 6-column grid overflow at 800 and 1200 px.
- Fix: Added `.stream-kpis` CSS class with breakpoints at 1366/1200/800 px (3-col → 2-col). Inline style changed to set `--kpi-cols` CSS variable only; media queries use explicit column counts that win over the variable.

### Medium: UX-06 — Scenario status exposed to assistive technology
- Root cause: `#status` span had `aria-hidden="true"` (originally added to suppress screen-reader repetition but never removed).
- Fix: Replaced with `aria-live="polite" aria-atomic="true"` so status changes are announced once on update.

### Medium: UX-07 — Tab buttons declare accessible selected state
- Root cause: Tab buttons used only a CSS `.active` class; no `role="tab"` or `aria-selected` was set.
- Fix: `render()` now sets `role="tablist"` on `#tabs`, and each button gets `role="tab"`, `aria-selected="true/false"`, `id="tab-btn-{key}"`, and `aria-controls="main"`.

### Data — Program source and metadata (L1-01, L2-08)
- Embedded program source transplanted from validated SharePoint candidate (hash `b26dd808...`, 443 records, 0 placeholders).
- Ops-data metadata corrected to match actual engine values from the new source: ewTotal 115.7 → 113.521 M€, buTotal 177.0 → 173.533 M€, programTotal 292.8 → 287.054 M€. Previously correct for the old source, now aligned to the current Programme workbook.

### Engine
- Version bumped: `5.4.0` → `5.5.0`; tag updated to `v5.5`.

### Validation result (cycle 20260929T063821Z)
- Confidence: **43.3/100** (up from 40.5, baseline 34.9)
- UI/UX source defects: **0** (was 9 — all UX-02 through UX-10 cleared)
- New PASS: L1-01, L1-08, L1-09, L2-08, L4-06
- Remaining open automated failures (all data/policy, not code): L1-04 (15 missing ops services), L2-04 (130 ops cost differences), L2-05 (4-stage vs 5-stage policy)
- 14 cases still PENDING (require owner decisions, scored zero until resolved)

---

## v5.4.1 — ExCo Ops Reconciliation, PMI, Fork & Metadata Fixes (29 Sep 2026)
**Fixes ExCo-level operations cost accuracy, adds PMI KPI cards to Tabs 2 and 6, preserves decisions on fork, corrects stale metadata, removes Finance QA badge, and enables Tab 6 filter propagation.**

### Engine — Fork preserves decisions (L4-05)
- `transact('fork')` now preserves all overrides (include/exclude decisions), evidence reviews, settings (budget, lever positions), filters, and preset from the parent scenario
- Only identity fields reset: new ID, name appends "(fork)", revision 0, status Draft, empty event log
- Parent link (`parent`) recorded for lineage tracking

### Data — Operations metadata refreshed (L2-08)
- Updated stale `ops-data` metadata: EW 111.7 → 115.7 M€, BU 170.6 → 177.0 M€, Program 282.3 → 292.8 M€
- Metadata now matches engine-computed values from the live source workbook

### Tab 2 — PMI KPI card
- Removed the yellow multi-line PMI notice banner
- Added "PMI On Top" as a proper KPI card (matching "Initiatives funded" style with blue left border, large number, subtitle)
- Grid auto-expands to 6 columns when PMI programmes are present

### Tab 6 — PMI KPI card + table row
- Added "PMI On Top" KPI card in the Demand Overview KPI row (6-column grid)
- PMI row in "Demand Split by ExCo Accountability" table shows programme count, requested, and funded amounts
- Footer total row includes PMI counts and amounts
- Removed the multi-line PMI notice paragraph from the One Portfolio overview

### Tab 6 — Finance QA badge removed
- Removed the "Finance QA: FAIL/PASS" badge and expandable check details from the "Organisation IT Cost Allocation" section
- Programme/Operations reconciliation and stream-sum checks remain available in the engine but no longer rendered in the UI

### Tab 6 — ExCo filter propagates to Organisation IT Cost Allocation
- ExCo Leader filters now also filter the "Organisation IT Cost Allocation: Program + Operations" table
- Filtering by ExCo leader shows only the corresponding BU clusters (e.g. selecting "Bert van Meurs" shows only "Image Guided Therapy")
- Grand Total row recalculates to reflect the filtered subset

### Tab 6 — Ops Cost M€ column reconciled
- `EXCO_OPS_COST` is now derived at runtime from `ORG_OPS_MAP` sub-org totals per ExCo leader
- L1 (ExCo level) now equals the sum of L2 (sub-org level) for all BU leaders
- Function/Region leaders retain their independently sourced ops cost values
- Fixes: Bert van Meurs 58.2 → 84.9 (IGT-S 51.5 + IGT-D 33.4), Jie Xue 81.2 → 113.1, Julia Strandberg 76.0 → 101.9, Deeptha Khanna 64.9 → 75.9, Shez Partovi 37.2 → 43.8

### Engine — VERSION updated
- `VERSION` constant updated from `5.2.0` to `5.4.0`
- Excel exports now show "Rule engine version: 5.4.0"

### Export — Stage label consistency
- Export `stageLabels` aligned with engine `STAGES` constant ("and" instead of "&")
- Affects: "Legal and Compliance (Must Do)" and "Sustain Engineering and Hygiene" in Excel exports

---

## v5.4.0 — Full Data Refresh with Audit Trail (28 Sep 2026)
**Comprehensive audit engine and rich pre-apply report for demand data refreshes. Source refreshed to `AOP 2027 Consolidated Live_2809261050.xlsx`.**

### Session Recovery Fix
- `validateSession()` now compares records by ID only (not fingerprint), accommodating `ORG_RENAME` changes that legitimately alter fingerprints
- Eliminates "Session source records do not match" error on page load when recovering sessions saved before org rename

### Ops Cost by ExCo Leader (from Bill of IT)
- New `EXCO_OPS_COST` constant derived from `Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx`, columns DT-FC
- Per-ExCo costs scaled proportionally from Bill of IT raw totals (940.6 M€) to match the 469.7 M€ operations TCO total
- Tab 1 "Demand Split by ExCo Accountability" Ops Cost column now shows actual per-ExCo operations cost
- Laura Matz (IT): 18.0 M€ | Jie Xue: 81.2 M€ | Julia Strandberg: 76.0 M€ | Deeptha Khanna: 64.9 M€

### Remove 10x ROI Hold — Prioritise on Real Data
- Removed the automatic funding hold for programmes with benefit/cost ratio > 10x
- 33 programmes previously blocked by "Benefit claim above 10.0x needs review" now eligible for automatic funding
- High-ratio programmes now receive a **warning** (not a hold) — visible in popups but doesn't block funding
- Net effect: 26 high-scored programmes newly funded in P4 Value Portfolio, displacing lower-scored ones
- Stage allocations unchanged (P1 43.7 / P2 16.8 / P3 22.1 / P4 17.4 M€)
- Funded count: 162 → 159 (PMI removed from pool + merit reranking)

### PMI Exclusion — Auto-prioritised On Top Off AOP
- 4 PMI programmes (Bu-83, Bu-84, Bu-85, Bu-86 — 5.2 M€) excluded from the 100M prioritisation engine
- PMI rows auto-funded at full cost with status "Funded (PMI On Top)"
- PMI demand not charged to any BU allocation, not counted in stage targets or budget tolerance
- New PMI KPI card in Tab 2: "PMI On Top: 5.2 M€ (4 programmes · outside AOP budget)"
- PMI notice banner in Tab 2 and Tab 6: "PMI demand funded on top off the AOP budget"
- Engine returns `result.pmi` object: `{count, requested, funded}`
- `isPmi` flag on enriched rows for filtering

### ExCo and Organisation Mapping Updates
- **CoE Marketing → Julia Strandberg**: "CoE Marketing – HS (former DMEC)" moved from Deeptha Khanna to Julia Strandberg (12 programmes, 2.9 M€)
- **Greater China merge**: "Greater China (GRC)" → "Greater China" (11 programmes, rename applied in normalize())
- **International Regions merge**: "International Regions (IR) - Overall" + "International Regions (IR)" → "International Regions" (18 programmes)
- **North America merge**: "North America (NAR)" → "North America" (2 programmes)
- New `ORG_RENAME` engine constant maintains merge rules across data refreshes
- Org rename applied during `normalize()` before fingerprint generation — survives data refresh cycles

### Lever 2 Carry Over Denominator — Permanent Fix
- **Root cause**: `solve()` set `stages[1].fundableDemand` to `confirmedCarryDemand` (16.8 M€) instead of total carry demand (109.2 M€)
- **Fix**: `fundableDemand` for stage 1 now uses `demand[1]` (full carry-over demand), matching all other stages
- `confirmedCarryDemand` preserved as a separate field for reference but no longer drives the UI denominator
- Lever 2 now permanently shows "16.8 M€ funded of **109.2 M€** Demand" at default settings

### Tab 1 — Default Launch Tab + Text Update
- Tab 1 (Demand Overview) is now the default landing tab instead of Tab 2
- Deferred render ensures demand view extensions load before first paint
- "Total IT Budget" renamed to "Total IT AOP Demand" in High Level Insights

### Rename — AOP27 One Portfolio Navigator
- Tool renamed from "Philips · AOP 2027 IT Portfolio Scenario Modelling" to "AOP27 One Portfolio Navigator"
- Updated in both `<title>` and `<h1>` header

### Tab 2 — ROI Ratio column in Portfolio Inclusion Table
- New column "ROI Ratio" added after "Hard Benefits (M€)" and before "Soft Benefits (M€)"
- Shows benefit/cost ratio per programme (e.g. "11.2x") or "—" when no ratio available
- Footer shows average ROI Ratio across all displayed programmes
- Sort dropdown includes "ROI Ratio (High→Low)" and "ROI Ratio (Low→High)" options
- Column count: 9 → 10 (colspan updated for empty-state row)

### Benefits Classification Reform (Column O rule)
- **New rule**: Hard = Productivity Savings or Revenue Increase (Column O) with Column S > 0. Soft = all other Investment Areas with Column S > 0
- **Removed from Hard**: Cost Avoidance (8 programmes, 1,714.9 M€) and Process simplification/efficiency gain (50 programmes, 372.5 M€)
- **58 programmes reclassified** Hard → Soft, shifting 2,087.4 M€ in total
- Hard: 217 → 159 programmes, 14,395.4 → 12,308.0 M€
- Soft: 82 → 140 programmes, 7,718.8 → 9,806.2 M€
- No impact on merit scoring, funding allocation, or programme count — classification is display-only
- All 6 tabs, KPIs, tables, popups, filters, Excel exports reflect the new classification
- `HARD_AREAS` engine constant updated; `SOFT_AREAS` expanded with all non-Productivity/Revenue areas
- Reference docs updated: finance-cost-impact.md, data-contract.md, QA-PROCEDURE.md, Model-Logic-Specification.md

### Data Source Refresh
- **Source**: `AOP 2027 Consolidated Live_2809261050.xlsx` | SHA-256: `6c2e1fa05830`
- Row count: 472 (unchanged)
- Requested demand: 285.1 M€ → 292.8 M€ (+7.7 M€, +2.7%)
- EW/BU split: EW 177 / BU 296 (unchanged row structure)
- Decision Band coverage: 339 of 473 source rows (72%)
- LFR demand: 53.0 M€ → 56.7 M€ (+3.7 M€)
- Sustain demand: 34.0 M€ → 36.9 M€ (+2.9 M€)
- Value demand: 91.6 M€ → 84.8 M€ (−6.8 M€)
- Funded programmes: 164 → 162 (−2) at 100 M€ budget
- P1 allocation: 39.7 M€ → 43.7 M€ (+4.0 M€ — more LFR demand absorbs budget)
- P3 allocation: 20.7 M€ → 22.1 M€ (+1.4 M€)
- P4 allocation: 23.0 M€ → 17.4 M€ (−5.6 M€ — squeezed by P1/P3 growth)
- Data Extract updated: `AOP2027-Data-Extract.html` copied from Demand folder

### Engine — `auditRefresh()` function
- New pure engine function `auditRefresh(session, newData)` runs two full `solve()` passes (before/after) to compute a complete audit report without mutating session state
- `snapshotState(solveResult)` captures full KPI snapshot: row count, requested, allocation, unfunded, funded count, EW/BU split, stage breakdown, ExCo distribution, benefits classification split (Hard/Soft/Qualitative/None)
- Computes high-level deltas across all dimensions: row count, demand, allocation, EW/BU streams, stage rebalancing, ExCo-level impact, benefit classification shifts
- Line-item change detection: compares 18 material fields per programme (org, name, type, category, platform, area, priority, cost, benefit, impact, problem, scope, dependency, decisionBand, overall, etc.) plus computed engine fields (score, stage, status, funded amount, benefitClass)
- Generates prioritised action items list with severity classification: Critical (stale overrides, over-budget), Warning (new programmes, removed with overrides, stage changes), Info (benefit class changes)
- Both `auditRefresh` and `snapshotState` added to engine exports

### Tab 2 — Audit Report Panel
- New 6-section collapsible audit panel replaces the previous minimal refresh preview (4 counts only)
- **Summary KPIs** (6 cards): Row Count Δ, Total Demand Δ, Allocation Δ, EW/BU Shift, Benefit Shifts, Actions Required — colour-coded by impact severity
- **Before/After KPI Comparison**: Full comparison table with Before, After, Delta, % Change columns across 20+ metrics including all 4 stage demands and allocations
- **ExCo Leader Impact Analysis**: Per-leader table sorted by total impact magnitude — Requested/Funded/Hard Benefits/Soft Benefits/Programme Count with before/after/delta columns
- **Funding Stage Rebalancing**: Per-stage demand and allocation comparison showing how the refresh rebalances the 4-priority funding waterfall
- **Line-Item Changes**: Three sub-tables — Changed Programmes (with per-field before/after, score delta, stage change, status change, funding delta), New Programmes (with projected stage and status), Removed Programmes (with orphan override flag)
- **Action Required**: Prioritised checklist with severity badges (Critical/Warning/Info), clickable programme IDs, action type, and description
- All programme IDs in the audit panel are clickable — open the programme detail popup

### Export — Audit Report
- **Download Audit Report (Excel)**: Multi-section XLSX with Summary (KPI deltas), ExCo Impact (per-leader), Line Item Changes (changed/added/removed), Action Items — using existing `AOPWorkbook.write()` infrastructure
- **Download Audit Report (JSON)**: Full structured audit object for programmatic consumption or archival
- Audit summary persisted in session event log when refresh is applied — available in portable scenario exports

### Refresh Flow Integration
- `refresh()` engine function now accepts optional audit parameter, embeds key audit metrics (timestamp, source versions, deltas, actions, diff summary) in the session event log
- Refresh file upload now runs `auditRefresh()` automatically after validation — shows "Running full audit analysis…" progress toast
- Apply Refresh passes audit to engine for event persistence
- Cancel Refresh clears audit along with pending state

### CSS
- New `.audit-*` class family: `.audit-panel`, `.audit-kpis`, `.audit-sub`, `.audit-table`, `.audit-delta-up`/`-down`/`-zero`, `.audit-severity` with `.audit-critical`/`-warning`/`-info` badges, `.audit-toolbar`
- Responsive grid: 6-column KPI grid at desktop, 3-column at 1200px, 2-column at 800px
- Delta colours reuse existing palette: `#1a6b2a` (green up), `#721c24` (red down)

### Removed
- AOPilot chatbot removed (CSS, HTML widget, and script block) — not required for this version

---

## v5.3.0 — Portfolio Inclusion Table (27 Sep 2026)
**New editable program-level table in Tab 2 for include/exclude and budget adjustments.**

### Tab 2 — Portfolio Inclusion Table (Tranche 1)
- New collapsible section after "Demand in Scenario" with a flat, program-level table
- Columns: Checkbox (include/exclude) | ExCo Leader | Organisation | Program Name (clickable popup) | Hard Benefits (M€) | Soft Benefits (M€) | Score | Requested (M€) | Prioritised (M€, editable)
- Checkbox toggles program funding: checking includes, unchecking excludes — changes apply immediately to the scenario
- Editable Prioritised Budget column: manual amount changes commit immediately as manual overrides
- Select-all checkbox in header to bulk include/exclude all visible filtered programs
- Full filter bar matching Tabs 3/4 style: ExCo Leader, BURF organisation, IT platform, New/Carryover/Sustain, Investment area, Funding status
- Search box for program name or ID
- Sort dropdown: Score, Hard Benefits, Soft Benefits, Requested, Prioritised (ascending/descending)
- Footer row with totals for Hard Benefits, Soft Benefits, average Score, Requested, and Prioritised
- Summary line showing filtered count, total requested and prioritised amounts
- Escape key resets editable amount to original value

### Tabs 3, 4 — Column rename (Tranche 2, Item 1)
- "Trade-off Budget M€" renamed to "Total Prioritized Budget M€" in the ExCo Trade-off Cockpit table

### Tabs 3, 4 — Sticky header fix (Tranche 2, Item 4)
- Fixed: 2nd column header ("Decision Band") lost sticky positioning on scroll when tables contained include/exclude checkboxes
- Root cause: CSS `:has([data-include])` rule forced `position:static` on both header and body cells of column 2, breaking vertical sticky
- Fix: body cells remain static (no horizontal pin needed), header cells retain `position:sticky; top:0` so they stay visible on scroll
- Applied to both `.portfolio` and `.burf-table` rule sets — all columns on all tables now remain sticky

### Tabs 3, 4, 5 — Dynamic legend heading (Tranche 2, Item 5)
- Added heading above the chart legend panel (Funded/Partial/Excluded/Not funded breakdown)
- Shows "Requested (M€)" by default; switches to "Hard Benefits (M€)" when the axis toggle is flipped
- Updates on every toggle change, consistent across Tabs 3, 4, and any non-scenario tab with the chart

---

## v5.1.2 — Sorting + Lever Fix + Popup Redesign (25 Sep 2026)
**Sort dropdown on all programme tables, Lever 2 demand denominator fix, popup with data-captured indicators.**

### Sort dropdown (Tabs 2, 3, 4, 6)
- Single `<select>` dropdown in each filter row: Benefits (High→Low / Low→High), Score (High→Low / Low→High), Requested (High→Low / Low→High), Default
- Sorts programmes **within** BURF groups — group order unchanged
- Works alongside active filters — sort applies to filtered results
- Sort state persisted in session filters per tab scope

### Programme detail popup redesign
- **Data Captured** summary table: 7 parameters with green ✓ (data present, non-zero) or red — (empty/missing)
- Parameters: Priority, Benefit (Quantitative), Benefit (Qualitative), Payback Period, Problem Statement, Program Scope, Impact and Cost of Not Doing
- **Merit Score** section with full component breakdown (unchanged)
- **Funding Rationale** with type indicator: Default Logic or User Prioritised
- **Details** section: full content for each parameter, "Not supplied" in grey for missing fields
- Layout order: Name → Demand/Prioritised → Data Captured → Merit Score → Funding Rationale → Details

### Lever 2 — Carry Over demand denominator
- Allocation text now shows total carry-over demand (106.0 M€) as the denominator, not just baselined confirmed (16.8 M€)
- "16.8 M€ funded of 106.0 M€ Demand" at default (was "16.8 M€ funded of 16.8 M€ Demand")
- Denominator stays constant as RoI slider moves; only funded amount changes

---

## v5.1.1 — UI Review Build (25 Sep 2026)
**KPI card restructure, Committed Benefits redesign, popup overhaul, Tab 6 cleanup.**

### Tab 1 — Demand Overview KPI cards
- Consolidated from 2 rows (4+4) into a single row of 5 cards
- Removed 2026 Program AOP and 2026 Operations AOP separate cards
- **Total IT AOP Demand** — blue highlight (unchanged)
- **Program Demand** — white card, no highlight
- **Operations Demand** — renamed from "Operations", white card
- **Committed Benefits** — combined card: Hard number (blue, large) + "Hard" label + Soft number (black, large) + "Soft M€" label
- **IT AOP 2026** — white card, blue number, black sub-text with Program + Operations breakdown

### Tabs 3, 4 — Committed Benefits KPI
- Replaced "Committed Hard Benefits" card with combined format matching Tab 1: Hard (blue) + Soft (black) on a single card with no coloured background

### Tab 6 — One Portfolio
- Removed Download Excel button from the filter toolbar
- Committed Benefits KPI updated to the combined Hard/Soft format

### Program detail popup (all tabs)
- New layout: Name header, Demand / Prioritised Demand side by side
- **Details table**: Priority, Benefit (Quantitative), Benefit (Qualitative), Payback Period, Problem Statement, Program Scope, Impact and Cost of Not Doing
- **Merit Score** section with score in heading and full component breakdown table
- **Funding Rationale** with type indicator (Default Logic vs User Prioritised)
- Source reference at the bottom

---

## AOP2027 Modeler QA Suite — Colleague Review Checklist (25 Sep 2026)
**Interactive manual QA validation tool for team members. Renamed, linked to Data Extract, enhanced exports, Overall Feedback section.**

- **AOP2027-Human-QA-Review.html** (renamed: "AOP2027 Modeler QA Suite") — 90 checkpoints across 10 review sections:
  - **Summary** (8) — Page load, version, KPIs, demand totals, programme count
  - **Scenario Tab** (14) — Presets, levers, budget/tolerance/merit, bubble chart, weights, undo
  - **EW Stream** (12) — 180-row table, filters, overrides, trade-off cockpit, benefits classification
  - **BU Stream** (8) — 343-row table, payback field, org-specific checks, trade-off
  - **Operations Tab** (8) — KPIs, TCO hierarchy, service catalog, sorting, price formatting
  - **One Portfolio (Tab 6)** (8) — Grand total, export, finalise, portable JSON round-trip
  - **Scoring Validation** (8) — Score breakdowns, RoI/priority/band checks vs Data Extract
  - **Mapping & Data** (8) — Platform consistency, ExCo mapping, CCB exceptions, benefits classification
  - **UX & Edge Cases** (10) — Tab navigation, overflow, contrast, sorting, zero-cost, print layout
  - **Overall Feedback** (6) — Quality rating, top 3 issues, data accuracy, usability, missing features, recommendations
- **"Open Data Extract" button** in header links directly to `AOP2027-Data-Extract.html` for cross-referencing
- **Detailed JSON export** with structured sections: meta, summary counts, per-section breakdowns with every checkpoint (title, description, expected, status, notes), prioritised defect list (FAIL first, then PARTIAL), and overall feedback collected separately
- **Detailed CSV export** with 11 columns (Section, #, Checkpoint, Description, Expected, Status, Severity, Notes, Reviewer, Date, Version) + appended Defect Summary + Overall Feedback sections
- **Import** a colleague's JSON to view their review; auto-saves to localStorage
- Progress bar, tab badges (green/red/amber), Pass/Fail/Partial/Skip per checkpoint

---

## QA Validation — Automated Test Suite (25 Sep 2026)
**Self-contained QA validation tool with 82 automated tests across 6 suites. All tests pass.**

- **AOP2027-QA-Validation.html** — runs in-browser, no dependencies:
  - **Suite 1: Data Integrity** (12/12) — record counts (180 EW, 343 BU, 523 total), demand totals (111.7 + 170.6 = 282.3 M€), duplicate IDs, negative costs, CCB exceptions, ops service count, TCO parent orgs
  - **Suite 2: Scoring Engine** (18/18) — all 5 RoI bands (0/15/25/35/50), 4 qualitative tiers, 3 priority levels, 4 consequence tiers, decision band scoring, weighted formula validation
  - **Suite 3: Stage Assignment** (10/10) — CCB exceptions (EW-11/65/71), LFR must-do p1/p2, Change & Sustain, Continuous Improvement, Upgrades & Enhancements, stage count reconciliation
  - **Suite 4: Mapping Validation** (12/12) — dept→platform, platform normalisation, ORG_OPS_MAP, TCO_PLAT_MAP, SUBORG_KEYS, no unresolved IT- prefixes
  - **Suite 5: Scenario Simulations** (20/20) — default/zero/unlimited/tight budgets, 5% tolerance, merit floor 0/90, sustain 60%, value 10% AOP, 5 financial invariants, manual exclude/include/partial, all 4 preset round-trips
  - **Suite 6: Cross-Validation** (10/10) — engine outputs vs Data Extract meta totals, stage counts, top scorer, platform/org distributions, TCO grand total
- Auto-runs on page load with pass/fail summary cards
- Click any suite to expand individual test details (name, input, expected, actual, status, ms)
- Export JSON Report button for CI/audit archiving

---

## Data Extract — Complete Data Table Extract (25 Sep 2026)
**Self-contained HTML data extract with all scoring, mapping and line-level details from the dashboard.**

- **AOP2027-Data-Extract.html** — 9 interactive tabs covering all dashboard data:
  - **Summary** — KPIs, stage breakdown, platform and organisation aggregations
  - **EW Line Detail** (180 items) — Full field-level extract: ID, org, programme, type, platform, cost/benefit/RoI, priority, decision band, impact/problem/scope
  - **BU Line Detail** (343 items) — Same depth including payback field
  - **Scoring Detail** (523 items) — Raw points (max 50/25/15/10/10), weighted components (40/25/15/10/10), total score, benefit source and qualitative tier
  - **Stage Assignment** — Every programme's stage (0–3) with the input fields that determine assignment
  - **Operations Services** (167 services) — Service ID, dept, platform, TBM taxonomy, manager/leader, cost 2026/2027 with delta
  - **TCO by Organisation** (27 rows) — Parent/sub-org hierarchy with own/region/function allocation splits and YoY delta
  - **All Mappings** — Dept→Platform, Org→TCO Sub-Org, TCO BU→Platform, Sub-Org display→data key, platform normalisation map
  - **Scoring Model** — Full reference for all 5 criteria tiers, points, weights, and stage assignment rules
- All price/cost data truncated to 1 decimal place (M€)
- Sortable columns, sticky headers, print-friendly layout
- Loads from `Data file/AOP2027-OnePortfolio-Data.json` (same source as the dashboard)

---

## v5.2.2 — Benefit Separation + Tab 6 Redesign + AOP Protection + PRD v5.2 (25 Sep 2026)
**Strict Hard/Soft benefit separation across all tabs, Tab 6 KPI and button cleanup, Total AOP protection from trade-off changes, Y-axis pill toggle, PRD and Requirements docs updated to v5.2.**

### Hard/Soft Benefit Separation (all tabs)
- **Definition**: Hard = quantifiable financial outcomes (Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain). Soft = qualitative value, risk avoidance, compliance (all other areas with benefit amount).
- **Tab 1**: "Committed Benefits" KPI shows Hard (green) / Soft (amber) separately.
- **Tab 2**: Allocated AOP KPI shows "On top off" indicator when allocation exceeds Total AOP.
- **Tabs 3 & 4**: "Committed Hard Benefits" KPI with Hard/Soft breakdown in subtitle.
- **Tab 6**: "Committed Benefits" shows Hard/Soft split.
- **Chart summary**: "Committed: X Hard · Y Soft" replaces single combined number.
- **Bubble tooltip**: Shows benefit classification (Hard Benefit / Soft Benefit / Qualitative Only / No Benefit Data).
- **ExCo Demand table**: Org sub-rows and grand total now show Hard/Soft (previously empty).
- **ExCo Trade-off panel**: Already correctly split (no change needed).

### Total AOP Protection (EXCO-05)
- Trade-off Apply button NO LONGER modifies Total AOP (M€). It only includes/excludes programmes.
- "On top off AOP" KPI on Tabs 3 & 4 shows the delta between actual allocation and the user-set budget.
- Tab 2 Allocated AOP shows "On top off: +X M€" (red) or "Under budget: X M€" (green).
- Total AOP changes ONLY when the user manually edits the budget input field.

### Tab 6 Redesign
- **KPI tiles**: Total IT AOP now dark blue (was plain). Operations AOP now white (was dark). All 5 tiles in one row with `repeat(5,1fr)` grid.
- **Split of Program AOP**: "F&R X | BU Y M€" single-line format.
- **Buttons**: Removed "Export complete portfolio" and "Export portable scenario". Kept "Finalise scenario" and "New working version" only.

### Default Scenario and Reset
- **Optimal Segmentation** is default on page load (blue-highlighted button). Already was working correctly.
- **New Working Version** now performs a full reset: Optimal preset, empty overrides, empty reviews, empty trade-offs, cleared decision log.

### ExCo Trade-off Position
- Moved below the filter bar (was above the main panel). Default closed (opens when trade-off values entered).
- Receives filtered rows from active tab filters (ExCo, Org, Platform, Funding Status, Type).

### Filter Auto-Close
- All filter dropdowns across all tabs auto-close after a selection is made.

### Y-axis Toggle
- Replaced dropdown with pill-style toggle switch (blue, matching Prioritised/Not Funded toggle design).

### Demand in Scenario Table
- Rebuilt with collapsible BURF organisation groups matching Tabs 3/4 design.
- View-only. 9 matching columns. Cascading ExCo→Org→Platform filters.

### Tab 1 KPI Layout
- Row 1: Total IT AOP Demand (dark) | Program Demand | Operations | IT AOP 2026 (dark, "161.0 M€ Program AOP + 470.7 M€ Operations AOP").
- Row 2: Committed Benefits (Hard/Soft) | 2026 Program AOP | 2026 Operations AOP.

### Tab 2 KPI Styling
- Allocated AOP: dark blue. All others: white background.
- "Demand left unfunded": no longer dark.

---

## v5.2.1 — Trade-off Cockpit Fixes + Bubble Chart Toggles + UI Refinements (25 Sep 2026)
**13 UI refinements per CIO feedback: trade-off reset/negative support, benefit columns, bubble chart Y-axis toggle, legend redesign, summary line, toggle switch, lever layout fixes.**

### Trade-off Cockpit (Changes 1–4)
- **Apply trade-off fixed**: batched `transact()` calls instead of stacking `commit()` — no more blank page.
- **Reset button**: clears all entered trade-off values in one click.
- **Negative trade-offs**: enter a target budget BELOW current funded amount to model reductions. Lowest-merit P4 programmes are excluded. Delta shown in red.
- **Benefits in impact column**: "Progs / Benefits impact" now shows programme count + Hard/Soft benefit M€ added or removed.

### Demand Scenario Table (Changes 10–11)
- **Cascading filters**: ExCo Leader → Organisation → Platform (ExCo narrows org options, org narrows platform).
- **Toggle switch**: replaced two-button toggle with pill-style slide switch for Prioritised/Not Funded views. Teal/blue active state.
- **Benefits total**: added to Total row.

### Bubble Chart (Changes 5–7)
- **Y-axis toggle**: Tabs 3 & 4 can switch between "Requested (M€)" and "Hard Benefits (M€)". Tab 6 between "Prioritised (M€)" and "Hard Benefits (M€)". Session-persistent.
- **Legend redesign**: moved from below chart to right-side panel with per-category aggregated M€ values in a compact table.
- **Tab 2**: no toggle (scenario tab retains median/merit reference values).

### Chart Summary & Median (Changes 8–9)
- **Summary line**: Tabs 3, 4, 6 show "X / Y Programmes funded for a total N M€ / M M€ Prioritised AOP 2027 demand with a committed Impact of Z M€". Refreshes on filter.
- **Median/merit text removed** from Tabs 3, 4, 6 (kept on Tab 2 only).

### Lever Layout (Changes 12–13)
- **Lever 2**: input box moved above allocation text (was below). Centered alignment.
- **Allocation text**: centered with `text-align:center` on all levers. Single-line `white-space:nowrap` confirmed.

---

## v5.2.0 — ExCo Accountability Hierarchy + Benefits Classification + Trade-off Cockpit (25 Sep 2026)
**Transforms the modeler into an ExCo decision-making cockpit per CIO feedback. Every view can now be organised by accountable ExCo leader, benefits are classified as Hard/Soft, and an interactive trade-off budget enables per-leader funding negotiations.**

### ExCo Accountability Hierarchy (EXCO-01)
- **16 ExCo members mapped** to all 35 organisation values: 10 BU leaders (Deeptha Khanna PH, Shez Partovi EI/I&D, Julia Strandberg CC, Jie Xue PD, Bert van Meurs IGT/STO, Wim Appelo COO/ISC, Özlem Fidanci IR, Jeff DiLullo NAM, Ling Liu GCR, Charlotte Hanneman Finance/Security) + 6 enterprise function leaders (Laura Matz IT, Heidy Schein People, Steve C de Baca PS&Q, Carla Silva Peron Medical, Filip Koek Audit, Marnix van Ginneken Legal/Comms/IP&S).
- `EXCO_HIERARCHY` dictionary and `ORG_TO_EXCO` reverse lookup added to engine. Fuzzy match via `excoOf()` for whitespace/encoding differences.
- Every enriched programme row now carries `exco` field. Regional leaders (IR/NAM/GCR) club BU+EW demand together.
- Health & Safety mapped to Özlem Fidanci (International Regions).

### Hard/Soft Benefit Classification (BEN-01)
- New `classifyBenefit()` function in engine classifies each programme:
  - **Hard**: numeric benefit > 0 AND area in {Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain}.
  - **Soft**: numeric benefit > 0 AND area in {Compliance/Keeping the lights on, Security} or other areas.
  - **Qualitative**: no numeric benefit but has impact/problem text.
  - **None**: no benefit data.
- Each row enriched with `benefitClass`, `benefitClassLabel`, `benefitFlag`.
- **Data quality flags**: K EUR suspect (impact text = benefit × 1000), outlier (> 100 M€), high ratio (> 10x), no business case.

### Global ExCo Filter (EXCO-02)
- ExCo Leader added as first filter dropdown across all programme tabs (Tabs 2, 3, 4, and Overview).
- Filter is cascading — selecting an ExCo leader narrows subsequent org/platform/area options.
- Added to both main filters and prioritized programme filters.

### Tab 1: Demand Split by ExCo (EXCO-03)
- Demand Split table reorganised from flat organisation list to **collapsible ExCo groups**.
- Each ExCo row shows: programme count, requested M€, prioritised M€, gap M€, % funded, hard/soft benefits, operations cost.
- Click to expand constituent organisations. Colour-coded funding percentage.
- Replaces previous "Demand Split by Organisation" section.

### ExCo Trade-off Cockpit — Tabs 3 & 4 (EXCO-04)
- New **ExCo Trade-off Cockpit** panel above the bubble chart on Tabs 3 (Functions & Regions) and 4 (BU Led).
- Shows per-ExCo leader: requested, funded, gap, % funded, hard benefits, soft benefits.
- **Trade-off Budget input**: enter a target budget per ExCo leader. Panel calculates delta, shows how many P4 programmes would be unlocked by merit score.
- **Apply trade-off** button: increases Total AOP by the sum of all deltas and includes the merit-ranked programmes. Creates tracked decisions in the decision log.
- Impact summary shows new AOP amount and total programmes unlocked.

### Engine
- Version bumped from 5.1.0 to 5.2.0.
- `enrich()` adds `exco`, `benefitClass`, `benefitClassLabel`, `benefitFlag` to every row.
- `filter()` supports `exco` dimension.
- `EXCO_HIERARCHY`, `ORG_TO_EXCO`, `excoOf` exported from engine API.

---

## v5.1.1 — Lever 3/4 Scope + UI Alignment + Demand in Scenario Table (25 Sep 2026)
**Verified Lever 3/4 non-overlap scope, redesigned lever box alignment (4-in-row), added merged Demand in Scenario table with Prioritised/Not Funded toggle, ExCo-ready scenario text, updated gate definitions.**

### Lever UI refinements
- All 4 levers in a single row (4-column grid)
- Input boxes centre-aligned for all sliders, including new RoI numeric input for Lever 2
- Allocation text: "**39.7 M€** funded of 53.0 M€ Demand" — amount in Philips blue bold, single line
- Lever 2 triangle fills from right as slider moves right; extra baseline/additional text removed

### Scope verification
- **Lever 3 (Sustain):** 84 records (34.4 M€) — Change & Sustain + CI/Upgrades. Zero overlap with LFR or Carry Over.
- **Lever 4 (Value):** 178 records (91.8 M€) — all demand outside Levers 1–3. Reductions release to Open to prioritisation; increases draw from Value.
- All 472 records uniquely assigned to exactly one stage.

### Demand in Scenario table
- New merged table replaces separate Demand Prioritized / Demand Not Funded sections
- Toggle: Prioritised (default) / Not Funded views
- Filters: Organisation, Platform, Clear Filters
- Total row with filtered/unfiltered counts
- Positioned before Funding Prioritization Gate

### Scenario selector text
- Static per-preset ExCo-ready definitions. Optimal shows: "100 M€ Scenario Allocation with Verified Legal & Compliance (39.7M), baselined Carry Over (16.8M), prioritised Sustain (20.7M), leaving Value 23.0M — F&R 53.0% / BU Led 47.1% split."
- Other presets show one-line strategic descriptions. Custom shows generic guidance.

### Gate definitions updated
- Gate 3 (Sustain): describes CCB + Hygiene scope, no-overlap guarantee
- Gate 4 (Value): describes residual funding mechanics

---

## v5.1.0 — Lever Logic Reform + Functions & Regions + Tab 1 Restructure (24 Sep 2026)
**Restructured lever logic to include all LFR and carry-over demand, renamed Enterprise Wide to Functions and Regions, updated Tab 1 KPIs, redesigned sliders in Philips style.**

### Lever logic changes
- **Lever 1 (Legal & Compliance):** LFR = any record with lfrName OR lfrYear populated (not "0"/blank). LFR overrides carry-over/sustain stage. Total LFR demand: 75 records (53 M€). Bucket = total LFR demand. Optimal preset auto-computes verified demand share (~75%) as default slider position. Verified = records with BOTH compliance name AND year. Sort: verified first (by score), then unverified (by score). Philips-style tick-mark slider (5% steps, hollow circle thumb, labels at 0/25/50/75/100%).
- **Lever 2 (Carry Over demand):** Renamed from "High-Value Carry-Overs". All non-LFR carry-overs enter stage 1 (135 records, 105.9 M€). Baseline carry-overs (23 records, 16.8 M€ fund-capped) always funded regardless of slider. RoI threshold slider (10x+ → 0x) controls additional carry-overs only. At 10x+ (Optimal default) only baseline funded. Dragging right (lowering threshold) adds programs by RoI desc then score. No-RoI records rank last. Triangle/wedge SVG visual shows reducing RoI filtering.
- **Lever 3 (Sustain):** No overlap with expanded stages 0 and 1. Default: 60% of bucket.
- **Lever 4 (Value):** Contains only demand outside levers 1–3. Default: 100% of bucket.
- **Presets updated:** Optimal = verified LFR + baseline carry-overs only + 60% sustain + 100% value. All levers default to % of bucket demand basis.

### Tab 1 (Demand Overview)
- Renamed "Total IT AOP" to "Total IT AOP Demand" with dark blue highlight.
- Replaced single 2026 Run-Rate tile with "IT AOP 2026" (631.7 M) showing Programs AOP (161 M) and Operations AOP (470.7 M) as separate sub-tiles.

### Rename: Enterprise Wide → Functions and Regions
- All user-facing labels changed: tab name, workflow step, KPI tiles, Excel export headers, Finance QA checks, Tab 6 allocation table.
- Internal code identifiers (ew, ewAlloc, stream values) unchanged.

### UI improvements
- **Merit Score Framework:** All 5 components now display in a single row. Removed redundant "Five components sum to 100" paragraph.
- **Scenario selector text:** Replaced "100 M€ starting envelope is illustrative" with actionable ExCo summary.
- **Philips-style sliders:** Dark blue track, white thumb with border, tick labels at min/mid/max. Step sizes: 5% for percentage, 0.5M for amount.
- **Funding gate text:** Updated gates 1 and 2 to describe expanded demand pools and selection criteria.

### Engine
- Version bumped from 4.5.0 to 5.1.0.
- `stage()` expanded: `must-do` → stage 0, `carry over` → stage 1.
- `enrich()` adds `lfrVerified`, `carryConfirmed`, `carryFundCap` for non-baselined carry-overs.
- `solve()` uses `verifiedDemand0` as bucket basis for LFR lever, `confirmedCarryDemand` for carry-over display.
- `compare()` sorts verified/confirmed before unverified/unconfirmed within each stage.
- `validateSettings()` carry max extended from 5 to 10.

---

## v5.0.6 — PRD v5.0 and Requirements v5.0 Published (24 Sep 2026)
**Updated all governing documents to reflect the v5.0 rebuild and all changes from this session.**

### Documents updated (all in `PRD/`)
| Document | Version | Key content |
|---|---|---|
| `AOP2027-Modeler-PRD-v5.0.docx` | 5.0 | 9 sections, 8 tables. Full v5.0 scope: finance model, live source, Excel redesign, QA results. |
| `AOP2027-Modeler-Detailed-Requirements-v5.0.docx` | 5.0 | 16 requirements (FIN 01–04, DATA 08–11, EXCEL 01–02, UI 01) with exact pass criteria and implementation rules. |
| `CHANGELOG.md` | Live | Entries v4.8.0 → v5.0.6 documenting every change in this session. |

### New requirements documented (v5.0 additions to v4.0 baseline)
- **FIN 01**: Enterprise-wide charging exclusion from demand (40 M€ → ewChargingKey only)
- **FIN 02**: Tab 6 BU cluster allocation table (7 clusters, 4 columns)
- **FIN 03**: EW charging key algorithm (fractions → proportional EW distribution)
- **FIN 04**: Finance QA harness (7-check inline reconciliation)
- **DATA 08**: Live workbook as authoritative source (AOP 2027 Consolidated Live.xlsx)
- **DATA 09**: Header row auto-detection (scan for Item No. in first 10 rows)
- **DATA 10**: Allocation % column detection (r.allocations on EW and BU sheets)
- **DATA 11**: Zero-ID row filtering (numeric 0 in Item No. → skip/temporary ID)
- **EXCEL 01**: 4-tab Excel structure (Scenario Overview, Programmes Prioritised, Operations Overview, Scoring Evidence)
- **EXCEL 02**: Programmes Prioritised 35-column spec
- **UI 01**: DRAFT badge specification

---

## v5.0.5 — DRAFT Badge + 4-Tab Excel Redesign (24 Sep 2026)
**Header DRAFT badge, hidden status text, and Excel restructured to 4 executive-ready sheets.**

### Header
- Added red "DRAFT / Work In Progress" badge (top-right) — CSS class `.draft-badge`
- Scenario status text (`Optimal Segmentation · Draft · r18 · ...`) moved to visually-hidden DOM element (`#status`, `.status-meta` — 1px clip, not removed)
- Dashboard logic that reads/writes `#status` continues to work unchanged

### Excel — 4 Sheets (was 7 unstructured sheets)
| Sheet | Rows | Cols | Contents |
|---|---|---|---|
| 1. Scenario Overview | ~47 | 5 | Executive KPIs · Stage P1-P4 breakdown · EW/BU split · BU Cost Allocation table · Preset comparison |
| 2. Programmes Prioritised | 149 | 35 | Funded rows only · All v4.5 fields incl. Benefit Source, Payback, LFR, Baselined |
| 3. Operations Overview | 209 | 6 | Ops KPIs · TCO by BU cluster (3-level) · Full 167-service catalog with AOP2027/2026/delta |
| 4. Scoring Evidence | 473 | 31 | All programmes · 5-component scores · qualitative tier · payback details · raw points |

Operations data parsed directly from `#ops-data` DOM element — no global dependency.

---

## v5.0.4 — Excel Exports: Full v4.5 Content Fix (24 Sep 2026)
**All 7 Excel sheets rebuilt for engine v4.5: correct column counts, 5-component scoring, v4.5-specific fields, and a richer Scenario Summary.**

### workbook.js — `sheets()` function rewritten
All 7 sheets updated:

| Sheet | Before | After | Key changes |
|---|---|---|---|
| Scenario Summary | ~25 rows | 80 rows | Proper stage breakdown (4 not 5), LFR/carry-over stats, EW charging key exclusion note, weights |
| Portfolio | 23 cols | **31 cols** | +Benefit Source, +LFR Tier, +Has LFR Evidence, +LFR Year, +LFR Name, +Payback Years, +Baselined M€, +Carry Fund Cap M€ |
| Score Evidence | 20 cols (4-component, wrong) | **27 cols** | Fixed: 5 components (Payback now in cols), +Benefit Source, +Qualitative Benefit Tier, +Payback Years, +Payback Score Points |
| Settings | flat key-value | Grouped with notes | Per-lever basis/value, labelled weights with %, merit floor |
| Decisions | raw JSON blobs | Structured 12-col | Human-readable old/new values, programme name + org |
| Change Log | minimal | Clean 10-col | `Included/Excluded/Amount` plain text actions |
| Source Reference | unchanged | unchanged | Still traces every source cell |

### Exports tested — 4/4 PASS, zero errors
- Export inclusions (funded 148): 9.5 MB Excel
- Export full portfolio (472 rows): 33.0 MB Excel
- Export EW filtered (177 rows): 6.5 MB Excel
- Export BU filtered (296 rows): 26.5 MB Excel

---

## v5.0.3 — Excel Export Fix + EW Charging Exclusion (24 Sep 2026)
**Fixed "Cannot read properties of undefined (reading 'target')" crash on Excel download. Fixed 40M Enterprise-wide charging row polluting all demand totals.**

### workbook.js — Excel export fixed
- `sheets()` referenced `result.stages[4]` (old 5-stage engine index) — v4.5 engine has stages[0-3] only → `undefined.target` crash
- Also removed orphaned `result.selection` and `result.valueAvailable` references that don't exist in v4.5
- All 7 export sheets now build without error: Scenario Summary, Portfolio, Score Evidence, Settings, Decisions, Change Log, Source Reference

### engine.js — Enterprise-wide charging permanently excluded
- "Enterprise-wide charging" row (40 M€, Item `BU`) filtered out of `records` in `normalize()`
- Stored as `ewChargingKey` on data object — accessible only for Tab 6 EW split calculation
- Effect: total demand 325.1 → **285.1 M€**, P4 demand 205.0 → **165.0 M€**, rows 473 → **472**
- Engine guarantee: the row can never appear in any prioritisation, table, export, or total

### Scenario QA: 12/12 PASS (automated)
- Financial identities, stage sums, LFR exceptions, 5-component scoring, benefitSource, paybackYears, no duplicate IDs

---

## v5.0.2 — Tab 6 Allocation Table: BU Clusters + EW Charging Key (24 Sep 2026)
**Rebuilt the Organisation IT Cost Allocation table to use BU clusters from TCO, distribute EW demand via the Enterprise-wide charging key, and fully allocate all programme + operations costs with zero gaps.**

### Tab 6 — Organisation IT Cost Allocation
- **BUs only**: Table shows 7 TCO BU clusters (Precision Diagnosis, Connected Care, Image Guided Therapy, Personal Health, EI, Innovation & Design, Int. Property & Standards). No Functions, Regions, or CoEs as separate rows.
- **BU Led column**: Direct BU-stream funded programmes + Type II cross-BU allocations distributed via source allocation % keys. Programmes from ISC, STO, Finance, Regions, etc. that have Type II keys are distributed to the BU clusters they serve.
- **Enterprise Wide column** (NEW): Total EW-stream funded demand (52.3 M€) distributed to BU clusters using the "Enterprise-wide charging" row's allocation keys from the live consolidated workbook. Keys are normalised proportionally so the full EW amount is accounted for.
- **Operations column**: Bill of IT TCO per BU cluster (from ops-data.json).
- **Grand Total reconciliation**: BU Led 47.7 + Enterprise Wide 52.3 = Programme AOP 100.0 + Operations 469.7 = Grand Total 569.7 M€ = Total IT AOP ✓
- Functions/Regions residual (2.7 M€ from programmes without allocation keys) shown as a separate transparency line.

### Enterprise-wide Charging Key Logic
- Identified the "Enterprise-wide charging" programme (Item `BU`, 40 M€, Type III) in the BU sheet
- Extracted sub-org allocation fractions from the source % columns (e.g., HPM = 0.0105%, IGT-S = 0.0106%, etc.)
- Mapped sub-org keys (HPM, MR, G and B, etc.) to BU clusters via `SUBORG_BU` dictionary
- Used these proportions to distribute the total EW-stream prioritised demand across BU clusters
- Amounts recalculate automatically when prioritisation scenario changes

---

## v5.0.0 — Full Rebuild from Live Source, PRD v4.0 Compliant (24 Sep 2026)
**Complete v5.0 rebuild from the AOP 2027 Consolidated Live.xlsx SharePoint source. Engine v4.5.0 (4-priority, 5-component scoring, hybrid benefit, payback). All 6 tabs operational. PRD v4.0 validated.**

### Data Source
- Source: `AOP 2027 Consolidated Live.xlsx` (SHA-256: be5d9fad...)
- 473 demand rows (EW 177, BU 296). 325.1 M€ total demand. QA: PASS.
- Data pipeline: `prepare_data.py` → `build_v5.py` → standalone HTML (4.1 MB with embedded data)

### Engine (v4.5.0, extracted from OnePortfolio v4.7)
- **4-priority funding**: Legal & Compliance, High-Value Carry-Overs, Sustain & Hygiene, Value Based Portfolio
- **5-component scoring**: Benefit (40%), Priority (25%), Consequence (15%), Band (10%), Payback (10%)
- **Hybrid benefit**: Quantitative ratio → Revenue/Productivity block → Qualitative fallback
- **Carry-over cap**: P2 funded at min(Requested, Baselined)
- **Header auto-detection**: Scans first 10 rows for 'Item No.' — handles live workbook (headers at row 4)
- **Allocation % detection**: On all sheets (BU and EW), matching `*%` headers for Type II cross-BU allocations
- **Zero-ID filtering**: Rows with numeric 0 in Item No. treated as blank (avoids duplicates from empty cells)
- **Column aliases extended**: `'waste band'` for Decision Band, `'qualitative benefit'` for benefit details

### 6-Tab Dashboard
- Tab 1: Demand Overview — KPIs + Demand Split table with filters/sort
- Tab 2: Program AOP Scenarios — 4 levers, 4 presets, 5-weight merit framework, prioritized/unfunded tables
- Tab 3: Enterprise Wide — Editable EW programmes with bubble chart
- Tab 4: BU Led — Editable BU programmes
- Tab 5: Operations — TCO 3-level hierarchy, 167-service catalog, delta colours
- Tab 6: One Portfolio — Total IT AOP, allocation table (BU Led / EW Charges split), Finance QA

### Finance QA Harness (Tab 6)
- Inline reconciliation: Programme 100.0 + Ops 469.7 = Grand Total 569.7 M€
- EW + BU stream totals = Programme allocation (exact)
- Stage sum = Portfolio allocation (exact)
- Finance QA status: WARN (allocation % pending in live workbook — expected)

### Browser QA Results (24 Sep 2026)
- All 6 tabs render without console errors
- 473 rows processed, 148 funded, 100.0 M€ allocated (Optimal Segmentation)
- 4 stages: Legal 37.5 + Carry 16.8 + Sustain 20.0 + Value 25.7 = 100.0 M€
- EW 52.3 + BU 47.7 = 100.0 M€ (stream reconciliation PASS)
- 5 weights [40,25,15,10,10], benefitSource present on all rows, paybackYears extracted

---

## v5.0.1 — Build & Prepare Scripts: Live Workbook + 6-Tab Support (24 Sep 2026)
**Updated `prepare_data.py` and `build_v5.py` for the consolidated live workbook and 6-tab dashboard structure.**

### prepare_data.py
- **DEFAULT_SOURCE** now points to `AOP 2027 Consolidated Live.xlsx`
- **REQUIRED_SHEETS** updated to `['EW', 'BU']` (uppercase, matching live workbook)
- **Auto-detect header row**: new `find_header_row()` scans first 10 rows for 'Item No.' marker instead of assuming row 0 — supports live workbook where headers appear at row 4
- **Dynamic data-start row**: data rows begin after the header (and sub-header if present), not at hardcoded row 3
- **Payback Period** added to `PARTIAL_MATCH_COLUMNS`
- **Drift tolerances** relaxed to 50% for both row count and demand (was 20%/30%), accommodating the live workbook's different content

### build_v5.py
- **HTML template** now includes three JSON data blocks: `source-data`, `ops-data`, `svc-data`
- **ops-data.json** and **svc-data.json** read from `Data file/` at build time (graceful fallback to `{}` if absent)
- **Tag line** updated to `One Portfolio · Evidence-led · v5.0`

---

## v4.8.1 — Engine Module Extraction with Live Workbook Compatibility (24 Sep 2026)
**Extracted complete v4.5.0 engine from OnePortfolio v4.7.html into `Implementation/engine.js` with three targeted modifications for live consolidated workbook compatibility.**

### engine.js — Header Auto-Detection
- `normalize()` no longer assumes headers at row 0; scans first 10 rows for one containing 'Item No.'
- Sub-header row = header row - 1; data rows start at header row + 1
- Supports live consolidated workbook where headers appear at row index 4

### engine.js — Allocation % Column Detection on All Sheets
- Removed the `if(key(sheetName)==='ew')` guard so allocation % columns are detected on both EW and BU sheets
- Header-based matching: columns ending with ` %` or `%` (excluding `capitalization`) are treated as allocation columns
- Retains original sub-header-based detection as fallback (`%`, `pct`, `percent`, `alloc%`)
- BU name extracted by stripping trailing ` %` from header text

### Preserved v4.5.0 Features
- 4-priority STAGES, 5-component scoring, hybrid benefit scoring, leverTarget, switchBasis
- Carry-over cap logic, P2 baselined cap, materialFingerprint, full session management

---

## v4.8.0 — Finance Model Reform: EW Charge to BU + Deep QA Harness (24 Sep 2026)
**Restructured Tab 6 (Organisation IT Cost Allocation) to separate BU-led programme funding from Enterprise-Wide charges, with inline Finance QA reconciliation. Engine updated to read BU allocation % columns from the live consolidated workbook.**

### Tab 6 — Organisation IT Cost Allocation: Program + Operations
- **Removed**: Programs Count column (caused double-counting for Type 2 programmes spanning multiple BUs)
- **Added**: BU Led (M€) column — funded BU-stream programmes where this organisation is the requesting BU
- **Added**: EW Charges to BUs (M€) column — shows when allocation % columns present in live workbook (Type 2 logic: `Allocated = Prioritised × Allocation %`; percentages preserved so amounts recalculate automatically on scenario changes)
- **When allocation % absent** (older 15926 workbook): EW funded total shown as a separate summary line with a notice; per-BU EW column hidden to avoid fabricated data
- Grand Total = BU Led + EW Charges + Operations = Total IT AOP (verified to match Operations AOP + Prioritised Programme AOP)
- **Inline reconciliation warning**: amber indicator shown if grand total deviates from expected Operations + Programme total

### Finance QA Harness (Deep — ExCo-ready validation)
- New `AOPDataQA.validateFinance(result, opsTotal)` function: 5 critical + 2 warning checks
  - EW + BU stream totals exactly equal programme allocation (to 3 decimal places)
  - EW allocation % present on funded EW programmes (warns when absent)
  - Allocation % sums to 100% per programme (±1% tolerance)
  - EW charges distributed = total EW allocation (validates no rounding loss)
  - Grand Total = Programme AOP + Operations AOP
  - No negative funded amounts
  - Funded count consistency
- New `AOPDataQA.renderFinanceQA(qa)` renders inline in Tab 6 with expand/collapse detail
- Module added to both OnePortfolio v4.7 and Implementation/qa.js for v5.0

### Engine — Allocation % Column Detection
- `engine.js` and embedded v4.7 engine updated to detect BU allocation percentage columns in the EW sheet
- Pattern: column header = BU name, sub-header normalises to "%" / "pct" / "percent" / "alloc%"
- Read into `r.allocations: {buName: pct}` per EW record; available for finance calculations at Tab 6 render time
- Non-breaking: old workbooks without these columns continue to work unchanged

### Implementation/qa.js
- Added `validateFinance` and `renderFinanceQA` exports; existing exports unchanged

---

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


## v5.8_1 A-Suite maintenance — 2 October 2026

This maintenance applies only to v5.8_1; v5.9.1 remains unchanged and remains the latest release.

- Fixed One Portfolio render failure caused by using `result` outside its closure; now uses `aop.result`.
- Corrected final receiving-finance table: all receiving rows, explicit Unallocated and PMI rows, separate PMI column, correct BU/F&R classification and exact row/column reconciliation.
- Prevented finalisation with any unresolved refreshed override, including PMI overrides.
- No source workbook, embedded source snapshot, scoring rule, default funding, or current exclusion-refill policy changed.
- A-Suite candidate passes 24 scenarios for each of 32 program organizations, 23 portfolio-wide scenarios, 20 finance scenarios for each of 41 operations entities plus 2 exception buckets, full source-cell fidelity and native export roundtrip. Full executive certification remains conditional on source-owner and end-user file/import/download acceptance.
- The reported Tab 2 `fmt is not defined` was not reproduced in the frozen published v5.8_1 baseline or corrected candidate; six-tab localhost browser checks passed.
