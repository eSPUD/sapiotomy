/**
 * Page 10, "Searching Through Thoughts" — the mini crossword and the search
 * over it.
 *
 * The page prints a "thoughts scored" counter and claims one strategy costs
 * three times another. That is only honest if the engine is real, so these
 * tests pin the exact behaviour the copy describes: greedy writes the answer it
 * is surest of and jams the grid, a beam of 1 is greedy exactly, beams of 2 and
 * 3 still jam, a beam of 4 is the cheapest width that survives, MCTS is the
 * cheapest successful strategy of all, and breadth-first refuses to prune and
 * pays the most.
 *
 * Every number asserted here was measured from this engine, not chosen. The
 * previous version of this page shipped the line "MCTS finds the same route for
 * a fraction of the bill" while its own engine had MCTS and depth-first tied
 * exactly, because no test pinned the ordering the prose claimed.
 */
import { describe, expect, it } from "vitest";
import { CROSSWORD_PLAIN_COT, CROSSWORD_SPEC } from "./authored";
import { buildCrossword, type CrosswordSpec } from "./crossword";
import { search, STRATEGIES, type Strategy } from "./thoughtSearch";

const XW = buildCrossword(CROSSWORD_SPEC as unknown as CrosswordSpec);
const SPACE = XW.space;
const OPTS = { maxNodes: 3000, rollouts: 80 };
const run = (s: Strategy, beamWidth?: number) => search(SPACE, s, { ...OPTS, beamWidth });
const cost = (s: Strategy, beamWidth?: number) => run(s, beamWidth).thoughtsScored;

const rowsOf = (id: number) => {
  const n = XW.spec.size;
  return Array.from({ length: n }, (_, r) =>
    XW.states[id].cells.slice(r * n, r * n + n).map((c) => c ?? "_").join(""),
  );
};

describe("The crossword itself", () => {
  it("has exactly one finished grid, and it is the intended one", () => {
    const goals = SPACE.thoughts.filter((t) => t.isGoal);
    expect(goals).toHaveLength(1);
    expect(rowsOf(SPACE.goal)).toEqual(["CAP", "ORE", "TEN"]);
  });

  it("the finished grid reads as real answers downward too", () => {
    const down = XW.spec.entries.filter((e) => e.dir === "down");
    expect(down.map((e) => XW.readEntry(XW.states[SPACE.goal], e).join(""))).toEqual([
      "COT",
      "ARE",
      "PEN",
    ]);
    expect(XW.brokenEntries(XW.states[SPACE.goal])).toHaveLength(0);
  });

  it("every candidate is the right length, and each clue has exactly one true answer", () => {
    for (const e of XW.spec.entries) {
      const trues = e.candidates.filter((c) => c.correct);
      expect(trues, e.id).toHaveLength(1);
      for (const c of e.candidates) expect(c.word.length, `${e.id} ${c.word}`).toBe(XW.spec.size);
    }
  });
});

describe("The evaluator's blindness", () => {
  it("its two most confident answers anywhere on the board are both wrong", () => {
    const all = XW.spec.entries
      .flatMap((e) => e.candidates.map((c) => ({ ...c, id: e.id })))
      .sort((a, b) => b.confidence - a.confidence);
    expect(all[0].word).toBe("LID");
    expect(all[0].correct).toBe(false);
    expect(all[1].word).toBe("BED");
    expect(all[1].correct).toBe(false);
    expect(all[2].correct).toBe(true);
  });

  it("prefers LID to the correct CAP, and BED to the correct COT", () => {
    const c = (id: string, w: string) =>
      XW.spec.entries.find((e) => e.id === id)!.candidates.find((x) => x.word === w)!;
    expect(c("1A", "LID").confidence).toBeGreaterThan(c("1A", "CAP").confidence);
    expect(c("1D", "BED").confidence).toBeGreaterThan(c("1D", "COT").confidence);
  });

  it("no grid containing LID can ever be finished", () => {
    // The trap is genuinely unsolvable, not merely unlucky.
    const seen = new Set<number>();
    const walk = (id: number) => {
      if (seen.has(id)) return;
      seen.add(id);
      for (const n of SPACE.thoughts[id].next) walk(n);
    };
    const lid = SPACE.thoughts[SPACE.root].next.find(
      (id) => XW.states[id].placed?.word === "LID",
    )!;
    walk(lid);
    expect(seen.has(SPACE.goal)).toBe(false);
  });

  it("labels dead ends structurally, and no strategy is allowed to consult that", () => {
    const dead = SPACE.thoughts.filter((t) => t.deadEnd);
    expect(dead.length).toBeGreaterThan(0);
    for (const t of dead) {
      expect(t.next).toHaveLength(0);
      expect(t.isGoal).toBe(false);
    }
  });
});

