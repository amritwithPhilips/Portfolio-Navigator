/**
 * Lever Simulation — v5.7.0
 * 25 scenarios across all 5 levers × 4 ExCo areas (ISC, Services, IGTS, PH)
 * Covers: all lever bases (bucket/AOP/amount), opt-in, opt-out,
 *         partial funding, on-top/off, and combination scenarios.
 * Exports: audit/lever-scenarios.json for Python cross-validation
 * Run: node lever-simulation.js
 */
'use strict';
const fs = require('fs'), path = require('path'), A = require('./engine.js');
const D  = __dirname;
global.OPS_DATA = JSON.parse(fs.readFileSync(path.join(D, 'audit/ops-data.json')));
const data    = A.normalize(JSON.parse(fs.readFileSync(path.join(D, 'audit/program-source.json'))));
const init    = A.createSession(data);
const base    = A.solve(data, init.settings);

// ── Helpers ───────────────────────────────────────────────────────────────────
const rnd   = v => Math.floor(v * 1e6 + 0.50000001) / 1e6;
const near  = (a, b, tol=1e-6) => Math.abs(a - b) <= tol;
const clone = x => JSON.parse(JSON.stringify(x));
const rec   = id => data.records.find(r => r.id === id);
const checks = [], scenarios = [];
const chk = (name, ok, detail='') => checks.push({ name, passed: !!ok, detail: String(detail) });

function ov(s, id, choice, amount) {
  const r = rec(id);
  s.overrides[id] = {
    choice, state: 'active', fingerprint: r.fingerprint,
    amount: choice === 'exclude' ? 0 : (amount !== undefined ? rnd(amount) : r.cost),
    note: 'Lever simulation override'
  };
}

// ── ExCo program lists (from live base solve) ─────────────────────────────────
const P = {
  // ISC — Wim Appelo
  isc: {
    s0f:  ['Bu-06'],
    s1u:  ['Bu-11','Bu-08','Bu-07','Bu-12','Bu-09','Bu-10','Bu-54'],
    s3f:  ['EW-03'],
    s3u:  ['EW-01','EW-02'],
    decomm: []
  },
  // IGTS — Bert van Meurs
  igt: {
    s0f:  ['Bu-433'],
    s1u:  ['Bu-253','Bu-04','Bu-252','Bu-414','Bu-409','Bu-410','Bu-411',
            'Bu-60','Bu-82','Bu-431','Bu-81','Bu-434','Bu-118',
            'Bu-435','Bu-264','Bu-426','Bu-257','Bu-191','Bu-192',
            'Bu-427','Bu-428','Bu-438','Bu-432','Bu-440'],
    s2f:  ['Bu-413','Bu-262','Bu-259'],
    s2u:  ['Bu-261','Bu-281','Bu-436'],
    s3f:  ['Bu-63','Bu-57'],
    s3u:  ['Bu-437','Bu-447','Bu-448','Bu-415','Bu-260','Bu-340',
            'Bu-421','Bu-439','Bu-446','Bu-254'],
    decomm: ['Bu-435','Bu-441','Bu-443','Bu-449','Bu-452','Bu-442',
             'Bu-263','Bu-445','Bu-450','Bu-451']
  },
  // PH — Deeptha Khanna
  ph: {
    s0f:  ['Bu-05','Bu-17','Bu-18','Bu-19','Bu-20','Bu-21'],
    s1u:  ['Bu-316','Bu-296','Bu-297','Bu-298','Bu-317','Bu-321',
            'Bu-322','Bu-323','Bu-308'],
    s2f:  ['Bu-30'],
    s2u:  ['Bu-323'],
    s3f:  ['Bu-299','Bu-304','Bu-292','Bu-286','Bu-293','Bu-320'],
    s3u:  ['Bu-313','Bu-285','Bu-315','Bu-301','Bu-290','Bu-303','Bu-311','Bu-295','Bu-289','Bu-319','Bu-312','Bu-318'],
    decomm: ['Bu-30']
  },
  // Services — Laura Matz
  svc: {
    s0f:  ['EW-11','EW-65','EW-71','EW-04'],
    s0u:  ['EW-74','EW-75','EW-76','EW-77','EW-78'],
    s2f:  ['EW-05','EW-06','EW-07','EW-08','EW-09','EW-10','EW-12'],
    s3f:  ['EW-99','EW-43'],
    s3u:  ['EW-122','EW-95','EW-114','EW-131','EW-118','EW-116','EW-97','EW-98',
            'EW-101','EW-113','EW-146','EW-133','EW-182','EW-147','EW-58',
            'EW-155','EW-59','EW-120'],
    decomm: ['EW-72','EW-59','EW-120','EW-57','EW-144','EW-131','EW-145',
             'EW-101','EW-113','EW-146','EW-122','EW-133','EW-182',
             'EW-95','EW-147','EW-58','EW-114','EW-118','EW-155']
  }
};

