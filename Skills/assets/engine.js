(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOP=api;})(globalThis,function(){
'use strict';
const VERSION='6.0.0', STAGES=['Legal and Compliance (Must Do)','Carry Over demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification'];
const CCB_LFR_NAMES=new Set(['fin-ccb - finance','ccb - group function','isc-ccb - ew','isc -ccb - ew']);
const CCB_SUSTAINING_NAMES=new Set(['ccb - hyperautomation','ccb - i&d - innovation & digital','ccb commercial it','ccb services it','eadi - ccb initiative','ccb - i&d - the vault','ccb - i&d: brand licensing']);
function isCcbLfr(r){return CCB_LFR_NAMES.has(key(r.name));}
function isCcbSustaining(r){return CCB_SUSTAINING_NAMES.has(key(r.name));}
function isCcb(r){return isCcbLfr(r)||isCcbSustaining(r);}
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
function numberCell(x){if(numeric(x)!==null)return x;if(typeof x==='string'){var s=x.replace(/[ €€$£\s,]/g,'').trim();if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);}return null;}
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
 const ids=new Set();for(const r of programRecords){if(ids.has(r.id))throw Error('Duplicate Item No.: '+r.id);ids.add(r.id);}for(const id of ['EW-11','EW-65','EW-71'])if(!ids.has(id))issues.push('Legacy CCB exception ID '+id+' is absent (v6 uses name-based classification).');
 return {schema:3,sourceFile:workbook.sourceFile,sourceHash:workbook.sourceHash,version:workbook.sourceHash.slice(0,12),records:programRecords,excludedRecords,ewChargingKey,workbook,issues,mappings};
}
function col(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
const realLfr=v=>!!v&&v!=='0'&&!/^(na|n\/a|tbd|none|not applicable)$/i.test(clean(v));
function isLfrRecord(r){return realLfr(r.lfrName)||realLfr(r.lfrYear);}
function isITSimpProgram(r){const c=(r.category||'').toLowerCase();return c.indexOf('decomm')>=0||c.indexOf('replatform')>=0;}
function stage(r){if(isCcbLfr(r))return 0;if(isCcbSustaining(r))return 2;if(isLfrRecord(r))return 0;if(/must-do/.test(key(r.overall)))return 0;if(key(r.newCarry)==='carry over')return 1;if(key(r.newCarry)==='change & sustain')return 2;if(['continuous improvement','continous improvement','continuous improvement (ci)','upgrades & enhancements'].includes(key(r.category)))return 2;return 3;}
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
 const lfrTier=st===0?(key(r.overall).includes('p1')?'Immediate':key(r.overall).includes('p2')?'Scheduled':isCcbLfr(r)?'CCB-LFR':'Other'):'';const hasLfrEvidence=realLfr(r.lfrName)&&realLfr(r.lfrYear);const lfrVerified=st===0&&(hasLfrEvidence||isCcbLfr(r));var carryFundCap=isBaselinedCarry?Math.min(r.cost,r.baselined):(st===1?r.cost:null);
 const ccbNonNeg=isCcbSustaining(r);
 const prioCat=st===0?(isCcbLfr(r)?'CCB-LFR':'LFR'):st===1?'Carry-Over':st===2?(ccbNonNeg?'CCB-Sustaining':key(r.newCarry)==='change & sustain'?'Change & Sustain':'Hygiene'):st===4?'IT Simplification':'Value Based';
 const lfrBenefitRelevance=st===0?(r.benefit!==null&&r.benefit>0?'LFR — BC relevance low':'No benefits supplied (LFR)'):null;
 const exco=excoOf(r);
 const bc=classifyBenefit(r,ratio,benefitSource);
 return {...r,stage:st,stageName:STAGES[st],calculatedScore,ratio,rawComponents:raw,components,score,consequence:c,qualBenefit:qb,benefitSource,benefitClass:bc.cls,benefitClassLabel:bc.label,benefitFlag:bc.flag,lfrTier,hasLfrEvidence,lfrVerified,isBaselinedCarry,carryConfirmed,carryFundCap,paybackPoints:pk,warnings,holds,eligible:!holds.length,review,condition:clean(review.condition)||r.remarks,priorityPoints:pp,exco,ccbNonNeg,prioCat,lfrBenefitRelevance};
}
function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const va=a.lfrVerified?0:1,vb=b.lfrVerified?0:1;if(va!==vb)return va-vb;const seq=r=>{const d=key(r.overall);return d.includes('p1')?0:d.includes('p2')?1:isCcbLfr(r)?2:3;};const x=seq(a)-seq(b);if(x)return x;return b.score-a.score;}if(a.stage===1){const ca=a.carryConfirmed?0:(a.ratio!==null?1:2),cb=b.carryConfirmed?0:(b.ratio!==null?1:2);if(ca!==cb)return ca-cb;return (b.ratio??-Infinity)-(a.ratio??-Infinity)||b.score-a.score;}if(a.stage===2){const st=r=>r.ccbNonNeg?0:key(r.newCarry)==='change & sustain'?1:2;const x=st(a)-st(b);if(x)return x;return b.score-a.score;}return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}
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
 const exco={};for(const r of rows){const e=r.exco||'Unassigned';if(!exco[e])exco[e]={requested:0,funded:0,hardBen:0,softBen:0,count:0,fundedCount:0};exco[e].requested+=r.cost||0;exco[e].count++;if(r.final>0){exco[e].funded+=r.final;exco[e].fundedCount++;}if(r.stage!==0){if(r.benefitClass==='hard')exco[e].hardBen+=r.benefit||0;else if(r.benefitClass==='soft')exco[e].softBen+=r.benefit||0;}}
 for(const k of Object.keys(exco)){const v=exco[k];v.requested=round(v.requested);v.funded=round(v.funded);v.hardBen=round(v.hardBen);v.softBen=round(v.softBen);}
 const ben={hard:0,soft:0,qualitative:0,none:0};for(const r of rows){if(r.stage===0)continue;const c=r.benefitClass||'none';if(c==='hard')ben.hard+=r.benefit||0;else if(c==='soft')ben.soft+=r.benefit||0;else if(c==='qualitative')ben.qualitative++;else ben.none++;}
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
return {finance,tradeoff,VERSION,STAGES,EXCO_HIERARCHY,ORG_TO_EXCO,ORG_RENAME,CCB_LFR_NAMES,CCB_SUSTAINING_NAMES,isCcbLfr,isCcbSustaining,isCcb,excoOf,clone,clean,key,round,numeric,sum,col,defaults,preset,autoLfrPct,validateSettings,leverTarget,switchBasis,normalize,stage,enrich,solve,createSession,transact,undo,refreshPreview,refresh,auditRefresh,snapshotState,filter,validateSession};
});
/* Offline XLSX IO: OOXML ZIP with typed cells; native browser decompression. */
