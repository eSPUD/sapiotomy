/**
 * Page 10, "Searching Through Thoughts" — the thought-search engine.
 *
 * The page prints a "thoughts scored" counter and claims one strategy costs
 * several times another. That is only honest if the engine is real, so these
 * tests pin the exact behaviour the page's copy describes on the chosen
 * instance: greedy commits to the tightest-sounding group and strands, a beam
 * of 1 is greedy exactly, a beam of 2 still strands, a beam of 3 is the
 * cheapest width that survives, depth-first gets there by backtracking out of
 * the trap, breadth-first gets there by refusing to prune anything (the most
 * expensive), and MCTS matches the best beam without being told a width.
 *
 * Every number asserted here was measured from this engine, not chosen. If the
 * engine or the authored groups drift, the copy on the page becomes false and
 * this suite fails first. That is the point: the previous version of this page
 * shipped the line "MCTS finds the same route for a fraction of the bill" while
 * its own engine had MCTS and depth-first tied exactly, because no test pinned
 * the ordering the prose claimed.
 */
import { describe, expect, it } from "vitest";
import { THOUGHT_SPACE_SPEC, THOUGHT_PLAIN_COT } from "./authored";
import {
  buildThoughtSpace,
  search,
  STRATEGIES,
  type Strategy,
  type ThoughtSpaceSpec,
} from "./thoughtSearch";

const SPACE = buildThoughtSpace(THOUGHT_SPACE_SPEC as unknown as ThoughtSpaceSpec);
const OPTS = { maxNodes: 400, rollouts: 80 };
const run = (s: Strategy, beamWidth?: number) => search(SPACE, s, { ...OPTS, beamWidth });
const cost = (s: Strategy, beamWidth?: number) => run(s, beamWidth).thoughtsScored;

const groupNamed = (label: string) => SPACE.groups.find((g) => g.label === label)!;
const TRAP = groupNamed("Flowers");
const TRUE_FLOWERS = groupNamed("Flowers that are also girls' names");
const EYE = groupNamed("Parts of the eye");

describe("Thought space: the puzzle itself", () => {
  it("is sixteen words in four groups of four, with one complete solution", () => {
    expect(SPACE.words).toHaveLength(16);
    expect(new Set(SPACE.words).size).toBe(16);
    const goals = SPACE.thoughts.filter((t) => t.isGoal);
    expect(goals).toHaveLength(1);
    expect(goals[0].groups).toHaveLength(4);
    expect(goals[0].loose).toHaveLength(0);
  });

  it("the solution is exactly the four groups marked correct", () => {
    const solution = SPACE.thoughts[SPACE.goal].groups;
    const correct = SPACE.groups.filter((g) => g.correct).map((g) => g.id);
    expect([...solution].sort()).toEqual(correct.sort());
    // and those four really do partition the sixteen words
    const placed = solution.flatMap((id) => SPACE.groups[id].words);
    expect(new Set(placed).size).toBe(16);
  });

  it("every group is four distinct words drawn from the puzzle", () => {
    for (const g of SPACE.groups) {
      expect(g.words, g.label).toHaveLength(4);
      expect(new Set(g.words).size, g.label).toBe(4);
      for (const w of g.words) expect(SPACE.words, g.label).toContain(w);
    }
  });
});

describe("Thought space: the evaluator's blindness", () => {
  it("ranks a wrong group top, a wrong group second, and a correct group only third", () => {
    // This ranking is what gives the beam dial three regimes instead of two.
    const roots = SPACE.thoughts[SPACE.root].next
      .map((id) => SPACE.thoughts[id])
      .sort((a, b) => b.score - a.score)
      .map((t) => SPACE.groups[t.groups[0]]);
    expect(roots[0].correct).toBe(false);
    expect(roots[1].correct).toBe(false);
    expect(roots[2].correct).toBe(true);
  });

  it("scores the trap above the correct group it is one word away from", () => {
    // "Flowers" (ROSE LILY VIOLET IRIS) sounds tighter than "Flowers that are
    // also girls' names" (ROSE LILY VIOLET HEATHER), and the evaluator says so.
    // It is right about what it can see and wrong about what it cannot.
    expect(TRAP.correct).toBe(false);
    expect(TRUE_FLOWERS.correct).toBe(true);
    expect(TRAP.confidence).toBeGreaterThan(TRUE_FLOWERS.confidence);
    expect(TRAP.words).toContain("IRIS");
    expect(EYE.words).toContain("IRIS");
  });

  it("the trap is genuinely unsolvable, not merely unlucky", () => {
    // No complete solution contains it, so every strategy that commits to it
    // must back out or fail. (HEATHER appears in no group compatible with it.)
    const reachable = new Set<number>();
    const walk = (id: number) => {
      if (reachable.has(id)) return;
      reachable.add(id);
      for (const n of SPACE.thoughts[id].next) walk(n);
    };
    const trapState = SPACE.thoughts[SPACE.root].next.find(
      (id) => SPACE.thoughts[id].groups[0] === TRAP.id,
    )!;
    walk(trapState);
    expect(reachable.has(SPACE.goal)).toBe(false);
  });

  it("labels dead ends structurally, and no strategy is allowed to consult that", () => {
    const deadEnds = SPACE.thoughts.filter((t) => t.deadEnd);
    expect(deadEnds.length).toBeGreaterThan(0);
    for (const t of deadEnds) {
      expect(t.next).toHaveLength(0);
      expect(t.isGoal).toBe(false);
      expect(t.loose.length).toBeGreaterThan(0);
    }
  });
});

