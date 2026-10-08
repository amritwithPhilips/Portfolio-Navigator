'use strict';
const fs = require('fs'), path = require('path');
const D = __dirname;
const lfrRaw = JSON.parse(fs.readFileSync(path.join(D, 'audit/lfr-programs.json')));

const rnd2 = v => Math.round((v || 0) * 100) / 100;
const esc  = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const excoOrder = [
  'Laura Matz','Charlotte Hanneman','Marnix van Ginneken','Wim Appelo',
  'Julia Strandberg','Bert van Meurs','Jie Xue','Deeptha Khanna','Shez Partovi',
  'Steve C de Baca','Carla Rosana Goulart Silva Peron','Ling Liu','Jeff DiLullo',
  'Özlem Fidanci','Filip Koek'
];
const roleMap = {
  'Laura Matz':'Information Technology','Charlotte Hanneman':'Finance &amp; Security',
  'Marnix van Ginneken':'Legal, Comms &amp; IP&amp;S','Wim Appelo':'COO &amp; ISC',
  'Julia Strandberg':'Connected Care','Bert van Meurs':'IGT &amp; Service Transformation',
  'Jie Xue':'Precision Diagnosis','Deeptha Khanna':'Personal Health',
  'Shez Partovi':'EI &amp; I&amp;D','Steve C de Baca':'Patient Safety &amp; Quality',
  'Carla Rosana Goulart Silva Peron':'Medical Office','Ling Liu':'Greater China Region',
  'Jeff DiLullo':'North America','Özlem Fidanci':'International Regions','Filip Koek':'Internal Audit'
};

// Stats
const total       = lfrRaw.length;
const funded      = lfrRaw.filter(r=>r.final>0).length;
const totalCost   = lfrRaw.reduce((s,r)=>s+(r.cost||0),0);
const totalFunded = lfrRaw.filter(r=>r.final>0).reduce((s,r)=>s+r.final,0);
const unfunded    = lfrRaw.filter(r=>!r.final||r.final<=0);
const coverage    = Math.round(totalFunded/totalCost*100*10)/10;
const held        = lfrRaw.filter(r=>r.holds&&r.holds.length>0);

// Per-ExCo stats for JS
const excoStats = {};
excoOrder.forEach(e=>{
  const rows=lfrRaw.filter(r=>(r.exco||'Unassigned')===e);
  if(!rows.length) return;
  const dem=rows.reduce((s,r)=>s+(r.cost||0),0);
  const fun=rows.filter(r=>r.final>0).reduce((s,r)=>s+r.final,0);
  excoStats[e]={
    count:rows.length, funded:rows.filter(r=>r.final>0).length,
    demand:rnd2(dem), fundedM:rnd2(fun),
    coverage:dem>0?Math.round(fun/dem*1000)/10:0,
    gaps:rows.filter(r=>!r.final||r.final<=0).length,
    holds:rows.filter(r=>r.holds&&r.holds.length).length
  };
});

function statusOf(r){
  if(r.holds&&r.holds.length) return 'hold';
  if(!r.final||r.final<=0)    return 'gap';
  if(r.final<(r.cost-0.001)) return 'partial';
  return 'funded';
}
function tierKey(t){
  return t==='Immediate'?'imm':t==='Scheduled'?'sch':t==='CCB'?'ccb':'oth';
}

// Build programme rows — sorted: Immediate first, then by cost desc
const sorted = [...lfrRaw].sort((a,b)=>{
  const ta=a.lfrTier==='Immediate'?0:a.lfrTier==='Scheduled'?1:a.lfrTier==='CCB'?2:3;
  const tb=b.lfrTier==='Immediate'?0:b.lfrTier==='Scheduled'?1:b.lfrTier==='CCB'?2:3;
  return ta-tb||(b.cost||0)-(a.cost||0);
});

