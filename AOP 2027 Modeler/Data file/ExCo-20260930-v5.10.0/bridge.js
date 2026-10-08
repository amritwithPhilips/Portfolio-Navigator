function downloadScenario(s,r,rows,scope){
 const sheets=AOPWorkbook.sheets(s,r,rows,scope);
 sheets.unshift({name:'Scenario Selection',rows:[['Scenario',s.name],['Scenario ID',s.id],['Revision',s.revision],['Status',s.status],['Export scope',scope],['Exported Programs',rows.length],['Source hash',s.data.sourceHash],['Base budget M€',s.settings.budget],['Selected requested M€',AOP.sum(rows,x=>x.cost)],['Selected funded M€',AOP.sum(rows,x=>x.final)],['Company funded base M€',r.totals.allocation],['Company total IT M€',r.finance.totals.total],['Carryover ROI',s.settings.carryPolicy==='roi-v1'?s.settings.carry:10],['Carry policy','Confirmed baseline ROI-exempt; 10x = baseline only. Claims are lifetime, not annual ROI.']]});
 sheets.unshift({name:'Selected Programs',rows:[['ID','Programs','ExCo leader','Stream','Source sheet','Source row','Requested M€','Funded M€','Unfunded M€','Merit','Hard benefit M€','Soft benefit M€','Funding status'],...rows.map(x=>[x.id,x.name,x.exco,x.stream,x.sourceSheet,x.sourceRow,x.cost,x.final,x.unfunded,x.score,x.benefitClass==='hard'?x.benefit:'',x.benefitClass==='soft'?x.benefit:'',x.status])]});
 const safe=String(s.name||'scenario').replace(/[^a-z0-9_-]+/gi,'-').slice(0,65),id=String(s.id).replace(/[^a-z0-9_-]/gi,'').slice(-12);
 download('AOP2027-'+safe+'-'+id+'-r'+s.revision+'-'+scope+'.xlsx',AOPWorkbook.write(sheets),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
async function exportScenario(key='current',scope='full',options={}){
 const s=key==='current'?AOP.clone(session):await dbget(key);if(!s)throw Error('Saved scenario is unavailable in this browser. Open its portable JSON first.');AOP.validateSession(s);
 const r=AOP.solve(s.data,s.settings,s.overrides,s.reviews);let rows=r.rows;
 if(scope==='inclusions')rows=rows.filter(x=>x.final>0);
 if(scope==='filtered'){
  const leaders=options.leaders||[],stream=options.stream||'all',funding=options.funding||'all',search=(options.search||'').toLowerCase();
  rows=rows.filter(x=>(!leaders.length||leaders.includes(x.exco))&&(stream==='all'||x.stream===stream)&&(funding==='all'||(funding==='funded'?x.final>0:x.final===0))&&(!search||[x.id,x.name,x.org,x.platform].join(' ').toLowerCase().includes(search)));
 }
 downloadScenario(s,r,rows,scope);return {scenarioId:s.id,revision:s.revision,count:rows.length};
}
