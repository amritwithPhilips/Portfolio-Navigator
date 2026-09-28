"""
Build v4.0 using the Node.js-parsed 17926 sheets JSON.
The AOPWorkbook.read() output has 4 sheets but v3.5 normalize only uses EW and Bu.
The Bu sheet has headers at row 3 — we need to shift them to row 0.
"""
import sys, io, json, base64, hashlib
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

V35_PATH = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html'
PARSED_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/17926-parsed-sheets.json'
OPS_JSON_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
OUT_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v4.0.html'

print("Reading v3.5...")
with open(V35_PATH, 'r', encoding='utf-8') as f:
    html = f.read()
print(f"v3.5: {len(html)} chars")

print("Reading parsed 17926 sheets...")
with open(PARSED_PATH, 'r', encoding='utf-8') as f:
    parsed = json.load(f)

# Fix Bu sheet: shift headers from row 3 to row 0
for sheet in parsed['sheets']:
    if sheet['name'] == 'Bu':
        rows = sheet['rows']
        # Check if row 0 is empty and row 3 has headers
        if not rows[0][0] and rows[3][0] == 'Item No.':
            print(f"Bu: shifting headers from row 3 to row 0")
            sheet['rows'] = rows[3:]  # Drop first 3 rows
        # Add missing 'Quantified Benefits (Details)' column if not present
        header = sheet['rows'][0]
        header_lower = [str(h).lower() for h in header]
        if not any('quantified benefits (details)' in h for h in header_lower):
            # Find position of 'Quantified Benefits (in K€)' and insert after it
            ben_idx = None
            for i, h in enumerate(header_lower):
                if 'quantified benefits' in h and ('k' in h):
                    ben_idx = i
                    break
            if ben_idx is not None:
                for row in sheet['rows']:
                    row.insert(ben_idx + 1, '')
                sheet['rows'][0][ben_idx + 1] = 'Quantified Benefits (Details) '
                print(f"Bu: Added 'Quantified Benefits (Details)' column at index {ben_idx+1}")
        # Rename 'Waste\nband' or 'Waste\r\nband' to 'Decision Band'
        header = sheet['rows'][0]
        header_lower = [str(h).lower().replace('\r','').replace('\n',' ').strip() for h in header]
        for i, h in enumerate(header_lower):
            if h == 'waste band':
                sheet['rows'][0][i] = 'Decision Band'
                print(f"Bu: Renamed col {i} from 'Waste band' to 'Decision Band'")
        print(f"Bu: {len(sheet['rows'])} rows after shift, header: {sheet['rows'][0][:5]}")
    elif sheet['name'] == 'EW':
        print(f"EW: {len(sheet['rows'])} rows, header: {sheet['rows'][0][:5]}")

# Keep only EW and Bu sheets (v3.5 normalize only uses these)
parsed['sheets'] = [s for s in parsed['sheets'] if s['name'] in ('EW', 'Bu')]

# Build the new source-data JSON
new_source_json = json.dumps(parsed, ensure_ascii=False, separators=(',',':'))
print(f"New source JSON: {len(new_source_json)} chars")

# Replace source-data in HTML
sd_start = html.find('<script type="application/json" id="source-data">')
sd_end = html.find('</script>', sd_start) + len('</script>')
new_sd = f'<script type="application/json" id="source-data">{new_source_json}</script>'
html = html[:sd_start] + new_sd + html[sd_end:]
print("Replaced source-data")

# Inject operations data
with open(OPS_JSON_PATH, 'r', encoding='utf-8') as f:
    ops_data = json.load(f)
