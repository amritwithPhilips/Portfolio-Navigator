import json,math
from pathlib import Path
from openpyxl import load_workbook
D=Path(__file__).parent/'audit';cases=json.loads((D/'scenarios.json').read_text(encoding='utf8'))['scenarios'];checks=[]
source_hash=json.loads((D/'program-source.json').read_text(encoding='utf8'))['sourceHash']
def ck(name,ok,detail=''):checks.append(dict(name=name,passed=bool(ok),detail=detail))
def near(a,b):return abs((a or 0)-(b or 0))<1e-7
for c in cases:
 w=load_workbook(D/'final-exports'/(c['id']+'.xlsx'),read_only=True,data_only=True);r=c['result'];ident=c['id']
 settings=list(w['4. Levers & Settings'].values);roi=next((x for x in settings if x[0]=='Carry-over ROI'),None)
 ck(ident+' restored ROI metadata',roi is not None and near(roi[1],c['settings']['carry']) and 'Confirmed baselines exempt' in roi[3] and not any('No ROI threshold' in str(v) for row in settings for v in row))
 def records(name):
  rows=list(w[name].values);return [dict(zip(rows[0],x)) for x in rows[1:]]
 rows=records('2. Programs');by={x['ID']:x for x in rows}
 ck(ident+' 433 unique Programs',len(rows)==433 and len(by)==433)
 ck(ident+' request funding merit source request',all(near(by[x['id']]['Requested M€'],x['cost']) and near(by[x['id']]['Prioritised M€'],x['final']) and near(by[x['id']]['Merit Score'],x['score']) and near(by[x['id']]['Source request M€'],x['sourceCost']) and near(by[x['id']]['Calculated merit'],x.get('calculatedScore',x['score'])) for x in r['rows']))
 refs={x['Programs ID']:x for x in records('9. Source Reference')}
 ck(ident+' source lineage',all(refs[x['id']]['SHA-256']==source_hash and refs[x['id']]['Sheet']==x['sourceSheet'] and refs[x['id']]['Row']==x['sourceRow'] for x in r['rows']))
 ledger=records('10. Finance Ledger');expected=r['finance']['ledger']
 ck(ident+' full finance ledger exact',len(ledger)==len(expected) and all(all(near(a.get(k),b.get(k)) if isinstance(b.get(k),(int,float)) else (a.get(k) or '')==(b.get(k) or '') for k in a) for a,b in zip(ledger,expected)))
 ck(ident+' finance ledger total',near(sum(x['amount'] for x in ledger),r['finance']['totals']['total']))
 for sheet in ['1. Scenario Overview','3. Cost Summary']:
  rr=list(w[sheet].values);start=next(i for i,x in enumerate(rr) if x[0]=='Organisation (BU Cluster)');data=rr[start+1:start+1+len(r['finance']['rows'])]
  ck(ident+' '+sheet+' recipients',all(x[0]==y['recipient'] and near(x[1],sum(y[z] for z in ['single','cross','indirect','other'])) and near(x[2],y['ew']) and near(x[3],sum(y[z] for z in ['own','region','functions'])) and near(x[4],y['total']) and near(x[5],y['pmi']) for x,y in zip(data,r['finance']['rows'])))
  ck(ident+' '+sheet+' grand total',near(rr[start+1+len(data)][4],r['finance']['totals']['total']))
 ck(ident+' no Excel errors',not any(cell.data_type=='e' for s in w for row in s for cell in row))
 w.close()
(D/'export-qa.json').write_text(json.dumps({'checks':checks},indent=2),encoding='utf8');print(json.dumps({'checks':len(checks),'passed':sum(x['passed'] for x in checks),'failures':[x for x in checks if not x['passed']]}))
