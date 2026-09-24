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
r2 = p2.add_run('Version 4.0  |  24 September 2026  |  Companion to PRD v4.0')
set_font(r2, size=11, color=(74, 85, 104))
doc.add_paragraph()

body('This document defines what each control does, how funding changes propagate, what the source workbook must provide, how exports must be formed, and how operations data is structured. Requirements use language: MUST (mandatory), SHOULD (recommended), MAY (optional). Companion document: AOP2027-Modeler-PRD-v4.0.docx.', size=10.5)

body('Requirement groups: NAV navigation; SC scenario experience; MET metrics; RULE funding classification; SCORE merit scoring; CONF portfolio edits; FIL filters; OPS operations; DATA source and refresh; SAVE persistence; EXP exports; UX design; AT acceptance tests.', size=10)

# ============================================================
heading('Navigation and Scenario Structure', 1)

req('NAV 01', 'Render exactly six tabs in order: Demand Overview, Program AOP Scenarios, Enterprise Wide, BU Led, Operations, AOP 2027 : One Portfolio. Program AOP Scenarios opens first.')
req('NAV 02', 'All six tabs are always accessible. No completion checkpoints or unlock dependencies between tabs.')

heading('Scenario Experience', 2)
req('SC 01', 'Tab 2 Section 1: Five KPI cards and a four-segment funding bar, all driven by final scenario results. Show: Allocated AOP (M€ and % of Total AOP, funded count, Within/Over status), Initiatives Funded (count, partial scope count), EW/BU Led Share (split M€ and %), Open to Prioritisation or Over Total AOP (M€, variance text), Demand Left Unfunded (M€, missing request count).')
req('SC 02', 'Tab 2 Section 2: Total AOP input, four preset buttons, four lever cards in horizontal desktop layout. Each lever card shows current allocation and fundable demand. Presets: Optimal Segmentation (Recommended), Protect Commitments, Tighten Carryover Evidence, Release Sustain Capacity. Manual override to any lever marks scenario as Custom. Presets retain entered Total AOP and manual programme decisions.')
req('SC 03', 'Tab 2 Section 3: Funding Prioritization Gate — five cards (Gate 0 + four priorities). Gate number and name displayed inline. Bullet-list definitions at 10pt. No demand/target/allocated details on gate cards.')
req('SC 04', 'Tab 2 Merit Score Framework: Five component cards in a single row (five-column grid). Bullet-list descriptions. Components: Benefit Strength (40%), Submitted Priority (25%), Captured Consequence (15%), Decision Band (10%), Payback Period (10%).')
req('SC 05', 'Tab 2 Demand Prioritized: open by default. BUR, Platform, Priority multi-select filters. Updates after EW/BU decisions.')
req('SC 06', 'Tab 2 Demand Not Funded: open by default. Shows all programmes with zero final or residual unfunded demand.')
req('SC 07', 'Tab 2 Decision Log: 3 columns — Revision/Time, Change Origin, Change Details (business-readable 1-liner, not raw JSON). Business summaries: "Included EW-42 at 2.1 M€", "Excluded BU-103", "Applied preset: Optimal Segmentation".')
req('SC-DQ 01', 'Demand Overview (Tab 1): No Data Quality card. Show 5 executive KPIs: Total IT AOP (M€), Program Demand (M€, count), Operations (M€, service count), Committed Impact (M€, EW/BU split), 2026 Run-Rate (M€, YoY Δ). Then Demand Split by Organisation table with org/platform filters.')

# ============================================================
heading('Metric Definitions and Financial Identities', 1)

req('MET 01', 'Calculate all metrics from unrounded amounts. Display uses upward one-decimal rounding (ceiling to 1 dp, preserving sign). Exported values use full source precision.')
req('MET 02', 'Funding-bar segments show final allocation per priority stage. Divide segments by final allocation, not the envelope. Show segment labels when space permits.')
req('MET 03', 'Reconcile (all within ±0.01 M€): numeric requested = final + unfunded; EW final + BU final = portfolio final; stage totals = portfolio final; Total AOP = final + available - over.')
req('MET 04', 'Total IT AOP = Programme Final Allocation + Operations AOP (469.7 M€). Shown on Tab 1 and Tab 6.')
req('MET 05', 'Operations AOP 469.7 M€ is constant across Tab 1, Tab 5, and Tab 6. It does not change with programme decisions.')

