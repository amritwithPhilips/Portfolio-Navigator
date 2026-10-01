const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, TabStopType, TabStopPosition } = require('docx');
const fs = require('fs');

const BLUE = '00126E';
const LIGHT = '0B5ED7';
const GRAY = '4A5568';
const WHITE = 'FFFFFF';
const LTBG = 'EAF4FF';

const b = (text, opts = {}) => new TextRun({ text, bold: true, font: 'Calibri', size: 22, ...opts });
const t = (text, opts = {}) => new TextRun({ text, font: 'Calibri', size: 22, ...opts });
const it = (text, opts = {}) => new TextRun({ text, italics: true, font: 'Calibri', size: 22, color: GRAY, ...opts });

const hdr = (text, level) => new Paragraph({ heading: level, children: [new TextRun({ text, font: 'Calibri', color: BLUE, bold: true })] });
const p = (...runs) => new Paragraph({ spacing: { after: 120 }, children: runs });
const bullet = (...runs) => new Paragraph({ spacing: { after: 80 }, bullet: { level: 0 }, children: runs });
const bullet2 = (...runs) => new Paragraph({ spacing: { after: 60 }, bullet: { level: 1 }, children: runs });

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.w || 2000, type: WidthType.DXA },
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 20, bold: !!opts.bold, color: opts.color || '000000' })] })],
  });
}

function headerCell(text, w) {
  return new TableCell({
    width: { size: w || 2000, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BLUE },
    children: [new Paragraph({ children: [b(text, { color: WHITE, size: 20 })] })],
  });
}

