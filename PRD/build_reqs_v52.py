import sys
sys.stdout.reconfigure(encoding='utf-8')
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

def set_font(run, size=10.5, bold=False, color=None):
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

def body(text, bold=False, size=10.5):
    p = doc.add_paragraph()
    run = p.add_run(text)
    set_font(run, size=size, bold=bold)
    return p

def req(rid, text, size=10.5):
    p = doc.add_paragraph()
    r1 = p.add_run(rid + '  ')
    set_font(r1, size=size, bold=True, color=(11, 94, 215))
    r2 = p.add_run(text)
    set_font(r2, size=size)
    return p

def bullet(text, level=1):
    style = 'List Bullet' if level==1 else 'List Bullet 2'
    p = doc.add_paragraph(style=style)
    run = p.add_run(text)
    set_font(run, size=10)
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
r = p.add_run('AOP 2027 Modeler Detailed Requirements')
r.font.name = 'Calibri'; r.font.size = Pt(20); r.font.bold = True
r.font.color.rgb = RGBColor(0, 18, 110)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
r2 = p2.add_run('Version 5.2  |  25 September 2026  |  Companion to PRD v5.2')
set_font(r2, size=11, color=(74, 85, 104))
doc.add_paragraph()

body('This document defines detailed requirements for AOP 2027 Modeler v5.2. Each requirement includes an ID, title, description, acceptance criteria, affected tab(s), and priority. Requirements use language: MUST (mandatory), SHOULD (recommended), MAY (optional). Companion document: AOP2027-Modeler-PRD-v5.2.docx.', size=10.5)

body('Requirement groups: EXCO (ExCo hierarchy, filter, demand, trade-off, AOP protection); BEN (benefit classification, display, data quality); UI (toggles, levers, KPIs, charts, filters, reset); FIN (finance model, unchanged from v5.0).', size=10)

# ============================================================
# EXCO Requirements
# ============================================================
heading('ExCo Accountability Requirements', 1)

# --- EXCO-01 ---
req('EXCO-01', 'ExCo Accountability Hierarchy')
body('Description: The engine MUST maintain a mapping of 16 ExCo members to all 35 organisation values. The mapping MUST be implemented as two complementary data structures plus a fuzzy match function.', size=10)

body('Implementation:', bold=True, size=10)
bullet('EXCO_HIERARCHY: dictionary keyed by leader name. Each entry contains role (string), segment (string), and orgs (array of organisation values).')
bullet('ORG_TO_EXCO: reverse lookup dictionary mapping each of the 35 organisation values to its ExCo leader name.')
bullet('excoOf(orgName): fuzzy match function that handles whitespace differences, encoding variations, and case-insensitive matching to return the ExCo leader for any organisation string.')
bullet('enrich() MUST add an exco field to every programme row using ORG_TO_EXCO/excoOf().')

body('ExCo Member Mapping:', bold=True, size=10)
tbl = doc.add_table(rows=1, cols=4); tbl.style = 'Table Grid'
add_header_row(tbl, ['Leader', 'Role', 'Segment', 'Organisations'])
leaders = [
    ('Deeptha Khanna', 'BU Leader', 'Personal Health', 'PH'),
    ('Shez Partovi', 'BU Leader', 'Enterprise Informatics', 'EI, I&D'),
    ('Julia Strandberg', 'BU Leader', 'Connected Care', 'HPM, AM&D, SRC'),
    ('Jie Xue', 'BU Leader', 'Precision Diagnosis', 'CT, DXR, MR, PDU'),
    ('Bert van Meurs', 'BU Leader', 'Image Guided Therapy', 'IGT-S, IGT-D, STO'),
    ('Wim Appelo', 'BU Leader', 'Integrated Supply Chain', 'ISC, STET-ISC'),
    ('Ozlem Fidanci', 'BU Leader', 'International Regions', 'IR, Health & Safety'),
    ('Jeff DiLullo', 'BU Leader', 'North America', 'NAM'),
    ('Ling Liu', 'BU Leader', 'Greater China', 'GCR'),
    ('Charlotte Hanneman', 'BU Leader', 'Finance & Group Security', 'Finance, Group Security'),
    ('Laura Matz', 'Enterprise', 'IT', 'IT'),
    ('Heidy Schein', 'Enterprise', 'People', 'People'),
    ('Steve C de Baca', 'Enterprise', 'Patient Safety & Quality', 'PS&Q'),
    ('Carla Silva Peron', 'Enterprise', 'Medical Office', 'Medical Office'),
    ('Filip Koek', 'Enterprise', 'Internal Audit', 'Internal Audit'),
    ('Marnix van Ginneken', 'Enterprise', 'Legal, Comms & Brand, IP&S', 'Legal, Comms & Brand, IP&S'),
]
for i, r in enumerate(leaders): add_row(tbl, r, shade=(i%2==1))
doc.add_paragraph()

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: EXCO_HIERARCHY contains exactly 16 entries.')
bullet('AC-2: ORG_TO_EXCO maps all 35 unique organisation values.')
bullet('AC-3: excoOf() returns a valid leader for every org value in the demand dataset.')
bullet('AC-4: Every enriched programme row has a non-null exco field.')
bullet('AC-5: Regional leaders (IR, NAM, GCR) receive both BU and EW demand from their orgs.')
body('Tab(s): All. Priority: P1 (Must Have).', size=9)

