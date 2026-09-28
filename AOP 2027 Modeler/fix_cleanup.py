"""Remove scenario types, update tolerance to 0%, run QA."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"Read: {len(html)} chars")

ok = 0; fail = 0
def P(old, new, label, count=1):
    global html, ok, fail
    if old in html:
        html = html.replace(old, new, count)
        ok += 1; print(f"  [OK] {label}")
    else:
        fail += 1; print(f"  [FAIL] {label}")

# ============================================================
# 1. Remove scenario type buttons from controls
# ============================================================
print("\n=== 1. Remove scenario type UI ===")

P("<div class=\"toolbar\" style=\"margin-bottom:10px;padding:10px 0;border-top:1px solid var(--border)\"><span style=\"font-size:11px;color:var(--text2);margin-right:8px\">Scenario type:</span><button data-scenario-type=\"default\" class=\"'+(session.scenarioType==='default'||!session.scenarioType?'primary':'')+'\">Default (Vanilla)</button><button data-scenario-type=\"leadership\" class=\"'+(session.scenarioType==='leadership'?'primary':'')+'\">Leadership</button><button data-scenario-type=\"conference\" class=\"'+(session.scenarioType==='conference'?'primary':'')+'\">Conference</button></div>",
  "",
  "Remove scenario type buttons")

# ============================================================
# 2. Remove scenario type description text
# ============================================================
print("\n=== 2. Remove scenario type text ===")

P("Scenario type: <strong>'+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default (Vanilla)')+'</strong>. The 100 M\\u20ac starting envelope is illustrative. Presets retain the entered Total AOP.",
  "The 100 M\\u20ac starting envelope is illustrative. Presets retain the entered Total AOP.",
  "Remove scenario type from controls text")

# ============================================================
# 3. Remove scenario type from status bar
# ============================================================
print("\n=== 3. Remove from status bar ===")

P("session.name+' \\xb7 '+(session.scenarioType==='conference'?'Conference':session.scenarioType==='leadership'?'Leadership':'Default')+' \\xb7 '+session.status",
  "session.name+' \\xb7 '+session.status",
  "Remove scenario type from status bar")

# ============================================================
# 4. Remove scenario type click handler
# ============================================================
print("\n=== 4. Remove click handler ===")

P("else if(b.dataset.scenarioType){session.scenarioType=b.dataset.scenarioType;render();persist();}",
  "",
  "Remove scenario type click handler")

# ============================================================
# 5. Remove scenarioType from createSession
# ============================================================
print("\n=== 5. Remove from createSession ===")

P("scenarioType:'default',",
  "",
  "Remove scenarioType from createSession")

# ============================================================
# 6. Remove scenarioType from fork
# ============================================================
print("\n=== 6. Remove from fork ===")

P("next.scenarioType=session.scenarioType||'default';",
  "",
  "Remove scenarioType from fork")

# ============================================================
# 7. Remove scenario type from KPI
# ============================================================
print("\n=== 7. Remove from KPI ===")

# Check if KPI references scenarioType
if "scenarioType" in html:
    # Find and remove any remaining references
    import re
    count = html.count("scenarioType")
    print(f"  [INFO] {count} scenarioType references remaining")
    # Remove the KPI scenario line if present
    P("'<small>Scenario: '+(session.scenarioType||'Default')+'</small>'",
      "'<small></small>'",
      "Remove from KPI small text")
    P("'<small>Scenario: '+(session.scenarioType||'default')+'</small>'",
      "'<small></small>'",
      "Remove from KPI small text (lowercase)")

# ============================================================
# 8. Set tolerance default to 0%
# ============================================================
print("\n=== 8. Tolerance 0% ===")

P("const defaults=()=>({budget:100,tolerance:5,",
  "const defaults=()=>({budget:100,tolerance:0,",
  "Tolerance default → 0%")

# Also update all presets to use tolerance 0
# The presets inherit from defaults(), so they'll get 0 automatically.
# But check if any preset explicitly sets tolerance
if "s.tolerance=" in html:
    print("  [INFO] Some presets explicitly set tolerance")
else:
    print("  [OK] No preset overrides tolerance — defaults to 0 for all")

# ============================================================
# WRITE
# ============================================================
print(f"\n{'='*60}")
print(f"Applied: {ok}, Failed: {fail}")
with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
