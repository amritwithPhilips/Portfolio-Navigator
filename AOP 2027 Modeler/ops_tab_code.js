// ---- TAB: OPERATIONS (v4.3.2 — EW-style 3-level hierarchy) ----
var SVC_DATA=JSON.parse(document.getElementById('svc-data').textContent);
var SUBORG_KEYS={'CT/AMI':'CT/AMI','DXR':'DXR','MR':'MR','ULS':'ULS','PD-Other':'PD-Other','PD Other':'PD-Other',
  'IGT-D':'IGT-D','IGT-S':'IGT-S','IGT-Other':'IGT-Other','IGT Other':'IGT-Other',
  'AMD':'AMD','HPM':'HPM','ACI':'ACI','ACI (shift from EI in 2026)':'ACI','Monit. Other':'Monitoring-Other','Monitoring-Other':'Monitoring-Other',
  'Sleep & Respitory Care':'SRC','SRC':'SRC',
  'CI':'CI','II':'II','EI Other':'EI-Other','EI-Other':'EI-Other',
  'MCC/WH':'MCC/WH','G&B':'G&B','OHC':'OHC','PH Other':'PH-Other','PH-Other':'PH-Other',
  'Int. Property & Standards':'IP&S','IP&S':'IP&S','Innovation & Design':'I&D','I&D':'I&D',
  'North America Region':'NAR','NAR':'NAR','International Region':'IR','IR':'IR','Greater China Region':'GCR','GCR':'GCR'};
function getSvcs(name){var k=SUBORG_KEYS[name]||SUBORG_KEYS[name.replace(/^- /,'')];return k?SVC_DATA[k]||[]:[];}

// Ops platform mapping (IT Dept codes to platform names)
var OPS_PLATFORM={};
OPS.operations.services.forEach(function(s){
  if(s.dept){var p=deptToPlatform(s.dept);if(p)OPS_PLATFORM[s.dept]=p;}
});

