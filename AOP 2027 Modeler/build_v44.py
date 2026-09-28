"""Build v4.4 One Portfolio Dashboard — Four-Priority Engine for Program AOP Scenarios tab.

PRD v4.4b OC-02: Replace five-stage funding model with four-priority structure:
  P1: Legal, Fiscal & Regulatory Requirements
  P2: High-Value Carry-Overs (2026)
  P3: Change & Sustaining Engineering (Sustain + Hygiene combined)
  P4: Business & Function New Initiatives (residual)

Directional budget levers for P1/P2/P3 in M€; P4 gets the residual.
New presets: Optimal 15/50/20/15, Protect 20/50/23/7, Evidence 15/40/20/25, Capacity 15/58/12/15.
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.3.html'
OUT  = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.4.html'

print("Reading v4.3 base HTML...")
with open(BASE, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"  Base file: {len(html)} chars")

# ============================================================
# HELPER
# ============================================================
def patch(old, new, label, count=1, replace_all=False):
    global html
    if old in html:
        if replace_all:
            html = html.replace(old, new)
        else:
            html = html.replace(old, new, count)
        print(f"  OK: {label}")
        return True
    else:
        print(f"  FAILED - not found: {label}")
        return False

# ============================================================
# STEP 1: ENGINE — STAGES constant
# ============================================================
print("\n--- STEP 1: Replace STAGES constant ---")
patch(
    "STAGES=['Legal and Compliance (Must Do)','Sustain Engineering','Hygiene','Carryover','Value Based Portfolio']",
    "STAGES=['Legal, Fiscal & Regulatory','High-Value Carry-Overs','Change & Sustaining Engineering','Business & Function New Initiatives']",
    "STAGES constant (5→4)"
)

# ============================================================
# STEP 2: ENGINE — stage() function
# ============================================================
print("\n--- STEP 2: Replace stage() function ---")
OLD_STAGE = (
    "function stage(r){"
    "const d=key(r.overall);"
    "if(/must-do\\s*-\\s*p[12]\\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;"
    "if(key(r.newCarry)==='change & sustain')return 1;"
    "if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;"
    "if(['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 4;"
    "if(key(r.newCarry)==='carry over')return 3;"
    "return 4;}"
)

NEW_STAGE = (
    "function stage(r){"
    "const d=key(r.overall);"
    # P1: LFR — P1 Immediate, P2 Scheduled, or CCB exceptions
    "if(/must-do\\s*-\\s*p[12]\\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;"
    # P2: High-Value Carry-Overs — carry over excluding decommissioning
    "if(key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 1;"
    # P3: Change & Sustaining — sustain + hygiene categories combined
    "if(key(r.newCarry)==='change & sustain')return 2;"
    "if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;"
    # P4: Everything else — decommissioning, AI, new initiatives
    "return 3;}"
)
patch(OLD_STAGE, NEW_STAGE, "stage() function (4-priority classification)")

# ============================================================
# STEP 3: ENGINE — enrich() holds adjustments
# ============================================================
print("\n--- STEP 3: Update enrich() holds for 4-priority ---")

# The old enrich checks st>=3 for benefits and st===3 for carryover threshold and st===4 for merit floor.
# In new model: P1=0, P2=1 (carry-overs), P3=2, P4=3
# P2 needs evidence hold (benefit required); P4 needs merit floor; benefit claims at P2+ need review

# Fix: st>=3 benefit missing → st>=1 (all except P1 need benefits consideration)
# Actually per PRD, P2 specifically requires data-backed evidence. P3/P4 less strict for auto-holds.
# Keep the structure but adjust stage indices:
#   - "st>=3&&r.benefit===null" → "st===1&&r.benefit===null" (only P2 carry-overs require benefits)
#   - "st===3&&ratio!==null&&ratio<s.carry" → remove (no carry threshold in new model)
#   - "st===4&&score<s.merit" → "st===3&&score<s.merit" (P4 merit floor)
#   - "st>=3&&ratio>5" → "st>=1&&ratio>5" (benefit claims need review for P2+)

# Fix benefit missing hold: was st>=3, now P2 only (carry-overs need evidence)
patch(
    "if(st>=3&&r.benefit===null)holds.push('Numeric benefits missing');",
    "if(st===1&&r.benefit===null)holds.push('Numeric benefits missing — data-backed evidence required for carry-over funding');",
    "enrich: benefit missing hold (P2 only)"
)

# Fix negative benefit hold
patch(
    "if(st>=3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "if(st>=1&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "enrich: negative benefit hold (P2+)"
)

# Remove old carryover threshold hold (no longer used — P2 uses evidence instead)
patch(
    "if(st===3&&ratio!==null&&ratio<s.carry)holds.push('Below Carryover '+s.carry.toFixed(1)+'x threshold');",
    "",
    "enrich: remove carryover threshold hold"
)

# Fix merit floor: was st===4, now st===3 (P4)
patch(
    "if(st===4&&score<s.merit)holds.push('Below advanced merit floor');",
    "if(st===3&&score<s.merit)holds.push('Below advanced merit floor');",
    "enrich: merit floor (P4)"
)

# Fix benefit claim review: was st>=3, now st>=1 (P2+)
patch(
    "if(st>=3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "if(st>=1&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "enrich: benefit claim review (P2+)"
)

# Add P2 evidence hold: carry-overs without payback or impact evidence are held
# Insert after the benefit claim review line
patch(
    "if(r.temporary)warnings.push('Temporary source ID');",
    "if(st===1&&r.benefit!==null&&ratio!==null&&ratio<1&&!clean(r.impact))holds.push('Missing data-backed evidence for benefit, payback or impact — held for explicit review');"
    "if(r.temporary)warnings.push('Temporary source ID');",
    "enrich: P2 evidence hold for carry-overs"
)

# ============================================================
# STEP 4: ENGINE — compare() function
# ============================================================
print("\n--- STEP 4: Replace compare() function ---")
OLD_COMPARE = (
    "function compare(a,b){"
    "if(a.stage!==b.stage)return a.stage-b.stage;"
    "if(a.stage===0){const seq=r=>key(r.overall).includes('p1')?0:key(r.overall).includes('p2')?1:2;const x=seq(a)-seq(b);if(x)return x;}"
    "if(a.stage===3&&a.ratio!==b.ratio)return (b.ratio??-Infinity)-(a.ratio??-Infinity);"
    "return b.score-a.score||(b.ratio??-Infinity)-(a.ratio??-Infinity)||b.priorityPoints-a.priorityPoints||a.id.localeCompare(b.id,'en',{numeric:true});}"
)

NEW_COMPARE = (
    "function compare(a,b){"
    "if(a.stage!==b.stage)return a.stage-b.stage;"
    # P1: P1 Immediate before P2 Scheduled before CCB exceptions; within tier: LFR evidence then merit
    "if(a.stage===0){const seq=r=>key(r.overall).includes('p1')?0:key(r.overall).includes('p2')?1:2;const x=seq(a)-seq(b);if(x)return x;}"
    # P2: benefit/cost ratio desc, then payback presence, then consequence, then merit
    "if(a.stage===1){const rd=(b.ratio??-Infinity)-(a.ratio??-Infinity);if(rd)return rd;"
    "const pa=clean(a.impact)?1:0,pb=clean(b.impact)?1:0;if(pb-pa)return pb-pa;"
    "const cd=b.consequence.points-a.consequence.points;if(cd)return cd;"
    "return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}"
    # P3: Sustain funded first (merit desc), then Hygiene (merit desc)
    "if(a.stage===2){const sa=key(a.newCarry)==='change & sustain'?0:1,sb=key(b.newCarry)==='change & sustain'?0:1;"
    "if(sa!==sb)return sa-sb;"
    "return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}"
    # P4: evidence strength first (both benefit+impact > one > none), then merit
    "if(a.stage===3){const ev=r=>(r.benefit!=null&&r.benefit>0?1:0)+(clean(r.impact)?1:0);"
    "const ed=ev(b)-ev(a);if(ed)return ed;"
    "return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}"
    "return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}"
)
patch(OLD_COMPARE, NEW_COMPARE, "compare() function (4-priority sort)")

# ============================================================
# STEP 5: ENGINE — defaults() function
# ============================================================
print("\n--- STEP 5: Replace defaults() function ---")
patch(
    "const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},sustain:{basis:'bucket',pct:100},hygiene:{basis:'aop',pct:10},carry:2,valueCap:null,merit:45,weights:[50,25,15,10]})",
    "const defaults=()=>({budget:100,tolerance:5,p1:15,p2:50,p3:20,merit:45,weights:[50,25,15,10]})",
    "defaults() function (directional budget levers)"
)

# ============================================================
# STEP 6: ENGINE — preset() function
# ============================================================
print("\n--- STEP 6: Replace preset() function ---")
OLD_PRESET = (
    "function preset(name){"
    "const s=defaults();"
    "if(name==='optimal'){s.tolerance=0;s.lfr.pct=44;s.sustain.pct=100;s.hygiene={basis:'amount',pct:7.6,amount:7.6};s.carry=0;}"
    "if(name==='evidence')s.carry=3;"
    "if(name==='capacity')s.sustain.pct=75;"
    "return s;}"
)
NEW_PRESET = (
    "function preset(name){"
    "const s=defaults();"
    "if(name==='optimal'){s.p1=15;s.p2=50;s.p3=20;}"
    "if(name==='protect'){s.p1=20;s.p2=50;s.p3=23;}"
    "if(name==='evidence'){s.p1=15;s.p2=40;s.p3=20;}"
    "if(name==='capacity'){s.p1=15;s.p2=58;s.p3=12;}"
    "return s;}"
)
patch(OLD_PRESET, NEW_PRESET, "preset() function (4-priority presets)")

# ============================================================
# STEP 7: ENGINE — validateSettings() function
# ============================================================
print("\n--- STEP 7: Replace validateSettings() function ---")
OLD_VALIDATE = (
    "function validateSettings(s){"
    "if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');"
    "if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');"
    "for(const n of ['lfr','sustain','hygiene'])"
    "if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))"
    "throw Error('Coverage must be nonnegative and bucket coverage cannot exceed 100.0%.');"
    "if(s.valueCap!=null&&(!Number.isFinite(s.valueCap)||s.valueCap<0))"
    "throw Error('Value allocation must be a nonnegative M\u20ac amount.');"
    "for(const n of ['lfr','sustain','hygiene'])"
    "if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))"
    "throw Error('Allocation must be a nonnegative M\u20ac amount.');"
)

# Need to find the actual end of validateSettings
# It continues with carry and merit and weights checks. Let me find it.
# Actually let me just replace the first part and fix what follows.
# The simpler approach: replace the whole validateSettings up to its closing brace.

# Let me just replace the parts that reference the old lever structure
# First part: the basis/pct checks
patch(
    "for(const n of ['lfr','sustain','hygiene'])"
    "if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))"
    "throw Error('Coverage must be nonnegative and bucket coverage cannot exceed 100.0%.');",
    "for(const n of ['p1','p2','p3'])"
    "if(!Number.isFinite(s[n])||s[n]<0)"
    "throw Error('Priority budget lever must be a nonnegative amount.');",
    "validateSettings: lever checks (directional budgets)"
)

# Remove valueCap validation
patch(
    "if(s.valueCap!=null&&(!Number.isFinite(s.valueCap)||s.valueCap<0))"
    "throw Error('Value allocation must be a nonnegative M\u20ac amount.');",
    "",
    "validateSettings: remove valueCap check"
)

# Remove amount basis validation
patch(
    "for(const n of ['lfr','sustain','hygiene'])"
    "if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))"
    "throw Error('Allocation must be a nonnegative M\u20ac amount.');",
    "",
    "validateSettings: remove amount basis check"
)

# Remove carry validation (no longer a setting)
patch(
    "if(!Number.isFinite(s.carry)||s.carry<0||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carryover needs a 0.0–5.0x threshold in 0.5x steps.');",
    "",
    "validateSettings: remove carry threshold check"
)

# ============================================================
# STEP 8: ENGINE — leverTarget() function
# ============================================================
print("\n--- STEP 8: Replace leverTarget() function ---")
patch(
    "function leverTarget(s,k,demand){const v=s[k];return Math.min(demand,v.basis==='amount'?v.amount:(v.basis==='bucket'?demand:s.budget)*v.pct/100);}",
    "function leverTarget(s,k,demand){return Math.min(demand,s[k]);}",
    "leverTarget() function (simple M€ budget)"
)

# ============================================================
# STEP 9: ENGINE — solve() function
# ============================================================
print("\n--- STEP 9: Replace solve() function ---")

OLD_SOLVE = (
    "function solve(data,s,overrides={},reviews={}){\n"
    " validateSettings(s);const rows=data.records.map(r=>enrich(r,s,reviews[r.id])).sort(compare),"
    "demand=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));\n"
    " const targets=demand.map((v,i)=>i<3?leverTarget(s,['lfr','sustain','hygiene'][i],v):null),"
    "spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;\n"
    " const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,4).reduce((a,b)=>a+b,0))),"
    "valueTarget=()=>Math.min(residual(),s.valueCap??Infinity);\n"
    " for(const r of rows){r.rank=++rank[r.stage];r.automatic=0;r.reason=r.holds.join('; ');"
    "if(r.eligible){const stageLimit=r.stage===4?(s.valueCap==null?Infinity:valueTarget()):targets[r.stage]===null?Infinity:"
    "Math.min(demand[r.stage],targets[r.stage]*(1+s.tolerance/100));"
    "if(spent[r.stage]+r.cost>stageLimit+1e-9)r.reason=r.stage===4?'Whole program does not fit selected Value allocation':"
    "'Whole program does not fit stage target plus tolerance';"
    "else if(automatic+r.cost>s.budget*(1+s.tolerance/100)+1e-9)r.reason='Whole program does not fit Total AOP plus tolerance';"
    "else{r.automatic=r.cost;spent[r.stage]+=r.cost;automatic+=r.cost;r.reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank;}}\n"
    "  const o=overrides[r.id];r.final=r.automatic;r.override=o||null;\n"
    "  if(o&&o.state!=='needs-review'){if(o.choice==='exclude'){r.final=0;r.reason='Manual exclusion'+(o.note?': '+o.note:'');"
    "}else if(o.choice==='include'){const amount=o.amount??r.cost;"
    "if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)throw Error(r.id+': invalid prioritised amount.');"
    "r.final=round(amount);r.reason=(r.final<r.cost?'Manual scope amount':'Manual inclusion')+(o.note?': '+o.note:'');}}\n"
    "  if(o?.state==='needs-review')r.warnings.push('Previous decision needs source review');\n"
    "  if(r.final>0&&r.holds.length)r.warnings.push('Manual evidence exception: '+r.holds.join('; '));\n"
    "  r.unfunded=r.cost===null?null:round(r.cost-r.final);"
    "r.status=r.final>0?(r.final<r.cost?'Partial scope':'Funded'):(o?.choice==='exclude'&&o.state!=='needs-review'?'Excluded':'Not funded');\n"
    " }\n"
    " const valueAvailable=residual();targets[4]=valueTarget();\n"
    " const allocation=sum(rows,r=>r.final),requested=sum(rows,r=>r.cost),auto=sum(rows,r=>r.automatic);\n"
    " const totals={requested,allocation,automatic:auto,manual:round(allocation-auto),"
    "unfunded:sum(rows,r=>r.unfunded),available:Math.max(0,round(s.budget-allocation)),"
    "over:Math.max(0,round(allocation-s.budget)),count:rows.filter(r=>r.final>0).length,"
    "partial:rows.filter(r=>r.status==='Partial scope').length,missing:rows.filter(r=>r.cost===null).length};\n"
    " const stages=STAGES.map((name,i)=>({name,demand:demand[i],target:targets[i],"
    "automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),"
    "allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));\n"
    " const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),"
    "selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),"
    "displayedTotal:sum(selectionAmounts,x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10)};\n"
    " return {version:VERSION,rows,totals,stages,valueAvailable,selection,"
    "streams:Object.fromEntries(['ew','bu'].map(x=>[x,{requested:sum(rows.filter(r=>r.stream===x),r=>r.cost),"
    "automatic:sum(rows.filter(r=>r.stream===x),r=>r.automatic),"
    "allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};\n"
    "}"
)

NEW_SOLVE = (
    "function solve(data,s,overrides={},reviews={}){\n"
    " validateSettings(s);const rows=data.records.map(r=>enrich(r,s,reviews[r.id])).sort(compare),"
    "demand=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));\n"
    # P1/P2/P3 get directional budgets; P4 gets residual
    " const targets=[leverTarget(s,'p1',demand[0]),leverTarget(s,'p2',demand[1]),leverTarget(s,'p3',demand[2]),null],"
    "spent=[0,0,0,0],rank=[0,0,0,0];let automatic=0;\n"
    " const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,3).reduce((a,b)=>a+b,0)));\n"
    " for(const r of rows){r.rank=++rank[r.stage];r.automatic=0;r.reason=r.holds.join('; ');"
    "if(r.eligible){const stageLimit=r.stage===3?residual():Math.min(demand[r.stage],targets[r.stage]*(1+s.tolerance/100));"
    "if(spent[r.stage]+r.cost>stageLimit+1e-9)r.reason=r.stage===3?"
    "'Budget capacity reached in '+STAGES[r.stage]:'Whole program does not fit priority budget plus tolerance';"
    "else if(automatic+r.cost>s.budget*(1+s.tolerance/100)+1e-9)r.reason='Whole program does not fit Total AOP plus tolerance';"
    "else{r.automatic=r.cost;spent[r.stage]+=r.cost;automatic+=r.cost;r.reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank;}}\n"
    "  const o=overrides[r.id];r.final=r.automatic;r.override=o||null;\n"
    "  if(o&&o.state!=='needs-review'){if(o.choice==='exclude'){r.final=0;r.reason='Manual exclusion'+(o.note?': '+o.note:'');"
    "}else if(o.choice==='include'){const amount=o.amount??r.cost;"
    "if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)throw Error(r.id+': invalid prioritised amount.');"
    "r.final=round(amount);r.reason=(r.final<r.cost?'Manual scope amount':'Manual inclusion')+(o.note?': '+o.note:'');}}\n"
    "  if(o?.state==='needs-review')r.warnings.push('Previous decision needs source review');\n"
    "  if(r.final>0&&r.holds.length)r.warnings.push('Manual evidence exception: '+r.holds.join('; '));\n"
    "  r.unfunded=r.cost===null?null:round(r.cost-r.final);"
    "r.status=r.final>0?(r.final<r.cost?'Partial scope':'Funded'):(o?.choice==='exclude'&&o.state!=='needs-review'?'Excluded':'Not funded');\n"
    " }\n"
    " const p4Available=residual();targets[3]=p4Available;\n"
    " const allocation=sum(rows,r=>r.final),requested=sum(rows,r=>r.cost),auto=sum(rows,r=>r.automatic);\n"
    " const totals={requested,allocation,automatic:auto,manual:round(allocation-auto),"
    "unfunded:sum(rows,r=>r.unfunded),available:Math.max(0,round(s.budget-allocation)),"
    "over:Math.max(0,round(allocation-s.budget)),count:rows.filter(r=>r.final>0).length,"
    "partial:rows.filter(r=>r.status==='Partial scope').length,missing:rows.filter(r=>r.cost===null).length};\n"
    " const stages=STAGES.map((name,i)=>({name,demand:demand[i],target:targets[i],"
    "automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),"
    "allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));\n"
    " const selectionAmounts=stages.map((stage,i)=>i===3?stage.allocation:stage.target),"
    "selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),"
    "displayedTotal:sum(selectionAmounts,x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10)};\n"
    " return {version:VERSION,rows,totals,stages,p4Available,selection,"
    "streams:Object.fromEntries(['ew','bu'].map(x=>[x,{requested:sum(rows.filter(r=>r.stream===x),r=>r.cost),"
    "automatic:sum(rows.filter(r=>r.stream===x),r=>r.automatic),"
    "allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};\n"
    "}"
)

patch(OLD_SOLVE, NEW_SOLVE, "solve() function (4-priority allocation)")

# ============================================================
# STEP 10: ENGINE — createSession()
# ============================================================
print("\n--- STEP 10: Update createSession ---")
# Already uses 'Optimal Segmentation' and preset 'optimal' which is fine

# ============================================================
# STEP 11: UI — Gate definitions
# ============================================================
print("\n--- STEP 11: Replace gate definitions ---")
OLD_DEFS = (
    "['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.',"
    "'Work needed to meet a legal, fiscal, regulatory or compliance obligation. Fund immediate P1 obligations, scheduled P2 obligations, then the approved exceptions.',"
    "'Explicit Sustain Engineering demand that maintains agreed platform change capacity. Small requests do not enter this stage simply because of their size.',"
    "'Continuous Improvement and Upgrades & Enhancements that maintain or improve existing services. Decommissioning is assessed in Value Based Portfolio.',"
    "'In-flight work carried into 2027. Numeric submitted benefits must meet the selected benefit-to-request threshold before funding is considered.',"
    "'Remaining demand, including decommissioning and AI unless an earlier stage applies. Use the remaining envelope and rank eligible requests by merit.']"
)
NEW_DEFS = (
    "['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.',"
    "'Legal, fiscal, regulatory and compliance obligations. P1 Immediate funded first, P2 Scheduled second, then CCB exceptions (EW-11, EW-65, EW-71). Evidence: quantified benefits, fines, disruption risks.',"
    "'2026 high-value project carry-overs with demonstrated return. Ranked by benefit/cost ratio, payback presence, consequence evidence strength, then merit. Programmes without data-backed evidence are held.',"
    "'Change and sustaining engineering: sustain demand funded first, then hygiene (continuous improvement, upgrades). Includes small modifications under 250K\\u20ac, tech debt reduction.',"
    "'Business and function new initiatives. Receives remaining capacity after P1\\u20133. Includes decommissioning, replatforming, AI enablement. Ranked by evidence strength then merit.']"
)
patch(OLD_DEFS, NEW_DEFS, "gate definitions (4 priorities)")

# Fix gate rendering: was 6 cards (gate 0 + 5 stages), now 5 cards (gate 0 + 4 priorities)
# The rendering uses: ['Evidence and decision check',...AOP.STAGES].map((x,i)=>
# Since STAGES is now 4 elements, this automatically produces 5 cards.
# But the demand/allocation reference needs fixing: was result.stages[i-1] which is fine.

# ============================================================
# STEP 12: UI — Funding bar colors
# ============================================================
print("\n--- STEP 12: Update funding bar colors ---")
# Old: 5 colors for 5 stages
patch(
    "['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0']",
    "['#00126E','#0B5ED7','#008BA3','#70ADE0']",
    "funding bar colors (4 priorities)",
    replace_all=True
)

# ============================================================
# STEP 13: UI — controls() function — lever panel
# ============================================================
print("\n--- STEP 13: Replace controls() lever panel ---")

# Use exact string from the v4.3 HTML for the levers block
OLD_LEVERS = (
    '<div class="levers">\'+'
    "AOP.STAGES.map((x,i)=>{if(i<3){const k=['lfr','sustain','hygiene'][i],v=s[k],"
    "isAmount=v.basis==='amount',value=isAmount?v.amount:v.pct,"
    "maximum=isAmount?Math.max(result.stages[i].demand,value):Math.max(100,value),"
    "step=isAmount?'0.001':'0.1',unit=isAmount?'M€':'%',label=isAmount?'allocation':'percentage';"
    "return '<article><h3>'+(i+1)+' · '+esc(x)+'</h3>"
    '<div class="basis">\'+'
    "[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M€)']].map(([b,label])=>"
    "'<button data-basis=\"'+k+'\" data-value=\"'+b+'\" class=\"'+(v.basis===b?'active':'')+'\"'+disabled+'>'+label+'</button>').join('')+"
    "'</div>"
    "<input aria-label=\"'+esc(x)+' '+label+'\" data-lever=\"'+k+'\" type=\"range\" min=\"0\" max=\"'+maximum+'\" step=\"'+step+'\" value=\"'+value+'\"'+disabled+'>"
    "<label><input aria-label=\"'+esc(x)+' '+label+' value\" data-lever=\"'+k+'\" type=\"number\" min=\"0\" max=\"'+maximum+'\" step=\"'+step+'\" value=\"'+dec(value)+'\"'+disabled+'> '+unit+'</label>"
    "'+allocationSelection(result.stages[i].target,result.stages[i].demand)+'</article>';"
    "}return i===3?"
    "'<article><h3>4 · Carryover</h3><p>Minimum benefit / request</p>"
    "<input id=\"carry\" aria-label=\"Carryover threshold\" type=\"range\" min=\"0\" max=\"5\" step=\"0.5\" value=\"'+s.carry+'\"'+disabled+'>"
    "<span class=\"threshold-value\">'+dec(s.carry)+'x'+(s.carry===5?'+':'')+'</span>"
    "'+allocationSelection(result.stages[3].allocation,result.stages[3].demand)+'</article>':"
    "'<article><h3>5 · Value Based Portfolio</h3><p>Allocation from remaining AOP (M€)</p>"
    "<input id=\"value-allocation\" aria-label=\"Value Based Portfolio allocation\" type=\"range\" min=\"0\" max=\"'+result.valueAvailable+'\" step=\"any\" value=\"'+result.stages[4].target+'\"'+disabled+'>"
    "'+allocationSelection(result.stages[4].target,result.valueAvailable,'out of')+'</article>';"
    "}).join('')+'</div>"
)

NEW_LEVERS = (
    '<div class="levers" style="grid-template-columns:repeat(4,minmax(0,1fr))">\'+'
    "AOP.STAGES.map((x,i)=>{"
    "if(i<3){"
    "const k=['p1','p2','p3'][i],v=s[k];"
    "return '<article><h3>'+(i+1)+' · '+esc(x)+'</h3>"
    "<p>Directional budget (M€)</p>"
    "<input aria-label=\"'+esc(x)+' budget\" data-lever=\"'+k+'\" type=\"range\" min=\"0\" max=\"'+Math.max(s.budget,v)+'\" step=\"0.1\" value=\"'+v+'\"'+disabled+'>"
    "<label><input aria-label=\"'+esc(x)+' budget value\" data-lever=\"'+k+'\" type=\"number\" min=\"0\" max=\"'+s.budget+'\" step=\"0.1\" value=\"'+dec(v)+'\"'+disabled+'> M€</label>"
    "'+allocationSelection(result.stages[i].target,result.stages[i].demand)+'</article>';}"
    "return '<article><h3>4 · '+esc(x)+'</h3>"
    "<p>Automatic residual allocation</p>"
    "<span class=\"threshold-value\" style=\"font-size:19px;color:var(--blue)\">'+dec(Math.max(0,s.budget-s.p1-s.p2-s.p3))+' M€</span>"
    "'+allocationSelection(result.stages[3].target,result.stages[3].demand,'out of')+'</article>';"
    "}).join('')+'</div>"
)

patch(OLD_LEVERS, NEW_LEVERS, "levers panel (4 directional budget levers)")

# ============================================================
# STEP 14: UI — controls() basis switcher event handlers
# ============================================================
print("\n--- STEP 14: Update lever event handlers ---")

# Replace basis switcher click handler (no longer needed — directional budgets only)
patch(
    "else if(b.dataset.basis){const s=AOP.switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[['lfr','sustain','hygiene'].indexOf(b.dataset.basis)].demand);commit('setting',{settings:s});}",
    "",
    "remove basis switcher handler"
)

# Replace lever input handler — old reads pct/amount from complex object, new sets simple number
patch(
    "if(x.dataset.lever||['budget','carry','merit','tolerance'].includes(x.id)){if(x.value==='')throw Error('Enter a numeric setting.');const s=AOP.clone(session.settings);if(x.dataset.lever)s[x.dataset.lever][s[x.dataset.lever].basis==='amount'?'amount':'pct']=Number(x.value);else s[x.id]=Number(x.value);commit('setting',{settings:s}",
    "if(x.dataset.lever||['budget','merit','tolerance'].includes(x.id)){if(x.value==='')throw Error('Enter a numeric setting.');const s=AOP.clone(session.settings);if(x.dataset.lever)s[x.dataset.lever]=Number(x.value);else s[x.id]=Number(x.value);commit('setting',{settings:s}",
    "lever input handler (simple M€ assignment)"
)

# Remove value-allocation input preview handler
patch(
    "if(e.target.id==='value-allocation')e.target.nextElementSibling.querySelector('.selected-amount').textContent=money(Number(e.target.value));",
    "",
    "remove value-allocation input handler"
)

# ============================================================
# STEP 15: UI — Scenario comparison table
# ============================================================
print("\n--- STEP 15: Update scenario comparison table ---")
OLD_COMPARISON = (
    "[['optimal','Optimal Segmentation · Recommended','Legal 44.0%, Sustain 100.0% of bucket; Hygiene 7.6 M€ (7.6% at 100 M€ AOP); Carryover 0.0x; Value uses full remaining AOP; tolerance 0.0%.'],"
    "['protect','Protect commitments','Legal 100.0%, Sustain 100.0% of bucket; Hygiene 10.0% of Total AOP; Carryover 2.0x.'],"
    "['evidence','Tighten carryover evidence','Same reservations; Carryover requires 3.0x.'],"
    "['capacity','Release sustain capacity','Same as Protect commitments; Sustain coverage reduced to 75.0%.']]"
)
NEW_COMPARISON = (
    "[['optimal','Optimal Segmentation · Recommended','P1 LFR 15 M€, P2 Carry-Overs 50 M€, P3 Sustain+Hygiene 20 M€, P4 Value 15 M€. Finance-recommended 100M spread.'],"
    "['protect','Protect Commitments','P1 LFR 20 M€, P2 Carry-Overs 50 M€, P3 23 M€, P4 7 M€. Maximise LFR and carry-over coverage.'],"
    "['evidence','Tighten Carryover Evidence','P1 LFR 15 M€, P2 Carry-Overs 40 M€, P3 20 M€, P4 25 M€. Redirect from carry-overs to new value.'],"
    "['capacity','Release Sustain Capacity','P1 LFR 15 M€, P2 Carry-Overs 58 M€, P3 12 M€, P4 15 M€. Reduce sustain, give more to carry-overs.']]"
)
patch(OLD_COMPARISON, NEW_COMPARISON, "scenario comparison table (4-priority)")

# ============================================================
# STEP 16: UI — Preset button labels
# ============================================================
print("\n--- STEP 16: Update preset button labels ---")
patch(
    "['optimal','Optimal Segmentation · Recommended'],['protect','Protect commitments'],['evidence','Tighten carryover evidence'],['capacity','Release sustain capacity']",
    "['optimal','Optimal Segmentation · Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']",
    "preset button labels"
)

# ============================================================
# STEP 17: UI — Priority filter values
# ============================================================
print("\n--- STEP 17: Update priority filter references ---")
# The priorityFilters function builds filter options from stageName values
# Since STAGES changed, the stageName values update automatically.
# No change needed — the filter reads from result.rows[].stageName which comes from STAGES[st].

# ============================================================
# STEP 18: UI — Fund bar reconciliation
# ============================================================
print("\n--- STEP 18: Update reconciliation table ---")
# The reconciliation function already iterates result.stages which will now have 4 entries.
# No structural change needed.

# ============================================================
# STEP 19: UI — allocationKpi and valueAvailable references
# ============================================================
print("\n--- STEP 19: Update valueAvailable → p4Available ---")
patch("result.valueAvailable", "result.p4Available", "valueAvailable → p4Available", replace_all=True)

# ============================================================
# STEP 20: IndexedDB version
# ============================================================
print("\n--- STEP 20: Update IndexedDB version ---")
patch("Philips-AOP2027-v4.3", "Philips-AOP2027-v4.4", "IndexedDB version")

# ============================================================
# STEP 21: Title version tag
# ============================================================
print("\n--- STEP 21: Update version references ---")
patch(
    "AOP 2027 | Philips IT One Portfolio Dashboard",
    "AOP 2027 | Philips IT One Portfolio Dashboard v4.4",
    "page title"
)

# ============================================================
# STEP 22: Fix transact() preset handler
# ============================================================
print("\n--- STEP 22: Fix transact preset handler ---")
# Update preset name mapping in transact
patch(
    "{optimal:'Optimal Segmentation',protect:'Protect commitments',evidence:'Tighten carryover evidence',capacity:'Release sustain capacity'}",
    "{optimal:'Optimal Segmentation',protect:'Protect Commitments',evidence:'Tighten Carryover Evidence',capacity:'Release Sustain Capacity'}",
    "transact preset name mapping"
)

# ============================================================
# STEP 23: Fix the scenario tab's merit score panel gate count
# ============================================================
print("\n--- STEP 23: Update allocation rules text ---")
# Update the embedded rules text to reflect four-priority structure
patch(
    "Funding order is Legal and Compliance, Sustain Engineering, Hygiene, Carryover, then Value Based Portfolio.",
    "Funding order is P1 Legal, Fiscal & Regulatory, P2 High-Value Carry-Overs, P3 Change & Sustaining Engineering, then P4 Business & Function New Initiatives.",
    "rules text (4-priority funding order)"
)

# Update demand type display label in table rows
patch(
    "r.newCarry==='Change & Sustain'?'Sustain Engineering':r.newCarry||'Not supplied'",
    "r.newCarry==='Change & Sustain'?'Change & Sustaining':r.newCarry||'Not supplied'",
    "demand type label (Sustain Engineering → Change & Sustaining)"
)

# ============================================================
# STEP 24: Fix stream() KPI and chart for EW/BU tabs
# ============================================================
print("\n--- STEP 24: Fix stream tab references ---")
# Fix reconciliation table references to old stage indices
# The reconciliation() uses result.stages which now has 4 entries — stage[4] no longer exists.
# Fix: 'Value remaining envelope' row references result.valueAvailable which is now result.p4Available
# Already patched by step 19. Let me verify the reconciliation references.
# These patches reference result.valueAvailable which gets replaced to result.p4Available in step 19.
# So we need to search for the already-transformed strings.
patch(
    "['Value remaining envelope',result.p4Available,up(result.p4Available)],['Value selected allocation',result.stages[4].target,up(result.stages[4].target)]",
    "['P4 remaining capacity',result.p4Available,up(result.p4Available)],['P4 allocation',result.stages[3].target,up(result.stages[3].target)]",
    "reconciliation table (stage 4 → stage 3)"
)

# Fix stage slice — was .slice(0,3) which showed first 3 stages; now show all 4
# Actually slice(0,3) would show stages 0,1,2 and miss stage 3.
# But the reconciliation already has P4 shown separately above. Let's fix the slice to show all 4.
patch(
    "...result.stages.slice(0,3).map(x=>['Stage selected target: '+x.name,x.target,up(x.target)])",
    "...result.stages.slice(0,3).map(x=>['Priority target: '+x.name,x.target,up(x.target)])",
    "reconciliation: rename Stage → Priority"
)

# Remove the value-allocation slider handler and valueCap logic
# This is the first if in a try block, so removing it means converting the next `else if` to `if`
patch(
    "if(x.id==='value-allocation'){const s=AOP.clone(session.settings),amount=Number(x.value);s.valueCap=amount>=result.p4Available-1e-9?null:amount;commit('setting',{settings:s});}else if(x.dataset.lever",
    "if(x.dataset.lever",
    "remove value-allocation handler and fix else-if chain"
)

# ============================================================
# WRITE OUTPUT
# ============================================================
print("\n--- Writing output ---")
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"  Output: {OUT}")
print(f"  File size: {len(html)} chars ({len(html)//1024} KB)")
print("\nDone! v4.4 build complete.")
