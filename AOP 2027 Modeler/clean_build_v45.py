"""
Clean rebuild: v4.3 → v4.5 in a single pass.
No incremental patches — every change applied to the pristine v4.3 base.
"""
import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.3.html'
OUT = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'

with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"Read v4.3: {len(html)} chars")

ok = 0; fail = 0
def P(old, new, label, count=1):
    global html, ok, fail
    if old in html:
        html = html.replace(old, new, count)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ═══════════════════════════════════════════════════════════════
# A. ENGINE CORE
# ═══════════════════════════════════════════════════════════════
print("\n=== A. ENGINE ===")

# A1. VERSION + STAGES
P("const VERSION='3.2.0', STAGES=['Legal and Compliance (Must Do)','Sustain Engineering','Hygiene','Carryover','Value Based Portfolio'];",
  "const VERSION='4.5.0', STAGES=['Legal and Compliance (Must Do)','High-Value Carry-Overs','Sustain Engineering and Hygiene','Value Based Portfolio'];",
  "A1: VERSION + STAGES (4 priorities)")

# A2. normalize() — add lfrYear, lfrName, baselined columns to ix
P("overall:locate(['overall aop decision']),remarks:locate(['remarks / evidence'],false)};",
  "overall:locate(['overall aop decision']),remarks:locate(['remarks / evidence'],false),lfrYear:locate(['lfr & compliancy year'],false),lfrName:locate(['lfr & compliancy (name)','lfr & compliancy name'],false),baselined:locate(['carry over baselined'],false)};",
  "A2: normalize ix — add lfrYear, lfrName, baselined")

# A3. normalize() — add fields to record
P("const r={id:clean(get('item'))||sh.name+'-row-'+(i+1),temporary:!clean(get('item')),item:clean(get('item')),planisware:clean(get('plan')),org:clean(get('org')),name:clean(get('name')),type:clean(get('type')),newCarry:clean(get('newCarry')),category:clean(get('category')),platform:clean(get('platform')),area:clean(get('area')),priority:clean(get('priority')),cost:cost===null?null:round(cost/1000),benefit:benefit===null?null:round(benefit/1000),benefitRaw:get('benefit'),benefitDetails:clean(get('benefitDetails')),impact:clean(get('impact')),problem:clean(get('problem')),scope:clean(get('scope')),dependency:clean(get('dependency')),decisionBand:clean(get('band')),overall:clean(get('overall')),remarks:clean(get('remarks')),stream:sheetName==='EW'?'ew':'bu',sourceSheet:sh.name,sourceRow:i+1,sourceValues};",
  "const bld=numberCell(get('baselined'));const r={id:clean(get('item'))||sh.name+'-row-'+(i+1),temporary:!clean(get('item')),item:clean(get('item')),planisware:clean(get('plan')),org:clean(get('org')),name:clean(get('name')),type:clean(get('type')),newCarry:clean(get('newCarry')),category:clean(get('category')),platform:clean(get('platform')),area:clean(get('area')),priority:clean(get('priority')),cost:cost===null?null:round(cost/1000),benefit:benefit===null?null:round(benefit/1000),benefitRaw:get('benefit'),benefitDetails:clean(get('benefitDetails')),impact:clean(get('impact')),problem:clean(get('problem')),scope:clean(get('scope')),dependency:clean(get('dependency')),decisionBand:clean(get('band')),overall:clean(get('overall')),remarks:clean(get('remarks')),lfrYear:clean(get('lfrYear')),lfrName:clean(get('lfrName')),baselined:bld===null?null:round(bld/1000),stream:sheetName==='EW'?'ew':'bu',sourceSheet:sh.name,sourceRow:i+1,sourceValues};",
  "A3: normalize record — add lfrYear, lfrName, baselined")

# A4. defaults() — v4.5 lever structure
P("const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},sustain:{basis:'bucket',pct:100},hygiene:{basis:'aop',pct:10},carry:2,valueCap:null,merit:45,weights:[50,25,15,10]});",
  "const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},carry:0,sustain:{basis:'bucket',pct:100},value:{basis:'bucket',pct:100},merit:45,weights:[50,25,15,10]});",
  "A4: defaults — 4-lever structure")

