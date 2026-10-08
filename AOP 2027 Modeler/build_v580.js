#!/usr/bin/env node
/**
 * Build v5.8.0 — Data refresh + AOP 2026 spend lines + header update
 *
 * 1. Reads new demand data from AOP 2027 Consolidated Live 110261530.xlsx
 * 2. Creates complete workbook snapshot with base64
 * 3. Updates source-data JSON in HTML
 * 4. Updates version to v5.8.0
 * 5. Updates header with Demand Details timestamp from filename
 * 6. Adds AOP 2026 Spend line below each lever in Tab 2
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'AOP2027-IT-Portfolio-Scenario-Modelling-v5.7.1.html');
const OUTPUT = path.join(__dirname, 'AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html');
const NEW_SOURCE = path.join(ROOT, 'AOP 2027 Demand', 'AOP 2027 Consolidated Live 110261530.xlsx');

const OLD_VERSION = '5.7.1';
const NEW_VERSION = '5.8.0';

// AOP 2026 Spend data per lever
const AOP_2026_SPEND = {
  lfr:     { amount: 32,     label: 'LFR' },
  carry:   { amount: 122.11, label: 'Carryover (excl. LFR, Decomm)' },
  sustain: { amount: 9.39,   label: 'C&S, Upgrades & CI (excl. LFR, Carryover)' },
  value:   { amount: 16.85,  label: 'Other (excl. LFR, Carryover, C&S, Upgrade & CI)' },
  itsimp:  { amount: 4.36,   label: 'Decommissioning' }
};
const AOP_2026_TOTAL = 184.71;

console.log('=== Building v5.8.0 ===');
console.log('Baseline:', BASELINE);
console.log('New source:', NEW_SOURCE);
console.log('Output:', OUTPUT);

// --- Step 1: Read and hash new source ---
console.log('\n[1] Reading new source file...');
const sourceBytes = fs.readFileSync(NEW_SOURCE);
const sourceHash = crypto.createHash('sha256').update(sourceBytes).digest('hex');
const sourceBase64 = sourceBytes.toString('base64');
const sourceFile = 'AOP 2027 Consolidated Live 110261530.xlsx';
console.log('  SHA-256:', sourceHash);
console.log('  Size:', sourceBytes.length, 'bytes');
console.log('  Base64 length:', sourceBase64.length);

// --- Step 2: Extract sheets from the XLSX using the existing OOXML reader in the HTML ---
// We'll use the pako-based reader already embedded. Instead, we reuse the old snapshot structure
// and rebuild it from openpyxl-extracted data. But simpler: the HTML already has an XLSX reader.
// For the build script, we extract sheets using the approach from the old build scripts.

// Actually, the simplest approach: read the old HTML, parse its source-data JSON,
// replace the originalBase64 and sourceHash/sourceFile, then re-extract sheets from the new XLSX.
// The HTML's embedded OOXML reader will handle that at runtime. But we need the sheets for
// the engine to normalize at load time.

// We need to extract sheets from the new XLSX. Let's use the embedded XLSX parser.
// The HTML has a complete OOXML ZIP reader. Let's extract it and run it.

console.log('\n[2] Extracting sheets from new XLSX...');

// Read baseline HTML
let html = fs.readFileSync(BASELINE, 'utf8');

// Extract the source-data JSON
const sdTagStart = html.indexOf('id="source-data"');
const sdJsonStart = html.indexOf('>', sdTagStart) + 1;
const sdJsonEnd = html.indexOf('</script>', sdJsonStart);
const oldSourceData = JSON.parse(html.substring(sdJsonStart, sdJsonEnd));

console.log('  Old source:', oldSourceData.sourceFile);
console.log('  Old sheets:', oldSourceData.sheets.length);

// Extract sheets from the new XLSX using the OOXML reader embedded in the HTML
// The reader is after the engine code. Let's find it and eval it.
const ooxmlStart = html.indexOf('/* Offline XLSX IO:');
if (ooxmlStart < 0) throw new Error('Cannot find OOXML reader');
const ooxmlScriptEnd = html.indexOf('</script>', ooxmlStart);
const ooxmlCode = html.substring(ooxmlStart, ooxmlScriptEnd);

// The OOXML reader uses browser APIs (TextDecoder, etc). Let's use a different approach:
// Read the XLSX with the pako library that's in node_modules
const pako = require(path.join(__dirname, 'node_modules', 'pako'));

function readXlsx(buffer) {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // Find EOCD
    let eocdPos = -1;
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
        if (view.getUint32(i, true) === 0x06054b50) { eocdPos = i; break; }
    }
    if (eocdPos < 0) throw new Error('Not a valid ZIP');

    const cdOffset = view.getUint32(eocdPos + 16, true);
    const cdCount = view.getUint16(eocdPos + 10, true);

    const entries = {};
    let p = cdOffset;
    for (let i = 0; i < cdCount; i++) {
        const sig = view.getUint32(p, true);
        if (sig !== 0x02014b50) throw new Error('Bad CD entry');
        const method = view.getUint16(p + 10, true);
        const compressed = view.getUint32(p + 20, true);
        const size = view.getUint32(p + 24, true);
        const nl = view.getUint16(p + 28, true);
        const el = view.getUint16(p + 30, true);
        const cl = view.getUint16(p + 32, true);
        const localOff = view.getUint32(p + 42, true);
        const name = buffer.slice(p + 46, p + 46 + nl).toString('utf8');

        // Read local header to find data start
        const lnl = view.getUint16(localOff + 26, true);
        const lel = view.getUint16(localOff + 28, true);
        const start = localOff + 30 + lnl + lel;
        const body = buffer.slice(start, start + compressed);

        let value;
        if (method === 0) value = body;
        else if (method === 8) {
            try { value = Buffer.from(pako.inflateRaw(body)); }
            catch(e) { value = Buffer.from(pako.inflate(body)); }
        }
        else throw new Error('Unsupported method ' + method);

        entries[name] = value;
        p += 46 + nl + el + cl;
    }
    return entries;
}

function parseSharedStrings(xml) {
    const strings = [];
    const re = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const inner = m[1];
        let text = '';
        const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let tm;
        while ((tm = tRe.exec(inner)) !== null) {
            text += tm[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&#10;/g, '\n')
                .replace(/&#13;/g, '\r')
                .replace(/&#([0-9]+);/g, (_, n) => String.fromCharCode(parseInt(n)))
                .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
        }
        strings.push(text);
    }
    return strings;
}

function parseSheet(xml, strings) {
    const rows = [];
    const formulas = {};
    const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    while ((rm = rowRe.exec(xml)) !== null) {
        const cellRe = /<c\s+r="([A-Z]+)(\d+)"([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
        let cm;
        while ((cm = cellRe.exec(rm[1])) !== null) {
            const col = cm[1], rowNum = parseInt(cm[2]) - 1, attrs = cm[3], inner = cm[4] || '';
            const colIdx = colToIdx(col);

            while (rows.length <= rowNum) rows.push([]);
            while (rows[rowNum].length <= colIdx) rows[rowNum].push(null);

            const typeMatch = attrs.match(/\bt="([^"]+)"/);
            const type = typeMatch ? typeMatch[1] : '';

            const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
            const fMatch = inner.match(/<f[^>]*>([\s\S]*?)<\/f>/);

            if (fMatch) {
                formulas[col + (rowNum + 1)] = fMatch[1]
                    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            }

            if (vMatch) {
                const raw = vMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                if (type === 's') {
                    const idx = parseInt(raw);
                    rows[rowNum][colIdx] = idx < strings.length ? strings[idx] : raw;
                } else if (type === 'b') {
                    rows[rowNum][colIdx] = raw === '1';
                } else {
                    const num = Number(raw);
                    rows[rowNum][colIdx] = isNaN(num) ? raw : num;
                }
            } else if (type === 'inlineStr') {
                const isMatch = inner.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);
                if (isMatch) rows[rowNum][colIdx] = isMatch[1].replace(/&amp;/g, '&');
            }
        }
    }
    return { rows, formulas };
}

function colToIdx(col) {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.charCodeAt(i) - 64);
    }
    return idx - 1;
}

const zipEntries = readXlsx(sourceBytes);

// Parse workbook.xml to get sheet names and their rIds
const wbXml = zipEntries['xl/workbook.xml'].toString('utf8');
const rels = (zipEntries['xl/_rels/workbook.xml.rels'] || Buffer.alloc(0)).toString('utf8');

const sheetDefs = [];
const sheetRe = /<sheet\s+name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>/g;
let sm;
while ((sm = sheetRe.exec(wbXml)) !== null) {
    const name = sm[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const rId = sm[2];
    const relMatch = rels.match(new RegExp('Id="' + rId + '"[^>]*Target="([^"]+)"'));
    if (relMatch) {
        const target = 'xl/' + relMatch[1].replace(/^\//, '');
        sheetDefs.push({ name, target });
    }
}

// Parse shared strings
const ssXml = (zipEntries['xl/sharedStrings.xml'] || Buffer.alloc(0)).toString('utf8');
const strings = parseSharedStrings(ssXml);
console.log('  Shared strings:', strings.length);

// Parse each sheet
const sheets = [];
for (const sd of sheetDefs) {
    const xml = (zipEntries[sd.target] || Buffer.alloc(0)).toString('utf8');
    if (!xml) { console.log('  Skipping empty sheet:', sd.name); continue; }
    const parsed = parseSheet(xml, strings);
    sheets.push({
        name: sd.name,
        rows: parsed.rows,
        formulas: parsed.formulas,
        errors: {}
    });
    console.log('  Sheet "' + sd.name + '": ' + parsed.rows.length + ' rows, ' +
                Object.keys(parsed.formulas).length + ' formulas');
}

// --- Step 3: Build new source-data JSON ---
console.log('\n[3] Building new source-data JSON...');
const newSourceData = {
    sourceFile: sourceFile,
    sourceHash: sourceHash,
    originalBase64: sourceBase64,
    sheets: sheets,
    qa: oldSourceData.qa // preserve QA structure, will be re-run
};

const newSourceJson = JSON.stringify(newSourceData);
console.log('  New source-data JSON size:', newSourceJson.length);

// --- Step 4: Replace source-data in HTML ---
console.log('\n[4] Replacing source-data in HTML...');
html = html.substring(0, sdJsonStart) + newSourceJson + html.substring(sdJsonEnd);
console.log('  Source-data block replaced');

// --- Step 5: Update version strings ---
console.log('\n[5] Updating version strings...');

// 5a: Title tag
html = html.replace(
    'One Portfolio Navigator v' + OLD_VERSION + '</title>',
    'One Portfolio Navigator v' + NEW_VERSION + '</title>'
);

// 5b: Static header span
html = html.replace(
    'One Portfolio Navigator \xb7 v' + OLD_VERSION + '</span>',
    'One Portfolio Navigator \xb7 v' + NEW_VERSION + '</span>'
);

// 5c: Dynamic JS header with Demand Details timestamp
// Filename: AOP 2027 Consolidated Live 110261530.xlsx
// 110261530 = 1.10.26 at 15:30
const demandTimestamp = '1.10.26 at 15:30';
const oldHeaderJs = "'One Portfolio Navigator \\xb7 v" + OLD_VERSION + " \\xb7 Built '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+' '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})";
const newHeaderJs = "'One Portfolio Navigator \\xb7 v" + NEW_VERSION + " \\xb7 Built '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+' '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})+' with Demand Details at " + demandTimestamp + "'";

html = html.replace(oldHeaderJs, newHeaderJs);

// 5d: IndexedDB name
html = html.replace(
    new RegExp("Philips-AOP2027-v" + OLD_VERSION.replace(/\./g, '\\.'), 'g'),
    'Philips-AOP2027-v' + NEW_VERSION
);

// 5e: Engine VERSION constant
html = html.replace(
    "const VERSION='" + OLD_VERSION + "'",
    "const VERSION='" + NEW_VERSION + "'"
);

console.log('  Version strings updated to v' + NEW_VERSION);

// --- Step 6: Add AOP 2026 Spend lines below each lever ---
console.log('\n[6] Adding AOP 2026 Spend lines to levers...');

// The lever card ends with: allocationSelection(...)+'</article>'
// We need to insert the AOP 2026 line between allocationSelection and </article>
//
// For each lever key (lfr, carry, sustain, value), add after the allocationSelection call:
// +'<div class="aop2026-spend" style="...">AOP 2026 Spend : XX M€</div>'

// Generate the AOP 2026 spend line HTML factory
// This needs to be a JS expression that returns the HTML string
// We'll inject it as a function and modify the lever map callback

// Strategy: Add a helper function and modify the allocationSelection calls to append the AOP 2026 line
// Simpler: inject the AOP 2026 data as a constant and modify the lever rendering

// Find the position right after the engine code where we can inject our helper
const engineEnd = html.indexOf("/* Offline XLSX IO:");
if (engineEnd < 0) throw new Error('Cannot find engine end marker');

// Inject AOP 2026 spend data constant before the XLSX IO section
const aop2026Const = `
const AOP_2026_SPEND={lfr:{amount:32,label:'LFR'},carry:{amount:122.11,label:'Carryover (excl. LFR, Decomm)'},sustain:{amount:9.39,label:'C&S, Upgrades & CI (excl. LFR, Carryover)'},value:{amount:16.85,label:'Other (excl. LFR, Carryover, C&S, Upg & CI)'},itsimp:{amount:4.36,label:'Decommissioning'}};
const AOP_2026_TOTAL=184.71;
function aop2026Line(k){const d=AOP_2026_SPEND[k];if(!d)return '';return '<div style="margin-top:6px;padding:6px 10px;background:#00126E;color:#fff;border-radius:4px;font-size:12px;text-align:center;font-weight:600;letter-spacing:0.3px">AOP 2026 Spend : '+d.amount.toFixed(d.amount%1?2:0)+' M\\u20ac</div>';}
`;

html = html.substring(0, engineEnd) + aop2026Const + html.substring(engineEnd);

// Now modify the lever rendering to append aop2026Line(k) after allocationSelection
// For the regular levers (lfr, sustain, value), the pattern is:
//   allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>'
// For carry over lever:
//   allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+'</article>'
// For IT Simp:
//   allocationSelection(stg.allocation,stg.demand)+'</article>'

// Replace pattern 1: regular levers
html = html.replace(
    "allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+'</article>'",
    "allocationSelection(result.stages[si].allocation,result.stages[si].demand,result.stages[si].fundableDemand)+aop2026Line(k)+'</article>'"
);

// Replace pattern 2: carry over lever
html = html.replace(
    "allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+'</article>'",
    "allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+aop2026Line(k)+'</article>'"
);

// Replace pattern 3: IT Simplification lever
html = html.replace(
    "allocationSelection(stg.allocation,stg.demand)+'</article>'",
    "allocationSelection(stg.allocation,stg.demand)+aop2026Line(k)+'</article>'"
);

console.log('  AOP 2026 Spend lines injected');

// Also add a grand total line after all levers
// Find the closing of the levers div
const leversClosePattern = "+'</div><details class=\"advanced\">";
const leversCloseIdx = html.indexOf(leversClosePattern);
if (leversCloseIdx >= 0) {
    const grandTotalHtml = "+'<div style=\"margin:8px 0 4px;padding:8px 14px;background:#00126E;color:#fff;border-radius:6px;font-size:13px;text-align:center;font-weight:700;letter-spacing:0.5px\">AOP 2026 Grand Total : " + AOP_2026_TOTAL + " M\\u20ac</div>'";
    html = html.substring(0, leversCloseIdx) + grandTotalHtml + html.substring(leversCloseIdx);
    console.log('  AOP 2026 Grand Total line added');
}

// --- Step 7: Write output ---
console.log('\n[7] Writing output...');
fs.writeFileSync(OUTPUT, html, 'utf8');
const outSize = fs.statSync(OUTPUT).size;
console.log('  Output:', OUTPUT);
console.log('  Size:', (outSize / 1024 / 1024).toFixed(1), 'MB');

console.log('\n=== Build v5.8.0 complete ===');
console.log('Changes:');
console.log('  - Data refreshed from:', sourceFile);
console.log('  - SHA-256:', sourceHash.substring(0, 12));
console.log('  - Version: v' + OLD_VERSION + ' → v' + NEW_VERSION);
console.log('  - Header: includes "with Demand Details at ' + demandTimestamp + '"');
console.log('  - AOP 2026 Spend lines added to all 5 levers + grand total');
console.log('  - All scoring, funding and charging recalculated from new data at runtime');
