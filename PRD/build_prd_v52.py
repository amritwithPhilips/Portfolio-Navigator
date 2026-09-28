import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

def set_font(run, size=11, bold=False, color=None):
    run.font.name = 'Calibri'
    run.font.size = Pt(size)
    run.font.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)

def heading(text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.name = 'Calibri'
    return p

def body(text, bold=False, size=11):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_font(run, size=size, bold=bold)
    return p

def bullet(text, level=1):
    style = 'List Bullet' if level==1 else 'List Bullet 2'
    p = doc.add_paragraph(style=style)
    run = p.add_run(text)
    set_font(run, size=10.5)
    return p

def shd_cell(cell, fill='0B5ED7'):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill)
    tcPr.append(shd)

def add_header_row(tbl, headers):
    row = tbl.rows[0]
    for i, h in enumerate(headers):
        cell = row.cells[i]
        cell.text = ''
        run = cell.paragraphs[0].add_run(h)
        set_font(run, size=9, bold=True, color=(255,255,255))
        shd_cell(cell)

def add_row(tbl, values, shade=False):
    row = tbl.add_row()
    for i, v in enumerate(values):
        cell = row.cells[i]
        cell.text = ''
        run = cell.paragraphs[0].add_run(str(v))
        set_font(run, size=9)
        if shade:
            shd_cell(cell, 'F0F4F8')
    return row

# ---- TITLE ----
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('AOP 2027 Modeler Product Requirements')
r.font.name = 'Calibri'; r.font.size = Pt(20); r.font.bold = True
r.font.color.rgb = RGBColor(0, 18, 110)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r2 = p2.add_run('Version 5.2  |  25 September 2026  |  ExCo Accountability + Benefits Classification + Trade-off Cockpit')
set_font(r2, size=11, color=(74, 85, 104))
doc.add_paragraph()

body('Version 5.2 supersedes v5.0. Adds the ExCo Accountability Hierarchy, Hard/Soft Benefit Classification, ExCo Trade-off Cockpit, Global ExCo Filter, Total AOP Protection, Bubble Chart redesign, Demand in Scenario table rebuild, and comprehensive Tab-by-Tab Element Reference. Engine v5.2.0. Session schema 4.', size=11)

# ============================================================
# SECTION 1 — Product Scope
# ============================================================
heading('1. Product Scope', 1)

heading('1.1 Modeler state', 2)
body('Standalone offline HTML: AOP2027-IT-Portfolio-Scenario-Modelling-v5.2.html. Six tabs. Engine v5.2.0. Session schema 4 (5 weights). No server or database.')

heading('1.2 Six-tab structure', 2)
tbl = doc.add_table(rows=1, cols=4); tbl.style = 'Table Grid'
add_header_row(tbl, ['Tab', 'Name', 'Editable', 'Purpose'])
rows = [
    ('1','Demand Overview','No','KPIs: Total IT AOP Demand, programme demand, operations, committed benefits (Hard/Soft), IT AOP 2026. Demand Split by ExCo with collapsible org groups.'),
    ('2','Program AOP Scenarios','Levers only','Four priority levers, Funding Prioritization Gate, Merit Score Framework, Demand in Scenario table (collapsible BURF groups, Prioritised/Not Funded toggle), decision log.'),
    ('3','Functions & Regions','Yes','EW programmes. Editable allocation. ExCo/Org/Platform cascading filters, bubble chart with Y-axis toggle, ExCo Trade-off Cockpit.'),
    ('4','BU Led','Yes','BU programmes. Same layout as Tab 3. Shares one scenario with Tab 3. ExCo Trade-off Cockpit.'),
    ('5','Operations','No','TCO 3-level hierarchy, service catalog. Pre-aligned costs; read-only.'),
    ('6','AOP 2027 : One Portfolio','No','Combined programme + operations. Finalise, New Working Version. Org IT Cost Allocation table with filters. Bubble chart with Y-axis toggle.'),
]
for i, r in enumerate(rows): add_row(tbl, r, shade=(i%2==1))
doc.add_paragraph()

heading('1.3 Source authority', 2)
bullet('Authoritative demand: AOP 2027 Consolidated Live.xlsx (SharePoint ITPFM site).')
bullet('472 demand rows (EW 176, BU 296), 285.1 M€ total demand.')
bullet('Enterprise-wide charging row (40 M€, Item BU) excluded from all demand totals; stored as ewChargingKey for Tab 6 EW split calculation.')
bullet('Operations snapshot: 167 services embedded. Bill of IT Platform Service List (23 Sep): 174 services.')