# --- EXCO-02 ---
req('EXCO-02', 'Global ExCo Filter')
body('Description: ExCo Leader MUST be added as the first filter dropdown on all programme tabs. The filter MUST cascade to downstream filters.', size=10)

body('Implementation:', bold=True, size=10)
bullet('ExCo Leader dropdown is the first filter element on Tabs 2, 3, 4, and Tab 6 overview.')
bullet('Cascade chain: ExCo -> Organisation -> Platform. Selecting an ExCo leader narrows Organisation options to only that leader\'s mapped organisations.')
bullet('Organisation selection further narrows Platform options to platforms present in those organisations\' demand.')
bullet('AND logic with all other filter dimensions (Funding Status, Type, Investment Area, text search).')
bullet('Tab 2: ExCo filter applies to both the Demand in Scenario table and the Prioritized programme filters.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: ExCo filter dropdown present on Tabs 2, 3, 4, 6.')
bullet('AC-2: Selecting "Jie Xue" shows only CT, DXR, MR, PDU organisations.')
bullet('AC-3: Clearing ExCo filter restores all organisations in the Org filter.')
bullet('AC-4: ExCo + Org + Platform filters combine with AND logic.')
bullet('AC-5: Filter option counts update dynamically reflecting other active filters.')
body('Tab(s): 2, 3, 4, 6. Priority: P1 (Must Have).', size=9)

# --- EXCO-03 ---
req('EXCO-03', 'Demand Split by ExCo (Tab 1)')
body('Description: The Demand Split table on Tab 1 MUST be reorganised from a flat organisation list to collapsible ExCo groups.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Each ExCo leader appears as a collapsible parent row.')
bullet('Parent row shows: programme count, requested M€, prioritised M€, gap M€, % funded, hard benefits M€, soft benefits M€, operations cost M€.')
bullet('Click to expand: constituent organisations shown as child rows with the same columns.')
bullet('Colour-coded funding percentage: red for low (<50%), amber for medium (50-80%), green for high (>80%).')
bullet('Replaces the previous "Demand Split by Organisation" flat table.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: 16 ExCo parent rows visible (when all have demand).')
bullet('AC-2: Expanding any ExCo row shows its constituent organisations.')
bullet('AC-3: Parent row totals equal sum of child row values.')
bullet('AC-4: Hard and Soft benefit columns populated for all rows.')
bullet('AC-5: Percentage-funded values correctly colour-coded.')
body('Tab(s): 1. Priority: P1 (Must Have).', size=9)

# --- EXCO-04 ---
req('EXCO-04', 'ExCo Trade-off Cockpit')
body('Description: An interactive trade-off panel MUST be available on Tabs 3 (Functions & Regions) and 4 (BU Led) enabling per-ExCo leader budget negotiation.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Position: below the filter bar on Tabs 3 and 4.')
bullet('Default state: collapsed/closed. Opens automatically when trade-off budget values are entered.')
bullet('Columns per ExCo leader row: Requested, Funded, Gap, % Funded, Hard Ben, Soft Ben, Trade-off Budget (input), Delta, Progs/Benefits impact.')
bullet('Trade-off Budget: user enters a target funding amount. Delta = Trade-off Budget - current Funded.')
bullet('Progs/Benefits impact: shows programme count + Hard/Soft benefit M€ that would be added or removed if Apply is pressed.')
bullet('Apply button: includes/excludes P4 programmes by merit score ranking to match entered trade-off budgets. Creates decision log entries. Does NOT modify Total AOP (see EXCO-05).')
bullet('Reset button: clears all entered trade-off budget values in one click.')
bullet('Negative trade-offs: entering a budget below current funded amount models reductions. Lowest-merit P4 programmes are excluded first. Delta shown in red.')
bullet('Implementation uses batched transact() calls to avoid rendering issues during Apply.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Trade-off cockpit visible on Tabs 3 and 4 when expanded.')
bullet('AC-2: Entering a budget value opens the cockpit if closed.')
bullet('AC-3: Apply includes/excludes correct programmes by merit ranking.')
bullet('AC-4: Apply creates decision log entries for each programme change.')
bullet('AC-5: Apply does NOT change the Total AOP value.')
bullet('AC-6: Reset clears all budget inputs and reverts programme changes.')
bullet('AC-7: Negative trade-off reduces funding by excluding lowest-merit P4 programmes.')
bullet('AC-8: No blank page or rendering error during Apply (batched transact).')
body('Tab(s): 3, 4. Priority: P1 (Must Have).', size=9)

