/**
 * Simulations for Act 3 (frontier & caveats). Pure + seeded.
 */
import { createRng } from "./rng";

// --- Page 13: o1's two-axis log-linear scaling ------------------------------
// One law, two knobs. Accuracy is log-linear in test-time compute AND in
// train-time RL compute: a decade of either buys the same `slopePerDecade`
// points. `intercept` is the accuracy at 1 relative unit of thinking on the
// fully-trained run; pulling train-time compute below `maxTrainExp` decades
// shifts the whole test-time curve down by the decades forgone.
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

/** Total bills after `queries`: keep renting vs distill once then serve. */
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

// --- Page 17: self-correction with and without an external check ------------
// Each problem is in one of three states: UNSOLVED (the model has not reached
// the answer yet), CORRECT, or BROKEN (it had the answer and revised it away).
// Every extra pass moves mass between them: unsolved problems get solved at
// `solveProb`, correct answers are second-guessed into wrong ones at
// `breakProb`, and broken answers are repaired at only `fixProb` — the
// published asymmetry (correct->wrong flips outnumber wrong->correct). Because
// solveProb >> fixProb, accuracy overshoots: it climbs while the unsolved pool
// drains, peaks, then leaks into BROKEN with almost no way back. An external
// verifier reviews every proposed change and judges it correctly with
// probability `reliability`, scaling breakProb down and leaving fixProb mostly
// intact — the cliff flattens into a plateau, capped below (1 - unsolvable) by
// the bad edits the verifier waves through.
export interface SelfCorrectionOptions {
  /** Per-pass chance a solvable, still-unsolved problem is first solved. */
  solveProb: number;
  /** Per-pass chance a correct answer is second-guessed into a wrong one. */
  breakProb: number;
  /** Per-pass chance a broken answer is genuinely repaired. */
  fixProb: number;
  /** Fraction of problems out of the model's reach at any budget. */
  unsolvable: number;
  /** Probability the external check judges a change correctly; null = unaided. */
  reliability: number | null;
}

export const SELF_CORRECTION = {
  solveProb: 0.45,
  breakProb: 0.1,
  fixProb: 0.03,
  unsolvable: 0.15,
  reliability: 0.9,
  maxSteps: 12,
} as const;

/** Accuracy (%) after 0..maxSteps extra revision passes — the exact chain. */
export function selfCorrectionCurve(
  maxSteps: number,
  o: SelfCorrectionOptions,
): { x: number; y: number }[] {
  const brk = o.reliability === null ? o.breakProb : o.breakProb * (1 - o.reliability);
  const fix = o.reliability === null ? o.fixProb : o.fixProb * o.reliability;
  let unsolved = (1 - o.unsolvable) * (1 - o.solveProb);
  let correct = (1 - o.unsolvable) * o.solveProb;
  let broken = 0;
  const out = [{ x: 0, y: correct * 100 }];
  for (let t = 1; t <= maxSteps; t++) {
    const solvedNow = unsolved * o.solveProb;
    const brokenNow = correct * brk;
    const repairedNow = broken * fix;
    unsolved -= solvedNow;
    correct += solvedNow + repairedNow - brokenNow;
    broken += brokenNow - repairedNow;
    out.push({ x: t, y: correct * 100 });
  }
  return out;
}

// --- Page 17: overthinking inverse-U ---------------------------------------
// A smooth hump: accuracy rises to a peak at `peak`, then falls. Easy problems
// peak at a lower thinking-length than hard ones.
export function inverseU(length: number, peak: number, peakAcc: number, curvature: number): number {
  const y = peakAcc - curvature * Math.pow(length - peak, 2);
  return Math.max(0, y);
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

// --- Page 20: Tower of Hanoi token explosion -------------------------------
export function hanoiMoves(n: number): number {
  return Math.pow(2, n) - 1;
}
export function hanoiTokens(n: number, tokensPerMove: number): number {
  return hanoiMoves(n) * tokensPerMove;
}
/** Under ENUMERATION scoring, the model "fails" once its output exceeds budget. */
export function enumerationSolved(n: number, tokensPerMove: number, tokenBudget: number): boolean {
  return hanoiTokens(n, tokensPerMove) <= tokenBudget;
}
/** Under ALGORITHM scoring, the model can state the (correct) recursive rule. */
export function algorithmSolved(): boolean {
  return true;
}
