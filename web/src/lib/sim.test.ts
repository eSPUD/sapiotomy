import { describe, expect, it } from "vitest";
import { coverageAtLeastOne, coverageMonteCarlo } from "./sim";

describe("coverage (Page 5 primitive)", () => {
  it("closed form matches 1 - (1-p)^n", () => {
    expect(coverageAtLeastOne(0.3, 1)).toBeCloseTo(0.3, 10);
    expect(coverageAtLeastOne(0.3, 2)).toBeCloseTo(1 - 0.7 * 0.7, 10);
    expect(coverageAtLeastOne(0.5, 10)).toBeCloseTo(1 - Math.pow(0.5, 10), 10);
  });

  it("is monotonically increasing in n", () => {
    let prev = 0;
    for (let n = 1; n <= 20; n++) {
      const c = coverageAtLeastOne(0.2, n);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });

  it("Monte Carlo converges to the closed form (deterministic per seed)", () => {
    const p = 0.35;
    const n = 5;
    const mc = coverageMonteCarlo(p, n, 20000, 123);
    expect(mc).toBeCloseTo(coverageAtLeastOne(p, n), 2);
  });

  it("Monte Carlo is reproducible for a fixed seed", () => {
    const a = coverageMonteCarlo(0.4, 3, 5000, 99);
    const b = coverageMonteCarlo(0.4, 3, 5000, 99);
    expect(a).toEqual(b);
  });
});