# --- EXCO-05 ---
req('EXCO-05', 'Total AOP Protection')
body('Description: The Total AOP (M€) field MUST change only via manual user edit. No automated process (including Trade-off Apply) may modify it.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Trade-off Apply button includes/excludes programmes but does NOT modify the Total AOP budget value.')
bullet('"On top off AOP" KPI displays the delta between actual allocation and user-set budget.')
bullet('Tabs 3 & 4: "On top off AOP" shown as a KPI tile. Red when over-budget, green when under.')
bullet('Tab 2: Allocated AOP shows "On top off: +X M€" (red) or "Under budget: X M€" (green).')
bullet('Total AOP changes ONLY when the user manually edits the budget input field on Tab 2.')
bullet('Presets do not change Total AOP. They only change lever settings.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: After Trade-off Apply, Total AOP value is unchanged.')
bullet('AC-2: "On top off AOP" KPI shows correct delta.')
bullet('AC-3: Red indicator when allocation exceeds budget.')
bullet('AC-4: Green indicator when allocation is within budget.')
bullet('AC-5: Manual edit of Total AOP input field updates the budget and all dependent calculations.')
bullet('AC-6: Preset application does not modify Total AOP.')
body('Tab(s): 2, 3, 4. Priority: P1 (Must Have).', size=9)

# ============================================================
# BEN Requirements
# ============================================================
heading('Benefit Classification Requirements', 1)

# --- BEN-01 ---
req('BEN-01', 'Benefit Classification Engine')
body('Description: The engine MUST classify every programme into one of four benefit categories using a deterministic classifyBenefit() function.', size=10)

body('Classification Rules:', bold=True, size=10)
tbl2 = doc.add_table(rows=1, cols=3); tbl2.style = 'Table Grid'
add_header_row(tbl2, ['Class', 'Condition', 'benefitClass value'])
for i, r in enumerate([
    ('Hard', 'benefit > 0 AND area IN {Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain}', '"hard"'),
    ('Soft', 'benefit > 0 AND area IN {Compliance/Keeping the lights on, Security} OR any other area with benefit > 0 not matching Hard', '"soft"'),
    ('Qualitative', 'benefit = 0 or null BUT (impact text non-empty OR problem statement non-empty)', '"qualitative"'),
    ('None', 'No numeric benefit AND no impact/problem text', '"none"'),
]): add_row(tbl2, r, shade=(i%2==1))
doc.add_paragraph()

body('Enriched fields per programme row:', bold=True, size=10)
bullet('benefitClass: "hard" | "soft" | "qualitative" | "none"')
bullet('benefitClassLabel: "Hard Benefit" | "Soft Benefit" | "Qualitative Only" | "No Benefit Data"')
bullet('benefitFlag: data quality flag string or null')

body('Data Quality Flags:', bold=True, size=10)
tbl3 = doc.add_table(rows=1, cols=2); tbl3.style = 'Table Grid'
add_header_row(tbl3, ['Flag', 'Trigger Condition'])
for i, r in enumerate([
    ('K EUR suspect', 'Impact text contains a number that equals benefit amount x 1000 (suggests K€/M€ confusion)'),
    ('Outlier', 'Benefit amount exceeds 100 M€'),
    ('High ratio', 'Benefit / cost ratio exceeds 10x (also triggers merit hold)'),
    ('No business case', 'No numeric benefit, no qualitative text, no impact statement — zero evidence'),
]): add_row(tbl3, r, shade=(i%2==1))
doc.add_paragraph()

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Every enriched row has benefitClass, benefitClassLabel, and benefitFlag fields.')
bullet('AC-2: classifyBenefit() is deterministic — same inputs always produce same classification.')
bullet('AC-3: Hard areas list is exactly: Revenue Increase, Productivity Savings, Cost Avoidance, Process simplification/efficiency gain.')
bullet('AC-4: Programmes with benefit > 0 in any area not in the Hard list classify as Soft.')
bullet('AC-5: Programmes with zero/null benefit but non-empty impact/problem text classify as Qualitative.')
bullet('AC-6: Data quality flags correctly detect K EUR suspect, outlier, high ratio, and no business case conditions.')
body('Tab(s): All (engine-level). Priority: P1 (Must Have).', size=9)

