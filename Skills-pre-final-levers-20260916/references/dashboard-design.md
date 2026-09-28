# Dashboard and model integration

Preserve the current Philips visual language and navigation. Use full business terms in user-facing text. Replace Change and Sustain or CCB stage labels with **Sustain Engineering**; source initiative names may still contain CCB.

## Shared calculation contract

The Excel model is the auditable record and the dashboard is its interactive view. Both must use one normalized dataset, the same settings, and the same allocation engine. Do not maintain hardcoded dashboard totals or an independently scored embedded dataset.

Each program view shows Item No., source sheet and row, requested amount, source Decision band, Overall AOP decision, merit components, Captured Consequence evidence, stage, allocated amount, and decision reason. A user must be able to trace every result back to the model workbook and original source row.

## Scenario controls

Show portfolio envelope, LFR coverage, Sustain Engineering coverage, hygiene reservation, carry-over benefit threshold, and minimum merit. Pair sliders with numeric entry and visible units. Editing any control creates Custom settings and recalculates all views.

Show no more than three recommended presets: Balanced investment, Confirmed evidence, and Reduced sustain capacity. Presets must derive from current model data; never embed snapshot allocations as constants.

## Portfolio treatment

Show LFR, Sustain Engineering, carry-over, decommissioning and hygiene, and ROI-driven demand as mutually exclusive primary stages. Business-led, enterprise-wide, region, platform, and organisation are reporting filters.

Use source Decision bands and Overall AOP decisions. Do not feature the nine waste dimensions in executive or allocation views. Keep blank assessments visible as Unassessed. Display `CONTAIN - Conditions` with the condition or a review action.

Use **Captured Consequence** for the 15-point merit component. Show the supporting passages from Impact and Cost of Not Doing, Problem Statement, and Scope.

## Interaction and verification

Manual include, exclude, or amount changes require a reason and must update the Excel-compatible decision record. Preserve decisions across setting changes and hold them for review when source evidence changes.

Verify source totals, stage totals, business-led plus enterprise-wide reconciliation, model/dashboard parity, all filters, save/reload, export/import, keyboard use, responsive layout, and browser errors. Test at least five materially different settings.
