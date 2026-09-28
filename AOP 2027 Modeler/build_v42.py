"""Build v4.2 One Portfolio Dashboard — all feedback incorporated."""
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35 = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
PARSED = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/17926-parsed-sheets.json'
OPS = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.2.html'

print("Reading v3.5...")
with open(V35, 'r', encoding='utf-8') as f:
    html = f.read()

# ── Source data (17926) ──
with open(PARSED, 'r', encoding='utf-8') as f:
    parsed = json.load(f)
for sheet in parsed['sheets']:
    if sheet['name'] == 'Bu':
        rows = sheet['rows']
        if not rows[0][0] and len(rows)>3 and rows[3][0] == 'Item No.':
            sheet['rows'] = rows[3:]
        header = sheet['rows'][0]
        hl = [str(h).lower() for h in header]
        if not any('quantified benefits (details)' in h for h in hl):
            bi = next((i for i,h in enumerate(hl) if 'quantified benefits' in h and 'k' in h), None)
            if bi is not None:
                for row in sheet['rows']: row.insert(bi+1, '')
                sheet['rows'][0][bi+1] = 'Quantified Benefits (Details) '
        for i, h in enumerate(sheet['rows'][0]):
            if isinstance(h, str) and h.replace('\r','').replace('\n',' ').strip().lower() == 'waste band':
                sheet['rows'][0][i] = 'Decision Band'
parsed['sheets'] = [s for s in parsed['sheets'] if s['name'] in ('EW', 'Bu')]
sj = json.dumps(parsed, ensure_ascii=False, separators=(',',':'))
sd_s = html.find('<script type="application/json" id="source-data">')
sd_e = html.find('</script>', sd_s) + len('</script>')
html = html[:sd_s] + f'<script type="application/json" id="source-data">{sj}</script>' + html[sd_e:]

# ── Operations data ──
with open(OPS, 'r', encoding='utf-8') as f:
    od = json.load(f)
ops_blob = json.dumps({"operations": od["operations"], "meta": od["meta"]}, ensure_ascii=False, separators=(',',':'))
ip = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:ip] + f'\n<script type="application/json" id="ops-data">{ops_blob}</script>' + html[ip:]

# ── String patches ──
patches = [
    ('<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>',
     '<title>AOP 2027 | Philips IT One Portfolio Dashboard</title>'),
    ("Evidence-led portfolio", "One Portfolio \xb7 Evidence-led"),
    # Tab names
    ("tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}",
     "tabNames={demand:'Demand Overview',scenario:'Program AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'}"),
    # Render dispatch
    ("$('#main').innerHTML=tab==='scenario'?scenario():stream(tab);",
     "$('#main').innerHTML=tab==='scenario'?scenario():tab==='demand'?window.renderDemandOverview(session,result):tab==='operations'?window.renderOperationsTab():stream(tab);"),
    # Remove chart summary text for overview
    ("+'<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'+",
     "+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+"),
    # Overview notice
    ("Read-only consolidated portfolio. Finalise records acceptance of the displayed funding, variance and evidence exceptions. Refreshed decisions held for review must be resolved first. Over-budget decisions remain explicit.",
     "One Portfolio: Program + Operations AOP 2027. Finalise records acceptance of the displayed funding, variance and evidence exceptions."),
    # BURF → Organization globally (in UI-visible strings)
    ("BURF organisation", "Organisation"),
    ("BURF not supplied", "Organisation not supplied"),
    ("BU | Region | Function / Program", "Organisation / Program"),
    # Simplified: just replace the long explanation text with a short one
    ("BURF totals remain visible when closed. Score is the unweighted average merit; money is summed, with the average below. Missing amounts are excluded from their average. Evid. counts numeric submitted benefit claims, not validated benefits. (", "Organisation totals remain visible when closed. ("),
    # IndexedDB
    ("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.2"),
]

