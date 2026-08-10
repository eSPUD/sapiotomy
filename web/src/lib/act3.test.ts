import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import {
  cheapestStrategy,
  cotPressureRecall,
  cotPressureReward,
  distillCrossover,
  faithfulnessAdmitRate,
  perQueryCosts,
  rentPerQuery,
  samplesForTarget,
  type BillAnchors,
} from "./frontier";

const TOL = 1.0;

// Page 19's "budgets that flex" step was cut: it reprinted this result, which
// page 6 measures on the deck's own harness. The file is kept and validated,
// but nothing renders it; PROVENANCE.md records that.
describe("budget forcing (Muennighoff et al., preprint), retained unrendered", () => {
  const d = curves.budgetForcing;
  it("advances 50% -> 57% across 'Wait' presses", () => {
    expect(Math.abs(interpolate(d, 0) - 50)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(d, 5) - 57)).toBeLessThan(TOL);
  });
  it("is monotonic and flips a representative problem after some presses", () => {
    for (let k = 1; k <= 5; k++) expect(interpolate(d, k)).toBeGreaterThanOrEqual(interpolate(d, k - 1));
    expect(d.fit!.params.flipAtPress).toBeGreaterThan(0);
  });
  it("is preprint-flagged", () => expect(d.citation.preprint).toBe(true));
});

describe("Page 16: DeepSeek-R1 RL training (Nature)", () => {
  const d = curves.deepseekTraining;
  it("pass@1 rises 15.6% -> 71.0%, cons@64 = 86.7%", () => {
    expect(Math.abs(interpolate(d, 0) - 15.6)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(d, 8000) - 71.0)).toBeLessThan(TOL);
    expect(d.fit!.params.cons64).toBe(86.7);
  });
  it("is monotonic in training step", () => {
    let prev = -1;
    for (const s of [0, 2000, 4000, 6000, 8000]) {
      const y = interpolate(d, s);
      expect(y).toBeGreaterThan(prev);
      prev = y;
    }
  });
});

describe("Page 16: ARC-AGI cost anchors (reported estimates, not peer-reviewed)", () => {
  const d = curves.arcCost;
  it("matches o3 low/high, o1, human anchors", () => {
    const p = d.fit!.params;
    expect(p.o3LowAcc).toBe(75.7);
    expect(p.o3HighAcc).toBe(87.5);
    expect(p.computeFactor).toBe(172);
    expect(p.o1Acc).toBe(32);
    expect(p.humanCost).toBe(5);
  });
  it("carries the per-task sample counts and human anchors (Bender / ARC Prize)", () => {
    const p = d.fit!.params;
    expect(p.o3LowSamples).toBe(6);
    expect(p.o3HighSamples).toBe(1024);
    expect(p.o3LowCost).toBe(20);
    expect(p.o3HighCost).toBe(3460);
    expect(p.humanMeasuredCost).toBe(17);
    expect(p.humanFloorLow).toBe(2);
  });
  it("documents in provenance that dollars are estimate-dependent", () => {
    expect(d.provenance).toContain("estimate-dependent");
  });
  it("is flagged as non-peer-reviewed", () => expect(d.citation.preprint).toBe(true));
});

describe("Page 16: DeepSeek-R1 vs o1 price anchors", () => {
  const d = curves.deepseekPricing;
  it("matches the launch list prices and the ~27x ratio", () => {
    const p = d.fit!.params;
    expect(p.o1InputPerM).toBe(15);
    expect(p.o1OutputPerM).toBe(60);
    expect(p.r1InputMissPerM).toBe(0.55);
    expect(p.r1OutputPerM).toBe(2.19);
    expect(p.o1OutputPerM / p.r1OutputPerM).toBeCloseTo(p.outputRatio, 1);
    expect(p.r1RlTrainUSD).toBe(294000);
  });
  it("is flagged as non-peer-reviewed (vendor pricing)", () =>
    expect(d.citation.preprint).toBe(true));
});

describe("Page 16: the cost-accuracy dial (rent vs sample vs retrain)", () => {
  // The page's anchors: o1/R1 list rates at 10k reasoning tokens per query,
  // DeepSeek's reported $294k RL bill, authored Brown-shaped climb.
  const A: BillAnchors = {
    bigPerQuery: 0.6,
    smallPerSample: 0.0219,
    distillUSD: 294000,
    baseAcc: 60,
    slopePerDecade: 12,
    ceiling: 90,
  };

  it("needs 10x the samples per 12 accuracy points (log-linear)", () => {
    expect(samplesForTarget(60, A)).toBe(1);
    expect(samplesForTarget(72, A)).toBe(10);
    expect(samplesForTarget(84, A)).toBe(100);
  });
  it("no sample count reaches past the verifier ceiling (Stroebl-shaped cap)", () => {
    expect(samplesForTarget(90, A)).toBeNull();
    expect(samplesForTarget(92, A)).toBeNull();
    expect(perQueryCosts(92, A).sample).toBeNull();
  });
  it("sampling the small model is the cheaper rental below parity, big above", () => {
    // Parity: 27.4x price gap = 10^1.44 samples = ~77.3% target.
    expect(rentPerQuery(72, A)).toBeCloseTo(0.219, 6); // 10 samples, beats $0.60
    expect(cheapestStrategy(1e5, 72, A)).toBe("sample");
    expect(rentPerQuery(84, A)).toBeCloseTo(0.6, 6); // 100 samples would cost $2.19
    expect(cheapestStrategy(1e5, 84, A)).toBe("big");
    expect(cheapestStrategy(1e5, 92, A)).toBe("big"); // past the ceiling
  });
  it("distillation amortizes at high volume: crossover = bill / margin", () => {
    const q = distillCrossover(72, A)!;
    expect(q).toBeCloseTo(294000 / (0.219 - 0.0219), 0);
    expect(cheapestStrategy(q * 1.01, 72, A)).toBe("distill");
    expect(cheapestStrategy(q * 0.99, 72, A)).not.toBe("distill");
    expect(cheapestStrategy(1e7, 72, A)).toBe("distill");
  });
  it("never amortizes when one sample already hits the target", () => {
    expect(distillCrossover(60, A)).toBeNull();
  });
});

describe("Page 17: self-correction (Huang et al., ICLR 2024) + revision chain", () => {
  const d = curves.selfCorrection;
  it("GPT-4 on GSM8K declines 95.5 -> 91.5 -> 89.0 across rounds (verbatim)", () => {
    expect(interpolate(d, 0)).toBe(95.5);
    expect(interpolate(d, 1)).toBe(91.5);
    expect(interpolate(d, 2)).toBe(89.0);
  });
  it("GPT-3.5 on CommonSenseQA collapses 75.8 -> 38.1 in one round (verbatim)", () => {
    const p = d.fit!.params;
    expect(p.gpt35Csqa0).toBe(75.8);
    expect(p.gpt35Csqa1).toBe(38.1);
    expect(p.gpt35Csqa2).toBe(41.8);
  });
  it("is peer-reviewed (ICLR 2024), not preprint-flagged", () => {
    expect(d.citation.preprint).toBe(false);
    expect(d.citation.venue).toBe("ICLR 2024");
  });

});

describe("preprint flagging (all Act 3 non-peer-reviewed sources)", () => {
  it("pages 15, 18 and 19 data (and reserved arc-cost) are preprint/non-peer-reviewed", () => {
    expect(curves.budgetForcing.citation.preprint).toBe(true);
    expect(curves.arcCost.citation.preprint).toBe(true);
    expect(curves.faithfulness.citation.preprint).toBe(true);
    expect(curves.cotObfuscation.citation.preprint).toBe(true);
  });
});
