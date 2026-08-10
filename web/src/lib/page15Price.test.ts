/**
 * The cross-language check for page 15 section 3.
 *
 * `page15Price.ts` throws on load if the committed run fails a blocking claim,
 * so the import itself is the first assertion. What is left here is the
 * arithmetic between the fields and the exact values the page prints, which is
 * what would break if someone pasted a different run into `web/data/` or edited
 * a number by hand.
 *
 * The direction assertions matter more than they look. The section's whole
 * sentence is "the harder rung costs more and returns less", and a run where
 * either sign flipped would let the page teach the opposite lesson at full
 * confidence.
 */
import { describe, expect, it } from "vitest";
import { PAGE15_PRICE } from "./page15Price";

const byLabel = (label: string) => {
  const p = PAGE15_PRICE.pairs.find((x) => x.label === label);
  if (!p) throw new Error(`no measured pair for ${label}`);
  return p;
};

describe("page 15's price-of-a-rung readings", () => {
  it("pairs exactly the three models measured on both bands, smallest first", () => {
    expect(PAGE15_PRICE.pairs.map((p) => p.label)).toEqual([
      "Qwen2.5-1.5B",
      "Qwen2.5-3B",
      "Qwen2.5-7B",
    ]);
  });

  it("names the specialist it had to drop rather than filtering it silently", () => {
    // Measured on the easy band only by page 11's arm B, so it cannot be paired.
    expect(PAGE15_PRICE.excludedUnpaired).toEqual(["Qwen2.5-Math"]);
  });

  it("reads both bands off the run with their item counts", () => {
    expect(PAGE15_PRICE.bands.easy).toEqual({ levels: "levels 1 to 3", n: 50 });
    expect(PAGE15_PRICE.bands.hard).toEqual({ levels: "levels 4 and 5", n: 100 });
  });

  it("pins the measured token counts the figure plots", () => {
    expect(byLabel("Qwen2.5-1.5B").easy.meanTokens).toBeCloseTo(223.6, 1);
    expect(byLabel("Qwen2.5-1.5B").hard.meanTokens).toBeCloseTo(567.33, 1);
    expect(byLabel("Qwen2.5-3B").easy.meanTokens).toBeCloseTo(302.34, 1);
    expect(byLabel("Qwen2.5-3B").hard.meanTokens).toBeCloseTo(693.2, 1);
    expect(byLabel("Qwen2.5-7B").easy.meanTokens).toBeCloseTo(323.24, 1);
    expect(byLabel("Qwen2.5-7B").hard.meanTokens).toBeCloseTo(656.26, 1);
  });

  it("pins the measured accuracies the figure plots", () => {
    expect(byLabel("Qwen2.5-1.5B").easy.accuracy).toBeCloseTo(0.56, 3);
    expect(byLabel("Qwen2.5-1.5B").hard.accuracy).toBeCloseTo(0.22, 3);
    expect(byLabel("Qwen2.5-3B").easy.accuracy).toBeCloseTo(0.74, 3);
    expect(byLabel("Qwen2.5-3B").hard.accuracy).toBeCloseTo(0.43, 3);
    expect(byLabel("Qwen2.5-7B").easy.accuracy).toBeCloseTo(0.88, 3);
    expect(byLabel("Qwen2.5-7B").hard.accuracy).toBeCloseTo(0.6, 3);
  });

  it("every model pays more per problem on the harder band", () => {
    for (const p of PAGE15_PRICE.pairs) {
      expect(p.hard.meanTokens).toBeGreaterThan(p.easy.meanTokens);
      expect(p.tokenRatio).toBeGreaterThan(1);
      expect(p.tokenRatio).toBeCloseTo(p.hard.meanTokens / p.easy.meanTokens, 6);
    }
  });

  it("every model scores worse on the harder band", () => {
    for (const p of PAGE15_PRICE.pairs) {
      expect(p.hard.accuracy).toBeLessThan(p.easy.accuracy);
      expect(p.accuracyDropPts).toBeGreaterThan(0);
      expect(p.accuracyDropPts).toBeCloseTo((p.easy.accuracy - p.hard.accuracy) * 100, 6);
    }
  });

  it("holds the ranges the copy quotes, so prose cannot drift from the figure", () => {
    // The page says "roughly twice the tokens". Every model lands in [2.0, 2.6).
    expect(PAGE15_PRICE.ratioRange.lo).toBeGreaterThanOrEqual(2);
    expect(PAGE15_PRICE.ratioRange.hi).toBeLessThan(2.6);
    expect(PAGE15_PRICE.pairs.map((p) => Number(p.tokenRatio.toFixed(2)))).toEqual([
      2.54, 2.29, 2.03,
    ]);
    // The page says "28 to 34 points". These are those points, rounded as printed.
    expect(PAGE15_PRICE.pairs.map((p) => Math.round(p.accuracyDropPts))).toEqual([34, 31, 28]);
  });
});
