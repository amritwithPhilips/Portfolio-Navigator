"""Create PRD v4.3 and Requirements v4.3 documents."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn

def set_cell_shading(cell, color):
    shading = cell._element.get_or_add_tcPr()
    s = shading.makeelement(qn('w:shd'), {qn('w:fill'): color, qn('w:val'): 'clear'})
    shading.append(s)

def add_table(doc, headers, rows, col_widths=None):
    t = doc.add_table(rows=1+len(rows), cols=len(headers))
    t.style = 'Table Grid'
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        c.text = h
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255,255,255)
        c.paragraphs[0].runs[0].font.size = Pt(9)
        set_cell_shading(c, '00126E')
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            c = t.rows[ri+1].cells[ci]
            c.text = str(val)
            for p in c.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(9)
    return t

def h1(doc, text):
    doc.add_heading(text, level=1)

def h2(doc, text):
    doc.add_heading(text, level=2)

def h3(doc, text):
    doc.add_heading(text, level=3)

def p(doc, text, bold=False):
    para = doc.add_paragraph(text)
    para.style.font.size = Pt(10)
    if bold:
        for r in para.runs:
            r.bold = True
    return para

def bullet(doc, text):
    doc.add_paragraph(text, style='List Bullet')

# ============================================================
# DOCUMENT 1: PRD
# ============================================================
print("Creating PRD v4.3...")
doc = Document()
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10)

doc.add_heading('AOP 2027 One Portfolio Dashboard', level=0)
doc.add_heading('Product Requirements Document', level=0)
p(doc, 'Version 4.3 | 21 September 2026 | One Portfolio Build')
p(doc, '')

p(doc, 'The One Portfolio Dashboard brings together IT Programme demand prioritisation and Operations cost allocation into one decision tool for AOP 2027 planning. It replaces the four-tab modeler (v3.5) with a six-tab experience that adds a Demand Overview, an Operations cost-of-ownership view, and a unified One Portfolio tab that shows each Organisation what they will be charged across Programme and Operations spend.')

# ── Section 1: Product Outcome ──
h1(doc, '1. Product Outcome')

add_table(doc,
    ['Outcome', 'Evidence of Completion'],
    [
        ['One Portfolio view', 'Programme funding and Operations TCO shown side by side at Organisation level in Tab 6. Grand Total reconciles to 469.7M\u20ac Operations + funded Programme AOP.'],
        ['Funded portfolio within 100M\u20ac', 'Five-stage prioritisation engine allocates whole programmes. Ranked backlog with funded/unfunded status and cost-of-not-doing for every programme.'],
        ['Operations transparency', 'Three-level drill-down: BU Cluster \u2192 Sub-Organisation \u2192 Services Opted In, with AOP2027 cost per service.'],
        ['Evidence-gap tracking', 'Payback Period, Qualitative Benefits and Quantitative Benefits flagged as TBD with 24 September 2026 deadline across all views.'],
        ['Conference readiness', 'Organisation-level allocation table shows each BU leader their total IT charge (Programme funded + Operations TCO).'],
    ])

# ── Section 2: Users ──
h1(doc, '2. Users and Decisions')

add_table(doc,
    ['User', 'Decision Supported'],
    [
        ['CIO and IT Leadership', 'Set the Total AOP envelope, compare funding scenarios, accept the final portfolio position and variance.'],
        ['BU Representatives', 'Review their Organisation\u2019s Programme demand, include or exclude programmes, record prioritised amounts.'],
        ['Global Portfolio Leaders', 'Review Enterprise-Wide demand for their Function, confirm priorities and committed impact.'],
        ['Finance', 'Reconcile Programme demand, Operations TCO, scenario funding and the approved envelope.'],
        ['IT Portfolio and PMO', 'Prepare source data, maintain rule versions, resolve evidence gaps, publish scenario exports.'],
    ])

# ── Section 3: Navigation and Workflow ──
h1(doc, '3. Navigation and End-to-End Workflow')

h2(doc, '3.1 Visual Workflow')
p(doc, 'The dashboard follows a six-step linear workflow. Each step corresponds to a tab. The steps are connected but independent \u2014 no tab must be completed before another can be used.')
p(doc, '')
p(doc, '  [1. Demand Overview] \u2192 [2. Program AOP Scenarios] \u2192 [3. Enterprise Wide] \u2192 [4. BU Led] \u2192 [5. Operations] \u2192 [6. One Portfolio]')
p(doc, '')
p(doc, 'Step 1 provides the demand landscape. Step 2 sets the funding position. Steps 3 and 4 refine individual programme selections. Step 5 reviews pre-aligned Operations costs. Step 6 brings everything together for final review and sign-off.')

h2(doc, '3.2 Tab Structure')

add_table(doc,
    ['#', 'Tab Name', 'Purpose', 'Editable'],
    [
        ['1', 'Demand Overview', 'Read-only executive summary of Programme demand, Operations demand and data quality.', 'No'],
        ['2', 'Program AOP Scenarios', 'Set the 100M\u20ac envelope, adjust five funding levers, compare presets. View funded and unfunded demand.', 'Yes \u2014 levers and presets'],
        ['3', 'Enterprise Wide', 'Review and edit Enterprise-Wide programme selections. Inline include/exclude and amount changes.', 'Yes \u2014 programme decisions'],
        ['4', 'BU Led', 'Review and edit BU-Led programme selections. Same editing capability as Enterprise Wide.', 'Yes \u2014 programme decisions'],
        ['5', 'Operations', 'Review pre-aligned Operations cost-of-ownership. Three-level drill-down to individual services.', 'No \u2014 pre-aligned'],
        ['6', 'AOP 2027 : One Portfolio', 'Combined Programme + Operations view. Organisation-level allocation table. Finalise the portfolio.', 'No \u2014 finalise only'],
    ])

h2(doc, '3.3 Cross-Tab Data Flow')

p(doc, 'One shared scenario drives all tabs. When a user changes a lever in Tab 2 or edits a programme in Tab 3 or Tab 4, the AOP engine recalculates the entire portfolio. All tabs that display programme data update immediately:')
bullet(doc, 'Tab 2 (Scenarios): KPIs, fund bar and demand tables recalculate.')
bullet(doc, 'Tab 3 and Tab 4 (EW / BU Led): Stream totals, bubble chart and table reflect the new portfolio position.')
bullet(doc, 'Tab 1 (Demand Overview): Programme demand totals update. Operations data remains static.')
bullet(doc, 'Tab 6 (One Portfolio): KPI tiles, allocation table and funded-only bubble chart update.')
bullet(doc, 'Tab 5 (Operations): Unaffected. Operations costs are pre-aligned and do not change with Programme decisions.')
p(doc, '')
p(doc, 'Filters are local to each tab. Applying a filter in Tab 3 does not affect the filter state in Tab 4 or any other tab. Filters change what is displayed; they never change funding.')

# ── Section 4: Per-Tab Specification ──
h1(doc, '4. Per-Tab Detailed Specification')

# Tab 1
h2(doc, '4.1 Tab 1: Demand Overview')
p(doc, 'A read-only executive summary showing the full demand landscape before any prioritisation decisions are taken.')

h3(doc, 'Section 1: Executive Cards (three-column grid)')
bullet(doc, 'Programme Demand Overview: Total demand (521 programmes, 280.2 M\u20ac), Enterprise Wide split (180, 111.7 M\u20ac), BU Led split (341, 168.5 M\u20ac), Committed Impact (Proposed) showing funded benefit totals for BU Led and EW.')
bullet(doc, 'Operations Overview (Pre-aligned): Total services count and amount (167 services, 469.7 M\u20ac), 2026 Run-Rate (470.7 M\u20ac), cost breakdown grid showing BU Own Consumption (317.6 M\u20ac), From Regions (63.5 M\u20ac), From Functions (88.5 M\u20ac).')
bullet(doc, 'Data Quality: Programmes with Benefits (count/total), Programmes with Impact (count/total), Payback Period (TBD, due 24 Sep), Qualitative and Quantitative Benefits (TBD).')

h3(doc, 'Section 2: Demand Split by Organisation')
p(doc, 'A filterable, sortable table showing each Organisation\u2019s Programme demand alongside its Operations cost.')
bullet(doc, 'Columns: Organisation, Programme Demand (Count), Programme Demand M\u20ac, Operations Cost M\u20ac, Total IT Demand M\u20ac.')
bullet(doc, 'Filters: Organisation (checkbox multi-select), Platform (checkbox multi-select). Counts update dynamically when cross-filtering.')
bullet(doc, 'Sort: Programme Demand, Operations Cost, Total IT \u2014 each High-to-Low and Low-to-High.')
bullet(doc, 'Total row updates to reflect only the filtered selection. Operations total remains 469.7 M\u20ac (pre-aligned, not filterable).')
bullet(doc, 'Clear All button resets all filters and restores the full view.')

h3(doc, 'Section 3: High-Level Insights')
p(doc, 'Three-column table: Insight, Detail, Implication. Covers Total IT Budget, Demand vs Envelope oversubscription, and Evidence Gaps.')

# Tab 2
h2(doc, '4.2 Tab 2: Program AOP Scenarios')
p(doc, 'The central prioritisation workspace. Preserved from v3.5 with the full five-stage allocation engine, four presets, and interactive funding levers.')

h3(doc, 'Section 1: Executive Position')
p(doc, 'Five KPI cards: Allocated AOP, Initiatives Funded, EW/BU Led Share, Available AOP or Over-Budget Variance, Demand Left Unfunded. Horizontal funding bar showing the five stages with their allocated amounts.')

h3(doc, 'Section 2: Scenario and Funding Levers')
p(doc, 'Total AOP input (default 100 M\u20ac). Four scenario presets: Optimal Segmentation (Recommended), Protect Commitments, Tighten Carryover Evidence, Release Sustain Capacity. Five lever cards in a horizontal row:')
bullet(doc, 'Legal and Compliance: slider + numeric input, switchable between % of bucket demand and % of Total AOP.')
bullet(doc, 'Sustain Engineering: same slider/input/basis controls.')
bullet(doc, 'Hygiene: same slider/input/basis controls.')
bullet(doc, 'Carryover: benefit/request threshold from 0x to 5.0x+ in 0.5x steps.')
bullet(doc, 'Value Based Portfolio: automatic residual allocation, no slider.')
p(doc, 'Advanced configuration (collapsed): merit floor, four score weights (must total 100), whole-programme tolerance (default 5%).')

h3(doc, 'Section 3: Funding Prioritization Gate')
p(doc, 'Six cards explaining the selection logic: Gate 0 (Evidence Check), then the five funding stages with their demand, target and allocation amounts.')

h3(doc, 'Section 4: Merit Score Framework (collapsed)')
p(doc, 'Four-card grid explaining the scoring components: Benefit (max 50), Priority (max 25), Captured Consequence (max 15), Decision Band (max 10).')

h3(doc, 'Sections 5\u20137: Demand Tables and Decision Log')
p(doc, 'Demand Prioritized (open, with BUR/Platform/Priority filters), Demand Not Funded (open), Decision Log with source metadata and refresh controls (collapsed).')

# Tab 3/4
h2(doc, '4.3 Tabs 3 and 4: Enterprise Wide and BU Led')
p(doc, 'Independently editable views of the same portfolio, scoped to their respective demand streams.')

h3(doc, 'Section 1: Stream KPIs')
p(doc, 'Six cards: Programme Demand, Indicative Programme Envelope, Prioritised Demand, Merit Floor, Demand Gap, Submitted Benefits.')

h3(doc, 'Section 2: Filters and Bubble Chart')
p(doc, 'Five cascading checkbox filters: Organisation, Platform, New/Carryover/Sustain, Investment Area, Funding Status. Plus text search. Bubble chart: merit score (x-axis) vs requested investment (log y-axis), bubble size proportional to demand. Compact colour legend only \u2014 no explanatory paragraph.')

h3(doc, 'Section 3: Editable Grouped Table')
p(doc, 'Collapsed Organisation summaries with: child count, funded count, representative Decision Band, average merit, summed financials, evidence count. Expanding reveals programme rows with inline checkboxes and amount inputs. Changes commit immediately and update all tabs.')

# Tab 5
h2(doc, '4.4 Tab 5: Operations')
p(doc, 'Pre-aligned Operations cost-of-ownership, presented as a three-level hierarchy matching the Enterprise Wide table styling.')

h3(doc, 'Section 1: KPI Tiles')
p(doc, 'Six tiles: Total Operations 2027 (469.7 M\u20ac), 2026 Run-Rate (470.7 M\u20ac), \u0394 YoY (-1.0 M\u20ac), BU Own (317.6 M\u20ac), From Regions (63.5 M\u20ac), From Functions (88.5 M\u20ac).')

h3(doc, 'Section 2: Organisation TCO Table (three-level hierarchy)')
p(doc, 'Columns: Organisation, AOP2027 Costs M\u20ac, Own Consumption (M\u20ac | %), Regions to BU (M\u20ac | %), Functions & CoEs (M\u20ac | %), \u0394 vs AOP2026 M\u20ac.')
bullet(doc, 'Level 1 (BU Cluster): Precision Diagnosis, Image Guided Therapy, Connected Care, EI, Personal Health, IP&S, I&D, Regions, Functions. Click \u25b6 to expand.')
bullet(doc, 'Level 2 (Sub-Organisation): CT/AMI, DXR, MR, ULS, etc. Shows service count. Click \u25b6 to expand.')
bullet(doc, 'Level 3 (Services Opted In): Individual service name and AOP2027 cost in M\u20ac. Pre-computed from the Bill of IT AOP2027 Dataset sheet.')
p(doc, 'Organisation and Platform checkbox filters. AOP2027 Costs sort dropdown. Total row: 469.7 M\u20ac.')

h3(doc, 'Section 3: Service Catalog')
p(doc, 'Flat table of all 167 IT services. Columns: Service ID, Service Name, Platform, AOP2027 Costs M\u20ac, 2027 Demand Estimate, AOP2026 Costs M\u20ac, 2026 Demand Estimate. Platform filter and sort dropdown.')

# Tab 6
h2(doc, '4.5 Tab 6: AOP 2027 : One Portfolio')
p(doc, 'The final combined view for leadership sign-off. Merges Programme prioritisation results with Operations costs at the Organisation level.')

h3(doc, 'Section 1: Header KPI Tiles (live from current scenario)')
bullet(doc, 'Total IT AOP: Operations 469.7 M\u20ac + Prioritised Programme AOP.')
bullet(doc, 'Operations AOP: 469.7 M\u20ac (dark tile, pre-aligned).')
bullet(doc, 'Prioritised Programme AOP: funded amount and programme count.')
bullet(doc, 'Split of Programme AOP: EW amount | BU Led amount.')
bullet(doc, 'Committed Benefit: total quantified benefits of funded programmes.')

h3(doc, 'Section 2: Programme Demand Overview')
p(doc, 'Bubble chart showing funded programmes only (unfunded hidden). Median merit line removed. Compact colour legend only. Heading: "AOP2027 : Programme Demand Overview".')

h3(doc, 'Section 3: Organisation IT Cost Allocation')
p(doc, 'Table showing each Organisation\u2019s total IT charge: Programme Funded M\u20ac + Operations Cost M\u20ac = Total IT Charge M\u20ac. Only active Organisations shown (demand > 0 or operations cost > 0). Sort dropdown. Grand Total: 469.7 M\u20ac Operations + Programme funded.')

h3(doc, 'Section 4: Read-Only Programme Table')
p(doc, 'Grouped table from the v3.5 overview, showing all inclusions, exclusions and unfunded requests. No editing controls.')

h3(doc, 'Section 5: Finalise')
p(doc, 'Finalise button freezes the portfolio revision. Fork creates a new editable draft from a finalised scenario.')

# ── Section 5: Prioritisation Engine ──
h1(doc, '5. Prioritisation Engine \u2014 Lever Logic and Funding Order')

h2(doc, '5.1 Five-Stage Funding Precedence')
p(doc, 'Every programme belongs to exactly one funding stage. The engine processes stages in strict order: Legal and Compliance first, Value Based Portfolio last. Within each stage, programmes are ranked and selected as whole initiatives until the stage budget is reached.')

add_table(doc,
    ['Stage', 'Classification Rule', 'Sort Order', 'Funding Control'],
    [
        ['1. Legal & Compliance', 'Overall AOP decision contains P1 Immediate or P2 Scheduled; or source ID is EW-11, EW-65, EW-71.', 'P1 before P2, then exceptions. Within tier: merit score.', 'Slider: % of bucket demand or % of Total AOP.'],
        ['2. Sustain Engineering', 'Source New/Carry-over field equals "Change & Sustain" (case-insensitive).', 'Merit score descending.', 'Slider: % of bucket demand or % of Total AOP.'],
        ['3. Hygiene', 'Category is Continuous Improvement or Upgrades & Enhancements. Decommissioning excluded.', 'Merit score descending.', 'Slider: % of bucket demand or % of Total AOP.'],
        ['4. Carryover', 'Remaining Carry Over demand, excluding decommissioning. Must meet benefit/cost threshold.', 'Benefit/cost ratio desc, then merit.', 'Threshold: 1.0x to 5.0x in 0.5x steps.'],
        ['5. Value Based Portfolio', 'All remaining demand including decommissioning and AI.', 'Evidence strength first, then merit.', 'Automatic residual. No slider.'],
    ])

h2(doc, '5.2 LFR Prioritisation Logic')
p(doc, 'Legal, Fiscal, Regulatory and Compliance obligations receive the highest funding priority. The engine applies the following order within Stage 1:')
bullet(doc, 'P1 Immediate obligations are funded first. These are programmes whose Overall AOP decision field contains "MUST-DO \u2014 P1 \u2014 Immediate".')
bullet(doc, 'P2 Scheduled obligations are funded second. These contain "MUST-DO \u2014 P2 \u2014 Scheduled".')
bullet(doc, 'Three CCB exceptions are funded third: EW-11 (Group Functions), EW-65 (Supply Chain/ISC), EW-71 (Finance). These are classified as Legal/Compliance by their source ID, not by their Overall AOP decision field.')
p(doc, '')
p(doc, 'Within each priority level, programmes with a specific LFR name and compliance year in the source data receive stronger preference. This means a P1 programme with named regulatory evidence (e.g., "ABAC, HCC" with year 2027) will be selected before a P1 programme without such evidence.')
p(doc, '')
p(doc, 'When the LFR directional budget (e.g., 15 M\u20ac in the Optimal Segmentation scenario) is below total LFR demand (34.6 M\u20ac), the engine does not reduce all LFR programmes proportionally. It funds whole programmes in priority order and stops when the budget cap is reached. Unfunded LFR programmes remain in the ranked backlog with their cost-of-not-doing visible.')

h2(doc, '5.3 Sustain and Hygiene Combined Pool')
p(doc, 'In the recommended scenario, Sustain Engineering and Hygiene share a combined directional budget (e.g., 20 M\u20ac). The engine funds full eligible Sustain demand first, then allocates the remaining budget to Hygiene programmes ranked by merit. Programmes without benefit or impact evidence are held outside automatic selection.')

h2(doc, '5.4 Carryover Evidence Requirement')
p(doc, 'Carryover programmes must demonstrate data-backed evidence to receive automatic funding. The engine ranks eligible carryovers by:')
bullet(doc, 'Benefit/cost ratio (highest first)')
bullet(doc, 'Presence of a Payback Period value')
bullet(doc, 'Consequence evidence strength (from Impact and Cost of Not Doing field)')
bullet(doc, 'Merit score')
p(doc, 'Programmes without any of these evidence types are held with an explicit reason: "Missing data-backed evidence (benefit/payback/impact) \u2014 held for explicit review".')

h2(doc, '5.5 Value Based Portfolio')
p(doc, 'Receives the remaining capacity after Stages 1\u20134. Includes decommissioning/replatforming, AI enablement and all other discretionary demand. Ranked by evidence strength first (programmes with both benefit and impact evidence preferred), then merit score. Programmes without evidence are held.')

h2(doc, '5.6 Evidence Hold Mechanism')
p(doc, 'Across all stages, programmes without sufficient evidence are held outside automatic selection. This is not a rejection \u2014 it is a deliberate pause that requires leadership to make an informed decision.')
bullet(doc, 'Held programmes appear with an amber "Held" status badge and their hold reason.')
bullet(doc, 'They can be explicitly included in Tab 3 (Enterprise Wide) or Tab 4 (BU Led) by checking their programme checkbox.')
bullet(doc, 'Explicit inclusion records the rationale and the accountable leader in the decision log.')
bullet(doc, 'This approach maintains data integrity: the engine will not spend budget on programmes that lack the evidence needed to justify the investment.')

h2(doc, '5.7 Scenario Presets')

add_table(doc,
    ['Preset', 'LFR', 'Sustain + Hygiene', 'Carryovers', 'Value', 'Use Case'],
    [
        ['Optimal Segmentation (Recommended)', '15 M\u20ac', '20 M\u20ac', '50 M\u20ac', '15 M\u20ac', 'Finance-recommended 100M spread across the four segmentation buckets.'],
        ['Protect Commitments', '20 M\u20ac', '23 M\u20ac', '50 M\u20ac', '7 M\u20ac', 'Maximise LFR and Sustain coverage; compress Value allocation.'],
        ['Tighten Carryover Evidence', '15 M\u20ac', '20 M\u20ac', '40 M\u20ac', '25 M\u20ac', 'Reduce carryover budget, redirect to evidence-backed value programmes.'],
        ['Release Sustain Capacity', '15 M\u20ac', '12 M\u20ac', '58 M\u20ac', '15 M\u20ac', 'Reduce sustain+hygiene, give more room to high-value carryovers.'],
    ])

h2(doc, '5.8 Merit Score Formula')
p(doc, 'Each programme receives a score from 0 to 100 based on four weighted components:')

add_table(doc,
    ['Component', 'Maximum', 'Scoring Tiers'],
    [
        ['Submitted Benefit', '50 points', 'Benefit/cost ratio: <1x = 0; \u22651x = 20; \u22652x = 30; \u22653x = 40; \u22655x = 50.'],
        ['Submitted Priority', '25 points', 'Must Do = 25; Must Have = 18; Deprioritised = 5; blank = 0.'],
        ['Captured Consequence', '15 points', 'No evidence = 0; contextual = 5; explicit harm + stakeholder = 10; + quantified/enterprise = 15.'],
        ['Decision Band', '10 points', 'Healthy = 10; Contain = 6; blank/other = 0.'],
    ])

# ── Section 6: Operations Data Model ──
h1(doc, '6. Operations Data Model')

h2(doc, '6.1 Data Sources')
bullet(doc, 'Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx: 167 IT business services across 16 IT departments.')
bullet(doc, 'Comparable AOP2027 sheet: BU-level TCO breakdown showing own consumption, region allocation and function allocation per BU cluster and sub-organisation.')
bullet(doc, 'AOP2027 Dataset sheet: Per-service consumption and cost data for each of 36 sub-organisations.')

h2(doc, '6.2 Cost Allocation Principles')
bullet(doc, '1. BU own consumption is based on service consumption data per BU.')
bullet(doc, '2. Region-to-BU allocation keys are calculated from cost-centre-to-BU assignments weighted by employee count.')
bullet(doc, '3. Function-to-BU allocation keys come from FP&A AOP function cost allocations.')
bullet(doc, '4. HS Services and Marketing CoEs are allocated by Share of Revenue normalised to HS BUs.')
bullet(doc, '5. If a service is not used by a BU (0/1 flag), no cost is allocated from Regions or Functions.')

h2(doc, '6.3 Organisation-to-Operations Mapping')
p(doc, 'Each Programme Organisation maps to a specific TCO sub-organisation entry. Organisations that are cost allocators (Functions, Regions, corporate departments) show zero direct Operations cost because their costs are already embedded in BU TCO numbers.')

add_table(doc,
    ['Programme Organisation', 'TCO Entry', 'AOP2027 Cost M\u20ac'],
    [
        ['Precision Diagnosis - Magnetic Resonance (MR)', 'MR', '38.0'],
        ['Precision Diagnosis - Computed Tomography (CT)', 'CT/AMI', '25.3'],
        ['Precision Diagnosis - Ultrasound (PDU)', 'ULS', '38.1'],
        ['Precision Diagnosis - DXR', 'DXR', '11.7'],
        ['Image Guided Therapy - Devices (IGT-D)', 'IGT-D', '33.4'],
        ['Image Guided Therapy - Systems (IGT-S)', 'IGT-S', '51.5'],
        ['Monitoring - HPM (MCH)', 'HPM', '60.1'],
        ['Sleep & Respiratory Care (SRC)', 'SRC', '32.7'],
        ['Ambulatory Monitoring & Diagnostics (AM&D)', 'AMD', '9.1'],
        ['Enterprise Informatics (EI)', 'EI', '34.1'],
        ['Personal Health (PH)', 'PH', '75.9'],
        ['IP & Standards (IP&S)', 'IP&S', '4.6'],
        ['Innovation and Design', 'I&D', '9.7'],
        ['Functions / Regions / ISC / STO', '\u2014 (cost allocators)', '0.0'],
    ])

h2(doc, '6.4 IT Department to Platform Mapping')

add_table(doc,
    ['Dept Code', 'Platform'],
    [
        ['AN3', 'Security, Risk & Compliance'],
        ['AN4, AN5, AN7, AN8, AX7, B72', 'Infrastructure Services'],
        ['AN6, AN9', 'Portfolio & Regions'],
        ['AX9', 'Services & Solutions IT'],
        ['B77, I91', 'Ent. Architecture, Data & Integration'],
        ['B84', 'Vendor & Software Asset Management'],
        ['BL8', 'Commercial IT'],
        ['BL9', 'Integrated Supply Chain and Finance'],
        ['BM0', 'Group Functions and Hyperautomation'],
        ['BM1', 'Innovation and Digital IT'],
    ])

# ── Section 7: Design Specification ──
h1(doc, '7. Design Specification')

add_table(doc,
    ['Element', 'Specification'],
    [
        ['Primary colour', '#0B5ED7 (Philips blue)'],
        ['Dark colour', '#00126E (navy, headings, KPI values)'],
        ['Light colour', '#BDF0FF (active states, total rows)'],
        ['Background', '#FAFBFC (page), #FFFFFF (cards)'],
        ['Border', '#D5DAE0'],
        ['Status: funded', '#008800 green / #ADFFB5 background'],
        ['Status: partial/TBD', '#FCA708 amber / #FCFCC2 background'],
        ['Status: unfunded', '#D43F44 red / #FFDEDB background'],
        ['Font', 'Neue Frutiger World, Calibri, Segoe UI, Arial'],
        ['Table headers', '11px white on dark/blue, sticky position, letter-spacing 0.3px'],
        ['Table cells', '12px, padding 10\u201314px, right-aligned numbers with tabular-nums'],
        ['KPI cards', 'White background, 4px left border in primary colour, shadow'],
        ['Bubble chart', 'Merit x-axis (0\u2013100), log investment y-axis, bubble area = demand'],
        ['Responsive', 'Tested at 1440\u00d7900 and 1920\u00d71080'],
    ])

# ── Section 8: Acceptance ──
h1(doc, '8. Release Acceptance')

add_table(doc,
    ['Area', 'Measurable Outcome'],
    [
        ['Financial consistency', 'Every visible total reconciles across all six tabs and the Excel export.'],
        ['Cross-tab propagation', 'A programme edit in Tab 3 or Tab 4 updates Tabs 1, 2, and 6 within 500ms.'],
        ['Operations accuracy', 'TCO totals match the Comparable AOP2027 sheet: PD 146.9, IGT 90.6, CC 108.0, EI 34.1, PH 75.9, IP&S 4.6, I&D 9.7 M\u20ac.'],
        ['Three-level drill-down', 'Expanding PD \u2192 CT/AMI \u2192 Services shows 112 services totalling 14.4 M\u20ac.'],
        ['Filter dynamics', 'Checkbox filters cascade counts, update total row, and work with sort. Clear All restores full view.'],
        ['One Portfolio', 'Organisation allocation table shows correct Programme funded + Operations cost per org. Grand total = 469.7 + Programme funded.'],
        ['Evidence holds', 'Programmes without evidence show amber "Held" status with reason. Explicit inclusion logs rationale.'],
        ['Scenario presets', 'Optimal Segmentation produces \u224815M LFR + 20M Sustain/Hygiene + 50M Carry + 15M Value \u2248 100M.'],
    ])

doc.save('C:/Users/320126040/Documents/Codex/AOP2027/PRD/AOP2027-OnePortfolio-PRD-v4.3.docx')
print("PRD saved.")

# ============================================================
# DOCUMENT 2: REQUIREMENTS
# ============================================================
print("\nCreating Requirements v4.3...")
doc2 = Document()
style2 = doc2.styles['Normal']
style2.font.name = 'Calibri'
style2.font.size = Pt(10)

doc2.add_heading('AOP 2027 One Portfolio Dashboard', level=0)
doc2.add_heading('Detailed Requirements', level=0)
p(doc2, 'Version 4.3 | 21 September 2026 | Companion to Product Requirements')

h1(doc2, '1. Source Snapshot')
add_table(doc2,
    ['Measure', 'Value'],
    [
        ['Programme source', '17926_IT AOP2027 Demand.xlsx'],
        ['Programme rows', '521 demand rows'],
        ['Programme demand', '280.2 M\u20ac (EW 111.7 + BU 168.5)'],
        ['Operations source', 'Frozen Preliminary AOP2027 Bill of IT - 15.Sep.xlsx'],
        ['Operations total', '469.7 M\u20ac (167 services, 16 IT departments)'],
        ['Service sub-orgs', '36 sub-organisations with service-level consumption data'],
        ['Decision Band', 'Healthy, Contain, and blank across 521 rows'],
        ['Evidence gaps', 'Payback, Qualitative Benefits, Quantitative Benefits due 24 Sep 2026'],
    ])

h1(doc2, '2. Requirement Groups')
p(doc2, 'NAV: navigation. SC: scenario. MET: metrics. RULE: funding rules. SCORE: merit. CONF: portfolio edits. FIL: filters. DATA: source data. OPS: operations. SAVE: persistence. EXP: exports. UX: design. AT: acceptance tests.')

# NAV
h1(doc2, '3. Navigation Requirements')

reqs_nav = [
    ['NAV-01', 'Six Tabs', 'Render exactly: Demand Overview, Program AOP Scenarios, Enterprise Wide, BU Led, Operations, AOP 2027 : One Portfolio. Demand Overview opens first.', 'All six tabs visible and navigable. Keyboard focus works.'],
    ['NAV-02', 'Workflow Bar', 'Six-step horizontal workflow bar: 1 Demand Overview \u2192 2 Program Scenarios \u2192 3 Enterprise Wide \u2192 4 BU Led \u2192 5 Operations \u2192 6 One Portfolio. Active step highlighted in light blue. Finalised step shows green.', 'Workflow reflects active tab.'],
    ['NAV-03', 'Tab Independence', 'No tab requires completion of another. Tabs 3 and 4 are independently editable views of the same scenario.', 'Editing BU Led does not require Enterprise Wide completion.'],
    ['NAV-04', 'Shared Scenario', 'One shared scenario across all tabs. Programme edits in any tab update all other tabs immediately.', 'Edit in Tab 3 reflects in Tab 2 KPIs within 500ms.'],
    ['NAV-05', 'Filter Isolation', 'Filter state is local to each tab. Filtering in Tab 3 does not affect Tab 4 or Tab 1.', 'Separate filter state per tab.'],
    ['NAV-06', 'No Funding on Navigate', 'Switching tabs never creates a decision event or changes funding.', 'Tab switch triggers no allocation change.'],
]
add_table(doc2, ['ID', 'Title', 'Description', 'Acceptance Criteria'], reqs_nav)

# FIL
h1(doc2, '4. Filter and Sort Requirements')

reqs_fil = [
    ['FIL-01', 'Checkbox Multi-Select', 'All filters use checkbox dropdowns with multi-select. Selected values combine with OR within a field, AND across fields.', 'Selecting 2 organisations shows both; adding a platform filter narrows further.'],
    ['FIL-02', 'Cascading Counts', 'When Organisation filter is active, Platform filter counts update to show only the number of rows matching the Organisation selection (and vice versa).', 'Select "Commercial IT" platform \u2192 Organisation filter shows updated counts.'],
    ['FIL-03', 'Dynamic Total Row', 'The total row at the bottom of each filtered table updates count and financial totals to reflect only visible rows.', 'Filter to 2 orgs \u2192 total shows sum of those 2 orgs only.'],
    ['FIL-04', 'Clear All', 'A Clear All button resets all filters for the table and restores the unfiltered view.', 'Click Clear All \u2192 all rows visible, counts reset to full.'],
    ['FIL-05', 'Sort Dropdown', 'A dropdown provides sort options appropriate to each table. Sorting works on the currently filtered view.', 'Select "Programme Demand High\u2192Low" \u2192 rows reorder by demand descending.'],
    ['FIL-06', 'EW/BU Filters', 'Tabs 3 and 4 use five cascading checkbox filters: Organisation, Platform, Demand Type, Investment Area, Funding Status. Plus text search.', 'Cascade: Organisation constrains Platform options.'],
    ['FIL-07', 'Operations Filter', 'Tab 5 TCO table has Organisation and Platform checkbox filters. Service Catalog has Platform filter.', 'Filter to "Precision Diagnosis" \u2192 only PD rows visible.'],
    ['FIL-08', 'One Portfolio Sort', 'Tab 6 allocation table has sort dropdown: Programme Funded, Operations Cost, Total IT.', 'Sort by Total IT \u2192 rows reorder.'],
]
add_table(doc2, ['ID', 'Title', 'Description', 'Acceptance Criteria'], reqs_fil)

# OPS
h1(doc2, '5. Operations Requirements')

reqs_ops = [
    ['OPS-01', 'Three-Level Hierarchy', 'Operations TCO table uses three collapsible levels: BU Cluster \u2192 Sub-Organisation \u2192 Services Opted In.', 'Click PD \u25b6 \u2192 shows MR, CT, DXR, ULS, PD-Other. Click MR \u25b6 \u2192 shows 120 services.'],
    ['OPS-02', 'TCO Columns', 'Table columns: Organisation, AOP2027 Costs M\u20ac, Own Consumption (M\u20ac | %), Regions to BU (M\u20ac | %), Functions & CoEs (M\u20ac | %), \u0394 vs AOP2026 M\u20ac.', 'Percentages shown inline. Cluster row shows bold total.'],
    ['OPS-03', 'Service Drill-Down', 'Level 3 shows individual services with Service Name and AOP2027 Cost in M\u20ac. Pre-computed from AOP2027 Dataset sheet using the AOP Use (1/0) flag.', 'CT/AMI shows 112 services. First service: SE002097 Data Center in a Box.'],
    ['OPS-04', 'Service Catalog', 'Flat table of all 167 services with columns: Service ID, Service Name, Platform, AOP2027 Costs M\u20ac, 2027 Demand Estimate, AOP2026 Costs M\u20ac, 2026 Demand Estimate.', 'Platform filter works. Sort by AOP2027 costs.'],
    ['OPS-05', 'Platform Mapping', 'Each service maps to a Platform via its IT Dept code using the defined mapping table.', 'Service in dept AN4 shows as "Infrastructure Services".'],
    ['OPS-06', 'Pre-Aligned', 'Operations data is static and pre-aligned. No edits flow to other tabs.', 'Changing a programme in Tab 3 does not affect Tab 5.'],
    ['OPS-07', 'Total Accuracy', 'Grand total row shows 469.7 M\u20ac for AOP2027 Costs. Cluster totals match Comparable AOP2027 sheet exactly.', 'PD = 146.9, IGT = 90.6, CC = 108.0, EI = 34.1, PH = 75.9.'],
    ['OPS-08', 'EW-Style Rendering', 'TCO table uses the same CSS classes as the Enterprise Wide programme table (burf-table, burf-summary, programme-row).', 'Visual consistency between Tab 3 and Tab 5.'],
]
add_table(doc2, ['ID', 'Title', 'Description', 'Acceptance Criteria'], reqs_ops)

# UX
h1(doc2, '6. UX Design Specifications')

h2(doc2, '6.1 Colour Tokens')
add_table(doc2,
    ['Token', 'Value', 'Usage'],
    [
        ['--blue', '#0B5ED7', 'Primary actions, active tab, table headers, slider accent'],
        ['--dk', '#00126E', 'Headings, KPI values, dark tiles, TCO table headers'],
        ['--lt', '#BDF0FF', 'Total row backgrounds, hover states, active workflow step'],
        ['--bg', '#FAFBFC', 'Page background'],
        ['--card', '#FFFFFF', 'Card/panel backgrounds'],
        ['--border', '#D5DAE0', 'Card borders, filter borders, table cell separators'],
        ['--mist', '#E8EDF2', 'Even row stripes, group summary backgrounds'],
        ['--prot / --protbg', '#008800 / #ADFFB5', 'Funded status, positive deltas'],
        ['--disc / --discbg', '#FCA708 / #FCFCC2', 'Partial scope, TBD badges, amber status'],
        ['--weak / --weakbg', '#D43F44 / #FFDEDB', 'Unfunded status, negative deltas, danger'],
    ])

h2(doc2, '6.2 Typography')
add_table(doc2,
    ['Element', 'Font', 'Size', 'Weight', 'Notes'],
    [
        ['Body text', 'Calibri / Neue Frutiger World', '12\u201313px', '400', 'Line-height 1.5'],
        ['Card heading', 'Same stack', '14px', '700', 'Dark colour'],
        ['KPI value', 'Same stack', '25\u201326px', '300', 'Dark colour'],
        ['KPI label', 'Same stack', '10\u201311px', '700', 'Secondary text colour'],
        ['Table header', 'Same stack', '10\u201311px', '700', 'White on blue/dark, letter-spacing 0.3px'],
        ['Table cell', 'Same stack', '11\u201312px', '400', 'Right-align numbers, tabular-nums'],
        ['Filter summary', 'Same stack', '11px', '600', 'Dark colour'],
        ['Filter option', 'Same stack', '11px', '400', 'With checkbox'],
        ['TBD badge', 'Same stack', '10px', '700', 'Amber bg, #715800 text'],
    ])

h2(doc2, '6.3 Spacing')
add_table(doc2,
    ['Element', 'Value'],
    [
        ['Card grid gap', '16\u201320px'],
        ['Card padding', '18\u201320px horizontal, 20\u201324px vertical'],
        ['Card border-radius', '6px'],
        ['Table cell padding', '10\u201314px'],
        ['Organisation column width', '22\u201335% (fixed)'],
        ['Numeric column width', '16% (fixed)'],
        ['Filter dropdown min-width', '120px (trigger), 230px (panel)'],
        ['Sub-org indent', '28px padding-left'],
        ['Service indent', '56px padding-left'],
        ['KPI card min-height', '106px'],
        ['Bubble chart max-height', '480px'],
    ])

h2(doc2, '6.4 Table Styling')
bullet(doc2, 'Sticky headers with z-index 2.')
bullet(doc2, 'First column and header corner cell sticky-left with higher z-index.')
bullet(doc2, 'Even rows: #f6f9fd background.')
bullet(doc2, 'Hover: #BDF0FF background.')
bullet(doc2, 'Group summary rows: #F8FAFC background, bold 600 weight.')
bullet(doc2, 'Total rows: var(--lt) background, bold 700 weight.')

h2(doc2, '6.5 Filter Component')
bullet(doc2, 'Uses HTML <details>/<summary> for collapsible dropdown.')
bullet(doc2, 'Summary shows "Label: All" or "Label: N selected".')
bullet(doc2, 'Options panel: absolute positioned, shadow, max-height 250px with scroll.')
bullet(doc2, 'Each option: checkbox + label text + count badge in parentheses.')

# AT
h1(doc2, '7. Acceptance Tests')

reqs_at = [
    ['AT-01', 'Source baseline', '521 programme rows and 280.2 M\u20ac demand load without errors. 167 operations services and 469.7 M\u20ac load correctly.'],
    ['AT-02', 'Stage precedence', 'P1/P2 and CCB exceptions (EW-11, EW-65, EW-71) classified as Stage 1. Sustain by source field only. Decommissioning in Stage 5.'],
    ['AT-03', 'Whole allocation', 'At 100 M\u20ac envelope, Optimal Segmentation produces ~15M LFR + 20M Sustain/Hygiene + 50M Carry + 15M Value.'],
    ['AT-04', 'Manual addition', 'Include an unfunded programme in Tab 3 \u2192 all tabs update, over-budget variance visible.'],
    ['AT-05', 'Cross-tab propagation', 'Amount edit in Tab 4 \u2192 Tab 2 KPIs, Tab 1 demand split, Tab 6 allocation update within 500ms.'],
    ['AT-06', 'Filter dynamics', 'Select Organisation \u2192 Platform counts update. Total row reflects filtered view. Clear All restores.'],
    ['AT-07', 'Operations 3-level', 'Expand PD \u2192 5 sub-orgs. Expand CT/AMI \u2192 112 services. First service: SE002097.'],
    ['AT-08', 'Operations totals', 'PD=146.9, IGT=90.6, CC=108.0, EI=34.1, PH=75.9, IP&S=4.6, I&D=9.7. Grand=469.7.'],
    ['AT-09', 'One Portfolio KPIs', 'Total IT AOP = 469.7 + programme funded. Updates live when scenario changes.'],
    ['AT-10', 'One Portfolio chart', 'Shows funded programmes only. No median line. Compact colour legend.'],
    ['AT-11', 'Allocation table', 'Only active orgs. Grand total = 469.7 + programme funded. Sort works.'],
    ['AT-12', 'Persistence', 'Save/reopen reproduces exact scenario. IndexedDB key: Philips-AOP2027-v4.3.'],
    ['AT-13', 'Visual fidelity', 'Philips colour palette, Frutiger/Calibri fonts, sticky headers, responsive at 1920\u00d71080.'],
]
add_table(doc2, ['ID', 'Test', 'Acceptance Condition'], reqs_at)

doc2.save('C:/Users/320126040/Documents/Codex/AOP2027/PRD/AOP2027-OnePortfolio-Requirements-v4.3.docx')
print("Requirements saved.")
print("\nBoth documents created successfully.")