# --- BEN-02 ---
req('BEN-02', 'Hard/Soft Benefit Display')
body('Description: All benefit displays across all tabs MUST consistently separate Hard and Soft benefits.', size=10)

body('Display Locations:', bold=True, size=10)
tbl4 = doc.add_table(rows=1, cols=3); tbl4.style = 'Table Grid'
add_header_row(tbl4, ['Location', 'Display', 'Format'])
for i, r in enumerate([
    ('Tab 1: Committed Benefits KPI', 'Hard (green) / Soft (amber)', 'Two-line or inline split'),
    ('Tab 2: Allocated AOP KPI', '"On top off" indicator', 'Red when over-budget'),
    ('Tabs 3 & 4: KPI tile', '"Committed Hard Benefits" with subtitle', 'Hard amount primary, "Hard X / Soft Y" subtitle'),
    ('Tab 6: Committed Benefits KPI', 'Hard/Soft split', 'Inline split'),
    ('Chart summary (Tabs 3/4/6)', '"Committed: X Hard . Y Soft"', 'Replaces single combined number'),
    ('Bubble tooltip', 'Benefit classification label', 'Hard Benefit / Soft Benefit / Qualitative Only / No Benefit Data'),
    ('ExCo Demand table', 'Hard/Soft columns', 'M€ values per org row and grand total'),
    ('ExCo Trade-off panel', 'Hard Ben / Soft Ben columns', 'M€ per ExCo leader'),
]): add_row(tbl4, r, shade=(i%2==1))
doc.add_paragraph()

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Hard benefit sum is consistent across Tab 1, Tabs 3/4, and Tab 6.')
bullet('AC-2: Soft benefit sum is consistent across all displays.')
bullet('AC-3: Chart summary shows "Committed: X Hard . Y Soft" on Tabs 3, 4, 6.')
bullet('AC-4: Bubble tooltip shows the correct classification label per programme.')
bullet('AC-5: ExCo Demand table org sub-rows and grand total show Hard/Soft (not empty).')
body('Tab(s): 1, 2, 3, 4, 6. Priority: P1 (Must Have).', size=9)

# --- BEN-03 ---
req('BEN-03', 'Benefit Data Quality Flags')
body('Description: The engine MUST detect and flag data quality issues in benefit claims. Flags are informational and do not block funding (except high ratio which triggers a merit hold).', size=10)

body('Implementation:', bold=True, size=10)
bullet('K EUR suspect: compare impact text numeric values against benefit x 1000. Flag if match found.')
bullet('Outlier: flag if benefit amount > 100 M€.')
bullet('High ratio: flag if benefit/cost > 10x. This also triggers the existing merit hold ("Benefit claim above 10.0x needs review").')
bullet('No business case: flag if all of benefit (numeric), benefitDetails (text), impact, and problem are empty/null.')
bullet('Flags stored in benefitFlag field on each programme row.')
bullet('Programme detail popup MUST display any active flags.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: K EUR suspect flag triggers when impact text = benefit x 1000.')
bullet('AC-2: Outlier flag triggers for benefits > 100 M€.')
bullet('AC-3: High ratio flag triggers for benefit/cost > 10x.')
bullet('AC-4: No business case flag triggers when all evidence fields are empty.')
bullet('AC-5: Flags visible in programme detail popup.')
body('Tab(s): All (engine-level). Priority: P2 (Should Have).', size=9)

# ============================================================
# UI Requirements
# ============================================================
heading('UI Requirements', 1)

# --- UI-01 ---
req('UI-01', 'Bubble Chart Y-Axis Toggle')
body('Description: The bubble chart MUST provide a pill-style toggle switch to change the Y-axis metric.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Tabs 3 & 4: toggle between "Requested (M€)" and "Hard Benefits (M€)".')
bullet('Tab 6: toggle between "Prioritised (M€)" and "Hard Benefits (M€)".')
bullet('Tab 2: no toggle (scenario tab retains median/merit reference values).')
bullet('Pill-style toggle matching the Prioritised/Not Funded toggle design (blue active state).')
bullet('Toggle state persisted within the session.')
bullet('Replaces the previous dropdown selector.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Pill toggle visible on Tabs 3, 4, 6 bubble charts.')
bullet('AC-2: Toggle switches Y-axis data and label.')
bullet('AC-3: No toggle on Tab 2.')
bullet('AC-4: Toggle state survives tab switches within same session.')
body('Tab(s): 3, 4, 6. Priority: P1 (Must Have).', size=9)

