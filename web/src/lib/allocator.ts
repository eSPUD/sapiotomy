/**
 * Page 11: the two-knob compute allocator.
 *
 * An AUTHORED, illustrative accuracy model — closed-form, no randomness — whose
 * SHAPE follows the findings of Snell et al. 2024 ("Scaling LLM Test-Time
 * Compute Optimally can be More Effective than Scaling Model Parameters",
 * arXiv:2408.03314):
 *
 *   - at matched FLOPs, test-time compute can beat a model ~14x the base
 *     model's parameter count on problems the base model already solves some
 *     of the time (here: easy and medium);
 *   - on the hardest problems, no sample budget closes the gap, because
 *     accuracy flattens out below the larger model's one-shot score (here:
 *     hard), so the pretraining FLOPs of a bigger model buy more;
 *   - sampling gains flatten toward a per-model ceiling (the convergence
 *     limit analyzed by Wu et al. 2024, arXiv:2408.00724).
 *
 * No published per-difficulty curve fixes these exact numbers; what is cited
 * is the shape and the 14x anchor. Every constant below is pinned by tests.
 *
 * Units. Snell et al. never disclose absolute parameter counts (the base model
 * is PaLM 2-S*, size unpublished); their comparison is an exchange rate: Mx
 * the parameters means Mx the inference FLOPs per answer, and Mx the
 * pretraining FLOPs. So the knob here speaks in multiples of the base model,
 * and the FLOPs unit is "one answer from the 1x model": one answer from an Sx
 * model costs S units, k sampled answers cost S*k units, and the 14x model
 * answering once — the target the reader tries to beat — sits at 14 units.
 */

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** Model-size knob detents, as multiples of the small model's parameters. */
export const MODEL_SIZES = [1, 2, 4, 14] as const;

/** Test-time knob: samples are powers of two, 2^0 .. 2^MAX_EXP. */
export const MAX_EXP = 8;

/** The big model the reader tries to beat: 14x parameters, one answer. */
export const BIG_MODEL = 14;

interface DifficultyParams {
  /** pass@1 of the 1x model (%) — a real foothold on easy/medium only. */
  pass1Small: number;
  /** pass@1 of the 14x model (%) — the target line. */
  pass1Big: number;
  /** Sampling ceiling of the 1x model (%) — where extra samples saturate. */
  capSmall: number;
  /** Sampling ceiling of the 14x model (%). */
  capBig: number;
  /** Convergence rate toward the ceiling; hard problems converge slowest. */
  gamma: number;
}

export const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { pass1Small: 72, pass1Big: 88, capSmall: 94, capBig: 99, gamma: 1.0 },
  medium: { pass1Small: 30, pass1Big: 62, capSmall: 75, capBig: 90, gamma: 0.65 },
  hard: { pass1Small: 2, pass1Big: 28, capSmall: 14, capBig: 56, gamma: 0.35 },
};

/** Interpolation weight for a model of size S in [1, 14]: log-linear in S. */
function sizeWeight(size: number): number {
  return Math.log(size) / Math.log(BIG_MODEL);
}

/** pass@1 (%) of an Sx model — accuracy with one answer, no extra thinking. */
export function pass1(d: Difficulty, size: number): number {
  const p = DIFFICULTY_PARAMS[d];
  return p.pass1Small + (p.pass1Big - p.pass1Small) * sizeWeight(size);
}

/** Sampling ceiling (%) of an Sx model — what no test-time budget exceeds. */
export function ceiling(d: Difficulty, size: number): number {
  const p = DIFFICULTY_PARAMS[d];
  return p.capSmall + (p.capBig - p.capSmall) * sizeWeight(size);
}

/**
 * Accuracy (%) of an Sx model drawing k samples with best-known selection:
 * starts at pass@1, converges toward the ceiling as k^(-gamma).
 */
export function accuracy(d: Difficulty, size: number, k: number): number {
  const cap = ceiling(d, size);
  return cap - (cap - pass1(d, size)) * Math.pow(k, -DIFFICULTY_PARAMS[d].gamma);
}

/** Inference FLOPs, in units of one answer from the 1x model. */
export function flopsOf(size: number, k: number): number {
  return size * k;
}

/** The score to beat: the 14x model answering once (at BIG_MODEL FLOPs units). */
export function target(d: Difficulty): number {
  return DIFFICULTY_PARAMS[d].pass1Big;
}

/**
 * The full trajectory of an Sx model as the test-time knob turns: one point
 * per power-of-two sample count, in FLOPs units on x. Drawn in full on the
 * page; the knobs only move a marker along it.
 */
export function curvePoints(d: Difficulty, size: number): { x: number; y: number }[] {
  return Array.from({ length: MAX_EXP + 1 }, (_, e) => ({
    x: flopsOf(size, 2 ** e),
    y: accuracy(d, size, 2 ** e),
  }));
}

/**
 * Smallest power-of-two sample count at which an Sx model reaches the target,
 * or null if its ceiling never gets there (the hardest-problems regime).
 */
export function cheapestWin(d: Difficulty, size: number): number | null {
  for (let e = 0; e <= MAX_EXP; e++) {
    const k = 2 ** e;
    if (accuracy(d, size, k) >= target(d)) return k;
  }
  return null;
}