# ============================================================
# SECTION 2 — ExCo Accountability Hierarchy
# ============================================================
heading('2. ExCo Accountability Hierarchy', 1)

heading('2.1 Structure', 2)
body('16 ExCo members mapped to all 35 organisation values. Dictionary: EXCO_HIERARCHY with role, segment, orgs[]. Reverse lookup: ORG_TO_EXCO. Fuzzy match: excoOf() for whitespace/encoding differences.')
body('Every enriched programme row carries an exco field. Regional leaders (IR/NAM/GCR) club BU+EW demand together.')

heading('2.2 BU Leaders (10)', 2)
tbl2 = doc.add_table(rows=1, cols=3); tbl2.style = 'Table Grid'
add_header_row(tbl2, ['ExCo Leader', 'Segment', 'Organisations'])
bu_leaders = [
    ('Deeptha Khanna', 'Personal Health', 'PH'),
    ('Shez Partovi', 'Enterprise Informatics', 'EI, I&D (Innovation & Design)'),
    ('Julia Strandberg', 'Connected Care', 'HPM, AM&D, SRC'),
    ('Jie Xue', 'Precision Diagnosis', 'CT, DXR, MR, PDU'),
    ('Bert van Meurs', 'Image Guided Therapy', 'IGT-S, IGT-D, STO'),
    ('Wim Appelo', 'Integrated Supply Chain', 'ISC, STET-ISC'),
    ('Ozlem Fidanci', 'International Regions', 'IR, Health & Safety'),
    ('Jeff DiLullo', 'North America', 'NAM'),
    ('Ling Liu', 'Greater China', 'GCR'),
    ('Charlotte Hanneman', 'Finance & Group Security', 'Finance, Group Security'),
]
for i, r in enumerate(bu_leaders): add_row(tbl2, r, shade=(i%2==1))
doc.add_paragraph()

heading('2.3 Enterprise Function Leaders (6)', 2)
tbl3 = doc.add_table(rows=1, cols=3); tbl3.style = 'Table Grid'
add_header_row(tbl3, ['ExCo Leader', 'Segment', 'Organisations'])
ent_leaders = [
    ('Laura Matz', 'IT', 'IT'),
    ('Heidy Schein', 'People', 'People'),
    ('Steve C de Baca', 'Patient Safety & Quality', 'PS&Q'),
    ('Carla Silva Peron', 'Medical Office', 'Medical Office'),
    ('Filip Koek', 'Internal Audit', 'Internal Audit'),
    ('Marnix van Ginneken', 'Legal, Comms & Brand, IP&S', 'Legal, Comms & Brand, IP&S'),
]
for i, r in enumerate(ent_leaders): add_row(tbl3, r, shade=(i%2==1))
doc.add_paragraph()

heading('2.4 Engine integration', 2)
bullet('EXCO_HIERARCHY: dictionary keyed by leader name. Each entry: {role, segment, orgs:[]}.')
bullet('ORG_TO_EXCO: reverse lookup from any of the 35 org values to ExCo leader name.')
bullet('excoOf(orgName): fuzzy match function handling whitespace/encoding differences.')
bullet('enrich() adds exco field to every programme row.')
bullet('filter() supports exco dimension for cascading filters.')

# ============================================================
# SECTION 3 — Hard/Soft Benefit Classification
# ============================================================
heading('3. Hard/Soft Benefit Classification', 1)

heading('3.1 classifyBenefit() function', 2)
body('New engine function classifies each programme into one of four benefit categories:')
tbl4 = doc.add_table(rows=1, cols=3); tbl4.style = 'Table Grid'
add_header_row(tbl4, ['Classification', 'Criteria', 'Label'])
ben_rows = [
    ('Hard', 'benefit > 0 AND area in {Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain}', 'Hard Benefit'),
    ('Soft', 'benefit > 0 AND area in {Compliance/Keeping the lights on, Security} or other areas not in Hard set', 'Soft Benefit'),
    ('Qualitative', 'No numeric benefit but has impact text or problem statement', 'Qualitative Only'),
    ('None', 'No benefit data of any kind', 'No Benefit Data'),
]
for i, r in enumerate(ben_rows): add_row(tbl4, r, shade=(i%2==1))
doc.add_paragraph()

heading('3.2 Enriched fields', 2)
bullet('benefitClass: "hard" | "soft" | "qualitative" | "none"')
bullet('benefitClassLabel: human-readable label for display')
bullet('benefitFlag: data quality flag (if applicable)')

