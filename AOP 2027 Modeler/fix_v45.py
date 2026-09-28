"""Fix remaining patches in v4.5 HTML that the build script couldn't apply."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'

print("Reading v4.5 HTML...")
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"  File: {len(html)} chars")

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
# FIX 1: Replace controls() function entirely
# ============================================================
print("\n--- FIX 1: controls() function ---")
# The old controls function starts with specific text and ends just before "function filters("
# Find the exact start and end
ctrl_marker = "function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class=\"panel\"><h2>Scenario and funding levers</h2>"
ctrl_end_marker = "function filters(scope,rows)"

idx_start = html.find(ctrl_marker)
idx_end = html.find(ctrl_end_marker)

if idx_start >= 0 and idx_end > idx_start:
    old_controls = html[idx_start:idx_end]

    NEW_CONTROLS = r"""function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'',p4=Math.max(0,Math.round((s.budget-s.lfr-s.carry-s.sustain)*10)/10),stColors=['#00126E','#0B5ED7','#008BA3','#70ADE0'];return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M\u20ac) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation \xb7 Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'</div><p class="muted">Scenario type: <strong>'+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default (Vanilla)')+'</strong>. The 100.0 M\u20ac starting envelope is illustrative. Presets retain the entered Total AOP.</p><div class="levers" style="grid-template-columns:repeat(4,minmax(0,1fr))">'+[['P1: Legal, Fiscal & Regulatory','lfr',s.lfr,result.stages[0]],['P2: High-Value Carry-Overs','carry',s.carry,result.stages[1]],['P3: Change & Sustaining','sustain',s.sustain,result.stages[2]]].map(([title,k,val,stg])=>'<article><h3>'+esc(title)+'</h3><p>Directional budget (M\u20ac)</p><input aria-label="'+esc(title)+' budget" data-lever="'+k+'" type="range" min="0" max="'+Math.max(Math.ceil(stg.demand),Math.ceil(val))+'" step="0.1" value="'+val+'"'+disabled+'><label><input aria-label="'+esc(title)+' value" data-lever="'+k+'" type="number" min="0" max="'+Math.max(Math.ceil(stg.demand),Math.ceil(val))+'" step="0.1" value="'+dec(val)+'"'+disabled+'> M\u20ac</label>'+allocationSelection(stg.target,stg.demand)+'</article>').join('')+'<article><h3>P4: Business & Function New</h3><p>Automatic residual</p><strong class="threshold-value" style="font-size:22px;color:var(--blue)">'+money(p4)+'</strong><small class="muted">Remaining after P1\u20133</small>'+allocationSelection(result.stages[3]?result.stages[3].allocation:0,result.stages[3]?result.stages[3].demand:0)+'</article></div><details class="advanced"><summary>Additional configuration \xb7 merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Captured Consequence','Decision Band'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div><p>Weights must total 100.0. Automatic funding selects whole programs in order, within a maximum 5.0% portfolio tolerance.</p></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Carry</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','15','50','20','15'],['protect','Protect Commitments','20','50','23','7'],['evidence','Tighten Carryover','15','40','20','25'],['capacity','Release Sustain','15','58','12','15']].map(([k,n,p1,p2,p3,p4v])=>{const setting=AOP.preset(k);setting.budget=s.budget;const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+' M\u20ac</td><td>'+p2+' M\u20ac</td><td>'+p3+' M\u20ac</td><td>'+p4v+' M\u20ac</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table><p class="muted">Comparison is automatic-only on this source and envelope.</p></details><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="export-inclusions">Export inclusions \xb7 Excel</button><button id="export-full">Export full \xb7 Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' \xb7 r'+x.revision+' \xb7 '+x.status+'</button>').join('')+'</div></section>';}
"""

    html = html[:idx_start] + NEW_CONTROLS.strip() + "\n" + html[idx_end:]
    applied += 1
    print(f"  [OK] controls() replaced ({len(old_controls)} → {len(NEW_CONTROLS.strip())} chars)")
else:
    failed += 1
    print(f"  [FAIL] controls() — start={idx_start}, end={idx_end}")

# ============================================================
# FIX 2: Gate cards render in scenario()
# ============================================================
print("\n--- FIX 2: Gate cards ---")
# The gate render uses the STAGES array and 6 gate articles
# Find the actual pattern in the scenario function
OLD_G = "['Evidence and decision check',...AOP.STAGES].map((x,i)=>'<article><b class=\"gate-no\">'+i+'</b><h3>'+esc(x)+'</h3><p>'+definitions[i]+'</p>'+(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Allocated '+money(result.stages[i-1].allocation)+'</small>':'')+'</article>').join('')"
NEW_G = "['Evidence and decision check',...AOP.STAGES].map((x,i)=>'<article style=\"border-color:'+(i?['#00126E','#0B5ED7','#008BA3','#70ADE0'][i-1]:'#c8d7ed')+'\"><b class=\"gate-no\" style=\"background:'+(i?['#00126E','#0B5ED7','#008BA3','#70ADE0'][i-1]:'var(--disc)')+'\">'+i+'</b><h3>'+esc(x)+'</h3><p style=\"font-size:11px\">'+definitions[i]+'</p>'+(i?'<small>Demand '+money(result.stages[i-1].demand)+'<br>Target '+money(result.stages[i-1].target)+'<br><strong>Allocated '+money(result.stages[i-1].allocation)+'</strong></small>':'')+'</article>').join('')"
patch(OLD_G, NEW_G, "Gate cards — add target + colors")

# Update grid columns from 6 to 5
patch(
    "'<div class=\"gates\">'",
    "'<div class=\"gates\" style=\"grid-template-columns:repeat(5,minmax(0,1fr))\">'",
    "Gate cards — 5-column grid"
)

# ============================================================
# FIX 3: Funding bar legend colors
# ============================================================
print("\n--- FIX 3: Legend colors ---")
# The legend iterates stages and maps index to color array
patch(
    "['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0'][result.stages.indexOf(x)]+'\"",
    "['#00126E','#0B5ED7','#008BA3','#70ADE0'][result.stages.indexOf(x)]+'\"",
    "Legend swatch colors"
)

# ============================================================
# FIX 4: Lever input handler — update to simple M€
# ============================================================
print("\n--- FIX 4: Lever handler ---")
# Find and fix the lever input handler
# The old handler does: next[k].pct=v or similar
# Let's find the actual pattern
import re
# Search for the lever handler pattern
m = re.search(r"if\(t\.dataset\.lever\)\{(.*?)commit\('setting'", html)
if m:
    handler_text = m.group(1)
    print(f"  [INFO] Lever handler found: ...{handler_text[:120]}...")

    # Replace the handler that reads .pct or .amount with direct assignment
    if ".pct=" in handler_text or "next[k]" in handler_text:
        # Find the full handler block
        lever_start = html.find("if(t.dataset.lever){")
        if lever_start >= 0:
            # Read from here to find the commit call
            lever_block_end = html.find("commit('setting'", lever_start)
            if lever_block_end > lever_start:
                old_handler = html[lever_start:lever_block_end]
                # Create new handler: simple direct assignment
                new_handler = "if(t.dataset.lever){const k=t.dataset.lever,v=parseFloat(t.value);if(!Number.isFinite(v))return;const next=clone(session.settings);next[k]=v;"
                html = html[:lever_start] + new_handler + html[lever_block_end:]
                applied += 1
                print(f"  [OK] Lever handler — replaced with simple M€ assignment")
            else:
                failed += 1
                print("  [FAIL] Could not find commit('setting' after lever handler")
        else:
            failed += 1
            print("  [FAIL] Could not find if(t.dataset.lever)")
    else:
        print(f"  [INFO] Handler doesn't contain .pct= or next[k]: {handler_text[:80]}")
else:
    # Try another pattern
    if "dataset.lever" in html:
        print("  [INFO] dataset.lever exists in html, searching for handler...")
        pos = html.find("dataset.lever")
        context = html[max(0,pos-100):pos+300]
        print(f"  [INFO] Context: ...{context[:200]}...")
    else:
        failed += 1
        print("  [FAIL] dataset.lever not found")

# ============================================================
# FIX 5: Carry slider handler (old id="carry" for threshold)
# ============================================================
print("\n--- FIX 5: Old carry/value-allocation handlers ---")
# Remove the old carry threshold handler (id="carry" mapped to s.carry as threshold)
# and the old value-allocation handler
# These are handled by the new data-lever="carry" handler now
if "id==='carry'" in html:
    patch(
        "id==='carry'",
        "id==='carry-DISABLED'",
        "Disable old carry threshold handler"
    )

if "id==='value-allocation'" in html:
    patch(
        "id==='value-allocation'",
        "id==='value-allocation-DISABLED'",
        "Disable old value-allocation handler"
    )

# ============================================================
# FIX 6: Reconciliation text
# ============================================================
print("\n--- FIX 6: Reconciliation ---")
patch(
    "The displayed lever total adds the rounded amounts on the five controls.",
    "The lever totals show the directional budgets for P1\u2013P3 plus the automatic P4 residual.",
    "Reconciliation description"
)
patch(
    "unused capacity can pass to a later stage",
    "unused capacity passes to the next priority",
    "Reconciliation stage→priority"
)

# ============================================================
# FIX 7: Basis button handler — prevent errors
# ============================================================
print("\n--- FIX 7: Basis handler ---")
# Old code has data-basis click handler that calls switchBasis
# Since switchBasis is now a no-op, this should be safe
# But let's also remove the basis button CSS active toggle
if "data-basis" in html:
    print("  [INFO] data-basis still present — controls() replacement should fix this")

# ============================================================
# FIX 8: Score grid text
# ============================================================
print("\n--- FIX 8: Score framework ---")
patch(
    "Four components are weighted, normalised to 100",
    "Four components weighted to 100. Applied uniformly across all four priority stages",
    "Score grid text"
)

# ============================================================
# FIX 9: Transact — handle new settings structure
# ============================================================
print("\n--- FIX 9: Transact ---")
# Check if transact accesses the old structure
if "next.settings.lfr.pct" in html:
    patch("next.settings.lfr.pct", "next.settings.lfr", "transact lfr.pct → lfr")
if "next.settings.sustain.pct" in html:
    patch("next.settings.sustain.pct", "next.settings.sustain", "transact sustain.pct → sustain")
if "next.settings.hygiene.pct" in html:
    patch("next.settings.hygiene.pct", "next.settings.hygiene", "transact hygiene.pct → hygiene")

# ============================================================
# FIX 10: Stream tab — references to stages 0-4 need updating
# ============================================================
print("\n--- FIX 10: Stream tab references ---")
# The stream() function (EW/BU Led tabs) references stage data
# It should work since result.stages now has 4 entries
# But check for hardcoded stage index 4
if "result.stages[4]" in html:
    html = html.replace("result.stages[4]", "result.stages[3]", 99)
    applied += 1
    print("  [OK] result.stages[4] → result.stages[3]")
else:
    print("  [INFO] No result.stages[4] references — good")

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {applied}")
print(f"Failed:  {failed}")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nWritten to {PATH} ({len(html)} chars)")
