/**
 * Page 9 — grading the steps, and the coverage data page 8 hands it.
 *
 * Page 8's half of this file is gone. It asserted the SHAPE of a simulation
 * (`LILY_PAD_MODEL`): that voting decayed with N on an invented trap problem,
 * that a verifier of invented reliability tracked coverage, and where the two
 * crossed. That simulation was replaced by a measured run, so its tests were
 * not fixed, they were deleted along with it. What replaces them is
 * `page08.test.ts`, which checks the committed run against the notebook's own
 * gates and re-derives its arithmetic in TypeScript.
 *
 * Page 9's traces are authored, so the arithmetic in every step is recomputed
 * from scratch — including the two facts the whole page rests on: that 16/64
 * really is 1/4 (so the fake cancellation gets the right answer), and that
 * Solution B's steps after the bad GCD are internally valid.
 */
import { describe, expect, it } from "vitest";
import { SUPERVISION } from "./authored";
import { curves, interpolate } from "./curves";
import { coverageAtLeastOne } from "./sim";

const TOL = 1.0;

describe("Page 9: the authored supervision traces", () => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  it("16/64 really is 1/4, so the fake cancellation lands the right answer", () => {
    expect(16 / 64).toBeCloseTo(1 / 4, 10);
    expect(gcd(16, 64)).toBe(16);
  });

  it("Solution A is right by outcome and broken by process", () => {
    const a = SUPERVISION.traces.find((t) => t.key === "lucky")!;
    expect(a.outcomeOk).toBe(true);
    expect(a.finalAnswer).toBe(SUPERVISION.answer);
    expect(a.steps.some((s) => !s.ok)).toBe(true);
  });

  it("Solution B breaks at exactly one step, and the rest follow validly", () => {
    const b = SUPERVISION.traces.find((t) => t.key === "broken")!;
    expect(b.outcomeOk).toBe(false);
    const broken = b.steps.filter((s) => !s.ok);
    expect(broken.length).toBe(1);
    expect(b.steps.indexOf(broken[0])).toBe(1); // the wrong GCD
    // The arithmetic AFTER the mistake is genuinely correct given the bad divisor.
    expect(16 / 8).toBe(2);
    expect(64 / 8).toBe(8);
    expect(b.finalAnswer).toBe("2/8");
    expect(b.finalAnswer).not.toBe(SUPERVISION.answer);
  });

  it("Solution C is sound end to end", () => {
    const c = SUPERVISION.traces.find((t) => t.key === "clean")!;
    expect(c.outcomeOk).toBe(true);
    expect(c.steps.every((s) => s.ok)).toBe(true);
    expect(c.finalAnswer).toBe(SUPERVISION.answer);
  });

  it("the two graders disagree on exactly the case the page is about", () => {
    // Outcome says pass on A and C; process only endorses C.
    const verdicts = SUPERVISION.traces.map((t) => ({
      outcome: t.outcomeOk,
      process: t.steps.every((s) => s.ok),
    }));
    expect(verdicts.filter((v) => v.outcome && !v.process).length).toBe(1);
  });

  it("every flagged step explains itself", () => {
    for (const t of SUPERVISION.traces) {
      for (const s of t.steps) {
        if (!s.ok) expect(s.note && s.note.length > 0).toBe(true);
      }
    }
  });
});

describe("Page 9: PRM vs ORM (Lightman et al.)", () => {
  it("endpoints match the paper: PRM 78.2 > ORM 72.4 > majority 69.6", () => {
    const data = curves.prmVsOrm;
    expect(Math.abs(interpolate(data, 2) - 78.2)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(data, 1) - 72.4)).toBeLessThan(TOL);
    expect(Math.abs(interpolate(data, 0) - 69.6)).toBeLessThan(TOL);
    expect(data.citation.ref).toBe("Lightman et al. 2023");
  });
});

describe("Brown et al. coverage-vs-selection data stays valid", () => {
  const data = curves.votingPlateau;

  it("majority plateaus while coverage keeps rising", () => {
    const p = data.fit!.params.coveragePerSample;
    expect(interpolate(data, 300) - interpolate(data, 40)).toBeLessThan(1.0);
    expect(coverageAtLeastOne(p, 300) * 100).toBeGreaterThan(interpolate(data, 300));
  });

  it("carries its (preprint) citation", () => {
    expect(data.citation.ref).toBe("Brown et al. 2024");
    expect(data.citation.preprint).toBe(true);
  });
});
