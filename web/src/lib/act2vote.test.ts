/**
 * Page 7, "Frequency Voting" — the sampling chamber.
 *
 * Two things are guarded here. First, the authored reasoning paths really do
 * land where they claim to: every number in SAMPLING_CHAMBER is recomputed from
 * the problem's own quantities, so a typo in the copy fails the suite instead of
 * shipping a chain that does not add up. Second, the temperature model still
 * reduces EXACTLY to the cited Wang et al. curve at the reference temperature —
 * that anchor is the only thing licensing the page to show 56.5% and 74.4%.
 */
import { describe, expect, it } from "vitest";
import { SAMPLING_CHAMBER } from "./authored";
import { curves } from "./curves";
import {
  CHAMBER_MODEL,
  chamberAccuracy,
  chamberCurve,
  chamberDiversity,
  chamberProbs,
  representativeChamberBallot,
} from "./sim";

const TRIALS = 4000;
const SEED = 20220311;
const TOL = 1.5; // Monte Carlo tolerance, percentage points

describe("Page 7: the authored reasoning paths", () => {
  const C = SAMPLING_CHAMBER;
  const total = C.boxes * C.perBox;
  const remainder = total - C.used;

  it("index 0 is the correct path (lib/sim's answer-index convention)", () => {
    expect(C.paths[0].correct).toBe(true);
    expect(C.paths.slice(1).every((p) => !p.correct)).toBe(true);
  });

  it("the correct answer is derived from the problem's own quantities", () => {
    expect(total).toBe(48);
    expect(remainder).toBe(33);
    expect(remainder - remainder / 3).toBe(C.answer);
    expect(C.paths[0].answer).toBe(C.answer);
  });

  it("each distractor is exactly the misreading it claims to be", () => {
    // "stops at the remainder, never gives any away"
    expect(C.paths[1].answer).toBe(remainder);
    // "takes the third from the original 48, not the remainder"
    expect(C.paths[2].answer).toBe(total - C.used - total / 3);
    // "reads 'gave away a third' as 'kept a third'"
    expect(C.paths[3].answer).toBe(remainder / 3);
  });

  it("every path's display string matches its number, and all four differ", () => {
    for (const p of C.paths) expect(p.display).toBe(String(p.answer));
    expect(new Set(C.paths.map((p) => p.answer)).size).toBe(C.paths.length);
  });

  it("there is one path per answer bucket in the vote model", () => {
    expect(C.paths.length).toBe(CHAMBER_MODEL.distractors + 1);
  });
});

describe("Page 7: the temperature model", () => {
  it("reproduces the cited endpoints at the reference temperature", () => {
    const t = CHAMBER_MODEL.referenceTemp;
    const anchor = curves.selfConsistency;
    const single = anchor.points[0].y; // 56.5
    const plateau = anchor.points[anchor.points.length - 1].y; // 74.4

    expect(Math.abs(chamberAccuracy(1, t, TRIALS, SEED) - single)).toBeLessThan(TOL);
    expect(Math.abs(chamberAccuracy(40, t, TRIALS, SEED) - plateau)).toBeLessThan(TOL);
  });

  it("at the reference temperature accuracy rises with more chains", () => {
    const t = CHAMBER_MODEL.referenceTemp;
    const curve = chamberCurve([1, 4, 16, 64], t, TRIALS, SEED);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].y).toBeGreaterThan(curve[i - 1].y);
    }
  });

  it("at temperature zero the vote is flat: 64 chains buy nothing over 1", () => {
    const one = chamberAccuracy(1, 0, TRIALS, SEED);
    const many = chamberAccuracy(64, 0, TRIALS, SEED);
    expect(Math.abs(many - one)).toBeLessThan(TOL);
    // ...and it is stuck at the single-chain rate, not the plateau.
    expect(Math.abs(many - curves.selfConsistency.points[0].y)).toBeLessThan(TOL);
  });

  it("temperature zero makes every chain a duplicate of the first", () => {
    const b = representativeChamberBallot(32, 0, SEED);
    expect(b.duplicated.slice(1).every(Boolean)).toBe(true);
    expect(new Set(b.draws).size).toBe(1);
  });

  it("diversity climbs linearly to fully independent at the reference temperature", () => {
    expect(chamberDiversity(CHAMBER_MODEL, 0)).toBe(0);
    expect(chamberDiversity(CHAMBER_MODEL, CHAMBER_MODEL.referenceTemp)).toBe(1);
    expect(chamberDiversity(CHAMBER_MODEL, 2)).toBe(1); // clamped
    expect(chamberDiversity(CHAMBER_MODEL, 0.35)).toBeCloseTo(0.5, 6);
  });

  it("probabilities are never sharpened below the reference temperature", () => {
    // Collapsing to the modal answer as t -> 0 would erase the very effect the
    // page teaches, so cold temperatures must leave the distribution alone.
    const cold = chamberProbs(CHAMBER_MODEL, 0);
    const ref = chamberProbs(CHAMBER_MODEL, CHAMBER_MODEL.referenceTemp);
    expect(cold).toEqual(ref);
    expect(cold[0]).toBeCloseTo(CHAMBER_MODEL.pCorrect, 6);
  });

  it("above the reference temperature the distribution flattens toward uniform", () => {
    const ref = chamberProbs(CHAMBER_MODEL, CHAMBER_MODEL.referenceTemp);
    const hot = chamberProbs(CHAMBER_MODEL, 1.4);
    expect(hot[0]).toBeLessThan(ref[0]);
    expect(hot[1]).toBeGreaterThan(ref[1]);
    expect(hot.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
    // The correct answer must stay modal, or voting could never converge.
    expect(hot[0]).toBeGreaterThan(hot[1]);
  });

  it("a hotter temperature costs accuracy at a fixed budget", () => {
    const ref = chamberAccuracy(8, CHAMBER_MODEL.referenceTemp, TRIALS, SEED);
    const hot = chamberAccuracy(8, 1.4, TRIALS, SEED);
    expect(hot).toBeLessThan(ref);
  });

  it("is deterministic per seed", () => {
    expect(chamberAccuracy(16, 0.7, 500, 7)).toBe(chamberAccuracy(16, 0.7, 500, 7));
  });

  it("a ballot casts exactly n votes into the model's buckets", () => {
    const b = representativeChamberBallot(21, 0.7, SEED);
    expect(b.draws.length).toBe(21);
    expect(b.tally.reduce((a, c) => a + c, 0)).toBe(21);
    expect(b.tally.length).toBe(CHAMBER_MODEL.distractors + 1);
  });
});
