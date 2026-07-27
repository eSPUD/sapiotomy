/**
 * The crossword that Page 10 searches (lib/thoughtSearch.ts runs the search).
 *
 * WHAT A THOUGHT IS. One line of the model's chain of thought: "1-Across,
 * 'Bottle top' — LID." So a thought is a pair (which clue to answer next, which
 * answer to write), and a STATE is the grid so far. That the model chooses what
 * to attack next is not a flourish: it is what a solver does, it is what Yao et
 * al.'s Tree of Thoughts does on this task, and it is the reason the strategies
 * diverge at all. Filling the grid in a fixed order collapses the space to a
 * single thread on which every strategy costs the same (measured: 8 states, and
 * greedy, depth-first, MCTS and breadth-first all pay 7).
 *
 * WHAT THE MODEL CAN SEE. A candidate may be written whenever its letters agree
 * with the letters already on the grid. That local check is all a chain of
 * thought does — it looks at the crossings in front of it, not at whether the
 * word it is about to commit makes some other clue unanswerable later. So the
 * model is allowed to write a word that jams the grid three moves on, which is
 * exactly the mistake the page is about. (Refusing to generate such moves would
 * make the model incapable of error, and greedy would always win.)
 *
 * WHEN A RUN IS FINISHED. Every cell filled AND every entry, including entries
 * the model never explicitly wrote, reading as one of that clue's answers. A
 * grid can be full of real words that are not answers to the clues — that is
 * how the trap fails, and it is checkable by eye from the clue list.
 *
 * Everything here is derived from the authored spec: the state lattice, each
 * grid, and every dead end. Nothing about the search is hand-placed.
 */

import type { SearchSpace, Thought } from "./thoughtSearch";

export interface Candidate {
  word: string;
  /** The model's confidence in this answer, 0..1. Authored. */
  confidence: number;
  /** Why it likes it — the rationale shown on the card. */
  note: string;
  /** Whether it is the true answer. Viz only; never consulted by a strategy. */
  correct: boolean;
}

export interface EntrySpec {
  /** e.g. "1A". */
  id: string;
  dir: "across" | "down";
  /** Row index for an across entry, column index for a down entry. */
  index: number;
  clue: string;
  candidates: readonly Candidate[];
}

export interface CrosswordSpec {
  size: number;
  entries: readonly EntrySpec[];
}

/** A placement the model committed: the clue it answered and what it wrote. */
export interface Placement {
  entryId: string;
  word: string;
  confidence: number;
}

/** One state of the grid. */
export interface GridState {
  id: number;
  /** size*size cells, row-major; null where still blank. */
  cells: readonly (string | null)[];
  /** The placement that first reached this grid, if any. */
  placed: Placement | null;
  filled: number;
}

export interface Crossword {
  spec: CrosswordSpec;
  space: SearchSpace;
  states: readonly GridState[];
  /** Entry id → the letters that entry currently reads, for a given state. */
  readEntry: (state: GridState, entry: EntrySpec) => (string | null)[];
  /** Entries whose cells are full but which do not read as any candidate. */
  brokenEntries: (state: GridState) => EntrySpec[];
}

const cellsOf = (spec: CrosswordSpec, e: EntrySpec) =>
  Array.from({ length: spec.size }, (_, k) =>
    e.dir === "across" ? e.index * spec.size + k : k * spec.size + e.index,
  );

export function buildCrossword(spec: CrosswordSpec): Crossword {
  const total = spec.size * spec.size;
  const cellIndex = new Map(spec.entries.map((e) => [e.id, cellsOf(spec, e)]));

  const read = (cells: readonly (string | null)[], e: EntrySpec) =>
    cellIndex.get(e.id)!.map((ci) => cells[ci]);

  const fits = (cells: readonly (string | null)[], e: EntrySpec, word: string) =>
    cellIndex.get(e.id)!.every((ci, k) => cells[ci] === null || cells[ci] === word[k]);

  const place = (cells: readonly (string | null)[], e: EntrySpec, word: string) => {
    const next = [...cells];
    cellIndex.get(e.id)!.forEach((ci, k) => (next[ci] = word[k]));
    return next;
  };

  /* Finished only if the grid is full AND every entry reads as an answer to its
     own clue — including entries the model never explicitly wrote. */
  const isSolved = (cells: readonly (string | null)[]) =>
    cells.every((c) => c !== null) &&
    spec.entries.every((e) =>
      e.candidates.some((c) => c.word === read(cells, e).join("")),
    );

  const states: GridState[] = [];
  const thoughts: Thought[] = [];
  const byKey = new Map<string, number>();
  const confs = new Map<number, number[]>();

  const make = (
    cells: readonly (string | null)[],
    placed: Placement | null,
    parentConfs: number[],
  ): number => {
    const key = cells.map((c) => c ?? ".").join("");
    const existing = byKey.get(key);
    if (existing !== undefined) return existing;
    const id = states.length;
    const cs = placed ? [...parentConfs, placed.confidence] : [];
    const filled = cells.filter((c) => c !== null).length;
    states.push({ id, cells, placed, filled });
    thoughts.push({
      id,
      depth: cs.length,
      // The evaluator on a partial grid: the mean confidence of what it wrote.
      score: cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0,
      progress: filled / total,
      next: [],
      deadEnd: false,
      isGoal: isSolved(cells),
    });
    byKey.set(key, id);
    confs.set(id, cs);
    return id;
  };

  const root = make(Array(total).fill(null), null, []);

  for (let i = 0; i < states.length; i++) {
    if (thoughts[i].isGoal) continue;
    const cells = states[i].cells;
    const next: number[] = [];
    for (const e of spec.entries) {
      // An entry already full is not something left to think about.
      if (cellIndex.get(e.id)!.every((ci) => cells[ci] !== null)) continue;
      for (const cand of e.candidates) {
        if (!fits(cells, e, cand.word)) continue; // the local check, and only that
        const id = make(
          place(cells, e, cand.word),
          { entryId: e.id, word: cand.word, confidence: cand.confidence },
          confs.get(i)!,
        );
        if (!next.includes(id)) next.push(id);
      }
    }
    thoughts[i] = { ...thoughts[i], next: next.sort((a, b) => a - b) };
  }

  for (let i = 0; i < thoughts.length; i++) {
    thoughts[i] = {
      ...thoughts[i],
      deadEnd: thoughts[i].next.length === 0 && !thoughts[i].isGoal,
    };
  }

  const goal = thoughts.findIndex((t) => t.isGoal);

  return {
    spec,
    space: { thoughts, root, goal },
    states,
    readEntry: (state, entry) => read(state.cells, entry),
    brokenEntries: (state) =>
      spec.entries.filter((e) => {
        const letters = read(state.cells, e);
        if (letters.some((l) => l === null)) return false;
        return !e.candidates.some((c) => c.word === letters.join(""));
      }),
  };
}
