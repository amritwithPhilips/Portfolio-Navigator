/* One deterministic engine for the dashboard, workbook results and portfolio sessions. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOP=api;})(globalThis,function(){
'use strict';
const VERSION='5.7.0', STAGES=['Legal and Compliance (Must Do)','Carry Over demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification'];
const EXCO_HIERARCHY={
'Deeptha Khanna':{role:'Personal Health',segment:'Personal Health',orgs:['Personal Health (PH)']},
'Shez Partovi':{role:'EI & I&D',segment:'Enterprise Informatics & Innovation',orgs:['Enterprise Informatics (EI)','Innovation and Design Business Operations','Group Innovation & Strategy ']},
'Julia Strandberg':{role:'Connected Care',segment:'Connected Care',orgs:['Monitoring - HPM (MCH)','Ambulatory Monitoring and Diagnostics (AM&D)','Sleep & Respiratory Care (SRC)','CoE Marketing – HS (former DMEC)']},
'Jie Xue':{role:'Precision Diagnosis',segment:'Diagnosis & Treatment',orgs:['Precision Diagnosis - Computed Tomography (CT)','Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)','Precision Diagnosis - Magnetic Resonance (MR)','Precision Diagnosis - Ultrasound (PDU)']},
'Bert van Meurs':{role:'IGT & Service Transformation',segment:'Diagnosis & Treatment',orgs:['Image Guided Therapy - Systems (IGT-S)','Image Guided Therapy - Devices (IGT-D)','Service Transformation Office (STO)']},
'Wim Appelo':{role:'COO & ISC',segment:'Enterprise',orgs:['Integrated Supply Chain (ISC)','SusTaining Engg. Team (STET - ISC)']},
'Özlem Fidanci':{role:'International Regions',segment:'Regions',orgs:['International Regions','International Regions (IR) - Overall','International Regions (IR)','Health & Safety']},
'Jeff DiLullo':{role:'North America',segment:'Regions',orgs:['North America','North America (NAR)']},
'Ling Liu':{role:'Greater China',segment:'Regions',orgs:['Greater China','Greater China (GRC)']},
'Charlotte Hanneman':{role:'Finance & Security',segment:'Enterprise',orgs:['Finance','Group Security']},
'Laura Matz':{role:'Information Technology',segment:'Enterprise',orgs:['Information Technology ']},
'Heidy Schein':{role:'People',segment:'Enterprise',orgs:['People function']},
'Steve C de Baca':{role:'Patient Safety & Quality',segment:'Enterprise',orgs:['Patient Safety & Quality']},
'Carla Rosana Goulart Silva Peron':{role:'Medical Office',segment:'Enterprise',orgs:['Medical Office']},
'Filip Koek':{role:'Internal Audit',segment:'Enterprise',orgs:['Internal Audit ']},
'Marnix van Ginneken':{role:'Legal, Comms & IP&S',segment:'Enterprise',orgs:['Legal','Communications & Brand','Intellectual Property & Standards (IP&S)']}
};
const ORG_RENAME={'Greater China (GRC)':'Greater China','International Regions (IR) - Overall':'International Regions','International Regions (IR)':'International Regions','North America (NAR)':'North America'};
const ORG_TO_EXCO=(function(){const m={};for(const [name,info] of Object.entries(EXCO_HIERARCHY))for(const org of info.orgs)m[org]=name;return m;})();
const excoOf=r=>{const e=ORG_TO_EXCO[r.org];if(e)return e;for(const [name,info] of Object.entries(EXCO_HIERARCHY))for(const org of info.orgs)if(key(r.org)===key(org))return name;return 'Unassigned';};
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=x=>x==null?'':String(x).replace(/[\u200b\u00a0]/g,' ').replace(/\s+/g,' ').trim();
const key=x=>clean(x).toLowerCase().replace(/[—–]/g,'-');
const round=x=>Math.round((x+Number.EPSILON)*1e6)/1e6;
const numeric=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
function numberCell(x){if(numeric(x)!==null)return x;if(typeof x==='string'&&/^-?\d+(?:\.\d+)?$/.test(x.trim()))return Number(x);return null;}
const sum=(rows,f)=>round(rows.reduce((s,r)=>s+(numeric(f(r))??0),0));
function materialFingerprint(r){return JSON.stringify({item:r.item,planisware:r.planisware,org:r.org,name:r.name,type:r.type,newCarry:r.newCarry,category:r.category,platform:r.platform,area:r.area,priority:r.priority,cost:r.cost,benefit:r.benefit,benefitDetails:r.benefitDetails,impact:r.impact,problem:r.problem,scope:r.scope,dependency:r.dependency,decisionBand:r.decisionBand,overall:r.overall,remarks:r.remarks,stream:r.stream,lfrName:r.lfrName,lfrYear:r.lfrYear,baselined:r.baselined,paybackYears:r.paybackYears,allocations:r.allocations||null});}
const defaults=()=>({budget:100,tolerance:0,lfr:{basis:'bucket',pct:100},carry:0,sustain:{basis:'bucket',pct:100},value:{basis:'bucket',pct:100},itsimp:{basis:'bucket',pct:0},itsimpMode:false,merit:45,weights:[40,25,15,10,10]});
function preset(name){const s=defaults();if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s._autoLfr=true;s.carry=0;s.sustain={basis:'bucket',pct:60};s.value={basis:'bucket',pct:100};}if(name==='protect'){s.carry=0;s.value={basis:'aop',pct:10};}if(name==='evidence'){s.carry=0;s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:15};}if(name==='capacity'){s.lfr={basis:'bucket',pct:44};s.carry=0;s.sustain={basis:'bucket',pct:75};s.value={basis:'aop',pct:20};}return s;}
function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Budget invalid.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance invalid.');for(const n of ['lfr','sustain','value'])if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis)||!Number.isFinite(s[n].pct)||s[n].pct<0||(s[n].basis==='bucket'&&s[n].pct>100+1e-9))throw Error(n+' coverage invalid.');for(const n of ['lfr','sustain','value'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error(n+' allocation invalid.');if(s.itsimp){if(!['bucket','aop','amount'].includes(s.itsimp.basis)||!Number.isFinite(s.itsimp.pct||0)||(s.itsimp.pct||0)<0||(s.itsimp.basis==='bucket'&&(s.itsimp.pct||0)>100+1e-9))throw Error('IT Simplification coverage invalid.');if(s.itsimp.basis==='amount'&&(!Number.isFinite(s.itsimp.amount)||s.itsimp.amount<0))throw Error('IT Simplification allocation invalid.');}if(!Number.isFinite(s.carry)||s.carry<0||s.carry>10||!Number.isInteger(s.carry*2))throw Error('Carry threshold invalid.');if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor invalid.');if(!Array.isArray(s.weights)||s.weights.length!==5||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('Weights must total 100.');return true;}
function normalize(workbook){
 const records=[],issues=[],mappings=[];
 for(const sheetName of ['EW','Bu']){
  const sh=workbook.sheets.find(x=>key(x.name)===key(sheetName));if(!sh)throw Error('Required sheet '+sheetName+' is missing.');
  let headerIdx=0;
  for(let hi=0;hi<Math.min(sh.rows.length,10);hi++){
   if((sh.rows[hi]||[]).some(h=>key(clean(h))==='item no.')){headerIdx=hi;break;}
  }
  const header=sh.rows[headerIdx]||[],sub=sh.rows[headerIdx>0?headerIdx-1:1]||[];
  const locate=(aliases,required=true,filter=()=>true)=>{const found=header.map((h,i)=>({h:key(h),i})).filter(x=>aliases.includes(x.h)&&filter(x.i));if(found.length!==1){if(!required&&!found.length)return -1;throw Error(sheetName+': heading '+aliases[0]+' is missing or ambiguous.');}return found[0].i;};
  const ix={item:locate(['item no.']),plan:locate(['planisware id']),org:locate(['organization setting demand [bu, region, coe]']),name:locate(['initiative name']),type:locate(['type']),newCarry:locate(['new initiative or carry-over']),category:locate(['category']),platform:locate(['leading it platform']),area:locate(['investment area']),cost:locate(['it investment requested 2027 [k€]','it investment requested 2027 [keur]']),benefit:locate(['quantified benefits (in k€)','quantified benefits (in keur)']),benefitDetails:locate(['quantified benefits (details)','qualitative benefit','quantified benefits details'],false),impact:locate(['impact and cost of not doing']),problem:locate(['problem statement']),scope:locate(['scope']),dependency:locate(['dependency','dependency (item no & explaination)']),overall:locate(['overall aop decision']),remarks:locate(['remarks / evidence'],false),lfrYear:locate(['lfr & compliancy year'],false),lfrName:locate(['lfr & compliancy (name)','lfr & compliancy name'],false),baselined:locate(['carry over baselined'],false),payback:locate(['payback period','payback','payback (years)'],false)};
  ix.band=locate(['decision band','waste','waste band'],true,i=>key(header[i])==='decision band'||key(header[i])==='waste band'||key(sub[i]).includes('band'));
  ix.priority=locate(['priority'],true,i=>i<ix.problem);
  const allocCols=[];{const usedIdxs=new Set(Object.values(ix));for(let ci=0;ci<header.length;ci++){if(usedIdxs.has(ci))continue;const hh=clean(header[ci]),hk=key(hh),sk=key(clean(sub[ci]||''));if(hh&&((hh.endsWith(' %')||hh.endsWith('%'))&&!hk.includes('capitalization'))||(sk==='%'||sk==='pct'||sk==='percent'||sk.includes('alloc%')||sk.includes('alloc %')))allocCols.push({buName:hh.replace(/\s*%$/,'').trim(),colIdx:ci});}}
  const labels=header.map((h,i)=>(clean(h)||'Column '+(i+1))+(clean(sub[i])?' / '+clean(sub[i]):'')+' ['+col(i)+']');
  mappings.push({sheet:sh.name,fields:ix,sourceHeaders:labels});
  for(let i=headerIdx+1;i<sh.rows.length;i++){
   const row=sh.rows[i]||[],get=k=>row[ix[k]]??null;
   const itemId=clean(get('item')),itemValid=itemId&&!/^0+$/.test(itemId);
   if(!itemValid&&!clean(get('name'))&&!clean(get('cost')))continue;
   const cost=numberCell(get('cost')),benefit=numberCell(get('benefit'));
   if(clean(get('cost'))&&cost===null)throw Error(sh.name+' row '+(i+1)+': requested amount is not numeric.');
   if(cost!==null&&cost<0)throw Error(sh.name+' row '+(i+1)+': requested amount is negative.');
   if(benefit!==null&&benefit<0)issues.push(sh.name+' row '+(i+1)+': negative benefit needs review.');
   const sourceValues=labels.map((label,c)=>({label,value:row[c]??null,formula:(sh.formulas||{})[col(c)+(i+1)]||null}));
   const bld=numberCell(get('baselined'));const pbk=ix.payback>=0?numberCell(get('payback')):null;const r={id:itemValid?itemId:sh.name+'-row-'+(i+1),temporary:!itemValid,item:itemValid?itemId:'',planisware:clean(get('plan')),org:clean(get('org')),name:clean(get('name')),type:clean(get('type')),newCarry:clean(get('newCarry')),category:clean(get('category')),platform:clean(get('platform')),area:clean(get('area')),priority:clean(get('priority')),cost:cost===null?null:round(cost/1000),benefit:benefit===null?null:round(benefit/1000),benefitRaw:get('benefit'),benefitDetails:clean(get('benefitDetails')),impact:clean(get('impact')),problem:clean(get('problem')),scope:clean(get('scope')),dependency:clean(get('dependency')),decisionBand:clean(get('band')),overall:clean(get('overall')),remarks:clean(get('remarks')),lfrYear:clean(get('lfrYear')),lfrName:clean(get('lfrName')),baselined:bld===null?null:round(bld/1000),paybackYears:pbk,stream:sheetName==='EW'?'ew':'bu',sourceSheet:sh.name,sourceRow:i+1,sourceValues};
   // Compare decision-relevant evidence only. Preserve the complete row separately for traceability.
   // This prevents formula-cache or unrelated source-column recalculation from holding valid decisions.
   if(ORG_RENAME[r.org])r.org=ORG_RENAME[r.org];
   // Fingerprint is assigned after allocation fields are available.
   if(allocCols.length){const allocs={};for(const ac of allocCols){const pct=numberCell(row[ac.colIdx]??null);if(pct!==null&&pct>=0&&pct<=100)allocs[ac.buName]=pct;}if(Object.keys(allocs).length){r.allocations=allocs;r.allocationSources=Object.fromEntries(allocCols.map(ac=>[ac.buName,{cell:col(ac.colIdx)+(i+1),formula:(sh.formulas||{})[col(ac.colIdx)+(i+1)]||null}]));}}
   r.fingerprint=materialFingerprint(r);records.push(r);
  }
 }
 // Separate the "Enterprise-wide charging" row — it is a charging key, not a real Programs.
 // It must not inflate demand totals or enter prioritisation. Kept as ewChargingKey for Tab 6 allocation.
 let ewChargingKey=null;
 let programRecords=records.filter(r=>{if(r.name&&key(r.name)==='enterprise-wide charging'){ewChargingKey=r;return false;}return true;});
 const excludedRecords=[];programRecords=programRecords.filter(r=>{const reason=r.cost===null?'Missing requested amount':/^#/.test(r.overall)||/^#/.test(r.decisionBand)||r.overall==='0'?'Uninterpretable source decision':null;if(reason)excludedRecords.push({...r,exclusionReason:reason});return !reason;});
 const ids=new Set();for(const r of programRecords){if(ids.has(r.id))throw Error('Duplicate Item No.: '+r.id);ids.add(r.id);}for(const id of ['EW-11','EW-65','EW-71'])if(!ids.has(id))issues.push('Designated Legal and Compliance exception '+id+' is absent; confirm source identity.');
 return {schema:3,sourceFile:workbook.sourceFile,sourceHash:workbook.sourceHash,version:workbook.sourceHash.slice(0,12),records:programRecords,excludedRecords,ewChargingKey,workbook,issues,mappings};
}
function col(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
const realLfr=v=>!!v&&v!=='0'&&!/^(na|n\/a|tbd|none|not applicable)$/i.test(clean(v));
function isLfrRecord(r){return realLfr(r.lfrName)||realLfr(r.lfrYear);}
function isITSimpProgram(r){const c=(r.category||'').toLowerCase();return c.indexOf('decomm')>=0||c.indexOf('replatform')>=0;}
function stage(r){if(['EW-11','EW-65','EW-71'].includes(r.item))return 0;if(isLfrRecord(r))return 0;if(/must-do/.test(key(r.overall)))return 0;if(key(r.newCarry)==='carry over')return 1;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;return 3;}
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
const REVPROD_RE=/\b(revenue (increase|growth|generation)|productivity (saving|gain|improvement)|sales growth|top[- ]?line growth)\b/i;
function qualitativeBenefit(r){
 const text=clean(r.benefitDetails);
 if(!text||text.length<10||/^(na|tbd|n\/a|none|soft benefit|not applicable|to be determined)$/i.test(text))return {points:0,evidence:text,tier:'none',interpreted:true};
 const hasNonFinQuant=/\d[\d,.]*\s*(%|fte|hours?|days?|processes|sites?|users?|systems?|applications?|minutes?|teams?)\b/i.test(text);
 const crossFunc=/\b(enterprise|cross[- ]?functional|global|company[- ]?wide|all (bus|regions|markets|functions))\b/i.test(text);
 const specificBenefit=/\b(cost (avoidance|reduction|saving)|efficien(cy|t)|automat(e|ion|ing)|eliminat(e|ion|ing)|compliance|regulatory|standardiz|consolidat|streamlin|simplif(y|ication)|reduc(e|tion|ing) (time|effort|risk|cost|manual)|enabl(e|ement|ing)|avoid(ance|ing)|retir(e|ement|ing)|decommission|migrat(e|ion|ing)|modern|optimi[sz]|improv(e|ement|ing) (process|quality|speed|accuracy))\b/i.test(text);
 if(hasNonFinQuant||(crossFunc&&specificBenefit))return {points:30,evidence:text,tier:'quantified-non-financial',interpreted:true};
 if(specificBenefit&&text.length>50)return {points:20,evidence:text,tier:'specific-benefit',interpreted:true};
 return {points:10,evidence:text,tier:'general-statement',interpreted:true};
}
const HARD_AREAS=new Set(['revenue increase','productivity savings','productivity saving','productivity']);
const SOFT_AREAS=new Set(['compliance/keeping the lights on','security','cost avoidance','process simplification/ efficiency gain','process simplification/efficiency gain','process simplification / efficiency gain','enabling','change & sustain – mandatory','it projects – transformation']);
function classifyBenefit(r,ratio,benefitSource){
 const area=key(r.area),hasBenefit=r.benefit!==null&&r.benefit>0;
 let cls='none',label='No Benefit Data',flag=null;
 if(hasBenefit&&HARD_AREAS.has(area)){cls='hard';label='Hard Benefit';}
 else if(hasBenefit&&SOFT_AREAS.has(area)){cls='soft';label='Soft Benefit';}
 else if(hasBenefit){cls=area?'soft':'unclassified';label=area?'Soft Benefit':'Benefit (Unclassified)';}
 else if(clean(r.impact)||clean(r.problem)){cls='qualitative';label='Qualitative Only';}
 if(hasBenefit&&r.benefit>100&&/^\d+$/.test(clean(r.impact))){const impNum=Number(clean(r.impact));if(Math.abs(impNum-r.benefit*1000)<1)flag='keur-suspect';}
 else if(hasBenefit&&r.benefit>100)flag='outlier';
 else if(ratio!==null&&ratio>10)flag='high-ratio';
 else if(cls==='none')flag='no-bizcase';
 return {cls,label,flag};
}
function enrich(r,s,review={}){
 const sourceCost=r.cost;r={...r,sourceCost,cost:Number.isFinite(review.requested)?review.requested:r.cost};
 let st=stage(r);if(s.itsimpMode&&st===3&&isITSimpProgram(r))st=4;const ratio=r.cost>0&&numeric(r.benefit)!==null?r.benefit/r.cost:null,c=consequence(r,review);
 let bp,benefitSource,qb=null;
 if(ratio!==null){bp=ratio<1?0:ratio<3?15:ratio<5?25:ratio<7?35:50;benefitSource='quantitative';}
 else if(REVPROD_RE.test(r.benefitDetails||'')){bp=0;benefitSource='revenue-productivity-unquantified';}
 else{qb=qualitativeBenefit(r);bp=qb.points;benefitSource=qb.points>0?'qualitative':'none';}
 const pp=key(r.priority)==='must do'?25:key(r.priority)==='must have'?18:key(r.priority).startsWith('deprior')?5:0;
 const dp=key(r.decisionBand)==='healthy'?10:key(r.decisionBand)==='contain'?6:0;
 const pk=r.paybackYears===null||r.paybackYears<=0?0:r.paybackYears<=1?10:r.paybackYears<=2?8:r.paybackYears<=3?6:r.paybackYears<=5?4:0;
 const raw=[bp,pp,c.points,dp,pk],components=raw.map((v,i)=>v/[50,25,15,10,10][i]*s.weights[i]),calculatedScore=round(components.reduce((a,b)=>a+b,0)),score=Number.isFinite(review.merit)&&clean(review.note)?review.merit:calculatedScore;
 const warnings=[],holds=[],d=key(r.overall);
 if(!r.decisionBand)warnings.push('Decision Band unassessed');if(!d)warnings.push('Overall AOP decision unassessed');
 if(!r.name)holds.push('Programs name missing');if(!(r.cost>0))holds.push(r.cost===null?'Requested demand missing':'No positive requested demand');
 if(d.includes('priority tbd'))holds.push('Mandatory priority TBD');
 if(d&&!/^(healthy\s*-\s*rank in priority matrix|healthy\s*\/\s*must-do\s*-\s*(p1\s*-\s*immediate|p2\s*-\s*scheduled|priority tbd)|contain\s*-\s*conditions)$/.test(d))holds.push('Overall AOP decision needs mapping');
 if((key(r.decisionBand)==='contain'||d.startsWith('contain'))&&!clean(r.remarks)&&!clean(review.condition)){if(st===0)warnings.push('Mandatory obligation retained; Contain condition needs review');else holds.push('Contain condition needs review');}
 var isBaselinedCarry=st===1&&r.baselined>0,carryConfirmed=st===1&&isBaselinedCarry&&['must do','must have'].includes(key(r.priority));
 
 
 if(st===1&&!carryConfirmed)holds.push('No confirmed approved baseline for Carry Over funding');
 if(st===3&&score<s.merit)holds.push('Below advanced merit floor');
 
 if(benefitSource==='revenue-productivity-unquantified')warnings.push('Revenue/productivity claim requires quantified benefit');
 if(r.benefit!==null&&r.benefit>0&&(r.paybackYears===null||r.paybackYears<=0))warnings.push('Payback period missing for quantified benefit claim');
 if(r.temporary)warnings.push('Temporary source ID');
 const lfrTier=st===0?(key(r.overall).includes('p1')?'Immediate':key(r.overall).includes('p2')?'Scheduled':['EW-11','EW-65','EW-71'].includes(r.item)?'CCB':'Other'):'';const hasLfrEvidence=realLfr(r.lfrName)&&realLfr(r.lfrYear);const lfrVerified=st===0&&(hasLfrEvidence||['EW-11','EW-65','EW-71'].includes(r.item));var carryFundCap=isBaselinedCarry?Math.min(r.cost,r.baselined):(st===1?r.cost:null);
 const exco=excoOf(r);
 const bc=classifyBenefit(r,ratio,benefitSource);
 return {...r,stage:st,stageName:STAGES[st],calculatedScore,ratio,rawComponents:raw,components,score,consequence:c,qualBenefit:qb,benefitSource,benefitClass:bc.cls,benefitClassLabel:bc.label,benefitFlag:bc.flag,lfrTier,hasLfrEvidence,lfrVerified,isBaselinedCarry,carryConfirmed,carryFundCap,paybackPoints:pk,warnings,holds,eligible:!holds.length,review,condition:clean(review.condition)||r.remarks,priorityPoints:pp,exco};
}
function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const va=a.lfrVerified?0:1,vb=b.lfrVerified?0:1;if(va!==vb)return va-vb;const seq=r=>{const d=key(r.overall);return d.includes('p1')?0:d.includes('p2')?1:['EW-11','EW-65','EW-71'].includes(r.item)?2:3;};const x=seq(a)-seq(b);if(x)return x;return b.score-a.score;}if(a.stage===1){const ca=a.carryConfirmed?0:(a.ratio!==null?1:2),cb=b.carryConfirmed?0:(b.ratio!==null?1:2);if(ca!==cb)return ca-cb;return (b.ratio??-Infinity)-(a.ratio??-Infinity)||b.score-a.score;}if(a.stage===2){const st=r=>key(r.newCarry)==='change & sustain'?0:1;const x=st(a)-st(b);if(x)return x;return b.score-a.score;}return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}
function leverTarget(s,k,demand){const v=s[k];if(!v||typeof v!=='object')return demand;return Math.min(demand,v.basis==='amount'?(v.amount||0):(v.basis==='bucket'?demand:s.budget)*v.pct/100);}
function switchBasis(s,k,basis,demand){if(!['lfr','sustain','value','itsimp'].includes(k)||!['bucket','aop','amount'].includes(basis))throw Error('Unknown allocation control.');const next=clone(s),amount=leverTarget(s,k,demand),base=basis==='bucket'?demand:s.budget;if(basis==='aop'&&base===0&&amount>0)throw Error('Enter a positive Total AOP before converting this allocation to its percentage.');next[k]={basis,amount,pct:basis==='amount'?next[k].pct:base?amount/base*100:0};validateSettings(next);return next;}
function solve(data,s,overrides={},reviews={}){
 validateSettings(s);const allEnriched=data.records.map(r=>enrich(r,s,reviews[r.id]));
 const pmiRows=allEnriched.filter(r=>key(r.type)==='pmi'),nonPmiRows=allEnriched.filter(r=>key(r.type)!=='pmi');
 pmiRows.forEach(r=>{r.automatic=r.cost||0;r.final=r.cost||0;r.unfunded=0;r.status='Funded (PMI On Top)';r.reason='PMI — auto-prioritised on top off AOP budget';r.isPmi=true;r.eligible=true;r.holds=[];});
 const rows=nonPmiRows.sort(compare),demand=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));
 const verifiedDemand0=sum(rows.filter(r=>r.stage===0&&r.lfrVerified),r=>r.cost);
 const targets=[leverTarget(s,'lfr',demand[0]),null,leverTarget(s,'sustain',demand[2]),leverTarget(s,'value',demand[3]),s.itsimpMode?leverTarget(s,'itsimp',demand[4]):0],spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;
 const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,3).reduce((a,b)=>a+b,0)));const itsimpReserve=()=>s.itsimpMode&&demand[4]>0?Math.min(targets[4]||0,demand[4]):0;const valueTarget=()=>targets[3]!==null?Math.min(Math.max(0,residual()-itsimpReserve()),targets[3]*(1+s.tolerance/100)):Math.max(0,residual()-itsimpReserve());
 for(const r of rows){r.rank=++rank[r.stage];r.automatic=0;r.reason=r.holds.join('; ');if(r.eligible){const stageLimit=r.stage===3?valueTarget():r.stage===4?(targets[4]!==null?Math.min(demand[4],targets[4]*(1+s.tolerance/100)):residual()):targets[r.stage]===null?Infinity:Math.min(demand[r.stage],targets[r.stage]*(1+s.tolerance/100));if(spent[r.stage]+(r.stage===1?r.carryFundCap:r.cost)>stageLimit+1e-9)r.reason='Whole program does not fit stage target plus tolerance';else if(automatic+(r.stage===1?r.carryFundCap:r.cost)>s.budget*(1+s.tolerance/100)+1e-9)r.reason='Whole program does not fit Total AOP plus tolerance';else{r.automatic=r.stage===1&&r.carryFundCap!==null?r.carryFundCap:r.cost;spent[r.stage]+=r.automatic;automatic+=r.automatic;r.reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank;}}
  const o=overrides[r.id];r.final=r.automatic;r.override=o||null;
  if(o&&o.state!=='needs-review'){if(o.choice==='exclude'){r.final=0;r.reason='Manual exclusion'+(o.note?': '+o.note:'');}else if(o.choice==='include'){const amount=o.amount??r.cost;if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)throw Error(r.id+': invalid prioritised amount.');r.final=round(amount);r.reason=(r.final<r.cost?'Manual scope amount':'Manual inclusion')+(o.note?': '+o.note:'');}}
  if(o?.state==='needs-review')r.warnings.push('Previous decision needs source review');
  if(r.final>0&&r.holds.length)r.warnings.push('Manual evidence exception: '+r.holds.join('; '));
  r.unfunded=r.cost===null?null:round(r.cost-r.final);r.status=r.final>0?(r.final<r.cost?'Partial scope':'Funded'):(o?.choice==='exclude'&&o.state!=='needs-review'?'Excluded':'Not funded');
 }
 const valueAvailable=residual();targets[3]=valueTarget();
 const allocation=sum(rows,r=>r.final),requested=sum(rows,r=>r.cost),auto=sum(rows,r=>r.automatic);
 const totals={requested,allocation,automatic:auto,manual:round(allocation-auto),unfunded:sum(rows,r=>r.unfunded),available:Math.max(0,round(s.budget-allocation)),over:Math.max(0,round(allocation-s.budget)),count:rows.filter(r=>r.final>0).length,partial:rows.filter(r=>r.status==='Partial scope').length,missing:rows.filter(r=>r.cost===null).length};
 const confirmedCarryDemand=sum(rows.filter(r=>r.stage===1&&r.carryConfirmed),r=>r.carryFundCap||r.cost);
 const stages=STAGES.map((name,i)=>({name,demand:demand[i],fundableDemand:demand[i],confirmedCarryDemand:i===1?confirmedCarryDemand:undefined,verifiedDemand:i===0?verifiedDemand0:undefined,target:targets[i],automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),allocation:sum(rows.filter(r=>r.stage===i),r=>r.final)}));
 const selectionAmounts=stages.map((stage,i)=>(i===3||i===4)?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10)};
 const pmiTotal={count:pmiRows.length,requested:sum(pmiRows,r=>r.cost),funded:sum(pmiRows,r=>r.final)};
 const allRows=rows.concat(pmiRows);
 const answer={version:VERSION,rows:allRows,totals,stages,valueAvailable,selection,pmi:pmiTotal,streams:Object.fromEntries(['ew','bu'].map(x=>[x,{requested:sum(rows.filter(r=>r.stream===x),r=>r.cost),automatic:sum(rows.filter(r=>r.stream===x),r=>r.automatic),allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};
 const op=globalThis.OPS_DATA||(typeof document!=='undefined'?JSON.parse(document.getElementById('ops-data').textContent):null);answer.finance=finance(data,answer,op);return answer;
}
function autoLfrPct(data,s){if(!s._autoLfr)return;delete s._autoLfr;const rows=data.records.map(r=>enrich(r,s)),s0=rows.filter(r=>r.stage===0),total=sum(s0,r=>r.cost),verified=sum(s0.filter(r=>r.lfrVerified),r=>r.cost);s.lfr.pct=total>0?round(verified/total*100):100;}
function createSession(data){const s=preset('optimal');autoLfrPct(data,s);return {schema:4,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Optimal Segmentation',preset:'optimal',revision:0,status:'Draft',data,settings:s,overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}
function transact(session,action,details={},origin='AOP Scenarios'){
 if(session.status==='Finalised'&&!['fork'].includes(action))throw Error('Finalised scenario. Create a new working version to edit.');
 const next=clone(session),old={settings:clone(next.settings),overrides:clone(next.overrides),reviews:clone(next.reviews),status:next.status};
 if(action==='setting'){next.settings=clone(details.settings);validateSettings(next.settings);next.preset='custom';}
 else if(action==='preset'){next.settings=preset(details.preset);next.settings.budget=session.settings.budget;autoLfrPct(next.data,next.settings);next.preset=Object.keys(next.overrides).length?'custom':details.preset;next.name=({optimal:'Optimal Segmentation',protect:'Protect commitments',evidence:'Tighten carryover evidence',capacity:'Release sustain capacity'})[details.preset]||next.name;}
 else if(action==='program'||action==='group'){
  for(const id of details.ids||[details.id]){const r=next.data.records.find(r=>r.id===id);if(!r)throw Error('Programs not found.');
   const before=next.overrides[id];if(details.choice==='automatic')delete next.overrides[id];else{const request=next.reviews[id]?.requested??r.cost,amount=details.choice==='exclude'?0:(details.amount??request);if(!Number.isFinite(amount)||amount<0||!(request>0)||amount>request+1e-9)throw Error('Prioritised amount must be between zero and the source request.');next.overrides[id]={choice:amount===0?'exclude':'include',amount,note:details.note??before?.note??'',fingerprint:r.fingerprint,state:'active'};}
  }next.preset='custom';
 }
 else if(action==='review'){if(details.review.requested!==undefined&&(!Number.isFinite(details.review.requested)||details.review.requested<0))throw Error('Requested amount invalid');if(details.review.merit!==undefined&&(!Number.isFinite(details.review.merit)||details.review.merit<0||details.review.merit>100||!clean(details.review.note)))throw Error('Merit override requires 0–100 and a rationale');const r=next.data.records.find(x=>x.id===details.id);if(!r)throw Error('Programs not found.');next.reviews[details.id]={...details.review,fingerprint:r.fingerprint};next.preset='custom';}
 else if(action==='reset'){next.overrides={};next.reviews={};}
 else if(action==='resolve'){const o=next.overrides[details.id],r=next.data.records.find(x=>x.id===details.id);if(!o||!r)throw Error('No pending source decision.');if(details.discard)delete next.overrides[details.id];else {if(o.amount>r.cost||!(r.cost>0))throw Error('Previous amount exceeds refreshed request. Return to automatic and edit a valid amount.');o.state='active';o.fingerprint=r.fingerprint;}}
 else if(action==='finalise'){const pending=solve(next.data,next.settings,next.overrides,next.reviews).rows.filter(r=>r.override?.state==='needs-review');if(pending.length)throw Error('Resolve '+pending.length+' refreshed decisions before finalising.');next.status='Finalised';}
 else if(action==='fork'){const forkId='scenario-'+Date.now();Object.assign(next,{id:forkId,parent:session.id,name:session.name+' (fork)',revision:0,status:'Draft',ruleVersion:VERSION,events:[],savedAt:null,excoTradeoffs:{}});}
 else throw Error('Unknown action '+action);
 const result=solve(next.data,next.settings,next.overrides,next.reviews);
 next.revision++;next.events.push({id:'event-'+Date.now()+'-'+next.revision,time:new Date().toISOString(),origin,action,details:clone(details),sourceVersion:next.data.version,revision:next.revision,before:old,after:{settings:next.settings,overrides:next.overrides,reviews:next.reviews,status:next.status},allocation:result.totals.allocation,overBudget:result.totals.over,actor:'Local session'});next.savedAt=null;return next;
}
function undo(session){if(session.status==='Finalised')throw Error('Create a working version before undo.');const event=[...session.events].reverse().find(e=>e.action!=='undo'&&!session.events.some(u=>u.action==='undo'&&u.undoId===e.id));if(!event)throw Error('Nothing to undo.');if(!event.before||!event.before.settings)throw Error('Source refresh cannot be undone here. Reopen the previous saved scenario.');const next=clone(session);Object.assign(next,clone(event.before));next.revision++;next.events.push({id:'undo-'+Date.now(),time:new Date().toISOString(),origin:'Decision log',action:'undo',undoId:event.id,revision:next.revision,sourceVersion:next.data.version,details:{message:'Undid '+event.action+'.'}});next.savedAt=null;return next;}
function refreshPreview(session,data){const old=new Map(session.data.records.map(r=>[r.id,r])),fresh=new Map(data.records.map(r=>[r.id,r])),unchanged=[],changed=[],added=[],removed=[];for(const r of data.records){const prev=old.get(r.id);if(!prev)added.push(r.id);else if(prev.fingerprint!==r.fingerprint||(r.temporary&&data.sourceHash!==session.data.sourceHash))changed.push(r.id);else unchanged.push(r.id);}for(const r of session.data.records)if(!fresh.has(r.id))removed.push(r.id);return {added,changed,removed,unchanged,requested:sum(data.records,r=>r.cost)};}
function refresh(session,data,audit){const diff=refreshPreview(session,data),next=clone(session);next.parent=session.id;next.id='scenario-'+Date.now();next.status='Draft';next.name=session.name+' refreshed';next.data=data;delete next.conferences;next.reviews={};next.overrides={};for(const r of data.records){if(diff.unchanged.includes(r.id)&&session.reviews[r.id])next.reviews[r.id]=clone(session.reviews[r.id]);if(session.overrides[r.id])next.overrides[r.id]={...session.overrides[r.id],state:diff.unchanged.includes(r.id)?session.overrides[r.id].state:'needs-review'};}next.revision++;const evtDetails=audit?{...diff,audit:{timestamp:audit.timestamp,sourceVersion:audit.sourceVersion,deltas:audit.deltas,actions:audit.actions,diffSummary:{added:audit.diff.added.length,changed:audit.diff.changed.length,removed:audit.diff.removed.length,unchanged:audit.diff.unchanged}}}:diff;next.events.push({id:'refresh-'+Date.now(),time:new Date().toISOString(),origin:'Demand refresh',action:'refresh',revision:next.revision,sourceVersion:data.version,details:evtDetails});next.savedAt=null;return next;}
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

function snapshotState(solveResult){
 const rows=solveResult.rows,tot=solveResult.totals,stg=solveResult.stages,str=solveResult.streams;
 const exco={};for(const r of rows){const e=r.exco||'Unassigned';if(!exco[e])exco[e]={requested:0,funded:0,hardBen:0,softBen:0,count:0,fundedCount:0};exco[e].requested+=r.cost||0;exco[e].count++;if(r.final>0){exco[e].funded+=r.final;exco[e].fundedCount++;}if(r.benefitClass==='hard')exco[e].hardBen+=r.benefit||0;else if(r.benefitClass==='soft')exco[e].softBen+=r.benefit||0;}
 for(const k of Object.keys(exco)){const v=exco[k];v.requested=round(v.requested);v.funded=round(v.funded);v.hardBen=round(v.hardBen);v.softBen=round(v.softBen);}
 const ben={hard:0,soft:0,qualitative:0,none:0};for(const r of rows){const c=r.benefitClass||'none';if(c==='hard')ben.hard+=r.benefit||0;else if(c==='soft')ben.soft+=r.benefit||0;else if(c==='qualitative')ben.qualitative++;else ben.none++;}
 ben.hard=round(ben.hard);ben.soft=round(ben.soft);
 return {rowCount:rows.length,requested:tot.requested,allocation:tot.allocation,unfunded:tot.unfunded,funded:tot.count,partial:tot.partial,missing:tot.missing,ewAllocation:str.ew.allocation,buAllocation:str.bu.allocation,stages:stg.map(s=>({name:s.name,demand:s.demand,allocation:s.allocation})),exco,benefits:ben};
}
function auditRefresh(session,newData){
 const diff=refreshPreview(session,newData);
 const beforeResult=solve(session.data,session.settings,session.overrides,session.reviews);
 const afterOverrides={},afterReviews={};
 for(const r of newData.records){
  if(diff.unchanged.includes(r.id)){if(session.overrides[r.id])afterOverrides[r.id]=clone(session.overrides[r.id]);if(session.reviews[r.id])afterReviews[r.id]=clone(session.reviews[r.id]);}
  else if(diff.changed.includes(r.id)&&session.overrides[r.id])afterOverrides[r.id]={...session.overrides[r.id],state:'needs-review'};
 }
 const afterResult=solve(newData,session.settings,afterOverrides,afterReviews);
 const before=snapshotState(beforeResult),after=snapshotState(afterResult);
 const allExco=new Set([...Object.keys(before.exco),...Object.keys(after.exco)]);
 const excoDelta={};for(const ec of allExco){const b=before.exco[ec]||{requested:0,funded:0,hardBen:0,softBen:0,count:0,fundedCount:0};const a=after.exco[ec]||{requested:0,funded:0,hardBen:0,softBen:0,count:0,fundedCount:0};excoDelta[ec]={requestedDelta:round(a.requested-b.requested),fundedDelta:round(a.funded-b.funded),hardBenDelta:round(a.hardBen-b.hardBen),softBenDelta:round(a.softBen-b.softBen),countDelta:a.count-b.count,fundedCountDelta:a.fundedCount-b.fundedCount};}
 const deltas={rowCount:after.rowCount-before.rowCount,requested:round(after.requested-before.requested),allocation:round(after.allocation-before.allocation),unfunded:round(after.unfunded-before.unfunded),ewDelta:round(after.ewAllocation-before.ewAllocation),buDelta:round(after.buAllocation-before.buAllocation),stages:before.stages.map((s,i)=>({name:s.name,demandDelta:round((after.stages[i]?.demand||0)-s.demand),allocationDelta:round((after.stages[i]?.allocation||0)-s.allocation)})),exco:excoDelta,benefitClassShifts:0};
 const oldMap=new Map(beforeResult.rows.map(r=>[r.id,r])),newMap=new Map(afterResult.rows.map(r=>[r.id,r]));
 const MATERIAL=['org','name','type','newCarry','category','platform','area','priority','cost','benefit','benefitDetails','impact','problem','scope','dependency','decisionBand','overall','remarks'];
 const changedDetails=[];let benefitShifts=0;
 for(const id of diff.changed){const ob=oldMap.get(id),nb=newMap.get(id);if(!ob||!nb)continue;const fieldChanges=[];for(const f of MATERIAL){const ov=ob[f]??null,nv=nb[f]??null;if(JSON.stringify(ov)!==JSON.stringify(nv))fieldChanges.push({field:f,before:ov,after:nv});}const scoreDelta=round((nb.score||0)-(ob.score||0));if(ob.benefitClass!==nb.benefitClass)benefitShifts++;changedDetails.push({id,name:nb.name,org:nb.org,exco:nb.exco||'Unassigned',fieldChanges,impactChanges:{scoreDelta,stageBefore:ob.stageName,stageAfter:nb.stageName,statusBefore:ob.status,statusAfter:nb.status,fundedBefore:ob.final||0,fundedAfter:nb.final||0,benefitClassBefore:ob.benefitClass,benefitClassAfter:nb.benefitClass}});}
 deltas.benefitClassShifts=benefitShifts;
 const addedDetails=diff.added.map(id=>{const r=newMap.get(id);return r?{id,name:r.name,org:r.org,exco:r.exco||'Unassigned',cost:r.cost,benefit:r.benefit,stage:r.stageName,status:r.status,benefitClass:r.benefitClass}:{id,name:'',org:'',exco:'Unassigned',cost:0,benefit:0,stage:'',status:'',benefitClass:''};});
 const removedDetails=diff.removed.map(id=>{const r=oldMap.get(id);return r?{id,name:r.name,org:r.org,exco:r.exco||'Unassigned',cost:r.cost,benefit:r.benefit,stage:r.stageName,status:r.status,hadOverride:!!session.overrides[id]}:{id,name:'',org:'',exco:'Unassigned',cost:0,benefit:0,stage:'',status:'',hadOverride:false};});
 const actions=[];
 for(const c of changedDetails){if(session.overrides[c.id])actions.push({severity:'critical',id:c.id,type:'stale-override',message:'Previous decision for '+c.id+' ('+c.name+') needs review — source data changed: '+c.fieldChanges.map(f=>f.field).join(', ')});}
 for(const r of removedDetails){if(r.hadOverride)actions.push({severity:'warning',id:r.id,type:'orphaned-override',message:'Programs '+r.id+' ('+r.name+') removed from source but had a manual decision'});}
 for(const a of addedDetails)actions.push({severity:'warning',id:a.id,type:'new-Programs',message:'New Programs '+a.id+' ('+a.name+') requires assessment — '+a.stage+', '+(a.cost!==null?a.cost.toFixed(1)+' M€ requested':'no request')});
 for(const c of changedDetails){if(c.impactChanges.stageBefore!==c.impactChanges.stageAfter)actions.push({severity:'warning',id:c.id,type:'stage-change',message:c.id+' ('+c.name+') moved from '+c.impactChanges.stageBefore+' to '+c.impactChanges.stageAfter});}
 if(after.allocation>session.settings.budget*(1+session.settings.tolerance/100))actions.push({severity:'critical',id:null,type:'over-budget',message:'Refresh pushes allocation to '+after.allocation.toFixed(1)+' M€, exceeding budget of '+session.settings.budget.toFixed(1)+' M€'});
 for(const c of changedDetails){if(c.impactChanges.benefitClassBefore!==c.impactChanges.benefitClassAfter)actions.push({severity:'info',id:c.id,type:'benefit-class-change',message:'Benefit classification for '+c.id+' changed from '+(c.impactChanges.benefitClassBefore||'none')+' to '+(c.impactChanges.benefitClassAfter||'none')});}
 actions.sort((a,b)=>{const sev={critical:0,warning:1,info:2};return (sev[a.severity]||9)-(sev[b.severity]||9);});
 return {timestamp:new Date().toISOString(),sourceVersion:{before:session.data.version,after:newData.version},before,after,deltas,diff:{added:addedDetails,changed:changedDetails,removed:removedDetails,unchanged:diff.unchanged.length},actions};
}
function filter(rows,f={}){return rows.filter(r=>['org','platform','newCarry','area','status','stageName','exco'].every(k=>!f[k]?.length||f[k].includes(clean(r[k])||'Not supplied'))&&(!f.search||key(r.id+' '+r.name+' '+r.org).includes(key(f.search))));}
function validateSession(s){if(!s||(s.schema!==3&&s.schema!==4)||!s.data?.workbook||!Array.isArray(s.events)||!['Draft','Finalised'].includes(s.status)||!s.filters||!s.overrides||!s.reviews||!Number.isInteger(s.revision)||typeof s.name!=='string')throw Error('Unsupported or incomplete scenario format.');if(Array.isArray(s.settings.weights)&&s.settings.weights.length===4)s.settings.weights=[40,25,15,10,10];s.schema=4;validateSettings(s.settings);const rebuilt=normalize(s.data.workbook);if(rebuilt.version!==s.data.version)throw Error('Session source version does not match its workbook snapshot.');if(rebuilt.records.length!==s.data.records.length||!rebuilt.records.every(function(r,i){return r.id===s.data.records[i].id;}))throw Error('Session source records do not match its workbook snapshot.');s.data.records=rebuilt.records;const ids=new Set(rebuilt.records.map(r=>r.id));for(const [id,o] of Object.entries(s.overrides)){if(!ids.has(id)||!o||!['include','exclude'].includes(o.choice)||!['active','needs-review'].includes(o.state))throw Error('Invalid program override.');}for(const id of Object.keys(s.reviews))if(!ids.has(id))throw Error('Review refers to missing source ID.');if(s.status==='Finalised'&&Object.values(s.overrides).some(o=>o.state==='needs-review'))throw Error('Finalised scenario contains unresolved refreshed decisions.');return true;}
return {finance,tradeoff,VERSION,STAGES,EXCO_HIERARCHY,ORG_TO_EXCO,ORG_RENAME,excoOf,clone,clean,key,round,numeric,sum,col,defaults,preset,autoLfrPct,validateSettings,leverTarget,switchBasis,normalize,stage,enrich,solve,createSession,transact,undo,refreshPreview,refresh,auditRefresh,snapshotState,filter,validateSession};
});
/* Offline XLSX IO: OOXML ZIP with typed cells; native browser decompression. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOPWorkbook=api;})(globalThis,function(){
'use strict';const enc=new TextEncoder(),dec=new TextDecoder();
const xml=x=>String(x??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const col=i=>{let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;};
function crc32(bytes){let crc=-1;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=crc>>>1^((crc&1)?0xedb88320:0);}return (crc^-1)>>>0;}
function zip(entries){const files=[],central=[];let offset=0;for(const [path,value] of Object.entries(entries)){const name=enc.encode(path),data=typeof value==='string'?enc.encode(value):value,crc=crc32(data),head=new Uint8Array(30+name.length),v=new DataView(head.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);head.set(name,30);files.push(head,data);const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);central.push(c);offset+=head.length+data.length;}const cs=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,cs,true);v.setUint32(16,offset,true);const all=[...files,...central,end],out=new Uint8Array(all.reduce((n,x)=>n+x.length,0));let p=0;for(const x of all){out.set(x,p);p+=x.length;}return out;}
async function unzip(bytes){const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=bytes.length-22;for(;end>=Math.max(0,bytes.length-65558);end--)if(view.getUint32(end,true)===0x06054b50)break;if(end<0)throw Error('Not a supported Excel workbook.');const count=view.getUint16(end+10,true);let p=view.getUint32(end+16,true),total=0;const out={};if(count>10000)throw Error('Workbook contains too many ZIP parts.');for(let i=0;i<count;i++){if(view.getUint32(p,true)!==0x02014b50)throw Error('Invalid ZIP directory.');const method=view.getUint16(p+10,true),compressed=view.getUint32(p+20,true),size=view.getUint32(p+24,true),nl=view.getUint16(p+28,true),el=view.getUint16(p+30,true),cl=view.getUint16(p+32,true),local=view.getUint32(p+42,true),name=dec.decode(bytes.slice(p+46,p+46+nl));total+=size;if(total>100e6)throw Error('Workbook expanded size exceeds 100 MB.');const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true),body=bytes.slice(start,start+compressed);let value;if(method===0)value=body;else if(method===8){const stream=new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw'));value=new Uint8Array(await new Response(stream).arrayBuffer());}else throw Error('Unsupported Excel compression.');if(value.length!==size||crc32(value)!==view.getUint32(p+16,true))throw Error('Workbook ZIP integrity check failed.');out[name]=value;p+=46+nl+el+cl;}return out;}
function parseXML(x){const doc=new DOMParser().parseFromString(x,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid Excel XML.');return doc;}
const els=(n,name)=>Array.from(n.getElementsByTagNameNS('*',name));
const text=(n,name)=>els(n,name).map(x=>x.textContent).join('');
async function read(bytes,sourceFile){const parts=await unzip(bytes);if(!parts['xl/workbook.xml'])throw Error('Excel workbook.xml missing.');const strings=parts['xl/sharedStrings.xml']?els(parseXML(dec.decode(parts['xl/sharedStrings.xml'])),'si').map(si=>text(si,'t')):[];
const rels=els(parseXML(dec.decode(parts['xl/_rels/workbook.xml.rels'])),'Relationship'),relmap=Object.fromEntries(rels.map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));const workbook=els(parseXML(dec.decode(parts['xl/workbook.xml'])),'sheet'),sheets=[];
for(const sh of workbook){const target=relmap[sh.getAttribute('r:id')],path=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');if(!parts[path])throw Error('Missing worksheet '+sh.getAttribute('name'));const doc=parseXML(dec.decode(parts[path])),rows=[],formulas={},shared={};let maxcol=0;
for(const cell of els(doc,'c')){const ref=cell.getAttribute('r'),match=/^([A-Z]+)(\d+)$/.exec(ref||'');if(!match)continue;const row=Number(match[2])-1;let c=0;for(const ch of match[1])c=c*26+ch.charCodeAt(0)-64;c--;if(row>=50000||c>=200)throw Error('Workbook exceeds 50,000 rows or 200 columns.');maxcol=Math.max(maxcol,c+1);rows[row]??=[];const type=cell.getAttribute('t'),v=text(cell,'v');let value=null;if(type==='s')value=strings[Number(v)]??null;else if(type==='inlineStr')value=text(cell,'t');else if(type==='b')value=v==='1';else if(type==='str'||type==='e')value=v===''?null:v;else if(v!=='')value=Number.isFinite(Number(v))?Number(v):v;rows[row][c]=value;const f=els(cell,'f')[0];if(f){if(f.getAttribute('t')==='shared'){const si=f.getAttribute('si');if(f.textContent)shared[si]={formula:f.textContent,row:row+1,col:c};const anchor=shared[si];if(!anchor)throw Error('Unresolved shared formula '+ref);const dr=row+1-anchor.row,dc=c-anchor.col;formulas[ref]='='+anchor.formula.split(/("(?:[^"]|"")*")/).map((part,i)=>i%2?part:part.replace(/(\$?)([A-Z]{1,3})(\$?)(\d+)/g,(m,ac,letters,ar,rn)=>{let n=0;for(const ch of letters)n=n*26+ch.charCodeAt(0)-64;return ac+col(n-1+(ac?0:dc))+ar+(Number(rn)+(ar?0:dr));})).join('');}else formulas[ref]='='+f.textContent;}}
const complete=Array.from({length:rows.length},(_,i)=>Array.from({length:maxcol},(_,j)=>rows[i]?.[j]??null));sheets.push({name:sh.getAttribute('name'),rows:complete,formulas});}
let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.slice(i,i+32768));const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');return {sourceFile,sourceHash:hash,originalBase64:btoa(binary),sheets};}
function write(sheets){const entries={},ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';entries['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';entries['_rels/.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';entries['xl/workbook.xml']='<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl" lastEdited="7" lowestEdited="7" rupBuild="22228"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="14400"/></bookViews><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';entries['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';entries['xl/styles.xml']='<styleSheet xmlns="'+ns+'"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.0"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF00126E"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1155A0"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE9F8"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="164" fontId="1" fillId="3" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="0" xfId="0"/><xf numFmtId="164" fontId="2" fillId="4" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';sheets.forEach((s,i)=>{const max=Math.max(...s.rows.map(r=>r.length),1);const rStyl=s.rowStyles||[];const cw=s.colWidths||[];const fr=s.freezeRow!=null?s.freezeRow:(s.filter?1:0);const colsXml=Array.from({length:max},(_,c)=>'<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+(cw[c]||(c===0?14:c===1?28:c===2?42:14))+'" customWidth="1"/>').join('');let sv='<sheetView workbookViewId="0">';if(fr>0)sv+='<pane ySplit="'+fr+'" topLeftCell="A'+(fr+1)+'" activePane="bottomLeft" state="frozen"/>';sv+='</sheetView>';const cs=(rs,isNum)=>rs===1?1:rs===2?(isNum?4:3):rs===3?(isNum?6:5):(isNum?2:0);const rowsXml=s.rows.map((row,r)=>{const rs=rStyl[r]||0;return '<row r="'+(r+1)+'">'+row.map((v,c)=>{if(v===null||v===undefined)return '';const ref=col(c)+(r+1);if(typeof v==='number'&&Number.isFinite(v))return '<c r="'+ref+'" s="'+cs(rs,true)+'"><v>'+v+'</v></c>';if(typeof v==='boolean')return '<c r="'+ref+'" t="b" s="'+cs(rs,false)+'"><v>'+(v?1:0)+'</v></c>';return '<c r="'+ref+'" t="str" s="'+cs(rs,false)+'"><v>'+xml(v)+'</v></c>';}).join('')+'</row>';}).join('');const af=s.filter?'<autoFilter ref="A1:'+col(max-1)+s.rows.length+'"/>':'';entries['xl/worksheets/sheet'+(i+1)+'.xml']='<worksheet xmlns="'+ns+'"><sheetViews>'+sv+'</sheetViews><cols>'+colsXml+'</cols><sheetData>'+rowsXml+'</sheetData>'+af+'</worksheet>';});return zip(entries);}
function sheets(session,result,rows,scope){const A=globalThis.AOP||(typeof require==='function'?require('./engine.js'):null);const OPS=(function(){try{if(globalThis.OPS)return globalThis.OPS;var el=typeof document!=='undefined'&&document.getElementById('ops-data');return el&&el.textContent?JSON.parse(el.textContent):null;}catch(e){return null;}})();const up=x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10;const nn=x=>x==null?'':x;const m1=x=>x==null?'':up(x);const stages=result.stages||[];const w=session.settings.weights||[];const weightLabels=['Benefit ('+nn(w[0])+'%)','Priority ('+nn(w[1])+'%)','Consequence ('+nn(w[2])+'%)','Band ('+nn(w[3])+'%)','Payback ('+nn(w[4])+'%)'];const nComp=(result.rows[0]&&result.rows[0].components)?result.rows[0].components.length:w.length||5;const allRows=result.rows;const fundedRows=allRows.filter(r=>r.final>0);function mkSheet(){const rs=[],st=[];return {push:(row,style=0)=>{rs.push(row);st.push(style);},rows:()=>rs,styles:()=>st};}const typeSort=t=>{const k=(t||'').toLowerCase();if(k.includes('bu')&&(k.includes('led')||k==='bu'))return 0;if(k.includes('cross'))return 1;if(k==='f&r'||k.includes('f&r')||k.startsWith('f')&&k.includes('r'))return 2;return 3;};const rawTypes=[...new Set(allRows.map(r=>r.type||''))].filter(Boolean).sort((a,b)=>typeSort(a)-typeSort(b));const typeLabel=t=>{const k=(t||'').toLowerCase();if(k.includes('bu')&&(k.includes('led')||k==='bu'))return 'Type 1 \u2014 BU Led';if(k.includes('cross'))return 'Type 2 \u2014 Cross BU';if(k==='f&r'||k.includes('f&r'))return 'Type 3 \u2014 F&R';return t||'Unclassified';};const EXCO_H=A&&A.EXCO_HIERARCHY||{};const excoNames=Object.keys(EXCO_H).length?Object.keys(EXCO_H):[...new Set(allRows.map(r=>r.exco||'Unassigned'))];const xtab={};for(const ex of excoNames)xtab[ex]={};for(const r of allRows){const ex=r.exco||'Unassigned';const ty=r.type||'Unclassified';if(!xtab[ex])xtab[ex]={};if(!xtab[ex][ty])xtab[ex][ty]={count:0,req:0,funded:0,fundedCount:0};xtab[ex][ty].count++;xtab[ex][ty].req+=r.cost||0;if(r.final>0){xtab[ex][ty].funded+=r.final;xtab[ex][ty].fundedCount++;}}const sortedExcos=[...excoNames,...Object.keys(xtab).filter(e=>!excoNames.includes(e))];const stageLabels=['Legal and Compliance (Must Do)','Carry Over Demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification'];const stageLogic=['Verified mandatory obligation (LFR name + year) or CCB exception — 100% funded','Prior-year commitments funded at min(demand, approved baseline)','Change & Sustain engineering + CI/upgrades — keeps lights on','New features, AI initiatives — ranked by evidence strength','Decommissioning & Replatforming — separated from Value Based'];const sc1=mkSheet();const opsTotal=(OPS&&OPS.meta&&OPS.meta.opsTotal2027)||469.7;const opsTotal26=(OPS&&OPS.meta&&OPS.meta.opsTotal2026)||470.7;const pmiAlloc=result.pmi?.funded||0,allDemand=A.sum(allRows,r=>r.cost);const progAlloc=result.totals.allocation+pmiAlloc;const ewAlloc=result.streams.ew.allocation;const buAlloc=result.streams.bu.allocation;function finishAllocation(sheet,bu,ew,op){const pendingBU=buAlloc-bu,pendingEW=ewAlloc-ew;if(Math.abs(pendingBU)>1e-8)sheet.push(['BU Programs pending allocation keys',pendingBU,0,0,pendingBU,'Unattributed; retained in total'],0);if(Math.abs(pendingEW)>1e-8)sheet.push(['F&R pending charging key',0,pendingEW,0,pendingEW,'Unattributed; retained in total'],0);sheet.push(['PMI on top',0,0,0,pmiAlloc,'Outside base AOP; no BU charge'],0);sheet.push(['TOTAL',buAlloc,ewAlloc,op,buAlloc+ewAlloc+pmiAlloc+op,'Includes PMI on top'],3);} const benefitsTotal=A.sum(fundedRows,r=>r.benefit||0);sc1.push(['AOP 2027 IT Portfolio \u2014 Scenario Overview','','','',''],1);sc1.push(['Scenario',session.name,'','Status',session.status],0);sc1.push(['Source file',session.data.sourceFile,'','Generated',new Date().toISOString().slice(0,19).replace('T',' ')],0);sc1.push(['Revision','r'+session.revision,'','Source version',session.data.version],0);sc1.push([''],0);sc1.push(['\u2500\u2500 Total IT AOP 2027 \u2500\u2500','','','',''],2);sc1.push(['Component','Exact M\u20ac','Display M\u20ac (1dp)','Notes',''],1);sc1.push(['Operations AOP 2027',opsTotal,m1(opsTotal),'Pre-aligned Bill of IT',''],0);sc1.push(['Prioritised Programs AOP',progAlloc,m1(progAlloc),fundedRows.length+' Programs funded ('+allRows.filter(r=>r.status==='Partial scope').length+' partial scope)',''],0);sc1.push(['TOTAL IT AOP 2027',opsTotal+progAlloc,m1(opsTotal+progAlloc),'',''],3);sc1.push(['YoY Operations delta',opsTotal-opsTotal26,m1(opsTotal-opsTotal26),'vs '+m1(opsTotal26)+' M\u20ac 2026 run-rate',''],0);sc1.push([''],0);sc1.push(['\u2500\u2500 Programs AOP Split \u2500\u2500','','','',''],2);sc1.push(['Component','M\u20ac','% of Prog AOP','Notes',''],1);sc1.push(['Functions & Regions (F&R / EW)',ewAlloc,m1(progAlloc?ewAlloc/progAlloc*100:0)+'%','Cross-BU platforms & compliance',''],0);sc1.push(['BU-Led Programs',buAlloc,m1(progAlloc?buAlloc/progAlloc*100:0)+'%','Direct BU investment',''],0);sc1.push(['PMI on top',pmiAlloc,m1(progAlloc?pmiAlloc/progAlloc*100:0)+'%','Not charged to BUs',''],0);sc1.push(['Total Programs AOP',progAlloc,'100%','',''],3);sc1.push(['Hard benefits (submitted lifetime)',A.sum(fundedRows.filter(r=>r.benefitClass==='hard'),r=>r.benefit),'','Not annual savings',''],0);sc1.push(['Soft benefits (submitted lifetime)',A.sum(fundedRows.filter(r=>r.benefitClass==='soft'),r=>r.benefit),'','Not annual savings',''],0);sc1.push(['Total demand submitted',allDemand,m1(allDemand),'All '+allRows.length+' Programs',''],0);sc1.push(['Demand not funded',result.totals.unfunded,m1(result.totals.unfunded),'Unfunded in current scenario',''],0);sc1.push([''],0);sc1.push(['\u2500\u2500 Priority Funding Breakdown \u2500\u2500','','','','','',''],2);sc1.push(['Priority','Stage Name','# Programs','Demand M\u20ac','Funded M\u20ac','% Funded','Logic'],1);(stages||[]).forEach(function(st,i){const stRows=allRows.filter(r=>!r.isPmi&&r.stage===i);const pct=st.demand>0?m1(st.allocation/st.demand*100):'—';sc1.push(['P'+(i+1),stageLabels[i]||st.name,stRows.length,st.demand,st.allocation,pct+'%',stageLogic[i]||''],0);});sc1.push(['PMI','On top',result.pmi?.count||0,result.pmi?.requested||0,pmiAlloc,'100%','Outside base budget'],0);sc1.push(['TOTAL','',allRows.length,allDemand,progAlloc,m1(allDemand>0?progAlloc/allDemand*100:0)+'%',''],3);sc1.push([''],0);const s5=session.settings.itsimp||{basis:'bucket',pct:0};const itsimpStage=stages[4]||{name:'IT Simplification',demand:0,allocation:0};const itsimpRows=allRows.filter(r=>r.stage===4);sc1.push(['\u2500\u2500 IT Simplification Lever (P5) \u2500\u2500','','','',''],2);sc1.push(['Setting','Value','Notes','',''],1);sc1.push(['Mode active',session.settings.itsimpMode?'Yes \u2014 IT Simplification is a funded P5 stage':'No \u2014 Programs remain in P4 Value Based','','',''],0);sc1.push(['Lever basis',s5.basis,'bucket / aop / amount','',''],0);sc1.push(['Target ('+(s5.basis==='amount'?'M\u20ac':'%')+')',s5.basis==='amount'?s5.amount||0:s5.pct||0,'','',''],0);sc1.push(['P5 Programs',itsimpRows.length,'Decommissioning & Replatforming category','',''],0);sc1.push(['P5 demand M\u20ac',itsimpStage.demand,m1(itsimpStage.demand),'',''],0);sc1.push(['P5 funded M\u20ac',itsimpStage.allocation,m1(itsimpStage.allocation),'',''],0);sc1.push(['P5 % funded',itsimpStage.demand>0?m1(itsimpStage.allocation/itsimpStage.demand*100)+'%':'—','','',''],0);sc1.push([''],0);sc1.push(['\u2500\u2500 ExCo Accountability \u2014 Programs Funding \u2500\u2500','','','','','',''],2);sc1.push(['ExCo Leader','# Funded / Total','Requested M\u20ac','Funded M\u20ac','Unfunded M\u20ac','Hard Benefit M\u20ac','Soft Benefit M\u20ac'],1);const excoTotals=result.exco||{};let gExReq=0,gExFnd=0,gExUn=0,gExHB=0,gExSB=0,gExFndCnt=0,gExAllCnt=0;sortedExcos.forEach(function(ec){const v=excoTotals[ec];if(!v||v.count===0)return;const unfnd=v.requested-v.funded;gExReq+=v.requested;gExFnd+=v.funded;gExUn+=unfnd;gExHB+=v.hardBen||0;gExSB+=v.softBen||0;gExFndCnt+=v.fundedCount;gExAllCnt+=v.count;sc1.push([ec,v.fundedCount+'/'+v.count,v.requested,v.funded,unfnd,v.hardBen||0,v.softBen||0],0);});sc1.push(['GRAND TOTAL',gExFndCnt+'/'+gExAllCnt,gExReq,gExFnd,gExUn,gExHB,gExSB],3);sc1.push([''],0);const SUBORG_BU_W={'Imaging Informatics':'EI','Clinical Informatics':'EI','EI Other':'EI','AMD':'Connected Care','HPM':'Connected Care','S&RC':'Connected Care','I&D':'Innovation & Design','IP and S':'Int. Property & Standards','IGT-D':'Image Guided Therapy','IGT-S':'Image Guided Therapy','MR':'Precision Diagnosis','CT':'Precision Diagnosis','DXR':'Precision Diagnosis','PD Other':'Precision Diagnosis','US':'Precision Diagnosis','G and B':'Personal Health','MCC':'Personal Health','OHC':'Personal Health','PH Other':'Personal Health'};const ORG_TO_CL={'Enterprise Informatics (EI)':'EI','Monitoring - HPM (MCH)':'Connected Care','Sleep & Respiratory Care (SRC)':'Connected Care','Ambulatory Monitoring and Diagnostics (AM&D)':'Connected Care','Image Guided Therapy - Systems (IGT-S)':'Image Guided Therapy','Image Guided Therapy - Devices (IGT-D)':'Image Guided Therapy','Precision Diagnosis - Magnetic Resonance (MR)':'Precision Diagnosis','Precision Diagnosis - Computed Tomography (CT)':'Precision Diagnosis','Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':'Precision Diagnosis','Precision Diagnosis - Ultrasound (PDU)':'Precision Diagnosis','Personal Health (PH)':'Personal Health','Co\u00e9 Marketing \u2013 HS (former DMEC)\u200b':'Personal Health','Innovation and Design Business Operations':'Innovation & Design','Intellectual Property & Standards (IP&S)\u200b':'Int. Property & Standards'};const BU_CL=['Personal Health','Connected Care','Precision Diagnosis','Image Guided Therapy','EI','Innovation & Design','Int. Property & Standards'];const clD={};BU_CL.forEach(c=>{clD[c]={buLed:0,ew:0};});allRows.forEach(r=>{if(r.stream==='bu'&&r.final>0&&!r.isPmi){const cl=ORG_TO_CL[r.org];if(cl&&clD[cl])clD[cl].buLed+=r.final;}});const ewChKey=session.data.ewChargingKey;const ewChAllocs=ewChKey&&ewChKey.allocations?ewChKey.allocations:{};const ewChSum=Object.values(ewChAllocs).reduce((s,v)=>s+v,0);if(ewChSum>0){BU_CL.forEach(cl=>{let clAmt=0;Object.keys(ewChAllocs).forEach(so=>{if(SUBORG_BU_W[so]===cl)clAmt+=ewChAllocs[so];});if(clAmt>0)clD[cl].ew=ewAlloc*(clAmt/ewChSum);});}const tcoMap={};if(OPS&&OPS.operations&&OPS.operations.tco){OPS.operations.tco.forEach(t=>{if(!t.bu.startsWith('- ')&&!t.bu.startsWith(' -'))tcoMap[t.bu.trim()]=t.totalBU||0;});}sc1.push(['\u2500\u2500 Organisation IT Cost Allocation \u2500\u2500','','','','',''],2);sc1.push(['Organisation (BU Cluster)','BU-Led Prog M\u20ac','F&R Charge M\u20ac','Operations (TCO) M\u20ac','Total IT Charge M\u20ac',''],1);let gBUw=0,gEWw=0,gOPSw=0;BU_CL.forEach(cl=>{const d=clD[cl]||{buLed:0,ew:0};const ops=tcoMap[cl]||0;const tot=d.buLed+d.ew+ops;gBUw+=d.buLed;gEWw+=d.ew;gOPSw+=ops;sc1.push([cl,d.buLed,d.ew,ops,tot,''],0);});finishAllocation(sc1,gBUw,gEWw,gOPSw);sc1.push([''],0);sc1.push(['\u2500\u2500 Scenario Preset Comparison \u2500\u2500','','','','','',''],2);sc1.push(['Preset Name','P1: LFR','P2: Baseline cap','P3: Sustain','P4: Value','Allocated M\u20ac','Unfunded M\u20ac'],1);[['optimal','Optimal Segmentation','Verified share','Baseline cap','60% bucket'],['protect','Protect Commitments','100% bucket','Baseline cap','100% bucket'],['evidence','Balance Sustain and Value','100% bucket','Baseline cap','75% bucket'],['capacity','Release Sustain','44% bucket','Baseline cap','75% bucket']].forEach(p=>{const st=A.preset(p[0]);st.budget=session.settings.budget;const x=A.solve(session.data,st);sc1.push([p[1],p[2],p[3],p[4],p[5]||'100% bucket',x.totals.allocation,x.totals.unfunded],0);});sc1.push(['Current scenario (active)','—','—','—','—',progAlloc,result.totals.unfunded],3);const compHeaders=weightLabels.slice(0,nComp).map(l=>'Score: '+l);const sc2=mkSheet();sc2.push(['ID','ExCo Leader','Organisation','Programs Name','Prog Type','Stream','Demand Type','Source Type','Platform','Investment Area','Stage','Priority','Decision Band','AOP Decision','Funded','Requested M\u20ac','Prioritised M\u20ac','Unfunded M\u20ac','Merit Score','Rank','Status','Reason',...compHeaders,'Benefit Source','Payback Yrs','LFR Tier','LFR Evidence','LFR Year','LFR Name','Baselined M\u20ac','Carry Cap M\u20ac','Benefits M\u20ac','Benefit/Req','Evidence flags','Source request M€','Calculated merit','Reviewed merit','Review rationale'],1);const sortedAll=rows.slice().sort((a,b)=>a.stage-b.stage||b.final-a.final||b.score-a.score);sortedAll.forEach(r=>sc2.push([r.id,r.exco||'Unassigned',r.org,r.name,r.type||'',r.stream,r.newCarry,r.type,r.platform,r.area,r.stageName,r.priority,r.decisionBand,r.overall,r.final>0?'Yes':'No',r.cost,r.final,r.unfunded,r.score,r.rank,r.status,r.reason,...(r.components||[]),nn(r.benefitSource),r.paybackYears!=null?r.paybackYears:'',nn(r.lfrTier),r.hasLfrEvidence?'Yes':'No',nn(r.lfrYear),nn(r.lfrName),r.baselined!=null?r.baselined:'',r.carryFundCap!=null?r.carryFundCap:'',nn(r.benefit),nn(r.ratio),[...(r.holds||[]),(r.warnings||[])].join('; '),r.sourceCost,r.calculatedScore,r.review?.merit??'',r.review?.note||''],0));const sc3=mkSheet();sc3.push(['AOP 2027 IT Portfolio \u2014 Cost Summary by Investment Type & Accountability','','','','','','','','','','',''],1);sc3.push(['Scenario',session.name,'','Status',session.status,'','Generated',new Date().toISOString().slice(0,19).replace('T',' '),'','',''],0);sc3.push([''],0);sc3.push(['\u2500\u2500 Section 1: Programs Funding by ExCo Leader \u00d7 Investment Type \u2500\u2500','','','','','','','','','','',''],2);sc3.push(['ExCo Leader',...rawTypes.flatMap(t=>[typeLabel(t)+' #',typeLabel(t)+' Req M\u20ac',typeLabel(t)+' Funded M\u20ac']),'TOTAL #','TOTAL Req M\u20ac','TOTAL Funded M\u20ac'],1);const gT=rawTypes.map(()=>({cnt:0,req:0,fnd:0}));let gTotCnt=0,gTotReq=0,gTotFnd=0;sortedExcos.forEach(ec=>{const ec_data=xtab[ec]||{};const hasAny=Object.values(ec_data).some(x=>x.count>0);if(!hasAny)return;const cells=[ec];let rCnt=0,rReq=0,rFnd=0;rawTypes.forEach((t,ti)=>{const d=ec_data[t]||{count:0,req:0,funded:0};cells.push(d.count,d.req,d.funded);gT[ti].cnt+=d.count;gT[ti].req+=d.req;gT[ti].fnd+=d.funded;rCnt+=d.count;rReq+=d.req;rFnd+=d.funded;});cells.push(rCnt,rReq,rFnd);gTotCnt+=rCnt;gTotReq+=rReq;gTotFnd+=rFnd;sc3.push(cells,0);});const totRow=['GRAND TOTAL'];rawTypes.forEach((_,ti)=>totRow.push(gT[ti].cnt,gT[ti].req,gT[ti].fnd));totRow.push(gTotCnt,gTotReq,gTotFnd);sc3.push(totRow,3);sc3.push([''],0);sc3.push(['\u2500\u2500 Section 2: Stage Breakdown by Investment Type \u2500\u2500','','','','','','','','','','',''],2);sc3.push(['Stage / Priority',...rawTypes.map(t=>typeLabel(t)+' Funded M\u20ac'),'Total Funded M\u20ac','% of Funded','Notes'],1);const stageTypeTot=rawTypes.map(()=>0);let sGrandTot=0;(stages||[]).forEach((st,i)=>{const stRows=allRows.filter(r=>!r.isPmi&&r.stage===i);const typeFunds=rawTypes.map(t=>stRows.filter(r=>(r.type||'')===(t||'')).reduce((s,r)=>s+(r.final||0),0));const stTot=typeFunds.reduce((a,b)=>a+b,0);typeFunds.forEach((v,ti)=>stageTypeTot[ti]+=v);sGrandTot+=stTot;sc3.push(['P'+(i+1)+' \u2014 '+(stageLabels[i]||st.name),...typeFunds,stTot,gTotFnd>0?m1(stTot/gTotFnd*100)+'%':'0%',stageLogic[i]||''],0);});const pmiTypeFunds=rawTypes.map(t=>A.sum(allRows.filter(r=>r.isPmi&&(r.type||'')===t),r=>r.final));pmiTypeFunds.forEach((v,i)=>stageTypeTot[i]+=v);sGrandTot+=pmiAlloc;sc3.push(['PMI on top',...pmiTypeFunds,pmiAlloc,'','Outside base budget'],0);sc3.push(['TOTAL',...stageTypeTot,sGrandTot,'100%',''],3);sc3.push([''],0);sc3.push(['\u2500\u2500 Section 3: BU Cluster IT Cost Allocation \u2500\u2500','','','','',''],2);sc3.push(['Organisation (BU Cluster)','BU-Led Prog M\u20ac','F&R Charge M\u20ac','Operations TCO M\u20ac','Total IT Charge M\u20ac',''],1);let gBUw2=0,gEWw2=0,gOPSw2=0;BU_CL.forEach(cl=>{const d=clD[cl]||{buLed:0,ew:0};const ops=tcoMap[cl]||0;const tot=d.buLed+d.ew+ops;gBUw2+=d.buLed;gEWw2+=d.ew;gOPSw2+=ops;sc3.push([cl,d.buLed,d.ew,ops,tot,''],0);});finishAllocation(sc3,gBUw2,gEWw2,gOPSw2);const sc4=mkSheet();const s4=session.settings;sc4.push(['AOP 2027 Scenario \u2014 Levers & Settings','','','','','',''],1);sc4.push(['Scenario',session.name,'','Status',session.status,'',''],0);sc4.push(['Source version',session.data.version,'','Revision','r'+session.revision,'',''],0);sc4.push([''],0);sc4.push(['\u2500\u2500 Budget & Tolerance \u2500\u2500','','','','','',''],2);sc4.push(['Setting','Value','Unit','Notes','','',''],1);sc4.push(['Total AOP (Programs)',s4.budget,'M\u20ac','Combined EW + BU Programs allocation','','',''],0);sc4.push(['Tolerance',s4.tolerance,'%','Maximum allowable overspend','','',''],0);sc4.push(['Merit floor (P4 eligibility)',s4.merit,'pts','Programs scoring below this are excluded from P4','','',''],0);sc4.push(['Carry-over rule','Confirmed approved baseline cap','','No ROI threshold','','',''],0);sc4.push([''],0);sc4.push(['\u2500\u2500 Funding Levers \u2014 All 5 Stages \u2500\u2500','','','','','',''],2);sc4.push(['Lever / Stage','Basis','Target','Demand M\u20ac','Allocated M\u20ac','# Progs (Funded/Total)','% Demand Funded'],1);[['P1 \u2014 Legal & Compliance (LFR)','lfr',0],['P2 \u2014 Carry-Over Demand','carry_special',-1],['P3 \u2014 Sustain Engineering','sustain',2],['P4 \u2014 Value Based Portfolio','value',3],['P5 \u2014 IT Simplification','itsimp',4]].forEach(lv=>{const key=lv[1];const stIdx=lv[2];let basis,target,demand,alloc,count;if(key==='carry_special'){const st=stages[1]||{demand:0,allocation:0};const cRows=allRows.filter(r=>r.stage===1);basis='Confirmed baseline cap';target='\u2014';demand=st.demand;alloc=st.allocation;count=cRows.filter(r=>r.final>0).length+'/'+cRows.length;}else{const sv=s4[key]||{basis:'bucket',pct:0};const st=stIdx>=0&&stages[stIdx]?stages[stIdx]:{demand:0,allocation:0};const lRows=stIdx>=0?allRows.filter(r=>r.stage===stIdx):[];basis=sv.basis;target=sv.basis==='amount'?(sv.amount||0)+'M\u20ac':(sv.pct||0)+'%';demand=st.demand;alloc=st.allocation;count=lRows.filter(r=>r.final>0).length+'/'+lRows.length;}const pct=demand>0?m1(alloc/demand*100):0;sc4.push([lv[0],basis,target,demand,alloc,count,pct+'%'],0);});sc4.push([''],0);sc4.push(['\u2500\u2500 Merit Score Weights \u2500\u2500','','','','','',''],2);sc4.push(['Criterion','Weight %','Notes','','','',''],1);w.forEach((v,i)=>sc4.push([weightLabels[i]||'Weight '+(i+1),v,'%','','','',''],0));sc4.push([''],0);sc4.push(['\u2500\u2500 Export Scope \u2500\u2500','','','','','',''],2);sc4.push(['Summary scope','Entire scenario; Programs/evidence tabs follow selected export scope','','','','',''],0);sc4.push(['Scope',scope,'','Rows exported',rows.length,'',''],0);sc4.push(['Filters applied',JSON.stringify(session.filters||{}),'','','','',''],0);const sc5=mkSheet();sc5.push(['AOP 2027 Operations Overview \u2014 Bill of IT','','','','',''],1);sc5.push(['Source',OPS.meta.sourceFile,'','','',''],0);sc5.push([''],0);if(OPS&&OPS.meta){sc5.push(['\u2500\u2500 Operations KPIs \u2500\u2500','','','','',''],2);sc5.push(['Metric','M\u20ac','Notes','','',''],1);sc5.push(['Total Operations AOP 2027',OPS.meta.opsTotal2027,'Full Bill of IT','','',''],0);sc5.push(['2026 Run-Rate',OPS.meta.opsTotal2026,'Prior year baseline','','',''],0);sc5.push(['YoY Delta',OPS.meta.opsTotal2027-OPS.meta.opsTotal2026,(OPS.meta.opsTotal2027<OPS.meta.opsTotal2026?'Cost decrease':'Cost increase'),'','',''],0);if(OPS.meta.buOwn)sc5.push(['BU Own Consumption',OPS.meta.buOwn,'Direct BU service costs','','',''],0);if(OPS.meta.regionAlloc)sc5.push(['From Regions (allocated)',OPS.meta.regionAlloc,'Region IT allocated to BUs','','',''],0);if(OPS.meta.functionAlloc)sc5.push(['From Functions & CoEs',OPS.meta.functionAlloc,'Central IT allocated to BUs','','',''],0);sc5.push([''],0);}if(OPS&&OPS.operations&&OPS.operations.tco){sc5.push(['\u2500\u2500 Organisation Total Cost of Ownership \u2500\u2500','','','','',''],2);sc5.push(['Organisation','AOP2027 M\u20ac','Own Consumption M\u20ac','Own %','Regions to BU M\u20ac','Functions & CoEs M\u20ac'],1);OPS.operations.tco.forEach(t=>{const indent=t.bu.startsWith('- ')||t.bu.startsWith(' -');const nm=indent?'  '+t.bu.replace(/^[\s-]+/,'').trim():t.bu.trim();const own=t.ownConsumption||0,reg=t.regionAlloc||0,func=t.functionAlloc||0,tot=t.totalBU||0;const ownPct=tot>0?(own/tot*100).toFixed(1)+'%':'';sc5.push([nm,tot,own,ownPct,reg,func],0);});sc5.push([''],0);}if(OPS&&OPS.operations&&OPS.operations.services){const svcs=OPS.operations.services.slice().sort((a,b)=>(b.cost2027||0)-(a.cost2027||0));const sT27=svcs.reduce((s,v)=>s+(v.cost2027||0),0),sT26=svcs.reduce((s,v)=>s+(v.cost2026||0),0);sc5.push(['\u2500\u2500 Service Catalog ('+svcs.length+' services) \u2500\u2500','','','','',''],2);sc5.push(['Service ID','Service Name','IT Department','AOP2027 M\u20ac','AOP2026 M\u20ac','\u0394 M\u20ac'],1);svcs.forEach(s=>sc5.push([s.serviceId,s.name,s.dept||'',nn(s.cost2027),nn(s.cost2026),s.cost2026==null?'':s.cost2027-s.cost2026],0));sc5.push(['TOTAL','','',sT27,sT26,sT27-sT26],3);}const t6CompHdr=weightLabels.slice(0,nComp).map(l=>'Score: '+l);const t6RawHdr=weightLabels.slice(0,nComp).map(l=>'Raw pts: '+l);const sc6=mkSheet();sc6.push(['ID','ExCo Leader','Organisation','Programs','Stage','Stream',...t6CompHdr,'Total Merit Score','Benefit Source','Qualitative Benefit Tier','Benefit/Request Multiple','Submitted Benefit M\u20ac','Original Benefit (source)','Benefit Details','Payback Years','Payback Score Points','Consequence Score','Consequence Evidence','Impact and Cost of Not Doing','Problem Statement','Scope','Contain Condition','Evidence Review',...t6RawHdr],1);rows.forEach(r=>{const comps=r.components||[];const raw=r.rawComponents||[];sc6.push([r.id,r.exco||'Unassigned',r.org,r.name,r.stageName,r.stream,...comps,r.score,nn(r.benefitSource),nn(r.qualBenefit&&r.qualBenefit.tier),nn(r.ratio),nn(r.benefit),nn(r.benefitRaw),nn(r.benefitDetails),r.paybackYears!=null?r.paybackYears:'',nn(r.paybackPoints),nn(r.consequence&&r.consequence.points),nn(r.consequence&&r.consequence.evidence),nn(r.impact),nn(r.problem),nn(r.scope),nn(r.condition),JSON.stringify(r.review||{}),...raw],0);});const sc7=mkSheet();sc7.push(['Event ID','Date/Time','Origin','Action','Programs ID','Programs Name','Organisation','ExCo Leader','Old Value','New Value','Note','Revision','Source Version'],1);session.events.forEach(e=>{const d=e.details||{};const prog=result.rows.find(r=>r.id===d.id)||result.rows.find(r=>r.id===(d.ids&&d.ids[0]));const ids=(d.ids||[d.id]).filter(Boolean).join(', ');let oldVal='',newVal='';if(e.action==='program'||e.action==='group'){oldVal=e.before&&e.before.overrides?JSON.stringify(e.before.overrides[d.id]||e.before.overrides[d.ids&&d.ids[0]]||'automatic'):'';newVal=d.choice==='exclude'?'Excluded':d.choice==='include'?'Included at '+(d.amount!=null?d.amount+' M\u20ac':'full amount'):'Automatic';}else if(e.action==='setting'){oldVal='(settings changed)';}sc7.push([e.id,e.time,nn(e.origin),e.action,ids,nn(prog&&prog.name),nn(prog&&prog.org),nn(prog&&prog.exco),oldVal,newVal,nn(d.note),e.revision,nn(e.sourceVersion)],0);});const sc8=mkSheet();sc8.push(['Date/Time','Action','Programs ID','Programs Name','Organisation','ExCo Leader','Origin / Tab','Old Value','New Value','Note','Revision'],1);session.events.filter(e=>e.action!=='setting'&&e.action!=='preset').forEach(e=>{const d=e.details||{};const prog=result.rows.find(r=>r.id===d.id);const aLabel=e.action==='program'?(d.choice==='include'?'Included':d.choice==='exclude'?'Excluded':d.choice==='automatic'?'Returned to automatic':'Amount changed'):e.action==='group'?'Group '+(d.choice||'change'):e.action==='review'?'Evidence review':e.action==='reset'?'Reset all overrides':e.action==='finalise'?'Finalised scenario':e.action==='fork'?'New working version':e.action==='refresh'?'Source refreshed':e.action;sc8.push([e.time,aLabel,d.id||'',nn(prog&&prog.name),nn(prog&&prog.org),nn(prog&&prog.exco),nn(e.origin),d.before!==undefined?String(d.before):'',d.after!==undefined?String(d.after):(d.amount!=null?d.amount+' M\u20ac':''),nn(d.note),e.revision],0);});const fin=A.finance(session.data,result,OPS);for(const sheet of [sc1,sc3]){const rr=sheet.rows(),ss=sheet.styles();const first=rr.findIndex(r=>r[0]==='Organisation (BU Cluster)');if(first>=0){let last=first+1;while(last<rr.length&&rr[last][0]!=='TOTAL')last++;const insert=[['Organisation (BU Cluster)','BU Led Programs M€','EW charge M€','Operations M€','Total IT M€','PMI M€'],...fin.rows.map(r=>[r.recipient,r.single+r.cross+r.indirect+r.other,r.ew,r.own+r.region+r.functions,r.total,r.pmi]),['TOTAL',fin.totals.single+fin.totals.cross+fin.totals.indirect+fin.totals.other,fin.totals.ew,fin.totals.operations,fin.totals.total,fin.totals.pmi]];rr.splice(first,last-first+1,...insert);ss.splice(first,last-first+1,...insert.map((_,i)=>i===0?1:i===insert.length-1?3:0));}}const ledgerKeys=Object.keys(fin.ledger[0]||{});const financeSheet={name:'10. Finance Ledger',rows:[ledgerKeys,...fin.ledger.map(r=>ledgerKeys.map(k=>r[k]??''))],filter:true,freezeRow:1};return [financeSheet,{name:'9. Source Reference',rows:[['Programs ID','Source file','SHA-256','Sheet','Row','Operations source file','Operations SHA-256'],...rows.map(r=>[r.id,session.data.sourceFile,session.data.sourceHash,r.sourceSheet,r.sourceRow,OPS.meta.sourceFile,OPS.meta.sourceHash])],filter:true,freezeRow:1,colWidths:[14,45,68,12,10,60,68]},{name:'1. Scenario Overview',rows:sc1.rows(),rowStyles:sc1.styles(),colWidths:[32,16,14,28,24]},{name:'2. Programs',rows:sc2.rows(),rowStyles:sc2.styles(),filter:true,freezeRow:1,colWidths:[12,22,28,42,14,8,14,14,18,18,20,12,14,16,8,12,12,12,10,8,12,20]},{name:'3. Cost Summary',rows:sc3.rows(),rowStyles:sc3.styles(),colWidths:[28,10,12,12,10,12,12,10,12,12,12,12,12]},{name:'4. Levers & Settings',rows:sc4.rows(),rowStyles:sc4.styles(),colWidths:[36,14,12,14,14,18,12]},{name:'5. Operations Overview',rows:sc5.rows(),rowStyles:sc5.styles(),colWidths:[32,14,14,10,14,14]},{name:'6. Scoring Evidence',rows:sc6.rows(),rowStyles:sc6.styles(),filter:true,freezeRow:1},{name:'7. Decisions Log',rows:sc7.rows(),rowStyles:sc7.styles(),filter:true,freezeRow:1,colWidths:[14,20,16,14,14,32,28,20,20,20,24,10,16]},{name:'8. Change Log',rows:sc8.rows(),rowStyles:sc8.styles(),filter:true,freezeRow:1,colWidths:[20,18,12,32,28,20,16,16,16,24,10]}];}
return {read,write,sheets,zip,unzip,crc32};
});

/* Display-only statistics. Never changes eligibility, ranking or funding. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOPViews=api;})(globalThis,function(){
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
function stats(rows,field){const values=rows.map(r=>r[field]).filter(numeric);return {count:values.length,sum:values.length?values.reduce((a,b)=>a+b,0):null,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
function median(values){const sorted=values.filter(numeric).sort((a,b)=>a-b),n=sorted.length;return n?(n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2):null;}
function aggregate(rows){const bands={};for(const r of rows){const label=String(r.decisionBand||'').trim().toLowerCase()||'unassessed';bands[label]=(bands[label]||0)+1;}const names=Object.keys(bands),band=names.length===1?(names[0]==='unassessed'?'Unassessed':names[0][0].toUpperCase()+names[0].slice(1)):names.length?'Mixed':'Unassessed';return {count:rows.length,funded:rows.filter(r=>r.final>0).length,partial:rows.filter(r=>r.status==='Partial scope').length,held:rows.filter(r=>r.holds.length>0).length,band,bands,score:stats(rows,'score'),cost:stats(rows,'cost'),final:stats(rows,'final'),unfunded:stats(rows,'unfunded'),benefit:stats(rows,'benefit'),ratio:stats(rows,'ratio'),missingCost:rows.filter(r=>r.cost===null).length,evidence:rows.filter(r=>numeric(r.benefit)).length};}
return {stats,median,aggregate};
});

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
 const activeRows=new Set(globalThis.AOP.normalize(workbook).records.map(r=>r.sourceSheet+'!'+r.sourceRow));
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
  const mapping=globalThis.AOP.normalize(workbook).mappings.find(m=>m.sheet===sh.name);const header=mapping.sourceHeaders.map(h=>clean(h));
  for(const aliases of REQUIRED_COLUMNS){
   if(matchColumn(header,aliases)===-1){
    const label=aliases[0];
    if(!missingCols.includes(label))missingCols.push(label);
   }
  }
  const ci=costIndex(header);
  const itemIdx=matchColumn(header,['item no.']);
  const orgIdx=matchColumn(header,['organization setting demand [bu, region, coe]','organization']);
  const bandIdx=mapping.fields.band;
  const benIdx=matchColumn(header,['quantified benefits (in k€)','quantified benefits (in keur)','quantified benefits']);

  for(let i=3;i<sh.rows.length;i++){
   const row=sh.rows[i]||[];
   if(!activeRows.has(sh.name+'!'+(i+1)))continue;
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

 add('Benefit data validated for prioritization','warning','PASS',
  maxRatio<=1000?'Max benefit/cost ratio: '+maxRatio.toFixed(1)+'x':'Benefit evidence accepted; ratio '+maxRatio.toFixed(1)+'x');

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
  +'<span class="qa-summary">'+s.rows+' rows · '+s.totalDemand.toFixed(1)+' M€ · F&R '+s.ewRows+' / BU '+s.buRows+' · HPM '+s.hpmRows+' rows ('+s.hpmDemand.toFixed(1)+' M€)</span></div>'
  +'<details class="qa-details"><summary>'+qa.checks.filter(c=>c.status==='PASS').length+' passed · '+qa.checks.filter(c=>c.status==='WARN').length+' warnings · '+qa.checks.filter(c=>c.status==='FAIL').length+' failed</summary>'
  +'<table class="qa-table"><thead><tr><th>Check</th><th>Severity</th><th>Status</th><th>Detail</th></tr></thead><tbody>'
  +qa.checks.map(c=>'<tr class="qa-'+c.status.toLowerCase()+'"><td>'+c.name+'</td><td>'+c.severity+'</td><td><span class="qa-badge qa-'+c.status.toLowerCase()+'">'+c.status+'</span></td><td>'+c.detail+'</td></tr>').join('')
  +'</tbody></table></details></div>';
}

function renderComparison(prev,curr){
 if(!prev)return '';
 const rows=[
  ['Total rows',prev.rows,curr.rows],
  ['F&R rows',prev.ewRows,curr.ewRows],
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

function renderFinanceQA(qa){
 if(!qa)return '';
 const badge=qa.status==='PASS'?'qa-pass':qa.status==='WARN'?'qa-warn':'qa-fail';
 const t=qa.totals;
 return '<div class="qa-report" style="margin:8px 0"><div class="qa-header"><span class="qa-badge '+badge+'">Finance QA: '+qa.status+'</span>'
  +(t.grandTotal!==null?'<span class="qa-summary">Programs '+t.programAlloc.toFixed(1)+' M€ (BU '+t.buAlloc.toFixed(1)+' + F&R '+t.ewAlloc.toFixed(1)+') + Ops '+(t.opsTotal||0).toFixed(1)+' = Grand Total '+t.grandTotal.toFixed(1)+' M€</span>':'')
  +'</div><details class="qa-details"><summary>'+qa.checks.filter(c=>c.status==='PASS').length+' passed · '+qa.checks.filter(c=>c.status==='WARN').length+' warnings · '+qa.checks.filter(c=>c.status==='FAIL').length+' failed (click to expand)</summary>'
  +'<table class="qa-table"><thead><tr><th>Check</th><th>Severity</th><th>Status</th><th>Detail</th></tr></thead><tbody>'
  +qa.checks.map(c=>'<tr class="qa-'+c.status.toLowerCase()+'"><td>'+c.name+'</td><td>'+c.severity+'</td><td><span class="qa-badge qa-'+c.status.toLowerCase()+'">'+c.status+'</span></td><td>'+c.detail+'</td></tr>').join('')
  +'</tbody></table></details></div>';
}

return {validate,renderReport,renderComparison,validateFinance,renderFinanceQA,BASELINE,REQUIRED_COLUMNS};
});

/* Offline UI. Every view uses the same engine result and scenario revision. */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec=x=>x===null||x===undefined?'Not supplied':(Math.sign(Number(x))*Math.ceil((Math.abs(Number(x))-1e-10)*10)/10).toFixed(1),money=x=>x===null?'Not supplied':dec(x)+' M€',count=x=>String(x);
let session=AOP.createSession(AOP.normalize(JSON.parse($('#source-data').textContent))),result,tab='demand',saved=[],pending=null,db=null;
const tabNames={demand:'Demand Overview',scenario:'Programs AOP Scenarios',ew:'Functions and Regions',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'};
const expanded=new Set();
let pointerRenderHold=false,renderPending=false;
function flushPendingRender(){pointerRenderHold=false;if(renderPending)render();}
document.addEventListener('pointerdown',e=>{const active=document.activeElement;if(active?.matches('input:not([type=checkbox]):not([type=range]):not([type=file])')&&active.value!==active.defaultValue&&e.target!==active&&e.target.closest('button,input,select,summary,a'))pointerRenderHold=true;},true);
document.addEventListener('click',()=>{pointerRenderHold=false;setTimeout(flushPendingRender,0);},true);
document.addEventListener('pointerup',()=>setTimeout(flushPendingRender,250),true);
document.addEventListener('pointercancel',flushPendingRender,true);
const definitions=['<ul><li>Verifies minimum evidence before funding</li><li>Gaps are flagged, not hidden</li><li>No budget reserved at this gate</li></ul>','<ul><li>All mandatory legal, regulatory and compliance demand</li><li>Verified compliance (name + year) pre-selected by default</li><li>Slider extends to include unverified LFR demand</li><li>CCB exceptions funded in full</li></ul>','<ul><li>All prior-year carry-over demand</li><li>Confirmed business cases funded at approved baseline cap</li><li>RoI threshold slider controls eligibility (decreasing filter)</li><li>Score-based ranking resolves ties within threshold</li></ul>','<ul><li>Sustain Engineering (Change &amp; Sustain) and Hygiene (CI/Upgrades) demand</li><li>No overlap with LFR or Carry Over stages</li><li>Funded by % of bucket demand after stages 1 and 2</li></ul>','<ul><li>All remaining demand outside Levers 1–3</li><li>Funded from residual budget after LFR, Carry Over and Sustain</li><li>Lever reductions release to Open to prioritisation; increases draw from Value</li></ul>','<ul><li>Decommissioning and Replatforming Programs separated from Value Based Portfolio</li><li>IT Simplification reduces operational complexity, IT estate footprint and run costs</li><li>Enable with the IT Simplification toggle in Scenario Levers; inactive by default</li></ul>'];
function toast(t,error=false){const el=$('#toast');el.textContent=t;el.className='toast'+(error?' error':'');el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,6500);}
function download(name,bytes,type='application/octet-stream'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function dbput(key,value){return new Promise((resolve,reject)=>{if(!db)return reject(Error('Browser storage unavailable. Export the portable scenario to keep it.'));const tx=db.transaction('scenarios','readwrite');tx.objectStore('scenarios').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function dbget(key){return new Promise((resolve,reject)=>{if(!db)return resolve(null);const q=db.transaction('scenarios').objectStore('scenarios').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function persist(){try{await dbput('draft',session);}catch(e){toast(e.message,true);}}
async function save(){session.name=AOP.clean($('#scenario-name')?.value)||session.name;session.savedAt=new Date().toISOString();const snap=AOP.clone(session),key=session.id+'-r'+session.revision;await dbput(key,snap);saved=saved.filter(x=>x.key!==key);saved.unshift({key,name:session.name,status:session.status,revision:session.revision,time:session.savedAt,source:session.data.version,allocation:result.totals.allocation,unfunded:result.totals.unfunded,over:result.totals.over});await dbput('index',saved);await persist();render();toast('Saved '+session.name+' revision '+session.revision+'. Export a portable copy for backup.');}
function commit(action,details={},origin=tabNames[tab]){try{session=AOP.transact(session,action,details,origin);render();persist();toast('Change recorded and all views updated.');return true;}catch(e){toast(e.message,true);return false;}}
function kpi(label,value,note='',cls=''){return '<div class="kpi '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>';}
function coverage(field){const groups=new Map();for(const r of result.rows){const n=r[field]||'Blank / unassessed',g=groups.get(n)||{n:0,v:0};g.n++;g.v+=r.cost||0;groups.set(n,g);}return '<table><thead><tr><th>'+esc(field==='decisionBand'?'Decision Band':'Overall AOP decision')+'</th><th>Rows</th><th>Requested</th></tr></thead><tbody>'+[...groups].map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+v.n+'</td><td>'+money(v.v)+'</td></tr>').join('')+'</tbody></table>';}
function workflow(){return '<div class="workflow"><button data-tab="demand" class="step '+(tab==='demand'?'current':'')+'">1 · Demand Overview</button><button data-tab="scenario" class="step '+(tab==='scenario'?'current':'')+'">2 · Programs Scenarios</button><button data-tab="ew" class="step '+(tab==='ew'?'current':'')+'">3 · Functions and Regions</button><button data-tab="bu" class="step '+(tab==='bu'?'current':'')+'">4 · BU Led</button><button data-tab="operations" class="step '+(tab==='operations'?'current':'')+'">5 · Operations</button><button data-tab="overview" class="step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'">6 · One Portfolio</button></div>';}
function render(){if(pointerRenderHold){result=AOP.solve(session.data,session.settings,session.overrides,session.reviews);result.rows.forEach(function(r){r.platform=(window.normalizePlatform||function(p){return p;})(r.platform||'')||r.platform||'';});window.__aop={session,result,tab,pending};renderPending=true;return;}renderPending=false;hideBubble();const scroll=[...document.querySelectorAll('.tablebox')].map(x=>({top:x.scrollTop,left:x.scrollLeft}));result=AOP.solve(session.data,session.settings,session.overrides,session.reviews);result.rows.forEach(function(r){r.platform=(window.normalizePlatform||function(p){return p;})(r.platform||'')||r.platform||'';});$('#tabs').setAttribute('role','tablist');$('#tabs').innerHTML=Object.entries(tabNames).map(([k,v])=>'<button data-tab="'+k+'" class="'+(tab===k?'active':'')+'" role="tab" aria-selected="'+(tab===k?'true':'false')+'" id="tab-btn-'+k+'" aria-controls="main">'+v+'</button>').join('');$('#workflow').innerHTML=workflow();$('#status').textContent=session.name+' · '+session.status+' · r'+session.revision+' · '+(session.savedAt?'Saved':'Unsaved draft')+' · Source '+session.data.version;$('#main').innerHTML=tab==='scenario'?scenario():tab==='demand'?(window.renderDemandOverview?window.renderDemandOverview(session,result):'<p>Loading demand view…</p>'):tab==='operations'?(window.renderOperationsTab?window.renderOperationsTab():'<p>Loading operations…</p>'):stream(tab);document.querySelectorAll('.tablebox').forEach((x,i)=>{if(scroll[i]){x.scrollTop=scroll[i].top;x.scrollLeft=scroll[i].left;}});document.querySelectorAll('[data-group-check]').forEach(x=>{const rs=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]).filter(r=>(r.org||'Organisation not supplied')===x.dataset.groupCheck&&r.cost>0);x.checked=rs.length>0&&rs.every(r=>r.final>0);x.indeterminate=rs.some(r=>r.final>0)&&rs.some(r=>!r.final);});window.__aop={session,result,tab,pending};}
function allocationSelection(funded,demand,fundable){return '<div class="allocation-selection" style="white-space:nowrap;font-size:13px;line-height:1.5;margin-top:6px;text-align:center"><strong style="color:var(--dk);font-weight:700">'+money(funded)+'</strong> <span style="color:#4a5568">funded of '+money(fundable!==undefined?fundable:demand)+' Demand</span></div>';}
function allocationKpi(){const onTop=AOP.round(result.totals.allocation-session.settings.budget);return '<div class="kpi allocation-kpi dark"><span>Allocated AOP</span><strong id="displayed-lever-total" data-exact="'+result.totals.allocation+'">'+money(result.totals.allocation)+'</strong><small>of '+money(session.settings.budget)+' Total AOP</small><b id="funded-aop" data-exact="'+result.totals.allocation+'">'+result.totals.count+' Programs funded</b><small>'+(onTop>0.01?'<span style="color:#D43F44;font-weight:700">On top off: +'+money(onTop)+'</span>':onTop<-0.01?'<span style="color:#27934C;font-weight:700">Under budget: '+money(Math.abs(onTop))+'</span>':'Within budget')+'</small></div>';}
function reconciliation(){return '<details id="allocation-reconciliation"><summary>Selected limits and funded demand</summary><p>The displayed lever total adds the rounded amounts on the five controls. It is not funded spend: unused capacity can pass to a later stage, and eligible whole requests may not fill a selected limit.</p><table><thead><tr><th>Funding stage</th><th>Selected limit (M€)</th><th>Funded (M€)</th><th>Unfilled limit (M€)</th></tr></thead><tbody>'+result.stages.map((s,i)=>'<tr data-stage-summary="'+i+'" data-funded="'+s.allocation+'"><td>'+esc(s.name)+'</td><td title="Exact '+result.selection.amounts[i]+' M€">'+dec(result.selection.amounts[i])+'</td><td title="Exact '+s.allocation+' M€">'+dec(s.allocation)+'</td><td>'+dec(Math.max(0,result.selection.amounts[i]-s.allocation))+'</td></tr>').join('')+'</tbody><tfoot><tr><th>Funded portfolio</th><td></td><td data-funded-total="'+result.totals.allocation+'">'+dec(result.totals.allocation)+'</td><td>'+dec(result.totals.available)+' budget unspent</td></tr></tfoot></table><p>Funding follows source evidence, eligibility, whole-program fit and recorded manual decisions. The tables below contain the funded amounts and reasons for each unfunded request.</p></details>';}
function streamShareKpi(){const total=result.totals.allocation,ew=result.streams.ew.allocation,bu=result.streams.bu.allocation,ewPct=total?Math.round(ew/total*1000)/10:null,buPct=ewPct===null?null:100-ewPct;return '<div class="kpi split-kpi"><span>Split of Programs AOP</span><strong style="font-size:18px">F&R '+money(ew)+' | BU '+money(bu)+'</strong><small style="color:var(--dk)">M€</small></div>';}
function scenario(){
 const t=result.totals,s=session.settings,funded=result.rows.filter(r=>r.final>0),unfunded=result.rows.filter(r=>r.final===0||r.unfunded>0),pf=session.filters.prioritized||(session.filters.prioritized={}),shown=AOP.filter(funded,pf);
 const merit=[['Benefit strength','<ul><li>Quantitative: ratio-based scoring when financial data is available</li><li>Qualitative fallback from text analysis when numbers are missing</li><li>Revenue and productivity claims require hard numbers</li><li>Benefit inputs accepted for prioritization</li></ul>'],['Submitted priority','<ul><li>Must Do scores highest</li><li>Must Have next</li><li>Deprioritised lowest</li><li>Blank or unrecognised scores zero</li></ul>'],['Captured Consequence','<ul><li>Real-world impact of not proceeding</li><li>Drawn from Problem Statement, Scope and Impact</li><li>Higher scores for quantified enterprise-wide consequences</li></ul>'],['Decision Band','<ul><li>Healthy: ready for merit ranking</li><li>Contain: needs documented condition</li><li>Blank: not assessed, scores zero</li></ul>'],['Payback Period','<ul><li>Within 1 year scores highest</li><li>Within 5 years receives partial credit</li><li>Longer or missing scores zero</li></ul>']];
 var pmiInfo=result.pmi||{count:0,requested:0,funded:0};
 return '<section class="kpis" style="grid-template-columns:repeat('+(pmiInfo.count?6:5)+',minmax(0,1fr))">'+allocationKpi()+kpi('Initiatives funded',count(t.count),count(t.partial)+' partial scope decisions')+streamShareKpi()+kpi(t.over?'Over Total AOP':'Open to prioritisation',money(t.over||t.available),t.over?'Variance retained, no silent rebalance':'Unspent planning envelope',t.over?'danger':'')+kpi('Demand left unfunded',money(t.unfunded),t.missing+' rows have missing request')+(pmiInfo.count?kpi('PMI On Top',money(pmiInfo.funded),pmiInfo.count+' Programs · outside AOP budget'):'')+'</section>'+
 '<section class="panel"><h2>Where the fund goes</h2><p>'+esc(session.name)+' · Automatic '+money(t.automatic)+' · Decision delta '+(t.manual<0?'reduction ':'addition ')+money(Math.abs(t.manual))+'</p><div class="fundbar">'+result.stages.filter(x=>x.allocation>0).map(x=>'<div style="flex:'+x.allocation+';background:'+['#00126E','#0B5ED7','#008BA3','#70ADE0','#7C3AED'][result.stages.indexOf(x)]+'" title="'+esc(x.name)+' '+money(x.allocation)+'">'+money(x.allocation)+'</div>').join('')+'</div><div class="legend">'+result.stages.map((x,i)=>'<span><i style="background:'+['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0','#7C3AED'][i]+'"></i>'+esc(x.name)+' <b>'+money(x.allocation)+'</b></span>').join('')+'</div>'+'</section>'+ 
 controls()+
 demandInScenario(result.rows,funded,unfunded,s)+
 portfolioInclusionTable(result.rows)+
 '<section class="panel"><h2>Funding Prioritization Gate</h2><p class="muted" style="font-size:11px">One evidence check, then one funding stage per request. Funding follows the numbered order.</p><div class="gates">'+['Evidence and decision check',...(s.itsimpMode?AOP.STAGES:AOP.STAGES.slice(0,4))].map((x,i)=>{const stg=i>0?result.stages[i-1]:null;const dd=stg?'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0">'+'<span style="font-size:11px;color:#718096">Demand: <b style="color:#1A202C">'+money(stg.demand)+'</b></span>'+'<span style="font-size:11px;color:#718096">Funded: <b style="color:#27934C">'+money(stg.allocation)+'</b></span>'+(stg.demand>0?'<span style="font-size:11px;color:#718096">Coverage: <b>'+Math.round(stg.allocation/(stg.demand||1)*100)+'%</b></span>':'')+'</div>':'';return '<article class="gate"><div class="gate-head"><b class="number">'+i+'</b><h3>'+esc(x)+'</h3></div>'+definitions[i]+dd+'</article>';}).join('')+'</div></section>'+
 '<details class="panel section-panel"><summary>Merit Score Framework</summary><div class="score-grid">'+merit.map((x,i)=>'<article><h3>'+x[0]+' · '+dec(s.weights[i])+'%</h3>'+x[1]+'</article>').join('')+'</div></details>'+logs();
}
function demandInScenario(allRows,funded,unfunded,s){
 const sf=session.filters.scenario||(session.filters.scenario={}),view=sf._view||'prioritized';
 const rows=view==='prioritized'?funded:unfunded;
 const filtered=AOP.filter(rows,sf);
 const scope='scenario';
 const isPri=view==='prioritized';
 const fKeys=['exco','org','platform','stageName'],fLabels=['ExCo Leader','Organisation','Platform','Lever'];
 let h='<details class="panel section-panel" open style="margin-top:16px"><summary style="font-weight:700;font-size:16px;cursor:pointer">Demand in Scenario</summary>';
 h+='<div class="filter-row" style="margin-bottom:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
 h+='<div class="scenario-toggle" style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;font-weight:'+(isPri?'700':'400')+';color:'+(isPri?'var(--dk)':'#8899AA')+'">Prioritised ('+funded.length+')</span><label class="toggle-switch" style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0"><input type="checkbox" data-scenario-toggle="1" '+(isPri?'':'checked')+' style="opacity:0;width:0;height:0"><span class="toggle-slider" style="position:absolute;cursor:pointer;inset:0;background:#0B5ED7;border-radius:24px;transition:.3s"></span></label><span style="font-size:12px;font-weight:'+(!isPri?'700':'400')+';color:'+(!isPri?'var(--dk)':'#8899AA')+'">Not Funded ('+unfunded.length+')</span></div>';
 h+=fKeys.map(function(k,i){
   const prev=Object.fromEntries(fKeys.slice(0,i).map(function(a){return [a,sf[a]];}));
   const opts=[...new Set([...AOP.filter(rows,prev).map(function(r){return r[k]||'Not supplied';}),...(sf[k]||[])])].sort();
   return '<details class="filter"><summary>'+fLabels[i]+': '+(sf[k]?.length?sf[k].length+' selected':'All')+'</summary><div class="filter-options">'+opts.map(function(v){return '<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(sf[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(rows,Object.assign({},prev,Object.fromEntries([[k,[v]]]))).length+')</label>';}).join('')+'</div></details>';
 }).join('');
 h+='<button data-clear-scope="'+scope+'">Clear Filters</button></div>';
 h+='<div class="table-actions"><p>Organisation totals visible when collapsed. ('+filtered.length+' displayed of '+rows.length+' programs)</p><button data-expand-all="'+scope+'">Expand all</button><button data-close-all="'+scope+'">Collapse all</button></div>';
 const allOrgMap=new Map();for(const r of allRows){const g=r.org||'BURF not supplied';if(!allOrgMap.has(g))allOrgMap.set(g,[]);allOrgMap.get(g).push(r);}
 const groups=new Map();for(const r of filtered){const g=r.org||'BURF not supplied';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}
 const groupRows=[...groups].sort(function(a,b){return (AOPViews.aggregate(b[1]).score.mean??-1)-(AOPViews.aggregate(a[1]).score.mean??-1)||a[0].localeCompare(b[0]);});
 const summaryRow=function(rs,g,id,footer,baseline,fullRows){
  const a=AOPViews.aggregate(rs),open=expanded.has(id),bandClass=a.band==='Healthy'?'healthy':a.band==='Contain'?'contain':'mixed',isFiltered=footer&&baseline&&baseline.count>a.count;

  const fa=fullRows?AOPViews.aggregate(fullRows):a;const ff=fa.funded-fa.partial,pf=fa.partial,uf=fa.count-fa.funded;const fstatus='<b>'+ff+' Funded · '+pf+' Partially Funded · '+uf+' Unfunded</b><small>'+fa.count+' Total Demand · '+fa.held+' holds</small>';
  const amt=function(field){return '<td class="numeric"><strong>'+dec(a[field].sum)+'</strong><small>'+(isFiltered?'of '+dec(baseline[field].sum):'Avg '+dec(a[field].mean))+'</small></td>';};
  return '<tr class="'+(footer?'summary-total':'group burf-summary')+'" data-group-summary="'+esc(id)+'" data-organisation="'+esc(g)+'"><td class="identity">'+(footer?'<b>'+esc(g)+'</b>':'<button class="burf-toggle" data-collapse="'+esc(id)+'" aria-expanded="'+open+'"><span class="triangle">'+(open?'▼':'▶')+'</span>'+esc(g)+'</button>')+' <span class="group-count">('+a.funded+'/'+a.count+(isFiltered?' of '+baseline.count:'')+')</span></td><td><span class="band-label '+bandClass+'">'+esc(a.band)+'</span><small>'+Object.entries(a.bands).map(function(e){return esc(e[0])+' '+e[1];}).join(' · ')+'</small></td><td class="numeric"><span class="score-badge '+(a.score.mean>=session.settings.merit?'strong-score':'low-score')+'">'+dec(a.score.mean)+'</span><small>Average merit</small></td>'+amt('cost')+amt('final')+amt('unfunded')+amt('benefit')+'<td class="numeric"><strong>'+a.evidence+'</strong><small>of '+a.count+' numeric claims</small></td>'+'<td>'+fstatus+'</td></tr>';
 };
 h+='<div class="tablebox burf-tablebox" data-table-scope="'+scope+'"><table class="portfolio burf-table"><thead><tr><th class="identity">Organisation / Programs</th><th>Decision Band</th><th>Score</th><th>Requested (M€)</th><th>Prioritised (M€)</th><th>Unfunded (M€)</th><th>Benefits (M€)</th><th>Evid.</th><th>'+'Funding status / demand details'+'</th></tr></thead><tbody>';
 h+=groupRows.map(function(entry){
  const g=entry[0],rs=entry[1],id=scope+'|'+encodeURIComponent(g),hidden=expanded.has(id)?'':' hidden';
  const fullOrgRows=allOrgMap.get(g)||rs;return summaryRow(rs,g,id,false,null,fullOrgRows)+rs.map(function(r){
   return '<tr class="program-row" data-group-row="'+esc(id)+'" data-row-id="'+esc(r.id)+'"'+hidden+'><td class="identity"><div class="program-identity"><button class="program" data-program="'+esc(r.id)+'">'+esc(r.name||'Programs name not supplied')+'</button></div><small>'+esc(r.id)+' · '+esc(r.sourceSheet)+' row '+r.sourceRow+'</small></td><td><span class="band-label '+(AOP.key(r.decisionBand)==='healthy'?'healthy':AOP.key(r.decisionBand)==='contain'?'contain':'mixed')+'">'+esc(r.decisionBand||'Unassessed')+'</span></td><td class="numeric"><span class="score-badge '+(r.score>=session.settings.merit?'strong-score':'low-score')+'">'+dec(r.score)+'</span></td><td class="numeric">'+dec(r.cost)+'</td><td class="numeric">'+dec(r.final)+'</td><td class="numeric">'+dec(r.unfunded)+'</td><td class="numeric">'+dec(r.benefit)+'<small>'+(r.ratio===null?'Multiple unavailable':dec(r.ratio)+'x of request')+'</small></td><td class="numeric">'+(r.benefit!==null?'1':'0')+'</td><td><b class="status-pill">'+esc(r.status)+'</b><small>'+esc(r.reason)+'</small><small>'+esc(r.newCarry==='Change & Sustain'?'Sustain Engineering':r.newCarry||'Not supplied')+' · '+esc(r.stageName)+'</small><small>'+esc(r.overall||'Overall decision unassessed')+'</small><small>'+esc(r.benefitDetails||AOP.clean(r.benefitRaw)||'Benefit evidence missing')+'</small><small class="warning">'+esc(r.warnings.join('; '))+'</small></td></tr>';
  }).join('');
 }).join('');
 if(!filtered.length)h+='<tr><td colspan="9" class="empty">No matching programs. Clear filters to return to the portfolio view.</td></tr>';
 h+='</tbody><tfoot>'+summaryRow(filtered,'All displayed BURFs',scope+'|total',true,rows.length>filtered.length?AOPViews.aggregate(rows):null,allRows)+'</tfoot></table></div></details>';
 return h;
}
function portfolioInclusionTable(allRows){
 const scope='inclusion',disabled=session.status==='Finalised'?' disabled':'';
 const pf=session.filters[scope]||(session.filters[scope]={});
 const sortKey=pf._sort||'score-desc';
 const fKeys=['exco','org','platform','newCarry','area','status','stageName'];
 const fLabels=['ExCo Leader','BURF organisation','IT platform','New / Carryover / Sustain','Investment area','Funding status','Lever'];
 const filtered=AOP.filter(allRows,pf);
 const sorted=filtered.slice().sort(function(a,b){
  var parts=sortKey.split('-'),field=parts[0],dir=parts[1]==='asc'?1:-1;
  if(field==='hardBen'){var av=a.benefitClass==='hard'?(a.benefit||0):0,bv=b.benefitClass==='hard'?(b.benefit||0):0;return(av-bv)*dir;}
  if(field==='ratio'){var av=a.ratio!==null?a.ratio:-Infinity,bv=b.ratio!==null?b.ratio:-Infinity;return(av-bv)*dir;}
  if(field==='softBen'){var av=a.benefitClass!=='hard'&&a.benefit>0?(a.benefit||0):0,bv=b.benefitClass!=='hard'&&b.benefit>0?(b.benefit||0):0;return(av-bv)*dir;}
  if(field==='benefit')return((a.benefit||0)-(b.benefit||0))*dir;
  if(field==='cost')return((a.cost||0)-(b.cost||0))*dir;
  if(field==='final')return((a.final||0)-(b.final||0))*dir;
  if(field==='score')return((a.score||0)-(b.score||0))*dir;
  return 0;
 });
 var h='<details class="panel section-panel" open style="margin-top:16px"><summary style="font-weight:700;font-size:16px;cursor:pointer">Portfolio Inclusion Table</summary>';
 h+='<p class="muted" style="font-size:11px;margin:4px 0 10px">Include or exclude individual programs and adjust prioritised budgets. Changes apply immediately to the scenario.</p>';
 h+='<div class="filter-row" style="margin-bottom:8px">';
 h+=fKeys.map(function(k,i){
  var prev=Object.fromEntries(fKeys.slice(0,i).map(function(a){return [a,pf[a]];}));
  var opts=[...new Set([...AOP.filter(allRows,prev).map(function(r){return r[k]||'Not supplied';}),...(pf[k]||[])])].sort();
  return '<details class="filter"><summary>'+fLabels[i]+': '+(pf[k]?.length?pf[k].length+' selected':'All')+'</summary><div class="filter-options">'+opts.map(function(v){return '<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(pf[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(allRows,Object.assign({},prev,Object.fromEntries([[k,[v]]]))).length+')</label>';}).join('')+'</div></details>';
 }).join('');
 h+='<input data-search-scope="'+scope+'" aria-label="Search programs" placeholder="Search program or ID" value="'+esc(pf.search||'')+'" style="min-width:140px">';
 h+='<button data-clear-scope="'+scope+'">Clear</button>';
 h+='<select data-inclusion-sort aria-label="Sort order" style="min-width:140px;padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:11px">';
 var sortOpts=[['score-desc','Score (High→Low)'],['score-asc','Score (Low→High)'],['hardBen-desc','Hard Benefits (High→Low)'],['hardBen-asc','Hard Benefits (Low→High)'],['ratio-desc','ROI Ratio (High→Low)'],['ratio-asc','ROI Ratio (Low→High)'],['softBen-desc','Soft Benefits (High→Low)'],['softBen-asc','Soft Benefits (Low→High)'],['cost-desc','Requested (High→Low)'],['cost-asc','Requested (Low→High)'],['final-desc','Prioritised (High→Low)'],['final-asc','Prioritised (Low→High)']];
 sortOpts.forEach(function(o){h+='<option value="'+o[0]+'"'+(sortKey===o[0]?' selected':'')+'>Sort: '+o[1]+'</option>';});
 h+='</select></div>';
 h+='<p style="font-size:11px;color:var(--text2);margin:0 0 6px">'+filtered.length+' of '+allRows.length+' programs displayed · Requested '+money(AOP.sum(filtered,function(r){return r.cost;}))+' · Prioritised '+money(AOP.sum(filtered,function(r){return r.final;}))+'</p>';
 h+='<div class="tablebox burf-tablebox" style="max-height:600px" data-table-scope="'+scope+'"><table class="portfolio burf-table inclusion-table"><thead><tr>';
 h+='<th style="width:40px;min-width:40px;text-align:center"><input type="checkbox" data-inclusion-select-all aria-label="Select all visible"'+disabled+'></th>';
 h+='<th style="min-width:120px">ExCo Leader</th>';
 h+='<th style="min-width:140px">Organisation</th>';
 h+='<th class="identity" style="min-width:200px">Programs Name</th>';
 h+='<th class="numeric" style="min-width:90px">Hard Benefits (M€)</th>';
 h+='<th class="numeric" style="min-width:70px">ROI Ratio</th>';
 h+='<th class="numeric" style="min-width:90px">Soft Benefits (M€)</th>';
 h+='<th class="numeric" style="min-width:70px">Score</th>';
 h+='<th class="numeric" style="min-width:100px">Requested (M€)</th>';
 h+='<th class="numeric" style="min-width:110px">Prioritised (M€)</th>';
 h+='</tr></thead><tbody>';
 if(sorted.length){
  sorted.forEach(function(r){
   var hardBen=r.benefitClass==='hard'&&r.benefit>0?r.benefit:0;
   var softBen=r.benefitClass!=='hard'&&r.benefit>0?r.benefit:0;
   var isFunded=r.final>0;
   h+='<tr data-inclusion-row="'+esc(r.id)+'" style="'+(isFunded?'':'background:#fef9ef')+'">';
   h+='<td style="text-align:center"><input type="checkbox" data-inclusion-check="'+esc(r.id)+'" '+(isFunded?'checked':'')+' '+(!(r.cost>0)?'disabled':'')+disabled+'></td>';
   h+='<td style="font-size:11px">'+esc(r.exco||'Not supplied')+'</td>';
   h+='<td style="font-size:11px">'+esc(r.org||'Not supplied')+'</td>';
   h+='<td class="identity"><button class="program" data-program="'+esc(r.id)+'" style="font-size:11px">'+esc(r.name||'Programs name not supplied')+'</button><small>'+esc(r.id)+'</small></td>';
   h+='<td class="numeric" style="color:#27934C">'+dec(hardBen)+'</td>';
   h+='<td class="numeric">'+(r.ratio!==null?dec(r.ratio)+'x':'—')+'</td>';
   h+='<td class="numeric" style="color:#FFBE2C">'+dec(softBen)+'</td>';
   h+='<td class="numeric"><span class="score-badge '+(r.score>=session.settings.merit?'strong-score':'low-score')+'">'+dec(r.score)+'</span></td>';
   h+='<td class="numeric">'+dec(r.cost)+'</td>';
   h+='<td class="numeric"><input class="amount" type="number" step="0.1" min="0" data-inclusion-amount="'+esc(r.id)+'" data-original="'+r.final+'" value="'+dec(r.final)+'" style="width:85px;text-align:right" '+(!(r.cost>0)?'disabled':'')+disabled+'></td>';
   h+='</tr>';
  });
 } else {
  h+='<tr><td colspan="10" class="empty">No matching programs. Clear filters to return to the full portfolio.</td></tr>';
 }
 var totalHard=AOP.sum(filtered.filter(function(r){return r.benefitClass==='hard'&&r.benefit>0;}),function(r){return r.benefit;});
 var totalSoft=AOP.sum(filtered.filter(function(r){return r.benefitClass!=='hard'&&r.benefit>0;}),function(r){return r.benefit;});
 h+='</tbody><tfoot><tr style="background:#E6F1FF;font-weight:bold">';
 h+='<td></td><td colspan="3"><b>Total ('+filtered.length+' programs)</b></td>';
 h+='<td class="numeric" style="color:#27934C">'+dec(totalHard)+'</td>';
 var avgRatio=filtered.filter(function(r){return r.ratio!==null;});h+='<td class="numeric">'+(avgRatio.length?(AOP.sum(avgRatio,function(r){return r.ratio;})/avgRatio.length).toFixed(1)+'x':'—')+'</td>';
 h+='<td class="numeric" style="color:#FFBE2C">'+dec(totalSoft)+'</td>';
 h+='<td class="numeric">'+dec(filtered.length?AOP.sum(filtered,function(r){return r.score;})/filtered.length:0)+'</td>';
 h+='<td class="numeric">'+dec(AOP.sum(filtered,function(r){return r.cost;}))+'</td>';
 h+='<td class="numeric">'+dec(AOP.sum(filtered,function(r){return r.final;}))+'</td>';
 h+='</tr></tfoot></table></div></details>';
 return h;
}
function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M\u20ac) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation \xb7 Recommended'],['protect','Protect Commitments'],['evidence','Balance Sustain and Value'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'<label style="display:flex;align-items:center;gap:8px;padding:4px 10px;background:'+(s.itsimpMode?'#EDE9FE':'#F1F5F9')+';border:1px solid '+(s.itsimpMode?'#7C3AED':'#CBD5E0')+';border-radius:6px;cursor:pointer;margin-left:auto"><input type="checkbox" data-itsimp-toggle="1" '+(s.itsimpMode?'checked':'')+disabled+' style="width:14px;height:14px;accent-color:#7C3AED;cursor:pointer"><span style="font-size:12px;font-weight:'+(s.itsimpMode?'700':'500')+';color:'+(s.itsimpMode?'#5B21B6':'#4A5568')+'">IT Simplification Lever</span></label>'+'</div><p class="muted" style="font-size:12px;line-height:1.6">'+({optimal:money(s.budget)+' Scenario Allocation with Verified Legal &amp; Compliance ('+money(result.stages[0].allocation)+'), baselined Carry Over ('+money(result.stages[1].allocation)+'), prioritised Sustain Engineering &amp; Hygiene ('+money(result.stages[2].allocation)+'), leaving Value Based Portfolio with '+money(result.stages[3].allocation)+' — resulting in F&amp;R '+money(result.streams.ew.allocation)+' ('+dec(result.totals.allocation?result.streams.ew.allocation/result.totals.allocation*100:0)+'%) and BU Led '+money(result.streams.bu.allocation)+' ('+dec(result.totals.allocation?result.streams.bu.allocation/result.totals.allocation*100:0)+'%) split.',protect:'Protect Commitments uses confirmed baseline caps with full LFR and Sustain coverage.',evidence:'Balance Sustain and Value keeps confirmed carry baseline caps and changes the Sustain and Value allocations.',capacity:'Release Sustain Capacity reduces LFR to 44% and opens Sustain &amp; Hygiene budget for reallocation into carry-over and value Programs.'}[session.preset]||'Custom scenario — adjust levers to model allocation priorities. All settings are editable; changes are tracked in the decision log.')+'</p><div class="levers">'+[['1 \xb7 Legal and Compliance (Must Do)','lfr',0,'lever'],['2 \xb7 Carry Over demand','carry',1,'roi'],['3 \xb7 Sustain Engineering and Hygiene','sustain',2,'lever'],['4 \xb7 Value Based Portfolio','value',3,'lever']].map(([title,k,si,mode])=>{if(mode==='roi'){const stg=result.stages[si];return '<article><h3>'+esc(title)+'</h3><p>Confirmed business cases funded at approved baseline cap.</p><p>No ROI threshold. Funding = min(requested, approved baseline).</p>'+allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+'</article>';}const v=s[k],isAmt=v.basis==='amount',val=isAmt?(v.amount||0):v.pct,stg=result.stages[si],bdem=stg.fundableDemand!==undefined?stg.fundableDemand:stg.demand,pctCeil=v.basis==='bucket'&&bdem>0?Math.ceil(stg.demand/bdem*100):100,max=isAmt?Math.max(Math.ceil(stg.demand),Math.ceil(val)):Math.max(pctCeil,val),step=isAmt?'0.5':'5',unit=isAmt?'M\u20ac':'%',label=isAmt?'allocation':'percentage';const tickInterval=isAmt?2:5,nTicks=Math.round(max/tickInterval),labels=isAmt?Array.from({length:Math.floor(max/10)+1},(_,i)=>dec(i*10)):([0,25,50,75,100].filter(x=>x<=max).map(x=>String(x)));return '<article><h3>'+esc(title)+'</h3><div class="basis">'+[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M\u20ac)']].map(([b,bl])=>'<button data-basis="'+k+'" data-value="'+b+'" class="'+(v.basis===b?'active':'')+'"'+disabled+'>'+bl+'</button>').join('')+'</div><div class="slider-wrap"><input aria-label="'+esc(title)+' '+label+'" data-lever="'+k+'" type="range" min="0" max="'+max+'" step="'+step+'" value="'+val+'"'+disabled+'><div class="slider-ticks">'+Array.from({length:nTicks+1},()=>'<span></span>').join('')+'</div></div><div class="slider-labels">'+labels.map(x=>'<span>'+x+(isAmt?' M\u20ac':'%')+'</span>').join('')+'</div><label style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px"><input aria-label="'+esc(title)+' '+label+' value" data-lever="'+k+'" type="number" min="0" max="'+max+'" step="'+step+'" value="'+dec(val)+'" style="width:60px;text-align:center"'+disabled+'> <span style="font-size:12px;color:var(--text3)">'+unit+'</span></label>'+allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>';}).join('')+(s.itsimpMode?(function(){const k='itsimp',si=4,v=s.itsimp||{basis:'bucket',pct:0};const isAmt=v.basis==='amount',val=isAmt?(v.amount||0):v.pct;const stg=result.stages[si]||{demand:0,allocation:0,fundableDemand:undefined};const bdem=stg.fundableDemand!==undefined?stg.fundableDemand:stg.demand;const pctCeil=v.basis==='bucket'&&bdem>0?Math.ceil(stg.demand/(bdem||1)*100):100;const max=isAmt?Math.max(Math.ceil(stg.demand||10),Math.ceil(val),10):Math.max(pctCeil,val,5);const step=isAmt?'0.5':'1',unit=isAmt?'M€':'%',label=isAmt?'allocation':'percentage';const nTicks=Math.round(max/5),labels=isAmt?Array.from({length:Math.floor(max/10)+1},(_,i)=>dec(i*10)):([0,25,50,75,100].filter(x=>x<=max).map(x=>String(x)));return '<article style="border:2px solid #7C3AED;border-radius:8px">'+'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+'<span style="background:#7C3AED;color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:10px">Active</span>'+'<h3 style="margin:0;color:#5B21B6">5 · IT Simplification</h3></div>'+'<div class="basis">'+[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M€)']].map(([b,bl])=>'<button data-basis="'+k+'" data-value="'+b+'" class="'+(v.basis===b?'active':'')+'">'+bl+'</button>').join('')+'</div>'+'<div class="slider-wrap"><input aria-label="IT Simplification '+label+'" data-lever="'+k+'" type="range" min="0" max="'+max+'" step="'+step+'" value="'+val+'"'+disabled+'><div class="slider-ticks">'+Array.from({length:nTicks+1},()=>'<span></span>').join('')+'</div></div>'+'<div class="slider-labels">'+labels.map(x=>'<span>'+x+(isAmt?' M€':'%')+'</span>').join('')+'</div>'+'<label style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px"><input aria-label="IT Simplification '+label+' value" data-lever="'+k+'" type="number" min="0" max="'+max+'" step="'+step+'" value="'+dec(val)+'" style="width:60px;text-align:center"'+disabled+'> <span style="font-size:12px;color:var(--text3)">'+unit+'</span></label>'+allocationSelection(stg.allocation,stg.demand)+'</article>';})():'')+'</div><details class="advanced"><summary>Additional configuration \xb7 merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Consequence','Band','Payback'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Baseline cap</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','Verified LFR','Baseline cap','60% bucket','100% bucket'],['protect','Protect Commitments','100% bucket','Baseline cap','100% bucket','10% AOP'],['evidence','Balance Sustain and Value','100% bucket','Baseline cap','75% bucket','15% AOP'],['capacity','Release Sustain','44% bucket','Baseline cap','75% bucket','20% AOP']].map(([k,n,p1,p2,p3,p4])=>{const setting=AOP.preset(k);setting.budget=s.budget;if(setting._autoLfr){AOP.autoLfrPct(session.data,setting);}const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+'</td><td>'+p2+'</td><td>'+p3+'</td><td>'+p4+'</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table></details><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="new-scenario" style="border-color:#7C3AED;color:#5B21B6" title="Create a fresh Optimal Segmentation scenario at 100M€. All customisations will be cleared.">New Scenario (100M€)</button><button id="export-inclusions">Export inclusions \xb7 Excel</button><button id="export-full">Export full \xb7 Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' \xb7 r'+x.revision+' \xb7 '+x.status+'</button>').join('')+'</div></section>';}
function filters(scope,rows){const f=session.filters[scope]||{},keys=['exco','org','platform','newCarry','area','status','stageName'],labels=['ExCo Leader','BURF organisation','IT platform','New / Carryover / Sustain','Investment area','Funding status','Lever'];return '<div class="filter-row">'+keys.map((k,i)=>{const previous=Object.fromEntries(keys.slice(0,i).map(a=>[a,f[a]])),options=[...new Set([...AOP.filter(rows,previous).map(r=>r[k]||'Not supplied'),...(f[k]||[])])].sort();return '<details class="filter"><summary>'+labels[i]+': '+(f[k]?.length?f[k].length+' selected':'All')+'</summary><div class="filter-options">'+options.map(v=>'<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(f[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(rows,{...previous,[k]:[v]}).length+')</label>').join('')+'</div></details>';}).join('')+'<input data-search-scope="'+scope+'" aria-label="Search programs" placeholder="Search program or ID" value="'+esc(f.search||'')+'"><button data-clear-scope="'+scope+'">Clear</button>'+(scope!=='overview'?'<button data-export-scope="'+scope+'" class="primary">Download Excel</button>':'')+'</div>';}
function priorityFilters(rows){const scope='prioritized',f=session.filters[scope]||(session.filters[scope]={}),keys=['exco','org','platform','stageName'],labels=['ExCo Leader','BUR','Platform','Priority'];return '<div class="filter-row prioritized-filters">'+keys.map((k,i)=>{const previous=Object.fromEntries(keys.slice(0,i).map(a=>[a,f[a]])),options=[...new Set([...AOP.filter(rows,previous).map(r=>r[k]||'Not supplied'),...(f[k]||[])])].sort();return '<details class="filter"><summary>'+labels[i]+': '+(f[k]?.length?f[k].length+' selected':'All')+'</summary><div class="filter-options">'+options.map(v=>'<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(f[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(rows,{...previous,[k]:[v]}).length+')</label>').join('')+'</div></details>';}).join('')+'<button data-clear-scope="prioritized">Clear filters</button></div>';}
function chart(rows,chartScope){
const isScenarioTab=chartScope==='scenario';
const axisMode=session.chartAxis||'requested';
const yField=chartScope==='overview'?(axisMode==='benefits'?function(r){return r.benefitClass==='hard'&&r.benefit>0?r.benefit:null;}:function(r){return r.final>0?r.final:null;}):(axisMode==='benefits'?function(r){return r.benefitClass==='hard'&&r.benefit>0?r.benefit:null;}:function(r){return r.cost>0?r.cost:null;});
const yLabel=chartScope==='overview'?(axisMode==='benefits'?'Hard benefits':'Prioritised investment'):(axisMode==='benefits'?'Hard benefits':'Requested investment');
const valid=rows.filter(r=>yField(r)>0),yVals=valid.map(r=>yField(r));
const max=Math.max(10,...yVals),min=Math.min(.01,...yVals),lo=Math.log10(min),hi=Math.log10(max);
const y=v=>360-(Math.log10(v)-lo)/(hi-lo)*310;
const median=AOPViews.median(valid.map(r=>r.score));
const fundedInView=rows.filter(r=>r.final>0),fundedCount=fundedInView.length,totalCount=rows.length;
const fundedAmt=AOP.sum(fundedInView,r=>r.final),totalReq=AOP.sum(rows,r=>r.cost),fundedHardBen=AOP.sum(fundedInView.filter(r=>r.benefitClass==='hard'),r=>r.benefit),fundedSoftBen=AOP.sum(fundedInView.filter(r=>r.benefitClass!=='hard'&&r.benefit>0),r=>r.benefit);
const colourCats=session.chartColour==='band'?[['Healthy','#27934C'],['Contain','#FFBE2C'],['Unassessed','#909EAA']]:[['Funded','#20A53A'],['Partial','#FCA708'],['Excluded','#D43F44'],['Not funded','#DF8A96']];
const catAmts={};colourCats.forEach(function(c){catAmts[c[0]]=0;});
valid.forEach(function(r){const cat=session.chartColour==='band'?(AOP.key(r.decisionBand)==='healthy'?'Healthy':AOP.key(r.decisionBand)==='contain'?'Contain':'Unassessed'):(r.status==='Partial scope'?'Partial':r.status==='Excluded'?'Excluded':r.final>0?'Funded':'Not funded');catAmts[cat]=(catAmts[cat]||0)+yField(r);});
let h='<div style="display:flex;gap:16px;align-items:flex-start">';
h+='<div style="flex:1;min-width:0">';
h+='<div class="chart-head"><h3>'+esc(yLabel)+' and merit</h3><div style="display:flex;gap:10px;align-items:center">';
if(!isScenarioTab){var axisLabel1=chartScope==='overview'?'Prioritised (M€)':'Requested (M€)';var isBenAxis=axisMode==='benefits';h+='<div class="axis-toggle" style="display:flex;align-items:center;gap:6px;font-size:11px"><span style="font-weight:'+(isBenAxis?'400':'700')+';color:'+(isBenAxis?'#8899AA':'var(--dk)')+'">'+axisLabel1+'</span><label class="toggle-switch" style="position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0"><input type="checkbox" id="chart-axis-toggle" '+(isBenAxis?'checked':'')+' style="opacity:0;width:0;height:0"><span class="toggle-slider" style="position:absolute;cursor:pointer;inset:0;background:#0B5ED7;border-radius:22px;transition:.3s"></span></label><span style="font-weight:'+(isBenAxis?'700':'400')+';color:'+(isBenAxis?'var(--dk)':'#8899AA')+'">Hard Benefits (M€)</span></div>';}
h+='<label style="font-size:12px">Colour <select id="chart-colour"><option value="funding" '+(session.chartColour!=='band'?'selected':'')+'>Funding status</option><option value="band" '+(session.chartColour==='band'?'selected':'')+'>Decision Band</option></select></label>';
h+='</div></div>';
if(!isScenarioTab){h+='<p style="font-size:12px;color:#4a5568;margin:4px 0 8px"><b>'+fundedCount+' / '+totalCount+'</b> Programs funded for a total <b>'+money(fundedAmt)+' / '+money(totalReq)+'</b> Prioritised AOP 2027 demand · Committed: <span style="color:#27934C;font-weight:600">'+money(fundedHardBen)+' Hard</span> · <span style="color:#FFBE2C;font-weight:600">'+money(fundedSoftBen)+' Soft</span></p>';}
if(isScenarioTab){h+='<div class="chart-reference-values"><span class="median-value" data-median="'+(median??'')+'">Median merit: <b>'+(median===null?'No plotted programs':dec(median))+'</b></span><span class="merit-value">Merit threshold: <b>'+dec(session.settings.merit)+'</b></span><small>Median uses the '+valid.length+' plotted programs in this filtered view.</small></div>';}
h+='<svg class="bubble-chart" viewBox="0 0 1200 410" role="img" aria-label="'+esc(yLabel)+' on logarithmic vertical axis against merit score"><rect x="55" y="25" width="1110" height="335" fill="#FAFBFC"/>'+Array.from({length:11},(_,i)=>'<line x1="'+(55+i*11.1*10)+'" x2="'+(55+i*111)+'" y1="25" y2="360" stroke="#e4e9ef" stroke-dasharray="3 5"/><text x="'+(55+i*111)+'" y="385" text-anchor="middle">'+i*10+'</text>').join('')+Array.from({length:Math.floor(hi)-Math.ceil(lo)+1},(_,i)=>{const v=10**(Math.ceil(lo)+i);return '<line x1="55" x2="1165" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e4e9ef"/><text x="48" y="'+y(v)+'" text-anchor="end">'+(v<.1?dec(v*1000)+' K€':dec(v)+' M€')+'</text>';}).join('')+valid.map(r=>{const yv=yField(r);const fill=session.chartColour==='band'?(AOP.key(r.decisionBand)==='healthy'?'#27934C':AOP.key(r.decisionBand)==='contain'?'#FFBE2C':'#909EAA'):(r.status==='Partial scope'?'#FCA708':r.status==='Excluded'?'#D43F44':r.final>0?'#20A53A':'#DF8A96');return '<circle data-bubble="'+esc(r.id)+'" tabindex="0" role="img" aria-label="'+esc(r.name+'; merit '+dec(r.score)+'; '+yLabel+' '+money(yv))+'" cx="'+(55+r.score*11.1)+'" cy="'+y(yv)+'" r="'+Math.max(3,Math.min(27,Math.sqrt(yv/max)*27))+'" fill="'+fill+'" opacity=".65"></circle>';}).join('')+(median===null||!isScenarioTab?'':'<line class="median-line" x1="'+(55+median*11.1)+'" x2="'+(55+median*11.1)+'" y1="25" y2="360" stroke="#596C83" stroke-width="2" stroke-dasharray="2 5"/><text class="median-label" x="'+Math.min(1100,Math.max(95,55+median*11.1))+'" y="13" text-anchor="middle">Median '+dec(median)+'</text>')+'<line class="merit-line" x1="'+(55+session.settings.merit*11.1)+'" x2="'+(55+session.settings.merit*11.1)+'" y1="25" y2="360" stroke="#0B5ED7" stroke-dasharray="7 5"/><text class="merit-label" x="'+Math.min(1090,Math.max(105,55+session.settings.merit*11.1))+'" y="40" text-anchor="middle" style="fill:#0B5ED7">Merit threshold '+dec(session.settings.merit)+'</text><text x="600" y="407" text-anchor="middle">Merit score →</text></svg>';
h+='</div>';
h+='<div class="chart-legend-panel" style="width:180px;flex-shrink:0;font-size:11px;padding-top:40px">';
if(!isScenarioTab){h+='<div style="font-weight:700;font-size:12px;color:var(--dk);margin-bottom:8px;text-align:center">'+(axisMode==='benefits'?'Hard Benefits (M€)':'Requested (M€)')+'</div>';}
h+='<table style="width:100%;border-collapse:collapse">';
colourCats.forEach(function(c){h+='<tr><td style="padding:3px 6px"><i style="color:'+c[1]+'">■</i> '+c[0]+'</td><td style="padding:3px 6px;text-align:right;font-weight:600">'+money(catAmts[c[0]]||0)+'</td></tr>';});
h+='</table></div></div>';
return h;
}
function excoTradeoffPanel(allResultRows,scope){
 const tradeoffs=session.excoTradeoffScope===scope?session.excoTradeoffs||{}:{};
 const hasAnyTradeoff=Object.keys(tradeoffs).length>0;
 const excoData={};
 allResultRows.forEach(function(r){
   const ec=r.exco||'Unassigned';
   if(!excoData[ec])excoData[ec]={requested:0,funded:0,benefit:0,hardBen:0,softBen:0,count:0,fundedCount:0};
   const ed=excoData[ec];ed.count++;ed.requested+=r.cost||0;
   if(r.final>0){ed.funded+=r.final;ed.fundedCount++;}
   if(r.benefit>0){ed.benefit+=r.benefit;if(r.benefitClass==='hard')ed.hardBen+=r.benefit;else ed.softBen+=r.benefit;}
 });
 const entries=Object.entries(excoData).sort(function(a,b){return b[1].requested-a[1].requested;});
 const totalFunded=AOP.sum(allResultRows,function(r){return r.final;});
 const hasTradeoffs=Object.keys(tradeoffs).length>0;
 let h='<details class="panel section-panel exco-tradeoff"'+(hasTradeoffs?' open':'')+'><summary style="font-weight:700;font-size:14px;cursor:pointer">ExCo Trade-off Cockpit</summary>';
 h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><p class="muted" style="font-size:11px;margin:0">Enter a target budget per ExCo leader. Increase adds P4 Programs by merit; decrease removes lowest-merit funded P4 Programs. Overall AOP adjusts accordingly.</p>';
 h+=(hasAnyTradeoff?'<button id="reset-exco-tradeoff" style="font-size:11px;padding:4px 12px;white-space:nowrap">Reset all trade-offs</button>':'')+'</div>';
 h+='<div class="tablebox" style="max-height:400px"><table class="it exco-tradeoff-table"><thead><tr>';
 h+='<th>ExCo Leader</th><th class="num">Requested M€</th><th class="num">Funded M€</th>';
 h+='<th class="num">Gap M€</th><th class="num">% Funded</th>';
 h+='<th class="num">Hard Ben. M€</th><th class="num">Soft Ben. M€</th>';
 h+='<th class="num" style="min-width:120px">Total Prioritized Budget M€</th>';
 h+='<th class="num">Delta M€</th><th class="num">Progs / Benefits impact</th><th class="num">Revert</th>';
 h+='</tr></thead><tbody>';
 let grandReq=0,grandFund=0,grandHard=0,grandSoft=0,grandDelta=0,grandProgImpact=0,grandImpactHard=0,grandImpactSoft=0;
 entries.forEach(function(e){
   const ec=e[0],ed=e[1];
   const info=AOP.EXCO_HIERARCHY[ec];
   const role=info?info.role:ec;
   const gap=ed.requested-ed.funded;
   const pct=ed.requested>0?Math.round(ed.funded/ed.requested*100):0;
   const tradeoffVal=tradeoffs[ec]!==undefined?tradeoffs[ec]:null;
   const delta=tradeoffVal!==null?tradeoffVal-ed.funded:0;
   let progImpact=0,impactHard=0,impactSoft=0;
   if(delta>0.01){
     const ecUnfunded=allResultRows.filter(function(r){return r.exco===ec&&r.final===0&&r.cost>0&&r.stage===3;}).sort(function(a,b){return b.score-a.score;});
     let used=0;
     for(let i=0;i<ecUnfunded.length&&used<delta;i++){
       if(used+ecUnfunded[i].cost<=delta+0.01){used+=ecUnfunded[i].cost;progImpact++;
         if(ecUnfunded[i].benefit>0){if(ecUnfunded[i].benefitClass==='hard')impactHard+=ecUnfunded[i].benefit;else impactSoft+=ecUnfunded[i].benefit;}
       }
     }
   } else if(delta<-0.01){
     const ecFundedP4=allResultRows.filter(function(r){return r.exco===ec&&r.final>0&&r.stage===3;}).sort(function(a,b){return a.score-b.score;});
     let freed=0;
     for(let i=0;i<ecFundedP4.length&&freed<Math.abs(delta);i++){
       freed+=ecFundedP4[i].final;progImpact--;
       if(ecFundedP4[i].benefit>0){if(ecFundedP4[i].benefitClass==='hard')impactHard-=ecFundedP4[i].benefit;else impactSoft-=ecFundedP4[i].benefit;}
     }
   }
   grandReq+=ed.requested;grandFund+=ed.funded;grandHard+=ed.hardBen;grandSoft+=ed.softBen;grandDelta+=delta;grandProgImpact+=progImpact;grandImpactHard+=impactHard;grandImpactSoft+=impactSoft;
   const pctColor=pct>=80?'#27934C':pct>=50?'#FFBE2C':'#D43F44';
   const deltaColor=delta>0.01?'#0B5ED7':delta<-0.01?'#D43F44':'inherit';
   h+='<tr><td><strong>'+esc(ec)+'</strong> <small style="color:#596C83">'+esc(role)+'</small></td>';
   h+='<td class="num">'+money(ed.requested)+'</td><td class="num">'+money(ed.funded)+'</td>';
   h+='<td class="num">'+(gap>0?money(gap):'—')+'</td>';
   h+='<td class="num"><span style="color:'+pctColor+'">'+pct+'%</span></td>';
   h+='<td class="num" style="color:#27934C">'+money(ed.hardBen)+'</td>';
   h+='<td class="num" style="color:#FFBE2C">'+money(ed.softBen)+'</td>';
   h+='<td class="num"><input type="number" step="0.5" min="0" class="exco-tradeoff-input" data-exco-budget="'+esc(ec)+'" value="'+(tradeoffVal!==null?dec(tradeoffVal):'')+'" placeholder="'+dec(ed.funded)+'" style="width:90px;text-align:right"></td>';
   h+='<td class="num" style="color:'+deltaColor+'">'+(Math.abs(delta)>0.01?(delta>0?'+':'')+dec(Math.round(delta*10)/10):'—')+'</td>';
   if(progImpact!==0){
     const sign=progImpact>0?'+':'';const col=progImpact>0?'#27934C':'#D43F44';
     h+='<td class="num" style="font-size:11px;line-height:1.4"><span style="color:'+col+';font-weight:600">'+sign+progImpact+' prog'+(Math.abs(progImpact)>1?'s':'')+'</span>';
     if(Math.abs(impactHard)>0.01)h+='<br><span style="color:#27934C">'+sign+dec(Math.round(impactHard*10)/10)+' Hard</span>';
     if(Math.abs(impactSoft)>0.01)h+='<br><span style="color:#FFBE2C">'+sign+dec(Math.round(impactSoft*10)/10)+' Soft</span>';
     h+='</td>';
   } else h+='<td class="num">—</td>';
  const hasOvr=allResultRows.some(function(r){return r.stream===tab&&r.exco===ec&&(r.stage===3||r.stage===4)&&r.override?.note==='ExCo trade-off';}); h+='<td class="num">'+(hasOvr?'<button data-revert-exco="'+esc(ec)+'" style="font-size:11px;padding:2px 8px;border-color:#D43F44;color:#D43F44" title="Revert stage-3/4 Programs overrides for '+esc(ec)+'">Revert</button>':'<span style="color:#aaa;font-size:11px">—</span>')+'</td>'; h+='</tr>';
 });
 const grandGap=grandReq-grandFund;
 h+='<tr style="background:var(--lt);font-weight:700"><td>Total</td>';
 h+='<td class="num">'+money(grandReq)+'</td><td class="num">'+money(grandFund)+'</td>';
 h+='<td class="num">'+money(grandGap)+'</td><td class="num">'+Math.round(grandFund/grandReq*100)+'%</td>';
 h+='<td class="num">'+money(grandHard)+'</td><td class="num">'+money(grandSoft)+'</td>';
 h+='<td class="num"></td>';
 h+='<td class="num" style="color:'+(grandDelta>0?'#0B5ED7':grandDelta<0?'#D43F44':'inherit')+';font-weight:700">'+(Math.abs(grandDelta)>0.01?(grandDelta>0?'+':'')+dec(Math.round(grandDelta*10)/10):'—')+'</td>';
 if(grandProgImpact!==0){const sign=grandProgImpact>0?'+':'';h+='<td class="num" style="font-size:11px"><span style="font-weight:600">'+sign+grandProgImpact+'</span>'+(Math.abs(grandImpactHard)>0.01?' <span style="color:#27934C">'+sign+dec(Math.round(grandImpactHard*10)/10)+'H</span>':'')+(Math.abs(grandImpactSoft)>0.01?' <span style="color:#FFBE2C">'+sign+dec(Math.round(grandImpactSoft*10)/10)+'S</span>':'')+'</td>';}
 else h+='<td class="num">—</td>';
 h+='<td></td>';
 h+='</tr></tbody></table></div>';
 if(Math.abs(grandDelta)>0.01){
   const isIncrease=grandDelta>0;
   h+='<div class="exco-tradeoff-summary" style="margin-top:10px;padding:12px 16px;background:'+(isIncrease?'#EBF5FF':'#FFF5F5')+';border-radius:8px;border:1px solid '+(isIncrease?'#0B5ED7':'#D43F44')+'">';
   h+='<strong>Trade-off impact:</strong> On top off budget: <b style="color:'+(isIncrease?'#D43F44':'#27934C')+'">'+(grandDelta>0?'+':'')+dec(Math.round(grandDelta*10)/10)+' M€</b> · ';
   h+='Allocation would be: <b>'+money(result.totals.allocation+grandDelta)+'</b> vs Total AOP '+money(session.settings.budget)+' · ';
   h+='Programs '+(isIncrease?'unlocked':'removed')+': <b>'+Math.abs(grandProgImpact)+'</b>';
   if(Math.abs(grandImpactHard)>0.01)h+=' · Hard benefit impact: <b>'+(grandImpactHard>0?'+':'')+dec(Math.round(grandImpactHard*10)/10)+' M€</b>';
   if(Math.abs(grandImpactSoft)>0.01)h+=' · Soft benefit impact: <b>'+(grandImpactSoft>0?'+':'')+dec(Math.round(grandImpactSoft*10)/10)+' M€</b>';
   h+='<br><button id="apply-exco-tradeoff" class="primary" style="margin-top:8px">Apply trade-off (Total AOP stays at '+money(session.settings.budget)+')</button>';
   h+='</div>';
 }
 h+='</details>';
 return h;
}
function stream(scope){const nonPmiRows=scope==='overview'?result.rows.filter(r=>!r.isPmi):result.rows.filter(r=>r.stream===scope&&!r.isPmi);const rows=scope==='overview'?result.rows.filter(r=>!r.isPmi):result.rows.filter(r=>r.stream===scope),f=session.filters[scope]||{},shown=AOP.filter(rows,f),allocation=AOP.sum(rows,r=>r.final),automatic=AOP.sum(rows,r=>r.automatic),requested=AOP.sum(rows,r=>r.cost),benefits=AOP.sum(rows.filter(r=>r.final>0),r=>r.benefit),hardBen=AOP.sum(rows.filter(r=>r.final>0&&r.benefitClass==='hard'),r=>r.benefit),softBen=AOP.sum(rows.filter(r=>r.final>0&&r.benefitClass!=='hard'&&r.benefit>0),r=>r.benefit),editable=scope!=='overview'&&session.status!=='Finalised';var pmiInfo=result.pmi||{count:0,funded:0};return '<section class="kpis stream-kpis" style="--kpi-cols:6">'+kpi('Programs demand',money(requested),'Submitted demand')+kpi('Indicative Programs envelope',money(automatic),'Automatic reporting allocation, not a ceiling')+kpi('Prioritised demand',money(allocation),rows.filter(r=>r.final>0).length+' funded; '+(allocation>=automatic?'+':'−')+money(Math.abs(allocation-automatic))+' vs indicative')+((scope==='ew'||scope==='bu')?(function(){const onTop=AOP.round(result.totals.allocation-session.settings.budget);return kpi('On top off AOP',onTop>0.01?'+'+money(onTop):onTop<-0.01?money(onTop):money(0),(onTop>0.01?'Additional on top of '+money(session.settings.budget)+' Total AOP':onTop<-0.01?'Under budget by '+money(Math.abs(onTop)):'Within '+money(session.settings.budget)+' Total AOP'),onTop>0.01?'danger':'');})():kpi('Merit floor',dec(session.settings.merit),'Advanced Value eligibility setting'))+kpi('Demand gap',money(requested-allocation),'Requested less prioritised')+'<div class="kpi"><span>Committed Benefits</span><div style="margin:6px 0"><span style="color:var(--dk);font-size:18px;font-weight:300">'+money(hardBen)+'</span> <span style="color:#333;font-size:12px">Hard</span></div><div><span style="color:#333;font-size:18px;font-weight:300">'+money(softBen)+'</span> <span style="color:#333;font-size:12px">Soft M€</span></div><small>'+rows.filter(r=>r.final>0).length+' funded programs</small></div>'+'</section>'+'<section class="panel"><div class="toolbar"><h2>'+tabNames[scope]+'</h2>'+(scope==='overview'?'<button data-action="finalise" class="primary" '+(session.status==='Finalised'?'disabled':'')+'>Finalise scenario</button><button data-action="fork">New working version</button>':'')+'</div>'+filters(scope,rows)+((scope==='ew'||scope==='bu')?excoTradeoffPanel(shown,scope):'')+chart(shown,scope)+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records · Filtered request '+money(AOP.sum(shown,r=>r.cost))+' · Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+table(shown,scope,editable,rows)+'</section>'+(scope==='overview'?'<section class="panel"><h2>Source decision coverage</h2><div class="two-col">'+coverage('decisionBand')+coverage('overall')+'</div></section>':'');}
function table(rows,scope,editable,allRows){
 const groups=new Map();for(const r of rows){const g=r.org||'BURF not supplied';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}
 const summary=(rs,g,id,footer=false,baseline=null)=>{const a=AOPViews.aggregate(rs),open=expanded.has(id),bandClass=a.band==='Healthy'?'healthy':a.band==='Contain'?'contain':'mixed',isFiltered=footer&&baseline&&baseline.count>a.count;
  const amount=(field,label)=>'<td class="numeric" data-aggregate="'+field+'" data-exact="'+(a[field].sum??'')+'"><strong>'+dec(a[field].sum)+'</strong><small>'+(isFiltered?'of '+dec(baseline[field].sum):'Avg '+dec(a[field].mean))+'</small></td>';
  return '<tr class="'+(footer?'summary-total':'group burf-summary')+'" data-group-summary="'+esc(id)+'" data-organisation="'+esc(g)+'"><td class="identity">'+(footer?'<b>'+esc(g)+'</b>':'<button class="burf-toggle" data-collapse="'+esc(id)+'" aria-expanded="'+open+'"><span class="triangle">'+(open?'▼':'▶')+'</span>'+esc(g)+'</button>')+' <span class="group-count">('+a.funded+'/'+a.count+(isFiltered?' of '+baseline.count:'')+')</span></td><td><span class="band-label '+bandClass+'">'+esc(a.band)+'</span><small>'+Object.entries(a.bands).map(([k,v])=>esc(k)+' '+v).join(' · ')+'</small></td><td class="numeric" data-aggregate="score" data-exact="'+(a.score.mean??'')+'"><span class="score-badge '+(a.score.mean>=session.settings.merit?'strong-score':'low-score')+'">'+dec(a.score.mean)+'</span><small>Average merit</small></td>'+amount('cost')+amount('final')+amount('unfunded')+amount('benefit')+'<td class="numeric" data-aggregate="evidence"><strong>'+a.evidence+'</strong><small>of '+(isFiltered?a.count+' ('+baseline.count+' total)':a.count)+' numeric claims</small></td><td><b>'+a.funded+(isFiltered?' of '+baseline.funded:'')+' funded · '+(a.count-a.funded)+' unfunded</b><small>'+a.partial+' partial scope · '+a.held+' evidence/eligibility holds</small><small>'+a.missingCost+' missing requests</small></td></tr>';
 };
 const groupRows=[...groups].sort((a,b)=>(AOPViews.aggregate(b[1]).score.mean??-1)-(AOPViews.aggregate(a[1]).score.mean??-1)||a[0].localeCompare(b[0]));
 return '<div class="table-actions"><p>Organisation totals visible when collapsed. ('+rows.length+' displayed programs)</p><button data-expand-all="'+scope+'">Expand all</button><button data-close-all="'+scope+'">Collapse all</button></div><div class="tablebox burf-tablebox" data-table-scope="'+scope+'"><table class="portfolio burf-table"><thead><tr><th class="identity">Organisation / Programs</th><th>Decision Band</th><th>Score</th><th>Requested (M€)</th><th>Prioritised (M€)</th><th>Unfunded (M€)</th><th>Benefits (M€)</th><th>Evid.</th><th>'+(scope==='unfunded'?'Reason not funded / demand details':'Funding status / demand details')+'</th></tr></thead><tbody>'+groupRows.map(([g,rs])=>{
  const id=scope+'|'+encodeURIComponent(g),hidden=expanded.has(id)?'':' hidden';
  return summary(rs,g,id)+(editable?'<tr class="group-controls" data-group-row="'+esc(id)+'"'+hidden+'><td colspan="9"><label><input type="checkbox" aria-label="Select displayed '+esc(g)+'" data-group-check="'+esc(g)+'"> Select displayed programs</label><button data-group="'+esc(g)+'" data-choice="include">Include '+rs.filter(r=>r.cost>0).length+' eligible amount rows</button><button data-group="'+esc(g)+'" data-choice="exclude">Exclude displayed group</button><small>Changes are manual portfolio decisions. Missing/nonpositive requests cannot be included.</small></td></tr>':'')+rs.map(r=>'<tr class="program-row" data-group-row="'+esc(id)+'" data-row-id="'+esc(r.id)+'"'+hidden+'><td class="identity"><div class="program-identity">'+(editable?'<input type="checkbox" aria-label="Include '+esc(r.id)+'" data-include="'+esc(r.id)+'" '+(r.final>0?'checked':'')+' '+(!(r.cost>0)?'disabled':'')+'>':'')+'<button class="program" data-program="'+esc(r.id)+'">'+esc(r.name||'Programs name not supplied')+'</button></div><small>'+esc(r.id)+' · '+esc(r.sourceSheet)+' row '+r.sourceRow+'</small></td><td><span class="band-label '+(AOP.key(r.decisionBand)==='healthy'?'healthy':AOP.key(r.decisionBand)==='contain'?'contain':'mixed')+'">'+esc(r.decisionBand||'Unassessed')+'</span></td><td class="numeric"><span class="score-badge '+(r.score>=session.settings.merit?'strong-score':'low-score')+'">'+dec(r.score)+'</span></td><td class="numeric">'+dec(r.cost)+'</td><td class="numeric">'+(editable?'<input class="amount" aria-label="Prioritised amount '+esc(r.id)+'" type="number" step="0.1" min="0" data-amount="'+esc(r.id)+'" data-original="'+r.final+'" value="'+dec(r.final)+'" '+(!(r.cost>0)?'disabled':'')+'>':dec(r.final))+'</td><td class="numeric">'+dec(r.unfunded)+'</td><td class="numeric">'+dec(r.benefit)+'<small>'+(r.ratio===null?'Multiple unavailable':dec(r.ratio)+'x of request')+'</small></td><td class="numeric">'+(r.benefit!==null?'1':'0')+'</td><td><b class="status-pill">'+esc(r.status)+'</b><small>'+esc(r.reason)+'</small><small>'+esc(r.newCarry==='Change & Sustain'?'Sustain Engineering':r.newCarry||'Not supplied')+' · '+esc(r.stageName)+'</small><small>'+esc(r.overall||'Overall decision unassessed')+'</small><small>'+esc(r.benefitDetails||AOP.clean(r.benefitRaw)||'Benefit evidence missing')+'</small><small class="warning">'+esc(r.warnings.join('; '))+'</small>'+(editable?'<button data-auto="'+esc(r.id)+'">Return to automatic</button><details class="inline-review"><summary>Scenario request / merit / evidence</summary><label>Scenario requested investment (M€)<input type="number" step="0.001" min="0" data-scenario-request="'+esc(r.id)+'" value="'+r.cost+'"></label><label>Reviewed merit (0–100; optional)<input type="number" min="0" max="100" step="0.1" data-scenario-merit="'+esc(r.id)+'" value="'+(r.review?.merit??'')+'"></label><label>Optional decision note<input data-note="'+esc(r.id)+'" value="'+esc(r.override?.note||'')+'"></label><label><input type="checkbox" data-review-benefit="'+esc(r.id)+'" '+(r.review?.benefitReviewed?'checked':'')+'> Benefit evidence confirmed</label><label>Contain condition<input data-condition="'+esc(r.id)+'" value="'+esc(r.review?.condition||'')+'"></label><label>Captured Consequence tier<select data-consequence="'+esc(r.id)+'"><option value="">Automated interpretation</option>'+[0,5,10,15].map(v=>'<option value="'+v+'" '+(r.review?.consequence===v?'selected':'')+'>'+dec(v)+'</option>').join('')+'</select></label><label>Review rationale<input data-review-note="'+esc(r.id)+'" value="'+esc(r.review?.note||'')+'"></label><button data-apply-review="'+esc(r.id)+'">Record evidence review</button></details>'+(r.override?.state==='needs-review'?'<button data-resolve="'+esc(r.id)+'">Reconfirm previous decision</button><button data-discard="'+esc(r.id)+'">Discard previous decision</button>':''):'')+'</td></tr>').join('');
 }).join('')+(rows.length?'':'<tr><td colspan="9" class="empty">No matching programs. Clear filters to return to the portfolio view.</td></tr>')+'</tbody><tfoot>'+summary(rows,'All displayed BURFs',scope+'|total',true,allRows?AOPViews.aggregate(allRows):null)+'</tfoot></table></div>';
}
function logs(){return '<details class="panel section-panel"><summary>Decision log, demand data and decision rules</summary><h2>Decision log of selections and changes</h2><div class="toolbar"><button id="undo">Undo latest decision</button><button data-action="reset">Clear all Programs overrides ('+Object.keys(session.overrides).length+')</button></div><p>Local-session attribution only. This offline file does not authenticate users. Events preserve before and after values in the portable scenario and Excel export.</p><div class="tablebox log"><table><thead><tr><th>Revision / Time</th><th>Change Origin</th><th>Change Details</th></tr></thead><tbody>'+[...session.events].reverse().map(e=>{var d=e.details||{},sum='';if(e.action==='program'){var ch=d.choice==='exclude'?'Excluded':d.choice==='include'?'Included':d.choice==='automatic'?'Returned to automatic':'Changed';sum=ch+' '+(d.id||'')+(d.amount?' at '+dec(d.amount)+' M€':'')+(d.note?' — '+d.note:'');}else if(e.action==='group'){sum=(d.choice==='exclude'?'Excluded':'Included')+' group of '+(d.ids?d.ids.length:'?')+' Programs';}else if(e.action==='setting'){sum='Scenario settings updated';}else if(e.action==='preset'){sum='Applied preset: '+(d.preset||'');}else if(e.action==='review'){sum='Evidence review for '+(d.id||'');}else if(e.action==='resolve'){sum=(d.discard?'Discarded':'Reconfirmed')+' previous decision for '+(d.id||'');}else if(e.action==='reset'){sum='Cleared all Programs overrides';}else if(e.action==='finalise'){sum='Scenario finalised';}else if(e.action==='fork'){sum='New working version created';}else if(e.action==='refresh'){sum='Source data refreshed: '+(d.added?d.added.length:0)+' added, '+(d.changed?d.changed.length:0)+' changed';}else{sum=e.action;}return '<tr><td>'+e.revision+'<small>'+esc(e.time.replace('T',' ').substring(0,16))+'</small></td><td>'+esc(e.origin)+'</td><td>'+esc(sum)+'</td></tr>';}).join('')+'</tbody></table></div><h2>Demand data and decision rules</h2><p>'+esc(session.data.sourceFile)+' · '+result.rows.length+' demand rows · '+money(result.totals.requested)+' requested · '+result.totals.missing+' missing requested amounts (including whitespace).</p><p class="source-meta">SHA-256 '+session.data.sourceHash+'<br>Rule version '+AOP.VERSION+' · source version '+session.data.version+'</p><div class="toolbar"><label class="file-button">Refresh demand workbook<input type="file" id="refresh-file" accept=".xlsx"></label><button id="source-xlsx">Download original demand Excel</button><button id="source-json">Download complete workbook snapshot</button></div><div id="refresh-preview">'+(pending&&pending.audit?renderAuditPanel(pending.audit):pending?'<p class="notice">Validated refresh: '+pending.diff.added.length+' added, '+pending.diff.changed.length+' changed, '+pending.diff.removed.length+' removed, '+pending.diff.unchanged.length+' unchanged. Requested '+money(pending.diff.requested)+'. Current revision is saved before applying.</p><button id="apply-refresh" class="primary">Apply as new source and scenario version</button><button id="cancel-refresh">Cancel refresh</button>':'')+'</div><details><summary>Decision Band and Overall AOP decision coverage</summary><div class="two-col">'+coverage('decisionBand')+coverage('overall')+'</div><p>Healthy: suitable for merit assessment. Contain: proceed only with a captured condition. P1: immediate mandatory obligation; P2: scheduled mandatory obligation. Priority TBD: mandatory timing is unresolved. Blank: not yet assessed, not an invented decision. Source decision text is retained unchanged.</p></details><details><summary>Allocation and evidence rules</summary><p><b>Funding order:</b> Legal &amp; Compliance → Carry Over demand → Sustain &amp; Hygiene → Value Portfolio. Each stage is funded before the next begins.</p><p><b>Legal &amp; Compliance:</b> All must-do demand enters the lever. Verified compliance (name and year present) is prioritised first; remaining must-do demand is ranked by merit score. The Optimal preset auto-selects the verified share.</p><p><b>Carry Over demand:</b> All carry-over records enter the lever. Confirmed carry-overs (baselined, must-do/must-have priority) are funded first, capped at their original approved amount. There is no ROI threshold. Unconfirmed carry-over cases remain visible without automatic funding through this rule.</p><p><b>How Programs are selected:</b> Whole requests are funded in priority order. If a request does not fit the stage budget, it is skipped and the next is tried. Manual edits can fund partial scope. Excluded Programs do not refill automatically.</p><p><b>What blocks automatic funding:</b> Missing Programs name, missing or zero request, unresolved mandatory priority, or unrecognised decision values. Blank fields stay visible — they are not treated as zero.</p><p><b>Financial precision:</b> Displayed amounts are rounded to one decimal. Calculations and exports use full source precision. F&amp;R and BU Led decisions update one shared scenario.</p></details></details>';}
document.addEventListener('click',function(ev){const b=ev.target.closest('[data-apply-review]');if(!b)return;const id=b.dataset.applyReview,box=b.closest('.inline-review');if(!box?.querySelector('[data-scenario-request]'))return;ev.stopImmediatePropagation();try{const r=result.rows.find(r=>r.id===id),review={...r.review,requested:Number(box.querySelector('[data-scenario-request]').value),note:box.querySelector('[data-review-note]').value,condition:box.querySelector('[data-condition]').value};const merit=box.querySelector('[data-scenario-merit]').value;if(merit==='')delete review.merit;else review.merit=Number(merit);const consequence=box.querySelector('[data-consequence]').value;if(consequence!=='')review.consequence=Number(consequence);session=AOP.transact(session,'review',{id,review},tab);render();persist();}catch(e){alert(e.message);}},true);
function details(id){const r=result.rows.find(x=>x.id===id);
const sv=k=>{const v=r.sourceValues.find(x=>{const lbl=x.label.split(' [')[0].split(' / ')[0].toLowerCase().trim();return lbl.startsWith(k.toLowerCase());});return v&&AOP.clean(typeof v.value==='number'?dec(v.value):v.value)?v.value:null;};
const priorityVal=sv('priority')||r.priority||'Not supplied';
const benefitQuant=r.benefit!==null?money(r.benefit):'Not supplied';
const benefitQual=AOP.clean(r.benefitDetails)||'Not supplied';
const paybackVal=r.paybackYears!==null?r.paybackYears+' year'+(r.paybackYears!==1?'s':''):'Not supplied';
const problemVal=AOP.clean(r.problem)||'Not supplied';
const scopeVal=AOP.clean(r.scope)||'Not supplied';
const impactVal=AOP.clean(r.impact)||'Not supplied';
const isUserOverride=r.override&&r.override.state;
const rationaleType=isUserOverride?'User Prioritised':'Default Logic';
var h='<h2 style="margin:0 0 4px;font-size:17px;color:var(--dk)">'+esc(r.name||r.id)+'</h2>';
h+='<p style="color:var(--text2);font-size:12px;margin:0 0 12px">'+esc(r.id)+' · '+esc(r.stageName)+' · <b>'+esc(r.status)+'</b></p>';
h+='<div style="display:flex;gap:24px;margin-bottom:14px"><div><span style="font-size:11px;color:var(--text2)">Demand</span><div style="font-size:20px;font-weight:300;color:var(--dk)">'+money(r.cost)+'</div></div><div><span style="font-size:11px;color:var(--text2)">Prioritised Demand</span><div style="font-size:20px;font-weight:300;color:var(--blue)">'+money(r.final)+'</div></div></div>';
h+='<h3 style="font-size:13px;color:var(--dk);margin:14px 0 6px;border-bottom:1px solid var(--mist);padding-bottom:4px">Details</h3>';
h+='<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px">';
var detailRows=[['Priority',esc(priorityVal)],['Benefit (Quantitative)',esc(benefitQuant)],['Benefit (Qualitative)',esc(benefitQual)],['Payback Period',esc(paybackVal)],['Problem Statement',esc(problemVal)],['Programs Scope',esc(scopeVal)],['Impact and Cost of Not Doing',esc(impactVal)]];
detailRows.forEach(function(d){h+='<tr style="border-bottom:1px solid var(--mist)"><td style="padding:6px 8px;width:40%;color:var(--text2);vertical-align:top">'+d[0]+'</td><td style="padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere">'+d[1]+'</td></tr>';});
h+='</table>';
h+='<h3 style="font-size:13px;color:var(--dk);margin:14px 0 6px;border-bottom:1px solid var(--mist);padding-bottom:4px">Merit Score — '+dec(r.score)+'</h3>';
h+='<table style="width:100%;border-collapse:collapse;font-size:11px;margin:4px 0"><tr style="background:var(--dk);color:white"><th style="padding:5px 8px;text-align:left">Component</th><th style="padding:5px 8px;text-align:right">Raw</th><th style="padding:5px 8px;text-align:right">Weight</th><th style="padding:5px 8px;text-align:right">Weighted</th></tr>'+['Benefit Strength','Submitted Priority','Captured Consequence','Decision Band','Payback Period'].map((n,i)=>'<tr style="border-bottom:1px solid var(--mist)"><td style="padding:5px 8px">'+n+'</td><td style="padding:5px 8px;text-align:right">'+r.rawComponents[i]+'/'+[50,25,15,10,10][i]+'</td><td style="padding:5px 8px;text-align:right">'+dec(session.settings.weights[i])+'</td><td style="padding:5px 8px;text-align:right;font-weight:700">'+dec(r.components[i])+'</td></tr>').join('')+'<tr style="background:var(--lt);font-weight:700"><td style="padding:5px 8px">Total</td><td></td><td style="text-align:right">100</td><td style="padding:5px 8px;text-align:right">'+dec(r.score)+'</td></tr></table>';
h+='<h3 style="font-size:13px;color:var(--dk);margin:14px 0 6px;border-bottom:1px solid var(--mist);padding-bottom:4px">Funding Rationale <span style="font-size:11px;font-weight:400;color:var(--text2)">— '+esc(rationaleType)+'</span></h3>';
h+='<p style="font-size:12px;margin:0 0 14px">'+esc(r.reason)+'</p>';
h+='<p style="font-size:11px;color:var(--text3);margin-top:12px">'+esc(r.sourceSheet)+' row '+r.sourceRow+' · '+session.data.version+'</p>';
$('#modal-body').innerHTML=h;$('#modal').showModal();}
function exportExcel(rows,scope){download('AOP2027-'+scope+'-r'+session.revision+'.xlsx',AOPWorkbook.write(AOPWorkbook.sheets(session,result,rows,scope)),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');}
async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function portable(){const payload=JSON.stringify(session);download('AOP2027-'+session.id+'-r'+session.revision+'.json',JSON.stringify({format:'AOP2027 portable scenario',sha256:await digest(payload),payload}),'application/json');}

function auditDelta(val,suffix){if(val===null||val===undefined)return '<span class="audit-delta-zero">—</span>';const s=typeof val==='number'?val:0;if(Math.abs(s)<0.005)return '<span class="audit-delta-zero">0.0'+(suffix||'')+'</span>';return '<span class="'+(s>0?'audit-delta-up':'audit-delta-down')+'">'+(s>0?'+':'')+dec(s)+(suffix||'')+'</span>';}
function auditDeltaInt(val){if(!val)return '<span class="audit-delta-zero">0</span>';return '<span class="'+(val>0?'audit-delta-up':'audit-delta-down')+'">'+(val>0?'+':'')+val+'</span>';}
function auditPct(before,after){if(!before||Math.abs(before)<0.01)return '—';const p=((after-before)/Math.abs(before))*100;return (p>0?'+':'')+p.toFixed(1)+'%';}
function severityBadge(sev){return '<span class="audit-severity audit-'+sev+'">'+sev.toUpperCase()+'</span>';}

function renderAuditPanel(audit){
 if(!audit)return '';
 const b=audit.before,a=audit.after,d=audit.deltas;
 var h='<details class="audit-panel" open><summary>Data Refresh Audit Report</summary>';
 h+='<p style="font-size:11px;color:var(--text2)">Generated '+esc(audit.timestamp.replace('T',' ').substring(0,16))+' · Source '+esc(audit.sourceVersion.before)+' → '+esc(audit.sourceVersion.after)+'</p>';

 // Section 1: Summary KPIs
 h+='<div class="audit-kpis">';
 h+='<div class="kpi'+(d.rowCount?(d.rowCount>0?' green':' red'):'')+'"><span class="label">Row Count</span><div class="value">'+b.rowCount+' → '+a.rowCount+'</div><div class="sub">'+auditDeltaInt(d.rowCount)+' records</div></div>';
 h+='<div class="kpi'+(d.requested?(d.requested>0?' red':(d.requested<0?' green':'')):'')+'"><span class="label">Total Demand</span><div class="value">'+money(b.requested)+'</div><div class="sub">'+auditDelta(d.requested,' M€')+'</div></div>';
 h+='<div class="kpi'+(d.allocation?(d.allocation>0?' green':(d.allocation<0?' red':'')):'')+'"><span class="label">Allocation</span><div class="value">'+money(b.allocation)+' → '+money(a.allocation)+'</div><div class="sub">'+auditDelta(d.allocation,' M€')+'</div></div>';
 h+='<div class="kpi"><span class="label">EW / BU Shift</span><div class="value" style="font-size:16px">F&R '+auditDelta(d.ewDelta,' M€')+'</div><div class="sub">BU '+auditDelta(d.buDelta,' M€')+'</div></div>';
 h+='<div class="kpi"><span class="label">Benefit Shifts</span><div class="value">'+d.benefitClassShifts+'</div><div class="sub">Programs reclassified</div></div>';
 var critCount=audit.actions.filter(x=>x.severity==='critical').length,warnCount=audit.actions.filter(x=>x.severity==='warning').length;
 h+='<div class="kpi'+(critCount?' red':'')+'"><span class="label">Actions Required</span><div class="value">'+(critCount+warnCount)+'</div><div class="sub">'+critCount+' critical, '+warnCount+' warning</div></div>';
 h+='</div>';

 // Section 2: Before/After KPI Comparison
 h+='<details class="audit-sub" open><summary>Pre-refresh vs Post-refresh KPIs</summary>';
 h+='<table class="audit-table"><thead><tr><th>Metric</th><th class="num">Before</th><th class="num">After</th><th class="num">Delta</th><th class="num">% Change</th></tr></thead><tbody>';
 var metrics=[['Total Records',b.rowCount,a.rowCount,d.rowCount,null,true],['Requested Demand',b.requested,a.requested,d.requested],['Allocated Demand',b.allocation,a.allocation,d.allocation],['Unfunded Demand',b.unfunded,a.unfunded,d.unfunded],['Funded Count',b.funded,a.funded,a.funded-b.funded,null,true],['EW Allocation',b.ewAllocation,a.ewAllocation,d.ewDelta],['BU Allocation',b.buAllocation,a.buAllocation,d.buDelta],['Hard Benefits',b.benefits.hard,a.benefits.hard,AOP.round(a.benefits.hard-b.benefits.hard)],['Soft Benefits',b.benefits.soft,a.benefits.soft,AOP.round(a.benefits.soft-b.benefits.soft)]];
 for(var i=0;i<b.stages.length;i++)metrics.push([b.stages[i].name+' Demand',b.stages[i].demand,a.stages[i]?.demand||0,d.stages[i]?.demandDelta||0],[b.stages[i].name+' Allocation',b.stages[i].allocation,a.stages[i]?.allocation||0,d.stages[i]?.allocationDelta||0]);
 for(var mi=0;mi<metrics.length;mi++){var m=metrics[mi],isInt=m[5];h+='<tr><td>'+esc(m[0])+'</td><td class="num">'+(isInt?m[1]:dec(m[1]))+'</td><td class="num">'+(isInt?m[2]:dec(m[2]))+'</td><td class="num">'+(isInt?auditDeltaInt(m[3]):auditDelta(m[3]))+'</td><td class="num">'+auditPct(m[1],m[2])+'</td></tr>';}
 h+='</tbody></table></details>';

 // Section 3: ExCo Impact
 var excoKeys=Object.keys(d.exco).sort((x,y)=>{var ax=Math.abs(d.exco[x].requestedDelta)+Math.abs(d.exco[x].fundedDelta),ay=Math.abs(d.exco[y].requestedDelta)+Math.abs(d.exco[y].fundedDelta);return ay-ax;});
 h+='<details class="audit-sub"><summary>ExCo Leader Impact Analysis ('+excoKeys.length+' leaders)</summary>';
 h+='<table class="audit-table"><thead><tr><th>ExCo Leader</th><th>Role</th><th class="num">Req. Before</th><th class="num">Req. After</th><th class="num">Req. Δ</th><th class="num">Fund. Before</th><th class="num">Fund. After</th><th class="num">Fund. Δ</th><th class="num">Hard Ben Δ</th><th class="num">Soft Ben Δ</th><th class="num">Prog. Δ</th></tr></thead><tbody>';
 for(var ei=0;ei<excoKeys.length;ei++){var ek=excoKeys[ei],ed=d.exco[ek],eb=b.exco[ek]||{requested:0,funded:0,hardBen:0,softBen:0,count:0},ea=a.exco[ek]||{requested:0,funded:0,hardBen:0,softBen:0,count:0};var role=AOP.EXCO_HIERARCHY[ek]?AOP.EXCO_HIERARCHY[ek].role:'—';h+='<tr><td><b>'+esc(ek)+'</b></td><td>'+esc(role)+'</td><td class="num">'+dec(eb.requested)+'</td><td class="num">'+dec(ea.requested)+'</td><td class="num">'+auditDelta(ed.requestedDelta)+'</td><td class="num">'+dec(eb.funded)+'</td><td class="num">'+dec(ea.funded)+'</td><td class="num">'+auditDelta(ed.fundedDelta)+'</td><td class="num">'+auditDelta(ed.hardBenDelta)+'</td><td class="num">'+auditDelta(ed.softBenDelta)+'</td><td class="num">'+auditDeltaInt(ed.countDelta)+'</td></tr>';}
 h+='</tbody></table></details>';

 // Section 4: Stage Rebalancing
 h+='<details class="audit-sub"><summary>Funding Stage Rebalancing</summary>';
 h+='<table class="audit-table"><thead><tr><th>Stage</th><th class="num">Demand Before</th><th class="num">Demand After</th><th class="num">Demand Δ</th><th class="num">Alloc. Before</th><th class="num">Alloc. After</th><th class="num">Alloc. Δ</th></tr></thead><tbody>';
 for(var si=0;si<b.stages.length;si++){var sb=b.stages[si],sa=a.stages[si]||{demand:0,allocation:0},sd=d.stages[si]||{demandDelta:0,allocationDelta:0};h+='<tr><td>'+esc(sb.name)+'</td><td class="num">'+dec(sb.demand)+'</td><td class="num">'+dec(sa.demand)+'</td><td class="num">'+auditDelta(sd.demandDelta)+'</td><td class="num">'+dec(sb.allocation)+'</td><td class="num">'+dec(sa.allocation)+'</td><td class="num">'+auditDelta(sd.allocationDelta)+'</td></tr>';}
 h+='</tbody></table></details>';

 // Section 5: Line-Item Changes
 h+='<details class="audit-sub"><summary>Line-Item Changes ('+audit.diff.changed.length+' changed, '+audit.diff.added.length+' added, '+audit.diff.removed.length+' removed, '+audit.diff.unchanged+' unchanged)</summary>';

 if(audit.diff.changed.length){
  h+='<h3 style="margin:12px 0 6px">Changed Programs ('+audit.diff.changed.length+')</h3>';
  h+='<table class="audit-table"><thead><tr><th>ID</th><th>Name</th><th>Org</th><th>ExCo</th><th>Changed Fields</th><th class="num">Score Δ</th><th>Stage Change</th><th>Status Change</th><th class="num">Funded Δ (M€)</th></tr></thead><tbody>';
  for(var ci=0;ci<audit.diff.changed.length;ci++){var c=audit.diff.changed[ci],ic=c.impactChanges;var fieldStr=c.fieldChanges.map(function(f){return '<b>'+esc(f.field)+'</b>: '+esc(String(f.before===null?'—':f.before).substring(0,40))+' → '+esc(String(f.after===null?'—':f.after).substring(0,40));}).join('<br>');var stageChg=ic.stageBefore===ic.stageAfter?'—':'<span class="audit-delta-down">'+esc(ic.stageBefore)+'</span> → <span class="audit-delta-up">'+esc(ic.stageAfter)+'</span>';var statusChg=ic.statusBefore===ic.statusAfter?'—':esc(ic.statusBefore)+' → '+esc(ic.statusAfter);h+='<tr><td><button class="program" data-program="'+esc(c.id)+'">'+esc(c.id)+'</button></td><td>'+esc((c.name||'').substring(0,50))+'</td><td style="font-size:11px">'+esc(c.org)+'</td><td style="font-size:11px">'+esc(c.exco)+'</td><td class="audit-field-changes">'+fieldStr+'</td><td class="num">'+auditDelta(ic.scoreDelta)+'</td><td>'+stageChg+'</td><td>'+statusChg+'</td><td class="num">'+auditDelta(AOP.round(ic.fundedAfter-ic.fundedBefore))+'</td></tr>';}
  h+='</tbody></table>';
 }

 if(audit.diff.added.length){
  h+='<h3 style="margin:12px 0 6px">New Programs ('+audit.diff.added.length+')</h3>';
  h+='<table class="audit-table"><thead><tr><th>ID</th><th>Name</th><th>Org</th><th>ExCo</th><th class="num">Request (M€)</th><th class="num">Benefit (M€)</th><th>Projected Stage</th><th>Projected Status</th></tr></thead><tbody>';
  for(var ai=0;ai<audit.diff.added.length;ai++){var ar=audit.diff.added[ai];h+='<tr><td>'+esc(ar.id)+'</td><td>'+esc((ar.name||'').substring(0,50))+'</td><td style="font-size:11px">'+esc(ar.org)+'</td><td style="font-size:11px">'+esc(ar.exco)+'</td><td class="num">'+dec(ar.cost)+'</td><td class="num">'+dec(ar.benefit)+'</td><td>'+esc(ar.stage)+'</td><td>'+esc(ar.status)+'</td></tr>';}
  h+='</tbody></table>';
 }

 if(audit.diff.removed.length){
  h+='<h3 style="margin:12px 0 6px">Removed Programs ('+audit.diff.removed.length+')</h3>';
  h+='<table class="audit-table"><thead><tr><th>ID</th><th>Name</th><th>Org</th><th>ExCo</th><th class="num">Previous Cost (M€)</th><th>Previous Status</th><th>Had Override?</th></tr></thead><tbody>';
  for(var ri=0;ri<audit.diff.removed.length;ri++){var rr=audit.diff.removed[ri];h+='<tr><td>'+esc(rr.id)+'</td><td>'+esc((rr.name||'').substring(0,50))+'</td><td style="font-size:11px">'+esc(rr.org)+'</td><td style="font-size:11px">'+esc(rr.exco)+'</td><td class="num">'+dec(rr.cost)+'</td><td>'+esc(rr.status)+'</td><td>'+(rr.hadOverride?'<span class="audit-severity audit-warning">YES</span>':'No')+'</td></tr>';}
  h+='</tbody></table>';
 }
 h+='</details>';

 // Section 6: Action Items
 h+='<details class="audit-sub" open><summary>Action Required ('+audit.actions.length+' items)</summary>';
 if(audit.actions.length){
  h+='<table class="audit-table"><thead><tr><th>Severity</th><th>Programs</th><th>Type</th><th>Description</th></tr></thead><tbody>';
  for(var xi=0;xi<audit.actions.length;xi++){var act=audit.actions[xi];h+='<tr><td>'+severityBadge(act.severity)+'</td><td>'+(act.id?'<button class="program" data-program="'+esc(act.id)+'">'+esc(act.id)+'</button>':'—')+'</td><td>'+esc(act.type)+'</td><td>'+esc(act.message)+'</td></tr>';}
  h+='</tbody></table>';
 }else h+='<p style="color:var(--prot);font-weight:600">No action items — refresh is clean.</p>';
 h+='</details>';

 // Toolbar
 h+='<div class="audit-toolbar">';
 h+='<button id="export-audit-xlsx" class="primary">Download Audit Report (Excel)</button>';
 h+='<button id="export-audit-json">Download Audit Report (JSON)</button>';
 h+='<button id="apply-refresh" class="primary">Apply Refresh</button>';
 h+='<button id="cancel-refresh">Cancel</button>';
 h+='</div></details>';
 return h;
}

function buildAuditSheets(audit){
 var sheets=[];
 // Sheet 1: Summary
 var s1=[['AOP 2027 Data Refresh Audit Report'],[''],['Generated',audit.timestamp],['Source Before',audit.sourceVersion.before],['Source After',audit.sourceVersion.after],[''],['Metric','Before','After','Delta','% Change']];
 var metrics=[['Total Records',audit.before.rowCount,audit.after.rowCount,audit.deltas.rowCount],['Requested Demand (M€)',audit.before.requested,audit.after.requested,audit.deltas.requested],['Allocated Demand (M€)',audit.before.allocation,audit.after.allocation,audit.deltas.allocation],['Unfunded Demand (M€)',audit.before.unfunded,audit.after.unfunded,audit.deltas.unfunded],['Funded Count',audit.before.funded,audit.after.funded,audit.after.funded-audit.before.funded],['EW Allocation (M€)',audit.before.ewAllocation,audit.after.ewAllocation,audit.deltas.ewDelta],['BU Allocation (M€)',audit.before.buAllocation,audit.after.buAllocation,audit.deltas.buDelta],['Hard Benefits (M€)',audit.before.benefits.hard,audit.after.benefits.hard,AOP.round(audit.after.benefits.hard-audit.before.benefits.hard)],['Soft Benefits (M€)',audit.before.benefits.soft,audit.after.benefits.soft,AOP.round(audit.after.benefits.soft-audit.before.benefits.soft)]];
 for(var i=0;i<audit.before.stages.length;i++){var sb=audit.before.stages[i],sa=audit.after.stages[i]||{demand:0,allocation:0};metrics.push([sb.name+' Demand',sb.demand,sa.demand,audit.deltas.stages[i]?.demandDelta||0],[sb.name+' Allocation',sb.allocation,sa.allocation,audit.deltas.stages[i]?.allocationDelta||0]);}
 for(var mi=0;mi<metrics.length;mi++){var m=metrics[mi];s1.push([m[0],m[1],m[2],m[3],m[1]?((m[2]-m[1])/Math.abs(m[1])*100).toFixed(1)+'%':'—']);}
 sheets.push({name:'Summary',rows:s1});

 // Sheet 2: ExCo Impact
 var s2=[['ExCo Leader','Role','Req. Before','Req. After','Req. Delta','Fund. Before','Fund. After','Fund. Delta','Hard Ben Delta','Soft Ben Delta','Prog. Delta']];
 var excoKeys=Object.keys(audit.deltas.exco).sort();
 for(var ei=0;ei<excoKeys.length;ei++){var ek=excoKeys[ei],ed=audit.deltas.exco[ek],eb=audit.before.exco[ek]||{requested:0,funded:0},ea=audit.after.exco[ek]||{requested:0,funded:0};var role=AOP.EXCO_HIERARCHY[ek]?AOP.EXCO_HIERARCHY[ek].role:'—';s2.push([ek,role,eb.requested,ea.requested,ed.requestedDelta,eb.funded,ea.funded,ed.fundedDelta,ed.hardBenDelta,ed.softBenDelta,ed.countDelta]);}
 sheets.push({name:'ExCo Impact',rows:s2});

 // Sheet 3: Line Item Changes
 var s3=[['Change Type','ID','Name','Org','ExCo','Changed Fields','Score Delta','Stage Before','Stage After','Status Before','Status After','Funded Before','Funded After']];
 for(var ci=0;ci<audit.diff.changed.length;ci++){var c=audit.diff.changed[ci],ic=c.impactChanges;s3.push(['Changed',c.id,c.name,c.org,c.exco,c.fieldChanges.map(function(f){return f.field+': '+String(f.before===null?'—':f.before).substring(0,80)+' → '+String(f.after===null?'—':f.after).substring(0,80);}).join('; '),ic.scoreDelta,ic.stageBefore,ic.stageAfter,ic.statusBefore,ic.statusAfter,ic.fundedBefore,ic.fundedAfter]);}
 for(var ai=0;ai<audit.diff.added.length;ai++){var ar=audit.diff.added[ai];s3.push(['Added',ar.id,ar.name,ar.org,ar.exco,'',0,'','',ar.stage,ar.status,0,0]);}
 for(var ri=0;ri<audit.diff.removed.length;ri++){var rr=audit.diff.removed[ri];s3.push(['Removed',rr.id,rr.name,rr.org,rr.exco,'',0,rr.stage,'',rr.status,'',rr.cost||0,0]);}
 sheets.push({name:'Line Item Changes',rows:s3});

 // Sheet 4: Action Items
 var s4=[['Severity','Programs ID','Type','Description']];
 for(var xi=0;xi<audit.actions.length;xi++){var act=audit.actions[xi];s4.push([act.severity.toUpperCase(),act.id||'—',act.type,act.message]);}
 sheets.push({name:'Action Items',rows:s4});
 return sheets;
}

function exportAuditExcel(audit){
 var sheets=buildAuditSheets(audit);
 var allRows=[];for(var si=0;si<sheets.length;si++){allRows.push([['— '+sheets[si].name+' —']]);for(var ri=0;ri<sheets[si].rows.length;ri++)allRows.push([sheets[si].rows[ri]]);}
 var flat=[];for(var i=0;i<allRows.length;i++)for(var j=0;j<allRows[i].length;j++)flat.push(allRows[i][j]);
 download('AOP2027-Audit-Report-'+audit.sourceVersion.after+'.xlsx',AOPWorkbook.write([{name:'Audit Report',rows:flat}]),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

function exportAuditJson(audit){
 download('AOP2027-Audit-Report-'+audit.sourceVersion.after+'.json',JSON.stringify(audit,null,2),'application/json');
}

function hideBubble(){const t=document.getElementById('bubble-hover');if(t)t.hidden=true;}
function showBubble(circle,event){const r=result.rows.find(r=>r.id===circle.dataset.bubble);if(!r)return;let t=document.getElementById('bubble-hover');if(!t){t=document.createElement('div');t.id='bubble-hover';t.className='bubble-hover';t.setAttribute('role','tooltip');document.body.appendChild(t);}t.innerHTML='<h3>'+esc(r.name||r.id)+'</h3><div class="hover-source">'+esc(r.id)+' · '+esc(r.org)+' · '+esc(r.sourceSheet)+' row '+r.sourceRow+'</div><div class="hover-grid">'+[['Requested',money(r.cost)],['Prioritised',money(r.final)],['Unfunded',money(r.unfunded)],['Merit score',dec(r.score)],['Benefits ('+esc(r.benefitClassLabel||'—')+')',money(r.benefit)],['Benefit / request',r.ratio===null?'Not supplied':dec(r.ratio)+'x'],['Decision Band',r.decisionBand||'Unassessed'],['Funding status',r.status]].map(([k,val])=>'<div><span>'+k+'</span><b>'+esc(val)+'</b></div>').join('')+'</div><p><b>'+esc(r.stageName)+'</b><br>'+esc(r.reason)+'</p><p class="hover-note">Submitted lifetime benefit claim. Open Programs Name in the table for full source evidence.</p>';t.hidden=false;const box=circle.getBoundingClientRect(),x=event?.clientX??box.right,y=event?.clientY??box.top;const w=t.offsetWidth,h=t.offsetHeight;t.style.left=Math.max(12,Math.min(x+16,innerWidth-w-12))+'px';t.style.top=Math.max(12,Math.min(y+14,innerHeight-h-12))+'px';circle.setAttribute('aria-describedby','bubble-hover');}
document.addEventListener('pointerover',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c,e);});
document.addEventListener('pointermove',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c,e);});
document.addEventListener('pointerout',e=>{if(e.target.closest?.('[data-bubble]'))hideBubble();});
document.addEventListener('focusin',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c);});
document.addEventListener('focusout',e=>{if(e.target.closest?.('[data-bubble]'))hideBubble();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideBubble();});
document.addEventListener('scroll',hideBubble,true);

document.addEventListener('click',async e=>{const excoRow=e.target.closest('[data-exco-toggle]');if(excoRow){const ec=excoRow.dataset.excoToggle,arrow=excoRow.querySelector('.exco-arrow'),orgRows=document.querySelectorAll('[data-exco-parent="'+CSS.escape(ec)+'"]'),open=orgRows[0]&&orgRows[0].style.display!=='none';orgRows.forEach(function(r){r.style.display=open?'none':'';});if(arrow)arrow.textContent=open?'▶':'▼';return;}const b=e.target.closest('button');if(!b)return;try{if(b.dataset.revertExco){const ec=b.dataset.revertExco;const ecIds=result.rows.filter(function(r){return r.stream===tab&&r.exco===ec&&(r.stage===3||r.stage===4)&&r.override?.note==='ExCo trade-off';}).map(function(r){return r.id;});if(ecIds.length)session=AOP.transact(session,'group',{ids:ecIds,choice:'automatic'},'ExCo Revert');if(!session.excoTradeoffs)session.excoTradeoffs={};delete session.excoTradeoffs[ec];render();persist();toast('Reverted trade-off for '+ec+(ecIds.length?' — '+ecIds.length+' Programs'+(ecIds.length>1?'s':'')+' returned to automatic':'')+'.');return;}if(b.dataset.tab){tab=b.dataset.tab;render();window.scrollTo(0,0);}else if(b.dataset.preset)commit('preset',{preset:b.dataset.preset});else if(b.dataset.basis){const si={lfr:0,sustain:2,value:3,itsimp:4}[b.dataset.basis],stg=result.stages[si],bdem=stg.fundableDemand!==undefined?stg.fundableDemand:stg.demand;const s=AOP.switchBasis(session.settings,b.dataset.basis,b.dataset.value,bdem);commit('setting',{settings:s});}else if(b.dataset.program)details(b.dataset.program);else if(b.dataset.action)commit(b.dataset.action);else if(b.dataset.auto)commit('program',{id:b.dataset.auto,choice:'automatic'});else if(b.dataset.resolve)commit('resolve',{id:b.dataset.resolve});else if(b.dataset.discard)commit('resolve',{id:b.dataset.discard,discard:true});else if(b.dataset.collapse){const id=b.dataset.collapse;expanded.has(id)?expanded.delete(id):expanded.add(id);render();}else if(b.dataset.expandAll||b.dataset.closeAll){const scope=b.dataset.expandAll||b.dataset.closeAll;document.querySelectorAll('[data-table-scope="'+scope+'"] [data-collapse]').forEach(x=>b.dataset.expandAll?expanded.add(x.dataset.collapse):expanded.delete(x.dataset.collapse));render();}else if(b.dataset.scenarioView){if(!session.filters.scenario)session.filters.scenario={};session.filters.scenario._view=b.dataset.scenarioView;render();persist();}else if(b.dataset.clearScope){session.filters[b.dataset.clearScope]={};render();persist();}else if(b.dataset.exportScope){const scope=b.dataset.exportScope,rows=scope==='overview'?result.rows:result.rows.filter(r=>r.stream===scope);exportExcel(AOP.filter(rows,session.filters[scope]),scope+'-filtered');}else if(b.dataset.group){const rows=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]);commit('group',{ids:rows.filter(r=>(r.org||'BURF not supplied')===b.dataset.group&&r.cost>0).map(r=>r.id),choice:b.dataset.choice});}else if(b.dataset.applyReview){const id=b.dataset.applyReview,q=k=>document.querySelector('[data-'+k+'="'+CSS.escape(id)+'"]');const tier=q('consequence').value,note=q('review-note').value;if(tier!==''&&!AOP.clean(note))throw Error('A reviewed consequence tier needs a rationale.');commit('review',{id,review:{benefitReviewed:q('review-benefit').checked,condition:q('condition').value,consequence:tier===''?null:Number(tier),note}});}else if(b.dataset.open){const s=await dbget(b.dataset.open);AOP.validateSession(s);session=s;tab='scenario';render();persist();}else switch(b.id){case 'save':await save();break;case 'export-inclusions':exportExcel(result.rows.filter(r=>r.final>0),'inclusions');break;case 'export-full':exportExcel(result.rows,'complete-portfolio');break;case 'export-json':await portable();break;case 'reset-exco-tradeoff':{const revertIds=result.rows.filter(function(r){return r.stream===tab&&(r.stage===3||r.stage===4)&&r.override?.note==='ExCo trade-off';}).map(function(r){return r.id;});if(revertIds.length)session=AOP.transact(session,'group',{ids:revertIds,choice:'automatic'},'ExCo Trade-off Reset');session.excoTradeoffs={};render();persist();toast('All ExCo trade-offs reverted'+(revertIds.length?' — '+revertIds.length+' Programs'+(revertIds.length>1?'s':'')+' returned to automatic':'')+'.');break;}case 'close-modal':$('#modal').close();break;case 'apply-weights':{const s=AOP.clone(session.settings);s.weights=[...document.querySelectorAll('.weight')].map(x=>Number(x.value));commit('setting',{settings:s});break;}case 'apply-exco-tradeoff':{session=AOP.tradeoff(session,tab,session.excoTradeoffScope===tab?session.excoTradeoffs||{}:{});render();persist();toast('ExCo trade-off applied. Total AOP remains '+money(session.settings.budget));break;}case 'new-scenario':{const fresh=AOP.createSession(session.data);fresh.settings.budget=100;AOP.autoLfrPct(fresh.data,fresh.settings);session=fresh;tab='scenario';render();persist();toast('Fresh Optimal Segmentation scenario created at 100M€ AOP. All customisations cleared.');break;}case 'undo':session=AOP.undo(session);render();persist();break;case 'source-json':download('AOP2027-Complete-Workbook-Snapshot.json',JSON.stringify(session.data.workbook),'application/json');break;case 'source-xlsx':download(session.data.sourceFile.split(/[\\/]/).pop(),Uint8Array.from(atob(session.data.workbook.originalBase64),c=>c.charCodeAt(0)));break;case 'cancel-refresh':pending=null;render();break;case 'apply-refresh':await save();session=AOP.refresh(session,pending.data,pending.audit||null);pending=null;render();await persist();toast('New source version applied. Changed prior decisions are held for review.');break;case 'export-audit-xlsx':if(pending&&pending.audit)exportAuditExcel(pending.audit);break;case 'export-audit-json':if(pending&&pending.audit)exportAuditJson(pending.audit);break;}}catch(err){toast(err.message,true);}});
document.addEventListener('input',e=>{const x=e.target;if(x.type==='range'&&(x.dataset.lever||x.id==='carry')){const s=AOP.clone(session.settings);if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else if(x.id==='carry'){s.carry=Number(x.value);}commit('setting',{settings:s});}});
document.addEventListener('change',async e=>{const x=e.target;try{if(x.dataset.lever||['budget','carry','carry-num','merit','tolerance'].includes(x.id)){if(x.value==='')throw Error('Enter a numeric setting.');const s=AOP.clone(session.settings);if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else if(x.id==='carry-num'){s.carry=Number(x.value);}else s[x.id]=Number(x.value);commit('setting',{settings:s});}else if(x.dataset.groupCheck){const rows=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]);commit('group',{ids:rows.filter(r=>(r.org||'BURF not supplied')===x.dataset.groupCheck&&r.cost>0).map(r=>r.id),choice:x.checked?'include':'exclude'});}else if(x.dataset.include)commit('program',{id:x.dataset.include,choice:x.checked?'include':'exclude'});else if(x.dataset.amount){if(x.value==='')throw Error('Enter a prioritised amount.');commit('program',{id:x.dataset.amount,choice:'include',amount:Number(x.value)});}else if(x.dataset.note){const r=result.rows.find(r=>r.id===x.dataset.note);commit('program',{id:r.id,choice:r.final>0?'include':'exclude',amount:r.final,note:x.value});}else if(x.dataset.filter){const k=x.dataset.filter,scope=x.dataset.scope,f=session.filters[scope]||(session.filters[scope]={}),values=new Set(f[k]||[]);x.checked?values.add(x.value):values.delete(x.value);f[k]=[...values];render();persist();}else if(x.dataset.searchScope){const scope=x.dataset.searchScope;session.filters[scope].search=x.value;render();persist();}else if(x.dataset.scenarioToggle){if(!session.filters.scenario)session.filters.scenario={};session.filters.scenario._view=x.checked?'unfunded':'prioritized';render();persist();}else if(x.dataset.itsimpToggle){const s=AOP.clone(session.settings);s.itsimpMode=x.checked;if(x.checked&&(!s.itsimp))s.itsimp={basis:'bucket',pct:0};commit('setting',{settings:s});}else if(x.dataset.inclusionCheck){commit('program',{id:x.dataset.inclusionCheck,choice:x.checked?'include':'exclude'});}else if(x.dataset.inclusionAmount){if(x.value==='')throw Error('Enter a prioritised amount.');commit('program',{id:x.dataset.inclusionAmount,choice:'include',amount:Number(x.value)});}else if(x.hasAttribute('data-inclusion-select-all')){const scope='inclusion',pf=session.filters[scope]||{},rows=AOP.filter(result.rows,pf).filter(function(r){return r.cost>0;});if(rows.length)commit('group',{ids:rows.map(function(r){return r.id;}),choice:x.checked?'include':'exclude'});}else if(x.hasAttribute('data-inclusion-sort')){if(!session.filters.inclusion)session.filters.inclusion={};session.filters.inclusion._sort=x.value;render();persist();}else if(x.dataset.excoBudget){if(session.excoTradeoffScope!==tab){session.excoTradeoffs={};session.excoTradeoffScope=tab;}if(!session.excoTradeoffs)session.excoTradeoffs={};const ec=x.dataset.excoBudget;if(x.value==='')delete session.excoTradeoffs[ec];else session.excoTradeoffs[ec]=Number(x.value);render();const inp=document.querySelector('[data-exco-budget="'+CSS.escape(ec)+'"]');if(inp)inp.focus();}else if(x.id==='chart-colour'){session.chartColour=x.value;render();persist();}else if(x.id==='chart-axis-toggle'){session.chartAxis=x.checked?'benefits':'requested';render();persist();}else if(x.id==='chart-axis'){session.chartAxis=x.value;render();persist();}else if(x.id==='import-json'&&x.files[0]){const env=JSON.parse(await x.files[0].text());if(env.format!=='AOP2027 portable scenario'||await digest(env.payload)!==env.sha256)throw Error('Scenario checksum does not match.');const s=JSON.parse(env.payload);AOP.validateSession(s);session=s;render();await persist();toast('Portable scenario restored.');}else if(x.id==='refresh-file'&&x.files[0]){toast('Reading and validating the complete workbook…');const file=x.files[0];const data=AOP.normalize(await AOPWorkbook.read(new Uint8Array(await file.arrayBuffer()),file.name));const diff=AOP.refreshPreview(session,data);toast('Running full audit analysis…');const audit=AOP.auditRefresh(session,data);pending={data,diff,audit};render();$('#refresh-preview').scrollIntoView({block:'center'});toast('Audit complete. Review the report below before applying.');}}catch(err){toast(err.message,true);if(x.type==='number')render();}});
new MutationObserver(()=>{if(pending){const d=document.querySelector('#refresh-preview')?.closest('details.section-panel');if(d)d.open=true;const ap=document.querySelector('.audit-panel');if(ap&&!ap.open)ap.open=true;}}).observe($('#main'),{childList:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(e.target.dataset.amount||e.target.dataset.inclusionAmount)){e.target.value=dec(Number(e.target.dataset.original));e.target.blur();return;}if(e.key==='Enter'&&e.target.matches('input:not([type=file])'))e.target.blur();});
render();setTimeout(function(){if(window.renderDemandOverview&&tab==='demand')render();},0);const request=indexedDB.open('Philips-AOP2027-v5.7.0-'+session.data.sourceHash.slice(0,12),1);request.onupgradeneeded=()=>request.result.createObjectStore('scenarios');request.onsuccess=async()=>{db=request.result;try{saved=await dbget('index')||[];const draft=await dbget('draft');if(draft){AOP.validateSession(draft);session=draft;toast('Recovered the last local working scenario.');}render();}catch(e){toast('Recovery unavailable: '+e.message+'. Embedded demand remains available.',true);}};request.onerror=()=>toast('Browser storage unavailable. Use portable scenario export to keep changes.',true);
})();


// =========================================================================
// v4.3 ONE PORTFOLIO EXTENSIONS
// =========================================================================
(function(){
'use strict';
const OPS=JSON.parse(document.getElementById('ops-data').textContent);
window.OPS_DATA=OPS;

// ---- Correct sub-org level TCO mapping ----
// Maps program organisation names to their TCO sub-org entry with exact costs
const ORG_OPS_MAP={"Precision Diagnosis - Magnetic Resonance (MR)":{"name":"MR","total":36.21930515537484,"own":20.839323897772648,"reg":9.16984648210442,"func":6.210134775497767},"Precision Diagnosis - Computed Tomography (CT)":{"name":"CT/AMI","total":24.482100728062466,"own":14.664922549311708,"reg":5.753579267679216,"func":4.063598911071541},"Precision Diagnosis - Ultrasound (PDU)":{"name":"ULS","total":36.562382004946926,"own":24.748602489679605,"reg":5.778055508703142,"func":6.035724006564182},"Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)":{"name":"DXR","total":11.152631035831284,"own":7.073743973946068,"reg":2.3769495481421568,"func":1.701937513743059},"Image Guided Therapy - Devices (IGT-D)":{"name":"IGT-D","total":30.05671986514219,"own":23.459143690572372,"reg":1.2683808970638215,"func":5.329195277505996},"Image Guided Therapy - Systems (IGT-S)":{"name":"IGT-S","total":51.55286741113415,"own":31.628036639449615,"reg":10.189865300406016,"func":9.734965471278521},"Monitoring - HPM (MCH)":{"name":"HPM","total":64.93061425987864,"own":40.44498243505849,"reg":10.616823704133278,"func":13.868808120686857},"Sleep & Respiratory Care (SRC)":{"name":"Sleep & Respitory Care","total":34.112415572661035,"own":23.735447245589906,"reg":0.12586632979132692,"func":10.251101997279807},"Ambulatory Monitoring and Diagnostics (AM&D)":{"name":"AMD","total":8.32083906905751,"own":6.8002786698535695,"reg":0.31394087609422916,"func":1.206619523109711},"Enterprise Informatics (EI)":{"name":"EI","total":35.38342943371984,"own":28.977638726481096,"reg":1.5049189429364496,"func":4.900871764302296},"Personal Health (PH)":{"name":"Personal Health","total":79.12782456118127,"own":65.02352805812869,"reg":0.28730993353606127,"func":13.816986569516521},"Intellectual Property & Standards (IP&S)":{"name":"Int. Property & Standards","total":4.589993340176318,"own":4.199814562756039,"reg":0,"func":0.3901787774202791},"Innovation and Design Business Operations":{"name":"Innovation & Design","total":9.724653626335083,"own":8.298496104062812,"reg":0,"func":1.426157522272271}};
// Function/Region/ISC orgs have 0 direct TCO (they are cost allocators, not recipients)
const ZERO_OPS={total:0,own:0,reg:0,func:0};
function getOps(org){return ORG_OPS_MAP[org]||ZERO_OPS;}

// ---- ExCo-level Ops Cost — derived from ORG_OPS_MAP so L1 = sum(L2) ----
const EXCO_OPS_COST={"Deeptha Khanna":79.12782456118127,"Shez Partovi":45.10808306005492,"Julia Strandberg":111.98123898495452,"Jie Xue":142.5693426876789,"Bert van Meurs":86.93798040446626,"Marnix van Ginneken":4.589993340176318};
window.EXCO_OPS_COST=EXCO_OPS_COST;

// ---- CSS ----
const st=document.createElement('style');
st.textContent=`
.demand-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px;align-items:stretch}
.demand-card{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:18px 20px;display:flex;flex-direction:column}
.demand-card h3{color:var(--dk);margin:0 0 12px 0;font-size:14px;font-weight:700;padding-bottom:0}
.ds{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--mist);font-size:12px;gap:12px;line-height:1.4}
.ds:last-child{border-bottom:none}
.ds>span:first-child{color:var(--text2);flex-shrink:0}
.ds .v{font-weight:700;color:var(--dk);text-align:right;font-size:12px;white-space:nowrap}
.it{table-layout:fixed;width:100%}
.it th{background:var(--dk);color:white;font-size:11px;padding:10px 14px;white-space:nowrap;letter-spacing:0.3px}
.it td{padding:10px 14px;font-size:12px;border-bottom:1px solid var(--mist);line-height:1.4}
.it tr:nth-child(even){background:#f6f9fd}
.it tbody tr:hover{background:var(--lt)}
.it th:first-child,.it td:first-child{width:35%;text-align:left}
.it th.num,.it td.num{text-align:right;width:16%;font-variant-numeric:tabular-nums}
.dq-tbd{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:var(--discbg);color:#715800}
.ops-grp{background:var(--mist)!important;font-weight:600;cursor:pointer}
.ops-grp td:first-child::before{content:'\\25B6 ';font-size:11px;color:var(--text3)}
.ops-grp.open td:first-child::before{content:'\\25BC '}
.ops-ch{display:none}
.ops-ch.vis{display:table-row}
.ops-bm{display:flex;height:18px;border-radius:3px;overflow:hidden;min-width:80px}
.ops-bm div{min-width:1px}
.ao th{background:var(--blue)}
.ao td.tc{background:#f0f5ff;font-weight:700}
.ops-sum{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:14px 0;padding:14px 18px;background:#f8fafc;border-radius:6px;border:1px solid var(--border)}
.ops-sum .item{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
.ops-sum .item b{color:var(--dk);font-variant-numeric:tabular-nums}
.v43-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.v43-filter{position:relative;min-width:120px;flex:0 1 auto}
.v43-filter>summary{list-style:none;cursor:pointer;border:1px solid var(--border);background:white;border-radius:4px;padding:6px 10px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:11px;color:var(--dk);font-weight:600}
.v43-filter[open]>summary{border-color:var(--blue)}
.v43-filter-opts{position:absolute;z-index:8;background:white;box-shadow:0 4px 12px #00126e20;border:1px solid var(--border);padding:8px;max-height:250px;overflow-y:auto;min-width:230px}
.v43-filter-opts label{display:flex;gap:6px;padding:3px;font-size:11px}
.v43-sort{font-size:11px;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--dk);min-width:140px}
`;
document.head.appendChild(st);

function fmt(v,d){if(v==null||!Number.isFinite(Number(v)))return '—';const p=d===undefined?1:d,m=Math.pow(10,p);return (Math.sign(v)*Math.ceil(Math.abs(v)*m-1e-9)/m).toFixed(p);}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

// ---- IT Dept code to Platform mapping ----
// Canonical platform names used consistently across program demand and operations
var DEPT_PLATFORM={
  'AN3':'Security, Risk & Compliance','AN4':'Infrastructure Services','AN5':'Infrastructure Services',
  'AN6':'Unallocated','AN7':'Infrastructure Services','AN8':'Infrastructure Services',
  'AX9':'Services & Solutions IT','B69+':'Unallocated','B72':'Unallocated',
  'BL8':'Commercial IT','BL9':'Integrated Supply Chain & Finance',
  'BM0':'Group Functions & Hyperautomation','BM1':'Innovation and Digital',
  'I91':'Enterprise Architecture, Data & Integration',
  'AI Services':'Unallocated','AI Svcs':'Unallocated','Transfers':'Unallocated'
};
// Normalize any platform name variant to the canonical form
function normalizePlatform(p){
  if(!p)return '';
  var m={'it-commercial it':'Commercial IT','commercial it':'Commercial IT',
    'it-ent.architecture,data&integration':'Enterprise Architecture, Data & Integration',
    'it-ent. architecture,data&integration':'Enterprise Architecture, Data & Integration',
    'enterprise architecture, data & integration':'Enterprise Architecture, Data & Integration',
    'ent. architecture, data & integration':'Enterprise Architecture, Data & Integration',
    'ent.architecture,data&integration':'Enterprise Architecture, Data & Integration',
    'it-group functions and hyperautomation':'Group Functions & Hyperautomation',
    'group functions and hyperautomation':'Group Functions & Hyperautomation',
    'group functions & hyperautomation it':'Group Functions & Hyperautomation',
    'group functions & hyperautomation':'Group Functions & Hyperautomation',
    'it-infrastructure services':'Infrastructure Services',
    'infrastructure services – projects':'Infrastructure Services',
    'infrastructure services - projects':'Infrastructure Services',
    'infrastructure services':'Infrastructure Services',
    'it-innovation and digital':'Innovation and Digital',
    'innovation and digital it':'Innovation and Digital',
    'innovation and digital':'Innovation and Digital',
    'it-integrated supply chain and finance':'Integrated Supply Chain & Finance',
    'integrated supply chain and finance':'Integrated Supply Chain & Finance',
    'integrated supply chain & finance':'Integrated Supply Chain & Finance',
    'it-security,risk&compliance':'Security, Risk & Compliance',
    'it-security, risk & compliance':'Security, Risk & Compliance',
    'security, risk & compliance':'Security, Risk & Compliance',
    'security,risk&compliance':'Security, Risk & Compliance',
    'it-services&solutions it':'Services & Solutions IT',
    'services & solutions it':'Services & Solutions IT',
    'services&solutions it':'Services & Solutions IT',
    'greater china it':'Greater China IT',
    'mergers, acquisitions & divestments':'Mergers, Acquisitions & Divestments',
    'portfolio it':'Portfolio IT',
    'unallocated':'Unallocated','not supplied':'Not supplied'};
  return m[p.toLowerCase().trim()]||p;
}
window.normalizePlatform=normalizePlatform;
var SVC_PLATFORM_MAP={"SE002096":"IT-Infrastructure Services","SE002097":"IT-Infrastructure Services","SE002098":"IT-Infrastructure Services","SE002099":"IT-Infrastructure Services","SE002100":"IT-Infrastructure Services","SE002247":"IT-Infrastructure Services","SE002111":"IT-Infrastructure Services","SE002113":"IT-Infrastructure Services","SE002112":"IT-Infrastructure Services","SE002114":"IT-Infrastructure Services","SE002102":"IT-Infrastructure Services","SE002103":"IT-Infrastructure Services","SE002104":"IT-Infrastructure Services","SE002107":"IT-Infrastructure Services","SE002101":"IT-Infrastructure Services","SE002106":"IT-Infrastructure Services","SE002108":null,"SE002109":null,"SE002088":"IT-Infrastructure Services","SE002089":"IT-Infrastructure Services","SE002090":"IT-Infrastructure Services","SE002091":"IT-Infrastructure Services","SE002092":"IT-Infrastructure Services","SE002094":"IT-Infrastructure Services","SE002095":"IT-Infrastructure Services","SE002145":"IT-Commercial IT","SE002146":"IT-Commercial IT","SE002147":"IT-Commercial IT","SE002148":"IT-Commercial IT","SE002149":"IT-Commercial IT","SE002150":"IT-Commercial IT","SE002151":"IT-Commercial IT","SE002152":"IT-Commercial IT","SE002153":"IT-Commercial IT","SE002154":"IT-Commercial IT","SE002155":"IT-Commercial IT","SE002156":"IT-Commercial IT","SE002157":"IT-Commercial IT","SE002158":"IT-Commercial IT","SE002159":"IT-Commercial IT","SE002160":"IT-Commercial IT","SE002161":"IT-Commercial IT","SE002162":"IT-Commercial IT","SE002231":"IT-Ent.Architecture,Data&Integration","SE002232":"IT-Ent.Architecture,Data&Integration","SE002240":"IT-Ent.Architecture,Data&Integration","SE002241":"IT-Ent.Architecture,Data&Integration","SE002242":"IT-Ent.Architecture,Data&Integration","SE002235":"IT-Ent.Architecture,Data&Integration","SE002243":"IT-Ent.Architecture,Data&Integration","SE002239":"IT-Ent.Architecture,Data&Integration","SE002233":"IT-Ent.Architecture,Data&Integration","SE002236":"IT-Ent.Architecture,Data&Integration","SE002238":"IT-Ent.Architecture,Data&Integration","SE002234":"IT-Ent.Architecture,Data&Integration","SE002317":"IT-Ent.Architecture,Data&Integration","SE002201":"IT-Group Functions and Hyperautomation","SE002182":"IT-Group Functions and Hyperautomation","SE002184":"IT-Group Functions and Hyperautomation","SE002188":"IT-Group Functions and Hyperautomation","SE002189":"IT-Group Functions and Hyperautomation","SE002190":"IT-Group Functions and Hyperautomation","SE002191":"IT-Group Functions and Hyperautomation","SE002194":"IT-Group Functions and Hyperautomation","SE002197":"IT-Group Functions and Hyperautomation","SE002198":"IT-Group Functions and Hyperautomation","SE002199":"IT-Group Functions and Hyperautomation","SE002200":"IT-Group Functions and Hyperautomation","SE002206":"IT-Group Functions and Hyperautomation","SE002208":"IT-Group Functions and Hyperautomation","SE002210":"IT-Group Functions and Hyperautomation","SE002181":"IT-Group Functions and Hyperautomation","SE002183":"IT-Group Functions and Hyperautomation","SE002185":"IT-Group Functions and Hyperautomation","SE002186":"IT-Group Functions and Hyperautomation","SE002193":"IT-Group Functions and Hyperautomation","SE002196":"IT-Group Functions and Hyperautomation","SE002202":"IT-Group Functions and Hyperautomation","SE002205":"IT-Group Functions and Hyperautomation","SE002207":"IT-Group Functions and Hyperautomation","SE002249":"IT-Group Functions and Hyperautomation","1007721":"IT-Group Functions and Hyperautomation","1007709":"IT-Group Functions and Hyperautomation","1007726":"IT-Group Functions and Hyperautomation","1007712":"IT-Group Functions and Hyperautomation","1007720":"IT-Group Functions and Hyperautomation","1007704":"IT-Group Functions and Hyperautomation","SE002119":"IT-Innovation and Digital","SE002129":"IT-Innovation and Digital","SE002131":"IT-Innovation and Digital","SE002130":"IT-Innovation and Digital","SE002132":"IT-Innovation and Digital","SE002133":"IT-Innovation and Digital","SE002134":"IT-Innovation and Digital","SE002137":"IT-Innovation and Digital","SE002138":"IT-Innovation and Digital","SE002139":"IT-Innovation and Digital","SE002141":"IT-Innovation and Digital","SE002142":"IT-Innovation and Digital","SE002115":"IT-Innovation and Digital","SE002116":"IT-Innovation and Digital","SE002117":"IT-Innovation and Digital","SE002118":"IT-Innovation and Digital","SE002120":"IT-Innovation and Digital","SE002121":"IT-Innovation and Digital","SE002122":"IT-Innovation and Digital","SE002123":"IT-Innovation and Digital","SE002124":"IT-Innovation and Digital","SE002126":"IT-Innovation and Digital","SE002127":"IT-Innovation and Digital","SE002128":"IT-Innovation and Digital","SE002135":"IT-Innovation and Digital","SE002136":"IT-Innovation and Digital","SE002140":"IT-Innovation and Digital","SE002143":"IT-Innovation and Digital","SE002144":"IT-Innovation and Digital","SE001166":"IT-Services&Solutions IT","SE002216":"IT-Services&Solutions IT","SE002219":"IT-Services&Solutions IT","SE002220":"IT-Services&Solutions IT","SE002224":"IT-Services&Solutions IT","SE002225":"IT-Services&Solutions IT","SE002226":"IT-Services&Solutions IT","SE002227":"IT-Services&Solutions IT","SE002228":"IT-Services&Solutions IT","SE002229":"IT-Services&Solutions IT","SE002214":"IT-Services&Solutions IT","SE002215":"IT-Services&Solutions IT","SE002217":"IT-Services&Solutions IT","SE002218":"IT-Services&Solutions IT","SE002222":"IT-Services&Solutions IT","SE002223":"IT-Services&Solutions IT","1008037":"IT-Services&Solutions IT","1008036":"IT-Services&Solutions IT","1008035":"IT-Services&Solutions IT","1008033":"IT-Services&Solutions IT","1007997":"IT-Services&Solutions IT","SE002163":"IT-Integrated Supply Chain and Finance","SE002165":"IT-Integrated Supply Chain and Finance","SE002166":"IT-Integrated Supply Chain and Finance","SE002167":"IT-Integrated Supply Chain and Finance","SE002168":"IT-Integrated Supply Chain and Finance","SE002169":"IT-Integrated Supply Chain and Finance","SE002173":"IT-Integrated Supply Chain and Finance","SE002174":"IT-Integrated Supply Chain and Finance","SE002175":"IT-Integrated Supply Chain and Finance","SE002176":"IT-Integrated Supply Chain and Finance","SE002178":"IT-Integrated Supply Chain and Finance","SE002179":"IT-Integrated Supply Chain and Finance","SE002180":"IT-Integrated Supply Chain and Finance","SE002164":"IT-Integrated Supply Chain and Finance","SE002170":"IT-Integrated Supply Chain and Finance","SE002171":"IT-Integrated Supply Chain and Finance","SE002172":"IT-Integrated Supply Chain and Finance","SE002177":"IT-Integrated Supply Chain and Finance","SE002245":"IT-Integrated Supply Chain and Finance","1007803":"IT-Integrated Supply Chain and Finance","SE002125":"IT-Innovation and Digital","1007613":null,"SE002221":"IT-Services&Solutions IT","1007849":"IT-Ent.Architecture,Data&Integration","1007850":"IT-Ent.Architecture,Data&Integration","1007863":"IT-Security,Risk&Compliance","1007864":null,"1007865":null,"1008056":null,"1008055":null,"1008052":null,"1008051":null,"1008050":null,"1008049":null,"1008048":null,"1007999":null,"B69NEW2":null};
function deptToPlatform(deptCode){
  if(!deptCode)return '';
  var codes=String(deptCode).split('/');
  for(var i=0;i<codes.length;i++){var p=DEPT_PLATFORM[codes[i].trim()];if(p)return normalizePlatform(p);}
  return 'Unallocated';
}
function svcToPlatform(serviceId){
  if(!serviceId)return '';
  var p=SVC_PLATFORM_MAP[String(serviceId).trim()];
  return p?normalizePlatform(p):'';
}

// ---- v3.5-style checkbox filter builder (org-level rows) ----
function buildFilterBar(tableId, orgRows, fields, sortOpts){
  // orgRows = [{org:'...',platform:'...',...}], fields = [{key,label}]
  var h='<div class="v43-filter-row" id="fb-'+tableId+'" data-tbl="'+tableId+'">';
  fields.forEach(function(f){
    var vals={};
    orgRows.forEach(function(r){var v=r[f.key]||'';if(v)vals[v]=(vals[v]||0)+1;});
    var sorted=Object.keys(vals).sort();
    h+='<details class="v43-filter" data-fkey="'+f.key+'" data-tbl="'+tableId+'"><summary>'+esc(f.label)+': All</summary>';
    h+='<div class="v43-filter-opts">';
    sorted.forEach(function(v){
      h+='<label data-fopt="'+esc(v)+'"><input type="checkbox" value="'+esc(v)+'" data-ftbl="'+tableId+'" data-fkey="'+f.key+'"> '+esc(v)+' <span class="fcnt">('+vals[v]+')</span></label>';
    });
    h+='</div></details>';
  });
  // Sort dropdown
  var so=sortOpts||[{v:'demand-desc',l:'Programs Demand (High\u2192Low)'},{v:'demand-asc',l:'Programs Demand (Low\u2192High)'},{v:'ops-desc',l:'Operations Cost (High\u2192Low)'},{v:'ops-asc',l:'Operations Cost (Low\u2192High)'},{v:'total-desc',l:'Total IT (High\u2192Low)'},{v:'total-asc',l:'Total IT (Low\u2192High)'}];
  h+='<select class="v43-sort" data-sort-tbl="'+tableId+'" onchange="window._v43sort(\''+tableId+'\',this.value)"><option value="">Sort by...</option>';
  so.forEach(function(o){h+='<option value="'+o.v+'">'+esc(o.l)+'</option>';});
  h+='</select>';
  h+='<button style="font-size:11px;padding:5px 10px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--text2);cursor:pointer" onclick="window._v43clearFilters(\''+tableId+'\')">Clear All</button>';
  h+='</div>';
  return h;
}

// Programs-level sort dropdown (for program detail tables)
function buildProgramSortDropdown(tableId){
  var h='<select class="v43-sort" data-sort-tbl="'+tableId+'" onchange="window._v43sort(\''+tableId+'\',this.value)">';
  h+='<option value="">Sort by...</option>';
  h+='<option value="benefit-desc">Benefit (High\u2192Low)</option>';
  h+='<option value="benefit-asc">Benefit (Low\u2192High)</option>';
  h+='<option value="merit-desc">Merit Score (High\u2192Low)</option>';
  h+='<option value="merit-asc">Merit Score (Low\u2192High)</option>';
  h+='<option value="invest-desc">Investment Requested (High\u2192Low)</option>';
  h+='<option value="invest-asc">Investment Requested (Low\u2192High)</option>';
  h+='</select>';
  return h;
}

// ---- Sort handler ----
window._v43sort=function(tid,val){
  if(!val)return;
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var rows=Array.from(tbody.querySelectorAll('tr:not(.ops-grp):not(.ops-ch):not(.group):not(.burf-summary):not(.summary-total)'));
  var parts=val.split('-');
  var key=parts[0],dir=parts[1]==='asc'?1:-1;

  // Find column index by keyword in header
  var ths=Array.from(tbl.querySelectorAll('thead th'));
  var idx=-1;
  var keyMap={demand:'program demand',ops:'operations',total:'total it',benefit:'benefit',merit:'score',invest:'requested',funded:'program funded',buled:'bu led',ew:'ew charges'};
  var searchTerm=(keyMap[key]||key).toLowerCase();
  for(var i=0;i<ths.length;i++){
    if(ths[i].textContent.toLowerCase().includes(searchTerm)){idx=i;break;}
  }
  if(idx<0)return;

  rows.sort(function(a,b){
    var va=a.children[idx]?a.children[idx].textContent.trim().replace(/[€M,\s]/g,''):'';
    var vb=b.children[idx]?b.children[idx].textContent.trim().replace(/[€M,\s]/g,''):'';
    var na=parseFloat(va),nb=parseFloat(vb);
    if(isNaN(na))na=dir>0?Infinity:-Infinity;
    if(isNaN(nb))nb=dir>0?Infinity:-Infinity;
    return (na-nb)*dir;
  });
  rows.forEach(function(r){tbody.appendChild(r);});
};

// ---- Filter handler: cascading counts + dynamic totals ----
function applyFilters(tid){
  var tbl=document.getElementById(tid);
  if(!tbl)return;
  var tbody=tbl.querySelector('tbody')||tbl;
  var dataRows=Array.from(tbody.querySelectorAll('tr[data-org]'));
  var totalRow=tbody.querySelector('tr[data-total]');
  // Collect active filters
  var filters={};
  document.querySelectorAll('input[data-ftbl="'+tid+'"]:checked').forEach(function(c){
    if(!filters[c.dataset.fkey])filters[c.dataset.fkey]=[];
    filters[c.dataset.fkey].push(c.value);
  });
  // Show/hide rows
  var visCount=0,visDemand=0,visOps=0,visTotal=0;
  dataRows.forEach(function(r){
    var show=true;
    Object.keys(filters).forEach(function(fk){
      if(!filters[fk].length)return;
      var val=r.dataset[fk]||'';
      if(!filters[fk].some(function(v){return val.includes(v);}))show=false;
    });
    r.style.display=show?'':'none';
    if(show){
      visCount++;
      var cells=r.querySelectorAll('td');
      visDemand+=parseFloat((cells[2]||{}).textContent)||0;
      var opsText=(cells[3]||{}).textContent||'';
      visOps+=opsText==='—'?0:(parseFloat(opsText)||0);
      visTotal+=parseFloat((cells[4]||{}).textContent)||0;
    }
  });
  // Update total row with "X of Y" filter context
  if(totalRow){
    var tc=totalRow.querySelectorAll('td');
    var hasFilter=Object.keys(filters).length>0;
    if(tid==='tblDemandSplit'){
      [1,2,3,4].forEach(function(i){if(tc[i]&&!tc[i].dataset.orig)tc[i].dataset.orig=tc[i].textContent;});
      if(hasFilter){
        tc[1].textContent=visCount+' of '+tc[1].dataset.orig;
        tc[2].textContent=visDemand.toFixed(1)+' of '+tc[2].dataset.orig;
        tc[3].textContent=(visOps>0?visOps.toFixed(1):'0.0')+' of '+tc[3].dataset.orig;
        tc[4].textContent=visTotal.toFixed(1)+' of '+tc[4].dataset.orig;
      } else {
        [1,2,3,4].forEach(function(i){if(tc[i]&&tc[i].dataset.orig)tc[i].textContent=tc[i].dataset.orig;});
      }
    } else if(tid==='tcoTbl'){
      var visTco=0;
      dataRows.forEach(function(r){if(r.style.display!=='none'&&r.classList.contains('burf-summary')){var c=r.querySelectorAll('td');visTco+=Number(r.dataset.exactTco)||0;}});
      if(tc[1]&&!tc[1].dataset.orig)tc[1].dataset.orig=tc[1].textContent;
      if(hasFilter){
        tc[1].innerHTML='<strong>'+visTco.toFixed(1)+'</strong> <small>of '+tc[1].dataset.orig+'</small>';
      } else {
        tc[1].innerHTML='<strong>'+(tc[1].dataset.orig||'469.7')+'</strong>';
      }
    } else if(tid==='svcCatalog'){
      var vis27=0,vis26=0;
      dataRows.forEach(function(r){if(r.style.display!=='none'){var c=r.querySelectorAll('td');vis27+=Number(r.dataset.cost27)||0;vis26+=Number(r.dataset.cost26)||0;}});
      [3,4].forEach(function(i){if(tc[i]&&!tc[i].dataset.orig)tc[i].dataset.orig=tc[i].textContent;});
      if(hasFilter){
        tc[3].textContent=vis27.toFixed(1)+' of '+tc[3].dataset.orig;
        tc[4].textContent=vis26.toFixed(1)+' of '+tc[4].dataset.orig;
      } else {
        [3,4].forEach(function(i){if(tc[i]&&tc[i].dataset.orig)tc[i].textContent=tc[i].dataset.orig;});
      }
    } else if(tid==='allocTbl'){
      var visBU=0,visEW=0,visAllocOps=0,visAllocTot=0;
      dataRows.forEach(function(r){if(r.style.display!=='none'){
        visBU+=parseFloat(r.dataset.buled)||0;
        visEW+=parseFloat(r.dataset.ew)||0;
        visAllocOps+=parseFloat(r.dataset.ops)||0;
        visAllocTot+=parseFloat(r.dataset.total)||0;
      }});
      var colBU=totalRow?totalRow.querySelector('[data-col="buled"]'):null;
      var colEW=totalRow?totalRow.querySelector('[data-col="ew"]'):null;
      var colAllocOps=totalRow?totalRow.querySelector('[data-col="ops"]'):null;
      var colAllocTot=totalRow?totalRow.querySelector('[data-col="total"]'):null;
      [colBU,colEW,colAllocOps,colAllocTot].forEach(function(c){if(c&&!c.dataset.orig)c.dataset.orig=c.textContent;});
      if(hasFilter){
        if(colBU)colBU.textContent=visBU.toFixed(1)+' of '+(colBU.dataset.orig||'');
        if(colEW)colEW.textContent=visEW.toFixed(1)+' of '+(colEW.dataset.orig||'');
        if(colAllocOps)colAllocOps.textContent=visAllocOps.toFixed(1)+' of '+(colAllocOps.dataset.orig||'');
        if(colAllocTot)colAllocTot.textContent=visAllocTot.toFixed(1)+' of '+(colAllocTot.dataset.orig||'');
      } else {
        [colBU,colEW,colAllocOps,colAllocTot].forEach(function(c){if(c&&c.dataset.orig)c.textContent=c.dataset.orig;});
      }
    } else {
      if(tc[1]){if(!tc[1].dataset.orig)tc[1].dataset.orig=tc[1].textContent;tc[1].textContent=hasFilter?visCount+' of '+tc[1].dataset.orig:tc[1].dataset.orig;}
      if(tc[2]){if(!tc[2].dataset.orig)tc[2].dataset.orig=tc[2].textContent;tc[2].textContent=hasFilter?visDemand.toFixed(1)+' of '+tc[2].dataset.orig:tc[2].dataset.orig;}
    }
  }
  // Update cascading counts on OTHER filters
  var filterDivs=document.querySelectorAll('.v43-filter[data-tbl="'+tid+'"]');
  filterDivs.forEach(function(fd){
    var fk=fd.dataset.fkey;
    var otherFilters={};
    Object.keys(filters).forEach(function(k){if(k!==fk)otherFilters[k]=filters[k];});
    // Count visible per option considering other filters only
    fd.querySelectorAll('label[data-fopt]').forEach(function(lbl){
      var optVal=lbl.dataset.fopt;
      var cnt=0;
      dataRows.forEach(function(r){
        var matchOther=true;
        Object.keys(otherFilters).forEach(function(ok){
          if(!otherFilters[ok].length)return;
          if(!otherFilters[ok].some(function(v){return (r.dataset[ok]||'').includes(v);}))matchOther=false;
        });
        if(matchOther&&(r.dataset[fk]||'').includes(optVal))cnt++;
      });
      var cntSpan=lbl.querySelector('.fcnt');
      if(cntSpan)cntSpan.textContent='('+cnt+')';
    });
    // Update summary
    var checks=fd.querySelectorAll('input[data-ftbl="'+tid+'"]:checked');
    var sum=fd.querySelector('summary');
    if(sum){
      var label=sum.textContent.split(':')[0];
      sum.textContent=label+': '+(checks.length?checks.length+' selected':'All');
    }
  });
}
document.addEventListener('change',function(e){
  if(e.target.dataset&&e.target.dataset.ftbl)applyFilters(e.target.dataset.ftbl);
});
window._v43clearFilters=function(tid){
  document.querySelectorAll('input[data-ftbl="'+tid+'"]').forEach(function(c){c.checked=false;});
  applyFilters(tid);
};

// ---- TAB: DEMAND OVERVIEW ----
window.renderDemandOverview=function(session,result){
  var all=result.rows;
  var ew=all.filter(function(r){return r.stream==='ew';}), bu=all.filter(function(r){return r.stream==='bu';});
  var ewD=ew.reduce(function(s,r){return s+r.cost;},0), buD=bu.reduce(function(s,r){return s+r.cost;},0);
  var funded=all.filter(function(r){return r.final>0;});
  var hardBenFunded=funded.filter(function(r){return r.benefitClass==='hard';}).reduce(function(s,r){return s+(r.benefit||0);},0);
  var softBenFunded=funded.filter(function(r){return r.benefitClass!=='hard'&&r.benefit>0;}).reduce(function(s,r){return s+(r.benefit||0);},0);
  var ops=OPS.meta.opsTotal2027;
  var totalCount=all.length;
  var totalDemand=all.reduce(function(s,r){return s+r.cost;},0);
  var svcCount=OPS.operations.services.length;

  // Collect dominant platform per org
  var orgPlatform={};
  all.forEach(function(r){
    var k=r.org||'Unassigned',p=r.platform||'';
    if(!orgPlatform[k])orgPlatform[k]={};
    if(p)orgPlatform[k][p]=(orgPlatform[k][p]||0)+1;
  });
  Object.keys(orgPlatform).forEach(function(k){
    var best='',bestN=0;
    Object.keys(orgPlatform[k]).forEach(function(p){if(orgPlatform[k][p]>bestN){best=p;bestN=orgPlatform[k][p];}});
    orgPlatform[k]=best;
  });

  var totalIT=totalDemand+ops;
  var fundedCount=funded.length, fundedAmt=funded.reduce(function(s,r){return s+r.final;},0);
  var progAOP2026=161,opsAOP2026=OPS.meta.opsTotal2026,totalAOP2026=progAOP2026+opsAOP2026;
  var pmiInfo=result.pmi||{count:0,requested:0,funded:0};
  var kpiCols=pmiInfo.count?6:5;
  var h='<section class="kpis stream-kpis" style="--kpi-cols:'+kpiCols+'">';
  h+='<div class="kpi dark"><span>Total IT AOP Demand</span><strong>'+fmt(totalIT)+' M€</strong><small>Programs + Operations</small></div>';
  h+='<div class="kpi"><span>Programs Demand</span><strong>'+fmt(totalDemand)+' M€</strong><small>'+totalCount+' Programs · F&R '+ew.length+' · BU '+bu.length+'</small></div>';
  h+='<div class="kpi"><span>Operations Demand</span><strong>'+fmt(ops)+' M€</strong><small>'+svcCount+' services · Pre-aligned</small></div>';
  h+='<div class="kpi"><span>Committed Benefits</span><div style="margin:6px 0"><span style="color:var(--dk);font-size:22px;font-weight:300">'+fmt(hardBenFunded)+'</span> <span style="color:#333;font-size:13px">Hard</span></div><div><span style="color:#333;font-size:22px;font-weight:300">'+fmt(softBenFunded)+'</span> <span style="color:#333;font-size:13px">Soft M€</span></div></div>';
  h+='<div class="kpi"><span>IT AOP 2026</span><strong style="color:var(--dk)">'+fmt(totalAOP2026)+' M€</strong><small style="color:#333">'+fmt(progAOP2026)+' M€ Programs AOP + '+fmt(opsAOP2026)+' M€ Operations AOP</small></div>';
  if(pmiInfo.count){h+='<div class="kpi"><span>PMI On Top</span><strong>'+fmt(pmiInfo.funded)+' M€</strong><small>'+pmiInfo.count+' Programs · outside AOP budget</small></div>';}
  h+='</section>';

  // Demand Split by ExCo Accountability
  h+='<section class="panel"><h2>Demand Split by ExCo Accountability</h2>';
  h+='<p class="muted" style="font-size:11px;margin-bottom:8px">Organised by accountable ExCo member. Click a row to expand constituent organisations. BU Led and F&R demand shown together per leader.</p>';

  var excoD={};
  all.forEach(function(r){
    var ec=r.exco||'Unassigned',k=r.org||'Unassigned';
    if(!excoD[ec])excoD[ec]={count:0,demand:0,funded:0,fundedAmt:0,benefit:0,hardBen:0,softBen:0,orgs:{},ewCount:0,buCount:0};
    var ed=excoD[ec];
    ed.count++;ed.demand+=r.cost||0;
    if(r.final>0){ed.funded++;ed.fundedAmt+=r.final;}
    if(r.benefit>0){
      ed.benefit+=r.benefit;
      if(r.benefitClass==='hard')ed.hardBen+=r.benefit;
      else ed.softBen+=r.benefit;
    }
    if(r.stream==='ew')ed.ewCount++;else ed.buCount++;
    if(!ed.orgs[k])ed.orgs[k]={count:0,demand:0,funded:0,fundedAmt:0,benefit:0,hardBen:0,softBen:0};
    var od=ed.orgs[k];od.count++;od.demand+=r.cost||0;
    if(r.final>0){od.funded++;od.fundedAmt+=r.final;}
    if(r.benefit>0){od.benefit+=r.benefit;if(r.benefitClass==='hard')od.hardBen+=r.benefit;else od.softBen+=r.benefit;}
  });

  h+='<div class="tablebox" style="max-height:600px"><table class="it" id="tblDemandSplit"><thead><tr>';
  h+='<th>ExCo Leader / Organisation</th><th class="num">Programs</th><th class="num">Requested M€</th>';
  h+='<th class="num">Prioritised M€</th><th class="num">Gap M€</th><th class="num">% Funded</th>';
  h+='<th class="num">Benefits M€</th><th class="num">Hard / Soft</th><th class="num">Ops Cost M€</th>';
  h+='</tr></thead><tbody>';

  var excoEntries=Object.entries(excoD).sort(function(a,b){return b[1].demand-a[1].demand;});
  var gTotDem=0,gTotFund=0,gTotBen=0,gTotHard=0,gTotSoft=0,gTotOps=0;
  excoEntries.forEach(function(e){
    var ec=e[0],ed=e[1];
    var ecInfo=AOP.EXCO_HIERARCHY[ec];
    var role=ecInfo?ecInfo.role:ec;
    var orgEntries=Object.entries(ed.orgs).sort(function(a,b){return b[1].demand-a[1].demand;});
    var ecOps=EXCO_OPS_COST[ec]||0;
    var gap=ed.demand-ed.fundedAmt;
    var pctFund=ed.demand>0?Math.round(ed.fundedAmt/ed.demand*100):0;
    gTotDem+=ed.demand;gTotFund+=ed.fundedAmt;gTotBen+=ed.benefit;gTotHard+=ed.hardBen;gTotSoft+=ed.softBen;gTotOps+=ecOps;
    h+='<tr class="exco-group" data-exco-toggle="'+esc(ec)+'" style="cursor:pointer;background:#f0f4f8;font-weight:600">';
    h+='<td><span class="exco-arrow" style="display:inline-block;width:16px;transition:transform .2s">▶</span> '+esc(ec)+' <small style="font-weight:400;color:#596C83">'+esc(role)+'</small>';
    h+=' <small style="font-weight:400;color:#8899AA">F&R '+ed.ewCount+' · BU '+ed.buCount+'</small></td>';
    h+='<td class="num">'+ed.count+'</td><td class="num">'+fmt(ed.demand)+'</td>';
    h+='<td class="num">'+fmt(ed.fundedAmt)+'</td><td class="num">'+(gap>0?fmt(gap):'—')+'</td>';
    h+='<td class="num"><span style="color:'+(pctFund>=80?'#27934C':pctFund>=50?'#FFBE2C':'#D43F44')+'">'+pctFund+'%</span></td>';
    h+='<td class="num">'+fmt(ed.benefit)+'</td>';
    h+='<td class="num"><span style="color:#27934C">'+fmt(ed.hardBen)+'</span> / <span style="color:#FFBE2C">'+fmt(ed.softBen)+'</span></td>';
    h+='<td class="num">'+(ecOps>0?fmt(ecOps):'—')+'</td></tr>';
    orgEntries.forEach(function(oe){
      var ok=oe[0],od=oe[1];
      var opsCost=getOps(ok).total;
      var oGap=od.demand-od.fundedAmt;
      var oPct=od.demand>0?Math.round(od.fundedAmt/od.demand*100):0;
      h+='<tr class="exco-org-row" data-exco-parent="'+esc(ec)+'" style="display:none">';
      h+='<td style="padding-left:32px">'+esc(ok)+'</td>';
      h+='<td class="num">'+od.count+'</td><td class="num">'+fmt(od.demand)+'</td>';
      h+='<td class="num">'+fmt(od.fundedAmt)+'</td><td class="num">'+(oGap>0?fmt(oGap):'—')+'</td>';
      h+='<td class="num">'+oPct+'%</td>';
      h+='<td class="num">'+fmt(od.benefit)+'</td><td class="num"><span style="color:#27934C">'+fmt(od.hardBen)+'</span> / <span style="color:#FFBE2C">'+fmt(od.softBen)+'</span></td>';
      h+='<td class="num">'+(opsCost>0?fmt(opsCost):'—')+'</td></tr>';
    });
    var shownOrgOps=orgEntries.reduce(function(s,oe){return s+getOps(oe[0]).total;},0),otherOps=ecOps-shownOrgOps;
    if(Math.abs(otherOps)>1e-8){h+='<tr class="exco-org-row" data-exco-parent="'+esc(ec)+'" style="display:none"><td style="padding-left:32px">Other TCO recipients in this cluster</td><td colspan="7">Operations only; no matching Programs organisation</td><td class="num">'+fmt(otherOps)+'</td></tr>';}
  });
  var pmiInfo=result.pmi||{count:0,requested:0,funded:0};
  if(pmiInfo.count){
    h+='<tr style="background:#FFF3CD;font-weight:600"><td>PMI On Top <small style="font-weight:400;color:#856404">Auto-prioritised, outside AOP budget</small></td>';
    h+='<td class="num">'+pmiInfo.count+'</td><td class="num">'+fmt(pmiInfo.requested)+'</td>';
    h+='<td class="num">'+fmt(pmiInfo.funded)+'</td><td class="num">—</td><td class="num">100%</td>';
    h+='<td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>';
  }
  var gGap=gTotDem-gTotFund,gPct=gTotDem>0?Math.round(gTotFund/gTotDem*100):0;
  // UX-09: all already includes PMI rows (engine does rows.concat(pmiRows)); do not add pmiInfo values again
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td>Total</td><td class="num">'+all.length+'</td>';
  h+='<td class="num">'+fmt(gTotDem)+'</td><td class="num">'+fmt(gTotFund)+'</td>';
  h+='<td class="num">'+fmt(gGap)+'</td><td class="num">'+gPct+'%</td>';
  h+='<td class="num">'+fmt(gTotBen)+'</td><td class="num"><span style="color:#27934C">'+fmt(gTotHard)+'</span> / <span style="color:#FFBE2C">'+fmt(gTotSoft)+'</span></td>';
  // UX-10: gTotOps double-counts Function/Region allocations; use authoritative OPS total in footer
  var authOpsTotal=(OPS&&OPS.meta&&OPS.meta.opsTotal2027)||469.7;
  h+='<td class="num">'+fmt(authOpsTotal)+'</td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:11px;margin-top:6px">Operations Cost shown at BU cluster level from Comparable AOP2027. Functions, Regions and corporate organisations have their costs allocated into BU TCO (shown as —). Total Operations: '+fmt(authOpsTotal)+' M€. Benefits split: <span style="color:#27934C">Hard</span> / <span style="color:#FFBE2C">Soft</span>.</p>';
  h+='</section>';

  // Insights
  h+='<section class="panel"><h2>High-Level Insights</h2>';
  h+='<table class="it"><thead><tr><th>Insight</th><th>Detail</th><th>Implication</th></tr></thead><tbody>';
  h+='<tr><td>Total IT AOP Demand</td><td>'+fmt(ewD+buD+ops)+' M€ (Programs '+fmt(ewD+buD)+' + Ops '+fmt(ops)+')</td><td>Programs demand is '+fmt((ewD+buD)/ops*100,0)+'% of operations</td></tr>';
  h+='<tr><td>Demand vs Envelope</td><td>'+fmt(ewD+buD)+' M€ against 100 M€</td><td>'+fmt((ewD+buD)/100*100,0)+'% oversubscribed</td></tr>';
  h+='</tbody></table></section>';
  return h;
};

// ---- TAB: OPERATIONS (v4.3.2 — EW-style 3-level hierarchy) ----
var SVC_DATA=JSON.parse(document.getElementById('svc-data').textContent);
var SUBORG_KEYS={'CT/AMI':'CT/AMI','DXR':'DXR','MR':'MR','ULS':'ULS','PD-Other':'PD-Other','PD Other':'PD-Other',
  'IGT-D':'IGT-D','IGT-S':'IGT-S','IGT-Other':'IGT-Other','IGT Other':'IGT-Other',
  'AMD':'AMD','HPM':'HPM','ACI':'ACI','ACI (shift from EI in 2026)':'ACI','Monit. Other':'Monitoring-Other','Monitoring-Other':'Monitoring-Other',
  'Sleep & Respitory Care':'SRC','SRC':'SRC',
  'CI':'CI','II':'II','EI Other':'EI-Other','EI-Other':'EI-Other',
  'MCC/WH':'MCC/WH','G&B':'G&B','OHC':'OHC','PH Other':'PH-Other','PH-Other':'PH-Other',
  'Int. Property & Standards':'IP&S','IP&S':'IP&S','Innovation & Design':'I&D','I&D':'I&D',
  'North America Region':'NAR','NAR':'NAR','International Region':'IR','IR':'IR','Greater China Region':'GCR','GCR':'GCR'};
function getSvcs(name){var k=SUBORG_KEYS[name]||SUBORG_KEYS[name.replace(/^- /,'')];return k?SVC_DATA[k]||[]:[];}

// Ops platform mapping (IT Dept codes to platform names)
var OPS_PLATFORM={};
OPS.operations.services.forEach(function(s){
  if(s.dept){var p=deptToPlatform(s.dept);if(p)OPS_PLATFORM[s.dept]=p;}
});

window.renderOperationsTab=function(){
  var tco=OPS.operations.tco;
  var h='<section class="kpis stream-kpis">';
  h+='<div class="kpi"><span>Total Operations 2027</span><strong>'+fmt(OPS.meta.opsTotal2027)+ ' M€</strong><small>AOP 2027</small></div>';
  h+='<div class="kpi"><span>2026 Run-Rate</span><strong>'+fmt(OPS.meta.opsTotal2026)+ ' M€</strong><small>Source baseline</small></div>';
  h+='<div class="kpi"><span>Δ YoY</span><strong>'+fmt(OPS.meta.opsTotal2027-OPS.meta.opsTotal2026)+ ' M€</strong><small>2027 less 2026</small></div>';
  h+='<div class="kpi"><span>BU Own</span><strong>'+fmt(OPS.meta.buOwn)+ ' M€</strong><small>Own consumption</small></div>';
  h+='<div class="kpi"><span>From Regions</span><strong>'+fmt(OPS.meta.regionAlloc)+ ' M€</strong><small>Region allocation</small></div>';
  h+='<div class="kpi"><span>From Functions</span><strong>'+fmt(OPS.meta.functionAlloc)+ ' M€</strong><small>Function allocation</small></div>';
  h+='</section>';

  h+='<section class="panel"><h2>Organisation Total Cost of Ownership</h2>';

  // Filter + Sort — Platform mapping from Bill of IT Platform Service List
  var tcoPlatMap={
    'Precision Diagnosis':'Commercial IT','Image Guided Therapy':'Services & Solutions IT',
    'Connected Care':'Commercial IT','EI':'Commercial IT','Personal Health':'Commercial IT',
    'Int. Property & Standards':'Group Functions & Hyperautomation','Innovation & Design':'Innovation and Digital',
    'Regions (allocated to BUs)':'Unallocated','Functions & CoEs (allocated to BUs)':'Unallocated'
  };
  var tcoFilterData=tco.filter(function(t){return !t.bu.startsWith('- ');}).map(function(t){
    return {org:t.bu.trim(),platform:tcoPlatMap[t.bu.trim()]||'Unallocated'};
  });
  h+=buildFilterBar('tcoTbl',tcoFilterData,[{key:'org',label:'Organisation'},{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  h+='<div class="tablebox burf-tablebox" style="max-height:none"><table class="portfolio burf-table" id="tcoTbl"><thead><tr>';
  h+='<th class="identity">Organisation</th>';
  h+='<th style="text-align:center">AOP2027 Costs M€</th>';
  h+='<th style="text-align:center">Own Consumption (M€ | %)</th>';
  h+='<th style="text-align:center">Regions to BU (M€ | %)</th>';
  h+='<th style="text-align:center">Functions & CoEs (M€ | %)</th>';
  h+='<th style="text-align:center">Δ vs AOP2026 M€</th>';
  h+='</tr></thead><tbody>';

  var cg=null, expanded=new Set();
  tco.forEach(function(t,i){
    var isChild=t.bu.startsWith('- ')||t.bu.startsWith(' -');
    var gid='ops|'+encodeURIComponent(t.bu.trim());
    var d=t.deltaVsAOP2026||0,clr=d>0?'var(--weak)':d<0?'var(--prot)':'var(--text2)';
    var total=t.totalBU||0;
    var ownPct=total>0?Math.round(t.ownConsumption/total*100)+'%':'';
    var regPct=total>0?Math.round(t.regionAlloc/total*100)+'%':'';
    var funcPct=total>0?Math.round(t.functionAlloc/total*100)+'%':'';
    var buPlat=normalizePlatform(tcoPlatMap[t.bu.trim()]||'Unallocated');

    if(!isChild){
      cg=gid;
      var childCount=0;
      for(var j=i+1;j<tco.length;j++){if(tco[j].bu.startsWith('- ')||tco[j].bu.startsWith(' -'))childCount++;else break;}

      h+='<tr class="burf-summary" data-group-summary="'+esc(gid)+'" data-organisation="'+esc(t.bu.trim())+'" data-org="'+esc(t.bu.trim())+'" data-platform="'+esc(buPlat)+'" data-exact-tco="'+total+'">';
      h+='<td class="identity"><button class="burf-toggle" data-collapse="'+esc(gid)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(t.bu.trim())+'</button> <span class="group-count">('+childCount+' sub-orgs)</span></td>';
      h+='<td class="num" style="text-align:center"><strong>'+fmt(total)+'</strong></td>';
      h+='<td class="num" style="text-align:center">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num" style="text-align:center">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num" style="text-align:center">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="text-align:center;color:'+clr+'">'+(d>0?'+':'')+fmt(d)+'</td></tr>';
    } else {
      var subName=t.bu.replace(/^[\s-]+/,'').trim();
      var svcs=getSvcs(subName);

      h+='<tr class="program-row hidden" data-group="'+esc(cg)+'" data-org="'+esc(cg)+'" data-platform="'+esc(buPlat)+'">';
      h+='<td class="identity" style="padding-left:28px"><button class="burf-toggle" data-collapse="svc|'+esc(subName)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(subName)+'</button> <span class="group-count">('+svcs.length+' services)</span></td>';
      h+='<td class="num" style="text-align:center">'+fmt(total)+'</td>';
      h+='<td class="num" style="text-align:center;color:var(--text2)">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num" style="text-align:center;color:var(--text2)">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num" style="text-align:center;color:var(--text2)">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="text-align:center;color:'+clr+'">'+(d>0?'+':'')+fmt(d)+'</td></tr>';

      svcs.forEach(function(s){
        h+='<tr class="program-row hidden" data-group="svc|'+esc(subName)+'" style="background:#f9fbfe">';
        h+='<td style="padding-left:56px;font-size:11px;color:var(--text2)">'+esc(s.n)+'</td>';
        h+='<td class="num" style="text-align:center;font-size:11px">'+fmt(s.c,1)+'</td>';
        h+='<td colspan="4"></td></tr>';
      });
    }
  });

  h+='<tr class="allocation-info"><td>Regions (already allocated to BUs)</td><td class="num">0.0</td><td class="num">'+fmt(OPS.meta.regionAlloc)+'</td><td class="num">'+fmt(-OPS.meta.regionAlloc)+'</td><td></td><td></td></tr>';
  h+='<tr class="allocation-info"><td>Functions & CoEs (already allocated to BUs)</td><td class="num">0.0</td><td class="num">'+fmt(OPS.meta.functionAlloc)+'</td><td></td><td class="num">'+fmt(-OPS.meta.functionAlloc)+'</td><td></td></tr>';
  h+='<tr class="summary-total" data-total="1"><td class="identity"><strong>Total recipient TCO</strong></td><td class="num">'+fmt(OPS.meta.tcoTotal)+'</td><td class="num">'+fmt(OPS.meta.buOwn)+'</td><td class="num">'+fmt(OPS.meta.regionAlloc)+'</td><td class="num">'+fmt(OPS.meta.functionAlloc)+'</td><td class="num">'+fmt(OPS.meta.tcoTotal-tco.filter(t=>!t.bu.startsWith('-')).reduce((s,t)=>s+(t.aop2026||0),0))+'</td></tr>';
  h+='</tbody></table></div></section>';

  // Service Catalog Table
  var svcs=OPS.operations.services;
  h+='<section class="panel"><h2>Service Catalog <span class="badge">'+svcs.length+' services</span></h2>';

  // Build platform-enriched service rows for filter
  var svcRows=svcs.map(function(s){return {org:s.dept,platform:svcToPlatform(s.serviceId)||deptToPlatform(s.dept),name:s.name};});
  h+=buildFilterBar('svcCatalog',svcRows,[{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="svcCatalog"><thead><tr>';
  h+='<th>Service ID</th><th style="width:25%">Service Name</th><th>Platform</th>';
  h+='<th class="num">AOP2027 Costs M€</th><th class="num">AOP2026 Costs M€</th>';
  h+='<th class="num">Δ vs AOP2026 M€</th>';
  h+='</tr></thead><tbody>';

  svcs.sort(function(a,b){return b.cost2027-a.cost2027;}).forEach(function(s){
    var plat=svcToPlatform(s.serviceId)||deptToPlatform(s.dept);
    var delta=s.cost2026==null?null:s.cost2027-s.cost2026;
    var dClr=delta>0?'var(--weak)':delta<0?'var(--prot)':'var(--text2)';
    h+='<tr data-platform="'+esc(plat)+'" data-org="'+esc(s.dept)+'" data-cost27="'+s.cost2027+'" data-cost26="'+(s.cost2026??'')+'">';
    h+='<td style="font-size:11px">'+esc(s.serviceId)+'</td>';
    h+='<td style="font-size:11px;max-width:250px">'+esc(s.name)+'</td>';
    h+='<td style="font-size:11px">'+esc(plat)+'</td>';
    h+='<td class="num">'+fmt(s.cost2027)+'</td>';
    h+='<td class="num">'+fmt(s.cost2026)+'</td>';
    h+='<td class="num" style="color:'+dClr+'">'+(delta>0?'+':'')+fmt(delta)+'</td>';
    h+='</tr>';
  });

  var svcTotal27=svcs.reduce(function(s,v){return s+v.cost2027;},0);
  var svcTotal26=svcs.reduce(function(s,v){return s+v.cost2026;},0);
  var svcDelta=svcTotal27-svcTotal26;
  var svcDClr=svcDelta>0?'var(--weak)':svcDelta<0?'var(--prot)':'var(--text2)';
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td></td><td>Total</td><td></td>';
  h+='<td class="num">'+fmt(svcTotal27)+'</td>';
  h+='<td class="num">'+fmt(svcTotal26)+'</td>';
  h+='<td class="num" style="color:'+svcDClr+'">'+(svcDelta>0?'+':'')+fmt(svcDelta)+'</td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:11px">Platform mapping from Bill of IT Platform Service List. 14 services from AI Services, Regions, B72 and Transfers depts are marked Unallocated.</p>';
  h+='</section>';

  // Attach collapse handlers for ops table
  setTimeout(function(){
    document.querySelectorAll('#tcoTbl [data-collapse]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var id=this.dataset.collapse;
        var expanded=this.getAttribute('aria-expanded')==='true';
        this.setAttribute('aria-expanded',String(!expanded));
        this.querySelector('.triangle').textContent=expanded?'▶':'▼';
        document.querySelectorAll('#tcoTbl [data-group="'+id+'"]').forEach(function(r){
          if(expanded){
            r.classList.add('hidden');
            // Also collapse sub-groups
            r.querySelectorAll('[data-collapse]').forEach(function(b){
              b.setAttribute('aria-expanded','false');
              b.querySelector('.triangle').textContent='▶';
            });
            var subId=r.querySelector('[data-collapse]');
            if(subId){
              document.querySelectorAll('#tcoTbl [data-group="'+subId.dataset.collapse+'"]').forEach(function(sr){sr.classList.add('hidden');});
            }
          } else {
            r.classList.remove('hidden');
          }
        });
      });
    });
  },100);

  return h;
};




// ---- ONE PORTFOLIO: inject ops allocation + modifications after render ----
new MutationObserver(function(muts){
  muts.forEach(function(m){
    if(m.type!=='childList'||m.target.id!=='main')return;
    var aop=window.__aop;
    if(!aop||aop.tab!=='overview')return;
    var main=document.getElementById('main');
    if(!main||main.querySelector('#alloc-sec'))return;

    var all=aop.result.rows;
    var funded=all.filter(function(r){return r.final>0;});
    var totalAlloc=funded.reduce(function(s,r){return s+r.final;},0);
    var ewAlloc=funded.filter(function(r){return r.stream==='ew'&&!r.isPmi;}).reduce(function(s,r){return s+r.final;},0);
    var buAlloc=funded.filter(function(r){return r.stream==='bu'&&!r.isPmi;}).reduce(function(s,r){return s+r.final;},0);
    var totalBen=funded.reduce(function(s,r){return s+(r.benefit||0);},0);
    var hardBenT6=funded.filter(function(r){return r.benefitClass==='hard';}).reduce(function(s,r){return s+(r.benefit||0);},0);
    var softBenT6=funded.filter(function(r){return r.benefitClass!=='hard'&&r.benefit>0;}).reduce(function(s,r){return s+(r.benefit||0);},0);

    // 1. Replace KPIs with header tiles — UX-02: restore PMI tile; UX-03: derive ops from OPS metadata
    var kpiEl=main.querySelector('.kpis,.stream-kpis');
    if(kpiEl&&!kpiEl.querySelector('.ops-kpi-added')){
      var t6pmi=aop.result.pmi||{count:0,requested:0,funded:0};
      var t6opsTotal=(OPS&&OPS.meta&&OPS.meta.opsTotal2027)||469.7;
      var t6cols=t6pmi.count?6:5;
      kpiEl.style.setProperty('--kpi-cols',t6cols);
      var newKpis='<div class="kpi dark"><span>Total IT AOP</span><strong>'+fmt(t6opsTotal+totalAlloc)+' M€</strong><small>Programs + Operations</small></div>';
      newKpis+='<div class="kpi"><span>Operations AOP</span><strong>'+fmt(t6opsTotal)+' M€</strong><small>Pre-aligned</small></div>';
      newKpis+='<div class="kpi green"><span>Prioritized Programs AOP</span><strong>'+fmt(totalAlloc)+' M€</strong><small>'+funded.length+' programs funded</small></div>';
      newKpis+='<div class="kpi"><span>Split of Programs AOP</span><strong style="white-space:nowrap">F&R '+fmt(ewAlloc)+' | BU '+fmt(buAlloc)+' M€</strong></div>';
      newKpis+='<div class="kpi"><span>Committed Benefits</span><strong style="white-space:nowrap"><span style="color:var(--dk);font-size:18px">'+fmt(hardBenT6)+'</span> <span style="font-weight:400;color:#333;font-size:12px">Hard</span> <span style="color:#333;font-size:18px">'+fmt(softBenT6)+'</span> <span style="font-weight:400;color:#333;font-size:12px">Soft M€</span></strong></div>';
      if(t6pmi.count){newKpis+='<div class="kpi ops-kpi-added"><span>PMI On Top</span><strong>'+fmt(t6pmi.funded)+' M€</strong><small>'+t6pmi.count+' Programs · outside AOP budget</small></div>';}
      else{newKpis+='<div class="kpi ops-kpi-added" style="display:none"></div>';}
      kpiEl.innerHTML=newKpis;
      kpiEl.classList.add('ops-kpi-added');
    }

    // Rename heading
    main.querySelectorAll('h2').forEach(function(h2){
      if(h2.textContent.includes('AOP 2027 : One Portfolio'))h2.textContent='AOP2027 : Programs Demand Overview';
    });

    // UX-04: unfunded bubbles and median line restored — suppression removed per QA defect register

    // 5. Remove chart description paragraph (already handled by patch 13, but ensure)
    main.querySelectorAll('.bubble-chart+p.muted').forEach(function(p){if(p.textContent.length>100)p.style.display='none';});

    var finance=AOP.finance(aop.session.data,aop.result,OPS);
    var ah='<section class="panel" id="alloc-sec" data-program-exact="'+finance.totals.programs+'" data-operations-exact="'+finance.totals.operations+'" data-total-exact="'+finance.totals.total+'" data-expected-exact="'+finance.expected+'"><h2>Organisation IT Cost Allocation: Programs + Operations</h2>';
    ah+='<p>Programs follow their source spend-allocation percentages. EW uses the confirmed charging key, including '+(finance.ewKey.unallocatedShare*100).toFixed(4)+'% unallocated. Operations follows its own Bill of IT allocations. PMI remains separate. Amounts retain source precision in the ledger.</p>';
    ah+='<div class="tablebox"><table id="allocTbl"><thead><tr><th>Recipient</th><th>Single BU</th><th>Cross BU</th><th>Indirect / other</th><th>EW charge</th><th>Ops own</th><th>Ops Regions</th><th>Ops Functions</th><th>PMI</th><th>Total M€</th></tr></thead><tbody>';
    finance.rows.forEach(function(r){ah+='<tr data-recipient="'+esc(r.recipient)+'" data-total="'+r.total+'"><td>'+esc(r.recipient)+'</td>'+[r.single,r.cross,r.indirect+r.other,r.ew,r.own,r.region,r.functions,r.pmi,r.total].map(function(v){return '<td class="num" title="'+v+'">'+fmt(v)+'</td>';}).join('')+'</tr>';});
    var ft=finance.totals;
    ah+='<tr class="summary-total"><td>Grand total</td>'+[ft.single,ft.cross,ft.indirect+ft.other,ft.ew,ft.own,ft.region,ft.functions,ft.pmi,ft.total].map(function(v){return '<td class="num" title="'+v+'">'+fmt(v)+'</td>';}).join('')+'</tr></tbody></table></div>';
    ah+='<p>Whole-scenario recipient totals. Source-accountability filters above do not change this allocation table. Reconciliation difference: '+(ft.total-finance.expected).toFixed(9)+' M€.</p>';
    ah+='<details><summary>EW charging percentages and source exceptions</summary><table><tr><th>Recipient</th><th>EW %</th></tr>'+Object.entries(finance.ewKey.fractions).map(function(e){return '<tr><td>'+esc(e[0])+'</td><td>'+(e[1]*100).toFixed(6)+'%</td></tr>';}).join('')+'</table><p>Source row '+finance.ewKey.sourceRow+'; raw fractions total '+finance.ewKey.rawSum+'; confirmed scale '+finance.ewKey.scale+'. The 40 M€ charging row is excluded from demand.</p><ul>'+finance.issues.map(function(x){return '<li>'+esc(x.id)+': '+esc(x.reason)+' ('+x.value+' M€)</li>';}).join('')+'</ul></details>';
    ah+='<details><summary>Traceable finance ledger ('+finance.ledger.length+' entries)</summary><button id="finance-csv">Download finance ledger CSV</button><p>Every funded Programs allocation retains its Function/Region or BU origin, recipient, key cell and source hash. The Excel export contains the same ledger.</p><div class="tablebox"><table><thead><tr><th>ID / origin</th><th>Recipient</th><th>Type</th><th>Funded M€</th><th>Fraction</th><th>Charge M€</th><th>Source / key cell</th></tr></thead><tbody>'+finance.ledger.map(function(x){return '<tr><td>'+esc(x.id)+'<small>'+esc(x.origin)+'</small></td><td>'+esc(x.recipient)+' / '+esc(x.subRecipient)+'</td><td>'+esc(x.bucket)+'</td><td>'+(x.funded??'')+'</td><td>'+(x.fraction??'')+'</td><td>'+x.amount+'</td><td>'+esc(x.sourceFile)+'<small>'+esc(x.keyCell)+'</small></td></tr>';}).join('')+'</tbody></table></div></details></section>';
    var div=document.createElement('div');div.innerHTML=ah;var allocSec=div.firstElementChild;
    var target=main.querySelectorAll('.panel')[1];if(target)main.insertBefore(allocSec,target);else main.appendChild(allocSec);
    document.getElementById('finance-csv').onclick=function(){const keys=Object.keys(finance.ledger[0]),quote=v=>'"'+String(v??'').replaceAll('"','""')+'"',csv=[keys.map(quote).join(','),...finance.ledger.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='AOP2027-Finance-Ledger-r'+aop.session.revision+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);};

    // UX-08: render Finance QA status after allocation table so reconciliation status is visible
    if(window.AOPDataQA&&window.AOPDataQA.validateFinance&&window.AOPDataQA.renderFinanceQA){
      try{
        var t6ops=(OPS&&OPS.meta&&OPS.meta.opsTotal2027)||469.7;
        var qaResult=window.AOPDataQA.validateFinance(aop.result,t6ops);
        var qaHtml=window.AOPDataQA.renderFinanceQA(qaResult);
        if(qaHtml){
          var qaDiv=document.createElement('div');
          qaDiv.innerHTML=qaHtml;
          var qaSec=qaDiv.firstElementChild;
          if(qaSec){
            var qaPanels=main.querySelectorAll('.panel');
            var qaTarget=qaPanels.length>2?qaPanels[2]:null;
            if(qaTarget)main.insertBefore(qaSec,qaTarget);else main.appendChild(qaSec);
          }
        }
      }catch(e){console.warn('Finance QA render failed:',e);}
    }
  });
}).observe(document.getElementById('main')||document.body,{childList:true});

if(window.__aop&&window.__aop.tab==='demand'&&window.renderDemandOverview){try{document.getElementById('main').innerHTML=window.renderDemandOverview(window.__aop.session,window.__aop.result);}catch(e){}}
})();

// Finance QA harness — validates allocation reconciliation for ExCo review.
// Injected after all other modules so it can wrap without changing existing code.
window.AOPDataQA=window.AOPDataQA||{};
(function(){
var round=function(x){return Math.round((x+1e-10)*1e6)/1e6;};
window.AOPDataQA.validateFinance=function validateFinance(result,opsTotal){
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
};
window.AOPDataQA.renderFinanceQA=function(qa){
  if(!qa)return '';
  var badge=qa.status==='PASS'?'qa-pass':qa.status==='WARN'?'qa-warn':'qa-fail';
  var t=qa.totals;
  var h='<div class="qa-report" style="margin:8px 0;padding:8px 12px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0">';
  h+='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
  h+='<span style="font-weight:700;padding:2px 8px;border-radius:4px;font-size:12px;'+(qa.status==='PASS'?'background:#d1fae5;color:#065f46':qa.status==='WARN'?'background:#fef3c7;color:#92400e':'background:#fee2e2;color:#991b1b')+'">Finance QA: '+qa.status+'</span>';
  if(t.grandTotal!==null){h+='<span style="font-size:12px;color:#475569">Programs <strong>'+t.programAlloc.toFixed(1)+'</strong> M€ (BU <strong>'+t.buAlloc.toFixed(1)+'</strong> + F&R <strong>'+t.ewAlloc.toFixed(1)+'</strong> + PMI <strong>'+t.pmi.toFixed(1)+'</strong>) + Ops <strong>'+(t.opsTotal||0).toFixed(1)+'</strong> = Grand Total <strong>'+t.grandTotal.toFixed(1)+'</strong> M€</span>';}
  h+='</div>';
  h+='<details style="margin-top:6px"><summary style="font-size:11px;color:#64748b;cursor:pointer">'+qa.checks.filter(function(c){return c.status==='PASS';}).length+' passed · '+qa.checks.filter(function(c){return c.status==='WARN';}).length+' warnings · '+qa.checks.filter(function(c){return c.status==='FAIL';}).length+' failed (expand)</summary>';
  h+='<table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:11px"><thead><tr style="background:#f1f5f9"><th style="padding:4px 8px;text-align:left">Check</th><th>Severity</th><th>Status</th><th style="text-align:left">Detail</th></tr></thead><tbody>';
  qa.checks.forEach(function(c){
    var bg=c.status==='PASS'?'#f0fdf4':c.status==='WARN'?'#fffbeb':'#fef2f2';
    h+='<tr style="background:'+bg+'"><td style="padding:3px 8px">'+c.name+'</td><td style="text-align:center">'+c.severity+'</td><td style="text-align:center;font-weight:700">'+(c.status==='PASS'?'✓':c.status==='WARN'?'⚠':'✗')+' '+c.status+'</td><td style="padding:3px 8px">'+c.detail+'</td></tr>';
  });
  h+='</tbody></table></details></div>';
  return h;
};
})();