# --- UI-02 ---
req('UI-02', 'Bubble Chart Legend Redesign')
body('Description: The bubble chart legend MUST be moved from below the chart to a right-side panel showing per-category aggregated values.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Legend positioned to the right of the bubble chart area.')
bullet('Compact table format: category colour swatch, category name, aggregated M€ value.')
bullet('Updates dynamically when filters change or Y-axis toggle is switched.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Legend appears to the right of the chart, not below.')
bullet('AC-2: Each category shows colour, name, and M€ total.')
bullet('AC-3: Legend M€ values update when filters change.')
body('Tab(s): 3, 4, 6. Priority: P2 (Should Have).', size=9)

# --- UI-03 ---
req('UI-03', 'Chart Summary Line')
body('Description: A summary line MUST appear below the chart heading on Tabs 3, 4, and 6.', size=10)

body('Format:', bold=True, size=10)
bullet('"X / Y Programmes funded for a total N M€ / M M€ Prioritised AOP 2027 demand with a committed Impact of Z M€"')
bullet('Impact text: "Committed: X Hard . Y Soft"')
bullet('Refreshes on filter change.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Summary line present on Tabs 3, 4, 6.')
bullet('AC-2: Programme counts and amounts match filtered results.')
bullet('AC-3: Hard/Soft committed amounts match BEN-02 totals.')
bullet('AC-4: Summary updates when filters change.')
body('Tab(s): 3, 4, 6. Priority: P2 (Should Have).', size=9)

# --- UI-04 ---
req('UI-04', 'Median/Merit Text Removal')
body('Description: Median and merit reference text MUST be removed from Tabs 3, 4, and 6 chart areas. Retained on Tab 2 only.', size=10)

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: No median/merit text on Tabs 3, 4, 6.')
bullet('AC-2: Tab 2 retains median/merit reference values.')
body('Tab(s): 2, 3, 4, 6. Priority: P2 (Should Have).', size=9)

# --- UI-05 ---
req('UI-05', 'Demand in Scenario Table Rebuild')
body('Description: The Demand in Scenario table (Tab 2) MUST be rebuilt with collapsible BURF organisation groups, a pill-style toggle, and cascading ExCo filters.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Replaces separate Demand Prioritized / Demand Not Funded sections with a merged table.')
bullet('Collapsible BURF organisation groups matching Tabs 3/4 design pattern.')
bullet('View-only: no editable fields. 9 columns matching EW/BU tables.')
bullet('Pill-style slide switch: Prioritised (default) / Not Funded. Teal/blue active state.')
bullet('Cascading filters: ExCo Leader -> Organisation -> Platform.')
bullet('Total row with filtered/unfiltered counts and benefits total.')
bullet('Positioned before the Funding Prioritization Gate section.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Table shows collapsible BURF groups.')
bullet('AC-2: Toggle switches between Prioritised and Not Funded views.')
bullet('AC-3: ExCo filter narrows Organisation options.')
bullet('AC-4: Total row shows correct filtered counts.')
bullet('AC-5: Table is read-only (no editable cells).')
body('Tab(s): 2. Priority: P1 (Must Have).', size=9)

# --- UI-06 ---
req('UI-06', 'Tab 1 KPI Redesign')
body('Description: Tab 1 MUST display KPI tiles in a two-row layout with Hard/Soft benefit separation.', size=10)

body('Layout:', bold=True, size=10)
bullet('Row 1: Total IT AOP Demand (dark blue) | Program Demand | Operations | IT AOP 2026 (dark, "161.0 M€ Program AOP + 470.7 M€ Operations AOP").')
bullet('Row 2: Committed Benefits (Hard green / Soft amber) | 2026 Program AOP | 2026 Operations AOP.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Row 1 has 4 tiles, Row 2 has 3 tiles.')
bullet('AC-2: Committed Benefits shows Hard/Soft split.')
bullet('AC-3: Total IT AOP Demand tile has dark blue styling.')
body('Tab(s): 1. Priority: P1 (Must Have).', size=9)

