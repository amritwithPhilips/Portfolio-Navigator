"""Fix remaining v4.5 patches."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'

with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"File: {len(html)} chars")

applied = 0

def patch(old, new, label):
    global html, applied
    if old in html:
        html = html.replace(old, new, 1)
        applied += 1
        print(f"  [OK] {label}")
    else:
        print(f"  [FAIL] {label}")

# FIX A: Lever handler — old object-based assignment → simple number
print("\n--- Lever handler ---")
patch(
    "if(x.dataset.lever)s[x.dataset.lever][s[x.dataset.lever].basis==='amount'?'amount':'pct']=Number(x.value);else s[x.id]=Number(x.value);",
    "if(x.dataset.lever)s[x.dataset.lever]=Number(x.value);else s[x.id]=Number(x.value);",
    "Lever handler — simple M\u20ac assignment"
)

# FIX B: Gates div — add 5-column grid
print("\n--- Gates grid ---")
patch(
    '<div class="gates">',
    '<div class="gates" style="grid-template-columns:repeat(5,minmax(0,1fr))">',
    "Gates 5-column grid"
)

# FIX C: Levers grid — already patched to 4 columns in controls()
# But the CSS still has grid-template-columns:repeat(5,...) for .levers
# The controls() replacement already sets inline style, but let's also update CSS
print("\n--- Levers CSS ---")
patch(
    ".levers{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))",
    ".levers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))",
    "Levers CSS 5→4 columns"
)

# FIX D: Gates CSS — update from 6 to 5 columns
print("\n--- Gates CSS ---")
patch(
    ".gates{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))",
    ".gates{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))",
    "Gates CSS 6→5 columns"
)

# FIX E: Basis button click handler — make it no-op for missing basis buttons
print("\n--- Basis handler ---")
# The old handler looks for data-basis clicks and calls AOP.switchBasis
# Since switchBasis is now a no-op and controls() no longer renders basis buttons,
# this handler won't fire. But let's clean it up.
if "data-basis" in html and "switchBasis" in html:
    # The basis handler is in the click event delegation
    print("  [INFO] data-basis and switchBasis still referenced — no basis buttons rendered so harmless")

# FIX F: reconciliation function references "five controls"
print("\n--- Reconciliation ---")
# Already fixed in fix_v45.py, but double-check
if "five controls" in html:
    patch("five controls", "four priority levers", "Reconciliation five→four controls")
if "five stages" in html:
    patch("five stages", "four priorities", "Reconciliation five stages→four priorities")

# FIX G: Funding stage text in reconciliation table header
print("\n--- Reconciliation header ---")
patch(
    "Funding stage",
    "Priority",
    "Reconciliation table header"
)

# FIX H: Value-allocation handler that was disabled — remove dead code reference
print("\n--- Value-allocation ---")
# The old code has s.valueCap handling; since we removed valueCap from settings,
# we need to remove that handler too
if "s.valueCap=" in html:
    # Find and neutralize the valueCap handler
    patch(
        "s.valueCap=amount>=result.valueAvailable-1e-9?null:amount;",
        "/* valueCap removed in v4.5 */",
        "Remove valueCap handler"
    )

# FIX I: The 'carry' id handler conflict
# Old code: id==='carry' sets s.carry as a threshold value
# New code: data-lever="carry" sets s.carry as M€ budget
# The old carry handler was already in the combined lever handler
# Check if carry is still handled as id
print("\n--- Carry handler ---")
if "['budget','carry','merit','tolerance']" in html:
    # The combined handler treats carry as s.carry = Number(x.value)
    # which is correct for the new M€ meaning
    # But we should remove 'carry' from the id list since it's now a data-lever
    patch(
        "['budget','carry','merit','tolerance']",
        "['budget','merit','tolerance']",
        "Remove carry from id-based handler (now data-lever)"
    )

# FIX J: Score framework text
print("\n--- Score text ---")
# The score framework section is in the scenario() function
# Search for it
import re
m = re.search(r"weighted.*normalised.*100", html)
if m:
    context = html[m.start():m.start()+100]
    print(f"  [INFO] Score text found: {context[:80]}")
    patch(context[:m.end()-m.start()], "weighted to 100, applied uniformly across all four priority stages", "Score framework text")
else:
    # Try alternate
    m2 = re.search(r"(scored|scoring|components).*?(weighted|weight).*?100", html, re.IGNORECASE)
    if m2:
        print(f"  [INFO] Alternate: {html[m2.start():m2.start()+100]}")
    else:
        print("  [INFO] Score text not found — may be in minified format")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nApplied: {applied}")
print(f"Written: {PATH} ({len(html)} chars)")
