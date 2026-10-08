function validateFinance(result,opsTotal){
 const f=result.finance,checks=[],add=(name,passed,detail,severity='critical')=>checks.push({name,severity,status:passed?'PASS':severity==='warning'?'WARN':'FAIL',detail});
 const base=result.rows.filter(r=>!r.isPmi),ew=base.filter(r=>r.stream==='ew').reduce((s,r)=>s+r.final,0),bu=base.filter(r=>r.stream==='bu').reduce((s,r)=>s+r.final,0),pmi=result.pmi?.funded||0;
 add('F&R + BU = base Programs',Math.abs(ew+bu-result.totals.allocation)<1e-8,`${ew} + ${bu} = ${result.totals.allocation} M€`);
 add('Programs + PMI + Operations = recipient ledger',!!f?.reconciled,`Total ${f?.totals.total} M€; PMI ${pmi} M€ included once`);
 add('EW charging key',!!f?.ewKey.valid,`BU row ${f?.ewKey.sourceRow}; unallocated ${(f?.ewKey.unallocatedShare*100).toFixed(8)}% retained`);
 add('Every funded Programs amount reconciles',result.rows.every(r=>Math.abs((f?.ledger||[]).filter(x=>x.pillar==='Programs'&&x.id===r.id).reduce((s,x)=>s+x.amount,0)-r.final)<1e-8),'Recipient charges plus Unallocated equal funded investment');
 add('Operations source reconciliation',Math.abs((f?.totals.operations||0)-opsTotal)<1e-8,`${f?.totals.operations} M€; sender costs not counted again`);
 add('Funded count',result.totals.count===base.filter(r=>r.final>0).length,'Base Programs count excludes PMI');
 add('Non-negative funding',result.rows.every(r=>r.final>=0),'All amounts non-negative');
 add('Source allocation completeness',!f?.issues.length,(f?.issues||[]).map(x=>x.id+': '+x.reason+' '+x.value+' M€').join('; ')||'Complete','warning');
 return {status:checks.some(x=>x.status==='FAIL')?'FAIL':checks.some(x=>x.status==='WARN')?'WARN':'PASS',checks,totals:{buAlloc:bu,ewAlloc:ew,pmi,programAlloc:ew+bu+pmi,opsTotal,grandTotal:f?.totals.total}};
}