describe("The strategies on the chosen instance", () => {
  it("greedy commits to the tightest-sounding group and strands", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.thoughtsScored).toBe(11);
    // it strands three moves in, having taken the trap first
    const stranded = SPACE.thoughts[r.deadEndReached!];
    expect(stranded.depth).toBe(3);
    expect(stranded.groups).toContain(TRAP.id);
  });

  it("strands one word away from two correct groups — the aha, not an absence", () => {
    const r = run("greedy");
    // IRIS is in the wrong group, so the eye is short a part and HEATHER is homeless.
    expect([...SPACE.thoughts[r.deadEndReached!].loose].sort()).toEqual(
      ["HEATHER", "LENS", "PUPIL", "RETINA"].sort(),
    );
  });

  it("a beam of 1 is greedy exactly, and a beam of 2 still strands", () => {
    expect(run("beam", 1).solved).toBe(false);
    expect(cost("beam", 1)).toBe(cost("greedy"));
    expect(run("beam", 2).solved).toBe(false);
    expect(cost("beam", 2)).toBe(15);
  });

  it("a beam of 3 is the cheapest width that survives", () => {
    for (const b of [1, 2]) expect(run("beam", b).solved, `b=${b}`).toBe(false);
    for (const b of [3, 4, 5]) expect(run("beam", b).solved, `b=${b}`).toBe(true);
    expect(cost("beam", 3)).toBe(21);
  });

  it("widening the beam past 3 only costs more", () => {
    expect(cost("beam", 3)).toBeLessThan(cost("beam", 4));
    expect(cost("beam", 4)).toBeLessThan(cost("beam", 5));
    expect(cost("beam", 4)).toBe(24);
    expect(cost("beam", 5)).toBe(26);
  });

  it("depth-first gets there by backtracking out of the trap", () => {
    const r = run("dfs");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(23);
    // it really did enter the trap before finding the answer
    expect(r.nodes.some((n) => SPACE.thoughts[n.thoughtId].groups.includes(TRAP.id))).toBe(true);
    expect(r.nodes.some((n) => n.deadEnd)).toBe(true);
  });

  it("breadth-first gets there by refusing to prune, and pays the most", () => {
    const r = run("bfs");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(31);
    for (const s of ["greedy", "dfs", "mcts"] as Strategy[]) {
      expect(r.thoughtsScored, s).toBeGreaterThan(cost(s));
    }
    for (const b of [1, 2, 3, 4, 5]) {
      expect(r.thoughtsScored, `b=${b}`).toBeGreaterThan(cost("beam", b));
    }
  });

  it("MCTS matches the best beam without being told a width", () => {
    const r = run("mcts");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(21);
    expect(r.thoughtsScored).toBe(cost("beam", 3));
    expect(r.thoughtsScored).toBeLessThan(cost("dfs"));
  });

  it("the full cost ordering the page prints", () => {
    // greedy/beam-1 (fail) < beam-2 (fail) < MCTS = beam-3 < beam-4 < beam-5 < DFS? no:
    // measured, and asserted here so the prose can never drift from it.
    expect(cost("greedy")).toBe(11);
    expect(cost("beam", 1)).toBe(11);
    expect(cost("beam", 2)).toBe(15);
    expect(cost("mcts")).toBe(21);
    expect(cost("beam", 3)).toBe(21);
    expect(cost("dfs")).toBe(23);
    expect(cost("beam", 4)).toBe(24);
    expect(cost("beam", 5)).toBe(26);
    expect(cost("bfs")).toBe(31);
  });

  it("every successful strategy finds the same, only, solution", () => {
    for (const [s, b] of [["dfs"], ["bfs"], ["mcts"], ["beam", 3], ["beam", 4], ["beam", 5]] as const) {
      const r = run(s as Strategy, b as number | undefined);
      expect(r.solved, String(s)).toBe(true);
      expect([...r.solutionGroups].sort(), String(s)).toEqual(
        SPACE.groups.filter((g) => g.correct).map((g) => g.id),
      );
    }
  });

  it("is deterministic: the same call twice gives the same trace", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) {
      expect(cost(s), s).toBe(cost(s));
    }
    expect(run("mcts").solutionThoughts).toEqual(run("mcts").solutionThoughts);
  });
});

describe("Page copy guardrails", () => {
  it("every strategy in the picker actually runs", () => {
    expect(STRATEGIES.map((s) => s.key)).toEqual(["greedy", "bfs", "dfs", "beam", "mcts"]);
    for (const s of STRATEGIES) {
      expect(run(s.key).nodes.length, s.key).toBeGreaterThan(1);
    }
  });

  it("the plain chain-of-thought contrast is wrong, and places every word anyway", () => {
    expect(THOUGHT_PLAIN_COT.correct).toBe(false);
    expect(THOUGHT_PLAIN_COT.steps).toHaveLength(4);
  });

  it("no strategy exceeds the node ceiling on this instance", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) {
      expect(cost(s), s).toBeLessThan(OPTS.maxNodes);
    }
  });
});
