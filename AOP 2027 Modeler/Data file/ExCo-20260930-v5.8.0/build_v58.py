from pathlib import Path
import re,json,hashlib
D=Path(__file__).parent;B=Path(r'C:\Users\320126040\Documents\Codex\AOP2027\AOP 2027 Modeler\AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html')
h=B.read_text(encoding='utf8');baseline=hashlib.sha256(B.read_bytes()).hexdigest()
h=h.replace("const VERSION='5.7.0'","const VERSION='5.8.0'").replace('v5.7.0','v5.8.0')
needle='for(const id of Object.keys(s.reviews))if(!ids.has(id))throw Error(\'Review refers to missing source ID.\');'
assert needle in h
h=h.replace(needle,"for(const [id,review] of Object.entries(s.reviews)){if(!ids.has(id))throw Error('Review refers to missing source ID.');if(!review||typeof review!=='object')throw Error('Invalid review.');if(review.requested!==undefined&&(!Number.isFinite(review.requested)||review.requested<0))throw Error('Invalid imported requested amount.');if(review.merit!==undefined&&(!Number.isFinite(review.merit)||review.merit<0||review.merit>100||!clean(review.note)))throw Error('Imported merit requires 0–100 and a rationale.');}")
bridge="""
window.AOPApp={
 getState:()=>({session,result,tab}),commit,
 navigate:t=>{if(!Object.hasOwn(tabNames,t))throw Error('Unknown tab');tab=t;render();},
 details,save,exportAll:()=>exportExcel(result.rows,'complete-portfolio'),
 undo:()=>{session=AOP.undo(session);render();persist();},
 tradeoff:(scope,targets)=>{session=AOP.tradeoff(session,scope,targets);render();persist();},
 recommended:async settings=>{await save();const parent=session.id;let next=AOP.createSession(session.data);next.parent=parent;next.name='Recommended company scenario';next=AOP.transact(next,'setting',{settings},'ExCo recommendation');session=next;render();await persist();toast('Recommended draft created; previous scenario saved.');}
};
"""
h=h.replace('function commit(action,details={},origin=tabNames[tab])',bridge+'\nfunction commit(action,details={},origin=tabNames[tab])',1)
h=h.replace('window.__aop={session,result,tab,pending};',"window.__aop={session,result,tab,pending};window.dispatchEvent(new Event('aop:change'));")
opt=json.loads((D/'audit/optimization.json').read_text(encoding='utf8'));payload=json.dumps(opt,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
h=h.replace('</head>','<style>'+ (D/'exco-view.css').read_text(encoding='utf8')+'</style></head>',1)
h=h.replace('</body>','<script type="application/json" id="exco-recommendation">'+payload+'</script><script>'+ (D/'exco-view.js').read_text(encoding='utf8')+'</script></body>',1)
out=D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html';out.write_text(h,encoding='utf8')
scripts=list(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',h,re.I));code=scripts[3][2];start=code.index('(function(root,factory)');end=code.index('(function(root,factory)',start+1)
(D/'engine.js').write_text(code[start:end],encoding='utf8');(D/'app.js').write_text(code,encoding='utf8')
(D/'audit/build-provenance.json').write_text(json.dumps({'baselineFile':str(B),'baselineSha256':baseline,'newFile':out.name,'newSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'changes':['ExCo view above six tabs using shared transaction bridge','Source-based recommendation preview and independent draft creation','Imported requested/merit review validation'],'preserved':'Funding, scoring and allocation formulas; approved EW unallocated share; source snapshots'},indent=2),encoding='utf8')
assert hashlib.sha256(B.read_bytes()).hexdigest()==baseline
print('Built',out.name,'baseline unchanged',baseline)
