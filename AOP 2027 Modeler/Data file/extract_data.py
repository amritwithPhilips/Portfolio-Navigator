import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import pandas as pd
import numpy as np

def safe_str(val):
    if pd.isna(val): return ''
    return str(val).strip().replace('\u200b','').replace('\xa0',' ')

def safe_float(val, divisor=1000):
    if pd.isna(val): return 0
    try:
        s = str(val).replace('€','').replace(',','').strip()
        return round(float(s)/divisor, 3)
    except:
        return 0

def safe_benefit(val, divisor=1000):
    if pd.isna(val): return None
    try:
        s = str(val).replace('€','').replace(',','').strip()
        return round(float(s)/divisor, 3)
    except:
        return None

def get_col(df, pattern):
    matches = [c for c in df.columns if pattern in str(c)]
    return matches[0] if matches else None

# === PROGRAM DATA - EW ===
ew = pd.read_excel('C:/Users/320126040/OneDrive - Philips/Download/17926_IT AOP2027 Demand.xlsx', sheet_name='EW', header=0)
ew_records = []
for _, r in ew.iterrows():
    item = r.get('Item No.')
    if pd.isna(item) or str(item).strip() == '': continue
    ew_records.append({
        'id': safe_str(item),
        'planisware': safe_str(r.get('Planisware ID')),
        'org': safe_str(r.get('Organization setting demand [BU, Region, CoE]')),
        'name': safe_str(r.get('Initiative name')),
        'type': safe_str(r.get('Type')),
        'newCarry': safe_str(r.get('New initiative or Carry-over')),
        'category': safe_str(r.get('Category')),
        'platform': safe_str(r.get('Leading IT Platform')),
        'area': safe_str(r.get('Investment Area')),
        'bigBets': safe_str(r.get('Big Bets')),
        'cost': safe_float(r.get('IT Investment Requested 2027 [k\u20ac]')),
        'benefit': safe_benefit(r.get('Quantified Benefits (in K\u20ac)')),
        'roi': safe_str(r.get('RoI')),
        'impact': safe_str(r.get('Impact and Cost of Not Doing')),
        'priority': safe_str(r.get('Priority')),
        'overall': safe_str(r.get('Overall AOP decision')),
        'decisionBand': '',
        'stream': 'ew',
        'lfrYear': safe_str(r.get('LFR & Compliancy year')),
        'lfrName': safe_str(r.get('LFR & Compliancy (Name)')),
        'problem': safe_str(r.get('Problem Statement')) if 'Problem Statement' in ew.columns else '',
        'scope': safe_str(r.get('Scope')) if 'Scope' in ew.columns else '',
    })

# === PROGRAM DATA - Bu ===
bu = pd.read_excel('C:/Users/320126040/OneDrive - Philips/Download/17926_IT AOP2027 Demand.xlsx', sheet_name='Bu', header=3)
bu_records = []
for _, r in bu.iterrows():
    item = r.get('Item No.')
    if pd.isna(item) or str(item).strip() == '': continue

    cost_col = get_col(bu, 'IT Investment') and get_col(bu, 'Requested')
    if not cost_col:
        cost_col = [c for c in bu.columns if 'IT Investment' in str(c) and 'Requested' in str(c)]
        cost_col = cost_col[0] if cost_col else None

    ben_col = get_col(bu, 'Quantified Benefits')
    impact_col = get_col(bu, 'Impact and Cost')
    payback_col = get_col(bu, 'Payback')
    org_col = get_col(bu, 'Organization')
    carry_col = get_col(bu, 'Carry-over') or get_col(bu, 'Carry over')
    cat_col = [c for c in bu.columns if str(c).strip() == 'Category']
    cat_col = cat_col[0] if cat_col else None
    plat_col = get_col(bu, 'Leading IT Platform')
    area_col = get_col(bu, 'Investment Area')
    pri_col = [c for c in bu.columns if str(c).strip() == 'Priority']
    pri_col = pri_col[0] if pri_col else None
    overall_col = get_col(bu, 'Overall AOP decision')
    problem_col = get_col(bu, 'Problem Statement')
    scope_col = get_col(bu, 'Scope')
    band_col = get_col(bu, 'Waste\nband') or get_col(bu, 'band')

    bu_records.append({
        'id': safe_str(item),
        'planisware': safe_str(r.get('Planisware ID')),
        'org': safe_str(r[org_col]) if org_col else '',
        'name': safe_str(r.get('Initiative name')),
        'type': safe_str(r.get('Type')),
        'newCarry': safe_str(r[carry_col]) if carry_col else '',
        'category': safe_str(r[cat_col]) if cat_col else '',
        'platform': safe_str(r[plat_col]) if plat_col else '',
        'area': safe_str(r[area_col]) if area_col else '',
        'bigBets': safe_str(r.get('Big Bets')),
        'cost': safe_float(r[cost_col]) if cost_col else 0,
        'benefit': safe_benefit(r[ben_col]) if ben_col else None,
        'impact': safe_str(r[impact_col]) if impact_col else '',
        'payback': safe_str(r[payback_col]) if payback_col else '',
        'priority': safe_str(r[pri_col]) if pri_col else '',
        'overall': safe_str(r[overall_col]) if overall_col else '',
        'decisionBand': safe_str(r[band_col]) if band_col else '',
        'stream': 'bu',
        'problem': safe_str(r[problem_col]) if problem_col else '',
        'scope': safe_str(r[scope_col]) if scope_col else '',
    })

