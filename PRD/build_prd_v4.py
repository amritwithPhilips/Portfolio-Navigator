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
r2 = p2.add_run('Version 4.0  |  24 September 2026  |  Scoring Reform + Operations + Platform Mapping')
set_font(r2, size=11, color=(74, 85, 104))
doc.add_paragraph()

body('Version 4.0 supersedes v3.2. Incorporates the six-tab structure (v4.5+), five-component merit scoring reform (v4.7), Operations tab specification, and master platform mapping for all tables.', size=11)

# ============================================================
heading('1. Product Scope', 1)
heading('1.1 Modeler state', 2)
body('Standalone offline HTML: AOP2027-OnePortfolio-v4.7.html. Six tabs. Engine schema v4.0.0. Session schema 4 (5 weights). No server or database.')

heading('1.2 Six-tab structure (supersedes v3.2 four-tab)', 2)
tbl = doc.add_table(rows=1, cols=4); tbl.style = 'Table Grid'
add_header_row(tbl, ['Tab', 'Name', 'Editable', 'Purpose'])
rows = [
    ('1','Demand Overview','No','KPIs: Total IT AOP, programme demand, operations, committed impact, YoY delta. Demand Split by Organisation (org/platform filters, X of Y totals).'),
    ('2','Program AOP Scenarios','Levers only','Four priority levers, Funding Prioritization Gate, Merit Score Framework, prioritized/unfunded tables, decision log.'),
    ('3','Enterprise Wide','Yes','EW programmes. Editable allocation. Filters, bubble chart, group controls.'),
    ('4','BU Led','Yes','BU programmes. Same layout as Tab 3. Shares one scenario with Tab 3.'),
    ('5','Operations','No','TCO 3-level hierarchy, service catalog. Pre-aligned costs; read-only.'),
    ('6','AOP 2027 : One Portfolio','No','Combined programme + operations. Finalise, Org IT Cost Allocation table with filters.'),
]
for i, r in enumerate(rows): add_row(tbl, r, shade=(i%2==1))
doc.add_paragraph()

heading('1.3 Source authority', 2)
bullet('Authoritative demand: 15926_IT AOP2027 Demand.xlsx (SHA-256: 4ca3c6d4...)')
bullet('Live source: SharePoint ITPFM — AOP 2027 Consolidated Live.xlsx')
bullet('521 demand rows, 280.2 M€ (EW 111.7, BU 168.5). 46 rows missing requested amount.')
bullet('Operations snapshot: 167 services embedded. Bill of IT Platform Service List (23 Sep): 174 services (7 gap services for next rebuild).')

# ============================================================
heading('2. Prioritization Logic', 1)

heading('2.1 Four-Priority Funding Structure', 2)
body('Every demand row is classified into exactly one of four priorities. Gate 0 checks evidence. Classification is deterministic and data-driven.')

tbl2 = doc.add_table(rows=1, cols=5); tbl2.style = 'Table Grid'
add_header_row(tbl2, ['Priority', 'Name', 'Eligibility Gate', 'Funding Order', 'Current Demand'])
p_rows = [
    ('P1','Legal & Compliance\n(Must Do)',
     'Overall AOP = "must-do - P1/P2" AND LFR Name AND LFR Year. OR CCB: EW-11, EW-65, EW-71.',
     'P1 Immediate → P2 Scheduled → CCB. Within tier: evidence strength.',
     '18 progs, 24.8 M€'),
    ('P2','High-Value Carry-Overs',
     'New/Carry-over = "Carry Over" AND Category ≠ Decomm AND Baselined > 0 AND Priority = Must Do/Must Have.',
     'Ranked by benefit/cost ratio → payback → merit. Capped at min(Requested, Baselined).',
     '23 progs, 16.3 M€'),
    ('P3','Sustain Engineering\n& Hygiene',
     'New/Carry-over = "Change & Sustain" OR Category = Continuous Improvement / Upgrades & Enhancements.',
     'Change & Sustain first (all). Then Hygiene by merit within remaining budget.',
     '148 progs, 60.9 M€'),
    ('P4','Value Based Portfolio',
     'All remaining: new features, AI, decommissioning, LFRs without evidence, carry-overs without baseline.',
     'Evidence strength then merit score.',
     '332 progs, 167.6 M€'),
]
for i, r in enumerate(p_rows): add_row(tbl2, r, shade=(i%2==1))
doc.add_paragraph()

