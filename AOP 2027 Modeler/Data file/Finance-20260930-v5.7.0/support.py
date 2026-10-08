from pathlib import Path
import re,json
D=Path(__file__).parent;ROOT=Path(r'C:\Users\320126040\Documents\Codex\AOP2027');S=D/'support';S.mkdir(exist_ok=True)
def put(rel,text):
 p=S/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf8')
finance='''# Finance calculation module | v5.7.0 | 30 September 2026

This release implements the user's confirmed EW allocation and supersedes earlier contradictory finance assumptions.

Programs source: AOP 2027 Consolidated Live 299262020.xlsx. Operations source: Updated - Preliminary AOP2027 Bill of IT for BU_R_F - 23.Sep.xlsx. Preserve original bytes, cached values, formulas and SHA-256.

Active Programs demand: 433 records, 285.2129 M€ including 5.19 M€ PMI. Nine missing-request and four uninterpretable-decision records are excluded from active demand, retained in audit. BU row 276 Enterprise-wide charging is a key only; its 40 M€ is never demand.

Default: 100 M€ Optimal budget, verified LFR share, confirmed carry at min(request, approved baseline), Sustain 60% bucket, Value residual, optional IT Simplification inactive. No carry ROI threshold. Benefits are accepted without benefit-only holds. Other decision/condition/merit rules apply.

Funding and allocation are separate. AOP.solve determines final funding; AOP.finance applies source recipient percentages. Single BU, Cross BU and Indirect Cross BU each use their row's exact spend-allocation fractions. Never replace the recipient with requesting organization or silently normalize an incomplete BU vector. Retain remainder as Unallocated.

For EW, BU row 276 fractions sum to 0.001. The user-confirmed scale is 1,000. Preserve exact 22.630331753554522% Not allocated. Accept a future vector totaling 1 without scaling; other totals are exceptions. EW charge per recipient = final EW funding × corrected fraction. Retain original Function/Region as accountable origin.

Operations uses seven top-level recipient clusters: own 320.2580966319628 M€, Regions 63.46138536119617 M€, Functions 86.59498104535324 M€. Total 470.3144630385122 M€. All 182 services and 36 consumer organizations reconcile. Do not add sender costs again or apply the EW key to Operations.

PMI is funded on top and not charged to BU. Total IT = base Programs + PMI + Operations. Default = 99.963 + 5.19 + 470.3144630385122 = 575.4674630385122 M€. EW 49.716; BU Led 50.247. Unallocated = EW 11.250895734597165 + explicit BU 1.357 + Bu-06 remainder 0.465 = 13.072895734597165 M€.

Finance ledger drives the allocation UI, CSV and Excel summaries. Retain source hash, sheet, row, request/baseline/key cells, source request, scenario request, funded amount, fraction, recipient and charge. Original formulas are in the source snapshot. Display rounds upward to one decimal; calculation/export retain precision.

Scenario request and merit edits are overlays. Merit override requires rationale and 0–100. ExCo trade-offs only affect P4/P5 in the active F&R or BU stream, preserve the budget, select whole Programs by merit and log decisions. Whole-program reductions may exceed the target reduction. Manual overspend remains visible. New Working Version forks and retains decisions; New Scenario resets.

Validation: ten scenarios, independent original-workbook calculation, actual browser exports, source refresh protection, persistence, portable recovery, finalization, 22 extract datasets and 649 column filters. See AOP 2027 Modeler/QA-report.html and Finance-20260930-v5.7.0 audit evidence. Technical conformance is separate from accepted or unresolved unallocated source balances.
'''
put('Skills/references/finance-cost-impact.md',finance)
policy='''# Decision policy | v5.7.0 | 30 September 2026

The current user-approved rules supersede prior threshold and benefit-hold guidance. Use assets/engine.js as executable authority and finance-cost-impact.md for allocation.

P1 includes must-do decisions, LFR name/year evidence or CCB exceptions EW-11/EW-65/EW-71; verified demand is preferred and determines Optimal LFR share. P2 contains remaining Carry Over demand; confirmed baseline >0 and Must Do/Must Have is eligible for funding at min(request, baseline), with no ROI threshold. P3 contains Change & Sustain, Continuous Improvement, and Upgrades & Enhancements. Remaining demand is P4; optional P5 separates Decommissioning & Replatforming when activated.

Default budget is 100 M€, Sustain 60% bucket, Value residual and P5 inactive. P1/P3/P4/P5 support bucket %, budget %, or absolute M€. Automatic allocation uses whole Programs, no tolerance by default. Skip a request that cannot fit and try the next. For confirmed carry, budget fit uses the approved funding cap, not full requested demand.

Benefit data is validated and contributes to prioritization without a benefit-only hold. Do not reject high ratios. Retain merit floor 45 and non-benefit source-decision/condition eligibility. Missing requests and Excel-error/numeric-zero source decisions are excluded from active scope but preserved in audit. Blank decisions remain Unassessed; do not infer must-do status.

Merit uses weights [40,25,15,10,10] for benefit, priority, captured consequence, decision band, payback. Quantitative benefit ratios, source benefit text and consequence evidence retain established scoring tiers. Submitted benefits are lifetime amounts, not annual realized savings. Preserve Hard and Soft separation.

F&R and BU Led are independently editable parts of one scenario. Scenario request/merit overlays retain original data; merit override requires rationale. Manual inclusion, exclusion and partial amounts apply after automatic selection, with no silent refill. Manual additions may exceed budget and must display the excess. Trade-off Apply/Revert is scoped to its active stream and logs decisions; it never changes the total budget.

PMI is funded on top, separate from the base budget and BU charge. Confirmed EW key allocation preserves 22.6303317536% unallocated; do not treat 40 M€ as demand.

Finalise from One Portfolio after changed-source decisions are resolved. New Working Version creates a draft fork, preserves settings/reviews/decisions and records parent lineage. New Scenario resets to Optimal. No external handoff or submission is required by this release.
'''
put('Skills/references/decision-policy.md',policy)
for rel in ['Skills/SKILL.md','Skills/references/data-contract.md','Skills/references/dashboard-design.md','Skills/references/prioritization-guardrails.md','Memory/AOP2027-Demand-Context.md','PROJECT_INDEX.md','AOP 2027 Modeler/CHANGELOG.md']:
 text=(ROOT/rel).read_text(encoding='utf8')
 if rel=='Skills/SKILL.md':
  text=re.sub(r'\b[Pp]rogrammes?\b','Programs',text).replace('carry RoI threshold','confirmed carry baseline cap without ROI threshold')
  text=text.replace('Engine v5.2.0','Engine v5.7.0')
  text=text.replace('Classification is deterministic and data-driven. P1 requires LFR compliance name AND year (or CCB exception ID). P2 requires Carry Over Baselined > 0 AND Must Do/Must Have.','Classification is deterministic and data-driven. P1 includes must-do decisions, LFR evidence or CCB exceptions. P2 includes remaining Carry Over demand; automatic funding requires positive approved baseline and Must Do/Must Have.')
  text=text.replace('Keep missing evidence visible. Never substitute zero for missing requests or benefits. Missing whitespace-only cells count as missing.','Preserve missing evidence in audit. Exclude missing requests and uninterpretable source decisions from active demand; never substitute zero. Validated benefits remain eligible for prioritization.')
  text+='\n## Current finance release\n\nv5.7.0 implements the approved charging key and finance ledger. Follow references/finance-cost-impact.md and the current decision-policy.md. The approved 22.6303317536% EW unallocated share is retained.\n'
 else:
  addition='''# Current release — v5.7.0, 30 September 2026

This section supersedes contradictory historical guidance below. Current build: AOP 2027 Modeler/AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.0.html. Current PRD and detailed requirements: PRD/*-v5.7.0.docx. QA and detailed comparisons are in AOP 2027 Modeler/QA-report.html and Detailed-data-comparison.html, with reproducible evidence in Data file/Finance-20260930-v5.7.0.

433 active Programs; demand 285.2129 M€ including 5.19 PMI. Default 100 M€ Optimal funds 99.963 M€ base, plus PMI and 470.314463 M€ Operations = 575.467463 M€. BU row 276 is a charging key only; exclude 40 M€. Correct its fraction vector by the confirmed 1,000 factor and retain 22.6303317536% unallocated. All Programs types use source recipient fractions; Operations retains own/Region/Function allocation without duplicate sender costs.

Confirmed carry uses approved baseline cap with no ROI threshold. Benefits accepted without benefit-only holds. Nine missing-request and four invalid-decision rows are audit-only. F&R/BU request and merit edits preserve source data; ExCo trade-offs are isolated by stream. The shared finance ledger drives UI/export reconciliation. Data extract supports every column in 22 datasets. No formal external handoff is required. Unallocated balances are explicitly disclosed in QA.

---

## Historical context (superseded where inconsistent above)

'''
  text=addition+text
 put(rel,text)
put('Skills/assets/engine.js',(D/'engine.js').read_text(encoding='utf8'))
print('Prepared',len(list(S.rglob('*.*'))),'support files')
