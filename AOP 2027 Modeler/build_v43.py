"""Build v4.3 One Portfolio Dashboard — sub-org TCO, checkbox filters, revised extensions."""
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35 = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
PARSED = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/17926-parsed-sheets.json'
OPS = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.3.html'

print("Reading v3.5 base HTML...")
with open(V35, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"  Base file: {len(html)} chars")

# ============================================================
# STEP 1: SOURCE DATA REPLACEMENT
# ============================================================
print("\n--- STEP 1: Source Data Replacement ---")
with open(PARSED, 'r', encoding='utf-8') as f:
    parsed = json.load(f)

for sheet in parsed['sheets']:
    if sheet['name'] == 'Bu':
        rows = sheet['rows']
        # If rows[0][0] is empty and rows[3][0] is 'Item No.', shift
        if not rows[0][0] and len(rows) > 3 and rows[3][0] == 'Item No.':
            sheet['rows'] = rows[3:]
            print("  Bu sheet: shifted rows to start from index 3")
        header = sheet['rows'][0]
        hl = [str(h).lower() for h in header]
        # Insert 'Quantified Benefits (Details)' if missing
        if not any('quantified benefits (details)' in h for h in hl):
            bi = next((i for i, h in enumerate(hl) if 'quantified benefits' in h and 'k' in h), None)
            if bi is not None:
                for row in sheet['rows']:
                    row.insert(bi + 1, '')
                sheet['rows'][0][bi + 1] = 'Quantified Benefits (Details) '
                print("  Bu sheet: inserted 'Quantified Benefits (Details)' column")
        # Rename 'waste band' -> 'Decision Band'
        for i, h in enumerate(sheet['rows'][0]):
            if isinstance(h, str) and h.replace('\r', '').replace('\n', ' ').strip().lower() == 'waste band':
                sheet['rows'][0][i] = 'Decision Band'
                print("  Bu sheet: renamed 'waste band' -> 'Decision Band'")

# Keep only EW and Bu sheets
parsed['sheets'] = [s for s in parsed['sheets'] if s['name'] in ('EW', 'Bu')]
print(f"  Kept sheets: {[s['name'] for s in parsed['sheets']]}")

sj = json.dumps(parsed, ensure_ascii=False, separators=(',', ':'))
sd_s = html.find('<script type="application/json" id="source-data">')
sd_e = html.find('</script>', sd_s) + len('</script>')
html = html[:sd_s] + f'<script type="application/json" id="source-data">{sj}</script>' + html[sd_e:]
print(f"  Replaced source-data ({len(sj)} chars)")

# ============================================================
# STEP 2: OPERATIONS DATA
# ============================================================
print("\n--- STEP 2: Operations Data ---")
with open(OPS, 'r', encoding='utf-8') as f:
    od = json.load(f)
ops_blob = json.dumps({"operations": od["operations"], "meta": od["meta"]}, ensure_ascii=False, separators=(',', ':'))
ip = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:ip] + f'\n<script type="application/json" id="ops-data">{ops_blob}</script>' + html[ip:]
print(f"  Injected ops-data ({len(ops_blob)} chars)")

# Inject services-per-suborg mapping
SVC_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/services-per-suborg-m.json'
with open(SVC_PATH, 'r', encoding='utf-8') as f:
    svc_json = f.read()
ip2 = html.find('</script>', html.find('id="ops-data"')) + len('</script>')
html = html[:ip2] + f'\n<script type="application/json" id="svc-data">{svc_json}</script>' + html[ip2:]
print(f"  Injected svc-data ({len(svc_json)} chars)")

# ============================================================
# STEP 3: STRING PATCHES
# ============================================================
print("\n--- STEP 3: String Patches ---")

patches = [
    # 1. Title
    ('AOP 2027 | Philips IT Portfolio Scenario Modelling',
     'AOP 2027 | Philips IT One Portfolio Dashboard'),
    # 2. Tag
    ('Evidence-led portfolio',
     'One Portfolio \xb7 Evidence-led'),
    # 3. TabNames
    ("tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}",
     "tabNames={demand:'Demand Overview',scenario:'Program AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'}"),
    # 4. Render dispatch
    ("$('#main').innerHTML=tab==='scenario'?scenario():stream(tab);",
     "$('#main').innerHTML=tab==='scenario'?scenario():tab==='demand'?window.renderDemandOverview(session,result):tab==='operations'?window.renderOperationsTab():stream(tab);"),
    # 5. Chart summary removal for overview
    ("+'<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'+",
     "+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records \xb7 Filtered request '+money(AOP.sum(shown,r=>r.cost))+' \xb7 Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+"),
    # 6. Overview notice
    ("Read-only consolidated portfolio. Finalise records acceptance of the displayed funding, variance and evidence exceptions. Refreshed decisions held for review must be resolved first. Over-budget decisions remain explicit.",
     "One Portfolio: Program + Operations AOP 2027. Finalise records acceptance of the displayed funding, variance and evidence exceptions."),
    # 7. BURF -> Organisation
    ("BURF organisation", "Organisation"),
    # 8. BURF -> Organisation not supplied
    ("BURF not supplied", "Organisation not supplied"),
    # 9. Table header
    ("BU | Region | Function / Program", "Organisation / Program"),
    # 10. Table actions text simplification
    ("BURF totals remain visible when closed. Score is the unweighted average merit; money is summed, with the average below. Missing amounts are excluded from their average. Evid. counts numeric submitted benefit claims, not validated benefits. (",
     "Organisation totals visible when collapsed. ("),
    # 11. IndexedDB
    ("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.3"),
]

# 12. Workflow bar
old_wf = ("function workflow(){return '<div class=\"workflow\">"
          "<button data-tab=\"scenario\" class=\"step '+(tab==='scenario'?'current':'')+'\">"
          "1 \xb7 Set AOP scenario</button>"
          "<button data-tab=\"ew\" class=\"step '+(tab==='ew'?'current':'')+'\">"
          "2 \xb7 Review Enterprise Wide</button>"
          "<button data-tab=\"bu\" class=\"step '+(tab==='bu'?'current':'')+'\">"
          "3 \xb7 Review BU Led</button>"
          "<button data-tab=\"overview\" class=\"step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'\">"
          "4 \xb7 Review and finalise</button></div>';}")

