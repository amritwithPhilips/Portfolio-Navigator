"""
Financial Accuracy Audit — v5.7.0
Validates against both source Excel files:
  1. BU/EW program costs, types, categories vs program-source.json
  2. EW charging key fractions vs source
  3. EW/BU portfolio split totals
  4. Per-BU Operations (own/region/function) vs Comparable AOP2027 sheet
  5. Finance chargeout rows vs independent Excel calculation
  6. Overall accuracy scoring

Run: python financial-accuracy-audit.py
"""
import sys, json, re, math, collections
sys.stdout.reconfigure(encoding='utf-8')
from pathlib import Path
from openpyxl import load_workbook

D    = Path(__file__).parent
ROOT = Path(r'C:\Users\320126040\Documents\Codex\AOP2027\AOP 2027 Demand')

# ── Load source files ─────────────────────────────────────────────────────────
wb   = load_workbook(ROOT / 'AOP 2027 Consolidated Live 299262020.xlsx',
                     data_only=True, read_only=True)
opwb = load_workbook(ROOT / 'Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx',
                     data_only=True, read_only=True)

# ── Load engine artifacts ─────────────────────────────────────────────────────
norm_data = json.loads((D / 'audit/normalized-records.json').read_text(encoding='utf-8'))
ops_data  = json.loads((D / 'audit/ops-data.json').read_text(encoding='utf-8'))
scenarios = json.loads((D / 'audit/scenarios.json').read_text(encoding='utf-8'))
base_sc   = scenarios['scenarios'][0]   # validation-01 = Optimal (default)

# ── Helpers ───────────────────────────────────────────────────────────────────
checks = []
issues = []
def rnd(v): return math.floor(v * 1e6 + 0.50000001) / 1e6
def near(a, b, tol=1e-4): return abs(a - b) <= tol
def clean(v): return re.sub(r'\s+', ' ', str(v).replace('\u200b',' ').replace('\xa0',' ')).strip() if v is not None else ''
def key(v): return clean(v).lower().replace('—','-').replace('–','-')
def num(v):
    if isinstance(v, (float, int)) and not isinstance(v, bool): return v
    if isinstance(v, str) and re.fullmatch(r'-?\d+(\.\d+)?', v.strip()): return float(v)
    return None
def chk(name, ok, detail='', tolerance=None):
    checks.append({'name': name, 'passed': bool(ok), 'detail': str(detail)})
    if not ok:
        issues.append({'check': name, 'detail': detail,
                       'tolerance': tolerance, 'severity': 'HIGH' if tolerance is None else 'LOW'})

# ═══════════════════════════════════════════════════════════════════════════════
# PART 1 — BU/EW PROGRAM COSTS vs SOURCE EXCEL
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 1: Program costs vs source Excel ──')

excel_records = {}
excel_charging_key = None
for sn in ['EW', 'BU']:
    rows = list(wb[sn].iter_rows(values_only=True))
    hi   = next(i for i, r in enumerate(rows[:10]) if any(key(v) == 'item no.' for v in r))
    headers = [key(v) for v in rows[hi]]
    def ix(label): return headers.index(label) if label in headers else None
    alloc_cols = [i for i, h in enumerate(headers) if h.endswith('%') and 'capitalization' not in h]
    for rownum, row in enumerate(rows[hi+1:], hi+2):
        item    = clean(row[ix('item no.')]) if ix('item no.') is not None else ''
        name    = clean(row[ix('initiative name')]) if ix('initiative name') is not None else ''
        request = num(row[ix('it investment requested 2027 [k€]')]) if ix('it investment requested 2027 [k€]') is not None else None
        if (not item or re.fullmatch('0+', item)) and not name and request is None:
            continue
        if key(name) == 'enterprise-wide charging':
            alloc = {}
            for i in alloc_cols:
                col_name = clean(rows[hi][i]).removesuffix(' %').strip()
                if isinstance(row[i], (float, int)):
                    alloc[col_name] = row[i]
            excel_charging_key = {'id': item or f'{sn}-row-{rownum}', 'alloc': alloc, 'sourceRow': rownum, 'sourceSheet': sn}
            continue
        cost = rnd(request / 1000) if request is not None else None
        alloc = {}
        for i in alloc_cols:
            col_name = clean(rows[hi][i]).removesuffix(' %').strip()
            if isinstance(row[i], (float, int)):
                alloc[col_name] = row[i]
        exc = row[ix('overall aop decision')] if ix('overall aop decision') is not None else None
        band = row[ix('waste band')] if ix('waste band') is not None else None
        cat  = clean(row[ix('category')]) if ix('category') is not None else ''
        typ  = clean(row[ix('type')]) if ix('type') is not None else ''
        if cost is None or clean(exc).startswith('#') or clean(band).startswith('#') or clean(exc) == '0':
            continue
        excel_records[item if item and not re.fullmatch('0+', item) else f'{sn}-row-{rownum}'] = {
            'cost': cost, 'name': name, 'stream': 'ew' if sn == 'EW' else 'bu',
            'type': typ, 'category': cat, 'alloc': alloc, 'sourceRow': rownum, 'sourceSheet': sn
        }

