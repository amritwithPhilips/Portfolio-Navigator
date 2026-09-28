"""Build OC-01, OC-07, OC-10, OC-16 in the v4.5 dashboard."""
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
# OC-01: Dynamic total row "X/521" format when filtered
# ============================================================
print("\n=== OC-01: Dynamic total row X/521 ===")

# The applyFilters function updates total row on filter change
# Current: shows filtered count OR total count (not both)
patch(
    "if(tc[1])tc[1].textContent=Object.keys(filters).length?visCount:dataRows.length;",
    "if(tc[1])tc[1].textContent=Object.keys(filters).length?visCount+' of '+dataRows.length:dataRows.length;",
    "OC-01: count shows X of Y"
)

# Also update the demand column to show "X of Y"
patch(
    "if(tc[2])tc[2].textContent=Object.keys(filters).length?visDemand.toFixed(1):tc[2].dataset.orig||tc[2].textContent;",
    "if(tc[2]){if(!tc[2].dataset.orig)tc[2].dataset.orig=tc[2].textContent;tc[2].textContent=Object.keys(filters).length?visDemand.toFixed(1)+' of '+tc[2].dataset.orig:tc[2].dataset.orig;}",
    "OC-01: demand shows X of Y M\u20ac"
)

# ============================================================
# OC-07: Business-readable changelog in Excel downloads
# ============================================================
print("\n=== OC-07: Business changelog in Excel ===")

# The sheets() function returns 6 sheets. Add a 7th "Change Log" sheet.
# Current Decisions sheet exports raw JSON. Replace with human-readable format
# AND add a separate Change Log sheet.

OLD_DECISIONS = "{name:'Decisions',rows:[['Event','Time','Origin','Action','Revision','Source version','Details','Old values','New values'],...session.events.map(e=>[e.id,e.time,e.origin,e.action,e.revision,e.sourceVersion,JSON.stringify(e.details),JSON.stringify(e.before),JSON.stringify(e.after)])]}"

NEW_DECISIONS = """{name:'Decisions',rows:[['Event','Time','Origin','Action','Revision','Source version','Details','Old values','New values'],...session.events.map(e=>[e.id,e.time,e.origin,e.action,e.revision,e.sourceVersion,JSON.stringify(e.details),JSON.stringify(e.before),JSON.stringify(e.after)])]},{name:'Change Log',rows:[['Date & Time','Action','Programme ID','Programme Name','Organisation','Origin Tab','Old Value','New Value','Business Note','Revision'],...session.events.filter(e=>e.action!=='setting'&&e.action!=='preset').map(e=>{const d=e.details||{};const prog=result.rows.find(r=>r.id===d.id);return [e.time,e.action==='program'?(d.choice==='include'?'Included programme':d.choice==='exclude'?'Excluded programme':'Changed amount'):e.action==='group'?'Group '+(d.choice||'change'):e.action==='review'?'Evidence review':e.action==='reset'?'Reset all overrides':e.action==='finalise'?'Finalised scenario':e.action==='fork'?'Created working version':e.action,d.id||'',prog?.name||d.id||'',prog?.org||'',e.origin||'',d.before!==undefined?String(d.before):'',d.after!==undefined?String(d.after):(d.amount!==undefined?d.amount+' M\\u20ac':''),d.note||'',e.revision];})]}"""

patch(OLD_DECISIONS, NEW_DECISIONS, "OC-07: Business Change Log sheet")

# ============================================================
# OC-10: Three scenario types (Default/Leadership/Conference)
# ============================================================
print("\n=== OC-10: Three scenario types ===")

