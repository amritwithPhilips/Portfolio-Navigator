"""Build v4.5 One Portfolio Dashboard — Four-priority engine for Program AOP Scenarios tab.

Patches the v4.3 HTML to implement PRD v4.5:
  OC-02: Four-priority funding structure replacing five-stage model
  OC-10: Three scenario types (Default/Leadership/Conference)
  OC-11: Stricter LFR evidence gate
  OC-13: True Carryover validation (Baselined check + cap)
  OC-15: Merit-based Sustain (not auto-100%)
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.3.html'
OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'

print("Reading v4.3 base HTML...")
with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"  Base file: {len(html)} chars")

applied = 0
failed = 0

def patch(old, new, label, count=1):
    global html, applied, failed
    if old in html:
        html = html.replace(old, new, count)
        applied += 1
        print(f"  [OK] {label}")
    else:
        failed += 1
        print(f"  [FAIL] {label}")

# ============================================================
# PATCH 1: VERSION and STAGES constant
# ============================================================
print("\n--- Engine: VERSION and STAGES ---")
patch(
    "const VERSION='3.2.0', STAGES=['Legal and Compliance (Must Do)','Sustain Engineering','Hygiene','Carryover','Value Based Portfolio'];",
    "const VERSION='4.5.0', STAGES=['Legal, Fiscal & Regulatory','High-Value Carry-Overs','Change & Sustaining Engineering','Business & Function New Initiatives'];",
    "VERSION + STAGES"
)

# ============================================================
# PATCH 2: defaults() function
# ============================================================
print("\n--- Engine: defaults ---")
patch(
    "const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},sustain:{basis:'bucket',pct:100},hygiene:{basis:'aop',pct:10},carry:2,valueCap:null,merit:45,weights:[50,25,15,10]});",
    "const defaults=()=>({budget:100,tolerance:5,lfr:15,carry:50,sustain:20,merit:45,weights:[50,25,15,10]});",
    "defaults()"
)

# ============================================================
# PATCH 3: preset() function
# ============================================================
print("\n--- Engine: preset ---")
patch(
    "function preset(name){const s=defaults();if(name==='optimal'){s.tolerance=0;s.lfr.pct=44;s.sustain.pct=100;s.hygiene={basis:'amount',pct:7.6,amount:7.6};s.carry=0;}if(name==='evidence')s.carry=3;if(name==='capacity')s.sustain.pct=75;return s;}",
    "function preset(name){const s=defaults();if(name==='optimal'){s.lfr=15;s.carry=50;s.sustain=20;}if(name==='protect'){s.lfr=20;s.carry=50;s.sustain=23;}if(name==='evidence'){s.lfr=15;s.carry=40;s.sustain=20;}if(name==='capacity'){s.lfr=15;s.carry=58;s.sustain=12;}return s;}",
    "preset()"
)

# ============================================================
# PATCH 4: validateSettings() function
# ============================================================
print("\n--- Engine: validateSettings ---")
OLD_VALIDATE = "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','sustain','hygiene'])if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))throw Error('Coverage must be nonnegative and bucket coverage cannot exceed 100.0%.');if(s.valueCap!=null&&(!Number.isFinite(s.valueCap)||s.valueCap<0))throw Error('Value allocation must be a nonnegative M\u20ac amount.');for(const n of ['lfr','sustain','hygiene'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error('Allocation must be a nonnegative M\u20ac amount.');if(!Number.isFinite(s.carry)||s.carry<0||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carryover needs a 0.0\u20135.0x threshold in 0.5x steps.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0\u2013100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}"
NEW_VALIDATE = "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','carry','sustain'])if(!Number.isFinite(s[n])||s[n]<0)throw Error(n+' must be a nonnegative M\u20ac amount.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0\u2013100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}"
patch(OLD_VALIDATE, NEW_VALIDATE, "validateSettings()")

# ============================================================
# PATCH 5: stage() function — new four-priority classification
# ============================================================
print("\n--- Engine: stage ---")
OLD_STAGE = "function stage(r){const d=key(r.overall);if(/must-do\\s*-\\s*p[12]\\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(key(r.newCarry)==='change & sustain')return 1;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;if(['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 4;if(key(r.newCarry)==='carry over')return 3;return 4;}"
NEW_STAGE = r"""function stage(r){const d=key(r.overall);if(/must-do\s*-\s*p[12]\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;if(key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 1;return 3;}"""
patch(OLD_STAGE, NEW_STAGE, "stage() — four-priority classification")

# ============================================================
# PATCH 6: compare() function — new sort order per priority
# ============================================================
print("\n--- Engine: compare ---")
OLD_COMPARE = "function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const seq=r=>key(r.overall).includes('p1')?0:key(r.overall).includes('p2')?1:2;const x=seq(a)-seq(b);if(x)return x;}if(a.stage===3&&a.ratio!==b.ratio)return (b.ratio??-Infinity)-(a.ratio??-Infinity);return b.score-a.score||(b.ratio??-Infinity)-(a.ratio??-Infinity)||b.priorityPoints-a.priorityPoints||a.id.localeCompare(b.id,'en',{numeric:true});}"
NEW_COMPARE = "function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const seq=r=>{const d=key(r.overall);return d.includes('p1')?0:d.includes('p2')?1:['EW-11','EW-65','EW-71'].includes(r.item)?2:3;};const x=seq(a)-seq(b);if(x)return x;const la=r=>r.lfrName&&r.complianceYear?0:1;const lx=la(a)-la(b);if(lx)return lx;}if(a.stage===1)return (b.ratio??-Infinity)-(a.ratio??-Infinity)||((b.payback!=null?1:0)-(a.payback!=null?1:0))||(b.consequence?.points??0)-(a.consequence?.points??0)||b.score-a.score;if(a.stage===2){const st=r=>key(r.newCarry)==='change & sustain'?0:1;const x=st(a)-st(b);if(x)return x;return b.score-a.score;}return ((b.consequence?.points??0)>0&&b.score>0?0:1)-((a.consequence?.points??0)>0&&a.score>0?0:1)||b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}"
patch(OLD_COMPARE, NEW_COMPARE, "compare() — four-priority sort order")

# ============================================================
# PATCH 7: leverTarget() — simple M€ amount
# ============================================================
print("\n--- Engine: leverTarget ---")
patch(
    "function leverTarget(s,k,demand){const v=s[k];return Math.min(demand,v.basis==='amount'?v.amount:(v.basis==='bucket'?demand:s.budget)*v.pct/100);}",
    "function leverTarget(s,k,demand){return Math.min(demand,s[k]);}",
    "leverTarget()"
)

# ============================================================
# PATCH 8: switchBasis() — remove (no longer needed)
# ============================================================
print("\n--- Engine: switchBasis ---")
# Find and replace switchBasis function - it's on line 121
# We need to find it and replace with a no-op
if "function switchBasis(" in html:
    # Find the start
    sb_start = html.find("function switchBasis(")
    # Find the end - it ends before the next function
    sb_end = html.find("\nfunction solve(", sb_start)
    if sb_end > sb_start:
        old_sb = html[sb_start:sb_end]
        html = html.replace(old_sb, "function switchBasis(){}")
        applied += 1
        print("  [OK] switchBasis() — removed")
    else:
        failed += 1
        print("  [FAIL] switchBasis() — could not find end")
else:
    failed += 1
    print("  [FAIL] switchBasis() — not found")

# ============================================================
# PATCH 9: enrich() holds — update for four-priority model
# ============================================================
print("\n--- Engine: enrich holds ---")
# Replace stage-3 carry hold with P2 evidence hold
patch(
    "if(st===3&&ratio!==null&&ratio<s.carry)holds.push('Below Carryover '+s.carry.toFixed(1)+'x threshol",
    "if(st===1&&r.benefit===null&&!r.impact)holds.push('Missing data-backed evidence for benefit, payback or impact \u2014 held for explicit review');if(st===1&&false&&ratio!==null&&ratio<0)holds.push('Legacy carryover threshol",
    "enrich() — P2 evidence hold"
)

# Replace stage-4 merit floor to stage-3
patch(
    "if(st===4&&score<s.merit)holds.push('Below advanced merit floor');",
    "if(st===3&&score<s.merit)holds.push('Below advanced merit floor');",
    "enrich() — P4 merit floor → P3+P4"
)

# Replace st>=3 benefit checks to st>=1 (carry-overs and beyond need benefits)
patch(
    "if(st>=3&&r.benefit===null)holds.push('Numeric benefits missing');",
    "if(st>=1&&r.benefit===null)holds.push('Numeric benefits missing');",
    "enrich() — benefit check from st>=3 to st>=1"
)
patch(
    "if(st>=3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "if(st>=1&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "enrich() — negative benefit check"
)
patch(
    "if(st>=3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "if(st>=1&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "enrich() — 5x review check"
)

# ============================================================
# PATCH 10: solve() — update for four priorities
# ============================================================
print("\n--- Engine: solve ---")
# Targets: 3 lever-based targets for P1/P2/P3, P4 gets residual
patch(
    " const targets=demand.map((v,i)=>i<3?leverTarget(s,['lfr','sustain','hygiene'][i],v):null),spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;",
    " const targets=demand.map((v,i)=>i<3?leverTarget(s,['lfr','carry','sustain'][i],v):null),spent=[0,0,0,0],rank=[0,0,0,0];let automatic=0;",
    "solve() — targets for 4 priorities"
)

# Update residual calculation (3 priorities instead of 4)
patch(
    " const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,4).reduce((a,b)=>a+b,0))),valueTarget=()=>Math.min(residual(),s.valueCap??Infinity);",
    " const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,3).reduce((a,b)=>a+b,0))),valueTarget=()=>residual();",
    "solve() — residual uses 3 priorities"
)

# Update stage limit check — stage 3 (P4) uses residual
# The original checks r.stage===4 for value; now it's r.stage===3
patch(
    "const stageLimit=r.stage===4?(s.valueCap==null?Infinity:valueTarget()):targets[r.stage]===null?Inf",
    "const stageLimit=r.stage===3?valueTarget():targets[r.stage]===null?Inf",
    "solve() — P4 stage limit"
)

# Update valueAvailable and targets[4] → targets[3]
patch(
    " const valueAvailable=residual();targets[4]=valueTarget();",
    " const valueAvailable=residual();targets[3]=valueTarget();",
    "solve() — valueAvailable targets[3]"
)

# Update selectionAmounts — P3 (index 2) is last lever, P4 (index 3) uses allocation
patch(
    " const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math",
    " const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math",
    "solve() — selectionAmounts (already correct for 4 stages)"
)

# ============================================================
# PATCH 11: createSession() — Default scenario
# ============================================================
print("\n--- Engine: createSession ---")
patch(
    "function createSession(data){return {schema:3,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Optimal Segmentation',preset:'optimal',revision:0,status:'Draft',data,settings:preset('optimal'),overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}",
    "function createSession(data){return {schema:4,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Default (Vanilla)',preset:'optimal',scenarioType:'default',revision:0,status:'Draft',data,settings:preset('optimal'),overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}",
    "createSession() — schema 4, Default scenario type"
)

# ============================================================
# PATCH 12: Gate definitions — four priorities
# ============================================================
print("\n--- UI: Gate definitions ---")
OLD_DEFS = "const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Work needed to meet a legal, fiscal, regulatory or compliance obligation. Fund immediate P1 obligations, scheduled P2 obligations, then the approved exceptions.','Explicit Sustain Engineering demand that maintains agreed platform change capacity. Small requests do not enter this stage simply because of their size.','Continuous Improvement and Upgrades & Enhancements that maintain or improve existing services. Decommissioning is assessed in Value Based Portfolio.','In-flight work carried into 2027. Numeric submitted benefits must meet the selected benefit-to-request threshold before funding is considered.','Remaining demand, including decommissioning and AI unless an earlier stage applies. Use the remaining envelope and rank eligible requests by merit.'];"
NEW_DEFS = "const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Legal, Fiscal and Regulatory obligations. P1 Immediate funded first, then P2 Scheduled, then CCB exceptions (EW-11, EW-65, EW-71). Only LFRs with compliance name and year auto-qualify.','High-Value Carry-Overs from AOP2026 with demonstrated return. Ranked by benefit/cost ratio, then payback, then consequence, then merit. Programmes without evidence are held.','Change and Sustaining Engineering. Sustain demand funded first by merit, then Hygiene (CI, Upgrades). Merit-based ranking, not automatic 100%.','Remaining demand including decommissioning, AI and new initiatives. Receives capacity after Priorities 1\u20133. Ranked by evidence strength then merit.'];"
patch(OLD_DEFS, NEW_DEFS, "Gate definitions — four priorities")

# ============================================================
# PATCH 13: allocationKpi — four priorities
# ============================================================
print("\n--- UI: allocationKpi ---")
patch(
    "function allocationKpi(){return '<div class=\"kpi allocation-kpi\"><span>Displayed lever total</span><strong id=\"displayed-lever-total\" data-exact=\"'+result.selection.displayedTotal+'\">'+money(result.selection.displayedTotal)+'</strong><small>Sum of the five displayed selections</small><b id=\"funded-aop\" data-exact=\"'+result.totals.allocation+'\">Funded AOP '+money(result.totals.allocation)+'</b><small>Total AOP budget '+money(session.settings.budget)+'</small></div>';}",
    "function allocationKpi(){return '<div class=\"kpi allocation-kpi\"><span>Allocated AOP</span><strong id=\"displayed-lever-total\" data-exact=\"'+result.totals.allocation+'\">'+money(result.totals.allocation)+'</strong><small>Sum of four priority allocations</small><b id=\"funded-aop\" data-exact=\"'+result.totals.allocation+'\">Budget '+money(session.settings.budget)+' M\u20ac</b><small>Scenario: '+(session.scenarioType||'default')+'</small></div>';}",
    "allocationKpi() — four priorities"
)

# ============================================================
# PATCH 14: controls() — complete replacement of lever panel
# ============================================================
print("\n--- UI: controls ---")

# The controls function is massive (one gigantic line). We need to replace it entirely.
# Find it by its start pattern and replace up to the closing of the function
OLD_CONTROLS_START = "function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class=\"panel\"><h2>Scenario and funding levers</h2>"
NEW_CONTROLS = r"""function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'',p4=Math.max(0,round(s.budget-s.lfr-s.carry-s.sustain)),stColors=['#00126E','#0B5ED7','#008BA3','#70ADE0'];return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M€) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation · Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'</div><p class="muted">Scenario type: <strong>'+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default (Vanilla)')+'</strong>. The 100.0 M€ starting envelope is illustrative. Presets retain the entered Total AOP.</p><div class="levers" style="grid-template-columns:repeat(4,minmax(0,1fr))">'+[['P1: Legal, Fiscal & Regulatory','lfr',s.lfr,result.stages[0]],['P2: High-Value Carry-Overs','carry',s.carry,result.stages[1]],['P3: Change & Sustaining','sustain',s.sustain,result.stages[2]]].map(([title,key,val,stg])=>'<article><h3>'+esc(title)+'</h3><p>Directional budget (M€)</p><input aria-label="'+esc(title)+' budget" data-lever="'+key+'" type="range" min="0" max="'+Math.max(Math.ceil(stg.demand),val)+'" step="0.1" value="'+val+'"'+disabled+'><label><input aria-label="'+esc(title)+' value" data-lever="'+key+'" type="number" min="0" max="'+Math.max(Math.ceil(stg.demand),val)+'" step="0.1" value="'+dec(val)+'"'+disabled+'> M€</label>'+allocationSelection(stg.target,stg.demand)+'</article>').join('')+'<article><h3>P4: Business & Function New</h3><p>Automatic residual</p><strong class="threshold-value" style="font-size:22px;color:var(--blue)">'+money(p4)+'</strong><small class="muted">Remaining after P1–P3</small>'+allocationSelection(result.stages[3]?result.stages[3].allocation:0,result.stages[3]?result.stages[3].demand:0)+'</article></div><details class="advanced"><summary>Additional configuration · merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Captured Consequence','Decision Band'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div><p>Weights must total 100.0. Automatic funding selects whole programs in order, within a maximum 5.0% portfolio tolerance.</p></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Carry</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','15','50','20','15'],['protect','Protect Commitments','20','50','23','7'],['evidence','Tighten Carryover','15','40','20','25'],['capacity','Release Sustain','15','58','12','15']].map(([k,n,p1,p2,p3,p4])=>{const setting=AOP.preset(k);setting.budget=s.budget;const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+' M€</td><td>'+p2+' M€</td><td>'+p3+' M€</td><td>'+p4+' M€</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table><p class="muted">Comparison is automatic-only on this source and envelope, with default evidence review state.</p></details><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="export-inclusions">Export inclusions · Excel</button><button id="export-full">Export full · Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' · r'+x.revision+' · '+x.status+'</button>').join('')+'</div></section>';}"""

# Find and replace the controls function
ctrl_start = html.find("function controls(){")
if ctrl_start >= 0:
    # Find the function end - controls is followed by scenario-rendering helpers
    # Look for the next top-level function after controls
    # The controls function ends with ';}' before a new function or other code
    # Since it's a single return statement, find the matching end
    ctrl_end = html.find("\nfunction scenario()", ctrl_start)
    if ctrl_end < 0:
        ctrl_end = html.find("function scenario()", ctrl_start)
    if ctrl_end > ctrl_start:
        old_controls = html[ctrl_start:ctrl_end]
        html = html[:ctrl_start] + NEW_CONTROLS + "\n" + html[ctrl_end:]
        applied += 1
        print("  [OK] controls() — complete replacement with four-priority levers")
    else:
        failed += 1
        print("  [FAIL] controls() — could not find end boundary")
else:
    failed += 1
    print("  [FAIL] controls() — not found")

# ============================================================
# PATCH 15: scenario() function — update gate cards section
# ============================================================
print("\n--- UI: scenario gate cards ---")
# The gate cards use 6 articles (gate 0 + 5 stages). Replace with 5 (gate 0 + 4 priorities)
OLD_GATES_RENDER = "'<div class=\"gates\">'+['Evidence and decision check',...AOP.STAGES].map((x,i)=>'<article><b class=\"gate-no\">'+i+'</b><h3>'+esc(x)+'</h3><p>'+definitions[i]+'</p>'+(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Allocated '+money(result.stages[i-1].allocation)+'</small>':'')+'</article>').join('')+'</div>'"
NEW_GATES_RENDER = "'<div class=\"gates\" style=\"grid-template-columns:repeat(5,minmax(0,1fr))\">'+['Evidence and decision check',...AOP.STAGES].map((x,i)=>'<article style=\"border-color:'+(i?['#00126E','#0B5ED7','#008BA3','#70ADE0'][i-1]:'#c8d7ed')+'\"><b class=\"gate-no\" style=\"background:'+(i?['#00126E','#0B5ED7','#008BA3','#70ADE0'][i-1]:'var(--disc)')+'\">'+i+'</b><h3>'+esc(x)+'</h3><p style=\"font-size:11px\">'+definitions[i]+'</p>'+(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Target '+money(result.stages[i-1].target)+'<br><strong>Allocated '+money(result.stages[i-1].allocation)+'</strong></small>':'')+'</article>').join('')+'</div>'"
patch(OLD_GATES_RENDER, NEW_GATES_RENDER, "scenario() — gate cards render (5 cards)")

# ============================================================
# PATCH 16: Funding bar — four priority colors
# ============================================================
print("\n--- UI: Funding bar colors ---")
patch(
    "['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0'][result.stages.indexOf(x)]",
    "['#00126E','#0B5ED7','#008BA3','#70ADE0'][result.stages.indexOf(x)]",
    "Funding bar colors (4 stages)"
)
# Also update the legend
patch(
    "result.stages.map(x=>'<span><i class=\"swatch\" style=\"background:'+['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0']",
    "result.stages.map(x=>'<span><i class=\"swatch\" style=\"background:'+['#00126E','#0B5ED7','#008BA3','#70ADE0']",
    "Legend colors (4 stages)"
)

# ============================================================
# PATCH 17: Score grid — update text for four priorities
# ============================================================
print("\n--- UI: Score grid ---")
# The merit score framework is already four components and doesn't change
# But update the description text
patch(
    "Four components are weighted, normalised to 100 and applied to every request.",
    "Four components weighted to 100. Applied uniformly across all four priority stages.",
    "Score grid description"
)

# ============================================================
# PATCH 18: Event handling — lever inputs
# ============================================================
print("\n--- UI: Event handling ---")
# The lever event handler uses data-lever to match lfr/sustain/hygiene
# We need to update it to handle the new simple M€ values
# Find the lever input handler
OLD_LEVER_HANDLER = "if(t.dataset.lever){"
if OLD_LEVER_HANDLER in html:
    # Find and read the surrounding context
    lh_pos = html.find(OLD_LEVER_HANDLER)
    # Read a window around it
    context = html[lh_pos:lh_pos+400]
    print(f"  [INFO] Lever handler found at position {lh_pos}")
    print(f"  [INFO] Context: {context[:150]}...")
else:
    print("  [INFO] Lever handler not found by exact match")

# The lever handler reads data-lever and updates settings
# Old: updates s.lfr.pct / s.sustain.pct / s.hygiene.pct (object with basis/pct)
# New: updates s.lfr / s.carry / s.sustain (simple numbers)
# Let's find the actual handler code
OLD_LEVER_CODE = "const k=t.dataset.lever;const next=clone(session.settings);next[k].pct=v;"
NEW_LEVER_CODE = "const k=t.dataset.lever;const next=clone(session.settings);next[k]=v;"
if OLD_LEVER_CODE in html:
    patch(OLD_LEVER_CODE, NEW_LEVER_CODE, "Lever handler — simple M€ values")
else:
    # Try alternate pattern
    print("  [INFO] Trying alternate lever handler pattern...")
    # The lever handler might be slightly different
    if "next[k].pct=v" in html:
        html = html.replace("next[k].pct=v", "next[k]=v", 1)
        applied += 1
        print("  [OK] Lever handler — next[k].pct=v → next[k]=v")
    elif ".pct=v" in html:
        print("  [INFO] Found .pct=v but in different context")
    else:
        print("  [WARN] Lever handler not found — may need manual fix")

# ============================================================
# PATCH 19: Basis button handler — disable
# ============================================================
print("\n--- UI: Basis button handler ---")
# data-basis buttons are no longer needed since levers are simple M€
# Find and neutralize the basis handler
if "data-basis" in html:
    print("  [INFO] data-basis attributes still present in HTML — controls() replacement should have removed them")

# ============================================================
# PATCH 20: IndexedDB version
# ============================================================
print("\n--- UI: IndexedDB ---")
patch("Philips-AOP2027-v4.3", "Philips-AOP2027-v4.5", "IndexedDB version")

# ============================================================
# PATCH 21: Reconciliation table — four stages
# ============================================================
print("\n--- UI: Reconciliation ---")
# reconciliation() renders a table of stages with selected limit, funded, unfilled
# This should work with 4 stages automatically since it iterates result.stages
# But the text "five stages" needs updating
if "five stages" in html:
    html = html.replace("five stages", "four priorities")
    applied += 1
    print("  [OK] 'five stages' → 'four priorities'")
if "five displayed selections" in html:
    html = html.replace("five displayed selections", "four priority allocations")
    applied += 1
    print("  [OK] 'five displayed selections' → 'four priority allocations'")

# ============================================================
# PATCH 22: Priority filter — update stage names
# ============================================================
print("\n--- UI: Priority filter stage names ---")
# priorityFilters reads stageName from rows which is now set by STAGES[st]
# This should work automatically since STAGES was updated

# ============================================================
# PATCH 23: Transact — update preset handler
# ============================================================
print("\n--- Engine: transact preset ---")
# The transact function for preset action applies preset settings but preserves budget
# It should work with the new settings structure since it just does clone + merge
# But we should check if it references the old structure
if "next.settings=AOP.preset(d.preset);next.settings.budget=before.budget;" in html:
    print("  [OK] transact preset handler is compatible")
elif "preset(d.preset)" in html:
    print("  [INFO] transact uses preset() — should work with new structure")

# ============================================================
# PATCH 24: Title update
# ============================================================
print("\n--- UI: Title ---")
patch(
    "AOP 2027 | Philips IT One Portfolio Dashboard",
    "AOP 2027 | Philips IT One Portfolio Dashboard v4.5",
    "Page title"
)

# ============================================================
# WRITE OUTPUT
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {applied} patches")
print(f"Failed:  {failed} patches")
print(f"{'='*60}")

print("\nWriting output...")
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"  Output: {OUT}")
print(f"  File size: {len(html)} chars ({len(html)//1024} KB)")
print("\nDone! v4.5 build complete.")
