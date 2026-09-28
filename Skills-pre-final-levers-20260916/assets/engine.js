(function (root) {
  'use strict';

  const clone = value => JSON.parse(JSON.stringify(value));
  const round = value => Math.round((Number(value) + Number.EPSILON) * 1e6) / 1e6;
  const sum = (rows, selector) => rows.reduce((total, row) => total + selector(row), 0);
  const norm = value => String(value ?? '').replace(/[\u00a0\u200b]/g, ' ').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const lower = value => norm(value).toLowerCase();
  const present = value => !['', 'n/a', 'na', 'none', '-', 'tbd'].includes(lower(value));
  const EPS = 0.00000051;

  const stages = [
    'LFR',
    'Sustain Engineering',
    'Carry-over',
    'Decommissioning and hygiene',
    'ROI-driven demand',
    'Reviewed inclusion'
  ];

  const designatedLfrItems = new Set(['EW-11', 'EW-65', 'EW-71']);

  const policy = () => ({
    benefit: [0, 20, 30, 40, 50],
    priority: [25, 18, 5, 0],
    consequence: [0, 5, 10, 15],
    decisionBand: [10, 6, 0],
    weights: [50, 25, 15, 10]
  });

  const defaults = () => ({
    name: 'Balanced investment',
    preset: 'balanced',
    budget: null,
    lfrPct: 100,
    sustainPct: 100,
    hygienePct: 0,
    carryMultiple: 2,
    merit: 45,
    assessed: false,
    releaseHygiene: false,
    scoring: policy(),
    overrides: {}
  });

  const presets = [
    {
      key: 'balanced',
      name: 'Balanced investment',
      description: 'Protect LFR, retain Sustain Engineering capacity, and allocate eligible residual demand.'
    },
    {
      key: 'confirmed',
      name: 'Confirmed evidence',
      description: 'Require a populated Decision band and a higher merit threshold for discretionary allocation.'
    },
    {
      key: 'capacity',
      name: 'Reduced sustain capacity',
      description: 'Test 60% Sustain Engineering coverage while retaining full LFR coverage.'
    }
  ];

  function preset(key, current = {}) {
    const selected = presets.find(item => item.key === key);
    if (!selected) throw new Error('Unknown scenario');
    const settings = defaults();
    settings.name = selected.name;
    settings.preset = key;
    settings.budget = current.budget ?? null;
    settings.hygienePct = current.hygienePct ?? settings.hygienePct;
    settings.overrides = clone(current.overrides ?? {});
    if (key === 'confirmed') {
      settings.merit = 65;
      settings.assessed = true;
    }
    if (key === 'capacity') settings.sustainPct = 60;
    return settings;
  }

  function validateSettings(settings) {
    const errors = [];
    if (!Number.isFinite(settings.budget) || settings.budget <= 0) {
      errors.push('Enter an approved positive portfolio envelope before calculating allocations.');
    }
    for (const key of ['lfrPct', 'sustainPct', 'hygienePct']) {
      if (!Number.isFinite(settings[key]) || settings[key] < 0 || settings[key] > 100) {
        errors.push(`${key} must be between 0 and 100.`);
      }
    }
    if (!Number.isFinite(settings.carryMultiple) || settings.carryMultiple < 0) errors.push('carryMultiple must be non-negative.');
    if (!Number.isFinite(settings.merit) || settings.merit < 0 || settings.merit > 100) errors.push('merit must be between 0 and 100.');
    if (!settings.scoring || !Array.isArray(settings.scoring.weights) || settings.scoring.weights.length !== 4) {
      errors.push('A four-part scoring policy is required.');
    } else if (Math.abs(sum(settings.scoring.weights, value => Number(value) || 0) - 100) > EPS) {
      errors.push('Scoring weights must total 100.');
    }
    if (errors.length) throw new Error(errors.join(' '));
    return true;
  }

  function normalizeDecisionBand(value) {
    const normalized = norm(value).toUpperCase();
    if (normalized.includes('HEALTHY')) return 'HEALTHY';
    if (normalized.includes('CONTAIN')) return 'CONTAIN';
    return 'UNASSESSED';
  }

  function capturedConsequence(record) {
    const evidence = [
      ['Impact and Cost of Not Doing', record.impactRaw],
      ['Problem Statement', record.problem],
      ['Scope', record.scope]
    ].filter(([, value]) => present(value));

    if (!evidence.length) return { tier: 0, evidence: [], explanation: 'No usable consequence stated in the three source fields.' };

    const combined = evidence.map(([, value]) => norm(value)).join(' ');
    const explicitHarm = /\b(loss|losing|lost|delay|disrupt|unable|inability|cannot|non-compliance|noncompliance|penalt|fine|audit finding|manual|error|unsupported|risk|prevent|prohibit|decline|degrad|outage|customer impact|revenue impact|productivity|cost increase|failure)\b/i.test(combined);
    const quantifiedOrBroad = /\d+(?:[.,]\d+)?\s*%|\b(global|enterprise|company-wide|company wide|across regions|multiple regions|all regions|all businesses|all business units)\b/i.test(combined);
    const tier = explicitHarm ? (quantifiedOrBroad ? 3 : 2) : 1;
    return {
      tier,
      evidence: evidence.map(([field, value]) => ({ field, text: norm(value) })),
      explanation: evidence.map(([field, value]) => `${field}: ${norm(value)}`).join('\n')
    };
  }

  function prepare(source, settings) {
    const row = clone(source);
    const scoring = settings.scoring;
    row.id = norm(row.id || row.item);
    row.item = norm(row.item);
    row.name = norm(row.name);
    row.costM = round(Number(row.costM) || 0);
    row.decisionBand = normalizeDecisionBand(row.decisionBand);
    row.overallDecision = norm(row.overallDecision);

    const overall = row.overallDecision.toUpperCase();
    row.isImmediateLfr = /MUST-DO.*P1.*IMMEDIATE/.test(overall);
    row.isScheduledLfr = /MUST-DO.*P2.*SCHEDULED/.test(overall);
    row.isPriorityTbd = /MUST-DO.*PRIORITY TBD/.test(overall);
    row.isDesignatedLfr = designatedLfrItems.has(row.item.toUpperCase());
    row.isLfr = row.isImmediateLfr || row.isScheduledLfr || row.isDesignatedLfr;

    const sourceSustainClassification = lower(row.newCarry) === 'change & sustain' || /\bccb\b/i.test(row.name);
    row.isSustainEngineering = sourceSustainClassification && !row.isLfr;
    row.isCarryOver = /carry\s*-?\s*over/i.test(norm(row.newCarry)) && !row.isLfr && !row.isSustainEngineering;
    row.isHygiene = Boolean(row.isHygiene && present(row.hygieneEvidence));
    row.hasConditions = row.decisionBand === 'CONTAIN' || /CONTAIN.*CONDITION/i.test(overall);

    row.benefitM = Number.isFinite(row.benefitM) ? round(row.benefitM) : null;
    row.ratio = row.benefitM !== null && row.costM > 0 ? row.benefitM / row.costM : null;
    row.highClaim = row.ratio !== null && row.ratio > 5 + 1e-10;
    row.benefitEligible = row.ratio !== null && row.ratio > 1 && row.ratio <= 5 + 1e-10;

    const benefitTier = row.ratio === null || row.ratio < 1 ? 0 : row.ratio < 2 ? 1 : row.ratio < 3 ? 2 : row.ratio < 5 ? 3 : 4;
    const priorityText = lower(row.priority);
    const priorityTier = priorityText === 'must do' ? 0 : priorityText === 'must have' ? 1 : priorityText.includes('depri') ? 2 : 3;
    const consequence = capturedConsequence(row);
    const bandTier = row.decisionBand === 'HEALTHY' ? 0 : row.decisionBand === 'CONTAIN' ? 1 : 2;

    row.meritParts = [
      scoring.benefit[benefitTier] / 50 * scoring.weights[0],
      scoring.priority[priorityTier] / 25 * scoring.weights[1],
      scoring.consequence[consequence.tier] / 15 * scoring.weights[2],
      scoring.decisionBand[bandTier] / 10 * scoring.weights[3]
    ].map(value => Math.round(value * 100) / 100);
    row.merit = Math.round(sum(row.meritParts, value => value) * 100) / 100;
    row.capturedConsequenceTier = consequence.tier;
    row.capturedConsequencePoints = row.meritParts[2];
    row.capturedConsequenceEvidence = consequence.evidence;
    row.capturedConsequenceExplanation = consequence.explanation;

    row.override = settings.overrides?.[row.id] || settings.overrides?.[row.item] || null;
    row.fundedM = 0;
    row.selected = false;
    row.reason = '';
    row.stage = row.isLfr ? 'LFR'
      : row.isSustainEngineering ? 'Sustain Engineering'
        : row.isCarryOver ? 'Carry-over'
          : row.isHygiene ? 'Decommissioning and hygiene'
            : 'ROI-driven demand';
    return row;
  }

  function validateData(data) {
    if (!Array.isArray(data) || !data.length || data.length > 10000) throw new Error('Demand data must contain between 1 and 10,000 records.');
    const ids = new Set();
    for (const record of data) {
      const id = norm(record.id || record.item);
      if (!id) throw new Error('Every normalized record requires a stable id.');
      if (ids.has(id)) throw new Error(`Duplicate record id: ${id}`);
      ids.add(id);
      if (record.costM !== null && record.costM !== undefined && (!Number.isFinite(Number(record.costM)) || Number(record.costM) < 0)) {
        throw new Error(`Invalid requested investment for ${id}.`);
      }
    }
    return true;
  }

  function solve(data, requestedSettings) {
    validateData(data);
    const settings = Object.assign(defaults(), clone(requestedSettings || {}));
    settings.scoring = Object.assign(policy(), clone(requestedSettings?.scoring || {}));
    validateSettings(settings);

    const rows = data.map(record => prepare(record, settings));
    const byId = Object.fromEntries(rows.map(row => [row.id, row]));
    const spend = Object.fromEntries(stages.map(stage => [stage, 0]));
    const alerts = [];
    let used = 0;

    const allocate = (row, amount, reason, stage = row.stage) => {
      const value = round(amount);
      if (value <= EPS) {
        row.reason = reason;
        return false;
      }
      if (used + value > settings.budget + EPS) return false;
      row.stage = stage;
      row.fundedM = value;
      row.selected = true;
      row.reason = reason;
      used = round(used + value);
      spend[stage] = round(spend[stage] + value);
      if (row.hasConditions) row.reason += '; source conditions retained';
      if (row.decisionBand === 'UNASSESSED') row.reason += '; Decision band unassessed';
      return true;
    };

    const excluded = new Set();
    for (const row of rows) {
      if (row.override?.choice === 'out') {
        excluded.add(row.id);
        row.reason = `Reviewed exclusion: ${norm(row.override.reason) || 'reason required'}`;
      }
    }

    const lfrRank = row => row.isImmediateLfr ? 0 : row.isScheduledLfr ? 1 : 2;
    const lfrRows = rows.filter(row => row.isLfr && row.costM > 0 && !excluded.has(row.id)).sort((a, b) => lfrRank(a) - lfrRank(b) || a.id.localeCompare(b.id));
    let lfrShortfall = 0;
    for (const row of lfrRows) {
      const amount = row.override?.choice === 'in' ? Number(row.override.amount ?? row.costM) : row.costM * settings.lfrPct / 100;
      const reason = row.override?.choice === 'in'
        ? `Reviewed LFR allocation: ${norm(row.override.reason)}`
        : row.isImmediateLfr ? 'Source Overall AOP decision: P1 Immediate'
          : row.isScheduledLfr ? 'Source Overall AOP decision: P2 Scheduled'
            : 'Approved LFR exception';
      if (!allocate(row, amount, reason, 'LFR')) {
        lfrShortfall = round(lfrShortfall + amount);
        row.reason = 'LFR allocation does not fit the approved envelope';
      }
    }

    if (lfrShortfall > EPS) {
      alerts.push(`LFR has ${lfrShortfall.toFixed(3)} MEUR left unfunded. Later automatic stages were stopped.`);
    }

    let sustainShortfall = 0;
    if (lfrShortfall <= EPS) {
      const sustainRows = rows.filter(row => row.isSustainEngineering && row.costM > 0 && !excluded.has(row.id)).sort((a, b) => a.id.localeCompare(b.id));
      for (const row of sustainRows) {
        const amount = row.override?.choice === 'in' ? Number(row.override.amount ?? row.costM) : row.costM * settings.sustainPct / 100;
        const reason = row.override?.choice === 'in'
          ? `Reviewed Sustain Engineering allocation: ${norm(row.override.reason)}`
          : `Sustain Engineering coverage ${settings.sustainPct}%`;
        if (!allocate(row, amount, reason, 'Sustain Engineering')) {
          sustainShortfall = round(sustainShortfall + amount);
          row.reason = 'Sustain Engineering allocation does not fit the approved envelope';
        }
      }
    }

    const hygieneCap = round(settings.budget * settings.hygienePct / 100);
    const discretionaryOrder = (a, b) => (b.benefitM || 0) - (a.benefitM || 0) || (b.ratio || 0) - (a.ratio || 0) || b.merit - a.merit || a.id.localeCompare(b.id);
    const automaticEligible = row => {
      if (!row.name || row.costM <= 0 || row.isPriorityTbd) return false;
      if (settings.assessed && row.decisionBand === 'UNASSESSED') return false;
      return row.benefitEligible && row.merit >= settings.merit;
    };

    const reviewedInclusions = rows.filter(row => row.override?.choice === 'in' && !row.isLfr && !row.isSustainEngineering && !excluded.has(row.id));
    for (const row of reviewedInclusions) {
      if (row.highClaim && !row.override?.benefitReviewed) {
        row.reason = 'Reviewed inclusion pending: confirm review of the above-five-times benefit claim';
        continue;
      }
      const amount = Number(row.override.amount ?? row.costM);
      if (!allocate(row, amount, `Reviewed inclusion: ${norm(row.override.reason)}`, 'Reviewed inclusion')) row.reason = 'Reviewed inclusion does not fit the approved envelope';
    }

    if (lfrShortfall <= EPS) {
      const carryRows = rows.filter(row => row.isCarryOver && !row.selected && !excluded.has(row.id) && automaticEligible(row) && row.ratio >= settings.carryMultiple).sort(discretionaryOrder);
      for (const row of carryRows) {
        const held = settings.releaseHygiene ? 0 : Math.max(0, hygieneCap);
        if (used + row.costM <= settings.budget - held + EPS) allocate(row, row.costM, `Eligible carry-over at ${row.ratio.toFixed(2)}x submitted benefit`, 'Carry-over');
        else row.reason = 'Eligible carry-over does not fit after preserving the hygiene reservation';
      }

      let hygieneUsed = 0;
      const hygieneRows = rows.filter(row => row.isHygiene && !row.selected && !excluded.has(row.id) && row.costM > 0).sort((a, b) => b.capturedConsequenceTier - a.capturedConsequenceTier || a.costM - b.costM || a.id.localeCompare(b.id));
      for (const row of hygieneRows) {
        if (hygieneUsed + row.costM <= hygieneCap + EPS && allocate(row, row.costM, 'Evidenced decommissioning or hygiene scope', 'Decommissioning and hygiene')) hygieneUsed = round(hygieneUsed + row.costM);
        else row.reason = 'Evidenced hygiene demand does not fit the reservation';
      }

      const commonRows = rows.filter(row => !row.selected && !excluded.has(row.id) && !row.isLfr && !row.isSustainEngineering && !row.isHygiene && automaticEligible(row)).sort(discretionaryOrder);
      for (const row of commonRows) {
        const hygieneHeld = settings.releaseHygiene ? 0 : Math.max(0, hygieneCap - spend['Decommissioning and hygiene']);
        if (used + row.costM <= settings.budget - hygieneHeld + EPS) allocate(row, row.costM, 'Highest eligible residual demand within the remaining envelope', 'ROI-driven demand');
        else row.reason = 'Eligible demand does not fit the remaining envelope';
      }
    }

    for (const row of rows) {
      row.unfundedM = round(Math.max(0, row.costM - row.fundedM));
      if (!row.reason) {
        if (row.isPriorityTbd) row.reason = 'Overall AOP priority is TBD';
        else if (!row.name) row.reason = 'Missing initiative name';
        else if (row.costM <= 0) row.reason = 'No positive requested investment';
        else if (settings.assessed && row.decisionBand === 'UNASSESSED') row.reason = 'Decision band required by this scenario';
        else if (row.highClaim) row.reason = 'Submitted benefit above five times requires review';
        else if (!row.benefitEligible && !row.isLfr && !row.isSustainEngineering && !row.isHygiene) row.reason = 'No eligible submitted benefit above requested investment';
        else if (row.merit < settings.merit) row.reason = `Merit ${row.merit} is below the ${settings.merit} threshold`;
        else row.reason = 'Not allocated';
      }
    }

    const totals = {};
    for (const stream of ['bu', 'ew', 'total']) {
      const scoped = rows.filter(row => stream === 'total' || lower(row.stream) === stream);
      totals[stream] = {
        count: scoped.length,
        fundedCount: scoped.filter(row => row.selected).length,
        requestedM: round(sum(scoped, row => row.costM)),
        allocatedM: round(sum(scoped, row => row.fundedM)),
        unfundedM: round(sum(scoped, row => row.unfundedM))
      };
    }

    const unallocated = round(settings.budget - used);
    const hygieneHeld = settings.releaseHygiene ? 0 : Math.min(unallocated, Math.max(0, hygieneCap - spend['Decommissioning and hygiene']));
    return {
      rows,
      byId,
      totals,
      spend,
      settings,
      alerts,
      lfrBaseM: round(sum(rows.filter(row => row.isLfr), row => row.costM)),
      sustainEngineeringBaseM: round(sum(rows.filter(row => row.isSustainEngineering), row => row.costM)),
      lfrShortfall,
      sustainShortfall,
      hygieneCap,
      hygieneHeld: round(hygieneHeld),
      unallocated,
      available: round(unallocated - hygieneHeld)
    };
  }

  const api = {
    defaults,
    presets,
    preset,
    policy,
    prepare,
    solve,
    validateSettings,
    validateData,
    capturedConsequence,
    normalizeDecisionBand,
    designatedLfrItems: Array.from(designatedLfrItems),
    round,
    stages
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AOP = api;
})(typeof window !== 'undefined' ? window : globalThis);