heading('2.2 Evidence Gate 0 — Automatic Funding Holds', 2)
tbl3 = doc.add_table(rows=1, cols=3); tbl3.style = 'Table Grid'
add_header_row(tbl3, ['Hold Condition', 'Source Field', 'Applies To'])
holds = [
    ('Program name missing','Initiative Name blank','All'),
    ('No positive requested demand','IT Investment Requested null/zero/whitespace','All'),
    ('Mandatory priority TBD','Overall AOP contains "Priority TBD"','P1'),
    ('Overall AOP decision needs mapping','Unrecognised decision text','All'),
    ('Contain condition needs review','Decision Band = Contain, no condition recorded','P2/P3/P4'),
    ('No benefit evidence (quantitative or qualitative)','Both benefit (numeric) and benefitDetails (text) empty','P4'),
    ('Negative benefit needs review','Quantified Benefits < 0','P2/P4'),
    ('Below carry-over RoI threshold','benefit/cost < RoI slider','P2'),
    ('Below advanced merit floor (45.0 default)','Merit score < floor','P4'),
    ('Benefit claim above 10.0x needs review','benefit/cost > 10.0 and not reviewed','P2/P4'),
    ('Payback period missing for quantified benefit','benefit > 0 and paybackYears null/0','All (warning only, not hold)'),
]
for i, h in enumerate(holds): add_row(tbl3, h, shade=(i%2==1))
doc.add_paragraph()

heading('2.3 Funding Algorithm', 2)
bullet('Sort all rows by priority (P1→P4) then ranking within priority.')
bullet('Fund each eligible row at full requested amount if stage and portfolio budgets have capacity.')
bullet('Stage limit = target × (1 + tolerance/100). Portfolio limit = Total AOP × (1 + tolerance/100).')
bullet('Skip rows that do not fit; try the next. Never auto-allocate partial amounts.')
bullet('P2: fund at min(Requested, Carry Over Baselined), not full request.')
bullet('Tolerance default: 0.0% (exact budget). Configurable 0.0–5.0% in Advanced Configuration.')
bullet('Manual overrides after automatic: additions additive; exclusions do not refill silently.')

heading('2.4 Lever Controls', 2)
tbl4 = doc.add_table(rows=1, cols=4); tbl4.style = 'Table Grid'
add_header_row(tbl4, ['Lever', 'Priority', 'Basis Options', 'Default'])
for i, r in enumerate([
    ('1 · Legal & Compliance','P1','% of bucket / % of Total AOP / M€ allocation','100% of bucket'),
    ('2 · High-Value Carry-Overs','P2','RoI threshold (0x–5x, 0.5x steps)','0x'),
    ('3 · Sustain Engineering & Hygiene','P3','% of bucket / % of Total AOP / M€ allocation','100% bucket (Optimal: 20 M€)'),
    ('4 · Value Based Portfolio','P4','% of bucket / % of Total AOP / M€ allocation','100% of bucket'),
]): add_row(tbl4, r, shade=(i%2==1))
doc.add_paragraph()

heading('2.5 Four Scenario Presets', 2)
tbl5 = doc.add_table(rows=1, cols=5); tbl5.style = 'Table Grid'
add_header_row(tbl5, ['Preset', 'P1: LFR', 'P2: Carry RoI', 'P3: Sustain', 'P4: Value'])
for i, r in enumerate([
    ('Optimal Segmentation (Recommended)','100% bucket','0x','20 M€ allocation','100% bucket'),
    ('Protect Commitments','100% bucket','2.0x','100% bucket','10% AOP'),
    ('Tighten Carryover Evidence','100% bucket','3.0x','75% bucket','15% AOP'),
    ('Release Sustain Capacity','44% bucket','0x','75% bucket','20% AOP'),
]): add_row(tbl5, r, shade=(i%2==1))
doc.add_paragraph()