# ============================================================
heading('Funding Classification and Prioritization Gates', 1)

req('RULE 01', 'Gate 0 checks identity, amount, and recorded decision evidence for all rows. Gates 1–4 are mutually exclusive funding stages (P1/P2/P3/P4). A held row stays in its classified stage — it is not promoted or demoted by holds.')
req('RULE 02', 'P1 CCB exceptions: EW-11 (Group Functions 7.7 M€), EW-65 (Supply Chain 4.2 M€), EW-71 (Finance 6.3 M€). Always funded at current requested amount regardless of other evidence gates.')
req('RULE 03', 'P3 Hygiene category aliases: "Continuous Improvement", "Continous Improvement", "Continuous Improvement (CI)", "Upgrades & Enhancements". A versioned alias dictionary normalises spelling variants. Decommissioning/Replatforming goes to P4 after mandatory and Sustain precedence.')
req('RULE 04', 'P4 catch-all: LFRs without compliance name or year, carry-overs without baselined amount, all demand not qualifying for P1/P2/P3. No intermediate "held" category in P1 or P2 — ineligible demand goes directly to P4.')

heading('Evidence Holds (Gate 0)', 2)
req('RULE 05', 'Evidence eligibility holds prevent automatic selection. Programme stays visible. Manual override is possible (logged as "manual evidence exception"). Holds: (a) name missing; (b) no positive request; (c) priority TBD; (d) unrecognised Overall AOP decision; (e) Contain condition missing; (f) no benefit evidence (P4 only); (g) negative benefit; (h) below carry-over RoI threshold (P2); (i) below merit floor (P4); (j) benefit claim above 10.0x not reviewed (P2/P4).')
body('RULE 05 change from v3.2: review threshold raised from 5.0x to 10.0x.', size=9)

req('RULE 06', 'Deterministic priority order. P1: P1 Immediate, P2 Scheduled, CCB. Within each tier: LFR name+year present first, then merit desc, benefit/cost desc, submitted priority desc, stable ID asc. P2: benefit/cost ratio desc, merit desc. P3: Change & Sustain first, then Hygiene by merit. P4: evidence strength, then merit.')
req('RULE 07', 'Lever target = basis formula (see PRD Section 4.3). Targets are reservations, not promises. If reservations exceed Total AOP: preserve settings, show conflict, apply stage order.')
req('RULE 08', 'Scan eligible rows in priority order. Select only if stage spending ≤ stage limit AND portfolio spending ≤ portfolio limit. Stage limit = target × (1+tol), capped by bucket demand. Portfolio limit = Total AOP × (1+tol). P2: cap at min(Requested, Baselined).')
req('RULE 09', 'Tolerance: default 0.0%, configurable 0.0–5.0%. Maximum overshoot allowance, not a minimum spend requirement.')
req('RULE 10', 'Record automatic results first. Then apply manual overrides by stable ID. Manual inclusions may push total above automatic limit. No silent displacement of other programmes.')

# ============================================================
heading('Merit Scoring Framework', 1)

req('SCORE 01', 'Merit score = Σ (raw_i / max_i) × weight_i. Five components: Benefit Strength (max 50), Submitted Priority (max 25), Captured Consequence (max 15), Decision Band (max 10), Payback Period (max 10). Weights configurable; must sum to 100.0.')
body('SCORE 01 change from v3.2: 4 → 5 components; default weights [50,25,15,10] → [40,25,15,10,10].', size=9)

req('SCORE 02', 'Advanced weights are nonnegative and must sum to 100.0 across all five components. Applying weights updates all scores immediately. Payback Period weight is a 5th input in Advanced Configuration.')

