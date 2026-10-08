from pathlib import Path
import json,hashlib,shutil,datetime,html
D=Path(__file__).resolve().parent;Q=D/'audit';ROOT=Path(r'C:\Users\320126040\Documents\Codex\AOP2027');MODEL=ROOT/'AOP 2027 Modeler';RELEASE=MODEL/'Data file'/'ExCo-20260930-v5.9.0';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
s=json.loads((Q/'validation-summary.json').read_text(encoding='utf8'));assert s['assertions']==s['passed'] and len(s['suites'])==8 and all(not x['fatal'] for x in s['suites']);assert json.loads((Q/'final-ui-smoke.json').read_text())['passed'];assert json.loads((Q/'visual-review.json').read_text())['complete']
protected=[(MODEL/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html','0ed72652f4e4ff09c7fd28de45749bcc21e61989f35a36b4d92d32b698dbb949'),(MODEL/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html','93e8663293ce296295989f6a81b05fd1b8897a4f765f99276511426d104dc46f'),(ROOT/'AOP 2027 Demand'/'AOP 2027 Consolidated Live 299262020.xlsx','70480f321fa60e6cba983bf63e72572570b2821ec0a222b604449aafe9f4f470'),(ROOT/'AOP 2027 Demand'/'Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx','176a6192da3356bcedd9f2babc8318c45977e7658d03172f9e2cb643d22e4668')]
for p,h in protected:assert sha(p)==h,p
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');backup=ROOT/'Backups'/('exco-v5.9.0-'+stamp);files=[]
def copy(src,dst):
 assert dst.resolve().is_relative_to(ROOT.resolve()) and dst not in [p for p,h in protected]
 if dst.exists():
  b=backup/dst.relative_to(ROOT);b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,b)
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);assert sha(src)==sha(dst);files.append({'file':str(dst),'sha256':sha(dst)})
support=D/'support';support.mkdir(exist_ok=True)
note=f'''# Current release v5.9.0 — ExCo decision workspace

30 September 2026. New build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html. v5.7.0, v5.8.0 and both source workbooks remain unchanged.

ExCo now supports all-priority inclusion/exclusion/automatic decisions, partial scope and scenario request/merit reviews; company-wide budget/lever/weight controls; Demand and quantified Hard Benefits bubbles; searchable normalized and original EW/BU source columns with per-leader layouts; and two-way leader/decision synchronization with the Programs workbench. Operations and receiving-organisation totals remain company-wide. Layouts are scenario-owned and survive save/reload, portable export and forks.

Additional funding is an explicit extra company envelope for one leader and stream. Eligible remaining whole scopes are ranked by priority stage, descending merit, request and ID. Confirmed carry caps, held Programs and manual exclusions are respected. Existing funding is retained through recorded overrides; unused extra remains headroom. These are explicit manual funding decisions above the current lever selection. A preview can release retained decisions back to automatic; Undo restores the entire previous state. Reviewed merit may be blank to use the calculated score.

Savings evidence is submitted productivity lifetime claims for newly funded Programs, separate from revenue and soft claims. Do not infer annual cash savings or benefits from increasing an already funded partial scope. All approved core finance rules remain unchanged, including the EW percentage key, 22.6303317536% unallocated, fixed Operations allocation and separate PMI.

Validation: {s['passed']}/{s['assertions']} assertions passed; 32 existing scenarios; 144 leader/stream/extra-budget combinations, 94 with eligible additions and 50 correctly rejecting an empty plan. Independent workbook replay checks the additional selections and recipient totals. Default remains 99.963 M€ funded base and 575.467463 M€ total IT at the 100 M€ base envelope.

Evidence: ExCo-QA-report-v5.9.0.html and ExCo-PRD-and-Requirements-v5.9.0.html, with scripts, exports and source-linked audit in Data file/ExCo-20260930-v5.9.0. PRD and detailed requirements v5.9.0 ExCo Addenda supplement earlier specifications. Use Skills/assets/engine-v5.9.0.js for this release.

---
Retained history below. The current section governs the new ExCo workflows; unchanged core finance and prioritisation rules remain in force.

'''
for rel in ['AOP 2027 Modeler/CHANGELOG.md','Memory/AOP2027-Demand-Context.md','Skills/references/dashboard-design.md','Skills/references/data-view-comparison.md','Skills/references/live-recommendations.md','Skills/references/finance-cost-impact.md','Skills/references/prioritization-guardrails.md']:
 dst=support/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(note+(ROOT/rel).read_text(encoding='utf8'),encoding='utf8')
