from pathlib import Path
import re,json,hashlib
D=Path(__file__).parent
B=Path(r'C:\Users\320126040\Documents\Codex\AOP2027\AOP 2027 Modeler\AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html')
h=B.read_text(encoding='utf8'); before=hashlib.sha256(B.read_bytes()).hexdigest()
def change(a,b,count=1):
    global h
    assert a in h,a[:120]
    h=h.replace(a,b,count)
change("const VERSION='5.9.0'","const VERSION='5.10.0'")
h=h.replace('v5.9.0','v5.10.0')
# The restored lever applies to unconfirmed carry only. Old portable scenarios retain baseline-only behavior.
change('carry:0,sustain:',"carry:10,carryPolicy:'roi-v1',sustain:")
h=h.replace('s.carry=0;','s.carry=10;')
change("if(st===1&&!carryConfirmed)holds.push('No confirmed approved baseline for Carry Over funding');", """if(st===1&&!carryConfirmed){
 const threshold=s.carryPolicy==='roi-v1'?s.carry:10;
 if(threshold>=10)holds.push('Carryover ROI 10x+ — confirmed baseline only');
 else if(threshold>0&&ratio===null)holds.push('No quantified ROI for the selected carryover threshold');
 else if(threshold>0&&ratio<threshold)holds.push('Below carryover '+threshold.toFixed(1)+'x ROI threshold');
 }""")
start=h.index("if(mode==='roi'){const stg=result.stages[si];")
end=h.index('const v=s[k]',start)
h=h[:start]+"""if(mode==='roi'){const stg=result.stages[si],threshold=s.carryPolicy==='roi-v1'?s.carry:10;return '<article><h3>'+esc(title)+'</h3><label for="carry">Carryover ROI threshold</label><div class="slider-wrap"><input id="carry" aria-label="Carryover ROI threshold" type="range" min="0" max="10" step="0.5" value="'+threshold+'"'+disabled+'></div><label>ROI multiple <input id="carry-num" type="number" min="0" max="10" step="0.5" value="'+threshold+'"'+disabled+'>x</label><p>0x: no ROI filter · 10x+: confirmed baseline only.</p><p>Confirmed business cases remain exempt from ROI and use min(request, approved baseline). Other carryovers must meet the selected threshold and source eligibility.</p>'+allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)+'</article>';}"""+h[end:]
change("s.carry=Number(x.value);","s.carry=Number(x.value);s.carryPolicy='roi-v1';",-1)
h=h.replace('No ROI threshold. Funding = min(requested, approved baseline).','Confirmed baseline caps are exempt from ROI. Other carryovers follow the selected threshold.')
h=h.replace('allocationSelection(stg.allocation,stg.demand,stg.confirmedCarryDemand)','allocationSelection(stg.allocation,stg.demand)')
change("sc4.push(['Carry-over rule','Confirmed approved baseline cap','','No ROI threshold','','',''],0)","sc4.push(['Carry-over ROI',s4.carryPolicy==='roi-v1'?s4.carry:10,'x','Confirmed baselines exempt; 10x baseline-only; 0x no ratio filter','','',''],0)")
change("basis='Confirmed baseline cap';target='\\u2014';", "basis='ROI threshold; confirmed baseline exempt';target=(s4.carryPolicy==='roi-v1'?s4.carry:10)+'x';")
change('Prior-year commitments funded at min(demand, approved baseline)','Confirmed baseline caps; other carryovers follow the selected ROI threshold')
h=h.replace('Confirmed carry-over only; no ROI threshold','Confirmed baseline caps are ROI-exempt; other carryovers follow the selected threshold')
# Shared chart bridge, scenario-specific workbook export, and saved revision access.
bridge=(D/'bridge.js').read_text(encoding='utf8')
change('window.AOPApp={',bridge+'\nwindow.AOPApp={\n chartMarkup:rows=>chart(rows,\'exco\').replaceAll(\'id="chart-axis-toggle"\',\'id="exco-chart-axis"\').replaceAll(\'id="chart-colour"\',\'id="exco-chart-colour"\'),\n chartOptions:patch=>{Object.assign(session,patch);render();persist();},\n savedScenarios:()=>saved.slice(),exportScenario,\n')
change("function exportExcel(rows,scope){download('AOP2027-'+scope+'-r'+session.revision+'.xlsx',AOPWorkbook.write(AOPWorkbook.sheets(session,result,rows,scope)),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');}","function exportExcel(rows,scope){downloadScenario(session,result,rows,scope);}")
# Add scenario-specific downloads next to each saved revision and in Tab 2.
change("+' \\xb7 r'+x.revision+' \\xb7 '+x.status+'</button>').join('')", "+' \\xb7 r'+x.revision+' \\xb7 '+x.status+'</button><button data-saved-excel=\"'+esc(x.key)+'\">Download this scenario · Excel</button>').join('')")
change('<button id="export-full">Export full \\xb7 Excel</button>','<button id="export-full">Download current scenario · Excel</button>')
change("if(b.dataset.revertExco){", "if(b.dataset.savedExcel){await exportScenario(b.dataset.savedExcel,'full');return;}if(b.dataset.revertExco){")
# Extract and update the ExCo script only.
pos=h.index("<script>(function(){\n'use strict';\nconst $=q=>document.querySelector(q),E=")
end=h.index('</script>',pos);view=h[pos+8:end]
view=view.replace("['company','Company position']","['company','Overall State']").replace("['compare','Compare options'],",'')
view=view.replace('Company · all leaders','Overall State · all leaders')
view=view.replace('AOP 2027 company decisions','AOP 2027 · Overall State')
view=view.replace('<button id="exco-export">Export decision evidence</button>','<button id="exco-export">Download scenario · Excel</button>')
view=view.replace("h+='<div class=\"exco-toolbar\">", "h+=scenarioDownloads();h+='<div class=\"exco-toolbar\">")
view=view.replace('<li>Compare the recommended €100m option with the current scenario.</li>','<li>Review the overall funding envelope and priority allocation.</li>')
view=view.replace('<button data-exco-section="compare">Compare recommendation</button>','<button data-exco-drill="scenario">Open funding levers</button>')
a=view.index("if(section==='compare'){");b=view.index("if(section==='decisions'){",a);view=view[:a]+view[b:]
view=view.replace('Leader selections apply to Programs portfolios, comparisons and funding decisions.','Leader selections apply to Programs portfolios and funding decisions.')
# Remove the old separate chart implementation; use the same renderer as Tabs 3/4/6.
a=view.index('function bubbleChart(){');b=view.index('function companySettings()',a)
view=view[:a]+"function bubbleChart(){return '<article class=\"exco-card exco-shared-chart\"><h2>Programs decision map</h2>'+window.AOPApp.chartMarkup(viewRows().filter(r=>!r.isPmi))+'<p>Same chart as the detailed tabs. Click or press Enter on a bubble for source evidence. Benefits are submitted lifetime claims.</p></article>';}\n"+view[b:]
# Rewrite table and filtering for direct visible decisions and deterministic sorts.
for fn,nxt,newfile in [('viewRows','customTable','rows.js'),('customTable','customControls','table.js'),('filterControls','bubbleChart','filters.js')]:
 a=view.index('function '+fn+'(');b=view.index('function '+nxt+'(',a);view=view[:a]+(D/newfile).read_text(encoding='utf8')+'\n'+view[b:]
