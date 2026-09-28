"""
Build v4.0: Instead of pre-parsing the Excel, embed the raw XLSX as base64
and inject a startup script that uses AOPWorkbook.read() to parse it at runtime.
This guarantees compatibility with v3.5's normalize function.
"""
import sys, io, json, base64, hashlib
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35_PATH = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
DEMAND_PATH = 'C:/Users/320126040/OneDrive - Philips/Download/17926_IT AOP2027 Demand.xlsx'
OPS_JSON_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v4.0.html'

print("Reading v3.5...")
with open(V35_PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"v3.5 size: {len(html)} chars")

# ── Read 17926 Excel as base64 ──
with open(DEMAND_PATH, 'rb') as f:
    xlsx_bytes = f.read()
xlsx_b64 = base64.b64encode(xlsx_bytes).decode('ascii')
xlsx_hash = hashlib.sha256(xlsx_bytes).hexdigest()
print(f"17926 Excel: {len(xlsx_bytes)} bytes, hash: {xlsx_hash[:20]}...")

# ── Build a minimal source-data JSON with the raw XLSX ──
# This mirrors v3.5's format: {sourceFile, sourceHash, originalBase64, sheets}
# We embed the base64 XLSX and let the runtime parse it
new_source = {
    "sourceFile": "17926_IT AOP2027 Demand.xlsx",
    "sourceHash": xlsx_hash,
    "originalBase64": xlsx_b64,
    "sheets": []  # Empty - will be filled at runtime
}
new_source_json = json.dumps(new_source, ensure_ascii=False, separators=(',',':'))
print(f"Source JSON (with base64): {len(new_source_json)} chars")

# ── Replace the source-data blob ──
sd_start = html.find('<script type="application/json" id="source-data">')
sd_end = html.find('</script>', sd_start) + len('</script>')
new_sd = f'<script type="application/json" id="source-data">{new_source_json}</script>'
html = html[:sd_start] + new_sd + html[sd_end:]
print("Replaced source-data")

# ── Inject operations data ──
with open(OPS_JSON_PATH, 'r', encoding='utf-8') as f:
    ops_data = json.load(f)