# 1. Add scenario type buttons to the controls toolbar
# Find the save bar and add scenario type buttons before it
OLD_SAVEBAR = "'<div class=\"toolbar savebar\">"
NEW_SAVEBAR = "'<div class=\"toolbar\" style=\"margin-bottom:12px;padding:10px 0;border-top:1px solid var(--border)\"><span style=\"font-size:11px;color:var(--text2);margin-right:8px\">Scenario type:</span><button data-scenario-type=\"default\" class=\"'+(session.scenarioType==='default'||!session.scenarioType?'primary':'')+'\">Default (Vanilla)</button><button data-scenario-type=\"leadership\" class=\"'+(session.scenarioType==='leadership'?'primary':'')+'\">Leadership</button><button data-scenario-type=\"conference\" class=\"'+(session.scenarioType==='conference'?'primary':'')+'\">Conference</button></div><div class=\"toolbar savebar\">"
patch(OLD_SAVEBAR, NEW_SAVEBAR, "OC-10: Scenario type buttons in controls")

# 2. Add click handler for scenario type buttons
# Add to the click event delegation
OLD_FORK = "else if(b.dataset.action)commit(b.dataset.action);"
NEW_FORK = "else if(b.dataset.scenarioType){session.scenarioType=b.dataset.scenarioType;render();persist();}else if(b.dataset.action)commit(b.dataset.action);"
patch(OLD_FORK, NEW_FORK, "OC-10: Scenario type click handler")

# 3. Update fork action to inherit scenario type
patch(
    "'fork'){next.status='Draft';next.id='scenario-'+Date.now();next.name+=' working copy';next.parent=session.id;}",
    "'fork'){next.status='Draft';next.id='scenario-'+Date.now();next.name+=' working copy';next.parent=session.id;next.scenarioType=session.scenarioType||'default';}",
    "OC-10: Fork preserves scenario type"
)

# 4. Show scenario type badge in the KPI area
# Already showing in controls text — also add to the status bar
patch(
    "session.name+' \\xb7 '+session.status+' \\xb7 r'+session.revision",
    "session.name+' \\xb7 '+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default')+' \\xb7 '+session.status+' \\xb7 r'+session.revision",
    "OC-10: Scenario type in status bar"
)

# ============================================================
# OC-16: Per-programme score breakdown in detail modal
# ============================================================
print("\n=== OC-16: Score breakdown modal ===")

# Replace the minimal "Weighted merit components: X / Y / Z / W" with a labelled breakdown
OLD_MERIT = "'<dt>Weighted merit components</dt><dd>'+r.components.map(dec).join(' / ')+'</dd>'"
NEW_MERIT = r"""'<dt>Merit Score Breakdown</dt><dd><table style="width:100%;border-collapse:collapse;font-size:11px;margin:4px 0"><tr style="background:var(--dk);color:white"><th style="padding:5px 8px;text-align:left">Component</th><th style="padding:5px 8px;text-align:right">Raw</th><th style="padding:5px 8px;text-align:right">Max</th><th style="padding:5px 8px;text-align:right">Weight</th><th style="padding:5px 8px;text-align:right">Weighted</th></tr>'+['Submitted Benefit','Submitted Priority','Captured Consequence','Decision Band'].map((n,i)=>'<tr style="border-bottom:1px solid var(--mist)"><td style="padding:5px 8px">'+n+'</td><td style="padding:5px 8px;text-align:right">'+r.rawComponents[i]+' / '+[50,25,15,10][i]+'</td><td style="padding:5px 8px;text-align:right">'+(r.rawComponents[i]/[50,25,15,10][i]*100).toFixed(0)+'%</td><td style="padding:5px 8px;text-align:right">'+dec(session.settings.weights[i])+'</td><td style="padding:5px 8px;text-align:right;font-weight:700">'+dec(r.components[i])+'</td></tr>').join('')+'<tr style="background:var(--lt);font-weight:700"><td style="padding:5px 8px">Total Merit Score</td><td></td><td></td><td style="text-align:right">100</td><td style="padding:5px 8px;text-align:right;font-size:13px">'+dec(r.score)+'</td></tr></table></dd>'"""
patch(OLD_MERIT, NEW_MERIT, "OC-16: Labelled score breakdown table")

# ============================================================
# WRITE + CHANGELOG
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
