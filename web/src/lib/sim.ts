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

// ---------------------------------------------------------------------------
// Best-of-N selection (Page 8) — random vs. majority vs. verifier.
//
// Honest Monte Carlo: each question yields N candidates, each correct with
// probability `p`; correct candidates share the correct answer, wrong ones each
// pick one of `distractors` wrong answers. Three selection strategies are then
// scored on the same candidates:
//   - random  : pick a candidate uniformly            → accuracy ≈ p
//   - majority : plurality vote over the answers       → rises with N
//   - verifier : score each candidate (reliability r), pick argmax → best
// ---------------------------------------------------------------------------
export interface BestOfNModel {
  p: number;
  distractors: number;
  verifierReliability: number;
}

export interface BestOfNResult {
  random: number;
  majority: number;
  verifier: number;
}

export function bestOfN(
  n: number,
  trials: number,
  seed: number,
  model: BestOfNModel,
): BestOfNResult {
  const rng = createRng(seed);
  let random = 0;
  let majority = 0;
  let verifier = 0;

  for (let t = 0; t < trials; t++) {
    const correct: boolean[] = [];
    const answers: number[] = [];
    for (let i = 0; i < n; i++) {
      const isCorrect = bernoulli(rng, model.p);
      correct.push(isCorrect);
      answers.push(isCorrect ? 0 : 1 + Math.floor(rng() * model.distractors));
    }

    // random pick
    if (correct[Math.floor(rng() * n)]) random += 1;

    // majority vote (random tie-break)
    const tally = new Array(model.distractors + 1).fill(0);
    for (const a of answers) tally[a] += 1;
    const max = Math.max(...tally);
    const top: number[] = [];
    for (let i = 0; i < tally.length; i++) if (tally[i] === max) top.push(i);
    const winner = top.length === 1 ? top[0] : top[Math.floor(rng() * top.length)];
    if (winner === 0) majority += 1;

    // verifier: score = correctness blended with noise by (1 - reliability)
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < n; i++) {
      const score = (correct[i] ? 1 : 0) * model.verifierReliability + rng() * (1 - model.verifierReliability);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (correct[bestIdx]) verifier += 1;
  }

  return { random: (random / trials) * 100, majority: (majority / trials) * 100, verifier: (verifier / trials) * 100 };
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

/** A seeded grid of n attempts (true = correct) for the avatar viz on Page 5. */
export function sampleGrid(p: number, n: number, seed: number): boolean[] {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => bernoulli(rng, p));
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

// ---------------------------------------------------------------------------
// The sampling chamber (Page 7) — the anchored vote model, plus a temperature
// dial.
//
// Temperature is NOT in Wang et al.'s reported numbers, so it is modelled here
// in two regimes that each say something true, and the model is pinned so that
// AT the reference temperature it reduces exactly to the anchored curve above
// (56.5% at n=1 -> 74.4% as n grows). The page labels the dial illustrative.
//
//   Below the reference temperature — DUPLICATION. Sampling colder does not
//   make each chain better; it makes the chains the SAME chain. `diversity`
//   falls linearly to 0, and a duplicated chain is a copy of the first one, so
//   at temperature 0 all n votes are one vote and the curve is flat at the
//   single-chain rate. This is the page's main lesson: no diversity, no vote.
//   (Note what is deliberately NOT done here: the answer distribution is never
//   SHARPENED toward its mode as t -> 0. Greedy decoding follows the most
//   likely token path, which is not the same as the most likely ANSWER — that
//   gap is why self-consistency beats greedy at all, and collapsing to the
//   modal answer would erase the very effect being taught.)
//
//   Above it — FLATTENING. The answer distribution is re-normalised with
//   exponent (referenceTemp / t) < 1, spreading mass off the correct answer
//   onto the distractors. Voting still converges, but from a lower start and
//   more slowly: hotter chains are more diverse and individually worse.
// ---------------------------------------------------------------------------

export interface ChamberModel extends VoteModel {
  /** The temperature at which this model reproduces the cited curve. */
  referenceTemp: number;
}

export const CHAMBER_MODEL: ChamberModel = {
  ...SELF_CONSISTENCY_MODEL,
  referenceTemp: 0.7,
};

/** Answer probabilities at a temperature: base at or below reference, flattened above. */
export function chamberProbs(model: ChamberModel, temperature: number): number[] {
  const each = (1 - model.pCorrect) / model.distractors;
  const base = [model.pCorrect, ...new Array<number>(model.distractors).fill(each)];
  const t = Math.max(0, temperature);
  if (t <= model.referenceTemp) return base;
  const exponent = model.referenceTemp / t; // < 1 → flatten toward uniform
  const raw = base.map((p) => Math.pow(p, exponent));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => p / sum);
}

