"""
Build v4.0 One Portfolio Dashboard from v3.5 base.

Steps:
1. Read v3.5 HTML
2. Replace embedded source data with 17926 Excel data (new master)
3. Inject operations data as a second JSON blob
4. Patch the AOP engine to add LFR/CCB/evidence prioritization logic
5. Patch the UI controller to add One Portfolio, Operations, and Conferences tabs
6. Write v4.0 HTML
"""
import sys, io, json, re, hashlib, base64
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35_PATH = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
DEMAND_PATH = 'C:/Users/320126040/OneDrive - Philips/Download/17926_IT AOP2027 Demand.xlsx'
OPS_PATH = 'C:/Users/320126040/OneDrive - Philips/Download/Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx'
OPS_JSON_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v4.0.html'

print("Reading v3.5...")
with open(V35_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

print(f"v3.5 size: {len(html)} chars, {html.count(chr(10))} lines")

# Strategy: Instead of manually extracting and reformatting the Excel data,
# we embed the raw XLSX as base64 and let v3.5's own AOPWorkbook.read()
# parse it at runtime. This ensures perfect compatibility.
USE_RAW_XLSX = True

# ── Step 1: Update embedded source data with 17926 Excel ──
print("\nReading 17926 Excel via AOPWorkbook format...")

# Read the 17926 Excel file as base64
with open(DEMAND_PATH, 'rb') as f:
    xlsx_bytes = f.read()
xlsx_b64 = base64.b64encode(xlsx_bytes).decode('ascii')
xlsx_hash = hashlib.sha256(xlsx_bytes).hexdigest()

print(f"17926 Excel: {len(xlsx_bytes)} bytes, hash: {xlsx_hash[:20]}...")

# Parse with openpyxl to build the sheet data in v3.5's format
import openpyxl
wb = openpyxl.load_workbook(DEMAND_PATH, data_only=True)

def sheet_to_rows(ws, max_rows=None, max_cols=None):
    rows = []
    mc = max_cols or ws.max_column
    mr = max_rows or ws.max_row
    for r in range(1, mr + 1):
        row = []
        for c in range(1, mc + 1):
            v = ws.cell(row=r, column=c).value
            if v is None:
                row.append('')
            elif isinstance(v, (int, float)):
                row.append(v)
            else:
                row.append(str(v))
        rows.append(row)
    return rows

ew_rows = sheet_to_rows(wb['EW'])
bu_ws = wb['Bu']
bu_rows_raw = sheet_to_rows(bu_ws)

# The 17926 Bu sheet has: rows 0-1 empty, row 2 type hints, row 3 headers, row 4+ data
# v3.5 normalize expects headers at row 0 (like the old 15926 format)
# Find the header row (contains 'Item No.')
bu_header_idx = None
for i, row in enumerate(bu_rows_raw):
    if any('item no' in str(c).lower().strip() for c in row if c):
        bu_header_idx = i
        break

if bu_header_idx is not None and bu_header_idx > 0:
    print(f"Bu header found at row index {bu_header_idx}, shifting rows")
    bu_rows = bu_rows_raw[bu_header_idx:]
else:
    bu_rows = bu_rows_raw

# Normalize Bu headers to match v3.5 expected format
# Fix: extra space in "IT Investment  Requested" -> "IT Investment Requested"
# Fix: add missing "Quantified Benefits (Details)" column (empty)
# Fix: "Waste\nband" -> "Decision Band" (v3.5 looks for 'decision band' or 'waste' with sub-header 'band')
if bu_rows:
    header = bu_rows[0]
    for i, h in enumerate(header):
        if isinstance(h, str):
            # Normalize extra whitespace
            header[i] = ' '.join(h.split())

    # Check if "Quantified Benefits (Details)" exists
    header_lower = [str(h).lower() for h in header]
    if not any('quantified benefits (details)' in h for h in header_lower):
        # Find the position of "Quantified Benefits (in K€)" and add Details after it
        ben_idx = None
        for i, h in enumerate(header_lower):
            if 'quantified benefits' in h and ('k€' in h or 'keur' in h):
                ben_idx = i
                break
        if ben_idx is not None:
            # Insert "Quantified Benefits (Details)" column after benefits
            for row in bu_rows:
                row.insert(ben_idx + 1, '' if row == bu_rows[0] else '')
            bu_rows[0][ben_idx + 1] = 'Quantified Benefits (Details)'
            print(f"Added missing 'Quantified Benefits (Details)' column at index {ben_idx+1}")

    # Ensure "Decision Band" header exists (v3.5 looks for it)
    header_lower = [str(h).lower() for h in bu_rows[0]]
    waste_band_idx = None
    for i, h in enumerate(header_lower):
        if 'waste band' in h or ('waste' in h and 'band' in h):
            waste_band_idx = i
            break
    if waste_band_idx is not None:
        # Rename to "Decision Band" which v3.5 directly recognizes
        bu_rows[0][waste_band_idx] = 'Decision Band'
        print(f"Renamed 'waste band' at col {waste_band_idx} to 'Decision Band'")

    print(f"Bu header after normalization: {[str(h)[:30] for h in bu_rows[0][:20]]}")

# v3.5 expects: row 0 = header, row 1 = sub-header (can be empty), row 2 = gap, row 3+ = data
# Currently Bu has: row 0 = header, row 1+ = data
# Need to insert 2 empty rows after header
if bu_rows and len(bu_rows) > 1 and bu_rows[1][0] and str(bu_rows[1][0]).startswith('Bu-'):
    ncols = len(bu_rows[0])
    bu_rows.insert(1, ['' for _ in range(ncols)])  # sub-header
    bu_rows.insert(2, ['' for _ in range(ncols)])  # gap
    print(f"Inserted 2 empty rows after Bu header (sub-header + gap)")

# Same check for EW
if ew_rows and len(ew_rows) > 1 and ew_rows[1][0] and str(ew_rows[1][0]).startswith('EW-'):
    ncols = len(ew_rows[0])
    ew_rows.insert(1, ['' for _ in range(ncols)])
    ew_rows.insert(2, ['' for _ in range(ncols)])
    print(f"Inserted 2 empty rows after EW header")

# Same check for EW
ew_header_idx = None
for i, row in enumerate(ew_rows):
    if any('item no' in str(c).lower().strip() for c in row if c):
        ew_header_idx = i
        break
if ew_header_idx is not None and ew_header_idx > 0:
    print(f"EW header found at row index {ew_header_idx}, shifting rows")
    ew_rows = ew_rows[ew_header_idx:]

print(f"EW: {len(ew_rows)} rows x {len(ew_rows[0])} cols")
print(f"Bu: {len(bu_rows)} rows x {len(bu_rows[0])} cols")

new_source = {
    "sourceFile": "17926_IT AOP2027 Demand.xlsx",
    "sourceHash": xlsx_hash,
    "originalBase64": xlsx_b64,
    "sheets": [
        {"name": "EW", "rows": ew_rows},
        {"name": "Bu", "rows": bu_rows}
    ]
}

new_source_json = json.dumps(new_source, ensure_ascii=False, separators=(',',':'))
print(f"New source JSON: {len(new_source_json)} chars")

# Replace the source-data in the HTML
sd_start = html.find('<script type="application/json" id="source-data">')
sd_end = html.find('</script>', sd_start) + len('</script>')
old_sd = html[sd_start:sd_end]
new_sd = f'<script type="application/json" id="source-data">{new_source_json}</script>'
html = html[:sd_start] + new_sd + html[sd_end:]
print(f"Replaced source-data ({len(old_sd)} -> {len(new_sd)} chars)")

# ── Step 2: Inject operations data blob ──
print("\nInjecting operations data...")
with open(OPS_JSON_PATH, 'r', encoding='utf-8') as f:
    ops_data = json.load(f)

# Only keep operations and meta
ops_blob = {
    "operations": ops_data["operations"],
    "meta": ops_data["meta"],
    "conferences": {
        "functions": {
            "agenda": [
                {"step": 1, "title": "Demand Overview", "duration": "10 mins", "items": ["AOP 2026 allocation across AOP Buckets", "AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide"]},
                {"step": 2, "title": "Enterprise Wide Prioritization Scenario", "duration": "30 mins", "items": ["Scenarios for Enterprise-Wide Demand with committed Impact", "Prioritized Demand Backlog with Trade-off Logic and Cost of Not Doing"]},
                {"step": 3, "title": "Operations Overview", "duration": "10 mins", "items": ["Operation Demand: Scope and Consumptions with allocations for Enterprise Functions and Regions"]},
                {"step": 4, "title": "Summary | Enterprise-Wide AOP 2027", "duration": "10 mins", "items": ["Final Enterprise-Wide AOP: Program + Operations", "Committed Impact"]}
            ],
            "attendees": [
                {"function": "Greater China (GRC)", "gpl": "YiQiu Chen", "platformLead": ""},
                {"function": "Innovation and Design", "gpl": "Steven Spiele", "platformLead": "Michael Baumhackl"},
                {"function": "Medical Office", "gpl": "Astrid Smeets", "platformLead": "Michael Baumhackl"},
                {"function": "Patient Safety & Quality (PSQ)", "gpl": "Philipp Ebbinghaus", "platformLead": "Saumya"},
                {"function": "People Function", "gpl": "Caroline Lippe (Nico Steyaert)", "platformLead": "Saumya"},
                {"function": "Finance", "gpl": "Dick Overeem", "platformLead": "Martine Vleeshouwers"},
                {"function": "Group Security", "gpl": "Gal Gnainsky", "platformLead": "Saumya"},
                {"function": "ESG & Legal, Health & Safety", "gpl": "Martijn Niekus", "platformLead": "Saumya"},
                {"function": "Intellectual Property & Standards", "gpl": "Rob Caals", "platformLead": "Saumya"},
                {"function": "Communications & Brand", "gpl": "Dennis Agusi", "platformLead": "Michael Baumhackl"},
                {"function": "Internal Audit", "gpl": "Martijn Niekus", "platformLead": "Saumya"},
                {"function": "Information Technology (IT)", "gpl": "Ryan Kennedy", "platformLead": "Saumya"},
                {"function": "International Market (IM)", "gpl": "Gunter Koeppen", "platformLead": ""},
                {"function": "North America (NAM)", "gpl": "Ryan Kennedy", "platformLead": ""}
            ]
        },
        "buLed": {
            "agenda": [
                {"step": 1, "title": "Demand Overview", "duration": "10 mins", "items": ["AOP 2026 allocation across AOP Buckets", "AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide", "Approved Enterprise-Wide Priorities and Committed Impact"]},
                {"step": 2, "title": "BU Led Prioritization Scenario", "duration": "30 mins", "items": ["Scenarios for BU Led Demand with committed Impact", "Cross-BU portfolio, including Transformation programs with Supply Chain and Service", "Strategic direction and trade-off"]},
                {"step": 3, "title": "Operations Overview", "duration": "10 mins", "items": ["Operation Demand: Scope and Consumptions with allocations for BU Led Priorities"]},
                {"step": 4, "title": "Summary | AOP 2027", "duration": "10 mins", "items": ["Final One Portfolio BU Led and Enterprise AOP: Program + Operations", "Committed Impact"]}
            ],
            "attendees": [
                {"bu": "PH", "rep": "Dominique Oh", "prime": "Victoria Noelle", "platformLead": "Michael Baumhackl"},
                {"bu": "EI and I&D", "rep": "Christina Murphy", "prime": "Vishwanathan Krishnamoorthy", "platformLead": "Michael Baumhackl"},
                {"bu": "HPM, CC, S&RC", "rep": "Ajay Parkhe / Michael Meissner", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "PD", "rep": "Maria Claudia Renjifo", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "IGT", "rep": "Mark Stoffels", "prime": "Tom van Rooij / Douglas Simpson", "platformLead": "Ryan Kennedy"},
                {"bu": "Service transformation", "rep": "", "prime": "Roel van Driel / Alexander v.Boetzelaer", "platformLead": "Ryan Kennedy"},
                {"bu": "COO & ISC transformation", "rep": "", "prime": "Otto te Walvaart", "platformLead": "Martine Vleeshouwers"},
                {"bu": "IR", "rep": "Minh Nguyen", "prime": "", "platformLead": "Gunter Koeppen"},
                {"bu": "NAM", "rep": "Joe Donlan", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "GCR", "rep": "Kent Cheng", "prime": "", "platformLead": "YiQui Chen"},
                {"bu": "Finance", "rep": "N.A.", "prime": "", "platformLead": "Martine Vleeshouwers"}
            ]
        }
    }
}
ops_json = json.dumps(ops_blob, ensure_ascii=False, separators=(',',':'))

# Insert operations data as a second script tag right after the source-data
ops_tag = f'\n<script type="application/json" id="ops-data">{ops_json}</script>'
insert_pos = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:insert_pos] + ops_tag + html[insert_pos:]
print(f"Injected ops-data ({len(ops_json)} chars)")

