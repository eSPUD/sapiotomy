/**
 * Simulations for Act 3 (frontier & caveats). Pure + seeded.
 */
import { createRng } from "./rng";

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
