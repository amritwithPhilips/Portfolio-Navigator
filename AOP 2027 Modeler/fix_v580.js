#!/usr/bin/env node
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html', 'utf8');
let changes = 0;

function replace(label, old, fresh) {
    const idx = html.indexOf(old);
    if (idx < 0) { console.error('MISS: ' + label); return false; }
    html = html.substring(0, idx) + fresh + html.substring(idx + old.length);
    console.log('OK: ' + label + ' @' + idx);
    changes++;
    return true;
}

function removeBlock(label, markerText, openTag, closeTag) {
    const mIdx = html.indexOf(markerText);
    if (mIdx < 0) { console.error('MISS marker: ' + label); return false; }
    const oIdx = html.lastIndexOf(openTag, mIdx);
    const cIdx = html.indexOf(closeTag, mIdx);
    if (oIdx < 0 || cIdx < 0) { console.error('MISS tags: ' + label); return false; }
    const plusIdx = html.lastIndexOf('+', oIdx);
    const endIdx = cIdx + closeTag.length;
    html = html.substring(0, plusIdx) + html.substring(endIdx);
    console.log('OK: ' + label + ' removed ' + (endIdx - plusIdx) + ' chars');
    changes++;
    return true;
}

// ========== FIX 1: Finance allocation scale ==========

// 1a: EW key scale: accept percentage sums (0-100) with 1/100 scale
replace('EW key scale',
    "const keyScale=Math.abs(rawSum-.001)<1e-10?1000:Math.abs(rawSum-1)<1e-8?1:null;",
    "const keyScale=Math.abs(rawSum-.001)<1e-10?1000:Math.abs(rawSum-1)<1e-8?1:(rawSum>0.01&&rawSum<=100.001)?1/100:null;"
);

// 1b: normalize() allocation filter: accept values > 100 (k€ amounts)
replace('alloc filter cap',
    "if(pct!==null&&pct>=0&&pct<=100)allocs[ac.buName]=pct;",
    "if(pct!==null&&pct>=0)allocs[ac.buName]=pct;"
);

// 1c: finance() BU allocation scale: detect k€ amounts and convert to fractions
replace('BU alloc scale',
    "const allocation=enterprise?(keyValid?rawKey:{}):(r.allocations||{}),scale=enterprise?(keyScale||1):1;",
    "const allocation=enterprise?(keyValid?rawKey:{}):(r.allocations||{}),rawAllocSum=Object.values(allocation).reduce((a,v)=>a+v,0),scale=enterprise?(keyScale||1):(rawAllocSum>1.01&&r.cost>0?1/(r.cost*1000):rawAllocSum>0&&rawAllocSum<=1.01?1:0);"
);

// ========== FIX 2: Remove debug sections ==========

removeBlock('EW charging section', 'EW charging percentages', "'<details", "</details>'");
removeBlock('Traceable finance ledger', 'Traceable finance ledger', "'<details", "</details>'");

// Remove Finance QA panel
const fqaIdx = html.indexOf('Finance QA');
if (fqaIdx > 12000000) {
    const panelIdx = html.lastIndexOf("'<div class=\"panel", fqaIdx);
    if (panelIdx > 0 && fqaIdx - panelIdx < 500) {
        // Find the closing of this panel div
        // The panel contains renderReport(...) which returns a string ending with </div>
        // Look for the closing pattern after Finance QA
        // The finance panel is: +'<div class="panel">'+renderReport(...)+financeTable+...</div>'
        // Let me find the actual closing
        const afterQA = html.substring(fqaIdx, fqaIdx + 2000);
        const panelClose = afterQA.indexOf("</div>'");
        if (panelClose >= 0) {
            const plusIdx = html.lastIndexOf('+', panelIdx);
            const endIdx = fqaIdx + panelClose + "</div>'".length;
            html = html.substring(0, plusIdx) + html.substring(endIdx);
            console.log('OK: Finance QA panel removed');
            changes++;
        }
    }
}

// ========== FIX 3: Prioritized Programs AOP excludes PMI ==========

// 3a: Export section progAlloc
replace('progAlloc excl PMI',
    'const progAlloc=result.totals.allocation+pmiAlloc;',
    'const progAlloc=result.totals.allocation;'
);

// 3b: Tab 6 KPI totalAlloc excludes PMI
replace('Tab 6 totalAlloc excl PMI',
    'var totalAlloc=funded.reduce(function(s,r){return s+r.final;},0);',
    'var totalAlloc=funded.filter(function(r){return !r.isPmi;}).reduce(function(s,r){return s+r.final;},0);'
);

// 3c: Total IT AOP should still add PMI back for grand total
replace('Total IT AOP incl PMI',
    "fmt(t6opsTotal+totalAlloc)+' M\\u20ac</strong><small>Programs + Operations</small>'",
    "fmt(t6opsTotal+totalAlloc+t6pmi.funded)+' M\\u20ac</strong><small>Programs + Operations + PMI</small>'"
);

// Write
fs.writeFileSync(__dirname + '/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html', html, 'utf8');
const sz = fs.statSync(__dirname + '/AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html').size;
console.log('\n' + changes + ' fixes applied. Size: ' + (sz/1024/1024).toFixed(1) + ' MB');
