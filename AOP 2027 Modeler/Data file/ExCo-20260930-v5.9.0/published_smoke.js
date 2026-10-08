const {chromium}=require('C:/Users/320126040/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file:///C:/Users/320126040/Documents/Codex/AOP2027/AOP%202027%20Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForFunction(()=>window.ExCoView&&window.__aop);
const state=await p.evaluate(()=>({version:AOP.VERSION,base:__aop.result.totals.allocation,total:__aop.result.finance.totals.total,opportunities:!!document.querySelector('[data-exco-section="opportunities"]')}));
if(state.version!=='5.9.0'||Math.abs(state.base-99.963)>1e-7||Math.abs(state.total-575.4674630385123)>1e-7||!state.opportunities)throw Error(JSON.stringify(state));
await p.locator('#exco-leader').selectOption('Deeptha Khanna');
await p.locator('[data-exco-section="portfolio"]').first().click();
if(await p.locator('[data-exco-axis]').count()<2)throw Error('Missing chart toggles');
if(errors.length)throw Error(errors.join('\n'));
fs.writeFileSync(path.join(__dirname,'audit/published-smoke.json'),JSON.stringify({passed:true,...state,errors},null,2));console.log(JSON.stringify({passed:true,...state}));
}finally{await b.close()}})();
