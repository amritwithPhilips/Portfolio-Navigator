function tradeoff(session,stream,targets){
 if(!['ew','bu'].includes(stream))throw Error('Choose Functions & Regions or BU Led');
 let next=clone(session);const before=solve(next.data,next.settings,next.overrides,next.reviews);
 for(const [leader,target] of Object.entries(targets)){
  if(!Number.isFinite(target)||target<0)throw Error('Trade-off target must be nonnegative');
  const rows=before.rows.filter(r=>r.stream===stream&&r.exco===leader&&!r.isPmi),current=sum(rows,r=>r.final),delta=target-current;
  if(delta>1e-9){let used=0;for(const r of rows.filter(r=>r.final===0&&r.cost>0&&r.stage>=3&&r.eligible).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}))){if(used+r.cost<=delta+1e-9){next=transact(next,'program',{id:r.id,choice:'include',note:'ExCo trade-off'},'ExCo '+stream+' trade-off');used+=r.cost;}}}
  else if(delta< -1e-9){let freed=0;for(const r of rows.filter(r=>r.final>0&&r.stage>=3).sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id,'en',{numeric:true}))){if(freed>=-delta-1e-9)break;next=transact(next,'program',{id:r.id,choice:'exclude',note:'ExCo trade-off'},'ExCo '+stream+' trade-off');freed+=r.final;}}
 }
 next.excoTradeoffs={};return next;
}
