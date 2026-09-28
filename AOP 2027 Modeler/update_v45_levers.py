"""Update v4.5: restore v4.3-style lever basis toggles, RoI carry slider, refined optimal scenario."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"Read: {len(html)} chars")

ok = 0
fail = 0
def patch(old, new, label, count=1):
    global html, ok, fail
    if old in html:
        html = html.replace(old, new, count)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ============================================================
# 1. defaults() — back to object-based levers
# ============================================================
print("\n=== 1. defaults ===")
patch(
    "const defaults=()=>({budget:100,tolerance:5,lfr:35,carry:50,sustain:20,merit:45,weights:[50,25,15,10]});",
    "const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},carry:0,sustain:{basis:'bucket',pct:100},value:{basis:'bucket',pct:100},merit:45,weights:[50,25,15,10]});",
    "defaults — object levers + carry threshold"
)

# ============================================================
# 2. preset()
# ============================================================
print("\n=== 2. preset ===")
patch(
    "function preset(name){const s=defaults();if(name==='optimal'){s.lfr=35;s.carry=50;s.sustain=15;}if(name==='protect'){s.lfr=35;s.carry=50;s.sustain=15;}if(name==='evidence'){s.lfr=35;s.carry=40;s.sustain=20;}if(name==='capacity'){s.lfr=35;s.carry=58;s.sustain=7;}return s;}",
    "function preset(name){const s=defaults();if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s.carry=0;s.sustain={basis:'bucket',pct:100};s.value={basis:'bucket',pct:100};}if(name==='protect'){s.lfr={basis:'bucket',pct:100};s.carry=2;s.sustain={basis:'bucket',pct:100};s.value={basis:'aop',pct:10};}if(name==='evidence'){s.lfr={basis:'bucket',pct:100};s.carry=3;s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:15};}if(name==='capacity'){s.lfr={basis:'bucket',pct:44};s.carry=0;s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:20};}return s;}",
    "preset — all four presets with basis+carry"
)

# ============================================================
# 3. validateSettings()
# ============================================================
print("\n=== 3. validateSettings ===")
patch(
    "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','carry','sustain'])if(!Number.isFinite(s[n])||s[n]<0)throw Error(n+' must be a nonnegative M\u20ac amount.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0\u2013100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}",
    "function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','sustain','value'])if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))throw Error(n+' coverage invalid.');for(const n of ['lfr','sustain','value'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error(n+' allocation must be nonnegative.');if(!Number.isFinite(s.carry)||s.carry<0||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carryover RoI threshold must be 0.0\u20135.0x in 0.5x steps.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0\u2013100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}",
    "validateSettings — object levers + carry threshold"
)

# ============================================================
# 4. leverTarget() — back to basis/pct/amount
# ============================================================
print("\n=== 4. leverTarget ===")
patch(
    "function leverTarget(s,k,demand){return Math.min(demand,s[k]);}",
    "function leverTarget(s,k,demand){const v=s[k];return Math.min(demand,v.basis==='amount'?v.amount:(v.basis==='bucket'?demand:s.budget)*v.pct/100);}",
    "leverTarget — basis/pct/amount"
)

# ============================================================
# 5. solve() — targets for 4 stages
# ============================================================
print("\n=== 5. solve targets ===")
patch(
    " const targets=demand.map((v,i)=>i<3?leverTarget(s,['lfr','carry','sustain'][i],v):null),spent=[0,0,0,0],rank=[0,0,0,0];let automatic=0;",
    " const targets=[leverTarget(s,'lfr',demand[0]),null,leverTarget(s,'sustain',demand[2]),leverTarget(s,'value',demand[3])],spent=[0,0,0,0],rank=[0,0,0,0];let automatic=0;",
    "solve — P1/P3/P4 lever targets, P2 null"
)

# ============================================================
# 6. enrich() — P2 carry RoI threshold hold
# ============================================================
print("\n=== 6. enrich P2 holds ===")
# Replace the current P2 holds (baselined check) to add RoI threshold
patch(
    "if(st===0&&!['EW-11','EW-65','EW-71'].includes(r.item)&&(!r.lfrName||!r.lfrYear))holds.push('LFR missing compliance name or year \u2014 held for explicit review');if(st===1&&!r.baselined)holds.push('Carry-over without baselined business case \u2014 held for explicit review');if(st===1&&r.baselined>0&&!['must do','must have'].includes(key(r.priority)))holds.push('Carry-over not Must Do/Must Have \u2014 moved to P4');",
    "if(st===0&&!['EW-11','EW-65','EW-71'].includes(r.item)&&(!r.lfrName||!r.lfrYear))holds.push('LFR missing compliance name or year \u2014 held for explicit review');if(st===1&&!r.baselined)holds.push('Carry-over without baselined business case \u2014 held for explicit review');if(st===1&&r.baselined>0&&!['must do','must have'].includes(key(r.priority)))holds.push('Carry-over not Must Do/Must Have \u2014 moved to P4');if(st===1&&s.carry>0&&ratio!==null&&ratio<s.carry)holds.push('Below Carry-over '+s.carry.toFixed(1)+'x RoI threshold');",
    "enrich — add RoI threshold hold"
)

# ============================================================
# 7. switchBasis() — restore
# ============================================================
print("\n=== 7. switchBasis ===")
patch(
    "function switchBasis(){}",
    "function switchBasis(s,k,basis,demand){if(!['lfr','sustain','value'].includes(k)||!['bucket','aop','amount'].includes(basis))throw Error('Unknown allocation control.');const next=clone(s),amount=leverTarget(s,k,demand);next[k]={basis,pct:basis==='amount'?next[k].pct:(basis==='bucket'?demand>0?amount/demand*100:0:s.budget>0?amount/s.budget*100:0),amount};return next;}",
    "switchBasis — restore"
)

# ============================================================
# 8. Lever handler — back to object .pct/.amount
# ============================================================
print("\n=== 8. lever handler ===")
patch(
    "if(x.dataset.lever)s[x.dataset.lever]=Number(x.value);else s[x.id]=Number(x.value);",
    "if(x.dataset.lever){const k=x.dataset.lever;if(k==='carry'){s.carry=Number(x.value);}else{s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}}else s[x.id]=Number(x.value);",
    "lever handler — object pct/amount + carry"
)

# ============================================================
# 9. controls() — complete replacement with v4.3-style
# ============================================================
print("\n=== 9. controls ===")

ctrl_start = html.find("function controls(){")
ctrl_end = html.find("\nfunction filters(", ctrl_start)
if ctrl_end < 0: ctrl_end = html.find("function filters(", ctrl_start)

if ctrl_start >= 0 and ctrl_end > ctrl_start:
    NEW_CTRL = r"""function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M€) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation · Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'</div><p class="muted">Scenario type: <strong>'+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default (Vanilla)')+'</strong>. The 100 M€ starting envelope is illustrative. Presets retain the entered Total AOP.</p><div class="levers">'+[['1 · Legal and Compliance (Must Do)','lfr',0],['3 · Sustain Engineering and Hygiene','sustain',2],['4 · Value Based Portfolio','value',3]].map(([title,k,si])=>{const v=s[k],isAmt=v.basis==='amount',val=isAmt?(v.amount||0):v.pct,max=isAmt?Math.max(result.stages[si].demand,val):Math.max(100,val),step=isAmt?'0.001':'0.1',unit=isAmt?'M€':'%',label=isAmt?'allocation':'percentage';return '<article><h3>'+esc(title)+'</h3><div class="basis">'+[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M€)']].map(([b,bl])=>'<button data-basis="'+k+'" data-value="'+b+'" class="'+(v.basis===b?'active':'')+'"'+disabled+'>'+bl+'</button>').join('')+'</div><input aria-label="'+esc(title)+' '+label+'" data-lever="'+k+'" type="range" min="0" max="'+max+'" step="'+step+'" value="'+val+'"'+disabled+'><label><input aria-label="'+esc(title)+' '+label+' value" data-lever="'+k+'" type="number" min="0" max="'+max+'" step="'+step+'" value="'+dec(val)+'"'+disabled+'> '+unit+'</label>'+allocationSelection(result.stages[si].target,result.stages[si].demand)+'</article>';}).join('<article><h3>2 · High-Value Carry-Overs</h3><p>Minimum benefit / request (RoI)</p><input id="carry" aria-label="Carryover RoI threshold" type="range" min="0" max="5" step="0.5" value="'+s.carry+'"'+disabled+'><span class="threshold-value">'+dec(s.carry)+'x'+(s.carry>=5?'+':'')+'</span>'+allocationSelection(result.stages[1].allocation,result.stages[1].demand)+'</article>')+'</div><details class="advanced"><summary>Additional configuration · merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Captured Consequence','Decision Band'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div><p>Weights must total 100.0. Automatic funding selects whole programs in order, within a maximum 5.0% portfolio tolerance.</p></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Carry RoI</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','100% bucket','0x','100% bucket','100% bucket'],['protect','Protect Commitments','100% bucket','2.0x','100% bucket','10% AOP'],['evidence','Tighten Carryover','100% bucket','3.0x','75% bucket','15% AOP'],['capacity','Release Sustain','44% bucket','0x','75% bucket','20% AOP']].map(([k,n,p1,p2,p3,p4])=>{const setting=AOP.preset(k);setting.budget=s.budget;const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+'</td><td>'+p2+'</td><td>'+p3+'</td><td>'+p4+'</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table></details><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="export-inclusions">Export inclusions · Excel</button><button id="export-full">Export full · Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' · r'+x.revision+' · '+x.status+'</button>').join('')+'</div></section>';}
