from pathlib import Path
import json,hashlib,shutil,datetime
D=Path(__file__).parent;ROOT=Path(r'C:\Users\320126040\Documents\Codex\AOP2027');M=ROOT/'AOP 2027 Modeler';R=M/'Data file/ExCo-20260930-v5.10.0'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
summary=json.loads((D/'audit/validation-summary.json').read_text());assert summary['assertions']==summary['passed'] and all(x['checks']==x['passed'] and not x['fatal'] for x in summary['suites'])
assert json.loads((D/'audit/visual-review.json').read_text(encoding='utf-8-sig'))['passed']
previous=json.loads((D.parent/'exco-customization-20260930/Publication-receipt.json').read_text())
protected=previous['protected']+[{'file':str(M/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html'),'sha256':json.loads((D/'audit/build-provenance.json').read_text())['baselineSha256']}]
for x in protected:assert sha(Path(x['file']))==x['sha256'],x['file']
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');backup=ROOT/'Backups'/('exco-v5.10.0-'+stamp);published=[]
def copy(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():
  old=backup/dst.relative_to(ROOT);old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
 shutil.copy2(src,dst);published.append({'file':str(dst),'sha256':sha(dst)})
for src in D.rglob('*'):
 if not src.is_file() or any(x in src.parts for x in ['__pycache__','support']):continue
 if src.name in ['test-restore.json','portable.json','corrupt.json','Publication-receipt.json','previous-app.js']:continue
 if src.parent==D/'audit' and src.name.startswith('validation-') and src.suffix=='.xlsx':continue
 copy(src,R/src.relative_to(D))
copy(D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.10.0.html',M/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.10.0.html')
support=D/'support';support.mkdir(exist_ok=True)
for name in ['ExCo-QA-report-v5.10.0.html','ExCo-PRD-and-Requirements-v5.10.0.html','Execution-log-v5.10.0.html']:
 text=(D/name).read_text(encoding='utf8').replace('<meta charset="utf-8">','<meta charset="utf-8"><base href="Data file/ExCo-20260930-v5.10.0/">',1);src=support/name;src.write_text(text,encoding='utf8');copy(src,M/name)
prd=(D/'ExCo-PRD-and-Requirements-v5.10.0.html').read_text(encoding='utf8').replace('<meta charset="utf-8">','<meta charset="utf-8"><base href="../AOP 2027 Modeler/Data file/ExCo-20260930-v5.10.0/">',1);(support/'prd.html').write_text(prd,encoding='utf8');copy(support/'prd.html',ROOT/'PRD/AOP2027-Modeler-PRD-and-Requirements-v5.10.0.html')
note='''# Current release v5.10.0 — ExCo correction build

30 September 2026. Current modeler: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.10.0.html. Preserves v5.7.0, v5.8.0, v5.9.0 and both source workbooks.

Restores Tab 2 Carryover ROI slider and numeric input, 0–10x in 0.5 steps. Confirmed Must Do/Must Have baselines remain ROI-exempt at min(request, approved baseline). For other carryovers, 10x is baseline-only; lower thresholds admit otherwise eligible requests with benefit/request at least the threshold. At 0x there is no ratio filter. Default 10x retains Optimal 99.963 M€ base funding and 575.467463 M€ total IT. Old portable scenarios lacking carryPolicy retain baseline-only eligibility until the ROI control is edited. New settings record carryPolicy roi-v1. Submitted lifetime benefit/request is not annual cash ROI.

Overall State replaces Company position and the all-leaders option. ExCo Compare options is removed. My portfolio, Decisions and Funding opportunities show direct Opt in / Opt out / Partial funding / Automatic actions, with preview, rationale, undo and finalized-state lock. Requested budget, Hard Benefits and score sort both ways. Missing hard benefit sorts last. ExCo reuses the detailed-tabs bubble chart renderer; axis and color synchronize both ways.

Scenario Excel downloads select current or saved revision and complete / inclusions / current filters. Downloading a snapshot never changes the live scenario. Filenames and Scenario Selection identify scenario and revision. Selected Programs contains the requested rows; finance/source evidence remains full-scenario. Tab 2 retains current download and adds downloads next to saved revisions. All funding decisions share one finance engine and source allocation ledger; 22.6303317536% EW unallocated, separate PMI and fixed Operations remain unchanged.

Validation: COUNT assertions passed, 53 scenario configurations including all 21 ROI positions, original-workbook replay, five explicit correction workflows, real saved/current/filtered/inclusion Excel downloads and compatibility checks. Evidence: ExCo-QA-report-v5.10.0.html and Data file/ExCo-20260930-v5.10.0. PRD and requirements: PRD/AOP2027-Modeler-PRD-and-Requirements-v5.10.0.html. Canonical engine and versioned engine-v5.10.0.js are updated.

---
Retained history follows; this section supersedes conflicting carryover ROI and ExCo UI guidance.

'''.replace('COUNT',str(summary['passed']))
for rel in ['AOP 2027 Modeler/CHANGELOG.md','Memory/AOP2027-Demand-Context.md','Skills/references/decision-policy.md','Skills/references/dashboard-design.md','Skills/references/finance-cost-impact.md','Skills/references/live-recommendations.md','Skills/references/prioritization-guardrails.md','Skills/references/data-view-comparison.md']:
 dst=ROOT/rel;src=support/dst.name;src.write_text(note+dst.read_text(encoding='utf8'),encoding='utf8');copy(src,dst)
src=support/'exco-view-v5.10.0.md';src.write_text(note,encoding='utf8');copy(src,ROOT/'Skills/references/exco-view-v5.10.0.md')
src=support/'SKILL.md';txt=(ROOT/'Skills/SKILL.md').read_text(encoding='utf8').replace('v5.9.0','v5.10.0').replace('Version 5.9.0','Version 5.10.0').replace('Valid finance and prioritisation formulas are unchanged from v5.7.0.','Finance allocation formulas are unchanged. The restored carryover ROI lever and compatibility policy are specified in the current decision policy.').replace('P2 includes remaining Carry Over demand; automatic funding requires positive approved baseline and Must Do/Must Have.','P2 includes remaining Carry Over demand. Confirmed Must Do/Must Have baselines are ROI-exempt; other carryovers follow the restored ROI lever (10x baseline-only default).').replace('confirmed carry baseline cap without ROI threshold','confirmed carry baseline cap with ROI exemption and restored 0–10x threshold for other carryovers');src.write_text(txt,encoding='utf8');copy(src,ROOT/'Skills/SKILL.md')
copy(D/'engine.js',ROOT/'Skills/assets/engine-v5.10.0.js');copy(D/'engine.js',ROOT/'Skills/assets/engine.js')
for x in protected:assert sha(Path(x['file']))==x['sha256'],x['file']
for x in published:assert sha(Path(x['file']))==x['sha256'],x['file']
receipt={'version':'5.10.0','published':stamp,'release':str(R),'backup':str(backup),'protected':protected,'files':published,'assertions':summary['passed']}
for dst in [D/'Publication-receipt.json',R/'Publication-receipt.json']:dst.write_text(json.dumps(receipt,indent=2),encoding='utf8')
print(json.dumps({'filesPublished':len(published),'protectedFilesUnchanged':len(protected),'release':str(R),'passed':summary['passed']}))