view=view.replace("customTable(viewRows().slice().sort((a,b)=>b.final-a.final||b.score-a.score))","customTable(viewRows(),true)")
view=view.replace('customTable(viewRows())','customTable(viewRows(),true)')
view=view.replace('Use Decisions to preview changes before applying.','Opt in, opt out or enter partial funding below; every change is previewed before applying.')
view=view.replace('Include selected','Opt in selected').replace('Exclude selected','Opt out selected')
view=view.replace('<p>Confirmed carry-over uses its approved baseline cap, without an ROI threshold.</p>', '<label class="exco-inline">Carryover ROI threshold (0–10x)<input id="exco-cfg-carry" type="number" min="0" max="10" step="0.5" value="\'+(s.carryPolicy===\'roi-v1\'?s.carry:10)+\'"></label><p>Confirmed baselines are ROI-exempt; 10x means baseline-only. Lower thresholds admit eligible other carryovers.</p>')
view=view.replace("for(const k of ['budget','tolerance','merit'])", "settings.carry=Number($('#exco-cfg-carry').value);settings.carryPolicy='roi-v1';for(const k of ['budget','tolerance','merit'])")
view=view.replace("['budget','tolerance','merit','weights'", "['budget','tolerance','merit','carry','carryPolicy','weights'")
view=view.replace("if(b.dataset.excoAxis){setPrefs({axis:b.dataset.excoAxis});return true;}", "if(await rebuildHandle(b))return true;")
view=view.replace('function featureChange(e){const t=e.target;', 'function featureChange(e){const t=e.target;if(rebuildChange(t))return;')
view=view.replace("if(t.dataset.excoSelect){t.checked?selectedIds.add(t.dataset.excoSelect):selectedIds.delete(t.dataset.excoSelect);$('#exco-selected-count').textContent=selectedIds.size;}","if(t.dataset.excoSelect){t.checked?selectedIds.add(t.dataset.excoSelect):selectedIds.delete(t.dataset.excoSelect);const count=$('#exco-selected-count');if(count)count.textContent=selectedIds.size;}")
view=view.replace("if(b.id==='exco-export')window.AOPApp.exportAll();", "if(b.id==='exco-export')await downloadSelectedScenario();")
view=view.replace('[data-exco-bubble]','[data-bubble]').replace('c.dataset.excoBubble','c.dataset.bubble')
view=view.replace('function render(){',(D/'features.js').read_text(encoding='utf8')+'\nfunction render(){',1)
view=view.replace('let h=\'<header',"let h='<header")
view=view.replace('getLeader:()=>leader,','getLeader:()=>leader,')
h=h[:pos]+'<script>'+view+'</script>'+h[end+9:]
h=h.replace('</head>','<style>'+(D/'style.css').read_text()+'</style></head>',1)
out=D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.10.0.html';out.write_text(h,encoding='utf8')
scripts=list(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',h,re.I));code=scripts[3][2];start=code.index('(function(root,factory)');end=code.index('(function(root,factory)',start+1)
(D/'engine.js').write_text(code[start:end],encoding='utf8');(D/'app.js').write_text(code,encoding='utf8');(D/'exco-final.js').write_text(view,encoding='utf8')
(D/'audit/build-provenance.json').write_text(json.dumps({'baseline':str(B),'baselineSha256':before,'newFile':out.name,'newSha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
assert hashlib.sha256(B.read_bytes()).hexdigest()==before
print('Built v5.10.0; v5.9.0 preserved')
