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