new_wf = ("function workflow(){return '<div class=\"workflow\">"
          "<button data-tab=\"demand\" class=\"step '+(tab==='demand'?'current':'')+'\">"
          "1 \xb7 Demand Overview</button>"
          "<button data-tab=\"scenario\" class=\"step '+(tab==='scenario'?'current':'')+'\">"
          "2 \xb7 Program Scenarios</button>"
          "<button data-tab=\"ew\" class=\"step '+(tab==='ew'?'current':'')+'\">"
          "3 \xb7 Enterprise Wide</button>"
          "<button data-tab=\"bu\" class=\"step '+(tab==='bu'?'current':'')+'\">"
          "4 \xb7 BU Led</button>"
          "<button data-tab=\"operations\" class=\"step '+(tab==='operations'?'current':'')+'\">"
          "5 \xb7 Operations</button>"
          "<button data-tab=\"overview\" class=\"step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'\">"
          "6 \xb7 One Portfolio</button></div>';}")

patches.append((old_wf, new_wf))

# 13. Bubble chart cleanup
# The file uses plain single quotes in JS string concatenation (not backslash-escaped)
Q = "'"  # plain single quote
old_bubble = (
    '<p class="muted">Bubble area represents requested demand. '
    + Q + "+(session.chartColour===" + Q + "band" + Q + "?" + Q
    + "Green: Healthy. Amber: Contain. Grey: unassessed." + Q + ":" + Q
    + "Green: funded. Amber: partial scope. Coral: excluded. Pink: not funded." + Q + ")+" + Q
    + " Grey dotted line: median merit. Blue dashed line: advanced merit threshold, not a funding guarantee."
    + " Hover or keyboard-focus a bubble for details. " + Q + "+(rows.length-valid.length)+" + Q
    + " rows with no positive request are shown in the table, not on the log chart.</p>" + Q + ";"
)
new_bubble = (
    '<p class="muted" style="font-size:10px">'
    + Q + "+(session.chartColour===" + Q + "band" + Q + "?" + Q
    + '<i style="color:#27934C">\u25a0</i> Healthy <i style="color:#FFBE2C">\u25a0</i> Contain <i style="color:#909EAA">\u25a0</i> Unassessed'
    + Q + ":" + Q
    + '<i style="color:#20A53A">\u25a0</i> Funded <i style="color:#FCA708">\u25a0</i> Partial <i style="color:#D43F44">\u25a0</i> Excluded <i style="color:#DF8A96">\u25a0</i> Not funded'
    + Q + ")+" + Q + "</p>" + Q + ";"
)
patches.append((old_bubble, new_bubble))

# Apply all patches
for idx, (old, new) in enumerate(patches, 1):
    if old in html:
        html = html.replace(old, new, 1)
        preview = old[:60].replace('\n', ' ')
        print(f"  [{idx:2d}] OK: {preview}...")
    else:
        preview = old[:60].replace('\n', ' ')
        print(f"  [{idx:2d}] FAILED - not found: {preview}...")

# ============================================================
# STEP 4: EXTENSION CODE
# ============================================================
print("\n--- STEP 4: Extension Code ---")