ops_blob = {
    "operations": ops_data["operations"],
    "meta": ops_data["meta"],
    "conferences": {
        "functions": {
            "agenda": [
                {"step":1,"title":"Demand Overview","duration":"10 mins","items":["AOP 2026 allocation across AOP Buckets","AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide"]},
                {"step":2,"title":"Enterprise Wide Prioritization Scenario","duration":"30 mins","items":["Scenarios for Enterprise-Wide Demand with committed Impact","Prioritized Demand Backlog with Trade-off Logic and Cost of Not Doing"]},
                {"step":3,"title":"Operations Overview","duration":"10 mins","items":["Operation Demand: Scope and Consumptions with allocations for Enterprise Functions and Regions"]},
                {"step":4,"title":"Summary | Enterprise-Wide AOP 2027","duration":"10 mins","items":["Final Enterprise-Wide AOP: Program + Operations","Committed Impact"]}
            ],
            "attendees": [
                {"function":"Greater China (GRC)","gpl":"YiQiu Chen","platformLead":""},
                {"function":"Innovation and Design","gpl":"Steven Spiele","platformLead":"Michael Baumhackl"},
                {"function":"Medical Office","gpl":"Astrid Smeets","platformLead":"Michael Baumhackl"},
                {"function":"Patient Safety & Quality (PSQ)","gpl":"Philipp Ebbinghaus","platformLead":"Saumya"},
                {"function":"People Function","gpl":"Caroline Lippe (Nico Steyaert)","platformLead":"Saumya"},
                {"function":"Finance","gpl":"Dick Overeem","platformLead":"Martine Vleeshouwers"},
                {"function":"Group Security","gpl":"Gal Gnainsky","platformLead":"Saumya"},
                {"function":"ESG & Legal, Health & Safety","gpl":"Martijn Niekus","platformLead":"Saumya"},
                {"function":"Intellectual Property & Standards","gpl":"Rob Caals","platformLead":"Saumya"},
                {"function":"Communications & Brand","gpl":"Dennis Agusi","platformLead":"Michael Baumhackl"},
                {"function":"Internal Audit","gpl":"Martijn Niekus","platformLead":"Saumya"},
                {"function":"Information Technology (IT)","gpl":"Ryan Kennedy","platformLead":"Saumya"},
                {"function":"International Market (IM)","gpl":"Gunter Koeppen","platformLead":""},
                {"function":"North America (NAM)","gpl":"Ryan Kennedy","platformLead":""}
            ]
        },
        "buLed": {
            "agenda": [
                {"step":1,"title":"Demand Overview","duration":"10 mins","items":["AOP 2026 allocation across AOP Buckets","AOP 2027 AOP Buckets and Funding Type wide Demand: BU Led and Enterprise Wide","Approved Enterprise-Wide Priorities and Committed Impact"]},
                {"step":2,"title":"BU Led Prioritization Scenario","duration":"30 mins","items":["Scenarios for BU Led Demand with committed Impact","Cross-BU portfolio, including Transformation programs with Supply Chain and Service","Strategic direction and trade-off"]},
                {"step":3,"title":"Operations Overview","duration":"10 mins","items":["Operation Demand: Scope and Consumptions with allocations for BU Led Priorities"]},
                {"step":4,"title":"Summary | AOP 2027","duration":"10 mins","items":["Final One Portfolio BU Led and Enterprise AOP: Program + Operations","Committed Impact"]}
            ],
            "attendees": [
                {"bu":"PH","rep":"Dominique Oh","prime":"Victoria Noelle","platformLead":"Michael Baumhackl"},
                {"bu":"EI and I&D","rep":"Christina Murphy","prime":"Vishwanathan Krishnamoorthy","platformLead":"Michael Baumhackl"},
                {"bu":"HPM, CC, S&RC","rep":"Ajay Parkhe / Michael Meissner","prime":"","platformLead":"Ryan Kennedy"},
                {"bu":"PD","rep":"Maria Claudia Renjifo","prime":"","platformLead":"Ryan Kennedy"},
                {"bu":"IGT","rep":"Mark Stoffels","prime":"Tom van Rooij / Douglas Simpson","platformLead":"Ryan Kennedy"},
                {"bu":"Service transformation","rep":"","prime":"Roel van Driel / Alexander v.Boetzelaer","platformLead":"Ryan Kennedy"},
                {"bu":"COO & ISC transformation","rep":"","prime":"Otto te Walvaart","platformLead":"Martine Vleeshouwers"},
                {"bu":"IR","rep":"Minh Nguyen","prime":"","platformLead":"Gunter Koeppen"},
                {"bu":"NAM","rep":"Joe Donlan","prime":"","platformLead":"Ryan Kennedy"},
                {"bu":"GCR","rep":"Kent Cheng","prime":"","platformLead":"YiQui Chen"},
                {"bu":"Finance","rep":"N.A.","prime":"","platformLead":"Martine Vleeshouwers"}
            ]
        }
    }
}
ops_json = json.dumps(ops_blob, ensure_ascii=False, separators=(',',':'))
ops_tag = f'\n<script type="application/json" id="ops-data">{ops_json}</script>'
insert_pos = html.find('</script>', html.find('id="source-data"')) + len('</script>')
html = html[:insert_pos] + ops_tag + html[insert_pos:]
print(f"Injected ops-data ({len(ops_json)} chars)")

# Patch title
html = html.replace('<title>AOP 2027 | Philips IT Portfolio Scenario Modelling</title>',
                     '<title>AOP 2027 | Philips IT One Portfolio Dashboard</title>')
html = html.replace("Evidence-led portfolio", "One Portfolio \xb7 Evidence-led")

# Patch tabNames
old_tabs = "tabNames={scenario:'AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',overview:'AOP2027 : Overview'}"
new_tabs = "tabNames={portfolio:'One Portfolio',scenario:'Program Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',conferences:'Conferences',overview:'AOP2027 : Overview'}"
if old_tabs in html:
    html = html.replace(old_tabs, new_tabs)
    print("Patched tabNames")
else:
    print("WARNING: tabNames not patched")

# Patch IndexedDB
html = html.replace("Philips-AOP2027-v3.5", "Philips-AOP2027-v4.0")

# Inject v4.0 extension code (One Portfolio, Operations, Conferences tabs)
# Read the extension code from the build_v4.py (already written)
# We'll inline it here
with open('C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/build_v4.py', 'r', encoding='utf-8') as f:
    build_content = f.read()
# Extract the NEW_CODE block
nc_start = build_content.find('NEW_CODE = r"""') + len('NEW_CODE = r"""')
nc_end = build_content.find('"""', nc_start)
new_code = build_content[nc_start:nc_end]

last_script_end = html.rfind('</script>')
html = html[:last_script_end] + new_code + html[last_script_end:]
print(f"Injected v4.0 extension code ({len(new_code)} chars)")

# Write output
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"\nv4.0 written: {len(html)} chars ({len(html)//1024} KB)")
print("Done!")