ops_blob = {
    "operations": ops_data["operations"],
    "meta": ops_data["meta"],
    "conferences": {
        "functions": {
            "agenda": [
                {"step": 1, "title": "Demand Overview", "duration": "10 mins", "items": ["AOP 2026 allocation across AOP Buckets", "AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide"]},
                {"step": 2, "title": "Enterprise Wide Prioritization Scenario", "duration": "30 mins", "items": ["Scenarios for Enterprise-Wide Demand with committed Impact", "Prioritized Demand Backlog with Trade-off Logic and Cost of Not Doing"]},
                {"step": 3, "title": "Operations Overview", "duration": "10 mins", "items": ["Operation Demand: Scope and Consumptions with allocations for Enterprise Functions and Regions"]},
                {"step": 4, "title": "Summary | Enterprise-Wide AOP 2027", "duration": "10 mins", "items": ["Final Enterprise-Wide AOP: Program + Operations", "Committed Impact"]}
            ],
            "attendees": [
                {"function": "Greater China (GRC)", "gpl": "YiQiu Chen", "platformLead": ""},
                {"function": "Innovation and Design", "gpl": "Steven Spiele", "platformLead": "Michael Baumhackl"},
                {"function": "Medical Office", "gpl": "Astrid Smeets", "platformLead": "Michael Baumhackl"},
                {"function": "Patient Safety & Quality (PSQ)", "gpl": "Philipp Ebbinghaus", "platformLead": "Saumya"},
                {"function": "People Function", "gpl": "Caroline Lippe (Nico Steyaert)", "platformLead": "Saumya"},
                {"function": "Finance", "gpl": "Dick Overeem", "platformLead": "Martine Vleeshouwers"},
                {"function": "Group Security", "gpl": "Gal Gnainsky", "platformLead": "Saumya"},
                {"function": "ESG & Legal, Health & Safety", "gpl": "Martijn Niekus", "platformLead": "Saumya"},
                {"function": "Intellectual Property & Standards", "gpl": "Rob Caals", "platformLead": "Saumya"},
                {"function": "Communications & Brand", "gpl": "Dennis Agusi", "platformLead": "Michael Baumhackl"},
                {"function": "Internal Audit", "gpl": "Martijn Niekus", "platformLead": "Saumya"},
                {"function": "Information Technology (IT)", "gpl": "Ryan Kennedy", "platformLead": "Saumya"},
                {"function": "International Market (IM)", "gpl": "Gunter Koeppen", "platformLead": ""},
                {"function": "North America (NAM)", "gpl": "Ryan Kennedy", "platformLead": ""}
            ]
        },
        "buLed": {
            "agenda": [
                {"step": 1, "title": "Demand Overview", "duration": "10 mins", "items": ["AOP 2026 allocation across AOP Buckets", "AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide", "Approved Enterprise-Wide Priorities and Committed Impact"]},
                {"step": 2, "title": "BU Led Prioritization Scenario", "duration": "30 mins", "items": ["Scenarios for BU Led Demand with committed Impact", "Cross-BU portfolio, including Transformation programs with Supply Chain and Service", "Strategic direction and trade-off"]},
                {"step": 3, "title": "Operations Overview", "duration": "10 mins", "items": ["Operation Demand: Scope and Consumptions with allocations for BU Led Priorities"]},
                {"step": 4, "title": "Summary | AOP 2027", "duration": "10 mins", "items": ["Final One Portfolio BU Led and Enterprise AOP: Program + Operations", "Committed Impact"]}
            ],
            "attendees": [
                {"bu": "PH", "rep": "Dominique Oh", "prime": "Victoria Noelle", "platformLead": "Michael Baumhackl"},
                {"bu": "EI and I&D", "rep": "Christina Murphy", "prime": "Vishwanathan Krishnamoorthy", "platformLead": "Michael Baumhackl"},
                {"bu": "HPM, CC, S&RC", "rep": "Ajay Parkhe / Michael Meissner", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "PD", "rep": "Maria Claudia Renjifo", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "IGT", "rep": "Mark Stoffels", "prime": "Tom van Rooij / Douglas Simpson", "platformLead": "Ryan Kennedy"},
                {"bu": "Service transformation", "rep": "", "prime": "Roel van Driel / Alexander v.Boetzelaer", "platformLead": "Ryan Kennedy"},
                {"bu": "COO & ISC transformation", "rep": "", "prime": "Otto te Walvaart", "platformLead": "Martine Vleeshouwers"},
                {"bu": "IR", "rep": "Minh Nguyen", "prime": "", "platformLead": "Gunter Koeppen"},
                {"bu": "NAM", "rep": "Joe Donlan", "prime": "", "platformLead": "Ryan Kennedy"},
                {"bu": "GCR", "rep": "Kent Cheng", "prime": "", "platformLead": "YiQui Chen"},
                {"bu": "Finance", "rep": "N.A.", "prime": "", "platformLead": "Martine Vleeshouwers"}
            ]
        }
    }
}
ops_json = json.dumps(ops_blob, ensure_ascii=False, separators=(',',':'))
ops_tag = f'\n<script type="application/json" id="ops-data">{ops_json}</script>'
insert_pos = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:insert_pos] + ops_tag + html[insert_pos:]
print(f"Injected ops-data ({len(ops_json)} chars)")

# ── Patch title ──
html = html.replace('<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>',
                     '<title>AOP 2027 | Philips IT One Portfolio Dashboard</title>')

# ── Patch tagline ──
html = html.replace("Evidence-led portfolio", "One Portfolio \xb7 Evidence-led")