let progRows = '';
sorted.forEach(r=>{
  const st   = statusOf(r);
  const tier = r.lfrTier||'Other';
  const stLabel={funded:'Funded',gap:'Gap',hold:'Hold',partial:'Partial'};
  progRows += `
<tr class="pr${st==='gap'||st==='hold'?' pr-gap':''}"
    data-exco="${esc(r.exco||'Unassigned')}"
    data-status="${st}"
    data-id="${esc(r.id)}">
  <td class="col-chk">
    <div class="opt-group">
      <label class="opt-btn opt-in" title="Opt In"><input type="radio" name="opt_${esc(r.id)}" value="in"><span>In</span></label>
      <label class="opt-btn opt-out" title="Opt Out"><input type="radio" name="opt_${esc(r.id)}" value="out"><span>Out</span></label>
      <label class="opt-btn opt-none" title="No override"><input type="radio" name="opt_${esc(r.id)}" value="" checked><span>—</span></label>
    </div>
  </td>
  <td class="col-id">${esc(r.id)}</td>
  <td class="col-name">${esc(r.name)}</td>
  <td class="col-org muted sm">${esc((r.org||'').slice(0,32))}</td>
  <td><span class="tier t-${tierKey(tier)}">${esc(tier)}</span></td>
  <td class="num">${rnd2(r.cost)}</td>
  <td class="num">${r.final>0?rnd2(r.final):'—'}</td>
  <td><span class="badge st-${st}">${stLabel[st]}</span></td>
  <td class="col-lfr muted sm" title="${esc(r.lfrName)}">${esc((r.lfrName||'').slice(0,28))}${r.lfrYear?' ('+r.lfrYear+')':''}</td>
  <td class="col-ben muted sm">${esc(r.benefitClassLabel||'—')}</td>
  <td class="col-holds">${(r.holds||[]).map(h=>`<span class="tag-hold">${esc(h)}</span>`).join('')}${(r.warnings||[]).slice(0,1).map(w=>`<span class="tag-warn">${esc(w)}</span>`).join('')}</td>
  <td class="col-fb"><textarea class="fb-input" rows="2" placeholder="Add feedback…" data-id="${esc(r.id)}"></textarea></td>
</tr>`;
});

// Summary table rows
let sumRows='';
excoOrder.filter(e=>excoStats[e]).forEach(e=>{
  const s=excoStats[e];
  sumRows+=`<tr class="${s.gaps?'r-risk':'r-ok'}">
    <td><a href="#detail" class="exco-link" data-exco="${esc(e)}">${esc(e)}</a></td>
    <td class="muted sm">${roleMap[e]||''}</td>
    <td class="num">${s.count}</td><td class="num">${s.funded}</td>
    <td class="num ${s.gaps?'c-red':''}">${s.gaps||'—'}</td>
    <td class="num">${s.demand}</td><td class="num">${s.fundedM}</td>
    <td class="num ${s.coverage<100?'c-amber':'c-grn'}">${s.coverage}%</td>
    <td>${s.holds?`<span class="badge st-hold">${s.holds}</span>`:''}</td>
  </tr>`;
});

// Gap rows
let gapRows='';
[...unfunded].sort((a,b)=>(b.cost||0)-(a.cost||0)).forEach(r=>{
  const tier=r.lfrTier||'Other';
  gapRows+=`<tr>
    <td class="col-id">${esc(r.id)}</td>
    <td class="col-name">${esc(r.name)}</td>
    <td>${esc(r.exco||'—')}</td>
    <td class="num">${rnd2(r.cost)}</td>
    <td><span class="tier t-${tierKey(tier)}">${esc(tier)}</span></td>
    <td>${(r.holds||[]).map(h=>`<span class="tag-hold">${esc(h)}</span>`).join('')||'<span class="muted sm">Budget pressure — eligible for override</span>'}</td>
    <td class="muted sm">${esc((r.lfrName||'').slice(0,35))}${r.lfrYear?' ('+r.lfrYear+')':''}</td>
  </tr>`;
});

// Dropdown options
const ddExco  = [`<option value="__all__">All ExCo Leaders (${total} programmes)</option>`]
  .concat(excoOrder.filter(e=>excoStats[e]).map(e=>`<option value="${esc(e)}">${esc(e)} — ${roleMap[e]||''} (${excoStats[e].count})</option>`))
  .join('');
const ddStatus= `<option value="__all__">All Statuses</option>
<option value="funded">Funded</option>
<option value="gap">Gap — Not Funded</option>
<option value="hold">Hold Condition</option>
<option value="partial">Partial Scope</option>`;