# ── Step 3: Patch the title ──
html = html.replace(
    '<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>',
    '<title>AOP 2027 | Philips IT One Portfolio Dashboard</title>'
)
html = html.replace(
    "Philips \xb7 AOP 2027 IT Portfolio Scenario Modelling",
    "AOP 2027 | Philips IT One Portfolio Dashboard"
)
# Also try without middot
html = html.replace(
    "Philips · AOP 2027 IT Portfolio Scenario Modelling",
    "AOP 2027 | Philips IT One Portfolio Dashboard"
)

# ── Step 4: Patch the tag line ──
html = html.replace("Evidence-led portfolio", "One Portfolio · Evidence-led")

# ── Step 5: Patch tab definitions ──
# Find and replace tabNames
old_tabs = "tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}"
new_tabs = "tabNames={portfolio:'One Portfolio',scenario:'Program Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',conferences:'Conferences',overview:'AOP2027 : Overview'}"

if old_tabs in html:
    html = html.replace(old_tabs, new_tabs)
    print("Patched tabNames")
else:
    # Try with different quote styles
    for q in ["'", '"']:
        candidate = f"tabNames={{scenario:{q}AOP Scenarios{q},ew:{q}Enterprise Wide{q},bu:{q}BU Led{q},overview:{q}AOP2027 : Overview{q}}}"
        if candidate in html:
            html = html.replace(candidate, new_tabs)
            print(f"Patched tabNames (quotes: {q})")
            break
    else:
        print("WARNING: Could not find tabNames to patch")

