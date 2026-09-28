/* AOP 2027 deterministic scenario engine.
 * Source of truth: normalized output of scripts/prepare_source.py.
 * Works in browsers and Node without external dependencies.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AOP2027Engine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LFR_EXCEPTIONS = new Set(["EW-11", "EW-65", "EW-71"]);
  const HYGIENE = new Set([
    "decomm/replatforming",
    "decommissioning",
    "continuous improvement",
    "continous improvement",
    "continuous improvement (ci)",
    "upgrades & enhancements",
  ]);
  const STAGES = ["LFR", "Sustain Engineering", "Hygiene", "Carryover", "ROI-Based Portfolio"];

  const DEFAULT_SETTINGS = Object.freeze({
    budgetM: 100,
    deltaPct: 5,
    lfr: { basis: "bucket", pct: 100 },
    sustain: { basis: "bucket", pct: 100 },
    hygiene: { basis: "aop", pct: 10 },
    carryMultiple: 2,
    minimumMerit: 45,
    weights: { benefit: 50, priority: 25, consequence: 15, decisionBand: 10 },
    overrides: {},
  });

  const clean = (value) => String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  const key = (value) => clean(value).toLowerCase();
  const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
  const round = (value, places = 6) => {
    const p = 10 ** places;
    return Math.round((Number(value) + Number.EPSILON) * p) / p;
  };
  const decisionKey = (value) => key(value).replace(/[–—]/g, "-");
  const hasNumber = (value) => /(?:\d[\d,.]*\s*(?:€|eur|k|m|%|hours?|days?|fte|users?|countries?|regions?|sites?)|(?:€|eur)\s*\d)/i.test(clean(value));
  const enterpriseReach = (value) => /\b(global|enterprise|company[- ]wide|group[- ]wide|multi[- ]?region|all regions|all markets|worldwide)\b/i.test(clean(value));
  const harmLanguage = (value) => /\b(risk|loss|penalt|fine|delay|downtime|non[- ]?compl|failure|unable|cannot|impact|cost|harm|disrupt|customer|patient|revenue|security|regulatory|legal|quality)\b/i.test(clean(value));

  function mergeSettings(input) {
    const source = input || {};
    return {
      ...DEFAULT_SETTINGS,
      ...source,
      lfr: { ...DEFAULT_SETTINGS.lfr, ...(source.lfr || {}) },
      sustain: { ...DEFAULT_SETTINGS.sustain, ...(source.sustain || {}) },
      hygiene: { ...DEFAULT_SETTINGS.hygiene, ...(source.hygiene || {}) },
      weights: { ...DEFAULT_SETTINGS.weights, ...(source.weights || {}) },
      overrides: { ...(source.overrides || {}) },
    };
  }

  function classify(record) {
    const decision = decisionKey(record.overallDecision);
    if (decision.includes("must-do - p1 - immediate") || decision.includes("must-do - p2 - scheduled") || LFR_EXCEPTIONS.has(record.id)) return "LFR";
    if (key(record.newCarry) === "change & sustain") return "Sustain Engineering";
    if (HYGIENE.has(key(record.category))) return "Hygiene";
    if (key(record.newCarry).includes("carry")) return "Carryover";
    return "ROI-Based Portfolio";
  }

  function consequence(record) {
    const fields = [record.impactRaw, record.problem, record.scope].map(clean);
    const populated = fields.filter(Boolean);
    const evidence = populated.join(" | ");
    if (!populated.length) return { level: 0, points: 0, evidence: "", fields: [] };
    let level = 5;
    if (harmLanguage(evidence) && populated.length >= 2) level = 10;
    if (level >= 10 && (hasNumber(evidence) || enterpriseReach(evidence))) level = 15;
    return {
      level,
      points: level,
      evidence,
      fields: ["Impact and Cost of Not Doing", "Problem Statement", "Scope"].filter((_, i) => Boolean(fields[i])),
    };
  }

  function priorityPoints(value) {
    const v = key(value);
    if (v.includes("must do")) return 25;
    if (v.includes("must have")) return 18;
    if (v.includes("deprior")) return 5;
    return 0;
  }

  function bandPoints(value) {
    const v = key(value);
    if (v.includes("healthy")) return 10;
    if (v.includes("contain")) return 6;
    return 0;
  }

  function benefitPoints(ratio) {
    if (ratio == null || ratio < 1) return 0;
    if (ratio < 2) return 20;
    if (ratio < 3) return 30;
    if (ratio < 5) return 40;
    return 50;
  }

  function scaled(points, maximum, configured) {
    return maximum ? points * Number(configured || 0) / maximum : 0;
  }

  function enrich(record, settings) {
    const costM = Math.max(0, finite(record.costM) || 0);
    const benefitM = finite(record.benefitM);
    const ratio = benefitM != null && costM > 0 ? benefitM / costM : null;
    const captured = consequence(record);
    const components = {
      benefit: scaled(benefitPoints(ratio), 50, settings.weights.benefit),
      priority: scaled(priorityPoints(record.priority), 25, settings.weights.priority),
      consequence: scaled(captured.points, 15, settings.weights.consequence),
      decisionBand: scaled(bandPoints(record.decisionBand), 10, settings.weights.decisionBand),
    };
    const merit = Object.values(components).reduce((a, b) => a + b, 0);
    const primaryStage = classify(record);
    const decision = decisionKey(record.overallDecision);
    const priorityHold = decision.includes("must-do - priority tbd");
    let eligibility = "Eligible";
    let eligibilityReason = "Eligible for whole-initiative allocation";
    if (!clean(record.name) || costM <= 0) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = "Missing initiative name or positive 2027 request";
    } else if (priorityHold) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = "Overall AOP decision priority is TBD";
    } else if (primaryStage === "Carryover" && benefitM == null) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = "Carryover requires numeric Quantified Benefits";
    } else if (primaryStage === "Carryover" && ratio < settings.carryMultiple) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = `Carryover ROI ${round(ratio, 2)}x is below ${settings.carryMultiple}x threshold`;
    } else if (primaryStage === "ROI-Based Portfolio" && benefitM == null) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = "Numeric Quantified Benefits not captured";
    } else if (primaryStage === "ROI-Based Portfolio" && merit < settings.minimumMerit) {
      eligibility = "Evidence missing / not eligible";
      eligibilityReason = `Merit ${round(merit, 1)} is below advanced threshold ${settings.minimumMerit}`;
    }
    return {
      ...record,
      costM,
      benefitM,
      ratio: ratio == null ? null : round(ratio, 6),
      primaryStage,
      capturedConsequence: captured,
      meritComponents: components,
      merit: round(merit, 6),
      priorityHold,
      eligibility,
      eligibilityReason,
    };
  }

  function lfrSequence(record) {
    const d = decisionKey(record.overallDecision);
    if (d.includes("p1 - immediate")) return 1;
    if (d.includes("p2 - scheduled")) return 2;
    return 3;
  }

  function compare(a, b) {
    const stage = STAGES.indexOf(a.primaryStage) - STAGES.indexOf(b.primaryStage);
    if (stage) return stage;
    if (a.primaryStage === "LFR") {
      const seq = lfrSequence(a) - lfrSequence(b);
      if (seq) return seq;
    }
    if (a.primaryStage === "Carryover") {
      const roi = (b.ratio || -1) - (a.ratio || -1);
      if (roi) return roi;
    }
    const merit = b.merit - a.merit;
    if (merit) return merit;
    const roi = (b.ratio || -1) - (a.ratio || -1);
    if (roi) return roi;
    const priority = priorityPoints(b.priority) - priorityPoints(a.priority);
    if (priority) return priority;
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  }

  function leverTarget(stage, bucketDemand, settings) {
    const cfg = stage === "LFR" ? settings.lfr : stage === "Sustain Engineering" ? settings.sustain : settings.hygiene;
    const raw = cfg.basis === "aop" ? settings.budgetM * cfg.pct / 100 : bucketDemand * cfg.pct / 100;
    return Math.min(bucketDemand, Math.max(0, raw));
  }

  function allocate(payload, inputSettings) {
    const settings = mergeSettings(inputSettings);
    const budgetM = Math.max(0, finite(settings.budgetM) || 0);
    settings.budgetM = budgetM;
    settings.deltaPct = Math.max(0, finite(settings.deltaPct) || 0);
    settings.carryMultiple = Math.min(5, Math.max(1, finite(settings.carryMultiple) || 2));
    const records = (payload.records || []).map((r) => enrich(r, settings)).sort(compare);
    const bucketDemand = Object.fromEntries(STAGES.map((stage) => [stage, round(records.filter((r) => r.primaryStage === stage).reduce((s, r) => s + r.costM, 0))]));
    const targets = {
      LFR: leverTarget("LFR", bucketDemand.LFR, settings),
      "Sustain Engineering": leverTarget("Sustain Engineering", bucketDemand["Sustain Engineering"], settings),
      Hygiene: leverTarget("Hygiene", bucketDemand.Hygiene, settings),
      Carryover: null,
      "ROI-Based Portfolio": null,
    };
    const automaticLimit = budgetM * (1 + settings.deltaPct / 100);
    let automaticSpend = 0;
    const stageSpend = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
    const stageRank = Object.fromEntries(STAGES.map((stage) => [stage, 0]));

    for (const record of records) {
      stageRank[record.primaryStage] += 1;
      record.priorityRank = stageRank[record.primaryStage];
      record.automaticFunded = false;
      record.automaticAmountM = 0;
      record.rationale = record.eligibilityReason;
      if (record.eligibility !== "Eligible") continue;
      const stage = record.primaryStage;
      const target = targets[stage];
      const stageLimit = target == null ? Infinity : target * (1 + settings.deltaPct / 100);
      const withinStage = stageSpend[stage] + record.costM <= stageLimit + 1e-9;
      const withinPortfolio = automaticSpend + record.costM <= automaticLimit + 1e-9;
      if (withinStage && withinPortfolio) {
        record.automaticFunded = true;
        record.automaticAmountM = record.costM;
        stageSpend[stage] += record.costM;
        automaticSpend += record.costM;
        if (target == null) record.rationale = `${stage} priority rank ${record.priorityRank}; funded from remaining AOP`;
        else record.rationale = `${stage} priority rank ${record.priorityRank}; whole initiative within ${settings.deltaPct}% lever tolerance`;
      } else if (!withinStage) {
        record.rationale = `Whole initiative does not fit ${stage} target plus ${settings.deltaPct}% tolerance`;
      } else {
        record.rationale = `Whole initiative does not fit total AOP plus ${settings.deltaPct}% automatic tolerance`;
      }
    }

    let conferenceAdds = 0;
    let conferenceRemoves = 0;
    for (const record of records) {
      const override = settings.overrides[record.id] || {};
      const choice = override.choice === "include" || override.choice === "exclude" ? override.choice : "automatic";
      record.conferenceDecision = choice;
      record.conferenceReason = clean(override.reason);
      record.finalFunded = record.automaticFunded;
      record.finalAmountM = record.automaticAmountM;
      if (choice === "include" && !record.automaticFunded) {
        record.finalFunded = true;
        record.finalAmountM = record.costM;
        conferenceAdds += record.costM;
        record.rationale = `Conference inclusion: ${record.conferenceReason || "reason required before finalisation"}`;
      } else if (choice === "exclude" && record.automaticFunded) {
        record.finalFunded = false;
        record.finalAmountM = 0;
        conferenceRemoves += record.costM;
        record.rationale = `Conference exclusion: ${record.conferenceReason || "reason required before finalisation"}`;
      }
      record.status = record.finalFunded ? "Funded" : record.eligibility === "Eligible" ? "Unfunded" : record.eligibility;
      record.sourceRef = `${record.sourceSheet}!${record.sourceRow}`;
    }

    const finalSpend = records.reduce((sum, r) => sum + r.finalAmountM, 0);
    const variance = budgetM - finalSpend;
    const summaries = STAGES.map((stage) => {
      const subset = records.filter((r) => r.primaryStage === stage);
      const spend = subset.reduce((s, r) => s + r.finalAmountM, 0);
      return {
        stage,
        demandM: round(bucketDemand[stage]),
        targetM: targets[stage] == null ? null : round(targets[stage]),
        automaticM: round(stageSpend[stage]),
        finalM: round(spend),
        fundedCount: subset.filter((r) => r.finalFunded).length,
        totalCount: subset.length,
      };
    });
    const missingReasonCount = records.filter((r) => r.conferenceDecision !== "automatic" && !r.conferenceReason).length;
    return {
      sourceFile: payload.sourceFile,
      sourceSha256: payload.sourceSha256,
      settings,
      records,
      summaries,
      totals: {
        demandM: round(records.reduce((s, r) => s + r.costM, 0)),
        budgetM: round(budgetM),
        automaticM: round(automaticSpend),
        conferenceAddsM: round(conferenceAdds),
        conferenceRemovesM: round(conferenceRemoves),
        fundedM: round(finalSpend),
        varianceM: round(variance),
        overBudgetM: round(Math.max(0, -variance)),
        unallocatedM: round(Math.max(0, variance)),
        missingReasonCount,
      },
    };
  }

  return {
    version: "2.0.0",
    STAGES,
    DEFAULT_SETTINGS,
    LFR_EXCEPTIONS,
    HYGIENE,
    mergeSettings,
    classify,
    consequence,
    benefitPoints,
    priorityPoints,
    bandPoints,
    enrich,
    compare,
    allocate,
  };
});
