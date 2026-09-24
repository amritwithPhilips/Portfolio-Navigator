# Build Plan: v5 Scoring Reform — 8 Leadership Recommendations (Revised)

**Date**: 24 September 2026 (revised after blocker resolution)
**Baseline**: AOP2027-OnePortfolio-v4.6.html | engine.js v3.2.0 | Session schema 3
**Source**: `15926_IT AOP2027 Demand.xlsx` (SHA-256: 4ca3c6d4...)
**Live source**: SharePoint `AOP 2027 Consolidated Live.xlsx` (https://share.philips.com/sites/ITPFM)
**Status**: All 8 recommendations implementable. Zero blockers.

---

## Blocker resolutions

| # | Blocker | Resolution | Data evidence |
|---|---------|-----------|---------------|
| 1 | No Payback Period column | Column will be added to consolidated live source with formula defaulting to 0. Build provisions for the new column; scores 0 until populated. | EW col R is RoI (=Q/O), confirmed not payback. Neither sheet has payback today. |
| 2 | No Revenue/Productivity categories | Infer from `benefitDetails` text. If text mentions "revenue"/"productivity" keywords but programme has no numeric benefit, benefit score = 0. | 1 programme matches (EW-28); 88 mention keywords across all text fields. Inference from qualitative text is correct approach. |
| 3 | 50 programmes above 10x | Flag for manual review (hold), keep in prioritization. Holds prevent automatic funding but do not remove from tables or ranking. | Already how holds work. 10x threshold generates 50 reviews vs 63 at 5x. |

---

## Part 1: Data Element Inventory

### Currently extracted fields (22 fields)

| Field | Source column | EW col | Bu col | Used by |
|-------|-------------|--------|--------|---------|
| item | Item No. | A(0) | A(0) | Identity |
| planisware | Planisware ID | B(1) | B(1) | Identity |
| org | Organization setting demand | C(2) | C(2) | Classification, grouping |
| name | Initiative name | D(3) | D(3) | Display, identity |
| type | Type | E(4) | E(4) | Display |
| newCarry | New initiative or Carry-over | F(5) | F(5) | P2/P3 classification |
| category | Category | G(6) | G(6) | P3 classification, **Rec 4 inference** |
| platform | Leading IT Platform | H(7) | H(7) | Filtering |
| area | Investment Area | M(12) | M(12) | Filtering |
| priority | Priority (before Problem Statement) | V(21) | T(19) | Merit scoring |
| cost | IT Investment Requested 2027 [k€] | O(14) | O(14) | Funding, ratio |
| benefit | Quantified Benefits (in K€) | Q(16) | Q(16) | Merit scoring, ratio |
| benefitRaw | (raw value of benefit) | Q(16) | Q(16) | Traceability |
| benefitDetails | Quantified Benefits (Details) | S(18) | R(17) | **Rec 2/3 qualitative scoring, Rec 4 inference** |
| impact | Impact and Cost of Not Doing | T(19) | S(18) | Consequence scoring |
| problem | Problem Statement | AH(33) | AF(31) | Consequence scoring |
| scope | Scope | AI(34) | AG(32) | Consequence scoring |
| dependency | Dependency | AJ(35) | AH(33) | Display |
| decisionBand | Decision Band (Waste/band) | AY(50) | AW(48) | Merit scoring |
| overall | Overall AOP decision | BM(64) | BK(62) | Classification, holds |
| remarks | Remarks / evidence | BN(65) | BL(63) | Contain condition |
| lfrYear | LFR & Compliancy year | K(10) | K(10) | P1 evidence gate |
| lfrName | LFR & Compliancy (Name) | L(11) | L(11) | P1 evidence gate |
| baselined | Carry Over Baselined | P(15) | P(15) | P2 evidence gate |

### New fields to extract (2 fields)

| Field | Source column | EW col | Bu col | Used by | Status |
|-------|-------------|--------|--------|---------|--------|
| paybackYears | Payback Period (new column) | TBD | TBD | Rec 5/6: 5th merit component + validation | Column to be added to consolidated live source; formula defaults to 0 |
| benefitCategory | Inferred from benefitDetails text | — | — | Rec 4: Revenue/Productivity validation | Not a source column — derived by engine at enrichment time |

### Data element usage map per recommendation

| Rec | Required data elements | Currently extracted? | Action |
|-----|----------------------|---------------------|--------|
| 1. Remove DQ card | None (UI-only) | N/A | Remove HTML block |
| 2. Hybrid scoring | `benefit`, `benefitDetails` | Yes | Wire existing fields into new scoring path |
| 3. Qualitative scoring | `benefitDetails`, `category` | Yes | New `qualitativeBenefit()` function using existing fields |
| 4. Revenue/Productivity rule | `benefitDetails` (text scan), `benefit` | Yes | New regex scan of `benefitDetails` for keywords |
| 5. Payback scoring | `paybackYears` (new) | No — column to be added | Extract new column; default 0; 5th merit component |
| 6. Payback validation | `paybackYears`, `benefit` | Partial | Warning when benefit > 0 and payback missing |
| 7. 10x ceiling | `benefit`, `cost` (ratio) | Yes | Change threshold constant |
| 8. New bands | `benefit`, `cost` (ratio) | Yes | Change tier boundaries |

### Source data profile for affected fields

| Field | Non-empty | Coverage | Key observations |
|-------|----------|---------|-----------------|
| benefit (numeric) | 197 of 509 | 39% | 186 with ratio (cost > 0); 25 below 1x; 50 above 10x; 37 above 20x |
| benefitDetails (text) | 115 of 509 | 23% | 80 EW + 35 Bu; ~70 have substantive text after removing NA/TBD; 1 mentions "revenue" without numeric benefit |
| category | 442 of 509 | 87% | 9 distinct values; none match "Revenue Increase"/"Productivity Savings" |
| paybackYears | 0 of 509 | 0% | Column does not exist yet; will default to 0 |

---

## Part 2: All 8 recommendations — implementable

| Rec | Title | Phase | Data ready? |
|-----|-------|-------|------------|
| 1 | Remove Data Quality card | A | Yes |
| 7 | Increase ceiling to 10x | A | Yes |
| 8 | Redesign benefit bands | A | Yes |
| 5 | Payback Period scoring | A | Provisioned (0 default until column populated) |
| 6 | Payback Period validation | A | Provisioned |
| 3 | AI Qualitative Benefit scoring | B | Yes |
| 4 | Revenue/Productivity rule | B | Yes (inferred from benefitDetails text) |
| 2 | Hybrid Benefit scoring | B | Yes (wires together Recs 3+4) |

---

## Part 3: Detailed Build Plan

### Phase A: Engine reform + UI (Recs 1, 5, 6, 7, 8) — ~3 hours

#### A.1 Remove Data Quality card (Rec 1)

**File**: Next version HTML (e.g., v5.1.html)

**Changes**:
1. In `renderDemandOverview()` (~line 600): Delete the Data Quality card block (lines 600–608):
   ```
   // DELETE: h+='<div class="demand-card"><h3>Data Quality</h3>';
   // DELETE: 5 lines through closing </div>
   ```
2. In Insights table (~line 653): Remove the "Evidence Gaps" row referencing Payback/Qualitative/Quantitative TBDs
3. Retain data quality checks in QA harness and Scenario tab decision rules (untouched)

**Verification**: Tab 1 renders with 2 cards + Demand Split table + 2-row Insights table. No console errors.

#### A.2 Increase benefit review ceiling to 10x (Rec 7)

**Files**: `engine.js` + inline engine in HTML

**Changes** (3 locations):
1. `enrich()` hold logic: `ratio>5` → `ratio>10`
   ```js
   // Old: if(st>=3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');
   // New: if(st>=3&&ratio>10&&!review.benefitReviewed)holds.push('Benefit claim above 10.0x needs review');
   ```
2. Dashboard inline review checkbox: `'Above-5.0x claim reviewed'` → `'Above-10.0x claim reviewed'`
3. Merit Score Framework description text: update tier description

**Impact**: 13 programmes lose their review hold (5x < ratio ≤ 10x). 50 remain held (ratio > 10x).

#### A.3 Redesign benefit scoring bands (Rec 8)

**Files**: `engine.js` + inline engine in HTML

**Change** in `enrich()`:
```js
// Old: const bp=ratio===null||ratio<1?0:ratio<2?20:ratio<3?30:ratio<5?40:50;
// New: const bp=ratio===null||ratio<1?0:ratio<3?15:ratio<5?25:ratio<7?35:50;
```

**Impact on 186 programmes with ratios**:
| Tier | Count | Old points | New points | Change |
|------|-------|-----------|-----------|--------|
| <1x | 25 | 0 | 0 | — |
| 1–3x | 63 | 20–30 | 15 | -5 to -15 |
| 3–5x | 26 | 40 | 25 | -15 |
| 5–7x | 17 | 50 | 35 | -15 |
| 7–10x | 5 | 50 | 50 | — |
| >10x | 50 | 50 | 50 | — |

106 programmes see score reductions. P4 funding order will change.

#### A.4 Payback Period as 5th scoring component (Rec 5)

**Files**: `engine.js` + inline engine in HTML

**New source field extraction** in `normalize()`:
```js
// Add to field discovery:
ix.payback = locate(['payback period','payback','payback (years)'], false);
// -1 if column not found (graceful — scores 0)

// In record creation:
const paybackRaw = ix.payback >= 0 ? numberCell(get('payback')) : null;
r.paybackYears = paybackRaw;
```

**New scoring in `enrich()`**:
```js
// 5th component: Payback Period
const pk = r.paybackYears === null ? 0 
         : r.paybackYears <= 1 ? 10 
         : r.paybackYears <= 2 ? 8 
         : r.paybackYears <= 3 ? 6 
         : r.paybackYears <= 5 ? 4 : 0;

const raw = [bp, pp, c.points, dp, pk];
const components = raw.map((v,i) => v / [50,25,15,10,10][i] * s.weights[i]);
```

**Updated defaults**:
```js
// Old: const defaults=()=>({..., weights:[50,25,15,10]});
// New: const defaults=()=>({..., weights:[40,25,15,10,10]});
```

**Updated `validateSettings()`**:
```js
// Old: s.weights.length!==4
// New: s.weights.length!==5
```

**Session schema change**: 3 → 4
```js
// Old: const VERSION='3.2.0';
// New: const VERSION='4.0.0';
```

**Migration**: Existing saved scenarios with 4 weights need migration to 5 weights. Add to `validateSession()`:
```js
if (s.settings.weights.length === 4) {
    s.settings.weights = [40, 25, 15, 10, 10]; // Auto-migrate
}
```

**Dashboard changes**:
- Merit Score Framework: Add 5th component description
- Programme detail modal: Add 5th row to score breakdown table
- Advanced configuration: Add 5th weight input
- `apply-weights` handler: Read 5 inputs

**Current impact**: With payback column defaulting to 0 → all programmes score pk=0 → weight redistribution from 50→40 on benefit changes all scores slightly. When payback data is populated, programmes with short payback gain up to 10 weighted points.

#### A.5 Payback Period validation rule (Rec 6)

**File**: `engine.js` `enrich()` function

**New warning** (not a hold — programmes still fund):
```js
if (r.benefit !== null && r.benefit > 0 && r.paybackYears === null) {
    warnings.push('Payback period missing for quantified benefit claim');
}
```

**No hold, no block** — the programme can still be funded automatically. This is a data quality signal only.

---

### Phase B: Hybrid scoring (Recs 2, 3, 4) — ~3 hours

#### B.1 Qualitative benefit scoring function (Rec 3)

**File**: `engine.js`

**New function** `qualitativeBenefit(r)`:
```
Input:  record with benefitDetails and category
Output: { points: 0|10|20|30, evidence: string, interpreted: true }
```

**Tier detection logic** (deterministic regex, same approach as `consequence()`):

| Tier | Points | Detection method |
|------|--------|-----------------|
| 0 — No evidence | 0 | Empty, or text matches /^(na\|tbd\|n\/a\|none\|soft benefit\|not applicable)$/i, or length < 10 |
| 1 — General statement | 10 | Non-trivial text present, no specific indicators matched |
| 2 — Specific benefit | 20 | Matches cost/efficiency/compliance/process patterns WITH specificity: `/\b(cost (avoidance|reduction|saving)|efficien(cy|t)|automat(e|ion)|eliminat(e|ion)|compliance|regulatory|standardiz|consolidat|streamlin|simplif(y|ication)|reduc(e|tion|ing) (time|effort|risk|cost|manual)|enabl(e|ement|ing))\b/i` AND has contextual detail (>50 chars or contains org/system names) |
| 3 — Quantified non-financial | 30 | Contains numeric values with non-financial units: `/\d[\d,.]*\s*(fte|hours?|days?|%|processes|sites?|users?|systems?|applications?|minutes?|teams?)\b/i` OR cross-functional scope: `/\b(enterprise|cross[- ]functional|global|company[- ]wide|all (bus|regions|markets))\b/i` with specific benefit language |

**Maximum**: 30 points (60% of the 50-point component maximum). This caps qualitative below quantitative to preserve the incentive to provide numbers.

#### B.2 Revenue/Productivity inference rule (Rec 4)

**File**: `engine.js` `enrich()` function

**Logic**: Scan `benefitDetails` for revenue/productivity keywords. If found and no numeric benefit exists, benefit score = 0.

```js
const revProdRegex = /\b(revenue (increase|growth|generation)|productivity (saving|gain|improvement)|sales growth|top[- ]?line growth)\b/i;
const claimsRevProd = revProdRegex.test(r.benefitDetails || '');

// In benefit scoring path:
if (ratio !== null) {
    // Has numeric benefit — use quantitative scoring (Rec 8 bands)
    bp = /* ratio tiers */;
    benefitSource = 'quantitative';
} else if (claimsRevProd) {
    // Claims revenue/productivity but has no numeric proof
    bp = 0;
    benefitSource = 'revenue-productivity-unquantified';
    warnings.push('Revenue/productivity claim requires quantified benefit');
} else if (qualText is substantive) {
    // Qualitative fallback
    const qb = qualitativeBenefit(r);
    bp = qb.points;
    benefitSource = 'qualitative';
} else {
    bp = 0;
    benefitSource = 'none';
}
```

**Current impact**: Only **1 programme** (EW-28) matches today — mentions "revenue" in benefitDetails without numeric benefit. It would score 0 and get a warning. The remaining 87 programmes that mention revenue/productivity in other text fields (impact, problem, scope) are **not affected** — Rec 4 only scans `benefitDetails`.

#### B.3 Wire hybrid path into enrich() (Rec 2)

**File**: `engine.js` `enrich()` function

This ties together A.3 (new bands), B.1 (qualitative function), and B.2 (revenue/productivity rule) into a single benefit scoring path:

```js
function enrich(r, s, review = {}) {
    const st = stage(r);
    const ratio = r.cost > 0 && numeric(r.benefit) !== null ? r.benefit / r.cost : null;
    const c = consequence(r, review);
    
    // --- HYBRID BENEFIT SCORING (Recs 2/3/4/7/8) ---
    let bp, benefitSource;
    const revProdRegex = /\b(revenue (increase|growth|generation)|productivity (saving|gain|improvement)|sales growth|top[- ]?line growth)\b/i;
    const claimsRevProd = revProdRegex.test(r.benefitDetails || '');
    
    if (ratio !== null) {
        // Quantitative path (Rec 8 bands)
        bp = ratio < 1 ? 0 : ratio < 3 ? 15 : ratio < 5 ? 25 : ratio < 7 ? 35 : 50;
        benefitSource = 'quantitative';
    } else if (claimsRevProd) {
        // Revenue/Productivity without numbers = 0 (Rec 4)
        bp = 0;
        benefitSource = 'revenue-productivity-unquantified';
    } else {
        // Qualitative fallback (Rec 3)
        const qb = qualitativeBenefit(r);
        bp = qb.points;
        benefitSource = qb.points > 0 ? 'qualitative' : 'none';
    }
    
    // Payback (Rec 5)
    const pk = r.paybackYears === null ? 0 
             : r.paybackYears <= 1 ? 10 
             : r.paybackYears <= 2 ? 8 
             : r.paybackYears <= 3 ? 6 
             : r.paybackYears <= 5 ? 4 : 0;
    
    // 10x review hold (Rec 7)
    if (st >= 3 && ratio > 10 && !review.benefitReviewed) 
        holds.push('Benefit claim above 10.0x needs review');
    
    // 5 components (Rec 5)
    const raw = [bp, pp, c.points, dp, pk];
    const components = raw.map((v,i) => v / [50,25,15,10,10][i] * s.weights[i]);
    // ...
    
    return { ...r, benefitSource, qualitativeBenefit: qb, /* ... */ };
}
```

**New fields on enriched record**:
- `benefitSource`: `'quantitative'` | `'qualitative'` | `'revenue-productivity-unquantified'` | `'none'`
- `qualitativeBenefit`: `{ points, evidence, interpreted }` (when qualitative path used)
- `paybackYears`: number or null

**Dashboard changes**:
- Programme detail modal: Show "Benefit source: Quantitative / Qualitative / None" label
- Merit Score Framework: Update description to explain hybrid path
- Tab 2 merit description: Add 5th component and qualitative explanation

---

## Part 4: Comprehensive QA Plan

### Phase A QA — 15 new checks + 11 regression

#### New automated checks

| # | Check | Acceptance criteria |
|---|-------|-------------------|
| A1 | Data Quality card absent | Tab 1 has no `.demand-card` containing "Data Quality" |
| A2 | Tab 1 card count | Exactly 2 `.demand-card` elements |
| A3 | Benefit review threshold text | Hold message contains "10.0x" not "5.0x" |
| A4 | Hold count at 10x | Programmes held = count where ratio > 10x |
| A5 | Tier: ratio 0.5x → 0 pts | `bp === 0` |
| A6 | Tier: ratio 1.5x → 15 pts | `bp === 15` |
| A7 | Tier: ratio 4.0x → 25 pts | `bp === 25` |
| A8 | Tier: ratio 6.0x → 35 pts | `bp === 35` |
| A9 | Tier: ratio 8.0x → 50 pts | `bp === 50` |
| A10 | 5 merit components | `raw.length === 5` and `components.length === 5` |
| A11 | Weights sum to 100 | `weights.reduce(sum) === 100.0` |
| A12 | Default weights [40,25,15,10,10] | Settings match |
| A13 | Payback: null → 0 pts | `pk === 0` when paybackYears is null |
| A14 | Payback: 1yr → 10 pts | `pk === 10` |
| A15 | Payback: 4yr → 4 pts | `pk === 4` |

#### Regression checks (all phases)

| # | Check | Method | Pass criteria |
|---|-------|--------|---------------|
| R1 | Financial reconciliation | Engine | requested = final + unfunded (±0.01) |
| R2 | Stream split | Engine | EW + BU = portfolio (±0.01) |
| R3 | Priority totals | Engine | Sum stages = portfolio (±0.01) |
| R4 | Classification unchanged | Compare | All programmes in same priority as v4.6 |
| R5 | P1 fully funded | Engine | All P1 funded |
| R6 | P2 cap respected | Engine | No P2 above baselined |
| R7 | All 4 presets solve | Cycle | Zero errors |
| R8 | All 6 tabs render | Browser | Zero console errors |
| R9 | Filters + "X of Y" totals | Apply filter | Format correct |
| R10 | Excel export parity | Export | Values match |
| R11 | Decision log | Make decision | Event recorded |

#### Score impact validation (Phase A)

| # | Check | Method | Expected |
|---|-------|--------|----------|
| S1 | P1/P2/P3 classification | Before/after | Identical sets — classification does not use benefit score |
| S2 | P4 ranking changed | Document | 106 programmes with ratio 1–7x change rank |
| S3 | Funded set may change | Document | Different P4 programmes may be funded due to reranking |
| S4 | Total allocation in tolerance | Engine | ≤ budget × (1 + tolerance%) |
| S5 | Weight redistribution effect | All scores | 50→40% on benefit changes all non-zero benefit scores by ~20% |

### Phase B QA — 10 new checks + Phase A regression

#### New automated checks

| # | Check | Acceptance criteria |
|---|-------|-------------------|
| B1 | `qualitativeBenefit()` exists | Returns valid object |
| B2 | Score range | Returns only 0, 10, 20, or 30 |
| B3 | "NA"/"TBD" → 0 | Score = 0 for trivial text |
| B4 | `benefitSource` field present | Every enriched record has it |
| B5 | Quantitative precedence | If `benefit` is numeric, `benefitSource === 'quantitative'` |
| B6 | Qualitative cap at 30 | No qualitative score exceeds 30 |
| B7 | Revenue/productivity rule | EW-28 scores bp=0 with source='revenue-productivity-unquantified' |
| B8 | Empty benefitDetails → 0 | Programmes without text score 0 |
| B9 | Numeric benefit unchanged | Programmes with numeric benefit have identical ratio-based scores |
| B10 | Modal shows benefit source | Programme detail popup displays label |

### Defect classification

| Severity | Definition | Action |
|----------|-----------|--------|
| **Blocker** | QA check fails, reconciliation broken, console error, data loss | Fix before proceeding |
| **Critical** | Wrong tier, wrong threshold, qualitative error, payback miscalculation | Fix before proceeding |
| **Major** | UI display error, merit text inconsistency, export mismatch | Fix before release |
| **Minor** | Cosmetic, rounding display | Document and defer |

### QA approval gate

QA approved when:
- All automated checks PASS (standard 24 + 15 Phase A + 10 Phase B)
- All 11 regression checks PASS
- Score impact validation documented
- Zero blocker/critical defects
- Major defects documented with resolution

---

## Part 5: Proposed PRD v4.0 Changes

### Section: Product scope (amended)

> **In scope (additions)**:
> - Hybrid benefit scoring: quantitative with qualitative fallback using deterministic text analysis
> - Revised benefit ratio tiers with 10x review ceiling and 5 wider bands
> - Payback Period as 5th merit scoring component (column provisioned, defaults to 0)
> - Revenue/Productivity quantification rule inferred from qualitative benefit text
> - Data Quality card removed from executive Demand Overview (operational checks remain in QA and Scenario tab)

### New requirement: SC-DQ 01

> **SC-DQ 01 Remove Data Quality Card**
> The Data Quality card is removed from the Demand Overview executive layout. Data quality checks (missing requests, benefits coverage, Decision Band and Overall AOP decision coverage) continue in the engine, QA harness, and Scenario tab decision rules section. The Demand Overview retains: Program Demand Overview card, Operations Overview card, Demand Split by Organisation table, and High-Level Insights table.

### New requirement: SCORE 03 Hybrid Benefit Scoring

> When a programme has a numeric Quantitative Benefit (`benefit` > 0 K€), score using the ratio tiers in SCORE 07.
>
> When a programme's `benefitDetails` text mentions revenue increase, productivity savings, sales growth, or top-line growth BUT the numeric benefit is null or zero, the benefit score is 0. Add warning: "Revenue/productivity claim requires quantified benefit." (See SCORE 05.)
>
> When a programme has no numeric benefit but has non-trivial qualitative text (excluding "NA", "TBD", text < 10 chars), apply qualitative scoring (SCORE 04).
>
> When neither quantitative nor qualitative evidence exists, benefit score is 0.
>
> The enriched record must include `benefitSource` (quantitative / qualitative / revenue-productivity-unquantified / none). The programme detail modal must display this label.

### New requirement: SCORE 04 Qualitative Benefit Scoring

> Analyse `Quantified Benefits (Details)` text using deterministic regex, consistent with Captured Consequence. No external AI service required.
>
> | Tier | Points | Criteria |
> |------|--------|----------|
> | No evidence | 0 | Empty, "NA", "TBD", or < 10 characters |
> | General statement | 10 | Non-trivial text, no specific benefit indicators |
> | Specific benefit | 20 | Cost avoidance/efficiency/compliance/enablement/process benefit with contextual detail |
> | Quantified non-financial | 30 | Numeric values with non-financial units (FTEs, hours, %, sites) or cross-functional scope with benefit language |
>
> Maximum: 30 of 50 component points. This cap preserves the quantitative evidence incentive.
>
> Source field: `Quantified Benefits (Details)` — EW col S(18), Bu col R(17).

### New requirement: SCORE 05 Revenue/Productivity Quantification Rule

> If `benefitDetails` text contains revenue or productivity claim keywords (`/revenue (increase|growth|generation)|productivity (saving|gain|improvement)|sales growth|top-line growth/i`) AND the numeric benefit field is null or zero, the benefit score component is 0. Qualitative scoring (SCORE 04) does not apply.
>
> Programmes with numeric benefit are unaffected — the quantitative path takes precedence.
>
> This is a scoring rule with a warning, not a hold. The programme remains eligible for automatic funding through other merit components.
>
> Current source impact: 1 programme (EW-28) matches.

### New requirement: SCORE 06 Payback Period Component

> Payback Period is the 5th merit scoring component. Default weights:
>
> | Component | Default weight | Max points |
> |-----------|---------------|------------|
> | Benefit Strength (Quant + Qual) | 40% | 50 |
> | Submitted Priority | 25% | 25 |
> | Captured Consequence | 15% | 15 |
> | Decision Band | 10% | 10 |
> | Payback Period | 10% | 10 |
>
> Payback tiers:
> | Period | Points |
> |--------|--------|
> | ≤ 1 year | 10 |
> | ≤ 2 years | 8 |
> | ≤ 3 years | 6 |
> | ≤ 5 years | 4 |
> | > 5 years or missing | 0 |
>
> Source field: Payback Period column (to be added to consolidated live workbook). Column discovery uses heading aliases: "Payback Period", "Payback", "Payback (Years)". If column not found, all programmes score 0 and no error is raised.
>
> Advanced weights must sum to 100.0 across all 5 components. Session schema increments to 4. Saved scenarios with 4 weights auto-migrate to [40,25,15,10,10].

### New requirement: SCORE 07 Revised Benefit Ratio Tiers

> | Benefit Ratio | Points | Label |
> |--------------|--------|-------|
> | < 1.0x | 0 | No return |
> | 1.0x – 3.0x | 15 | Low |
> | 3.0x – 5.0x | 25 | Medium |
> | 5.0x – 7.0x | 35 | High |
> | 7.0x – 10.0x | 50 | Maximum |
> | > 10.0x | 50 + review hold | Maximum (review required) |
>
> Replaces prior tiers: <1x=0, ≥1x=20, ≥2x=30, ≥3x=40, ≥5x=50.

### New requirement: DATA 07 Payback Period Validation

> If a programme has numeric benefit > 0 and payback period is null or 0, generate a warning: "Payback period missing for quantified benefit claim."
>
> If a programme has only qualitative benefit (no numeric), payback is not required.
>
> This is a warning, not a hold. The programme can still be funded.

### Amended requirements

> **RULE 05 (amended)**: Replace "Claims above 5.0x require evidence review" with "Claims above 10.0x require evidence review."
>
> **SCORE 01 (amended)**: Reference SCORE 07 for benefit ratio tiers. Note merit now has 5 components.
>
> **SCORE 02 (amended)**: Weights must sum to 100.0 across 5 components. Initial weights: [40, 25, 15, 10, 10].

---

## Part 6: Proposed Detailed Requirements Changes

### New requirement IDs

| ID | Title | Phase |
|----|-------|-------|
| SC-DQ 01 | Remove Data Quality Card | A |
| SCORE 03 | Hybrid Benefit Scoring | B |
| SCORE 04 | Qualitative Benefit Scoring | B |
| SCORE 05 | Revenue/Productivity Rule | B |
| SCORE 06 | Payback Period Component | A |
| SCORE 07 | Revised Benefit Ratio Tiers | A |
| DATA 07 | Payback Period Validation | A |

### Amended requirement IDs

| ID | Change | Phase |
|----|--------|-------|
| RULE 05 | Review threshold 5x → 10x | A |
| SCORE 01 | Reference SCORE 07; 5 components | A |
| SCORE 02 | 5 weights sum to 100.0; default [40,25,15,10,10] | A |
| MET 01 | Benefit scoring uses hybrid path | B |

### New acceptance tests

| Test | Phase | Description |
|------|-------|-------------|
| AT-A1 | A | Tab 1 has no Data Quality card |
| AT-A2 | A | Benefit hold triggers at 10x not 5x |
| AT-A3 | A | All 5 new benefit tiers produce correct scores |
| AT-A4 | A | P1/P2/P3 classification unchanged |
| AT-A5 | A | 5 merit components in every enriched record |
| AT-A6 | A | Payback null → 0 points |
| AT-A7 | A | Payback 1yr → 10 points, 4yr → 4 points |
| AT-A8 | A | Saved scenario with 4 weights auto-migrates to 5 |
| AT-B1 | B | Numeric benefit → quantitative source tag |
| AT-B2 | B | Qualitative text → qualitative scoring |
| AT-B3 | B | "NA"/"TBD" text scores 0 |
| AT-B4 | B | Qualitative cap at 30 |
| AT-B5 | B | Revenue keyword + no number → 0 score + warning |
| AT-B6 | B | Modal shows benefit source label |
| AT-B7 | B | Financial reconciliation holds with hybrid scoring |

---

## Part 7: Implementation Order (revised)

```
Phase A (~3 hours) — ALL UNBLOCKED
  ├── A.1 Remove Data Quality card (Rec 1)
  ├── A.2 Change review ceiling 5x → 10x (Rec 7)
  ├── A.3 Implement new benefit ratio tiers (Rec 8)
  ├── A.4 Add Payback Period as 5th merit component (Rec 5)
  │       └── Schema 3→4, weight migration, defaults [40,25,15,10,10]
  │       └── Payback column extracted if present, otherwise all score 0
  ├── A.5 Payback validation warning (Rec 6)
  ├── QA: standard 24 + 15 new + 11 regression + 5 score impact
  ├── CHANGELOG
  └── PRD/Requirements: SC-DQ 01, SCORE 06, SCORE 07, DATA 07, RULE 05 amended

Phase B (~3 hours) — after Phase A QA approved
  ├── B.1 Build qualitativeBenefit() function (Rec 3)
  ├── B.2 Revenue/Productivity inference rule (Rec 4)
  ├── B.3 Wire hybrid path into enrich() (Rec 2)
  ├── QA: Phase A checks + 10 new + regression rerun
  ├── CHANGELOG
  └── PRD/Requirements: SCORE 03, SCORE 04, SCORE 05, MET 01 amended
```

No Phase C or D — all 8 recommendations are covered in Phases A and B.
