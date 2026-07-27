/**
 * The puzzle Page 10 searches (lib/thoughtSearch.ts runs the search).
 *
 * THE RULE, ENTIRE. Three answers stack, one per row. The shaded first column
 * then has to read down as the answer to a fourth clue. That is the only
 * constraint, and it is one sentence long, which is the point: the reader
 * should have to learn nothing before they can watch the search.
 *
 * WHAT A THOUGHT IS. One line of the model's chain: a clue it picked and the
 * answer it wrote. The model may answer the three rows in any order.
 *
 * WHAT THE MODEL CAN SEE. Its own confidence in each answer, judged against
 * that answer's own clue and nothing else. It does not look at the shaded
 * column until the grid is full — which is exactly what a chain of thought
 * does, and exactly how anyone fills in an acrostic. So it is free to write a
 * perfectly good answer that ruins the column, and only find out at the end.
 * That is the mistake the page is about.
 *
 * WHEN A RUN IS FINISHED. All three rows written AND the shaded column reading
 * as the down answer. A full grid whose column spells some other real word is a
 * dead end, and the most legible kind: the reader sees a word and checks it
 * against one clue.
 *
 * Everything here is derived from the authored spec: the states, the column
 * readings and every dead end.
 */

import type { SearchSpace, Thought } from "./thoughtSearch";

export interface Candidate {
  word: string;
  /** The model's confidence in this answer, 0..1. Authored. */
  confidence: number;
  /** Why it rates it that way — shown beside the answer. */
  note: string;
  /** Whether it is the answer the puzzle needs. Viz only; never consulted. */
  correct: boolean;
}

export interface RowSpec {
  /** 1-based row number, used as the clue label. */
  n: number;
  clue: string;
  candidates: readonly Candidate[];
}

export interface AcrosticSpec {
  rows: readonly RowSpec[];
  /** The shaded column, read downward. */
  down: { clue: string; answer: string };
}

/** A written answer: which row it went in, and what was written. */
export interface Placement {
  row: number;
  word: string;
  confidence: number;
}

export interface GridState {
  id: number;
  /** One entry per row; null where the row is still blank. */
  words: readonly (string | null)[];
  /** The placement that first reached this grid, if any. */
  placed: Placement | null;
  /** The shaded column so far, null where unknown. */
  column: readonly (string | null)[];
  filled: number;
}

export interface Acrostic {
  spec: AcrosticSpec;
  space: SearchSpace;
  states: readonly GridState[];
  size: number;
  /** The shaded column as a string, blanks as "·". */
  columnText: (state: GridState) => string;
}

export function buildAcrostic(spec: AcrosticSpec): Acrostic {
  const R = spec.rows.length;
  const target = spec.down.answer;

  const columnOf = (words: readonly (string | null)[]) =>
    words.map((w) => (w ? w[0] : null));
  const isSolved = (words: readonly (string | null)[]) =>
    words.every((w) => w !== null) && columnOf(words).join("") === target;

  const states: GridState[] = [];
  const thoughts: Thought[] = [];
  const byKey = new Map<string, number>();
  const confs = new Map<number, number[]>();

  const make = (
    words: readonly (string | null)[],
    placed: Placement | null,
    parentConfs: number[],
  ): number => {
    const key = words.map((w) => w ?? ".").join("|");
    const existing = byKey.get(key);
    if (existing !== undefined) return existing;
    const id = states.length;
    const cs = placed ? [...parentConfs, placed.confidence] : [];
    const filled = words.filter((w) => w !== null).length;
    const solved = isSolved(words);
    states.push({ id, words, placed, column: columnOf(words), filled });
    thoughts.push({
      id,
      depth: cs.length,
      // The evaluator on a partial grid: the mean confidence of what it wrote.
      score: cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0,
      /* How much of the task is actually done: rows written, plus the column
         if it reads correctly. A full grid with a wrong column is NOT finished,
         so it must not score as though it were, or MCTS is rewarded for it. */
      progress: (filled + (solved ? 1 : 0)) / (R + 1),
      next: [],
      deadEnd: false,
      isGoal: solved,
    });
    byKey.set(key, id);
    confs.set(id, cs);
    return id;
  };

  const root = make(Array(R).fill(null), null, []);

  for (let i = 0; i < states.length; i++) {
    if (thoughts[i].isGoal) continue;
    const words = states[i].words;
    const next: number[] = [];
    for (let r = 0; r < R; r++) {
      if (words[r] !== null) continue;
      for (const cand of spec.rows[r].candidates) {
        const nextWords = [...words];
        nextWords[r] = cand.word;
        // No filtering: the model is allowed to write an answer that ruins the
        // column, because it has not read the column yet.
        const id = make(
          nextWords,
          { row: r, word: cand.word, confidence: cand.confidence },
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

  return {
    spec,
    space: { thoughts, root, goal: thoughts.findIndex((t) => t.isGoal) },
    states,
    size: R,
    columnText: (state) => state.column.map((c) => c ?? "·").join(""),
  };
}
