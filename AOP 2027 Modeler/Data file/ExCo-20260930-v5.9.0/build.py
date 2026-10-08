from pathlib import Path
import re,json,hashlib
D=Path(__file__).parent;B=Path(r'C:\Users\320126040\Documents\Codex\AOP2027\AOP 2027 Modeler\AOP2027-IT-Portfolio-Scenario-Modelling-v5.8.0.html');h=B.read_text(encoding='utf8');before=hashlib.sha256(B.read_bytes()).hexdigest()
h=h.replace("const VERSION='5.8.0'","const VERSION='5.9.0'").replace('v5.8.0','v5.9.0')
h=h.replace('function transact(session,action,details={},origin=',(D/'exco-actions.js').read_text(encoding='utf8')+'\nfunction transact(session,action,details={},origin=',1)
h=h.replace("else if(action==='review'){", "else if(action==='exco-review'||action==='opportunity'){applyExCoAction(next,action,details);next.preset='custom';}\n else if(action==='review'){",1)
h=h.replace('return {finance,tradeoff,VERSION,','return {opportunityPlan,finance,tradeoff,VERSION,',1)
bridge='''function syncExcoSelection(values){
 const valid=values.filter(x=>Object.hasOwn(AOP.EXCO_HIERARCHY,x));session.excoView={...session.excoView,leaders:valid,leader:valid.length===1?valid[0]:''};
 for(const scope of ['scenario','ew','bu','overview','prioritized']){session.filters[scope]={...session.filters[scope],exco:valid.slice(),org:[],platform:[]};}
}
'''
h=h.replace('window.AOPApp={',bridge+'\nwindow.AOPApp={\n preferences:patch=>{session.excoView={...session.excoView,...patch};render();persist();},\n selectLeader:leader=>{syncExcoSelection(leader?[leader]:[]);render();persist();},',1)
h=h.replace("f[k]=[...values];render();persist();", "f[k]=[...values];if(k==='exco')syncExcoSelection(f[k]);render();persist();",1)
view=(D/'exco-view.js').read_text(encoding='utf8')
view=view.replace("function portfolioRows(){return state().result.rows.filter(r=>!leader||r.exco===leader);}","function portfolioRows(){const ls=prefs().leaders||[];return state().result.rows.filter(r=>ls.length?ls.includes(r.exco):!leader||r.exco===leader);}")
view=view.replace('function render(){', (D/'exco-features.js').read_text(encoding='utf8')+'\nfunction render(){',1)
view=view.replace("if(!window.__aop||!window.AOPApp)return;const", "if(!window.__aop||!window.AOPApp)return;leader=prefs().leader||'';const",1)
view=view.replace("['decisions','Decisions']", "['decisions','Decisions'],['opportunities','Funding opportunities']")
view=view.replace("'<option value=\"\">Company · all leaders</option>'", "'<option value=\"\">Company · all leaders</option>'")
view=view.replace("<option value=\"\">Company · all leaders</option>'", "<option value=\"\">'+((prefs().leaders||[]).length>1?'Multiple leaders selected in workbench':'Company · all leaders')+'</option>'")
view=view.replace("h+='<article class=\"exco-card\"><h2>Programs in your portfolio</h2>","h+=filterControls()+bubbleChart()+customControls();h+='<article class=\"exco-card\"><h2>Programs in your portfolio</h2>")
view=view.replace("rowsTable(rs.slice().sort((a,b)=>b.final-a.final||b.score-a.score))","customTable(viewRows().slice().sort((a,b)=>b.final-a.final||b.score-a.score))")
start=view.index(" h+='<article class=\"exco-card\"><h2>Discretionary Programs decisions</h2>")
end=view.index(" h+='<article class=\"exco-card\"><h2>Decision history</h2>",start)
view=view[:start]+" h+=decisionWorkspace();\n"+view[end:]
view=view.replace("h+='<footer class=\"exco-footer\">", "if(section==='opportunities')h+=opportunities();\nh+='<footer class=\"exco-footer\">")
view=view.replace('root.innerHTML=h;',"const opened=[...root.querySelectorAll('details[id][open]')].map(x=>x.id);root.innerHTML=h;opened.forEach(id=>{const d=root.querySelector('#'+id);if(d)d.open=true;});")
view=view.replace("Budget remains '+exact(before.session.settings.budget)+' M€.","Base budget '+exact(before.session.settings.budget)+' → '+exact(proposed.settings.budget)+' M€.")
view=view.replace("+'<p><button id=\"exco-confirm-change\"", "+reviewSummary(kind,details,before,after,proposed)+previewBenefits(before.result,after)+'<p><button id=\"exco-confirm-change\"")
view=view.replace("leader=e.target.value;render();", "leader=e.target.value;selectedIds.clear();window.AOPApp.selectLeader(leader);")
view=view.replace("root.addEventListener('change',e=>{", "root.addEventListener('change',e=>{featureChange(e);")
view=view.replace("if(!b)return;try{", "if(!b)return;try{if(await featureHandle(b))return;",1)
view=view.replace("else window.AOPApp.commit(pending.kind,pending.details,'ExCo decision view');", "else if(!window.AOPApp.commit(pending.kind,pending.details,'ExCo decision view'))throw Error('Decision was not applied. Review the scenario status.');")
view=view.replace('The leader selection applies to My portfolio and Decisions.', 'Leader selections apply to Programs portfolios, comparisons and funding decisions.')
view=view.replace("dialog.showModal();}\nroot.addEventListener","dialog.showModal();dialog.scrollTop=0;const heading=dialog.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}\nroot.addEventListener")
view=view.replace("getLeader:()=>leader", "getLeader:()=>leader,columns:activeColumns,visibleRows:viewRows")
old=re.search(r'<script>\(function\(\)\{\s*\n\x27use strict\x27;\s*\nconst \$=q=>document.querySelector\(q\),E=',h)
assert old,'ExCo script marker'
end=h.index('</script>',old.start());h=h[:old.start()]+'<script>'+view+'</script>'+h[end+9:]
css=''' .exco-column-picker{max-height:280px;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:15px 0}.exco-column-picker label{display:flex;gap:8px;align-items:start;font-size:13px}.exco-column-picker label[hidden]{display:none}.exco-inline{display:flex;align-items:center;gap:15px;margin:12px 0}.exco-inline select{min-width:160px}.exco-form{flex-wrap:wrap}.exco-form input[type=number]{width:130px}.exco-card svg{width:100%;height:auto;margin-top:12px;font:12px Calibri,Arial;color:#142d50}.exco-card circle{cursor:pointer}.exco-card circle:focus{outline:3px solid #fca708}.exco-toolbar nav{flex-wrap:wrap}#exco-root summary{cursor:pointer;font-size:16px;font-weight:bold}#exco-dialog select{padding:9px;font:15px Calibri;border:1px solid #b9c9d8} .exco-scroll td:first-child{min-width:220px} @media(max-width:800px){.exco-column-picker{grid-template-columns:1fr}}'''
h=h.replace('</head>','<style>'+css+'</style></head>',1)
out=D/'AOP2027-IT-Portfolio-Scenario-Modelling-v5.9.0.html';out.write_text(h,encoding='utf8')
scripts=list(re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>',h,re.I));code=scripts[3][2];start=code.index('(function(root,factory)');end=code.index('(function(root,factory)',start+1);(D/'engine.js').write_text(code[start:end],encoding='utf8');(D/'app.js').write_text(code,encoding='utf8')
(D/'audit/build-provenance.json').write_text(json.dumps({'baseline':str(B),'baselineSha256':before,'newFile':out.name,'newSha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2),encoding='utf8');assert hashlib.sha256(B.read_bytes()).hexdigest()==before
print('Built v5.9.0; v5.8.0 preserved')
