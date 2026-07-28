/**
 * Simulations for Act 3 (frontier & caveats). Pure + seeded.
 */
import { createRng } from "./rng";

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

// --- Page 18: overthinking inverse-U ---------------------------------------
// A smooth hump: accuracy rises to a peak at `peak`, then falls. Easy problems
// peak at a lower thinking-length than hard ones.
export function inverseU(length: number, peak: number, peakAcc: number, curvature: number): number {
  const y = peakAcc - curvature * Math.pow(length - peak, 2);
  return Math.max(0, y);
}

// --- Page 19: chain-of-thought faithfulness --------------------------------
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
