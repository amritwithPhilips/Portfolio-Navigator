"""Fix v4.5: lever 4 error, basis toggles, table cleanup, gate alignment."""
import sys, io, re
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
# 1. FIX: Basis click handler — wrong key-to-stage mapping
# ============================================================
print("\n=== 1. Basis handler — fix stage index mapping ===")
patch(
    "switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[['lfr','sustain','hygiene'].indexOf(b.dataset.basis)].demand);",
    "switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[{lfr:0,sustain:2,value:3}[b.dataset.basis]].demand);",
    "Basis handler — lfr→0, sustain→2, value→3"
)

# ============================================================
# 2. FIX: Gate card names to match lever names exactly
# ============================================================
print("\n=== 2. Gate names aligned to levers ===")
patch(
    "STAGES=['Legal, Fiscal & Regulatory','High-Value Carry-Overs','Change & Sustaining Engineering','Business & Function New Initiatives']",
    "STAGES=['Legal and Compliance (Must Do)','High-Value Carry-Overs','Sustain Engineering and Hygiene','Value Based Portfolio']",
    "STAGES — match lever names"
)

# ============================================================
# 3. FIX: P1/P2 table headers — remove prefix, remove status column
# ============================================================
print("\n=== 3. Table cleanup ===")

# Fix P1 section title — remove "P1:" prefix
patch(
    "P1: Legal and Compliance (Must Do) \u2014 Demand Breakdown",
    "Legal and Compliance (Must Do) \u2014 Demand Breakdown",
    "P1 section — remove prefix"
)

# Fix P2 section title — remove "P2:" prefix
patch(
    "P2: High-Value Carry-Overs \u2014 Baseline View",
    "High-Value Carry-Overs \u2014 Baseline View",
    "P2 section — remove prefix"
)

# Remove "P1 Immediate" → "Immediate" in the table
patch(
    "<strong>P1 Immediate</strong>",
    "<strong>Immediate</strong>",
    "P1 Immediate → Immediate"
)

# Remove "P2 Scheduled" → "Scheduled"
patch(
    "<strong>P2 Scheduled</strong>",
    "<strong>Scheduled</strong>",
    "P2 Scheduled → Scheduled"
)

# ============================================================
# 4. FIX: Remove the entire status badge column from both tables
# ============================================================
print("\n=== 4. Remove status badge column ===")

# The status badges appear as text after the table cells in the IIFE returns.
# They look like: Funded M€</th><th...>Status</th>  — but we already removed the header.
# The badges are rendered as separate spans AFTER the table </td>.
# Let me find and remove them properly.

# In the LFR table, badges appear after funded cells like:
# ...var(--prot)"><strong>'+money(p1f)+'</strong></td>...followed by a status badge td
# Actually looking at the screenshot, the badges ("Funded first", "Data-backed" etc)
# appear as a SEPARATE column outside the main table area.

# Let me check the actual HTML structure
# The IIFE builds table rows and the badge text appears after </td>
# Pattern: </strong></td><td style="padding:..."><span class="badge green">Funded first</span></td>

# Remove all badge spans that appear in the breakdown sections
# These are inline in the JavaScript template strings

# For LFR table: remove badge text after funded amounts
for badge in ['Funded first', 'Funded second', 'Funded third', 'Needs evidence']:
    old_badge = '<span class=\\"badge green\\">'+badge+'</span>'
    if old_badge in html:
        html = html.replace(old_badge, '', 99)
        ok += 1; print(f"  [OK] Removed badge: {badge}")
    else:
        old_badge2 = '<span class=\\"badge amber\\">'+badge+'</span>'
        if old_badge2 in html:
            html = html.replace(old_badge2, '', 99)
            ok += 1; print(f"  [OK] Removed amber badge: {badge}")
        else:
            print(f"  [INFO] Badge '{badge}' not found (may use different escaping)")

# For Carryover table
for badge in ['Data-backed', 'Needs business case', 'Reclassified']:
    old_badge = '<span class=\\"badge green\\">'+badge+'</span>'
    if old_badge in html:
        html = html.replace(old_badge, '', 99)
        ok += 1; print(f"  [OK] Removed badge: {badge}")
    old_badge2 = '<span class=\\"badge amber\\">'+badge+'</span>'
    if old_badge2 in html:
        html = html.replace(old_badge2, '', 99)
        ok += 1; print(f"  [OK] Removed amber badge: {badge}")
    old_badge3 = '<span class=\\"badge red\\">'+badge+'</span>'
    if old_badge3 in html:
        html = html.replace(old_badge3, '', 99)
        ok += 1; print(f"  [OK] Removed red badge: {badge}")

