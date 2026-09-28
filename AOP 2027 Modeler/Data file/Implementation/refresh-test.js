const {chromium}=require('C:/Users/320126040/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.resolve(__dirname,'../../output/modeler-v3'),checks=[];
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const modeler='file:///'+path.join(out,'AOP2027-IT-Portfolio-Scenario-Modelling.html').replace(/\\/g,'/');
  await page.goto(modeler); await page.waitForFunction(()=>window.__aop); await page.waitForTimeout(400);

  await test('Baseline workbook is loaded with traceable source hash',async()=>{
    const x=await page.evaluate(()=>({rows:__aop.result.rows.length,hash:__aop.session.data.sourceHash,requested:__aop.result.totals.requested}));
    assert.ok(x.rows>500); assert.match(x.hash,/^[a-f0-9]{64}$/); assert.ok(x.requested>0);
  });

  await page.locator('#tabs [data-tab=ew]').click();
  await page.locator('[data-expand-all=ew]').click();
  await page.locator('[data-amount="EW-01"]').fill('0.05');
  await page.locator('[data-amount="EW-01"]').press('Enter');
  await test('Changed Function decision is captured before refresh',async()=>{
    const o=await page.evaluate(()=>__aop.session.overrides);
    assert.equal(o['EW-01'].state,'active'); assert.equal(o['EW-01'].amount,0.05);
  });

  await page.locator('#tabs [data-tab=scenario]').click();
  const original=await page.evaluate(()=>({id:__aop.session.id,hash:__aop.session.data.sourceHash,requested:__aop.result.totals.requested}));
  await page.locator('#refresh-file').setInputFiles(path.join(out,'QA-Refresh-Updated-Demand.xlsx'));
  await page.waitForSelector('#apply-refresh');
  const preview=await page.evaluate(()=>({diff:__aop.pending?.diff||null,html:document.querySelector('#refresh-preview').innerText}));
  await test('Changed workbook validates before source replacement',async()=>{
    assert.ok(preview.html.includes('Validated refresh'));
    const p=preview.diff;
    assert.ok(p.added.includes('EW-188')); assert.ok(p.removed.includes('EW-187')); assert.ok(p.changed.includes('EW-01'));
    assert.ok(p.requested>0);
  });
  const unchanged=await page.evaluate(()=>{
    const id=__aop.pending.diff.unchanged.find(id=>{const r=__aop.session.data.records.find(x=>x.id===id);return r?.stream==='ew'&&r.cost>0;});
    const row=__aop.session.data.records.find(r=>r.id===id); return {id,amount:Math.max(0.001,row.cost/2)};
  });
  await page.locator('#cancel-refresh').click();
  await page.locator('#tabs [data-tab=ew]').click();
  await page.locator('[data-expand-all=ew]').click();
  await page.locator('[data-amount="'+unchanged.id+'"]').fill(String(unchanged.amount));
  await page.locator('[data-amount="'+unchanged.id+'"]').press('Enter');
  await test('Unchanged Function decision is captured for migration control',async()=>{
    const state=await page.evaluate(id=>__aop.session.overrides[id]?.state,unchanged.id); assert.equal(state,'active');
  });
  await page.locator('#tabs [data-tab=scenario]').click();
  await page.locator('#refresh-file').setInputFiles(path.join(out,'QA-Refresh-Updated-Demand.xlsx'));
  await page.waitForSelector('#apply-refresh');
  await page.screenshot({path:path.join(out,'QA-v3.2-refresh-preview.png'),fullPage:true});

  await page.locator('#apply-refresh').click();
  await page.waitForFunction(hash=>__aop.session.data.sourceHash!==hash,original.hash);
  let refreshedSummary;
  await test('Refresh creates a new scenario version and recalculates source totals',async()=>{
    const x=await page.evaluate(()=>({id:__aop.session.id,parent:__aop.session.parent,hash:__aop.session.data.sourceHash,requested:__aop.result.totals.requested,ids:__aop.result.rows.map(r=>r.id)}));
    assert.notEqual(x.id,original.id); assert.equal(x.parent,original.id); assert.notEqual(x.hash,original.hash); assert.notEqual(x.requested,original.requested);
    assert.ok(x.ids.includes('EW-188')); assert.ok(!x.ids.includes('EW-187'));
    refreshedSummary={id:x.id,parent:x.parent,hash:x.hash,requested:x.requested,rows:x.ids.length};
  });
  await test('Changed override is held for review and unchanged override remains active',async()=>{
    const o=await page.evaluate(()=>__aop.session.overrides);
    assert.equal(o['EW-01'].state,'needs-review'); assert.equal(o[unchanged.id].state,'active');
  });
  await test('Refresh uses no conference checkpoints and prior revision stays reopenable',async()=>{
    const x=await page.evaluate(()=>({hasConferences:'conferences' in __aop.session,saved:[...document.querySelectorAll('[data-open]')].map(b=>b.textContent)}));
    assert.equal(x.hasConferences,false); assert.ok(x.saved.length>=1);
  });
  await test('Held decision blocks finalisation until explicitly resolved',async()=>{
    await page.locator('#tabs [data-tab=overview]').click();
    await page.locator('[data-action=finalise]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(()=>__aop.session.status),'Draft');
    assert.ok((await page.locator('#toast').innerText()).includes('refreshed decisions'));
  });
  await test('After resolution, the scenario finalises without conference completion',async()=>{
    await page.locator('#tabs [data-tab=ew]').click();
    await page.locator('[data-expand-all=ew]').click();
    await page.locator('[data-resolve="EW-01"]').click();
    await page.locator('#tabs [data-tab=overview]').click();
    await page.locator('[data-action=finalise]').click();
    assert.equal(await page.evaluate(()=>__aop.session.status),'Finalised');
  });
  await test('Refreshed source can be exported with the added record',async()=>{
    const x=await page.evaluate(()=>({newRow:__aop.result.rows.find(r=>r.id==='EW-188'),events:__aop.session.events.map(e=>e.action)}));
    assert.equal(x.newRow.name,'Refresh validation initiative'); assert.equal(x.newRow.stage,4); assert.ok(x.events.includes('refresh'));
  });

  assert.deepEqual(errors,[]);
  const result={tests:checks.length,failed:0,checks,errors,fixture:'QA-Refresh-Updated-Demand.xlsx',original,preview:preview.diff,unchangedOverrideId:unchanged.id,refreshed:refreshedSummary};
  fs.writeFileSync(path.join(out,'Refresh-Test-Results-v3.2.json'),JSON.stringify(result,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