heading('3.3 Data quality flags', 2)
tbl5 = doc.add_table(rows=1, cols=3); tbl5.style = 'Table Grid'
add_header_row(tbl5, ['Flag', 'Condition', 'Action'])
flags = [
    ('K EUR suspect', 'Impact text value equals benefit amount x 1000', 'Warning; manual review recommended'),
    ('Outlier', 'Benefit amount > 100 M€', 'Warning; flagged for review'),
    ('High ratio', 'Benefit/cost ratio > 10x', 'Hold; inline review required'),
    ('No business case', 'No numeric benefit, no qualitative text, no impact', 'Flag; scored 0'),
]
for i, r in enumerate(flags): add_row(tbl5, r, shade=(i%2==1))
doc.add_paragraph()

heading('3.4 Display across tabs', 2)
bullet('Tab 1: "Committed Benefits" KPI shows Hard (green) / Soft (amber) separately.')
bullet('Tab 2: Allocated AOP KPI shows "On top off" indicator when allocation exceeds Total AOP.')
bullet('Tabs 3 & 4: "Committed Hard Benefits" KPI with Hard/Soft breakdown in subtitle.')
bullet('Tab 6: "Committed Benefits" shows Hard/Soft split.')
bullet('Bubble chart tooltip: shows benefit classification label (Hard Benefit / Soft Benefit / Qualitative Only / No Benefit Data).')
bullet('Chart summary line: "Committed: X Hard . Y Soft" replaces single combined number.')
bullet('ExCo Demand table: org sub-rows and grand total show Hard/Soft columns.')

# ============================================================
# SECTION 4 — Total AOP Protection
# ============================================================
heading('4. Total AOP Protection', 1)

body('The Total AOP (M€) field changes ONLY via manual user edit. No automated process may modify it.')

heading('4.1 Trade-off Apply behaviour', 2)
bullet('ExCo Trade-off Apply button includes/excludes P4 programmes by merit ranking.')
bullet('Apply does NOT modify the Total AOP budget. It only changes programme inclusion/exclusion.')
bullet('The previous behaviour (Apply increased Total AOP by the sum of trade-off deltas) is removed.')

heading('4.2 "On top off AOP" KPI', 2)
bullet('"On top off AOP" shows the delta between actual allocation and the user-set budget.')
bullet('Tabs 3 & 4: displayed as a separate KPI below the Committed Hard Benefits tile.')
bullet('Tab 2: Allocated AOP shows "On top off: +X M€" (red) when over budget, or "Under budget: X M€" (green) when under.')
bullet('Red indicates over-budget; green indicates under-budget.')

heading('4.3 Manual budget edit', 2)
body('The Total AOP input field on Tab 2 is the ONLY mechanism to change the budget. Presets do not change it. Trade-off Apply does not change it. Only direct user input changes it.')

# ============================================================
# SECTION 5 — ExCo Trade-off Cockpit
# ============================================================
heading('5. ExCo Trade-off Cockpit', 1)

heading('5.1 Position and layout', 2)
body('Located below the filter bar on Tabs 3 (Functions & Regions) and Tab 4 (BU Led). Default state: closed. Opens automatically when trade-off budget values are entered.')

heading('5.2 Per-ExCo leader columns', 2)
tbl6 = doc.add_table(rows=1, cols=2); tbl6.style = 'Table Grid'
add_header_row(tbl6, ['Column', 'Description'])
cockpit_cols = [
    ('Requested', 'Total requested demand for this ExCo leader\'s organisations'),
    ('Funded', 'Currently funded amount from automatic prioritisation + manual overrides'),
    ('Gap', 'Requested minus Funded'),
    ('% Funded', 'Funded / Requested as percentage'),
    ('Hard Ben', 'Sum of Hard benefit amounts for funded programmes'),
    ('Soft Ben', 'Sum of Soft benefit amounts for funded programmes'),
    ('Trade-off Budget', 'User input field: target funding amount for this leader'),
    ('Delta', 'Trade-off Budget minus current Funded (positive = additional funding, negative = reduction)'),
    ('Progs / Benefits impact', 'Programme count + Hard/Soft benefit M€ that would be added or removed'),
]
for i, r in enumerate(cockpit_cols): add_row(tbl6, r, shade=(i%2==1))
doc.add_paragraph()

heading('5.3 Apply and Reset', 2)
bullet('Apply button: includes/excludes P4 programmes by merit score ranking to match the entered trade-off budgets. Creates tracked decisions in the decision log. Does NOT modify Total AOP.')
bullet('Reset button: clears all entered trade-off budget values in one click.')
bullet('Negative trade-offs supported: entering a budget BELOW current funded amount models reductions. Lowest-merit P4 programmes are excluded. Delta shown in red.')
bullet('Batched transact() calls used for Apply to avoid rendering issues.')

