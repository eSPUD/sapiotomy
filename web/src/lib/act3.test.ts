import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import {
  algorithmSolved,
  enumerationSolved,
  faithfulnessAdmitRate,
  hanoiMoves,
  hanoiTokens,
  inverseU,
} from "./frontier";

const TOL = 1.0;

describe("Page 14 — budget forcing (Muennighoff et al., preprint)", () => {
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

describe("Page 15 — DeepSeek-R1 RL training (Nature)", () => {
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

describe("Page 16 — ARC-AGI cost (reported estimates, not peer-reviewed)", () => {
  const d = curves.arcCost;
  it("matches o3 low/high, o1, human anchors", () => {
    const p = d.fit!.params;
    expect(p.o3LowAcc).toBe(75.7);
    expect(p.o3HighAcc).toBe(87.5);
    expect(p.computeFactor).toBe(172);
    expect(p.o1Acc).toBe(32);
    expect(p.humanCost).toBe(5);
  });
  it("is flagged as non-peer-reviewed", () => expect(d.citation.preprint).toBe(true));
});

describe("Page 17 — overthinking inverse-U (preprint)", () => {
  const d = curves.overthinking;
  const { easyPeak, hardPeak, easyPeakAcc, hardPeakAcc, curvature } = d.fit!.params;
  it("each curve is an inverse-U (single interior maximum)", () => {
    const atPeak = inverseU(easyPeak, easyPeak, easyPeakAcc, curvature);
    expect(atPeak).toBeGreaterThan(inverseU(easyPeak - 2, easyPeak, easyPeakAcc, curvature));
    expect(atPeak).toBeGreaterThan(inverseU(easyPeak + 2, easyPeak, easyPeakAcc, curvature));
  });
  it("easy problems peak at a lower thinking length than hard", () => {
    expect(easyPeak).toBeLessThan(hardPeak);
  });
  it("is preprint-flagged", () => expect(d.citation.preprint).toBe(true));
  void hardPeakAcc;
});

describe("Page 18 — faithfulness (preprint)", () => {
  const d = curves.faithfulness;
  it("admission Monte Carlo converges to 25% / 39%", () => {
    expect(Math.abs(faithfulnessAdmitRate(0.25, 20000, 1) - 25)).toBeLessThan(1.5);
    expect(Math.abs(faithfulnessAdmitRate(0.39, 20000, 2) - 39)).toBeLessThan(1.5);
  });
  it("provenance documents the unresolved misalignment-hint conflict", () => {
    expect(d.provenance.toLowerCase()).toContain("conflict");
  });
  it("is preprint-flagged", () => expect(d.citation.preprint).toBe(true));
});

describe("Page 19 — Illusion of Thinking (preprints, both sides)", () => {
  const d = curves.illusion;
  const { tokensPerMove, tokenBudget, riverCrossingImpossibleN } = d.fit!.params;
  it("Hanoi requires 2^N - 1 moves and tokens grow with N", () => {
    expect(hanoiMoves(3)).toBe(7);
    expect(hanoiMoves(10)).toBe(1023);
    expect(hanoiTokens(10, tokensPerMove)).toBeGreaterThan(hanoiTokens(5, tokensPerMove));
  });
  it("verdict flips between scoring modes past the token wall", () => {
    // Find an N where enumeration overflows the budget.
    let n = 1;
    while (enumerationSolved(n, tokensPerMove, tokenBudget) && n < 20) n++;
    expect(enumerationSolved(n, tokensPerMove, tokenBudget)).toBe(false); // collapse
    expect(algorithmSolved()).toBe(true); // but algorithm scoring solves it
  });
  it("flags River-Crossing impossible for N >= 6", () => {
    expect(riverCrossingImpossibleN).toBe(6);
  });
  it("is preprint-flagged", () => expect(d.citation.preprint).toBe(true));
});

describe("preprint flagging (all Act 3 non-peer-reviewed sources)", () => {
  it("pages 14, 16, 17, 18, 19 data are preprint/non-peer-reviewed", () => {
    expect(curves.budgetForcing.citation.preprint).toBe(true);
    expect(curves.arcCost.citation.preprint).toBe(true);
    expect(curves.overthinking.citation.preprint).toBe(true);
    expect(curves.faithfulness.citation.preprint).toBe(true);
    expect(curves.illusion.citation.preprint).toBe(true);
  });
});
