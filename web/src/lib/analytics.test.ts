import { describe, expect, it } from "vitest";
import { engagementReport, learningGain } from "./analytics";

describe("engagement analytics (M8 instrumentation)", () => {
  it("computes manipulation rate over the 16 pages", () => {
    // reachedEnd keys off the last page in PAGES, which is 16: 20 and 21 were
    // cut in 2026-07, then 15, 16, 18 and 19 in 2026-08, and the wrap-up was
    // added as the new 16. The count is derived from PAGES, never hardcoded.
    const r = engagementReport({ 1: 3, 6: 1, 16: 2 });
    expect(r.totalPages).toBe(16);
    expect(r.pagesManipulated).toBe(3);
    expect(r.manipulationRate).toBeCloseTo(3 / 16, 5);
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
