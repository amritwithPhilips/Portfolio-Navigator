(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.AOP=api;})(globalThis,function(){
'use strict';
const VERSION='5.9.7', STAGES=['Legal and Compliance (Must Do)','Carry Over demand','Sustain Engineering and Hygiene','Value Based Portfolio','IT Simplification'];
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
'Laura Matz':{role:'Information Technology',segment:'Enterprise',orgs:['Information Technology ','Cross BU','Cross BU & Functions','Cross Functions','Regions (NAM, GRC, IR)']},
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
function numberCell(x){if(numeric(x)!==null)return x;if(typeof x==='string'){var s=x.replace(/[ €€$£\s,]/g,'').trim();if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);}return null;}
// Preserve submitted raw text; accept only complete, unambiguous year expressions.
function paybackCell(value){const n=numberCell(value),text=clean(value);if(n!==null)return {raw:value,years:n,status:n>0?'numeric':'nonpositive'};const m=/^(\d+(?:\.\d+)?)\s+years?$/i.exec(text);if(m){const years=Number(m[1]);return {raw:value,years,status:years>0?'year-label':'nonpositive'};}return {raw:value,years:null,status:text?'invalid':'missing'};}
const hasCondition=x=>{const text=clean(x);return !!text&&!/^(?:0(?:\.0+)?|n\/?a|none|null|tbd|not applicable|to be determined)$/i.test(text);};
const sum=(rows,f)=>round(rows.reduce((s,r)=>s+(numeric(f(r))??0),0));
function materialFingerprint(r){return JSON.stringify({item:r.item,planisware:r.planisware,org:r.org,name:r.name,type:r.type,newCarry:r.newCarry,category:r.category,platform:r.platform,area:r.area,priority:r.priority,cost:r.cost,benefit:r.benefit,benefitDetails:r.benefitDetails,impact:r.impact,problem:r.problem,scope:r.scope,dependency:r.dependency,decisionBand:r.decisionBand,overall:r.overall,remarks:r.remarks,stream:r.stream,lfrName:r.lfrName,lfrYear:r.lfrYear,baselined:r.baselined,paybackYears:r.paybackYears,paybackRaw:r.paybackRaw,requestRaw:r.requestRaw,benefitRaw:r.benefitRaw,allocations:r.allocations||null,itGrouping:r.itGrouping,sourceOrg:r.sourceOrg,sourceType:r.sourceType,carryoverEvidence:r.carryoverEvidence,benefitLifetime:r.benefitLifetime,benefitDurationRaw:r.benefitDurationRaw,benefitDurationYears:r.benefitDurationYears});}
const BENEFIT_MODES=['both','hard','soft'];
const defaults=()=>({budget:100,tolerance:0,lfr:{basis:'bucket',pct:100},carry:{basis:'bucket',pct:100},sustain:{basis:'bucket',pct:100},value:{basis:'bucket',pct:100},itsimp:{basis:'bucket',pct:0},itsimpMode:false,merit:45,weights:[40,25,15,10,10],benefitMode:'both'});
function preset(name){if(name==='mustdo'){const m=preset('evidence');m.budget=100;m._mustDoOnTop=true;return m;}const s=defaults();if(name==='optimal'){s.lfr={basis:'bucket',pct:100};s._autoLfr=true;s._autoCarry=true;s.sustain={basis:'bucket',pct:52};s.value={basis:'bucket',pct:100};s._autoValue=true;}if(name==='protect'){s.lfr={basis:'bucket',pct:100};s.carry={basis:'bucket',pct:100};s.sustain={basis:'bucket',pct:100};s.value={basis:'bucket',pct:100};s._autoValue=true;}if(name==='evidence'){s.lfr={basis:'amount',amount:28};s._autoCarry=true;s.sustain={basis:'bucket',pct:52};s.value={basis:'bucket',pct:100};s._autoValue=true;s.itsimpMode=true;s.itsimp={basis:'amount',amount:7};s._balancedPortfolio=true;s._lfrCap=28;s._ewTarget=40;s._regTarget=5;s._buLedTarget=55;s._applyLfrOptOuts=true;s._ccb70=true;s._iscTarget=10;s._stoTarget=20;}if(name==='capacity'){s.lfr={basis:'bucket',pct:100};s._autoLfr=true;s._autoCarry=true;s.sustain={basis:'bucket',pct:40};s.value={basis:'bucket',pct:100};s._autoValue=true;s.weights=[60,15,10,10,5];s.benefitMode='hard';}return s;}
function validateSettings(s){if(!s||!Number.isFinite(s.budget)||s.budget<0)throw Error('Budget invalid.');if(!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>5)throw Error('Tolerance invalid.');if(typeof s.carry==='number')s.carry={basis:'bucket',pct:100};for(const n of ['lfr','carry','sustain','value']){if(!s[n]||!['bucket','aop','amount'].includes(s[n].basis))throw Error(n+' coverage invalid.');if(s[n].basis!=='amount'&&(!Number.isFinite(s[n].pct)||s[n].pct<0))throw Error(n+' coverage invalid.');if(s[n].basis==='bucket'&&s[n].pct>100+1e-9)throw Error(n+' coverage invalid.');if(s[n].pct===undefined)s[n].pct=0;}for(const n of ['lfr','carry','sustain','value'])if(s[n].basis==='amount'&&(!Number.isFinite(s[n].amount)||s[n].amount<0))throw Error(n+' allocation invalid.');if(s.itsimp){if(!['bucket','aop','amount'].includes(s.itsimp.basis)||!Number.isFinite(s.itsimp.pct||0)||(s.itsimp.pct||0)<0||(s.itsimp.basis==='bucket'&&(s.itsimp.pct||0)>100+1e-9))throw Error('IT Simplification coverage invalid.');if(s.itsimp.basis==='amount'&&(!Number.isFinite(s.itsimp.amount)||s.itsimp.amount<0))throw Error('IT Simplification allocation invalid.');}if(!Number.isFinite(s.merit)||s.merit<0||s.merit>100)throw Error('Merit floor invalid.');if(!Array.isArray(s.weights)||s.weights.length!==5||s.weights.some(x=>!Number.isFinite(x)||x<0)||Math.abs(s.weights.reduce((a,b)=>a+b,0)-100)>1e-8)throw Error('Weights must total 100.');if(s.benefitMode&&!BENEFIT_MODES.includes(s.benefitMode))throw Error('Benefit mode invalid.');if(!s.benefitMode)s.benefitMode='both';return true;}
// The supplied BU sheet mixes inserted headings with cached external-link columns.
// Match formula references before applying this reviewed source layout. Never
// use this correction for an unrelated workbook just because columns look alike.
function sourceAllocationProfile(sh,header,ix){
 const names=['Imaging Informatics','Clinical Informatics','EI Other','AMD','HPM','S&RC','I&D','IP and S','IGT-D','IGT-S','MR','CT','DXR','PD Other','US','G and B','MCC','OHC','PH Other','Not allocated'];
 const index=c=>{let n=0;for(const x of c)n=n*26+x.charCodeAt(0)-64;return n-1;};
 if(key(sh.name)!=='bu'||key(header[index('AU')])!=='imaging informatics'||key(header[index('BO')])!=='imaging informatics')return null;
 const candidate=sh.rows.findIndex((r,i)=>i>4&&clean(r[ix.item])&&clean(r[ix.name])&&key(r[ix.name])!=='enterprise-wide charging');
 if(candidate<0)return null;const rn=candidate+1;
 for(const [local,external] of [['BQ','BN'],['BS','BO'],['CN','CC'],['CR','CE'],['DK','CP'],['DL','CQ']]){
  if(!(sh.formulas?.[local+rn]||'').includes("'[1]BU-Led initiatives 2027'!"+external+rn))return null;
 }
 return {name:'Reviewed shifted BU external-link layout',names,
  // Ordered leaf amounts from the linked workbook, excluding group subtotals.
  amountColumns:'BQ BS BT BX BY CB CE CH CK CN CR CT CV CW CZ DD DF DH DI DL'.split(' '),
  // The manually entered enterprise key uses its own formula-based layout.
  keyColumns:'BN BP BR BU BW BZ CC CF CI CL CO CQ CS CU CX DA DC DE DG DJ'.split(' '),index};
}
function reviewedAllocations(r,row,sh,profile){
 const keyRow=key(r.name)==='enterprise-wide charging',cols=keyRow?profile.keyColumns:profile.amountColumns;
 const allocations={},sources={};let valid=true;
 for(let i=0;i<cols.length;i++){
  const cell=cols[i]+r.sourceRow,raw=row[profile.index(cols[i])]??null,n=numberCell(raw),formula=sh.formulas?.[cell]||null;
  if(keyRow&&!new RegExp('^=IFERROR\\([A-Z]+\\$?'+r.sourceRow+'/\\$?Q\\$?'+r.sourceRow+',0\\)$','i').test(formula||''))valid=false;
  if(n!==null){allocations[profile.names[i]]=n;sources[profile.names[i]]={cell,formula,rawHeader:sh.rows[4]?.[profile.index(cols[i])]||'',resolvedRecipient:profile.names[i]};}
  else if(clean(raw)){valid=false;}
 }
 if(!keyRow){
  const ph=['G and B','MCC','OHC','PH Other'].reduce((s,n)=>s+(allocations[n]||0),0),subtotalCell='DK'+r.sourceRow,subtotal=numberCell(row[profile.index('DK')]);
  const leafTotal=Object.values(allocations).reduce((a,b)=>a+b,0);
  // PH subtotal is explicit source evidence when its detailed cells are blank.
  // Preserve the stated amount even for an incomplete or conflicting row;
  // the finance validator retains its gap or holds an overallocated key.
  // Never repair source conflicts by normalizing percentages.
  if(ph===0&&subtotal>0&&r.cost>0){
   allocations['Personal Health']=subtotal;sources['Personal Health']={cell:subtotalCell,formula:sh.formulas?.[subtotalCell]||null,rawHeader:sh.rows[4]?.[profile.index('DK')]||'',resolvedRecipient:'Personal Health',basis:'Source PH subtotal; leaf breakdown absent'};
  }
 }
 r.allocations=allocations;r.allocationSources=sources;r.allocationUnit=keyRow?'fraction':'kEUR';r.allocationProfile=profile.name;r.allocationEvidenceValid=valid;
}

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
  const ix={item:locate(['item no.']),plan:locate(['planisware id']),org:locate(['organization setting demand [bu, region, coe]']),name:locate(['initiative name']),type:locate(['type']),newCarry:locate(['new initiative or carry-over']),category:locate(['category']),platform:locate(['leading it platform']),area:locate(['investment area']),cost:locate(['it investment requested 2027 [k€]','it investment requested 2027 [keur]','it investment requested 2027 [k�]']),benefit:locate(['quantified benefits (in k€)','quantified benefits (in keur)','quantified benefits (in k�)']),benefitDuration:locate(['quantified benefit duration ( in years )','quantified benefit duration (in years)','quantified benefit duration (years)'],false),itGrouping:locate(['initiative grouping name'],false),plannedCarry:locate(['planned carryover'],false),extendedCarry:locate(['extended carryover'],false),pushedCarry:locate(['carryover pushed'],false),benefitDetails:locate(['quantified benefits (details)','qualitative benefit','quantified benefits details'],false),impact:locate(['impact and cost of not doing']),problem:locate(['problem statement']),scope:locate(['scope']),dependency:locate(['dependency','dependency (item no & explaination)']),overall:locate(['overall aop decision']),remarks:locate(['remarks / evidence'],false),lfrYear:locate(['lfr & compliancy year'],false),lfrName:locate(['lfr & compliancy (name)','lfr & compliancy name'],false),baselined:locate(['carry over baselined'],false),payback:locate(['payback period','payback','payback (years)'],false)};
  if(ix.itGrouping<0&&sheetName==='EW'&&key(header[4])==='blank')ix.itGrouping=4; // This supplied source labels the populated IT grouping column E as Blank.
  ix.band=locate(['decision band','waste','waste band'],true,i=>key(header[i])==='decision band'||key(header[i])==='waste band'||key(sub[i]).includes('band'));
  ix.priority=locate(['priority'],true,i=>i<ix.problem);
  const allocCols=[];{const usedIdxs=new Set(Object.values(ix));for(let ci=0;ci<header.length;ci++){if(usedIdxs.has(ci))continue;const hh=clean(header[ci]),hk=key(hh),sk=key(clean(sub[ci]||''));if(hh&&((hh.endsWith(' %')||hh.endsWith('%'))&&!hk.includes('capitalization'))||(sk==='%'||sk==='pct'||sk==='percent'||sk.includes('alloc%')||sk.includes('alloc %')))allocCols.push({buName:hh.replace(/\s*%$/,'').trim(),colIdx:ci});}}
  const allocationProfile=sourceAllocationProfile(sh,header,ix);
  const labels=header.map((h,i)=>(clean(h)||'Column '+(i+1))+(clean(sub[i])?' / '+clean(sub[i]):'')+' ['+col(i)+']');
  mappings.push({sheet:sh.name,fields:ix,sourceHeaders:labels,allocationProfile:allocationProfile?.name||null});
  for(let i=headerIdx+1;i<sh.rows.length;i++){
   const row=sh.rows[i]||[],get=k=>row[ix[k]]??null;
   const itemId=clean(get('item')),itemValid=itemId&&!/^0+$/.test(itemId);
   if(!itemValid&&!clean(get('name'))&&!clean(get('cost')))continue;
   const cost=numberCell(get('cost')),benefit=numberCell(get('benefit'));
   if(clean(get('cost'))&&cost===null)issues.push(sh.name+' row '+(i+1)+': requested amount is not numeric; retained on hold.');
   if(cost!==null&&cost<0)issues.push(sh.name+' row '+(i+1)+': requested amount is negative; retained on hold.');
   if(benefit!==null&&benefit<0)issues.push(sh.name+' row '+(i+1)+': negative benefit needs review.');
   const sourceValues=labels.map((label,c)=>({label,value:row[c]??null,formula:(sh.formulas||{})[col(c)+(i+1)]||null}));
   const bld=numberCell(get('baselined'));const pbk=paybackCell(ix.payback>=0?get('payback'):null);const r={id:itemValid?itemId:sh.name+'-row-'+(i+1),temporary:!itemValid,item:itemValid?itemId:'',planisware:clean(get('plan')),org:clean(get('org')),name:clean(get('name')),type:clean(get('type')),newCarry:clean(get('newCarry')),category:clean(get('category')),platform:clean(get('platform')),area:clean(get('area')),priority:clean(get('priority')),requestRaw:get('cost'),cost:cost===null?null:cost/1000,benefit:benefit===null?null:benefit/1000,benefitRaw:get('benefit'),benefitDetails:clean(get('benefitDetails')),impact:clean(get('impact')),problem:clean(get('problem')),scope:clean(get('scope')),dependency:clean(get('dependency')),decisionBand:clean(get('band')),overall:clean(get('overall')),remarks:clean(get('remarks')),lfrYear:clean(get('lfrYear')),lfrName:clean(get('lfrName')),baselined:bld===null?null:bld/1000,paybackYears:pbk.years,paybackRaw:pbk.raw,paybackStatus:pbk.status,stream:sheetName==='EW'?'ew':'bu',sourceSheet:sh.name,sourceRow:i+1,sourceValues};
   // Compare decision-relevant evidence only. Preserve the complete row separately for traceability.
   // This prevents formula-cache or unrelated source-column recalculation from holding valid decisions.
   if(ORG_RENAME[r.org])r.org=ORG_RENAME[r.org];
   r.sourceOrg=r.org;r.sourceType=r.type;r.itGrouping=clean(get('itGrouping'));
   const itGroups=['Cross BU','Cross BU & Functions','Cross Functions','Regions (NAM, GRC, IR)'];
   const itGroup=itGroups.find(g=>key(g)===key(r.itGrouping));
   if(key(r.org)==='information technology'&&itGroup){r.org=itGroup;r.itSubOrg=true;r.type=itGroup==='Cross BU'?'Type II - Cross BU':itGroup==='Cross BU & Functions'?'Type II - Cross BU & Functions':itGroup;}
   r.carryoverEvidence={planned:get('plannedCarry'),extended:get('extendedCarry'),pushed:get('pushedCarry')};
   const carryLabels=[['planned','Planned Carryover'],['extended','Extended Carryover'],['pushed','Carryover Pushed']];
   r.carryoverTypes=carryLabels.filter(([k])=>['yes','y','true','1'].includes(key(r.carryoverEvidence[k]))).map(([,label])=>label);
   if(!r.carryoverTypes.length)r.carryoverTypes=[Object.values(r.carryoverEvidence).some(v=>key(v)==='no info')?'No Info':'Not Captured'];
   r.carryoverType=r.carryoverTypes.join(' / ');
   const dr=ix.benefitDuration>=0?get('benefitDuration'):null,dn=numberCell(dr);
   r.benefitLifetime=r.benefit;r.benefitDurationRaw=dr;r.benefitDurationDefaulted=!clean(dr);
   r.benefitDurationYears=r.benefitDurationDefaulted?3:(dn!==null&&dn>0?dn:null);
   r.benefitDurationStatus=r.benefitDurationDefaulted?'Defaulted to 3 years':r.benefitDurationYears!==null?'Source duration':'Invalid duration';
   r.benefit=r.benefitLifetime===null||r.benefitDurationYears===null?null:r.benefitLifetime/r.benefitDurationYears;
   r.averageBenefit=r.benefit;

   // Fingerprint is assigned after allocation fields are available.
   if(allocCols.length){const allocs={};for(const ac of allocCols){const pct=numberCell(row[ac.colIdx]??null);if(pct!==null&&pct>=0)allocs[ac.buName]=pct;}if(Object.keys(allocs).length){r.allocations=allocs;r.allocationSources=Object.fromEntries(allocCols.map(ac=>[ac.buName,{cell:col(ac.colIdx)+(i+1),formula:(sh.formulas||{})[col(ac.colIdx)+(i+1)]||null}]));}}
   if(allocationProfile)reviewedAllocations(r,row,sh,allocationProfile);
   r.fingerprint=materialFingerprint(r);records.push(r);
  }
 }
 // Separate the "Enterprise-wide charging" row — it is a charging key, not a real Programs.
 // It must not inflate demand totals or enter prioritisation. Kept as ewChargingKey for Tab 6 allocation.
 let ewChargingKey=null;
 let programRecords=records.filter(r=>{if(r.name&&key(r.name)==='enterprise-wide charging'){ewChargingKey=r;return false;}return true;});
 // A source ID without a name or request is an unsubmitted template, not silent data loss.
  // Named or requested records remain in the live portfolio, including missing/error evidence.
  const templateRecords=[];programRecords=programRecords.filter(r=>{if(!r.name&&r.cost===null&&!clean(r.requestRaw)){templateRecords.push({...r,recordStatus:'Template / no submitted name or request',exclusionReason:'Template / no submitted name or request'});return false;}r.recordStatus='Program';return true;});
  const excludedRecords=templateRecords;
 const ids=new Set();for(const r of [...programRecords,...templateRecords]){if(ids.has(r.id))throw Error('Duplicate Item No.: '+r.id);ids.add(r.id);}for(const id of ['EW-11','EW-65','EW-71'])if(!ids.has(id))issues.push('Designated Legal and Compliance exception '+id+' is absent; confirm source identity.');
 return {schema:3,sourceFile:workbook.sourceFile,sourceHash:workbook.sourceHash,version:workbook.sourceHash.slice(0,12),records:programRecords,excludedRecords,templateRecords,ewChargingKey,workbook,issues,mappings};
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
function classifyBenefit(r,ratio,benefitSource,stage){
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
 if(stage===0){label=hasBenefit?'Regulatory obligation – BC not a funding driver':'Regulatory obligation – no BC submitted';}
 return {cls,label,flag};
}
function enrich(r,s,review={}){
 const sourceCost=r.cost;r={...r,sourceCost,cost:Number.isFinite(review.requested)?review.requested:r.cost};
 let st=stage(r);const isItSimp=st===3&&isITSimpProgram(r);if(s.itsimpMode&&isItSimp)st=4;const rawRatio=r.cost>0&&numeric(r.benefit)!==null?r.benefit/r.cost:null,c=consequence(r,review);
 const bm=s.benefitMode||'both',area=key(r.area),preClass=r.benefit>0&&HARD_AREAS.has(area)?'hard':(r.benefit>0?'soft':'none');
 const suppressed=st>=1&&st<=4&&bm!=='both'&&rawRatio!==null&&((bm==='hard'&&preClass!=='hard')||(bm==='soft'&&preClass==='hard'));
 const ratio=suppressed?null:rawRatio;
 let bp,benefitSource,qb=null;
 if(ratio!==null){bp=ratio<1?0:ratio<3?15:ratio<5?25:ratio<7?35:50;benefitSource='quantitative';}
 else if(REVPROD_RE.test(r.benefitDetails||'')){bp=0;benefitSource='revenue-productivity-unquantified';}
 else{qb=qualitativeBenefit(r);bp=qb.points;benefitSource=qb.points>0?'qualitative':'none';}
 const pp=key(r.priority)==='must do'?25:key(r.priority)==='must have'?18:key(r.priority).startsWith('deprior')?5:0;
 const dp=key(r.decisionBand)==='healthy'?10:key(r.decisionBand)==='contain'?6:0;
 const pk=r.paybackYears===null||r.paybackYears<=0?0:r.paybackYears<=1?10:r.paybackYears<=2?8:r.paybackYears<=3?6:r.paybackYears<=5?4:0;
 const raw=[bp,pp,c.points,dp,pk],components=raw.map((v,i)=>v/[50,25,15,10,10][i]*s.weights[i]),calculatedScore=round(components.reduce((a,b)=>a+b,0)),score=Number.isFinite(review.merit)&&clean(review.note)?review.merit:calculatedScore;
 const warnings=[],holds=[],d=key(r.overall);if(r.benefitDurationYears===null)warnings.push('Benefit duration invalid; average benefit and ratio unavailable');if(r.benefitDurationDefaulted&&r.benefitLifetime!==null)warnings.push('Benefit duration missing: 3-year assumption used');
  if(r.paybackStatus==='invalid')warnings.push('Payback source value is not an unambiguous number of years');
  if(r.paybackStatus==='nonpositive')warnings.push('Payback period must be positive for merit points');
  if(r.benefit===null)warnings.push(clean(r.benefitRaw)?'Quantified benefit is nonnumeric; source retained':'Quantified benefit not supplied');
  if(r.benefit!==null&&r.benefit<0){warnings.push('Negative submitted benefit requires review');holds.push('Negative benefit requires review');}
  if(r.cost===null&&clean(r.requestRaw))holds.push('Requested demand is nonnumeric');
  if(r.cost!==null&&r.cost<0)holds.push('Requested demand is negative');
  if(/^#/.test(r.decisionBand)||key(r.decisionBand)==='0')holds.push('Decision Band contains an uninterpretable source value');
 if(!r.decisionBand)warnings.push('Decision Band unassessed');if(!d)warnings.push('Overall AOP decision unassessed');
 if(!(sourceCost>0)&&r.cost>0)holds.push('Original source request missing, invalid or nonpositive');if(!r.name)holds.push('Programs name missing');if(!(r.cost>0))holds.push(r.cost===null?'Requested demand missing':'No positive requested demand');
 if(d.includes('priority tbd'))holds.push('Mandatory priority TBD');
 if(d&&!/^(healthy\s*-\s*rank in priority matrix|healthy\s*\/\s*must-do\s*-\s*(p1\s*-\s*immediate|p2\s*-\s*scheduled|priority tbd)|contain\s*-\s*conditions)$/.test(d))holds.push('Overall AOP decision needs mapping');
 if((key(r.decisionBand)==='contain'||d.startsWith('contain'))&&!hasCondition(r.remarks)&&!hasCondition(review.condition)){if(st===0)warnings.push('Mandatory obligation retained; Contain condition needs review');else holds.push('Contain condition needs review');}
 var isBaselinedCarry=st===1&&r.baselined>0,carryConfirmed=st===1&&isBaselinedCarry&&['must do','must have'].includes(key(r.priority));
 
 
 if(st===3&&score<s.merit)holds.push('Below advanced merit floor');
 
 if(benefitSource==='revenue-productivity-unquantified')warnings.push('Revenue/productivity claim requires quantified benefit');
 if(r.benefit!==null&&r.benefit>0&&(r.paybackYears===null||r.paybackYears<=0))warnings.push('Payback period missing for quantified benefit claim');
 if(r.temporary)warnings.push('Temporary source ID');
 const lfrTier=st===0?(key(r.overall).includes('p1')?'Immediate':key(r.overall).includes('p2')?'Scheduled':['EW-11','EW-65','EW-71'].includes(r.item)?'CCB':'Other'):'';const hasLfrEvidence=realLfr(r.lfrName)&&realLfr(r.lfrYear);const lfrExcoDecision=LFR_EXCO_DECISIONS[r.id];const lfrOptOut=!!lfrExcoDecision&&lfrExcoDecision.opt==='out';const lfrVerified=st===0&&!lfrOptOut&&(hasLfrEvidence||['EW-11','EW-65','EW-71'].includes(r.item));var carryFundCap=isBaselinedCarry?Math.min(r.cost,r.baselined):(st===1?r.cost:null);
 const exco=excoOf(r);
 if(lfrOptOut)warnings.push('Manual Exclusion');
 const bc=classifyBenefit(r,ratio,benefitSource,st);
 return {...r,stage:st,stageName:STAGES[st],calculatedScore,ratio,rawRatio:rawRatio,rawComponents:raw,components,score,consequence:c,qualBenefit:qb,benefitSource,benefitClass:bc.cls,benefitClassLabel:bc.label,benefitFlag:bc.flag,lfrTier,hasLfrEvidence,lfrVerified,lfrOptOut,isBaselinedCarry,carryConfirmed,carryFundCap,paybackPoints:pk,warnings,holds,eligible:!holds.length,review,condition:hasCondition(review.condition)?clean(review.condition):hasCondition(r.remarks)?r.remarks:'',priorityPoints:pp,exco,isItSimp};
}
function compare(a,b){if(a.stage!==b.stage)return a.stage-b.stage;if(a.stage===0){const va=a.lfrVerified?0:1,vb=b.lfrVerified?0:1;if(va!==vb)return va-vb;const seq=r=>{const d=key(r.overall);return d.includes('p1')?0:d.includes('p2')?1:['EW-11','EW-65','EW-71'].includes(r.item)?2:3;};const x=seq(a)-seq(b);if(x)return x;return b.score-a.score;}if(a.stage===1){return (b.ratio??-Infinity)-(a.ratio??-Infinity)||b.score-a.score;}if(a.stage===2){const st=r=>key(r.newCarry)==='change & sustain'?0:1;const x=st(a)-st(b);if(x)return x;return b.score-a.score;}return b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true});}
function leverTarget(s,k,demand){const v=s[k];if(!v||typeof v!=='object')return demand;return Math.min(demand,v.basis==='amount'?(v.amount||0):(v.basis==='bucket'?demand:s.budget)*v.pct/100);}
function switchBasis(s,k,basis,demand){if(!['lfr','carry','sustain','value','itsimp'].includes(k)||!['bucket','aop','amount'].includes(basis))throw Error('Unknown allocation control.');const next=clone(s),amount=leverTarget(s,k,demand),base=basis==='bucket'?demand:s.budget;if(basis==='aop'&&base===0&&amount>0)throw Error('Enter a positive Total AOP before converting this allocation to its percentage.');next[k]={basis,amount,pct:basis==='amount'?next[k].pct:base?amount/base*100:0};validateSettings(next);return next;}
function rebalance(s,changedKey,data){
 const keys=['lfr','carry','sustain','value'],ci=keys.indexOf(changedKey);if(ci<0||ci>=3)return;
 const rows=data.records.map(r=>enrich(r,s)),dem=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));
 let consumed=0;for(let i=0;i<=ci;i++)consumed+=Math.min(dem[i],leverTarget(s,keys[i],dem[i]));
 const remaining=Math.max(0,s.budget-consumed);
 let downTargets=[];for(let i=ci+1;i<4;i++)downTargets.push({i,key:keys[i],target:Math.min(dem[i],leverTarget(s,keys[i],dem[i]))});
 const downTotal=downTargets.reduce((a,d)=>a+d.target,0);
 if(downTotal<=remaining+1e-9)return;
 const scale=downTotal>0?remaining/downTotal:0;
 for(const d of downTargets){
  const newTarget=round(d.target*scale),v=s[d.key];
  if(v.basis==='amount'){v.amount=newTarget;}
  else if(v.basis==='aop'){v.pct=s.budget>0?round(newTarget/s.budget*100):0;}
  else{v.pct=dem[d.i]>0?round(newTarget/dem[d.i]*100):0;}
 }
}
function solveMustDo(data,s,overrides,reviews){
 const bs=clone(s);delete bs._mustDoOnTop;
 const baselineOverrides=Object.fromEntries(Object.entries(overrides).filter(([,o])=>o.policy==='lfr-opt-out'));
 const answer=solve(data,bs,baselineOverrides,reviews),base=clone(answer.totals);
 const baselineRows=answer.rows.map(r=>({id:r.id,final:r.final,automatic:r.automatic}));
 for(const r of answer.rows){
  r.baselineFinal=r.final;r.onTopAmount=0;
  if(r.isPmi||key(r.priority)!=='must do')continue;
  const o=overrides[r.id];
  if(o?.state==='needs-review')continue;
  if(!(r.sourceCost>0)||!(r.cost>0)||!r.name){r.warnings.push('Must Do on top requires a named program and positive source request');continue;}
  const desired=r.cost;
  const delta=Math.max(0,round(desired-r.final));
  if(!delta)continue;
  r.onTopAmount=delta;r.final=round(r.final+delta);r.automatic=round(r.automatic+delta);
  r.unfunded=round(r.cost-r.final);r.status=r.final<r.cost?'Partial scope (Must Do On Top)':'Funded (Must Do On Top)';
  r.reason='Balanced baseline '+r.baselineFinal+' M€ + Must Do on top '+delta+' M€';
  if(o?.policy==='lfr-opt-out'){r.warnings=r.warnings.filter(w=>w!=='Manual Exclusion');r.warnings.push('Baseline LFR opt-out superseded by submitted Must Do top-up');}
  if(r.holds.length)r.warnings.push('Must Do scenario evidence exception: '+r.holds.join('; '));
 }
 for(const r of answer.rows.filter(r=>!r.isPmi)){
  const o=overrides[r.id];r.override=o||null;
  if(!o||o.policy==='lfr-opt-out')continue;
  if(o.state==='needs-review'){r.warnings.push('Previous decision needs source review');continue;}
  const desired=o.choice==='exclude'?0:(o.amount??r.cost);
  if(!Number.isFinite(desired)||desired<0||(o.choice==='include'&&(!(r.sourceCost>0)||desired>r.cost+1e-9)))throw Error(r.id+': invalid prioritised amount.');
  r.final=round(desired);r.onTopAmount=Math.max(0,round(r.final-r.baselineFinal));r.unfunded=r.cost===null?null:round(r.cost-r.final);
  r.status=desired===0?'Excluded':desired<r.cost?'Partial scope':'Funded';r.reason=(o.choice==='exclude'?'Manual exclusion':'Manual inclusion / scope')+(o.note?': '+o.note:'');
 }
 const rows=answer.rows.filter(r=>!r.isPmi),added=rows.filter(r=>r.onTopAmount>0),newClaims=added.filter(r=>r.baselineFinal===0&&r.stage!==0);
 const t=answer.totals;
 t.allocation=sum(rows,r=>r.final);t.automatic=sum(rows,r=>r.automatic);t.manual=round(t.allocation-t.automatic);
 t.unfunded=sum(rows,r=>r.unfunded);t.available=Math.max(0,round(s.budget-t.allocation));t.over=Math.max(0,round(t.allocation-s.budget));
 t.count=rows.filter(r=>r.final>0).length;t.partial=rows.filter(r=>r.final>0&&r.final<r.cost).length;
 for(const st of answer.stages){const rs=rows.filter(r=>r.stageName===st.name);st.allocation=sum(rs,r=>r.final);st.automatic=sum(rs,r=>r.automatic);}
 for(const stream of ['ew','bu']){answer.streams[stream].allocation=sum(rows.filter(r=>r.stream===stream),r=>r.final);answer.streams[stream].automatic=sum(rows.filter(r=>r.stream===stream),r=>r.automatic);}
 const benefit=(rs,hard)=>sum(rs.filter(r=>r.final>0&&r.stage!==0&&(hard?r.benefitClass==='hard':r.benefitClass!=='hard')),r=>r.benefit);
 answer.mustDo={baseline:base,baselineRows,count:added.length,fullNewCount:added.filter(r=>r.baselineFinal===0).length,partialTopupCount:added.filter(r=>r.baselineFinal>0).length,amount:sum(added,r=>r.onTopAmount),hardBenefit:benefit(newClaims,true),softBenefit:benefit(newClaims,false),baselineHard:benefit(answer.rows.filter(r=>r.baselineFinal>0),true),baselineSoft:benefit(answer.rows.filter(r=>r.baselineFinal>0),false),held:rows.filter(r=>key(r.priority)==='must do'&&!(r.cost>0)).map(r=>r.id)};
 answer.selection.amounts=answer.stages.map((st,i)=>i>=3?st.allocation:st.target);answer.selection.exactTotal=sum(answer.selection.amounts,x=>x);answer.selection.displayedTotal=sum(answer.selection.amounts,x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10);
 const op=globalThis.OPS_DATA||(typeof document!=='undefined'?JSON.parse(document.getElementById('ops-data').textContent):null);
 answer.finance=finance(data,answer,op);return answer;
}

