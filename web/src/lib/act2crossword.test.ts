/**
 * Page 10 — the shaded-column puzzle and the search over it.
 *
 * The page prints a "thoughts scored" counter and claims one strategy costs
 * twice another. That is only honest if the engine is real, so these tests pin
 * the exact behaviour the copy describes: greedy writes the best answer to
 * every clue and ends with a column reading SIP, a beam of 1 is greedy exactly,
 * a beam of 2 still fails, a beam of 3 is the cheapest that works, MCTS is the
 * cheapest successful strategy, and breadth-first pays the most.
 *
 * Every number here was measured, not chosen.
 */
import { describe, expect, it } from "vitest";
import { ACROSTIC_PLAIN_COT, ACROSTIC_SPEC } from "./authored";
import { buildAcrostic, type AcrosticSpec } from "./crossword";
import { search, STRATEGIES, type Strategy } from "./thoughtSearch";

const A = buildAcrostic(ACROSTIC_SPEC as unknown as AcrosticSpec);
const SPACE = A.space;
const OPTS = { maxNodes: 3000, rollouts: 80 };
const run = (s: Strategy, b?: number) => search(SPACE, s, { ...OPTS, beamWidth: b });
const cost = (s: Strategy, b?: number) => run(s, b).thoughtsScored;
const words = (id: number) => A.states[id].words;

describe("The puzzle", () => {
  it("has exactly one solution, and it spells the down answer", () => {
    const goals = SPACE.thoughts.filter((t) => t.isGoal);
    expect(goals).toHaveLength(1);
    expect(words(SPACE.goal)).toEqual(["TOT", "INN", "PEN"]);
    expect(A.columnText(A.states[SPACE.goal])).toBe(A.spec.down.answer);
  });

  it("is small enough to hold in your head: 8 possible grids", () => {
    const full = A.states.filter((s) => s.filled === A.size);
    expect(full).toHaveLength(8);
    expect(full.filter((s) => SPACE.thoughts[s.id].isGoal)).toHaveLength(1);
  });

  it("each clue has exactly one right answer, and every answer is three letters", () => {
    for (const r of A.spec.rows) {
      expect(r.candidates.filter((c) => c.correct), r.clue).toHaveLength(1);
      for (const c of r.candidates) expect(c.word.length, c.word).toBe(3);
    }
    expect(A.spec.down.answer).toHaveLength(A.size);
  });
});

describe("The evaluator's blindness", () => {
  it("exactly one clue traps you: its best answer is the wrong one", () => {
    const trapped = A.spec.rows.filter((r) => {
      const best = [...r.candidates].sort((a, b) => b.confidence - a.confidence)[0];
      return !best.correct;
    });
    expect(trapped).toHaveLength(1);
    expect(trapped[0].clue).toBe("Add up");
  });

  it("SUM is the model's most confident answer anywhere, and it is wrong", () => {
    const all = A.spec.rows
      .flatMap((r) => r.candidates)
      .sort((a, b) => b.confidence - a.confidence);
    expect(all[0].word).toBe("SUM");
    expect(all[0].correct).toBe(false);
  });

  it("no grid containing SUM can ever be finished", () => {
    const seen = new Set<number>();
    const walk = (id: number) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const n of SPACE.thoughts[id].next) walk(n);
    };
    const sum = SPACE.thoughts[SPACE.root].next.find((id) => A.states[id].placed?.word === "SUM")!;
    walk(sum);
    expect(seen.has(SPACE.goal)).toBe(false);
  });

  it("a full grid with the wrong column is a dead end, not a win", () => {
    const dead = A.states.filter((s) => s.filled === A.size && !SPACE.thoughts[s.id].isGoal);
    expect(dead).toHaveLength(7);
    for (const s of dead) {
      expect(SPACE.thoughts[s.id].deadEnd).toBe(true);
      // and it must not score as finished, or MCTS would be rewarded for it
      expect(SPACE.thoughts[s.id].progress).toBeLessThan(1);
    }
  });
});

