/**
 * BU / ExCo Scenario Validation — v5.7.0
 * 12 scenarios across ISC (Wim Appelo), IGTS (Bert van Meurs),
 * PH (Deeptha Khanna), and Services/IT (Laura Matz).
 * Covers Decomm, Additional-On-Top, and combinations.
 * Run: node bu-exco-scenarios.js
 */
'use strict';
const fs = require('fs'), path = require('path'), A = require('./engine.js');
const D = __dirname;
global.OPS_DATA = JSON.parse(fs.readFileSync(path.join(D, 'audit/ops-data.json')));
const data = A.normalize(JSON.parse(fs.readFileSync(path.join(D, 'audit/program-source.json'))));
const initial = A.createSession(data);
const base = A.solve(data, initial.settings);
const checks = [], scenarios = [];
const near = (a, b) => Math.abs(a - b) < 1e-6;
const check = (name, ok, detail = '') => checks.push({ name, passed: !!ok, detail: detail === '' ? '' : String(detail) });
const clone = x => JSON.parse(JSON.stringify(x));
const find = pred => base.rows.find(pred);
const round = v => Math.floor(v * 1e6 + 0.50000001) / 1e6;

// ── Fixed program IDs from live data ─────────────────────────────────────────
// ISC (Wim Appelo) — EW stream, all small
const ISC_FUNDED_S3   = 'EW-03';  // LCA Automation 0.02M — stage3 funded
const ISC_UNFUND_S3A  = 'EW-01';  // RSL Automation 0.06M — stage3 unfunded
const ISC_UNFUND_S3B  = 'EW-02';  // D-Lit Automation 0.04M — stage3 unfunded

// IGTS (Bert van Meurs) — BU stream
const IGT_FUND_S3A    = 'Bu-63';  // Commercial Intelligence & CRM 0.55M — funded
const IGT_FUND_S3B    = 'Bu-57';  // Symphony Eye 4M — funded
const IGT_UNFUND_S3A  = 'Bu-437'; // WS5 Remote Digital First 3.107M — unfunded
const IGT_UNFUND_S3B  = 'Bu-447'; // PLCM IGT-D 0.071M — unfunded
const IGT_DECOMM_A    = 'Bu-435'; // CDP decom 0.85M
const IGT_DECOMM_B    = 'Bu-441'; // PS Cloud (Certinia) 1M
const IGT_DECOMM_C    = 'Bu-443'; // OneTnV 0.7M
const IGT_DECOMM_D    = 'Bu-449'; // SPC Data Re-platforming 0.499M
const IGT_DECOMM_E    = 'Bu-452'; // Incenter replacement 0.8M

// PH (Deeptha Khanna) — BU stream
const PH_FUND_S3A     = 'Bu-299'; // Pulse 0.25M — funded
const PH_FUND_S3B     = 'Bu-304'; // PXM 0.58M — funded
const PH_UNFUND_S3A   = 'Bu-313'; // philips.com growth 0.9M — unfunded
const PH_UNFUND_S3B   = 'Bu-285'; // RGM Decision Engine 0.9M — unfunded
const PH_UNFUND_S3C   = 'Bu-290'; // AI Product Intelligence 1M — unfunded
const PH_DECOMM_A     = 'Bu-30';  // Philips Store for Business 1.5M — funded@1M

// Services / IT (Laura Matz) — EW stream
const SVC_FUND_S3A    = 'EW-99';  // Zero Trust 0.17M — funded
const SVC_FUND_S3B    = 'EW-43';  // EADI-GAIT 2M — funded
const SVC_UNFUND_S3A  = 'EW-122'; // Sales Replatforming 7M — unfunded (decomm)
const SVC_UNFUND_S3B  = 'EW-95';  // Real Estate infra 2.5M — unfunded (decomm)
const SVC_UNFUND_S3C  = 'EW-114'; // CPQ/CLM 1.8M — unfunded (decomm)
const SVC_UNFUND_S3D  = 'EW-131'; // EADI Synapse Decom 1.062M — unfunded (decomm)
const SVC_DECOMM_ONLY = 'EW-72';  // ARIS Process framework 0.4M — already funded

const rec = id => data.records.find(r => r.id === id);
const ov = (s, id, choice, amount) => {
  const r = rec(id);
  s.overrides[id] = {
    choice,
    amount: choice === 'exclude' ? 0 : (amount !== undefined ? round(amount) : r.cost),
    state: 'active',
    fingerprint: r.fingerprint,
    note: 'BU/ExCo scenario validation override'
  };
};

