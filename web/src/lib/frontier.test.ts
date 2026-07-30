import { describe, expect, it } from "vitest";
import { curves } from "./curves";
import { twoAxisAccuracy } from "./frontier";

/**
 * Page 13 (Frontier Reasoners I) data fidelity + the two-axis law.
 * The o1 announcement's compute axes are unlabeled, so the curve's SHAPE is
 * authored; these tests pin the authored law to the file's params and pin the
 * verbatim anchors the page prints to the published numbers.
 */

const P = curves.o1Scaling.fit!.params;
const Q = curves.o3Preview.fit!.params;

describe("twoAxisAccuracy (page 13 law)", () => {
  it("spans the figure's visual range on the fully-trained run", () => {
    expect(twoAxisAccuracy(0, 2, P.intercept, P.slopePerDecade)).toBeCloseTo(21.0, 5);
    expect(twoAxisAccuracy(2, 2, P.intercept, P.slopePerDecade)).toBeCloseTo(80.0, 5);
  });

  it("a decade of test-time compute equals a decade of train-time compute", () => {
    const testDecade = twoAxisAccuracy(1, 2, P.intercept, P.slopePerDecade);
    const trainDecade = twoAxisAccuracy(2, 1, P.intercept, P.slopePerDecade);
    expect(testDecade).toBeCloseTo(trainDecade, 10);
    expect(testDecade - twoAxisAccuracy(0, 2, P.intercept, P.slopePerDecade)).toBeCloseTo(
      P.slopePerDecade,
      10,
    );
  });

  it("clamps to the floor rather than going negative", () => {
    expect(twoAxisAccuracy(0, 0, P.intercept, P.slopePerDecade, P.maxExp, P.floor)).toBe(P.floor);
  });

  it("passes through o1's verbatim pass@1 anchor on the full run", () => {
    const xExp = (P.o1Pass1 - P.intercept) / P.slopePerDecade;
    expect(xExp).toBeGreaterThan(0);
    expect(xExp).toBeLessThan(P.maxExp);
    expect(twoAxisAccuracy(xExp, 2, P.intercept, P.slopePerDecade)).toBeCloseTo(P.o1Pass1, 5);
  });

  it("matches the stored curve points", () => {
    for (const pt of curves.o1Scaling.points) {
      expect(twoAxisAccuracy(Math.log10(pt.x), 2, P.intercept, P.slopePerDecade)).toBeCloseTo(
        pt.y,
        0,
      );
    }
  });
});

/*
 * The page prints a subset of these (AIME waterfall anchors, o3's AIME); the
 * rest pin the data files' provenance so the verbatim record survives even
 * where the page has been abstracted away from raw scores.
 */
describe("o1 / o3 published anchors (data files; the page prints a subset)", () => {
  it("pins the o1 announcement numbers", () => {
    expect(P.gpt4oAime).toBe(12);
    expect(P.o1Pass1).toBe(74.4);
    expect(P.o1Cons64).toBe(83.3);
    expect(P.o1Rerank1000).toBe(93);
    expect(P.gpt4oElo).toBe(808);
    expect(P.o1Elo).toBe(1673);
    expect(P.gpt4oGpqa).toBe(56.1);
    expect(P.o1Gpqa).toBe(78.0);
    expect(P.expertGpqa).toBe(69.7);
  });

  it("pins the o3 preview numbers", () => {
    expect(Q.o3Aime).toBe(96.7);
    expect(Q.o3Gpqa).toBe(87.7);
    expect(Q.o1Swe).toBe(48.9);
    expect(Q.o3Swe).toBe(71.7);
    expect(Q.o3Elo).toBe(2727);
  });

  it("both files carry citations and disclose what is authored vs verbatim", () => {
    expect(curves.o1Scaling.citation.url).toContain("openai.com");
    expect(curves.o1Scaling.provenance).toMatch(/UNLABELED/);
    expect(curves.o1Scaling.provenance).toMatch(/authored/i);
    expect(curves.o3Preview.citation.preprint).toBe(true);
    expect(curves.o3Preview.provenance).toMatch(/announcement/i);
  });
});
