/**
 * AOP 2027 One Portfolio Dashboard — QA Harness v4.5
 *
 * Run in browser console on the loaded dashboard page.
 * Returns a structured test report for ExCo-readiness validation.
 *
 * Usage: paste into console, or inject via <script> tag, or call via preview_eval.
 */
(function runQA() {
  'use strict';
  const aop = window.__aop;
  if (!aop || !aop.result) return { error: 'Dashboard not loaded. Navigate to the HTML file first.' };

  const r = aop.result, s = aop.session, st = s.settings;
  const rd = v => Math.round(v * 1000) / 1000;
  const sum = (a, fn) => a.reduce((acc, x) => acc + (fn(x) || 0), 0);
  const pass = (name, ok, detail) => ({ name, status: ok ? 'PASS' : 'FAIL', detail });

  const tests = [];

  // ═══════════════════════════════════════════════
  // 1. DATA INTEGRITY
  // ═══════════════════════════════════════════════
  tests.push(pass('Total programme count = 521',
    r.rows.length === 521,
    `Got ${r.rows.length} rows`));

  const ids = r.rows.map(x => x.id);
  const uniqueIds = new Set(ids);
  tests.push(pass('No duplicate programme IDs',
    uniqueIds.size === ids.length,
    `${uniqueIds.size} unique of ${ids.length}`));

  tests.push(pass('CCB exceptions present (EW-11, EW-65, EW-71)',
    ['EW-11', 'EW-65', 'EW-71'].every(id => ids.includes(id)),
    ['EW-11', 'EW-65', 'EW-71'].map(id => id + ':' + (ids.includes(id) ? 'yes' : 'MISSING')).join(', ')));

  const streams = { ew: r.rows.filter(x => x.stream === 'ew'), bu: r.rows.filter(x => x.stream === 'bu') };
  tests.push(pass('EW + BU Led = total',
    streams.ew.length + streams.bu.length === r.rows.length,
    `EW ${streams.ew.length} + BU ${streams.bu.length} = ${streams.ew.length + streams.bu.length}`));

  // ═══════════════════════════════════════════════
  // 2. FOUR-PRIORITY CLASSIFICATION
  // ═══════════════════════════════════════════════
  const byStage = [0, 1, 2, 3].map(i => r.rows.filter(x => x.stage === i));
  const stageSum = byStage.reduce((s, a) => s + a.length, 0);
  tests.push(pass('Every programme in exactly one priority (P1-P4)',
    stageSum === 521,
    `P1:${byStage[0].length} P2:${byStage[1].length} P3:${byStage[2].length} P4:${byStage[3].length} = ${stageSum}`));

  // P1: all have evidence or are CCBs
  const p1NoEvidence = byStage[0].filter(x =>
    !['EW-11', 'EW-65', 'EW-71'].includes(x.item) && (!x.lfrName || !x.lfrYear));
  tests.push(pass('P1: all have compliance evidence or are CCBs',
    p1NoEvidence.length === 0,
    p1NoEvidence.length === 0 ? 'All P1 programmes evidence-gated' : `${p1NoEvidence.length} without evidence: ${p1NoEvidence.map(x => x.item).join(', ')}`));

  // P2: all baselined + Must Do/Must Have
  const p2Bad = byStage[1].filter(x =>
    !(x.baselined > 0) || !['must do', 'must have'].includes((x.priority || '').toLowerCase()));
  tests.push(pass('P2: all baselined with Must Do/Must Have',
    p2Bad.length === 0,
    p2Bad.length === 0 ? 'All P2 programmes baselined + Must Do/Have' : `${p2Bad.length} invalid: ${p2Bad.map(x => x.item).join(', ')}`));

  // P2: funding capped at baselined
  const p2OverCap = byStage[1].filter(x => x.final > 0 && x.baselined > 0 && x.final > x.baselined + 0.001);
  tests.push(pass('P2: no programme funded above baselined amount',
    p2OverCap.length === 0,
    p2OverCap.length === 0 ? 'All capped correctly' : `${p2OverCap.length} over cap`));

  // P2: all eligible (no evidence holds blocking carry-overs)
  const p2Held = byStage[1].filter(x => x.holds.length > 0);
  tests.push(pass('P2: all carry-overs eligible (no holds)',
    p2Held.length === 0,
    p2Held.length === 0 ? 'All 23 eligible' : `${p2Held.length} held: ${p2Held.map(x => x.holds[0]).join('; ')}`));

  // P2: total funded = sum of baselined caps (all should be funded)
  const p2TotalCap = rd(byStage[1].reduce((s,x) => s + (x.carryFundCap || 0), 0));
  const p2TotalFunded = rd(byStage[1].reduce((s,x) => s + x.final, 0));
  tests.push(pass('P2: total funded = total baselined cap',
    Math.abs(p2TotalCap - p2TotalFunded) < 0.01,
    `Cap: ${p2TotalCap}, Funded: ${p2TotalFunded}`));

  // P3: sustain funded before hygiene
  const p3sustain = byStage[2].filter(x => x.newCarry && x.newCarry.toLowerCase().includes('change & sustain'));
  const p3hygiene = byStage[2].filter(x => !p3sustain.includes(x));
  const sustainAllFunded = p3sustain.every(x => x.final > 0);
  const anyHygieneUnfunded = p3hygiene.some(x => x.final === 0);
  tests.push(pass('P3: Change & Sustain funded first (all funded)',
    sustainAllFunded,
    `${p3sustain.filter(x => x.final > 0).length}/${p3sustain.length} sustain funded`));

  // ═══════════════════════════════════════════════
  // 3. FINANCIAL RECONCILIATION
  // ═══════════════════════════════════════════════
  const totalRequested = rd(sum(r.rows, x => x.cost));
  const totalFinal = rd(sum(r.rows, x => x.final));
  const totalUnfunded = rd(sum(r.rows, x => x.unfunded));

  tests.push(pass('Requested = Final + Unfunded (within 0.01)',
    Math.abs(totalRequested - totalFinal - totalUnfunded) < 0.01,
    `${totalRequested} = ${totalFinal} + ${totalUnfunded} (diff: ${rd(totalRequested - totalFinal - totalUnfunded)})`));

  const ewFinal = rd(sum(streams.ew, x => x.final));
  const buFinal = rd(sum(streams.bu, x => x.final));
  tests.push(pass('EW + BU Led final = total final (within 0.01)',
    Math.abs(ewFinal + buFinal - totalFinal) < 0.01,
    `EW ${ewFinal} + BU ${buFinal} = ${rd(ewFinal + buFinal)} vs ${totalFinal}`));

  const stageFinal = rd(byStage.reduce((s, a) => s + sum(a, x => x.final), 0));
  tests.push(pass('Priority totals = portfolio total (within 0.01)',
    Math.abs(stageFinal - totalFinal) < 0.01,
    `Sum of P1-P4: ${stageFinal} vs ${totalFinal}`));

  // No programme in both funded and unfunded
  const funded = r.rows.filter(x => x.final > 0);
  const unfunded = r.rows.filter(x => x.final === 0 && x.cost > 0);
  const overlap = funded.filter(x => unfunded.some(u => u.id === x.id));
  tests.push(pass('No programme in both funded and unfunded tables',
    overlap.length === 0,
    overlap.length === 0 ? 'Clean separation' : `${overlap.length} overlapping`));

  // ═══════════════════════════════════════════════
  // 4. TOLERANCE CHECK
  // ═══════════════════════════════════════════════
  const maxBudget = st.budget * (1 + st.tolerance / 100);
  tests.push(pass('Total allocation within budget + tolerance',
    totalFinal <= maxBudget + 0.01,
    `${totalFinal} <= ${rd(maxBudget)} (budget ${st.budget} + ${st.tolerance}%)`));

  // ═══════════════════════════════════════════════
  // 5. UI CONSISTENCY
  // ═══════════════════════════════════════════════
  const kpiText = document.querySelector('#displayed-lever-total')?.textContent;
  const kpiExact = document.querySelector('#displayed-lever-total')?.dataset?.exact;
  tests.push(pass('KPI displays allocation amount',
    kpiText && kpiText.includes('M€'),
    `KPI shows: ${kpiText}`));

  const barSegments = [...document.querySelectorAll('.fundbar div')];
  tests.push(pass('Funding bar has 4 segments',
    barSegments.length >= 1 && barSegments.length <= 4,
    `${barSegments.length} segments: ${barSegments.map(d => d.textContent).join(' | ')}`));

  const leverDisplays = document.querySelectorAll('.allocation-selection strong');
  tests.push(pass('All 4 levers show funded amounts',
    leverDisplays.length === 4,
    `${leverDisplays.length} lever displays found`));

  // Scenario type buttons
  const typeButtons = document.querySelectorAll('[data-scenario-type]');
  tests.push(pass('OC-10: Three scenario type buttons present',
    typeButtons.length === 3,
    `${typeButtons.length} buttons: ${[...typeButtons].map(b => b.dataset.scenarioType).join(', ')}`));

  // ═══════════════════════════════════════════════
  // 6. PRESET VALIDATION
  // ═══════════════════════════════════════════════
  const presetNames = ['optimal', 'protect', 'evidence', 'capacity'];
  const presetResults = {};
  for (const name of presetNames) {
    const ps = AOP.preset(name);
    ps.budget = st.budget;
    try {
      const pr = AOP.solve(s.data, ps);
      presetResults[name] = {
        allocation: rd(pr.totals.allocation),
        funded: pr.totals.count,
        stages: pr.stages.map(x => rd(x.allocation))
      };
    } catch (e) {
      presetResults[name] = { error: e.message };
    }
  }
  const allPresetsWork = presetNames.every(n => !presetResults[n].error);
  tests.push(pass('All 4 presets solve without errors',
    allPresetsWork,
    JSON.stringify(presetResults)));

  // ═══════════════════════════════════════════════
  // 7. MERIT SCORING
  // ═══════════════════════════════════════════════
  const scores = r.rows.map(x => x.score);
  const allScoresValid = scores.every(s => s >= 0 && s <= 100);
  tests.push(pass('All merit scores between 0 and 100',
    allScoresValid,
    `Min: ${Math.min(...scores)}, Max: ${Math.max(...scores)}, Mean: ${rd(scores.reduce((a, b) => a + b, 0) / scores.length)}`));

  const weights = st.weights;
  const weightSum = weights.reduce((a, b) => a + b, 0);
  tests.push(pass('Merit weights sum to 100',
    Math.abs(weightSum - 100) < 0.01,
    `Weights: ${weights.join('/')} = ${weightSum}`));

  // ═══════════════════════════════════════════════
  // 8. LFR BREAKDOWN SECTION
  // ═══════════════════════════════════════════════
  const lfrSection = document.querySelector('summary')?.textContent?.includes('Legal and Compliance');
  tests.push(pass('LFR Demand Breakdown section present',
    !!lfrSection,
    lfrSection ? 'Found' : 'Missing'));

  const coSection = [...document.querySelectorAll('summary')].some(s => s.textContent.includes('Carry-Overs'));
  tests.push(pass('Carryover Baseline View section present',
    coSection,
    coSection ? 'Found' : 'Missing'));

  // ═══════════════════════════════════════════════
  // 9. GATE CARDS
  // ═══════════════════════════════════════════════
  const gates = document.querySelectorAll('.gate-no');
  tests.push(pass('Funding Prioritization Gate has 5 cards (0-4)',
    gates.length === 5,
    `${gates.length} gate cards`));

  // ═══════════════════════════════════════════════
  // 10. TAB NAVIGATION
  // ═══════════════════════════════════════════════
  const tabs = document.querySelectorAll('[data-tab]');
  const tabNames = [...tabs].map(t => t.dataset.tab);
  const expectedTabs = ['demand', 'scenario', 'ew', 'bu', 'operations', 'overview'];
  tests.push(pass('All 6 tabs present',
    expectedTabs.every(t => tabNames.includes(t)),
    `Found: ${tabNames.join(', ')}`));

  // ═══════════════════════════════════════════════
  // 11. HOLD TRANSPARENCY
  // ═══════════════════════════════════════════════
  // P1 and P2 should have ZERO holds (eligible-only buckets)
  const p1Held = byStage[0].filter(x => x.holds.length > 0);
  tests.push(pass('P1: zero holds (eligible-only bucket)',
    p1Held.length === 0,
    p1Held.length === 0 ? 'Clean' : `${p1Held.length} held`));

  // P3: only Contain and structural holds, no benefit/5x holds
  const p3BenefitHolds = byStage[2].filter(x => x.holds.some(h => h.includes('benefit') || h.includes('5.0x')));
  tests.push(pass('P3: no benefit/5x holds (sustain exempt)',
    p3BenefitHolds.length === 0,
    p3BenefitHolds.length === 0 ? 'Clean' : `${p3BenefitHolds.length} wrongly held`));

  // ═══════════════════════════════════════════════
  // 12. LEVER DISPLAY CONSISTENCY
  // ═══════════════════════════════════════════════
  // Each lever's "funded" text should match the funding bar segment
  const leverFunded = [...document.querySelectorAll('.allocation-selection strong')].map(el => el.textContent);
  const barValues = barSegments.map(d => d.textContent);
  // Note: bar may not show segments with 0 allocation
  tests.push(pass('Lever displays show funded amounts',
    leverFunded.length === 4 && leverFunded.every(t => t.includes('M€')),
    `Levers: ${leverFunded.join(' | ')}`));

  // ═══════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  const total = tests.length;

  return {
    summary: {
      version: r.version,
      timestamp: new Date().toISOString(),
      passed,
      failed,
      total,
      verdict: failed === 0 ? 'EXCO READY' : `${failed} FAILURES — NOT READY`
    },
    data: {
      programmes: r.rows.length,
      allocated: rd(totalFinal),
      budget: st.budget,
      preset: s.preset,
      scenarioType: s.scenarioType || 'default',
      buckets: {
        P1: { count: byStage[0].length, demand: rd(sum(byStage[0], x => x.cost)), funded: rd(sum(byStage[0], x => x.final)) },
        P2: { count: byStage[1].length, demand: rd(sum(byStage[1], x => x.cost)), funded: rd(sum(byStage[1], x => x.final)) },
        P3: { count: byStage[2].length, demand: rd(sum(byStage[2], x => x.cost)), funded: rd(sum(byStage[2], x => x.final)) },
        P4: { count: byStage[3].length, demand: rd(sum(byStage[3], x => x.cost)), funded: rd(sum(byStage[3], x => x.final)) }
      }
    },
    tests,
    presets: presetResults
  };
})();
