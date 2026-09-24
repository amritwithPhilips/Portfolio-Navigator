# Build skill: New enhancements and changes | v4.6

## Purpose

This skill governs the end-to-end workflow for implementing new features, UI changes, logic enhancements or bug fixes in the modeler while preserving all existing logic, workflows and functionality with zero unintended regression.

## Preconditions

Before starting:
1. Read [decision-policy.md](decision-policy.md) — understand what rules must not change
2. Read [dashboard-design.md](dashboard-design.md) — understand the current UI contract
3. Read the current `AOP 2027 Modeler/CHANGELOG.md` — understand what's already built
4. Identify the latest modeler HTML version (e.g., `AOP2027-OnePortfolio-v4.6.html`)
5. Confirm the enhancement request is clear and scoped

## Phase 1: Scope and impact analysis

### 1.1 Classify the change

| Type | Definition | Impact scope |
|------|-----------|-------------|
| **Engine logic** | Changes to `engine.js` or inline allocation/scoring code | All tabs, all exports, all tests |
| **UI/UX** | Visual changes, new controls, layout modifications | Affected tabs, possibly exports |
| **Filter/interaction** | New filter dimensions, changed event handling | Affected tables and their totals |
| **Data display** | New columns, changed formatting, total row changes | Affected tables |
| **New tab/section** | Adding a new tab, section or panel | Navigation, tab order, workflow |
| **Bug fix** | Correcting incorrect behaviour | Depends on the bug scope |

### 1.2 Identify affected surfaces

For each change, document:
- Which tabs are affected (Demand, Scenario, EW, BU, Operations, Overview)
- Which tables are affected (table IDs or scopes)
- Which engine functions are affected (normalize, enrich, solve, transact, filter)
- Which PRD requirements are affected (NAV, SC, MET, RULE, SCORE, CONF, FIL, DATA, SAVE, EXP, UX, AT)
- Whether the change affects Excel exports

### 1.3 Confirm approach

Present the scope analysis to the user:
- What will change and why
- What must NOT change (the preservation contract)
- What the "X of Y" format looks like for filtered totals (if applicable)
- Estimated number of code locations modified

**Wait for user approval before proceeding to implementation.**

## Phase 2: Implementation

### 2.1 Create the new version

```bash
cp AOP2027-OnePortfolio-vX.Y.html AOP2027-OnePortfolio-vX.Z.html
```

**Never modify the baseline file.** Always work on a new version copy.

### 2.2 Apply changes

Follow these constraints during implementation:

**Preservation rules** (applies to ALL changes):
- Financial reconciliation identities must hold: requested = final + unfunded; EW + BU = portfolio; stage totals = portfolio
- The engine's `solve()` output must be deterministic for the same inputs
- Manual overrides must remain additive (no silent refill)
- Missing evidence must remain visible (no zero substitution)
- All 6 tabs must render without console errors
- Source data integrity must be preserved (exact rows, values, formulas)
- Decision log must continue recording all state changes

**For engine logic changes**:
- Update `Skills/assets/engine.js` alongside the inline version in the HTML
- Run all 4 presets and verify they solve without error
- Verify reconciliation identities hold for the default scenario

**For UI/UX changes**:
- Match the existing Philips design language (palette, typography, spacing)
- Test at 1440×900 and 1920×1080 viewports
- Verify keyboard navigation and screen reader accessibility
- Confirm no horizontal scrollbar on desktop widths

**For filter/interaction changes**:
- Verify cascading filter counts update correctly
- Verify "X of Y" total row format works with the change
- Verify filter clear restores the unfiltered state
- Verify filters don't affect funding decisions

### 2.3 Self-test during implementation

After each significant code change, verify in the browser:
- No console errors
- Affected tab renders correctly
- KPIs update correctly
- Table data is consistent with the engine output

## Phase 3: Comprehensive QA

### 3.1 Run the automated QA suite

Execute `QA-PROCEDURE.md`:
```bash
cd "AOP 2027 Modeler"
python run-qa.py
```

**All 24+ automated checks must PASS.** If the enhancement changes expected values (e.g., new row count, new tab), update the QA harness first and document the update.

### 3.2 Enhancement-specific regression checks

| Check | Method | Pass criteria |
|-------|--------|---------------|
| Unaffected tabs unchanged | Compare snapshots before/after | Identical output |
| Engine identity: requested = final + unfunded | Engine output | Within 0.01 M€ |
| Engine identity: EW + BU = portfolio | Engine output | Within 0.01 M€ |
| All 4 presets solve | Cycle presets | Zero errors |
| Manual override round-trip | Add override, save, reload | Override preserved |
| Filter + total row | Apply filter, check "X of Y" format | Correct values |
| Filter clear | Clear filter, check totals revert | Original format restored |
| Excel export parity | Export, compare to dashboard | Matching values |
| Bubble chart renders | Check chart on EW/BU/Overview | All scored programmes visible |
| Decision log records changes | Make a decision, check log | Event recorded |
| Undo works | Undo a decision, check state | Previous state restored |

