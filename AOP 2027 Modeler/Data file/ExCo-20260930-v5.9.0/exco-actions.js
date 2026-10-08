function opportunityPlan(session,details){
 const extra=Number(details.extra),leader=clean(details.leader),stream=details.stream||'all';
 if(!Number.isFinite(extra)||extra<=0)throw Error('Additional budget must be positive.');
 if(!Object.hasOwn(EXCO_HIERARCHY,leader))throw Error('Select one accountable ExCo leader.');
 if(!['all','ew','bu'].includes(stream))throw Error('Invalid planning stream.');
 if(!clean(details.note))throw Error('Enter a decision rationale.');
 if(Object.values(session.overrides).some(o=>o.state==='needs-review'))throw Error('Resolve refreshed decisions before adding funding.');
 const before=solve(session.data,session.settings,session.overrides,session.reviews),wanted=details.ids?new Set(details.ids):null;
 const eligible=before.rows.filter(r=>!r.isPmi&&r.exco===leader&&(stream==='all'||r.stream===stream)&&r.eligible&&!(r.override?.choice==='exclude'&&!r.override?.opportunityPinned)&&(r.stage===1?r.carryFundCap:r.cost)>r.final+1e-9).sort((a,b)=>a.stage-b.stage||b.score-a.score||a.cost-b.cost||a.id.localeCompare(b.id));
 if(wanted&&[...wanted].some(id=>!eligible.some(r=>r.id===id)))throw Error('Selection contains Programs outside the eligible leader scope.');
 let spent=0;const additions=[];
 for(const r of eligible){if(wanted&&!wanted.has(r.id))continue;const amount=round((r.stage===1?r.carryFundCap:r.cost)-r.final);if(spent+amount<=extra+1e-9){spent=round(spent+amount);additions.push({id:r.id,before:r.final,after:round(r.final+amount),amount});}}
 return {before,eligible,additions,spent,remaining:round(extra-spent),extra};
}
function applyExCoAction(next,action,details){
 if(action==='exco-review'){
  const r=next.data.records.find(r=>r.id===details.id);if(!r||key(r.type)==='pmi')throw Error('Select an editable base Programs row.');
  if(details.leader&&excoOf(r)!==details.leader)throw Error('Programs is outside the selected ExCo scope.');
  const q=details.review||{},requested=q.requested;
  if(!Number.isFinite(requested)||requested<0)throw Error('Requested amount must be non-negative.');
  if(q.merit!==undefined&&(!Number.isFinite(q.merit)||q.merit<0||q.merit>100))throw Error('Merit must be between 0 and 100.');
  if(!clean(q.note))throw Error('Enter a decision rationale.');
  next.reviews[r.id]={...next.reviews[r.id],...q,fingerprint:r.fingerprint};if(q.merit===undefined)delete next.reviews[r.id].merit;
  if(details.choice==='automatic')delete next.overrides[r.id];
  else {if(!['include','exclude'].includes(details.choice))throw Error('Invalid funding choice.');const amount=details.choice==='exclude'?0:details.amount;if(!Number.isFinite(amount)||amount<0||amount>requested||!(requested>0))throw Error('Funded amount must fit the scenario request.');next.overrides[r.id]={choice:amount===0?'exclude':'include',amount,note:q.note,fingerprint:r.fingerprint,state:'active'};}
 }else{
  const plan=opportunityPlan(next,details);if(!plan.additions.length)throw Error('No eligible Programs fit this additional budget.');
  next.settings.budget=round(next.settings.budget+plan.extra);validateSettings(next.settings);
  // Preserve the pre-decision portfolio exactly; the explicitly selected top-up alone changes funding.
  const add=new Map(plan.additions.map(r=>[r.id,r.after]));
  for(const r of plan.before.rows){if(r.isPmi||!(r.cost>0))continue;if(!add.has(r.id)&&next.overrides[r.id]&&!next.overrides[r.id].opportunityPinned)continue;const amount=add.get(r.id)??r.final;next.overrides[r.id]={choice:amount===0?'exclude':'include',amount,note:add.has(r.id)?'Additional funding: '+clean(details.note):(next.overrides[r.id]?.note||'Funding retained before additional investment'),fingerprint:r.fingerprint,state:'active',opportunityPinned:!add.has(r.id),opportunityAdded:add.has(r.id)};}
 }
}