heading('5.4 Filter interaction', 2)
body('The trade-off cockpit receives filtered rows from the active tab filters (ExCo, Org, Platform, Funding Status, Type). Filter changes update the cockpit values in real time.')

# ============================================================
# SECTION 6 — Global ExCo Filter
# ============================================================
heading('6. Global ExCo Filter', 1)

body('ExCo Leader is the first filter dropdown on all programme tabs (Tabs 2, 3, 4, and Overview/Tab 6).')

heading('6.1 Cascading behaviour', 2)
bullet('ExCo filter is the first in the cascade chain: ExCo -> Org -> Platform.')
bullet('Selecting an ExCo leader narrows Organisation options to that leader\'s mapped orgs only.')
bullet('Organisation selection further narrows Platform options.')
bullet('AND logic with all other filters (Funding Status, Type, Investment Area, text search).')

heading('6.2 Tabs affected', 2)
bullet('Tab 2: ExCo filter in Demand in Scenario table and Prioritized programme filters.')
bullet('Tab 3: ExCo filter in main filter bar.')
bullet('Tab 4: ExCo filter in main filter bar.')
bullet('Tab 6: ExCo filter in Overview filter bar.')

# ============================================================
# SECTION 7 — Bubble Chart
# ============================================================
heading('7. Bubble Chart', 1)

heading('7.1 Y-axis toggle', 2)
body('Pill-style toggle switch (matching the Prioritised/Not Funded toggle design) replaces the previous dropdown selector.')
bullet('Tabs 3 & 4: toggle between "Requested (M€)" and "Hard Benefits (M€)" on the Y-axis.')
bullet('Tab 6: toggle between "Prioritised (M€)" and "Hard Benefits (M€)".')
bullet('Tab 2: no toggle (scenario tab retains median/merit reference values).')
bullet('Toggle state is session-persistent.')

heading('7.2 Legend', 2)
bullet('Legend moved from below chart to right-side panel.')
bullet('Compact table format showing per-category aggregated M€ values.')

heading('7.3 Summary line', 2)
body('Displayed below the chart heading on Tabs 3, 4, and 6:')
bullet('"X / Y Programmes funded for a total N M€ / M M€ Prioritised AOP 2027 demand with a committed Impact of Z M€"')
bullet('Committed impact text: "Committed: X Hard . Y Soft"')
bullet('Summary refreshes on filter change.')

heading('7.4 Median/merit text', 2)
body('Removed from Tabs 3, 4, and 6. Retained on Tab 2 only.')

# ============================================================
# SECTION 8 — Demand in Scenario Table (Tab 2)
# ============================================================
heading('8. Demand in Scenario Table (Tab 2)', 1)

heading('8.1 Structure', 2)
body('Merged table replacing the separate Demand Prioritized / Demand Not Funded sections. Positioned before the Funding Prioritization Gate.')
bullet('Collapsible BURF organisation groups matching the Tabs 3/4 design pattern.')
bullet('View-only: no editable fields.')
bullet('9 matching columns consistent with EW/BU tables.')

heading('8.2 Toggle switch', 2)
bullet('Pill-style slide switch for Prioritised / Not Funded views.')
bullet('Prioritised is the default view.')
bullet('Teal/blue active state.')

heading('8.3 Filters', 2)
bullet('Cascading filters: ExCo Leader -> Organisation -> Platform.')
bullet('ExCo narrows org options; org narrows platform options.')
bullet('Total row with filtered/unfiltered counts.')
bullet('Benefits total included in Total row.')

# ============================================================
# SECTION 9 — Tab-by-Tab Element Reference
# ============================================================
heading('9. Tab-by-Tab Element Reference', 1)

heading('9.1 Tab 1 — Demand Overview', 2)
body('KPI Tiles (Row 1):', bold=True, size=10)
bullet('Total IT AOP Demand (dark blue): Programme AOP + Operations AOP. Formula: sum(funded) + 469.7 M€.')
bullet('Program Demand: count and M€ of all programme demand rows.')
bullet('Operations: 469.7 M€, service count.')
bullet('IT AOP 2026 (dark): "161.0 M€ Program AOP + 470.7 M€ Operations AOP".')

body('KPI Tiles (Row 2):', bold=True, size=10)
bullet('Committed Benefits: Hard (green) / Soft (amber) split. Formula: sum(benefit) where funded AND benefitClass = hard/soft.')
bullet('2026 Program AOP: 161.0 M€ reference.')
bullet('2026 Operations AOP: 470.7 M€ reference.')