"""
    html = html[:ctrl_start] + NEW_CTRL.strip() + "\n" + html[ctrl_end:]
    ok += 1; print("  [OK] controls — complete replacement with basis toggles + RoI slider")
else:
    fail += 1; print(f"  [FAIL] controls — start={ctrl_start} end={ctrl_end}")

# ============================================================
# 10. Basis button click handler — restore
# ============================================================
print("\n=== 10. basis handler ===")
# The basis click handler calls AOP.switchBasis — it should work now
# Check if data-basis handler exists
if "e.target.dataset.basis" in html or "dataset.basis" in html:
    print("  [INFO] data-basis handler exists")
else:
    print("  [INFO] Need to check basis handler")

# ============================================================
# 11. LFR + Carryover breakdown sections — minimize + remove Status
# ============================================================
print("\n=== 11. Minimize breakdown sections ===")
# Wrap LFR breakdown in collapsed <details>
patch(
    "'<section class=\"panel\"><h2>P1: LFR Demand Breakdown</h2>'",
    "'<details class=\"section-panel panel\"><summary>P1: Legal and Compliance (Must Do) — Demand Breakdown</summary>'",
    "LFR section → collapsed details"
)
# Close with </details> instead of </section>
# Find the end of the LFR section (before P2 carryover)
patch(
    "+'</section>'+'<section class=\"panel\"><h2>P2: True Carryover Baseline View</h2>'",
    "+'</details>'+'<details class=\"section-panel panel\"><summary>P2: High-Value Carry-Overs — Baseline View</summary>'",
    "LFR close + Carryover section → collapsed details"
)
# Close carryover section
patch(
    "+'</section>'+'<section class=\"panel\"><h2>Funding Prioritization Gate</h2>",
    "+'</details>'+'<section class=\"panel\"><h2>Funding Prioritization Gate</h2>",
    "Carryover close → </details>"
)

# Remove Status column from LFR table
patch(
    "<th style=\"background:var(--dk);color:white;padding:10px 14px;text-align:left\">Status</th>",
    "",
    "Remove Status header from LFR table",
    2  # Both LFR and Carryover tables
)

# Remove Status cells from LFR table — funded badges
for badge_text in ['Funded first', 'Funded second', 'Funded third', 'Needs evidence', 'Data-backed', 'Needs business case', 'Reclassified']:
    old_cell = "<span class=\\\"badge green\\\">"+badge_text+"</span>"
    if old_cell in html:
        pass  # These are inside larger td elements, need different approach

# Actually, let's remove the Status td cells more precisely
# They all have the pattern: <td ...><span class="badge ...">text</span></td>
import re
# Remove status TDs from the breakdown tables (last column in each row)
# The pattern is: </td><td style="padding:10px 14px;border-bottom:1px solid var(--mist)"><span class="badge ...
status_pattern = r"""<td style=\\"padding:10px 14px;border-bottom:1px solid var\(--mist\)\\"><span class=\\"badge (green|amber|red)\\">[^<]+</span></td>"""
count_before = len(re.findall(status_pattern, html))
html = re.sub(status_pattern, '', html)
if count_before > 0:
    ok += 1; print(f"  [OK] Removed {count_before} status badge cells")

# Also remove empty status td in total rows
patch(
    "<td></td></tr></tbody></table>';}()+'</details>'+'<details",
    "</tr></tbody></table>';}()+'</details>'+'<details",
    "Remove trailing empty td in LFR total"
)

# ============================================================
# 12. Levers CSS — back to 5 columns for 5 lever articles
# ============================================================
print("\n=== 12. Levers CSS ===")
patch(
    ".levers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
    ".levers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))",
    "Levers CSS → 5 columns"
)

# ============================================================
# 13. Carry id handler — ensure it works
# ============================================================
print("\n=== 13. carry handler ===")
# The carry input has id="carry" and should be handled by the id-based handler
# We removed 'carry' from the id list earlier. Restore it.
patch(
    "['budget','merit','tolerance']",
    "['budget','carry','merit','tolerance']",
    "Restore carry in id-based handler"
)

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}")
print(f"Failed:  {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {PATH} ({len(html)} chars)")
