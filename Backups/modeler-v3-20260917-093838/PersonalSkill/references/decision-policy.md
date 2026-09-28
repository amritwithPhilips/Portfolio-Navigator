# Decision policy | 3.2.0 | 17 September 2026

## Stage order

1. **Legal and Compliance (Must Do)** protects work required to meet a legal, fiscal, regulatory or compliance obligation. Use recorded Overall AOP decision P1 Immediate, P2 Scheduled, then approved source-ID exceptions EW-11 Group Functions, EW-65 Supply Chain and EW-71 Finance. Use their refreshed source amounts, never hardcoded values. P1 precedes P2, then exceptions.
2. **Sustain Engineering** is explicitly submitted platform change and sustain demand. Source New initiative or Carry-over must equal Change & Sustain after case/whitespace normalisation. Do not include other small requests by amount or name.
3. **Hygiene** is Continuous Improvement and Upgrades & Enhancements. Accepted aliases include Continous Improvement and Continuous Improvement (CI). Decommissioning is excluded.
4. **Carryover** is remaining explicit Carry Over demand, excluding decommissioning/replatforming. It must qualify within this stage and cannot evade its threshold by moving into Value.
5. **Value Based Portfolio** receives remaining capacity and includes decommissioning/replatforming, including carried-over decommissioning, after mandatory and Sustain precedence. AI belongs here unless an earlier stage applies.

Gate 0 checks every request's evidence; it has no funding. Every record belongs to exactly one stage even if not eligible.

## Eligibility and score

Missing name, nonpositive/missing request, unresolved mandatory priority or unknown Overall AOP decision holds automatic funding. Blank decision fields stay Unassessed and do not alone invent eligibility or adverse decisions. Contain requires a source/reviewed condition for discretionary allocation. Validated mandatory obligations retain their priority with a visible unresolved-condition warning.

Carryover and Value need a finite numeric Quantified Benefits value. Whole-cell unambiguous numeric text is accepted; prose containing a number is not. Zero differs from missing. Negative benefits require review. Benefit multiple = submitted benefit / original requested amount, not manually funded amount. Claims above 5.0x require inline evidence review. Do not annualise, cash-convert or scale benefits with partial scope.

Default merit maxima are 50.0 Benefit, 25.0 Submitted Priority, 15.0 Captured Consequence, 10.0 Decision Band. Benefit tiers: below 1.0x = 0.0; at least 1.0x = 20.0; 2.0x = 30.0; 3.0x = 40.0; 5.0x = 50.0. Submitted Must Do = 25.0, Must Have = 18.0, Deprioritised = 5.0, blank/unrecognised = 0.0. Healthy = 10.0, Contain = 6.0, blank/other = 0.0.

Captured Consequence uses only Impact and Cost of Not Doing, Problem Statement and Scope. No evidence = 0.0; contextual evidence = 5.0; explicit harm plus affected activity/stakeholder = 10.0; that evidence plus quantified impact or enterprise reach = 15.0. The engine uses conservative deterministic text signals; label them management interpretation and retain passages. A reviewed tier needs source evidence and an inline rationale. Keyword occurrence alone is not confirmed business impact.

Advanced weights are nonnegative and total 100.0. Each component is base points/default maximum × configured weight. Value floor defaults to 45.0, advanced only. Carryover uses a default 2.0x threshold, adjustable 1.0x–5.0x in 0.5x increments; last position is 5.0x+. Carryover does not use the merit floor.

## Funding controls and arithmetic

First three stages have switchable % of bucket demand / % of Total AOP tabs, slider and numeric entry. Target = min(bucket demand, basis × percentage). Preserve percentage when changing basis. Default settings: illustrative 100.0 M€ envelope, Legal and Sustain 100.0% of bucket, Hygiene 10.0% of Total AOP, Carryover 2.0x, merit floor 45.0 and 5.0% tolerance. No source-approved envelope is supplied.

Select whole initiatives in priority order. First-three stage limit is target × (1 + tolerance), capped by demand. Portfolio limit is Total AOP × (1 + tolerance), applied once, never compounded. Skip a request that cannot fit and test the next row. Unused capacity is allowed; tolerance is not a minimum spend. Carryover then Value use residual automatic capacity.

Legal tier ties use merit, benefit multiple, submitted priority, stable ID. Sustain/Hygiene/Value use merit then the same ties. Carryover uses benefit multiple, merit, submitted priority, ID. Null ratios sort last.

Three presets: Protect commitments (defaults), Tighten carryover evidence (3.0x), Release sustain capacity (75.0% Sustain bucket). Retain entered Total AOP and manual overrides when changing preset. Mark Custom after edits. Preset comparison excludes manual decisions and uses the same source and envelope.

## Shared scenario state

One shared scenario contains source/version, settings, reviews, overrides and event history. Automatic results are computed first; apply manual overrides afterwards. Include means full request, Exclude means zero, amount edit is a manual scope between zero and source request. Additions do not displace; exclusions do not refill. Preserve and show overspend beyond 5.0%.

Enterprise Wide and BU Led are independently editable views of the same portfolio. There is no conference completion, checkpoint, unlock or reconfirmation dependency in prioritisation or validation. A decision in either tab updates AOP Scenarios, both portfolio tabs and Overview immediately. Finalise from read-only Overview. A finalised financial state is immutable; fork it to create a new draft. Manual edits and reviews are automatically logged; only a program-name click opens a read-only popup.

Changed-source overrides are held pending inline review; unchanged stable-ID decisions migrate. Pending migrated overrides block finalisation until they are reconfirmed or discarded. Source business gaps remain visible and may be explicitly accepted in portfolio decisions. Finalisation records acceptance of displayed variance and exceptions, not validation of missing evidence.

## Current verified demand baseline

Exact M€: Legal 34.517; Sustain 12.333; Hygiene 34.902; Carryover 97.375; Value 100.468; total 279.595. Display upward: 34.6, 12.4, 35.0, 97.4, 100.5; total 279.6. Rounded stage values need not sum to rounded total. These figures are fixtures for source hash 4ca3c6d42959, not constants for future imports.