describe("The strategies", () => {
  it("greedy writes the best answer to every clue and lands on SIP", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.thoughtsScored).toBe(12);
    expect(words(r.deadEndReached!)).toEqual(["SUM", "INN", "PEN"]);
    expect(A.columnText(A.states[r.deadEndReached!])).toBe("SIP");
  });

  it("a beam of 1 is greedy exactly, and a beam of 2 still fails", () => {
    expect(cost("beam", 1)).toBe(cost("greedy"));
    expect(run("beam", 1).solved).toBe(false);
    expect(run("beam", 2).solved).toBe(false);
    expect(cost("beam", 2)).toBe(16);
  });

  it("a beam of 3 is the cheapest width that works", () => {
    for (const b of [1, 2]) expect(run("beam", b).solved, `b=${b}`).toBe(false);
    for (const b of [3, 4, 5]) expect(run("beam", b).solved, `b=${b}`).toBe(true);
    expect(cost("beam", 3)).toBe(19);
  });

  it("every extra beam slot costs more", () => {
    expect([1, 2, 3, 4, 5].map((b) => cost("beam", b))).toEqual([12, 16, 19, 22, 23]);
  });

  it("MCTS is the cheapest strategy that finishes", () => {
    const r = run("mcts");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(16);
    for (const c of [cost("dfs"), cost("bfs"), cost("beam", 3)]) {
      expect(r.thoughtsScored).toBeLessThan(c);
    }
  });

  it("depth-first backtracks out of the trap, breadth-first pays the most", () => {
    expect(run("dfs").solved).toBe(true);
    expect(cost("dfs")).toBe(18);
    const bfs = run("bfs");
    expect(bfs.solved).toBe(true);
    expect(bfs.thoughtsScored).toBe(24);
    expect(bfs.thoughtsScored).toBe(2 * cost("greedy"));
  });

  it("the full cost ordering the page prints", () => {
    expect(cost("greedy")).toBe(12);
    expect(cost("mcts")).toBe(16);
    expect(cost("dfs")).toBe(18);
    expect(cost("bfs")).toBe(24);
  });

  it("every successful strategy finds the same, only, grid", () => {
    for (const [s, b] of [["dfs"], ["bfs"], ["mcts"], ["beam", 3], ["beam", 5]] as const) {
      const r = run(s as Strategy, b as number | undefined);
      expect(r.solved, String(s)).toBe(true);
      expect(words(r.solutionThoughts.at(-1)!), String(s)).toEqual(["TOT", "INN", "PEN"]);
    }
  });

  it("is deterministic", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) expect(cost(s), s).toBe(cost(s));
  });
});

describe("Page copy guardrails", () => {
  it("every strategy in the picker actually runs", () => {
    expect(STRATEGIES.map((s) => s.key)).toEqual(["greedy", "bfs", "dfs", "beam", "mcts"]);
    for (const s of STRATEGIES) expect(run(s.key).nodes.length, s.key).toBeGreaterThan(1);
  });

  it("the tree stays drawable", () => {
    const widestKept = (s: Strategy, b?: number) => {
      const cols = new Map<number, number>();
      for (const n of run(s, b).nodes) if (n.kept) cols.set(n.depth, (cols.get(n.depth) ?? 0) + 1);
      return Math.max(...cols.values());
    };
    expect(widestKept("greedy")).toBeLessThanOrEqual(2);
    expect(widestKept("beam", 3)).toBeLessThanOrEqual(4);
    expect(widestKept("mcts")).toBeLessThanOrEqual(4);
    expect(widestKept("bfs")).toBeLessThanOrEqual(14);
  });

  it("the plain chain-of-thought contrast lands in greedy's grid", () => {
    expect(ACROSTIC_PLAIN_COT.correct).toBe(false);
    const text = ACROSTIC_PLAIN_COT.steps.join(" ");
    for (const w of ["SUM", "INN", "PEN", "SIP"]) expect(text, w).toContain(w);
  });
});
