import { describe, expect, it } from "vitest";
import {
  representativeBallot,
  selfConsistencyAccuracy,
  selfConsistencyCurve,
  SELF_CONSISTENCY_MODEL,
  voteOnce,
} from "./sim";
import { createRng } from "./rng";
import { curves, interpolate } from "./curves";

const TRIALS = 20000;
const TOL = 1.0; // ±1.0 percentage point (task_list.md data-fidelity default)

describe("self-consistency Monte Carlo (Page 6)", () => {
  it("reproduces the Wang et al. endpoints (56.5% -> 74.4%)", () => {
    const at1 = selfConsistencyAccuracy(1, TRIALS, 1) * 100;
    const at40 = selfConsistencyAccuracy(40, TRIALS, 2) * 100;
    expect(at1).toBeGreaterThan(56.5 - TOL);
    expect(at1).toBeLessThan(56.5 + TOL);
    expect(at40).toBeGreaterThan(74.4 - TOL);
    expect(at40).toBeLessThan(74.4 + TOL);
  });

  it("reproduces the +17.9-point self-consistency gain", () => {
    const gain =
      selfConsistencyAccuracy(40, TRIALS, 5) * 100 - selfConsistencyAccuracy(1, TRIALS, 5) * 100;
    expect(Math.abs(gain - 17.9)).toBeLessThan(TOL);
  });

  it("rises monotonically with the vote budget", () => {
    const curve = selfConsistencyCurve([1, 2, 5, 10, 20, 40], TRIALS, 7);
    for (let i = 1; i < curve.length; i++) {
      // allow tiny Monte Carlo noise
      expect(curve[i].y).toBeGreaterThanOrEqual(curve[i - 1].y - 0.4);
    }
  });

  it("shows diminishing returns (early gains exceed late gains)", () => {
    const a1 = selfConsistencyAccuracy(1, TRIALS, 11) * 100;
    const a5 = selfConsistencyAccuracy(5, TRIALS, 12) * 100;
    const a20 = selfConsistencyAccuracy(20, TRIALS, 13) * 100;
    const a40 = selfConsistencyAccuracy(40, TRIALS, 14) * 100;
    expect(a5 - a1).toBeGreaterThan(a40 - a20);
  });

  it("is deterministic for a fixed seed", () => {
    expect(selfConsistencyAccuracy(10, 3000, 42)).toEqual(selfConsistencyAccuracy(10, 3000, 42));
  });

  it("plurality selection returns the modal answer", () => {
    // A tally-dominated question: with a huge budget the correct answer (index 0)
    // is the strict plurality on solvable questions.
    const ballot = voteOnce(createRng(3), SELF_CONSISTENCY_MODEL, 400);
    const winner = ballot.tally.indexOf(Math.max(...ballot.tally));
    expect(winner).toBe(0);
    expect(ballot.correctIsPlurality).toBe(true);
  });
});

describe("self-consistency data fidelity (data/self-consistency.json)", () => {
  it("carries its citation and provenance", () => {
    expect(curves.selfConsistency.citation.ref).toBe("Wang et al. 2022");
    expect(curves.selfConsistency.provenance.length).toBeGreaterThan(0);
  });

  it("endpoints and +17.9 delta match the paper within tolerance", () => {
    const first = interpolate(curves.selfConsistency, 1);
    const last = interpolate(curves.selfConsistency, 40);
    expect(Math.abs(first - 56.5)).toBeLessThan(TOL);
    expect(Math.abs(last - 74.4)).toBeLessThan(TOL);
    expect(Math.abs(last - first - 17.9)).toBeLessThan(TOL);
  });

  it("representative ballot is reproducible", () => {
    const a = representativeBallot(12, 99);
    const b = representativeBallot(12, 99);
    expect(a.tally).toEqual(b.tally);
  });
});
