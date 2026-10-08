import json,re
from pathlib import Path
D=Path(__file__).parent;B=D.parent/'refresh-20260929'
h=(B/'AOP2027-Data-Extract.html').read_text(encoding='utf8');old=json.loads(re.search(r'id="extract-data">([\s\S]*?)</script>',h)[1]);ds=[]
p=json.loads((D/'audit/default.json').read_text(encoding='utf8'));sc=json.loads((D/'audit/scenarios.json').read_text(encoding='utf8'));data=p['data'];r=sc['scenarios'][0]['result']
def add(name,records,description,keys=None):
 keys=keys or list(dict.fromkeys(k for row in records for k in row))
 ds.append({'name':name,'columns':keys,'rows':[[json.dumps(x.get(k),ensure_ascii=False) if isinstance(x.get(k),(dict,list)) else x.get(k) for k in keys] for x in records],'description':description})
keys=old['datasets'][0]['columns']
add('Programs',r['rows'],'Active Programs; M€ amounts. Default 100 M€ Optimal scenario with PMI on top. User-validated benefits participate in scoring.',keys)
for t in old['datasets']:
 if t['name'].startswith('Operations') and t['name']!='Operations changes':ds.append(t)
add('Excluded Programs',data['excludedRecords'],'Original excluded records: nine missing requests and four uninterpretable decisions. Excluded from active demand.', ['id','name','cost','overall','decisionBand','exclusionReason','sourceSheet','sourceRow'])
add('EW charging key',[{'recipient':k,'rawFraction':v,'confirmedScale':1000,'effectivePercent':v*100000,'sourceCell':data['ewChargingKey']['allocationSources'][k]['cell'],'sourceSheet':'BU','sourceRow':276} for k,v in data['ewChargingKey']['allocations'].items()],'Allocation key only. The 40 M€ amount is excluded from demand. Unallocated remains 22.63033175355452%.')
add('Finance ledger',r['finance']['ledger'],'Default scenario; exact Programs and Operations allocation with recipient, source hash, request/baseline and charging cells.')
add('Recipient IT allocation',r['finance']['rows'],'Exact M€; own Operations, Regions and Functions are components of one recipient charge, not additional sender costs.')
add('Scenario results',[{'scenario':s['name'],'budget':s['settings']['budget'],'baseFunded':s['result']['totals']['allocation'],'ewFunded':s['result']['streams']['ew']['allocation'],'buFunded':s['result']['streams']['bu']['allocation'],'pmi':s['result']['pmi']['funded'],'operations':s['result']['finance']['totals']['operations'],'totalIT':s['result']['finance']['totals']['total'],'unallocated':next(x['total'] for x in s['result']['finance']['rows'] if x['recipient']=='Unallocated')} for s in sc['scenarios']],'Ten independently reconciled scenarios. Includes deliberate manual overspend where applicable.')
for s in data['workbook']['sheets']:
 if s['name'] not in ['EW','BU']:continue
 hi=next(i for i,row in enumerate(s['rows'][:10]) if 'Item No.' in row);header=s['rows'][hi]
 ds.append({'name':'Programs raw '+s['name'],'columns':['Source row']+[str(i+1)+': '+str(v or '(unlabelled)') for i,v in enumerate(header)],'rows':[[i+1]+row for i,row in enumerate(s['rows']) if i>hi and any(v is not None for v in row)],'description':'Complete original cached source values, including excluded evidence and allocation-key row. Units follow source headers.'})
 add('Programs formulas '+s['name'],[{'Cell':c,'Formula':f} for c,f in s['formulas'].items()],'Original formulas, not recalculated by the extract.')
add('Source manifest',[{'Source':'Programs','File':data['sourceFile'],'SHA256':data['sourceHash']},{'Source':'Operations','File':r['finance']['ledger'][-1]['sourceFile'],'SHA256':r['finance']['ledger'][-1]['sourceHash']}],'Original workbooks unchanged.')
add('Allocation exceptions',[{'ID':'EW key','AmountME':next(x['ew'] for x in r['finance']['rows'] if x['recipient']=='Unallocated'),'Meaning':'Confirmed 22.63033175355452% unallocated EW share'},{'ID':'Bu-06','AmountME':.465,'Meaning':'Source percentages allocate 78.86363636%; balance retained as Unallocated'},{'ID':'Indirect Cross BU','AmountME':1.357,'Meaning':'Source explicitly assigns to Not allocated to BU'}],'These amounts remain included in total IT; no invented recipient assignments.')
payload=json.dumps({'datasets':ds},ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
h=re.sub(r'(<script type="application/json" id="extract-data">)[\s\S]*?(</script>)',lambda m:m[1]+payload+m[2],h,count=1)
h=h.replace('v5.6.1','v5.7.0').replace('29 September 2026 source refresh','30 September 2026 finance build').replace('287.1229','285.2129').replace('464 source records','433 active Programs').replace('99.984','99.963')
h=re.sub(r'<p class="warning">[\s\S]*?</p>','<p class="note">EW charging retains the confirmed unallocated share. All active Programs and allocation evidence are filterable below; excluded source rows remain in their separate audit dataset.</p>',h,count=1)
h=h.replace('f3d2dd19319d6143b75f4efaf133f7445e56a6081409e9a3256ddb23d65b3691',data['sourceHash'])
(D/'AOP2027-Data-Extract.html').write_text(h,encoding='utf8');print('Datasets',len(ds),'filters',sum(len(x['columns']) for x in ds))