function sc(id, name, modify) {
  const s = clone(init);
  s.id = 'sim-' + id;
  s.name = name;
  modify && modify(s);
  return s;
}

// ── Per-scenario validation (23 checks matching financial-accuracy-audit) ─────
function validate(cfg, result, label) {
  const f = result.finance;
  chk(label+' funding identity',    near(result.totals.requested, result.totals.allocation+result.totals.unfunded));
  chk(label+' stream identity',     near(result.streams.ew.allocation+result.streams.bu.allocation, result.totals.allocation));
  chk(label+' stage identity',      near(result.stages.reduce((a,s)=>a+s.allocation,0), result.totals.allocation));
  chk(label+' budget cap',          result.totals.automatic <= cfg.settings.budget*(1+cfg.settings.tolerance/100)+1e-6);
  chk(label+' carry cap',           result.rows.filter(r=>r.stage===1&&!r.isPmi&&r.automatic>0)
                                      .every(r=>r.carryConfirmed&&near(r.automatic,Math.min(r.cost,r.baselined))));
  chk(label+' ledger reconciled',   f.reconciled);
  chk(label+' ledger identity',     near(f.totals.programs, result.totals.allocation+result.pmi.funded));
  chk(label+' EW unalloc share',    near(f.rows.find(x=>x.recipient==='Unallocated').ew,
                                        result.streams.ew.allocation*0.22630331753554522));
  chk(label+' ops invariance',      near(f.totals.operations, 470.3144630385122));
  chk(label+' row276 excluded',     !result.rows.some(r=>r.name==='Enterprise-wide charging'));
  chk(label+' 433 programs',        result.rows.length===433);
  chk(label+' per-record alloc',    result.rows.filter(r=>r.final>0).every(r=>
                                      near(f.ledger.filter(x=>x.pillar==='Programs'&&x.id===r.id)
                                            .reduce((a,x)=>a+x.amount,0), r.final)));
  chk(label+' deterministic',       JSON.stringify(result)===JSON.stringify(A.solve(data,cfg.settings,cfg.overrides,cfg.reviews)));
  chk(label+' source immutable',    data.records.every(r=>r.cost===base.rows.find(x=>x.id===r.id).sourceCost));

  // ExCo chargeout checks
  for (const [leader, short] of [['Wim Appelo','ISC'],['Bert van Meurs','IGTS'],['Deeptha Khanna','PH'],['Laura Matz','Svc']]) {
    const funded = result.rows.filter(r=>r.exco===leader&&r.final>0);
    const fundedSum = funded.reduce((s,r)=>s+r.final,0);
    const ledgerSum = f.ledger.filter(x=>x.pillar==='Programs'&&funded.some(r=>r.id===x.id)).reduce((s,x)=>s+x.amount,0);
    chk(label+' '+short+' chargeout==funded', near(fundedSum, ledgerSum), `${rnd(fundedSum)} vs ${rnd(ledgerSum)}`);
  }

  // BU cluster checks
  for (const cluster of ['Image Guided Therapy','Personal Health']) {
    const fr = f.rows.find(x=>x.recipient===cluster);
    const progTotal = fr ? fr.single+fr.cross+fr.indirect+fr.other+fr.ew : 0;
    const ledgerTotal = f.ledger.filter(x=>x.pillar==='Programs'&&x.recipient===cluster).reduce((s,x)=>s+x.amount,0);
    chk(label+' '+cluster.split(' ')[0]+' cluster==ledger', near(progTotal, ledgerTotal, 1e-4));
  }

  // Stage allocation sums
  const stgMap = {};
  result.stages.forEach(s=>{ stgMap[s.name]=s; });
  chk(label+' stage4 only when itsimpMode',
      !cfg.settings.itsimpMode ? result.rows.filter(r=>r.stage===4).every(r=>r.final===0) : true);

  // ExCo breakdown for export
  const exco = {};
  ['Wim Appelo','Bert van Meurs','Deeptha Khanna','Laura Matz'].forEach(ldr=>{
    exco[ldr] = {
      funded:  rnd(result.rows.filter(r=>r.exco===ldr&&r.final>0).reduce((s,r)=>s+r.final,0)),
      demand:  rnd(result.rows.filter(r=>r.exco===ldr&&!r.isPmi).reduce((s,r)=>s+r.cost,0)),
      count:   result.rows.filter(r=>r.exco===ldr&&r.final>0).length
    };
  });
  const clusterRow = name => {
    const fr=f.rows.find(x=>x.recipient===name);
    return fr ? { programs: rnd(fr.single+fr.cross+fr.indirect+fr.other+fr.ew), own:rnd(fr.own), region:rnd(fr.region), functions:rnd(fr.functions), total:rnd(fr.total) } : {};
  };
  scenarios.push({
    id: cfg.id, name: cfg.name,
    group: cfg.group,
    levers: {
      budget: cfg.settings.budget,
      lfr:    cfg.settings.lfr,
      carry:  cfg.settings.carry,
      sustain:cfg.settings.sustain,
      value:  cfg.settings.value,
      itsimp: cfg.settings.itsimp,
      itsimpMode: cfg.settings.itsimpMode,
      merit:  cfg.settings.merit
    },
    overrides: Object.entries(cfg.overrides).map(([id,o])=>({id,choice:o.choice,amount:o.amount})),
    totals: {
      requested: rnd(result.totals.requested),
      funded:    rnd(result.totals.allocation),
      pmi:       rnd(result.pmi.funded),
      unfunded:  rnd(result.totals.unfunded),
      ew:        rnd(result.streams.ew.allocation),
      bu:        rnd(result.streams.bu.allocation),
      grandTotal: rnd(f.totals.total)
    },
    stages: result.stages.map(s=>({name:s.name, demand:rnd(s.demand), funded:rnd(s.allocation)})),
    exco,
    clusters: {
      'Precision Diagnosis':    clusterRow('Precision Diagnosis'),
      'Image Guided Therapy':   clusterRow('Image Guided Therapy'),
      'Connected Care':         clusterRow('Connected Care'),
      'EI':                     clusterRow('EI'),
      'Personal Health':        clusterRow('Personal Health'),
      'Unallocated':            clusterRow('Unallocated'),
    },
    financeReconciled: f.reconciled,
    issueCount: f.issues.length
  });
}