# Workflow bar
old_wf = "function workflow(){return '<div class=\"workflow\"><button data-tab=\"scenario\" class=\"step '+(tab==='scenario'?'current':'')+'\">"
old_wf += "1 \xb7 Set AOP scenario</button><button data-tab=\"ew\" class=\"step '+(tab==='ew'?'current':'')+'\">"
old_wf += "2 \xb7 Review Enterprise Wide</button><button data-tab=\"bu\" class=\"step '+(tab==='bu'?'current':'')+'\">"
old_wf += "3 \xb7 Review BU Led</button><button data-tab=\"overview\" class=\"step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'\">"
old_wf += "4 \xb7 Review and finalise</button></div>';}"
new_wf = 'function workflow(){return \'<div class="workflow">'
new_wf += '<button data-tab="demand" class="step \'+(tab===\\\'demand\\\'?\\\'current\\\':\\\'\\\')+ \\\'">1 \xb7 Demand Overview</button>'
new_wf += '<button data-tab="scenario" class="step \'+(tab===\\\'scenario\\\'?\\\'current\\\':\\\'\\\')+ \\\'">2 \xb7 Program Scenarios</button>'
new_wf += '<button data-tab="ew" class="step \'+(tab===\\\'ew\\\'?\\\'current\\\':\\\'\\\')+ \\\'">3 \xb7 Enterprise Wide</button>'
new_wf += '<button data-tab="bu" class="step \'+(tab===\\\'bu\\\'?\\\'current\\\':\\\'\\\')+ \\\'">4 \xb7 BU Led</button>'
new_wf += '<button data-tab="operations" class="step \'+(tab===\\\'operations\\\'?\\\'current\\\':\\\'\\\')+ \\\'">5 \xb7 Operations</button>'
new_wf += '<button data-tab="overview" class="step \'+(tab===\\\'overview\\\'?\\\'current\\\':\\\'\\\')+ \\\' \\\'+(session.status===\\\'Finalised\\\'?\\\'done\\\':\\\'\\\')+\\\'">6 \xb7 One Portfolio</button>'
new_wf += '</div>\';}'
# Actually, the escaping is getting complex. Let me use a simpler approach.
new_wf = """function workflow(){return '<div class="workflow"><button data-tab="demand" class="step '+(tab==='demand'?'current':'')+'">1 \\xb7 Demand Overview</button><button data-tab="scenario" class="step '+(tab==='scenario'?'current':'')+'">2 \\xb7 Program Scenarios</button><button data-tab="ew" class="step '+(tab==='ew'?'current':'')+'">3 \\xb7 Enterprise Wide</button><button data-tab="bu" class="step '+(tab==='bu'?'current':'')+'">4 \\xb7 BU Led</button><button data-tab="operations" class="step '+(tab==='operations'?'current':'')+'">5 \\xb7 Operations</button><button data-tab="overview" class="step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'">6 \\xb7 One Portfolio</button></div>';}"""
# Use actual middot
new_wf = new_wf.replace('\\xb7', '\xb7')
patches.append((old_wf, new_wf))

for old, new in patches:
    if old in html:
        html = html.replace(old, new)
        print(f"  Patched: {old[:50]}...")
    else:
        print(f"  WARNING: not found: {old[:50]}...")

