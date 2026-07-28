/**
 * Page 10 — finishing a line one word at a time, searched five ways.
 *
 * The page draws ONE fixed tree (29 words, 13 complete lines) and lets each
 * strategy light up the part it scored, with the bill shown as "N of 29". That
 * is only honest if the search is real, so these tests pin it: the two
 * likeliest lines do not rhyme, the only rhyming line is less likely than both,
 * greedy decoding therefore cannot reach it, and the five strategies pay
 * visibly different bills for the same answer.
 *
 * Every number here was measured, not chosen.
 */
import { describe, expect, it } from "vitest";
import { NEXT_WORD_SPEC } from "./authored";
import { buildNextWord, type NextWordSpec } from "./nextWord";
import { search, STRATEGIES, type Strategy } from "./thoughtSearch";

const N = buildNextWord(NEXT_WORD_SPEC as unknown as NextWordSpec);
const SPEC = N.spec;
const SPACE = N.space;
const OPTS = { maxNodes: 3000, rollouts: 80 };
const run = (s: Strategy, b?: number) => search(SPACE, s, { ...OPTS, beamWidth: b });
const cost = (s: Strategy, b?: number) => run(s, b).thoughtsScored;
const finished = N.states.filter((s) => s.words.length === SPEC.length);
const byLikelihood = [...finished].sort((a, b) => b.probability - a.probability);

describe("The distributions", () => {
  it("every choice is a real distribution: the candidates sum to 1", () => {
    const walk = (nodes: readonly { p: number; next?: readonly unknown[] }[]) => {
      const total = nodes.reduce((a, n) => a + n.p, 0);
      expect(Math.abs(total - 1)).toBeLessThan(1e-9);
      for (const n of nodes) {
        if (n.next) walk(n.next as readonly { p: number; next?: readonly unknown[] }[]);
      }
    };
    walk(SPEC.tree as readonly { p: number; next?: readonly unknown[] }[]);
  });

  it("is small enough to draw whole: 29 words, 13 complete lines", () => {
    expect(N.states.length - 1).toBe(29);
    expect(finished).toHaveLength(13);
  });

  it("the probabilities of all finished lines sum to 1", () => {
    const total = finished.reduce((a, s) => a + s.probability, 0);
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
  });

  it("has exactly one rhyming line, and it is 'so I turned on the light'", () => {
    const rhymes = finished.filter((s) => s.rhymed);
    expect(rhymes).toHaveLength(1);
    expect(N.line(rhymes[0])).toBe("so I turned on the light");
    expect(SPACE.thoughts[rhymes[0].id].isGoal).toBe(true);
  });
});

describe("The trap", () => {
  it("the two likeliest lines do not rhyme; the rhyme is only third", () => {
    expect(byLikelihood[0].rhymed).toBe(false);
    expect(N.line(byLikelihood[0])).toBe("so I got up and paced");
    expect(byLikelihood[1].rhymed).toBe(false);
    expect(byLikelihood[2].rhymed).toBe(true);
  });

  it("greedy — a chain of thought — cannot reach the rhyme", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.thoughtsScored).toBe(9);
    // it commits to the likeliest word at every step, so it lands on the
    // likeliest line, which does not rhyme
    const end = r.nodes
      .filter((n) => N.states[n.thoughtId].words.length === SPEC.length)
      .sort((a, b) => b.score - a.score)[0];
    expect(N.line(N.states[end.thoughtId])).toBe("so I got up and paced");
  });

  it("a full line that does not rhyme is a dead end, not a win", () => {
    for (const s of finished) {
      if (s.rhymed) continue;
      expect(SPACE.thoughts[s.id].deadEnd).toBe(true);
      expect(SPACE.thoughts[s.id].progress).toBeLessThan(1);
    }
  });
});

describe("The strategies, on the one fixed tree", () => {
  it("a beam of 1 is greedy exactly; a beam of 2 finds the rhyme", () => {
    expect(cost("beam", 1)).toBe(cost("greedy"));
    expect(run("beam", 1).solved).toBe(false);
    const b2 = run("beam", 2);
    expect(b2.solved).toBe(true);
    expect(b2.thoughtsScored).toBe(14);
    expect(N.line(N.states[b2.solutionThoughts.at(-1)!])).toBe("so I turned on the light");
  });

  it("every extra line kept alive costs more", () => {
    const costs = [1, 2, 3, 4, 5].map((b) => cost("beam", b));
    expect(costs[0]).toBe(9);
    expect(costs[1]).toBe(14);
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
  });

  it("all five strategies run, and the bills separate", () => {
    expect(STRATEGIES.map((s) => s.key)).toEqual(["greedy", "bfs", "dfs", "beam", "mcts"]);
    expect(cost("greedy")).toBe(9);
    expect(cost("mcts")).toBe(14);
    expect(cost("dfs")).toBe(18);
    expect(cost("bfs")).toBe(23);
    // and every searcher finds the same, only, rhyme
    for (const s of ["bfs", "dfs", "mcts"] as Strategy[]) {
      const r = run(s);
      expect(r.solved, s).toBe(true);
      expect(N.line(N.states[r.solutionThoughts.at(-1)!]), s).toBe("so I turned on the light");
    }
  });

  it("no strategy scores a word twice: the bill never exceeds the tree", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) {
      const r = run(s);
      const seen = new Set(r.nodes.filter((n) => n.parentId !== null).map((n) => n.thoughtId));
      expect(r.thoughtsScored, s).toBe(seen.size);
      expect(r.thoughtsScored, s).toBeLessThanOrEqual(29);
    }
  });

  it("is deterministic", () => {
    for (const s of ["greedy", "bfs", "dfs", "mcts"] as Strategy[]) {
      expect(cost(s), s).toBe(cost(s));
    }
  });
});
