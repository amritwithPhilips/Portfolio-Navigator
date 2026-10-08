import json,re,hashlib
from pathlib import Path
D=Path(__file__).parent;P=D.parent/'finance-plan-20260929';B=D.parent/'refresh-20260929'
(D/'audit').mkdir(exist_ok=True)
h=(B/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.6.1.html').read_text(encoding='utf8')
source=json.loads((P/'program-source.json').read_text(encoding='utf8'))
oldsource=json.loads(re.search(r'<script[^>]*id="source-data"[^>]*>([\s\S]*?)</script>',h)[1]);source['qa']=oldsource.get('qa',{})
def js(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
h=re.sub(r'(<script[^>]*id="source-data"[^>]*>)[\s\S]*?(</script>)',lambda m:m[1]+js(source)+m[2],h,count=1)
def rep(a,b,n=1):
 global h
 assert h.count(a)>=n,(a[:120],h.count(a));h=h.replace(a,b,n)
rep("const VERSION='5.6.1'","const VERSION='5.7.0'")
# Retain exact raw percentages and direct cell/formula references.
rep('allocs[ac.buName]=round(pct);','allocs[ac.buName]=pct;')
rep('if(Object.keys(allocs).length)r.allocations=allocs;',"if(Object.keys(allocs).length){r.allocations=allocs;r.allocationSources=Object.fromEntries(allocCols.map(ac=>[ac.buName,{cell:col(ac.colIdx)+(i+1),formula:(sh.formulas||{})[col(ac.colIdx)+(i+1)]||null}]));}")
rep('const programRecords=records.filter(', 'let programRecords=records.filter(')
needle="const ids=new Set();for(const r of programRecords)"
rep(needle,"const excludedRecords=[];programRecords=programRecords.filter(r=>{const reason=r.cost===null?'Missing requested amount':/^#/.test(r.overall)||/^#/.test(r.decisionBand)||r.overall==='0'?'Uninterpretable source decision':null;if(reason)excludedRecords.push({...r,exclusionReason:reason});return !reason;});\n "+needle)
rep('records:programRecords,ewChargingKey,workbook,issues,mappings','records:programRecords,excludedRecords,ewChargingKey,workbook,issues,mappings')
# Fixed confirmed baseline carry rule, same ordering and other presets.
h=re.sub(r's\.carry=(10|5|8|3);','s.carry=0;',h)
carry="if(st===1&&!carryConfirmed){if(s.carry>=10)holds.push('RoI threshold at 10x+ — only baseline carry-overs funded');else if(s.carry>0&&ratio!==null&&ratio<s.carry)holds.push('Below carry-over '+s.carry.toFixed(1)+'x RoI threshold');else if(s.carry>0&&ratio===null)holds.push('No RoI data — funded after all RoI-ranked carry-overs');}"
rep(carry,"if(st===1&&!carryConfirmed)holds.push('No confirmed approved baseline for Carry Over funding');")
rep("if(st===3&&r.benefit===null&&benefitSource==='none')holds.push('No benefit evidence (quantitative or qualitative)');",'')
rep("if(st===3&&r.benefit!==null&&r.benefit<0)holds.push('Negative benefit needs review');",'')
rep("if(ratio>10)warnings.push('Benefit claim ratio above 10.0x — data review recommended');",'')
rep('if(spent[r.stage]+r.cost>stageLimit+1e-9)','if(spent[r.stage]+(r.stage===1?r.carryFundCap:r.cost)>stageLimit+1e-9)')
rep('else if(automatic+r.cost>s.budget*(1+s.tolerance/100)+1e-9)','else if(automatic+(r.stage===1?r.carryFundCap:r.cost)>s.budget*(1+s.tolerance/100)+1e-9)')
# Scenario overlays keep original source data untouched and persist with reviews.
rep('function enrich(r,s,review={}){',"function enrich(r,s,review={}){\n const sourceCost=r.cost;r={...r,sourceCost,cost:Number.isFinite(review.requested)?review.requested:r.cost};")
rep('score=round(components.reduce((a,b)=>a+b,0));','calculatedScore=round(components.reduce((a,b)=>a+b,0)),score=Number.isFinite(review.merit)&&clean(review.note)?review.merit:calculatedScore;')
rep('stageName:STAGES[st],ratio,rawComponents:raw','stageName:STAGES[st],calculatedScore,ratio,rawComponents:raw')
rep("else if(action==='review'){", "else if(action==='review'){if(details.review.requested!==undefined&&(!Number.isFinite(details.review.requested)||details.review.requested<0))throw Error('Requested amount invalid');if(details.review.merit!==undefined&&(!Number.isFinite(details.review.merit)||details.review.merit<0||details.review.merit>100||!clean(details.review.note)))throw Error('Merit override requires 0–100 and a rationale');")
# Manual funding uses the scenario request if one was entered.
rep("const amount=details.choice==='exclude'?0:(details.amount??r.cost);if(!Number.isFinite(amount)||amount<0||!(r.cost>0)||amount>r.cost+1e-9)","const request=next.reviews[id]?.requested??r.cost,amount=details.choice==='exclude'?0:(details.amount??request);if(!Number.isFinite(amount)||amount<0||!(request>0)||amount>request+1e-9)")
# Reuse shared finance function in all views and exports.
start=h.index('(function(root,factory)');end=h.index('(function(root,factory)',start+1)
engine=h[start:end]
engine=engine.replace('function snapshotState(', (D/'finance-core.js').read_text(encoding='utf8')+'\n'+(D/'tradeoff-core.js').read_text(encoding='utf8')+'\nfunction snapshotState(',1)
engine=engine.replace('return {version:VERSION,rows:allRows,totals,stages,','const answer={version:VERSION,rows:allRows,totals,stages,',1)
needle="allocation:sum(rows.filter(r=>r.stream===x),r=>r.final)}]))};"
assert needle in engine
engine=engine.replace(needle,needle+"\n const op=globalThis.OPS_DATA||(typeof document!=='undefined'?JSON.parse(document.getElementById('ops-data').textContent):null);answer.finance=finance(data,answer,op);return answer;",1)
engine=engine.replace('return {VERSION,','return {finance,tradeoff,VERSION,',1)
assert 'return {finance,tradeoff,VERSION,' in engine
h=h[:start]+engine+h[end:]
# Trade-offs only affect the visible planning stream and leave the entered budget unchanged.
i=h.index("case 'apply-exco-tradeoff':{");j=h.index("case 'new-scenario':",i)
h=h[:i]+"case 'apply-exco-tradeoff':{session=AOP.tradeoff(session,tab,session.excoTradeoffScope===tab?session.excoTradeoffs||{}:{});render();persist();toast('ExCo trade-off applied. Total AOP remains '+money(session.settings.budget));break;}"+h[j:]
h=h.replace('const tradeoffs=session.excoTradeoffs||{};',"const tradeoffs=session.excoTradeoffScope===scope?session.excoTradeoffs||{}:{};")
h=h.replace("else if(x.dataset.excoBudget){if(!session.excoTradeoffs)","else if(x.dataset.excoBudget){if(session.excoTradeoffScope!==tab){session.excoTradeoffs={};session.excoTradeoffScope=tab;}if(!session.excoTradeoffs)")
h=h.replace("return r.exco===ec&&(r.stage===3||r.stage===4)&&r.override;","return r.stream===tab&&r.exco===ec&&(r.stage===3||r.stage===4)&&r.override?.note==='ExCo trade-off';")
h=h.replace("return (r.stage===3||r.stage===4)&&r.override;","return r.stream===tab&&(r.stage===3||r.stage===4)&&r.override?.note==='ExCo trade-off';")
# Fixed carry card replaces the obsolete threshold controls.
i=h.index("if(mode==='roi'){");j=h.index('const v=s[k],isAmt=',i)
h=h[:i]+"if(mode==='roi'){const stg=result.stages[si];return '<article><h3>'+esc(title)+'</h3><p>Confirmed business cases funded at approved baseline cap.</p><p>No ROI threshold. Funding = min(requested, approved baseline).</p>'+allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+'</article>';}"+h[j:]
h=h.replace("'Protect Commitments maximises carry-over funding at '+dec(s.carry)+'x RoI with full LFR coverage, prioritising prior-year programme continuity over new value initiatives.'","'Protect Commitments uses confirmed baseline caps with full LFR and Sustain coverage.'")
h=h.replace("'Tighten Carryover Evidence raises the RoI threshold to '+dec(s.carry)+'x, releasing capacity from low-evidence carry-overs into Sustain and Value stages.'","'Balance Sustain and Value keeps confirmed carry baseline caps and changes the Sustain and Value allocations.'")
h=h.replace('Tighten Carryover Evidence','Balance Sustain and Value').replace('Tighten Carryover','Balance Sustain and Value')
h=h.replace('RoI threshold controls additional carry-over inclusion.','There is no ROI threshold. Unconfirmed carry-over cases remain visible without automatic funding through this rule.')
for txt in ['10x+ (baseline)','5.0x','8.0x','3.0x','2.0x']:h=h.replace("'"+txt+"'","'Baseline cap'")
h=h.replace('P2: Carry RoI','P2: Baseline cap').replace('P2: Carry RoI','P2: Baseline cap')
h=h.replace("sc4.push(['Carry-over RoI threshold',s4.carry,'x','0x = all qualifying carry-overs funded','','',''],0);","sc4.push(['Carry-over rule','Confirmed approved baseline cap','','No ROI threshold','','',''],0);")
h=h.replace('Claims above 10x flagged for review','Benefit inputs accepted for prioritization').replace('Above-10.0x claim reviewed','Benefit evidence confirmed')
# Inline request and merit edits available in both independently editable stream tables.
rep("<summary>Note / evidence review</summary>","<summary>Scenario request / merit / evidence</summary><label>Scenario requested investment (M€)<input type=\"number\" step=\"0.001\" min=\"0\" data-scenario-request=\"'+esc(r.id)+'\" value=\"'+r.cost+'\"></label><label>Reviewed merit (0–100; optional)<input type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" data-scenario-merit=\"'+esc(r.id)+'\" value=\"'+(r.review?.merit??'')+'\"></label>")
# The existing evidence review handler is enhanced below by an earlier delegated click handler.
hook="document.addEventListener('click',function(ev){const b=ev.target.closest('[data-apply-review]');if(!b)return;const id=b.dataset.applyReview,box=b.closest('.inline-review');if(!box?.querySelector('[data-scenario-request]'))return;ev.stopImmediatePropagation();try{const r=result.rows.find(r=>r.id===id),review={...r.review,requested:Number(box.querySelector('[data-scenario-request]').value),note:box.querySelector('[data-review-note]').value,condition:box.querySelector('[data-condition]').value};const merit=box.querySelector('[data-scenario-merit]').value;if(merit==='')delete review.merit;else review.merit=Number(merit);const consequence=box.querySelector('[data-consequence]').value;if(consequence!=='')review.consequence=Number(consequence);session=AOP.transact(session,'review',{id,review},tab);render();}catch(e){alert(e.message);}},true);\n"
rep('function details(id){',hook+'function details(id){')
h=h.replace("session=AOP.transact(session,'review',{id,review},tab);render();}","session=AOP.transact(session,'review',{id,review},tab);render();persist();}")
h=h.replace("basis='RoI \\u2265 '+s4.carry+'x';", "basis='Confirmed baseline cap';")
h=h.replace("'0x'", "'Baseline cap'")
h=h.replace("'100% bucket','Baseline cap','100% bucket'", "'Verified share','Baseline cap','60% bucket'",1)
# Replace duplicated allocation implementation with the shared exact ledger.
i=h.index('    // ---- Organisation IT Cost Allocation:');j=h.index('    // UX-08: render Finance QA status',i)
h=h[:i]+(D/'finance-view.js').read_text(encoding='utf8')+'\n'+h[j:]
h=h.replace("var ewAlloc=funded.filter(function(r){return r.stream==='ew';})","var ewAlloc=funded.filter(function(r){return r.stream==='ew'&&!r.isPmi;})")
h=h.replace("var buAlloc=funded.filter(function(r){return r.stream==='bu';})","var buAlloc=funded.filter(function(r){return r.stream==='bu'&&!r.isPmi;})")
# The workbook's two existing allocation summaries now use identical ledger results.
h=h.replace("'Evidence flags'],1)","'Evidence flags','Source request M€','Calculated merit','Reviewed merit','Review rationale'],1)")
h=h.replace("(r.warnings||[])].join('; ')],0)","(r.warnings||[])].join('; '),r.sourceCost,r.calculatedScore,r.review?.merit??'',r.review?.note||''],0)")
qa_start=h.index('function validateFinance(result,opsTotal){');qa_end=h.index('function renderFinanceQA',qa_start)
h=h[:qa_start]+(D/'finance-qa.js').read_text(encoding='utf8')+'\n'+h[qa_end:]
qa_start=h.index('window.AOPDataQA.validateFinance=function(result,opsTotal){');qa_end=h.index('window.AOPDataQA.renderFinanceQA=',qa_start)
h=h[:qa_start]+"window.AOPDataQA.validateFinance="+(D/'finance-qa.js').read_text(encoding='utf8').strip()+";\n"+h[qa_end:]
h=h.replace("+'</strong>) + Ops <strong>'", "+'</strong> + PMI <strong>'+t.pmi.toFixed(1)+'</strong>) + Ops <strong>'")
h=h.replace("const row=sh.rows[i]||[];\n   const item=", "const row=sh.rows[i]||[];\n   if(!activeRows.has(sh.name+'!'+(i+1)))continue;\n   const item=")
h=h.replace('function validate(workbook,previous){',"function validate(workbook,previous){\n const activeRows=new Set(globalThis.AOP.normalize(workbook).records.map(r=>r.sourceSheet+'!'+r.sourceRow));")
h=h.replace('const header=(sh.rows[0]||[]).map(h=>clean(h));',"const mapping=globalThis.AOP.normalize(workbook).mappings.find(m=>m.sheet===sh.name);const header=mapping.sourceHeaders.map(h=>clean(h));")
h=h.replace("const bandIdx=header.findIndex(h=>{const k=key(h);return k==='decision band'||k.includes('waste');});","const bandIdx=mapping.fields.band;")
h=h.replace("maxRatio<=1000?'PASS':'WARN'","'PASS'").replace("'Benefit claims plausible'","'Benefit data validated for prioritization'").replace("'Extreme ratio: '+maxRatio.toFixed(1)+'x — review benefit data'","'Benefit evidence accepted; ratio '+maxRatio.toFixed(1)+'x'")
i=h.index('function sheets(session,result,rows,scope)');j=h.index('return {read,write,sheets',i);ex=h[i:j]
for name in ['sc1','sc3']:
 # Override the allocation blocks just before returning all sheets, eliminating stale owner-based totals.
 pass
needle="return [{name:'9. Source Reference'"
assert needle in ex
repair="""const fin=A.finance(session.data,result,OPS);for(const sheet of [sc1,sc3]){const rr=sheet.rows(),ss=sheet.styles();const first=rr.findIndex(r=>r[0]==='Organisation (BU Cluster)');if(first>=0){let last=first+1;while(last<rr.length&&rr[last][0]!=='TOTAL')last++;const insert=[['Organisation (BU Cluster)','BU Led Programs M€','EW charge M€','Operations M€','Total IT M€','PMI M€'],...fin.rows.map(r=>[r.recipient,r.single+r.cross+r.indirect+r.other,r.ew,r.own+r.region+r.functions,r.total,r.pmi]),['TOTAL',fin.totals.single+fin.totals.cross+fin.totals.indirect+fin.totals.other,fin.totals.ew,fin.totals.operations,fin.totals.total,fin.totals.pmi]];rr.splice(first,last-first+1,...insert);ss.splice(first,last-first+1,...insert.map((_,i)=>i===0?1:i===insert.length-1?3:0));}}const ledgerKeys=Object.keys(fin.ledger[0]||{});const financeSheet={name:'10. Finance Ledger',rows:[ledgerKeys,...fin.ledger.map(r=>ledgerKeys.map(k=>r[k]??''))],filter:true,freezeRow:1};"""
ex=ex.replace(needle,repair+"return [financeSheet,{name:'9. Source Reference'",1)
h=h[:i]+ex+h[j:]
h=re.sub(r'<aside id="refresh-notice"[\s\S]*?</aside>','',h,count=1)
h=h.replace('v5.6.1','v5.7.0').replace("Philips-AOP2027-v5.6.1-","Philips-AOP2027-v5.7.0-")
# User-facing terminology only. Source JSON and original cell values remain untouched.
scripts=list(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',h,re.I));main=scripts[3]
code=main[2];code=re.sub(r'\b[Pp]rogrammes\b','Programs',code);code=re.sub(r'\b[Pp]rogramme\b','Programs',code)
code=code.replace('Program Demand Overview','Programs Demand Overview').replace('Program + Operations','Programs + Operations').replace('Program AOP','Programs AOP').replace('Program Scenarios','Programs Scenarios').replace('Program demand','Programs demand')
code=re.sub(r'\bProgram\b','Programs',code).replace('Clear all program overrides','Clear all Programs overrides')
code=code.replace('indicative 100','default 100').replace('illustrative 100','default 100')
h=h[:main.start(2)]+code+h[main.end(2):]
(D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html').write_text(h,encoding='utf8')
start=code.index('(function(root,factory)');end=code.index('(function(root,factory)',start+1)
(D/'engine.js').write_text(code[start:end],encoding='utf8');(D/'app.js').write_text(code,encoding='utf8')
(D/'audit/program-source.json').write_text(json.dumps(source,ensure_ascii=False),encoding='utf8')
for id in ['ops-data','svc-data']:
 payload=json.loads(re.search(r'<script[^>]*id="'+id+r'"[^>]*>([\s\S]*?)</script>',h)[1]);(D/'audit'/f'{id}.json').write_text(json.dumps(payload),encoding='utf8')
print('Built v5.7.0',len(h),'characters; source',source['sourceHash'])
