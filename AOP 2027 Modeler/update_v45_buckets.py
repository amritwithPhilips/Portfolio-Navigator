"""Update v4.5: Move ineligible LFRs and non-baselined carry-overs to P4.

P1 bucket = only LFRs with compliance name+year + CCBs (~24.8 M€)
P2 bucket = only baselined carry-overs with Must Do/Must Have (~26.3 M€)
P4 bucket = everything else including held LFRs (12.2 M€) and non-baselined carry-overs (81.4 M€)
"""
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
# 1. stage() — reclassify ineligible LFRs and carry-overs to P4
# ============================================================
print("\n=== 1. stage() — eligible-only buckets ===")

OLD_STAGE = r"function stage(r){const d=key(r.overall);if(/must-do\s*-\s*p[12]\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 1;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;return 3;}"

NEW_STAGE = r"function stage(r){const d=key(r.overall);if(['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(/must-do\s*-\s*p[12]\s*-/.test(d)&&r.lfrName&&r.lfrYear)return 0;if(key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category))&&r.baselined>0&&['must do','must have'].includes(key(r.priority)))return 1;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;return 3;}"

patch(OLD_STAGE, NEW_STAGE, "stage() — P1 evidence-only, P2 baselined-only")

# ============================================================
# 2. enrich() — remove holds that are now handled by classification
# ============================================================
print("\n=== 2. enrich() — remove reclassified holds ===")

# Remove LFR evidence hold (these programmes are now in P4, not P1)
patch(
    "if(st===0&&!['EW-11','EW-65','EW-71'].includes(r.item)&&(!r.lfrName||!r.lfrYear))holds.push('LFR missing compliance name or year \u2014 held for explicit review');",
    "/* LFRs without evidence are now classified directly to P4 */",
    "Remove LFR evidence hold (now P4)"
)

# Remove carry-over baselined hold (these are now in P4)
patch(
    "if(st===1&&!r.baselined)holds.push('Carry-over without baselined business case \u2014 held for explicit review');",
    "/* Non-baselined carry-overs are now classified directly to P4 */",
    "Remove carry-over baseline hold (now P4)"
)

# Remove carry-over Must Do/Must Have hold (these are now in P4)
patch(
    "if(st===1&&r.baselined>0&&!['must do','must have'].includes(key(r.priority)))holds.push('Carry-over not Must Do/Must Have \u2014 moved to P4');",
    "/* Non-Must-Do carry-overs are now classified directly to P4 */",
    "Remove carry-over priority hold (now P4)"
)

# ============================================================
# 3. Update LFR breakdown table — show only P1 eligible
# ============================================================
print("\n=== 3. LFR breakdown table ===")

# The LFR breakdown table is an IIFE in the scenario() function
# It currently filters r.stage===0 and shows sub-tiers including "without evidence"
# Now all stage===0 programmes HAVE evidence (or are CCBs)
# The "without evidence" row should show as "Moved to Value Based Portfolio" instead of "Held"

# Find the LFR section IIFE
LFR_SECTION_START = "'<details class=\"section-panel panel\"><summary>Legal and Compliance (Must Do) \u2014 Demand Breakdown</summary>'"

# Replace the entire LFR IIFE with updated version
OLD_LFR_IIFE_START = LFR_SECTION_START + "+function(){"
if OLD_LFR_IIFE_START in html:
    # Find the end of the IIFE (closes with ;}()+'</details>')
    iife_start = html.find(OLD_LFR_IIFE_START)
    iife_end = html.find("+'}()+'</details>'", iife_start)
    if iife_end < 0:
        iife_end = html.find(";}()+'</details>'", iife_start)

    if iife_end > iife_start:
        # Find the actual end including the close
        close_end = html.find("'</details>'", iife_end) + len("'</details>'")
        old_lfr_block = html[iife_start:close_end]

        NEW_LFR_BLOCK = """'<details class="section-panel panel"><summary>Legal and Compliance (Must Do) \\u2014 Demand Breakdown</summary>'+function(){const lfr=result.rows.filter(r=>r.stage===0);const p1=lfr.filter(r=>r.lfrTier==='P1 Immediate');const p2=lfr.filter(r=>r.lfrTier==='P2 Scheduled');const ccb=lfr.filter(r=>r.lfrTier==='CCB');const totalDemand=AOP.sum(lfr,r=>r.cost);const p1f=AOP.sum(p1,r=>r.final);const p2f=AOP.sum(p2,r=>r.final);const ccbf=AOP.sum(ccb,r=>r.final);const movedToP4=result.rows.filter(r=>r.stage===3&&/must-do/.test(AOP.key(r.overall)));const movedD=AOP.sum(movedToP4,r=>r.cost);return '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="background:var(--dk);color:white;padding:10px 14px;text-align:left">LFR Sub-Bucket</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Count</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Demand M\\u20ac</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Funded M\\u20ac</th></tr></thead><tbody><tr><td style="padding:10px 14px;border-bottom:1px solid var(--mist)"><strong>Immediate</strong></td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+p1.length+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+money(AOP.sum(p1,r=>r.cost))+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist);color:var(--prot)"><strong>'+money(p1f)+'</strong></td></tr><tr><td style="padding:10px 14px;border-bottom:1px solid var(--mist)"><strong>Scheduled</strong></td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+p2.length+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+money(AOP.sum(p2,r=>r.cost))+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist);color:var(--prot)"><strong>'+money(p2f)+'</strong></td></tr><tr><td style="padding:10px 14px;border-bottom:1px solid var(--mist)"><strong>CCB Exceptions</strong><br><small style="color:var(--text2)">EW-11, EW-65, EW-71</small></td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+ccb.length+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+money(AOP.sum(ccb,r=>r.cost))+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist);color:var(--prot)"><strong>'+money(ccbf)+'</strong></td></tr><tr style="background:var(--lt);font-weight:700"><td style="padding:10px 14px">Eligible LFR Bucket</td><td style="text-align:right;padding:10px 14px">'+lfr.length+'</td><td style="text-align:right;padding:10px 14px">'+money(totalDemand)+'</td><td style="text-align:right;padding:10px 14px">'+money(AOP.sum(lfr,r=>r.final))+'</td></tr></tbody></table>'+(movedToP4.length?'<p style="font-size:11px;color:var(--text2);margin-top:8px">'+movedToP4.length+' LFR programmes ('+money(movedD)+') without compliance name or year moved to Value Based Portfolio.</p>':'');}()+'</details>'"""

        html = html[:iife_start] + NEW_LFR_BLOCK + html[close_end:]
        ok += 1; print("  [OK] LFR breakdown — eligible-only table")
    else:
        fail += 1; print(f"  [FAIL] LFR IIFE end not found ({iife_start}, {iife_end})")
