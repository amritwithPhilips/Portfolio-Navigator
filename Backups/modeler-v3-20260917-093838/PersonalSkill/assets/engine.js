/* One deterministic engine for the dashboard, workbook results and portfolio sessions. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOP=api;})(globalThis,function(){
'use strict';
const VERSION='3.2.0', STAGES=['Legal and Compliance (Must Do)','Sustain Engineering','Hygiene','Carryover','Value Based Portfolio'];
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=x=>x==null?'':String(x).replace(/[\u200b\u00a0]/g,' ').replace(/\s+/g,' ').trim();
const key=x=>clean(x).toLowerCase().replace(/[—–]/g,'-');
const round=x=>Math.round((x+Number.EPSILON)*1e6)/1e6;
const numeric=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
function numberCell(x){if(numeric(x)!==null)return x;if(typeof x==='string'&&/^-?\d+(?:\.\d+)?$/.test(x.trim()))return Number(x);return null;}
const sum=(rows,f)=>round(rows.reduce((s,r)=>s+(numeric(f(r))??0),0));
function materialFingerprint(r){return JSON.stringify({item:r.item,planisware:r.planisware,org:r.org,name:r.name,type:r.type,newCarry:r.newCarry,category:r.category,platform:r.platform,area:r.area,priority:r.priority,cost:r.cost,benefit:r.benefit,benefitDetails:r.benefitDetails,impact:r.impact,problem:r.problem,scope:r.scope,dependency:r.dependency,decisionBand:r.decisionBand,overall:r.overall,remarks:r.remarks,stream:r.stream});}
const defaults=()=>({budget:100,tolerance:5,lfr:{basis:'bucket',pct:100},sustain:{basis:'bucket',pct:100},hygiene:{basis:'aop',pct:10},carry:2,merit:45,weights:[50,25,15,10]});
function preset(name){const s=defaults();if(name==='evidence')s.carry=3;if(name==='capacity')s.sustain.pct=75;return s;}
function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Total AOP must be a nonnegative amount.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance must be between 0.0% and 5.0%.');for(const n of ['lfr','sustain','hygiene'])if(!s[n]||!['bucket','aop'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||s[n].pct>100)throw Error('Coverage must be 0.0–100.0 with a valid basis.');if(!Number.isFinite(s.carry)||s.carry<1||s.carry>5||!Number.isInteger(s.carry*2))throw Error('Carryover needs a 1.0–5.0x threshold in 0.5x steps.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor must be 0.0–100.0.');if(!Array.isArray(s.weights)||s.weights.length!==4||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('The four merit weights must total 100.0.');return true;}
function normalize(workbook){
 const records=[],issues=[],mappings=[];
 for(const sheetName of ['EW','Bu']){
  const sh=workbook.sheets.find(x=>key(x.name)===key(sheetName));if(!sh)throw Error('Required sheet '+sheetName+' is missing.');
  const header=sh.rows[0]||[],sub=sh.rows[1]||[];
  const locate=(aliases,required=true,filter=()=>true)=>{const found=header.map((h,i)=>({h:key(h),i})).filter(x=>aliases.includes(x.h)&&filter(x.i));if(found.length!==1){if(!required&&!found.length)return -1;throw Error(sheetName+': heading '+aliases[0]+' is missing or ambiguous.');}return found[0].i;};
  const ix={item:locate(['item no.']),plan:locate(['planisware id']),org:locate(['organization setting demand [bu, region, coe]']),name:locate(['initiative name']),type:locate(['type']),newCarry:locate(['new initiative or carry-over']),category:locate(['category']),platform:locate(['leading it platform']),area:locate(['investment area']),cost:locate(['it investment requested 2027 [k€]','it investment requested 2027 [keur]']),benefit:locate(['quantified benefits (in k€)','quantified benefits (in keur)']),benefitDetails:locate(['quantified benefits (details)']),impact:locate(['impact and cost of not doing']),problem:locate(['problem statement']),scope:locate(['scope']),dependency:locate(['dependency','dependency (item no & explaination)']),overall:locate(['overall aop decision']),remarks:locate(['remarks / evidence'],false)};
  ix.band=locate(['decision band','waste'],true,i=>key(header[i])==='decision band'||key(sub[i]).includes('band'));
  ix.priority=locate(['priority'],true,i=>i<ix.problem);
  const labels=header.map((h,i)=>(clean(h)||'Column '+(i+1))+(clean(sub[i])?' / '+clean(sub[i]):'')+' ['+col(i)+']');
  mappings.push({sheet:sh.name,fields:ix,sourceHeaders:labels});
  for(let i=3;i<sh.rows.length;i++){
   const row=sh.rows[i]||[],get=k=>row[ix[k]]??null;
   if(!clean(get('item'))&&!clean(get('name'))&&!clean(get('cost')))continue;
   const cost=numberCell(get('cost')),benefit=numberCell(get('benefit'));
   if(clean(get('cost'))&&cost===null)throw Error(sh.name+' row '+(i+1)+': requested amount is not numeric.');
   if(cost!==null&&cost<0)throw Error(sh.name+' row '+(i+1)+': requested amount is negative.');
   if(benefit!==null&&benefit<0)issues.push(sh.name+' row '+(i+1)+': negative benefit needs review.');
   const sourceValues=labels.map((label,c)=>({label,value:row[c]??null,formula:(sh.formulas||{})[col(c)+(i+1)]||null}));
   const r={id:clean(get('item'))||sh.name+'-row-'+(i+1),temporary:!clean(get('item')),item:clean(get('item')),planisware:clean(get('plan')),org:clean(get('org')),name:clean(get('name')),type:clean(get('type')),newCarry:clean(get('newCarry')),category:clean(get('category')),platform:clean(get('platform')),area:clean(get('area')),priority:clean(get('priority')),cost:cost===null?null:round(cost/1000),benefit:benefit===null?null:round(benefit/1000),benefitRaw:get('benefit'),benefitDetails:clean(get('benefitDetails')),impact:clean(get('impact')),problem:clean(get('problem')),scope:clean(get('scope')),dependency:clean(get('dependency')),decisionBand:clean(get('band')),overall:clean(get('overall')),remarks:clean(get('remarks')),stream:sheetName==='EW'?'ew':'bu',sourceSheet:sh.name,sourceRow:i+1,sourceValues};
   // Compare decision-relevant evidence only. Preserve the complete row separately for traceability.
   // This prevents formula-cache or unrelated source-column recalculation from holding valid decisions.
   r.fingerprint=materialFingerprint(r);
   records.push(r);
  }
 }
 const ids=new Set();for(const r of records){if(ids.has(r.id))throw Error('Duplicate Item No.: '+r.id);ids.add(r.id);}for(const id of ['EW-11','EW-65','EW-71'])if(!ids.has(id))issues.push('Designated Legal and Compliance exception '+id+' is absent; confirm source identity.');
 return {schema:3,sourceFile:workbook.sourceFile,sourceHash:workbook.sourceHash,version:workbook.sourceHash.slice(0,12),records,workbook,issues,mappings};
}
function col(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
function stage(r){const d=key(r.overall);if(/must-do\s*-\s*p[12]\s*-/.test(d)||['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(key(r.newCarry)==='change & sustain')return 1;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;if(['decomm/replatforming','decommissioning','replatforming'].includes(key(r.category)))return 4;if(key(r.newCarry)==='carry over')return 3;return 4;}
function consequence(r,review){
 const fields=[['Impact and Cost of Not Doing',r.impact],['Problem Statement',r.problem],['Scope',r.scope]].filter(x=>clean(x[1]));
 const evidence=fields.map(x=>x[1]).join(' ');
 const explicit=/\b(cannot|unable|not able|will (?:not|lose|fail)|loss of|revenue (?:loss|at risk)|penalt\w*|non[- ]?complian\w*|end of (?:life|support)|out of support|downtime|disrupt\w*|delayed|forfeit|no longer|security breach\w*)\b/i.test(evidence);
 const affected=/\b(customer\w*|patient\w*|user\w*|business|product\w*|system\w*|platform\w*|operation\w*|revenue|audit\w*|compliance|manufactur\w*|service\w*|support|process\w*)\b/i.test(evidence);
 const reach=/\b(global|enterprise|company[- ]wide|worldwide|multi[- ]region|all regions|all markets)\b/i.test(evidence);
 const quantified=/\d[\d,.]*\s*(%|fte|hours?|days?|k€|m€|eur|million|sites?)\b/i.test(evidence)||/(?:€|EUR)\s*\d/.test(evidence);
 let points=fields.length?5:0;if(explicit&&affected)points=(reach||quantified)?15:10;
 if(review&&[0,5,10,15].includes(review.consequence)&&fields.length&&clean(review.note))points=review.consequence;
 return {points,fields,evidence,interpreted:true};
}
function enrich(r,s,review={}){
 const st=stage(r),ratio=r.cost>0&&numeric(r.benefit)!==null?r.benefit/r.cost:null,c=consequence(r,review);
 const bp=ratio===null||ratio<1?0:ratio<2?20:ratio<3?30:ratio<5?40:50;
 const pp=key(r.priority)==='must do'?25:key(r.priority)==='must have'?18:key(r.priority).startsWith('deprior')?5:0;
 const dp=key(r.decisionBand)==='healthy'?10:key(r.decisionBand)==='contain'?6:0;
 const raw=[bp,pp,c.points,dp],components=raw.map((v,i)=>v/[50,25,15,10][i]*s.weights[i]),score=round(components.reduce((a,b)=>a+b,0));
 const warnings=[],holds=[],d=key(r.overall);
 if(!r.decisionBand)warnings.push('Decision Band unassessed');if(!d)warnings.push('Overall AOP decision unassessed');
 if(!r.name)holds.push('Program name missing');if(!(r.cost>0))holds.push(r.cost===null?'Requested demand missing':'No positive requested demand');
 if(d.includes('priority tbd'))holds.push('Mandatory priority TBD');
 if(d&&!/^(healthy\s*-\s*rank in priority matrix|healthy\s*\/\s*must-do\s*-\s*(p1\s*-\s*immediate|p2\s*-\s*scheduled|priority tbd)|contain\s*-\s*conditions)$/.test(d))holds.push('Overall AOP decision needs mapping');
 if((key(r.decisionBand)==='contain'||d.startsWith('contain'))&&!clean(r.remarks)&&!clean(review.condition)){if(st===0)warnings.push('Mandatory obligation retained; Contain condition needs review');else holds.push('Contain condition needs review');}
 if(st>=3&&r.benefit===null)holds.push('Numeric benefits missing');
 if(st>=3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');
 if(st===3&&ratio!==null&&ratio<s.carry)holds.push('Below Carryover '+s.carry.toFixed(1)+'x threshold');
 if(st===4&&score<s.merit)holds.push('Below advanced merit floor');
 if(st>=3&&ratio>5&&!review.benefitReviewed)holds.push('Benefit claim above 5.0x needs review');
 if(r.temporary)warnings.push('Temporary source ID');
 return {...r,stage:st,stageName:STAGES[st],ratio,rawComponents:raw,components,score,consequence:c,warnings,holds,eligible:!holds.length,review,condition:clean(review.condition)||r.remarks,priorityPoints:pp};
}
function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const seq=r=>key(r.overall).includes('p1')?0:key(r.overall).includes('p2')?1:2;const x=seq(a)-seq(b);if(x)return x;}if(a.stage===3&&a.ratio!==b.ratio)return (b.ratio??-Infinity)-(a.ratio??-Infinity);return b.score-a.score||(b.ratio??-Infinity)-(a.ratio??-Infinity)||b.priorityPoints-a.priorityPoints||a.id.localeCompare(b.id,'en',{numeric:true});}
function solve(data,s,overrides={},reviews={}){
 validateSettings(s);const rows=data.records.map(r=>enrich(r,s,reviews[r.id])).sort(compare),demand=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));
 const targets=demand.map((v,i)=>i<3?Math.min(v,(s[['lfr','sustain','hygiene'][i]].basis==='bucket'?v:s.budget)*s[['lfr','sustain','hygiene'][i]].pct/100):null),spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;
 for(const r of rows){r.rank=++rank[r.stage];r.automatic=0;r.reason=r.holds.join('; ');if(r.eligible){const stageLimit=targets[r.stage]===null?Infinity:Math.min(demand[r.stage],targets[r.stage]*(1+s.tolerance/100));if(spent[r.stage]+r.cost>stageLimit+1e-9)r.reason='Whole program does not fit stage target plus tolerance';else if(automatic+r.cost>s.budget*(1+s.tolerance/100)+1e-9)r.reason='Whole program does not fit Total AOP plus tolerance';else{r.automatic=r.cost;spent[r.stage]+=r.cost;automatic+=r.cost;r.reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank;}}
  const o=overrides[r.id];r.final=r.automatic;r.override=o||null;
  if(o&&o.state!=='needs-review'){if(o.choice==='exclude'){r.final=0;r.reason='Conference exclusion'+(o.note?': '+o.note:'');}else if(o.choice==='include'){const amount=o.amount??r.cost;if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)throw Error(r.id+': invalid prioritised amount.');r.final=round(amount);r.reason=(r.final<r.cost?'Conference scope amount':'Conference inclusion')+(o.note?': '+o.note:'');}}
  if(o?.state==='needs-review')r.warnings.push('Previous decision needs source review');
  if(r.final>0&&r.holds.length)r.warnings.push('Manual evidence exception: '+r.holds.join('; '));
  r.unfunded=r.cost===null?null:round(r.cost-r.final);r.status=r.final>0?(r.final<r.cost?'Partial scope':'Funded'):(o?.choice==='exclude'&&o.state!=='needs-review'?'Excluded':'Not funded');
 }
 const allocation=sum(rows,r=>r.final),requested=sum(rows,r=>r.cost),auto=sum(rows,r=>r.automatic);
 const totals={requested,allocation,automatic:auto,manual:round(allocation-auto),unfunded:sum(rows,r=>r.unfunded),available:Math.max(0,round(s.budget-allocation)),over:Math.max(0,round(allocation-s.budget)),count:rows.filter(r=>r.final>0).length,partial:rows.filter(r=>r.status==='Partial scope').length,missing:rows.filter(r=>r.cost===null).length};
 const stages=STAGES.map((name,i)=>({name,demand:demand[i],target:targets[i],automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));
 return {version:VERSION,rows,totals,stages,streams:Object.fromEntries(['ew','bu'].map(x=>[x,{requested:sum(rows.filter(r=>r.stream===x),r=>r.cost),automatic:sum(rows.filter(r=>r.stream===x),r=>r.automatic),allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};
}
function createSession(data){return {schema:3,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Protect commitments',preset:'protect',revision:0,status:'Draft',data,settings:defaults(),overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}
function transact(session,action,details={},origin='AOP Scenarios'){
 if(session.status==='Finalised'&&!['fork'].includes(action))throw Error('Finalised scenario. Create a new working version to edit.');
 const next=clone(session),old={settings:clone(next.settings),overrides:clone(next.overrides),reviews:clone(next.reviews),status:next.status};
 if(action==='setting'){next.settings=clone(details.settings);validateSettings(next.settings);next.preset='custom';}
 else if(action==='preset'){next.settings=preset(details.preset);next.settings.budget=session.settings.budget;next.preset=Object.keys(next.overrides).length?'custom':details.preset;}
 else if(action==='program'||action==='group'){
  for(const id of details.ids||[details.id]){const r=next.data.records.find(r=>r.id===id);if(!r)throw Error('Program not found.');
   const before=next.overrides[id];if(details.choice==='automatic')delete next.overrides[id];else{const amount=details.choice==='exclude'?0:(details.amount??r.cost);if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)throw Error('Prioritised amount must be between zero and the source request.');next.overrides[id]={choice:amount===0?'exclude':'include',amount,note:details.note??before?.note??'',fingerprint:r.fingerprint,state:'active'};}
  }next.preset='custom';
 }
 else if(action==='review'){const r=next.data.records.find(x=>x.id===details.id);if(!r)throw Error('Program not found.');next.reviews[details.id]={...details.review,fingerprint:r.fingerprint};next.preset='custom';}
 else if(action==='reset'){next.overrides={};next.reviews={};}
 else if(action==='resolve'){const o=next.overrides[details.id],r=next.data.records.find(x=>x.id===details.id);if(!o||!r)throw Error('No pending source decision.');if(details.discard)delete next.overrides[details.id];else {if(o.amount>r.cost||!(r.cost>0))throw Error('Previous amount exceeds refreshed request. Return to automatic and edit a valid amount.');o.state='active';o.fingerprint=r.fingerprint;}}
 else if(action==='finalise'){const pending=solve(next.data,next.settings,next.overrides,next.reviews).rows.filter(r=>r.override?.state==='needs-review');if(pending.length)throw Error('Resolve '+pending.length+' refreshed decisions before finalising.');next.status='Finalised';}
 else if(action==='fork'){next.status='Draft';next.id='scenario-'+Date.now();next.name+=' working copy';next.parent=session.id;}
 else throw Error('Unknown action '+action);
 const result=solve(next.data,next.settings,next.overrides,next.reviews);
 next.revision++;next.events.push({id:'event-'+Date.now()+'-'+next.revision,time:new Date().toISOString(),origin,action,details:clone(details),sourceVersion:next.data.version,revision:next.revision,before:old,after:{settings:next.settings,overrides:next.overrides,reviews:next.reviews,status:next.status},allocation:result.totals.allocation,overBudget:result.totals.over,actor:'Local session'});next.savedAt=null;return next;
}
function undo(session){if(session.status==='Finalised')throw Error('Create a working version before undo.');const event=[...session.events].reverse().find(e=>e.action!=='undo'&&!session.events.some(u=>u.action==='undo'&&u.undoId===e.id));if(!event)throw Error('Nothing to undo.');if(!event.before||!event.before.settings)throw Error('Source refresh cannot be undone here. Reopen the previous saved scenario.');const next=clone(session);Object.assign(next,clone(event.before));next.revision++;next.events.push({id:'undo-'+Date.now(),time:new Date().toISOString(),origin:'Decision log',action:'undo',undoId:event.id,revision:next.revision,sourceVersion:next.data.version,details:{message:'Undid '+event.action+'.'}});next.savedAt=null;return next;}
function refreshPreview(session,data){const old=new Map(session.data.records.map(r=>[r.id,r])),fresh=new Map(data.records.map(r=>[r.id,r])),unchanged=[],changed=[],added=[],removed=[];for(const r of data.records){const prev=old.get(r.id);if(!prev)added.push(r.id);else if(prev.fingerprint!==r.fingerprint||(r.temporary&&data.sourceHash!==session.data.sourceHash))changed.push(r.id);else unchanged.push(r.id);}for(const r of session.data.records)if(!fresh.has(r.id))removed.push(r.id);return {added,changed,removed,unchanged,requested:sum(data.records,r=>r.cost)};}
function refresh(session,data){const diff=refreshPreview(session,data),next=clone(session);next.parent=session.id;next.id='scenario-'+Date.now();next.status='Draft';next.name=session.name+' refreshed';next.data=data;delete next.conferences;next.reviews={};next.overrides={};for(const r of data.records){if(diff.unchanged.includes(r.id)&&session.reviews[r.id])next.reviews[r.id]=clone(session.reviews[r.id]);if(session.overrides[r.id])next.overrides[r.id]={...session.overrides[r.id],state:diff.unchanged.includes(r.id)?session.overrides[r.id].state:'needs-review'};}next.revision++;next.events.push({id:'refresh-'+Date.now(),time:new Date().toISOString(),origin:'Demand refresh',action:'refresh',revision:next.revision,sourceVersion:data.version,details:diff});next.savedAt=null;return next;}
function filter(rows,f={}){return rows.filter(r=>['org','platform','newCarry','area','status','stageName'].every(k=>!f[k]?.length||f[k].includes(clean(r[k])||'Not supplied'))&&(!f.search||key(r.id+' '+r.name+' '+r.org).includes(key(f.search))));}
function validateSession(s){if(!s||s.schema!==3||s.ruleVersion!==VERSION||!s.data?.workbook||!Array.isArray(s.events)||!['Draft','Finalised'].includes(s.status)||!s.filters||!s.overrides||!s.reviews||!Number.isInteger(s.revision)||typeof s.name!=='string')throw Error('Unsupported or incomplete scenario format.');validateSettings(s.settings);const rebuilt=normalize(s.data.workbook);if(rebuilt.version!==s.data.version||JSON.stringify(rebuilt.records)!==JSON.stringify(s.data.records))throw Error('Session source records do not match its workbook snapshot.');const ids=new Set(rebuilt.records.map(r=>r.id));for(const [id,o] of Object.entries(s.overrides)){if(!ids.has(id)||!o||!['include','exclude'].includes(o.choice)||!['active','needs-review'].includes(o.state))throw Error('Invalid program override.');}for(const id of Object.keys(s.reviews))if(!ids.has(id))throw Error('Review refers to missing source ID.');if(s.status==='Finalised'&&Object.values(s.overrides).some(o=>o.state==='needs-review'))throw Error('Finalised scenario contains unresolved refreshed decisions.');return true;}
return {VERSION,STAGES,clone,clean,key,round,numeric,sum,col,defaults,preset,validateSettings,normalize,stage,enrich,solve,createSession,transact,undo,refreshPreview,refresh,filter,validateSession};
});
