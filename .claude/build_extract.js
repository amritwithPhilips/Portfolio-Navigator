#!/usr/bin/env node
/**
 * build_extract.js — Extracts all program & operations data from the
 * AOP 2027 modeler v5.9.1 HTML and writes a standalone filterable HTML extract.
 *
 * Usage:  node .claude/build_extract.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const MODELER = path.resolve(__dirname, '..', 'AOP 2027 Modeler',
  'AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.1.html');
const OUTPUT  = path.resolve(__dirname, '..', 'AOP 2027 Demand',
  'AOP2027-Detailed-Data-Extract.html');

// ── 1. Read the modeler HTML ─────────────────────────────────────────
console.log('Reading modeler…');
const html = fs.readFileSync(MODELER, 'utf-8');

// ── 2. Extract JSON blobs ─────────────────────────────────────────────
function extractScript(id) {
  const re = new RegExp(`<script[^>]+id="${id}"[^>]*>([\\s\\S]*?)</script>`);
  const m = html.match(re);
  if (!m) throw Error(`Script #${id} not found`);
  return JSON.parse(m[1]);
}
const sourceData = extractScript('source-data');
const opsData    = extractScript('ops-data');

// ── 3. Load the AOP engine IIFE ──────────────────────────────────────
// The engine is in Skills/assets/engine.js — load it directly.
const enginePath = path.resolve(__dirname, '..', 'Skills', 'assets', 'engine.js');
const engineSrc  = fs.readFileSync(enginePath, 'utf-8');

// Execute engine IIFE – it writes to globalThis.AOP
globalThis.OPS_DATA = opsData;           // engine reads this inside solve()
eval(engineSrc);
const AOP = globalThis.AOP;
console.log(`Engine v${AOP.VERSION} loaded.`);

// ── 4. Normalize → create session → solve ─────────────────────────────
const data    = AOP.normalize(sourceData);
const session = AOP.createSession(data);
const result  = AOP.solve(data, session.settings, session.overrides, session.reviews);
console.log(`Programs: ${result.rows.length}  |  Ops services: ${opsData.operations.services.length}`);

// ── 5. Prepare table data ─────────────────────────────────────────────
// Programs — split into BU-led and F&R (enterprise-wide)
const buRows = [], ewRows = [];
for (const r of result.rows) {
  const row = {
    id: r.id,
    name: r.name,
    org: r.org,
    exco: r.exco || 'Unassigned',
    platform: r.platform || '',
    newCarry: r.newCarry || '',
    type: r.type || '',
    category: r.category || '',
    area: r.area || '',
    priority: r.priority || '',
    decisionBand: r.decisionBand || '',
    overall: r.overall || '',
    // Submitted data fields
    benefitQuant: r.benefit,
    benefitRaw: r.benefitRaw,
    benefitDetails: r.benefitDetails || '',
    benefitSource: r.benefitSource || '',
    problem: r.problem || '',
    scope: r.scope || '',
    impact: r.impact || '',
    paybackRaw: r.paybackRaw != null ? String(r.paybackRaw) : '',
    remarks: r.remarks || '',
    dependency: r.dependency || '',
    // Financial columns
    cost: r.cost,
    final: r.final,
    unfunded: r.unfunded,
    automatic: r.automatic,
    benefit: r.benefit,
    benefitClass: r.benefitClassLabel || r.benefitClass || '',
    benefitFlag: r.benefitFlag || '',
    ratio: r.ratio,
    paybackYears: r.paybackYears,
    // Scoring
    score: r.score != null ? Math.round(r.score * 10) / 10 : null,
    raw0: r.rawComponents ? r.rawComponents[0] : null,
    raw1: r.rawComponents ? r.rawComponents[1] : null,
    raw2: r.rawComponents ? r.rawComponents[2] : null,
    raw3: r.rawComponents ? r.rawComponents[3] : null,
    raw4: r.rawComponents ? r.rawComponents[4] : null,
    comp0: r.components ? r.components[0] : null,
    comp1: r.components ? r.components[1] : null,
    comp2: r.components ? r.components[2] : null,
    comp3: r.components ? r.components[3] : null,
    comp4: r.components ? r.components[4] : null,
    priorityPts: r.priorityPoints,
    paybackPts: r.paybackPoints,
    // Scenario outcome
    stageName: r.stageName || '',
    rank: r.rank,
    status: r.status || '',
    reason: r.reason || '',
    eligible: r.eligible,
    // LFR / Carry
    lfrTier: r.lfrTier || '',
    lfrVerified: r.lfrVerified,
    hasLfrEvidence: r.hasLfrEvidence,
    isBaselinedCarry: r.isBaselinedCarry,
    carryConfirmed: r.carryConfirmed,
    warnings: (r.warnings || []).join('; '),
    holds: (r.holds || []).join('; '),
    // Source
    sourceSheet: r.sourceSheet || '',
    sourceRow: r.sourceRow
  };
  if (r.stream === 'ew') ewRows.push(row);
  else buRows.push(row);
}

// Operations
const opsRows = opsData.operations.services.map(s => ({
  serviceId: s.serviceId,
  name: s.name,
  dept: s.dept || '',
  manager: s.manager || '',
  leader: s.leader || '',
  tbmCategory: s.tbmCategory || '',
  cost2026: s.cost2026,
  cost2027: s.cost2027,
  delta: s.cost2027 != null && s.cost2026 != null
    ? Math.round((s.cost2027 - s.cost2026) * 1e6) / 1e6 : null,
  sourceSheet: s.sourceSheet || '',
  sourceRow: s.sourceRow
}));

// ── 6. Prepare mapping / reference data ───────────────────────────────
const mappings = {
  excoHierarchy: Object.entries(AOP.EXCO_HIERARCHY).map(([name, info]) => ({
    exco: name, role: info.role, orgs: info.orgs
  })),
  orgToExco: AOP.ORG_TO_EXCO,
  orgRename: AOP.ORG_RENAME || {},
  stages: AOP.STAGES,
  lfrDecisionCount: AOP.LFR_EXCO_DECISIONS ? Object.keys(AOP.LFR_EXCO_DECISIONS).length : 0,
  lfrDecisions: AOP.LFR_EXCO_DECISIONS || {},
  optimalPreset: AOP.preset('optimal'),
  currentSettings: session.settings,
  scoreWeights: session.settings.weights,
  scoreComponents: ['Benefit Strength (0-50)','Submitted Priority (0-25)','Captured Consequence (0-15)','Decision Band (0-10)','Payback Period (0-10)'],
  platformNorm: {},
  version: AOP.VERSION
};

// Extract platform normalization from data
for (const r of result.rows) {
  const raw = r.sourceValues?.find(sv => sv.label && sv.label.toLowerCase().includes('platform'));
  if (raw && raw.value && raw.value !== r.platform) {
    mappings.platformNorm[raw.value] = r.platform || '(blank)';
  }
}

// ── 7. Build the HTML ─────────────────────────────────────────────────
const DATA_JS = `
const BU_ROWS  = ${JSON.stringify(buRows)};
const EW_ROWS  = ${JSON.stringify(ewRows)};
const OPS_ROWS = ${JSON.stringify(opsRows)};
const MAPPINGS = ${JSON.stringify(mappings)};
`;

const htmlOutput = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AOP 2027 — Detailed Data Extract</title>
<style>
:root {
  --dk: #00126E;
  --blue: #0B5CD5;
  --bg: #F4F7FA;
  --mist: #EBF0F5;
  --text: #1B2636;
  --subtle: #667085;
  --border: #D0D5DD;
  --funded: #0B8A4B;
  --partial: #E6920E;
  --not-funded: #C4320A;
  --row-hover: rgba(11,92,213,.06);
  --radius: 6px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 13px; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.45;
}

/* ── Header ─────────────────────────────────────────────────────── */
.header {
  background: var(--dk);
  color: #fff;
  padding: 18px 28px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.header h1 { font-size: 1.35rem; font-weight: 600; letter-spacing: -.02em; }
.header .meta { font-size: .82rem; opacity: .72; margin-left: auto; }

/* ── Tabs ────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 2px solid var(--border);
  padding: 0 28px;
  gap: 0;
}
.tab-btn {
  padding: 11px 22px;
  font-size: .88rem;
  font-weight: 600;
  color: var(--subtle);
  cursor: pointer;
  border: none;
  background: none;
  position: relative;
  transition: color .15s;
}
.tab-btn:hover { color: var(--dk); }
.tab-btn.active {
  color: var(--blue);
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--blue);
  border-radius: 3px 3px 0 0;
}
.tab-panel { display: none; padding: 0; }
.tab-panel.active { display: block; }

/* ── Filters ─────────────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 28px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  align-items: center;
}
.filter-bar label {
  font-size: .78rem;
  font-weight: 600;
  color: var(--subtle);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.filter-bar select {
  font-size: .82rem;
  padding: 5px 28px 5px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  color: var(--text);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23667085'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  cursor: pointer;
  max-width: 200px;
}
.filter-bar select:focus {
  outline: 2px solid var(--blue);
  outline-offset: -1px;
}
.filter-bar .search-box {
  font-size: .82rem;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 220px;
}
.filter-bar .search-box:focus {
  outline: 2px solid var(--blue);
  outline-offset: -1px;
}
.filter-bar .clear-btn {
  font-size: .78rem;
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  color: var(--subtle);
  cursor: pointer;
}
.filter-bar .clear-btn:hover { background: var(--mist); }
.count-badge {
  font-size: .78rem;
  color: var(--subtle);
  margin-left: auto;
}

/* ── Table ────────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  padding: 0 20px 20px;
  margin-top: 2px;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  font-size: .82rem;
}
thead th {
  position: sticky;
  top: 0;
  background: var(--mist);
  padding: 9px 10px;
  text-align: left;
  font-weight: 700;
  font-size: .74rem;
  text-transform: uppercase;
  letter-spacing: .03em;
  color: var(--dk);
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
thead th:hover { background: #dde3eb; }
thead th .sort-arrow { font-size: .65rem; margin-left: 3px; opacity: .4; }
thead th.sorted .sort-arrow { opacity: 1; color: var(--blue); }
tbody td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--mist);
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
tbody td.name-col {
  max-width: 350px;
  white-space: normal;
  word-wrap: break-word;
}
tbody td.detail-col {
  max-width: 250px;
  white-space: normal;
  word-wrap: break-word;
  font-size: .82rem;
  color: var(--subtle);
}
tbody td.reason-col {
  max-width: 280px;
  white-space: normal;
  word-wrap: break-word;
}
tbody tr:hover { background: var(--row-hover); }
tbody tr:last-child td { border-bottom: none; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.status-funded { color: var(--funded); font-weight: 600; }
.status-partial { color: var(--partial); font-weight: 600; }
.status-not { color: var(--not-funded); font-weight: 600; }
.status-excluded { color: var(--subtle); font-weight: 600; }

/* ── Totals row ──────────────────────────────────────────────────── */
tfoot td {
  padding: 10px 10px;
  font-weight: 700;
  background: var(--mist);
  border-top: 2px solid var(--border);
  font-size: .84rem;
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .filter-bar { padding: 10px 14px; }
  .table-wrap { padding: 0 8px 12px; }
  .header { padding: 14px 14px; }
}

/* ── Reference / Mappings ──────────────────────────────────────────── */
.ref-content { padding: 20px 28px; max-width: 1200px; }
.ref-content h2 { font-size: 1.2rem; }
.ref-section { margin-bottom: 16px; background: #fff; border-radius: var(--radius); border: 1px solid var(--border); }
.ref-section summary { padding: 12px 16px; font-weight: 600; font-size: .92rem; cursor: pointer; color: var(--dk); }
.ref-section summary:hover { background: var(--mist); }
.ref-tbl { width: 100%; border-collapse: collapse; font-size: .85rem; }
.ref-tbl th { background: var(--dk); color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; position: sticky; top: 0; }
.ref-tbl td { padding: 6px 12px; border-bottom: 1px solid var(--border); }
.ref-tbl tr:hover { background: var(--row-hover); }

/* ── Print ────────────────────────────────────────────────────────── */
@media print {
  .header { background: #fff !important; color: #000; border-bottom: 2px solid #000; }
  .tab-bar, .filter-bar { display: none; }
  .tab-panel { display: block !important; page-break-after: always; }
  table { font-size: .7rem; box-shadow: none; }
  thead th { background: #eee !important; }
}
</style>
</head>
<body>

<div class="header">
  <h1>AOP 2027 Detailed Data Extract</h1>
  <span class="meta">Source: v5.9.1 &middot; Generated ${new Date().toISOString().slice(0,10)}</span>
</div>

<div class="tab-bar" role="tablist">
  <button class="tab-btn active" data-tab="bu" role="tab" aria-selected="true">BU Led Programs</button>
  <button class="tab-btn" data-tab="ew" role="tab" aria-selected="false">F&amp;R Programs</button>
  <button class="tab-btn" data-tab="ops" role="tab" aria-selected="false">Operations Services</button>
  <button class="tab-btn" data-tab="ref" role="tab" aria-selected="false">Mappings &amp; Reference</button>
</div>

<!-- BU Programs -->
<div id="panel-bu" class="tab-panel active">
  <div class="filter-bar" id="filters-bu">
    <label>Org</label>     <select data-filter="org"><option value="">All</option></select>
    <label>Platform</label> <select data-filter="platform"><option value="">All</option></select>
    <label>New/CO</label>   <select data-filter="newCarry"><option value="">All</option></select>
    <label>Inv. Area</label><select data-filter="type"><option value="">All</option></select>
    <label>Status</label>   <select data-filter="status"><option value="">All</option></select>
    <label>ExCo</label>     <select data-filter="exco"><option value="">All</option></select>
    <label>Lever</label>    <select data-filter="stageName"><option value="">All</option></select>
    <input type="text" class="search-box" placeholder="Search ID / name / org..." data-search>
    <button class="clear-btn" data-clear>Clear</button>
    <span class="count-badge" data-count></span>
  </div>
  <div class="table-wrap">
    <table id="table-bu">
      <thead><tr id="head-bu"></tr></thead>
      <tbody id="body-bu"></tbody>
      <tfoot><tr id="foot-bu"></tr></tfoot>
    </table>
  </div>
</div>

<!-- EW Programs -->
<div id="panel-ew" class="tab-panel">
  <div class="filter-bar" id="filters-ew">
    <label>Org</label>     <select data-filter="org"><option value="">All</option></select>
    <label>Platform</label> <select data-filter="platform"><option value="">All</option></select>
    <label>New/CO</label>   <select data-filter="newCarry"><option value="">All</option></select>
    <label>Inv. Area</label><select data-filter="type"><option value="">All</option></select>
    <label>Status</label>   <select data-filter="status"><option value="">All</option></select>
    <label>ExCo</label>     <select data-filter="exco"><option value="">All</option></select>
    <label>Lever</label>    <select data-filter="stageName"><option value="">All</option></select>
    <input type="text" class="search-box" placeholder="Search ID / name / org..." data-search>
    <button class="clear-btn" data-clear>Clear</button>
    <span class="count-badge" data-count></span>
  </div>
  <div class="table-wrap">
    <table id="table-ew">
      <thead><tr id="head-ew"></tr></thead>
      <tbody id="body-ew"></tbody>
      <tfoot><tr id="foot-ew"></tr></tfoot>
    </table>
  </div>
</div>

<!-- Operations -->
<div id="panel-ops" class="tab-panel">
  <div class="filter-bar" id="filters-ops">
    <label>Dept</label>    <select data-filter="dept"><option value="">All</option></select>
    <label>Manager</label> <select data-filter="manager"><option value="">All</option></select>
    <label>Leader</label>  <select data-filter="leader"><option value="">All</option></select>
    <label>TBM Cat.</label><select data-filter="tbmCategory"><option value="">All</option></select>
    <input type="text" class="search-box" placeholder="Search ID / name..." data-search>
    <button class="clear-btn" data-clear>Clear</button>
    <span class="count-badge" data-count></span>
  </div>
  <div class="table-wrap">
    <table id="table-ops">
      <thead><tr id="head-ops"></tr></thead>
      <tbody id="body-ops"></tbody>
      <tfoot><tr id="foot-ops"></tr></tfoot>
    </table>
  </div>
</div>

<!-- Mappings & Reference -->
<div id="panel-ref" class="tab-panel">
  <div class="ref-content" id="ref-content"></div>
</div>

<script>
${DATA_JS}

// ── Column definitions ─────────────────────────────────────────────
const PROG_COLS = [
  // Identity
  { key:'id',           label:'ID',                 cls:'', group:'Identity' },
  { key:'name',         label:'Program Name',        cls:'name-col', group:'Identity' },
  { key:'org',          label:'Organisation',        cls:'', group:'Identity' },
  { key:'exco',         label:'ExCo Leader',         cls:'', group:'Identity' },
  { key:'platform',     label:'Platform',            cls:'', group:'Identity' },
  { key:'newCarry',     label:'New / Carryover',     cls:'', group:'Identity' },
  { key:'type',         label:'Investment Area',     cls:'', group:'Identity' },
  { key:'category',     label:'Category',            cls:'', group:'Identity' },
  { key:'area',         label:'Investment Area Detail', cls:'', group:'Identity' },
  // Submitted Data
  { key:'priority',     label:'Priority',            cls:'', group:'Submitted Data' },
  { key:'decisionBand', label:'Decision Band',       cls:'', group:'Submitted Data' },
  { key:'overall',      label:'Overall Assessment',  cls:'detail-col', group:'Submitted Data' },
  { key:'benefitQuant', label:'Quantified Benefit (M\\u20ac)', cls:'num', fmt:'money', group:'Submitted Data' },
  { key:'benefitDetails',label:'Benefit Qualitative', cls:'detail-col', group:'Submitted Data' },
  { key:'benefitSource',label:'Benefit Source',      cls:'', group:'Submitted Data' },
  { key:'paybackRaw',   label:'Payback (Raw)',       cls:'', group:'Submitted Data' },
  { key:'problem',      label:'Problem Statement',   cls:'detail-col', group:'Submitted Data' },
  { key:'scope',        label:'Program Scope',       cls:'detail-col', group:'Submitted Data' },
  { key:'impact',       label:'Impact / Cost of Not Doing', cls:'detail-col', group:'Submitted Data' },
  { key:'dependency',   label:'Dependencies',        cls:'detail-col', group:'Submitted Data' },
  // Scoring
  { key:'score',        label:'Merit Score',         cls:'num', group:'Scoring' },
  { key:'raw0',         label:'Ben. Str. (raw)',     cls:'num', fmt:'int', group:'Scoring' },
  { key:'comp0',        label:'Ben. Str. (wtd)',     cls:'num', fmt:'money', group:'Scoring' },
  { key:'raw1',         label:'Priority (raw)',      cls:'num', fmt:'int', group:'Scoring' },
  { key:'comp1',        label:'Priority (wtd)',      cls:'num', fmt:'money', group:'Scoring' },
  { key:'raw2',         label:'Consequence (raw)',   cls:'num', fmt:'int', group:'Scoring' },
  { key:'comp2',        label:'Consequence (wtd)',   cls:'num', fmt:'money', group:'Scoring' },
  { key:'raw3',         label:'Band (raw)',          cls:'num', fmt:'int', group:'Scoring' },
  { key:'comp3',        label:'Band (wtd)',          cls:'num', fmt:'money', group:'Scoring' },
  { key:'raw4',         label:'Payback (raw)',       cls:'num', fmt:'int', group:'Scoring' },
  { key:'comp4',        label:'Payback (wtd)',       cls:'num', fmt:'money', group:'Scoring' },
  { key:'ratio',        label:'Benefit/Cost Ratio',  cls:'num', group:'Scoring' },
  { key:'benefitClass', label:'Benefit Class',       cls:'', group:'Scoring' },
  { key:'benefitFlag',  label:'Benefit Flag',        cls:'', group:'Scoring' },
  // Scenario Outcome
  { key:'cost',         label:'Requested (M\\u20ac)', cls:'num', fmt:'money', group:'Scenario' },
  { key:'final',        label:'Prioritised (M\\u20ac)',cls:'num', fmt:'money', group:'Scenario' },
  { key:'unfunded',     label:'Unfunded (M\\u20ac)',  cls:'num', fmt:'money', group:'Scenario' },
  { key:'automatic',    label:'Automatic (M\\u20ac)', cls:'num', fmt:'money', group:'Scenario' },
  { key:'benefit',      label:'Benefit (M\\u20ac)',   cls:'num', fmt:'money', group:'Scenario' },
  { key:'paybackYears', label:'Payback (yrs)',       cls:'num', group:'Scenario' },
  { key:'stageName',    label:'Lever',               cls:'', group:'Scenario' },
  { key:'rank',         label:'Rank',                cls:'num', group:'Scenario' },
  { key:'status',       label:'Funding Status',      cls:'status-col', group:'Scenario' },
  { key:'reason',       label:'Reason',              cls:'reason-col', group:'Scenario' },
  { key:'eligible',     label:'Eligible',            cls:'', group:'Scenario' },
  // LFR / Evidence
  { key:'lfrTier',      label:'LFR Tier',            cls:'', group:'Evidence' },
  { key:'lfrVerified',  label:'LFR Verified',        cls:'', group:'Evidence' },
  { key:'isBaselinedCarry', label:'Baselined Carry',  cls:'', group:'Evidence' },
  { key:'carryConfirmed',label:'Carry Confirmed',    cls:'', group:'Evidence' },
  { key:'warnings',     label:'Warnings',            cls:'detail-col', group:'Evidence' },
  { key:'holds',        label:'Holds',               cls:'detail-col', group:'Evidence' },
  // Source
  { key:'sourceSheet',  label:'Source Sheet',         cls:'', group:'Source' },
  { key:'sourceRow',    label:'Source Row',            cls:'num', group:'Source' },
];

const OPS_COLS = [
  { key:'serviceId',   label:'Service ID',       cls:'' },
  { key:'name',        label:'Service Name',      cls:'name-col' },
  { key:'dept',        label:'Department',         cls:'' },
  { key:'manager',     label:'Manager',            cls:'' },
  { key:'leader',      label:'Leader',             cls:'' },
  { key:'tbmCategory', label:'TBM Category',       cls:'' },
  { key:'cost2026',    label:'Cost 2026 (M\\u20ac)',cls:'num', fmt:'money' },
  { key:'cost2027',    label:'Cost 2027 (M\\u20ac)',cls:'num', fmt:'money' },
  { key:'delta',       label:'Delta',              cls:'num', fmt:'money' },
  { key:'sourceSheet', label:'Source Sheet',        cls:'' },
  { key:'sourceRow',   label:'Source Row',          cls:'num' },
];

const MONEY_SUM_KEYS_PROG = ['cost','final','unfunded','benefit','benefitQuant','automatic'];
const MONEY_SUM_KEYS_OPS  = ['cost2026','cost2027','delta'];

// ── Helpers ─────────────────────────────────────────────────────────
function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function fmtMoney(v) {
  if (v == null) return '';
  return v.toFixed(1);
}
function fmtInt(v) {
  if (v == null) return '';
  return String(v);
}
function fmtVal(v, col) {
  if (v == null || v === '') return '';
  if (col.fmt === 'money') return fmtMoney(v);
  if (col.fmt === 'int')   return fmtInt(v);
  return String(v);
}
function statusClass(s) {
  if (!s) return '';
  const l = s.toLowerCase();
  if (l === 'funded' || l.includes('funded (pmi')) return 'status-funded';
  if (l === 'partial scope') return 'status-partial';
  if (l === 'not funded')    return 'status-not';
  if (l === 'excluded')      return 'status-excluded';
  return '';
}
function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Table builder ───────────────────────────────────────────────────
function buildTable(tabId, allRows, cols, sumKeys, filterDefs) {
  const headEl  = document.getElementById('head-' + tabId);
  const bodyEl  = document.getElementById('body-' + tabId);
  const footEl  = document.getElementById('foot-' + tabId);
  const filterBar = document.getElementById('filters-' + tabId);
  const countEl = filterBar.querySelector('[data-count]');
  const searchEl = filterBar.querySelector('[data-search]');
  const clearBtn = filterBar.querySelector('[data-clear]');

  // Build header
  let headHtml = '';
  cols.forEach((c, ci) => {
    headHtml += '<th class="' + c.cls + '" data-ci="' + ci + '">'
      + escHtml(c.label) + '<span class="sort-arrow">\\u25B2</span></th>';
  });
  headEl.innerHTML = headHtml;

  // Populate filter dropdowns
  const filterSelects = {};
  filterBar.querySelectorAll('select[data-filter]').forEach(sel => {
    const field = sel.dataset.filter;
    filterSelects[field] = sel;
    const vals = [...new Set(allRows.map(r => r[field] || ''))].filter(Boolean).sort();
    vals.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      sel.appendChild(opt);
    });
  });

  let sortCol = null, sortDir = 1;

  function getFiltered() {
    const active = {};
    for (const [field, sel] of Object.entries(filterSelects)) {
      if (sel.value) active[field] = sel.value;
    }
    const q = (searchEl.value || '').toLowerCase().trim();
    let rows = allRows;
    for (const [field, val] of Object.entries(active)) {
      rows = rows.filter(r => (r[field] || '') === val);
    }
    if (q) {
      rows = rows.filter(r => {
        const hay = ((r.id||'') + ' ' + (r.name||'') + ' ' + (r.org||'')).toLowerCase();
        return hay.includes(q);
      });
    }
    if (sortCol !== null) {
      const key = cols[sortCol].key;
      const isNum = cols[sortCol].cls.includes('num');
      rows = [...rows].sort((a, b) => {
        let va = a[key], vb = b[key];
        if (isNum) {
          va = va == null ? -Infinity : va;
          vb = vb == null ? -Infinity : vb;
          return (va - vb) * sortDir;
        }
        va = String(va || ''); vb = String(vb || '');
        return va.localeCompare(vb, 'en', { numeric: true }) * sortDir;
      });
    }
    return rows;
  }

  function render() {
    const rows = getFiltered();
    let html = '';
    for (const r of rows) {
      html += '<tr>';
      for (const c of cols) {
        let cls = c.cls;
        if (c.key === 'status') cls += ' ' + statusClass(r.status);
        html += '<td class="' + cls + '" title="' + escHtml(r[c.key]) + '">'
          + escHtml(fmtVal(r[c.key], c)) + '</td>';
      }
      html += '</tr>';
    }
    bodyEl.innerHTML = html;

    // Totals
    let footHtml = '';
    cols.forEach(c => {
      if (sumKeys.includes(c.key)) {
        const s = rows.reduce((a, r) => a + (r[c.key] != null ? r[c.key] : 0), 0);
        footHtml += '<td class="num">' + fmtMoney(s) + '</td>';
      } else if (c.key === cols[0].key) {
        footHtml += '<td>Totals (' + rows.length + ')</td>';
      } else {
        footHtml += '<td></td>';
      }
    });
    footEl.innerHTML = footHtml;
    countEl.textContent = rows.length + ' of ' + allRows.length + ' rows';
  }

  // Events
  for (const sel of Object.values(filterSelects)) sel.addEventListener('change', render);
  searchEl.addEventListener('input', render);
  clearBtn.addEventListener('click', () => {
    for (const sel of Object.values(filterSelects)) sel.value = '';
    searchEl.value = '';
    render();
  });

  // Sort
  headEl.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const ci = +th.dataset.ci;
      if (sortCol === ci) sortDir *= -1; else { sortCol = ci; sortDir = 1; }
      headEl.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      th.querySelector('.sort-arrow').textContent = sortDir > 0 ? '\\u25B2' : '\\u25BC';
      render();
    });
  });

  render();
}

