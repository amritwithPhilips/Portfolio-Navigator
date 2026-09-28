"""Create PRD v4.4 with restructured priorities and detailed sections."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn

def shade(cell, color):
    tc = cell._element.get_or_add_tcPr()
    tc.append(tc.makeelement(qn('w:shd'), {qn('w:fill'): color, qn('w:val'): 'clear'}))

def tbl(doc, hdrs, rows):
    t = doc.add_table(rows=1+len(rows), cols=len(hdrs))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, h in enumerate(hdrs):
        c = t.rows[0].cells[i]; c.text = h
        for r in c.paragraphs[0].runs: r.bold = True; r.font.color.rgb = RGBColor(255,255,255); r.font.size = Pt(9)
        shade(c, '00126E')
    for ri, row in enumerate(rows):
        for ci, v in enumerate(row):
            c = t.rows[ri+1].cells[ci]; c.text = str(v)
            for p in c.paragraphs:
                for r in p.runs: r.font.size = Pt(9)
    return t

def h1(d, t): d.add_heading(t, level=1)
def h2(d, t): d.add_heading(t, level=2)
def h3(d, t): d.add_heading(t, level=3)
def p(d, t, b=False):
    para = d.add_paragraph(t)
    if b:
        for r in para.runs: r.bold = True
    return para
def b(d, t): d.add_paragraph(t, style='List Bullet')

def highlight_box(d, title, text):
    """Add a highlighted outstanding change box."""
    para = d.add_paragraph()
    run = para.add_run(f'\u26a0 OUTSTANDING CHANGE: {title}')
    run.bold = True
    run.font.color.rgb = RGBColor(180, 80, 0)
    run.font.size = Pt(10)
    para2 = d.add_paragraph(text)
    para2.runs[0].font.color.rgb = RGBColor(120, 80, 0) if para2.runs else None
    para2.runs[0].font.size = Pt(9) if para2.runs else None

def placeholder_box(d, title, text):
    """Add a placeholder for pending discussion."""
    para = d.add_paragraph()
    run = para.add_run(f'\u2709 PENDING: {title}')
    run.bold = True
    run.font.color.rgb = RGBColor(0, 80, 160)
    run.font.size = Pt(10)
    para2 = d.add_paragraph(text)
    if para2.runs:
        para2.runs[0].font.color.rgb = RGBColor(0, 60, 120)
        para2.runs[0].font.size = Pt(9)

print("Creating PRD v4.5b...")
doc = Document()
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10)

doc.add_heading('AOP 2027 One Portfolio Dashboard', level=0)
doc.add_heading('Product Requirements Document', level=0)
p(doc, 'Version 4.5b | 22 September 2026 | Eligible-Bucket Classification + Textual Benefit Scoring')
p(doc, '')
p(doc, 'The One Portfolio Dashboard brings together IT Programme demand prioritisation and Operations cost allocation into one decision tool for AOP 2027 planning. This version incorporates the agreed four-priority funding structure, three scenario types (Default, Leadership, Conference), stricter evidence requirements for LFR and Carryover classification, merit score transparency, and the Operations cost-of-ownership model. Leadership sets the funding position in Program AOP Scenarios. Enterprise Wide and BU Led independently refine programme selections. One Portfolio brings everything together, showing each Organisation what they will be charged across Programme and Operations spend.')

h1(doc, 'Document Navigation')
p(doc, 'Sections in this document:')
tbl(doc,
    ['#', 'Section', 'Key Content'],
    [
        ['1', 'Product Outcome', 'Measurable outcomes and evidence'],
        ['2', 'Users and Decisions', 'Stakeholders and their decisions'],
        ['3', 'Navigation and Workflow', 'Six-tab workflow, cross-tab data flow'],
        ['4', 'Per-Tab Specification', 'Detailed spec for all 6 tabs'],
        ['5', 'Prioritisation Engine', 'Four-priority classification, levers, funding order'],
        ['6', 'Operations Data Model', 'Bill of IT, TCO allocation'],
        ['7', 'Design Specification', 'Colors, fonts, layout'],
        ['8', 'Finance Calculation Model', 'Charge-out types, reconciliation'],
        ['9', 'Open Questions', 'Conference decisions needed'],
        ['10', 'Release Acceptance', 'QA criteria'],
        ['11', 'Outstanding Changes', 'OC register with status'],
        ['A', 'Appendix A', 'Demand Classification Logic (rules + catch-all)'],
        ['B', 'Appendix B', 'Quantified Benefit Textual Scoring recommendation'],
    ])
p(doc, '')

# ═══════════════════════════════════════════════
# SECTION 1: PRODUCT OUTCOME
# ═══════════════════════════════════════════════
h1(doc, '1. Product Outcome')
tbl(doc,
    ['Outcome', 'Evidence of Completion'],
    [
        ['One Portfolio view', 'Programme funding and Operations TCO shown side by side at Organisation level in One Portfolio. Grand Total reconciles to 469.7 M\u20ac Operations + funded Programme AOP.'],
        ['Four-priority data-backed portfolio', 'Default scenario: fully data-backed, no manual manipulation. Strict evidence gates for LFR (compliance name + year) and Carryover (baselined business case). Ranked backlog with cost-of-not-doing.'],
        ['Three scenario types', 'Default (Vanilla): data-backed only. Leadership: captures BU preferences. Conference: consolidated final position. Clear lineage from data to decision.'],
        ['Operations transparency', 'Three-level drill-down: BU Cluster \u2192 Sub-Organisation \u2192 Services Opted In, with AOP2027 cost per service from the Bill of IT.'],
        ['Evidence-driven scoring', 'Merit scoring includes Qualitative Benefits and Payback Period. Validation runs on every data refresh to confirm scoring integrity.'],
        ['Conference readiness', 'Organisation-level allocation table in One Portfolio shows each BU leader their total IT charge (Programme funded + Operations TCO).'],
    ])

# ═══════════════════════════════════════════════
# SECTION 2: USERS
# ═══════════════════════════════════════════════
h1(doc, '2. Users and Decisions')
tbl(doc,
    ['User', 'Decision Supported'],
    [
        ['CIO and IT Leadership', 'Set the Total AOP envelope, compare funding scenarios using four priority levers, accept the final portfolio position and variance.'],
        ['BU Representatives', 'Review their Organisation\u2019s Programme demand in BU Led, include or exclude programmes, record prioritised amounts.'],
        ['Global Portfolio Leaders', 'Review Enterprise-Wide demand for their Function in Enterprise Wide, confirm priorities and committed impact.'],
        ['Finance', 'Reconcile Programme demand, Operations TCO, scenario funding and the approved envelope. Validate BU-level charge-outs for Type 1, Type 2, Type 3 and Operations.'],
        ['IT Portfolio and PMO', 'Prepare source data, maintain rule versions, resolve evidence gaps, publish scenario exports.'],
    ])

# ═══════════════════════════════════════════════
# SECTION 3: NAVIGATION AND WORKFLOW
# ═══════════════════════════════════════════════
h1(doc, '3. Navigation and End-to-End Workflow')

h2(doc, '3.1 Visual Workflow')
p(doc, 'The dashboard follows a six-step workflow. Each step corresponds to a tab. The steps are connected through a shared scenario but independently accessible.')
p(doc, '')
p(doc, '  [1. Demand Overview] \u2192 [2. Program AOP Scenarios] \u2192 [3. Enterprise Wide] \u2192 [4. BU Led] \u2192 [5. Operations] \u2192 [6. One Portfolio]')

h2(doc, '3.2 Tab Structure')
tbl(doc,
    ['#', 'Tab Name', 'Purpose', 'Editable'],
    [
        ['1', 'Demand Overview', 'Read-only executive summary of Programme demand, Operations demand and data quality.', 'No'],
        ['2', 'Program AOP Scenarios', 'Set the 100 M\u20ac envelope, adjust four priority levers, compare presets. View funded and unfunded demand.', 'Yes \u2014 levers and presets'],
        ['3', 'Enterprise Wide', 'Review and edit Enterprise-Wide programme selections. Inline include/exclude and amount changes.', 'Yes \u2014 programme decisions'],
        ['4', 'BU Led', 'Review and edit BU-Led programme selections. Same editing capability as Enterprise Wide.', 'Yes \u2014 programme decisions'],
        ['5', 'Operations', 'Review pre-aligned Operations cost-of-ownership. Three-level drill-down to individual services.', 'No \u2014 pre-aligned'],
        ['6', 'One Portfolio', 'Combined Programme + Operations view. Organisation-level BU charge allocation. Finalise the portfolio.', 'No \u2014 finalise only'],
    ])

h2(doc, '3.3 End-to-End Decision Flow')
p(doc, 'The following describes the complete decision journey from demand assessment to final portfolio sign-off.')

p(doc, 'Step 1: Assess the demand landscape', True)
p(doc, 'Open Demand Overview. Review the total Programme demand (521 programmes, 280.2 M\u20ac) against the 100 M\u20ac envelope. Review Operations demand (469.7 M\u20ac, pre-aligned). Identify data quality gaps: Payback Period and Qualitative/Quantitative Benefits are due by 24 September. Examine the Demand Split by Organisation table to understand which Organisations carry the largest combined IT demand.')

p(doc, 'Step 2: Set the funding position', True)
p(doc, 'Move to Program AOP Scenarios. Confirm the Total AOP envelope (default 100 M\u20ac). Select a scenario preset or adjust the four priority levers: (1) Legal, Fiscal and Regulatory requirements, (2) High-Value Carry-Overs, (3) Change and Sustaining Engineering, (4) Business and Function New Initiatives. The engine recalculates the entire portfolio in real time. Review the Funding Prioritization Gate to understand how demand flows through each priority level. Check the Merit Score Framework if scoring weights need adjustment.')

p(doc, 'Step 3: Review Enterprise-Wide programmes', True)
p(doc, 'Move to Enterprise Wide. The Global Portfolio Leader for each Function reviews their Organisation\u2019s programmes. Use the Organisation and Platform filters to narrow the view. Review the bubble chart to identify programmes with strong merit but insufficient funding, or programmes with weak evidence that received automatic funding. Include or exclude programmes using inline checkboxes. Adjust prioritised amounts where partial scope is appropriate. Every change updates Program AOP Scenarios, BU Led and One Portfolio immediately.')

p(doc, 'Step 4: Review BU-Led programmes', True)
p(doc, 'Move to BU Led. The BU Representative for each Business reviews their programmes. The same editing capability applies. Changes made here do not override Enterprise-Wide decisions \u2014 both streams contribute to the same portfolio. If a BU Representative includes a programme that pushes the portfolio over budget, the variance is shown explicitly and must be accepted at finalisation.')

p(doc, 'Step 5: Confirm Operations allocations', True)
p(doc, 'Move to Operations. This tab is read-only because Operations costs are pre-aligned. Review the three-level TCO hierarchy to confirm each Organisation\u2019s cost structure: BU Own Consumption, Region allocation and Function allocation. Expand sub-organisations to see individual services opted in. Use the Service Catalog to verify specific service costs and platform assignments.')

p(doc, 'Step 6: Finalise the One Portfolio', True)
p(doc, 'Move to One Portfolio. Review the five header KPIs: Total IT AOP, Operations AOP, Prioritised Programme AOP, Split of Programme AOP and Committed Benefit. These update live from the current scenario. Review the Organisation IT Cost Allocation table to confirm what each BU will be charged (Programme funded + Operations TCO). The bubble chart shows only funded programmes. When the portfolio position is agreed, click Finalise to freeze the scenario revision. A finalised scenario cannot be edited \u2014 fork it to create a new working draft.')

p(doc, 'At any point, the user can return to any earlier tab without losing work. The shared scenario preserves all decisions, filter states are local to each tab, and every change is logged with timestamp, user action and affected programme.')

h2(doc, '3.4 Cross-Tab Data Flow')
p(doc, 'One shared scenario drives all tabs. When a user changes a lever in Program AOP Scenarios or edits a programme in Enterprise Wide or BU Led, the AOP engine recalculates the entire portfolio. The cascade is:')
b(doc, 'Program AOP Scenarios: KPIs, fund bar and demand tables recalculate.')
b(doc, 'Enterprise Wide and BU Led: Stream totals, bubble chart and table reflect the new portfolio position.')
b(doc, 'Demand Overview: Programme demand totals update. Operations data remains static.')
b(doc, 'One Portfolio: KPI tiles, allocation table and funded-only bubble chart update.')
b(doc, 'Operations: Unaffected. Operations costs are pre-aligned and do not change with Programme decisions.')
p(doc, '')
p(doc, 'Filters are local to each tab. Applying a filter in Enterprise Wide does not affect BU Led or any other tab. Filters change what is displayed; they never change funding.')

# ═══════════════════════════════════════════════
# SECTION 4: PER-TAB SPECIFICATION
# ═══════════════════════════════════════════════
h1(doc, '4. Per-Tab Detailed Specification')

# ── Tab 1: Demand Overview ──
h2(doc, '4.1 Demand Overview')
p(doc, 'A read-only executive summary showing the full demand landscape before any prioritisation decisions.')

h3(doc, 'Section 1: Executive Cards (three-column grid)')
p(doc, 'Programme Demand Overview card:', True)
b(doc, 'Total Programme Demand: 521 programmes, 280.2 M\u20ac.')
b(doc, 'Enterprise Wide: 180 programmes, 111.7 M\u20ac.')
b(doc, 'BU Led: 341 programmes, 168.5 M\u20ac.')
b(doc, 'Committed Impact (Proposed): Shows total quantified benefits of funded programmes, split by BU Led and EW.')

p(doc, 'Operations Overview (Pre-aligned) card:', True)
b(doc, 'Total Operations Demand: 167 services, 469.7 M\u20ac.')
b(doc, '2026 Run-Rate: 470.7 M\u20ac.')
b(doc, 'Cost breakdown grid: BU Own Consumption 317.6 M\u20ac, From Regions 63.5 M\u20ac, From Functions 88.5 M\u20ac, Total 469.7 M\u20ac.')

p(doc, 'Data Quality card:', True)
b(doc, 'Programmes with Benefits: count out of total.')
b(doc, 'Programmes with Impact: count out of total.')
b(doc, 'Payback Period: TBD, due 24 September.')
b(doc, 'Qualitative Benefits: TBD.')
b(doc, 'Quantitative Benefits: TBD.')

placeholder_box(doc, 'Data Quality Governance (Discussion with Byronie)',
    'Recommendations for the data quality governance framework:\n'
    '1. Define ownership: which team is accountable for collecting Payback Period, Qualitative Benefits and Quantitative Benefits evidence for each programme.\n'
    '2. Define validation rules: automated checks on benefit claims (e.g., benefit/cost ratio above 5.0x triggers review, missing payback blocks automatic funding).\n'
    '3. Define escalation path: how gaps are reported to programme owners and what happens if the 24 September deadline is missed.\n'
    '4. Define refresh cadence: how often the data quality card updates after new evidence is submitted.\n'
    '5. Consider adding a data quality score per Organisation to track evidence completeness.\n\n'
    'Final context to be added after discussion with Byronie. The Data Quality card currently shows aggregate counts; a per-Organisation breakdown may be warranted depending on the governance model agreed.')

h3(doc, 'Section 2: Demand Split by Organisation')
p(doc, 'A filterable, sortable table showing each Organisation\u2019s Programme demand alongside its Operations cost.')
b(doc, 'Columns: Organisation, Programme Demand (Count), Programme Demand M\u20ac, Operations Cost M\u20ac, Total IT Demand M\u20ac.')
b(doc, 'Filters: Organisation (checkbox multi-select), Platform (checkbox multi-select). Counts update dynamically when cross-filtering.')
b(doc, 'Sort: Programme Demand, Operations Cost, Total IT \u2014 each High-to-Low and Low-to-High.')
b(doc, 'Clear All button resets all filters.')

highlight_box(doc, 'Dynamic Total Row with Filter Context',
    'When no filters are applied, the total row shows: 521 programmes | 280.2 M\u20ac | 469.7 M\u20ac | 749.9 M\u20ac.\n'
    'When filters are applied, the total row should show: X/521 programmes | YY.Y of 280.2 M\u20ac | ZZ.Z of 469.7 M\u20ac | total.\n'
    'This gives the user immediate context of what fraction of the full demand they are viewing. '
    'The denominator (521, 280.2, 469.7) remains visible as the reference baseline.\n\n'
    'STATUS: Outstanding change. Current implementation updates the total but does not show the "X of Y" format.')

h3(doc, 'Section 3: High-Level Insights')
p(doc, 'Three-column table: Insight, Detail, Implication. Covers Total IT Budget, Demand vs Envelope oversubscription, and Evidence Gaps.')

h3(doc, 'Section 4: LFR Demand Breakdown')
p(doc, 'A sub-table showing the composition of the total LFR demand bucket:')
b(doc, 'Total LFR Demand: sum of all programmes classified as Legal, Fiscal and Regulatory.')
b(doc, 'P1 Immediate: demand from programmes with P1 classification and compliance name and year.')
b(doc, 'P2 Scheduled: demand from programmes with P2 classification and compliance name and year.')
b(doc, 'CCB Demand: demand from the three CCB exceptions (EW-11 Group Functions, EW-65 ISC, EW-71 Finance).')
b(doc, 'LFRs without evidence: demand from programmes classified as LFR but missing compliance name or year. These are held outside automatic funding in the Default scenario.')

highlight_box(doc, 'LFR Sub-Bucket View',
    'The Demand Overview should show a breakdown of the total LFR bucket into P1, P2, CCB and evidence-gap sub-categories. '
    'This allows leadership to see exactly what proportion of LFR demand meets the minimum evidence threshold.\n\n'
    'STATUS: Outstanding change (OC-12).')

h3(doc, 'Section 5: True Carryover Baseline View')
p(doc, 'A table showing carry-over programmes with their business case baseline:')
b(doc, 'Carry Over Baselined: the confirmed demand amount from the AOP2026 (or earlier) business case.')
b(doc, 'Requested 2027: the amount requested for AOP2027.')
b(doc, 'Variance: Requested minus Baselined. Positive variance indicates the programme is requesting more than the original business case. These are flagged for validation.')
b(doc, 'Funding amount: min(Requested, Baselined). If the programme requests less than baselined, the lower amount is used. If it requests more, the cap is the baselined amount.')
b(doc, 'Must Do / Must Have: only carry-overs marked as Must Do or Must Have in the Priority field qualify as True Carryovers. Others move to Priority 4 (Value Based).')

highlight_box(doc, 'True Carryover Baseline View',
    'A dedicated view in Demand Overview comparing baselined amounts with requested amounts for all carry-over programmes. '
    'Overstated requests (Requested > Baselined) are highlighted for leadership review.\n\n'
    'STATUS: Outstanding change (OC-14).')

# ── Tab 2: Program AOP Scenarios ──
h2(doc, '4.2 Program AOP Scenarios')
p(doc, 'The central prioritisation workspace. Sets the funding position for the 100 M\u20ac Programme AOP envelope using four priority levels.')

h3(doc, 'Section 1: Executive Position')
p(doc, 'Five KPI cards showing the current portfolio position:')
b(doc, 'Allocated AOP: Total amount funded across all four priorities.')
b(doc, 'Initiatives Funded: Count of programmes with a positive prioritised amount. Partial-scope count shown separately.')
b(doc, 'EW and BU Led Share: Percentage split of the final allocation between Enterprise Wide and BU Led streams.')
b(doc, 'Available AOP or Over-Budget Variance: Remaining envelope or explicit overspend amount.')
b(doc, 'Demand Left Unfunded: Total unfunded demand. Missing-request count shown separately.')
p(doc, '')
p(doc, 'Horizontal funding bar showing the four priority stages with their allocated amounts and stage colours.')

h3(doc, 'Section 2: Funding Levers \u2014 Four Priority Structure')

highlight_box(doc, 'New Four-Priority Funding Structure + Three Scenario Types',
    'The funding lever structure has been redesigned to a four-priority model with three scenario types. '
    'The current engine uses the v3.5 five-stage logic and must be rebuilt.\n\n'
    'STATUS: Outstanding change (OC-02, OC-10). Engine, scoring, presets, Gate cards and all tables must be updated.')

h3(doc, 'Three Scenario Types')
p(doc, 'Default (Vanilla) Scenario:', True)
b(doc, 'Fully data-backed. No manual manipulation. Uses the agreed prioritisation formulae applied to source data.')
b(doc, 'Funding order: (1) 100% of Prioritised LFRs with P1/P2 classification AND compliance name AND compliance year. Then full funding of CCBs for ISC, Finance and Group Functions.')
b(doc, '(2) True Carryovers: only carry-overs with Carry Over Baselined > 0. Funding amount = min(Requested, Baselined). Must be Must Do or Must Have.')
b(doc, '(3) Sustain and Hygiene: merit-based comparison. Not auto-100%. GRC/IR programmes with "Change & Sustain" category included. Hygiene ranked by merit score.')
b(doc, '(4) Value Based: remaining capacity. Selection by benefit realisation, strategic value, enterprise impact.')
b(doc, 'This scenario represents what the data says, independent of any leader’s preference.')

p(doc, 'Leadership Scenario:', True)
b(doc, 'Starts from the Default scenario.')
b(doc, 'BU leaders and Global Portfolio Leaders make manual adjustments in Enterprise Wide and BU Led.')
b(doc, 'Each adjustment is logged with rationale and accountable leader.')
b(doc, 'Represents desired portfolio outcomes per BU/Function.')
b(doc, 'Multiple Leadership scenarios can exist (one per review session).')

p(doc, 'Conference Scenario:', True)
b(doc, 'Consolidated scenario combining Default model outputs, BU leader feedback and enterprise trade-off discussions.')
b(doc, 'Created by forking the Leadership scenario and resolving conflicts.')
b(doc, 'This becomes the final agreed AOP position after sign-off.')

p(doc, 'The four priority levels, in strict funding order:', True)
p(doc, '')

p(doc, 'Priority 1: Legal, Fiscal and Regulatory Requirements', True)
p(doc, 'Demand supported with evidence: quantified benefits, potential fines, business disruption risks, regulatory deadlines and compliance obligations. This priority funds work that the organisation is legally required to deliver. P1 Immediate obligations are funded first, followed by P2 Scheduled, followed by the three CCB exceptions (EW-11 Group Functions, EW-65 Supply Chain, EW-71 Finance). Within each tier, programmes with specific LFR name and compliance year evidence receive stronger preference.')
p(doc, 'Funding control: Directional budget lever (e.g., 15 M\u20ac in the recommended scenario). The engine funds whole programmes in priority order until the budget cap is reached. Unfunded LFR programmes remain in the ranked backlog with their cost-of-not-doing visible.')

p(doc, 'Priority 2: 2026 High-Value Project Carry-Overs', True)
p(doc, 'Finish what we started, but only if the original business case is still solid and substantial. This priority funds carry-over programmes that have demonstrated return on the investment already committed. Programmes must show data-backed evidence: quantified benefits, payback period or substantive impact assessment. The engine ranks eligible carry-overs by benefit/cost ratio (highest first), then payback presence, then consequence evidence strength, then merit score. Programmes without evidence are held outside automatic selection.')
p(doc, 'Funding control: Directional budget lever (e.g., 50 M\u20ac in the recommended scenario).')

p(doc, 'Priority 3: Change and Sustaining Engineering', True)
p(doc, 'Allocation per Function for necessary small modifications (under 250K\u20ac), upgrades, continuous improvement and similar operational needs. This envelope includes IT hygienic initiatives and technical debt reduction. The engine funds full eligible Sustain demand first, then allocates the remaining budget to Hygiene programmes ranked by merit.')
p(doc, 'Funding control: Directional budget lever (e.g., 20 M\u20ac in the recommended scenario).')

p(doc, 'Priority 4: Business and Function New Initiatives', True)
p(doc, 'Value-based projects with strong business value and enterprise impact. This priority receives the remaining capacity after Priorities 1\u20133. Includes decommissioning/replatforming, AI enablement and all other discretionary demand. Ranked by evidence strength first (programmes with both benefit and impact evidence preferred), then merit score.')
p(doc, 'Funding control: Automatic residual allocation. No separate slider.')

p(doc, '')
p(doc, 'Changing any priority lever recalculates the entire portfolio. All funded/unfunded tables, KPIs, bubble charts and the One Portfolio view update immediately. The Funding Prioritization Gate cards in Section 3 reflect the recalculated position.')

h3(doc, 'Section 3: Funding Prioritization Gate')
p(doc, 'Five cards explaining the selection logic: Gate 0 (Evidence and Decision Check, no funding), then the four priority stages with their demand, target and allocation amounts. Gate 0 evaluates every request for identity, amount and recorded decision evidence. Each programme belongs to exactly one priority stage.')
p(doc, '')
p(doc, 'When the user changes a priority lever in Section 2, the Gate cards update their demand, target and allocation figures in real time. This provides immediate visual feedback on how budget shifts affect each priority level.')

h3(doc, 'Section 4: Merit Score Framework (collapsed by default)')
p(doc, 'The merit score determines the ranking of programmes within each priority stage. Each programme receives a score from 0 to 100 based on weighted components.')

tbl(doc,
    ['Component', 'Maximum', 'Current Scoring Tiers'],
    [
        ['Submitted Benefit', '50 points', 'Benefit/cost ratio: <1x = 0; \u22651x = 20; \u22652x = 30; \u22653x = 40; \u22655x = 50.'],
        ['Submitted Priority', '25 points', 'Must Do = 25; Must Have = 18; Deprioritised = 5; blank = 0.'],
        ['Captured Consequence', '15 points', 'No evidence = 0; contextual = 5; explicit harm + stakeholder = 10; quantified/enterprise = 15.'],
        ['Decision Band', '10 points', 'Healthy = 10; Contain = 6; blank/other = 0.'],
    ])

highlight_box(doc, 'Scoring Methodology Enhancement \u2014 Qualitative Benefits and Payback Period',
    'The current merit scoring uses four components. Two additional data points are due by 24 September 2026 and should be incorporated into the scoring methodology:\n\n'
    '1. QUALITATIVE BENEFITS: Programmes submitting qualitative benefit descriptions (strategic alignment, customer impact, employee experience, operational resilience) should receive additional scoring consideration. Recommended approach: add a Qualitative Benefit component (0\u201310 points) or weight it into the existing Captured Consequence component.\n\n'
    '2. PAYBACK PERIOD: Programmes with shorter payback periods represent faster return on investment. Recommended approach: add a Payback component (0\u201310 points) with tiers such as <1 year = 10, 1\u20132 years = 7, 2\u20133 years = 4, >3 years = 2, no data = 0.\n\n'
    '3. VALIDATION ON DATA REFRESH: Every data refresh must run a validation pass that:\n'
    '   a. Recalculates all merit scores from the refreshed source values.\n'
    '   b. Compares pre-refresh and post-refresh scores to identify material changes.\n'
    '   c. Flags programmes where the score changed by more than 10 points for manual review.\n'
    '   d. Ensures no programme has a score component that exceeds its defined maximum.\n'
    '   e. Confirms the four component weights still total 100.0.\n'
    '   f. Reports a validation summary before the refresh is applied.\n\n'
    'The updated scoring must be consistent across Program AOP Scenarios, Enterprise Wide and BU Led. '
    'All three tabs derive scores from the same engine; a change to the scoring formula must propagate uniformly.\n\n'
    'STATUS: Outstanding change to be built once Qualitative Benefit and Payback Period data is collected (deadline 24 Sep 2026). '
    'The scoring engine, merit display, filter by merit, and sort by merit must all be updated together.')

placeholder_box(doc, 'Scoring Governance (Discussion with Byronie)',
    'Pending discussion items:\n'
    '1. Should Qualitative Benefits be a new 5th component or folded into Captured Consequence?\n'
    '2. What Payback Period thresholds reflect the business\u2019s investment horizon?\n'
    '3. Should the component weights be rebalanced (currently 50/25/15/10) to accommodate new components?\n'
    '4. What validation tolerance is acceptable for score changes on data refresh (recommended: 10-point threshold)?\n'
    '5. Who approves changes to the scoring methodology?\n\n'
    'Final scoring model to be confirmed after discussion with Byronie.')

h3(doc, 'Sections 5\u20137: Demand Tables, Decision Log and Rules')

p(doc, 'Section 5: Demand Prioritized', True)
p(doc, 'This table shows all programmes that received funding in the current scenario. It opens by default with Organisation groups collapsed.')
b(doc, 'Population logic: The AOP engine calculates which programmes are funded based on the four priority levers and the Total AOP envelope. Every programme with a positive final amount appears in this table.')
b(doc, 'Grouping: Programmes are grouped by Organisation. Each Organisation summary row shows: child count, funded count, representative Decision Band, average merit score, summed requested amount, summed prioritised amount, summed unfunded residual, summed numeric benefits and evidence count.')
b(doc, 'Filters: Multi-select checkbox filters for Organisation (BUR), Platform and Priority (the four priority stages). Selected values combine with OR within a field, AND across fields.')
b(doc, 'Sort: The sort dropdown offers Benefit (High/Low), Merit Score (High/Low) and Investment Requested (High/Low). Sorting works within the filtered view.')
b(doc, 'Columns: Organisation/Programme, Decision Band, Score, Requested M\u20ac, Prioritised M\u20ac, Unfunded M\u20ac, Benefits M\u20ac, Evidence count, Funding Status / Demand Details.')
b(doc, 'Update trigger: This table recalculates whenever a lever changes in Section 2, or a programme is edited in Enterprise Wide or BU Led.')

p(doc, 'Column: Funding Status / Demand Details (used in Program AOP Scenarios, Enterprise Wide and BU Led):', True)
p(doc, 'This column provides leadership with a single-glance summary of each programme\u2019s funding position and the reasoning behind it. The content adapts based on the programme\u2019s status:')
b(doc, 'Funded: Shows "Funded" with the priority stage (e.g., "Funded in Legal and Compliance (Must Do) at rank 1"), the funding basis (e.g., "Carry Over \xb7 Legal and Compliance (Must Do)") and any conditions attached.')
b(doc, 'Partial Scope: Shows "Partial scope" with the manually set amount, the original request, and who made the decision (from the decision log).')
b(doc, 'Excluded: Shows "Excluded" with the decision origin and business note if one was recorded.')
b(doc, 'Held: Shows "Held \u2014 [specific reason]" in amber. Examples: "Held \u2014 Missing quantified benefit evidence", "Held \u2014 Benefit claim above 5.0x requires review", "Held \u2014 Priority TBD in overall AOP decision".')
b(doc, 'Not Funded (automatic): Shows the priority stage the programme was classified into, its rank within that stage, and why it was not selected (e.g., "Value Based Portfolio \u2014 budget capacity reached at rank 12").')

p(doc, 'Section 6: Demand Not Funded', True)
p(doc, 'This table shows all programmes that did not receive funding, including programmes held for evidence review.')
b(doc, 'Population logic: Every programme with a zero final amount and a positive requested amount appears here. Programmes held for missing evidence appear with an amber "Held" badge and their specific hold reason (e.g., "Missing data-backed evidence").')
b(doc, 'Columns: Organisation/Programme, Decision Band, Score, Requested M\u20ac, Benefits M\u20ac, Merit, Reason Not Funded / Cost of Not Doing.')

p(doc, 'Column: Reason Not Funded / Cost of Not Doing:', True)
p(doc, 'This column explains to leadership why each programme was not selected and what the consequence of that decision is:')
b(doc, 'Budget exceeded: "Priority [N] \u2014 budget capacity reached at rank [X]. [Y] M\u20ac requested." The programme was eligible and scored well enough, but the priority budget was fully allocated before reaching it.')
b(doc, 'Evidence hold: The specific hold reason is shown in amber (e.g., "Missing data-backed evidence for benefit, payback or impact \u2014 held for explicit review"). This tells leadership exactly what evidence is needed to unlock the programme.')
b(doc, 'Cost of Not Doing: Below the status reason, the source "Impact and Cost of Not Doing" text is shown. This is the programme owner\u2019s own description of what happens if the investment is not made. Examples: "Compliance risk \u2014 potential fines of 2M\u20ac", "Customer revenue at risk", "End of vendor support in Q2 2027".')
b(doc, 'Ineligible: If the programme has a structural issue (missing name, zero request, unresolved priority), the specific ineligibility reason is shown.')
b(doc, 'Both tables together account for all 521 programmes. No programme is missing from both tables.')

p(doc, 'Section 7: Decision Log and Rules (collapsed by default)', True)
p(doc, 'The decision log provides a complete audit trail of every change made to the portfolio.')

p(doc, 'Business-readable view:', True)
b(doc, 'Each row in the log shows: When (timestamp), Who (originating tab), What (action type: setting change, programme include/exclude, amount edit, evidence review, preset selection), Which programme(s), What changed (old value \u2192 new value), and an optional business note.')
b(doc, 'The log is chronological, most recent first. An Undo button reverses the most recent non-undone action.')
b(doc, 'A Reset button clears all manual overrides and returns to the automatic baseline.')
b(doc, 'Below the log: source file name, source hash/version, last refresh timestamp, row counts, evidence coverage statistics, rule version and refresh controls.')

p(doc, 'Technical event schema:', True)
b(doc, 'Each event is a JSON object: { revision: number, timestamp: ISO8601, origin: "Enterprise Wide"|"BU Led"|"Program AOP Scenarios", action: "program"|"group"|"setting"|"preset"|"review"|"reset"|"resolve"|"finalise"|"fork", details: { id, field, before, after, note }, before: snapshot }.')
b(doc, 'The "before" field stores the pre-change state, enabling Undo to restore exactly.')
b(doc, 'Every transaction increments the scenario revision number.')

p(doc, 'Allocation and Evidence Rules (below the log):', True)
b(doc, 'Plain-language explanation of the four priority stages, their classification rules and sort order.')
b(doc, 'Explanation of the merit score components and their weights.')
b(doc, 'Explanation of the evidence hold mechanism and how held programmes can be explicitly included.')
b(doc, 'Source data coverage: Decision Band distribution, Overall AOP Decision distribution.')
b(doc, 'These rules are embedded in the dashboard for transparency. They are not editable by the user.')

highlight_box(doc, 'Business-Readable Changelog in Excel Downloads',
    'Create a dedicated "Change Log" sheet in every Excel download that captures all portfolio decisions in business-readable format.\n\n'
    'Each row should contain:\n'
    '- Date and time of the change\n'
    '- Action taken (e.g., "Included programme", "Excluded programme", "Changed amount from 0.4 to 0.3 M€", "Changed preset to Protect Commitments")\n'
    '- Programme affected (ID and name)\n'
    '- Organisation\n'
    '- Decision maker context (originating tab: Enterprise Wide or BU Led)\n'
    '- Business note (if recorded)\n'
    '- Scenario revision number\n\n'
    'This sheet provides Finance and PMO with a complete audit trail in a format they can review without opening the dashboard. '
    'It should be sorted chronologically (most recent first) and include a summary header row showing: total changes, scenario name, source version and export timestamp.\n\n'
    'STATUS: Outstanding change. The current Excel export includes portfolio data but not the decision changelog.')

# ── Tab 3: Enterprise Wide ──
h2(doc, '4.3 Enterprise Wide')
p(doc, 'The Enterprise-Wide programme review tab. Global Portfolio Leaders review and edit programme selections for their Functions.')

h3(doc, 'Section 1: Stream KPIs')
p(doc, 'Six KPI cards scoped to the Enterprise Wide stream:')
b(doc, 'Programme Demand: Sum of all EW requested amounts.')
b(doc, 'Indicative Programme Envelope: EW share of the automatic baseline allocation (reporting only, not a ceiling).')
b(doc, 'Prioritised Demand: Sum of EW final amounts, with funded count and variance vs indicative.')
b(doc, 'Merit Floor: The configured advanced Value eligibility setting.')
b(doc, 'Demand Gap: EW requested minus EW final allocation.')
b(doc, 'Submitted Benefits: Sum of numeric benefits for funded EW programmes.')

h3(doc, 'Section 2: Filters and Bubble Chart')
p(doc, 'Filter population: Each filter reads from the current EW programme data. Five cascading checkbox filters:')
b(doc, 'Organisation: Lists all Organisations that have EW programmes. Selecting an Organisation constrains the Platform filter to show only platforms used by that Organisation\u2019s programmes.')
b(doc, 'Platform: Lists IT platforms. Constrained by Organisation selection.')
b(doc, 'New / Carryover / Sustain: Demand type filter.')
b(doc, 'Investment Area: Constrained by upstream selections.')
b(doc, 'Funding Status: Funded, Unfunded, Partial Scope, Excluded.')
b(doc, 'Plus a text search across programme name, ID and Organisation.')
p(doc, '')
p(doc, 'Bubble chart population: Plots all EW programmes with a positive requested amount. X-axis: merit score (0\u2013100). Y-axis: requested investment (logarithmic). Bubble area proportional to requested demand. Colour: Funded (green), Partial (amber), Excluded (red), Not funded (pink) \u2014 or Decision Band mode. Compact colour legend only, no explanatory paragraph. Median merit line and merit threshold line shown.')

h3(doc, 'Section 3: Editable Grouped Table')
p(doc, 'Table population: All EW programmes from the current scenario, grouped by Organisation. Default state: all Organisation groups collapsed.')
b(doc, 'Organisation summary row: child count, funded count, Decision Band, average merit, summed requested/prioritised/unfunded/benefits, evidence count.')
b(doc, 'Expanding an Organisation reveals individual programme rows with inline editing controls.')
b(doc, 'Checkbox: tick to include (full request) or untick to exclude (zero). No popup.')
b(doc, 'Amount input: type a value between 0 and the requested amount for partial scope.')
b(doc, 'Every edit commits immediately, updates all tabs, and creates a decision log event.')

# ── Tab 4: BU Led ──
h2(doc, '4.4 BU Led')
p(doc, 'Same structure as Enterprise Wide, scoped to the BU Led demand stream. BU Representatives review and edit their Organisation\u2019s programmes. All sections (KPIs, filters, bubble chart, editable table) follow the same logic described in Section 4.3, with data filtered to BU Led programmes only.')
p(doc, 'Enterprise Wide and BU Led are independently editable views of the same portfolio. A decision in either tab updates Program AOP Scenarios, the other stream tab and One Portfolio immediately.')

# ── Tab 5: Operations ──
h2(doc, '4.5 Operations')
p(doc, 'Pre-aligned Operations cost-of-ownership. This tab is read-only because Operations costs are defined through the Bill of IT process, not through the Programme AOP prioritisation.')

h3(doc, 'Section 1: KPI Tiles')
b(doc, 'Total Operations 2027: 469.7 M\u20ac.')
b(doc, '2026 Run-Rate: 470.7 M\u20ac.')
b(doc, '\u0394 YoY: -1.0 M\u20ac.')
b(doc, 'BU Own Consumption: 317.6 M\u20ac.')
b(doc, 'From Regions: 63.5 M\u20ac.')
b(doc, 'From Functions: 88.5 M\u20ac.')

h3(doc, 'Section 2: Organisation TCO Table (three-level hierarchy)')
p(doc, 'Columns: Organisation, AOP2027 Costs M\u20ac, Own Consumption (M\u20ac | %), Regions to BU (M\u20ac | %), Functions & CoEs (M\u20ac | %), \u0394 vs AOP2026 M\u20ac.')
b(doc, 'Level 1 (BU Cluster): Click \u25b6 to expand sub-organisations.')
b(doc, 'Level 2 (Sub-Organisation): Click \u25b6 to expand services opted in.')
b(doc, 'Level 3 (Services): Individual service name and AOP2027 cost in M\u20ac.')
b(doc, 'Filters: Organisation, Platform. Sort: AOP2027 Costs.')

h3(doc, 'Section 3: Service Catalog')
p(doc, 'Flat table of all 167 IT services. Columns: Service ID, Service Name, Platform, AOP2027 Costs M\u20ac, 2027 Demand Estimate, AOP2026 Costs M\u20ac, 2026 Demand Estimate.')

# ── Tab 6: One Portfolio ──
h2(doc, '4.6 One Portfolio')
p(doc, 'The final combined view for leadership sign-off. Merges Programme prioritisation results with Operations costs at the Organisation level. This tab answers the question every BU leader asks: "What is my total IT charge for AOP 2027?"')

h3(doc, 'Section 1: Header KPI Tiles')
p(doc, 'Five tiles in a single row, all live from the current scenario:')
b(doc, 'Total IT AOP: Sum of Operations (469.7 M\u20ac) + Prioritised Programme AOP. Updates when any programme decision changes.')
b(doc, 'Operations AOP: 469.7 M\u20ac. Dark tile. Static because Operations is pre-aligned.')
b(doc, 'Prioritised Programme AOP: Total funded amount and programme count. Green tile. Updates live.')
b(doc, 'Split of Programme AOP: EW funded amount | BU Led funded amount. Shows the balance between enterprise and business-unit investment.')
b(doc, 'Committed Benefit: Sum of quantified benefits for all funded programmes. Represents the total return expected from the selected portfolio.')
p(doc, 'Population logic: The five tiles read from the same AOP engine result that drives Program AOP Scenarios. No separate calculation. When a user changes a lever in Program AOP Scenarios or edits a programme in Enterprise Wide or BU Led, the tiles update on the next visit to this tab.')

h3(doc, 'Section 2: Programme Demand Overview')
p(doc, 'Heading: "AOP2027 : Programme Demand Overview".')
p(doc, 'Bubble chart population: Shows funded programmes only. Unfunded programmes are hidden from the chart to give leadership a clear picture of what is in the portfolio. X-axis: merit score (0\u2013100). Y-axis: requested investment (logarithmic). Bubble area proportional to requested demand. Colour by funding status. Compact colour legend. No median merit line (removed to reduce visual noise). Merit threshold line shown if relevant.')
p(doc, 'Filter and sort: Same Organisation, Platform and sort controls as Enterprise Wide. Sorting works within the funded-only view. Filters narrow the visible funded programmes.')

h3(doc, 'Section 3: Organisation IT Cost Allocation')
p(doc, 'This is the central table in One Portfolio. It shows what each BU will be charged across Programme and Operations spend.')

placeholder_box(doc, 'BU-Level Charge-Outs (Discussion with Swati)',
    'Per Swati\u2019s direction, this section should show only BU-level charge-outs because BUs are the entities that receive the IT cost allocation. Non-BU organisations (corporate Functions, Regions, CoEs) should not appear as separate rows because their costs are already allocated into BU charges.\n\n'
    'Programme costs should be split by type:\n'
    '- Type 1 (Single BU): Direct charge to the requesting BU.\n'
    '- Type 2 (Cross BU): Allocated to participating BUs based on contribution keys.\n'
    '- Type 3 (Enterprise Wide): Allocated to all BUs based on charge keys (e.g., share of revenue, headcount).\n\n'
    'Operations costs use the existing TCO allocation model (own consumption + region allocation + function allocation).\n\n'
    'The total in this table must always reconcile to: Programme AOP (funded total) + Operations AOP (469.7 M\u20ac). '
    'No cost should be unallocated or double-counted.\n\n'
    'Final charge-out structure to be confirmed after discussion with Swati.')

b(doc, 'Columns: Organisation (BU only), Programmes, Programme Funded M\u20ac (Type 1+2 direct | Type 3 allocated), Operations Cost M\u20ac, Total IT Charge M\u20ac.')
b(doc, 'Only BU-level Organisations. Functions, Regions and corporate departments are excluded because their costs are embedded in BU allocations.')
b(doc, 'Sort dropdown: Programme Funded, Operations, Total IT.')
b(doc, 'Grand Total must reconcile: Programme funded + 469.7 M\u20ac Operations = Total IT AOP shown in the header KPI.')

h3(doc, 'Section 4: Read-Only Programme Table')
p(doc, 'Grouped table showing the complete programme portfolio: all inclusions, exclusions, partial-scope decisions and unfunded requests. Uses the same Organisation-grouped layout as Enterprise Wide and BU Led (collapsed by default, expandable to programme rows), but with no editing controls.')
p(doc, 'This table provides the programme-level detail behind the Organisation IT Cost Allocation summary above. A BU leader can expand their Organisation group to see exactly which programmes are funded, at what amount, and why unfunded programmes were not selected.')
p(doc, 'The "Funding Status / Demand Details" column uses the same leadership-readable descriptions documented in Section 4.2.')

h3(doc, 'Section 5: Finalise and Source Coverage')
b(doc, 'Finalise: Freezes the scenario revision. A finalised portfolio cannot be edited. All KPIs, tables and exports reflect the frozen state.')
b(doc, 'Fork: Creates a new editable draft from a finalised scenario, carrying forward all decisions, source data and event history. This allows leadership to explore alternatives without losing the agreed position.')
b(doc, 'Source Decision Coverage: Two audit tables showing Decision Band distribution (Healthy / Contain / blank counts) and Overall AOP Decision distribution across all 521 programmes. These confirm that the portfolio accounts for every programme in the source data.')

# ═══════════════════════════════════════════════
# SECTION 5: PRIORITISATION ENGINE
# ═══════════════════════════════════════════════
h1(doc, '5. Prioritisation Engine \u2014 Lever Logic and Funding Order')

h2(doc, '5.1 Four-Priority Funding Precedence')

tbl(doc,
    ['Priority', 'Classification Rule', 'Sort Order', 'Funding Control'],
    [
        ['P1: Legal, Fiscal & Regulatory', 'Overall AOP decision contains P1 Immediate or P2 Scheduled; or source ID is EW-11, EW-65, EW-71. Evidence: quantified benefits, fines, disruption risks.', 'P1 before P2, then CCB exceptions. Within tier: LFR evidence preference, then merit.', 'Directional budget lever (default 15 M\u20ac).'],
        ['P2: High-Value Carry-Overs', 'Source New/Carry-over is "Carry Over", excluding decommissioning. Must have data-backed evidence (benefit, payback or impact).', 'Benefit/cost ratio desc \u2192 payback presence \u2192 consequence \u2192 merit.', 'Directional budget lever (default 50 M\u20ac).'],
        ['P3: Change & Sustaining', 'Sustain: source equals "Change & Sustain". Hygiene: category is Continuous Improvement or Upgrades & Enhancements. Small modifications <250K\u20ac, tech debt.', 'Sustain funded first (merit desc), then Hygiene (merit desc).', 'Directional budget lever (default 20 M\u20ac).'],
        ['P4: Business & Function New', 'All remaining demand including decommissioning, AI, new initiatives.', 'Evidence strength first, then merit desc.', 'Automatic residual.'],
    ])

h2(doc, '5.2 LFR Prioritisation Logic (Priority 1 Detail)')
p(doc, 'Minimum evidence requirements for automatic LFR qualification:', True)
b(doc, 'P1/P2 classification in the Overall AOP Decision field.')
b(doc, 'Compliance Name available (e.g., "ABAC, HCC", "MDR", "SOX").')
b(doc, 'Compliance Year available (e.g., 2027).')
b(doc, 'Supporting evidence available (quantified benefits, potential fines, business disruption risks).')
p(doc, 'Only LFRs meeting all four requirements should automatically qualify for funding in the Default scenario. LFRs missing compliance name or year are held for explicit review.')
p(doc, '')
p(doc, 'Funding order within Priority 1:', True)
b(doc, 'First: P1 Immediate obligations with full evidence.')
b(doc, 'Second: P2 Scheduled obligations with full evidence.')
b(doc, 'Third: CCB exceptions (EW-11 Group Functions, EW-65 ISC, EW-71 Finance) \u2014 funded in full.')
b(doc, 'Fourth: LFRs with partial evidence \u2014 held for leadership decision.')
p(doc, 'The engine funds whole programmes in priority order. It does not reduce all LFRs proportionally.')

highlight_box(doc, 'LFR Evidence Gate',
    'Implement stricter evidence gate: only LFRs with compliance name + year + supporting evidence auto-qualify. '
    'Others held outside automatic selection.\n\nSTATUS: Outstanding change (OC-11).')

h2(doc, '5.3 True Carryover Validation (Priority 2 Detail)')
p(doc, 'Definition: A "True Carryover" is a programme that was approved in AOP2026 (or earlier) with a confirmed business case, and the case remains valid for AOP2027.')
p(doc, 'Validation steps:', True)
b(doc, 'Step 1: Check Carry Over Baselined > 0 (the confirmed demand from the original business case).')
b(doc, 'Step 2: Compare Requested 2027 amount with Baselined amount. Funding = min(Requested, Baselined). If the programme requests more than the original case, cap at Baselined.')
b(doc, 'Step 3: Check Priority field = Must Do or Must Have.')
b(doc, 'Step 4: Validate the benefit case is still current (numeric benefit > 0 or substantive impact text).')
b(doc, 'Step 5: Programmes failing any check move to Priority 4 (Value Based Portfolio).')
p(doc, '')
p(doc, 'This prevents overstated carryovers from consuming the carryover budget. If a programme was baselined at 2.0 M\u20ac but now requests 5.0 M\u20ac, only 2.0 M\u20ac is funded automatically. The additional 3.0 M\u20ac must be justified through the Value portfolio or explicit leadership inclusion.')

highlight_box(doc, 'True Carryover Validation',
    'Implement Baselined amount check and cap. Programmes without Baselined value or without Must Do/Must Have move to Priority 4.\n\n'
    'STATUS: Outstanding change (OC-13).')

h2(doc, '5.4 Sustain and Hygiene (Priority 3 Detail)')
p(doc, 'Not all sustaining demand should automatically receive 100% funding. The agreed approach applies merit-based comparison within this priority:')
b(doc, 'GRC and IR programmes with "Change & Sustain" category are included in this priority level (other GRC/IR programmes stay in their natural priority).')
b(doc, 'Sustain programmes ranked by merit score. Higher-merit programmes funded first.')
b(doc, 'Hygiene (Continuous Improvement, Upgrades & Enhancements) also ranked by merit score within this priority.')
b(doc, 'CCB allocations require review. Productivity savings and Falcon savings assumptions should reduce the funding needed.')
b(doc, 'The directional budget for this priority (e.g., 20 M€) is a cap, not a guarantee. If merit-ranked demand falls below the cap, the unused portion flows to Priority 4.')

highlight_box(doc, 'Merit-Based Sustain Funding',
    'Current engine auto-funds 100% of Sustain. Must be changed to merit-based ranking with productivity adjustment.\n\n'
    'STATUS: Outstanding change (OC-15).')

h2(doc, '5.5 Value Portfolio and Conference Debate (Priority 4 Detail)')
p(doc, 'Priority 4 is the primary discussion area for the AOP conference. Two competing viewpoints have emerged:')

p(doc, 'Option A: Pure Value Optimization', True)
b(doc, 'Highest enterprise value wins. Programmes ranked by benefit realisation, strategic value, portfolio scoring and enterprise impact.')
b(doc, 'Some BUs or Functions may receive little or no new funding if their proposals score lower than others.')
b(doc, 'Advantage: maximises return on investment for the enterprise as a whole.')
b(doc, 'Risk: may create organisational resistance if some BUs feel excluded from the investment portfolio.')

p(doc, 'Option B: Balanced Allocation', True)
b(doc, 'Every BU and Function receives at least some representation in the funded portfolio.')
b(doc, 'A minimum allocation floor is set per Organisation (e.g., at least one funded programme, or a percentage of their demand).')
b(doc, 'Advantage: maintains organisational buy-in and ensures all parts of the business receive IT investment attention.')
b(doc, 'Risk: may fund lower-value work at the expense of higher-value enterprise opportunities.')

p(doc, 'The model should support both options so leadership can compare the portfolio outcomes under each approach. This is expected to be one of the key debates at the AOP conference.')

h2(doc, '5.6 Evidence Hold Mechanism')
p(doc, 'Across all priority stages, programmes without sufficient evidence are held outside automatic selection. Held programmes appear with an amber status badge and their hold reason. They can be explicitly included in Enterprise Wide or BU Led. Explicit inclusion records the rationale and accountable leader in the decision log.')

h2(doc, '5.4 Scenario Presets')
tbl(doc,
    ['Preset', 'P1: LFR', 'P2: Carry-Overs', 'P3: Sustain+Hygiene', 'P4: Value', 'Use Case'],
    [
        ['Optimal Segmentation (Recommended)', '15 M\u20ac', '50 M\u20ac', '20 M\u20ac', '15 M\u20ac', 'Finance-recommended 100M spread.'],
        ['Protect Commitments', '20 M\u20ac', '50 M\u20ac', '23 M\u20ac', '7 M\u20ac', 'Maximise LFR and carry-over coverage.'],
        ['Tighten Carryover Evidence', '15 M\u20ac', '40 M\u20ac', '20 M\u20ac', '25 M\u20ac', 'Redirect from carry-overs to new value.'],
        ['Release Sustain Capacity', '15 M\u20ac', '58 M\u20ac', '12 M\u20ac', '15 M\u20ac', 'Reduce sustain, give more to carry-overs.'],
    ])

h2(doc, '5.5 Merit Score Formula')
tbl(doc,
    ['Component', 'Maximum', 'Tiers'],
    [
        ['Submitted Benefit', '50', '<1x=0; \u22651x=20; \u22652x=30; \u22653x=40; \u22655x=50'],
        ['Submitted Priority', '25', 'Must Do=25; Must Have=18; Deprioritised=5; blank=0'],
        ['Captured Consequence', '15', 'No evidence=0; contextual=5; explicit harm=10; quantified=15'],
        ['Decision Band', '10', 'Healthy=10; Contain=6; blank=0'],
    ])
p(doc, 'Weights are configurable (default 50/25/15/10, must total 100). Benefit multiple = submitted benefit / original requested amount. Claims above 5.0x require inline evidence review.')

# ═══════════════════════════════════════════════
# SECTION 6: OPERATIONS DATA MODEL
# ═══════════════════════════════════════════════
h1(doc, '6. Operations Data Model')

h2(doc, '6.1 Data Sources and Cost Allocation')
b(doc, 'Source: Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx.')
b(doc, 'BU own consumption based on per-service consumption data.')
b(doc, 'Region-to-BU: cost-centre allocations weighted by employee count.')
b(doc, 'Function-to-BU: FP&A AOP function cost allocations.')
b(doc, 'If a service is not used by a BU (0/1 flag), no cost allocated.')

h2(doc, '6.2 Organisation-to-Operations Mapping')
tbl(doc,
    ['Programme Organisation', 'TCO Entry', 'AOP2027 M\u20ac'],
    [
        ['Precision Diagnosis - MR', 'MR', '38.0'],
        ['Precision Diagnosis - CT', 'CT/AMI', '25.3'],
        ['Precision Diagnosis - ULS', 'ULS', '38.1'],
        ['Precision Diagnosis - DXR', 'DXR', '11.7'],
        ['IGT - Devices', 'IGT-D', '33.4'],
        ['IGT - Systems', 'IGT-S', '51.5'],
        ['Monitoring - HPM', 'HPM', '60.1'],
        ['Sleep & Respiratory Care', 'SRC', '32.7'],
        ['AM&D', 'AMD', '9.1'],
        ['Enterprise Informatics', 'EI', '34.1'],
        ['Personal Health', 'PH', '75.9'],
        ['IP & Standards', 'IP&S', '4.6'],
        ['Innovation & Design', 'I&D', '9.7'],
        ['Functions / Regions / ISC', '\u2014 (allocators)', '0.0'],
    ])

# ═══════════════════════════════════════════════
# SECTION 7: DESIGN SPECIFICATION
# ═══════════════════════════════════════════════
h1(doc, '7. Design Specification')
tbl(doc,
    ['Element', 'Specification'],
    [
        ['Primary', '#0B5ED7 (Philips blue)'],
        ['Dark', '#00126E (navy)'],
        ['Light', '#BDF0FF (active states)'],
        ['Background', '#FAFBFC / #FFFFFF'],
        ['Status: funded', '#008800 / #ADFFB5'],
        ['Status: TBD/partial', '#FCA708 / #FCFCC2'],
        ['Status: unfunded', '#D43F44 / #FFDEDB'],
        ['Font', 'Neue Frutiger World, Calibri, Segoe UI'],
        ['Table headers', '11px white on dark, sticky'],
        ['Numbers', 'Right-aligned, tabular-nums'],
    ])

# ═══════════════════════════════════════════════
# SECTION 8: FINANCE CALCULATION MODEL
# ═══════════════════════════════════════════════
h1(doc, '8. Finance Calculation Model')
p(doc, 'This section defines how IT costs are calculated and allocated to BUs for the One Portfolio view. Finance uses this model to validate that every euro of IT spend is accounted for and correctly charged.')

h2(doc, '8.1 Programme Cost Types')
p(doc, 'Programmes in the AOP 2027 demand are classified into three types based on their organisational scope. Each type has a different charge-out mechanism:')

tbl(doc,
    ['Type', 'Name', 'Scope', 'Charge-Out Method', 'Source Field'],
    [
        ['Type 1', 'Single BU', 'Benefits one BU only', 'Direct charge: 100% of the funded amount is charged to the requesting BU.', 'Type field = "Type I - Single BU"'],
        ['Type 2', 'Cross BU', 'Benefits multiple BUs', 'Contribution-based: The funded amount is split across participating BUs based on their contribution keys (defined in the BU allocation columns of the demand workbook).', 'Type field = "Type II - Cross BU"'],
        ['Type 3', 'Enterprise Wide', 'Benefits the entire enterprise', 'Charge-key-based: The funded amount is allocated to all BUs using enterprise charge keys (e.g., share of revenue, headcount, or other agreed allocation basis from FP&A).', 'Type field = "Type III - Enterprise wide"'],
    ])

p(doc, 'The sum of all Type 1 + Type 2 + Type 3 charges across all BUs must equal the total Programme AOP funded amount. No programme cost should be unallocated.')

h2(doc, '8.2 Operations Cost Allocation')
p(doc, 'Operations costs are allocated through the Bill of IT model:')
b(doc, 'Own Consumption (317.6 M€): Each BU pays for the IT services it uses, based on the consumption data per service (AOP Use 1/0 flag and consumption volume).')
b(doc, 'Region-to-BU (63.5 M€): Regional IT costs (NAR, IR, GCR) are allocated to BUs using cost-centre-to-BU assignment keys weighted by headcount from Workday.')
b(doc, 'Function-to-BU (88.5 M€): Function and CoE IT costs are allocated to BUs using FP&A AOP function cost allocation keys.')
b(doc, 'Total Operations: 469.7 M€. Every euro is allocated. The sum of all BU Operations charges equals 469.7 M€.')

h2(doc, '8.3 BU-Level Charge-Out Reconciliation')
p(doc, 'For each BU, the total IT charge is:')
p(doc, '  BU Total IT = Type 1 (direct) + Type 2 (contribution share) + Type 3 (charge key share) + Operations TCO')
p(doc, '')
p(doc, 'The grand total across all BUs must reconcile to:')
p(doc, '  Grand Total = Programme AOP (funded) + Operations AOP (469.7 M€)')
p(doc, '')
p(doc, 'This reconciliation is displayed in the One Portfolio Organisation IT Cost Allocation table. Finance validates this by comparing the dashboard totals with the source workbook calculations.')

h2(doc, '8.4 Mappings Available for Finance')
tbl(doc,
    ['Mapping', 'Source', 'Used For'],
    [
        ['Programme Organisation → BU', 'Demand workbook "Organization setting demand" column', 'Direct Type 1 charge assignment'],
        ['Programme Type 2 → BU contributions', 'Demand workbook BU allocation columns (cols 37+)', 'Splitting cross-BU programme costs'],
        ['Programme Type 3 → BU charge keys', 'FP&A enterprise charge keys', 'Allocating enterprise-wide programme costs to BUs'],
        ['Service → BU consumption', 'Bill of IT "AOP Use (1/0)" per BU sub-org', 'Own consumption cost allocation'],
        ['Region → BU', 'Cost-centre-to-BU allocations weighted by headcount', 'Region IT cost allocation to BUs'],
        ['Function → BU', 'FP&A AOP function cost allocation', 'Function/CoE IT cost allocation to BUs'],
        ['IT Dept code → Platform', '16-entry mapping table in dashboard', 'Service platform classification'],
        ['Programme Organisation → TCO sub-org', '14-entry mapping table in dashboard', 'Linking programme orgs to Operations cost entries'],
    ])

h2(doc, '8.5 Finance Validation Checks')
b(doc, 'Check 1: Sum of all funded programme amounts in the dashboard = sum in the Excel export.')
b(doc, 'Check 2: Type 1 + Type 2 + Type 3 funded amounts = total Programme AOP.')
b(doc, 'Check 3: Sum of BU Operations charges = 469.7 M€.')
b(doc, 'Check 4: Grand Total in One Portfolio = Programme AOP + 469.7 M€.')
b(doc, 'Check 5: No programme appears in both "Demand Prioritized" and "Demand Not Funded" (521 total, no duplicates, no missing).')
b(doc, 'Check 6: Scenario settings, source version and rule version in the Excel export match the dashboard.')

# ═══════════════════════════════════════════════
# SECTION 9: ACCEPTANCE
# ═══════════════════════════════════════════════
h1(doc, '9. Open Questions Requiring Resolution')
p(doc, 'The following questions have been identified during the prioritisation design and require resolution before or during the AOP conference.')

tbl(doc,
    ['#', 'Question', 'Context', 'Owner'],
    [
        ['Q1', 'Should only LFRs with compliance name AND year automatically qualify?', 'Some LFRs have P1/P2 classification but lack specific compliance references. Strict evidence gate would hold these for review.', 'CIO / Legal'],
        ['Q2', 'How should CCB LFR buckets (Finance, GF, ISC) be evidenced and defended?', 'These three exceptions are classified by source ID, not by their decision field. The evidence standard for these should match P1/P2 requirements.', 'CIO / Finance'],
        ['Q3', 'How should carryovers without strong underlying business cases be treated?', 'Several carryovers appear overstated (Requested >> Baselined). Should they move to Priority 4 Value, or receive reduced funding at the Baselined amount?', 'CIO / PMO'],
        ['Q4', 'Enterprise optimization (Option A) vs balanced allocation (Option B)?', 'Pure value optimization may leave some BUs with no new funding. Balanced allocation may fund lower-value work. Key conference debate.', 'CIO / BU Leaders'],
        ['Q5', 'What Qualitative Benefit and Payback Period thresholds should apply to the merit score?', 'New scoring components are due. The weight rebalancing (currently 50/25/15/10) and threshold definitions need agreement.', 'PMO / Byronie'],
        ['Q6', 'What percentage of Sustain demand should be merit-ranked vs auto-funded?', 'Current proposal: all Sustain is merit-ranked. Alternative: a minimum floor (e.g., 50%) is auto-funded, remainder merit-ranked.', 'CIO / Platform Leads'],
        ['Q7', 'Should CCB funding assumptions incorporate productivity and Falcon savings reductions?', 'If productivity gains reduce the actual need, the Sustain/Hygiene envelope could be smaller.', 'Finance / PMO'],
    ])

h1(doc, '10. Release Acceptance')
tbl(doc,
    ['Area', 'Measurable Outcome'],
    [
        ['Financial consistency', 'Every visible total reconciles across all six tabs and the Excel export.'],
        ['Cross-tab propagation', 'A programme edit in Enterprise Wide or BU Led updates Demand Overview, Program AOP Scenarios and One Portfolio within 500ms.'],
        ['Operations accuracy', 'TCO totals match Comparable AOP2027: PD 146.9, IGT 90.6, CC 108.0, EI 34.1, PH 75.9, IP&S 4.6, I&D 9.7 M\u20ac.'],
        ['Three-level drill-down', 'Expanding PD \u2192 CT/AMI \u2192 Services shows 112 services totalling 14.4 M\u20ac.'],
        ['Filter dynamics', 'Checkbox filters cascade counts, update total row (X/521 format), work with sort. Clear All restores.'],
        ['Four-priority allocation', 'Optimal Segmentation: ~15M LFR + 50M Carry + 20M Sustain/Hygiene + 15M Value \u2248 100M.'],
        ['Evidence holds', 'Programmes without evidence show amber "Held" status with reason.'],
        ['One Portfolio', 'Organisation allocation shows Programme funded + Operations cost. Grand total = 469.7 + Programme funded.'],
        ['Scoring validation', 'Data refresh recalculates all scores, flags >10-point changes, confirms weight totals.'],
    ])

# ═══════════════════════════════════════════════
# SECTION 9: OUTSTANDING CHANGES REGISTER
# ═══════════════════════════════════════════════
h1(doc, '11. Outstanding Changes Register')
p(doc, 'The following changes have been identified but not yet built. They are highlighted throughout this document with \u26a0 markers.')

tbl(doc,
    ['#', 'Change', 'Section', 'Status', 'Dependency'],
    [
        ['OC-01', 'Dynamic total row: X/521 format when filtered', '4.1 Sec 2', 'To be built', 'None'],
        ['OC-02', 'Four-priority with eligible-only buckets', '4.2, 5.1, App A', 'BUILT v4.5', 'None'],
        ['OC-03', 'Qualitative Benefits + Payback in merit scoring', '4.2 Sec 4, 5.7', 'To be built', 'Data due 24 Sep'],
        ['OC-04', 'Scoring validation on data refresh', '4.2 Sec 4', 'To be built', 'OC-03'],
        ['OC-05', 'Data Quality governance', '4.1 Sec 1', 'Pending: Byronie', 'Meeting'],
        ['OC-06', 'Scoring model finalisation', '4.2 Sec 4', 'Pending: Byronie', 'OC-03, OC-05'],
        ['OC-07', 'Business changelog in Excel downloads', '4.2 Sec 7', 'To be built', 'None'],
        ['OC-08', 'BU charge-out Type 1/2/3 split', '4.6 Sec 3, 8.1', 'Pending: Swati', 'Meeting'],
        ['OC-09', 'Type 2/3 allocation keys', '8.1, 8.3', 'To be built', 'OC-08'],
        ['OC-10', 'Three scenario types (Default/Leadership/Conference)', '4.2 Sec 2', 'To be built', 'OC-02'],
        ['OC-11', 'LFR evidence gate: ineligible LFRs to P4', '5.2, App A', 'BUILT v4.5', 'None'],
        ['OC-12', 'LFR sub-bucket view (Immediate/Scheduled/CCB)', '4.2', 'BUILT v4.5', 'OC-11'],
        ['OC-13', 'True Carryover: baselined + Must Do to P2, rest to P4', '5.3, App A', 'BUILT v4.5', 'None'],
        ['OC-14', 'Carryover baseline view in Program AOP Scenarios', '4.2', 'BUILT v4.5', 'OC-13'],
        ['OC-15', 'Sustain first then Hygiene by merit in P3', '5.4', 'BUILT v4.5', 'OC-02'],
        ['OC-16', 'Model explainability (per-programme score breakdown)', '4.2 Sec 4', 'To be built', 'OC-03'],
        ['OC-17', 'Option A vs B comparison mode', '5.5, 4.6', 'Conference decision', 'Q4'],
        ['OC-18', 'Quantified Benefit textual scoring', 'App B, 5.7', 'To be built', 'Byronie'],
        ['OC-19', 'Textual score validation on data refresh', 'App B', 'To be built', 'OC-18'],
    ])

OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/PRD/AOP2027-OnePortfolio-PRD-v4.5b.docx'

# === APPENDIX A ===
h1(doc, 'Appendix A: Demand Classification Logic')
p(doc, 'Every programme is classified to exactly one of four priorities. The classification is deterministic and data-driven.')

h2(doc, 'A.1 Classification Rules')
tbl(doc,
    ['Priority', 'Gate', 'Source Fields', 'Condition'],
    [
        ['P1', 'CCB Exception', 'Item No.', 'ID is EW-11, EW-65 or EW-71'],
        ['P1', 'LFR Evidence', 'Overall AOP Decision + LFR Name + LFR Year', 'Decision = must-do P1/P2 AND Name non-empty AND Year non-empty'],
        ['P2', 'True Carryover', 'New/Carry-over + Category + Baselined + Priority', 'Carry Over AND not Decomm AND Baselined > 0 AND Must Do/Must Have'],
        ['P3', 'Sustain', 'New/Carry-over', 'Change & Sustain'],
        ['P3', 'Hygiene', 'Category', 'Continuous Improvement OR Upgrades & Enhancements'],
        ['P4', 'Default', '(catch-all)', 'Everything not matching above'],
    ])

h2(doc, 'A.2 What Goes to P4')
b(doc, 'LFRs with P1/P2 decision but missing compliance name or year')
b(doc, 'Carry-overs without Carry Over Baselined amount')
b(doc, 'Carry-overs with baseline but not Must Do or Must Have')
b(doc, 'New features, AI enablement, decommissioning, and all unrecognised categories')

h2(doc, 'A.3 Dynamic Bucket Summary')
p(doc, 'Bucket counts and demands are computed from source data on every refresh. They are never hardcoded. The four buckets always sum to total programme demand.')

# === APPENDIX B ===
h1(doc, 'Appendix B: Quantified Benefit Textual Scoring \u2014 Recommendation')
p(doc, 'The current Submitted Benefit component (50 pts) uses only the numeric benefit/cost ratio. Programmes with strong qualitative cases but no K\u20ac figure score 0/50.')

h2(doc, 'B.1 Proposal: Textual Benefit Score (0\u201310 points)')
tbl(doc,
    ['Score', 'Criteria', 'Example'],
    [
        ['10', 'Specific measurable impact with timeline', 'Reduces patient wait time 30% by Q2 2027'],
        ['7', 'Clear impact with named beneficiary', 'Improves compliance posture for EU AI Act'],
        ['4', 'General benefit with context', 'Supports digital transformation strategy'],
        ['2', 'Vague or generic statement', 'Good for the business'],
        ['0', 'No text or repeats programme name', 'N/A or blank'],
    ])

h2(doc, 'B.2 Scoring Evaluation Criteria')
b(doc, 'Specificity: names a concrete outcome (metric, process, capability)')
b(doc, 'Measurability: includes quantities, percentages, timeframes, KPIs')
b(doc, 'Beneficiary: identifies who benefits (customer, patient, BU, function)')
b(doc, 'Strategic alignment: references recognised theme (AI, compliance, sustainability)')
b(doc, 'Uniqueness: substantively different from programme name and problem statement')

h2(doc, 'B.3 Integration Options')
p(doc, 'Option 1: Extend Submitted Benefit to 60 points (50 numeric + 10 textual). New weights: 60/20/12/8.', True)
p(doc, 'Option 2: Add a 5th component "Qualitative Benefit" worth 10 points. New weights: 45/22/13/10/10.', True)

placeholder_box(doc, 'Textual Benefit Scoring \u2014 Discussion with Byronie',
    'Pending items:\n'
    '1. Extend Submitted Benefit (Option 1) or new component (Option 2)?\n'
    '2. Minimum text quality threshold to avoid gaming?\n'
    '3. Apply to all programmes or only those with zero numeric benefit?\n'
    '4. Who validates textual scores \u2014 PMO, programme owners, or automated?\n'
    '5. Interaction with existing Captured Consequence component?\n'
    '6. Should the rubric be visible in the dashboard?\n\n'
    'Final model to be confirmed after discussion with Byronie.')

h2(doc, 'B.4 Validation')
b(doc, 'Re-score on every data refresh from current text')
b(doc, 'Deterministic: same text = same score')
b(doc, 'Flag changes > 3 points on refresh')
b(doc, 'Display alongside numeric score in merit breakdown')


doc.save(OUT)
print(f"PRD v4.5b saved to {OUT}")