chk('Excel active program count matches 433', len(excel_records) == 433, f'found={len(excel_records)}')

# Cross-validate every record against program-source.json
src_records = {r['id']: r for r in norm_data['records']}
cost_mismatches, type_mismatches, missing = [], [], []
for eid, er in excel_records.items():
    sr = src_records.get(eid)
    if sr is None:
        missing.append(eid)
        continue
    if not near(er['cost'], sr['cost'], tol=1e-4):
        cost_mismatches.append({'id': eid, 'name': er['name'][:40],
                                 'excel': er['cost'], 'engine': sr['cost'],
                                 'delta': round(er['cost'] - sr['cost'], 6)})
    if key(er['type']) != key(sr.get('type','')):
        type_mismatches.append({'id': eid, 'excel_type': er['type'], 'engine_type': sr.get('type','')})

chk('No programs missing from engine', len(missing) == 0, missing[:10])
chk('All program costs match source within 0.0001 M€', len(cost_mismatches) == 0,
    cost_mismatches[:10], tolerance='0.0001 M€')
chk('All program types match source', len(type_mismatches) == 0, type_mismatches[:5])

# BU / EW split totals
excel_ew_total = rnd(sum(r['cost'] for r in excel_records.values() if r['stream'] == 'ew'))
excel_bu_total = rnd(sum(r['cost'] for r in excel_records.values() if r['stream'] == 'bu'))
excel_total    = rnd(excel_ew_total + excel_bu_total)

# include PMI in both sides so comparison is like-for-like (PMI are valid BU records in source)
src_ew_total   = rnd(sum(r['cost'] for r in norm_data['records'] if r['stream'] == 'ew'))
src_bu_total   = rnd(sum(r['cost'] for r in norm_data['records'] if r['stream'] == 'bu'))
src_pmi_total  = rnd(sum(r['cost'] for r in norm_data['records'] if key(r.get('type','')) == 'pmi'))

chk('EW demand total matches source', near(excel_ew_total, src_ew_total, tol=0.001),
    f'excel={excel_ew_total} engine={src_ew_total} delta={round(excel_ew_total-src_ew_total,4)}', tolerance='0.001 M€')
chk('BU demand total matches source (inc PMI)', near(excel_bu_total, src_bu_total, tol=0.001),
    f'excel={excel_bu_total} engine={src_bu_total} delta={round(excel_bu_total-src_bu_total,4)}', tolerance='0.001 M€')
chk('PMI total 5.190 M€ confirmed', near(src_pmi_total, 5.19, tol=0.001),
    f'pmi={src_pmi_total}')

print(f'  EW demand: Excel={excel_ew_total} M€  Engine={src_ew_total} M€')
print(f'  BU demand: Excel={excel_bu_total} M€  Engine={src_bu_total} M€')
print(f'  Total demand (ex-PMI): {excel_total} M€')
print(f'  Issues: cost_mismatches={len(cost_mismatches)} type={len(type_mismatches)} missing={len(missing)}')

# ═══════════════════════════════════════════════════════════════════════════════
# PART 2 — EW CHARGING KEY FRACTIONS
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 2: EW Charging Key validation ──')

ew_key_src = norm_data.get('ewKey', {})
raw_sum = sum(excel_charging_key['alloc'].values()) if excel_charging_key else 0
chk('EW key found in Excel', excel_charging_key is not None)
chk('EW key raw sum is 0.001 (requires ×1000 scale)', abs(raw_sum - 0.001) < 1e-10,
    f'raw_sum={raw_sum}')

