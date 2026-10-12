import { describe, expect, it } from "vitest";
import { curves } from "./curves";
import { chinchillaLoss, ISO_BUDGETS, lossAtBudget, optimumAt, tokensFor } from "./scalingLaw";

describe("Chinchilla scaling law (Besiroglu et al. 2024 constants)", () => {
  it("uses the replication's constants verbatim", () => {
    const p = curves.chinchillaLossFit.fit!.params;
    expect([p.E, p.A, p.B, p.alpha, p.beta]).toEqual([1.8172, 482.01, 2085.43, 0.3478, 0.3658]);
    expect(p.flopsPerParamToken).toBe(6);
  });

  it("puts the compute-optimal split at about 20 tokens per parameter", () => {
    for (const C of ISO_BUDGETS) {
      const { N, D } = optimumAt(C);
      expect(D / N).toBeGreaterThan(16);
      expect(D / N).toBeLessThan(23);
    }
  });

  it("recovers Chinchilla: its budget's best model is about 70B parameters on about 1.4T tokens", () => {
    const { N, D } = optimumAt(6 * 70e9 * 1.4e12);
    expect(N / 1e9).toBeGreaterThan(60);
    expect(N / 1e9).toBeLessThan(85);
    expect(D / 1e12).toBeGreaterThan(1.1);
    expect(D / 1e12).toBeLessThan(1.6);
  });

  it("is a true minimum: either side of the optimum along a budget is worse", () => {
    const C = 1e23;
    const { N, loss } = optimumAt(C);
    expect(lossAtBudget(C, N / 3)).toBeGreaterThan(loss);
    expect(lossAtBudget(C, N * 3)).toBeGreaterThan(loss);
    expect(chinchillaLoss(N, tokensFor(C, N))).toBeCloseTo(loss, 10);
  });

  it("each tenfold budget lowers the best loss, by less each time", () => {
    const best = ISO_BUDGETS.map((C) => optimumAt(C).loss);
    const gains = best.slice(1).map((l, i) => best[i] - l);
    for (const g of gains) expect(g).toBeGreaterThan(0);
    for (let i = 1; i < gains.length; i++) expect(gains[i]).toBeLessThan(gains[i - 1]);
  });

  it("agrees with the derived minima stored in the data file", () => {
    for (const pt of curves.chinchillaLossFit.points) {
      expect(optimumAt(pt.x).loss).toBeCloseTo(pt.y, 3);
    }
  });
});
