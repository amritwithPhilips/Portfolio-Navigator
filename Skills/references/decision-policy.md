# Decision policy | 5.2.0 | 25 September 2026

## Priority order (four priorities)

1. **Legal and Compliance (Must Do)** protects work required to meet a legal, fiscal, regulatory or compliance obligation. A programme qualifies for P1 only if: (a) its source ID is EW-11, EW-65 or EW-71 (CCB exceptions), OR (b) its Overall AOP decision matches "must-do - P1/P2" AND it has a non-empty LFR & Compliancy (Name) AND a non-empty LFR & Compliancy Year. LFRs matching the P1/P2 pattern but missing compliance name or year are classified to P4 (Value Based Portfolio). CCBs are always funded in full. Within P1: P1 Immediate first, P2 Scheduled second, CCB exceptions third. Evidence preference (name + year) within each tier.
2. **High-Value Carry-Overs** funds carry-over programmes with a confirmed prior business case. A programme qualifies for P2 only if: (a) New/Carry-over = "Carry Over", AND (b) Category is not Decomm/Replatforming, AND (c) Carry Over Baselined > 0, AND (d) Priority = "Must Do" or "Must Have". Funding capped at min(Requested, Baselined). Carry-overs failing any check are classified to P4. Ranked by benefit/cost ratio, then payback, then consequence, then merit. RoI threshold slider (0x–5x, 0.5 steps) controls eligibility.
3. **Sustain Engineering and Hygiene** is Change & Sustain demand plus Continuous Improvement and Upgrades & Enhancements. A programme qualifies if its New/Carry-over = "Change & Sustain" OR its Category = "Continuous Improvement" / "Upgrades & Enhancements". Change & Sustain funded first (all eligible), then Hygiene ranked by merit within remaining P3 budget.
4. **Value Based Portfolio** receives all remaining demand including decommissioning/replatforming, AI enablement, new features, LFRs without evidence, and carry-overs without baseline. Ranked by evidence strength (both benefit and impact preferred), then merit score.

Gate 0 checks every request's evidence; it has no funding. Every record belongs to exactly one priority.

## Eligible-only buckets

P1 and P2 contain only demand that passes strict evidence gates. Ineligible programmes are classified directly to P4 — they are not "held" in P1/P2. This ensures the lever display accurately reflects fundable demand.

## Eligibility and score

Missing name, nonpositive/missing request, unresolved mandatory priority or unknown Overall AOP decision holds automatic funding. Blank decision fields stay Unassessed and do not alone invent eligibility or adverse decisions. Contain requires a source/reviewed condition for discretionary allocation.

P3 programmes are exempt from the benefit requirement and the 10.0x review hold to ensure Change & Sustain demand is funded first without evidence friction.

Default merit maxima are 40.0 Benefit, 25.0 Submitted Priority, 15.0 Captured Consequence, 10.0 Decision Band, 10.0 Payback. Five components with weights [40,25,15,10,10]. Benefit tiers: below 1.0x = 0.0; 1-3x = 15.0; 3-5x = 25.0; 5-7x = 35.0; 7x+ = 50.0. Hybrid benefit scoring: quantitative ratio first, then revenue/productivity block, then qualitative fallback (max 30 of 50 points). Payback tiers: <=1yr = 10.0; <=2yr = 8.0; <=3yr = 6.0; <=5yr = 4.0; >5yr/missing = 0.0. Submitted Must Do = 25.0, Must Have = 18.0, Deprioritised = 5.0, blank/unrecognised = 0.0. Healthy = 10.0, Contain = 6.0, blank/other = 0.0.

Captured Consequence uses only Impact and Cost of Not Doing, Problem Statement and Scope. No evidence = 0.0; contextual evidence = 5.0; explicit harm plus affected activity/stakeholder = 10.0; that evidence plus quantified impact or enterprise reach = 15.0. A reviewed tier needs source evidence and an inline rationale.

Advanced weights are nonnegative and total 100.0. Each component is base points/default maximum × configured weight. Value floor defaults to 45.0, advanced only.

## Funding controls and arithmetic

P1, P3 and P4 have basis toggles: % of bucket demand / % of Total AOP / Allocation (M€). Slider and numeric entry. Target = min(bucket demand, basis × percentage) or direct M€ amount. P2 uses an RoI threshold slider (0x–5x, 0.5 steps) controlling eligibility, not a budget cap. Preserve percentage when changing basis.

Default settings: illustrative 100.0 M€ envelope, P1 and P3 at 100.0% of bucket, P4 at 100.0% of bucket, P2 RoI 0x, merit floor 45.0, tolerance 5.0%. No source-approved envelope is supplied.