# ── Patch tab definitions ──
old_tabs = "tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}"
new_tabs = "tabNames={portfolio:'One Portfolio',scenario:'Program Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',conferences:'Conferences',overview:'AOP2027 : Overview'}"
if old_tabs in html:
    html = html.replace(old_tabs, new_tabs)
    print("Patched tabNames")

# ── Patch IndexedDB version ──
html = html.replace("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.0")

# ── Inject startup script that parses XLSX at runtime ──
# This replaces the immediate AOP.normalize() call with an async one that
# first reads the embedded base64 XLSX using AOPWorkbook.read()
STARTUP_PATCH = r"""
<script>
// v4.0 Runtime XLSX parser: reads the 17926 embedded base64 XLSX using AOPWorkbook.read()
(function(){
  var raw = JSON.parse(document.getElementById('source-data').textContent);
  if(raw.sheets && raw.sheets.length > 0) return; // Already has parsed sheets

  if(!raw.originalBase64) { console.error('No embedded XLSX base64'); return; }

  // Decode base64 to bytes
  var bin = atob(raw.originalBase64);
  var bytes = new Uint8Array(bin.length);
  for(var i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);

  // Use AOPWorkbook.read() to parse
  AOPWorkbook.read(bytes, raw.sourceFile).then(function(wb) {
    // Replace the source-data content with the parsed workbook
    raw.sheets = wb.sheets;
    raw.sourceHash = wb.sourceHash;
    document.getElementById('source-data').textContent = JSON.stringify(raw);

    // Re-initialize the session with the parsed data
    // The v3.5 UI controller has already tried to normalize empty sheets and failed.
    // We need to re-run initialization.
    try {
      var data = AOP.normalize(raw);
      var session = AOP.createSession(data);
      window.__aop = window.__aop || {};
      window.__aop.session = session;
      window.__aop.result = AOP.solve(session.data, session.settings);

      // Trigger a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('aop-data-ready', {detail: {session: session}}));
    } catch(e) {
      console.error('v4.0 normalize error:', e);
    }
  }).catch(function(e) {
    console.error('v4.0 XLSX parse error:', e);
  });
})();
</script>
"""

# Insert after the ops-data script but before the AOP engine script
# Actually, we need to insert AFTER all the AOP modules are loaded but BEFORE the UI controller runs
# The problem is the UI controller runs immediately on script execution.
#
# Better approach: inject the XLSX parser BEFORE the UI controller,
# and make it synchronous (or at least ensure the data is ready).
#
# Actually, the cleanest approach is different:
# The v3.5 UI controller (line 209) does:
#   session = AOP.createSession(AOP.normalize(JSON.parse($('#source-data').textContent)))
# This runs immediately when the script loads. If sheets is empty, it will fail.
#
# We need to pre-parse the XLSX BEFORE the UI controller runs.
# But AOPWorkbook.read() is async (uses DecompressionStream).
#
# The simplest fix: modify the source-data to have the sheets pre-parsed.
# Since we can't easily run AOPWorkbook.read() from Python,
# let's use a different approach: embed a Node.js-parsed version.

# ACTUALLY - let me just fix the column names in the Python extraction
# to exactly match what the old 15926 had. The issue is clear now.
print("\nNote: The v4.0 file needs sheets pre-parsed in the source-data JSON.")
print("The XLSX-at-runtime approach won't work because AOPWorkbook.read() is async")
print("and the UI controller calls AOP.normalize() synchronously at load time.")
print("\nTo fix: use Node.js to run AOPWorkbook.read() on the 17926 XLSX,")
print("or manually fix the Python-extracted headers to match the v3.5 format.")

# Don't inject the startup patch since it won't work
# Instead, we'll write the file as-is and provide instructions
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nWritten v4.0: {len(html)} chars")
print("WARNING: The source-data has empty sheets[] - the page will fail on load.")
print("Next step: use Node.js to parse the XLSX and embed the proper sheets.")