body('Demand Split by ExCo:', bold=True, size=10)
bullet('Collapsible ExCo groups replacing flat organisation list.')
bullet('Per-ExCo row: programme count, requested M€, prioritised M€, gap M€, % funded, hard benefits, soft benefits, operations cost.')
bullet('Click to expand constituent organisations. Colour-coded funding percentage.')

heading('9.2 Tab 2 — Program AOP Scenarios', 2)
body('Section 1 — KPI Cards:', bold=True, size=10)
bullet('Allocated AOP (dark blue): M€ and % of Total AOP, funded count, Within/Over status, "On top off" indicator.')
bullet('Initiatives Funded: count, partial scope count.')
bullet('EW/BU Led Share: split M€ and %.')
bullet('Open to Prioritisation or Over Total AOP: M€, variance text.')
bullet('Demand Left Unfunded: M€, missing request count.')

body('Section 2 — Levers:', bold=True, size=10)
bullet('Total AOP input field (manual edit only).')
bullet('Four preset buttons: Optimal Segmentation (default, blue-highlighted), Protect Commitments, Tighten Carryover Evidence, Release Sustain Capacity.')
bullet('Four lever cards in horizontal desktop layout (4-column grid). Each shows current allocation and fundable demand.')
bullet('Lever 1 (Legal & Compliance): Philips-style tick-mark slider.')
bullet('Lever 2 (Carry Over): RoI threshold slider with input box above allocation text.')
bullet('Lever 3 (Sustain): basis toggle (% bucket / % AOP / M€).')
bullet('Lever 4 (Value): basis toggle.')
bullet('Allocation text centered on all levers, single-line nowrap.')

body('Section 3 — Demand in Scenario Table:', bold=True, size=10)
bullet('Collapsible BURF groups. Pill toggle: Prioritised / Not Funded.')
bullet('Cascading ExCo -> Org -> Platform filters.')

body('Section 4 — Funding Prioritization Gate:', bold=True, size=10)
bullet('5 cards: Gate 0 + four priorities. Gate number and name inline. Bullet-list definitions at 10pt.')

body('Section 5 — Merit Score Framework:', bold=True, size=10)
bullet('5 component cards in single row (5-column grid).')
bullet('Components: Benefit Strength (40%), Submitted Priority (25%), Captured Consequence (15%), Decision Band (10%), Payback Period (10%).')

body('Section 6 — Decision Log:', bold=True, size=10)
bullet('3 columns: Revision/Time, Change Origin, Change Details (business-readable 1-liner).')

heading('9.3 Tab 3 — Functions & Regions', 2)
body('Filter bar:', bold=True, size=10)
bullet('ExCo Leader, Organisation, Platform, New/Carryover/Sustain, Investment Area, Funding Status, text search, Download Excel.')

body('ExCo Trade-off Cockpit:', bold=True, size=10)
bullet('Below filter bar. Default closed. Per-ExCo leader: Requested, Funded, Gap, % Funded, Hard Ben, Soft Ben, Trade-off Budget, Delta, Progs/Benefits impact.')
bullet('Apply and Reset buttons.')

body('KPI Tiles:', bold=True, size=10)
bullet('Committed Hard Benefits: Hard/Soft breakdown in subtitle.')
bullet('"On top off AOP": delta between allocation and budget.')

body('Bubble Chart:', bold=True, size=10)
bullet('Y-axis pill toggle: Requested / Hard Benefits.')
bullet('Legend: right-side panel with per-category M€.')
bullet('Summary line below heading.')

body('Programme Table:', bold=True, size=10)
bullet('BURF summary rows collapsed by default. Editable allocation column.')
bullet('Sticky first column and header.')

heading('9.4 Tab 4 — BU Led', 2)
body('Identical layout to Tab 3. Same ExCo Trade-off Cockpit, filters, chart, and table structure. Shares one scenario with Tab 3.')

heading('9.5 Tab 5 — Operations', 2)
body('KPI Tiles (6):', bold=True, size=10)
bullet('Total Operations 2027: 469.7 M€. 2026 Run-Rate: 470.7 M€. Delta YoY: -1.0 M€.')
bullet('BU Own: 317.6 M€. From Regions: 63.5 M€. From Functions: 88.5 M€.')

body('TCO Table:', bold=True, size=10)
bullet('3-level collapsible hierarchy: BU Cluster -> Sub-Organisation -> Services.')
bullet('Columns: Organisation, AOP2027 Costs M€, Own Consumption (M€|%), Regions to BU (M€|%), Functions & CoEs (M€|%), Delta vs AOP2026 M€.')
bullet('Delta colour: positive = red, negative = green.')
bullet('Organisation and Platform filters with cascading counts. X of Y on total.')