// ── Init ──────────────────────────────────────────────────────────
function renderMappings(){
  const M = MAPPINGS;
  let h = '<h2 style="color:var(--dk);margin:0 0 18px">Mappings & Reference Data</h2>';

  // ExCo → Organisation Hierarchy
  h += '<details open class="ref-section"><summary>ExCo Leader → Organisation Hierarchy ('+M.excoHierarchy.length+' leaders, '+Object.keys(M.orgToExco).length+' orgs)</summary>';
  h += '<table class="ref-tbl"><thead><tr><th>ExCo Leader</th><th>Role</th><th>Organisations</th></tr></thead><tbody>';
  M.excoHierarchy.forEach(e => {
    h += '<tr><td><b>'+esc(e.exco)+'</b></td><td>'+esc(e.role)+'</td><td>'+e.orgs.map(o=>esc(o)).join(', ')+'</td></tr>';
  });
  h += '</tbody></table></details>';

  // Organisation Name Normalizations
  const renames = Object.entries(M.orgRename);
  if(renames.length){
    h += '<details class="ref-section"><summary>Organisation Name Normalizations ('+renames.length+' mappings)</summary>';
    h += '<table class="ref-tbl"><thead><tr><th>Source Name</th><th>Normalized To</th></tr></thead><tbody>';
    renames.forEach(([from,to]) => { h += '<tr><td>'+esc(from)+'</td><td><b>'+esc(to)+'</b></td></tr>'; });
    h += '</tbody></table></details>';
  }

  // Platform Normalizations
  const platNorm = Object.entries(M.platformNorm);
  if(platNorm.length){
    h += '<details class="ref-section"><summary>Platform / Charge Code Normalizations ('+platNorm.length+' mappings)</summary>';
    h += '<table class="ref-tbl"><thead><tr><th>Source Platform Name</th><th>Normalized To</th></tr></thead><tbody>';
    platNorm.forEach(([from,to]) => { h += '<tr><td>'+esc(from)+'</td><td><b>'+esc(to)+'</b></td></tr>'; });
    h += '</tbody></table></details>';
  }

  // Funding Stages / Levers
  h += '<details class="ref-section"><summary>Funding Stages (Levers) — Priority Order</summary>';
  h += '<table class="ref-tbl"><thead><tr><th>#</th><th>Lever Name</th><th>Description</th></tr></thead><tbody>';
  M.stages.forEach((s,i) => {
    const desc = ['Legal, fiscal, regulatory & compliance programs — must-fund','Carry-over programs with verified prior-year commitment','Sustain engineering, hygiene, and platform maintenance','Value-based portfolio — merit-ranked discretionary','IT Simplification — decommissioning & replatforming'][i]||'';
    h += '<tr><td>'+(i+1)+'</td><td><b>'+esc(s)+'</b></td><td>'+esc(desc)+'</td></tr>';
  });
  h += '</tbody></table></details>';

  // Merit Score Weights
  h += '<details class="ref-section"><summary>Merit Score Components & Weights (Total 100)</summary>';
  h += '<table class="ref-tbl"><thead><tr><th>Component</th><th>Max Raw</th><th>Weight (%)</th></tr></thead><tbody>';
  var maxRaw = [50,25,15,10,10];
  M.scoreComponents.forEach((c,i) => {
    h += '<tr><td>'+esc(c)+'</td><td>'+maxRaw[i]+'</td><td><b>'+M.scoreWeights[i]+'</b></td></tr>';
  });
  h += '<tr style="font-weight:700;background:var(--mist)"><td>Total</td><td>110</td><td>100</td></tr>';
  h += '</tbody></table></details>';

  // Optimal Scenario Settings
  h += '<details class="ref-section"><summary>Optimal Scenario Default Conditions</summary>';
  h += '<table class="ref-tbl"><thead><tr><th>Parameter</th><th>Preset Value</th><th>Resolved Value</th><th>Description</th></tr></thead><tbody>';
  var cs = M.currentSettings;
  var rows = [
    ['Total AOP Budget', cs.budget+' M\\u20ac', cs.budget+' M\\u20ac', 'Total program investment envelope'],
    ['Lever 1: Legal & Compliance', 'Auto-fit ('+M.optimalPreset.lfr.pct+'%)', Math.round(cs.lfr.pct*10)/10+'% of bucket', 'Verified LFR programs funded first'],
    ['Lever 2: Carry Over', 'Auto-fit', cs.carry.amount ? cs.carry.amount.toFixed(1)+' M\\u20ac ('+Math.round(cs.carry.pct*10)/10+'%)' : cs.carry.pct+'%', 'Carry-over with verified evidence'],
    ['Lever 3: Sustain Engineering', M.optimalPreset.sustain.amount+' M\\u20ac fixed', cs.sustain.amount+' M\\u20ac', 'Fixed sustain envelope'],
    ['Lever 4: Value Portfolio', 'Auto-ceiling', Math.round(cs.value.pct*10)/10+'% of bucket', 'Merit-ranked residual envelope'],
    ['IT Simplification', cs.itsimpMode?'ON':'OFF', '0 M\\u20ac', 'Decomm/replatforming programs (toggle)'],
    ['Merit Floor', cs.merit, cs.merit, 'Minimum score for Value eligibility'],
    ['Tolerance', cs.tolerance, cs.tolerance, 'Budget rounding tolerance']
  ];
  rows.forEach(r => { h += '<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>'; });
  h += '</tbody></table></details>';

  // LFR ExCo Decisions
  if(M.lfrDecisionCount > 0){
    h += '<details class="ref-section"><summary>LFR ExCo Decisions ('+M.lfrDecisionCount+' programs reviewed)</summary>';
    h += '<table class="ref-tbl"><thead><tr><th>Program ID</th><th>ExCo Leader</th><th>Decision</th></tr></thead><tbody>';
    Object.entries(M.lfrDecisions).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([id,d]) => {
      var cls = d.opt==='in'?'color:var(--funded)':'color:var(--not-funded)';
      h += '<tr><td>'+esc(id)+'</td><td>'+esc(d.exco)+'</td><td style="'+cls+';font-weight:600">'+(d.opt==='in'?'Opt In':'Opt Out')+'</td></tr>';
    });
    h += '</tbody></table></details>';
  }

  h += '<p style="margin-top:24px;font-size:.82rem;color:var(--subtle)">Engine version: '+esc(M.version)+' | Source: AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.1.html</p>';
  document.getElementById('ref-content').innerHTML = h;
}

document.addEventListener('DOMContentLoaded', () => {
  buildTable('bu',  BU_ROWS,  PROG_COLS, MONEY_SUM_KEYS_PROG);
  buildTable('ew',  EW_ROWS,  PROG_COLS, MONEY_SUM_KEYS_PROG);
  buildTable('ops', OPS_ROWS, OPS_COLS,  MONEY_SUM_KEYS_OPS);
  renderMappings();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
});
</script>
</body>
</html>`;

// ── 7. Write output ────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, htmlOutput, 'utf-8');
console.log(`Wrote ${(htmlOutput.length/1024).toFixed(0)} KB → ${OUTPUT}`);
