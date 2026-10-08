let exportSelection='current',exportScope='full';
function scenarioDownloads(){return '<details class="exco-card" id="exco-download-panel"><summary>Scenario Excel downloads</summary><div class="exco-form"><label>Scenario / saved revision<select id="exco-export-scenario"><option value="current">Current · '+E(state().session.name)+' · r'+state().session.revision+'</option>'+window.AOPApp.savedScenarios().map(s=>'<option value="'+E(s.key)+'" '+(exportSelection===s.key?'selected':'')+'>'+E(s.name)+' · r'+s.revision+' · '+E(s.status)+'</option>').join('')+'</select></label><label>Workbook scope<select id="exco-export-scope">'+[['full','Complete scenario'],['inclusions','Funded Programs'],['filtered','Selected leader and current filters']].map(([k,t])=>'<option value="'+k+'" '+(exportScope===k?'selected':'')+'>'+t+'</option>').join('')+'</select></label><button id="exco-download-scenario" class="primary">Download selected scenario · Excel</button></div><p>The selected revision is exported with exact values, source references, finance ledger and decision history. Downloading a saved scenario does not replace the current working scenario. “Selected Programs” contains the requested scope; company evidence sheets retain the full scenario.</p></details>';}
async function downloadSelectedScenario(scope){const p=prefs();return window.AOPApp.exportScenario(exportSelection,scope||exportScope,{leaders:p.leaders||[],stream:p.stream,funding:p.funding,search:p.search});}
function rebuildChange(t){
 if(t.id==='exco-list-sort'){setPrefs({sort:t.value});return true;}
 if(t.id==='exco-export-scenario'){exportSelection=t.value;return true;}
 if(t.id==='exco-export-scope'){exportScope=t.value;return true;}
 if(t.id==='exco-chart-axis'){window.AOPApp.chartOptions({chartAxis:t.checked?'benefits':'requested'});return true;}
 if(t.id==='exco-chart-colour'){window.AOPApp.chartOptions({chartColour:t.value});return true;}
 return false;
}
async function rebuildHandle(b){
 if(b.id==='exco-download-scenario'){await downloadSelectedScenario();return true;}
 if(b.id==='exco-download-filtered'){const previous=exportSelection;exportSelection='current';try{await downloadSelectedScenario('filtered');}finally{exportSelection=previous;}return true;}
 if(b.dataset.excoChoice){
  const r=state().result.rows.find(r=>r.id===b.dataset.choiceId),choice=b.dataset.excoChoice;if(!r||r.isPmi)throw Error('Select base Programs.');if(state().session.status==='Finalised')throw Error('Create a working version to change funding.');
  const labels={include:'Opt in',exclude:'Opt out',partial:'Partial funding',automatic:'Return to automatic'};
  dialog.innerHTML='<h2>'+labels[choice]+' · '+E(r.id)+'</h2><p>'+E(r.name)+'</p><p>Requested '+exact(r.cost)+' M€ · currently funded '+exact(r.final)+' M€.</p>'+(choice==='partial'?'<label>Funded amount M€<input id="exco-partial-amount" aria-label="Partial funded amount M€" type="number" min="0" max="'+r.cost+'" step="any" value="'+(r.final>0&&r.final<r.cost?r.final:r.cost/2)+'"></label><p>Enter a positive amount below the requested budget.</p>':'')+'<label>Decision rationale<textarea id="exco-direct-note">'+E(labels[choice]+' selected in ExCo review')+'</textarea></label><button class="primary" data-exco-direct-preview="'+E(r.id)+'" data-funding-choice="'+choice+'">Preview funding decision</button><button id="exco-cancel">Cancel</button>';
  dialog.showModal();return true;
 }
 if(b.dataset.excoDirectPreview){
  const r=state().result.rows.find(r=>r.id===b.dataset.excoDirectPreview),mode=b.dataset.fundingChoice,amount=mode==='partial'?Number($('#exco-partial-amount').value):mode==='include'?r.cost:0,note=$('#exco-direct-note').value;
  if(!AOP.clean(note))throw Error('Add a decision rationale.');if(mode==='partial'&&(!Number.isFinite(amount)||amount<=0||amount>=r.cost))throw Error('Partial funding must be greater than zero and below requested budget.');
  const details={id:r.id,choice:mode==='partial'?'include':mode,amount,note};const next=AOP.transact(state().session,'program',details,'ExCo funding decision');dialog.close();showPreview('program',details,next);return true;
 }
 return false;
}
