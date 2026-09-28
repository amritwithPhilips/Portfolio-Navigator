"""
Build v4.1 One Portfolio Dashboard from v3.5 base.
Changes from v4.0:
- Tab 1: Demand Overview (new)
- Tab 2: Program AOP Scenarios (renamed)
- Tab 3: Enterprise Wide (unchanged)
- Tab 4: BU Led (unchanged)
- Tab 5: Operations (collapsible BU groups)
- Tab 6: AOP 2027 : One Portfolio (merged ops, BURF allocation)
- Remove Conferences tab
- Add sorting on Benefit/Merit Score columns
- Remove chart summary text in One Portfolio
"""
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35_PATH = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
PARSED_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/17926-parsed-sheets.json'
OPS_JSON_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v4.1.html'

print("Reading v3.5...")
with open(V35_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# ── Step 1: Replace source data with 17926 parsed sheets ──
print("Reading parsed 17926 sheets...")
with open(PARSED_PATH, 'r', encoding='utf-8') as f:
    parsed = json.load(f)

for sheet in parsed['sheets']:
    if sheet['name'] == 'Bu':
        rows = sheet['rows']
        if not rows[0][0] and rows[3][0] == 'Item No.':
            sheet['rows'] = rows[3:]
        header = sheet['rows'][0]
        header_lower = [str(h).lower() for h in header]
        if not any('quantified benefits (details)' in h for h in header_lower):
            ben_idx = next((i for i,h in enumerate(header_lower) if 'quantified benefits' in h and 'k' in h), None)
            if ben_idx is not None:
                for row in sheet['rows']:
                    row.insert(ben_idx+1, '')
                sheet['rows'][0][ben_idx+1] = 'Quantified Benefits (Details) '
        header = sheet['rows'][0]
        for i, h in enumerate(header):
            if isinstance(h, str):
                norm = h.replace('\r','').replace('\n',' ').strip().lower()
                if norm == 'waste band':
                    sheet['rows'][0][i] = 'Decision Band'

parsed['sheets'] = [s for s in parsed['sheets'] if s['name'] in ('EW', 'Bu')]
new_source_json = json.dumps(parsed, ensure_ascii=False, separators=(',',':'))

sd_start = html.find('<script type="application/json" id="source-data">')
sd_end = html.find('</script>', sd_start) + len('</script>')
html = html[:sd_start] + f'<script type="application/json" id="source-data">{new_source_json}</script>' + html[sd_end:]
print(f"Replaced source-data ({len(new_source_json)} chars)")

# ── Step 2: Inject operations data ──
with open(OPS_JSON_PATH, 'r', encoding='utf-8') as f:
    ops_data = json.load(f)
ops_blob = {"operations": ops_data["operations"], "meta": ops_data["meta"]}
ops_json = json.dumps(ops_blob, ensure_ascii=False, separators=(',',':'))
ops_tag = f'\n<script type="application/json" id="ops-data">{ops_json}</script>'
insert_pos = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:insert_pos] + ops_tag + html[insert_pos:]
print(f"Injected ops-data ({len(ops_json)} chars)")

# ── Step 3: Patch title and tagline ──
html = html.replace('<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>',
                     '<title>AOP 2027 | Philips IT One Portfolio Dashboard</title>')
html = html.replace("Evidence-led portfolio", "One Portfolio \xb7 Evidence-led")

# ── Step 4: Patch tabNames ──
old_tabs = "tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}"
new_tabs = "tabNames={demand:'Demand Overview',scenario:'Program AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'}"
html = html.replace(old_tabs, new_tabs)
print("Patched tabNames")