# ============================================================
heading('3. Merit Scoring Framework (v4.7)', 1)

heading('3.1 Five-Component Score', 2)
body('0–100 composite score used for ranking within priorities. Engine v4.0.0. Session schema 4.')
tbl6 = doc.add_table(rows=1, cols=5); tbl6.style = 'Table Grid'
add_header_row(tbl6, ['#', 'Component', 'Max Raw', 'Default Weight', 'Source Field(s)'])
for i, c in enumerate([
    ('1','Benefit Strength','50 pts','40%','Quantified Benefits (K€); Quantified Benefits Details (text)'),
    ('2','Submitted Priority','25 pts','25%','Priority column (before Problem Statement)'),
    ('3','Captured Consequence','15 pts','15%','Impact and Cost of Not Doing; Problem Statement; Scope'),
    ('4','Decision Band','10 pts','10%','Decision Band / Waste band'),
    ('5','Payback Period','10 pts','10%','Payback Period column (defaults to 0 until source populated)'),
]): add_row(tbl6, c, shade=(i%2==1))
body('Formula: Score = Σ (raw_i / max_i) × weight_i. Weights must sum to 100.0.', size=10)
doc.add_paragraph()

heading('3.2 Benefit Strength — Hybrid Scoring (v4.7)', 2)
body('Three-path decision tree:', bold=True, size=10)
bullet('Path 1 — Quantitative: numeric benefit > 0 → use ratio tiers (table below). benefitSource = "quantitative".')
bullet('Path 2 — Revenue/Productivity block: benefitDetails mentions revenue/productivity keywords BUT numeric benefit missing → score = 0 + warning. benefitSource = "revenue-productivity-unquantified".')
bullet('Path 3 — Qualitative fallback: no numeric, no rev/prod keyword → regex text analysis 0/10/20/30 pts (max 30). benefitSource = "qualitative" or "none".')
doc.add_paragraph()

tbl7 = doc.add_table(rows=1, cols=4); tbl7.style = 'Table Grid'
add_header_row(tbl7, ['Benefit/Cost Ratio', 'Points', 'Label', 'Notes'])
for i, t in enumerate([
    ('< 1.0x','0','No return','Below break-even'),
    ('1.0x – 3.0x','15','Low',''),
    ('3.0x – 5.0x','25','Medium',''),
    ('5.0x – 7.0x','35','High',''),
    ('7.0x – 10.0x','50','Maximum',''),
    ('> 10.0x','50 + hold','Maximum (review)','Hold: "Benefit claim above 10.0x needs review"'),
]): add_row(tbl7, t, shade=(i%2==1))
doc.add_paragraph()

heading('3.3 Qualitative Benefit Tiers (Path 3)', 2)
tbl8 = doc.add_table(rows=1, cols=3); tbl8.style = 'Table Grid'
add_header_row(tbl8, ['Tier', 'Points', 'Detection'])
for i, t in enumerate([
    ('No evidence','0','Empty, "NA", "TBD", "Soft Benefit", < 10 chars'),
    ('General statement','10','Non-trivial text, no specific indicators'),
    ('Specific benefit','20','Cost avoidance / efficiency / compliance keywords + context > 50 chars'),
    ('Quantified non-financial','30','Numeric + non-financial units (FTEs, %, hours) OR enterprise/global scope with benefit language'),
]): add_row(tbl8, t, shade=(i%2==1))
body('Max qualitative = 30/50 pts. Preserves incentive for quantitative evidence.', size=10)
doc.add_paragraph()