body('Service Catalog:', bold=True, size=10)
bullet('Columns: Service ID, Service Name, Platform Name, AOP2027 Costs M€, AOP2026 Costs M€, Delta vs AOP2026 M€.')
bullet('Delta colour: positive = red, negative = green.')
bullet('Platform filter. X of Y on AOP2027 and AOP2026 totals when filtered.')

heading('9.6 Tab 6 — AOP 2027 : One Portfolio', 2)
body('KPI Tiles (5 in one row, repeat(5,1fr) grid):', bold=True, size=10)
bullet('Total IT AOP (dark blue): Programme AOP + Operations AOP.')
bullet('Operations AOP (white): 469.7 M€.')
bullet('Prioritized Program AOP: funded amount.')
bullet('Split of Program AOP: "F&R X | BU Y M€" single-line format.')
bullet('Committed Benefits: Hard/Soft split.')

body('Bubble Chart:', bold=True, size=10)
bullet('Y-axis pill toggle: Prioritised / Hard Benefits.')
bullet('Legend: right-side panel.')
bullet('Summary line: "X / Y Programmes funded... Committed: X Hard . Y Soft".')

body('Buttons:', bold=True, size=10)
bullet('Finalise scenario: freezes revision.')
bullet('New Working Version: performs full reset to Optimal Segmentation.')
bullet('Removed: "Export complete portfolio" and "Export portable scenario" buttons.')

body('Organisation IT Cost Allocation Table:', bold=True, size=10)
bullet('7 BU clusters. Columns: BU Led (M€), Enterprise Wide (M€), Operations (M€), Total.')
bullet('Organisation and Platform filters with X of Y.')

# ============================================================
# SECTION 10 — Prioritization Logic
# ============================================================
heading('10. Prioritization Logic (unchanged from v4.0)', 1)

heading('10.1 Four-Priority Funding Structure', 2)
body('Every demand row is classified into exactly one of four priorities. Gate 0 checks evidence. Classification is deterministic and data-driven.')

tbl10 = doc.add_table(rows=1, cols=5); tbl10.style = 'Table Grid'
add_header_row(tbl10, ['Priority', 'Name', 'Eligibility Gate', 'Funding Order', 'v5.2 Demand'])
p_rows = [
    ('P1','Legal & Compliance\n(Must Do)',
     'LFR Name AND LFR Year populated. OR CCB: EW-11, EW-65, EW-71.',
     'P1 Immediate -> P2 Scheduled -> CCB. Within tier: evidence strength.',
     '75 progs (LFR)'),
    ('P2','Carry Over Demand',
     'New/Carry-over = "Carry Over" AND not LFR. Baseline carry-overs (23 progs, 16.8 M€) always funded.',
     'Baseline carry-overs first, then by RoI threshold slider.',
     '135 progs, 105.9 M€'),
    ('P3','Sustain Engineering\n& Hygiene',
     'Change & Sustain OR Category = Continuous Improvement / Upgrades & Enhancements. No overlap with LFR or Carry Over.',
     'Change & Sustain first (all). Then Hygiene by merit within remaining budget.',
     '84 progs, 34.4 M€'),
    ('P4','Value Based Portfolio',
     'All remaining: new features, AI, decommissioning, LFRs without evidence, carry-overs without baseline.',
     'Evidence strength then merit score.',
     '178 progs, 91.8 M€'),
]
for i, r in enumerate(p_rows): add_row(tbl10, r, shade=(i%2==1))
doc.add_paragraph()

heading('10.2 Evidence Gate 0', 2)
body('Automatic funding holds. See PRD v4.0 Section 2.2 for complete hold conditions (11 hold types). Key changes since v4.0: review threshold at 10.0x (raised from 5.0x in v3.2).')

heading('10.3 Funding Algorithm', 2)
bullet('Sort all rows by priority (P1->P4) then ranking within priority.')
bullet('Fund each eligible row at full requested amount if stage and portfolio budgets have capacity.')
bullet('Stage limit = target x (1 + tolerance/100). Portfolio limit = Total AOP x (1 + tolerance/100).')
bullet('P2: fund at min(Requested, Carry Over Baselined), not full request.')
bullet('Tolerance default: 0.0% (exact budget).')
bullet('Manual overrides after automatic: additions additive; exclusions do not refill silently.')