else:
    fail += 1; print("  [FAIL] LFR section IIFE start not found")

# ============================================================
# 4. Update Carryover breakdown table — show only P2 eligible
# ============================================================
print("\n=== 4. Carryover breakdown table ===")

CO_SECTION_START = "'<details class=\"section-panel panel\"><summary>High-Value Carry-Overs \u2014 Baseline View</summary>'"
OLD_CO_IIFE_START = CO_SECTION_START + "+function(){"

if OLD_CO_IIFE_START in html:
    co_start = html.find(OLD_CO_IIFE_START)
    co_end = html.find(";}()+'</details>'", co_start)
    if co_end > co_start:
        close_end2 = html.find("'</details>'", co_end) + len("'</details>'")
        old_co_block = html[co_start:close_end2]

        NEW_CO_BLOCK = """'<details class="section-panel panel"><summary>High-Value Carry-Overs \\u2014 Baseline View</summary>'+function(){const co=result.rows.filter(r=>r.stage===1);const totalD=AOP.sum(co,r=>r.cost);const totalF=AOP.sum(co,r=>r.final);const baseCap=AOP.sum(co,r=>r.carryFundCap||0);const movedToP4=result.rows.filter(r=>r.stage===3&&AOP.key(r.newCarry)==='carry over'&&!['decomm/replatforming','decommissioning','replatforming'].includes(AOP.key(r.category)));const movedD=AOP.sum(movedToP4,r=>r.cost);return '<p class="muted" style="font-size:11px;margin-bottom:12px">True Carryovers with confirmed business case (baselined) and Must Do/Must Have priority. Funding capped at min(Requested, Baselined).</p><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="background:var(--dk);color:white;padding:10px 14px;text-align:left">Carryover Category</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Count</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Requested M\\u20ac</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Baselined Cap M\\u20ac</th><th style="background:var(--dk);color:white;padding:10px 14px;text-align:right">Funded M\\u20ac</th></tr></thead><tbody><tr><td style="padding:10px 14px;border-bottom:1px solid var(--mist)"><strong>True Carryovers</strong><br><small style="color:var(--text2)">Baselined + Must Do/Must Have</small></td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+co.length+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+money(totalD)+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist)">'+money(baseCap)+'</td><td style="text-align:right;padding:10px 14px;border-bottom:1px solid var(--mist);color:var(--prot)"><strong>'+money(totalF)+'</strong></td></tr><tr style="background:var(--lt);font-weight:700"><td style="padding:10px 14px">Eligible Carry-Over Bucket</td><td style="text-align:right;padding:10px 14px">'+co.length+'</td><td style="text-align:right;padding:10px 14px">'+money(totalD)+'</td><td style="text-align:right;padding:10px 14px">'+money(baseCap)+'</td><td style="text-align:right;padding:10px 14px">'+money(totalF)+'</td></tr></tbody></table>'+(movedToP4.length?'<p style="font-size:11px;color:var(--text2);margin-top:8px">'+movedToP4.length+' carry-over programmes ('+money(movedD)+') without baselined business case moved to Value Based Portfolio.</p>':'');}()+'</details>'"""

        html = html[:co_start] + NEW_CO_BLOCK + html[close_end2:]
        ok += 1; print("  [OK] Carryover breakdown — eligible-only table")
    else:
        fail += 1; print("  [FAIL] Carryover IIFE end not found")
else:
    fail += 1; print("  [FAIL] Carryover section IIFE start not found")

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