function solve(data,s,overrides={},reviews={}){
 if(s._mustDoOnTop)return solveMustDo(data,s,overrides,reviews);
 validateSettings(s);const allEnriched=data.records.map(r=>enrich(r,s,reviews[r.id]));
 const pmiRows=allEnriched.filter(r=>key(r.type)==='pmi'),nonPmiRows=allEnriched.filter(r=>key(r.type)!=='pmi');
 pmiRows.forEach(r=>{const valid=r.sourceCost>0&&r.cost>0;r.automatic=valid?r.cost:0;r.final=r.automatic;r.unfunded=r.cost===null?null:round(r.cost-r.final);r.status=valid?'Funded (PMI On Top)':'Held (PMI On Top)';r.reason=valid?'PMI — auto-prioritised on top off AOP budget':r.holds.join('; ');r.isPmi=true;r.eligible=valid;if(valid)r.holds=[];});
 const rows=nonPmiRows.sort(compare),demand=STAGES.map((_,i)=>sum(rows.filter(r=>r.stage===i),r=>r.cost));
 const verifiedDemand0=sum(rows.filter(r=>r.stage===0&&r.lfrVerified),r=>r.cost);
 const targets=[leverTarget(s,'lfr',demand[0]),leverTarget(s,'carry',demand[1]),leverTarget(s,'sustain',demand[2]),leverTarget(s,'value',demand[3]),s.itsimpMode?leverTarget(s,'itsimp',demand[4]):0],spent=[0,0,0,0,0],rank=[0,0,0,0,0];let automatic=0;
 const residual=()=>Math.max(0,round(s.budget*(1+s.tolerance/100)-spent.slice(0,3).reduce((a,b)=>a+b,0)));const itsimpReserve=()=>s.itsimpMode&&demand[4]>0?Math.min(targets[4]||0,demand[4]):0;const valueTarget=()=>targets[3]!==null?Math.min(Math.max(0,residual()-itsimpReserve()),targets[3]*(1+s.tolerance/100)):Math.max(0,residual()-itsimpReserve());
 for(const r of rows){r.rank=++rank[r.stage];r.automatic=0;r.reason=r.holds.join('; ');const o=overrides[r.id];r.override=o||null;
  if(o&&o.state!=='needs-review'&&o.choice==='exclude'){r.final=0;r.reason='Manual exclusion'+(o.note?': '+o.note:'');r.unfunded=r.cost===null?null:round(r.cost);r.status='Excluded';continue;}
  if(r.eligible){const stageLimit=r.stage===3?valueTarget():r.stage===4?(targets[4]!==null?Math.min(demand[4],targets[4]*(1+s.tolerance/100)):residual()):targets[r.stage]===null?Infinity:Math.min(demand[r.stage],targets[r.stage]*(1+s.tolerance/100));if(spent[r.stage]+(r.stage===1?r.carryFundCap:r.cost)>stageLimit+1e-9)r.reason='Whole program does not fit stage target plus tolerance';else if(automatic+(r.stage===1?r.carryFundCap:r.cost)>s.budget*(1+s.tolerance/100)+1e-9)r.reason='Whole program does not fit Total AOP plus tolerance';else{r.automatic=r.stage===1&&r.carryFundCap!==null?r.carryFundCap:r.cost;spent[r.stage]+=r.automatic;automatic+=r.automatic;r.reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank;}}
  r.final=r.automatic;
  if(o&&o.state!=='needs-review'){if(o.choice==='include'){const amount=o.amount??r.cost;if(!Number.isFinite(amount)||amount<0||!(r.sourceCost>0)||!(r.cost>0)||amount>r.cost+1e-9)throw Error(r.id+': invalid prioritised amount.');r.final=round(amount);r.reason=(r.final<r.cost?'Manual scope amount':'Manual inclusion')+(o.note?': '+o.note:'');}}
  if(o?.state==='needs-review')r.warnings.push('Previous decision needs source review');
  if(r.final>0&&r.holds.length)r.warnings.push('Manual evidence exception: '+r.holds.join('; '));
  r.unfunded=r.cost===null?null:round(r.cost-r.final);r.status=r.final>0?(r.final<r.cost?'Partial scope':'Funded'):(o?.choice==='exclude'&&o.state!=='needs-review'?'Excluded':'Not funded');
 }
 const valueAvailable=residual();targets[3]=valueTarget();
 const allocation=sum(rows,r=>r.final),requested=sum(rows,r=>r.cost),auto=sum(rows,r=>r.automatic);
 const totals={requested,allocation,automatic:auto,manual:round(allocation-auto),unfunded:sum(rows,r=>r.unfunded),available:Math.max(0,round(s.budget-allocation)),over:Math.max(0,round(allocation-s.budget)),count:rows.filter(r=>r.final>0).length,partial:rows.filter(r=>r.status==='Partial scope').length,missing:rows.filter(r=>r.cost===null).length};
 const confirmedCarryDemand=sum(rows.filter(r=>r.stage===1&&r.carryConfirmed),r=>r.carryFundCap||r.cost);
 const decommInValue=sum(rows.filter(r=>r.stage===3&&r.isItSimp),r=>r.cost);
 const decommFundedInValue=sum(rows.filter(r=>r.stage===3&&r.isItSimp&&r.final>0),r=>r.final);
 const decommInStage4=sum(rows.filter(r=>r.stage===4),r=>r.cost);
 const decommFundedInStage4=sum(rows.filter(r=>r.stage===4&&r.final>0),r=>r.final);
 if(s._balancedPortfolio){
  for(const r of rows){const o=overrides[r.id];if(o&&o.state!=='needs-review'&&(o.choice==='include'||o.choice==='exclude'))r._protected=true;}
  const REGION_ORGS=new Set(['International Regions','North America','Greater China']);
  const isRegion=r=>REGION_ORGS.has(r.org);
  const ewCap=s._ewTarget||35,regCap=s._regTarget||5,buCap=s._buLedTarget||53;
  const isManualInclude=r=>{const o=overrides[r.id];return o&&o.state!=='needs-review'&&o.choice==='include';};
  function bpDefund(r){if(isManualInclude(r))return 0;const was=r.final;r.final=0;r.automatic=0;r.unfunded=r.cost;r.status='Not funded';spent[r.stage]-=was;automatic-=was;return was;}
  function bpFund(r,reason){if(s._lfrCap&&r.stage===0){const lfrCur=sum(rows.filter(x=>x.stage===0&&x.final>0),x=>x.final);if(lfrCur+r.cost>s._lfrCap+0.05)return 0;}if(r.stage===1&&!r.carryConfirmed)return 0;r.final=r.cost;r.automatic=r.cost;r.unfunded=0;r.status='Funded';r.reason=reason;spent[r.stage]+=r.cost;automatic+=r.cost;return r.cost;}
  const isExcluded=r=>{const o=overrides[r.id];return o&&o.state!=='needs-review'&&o.choice==='exclude';};
  const bk=r=>isRegion(r)?'reg':r.stream==='ew'?'ew':'bu';
  const bkSum=b=>sum(rows.filter(r=>bk(r)===b&&r.final>0&&!isManualInclude(r)),r=>r.final);
  const gRoom=()=>round(s.budget-sum(rows.filter(r=>r.final>0&&!isManualInclude(r)),r=>r.final));
  const bCap={ew:ewCap,reg:regCap,bu:buCap};
  // Phase 0: LFR cap — defund lowest-merit LFR programs above the cap
  if(s._lfrCap){const lfrCap=s._lfrCap;let lfrNow=sum(rows.filter(r=>r.stage===0&&r.final>0),r=>r.final);if(lfrNow>lfrCap+0.05){const lfrCands=rows.filter(r=>r.stage===0&&r.final>0&&!r.lfrVerified).sort((x,y)=>x.score-y.score);for(const c of lfrCands){if(lfrNow<=lfrCap+0.05)break;lfrNow-=bpDefund(c);c.reason='Whole program does not fit stage target (LFR limit '+lfrCap+' M€)';c._lfrCapped=true;}if(lfrNow>lfrCap+0.05){const lfrVerCands=rows.filter(r=>r.stage===0&&r.final>0).sort((x,y)=>x.score-y.score);for(const c of lfrVerCands){if(lfrNow<=lfrCap+0.05)break;lfrNow-=bpDefund(c);c.reason='Whole program does not fit stage target (LFR limit '+lfrCap+' M€, verified)';c._lfrCapped=true;}}}}
  // Phase 0b: Carry-over — ONLY confirmed baseline programs. Defund all others unconditionally.
  {const carryCands=rows.filter(r=>r.stage===1&&r.final>0&&!r.carryConfirmed);
  for(const c of carryCands){bpDefund(c);c.reason='No confirmed approved baseline for Carry Over funding';}}
  // Phase 0c-0e: Balanced Investment category allocations (CCB 70%, ISC 10M, STO 20M, NAR inclusion)
  const CCB_SUST_IDS=new Set(['EW-07','EW-10','EW-27','EW-42','EW-44','EW-178','EW-180']);
  const isCcbSust=r=>CCB_SUST_IDS.has(r.item)||CCB_SUST_IDS.has(r.id)||(/\bccb\b/i.test(r.name)&&r.stage===2&&!['EW-11','EW-65','EW-71'].includes(r.item));
  const stageReason=(r,suffix)=>'Funded in '+STAGES[r.stage]+' at rank '+r.rank+(suffix?' — '+suffix:'');
  function bpFundForced(r,suffix){if(isExcluded(r))return 0;if(isManualInclude(r))return 0;r.final=r.cost;r.automatic=r.cost;r.unfunded=0;r.status='Funded';r.reason=stageReason(r,suffix);r._protected=true;spent[r.stage]+=r.cost;automatic+=r.cost;return r.cost;}
  function bpPartialForced(r,amount,suffix){r.final=round(amount);r.automatic=round(amount);r.unfunded=round(r.cost-amount);r.status='Partial scope';r.reason=stageReason(r,suffix||'Partial scope');r._protected=true;spent[r.stage]+=round(amount);automatic+=round(amount);return round(amount);}
  // Phase 0c: CCB Sustaining at 70%
  if(s._ccb70){for(const r of rows){if(isCcbSust(r)&&!isExcluded(r)&&!isManualInclude(r)){const full=r.cost;if(full<=0)continue;const funded70=round(full*0.7);const wasFunded=r.final>0;const reason='Funded in '+STAGES[r.stage]+' at rank '+r.rank+' — Partial scope (70% of '+full.toFixed(1)+' M€)';if(!wasFunded){r.final=funded70;r.automatic=funded70;r.unfunded=round(full-funded70);r.status='Partial scope';r.reason=reason;r._protected=true;spent[r.stage]+=funded70;automatic+=funded70;}else{const diff=round(r.final-funded70);r.final=funded70;r.automatic=funded70;r.unfunded=round(full-funded70);r.status='Partial scope';r.reason=reason;r._protected=true;spent[r.stage]-=diff;automatic-=diff;}}}}
  // Phase 0c2: Protect CCB-LFR from defunding
  for(const r of rows){if(['EW-11','EW-65','EW-71'].includes(r.item)&&r.final>0)r._protected=true;}
  // Phase 0c3: NAR inclusion — ensure EW-28 is funded and protected
  if(s._ccb70){const narLfr=rows.find(r=>r.item==='EW-28'||r.id==='EW-28');if(narLfr&&narLfr.final===0&&narLfr.cost>0){bpFundForced(narLfr,'Legal & Compliance obligation');}}
  // Phase 0d: ISC category allocation — carryovers first, benefit-ranked, up to ISC target
  if(s._iscTarget){const ISC_ORGS=new Set(['Integrated Supply Chain (ISC)','SusTaining Engg. Team (STET - ISC)']);const iscTarget=s._iscTarget;const iscRows=rows.filter(r=>ISC_ORGS.has(r.org)&&!['EW-11','EW-65','EW-71'].includes(r.item)&&!isCcbSust(r));const iscAlreadyFunded=sum(iscRows.filter(r=>r.final>0),r=>r.final);let iscBudget=Math.max(0,iscTarget-iscAlreadyFunded);const iscCarry=iscRows.filter(r=>key(r.newCarry)==='carry over'&&r.final===0&&r.cost>0&&!isExcluded(r)).sort((a,b)=>(b.ratio||0)-(a.ratio||0)||(key(b.priority)==='must do'?1:0)-(key(a.priority)==='must do'?1:0)||b.score-a.score);for(const c of iscCarry){if(iscBudget<0.05)break;if(c.cost<=iscBudget+0.05){bpFundForced(c,'Carry-over priority, benefit-ranked');iscBudget-=c.cost;}else{bpPartialForced(c,iscBudget,'Partial scope ('+iscBudget.toFixed(1)+' of '+c.cost.toFixed(1)+' M€)');iscBudget=0;}}if(iscBudget>0.05){const iscNew=iscRows.filter(r=>key(r.newCarry)!=='carry over'&&r.final===0&&r.cost>0&&!isExcluded(r)).sort((a,b)=>(b.ratio||0)-(a.ratio||0)||b.score-a.score);for(const c of iscNew){if(iscBudget<0.05)break;if(c.cost<=iscBudget+0.05){bpFundForced(c,'Merit-ranked, benefit priority');iscBudget-=c.cost;}else{bpPartialForced(c,iscBudget,'Balanced: ISC new partial ('+iscBudget.toFixed(1)+' of '+c.cost.toFixed(1)+' M€)');iscBudget=0;}}}}
  // Phase 0e: STO category allocation — carryovers first, benefit-ranked, up to STO target
  if(s._stoTarget){const STO_ORGS=new Set(['Service Transformation Office (STO)']);const stoTarget=s._stoTarget;const stoRows=rows.filter(r=>STO_ORGS.has(r.org)&&!['EW-11','EW-65','EW-71'].includes(r.item)&&!isCcbSust(r));const stoAlreadyFunded=sum(stoRows.filter(r=>r.final>0),r=>r.final);let stoBudget=Math.max(0,stoTarget-stoAlreadyFunded);const stoCarry=stoRows.filter(r=>key(r.newCarry)==='carry over'&&r.final===0&&r.cost>0&&!isExcluded(r)).sort((a,b)=>(b.ratio||0)-(a.ratio||0)||(key(b.priority)==='must do'?1:0)-(key(a.priority)==='must do'?1:0)||b.score-a.score);for(const c of stoCarry){if(stoBudget<0.05)break;if(c.cost<=stoBudget+0.05){bpFundForced(c,'Carry-over priority, benefit-ranked');stoBudget-=c.cost;}else{bpPartialForced(c,stoBudget,'Partial scope ('+stoBudget.toFixed(1)+' of '+c.cost.toFixed(1)+' M€)');stoBudget=0;}}if(stoBudget>0.05){const stoNew=stoRows.filter(r=>key(r.newCarry)!=='carry over'&&r.final===0&&r.cost>0&&!isExcluded(r)).sort((a,b)=>(b.ratio||0)-(a.ratio||0)||b.score-a.score);for(const c of stoNew){if(stoBudget<0.05)break;if(c.cost<=stoBudget+0.05){bpFundForced(c,'Merit-ranked, benefit priority');stoBudget-=c.cost;}else{bpPartialForced(c,stoBudget,'Partial scope ('+stoBudget.toFixed(1)+' of '+c.cost.toFixed(1)+' M€)');stoBudget=0;}}}}
  // Phase 1: Cap F&R and BU first, then regions. EW cap defunds only VALUE stage (protects sustain), then carry, then unverified LFR.
  for(const b of ['ew','bu','reg']){
    let cur=bkSum(b);
    if(cur>bCap[b]+0.05){
      const protLfr=b!=='reg';
      const cands=rows.filter(r=>bk(r)===b&&r.final>0&&!r._protected&&(protLfr?r.stage>=3:true)&&r.stage!==4).sort((x,y)=>x.score-y.score);
      for(const c of cands){if(cur<=bCap[b]+0.05)break;cur-=bpDefund(c);c.reason='Whole program does not fit '+(b==='reg'?'Regions':b==='ew'?'Functions & Regions':'BU Led')+' stage target ('+bCap[b]+' M€)';}
      if(b==='ew'&&cur>bCap[b]+0.05){const ewS2=rows.filter(r=>bk(r)==='ew'&&r.final>0&&!r._protected&&r.stage===2).sort((x,y)=>x.score-y.score);for(const c of ewS2){if(cur<=bCap[b]+0.05)break;cur-=bpDefund(c);c.reason='Whole program does not fit Functions & Regions stage target ('+bCap[b]+' M€)';}}
      if(b==='ew'&&cur>bCap[b]+0.05){const ewS1=rows.filter(r=>bk(r)==='ew'&&r.final>0&&!r._protected&&r.stage===1).sort((x,y)=>x.score-y.score);for(const c of ewS1){if(cur<=bCap[b]+0.05)break;cur-=bpDefund(c);c.reason='Whole program does not fit Functions & Regions stage target ('+bCap[b]+' M€)';}}
      if(b==='ew'&&cur>bCap[b]+0.05){const lfrCands=rows.filter(r=>bk(r)==='ew'&&r.final>0&&!r._protected&&r.stage===0&&!r.lfrVerified).sort((x,y)=>x.score-y.score);for(const c of lfrCands){if(cur<=bCap[b]+0.05)break;cur-=bpDefund(c);c.reason='Whole program does not fit Functions & Regions stage target ('+bCap[b]+' M€)';}}
    }
  }
  // Phase 2: Region per-org minimum fill — ensure GRC gets fair share, reduce IR if over-allocated
  const regOrgs=[...REGION_ORGS].sort((a,b)=>sum(rows.filter(r=>r.org===a&&r.final>0),r=>r.final)-sum(rows.filter(r=>r.org===b&&r.final>0),r=>r.final));
  const perOrgMin=regOrgs.length>0?round(regCap/regOrgs.length*0.8):regCap;
  for(const org of regOrgs){
    let orgCur=sum(rows.filter(r=>r.org===org&&r.final>0),r=>r.final);
    if(orgCur<perOrgMin-0.05){
      const orgCands=rows.filter(r=>r.org===org&&r.final===0&&r.cost>0&&!isExcluded(r)&&!r._lfrCapped).sort((x,y)=>y.score-x.score);
      for(const c of orgCands){
        if(orgCur>=perOrgMin-0.05)break;
        let regNow=bkSum('reg');let room=gRoom();
        if(regNow+c.cost>regCap+0.05||room<c.cost-0.05){
          const otherCands=rows.filter(r=>isRegion(r)&&r.org!==org&&r.final>0&&!r._protected&&r.stage>=1&&r.stage!==4).sort((x,y)=>x.score-y.score);
          let freed=0;const needToFree=Math.max(regNow+c.cost-regCap,c.cost-room)+0.05;
          for(const dd of otherCands){if(freed>=needToFree)break;freed+=bpDefund(dd);dd.reason='Whole program does not fit Regions stage target ('+regCap+' M€)';}
        }
        regNow=bkSum('reg');room=gRoom();
        if(regNow+c.cost>regCap+0.05||room<c.cost-0.05)continue;
        bpFundForced(c,'Merit-ranked, region priority');orgCur+=c.cost;
      }
    }
  }
  // Phase 3: Fill remaining buckets — regions first to reach 5M, then BU, then F&R
  const regEwSpend=sum(rows.filter(r=>isRegion(r)&&r.stream==='ew'&&r.final>0),r=>r.final);
  const adjEwCap=ewCap-regEwSpend;
  {let regCur=bkSum('reg');if(regCur<regCap-0.05){const regFillCands=rows.filter(r=>isRegion(r)&&bk(r)==='reg'&&r.final===0&&r.cost>0&&!isExcluded(r)&&!r._lfrCapped).sort((x,y)=>y.score-x.score);for(const c of regFillCands){const room=gRoom();if(regCur>=regCap-0.05||room<c.cost-0.05)break;if(c.cost>regCap-regCur+0.05)continue;bpFundForced(c,'Merit-ranked, region priority');regCur+=c.cost;}}}
  for(const b of ['bu','ew']){
    const effCap=b==='ew'?adjEwCap:bCap[b];
    let cur=bkSum(b);
    if(cur<effCap-0.05){
      const cands=rows.filter(r=>bk(r)===b&&r.final===0&&r.eligible&&r.cost>0&&!isExcluded(r)&&!r._lfrCapped).sort((x,y)=>y.score-x.score);
      for(const c of cands){const room=gRoom();if(cur>=effCap-0.05||room<c.cost-0.05)break;if(c.cost>effCap-cur+0.05)continue;cur+=bpFund(c,'Funded in '+STAGES[c.stage]+' at rank '+c.rank+' — Merit-ranked');}
    }
  }
  // Phase 4: Fill remaining headroom with highest hard-benefit programmes to maximize impact
  {let room=gRoom();if(room>0.05){const hardCands=rows.filter(r=>r.final===0&&r.cost>0&&r.cost<=room+0.05&&!isExcluded(r)&&!r._lfrCapped&&r.benefitClass==='hard').sort((a,b)=>(b.ratio||0)-(a.ratio||0)||b.score-a.score);for(const c of hardCands){room=gRoom();if(room<0.05)break;if(c.cost>room+0.05)continue;bpFundForced(c,'Merit-ranked, hard benefit priority');}}room=gRoom();if(room>0.05){const softCands=rows.filter(r=>r.final===0&&r.cost>0&&r.cost<=room+0.05&&!isExcluded(r)&&!r._lfrCapped&&r.benefit>0).sort((a,b)=>(b.ratio||0)-(a.ratio||0)||b.score-a.score);for(const c of softCands){room=gRoom();if(room<0.05)break;if(c.cost>room+0.05)continue;bpFundForced(c,'Merit-ranked, benefit priority');}}}
 }
 if(s._balancedPortfolio){const bpAlloc=sum(rows,r=>r.final);totals.allocation=bpAlloc;totals.count=rows.filter(r=>r.final>0).length;totals.partial=rows.filter(r=>r.status==='Partial scope').length;totals.unfunded=sum(rows,r=>r.unfunded);totals.available=Math.max(0,round(s.budget-bpAlloc));totals.over=Math.max(0,round(bpAlloc-s.budget));totals.automatic=sum(rows,r=>r.automatic);totals.manual=round(bpAlloc-totals.automatic);}
 const valueCeiling=round(Math.min(demand[3],valueAvailable));const valueCeilingPct=demand[3]>0?round(valueCeiling/demand[3]*100):0;
 const stages=STAGES.map((name,i)=>({name,demand:demand[i],fundableDemand:demand[i],confirmedCarryDemand:i===1?confirmedCarryDemand:undefined,verifiedDemand:i===0?verifiedDemand0:undefined,target:targets[i],automatic:sum(rows.filter(r=>r.stage===i),r=>r.automatic),allocation:sum(rows.filter(r=>r.stage===i),r=>r.final),decommDemand:i===3?decommInValue:i===4?decommInStage4:undefined,decommFunded:i===3?decommFundedInValue:i===4?decommFundedInStage4:undefined,ceiling:i===3?valueCeiling:undefined,ceilingPct:i===3?valueCeilingPct:undefined}));
 const selectionAmounts=stages.map((stage,i)=>(i===3||i===4)?stage.allocation:stage.target),selection={amounts:selectionAmounts,exactTotal:sum(selectionAmounts,x=>x),displayedTotal:sum(selectionAmounts,x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10)};
 const pmiTotal={count:pmiRows.length,requested:sum(pmiRows,r=>r.cost),funded:sum(pmiRows,r=>r.final)};
 const allRows=rows.concat(pmiRows);
 const answer={version:VERSION,rows:allRows,totals,stages,valueAvailable,selection,pmi:pmiTotal,streams:Object.fromEntries(['ew','bu'].map(x=>[x,{requested:sum(rows.filter(r=>r.stream===x),r=>r.cost),automatic:sum(rows.filter(r=>r.stream===x),r=>r.automatic),allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};
 const op=globalThis.OPS_DATA||(typeof document!=='undefined'?JSON.parse(document.getElementById('ops-data').textContent):null);answer.finance=finance(data,answer,op);return answer;
}
function autoLfrPct(data,s){if(!s._autoLfr)return;delete s._autoLfr;const rows=data.records.filter(r=>key(r.type)!=='pmi').map(r=>enrich(r,s)),s0=rows.filter(r=>r.stage===0),total=sum(s0,r=>r.cost),verified=sum(s0.filter(r=>r.lfrVerified),r=>r.cost);s.lfr.pct=total>0?round(verified/total*100):100;}
function autoCarryAmt(data,s){if(!s._autoCarry)return;delete s._autoCarry;const rows=data.records.filter(r=>key(r.type)!=='pmi').map(r=>enrich(r,s)),s1=rows.filter(r=>r.stage===1),total=sum(s1,r=>r.cost),confirmed=sum(s1.filter(r=>r.carryConfirmed),r=>r.carryFundCap||r.cost);s.carry={basis:'bucket',amount:round(confirmed),pct:total>0?round(confirmed/total*100):0};}
const LFR_EXCO_DECISIONS={"EW-127":{opt:"out",fb:"",exco:"Shez Partovi"},"EW-04":{opt:"in",fb:"",exco:"Marnix van Ginneken"},"EW-181":{opt:"in",fb:"",exco:"Marnix van Ginneken"},"EW-28":{opt:"in",fb:"",exco:"Jeff DiLullo"},"EW-68":{opt:"in",fb:"",exco:"Carla Rosana Goulart Silva Peron"},"EW-142":{opt:"out",fb:"Decomm",exco:"Laura Matz"},"EW-45":{opt:"in",fb:"",exco:"Özlem Fidanci"},"EW-124":{opt:"in",fb:"",exco:"Shez Partovi"},"EW-21":{opt:"in",fb:"",exco:"Ling Liu"},"EW-22":{opt:"in",fb:"",exco:"Ling Liu"},"EW-25":{opt:"out",fb:"No referral to law or regulation. Most likely an unplanned carry-over",exco:"Ling Liu"},"EW-19":{opt:"out",fb:"No referral to law or regulation. Most likely an unplanned carry-over",exco:"Steve C de Baca"},"EW-24":{opt:"in",fb:"",exco:"Ling Liu"},"EW-72":{opt:"out",fb:"Decom",exco:"Laura Matz"},"EW-23":{opt:"out",fb:"more of a Carry-over",exco:"Ling Liu"},"EW-67":{opt:"in",fb:"BoM approved",exco:"Carla Rosana Goulart Silva Peron"},"EW-69":{opt:"in",fb:"",exco:"Carla Rosana Goulart Silva Peron"},"EW-162":{opt:"out",fb:"No law or regulation mentioned. Productivity improvement.",exco:"Steve C de Baca"},"EW-154":{opt:"out",fb:"1% chance of getting audited. Risking 500K",exco:"Ling Liu"},"EW-61":{opt:"out",fb:"Productivity and improvement (no immediate law of regulatory link)",exco:"Özlem Fidanci"},"EW-60":{opt:"out",fb:"no direct link to law or regulation (all potential risks)",exco:"Marnix van Ginneken"},"EW-102":{opt:"out",fb:"no direct link to law or regulation",exco:"Laura Matz"},"EW-46":{opt:"in",fb:"",exco:"Özlem Fidanci"},"EW-163":{opt:"out",fb:"no direct link to law or regulation (all potential risks)",exco:"Ling Liu"},"EW-47":{opt:"in",fb:"",exco:"Özlem Fidanci"},"EW-83":{opt:"in",fb:"",exco:"Charlotte Hanneman"},"EW-20":{opt:"out",fb:"no direct link to law or regulation (all internal compliance improvements)",exco:"Steve C de Baca"},"EW-165":{opt:"in",fb:"",exco:"Ling Liu"},"EW-119":{opt:"out",fb:"",exco:"Ling Liu"},"EW-59":{opt:"out",fb:"",exco:"Laura Matz"},"EW-80":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Charlotte Hanneman"},"EW-77":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Charlotte Hanneman"},"EW-11":{opt:"in",fb:"",exco:"Laura Matz"},"EW-71":{opt:"in",fb:"",exco:"Charlotte Hanneman"},"EW-65":{opt:"in",fb:"",exco:"Laura Matz"},"EW-189":{opt:"out",fb:"NDA, separate bucket (on top off)",exco:"Charlotte Hanneman"},"Bu-06":{opt:"in",fb:"",exco:"Wim Appelo"},"Bu-51":{opt:"in",fb:"",exco:"Julia Strandberg"},"Bu-104":{opt:"in",fb:"",exco:"Julia Strandberg"},"EW-10":{opt:"in",fb:"",exco:"Laura Matz"},"Bu-61":{opt:"out",fb:"No law/regulation mentioned. More of a productivity improvement",exco:"Bert van Meurs"},"Bu-309":{opt:"in",fb:"",exco:"Deeptha Khanna"},"Bu-96":{opt:"out",fb:"No law/regulation mentioned. More of a productivity",exco:"Julia Strandberg"},"Bu-109":{opt:"out",fb:"General statement CD. No law/regulation mentioned.",exco:"Julia Strandberg"},"Bu-284":{opt:"in",fb:"",exco:"Deeptha Khanna"},"EW-70":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Carla Rosana Goulart Silva Peron"},"Bu-97":{opt:"out",fb:"General statement CD. No law/regulation mentioned.",exco:"Julia Strandberg"},"Bu-391":{opt:"out",fb:"Productiviy improvement. No law or regulation mentioned",exco:"Jie Xue"},"EW-135":{opt:"out",fb:"Continuous improvement phase (had funding past 4 years)",exco:"Marnix van Ginneken"},"Bu-193":{opt:"in",fb:"",exco:"Jie Xue"},"Bu-103":{opt:"in",fb:"Audit agency checking Philips",exco:"Julia Strandberg"},"EW-62":{opt:"in",fb:"",exco:"Filip Koek"},"Bu-283":{opt:"in",fb:"",exco:"Deeptha Khanna"},"Bu-316":{opt:"in",fb:"",exco:"Deeptha Khanna"},"EW-161":{opt:"in",fb:"",exco:"Ling Liu"},"Bu-117":{opt:"in",fb:"General statement on CD. (program funded past 4 years)",exco:"Julia Strandberg"},"Bu-68":{opt:"out",fb:"General statement on potential external audit... (no direct law/regulation)",exco:"Özlem Fidanci"},"Bu-101":{opt:"out",fb:"No law of regulation mentioned",exco:"Julia Strandberg"},"EW-63":{opt:"in",fb:"",exco:"Filip Koek"},"EW-64":{opt:"in",fb:"",exco:"Marnix van Ginneken"},"Bu-294":{opt:"in",fb:"",exco:"Deeptha Khanna"},"Bu-116":{opt:"out",fb:"General statement on CD. (program funded past 4 years)",exco:"Julia Strandberg"},"EW-180":{opt:"in",fb:"",exco:"Marnix van Ginneken"},"Bu-392":{opt:"in",fb:"",exco:"Jie Xue"},"Bu-105":{opt:"in",fb:"",exco:"Julia Strandberg"},"Bu-365":{opt:"in",fb:"",exco:"Jie Xue"},"Bu-106":{opt:"in",fb:"",exco:"Julia Strandberg"},"EW-13":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Laura Matz"},"Bu-433":{opt:"in",fb:"",exco:"Bert van Meurs"},"EW-50":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Steve C de Baca"},"EW-37":{opt:"out",fb:"No law/regulation. More of a productivity improvement",exco:"Laura Matz"},"Bu-385":{opt:"in",fb:"",exco:"Jie Xue"},"EW-66":{opt:"out",fb:"No law/regulation. Cost avoidance and efficiency to internal",exco:"Carla Rosana Goulart Silva Peron"},"Bu-355":{opt:"in",fb:"",exco:"Jie Xue"},"Bu-353":{opt:"in",fb:"",exco:"Jie Xue"},"EW-178":{opt:"in",fb:"",exco:"Marnix van Ginneken"},"Bu-297":{opt:"in",fb:"",exco:"Deeptha Khanna"},"EW-155":{opt:"in",fb:"",exco:"Ling Liu"}};
function applyLfrDecisions(session){const ids=new Set(session.data.records.map(r=>r.id)),overrides={};for(const [id,d] of Object.entries(LFR_EXCO_DECISIONS)){if(!ids.has(id))continue;if(d.opt==='out'){overrides[id]={choice:'exclude',amount:0,note:'',policy:'lfr-opt-out',fingerprint:session.data.records.find(r=>r.id===id)?.fingerprint||'',state:'active'};}}return overrides;}
function autoValueCeiling(data,s,overrides){if(!s._autoValue)return;delete s._autoValue;var pre=solve(data,s,overrides||{},{});var ceil=pre.stages[3].ceilingPct;if(ceil!==undefined)s.value={basis:'bucket',pct:round(ceil)};}
function autoAdjustLevers(data,s,overrides,reviews){if(s._mustDoOnTop)return;var r=solve(data,s,overrides,reviews);var levers=[['lfr',0],['sustain',2],['value',3]];levers.forEach(function(lv){var k=lv[0],si=lv[1];var stg=r.stages[si];if(!stg||stg.demand<=0)return;var actualPct=round(stg.allocation/stg.demand*100);if(s[k]&&s[k].basis==='bucket'){s[k].pct=Math.min(100,actualPct);}else if(s[k]&&s[k].basis==='amount'){s[k].amount=round(stg.allocation);}});if(s.itsimpMode&&s.itsimp){var stg4=r.stages[4];if(stg4&&stg4.demand>0){if(s.itsimp.basis==='amount')s.itsimp.amount=round(stg4.allocation);else s.itsimp.pct=round(stg4.allocation/stg4.demand*100);}}}
function createSession(data){const s=preset('optimal');autoLfrPct(data,s);autoCarryAmt(data,s);autoValueCeiling(data,s,{});return {schema:4,ruleVersion:VERSION,id:'scenario-'+Date.now(),name:'Optimal Segmentation',preset:'optimal',revision:0,status:'Draft',data,settings:s,overrides:{},reviews:{},events:[],filters:{ew:{},bu:{},overview:{},prioritized:{}},savedAt:null};}
function transact(session,action,details={},origin='AOP Scenarios'){
 if(session.status==='Finalised'&&!['fork'].includes(action))throw Error('Finalised scenario. Create a new working version to edit.');
 const next=clone(session),old={settings:clone(next.settings),overrides:clone(next.overrides),reviews:clone(next.reviews),status:next.status};
 if(action==='setting'){next.settings=clone(details.settings);validateSettings(next.settings);next.preset='custom';}
 else if(action==='preset'){next.settings=preset(details.preset);next.settings.budget=details.preset==='mustdo'?100:session.settings.budget;if(next.settings._applyLfrOptOuts){delete next.settings._applyLfrOptOuts;const lfrOv=applyLfrDecisions(next);Object.assign(next.overrides,lfrOv);}autoLfrPct(next.data,next.settings);autoCarryAmt(next.data,next.settings);autoValueCeiling(next.data,next.settings,next.overrides);next.preset=details.preset;next.name=({optimal:'Optimal Segmentation',protect:'Protect Commitments',evidence:'Balanced Portfolio',mustdo:'Balanced 100M + Must Do On Top',capacity:'Maximum Benefit'})[details.preset]||next.name;}
 else if(action==='program'||action==='group'){
  for(const id of details.ids||[details.id]){const r=next.data.records.find(r=>r.id===id);if(!r)throw Error('Programs not found.');
   const before=next.overrides[id];if(details.choice==='automatic')delete next.overrides[id];else{const request=next.reviews[id]?.requested??r.cost,amount=details.choice==='exclude'?0:(details.amount??request);if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||!(request>0)||amount>request+1e-9)throw Error('Prioritised amount must be between zero and the source request.');next.overrides[id]={choice:amount===0?'exclude':'include',amount,note:details.note??before?.note??'',fingerprint:r.fingerprint,state:'active'};}
  }next.preset='custom';autoAdjustLevers(next.data,next.settings,next.overrides,next.reviews);
 }
 else if(action==='review'){const v=details.review;if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid review object.');if(v.consequence!==undefined&&(![0,5,10,15].includes(v.consequence)||typeof v.note!=='string'||!clean(v.note)))throw Error('Consequence review requires a valid tier and rationale.');for(const name of ['note','condition'])if(v[name]!==undefined&&typeof v[name]!=='string')throw Error('Review '+name+' must be text.');if(v.highBenefit!==undefined&&typeof v.highBenefit!=='boolean')throw Error('Benefit review flag must be boolean.');if(details.review.requested!==undefined&&(!Number.isFinite(details.review.requested)||details.review.requested<0))throw Error('Requested amount invalid');if(details.review.merit!==undefined&&(!Number.isFinite(details.review.merit)||details.review.merit<0||details.review.merit>100||!clean(details.review.note)))throw Error('Merit override requires 0–100 and a rationale');const r=next.data.records.find(x=>x.id===details.id);if(!r)throw Error('Programs not found.');next.reviews[details.id]={...details.review,fingerprint:r.fingerprint};next.preset='custom';}
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
 const keyScale=Math.abs(rawSum-.001)<1e-10?1000:Math.abs(rawSum-1)<1e-8?1:Math.abs(rawSum-100)<1e-6?1/100:null;
 const keyValid=ewKey?.allocationEvidenceValid!==false&&keyScale!==null&&Object.values(rawKey).every(v=>Number.isFinite(v)&&v>=0);
 if(!keyValid)issues.push({id:ewKey?.id||'EW key',reason:'EW key missing or unexpected percentage total',value:rawSum});
 const ref=(r,field)=>{const m=data.mappings.find(m=>m.sheet===r.sourceSheet);return m?`${r.sourceSheet}!${col(m.fields[field])}${r.sourceRow}`:null;};
 const write=(r,bucket,name,amount,fraction,keyRef,reason)=>{
  const recipient=mapping[name]||([...clusters,'Unallocated','PMI on top'].includes(name)?name:'Unallocated'),g=get(recipient);g[bucket]+=amount;g.total+=amount;
  ledger.push({pillar:'Programs',id:r.id,name:r.name,type:r.type,origin:r.org,stream:r.stream,recipient,subRecipient:name,bucket,requested:r.cost,sourceRequested:r.sourceCost??r.cost,funded:r.final,fraction,amount,reason,sourceFile:data.sourceFile,sourceHash:data.sourceHash,sourceSheet:r.sourceSheet,sourceRow:r.sourceRow,requestCell:ref(r,'cost'),baselineCell:ref(r,'baselined'),keyCell:keyRef||'',scenarioScore:r.score});
 };
 for(const r of result.rows){
  if(!(r.final>0))continue;
  if(r.isPmi){write(r,'pmi','PMI on top',r.final,1,'','Outside base budget; no BU charge');continue;}
  const enterprise=r.stream==='ew'||/type iii|enterprise wide/i.test(r.sourceType||r.type);
  const enterpriseBucket=enterprise&&!r.itSubOrg;
  const bucket=r.itSubOrg&&['Cross Functions','Regions (NAM, GRC, IR)'].includes(r.org)?'other':enterpriseBucket?'ew':/indirect/i.test(r.type)?'indirect':/type ii\b|cross/i.test(r.type)?'cross':/type i\b|single/i.test(r.type)?'single':'other';
  const allocation=enterprise?(keyValid?rawKey:{}):(r.allocations||{}),rawAllocSum=Object.values(allocation).reduce((a,v)=>a+v,0),scale=enterprise?(keyScale||1):r.allocationUnit==='kEUR'?((r.sourceCost??r.cost)>0?1/((r.sourceCost??r.cost)*1000):0):Math.abs(rawAllocSum-100)<1e-6?.01:rawAllocSum>0&&rawAllocSum<=1.01?1:0;
  const total=Object.values(allocation).reduce((a,v)=>a+v*scale,0);
  if((enterprise?!keyValid:r.allocationEvidenceValid===false)||total>1+1e-8||Object.values(allocation).some(v=>!Number.isFinite(v)||v<0)){
   const keyCells=Object.values((enterprise?ewKey:r)?.allocationSources||{}).map(f=>`${(enterprise?ewKey:r).sourceSheet}!${f.cell}`).join(', ');write(r,bucket,'Unallocated',r.final,1,keyCells,'Invalid allocation percentages');Object.assign(ledger[ledger.length-1],{allocationBasis:'Source allocation total '+total+'; requires correction',keyRaw:rawAllocSum,keyScale:scale});issues.push({id:r.id,reason:'Invalid allocation percentages',value:total});continue;
  }
  let allocated=0;
  for(const [name,raw] of Object.entries(allocation)){
   const fraction=raw*scale;if(!(fraction>0))continue;
   const amount=r.final*fraction;allocated+=amount;
   const owner=enterprise?ewKey:r,field=(owner.allocationSources||{})[name];
   const reason=name==='Not allocated'?'Source explicitly unallocated':enterprise?'Confirmed EW charging key':field?.basis||(r.allocationUnit==='kEUR'?'Source spend allocation / requested amount':'Source spend-allocation percentage');
   write(r,bucket,name,amount,fraction,field?`${owner.sourceSheet}!${field.cell}`:'',reason);
   Object.assign(ledger[ledger.length-1],{keyFormula:field?.formula||'',allocationBasis:enterprise?'Confirmed EW key; approved 1000x unit correction where applicable':field?.basis||r.allocationProfile||'Source percentage',keyRaw:raw,keyScale:scale,sourceKeyHeader:field?.rawHeader||name});
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
 const unallocatedBreakdown={explicit:0,pending:0,invalid:0};for(const e of ledger.filter(e=>e.pillar==='Programs'&&e.recipient==='Unallocated'))unallocatedBreakdown[e.reason==='Source explicitly unallocated'?'explicit':e.reason==='Invalid allocation percentages'?'invalid':'pending']+=e.amount;
 return {rows,ledger,issues,totals,expected,unallocatedBreakdown,reconciled:Math.abs(totals.total-expected)<1e-8,ewKey:{sourceRow:ewKey?.sourceRow,sourceSheet:ewKey?.sourceSheet,rawSum,scale:keyScale,valid:keyValid,unallocatedShare:(rawKey['Not allocated']||0)*(keyScale||0),fractions:Object.fromEntries(Object.entries(rawKey).map(([k,v])=>[k,v*(keyScale||0)]))}};
}

function tradeoff(session,stream,targets){
 if(!['ew','bu'].includes(stream))throw Error('Choose Functions & Regions or BU Led');
 let next=clone(session);const before=solve(next.data,next.settings,next.overrides,next.reviews);
 for(const [leader,target] of Object.entries(targets)){
  if(!Number.isFinite(target)||target<0)throw Error('Trade-off target must be nonnegative');
  const rows=before.rows.filter(r=>r.stream===stream&&r.exco===leader&&!r.isPmi),current=sum(rows,r=>r.final),delta=target-current;
  if(delta>1e-9){let used=0;for(const r of rows.filter(r=>r.final===0&&r.cost>0).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en',{numeric:true}))){if(used+r.cost<=delta+1e-9){next=transact(next,'program',{id:r.id,choice:'include',note:'ExCo trade-off'},'ExCo '+stream+' trade-off');used+=r.cost;}}}
  else if(delta< -1e-9){let freed=0;for(const r of rows.filter(r=>r.final>0&&!r._protected).sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id,'en',{numeric:true}))){if(freed>=-delta-1e-9)break;next=transact(next,'program',{id:r.id,choice:'exclude',note:'ExCo trade-off'},'ExCo '+stream+' trade-off');freed+=r.final;}}
 }
 next.excoTradeoffs=clone(targets);next.excoTradeoffScope=stream;return next;
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
function filter(rows,f={}){return rows.filter(r=>['org','platform','newCarry','carryoverTypes','area','status','stageName','exco'].every(k=>!f[k]?.length||(Array.isArray(r[k])?r[k].some(v=>f[k].includes(v)):f[k].includes(clean(r[k])||'Not Captured')))&&(!f.search||key(r.id+' '+r.name+' '+r.org).includes(key(f.search))));}
function validateSession(s){if(s?.ruleVersion!==VERSION&&!(s?.ruleVersion==='5.9.5'&&s.data?.sourceHash==='981e9a196484e5f41852cb2b4088c8539478d63d335139fb059d7ef8b8dea8ac'))throw Error('This scenario uses a different engine/source snapshot version. Start from the current data-correct source; the older saved scenario remains unchanged.');if(!s||(s.schema!==3&&s.schema!==4)||!s.data?.workbook||!Array.isArray(s.events)||!['Draft','Finalised'].includes(s.status)||!s.filters||!s.overrides||!s.reviews||!Number.isInteger(s.revision)||typeof s.name!=='string')throw Error('Unsupported or incomplete scenario format.');if(Array.isArray(s.settings.weights)&&s.settings.weights.length===4)s.settings.weights=[40,25,15,10,10];if(typeof s.settings.carry==='number')s.settings.carry={basis:'bucket',pct:100};s.schema=4;validateSettings(s.settings);const rebuilt=normalize(s.data.workbook);if(rebuilt.version!==s.data.version)throw Error('Session source version does not match its workbook snapshot.');if(rebuilt.records.length!==s.data.records.length||!rebuilt.records.every(function(r,i){return r.id===s.data.records[i].id;}))throw Error('Session source records do not match its workbook snapshot.');Object.assign(s.data,rebuilt);s.ruleVersion=VERSION;const ids=new Set(rebuilt.records.map(r=>r.id));for(const [id,o] of Object.entries(s.overrides)){if(!ids.has(id)||!o||!['include','exclude'].includes(o.choice)||!['active','needs-review'].includes(o.state))throw Error('Invalid program override.');}for(const [id,v] of Object.entries(s.reviews)){if(!ids.has(id))throw Error('Review refers to missing source ID.');if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid review object.');if(v.requested!==undefined&&(!Number.isFinite(v.requested)||v.requested<0))throw Error('Requested amount review must be a finite nonnegative number.');if(v.merit!==undefined&&(!Number.isFinite(v.merit)||v.merit<0||v.merit>100||typeof v.note!=='string'||!clean(v.note)))throw Error('Merit override requires 0–100 and a rationale.');if(v.consequence!==undefined&&(![0,5,10,15].includes(v.consequence)||typeof v.note!=='string'||!clean(v.note)))throw Error('Consequence review requires a valid tier and rationale.');for(const name of ['note','condition'])if(v[name]!==undefined&&typeof v[name]!=='string')throw Error('Review '+name+' must be text.');if(v.highBenefit!==undefined&&typeof v.highBenefit!=='boolean')throw Error('Benefit review flag must be boolean.');}
for(const [id,o] of Object.entries(s.overrides)){const r=rebuilt.records.find(x=>x.id===id),request=s.reviews[id]?.requested??r.cost;if(o.amount!==undefined&&(!Number.isFinite(o.amount)||o.amount<0))throw Error('Invalid override amount.');if(o.choice==='include'&&(!(r.cost>0)||!(request>0)||(o.amount!==undefined&&o.amount>request+1e-9)))throw Error('Override exceeds valid source request.');if(o.choice==='exclude'&&o.amount!==undefined&&o.amount!==0)throw Error('Excluded override amount must be zero.');}if(s.status==='Finalised'&&Object.values(s.overrides).some(o=>o.state==='needs-review'))throw Error('Finalised scenario contains unresolved refreshed decisions.');return true;}
function sourceQuality(data,result){const rows=result?.rows||data.records,templates=data.templateRecords||data.excludedRecords||[];return {programRecords:rows.length,templateRecords:templates.length,chargingKeys:data.ewChargingKey?1:0,sourceCandidates:rows.length+templates.length+(data.ewChargingKey?1:0),missingRequests:rows.filter(r=>r.cost===null).length,invalidRequests:rows.filter(r=>r.cost===null&&clean(r.requestRaw)||r.cost!==null&&r.cost<0).length,missingBenefits:rows.filter(r=>r.benefit===null).length,zeroBenefits:rows.filter(r=>r.benefit===0).length,negativeBenefits:rows.filter(r=>r.benefit!==null&&r.benefit<0).length,paybackParsed:rows.filter(r=>r.paybackStatus==='year-label'||r.paybackStatus==='numeric').length,paybackInvalid:rows.filter(r=>r.paybackStatus==='invalid'||r.paybackStatus==='nonpositive').length,paybackMissing:rows.filter(r=>r.paybackStatus==='missing').length,heldPrograms:rows.filter(r=>(r.holds||[]).length).length,sourceIssues:data.issues||[]};}
return {sourceQuality,finance,tradeoff,VERSION,STAGES,EXCO_HIERARCHY,ORG_TO_EXCO,ORG_RENAME,excoOf,clone,clean,key,round,numeric,sum,col,numberCell,paybackCell,hasCondition,defaults,preset,autoLfrPct,autoCarryAmt,autoValueCeiling,autoAdjustLevers,validateSettings,leverTarget,switchBasis,rebalance,normalize,stage,enrich,solve,createSession,transact,undo,refreshPreview,refresh,auditRefresh,snapshotState,filter,validateSession,LFR_EXCO_DECISIONS,applyLfrDecisions};
});

const AOP_2026_SPEND={lfr:{amount:32,label:'LFR'},carry:{amount:122.11,label:'Carryover (excl. LFR, Decomm)'},sustain:{amount:9.39,label:'C&S, Upgrades & CI (excl. LFR, Carryover)'},value:{amount:16.85,label:'Other (excl. LFR, Carryover, C&S, Upg & CI)'},itsimp:{amount:4.36,label:'Decommissioning'}};

const AOP_2026_TOTAL=184.71;

function aop2026Line(k){const d=AOP_2026_SPEND[k];if(!d)return '';return '<div style="margin-top:6px;padding:6px 10px;background:#00126E;color:#fff;border-radius:4px;font-size:12px;text-align:center;font-weight:600;letter-spacing:0.3px">AOP 2026 Spend : '+Number(d.amount.toFixed(1))+' M\u20ac</div>';}


/* Offline XLSX IO: OOXML ZIP with typed cells; native browser decompression. */