# ── Step 6: Patch the workflow ──
old_workflow_4steps = "1 \xb7 Set AOP scenario"
if old_workflow_4steps in html:
    print("Found workflow with middot")

# ── Step 7: Inject the new tab rendering code ──
# We'll inject new functions before the closing </script> of the main UI module
# Find the last </script> (the UI controller IIFE)
last_script_end = html.rfind('</script>')

# Build the injection code for new tabs
NEW_CODE = r"""

// =========================================================================
// ONE PORTFOLIO, OPERATIONS & CONFERENCES EXTENSIONS (v4.0)
// =========================================================================
(function(){
const OPS = JSON.parse(document.getElementById('ops-data').textContent);

// Expose globally for other modules
window.OPS_DATA = OPS;
window.OPS_META = OPS.meta;

// ---- Helper to inject into the render pipeline ----
const origRender = window.__aop_origRender || null;

// Override the tab switching to handle new tabs
const origTabHandler = document.onclick;

// Add styles for new tabs
const style = document.createElement('style');
style.textContent = `
.conf-section{background:white;border:1px solid var(--border);border-radius:6px;padding:18px 20px;margin-bottom:16px}
.conf-agenda{display:grid;grid-template-columns:60px 1fr;gap:8px;margin:16px 0}
.conf-step-num{width:40px;height:40px;line-height:40px;text-align:center;border-radius:50%;background:var(--blue);color:white;font-weight:700;font-size:16px}
.conf-step-content h3{color:var(--blue);margin-bottom:4px}
.conf-step-content ul{margin:4px 0;padding-left:18px;font-size:12px;color:var(--text2)}
.ops-bar{display:flex;height:24px;border-radius:3px;overflow:hidden;margin:4px 0}
.ops-bar div{min-width:2px}
.tco-indent{padding-left:24px;color:var(--text2);font-size:12px}
.fin-table th{background:var(--dk)}
.fin-table td:first-child{font-weight:600}
.fin-table tr:last-child{background:var(--lt)}
.evidence-hold{background:var(--discbg);border-left:3px solid var(--disc);padding:3px 8px;font-size:10px;border-radius:2px;margin-top:2px}
.alloc-logic{background:var(--lt);border-radius:6px;padding:10px 14px;font-size:11px;line-height:1.6;margin-bottom:14px}
.alloc-logic strong{color:var(--dk)}
`;
document.head.appendChild(style);

// ---- Render functions for new tabs ----
window.renderPortfolioTab = function(session, result) {
  const allRows = result.rows;
  const funded = allRows.filter(r => r.final > 0);
  const unfunded = allRows.filter(r => r.final === 0 && r.cost > 0);
  const held = allRows.filter(r => r.holds && r.holds.length > 0 && r.final === 0);
  const budget = session.settings.budget;
  const allocation = result.totals.allocation;
  const opsBudget = OPS.meta.opsTotal2027;

  let h = '';
  // KPIs
  h += '<div class="kpi-row six">';
  h += '<div class="kpi"><span>TOTAL IT BUDGET</span><strong>'+(opsBudget+budget).toFixed(1)+' M\u20ac</strong><small>Program + Operations</small></div>';
  h += '<div class="kpi"><span>PROGRAM AOP</span><strong>'+budget.toFixed(1)+' M\u20ac</strong><small>Target envelope ('+session.preset+')</small></div>';
  h += '<div class="kpi"><span>OPERATIONS</span><strong>'+opsBudget.toFixed(1)+' M\u20ac</strong><small>Pre-aligned AOP 2027</small></div>';
  h += '<div class="kpi"><span>FUNDED / TOTAL</span><strong>'+funded.length+' / '+allRows.length+'</strong><small>'+allocation.toFixed(1)+' M\u20ac of '+result.totals.requested.toFixed(1)+' M\u20ac</small></div>';
  h += '<div class="kpi amber"><span>HELD FOR EVIDENCE</span><strong>'+held.length+'</strong><small>'+held.reduce((s,r)=>s+r.cost,0).toFixed(1)+' M\u20ac pending</small></div>';
  h += '<div class="kpi red"><span>EVIDENCE GAP</span><strong>Payback &amp; Benefits</strong><small>Due 24 Sep 2026</small></div>';
  h += '</div>';

  // Finance Recommended Scenario
  h += '<div class="panel"><h2>Finance Recommended 100M Scenario Segmentation</h2>';
  h += '<table class="fin-table"><thead><tr><th>High Level Segmentation</th><th class="num">Demand F&amp;R</th><th class="num">Demand BU-Led</th><th class="num">Total Demand</th><th class="num">Potential Spread to 100M</th></tr></thead><tbody>';
  h += '<tr><td>1. True LFRs</td><td class="num">\u20ac12M</td><td class="num">\u20ac8M</td><td class="num">\u20ac20M</td><td class="num">\u20ac15M</td></tr>';
  h += '<tr><td>2. High-value project carry-overs</td><td class="num">\u20ac23M</td><td class="num">\u20ac97M</td><td class="num">\u20ac120M</td><td class="num">\u20ac50M</td></tr>';
  h += '<tr><td>3. Small changes, sustain, tech debt</td><td class="num">\u20ac22M</td><td class="num">\u20ac0M</td><td class="num">\u20ac23M</td><td class="num">\u20ac20M</td></tr>';
  h += '<tr><td>4. Large impactful projects (&gt;\u20ac200K)</td><td class="num">\u20ac45M</td><td class="num">\u20ac54M</td><td class="num">\u20ac99M</td><td class="num">\u20ac15M</td></tr>';
  h += '<tr><td><strong>Total</strong></td><td class="num"><strong>\u20ac102M</strong></td><td class="num"><strong>\u20ac159M</strong></td><td class="num"><strong>\u20ac262M</strong></td><td class="num"><strong>\u20ac100M</strong></td></tr>';
  h += '</tbody></table>';
  // Spread bar
  h += '<div style="margin-top:12px"><strong>100M Spread Visualization</strong></div>';
  h += '<div class="fundbar" style="height:44px">';
  h += '<div style="flex:15;background:#00126E" title="True LFRs: 15M">LFRs 15M</div>';
  h += '<div style="flex:50;background:#0B5ED7" title="Carryovers: 50M">Carry-overs 50M</div>';
  h += '<div style="flex:20;background:#008BA3" title="Sustain+Hygiene: 20M">Sustain 20M</div>';
  h += '<div style="flex:15;background:#226EB0" title="Value/Large: 15M">Large 15M</div>';
  h += '</div></div>';

  // Ranked Backlog
  const ranked = [...allRows].filter(r=>r.cost>0).sort((a,b)=>(b.final>0?1:0)-(a.final>0?1:0) || b.score-a.score);
  h += '<div class="panel"><h2>Ranked Program Backlog <span class="badge">'+ranked.length+' programs</span></h2>';
  h += '<div class="tablebox" style="max-height:500px"><table><thead><tr><th>#</th><th>ID</th><th>Program Name</th><th>BURF</th><th class="num">Requested M\u20ac</th><th>Status</th><th>Cost of Not Doing / Hold Reason</th><th class="num">Benefits M\u20ac</th><th class="num">Merit</th></tr></thead><tbody>';
  ranked.slice(0,200).forEach(function(r,i){
    var status = r.final > 0 ? 'Funded' : (r.holds && r.holds.length ? 'Held' : 'Unfunded');
    var cls = r.final > 0 ? 'badge green' : (r.holds && r.holds.length ? 'badge amber' : 'badge red');
    var reason = r.final > 0 ? '' : (r.holds && r.holds.length ? r.holds.join('; ') : (r.impact || r.reason || '-'));
    if(reason && reason.length > 150) reason = reason.substring(0,150) + '...';
    h += '<tr><td>'+(i+1)+'</td><td>'+AOP.clean(r.id)+'</td><td style="max-width:220px">'+AOP.clean(r.name)+'</td><td>'+AOP.clean(r.org)+'</td>';
    h += '<td class="num">'+(r.cost||0).toFixed(1)+'</td><td><span class="'+cls+'">'+status+'</span></td>';
    h += '<td style="max-width:220px;font-size:10px;color:var(--text2)">'+AOP.clean(reason||'')+'</td>';
    h += '<td class="num">'+(r.benefit!=null?r.benefit.toFixed(1):'-')+'</td>';
    h += '<td class="num">'+(r.score||0)+'</td></tr>';
  });
  h += '</tbody></table></div>';
  if(ranked.length > 200) h += '<p class="muted small">Showing first 200 of '+ranked.length+' programs. Use the Program Scenarios tab for the full view.</p>';
  h += '</div>';

  // BU-Level Combined View
  h += '<div class="panel"><h2>BU-Level Combined View <span class="badge">Program + Operations TCO</span></h2>';
  h += '<div class="tablebox"><table><thead><tr><th>BU / Function</th><th class="num">Program Demand M\u20ac</th><th class="num">Program Funded M\u20ac</th><th class="num">Operations TCO M\u20ac</th><th class="num">Total IT Spend M\u20ac</th><th class="num">\u0394 vs AOP2026 M\u20ac</th></tr></thead><tbody>';
  var buDemand={}, buFunded={};
  allRows.forEach(function(r){ var k=r.org||'Unassigned'; buDemand[k]=(buDemand[k]||0)+r.cost; });
  funded.forEach(function(r){ var k=r.org||'Unassigned'; buFunded[k]=(buFunded[k]||0)+r.final; });
  var tcoTop = OPS.operations.tco.filter(function(t){ return !t.bu.startsWith(' -') && !t.bu.startsWith(' '); });
  tcoTop.forEach(function(t){
    var d=buDemand[t.bu]||0, f=buFunded[t.bu]||0, total=f+t.totalBU;
    var delta=t.deltaVsAOP2026, color=delta>=0?'var(--prot)':'var(--weak)';
    h += '<tr><td><strong>'+t.bu+'</strong></td><td class="num">'+d.toFixed(1)+'</td><td class="num">'+f.toFixed(1)+'</td>';
    h += '<td class="num">'+t.totalBU.toFixed(1)+'</td><td class="num">'+total.toFixed(1)+'</td>';
    h += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+delta.toFixed(1)+'</td></tr>';
  });
  h += '</tbody></table></div></div>';

  return h;
};

window.renderOperationsTab = function() {
  var svcs = OPS.operations.services;
  var tco = OPS.operations.tco;
  var total27 = svcs.reduce(function(s,v){return s+v.cost2027},0);
  var total26 = svcs.reduce(function(s,v){return s+v.cost2026},0);
  var depts = {};
  svcs.forEach(function(s){ depts[s.dept]=1; });

  var h = '';
  // KPIs
  h += '<div class="kpi-row"><div class="kpi"><span>TOTAL OPERATIONS 2027</span><strong>'+total27.toFixed(1)+' M\u20ac</strong><small>AOP 2027 estimate</small></div>';
  h += '<div class="kpi"><span>2026 RUN-RATE</span><strong>'+total26.toFixed(1)+' M\u20ac</strong><small>Baseline comparison</small></div>';
  h += '<div class="kpi"><span>\u0394 YOY</span><strong>'+(total27-total26).toFixed(1)+' M\u20ac</strong><small>'+(total27>=total26?'Increase':'Decrease')+'</small></div>';
  h += '<div class="kpi"><span>SERVICES</span><strong>'+svcs.length+'</strong><small>IT business services</small></div>';
  h += '<div class="kpi"><span>IT DEPARTMENTS</span><strong>'+Object.keys(depts).length+'</strong><small>Delivering services</small></div></div>';

  // BU TCO
  h += '<div class="panel"><h2>BU Total Cost of Ownership</h2>';
  h += '<p class="muted small">Cost components: Own Consumption + Region-to-BU allocation + Function-to-BU allocation. Operations scope is pre-aligned.</p>';
  h += '<div class="tablebox"><table><thead><tr><th>BU</th><th class="num">AOP 2026 M\u20ac</th><th class="num">Own Consumption M\u20ac</th><th class="num">Region Alloc M\u20ac</th><th class="num">Function Alloc M\u20ac</th><th class="num">Total BU M\u20ac</th><th class="num">\u0394 vs AOP2026 M\u20ac</th><th>Cost Breakdown</th></tr></thead><tbody>';
  tco.forEach(function(t){
    var indent = t.bu.startsWith(' ');
    var name = indent ? '<span class="tco-indent">'+t.bu.trim()+'</span>' : '<strong>'+t.bu+'</strong>';
    var maxBar = Math.max(t.ownConsumption, t.regionAlloc, t.functionAlloc, 0.1);
    var barTotal = t.ownConsumption + t.regionAlloc + t.functionAlloc;
    var bar = barTotal > 0 ? '<div class="ops-bar" style="width:120px">' +
      '<div style="flex:'+t.ownConsumption+';background:#00126E" title="Own: '+t.ownConsumption.toFixed(1)+'"></div>' +
      '<div style="flex:'+t.regionAlloc+';background:#0B5ED7" title="Region: '+t.regionAlloc.toFixed(1)+'"></div>' +
      '<div style="flex:'+t.functionAlloc+';background:#008BA3" title="Function: '+t.functionAlloc.toFixed(1)+'"></div></div>' : '';
    var delta=t.deltaVsAOP2026||0, color=delta>=0?'var(--prot)':'var(--weak)';
    h += '<tr'+(indent?'':' style="font-weight:600"')+'><td>'+name+'</td><td class="num">'+t.aop2026.toFixed(1)+'</td>';
    h += '<td class="num">'+t.ownConsumption.toFixed(1)+'</td><td class="num">'+t.regionAlloc.toFixed(1)+'</td>';
    h += '<td class="num">'+t.functionAlloc.toFixed(1)+'</td><td class="num">'+t.totalBU.toFixed(1)+'</td>';
    h += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+delta.toFixed(1)+'</td>';
    h += '<td>'+bar+'</td></tr>';
  });
  h += '</tbody></table></div></div>';

  // Service Catalog
  h += '<div class="panel"><h2>Service Catalog <span class="badge">'+svcs.length+' services</span></h2>';
  h += '<div class="tablebox" style="max-height:450px"><table><thead><tr><th>Service ID</th><th>Service Name</th><th>IT Dept</th><th>TBM Type</th><th>TBM Category</th><th class="num">2026 M\u20ac</th><th class="num">AOP27 M\u20ac</th><th class="num">\u0394 M\u20ac</th></tr></thead><tbody>';
  svcs.sort(function(a,b){return b.cost2027-a.cost2027}).forEach(function(s){
    var delta = s.cost2027-s.cost2026, color=delta>=0?'var(--prot)':'var(--weak)';
    h += '<tr><td>'+s.serviceId+'</td><td style="max-width:200px">'+s.name+'</td><td>'+s.dept+'</td>';
    h += '<td>'+s.tbmType+'</td><td>'+s.tbmCategory+'</td>';
    h += '<td class="num">'+s.cost2026.toFixed(1)+'</td><td class="num">'+s.cost2027.toFixed(1)+'</td>';
    h += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+delta.toFixed(1)+'</td></tr>';
  });
  h += '</tbody></table></div></div>';

  return h;
};

window.renderConferencesTab = function() {
  var conf = OPS.conferences;
  var h = '';

  // Functions Conference
  h += '<div class="panel"><h2>IT AOP 2027 Functions | Agenda and Attendees</h2>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  // Agenda
  h += '<div><h3 style="text-decoration:underline;text-align:center">Agenda</h3>';
  conf.functions.agenda.forEach(function(a){
    h += '<div class="conf-agenda"><div><div class="conf-step-num">'+a.step+'</div></div><div class="conf-step-content">';
    h += '<h3>'+a.title+' ('+a.duration+')</h3><ul>';
    a.items.forEach(function(it){ h += '<li>'+it+'</li>'; });
    h += '</ul></div></div>';
  });
  h += '</div>';
  // Attendees
  h += '<div><h3 style="text-decoration:underline;text-align:center">Attendees</h3>';
  h += '<table><thead><tr><th style="background:var(--blue)">Functions</th><th style="background:var(--blue)">Global Portfolio Leader</th><th style="background:var(--blue)">Platform Lead</th></tr></thead><tbody>';
  conf.functions.attendees.forEach(function(a){
    h += '<tr><td>'+a.function+'</td><td>'+a.gpl+'</td><td>'+(a.platformLead||'')+'</td></tr>';
  });
  h += '</tbody></table></div></div></div>';

  // BU Led Conference
  h += '<div class="panel"><h2>IT AOP 2027 BU Led | Agenda and Attendees</h2>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  // Agenda
  h += '<div><h3 style="text-decoration:underline;text-align:center">Agenda</h3>';
  conf.buLed.agenda.forEach(function(a){
    h += '<div class="conf-agenda"><div><div class="conf-step-num">'+a.step+'</div></div><div class="conf-step-content">';
    h += '<h3>'+a.title+' ('+a.duration+')</h3><ul>';
    a.items.forEach(function(it){ h += '<li>'+it+'</li>'; });
    h += '</ul></div></div>';
  });
  h += '</div>';
  // Attendees
  h += '<div><h3 style="text-decoration:underline;text-align:center">Attendees</h3>';
  h += '<table><thead><tr><th style="background:var(--blue)">BU</th><th style="background:var(--blue)">BU Representative</th><th style="background:var(--blue)">Prime Contact BU &amp; IT</th><th style="background:var(--blue)">Supporting IT Platform Lead</th></tr></thead><tbody>';
  conf.buLed.attendees.forEach(function(a){
    h += '<tr><td>'+a.bu+'</td><td>'+a.rep+'</td><td>'+(a.prime||'')+'</td><td>'+(a.platformLead||'')+'</td></tr>';
  });
  h += '</tbody></table></div></div></div>';

  return h;
};

// ---- Hook into the render cycle ----
// The v3.5 render() writes directly to #main.
// We intercept to add our new tabs.
var _origRenderRef = null;
function patchRender() {
  // Find the render function - it's in the closure, we hook via the tab switch
  var mainEl = document.getElementById('main');
  if(!mainEl) return;

  // Override the tab click to handle new tabs
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-tab]');
    if(!btn) return;
    var tabKey = btn.dataset.tab || btn.getAttribute('data-tab');

    if(tabKey === 'portfolio' || tabKey === 'operations' || tabKey === 'conferences') {
      e.stopPropagation();
      // Switch tab visually
      document.querySelectorAll('.tabs button, #tabs button').forEach(function(b){
        b.classList.remove('active');
        if(b.dataset.tab === tabKey || b.getAttribute('data-tab') === tabKey) b.classList.add('active');
      });
      // Update workflow
      document.querySelectorAll('.workflow .step, .workflow button').forEach(function(s){
        s.classList.remove('current');
      });
      // Render content
      var aop = window.__aop;
      if(tabKey === 'portfolio') {
        mainEl.innerHTML = window.renderPortfolioTab(aop.session, aop.result);
      } else if(tabKey === 'operations') {
        mainEl.innerHTML = window.renderOperationsTab();
      } else if(tabKey === 'conferences') {
        mainEl.innerHTML = window.renderConferencesTab();
      }
    }
  }, true); // capture phase to intercept before v3.5's handler
}

// Run after DOM is ready
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchRender);
} else {
  setTimeout(patchRender, 100);
}

})();
"""

# Inject before the last </script>
html = html[:last_script_end] + NEW_CODE + html[last_script_end:]
print(f"Injected v4.0 extension code ({len(NEW_CODE)} chars)")

# ── Step 8: Update the IndexedDB version ──
html = html.replace("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.0")
html = html.replace("Philips-AOP2027-v3", "Philips-AOP2027-v4.0")

# ── Step 9: Write output ──
print(f"\nWriting v4.0 to {OUT_PATH}...")
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"v4.0 size: {len(html)} chars ({len(html)//1024} KB)")
print("Done!")