describe("The strategies on this grid", () => {
  it("greedy writes LID and jams", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.thoughtsScored).toBe(16);
    expect(rowsOf(r.deadEndReached!)).toEqual(["LID", "ORE", "TEN"]);
  });

  it("jams with a full grid of real words that answer no clue — the checkable aha", () => {
    const r = run("greedy");
    const broken = XW.brokenEntries(XW.states[r.deadEndReached!]);
    expect(broken.map((e) => e.id)).toEqual(["1D", "2D", "3D"]);
    expect(broken.map((e) => XW.readEntry(XW.states[r.deadEndReached!], e).join(""))).toEqual([
      "LOT",
      "IRE",
      "DEN",
    ]);
    // and the grid really is full, so there is nothing left to write
    expect(XW.states[r.deadEndReached!].cells.every((c) => c !== null)).toBe(true);
  });

  it("a beam of 1 is greedy exactly", () => {
    expect(run("beam", 1).solved).toBe(false);
    expect(cost("beam", 1)).toBe(cost("greedy"));
  });

  it("a beam of 4 is the cheapest width that survives", () => {
    for (const b of [1, 2, 3]) expect(run("beam", b).solved, `b=${b}`).toBe(false);
    for (const b of [4, 5]) expect(run("beam", b).solved, `b=${b}`).toBe(true);
    expect(cost("beam", 4)).toBe(35);
  });

  it("every extra beam slot costs more", () => {
    const costs = [1, 2, 3, 4, 5].map((b) => cost("beam", b));
    expect(costs).toEqual([16, 19, 26, 35, 41]);
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
  });

  it("depth-first gets there by backtracking out of the trap", () => {
    const r = run("dfs");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(31);
    expect(r.nodes.some((n) => XW.states[n.thoughtId].placed?.word === "LID")).toBe(true);
    expect(r.nodes.some((n) => n.deadEnd)).toBe(true);
  });

  it("breadth-first refuses to prune and pays the most", () => {
    const r = run("bfs");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(48);
    for (const s of ["greedy", "dfs", "mcts"] as Strategy[]) {
      expect(r.thoughtsScored, s).toBeGreaterThan(cost(s));
    }
    for (const b of [1, 2, 3, 4, 5]) {
      expect(r.thoughtsScored, `b=${b}`).toBeGreaterThan(cost("beam", b));
    }
  });

  it("MCTS is the cheapest strategy that finishes", () => {
    const r = run("mcts");
    expect(r.solved).toBe(true);
    expect(r.thoughtsScored).toBe(30);
    const others = [cost("dfs"), cost("bfs"), cost("beam", 4), cost("beam", 5)];
    for (const c of others) expect(r.thoughtsScored).toBeLessThan(c);
  });

  it("the full cost ordering the page prints", () => {
    expect(cost("greedy")).toBe(16);
    expect(cost("beam", 1)).toBe(16);
    expect(cost("beam", 2)).toBe(19);
    expect(cost("beam", 3)).toBe(26);
    expect(cost("mcts")).toBe(30);
    expect(cost("dfs")).toBe(31);
    expect(cost("beam", 4)).toBe(35);
    expect(cost("beam", 5)).toBe(41);
    expect(cost("bfs")).toBe(48);
    // breadth-first costs three times greedy
    expect(cost("bfs") / cost("greedy")).toBeGreaterThan(2.9);
  });

  it("every successful strategy finds the same, only, grid", () => {
    for (const [s, b] of [["dfs"], ["bfs"], ["mcts"], ["beam", 4], ["beam", 5]] as const) {
      const r = run(s as Strategy, b as number | undefined);
      expect(r.solved, String(s)).toBe(true);
      expect(rowsOf(r.solutionThoughts.at(-1)!), String(s)).toEqual(["CAP", "ORE", "TEN"]);
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
    for (const s of STRATEGIES) expect(run(s.key).nodes.length, s.key).toBeGreaterThan(1);
  });

  it("the tree stays drawable: few kept thoughts per column except breadth-first", () => {
    // The figure draws kept thoughts and collapses the rest into "+N pruned".
    const widestKept = (s: Strategy, b?: number) => {
      const cols = new Map<number, number>();
      for (const n of run(s, b).nodes) {
        if (n.kept) cols.set(n.depth, (cols.get(n.depth) ?? 0) + 1);
      }
      return Math.max(...cols.values());
    };
    expect(widestKept("greedy")).toBeLessThanOrEqual(2);
    expect(widestKept("beam", 4)).toBeLessThanOrEqual(6);
    expect(widestKept("mcts")).toBeLessThanOrEqual(8);
    expect(widestKept("dfs")).toBeLessThanOrEqual(8);
    // breadth-first keeps everything, which is the point, and the box scrolls
    expect(widestKept("bfs")).toBeGreaterThan(20);
  });

  it("the plain chain-of-thought contrast lands in greedy's grid, and is wrong", () => {
    expect(CROSSWORD_PLAIN_COT.correct).toBe(false);
    expect(CROSSWORD_PLAIN_COT.steps).toHaveLength(4);
    const text = CROSSWORD_PLAIN_COT.steps.join(" ");
    for (const w of ["LID", "ORE", "TEN", "LOT", "IRE", "DEN"]) expect(text, w).toContain(w);
  });

  it("no strategy exceeds the node ceiling on this instance", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) {
      expect(cost(s), s).toBeLessThan(OPTS.maxNodes);
    }
  });
});