# --- UI-07 ---
req('UI-07', 'Tab 2 KPI Styling')
body('Description: Tab 2 KPI styling MUST use dark blue for Allocated AOP and white for all other tiles. The Allocated AOP tile MUST show an "On top off" indicator.', size=10)

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Allocated AOP tile has dark blue background.')
bullet('AC-2: All other KPI tiles have white background.')
bullet('AC-3: "Demand left unfunded" tile is no longer dark.')
bullet('AC-4: "On top off: +X M€" shown in red when allocation exceeds Total AOP.')
bullet('AC-5: "Under budget: X M€" shown in green when allocation is within Total AOP.')
body('Tab(s): 2. Priority: P2 (Should Have).', size=9)

# --- UI-08 ---
req('UI-08', 'Tab 6 Redesign')
body('Description: Tab 6 MUST be redesigned with a 5-tile KPI row, simplified buttons, and updated styling.', size=10)

body('Implementation:', bold=True, size=10)
bullet('KPI tiles: 5 tiles in one row using repeat(5,1fr) CSS grid.')
bullet('Total IT AOP: dark blue (was plain).')
bullet('Operations AOP: white (was dark).')
bullet('Split of Program AOP: "F&R X | BU Y M€" single-line format.')
bullet('Committed Benefits: Hard/Soft split.')
bullet('Buttons: "Finalise scenario" and "New working version" ONLY. Removed "Export complete portfolio" and "Export portable scenario".')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: 5 KPI tiles in a single row.')
bullet('AC-2: Total IT AOP is dark blue, Operations AOP is white.')
bullet('AC-3: Only 2 buttons visible (Finalise, New Working Version).')
bullet('AC-4: Committed Benefits shows Hard/Soft split.')
body('Tab(s): 6. Priority: P1 (Must Have).', size=9)

# --- UI-09 ---
req('UI-09', 'Filter Auto-Close')
body('Description: All filter dropdowns across all tabs MUST auto-close immediately after a selection is made.', size=10)

body('Implementation:', bold=True, size=10)
bullet('Applies to: ExCo, Organisation, Platform, Funding Status, Type, Investment Area, and all other multi-select filter dropdowns.')
bullet('On selection (click on option): dropdown closes, filter applies, downstream cascading filters update.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Clicking a filter option closes the dropdown.')
bullet('AC-2: Filter is applied immediately on close.')
bullet('AC-3: Cascading downstream filters update after close.')
bullet('AC-4: Applies to all filter dropdowns on all tabs.')
body('Tab(s): All. Priority: P2 (Should Have).', size=9)

# --- UI-10 ---
req('UI-10', 'New Working Version Full Reset')
body('Description: The "New Working Version" button on Tab 6 MUST perform a complete scenario reset.', size=10)

body('Reset Actions:', bold=True, size=10)
bullet('Apply Optimal Segmentation preset (default scenario).')
bullet('Clear all manual overrides (include/exclude decisions).')
bullet('Clear all evidence reviews.')
bullet('Clear all ExCo trade-off budget values.')
bullet('Clear the decision log.')
bullet('Reset scenario revision counter.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: After reset, Optimal Segmentation is active (blue-highlighted button).')
bullet('AC-2: No manual overrides remain.')
bullet('AC-3: Decision log is empty.')
bullet('AC-4: All trade-off budget inputs are cleared.')
bullet('AC-5: Scenario revision counter is reset.')
body('Tab(s): 6. Priority: P1 (Must Have).', size=9)

# ============================================================
# FIN Requirements (unchanged from v5.0)
# ============================================================
heading('Finance Requirements (unchanged from v5.0)', 1)

body('The following finance requirements are carried forward from PRD v5.0 without modification.', size=10)

# --- FIN-01 ---
req('FIN-01', 'Enterprise-Wide Charging Exclusion')
body('Description: The "Enterprise-wide charging" row (Item BU, ~40 M€) MUST be filtered out of all demand records in normalize(). Stored as ewChargingKey on data object for Tab 6 EW split calculation only.', size=10)

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Enterprise-wide charging row does not appear in any table, total, or export.')
bullet('AC-2: ewChargingKey is accessible for Tab 6 EW distribution calculation.')
bullet('AC-3: Total demand is 285.1 M€ (not 325.1 M€).')
body('Tab(s): All (engine-level). Priority: P1 (Must Have).', size=9)

# --- FIN-02 ---
req('FIN-02', 'Tab 6 BU Cluster Allocation Table')
body('Description: Tab 6 Organisation IT Cost Allocation table MUST show 7 TCO BU clusters with BU Led, Enterprise Wide, and Operations columns.', size=10)

