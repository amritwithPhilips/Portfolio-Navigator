/* AOP 2027 reference engine. Amounts are M€, rounded to one euro. No network dependencies. */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),round=x=>Math.round((x+Number.EPSILON)*1e6)/1e6;
const EPS=0.00000051, stages=['Protected obligations','Change and Sustain','Regions','Carry-over','Hygiene','Common demand','Reviewed inclusion'];
const wasteWeights=[.20,.15,.10,.15,.15,.10,.05,.05,.05],validityWeights=[.25,.30,.25,.20];
const genericRequirements=['anticipated external audit issue','ongoing validation of all consumer facing business applications','required to set up ksaph legal entity in country legal model','automation of process creating regulatory memos for artwork changes owing to increased speed of implementation','risk & compliance eu directives','dual vat structure','country specific','ehs','ip protection agianst unotherised access'];
const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLowerCase(),present=v=>!['','n/a','na','none','-','tbd'].includes(norm(v));
function rating(v){if(Number.isInteger(v)&&v>=1&&v<=5)return v;const m=String(v??'').match(/^([1-5])(?:\s|$)/);return m?+m[1]:null;}
function weightedScore(a,w){return Array.isArray(a)&&a.length===w.length&&a.every(x=>rating(x)!==null)?round(a.reduce((s,x,i)=>s+rating(x)*w[i],0)):null;}
const policy=()=>({benefit:[0,20,30,40,50],priority:[25,18,5,0],impact:[0,5,10,15],waste:[10,6,2,0],weights:[50,25,15,10]});
const defaults=()=>({name:'Balanced investment',preset:'balanced',budget:100,protectedPct:100,ccbPct:100,regionPct:5.525,hygienePct:7.562,carryMultiple:2,merit:45,assessed:false,releaseHygiene:false,scoring:policy(),overrides:{}});
const presets=[{key:'balanced',name:'Balanced investment',description:'Protect obligations and current change capacity, reserve technology hygiene and fund eligible business opportunities.'},{key:'confirmed',name:'Confirmed evidence',description:'Require completed waste assessments and a higher merit score for discretionary funding.'},{key:'capacity',name:'Reduced change capacity',description:'Test 60% Change and Sustain coverage while retaining mandatory coverage and reservations.'}];
function preset(key,current){const p=presets.find(p=>p.key===key);if(!p)throw Error('Unknown scenario');const s=defaults();s.name=p.name;s.preset=key;s.budget=current?.budget??100;s.overrides=clone(current?.overrides??{});if(key==='confirmed'){s.merit=65;s.assessed=true;}if(key==='capacity')s.ccbPct=60;return s;}
function validateSettings(s){
 if(!s||!Number.isFinite(s.budget)||s.budget<=0||s.budget>1000000)throw Error('Enter a positive portfolio envelope up to 1,000,000 M€.');
 for(const k of ['protectedPct','ccbPct','regionPct','hygienePct'])if(!Number.isFinite(s[k])||s[k]<0||s[k]>100)throw Error('Percentages must be between 0 and 100.');
 if(!Number.isFinite(s.carryMultiple)||s.carryMultiple<1||s.carryMultiple>5)throw Error('Carry-over threshold must be between 1 and 5 times.');
 if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Minimum merit must be between 0 and 100.');
 const p=s.scoring;if(!p||!Array.isArray(p.weights)||p.weights.length!==4||p.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(sum(p.weights,x=>x)-100)>1e-8)throw Error('The four scoring weights must add to 100.');
 for(const [k,n,max] of [['benefit',5,50],['priority',4,25],['impact',4,15],['waste',4,10]])if(!Array.isArray(p[k])||p[k].length!==n||p[k].some(x=>!Number.isFinite(x)||x<0||x>max))throw Error('Scoring tier points are outside their permitted range.');
 if(!s.overrides||Array.isArray(s.overrides)||typeof s.overrides!=='object')throw Error('Invalid manual decisions');
}
function consequence(r){
 const raw=r.impactRaw,impact=String(raw??'').trim(),proof=[];let tier=0;
 if(present(impact)&&typeof raw!=='number'&&!/^[\d,.\s]+$/.test(impact)){tier=1;proof.push('Impact and Cost of Not Doing: '+impact);}
 if(/loss|losing|lost|delay|disrupt|unable|inability|cannot|inefficien|manual|error|unsupported|risk|prevent|prohibit|decline|degrad/i.test(impact))tier=2;
 if(tier===2&&(/\d+(?:[.,]\d+)?\s*%/.test(impact)||/global|enterprise|across regions|business.{0,5}regions|all digital|overall hs|company.wide/i.test(impact)))tier=3;
 if(tier<2)for(const key of ['problem','scope']){const hit=String(r[key]??'').split(/(?<=[.!?])\s+|\n/).find(s=>/if not|without|end.of.life|end.of.support|unsupported|risk of|no vendor support/i.test(s));if(hit){tier=2;proof.splice(0,proof.length,key+': '+hit);break;}}
 return {tier,evidence:proof.join('\n')||'No usable consequence stated'};
}
function prepare(source,s){
 const r=clone(source),m=r.wasteMatch||{},p=s.scoring;
 r.id=r.item;r.costM=round(Number(r.costM)||0);r.wasteNums=(r.wasteNums||r.wasteRatings||Array(9).fill(null)).map(rating);
 r.wasteCalculated=weightedScore(r.wasteNums,wasteWeights);r.wasteBand=r.wasteCalculated===null?'Unknown':r.wasteCalculated<2?'HEALTHY':r.wasteCalculated<3?'CONTAIN':r.wasteCalculated<4?'CHALLENGE':'EXIT';
 r.validityCalculated=weightedScore(r.validityRatings||[],validityWeights);
 r.fullyValidated=r.validityCalculated===5;r.matrixImmediate=m.validated==='YES'&&/^P1/.test(m.tier||'');
 r.exposureCalculated=rating(m.impact)&&rating(m.likelihood)?rating(m.impact)*rating(m.likelihood):null;r.deadlineRating=rating(m.deadline);
 r.lfr=/20\d{2}/.test(String(r.lfrYear??''))&&present(r.lfrName)&&!genericRequirements.includes(norm(r.lfrName));
 r.lfrReview=/20\d{2}/.test(String(r.lfrYear??''))&&present(r.lfrName)&&!r.lfr;
 r.financeOverride=r.item==='EW-71'&&norm(r.name)==='fin-ccb - finance';r.protected=r.lfr||r.matrixImmediate||r.fullyValidated||r.financeOverride;
 r.protectionReason=r.financeOverride?'Finance planning allocation':r.matrixImmediate?'Validated Immediate obligation':r.fullyValidated?'Validity score 5':r.lfr?'Named requirement and compliance year':'';
 r.ccb=norm(r.newCarry)==='change & sustain'||/\bccb\b/i.test(r.name||'');r.region=/north america|greater china|international region/i.test(r.org||'');r.carry=/carry/i.test(r.newCarry||'');
 // A reviewed hygiene classification must retain supporting source evidence.
 r.hygiene=!!r.hygiene&&Array.isArray(r.hygieneEvidence)&&present(r.hygieneEvidence[1]);
 r.scopeReview=r.wasteNums.includes(5)||['CHALLENGE','EXIT'].includes(r.wasteBand)||(r.protected&&rating(m.minimumScope)!==null&&rating(m.minimumScope)<4);
 r.ccbSplitReview=['EW-11','EW-65'].includes(r.item);
 r.benefitM=Number.isFinite(r.benefitM)?r.benefitM:null;r.ratio=r.benefitM!==null&&r.costM>0?r.benefitM/r.costM:null;
 r.highClaim=r.ratio!==null&&r.ratio>5+1e-10;r.benefitOK=r.ratio!==null&&r.ratio>1&&r.ratio<=5+1e-10;
 const bt=r.ratio===null||r.ratio<1?0:r.ratio<2?1:r.ratio<3?2:r.ratio<5?3:4;
 const pt=norm(r.priority)==='must do'?0:norm(r.priority)==='must have'?1:/depri/.test(norm(r.priority))?2:3;
 const impact=consequence(r),wi=['HEALTHY','CONTAIN','CHALLENGE'].indexOf(r.wasteBand);
 r.parts=[p.benefit[bt]/50*p.weights[0],p.priority[pt]/25*p.weights[1],p.impact[impact.tier]/15*p.weights[2],p.waste[wi<0?3:wi]/10*p.weights[3]].map(x=>Math.round(x*100)/100);
 r.score=Math.round(sum(r.parts,x=>x)*100)/100;r.impactPoints=r.parts[2];r.impactEvidence=impact.evidence;
 r.band=r.score>=65?'High merit':r.score>=45?'Strong':r.score>=25?'Limited':'Weak';r.stream=r.stream==='BU Led'||r.stream==='bu'?'bu':'ew';
 r.dependencyRefs=[...String(r.dependency??'').matchAll(/\b(?:BU|EW)-\d+\b/ig)].map(m=>m[0].toLowerCase());
 r.fundedM=0;r.selected=false;r.route='';r.reason='';r.manual=false;r.rank=null;return r;
}
function solve(data,settings){
 validateSettings(settings);const s=clone(settings),rows=data.map(r=>prepare(r,s)),byId=Object.fromEntries(rows.map(r=>[r.item,r])),ids=new Set(rows.map(r=>r.item));
 if(ids.size!==rows.length)throw Error('Source references must be unique.');
 let used=0;const spend=Object.fromEntries(stages.map(k=>[k,0])),queues=Object.fromEntries(stages.map(k=>[k,[]])),alerts=[];
 for(const [id,o] of Object.entries(s.overrides)){if(!ids.has(id))continue;if(!o||!['in','out'].includes(o.choice)||!present(o.reason))throw Error('Manual decisions require a reason.');if(o.amount!==undefined&&(!Number.isFinite(o.amount)||o.amount<0||o.amount>byId[id].costM+EPS))throw Error('Reviewed funding must be within the requested investment.');}
 const regionUsed=()=>round(sum(rows.filter(r=>r.region),r=>r.fundedM)),hygieneUsed=()=>round(sum(rows.filter(r=>r.hygiene),r=>r.fundedM));
 const hygieneHeld=()=>s.releaseHygiene?0:Math.max(0,round(s.budget*s.hygienePct/100-hygieneUsed()));
 const order=(a,b)=>(b.benefitM||0)-(a.benefitM||0)||(b.ratio||0)-(a.ratio||0)||b.score-a.score||a.item.localeCompare(b.item);
 function annotate(r){if(r.scopeReview)r.reason+='; scope review outstanding';if(r.ccbSplitReview)r.reason+='; mandatory share needs guidance';if(r.highClaim&&!r.benefitReviewed)r.reason+='; benefit above five times remains under review';if(r.wasteBand==='Unknown')r.reason+='; waste assessment unknown';}
 function fund(r,amount,reason){amount=round(amount);r.fundedM=amount;r.selected=amount>0;r.reason=reason;used=round(used+amount);spend[r.route]=round(spend[r.route]+amount);annotate(r);}
 for(const r of rows){
  const o=s.overrides[r.item];r.override=o||null;
  if(!r.name||r.costM<=0){r.reason='Missing name or positive requested investment';continue;}
  if(o?.needsReview){r.manual=true;r.reason='Previous manual decision needs review after source change';continue;}
  if(o?.choice==='out'){r.manual=true;r.reason='Manual exclusion: '+o.reason;continue;}
  if(r.protected)r.route='Protected obligations';
  else if(o?.choice==='in')r.route='Reviewed inclusion';
  else if(r.scopeReview){r.reason='Waste finding requires a reviewed scope';continue;}
  else if(r.ccb)r.route='Change and Sustain';
  else if(r.hygiene)r.route='Hygiene';
  else if(!r.benefitOK){r.reason=r.highClaim?'Benefit above five times: review before manual inclusion':r.ratio!==null&&r.ratio<=1?'Benefit does not exceed requested investment':'Missing or unclear quantified benefit';continue;}
  else if(r.score<s.merit){r.reason='Below the minimum merit score';continue;}
  else if(s.assessed&&r.wasteBand==='Unknown'){r.reason='Completed waste assessment required by this scenario';continue;}
  else if(r.region)r.route='Regions';
  else if(r.carry&&r.ratio>=s.carryMultiple)r.route='Carry-over';
  else r.route='Common demand';
  queues[r.route].push(r);
 }
 let mandatoryShortfall=0,ccbShortfall=0;
 for(const r of queues['Protected obligations'].sort((a,b)=>Number(b.matrixImmediate)-Number(a.matrixImmediate)||(b.deadlineRating||0)-(a.deadlineRating||0)||(b.exposureCalculated||0)-(a.exposureCalculated||0)||Number(b.fullyValidated)-Number(a.fullyValidated)||a.item.localeCompare(b.item))){
  const o=r.override,amount=o?.choice==='in'?(o.amount??r.costM):round(r.costM*s.protectedPct/100);r.manual=!!o;
  if(used+amount<=s.budget+EPS)fund(r,amount,o?'Reviewed protected allocation: '+o.reason:r.protectionReason);else{mandatoryShortfall=round(mandatoryShortfall+amount);r.reason='Mandatory allocation does not fit the envelope';}
 }
 const eligibleCCBBase=sum(rows.filter(r=>!r.protected&&r.ccb&&!r.scopeReview&&r.name&&r.costM>0),r=>r.costM);
 if(!mandatoryShortfall){
  for(const r of queues['Change and Sustain']){const amount=round(r.costM*s.ccbPct/100);if(used+amount<=s.budget+EPS)fund(r,amount,'Change and Sustain coverage '+s.ccbPct+'%');else{ccbShortfall=round(ccbShortfall+amount);r.reason='Change and Sustain allocation does not fit the envelope';}}
  // Reviewed inclusions reserve capacity before the automatic competitive stages.
  function allocateQueue(route){
   let waiting=[...queues[route]].sort(route==='Hygiene'?((a,b)=>b.impactPoints-a.impactPoints||a.costM-b.costM||a.item.localeCompare(b.item)):order),progress=true;
   waiting.forEach((r,i)=>r.rank=i+1);
   while(waiting.length&&progress){progress=false;const pending=[];
    for(const r of waiting){
     const o=r.override,manual=route==='Reviewed inclusion',amount=manual?(o.amount??r.costM):r.costM;r.manual=manual;
     if(manual&&r.highClaim&&!r.protected&&!r.ccb&&!r.hygiene&&!o.benefitReviewed){r.reason='Manual inclusion pending: confirm review of the benefit claim';continue;}
     if(manual&&r.scopeReview&&!o.scopeReviewed){r.reason='Manual inclusion pending: confirm the scope review';continue;}
     if(r.dependencyRefs.some(id=>!rows.some(x=>x.item.toLowerCase()===id&&x.fundedM>0&&Math.abs(x.fundedM-x.costM)<EPS))){r.reason='Prerequisite requires funding or a reviewed dependency decision';pending.push(r);continue;}
     if(r.region&&regionUsed()+amount>s.budget*s.regionPct/100+EPS){r.reason='Regional allowance used by earlier and selected demand';continue;}
     if(r.hygiene&&hygieneUsed()+amount>s.budget*s.hygienePct/100+EPS){r.reason='Outside the remaining hygiene reservation';continue;}
     const held=r.hygiene?0:hygieneHeld();
     if(used+amount>s.budget-held+EPS){r.reason=manual?'Reviewed inclusion does not fit: adjust the envelope, reservations or earlier allocations':'Does not fit remaining envelope after reservations';continue;}
     r.benefitReviewed=!!o?.benefitReviewed;fund(r,amount,manual?'Reviewed inclusion: '+o.reason:'Funded through '+route.toLowerCase());progress=true;
    }waiting=pending;
   }
  }
  for(const stage of ['Reviewed inclusion','Regions','Carry-over','Hygiene','Common demand'])allocateQueue(stage);
 }else for(const stage of stages.filter(k=>k!=='Protected obligations'))for(const r of queues[stage])r.reason='Hold: unresolved mandatory funding shortfall';
 rows.forEach(r=>r.unfundedM=round(r.costM-r.fundedM));
 const totals={};for(const t of ['bu','ew','total']){const rr=rows.filter(r=>t==='total'||r.stream===t),selected=rr.filter(r=>r.selected);totals[t]={count:rr.length,n:selected.length,demand:round(sum(rr,r=>r.costM)),spent:round(sum(selected,r=>r.fundedM)),unfunded:round(sum(rr,r=>r.unfundedM)),benefit:round(sum(selected.filter(r=>r.benefitOK&&Math.abs(r.costM-r.fundedM)<EPS),r=>r.benefitM)),unknown:selected.filter(r=>r.wasteBand==='Unknown').length};}
 const protectedGap=round(sum(rows.filter(r=>r.protected),r=>r.unfundedM)),regionCap=round(s.budget*s.regionPct/100),hygieneCap=round(s.budget*s.hygienePct/100),earlierRegion=round(sum(rows.filter(r=>r.region&&['Protected obligations','Change and Sustain'].includes(r.route)),r=>r.fundedM));
 if(protectedGap>EPS)alerts.push('Protected obligations have '+protectedGap.toFixed(3)+' M€ left unfunded. A delivery decision is required.');
 if(mandatoryShortfall>EPS)alerts.push('The mandatory target exceeds the available envelope. Later allocations are held.');
 if(ccbShortfall>EPS)alerts.push('The envelope cannot provide the selected Change and Sustain coverage.');
 if(regionUsed()>regionCap+EPS)alerts.push('Earlier regional allocations exceed the regional allowance. No additional regional demand can be funded.');
 if(hygieneUsed()>hygieneCap+EPS)alerts.push('Protected hygiene work exceeds the hygiene reservation. Review the reservation.');
 const unresolvedManual=rows.filter(r=>r.override?.choice==='in'&&!r.selected);if(unresolvedManual.length)alerts.push(unresolvedManual.length+' reviewed inclusion(s) could not be allocated.');
 const unallocated=round(s.budget-used),held=Math.min(Math.max(0,unallocated),hygieneHeld()),hygieneReservationGap=s.releaseHygiene?0:round(Math.max(0,hygieneHeld()-Math.max(0,unallocated)));
 if(hygieneReservationGap>EPS)alerts.push('The hygiene reservation exceeds capacity left after earlier allocations by '+hygieneReservationGap.toFixed(3)+' M€. Review the reservation or earlier funding.');
 return {rows,byId,totals,spend,settings:s,alerts,eligibleCCBBase:round(eligibleCCBBase),protectedGap,mandatoryShortfall,ccbShortfall,regionCap,regionUsed:regionUsed(),earlierRegion,regionRemaining:Math.max(0,round(regionCap-regionUsed())),regionAdditional:Math.max(0,round(regionCap-earlierRegion)),hygieneCap,hygieneUsed:hygieneUsed(),hygieneHeld:round(held),hygieneReservationGap,unallocated,available:round(unallocated-held),unresolvedManual:unresolvedManual.length};
}
function validateData(data){
 if(!Array.isArray(data)||!data.length||data.length>10000)throw Error('Demand data must contain between 1 and 10,000 records.');const ids=new Set();
 for(const r of data){if(!r||typeof r.item!=='string'||!r.item.trim()||['__proto__','constructor','prototype'].includes(r.item)||ids.has(r.item))throw Error('Each request needs a unique source reference.');ids.add(r.item);if(!Number.isFinite(r.costM)||r.costM<0||r.costM>1000000)throw Error('Invalid requested investment for '+r.item);if(r.benefitM!==null&&(!Number.isFinite(r.benefitM)||r.benefitM<0))throw Error('Invalid benefit for '+r.item);if(!['BU Led','EW','bu','ew'].includes(r.stream))throw Error('Unknown reporting group for '+r.item);if(r.wasteNums&&(!Array.isArray(r.wasteNums)||r.wasteNums.length!==9||r.wasteNums.some(v=>v!==null&&rating(v)===null)))throw Error('Invalid waste ratings for '+r.item);}
 return data;
}
const api={defaults,presets,preset,policy,prepare,solve,validateSettings,validateData,rating,weightedScore,round,stages};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.AOP=api;
})(typeof globalThis!=='undefined'?globalThis:this);