# A5. preset()
P("function preset(name){const s=defaults();if(name==='optimal'){s.tolerance=0;s.lfr.pct=44;s.sustain.pct=100;s.hygiene={basis:'amount',pct:7.6,amount:7.6};s.carry=0;}if(name==='evidence')s.carry=3;if(name==='capacity')s.sustain.pct=75;return s;}",
  "function preset(name){const s=defaults();if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s.carry=0;s.sustain={basis:'bucket',pct:100};s.value={basis:'bucket',pct:100};}if(name==='protect'){s.carry=2;s.value={basis:'aop',pct:10};}if(name==='evidence'){s.carry=3;s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:15};}if(name==='capacity'){s.lfr={basis:'bucket',pct:44};s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:20};}return s;}",
  "A5: preset — 4 presets")

# A6. validateSettings()
OLD_VS = "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','sustain','hygiene'])if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))throw Error('Coverage must be nonnegative and bucket coverage cannot exceed 100.0%.');if(s.valueCap!=null&&(!Number.isFinite(s.valueCap)||s.valueCap<0))throw Error('Value allocation must be a nonnegative M\u20ac amount.');for(const n of ['lfr','sustain','hygiene'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error('Allocation must be a nonnegative M\u20ac amount.');if(!Number.isFinite(s.carry)||s.carry<0||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carryover needs a 0.0\u20135.0x threshold in 0.5x steps.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0\u2013100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}"
NEW_VS = "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Budget invalid.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance invalid.');for(const n of ['lfr','sustain','value'])if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))throw Error(n+' coverage invalid.');for(const n of ['lfr','sustain','value'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error(n+' allocation invalid.');if(!Number.isFinite(s.carry)||s.carry<0||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carry threshold invalid.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor invalid.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('Weights must total 100.');return true;}"
P(OLD_VS, NEW_VS, "A6: validateSettings — lfr/sustain/value objects + carry threshold")

# A7. stage() — eligible-only classification
P("function stage(r){const d=key(r.overall);if(/must-do\\s*-\\s*p[12]\\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(key(r.newCarry)==='change & sustain')return 1;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;if(['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 4;if(key(r.newCarry)==='carry over')return 3;return 4;}",
  "function stage(r){const d=key(r.overall);if(['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(/must-do\\s*-\\s*p[12]\\s*-/.test(d)&&r.lfrName&&r.lfrYear)return 0;if(key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category))&&r.baselined>0&&['must do','must have'].includes(key(r.priority)))return 1;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;return 3;}",
  "A7: stage — eligible-only P1/P2, P3 sustain+hygiene, P4 catch-all")

# A8. enrich() — add lfrTier + carryFundCap, remove P1/P2 evidence holds
# Add fields before the return
P("return {...r,stage:st,stageName:STAGES[st],ratio,rawComponents:raw,components,score,consequence:c,w",
  "const lfrTier=st===0?(key(r.overall).includes('p1')?'Immediate':key(r.overall).includes('p2')?'Scheduled':['EW-11','EW-65','EW-71'].includes(r.item)?'CCB':'Other'):'';const hasLfrEvidence=!!(r.lfrName&&r.lfrYear);const isBaselinedCarry=st===1;const carryFundCap=isBaselinedCarry?Math.min(r.cost,r.baselined):null;return {...r,stage:st,stageName:STAGES[st],ratio,rawComponents:raw,components,score,consequence:c,lfrTier,hasLfrEvidence,isBaselinedCarry,carryFundCap,w",
  "A8: enrich — add lfrTier, carryFundCap")

# A9. Remove holds that don't apply to P1/P2/P3 (only P4 gets benefit/merit holds)
P("if(st>=3&&r.benefit===null)holds.push('Numeric benefits missing');",
  "if(st===3&&r.benefit===null)holds.push('Numeric benefits missing');",
  "A9a: benefit hold → P4 only")
P("if(st>=3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
  "if(st===3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
  "A9b: negative benefit → P4 only")
P("if(st===3&&ratio!==null&&ratio<s.carry)holds.push('Below Carryover '+s.carry.toFixed(1)+'x threshol",
  "if(st===1&&s.carry>0&&ratio!==null&&ratio<s.carry)holds.push('Below carry-over '+s.carry.toFixed(1)+'x RoI threshol",
  "A9c: carry threshold → P2 RoI slider")
P("if(st===4&&score<s.merit)holds.push('Below advanced merit floor');",
  "if(st===3&&score<s.merit)holds.push('Below advanced merit floor');",
  "A9d: merit floor → P4")