heading('3.4 Submitted Priority', 2)
tbl9 = doc.add_table(rows=1, cols=2); tbl9.style = 'Table Grid'
add_header_row(tbl9, ['Value', 'Points'])
for r in [('Must Do','25'),('Must Have','18'),('Deprioritised','5'),('Blank / unrecognised','0')]:
    add_row(tbl9, r)
doc.add_paragraph()

heading('3.5 Captured Consequence', 2)
tbl10 = doc.add_table(rows=1, cols=3); tbl10.style = 'Table Grid'
add_header_row(tbl10, ['Tier', 'Points', 'Detection'])
for i, c in enumerate([
    ('No evidence','0','No Impact / Problem Statement / Scope text'),
    ('Context only','5','At least one field has content, no explicit harm'),
    ('Explicit harm','10','Harm keywords (cannot, will fail, penalty, end of support) AND affected entity (customer, system, revenue)'),
    ('Quantified / enterprise','15','Explicit harm AND (quantified impact with units OR enterprise/global reach)'),
]): add_row(tbl10, c, shade=(i%2==1))
body('Fields used: Impact and Cost of Not Doing; Problem Statement; Scope. Reviewed tier requires source evidence + inline rationale.', size=10)
doc.add_paragraph()

heading('3.6 Decision Band', 2)
tbl11 = doc.add_table(rows=1, cols=2); tbl11.style = 'Table Grid'
add_header_row(tbl11, ['Band', 'Points'])
for r in [('Healthy','10'),('Contain','6 (requires documented condition for discretionary allocation)'),('Blank / Unassessed','0')]:
    add_row(tbl11, r)
doc.add_paragraph()

heading('3.7 Payback Period', 2)
tbl12 = doc.add_table(rows=1, cols=3); tbl12.style = 'Table Grid'
add_header_row(tbl12, ['Payback Period', 'Points', 'Notes'])
for i, r in enumerate([
    ('≤ 1 year','10',''),
    ('≤ 2 years','8',''),
    ('≤ 3 years','6',''),
    ('≤ 5 years','4',''),
    ('> 5 years','0',''),
    ('Missing / null','0','Warning if benefit > 0: "Payback period missing for quantified benefit claim"'),
]): add_row(tbl12, r, shade=(i%2==1))
body('Column discovery aliases: "Payback Period", "Payback", "Payback (Years)". Currently all score 0 — column provisioned in source.', size=10)

# ============================================================
heading('4. Finance Calculations', 1)

heading('4.1 Financial Identities (must hold within ±0.01 M€)', 2)
for c in [
    'Requested = Final Prioritised + Unfunded (per programme, per stream, portfolio total)',
    'EW Final + BU Final = Portfolio Final',
    'Sum of stage allocations = Portfolio Total Allocation',
    'Allocated AOP ≤ Total AOP × (1 + tolerance/100)',
    'Total IT AOP = Programme AOP + Operations AOP (Tabs 1 and 6)',
]: bullet(c)

heading('4.2 Currency and Rounding', 2)
bullet('Source unit: K€ → normalised to M€ (divide by 1,000 once at ingestion).')
bullet('Display: upward one-decimal rounding. 0.0451 → 0.1. Preserves sign/direction.')
bullet('Calculation and exports: full source precision (6 decimal places).')
bullet('Benefits: submitted lifetime claims. Never annualised or cash-equivalent.')

heading('4.3 Lever Target Formula', 2)
tbl13 = doc.add_table(rows=1, cols=3); tbl13.style = 'Table Grid'
add_header_row(tbl13, ['Basis', 'Formula', 'Example'])
for i, r in enumerate([
    ('% of bucket demand','min(bucket_demand, bucket_demand × pct/100)','P3 100%: min(60.9, 60.9) = 60.9 M€'),
    ('% of Total AOP','min(bucket_demand, Total_AOP × pct/100)','P4 15%: min(167.6, 15.0) = 15.0 M€'),
    ('M€ allocation','min(bucket_demand, entered_amount)','P3 20 M€: min(60.9, 20.0) = 20.0 M€'),
]): add_row(tbl13, r, shade=(i%2==1))
doc.add_paragraph()

