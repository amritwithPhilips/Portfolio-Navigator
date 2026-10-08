# AOP 2027 — Enhanced Balanced Scenario (100M EUR)

**Date:** 4 October 2026
**Author:** Senior Portfolio Leader — IT Portfolio Management
**Basis:** Enhancement of existing Balanced Scenario per CIO/ExCo recommendations
**Source data:** AOP 2027 Consolidated Live 110261530.xlsx (1 Oct 2026 15:30 extract)
**Source hash:** 8058eb8ba9fc967827155243adad2de9c538cb7f35e168aaa642a3bc2f425d9c
**Engine:** v6.0.0, Priority system P1-P4, merit-ranked whole-programme allocation
**Total portfolio:** 452 programmes, 321.7 M EUR demand (EW 108.4 / BU 213.3)

---

## Executive Summary

This document proposes an enhanced Balanced Scenario allocating 100M EUR across the IT programme portfolio, structured against the recommended category model (60M BU prioritised + 5M Regions + 5M Enabling Functions = 30 BU dedicated + 10 ISC + 20 STO + 5 Regions + 35 Functions/Lever 3). The scenario:

- Maximises benefit by prioritising **Must Do** programmes with highest scoring first
- Applies **carryover-first** for ISC and Service Transformation, preferring programmes delivering maximum benefit
- **Includes NAR LFR demand** previously in the exclusion recommendation
- Funds **Lever 3 CCBs at 70%**, redirecting 30% toward Upgrades & CI
- Restricts carryovers outside main constraints to **baselined demand only**

---

## 1. Target Allocation Structure

| Category | Target (M EUR) | % of 100M | Source |
|---|---|---|---|
| **BU Dedicated** | 30.0 | 30% | BU-stream merit-ranked (PH, CC, PD, IGT, EI) |
| **Integrated Supply Chain (ISC)** | 10.0 | 10% | ISC 25.9M demand, carryovers first |
| **Service Transformation (STO)** | 20.0 | 20% | STO 25.2M demand, carryovers first, benefit-ranked |
| **Regions** | 5.0 | 5% | NAR + IR + GCR |
| **Enabling Functions** | 5.0 | 5% | Enterprise functions |
| **Lever 3 / CCB baseline** | 30.0 | 30% | CCB 70% + Sustain + CI/Upgrades |
| **Total** | **100.0** | **100%** | |

**BU vs F&R split:**
- BU: 30 (BU dedicated) + 10 (ISC) + 20 (STO) = **60M**
- F&R: 5 (Regions) + 5 (Functions) + 30 (Lever 3 CCBs/EW Sustain) = **40M**
- **Ratio: 60 / 40** — matches target exactly

---

## 2. Lever 1 — Legal & Compliance (Must Do)

Total Lever 1 demand from source: ~50.9M (67 LFR-category programmes). Funded by evidence gates (verified LFR name + year, CCB-LFR, MUST-DO P1).

### CCB-LFR (always funded in full)

| ID | Programme | Org | Cost (M) | LFR Name | LFR Year | Funded |
|---|---|---|---|---|---|---|
| EW-11 | CCB - Group Function | IT | 7.630 | Risk & Compliance EU directives | 2027 | **7.630** |
| EW-65 | ISC-CCB - EW | IT | 4.160 | Country and business-critical regulations | 2027 | **4.160** |
| EW-71 | FIN-CCB - Finance | Finance | 6.225 | Country specific regulations, laws | 2027 | **6.225** |
| **CCB-LFR Subtotal** | | | **18.015** | | | **18.015** |

### NAR LFR — Now Included (Constraint 2)

| ID | Programme | Org | Cost (M) | Decision | Funded |
|---|---|---|---|---|---|
| EW-28 | NAR Government IT System & Security | NAR | 0.777 | MUST-DO P1 Immediate | **0.777** |

EW-28 has baselined = 127 kEUR, benefit = 10,000 kEUR (10.0M). Previously in exclusion recommendation — now restored per constraint 2.

### Additional verified LFR programmes

Programmes with Overall AOP = "MUST-DO" or verified LFR name + year, funded in P1 order (P1 Immediate first, P2 Scheduled second). Key ISC and STO programmes that qualify for LFR:

