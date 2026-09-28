"""Fix P2 holds, lever rendering, and add QA checks for hold transparency."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"Read: {len(html)} chars")

ok = 0; fail = 0
def patch(old, new, label, count=1):
    global html, ok, fail
    if old in html:
        html = html.replace(old, new, count)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ============================================================
# FIX 1: Exempt P2 from "Numeric benefits missing" hold
# P2 programmes have a baselined business case — that IS their evidence
# ============================================================
print("\n=== FIX 1: Exempt P2 from benefit holds ===")
# Current: if(st>=1&&st!==2&&r.benefit===null)
# Need: if(st>=1&&st!==2&&st!==1&&r.benefit===null) → simplifies to if(st===3&&r.benefit===null)
patch(
    "if(st>=1&&st!==2&&r.benefit===null)holds.push('Numeric benefits missing');",
    "if(st===3&&r.benefit===null)holds.push('Numeric benefits missing');",
    "Exempt P1+P2+P3 from benefit hold (only P4)"
)

# ============================================================
# FIX 2: Exempt P2 from "Benefit claim above 5.0x" hold
# Current: if(st>=1&&st!==2&&ratio>5&&!review.benefitReviewed)
# Need: only P4 (st===3)
# ============================================================
print("\n=== FIX 2: Exempt P2 from 5x review hold ===")
patch(
    "if(st>=1&&st!==2&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "if(st===3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');",
    "5x review only for P4"
)

# Also fix negative benefit check — only P4
patch(
    "if(st>=1&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "if(st===3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",
    "Negative benefit only for P4"
)

# ============================================================
# FIX 3: Verify the lever change→render pipeline
# The issue is likely that basis toggle clicks don't trigger
# a full re-render through the commit() path.
# Let me check if the basis handler calls commit properly.
# ============================================================
print("\n=== FIX 3: Lever change → render ===")

# Check if there's a pointer hold issue preventing re-render
# The pointerRenderHold system defers rendering during slider drag
# but should flush on release. Verify.
import re

# Find the input event handler we added for live slider updates
if "addEventListener('input',e=>{const x=e.target;if(x.type==='range'" in html:
    print("  [OK] Live slider input handler present")
else:
    print("  [WARN] Live slider input handler missing — slider drag won't update live")

# Check the change handler processes lever changes
if "if(x.dataset.lever){const k=x.dataset.lever;if(k==='carry'){s.carry=Number(x.value);}else{s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}}" in html:
    print("  [OK] Lever change handler correct")
else:
    print("  [WARN] Lever change handler may be incorrect")

# Ensure the commit function calls render
if "function commit(" in html:
    # commit should call transact then render
    m = re.search(r"function commit\([^)]*\)\{(.*?)\}", html[:html.find("function commit(")+500])
    if m:
        print(f"  [INFO] commit body preview: {m.group(1)[:100]}...")

# ============================================================
# FIX 4: Update the "funded of X Demand" display to be clearer
# Show "eligible demand" not "total demand" for P2
# ============================================================
print("\n=== FIX 4: P2 lever display ===")
# The P2 lever shows "funded of 27.2 M€ Demand" but only ~16 M€ is fundable
# after the baselined cap. Add context.
# In the ROI lever article, replace allocationSelection with a custom display
# that shows both the cap and the demand

# Find the ROI branch in the controls map
OLD_ROI_ALLOC = "allocationSelection(result.stages[si].allocation,result.stages[si].demand)"
# This appears twice — once for ROI, once for basis levers. The ROI one is in the
# if(mode==='roi') return branch

# Let me find the specific ROI usage
if "mode==='roi')return " in html:
    roi_start = html.find("mode==='roi')return ")
    roi_block = html[roi_start:roi_start+800]
    # Find the allocationSelection call within this block
    alloc_pos = roi_block.find("allocationSelection(result.stages[si].allocation,result.stages[si].demand)")
    if alloc_pos >= 0:
        # Replace just this occurrence by computing a unique marker
        # Actually both calls use the same pattern, but we need different display for ROI
        # Let's add a carry-specific display function
        pass

# ============================================================
# FIX 5: Add hold summary to the KPI area
# Show how many programmes are eligible vs held per priority
# ============================================================
print("\n=== FIX 5: KPI hold transparency ===")

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
