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
function write(sheets){const entries={},ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';entries['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';
entries['_rels/.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
entries['xl/workbook.xml']='<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';
entries['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
entries['xl/styles.xml']='<styleSheet xmlns="'+ns+'"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.000000"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF00126E"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
sheets.forEach((s,i)=>{const max=Math.max(...s.rows.map(r=>r.length),1);entries['xl/worksheets/sheet'+(i+1)+'.xml']='<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+Array.from({length:max},(_,c)=>'<col min="'+(c+1)+'" max="'+(c+1)+'" width="'+(c===0?24:22)+'" customWidth="1"/>').join('')+'</cols><sheetData>'+s.rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((v,c)=>{if(v===null||v===undefined)return '';const ref=col(c)+(r+1);if(typeof v==='number'&&Number.isFinite(v))return '<c r="'+ref+'" s="'+(r===0?1:2)+'"><v>'+v+'</v></c>';if(typeof v==='boolean')return '<c r="'+ref+'" t="b"><v>'+(v?1:0)+'</v></c>';return '<c r="'+ref+'" t="inlineStr" s="'+(r===0?1:0)+'"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData><autoFilter ref="A1:'+col(max-1)+s.rows.length+'"/></worksheet>';});return zip(entries);}
function sheets(session,result,rows,scope){
const A=globalThis.AOP||(typeof require==='function'?require('./engine.js'):null);
// Read OPS data from DOM (injected as ops-data script block) or global
const OPS=(function(){try{if(globalThis.OPS)return globalThis.OPS;var el=typeof document!=='undefined'&&document.getElementById('ops-data');return el&&el.textContent?JSON.parse(el.textContent):null;}catch(e){return null;}})();
const up=x=>Math.sign(x)*Math.ceil((Math.abs(x)-1e-10)*10)/10;
const nn=x=>x==null?'':x;
const m1=x=>x==null?'':up(x);  // display M€ (rounded up 1dp)
const stages=result.stages||[];
const w=session.settings.weights||[];
const weightLabels=['Benefit ('+nn(w[0])+'%)','Priority ('+nn(w[1])+'%)','Consequence ('+nn(w[2])+'%)','Band ('+nn(w[3])+'%)','Payback ('+nn(w[4])+'%)'];
const nComp=(result.rows[0]&&result.rows[0].components)?result.rows[0].components.length:w.length||5;
const allRows=result.rows;  // always full portfolio regardless of export scope
const fundedRows=allRows.filter(r=>r.final>0);

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — SCENARIO OVERVIEW  (executive view mirroring One Portfolio tab)
// ─────────────────────────────────────────────────────────────────────────────
const lfrRows=allRows.filter(r=>r.stage===0);
const carryRows=result.rows.filter(r=>(r.newCarry||'').toLowerCase().trim()==='carry over');
const s1Rows=result.rows.filter(r=>r.stage===1);
const ewKey=session.data.ewChargingKey;
const summary=[
  ['AOP 2027 Scenario Export',''],
  ['Measure','Value','Display M€ (rounded up 1dp)'],
  ['Scenario name',session.name],['Scope',scope],['Source file',session.data.sourceFile],
  ['Source hash',session.data.sourceHash],['Source version',session.data.version],
  ['Rule engine version',A.VERSION],['Revision',session.revision],['Status',session.status],
  ['Exported at',new Date().toISOString()],[''],
  ['── Budget & Allocation ──',''],
  ['Total AOP (M€)',session.settings.budget,up(session.settings.budget)],
  ['Tolerance (%)',session.settings.tolerance],
  ...Object.entries(result.totals).map(([k,v])=>[k,v,typeof v==='number'?up(v):null]),
  ['Exported rows',rows.length],
  ['Exported requested (M€)',A.sum(rows,r=>r.cost),up(A.sum(rows,r=>r.cost))],
  ['Exported prioritised (M€)',A.sum(rows,r=>r.final),up(A.sum(rows,r=>r.final))],
  [''],
  ['── Stage Breakdown ──',''],
  ...stages.flatMap((x,i)=>[
    ['Stage '+(i+1)+' name',x.name],
    ['Stage '+(i+1)+' demand (M€)',x.demand,up(x.demand)],
    ['Stage '+(i+1)+' target (M€)',x.target!==null&&x.target!==undefined?x.target:'residual / capped by budget',x.target!==null&&x.target!==undefined?up(x.target):''],
    ['Stage '+(i+1)+' allocated (M€)',x.allocation,up(x.allocation)],
  ]),
  [''],
  ['── Stream Split ──',''],
  ...Object.entries(result.streams).flatMap(([k,x])=>[
    ['Stream '+k+' requested (M€)',x.requested,up(x.requested)],
    ['Stream '+k+' automatic (M€)',x.automatic,up(x.automatic)],
    ['Stream '+k+' prioritised (M€)',x.allocation,up(x.allocation)],
  ]),
  [''],
  ['── LFR & Carry-Over Summary ──',''],
  ['Legal & Compliance programmes (Stage 1)',lfrRows.length],
  ['Legal & Compliance demand (M€)',A.sum(lfrRows,r=>r.cost),up(A.sum(lfrRows,r=>r.cost))],
  ['Legal & Compliance funded (M€)',A.sum(lfrRows,r=>r.final),up(A.sum(lfrRows,r=>r.final))],
  ['High-Value Carry-Over programmes (Stage 2)',s1Rows.length],
  ['High-Value Carry-Over demand (M€)',A.sum(s1Rows,r=>r.cost),up(A.sum(s1Rows,r=>r.cost))],
  ['High-Value Carry-Over baselined (M€)',A.sum(s1Rows,r=>r.baselined||0),up(A.sum(s1Rows,r=>r.baselined||0))],
  ['High-Value Carry-Over funded (M€)',A.sum(s1Rows,r=>r.final),up(A.sum(s1Rows,r=>r.final))],
  ['All carry-over programmes (all stages)',carryRows.length],
  ['All carry-over demand (M€)',A.sum(carryRows,r=>r.cost),up(A.sum(carryRows,r=>r.cost))],
  ['All carry-over baselined (M€)',A.sum(carryRows,r=>r.baselined||0),up(A.sum(carryRows,r=>r.baselined||0))],
  [''],
  ['── Enterprise-Wide Charging Key ──',''],
  ['EW charging key name',ewKey?ewKey.name:'(not found in source)'],
  ['EW charging key cost (M€)',ewKey?ewKey.cost:''],
  ['EW charging key status','Excluded from all demand totals and prioritisation. Used only for BU EW-charge split in Tab 6.'],
  [''],
  ['── Merit Score Weights ──',''],
  ...w.map((v,i)=>[weightLabels[i]||'Weight '+(i+1),v+'%']),
  ['Merit floor',session.settings.merit],
  ['Filters applied',JSON.stringify(session.filters)],
];

// ── 2. Portfolio ─────────────────────────────────────────────────────────────
const portfolio=[
  ['ID','BURF Organisation','Programme Name','Stream','Demand Type','Source Type',
   'Platform','Investment Area','Stage','Decision Band','Overall AOP Decision',
   'Requested M€','Automatic M€','Prioritised M€','Unfunded M€',
   'Merit Score','Rank','Status','Reason',
   'Benefit Source','LFR Tier','Has LFR Evidence','LFR Year','LFR Name',
   'Payback Years','Baselined M€','Carry Fund Cap M€',
   'Evidence flags','Source sheet','Source row','Source hash'],
  ...rows.map(r=>[
    r.id,r.org,r.name,r.stream,r.newCarry,r.type,r.platform,r.area,
    r.stageName,r.decisionBand,r.overall,
    r.cost,r.automatic,r.final,r.unfunded,r.score,r.rank,r.status,r.reason,
    nn(r.benefitSource),nn(r.lfrTier),r.hasLfrEvidence?'Yes':'No',
    nn(r.lfrYear),nn(r.lfrName),
    r.paybackYears!=null?r.paybackYears:'',
    r.baselined!=null?r.baselined:'',
    r.carryFundCap!=null?r.carryFundCap:'',
    [...(r.holds||[]),(r.warnings||[])].join('; '),
    r.sourceSheet,r.sourceRow,session.data.sourceHash,
  ])
];

// ── 3. Score Evidence ────────────────────────────────────────────────────────
// v4.5 engine: 5 components — header must match exactly
const compHeaders=weightLabels.slice(0,nComp).map(l=>'Score: '+l);
const rawHeaders=weightLabels.slice(0,nComp).map(l=>'Raw pts: '+l);
const scores=[
  ['ID',...compHeaders,'Total Merit Score',
   'Benefit Source','Qualitative Benefit Tier','Benefit/Request Multiple',
   'Submitted Benefit M€','Original Benefit (source)','Benefit Details',
   'Payback Years','Payback Score Points',
   'Captured Consequence Score','Consequence Evidence',
   'Impact and Cost of Not Doing','Problem Statement','Scope',
   'Contain Condition','Evidence Review (JSON)',
   ...rawHeaders],
  ...rows.map(r=>{
    const comps=r.components||[];const raw=r.rawComponents||[];
    return [
      r.id,...comps,r.score,
      nn(r.benefitSource),nn(r.qualBenefit&&r.qualBenefit.tier),nn(r.ratio),
      nn(r.benefit),nn(r.benefitRaw),nn(r.benefitDetails),
      r.paybackYears!=null?r.paybackYears:'',nn(r.paybackPoints),
      nn(r.consequence&&r.consequence.points),nn(r.consequence&&r.consequence.evidence),
      nn(r.impact),nn(r.problem),nn(r.scope),
      nn(r.condition),JSON.stringify(r.review||{}),
      ...raw,
    ];
  })
];

// ── 4. Settings ──────────────────────────────────────────────────────────────
const settingsRows=[['Setting','Value','Notes']];
const s=session.settings;
settingsRows.push(['Total AOP (M€)',s.budget,'']);
settingsRows.push(['Tolerance (%)',s.tolerance,'Max overspend allowed']);
settingsRows.push(['Merit floor',s.merit,'P4 eligibility threshold']);
settingsRows.push(['Carry-over RoI threshold',s.carry,'0x = all qualifying carry-overs funded']);
['lfr','sustain','value'].forEach(k=>{const v=s[k]||{};settingsRows.push(['Lever '+k+' basis',v.basis,'bucket / aop / amount']);settingsRows.push(['Lever '+k+' pct/amount',v.basis==='amount'?v.amount:v.pct,v.basis==='amount'?'M€':'%']);});
w.forEach((v,i)=>settingsRows.push(['Weight '+i+' — '+(weightLabels[i]||'w'+i),v+'%','']));

// ── 5. Decisions ─────────────────────────────────────────────────────────────
const decisionsRows=[['Event ID','Date/Time','Origin','Action','Programme ID','Programme','Organisation','Old Value','New Value','Note','Revision','Source version']];
session.events.forEach(e=>{
  const d=e.details||{};
  const prog=result.rows.find(r=>r.id===d.id)||result.rows.find(r=>r.id===(d.ids&&d.ids[0]));
  const ids=(d.ids||[d.id]).filter(Boolean).join(', ');
  let oldVal='',newVal='';
  if(e.action==='program'||e.action==='group'){
    oldVal=e.before&&e.before.overrides?JSON.stringify(e.before.overrides[d.id]||e.before.overrides[d.ids&&d.ids[0]]||'automatic'):'';
    newVal=d.choice==='exclude'?'Excluded':d.choice==='include'?'Included at '+(d.amount!=null?d.amount+' M€':'full amount'):'Automatic';
  }else if(e.action==='setting'){oldVal='(settings changed)';}
  decisionsRows.push([e.id,e.time,nn(e.origin),e.action,ids,nn(prog&&prog.name),nn(prog&&prog.org),oldVal,newVal,nn(d.note),e.revision,nn(e.sourceVersion)]);
});

// ── 6. Change Log ────────────────────────────────────────────────────────────
const changeLogRows=[['Date','Action','Programme ID','Programme','Organisation','Tab','Old','New','Note','Rev']];
session.events.filter(e=>e.action!=='setting'&&e.action!=='preset').forEach(e=>{
  const d=e.details||{};const prog=result.rows.find(r=>r.id===d.id);
  const actionLabel=e.action==='program'?(d.choice==='include'?'Included':d.choice==='exclude'?'Excluded':d.choice==='automatic'?'Returned to automatic':'Amount changed'):e.action==='group'?'Group '+(d.choice||'change'):e.action==='review'?'Evidence review':e.action==='reset'?'Reset all overrides':e.action==='finalise'?'Finalised scenario':e.action==='fork'?'New working version':e.action==='refresh'?'Source refreshed':e.action;
  changeLogRows.push([e.time,actionLabel,d.id||'',nn(prog&&prog.name),nn(prog&&prog.org),nn(e.origin),d.before!==undefined?String(d.before):'',d.after!==undefined?String(d.after):(d.amount!=null?d.amount+' M€':''),nn(d.note),e.revision]);
});

// ── 7. Source Reference ──────────────────────────────────────────────────────
const source=[['ID','Source sheet','Source row','Column label','Original value','Source formula'],...rows.flatMap(r=>(r.sourceValues||[]).map(v=>[r.id,r.sourceSheet,r.sourceRow,v.label,v.value,v.formula||'']))];

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — SCENARIO OVERVIEW (executive, mirrors One Portfolio tab)
// ─────────────────────────────────────────────────────────────────────────────
const t1=[];
const opsTotal=(OPS&&OPS.meta&&OPS.meta.opsTotal2027)||469.7;
const opsTotal26=(OPS&&OPS.meta&&OPS.meta.opsTotal2026)||470.7;
const progAlloc=result.totals.allocation;
const ewAlloc=result.streams.ew.allocation;
const buAlloc=result.streams.bu.allocation;
const benefitsTotal=A.sum(fundedRows,r=>r.benefit||0);

// Header
t1.push(['AOP 2027 IT Portfolio — Scenario Overview','','','','']);
t1.push(['Scenario',session.name,'','Status',session.status]);
t1.push(['Source file',session.data.sourceFile,'','Generated',new Date().toISOString().slice(0,19).replace('T',' ')]);
t1.push(['Revision','r'+session.revision,'','Source version',session.data.version]);
t1.push(['']);

// Executive KPIs block
t1.push(['── Total IT AOP 2027 ──','','','','']);
t1.push(['Component','M€ (exact)','M€ (rounded)','','']);
t1.push(['Operations AOP 2027',opsTotal,m1(opsTotal),'Pre-aligned Bill of IT']);
t1.push(['Prioritised Programme AOP',progAlloc,m1(progAlloc),fundedRows.length+' programmes funded ('+allRows.filter(r=>r.status==="Partial scope").length+' partial scope)']);
t1.push(['TOTAL IT AOP',opsTotal+progAlloc,m1(opsTotal+progAlloc),'']);
t1.push(['YoY Operations delta',opsTotal-opsTotal26,m1(opsTotal-opsTotal26),'vs 2026 run-rate '+m1(opsTotal26)+' M€']);
t1.push(['']);
t1.push(['── Programme AOP Split ──','','','','']);
t1.push(['Component','M€ (exact)','M€ (rounded)','% of Programme AOP','']);
t1.push(['Enterprise-Wide (EW)',ewAlloc,m1(ewAlloc),m1(progAlloc?ewAlloc/progAlloc*100:0)+'%','Cross-BU platforms & compliance']);
t1.push(['BU-Led',buAlloc,m1(buAlloc),m1(progAlloc?buAlloc/progAlloc*100:0)+'%','Direct BU investment']);
t1.push(['Total Programme AOP',progAlloc,m1(progAlloc),'100%','']);
t1.push(['Submitted benefits (quantified lifetime)',benefitsTotal,m1(benefitsTotal),'','From funded programmes']);
t1.push(['Total demand submitted',result.totals.requested,m1(result.totals.requested),'','All '+allRows.length+' programmes']);
t1.push(['Demand not funded',result.totals.unfunded,m1(result.totals.unfunded),'','Unfunded in current scenario']);
t1.push(['']);

// 4-Priority Stage Breakdown
t1.push(['── 4-Priority Funding Breakdown ──','','','','','']);
t1.push(['Priority','Stage Name','Programmes','Demand M€','Funded M€','% of demand funded','Logic']);
const stageLabels=['Legal & Compliance (Must Do)','High-Value Carry-Overs','Sustain Engineering & Hygiene','Value Based Portfolio'];
const stageLogic=['Verified mandatory obligation (LFR name + year) or CCB exception — 100% funded','Prior-year commitments funded at min(demand, approved baseline)','Change & Sustain engineering + CI/upgrades — keeps lights on','New features, AI, decommissioning — ranked by evidence strength'];
(stages||[]).forEach(function(st,i){
  const stRows=allRows.filter(function(r){return r.stage===i;});
  const pct=st.demand>0?m1(st.allocation/st.demand*100):'—';
  t1.push(['P'+(i+1),stageLabels[i]||st.name,stRows.length,st.demand,st.allocation,pct+'%',stageLogic[i]||'']);
});
t1.push(['TOTAL','',allRows.length,result.totals.requested,result.totals.allocation,m1(result.totals.requested>0?result.totals.allocation/result.totals.requested*100:0)+'%','']);
t1.push(['']);

// BU Cost Allocation (mirrors Tab 6 — only available when OPS data is loaded)
const SUBORG_BU_W={'Imaging Informatics':'EI','Clinical Informatics':'EI','EI Other':'EI','AMD':'Connected Care','HPM':'Connected Care','S&RC':'Connected Care','I&D':'Innovation & Design','IP and S':'Int. Property & Standards','IGT-D':'Image Guided Therapy','IGT-S':'Image Guided Therapy','MR':'Precision Diagnosis','CT':'Precision Diagnosis','DXR':'Precision Diagnosis','PD Other':'Precision Diagnosis','US':'Precision Diagnosis','G and B':'Personal Health','MCC':'Personal Health','OHC':'Personal Health','PH Other':'Personal Health'};
const ORG_TO_CL={'Enterprise Informatics (EI)':'EI','Monitoring - HPM (MCH)':'Connected Care','Sleep & Respiratory Care (SRC)':'Connected Care','Ambulatory Monitoring and Diagnostics (AM&D)':'Connected Care','Image Guided Therapy - Systems (IGT-S)':'Image Guided Therapy','Image Guided Therapy - Devices (IGT-D)':'Image Guided Therapy','Precision Diagnosis - Magnetic Resonance (MR)':'Precision Diagnosis','Precision Diagnosis - Computed Tomography (CT)':'Precision Diagnosis','Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':'Precision Diagnosis','Precision Diagnosis - Ultrasound (PDU)':'Precision Diagnosis','Personal Health (PH)':'Personal Health','CoE Marketing – HS (former DMEC)​':'Personal Health','Innovation and Design Business Operations':'Innovation & Design','Intellectual Property & Standards (IP&S)​':'Int. Property & Standards'};
const BU_CL=['Personal Health','Connected Care','Precision Diagnosis','Image Guided Therapy','EI','Innovation & Design','Int. Property & Standards'];
const clD={};BU_CL.forEach(function(c){clD[c]={buLed:0,ew:0};});
allRows.forEach(function(r){if(r.stream==='bu'&&r.final>0){const cl=ORG_TO_CL[r.org];if(cl&&clD[cl])clD[cl].buLed+=r.final;}});
const ewChKey=session.data.ewChargingKey;
const ewChAllocs=ewChKey&&ewChKey.allocations?ewChKey.allocations:{};
const ewChSum=Object.values(ewChAllocs).reduce(function(s,v){return s+v;},0);
if(ewChSum>0){BU_CL.forEach(function(cl){var clAmt=0;Object.keys(ewChAllocs).forEach(function(so){if(SUBORG_BU_W[so]===cl)clAmt+=ewChAllocs[so];});if(clAmt>0)clD[cl].ew=ewAlloc*(clAmt/ewChSum);});}
const tcoMap={};
if(OPS&&OPS.operations&&OPS.operations.tco){OPS.operations.tco.forEach(function(t){if(!t.bu.startsWith('- ')&&!t.bu.startsWith(' -'))tcoMap[t.bu.trim()]=t.totalBU||0;});}
t1.push(['── Organisation IT Cost Allocation ──','','','','','']);
t1.push(['Organisation (BU Cluster)','BU-Led Programmes M€','Enterprise-Wide M€','Operations (TCO) M€','Total IT Charge M€','Note']);
var gBUw=0,gEWw=0,gOPSw=0;
BU_CL.forEach(function(cl){var d=clD[cl]||{buLed:0,ew:0};var ops=tcoMap[cl]||0;var tot=d.buLed+d.ew+ops;gBUw+=d.buLed;gEWw+=d.ew;gOPSw+=ops;t1.push([cl,d.buLed,d.ew,ops,tot,'']);});
t1.push(['TOTAL (BU clusters)',gBUw,gEWw,gOPSw,gBUw+gEWw+gOPSw,'Grand Total = Programme AOP + Operations AOP']);
t1.push(['Note: Functions/Regions are allocated into BU charges via charging keys','','','','','']);
t1.push(['']);

// Scenario presets comparison
t1.push(['── Scenario Preset Comparison ──','','','','']);
t1.push(['Preset','P1: LFR','P2: Carry RoI','P3: Sustain','P4: Value','Allocated M€','Unfunded M€']);
[['optimal','Optimal Segmentation','100% bucket','0x','100% bucket'],['protect','Protect Commitments','100% bucket','2.0x','100% bucket'],['evidence','Tighten Carryover','100% bucket','3.0x','75% bucket'],['capacity','Release Sustain','44% bucket','0x','75% bucket']].forEach(function(p){const st=A.preset(p[0]);st.budget=session.settings.budget;const x=A.solve(session.data,st);t1.push([p[1],p[2],p[3],p[4],p[5]||'100% bucket',x.totals.allocation,x.totals.unfunded]);});

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — PROGRAMMES PRIORITISED
// ─────────────────────────────────────────────────────────────────────────────
const tab2Rows=fundedRows.slice().sort(function(a,b){return a.stage-b.stage||b.score-a.score;});
const tab2=[
  ['ID','Organisation','Programme Name','Stream','Demand Type','Source Type',
   'Platform','Investment Area','Stage','Priority','Decision Band','Overall AOP Decision',
   'Requested M€','Prioritised M€','Unfunded M€','Merit Score','Rank','Status','Reason',
   ...compHeaders,
   'Benefit Source','Payback Years','LFR Tier','Has LFR Evidence','LFR Year','LFR Name',
   'Baselined M€','Carry Fund Cap M€','Submitted Benefits M€','Benefit/Request Multiple',
   'Evidence flags'],
  ...tab2Rows.map(function(r){
    return [
      r.id,r.org,r.name,r.stream,r.newCarry,r.type,r.platform,r.area,
      r.stageName,r.priority,r.decisionBand,r.overall,
      r.cost,r.final,r.unfunded,r.score,r.rank,r.status,r.reason,
      ...(r.components||[]),
      nn(r.benefitSource),r.paybackYears!=null?r.paybackYears:'',
      nn(r.lfrTier),r.hasLfrEvidence?'Yes':'No',nn(r.lfrYear),nn(r.lfrName),
      r.baselined!=null?r.baselined:'',r.carryFundCap!=null?r.carryFundCap:'',
      nn(r.benefit),nn(r.ratio),
      [...(r.holds||[]),(r.warnings||[])].join('; '),
    ];
  })
];

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — OPERATIONS OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
const tab3=[];
tab3.push(['AOP 2027 Operations Overview — Bill of IT','','','','','']);
tab3.push(['Source','Comparable AOP2027 Bill of IT (pre-aligned)','','','','']);
tab3.push(['']);
if(OPS&&OPS.meta){
  tab3.push(['── Operations KPIs ──','','','','','']);
  tab3.push(['Metric','Value M€','Notes','','','']);
  tab3.push(['Total Operations AOP 2027',OPS.meta.opsTotal2027,'Full Bill of IT']);
  tab3.push(['2026 Run-Rate',OPS.meta.opsTotal2026,'Prior year baseline']);
  tab3.push(['YoY Delta',OPS.meta.opsTotal2027-OPS.meta.opsTotal2026,(OPS.meta.opsTotal2027<OPS.meta.opsTotal2026?'Cost decrease':'Cost increase')]);
  if(OPS.meta.buOwn)tab3.push(['BU Own Consumption',OPS.meta.buOwn,'Direct BU service costs']);
  if(OPS.meta.regAlloc)tab3.push(['From Regions (allocated)',OPS.meta.regAlloc,'Region IT allocated to BUs']);
  if(OPS.meta.funcAlloc)tab3.push(['From Functions & CoEs (allocated)',OPS.meta.funcAlloc,'Central IT allocated to BUs']);
  tab3.push(['']);
}
if(OPS&&OPS.operations&&OPS.operations.tco){
  tab3.push(['── Organisation Total Cost of Ownership ──','','','','','']);
  tab3.push(['Organisation','AOP2027 M€','Own Consumption M€','Own %','Regions to BU M€','Functions & CoEs M€','Δ vs AOP2026 M€']);
  OPS.operations.tco.forEach(function(t){
    const indent=t.bu.startsWith('- ')||t.bu.startsWith(' -');
    const nm=indent?'  '+t.bu.replace(/^[\s-]+/,'').trim():t.bu.trim();
    const own=t.ownConsumption||0,reg=t.regionAlloc||0,func=t.functionAlloc||0,tot=t.totalBU||0;
    const ownPct=tot>0?(own/tot*100).toFixed(1)+'%':'';
    tab3.push([nm,tot,own,ownPct,reg,func,(t.deltaVsAOP2026||0)]);
  });
  tab3.push(['']);
}
if(OPS&&OPS.operations&&OPS.operations.services){
  const svcs=OPS.operations.services.slice().sort(function(a,b){return (b.cost2027||0)-(a.cost2027||0);});
  const svcTotal27=svcs.reduce(function(s,v){return s+(v.cost2027||0);},0);
  const svcTotal26=svcs.reduce(function(s,v){return s+(v.cost2026||0);},0);
  tab3.push(['── Service Catalog ('+svcs.length+' services) ──','','','','','']);
  tab3.push(['Service ID','Service Name','IT Department','AOP2027 M€','AOP2026 M€','Δ M€','']);
  svcs.forEach(function(s){tab3.push([s.serviceId,s.name,s.dept||'',s.cost2027||0,s.cost2026||0,(s.cost2027||0)-(s.cost2026||0),'']);});
  tab3.push(['TOTAL','','',svcTotal27,svcTotal26,svcTotal27-svcTotal26,'']);
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — SCORING EVIDENCE
// ─────────────────────────────────────────────────────────────────────────────
const t4CompHdr=weightLabels.slice(0,nComp).map(function(l){return 'Score: '+l;});
const t4RawHdr=weightLabels.slice(0,nComp).map(function(l){return 'Raw pts: '+l;});
const tab4=[
  ['ID','Organisation','Programme','Stage','Stream',
   ...t4CompHdr,'Total Merit Score',
   'Benefit Source','Qualitative Benefit Tier','Benefit/Request Multiple',
   'Submitted Benefit M€','Original Benefit (source)','Benefit Details',
   'Payback Years','Payback Score Points','Consequence Score',
   'Consequence Evidence','Impact and Cost of Not Doing','Problem Statement','Scope',
   'Contain Condition','Evidence Review',
   ...t4RawHdr],
  ...allRows.map(function(r){
    const comps=r.components||[];const raw=r.rawComponents||[];
    return [
      r.id,r.org,r.name,r.stageName,r.stream,
      ...comps,r.score,
      nn(r.benefitSource),nn(r.qualBenefit&&r.qualBenefit.tier),nn(r.ratio),
      nn(r.benefit),nn(r.benefitRaw),nn(r.benefitDetails),
      r.paybackYears!=null?r.paybackYears:'',nn(r.paybackPoints),
      nn(r.consequence&&r.consequence.points),nn(r.consequence&&r.consequence.evidence),
      nn(r.impact),nn(r.problem),nn(r.scope),
      nn(r.condition),JSON.stringify(r.review||{}),
      ...raw,
    ];
  })
];

return [
  {name:'1. Scenario Overview',rows:t1},
  {name:'2. Programmes Prioritised',rows:tab2},
  {name:'3. Operations Overview',rows:tab3},
  {name:'4. Scoring Evidence',rows:tab4},
];}
return {read,write,sheets,zip,unzip,crc32};
});