P("if(st>=3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
  "if(st===3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
  "A9e: 5x review → P4 only")

# A10. compare() — 4-priority sort
P("function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const seq=r=>key(r.overall).includes('p1')?0:key(r.overall).includes('p2')?1:2;const x=seq(a)-seq(b);if(x)return x;}if(a.stage===3&&a.ratio!==b.ratio)return (b.ratio??-Infinity)-(a.ratio??-Infinity);return b.score-a.score||(b.ratio??-Infinity)-(a.ratio??-Infinity)||b.priorityPoints-a.priorityPoints||a.id.localeCompare(b.id,'en',{numeric:true});}",
  "function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const seq=r=>{const d=key(r.overall);return d.includes('p1')?0:d.includes('p2')?1:['EW-11','EW-65','EW-71'].includes(r.item)?2:3;};const x=seq(a)-seq(b);if(x)return x;const la=r=>r.lfrName&&r.lfrYear?0:1;const lx=la(a)-la(b);if(lx)return lx;}if(a.stage===1)return (b.ratio??-Infinity)-(a.ratio??-Infinity)||b.score-a.score;if(a.stage===2){const st=r=>key(r.newCarry)==='change & sustain'?0:1;const x=st(a)-st(b);if(x)return x;return b.score-a.score;}return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}",
  "A10: compare — 4-priority sort order")

# A11. leverTarget()
P("function leverTarget(s,k,demand){const v=s[k];return Math.min(demand,v.basis==='amount'?v.amount:(v.basis==='bucket'?demand:s.budget)*v.pct/100);}",
  "function leverTarget(s,k,demand){const v=s[k];if(!v||typeof v!=='object')return demand;return Math.min(demand,v.basis==='amount'?(v.amount||0):(v.basis==='bucket'?demand:s.budget)*v.pct/100);}",
  "A11: leverTarget — safe object access")

# A12. solve() — 4 priorities, P2 uses carry RoI, P2 caps at baselined
P(" const targets=demand.map((v,i)=>i<3?leverTarget(s,['lfr','sustain','hygiene'][i],v):null),spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;",
  " const targets=[leverTarget(s,'lfr',demand[0]),null,leverTarget(s,'sustain',demand[2]),leverTarget(s,'value',demand[3])],spent=[0,0,0,0],rank=[0,0,0,0];let automatic=0;",
  "A12: solve targets — P1/P3/P4 levers, P2 null")

P(" const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,4).reduce((a,b)=>a+b,0))),valueTarget=()=>Math.min(residual(),s.valueCap??Infinity);",
  " const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,3).reduce((a,b)=>a+b,0))),valueTarget=()=>targets[3]!==null?Math.min(residual(),targets[3]*(1+s.tolerance/100)):residual();",
  "A13: residual + valueTarget — P4 respects lever")

P("const stageLimit=r.stage===4?(s.valueCap==null?Infinity:valueTarget()):targets[r.stage]===null?Inf",
  "const stageLimit=r.stage===3?valueTarget():targets[r.stage]===null?Inf",
  "A14: P4 stageLimit uses valueTarget")

# P2 funding cap at baselined
P("r.automatic=r.cost;",
  "r.automatic=r.stage===1&&r.carryFundCap!==null?r.carryFundCap:r.cost;",
  "A15: P2 auto-funding capped at baselined")

P(" const valueAvailable=residual();targets[4]=valueTarget();",
  " const valueAvailable=residual();targets[3]=valueTarget();",
  "A16: targets[3] not [4]")

# Fix stages map for 4 stages
P(" const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math",
  " const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math",
  "A17: selectionAmounts (compatible)")

# A18. switchBasis — add 'value' to allowed keys
P("function switchBasis(s,k,basis,demand){if(!['lfr','sustain','hygiene'].includes(k)",
  "function switchBasis(s,k,basis,demand){if(!['lfr','sustain','value'].includes(k)",
  "A18: switchBasis — value key")

# A19. createSession — schema 4, Default scenario
P("function createSession(data){return {schema:3,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Optimal Segmentation',preset:'optimal',revision:0,status:'Draft',data,settings:preset('optimal'),overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}",
  "function createSession(data){return {schema:4,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Optimal Segmentation',preset:'optimal',scenarioType:'default',revision:0,status:'Draft',data,settings:preset('optimal'),overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}",
  "A19: createSession — schema 4, scenarioType")

