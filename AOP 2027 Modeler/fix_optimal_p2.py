"""Fix P2 demand display and Optimal preset to fill 100M envelope."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"Read: {len(html)} chars")

ok = 0; fail = 0
def P(old, new, label):
    global html, ok, fail
    if old in html:
        html = html.replace(old, new, 1)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ============================================================
# FIX 1: P2 demand should show FUNDABLE demand (sum of caps), not raw requested
# ============================================================
print("\n=== FIX 1: P2 fundable demand ===")
# In solve(), compute a fundableDemand for P2 that sums the capped amounts
# Add it to the stage result so the UI can use it

# Add fundableDemand to the stages output
P("const stages=STAGES.map((name,i)=>({name,demand:demand[i],target:targets[i],automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));",
  "const stages=STAGES.map((name,i)=>({name,demand:demand[i],fundableDemand:i===1?sum(rows.filter(r=>r.stage===1),r=>r.carryFundCap||r.cost):demand[i],target:targets[i],automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));",
  "solve — add fundableDemand for P2")

# Now update allocationSelection to use fundableDemand where available
P("function allocationSelection(funded,demand){return '<div class=\"allocation-selection\" style=\"white-space:nowrap;font-size:13px;line-height:1.5;margin-top:6px\"><strong class=\"selected-amount\" style=\"color:var(--prot)\">'+money(funded)+'</strong> funded of '+money(demand)+' Demand</div>';}",
  "function allocationSelection(funded,demand,fundable){return '<div class=\"allocation-selection\" style=\"white-space:nowrap;font-size:13px;line-height:1.5;margin-top:6px\"><strong class=\"selected-amount\" style=\"color:var(--prot)\">'+money(funded)+'</strong> funded of '+money(fundable!==undefined?fundable:demand)+' Demand</div>';}",
  "allocationSelection — optional fundable param")

# Update the P2 (ROI) lever to pass fundableDemand
P("allocationSelection(result.stages[si].allocation,result.stages[si].demand)+'</article>';const v=s[k]",
  "allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>';const v=s[k]",
  "P2 lever — show fundable demand")

# Also update the basis-toggle levers to pass fundableDemand
P("allocationSelection(result.stages[si].allocation,result.stages[si].demand)+'</article>';}).join('')",
  "allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>';}).join('')",
  "Basis levers — show fundable demand")

# ============================================================
# FIX 2: Optimal preset = 100% LFR + 100% carry + 20M sustain + rest value
# ============================================================
print("\n=== FIX 2: Optimal preset = fill 100M ===")
P("if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s.carry=0;s.sustain={basis:'bucket',pct:100};s.value={basis:'bucket',pct:100};}",
  "if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s.carry=0;s.sustain={basis:'amount',pct:100,amount:20};s.value={basis:'bucket',pct:100};}",
  "Optimal — P3 at 20M allocation, P4 gets rest")

# ============================================================
# FIX 3: Gate cards — show fundable demand for P2
# ============================================================
print("\n=== FIX 3: Gate card P2 demand ===")
P("(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Target '+money(result.stages[i-1].target)+'<br><strong>Allocated '+money(result.stages[i-1].allocation)+'</strong></small>':'')",
  "(i?'<small>Demand '+money(result.stages[i-1].fundableDemand||result.stages[i-1].demand)+'<br>Target '+money(result.stages[i-1].target)+'<br><strong>Allocated '+money(result.stages[i-1].allocation)+'</strong></small>':'')",
  "Gate cards — P2 shows fundable demand")

# ============================================================
# WRITE
# ============================================================
print(f"\nApplied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