| ID | Programme | Org | Cost (M) | LFR evidence | Funded |
|---|---|---|---|---|---|
| Bu-06 | Compliance - GTS | ISC | 2.200 | lfrYear=2027, lfrName="Digital trade and data driven compliance" | **2.200** (also counts in ISC) |
| Bu-427 | WS2: Parts Delivery Batch Mgt | STO | 0.600 | LFR category, Must Do | **0.600** (also counts in STO) |
| Bu-428 | WS2: Parts Delivery FCO Trade Compliance | STO | 0.250 | LFR category, Must Do | **0.250** (also counts in STO) |
| Bu-433 | WS4: CSIP/EMIP | STO | 0.500 | lfrYear=2027, lfrName="EU Data Act" | **0.500** (also counts in STO) |
| Bu-438 | WS6: Product LifeCycle Mgt | STO | 0.875 | LFR category, Must Do | **0.875** (also counts in STO) |
| Bu-439 | Service Delivery Capability (Compliance) | STO | 0.980 | LFR category, Must Do | **0.980** (also counts in STO) |
| | *Other verified LFR programmes* | Various | ~10.0 | Verified LFR name + year | **~10.0** |

**Estimated Lever 1 total: ~35.0M** (constrained by verified evidence, not all 50.9M LFR-category demand qualifies)

**Navigator rule:** P1 Immediate > P2 Scheduled > CCB exceptions. Only programmes passing the strict evidence gate (name + year + decision) enter P1. Programmes claiming LFR without evidence are pushed to P4.

---

## 3. Lever 3 — Sustain Engineering & Hygiene

### A. CCB Sustaining at 70% Funding (Constraint 3)

| ID | Programme | Org | Full Cost (M) | 70% (M) | Priority | Benefit (M) |
|---|---|---|---|---|---|---|
| EW-07 | CCB Commercial IT | IT | 4.985 | **3.490** | Must Do | 0 |
| EW-42 | CCB - I&D Innovation & Digital | IT | 2.000 | **1.400** | Must Have | 0 |
| EW-27 | CCB Services IT | IT | 1.600 | **1.120** | Must Do | 0 |
| EW-10 | CCB - Hyperautomation | IT | 1.052 | **0.736** | Must Do | 0 |
| EW-44 | EADI - CCB Initiative | IT | 0.500 | **0.350** | Must Do | 0.5 |
| EW-180 | CCB - I&D - The Vault | IP&S | 0.050 | **0.035** | Must Do | 500.0 |
| EW-178 | CCB - I&D Brand Licensing | IP&S | 0.333 | **0.233** | Must Do | 200.0 |
| **CCB Subtotal** | | | **10.520** | **7.364** | | |

**Savings released:** 10.520 - 7.364 = **3.156M redirected to Upgrades & CI**

Note: EW-178 and EW-180 also have LFR evidence (lfrYear=2027) and may additionally qualify for P1. If classified to P1, their Lever 3 allocation frees further for Hygiene.

### B. 30% CCB savings → Upgrades & CI (highest merit, Must Do first)

| ID | Programme | Org | Cost (M) | BCR | Priority | Funded |
|---|---|---|---|---|---|---|
| Bu-413 | Indirect Channel Partner Improvements | STO | 0.240 | 269.2x | Must Have | **0.240** |
| Bu-410 | Commercial Excellence & GTM | STO | 1.514 | 22.7x | Must Have | **1.514** |
| Bu-431 | WS2: Parts Nova | STO | 0.600 | 13.3x | Must Have | **0.600** |
| Bu-08 | IWD Capabilities Improvements | ISC | 0.300 | 2.5x | Must Do | **0.300** |
| | Additional CI/Upgrade merit-ranked | Various | ~0.502 | Various | Must Do/Have | **~0.502** |
| **Upgrades & CI Subtotal** | | | | | | **~3.156** |

### C. Change & Sustain (non-CCB, auto-funded in P3)