window.renderOperationsTab=function(){
  var tco=OPS.operations.tco;
  var h='<section class="kpis stream-kpis">';
  h+='<div class="kpi"><span>Total Operations 2027</span><strong>469.7 M€</strong><small>AOP 2027</small></div>';
  h+='<div class="kpi"><span>2026 Run-Rate</span><strong>470.7 M€</strong><small>Baseline</small></div>';
  h+='<div class="kpi"><span>Δ YoY</span><strong>-1.0 M€</strong><small>Decrease</small></div>';
  h+='<div class="kpi"><span>BU Own</span><strong>317.6 M€</strong><small>Own consumption</small></div>';
  h+='<div class="kpi"><span>From Regions</span><strong>63.5 M€</strong><small>Region allocation</small></div>';
  h+='<div class="kpi"><span>From Functions</span><strong>88.5 M€</strong><small>Function allocation</small></div>';
  h+='</section>';

  h+='<section class="panel"><h2>Organisation Total Cost of Ownership</h2>';

  // Filter + Sort (EW style)
  // Build filter data with platform mapping for TCO clusters
  var tcoFilterData=tco.filter(function(t){return !t.bu.startsWith('- ');}).map(function(t){
    // Map TCO cluster names to platforms (approximate: based on which IT platforms serve them)
    var platMap={'Precision Diagnosis':'Commercial IT','Image Guided Therapy':'Services & Solutions IT',
      'Connected Care':'Commercial IT','EI':'Commercial IT','Personal Health':'Commercial IT',
      'Int. Property & Standards':'Group Functions and Hyperautomation','Innovation & Design':'Innovation and Digital IT'};
    return {org:t.bu.trim(),platform:platMap[t.bu.trim()]||''};
  });
  h+=buildFilterBar('tcoTbl',tcoFilterData,[{key:'org',label:'Organisation'},{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  // Table using burf-table class (matches EW tab exactly)
  h+='<div class="tablebox burf-tablebox" style="max-height:none"><table class="portfolio burf-table" id="tcoTbl"><thead><tr>';
  h+='<th class="identity">Organisation</th>';
  h+='<th>AOP2027 Costs M€</th>';
  h+='<th>Own Consumption (M€ | %)</th>';
  h+='<th>Regions to BU (M€ | %)</th>';
  h+='<th>Functions & CoEs (M€ | %)</th>';
  h+='<th>Δ vs AOP2026 M€</th>';
  h+='</tr></thead><tbody>';

  var cg=null, expanded=new Set();
  tco.forEach(function(t,i){
    var isChild=t.bu.startsWith('- ')||t.bu.startsWith(' -');
    var gid='ops|'+encodeURIComponent(t.bu.trim());
    var d=t.deltaVsAOP2026||0,clr=d>=0?'var(--prot)':'var(--weak)';
    var total=t.totalBU||0;
    var ownPct=total>0?Math.round(t.ownConsumption/total*100)+'%':'';
    var regPct=total>0?Math.round(t.regionAlloc/total*100)+'%':'';
    var funcPct=total>0?Math.round(t.functionAlloc/total*100)+'%':'';

    if(!isChild){
      cg=gid;
      // Count children
      var childCount=0;
      for(var j=i+1;j<tco.length;j++){if(tco[j].bu.startsWith('- ')||tco[j].bu.startsWith(' -'))childCount++;else break;}

      h+='<tr class="burf-summary" data-group-summary="'+esc(gid)+'" data-organisation="'+esc(t.bu.trim())+'" data-org="'+esc(t.bu.trim())+'">';
      h+='<td class="identity"><button class="burf-toggle" data-collapse="'+esc(gid)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(t.bu.trim())+'</button> <span class="group-count">('+childCount+' sub-orgs)</span></td>';
      h+='<td class="num"><strong>'+fmt(total)+'</strong></td>';
      h+='<td class="num">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="color:'+clr+'">'+(d>=0?'+':'')+fmt(d)+'</td></tr>';
    } else {
      var subName=t.bu.replace(/^[\s-]+/,'').trim();
      var svcs=getSvcs(subName);

      // Sub-org summary row (hidden by default, like program rows in EW)
      h+='<tr class="program-row hidden" data-group="'+esc(cg)+'" data-org="'+esc(cg)+'">';
      h+='<td class="identity" style="padding-left:28px"><button class="burf-toggle" data-collapse="svc|'+esc(subName)+'" aria-expanded="false"><span class="triangle">▶</span>'+esc(subName)+'</button> <span class="group-count">('+svcs.length+' services)</span></td>';
      h+='<td class="num">'+fmt(total)+'</td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.ownConsumption)+' <small style="color:var(--text3)">'+ownPct+'</small></td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.regionAlloc)+' <small style="color:var(--text3)">'+regPct+'</small></td>';
      h+='<td class="num" style="color:var(--text2)">'+fmt(t.functionAlloc)+' <small style="color:var(--text3)">'+funcPct+'</small></td>';
      h+='<td class="num" style="color:'+clr+'">'+(d>=0?'+':'')+fmt(d)+'</td></tr>';

      // Service rows (hidden by default, level 3)
      svcs.forEach(function(s){
        h+='<tr class="program-row hidden" data-group="svc|'+esc(subName)+'" style="background:#f9fbfe">';
        h+='<td style="padding-left:56px;font-size:11px;color:var(--text2)">'+esc(s.n)+'</td>';
        h+='<td class="num" style="font-size:11px">'+fmt(s.c,4)+'</td>';
        h+='<td colspan="4"></td></tr>';
      });
    }
  });

  // Regions and Functions summary rows
  h+='<tr class="burf-summary"><td class="identity"><strong>Regions (allocated to BUs)</strong></td>';
  h+='<td class="num"><strong>63.5</strong></td><td class="num">63.5</td><td class="num">-63.5</td><td></td><td></td></tr>';
  h+='<tr class="burf-summary"><td class="identity"><strong>Functions & CoEs (allocated to BUs)</strong></td>';
  h+='<td class="num"><strong>88.5</strong></td><td class="num">88.5</td><td></td><td class="num">-88.5</td><td></td></tr>';

  // Total
  h+='<tr class="summary-total" data-total="1"><td class="identity"><strong>Total</strong></td>';
  h+='<td class="num"><strong>469.7</strong></td><td class="num">469.7</td><td class="num">127.1</td><td class="num">177.0</td><td></td></tr>';

  h+='</tbody></table></div></section>';

  // Service Catalog Table
  var svcs=OPS.operations.services;
  h+='<section class="panel"><h2>Service Catalog <span class="badge">'+svcs.length+' services</span></h2>';

  // Build platform-enriched service rows for filter
  var svcRows=svcs.map(function(s){return {org:s.dept,platform:deptToPlatform(s.dept),name:s.name};});
  h+=buildFilterBar('svcCatalog',svcRows,[{key:'platform',label:'Platform'}],
    [{v:'total-desc',l:'AOP2027 Costs (High→Low)'},{v:'total-asc',l:'AOP2027 Costs (Low→High)'}]);

  h+='<div class="tablebox" style="max-height:500px"><table class="it" id="svcCatalog"><thead><tr>';
  h+='<th>Service ID</th><th style="width:25%">Service Name</th><th>Platform</th>';
  h+='<th class="num">AOP2027 Costs M€</th><th class="num">2027 Demand Estimate</th>';
  h+='<th class="num">AOP2026 Costs M€</th><th class="num">2026 Demand Estimate</th>';
  h+='</tr></thead><tbody>';

  svcs.sort(function(a,b){return b.cost2027-a.cost2027;}).forEach(function(s){
    var plat=deptToPlatform(s.dept);
    var delta=s.cost2027-s.cost2026;
    h+='<tr data-platform="'+esc(plat)+'" data-org="'+esc(s.dept)+'">';
    h+='<td style="font-size:11px">'+esc(s.serviceId)+'</td>';
    h+='<td style="font-size:11px;max-width:250px">'+esc(s.name)+'</td>';
    h+='<td style="font-size:11px">'+esc(plat)+'</td>';
    h+='<td class="num">'+fmt(s.cost2027)+'</td>';
    h+='<td class="num" style="color:var(--text2)">—</td>';
    h+='<td class="num">'+fmt(s.cost2026)+'</td>';
    h+='<td class="num" style="color:var(--text2)">—</td>';
    h+='</tr>';
  });

  var svcTotal27=svcs.reduce(function(s,v){return s+v.cost2027;},0);
  var svcTotal26=svcs.reduce(function(s,v){return s+v.cost2026;},0);
  h+='<tr data-total="1" style="background:var(--lt);font-weight:700"><td></td><td>Total</td><td></td>';
  h+='<td class="num">'+fmt(svcTotal27)+'</td><td></td>';
  h+='<td class="num">'+fmt(svcTotal26)+'</td><td></td></tr>';
  h+='</tbody></table></div>';
  h+='<p class="muted" style="font-size:10px">Demand Estimates to be populated from Bill of IT consumption data. Platform derived from IT Dept code mapping.</p>';
  h+='</section>';

  // Attach collapse handlers for ops table
  setTimeout(function(){
    document.querySelectorAll('#tcoTbl [data-collapse]').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var id=this.dataset.collapse;
        var expanded=this.getAttribute('aria-expanded')==='true';
        this.setAttribute('aria-expanded',String(!expanded));
        this.querySelector('.triangle').textContent=expanded?'▶':'▼';
        document.querySelectorAll('#tcoTbl [data-group="'+id+'"]').forEach(function(r){
          if(expanded){
            r.classList.add('hidden');
            // Also collapse sub-groups
            r.querySelectorAll('[data-collapse]').forEach(function(b){
              b.setAttribute('aria-expanded','false');
              b.querySelector('.triangle').textContent='▶';
            });
            var subId=r.querySelector('[data-collapse]');
            if(subId){
              document.querySelectorAll('#tcoTbl [data-group="'+subId.dataset.collapse+'"]').forEach(function(sr){sr.classList.add('hidden');});
            }
          } else {
            r.classList.remove('hidden');
          }
        });
      });
    });
  },100);

  return h;
};
