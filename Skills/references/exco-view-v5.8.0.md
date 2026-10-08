# Current release v5.8.0 — ExCo view, 30 September 2026

New build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html. The v5.7.0 HTML and source workbooks remain byte-for-byte unchanged. Open in the ExCo decision view; Six-tab workbench preserves all six detailed tabs. One current scenario and one finance ledger drive both surfaces.

Company position, My portfolio, Compare options and Decisions provide leader ownership filters, receiving organisation costs, live current-to-recommended funding deltas, preview/apply/cancel with stale-revision protection, save/export/finalise/fork and undo. Imported request and merit reviews now enforce valid numeric ranges and rationale. Valid funding and scoring results match v5.7.0.

Validation: 1423/1423 assertions passed across 32 scenarios, 69,280 independent source field comparisons, all 16 leaders, 32 Excel exports, changed-source refresh and 649 extract column filters. Recommendation: retain default 100 M€ Optimal; best among 135 tested lever settings preserving baseline-funded LFR/carry and baseline Sustain. Base funding 99.963 M€; PMI 5.19 M€; Operations 470.314463039 M€; total IT 575.467463039 M€. This finite merit search is not a global delivery/cash optimisation.

Unchanged finance rules: BU row 276 is a percentage key, not 40 M€ demand. Retain 22.6303317536% EW unallocated. Carry uses confirmed approved baseline caps with no ROI threshold. Benefits remain accepted; hard/soft lifetime claims stay separate. Other BU unallocated 1.822 M€ remains explicit.

Evidence: ExCo-QA-report-v5.8.0.html and ExCo-architecture-v5.8.0.html in AOP 2027 Modeler; reproducible release under Data file/ExCo-20260930-v5.8.0. PRD and detailed requirements v5.8.0 ExCo Addenda supplement the unchanged v5.7.0 specifications. Technical gaps and source balances are in the report; no new approval or formal handoff gate is introduced.

---
Retained release history below; the section above governs the current view and version.


Accountable ExCo ownership and receiving-BU charges must remain separate. Compare options uses baseline source merit for all compared scenarios. Recommendation usage saves the old scenario and creates a new child draft. The recommendation source hash must match the current Programs source. Operations allocation is invariant across these scenario changes.