heading('10.4 Merit Scoring Framework (5 components)', 2)
body('0-100 composite score. Formula: Score = sum(raw_i / max_i x weight_i). Weights must sum to 100.0.')
tbl11 = doc.add_table(rows=1, cols=5); tbl11.style = 'Table Grid'
add_header_row(tbl11, ['#', 'Component', 'Max Raw', 'Default Weight', 'Source Field(s)'])
for i, c in enumerate([
    ('1','Benefit Strength','50 pts','40%','Quantified Benefits (K€); Quantified Benefits Details (text)'),
    ('2','Submitted Priority','25 pts','25%','Priority column'),
    ('3','Captured Consequence','15 pts','15%','Impact and Cost of Not Doing; Problem Statement; Scope'),
    ('4','Decision Band','10 pts','10%','Decision Band / Waste band'),
    ('5','Payback Period','10 pts','10%','Payback Period column'),
]): add_row(tbl11, c, shade=(i%2==1))
doc.add_paragraph()

heading('10.5 Lever Controls', 2)
tbl12 = doc.add_table(rows=1, cols=4); tbl12.style = 'Table Grid'
add_header_row(tbl12, ['Lever', 'Priority', 'Basis Options', 'Default'])
for i, r in enumerate([
    ('1 . Legal & Compliance','P1','% of bucket / % of Total AOP / M€ allocation','Verified demand share (~75%)'),
    ('2 . Carry Over Demand','P2','RoI threshold (10x+ -> 0x)','10x+ (baseline only)'),
    ('3 . Sustain Engineering & Hygiene','P3','% of bucket / % of Total AOP / M€ allocation','60% of bucket'),
    ('4 . Value Based Portfolio','P4','% of bucket / % of Total AOP / M€ allocation','100% of bucket'),
]): add_row(tbl12, r, shade=(i%2==1))
doc.add_paragraph()

heading('10.6 Four Scenario Presets', 2)
tbl13 = doc.add_table(rows=1, cols=5); tbl13.style = 'Table Grid'
add_header_row(tbl13, ['Preset', 'P1: LFR', 'P2: Carry RoI', 'P3: Sustain', 'P4: Value'])
for i, r in enumerate([
    ('Optimal Segmentation (Recommended)','Verified LFR','10x+ (baseline only)','60% bucket','100% bucket'),
    ('Protect Commitments','100% bucket','2.0x','100% bucket','10% AOP'),
    ('Tighten Carryover Evidence','100% bucket','3.0x','75% bucket','15% AOP'),
    ('Release Sustain Capacity','44% bucket','0x','75% bucket','20% AOP'),
]): add_row(tbl13, r, shade=(i%2==1))
doc.add_paragraph()

# ============================================================
# SECTION 11 — Session and Reset
# ============================================================
heading('11. Session and Reset', 1)

heading('11.1 Default scenario', 2)
body('Optimal Segmentation is the default scenario applied on page load. The Optimal preset button is blue-highlighted to indicate active state.')

heading('11.2 New Working Version', 2)
body('The "New Working Version" button (Tab 6) performs a full reset:')
bullet('Applies Optimal Segmentation preset.')
bullet('Clears all manual overrides (include/exclude decisions).')
bullet('Clears all evidence reviews.')
bullet('Clears all ExCo trade-off budget values.')
bullet('Clears the decision log.')
bullet('Resets scenario revision counter.')

heading('11.3 Filter auto-close', 2)
body('All filter dropdowns across all tabs auto-close immediately after a selection is made. This applies to ExCo, Organisation, Platform, Funding Status, Type, Investment Area, and all other multi-select filter dropdowns.')

heading('11.4 Session schema', 2)
body('Session schema 4 (5 weights). Sessions saved with schema 3 (4 weights [50,25,15,10]) auto-migrate to schema 4 ([40,25,15,10,10]) on load.')

# ============================================================
# SECTION 12 — QA and Acceptance Criteria
# ============================================================
heading('12. QA and Acceptance Criteria', 1)

heading('12.1 Core rendering checks', 2)
for c in [
    'All 6 tabs render with zero console errors.',
    '472 programmes processed, no duplicate IDs.',
    'Benefits consistently split as Hard/Soft across all displays (Tabs 1, 2, 3, 4, 6).',
    'ExCo filter cascading works on all programme tabs.',
    'ExCo Trade-off Cockpit Apply does not modify Total AOP.',
    'Demand in Scenario table shows collapsible BURF groups.',
    'Bubble chart Y-axis toggle functional on Tabs 3, 4, 6.',
    'Filter dropdowns auto-close after selection.',
]: bullet(c)

heading('12.2 Financial reconciliation', 2)
for c in [
    'Requested = Final + Unfunded (per programme, per stream, portfolio total; within +/-0.01 M€).',
    'EW Final + BU Final = Portfolio Final.',
    'Sum of stage allocations = Portfolio Total Allocation.',
    'Allocated AOP <= Total AOP x (1 + tolerance%).',
    'Total IT AOP = Programme Final Allocation + Operations AOP (469.7 M€).',
    'Operations AOP is constant across Tabs 1, 5, and 6.',
]: bullet(c)

