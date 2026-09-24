# Managing live recommendations | v4.6

## Decision types in the modeler

The modeler supports three categories of decisions, each logged and reversible:

### 1. Lever decisions (scenario-level)

Made on the **Program AOP Scenarios** tab through slider controls and preset buttons.

| Control | Effect | Use when |
|---------|--------|----------|
| **Total AOP** | Sets the overall budget envelope | Finance provides a new target |
| **P1 lever** | Controls Legal & Compliance budget allocation | Adjusting mandatory spend |
| **P2 RoI slider** | Sets carry-over benefit/cost threshold (0x–5x) | Tightening or loosening carry-over evidence bar |
| **P3 lever** | Controls Sustain & Hygiene allocation | Adjusting operational maintenance spend |
| **P4 lever** | Controls Value Portfolio allocation | Expanding or contracting new investment budget |
| **Merit floor** | Minimum score for P4 automatic funding | Raising the quality bar |
| **Weights** | Adjusts the four merit components | Rebalancing evidence priorities |

**Presets** apply a named combination of lever settings in one click. Manual overrides are preserved across preset changes.

### 2. Programme decisions (row-level)

Made on the **EW** or **BU Led** tabs by interacting with individual programme rows.

| Action | How | Effect |
|--------|-----|--------|
| **Include** | Check the programme checkbox | Funds at full request (or specify amount) |
| **Exclude** | Uncheck a funded programme, or use group "Exclude" button | Sets allocation to zero |
| **Partial scope** | Edit the amount input to a value < request | Funds at the entered amount |
| **Group include** | "Include eligible amount rows" button on BURF group | Funds all eligible programmes in the BURF |
| **Group exclude** | "Exclude displayed group" button | Excludes all displayed programmes in the BURF |
| **Return to automatic** | "Return to automatic" button on the programme row | Removes the manual override; engine recalculates |

**Key behaviours**:
- Manual inclusions are additive — they do not displace other funded programmes
- Manual exclusions do not silently refill — the freed budget stays as "Open to prioritisation"
- Missing/nonpositive requests cannot be manually included (checkbox is disabled)
- Partial scope amounts cannot exceed the source request

### 3. Evidence reviews (row-level)

Made via the **inline review panel** on each programme row (EW/BU tabs).

| Field | Purpose |
|-------|---------|
| **Optional decision note** | Free-text rationale for a manual decision |
| **Above-5.0x claim reviewed** | Checkbox to clear the benefit hold |
| **Contain condition** | Text field for recording the Contain condition |
| **Captured Consequence tier** | Override the automated interpretation (0/5/10/15) |
| **Review rationale** | Justification for a consequence tier override |

Reviews affect the programme's merit score and holds. A reviewed consequence tier requires both source evidence and a written rationale.

## Scenario management

### Save
Saves the current scenario to the browser's IndexedDB. The saved list shows below the export buttons on the Scenario tab.

### Fork (New working version)
Creates a copy of the current scenario with a new ID and "Draft" status. Use this to explore alternatives without modifying the original.

### Finalise
Locks the scenario as immutable. Requirements:
- All refreshed source decisions must be resolved (no "needs-review" overrides)
- Once finalised, no edits are possible — fork to create a new draft

### Undo
Reverses the most recent non-undo action. The undo button is in the Decision Log section. Source refreshes cannot be undone through this mechanism.

## Decision log

Every decision is recorded with:
- Revision number and timestamp
- Origin (which tab/control)
- Action type and details
- Before and after state

The log is visible at the bottom of the Scenario tab under "Decision log, demand data and decision rules." It is included in the portable JSON export for full audit trail.

## Export and portability

| Export | Content | Use case |
|--------|---------|----------|
| **Download Excel** (filtered) | Current filtered view with all engine columns | Share a specific slice with stakeholders |
| **Export complete portfolio** | All 521 programmes with full detail | Full audit export |
| **Export portable scenario** | JSON with settings, overrides, reviews, events | Move scenario between browsers or backup |
| **Download original demand Excel** | Exact source workbook bytes | Source verification |

## Source refresh workflow

When new source data arrives:

1. Upload via "Refresh demand workbook" on the Scenario tab
2. The engine validates schema compatibility and shows a preview: added, changed, removed, unchanged
3. **Changed programmes**: Previous overrides are marked "needs-review" — they appear with amber warnings
4. **Unchanged programmes**: Overrides and reviews are preserved
5. **Review**: Each "needs-review" programme has "Reconfirm previous decision" and "Discard previous decision" buttons
6. **Finalise**: Only possible once all reviews are resolved

## Recommendation workflow for leadership sessions

### Before the session
1. Set Total AOP to the agreed envelope
2. Apply the recommended preset (Optimal Segmentation)
3. Review the Prioritized and Unfunded tables
4. Identify programmes to discuss: partial scope candidates, evidence holds, near-boundary merit scores

### During the session
1. Use EW tab for Enterprise-Wide decisions, BU tab for BU-Led decisions
2. Make manual inclusions/exclusions as agreed
3. Monitor the Allocation KPI and Over/Within budget indicator
4. Use the bubble chart to visualise the merit/cost trade-off space

### After the session
1. Save the scenario with a descriptive name (e.g., "ITLT Review 24 Sep")
2. Export the complete portfolio Excel for distribution
3. Fork a working copy if further refinement is expected
4. Finalise only when the leadership position is confirmed