heading('4.4 P2 Carry-Over Cap', 2)
body('P2 programmes are funded at min(Requested, Carry Over Baselined). Lever display shows sum of baselined caps (fundable demand), not total requested amounts.')

heading('4.5 Operations Finance Structure', 2)
tbl14 = doc.add_table(rows=1, cols=3); tbl14.style = 'Table Grid'
add_header_row(tbl14, ['Component', 'Amount', 'Allocation Method'])
for i, r in enumerate([
    ('BU Own Consumption','317.6 M€','Direct BU cost from own service consumption'),
    ('From Regions','63.5 M€','Region IT costs allocated to BUs (shown as -63.5 in Regions row)'),
    ('From Functions & CoEs','88.5 M€','Central function costs allocated to BUs (shown as -88.5 in Functions row)'),
    ('Total Operations AOP 2027','469.7 M€','Sum of the above three components'),
    ('2026 Run-Rate (reference)','470.7 M€','Prior year baseline for delta calculation'),
    ('Δ YoY','-1.0 M€','469.7 − 470.7 = -1.0 M€ (cost decrease)'),
]): add_row(tbl14, r, shade=(i%2==1))
doc.add_paragraph()

# ============================================================
heading('5. Operations Tab Specification (Tab 5)', 1)

heading('5.1 Organisation Total Cost of Ownership', 2)
body('3-level collapsible hierarchy: BU Cluster → Sub-Organisation → Services. Columns: Organisation, AOP2027 Costs M€, Own Consumption (M€|%), Regions to BU (M€|%), Functions & CoEs (M€|%), Δ vs AOP2026 M€.')
bullet('Δ colour: positive (cost increase) = red; negative (cost decrease) = green.')
bullet('Filter: Organisation and Platform. Platform filter uses BU Cluster → Platform mapping (see Section 6.3).')
bullet('"X of Y" total row when platform filter is active.')

heading('5.2 Service Catalog', 2)
body('Columns: Service ID, Service Name, Platform Name, AOP2027 Costs M€, AOP2026 Costs M€, Δ vs AOP2026 M€.')
bullet('Δ colour: positive = red, negative = green.')
bullet('Filter: Platform. All 9 canonical platform names available.')
bullet('Platform lookup: SVC_PLATFORM_MAP (service-level) → DEPT_PLATFORM (dept-level fallback) → normalizePlatform().')
bullet('167 services in current snapshot. Bill of IT (23 Sep) has 174 services; gap of 7 new SE002xxx services.')
bullet('"X of Y" on AOP2027 and AOP2026 total cells when filtered.')

# ============================================================
heading('6. Master Platform Mapping', 1)

heading('6.1 Canonical Platform Names', 2)
body('All tables use these 12 canonical names. normalizePlatform() harmonises all source variants.')
tbl15 = doc.add_table(rows=1, cols=3); tbl15.style = 'Table Grid'
add_header_row(tbl15, ['Canonical Name', 'Programme Demand Variant', 'Operations Variant'])
for i, r in enumerate([
    ('Commercial IT','Commercial IT','IT-Commercial IT'),
    ('Enterprise Architecture, Data & Integration','Enterprise Architecture, Data & Integration','IT-Ent.Architecture,Data&Integration'),
    ('Group Functions & Hyperautomation','Group Functions & Hyperautomation IT','IT-Group Functions and Hyperautomation'),
    ('Infrastructure Services','Infrastructure Services – Projects','IT-Infrastructure Services'),
    ('Innovation and Digital','Innovation and Digital IT','IT-Innovation and Digital'),
    ('Integrated Supply Chain & Finance','Integrated Supply Chain & Finance','IT-Integrated Supply Chain and Finance'),
    ('Security, Risk & Compliance','IT-Security,Risk&Compliance','IT-Security,Risk&Compliance'),
    ('Services & Solutions IT','Services & Solutions IT','IT-Services&Solutions IT'),
    ('Greater China IT','Greater China IT','(B72 dept → Unallocated)'),
    ('Mergers, Acquisitions & Divestments','Mergers, Acquisitions & Divestments','—'),
    ('Portfolio IT','Portfolio IT','—'),
    ('Unallocated','Not supplied','AI Services, AN6, B69+, B72, Transfers depts'),
]): add_row(tbl15, r, shade=(i%2==1))
doc.add_paragraph()