# A20. validateSession schema check
P("s.schema!==3||s.ruleVersion!==VERSION",
  "(s.schema!==3&&s.schema!==4)||s.ruleVersion!==VERSION",
  "A20: validateSession accepts schema 3+4")

# ═══════════════════════════════════════════════════════════════
# B. UI — Scenario Tab
# ═══════════════════════════════════════════════════════════════
print("\n=== B. UI ===")

# B1. Tab names
P("tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}",
  "tabNames={demand:'Demand Overview',scenario:'Program AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'}",
  "B1: tabNames — 6 tabs")
# (Already patched in v4.3 build — this handles the base)

# B2. allocationSelection — show FUNDED of DEMAND, single line
P("function allocationSelection(amount,demand,word='of'){return '<div class=\"allocation-selection\"><span class=\"selection-line\"><strong class=\"selected-amount\">'+money(amount)+'</strong><span> '+word+' '+money(demand)+'</span></span><span class=\"selection-caption\">Demand to be Allocated</span></div>';}",
  "function allocationSelection(funded,demand){return '<div class=\"allocation-selection\" style=\"white-space:nowrap;font-size:13px;line-height:1.5;margin-top:6px\"><strong class=\"selected-amount\" style=\"color:var(--prot)\">'+money(funded)+'</strong> funded of '+money(demand)+' Demand</div>';}",
  "B2: allocationSelection — funded of demand, nowrap")

# B3. allocationKpi — clean display
P("function allocationKpi(){return '<div class=\"kpi allocation-kpi\"><span>Displayed lever total</span><strong id=\"displayed-lever-total\" data-exact=\"'+result.selection.displayedTotal+'\">'+money(result.selection.displayedTotal)+'</strong><small>Sum of the five displayed selections</small><b id=\"funded-aop\" data-exact=\"'+result.totals.allocation+'\">Funded AOP '+money(result.totals.allocation)+'</b><small>Total AOP budget '+money(session.settings.budget)+'</small></div>';}",
  "function allocationKpi(){return '<div class=\"kpi allocation-kpi\"><span>Allocated AOP</span><strong id=\"displayed-lever-total\" data-exact=\"'+result.totals.allocation+'\">'+money(result.totals.allocation)+'</strong><small>of '+money(session.settings.budget)+' Total AOP</small><b id=\"funded-aop\" data-exact=\"'+result.totals.allocation+'\">'+result.totals.count+' programmes funded</b><small>'+(result.totals.over>0?'Over by '+money(result.totals.over):'Within budget')+'</small></div>';}",
  "B3: allocationKpi — clean, no per-stage text")

# B4. Gate definitions — 4 priorities
P("const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Work needed to meet a legal, fiscal, regulatory or compliance obligation. Fund immediate P1 obligations, scheduled P2 obligations, then the approved exceptions.','Explicit Sustain Engineering demand that maintains agreed platform change capacity. Small requests do not enter this stage simply because of their size.','Continuous Improvement and Upgrades & Enhancements that maintain or improve existing services. Decommissioning is assessed in Value Based Portfolio.','In-flight work carried into 2027. Numeric submitted benefits must meet the selected benefit-to-request threshold before funding is considered.','Remaining demand, including decommissioning and AI unless an earlier stage applies. Use the remaining envelope and rank eligible requests by merit.'];",
  "const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Mandatory legal, fiscal, regulatory and compliance obligations. Only LFRs with compliance name and year auto-qualify. CCBs funded in full.','Carry-over programmes with confirmed baselined business case and Must Do/Must Have priority. Capped at min(Requested, Baselined).','Change & Sustain funded first, then Hygiene (CI, Upgrades) ranked by merit within budget.','All remaining demand including new initiatives, decommissioning and AI. Ranked by evidence then merit.'];",
  "B4: Gate definitions — 4 priorities")

# B5. Gate card grid — 5 columns (gate 0 + 4 stages)
P("'<div class=\"gates\">'",
  "'<div class=\"gates\" style=\"grid-template-columns:repeat(5,minmax(0,1fr))\">'",
  "B5: Gates 5 columns")

# B6. Gate card render — show target + allocated
P("(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Allocated '+money(result.stages[i-1].allocation)+'</small>':'')",
  "(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Target '+money(result.stages[i-1].target)+'<br><strong>Allocated '+money(result.stages[i-1].allocation)+'</strong></small>':'')",
  "B6: Gate cards — show target + allocated")

