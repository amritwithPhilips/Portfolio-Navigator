from pathlib import Path
import json,hashlib,shutil,datetime,html
D=Path(__file__).resolve().parent;Q=D/'audit';ROOT=Path(r'C:\Users\320126040\Documents\Codex\AOP2027');MODEL=ROOT/'AOP 2027 Modeler';RELEASE=MODEL/'Data file'/'ExCo-20260930-v5.8.0';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
summary=json.loads((Q/'validation-summary.json').read_text(encoding='utf8'));assert summary['assertions']==summary['passed'] and len(summary['suites'])==9
for s in summary['suites']:assert not s[4],s
assert json.loads((Q/'visual-review.json').read_text())['complete']
protected=[(MODEL/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html','0ed72652f4e4ff09c7fd28de45749bcc21e61989f35a36b4d92d32b698dbb949'),(ROOT/'AOP 2027 Demand'/'AOP 2027 Consolidated Live 299262020.xlsx','70480f321fa60e6cba983bf63e72572570b2821ec0a222b604449aafe9f4f470'),(ROOT/'AOP 2027 Demand'/'Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx','176a6192da3356bcedd9f2babc8318c45977e7658d03172f9e2cb643d22e4668')]
for p,h in protected:assert sha(p)==h,p
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');BACKUP=ROOT/'Backups'/('exco-v5.8.0-'+stamp);receipt=[]
def copy(src,dst):
 assert dst.resolve().is_relative_to(ROOT.resolve()) and dst not in [p for p,h in protected]
 if dst.exists():
  b=BACKUP/dst.relative_to(ROOT);b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,b)
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);assert sha(src)==sha(dst);receipt.append({'file':str(dst),'sha256':sha(dst)})
support=D/'support';support.mkdir(exist_ok=True)
note=f'''# Current release v5.8.0 — ExCo view, 30 September 2026

New build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html. The v5.7.0 HTML and source workbooks remain byte-for-byte unchanged. Open in the ExCo decision view; Six-tab workbench preserves all six detailed tabs. One current scenario and one finance ledger drive both surfaces.

Company position, My portfolio, Compare options and Decisions provide leader ownership filters, receiving organisation costs, live current-to-recommended funding deltas, preview/apply/cancel with stale-revision protection, save/export/finalise/fork and undo. Imported request and merit reviews now enforce valid numeric ranges and rationale. Valid funding and scoring results match v5.7.0.

Validation: {summary['passed']}/{summary['assertions']} assertions passed across 32 scenarios, 69,280 independent source field comparisons, all 16 leaders, 32 Excel exports, changed-source refresh and 649 extract column filters. Recommendation: retain default 100 M€ Optimal; best among 135 tested lever settings preserving baseline-funded LFR/carry and baseline Sustain. Base funding 99.963 M€; PMI 5.19 M€; Operations 470.314463039 M€; total IT 575.467463039 M€. This finite merit search is not a global delivery/cash optimisation.

Unchanged finance rules: BU row 276 is a percentage key, not 40 M€ demand. Retain 22.6303317536% EW unallocated. Carry uses confirmed approved baseline caps with no ROI threshold. Benefits remain accepted; hard/soft lifetime claims stay separate. Other BU unallocated 1.822 M€ remains explicit.

Evidence: ExCo-QA-report-v5.8.0.html and ExCo-architecture-v5.8.0.html in AOP 2027 Modeler; reproducible release under Data file/ExCo-20260930-v5.8.0. PRD and detailed requirements v5.8.0 ExCo Addenda supplement the unchanged v5.7.0 specifications. Technical gaps and source balances are in the report; no new approval or formal handoff gate is introduced.

---
Retained release history below; the section above governs the current view and version.

'''
for rel in ['AOP 2027 Modeler/CHANGELOG.md','Memory/AOP2027-Demand-Context.md']:
 src=ROOT/rel;dst=support/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(note+src.read_text(encoding='utf8'),encoding='utf8')