rel='Skills/SKILL.md';txt=(ROOT/rel).read_text(encoding='utf8').replace('engine-v5.8.0.js','engine-v5.9.0.js').replace('Engine v5.8.0 also exports','Engine v5.9.0 also exports').replace('Version 5.8.0 opens','Version 5.9.0 opens').replace('exco-view-v5.8.0.md','exco-view-v5.9.0.md');dst=support/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(txt,encoding='utf8')
dst=support/'Skills/references/exco-view-v5.9.0.md';dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(note,encoding='utf8');dst=support/'Skills/assets/engine-v5.9.0.js';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(D/'engine.js',dst)
events=[{'time':datetime.datetime.fromtimestamp((Q/f).stat().st_mtime).isoformat(timespec='seconds'),'phase':phase,'detail':detail} for f,phase,detail in [('build-provenance.json','Build','Created v5.9.0 with leader controls, funding previews, custom columns and shared selection.'),('features-engine-qa.json','Additional funding','144 combinations exercised with state, scope, budget and undo checks.'),('topup-oracle-qa.json','Source reconciliation','94 feasible additional-funding plans independently replayed from source workbooks.'),('features-browser-qa.json','UI validation','Charts, columns, persistence, two-way edits, six-tab totals and lifecycle passed.'),('validation-summary.json','Release gate',str(s['passed'])+' assertions passed; constraints documented.')]]
(D/'Execution-log-v5.9.0.jsonl').write_text('\n'.join(json.dumps(x) for x in events)+'\n',encoding='utf8');(D/'Execution-log-v5.9.0.html').write_text('<!doctype html><html><meta charset="utf-8"><title>ExCo v5.9.0 execution log</title><style>body{font:16px Calibri;margin:40px;color:#123}li{margin:20px 0}</style><h1>AOP 2027 v5.9.0 execution log</h1><ol>'+''.join('<li><b>'+html.escape(x['phase'])+'</b> · '+x['time']+'<p>'+html.escape(x['detail'])+'</p></li>' for x in events)+'</ol><a href="ExCo-QA-report-v5.9.0.html">Validation report</a></html>',encoding='utf8')
excluded={'test-restore.json','portable.json','corrupt-portable.json','controlled-refresh.xlsx','Publication-receipt.json'}
for src in D.rglob('*'):
 if not src.is_file() or src.name in excluded or 'support' in src.relative_to(D).parts or '__pycache__' in src.relative_to(D).parts or src.name.startswith('published-'):continue
 copy(src,RELEASE/src.relative_to(D))
copy(D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html',MODEL/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html')
for src in D.glob('*v5.9.0-ExCo-Addendum.docx'):copy(src,ROOT/'PRD'/src.name)
for name in ['ExCo-QA-report-v5.9.0.html','ExCo-PRD-and-Requirements-v5.9.0.html','Execution-log-v5.9.0.html']:
 txt=(D/name).read_text(encoding='utf8').replace('<meta charset="utf-8">','<meta charset="utf-8"><base href="Data file/ExCo-20260930-v5.9.0/">',1);temp=D/('published-'+name);temp.write_text(txt,encoding='utf8');copy(temp,MODEL/name)
for src in support.rglob('*'):
 if src.is_file():copy(src,ROOT/src.relative_to(support))
for p,h in protected:assert sha(p)==h,p
receipt={'published':stamp,'release':str(RELEASE),'backup':str(backup),'protected':[{'file':str(p),'sha256':h} for p,h in protected],'files':files};(D/'Publication-receipt.json').write_text(json.dumps(receipt,indent=2),encoding='utf8');shutil.copy2(D/'Publication-receipt.json',RELEASE/'Publication-receipt.json');print(json.dumps({'filesPublished':len(files),'protectedFilesUnchanged':4,'release':str(RELEASE)}))