# ── Extension code ──
EXT = r"""

(function(){
'use strict';
const OPS=JSON.parse(document.getElementById('ops-data').textContent);
window.OPS_DATA=OPS;

// Org → TCO mapping
const ORG_TCO_MAP={
  'Precision Diagnosis - Magnetic Resonance (MR)':'Precision Diagnosis',
  'Precision Diagnosis - Computed Tomography (CT)':'Precision Diagnosis',
  'Precision Diagnosis - Ultrasound (PDU)':'Precision Diagnosis',
  'Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':'Precision Diagnosis',
  'Image Guided Therapy - Devices (IGT-D)':'Image Guided Therapy',
  'Image Guided Therapy - Systems (IGT-S)':'Image Guided Therapy',
  'Monitoring - HPM (MCH)':'Connected Care',
  'Sleep & Respiratory Care (SRC)':'Connected Care',
  'Ambulatory Monitoring and Diagnostics (AM&D)':'Connected Care',
  'Enterprise Informatics (EI)':'EI',
  'Personal Health (PH)':'Personal Health',
  'Intellectual Property & Standards (IP&S)':'Int. Property & Standards',
  'Innovation and Design Business Operations':'Innovation & Design',
  'Group Innovation & Strategy ':'Innovation & Design',
  'North America (NAR)':'Regions',
  'North America':'Regions',
  'International Regions (IR)':'Regions',
  'International Regions (IR) - Overall':'Regions',
  'Greater China (GRC)':'Regions',
  'Greater China':'Regions',
  'CoE Marketing \u2013 HS (former DMEC)\u200b':'Functions',
  'Finance':'Functions',
  'Legal':'Functions','Legal\u200b':'Functions',
  'Group Security':'Functions','Group Security\u200b':'Functions',
  'Communications & Brand':'Functions',
  'Internal Audit ':'Functions','Internal Audit\u200b':'Functions',
  'Information Technology ':'Functions','Information Technology\u200b':'Functions',
  'Medical Office':'Functions',
  'Patient Safety & Quality':'Functions',
  'People function':'Functions',
  'Health & Safety':'Functions',
  'Integrated Supply Chain (ISC)':'Functions',
  'SusTaining Engg. Team (STET - ISC)':'Functions',
  'Service Transformation Office (STO)':'Functions'
};

// Build TCO lookup by cluster name
const TCO_BY_NAME={};
OPS.operations.tco.filter(t=>!t.bu.startsWith(' ')).forEach(t=>{TCO_BY_NAME[t.bu]=t;});
// Add aggregated Regions and Functions
const regTCO={bu:'Regions',aop2026:0,ownConsumption:0,regionAlloc:0,functionAlloc:0,totalBU:63.5,deltaVsAOP2026:0};
const funcTCO={bu:'Functions',aop2026:0,ownConsumption:88.5,regionAlloc:0,functionAlloc:0,totalBU:88.5,deltaVsAOP2026:0};
TCO_BY_NAME['Regions']=regTCO;
TCO_BY_NAME['Functions']=funcTCO;

function getOpsCostForOrg(org){
  var cluster=ORG_TCO_MAP[org];
  if(!cluster) return 0;
  var tco=TCO_BY_NAME[cluster];
  return tco?tco.totalBU:0;
}

// Styles
const st=document.createElement('style');
st.textContent=`
.demand-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px}
.demand-card{background:white;border:1px solid var(--border);border-radius:6px;padding:16px}
.demand-card h3{color:var(--dk);margin-bottom:10px;font-size:14px}
.ds{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--mist);font-size:12px}
.ds:last-child{border-bottom:none}
.ds .v{font-weight:700;color:var(--dk)}
.it th{background:var(--dk);color:white;font-size:10px;padding:8px 10px;white-space:nowrap}
.it td{padding:7px 10px;font-size:11px;border-bottom:1px solid var(--mist)}
.it tr:nth-child(even){background:#f6f9fd}
.it tbody tr:hover{background:var(--lt)}
.dq-tbd{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:var(--discbg);color:#715800}
.ops-grp{background:var(--mist)!important;font-weight:600;cursor:pointer}
.ops-grp td:first-child::before{content:'\\25B6 ';font-size:10px;color:var(--text3)}
.ops-grp.open td:first-child::before{content:'\\25BC '}
.ops-ch{display:none}
.ops-ch.vis{display:table-row}
.ops-bm{display:flex;height:18px;border-radius:3px;overflow:hidden;min-width:80px}
.ops-bm div{min-width:1px}
.ao th{background:var(--blue)}
.ao td.tc{background:#f0f5ff;font-weight:700}
.sort-ctl{display:inline-flex;gap:4px;margin-left:6px}
.sort-ctl select{font-size:10px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;background:white}
.flt-bar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center}
.flt-bar label{font-size:11px;font-weight:600;color:var(--text2)}
.flt-bar select{font-size:11px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;min-width:120px}
.ops-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;padding:12px;background:#f8fafc;border-radius:6px;border:1px solid var(--border)}
.ops-summary .item{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
.ops-summary .item b{color:var(--dk)}
`;
document.head.appendChild(st);

function fmt(v,d){return v==null||isNaN(v)?'-':Number(v).toFixed(d===undefined?1:d);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

// ---- SORTING DROPDOWN ----
function sortDropdown(tableId, cols){
  var opts=cols.map(c=>'<option value="'+c.key+'">'+esc(c.label)+'</option>').join('');
  return '<span class="sort-ctl"><select onchange="window._sortTable(\''+tableId+'\',this.value)"><option value="">Sort by...</option>'+opts+'<option value="_reset">Reset</option></select></span>';
}
window._sortTable=function(tid,key){
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var rows=Array.from(tbody.querySelectorAll('tr:not(.ops-grp):not(.ops-ch):not(.group):not(.burf-summary):not(.summary-total)'));
  if(key==='_reset'){rows.forEach(r=>tbody.appendChild(r));return;}
  var ths=Array.from(tbl.querySelectorAll('thead th'));
  var idx=ths.findIndex(th=>th.textContent.toLowerCase().includes(key.toLowerCase()));
  if(idx<0)return;
  rows.sort(function(a,b){
    var va=a.children[idx]?a.children[idx].textContent.trim().replace(/[€M,\s]/g,''):'';
    var vb=b.children[idx]?b.children[idx].textContent.trim().replace(/[€M,\s]/g,''):'';
    var na=parseFloat(va),nb=parseFloat(vb);
    if(!isNaN(na)&&!isNaN(nb))return nb-na;
    return va.localeCompare(vb);
  });
  rows.forEach(r=>tbody.appendChild(r));
};

// ---- FILTER BAR ----
function filterBar(tableId, rows, orgField, platField){
  var orgs={}, plats={};
  rows.forEach(function(r){
    var o=r[orgField||'org']||''; if(o)orgs[o]=1;
    var p=r[platField||'platform']||''; if(p)plats[p]=1;
  });
  var orgOpts=Object.keys(orgs).sort().map(o=>'<option value="'+esc(o)+'">'+esc(o)+'</option>').join('');
  var platOpts=Object.keys(plats).sort().map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join('');
  return '<div class="flt-bar"><label>Organisation</label><select onchange="window._filterTable(\''+tableId+'\',this.value,0)"><option value="">All</option>'+orgOpts+'</select><label>Platform</label><select onchange="window._filterTable(\''+tableId+'\',this.value,1)"><option value="">All</option>'+platOpts+'</select></div>';
}
window._tblFilters={};
window._filterTable=function(tid,val,col){
  if(!window._tblFilters[tid])window._tblFilters[tid]={};
  window._tblFilters[tid][col]=val;
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var rows=tbody.querySelectorAll('tr');
  var f=window._tblFilters[tid];
  rows.forEach(function(r){
    if(r.classList.contains('ops-grp')||r.classList.contains('group')||r.classList.contains('burf-summary')||r.classList.contains('summary-total'))return;
    var show=true;
    Object.keys(f).forEach(function(c){
      if(!f[c])return;
      var cell=r.children[parseInt(c)];
      if(cell&&!cell.textContent.includes(f[c]))show=false;
    });
    r.style.display=show?'':'none';
  });
};

// ---- TAB: DEMAND OVERVIEW ----
window.renderDemandOverview=function(session,result){
  var all=result.rows;
  var ew=all.filter(r=>r.stream==='ew'), bu=all.filter(r=>r.stream==='bu');
  var ewD=ew.reduce((s,r)=>s+r.cost,0), buD=bu.reduce((s,r)=>s+r.cost,0);
  var ewBen=ew.filter(r=>r.benefit!=null&&r.benefit>0), buBen=bu.filter(r=>r.benefit!=null&&r.benefit>0);
  var ops=OPS.meta.opsTotal2027;

  var h='<div class="demand-grid">';
  // Program card
  h+='<div class="demand-card"><h3>Program Demand Overview</h3>';
  h+='<div class="ds"><span>Enterprise Wide</span><span class="v">'+ew.length+' programs \xb7 '+fmt(ewD)+' M\u20ac</span></div>';
  h+='<div class="ds"><span>BU Led</span><span class="v">'+bu.length+' programs \xb7 '+fmt(buD)+' M\u20ac</span></div>';
  h+='<div class="ds"><span>Qualitative Benefits</span><span class="v"><span class="dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h+='<div class="ds"><span>Committed Impact</span><span class="v">BU Led | EW</span></div>';
  h+='</div>';

  // Operations card
  h+='<div class="demand-card"><h3>Operations Overview (Pre-aligned)</h3>';
  h+='<div class="ds"><span>Total Operations AOP 2027</span><span class="v">'+fmt(ops)+' M\u20ac</span></div>';
  h+='<div class="ds"><span>2026 Run-Rate</span><span class="v">'+fmt(OPS.meta.opsTotal2026)+' M\u20ac</span></div>';
  h+='<div class="ops-summary"><div><div class="item"><span>BU Own Consumption</span><b>317.6 M\u20ac</b></div><div class="item"><span>From Regions</span><b>63.5 M\u20ac</b></div></div><div><div class="item"><span>From Functions</span><b>88.5 M\u20ac</b></div><div class="item"><span>Total</span><b>'+fmt(ops)+' M\u20ac</b></div></div></div>';
  h+='</div>';

  // Data Quality card
  h+='<div class="demand-card"><h3>Data Quality</h3>';
  var wB=all.filter(r=>r.benefit!=null&&r.benefit>0).length;
  var wI=all.filter(r=>r.impact&&r.impact.length>10).length;
  h+='<div class="ds"><span>Programs with Benefits</span><span class="v">'+wB+' / '+all.length+'</span></div>';
  h+='<div class="ds"><span>Programs with Impact</span><span class="v">'+wI+' / '+all.length+'</span></div>';
  h+='<div class="ds"><span>Payback Period</span><span class="v"><span class="dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h+='<div class="ds"><span>Qualitative Benefits</span><span class="v"><span class="dq-tbd">TBD</span></span></div>';
  h+='<div class="ds"><span>Quantitative Benefits</span><span class="v"><span class="dq-tbd">TBD</span></span></div>';
  h+='</div></div>';

  // Demand Split by Organisation
  h+='<section class="panel"><h2>Demand Split by Organisation \u2014 Program and Operations</h2>';
  h+=sortDropdown('tblDemandSplit',[{key:'demand',label:'Program Demand'},{key:'operations',label:'Operations Cost'},{key:'total',label:'Total IT Demand'}]);

  var orgD={};
  all.forEach(r=>{var k=r.org||'Unassigned';if(!orgD[k])orgD[k]={count:0,demand:0,platform:''};orgD[k].count++;orgD[k].demand+=r.cost||0;if(r.platform&&!orgD[k].platform)orgD[k].platform=r.platform;});

  // Get unique orgs for filter
  h+=filterBar('tblDemandSplit',all,'org','platform');

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="tblDemandSplit"><thead><tr>';
  h+='<th>Organisation</th><th class="num">Program Demand (Count)</th><th class="num">Program Demand M\u20ac</th>';
  h+='<th class="num">Operations Cost M\u20ac</th><th class="num">Total IT Demand M\u20ac</th>';
  h+='</tr></thead><tbody>';

  var entries=Object.entries(orgD).sort((a,b)=>b[1].demand-a[1].demand);
  var tF=0,tO=0;
  entries.forEach(e=>{
    var k=e[0],d=e[1];
    var opsCost=getOpsCostForOrg(k);
    var total=d.demand+opsCost;
    tF+=d.demand;tO+=opsCost;
    h+='<tr><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td><td class="num">'+fmt(d.demand)+'</td>';
    h+='<td class="num">'+fmt(opsCost)+'</td><td class="num" style="font-weight:700">'+fmt(total)+'</td></tr>';
  });
  h+='<tr style="background:var(--lt);font-weight:700"><td>Total</td><td class="num">'+all.filter(r=>r.cost>0).length+'</td>';
  h+='<td class="num">'+fmt(tF)+'</td><td class="num">'+fmt(tO)+'</td><td class="num">'+fmt(tF+tO)+'</td></tr>';
  h+='</tbody></table></div></section>';

  // Insights
  h+='<section class="panel"><h2>High-Level Insights</h2>';
  h+='<table class="it"><thead><tr><th>Insight</th><th>Detail</th><th>Implication</th></tr></thead><tbody>';
  h+='<tr><td>Total IT Budget</td><td>'+fmt(ewD+buD+ops)+' M\u20ac (Program '+fmt(ewD+buD)+' + Ops '+fmt(ops)+')</td><td>Program demand is '+fmt((ewD+buD)/ops*100,0)+'% of operations</td></tr>';
  h+='<tr><td>Demand vs Envelope</td><td>'+fmt(ewD+buD)+' M\u20ac against 100 M\u20ac</td><td>'+fmt((ewD+buD)/100*100,0)+'% oversubscribed</td></tr>';
  h+='<tr><td>Evidence Gaps</td><td>Payback, Qualitative & Quantitative Benefits</td><td><span class="dq-tbd">Deadline: 24 Sep 2026</span></td></tr>';
  h+='</tbody></table></section>';
  return h;
};

// ---- TAB: OPERATIONS ----
window.renderOperationsTab=function(){
  var svcs=OPS.operations.services, tco=OPS.operations.tco;
  var t27=svcs.reduce((s,v)=>s+v.cost2027,0), t26=svcs.reduce((s,v)=>s+v.cost2026,0);
  var depts={};svcs.forEach(s=>{depts[s.dept]=1;});

  var h='<section class="kpis stream-kpis">';
  h+='<div class="kpi"><span>Total Operations 2027</span><strong>'+fmt(t27)+' M\u20ac</strong><small>AOP 2027</small></div>';
  h+='<div class="kpi"><span>2026 Run-Rate</span><strong>'+fmt(t26)+' M\u20ac</strong><small>Baseline</small></div>';
  h+='<div class="kpi"><span>\u0394 YoY</span><strong>'+fmt(t27-t26)+' M\u20ac</strong><small>'+(t27>=t26?'+':'-')+'</small></div>';
  h+='<div class="kpi"><span>BU Own</span><strong>317.6 M\u20ac</strong><small>Own consumption</small></div>';
  h+='<div class="kpi"><span>From Regions</span><strong>63.5 M\u20ac</strong><small>Region allocation</small></div>';
  h+='<div class="kpi"><span>From Functions</span><strong>88.5 M\u20ac</strong><small>Function allocation</small></div>';
  h+='</section>';

  // TCO collapsible
  h+='<section class="panel"><h2>Organisation Total Cost of Ownership</h2>';
  h+='<p class="muted" style="font-size:11px">Cost: Own Consumption + Region allocation + Function allocation. Click a cluster to expand.</p>';
  h+=sortDropdown('tcoTbl',[{key:'total',label:'Total BU'},{key:'own',label:'Own Consumption'},{key:'delta',label:'Delta vs AOP2026'}]);
  h+='<div class="tablebox" style="max-height:600px"><table class="it" id="tcoTbl"><thead><tr>';
  h+='<th>Organisation</th><th class="num">AOP2026 M\u20ac</th><th class="num">Own Consumption M\u20ac</th>';
  h+='<th class="num">Region Alloc M\u20ac</th><th class="num">Function Alloc M\u20ac</th>';
  h+='<th class="num">Total M\u20ac</th><th class="num">\u0394 vs AOP2026 M\u20ac</th><th>Breakdown</th>';
  h+='</tr></thead><tbody>';

  var cg=null;
  tco.forEach((t,i)=>{
    var isChild=t.bu.startsWith(' ');
    var gid='tg'+i;
    if(!isChild){
      cg=gid;
      var bar='<div class="ops-bm"><div style="flex:'+Math.max(t.ownConsumption,0.1)+';background:#00126E"></div><div style="flex:'+Math.max(t.regionAlloc,0.1)+';background:#0B5ED7"></div><div style="flex:'+Math.max(t.functionAlloc,0.1)+';background:#008BA3"></div></div>';
      var d=t.deltaVsAOP2026||0,c=d>=0?'var(--prot)':'var(--weak)';
      h+='<tr class="ops-grp" data-g="'+gid+'" onclick="this.classList.toggle(\'open\');document.querySelectorAll(\'[data-p=\\\'\'+this.dataset.g+\'\\\']\').forEach(r=>r.classList.toggle(\'vis\'))">';
      h+='<td><strong>'+t.bu.trim()+'</strong></td><td class="num">'+fmt(t.aop2026)+'</td>';
      h+='<td class="num">'+fmt(t.ownConsumption)+'</td><td class="num">'+fmt(t.regionAlloc)+'</td>';
      h+='<td class="num">'+fmt(t.functionAlloc)+'</td><td class="num" style="font-weight:700">'+fmt(t.totalBU)+'</td>';
      h+='<td class="num" style="color:'+c+'">'+(d>=0?'+':'')+fmt(d)+'</td><td>'+bar+'</td></tr>';
    } else {
      var d=t.deltaVsAOP2026||0,c=d>=0?'var(--prot)':'var(--weak)';
      h+='<tr class="ops-ch" data-p="'+cg+'">';
      h+='<td style="padding-left:28px;color:var(--text2)">'+t.bu.trim()+'</td><td class="num" style="color:var(--text2)">'+fmt(t.aop2026)+'</td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.ownConsumption)+'</td><td class="num" style="color:var(--text2)">'+fmt(t.regionAlloc)+'</td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.functionAlloc)+'</td><td class="num" style="color:var(--text2)">'+fmt(t.totalBU)+'</td>';
      h+='<td class="num" style="color:'+c+'">'+(d>=0?'+':'')+fmt(d)+'</td><td></td></tr>';
    }
  });
  // Add Regions and Functions summary rows
  h+='<tr class="ops-grp"><td><strong>Regions</strong></td><td></td><td class="num">63.5</td><td class="num">-63.5</td><td></td><td class="num" style="font-weight:700">0.0</td><td></td><td></td></tr>';
  h+='<tr class="ops-grp"><td><strong>Functions & CoEs</strong></td><td></td><td class="num">88.5</td><td></td><td class="num">-88.5</td><td class="num" style="font-weight:700">0.0</td><td></td><td></td></tr>';
  h+='</tbody></table></div></section>';
  return h;
};

// ---- ONE PORTFOLIO: inject ops allocation after render ----
new MutationObserver(function(muts){
  muts.forEach(function(m){
    if(m.type!=='childList'||m.target.id!=='main')return;
    var aop=window.__aop;
    if(!aop||aop.tab!=='overview')return;
    var main=document.getElementById('main');
    if(!main||main.querySelector('#alloc-sec'))return;

    var all=aop.result.rows;
    var orgD={};
    all.forEach(r=>{var k=r.org||'Unassigned';if(!orgD[k])orgD[k]={count:0,demand:0,funded:0};orgD[k].count++;orgD[k].demand+=r.cost||0;orgD[k].funded+=r.final||0;});

    var ah='<section class="panel" id="alloc-sec"><h2>Organisation Allocation Overview \u2014 Program + Operations</h2>';
    ah+='<p class="muted" style="font-size:11px">What each Organisation will be charged: Program AOP allocation + Operations TCO.</p>';
    ah+=sortDropdown('allocTbl',[{key:'funded',label:'Program Funded'},{key:'operations',label:'Operations Cost'},{key:'total',label:'Total IT'}]);
    ah+='<div class="tablebox"><table class="ao it" id="allocTbl"><thead><tr>';
    ah+='<th>Organisation</th><th class="num">Programs</th><th class="num">Program Funded M\u20ac</th>';
    ah+='<th class="num">Operations Cost M\u20ac</th><th class="num">Total IT Charge M\u20ac</th>';
    ah+='<th class="num">\u0394 vs AOP2026 M\u20ac</th></tr></thead><tbody>';

    var entries=Object.entries(orgD).sort((a,b)=>{
      var ta=a[1].funded+getOpsCostForOrg(a[0]), tb=b[1].funded+getOpsCostForOrg(b[0]);
      return tb-ta;
    });
    var gF=0,gO=0;
    entries.forEach(e=>{
      var k=e[0],d=e[1];
      var opsCost=getOpsCostForOrg(k);
      var total=d.funded+opsCost;
      gF+=d.funded;gO+=opsCost;
      var cluster=ORG_TCO_MAP[k];
      var tco=cluster?TCO_BY_NAME[cluster]:null;
      var delta=tco?tco.deltaVsAOP2026:0;
      var c=delta>=0?'var(--prot)':'var(--weak)';
      ah+='<tr><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td>';
      ah+='<td class="num">'+fmt(d.funded)+'</td><td class="num">'+fmt(opsCost)+'</td>';
      ah+='<td class="tc num">'+fmt(total)+'</td>';
      ah+='<td class="num" style="color:'+c+'">'+(delta>=0?'+':'')+fmt(delta)+'</td></tr>';
    });
    ah+='<tr style="background:var(--lt);font-weight:700"><td>Grand Total</td><td></td>';
    ah+='<td class="num">'+fmt(gF)+'</td><td class="num">'+fmt(gO)+'</td>';
    ah+='<td class="tc num">'+fmt(gF+gO)+'</td><td></td></tr>';
    ah+='</tbody></table></div></section>';

    // Add ops KPI
    var kpi=main.querySelector('.kpis,.stream-kpis');
    if(kpi&&!kpi.querySelector('.ops-kpi-added')){
      kpi.insertAdjacentHTML('beforeend','<div class="kpi dark ops-kpi-added"><span>Operations AOP</span><strong>'+fmt(OPS.meta.opsTotal2027)+' M\u20ac</strong><small>Pre-aligned</small></div>');
    }

    // Rename heading
    main.querySelectorAll('h2').forEach(h2=>{
      if(h2.textContent.includes('AOP 2027 : One Portfolio'))h2.textContent='AOP2027 : Program Demand Overview';
    });

    // Insert before coverage section or at end
    var panels=main.querySelectorAll('.panel');
    var target=panels.length>1?panels[1]:null;
    var div=document.createElement('div');
    div.innerHTML=ah;
    if(target)main.insertBefore(div.firstElementChild,target);
    else main.appendChild(div.firstElementChild);
  });
}).observe(document.getElementById('main')||document.body,{childList:true});

})();
"""

last_se = html.rfind('</script>')
html = html[:last_se] + EXT + html[last_se:]
print(f"Injected v4.2 extension ({len(EXT)} chars)")

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nv4.2: {len(html)} chars ({len(html)//1024} KB)")
print("Done!")
