/**
 * Core simulation primitives shared by the app (via Web Workers) and the tests.
 *
 * Keeping the math in pure, importable functions means the Web Worker is a thin
 * wrapper and every result is unit-testable deterministically with a seeded RNG.
 */
import { bernoulli, createRng } from "./rng";

// ---------------------------------------------------------------------------
// Self-consistency / majority vote (Page 6) — calibrated to Wang et al. 2022.
//
// Anchor: on GSM8K, self-consistency improves single-chain CoT from 56.5% to
// 74.4% (a +17.9-point gain) for PaLM-540B-class models.
//
// Two-population model (keeps the vote-accuracy curve monotonic with clean,
// testable endpoints):
//   - A fraction `solvableFraction` of questions are "solvable": the CORRECT
//     answer is the model's true modal answer, so majority voting converges to
//     it. On these, each sample is correct with prob `pCorrect`; the rest of the
//     mass is spread over `distractors` wrong answers.
//   - The remaining questions are "unsolvable": a wrong answer is modal, so
//     majority voting never recovers them (they contribute 0 at every budget).
//
// Endpoints: at n=1, accuracy = solvableFraction * pCorrect = 0.744 * 0.759 =
// 0.565. As n → ∞, accuracy → solvableFraction = 0.744. Delta = +17.9. ✔
// ---------------------------------------------------------------------------

export interface VoteModel {
  pCorrect: number;
  distractors: number;
  solvableFraction: number;
}

export const SELF_CONSISTENCY_MODEL: VoteModel = {
  pCorrect: 0.759,
  distractors: 3,
  solvableFraction: 0.744,
};

/** Answer index for one sample on a solvable question: 0 = correct, 1..D = distractor. */
function sampleAnswer(rng: () => number, model: VoteModel): number {
  const r = rng();
  if (r < model.pCorrect) return 0;
  const each = (1 - model.pCorrect) / model.distractors;
  const idx = 1 + Math.floor((r - model.pCorrect) / each);
  return Math.min(idx, model.distractors); // guard against float edge at r→1
}

export interface Ballot {
  tally: number[]; // index 0 = correct answer
  winner: number; // index of the plurality winner (ties broken randomly)
  correctIsPlurality: boolean;
}

/**
 * Cast n votes on one solvable question and tally them. Ties for the top spot
 * are broken uniformly at random (standard self-consistency), which keeps the
 * accuracy curve monotonic — strict plurality would spuriously dip on even n.
 */
export function voteOnce(rng: () => number, model: VoteModel, n: number): Ballot {
  const tally = new Array(model.distractors + 1).fill(0);
  for (let i = 0; i < n; i++) tally[sampleAnswer(rng, model)] += 1;
  const max = Math.max(...tally);
  const top: number[] = [];
  for (let i = 0; i < tally.length; i++) if (tally[i] === max) top.push(i);
  const winner = top.length === 1 ? top[0] : top[Math.floor(rng() * top.length)];
  return { tally, winner, correctIsPlurality: winner === 0 };
}

/** Population majority-vote accuracy at sample budget n (seeded Monte Carlo). */
export function selfConsistencyAccuracy(
  n: number,
  trials: number,
  seed: number,
  model: VoteModel = SELF_CONSISTENCY_MODEL,
): number {
  const rng = createRng(seed);
  let correct = 0;
  for (let t = 0; t < trials; t++) {
    if (voteOnce(rng, model, n).correctIsPlurality) correct += 1;
  }
  return model.solvableFraction * (correct / trials);
}

/** The whole accuracy-vs-samples curve (as percentages) for a set of budgets. */
export function selfConsistencyCurve(
  ns: number[],
  trials: number,
  seed: number,
  model: VoteModel = SELF_CONSISTENCY_MODEL,
): { x: number; y: number }[] {
  // Shared seed across budgets → trials are correlated, so the curve is smooth
  // and monotonic (no cross-point Monte Carlo jitter) rather than noisy.
  return ns.map((n) => ({
    x: n,
    y: selfConsistencyAccuracy(n, trials, seed, model) * 100,
  }));
}

/** One representative ballot on a solvable question (for the histogram viz). */
export function representativeBallot(
  n: number,
  seed: number,
  model: VoteModel = SELF_CONSISTENCY_MODEL,
): Ballot {
  return voteOnce(createRng(seed), model, n);
}

/**
 * Closed-form coverage: probability that AT LEAST ONE of n independent samples
 * (each correct with probability p) is correct. Introduced on Page 5.
 */
export function coverageAtLeastOne(p: number, n: number): number {
  if (n <= 0) return 0;
  return 1 - Math.pow(1 - p, n);
}

/**
 * Seeded Monte Carlo estimate of the same coverage, used to demonstrate that
 * the "live" simulation converges to the closed form. Deterministic per seed.
 */
export function coverageMonteCarlo(
  p: number,
  n: number,
  trials: number,
  seed: number,
): number {
  const rng = createRng(seed);
  let solved = 0;
  for (let t = 0; t < trials; t++) {
    let any = false;
    for (let i = 0; i < n; i++) {
      if (bernoulli(rng, p)) {
        any = true;
      }
    }
    if (any) solved++;
  }
  return solved / trials;
}