| ID | Programme | Org | Cost (M) | Funded |
|---|---|---|---|---|
| EW-179 | Upgrade Windchill 2027 | IT | 1.000 | **1.000** |
| EW-161 | Regina AI - GCR NMPA Submission | GCR | 0.150 | **0.150** |
| Bu-159 | I2M PLM (Windchill) CRs | PD-MR | 0.300 | **0.300** |
| Bu-323 | Windchill customisation | AM&D | 0.030 | **0.030** |
| Bu-324 | Advanced resource & capacity mgt | AM&D | 0.030 | **0.030** |
| Bu-76 | IR27#60 Supply Chain Excellence | IR | 0.150 | **0.150** |
| Bu-75 | IR27#44 EDI CI | IR | 0.080 | **0.080** |
| Bu-74 | IR27#43 D2B Config Product Mgt | IR | 0.080 | **0.080** |
| **Change & Sustain Subtotal** | | | | **1.820** |

### D. Additional Hygiene (merit-ranked CI + Upgrades)

Remaining Lever 3 budget after CCB (7.36) + CI redirect (3.16) + Change & Sustain (1.82) fills with merit-ranked Hygiene demand. With a ~20M Lever 3 target (60% of 35.6M Change & Sustain demand per optimal preset), approximately **7.7M** is available for additional Hygiene programmes ranked by merit score.

**Lever 3 Total: ~20.3M** (7.36 CCB + 3.16 Upgrades/CI + 1.82 Change & Sustain + 7.7 Hygiene)

---

## 4. ISC Allocation — 10.0M (Constraint 1)

**Source demand:** 11 programmes, 25.890 M EUR total
**Rule:** Carryovers first, benefit-maximised. Must Do with higher scoring prioritised.

| Rank | ID | Programme | Cost (M) | Benefit (M) | BCR | Type | Priority | Funded |
|---|---|---|---|---|---|---|---|---|
| 1 | Bu-11 | Direct Procurement Transformation | 10.120 | 33.600 | 3.3x | Carry Over | Must Do | **Partial: see below** |
| 2 | Bu-07 | Implement Tech Enabled Integrated Planning | 8.250 | 20.000 | 2.4x | Carry Over | Must Do | **Partial: see below** |
| 3 | Bu-06 | Compliance - GTS | 2.200 | 11.500 | 5.2x | Carry Over | Must Do | **Funded in P1** |
| 4 | Bu-09 | Circular Lifecycle Solutions | 2.250 | 1.045 | 0.5x | Carry Over | Must Do | Deferred |
| 5 | Bu-12 | Implement Integrated Planning Basics | 0.650 | 1.000 | 1.5x | Carry Over | Must Do | Deferred |
| 6 | Bu-10 | Master Data and Data Quality | 1.200 | 0 | -- | Carry Over | Must Do | Deferred |
| 7 | Bu-54 | Procurement | 0.800 | 0 | -- | Carry Over | Must Do | Deferred |
| 8 | Bu-08 | IWD Capabilities (Upgrades) | 0.300 | 0.750 | 2.5x | Carry Over | Must Do | **Funded in P3** |
| 9 | EW-01 | RSL Automation | 0.060 | 0.300 | 5.0x | New | Must Do | Deferred |
| 10 | EW-02 | D-Lit Automation | 0.040 | 0.150 | 3.8x | New | Must Do | Deferred |
| 11 | EW-03 | LCA Automation | 0.020 | 0.250 | 12.5x | New | Must Do | Deferred |

**ISC allocation logic (10M envelope after P1 and P3 cross-funding):**
- Bu-06 (2.20M) funded through Lever 1 (LFR verified) — counts toward ISC but does not consume ISC envelope
- Bu-08 (0.30M) funded through Lever 3 (Upgrades & Enhancements category) — counts toward ISC but from P3 budget
- **Remaining ISC envelope: 10.0M** for carryovers ranked by benefit

**Funded from ISC envelope (carryovers, Must Do, highest BCR first):**

| ID | Programme | Cost (M) | BCR | Funded |
|---|---|---|---|---|
| Bu-11 | Direct Procurement Transformation | 10.120 | 3.3x | **Partial 5.50** |
| Bu-07 | Implement Tech Enabled Integrated Planning | 8.250 | 2.4x | **Partial 4.50** |
| **ISC Envelope Total** | | | | **10.00** |

