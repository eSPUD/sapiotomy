/**
 * Page 10 — finishing a line one word at a time.
 *
 * The page prints a "words scored" counter and claims that keeping one line
 * alive cannot find the rhyme while keeping two can. That is only honest if the
 * search is real, so these tests pin it: the likeliest line does not rhyme, the
 * only rhyming line is less likely than it, greedy decoding therefore cannot
 * reach it, and every extra line kept alive costs more.
 *
 * Every number here was measured, not chosen.
 */
import { describe, expect, it } from "vitest";
import { NEXT_WORD_SPEC } from "./authored";
import { buildNextWord, type NextWordSpec } from "./nextWord";
import { search } from "./thoughtSearch";

const N = buildNextWord(NEXT_WORD_SPEC as unknown as NextWordSpec);
const SPEC = N.spec;
const SPACE = N.space;
const OPTS = { maxNodes: 3000 };
const keep = (b: number) => search(SPACE, "beam", { ...OPTS, beamWidth: b });
const finished = N.states.filter((s) => s.words.length === SPEC.length);
const likeliest = [...finished].sort((a, b) => b.probability - a.probability)[0];

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

  it("writes a four-word line, and there are 36 possible lines", () => {
    expect(SPEC.length).toBe(4);
    expect(finished).toHaveLength(36);
  });

  it("the probabilities of all finished lines sum to 1", () => {
    const total = finished.reduce((a, s) => a + s.probability, 0);
    expect(Math.abs(total - 1)).toBeLessThan(1e-9);
  });
});

describe("The trap: likeliest is not right", () => {
  it("exactly one line rhymes", () => {
    const rhyming = finished.filter((s) => s.rhymed);
    expect(rhyming).toHaveLength(1);
    expect(N.line(rhyming[0])).toBe("so I turned on the light");
  });

  it("the likeliest line does not rhyme", () => {
    expect(likeliest.rhymed).toBe(false);
    expect(N.line(likeliest)).toBe("so I got up and paced");
  });

  it("the rhyming line is genuinely less likely than the likeliest one", () => {
    const rhyming = finished.find((s) => s.rhymed)!;
    expect(rhyming.probability).toBeLessThan(likeliest.probability);
    expect(Math.round(likeliest.probability * 1000) / 10).toBe(12.6);
    expect(Math.round(rhyming.probability * 1000) / 10).toBe(8);
  });

  it("greedy loses at the very first word: 'got' beats 'turned'", () => {
    const first = N.choices(N.states[SPACE.root]);
    expect(first[0].word).toBe("got");
    expect(first[1].word).toBe("turned");
    // and nothing under "got" can rhyme
    const got = N.states[first[0].stateId];
    const under = N.states.filter(
      (s) => s.words.length === SPEC.length && s.words[0] === got.words[0],
    );
    expect(under.length).toBeGreaterThan(0);
    expect(under.some((s) => s.rhymed)).toBe(false);
  });
});

describe("The dial", () => {
  it("keeping one line alive cannot rhyme, and is greedy exactly", () => {
    const one = keep(1);
    expect(one.solved).toBe(false);
    expect(one.thoughtsScored).toBe(12);
    const greedy = search(SPACE, "greedy", OPTS);
    expect(greedy.thoughtsScored).toBe(one.thoughtsScored);
    expect(greedy.solved).toBe(false);
  });

  it("keeping two is enough to find the rhyme", () => {
    const two = keep(2);
    expect(two.solved).toBe(true);
    expect(two.thoughtsScored).toBe(19);
    expect(N.line(N.states[two.solutionThoughts.at(-1)!])).toBe("so I turned on the light");
  });

  it("every extra line kept alive costs more", () => {
    expect([1, 2, 3, 4, 5].map((b) => keep(b).thoughtsScored)).toEqual([12, 19, 25, 31, 35]);
  });

  it("every width from two up finds the same, only, rhyme", () => {
    for (const b of [2, 3, 4, 5]) {
      const r = keep(b);
      expect(r.solved, `keep ${b}`).toBe(true);
      expect(N.line(N.states[r.solutionThoughts.at(-1)!]), `keep ${b}`).toBe(
        "so I turned on the light",
      );
    }
  });

  it("is deterministic", () => {
    for (const b of [1, 3, 5]) expect(keep(b).thoughtsScored).toBe(keep(b).thoughtsScored);
  });
});

describe("Page copy guardrails", () => {
  it("the tree stays drawable at every width", () => {
    for (const b of [1, 2, 3, 4, 5]) {
      const cols = new Map<number, number>();
      for (const n of keep(b).nodes) if (n.kept) cols.set(n.depth, (cols.get(n.depth) ?? 0) + 1);
      expect(Math.max(...cols.values()), `keep ${b}`).toBeLessThanOrEqual(6);
    }
  });

  it("a finished line that does not rhyme never scores as progress", () => {
    for (const s of finished) {
      if (!s.rhymed) expect(SPACE.thoughts[s.id].progress).toBeLessThan(1);
    }
  });

  it("the rhyme list actually rhymes with the given word", () => {
    expect(SPEC.rhymesWith).toBe("night");
    for (const r of SPEC.rhymes) expect(r.endsWith("ight") || r.endsWith("ite")).toBe(true);
  });
});