rel='Skills/SKILL.md';s=(ROOT/rel).read_text(encoding='utf8');s=s.replace('[engine.js](assets/engine.js)','[engine-v5.8.0.js](assets/engine-v5.8.0.js)').replace('Engine v5.7.0 also exports','Engine v5.8.0 also exports');s=s.replace('## Domain comprehension references','## Current ExCo view\n\nVersion 5.8.0 opens in the ExCo decision view above the six detailed tabs. Read [exco-view-v5.8.0.md](references/exco-view-v5.8.0.md) for architecture, recommendation and verification. Valid finance and prioritisation formulas are unchanged from v5.7.0.\n\n## Domain comprehension references',1)
dst=support/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(s,encoding='utf8')
dst=support/'Skills/references/exco-view-v5.8.0.md';dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(note+'\nAccountable ExCo ownership and receiving-BU charges must remain separate. Compare options uses baseline source merit for all compared scenarios. Recommendation usage saves the old scenario and creates a new child draft. The recommendation source hash must match the current Programs source. Operations allocation is invariant across these scenario changes.\n',encoding='utf8')
dst=support/'Skills/assets/engine-v5.8.0.js';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(D/'engine.js',dst)
events=[]
for phase,detail,file in [('Build','Created new v5.8.0 with shared ExCo view; v5.7.0 preserved.','build-provenance.json'),('Source validation','32 scenarios and 69,280 record fields independently reconciled.','oracle-qa.json'),('Recommendation','135 candidates; default Optimal remains best under balanced constraints.','optimization.json'),('Browser validation','Six tabs, ExCo controls, configuration changes and recovery passed.','exco-qa.json'),('Excel validation','32 downloaded workbooks reconciled to source-linked Programs and finance ledgers.','export-qa.json'),('Release gate',f"{summary['passed']}/{summary['assertions']} assertions passed; source balances and scope limitations documented.",'validation-summary.json')]:
 events.append({'timestamp':datetime.datetime.fromtimestamp((Q/file).stat().st_mtime).isoformat(timespec='seconds'),'phase':phase,'detail':detail})
(D/'Execution-log-v5.8.0.jsonl').write_text('\n'.join(json.dumps(e) for e in events)+'\n',encoding='utf8')
(D/'Execution-log-v5.8.0.html').write_text('<!doctype html><html><meta charset="utf-8"><title>v5.8.0 execution log</title><style>body{font:16px Calibri,Arial;margin:40px;color:#123}li{margin:20px 0}</style><h1>AOP 2027 v5.8.0 execution log</h1><ol>'+''.join('<li><b>'+html.escape(e['phase'])+'</b> · '+e['timestamp']+'<p>'+html.escape(e['detail'])+'</p></li>' for e in events)+'</ol><p><a href="ExCo-QA-report-v5.8.0.html">Validation report and gaps</a></p></html>',encoding='utf8')
excluded={'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html','default.json','test-restore.json','exco-restore.json','portable.json','corrupt-portable.json','controlled-refresh.xlsx','Publication-receipt.json'}
for src in D.rglob('*'):
 if not src.is_file() or src.name in excluded or 'support' in src.relative_to(D).parts or '__pycache__' in src.relative_to(D).parts or src.name.startswith('published-'):continue
 copy(src,RELEASE/src.relative_to(D))
copy(D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html',MODEL/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html')
for src in D.glob('*v5.8.0-ExCo-Addendum.docx'):copy(src,ROOT/'PRD'/src.name)
for name in ['ExCo-QA-report-v5.8.0.html','ExCo-architecture-v5.8.0.html','Execution-log-v5.8.0.html']:
 s=(D/name).read_text(encoding='utf8').replace('<meta charset="utf-8">','<meta charset="utf-8"><base href="Data file/ExCo-20260930-v5.8.0/">',1);p=D/('published-'+name);p.write_text(s,encoding='utf8');copy(p,MODEL/name)
for src in support.rglob('*'):
 if src.is_file():copy(src,ROOT/src.relative_to(support))
for p,h in protected:assert sha(p)==h,p
result={'published':stamp,'release':str(RELEASE),'backup':str(BACKUP),'protectedFiles':[{'path':str(p),'sha256':h,'unchanged':True} for p,h in protected],'files':receipt}
(D/'Publication-receipt.json').write_text(json.dumps(result,indent=2),encoding='utf8');shutil.copy2(D/'Publication-receipt.json',RELEASE/'Publication-receipt.json')
print(json.dumps({'publishedFiles':len(receipt),'release':str(RELEASE),'protectedFilesUnchanged':True}))