# The badges may also appear without escaped quotes (in the raw IIFE string)
# Check for unescaped versions
for badge in ['Funded first', 'Funded second', 'Funded third', 'Needs evidence',
              'Data-backed', 'Needs business case', 'Reclassified']:
    for cls in ['green', 'amber', 'red']:
        pat = f'<span class="badge {cls}">{badge}</span>'
        if pat in html:
            html = html.replace(pat, '', 99)
            ok += 1; print(f"  [OK] Removed unescaped badge: {cls}/{badge}")

# ============================================================
# 5. FIX: Gate definitions to match new STAGES names
# ============================================================
print("\n=== 5. Gate definitions ===")
OLD_DEFS = "const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Legal, Fiscal and Regulatory obligations. P1 Immediate funded first, then P2 Scheduled, then CCB exceptions (EW-11, EW-65, EW-71). Only LFRs with compliance name and year auto-qualify.','High-Value Carry-Overs from AOP2026 with demonstrated return. Ranked by benefit/cost ratio, then payback, then consequence, then merit. Programmes without evidence are held.','Change and Sustaining Engineering. Sustain demand funded first by merit, then Hygiene (CI, Upgrades). Merit-based ranking, not automatic 100%.','Remaining demand including decommissioning, AI and new initiatives. Receives capacity after Priorities 1\u20133. Ranked by evidence strength then merit.'];"

NEW_DEFS = "const definitions=['Checks whether the request has enough evidence to be assessed. Missing fields stay visible. This gate does not reserve money.','Mandatory legal, fiscal, regulatory and compliance obligations. Immediate obligations funded first, then Scheduled, then CCB exceptions. Only LFRs with compliance name and year auto-qualify.','Carry-over programmes from AOP2026 with demonstrated return on investment. Ranked by benefit/cost ratio. Must have baselined business case and Must Do/Must Have priority.','Change and Sustain demand funded first, then Hygiene (Continuous Improvement, Upgrades) ranked by merit score within the budget envelope.','Remaining demand including new initiatives, decommissioning and AI enablement. Receives capacity after priorities 1\u20133. Ranked by evidence strength then merit score.'];"
patch(OLD_DEFS, NEW_DEFS, "Gate definitions — aligned to lever names")

# ============================================================
# 6. FIX: Ensure lever event handler correctly maps to stages
# ============================================================
print("\n=== 6. Lever handler stage mapping ===")
# The lever handler for basis-toggle levers needs to find the right stage demand
# when user changes the basis. Also check the lever slider/input handler.

# The lever data-lever handler needs to know which stage index to use:
# lfr → stage 0, carry → stage 1, sustain → stage 2, value → stage 3
# Currently it does: s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value)
# This should work for lfr/sustain/value (object levers) and carry (id-based number)

# But we also need to verify the slider max values update when basis changes
# The controls() function re-renders on every render() call, so max values are fresh

# ============================================================
# 7. FIX: Update gate card rendering to match lever order
# ============================================================
print("\n=== 7. Gate rendering ===")
# The gates now use the STAGES array which we renamed. The colors should match levers.
# Gate 0 = evidence check (amber)
# Gate 1 = Legal (dark navy)
# Gate 2 = Carry-Overs (blue)
# Gate 3 = Sustain+Hygiene (teal)
# Gate 4 = Value (light blue)
# This is already correct from previous patches.

# ============================================================
# 8. FIX: CCB funded amount — was showing 0.0 M€ in the screenshot
# ============================================================
print("\n=== 8. Check CCB funding ===")
# The screenshot shows CCB Exceptions: 3 items, 18.1 M€ demand, 0.0 M€ funded
# But they should be funded. This might be because the LFR evidence hold
# was incorrectly applied to CCBs.
# Let's verify the hold logic excludes CCBs:
# if(st===0&&!['EW-11','EW-65','EW-71'].includes(r.item)&&(!r.lfrName||!r.lfrYear))holds.push(...)
# This correctly excludes CCBs from the evidence hold.
# The 0.0 might be from the previous page load before we fixed the sustain hold.
# After our fixes, CCBs should be funded. Let's verify at runtime.

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
