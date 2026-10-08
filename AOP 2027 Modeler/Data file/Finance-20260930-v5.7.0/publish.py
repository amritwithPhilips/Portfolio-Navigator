from pathlib import Path
import shutil,json,hashlib,datetime,re
D=Path(__file__).resolve().parent;ROOT=Path(r'C:\Users\320126040\Documents\Codex\AOP2027');Q=D/'audit'
summary=json.loads((Q/'release-summary.json').read_text(encoding='utf8'));assert summary['technicalScore']==100,summary
for filename,expected in [('AOP 2027 Consolidated Live 299262020.xlsx','70480f321fa60e6cba983bf63e72572570b2821ec0a222b604449aafe9f4f470'),('Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx','176a6192da3356bcedd9f2babc8318c45977e7658d03172f9e2cb643d22e4668')]:
 assert hashlib.sha256((ROOT/'AOP 2027 Demand'/filename).read_bytes()).hexdigest()==expected,'Source changed: '+filename
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S');backup=ROOT/'Backups'/('finance-v5.7.0-'+stamp);release=ROOT/'AOP 2027 Modeler'/'Data file'/'Finance-20260930-v5.7.0';receipt=[]
def copy(src,dst):
 assert dst.resolve().is_relative_to(ROOT.resolve())
 if dst.exists():
  b=backup/dst.relative_to(ROOT);b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,b)
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);h=hashlib.sha256(dst.read_bytes()).hexdigest();assert h==hashlib.sha256(src.read_bytes()).hexdigest();receipt.append({'file':str(dst),'sha256':h})
# Preserve the complete reproducible release, original embedded snapshots, ten browser exports and QA logs.
for src in D.rglob('*'):
 if not src.is_file() or 'support' in src.relative_to(D).parts or '__pycache__' in src.relative_to(D).parts:continue
 if src.name in ['test-restore.json','controlled-refresh.xlsx','Publication-receipt.json']:continue
 copy(src,release/src.relative_to(D))
copy(D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html',ROOT/'AOP 2027 Modeler'/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html')
copy(D/'AOP2027-Data-Extract.html',ROOT/'AOP 2027 Demand'/'AOP2027-Data-Extract.html')
for name in ['AOP2027-Modeler-PRD-v5.7.0.docx','AOP2027-Modeler-Detailed-Requirements-v5.7.0.docx']:copy(D/name,ROOT/'PRD'/name)
for src in (D/'support').rglob('*'):
 if src.is_file():copy(src,ROOT/src.relative_to(D/'support'))
# Convenient report entry points route relative evidence links to the full release folder.
for name in ['QA-report.html','Detailed-data-comparison.html']:
 original=(D/name).read_text(encoding='utf8');text=original.replace('<head>','<head><base href="Data file/Finance-20260930-v5.7.0/">') if '<head>' in original else original.replace('<meta charset="utf-8">','<meta charset="utf-8"><base href="Data file/Finance-20260930-v5.7.0/">',1)
 temp=D/('published-'+name);temp.write_text(text,encoding='utf8');copy(temp,ROOT/'AOP 2027 Modeler'/name)
(D/'Publication-receipt.json').write_text(json.dumps({'published':stamp,'backup':str(backup),'release':str(release),'files':receipt},indent=2),encoding='utf8')
print(json.dumps({'published':len(receipt),'backup':str(backup),'release':str(release)}))