req('SCORE 03', 'Hybrid Benefit Scoring (Path decision tree):\n(1) If numeric benefit > 0: use ratio tiers (SCORE 07). benefitSource = "quantitative".\n(2) If benefitDetails text matches revenue/productivity keywords (SCORE 05) but no numeric benefit: score = 0, warning added. benefitSource = "revenue-productivity-unquantified".\n(3) Else: apply qualitative text analysis (SCORE 04). benefitSource = "qualitative" or "none".\nAll enriched records must carry benefitSource field. Programme detail popup must display it.')

req('SCORE 04', 'Qualitative Benefit Scoring (Path 3 fallback). Analyse benefitDetails text with deterministic regex. Tiers:\n0 pts — Empty, "NA", "TBD", "Soft Benefit", or < 10 characters.\n10 pts — Non-trivial text, no specific indicators.\n20 pts — Specific benefit keywords (cost avoidance, efficiency, compliance, automation, enablement) with context > 50 chars.\n30 pts — Numeric values + non-financial units (FTEs, %, hours, processes) OR enterprise/global scope with benefit language.\nMaximum qualitative score: 30 of 50 points.')

req('SCORE 05', 'Revenue/Productivity Quantification Rule. If benefitDetails matches /revenue (increase|growth|generation)|productivity (saving|gain|improvement)|sales growth|top-?line growth/i AND numeric benefit is null or zero: benefit score = 0. Add warning: "Revenue/productivity claim requires quantified benefit". This is a scoring rule, not a hold.')

req('SCORE 06', 'Payback Period Component. Fifth merit component (10% default weight). Source field discovery aliases: "Payback Period", "Payback", "Payback (Years)". If column absent: all score 0, no error. Tiers: ≤1yr=10, ≤2yr=8, ≤3yr=6, ≤5yr=4, >5yr or missing=0. Warning (not hold) when benefit > 0 and payback missing.')

req('SCORE 07', 'Revised Benefit Ratio Tiers (from v4.7). Quantitative scoring bands:\n< 1.0x = 0 pts\n1.0x – 3.0x = 15 pts\n3.0x – 5.0x = 25 pts\n5.0x – 7.0x = 35 pts\n7.0x – 10.0x = 50 pts\n> 10.0x = 50 pts + hold ("Benefit claim above 10.0x needs review")')

# ============================================================
heading('Portfolio Table Edits and Shared Recalculation', 1)

req('CONF 01', 'EW and BU tabs display BURF summary rows collapsed by default. Summary shows: funded/total count, representative band, average merit, summed requested/prioritised/unfunded, summed benefits, evidence count fraction. First column and header sticky during scroll.')
req('CONF 02', 'Commit numeric edits on Enter or blur. Escape cancels uncommitted value. Validate: reject negative, excessive, non-numeric amounts. Rejected amount reverts to previous. No keystroke-level commits.')
req('CONF 03', 'One immutable event per committed edit. One transaction for group actions. Update: scenario revision, final results, executive KPIs, stream totals, chart, all tabs, decision log. Target: < 500ms for 1,000 records.')
req('CONF 04', 'Table edits preserve automatic baseline. Exclusion leaves available AOP open; no silent refill. Manual scope reduction shown as "Partial scope" with residual unfunded amount visible.')
req('CONF 05', 'No dialog on checkbox or amount change. Log operational explanation as business-readable 1-liner. Optional business rationale field. Inline evidence review panel for consequence tier, benefit review, and condition.')
req('CONF 06', 'Tabs are always accessible. EW and BU are independently editable views of one shared scenario. No completion or validation dependencies.')
req('CONF 07', 'Source refresh: unchanged stable-ID decisions auto-carried. Changed evidence holds prior decisions for inline review. Removed records retain old source and decision history.')
req('CONF 08', 'Automatic funding is whole-programme. EW and BU edits write to the same result and do not allocate a second time.')
req('CONF 09', 'Undo creates a new inverse event (never erases history). Finalised scenarios are read-only — fork to edit. Manual scope changes are not described as automatic actions.')

# ============================================================
heading('Cascading Filters, Chart, and Programme Details', 1)