# ── Step 5: Patch workflow bar ──
old_workflow = "function workflow(){return '<div class=\"workflow\"><button data-tab=\"scenario\" class=\"step '+(tab==='scenario'?'current':'')+'\">"
old_workflow += "1 \xb7 Set AOP scenario</button><button data-tab=\"ew\" class=\"step '+(tab==='ew'?'current':'')+'\">"
old_workflow += "2 \xb7 Review Enterprise Wide</button><button data-tab=\"bu\" class=\"step '+(tab==='bu'?'current':'')+'\">"
old_workflow += "3 \xb7 Review BU Led</button><button data-tab=\"overview\" class=\"step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'\">"
old_workflow += "4 \xb7 Review and finalise</button></div>';}"

new_workflow = """function workflow(){return '<div class="workflow"><button data-tab="demand" class="step '+(tab==='demand'?'current':'')+'">1 · Demand Overview</button><button data-tab="scenario" class="step '+(tab==='scenario'?'current':'')+'">2 · Program AOP Scenarios</button><button data-tab="ew" class="step '+(tab==='ew'?'current':'')+'">3 · Enterprise Wide</button><button data-tab="bu" class="step '+(tab==='bu'?'current':'')+'">4 · BU Led</button><button data-tab="operations" class="step '+(tab==='operations'?'current':'')+'">5 · Operations</button><button data-tab="overview" class="step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'">6 · One Portfolio</button></div>';}"""

if old_workflow in html:
    html = html.replace(old_workflow, new_workflow)
    print("Patched workflow bar")
else:
    print("WARNING: workflow bar not patched (exact match failed)")

# ── Step 6: Patch render() to handle new tabs ──
# The render() function checks tab==='scenario' to call scenario(), else stream(tab)
# We need to add demand and operations handling
old_render_main = "$('#main').innerHTML=tab==='scenario'?scenario():stream(tab);"
new_render_main = "$('#main').innerHTML=tab==='scenario'?scenario():tab==='demand'?window.renderDemandOverview(session,result):tab==='operations'?window.renderOperationsTab():stream(tab);"
if old_render_main in html:
    html = html.replace(old_render_main, new_render_main)
    print("Patched render() for new tabs")
else:
    print("WARNING: render() main dispatch not patched")

# ── Step 7: Patch overview tab - remove chart summary text ──
# The stream() function has: '<p>Showing '+shown.length+' of '+rows.length+' records...
# We want to remove this paragraph for the overview tab
old_chart_summary = "'+filters(scope,rows)+chart(shown)+'<p>Showing '+shown.length+' of '+rows.length+' records \\xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \\xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'+table(shown,scope,editable)+'"
new_chart_summary = "'+filters(scope,rows)+chart(shown)+'+(scope===\"overview\"?\"\":\"<p>Showing \"+shown.length+\" of \"+rows.length+\" records \\xb7 Filtered request \"+money(AOP.sum(shown,r=>r.cost))+\" \\xb7 Filtered prioritised \"+money(AOP.sum(shown,r=>r.final))+\"</p>\")+table(shown,scope,editable)+'"
# This is tricky with the minified code. Let me try a simpler replacement.
# Replace the exact p tag in stream()
old_p = "+'<p>Showing '+shown.length+' of '+rows.length+' records \\xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \\xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'+"
new_p = "+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records \\xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \\xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+"
# Use the actual middot character
old_p_actual = "+'<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'+"
new_p_actual = "+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+"
if old_p_actual in html:
    html = html.replace(old_p_actual, new_p_actual)
    print("Patched: removed chart summary text for overview")
else:
    print("WARNING: chart summary text patch failed")

# ── Step 8: Patch overview KPIs to include operations ──
# The stream() function creates KPIs. For overview, we want to add ops data.
# We'll inject a post-render hook instead (cleaner than patching minified code)

