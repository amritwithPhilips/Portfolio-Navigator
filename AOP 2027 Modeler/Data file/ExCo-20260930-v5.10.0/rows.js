function viewRows(){const p=prefs();const rows=portfolioRows().filter(r=>(!p.stream||p.stream==='all'||r.stream===p.stream)&&(!p.funding||p.funding==='all'||(p.funding==='funded'?r.final>0:r.final===0))&&(!p.search||[r.id,r.name,r.org,r.platform].join(' ').toLowerCase().includes(p.search.toLowerCase())));
 const sort=p.sort||'score-desc',[key,direction]=sort.split('-'),get=r=>key==='hard'?(r.benefitClass==='hard'&&Number.isFinite(r.benefit)?r.benefit:null):r[key];
 return rows.sort((a,b)=>{const x=get(a),y=get(b);if(x===null||x===undefined)return y===null||y===undefined?a.id.localeCompare(b.id):1;if(y===null||y===undefined)return -1;return (direction==='asc'?x-y:y-x)||a.id.localeCompare(b.id);});
}