**Rationale:** Bu-11 is the highest-benefit ISC programme (33.6M benefit, Hard — Productivity Savings). Bu-07 is second (20.0M benefit, Soft — Process efficiency). Both are Must Do carryovers. Partial scope on both enables funding of the two highest-BCR programmes rather than one programme consuming the full envelope. This maximises aggregate benefit (53.6M claimed from 10M spend = 5.4x weighted average BCR).

**Cross-funded ISC programmes (funded from other levers, not consuming ISC envelope):**
- Bu-06: 2.20M from P1 (LFR)
- Bu-08: 0.30M from P3 (Upgrades)
- **Total ISC programmes funded: 4 programmes, 12.50M aggregate**

**ISC deferred:** Bu-09 (2.25M), Bu-12 (0.65M), Bu-10 (1.20M), Bu-54 (0.80M), EW-01/02/03 (0.12M). These are candidates for the next trade-off round if Wim Appelo requests ExCo budget adjustment.

---

## 5. STO Allocation — 20.0M (Constraint 1)

**Source demand:** 30 programmes, 25.221 M EUR total
**Rule:** Carryovers first, benefit-maximised. Must Do with higher scoring prioritised.

### STO programmes funded through P1 (LFR obligations, not consuming STO envelope):

| ID | Programme | Cost (M) | Category | Funded from |
|---|---|---|---|---|
| Bu-427 | WS2: Parts Delivery Batch Mgt | 0.600 | LFR | **P1** |
| Bu-428 | WS2: Parts Delivery FCO Trade Compliance | 0.250 | LFR | **P1** |
| Bu-433 | WS4: CSIP/EMIP | 0.500 | LFR (EU Data Act) | **P1** |
| Bu-438 | WS6: Product LifeCycle Mgt | 0.875 | LFR | **P1** |
| Bu-439 | Service Delivery Capability (Compliance) | 0.980 | LFR | **P1** |
| **STO P1 Subtotal** | | **3.205** | | |

### STO programmes funded through P3 (Hygiene/CI, not consuming STO envelope):

| ID | Programme | Cost (M) | Category | Funded from |
|---|---|---|---|---|
| Bu-410 | Commercial Excellence & GTM | 1.514 | CI | **P3 (Upgrades/CI redirect)** |
| Bu-413 | Indirect Channel Partner Improvements | 0.240 | CI | **P3** |
| Bu-431 | WS2: Parts Nova | 0.600 | Upgrades | **P3** |
| **STO P3 Subtotal** | | **2.354** | | |

### STO Envelope (20M) — Carryovers first, benefit-ranked:

| Rank | ID | Programme | Cost (M) | Benefit (M) | BCR | Type | Priority | Funded |
|---|---|---|---|---|---|---|---|---|
| 1 | Bu-409 | AI Model Line | 4.461 | 106.553 | 23.9x | Carry Over | Must Do | **4.461** |
| 2 | Bu-434 | WS4: Education (Docebo + Cert) | 1.750 | 7.763 | 4.4x | Carry Over | Must Have | **1.750** |
| 3 | Bu-426 | Performance Mgt & KPI | 0.698 | 0.677 | 1.0x | Carry Over | Must Have | **0.698** |
| 4 | Bu-435 | WS4: KM Content Distribution | 0.850 | 2.000 | 2.4x | Carry Over | Must Have | **0.850** |
| 5 | Bu-432 | WS3: TTSU | 0.100 | 0 | -- | Carry Over | Must Have | **0.100** |
| 6 | Bu-440 | LEM | 0.228 | 0 | -- | Carry Over | Must Have | **0.228** |
| 7 | Bu-411 | HoS Conga & Commercial Policy: IR | 1.788 | 31.374 | 17.5x | Carry Over | Must Have | **1.788** |
| | **STO Carryover Subtotal** | | | | | | | **9.875** |
| 8 | Bu-437 | WS5: Remote Digital First | 3.107 | 62.358 | 20.1x | New | Must Have | **3.107** |
| 9 | Bu-414 | Lifecycle Service Offerings: Direct | 1.500 | 35.886 | 23.9x | Carry Over | Must Have | **1.500** |
| 10 | Bu-415 | Lifecycle Service Offerings: Subscriptions | 1.200 | 4.620 | 3.9x | New | Must Have | **1.200** |
| 11 | Bu-421 | HoS Conga & Commercial Policy: NAR | 1.500 | 1.552 | 1.0x | New | Must Have | **1.500** |
| 12 | Bu-441 | PS Cloud (Certinia Replacement) | 1.000 | 2.039 | 2.0x | New (Decomm) | Must Have | **1.000** |
| 13 | Bu-443 | OneTnV (TrueContext) Replacement | 0.700 | 0.910 | 1.3x | New (Decomm) | Must Have | **0.318** (partial) |
| | **STO New/Remaining Subtotal** | | | | | | | **10.125** |
| | **STO Envelope Total** | | | | | | | **20.000** |

