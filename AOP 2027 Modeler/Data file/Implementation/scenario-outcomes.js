const fs=require('fs'),path=require('path'),assert=require('assert/strict'),AOP=require('./engine.js');
const out=path.resolve(__dirname,'../../output/modeler-v3');
const data=JSON.parse(fs.readFileSync(path.join(out,'Data file','AOP2027-Normalized-Demand.json'),'utf8'));

const cases=[
  ['Protect commitments',s=>s],
  ['Tighten carryover evidence',s=>AOP.preset('evidence')],
  ['Release sustain capacity',s=>AOP.preset('capacity')],
  ['Zero envelope',s=>({...s,budget:0})],
  ['50 M envelope',s=>({...s,budget:50})],
  ['200 M envelope',s=>({...s,budget:200})],
  ['AOP basis reservations',s=>({...s,lfr:{basis:'aop',pct:25},sustain:{basis:'aop',pct:10},hygiene:{basis:'aop',pct:5}})],
  ['Carryover threshold 1.0x',s=>({...s,carry:1})],
  ['Carryover threshold 5.0x plus',s=>({...s,carry:5})],
  ['Merit floor 0',s=>({...s,merit:0})],
  ['Merit floor 90',s=>({...s,merit:90})],
  ['No whole-program tolerance',s=>({...s,tolerance:0})],
  ['Maximum whole-program tolerance',s=>({...s,tolerance:5})],
];

const outcomes=cases.map(([name,change])=>{
  const settings=change(AOP.defaults());
  AOP.validateSettings(settings);
  const r=AOP.solve(data,settings);
  assert.ok(r.totals.allocation<=settings.budget*(1+settings.tolerance/100)+1e-8);
  assert.equal(r.rows.filter(x=>x.automatic>0&&x.automatic<x.cost).length,0);
  assert.ok(r.rows.filter(x=>x.stage===2).every(x=>!AOP.key(x.category).includes('decommission')));
  assert.ok(r.rows.filter(x=>(x.stage===3||x.stage===4)&&x.automatic>0).every(x=>x.benefit!==null&&x.benefit>0));
  return {
    scenario:name,
    settings,
    requested:r.totals.requested,
    allocated:r.totals.allocation,
    unfunded:r.totals.unfunded,
    available:r.totals.available,
    over:r.totals.over,
    fundedPrograms:r.totals.count,
    missingRequests:r.totals.missing,
    stages:r.stages.map(x=>({name:x.name,demand:x.demand,target:x.target,allocated:x.allocation})),
    assertions:['Portfolio tolerance respected','Whole programs only','Decommissioning excluded from Hygiene','Competitive stages require numeric positive benefits'],
    status:'PASS',
  };
});

const payload={
  executed:new Date().toISOString(),
  ruleVersion:AOP.VERSION,
  sourceFile:data.sourceFile,
  sourceHash:data.sourceHash,
  baselineRows:data.records.length,
  baselineRequested:AOP.sum(data.records,r=>r.cost),
  cases:outcomes.length,
  failed:0,
  outcomes,
};
fs.writeFileSync(path.join(out,'Scenario-Outcomes-v3.2.json'),JSON.stringify(payload,null,2));
console.log(JSON.stringify({cases:payload.cases,failed:payload.failed,sourceHash:payload.sourceHash},null,2));
