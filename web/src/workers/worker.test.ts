import { describe, expect, it } from "vitest";
import { handleRequest } from "@/lib/mcProtocol";

describe("worker message contract", () => {
  it("handles a coverage request", () => {
    const res = handleRequest({ kind: "coverage", p: 0.3, n: 5, trials: 2000, seed: 1 });
    expect(res.kind).toBe("coverage");
    if (res.kind === "coverage") {
      expect(res.result).toBeGreaterThan(0);
      expect(res.result).toBeLessThanOrEqual(1);
    }
  });

  it("handles a self-consistency request and returns a curve + ballot", () => {
    const res = handleRequest({
      kind: "selfConsistency",
      ns: [1, 10, 40],
      currentN: 10,
      trials: 2000,
      seed: 3,
    });
    expect(res.kind).toBe("selfConsistency");
    if (res.kind === "selfConsistency") {
      expect(res.curve).toHaveLength(3);
      expect(res.curve[0].x).toBe(1);
      expect(res.ballot.tally.length).toBeGreaterThan(1);
      expect(res.currentN).toBe(10);
    }
  });
});