# ── Step 9: Patch the "table actions" text that follows the chart in overview
old_table_actions_text = "'<p>BURF totals remain visible when closed. Score is the unweighted average merit; money is summed, with the average below. Missing amounts are excluded from their average. Evid. counts numeric submitted benefit claims, not validated benefits. ('+rows.length+' displayed programs)</p>"
new_table_actions_text = "'+(scope===\"overview\"?\"\":\"<p>BURF totals remain visible when closed. Score is the unweighted average merit; money is summed, with the average below. Missing amounts are excluded from their average. Evid. counts numeric submitted benefit claims, not validated benefits. (\"+rows.length+\" displayed programs)</p>\")+(scope===\"overview\"?\"<p class=muted>Program demand detail by BURF. Use Enterprise Wide and BU Led tabs for editable views.</p>\":\"\")+"
# Try with the actual string
if old_table_actions_text in html:
    html = html.replace(old_table_actions_text, new_table_actions_text, 1)
    print("Patched: replaced table actions text for overview")

# ── Step 10: Patch IndexedDB ──
html = html.replace("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.1")

# ── Step 11: Patch the overview notice text ──
old_notice = "Read-only consolidated portfolio. Finalise records acceptance of the displayed funding, variance and evidence exceptions. Refreshed decisions held for review must be resolved first. Over-budget decisions remain explicit."
new_notice = "One Portfolio: Program + Operations AOP 2027. Finalise records acceptance of the displayed funding, variance and evidence exceptions."
html = html.replace(old_notice, new_notice)

