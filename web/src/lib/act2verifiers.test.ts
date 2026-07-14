import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import { bestOfN, coverageAtLeastOne, type BestOfNModel } from "./sim";

const TOL = 1.0;

describe("Page 7 — coverage vs. selection plateau (Brown et al.)", () => {
  const data = curves.votingPlateau;

  it("majority curve plateaus (last budgets barely differ)", () => {
    const at40 = interpolate(data, 40);
    const at300 = interpolate(data, 300);
    expect(at300 - at40).toBeLessThan(1.0); // essentially flat
    expect(at300 - at40).toBeGreaterThanOrEqual(0); // non-decreasing
  });

  it("coverage keeps rising and overtakes the majority plateau", () => {
    const p = data.fit!.params.coveragePerSample;
    const cov40 = coverageAtLeastOne(p, 40) * 100;
    const cov300 = coverageAtLeastOne(p, 300) * 100;
    expect(cov300).toBeGreaterThan(cov40);
    expect(cov300).toBeGreaterThan(interpolate(data, 300));
  });

  it("carries its (preprint) citation", () => {
    expect(data.citation.ref).toBe("Brown et al. 2024");
    expect(data.citation.preprint).toBe(true);
  });
});

describe("Page 8 — best-of-N selection", () => {
  const model: BestOfNModel = { p: 0.35, distractors: 4, verifierReliability: 0.85 };

  it("verifier > majority > random for the seeded parameters", () => {
    const r = bestOfN(8, 4000, 1, model);
    expect(r.verifier).toBeGreaterThan(r.majority);
    expect(r.majority).toBeGreaterThan(r.random);
  });

  it("random pick tracks the per-draft success rate (~35%)", () => {
    const r = bestOfN(8, 8000, 2, model);
    expect(Math.abs(r.random - 35)).toBeLessThan(2.0);
  });

  it("is deterministic per seed", () => {
    expect(bestOfN(6, 2000, 42, model)).toEqual(bestOfN(6, 2000, 42, model));
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