req('FIL 00', 'Demand Prioritized (Tab 2) has independent multi-select BUR, Platform, Priority filters. Priority maps to the four funding stages. These filters affect only the table; they never change funding decisions.')
req('FIL 01', 'EW/BU/Overview filter row: Organisation, Platform, New/Carryover/Sustain, Investment Area, Funding Status, plus text search and Download Excel. Filter row remains horizontal at desktop width.')
req('FIL 02', 'Values within one filter combine with OR. Separate filters combine with AND. No selection = All (including blank). "Not supplied" option for missing source values. Downstream filter option counts reflect all other active filters (cascading).')
req('FIL 03', 'Text search matches source ID, programme name, and organisation. Clear All resets filter state only (not levers or decisions). Tab filters saved separately per scope and persisted with scenario.')
req('FIL 04', 'Dynamic X of Y total row. All filterable tables show "X of Y" format in total row when any filter is active. Engine tables (EW/BU/Overview/Prioritized): "funded/shown of total" in identity, "sum of baseline" in numeric columns. v4.3 tables (Demand Split, TCO, Service Catalog, Allocation): "X of Y" on all data columns. Reverts to standard format when filters cleared.')
req('FIL 05', 'Organisation IT Cost Allocation (Tab 6) has Organisation and Platform filters. X of Y on all four data columns when filtered. Platform filter reflects programme demand platform (canonical name).')

# ============================================================
heading('Operations Tab Requirements (Tab 5)', 1)

req('OPS 01', 'Operations tab is read-only. Operations costs are pre-aligned and do not change with programme decisions. Six header KPIs: Total Operations 2027 (469.7 M€), 2026 Run-Rate (470.7 M€), Δ YoY (-1.0 M€), BU Own (317.6 M€), From Regions (63.5 M€), From Functions (88.5 M€).')
req('OPS 02', 'Organisation Total Cost of Ownership table: 3-level collapsible hierarchy (BU Cluster → Sub-Organisation → Services). Columns: Organisation, AOP2027 Costs M€, Own Consumption (M€|%), Regions to BU (M€|%), Functions & CoEs (M€|%), Δ vs AOP2026 M€. All numeric columns centre-aligned. Δ colour: positive (cost increase) = red; negative (cost decrease) = green.')
req('OPS 03', 'TCO Organisation and Platform filter bar. Cascading counts. X of Y on AOP2027 total when filtered. Platform options from BU cluster → canonical platform mapping (see PRD Section 6.3).')
req('OPS 04', 'Service Catalog table. Columns: Service ID, Service Name, Platform Name, AOP2027 Costs M€, AOP2026 Costs M€, Δ vs AOP2026 M€. Δ colour: positive = red, negative = green. Platform filter. X of Y on AOP2027 and AOP2026 total cells when filtered.')
req('OPS 05', 'Platform lookup: (1) SVC_PLATFORM_MAP by service ID (from Platform Service List). (2) DEPT_PLATFORM fallback by IT dept code. (3) normalizePlatform() applied to all results. All nine canonical platform names must appear in filter options when data is present. 14 services currently Unallocated from AI Services, AN6, B69+, B72, Transfers depts.')

# ============================================================
heading('Source Workbook and Normalised Record Contract', 1)

req('DATA 01', 'Import .xlsx workbooks equivalent to 15926_IT AOP2027 Demand.xlsx. Two sheets: EW and Bu. Headers rows 1-3, demand from row 4. Resolve composite headings by normalised name + subheading. 22 standard fields + paybackYears (new, optional) extracted.')