const CSS = `
:root{--bd:#003087;--bm:#0055b8;--bl:#e8f0fc;--ab:#f59e0b;--rd:#dc2626;--gn:#16a34a;--br:#e2e8f0;--tx:#111827;--mu:#6b7280;--surf:#fff;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:var(--tx);background:#f8fafc;line-height:1.45;}
.page{max-width:1440px;margin:0 auto;padding:24px 20px;}
/* Header */
.hdr{background:var(--bd);color:#fff;padding:24px 32px;border-radius:8px;margin-bottom:18px;}
.hdr h1{font-size:20px;font-weight:700;}
.hdr .sub{font-size:13px;opacity:.9;margin-top:3px;}
.hdr .meta{font-size:11.5px;opacity:.7;margin-top:5px;}
/* KPI bar */
.kbar{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:18px;}
.kc{background:var(--surf);border:1px solid var(--br);border-radius:8px;padding:13px 16px;}
.kc .v{font-size:26px;font-weight:700;color:var(--bd);}
.kc .l{font-size:10.5px;color:var(--mu);margin-top:2px;text-transform:uppercase;letter-spacing:.5px;}
.kc.warn .v{color:var(--ab);}.kc.danger .v{color:var(--rd);}.kc.good .v{color:var(--gn);}
/* Section */
.stitle{font-size:15px;font-weight:700;color:var(--bd);padding:0 0 10px;border-bottom:2px solid var(--bl);margin-bottom:14px;}
/* Lever box */
.lbox{background:var(--surf);border:1px solid var(--br);border-left:4px solid var(--bm);border-radius:8px;padding:20px 24px;margin-bottom:18px;}
.lbox h2{font-size:14px;font-weight:700;color:var(--bd);margin-bottom:10px;}
.lbox p{margin-bottom:8px;color:#374151;line-height:1.65;font-size:13px;}
.lbox ol,.lbox ul{margin:6px 0 8px 20px;line-height:1.8;}
.lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px;}
.lcard{border-radius:6px;padding:14px 16px;border:1.5px solid var(--br);}
.lcard h4{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--mu);margin-bottom:6px;}
.lcard p{font-size:12px;color:#374151;margin-top:4px;line-height:1.6;}
.lcard.c0{border-color:#dc2626;background:#fef2f2;}
.lcard.c1{border-color:#f59e0b;background:#fffbeb;}
.lcard.c2{border-color:#6366f1;background:#eef2ff;}
.lever-flow{display:flex;gap:0;margin:14px 0;align-items:stretch;flex-wrap:wrap;}
.lf-step{flex:1;min-width:130px;background:#f8fafc;border:1px solid var(--br);padding:12px 14px;position:relative;}
.lf-step:not(:last-child)::after{content:'→';position:absolute;right:-12px;top:50%;transform:translateY(-50%);color:var(--bd);font-size:16px;font-weight:700;z-index:1;}
.lf-step h5{font-size:11px;font-weight:700;text-transform:uppercase;color:var(--bd);margin-bottom:4px;}
.lf-step p{font-size:11.5px;color:#374151;}
.lf-step.funded{background:#f0fdf4;border-color:#22c55e;}
.lf-step.held{background:#fef2f2;border-color:#dc2626;}
/* Tables */
table{width:100%;border-collapse:collapse;font-size:12.5px;}
th{text-align:left;padding:7px 9px;background:var(--bd);color:#fff;font-weight:600;font-size:11.5px;white-space:nowrap;}
td{padding:5px 9px;border-bottom:1px solid #f1f5f9;vertical-align:top;}
tr:hover td{background:#f8fafc;}
tfoot td{background:var(--bl);font-weight:700;}
.r-risk td:first-child{border-left:3px solid var(--rd);}
.r-ok  td:first-child{border-left:3px solid var(--gn);}
.num{text-align:right;font-variant-numeric:tabular-nums;}
.sm{font-size:11.5px;}.muted{color:var(--mu);}
.c-red{color:var(--rd);font-weight:700;}.c-amber{color:var(--ab);}.c-grn{color:var(--gn);}
/* Detail toolbar */
.dtb{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bl);border-bottom:1px solid var(--br);flex-wrap:wrap;}
.dtb label{font-size:12px;font-weight:600;color:var(--bd);white-space:nowrap;}
.dtb select{font-size:12px;padding:5px 10px;border:1px solid var(--br);border-radius:6px;background:#fff;min-width:260px;cursor:pointer;}
.dtb select:focus{outline:2px solid var(--bm);}
.ik-row{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto;}
.ik{background:#fff;border:1px solid var(--br);border-radius:6px;padding:5px 10px;text-align:center;min-width:68px;}
.ik .kv{display:block;font-size:16px;font-weight:700;color:var(--bd);}
.ik .kl{display:block;font-size:9.5px;text-transform:uppercase;color:var(--mu);letter-spacing:.4px;}
.ik.red .kv{color:var(--rd);}.ik.amber .kv{color:var(--ab);}.ik.grn .kv{color:var(--gn);}
/* Save bar */
.save-bar{display:flex;align-items:center;gap:10px;padding:8px 16px;background:#f0fdf4;border-bottom:1px solid #bbf7d0;flex-wrap:wrap;}
.save-bar .saved-note{font-size:11.5px;color:#166534;display:none;}
.btn{padding:7px 16px;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;}
.btn-save{background:#16a34a;color:#fff;}.btn-save:hover{background:#15803d;}
.btn-export{background:var(--bm);color:#fff;}.btn-export:hover{background:var(--bd);}
.btn-clear{background:#f3f4f6;color:#374151;border:1px solid var(--br);}.btn-clear:hover{background:#e5e7eb;}
/* Programme table */
.pr-gap td{background:#fff8f8;}
.col-chk{width:84px;white-space:nowrap;}
.col-id{font-family:'Consolas',monospace;font-size:11.5px;color:var(--mu);white-space:nowrap;}
.col-name{max-width:230px;word-break:break-word;}
.col-org{max-width:140px;word-break:break-word;}
.col-lfr{max-width:160px;}
.col-ben{max-width:110px;}
.col-holds{max-width:180px;}
.col-fb{width:180px;}
/* Opt buttons */
.opt-group{display:flex;gap:2px;}
.opt-btn{display:flex;align-items:center;gap:3px;padding:3px 7px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--br);background:#fff;}
.opt-btn input{display:none;}
.opt-btn.opt-in:has(input:checked){background:#dcfce7;border-color:#22c55e;color:#166534;}
.opt-btn.opt-out:has(input:checked){background:#fee2e2;border-color:#ef4444;color:#991b1b;}
.opt-btn.opt-none:has(input:checked){background:#f3f4f6;border-color:#9ca3af;color:#374151;}
.opt-btn:hover{background:#f8fafc;}
/* Feedback input */
.fb-input{width:100%;font-size:11.5px;padding:4px 7px;border:1px solid var(--br);border-radius:4px;resize:vertical;font-family:inherit;background:#fff;transition:border-color .15s;}
.fb-input:focus{outline:none;border-color:var(--bm);}
.fb-input.has-val{background:#fefce8;border-color:#fbbf24;}
/* Badges/tiers */
.badge{display:inline-block;padding:2px 7px;border-radius:10px;font-size:11px;font-weight:600;}
.st-funded{background:#dcfce7;color:#166534;}.st-gap{background:#fee2e2;color:#991b1b;}
.st-hold{background:#fef9c3;color:#854d0e;}.st-partial{background:#e0f2fe;color:#075985;}
.tier{display:inline-block;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:600;}
.t-imm{background:#fee2e2;color:#991b1b;}.t-sch{background:#fef3c7;color:#92400e;}
.t-ccb{background:#ede9fe;color:#5b21b6;}.t-oth{background:#f3f4f6;color:#374151;}
.tag-hold{display:inline-block;background:#fef9c3;color:#78350f;border-radius:3px;padding:1px 5px;font-size:10.5px;margin:1px 2px 1px 0;}
.tag-warn{display:inline-block;background:#e0f2fe;color:#075985;border-radius:3px;padding:1px 5px;font-size:10.5px;margin:1px 2px 1px 0;}
/* Gap section */
.gap-hdr{background:#fef2f2;padding:12px 16px;border-bottom:1px solid #fecaca;}
.gap-hdr h2{color:var(--rd);font-size:14px;font-weight:700;}
/* Misc */
.panel{background:var(--surf);border:1px solid var(--br);border-radius:8px;margin-bottom:18px;overflow:hidden;}
.exco-link{color:var(--bm);text-decoration:none;cursor:pointer;}
.exco-link:hover{text-decoration:underline;}
.hidden{display:none;}
.no-res{padding:24px;text-align:center;color:var(--mu);font-size:13px;display:none;}
.print-note{font-size:11px;color:var(--mu);text-align:right;margin-bottom:6px;}
.change-count{font-size:12px;font-weight:600;color:var(--bm);}
@media print{body{background:#fff;}.save-bar,.dtb select,.opt-group{display:none;}td,th{font-size:10px;padding:3px 5px;}}
`;