// Helpers ─────────────────────────────────────────────────────────────────────
function sc(id, name, modify) {
  const s = clone(initial);
  s.id = 'buexco-' + id;
  s.name = name;
  modify && modify(s);
  return s;
}

function validateScenario(cfg, result, label) {
  const f = result.finance;
  check(label + ' funding identity',
    near(result.totals.requested, result.totals.allocation + result.totals.unfunded));
  check(label + ' stream identity',
    near(result.streams.ew.allocation + result.streams.bu.allocation, result.totals.allocation));
  check(label + ' stage identity',
    near(result.stages.reduce((a, s) => a + s.allocation, 0), result.totals.allocation));
  check(label + ' budget cap',
    result.totals.automatic <= cfg.settings.budget * (1 + cfg.settings.tolerance / 100) + 1e-6);
  check(label + ' carry cap',
    result.rows.filter(r => r.stage === 1 && !r.isPmi && r.automatic > 0)
      .every(r => r.carryConfirmed && near(r.automatic, Math.min(r.cost, r.baselined))));
  check(label + ' ledger reconciled', f.reconciled);
  check(label + ' ledger identity',
    near(f.totals.programs, result.totals.allocation + result.pmi.funded));
  check(label + ' EW unallocated share',
    near(f.rows.find(x => x.recipient === 'Unallocated').ew,
         result.streams.ew.allocation * 0.22630331753554522));
  check(label + ' ops invariance',
    near(f.totals.operations, 470.3144630385122));
  check(label + ' row 276 excluded',
    !result.rows.some(r => r.name === 'Enterprise-wide charging'));
  check(label + ' 433 active programs', result.rows.length === 433);
  check(label + ' per-record allocation',
    result.rows.filter(r => r.final > 0).every(r =>
      near(f.ledger.filter(x => x.pillar === 'Programs' && x.id === r.id)
               .reduce((a, x) => a + x.amount, 0), r.final)));
  check(label + ' deterministic',
    JSON.stringify(result) ===
    JSON.stringify(A.solve(data, cfg.settings, cfg.overrides, cfg.reviews)));
  check(label + ' source immutable',
    data.records.every(r => r.cost === base.rows.find(x => x.id === r.id).sourceCost));

  // ExCo chargeout validation: funded total per ExCo == sum of finance ledger amounts for those programs
  const excoLeaders = {
    'Wim Appelo':    result.rows.filter(r => r.exco === 'Wim Appelo' && r.final > 0),
    'Bert van Meurs':result.rows.filter(r => r.exco === 'Bert van Meurs' && r.final > 0),
    'Deeptha Khanna':result.rows.filter(r => r.exco === 'Deeptha Khanna' && r.final > 0),
    'Laura Matz':    result.rows.filter(r => r.exco === 'Laura Matz' && r.final > 0),
  };
  for (const [leader, rows] of Object.entries(excoLeaders)) {
    const fundedSum = rows.reduce((s, r) => s + r.final, 0);
    const ledgerSum = f.ledger.filter(x => x.pillar === 'Programs' &&
      rows.some(r => r.id === x.id)).reduce((s, x) => s + x.amount, 0);
    check(label + ' ' + leader.split(' ')[0] + ' chargeout == funded',
      near(fundedSum, ledgerSum), `funded=${round(fundedSum)} ledger=${round(ledgerSum)}`);
  }

  // BU cluster chargeout spot-check for Image Guided Therapy and Personal Health
  const igtCluster = f.rows.find(x => x.recipient === 'Image Guided Therapy');
  const phCluster  = f.rows.find(x => x.recipient === 'Personal Health');
  const igtExpected = f.ledger.filter(x => x.pillar === 'Programs' && x.recipient === 'Image Guided Therapy')
    .reduce((s, x) => s + x.amount, 0);
  const phExpected  = f.ledger.filter(x => x.pillar === 'Programs' && x.recipient === 'Personal Health')
    .reduce((s, x) => s + x.amount, 0);
  check(label + ' IGT cluster ledger matches row',
    near(igtCluster ? igtCluster.single + igtCluster.cross + igtCluster.indirect +
         igtCluster.other + igtCluster.ew : 0, igtExpected));
  check(label + ' PH cluster ledger matches row',
    near(phCluster ? phCluster.single + phCluster.cross + phCluster.indirect +
         phCluster.other + phCluster.ew : 0, phExpected));

  scenarios.push({
    id: cfg.id, name: cfg.name,
    settings: { budget: cfg.settings.budget, itsimpMode: cfg.settings.itsimpMode },
    overrides: Object.keys(cfg.overrides).length,
    totals: {
      requested: round(result.totals.requested),
      funded:    round(result.totals.allocation),
      unfunded:  round(result.totals.unfunded),
      ew:        round(result.streams.ew.allocation),
      bu:        round(result.streams.bu.allocation),
      total:     round(f.totals.total)
    },
    exco: {
      'Wim Appelo':    round(excoLeaders['Wim Appelo'].reduce((s, r) => s + r.final, 0)),
      'Bert van Meurs':round(excoLeaders['Bert van Meurs'].reduce((s, r) => s + r.final, 0)),
      'Deeptha Khanna':round(excoLeaders['Deeptha Khanna'].reduce((s, r) => s + r.final, 0)),
      'Laura Matz':    round(excoLeaders['Laura Matz'].reduce((s, r) => s + r.final, 0)),
    },
    clusters: {
      'Image Guided Therapy': round(igtCluster ? igtCluster.total - igtCluster.own - igtCluster.region - igtCluster.functions : 0),
      'Personal Health':      round(phCluster  ? phCluster.total  - phCluster.own  - phCluster.region  - phCluster.functions  : 0),
    }
  });
}

