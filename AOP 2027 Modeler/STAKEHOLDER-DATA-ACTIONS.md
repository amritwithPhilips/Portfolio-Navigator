# AOP 2027 Navigator — Data Actions Required from Stakeholders

**Date**: 29 September 2026
**Context**: Validation cycle 15 of the AOP27 One Portfolio Navigator (v5.4.1) identified 5 items that require stakeholder decisions before the model can pass the executive release gate. Three are data governance decisions; two are code fixes (being addressed by the model developer). Current score: 38/100.

---

## Action 1 — Operations Service Cost Source (Owner: Operations Finance)

**Issue**: The Navigator embeds 167 IT services totalling 469.7 M EUR. The 23 September Bill of IT contains 174 services totalling 470.3 M EUR. Seven services in the bill are absent from the Navigator, and 130 of the 167 shared services have cost differences.

**Missing services (7)**:

| Service ID | Service Name | Bill Amount (k EUR) |
|---|---|---|
| 1007704 | Customer Feedback Management | 520 |
| 1007709 | Job Catalog | 520 |
| 1007712 | NonConformance | 520 |
| 1007720 | QMS Role Selection (Lumen) | 520 |
| 1007721 | Regulations and Standards Workflow (NCRS) | 520 |
| 1007726 | Supplier Quality - SCAR | 520 |
| 1008048 | AI Tools - Copilot | 4,955 |

**Top 5 cost differences**:

| Service ID | Service Name | Navigator (M EUR) | Bill (k EUR) | Gap (M EUR) |
|---|---|---|---|---|
| 1007583 | Digital Productivity & Collaboration | 5.252 | 91 | +5.161 |
| 1007582 | Standard Collaboration & Workplace | 49.058 | 46,266 | +2.792 |
| 1007698 | Audit Management | 2.735 | 87 | +2.648 |
| 1007702 | CAPA NextGen | 2.906 | 445 | +2.461 |
| 1007573 | Data Center Operations | 4.003 | 1,757 | +2.246 |

**Decision required**: Which source version governs — the Navigator's current embedded snapshot, or the 23 September Bill of IT? Once confirmed, we will update the Navigator to match the approved version exactly.

**Expected next step**: Operations Finance to confirm the governing source version and provide the final approved service cost file. Timeline: by 3 October 2026.

---

## Action 2 — Stage Policy Alignment (Owner: AOP Decision Owner)

**Issue**: The Navigator implements a 4-stage prioritisation model:
1. Legal and Compliance (Must Do)
2. Carry Over demand
3. Sustain Engineering and Hygiene
4. Value Based Portfolio

The validation framework expects a 5-stage policy that separates "Sustain Engineering" and "Hygiene" into two distinct stages. The current 4-stage model intentionally merges them because both share the same funding lever and allocation logic.

**Decision required**: Confirm whether the 4-stage model is the approved policy, or whether a 5-stage split is required. If 5-stage is required, provide the classification rules for distinguishing "Sustain Engineering" from "Hygiene" programmes.

**Expected next step**: AOP decision owner to provide written confirmation of the approved stage taxonomy. Timeline: by 3 October 2026.

---

## Action 3 — Programme Summary Metadata Refresh (Owner: Model Developer)

**Issue**: The Navigator's embedded operations metadata reports EW demand = 111.7 M EUR and BU demand = 170.6 M EUR (total 282.3 M EUR). The engine computes from the actual programme data: EW = 115.7 M EUR, BU = 177.0 M EUR (total 292.8 M EUR). The metadata was generated from a previous data load and was not refreshed when the source workbook was updated.

**Impact**: Display-only; the engine uses the correct computed values for all allocation and prioritisation. The stale metadata only affects the ops-data summary block used for reference.

**Status**: Being fixed by the model developer in v5.4.2. No stakeholder action needed.

---

## Action 4 — Scenario Fork Behaviour (Owner: Model Developer)

**Issue**: When a user forks a scenario, all manual include/exclude decisions and evidence reviews are discarded. The forked scenario starts with a clean slate rather than preserving the parent's decisions.

**Impact**: Users who fork a finalised scenario lose all trade-off decisions and must re-enter them manually.

**Status**: Being fixed by the model developer in v5.4.2. Fork will optionally preserve parent decisions. No stakeholder action needed.

---

## Summary of Stakeholder Actions

| # | Action | Owner | Decision Needed | Deadline |
|---|---|---|---|---|
| 1 | Confirm governing Operations service cost source | Operations Finance | Provide approved service cost file | 3 Oct 2026 |
| 2 | Confirm 4-stage or 5-stage policy | AOP Decision Owner | Written confirmation of stage taxonomy | 3 Oct 2026 |
| 3 | Metadata refresh | Model Developer | No action — fix in progress | Automatic |
| 4 | Fork behaviour | Model Developer | No action — fix in progress | Automatic |

---

**Estimated score improvement**: Resolving Actions 1 and 2 (plus the two code fixes) would close 5 of 5 current FAILs and advance the score from 38/100 toward approximately 63/100. The remaining gap comes from pending checks (10 checks not yet validated, mostly in Export/Handoff and Scoring Facts categories) which require the corrected data to proceed.
