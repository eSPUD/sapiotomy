import { describe, expect, it } from "vitest";
import { engagementReport, learningGain } from "./analytics";

describe("engagement analytics (M8 instrumentation)", () => {
  it("computes manipulation rate over the 19 pages", () => {
    const r = engagementReport({ 1: 3, 6: 1, 19: 2 });
    expect(r.totalPages).toBe(19);
    expect(r.pagesManipulated).toBe(3);
    expect(r.manipulationRate).toBeCloseTo(3 / 19, 5);
    expect(r.reachedEnd).toBe(true);
  });

  it("flags pages below the 50% manipulation threshold (change trigger)", () => {
    // 10 participants; page 4 touched by only 3 (<50%), page 6 by 8 (>=50%).
    const r = engagementReport({}, { 4: 3, 6: 8 }, 10);
    expect(r.underThresholdPages).toContain(4);
    expect(r.underThresholdPages).not.toContain(6);
  });

  it("reports a positive learning gain", () => {
    const g = learningGain(1, 3);
    expect(g.delta).toBe(2);
    expect(g.improved).toBe(true);
  });
});
