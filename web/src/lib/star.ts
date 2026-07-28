/**
 * Page 12 — the STaR self-improvement loop, as a mechanism the reader can turn
 * over by hand (Zelikman et al. 2022, arXiv:2203.14465).
 *
 * One iteration, exactly as the page states it: the model writes a rationale
 * for every problem in the pool, an answer key KEEPS the rationales that reach
 * the right answer, and the base model is fine-tuned on what was kept. Nothing
 * accumulates across iterations — each round regenerates from the current
 * model, as in the paper — so the ratchet lives entirely in the growing skill:
 * a better model writes correct rationales for harder problems, which makes a
 * better training set, which makes a better model.
 *
 * The pool is 60 problems with evenly spread difficulties. Whether the model
 * can write a correct rationale for problem i is a fixed per-problem threshold
 * draw (seeded once, never resampled): solvable iff pSolve(skill, d_i) > u_i.
 * Monotone in skill, so the solved set only ever grows while skill grows, and
 * the run is exactly reproducible for the tests.
 *
 * Three levers, three behaviours the page teaches:
 *  - filter ON  → skill climbs to a plateau: the problems the model can never
 *    solve unaided never enter the training set, so the loop saturates.
 *  - rationalize ON → for each missed problem the model is shown the answer
 *    and reasons backwards; a hint boost lets harder problems into the set, so
 *    the plateau moves up (the paper's 68.8% → 72.5%).
 *  - filter OFF → every rationale trains, right or wrong. Wrong rationales
 *    push skill DOWN, which makes the next generation worse, which makes the
 *    next training set worse: the collapse Page 16 returns to.
 *
 * Illustrative mechanism, not a digitized curve — the published numbers live
 * in data/star-cqa.json and are only ever quoted verbatim.
 */
import { createRng } from "./rng";

/** Answer choices per problem (CommonsenseQA-style 5-way): chance = 20%. */
export const STAR_CHOICES = 5;
/** Problems in the training pool. */
export const STAR_POOL = 60;
/** arXiv id of Zelikman et al. 2022 (2203.14465) — a stable, documented seed. */
export const STAR_SEED = 220314465;
/** The reader may run this many iterations before the page asks for a reset. */
export const STAR_MAX_ITERS = 12;

/* Mechanism constants (tuned for a legible trajectory, pinned by the tests). */
const SKILL_0 = 0.15; // the pretrained model, before any self-training
const STEEP = 8; // how sharply solvability falls off with difficulty
const LEARN = 0.75; // fine-tuning gain per unit of (clean) training signal
const HINT = 0.3; // rationalization's difficulty boost from seeing the answer
const HINT_WEIGHT = 0.5; // a hinted rationale is a weaker training signal
const BAD = 0.8; // how hard a wrong rationale in the set pulls skill down
const BLEND = 0.6; // per-iteration approach toward the fine-tuning target
const SKILL_MIN = -0.25;
const SKILL_MAX = 1.5;

export type ProblemStatus = "unsolved" | "verified" | "rationalized" | "wrong";

export interface StarPool {
  /** Difficulty of each problem, evenly spread over (0, 1), easy → hard. */
  difficulty: number[];
  /** Fixed per-problem solvability threshold, drawn once from the seed. */
  threshold: number[];
}

export interface StarStepOptions {
  /** Keep only rationales whose answer matches the key (STaR's filter). */
  filter: boolean;
  /** Show missed problems the answer and let the model reason backwards. */
  rationalize: boolean;
}

export interface StarIteration {
  /** Model skill after fine-tuning on this iteration's kept rationales. */
  skill: number;
  /** Held-out accuracy (%) of the fine-tuned model. */
  accuracy: number;
  /** What this iteration's generation contributed, per problem. */
  status: ProblemStatus[];
  /** Correct rationales the model wrote unaided. */
  verified: number;
  /** Missed problems recovered by reasoning backwards from the answer. */
  rationalized: number;
  /** Wrong rationales that entered the training set (0 while filtering). */
  wrong: number;
}

export function starInit(seed: number = STAR_SEED): StarPool {
  const rng = createRng(seed);
  const difficulty = Array.from({ length: STAR_POOL }, (_, i) => (i + 0.5) / STAR_POOL);
  const threshold = difficulty.map(() => rng());
  return { difficulty, threshold };
}

/** Probability of writing a correct rationale, given skill and difficulty. */
function pSolve(skill: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-STEEP * (skill - difficulty)));
}

/**
 * Held-out accuracy of a model with the given skill: a correct rationale ends
 * in the right answer; a wrong one leaves a 5-way guess.
 */
export function starAccuracy(pool: StarPool, skill: number): number {
  const chance = 1 / STAR_CHOICES;
  const mean =
    pool.difficulty.reduce((acc, d) => {
      const p = pSolve(skill, d);
      return acc + p + (1 - p) * chance;
    }, 0) / pool.difficulty.length;
  return mean * 100;
}

/** The pretrained model, before the loop has run at all. */
export function starBase(pool: StarPool): StarIteration {
  return {
    skill: SKILL_0,
    accuracy: starAccuracy(pool, SKILL_0),
    status: pool.difficulty.map(() => "unsolved"),
    verified: 0,
    rationalized: 0,
    wrong: 0,
  };
}

/**
 * One STaR iteration: generate on the whole pool with the current model,
 * filter (or don't), fine-tune the BASE model on what was kept.
 */
export function starStep(
  pool: StarPool,
  prev: Pick<StarIteration, "skill">,
  opts: StarStepOptions,
): StarIteration {
  const n = pool.difficulty.length;
  const status: ProblemStatus[] = new Array(n);
  let verified = 0;
  let rationalized = 0;
  let wrong = 0;

  for (let i = 0; i < n; i++) {
    const solved = pSolve(prev.skill, pool.difficulty[i]) > pool.threshold[i];
    if (solved) {
      status[i] = "verified";
      verified++;
    } else if (!opts.filter) {
      // No answer key: the wrong rationale goes straight into the set.
      status[i] = "wrong";
      wrong++;
    } else if (
      opts.rationalize &&
      pSolve(prev.skill + HINT, pool.difficulty[i]) > pool.threshold[i]
    ) {
      status[i] = "rationalized";
      rationalized++;
    } else {
      status[i] = "unsolved";
    }
  }

  // Fine-tune from the base model on this iteration's set. Clean examples add
  // signal, wrong ones subtract it; skill moves partway toward that target.
  const signal = (verified + HINT_WEIGHT * rationalized - BAD * wrong) / n;
  const target = SKILL_0 + LEARN * signal;
  const skill = Math.min(
    SKILL_MAX,
    Math.max(SKILL_MIN, prev.skill + BLEND * (target - prev.skill)),
  );

  return { skill, accuracy: starAccuracy(pool, skill), status, verified, rationalized, wrong };
}