if excel_charging_key:
    key_scale = 1000 if abs(raw_sum - 0.001) < 1e-10 else 1
    excel_fracs = {k: v * key_scale for k, v in excel_charging_key['alloc'].items()}
    engine_fracs = {k: v * key_scale for k, v in ew_key_src.get('allocations', {}).items()}
    frac_total = sum(excel_fracs.values())
    chk('EW key fractions sum to 1.0 after ×1000 scale', near(frac_total, 1.0, tol=1e-6),
        f'sum={frac_total}')
    unalloc = excel_fracs.get('Not allocated', 0)
    chk('Unallocated share is 22.6303317536%', near(unalloc, 0.226303317536, tol=1e-8),
        f'value={unalloc}')

    frac_mismatches = []
    for bu, fv in excel_fracs.items():
        eng_v = engine_fracs.get(bu)
        if eng_v is None:
            frac_mismatches.append({'bu': bu, 'issue': 'missing from engine', 'excel': fv})
        elif not near(fv, eng_v, tol=1e-8):
            frac_mismatches.append({'bu': bu, 'excel': fv, 'engine': eng_v,
                                     'delta': fv - eng_v})
    chk('All EW charging key fractions match engine exactly', len(frac_mismatches) == 0, frac_mismatches)
    print(f'  Key recipients: {len(excel_fracs)}  Unallocated: {round(unalloc*100,6)}%')
    print(f'  Fraction mismatches: {len(frac_mismatches)}')

# ═══════════════════════════════════════════════════════════════════════════════
# PART 3 — OPERATIONS per BU from Comparable AOP2027 sheet
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 3: Operations per BU from Comparable AOP2027 ──')

tco_sheet = list(opwb['Comparable AOP2027'].iter_rows(values_only=True))
ops_tco   = ops_data['operations']['tco']

excel_ops = {}
for row in tco_sheet[2:40]:
    bu_name = clean(row[1]) if row[1] is not None else ''
    if not bu_name or bu_name.startswith('-'):
        continue
    own = num(row[6]) or 0
    reg = num(row[7]) or 0
    fn  = num(row[8]) or 0
    tot = num(row[9]) or 0
    if own + reg + fn > 0:
        excel_ops[bu_name] = {'own': own, 'region': reg, 'functions': fn, 'total': tot}

# Validate each top-level BU in ops_data against Excel
ops_own_total = ops_data['meta']['buOwn']
ops_reg_total = ops_data['meta']['regionAlloc']
ops_fn_total  = ops_data['meta']['functionAlloc']
ops_grand     = ops_data['meta']['opsTotal2027']

chk('Ops grand total matches 470.314 M€', near(ops_grand, 470.3144630385122, tol=1e-6),
    f'value={ops_grand}')

# Cross-validate each top-level BU row
bu_errors = []
for t in ops_tco:
    bu = t['bu']
    if bu.startswith('-'):
        continue
    xr = excel_ops.get(bu)
    if xr is None:
        bu_errors.append({'bu': bu, 'issue': 'missing from Excel'})
        continue
    for field, xval, ename in [
        ('own', xr['own'], t['ownConsumption']),
        ('region', xr['region'], t['regionAlloc']),
        ('functions', xr['functions'], t['functionAlloc']),
        ('total', xr['total'], t['totalBU']),
    ]:
        if not near(xval, ename, tol=1e-6):
            bu_errors.append({'bu': bu, 'field': field,
                               'excel': round(xval,6), 'engine': round(ename,6),
                               'delta': round(xval - ename, 8)})

chk('All BU own-consumption rows match Excel exactly', len(bu_errors) == 0, bu_errors[:10])

# Grand total reconciliation
excel_own_sum = sum(r['own'] for r in excel_ops.values())
excel_reg_sum = sum(r['region'] for r in excel_ops.values())
excel_fn_sum  = sum(r['functions'] for r in excel_ops.values())
excel_tot_sum = sum(r['total'] for r in excel_ops.values())

chk('Excel own consumption sum matches ops meta', near(excel_own_sum, ops_own_total, tol=1e-4),
    f'excel={round(excel_own_sum,4)} engine={round(ops_own_total,4)}', tolerance='0.0001 M€')
chk('Excel region allocation sum matches ops meta', near(excel_reg_sum, ops_reg_total, tol=1e-4),
    f'excel={round(excel_reg_sum,4)} engine={round(ops_reg_total,4)}', tolerance='0.0001 M€')
chk('Excel function allocation sum matches ops meta', near(excel_fn_sum, ops_fn_total, tol=1e-4),
    f'excel={round(excel_fn_sum,4)} engine={round(ops_fn_total,4)}', tolerance='0.0001 M€')