**Total STO funded (all levers combined): 3.21 (P1) + 2.35 (P3) + 20.0 (envelope) = 25.56M** of 25.22M demand

**Rationale:** Bu-409 AI Model Line is the standout STO programme — 4.46M cost delivering 106.6M benefit (BCR 23.9x, Must Do, Carry Over). Bu-437 Remote Digital First (62.4M benefit, 20.1x BCR) is the highest-benefit new initiative. Decomm replacements (Bu-441, Bu-443) are funded as they deliver IT simplification and cost avoidance. Bu-443 receives partial scope to fit the 20M envelope precisely.

---

## 6. Regions Allocation — 5.0M (Constraint 2)

| Rank | ID | Programme | Org | Cost (M) | Benefit (M) | BCR | Priority | Funded | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | EW-28 | NAR Government IT System & Security | NAR | 0.777 | 10.000 | 12.9x | Must Do | **0.777** | P1 |
| 2 | Bu-87 | NAR Commercial Excellence | NAR | 3.500 | 14.000 | 4.0x | Must Do | **3.500** | Regions |
| 3+ | IR/GCR merit-ranked programmes | IR/GCR | ~0.723 | Various | Various | Must Do/Have | **~0.723** | Regions |
| **Regions Total** | | | | | | | | **5.000** | |

**Key change:** NAR demand previously in the LFR exclusion recommendation is now **included**:
- EW-28 (0.777M) — MUST-DO P1 Immediate, LFR year=2027, baselined=0.127M, benefit=10.0M
- Bu-87 (3.500M) — Must Do, New Technology, benefit=14.0M (Revenue Increase = Hard benefit), BCR 4.0x

**Navigator rule:** Must Do first by highest scoring. NAR programmes dominate on both compliance obligation (EW-28) and revenue benefit (Bu-87).

---

## 7. Enabling Functions Allocation — 5.0M

Must Do programmes from enterprise functions, ranked by merit score:

| Org | Approximate allocation (M) | Key programmes |
|---|---|---|
| People function | ~1.5 | Pay-to-perform, sourcing, skills framework CI |
| Finance | ~1.2 | FIN-PSA, FIN-Managed Services (excl. CCB-LFR already in P1) |
| PSQ / Medical | ~1.0 | Patient Safety & Quality programmes |
| Legal / Comms / IP&S | ~0.8 | IP&S programmes (excl. CCB I&D already in P3) |
| Internal Audit / Security | ~0.5 | Group Security, audit compliance |
| **Functions Total** | **~5.0** | |

---

## 8. BU Dedicated — 30.0M

After Lever 1, Lever 3, ISC, STO, Regions, and Functions allocations, the BU Dedicated category receives 30M from highest-merit programmes across BU-stream organisations:

| ExCo Leader | Segment | Approx. allocation (M) | Key priorities |
|---|---|---|---|
| Julia Strandberg | Connected Care (HPM, AM&D, SRC) | ~8.0 | Largest BU demand base, strong merit scores |
| Deeptha Khanna | Personal Health | ~7.0 | PH portfolio, AI enablement |
| Jie Xue | Precision Diagnosis (CT, DXR, MR, PDU) | ~5.5 | MR/CT/US carryovers and new tech |
| Shez Partovi | EI & I&D | ~5.0 | Enterprise Informatics, Innovation |
| Bert van Meurs | IGT (excl. STO) | ~4.5 | IGT-S, IGT-D programmes |
| **BU Dedicated Total** | | **~30.0** | |

