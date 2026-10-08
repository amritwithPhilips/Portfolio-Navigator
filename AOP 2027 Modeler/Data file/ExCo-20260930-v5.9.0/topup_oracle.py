from pathlib import Path
import json,collections
from openpyxl import load_workbook
D=Path(__file__).parent;Q=D/'audit';ns={'__file__':str(D/'oracle.py')};src=(D/'oracle.py').read_text(encoding='utf8');exec(compile(src[:src.index('for case in scenarios:')],str(D/'oracle.py'),'exec'),ns)
baseline=ns['scenarios'][0];settings=baseline['settings'];funds={r['id']:r['final'] for r in baseline['result']['rows']};owners={r['id']:r['exco'] for r in baseline['result']['rows']};records={r['id']:ns['enrich'](r,settings,{}) for r in ns['records']};data=json.loads((Q/'features-engine-qa.json').read_text(encoding='utf8'));checks=[]
def ck(name,passed,detail=''):checks.append({'name':name,'passed':bool(passed),'detail':detail})
def near(a,b):return abs(a-b)<1e-7
for c in data['topupCases']:
 candidates=[r for r in records.values() if ns['key'](r['type'])!='pmi' and owners[r['id']]==c['leader'] and (c['stream']=='all' or c['stream']==r['stream']) and not r['held'] and (r['cap'] if r['stage']==1 else r['cost'])>funds[r['id']]+1e-9]
 candidates.sort(key=lambda r:(r['stage'],-r['score'],r['cost'],r['id'].lower()));add={};spent=0
 for r in candidates:
  amount=ns['rnd']((r['cap'] if r['stage']==1 else r['cost'])-funds[r['id']])
  if spent+amount<=c['extra']+1e-9:add[r['id']]=amount;spent=ns['rnd'](spent+amount)
 actual={x['id']:x['amount'] for x in c['additions']};prefix=f"{c['leader']} {c['stream']} {c['extra']}"
 ck(prefix+' independent selection',set(add)==set(actual) and all(near(v,actual[k]) for k,v in add.items()) and near(spent,c['spent']))
 expected=collections.defaultdict(float)
 for r in records.values():
  funded=funds[r['id']]+add.get(r['id'],0)
  if ns['key'](r['type'])=='pmi':expected['PMI on top']+=funded;continue
  ew=r['stream']=='ew' or ns['match']('type iii|enterprise wide',r['type']);alloc=ns['charging']['alloc'] if ew else r['alloc'];frac={k:v*(1000 if ew else 1) for k,v in alloc.items()}
  if sum(frac.values())>1+1e-8:expected['Unallocated']+=funded;continue
  for n,v in frac.items():expected[ns['mp'].get(n,'Unallocated')]+=funded*v
  if 1-sum(frac.values())>1e-9:expected['Unallocated']+=funded*(1-sum(frac.values()))
 for row in ns['tco'][3:30]:
  if not str(row[1]).startswith('-'):expected[str(row[1]).strip()]+=row[6]+row[7]+row[8]
 ck(prefix+' independent recipient totals',all(near(expected[r['recipient']],r['total']) for r in c['recipients']))
browser=json.loads((Q/'topup-browser-result.json').read_text(encoding='utf8'));w=load_workbook(Q/'topup-export.xlsx',read_only=True,data_only=True)
def rows(sheet):
 a=list(w[sheet].values);return [dict(zip(a[0],r)) for r in a[1:]]
p={r['ID']:r for r in rows('2. Programs')};r=browser['result'];ck('Browser top-up export funded amounts',len(p)==433 and all(near(p[x['id']]['Prioritised M€'],x['final']) for x in r['rows']))
ledger=rows('10. Finance Ledger');ck('Browser top-up export total finance',near(sum(x['amount'] for x in ledger),r['finance']['totals']['total']));ck('Browser top-up export source references',len(rows('9. Source Reference'))==433)
w.close();(Q/'topup-oracle-qa.json').write_text(json.dumps({'checks':checks,'sourceReadDirectly':True,'cases':len(data['topupCases'])},indent=2),encoding='utf8');print(json.dumps({'checks':len(checks),'passed':sum(x['passed'] for x in checks),'failures':[x for x in checks if not x['passed']]}))