const colW = [3200, 6800];
const tblW = colW.reduce((a, b) => a + b, 0);

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [
        { level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } },
        { level: 1, format: 'bullet', text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 180 } } } },
      ],
    }],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 } } },
    children: [
      hdr('AOP 2027 Modeler — Product Requirements Document', HeadingLevel.HEADING_1),
      p(b('Version 5.7.1  |  1 October 2026  |  Carry Over ROI Lever + ExCo LFR Decisions + Budget Allocation Fix')),
      p(t('This PRD supersedes v5.7.0 and its addenda for all prioritization, funding, lever, and cost allocation logic. Source data contract, session schema, and export formats are unchanged. All numeric references below are computed from live source data; no fixed values are embedded.')),

      // ─── 1. PRODUCT SCOPE ───
      hdr('1. Product Scope', HeadingLevel.HEADING_2),
      p(t('Standalone offline HTML. Six tabs. Engine version derived from '), b('VERSION'), t(' constant. Session schema 4 (5 merit weights). Total AOP budget is user-configurable via the Tab 2 input field; default is the value set in '), b('defaults().budget'), t('.')),
      p(t('Source authority: the demand workbook loaded at build time. Record count, demand totals, and Operations snapshot are computed from the embedded data and update on source refresh.')),

      // ─── 2. FIVE-LEVER FUNDING MODEL ───
      hdr('2. Five-Lever Funding Model', HeadingLevel.HEADING_2),
      p(t('Every non-PMI demand row is assigned to exactly one of five stages by the '), b('stage(r)'), t(' function. Funding flows in strict sequential order: Lever 1 → Lever 2 → Lever 3 → Lever 4 → Lever 5. Each lever has a target that caps its stage allocation. Residual budget after a lever passes to the next.')),
      p(b('Budget constraint: '), t('The sum of all lever allocations must equal the Total AOP budget. The solve engine enforces this — programs are funded as whole units in score/ROI order until the budget is consumed. No lever can exceed the residual budget available after prior levers.')),

      hdr('2.1 Lever 1 — Legal and Compliance (Must Do)', HeadingLevel.HEADING_3),
      bullet(t('Stage assignment: CCB exceptions (hardcoded IDs), records with LFR evidence (name + year), or overall decision containing "must-do".')),
      bullet(t('Ranking: Verified LFR first (evidence present and no ExCo opt-out), then by tier (Immediate > Scheduled > CCB > Other), then by merit score descending.')),
      bullet(t('ExCo LFR decisions: Programs with an opt-out decision in '), b('LFR_EXCO_DECISIONS'), t(' are marked '), b('lfrVerified = false'), t(' regardless of source evidence. They rank below verified programs. At 100% slider, they are funded. At the auto-verified percentage (default), they are deprioritized.')),
      bullet(t('Auto-verified default: '), b('autoLfrPct()'), t(' computes verified demand / total LFR demand as the default percentage. This excludes opt-out programs from the verified pool.')),
      bullet(t('Slider modes: % of bucket demand, % of Total AOP, Allocation (M€). All three are interconvertible via '), b('switchBasis()'), t('.')),
      bullet(t('ExCo feedback is displayed as a warning on each opt-out program: "ExCo LFR opt-out: [leader] — [feedback]". Visible in program detail popup as '), b('ExCo LFR Opt-Out (deprioritised)'), t(' rationale type.')),

      hdr('2.2 Lever 2 — Carry Over Demand', HeadingLevel.HEADING_3),
      bullet(t('Stage assignment: '), b('newCarry === "carry over"'), t('.')),
      bullet(t('Ranking: All carry-over programs ranked by '), b('ROI (benefit / cost ratio)'), t(' descending. Ties broken by merit score. No special treatment for confirmed baselines in ranking order.')),
      bullet(t('Funding cap: Confirmed baselines (baselined > 0 and priority is must-do/must-have) are funded at '), b('min(requested, approved baseline)'), t('. Non-baseline carry-overs use full requested amount.')),
      bullet(t('All carry-over programs are eligible — no hold for "unconfirmed baseline".')),
      bullet(t('Auto-carry default: '), b('autoCarryAmt()'), t(' computes the total confirmed carry demand and sets the lever to that amount. This funds baseline carry-overs by default.')),
      bullet(t('Slider modes: % of bucket demand, % of Total AOP, Allocation (M€).')),

      hdr('2.3 Lever 3 — Sustain Engineering and Hygiene', HeadingLevel.HEADING_3),
      bullet(t('Stage assignment: '), b('newCarry === "change & sustain"'), t(' or category is Continuous Improvement / Upgrades & Enhancements.')),
      bullet(t('Ranking: Change & Sustain programs first, then CI/Upgrades; within each group by merit score descending.')),
      bullet(t('Default: 60% of bucket demand (Optimal preset).')),
      bullet(t('Slider modes: % of bucket demand, % of Total AOP, Allocation (M€).')),

      hdr('2.4 Lever 4 — Value Based Portfolio', HeadingLevel.HEADING_3),
      bullet(t('Stage assignment: All remaining programs not assigned to Levers 1–3 or 5.')),
      bullet(t('Ranking: Merit score descending. Programs below the merit floor setting receive a hold and are not auto-funded.')),
      bullet(t('Budget: Residual after Levers 1–3 minus any IT Simplification reserve. '), b('valueTarget()'), t(' = min(residual − itsimpReserve, target × (1 + tolerance)).')),
      bullet(t('Default: 100% of bucket demand. The solver naturally caps allocation at the available residual.')),
      bullet(t('Decomm/Replatform programs: Programs with category containing "decomm" or "replatform" are flagged '), b('isItSimp = true'), t(' and scored alongside all Value demand. They participate in normal merit-based prioritization.')),
      bullet(t('Slider modes: % of bucket demand, % of Total AOP, Allocation (M€). The slider range shows 0–100% but the actual funding is constrained by the residual budget.')),

      hdr('2.5 Lever 5 — IT Simplification', HeadingLevel.HEADING_3),
      bullet(t('Activation: Toggled via the IT Simplification checkbox. Disabled by default.')),
      bullet(t('Stage assignment: When enabled, programs in Value stage (stage 3) with '), b('isITSimpProgram(r) === true'), t(' (category contains "decomm" or "replatform") move to stage 4.')),
      bullet(b('Decomm scoring in L4'), t(': When IT Simp is OFF, Decomm programs participate in L4 merit-based prioritization alongside all Value demand. They compete on the same scoring criteria. If funded, they consume L4 budget.')),
      bullet(b('Split on toggle-on'), t(': When IT Simp is toggled ON, Decomm demand that was funded in L4 moves to L5. L5 pre-populates with that funded amount. Example: if L4 residual is R and D of that was Decomm, then after split L4 = R−D (non-Decomm), L5 = D (Decomm funded).')),
      bullet(b('L5 budget source'), t(': L5 draws from the same residual as L4. Increasing L5 reduces L4 available budget. L4 + L5 combined never exceed the residual after L1–L3.')),
      bullet(b('User can increase L5'), t(': Moving the L5 slider above the pre-populated amount funds additional Decomm programs, reducing L4 proportionally.')),
      bullet(t('Slider modes: % of bucket demand, % of Total AOP, Allocation (M€).')),

      hdr('2.6 L4 Ceiling and Range', HeadingLevel.HEADING_3),
      bullet(t('The L4 slider shows the full 0–100% range. The user can set any percentage.')),
      bullet(t('The solve engine caps L4 at the residual: '), b('valueTarget() = min(residual − itsimpReserve, target)'), t('. Setting L4 above the residual has no additional effect — the solver funds programs up to what the budget allows.')),
      bullet(t('The effective ceiling changes dynamically: reducing L1/L2/L3 increases the L4 ceiling; increasing them reduces it.')),
      bullet(t('The allocation selection text shows the actual funded amount and percentage, making the effective ceiling visible.')),
      bullet(t('A subtle red tick on the slider grid marks the ceiling position. The slider shows the full 0–100% range but dragging is clamped at the ceiling — the user cannot pull the slider beyond what the budget allows.')),
      bullet(t('The ceiling value is stored as '), b('data-ceiling'), t(' on the slider and numeric input. Both the drag handler and the numeric input enforce the clamp.')),
      bullet(t('The default L4 setting equals the ceiling via '), b('autoValueCeiling()'), t('. On new session or preset, L4 auto-sets to the available budget percentage.')),
      bullet(t('All levers default to "% of bucket demand" basis for visual consistency. Carry Over auto-computes its default percentage from confirmed baseline demand.')),
      bullet(t('IT Simplification renamed from "IT Simplification Lever" to "IT Simplification". L5 defaults to % of bucket demand basis.')),
      bullet(t('Portfolio Inclusion Table sorted by Hard Benefits (high to low) by default.')),

      new Paragraph({ children: [new PageBreak()] }),

      // ─── 3. LEVER CASCADE RULES ───
      hdr('3. Lever Cascade and Budget Enforcement', HeadingLevel.HEADING_2),
      p(b('Rule: '), t('Levers are processed in strict order 1 → 2 → 3 → 4 → 5. The total allocation always equals the Total AOP budget (within whole-program granularity). Changing an upstream lever adjusts downstream allocations automatically.')),

      hdr('3.1 Residual Budget Flow — L4 as Sole Absorber', HeadingLevel.HEADING_3),
      p(b('Core rule: '), t('L4 (Value) is the sole residual absorber. When any upstream lever changes, L1/L2/L3 retain their settings. Only L4 adjusts: L4 allocation = budget − L1 funded − L2 funded − L3 funded.')),
      bullet(b('residual()'), t(' = budget × (1 + tolerance%) − spent[L1] − spent[L2] − spent[L3]')),
      bullet(b('valueTarget()'), t(' = min(residual − itsimpReserve, L4 target × (1 + tolerance%))')),
      bullet(t('L5 reserve = min(L5 target, L5 demand) when IT Simplification is active, else 0.')),
      bullet(t('Increasing L1 reduces what L4 receives. L2 and L3 are unaffected.')),
      bullet(t('Increasing L2 reduces what L4 receives. L1 and L3 are unaffected.')),
      bullet(t('Increasing L3 reduces what L4 receives. L1 and L2 are unaffected.')),
      bullet(t('Decreasing any upstream lever releases budget to L4 automatically.')),
      bullet(t('No proportional scaling of intermediate levers. Each lever operates independently at its user-set target.')),

      hdr('3.2 Excluded Programs', HeadingLevel.HEADING_3),
      bullet(t('Programs with a manual exclude override are skipped at the top of the funding loop ('), b('continue'), t('). They do not consume budget, do not increment '), b('spent[]'), t(', and do not appear in the automatic allocation.')),
      bullet(t('This ensures excluded programs release their budget for downstream stages.')),

      hdr('3.3 Preset Defaults', HeadingLevel.HEADING_3),
      p(t('Each preset sets lever percentages. The budget field is unchanged by presets — only manual user edit changes it.')),

      new Table({
        columnWidths: [2400, 1600, 1600, 1600, 1600, 1200],
        rows: [
          new TableRow({ children: [headerCell('Preset', 2400), headerCell('L1 LFR', 1600), headerCell('L2 Carry', 1600), headerCell('L3 Sustain', 1600), headerCell('L4 Value', 1600), headerCell('L5 IT Simp', 1200)] }),
          new TableRow({ children: [cell('Optimal Segmentation', { w: 2400, bold: true }), cell('Auto-verified %', { w: 1600 }), cell('Auto baseline M€', { w: 1600 }), cell('60% bucket', { w: 1600 }), cell('100% bucket', { w: 1600 }), cell('Off', { w: 1200 })] }),
          new TableRow({ children: [cell('Protect Commitments', { w: 2400, bold: true }), cell('100% bucket', { w: 1600 }), cell('100% bucket', { w: 1600 }), cell('100% bucket', { w: 1600 }), cell('10% AOP', { w: 1600 }), cell('Off', { w: 1200 })] }),
          new TableRow({ children: [cell('Balance Sustain & Value', { w: 2400, bold: true }), cell('100% bucket', { w: 1600 }), cell('100% bucket', { w: 1600 }), cell('75% bucket', { w: 1600 }), cell('15% AOP', { w: 1600 }), cell('Off', { w: 1200 })] }),
          new TableRow({ children: [cell('Release Sustain Capacity', { w: 2400, bold: true }), cell('44% bucket', { w: 1600 }), cell('75% bucket', { w: 1600 }), cell('75% bucket', { w: 1600 }), cell('20% AOP', { w: 1600 }), cell('Off', { w: 1200 })] }),
        ],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ─── 4. MERIT SCORING ───
      hdr('4. Merit Scoring Framework', HeadingLevel.HEADING_2),
      p(t('Composite 0–100 score. Formula: Score = Σ(raw_i / max_i × weight_i). Weights must sum to 100.')),

      new Table({
        columnWidths: [3000, 1500, 1500, 4000],
        rows: [
          new TableRow({ children: [headerCell('Component', 3000), headerCell('Max Raw', 1500), headerCell('Default Weight', 1500), headerCell('Scoring Rule', 4000)] }),
          new TableRow({ children: [cell('Benefit Strength', { w: 3000 }), cell('50', { w: 1500 }), cell('40%', { w: 1500 }), cell('Quantitative: ratio tiers (0/15/25/35/50). Qualitative fallback from text analysis.', { w: 4000 })] }),
          new TableRow({ children: [cell('Submitted Priority', { w: 3000 }), cell('25', { w: 1500 }), cell('25%', { w: 1500 }), cell('Must Do=25, Must Have=18, Deprioritised=5, else 0.', { w: 4000 })] }),
          new TableRow({ children: [cell('Captured Consequence', { w: 3000 }), cell('15', { w: 1500 }), cell('15%', { w: 1500 }), cell('NLP from Impact/Problem/Scope. Explicit+affected+reach/quant = 15/10/5.', { w: 4000 })] }),
          new TableRow({ children: [cell('Decision Band', { w: 3000 }), cell('10', { w: 1500 }), cell('10%', { w: 1500 }), cell('Healthy=10, Contain=6, else 0.', { w: 4000 })] }),
          new TableRow({ children: [cell('Payback Period', { w: 3000 }), cell('10', { w: 1500 }), cell('10%', { w: 1500 }), cell('≤1yr=10, ≤2yr=8, ≤3yr=6, ≤5yr=4, else 0.', { w: 4000 })] }),
        ],
      }),

      p(it('Merit floor: programs in Lever 4 below the floor setting receive a hold and are not auto-funded.')),

      // ─── 5. COST ALLOCATION ───
      hdr('5. Cost Allocation and Finance Reconciliation', HeadingLevel.HEADING_2),
      p(t('The '), b('finance()'), t(' function produces the Organisation IT Cost Allocation table (Tab 6). It is shared by UI, export, and QA.')),

      hdr('5.1 Program Allocation', HeadingLevel.HEADING_3),
      bullet(b('BU Led'), t(': Type I (Single BU) + Type II (Cross BU) allocations. Each funded program is allocated to recipient organisations using its source spend-allocation percentages.')),
      bullet(b('Functions & Regions'), t(': Type III / Enterprise-wide programs allocated using the confirmed EW charging key. The key is a set of fractions per recipient, corrected by the confirmed scale factor.')),
      bullet(t('Unallocated remainder: if source allocation fractions do not sum to 1.0, the remainder is placed in the Unallocated bucket.')),

      hdr('5.2 Operations Allocation', HeadingLevel.HEADING_3),
      bullet(b('Operations Cost'), t(': Bill of IT TCO per BU cluster. Three sub-buckets: Own Consumption, Region allocation, Functions & CoEs allocation.')),
      bullet(t('Operations are fully allocated to BU clusters. Functions, Regions and CoEs are distributed into BU charges.')),

      hdr('5.3 Consolidated Table (Tab 6)', HeadingLevel.HEADING_3),
      bullet(t('Five columns: Organisation, BU Led (M€), Functions & Regions (M€), Operations Cost (M€), Total IT Charge (M€).')),
      bullet(t('Sorted by total descending. Functions/Regions distributed via Type II keys shown as a separate row.')),
      bullet(b('Grand Total'), t(' = Prioritised Programme AOP + Operations AOP = Total IT AOP.')),
      bullet(t('PMI programs are outside the base budget and tracked separately.')),

      hdr('5.4 Reconciliation', HeadingLevel.HEADING_3),
      bullet(t('Expected total = programme allocation + PMI funded + Operations total.')),
      bullet(t('The finance ledger retains full source precision. Displayed amounts use one decimal place.')),

      new Paragraph({ children: [new PageBreak()] }),

      // ─── 6. ExCo LFR DECISIONS ───
      hdr('6. ExCo LFR Decisions', HeadingLevel.HEADING_2),
      p(t('ExCo members review LFR demand and provide opt-in/opt-out decisions with feedback. These decisions are embedded in '), b('LFR_EXCO_DECISIONS'), t(' and applied during program enrichment.')),

      hdr('6.1 Mechanism', HeadingLevel.HEADING_3),
      bullet(b('Opt-out'), t(': Program is marked '), b('lfrOptOut = true'), t(' and '), b('lfrVerified = false'), t('. It ranks below verified programs in Lever 1. At the auto-verified default, it is deprioritized (not funded in L1). At 100%, it is funded. The program is NOT excluded from the portfolio — it participates in all stages.')),
      bullet(b('Opt-in'), t(': No change to program status. Verification is determined by source evidence.')),
      bullet(b('Feedback'), t(': ExCo feedback text is stored in the decision record and displayed as a warning on the program row and detail popup.')),

      hdr('6.2 Impact on Default Scenario', HeadingLevel.HEADING_3),
      bullet(t('The auto-verified LFR percentage decreases because opt-out programs are removed from the verified pool.')),
      bullet(t('Deprioritized LFR programs still appear in LFR stage but are not funded at the default slider setting.')),
      bullet(t('The user can increase the L1 slider to fund opt-out programs, or decrease to further reduce LFR allocation.')),

      // ─── 7. SOLVE ALGORITHM ───
      hdr('7. Solve Algorithm', HeadingLevel.HEADING_2),
      p(b('solve(data, settings, overrides, reviews)'), t(' is the single deterministic function that computes the scenario. It is called on every setting change and shared by UI, export, and QA.')),

      bullet(b('Step 1'), t(': Enrich all records — compute scores, stage assignment, holds, eligibility, ExCo mapping, benefit classification.')),
      bullet(b('Step 2'), t(': Separate PMI rows (auto-funded on top of budget). Sort non-PMI rows by stage then within-stage ranking.')),
      bullet(b('Step 3'), t(': Compute lever targets from settings and stage demand.')),
      bullet(b('Step 4'), t(': Funding loop — iterate rows in order. For each row:')),
      bullet2(t('If excluded via override → skip (do not consume budget).')),
      bullet2(t('If eligible and fits stage limit and portfolio limit → fund at automatic amount.')),
      bullet2(t('Apply include overrides (manual amounts) after automatic computation.')),
      bullet(b('Step 5'), t(': Compute totals, stage summaries, finance allocation, and reconciliation.')),

      p(it('Key invariant: Total allocation = Σ(r.final for all rows). This equals the Total AOP budget within whole-program granularity. The solve function is pure — same inputs always produce the same output.')),

      // ─── 8. SESSION MIGRATION ───
      hdr('8. Session Migration', HeadingLevel.HEADING_2),
      p(t('Recovered sessions from IndexedDB are migrated automatically on load:')),
      bullet(b('Carry format'), t(': If '), b('settings.carry'), t(' is a number (old ROI threshold), convert to '), b('{basis:"bucket", pct:100}'), t('.')),
      bullet(b('ExCo LFR overrides'), t(': If any override has '), b('note'), t(' starting with "ExCo LFR opt-out", it is removed. These are stale permanent exclusions from a prior build. The current engine uses ranking demotion ('), b('lfrVerified=false'), t(') instead of overrides, so the programs are fundable at higher slider positions.')),
      bullet(b('Merit weights'), t(': 4-element arrays migrated to 5-element [40,25,15,10,10].')),
      p(it('Migration runs once on IDB recovery and shows a toast notification with the count of removed overrides.')),

      // ─── 9. DATA REFRESH ───
      hdr('9. Data Refresh Contract', HeadingLevel.HEADING_2),
      bullet(t('All numeric references in this PRD (demand totals, funded amounts, program counts, lever percentages) are derived from the source data at solve time.')),
      bullet(t('A data refresh triggers re-enrichment and re-solve. Changed records are flagged for review. Overrides on changed records transition to "needs-review" state.')),
      bullet(t('LFR ExCo decisions are matched by program ID. New programs not in the decision set follow standard LFR evidence rules.')),
      bullet(t('The auto-verified LFR percentage and auto-carry baseline amount are recomputed from the refreshed data.')),

      // ─── 10. VERSION HISTORY ───
      hdr('10. Version History', HeadingLevel.HEADING_2),
      new Table({
        columnWidths: [1500, 8500],
        rows: [
          new TableRow({ children: [headerCell('Version', 1500), headerCell('Changes', 8500)] }),
          new TableRow({ children: [cell('5.7.1', { w: 1500, bold: true }), cell('Carry Over ROI lever (3-mode slider). ExCo LFR opt-out as ranking demotion. L4 as sole residual absorber (no downstream proportional scaling). Excluded programs skip budget in solve loop. Session migration removes stale ExCo overrides. Header shows dynamic build time.', { w: 8500 })] }),
          new TableRow({ children: [cell('5.7.0', { w: 1500 }), cell('Finance-led build. Consolidated cost allocation table. IT Simplification lever. Decomm pre-prioritization. Decimal consistency.', { w: 8500 })] }),
          new TableRow({ children: [cell('5.6.x', { w: 1500 }), cell('IT Simplification lever, consistent funding status, Platform header.', { w: 8500 })] }),
          new TableRow({ children: [cell('5.4–5.5', { w: 1500 }), cell('Benefits reclassification, audit trail, data refresh, PMI/allocation fixes.', { w: 8500 })] }),
        ],
      }),

      p(it('End of document. All logic references correspond to functions in the AOP engine module. No fixed numeric values are embedded — all figures derive from the source data and settings at solve time.')),
    ],
  }],
});

const outPath = process.argv[2] || 'AOP2027-Modeler-PRD-v5.7.1.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Written ' + outPath + ' (' + buf.length + ' bytes)');
});