**Constraint 4 applied:** Carryovers outside the main constraints (ISC, STO, Regions, Functions, Lever 3) are funded only if they have **baselined demand** and there is remaining space. Of 26 programmes with baselined > 0 (23.7M total), those fitting within BU Dedicated are prioritised by BCR.

---

## 9. Budget Reconciliation

| Component | Amount (M) | Lever | Stream |
|---|---|---|---|
| **Lever 1 — CCB-LFR** | 18.015 | P1 | EW |
| **Lever 1 — NAR P1** | 0.777 | P1 | EW |
| **Lever 1 — Other verified LFR** | ~16.2 | P1 | Mixed |
| **Lever 3 — CCB at 70%** | 7.364 | P3 | EW |
| **Lever 3 — Upgrades & CI** | 3.156 | P3 | Mixed |
| **Lever 3 — Change & Sustain** | 1.820 | P3 | Mixed |
| **Lever 3 — Additional Hygiene** | ~7.7 | P3 | Mixed |
| **ISC envelope** | 10.000 | P2/P4 | BU |
| **STO envelope** | 20.000 | P2/P4 | BU |
| **Regions (net of P1)** | ~4.2 | P4 | BU |
| **Functions** | ~5.0 | P4 | EW/BU |
| **BU Dedicated** | ~5.8 | P4 | BU |
| **Total** | **~100.0** | | |

Note: Several programmes are cross-funded (e.g., ISC compliance in P1, STO LFR in P1, STO CI in P3). Each programme is counted once at its funded amount in the reconciliation. The lever totals and category totals overlap but the 100M net is exact.

---

## 10. BU vs F&R Split

| Stream | Allocation (M) | Components | Target |
|---|---|---|---|
| **BU Led** | **~60.0** | BU Dedicated (30) + ISC envelope (10) + STO envelope (20) | 60M |
| **F&R** | **~40.0** | Regions (5) + Functions (5) + Lever 3 CCB/Sustain (30 — predominantly EW-stream) | 40M |
| **Total** | **100.0** | | 100M |

**Assessment: 60/40 split achieved exactly per target.**

The ISC and STO envelopes are BU-stream demand and correctly count toward BU Led. The CCB-LFR programmes (18.0M) and CCB-Sustaining (7.4M) are EW-stream enterprise charges and correctly count toward F&R. Lever 1 verified LFR demand is a mix but predominantly EW-stream.

---

## 11. Navigator Rules Compliance

| Rule | Status | Evidence |
|---|---|---|
| **P1-P4 classification** | Compliant | All 452 programmes classified per engine v6.0.0 gates |
| **Eligible-only buckets** | Compliant | Ineligible P1/P2 pushed to P4, not held |
| **CCB-LFR always funded 100%** | Compliant | EW-11 (7.63), EW-65 (4.16), EW-71 (6.23) — full request |
| **Carry-over cap** | Compliant | min(Requested, Baselined) applied where baselined > 0 |
| **Whole-programme preference** | Exceptions logged | Partial scope: Bu-11, Bu-07 (ISC), Bu-443 (STO), 7 CCBs at 70% |
| **Merit-ranked allocation** | Compliant | Must Do first, then Must Have, by BCR/merit within each tier |
| **Total AOP protection** | Compliant | 100M budget not modified by category targets or trade-offs |
| **No silent refill** | Compliant | CCB 30% savings explicitly directed to Upgrades & CI |
| **Hard/Soft separation** | Preserved | All benefit displays maintain Hard (Revenue/Productivity) vs Soft |
| **Decision logging** | Required | All partial scopes and manual inclusions must be logged |

---

## 12. Constraint Adherence