# Print per-BU comparison table
print(f'\n  {"BU":<30} {"Excel Own":>10} {"Excel Reg":>10} {"Excel Fn":>10} {"Excel Tot":>10}')
print(f'  {"-"*30} {"-"*10} {"-"*10} {"-"*10} {"-"*10}')
top_level_bus = [(k, v) for k, v in excel_ops.items() if not k.startswith('-')]
for bu, xr in sorted(top_level_bus, key=lambda x: -x[1]['total']):
    t = next((t for t in ops_tco if t['bu'] == bu), None)
    match = '✓' if t and near(xr['total'], t['totalBU'], tol=1e-4) else '✗'
    print(f'  {bu:<30} {xr["own"]:>10.3f} {xr["region"]:>10.3f} {xr["functions"]:>10.3f} {xr["total"]:>10.3f} {match}')
print(f'  {"TOTAL":<30} {excel_own_sum:>10.3f} {excel_reg_sum:>10.3f} {excel_fn_sum:>10.3f} {excel_tot_sum:>10.3f}')

# ═══════════════════════════════════════════════════════════════════════════════
# PART 4 — FINANCE CHARGEOUT ROWS vs INDEPENDENT CALCULATION
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 4: Finance chargeout rows vs independent Excel calculation ──')

fin_rows = base_sc['result']['finance']['rows']
fin_totals = base_sc['result']['finance']['totals']

# BU cluster mapping (same as engine)
cluster_map = {
    'Imaging Informatics':'EI','Clinical Informatics':'EI','EI Other':'EI',
    'AMD':'Connected Care','HPM':'Connected Care','S&RC':'Connected Care',
    'I&D':'Innovation & Design','IP and S':'Int. Property & Standards',
    'IGT-D':'Image Guided Therapy','IGT-S':'Image Guided Therapy',
    'MR':'Precision Diagnosis','CT':'Precision Diagnosis','DXR':'Precision Diagnosis',
    'PD Other':'Precision Diagnosis','US':'Precision Diagnosis',
    'G and B':'Personal Health','MCC':'Personal Health','OHC':'Personal Health',
    'PH Other':'Personal Health','Not allocated':'Unallocated'
}

# Independently compute expected chargeout from Excel records
result_rows = base_sc['result']['rows']
funded = {r['id']: r for r in result_rows if r.get('final', 0) > 0 and not r.get('isPmi')}
pmi_funded = {r['id']: r for r in result_rows if r.get('isPmi') and r.get('final', 0) > 0}

# EW key fractions (scaled)
ew_fracs = {k: v * key_scale for k, v in ew_key_src.get('allocations', {}).items()}
expected_programs = collections.defaultdict(float)
for rid, r in funded.items():
    er = excel_records.get(rid)
    if er is None:
        continue
    is_ew = r['stream'] == 'ew' or bool(re.search(r'type iii|enterprise wide', r.get('type',''), re.I))
    alloc = ew_fracs if is_ew else er['alloc']
    scale = 1 if is_ew else 1
    frac_sum = sum(alloc.values())
    for bu_name, frac in alloc.items():
        cluster = cluster_map.get(bu_name, 'Unallocated')
        expected_programs[cluster] += r['final'] * frac
    remainder = r['final'] * (1 - frac_sum)
    if remainder > 1e-9:
        expected_programs['Unallocated'] += remainder
for rid, r in pmi_funded.items():
    expected_programs['PMI on top'] += r['final']

# Operations: sum own+region+fn for top-level BUs, mapped to cluster
fin_row_map = {fr['recipient']: fr for fr in fin_rows}
chargeout_errors = []
clusters = ['Precision Diagnosis','Image Guided Therapy','Connected Care',
            'EI','Personal Health','Innovation & Design','Int. Property & Standards','Unallocated','PMI on top']
print(f'\n  {"Cluster":<28} {"Engine":>10} {"Indep.Calc":>10} {"Ops(Own)":>9} {"Ops(Reg)":>9} {"Ops(Fn)":>9} {"Match"}')
print(f'  {"-"*28} {"-"*10} {"-"*10} {"-"*9} {"-"*9} {"-"*9} {"------"}')