const JS = `
<script>
const STATS=${JSON.stringify(excoStats)};
const TOTAL=${total},FUNDED=${funded},DEMAND=${rnd2(totalCost)},FUNDEDM=${rnd2(totalFunded)},COV=${coverage},GAPS=${unfunded.length},HOLDS=${held.length};
const STORAGE_KEY='lfr_decisions_v570';

// Restore saved decisions from localStorage
function restore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    Object.entries(saved).forEach(([id,d])=>{
      const tr=document.querySelector('tr[data-id="'+id+'"]');
      if(!tr) return;
      if(d.opt){
        const radio=tr.querySelector('input[name="opt_'+id+'"][value="'+d.opt+'"]');
        if(radio){radio.checked=true;}
      }
      if(d.fb){
        const ta=tr.querySelector('.fb-input');
        if(ta){ta.value=d.fb;ta.classList.toggle('has-val',!!d.fb);}
      }
    });
    updateChangeCount();
  }catch(e){}
}

function updateKpis(exco,status){
  let rows=[...document.querySelectorAll('#ptbody tr')];
  if(exco!=='__all__') rows=rows.filter(r=>r.dataset.exco===exco);
  if(status!=='__all__') rows=rows.filter(r=>r.dataset.status===status);
  const s=exco!=='__all__'&&status==='__all__'?STATS[exco]:null;
  if(s&&status==='__all__'){
    set('ik-count',s.count); set('ik-dem',s.demand); set('ik-fund',s.fundedM);
    set('ik-cov',s.coverage+'%'); set('ik-gaps',s.gaps||'—'); set('ik-holds',s.holds||'—');
    cls('ik-gaps',s.gaps?'red':''); cls('ik-cov',s.coverage<100?'amber':'grn');
  } else {
    const vis=rows.filter(r=>!r.classList.contains('hidden'));
    const dem=vis.reduce((a,r)=>{const c=parseFloat(r.cells[5]?.textContent)||0;return a+c;},0);
    const fun=vis.reduce((a,r)=>{const c=parseFloat(r.cells[6]?.textContent)||0;return a+c;},0);
    const gaps=vis.filter(r=>r.dataset.status==='gap'||r.dataset.status==='hold').length;
    const holds=vis.filter(r=>r.dataset.status==='hold').length;
    const cov=dem>0?Math.round(fun/dem*1000)/10:0;
    set('ik-count',vis.length); set('ik-dem',Math.round(dem*100)/100);
    set('ik-fund',Math.round(fun*100)/100); set('ik-cov',cov+'%');
    set('ik-gaps',gaps||'—'); set('ik-holds',holds||'—');
    cls('ik-gaps',gaps?'red':''); cls('ik-cov',cov<100?'amber':'grn');
  }
}

function filterTable(){
  const exco=document.getElementById('dd-exco').value;
  const status=document.getElementById('dd-status').value;
  let vis=0;
  document.querySelectorAll('#ptbody tr').forEach(tr=>{
    const m=(exco==='__all__'||tr.dataset.exco===exco)&&(status==='__all__'||tr.dataset.status===status);
    tr.classList.toggle('hidden',!m);
    if(m) vis++;
  });
  document.getElementById('no-res').style.display=vis?'none':'block';
  updateKpis(exco,status);
  const sub=document.getElementById('det-sub');
  const eLabel=exco==='__all__'?'All ExCo Leaders':exco;
  const sLabel=status==='__all__'?'':' · '+{funded:'Funded only',gap:'Gaps only',hold:'Holds only',partial:'Partial scope'}[status];
  sub.textContent=vis+' programmes — '+eLabel+sLabel;
}

function saveDecisions(){
  const exco=document.getElementById('dd-exco').value;
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){}
  const rows=exco==='__all__'
    ?[...document.querySelectorAll('#ptbody tr')]
    :[...document.querySelectorAll('#ptbody tr[data-exco="'+exco+'"]')];
  rows.forEach(tr=>{
    const id=tr.dataset.id;
    const optEl=tr.querySelector('input[type="radio"]:checked');
    const fb=tr.querySelector('.fb-input')?.value||'';
    const opt=optEl?.value||'';
    if(opt||fb) saved[id]={opt,fb,ts:Date.now(),exco:tr.dataset.exco};
    else delete saved[id];
  });
  localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
  const note=document.getElementById('saved-note');
  note.textContent='Saved '+(exco==='__all__'?'all decisions':exco+"'s decisions")+' · '+new Date().toLocaleTimeString();
  note.style.display='inline';
  setTimeout(()=>note.style.display='none',3500);
  updateChangeCount();
}

function exportDecisions(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){}
  const out=JSON.stringify({exportedAt:new Date().toISOString(),decisions:saved},null,2);
  const a=document.createElement('a');
  a.href='data:application/json,'+encodeURIComponent(out);
  a.download='LFR-ExCo-Decisions-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
}

function clearDecisions(){
  if(!confirm('Clear all saved decisions? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  document.querySelectorAll('#ptbody tr').forEach(tr=>{
    const id=tr.dataset.id;
    const none=tr.querySelector('input[value=""]');
    if(none) none.checked=true;
    const ta=tr.querySelector('.fb-input');
    if(ta){ta.value='';ta.classList.remove('has-val');}
  });
  updateChangeCount();
}

function updateChangeCount(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){}
  const n=Object.keys(saved).length;
  document.getElementById('change-count').textContent=n?n+' decision'+(n>1?'s':'')+' saved':'No decisions saved yet';
}

function set(id,v){const el=document.getElementById(id);if(el) el.textContent=v;}
function cls(id,c){
  const el=document.getElementById(id)?.closest('.ik');
  if(!el) return;
  el.className='ik'+(c?' '+c:'');
}

// Expose globally so button onclick attr also works
window.saveDecisions   = saveDecisions;
window.exportDecisions = exportDecisions;
window.clearDecisions  = clearDecisions;

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('dd-exco').addEventListener('change',filterTable);
  document.getElementById('dd-status').addEventListener('change',filterTable);
  document.getElementById('btn-save').addEventListener('click',saveDecisions);
  document.getElementById('btn-export').addEventListener('click',exportDecisions);
  document.getElementById('btn-clear').addEventListener('click',clearDecisions);

  // Feedback highlight
  document.querySelectorAll('.fb-input').forEach(ta=>{
    ta.addEventListener('input',()=>ta.classList.toggle('has-val',!!ta.value));
  });

  // Summary row click → filter to that ExCo
  document.querySelectorAll('.exco-link').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const exco=a.dataset.exco;
      document.getElementById('dd-exco').value=exco;
      document.getElementById('dd-status').value='__all__';
      filterTable();
      document.getElementById('detail').scrollIntoView({behavior:'smooth'});
    });
  });

  restore();
  updateChangeCount();
});
</script>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AOP 2027 — LFR Must-Do Portfolio Report (ExCo)</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">

<!-- HEADER -->
<div class="hdr">
  <h1>AOP 2027 — Legal, Compliance &amp; Must-Do (LFR) Portfolio Report</h1>
  <p class="sub">Stage 0 Gate · LFR Lever Mechanics · ExCo Accountability &amp; Decisions</p>
  <p class="meta">Engine v5.7.0 &nbsp;·&nbsp; Finance-20260930 &nbsp;·&nbsp; 30 September 2026 &nbsp;·&nbsp; Optimal Segmentation &nbsp;·&nbsp; Confidential — ExCo and IT Leadership</p>
</div>
<p class="print-note">Confidential · For ExCo and IT Leadership use only · AOP 2027 Planning Cycle</p>

<!-- KPI BAR -->
<div class="kbar">
  <div class="kc"><div class="v">${total}</div><div class="l">LFR Programmes</div></div>
  <div class="kc good"><div class="v">${funded}</div><div class="l">Funded</div></div>
  <div class="kc danger"><div class="v">${unfunded.length}</div><div class="l">Funding Gaps</div></div>
  <div class="kc ${held.length?'warn':''}"><div class="v">${held.length}</div><div class="l">Hold Conditions</div></div>
  <div class="kc"><div class="v">${rnd2(totalCost)}</div><div class="l">Total Demand M€</div></div>
  <div class="kc ${coverage<100?'warn':'good'}"><div class="v">${coverage}%</div><div class="l">Budget Coverage</div></div>
</div>

<!-- LFR LEVER -->
<section style="margin-bottom:18px">
<div class="stitle">LFR Lever — How It Works</div>
<div class="lbox">
  <h2>The LFR lever controls the budget envelope reserved for all mandatory legal, regulatory, and compliance programmes (Stage 0)</h2>
  <p>LFR stands for <strong>Legal, Financial &amp; Regulatory</strong>. These are non-negotiable programmes — failing to fund them creates direct legal exposure, regulatory breach, audit findings, or loss of operating licence. The LFR lever does not make them optional; it controls how much of the overall AOP budget is ringfenced to cover them.</p>

  <div class="lgrid">
    <div class="lcard c0">
      <h4>🔴 Immediate (P1) — ${lfrRaw.filter(r=>r.lfrTier==='Immediate').length} programmes</h4>
      <p>Active regulatory deadlines or contractual obligations due in 2027. Must be funded before any other stage. Decision band = Healthy/Must-Do P1 Immediate in the source workbook.</p>
      <p><strong>Total demand: ${rnd2(lfrRaw.filter(r=>r.lfrTier==='Immediate').reduce((s,r)=>s+(r.cost||0),0))} M€</strong></p>
    </div>
    <div class="lcard c1">
      <h4>🟡 Scheduled (P2) — ${lfrRaw.filter(r=>r.lfrTier==='Scheduled').length} programmes</h4>
      <p>Known future obligations with a 2027 scheduled commitment. High priority but not immediately overdue. Decision band = Healthy/Must-Do P2 Scheduled.</p>
      <p><strong>Total demand: ${rnd2(lfrRaw.filter(r=>r.lfrTier==='Scheduled').reduce((s,r)=>s+(r.cost||0),0))} M€</strong></p>
    </div>
    <div class="lcard c2">
      <h4>🟣 CCB Exceptions — ${lfrRaw.filter(r=>r.lfrTier==='CCB').length} programmes</h4>
      <p>Change Control Board-approved legacy exceptions (EW-11, EW-65, EW-71). Funded outside the normal LFR evidence gate. Verified by CCB decision record.</p>
      <p><strong>Total demand: ${rnd2(lfrRaw.filter(r=>r.lfrTier==='CCB').reduce((s,r)=>s+(r.cost||0),0))} M€</strong></p>
    </div>
  </div>

  <div class="lever-flow" style="margin-top:16px">
    <div class="lf-step funded"><h5>Stage 0 Demand</h5><p>${rnd2(totalCost)} M€ total across ${total} programmes</p></div>
    <div class="lf-step funded"><h5>LFR Lever</h5><p>Bucket basis · <strong>82.4%</strong> of demand = <strong>43.8 M€</strong> reserved</p></div>
    <div class="lf-step funded"><h5>Funding Order</h5><p>Verified P1 → Verified P2 → CCB → Unverified (by score)</p></div>
    <div class="lf-step funded"><h5>Funded</h5><p><strong>${funded}</strong> programmes · <strong>${rnd2(totalFunded)} M€</strong></p></div>
    <div class="lf-step held"><h5>Not Funded</h5><p><strong>${unfunded.length}</strong> programmes · <strong>${rnd2(unfunded.reduce((s,r)=>s+(r.cost||0),0))} M€</strong></p></div>
  </div>

  <p style="margin-top:14px"><strong>Lever basis options:</strong></p>
  <ul>
    <li><strong>Bucket % (default 82.4%):</strong> Reserves a % of total Stage 0 demand. At 100%, all verified LFR programmes are funded. Reducing below 82.4% will start dropping the lowest-scoring unverified LFR items.</li>
    <li><strong>AOP % basis:</strong> Reserves a % of the Total AOP budget (e.g. 40% of 100M = 40M for LFR). Useful when you want to cap LFR regardless of how many programmes are submitted.</li>
    <li><strong>Fixed amount (M€):</strong> Sets a hard ceiling in euros. If LFR demand exceeds this, lowest-scoring programmes are dropped.</li>
  </ul>
  <p style="margin-top:10px"><strong>Funding priority within Stage 0:</strong> (1) Verified LFR — programmes with both LFR Name and LFR Year evidence fields populated. (2) Unverified LFR — sorted by score descending. (3) CCB exceptions — always funded regardless of score. Changing the lever % only affects which unverified programmes fall outside the envelope; P1 Immediate programmes are always at the top of the order.</p>
  <p style="margin-top:8px"><strong>Hold conditions in LFR:</strong> A programme is held (not funded automatically) if: priority = "TBD", overall decision band is invalid or blank, or a Contain condition has no remarks/justification. Holds require source workbook correction or an explicit ExCo override — they cannot be resolved by adjusting the lever.</p>
</div>
</section>

<!-- EXCO SUMMARY -->
<section style="margin-bottom:18px">
<div class="stitle">ExCo Accountability Summary — All ${total} LFR Programmes</div>
<div class="panel">
<table>
  <thead><tr>
    <th>ExCo Leader</th><th>Role / Area</th>
    <th style="text-align:right"># Pgms</th><th style="text-align:right">Funded</th>
    <th style="text-align:right">Gaps</th><th style="text-align:right">Demand M€</th>
    <th style="text-align:right">Funded M€</th><th style="text-align:right">Coverage</th>
    <th>Holds</th>
  </tr></thead>
  <tbody>${sumRows}</tbody>
  <tfoot><tr>
    <td colspan="2">TOTAL</td>
    <td class="num">${total}</td><td class="num">${funded}</td>
    <td class="num c-red">${unfunded.length}</td>
    <td class="num">${rnd2(totalCost)}</td><td class="num">${rnd2(totalFunded)}</td>
    <td class="num ${coverage<100?'c-amber':'c-grn'}">${coverage}%</td><td></td>
  </tr></tfoot>
</table>
</div>
</section>

<!-- FUNDING GAPS -->
<section style="margin-bottom:18px">
<div class="stitle" style="color:var(--rd)">⚠ Funding Gaps — ${unfunded.length} LFR Programmes Without Allocation</div>
<div class="panel">
  <div class="gap-hdr">
    <h2>Mandatory programmes not funded in the Optimal scenario</h2>
    <p style="font-size:12px;color:#7f1d1d;margin-top:4px">Each requires an ExCo decision or source correction. Items with no hold condition are budget-pressure gaps — an override in the modeller will fund them immediately.</p>
  </div>
  <div style="overflow-x:auto">
  <table>
    <thead><tr>
      <th>ID</th><th>Programme</th><th>ExCo Leader</th>
      <th>Demand M€</th><th>Tier</th><th>Reason / Hold</th><th>LFR Reference</th>
    </tr></thead>
    <tbody>${gapRows}</tbody>
  </table>
  </div>
</div>
</section>

<!-- INTERACTIVE DETAIL -->
<section id="detail">
<div class="stitle">LFR Programme Detail by ExCo Leader</div>
<div class="panel">

  <!-- TOOLBAR: ExCo filter + Status filter + KPIs -->
  <div class="dtb">
    <label>ExCo Leader</label>
    <select id="dd-exco">${ddExco}</select>
    <label>Status</label>
    <select id="dd-status">${ddStatus}</select>
    <div class="ik-row">
      <div class="ik"><span class="kv" id="ik-count">${total}</span><span class="kl">Programmes</span></div>
      <div class="ik"><span class="kv" id="ik-dem">${rnd2(totalCost)}</span><span class="kl">Demand M€</span></div>
      <div class="ik"><span class="kv" id="ik-fund">${rnd2(totalFunded)}</span><span class="kl">Funded M€</span></div>
      <div class="ik ${coverage<100?'amber':'grn'}"><span class="kv" id="ik-cov">${coverage}%</span><span class="kl">Coverage</span></div>
      <div class="ik ${unfunded.length?'red':''}"><span class="kv" id="ik-gaps">${unfunded.length||'—'}</span><span class="kl">Gaps</span></div>
      <div class="ik ${held.length?'amber':''}"><span class="kv" id="ik-holds">${held.length||'—'}</span><span class="kl">Holds</span></div>
    </div>
  </div>

  <!-- SAVE BAR -->
  <div class="save-bar">
    <button class="btn btn-save" id="btn-save" onclick="saveDecisions()">💾 Save Decisions</button>
    <button class="btn btn-export" id="btn-export" onclick="exportDecisions()">⬇ Export JSON</button>
    <button class="btn btn-clear" id="btn-clear" onclick="clearDecisions()">✕ Clear All</button>
    <span class="change-count" id="change-count">No decisions saved yet</span>
    <span class="saved-note" id="saved-note"></span>
  </div>

  <p id="det-sub" style="font-size:12px;color:var(--mu);padding:7px 16px 5px;border-bottom:1px solid var(--br)">
    Showing all ${total} LFR programmes across all ExCo leaders
  </p>

  <div style="overflow-x:auto">
  <table>
    <thead><tr>
      <th>Opt In/Out</th>
      <th>ID</th>
      <th>Programme Name</th>
      <th>Organisation</th>
      <th>Priority Tier</th>
      <th>Demand M€</th>
      <th>Funded M€</th>
      <th>Status</th>
      <th>LFR Reference</th>
      <th>Benefit Class</th>
      <th>Holds / Flags</th>
      <th>Feedback</th>
    </tr></thead>
    <tbody id="ptbody">${progRows}</tbody>
  </table>
  <p id="no-res" class="no-res">No programmes match the selected filters.</p>
  </div>

</div>
</section>

</div>
${JS}
</body>
</html>`;

const outPath = path.join(D, '..', '..', 'AOP2027-LFR-ExCo-Report.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Written:', outPath, `(${Math.round(html.length/1024)} KB)`);