function run(cfg) { return A.solve(data, cfg.settings, cfg.overrides, cfg.reviews); }

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP 1 — LEVER BASIS VARIATIONS (5 scenarios: one dominant lever per)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const g = 'G1-Lever Basis';
  // L01: LFR — AOP 12% basis (relaxed from default bucket 82%)
  const l01 = sc('L01','LFR AOP 12% basis', s=>{
    s.settings.lfr = {basis:'aop', pct:12};
    s.group = g;
  }); l01.group=g;
  validate(l01, run(l01), 'L01');

  // L02: LFR — fixed amount 8M
  const l02 = sc('L02','LFR fixed 8M', s=>{
    s.settings.lfr = {basis:'amount', amount:8, pct:0};
  }); l02.group=g;
  validate(l02, run(l02), 'L02');

  // L03: Sustain — AOP 15% basis (vs default bucket 60%)
  const l03 = sc('L03','Sustain AOP 15% basis', s=>{
    s.settings.sustain = {basis:'aop', pct:15};
  }); l03.group=g;
  validate(l03, run(l03), 'L03');

  // L04: Sustain — amount 8M fixed
  const l04 = sc('L04','Sustain fixed 8M', s=>{
    s.settings.sustain = {basis:'amount', amount:8, pct:0};
  }); l04.group=g;
  validate(l04, run(l04), 'L04');

  // L05: Value — AOP 30% basis (vs default bucket 100%)
  const l05 = sc('L05','Value AOP 30% basis', s=>{
    s.settings.value = {basis:'aop', pct:30};
  }); l05.group=g;
  validate(l05, run(l05), 'L05');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP 2 — IT SIMPLIFICATION LEVER (5 scenarios: OFF, low, mid, high, amount)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const g = 'G2-IT Simp Lever';
  // L06: IT Simp OFF (default)
  const l06 = sc('L06','IT Simp OFF (baseline)', s=>{}); l06.group=g;
  validate(l06, run(l06), 'L06');

  // L07: IT Simp 2.5% of AOP
  const l07 = sc('L07','IT Simp ON 2.5% AOP', s=>{
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'aop',pct:2.5};
  }); l07.group=g;
  validate(l07, run(l07), 'L07');

  // L08: IT Simp 7.5% of AOP
  const l08 = sc('L08','IT Simp ON 7.5% AOP', s=>{
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'aop',pct:7.5};
  }); l08.group=g;
  validate(l08, run(l08), 'L08');

  // L09: IT Simp 100% of bucket (all decomm funded)
  const l09 = sc('L09','IT Simp ON 100% bucket', s=>{
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'bucket',pct:100};
  }); l09.group=g;
  validate(l09, run(l09), 'L09');

  // L10: IT Simp fixed 12M
  const l10 = sc('L10','IT Simp ON 12M fixed', s=>{
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'amount',amount:12,pct:0};
  }); l10.group=g;
  validate(l10, run(l10), 'L10');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP 3 — ExCo OPT-IN / OPT-OUT (6 scenarios)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const g = 'G3-ExCo Opt-In/Out';

  // L11: ISC — opt-in both unfunded Stage3 EW programs
  const l11 = sc('L11','ISC opt-in all Stage3 unfunded', s=>{
    P.isc.s3u.forEach(id=>ov(s,id,'include'));
  }); l11.group=g;
  validate(l11, run(l11), 'L11');

  // L12: IGTS — opt-out both Stage3 funded, opt-in top 3 unfunded
  const l12 = sc('L12','IGTS swap: opt-out funded, opt-in top-3 unfunded', s=>{
    P.igt.s3f.forEach(id=>ov(s,id,'exclude'));
    P.igt.s3u.slice(0,3).forEach(id=>ov(s,id,'include'));
  }); l12.group=g;
  validate(l12, run(l12), 'L12');

  // L13: PH — opt-out all Stage3 funded programs
  const l13 = sc('L13','PH opt-out all Stage3 funded', s=>{
    P.ph.s3f.forEach(id=>ov(s,id,'exclude'));
  }); l13.group=g;
  validate(l13, run(l13), 'L13');

  // L14: PH — opt-in 5 unfunded Stage3 programs
  const l14 = sc('L14','PH opt-in 5 unfunded Stage3', s=>{
    P.ph.s3u.slice(0,5).forEach(id=>ov(s,id,'include'));
  }); l14.group=g;
  validate(l14, run(l14), 'L14');

  // L15: Services — opt-out Stage3 funded, opt-in 2 unfunded
  const l15 = sc('L15','Services swap: out funded, in top-2 unfunded', s=>{
    P.svc.s3f.forEach(id=>ov(s,id,'exclude'));
    P.svc.s3u.slice(0,2).forEach(id=>ov(s,id,'include'));
  }); l15.group=g;
  validate(l15, run(l15), 'L15');

  // L16: All four ExCo opt-out Stage3 funded simultaneously
  const l16 = sc('L16','All four ExCo opt-out all Stage3 funded', s=>{
    [...P.isc.s3f,...P.igt.s3f,...P.ph.s3f,...P.svc.s3f].forEach(id=>ov(s,id,'exclude'));
  }); l16.group=g;
  validate(l16, run(l16), 'L16');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP 4 — PARTIAL FUNDING (4 scenarios)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const g = 'G4-Partial Funding';

  // L17: IGTS — all Stage3 funded at 75% cost
  const l17 = sc('L17','IGTS Stage3 funded at 75%', s=>{
    P.igt.s3f.forEach(id=>ov(s,id,'include',rec(id).cost*0.75));
    P.igt.s3u.slice(0,2).forEach(id=>ov(s,id,'include',rec(id).cost*0.75));
  }); l17.group=g;
  validate(l17, run(l17), 'L17');

  // L18: PH — unfunded Stage3 at 50%
  const l18 = sc('L18','PH unfunded Stage3 at 50% cost', s=>{
    P.ph.s3u.slice(0,4).forEach(id=>ov(s,id,'include',rec(id).cost*0.5));
  }); l18.group=g;
  validate(l18, run(l18), 'L18');

  // L19: Services — 4 key EW unfunded at 30% cost
  const l19 = sc('L19','Services top-4 unfunded EW at 30% cost', s=>{
    ['EW-122','EW-95','EW-114','EW-131'].forEach(id=>ov(s,id,'include',rec(id).cost*0.3));
  }); l19.group=g;
  validate(l19, run(l19), 'L19');

  // L20: ISC + Services both partial (ISC s3u at 50%, Services s3u top-3 at 40%)
  const l20 = sc('L20','ISC 50% + Services 40% partial combined', s=>{
    P.isc.s3u.forEach(id=>ov(s,id,'include',rec(id).cost*0.5));
    P.svc.s3u.slice(0,3).forEach(id=>ov(s,id,'include',rec(id).cost*0.4));
  }); l20.group=g;
  validate(l20, run(l20), 'L20');
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP 5 — COMBINED LEVERS + ExCo (5 scenarios)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const g = 'G5-Combined';

  // L21: IT Simp 5% + IGTS decomm on-top + PH top-3 unfunded
  const l21 = sc('L21','IT Simp 5% AOP + IGTS decomm on-top + PH top-3', s=>{
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'aop',pct:5};
    P.igt.decomm.slice(0,5).forEach(id=>ov(s,id,'include'));
    P.ph.s3u.slice(0,3).forEach(id=>ov(s,id,'include'));
  }); l21.group=g;
  validate(l21, run(l21), 'L21');

  // L22: Budget 90M + Sustain protect 80% + Services 2 unfunded on-top
  const l22 = sc('L22','Budget 90M + Sustain 80% bucket + Services 2 on-top', s=>{
    s.settings.budget=90;
    s.settings.sustain={basis:'bucket',pct:80};
    P.svc.s3u.slice(0,2).forEach(id=>ov(s,id,'include'));
  }); l22.group=g;
  validate(l22, run(l22), 'L22');

  // L23: Budget 80M + IT Simp 8% + ISC Stage1 forced on-top (2 smallest)
  const l23 = sc('L23','Budget 80M + IT Simp 8% + ISC 2 Stage1 on-top', s=>{
    s.settings.budget=80;
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'aop',pct:8};
    P.isc.s1u.slice(-2).forEach(id=>ov(s,id,'include'));  // 2 smallest ISC carry
  }); l23.group=g;
  validate(l23, run(l23), 'L23');

  // L24: All-lever AOP basis + all four ExCo 1 unfunded each on-top
  const l24 = sc('L24','All levers AOP + 1 unfunded per ExCo on-top', s=>{
    s.settings.lfr    = {basis:'aop',pct:15};
    s.settings.sustain= {basis:'aop',pct:12};
    s.settings.value  = {basis:'aop',pct:25};
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'aop',pct:4};
    ov(s, P.isc.s3u[0], 'include');
    ov(s, P.igt.s3u[0], 'include');
    ov(s, P.ph.s3u[0],  'include');
    ov(s, P.svc.s3u[2], 'include');   // EW-114 CPQ/CLM
  }); l24.group=g;
  validate(l24, run(l24), 'L24');

  // L25: Budget 110M + all five levers maximised + IGTS partial
  const l25 = sc('L25','Budget 110M + max levers + IGTS Stage3 at 80%', s=>{
    s.settings.budget=110;
    s.settings.lfr    = {basis:'bucket',pct:100};
    s.settings.sustain= {basis:'bucket',pct:100};
    s.settings.value  = {basis:'bucket',pct:100};
    s.settings.itsimpMode=true; s.settings.itsimp={basis:'bucket',pct:50};
    P.igt.s3f.forEach(id=>ov(s,id,'include',rec(id).cost*0.8));
    P.igt.s3u.slice(0,4).forEach(id=>ov(s,id,'include',rec(id).cost*0.8));
  }); l25.group=g;
  validate(l25, run(l25), 'L25');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const passed = checks.filter(c=>c.passed).length;