# B7. Funding bar — 4 colors
P("['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0'][result.stages.indexOf(x)]",
  "['#00126E','#0B5ED7','#008BA3','#70ADE0'][result.stages.indexOf(x)]",
  "B7: Bar colors — 4 stages")

# B8. Legend colors
P("result.stages.map(x=>'<span><i class=\"swatch\" style=\"background:'+['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0']",
  "result.stages.map(x=>'<span><i class=\"swatch\" style=\"background:'+['#00126E','#0B5ED7','#008BA3','#70ADE0']",
  "B8: Legend colors")

# B9. Remove reconciliation
P("+reconciliation()+",
  "+",
  "B9: Remove reconciliation call")

# B10. Controls — complete replacement
print("  [INFO] B10: Replacing controls()...")
ctrl_start = html.find("function controls(){")
ctrl_end = html.find("function filters(scope,rows)", ctrl_start)
if ctrl_start >= 0 and ctrl_end > ctrl_start:
    OLD_CTRL = html[ctrl_start:ctrl_end]

    NEW_CTRL = r"""function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M\u20ac) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation \xb7 Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'</div><p class="muted">Scenario type: <strong>'+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default (Vanilla)')+'</strong>. The 100 M\u20ac starting envelope is illustrative. Presets retain the entered Total AOP.</p><div class="levers">'+[['1 \xb7 Legal and Compliance (Must Do)','lfr',0,'lever'],['2 \xb7 High-Value Carry-Overs','carry',1,'roi'],['3 \xb7 Sustain Engineering and Hygiene','sustain',2,'lever'],['4 \xb7 Value Based Portfolio','value',3,'lever']].map(([title,k,si,mode])=>{if(mode==='roi')return '<article><h3>'+esc(title)+'</h3><p>Minimum benefit / request (RoI)</p><input id="carry" aria-label="Carryover RoI threshold" type="range" min="0" max="5" step="0.5" value="'+s.carry+'"'+disabled+'><span class="threshold-value">'+dec(s.carry)+'x'+(s.carry>=5?'+':'')+'</span>'+allocationSelection(result.stages[si].allocation,result.stages[si].demand)+'</article>';const v=s[k],isAmt=v.basis==='amount',val=isAmt?(v.amount||0):v.pct,max=isAmt?Math.max(Math.ceil(result.stages[si].demand),Math.ceil(val)):Math.max(100,val),step=isAmt?'0.001':'0.1',unit=isAmt?'M\u20ac':'%',label=isAmt?'allocation':'percentage';return '<article><h3>'+esc(title)+'</h3><div class="basis">'+[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M\u20ac)']].map(([b,bl])=>'<button data-basis="'+k+'" data-value="'+b+'" class="'+(v.basis===b?'active':'')+'"'+disabled+'>'+bl+'</button>').join('')+'</div><input aria-label="'+esc(title)+' '+label+'" data-lever="'+k+'" type="range" min="0" max="'+max+'" step="'+step+'" value="'+val+'"'+disabled+'><label><input aria-label="'+esc(title)+' '+label+' value" data-lever="'+k+'" type="number" min="0" max="'+max+'" step="'+step+'" value="'+dec(val)+'"'+disabled+'> '+unit+'</label>'+allocationSelection(result.stages[si].allocation,result.stages[si].demand)+'</article>';}).join('')+'</div><details class="advanced"><summary>Additional configuration \xb7 merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Captured Consequence','Decision Band'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Carry RoI</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','100% bucket','0x','100% bucket','100% bucket'],['protect','Protect Commitments','100% bucket','2.0x','100% bucket','10% AOP'],['evidence','Tighten Carryover','100% bucket','3.0x','75% bucket','15% AOP'],['capacity','Release Sustain','44% bucket','0x','75% bucket','20% AOP']].map(([k,n,p1,p2,p3,p4])=>{const setting=AOP.preset(k);setting.budget=s.budget;const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+'</td><td>'+p2+'</td><td>'+p3+'</td><td>'+p4+'</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table></details><div class="toolbar" style="margin-bottom:10px;padding:10px 0;border-top:1px solid var(--border)"><span style="font-size:11px;color:var(--text2);margin-right:8px">Scenario type:</span><button data-scenario-type="default" class="'+(session.scenarioType==='default'||!session.scenarioType?'primary':'')+'">Default (Vanilla)</button><button data-scenario-type="leadership" class="'+(session.scenarioType==='leadership'?'primary':'')+'">Leadership</button><button data-scenario-type="conference" class="'+(session.scenarioType==='conference'?'primary':'')+'">Conference</button></div><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="export-inclusions">Export inclusions \xb7 Excel</button><button id="export-full">Export full \xb7 Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' \xb7 r'+x.revision+' \xb7 '+x.status+'</button>').join('')+'</div></section>';}
"""
    html = html[:ctrl_start] + NEW_CTRL.strip() + "\n" + html[ctrl_end:]
    ok += 1; print("  [OK] B10: controls — full replacement (4 levers + scenario type)")