body('22 standard source fields:', bold=True, size=10)
tbl = doc.add_table(rows=1, cols=3); tbl.style = 'Table Grid'
add_header_row(tbl, ['Field', 'Source Column', 'Notes'])
for i, r in enumerate([
    ('item','A: Item No.','Stable ID for overrides and session migration'),
    ('planisware','B: Planisware ID','Secondary identity'),
    ('org','C: Organization setting demand','BURF grouping'),
    ('name','D: Initiative name','Required for automatic funding'),
    ('type','E: Type','Display only'),
    ('newCarry','F: New initiative or Carry-over','P2/P3 classification'),
    ('category','G: Category','P3 Hygiene and P4 Decomm classification'),
    ('platform','H: Leading IT Platform','Filtering; normalised via normalizePlatform()'),
    ('area','M: Investment Area','Filtering'),
    ('priority','V(EW)/T(BU): Priority','Merit scoring; position before Problem Statement'),
    ('cost','O: IT Investment Requested 2027 [k€]','K€ → M€ (/1000)'),
    ('benefit','Q: Quantified Benefits (in K€)','K€ → M€; null if blank'),
    ('benefitDetails','S(EW)/R(BU): Quantified Benefits (Details)','Qualitative text for hybrid scoring'),
    ('impact','T(EW)/S(BU): Impact and Cost of Not Doing','Consequence scoring'),
    ('problem','AH(EW)/AF(BU): Problem Statement','Consequence scoring'),
    ('scope','AI(EW)/AG(BU): Scope','Consequence scoring'),
    ('dependency','AJ(EW)/AH(BU): Dependency','Display'),
    ('decisionBand','AY(EW)/AW(BU): Decision Band (Waste band)','Merit scoring'),
    ('overall','BM(EW)/BK(BU): Overall AOP decision','Classification and holds'),
    ('remarks','BN(EW)/BL(BU): Remarks/evidence','Contain condition'),
    ('lfrYear','K: LFR & Compliancy year','P1 evidence gate'),
    ('lfrName','L: LFR & Compliancy (Name)','P1 evidence gate'),
    ('baselined','P: Carry Over Baselined','P2 evidence gate and funding cap; K€ → M€'),
    ('paybackYears','[Payback Period column — TBD]','5th merit component; defaults to 0 when column absent'),
]): add_row(tbl, r, shade=(i%2==1))
doc.add_paragraph()

req('DATA 02', 'Carry Over Baselined (col P) is normalised from K€ to M€ (÷1000). It is the P2 funding cap, not a target. It must be positive for P2 eligibility.')
req('DATA 03', 'Currency source is K€. Engine normalises to M€ once at ingestion. Negative amounts are rejected (requested) or flagged (benefits). Formula-cell errors propagate as null. Preserve original formula text, cached result, and unit.')
req('DATA 04', 'Refresh transaction: validate schema compatibility, show mapping and missing headers, compare by stable ID and fingerprint, display added/changed/removed/unchanged counts. Apply only after accepted preview. Create new source version and working scenario. Preserve previous scenario for recovery.')
req('DATA 05', 'Item No. is primary stable identity. Changed evidence fingerprint holds prior decisions for inline review. Removed records remain in old source history. Never carry partial amount above revised request.')
req('DATA 06', 'Refresh report: file/hash, source version, row count, demand total, missing demand, benefits coverage, Decision Band coverage, Overall AOP decision coverage, mapping version, issues list.')
req('DATA 07', 'Payback Period validation. Warning (not hold): "Payback period missing for quantified benefit claim" when benefit > 0 and paybackYears is null or zero. Qualitative-only programmes do not require payback.')

# ============================================================
heading('Scenario Persistence and Decision History', 1)

req('SAVE 01', 'Preset applies named settings to current source. Existing manual overrides retained. Visible state shows "Custom based on [preset name]". Separate explicit Reset manual overrides button.')
req('SAVE 02', 'Mark unsaved changes after any committed setting, review, or programme edit. Save requires name. Duplicate names disambiguated by revision. Up to 8 most recent saves visible.')
req('SAVE 03', 'Open restores exact saved source and rule versions, settings, overrides. Validate records against workbook snapshot. Recompute with saved deterministic rule version.')
req('SAVE 04', 'Finalise freezes revision. Over-budget does not block it. Manual evidence exceptions logged. Changed-source decisions must be resolved before finalise.')
req('SAVE 05', 'Portable scenario export: schema version, content checksums. Import rejects malformed or incompatible versions. Session schema 3 (4 weights) auto-migrates to schema 4 (5 weights [40,25,15,10,10]) on load.')

