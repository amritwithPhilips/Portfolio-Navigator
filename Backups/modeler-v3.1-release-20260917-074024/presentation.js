/* Display-only statistics. Never changes eligibility, ranking or funding. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOPViews=api;})(globalThis,function(){
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
function stats(rows,field){const values=rows.map(r=>r[field]).filter(numeric);return {count:values.length,sum:values.length?values.reduce((a,b)=>a+b,0):null,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
function median(values){const sorted=values.filter(numeric).sort((a,b)=>a-b),n=sorted.length;return n?(n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2):null;}
function aggregate(rows){const bands={};for(const r of rows){const label=String(r.decisionBand||'').trim().toLowerCase()||'unassessed';bands[label]=(bands[label]||0)+1;}const names=Object.keys(bands),band=names.length===1?(names[0]==='unassessed'?'Unassessed':names[0][0].toUpperCase()+names[0].slice(1)):names.length?'Mixed':'Unassessed';return {count:rows.length,funded:rows.filter(r=>r.final>0).length,partial:rows.filter(r=>r.status==='Partial scope').length,held:rows.filter(r=>r.holds.length>0).length,band,bands,score:stats(rows,'score'),cost:stats(rows,'cost'),final:stats(rows,'final'),unfunded:stats(rows,'unfunded'),benefit:stats(rows,'benefit'),ratio:stats(rows,'ratio'),missingCost:rows.filter(r=>r.cost===null).length,evidence:rows.filter(r=>numeric(r.benefit)).length};}
return {stats,median,aggregate};
});
