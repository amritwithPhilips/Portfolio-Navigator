# Dashboard and model integration

Preserve the current Philips visual language and navigation. Use full business terms in user-facing text. Replace Change and Sustain or CCB stage labels with **Sustain Engineering**; source initiative names may still contain CCB.

## Shared calculation contract

The Excel model is the auditable record and the dashboard is its interactive view. Both must use one normalized dataset, the same settings, and the same allocation engine. Do not maintain hardcoded dashboard totals or an independently scored embedded dataset.

Each program view shows Item No., source sheet and row, requested amount, source Decision band, Overall AOP decision, merit components, Captured Consequence evidence, stage, allocated amount, and decision reason. A user must be able to trace every result back to the model workbook and original source row.

## Scenario controls

The visible business levers are only:

1. LFR coverage, with switchable `% of bucket demand` and `% of Total AOP` tabs.
2. Sustain Engineering coverage, with the same basis selector.
3. Hygiene coverage, with the same basis selector.
4. Carryover benefit threshold, default 2x and adjustable from 1x to 5x+ in 0.5x steps.
5. ROI-Based Portfolio, displayed as the automatic recipient of remaining AOP rather than an editable reservation.

Total AOP and the whole-initiative tolerance are scenario settings above the levers. Pair sliders with numeric entry and visible units. Put Minimum Merit Score and score weights in a collapsed Advanced section, never in the main lever panel.

Editing a control recalculates the unfrozen working scenario. Finalise freezes a named, versioned scenario; Refresh creates the next version and never mutates the frozen record.

## Portfolio treatment

Show LFR, Sustain Engineering, Hygiene, Carryover, and ROI-Based Portfolio as mutually exclusive primary stages in that allocation order. Business-led, enterprise-wide, region, platform, and organisation are reporting filters.

Use source Decision bands and Overall AOP decisions. Do not feature the nine waste dimensions in executive or allocation views. Keep blank assessments visible as Unassessed. Display `CONTAIN - Conditions` with the condition or a review action.

Use **Captured Consequence** for the 15-point merit component. Show the supporting passages from Impact and Cost of Not Doing, Problem Statement, and Scope.

## Interaction and verification

Keep the existing prioritized portfolio view. Add BU Led and EW Led conference tabs with inclusion and exclusion checkboxes, rationale entry, search and filters. Manual inclusion adds a whole initiative and may leave the final scenario over budget; display the MEUR and percentage variance instead of blocking the user. Manual exclusion removes the initiative. Both require a reason before finalisation and must update the Excel-compatible decision record.

Verify source totals, stage totals, business-led plus enterprise-wide reconciliation, model/dashboard parity, all filters, save/reload, export/import, keyboard use, responsive layout, and browser errors. Test at least five materially different settings.