heading('12.3 Benefit classification checks', 2)
for c in [
    'Every funded programme has a benefitClass field (hard/soft/qualitative/none).',
    'Hard benefit sum matches across Tab 1, Tabs 3/4, and Tab 6.',
    'Soft benefit sum matches across all displays.',
    '"Committed: X Hard . Y Soft" summary line present on Tabs 3, 4, 6 charts.',
    'Bubble tooltip shows correct benefit classification label.',
]: bullet(c)

heading('12.4 ExCo checks', 2)
for c in [
    '16 ExCo leaders mapped to 35 organisations.',
    'ExCo filter on Tabs 2, 3, 4, 6 cascades to Org filter.',
    'Trade-off cockpit shows correct per-leader totals.',
    'Trade-off Apply creates decision log entries without modifying Total AOP.',
    'Trade-off Reset clears all entered budget values.',
]: bullet(c)

# ============================================================
# SECTION — Requirement Delta
# ============================================================
heading('Appendix A: Requirement Delta v5.0 to v5.2', 1)

heading('A.1 New requirements', 2)
tbl_new = doc.add_table(rows=1, cols=3); tbl_new.style = 'Table Grid'
add_header_row(tbl_new, ['ID', 'Title', 'Summary'])
for i, r in enumerate([
    ('EXCO-01','ExCo Accountability Hierarchy','16 leaders mapped to 35 orgs. EXCO_HIERARCHY, ORG_TO_EXCO, excoOf().'),
    ('EXCO-02','Global ExCo Filter','First filter dropdown on all programme tabs. Cascading ExCo->Org->Platform.'),
    ('EXCO-03','Demand Split by ExCo','Tab 1 collapsible ExCo groups replacing flat org list.'),
    ('EXCO-04','ExCo Trade-off Cockpit','Per-leader budget negotiation on Tabs 3 & 4. Apply/Reset. Negative trade-offs.'),
    ('EXCO-05','Total AOP Protection','Apply does not modify budget. "On top off AOP" KPI.'),
    ('BEN-01','Benefit Classification','classifyBenefit() -> Hard/Soft/Qualitative/None. Data quality flags.'),
    ('BEN-02','Hard/Soft Display','Consistent Hard/Soft split across all tabs, charts, tooltips.'),
    ('BEN-03','Data Quality Flags','K EUR suspect, outlier, high ratio, no business case.'),
    ('UI-01','Y-axis Pill Toggle','Bubble chart toggle: Requested/Prioritised vs Hard Benefits.'),
    ('UI-02','Legend Redesign','Right-side panel with per-category M€ table.'),
    ('UI-03','Chart Summary Line','Tabs 3/4/6: funded count, total, committed Hard/Soft.'),
    ('UI-04','Median/Merit Removal','Removed from Tabs 3/4/6; kept on Tab 2.'),
    ('UI-05','Demand in Scenario Rebuild','Collapsible BURF groups, pill toggle, cascading ExCo filters.'),
    ('UI-06','Tab 1 KPI Redesign','Two-row layout with Hard/Soft benefits tile.'),
    ('UI-07','Tab 2 KPI Styling','Allocated AOP dark blue; others white. On top off indicator.'),
    ('UI-08','Tab 6 Redesign','5-tile 1fr grid. F&R|BU single-line. Removed export buttons.'),
    ('UI-09','Filter Auto-Close','All dropdowns auto-close after selection.'),
    ('UI-10','New Working Version Reset','Full reset: Optimal preset, clear overrides/reviews/trade-offs/log.'),
]): add_row(tbl_new, r, shade=(i%2==1))
doc.add_paragraph()

heading('A.2 Unchanged from v5.0', 2)
body('The following requirement groups from PRD v5.0 and v4.0 remain unchanged:')
bullet('FIN-01 through FIN-04: EW charging exclusion, BU cluster allocation, EW charge calculation, Finance QA harness.')
bullet('Prioritization logic (4-priority structure, merit scoring, 5 components).')
bullet('Operations tab specification (Tab 5).')
bullet('Source workbook contract and normalised record fields.')
bullet('Scenario persistence and decision history.')
bullet('Excel downloads and traceability.')
bullet('Programme detail popup.')
bullet('Platform mapping (normalizePlatform, DEPT_PLATFORM, SVC_PLATFORM_MAP).')

outpath = 'AOP2027-Modeler-PRD-v5.2.docx'
doc.save(outpath)
print(f'Saved: {outpath}')
