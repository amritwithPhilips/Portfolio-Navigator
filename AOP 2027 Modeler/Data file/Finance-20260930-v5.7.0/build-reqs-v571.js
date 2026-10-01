const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, PageBreak } = require('docx');
const fs = require('fs');

const BLUE = '00126E'; const WHITE = 'FFFFFF'; const GRAY = '4A5568';
const b = (text, o = {}) => new TextRun({ text, bold: true, font: 'Calibri', size: 22, ...o });
const t = (text, o = {}) => new TextRun({ text, font: 'Calibri', size: 22, ...o });
const it = (text) => new TextRun({ text, italics: true, font: 'Calibri', size: 22, color: GRAY });
const hdr = (text, level) => new Paragraph({ heading: level, children: [new TextRun({ text, font: 'Calibri', color: BLUE, bold: true })] });
const p = (...runs) => new Paragraph({ spacing: { after: 120 }, children: runs });
const bullet = (...runs) => new Paragraph({ spacing: { after: 80 }, bullet: { level: 0 }, children: runs });

function cell(text, o = {}) {
  return new TableCell({ width: { size: o.w || 2000, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Calibri', size: 20, bold: !!o.bold, color: o.color || '000000' })] })] });
}
function hCell(text, w) {
  return new TableCell({ width: { size: w || 2000, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: BLUE },
    children: [new Paragraph({ children: [b(text, { color: WHITE, size: 20 })] })] });
}

const doc = new Document({
  numbering: { config: [{ reference: 'b', levels: [
    { level: 0, format: 'bullet', text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } },
    { level: 1, format: 'bullet', text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 180 } } } },
  ]}]},
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 } } }, children: [
    hdr('AOP 2027 Modeler — Detailed Requirements', HeadingLevel.HEADING_1),
    p(b('Version 5.7.1  |  1 October 2026')),
    p(t('All requirements use variable references. No fixed numeric values. Figures update automatically on source data refresh.')),

    // REQ TABLE
    hdr('Requirement Register', HeadingLevel.HEADING_2),

    new Table({ columnWidths: [1200, 2500, 6300], rows: [
      new TableRow({ children: [hCell('ID', 1200), hCell('Requirement', 2500), hCell('Acceptance Criteria', 6300)] }),

      new TableRow({ children: [cell('REQ-001', {w:1200, bold:true}), cell('Lever 2 standard slider', {w:2500}),
        cell('Carry Over lever renders as 3-mode slider (% bucket, % AOP, M€) matching Levers 1/3/4. No fixed "Baseline cap" display. switchBasis("carry", basis, demand) succeeds for all three modes.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-002', {w:1200, bold:true}), cell('Carry Over ROI ranking', {w:2500}),
        cell('Stage 1 programs sorted by ratio (benefit/cost) descending, ties by score. No special ordering for confirmed baselines. compare() stage 1 branch uses ratio only.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-003', {w:1200, bold:true}), cell('Carry Over eligibility', {w:2500}),
        cell('No hold "No confirmed approved baseline for Carry Over funding". All carry-over programs are eligible if they pass Gate 0 evidence checks. Confirmed baselines capped at min(requested, baselined).', {w:6300})] }),

      new TableRow({ children: [cell('REQ-004', {w:1200, bold:true}), cell('Auto carry default', {w:2500}),
        cell('Optimal preset sets _autoCarry=true. autoCarryAmt() computes confirmed carry demand and sets carry to {basis:"amount", amount:confirmed, pct:confirmed/total*100}. Default funds confirmed baselines only.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-005', {w:1200, bold:true}), cell('ExCo LFR ranking demotion', {w:2500}),
        cell('Opt-out programs: lfrVerified=false regardless of source evidence. They rank below verified in Lever 1. At auto-verified %, they are not funded. At 100%, they are funded. NOT permanently excluded.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-006', {w:1200, bold:true}), cell('ExCo feedback display', {w:2500}),
        cell('Opt-out programs show warning: "ExCo LFR opt-out: {exco} — {feedback}". Detail popup rationaleType shows "ExCo LFR Opt-Out (deprioritised)". Feedback sourced from LFR_EXCO_DECISIONS constant.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-007', {w:1200, bold:true}), cell('Budget fully allocated', {w:2500}),
        cell('Default Optimal scenario total allocation equals settings.budget (within whole-program granularity). Excluded programs skip the funding loop via continue — do not consume spent[] or automatic accumulator.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-008', {w:1200, bold:true}), cell('Lever cascade — L4 sole absorber', {w:2500}),
        cell('Levers processed strictly 1→2→3→4→5. L4 (Value) is the sole residual absorber. When any upstream lever changes, only L4 adjusts. L1/L2/L3 retain their user-set targets independently. No proportional scaling of intermediate levers. Total always matches budget.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-009', {w:1200, bold:true}), cell('Value lever fills budget', {w:2500}),
        cell('L4 default at 100% bucket. valueTarget() = min(residual - itsimpReserve, target). The solver funds programs up to the residual. Slider shows 0-100% range; the engine is the authority on ceiling.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-010', {w:1200, bold:true}), cell('IT Simplification split', {w:2500}),
        cell('When IT Simp OFF, Decomm programs scored in L4 by merit alongside all Value demand. When toggled ON, funded Decomm moves from L4 to L5. L5 pre-populates with the funded Decomm amount. User can increase L5 to fund more Decomm (draws from L4 budget). L4+L5 combined = residual after L1-L3.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-010a', {w:1200, bold:true}), cell('L4 slider range and ceiling', {w:2500}),
        cell('L4 slider shows full 0-100% range. Drag clamped at ceiling via data-ceiling attribute on slider and numeric input. Red tick on grid marks ceiling. Default L4 = ceiling via autoValueCeiling(). Ceiling shifts when upstream levers change. All levers default to "% of bucket demand". IT Simplification renamed, L5 defaults to bucket %. Portfolio Inclusion sorted by Hard Benefits desc.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-011', {w:1200, bold:true}), cell('Cost allocation table', {w:2500}),
        cell('Tab 6 table: Organisation, BU Led (M€), Functions & Regions (M€), Operations Cost (M€), Total IT Charge (M€). Sorted by total descending. Grand Total = Programme AOP + Operations AOP.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-012', {w:1200, bold:true}), cell('Header and versioning', {w:2500}),
        cell('Tag shows "One Portfolio Navigator · v{VERSION} · Built {date} {time}". VERSION constant drives all version references. IndexedDB namespace includes version.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-013', {w:1200, bold:true}), cell('Settings migration', {w:2500}),
        cell('validateSettings() migrates carry:number to carry:{basis,pct,amount}. Old sessions (carry as ROI threshold) auto-convert to bucket 100%. validateSession() applies same migration.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-014', {w:1200, bold:true}), cell('Decimal consistency', {w:2500}),
        cell('All user-visible amounts formatted as X.X (one decimal). fmt() and dec() default to 1dp. Internal ledger, export, and finance retain full precision.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-015', {w:1200, bold:true}), cell('Tab 6 Excel download', {w:2500}),
        cell('"Download Excel" button in Finalise Scenario toolbar. Calls exportExcel(result.rows, "finalized-scenario"). Full 10-sheet workbook with finance ledger.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-016', {w:1200, bold:true}), cell('Allocation % display', {w:2500}),
        cell('All lever allocation selections show actual funded percentage: "{funded} M€ funded of {demand} M€ Demand ({pct}%)". Updates on every solve.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-017', {w:1200, bold:true}), cell('Session migration', {w:2500}),
        cell('On IDB recovery: (1) carry:number → carry:{basis,pct,amount}. (2) Overrides with note starting "ExCo LFR opt-out" removed — stale permanent excludes from prior build. Toast shows migration count. (3) 4-element weights → 5-element.', {w:6300})] }),

      new TableRow({ children: [cell('REQ-018', {w:1200, bold:true}), cell('Data refresh contract', {w:2500}),
        cell('All numeric values are derived from source data at solve time. No embedded fixed values. LFR decisions matched by ID. Auto percentages recomputed on refresh.', {w:6300})] }),
    ]}),

    new Paragraph({ children: [new PageBreak()] }),

    hdr('Lever Interaction Matrix', HeadingLevel.HEADING_2),
    p(t('Each row shows the effect of changing the specified lever. Only L4 (Value) adjusts — it absorbs or releases the difference. All other levers retain their settings.')),

    new Table({ columnWidths: [2000, 2000, 2000, 2000, 2000], rows: [
      new TableRow({ children: [hCell('Change', 2000), hCell('L1 LFR', 2000), hCell('L2 Carry', 2000), hCell('L3 Sustain', 2000), hCell('L4/L5 Value', 2000)] }),
      new TableRow({ children: [cell('L1 ↑', {w:2000, bold:true}), cell('More LFR funded', {w:2000}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('Residual ↓ → less funded', {w:2000})] }),
      new TableRow({ children: [cell('L1 ↓', {w:2000, bold:true}), cell('Less LFR funded', {w:2000}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('Residual ↑ → more funded', {w:2000})] }),
      new TableRow({ children: [cell('L2 ↑', {w:2000, bold:true}), cell('No change', {w:2000}), cell('More carry funded', {w:2000}), cell('No change', {w:2000}), cell('Residual ↓ → less funded', {w:2000})] }),
      new TableRow({ children: [cell('L2 ↓', {w:2000, bold:true}), cell('No change', {w:2000}), cell('Less carry funded', {w:2000}), cell('No change', {w:2000}), cell('Residual ↑ → more funded', {w:2000})] }),
      new TableRow({ children: [cell('L3 ↑', {w:2000, bold:true}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('More sustain funded', {w:2000}), cell('Residual ↓ → less funded', {w:2000})] }),
      new TableRow({ children: [cell('L3 ↓', {w:2000, bold:true}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('Less sustain funded', {w:2000}), cell('Residual ↑ → more funded', {w:2000})] }),
      new TableRow({ children: [cell('L4 ↑', {w:2000, bold:true}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('More value funded (up to residual)', {w:2000})] }),
      new TableRow({ children: [cell('L5 toggle', {w:2000, bold:true}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('No change', {w:2000}), cell('Decomm splits from L4 to L5', {w:2000})] }),
    ]}),

    p(it('End of requirements. All values are computed from source data and settings. No fixed references.')),
  ]}],
});

Packer.toBuffer(doc).then(buf => {
  const out = process.argv[2] || 'AOP2027-Modeler-Detailed-Requirements-v5.7.1.docx';
  fs.writeFileSync(out, buf);
  console.log('Written ' + out + ' (' + buf.length + ' bytes)');
});
