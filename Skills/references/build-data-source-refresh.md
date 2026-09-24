# Build skill: New data source refresh | v4.6

## Purpose

This skill governs the end-to-end workflow for incorporating a new demand data source into the modeler while preserving all existing logic, workflows and functionality with zero regression.

## Preconditions

Before starting:
1. Read [decision-policy.md](decision-policy.md) — funding rules must not change
2. Read [data-contract.md](data-contract.md) — source schema and normalization rules
3. Read the project memory index at `Memory/AOP2027-Demand-Context.md` — current baseline counts
4. Confirm the new source file location and that it follows the expected EW/Bu sheet structure

## Phase 1: Source validation and snapshot

### 1.1 Validate the new workbook

```
Input:  New .xlsx file (e.g., updated 15926_IT AOP2027 Demand.xlsx)
Output: Validated normalisation result or blocking errors
```

- Run the engine's `normalize(workbook)` against the new workbook
- Verify: EW and Bu sheets present, headers discoverable, no duplicate stable IDs, no invalid numeric amounts
- Record: row count, requested total (M€), EW/BU split, missing amounts, benefits coverage, Decision Band coverage, Overall AOP decision coverage
- Compare against the current baseline (521 rows, 280.2 M€, etc.) and flag material differences
- **Blocking errors**: Missing required sheets, ambiguous headers, duplicate IDs, invalid amounts → STOP and report

### 1.2 Create the complete snapshot

- Preserve exact original workbook bytes (originalBase64)
- Record all sheets, rows, formulas and cached values
- Compute SHA-256 of the new source
- Save to `AOP 2027 Modeler/Data file/AOP2027-Complete-Workbook-Snapshot.json`

### 1.3 Produce the normalised demand file

- Save `AOP 2027 Modeler/Data file/AOP2027-Normalized-Demand.json` with all records
- Save `AOP 2027 Modeler/Data file/AOP2027-Normalized-Demand.csv` for audit

## Phase 2: Impact assessment (zero-logic-change verification)

### 2.1 Engine parity check

Run the engine with the new data using current default settings and verify:
- Classification: every row assigned to exactly one priority (P1/P2/P3/P4)
- Funding order: P1 before P2 before P3 before P4
- Reconciliation: requested = final + unfunded (within 0.01 M€)
- Stream split: EW final + BU final = portfolio final (within 0.01 M€)
- Priority totals: sum of stage allocations = portfolio allocation (within 0.01 M€)
- Tolerance: total ≤ budget × (1 + tolerance%)

### 2.2 Regression detection

Compare new engine output against the previous baseline:
- List programmes whose classification changed (and why)
- List programmes whose funding status changed (funded→unfunded or reverse)
- List programmes with changed merit scores (and which component changed)
- Identify new holds that didn't exist before
- **All changes must be explainable by data differences, not logic differences**

### 2.3 Decision migration preview

Using `refreshPreview(session, newData)`:
- Count unchanged, changed, added, removed records
- For changed records: identify which evidence fields changed
- For overrides on changed records: these will be held as "needs-review"
- Report the migration impact before any changes are applied

## Phase 3: Build the updated modeler

### 3.1 Embed new data

- Update the `<script type="application/json" id="source-data">` block in the HTML with the new complete workbook snapshot
- If operations data changed, update `<script type="application/json" id="ops-data">` and `<script type="application/json" id="svc-data">`
- **Do not modify any JavaScript logic, CSS, or HTML structure**

### 3.2 Verify build integrity

- Open the new HTML in a browser
- Confirm all 6 tabs render without console errors
- Confirm KPIs display the new baseline values
- Confirm the Demand Overview cards show updated counts
- Spot-check 3–5 individual programme rows for correct values

## Phase 4: Comprehensive QA

### 4.1 Run the automated QA suite

Execute `QA-PROCEDURE.md` Option A or B:
```bash
cd "AOP 2027 Modeler"
python run-qa.py
```

Or inject `qa-harness.js` into the browser console.

**All 24+ automated checks must PASS.** Update expected counts in the QA harness if the new source has a different row count (e.g., 521 → 530).

### 4.2 Extended checks for data refresh

Beyond the standard 24 checks, verify:
| Check | Method | Pass criteria |
|-------|--------|---------------|
| New row count matches source | Compare normalised JSON vs workbook | Exact match |
| No orphaned overrides | Check all override IDs exist in new data | Zero orphans |
| SHA-256 updated | Check source hash in session | Matches new file |
| Operations data unchanged (if applicable) | Compare ops totals | 469.7 M€ or updated value |
| All 4 presets solve without error | Cycle through presets | Zero errors |
| Bubble chart renders all scored programmes | Visual or snapshot check | No missing circles |
| Filter options reflect new data | Check filter dropdowns | Options match new source organisations/platforms |

### 4.3 Defect classification

| Severity | Definition | Action |
|----------|-----------|--------|
| **Blocker** | QA check fails, financial reconciliation broken, console error, data loss | Must fix before proceeding |
| **Critical** | Classification error, wrong funding status, incorrect merit score | Must fix before proceeding |
| **Major** | UI display error, missing filter option, export discrepancy | Fix recommended before release |
| **Minor** | Cosmetic issue, rounding display, non-functional | Document and defer |

### 4.4 QA approval gate

QA is approved when:
- All 24+ automated checks PASS
- All extended data-refresh checks PASS
- Zero blocker or critical defects remain
- Major defects are documented with planned resolution

## Phase 5: Update CHANGELOG.md

Only after QA approval, update `AOP 2027 Modeler/CHANGELOG.md`:

```markdown
## vX.Y.Z — Data Source Refresh (DD Mon YYYY)
**Source**: [new filename] | SHA-256: [first 12 chars]

### Source changes
- Row count: [old] → [new]
- Requested demand: [old] M€ → [new] M€
- EW/BU split: [old EW] / [old BU] → [new EW] / [new BU]
- Decision Band coverage: [old] → [new]
- [List material changes in programme classification or evidence]

### Migration impact
- Unchanged: [N] records (overrides preserved)
- Changed: [N] records (overrides held for review)
- Added: [N] records
- Removed: [N] records

### QA result
- Automated: [N]/[N] PASS
- Extended: [N]/[N] PASS
- Defects: [N] minor documented, [N] resolved
```

## Phase 6: Update project memory

Update `Memory/AOP2027-Demand-Context.md` with:
- New SHA-256 hash
- New row count and reconciled demand figures
- New EW/BU split
- New evidence coverage counts
- Date of refresh

## Workflow summary

```
New .xlsx → Validate → Snapshot → Engine parity → Regression check
  → Migration preview → Embed data → QA (automated + extended)
    → [FAIL: fix and re-run from QA]
    → [PASS: QA approved]
      → Update CHANGELOG → Update project memory → DONE
```

**Critical constraint**: No JavaScript, CSS, HTML logic or engine code is modified during a data source refresh. If the new data exposes a logic bug, that is a separate enhancement tracked under the enhancement build skill.
