import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import { MENTAL_MATH, TRACE_BANK, TRACE_BANK_STAT } from "./authored";
import { coverageAtLeastOne, sampleGrid } from "./sim";

const TOL = 1.0;

describe("Act 1 data fidelity", () => {
  it("Page 2/3: chain-of-thought 17.9% -> 56.9% (+39.0) matches Wei et al.", () => {
    const cot = curves.chainOfThought;
    const standard = interpolate(cot, 0);
    const withCot = interpolate(cot, 1);
    expect(Math.abs(standard - 17.9)).toBeLessThan(TOL);
    expect(Math.abs(withCot - 56.9)).toBeLessThan(TOL);
    expect(Math.abs(withCot - standard - 39.0)).toBeLessThan(TOL);
    expect(cot.citation.ref).toBe("Wei et al. 2022");
    expect(cot.citation.preprint).toBe(false);
  });
});

describe("Page 1 authored mental-math set", () => {
  it("System 1 problem is easy either way; System 2 problem needs the slow gear", () => {
    const s1 = MENTAL_MATH.find((p) => p.kind === "system1")!;
    const s2 = MENTAL_MATH.find((p) => p.kind === "system2")!;
    expect(s1.fastAccuracy).toBeGreaterThan(0.9);
    expect(s2.fastAccuracy).toBeLessThan(0.5);
    expect(s2.slowAccuracy).toBeGreaterThan(s2.fastAccuracy);
  });
});

describe("Page 4 authored trace bank (Yao et al. error analysis)", () => {
  it("contains both correct and incorrect chains", () => {
    expect(TRACE_BANK.some((t) => t.correct)).toBe(true);
    expect(TRACE_BANK.some((t) => !t.correct)).toBe(true);
  });

  it("the majority of chains fail after their first step (> ~60%)", () => {
    const frac = TRACE_BANK.filter((t) => t.failsAfterFirstStep).length / TRACE_BANK.length;
    expect(frac).toBeGreaterThanOrEqual(TRACE_BANK_STAT.reportedFailAfterStep1);
  });

  it("every failing chain is an incorrect chain", () => {
    for (const t of TRACE_BANK) {
      if (t.failsAfterFirstStep) expect(t.correct).toBe(false);
    }
  });
});

describe("Page 5 coverage sampling", () => {
  it("sampleGrid is deterministic and the right length", () => {
    const a = sampleGrid(0.35, 8, 7);
    const b = sampleGrid(0.35, 8, 7);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
  });

  it("coverage rises with attempts toward 1", () => {
    expect(coverageAtLeastOne(0.35, 10)).toBeGreaterThan(coverageAtLeastOne(0.35, 1));
    expect(coverageAtLeastOne(0.35, 10)).toBeLessThan(1);
  });
});