/** Fraction of votes that are genuinely independent chains rather than copies. */
export function chamberDiversity(model: ChamberModel, temperature: number): number {
  return Math.max(0, Math.min(1, temperature / model.referenceTemp));
}

function drawIndex(rng: () => number, probs: number[]): number {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

export interface ChamberBallot extends Ballot {
  /** The answer index each of the n votes landed on, in sampling order. */
  draws: number[];
  /** Which votes were duplicates of the first chain rather than fresh chains. */
  duplicated: boolean[];
}

/** Cast n votes on one solvable question at a given temperature. */
export function chamberVote(
  rng: () => number,
  model: ChamberModel,
  n: number,
  temperature: number,
): ChamberBallot {
  const probs = chamberProbs(model, temperature);
  const diversity = chamberDiversity(model, temperature);

  const first = drawIndex(rng, probs);
  const draws = [first];
  const duplicated = [false];
  for (let i = 1; i < n; i++) {
    const fresh = rng() < diversity;
    duplicated.push(!fresh);
    draws.push(fresh ? drawIndex(rng, probs) : first);
  }

  const tally = new Array(model.distractors + 1).fill(0);
  for (const d of draws) tally[d] += 1;
  const max = Math.max(...tally);
  const top: number[] = [];
  for (let i = 0; i < tally.length; i++) if (tally[i] === max) top.push(i);
  const winner = top.length === 1 ? top[0] : top[Math.floor(rng() * top.length)];

  return { draws, duplicated, tally, winner, correctIsPlurality: winner === 0 };
}

/** Population majority-vote accuracy at n votes and a temperature (percent). */
export function chamberAccuracy(
  n: number,
  temperature: number,
  trials: number,
  seed: number,
  model: ChamberModel = CHAMBER_MODEL,
): number {
  const rng = createRng(seed);
  let correct = 0;
  for (let t = 0; t < trials; t++) {
    if (chamberVote(rng, model, n, temperature).correctIsPlurality) correct += 1;
  }
  return model.solvableFraction * (correct / trials) * 100;
}

/** The whole accuracy-vs-votes curve at one temperature (percentages). */
export function chamberCurve(
  ns: number[],
  temperature: number,
  trials: number,
  seed: number,
  model: ChamberModel = CHAMBER_MODEL,
): { x: number; y: number }[] {
  // One shared seed across budgets keeps the curve smooth rather than jittery.
  return ns.map((n) => ({ x: n, y: chamberAccuracy(n, temperature, trials, seed, model) }));
}

/** One representative ballot to render as chains in the chamber. */
export function representativeChamberBallot(
  n: number,
  temperature: number,
  seed: number,
  model: ChamberModel = CHAMBER_MODEL,
): ChamberBallot {
  return chamberVote(createRng(seed), model, n, temperature);
}

// ---------------------------------------------------------------------------
// Generate-then-select (Page 8) — majority vote vs. a scoring verifier, on the
// SAME candidates, with a verifier that can be corrupted.
//
// The regime that matters is the one where the wrong answer is the POPULAR one
// (the bat-and-ball attractor): majority voting then gets worse as N grows,
// while any selector that can recognise a correct answer gets better. So the
// model carries an explicit answer distribution rather than a single p.
//
// The verifier's score blends two things:
//   - correctness, weighted by `reliability` — what a good judge reads;
//   - `appeal`, weighted by (1 - reliability) — the superficial feature a bad
//     judge latches onto instead (fluency, confidence, familiarity). Crucially
//     the attractor answer is the MOST appealing, so a corrupted verifier does
//     not merely go random, it goes confidently wrong — the "judge grading the
//     wrong criterion" failure, which is the point of Stroebl et al. 2024.
//
// Per-candidate noise makes the degradation gradual rather than a step, and
// produces the imperfect-verifier effect on its own: with more candidates there
// are more chances for a wrong one to score luckily high, so a weak verifier
// gets WORSE as N grows.
// ---------------------------------------------------------------------------

export interface SelectionModel {
  /** Probability mass per answer index; index 0 is the correct answer. */
  answerProbs: readonly number[];
  /** Superficial appeal per answer index, in [0, 1] — what a bad verifier reads. */
  appeal: readonly number[];
  /** Width of the per-candidate scoring noise. */
  noise: number;
}

/** Bat and ball: the correct answer is a minority, the trap is the plurality. */
export const BAT_AND_BALL_MODEL: SelectionModel = {
  answerProbs: [0.28, 0.62, 0.1],
  appeal: [0.2, 1.0, 0.5],
  noise: 0.35,
};

export interface Candidate {
  /** Index into the model's answers; 0 is correct. */
  answer: number;
  correct: boolean;
  /** The verifier's score for this candidate. */
  score: number;
}

export interface SelectionBatch {
  candidates: Candidate[];
  tally: number[];
  /** Answer index the plurality landed on. */
  majorityAnswer: number;
  majorityCorrect: boolean;
  /** Candidate index the verifier scored highest. */
  verifierPick: number;
  verifierCorrect: boolean;
  /** Was a correct answer present in the batch at all? */
  anyCorrect: boolean;
}

function scoreCandidate(
  rng: () => number,
  model: SelectionModel,
  answer: number,
  reliability: number,
): number {
  const correct = answer === 0 ? 1 : 0;
  return (
    reliability * correct + (1 - reliability) * model.appeal[answer] + rng() * model.noise
  );
}

/** One seeded batch of n candidates, scored and selected two ways. */
export function selectionBatch(
  n: number,
  seed: number,
  reliability: number,
  model: SelectionModel = BAT_AND_BALL_MODEL,
): SelectionBatch {
  const rng = createRng(seed);
  const probs = [...model.answerProbs];

  const candidates: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    const answer = drawIndex(rng, probs);
    candidates.push({ answer, correct: answer === 0, score: 0 });
  }
  // Score in a second pass so the candidate draw is independent of reliability:
  // moving the slider re-judges the SAME candidates, which is the whole demo.
  for (const c of candidates) c.score = scoreCandidate(rng, model, c.answer, reliability);

  const tally = new Array(probs.length).fill(0);
  for (const c of candidates) tally[c.answer] += 1;
  const max = Math.max(...tally);
  const top: number[] = [];
  for (let i = 0; i < tally.length; i++) if (tally[i] === max) top.push(i);
  const majorityAnswer = top.length === 1 ? top[0] : top[Math.floor(rng() * top.length)];

  let verifierPick = 0;
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].score > candidates[verifierPick].score) verifierPick = i;
  }

  return {
    candidates,
    tally,
    majorityAnswer,
    majorityCorrect: majorityAnswer === 0,
    verifierPick,
    verifierCorrect: candidates[verifierPick]?.correct ?? false,
    anyCorrect: candidates.some((c) => c.correct),
  };
}

export interface SelectionAccuracy {
  /** Any correct candidate present — the ceiling every selector is chasing. */
  coverage: number;
  majority: number;
  verifier: number;
  /** Picking one candidate blind — the per-candidate rate. */
  random: number;
}

/** Population accuracy of each selection rule at n candidates (percentages). */
export function selectionAccuracy(
  n: number,
  trials: number,
  seed: number,
  reliability: number,
  model: SelectionModel = BAT_AND_BALL_MODEL,
): SelectionAccuracy {
  let coverage = 0;
  let majority = 0;
  let verifier = 0;
  let random = 0;
  const rng = createRng(seed);
  for (let t = 0; t < trials; t++) {
    // A fresh sub-seed per trial keeps selectionBatch the single source of truth.
    const b = selectionBatch(n, Math.floor(rng() * 2 ** 31), reliability, model);
    if (b.anyCorrect) coverage += 1;
    if (b.majorityCorrect) majority += 1;
    if (b.verifierCorrect) verifier += 1;
    if (b.candidates[Math.floor(rng() * n)]?.correct) random += 1;
  }
  return {
    coverage: (coverage / trials) * 100,
    majority: (majority / trials) * 100,
    verifier: (verifier / trials) * 100,
    random: (random / trials) * 100,
  };
}
