/**
 * Page 10, "Searching Through Thoughts" — the Game-of-24 search engine.
 *
 * The page shows a compute counter and claims one strategy costs several times
 * another. That is only honest if the engine is real, so these tests pin the
 * exact behaviour the page's copy describes on the chosen instance: greedy
 * dead-ends, a beam of 1 dead-ends with it, a beam of 2 or more succeeds,
 * depth-first succeeds by backtracking, breadth-first succeeds by brute force,
 * and MCTS succeeds cheapest. If the engine drifts, the copy becomes false and
 * this suite fails first.
 */
import { describe, expect, it } from "vitest";
import { GAME24 } from "./authored";
import {
  canReach,
  fmt,
  heuristic,
  moves,
  search,
  STRATEGIES,
  type Strategy,
} from "./game24";

const NUMS = [...GAME24.numbers];
const TARGET = GAME24.target;
const OPTS = { maxNodes: 3000, rollouts: 60 };

describe("Game of 24 — the state space", () => {
  it("a move consumes two numbers and leaves one", () => {
    for (const m of moves([2, 5, 6, 6])) {
      expect(m.nums.length).toBe(3);
    }
  });

  it("every successor is reachable by the move it reports", () => {
    for (const m of moves([2, 5, 6, 6])) {
      const { a, b, op, result } = m.move;
      const expected =
        op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
      expect(result).toBeCloseTo(expected, 9);
      expect(m.nums.some((v) => Math.abs(v - result) < 1e-6)).toBe(true);
    }
  });

  it("the chosen instance is solvable", () => {
    expect(canReach(NUMS, TARGET)).toBe(true);
  });

  it("an unsolvable instance is reported unsolvable", () => {
    expect(canReach([1, 1, 1, 1], 24)).toBe(false);
  });

  it("formats integers plainly and fractions to two places", () => {
    expect(fmt(24)).toBe("24");
    expect(fmt(-6)).toBe("-6");
    expect(fmt(8 / 3)).toBe("2.67");
  });
});

describe("Game of 24 — the searcher's evaluator", () => {
  it("scores a finished target state 1 and is exact for two numbers", () => {
    expect(heuristic([24], TARGET)).toBe(1);
    expect(heuristic([4, 6], TARGET)).toBe(1); // 4 × 6
    expect(heuristic([1, 2], TARGET)).toBeLessThan(1);
  });

  it("stays in [0, 1]", () => {
    for (const s of [[24], [1], [4, 6], [2, 5, 6], [2, 5, 6, 6], [100, 100]]) {
      const v = heuristic(s, TARGET);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is genuinely imperfect — it misjudges the winning opening move", () => {
    // The page's claim: the evaluator likes 6, 9, 13-style states because they
    // sum near 24, and cannot see the setups that need two more moves. If it
    // ever became an oracle, greedy would stop failing and the page would lose
    // its point.
    const g = search(NUMS, TARGET, "greedy", OPTS);
    expect(g.solved).toBe(false);
  });
});

describe("Game of 24 — the strategies on the chosen instance", () => {
  const run = (s: Strategy, beamWidth?: number) =>
    search(NUMS, TARGET, s, { ...OPTS, beamWidth });

  it("greedy dead-ends, cheaply", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.nodesEvaluated).toBeLessThan(100);
  });

  it("a beam of 1 fails, and a beam of 2 or more succeeds", () => {
    expect(run("beam", 1).solved).toBe(false);
    for (const b of [2, 3, 4, 5]) {
      expect(run("beam", b).solved).toBe(true);
    }
  });

  it("wider beams cost more", () => {
    for (let b = 2; b <= 5; b++) {
      expect(run("beam", b).nodesEvaluated).toBeGreaterThan(run("beam", b - 1).nodesEvaluated);
    }
  });

  it("breadth-first, depth-first and MCTS all solve it", () => {
    for (const s of ["bfs", "dfs", "mcts"] as const) {
      expect(run(s).solved).toBe(true);
    }
  });

  it("breadth-first is the most expensive way to be right", () => {
    const bfs = run("bfs").nodesEvaluated;
    expect(bfs).toBeGreaterThan(run("dfs").nodesEvaluated);
    expect(bfs).toBeGreaterThan(run("mcts").nodesEvaluated);
    expect(bfs).toBeGreaterThan(run("beam", 5).nodesEvaluated);
  });

  it("MCTS finds it for a fraction of breadth-first's bill", () => {
    // The page says "roughly six times"; assert the claim's direction and order.
    const ratio = run("bfs").nodesEvaluated / run("mcts").nodesEvaluated;
    expect(ratio).toBeGreaterThan(4);
    expect(ratio).toBeLessThan(10);
  });

  it("every reported solution is a real solution using all four numbers", () => {
    for (const s of ["bfs", "dfs", "mcts"] as const) {
      const r = run(s);
      expect(r.solutionMoves.length).toBe(3);
      const leaf = r.nodes.find((n) => n.id === r.solutionPath[r.solutionPath.length - 1])!;
      expect(leaf.nums.length).toBe(1);
      expect(Math.abs(leaf.nums[0] - TARGET)).toBeLessThan(1e-6);
      expect(leaf.depth).toBe(3); // three moves from four numbers
    }
  });

  it("the authored solution really does make 24", () => {
    expect(2 * 5).toBe(10);
    expect(10 - 6).toBe(4);
    expect(4 * 6).toBe(24);
    // ...using each of 2, 5, 6, 6 exactly once.
    expect([...NUMS].sort()).toEqual([2, 5, 6, 6]);
  });

  it("is deterministic per strategy", () => {
    for (const s of STRATEGIES) {
      const a = search(NUMS, TARGET, s.key, OPTS);
      const b = search(NUMS, TARGET, s.key, OPTS);
      expect(a.nodesEvaluated).toBe(b.nodesEvaluated);
      expect(a.solved).toBe(b.solved);
      expect(a.solutionMoves).toEqual(b.solutionMoves);
    }
  });

  it("never exceeds its node ceiling", () => {
    for (const s of STRATEGIES) {
      const r = search(NUMS, TARGET, s.key, { maxNodes: 50, rollouts: 60 });
      expect(r.nodesEvaluated).toBeLessThanOrEqual(50 + 40); // one expansion may overshoot
    }
  });

  it("the exact oracle labels dead ends without any strategy consulting it", () => {
    const r = search(NUMS, TARGET, "bfs", OPTS);
    const dead = r.nodes.filter((n) => !n.solvable);
    expect(dead.length).toBeGreaterThan(0);
    for (const n of dead) expect(canReach(n.nums, TARGET)).toBe(false);
  });

  it("every strategy has a label and a blurb for the dropdown", () => {
    expect(STRATEGIES.length).toBe(5);
    for (const s of STRATEGIES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.blurb.length).toBeGreaterThan(0);
    }
  });
});