const failed = checks.filter(c=>!c.passed);
const byScenario = {};
checks.forEach(c=>{
  const m = c.name.match(/^(L\d+)/);
  if (!m) return;
  const id = m[1];
  if (!byScenario[id]) byScenario[id]={total:0,passed:0,failures:[]};
  byScenario[id].total++;
  if (c.passed) byScenario[id].passed++;
  else byScenario[id].failures.push(c.name.replace(id+' ',''));
});

fs.writeFileSync(path.join(D,'audit/lever-scenarios.json'),
  JSON.stringify({checks, scenarios}, null, 2));

const report = {
  total: checks.length,
  passed,
  failed: failed.length,
  failures: failed,
  byScenario,
  summary: scenarios.map(s=>({
    id:s.id, name:s.name, group:s.group,
    budget:s.levers.budget, itsimpMode:s.levers.itsimpMode,
    overrides:s.overrides.length,
    funded_M:s.totals.funded, pmi_M:s.totals.pmi,
    ew_M:s.totals.ew, bu_M:s.totals.bu,
    grand_M:s.totals.grandTotal,
    exco:{
      ISC:s.exco['Wim Appelo'].funded,
      IGTS:s.exco['Bert van Meurs'].funded,
      PH:s.exco['Deeptha Khanna'].funded,
      Svc:s.exco['Laura Matz'].funded
    }
  }))
};
fs.writeFileSync(path.join(D,'audit/lever-simulation-qa.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