Select whole initiatives in priority order. Stage limit is target × (1 + tolerance), capped by demand. Portfolio limit is Total AOP × (1 + tolerance), applied once. Skip a request that cannot fit and test the next row. P2 carry-overs are funded at min(Requested, Baselined), not full request.

Four presets: Optimal Segmentation (100% bucket P1/P3/P4, 0x carry), Protect Commitments (100% bucket P1/P3, 2x carry, 10% AOP P4), Tighten Carryover Evidence (100% bucket P1, 3x carry, 75% bucket P3, 15% AOP P4), Release Sustain Capacity (44% bucket P1, 0x carry, 75% bucket P3, 20% AOP P4). Retain entered Total AOP and manual overrides when changing preset.

## IT Simplification — Stage 4 (v5.6, toggle-activated)

When `session.settings.itsimpMode = true`, programmes with `category` containing "Decomm" or "Replatforming" (case-insensitive substring match) are classified to Stage 4 "IT Simplification" instead of Stage 3.

**Identification**: `isITSimpProgram(r)` checks `(r.category||'').toLowerCase()` for 'decomm' or 'replatform'.

**Funding**: Finance-based ring-fence supporting all 3 bases (% bucket / % AOP / Allocation M€). Default: `{basis:'bucket',pct:0}` — no budget reserved. Stage 3 residual is reduced by `itsimpReserve()` so Stage 3 cannot consume the IT Simplification allocation.

**Toggle**: Stored in `session.settings.itsimpMode`. Creates a `New Scenario (100M€)` fresh session to return to defaults.

**Presets**: All 4 existing presets keep `itsimpMode:false` — IT Simplification is always a manual user choice, not a preset.

## Shared scenario state

One shared scenario with settings, reviews, overrides, trade-offs and event history. Scenario types removed in v5.x. New Working Version performs a full reset: Optimal preset, empty overrides, empty reviews, empty trade-offs, cleared decision log. Automatic results computed first; manual overrides applied afterwards.

Enterprise Wide and BU Led are independently editable views of the same portfolio. Finalise from One Portfolio. A finalised financial state is immutable; fork it to create a new draft. Changed-source overrides are held pending inline review.

## ExCo accountability hierarchy (v5.2)

16 ExCo members mapped to all 35 organisation values via `EXCO_HIERARCHY` and `ORG_TO_EXCO` engine constants. Every enriched row carries an `exco` field. The `excoOf()` function handles fuzzy matching.

ExCo is a first-class filter dimension on all programme tabs (cascading ExCo->Org->Platform). ExCo grouping drives the Demand Split table (Tab 1) and Trade-off Cockpit (Tabs 3/4).

## Hard/Soft benefit classification (v5.2)

`classifyBenefit()` determines each programme's benefit class:
- **Hard**: benefit > 0 AND area in {Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain}.
- **Soft**: benefit > 0 AND area in {Compliance/Keeping the lights on, Security} or other areas.
- Fields: `benefitClass`, `benefitClassLabel`, `benefitFlag`.
- ALL benefit displays show Hard/Soft separately, never combined.

## Total AOP protection (v5.2)

Total AOP changes ONLY when the user manually edits the budget input field. The ExCo Trade-off Cockpit Apply button includes/excludes P4 programmes by merit score without modifying Total AOP. The "On top off AOP" KPI shows the delta between actual allocation and user-set budget.

## ExCo Trade-off mechanics (v5.2, updated v5.6)

The Trade-off Cockpit (Tabs 3/4, below filters, default closed) shows per-ExCo leader: Requested, Funded, Gap, % Funded, Hard Benefits, Soft Benefits, Trade-off Budget input, Delta, Progs/Benefits impact, Revert. Apply includes/excludes P4/Stage 3 programmes ranked by merit. Negative deltas supported (enter target below current funded to exclude lowest-merit Stage 3 programmes). All trade-off decisions are logged.

**v5.6 Revert**: Per-ExCo "Revert" button (red outline) appears when a leader has stage-3/4 overrides — click to return those programmes to automatic. "Reset all trade-offs" now also clears all stage-3/4 programme overrides (previously only cleared pending input values).

## Source data fields extracted

The engine extracts 26 fields from the source workbook including fields added across v4.5-v5.2: lfrYear (col K: LFR & Compliancy Year), lfrName (col L: LFR & Compliancy Name), baselined (col P: Carry Over Baselined). v5.2 adds: exco, benefitClass, benefitClassLabel, benefitFlag. These enable the evidence-gated classification.