else:
    fail += 1; print("  [FAIL] B10: controls — boundary not found")

# ═══════════════════════════════════════════════════════════════
# C. EVENT HANDLERS
# ═══════════════════════════════════════════════════════════════
print("\n=== C. EVENT HANDLERS ===")

# C1. Basis click handler — correct stage mapping
P("switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[['lfr','sustain','hygiene'].indexOf(b.dataset.basis)].demand)",
  "switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[{lfr:0,sustain:2,value:3}[b.dataset.basis]].demand)",
  "C1: Basis handler — correct stage indices")

# C2. Scenario type click handler
P("else if(b.dataset.action)commit(b.dataset.action);",
  "else if(b.dataset.scenarioType){session.scenarioType=b.dataset.scenarioType;render();persist();}else if(b.dataset.action)commit(b.dataset.action);",
  "C2: Scenario type click handler")

# C3. Lever change handler — object-based + carry
P("if(x.dataset.lever)s[x.dataset.lever][s[x.dataset.lever].basis==='amount'?'amount':'pct']=Number(x.value);else s[x.id]=Number(x.value);",
  "if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else s[x.id]=Number(x.value);",
  "C3: Lever handler — object pct/amount")

# C4. Live slider input handler
P("document.addEventListener('input',e=>{if(e.target.id==='value-allocation')e.target.nextElementSibling.querySelector('.selected-amount').textContent=money(Number(e.target.value));});",
  "document.addEventListener('input',e=>{const x=e.target;if(x.type==='range'&&(x.dataset.lever||x.id==='carry')){const s=AOP.clone(session.settings);if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else if(x.id==='carry'){s.carry=Number(x.value);}commit('setting',{settings:s});}});",
  "C4: Live slider input for all levers")

# C5. Remove dead value-allocation handler
P("if(x.id==='value-allocation'){const s=AOP.clone(session.settings),amount=Number(x.value);s.valueCap=amount>=result.valueAvailable-1e-9?null:amount;commit('setting',{settings:s});}else if(x.dataset.lever",
  "if(x.dataset.lever",
  "C5: Remove dead value-allocation handler")

# C6. Fork preserves scenario type
P("'fork'){next.status='Draft';next.id='scenario-'+Date.now();next.name+=' working copy';next.parent=session.id;}",
  "'fork'){next.status='Draft';next.id='scenario-'+Date.now();next.name+=' working copy';next.parent=session.id;next.scenarioType=session.scenarioType||'default';}",
  "C6: Fork preserves scenarioType")

# C7. Status bar — show scenario type
P("session.name+' \\xb7 '+session.status+' \\xb7 r'+session.revision",
  "session.name+' \\xb7 '+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default')+' \\xb7 '+session.status+' \\xb7 r'+session.revision",
  "C7: Status bar with scenario type")

# ═══════════════════════════════════════════════════════════════
# D. CSS + INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════════
print("\n=== D. CSS + INFRA ===")

P(".levers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))",
  ".levers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
  "D1: Levers CSS 4 columns")

P(".gates{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))",
  ".gates{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))",
  "D2: Gates CSS 5 columns")

P("body{margin:0;background:var(--bg)",
  "body{margin:0;overflow-x:hidden;background:var(--bg)",
  "D3: Body overflow-x hidden")

P("Philips-AOP2027-v4.3", "Philips-AOP2027-v4.5", "D4: IndexedDB version")

# B11 already handled by tabNames, render dispatch, workflow in v4.3 build patches
# These were done by the original build_v43.py — they're already in v4.3