body('Columns:', bold=True, size=10)
bullet('BU Led (M€): Direct BU-stream funded programmes + Type II cross-BU allocations via source allocation % keys.')
bullet('Enterprise Wide (M€): Total EW-stream funded demand distributed to BU clusters using the Enterprise-wide charging row allocation keys.')
bullet('Operations (M€): Bill of IT TCO per BU cluster.')
bullet('Total: Sum of all three columns per row.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: Exactly 7 BU cluster rows (Precision Diagnosis, Connected Care, Image Guided Therapy, Personal Health, EI, Innovation & Design, Int. Property & Standards).')
bullet('AC-2: Grand Total = BU Led + EW Charges + Operations = Total IT AOP.')
bullet('AC-3: EW distribution uses normalised proportional allocation keys.')
bullet('AC-4: Amounts recalculate when scenario changes.')
body('Tab(s): 6. Priority: P1 (Must Have).', size=9)

# --- FIN-03 ---
req('FIN-03', 'EW Charging Key Algorithm')
body('Description: The engine MUST extract sub-org allocation fractions from the Enterprise-wide charging row and use them to distribute EW-stream funded demand to BU clusters.', size=10)

body('Algorithm:', bold=True, size=10)
bullet('Source: allocation % columns on the BU sheet for the Enterprise-wide charging row.')
bullet('Map sub-org keys (HPM, MR, G and B, etc.) to BU clusters via SUBORG_BU dictionary.')
bullet('Normalise proportions so they sum to 100%.')
bullet('Distribute total EW-stream prioritised demand across BU clusters using normalised proportions.')

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: All sub-org allocation fractions extracted from source.')
bullet('AC-2: Fractions mapped correctly to BU clusters.')
bullet('AC-3: Distributed EW amounts sum to total EW funded demand.')
bullet('AC-4: Functions/Regions residual shown as separate transparency line when allocation keys are incomplete.')
body('Tab(s): 6. Priority: P1 (Must Have).', size=9)

# --- FIN-04 ---
req('FIN-04', 'Finance QA Harness')
body('Description: Tab 6 MUST include an inline Finance QA reconciliation with 7 checks (5 critical + 2 warning).', size=10)

body('Checks:', bold=True, size=10)
tbl5 = doc.add_table(rows=1, cols=3); tbl5.style = 'Table Grid'
add_header_row(tbl5, ['#', 'Check', 'Level'])
for i, r in enumerate([
    ('1', 'EW + BU stream totals = programme allocation (3dp)', 'Critical'),
    ('2', 'EW allocation % present on funded EW programmes', 'Warning'),
    ('3', 'Allocation % sums to 100% per programme (+/-1%)', 'Critical'),
    ('4', 'EW charges distributed = total EW allocation', 'Critical'),
    ('5', 'Grand Total = Programme AOP + Operations AOP', 'Critical'),
    ('6', 'No negative funded amounts', 'Critical'),
    ('7', 'Funded count consistency', 'Warning'),
]): add_row(tbl5, r, shade=(i%2==1))
doc.add_paragraph()

body('Acceptance Criteria:', bold=True, size=10)
bullet('AC-1: All 7 checks run on every scenario change.')
bullet('AC-2: Critical failures shown with red indicator.')
bullet('AC-3: Warnings shown with amber indicator.')
bullet('AC-4: Expand/collapse detail for each check.')
body('Tab(s): 6. Priority: P1 (Must Have).', size=9)

# ============================================================
# Acceptance Tests (v5.2 additions)
# ============================================================
heading('Acceptance Tests (v5.2 additions)', 1)