// ── SCENARIO 11: IGTS Decomm ring-fenced via IT Simp lever ───────────────────
{
  const cfg = sc('11', 'IGTS Decomm Ring-Fenced (IT Simp 5% AOP)', s => {
    s.settings.itsimpMode = true;
    s.settings.itsimp = { basis: 'aop', pct: 5 };
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S11');
}

// ── SCENARIO 12: PH Additional On Top — force-include unfunded PH programs ───
{
  const cfg = sc('12', 'PH Additional On Top — 3 unfunded programs forced', s => {
    ov(s, PH_UNFUND_S3A, 'include');   // philips.com growth 0.9M
    ov(s, PH_UNFUND_S3B, 'include');   // RGM Decision Engine 0.9M
    ov(s, PH_UNFUND_S3C, 'include');   // AI Product Intelligence 1M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S12');
}

// ── SCENARIO 13: IGTS On Top — force-include key unfunded IGTS programs ──────
{
  const cfg = sc('13', 'IGTS Additional On Top — WS5 Remote Digital + PLCM', s => {
    ov(s, IGT_UNFUND_S3A, 'include');  // WS5 Remote Digital First 3.107M
    ov(s, IGT_UNFUND_S3B, 'include');  // PLCM IGT-D 0.071M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S13');
}

// ── SCENARIO 14: IT Services Decomm — ring-fence 10M for Services decomm ─────
{
  const cfg = sc('14', 'IT Services Decomm Ring-Fenced 10M (IT Simp amount)', s => {
    s.settings.itsimpMode = true;
    s.settings.itsimp = { basis: 'amount', amount: 10, pct: 0 };
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S14');
}

// ── SCENARIO 15: ISC All In — force-include all ISC unfunded stage3 programs ─
{
  const cfg = sc('15', 'ISC All In — 2 EW stage3 unfunded programs forced', s => {
    ov(s, ISC_UNFUND_S3A, 'include');  // RSL Automation 0.06M
    ov(s, ISC_UNFUND_S3B, 'include');  // D-Lit Automation 0.04M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S15');
}

// ── SCENARIO 16: PH + IGTS Decomm Combined ───────────────────────────────────
{
  const cfg = sc('16', 'PH + IGTS Decomm Combined (IT Simp 3M amount)', s => {
    s.settings.itsimpMode = true;
    s.settings.itsimp = { basis: 'amount', amount: 3, pct: 0 };
    // Also force-include the top PH unfunded
    ov(s, PH_UNFUND_S3A, 'include');
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S16');
}

// ── SCENARIO 17: Budget Pressure 90M + Decomm 5% AOP ────────────────────────
{
  const cfg = sc('17', 'Budget Pressure 90M + IT Simp 5% AOP', s => {
    s.settings.budget = 90;
    s.settings.itsimpMode = true;
    s.settings.itsimp = { basis: 'aop', pct: 5 };
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S17');
}

// ── SCENARIO 18: ExCo Trade-off — ISC exclude funded, IGTS add unfunded ──────
{
  const cfg = sc('18', 'ExCo Trade-off — ISC drop EW-03, IGTS add PLCM', s => {
    ov(s, ISC_FUNDED_S3,  'exclude');  // drop LCA Automation
    ov(s, IGT_UNFUND_S3B, 'include');  // add PLCM IGT-D 0.071M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S18');
}

// ── SCENARIO 19: Max IT Services On Top ──────────────────────────────────────
// Force-include 4 unfunded Services programs (Sales Replatf, Real Estate, CPQ/CLM, Synapse)
{
  const cfg = sc('19', 'IT Services On Top — 4 major EW programs forced', s => {
    ov(s, SVC_UNFUND_S3A, 'include');  // Sales Replatforming 7M
    ov(s, SVC_UNFUND_S3B, 'include');  // Real Estate infra 2.5M
    ov(s, SVC_UNFUND_S3C, 'include');  // CPQ/CLM 1.8M
    ov(s, SVC_UNFUND_S3D, 'include');  // EADI Synapse 1.062M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S19');
}

// ── SCENARIO 20: PH Protect + Services On Top (partial scope) ────────────────
{
  const cfg = sc('20', 'PH Protect + Services On Top (partial cost)', s => {
    // PH unfunded at half cost
    ov(s, PH_UNFUND_S3A, 'include', rec(PH_UNFUND_S3A).cost * 0.5);
    ov(s, PH_UNFUND_S3B, 'include', rec(PH_UNFUND_S3B).cost * 0.5);
    // Services partial
    ov(s, SVC_UNFUND_S3A, 'include', rec(SVC_UNFUND_S3A).cost * 0.3); // 30% of Sales Replatf
    ov(s, SVC_UNFUND_S3C, 'include', rec(SVC_UNFUND_S3C).cost * 0.5); // 50% of CPQ/CLM
    // exclude an existing funded program to offset
    ov(s, SVC_FUND_S3A, 'exclude');
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S20');
}

// ── SCENARIO 21: All Four ExCo On Top (ISC + IGTS + PH + Services) ───────────
{
  const cfg = sc('21', 'All Four ExCo On Top — representative from each', s => {
    ov(s, ISC_UNFUND_S3A,  'include');  // ISC: RSL Automation 0.06M
    ov(s, IGT_UNFUND_S3B,  'include');  // IGTS: PLCM 0.071M
    ov(s, PH_UNFUND_S3A,   'include');  // PH: philips.com growth 0.9M
    ov(s, SVC_UNFUND_S3D,  'include');  // Services: EADI Synapse 1.062M
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S21');
}

// ── SCENARIO 22: Decomm Stress — 80M + Max IT Simp + all IGTS decomm forced ──
{
  const cfg = sc('22', 'Stress 80M + IT Simp 8% AOP + IGTS decomm force', s => {
    s.settings.budget = 80;
    s.settings.itsimpMode = true;
    s.settings.itsimp = { basis: 'aop', pct: 8 };
    // Force all IGTS decomm programs on top
    for (const id of [IGT_DECOMM_A, IGT_DECOMM_B, IGT_DECOMM_C, IGT_DECOMM_D, IGT_DECOMM_E])
      ov(s, id, 'include');
  });
  validateScenario(cfg, A.solve(data, cfg.settings, cfg.overrides, cfg.reviews), 'S22');
}

// ── Summary ───────────────────────────────────────────────────────────────────
const passed  = checks.filter(c => c.passed).length;
const failed  = checks.filter(c => !c.passed);
const perScenario = {};
for (const c of checks) {
  const m = c.name.match(/^(S\d+)/);
  if (!m) continue;
  const s = m[1];
  if (!perScenario[s]) perScenario[s] = { total: 0, passed: 0, failures: [] };
  perScenario[s].total++;
  if (c.passed) perScenario[s].passed++;
  else perScenario[s].failures.push(c.name.replace(s + ' ', ''));
}

fs.writeFileSync(
  path.join(D, 'audit/bu-exco-scenarios.json'),
  JSON.stringify({ checks, scenarios }, null, 2)
);

console.log(JSON.stringify({
  total: checks.length,
  passed,
  failed: failed.length,
  failures: failed,
  perScenario,
  scenarios: scenarios.map(s => ({
    id: s.id,
    name: s.name,
    budget: s.settings.budget,
    itsimpMode: s.settings.itsimpMode,
    overrides: s.overrides,
    funded_M: s.totals.funded,
    ew_M: s.totals.ew,
    bu_M: s.totals.bu,
    exco: s.exco,
    clusters: s.clusters
  }))
}, null, 2));