# ═══════════════════════════════════════════════════════════════
# E. OC-16: Merit score breakdown
# ═══════════════════════════════════════════════════════════════
print("\n=== E. OC-16 ===")
P("Weighted merit components</dt><dd>'+r.components.map(dec).join(' / ')+'</dd>",
  'Merit Score Breakdown</dt><dd><table style="width:100%;border-collapse:collapse;font-size:11px;margin:4px 0"><tr style="background:var(--dk);color:white"><th style="padding:5px 8px;text-align:left">Component</th><th style="padding:5px 8px;text-align:right">Raw</th><th style="padding:5px 8px;text-align:right">Weight</th><th style="padding:5px 8px;text-align:right">Weighted</th></tr>\'+[\'Submitted Benefit\',\'Submitted Priority\',\'Captured Consequence\',\'Decision Band\'].map((n,i)=>\'<tr style="border-bottom:1px solid var(--mist)"><td style="padding:5px 8px">\'+n+\'</td><td style="padding:5px 8px;text-align:right">\'+r.rawComponents[i]+\'/\'+[50,25,15,10][i]+\'</td><td style="padding:5px 8px;text-align:right">\'+dec(session.settings.weights[i])+\'</td><td style="padding:5px 8px;text-align:right;font-weight:700">\'+dec(r.components[i])+\'</td></tr>\').join(\'\')+\'<tr style="background:var(--lt);font-weight:700"><td style="padding:5px 8px">Total</td><td></td><td style="text-align:right">100</td><td style="padding:5px 8px;text-align:right">\'+dec(r.score)+\'</td></tr></table></dd>',
  "E1: OC-16 merit score breakdown")

# ═══════════════════════════════════════════════════════════════
# F. OC-01: Dynamic total row
# ═══════════════════════════════════════════════════════════════
print("\n=== F. OC-01 ===")
P("if(tc[1])tc[1].textContent=Object.keys(filters).length?visCount:dataRows.length;",
  "if(tc[1])tc[1].textContent=Object.keys(filters).length?visCount+' of '+dataRows.length:dataRows.length;",
  "F1: Count X of Y")
P("if(tc[2])tc[2].textContent=Object.keys(filters).length?visDemand.toFixed(1):tc[2].dataset.orig||tc[2].textContent;",
  "if(tc[2]){if(!tc[2].dataset.orig)tc[2].dataset.orig=tc[2].textContent;tc[2].textContent=Object.keys(filters).length?visDemand.toFixed(1)+' of '+tc[2].dataset.orig:tc[2].dataset.orig;}",
  "F2: Demand X of Y")

# ═══════════════════════════════════════════════════════════════
# G. OC-07: Business changelog
# ═══════════════════════════════════════════════════════════════
print("\n=== G. OC-07 ===")
P("{name:'Decisions',rows:[['Event','Time','Origin','Action','Revision','Source version','Details','Old values','New values'],...session.events.map(e=>[e.id,e.time,e.origin,e.action,e.revision,e.sourceVersion,JSON.stringify(e.details),JSON.stringify(e.before),JSON.stringify(e.after)])]}",
  "{name:'Decisions',rows:[['Event','Time','Origin','Action','Revision','Source version','Details','Old values','New values'],...session.events.map(e=>[e.id,e.time,e.origin,e.action,e.revision,e.sourceVersion,JSON.stringify(e.details),JSON.stringify(e.before),JSON.stringify(e.after)])]},{name:'Change Log',rows:[['Date','Action','ID','Programme','Organisation','Tab','Old','New','Note','Rev'],...session.events.filter(e=>e.action!=='setting'&&e.action!=='preset').map(e=>{const d=e.details||{};const prog=result.rows.find(r=>r.id===d.id);return [e.time,e.action==='program'?(d.choice==='include'?'Included':d.choice==='exclude'?'Excluded':'Amount'):e.action,d.id||'',prog?.name||'',prog?.org||'',e.origin||'',d.before!==undefined?String(d.before):'',d.after!==undefined?String(d.after):(d.amount!==undefined?d.amount+'':''),d.note||'',e.revision];})]}",
  "G1: Business Change Log sheet")

# ═══════════════════════════════════════════════════════════════
# WRITE
# ═══════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print(f"Applied: {ok}")
print(f"Failed:  {fail}")
print(f"{'='*60}")

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nWritten: {OUT} ({len(html)} chars)")