# === OPERATIONS DATA ===
ops_main = pd.read_excel(
    'C:/Users/320126040/OneDrive - Philips/Download/Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx',
    sheet_name='AOP2027 Bill of IT', header=3)
ops_records = []
for _, r in ops_main.iterrows():
    sid = r.get('Service ID')
    if pd.isna(sid): continue
    c26_col = get_col(ops_main, '2026 Run-Rate') or get_col(ops_main, '2026')
    c27_col = get_col(ops_main, 'AOP2027 estimate')
    ops_records.append({
        'serviceId': safe_str(sid),
        'dept': safe_str(r.get('IT Dept.')),
        'name': safe_str(r.get('Business Service Name')),
        'description': safe_str(r.get('Business Service Description'))[:120],
        'manager': safe_str(r.get('Service Manager')),
        'leader': safe_str(r.get('IT Leader')),
        'tbmType': safe_str(r.get('TBM Taxonomy\nType')),
        'tbmCategory': safe_str(r.get('TBM Taxonomy \nCategory')),
        'tbmName': safe_str(r.get('TBM Taxonomy \nName')),
        'driver': safe_str(r.get('Consumption Driver')),
        'cost2026': round(float(r[c26_col])/1000, 3) if c26_col and pd.notna(r[c26_col]) else 0,
        'cost2027': round(float(r[c27_col])/1000, 3) if c27_col and pd.notna(r[c27_col]) else 0,
    })

# === BU TCO ===
comp = pd.read_excel(
    'C:/Users/320126040/OneDrive - Philips/Download/Frozen Preliminary AOP2027 Bill of IT for BU_R_F - 15.Sep.xlsx',
    sheet_name='Comparable AOP2027', header=None)
tco_records = []
for idx in range(3, min(30, len(comp))):
    bu_name = comp.iloc[idx, 1]
    if pd.isna(bu_name) or str(bu_name).strip() == '': continue
    def fv(col):
        v = comp.iloc[idx, col]
        return round(float(v), 2) if pd.notna(v) and v != '' else 0
    tco_records.append({
        'bu': str(bu_name).strip(),
        'aop2026': fv(2),
        'ownConsumption': fv(6),
        'regionAlloc': fv(7),
        'functionAlloc': fv(8),
        'totalBU': fv(9),
        'deltaVsAOP2026': fv(11),
    })

# === SUMMARY ===
ew_total = sum(r['cost'] for r in ew_records)
bu_total = sum(r['cost'] for r in bu_records)
ops_total_26 = sum(r['cost2026'] for r in ops_records)
ops_total_27 = sum(r['cost2027'] for r in ops_records)
tco_total = sum(r['totalBU'] for r in tco_records)

print(f"EW records: {len(ew_records)}, total: {ew_total:.1f} M")
print(f"Bu records: {len(bu_records)}, total: {bu_total:.1f} M")
print(f"Program total: {ew_total + bu_total:.1f} M")
print(f"Ops services: {len(ops_records)}, 2026: {ops_total_26:.1f} M, 2027: {ops_total_27:.1f} M")
print(f"TCO BUs: {len(tco_records)}, total: {tco_total:.1f} M")

data = {
    'program': {'ew': ew_records, 'bu': bu_records},
    'operations': {'services': ops_records, 'tco': tco_records},
    'meta': {
        'ewTotal': round(ew_total, 1),
        'buTotal': round(bu_total, 1),
        'programTotal': round(ew_total + bu_total, 1),
        'opsTotal2026': round(ops_total_26, 1),
        'opsTotal2027': round(ops_total_27, 1),
        'tcoTotal': round(tco_total, 1),
    }
}

outpath = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/AOP2027-OnePortfolio-Data.json'
with open(outpath, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
print(f"\nWritten to {outpath}")
print(f"Meta: {json.dumps(data['meta'], indent=2)}")
