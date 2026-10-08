Allocation correction v5.9.7 — 5 October 2026

Built from the user-selected v5.9.5 dashboard. An existing separate v5.9.6 is preserved and is not used as the baseline. The original v5.9.5 dashboard and its scenario storage are preserved.

Problem and correction
The latest BU workbook has shifted allocation headings. Percent-labelled columns include spend amounts and group subtotals. The v5.9.5 parser interpreted those headings as recipient percentages. It also disabled the confirmed enterprise charging policy for programs moved to Laura's new IT sub-organisations.
The correction matches the source external-link formulas before applying the reviewed layout, reads 20 distinct leaf amount columns without subtotal duplication, and divides BU spend allocations by the original requested K€ amount. A PH subtotal is used only where the leaf breakdown is absent; its original cell remains in the ledger. Incomplete or conflicting allocations remain visible and are never forced to 100%.
The manual enterprise key uses a different layout. Its 20 formula-derived ratios total 0.001. The existing user-confirmed 1,000x correction restores 100%, including 22.63033175355452% explicitly marked Not allocated. Original source Type III determines charging evidence even after the current org/type remap; the new Laura orgs and current funding types remain intact.

What changes in Tab 6 and Excel
Recipient allocations and ledger amounts are recalculated. The Unallocated row separates explicit source unallocation, missing/incomplete keys, and conflicting source allocations. Drilldown now shows each program's reason and source cell. Excel adds an Allocation Review sheet and extends Funding Ledger with resolved sub-recipient, raw value, scale, formula, original header and allocation basis.
Every program's requested amount, merit score, funded amount, and scenario membership matches v5.9.5 across five presets. Operations remains 470.31446303851214 M€ and PMI 8.19 M€. Annual benefit scoring, carryover filters, Must Do funding and Laura sub-org ownership are unchanged.

Recovery
v5.9.7 uses a separate storage namespace. It can read the last v5.9.5 draft for this exact source without writing to the old namespace. It rebuilds records, charging key and source mappings, and keeps reviews, funding overrides, settings and status. A v5.9.5 portable scenario for this exact source is also accepted. This path was verified in the calculation engine and with a mock read-only IndexedDB test; recovery in the user's live browser was not verified.

Verification
132 checks passed: 40 portfolio engine regressions, 47 allocation checks, 28 independent native-XLSX export checks, 10 independent original-source checks, and 7 static/mocked-storage checks. Syntax validation also passed. Each funded ID/recipient pair was compared with a separate original-XLSX reader across five scenarios. Every program ledger, recipient column and grand total reconciles.
Live UI and visual verification was blocked by the browser's local-file URL restriction. No alternative browser access was attempted. Static markup and built-file parity were checked.

Source
AOP 2027 Consolidated Live 510261440.xlsx
SHA-256 981e9a196484e5f41852cb2b4088c8539478d63d335139fb059d7ef8b8dea8ac
Original bytes, every sheet/cached value/formula: outputs/refresh-v5.9.5-20261005/source-snapshot.json.
Full corrected normalized records and result ledgers: outputs/allocation-review-v5.9.7-20261005/normalized.json and *-result.json.

Exact scenario comparisons (M€)
optimal: Unallocated 79.119831339624 -> 11.416227488152; base 99.9896; PMI 8.19; Operations 470.314463038512; total IT 578.494063038512. Breakdown {'explicit': 11.296227488151667, 'pending': 0, 'invalid': 0.12}
protect: Unallocated 71.376746279930 -> 10.032635071090; base 99.9926; PMI 8.19; Operations 470.314463038512; total IT 578.497063038512. Breakdown {'explicit': 10.032635071090056, 'pending': 0, 'invalid': 0}
evidence: Unallocated 71.776115861139 -> 10.476523696682; base 100.0246; PMI 8.19; Operations 470.314463038512; total IT 578.529063038512. Breakdown {'explicit': 10.47652369668247, 'pending': 0, 'invalid': 0}
mustdo: Unallocated 174.616092808681 -> 29.001696445498; base 232.4089; PMI 8.19; Operations 470.314463038512; total IT 710.913363038512. Breakdown {'explicit': 23.274996445497653, 'pending': 3.8567, 'invalid': 1.87}
capacity: Unallocated 79.943873792931 -> 10.408432464455; base 99.995; PMI 8.19; Operations 470.314463038512; total IT 578.499463038512. Breakdown {'explicit': 10.40843246445498, 'pending': 0, 'invalid': 0}

Remaining Must Do exceptions
Bu-08: Invalid allocation percentages; source request 300 K€; mapped source amounts 300.1 K€; value 1.0003333333333335.
Bu-12: Invalid allocation percentages; source request 650 K€; mapped source amounts 650.01 K€; value 1.0000153846153845.
Bu-454: Source allocation remainder; source request 100 K€; mapped source amounts 0 K€; value 0.1.
Bu-10: Source allocation remainder; source request 1200 K€; mapped source amounts 1117 K€; value 0.08299999999999996.
Bu-54: Invalid allocation percentages; source request 800 K€; mapped source amounts 800.2 K€; value 1.0002499999999999.
Bu-72: Invalid allocation percentages; source request 120 K€; mapped source amounts 122.37 K€; value 1.0197500000000002.
Bu-280: Source allocation remainder; source request 478 K€; mapped source amounts 328 K€; value 0.15000000000000002.
Bu-73: Source allocation remainder; source request 250 K€; mapped source amounts 226.3 K€; value 0.0237.
Bu-87: Source allocation remainder; source request 3500 K€; mapped source amounts 0 K€; value 3.5.
