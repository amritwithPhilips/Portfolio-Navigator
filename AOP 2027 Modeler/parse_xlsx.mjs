// Extract AOPWorkbook from v3.5 and use it to parse the 17926 XLSX
import { readFileSync, writeFileSync } from 'fs';
import { DOMParser } from 'linkedom';
globalThis.DOMParser = DOMParser;

const V35_PATH = 'C:/Users/320126040/OneDrive - Philips/Documents/ChatGPT/AOP 2027/Modeller/AOP2027-IT-Portfolio-Scenario-Modelling-v3.5.html';
const XLSX_PATH = 'C:/Users/320126040/OneDrive - Philips/Download/17926_IT AOP2027 Demand.xlsx';
const OUT_PATH = 'C:/Users/320126040/Documents/Codex/AOP2027/AOP 2027 Modeler/Data file/17926-parsed-sheets.json';

// Read v3.5 HTML
const html = readFileSync(V35_PATH, 'utf-8');

// AOPWorkbook spans lines 167-196 in v3.5.
// Find the IIFE start line and end line
const lines = html.split('\n');
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('root.AOPWorkbook=api;')) { startLine = i; }
  if (startLine >= 0 && lines[i].trim() === '});' && i > startLine) {
    // Check if this is the right closing by looking for 'return {read'
    for (let j = i - 1; j > startLine; j--) {
      if (lines[j].includes('return {read')) { endLine = i; break; }
    }
    if (endLine >= 0) break;
  }
}
if (startLine < 0 || endLine < 0) { console.log('AOPWorkbook not found'); process.exit(1); }

const wbCode = lines.slice(startLine, endLine + 1).join('\n');
console.log(`Extracted AOPWorkbook: lines ${startLine}-${endLine}, ${wbCode.length} chars`);

// Execute it to get the module
const globalThis_hack = globalThis;
eval(wbCode);

// Read the XLSX file
const xlsxBytes = readFileSync(XLSX_PATH);
console.log(`Read XLSX: ${xlsxBytes.length} bytes`);

// Parse using AOPWorkbook.read()
try {
  const wb = await globalThis.AOPWorkbook.read(new Uint8Array(xlsxBytes), '17926_IT AOP2027 Demand.xlsx');
  console.log(`Parsed workbook:`);
  console.log(`  sourceFile: ${wb.sourceFile}`);
  console.log(`  sourceHash: ${wb.sourceHash}`);
  console.log(`  sheets: ${wb.sheets.map(s => s.name).join(', ')}`);
  for (const s of wb.sheets) {
    console.log(`  ${s.name}: ${s.rows.length} rows, ${s.rows[0]?.length || 0} cols`);
    console.log(`    Row 0 (first 5): ${s.rows[0]?.slice(0, 5)}`);
    console.log(`    Row 3 (first 5): ${s.rows[3]?.slice(0, 5)}`);
  }

  // Write the parsed sheets to a JSON file
  const output = {
    sourceFile: wb.sourceFile,
    sourceHash: wb.sourceHash,
    originalBase64: xlsxBytes.toString('base64'),
    sheets: wb.sheets
  };
  writeFileSync(OUT_PATH, JSON.stringify(output));
  console.log(`\nWritten parsed sheets to ${OUT_PATH}: ${JSON.stringify(output).length} chars`);
} catch(e) {
  console.error('Parse error:', e);
  process.exit(1);
}
