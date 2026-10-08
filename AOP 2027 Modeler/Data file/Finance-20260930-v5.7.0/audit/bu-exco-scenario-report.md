# BU / ExCo Scenario Validation Report — v5.7.0
**Run:** 30 September 2026  
**Engine:** AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0  
**Result: 240 / 240 checks PASSED — 12 scenarios, 20 checks each**

---

## Checks per scenario (all 20/20)

Each scenario validates: funding identity · stream identity · stage identity · budget cap · carry cap · ledger reconciled · ledger identity · EW unallocated share (22.6303%) · Operations invariance (470.314 M€) · row-276 excluded · 433 active programs · per-record allocation · deterministic replay · source immutable · ISC chargeout == funded · IGTS chargeout == funded · PH chargeout == funded · Services chargeout == funded · IGT cluster matches ledger · PH cluster matches ledger

---

## Scenario Financial Results (M€)

| # | Scenario | Budget | IT Simp | Overrides | Funded | EW | BU |
|---|----------|--------|---------|-----------|--------|----|----|
| S11 | IGTS Decomm Ring-Fenced (IT Simp 5% AOP) | 100 | ✓ | 0 | 99.926 | 52.458 | 47.468 |
| S12 | PH Additional On Top — 3 unfunded forced | 100 | – | 3 | 102.763 | 49.716 | 53.047 |
| S13 | IGTS Additional On Top — WS5 + PLCM | 100 | – | 2 | 103.141 | 49.716 | 53.425 |
| S14 | IT Services Decomm Ring-Fenced 10M | 100 | ✓ | 0 | 99.926 | 57.308 | 42.618 |
| S15 | ISC All In — 2 EW stage3 forced | 100 | – | 2 | 100.063 | 49.816 | 50.247 |
| S16 | PH + IGTS Decomm Combined (IT Simp 3M) | 100 | ✓ | 1 | 100.861 | 52.658 | 48.203 |
| S17 | Budget Pressure 90M + IT Simp 5% AOP | 90 | ✓ | 0 | 89.985 | 51.688 | 38.297 |
| S18 | ExCo Trade-off — ISC drop, IGTS add | 100 | – | 2 | 100.014 | 49.696 | 50.318 |
| S19 | IT Services On Top — 4 major EW forced | 100 | – | 4 | 112.325 | 62.078 | 50.247 |
| S20 | PH Protect + Services On Top (partial) | 100 | – | 5 | 103.693 | 52.546 | 51.147 |
| S21 | All Four ExCo On Top — 1 each | 100 | – | 4 | 102.056 | 50.838 | 51.218 |
| S22 | Stress 80M + IT Simp 8% + IGTS decomm | 80 | ✓ | 5 | 83.812 | 47.331 | 36.481 |

---

## ExCo Chargeout by Scenario (M€ funded, programs pillar only)

| # | Wim Appelo (ISC) | Bert van Meurs (IGTS) | Deeptha Khanna (PH) | Laura Matz (IT/Svc) |
|---|------------------|-----------------------|---------------------|---------------------|
| S11 | 2.320 | 9.986 | 13.320 | 28.659 |
| S12 | 2.220 | 9.570 | 16.715 | 27.347 |
| S13 | 2.220 | 12.748 | 13.915 | 27.347 |
| S14 | 2.220 | 5.986 | 13.320 | 30.459 |
| S15 | 2.320 | 9.570 | 13.915 | 27.347 |
| S16 | 2.320 | 9.821 | 14.220 | 29.659 |
| S17 | 2.220 | 5.915 | 13.080 | 28.839 |
| S18 | 2.200 | 9.641 | 13.915 | 27.347 |
| S19 | 2.220 | 9.570 | 13.915 | 39.709 |
| S20 | 2.220 | 9.570 | 14.815 | 30.177 |
| S21 | 2.280 | 9.641 | 14.815 | 28.409 |
| S22 | 2.200 | 8.869 | 12.250 | 25.177 |

---

## BU Cluster Chargeout (programs allocation, M€)

| # | Image Guided Therapy | Personal Health |
|---|----------------------|-----------------|
| S11 | 15.864 | 21.623 |
| S12 | 15.116 | 24.584 |
| S13 | 16.520 | 21.784 |
| S14 | 12.633 | 22.390 |
| S15 | 15.132 | 21.799 |
| S16 | 15.731 | 22.554 |
| S17 | 11.140 | 21.261 |
| S18 | 15.184 | 21.781 |
| S19 | 17.075 | 23.740 |
| S20 | 15.565 | 23.132 |
| S21 | 15.365 | 22.861 |
| S22 | 10.522 | 19.741 |

---

## Scenario Design Notes

### Decomm scenarios (IT Simplification lever)
- **S11** — 5% of AOP (~5M) ring-fenced for Decomm/Replatforming (bucket=Stage4). 29 programs eligible; IGTS holds 10 of them. EW rises to 52.5M as IT/Services decomm programs absorb part of the envelope.
- **S14** — Fixed 10M IT Simp envelope. Largest beneficiary is Laura Matz (IT/Services) whose 19 decomm programs collectively request ~18.4M. Bert van Meurs (IGTS) drops to 5.99M as his Stage3 value programs lose budget to the ring-fence.
- **S16** — 3M IT Simp + PH on-top override. Modest ring-fence so only highest-ranked decomm gets funded; combined with forced PH inclusion total rises to 100.9M.
- **S17** — Budget cut to 90M with 5% IT Simp. Bert van Meurs IGTS drops to 5.92M; PH holds at 13.1M showing stronger carry/LFR base.
- **S22** — Maximum stress: 80M budget, 8% IT Simp (≈7.2M ring-fence), plus 5 IGTS decomm programs forced on top. All 240 checks pass; forced overrides push total funded to 83.8M (above automatic cap, as expected for overrides).

### Additional On Top scenarios
- **S12** — 3 PH unfunded Stage3 programs (2.8M total) forced in. PH chargeout rises from 13.9M→16.7M; IGT cluster barely moves, confirming override isolation.
- **S13** — WS5 Remote Digital First (3.1M) is the largest single on-top in the suite. Bert van Meurs jumps from 9.6M→12.7M. EW stream unchanged (pure BU override).
- **S15** — ISC has no Stage4/Decomm programs; both unfunded items are tiny EW (<0.1M). ISC chargeout moves only 0.1M, confirming correct ExCo attribution for EW programs.
- **S18** — Zero-sum ExCo trade-off: ISC drops EW-03 (0.02M), IGTS picks up Bu-447 (0.071M). Net funded +0.051M; confirms override priority ordering.
- **S19** — Aggressive Services on-top: Sales Replatforming (7M), Real Estate (2.5M), CPQ/CLM (1.8M), EADI Synapse (1.06M) = +12.4M above automatic. Laura Matz jumps to 39.7M; EW stream to 62.1M. PH cluster still grows (0.5M) from EW key reallocation.
- **S20** — Mixed partial-cost overrides (30–50%) plus one exclude. Demonstrates fractional funding flows correctly through BU cluster ledger.
- **S21** — One representative program per ExCo leader simultaneously on top. All four chargeout totals increase correctly; no cross-contamination between streams.

---

## Invariants confirmed across all 12 scenarios

| Invariant | Value |
|-----------|-------|
| Active program count | 433 |
| Operations total (Bill of IT) | 470.3144630385122 M€ |
| EW unallocated share | 22.6303317536% |
| Source hash stable | ✓ |
| Row 276 (Enterprise-wide charging) never in demand | ✓ |
| Finance ledger always reconciled | ✓ |
| Deterministic replay | ✓ |
| Source records immutable | ✓ |