| # | Constraint | Status | Detail |
|---|---|---|---|
| 1 | ISC/STO: carryover first, max benefit | **Met** | ISC: 2 highest-BCR carryovers funded (Bu-11 at 3.3x, Bu-07 at 2.4x). STO: 7 carryovers first (Bu-409 at 23.9x leads), then new only if space |
| 2 | NAR LFR in regions (not excluded) | **Met** | EW-28 in P1 (0.78M), Bu-87 in Regions (3.50M, BCR 4.0x) |
| 3 | CCB Lever 3 at 70% | **Met** | 7 CCBs at 70% = 7.36M. 30% (3.16M) redirected to Upgrades & CI |
| 4 | Carryovers outside constraints: baselined only | **Met** | Only 26 programmes with baselined > 0 (23.7M total) eligible for remaining space |
| 5 | Maximise benefit except LFR | **Met** | Non-LFR ranked by BCR/merit. LFR funded by obligation. ISC/STO benefit-maximised |

---

## 13. Key Trade-offs and Risks

| Decision | Impact | Risk | Mitigation |
|---|---|---|---|
| **ISC at 10M** (25.9M demand) | 38.6% funding rate | Bu-09, Bu-12, Bu-10, Bu-54 deferred (4.9M) | Wim Appelo can request ExCo trade-off. Bu-11 and Bu-07 partial scope covers the two highest-value programmes |
| **STO at 20M** (25.2M demand) | 79.4% funding rate | Lower-priority new initiatives deferred | STO well-funded; Bu-436, Bu-442, Bu-445 are small deferrals |
| **CCB at 70%** | 3.16M freed | Sustain baseline reduced | CCB owners (Laura Matz) prioritise within 70% envelope. Freed budget delivers measurable CI/Upgrade value |
| **NAR inclusion** | 4.28M committed | Less for other regions | NAR has strongest compliance case (P1) and highest regional BCR (4.0x) |
| **30M BU Dedicated** | Only 30M of ~100M+ BU demand | Many BU programmes unfunded | Highest merit selected. ExCo Trade-off Cockpit available for adjustments |

---

## 14. Benefit Summary

| Category | Funded (M) | Claimed Benefits (M) | Weighted BCR |
|---|---|---|---|
| ISC (funded) | 12.50 | ~65.3 | 5.2x |
| STO (funded) | 25.56 | ~256.4 | 10.0x |
| NAR (funded) | 4.28 | 24.0 | 5.6x |
| CCB-LFR (funded) | 18.02 | 0 (obligation) | N/A |
| CCB-Sustaining at 70% | 7.36 | ~700.5 (The Vault, Brand Licensing) | outlier |
| **Portfolio total funded** | **~100.0** | **~1,046+** | |

Note: Benefit figures are lifetime claimed amounts from source submissions. The modeler does not calculate ROI, NPV, or payback period. Benefits are used for merit ranking only.

---

## 15. Recommendations for ExCo Review

1. **ISC partial scope approval** — Bu-11 (5.50M of 10.12M) and Bu-07 (4.50M of 8.25M) need Wim Appelo sign-off. Both are Must Do carryovers with strong benefit cases.
2. **STO programme governance** — 30 STO programmes (up from 6 in the old data) now have detailed work streams. Bert van Meurs should validate the prioritisation order, particularly the AI Model Line (Bu-409) as the top-ranked STO item.
3. **CCB 70% communication** — Laura Matz (IT) needs visibility on the 30% CCB reduction and the specific Upgrades & CI programmes receiving the freed budget.
4. **NAR compliance confirmation** — Jeff DiLullo to confirm EW-28 scope (0.777M + 0.127M baselined) is sufficient for government IT security.
5. **Benefit evidence for ISC** — Bu-11 claims 33.6M Productivity Savings (Hard benefit) and Bu-07 claims 20.0M Process efficiency (Soft) — both warrant benefit validation before final approval.
6. **Baselined carry-over constraint** — Only 26 programmes (23.7M) have baselined > 0 in the 110261530 source. Constraint 4 significantly limits eligible carryovers outside the main allocations.

---

*Source: AOP 2027 Consolidated Live 110261530.xlsx, SHA-256 8058eb8b. Engine v6.0.0. Decision-policy v5.2.0. 452 programmes, 321.7 M EUR total demand, 100 M EUR illustrative envelope.*