heading('6.2 IT Department Code → Platform (DEPT_PLATFORM)', 2)
body('Source: Bill of IT Platform Service List (Updated 23 Sep). Used by operations service catalog and allocation table.')
tbl16 = doc.add_table(rows=1, cols=4); tbl16.style = 'Table Grid'
add_header_row(tbl16, ['IT Dept Code', 'Canonical Platform', 'Services (approx.)', 'Key Services'])
for i, r in enumerate([
    ('AN3','Security, Risk & Compliance','2','IT Security'),
    ('AN4','Infrastructure Services','5','Data Center Operations, Cloud Hosting (Azure, AWS, Google, Data Center in a Box)'),
    ('AN5','Infrastructure Services','4','R&D Labs & Infrastructure (Global, EMEA, USA, IND, DACH)'),
    ('AN6','Unallocated','1','Regions IT'),
    ('AN7','Infrastructure Services','6','Network Connectivity, Mobile Telephony, VPN, Proxy'),
    ('AN8','Infrastructure Services','7','Digital Workplace, Collaboration Services'),
    ('AX9','Services & Solutions IT','22','B2B ServiceCloud, HC Services, OneMobile, PSA, Mize'),
    ('B69+','Unallocated','1','Central Departments (CIO, Portfolio, Vendor & SAM)'),
    ('B72','Unallocated','3','Local Applications, Local Support, Local Cloud Hosting GCR'),
    ('BL8','Commercial IT','18-19','Salesforce, ServiceNow, Conga, Anaplan, SalesForce CRM'),
    ('BL9','Integrated Supply Chain & Finance','20-21','Business Core ERP, Planning, Procurement, Treasury, Tax'),
    ('BM0','Group Functions & Hyperautomation','24-31','Workday, QMS, Automation Platforms, Learning, CAPA'),
    ('BM1','Innovation and Digital','30-45','PLM, Engineering Tools, Online Marketing, Digital Services, GenAI'),
    ('I91','Enterprise Architecture, Data & Integration','14-16','Data Lake, Power BI, One BI, EDI, Integration Platform'),
    ('AI Services / AI Svcs','Unallocated','7','Copilot, ChatGPT, Claude, Copilot Studio, GenAI Foundation'),
    ('Transfers','Unallocated','1','Transfer in New Services'),
]): add_row(tbl16, r, shade=(i%2==1))
doc.add_paragraph()

heading('6.3 BU Cluster → Platform (TCO Table)', 2)
body('Approximate mapping for TCO table platform filter. Each BU cluster may span multiple IT platforms; primary platform shown.')
tbl17 = doc.add_table(rows=1, cols=2); tbl17.style = 'Table Grid'
add_header_row(tbl17, ['BU Cluster', 'Primary Platform (canonical)'])
for r in [
    ('Precision Diagnosis','Commercial IT'),
    ('Image Guided Therapy','Services & Solutions IT'),
    ('Connected Care','Commercial IT'),
    ('EI','Commercial IT'),
    ('Personal Health','Commercial IT'),
    ('Int. Property & Standards','Group Functions & Hyperautomation'),
    ('Innovation & Design','Innovation and Digital'),
]:
    add_row(tbl17, r)
doc.add_paragraph()

# ============================================================
heading('7. Requirement Delta: v3.2 → v4.0', 1)

