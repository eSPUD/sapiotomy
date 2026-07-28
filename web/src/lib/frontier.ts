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

// --- Page 19: Tower of Hanoi token explosion -------------------------------
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
