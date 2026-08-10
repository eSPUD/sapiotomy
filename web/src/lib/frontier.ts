/**
 * Simulations for Act 3 (frontier & caveats). Pure + seeded.
 *
 * Only the page 13 block below is still drawn. The economics (old page 16) and
 * faithfulness (old page 18) blocks are RETAINED UNRENDERED after the
 * 2026-08-10 cut: they stay validated by frontier.test.ts and act3.test.ts so
 * the arithmetic does not rot, and PROVENANCE.md records that nothing renders
 * them. Section headings keep the pre-cut page numbers.
 */
import { createRng } from "./rng";

// --- Page 13: o1's two-axis log-linear scaling ------------------------------
// One law, two knobs. Accuracy is log-linear in test-time compute AND in
// train-time RL compute: a decade of either buys the same `slopePerDecade`
// points. `intercept` is the accuracy at 1 relative unit of thinking on the
// fully-trained run; pulling train-time compute below `maxTrainExp` decades
// shifts the whole test-time curve down by the decades forgone.
// The joint surface is AUTHORED: the o1 announcement published two SEPARATE
// charts with unlabeled relative compute axes, and no source states that the
// two axes obey one law with a shared slope. Page 13's fidelity note discloses
// this. Note also that the two exponents enter as a sum, so they substitute
// exactly (law(2,0) = law(0,2) = 21.0); the page must not claim otherwise.
export function twoAxisAccuracy(
  testExp: number,
  trainExp: number,
  intercept: number,
  slopePerDecade: number,
  maxTrainExp = 2,
  floor = 1,
): number {
  const y = intercept + slopePerDecade * (testExp - (maxTrainExp - trainExp));
  return Math.max(floor, y);
}

// --- Page 16: the bill comes due (rent vs sample vs retrain) ----------------
// Three ways to buy the same target accuracy on a stream of hard queries:
//   big     — rent a frontier reasoner, one call per query
//   sample  — rent a small reasoner and sample it N times per query, where N
//             follows Brown et al.'s log-linear coverage law and an imperfect
//             verifier caps the reachable ceiling (Stroebl et al.)
//   distill — pay a one-time retraining/distillation bill so the small model
//             answers at target in a single call, then serve at its cheap rate
// All functions are pure; the page derives per-query dollars from cited list
// prices and discloses the authored (Brown-shaped, Stroebl-capped) parameters.
export interface BillAnchors {
  /** $ per hard query on the rented frontier model (one call solves it). */
  bigPerQuery: number;
  /** $ per single sample of the small model. */
  smallPerSample: number;
  /** One-time retraining/distillation bill, $. */
  distillUSD: number;
  /** Small model's single-sample accuracy, %. */
  baseAcc: number;
  /** Accuracy points bought per 10x samples (log-linear coverage). */
  slopePerDecade: number;
  /** Verifier-limited ceiling, %: no number of samples reaches past it. */
  ceiling: number;
}

/** Samples the small model needs per query to hit `target`; null past the ceiling. */
export function samplesForTarget(target: number, a: BillAnchors): number | null {
  if (target >= a.ceiling) return null;
  const n = Math.pow(10, (target - a.baseAcc) / a.slopePerDecade);
  return Math.max(1, Math.ceil(n - 1e-9));
}

/** $ per query for each strategy at `target`. sample is null past the ceiling. */
export function perQueryCosts(
  target: number,
  a: BillAnchors,
): { big: number; sample: number | null; distilled: number } {
  const n = samplesForTarget(target, a);
  return {
    big: a.bigPerQuery,
    sample: n === null ? null : n * a.smallPerSample,
    distilled: a.smallPerSample,
  };
}

/** Cheapest pay-per-query rate: rent the big model, or sample the small one. */
export function rentPerQuery(target: number, a: BillAnchors): number {
  const c = perQueryCosts(target, a);
  return c.sample === null ? c.big : Math.min(c.big, c.sample);
}

/**
 * Total bills after `queries`: keep renting vs distill once then serve.
 *
 * THE DISTILL ARM ASSUMES THE RETRAIN LANDS ON THE TARGET, and nothing cited
 * establishes that. Renting and sampling both depend on `target` (sampling
 * needs more draws as it rises, and stops entirely at the ceiling); the distill
 * arm is a fixed bill plus one small-model call at any target you ask for. The
 * arithmetic is left as is because a capability bound for a distilled model is
 * not in any source this deck carries, so inventing one would be the larger
 * offence. The assumption is instead named wherever the number is shown:
 * Page16.tsx's distill card, its verdict banner, its chart label and its
 * disclosure, all of which went with the page on 2026-08-10. Nothing names the
 * assumption on screen any more, so if this arm is ever drawn again the naming
 * has to come back with it. If a measured bound ever arrives, gate it here.
 */
export function totalBills(
  queries: number,
  target: number,
  a: BillAnchors,
): { rent: number; distill: number } {
  return {
    rent: rentPerQuery(target, a) * queries,
    distill: a.distillUSD + a.smallPerSample * queries,
  };
}

/** Query volume past which owning undercuts renting; null if it never does. */
export function distillCrossover(target: number, a: BillAnchors): number | null {
  const margin = rentPerQuery(target, a) - a.smallPerSample;
  return margin > 0 ? a.distillUSD / margin : null;
}

/** Which strategy is cheapest at this volume and target. */
export function cheapestStrategy(
  queries: number,
  target: number,
  a: BillAnchors,
): "big" | "sample" | "distill" {
  const c = perQueryCosts(target, a);
  const rentBest: "big" | "sample" = c.sample !== null && c.sample <= c.big ? "sample" : "big";
  const bills = totalBills(queries, target, a);
  return bills.distill < bills.rent ? "distill" : rentBest;
}


// --- Page 18: chain-of-thought faithfulness --------------------------------
// Over many trials the model USES an injected hint but only ADMITS it with the
// reported probability. The Monte Carlo "confession meter" converges there.
export function faithfulnessAdmitRate(admitProb: number, trials: number, seed: number): number {
  const rng = createRng(seed);
  let admitted = 0;
  for (let t = 0; t < trials; t++) {
    if (rng() < admitProb) admitted += 1;
  }
  return (admitted / trials) * 100;
}

// --- Page 18: optimization pressure on the CoT (obfuscation) ---------------
// Baker et al. 2025: grade the thoughts themselves and task reward keeps
// climbing while the monitor goes blind. Endpoint recalls are the paper's
// (95% -> ~0%); the shapes between them are authored illustrations
// (data/cot-obfuscation.json documents both).
/** Task reward climbs smoothly and saturates as pressure rises (unitless). */
export function cotPressureReward(pressure: number, start: number, end: number): number {
  return start + (end - start) * (1 - Math.exp(-pressure / 3));
}
/** Monitor recall holds near its no-pressure value, then collapses past the cliff. */
export function cotPressureRecall(
  pressure: number,
  baseRecall: number,
  cliff: number,
  steep: number,
): number {
  return baseRecall / (1 + Math.exp(steep * (pressure - cliff)));
}