### 3.3 Visual regression checks (if UI changed)

- [ ] Header and branding unchanged
- [ ] Tab order correct: Demand → Scenario → EW → BU → Operations → Overview
- [ ] KPI cards display and align correctly
- [ ] Funding bar segments sum to total
- [ ] Lever controls respond to input
- [ ] Table columns align and totals are readable
- [ ] Bubble chart fills panel width
- [ ] Modal popups open and close correctly
- [ ] No overlapping text or truncated labels

### 3.4 Defect classification

| Severity | Definition | Action |
|----------|-----------|--------|
| **Blocker** | QA check fails, reconciliation broken, console error, data loss | Must fix before proceeding |
| **Critical** | New feature doesn't work, existing feature broken, wrong numbers | Must fix before proceeding |
| **Major** | UI regression, export discrepancy, filter malfunction | Fix recommended before release |
| **Minor** | Cosmetic, non-functional, edge case only | Document and defer |
| **New defect** | Issue in existing code discovered during testing | Document separately; fix if scope allows |

### 3.5 QA approval gate

QA is approved when:
- All 24+ automated checks PASS
- All regression checks PASS
- Zero blocker or critical defects remain
- Major defects are documented with planned resolution
- New defects (pre-existing) are documented separately

## Phase 4: Update documentation (only after QA approval)

### 4.1 Update CHANGELOG.md

```markdown
## vX.Z.0 — [Enhancement title] (DD Mon YYYY)
**[1-line summary of what changed and why]**

### [Category: e.g., Filter Engine, UI, Engine Logic]
- [Bullet per change with specific detail]
- [What was changed, what it replaces, what it enables]

### Regression verification
- Automated QA: [N]/[N] PASS
- Regression checks: [N]/[N] PASS
- New defects found: [N] (documented in [location])
```

### 4.2 Update PRD (when requirements changed)

Update `PRD/AOP2027-Modeler-PRD-vX.Z.docx`:
- Add or modify requirement sections that describe the new behaviour
- Update image references if the UI changed
- Update the version number and date
- Preserve all unchanged requirements exactly

**What to update in the PRD**:
- Product scope if new features are added
- Tab descriptions if tab behaviour changed
- Filter descriptions if filter behaviour changed
- Metric definitions if new metrics are added
- Design references if layout changed

**What NOT to update in the PRD**:
- Source data figures (these belong in data-contract.md)
- Engine implementation details (these belong in decision-policy.md)
- Historical closed overlaps (append new ones, don't modify old ones)

### 4.3 Update Detailed Requirements (when calculations or rules changed)

Update `PRD/AOP2027-Modeler-Detailed-Requirements-vX.Z.docx`:
- Add or modify requirement IDs (NAV, SC, MET, RULE, SCORE, CONF, FIL, DATA, SAVE, EXP, UX, AT)
- Update acceptance test expectations
- Add new requirement IDs for new features
- Update the version number and date

### 4.4 Update skill references (when domain knowledge changed)

Check each reference document for accuracy:
- [decision-policy.md](decision-policy.md) — if funding rules changed
- [dashboard-design.md](dashboard-design.md) — if UI layout changed
- [data-contract.md](data-contract.md) — if source schema changed
- [demand-landscape.md](demand-landscape.md) — if demand scope changed
- [burf-organisation-view.md](burf-organisation-view.md) — if BURF display changed
- [data-view-comparison.md](data-view-comparison.md) — if tab/filter behaviour changed
- [prioritization-guardrails.md](prioritization-guardrails.md) — if rules/guardrails changed
- [finance-cost-impact.md](finance-cost-impact.md) — if financial calculations changed
- [live-recommendations.md](live-recommendations.md) — if decision workflow changed

## Phase 5: Update project memory

Update `Memory/AOP2027-Demand-Context.md` if:
- Dashboard filename changed (new version)
- Any reconciled figures changed
- Workflow or tab order changed

## Workflow summary

```
Enhancement request → Classify → Impact analysis → Confirm approach
  → [User approves]
    → Create new version → Implement changes → Self-test
      → QA (automated + regression + visual)
        → [FAIL: fix and re-run from QA]
        → [PASS: QA approved]
          → Update CHANGELOG → Update PRD → Update Requirements
            → Update skill references → Update project memory → DONE
```

## Enhancement vs data refresh decision tree

```
Is the change about new/updated source data?
  YES → Use build-data-source-refresh.md
  NO  → Is it a new feature, UI change, or bug fix?
    YES → Use this skill (build-enhancement.md)
    NO  → Is it about skill/reference content only?
      YES → Update the reference directly, no build needed
      NO  → Clarify with the user before proceeding
```
