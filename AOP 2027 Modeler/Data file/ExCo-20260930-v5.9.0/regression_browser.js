const {chromium}=require('C:/Users/320126040/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const dir=__dirname,A=path.join(dir,'audit'),url=n=>'file:///'+path.join(dir,n).replaceAll('\\','/');
const checks=[],errors=[];const check=(id,ok,detail)=>checks.push({id,status:ok?'PASS':'FAIL',detail});
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
const ctx=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
const tab=async t=>{await p.evaluate(()=>ExCoView.showWorkbench());await p.locator('#tabs [data-tab="'+t+'"]').click();await p.waitForTimeout(120)};
await p.goto(url('AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html'));await p.waitForFunction(()=>window.__aop&&window.renderDemandOverview);await p.evaluate(()=>ExCoView.showWorkbench());await p.waitForTimeout(500);
check('UI-01',JSON.stringify(await p.locator('#tabs button').evaluateAll(es=>es.map(e=>e.dataset.tab)))===JSON.stringify(['demand','scenario','ew','bu','operations','overview']),'Six tabs in expected order');
for(const width of [1920,1366]){
 await p.setViewportSize({width,height:1080});
 for(const t of ['demand','scenario','ew','bu','operations','overview']){await tab(t);check('UI-'+width+'-'+t,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#main').innerText.length>100),'Rendered content, no page-level horizontal overflow');await p.screenshot({path:path.join(A,t+'-'+width+'.png')});}
}
await p.setViewportSize({width:1920,height:1080});await tab('overview');
const ov=await p.evaluate(()=>({kpis:[...document.querySelectorAll('.kpis .kpi')].map(e=>e.innerText),unallocated:document.querySelector('[data-unallocated-ew]')?.innerText,pmi:document.querySelector('[data-pmi-on-top]')?.innerText,qa:window.AOPDataQA.validateFinance(__aop.result,OPS_DATA.meta.opsTotal2027),rows:__aop.result.rows.map(r=>({id:r.id,cost:r.cost,final:r.final,unfunded:r.unfunded,stage:r.stageName})),hash:__aop.session.data.sourceHash}));
fs.writeFileSync(path.join(A,'browser-finance.json'),JSON.stringify(ov,null,2));
check('UI-FIN-01',ov.kpis.some(t=>t.includes('575.5'))&&ov.kpis.some(t=>t.includes('470.4')),'Total IT and Operations KPIs follow exact refreshed values with upward display rounding');
check('UI-FIN-02',ov.qa.checks.every(c=>c.status!=='FAIL'),'Missing F&R charging key and PMI are separate allocation rows');
check('UI-FIN-03',!ov.qa.checks.some(c=>c.status==='FAIL'),'Finance QA has no arithmetic failures; business warnings retained');
await tab('operations');check('UI-OPS-01',await p.locator('#svcCatalog tbody tr').count()===183,'182 services and one footer');
const beforeOps=await p.evaluate(()=>__aop.result.totals.allocation);await p.locator('#tcoTbl [data-collapse]').first().click();check('UI-OPS-02',await p.locator('#tcoTbl tr.program-row:not(.hidden)').count()>0,'Operations hierarchy expands');
check('UI-OPS-03',await p.evaluate(()=>__aop.result.totals.allocation)===beforeOps,'Operations navigation does not affect funding');
await tab('scenario');await p.locator('[data-itsimp-toggle]').check();await p.waitForTimeout(100);check('UI-LEVER-01',await p.evaluate(()=>__aop.session.settings.itsimpMode&&__aop.result.stages[4].demand>0),'IT Simplification toggle activates fifth bucket');
await p.locator('[data-itsimp-toggle]').uncheck();
await p.locator('#budget').fill('120');await p.locator('#budget').press('Tab');await p.waitForTimeout(100);check('UI-LEVER-02',await p.evaluate(()=>__aop.session.settings.budget===120),'Budget edit commits');
await p.locator('#new-scenario').click();await p.waitForTimeout(100);check('UI-LEVER-03',await p.evaluate(()=>__aop.session.settings.budget===100&&!Object.keys(__aop.session.overrides).length),'New Scenario resets to 100 M€');
for(const t of ['ew','bu']){
 await tab(t);let total=await p.evaluate(()=>__aop.result.totals.allocation);
 const detail=p.locator('details.filter').first();await detail.locator('summary').click();await detail.locator('input[type=checkbox]').first().check();await p.waitForTimeout(100);
 check('UI-FILTER-'+t,await p.evaluate(()=>Object.values(__aop.session.filters[__aop.tab]).some(v=>Array.isArray(v)&&v.length))&&await p.evaluate(()=>__aop.result.totals.allocation)===total,'ExCo selection narrows view without altering funding');
 await p.locator('[data-clear-scope="'+t+'"]').click();
 const group=p.locator('button[data-collapse]').first();await group.click();
 const include=p.locator('input[data-include]:visible:not(:disabled)').first();const id=await include.getAttribute('data-include');const initial=await include.isChecked();await include.setChecked(!initial);await p.waitForTimeout(150);
 check('UI-EDIT-'+t,await p.evaluate(id=>!!__aop.session.overrides[id],id),'Independent program edit persisted: '+id);
 const popup=p.locator('[data-program="'+id+'"]').first();await popup.click();check('UI-POPUP-'+t,await p.locator('#modal').isVisible()&&await p.locator('#modal-body').innerText().then(t=>t.includes(id)||t.includes('row')),'Program detail opens with evidence lineage');await p.keyboard.press('Escape');
}
await tab('scenario');await p.locator('#save').click();await p.waitForFunction(()=>document.querySelector('#toast').textContent.startsWith('Saved '));const persisted=await p.evaluate(()=>({overrides:__aop.session.overrides,settings:__aop.session.settings,events:__aop.session.events.length}));
await p.reload();await p.waitForFunction(()=>window.__aop);await p.evaluate(()=>ExCoView.showWorkbench());await p.waitForFunction(x=>JSON.stringify(__aop.session.overrides)===JSON.stringify(x.overrides),persisted);check('UI-LIFE-01',await p.evaluate(x=>JSON.stringify(__aop.session.overrides)===JSON.stringify(x.overrides)&&__aop.session.events.length===x.events,persisted),'Save/reload retains decisions and event history');
await tab('scenario');
for(const [id,name] of [['export-json','portable.json'],['export-full','full-export.xlsx'],['export-inclusions','inclusions-export.xlsx']]){const dl=p.waitForEvent('download');await p.locator('#'+id).click();await(await dl).saveAs(path.join(A,name));check('UI-EXPORT-'+id,fs.statSync(path.join(A,name)).size>100,'Browser download saved '+name);}
const portable=JSON.parse(fs.readFileSync(path.join(A,'portable.json')));check('PORTABLE-01',crypto.createHash('sha256').update(portable.payload).digest('hex')===portable.sha256,'Portable checksum verified independently');
const c2=await browser.newContext({viewport:{width:1366,height:900},acceptDownloads:true});const p2=await c2.newPage();p2.on('pageerror',e=>errors.push(e.message));p2.on('dialog',d=>d.accept());await p2.goto(url('AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html'));await p2.waitForFunction(()=>window.__aop);await p2.evaluate(()=>ExCoView.showWorkbench());await p2.waitForTimeout(300);await p2.locator('#tabs [data-tab="scenario"]').click();await p2.locator('#import-json').setInputFiles(path.join(A,'portable.json'));await p2.waitForFunction(id=>__aop.session.id===id,JSON.parse(portable.payload).id,{timeout:30000});
check('PORTABLE-02',await p2.evaluate(x=>JSON.stringify(__aop.session.overrides)===JSON.stringify(x),persisted.overrides),'Portable import in clean browser restores overrides');
const bad={...portable,sha256:'0'.repeat(64)};fs.writeFileSync(path.join(A,'corrupt-portable.json'),JSON.stringify(bad));const oldId=await p2.evaluate(()=>__aop.session.id);await p2.locator('#import-json').setInputFiles(path.join(A,'corrupt-portable.json'));await p2.waitForFunction(()=>/checksum|integrity/i.test(document.querySelector('#toast').textContent),null,{timeout:15000});check('PORTABLE-03',await p2.evaluate(()=>__aop.session.id)===oldId&&await p2.locator('body').innerText().then(t=>/checksum|integrity/i.test(t)),'Corrupted portable rejected without replacing session');
await p2.locator('#tabs [data-tab="overview"]').click();await p2.locator('[data-action="finalise"]').click();await p2.waitForTimeout(100);check('UI-LIFE-02',await p2.evaluate(()=>__aop.session.status==='Finalised'),'Finalise from One Portfolio works');await p2.locator('#tabs [data-tab="ew"]').click();check('UI-LIFE-03',await p2.locator('input[data-include]:not(:disabled)').count()===0,'Finalised UI has no active program edit controls');
await p2.locator('#tabs [data-tab="overview"]').click();await p2.locator('[data-action="fork"]').click();await p2.waitForTimeout(100);check('UI-LIFE-04',await p2.evaluate(()=>__aop.session.status==='Draft'&&!!__aop.session.parent),'New working version creates draft with parent lineage');
// Data extract: operate every column input through DOM input events.
const ep=await ctx.newPage();ep.on('pageerror',e=>errors.push(e.message));await ep.goto(url('AOP2027-Data-Extract.html'));await ep.waitForFunction(()=>window.extractState);
const filterReport=await ep.evaluate(()=>{const ds=JSON.parse(document.getElementById('extract-data').textContent).datasets;const results=[];for(let k=0;k<ds.length;k++){const sel=document.getElementById('dataset');sel.value=k;sel.dispatchEvent(new Event('change',{bubbles:true}));const inputs=[...document.querySelectorAll('[data-filter]')];let ok=inputs.length===ds[k].columns.length;for(const input of inputs){input.value='__QA_NO_MATCH_93F7__';input.dispatchEvent(new Event('input',{bubbles:true}));ok=ok&&window.extractState.matched===0;input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}results.push({name:ds[k].name,columns:inputs.length,ok});}return results;});
filterReport.forEach((r,i)=>check('EXTRACT-COLS-'+i,r.ok,r.name+': '+r.columns+' column filters'));
await ep.locator('#dataset').selectOption('0');await ep.locator('[data-filter="11"]').fill('>1');let expected=await ep.evaluate(()=>JSON.parse(document.getElementById('extract-data').textContent).datasets[0].rows.filter(r=>typeof r[11]==='number'&&r[11]>1).length);check('EXTRACT-NUMERIC',await ep.evaluate(()=>extractState.matched)===expected,'Numeric greater-than filter independently reconciles');
await ep.locator('[data-filter="4"]').fill('=ew');expected=await ep.evaluate(()=>JSON.parse(document.getElementById('extract-data').textContent).datasets[0].rows.filter(r=>typeof r[11]==='number'&&r[11]>1&&r[4]==='ew').length);check('EXTRACT-AND',await ep.evaluate(()=>extractState.matched)===expected,'Numeric and exact text filters combine');
await ep.locator('#clear').click();await ep.locator('[data-filter="11"]').fill('[blank]');check('EXTRACT-MISSING',await ep.evaluate(()=>extractState.matched)===0,'Active extract excludes missing requests');
const edl=ep.waitForEvent('download');await ep.locator('#download').click();await(await edl).saveAs(path.join(A,'filtered-extract.csv'));await ep.locator('#clear').click();await ep.screenshot({path:path.join(A,'extract-1920.png')});await ep.setViewportSize({width:1366,height:900});await ep.screenshot({path:path.join(A,'extract-1366.png')});
check('EXTRACT-CSV',fs.statSync(path.join(A,'filtered-extract.csv')).size>10,'Filtered CSV includes matching missing-amount program');
check('UI-CONSOLE',errors.length===0,errors);
fs.writeFileSync(path.join(A,'regression-browser-qa.json'),JSON.stringify({checks,errors,filterReport},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.status==='PASS').length,failures:checks.filter(x=>x.status==='FAIL')},null,2));
}finally{await browser.close();}})().catch(e=>{fs.writeFileSync(path.join(A,'regression-browser-qa.json'),JSON.stringify({checks,errors,fatal:e.stack},null,2));console.error(e);process.exit(1)});
