/**
 * Page 12's section 2, checked against the notebook's committed data. Loading
 * `PAGE12` already re-derives every curve point with the page's own `harvest`;
 * these pin the claims the copy makes from them.
 */
import { describe, expect, it } from "vitest";
import { PAGE12, RULES, cellState, curvePoint, harvest, popular, type Rule } from "./page12";

const N = PAGE12.n_chains;
const at = (rule: Rule, k: number) => PAGE12.curves[rule][k - 1];

describe("Page 12: the harvest", () => {
  it("is page 7's pile: 100 problems, 16 chains each", () => {
    expect(PAGE12.problems).toHaveLength(100);
    expect(N).toBe(16);
    for (const p of PAGE12.problems) expect(p.correct).toHaveLength(N);
  });

  it("the answer key never keeps a wrong chain, at any number of attempts", () => {
    for (const pt of PAGE12.curves.key) expect(pt.chains_wrong).toBe(0);
  });

  it("more attempts never lose a lesson under the answer key", () => {
    for (let k = 2; k <= N; k++) {
      expect(at("key", k).problems_with_lesson).toBeGreaterThanOrEqual(at("key", k - 1).problems_with_lesson);
    }
    expect(at("key", N).problems_with_lesson).toBeGreaterThan(at("key", 1).problems_with_lesson);
  });

  it("the most popular answer lets wrong chains in", () => {
    expect(at("popular", N).chains_wrong).toBeGreaterThan(0);
    // With one attempt every chain is its own majority: nothing is filtered.
    expect(at("popular", 1).problems_with_lesson).toBe(100);
  });

  it("counts the problems that never yield and the ones the vote missed consistently", () => {
    expect(PAGE12.never.length).toBe(100 - at("key", N).problems_with_lesson);
    for (const id of PAGE12.vote_missed) {
      const p = PAGE12.problems.find((q) => q.problem_id === id)!;
      expect(p.correct.some(Boolean)).toBe(true);
      expect(harvest(p, N, "popular").some((j) => p.correct[j])).toBe(false);
    }
  });

  it("a tie is not a vote", () => {
    expect(popular([0, 1], 2)).toBeNull();
    expect(popular([0, 1, 1], 3)).toBe(1);
    expect(popular([-1, -1], 2)).toBeNull();
  });

  it("recomputes the notebook's curves exactly", () => {
    for (const rule of RULES) {
      for (const pt of PAGE12.curves[rule]) expect(curvePoint(PAGE12.problems, pt.k, rule)).toEqual(pt);
    }
  });

  it("the hint retry fills empty squares under the answer key only, and never adds a wrong answer", () => {
    expect(PAGE12.hint).not.toBeNull();
    const at16 = PAGE12.problems.filter((p) => cellState(p, N, "key", true) === "hint");
    // At 16 chains the empty squares are exactly `never`, so the hint fills the ones it recovered.
    expect(at16.map((p) => p.problem_id).sort()).toEqual([...PAGE12.hint!.recovered_never].sort());
    for (const p of PAGE12.problems) {
      for (const k of [1, 4, 16]) {
        expect(cellState(p, k, "popular", true)).not.toBe("hint");
        if (cellState(p, k, "key", true) === "hint") expect(p.hint!.correct).toBe(true);
      }
    }
  });

  it("the step grader ignores the answer: it lets wrong answers in and keeps some right ones out", () => {
    expect(at("prm", N).chains_wrong).toBeGreaterThan(0);
    const rightIn = at("prm", N).chains_kept - at("prm", N).chains_wrong;
    expect(PAGE12.prm.right_total - rightIn).toBe(PAGE12.prm.right_rejected);
    for (const id of PAGE12.prm.lost) {
      const p = PAGE12.problems.find((q) => q.problem_id === id)!;
      expect(p.correct.some(Boolean)).toBe(true);
      expect(harvest(p, N, "prm").some((j) => p.correct[j])).toBe(false);
    }
    // A chain page 9 never graded never passes.
    for (const p of PAGE12.problems) for (const j of harvest(p, N, "prm")) expect(p.prm_pass[j]).toBe(true);
  });
});