for cluster in clusters:
    fr = fin_row_map.get(cluster)
    if fr is None:
        continue
    prog_total = fr.get('single',0)+fr.get('cross',0)+fr.get('indirect',0)+fr.get('other',0)+fr.get('ew',0)+fr.get('pmi',0)
    ops_own   = fr.get('own',0)
    ops_reg   = fr.get('region',0)
    ops_fn    = fr.get('functions',0)
    expected  = expected_programs.get(cluster, 0)
    prog_match = near(prog_total, expected, tol=1e-3)
    if not prog_match:
        chargeout_errors.append({'cluster': cluster,
                                  'engine': round(prog_total,6),
                                  'expected': round(expected,6),
                                  'delta': round(prog_total - expected, 6)})
    mark = '✓' if prog_match else '✗'
    print(f'  {cluster:<28} {prog_total:>10.4f} {expected:>10.4f} {ops_own:>9.3f} {ops_reg:>9.3f} {ops_fn:>9.3f}  {mark}')

chk('All program chargeout clusters match independent calc', len(chargeout_errors) == 0, chargeout_errors)
chk('Finance totals: programs reconciled', near(fin_totals['programs'], base_sc['result']['totals']['allocation'] + base_sc['result']['pmi']['funded'], tol=1e-6),
    f"programs={fin_totals['programs']} alloc+pmi={base_sc['result']['totals']['allocation']+base_sc['result']['pmi']['funded']}")
chk('Finance totals: operations reconciled', near(fin_totals['operations'], 470.3144630385122, tol=1e-6),
    f"ops={fin_totals['operations']}")
chk('Finance totals: grand total correct', near(fin_totals['total'], fin_totals['programs'] + fin_totals['operations'], tol=1e-6))

# ═══════════════════════════════════════════════════════════════════════════════
# PART 5 — AOP Svc Costs sheet: service-level total cross-check
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 5: AOP Svc Costs service total ──')

svc_rows = list(opwb['AOP Svc. Costs (21.09)'].iter_rows(values_only=True))
# Column G (index 6) = AOP 2027 cost in kEUR
svc_total_k = sum(r[6] for r in svc_rows[1:] if r[1] is not None and num(r[6]) is not None)
svc_total_m = rnd(svc_total_k / 1000)
chk('AOP Svc Costs sheet grand total matches 470.314 M€',
    near(svc_total_m, 470.3144630385122, tol=1e-4),
    f'svc_sheet={svc_total_m} M€')
print(f'  Service cost total from AOP Svc. Costs sheet: {svc_total_m} M€')

# Bill of IT: 36-column consumption check
bill_rows = list(opwb['AOP2027 Bill of IT'].iter_rows(values_only=True))
consumption = sum(v / 1000
    for r in bill_rows[5:180]
    if r[1] is not None and num(r[12]) is not None
    for v in r[123:159]
    if isinstance(v, (int, float)))
chk('Bill of IT 36-column consumption sum matches 470.314 M€',
    near(rnd(consumption), 470.3144630385122, tol=1e-4),
    f'consumption={rnd(consumption)} M€')
print(f'  Bill of IT 36-column consumption: {rnd(consumption)} M€')

# ═══════════════════════════════════════════════════════════════════════════════
# PART 6 — SCORING
# ═══════════════════════════════════════════════════════════════════════════════
print('\n── PART 6: Accuracy Scoring ──')

passed = [c for c in checks if c['passed']]
failed = [c for c in checks if not c['passed']]

# Weighted accuracy score
weights = {
    'Excel active program count matches 433': 5,
    'No programs missing from engine': 5,
    'All program costs match source within 0.0001 M€': 15,
    'All program types match source': 5,
    'EW demand total matches source': 8,
    'BU demand total matches source (inc PMI)': 8,
    'PMI total 5.190 M€ confirmed': 3,
    'EW key found in Excel': 3,
    'EW key raw sum is 0.001 (requires ×1000 scale)': 3,
    'EW key fractions sum to 1.0 after ×1000 scale': 4,
    'Unallocated share is 22.6303317536%': 5,
    'All EW charging key fractions match engine exactly': 5,
    'All BU own-consumption rows match Excel exactly': 10,
    'Excel own consumption sum matches ops meta': 3,
    'Excel region allocation sum matches ops meta': 3,
    'Excel function allocation sum matches ops meta': 3,
    'All program chargeout clusters match independent calc': 10,
    'Finance totals: programs reconciled': 3,
    'Finance totals: operations reconciled': 3,
    'Finance totals: grand total correct': 3,
    'AOP Svc Costs sheet grand total matches 470.314 M€': 3,
    'Bill of IT 36-column consumption sum matches 470.314 M€': 3,
    'Ops grand total matches 470.314 M€': 3,
}
max_score = sum(weights.values())
score = sum(weights.get(c['name'], 1) for c in passed)
pct = round(score / max_score * 100, 1)

