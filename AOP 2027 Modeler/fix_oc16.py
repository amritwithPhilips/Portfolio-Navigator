"""Fix OC-16: Per-programme merit score breakdown."""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/AOP2027-OnePortfolio-v4.5.html'
with open(PATH, 'r', encoding='utf-8') as f:
    html = f.read()

OLD = "Weighted merit components</dt><dd>'+r.components.map(dec).join(' / ')+'</dd>"

NEW = (
    "Merit Score Breakdown</dt><dd>"
    "<table style=\"width:100%;border-collapse:collapse;font-size:11px;margin:4px 0\">"
    "<tr style=\"background:var(--dk);color:white\">"
    "<th style=\"padding:5px 8px;text-align:left\">Component</th>"
    "<th style=\"padding:5px 8px;text-align:right\">Raw</th>"
    "<th style=\"padding:5px 8px;text-align:right\">Weight</th>"
    "<th style=\"padding:5px 8px;text-align:right\">Weighted</th>"
    "</tr>"
    "'+['Submitted Benefit','Submitted Priority','Captured Consequence','Decision Band']"
    ".map((n,i)=>'"
    "<tr style=\"border-bottom:1px solid var(--mist)\">"
    "<td style=\"padding:5px 8px\">'+n+'</td>"
    "<td style=\"padding:5px 8px;text-align:right\">'+r.rawComponents[i]+'/'+[50,25,15,10][i]+'</td>"
    "<td style=\"padding:5px 8px;text-align:right\">'+dec(session.settings.weights[i])+'</td>"
    "<td style=\"padding:5px 8px;text-align:right;font-weight:700\">'+dec(r.components[i])+'</td>"
    "</tr>').join('')+'"
    "<tr style=\"background:var(--lt);font-weight:700\">"
    "<td style=\"padding:5px 8px\">Total</td><td></td>"
    "<td style=\"text-align:right\">100</td>"
    "<td style=\"padding:5px 8px;text-align:right\">'+dec(r.score)+'</td>"
    "</tr></table></dd>"
)

if OLD in html:
    html = html.replace(OLD, NEW, 1)
    print("[OK] OC-16: Labelled score breakdown table")
else:
    print("[FAIL] Pattern not found")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written: {len(html)} chars")
