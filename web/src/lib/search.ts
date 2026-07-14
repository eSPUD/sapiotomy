/**
 * Simulations for Act 2 part 2 (search, scaling laws, allocation).
 * Pure + seeded so every result is deterministically testable.
 */
import { createRng } from "./rng";

// --- Page 11: toy MCTS on a one-step multi-armed decision ------------------
// Illustrative (not a published curve): a tiny game where the agent must pick
// the best of K arms whose true values are known. PUCT-style selection with N
// simulated rollouts. More rollouts -> more reliably picks the best arm ->
// higher expected move quality.

export interface ToyGame {
  /** True (unknown to the agent) value of each arm, in [0, 1]. */
  armValues: number[];
}

/** Run `budget` rollouts of PUCT selection; return the chosen arm index. */
export function toyMctsChoose(game: ToyGame, budget: number, seed: number): number {
  const rng = createRng(seed);
  const k = game.armValues.length;
  const visits = new Array(k).fill(0);
  const value = new Array(k).fill(0); // running mean reward
  const c = 1.4; // exploration constant
  const prior = 1 / k;

  for (let t = 0; t < budget; t++) {
    const totalVisits = t + 1;
    let best = 0;
    let bestScore = -Infinity;
    for (let a = 0; a < k; a++) {
      // PUCT: Q(a) + c * P(a) * sqrt(total) / (1 + N(a))
      const q = visits[a] === 0 ? 0 : value[a];
      const u = c * prior * Math.sqrt(totalVisits) / (1 + visits[a]);
      const score = q + u;
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    // simulate a noisy reward for the chosen arm
    const reward = Math.max(0, Math.min(1, game.armValues[best] + (rng() - 0.5) * 0.3));
    visits[best] += 1;
    value[best] += (reward - value[best]) / visits[best];
  }

  // final move = most-visited arm
  let move = 0;
  for (let a = 1; a < k; a++) if (visits[a] > visits[move]) move = a;
  return move;
}

/** Expected move quality (true value of the chosen arm) over many seeds. */
export function toyMctsQuality(game: ToyGame, budget: number, runs: number, seed: number): number {
  let sum = 0;
  for (let r = 0; r < runs; r++) {
    const move = toyMctsChoose(game, budget, seed + r * 101);
    sum += game.armValues[move];
  }
  return sum / runs;
}

// --- Page 12: log-linear coverage scaling ----------------------------------
// coverage(k) = intercept + slopePerDecade * log10(k), clamped to [0, 100].
export function logLinearCoverage(k: number, intercept: number, slopePerDecade: number): number {
  const y = intercept + slopePerDecade * Math.log10(Math.max(1, k));
  return Math.max(0, Math.min(100, y));
}

// --- Page 13: compute-optimal allocation game ------------------------------
// Three difficulty bins. Accuracy gain from thinking budget is difficulty-
// dependent and concave (diminishing returns):
//   - easy  : starts high, extra thinking barely helps (and eventually over-thinks)
//   - medium: the sweet spot — thinking helps most here
//   - hard  : low ceiling — thinking helps only a little
export type Difficulty = "easy" | "medium" | "hard";

interface BinParams {
  base: number; // accuracy at zero extra budget
  gain: number; // max additional accuracy from budget
  rate: number; // how quickly the gain saturates
}

export const BIN_PARAMS: Record<Difficulty, BinParams> = {
  easy: { base: 0.85, gain: 0.1, rate: 1.2 },
  medium: { base: 0.35, gain: 0.5, rate: 0.5 },
  hard: { base: 0.1, gain: 0.2, rate: 0.3 },
};

/** Accuracy on a bin given a non-negative thinking budget. */
export function binAccuracy(d: Difficulty, budget: number): number {
  const p = BIN_PARAMS[d];
  return p.base + p.gain * (1 - Math.exp(-p.rate * budget));
}

export interface Allocation {
  easy: number;
  medium: number;
  hard: number;
}

/** Mean accuracy across the three (equally weighted) bins for an allocation. */
export function allocationScore(a: Allocation): number {
  return (
    (binAccuracy("easy", a.easy) + binAccuracy("medium", a.medium) + binAccuracy("hard", a.hard)) /
    3
  );
}

/** Best allocation of a fixed integer total budget (grid search). */
export function optimalAllocation(total: number): Allocation {
  let best: Allocation = { easy: total, medium: 0, hard: 0 };
  let bestScore = -Infinity;
  for (let e = 0; e <= total; e++) {
    for (let m = 0; m <= total - e; m++) {
      const h = total - e - m;
      const score = allocationScore({ easy: e, medium: m, hard: h });
      if (score > bestScore) {
        bestScore = score;
        best = { easy: e, medium: m, hard: h };
      }
    }
  }
  return best;
}