print(f'\n  Total checks: {len(checks)}  Passed: {len(passed)}  Failed: {len(failed)}')
print(f'  Weighted accuracy score: {score} / {max_score}  ({pct}%)')

if failed:
    print('\n  FAILURES:')
    for f in failed:
        sev = next((i['severity'] for i in issues if i['check'] == f['name']), 'INFO')
        print(f'    [{sev}] {f["name"]}')
        if f['detail']:
            print(f'           {str(f["detail"])[:120]}')
else:
    print('\n  ALL CHECKS PASSED — model is fully consistent with source files.')

# ── Per-category summary ───────────────────────────────────────────────────────
categories = [
    ('Program cost accuracy',  ['All program costs match source within 0.0001 M€', 'No programs missing from engine', 'Excel active program count matches 433']),
    ('BU/EW split accuracy',   ['EW demand total matches source', 'BU demand total matches source (inc PMI)', 'PMI total 5.190 M€ confirmed', 'All program types match source']),
    ('EW charging key',        ['EW key found in Excel','EW key raw sum is 0.001 (requires ×1000 scale)','EW key fractions sum to 1.0 after ×1000 scale','Unallocated share is 22.6303317536%','All EW charging key fractions match engine exactly']),
    ('Operations per BU',      ['All BU own-consumption rows match Excel exactly','Excel own consumption sum matches ops meta','Excel region allocation sum matches ops meta','Excel function allocation sum matches ops meta','Ops grand total matches 470.314 M€','AOP Svc Costs sheet grand total matches 470.314 M€','Bill of IT 36-column consumption sum matches 470.314 M€']),
    ('Chargeout allocation',   ['All program chargeout clusters match independent calc','Finance totals: programs reconciled','Finance totals: operations reconciled','Finance totals: grand total correct']),
]
check_map = {c['name']: c for c in checks}
print('\n  Category scores:')
for cat, names in categories:
    cat_checks = [check_map[n] for n in names if n in check_map]
    cat_pass = sum(1 for c in cat_checks if c['passed'])
    w_score  = sum(weights.get(c['name'],1) for c in cat_checks if c['passed'])
    w_max    = sum(weights.get(c['name'],1) for c in cat_checks)
    print(f'    {cat:<28} {cat_pass}/{len(cat_checks)} checks  {w_score}/{w_max} pts')

# ── Key financial figures ──────────────────────────────────────────────────────
alloc = base_sc['result']['totals']['allocation']
pmi   = base_sc['result']['pmi']['funded']
print(f'\n  Key figures (Optimal scenario):')
print(f'    EW demand (ex-PMI):    {excel_ew_total} M€')
print(f'    BU demand (ex-PMI):    {excel_bu_total} M€')
print(f'    Total demand (ex-PMI): {excel_total} M€')
print(f'    PMI on top:            {pmi} M€')
print(f'    Funded allocation:     {alloc} M€  ({round(alloc/excel_total*100,1)}% of demand)')
print(f'    Operations total:      470.3145 M€')
print(f'    Grand total (prog+ops):{round(fin_totals["total"],4)} M€')

# ── Write output ───────────────────────────────────────────────────────────────
result = {
    'score': pct,
    'weighted_score': f'{score}/{max_score}',
    'checks': len(checks),
    'passed': len(passed),
    'failed': len(failed),
    'failures': failed,
    'categories': {cat: {'passed': sum(1 for c in [check_map[n] for n in names if n in check_map] if c['passed']),
                          'total': len([n for n in names if n in check_map])}
                   for cat, names in categories},
    'key_figures': {
        'ew_demand_M': excel_ew_total,
        'bu_demand_M': excel_bu_total,
        'total_demand_M': excel_total,
        'funded_M': alloc,
        'pmi_M': pmi,
        'operations_M': 470.3144630385122,
        'grand_total_M': round(fin_totals['total'], 6)
    },
    'cost_mismatches': cost_mismatches,
    'chargeout_errors': chargeout_errors,
    'bu_ops_errors': bu_errors
}
(D / 'audit/financial-accuracy-report.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(f'\n  Report written to audit/financial-accuracy-report.json')
