/* Data QA harness. Validates a workbook object before the engine touches it. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOPDataQA=api;})(globalThis,function(){
'use strict';
const clean=x=>x==null?'':String(x).replace(/[​ ]/g,' ').replace(/\s+/g,' ').trim();
const key=x=>clean(x).toLowerCase().replace(/[—–]/g,'-');
const num=x=>{if(typeof x==='number'&&Number.isFinite(x))return x;if(typeof x==='string'&&/^-?\d+(?:\.\d+)?$/.test(x.trim()))return Number(x);return null;};

const REQUIRED_COLUMNS=[
 ['item no.'],['planisware id'],['organization setting demand [bu, region, coe]'],['organization'],
 ['initiative name'],['type'],['new initiative or carry-over'],['carry-over','carry over'],
 ['category'],['leading it platform'],['investment area'],['priority'],
 ['it investment requested 2027 [k€]','it investment requested 2027 [keur]','it investment'],
 ['quantified benefits (in k€)','quantified benefits (in keur)','quantified benefits'],
 ['impact and cost of not doing'],['problem statement'],['scope'],
 ['overall aop decision'],['decision band','waste']
];

const BASELINE={rows:509,demand:279.595,ewRows:180,buRows:329};

function findSheet(wb,name){return (wb.sheets||[]).find(s=>key(s.name)===key(name));}

function matchColumn(headers,aliases){
 const hk=headers.map(h=>key(h));
 for(const alias of aliases){const ix=hk.findIndex(h=>h===alias||h.includes(alias));if(ix>=0)return ix;}
 return -1;
}

function costIndex(headers){
 const hk=headers.map(h=>key(h));
 return hk.findIndex(h=>h.includes('it investment')&&h.includes('requested'));
}

function validate(workbook,previous){
 const checks=[],add=(name,severity,status,detail)=>checks.push({name,severity,status,detail});
 const summary={rows:0,ewRows:0,buRows:0,totalDemand:0,hpmRows:0,hpmDemand:0,orgs:new Set(),decisionBands:{filled:0,blank:0},duplicateIds:[]};

 const ew=findSheet(workbook,'EW');
 const bu=findSheet(workbook,'Bu');

 add('Sheet EW exists','critical',ew?'PASS':'FAIL',ew?((ew.rows||[]).length-3)+' data rows (excl. headers)':'Sheet named "EW" not found');
 add('Sheet Bu exists','critical',bu?'PASS':'FAIL',bu?((bu.rows||[]).length-3)+' data rows (excl. headers)':'Sheet named "Bu" not found');

 if(!ew||!bu)return {status:'FAIL',checks,summary};

 const sheets=[{sh:ew,stream:'ew'},{sh:bu,stream:'bu'}];
 let missingCols=[],negativeCosts=0,ids=new Set(),dupes=[];
 let totalCostK=0,maxRatio=0,benefitCount=0;

 for(const {sh,stream} of sheets){
  const header=(sh.rows[0]||[]).map(h=>clean(h));
  for(const aliases of REQUIRED_COLUMNS){
   if(matchColumn(header,aliases)===-1){
    const label=aliases[0];
    if(!missingCols.includes(label))missingCols.push(label);
   }
  }
  const ci=costIndex(header);
  const itemIdx=matchColumn(header,['item no.']);
  const orgIdx=matchColumn(header,['organization setting demand [bu, region, coe]','organization']);
  const bandIdx=header.findIndex(h=>{const k=key(h);return k==='decision band'||k.includes('waste');});
  const benIdx=matchColumn(header,['quantified benefits (in k€)','quantified benefits (in keur)','quantified benefits']);

  for(let i=3;i<sh.rows.length;i++){
   const row=sh.rows[i]||[];
   const item=clean(row[itemIdx]);
   const costRaw=row[ci];
   if(!item&&!clean(row[matchColumn(header,['initiative name'])])&&num(costRaw)===null)continue;

   summary.rows++;
   if(stream==='ew')summary.ewRows++;else summary.buRows++;

   const id=item||sh.name+'-row-'+(i+1);
   if(ids.has(id))dupes.push(id);ids.add(id);

   const costK=num(costRaw);
   if(costK!==null){
    if(costK<0)negativeCosts++;
    totalCostK+=costK;
   }

   const org=clean(row[orgIdx]);
   if(org)summary.orgs.add(org);
   if(org&&key(org).includes('hpm')){summary.hpmRows++;summary.hpmDemand+=(costK||0)/1000;}

   if(bandIdx>=0&&clean(row[bandIdx]))summary.decisionBands.filled++;
   else summary.decisionBands.blank++;

   const benK=num(row[benIdx]);
   if(benK!==null){
    benefitCount++;
    if(costK>0&&benK>0){const ratio=benK/costK;if(ratio>maxRatio)maxRatio=ratio;}
   }
  }
 }

 summary.totalDemand=Math.round(totalCostK/1000*1000)/1000;
 summary.hpmDemand=Math.round(summary.hpmDemand*1000)/1000;
 summary.duplicateIds=dupes;

 add('Required columns present','critical',missingCols.length===0?'PASS':'FAIL',
  missingCols.length===0?(REQUIRED_COLUMNS.length+' of '+REQUIRED_COLUMNS.length+' matched'):'Missing: '+missingCols.join(', '));

 add('Data rows > 0','critical',summary.rows>0?'PASS':'FAIL',summary.rows+' total data rows');

 const rowDrift=Math.abs(summary.rows-BASELINE.rows)/BASELINE.rows;
 add('Row count within range','warning',
  rowDrift<=0.2?'PASS':'WARN',
  summary.rows+' rows (baseline '+BASELINE.rows+', '+(rowDrift*100).toFixed(1)+'% drift)');

 const demandDrift=BASELINE.demand>0?Math.abs(summary.totalDemand-BASELINE.demand)/BASELINE.demand:0;
 add('Total demand within range','warning',
  demandDrift<=0.3?'PASS':'WARN',
  summary.totalDemand.toFixed(3)+' M€ (baseline '+BASELINE.demand.toFixed(3)+' M€, '+(demandDrift*100).toFixed(1)+'% drift)');

 add('HPM rows present','warning',summary.hpmRows>0?'PASS':'WARN',
  summary.hpmRows+' HPM rows, '+summary.hpmDemand.toFixed(3)+' M€');

 const bandPct=summary.rows>0?summary.decisionBands.filled/summary.rows:0;
 add('Decision bands populated','warning',bandPct>=0.5?'PASS':'WARN',
  summary.decisionBands.filled+' of '+summary.rows+' rows ('+(bandPct*100).toFixed(0)+'%)');

 add('No negative costs','critical',negativeCosts===0?'PASS':'FAIL',
  negativeCosts===0?'All costs >= 0':negativeCosts+' rows have negative costs');

 add('No duplicate Item No.','critical',dupes.length===0?'PASS':'FAIL',
  dupes.length===0?ids.size+' unique IDs':'Duplicates: '+dupes.slice(0,10).join(', '));

 add('Benefit claims plausible','warning',maxRatio<=1000?'PASS':'WARN',
  maxRatio<=1000?'Max benefit/cost ratio: '+maxRatio.toFixed(1)+'x':'Extreme ratio: '+maxRatio.toFixed(1)+'x — review benefit data');

 const lfrIds=['EW-11','EW-65','EW-71'],found=lfrIds.filter(x=>ids.has(x));
 add('LFR exceptions present','info',found.length===3?'PASS':'WARN',
  found.length+' of 3 ('+lfrIds.join(', ')+')'+(found.length<3?'; missing: '+lfrIds.filter(x=>!ids.has(x)).join(', '):''));

 const hashChanged=previous&&workbook.sourceHash&&previous!==workbook.sourceHash;
 add('Source hash comparison','info',hashChanged===false?'PASS':(hashChanged?'WARN':'PASS'),
  hashChanged?'Source changed (previous: '+previous.slice(0,12)+'…, current: '+workbook.sourceHash.slice(0,12)+'…)':
  (previous?'Unchanged':'No previous hash to compare'));

 const hasFail=checks.some(c=>c.status==='FAIL');
 const hasWarn=checks.some(c=>c.status==='WARN');
 return {status:hasFail?'FAIL':hasWarn?'WARN':'PASS',checks,summary};
}

function renderReport(qa,source){
 const badge=qa.status==='PASS'?'qa-pass':qa.status==='WARN'?'qa-warn':'qa-fail';
 const s=qa.summary;
 return '<div class="qa-report"><div class="qa-header"><span class="qa-badge '+badge+'">Data Health: '+qa.status+'</span>'
  +'<span class="qa-source">Source: '+(source||'unknown')+'</span>'
  +'<span class="qa-summary">'+s.rows+' rows · '+s.totalDemand.toFixed(1)+' M€ · EW '+s.ewRows+' / BU '+s.buRows+' · HPM '+s.hpmRows+' rows ('+s.hpmDemand.toFixed(1)+' M€)</span></div>'
  +'<details class="qa-details"><summary>'+qa.checks.filter(c=>c.status==='PASS').length+' passed · '+qa.checks.filter(c=>c.status==='WARN').length+' warnings · '+qa.checks.filter(c=>c.status==='FAIL').length+' failed</summary>'
  +'<table class="qa-table"><thead><tr><th>Check</th><th>Severity</th><th>Status</th><th>Detail</th></tr></thead><tbody>'
  +qa.checks.map(c=>'<tr class="qa-'+c.status.toLowerCase()+'"><td>'+c.name+'</td><td>'+c.severity+'</td><td><span class="qa-badge qa-'+c.status.toLowerCase()+'">'+c.status+'</span></td><td>'+c.detail+'</td></tr>').join('')
  +'</tbody></table></details></div>';
}

function renderComparison(prev,curr){
 if(!prev)return '';
 const rows=[
  ['Total rows',prev.rows,curr.rows],
  ['EW rows',prev.ewRows,curr.ewRows],
  ['BU rows',prev.buRows,curr.buRows],
  ['Total demand (M€)',prev.totalDemand.toFixed(3),curr.totalDemand.toFixed(3)],
  ['HPM rows',prev.hpmRows,curr.hpmRows],
  ['HPM demand (M€)',prev.hpmDemand.toFixed(3),curr.hpmDemand.toFixed(3)],
  ['Decision bands filled',prev.decisionBands.filled,curr.decisionBands.filled],
 ];
 return '<details class="qa-comparison"><summary>Before / After comparison</summary>'
  +'<table class="qa-table"><thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Delta</th></tr></thead><tbody>'
  +rows.map(([label,b,a])=>{const delta=Number(a)-Number(b);return '<tr><td>'+label+'</td><td>'+b+'</td><td>'+a+'</td><td class="'+(delta>0?'qa-delta-up':delta<0?'qa-delta-down':'')+'">'+
   (delta>0?'+':'')+delta+'</td></tr>';}).join('')
  +'</tbody></table></details>';
}

// Deep finance reconciliation QA — call after AOP.solve() once a prioritisation scenario is set.
// opsTotal: operations total M€ (e.g. 469.7). Pass the same value used in Tab 6.
// Returns {status, checks, totals} where totals has buAlloc, ewAlloc, programAlloc, grandTotal.
function validateFinance(result,opsTotal){
 const checks=[],add=(name,sev,status,detail)=>checks.push({name,severity:sev,status,detail});
 const rows=result.rows;
 const ewFunded=rows.filter(r=>r.stream==='ew'&&r.final>0);
 const buFunded=rows.filter(r=>r.stream==='bu'&&r.final>0);
 const totalEW=round(ewFunded.reduce((s,r)=>s+r.final,0));
 const totalBU=round(buFunded.reduce((s,r)=>s+r.final,0));
 const programAlloc=result.totals.allocation;
 const streamSum=round(totalEW+totalBU);

 // 1. EW + BU stream totals must equal programme allocation exactly
 const streamOk=Math.abs(streamSum-programAlloc)<0.001;
 add('EW + BU streams = Programme allocation','critical',streamOk?'PASS':'FAIL',
  'EW '+totalEW.toFixed(3)+' + BU '+totalBU.toFixed(3)+' = '+streamSum.toFixed(3)+' M€ (expected '+programAlloc.toFixed(3)+' M€)'+(streamOk?'':' — DISCREPANCY: '+Math.abs(streamSum-programAlloc).toFixed(6)+' M€'));

 // 2. Allocation % presence on funded EW programmes
 const withPct=ewFunded.filter(r=>r.allocations&&Object.keys(r.allocations).length>0);
 const pctCoverage=ewFunded.length>0?withPct.length/ewFunded.length:1;
 add('EW allocation % present on funded programmes','warning',pctCoverage>=1?'PASS':(pctCoverage>0?'WARN':'WARN'),
  ewFunded.length===0?'No funded EW programmes':withPct.length+' of '+ewFunded.length+' funded EW programmes carry allocation % data ('+Math.round(pctCoverage*100)+'%)');

 // 3. For each EW programme with %, allocation percentages must sum to 100% (±1%)
 const pctErrors=withPct.filter(r=>{const s=Object.values(r.allocations).reduce((a,b)=>a+b,0);return Math.abs(s-100)>1;});
 if(withPct.length>0){
  add('EW allocation % sums to 100% per programme','critical',pctErrors.length===0?'PASS':'FAIL',
   pctErrors.length===0?'All '+withPct.length+' programmes sum to 100%':
   pctErrors.length+' programme(s) with % not summing to 100%: '+
   pctErrors.slice(0,5).map(r=>{const s=Object.values(r.allocations).reduce((a,b)=>a+b,0);return r.id+' (sum='+s.toFixed(1)+'%)';}).join(', '));
 }

 // 4. EW charges distributed to BUs must equal total EW allocation (when % present)
 if(withPct.length>0){
  const distributedEW=round(withPct.reduce((s,r)=>{const tot=Object.values(r.allocations).reduce((a,b)=>a+b,0);return s+r.final*(tot/100);},0));
  const ewDistOk=Math.abs(distributedEW-totalEW)<0.01;
  add('EW charges distributed to BUs = total EW allocation','critical',ewDistOk?'PASS':'WARN',
   'Distributed '+distributedEW.toFixed(3)+' M€, EW funded '+totalEW.toFixed(3)+' M€'+(ewDistOk?'':' — check that all allocation % columns are mapped'));
 }

 // 5. Grand total = Programme allocation + Operations
 if(typeof opsTotal==='number'&&Number.isFinite(opsTotal)){
  const grandTotal=round(programAlloc+opsTotal);
  add('Grand total = Programme AOP + Operations AOP','critical','PASS',
   'Programme '+programAlloc.toFixed(3)+' + Operations '+opsTotal.toFixed(3)+' = '+grandTotal.toFixed(3)+' M€');
 } else {
  add('Grand total validation','info','WARN','opsTotal not supplied — pass the operations total M€ to validate the grand total');
 }

 // 6. No funded programme has a negative final amount
 const negFinal=rows.filter(r=>r.final<0);
 add('No negative funded amounts','critical',negFinal.length===0?'PASS':'FAIL',
  negFinal.length===0?'All final amounts >= 0':negFinal.length+' programme(s) have negative funded amounts: '+negFinal.map(r=>r.id).join(', '));

 // 7. Funded count consistency
 add('Funded count matches rows with final > 0','critical',
  result.totals.count===rows.filter(r=>r.final>0).length?'PASS':'FAIL',
  'totals.count='+result.totals.count+', rows with final>0='+rows.filter(r=>r.final>0).length);

 const hasFail=checks.some(c=>c.status==='FAIL');
 const hasWarn=checks.some(c=>c.status==='WARN');
 const grandTotal=typeof opsTotal==='number'?round(programAlloc+opsTotal):null;
 return {status:hasFail?'FAIL':hasWarn?'WARN':'PASS',checks,totals:{buAlloc:totalBU,ewAlloc:totalEW,programAlloc,opsTotal:opsTotal||null,grandTotal}};
}

function renderFinanceQA(qa){
 if(!qa)return '';
 const badge=qa.status==='PASS'?'qa-pass':qa.status==='WARN'?'qa-warn':'qa-fail';
 const t=qa.totals;
 return '<div class="qa-report" style="margin:8px 0"><div class="qa-header"><span class="qa-badge '+badge+'">Finance QA: '+qa.status+'</span>'
  +(t.grandTotal!==null?'<span class="qa-summary">Programme '+t.programAlloc.toFixed(1)+' M€ (BU '+t.buAlloc.toFixed(1)+' + EW '+t.ewAlloc.toFixed(1)+') + Ops '+(t.opsTotal||0).toFixed(1)+' = Grand Total '+t.grandTotal.toFixed(1)+' M€</span>':'')
  +'</div><details class="qa-details"><summary>'+qa.checks.filter(c=>c.status==='PASS').length+' passed · '+qa.checks.filter(c=>c.status==='WARN').length+' warnings · '+qa.checks.filter(c=>c.status==='FAIL').length+' failed (click to expand)</summary>'
  +'<table class="qa-table"><thead><tr><th>Check</th><th>Severity</th><th>Status</th><th>Detail</th></tr></thead><tbody>'
  +qa.checks.map(c=>'<tr class="qa-'+c.status.toLowerCase()+'"><td>'+c.name+'</td><td>'+c.severity+'</td><td><span class="qa-badge qa-'+c.status.toLowerCase()+'">'+c.status+'</span></td><td>'+c.detail+'</td></tr>').join('')
  +'</tbody></table></details></div>';
}

return {validate,renderReport,renderComparison,validateFinance,renderFinanceQA,BASELINE,REQUIRED_COLUMNS};
});