# ── Step 12: Inject v4.1 extension code ──
EXTENSION_CODE = r"""

// =========================================================================
// v4.1 ONE PORTFOLIO EXTENSIONS
// =========================================================================
(function(){
'use strict';
const OPS = JSON.parse(document.getElementById('ops-data').textContent);
window.OPS_DATA = OPS;

// Additional CSS
const st = document.createElement('style');
st.textContent = `
.demand-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.demand-card{background:white;border:1px solid var(--border);border-radius:6px;padding:16px}
.demand-card h3{color:var(--dk);margin-bottom:10px;font-size:14px}
.demand-stat{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--mist);font-size:12px}
.demand-stat:last-child{border-bottom:none}
.demand-stat .val{font-weight:700;color:var(--dk)}
.insight-table th{background:var(--dk);color:white;font-size:10px;padding:8px 10px}
.insight-table td{padding:7px 10px;font-size:11px;border-bottom:1px solid var(--mist)}
.insight-table tr:nth-child(even){background:#f6f9fd}
.dq-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
.dq-tbd{background:var(--discbg);color:#715800}
.ops-group-row{background:var(--mist)!important;font-weight:600;cursor:pointer}
.ops-group-row td:first-child::before{content:'▶ ';font-size:10px;color:var(--text3)}
.ops-group-row.expanded td:first-child::before{content:'▼ '}
.ops-child-row{display:none}
.ops-child-row.visible{display:table-row}
.ops-bar-mini{display:flex;height:18px;border-radius:3px;overflow:hidden;min-width:80px}
.ops-bar-mini div{min-width:1px}
.alloc-overview{margin-top:16px}
.alloc-overview th{background:var(--blue)}
.alloc-overview td.total-col{background:#f0f5ff;font-weight:700}
.sortable{cursor:pointer;user-select:none}
.sortable:hover{text-decoration:underline}
.sort-asc::after{content:' ▲';font-size:8px}
.sort-desc::after{content:' ▼';font-size:8px}
`;
document.head.appendChild(st);

// ---- Utility ----
function fmt(v,d){return v==null||isNaN(v)?'-':Number(v).toFixed(d===undefined?1:d);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

// ---- SORTING MECHANISM ----
document.addEventListener('click', function(e){
  var th = e.target.closest('th.sortable');
  if(!th) return;
  var table = th.closest('table');
  if(!table) return;
  var idx = Array.from(th.parentNode.children).indexOf(th);
  var tbody = table.querySelector('tbody') || table;
  var rows = Array.from(tbody.querySelectorAll('tr:not(.group):not(.burf-summary):not(.summary-total):not(.ops-group-row)'));
  if(!rows.length) return;

  // Determine sort direction
  var asc = th.classList.contains('sort-asc');
  table.querySelectorAll('th').forEach(function(h){h.classList.remove('sort-asc','sort-desc');});
  th.classList.add(asc?'sort-desc':'sort-asc');

  rows.sort(function(a,b){
    var ca = a.children[idx], cb = b.children[idx];
    if(!ca||!cb) return 0;
    var va = ca.textContent.trim().replace(/[€M,]/g,'');
    var vb = cb.textContent.trim().replace(/[€M,]/g,'');
    var na = parseFloat(va), nb = parseFloat(vb);
    if(!isNaN(na)&&!isNaN(nb)) return asc?(nb-na):(na-nb);
    return asc?vb.localeCompare(va):va.localeCompare(vb);
  });
  rows.forEach(function(r){tbody.appendChild(r);});
}, false);

// ---- TAB 1: DEMAND OVERVIEW ----
window.renderDemandOverview = function(session, result){
  var allRows = result.rows;
  var ewRows = allRows.filter(function(r){return r.stream==='ew';});
  var buRows = allRows.filter(function(r){return r.stream==='bu';});
  var ewDemand = ewRows.reduce(function(s,r){return s+r.cost;},0);
  var buDemand = buRows.reduce(function(s,r){return s+r.cost;},0);
  var totalDemand = ewDemand + buDemand;
  var opsBudget = OPS.meta.opsTotal2027;

  var h = '';

  // Section 1: Three-column overview cards
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">';

  // Program Demand Card
  h += '<div class="demand-card"><h3>Program Demand Overview</h3>';
  h += '<div class="demand-stat"><span>Total Programs</span><span class="val">'+allRows.filter(function(r){return r.cost>0;}).length+'</span></div>';
  h += '<div class="demand-stat"><span>Total Demand</span><span class="val">'+fmt(totalDemand)+' M\u20ac</span></div>';
  h += '<div class="demand-stat"><span>Enterprise Wide</span><span class="val">'+ewRows.length+' programs \xb7 '+fmt(ewDemand)+' M\u20ac</span></div>';
  h += '<div class="demand-stat"><span>BU Led</span><span class="val">'+buRows.length+' programs \xb7 '+fmt(buDemand)+' M\u20ac</span></div>';
  var cats = {};
  allRows.forEach(function(r){var c=r.category||'Not classified';cats[c]=(cats[c]||0)+1;});
  var topCats = Object.entries(cats).sort(function(a,b){return b[1]-a[1];}).slice(0,3);
  h += '<div class="demand-stat"><span>Top Categories</span><span class="val" style="font-size:10px">'+topCats.map(function(c){return c[0]+' ('+c[1]+')';}).join(', ')+'</span></div>';
  h += '</div>';

  // Operations Card
  h += '<div class="demand-card"><h3>Operations Overview (Pre-aligned)</h3>';
  h += '<div class="demand-stat"><span>Total Operations AOP 2027</span><span class="val">'+fmt(opsBudget)+' M\u20ac</span></div>';
  h += '<div class="demand-stat"><span>2026 Run-Rate</span><span class="val">'+fmt(OPS.meta.opsTotal2026)+' M\u20ac</span></div>';
  h += '<div class="demand-stat"><span>\u0394 YoY</span><span class="val" style="color:'+(opsBudget>=OPS.meta.opsTotal2026?'var(--prot)':'var(--weak)')+'">'+fmt(opsBudget-OPS.meta.opsTotal2026)+' M\u20ac</span></div>';
  h += '<div class="demand-stat"><span>IT Services</span><span class="val">'+OPS.operations.services.length+'</span></div>';
  var depts = {};
  OPS.operations.services.forEach(function(s){depts[s.dept]=1;});
  h += '<div class="demand-stat"><span>IT Departments</span><span class="val">'+Object.keys(depts).length+'</span></div>';
  h += '</div>';

  // Data Quality Card
  h += '<div class="demand-card"><h3>Data Quality</h3>';
  var withBenefit = allRows.filter(function(r){return r.benefit!=null&&r.benefit>0;}).length;
  var withImpact = allRows.filter(function(r){return r.impact&&r.impact.length>10;}).length;
  h += '<div class="demand-stat"><span>Programs with Benefits</span><span class="val">'+withBenefit+' / '+allRows.length+'</span></div>';
  h += '<div class="demand-stat"><span>Programs with Impact</span><span class="val">'+withImpact+' / '+allRows.length+'</span></div>';
  h += '<div class="demand-stat"><span>Payback Period Data</span><span class="val"><span class="dq-badge dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h += '<div class="demand-stat"><span>Qualitative Benefits</span><span class="val"><span class="dq-badge dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h += '<div class="demand-stat"><span>Quantitative Benefits</span><span class="val"><span class="dq-badge dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h += '</div>';
  h += '</div>';

  // Section 2: BURF Demand Split (Program + Operations)
  h += '<section class="panel"><h2>Demand Split by BURF \u2014 Program and Operations</h2>';
  h += '<div class="tablebox" style="max-height:500px"><table class="insight-table"><thead><tr>';
  h += '<th class="sortable">BURF / Organisation</th><th class="sortable num">Program Count</th><th class="sortable num">Program Demand M\u20ac</th>';
  h += '<th class="sortable num">Program Funded M\u20ac</th><th class="sortable num">Operations TCO M\u20ac</th>';
  h += '<th class="sortable num">Total IT M\u20ac</th><th class="sortable num">Program % of Total</th>';
  h += '</tr></thead><tbody>';

  // Aggregate by org
  var orgData = {};
  allRows.forEach(function(r){
    var k = r.org || 'Unassigned';
    if(!orgData[k]) orgData[k] = {count:0, demand:0, funded:0};
    orgData[k].count++;
    orgData[k].demand += r.cost||0;
    orgData[k].funded += r.final||0;
  });

  // Match with operations TCO
  var tcoMap = {};
  OPS.operations.tco.filter(function(t){return !t.bu.startsWith(' ');}).forEach(function(t){tcoMap[t.bu]=t;});

  var orgEntries = Object.entries(orgData).sort(function(a,b){return b[1].demand-a[1].demand;});
  var totalFunded = 0, totalOps = 0;
  orgEntries.forEach(function(e){
    var k=e[0], d=e[1];
    var tco = tcoMap[k] || {totalBU:0};
    var total = d.funded + tco.totalBU;
    var pct = total > 0 ? ((d.funded/total)*100).toFixed(0) : '0';
    totalFunded += d.funded;
    totalOps += tco.totalBU;
    h += '<tr><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td><td class="num">'+fmt(d.demand)+'</td>';
    h += '<td class="num">'+fmt(d.funded)+'</td><td class="num">'+fmt(tco.totalBU)+'</td>';
    h += '<td class="num" style="font-weight:700">'+fmt(total)+'</td><td class="num">'+pct+'%</td></tr>';
  });
  // Total row
  h += '<tr style="background:var(--lt);font-weight:700"><td>Total</td><td class="num">'+allRows.filter(function(r){return r.cost>0;}).length+'</td>';
  h += '<td class="num">'+fmt(totalDemand)+'</td><td class="num">'+fmt(totalFunded)+'</td>';
  h += '<td class="num">'+fmt(totalOps)+'</td><td class="num">'+fmt(totalFunded+totalOps)+'</td><td class="num"></td></tr>';
  h += '</tbody></table></div></section>';

  // Section 3: High-level Insights
  h += '<section class="panel"><h2>High-Level Insights</h2>';
  h += '<table class="insight-table"><thead><tr><th>Insight</th><th>Detail</th><th>Implication</th></tr></thead><tbody>';
  h += '<tr><td>Total IT Budget</td><td>'+fmt(totalDemand+opsBudget)+' M\u20ac (Program '+fmt(totalDemand)+' + Operations '+fmt(opsBudget)+')</td><td>Program demand is '+fmt(totalDemand/opsBudget*100,0)+'% of operations spend</td></tr>';
  h += '<tr><td>Demand vs Envelope</td><td>'+fmt(totalDemand)+' M\u20ac demand against 100 M\u20ac envelope</td><td>'+fmt(totalDemand/100*100,0)+'% oversubscribed \u2014 '+fmt(totalDemand-100)+' M\u20ac must be deferred or descoped</td></tr>';
  h += '<tr><td>EW / BU Split</td><td>EW '+fmt(ewDemand)+' M\u20ac ('+fmt(ewDemand/totalDemand*100,0)+'%) vs BU '+fmt(buDemand)+' M\u20ac ('+fmt(buDemand/totalDemand*100,0)+'%)</td><td>Historical context: EW ~35M / BU ~60M</td></tr>';

  var lfrCount = allRows.filter(function(r){return r.stage===0;}).length;
  var lfrDemand = allRows.filter(function(r){return r.stage===0;}).reduce(function(s,r){return s+r.cost;},0);
  h += '<tr><td>Legal & Compliance</td><td>'+lfrCount+' programs totalling '+fmt(lfrDemand)+' M\u20ac</td><td>Must-do obligations; directional \u20ac15M within 100M envelope</td></tr>';

  h += '<tr><td>Evidence Gaps</td><td>Payback Period, Qualitative & Quantitative Benefits</td><td><span class="dq-badge dq-tbd">Deadline: 24 Sep 2026</span></td></tr>';
  h += '</tbody></table></section>';

  return h;
};

// ---- TAB 5: OPERATIONS (collapsible BU groups) ----
window.renderOperationsTab = function(){
  var svcs = OPS.operations.services;
  var tco = OPS.operations.tco;
  var total27 = svcs.reduce(function(s,v){return s+v.cost2027;},0);
  var total26 = svcs.reduce(function(s,v){return s+v.cost2026;},0);
  var depts = {};
  svcs.forEach(function(s){depts[s.dept]=1;});

  var h = '';
  // KPIs
  h += '<section class="kpis stream-kpis">';
  h += '<div class="kpi"><span>Total Operations 2027</span><strong>'+fmt(total27)+' M\u20ac</strong><small>AOP 2027 estimate</small></div>';
  h += '<div class="kpi"><span>2026 Run-Rate</span><strong>'+fmt(total26)+' M\u20ac</strong><small>Baseline</small></div>';
  h += '<div class="kpi"><span>\u0394 YoY</span><strong>'+fmt(total27-total26)+' M\u20ac</strong><small>'+(total27>=total26?'Increase':'Decrease')+'</small></div>';
  h += '<div class="kpi"><span>Services</span><strong>'+svcs.length+'</strong><small>IT business services</small></div>';
  h += '<div class="kpi"><span>IT Departments</span><strong>'+Object.keys(depts).length+'</strong><small>Delivering</small></div>';
  h += '<div class="kpi dark"><span>Operations Scope</span><strong>Pre-aligned</strong><small>Already defined per BURF</small></div>';
  h += '</section>';

  // BU TCO with collapsible groups
  h += '<section class="panel"><h2>BU Total Cost of Ownership</h2>';
  h += '<p class="muted small">Cost: Own Consumption + Region allocation + Function allocation. Click a BU cluster to expand sub-BU breakdown.</p>';
  h += '<div class="tablebox" style="max-height:600px"><table id="tcoTable"><thead><tr>';
  h += '<th class="sortable">BU</th><th class="sortable num">AOP 2026 M\u20ac</th><th class="sortable num">Own Consumption M\u20ac</th>';
  h += '<th class="sortable num">Region Alloc M\u20ac</th><th class="sortable num">Function Alloc M\u20ac</th>';
  h += '<th class="sortable num">Total BU M\u20ac</th><th class="sortable num">\u0394 vs AOP2026 M\u20ac</th><th>Breakdown</th>';
  h += '</tr></thead><tbody>';

  var currentGroup = null;
  tco.forEach(function(t, idx){
    var isChild = t.bu.startsWith(' ');
    var groupId = 'tco-'+idx;

    if(!isChild){
      currentGroup = groupId;
      var bar = '<div class="ops-bar-mini"><div style="flex:'+Math.max(t.ownConsumption,0.1)+';background:#00126E" title="Own: '+fmt(t.ownConsumption)+'"></div><div style="flex:'+Math.max(t.regionAlloc,0.1)+';background:#0B5ED7" title="Region: '+fmt(t.regionAlloc)+'"></div><div style="flex:'+Math.max(t.functionAlloc,0.1)+';background:#008BA3" title="Function: '+fmt(t.functionAlloc)+'"></div></div>';
      var delta = t.deltaVsAOP2026||0;
      var color = delta>=0?'var(--prot)':'var(--weak)';
      h += '<tr class="ops-group-row" data-group="'+groupId+'" onclick="this.classList.toggle(\'expanded\');document.querySelectorAll(\'[data-parent=\\\'\'+this.dataset.group+\'\\\']\').forEach(function(r){r.classList.toggle(\'visible\');})">';
      h += '<td><strong>'+t.bu.trim()+'</strong></td><td class="num">'+fmt(t.aop2026)+'</td>';
      h += '<td class="num">'+fmt(t.ownConsumption)+'</td><td class="num">'+fmt(t.regionAlloc)+'</td>';
      h += '<td class="num">'+fmt(t.functionAlloc)+'</td><td class="num" style="font-weight:700">'+fmt(t.totalBU)+'</td>';
      h += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+fmt(delta)+'</td><td>'+bar+'</td></tr>';
    } else {
      var delta = t.deltaVsAOP2026||0;
      var color = delta>=0?'var(--prot)':'var(--weak)';
      h += '<tr class="ops-child-row" data-parent="'+currentGroup+'">';
      h += '<td style="padding-left:28px;color:var(--text2)">'+t.bu.trim()+'</td><td class="num" style="color:var(--text2)">'+fmt(t.aop2026)+'</td>';
      h += '<td class="num" style="color:var(--text2)">'+fmt(t.ownConsumption)+'</td><td class="num" style="color:var(--text2)">'+fmt(t.regionAlloc)+'</td>';
      h += '<td class="num" style="color:var(--text2)">'+fmt(t.functionAlloc)+'</td><td class="num" style="color:var(--text2)">'+fmt(t.totalBU)+'</td>';
      h += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+fmt(delta)+'</td><td></td></tr>';
    }
  });
  h += '</tbody></table></div></section>';

  return h;
};

// ---- OVERVIEW TAB POST-RENDER: inject operations BURF allocation ----
var origStreamFn = null;
var _renderObserver = new MutationObserver(function(mutations){
  mutations.forEach(function(m){
    if(m.type==='childList' && m.target.id==='main'){
      var aop = window.__aop;
      if(!aop || !aop.tab) return;

      // For overview tab, inject the BURF allocation table before the program table
      if(aop.tab === 'overview'){
        var main = document.getElementById('main');
        if(!main) return;

        // Find the first .panel that contains the program table
        var panels = main.querySelectorAll('.panel');
        if(panels.length < 1) return;

        // Check if we already injected
        if(main.querySelector('#burf-alloc-section')) return;

        // Build BURF allocation overview
        var allRows = aop.result.rows;
        var orgData = {};
        allRows.forEach(function(r){
          var k = r.org||'Unassigned';
          if(!orgData[k]) orgData[k]={count:0,demand:0,funded:0};
          orgData[k].count++;
          orgData[k].demand += r.cost||0;
          orgData[k].funded += r.final||0;
        });

        var tcoMap = {};
        OPS.operations.tco.filter(function(t){return !t.bu.startsWith(' ');}).forEach(function(t){tcoMap[t.bu]=t;});

        var allocHtml = '<section class="panel" id="burf-alloc-section"><h2>BURF Allocation Overview \u2014 What Each BU Will Be Charged</h2>';
        allocHtml += '<p class="muted small">Combined Program AOP allocation and Operations TCO per BU/Region/Function. This is what each BU leader should expect as their total IT charge.</p>';
        allocHtml += '<div class="tablebox"><table class="alloc-overview"><thead><tr>';
        allocHtml += '<th class="sortable">BU / Region / Function</th><th class="sortable num">Programs</th>';
        allocHtml += '<th class="sortable num">Program Funded M\u20ac</th><th class="sortable num">Operations TCO M\u20ac</th>';
        allocHtml += '<th class="sortable num">Total IT Charge M\u20ac</th><th class="sortable num">\u0394 vs AOP2026 M\u20ac</th>';
        allocHtml += '</tr></thead><tbody>';

        var entries = Object.entries(orgData).sort(function(a,b){return (b[1].funded+(tcoMap[b[0]]||{totalBU:0}).totalBU)-(a[1].funded+(tcoMap[a[0]]||{totalBU:0}).totalBU);});
        var grandFunded=0, grandOps=0;
        entries.forEach(function(e){
          var k=e[0], d=e[1];
          var tco = tcoMap[k]||{totalBU:0,deltaVsAOP2026:0};
          var total = d.funded + tco.totalBU;
          grandFunded += d.funded;
          grandOps += tco.totalBU;
          var delta = tco.deltaVsAOP2026||0;
          var color = delta>=0?'var(--prot)':'var(--weak)';
          allocHtml += '<tr><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td>';
          allocHtml += '<td class="num">'+fmt(d.funded)+'</td><td class="num">'+fmt(tco.totalBU)+'</td>';
          allocHtml += '<td class="total-col num">'+fmt(total)+'</td>';
          allocHtml += '<td class="num" style="color:'+color+'">'+(delta>=0?'+':'')+fmt(delta)+'</td></tr>';
        });
        allocHtml += '<tr style="background:var(--lt);font-weight:700"><td>Grand Total</td><td></td>';
        allocHtml += '<td class="num">'+fmt(grandFunded)+'</td><td class="num">'+fmt(grandOps)+'</td>';
        allocHtml += '<td class="total-col num">'+fmt(grandFunded+grandOps)+'</td><td></td></tr>';
        allocHtml += '</tbody></table></div></section>';

        // Also update the KPI section to include operations
        var kpiSection = main.querySelector('.kpis,.stream-kpis');
        if(kpiSection){
          var extraKpi = '<div class="kpi dark"><span>Operations AOP</span><strong>'+fmt(OPS.meta.opsTotal2027)+' M\u20ac</strong><small>Pre-aligned \xb7 not prioritised</small></div>';
          kpiSection.insertAdjacentHTML('beforeend', extraKpi);
        }

        // Rename the heading
        var h2s = main.querySelectorAll('h2');
        h2s.forEach(function(h2){
          if(h2.textContent.includes('AOP 2027 : One Portfolio')){
            h2.textContent = 'AOP2027 : Program Demand Overview';
          }
        });

        // Insert allocation table before the first panel with the program table
        var firstPanel = panels[0];
        if(firstPanel && firstPanel.nextSibling){
          firstPanel.parentNode.insertBefore(
            new DOMParser().parseFromString('<div>'+allocHtml+'</div>','text/html').body.firstChild.firstChild,
            panels.length > 1 ? panels[1] : null
          );
        }
      }
    }
  });
});
_renderObserver.observe(document.getElementById('main')||document.body, {childList:true,subtree:false});

})();
"""

last_script_end = html.rfind('</script>')
html = html[:last_script_end] + EXTENSION_CODE + html[last_script_end:]
print(f"Injected v4.1 extension code ({len(EXTENSION_CODE)} chars)")

# ── Final: Write ──
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nv4.1 written: {len(html)} chars ({len(html)//1024} KB)")
print("Done!")
