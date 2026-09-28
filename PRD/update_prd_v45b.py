"""Update PRD v4.5b: remove scenario types, set tolerance 0%, add finance calcs,
update Section 5 prioritization methodology, update presets."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('C:/Users/320126040/Documents/Codex/AOP2027/PRD/create_prd_v45b.py', 'r', encoding='utf-8') as f:
    src = f.read()
print(f"Read: {len(src)} chars")

ok = 0; fail = 0
def P(old, new, label):
    global src, ok, fail
    if old in src:
        src = src.replace(old, new, 1)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ============================================================
# 1. Version
# ============================================================
P("'Version 4.5b | 22 September 2026 | Eligible-Bucket Classification + Textual Benefit Scoring'",
  "'Version 4.5b Updated | 23 September 2026 | Final Prioritization Methodology + Finance Model'",
  "Version")
P("AOP2027-OnePortfolio-PRD-v4.5b.docx", "AOP2027-OnePortfolio-PRD-v4.5b_Updated.docx", "Output filename")
P('print(f"PRD v4.5b saved to {OUT}")', 'print(f"PRD v4.5b Updated saved to {OUT}")', "Print")

# ============================================================
# 2. Remove scenario types section
# ============================================================
print("\n=== Remove scenario types ===")

# Remove the Three Scenario Types subsection
OLD_SCENARIO_TYPES = """h3(doc, 'Three Scenario Types')
p(doc, 'Default (Vanilla) Scenario:', True)
b(doc, 'Fully data-backed. No manual manipulation. Uses the agreed prioritisation formulae applied to source data.')
b(doc, 'Funding order: (1) 100% of Prioritised LFRs with P1/P2 classification AND compliance name AND compliance year. Then full funding of CCBs for ISC, Finance and Group Functions.')
b(doc, '(2) True Carryovers: only carry-overs with Carry Over Baselined > 0. Funding amount = min(Requested, Baselined). Must be Must Do or Must Have.')
b(doc, '(3) Sustain and Hygiene: merit-based comparison. Not auto-100%. GRC/IR programmes with "Change & Sustain" category included. Hygiene ranked by merit score.')
b(doc, '(4) Value Based: remaining capacity. Selection by benefit realisation, strategic value, enterprise impact.')
b(doc, 'This scenario represents what the data says, independent of any leader\\'s preference.')

p(doc, 'Leadership Scenario:', True)
b(doc, 'Starts from the Default scenario.')
b(doc, 'BU leaders and Global Portfolio Leaders make manual adjustments in Enterprise Wide and BU Led.')
b(doc, 'Each adjustment is logged with rationale and accountable leader.')
b(doc, 'Represents desired portfolio outcomes per BU/Function.')
b(doc, 'Multiple Leadership scenarios can exist (one per review session).')

p(doc, 'Conference Scenario:', True)
b(doc, 'Consolidated scenario combining Default model outputs, BU leader feedback and enterprise trade-off discussions.')
b(doc, 'Created by forking the Leadership scenario and resolving conflicts.')
b(doc, 'This becomes the final agreed AOP position after sign-off.')"""

if OLD_SCENARIO_TYPES in src:
    src = src.replace(OLD_SCENARIO_TYPES, "", 1)
    ok += 1; print("  [OK] Removed Three Scenario Types section")
else:
    fail += 1; print("  [FAIL] Scenario types section not found")

# Remove OC-10 from OC register
P("['OC-10', 'Three scenario types (Default/Leadership/Conference)', '4.2 Sec 2', 'To be built', 'OC-02'],",
  "",
  "Remove OC-10 from register")

# Remove the highlight box referencing scenario types
P("highlight_box(doc, 'New Four-Priority Funding Structure + Three Scenario Types',\n    'The funding lever structure has been redesigned to a four-priority model with three scenario types. '\n    'The current engine uses the v3.5 five-stage logic and must be rebuilt.\\n\\n'\n    'STATUS: Outstanding change (OC-02, OC-10). Engine, scoring, presets, Gate cards and all tables must be updated.')",
  "p(doc, 'The funding lever structure uses a four-priority model with eligible-only buckets. Tolerance is set to 0% (exact budget adherence, no overshoot). The engine funds whole programmes in priority order within the Total AOP envelope.')",
  "Replace scenario highlight with tolerance note")

# ============================================================
# 3. Set tolerance to 0% in all references
# ============================================================
print("\n=== Tolerance 0% ===")
P("5.0% portfolio tolerance", "0% portfolio tolerance (exact budget adherence)", "Tolerance text 1")
P("5.0% tolerance", "0% tolerance", "Tolerance text 2")

# ============================================================
# 4. Replace Section 5 with detailed prioritization methodology
# ============================================================
print("\n=== Section 5: Detailed Prioritization ===")

OLD_S5_TABLE = """tbl(doc,
    ['Priority', 'Classification Rule', 'Sort Order', 'Funding Control'],
    [
        ['P1: Legal, Fiscal & Regulatory', 'Overall AOP decision contains P1 Immediate or P2 Scheduled; or source ID is EW-11, EW-65, EW-71. Evidence: quantified benefits, fines, disruption risks.', 'P1 before P2, then CCB exceptions. Within tier: LFR evidence preference, then merit.', 'Directional budget lever (default 15 M\\u20ac).'],
        ['P2: High-Value Carry-Overs', 'Source New/Carry-over is "Carry Over", excluding decommissioning. Must have data-backed evidence (benefit, payback or impact).', 'Benefit/cost ratio desc \\u2192 payback presence \\u2192 consequence \\u2192 merit.', 'Directional budget lever (default 50 M\\u20ac).'],
        ['P3: Change & Sustaining', 'Sustain: source equals "Change & Sustain". Hygiene: category is Continuous Improvement or Upgrades & Enhancements. Small modifications <250K\\u20ac, tech debt.', 'Sustain funded first (merit desc), then Hygiene (merit desc).', 'Directional budget lever (default 20 M\\u20ac).'],
        ['P4: Business & Function New', 'All remaining demand including decommissioning, AI, new initiatives.', 'Evidence strength first, then merit desc.', 'Automatic residual.'],
    ])"""

NEW_S5_TABLE = """p(doc, 'The engine classifies every programme into exactly one priority using deterministic rules evaluated in order. A programme matches the first rule that applies.', False)

tbl(doc,
    ['Priority', 'Classification Gate', 'Source Fields Evaluated', 'Eligible If', 'Ineligible Action'],
    [
        ['P1: Legal and Compliance (Must Do)', 'CCB Exception', 'Item No.', 'Source ID is EW-11, EW-65 or EW-71', 'N/A (always eligible)'],
        ['P1: Legal and Compliance (Must Do)', 'LFR Evidence Gate', 'Overall AOP Decision + LFR & Compliancy (Name) + LFR & Compliancy Year', 'Decision matches must-do P1/P2 AND Name is non-empty AND Year is non-empty', 'Classified to P4 (missing evidence)'],
        ['P2: High-Value Carry-Overs', 'True Carryover Gate', 'New/Carry-over + Category + Carry Over Baselined + Priority', 'Carry Over AND not Decomm/Replatforming AND Baselined > 0 AND (Must Do OR Must Have)', 'Classified to P4 (no business case)'],
        ['P3: Sustain Engineering and Hygiene', 'Sustain', 'New/Carry-over', 'Value = "Change & Sustain"', 'Falls to next rule'],
        ['P3: Sustain Engineering and Hygiene', 'Hygiene', 'Category', 'Continuous Improvement OR Upgrades & Enhancements', 'Falls to next rule'],
        ['P4: Value Based Portfolio', 'Default (catch-all)', 'None required', 'All programmes not matching any rule above', 'N/A'],
    ])

p(doc, '')
p(doc, 'Funding order within each priority:', True)
tbl(doc,
    ['Priority', 'Sort Order', 'Funding Mechanism', 'Lever Control'],
    [
        ['P1', 'P1 Immediate (with evidence) \\u2192 P2 Scheduled (with evidence) \\u2192 CCB exceptions. Within each tier: programmes with LFR name + year preferred.', 'Whole programmes funded in sort order until lever cap reached.', 'Basis toggle: % of bucket demand, % of Total AOP, or M\\u20ac allocation.'],
        ['P2', 'Benefit/cost ratio descending \\u2192 merit score. Each programme capped at min(Requested, Baselined).', 'Whole programmes funded at capped amount. No separate budget lever \\u2014 uses remaining budget after P1.', 'RoI threshold slider (0x\\u20135x, 0.5 steps). At 0x all eligible qualify; higher threshold excludes low-return carry-overs.'],
        ['P3', 'Change & Sustain funded FIRST (all eligible, by merit). Then Hygiene (CI + Upgrades) ranked by merit.', 'Whole programmes funded in sort order until lever cap reached.', 'Basis toggle: % of bucket demand, % of Total AOP, or M\\u20ac allocation.'],
        ['P4', 'Evidence strength first (programmes with both benefit and impact text preferred), then merit score descending.', 'Whole programmes funded until budget exhausted.', 'Basis toggle: % of bucket demand, % of Total AOP, or M\\u20ac allocation.'],
    ])

p(doc, '')
p(doc, 'Tolerance: 0%. The engine funds whole programmes that fit exactly within each lever cap and the Total AOP envelope. No overshoot is permitted. Unfilled capacity passes to the next priority. Unused budget at the end of P4 remains as unspent planning envelope.')"""

P(OLD_S5_TABLE, NEW_S5_TABLE, "Section 5.1 — detailed classification + funding order tables")

# ============================================================
# 5. Update Section 5.4 Scenario Presets
# ============================================================
print("\n=== Section 5.4: Presets ===")

OLD_PRESETS = """h2(doc, '5.4 Scenario Presets')
tbl(doc,
    ['Preset', 'P1: LFR', 'P2: Carry-Overs', 'P3: Sustain+Hygiene', 'P4: Value', 'Use Case'],
    [
        ['Optimal Segmentation (Recommended)', '15 M\\u20ac', '50 M\\u20ac', '20 M\\u20ac', '15 M\\u20ac', 'Finance-recommended 100M spread.'],
        ['Protect Commitments', '20 M\\u20ac', '50 M\\u20ac', '23 M\\u20ac', '7 M\\u20ac', 'Maximise LFR and carry-over coverage.'],
        ['Tighten Carryover Evidence', '15 M\\u20ac', '40 M\\u20ac', '20 M\\u20ac', '25 M\\u20ac', 'Redirect from carry-overs to new value.'],
        ['Release Sustain Capacity', '15 M\\u20ac', '58 M\\u20ac', '12 M\\u20ac', '15 M\\u20ac', 'Reduce sustain, give more to carry-overs.'],
    ])"""

NEW_PRESETS = """h2(doc, '5.4 Scenario Presets')
p(doc, 'Four presets define different investment philosophies. Each is formula-driven from the source data, not hardcoded. All presets use 0% tolerance (exact budget, no overshoot).', False)

tbl(doc,
    ['Preset', 'P1: Legal', 'P2: Carry RoI', 'P3: Sustain+Hygiene', 'P4: Value', 'Formula Logic'],
    [
        ['Optimal Segmentation (Recommended)', '100% of bucket', '0x (all eligible)', '20 M\\u20ac allocation', '100% of bucket', 'Fund all evidenced LFRs + all baselined carry-overs + 20M sustain. Value gets the remainder. Target: fill 100M envelope.'],
        ['Protect Commitments', '100% of bucket', '2.0x RoI threshold', '100% of bucket', '10% of AOP', 'Same LFR coverage but tighten carry-over to 2x return. Full sustain coverage. Value capped at 10M.'],
        ['Tighten Carryover Evidence', '100% of bucket', '3.0x RoI threshold', '75% of bucket', '15% of AOP', 'Strictest carry-over evidence. Reduced sustain frees budget for value initiatives at 15M.'],
        ['Release Sustain Capacity', '44% of bucket', '0x (all eligible)', '75% of bucket', '20% of AOP', 'Reduce LFR to 44% and sustain to 75%. Freed budget flows to value portfolio at 20M for new investment.'],
    ])

p(doc, '')
p(doc, 'Formula definitions:', True)
b(doc, 'P1 "100% of bucket" = fund up to 100% of total P1-classified demand. At 44% = fund up to 44%.')
b(doc, 'P2 "0x" = no minimum RoI required (all baselined carry-overs qualify). At 2.0x = only carry-overs with benefit/cost \\u2265 2.0 qualify.')
b(doc, 'P3 "20 M\\u20ac allocation" = fixed cap of 20M. "100% of bucket" = fund up to total P3 demand. "75%" = fund up to 75%.')
b(doc, 'P4 "100% of bucket" = fund up to total P4 demand (budget-constrained). "10% of AOP" = cap at 10% of Total AOP (10M at 100M AOP).')
b(doc, 'Presets retain the entered Total AOP. Changing a preset does not reset manual programme decisions.')"""

P(OLD_PRESETS, NEW_PRESETS, "Section 5.4 — formula-based preset definitions")

# ============================================================
# 6. Add Finance Calculation detail for One Portfolio charge-outs
# ============================================================
print("\n=== Finance Charge-out Detail ===")

# Find the finance section and enhance it
AFTER_FINANCE_CHECKS = "b(doc, 'Check 6: Scenario settings, source version and rule version in the Excel export match the dashboard.')"

FINANCE_DETAIL = """

h2(doc, '8.6 Programme Charge-Out Calculation (One Portfolio)')
p(doc, 'The Organisation IT Cost Allocation table in One Portfolio shows each BU\\'s total IT charge. This section defines the exact calculation logic. All values are computed from the engine result, never hardcoded.')

h3(doc, '8.6.1 Programme Cost per Organisation')
p(doc, 'For each Organisation, the Programme Funded amount is computed as:', True)
b(doc, 'Sum of r.final for all programmes where r.org matches the Organisation name.')
b(doc, 'This includes programmes from both Enterprise Wide and BU Led streams.')
b(doc, 'Programmes with r.final = 0 (unfunded, excluded, or held) contribute zero.')
b(doc, 'Partial-scope programmes contribute their manually set amount (r.final < r.cost).')
b(doc, 'The sum across all Organisations equals the total Programme AOP (result.totals.allocation).')

h3(doc, '8.6.2 Operations Cost per Organisation')
p(doc, 'Operations costs are mapped from the Bill of IT TCO hierarchy using a 14-entry Organisation-to-TCO mapping table embedded in the dashboard. For each programme Organisation:', True)
b(doc, 'Look up the matching TCO entry (e.g., "Precision Diagnosis - MR" \\u2192 "MR" \\u2192 38.0 M\\u20ac).')
b(doc, 'Own Consumption, Region allocation and Function allocation are shown separately.')
b(doc, 'Functions, Regions and corporate departments have zero direct TCO (their costs are allocated into BU charges).')
b(doc, 'Total Operations across all Organisations = 469.7 M\\u20ac (static, does not change with programme decisions).')

h3(doc, '8.6.3 Grand Total Reconciliation')
p(doc, 'For each Organisation row in the One Portfolio table:', True)
b(doc, 'Total IT Charge = Programme Funded (from engine) + Operations Cost (from TCO mapping).')
b(doc, 'Grand Total across all rows = Programme AOP (live from engine) + 469.7 M\\u20ac Operations.')
b(doc, 'This reconciliation updates live when any programme decision changes in Enterprise Wide or BU Led.')

h3(doc, '8.6.4 EW and BU Led Split')
p(doc, 'The dashboard tracks which stream (EW or BU Led) each programme belongs to. The split is:', True)
b(doc, 'EW Funded = sum of r.final where r.stream = "ew". This represents enterprise-wide programme investment.')
b(doc, 'BU Led Funded = sum of r.final where r.stream = "bu". This represents BU-specific programme investment.')
b(doc, 'EW + BU Led = Total Programme AOP (always reconciled).')
b(doc, 'The EW/BU split is shown as a KPI in both Program AOP Scenarios and One Portfolio.')

h3(doc, '8.6.5 Include/Exclude Impact')
p(doc, 'When a user includes or excludes a programme in Enterprise Wide or BU Led:', True)
b(doc, 'Include (checkbox ticked): r.final = r.cost (full request). The programme\\'s cost is added to its Organisation\\'s Programme Funded total.')
b(doc, 'Exclude (checkbox unticked): r.final = 0. The programme contributes zero. The freed budget may flow to other programmes in the same or lower priority.')
b(doc, 'Partial scope (amount input): r.final = manually entered amount between 0 and r.cost. Contributes the partial amount.')
b(doc, 'Every change is logged in the decision log with timestamp, programme ID, old value, new value and optional business note.')
b(doc, 'The One Portfolio table, KPIs, funding bar and all downstream views update immediately.')
"""

P(AFTER_FINANCE_CHECKS, AFTER_FINANCE_CHECKS + FINANCE_DETAIL, "Section 8.6 — Finance charge-out detail")

# ============================================================
# 7. Update OC register
# ============================================================
print("\n=== OC Register ===")
P("'OC-02', 'Four-priority with eligible-only buckets', '4.2, 5.1, App A', 'BUILT v4.5', 'None'",
  "'OC-02', 'Four-priority with eligible-only buckets + 0% tolerance', '4.2, 5.1, App A', 'BUILT v4.5', 'None'",
  "OC-02 — add tolerance note")

# ============================================================
# WRITE + RUN
# ============================================================
print(f"\nApplied: {ok}, Failed: {fail}")
OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/PRD/create_prd_v45b_updated.py'
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(src)
print(f"Script saved: {OUT}")