# ============================================================
heading('Excel Downloads and Traceability', 1)

req('EXP 01', 'Actual .xlsx files. Filtered view export from EW/BU/Overview: exact filtered row set + settings + filter context. Export inclusions from Tab 2: all programmes with final > 0.')
req('EXP 02', 'All rows, score evidence, and source reference use identical stable IDs. Totals from same calculation result as dashboard. Exact numeric amounts. Display rounding in HTML only.')
req('EXP 03', 'Filtered exports state row count and scope. Summary amounts identify full-scenario vs exported-subset totals. Change Log sheet: Date/Time, Action, Programme ID, Name, Org, Origin Tab, Old Value, New Value, Business Note, Revision.')
req('EXP 04', 'Portable scenario file is separate from demand refresh. Restores source, settings, decisions, versions. Reject unsupported schema or rule versions.')
req('EXP 05', 'One canonical calculation engine for all row edits, settings, exports, and scenarios. Excel and dashboard must show identical values for the same scenario revision.')

# ============================================================
heading('Programme Detail Popup', 1)

req('UX 04', 'Programme Name opens a read-only popup: programme name, ID, stage, status, prioritised demand, merit score + benefit multiple + benefitSource label, 5-row merit score breakdown table, consequence evidence, funding rationale, filtered source fields.')
req('UX 05', 'Source field filter (modal): whitelist-based, per-stream column map. Shows only decision-relevant fields: Item No., Organisation, Initiative Name, Type, New/Carry-over, Category, Platform, Investment Area, LFR fields, Requested, Benefits (numeric + details), Impact, Priority, Problem Statement, Scope, Dependency, Overall AOP decision, Remarks. Excludes: TBM data, Waste assessment questions, sub-org allocation columns, capitalisation, handshaked amounts.')

# ============================================================
heading('Platform Mapping Requirements', 1)

req('OPS 03A', 'normalizePlatform(name) function defined globally. Maps any platform name variant (with or without "IT-" prefix, "IT" suffix, spelling variants) to the canonical form. Available to both rendering IIFEs via window.normalizePlatform.')

body('Normalization lookup table (canonical ← all source variants):', bold=True, size=10)
tbl2 = doc.add_table(rows=1, cols=2); tbl2.style = 'Table Grid'
add_header_row(tbl2, ['Canonical Name', 'Source Variants'])
for i, r in enumerate([
    ('Commercial IT','"Commercial IT", "IT-Commercial IT"'),
    ('Enterprise Architecture, Data & Integration','"Enterprise Architecture, Data & Integration", "IT-Ent.Architecture,Data&Integration", "Ent. Architecture, Data & Integration"'),
    ('Group Functions & Hyperautomation','"Group Functions & Hyperautomation IT", "IT-Group Functions and Hyperautomation", "Group Functions and Hyperautomation"'),
    ('Infrastructure Services','"Infrastructure Services – Projects", "Infrastructure Services - Projects", "IT-Infrastructure Services"'),
    ('Innovation and Digital','"Innovation and Digital IT", "IT-Innovation and Digital"'),
    ('Integrated Supply Chain & Finance','"Integrated Supply Chain & Finance", "IT-Integrated Supply Chain and Finance", "Integrated Supply Chain and Finance"'),
    ('Security, Risk & Compliance','"IT-Security,Risk&Compliance", "Security,Risk&Compliance", "IT-Security, Risk & Compliance"'),
    ('Services & Solutions IT','"Services & Solutions IT", "IT-Services&Solutions IT", "Services&Solutions IT"'),
    ('Greater China IT','"Greater China IT"'),
    ('Mergers, Acquisitions & Divestments','"Mergers, Acquisitions & Divestments"'),
    ('Portfolio IT','"Portfolio IT"'),
    ('Unallocated','"Unallocated", "Not supplied", AI Services/AI Svcs/AN6/B69+/B72/Transfers depts'),
]): add_row(tbl2, r, shade=(i%2==1))
doc.add_paragraph()