body('All tests from v4.0 (AT-A1 through AT-F2) and v5.0 remain. New tests for v5.2:', bold=True, size=10)
tbl6 = doc.add_table(rows=1, cols=3); tbl6.style = 'Table Grid'
add_header_row(tbl6, ['Test ID', 'Description', 'Pass Criteria'])
for i, r in enumerate([
    ('AT-E1', 'ExCo hierarchy loaded', '16 entries in EXCO_HIERARCHY; 35 keys in ORG_TO_EXCO'),
    ('AT-E2', 'ExCo field on all rows', 'Every enriched programme row has non-null exco field'),
    ('AT-E3', 'ExCo filter cascading', 'Select Jie Xue -> org filter shows only CT, DXR, MR, PDU'),
    ('AT-E4', 'Trade-off Apply does not change AOP', 'Total AOP before Apply === Total AOP after Apply'),
    ('AT-E5', 'Trade-off Reset clears inputs', 'All trade-off budget input values are empty after Reset'),
    ('AT-E6', 'Negative trade-off', 'Enter budget < funded -> lowest-merit P4 excluded -> delta shown in red'),
    ('AT-B7', 'Hard/Soft classification present', 'Every row has benefitClass in {hard, soft, qualitative, none}'),
    ('AT-B8', 'Hard benefits consistent', 'Hard sum on Tab 1 === Hard sum on Tabs 3/4 === Hard sum on Tab 6'),
    ('AT-B9', 'Soft benefits consistent', 'Soft sum on Tab 1 === Soft sum on Tabs 3/4 === Soft sum on Tab 6'),
    ('AT-B10', 'Data quality flags', 'High ratio flag present on programmes with benefit/cost > 10x'),
    ('AT-U1', 'Y-axis toggle functional', 'Toggle on Tab 3 switches Y-axis label and data'),
    ('AT-U2', 'Legend on right side', 'Legend element positioned to right of chart, not below'),
    ('AT-U3', 'Summary line present', 'Tabs 3/4/6 show "Programmes funded" and "Committed: X Hard . Y Soft"'),
    ('AT-U4', 'No median/merit on Tabs 3/4/6', 'No text containing "median" or "merit" in chart area of Tabs 3/4/6'),
    ('AT-U5', 'Demand in Scenario collapsible', 'BURF org groups collapse/expand on click'),
    ('AT-U6', 'Filter auto-close', 'Clicking a filter option closes the dropdown immediately'),
    ('AT-U7', 'New Working Version reset', 'After reset: Optimal active, no overrides, empty decision log, no trade-off values'),
    ('AT-U8', 'Tab 6 two buttons only', 'Only "Finalise scenario" and "New working version" buttons visible'),
    ('AT-U9', 'Tab 6 five KPI tiles', '5 KPI tiles in single row; Total IT AOP is dark blue'),
]): add_row(tbl6, r, shade=(i%2==1))
doc.add_paragraph()

# ============================================================
# Traceability Matrix
# ============================================================
heading('Traceability: Requirement to PRD Section', 1)

tbl7 = doc.add_table(rows=1, cols=3); tbl7.style = 'Table Grid'
add_header_row(tbl7, ['Requirement', 'PRD v5.2 Section', 'Status'])
for i, r in enumerate([
    ('EXCO-01', 'Section 2: ExCo Accountability Hierarchy', 'New in v5.2'),
    ('EXCO-02', 'Section 6: Global ExCo Filter', 'New in v5.2'),
    ('EXCO-03', 'Section 9.1: Tab 1 Element Reference', 'New in v5.2'),
    ('EXCO-04', 'Section 5: ExCo Trade-off Cockpit', 'New in v5.2'),
    ('EXCO-05', 'Section 4: Total AOP Protection', 'New in v5.2'),
    ('BEN-01', 'Section 3: Hard/Soft Benefit Classification', 'New in v5.2'),
    ('BEN-02', 'Section 3.4: Display across tabs', 'New in v5.2'),
    ('BEN-03', 'Section 3.3: Data quality flags', 'New in v5.2'),
    ('UI-01', 'Section 7.1: Y-axis toggle', 'New in v5.2'),
    ('UI-02', 'Section 7.2: Legend', 'New in v5.2'),
    ('UI-03', 'Section 7.3: Summary line', 'New in v5.2'),
    ('UI-04', 'Section 7.4: Median/merit text', 'New in v5.2'),
    ('UI-05', 'Section 8: Demand in Scenario Table', 'New in v5.2'),
    ('UI-06', 'Section 9.1: Tab 1 Element Reference', 'New in v5.2'),
    ('UI-07', 'Section 9.2: Tab 2 Element Reference', 'New in v5.2'),
    ('UI-08', 'Section 9.6: Tab 6 Element Reference', 'New in v5.2'),
    ('UI-09', 'Section 11.3: Filter auto-close', 'New in v5.2'),
    ('UI-10', 'Section 11.2: New Working Version', 'New in v5.2'),
    ('FIN-01', 'PRD v5.0 Section 4', 'Unchanged from v5.0'),
    ('FIN-02', 'PRD v5.0 Section 4', 'Unchanged from v5.0'),
    ('FIN-03', 'PRD v5.0 Section 4', 'Unchanged from v5.0'),
    ('FIN-04', 'PRD v5.0 Section 4', 'Unchanged from v5.0'),
]): add_row(tbl7, r, shade=(i%2==1))
doc.add_paragraph()

outpath = 'AOP2027-Modeler-Detailed-Requirements-v5.2.docx'
doc.save(outpath)
print(f'Saved: {outpath}')
