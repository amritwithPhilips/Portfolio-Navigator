// Source-led allocation. This function is shared by UI, exports and scenario QA.
function finance(data,result,ops){
 const clusters=['Personal Health','Connected Care','Precision Diagnosis','Image Guided Therapy','EI','Innovation & Design','Int. Property & Standards'];
 const mapping={'Imaging Informatics':'EI','Clinical Informatics':'EI','EI Other':'EI','AMD':'Connected Care','HPM':'Connected Care','S&RC':'Connected Care','I&D':'Innovation & Design','IP and S':'Int. Property & Standards','IGT-D':'Image Guided Therapy','IGT-S':'Image Guided Therapy','MR':'Precision Diagnosis','CT':'Precision Diagnosis','DXR':'Precision Diagnosis','PD Other':'Precision Diagnosis','US':'Precision Diagnosis','G and B':'Personal Health','MCC':'Personal Health','OHC':'Personal Health','PH Other':'Personal Health','Not allocated':'Unallocated'};
 const ledger=[],issues=[],by={};
 const get=k=>by[k]||(by[k]={recipient:k,single:0,cross:0,indirect:0,other:0,ew:0,own:0,region:0,functions:0,pmi:0,total:0});clusters.forEach(get);get('Unallocated');get('PMI on top');
 const ewKey=data.ewChargingKey,rawKey=ewKey?.allocations||{},rawSum=Object.values(rawKey).reduce((a,b)=>a+b,0);
 // The user confirmed the 1,000x correction for the 0.1% source key, including Not allocated.
 const keyScale=Math.abs(rawSum-.001)<1e-10?1000:Math.abs(rawSum-1)<1e-8?1:null;
 const keyValid=keyScale!==null&&Object.values(rawKey).every(v=>Number.isFinite(v)&&v>=0);
 if(!keyValid)issues.push({id:ewKey?.id||'EW key',reason:'EW key missing or unexpected percentage total',value:rawSum});
 const ref=(r,field)=>{const m=data.mappings.find(m=>m.sheet===r.sourceSheet);return m?`${r.sourceSheet}!${col(m.fields[field])}${r.sourceRow}`:null;};
 const write=(r,bucket,name,amount,fraction,keyRef,reason)=>{
  const recipient=mapping[name]||(['Unallocated','PMI on top'].includes(name)?name:'Unallocated'),g=get(recipient);g[bucket]+=amount;g.total+=amount;
  ledger.push({pillar:'Programs',id:r.id,name:r.name,type:r.type,origin:r.org,stream:r.stream,recipient,subRecipient:name,bucket,requested:r.cost,sourceRequested:r.sourceCost??r.cost,funded:r.final,fraction,amount,reason,sourceFile:data.sourceFile,sourceHash:data.sourceHash,sourceSheet:r.sourceSheet,sourceRow:r.sourceRow,requestCell:ref(r,'cost'),baselineCell:ref(r,'baselined'),keyCell:keyRef||'',scenarioScore:r.score});
 };
 for(const r of result.rows){
  if(!(r.final>0))continue;
  if(r.isPmi){write(r,'pmi','PMI on top',r.final,1,'','Outside base budget; no BU charge');continue;}
  const enterprise=r.stream==='ew'||/type iii|enterprise wide/i.test(r.type);
  const bucket=enterprise?'ew':/indirect/i.test(r.type)?'indirect':/type ii\b|cross/i.test(r.type)?'cross':/type i\b|single/i.test(r.type)?'single':'other';
  const allocation=enterprise?(keyValid?rawKey:{}):(r.allocations||{}),scale=enterprise?(keyScale||1):1;
  const total=Object.values(allocation).reduce((a,v)=>a+v*scale,0);
  if(total>1+1e-8||Object.values(allocation).some(v=>!Number.isFinite(v)||v<0)){
   write(r,bucket,'Unallocated',r.final,1,'','Invalid allocation percentages');issues.push({id:r.id,reason:'Invalid allocation percentages',value:total});continue;
  }
  let allocated=0;
  for(const [name,raw] of Object.entries(allocation)){
   const fraction=raw*scale;if(!(fraction>0))continue;
   const amount=r.final*fraction;allocated+=amount;
   const owner=enterprise?ewKey:r,field=(owner.allocationSources||{})[name];
   write(r,bucket,name,amount,fraction,field?`${owner.sourceSheet}!${field.cell}`:'',enterprise?'Confirmed EW charging key':name==='Not allocated'?'Source explicitly unallocated':'Source spend-allocation percentage');
  }
  const remainder=r.final-allocated;
  if(remainder>1e-9){write(r,bucket,'Unallocated',remainder,remainder/r.final,'','Source allocation remainder');issues.push({id:r.id,reason:'Source allocation remainder',value:remainder});}
 }
 for(const t of ops?.operations?.tco||[]){
  if(t.bu.startsWith('-'))continue;const g=get(t.bu);
  for(const [bucket,field,column] of [['own','ownConsumption','G'],['region','regionAlloc','H'],['functions','functionAlloc','I']]){
   const amount=t[field]||0;g[bucket]+=amount;g.total+=amount;
   ledger.push({pillar:'Operations',id:t.bu,name:t.bu,type:bucket,origin:bucket==='own'?t.bu:bucket==='region'?'Regions':'Functions',recipient:t.bu,subRecipient:t.bu,bucket,amount,sourceFile:ops.meta.sourceFile,sourceHash:ops.meta.sourceHash,sourceSheet:t.sourceSheet,sourceRow:t.sourceRow,keyCell:`${t.sourceSheet}!${column}${t.sourceRow}`,reason:'Bill of IT recipient allocation; sender costs not added again'});
  }
 }
 const rows=Object.values(by),totals={};for(const k of ['single','cross','indirect','other','ew','own','region','functions','pmi','total'])totals[k]=rows.reduce((s,r)=>s+r[k],0);
 totals.programs=totals.single+totals.cross+totals.indirect+totals.other+totals.ew+totals.pmi;
 totals.operations=totals.own+totals.region+totals.functions;
 const expected=result.totals.allocation+(result.pmi?.funded||0)+(ops?.meta?.opsTotal2027||0);
 return {rows,ledger,issues,totals,expected,reconciled:Math.abs(totals.total-expected)<1e-8,ewKey:{sourceRow:ewKey?.sourceRow,sourceSheet:ewKey?.sourceSheet,rawSum,scale:keyScale,valid:keyValid,unallocatedShare:(rawKey['Not allocated']||0)*(keyScale||0),fractions:Object.fromEntries(Object.entries(rawKey).map(([k,v])=>[k,v*(keyScale||0)]))}};
}