req('OPS 03B', 'DEPT_PLATFORM mapping. IT dept code → canonical platform. Source: Bill of IT Platform Service List (Updated 23 Sep 2026). Apply normalizePlatform() to all values.')
req('OPS 03C', 'SVC_PLATFORM_MAP mapping. Service ID → canonical platform. Source: Platform Service List. Look up by service ID first; fall back to DEPT_PLATFORM if not found. Apply normalizePlatform() to all results.')
req('OPS 03D', 'Platform normalization applied to programme demand rows at render time via window.normalizePlatform. Applied to: r.platform field of all 521 programme demand rows. Ensures EW/BU/Overview/Allocation tables and filters use canonical names consistent with operations.')

# ============================================================
heading('Acceptance Tests (v4.0 additions)', 1)

body('All tests from v3.2 AT 01–AT 15 remain. New tests:', bold=True, size=10)
tbl3 = doc.add_table(rows=1, cols=3); tbl3.style = 'Table Grid'
add_header_row(tbl3, ['Test ID', 'Description', 'Pass Criteria'])
for i, r in enumerate([
    ('AT-A1','No Data Quality card on Tab 1','Tab 1 has exactly 2 demand-card elements; none contains "Data Quality"'),
    ('AT-A2','10x benefit review threshold','Hold message contains "10.0x"; no hold contains "5.0x"'),
    ('AT-A3','5 new benefit ratio tiers','bp=0 for 0.5x; 15 for 1.5x; 25 for 4x; 35 for 6x; 50 for 8x'),
    ('AT-A4','P1/P2/P3 classification unchanged after scoring change','Stage counts identical before/after: P1=18, P2=23, P3=148, P4=332'),
    ('AT-A5','5 merit components','rawComponents.length=5 on every enriched record'),
    ('AT-A6','Payback null → 0 pts','pk=0 when paybackYears is null'),
    ('AT-A7','Payback 1yr → 10 pts, 4yr → 4 pts','pk=10 when paybackYears=1; pk=4 when paybackYears=4'),
    ('AT-A8','Schema migration','Session with 4 weights [50,25,15,10] auto-migrates to [40,25,15,10,10]; schema 3→4'),
    ('AT-B1','Quantitative path','benefitSource="quantitative" when benefit > 0'),
    ('AT-B2','Qualitative scoring','benefitSource="qualitative" for non-trivial text-only programmes'),
    ('AT-B3','Trivial text scores 0','benefitSource="none" for "NA", "TBD", < 10 chars'),
    ('AT-B4','Qualitative cap','No qualitative rawComponent[0] > 30'),
    ('AT-B5','Rev/prod rule','Programme with revenue keyword, no numeric benefit → bp=0 + warning'),
    ('AT-B6','Modal benefit source','Programme detail popup shows benefitSource label'),
    ('AT-O1','Operations tab renders','469.7 M€ total, 6 KPIs visible, TCO table present'),
    ('AT-O2','No IT- prefix in any filter','All filter option values in all tables use canonical platform names'),
    ('AT-O3','Service catalog 6 columns','Columns: ID, Name, Platform, 2027, 2026, Delta'),
    ('AT-O4','TCO delta colours','Positive delta cell colour contains "weak" (red); negative contains "prot" (green)'),
    ('AT-O5','All 9 platforms in svcCatalog','Commercial IT, Ent.Arch, Group Functions, Infrastructure, Innovation, ISC&F, Security, Services&Solutions, Unallocated all present'),
    ('AT-F1','X of Y total format','Filter applied → total row shows "X of Y"; filter cleared → standard format restored'),
    ('AT-F2','Allocation table filter','Tab 6 platform filter has ≥ 5 options; filtering reduces visible rows; X of Y in total'),
]): add_row(tbl3, r, shade=(i%2==1))
doc.add_paragraph()

outpath = 'AOP2027-Modeler-Detailed-Requirements-v4.0.docx'
doc.save(outpath)
print(f'Saved: {outpath}')
