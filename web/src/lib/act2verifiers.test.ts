/**
 * The published curve data Act 2 still cites, after pages 8 and 9 stopped
 * simulating their own.
 *
 * Page 8's half of this file is gone. It asserted the SHAPE of a simulation
 * (`LILY_PAD_MODEL`): that voting decayed with N on an invented trap problem,
 * that a verifier of invented reliability tracked coverage, and where the two
 * crossed. That simulation was replaced by a measured run, so its tests were
 * not fixed, they were deleted along with it. What replaces them is
 * `page08.test.ts`, which checks the committed run against the notebook's own
 * gates and re-derives its arithmetic in TypeScript.
 *
 * Page 9's half went the same way, and for the same reason. Its traces were
 * authored and its step labels were hand-written `ok` booleans revealed as a
 * PRM's verdict, so the tests that recomputed 16/64 and Solution B's arithmetic
 * were checking that our own fiction was internally consistent. Both are gone,
 * replaced by `page09.test.ts`, which checks a measured run against the
 * notebook's claim gates and re-derives its aggregates in TypeScript.
 *
 * What is left here is the published curve data neither page generates.
 */
import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import { coverageAtLeastOne } from "./sim";

const TOL = 1.0;

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