EXT = r"""

// =========================================================================
// v4.3 ONE PORTFOLIO EXTENSIONS
// =========================================================================
(function(){
'use strict';
const OPS=JSON.parse(document.getElementById('ops-data').textContent);
window.OPS_DATA=OPS;

// ---- Correct sub-org level TCO mapping ----
// Maps program organisation names to their TCO sub-org entry with exact costs
const ORG_OPS_MAP={
  'Precision Diagnosis - Magnetic Resonance (MR)':{name:'MR',total:38.0,own:20.6,reg:9.9,func:7.5},
  'Precision Diagnosis - Computed Tomography (CT)':{name:'CT/AMI',total:25.3,own:14.5,reg:5.8,func:5.0},
  'Precision Diagnosis - Ultrasound (PDU)':{name:'ULS',total:38.1,own:25.1,reg:5.9,func:7.1},
  'Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':{name:'DXR',total:11.7,own:7.0,reg:2.5,func:2.2},
  'Image Guided Therapy - Devices (IGT-D)':{name:'IGT-D',total:33.4,own:25.6,reg:1.1,func:6.7},
  'Image Guided Therapy - Systems (IGT-S)':{name:'IGT-S',total:51.5,own:31.6,reg:10.0,func:9.8},
  'Monitoring - HPM (MCH)':{name:'HPM',total:60.1,own:39.4,reg:9.7,func:11.0},
  'Sleep & Respiratory Care (SRC)':{name:'SRC',total:32.7,own:24.0,reg:0.1,func:8.7},
  'Ambulatory Monitoring and Diagnostics (AM&D)':{name:'AMD',total:9.1,own:6.7,reg:0.4,func:2.1},
  'Enterprise Informatics (EI)':{name:'EI',total:34.1,own:28.6,reg:1.1,func:4.4},
  'Personal Health (PH)':{name:'PH',total:75.9,own:63.2,reg:0.1,func:12.5},
  'Intellectual Property & Standards (IP&S)':{name:'IP&S',total:4.6,own:4.0,reg:0.0,func:0.6},
  'Innovation and Design Business Operations':{name:'I&D',total:9.7,own:8.5,reg:0.0,func:1.2},
  'Group Innovation & Strategy \u200b':{name:'I&D',total:9.7,own:8.5,reg:0.0,func:1.2},
};
// Function/Region/ISC orgs have 0 direct TCO (they are cost allocators, not recipients)
const ZERO_OPS={total:0,own:0,reg:0,func:0};
function getOps(org){return ORG_OPS_MAP[org]||ZERO_OPS;}

// ---- CSS ----
const st=document.createElement('style');
st.textContent=`
.demand-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;align-items:stretch}
.demand-card{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:18px 20px;display:flex;flex-direction:column}
.demand-card h3{color:var(--dk);margin:0 0 12px 0;font-size:14px;font-weight:700;padding-bottom:0}
.ds{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--mist);font-size:12px;gap:12px;line-height:1.4}
.ds:last-child{border-bottom:none}
.ds>span:first-child{color:var(--text2);flex-shrink:0}
.ds .v{font-weight:700;color:var(--dk);text-align:right;font-size:12px;white-space:nowrap}
.it{table-layout:fixed;width:100%}
.it th{background:var(--dk);color:white;font-size:11px;padding:10px 14px;white-space:nowrap;letter-spacing:0.3px}
.it td{padding:10px 14px;font-size:12px;border-bottom:1px solid var(--mist);line-height:1.4}
.it tr:nth-child(even){background:#f6f9fd}
.it tbody tr:hover{background:var(--lt)}
.it th:first-child,.it td:first-child{width:35%;text-align:left}
.it th.num,.it td.num{text-align:right;width:16%;font-variant-numeric:tabular-nums}
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
.ops-sum{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0;padding:14px 18px;background:#f8fafc;border-radius:6px;border:1px solid var(--border)}
.ops-sum .item{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
.ops-sum .item b{color:var(--dk);font-variant-numeric:tabular-nums}
.v43-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.v43-filter{position:relative;min-width:120px;flex:0 1 auto}
.v43-filter>summary{list-style:none;cursor:pointer;border:1px solid var(--border);background:white;border-radius:4px;padding:6px 10px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:11px;color:var(--dk);font-weight:600}
.v43-filter[open]>summary{border-color:var(--blue)}
.v43-filter-opts{position:absolute;z-index:8;background:white;box-shadow:0 4px 12px #00126e20;border:1px solid var(--border);padding:8px;max-height:250px;overflow-y:auto;min-width:230px}
.v43-filter-opts label{display:flex;gap:6px;padding:3px;font-size:11px}
.v43-sort{font-size:11px;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--dk);min-width:140px}
`;
document.head.appendChild(st);

function fmt(v,d){return v==null||isNaN(v)?'-':Number(v).toFixed(d===undefined?1:d);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

// ---- IT Dept code to Platform mapping ----
var DEPT_PLATFORM={
  'AN3':'Security, Risk & Compliance','AN4':'Infrastructure Services','AN5':'Infrastructure Services',
  'AN6':'Portfolio & Regions','AN7':'Infrastructure Services','AN8':'Infrastructure Services',
  'AN9':'Portfolio & Regions','AX7':'Infrastructure Services','AX9':'Services & Solutions IT',
  'B72':'Infrastructure Services','B77':'Ent. Architecture, Data & Integration','B84':'Vendor & Software Asset Management',
  'BL8':'Commercial IT','BL9':'Integrated Supply Chain and Finance','BM0':'Group Functions and Hyperautomation',
  'BM1':'Innovation and Digital IT','I91':'Ent. Architecture, Data & Integration'
};
function deptToPlatform(deptCode){
  if(!deptCode)return '';
  var codes=String(deptCode).split('/');
  for(var i=0;i<codes.length;i++){var p=DEPT_PLATFORM[codes[i].trim()];if(p)return p;}
  return '';
}

// ---- v3.5-style checkbox filter builder (org-level rows) ----
function buildFilterBar(tableId, orgRows, fields, sortOpts){
  // orgRows = [{org:'...',platform:'...',...}], fields = [{key,label}]
  var h='<div class="v43-filter-row" id="fb-'+tableId+'" data-tbl="'+tableId+'">';
  fields.forEach(function(f){
    var vals={};
    orgRows.forEach(function(r){var v=r[f.key]||'';if(v)vals[v]=(vals[v]||0)+1;});
    var sorted=Object.keys(vals).sort();
    h+='<details class="v43-filter" data-fkey="'+f.key+'" data-tbl="'+tableId+'"><summary>'+esc(f.label)+': All</summary>';
    h+='<div class="v43-filter-opts">';
    sorted.forEach(function(v){
      h+='<label data-fopt="'+esc(v)+'"><input type="checkbox" value="'+esc(v)+'" data-ftbl="'+tableId+'" data-fkey="'+f.key+'"> '+esc(v)+' <span class="fcnt">('+vals[v]+')</span></label>';
    });
    h+='</div></details>';
  });
  // Sort dropdown
  var so=sortOpts||[{v:'demand-desc',l:'Program Demand (High\u2192Low)'},{v:'demand-asc',l:'Program Demand (Low\u2192High)'},{v:'ops-desc',l:'Operations Cost (High\u2192Low)'},{v:'ops-asc',l:'Operations Cost (Low\u2192High)'},{v:'total-desc',l:'Total IT (High\u2192Low)'},{v:'total-asc',l:'Total IT (Low\u2192High)'}];
  h+='<select class="v43-sort" data-sort-tbl="'+tableId+'" onchange="window._v43sort(\''+tableId+'\',this.value)"><option value="">Sort by...</option>';
  so.forEach(function(o){h+='<option value="'+o.v+'">'+esc(o.l)+'</option>';});
  h+='</select>';
  h+='<button style="font-size:11px;padding:5px 10px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--text2);cursor:pointer" onclick="window._v43clearFilters(\''+tableId+'\')">Clear All</button>';
  h+='</div>';
  return h;
}

// Program-level sort dropdown (for program detail tables)
function buildProgramSortDropdown(tableId){
  var h='<select class="v43-sort" data-sort-tbl="'+tableId+'" onchange="window._v43sort(\''+tableId+'\',this.value)">';
  h+='<option value="">Sort by...</option>';
  h+='<option value="benefit-desc">Benefit (High\u2192Low)</option>';
  h+='<option value="benefit-asc">Benefit (Low\u2192High)</option>';
  h+='<option value="merit-desc">Merit Score (High\u2192Low)</option>';
  h+='<option value="merit-asc">Merit Score (Low\u2192High)</option>';
  h+='<option value="invest-desc">Investment Requested (High\u2192Low)</option>';
  h+='<option value="invest-asc">Investment Requested (Low\u2192High)</option>';
  h+='</select>';
  return h;
}

// ---- Sort handler ----
window._v43sort=function(tid,val){
  if(!val)return;
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var rows=Array.from(tbody.querySelectorAll('tr:not(.ops-grp):not(.ops-ch):not(.group):not(.burf-summary):not(.summary-total)'));
  var parts=val.split('-');
  var key=parts[0],dir=parts[1]==='asc'?1:-1;

  // Find column index by keyword in header
  var ths=Array.from(tbl.querySelectorAll('thead th'));
  var idx=-1;
  var keyMap={demand:'program demand',ops:'operations',total:'total it',benefit:'benefit',merit:'score',invest:'requested'};
  var searchTerm=(keyMap[key]||key).toLowerCase();
  for(var i=0;i<ths.length;i++){
    if(ths[i].textContent.toLowerCase().includes(searchTerm)){idx=i;break;}
  }
  if(idx<0)return;

  rows.sort(function(a,b){
    var va=a.children[idx]?a.children[idx].textContent.trim().replace(/[""" + u"\u20ac" + r"""M,\s]/g,''):'';
    var vb=b.children[idx]?b.children[idx].textContent.trim().replace(/[""" + u"\u20ac" + r"""M,\s]/g,''):'';
    var na=parseFloat(va),nb=parseFloat(vb);
    if(isNaN(na))na=dir>0?Infinity:-Infinity;
    if(isNaN(nb))nb=dir>0?Infinity:-Infinity;
    return (na-nb)*dir;
  });
  rows.forEach(function(r){tbody.appendChild(r);});
};

// ---- Filter handler: cascading counts + dynamic totals ----
function applyFilters(tid){
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var dataRows=Array.from(tbody.querySelectorAll('tr[data-org]'));
  var totalRow=tbody.querySelector('tr[data-total]');
  // Collect active filters
  var filters={};
  document.querySelectorAll('input[data-ftbl="'+tid+'"]:checked').forEach(function(c){
    if(!filters[c.dataset.fkey])filters[c.dataset.fkey]=[];
    filters[c.dataset.fkey].push(c.value);
  });
  // Show/hide rows
  var visCount=0,visDemand=0,visOps=0,visTotal=0;
  dataRows.forEach(function(r){
    var show=true;
    Object.keys(filters).forEach(function(fk){
      if(!filters[fk].length)return;
      var val=r.dataset[fk]||'';
      if(!filters[fk].some(function(v){return val.includes(v);}))show=false;
    });
    r.style.display=show?'':'none';
    if(show){
      visCount++;
      var cells=r.querySelectorAll('td');
      visDemand+=parseFloat((cells[2]||{}).textContent)||0;
      var opsText=(cells[3]||{}).textContent||'';
      visOps+=opsText==='—'?0:(parseFloat(opsText)||0);
      visTotal+=parseFloat((cells[4]||{}).textContent)||0;
    }
  });
  // Update total row
  if(totalRow){
    var tc=totalRow.querySelectorAll('td');
    if(tc[1])tc[1].textContent=Object.keys(filters).length?visCount:dataRows.length;
    if(tc[2])tc[2].textContent=Object.keys(filters).length?visDemand.toFixed(1):tc[2].dataset.orig||tc[2].textContent;
    // Ops total stays 469.7
  }
  // Update cascading counts on OTHER filters
  var filterDivs=document.querySelectorAll('.v43-filter[data-tbl="'+tid+'"]');
  filterDivs.forEach(function(fd){
    var fk=fd.dataset.fkey;
    var otherFilters={};
    Object.keys(filters).forEach(function(k){if(k!==fk)otherFilters[k]=filters[k];});
    // Count visible per option considering other filters only
    fd.querySelectorAll('label[data-fopt]').forEach(function(lbl){
      var optVal=lbl.dataset.fopt;
      var cnt=0;
      dataRows.forEach(function(r){
        var matchOther=true;
        Object.keys(otherFilters).forEach(function(ok){
          if(!otherFilters[ok].length)return;
          if(!otherFilters[ok].some(function(v){return (r.dataset[ok]||'').includes(v);}))matchOther=false;
        });
        if(matchOther&&(r.dataset[fk]||'').includes(optVal))cnt++;
      });
      var cntSpan=lbl.querySelector('.fcnt');
      if(cntSpan)cntSpan.textContent='('+cnt+')';
    });
    // Update summary
    var checks=fd.querySelectorAll('input[data-ftbl="'+tid+'"]:checked');
    var sum=fd.querySelector('summary');
    if(sum){
      var label=sum.textContent.split(':')[0];
      sum.textContent=label+': '+(checks.length?checks.length+' selected':'All');
    }
  });
}
document.addEventListener('change',function(e){
  if(e.target.dataset&&e.target.dataset.ftbl)applyFilters(e.target.dataset.ftbl);
});
window._v43clearFilters=function(tid){
  document.querySelectorAll('input[data-ftbl="'+tid+'"]').forEach(function(c){c.checked=false;});
  applyFilters(tid);
};

// ---- TAB: DEMAND OVERVIEW ----
window.renderDemandOverview=function(session,result){
  var all=result.rows;
  var ew=all.filter(function(r){return r.stream==='ew';}), bu=all.filter(function(r){return r.stream==='bu';});
  var ewD=ew.reduce(function(s,r){return s+r.cost;},0), buD=bu.reduce(function(s,r){return s+r.cost;},0);
  var funded=all.filter(function(r){return r.final>0;});
  var ewFBen=funded.filter(function(r){return r.stream==='ew';}).reduce(function(s,r){return s+(r.benefit||0);},0);
  var buFBen=funded.filter(function(r){return r.stream==='bu';}).reduce(function(s,r){return s+(r.benefit||0);},0);
  var ops=OPS.meta.opsTotal2027;
  var totalCount=all.length;
  var totalDemand=all.reduce(function(s,r){return s+r.cost;},0);
  var svcCount=OPS.operations.services.length;

  // Collect dominant platform per org
  var orgPlatform={};
  all.forEach(function(r){
    var k=r.org||'Unassigned',p=r.platform||'';
    if(!orgPlatform[k])orgPlatform[k]={};
    if(p)orgPlatform[k][p]=(orgPlatform[k][p]||0)+1;
  });
  Object.keys(orgPlatform).forEach(function(k){
    var best='',bestN=0;
    Object.keys(orgPlatform[k]).forEach(function(p){if(orgPlatform[k][p]>bestN){best=p;bestN=orgPlatform[k][p];}});
    orgPlatform[k]=best;
  });

  var h='<div class="demand-grid">';
  // Program card
  h+='<div class="demand-card"><h3>Program Demand Overview</h3>';
  h+='<div class="ds"><span style="font-weight:700;color:var(--dk)">Total Program Demand</span><span class="v">'+totalCount+' programs \xb7 '+fmt(totalDemand)+' M€</span></div>';
  h+='<div class="ds"><span>Enterprise Wide</span><span class="v">'+ew.length+' programs """ + u"\xb7" + r""" '+fmt(ewD)+' M""" + u"\u20ac" + r"""</span></div>';
  h+='<div class="ds"><span>BU Led</span><span class="v">'+bu.length+' programs """ + u"\xb7" + r""" '+fmt(buD)+' M""" + u"\u20ac" + r"""</span></div>';
  h+='<div class="ds"><span>Committed Impact (Proposed)</span><span class="v">BU Led '+fmt(buFBen)+' M""" + u"\u20ac" + r""" | EW '+fmt(ewFBen)+' M""" + u"\u20ac" + r"""</span></div>';
  h+='</div>';

  // Operations card
  h+='<div class="demand-card"><h3>Operations Overview (Pre-aligned)</h3>';
  h+='<div class="ds"><span style="font-weight:700;color:var(--dk)">Total Operations Demand</span><span class="v">'+svcCount+' services \xb7 '+fmt(ops)+' M€</span></div>';
  h+='<div class="ds"><span>2026 Run-Rate</span><span class="v">'+fmt(OPS.meta.opsTotal2026)+' M""" + u"\u20ac" + r"""</span></div>';
  h+='<div class="ops-sum"><div><div class="item"><span>BU Own Consumption</span><b>317.6 M""" + u"\u20ac" + r"""</b></div><div class="item"><span>From Regions</span><b>63.5 M""" + u"\u20ac" + r"""</b></div></div><div><div class="item"><span>From Functions</span><b>88.5 M""" + u"\u20ac" + r"""</b></div><div class="item"><span>Total</span><b>469.7 M""" + u"\u20ac" + r"""</b></div></div></div>';
  h+='</div>';

  // Data Quality card
  h+='<div class="demand-card"><h3>Data Quality</h3>';
  var wB=all.filter(function(r){return r.benefit!=null&&r.benefit>0;}).length;
  var wI=all.filter(function(r){return r.impact&&r.impact.length>10;}).length;
  h+='<div class="ds"><span>Programs with Benefits</span><span class="v">'+wB+' / '+all.length+'</span></div>';
  h+='<div class="ds"><span>Programs with Impact</span><span class="v">'+wI+' / '+all.length+'</span></div>';
  h+='<div class="ds"><span>Payback Period</span><span class="v"><span class="dq-tbd">TBD</span> Due 24 Sep</span></div>';
  h+='<div class="ds"><span>Qualitative Benefits</span><span class="v"><span class="dq-tbd">TBD</span></span></div>';
  h+='<div class="ds"><span>Quantitative Benefits</span><span class="v"><span class="dq-tbd">TBD</span></span></div>';
  h+='</div></div>';

  // Demand Split by Organisation
  h+='<section class="panel"><h2>Demand Split by Organisation """ + u"\u2014" + r""" Program and Operations</h2>';

  var orgD={};
  all.forEach(function(r){
    var k=r.org||'Unassigned';
    if(!orgD[k])orgD[k]={count:0,demand:0};
    orgD[k].count++;
    orgD[k].demand+=r.cost||0;
  });

  // Build org-level rows for filter (1 row per org with its platform)
  var orgFilterRows=Object.keys(orgD).map(function(k){return {org:k,platform:orgPlatform[k]||''};});
  h+=buildFilterBar('tblDemandSplit',orgFilterRows,[{key:'org',label:'Organisation'},{key:'platform',label:'Platform'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="tblDemandSplit"><thead><tr>';
  h+='<th>Organisation</th><th class="num">Program Demand (Count)</th><th class="num">Program Demand M""" + u"\u20ac" + r"""</th>';
  h+='<th class="num">Operations Cost M""" + u"\u20ac" + r"""</th><th class="num">Total IT Demand M""" + u"\u20ac" + r"""</th>';
  h+='</tr></thead><tbody>';

  var entries=Object.entries(orgD).sort(function(a,b){return b[1].demand-a[1].demand;});
  var tF=0,tO=0;
  entries.forEach(function(e){
    var k=e[0],d=e[1];
    var opsCost=getOps(k).total;
    var total=d.demand+opsCost;
    tF+=d.demand;tO+=opsCost;
    var plat=orgPlatform[k]||'';
    h+='<tr data-org="'+esc(k)+'" data-platform="'+esc(plat)+'"><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td><td class="num">'+fmt(d.demand)+'</td>';
    h+='<td class="num">'+(opsCost>0?fmt(opsCost):'—')+'</td><td class="num" style="font-weight:700">'+fmt(total)+'</td></tr>';
  });
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td>Total</td><td class="num">'+all.length+'</td>';
  h+='<td class="num">'+fmt(tF)+'</td><td class="num">469.7</td><td class="num">'+fmt(tF+469.7)+'</td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:10px;margin-top:6px">Operations Cost shown at BU cluster level from Comparable AOP2027. Functions, Regions and corporate organisations have their costs allocated into BU TCO (shown as —). Total Operations: 469.7 M€.</p>';
  h+='</section>';

  // Insights
  h+='<section class="panel"><h2>High-Level Insights</h2>';
  h+='<table class="it"><thead><tr><th>Insight</th><th>Detail</th><th>Implication</th></tr></thead><tbody>';
  h+='<tr><td>Total IT Budget</td><td>'+fmt(ewD+buD+ops)+' M""" + u"\u20ac" + r""" (Program '+fmt(ewD+buD)+' + Ops '+fmt(ops)+')</td><td>Program demand is '+fmt((ewD+buD)/ops*100,0)+'% of operations</td></tr>';
  h+='<tr><td>Demand vs Envelope</td><td>'+fmt(ewD+buD)+' M""" + u"\u20ac" + r""" against 100 M""" + u"\u20ac" + r"""</td><td>'+fmt((ewD+buD)/100*100,0)+'% oversubscribed</td></tr>';
  h+='<tr><td>Evidence Gaps</td><td>Payback, Qualitative & Quantitative Benefits</td><td><span class="dq-tbd">Deadline: 24 Sep 2026</span></td></tr>';
  h+='</tbody></table></section>';
  return h;
};

// ---- TAB: OPERATIONS (v4.3.2 — EW-style 3-level hierarchy) ----
var SVC_DATA=JSON.parse(document.getElementById('svc-data').textContent);
var SUBORG_KEYS={'CT/AMI':'CT/AMI','DXR':'DXR','MR':'MR','ULS':'ULS','PD-Other':'PD-Other','PD Other':'PD-Other',
  'IGT-D':'IGT-D','IGT-S':'IGT-S','IGT-Other':'IGT-Other','IGT Other':'IGT-Other',
  'AMD':'AMD','HPM':'HPM','ACI':'ACI','ACI (shift from EI in 2026)':'ACI','Monit. Other':'Monitoring-Other','Monitoring-Other':'Monitoring-Other',
  'Sleep & Respitory Care':'SRC','SRC':'SRC',
  'CI':'CI','II':'II','EI Other':'EI-Other','EI-Other':'EI-Other',
  'MCC/WH':'MCC/WH','G&B':'G&B','OHC':'OHC','PH Other':'PH-Other','PH-Other':'PH-Other',
  'Int. Property & Standards':'IP&S','IP&S':'IP&S','Innovation & Design':'I&D','I&D':'I&D',
  'North America Region':'NAR','NAR':'NAR','International Region':'IR','IR':'IR','Greater China Region':'GCR','GCR':'GCR'};
function getSvcs(name){var k=SUBORG_KEYS[name]||SUBORG_KEYS[name.replace(/^- /,'')];return k?SVC_DATA[k]||[]:[];}

// Ops platform mapping (IT Dept codes to platform names)
var OPS_PLATFORM={};
OPS.operations.services.forEach(function(s){
  if(s.dept){var p=deptToPlatform(s.dept);if(p)OPS_PLATFORM[s.dept]=p;}
});

window.renderOperationsTab=function(){
  var tco=OPS.operations.tco;
  var h='<section class="kpis stream-kpis">';
  h+='<div class="kpi"><span>Total Operations 2027</span><strong>469.7 M€</strong><small>AOP 2027</small></div>';
  h+='<div class="kpi"><span>2026 Run-Rate</span><strong>470.7 M€</strong><small>Baseline</small></div>';
  h+='<div class="kpi"><span>Δ YoY</span><strong>-1.0 M€</strong><small>Decrease</small></div>';
  h+='<div class="kpi"><span>BU Own</span><strong>317.6 M€</strong><small>Own consumption</small></div>';
  h+='<div class="kpi"><span>From Regions</span><strong>63.5 M€</strong><small>Region allocation</small></div>';
  h+='<div class="kpi"><span>From Functions</span><strong>88.5 M€</strong><small>Function allocation</small></div>';
  h+='</section>';

  h+='<section class="panel"><h2>Organisation Total Cost of Ownership</h2>';

  // Filter + Sort (EW style)
  // Build filter data with platform mapping for TCO clusters
  var tcoFilterData=tco.filter(function(t){return !t.bu.startsWith('- ');}).map(function(t){
    // Map TCO cluster names to platforms (approximate: based on which IT platforms serve them)
    var platMap={'Precision Diagnosis':'Commercial IT','Image Guided Therapy':'Services & Solutions IT',
      'Connected Care':'Commercial IT','EI':'Commercial IT','Personal Health':'Commercial IT',
      'Int. Property & Standards':'Group Functions and Hyperautomation','Innovation & Design':'Innovation and Digital IT'};
    return {org:t.bu.trim(),platform:platMap[t.bu.trim()]||''};
  });
  h+=buildFilterBar('tcoTbl',tcoFilterData,[{key:'org',label:'Organisation'},{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  // Table using burf-table class (matches EW tab exactly)
  h+='<div class="tablebox burf-tablebox" style="max-height:none"><table class="portfolio burf-table" id="tcoTbl"><thead><tr>';
  h+='<th class="identity">Organisation</th>';
  h+='<th>AOP2027 Costs M€</th>';
  h+='<th>Own Consumption (M€ | %)</th>';
  h+='<th>Regions to BU (M€ | %)</th>';
  h+='<th>Functions & CoEs (M€ | %)</th>';
  h+='<th>Δ vs AOP2026 M€</th>';
  h+='</tr></thead><tbody>';

  var cg=null, expanded=new Set();
  tco.forEach(function(t,i){
    var isChild=t.bu.startsWith('- ')||t.bu.startsWith(' -');
    var gid='ops|'+encodeURIComponent(t.bu.trim());
    var d=t.deltaVsAOP2026||0,clr=d>=0?'var(--prot)':'var(--weak)';
    var total=t.totalBU||0;
    var ownPct=total>0?Math.round(t.ownConsumption/total*100)+'%':'';
    var regPct=total>0?Math.round(t.regionAlloc/total*100)+'%':'';
    var funcPct=total>0?Math.round(t.functionAlloc/total*100)+'%':'';

    if(!isChild){
      cg=gid;
      // Count children
      var childCount=0;
      for(var j=i+1;j<tco.length;j++){if(tco[j].bu.startsWith('- ')||tco[j].bu.startsWith(' -'))childCount++;else break;}

      h+='<tr class="burf-summary" data-group-summary="'+esc(gid)+'" data-organisation="'+esc(t.bu.trim())+'" data-org="'+esc(t.bu.trim())+'">';
      h+='<td class="identity"><button class="burf-toggle" data-collapse="'+esc(gid)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(t.bu.trim())+'</button> <span class="group-count">('+childCount+' sub-orgs)</span></td>';
      h+='<td class="num"><strong>'+fmt(total)+'</strong></td>';
      h+='<td class="num">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="color:'+clr+'">'+(d>=0?'+':'')+fmt(d)+'</td></tr>';
    } else {
      var subName=t.bu.replace(/^[\s-]+/,'').trim();
      var svcs=getSvcs(subName);

      // Sub-org summary row (hidden by default, like program rows in EW)
      h+='<tr class="program-row hidden" data-group="'+esc(cg)+'" data-org="'+esc(cg)+'">';
      h+='<td class="identity" style="padding-left:28px"><button class="burf-toggle" data-collapse="svc|'+esc(subName)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(subName)+'</button> <span class="group-count">('+svcs.length+' services)</span></td>';
      h+='<td class="num">'+fmt(total)+'</td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="color:'+clr+'">'+(d>=0?'+':'')+fmt(d)+'</td></tr>';

      // Service rows (hidden by default, level 3)
      svcs.forEach(function(s){
        h+='<tr class="program-row hidden" data-group="svc|'+esc(subName)+'" style="background:#f9fbfe">';
        h+='<td style="padding-left:56px;font-size:11px;color:var(--text2)">'+esc(s.n)+'</td>';
        h+='<td class="num" style="font-size:11px">'+fmt(s.c,4)+'</td>';
        h+='<td colspan="4"></td></tr>';
      });
    }
  });

  // Regions and Functions summary rows
  h+='<tr class="burf-summary"><td class="identity"><strong>Regions (allocated to BUs)</strong></td>';
  h+='<td class="num"><strong>63.5</strong></td><td class="num">63.5</td><td class="num">-63.5</td><td></td><td></td></tr>';
  h+='<tr class="burf-summary"><td class="identity"><strong>Functions & CoEs (allocated to BUs)</strong></td>';
  h+='<td class="num"><strong>88.5</strong></td><td class="num">88.5</td><td></td><td class="num">-88.5</td><td></td></tr>';

  // Total
  h+='<tr class="summary-total" data-total="1"><td class="identity"><strong>Total</strong></td>';
  h+='<td class="num"><strong>469.7</strong></td><td class="num">469.7</td><td class="num">127.1</td><td class="num">177.0</td><td></td></tr>';

  h+='</tbody></table></div></section>';

  // Service Catalog Table
  var svcs=OPS.operations.services;
  h+='<section class="panel"><h2>Service Catalog <span class="badge">'+svcs.length+' services</span></h2>';

  // Build platform-enriched service rows for filter
  var svcRows=svcs.map(function(s){return {org:s.dept,platform:deptToPlatform(s.dept),name:s.name};});
  h+=buildFilterBar('svcCatalog',svcRows,[{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="svcCatalog"><thead><tr>';
  h+='<th>Service ID</th><th style="width:25%">Service Name</th><th>Platform</th>';
  h+='<th class="num">AOP2027 Costs M€</th><th class="num">2027 Demand Estimate</th>';
  h+='<th class="num">AOP2026 Costs M€</th><th class="num">2026 Demand Estimate</th>';
  h+='</tr></thead><tbody>';

  svcs.sort(function(a,b){return b.cost2027-a.cost2027;}).forEach(function(s){
    var plat=deptToPlatform(s.dept);
    var delta=s.cost2027-s.cost2026;
    h+='<tr data-platform="'+esc(plat)+'" data-org="'+esc(s.dept)+'">';
    h+='<td style="font-size:11px">'+esc(s.serviceId)+'</td>';
    h+='<td style="font-size:11px;max-width:250px">'+esc(s.name)+'</td>';
    h+='<td style="font-size:11px">'+esc(plat)+'</td>';
    h+='<td class="num">'+fmt(s.cost2027)+'</td>';
    h+='<td class="num" style="color:var(--text2)">—</td>';
    h+='<td class="num">'+fmt(s.cost2026)+'</td>';
    h+='<td class="num" style="color:var(--text2)">—</td>';
    h+='</tr>';
  });

  var svcTotal27=svcs.reduce(function(s,v){return s+v.cost2027;},0);
  var svcTotal26=svcs.reduce(function(s,v){return s+v.cost2026;},0);
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td></td><td>Total</td><td></td>';
  h+='<td class="num">'+fmt(svcTotal27)+'</td><td></td>';
  h+='<td class="num">'+fmt(svcTotal26)+'</td><td></td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:10px">Demand Estimates to be populated from Bill of IT consumption data. Platform derived from IT Dept code mapping.</p>';
  h+='</section>';

  // Attach collapse handlers for ops table
  setTimeout(function(){
    document.querySelectorAll('#tcoTbl [data-collapse]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var id=this.dataset.collapse;
        var expanded=this.getAttribute('aria-expanded')==='true';
        this.setAttribute('aria-expanded',String(!expanded));
        this.querySelector('.triangle').textContent=expanded?'▶':'▼';
        document.querySelectorAll('#tcoTbl [data-group="'+id+'"]').forEach(function(r){
          if(expanded){
            r.classList.add('hidden');
            // Also collapse sub-groups
            r.querySelectorAll('[data-collapse]').forEach(function(b){
              b.setAttribute('aria-expanded','false');
              b.querySelector('.triangle').textContent='▶';
            });
            var subId=r.querySelector('[data-collapse]');
            if(subId){
              document.querySelectorAll('#tcoTbl [data-group="'+subId.dataset.collapse+'"]').forEach(function(sr){sr.classList.add('hidden');});
            }
          } else {
            r.classList.remove('hidden');
          }
        });
      });
    });
  },100);

  return h;
};




// ---- ONE PORTFOLIO: inject ops allocation + modifications after render ----
new MutationObserver(function(muts){
  muts.forEach(function(m){
    if(m.type!=='childList'||m.target.id!=='main')return;
    var aop=window.__aop;
    if(!aop||aop.tab!=='overview')return;
    var main=document.getElementById('main');
    if(!main||main.querySelector('#alloc-sec'))return;

    var all=aop.result.rows;
    var funded=all.filter(function(r){return r.final>0;});
    var totalAlloc=funded.reduce(function(s,r){return s+r.final;},0);
    var ewAlloc=funded.filter(function(r){return r.stream==='ew';}).reduce(function(s,r){return s+r.final;},0);
    var buAlloc=funded.filter(function(r){return r.stream==='bu';}).reduce(function(s,r){return s+r.final;},0);
    var totalBen=funded.reduce(function(s,r){return s+(r.benefit||0);},0);

    // 1. Replace KPIs with the 5 header tiles
    var kpi=main.querySelector('.kpis,.stream-kpis');
    if(kpi&&!kpi.querySelector('.ops-kpi-added')){
      var newKpis='<div class="kpi"><span>Total IT AOP</span><strong>'+fmt(469.7+totalAlloc)+' M""" + u"\u20ac" + r"""</strong><small>Program + Operations</small></div>';
      newKpis+='<div class="kpi dark"><span>Operations AOP</span><strong>469.7 M""" + u"\u20ac" + r"""</strong><small>Pre-aligned</small></div>';
      newKpis+='<div class="kpi green"><span>Prioritized Program AOP</span><strong>'+fmt(totalAlloc)+' M""" + u"\u20ac" + r"""</strong><small>'+funded.length+' programs funded</small></div>';
      newKpis+='<div class="kpi"><span>Split of Program AOP</span><strong>EW '+fmt(ewAlloc)+' | BU '+fmt(buAlloc)+'</strong><small>M""" + u"\u20ac" + r"""</small></div>';
      newKpis+='<div class="kpi"><span>Committed Benefit</span><strong>'+fmt(totalBen)+' M""" + u"\u20ac" + r"""</strong><small>Quantified benefits of funded</small></div>';
      kpi.innerHTML=newKpis;
      kpi.classList.add('ops-kpi-added');
    }

    // Rename heading
    main.querySelectorAll('h2').forEach(function(h2){
      if(h2.textContent.includes('AOP 2027 : One Portfolio'))h2.textContent='AOP2027 : Program Demand Overview';
    });

    // 3. Hide unfunded bubbles in chart (show only funded)
    main.querySelectorAll('.bubble-chart circle[data-bubble]').forEach(function(c){
      var id=c.dataset.bubble;
      var row=all.find(function(r){return r.id===id;});
      if(row&&row.final<=0)c.style.display='none';
    });

    // 4. Remove median merit line
    main.querySelectorAll('.median-line,.median-label,.median-value').forEach(function(el){el.style.display='none';});

    // 5. Remove chart description paragraph (already handled by patch 13, but ensure)
    main.querySelectorAll('.bubble-chart+p.muted').forEach(function(p){if(p.textContent.length>100)p.style.display='none';});

    // Build Organisation IT Cost Allocation table (only active orgs)
    var orgD={};
    all.forEach(function(r){
      var k=r.org||'Unassigned';
      if(!orgD[k])orgD[k]={count:0,demand:0,funded:0};
      orgD[k].count++;
      orgD[k].demand+=r.cost||0;
      orgD[k].funded+=r.final||0;
    });

    var ah='<section class="panel" id="alloc-sec"><h2>Organisation IT Cost Allocation: Program + Operations</h2>';
    ah+='<p class="muted" style="font-size:11px">What each Organisation will be charged: Program AOP allocation + Operations TCO.</p>';

    // Sort dropdown
    ah+='<div class="v43-filter-row"><select class="v43-sort" data-sort-tbl="allocTbl" onchange="window._v43sort(\'allocTbl\',this.value)">';
    ah+='<option value="">Sort by...</option>';
    ah+='<option value="funded-desc">Program Funded (High""" + u"\u2192" + r"""Low)</option>';
    ah+='<option value="ops-desc">Operations (High""" + u"\u2192" + r"""Low)</option>';
    ah+='<option value="total-desc">Total IT (High""" + u"\u2192" + r"""Low)</option>';
    ah+='</select></div>';

    ah+='<div class="tablebox"><table class="ao it" id="allocTbl"><thead><tr>';
    ah+='<th>Organisation</th><th class="num">Programs</th><th class="num">Program Funded M""" + u"\u20ac" + r"""</th>';
    ah+='<th class="num">Operations Cost M""" + u"\u20ac" + r"""</th><th class="num">Total IT Charge M""" + u"\u20ac" + r"""</th>';
    ah+='</tr></thead><tbody>';

    // Filter to only active orgs (demand > 0 OR ops > 0)
    var entries=Object.entries(orgD).filter(function(e){
      return e[1].demand>0||getOps(e[0]).total>0;
    }).sort(function(a,b){
      var ta=a[1].funded+getOps(a[0]).total;
      var tb=b[1].funded+getOps(b[0]).total;
      return tb-ta;
    });
    var gF=0,gO=0;
    entries.forEach(function(e){
      var k=e[0],d=e[1];
      var opsCost=getOps(k).total;
      var total=d.funded+opsCost;
      gF+=d.funded;gO+=opsCost;
      ah+='<tr data-org="'+esc(k)+'"><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td>';
      ah+='<td class="num">'+fmt(d.funded)+'</td><td class="num">'+(opsCost>0?fmt(opsCost):'—')+'</td>';
      ah+='<td class="tc num">'+fmt(total)+'</td></tr>';
    });
    ah+='<tr style="background:var(--lt);font-weight:700"><td>Grand Total</td><td></td>';
    ah+='<td class="num">'+fmt(gF)+'</td><td class="num">469.7</td>';
    ah+='<td class="tc num">'+fmt(gF+469.7)+'</td></tr>';
    ah+='</tbody></table></div></section>';

    // Insert before coverage
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
print(f"  Injected v4.3 extension ({len(EXT)} chars)")

# ============================================================
# WRITE OUTPUT
# ============================================================
print("\n--- Writing output ---")
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"  Output: {OUT}")
print(f"  File size: {len(html)} chars ({len(html)//1024} KB)")
print("\nDone! v4.3 build complete.")
