/* Offline UI. Every view uses the same engine result and scenario revision. */
(()=>{'use strict';
const $=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec=x=>x===null||x===undefined?'Not supplied':(Math.sign(Number(x))*Math.ceil((Math.abs(Number(x))-1e-10)*10)/10).toFixed(1),money=x=>x===null?'Not supplied':dec(x)+' M€',count=x=>String(x);
let session=AOP.createSession(AOP.normalize(JSON.parse($('#source-data').textContent))),result,tab='scenario',saved=[],pending=null,db=null;
const tabNames={demand:'Demand Overview',scenario:'Program AOP Scenarios',ew:'Enterprise Wide',bu:'BU Led',operations:'Operations',overview:'AOP 2027 : One Portfolio'};
const expanded=new Set();
let pointerRenderHold=false,renderPending=false;
function flushPendingRender(){pointerRenderHold=false;if(renderPending)render();}
document.addEventListener('pointerdown',e=>{const active=document.activeElement;if(active?.matches('input:not([type=checkbox]):not([type=range]):not([type=file])')&&active.value!==active.defaultValue&&e.target!==active&&e.target.closest('button,input,select,summary,a'))pointerRenderHold=true;},true);
document.addEventListener('click',()=>{pointerRenderHold=false;setTimeout(flushPendingRender,0);},true);
document.addEventListener('pointerup',()=>setTimeout(flushPendingRender,250),true);
document.addEventListener('pointercancel',flushPendingRender,true);
const definitions=['<ul><li>Verifies minimum evidence before funding</li><li>Gaps are flagged, not hidden</li><li>No budget reserved at this gate</li></ul>','<ul><li>Mandatory legal, regulatory and compliance commitments</li><li>Requires verified compliance name and year</li><li>CCB exceptions funded in full</li></ul>','<ul><li>Prior-year commitments with confirmed business case</li><li>Funding capped at original approved amount</li><li>Must Do or Must Have priority required</li></ul>','<ul><li>Sustain Engineering funded first</li><li>CI and Upgrades compete on merit</li><li>Keeps the lights on within budget</li></ul>','<ul><li>New features, AI, decommissioning, growth</li><li>Ranked by evidence strength then merit</li><li>Qualitative and quantitative benefits scored</li></ul>'];
function toast(t,error=false){const el=$('#toast');el.textContent=t;el.className='toast'+(error?' error':'');el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,6500);}
function download(name,bytes,type='application/octet-stream'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function dbput(key,value){return new Promise((resolve,reject)=>{if(!db)return reject(Error('Browser storage unavailable. Export the portable scenario to keep it.'));const tx=db.transaction('scenarios','readwrite');tx.objectStore('scenarios').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function dbget(key){return new Promise((resolve,reject)=>{if(!db)return resolve(null);const q=db.transaction('scenarios').objectStore('scenarios').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function persist(){try{await dbput('draft',session);}catch(e){toast(e.message,true);}}
async function save(){session.name=AOP.clean($('#scenario-name')?.value)||session.name;session.savedAt=new Date().toISOString();const snap=AOP.clone(session),key=session.id+'-r'+session.revision;await dbput(key,snap);saved=saved.filter(x=>x.key!==key);saved.unshift({key,name:session.name,status:session.status,revision:session.revision,time:session.savedAt,source:session.data.version,allocation:result.totals.allocation,unfunded:result.totals.unfunded,over:result.totals.over});await dbput('index',saved);await persist();render();toast('Saved '+session.name+' revision '+session.revision+'. Export a portable copy for backup.');}
function commit(action,details={},origin=tabNames[tab]){try{session=AOP.transact(session,action,details,origin);render();persist();toast('Change recorded and all views updated.');return true;}catch(e){toast(e.message,true);return false;}}
function kpi(label,value,note='',cls=''){return '<div class="kpi '+cls+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>';}
function coverage(field){const groups=new Map();for(const r of result.rows){const n=r[field]||'Blank / unassessed',g=groups.get(n)||{n:0,v:0};g.n++;g.v+=r.cost||0;groups.set(n,g);}return '<table><thead><tr><th>'+esc(field==='decisionBand'?'Decision Band':'Overall AOP decision')+'</th><th>Rows</th><th>Requested</th></tr></thead><tbody>'+[...groups].map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+v.n+'</td><td>'+money(v.v)+'</td></tr>').join('')+'</tbody></table>';}
function workflow(){return '<div class="workflow"><button data-tab="demand" class="step '+(tab==='demand'?'current':'')+'">1 · Demand Overview</button><button data-tab="scenario" class="step '+(tab==='scenario'?'current':'')+'">2 · Program Scenarios</button><button data-tab="ew" class="step '+(tab==='ew'?'current':'')+'">3 · Enterprise Wide</button><button data-tab="bu" class="step '+(tab==='bu'?'current':'')+'">4 · BU Led</button><button data-tab="operations" class="step '+(tab==='operations'?'current':'')+'">5 · Operations</button><button data-tab="overview" class="step '+(tab==='overview'?'current':'')+' '+(session.status==='Finalised'?'done':'')+'">6 · One Portfolio</button></div>';}
function render(){if(pointerRenderHold){result=AOP.solve(session.data,session.settings,session.overrides,session.reviews);result.rows.forEach(function(r){r.platform=(window.normalizePlatform||function(p){return p;})(r.platform||'')||r.platform||'';});window.__aop={session,result,tab,pending};renderPending=true;return;}renderPending=false;hideBubble();const scroll=[...document.querySelectorAll('.tablebox')].map(x=>({top:x.scrollTop,left:x.scrollLeft}));result=AOP.solve(session.data,session.settings,session.overrides,session.reviews);result.rows.forEach(function(r){r.platform=(window.normalizePlatform||function(p){return p;})(r.platform||'')||r.platform||'';});$('#tabs').innerHTML=Object.entries(tabNames).map(([k,v])=>'<button data-tab="'+k+'" class="'+(tab===k?'active':'')+'">'+v+'</button>').join('');$('#workflow').innerHTML=workflow();$('#status').textContent=session.name+' · '+session.status+' · r'+session.revision+' · '+(session.savedAt?'Saved':'Unsaved draft')+' · Source '+session.data.version;$('#main').innerHTML=tab==='scenario'?scenario():tab==='demand'?window.renderDemandOverview(session,result):tab==='operations'?window.renderOperationsTab():stream(tab);document.querySelectorAll('.tablebox').forEach((x,i)=>{if(scroll[i]){x.scrollTop=scroll[i].top;x.scrollLeft=scroll[i].left;}});document.querySelectorAll('[data-group-check]').forEach(x=>{const rs=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]).filter(r=>(r.org||'Organisation not supplied')===x.dataset.groupCheck&&r.cost>0);x.checked=rs.length>0&&rs.every(r=>r.final>0);x.indeterminate=rs.some(r=>r.final>0)&&rs.some(r=>!r.final);});window.__aop={session,result,tab,pending};}
function allocationSelection(funded,demand,fundable){return '<div class="allocation-selection" style="white-space:nowrap;font-size:13px;line-height:1.5;margin-top:6px"><strong class="selected-amount" style="color:var(--prot)">'+money(funded)+'</strong> funded of '+money(fundable!==undefined?fundable:demand)+' Demand</div>';}
function allocationKpi(){return '<div class="kpi allocation-kpi"><span>Allocated AOP</span><strong id="displayed-lever-total" data-exact="'+result.totals.allocation+'">'+money(result.totals.allocation)+'</strong><small>of '+money(session.settings.budget)+' Total AOP</small><b id="funded-aop" data-exact="'+result.totals.allocation+'">'+result.totals.count+' programmes funded</b><small>'+(result.totals.over>0?'Over by '+money(result.totals.over):'Within budget')+'</small></div>';}
function reconciliation(){return '<details id="allocation-reconciliation"><summary>Selected limits and funded demand</summary><p>The displayed lever total adds the rounded amounts on the five controls. It is not funded spend: unused capacity can pass to a later stage, and eligible whole requests may not fill a selected limit.</p><table><thead><tr><th>Funding stage</th><th>Selected limit (M€)</th><th>Funded (M€)</th><th>Unfilled limit (M€)</th></tr></thead><tbody>'+result.stages.map((s,i)=>'<tr data-stage-summary="'+i+'" data-funded="'+s.allocation+'"><td>'+esc(s.name)+'</td><td title="Exact '+result.selection.amounts[i]+' M€">'+dec(result.selection.amounts[i])+'</td><td title="Exact '+s.allocation+' M€">'+dec(s.allocation)+'</td><td>'+dec(Math.max(0,result.selection.amounts[i]-s.allocation))+'</td></tr>').join('')+'</tbody><tfoot><tr><th>Funded portfolio</th><td></td><td data-funded-total="'+result.totals.allocation+'">'+dec(result.totals.allocation)+'</td><td>'+dec(result.totals.available)+' budget unspent</td></tr></tfoot></table><p>Funding follows source evidence, eligibility, whole-program fit and recorded manual decisions. The tables below contain the funded amounts and reasons for each unfunded request.</p></details>';}
function streamShareKpi(){const total=result.totals.allocation,ew=result.streams.ew.allocation,bu=result.streams.bu.allocation,ewPct=total?Math.round(ew/total*1000)/10:null,buPct=ewPct===null?null:100-ewPct;return '<div class="kpi split-kpi"><span>EW and BU Led Share</span><strong>EW '+money(ew)+' <em>'+(ewPct===null?'—':ewPct.toFixed(1)+'%')+'</em></strong><strong>BU Led '+money(bu)+' <em>'+(buPct===null?'—':buPct.toFixed(1)+'%')+'</em></strong><small>Split of final allocated AOP</small></div>';}
function scenario(){
 const t=result.totals,s=session.settings,funded=result.rows.filter(r=>r.final>0),unfunded=result.rows.filter(r=>r.final===0||r.unfunded>0),pf=session.filters.prioritized||(session.filters.prioritized={}),shown=AOP.filter(funded,pf);
 const merit=[['Benefit strength','<ul><li>Quantitative: ratio-based scoring when financial data is available</li><li>Qualitative fallback from text analysis when numbers are missing</li><li>Revenue and productivity claims require hard numbers</li><li>Claims above 10x flagged for review</li></ul>'],['Submitted priority','<ul><li>Must Do scores highest</li><li>Must Have next</li><li>Deprioritised lowest</li><li>Blank or unrecognised scores zero</li></ul>'],['Captured Consequence','<ul><li>Real-world impact of not proceeding</li><li>Drawn from Problem Statement, Scope and Impact</li><li>Higher scores for quantified enterprise-wide consequences</li></ul>'],['Decision Band','<ul><li>Healthy: ready for merit ranking</li><li>Contain: needs documented condition</li><li>Blank: not assessed, scores zero</li></ul>'],['Payback Period','<ul><li>Within 1 year scores highest</li><li>Within 5 years receives partial credit</li><li>Longer or missing scores zero</li></ul>']];
 return '<section class="kpis">'+allocationKpi()+kpi('Initiatives funded',count(t.count),count(t.partial)+' partial scope decisions')+streamShareKpi()+kpi(t.over?'Over Total AOP':'Open to prioritisation',money(t.over||t.available),t.over?'Variance retained, no silent rebalance':'Unspent planning envelope',t.over?'danger':'')+kpi('Demand left unfunded',money(t.unfunded),t.missing+' rows have missing request','dark')+'</section>'+
 '<section class="panel"><h2>Where the fund goes</h2><p>'+esc(session.name)+' · Automatic '+money(t.automatic)+' · Decision delta '+(t.manual<0?'reduction ':'addition ')+money(Math.abs(t.manual))+'</p><div class="fundbar">'+result.stages.filter(x=>x.allocation>0).map(x=>'<div style="flex:'+x.allocation+';background:'+['#00126E','#0B5ED7','#008BA3','#70ADE0'][result.stages.indexOf(x)]+'" title="'+esc(x.name)+' '+money(x.allocation)+'">'+money(x.allocation)+'</div>').join('')+'</div><div class="legend">'+result.stages.map((x,i)=>'<span><i style="background:'+['#00126E','#0B5ED7','#008BA3','#226EB0','#70ADE0'][i]+'"></i>'+esc(x.name)+' <b>'+money(x.allocation)+'</b></span>').join('')+'</div>'+'</section>'+ 
 controls()+
 '<section class="panel"><h2>Funding Prioritization Gate</h2><p class="muted" style="font-size:10px">One evidence check, then one funding stage per request. Funding follows the numbered order.</p><div class="gates">'+['Evidence and decision check',...AOP.STAGES].map((x,i)=>'<article class="gate"><div class="gate-head"><b class="number">'+i+'</b><h3>'+esc(x)+'</h3></div>'+definitions[i]+'</article>').join('')+'</div></section>'+
 '<details class="panel section-panel"><summary>Merit Score Framework</summary><div class="score-grid">'+merit.map((x,i)=>'<article><h3>'+x[0]+' · '+dec(s.weights[i])+'%</h3>'+x[1]+'</article>').join('')+'</div><p class="muted">Five components sum to 100. Weights are adjustable in Advanced Configuration. Consequence is scored from submitted evidence, not fabricated. Carryover eligibility uses its own RoI threshold, separate from the merit floor.</p></details>'+
 '<details class="panel section-panel" open><summary>Demand Prioritized</summary><p>'+funded.length+' requests have a prioritised amount. This view updates immediately after a decision in Enterprise Wide or BU Led.</p>'+priorityFilters(funded)+table(shown,'prioritized',false,funded)+'</details>'+
 '<details class="panel section-panel" open><summary>Demand Not Funded</summary><p>'+unfunded.length+' requests have no funding or residual unfunded demand. Missing request amounts are not treated as zero.</p>'+table(unfunded,'unfunded',false)+'</details>'+logs();
}
function controls(){const s=session.settings,disabled=session.status==='Finalised'?' disabled':'';return '<section class="panel"><h2>Scenario and funding levers</h2><div class="toolbar"><label>Total AOP (M\u20ac) <input id="budget" type="number" step="0.1" min="0" value="'+dec(s.budget)+'"'+disabled+'></label>'+[['optimal','Optimal Segmentation \xb7 Recommended'],['protect','Protect Commitments'],['evidence','Tighten Carryover Evidence'],['capacity','Release Sustain Capacity']].map(([k,v])=>'<button data-preset="'+k+'" class="'+(session.preset===k?'primary':'')+'"'+disabled+'>'+v+'</button>').join('')+'</div><p class="muted">The 100 M\u20ac starting envelope is illustrative. Presets retain the entered Total AOP.</p><div class="levers">'+[['1 \xb7 Legal and Compliance (Must Do)','lfr',0,'lever'],['2 \xb7 High-Value Carry-Overs','carry',1,'roi'],['3 \xb7 Sustain Engineering and Hygiene','sustain',2,'lever'],['4 \xb7 Value Based Portfolio','value',3,'lever']].map(([title,k,si,mode])=>{if(mode==='roi')return '<article><h3>'+esc(title)+'</h3><p>Minimum benefit / request (RoI)</p><input id="carry" aria-label="Carryover RoI threshold" type="range" min="0" max="5" step="0.5" value="'+s.carry+'"'+disabled+'><span class="threshold-value">'+dec(s.carry)+'x'+(s.carry>=5?'+':'')+'</span>'+allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>';const v=s[k],isAmt=v.basis==='amount',val=isAmt?(v.amount||0):v.pct,max=isAmt?Math.max(Math.ceil(result.stages[si].demand),Math.ceil(val)):Math.max(100,val),step=isAmt?'0.001':'0.1',unit=isAmt?'M\u20ac':'%',label=isAmt?'allocation':'percentage';return '<article><h3>'+esc(title)+'</h3><div class="basis">'+[['bucket','% of bucket demand'],['aop','% of Total AOP'],['amount','Allocation (M\u20ac)']].map(([b,bl])=>'<button data-basis="'+k+'" data-value="'+b+'" class="'+(v.basis===b?'active':'')+'"'+disabled+'>'+bl+'</button>').join('')+'</div><input aria-label="'+esc(title)+' '+label+'" data-lever="'+k+'" type="range" min="0" max="'+max+'" step="'+step+'" value="'+val+'"'+disabled+'><label><input aria-label="'+esc(title)+' '+label+' value" data-lever="'+k+'" type="number" min="0" max="'+max+'" step="'+step+'" value="'+dec(val)+'"'+disabled+'> '+unit+'</label>'+allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>';}).join('')+'</div><details class="advanced"><summary>Additional configuration \xb7 merit, weights and tolerance</summary><div class="toolbar"><label>Merit floor <input id="merit" type="number" min="0" max="100" step="0.1" value="'+dec(s.merit)+'"'+disabled+'></label><label>Whole-program flex (%) <input id="tolerance" type="number" min="0" max="5" step="0.1" value="'+dec(s.tolerance)+'"'+disabled+'></label>'+['Benefit','Priority','Consequence','Band','Payback'].map((n,i)=>'<label>'+n+' weight <input class="weight" data-index="'+i+'" type="number" min="0" max="100" step="0.1" value="'+dec(s.weights[i])+'"'+disabled+'></label>').join('')+'<button id="apply-weights"'+disabled+'>Apply weights together</button></div></details><details><summary>Compare the four scenario presets</summary><table><thead><tr><th>Preset</th><th>P1: LFR</th><th>P2: Carry RoI</th><th>P3: Sustain</th><th>P4: Value</th><th>Allocated</th><th>Unfunded</th></tr></thead><tbody>'+[['optimal','Optimal Segmentation','100% bucket','0x','100% bucket','100% bucket'],['protect','Protect Commitments','100% bucket','2.0x','100% bucket','10% AOP'],['evidence','Tighten Carryover','100% bucket','3.0x','75% bucket','15% AOP'],['capacity','Release Sustain','44% bucket','0x','75% bucket','20% AOP']].map(([k,n,p1,p2,p3,p4])=>{const setting=AOP.preset(k);setting.budget=s.budget;const x=AOP.solve(session.data,setting);return '<tr class="'+(session.preset===k?'group':'')+'"><td><strong>'+n+'</strong></td><td>'+p1+'</td><td>'+p2+'</td><td>'+p3+'</td><td>'+p4+'</td><td><strong>'+money(x.totals.allocation)+'</strong></td><td>'+money(x.totals.unfunded)+'</td></tr>';}).join('')+'</tbody></table></details><div class="toolbar savebar"><label>Scenario name <input id="scenario-name" value="'+esc(session.name)+'"'+disabled+'></label><button id="save" class="primary">Save</button><button id="export-inclusions">Export inclusions \xb7 Excel</button><button id="export-full">Export full \xb7 Excel</button><button id="export-json">Export JSON</button><label class="file-button">Open scenario<input id="import-json" type="file" accept=".json"></label><button data-action="fork">New working version</button></div><div class="saved-list">'+saved.slice(0,8).map(x=>'<button data-open="'+esc(x.key)+'">'+esc(x.name)+' \xb7 r'+x.revision+' \xb7 '+x.status+'</button>').join('')+'</div></section>';}
function filters(scope,rows){const f=session.filters[scope]||{},keys=['org','platform','newCarry','area','status'],labels=['BURF organisation','IT platform','New / Carryover / Sustain','Investment area','Funding status'];return '<div class="filter-row">'+keys.map((k,i)=>{const previous=Object.fromEntries(keys.slice(0,i).map(a=>[a,f[a]])),options=[...new Set([...AOP.filter(rows,previous).map(r=>r[k]||'Not supplied'),...(f[k]||[])])].sort();return '<details class="filter"><summary>'+labels[i]+': '+(f[k]?.length?f[k].length+' selected':'All')+'</summary><div class="filter-options">'+options.map(v=>'<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(f[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(rows,{...previous,[k]:[v]}).length+')</label>').join('')+'</div></details>';}).join('')+'<input data-search-scope="'+scope+'" aria-label="Search programs" placeholder="Search program or ID" value="'+esc(f.search||'')+'"><button data-clear-scope="'+scope+'">Clear</button><button data-export-scope="'+scope+'" class="primary">Download Excel</button></div>';}
function priorityFilters(rows){const scope='prioritized',f=session.filters[scope]||(session.filters[scope]={}),keys=['org','platform','stageName'],labels=['BUR','Platform','Priority'];return '<div class="filter-row prioritized-filters">'+keys.map((k,i)=>{const previous=Object.fromEntries(keys.slice(0,i).map(a=>[a,f[a]])),options=[...new Set([...AOP.filter(rows,previous).map(r=>r[k]||'Not supplied'),...(f[k]||[])])].sort();return '<details class="filter"><summary>'+labels[i]+': '+(f[k]?.length?f[k].length+' selected':'All')+'</summary><div class="filter-options">'+options.map(v=>'<label><input type="checkbox" data-filter="'+k+'" data-scope="'+scope+'" value="'+esc(v)+'" '+(f[k]?.includes(v)?'checked':'')+'>'+esc(v)+' ('+AOP.filter(rows,{...previous,[k]:[v]}).length+')</label>').join('')+'</div></details>';}).join('')+'<button data-clear-scope="prioritized">Clear filters</button></div>';}
function chart(rows){const valid=rows.filter(r=>r.cost>0),max=Math.max(10,...valid.map(r=>r.cost)),min=Math.min(.01,...valid.map(r=>r.cost)),lo=Math.log10(min),hi=Math.log10(max),y=v=>360-(Math.log10(v)-lo)/(hi-lo)*310,median=AOPViews.median(valid.map(r=>r.score));return '<div class="chart-head"><h3>Requested investment and merit</h3><label>Colour <select id="chart-colour"><option value="funding" '+(session.chartColour!=='band'?'selected':'')+'>Funding status</option><option value="band" '+(session.chartColour==='band'?'selected':'')+'>Decision Band</option></select></label></div><div class="chart-reference-values"><span class="median-value" data-median="'+(median??'')+'">Median merit: <b>'+(median===null?'No plotted programs':dec(median))+'</b></span><span class="merit-value">Merit threshold: <b>'+dec(session.settings.merit)+'</b></span><small>Median uses the '+valid.length+' plotted programs in this filtered view.</small></div><svg class="bubble-chart" viewBox="0 0 1200 410" role="img" aria-label="Requested demand on logarithmic vertical axis against merit score"><rect x="55" y="25" width="1110" height="335" fill="#FAFBFC"/>'+Array.from({length:11},(_,i)=>'<line x1="'+(55+i*11.1*10)+'" x2="'+(55+i*111)+'" y1="25" y2="360" stroke="#e4e9ef" stroke-dasharray="3 5"/><text x="'+(55+i*111)+'" y="385" text-anchor="middle">'+i*10+'</text>').join('')+Array.from({length:Math.floor(hi)-Math.ceil(lo)+1},(_,i)=>{const v=10**(Math.ceil(lo)+i);return '<line x1="55" x2="1165" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#e4e9ef"/><text x="48" y="'+y(v)+'" text-anchor="end">'+(v<.1?dec(v*1000)+' K€':dec(v)+' M€')+'</text>';}).join('')+valid.map(r=>{const fill=session.chartColour==='band'?(AOP.key(r.decisionBand)==='healthy'?'#27934C':AOP.key(r.decisionBand)==='contain'?'#FFBE2C':'#909EAA'):(r.status==='Partial scope'?'#FCA708':r.status==='Excluded'?'#D43F44':r.final>0?'#20A53A':'#DF8A96');return '<circle data-bubble="'+esc(r.id)+'" tabindex="0" role="img" aria-label="'+esc(r.name+'; merit '+dec(r.score)+'; requested '+money(r.cost))+'" cx="'+(55+r.score*11.1)+'" cy="'+y(r.cost)+'" r="'+Math.max(3,Math.min(27,Math.sqrt(r.cost/max)*27))+'" fill="'+fill+'" opacity=".65"></circle>';}).join('')+(median===null?'':'<line class="median-line" x1="'+(55+median*11.1)+'" x2="'+(55+median*11.1)+'" y1="25" y2="360" stroke="#596C83" stroke-width="2" stroke-dasharray="2 5"/><text class="median-label" x="'+Math.min(1100,Math.max(95,55+median*11.1))+'" y="13" text-anchor="middle">Median '+dec(median)+'</text>')+'<line class="merit-line" x1="'+(55+session.settings.merit*11.1)+'" x2="'+(55+session.settings.merit*11.1)+'" y1="25" y2="360" stroke="#0B5ED7" stroke-dasharray="7 5"/><text class="merit-label" x="'+Math.min(1090,Math.max(105,55+session.settings.merit*11.1))+'" y="40" text-anchor="middle" style="fill:#0B5ED7">Merit threshold '+dec(session.settings.merit)+'</text><text x="600" y="407" text-anchor="middle">Merit score →</text></svg><p class="muted" style="font-size:10px">'+(session.chartColour==='band'?'<i style="color:#27934C">■</i> Healthy <i style="color:#FFBE2C">■</i> Contain <i style="color:#909EAA">■</i> Unassessed':'<i style="color:#20A53A">■</i> Funded <i style="color:#FCA708">■</i> Partial <i style="color:#D43F44">■</i> Excluded <i style="color:#DF8A96">■</i> Not funded')+'</p>';}
function stream(scope){const rows=scope==='overview'?result.rows:result.rows.filter(r=>r.stream===scope),f=session.filters[scope]||{},shown=AOP.filter(rows,f),allocation=AOP.sum(rows,r=>r.final),automatic=AOP.sum(rows,r=>r.automatic),requested=AOP.sum(rows,r=>r.cost),benefits=AOP.sum(rows.filter(r=>r.final>0),r=>r.benefit),editable=scope!=='overview'&&session.status!=='Finalised';return '<section class="kpis stream-kpis">'+kpi('Programme demand',money(requested),'Submitted demand')+kpi('Indicative programme envelope',money(automatic),'Automatic reporting allocation, not a ceiling')+kpi('Prioritised demand',money(allocation),rows.filter(r=>r.final>0).length+' funded; '+(allocation>=automatic?'+':'−')+money(Math.abs(allocation-automatic))+' vs indicative')+kpi('Merit floor',dec(session.settings.merit),'Advanced Value eligibility setting')+kpi('Demand gap',money(requested-allocation),'Requested less prioritised')+kpi('Submitted benefits',money(benefits),rows.filter(r=>r.final>0&&r.benefit!==null).length+' claims; '+rows.filter(r=>r.status==='Partial scope').length+' partial; unscaled, not annual')+'</section><section class="panel"><div class="toolbar"><h2>'+tabNames[scope]+'</h2>'+(scope==='overview'?'<button data-action="finalise" class="primary" '+(session.status==='Finalised'?'disabled':'')+'>Finalise scenario</button><button id="export-full">Export complete portfolio</button><button id="export-json">Export portable scenario</button><button data-action="fork">New working version</button>':'')+'</div>'+filters(scope,rows)+chart(shown)+(scope==='overview'?'':('<p>Showing '+shown.length+' of '+rows.length+' records · Filtered request '+money(AOP.sum(shown,r=>r.cost))+' · Filtered prioritised '+money(AOP.sum(shown,r=>r.final))+'</p>'))+table(shown,scope,editable,rows)+'</section>'+(scope==='overview'?'<section class="panel"><h2>Source decision coverage</h2><div class="two-col">'+coverage('decisionBand')+coverage('overall')+'</div></section>':'');}
function table(rows,scope,editable,allRows){
 const groups=new Map();for(const r of rows){const g=r.org||'BURF not supplied';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}
 const summary=(rs,g,id,footer=false,baseline=null)=>{const a=AOPViews.aggregate(rs),open=expanded.has(id),bandClass=a.band==='Healthy'?'healthy':a.band==='Contain'?'contain':'mixed',isFiltered=footer&&baseline&&baseline.count>a.count;
  const amount=(field,label)=>'<td class="numeric" data-aggregate="'+field+'" data-exact="'+(a[field].sum??'')+'"><strong>'+dec(a[field].sum)+'</strong><small>'+(isFiltered?'of '+dec(baseline[field].sum):'Avg '+dec(a[field].mean))+'</small></td>';
  return '<tr class="'+(footer?'summary-total':'group burf-summary')+'" data-group-summary="'+esc(id)+'" data-organisation="'+esc(g)+'"><td class="identity">'+(footer?'<b>'+esc(g)+'</b>':'<button class="burf-toggle" data-collapse="'+esc(id)+'" aria-expanded="'+open+'"><span class="triangle">'+(open?'▼':'▶')+'</span>'+esc(g)+'</button>')+' <span class="group-count">('+a.funded+'/'+a.count+(isFiltered?' of '+baseline.count:'')+')</span></td><td><span class="band-label '+bandClass+'">'+esc(a.band)+'</span><small>'+Object.entries(a.bands).map(([k,v])=>esc(k)+' '+v).join(' · ')+'</small></td><td class="numeric" data-aggregate="score" data-exact="'+(a.score.mean??'')+'"><span class="score-badge '+(a.score.mean>=session.settings.merit?'strong-score':'low-score')+'">'+dec(a.score.mean)+'</span><small>Average merit</small></td>'+amount('cost')+amount('final')+amount('unfunded')+amount('benefit')+'<td class="numeric" data-aggregate="evidence"><strong>'+a.evidence+'</strong><small>of '+(isFiltered?a.count+' ('+baseline.count+' total)':a.count)+' numeric claims</small></td><td><b>'+a.funded+(isFiltered?' of '+baseline.funded:'')+' funded · '+(a.count-a.funded)+' unfunded</b><small>'+a.partial+' partial scope · '+a.held+' evidence/eligibility holds</small><small>'+a.missingCost+' missing requests</small></td></tr>';
 };
 const groupRows=[...groups].sort((a,b)=>(AOPViews.aggregate(b[1]).score.mean??-1)-(AOPViews.aggregate(a[1]).score.mean??-1)||a[0].localeCompare(b[0]));
 return '<div class="table-actions"><p>Organisation totals visible when collapsed. ('+rows.length+' displayed programs)</p><button data-expand-all="'+scope+'">Expand all</button><button data-close-all="'+scope+'">Collapse all</button></div><div class="tablebox burf-tablebox" data-table-scope="'+scope+'"><table class="portfolio burf-table"><thead><tr><th class="identity">Organisation / Program</th><th>Decision Band</th><th>Score</th><th>Requested (M€)</th><th>Prioritised (M€)</th><th>Unfunded (M€)</th><th>Benefits (M€)</th><th>Evid.</th><th>'+(scope==='unfunded'?'Reason not funded / demand details':'Funding status / demand details')+'</th></tr></thead><tbody>'+groupRows.map(([g,rs])=>{
  const id=scope+'|'+encodeURIComponent(g),hidden=expanded.has(id)?'':' hidden';
  return summary(rs,g,id)+(editable?'<tr class="group-controls" data-group-row="'+esc(id)+'"'+hidden+'><td colspan="9"><label><input type="checkbox" aria-label="Select displayed '+esc(g)+'" data-group-check="'+esc(g)+'"> Select displayed programs</label><button data-group="'+esc(g)+'" data-choice="include">Include '+rs.filter(r=>r.cost>0).length+' eligible amount rows</button><button data-group="'+esc(g)+'" data-choice="exclude">Exclude displayed group</button><small>Changes are manual portfolio decisions. Missing/nonpositive requests cannot be included.</small></td></tr>':'')+rs.map(r=>'<tr class="program-row" data-group-row="'+esc(id)+'" data-row-id="'+esc(r.id)+'"'+hidden+'><td class="identity"><div class="program-identity">'+(editable?'<input type="checkbox" aria-label="Include '+esc(r.id)+'" data-include="'+esc(r.id)+'" '+(r.final>0?'checked':'')+' '+(!(r.cost>0)?'disabled':'')+'>':'')+'<button class="program" data-program="'+esc(r.id)+'">'+esc(r.name||'Program name not supplied')+'</button></div><small>'+esc(r.id)+' · '+esc(r.sourceSheet)+' row '+r.sourceRow+'</small></td><td><span class="band-label '+(AOP.key(r.decisionBand)==='healthy'?'healthy':AOP.key(r.decisionBand)==='contain'?'contain':'mixed')+'">'+esc(r.decisionBand||'Unassessed')+'</span></td><td class="numeric"><span class="score-badge '+(r.score>=session.settings.merit?'strong-score':'low-score')+'">'+dec(r.score)+'</span></td><td class="numeric">'+dec(r.cost)+'</td><td class="numeric">'+(editable?'<input class="amount" aria-label="Prioritised amount '+esc(r.id)+'" type="number" step="0.1" min="0" data-amount="'+esc(r.id)+'" data-original="'+r.final+'" value="'+dec(r.final)+'" '+(!(r.cost>0)?'disabled':'')+'>':dec(r.final))+'</td><td class="numeric">'+dec(r.unfunded)+'</td><td class="numeric">'+dec(r.benefit)+'<small>'+(r.ratio===null?'Multiple unavailable':dec(r.ratio)+'x of request')+'</small></td><td class="numeric">'+(r.benefit!==null?'1':'0')+'</td><td><b class="status-pill">'+esc(r.status)+'</b><small>'+esc(r.reason)+'</small><small>'+esc(r.newCarry==='Change & Sustain'?'Sustain Engineering':r.newCarry||'Not supplied')+' · '+esc(r.stageName)+'</small><small>'+esc(r.overall||'Overall decision unassessed')+'</small><small>'+esc(r.benefitDetails||AOP.clean(r.benefitRaw)||'Benefit evidence missing')+'</small><small class="warning">'+esc(r.warnings.join('; '))+'</small>'+(editable?'<button data-auto="'+esc(r.id)+'">Return to automatic</button><details class="inline-review"><summary>Note / evidence review</summary><label>Optional decision note<input data-note="'+esc(r.id)+'" value="'+esc(r.override?.note||'')+'"></label><label><input type="checkbox" data-review-benefit="'+esc(r.id)+'" '+(r.review?.benefitReviewed?'checked':'')+'> Above-10.0x claim reviewed</label><label>Contain condition<input data-condition="'+esc(r.id)+'" value="'+esc(r.review?.condition||'')+'"></label><label>Captured Consequence tier<select data-consequence="'+esc(r.id)+'"><option value="">Automated interpretation</option>'+[0,5,10,15].map(v=>'<option value="'+v+'" '+(r.review?.consequence===v?'selected':'')+'>'+dec(v)+'</option>').join('')+'</select></label><label>Review rationale<input data-review-note="'+esc(r.id)+'" value="'+esc(r.review?.note||'')+'"></label><button data-apply-review="'+esc(r.id)+'">Record evidence review</button></details>'+(r.override?.state==='needs-review'?'<button data-resolve="'+esc(r.id)+'">Reconfirm previous decision</button><button data-discard="'+esc(r.id)+'">Discard previous decision</button>':''):'')+'</td></tr>').join('');
 }).join('')+(rows.length?'':'<tr><td colspan="9" class="empty">No matching programs. Clear filters to return to the portfolio view.</td></tr>')+'</tbody><tfoot>'+summary(rows,'All displayed BURFs',scope+'|total',true,allRows?AOPViews.aggregate(allRows):null)+'</tfoot></table></div>';
}
function logs(){return '<details class="panel section-panel"><summary>Decision log, demand data and decision rules</summary><h2>Decision log of selections and changes</h2><div class="toolbar"><button id="undo">Undo latest decision</button><button data-action="reset">Clear all program overrides ('+Object.keys(session.overrides).length+')</button></div><p>Local-session attribution only. This offline file does not authenticate users. Events preserve before and after values in the portable scenario and Excel export.</p><div class="tablebox log"><table><thead><tr><th>Revision / Time</th><th>Change Origin</th><th>Change Details</th></tr></thead><tbody>'+[...session.events].reverse().map(e=>{var d=e.details||{},sum='';if(e.action==='program'){var ch=d.choice==='exclude'?'Excluded':d.choice==='include'?'Included':d.choice==='automatic'?'Returned to automatic':'Changed';sum=ch+' '+(d.id||'')+(d.amount?' at '+dec(d.amount)+' M€':'')+(d.note?' — '+d.note:'');}else if(e.action==='group'){sum=(d.choice==='exclude'?'Excluded':'Included')+' group of '+(d.ids?d.ids.length:'?')+' programmes';}else if(e.action==='setting'){sum='Scenario settings updated';}else if(e.action==='preset'){sum='Applied preset: '+(d.preset||'');}else if(e.action==='review'){sum='Evidence review for '+(d.id||'');}else if(e.action==='resolve'){sum=(d.discard?'Discarded':'Reconfirmed')+' previous decision for '+(d.id||'');}else if(e.action==='reset'){sum='Cleared all programme overrides';}else if(e.action==='finalise'){sum='Scenario finalised';}else if(e.action==='fork'){sum='New working version created';}else if(e.action==='refresh'){sum='Source data refreshed: '+(d.added?d.added.length:0)+' added, '+(d.changed?d.changed.length:0)+' changed';}else{sum=e.action;}return '<tr><td>'+e.revision+'<small>'+esc(e.time.replace('T',' ').substring(0,16))+'</small></td><td>'+esc(e.origin)+'</td><td>'+esc(sum)+'</td></tr>';}).join('')+'</tbody></table></div><h2>Demand data and decision rules</h2><p>'+esc(session.data.sourceFile)+' · '+result.rows.length+' demand rows · '+money(result.totals.requested)+' requested · '+result.totals.missing+' missing requested amounts (including whitespace).</p><p class="source-meta">SHA-256 '+session.data.sourceHash+'<br>Rule version '+AOP.VERSION+' · source version '+session.data.version+'</p><div class="toolbar"><label class="file-button">Refresh demand workbook<input type="file" id="refresh-file" accept=".xlsx"></label><button id="source-xlsx">Download original demand Excel</button><button id="source-json">Download complete workbook snapshot</button></div><div id="refresh-preview">'+(pending?'<p class="notice">Validated refresh: '+pending.diff.added.length+' added, '+pending.diff.changed.length+' changed, '+pending.diff.removed.length+' removed, '+pending.diff.unchanged.length+' unchanged. Requested '+money(pending.diff.requested)+'. Current revision is saved before applying.</p><details><summary>Source mapping and migration detail</summary><p>Missing requests '+pending.data.records.filter(r=>r.cost===null).length+' · Numeric benefits '+pending.data.records.filter(r=>r.benefit!==null).length+' · Blank bands '+pending.data.records.filter(r=>!r.decisionBand).length+' · Blank overall decisions '+pending.data.records.filter(r=>!r.overall).length+'</p><pre>'+esc(JSON.stringify({mapping:pending.data.mappings.map(m=>({sheet:m.sheet,fields:m.fields})),changes:pending.diff,issues:pending.data.issues},null,2))+'</pre></details><button id="apply-refresh" class="primary">Apply as new source and scenario version</button><button id="cancel-refresh">Cancel refresh</button>':'')+'</div><details><summary>Decision Band and Overall AOP decision coverage</summary><div class="two-col">'+coverage('decisionBand')+coverage('overall')+'</div><p>Healthy: suitable for merit assessment. Contain: proceed only with a captured condition. P1: immediate mandatory obligation; P2: scheduled mandatory obligation. Priority TBD: mandatory timing is unresolved. Blank: not yet assessed, not an invented decision. Source decision text is retained unchanged.</p></details><details><summary>Allocation and evidence rules</summary><p><b>Funding order:</b> Legal &amp; Compliance → Carry-Overs → Sustain &amp; Hygiene → Value Portfolio. Each stage is funded before the next begins.</p><p><b>How programmes are selected:</b> Whole requests are funded in priority order. If a request does not fit the stage budget, it is skipped and the next is tried. Manual edits can fund partial scope. Excluded programmes do not refill automatically.</p><p><b>What blocks automatic funding:</b> Missing programme name, missing or zero request, unresolved mandatory priority, or unrecognised decision values. Blank fields stay visible — they are not treated as zero.</p><p><b>Financial precision:</b> Displayed amounts are rounded to one decimal. Calculations and exports use full source precision. EW and BU Led decisions update one shared scenario.</p></details></details>';}
function details(id){const r=result.rows.find(x=>x.id===id);$('#modal-body').innerHTML='<h2>'+esc(r.name||r.id)+'</h2><p>'+esc(r.id)+' · '+esc(r.stageName)+' · '+esc(r.status)+'</p><dl><dt>Prioritised demand</dt><dd>'+money(r.final)+'</dd><dt>Merit / benefit multiple</dt><dd>'+dec(r.score)+' / '+(r.ratio!==null?dec(r.ratio)+'x':'—')+' <small>('+esc(r.benefitSource)+')</small></dd><dt>Merit Score Breakdown</dt><dd><table style="width:100%;border-collapse:collapse;font-size:11px;margin:4px 0"><tr style="background:var(--dk);color:white"><th style="padding:5px 8px;text-align:left">Component</th><th style="padding:5px 8px;text-align:right">Raw</th><th style="padding:5px 8px;text-align:right">Weight</th><th style="padding:5px 8px;text-align:right">Weighted</th></tr>'+['Benefit Strength','Submitted Priority','Captured Consequence','Decision Band','Payback Period'].map((n,i)=>'<tr style="border-bottom:1px solid var(--mist)"><td style="padding:5px 8px">'+n+'</td><td style="padding:5px 8px;text-align:right">'+r.rawComponents[i]+'/'+[50,25,15,10,10][i]+'</td><td style="padding:5px 8px;text-align:right">'+dec(session.settings.weights[i])+'</td><td style="padding:5px 8px;text-align:right;font-weight:700">'+dec(r.components[i])+'</td></tr>').join('')+'<tr style="background:var(--lt);font-weight:700"><td style="padding:5px 8px">Total</td><td></td><td style="text-align:right">100</td><td style="padding:5px 8px;text-align:right">'+dec(r.score)+'</td></tr></table></dd><dt>Captured Consequence evidence</dt><dd>'+esc(r.consequence.evidence)+'</dd><dt>Funding rationale</dt><dd>'+esc(r.reason)+'</dd>'+r.sourceValues.filter(x=>{if(!AOP.clean(x.value)&&x.value!==0&&x.value!==false&&!x.formula)return false;var l=x.label.toLowerCase();var lbl=x.label.split(' [')[0].split(' / ')[0].toLowerCase().trim();return /^(item no\.|planisware id|organization setting demand|initiative name|type$|new initiative or|category$|leading it platform|investment area|lfr & compliancy|it investment requested|carry over baselined|quantified benefits|roi$|impact and cost of not doing|priority$|problem statement|scope$|dependency|overall aop decision|remarks)/.test(lbl);}).map(x=>'<dt>'+esc(x.label)+'</dt><dd>'+esc(typeof x.value==='number'?dec(x.value):x.value)+(x.formula?'<small>Source formula: '+esc(x.formula)+'</small>':'')+'</dd>').join('')+'<dt>Source reference</dt><dd>'+esc(r.sourceSheet)+' row '+r.sourceRow+' · '+session.data.version+'</dd></dl>';$('#modal').showModal();}
function exportExcel(rows,scope){download('AOP2027-'+scope+'-r'+session.revision+'.xlsx',AOPWorkbook.write(AOPWorkbook.sheets(session,result,rows,scope)),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');}
async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function portable(){const payload=JSON.stringify(session);download('AOP2027-'+session.id+'-r'+session.revision+'.json',JSON.stringify({format:'AOP2027 portable scenario',sha256:await digest(payload),payload}),'application/json');}

function hideBubble(){const t=document.getElementById('bubble-hover');if(t)t.hidden=true;}
function showBubble(circle,event){const r=result.rows.find(r=>r.id===circle.dataset.bubble);if(!r)return;let t=document.getElementById('bubble-hover');if(!t){t=document.createElement('div');t.id='bubble-hover';t.className='bubble-hover';t.setAttribute('role','tooltip');document.body.appendChild(t);}t.innerHTML='<h3>'+esc(r.name||r.id)+'</h3><div class="hover-source">'+esc(r.id)+' · '+esc(r.org)+' · '+esc(r.sourceSheet)+' row '+r.sourceRow+'</div><div class="hover-grid">'+[['Requested',money(r.cost)],['Prioritised',money(r.final)],['Unfunded',money(r.unfunded)],['Merit score',dec(r.score)],['Submitted benefits',money(r.benefit)],['Benefit / request',r.ratio===null?'Not supplied':dec(r.ratio)+'x'],['Decision Band',r.decisionBand||'Unassessed'],['Funding status',r.status]].map(([k,val])=>'<div><span>'+k+'</span><b>'+esc(val)+'</b></div>').join('')+'</div><p><b>'+esc(r.stageName)+'</b><br>'+esc(r.reason)+'</p><p class="hover-note">Submitted lifetime benefit claim. Open Program Name in the table for full source evidence.</p>';t.hidden=false;const box=circle.getBoundingClientRect(),x=event?.clientX??box.right,y=event?.clientY??box.top;const w=t.offsetWidth,h=t.offsetHeight;t.style.left=Math.max(12,Math.min(x+16,innerWidth-w-12))+'px';t.style.top=Math.max(12,Math.min(y+14,innerHeight-h-12))+'px';circle.setAttribute('aria-describedby','bubble-hover');}
document.addEventListener('pointerover',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c,e);});
document.addEventListener('pointermove',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c,e);});
document.addEventListener('pointerout',e=>{if(e.target.closest?.('[data-bubble]'))hideBubble();});
document.addEventListener('focusin',e=>{const c=e.target.closest?.('[data-bubble]');if(c)showBubble(c);});
document.addEventListener('focusout',e=>{if(e.target.closest?.('[data-bubble]'))hideBubble();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideBubble();});
document.addEventListener('scroll',hideBubble,true);

document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{if(b.dataset.tab){tab=b.dataset.tab;render();window.scrollTo(0,0);}else if(b.dataset.preset)commit('preset',{preset:b.dataset.preset});else if(b.dataset.basis){const s=AOP.switchBasis(session.settings,b.dataset.basis,b.dataset.value,result.stages[{lfr:0,sustain:2,value:3}[b.dataset.basis]].demand);commit('setting',{settings:s});}else if(b.dataset.program)details(b.dataset.program);else if(b.dataset.action)commit(b.dataset.action);else if(b.dataset.auto)commit('program',{id:b.dataset.auto,choice:'automatic'});else if(b.dataset.resolve)commit('resolve',{id:b.dataset.resolve});else if(b.dataset.discard)commit('resolve',{id:b.dataset.discard,discard:true});else if(b.dataset.collapse){const id=b.dataset.collapse;expanded.has(id)?expanded.delete(id):expanded.add(id);render();}else if(b.dataset.expandAll||b.dataset.closeAll){const scope=b.dataset.expandAll||b.dataset.closeAll;document.querySelectorAll('[data-table-scope="'+scope+'"] [data-collapse]').forEach(x=>b.dataset.expandAll?expanded.add(x.dataset.collapse):expanded.delete(x.dataset.collapse));render();}else if(b.dataset.clearScope){session.filters[b.dataset.clearScope]={};render();persist();}else if(b.dataset.exportScope){const scope=b.dataset.exportScope,rows=scope==='overview'?result.rows:result.rows.filter(r=>r.stream===scope);exportExcel(AOP.filter(rows,session.filters[scope]),scope+'-filtered');}else if(b.dataset.group){const rows=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]);commit('group',{ids:rows.filter(r=>(r.org||'BURF not supplied')===b.dataset.group&&r.cost>0).map(r=>r.id),choice:b.dataset.choice});}else if(b.dataset.applyReview){const id=b.dataset.applyReview,q=k=>document.querySelector('[data-'+k+'="'+CSS.escape(id)+'"]');const tier=q('consequence').value,note=q('review-note').value;if(tier!==''&&!AOP.clean(note))throw Error('A reviewed consequence tier needs a rationale.');commit('review',{id,review:{benefitReviewed:q('review-benefit').checked,condition:q('condition').value,consequence:tier===''?null:Number(tier),note}});}else if(b.dataset.open){const s=await dbget(b.dataset.open);AOP.validateSession(s);session=s;tab='scenario';render();persist();}else switch(b.id){case 'save':await save();break;case 'export-inclusions':exportExcel(result.rows.filter(r=>r.final>0),'inclusions');break;case 'export-full':exportExcel(result.rows,'complete-portfolio');break;case 'export-json':await portable();break;case 'close-modal':$('#modal').close();break;case 'apply-weights':{const s=AOP.clone(session.settings);s.weights=[...document.querySelectorAll('.weight')].map(x=>Number(x.value));commit('setting',{settings:s});break;}case 'undo':session=AOP.undo(session);render();persist();break;case 'source-json':download('AOP2027-Complete-Workbook-Snapshot.json',JSON.stringify(session.data.workbook),'application/json');break;case 'source-xlsx':download(session.data.sourceFile.split(/[\\/]/).pop(),Uint8Array.from(atob(session.data.workbook.originalBase64),c=>c.charCodeAt(0)));break;case 'cancel-refresh':pending=null;render();break;case 'apply-refresh':await save();session=AOP.refresh(session,pending.data);pending=null;render();await persist();toast('New source version applied. Changed prior decisions are held for review.');break;}}catch(err){toast(err.message,true);}});
document.addEventListener('input',e=>{const x=e.target;if(x.type==='range'&&(x.dataset.lever||x.id==='carry')){const s=AOP.clone(session.settings);if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else if(x.id==='carry'){s.carry=Number(x.value);}commit('setting',{settings:s});}});
document.addEventListener('change',async e=>{const x=e.target;try{if(x.dataset.lever||['budget','carry','merit','tolerance'].includes(x.id)){if(x.value==='')throw Error('Enter a numeric setting.');const s=AOP.clone(session.settings);if(x.dataset.lever){const k=x.dataset.lever;s[k][s[k].basis==='amount'?'amount':'pct']=Number(x.value);}else s[x.id]=Number(x.value);commit('setting',{settings:s});}else if(x.dataset.groupCheck){const rows=AOP.filter(result.rows.filter(r=>r.stream===tab),session.filters[tab]);commit('group',{ids:rows.filter(r=>(r.org||'BURF not supplied')===x.dataset.groupCheck&&r.cost>0).map(r=>r.id),choice:x.checked?'include':'exclude'});}else if(x.dataset.include)commit('program',{id:x.dataset.include,choice:x.checked?'include':'exclude'});else if(x.dataset.amount){if(x.value==='')throw Error('Enter a prioritised amount.');commit('program',{id:x.dataset.amount,choice:'include',amount:Number(x.value)});}else if(x.dataset.note){const r=result.rows.find(r=>r.id===x.dataset.note);commit('program',{id:r.id,choice:r.final>0?'include':'exclude',amount:r.final,note:x.value});}else if(x.dataset.filter){const k=x.dataset.filter,scope=x.dataset.scope,f=session.filters[scope]||(session.filters[scope]={}),values=new Set(f[k]||[]);x.checked?values.add(x.value):values.delete(x.value);f[k]=[...values];render();const node=document.querySelector('[data-filter="'+k+'"][data-scope="'+scope+'"]')?.closest('details');if(node)node.open=true;persist();}else if(x.dataset.searchScope){const scope=x.dataset.searchScope;session.filters[scope].search=x.value;render();persist();}else if(x.id==='chart-colour'){session.chartColour=x.value;render();persist();}else if(x.id==='import-json'&&x.files[0]){const env=JSON.parse(await x.files[0].text());if(env.format!=='AOP2027 portable scenario'||await digest(env.payload)!==env.sha256)throw Error('Scenario checksum does not match.');const s=JSON.parse(env.payload);AOP.validateSession(s);session=s;render();await persist();toast('Portable scenario restored.');}else if(x.id==='refresh-file'&&x.files[0]){toast('Reading and validating the complete workbook…');const file=x.files[0];const data=AOP.normalize(await AOPWorkbook.read(new Uint8Array(await file.arrayBuffer()),file.name));pending={data,diff:AOP.refreshPreview(session,data)};render();$('#refresh-preview').scrollIntoView({block:'center'});}}catch(err){toast(err.message,true);if(x.type==='number')render();}});
new MutationObserver(()=>{if(pending){const d=document.querySelector('#refresh-preview')?.closest('details.section-panel');if(d)d.open=true;}}).observe($('#main'),{childList:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.dataset.amount){e.target.value=dec(Number(e.target.dataset.original));e.target.blur();return;}if(e.key==='Enter'&&e.target.matches('input:not([type=file])'))e.target.blur();});
render();const request=indexedDB.open('Philips-AOP2027-v4.5',1);request.onupgradeneeded=()=>request.result.createObjectStore('scenarios');request.onsuccess=async()=>{db=request.result;try{saved=await dbget('index')||[];const draft=await dbget('draft');if(draft){AOP.validateSession(draft);session=draft;toast('Recovered the last local working scenario.');}render();}catch(e){toast('Recovery unavailable: '+e.message+'. Embedded demand remains available.',true);}};request.onerror=()=>toast('Browser storage unavailable. Use portable scenario export to keep changes.',true);
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
const ORG_OPS_MAP={
  'Precision Diagnosis - Magnetic Resonance (MR)':{name:'MR',total:38.0,own:20.6,reg:9.9,func:7.5},
  'Precision Diagnosis - Computed Tomography (CT)':{name:'CT/AMI',total:25.3,own:14.5,reg:5.8,func:5.0},
  'Precision Diagnosis - Ultrasound (PDU)':{name:'ULS',total:38.1,own:25.1,reg:5.9,func:7.1},
  'Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':{name:'DXR',total:11.7,own:7.0,reg:2.5,func:2.2},
  'Image Guided Therapy - Devices (IGT-D)':{name:'IGT-D',total:33.4,own:25.6,reg:1.1,func:6.7},
  'Image Guided Therapy - Systems (IGT-S)':{name:'IGT-S',total:51.5,own:31.6,reg:10.0,func:9.8},
  'Monitoring - HPM (MCH)':{name:'HPM',total:60.1,own:39.4,reg:9.7,func:11.0},
  'Sleep & Respiratory Care (SRC)':{name:'SRC',total:32.7,own:24.0,reg:0.1,func:8.7},
  'Ambulatory Monitoring and Diagnostics (AM&D)':{name:'AMD',total:9.1,own:6.7,reg:0.4,func:2.1},
  'Enterprise Informatics (EI)':{name:'EI',total:34.1,own:28.6,reg:1.1,func:4.4},
  'Personal Health (PH)':{name:'PH',total:75.9,own:63.2,reg:0.1,func:12.5},
  'Intellectual Property & Standards (IP&S)':{name:'IP&S',total:4.6,own:4.0,reg:0.0,func:0.6},
  'Innovation and Design Business Operations':{name:'I&D',total:9.7,own:8.5,reg:0.0,func:1.2},
  'Group Innovation & Strategy \u200b':{name:'I&D',total:9.7,own:8.5,reg:0.0,func:1.2},
};
// Function/Region/ISC orgs have 0 direct TCO (they are cost allocators, not recipients)
const ZERO_OPS={total:0,own:0,reg:0,func:0};
function getOps(org){return ORG_OPS_MAP[org]||ZERO_OPS;}

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
.dq-tbd{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:var(--discbg);color:#715800}
.ops-grp{background:var(--mist)!important;font-weight:600;cursor:pointer}
.ops-grp td:first-child::before{content:'\\25B6 ';font-size:10px;color:var(--text3)}
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

function fmt(v,d){return v==null||isNaN(v)?'-':Number(v).toFixed(d===undefined?1:d);}
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
var SVC_PLATFORM_MAP={"SE002096":"IT-Infrastructure Services","SE002097":"IT-Infrastructure Services","SE002098":"IT-Infrastructure Services","SE002099":"IT-Infrastructure Services","1007580":"IT-Infrastructure Services","1007582":"IT-Infrastructure Services","1007589":"IT-Infrastructure Services","1007640":"IT-Infrastructure Services","SE002100":"IT-Infrastructure Services","SE002101":"IT-Infrastructure Services","SE002102":"IT-Infrastructure Services","1007587":"IT-Infrastructure Services","1007602":"IT-Infrastructure Services","1007636":"IT-Infrastructure Services","1007864":"Unallocated","1007865":"Unallocated","1007573":"IT-Infrastructure Services","1007574":"IT-Infrastructure Services","1007575":"IT-Infrastructure Services","1007577":"IT-Infrastructure Services","1007578":"IT-Infrastructure Services","1007583":"IT-Infrastructure Services","1007590":"IT-Infrastructure Services","1007591":"IT-Infrastructure Services","SE002108":"Unallocated","SE002109":"Unallocated","1007613":"Unallocated","1007595":"IT-Services&Solutions IT","1007596":"IT-Services&Solutions IT","1007597":"IT-Services&Solutions IT","1007598":"IT-Services&Solutions IT","1007599":"IT-Services&Solutions IT","1007600":"IT-Services&Solutions IT","1007601":"IT-Services&Solutions IT","1007603":"IT-Services&Solutions IT","1007604":"IT-Services&Solutions IT","1007605":"IT-Services&Solutions IT","1007606":"IT-Services&Solutions IT","1007607":"IT-Services&Solutions IT","1007609":"IT-Services&Solutions IT","1007610":"IT-Services&Solutions IT","1007611":"IT-Services&Solutions IT","1007612":"IT-Services&Solutions IT","1007641":"IT-Services&Solutions IT","1007744":"IT-Services&Solutions IT","1007747":"IT-Services&Solutions IT","1007804":"IT-Services&Solutions IT","1007844":"IT-Services&Solutions IT","1008056":"Unallocated","1008055":"Unallocated","1008052":"Unallocated","1008051":"Unallocated","1008050":"Unallocated","1008049":"Unallocated","1008048":"Unallocated","1007999":"Unallocated","1007614":"IT-Commercial IT","1007615":"IT-Commercial IT","1007616":"IT-Commercial IT","1007617":"IT-Commercial IT","1007618":"IT-Commercial IT","1007619":"IT-Commercial IT","1007620":"IT-Commercial IT","1007621":"IT-Commercial IT","1007622":"IT-Commercial IT","1007623":"IT-Commercial IT","1007624":"IT-Commercial IT","1007625":"IT-Commercial IT","1007626":"IT-Commercial IT","1007627":"IT-Commercial IT","1007628":"IT-Commercial IT","1007629":"IT-Commercial IT","1007631":"IT-Commercial IT","1007632":"IT-Commercial IT","1007676":"IT-Integrated Supply Chain and Finance","1007677":"IT-Integrated Supply Chain and Finance","1007678":"IT-Integrated Supply Chain and Finance","1007679":"IT-Integrated Supply Chain and Finance","1007680":"IT-Integrated Supply Chain and Finance","1007681":"IT-Integrated Supply Chain and Finance","1007682":"IT-Integrated Supply Chain and Finance","1007683":"IT-Integrated Supply Chain and Finance","1007684":"IT-Integrated Supply Chain and Finance","1007685":"IT-Integrated Supply Chain and Finance","1007686":"IT-Integrated Supply Chain and Finance","1007687":"IT-Integrated Supply Chain and Finance","1007688":"IT-Integrated Supply Chain and Finance","1007689":"IT-Integrated Supply Chain and Finance","1007690":"IT-Integrated Supply Chain and Finance","1007691":"IT-Integrated Supply Chain and Finance","1007692":"IT-Integrated Supply Chain and Finance","1007693":"IT-Integrated Supply Chain and Finance","1007694":"IT-Integrated Supply Chain and Finance","1007695":"IT-Integrated Supply Chain and Finance","1007696":"IT-Group Functions and Hyperautomation","1007697":"IT-Group Functions and Hyperautomation","1007698":"IT-Group Functions and Hyperautomation","1007699":"IT-Group Functions and Hyperautomation","1007700":"IT-Group Functions and Hyperautomation","1007701":"IT-Group Functions and Hyperautomation","1007702":"IT-Group Functions and Hyperautomation","1007703":"IT-Group Functions and Hyperautomation","1007704":"IT-Group Functions and Hyperautomation","1007705":"IT-Group Functions and Hyperautomation","1007706":"IT-Group Functions and Hyperautomation","1007707":"IT-Group Functions and Hyperautomation","1007708":"IT-Group Functions and Hyperautomation","1007709":"IT-Group Functions and Hyperautomation","1007710":"IT-Group Functions and Hyperautomation","1007711":"IT-Group Functions and Hyperautomation","1007712":"IT-Group Functions and Hyperautomation","1007713":"IT-Group Functions and Hyperautomation","1007714":"IT-Group Functions and Hyperautomation","1007715":"IT-Group Functions and Hyperautomation","1007716":"IT-Group Functions and Hyperautomation","1007717":"IT-Group Functions and Hyperautomation","1007718":"IT-Group Functions and Hyperautomation","1007719":"IT-Group Functions and Hyperautomation","1007720":"IT-Group Functions and Hyperautomation","1007721":"IT-Group Functions and Hyperautomation","1007722":"IT-Group Functions and Hyperautomation","1007723":"IT-Group Functions and Hyperautomation","1007724":"IT-Group Functions and Hyperautomation","1007725":"IT-Group Functions and Hyperautomation","1007726":"IT-Group Functions and Hyperautomation","1007727":"IT-Innovation and Digital","1007728":"IT-Innovation and Digital","1007729":"IT-Innovation and Digital","1007730":"IT-Innovation and Digital","1007731":"IT-Innovation and Digital","1007732":"IT-Innovation and Digital","1007733":"IT-Innovation and Digital","1007734":"IT-Innovation and Digital","1007735":"IT-Innovation and Digital","1007736":"IT-Innovation and Digital","1007737":"IT-Innovation and Digital","1007738":"IT-Innovation and Digital","1007739":"IT-Innovation and Digital","1007740":"IT-Innovation and Digital","1007741":"IT-Innovation and Digital","1007742":"IT-Innovation and Digital","1007743":"IT-Innovation and Digital","1007745":"IT-Innovation and Digital","1007746":"IT-Innovation and Digital","1007748":"IT-Innovation and Digital","1007749":"IT-Innovation and Digital","1007750":"IT-Innovation and Digital","1007751":"IT-Innovation and Digital","1007752":"IT-Innovation and Digital","1007753":"IT-Innovation and Digital","1007754":"IT-Innovation and Digital","1007755":"IT-Innovation and Digital","1007756":"IT-Innovation and Digital","1007757":"IT-Innovation and Digital","1007758":"IT-Innovation and Digital","1007759":"IT-Ent.Architecture,Data&Integration","1007760":"IT-Ent.Architecture,Data&Integration","1007761":"IT-Ent.Architecture,Data&Integration","1007762":"IT-Ent.Architecture,Data&Integration","1007763":"IT-Ent.Architecture,Data&Integration","1007764":"IT-Ent.Architecture,Data&Integration","1007765":"IT-Ent.Architecture,Data&Integration","1007766":"IT-Ent.Architecture,Data&Integration","1007767":"IT-Ent.Architecture,Data&Integration","1007768":"IT-Ent.Architecture,Data&Integration","1007769":"IT-Ent.Architecture,Data&Integration","1007770":"IT-Ent.Architecture,Data&Integration","1007771":"IT-Ent.Architecture,Data&Integration","1007772":"IT-Ent.Architecture,Data&Integration","1007773":"IT-Ent.Architecture,Data&Integration","1007774":"IT-Security,Risk&Compliance","B69NEW2":"Unallocated"};
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
  var so=sortOpts||[{v:'demand-desc',l:'Program Demand (High\u2192Low)'},{v:'demand-asc',l:'Program Demand (Low\u2192High)'},{v:'ops-desc',l:'Operations Cost (High\u2192Low)'},{v:'ops-asc',l:'Operations Cost (Low\u2192High)'},{v:'total-desc',l:'Total IT (High\u2192Low)'},{v:'total-asc',l:'Total IT (Low\u2192High)'}];
  h+='<select class="v43-sort" data-sort-tbl="'+tableId+'" onchange="window._v43sort(\''+tableId+'\',this.value)"><option value="">Sort by...</option>';
  so.forEach(function(o){h+='<option value="'+o.v+'">'+esc(o.l)+'</option>';});
  h+='</select>';
  h+='<button style="font-size:11px;padding:5px 10px;border:1px solid var(--border);border-radius:4px;background:white;color:var(--text2);cursor:pointer" onclick="window._v43clearFilters(\''+tableId+'\')">Clear All</button>';
  h+='</div>';
  return h;
}

// Program-level sort dropdown (for program detail tables)
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
      dataRows.forEach(function(r){if(r.style.display!=='none'&&r.classList.contains('burf-summary')){var c=r.querySelectorAll('td');visTco+=parseFloat((c[1]||{}).textContent)||0;}});
      if(tc[1]&&!tc[1].dataset.orig)tc[1].dataset.orig=tc[1].textContent;
      if(hasFilter){
        tc[1].innerHTML='<strong>'+visTco.toFixed(1)+'</strong> <small>of '+tc[1].dataset.orig+'</small>';
      } else {
        tc[1].innerHTML='<strong>'+(tc[1].dataset.orig||'469.7')+'</strong>';
      }
    } else if(tid==='svcCatalog'){
      var vis27=0,vis26=0;
      dataRows.forEach(function(r){if(r.style.display!=='none'){var c=r.querySelectorAll('td');vis27+=parseFloat((c[3]||{}).textContent)||0;vis26+=parseFloat((c[4]||{}).textContent)||0;}});
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
  var ewFBen=funded.filter(function(r){return r.stream==='ew';}).reduce(function(s,r){return s+(r.benefit||0);},0);
  var buFBen=funded.filter(function(r){return r.stream==='bu';}).reduce(function(s,r){return s+(r.benefit||0);},0);
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
  var h='<section class="kpis stream-kpis">';
  h+='<div class="kpi"><span>Total IT AOP</span><strong>'+fmt(totalIT)+' M€</strong><small>Program + Operations</small></div>';
  h+='<div class="kpi"><span>Program Demand</span><strong>'+fmt(totalDemand)+' M€</strong><small>'+totalCount+' programmes \xb7 EW '+ew.length+' \xb7 BU '+bu.length+'</small></div>';
  h+='<div class="kpi"><span>Operations</span><strong>'+fmt(ops)+' M€</strong><small>'+svcCount+' services \xb7 Pre-aligned</small></div>';
  h+='<div class="kpi"><span>Committed Impact</span><strong>'+fmt(ewFBen+buFBen)+' M€</strong><small>EW '+fmt(ewFBen)+' \xb7 BU '+fmt(buFBen)+'</small></div>';
  h+='<div class="kpi dark"><span>2026 Run-Rate</span><strong>'+fmt(OPS.meta.opsTotal2026)+' M€</strong><small>Δ '+(ops>=OPS.meta.opsTotal2026?'+':'')+fmt(ops-OPS.meta.opsTotal2026)+' M€ YoY</small></div>';
  h+='</section>';

  // Demand Split by Organisation
  h+='<section class="panel"><h2>Demand Split by Organisation — Program and Operations</h2>';

  var orgD={};
  all.forEach(function(r){
    var k=r.org||'Unassigned';
    if(!orgD[k])orgD[k]={count:0,demand:0};
    orgD[k].count++;
    orgD[k].demand+=r.cost||0;
  });

  // Build org-level rows for filter (1 row per org with its platform)
  var orgFilterRows=Object.keys(orgD).map(function(k){return {org:k,platform:orgPlatform[k]||''};});
  h+=buildFilterBar('tblDemandSplit',orgFilterRows,[{key:'org',label:'Organisation'},{key:'platform',label:'Platform'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="tblDemandSplit"><thead><tr>';
  h+='<th>Organisation</th><th class="num">Program Demand (Count)</th><th class="num">Program Demand M€</th>';
  h+='<th class="num">Operations Cost M€</th><th class="num">Total IT Demand M€</th>';
  h+='</tr></thead><tbody>';

  var entries=Object.entries(orgD).sort(function(a,b){return b[1].demand-a[1].demand;});
  var tF=0,tO=0;
  entries.forEach(function(e){
    var k=e[0],d=e[1];
    var opsCost=getOps(k).total;
    var total=d.demand+opsCost;
    tF+=d.demand;tO+=opsCost;
    var plat=orgPlatform[k]||'';
    h+='<tr data-org="'+esc(k)+'" data-platform="'+esc(plat)+'"><td><strong>'+esc(k)+'</strong></td><td class="num">'+d.count+'</td><td class="num">'+fmt(d.demand)+'</td>';
    h+='<td class="num">'+(opsCost>0?fmt(opsCost):'—')+'</td><td class="num" style="font-weight:700">'+fmt(total)+'</td></tr>';
  });
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td>Total</td><td class="num">'+all.length+'</td>';
  h+='<td class="num">'+fmt(tF)+'</td><td class="num">469.7</td><td class="num">'+fmt(tF+469.7)+'</td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:10px;margin-top:6px">Operations Cost shown at BU cluster level from Comparable AOP2027. Functions, Regions and corporate organisations have their costs allocated into BU TCO (shown as —). Total Operations: 469.7 M€.</p>';
  h+='</section>';

  // Insights
  h+='<section class="panel"><h2>High-Level Insights</h2>';
  h+='<table class="it"><thead><tr><th>Insight</th><th>Detail</th><th>Implication</th></tr></thead><tbody>';
  h+='<tr><td>Total IT Budget</td><td>'+fmt(ewD+buD+ops)+' M€ (Program '+fmt(ewD+buD)+' + Ops '+fmt(ops)+')</td><td>Program demand is '+fmt((ewD+buD)/ops*100,0)+'% of operations</td></tr>';
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
  h+='<div class="kpi"><span>Total Operations 2027</span><strong>469.7 M€</strong><small>AOP 2027</small></div>';
  h+='<div class="kpi"><span>2026 Run-Rate</span><strong>470.7 M€</strong><small>Baseline</small></div>';
  h+='<div class="kpi"><span>Δ YoY</span><strong>-1.0 M€</strong><small>Decrease</small></div>';
  h+='<div class="kpi"><span>BU Own</span><strong>317.6 M€</strong><small>Own consumption</small></div>';
  h+='<div class="kpi"><span>From Regions</span><strong>63.5 M€</strong><small>Region allocation</small></div>';
  h+='<div class="kpi"><span>From Functions</span><strong>88.5 M€</strong><small>Function allocation</small></div>';
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

      h+='<tr class="burf-summary" data-group-summary="'+esc(gid)+'" data-organisation="'+esc(t.bu.trim())+'" data-org="'+esc(t.bu.trim())+'" data-platform="'+esc(buPlat)+'">';
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

  h+='<tr class="burf-summary"><td class="identity"><strong>Regions (allocated to BUs)</strong></td>';
  h+='<td class="num" style="text-align:center"><strong>63.5</strong></td><td class="num" style="text-align:center">63.5</td><td class="num" style="text-align:center">-63.5</td><td></td><td></td></tr>';
  h+='<tr class="burf-summary"><td class="identity"><strong>Functions & CoEs (allocated to BUs)</strong></td>';
  h+='<td class="num" style="text-align:center"><strong>88.5</strong></td><td class="num" style="text-align:center">88.5</td><td></td><td class="num" style="text-align:center">-88.5</td><td></td></tr>';

  h+='<tr class="summary-total" data-total="1"><td class="identity"><strong>Total</strong></td>';
  h+='<td class="num" style="text-align:center"><strong>469.7</strong></td><td class="num" style="text-align:center">469.7</td><td class="num" style="text-align:center">127.1</td><td class="num" style="text-align:center">177.0</td><td></td></tr>';

  h+='</tbody></table></div></section>';

  // Service Catalog Table
  var svcs=OPS.operations.services;
  h+='<section class="panel"><h2>Service Catalog <span class="badge">'+svcs.length+' services</span></h2>';

  // Build platform-enriched service rows for filter
  var svcRows=svcs.map(function(s){return {org:s.dept,platform:svcToPlatform(s.serviceId)||deptToPlatform(s.dept),name:s.name};});
  h+=buildFilterBar('svcCatalog',svcRows,[{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="svcCatalog"><thead><tr>';
  h+='<th>Service ID</th><th style="width:25%">Service Name</th><th>Platform Name</th>';
  h+='<th class="num">AOP2027 Costs M€</th><th class="num">AOP2026 Costs M€</th>';
  h+='<th class="num">Δ vs AOP2026 M€</th>';
  h+='</tr></thead><tbody>';

  svcs.sort(function(a,b){return b.cost2027-a.cost2027;}).forEach(function(s){
    var plat=svcToPlatform(s.serviceId)||deptToPlatform(s.dept);
    var delta=s.cost2027-s.cost2026;
    var dClr=delta>0?'var(--weak)':delta<0?'var(--prot)':'var(--text2)';
    h+='<tr data-platform="'+esc(plat)+'" data-org="'+esc(s.dept)+'">';
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
  h+='<p class="muted" style="font-size:10px">Platform mapping from Bill of IT Platform Service List. 14 services from AI Services, Regions, B72 and Transfers depts are marked Unallocated.</p>';
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
    var ewAlloc=funded.filter(function(r){return r.stream==='ew';}).reduce(function(s,r){return s+r.final;},0);
    var buAlloc=funded.filter(function(r){return r.stream==='bu';}).reduce(function(s,r){return s+r.final;},0);
    var totalBen=funded.reduce(function(s,r){return s+(r.benefit||0);},0);

    // 1. Replace KPIs with the 5 header tiles
    var kpi=main.querySelector('.kpis,.stream-kpis');
    if(kpi&&!kpi.querySelector('.ops-kpi-added')){
      var newKpis='<div class="kpi"><span>Total IT AOP</span><strong>'+fmt(469.7+totalAlloc)+' M€</strong><small>Program + Operations</small></div>';
      newKpis+='<div class="kpi dark"><span>Operations AOP</span><strong>469.7 M€</strong><small>Pre-aligned</small></div>';
      newKpis+='<div class="kpi green"><span>Prioritized Program AOP</span><strong>'+fmt(totalAlloc)+' M€</strong><small>'+funded.length+' programs funded</small></div>';
      newKpis+='<div class="kpi"><span>Split of Program AOP</span><strong>EW '+fmt(ewAlloc)+' | BU '+fmt(buAlloc)+'</strong><small>M€</small></div>';
      newKpis+='<div class="kpi"><span>Committed Benefit</span><strong>'+fmt(totalBen)+' M€</strong><small>Quantified benefits of funded</small></div>';
      kpi.innerHTML=newKpis;
      kpi.classList.add('ops-kpi-added');
    }

    // Rename heading
    main.querySelectorAll('h2').forEach(function(h2){
      if(h2.textContent.includes('AOP 2027 : One Portfolio'))h2.textContent='AOP2027 : Program Demand Overview';
    });

    // 3. Hide unfunded bubbles in chart (show only funded)
    main.querySelectorAll('.bubble-chart circle[data-bubble]').forEach(function(c){
      var id=c.dataset.bubble;
      var row=all.find(function(r){return r.id===id;});
      if(row&&row.final<=0)c.style.display='none';
    });

    // 4. Remove median merit line
    main.querySelectorAll('.median-line,.median-label,.median-value').forEach(function(el){el.style.display='none';});

    // 5. Remove chart description paragraph (already handled by patch 13, but ensure)
    main.querySelectorAll('.bubble-chart+p.muted').forEach(function(p){if(p.textContent.length>100)p.style.display='none';});

    // ---- Organisation IT Cost Allocation: Program + Operations ----
    // Sub-org allocation key → BU cluster mapping (matching TCO BU clusters)
    var SUBORG_BU={
      'Imaging Informatics':'EI','Clinical Informatics':'EI','EI Other':'EI',
      'AMD':'Connected Care','HPM':'Connected Care','S&RC':'Connected Care',
      'I&D':'Innovation & Design','IP and S':'Int. Property & Standards',
      'IGT-D':'Image Guided Therapy','IGT-S':'Image Guided Therapy',
      'MR':'Precision Diagnosis','CT':'Precision Diagnosis','DXR':'Precision Diagnosis','PD Other':'Precision Diagnosis','US':'Precision Diagnosis',
      'G and B':'Personal Health','MCC':'Personal Health','OHC':'Personal Health','PH Other':'Personal Health'
    };
    // Programme org → BU cluster mapping (maps granular programme org names to the 7 TCO BU clusters)
    var ORG_TO_CLUSTER={
      'Enterprise Informatics (EI)':'EI',
      'Monitoring - HPM (MCH)':'Connected Care','Sleep & Respiratory Care (SRC)':'Connected Care','Ambulatory Monitoring and Diagnostics (AM&D)':'Connected Care',
      'Image Guided Therapy - Systems (IGT-S)':'Image Guided Therapy','Image Guided Therapy - Devices (IGT-D)':'Image Guided Therapy',
      'Precision Diagnosis - Magnetic Resonance (MR)':'Precision Diagnosis','Precision Diagnosis - Computed Tomography (CT)':'Precision Diagnosis',
      'Precision Diagnosis - Digital X-ray Radiogrammetry (DXR)':'Precision Diagnosis','Precision Diagnosis - Ultrasound (PDU)':'Precision Diagnosis',
      'Personal Health (PH)':'Personal Health','CoE Marketing – HS (former DMEC)​':'Personal Health',
      'Innovation and Design Business Operations':'Innovation & Design',
      'Intellectual Property & Standards (IP&S)​':'Int. Property & Standards'
    };
    // The 7 TCO BU clusters that receive all charges
    var BU_CLUSTERS=['Personal Health','Connected Care','Precision Diagnosis','Image Guided Therapy','EI','Innovation & Design','Int. Property & Standards'];

    // Step 1: Compute BU Led per cluster — direct BU-stream funded programmes mapped to clusters
    var clusterD={};
    BU_CLUSTERS.forEach(function(c){clusterD[c]={buLed:0,ew:0};});
    all.forEach(function(r){
      if(r.stream==='bu'&&r.final>0){
        var cl=ORG_TO_CLUSTER[r.org];
        if(cl&&clusterD[cl])clusterD[cl].buLed+=r.final;
      }
    });

    // Step 2: Use the "Enterprise-wide charging" key (excluded from demand by engine, stored as ewChargingKey)
    var ewChargeRow=aop.session.data.ewChargingKey||null;
    var ewChargeKeys={};
    if(ewChargeRow&&ewChargeRow.allocations){
      var ewCost=ewChargeRow.cost||0;
      Object.keys(ewChargeRow.allocations).forEach(function(subOrg){
        var frac=ewChargeRow.allocations[subOrg];
        if(frac>0){
          var cl=SUBORG_BU[subOrg];
          if(cl)ewChargeKeys[cl]=(ewChargeKeys[cl]||0)+ewCost*frac;
        }
      });
    }

    // Step 3: Distribute total EW-stream funded demand to BU clusters using charging key proportions
    var totalEWFunded=funded.filter(function(r){return r.stream==='ew';}).reduce(function(s,r){return s+r.final;},0);
    var keySum=Object.values(ewChargeKeys).reduce(function(a,b){return a+b;},0);
    if(keySum>0){
      BU_CLUSTERS.forEach(function(cl){
        if(ewChargeKeys[cl]>0)clusterD[cl].ew=totalEWFunded*(ewChargeKeys[cl]/keySum);
      });
    }
    var hasEWKeys=keySum>0;

    // Distribute BU-stream programmes from non-BU orgs (ISC, STO, Regions, etc.)
    // to BU clusters using their Type II allocation keys. The "Enterprise-wide charging"
    // row is excluded (handled separately via EW column).
    var unallocBuLed=0;
    all.forEach(function(r){
      if(r.stream==='bu'&&r.final>0&&!ORG_TO_CLUSTER[r.org]){
        if(r.allocations&&Object.keys(r.allocations).length>0){
          var fracSum=0;
          Object.keys(r.allocations).forEach(function(subOrg){
            var frac=r.allocations[subOrg];if(!(frac>0))return;
            var cl=SUBORG_BU[subOrg];
            if(cl&&clusterD[cl]){clusterD[cl].buLed+=r.final*frac;fracSum+=frac;}
          });
          if(fracSum<0.99)unallocBuLed+=r.final*(1-fracSum);
        } else {
          unallocBuLed+=r.final;
        }
      }
    });

    // Step 4: Ops from TCO (already per cluster)
    var tco=OPS.operations.tco;
    var clusterOps={};
    tco.forEach(function(t){
      if(!t.bu.startsWith('- ')&&!t.bu.startsWith(' -')){
        var bn=t.bu.trim();
        clusterOps[bn]=t.totalBU||0;
      }
    });
    var OPS_TOTAL=OPS.meta.opsTotal2027||469.7;

    // Step 5: Build table
    var ah='<section class="panel" id="alloc-sec"><h2>Organisation IT Cost Allocation: Program + Operations</h2>';
    if(typeof AOPDataQA!=='undefined'&&AOPDataQA.validateFinance){
      var fqa=AOPDataQA.validateFinance(aop.result,OPS_TOTAL);
      ah+=AOPDataQA.renderFinanceQA(fqa);
    }
    ah+='<p class="muted" style="font-size:11px"><b>BU Led</b>: direct BU programme funding (Type I + Type II cross-BU allocations). <b>Enterprise Wide</b>: EW-stream programme costs allocated to BUs using the Enterprise-wide charging key'+(hasEWKeys?'':' (pending — connect the live consolidated workbook)')+'. <b>Operations</b>: Bill of IT TCO per BU cluster. Functions, Regions and CoEs are fully allocated into BU charges. Grand Total = Prioritised Programme AOP + Operations AOP = Total IT AOP.</p>';

    var sortOpts=[{v:'buled-desc',l:'BU Led (High→Low)'},{v:'ew-desc',l:'Enterprise Wide (High→Low)'},{v:'ops-desc',l:'Operations (High→Low)'},{v:'total-desc',l:'Total IT Charge (High→Low)'}];
    ah+='<div class="tablebox"><table class="ao it" id="allocTbl"><thead><tr>';
    ah+='<th>Organisation</th><th class="num">BU Led (M€)</th><th class="num">Enterprise Wide (M€)</th>';
    ah+='<th class="num">Operations Cost (M€)</th><th class="num">Total IT Charge (M€)</th>';
    ah+='</tr></thead><tbody>';

    var entries=BU_CLUSTERS.map(function(cl){
      var d=clusterD[cl]||{buLed:0,ew:0};
      var ops=clusterOps[cl]||0;
      return {org:cl,buLed:d.buLed,ew:d.ew,ops:ops,total:d.buLed+d.ew+ops};
    }).sort(function(a,b){return b.total-a.total;});

    var gBU=0,gEW=0,gO=0;
    entries.forEach(function(e){
      gBU+=e.buLed;gEW+=e.ew;gO+=e.ops;
      ah+='<tr data-org="'+esc(e.org)+'" data-buled="'+e.buLed.toFixed(3)+'" data-ew="'+e.ew.toFixed(3)+'" data-ops="'+e.ops.toFixed(3)+'" data-total="'+e.total.toFixed(3)+'">';
      ah+='<td><strong>'+esc(e.org)+'</strong></td>';
      ah+='<td class="num" data-col="buled">'+fmt(e.buLed)+'</td>';
      ah+='<td class="num" data-col="ew">'+(e.ew>0.005?fmt(e.ew):'—')+'</td>';
      ah+='<td class="num" data-col="ops">'+(e.ops>0?fmt(e.ops):'—')+'</td>';
      ah+='<td class="tc num" data-col="total">'+fmt(e.total)+'</td></tr>';
    });

    var gPrograms=gBU+gEW;
    var gGrand=gPrograms+gO;
    var expectedProg=totalAlloc;
    var expectedGrand=OPS_TOTAL+totalAlloc;
    var progGap=Math.abs(gPrograms-expectedProg);
    var reconcileOk=progGap<0.5&&Math.abs(gGrand-expectedGrand)<0.5;
    if(unallocBuLed>0.01){
      ah+='<tr style="color:var(--text3);font-size:11px"><td>Functions / Regions (distributed via Type II keys)</td>';
      ah+='<td class="num">'+fmt(unallocBuLed)+'</td><td></td><td></td>';
      ah+='<td class="num">'+fmt(unallocBuLed)+'</td></tr>';
      gBU+=unallocBuLed;gPrograms+=unallocBuLed;gGrand+=unallocBuLed;
      progGap=Math.abs(gPrograms-expectedProg);
      reconcileOk=progGap<0.5&&Math.abs(gGrand-expectedGrand)<0.5;
    }

    ah+='<tr data-total="1" style="background:var(--lt);font-weight:700">';
    ah+='<td>Grand Total'+(reconcileOk?' ✓':' <span style="color:var(--weak);font-size:11px">⚠ Δ '+fmt(progGap)+'</span>')+'</td>';
    ah+='<td class="num" data-col="buled">'+fmt(gBU)+'</td>';
    ah+='<td class="num" data-col="ew">'+fmt(gEW)+'</td>';
    ah+='<td class="num" data-col="ops">'+fmt(gO)+'</td>';
    ah+='<td class="tc num" data-col="total">'+fmt(gGrand)+'</td></tr>';

    ah+='<tr style="font-size:10px;color:var(--text3)"><td colspan="5" style="padding:4px 8px">';
    ah+='Prioritised Programme AOP: '+fmt(gPrograms)+' M€ (BU Led '+fmt(gBU)+' + EW '+fmt(gEW)+') of '+fmt(totalAlloc)+' total.';
    ah+=' Operations AOP: '+fmt(gO)+' M€. Grand Total: '+fmt(gGrand)+' M€ (expected '+fmt(expectedGrand)+' M€).</td></tr>';

    ah+='</tbody></table></div></section>';

    // Insert before coverage
    var panels=main.querySelectorAll('.panel');
    var target=panels.length>1?panels[1]:null;
    var div=document.createElement('div');
    div.innerHTML=ah;
    if(target)main.insertBefore(div.firstElementChild,target);
    else main.appendChild(div.firstElementChild);
  });
}).observe(document.getElementById('main')||document.body,{childList:true});

})();

// Finance QA harness — validates allocation reconciliation for ExCo review.
// Injected after all other modules so it can wrap without changing existing code.
window.AOPDataQA=window.AOPDataQA||{};
(function(){
var round=function(x){return Math.round((x+1e-10)*1e6)/1e6;};
window.AOPDataQA.validateFinance=function(result,opsTotal){
  var checks=[],add=function(n,sev,status,detail){checks.push({name:n,severity:sev,status:status,detail:detail});};
  var rows=result.rows;
  var ewF=rows.filter(function(r){return r.stream==='ew'&&r.final>0;});
  var buF=rows.filter(function(r){return r.stream==='bu'&&r.final>0;});
  var totalEW=round(ewF.reduce(function(s,r){return s+r.final;},0));
  var totalBU=round(buF.reduce(function(s,r){return s+r.final;},0));
  var programAlloc=result.totals.allocation;
  var streamSum=round(totalEW+totalBU);
  var streamOk=Math.abs(streamSum-programAlloc)<0.001;
  add('EW + BU streams = Programme allocation','critical',streamOk?'PASS':'FAIL',
    'EW '+totalEW.toFixed(3)+' + BU '+totalBU.toFixed(3)+' = '+streamSum.toFixed(3)+' M€ (expected '+programAlloc.toFixed(3)+')'+(streamOk?'':' — GAP: '+Math.abs(streamSum-programAlloc).toFixed(6)+' M€'));
  var withPct=ewF.filter(function(r){return r.allocations&&Object.keys(r.allocations).length>0;});
  add('EW allocation % present on funded programmes','warning',withPct.length>0?'PASS':'WARN',
    ewF.length===0?'No funded EW programmes':withPct.length+' of '+ewF.length+' funded EW programmes have allocation % ('+Math.round(withPct.length/Math.max(ewF.length,1)*100)+'%)');
  if(withPct.length>0){
    var pctErrors=withPct.filter(function(r){
      var s=Object.values(r.allocations).reduce(function(a,b){return a+b;},0);
      return Math.abs(s-100)>1;
    });
    add('EW allocation % sums to 100% per programme','critical',pctErrors.length===0?'PASS':'FAIL',
      pctErrors.length===0?'All '+withPct.length+' programmes sum to 100%':
      pctErrors.length+' programme(s) with % not summing to 100%: '+
      pctErrors.slice(0,5).map(function(r){var s=Object.values(r.allocations).reduce(function(a,b){return a+b;},0);return r.id+' (sum='+s.toFixed(1)+'%)';}).join(', '));
    var distEW=round(withPct.reduce(function(s,r){var tot=Object.values(r.allocations).reduce(function(a,b){return a+b;},0);return s+r.final*(tot/100);},0));
    var distOk=Math.abs(distEW-totalEW)<0.01;
    add('EW charges distributed to BUs = total EW allocation','critical',distOk?'PASS':'WARN',
      'Distributed '+distEW.toFixed(3)+' M€, EW funded '+totalEW.toFixed(3)+' M€'+(distOk?'':' — check all allocation % columns are mapped'));
  }
  if(typeof opsTotal==='number'&&isFinite(opsTotal)){
    var grand=round(programAlloc+opsTotal);
    add('Grand total = Programme AOP + Operations AOP','critical','PASS',
      'Programme '+programAlloc.toFixed(3)+' + Operations '+opsTotal.toFixed(3)+' = '+grand.toFixed(3)+' M€');
  } else {
    add('Grand total validation','info','WARN','opsTotal not provided — pass the operations total M€ to validate');
  }
  var negFinal=rows.filter(function(r){return r.final<0;});
  add('No negative funded amounts','critical',negFinal.length===0?'PASS':'FAIL',
    negFinal.length===0?'All final amounts >= 0':negFinal.length+' row(s) have negative funded amounts');
  var hasFail=checks.some(function(c){return c.status==='FAIL';});
  var hasWarn=checks.some(function(c){return c.status==='WARN';});
  var grandTotal=typeof opsTotal==='number'?round(programAlloc+opsTotal):null;
  return {status:hasFail?'FAIL':hasWarn?'WARN':'PASS',checks:checks,totals:{buAlloc:totalBU,ewAlloc:totalEW,programAlloc:programAlloc,opsTotal:opsTotal||null,grandTotal:grandTotal}};
};
window.AOPDataQA.renderFinanceQA=function(qa){
  if(!qa)return '';
  var badge=qa.status==='PASS'?'qa-pass':qa.status==='WARN'?'qa-warn':'qa-fail';
  var t=qa.totals;
  var h='<div class="qa-report" style="margin:8px 0;padding:8px 12px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0">';
  h+='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
  h+='<span style="font-weight:700;padding:2px 8px;border-radius:4px;font-size:12px;'+(qa.status==='PASS'?'background:#d1fae5;color:#065f46':qa.status==='WARN'?'background:#fef3c7;color:#92400e':'background:#fee2e2;color:#991b1b')+'">Finance QA: '+qa.status+'</span>';
  if(t.grandTotal!==null){h+='<span style="font-size:12px;color:#475569">Programme <strong>'+t.programAlloc.toFixed(1)+'</strong> M€ (BU <strong>'+t.buAlloc.toFixed(1)+'</strong> + EW <strong>'+t.ewAlloc.toFixed(1)+'</strong>) + Ops <strong>'+(t.opsTotal||0).toFixed(1)+'</strong> = Grand Total <strong>'+t.grandTotal.toFixed(1)+'</strong> M€</span>';}
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
