import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import {
  allocationScore,
  binAccuracy,
  logLinearCoverage,
  optimalAllocation,
  toyMctsChoose,
  toyMctsQuality,
  type ToyGame,
} from "./search";

const TOL = 1.0;

describe("Page 10 — Tree of Thoughts (Yao et al.)", () => {
  it("b=1 -> 45% and b=5 -> 74% within tolerance", () => {
    const d = curves.treeOfThoughts;
    expect(Math.abs(interpolate(d, 1) - 45)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(d, 5) - 74)).toBeLessThan(TOL);
    expect(d.citation.ref).toBe("Yao et al. 2023");
  });

  it("accuracy increases monotonically with branching factor", () => {
    const d = curves.treeOfThoughts;
    for (let b = 2; b <= 5; b++) expect(interpolate(d, b)).toBeGreaterThan(interpolate(d, b - 1));
  });
});

describe("Page 11 — toy MCTS (PUCT)", () => {
  const game: ToyGame = { armValues: [0.2, 0.5, 0.9, 0.45, 0.3] };

  it("with enough rollouts it selects the best arm (index 2)", () => {
    expect(toyMctsChoose(game, 200, 1)).toBe(2);
  });

  it("move quality rises with the look-ahead budget", () => {
    const low = toyMctsQuality(game, 2, 200, 5);
    const high = toyMctsQuality(game, 128, 200, 5);
    expect(high).toBeGreaterThan(low);
  });

  it("is deterministic per seed", () => {
    expect(toyMctsChoose(game, 50, 9)).toBe(toyMctsChoose(game, 50, 9));
  });
});

describe("Page 12 — log-linear coverage (Brown et al.)", () => {
  const d = curves.coverageScaling;
  const { intercept, slopePerDecade } = d.fit!.params;

  it("passes through (1, 15.9%) and (250, 56%)", () => {
    expect(Math.abs(logLinearCoverage(1, intercept, slopePerDecade) - 15.9)).toBeLessThan(TOL);
    expect(Math.abs(logLinearCoverage(250, intercept, slopePerDecade) - 56)).toBeLessThan(TOL);
  });

  it("is linear in log10(k) (equal decades give equal bumps)", () => {
    const a = logLinearCoverage(1, intercept, slopePerDecade);
    const b = logLinearCoverage(10, intercept, slopePerDecade);
    const c = logLinearCoverage(100, intercept, slopePerDecade);
    expect(Math.abs((b - a) - (c - b))).toBeLessThan(1e-6);
  });
});

describe("Page 13 — compute-optimal allocation (Snell et al.)", () => {
  it("optimal allocation beats a naive uniform split", () => {
    const total = 9;
    const optimal = optimalAllocation(total);
    const uniform = { easy: 3, medium: 3, hard: 3 };
    expect(allocationScore(optimal)).toBeGreaterThan(allocationScore(uniform));
  });

  it("optimal favours the medium band over pouring budget into easy", () => {
    const optimal = optimalAllocation(10);
    expect(optimal.medium).toBeGreaterThan(optimal.easy);
  });

  it("bin accuracy is concave (diminishing returns)", () => {
    const g1 = binAccuracy("medium", 1) - binAccuracy("medium", 0);
    const g2 = binAccuracy("medium", 5) - binAccuracy("medium", 4);
    expect(g1).toBeGreaterThan(g2);
  });

  it("data carries the >4x and 14x anchors + citation", () => {
    const d = curves.computeOptimal;
    expect(d.fit!.params.efficiencyVsBestOfN).toBe(4);
    expect(d.fit!.params.largerModelFactor).toBe(14);
    expect(d.citation.ref).toBe("Snell et al. 2024");
  });
});
