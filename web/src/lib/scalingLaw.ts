/**
 * The training scaling law page 3 opens on: Chinchilla's parametric loss,
 * L(N, D) = E + A/N^alpha + B/D^beta, with the constants Besiroglu et al. 2024
 * re-estimated (data/chinchilla-loss-fit.json), and training compute
 * approximated as C = 6ND FLOPs.
 *
 * Everything the iso-compute explorer draws comes from these functions: the
 * U-shaped loss along one budget, that curve's lowest point (the compute-optimal
 * split), and the gain each tenfold budget buys.
 */
import { curves } from "./curves";

const P = curves.chinchillaLossFit.fit!.params;

/** Predicted loss for a model of N parameters trained on D tokens. */
export function chinchillaLoss(N: number, D: number): number {
  return P.E + P.A / N ** P.alpha + P.B / D ** P.beta;
}

/** Training tokens a budget of C FLOPs affords a model of N parameters. */
export function tokensFor(C: number, N: number): number {
  return C / (P.flopsPerParamToken * N);
}

/** Loss along one budget, as a function of model size. */
export function lossAtBudget(C: number, N: number): number {
  return chinchillaLoss(N, tokensFor(C, N));
}

/**
 * The compute-optimal split for a budget: the model size where the loss along
 * that budget is lowest. Golden-section search on log10(N); the curve is
 * unimodal there, so this converges to the true minimum.
 */
export function optimumAt(C: number): { N: number; D: number; loss: number } {
  let lo = 6;
  let hi = 14;
  const f = (x: number) => lossAtBudget(C, 10 ** x);
  const g = (Math.sqrt(5) - 1) / 2;
  let c = hi - g * (hi - lo);
  let d = lo + g * (hi - lo);
  for (let k = 0; k < 80; k++) {
    if (f(c) < f(d)) hi = d;
    else lo = c;
    c = hi - g * (hi - lo);
    d = lo + g * (hi - lo);
  }
  const N = 10 ** ((lo + hi) / 2);
  const D = tokensFor(C, N);
  return { N, D, loss: chinchillaLoss(N, D) };
}

/** The budgets the explorer offers: six, each ten times the last, in FLOPs. */
export const ISO_BUDGETS = [1e20, 1e21, 1e22, 1e23, 1e24, 1e25] as const;