heading('7.1 New requirements', 2)
tbl18 = doc.add_table(rows=1, cols=3); tbl18.style = 'Table Grid'
add_header_row(tbl18, ['ID', 'Title', 'Summary'])
for i, r in enumerate([
    ('NAV 02','Six-tab structure','Demand Overview (Tab 1) and Operations (Tab 5) added.'),
    ('SC-DQ 01','Remove Data Quality Card','Removed from Tab 1 executive layout.'),
    ('SCORE 03','Hybrid Benefit Scoring','Three-path: quantitative → rev/prod block → qualitative fallback.'),
    ('SCORE 04','Qualitative Benefit Scoring','Regex text analysis, 4 tiers, max 30 pts.'),
    ('SCORE 05','Revenue/Productivity Rule','Rev/prod claims without numbers → score 0 + warning.'),
    ('SCORE 06','Payback Period Component','5th merit component (10% default weight). Source provisioned.'),
    ('SCORE 07','Revised Benefit Ratio Tiers','<1x=0, 1-3x=15, 3-5x=25, 5-7x=35, 7x+=50.'),
    ('DATA 07','Payback Validation','Warning when benefit > 0 and payback missing.'),
    ('OPS 01','Operations Tab','TCO 3-level hierarchy, 6 KPIs, service catalog.'),
    ('OPS 02','Service Catalog Columns','6 columns: ID, Name, Platform, 2027, 2026, Δ.'),
    ('OPS 03','Platform Master Mapping','DEPT_PLATFORM, SVC_PLATFORM_MAP, normalizePlatform(). Canonical names everywhere.'),
    ('OPS 04','Delta Colour Coding','Δ > 0 = red, Δ < 0 = green (TCO + Service Catalog).'),
    ('FIL 04','X of Y Totals','All filter tables show X of Y in total row when filters active.'),
    ('FIL 05','Allocation Table Filters','Tab 6: Organisation and Platform filters with X of Y.'),
]): add_row(tbl18, r, shade=(i%2==1))
doc.add_paragraph()

heading('7.2 Amended requirements', 2)
tbl19 = doc.add_table(rows=1, cols=3); tbl19.style = 'Table Grid'
add_header_row(tbl19, ['ID', 'Change', 'Old (v3.2) → New (v4.0)'])
for i, r in enumerate([
    ('NAV 01','Tab count','4 tabs → 6 tabs'),
    ('RULE 05','Benefit review threshold','>5.0x → >10.0x'),
    ('SCORE 01','Benefit tiers','<1x=0,≥1x=20,≥2x=30,≥3x=40,≥5x=50 → see SCORE 07'),
    ('SCORE 02','Weight count and defaults','4 weights [50,25,15,10] → 5 weights [40,25,15,10,10]'),
    ('MET 01','Benefit scoring path','Numeric ratio only → hybrid quantitative/qualitative/rev-prod'),
    ('CONF 05','Decision log columns','4 cols (with raw JSON) → 3 cols (business-readable 1-liner)'),
]): add_row(tbl19, r, shade=(i%2==1))
doc.add_paragraph()

# ============================================================
heading('8. QA and Acceptance Criteria', 1)
body('Current QA status: v4.7 — 25/25 PASS — EXCO READY.')

heading('8.1 Core checks', 2)
for c in [
    'Requested = Final + Unfunded (±0.01 M€)',
    'EW + BU = Portfolio (±0.01 M€)',
    'Sum stage allocations = Portfolio allocation',
    'Allocation ≤ Total AOP × (1 + tolerance%)',
    '521 programmes, no duplicate IDs',
    'CCBs EW-11, EW-65, EW-71 present',
    'All merit scores 0–100',
    '5 merit components per record; weights sum to 100.0',
    'benefitSource field on all rows',
    'All 9 canonical platforms in service catalog',
    'No "IT-" prefix in any filter option',
    'All 6 tabs render, zero console errors',
]: bullet(c)

outpath = 'AOP2027-Modeler-PRD-v4.0.docx'
doc.save(outpath)
print(f'Saved: {outpath}')
