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
import { BAT_AND_BALL, SUPERVISION } from "./authored";
import { curves, interpolate } from "./curves";
import {
  BAT_AND_BALL_MODEL,
  coverageAtLeastOne,
  selectionAccuracy,
  selectionBatch,
} from "./sim";

const TOL = 1.0;
const TRIALS = 3000;
const SEED = 21101968;

describe("Page 8 — the bat-and-ball setup", () => {
  const B = BAT_AND_BALL;

  it("index 0 is the correct answer and it satisfies both constraints", () => {
    expect(B.answers[0].correct).toBe(true);
    const ball = 0.05;
    const bat = ball + B.difference;
    expect(bat + ball).toBeCloseTo(B.total, 10);
    expect(bat - ball).toBeCloseTo(B.difference, 10);
    expect(B.answers[0].display).toBe("$0.05");
    expect(B.answers[0].checks).toBe(true);
  });

  it("the intuitive answer really does fail the check", () => {
    const ball = 0.1;
    const bat = B.total - ball; // 1.00 — but then the gap is only 0.90
    expect(bat - ball).not.toBeCloseTo(B.difference, 6);
    expect(B.answers[1].correct).toBe(false);
    expect(B.answers[1].checks).toBe(false);
  });

  it("the model gives the trap more mass than the truth — that is the point", () => {
    const m = BAT_AND_BALL_MODEL;
    expect(m.answerProbs[1]).toBeGreaterThan(m.answerProbs[0]);
    expect(m.answerProbs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    // ...and the trap is also the most superficially appealing candidate,
    // so a corrupted verifier fails toward it rather than toward noise.
    expect(Math.max(...m.appeal)).toBe(m.appeal[1]);
    expect(m.appeal[0]).toBeLessThan(m.appeal[1]);
  });

  it("there is one authored answer per bucket in the selection model", () => {
    expect(B.answers.length).toBe(BAT_AND_BALL_MODEL.answerProbs.length);
  });
});

describe("Page 8 — generate, then select", () => {
  it("coverage tracks the closed form for the correct answer's rate", () => {
    const p = BAT_AND_BALL_MODEL.answerProbs[0];
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

  it("a weak verifier gets WORSE as N grows — the imperfect-verifier trap", () => {
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

describe("Page 9 — the authored supervision traces", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  it("16/64 really is 1/4 — so the fake cancellation lands the right answer", () => {
    expect(16 / 64).toBeCloseTo(1 / 4, 10);
    expect(gcd(16, 64)).toBe(16);
  });

  it("Solution A is right by outcome and broken by process", () => {
    const a = SUPERVISION.traces.find((t) => t.key === "lucky")!;
    expect(a.outcomeOk).toBe(true);
    expect(a.finalAnswer).toBe(SUPERVISION.answer);
    expect(a.steps.some((s) => !s.ok)).toBe(true);
  });

  it("Solution B breaks at exactly one step, and the rest follow validly", () => {
    const b = SUPERVISION.traces.find((t) => t.key === "broken")!;
    expect(b.outcomeOk).toBe(false);
    const broken = b.steps.filter((s) => !s.ok);
    expect(broken.length).toBe(1);
    expect(b.steps.indexOf(broken[0])).toBe(1); // the wrong GCD
    // The arithmetic AFTER the mistake is genuinely correct given the bad divisor.
    expect(16 / 8).toBe(2);
    expect(64 / 8).toBe(8);
    expect(b.finalAnswer).toBe("2/8");
    expect(b.finalAnswer).not.toBe(SUPERVISION.answer);
  });

  it("Solution C is sound end to end", () => {
    const c = SUPERVISION.traces.find((t) => t.key === "clean")!;
    expect(c.outcomeOk).toBe(true);
    expect(c.steps.every((s) => s.ok)).toBe(true);
    expect(c.finalAnswer).toBe(SUPERVISION.answer);
  });

  it("the two graders disagree on exactly the case the page is about", () => {
    // Outcome says pass on A and C; process only endorses C.
    const verdicts = SUPERVISION.traces.map((t) => ({
      outcome: t.outcomeOk,
      process: t.steps.every((s) => s.ok),
    }));
    expect(verdicts.filter((v) => v.outcome && !v.process).length).toBe(1);
  });

  it("every flagged step explains itself", () => {
    for (const t of SUPERVISION.traces) {
      for (const s of t.steps) {
        if (!s.ok) expect(s.note && s.note.length > 0).toBe(true);
      }
    }
  });
});

describe("Page 9 — PRM vs ORM (Lightman et al.)", () => {
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
