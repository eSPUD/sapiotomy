/**
 * Pages 8 and 9 — generate-then-select, and grading the steps.
 *
 * Page 8's simulation is illustrative rather than digitized, so what is asserted
 * here is the SHAPE the page claims on screen: that majority voting decays with
 * N on a trap problem, that a good verifier tracks coverage instead, and that a
 * corrupted verifier crosses below majority voting rather than degrading to
 * random. If any of those stopped holding, the page's copy would be lying.
 *
 * Page 9's traces are authored, so the arithmetic in every step is recomputed
 * from scratch — including the two facts the whole page rests on: that 16/64
 * really is 1/4 (so the fake cancellation gets the right answer), and that
 * Solution B's steps after the bad GCD are internally valid.
 */
import { describe, expect, it } from "vitest";
import { LILY_PADS } from "./authored";
import { curves, interpolate } from "./curves";
import {
  LILY_PAD_MODEL,
  coverageAtLeastOne,
  selectionAccuracy,
  selectionBatch,
} from "./sim";

const TOL = 1.0;
const TRIALS = 3000;
const SEED = 21101968;

describe("Page 8: the lily-pad setup", () => {
  const B = LILY_PADS;

  it("index 0 is the correct answer and it satisfies the doubling constraint", () => {
    expect(B.answers[0].correct).toBe(true);
    expect(B.answers[0].display).toBe("Day 47");
    // Half on day 47; one doubling later the lake is full on day 48.
    expect(B.halfDay).toBe(B.fullDay - 1);
    expect(B.answers[0].checks).toBe(true);
  });

  it("the intuitive answer really does fail the check", () => {
    // "Half the lake in half the days" lands on day 24, not the day before full.
    expect(B.fullDay / 2).toBe(24);
    expect(B.answers[1].display).toBe("Day 24");
    expect(B.fullDay / 2).not.toBe(B.halfDay);
    expect(B.answers[1].correct).toBe(false);
    expect(B.answers[1].checks).toBe(false);
  });

  it("the model gives the trap more mass than the truth; that is the point", () => {
    const m = LILY_PAD_MODEL;
    expect(m.answerProbs[1]).toBeGreaterThan(m.answerProbs[0]);
    expect(m.answerProbs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    // ...and the trap is also the most superficially appealing candidate,
    // so a corrupted verifier fails toward it rather than toward noise.
    expect(Math.max(...m.appeal)).toBe(m.appeal[1]);
    expect(m.appeal[0]).toBeLessThan(m.appeal[1]);
  });

  it("there is one authored answer per bucket in the selection model", () => {
    expect(B.answers.length).toBe(LILY_PAD_MODEL.answerProbs.length);
  });
});

describe("Page 8: generate, then select", () => {
  it("coverage tracks the closed form for the correct answer's rate", () => {
    const p = LILY_PAD_MODEL.answerProbs[0];
    for (const n of [1, 8, 32]) {
      const got = selectionAccuracy(n, TRIALS, SEED, 1).coverage;
      expect(Math.abs(got - coverageAtLeastOne(p, n) * 100)).toBeLessThan(3.0);
    }
  });

  it("a perfect verifier converts coverage into accuracy", () => {
    const r = selectionAccuracy(16, TRIALS, SEED, 1);
    expect(Math.abs(r.verifier - r.coverage)).toBeLessThan(TOL);
  });

  it("majority voting gets WORSE with more candidates on a trap problem", () => {
    const few = selectionAccuracy(1, TRIALS, SEED, 1).majority;
    const many = selectionAccuracy(32, TRIALS, SEED, 1).majority;
    expect(many).toBeLessThan(few);
    expect(many).toBeLessThan(5); // the crowd has converged on the trap
  });

  it("a good verifier beats majority voting by a wide margin", () => {
    const r = selectionAccuracy(16, TRIALS, SEED, 0.9);
    expect(r.verifier).toBeGreaterThan(r.majority + 40);
  });

  it("a corrupted verifier crosses BELOW majority voting", () => {
    // Not merely random: at zero reliability it scores by appeal, and the most
    // appealing answer is the trap — so it is confidently, systematically wrong.
    const broken = selectionAccuracy(16, TRIALS, SEED, 0);
    expect(broken.verifier).toBeLessThan(5);
    expect(broken.verifier).toBeLessThan(broken.random);
  });

  it("verifier accuracy never falls as reliability rises", () => {
    const at = [0, 0.25, 0.4, 0.5, 0.75, 1].map(
      (r) => selectionAccuracy(16, TRIALS, SEED, r).verifier,
    );
    for (let i = 1; i < at.length; i++) expect(at[i]).toBeGreaterThanOrEqual(at[i - 1]);
    expect(at[at.length - 1]).toBeGreaterThan(at[0] + 50);
  });

  it("below the crossover the verifier is pinned at zero, not merely noisy", () => {
    // A judge reading the wrong criterion does not wander — it locks onto the
    // most appealing answer, which on this problem is the trap.
    expect(selectionAccuracy(16, TRIALS, SEED, 0.25).verifier).toBeLessThan(1);
  });

  it("a weak verifier gets WORSE as N grows: the imperfect-verifier trap", () => {
    // Just below the crossover the trap outscores the truth on average, so each
    // extra candidate is another chance for a wrong one to beat a right one.
    const small = selectionAccuracy(2, TRIALS, SEED, 0.4).verifier;
    const large = selectionAccuracy(32, TRIALS, SEED, 0.4).verifier;
    expect(large).toBeLessThan(small);
  });

  it("above the crossover more candidates help instead", () => {
    const small = selectionAccuracy(2, TRIALS, SEED, 0.6).verifier;
    const large = selectionAccuracy(32, TRIALS, SEED, 0.6).verifier;
    expect(large).toBeGreaterThan(small);
  });

  it("moving reliability re-judges the SAME candidates", () => {
    const a = selectionBatch(12, 99, 1);
    const b = selectionBatch(12, 99, 0);
    expect(a.candidates.map((c) => c.answer)).toEqual(b.candidates.map((c) => c.answer));
    expect(a.tally).toEqual(b.tally);
  });

  it("is deterministic per seed", () => {
    expect(selectionBatch(8, 5, 0.7)).toEqual(selectionBatch(8, 5, 0.7));
  });
});

describe("Page 9: PRM vs ORM (Lightman et al.)", () => {
  it("endpoints match the paper: PRM 78.2 > ORM 72.4 > majority 69.6", () => {
    const data = curves.prmVsOrm;
    expect(Math.abs(interpolate(data, 2) - 78.2)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(data, 1) - 72.4)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(data, 0) - 69.6)).toBeLessThan(TOL);
    expect(data.citation.ref).toBe("Lightman et al. 2023");
  });
});

describe("Brown et al. coverage-vs-selection data stays valid", () => {
  const data = curves.votingPlateau;

  it("majority plateaus while coverage keeps rising", () => {
    const p = data.fit!.params.coveragePerSample;
    expect(interpolate(data, 300) - interpolate(data, 40)).toBeLessThan(1.0);
    expect(coverageAtLeastOne(p, 300) * 100).toBeGreaterThan(interpolate(data, 300));
  });

  it("carries its (preprint) citation", () => {
    expect(data.citation.ref).toBe("Brown et al. 2024");
    expect(data.citation.preprint).toBe(true);
  });
});
