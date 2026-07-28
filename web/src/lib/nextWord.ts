/**
 * The task Page 10 searches: a model finishing a line, one word at a time.
 *
 * This is the thing a language model actually is. At every position it has a
 * handful of words it thinks might come next, each with a probability, and it
 * has to pick one. Take the likeliest word every time and you are doing GREEDY
 * DECODING, which is a chain of thought with no way back. Keep several partial
 * lines alive instead and you are doing BEAM SEARCH over thoughts.
 *
 * THE RULE, ENTIRE. The line has to rhyme. Nothing else, and a reader checks it
 * by ear rather than by working anything out.
 *
 * WHAT THE MODEL CAN SEE. How likely each next word is, given the words so far.
 * That is all. It cannot see whether a word it is about to write leaves the
 * line unable to rhyme four words later, which is exactly the mistake here.
 *
 * A state is the sequence of words written so far, so the space is a strict
 * tree: every path is its own line. The score is the running probability of the
 * whole line (the product), which is what beam search actually ranks by.
 */

import type { SearchSpace, Thought } from "./thoughtSearch";

/** One node of the authored continuation tree. */
export interface WordNode {
  word: string;
  /** P(this word | the words before it), 0..1. */
  p: number;
  next?: readonly WordNode[];
}

export interface NextWordSpec {
  /** The line already written, shown above the interactive. */
  given: string;
  /** The words the completion starts from, e.g. "so I". */
  lead: string;
  /** The word the last word has to rhyme with. */
  rhymesWith: string;
  /** Last words that count as a rhyme. */
  rhymes: readonly string[];
  /** How many words the model writes. */
  length: number;
  tree: readonly WordNode[];
}

export interface LineState {
  id: number;
  /** The words written so far. */
  words: readonly string[];
  /** P(the whole line so far). */
  probability: number;
  /** True once the line is finished AND the last word rhymes. */
  rhymed: boolean;
}

export interface NextWord {
  spec: NextWordSpec;
  space: SearchSpace;
  states: readonly LineState[];
  /** The candidate next words at a state, likeliest first. Empty when finished. */
  choices: (state: LineState) => { word: string; p: number; stateId: number }[];
  /** The full line, lead included. */
  line: (state: LineState) => string;
}

export function buildNextWord(spec: NextWordSpec): NextWord {
  const states: LineState[] = [];
  const thoughts: Thought[] = [];
  const kids: number[][] = [];

  const rhymes = (w: string) => spec.rhymes.includes(w.toLowerCase());

  const make = (words: readonly string[], probability: number): number => {
    const id = states.length;
    const done = words.length === spec.length;
    const ok = done && rhymes(words[words.length - 1]);
    states.push({ id, words, probability, rhymed: ok });
    thoughts.push({
      id,
      depth: words.length,
      // What beam search ranks by: the probability of the whole line so far.
      score: probability,
      // What it has actually achieved. A finished line that does not rhyme is
      // not progress, or MCTS would be rewarded for it.
      progress: ok ? 1 : words.length / (spec.length + 1),
      next: [],
      deadEnd: false,
      isGoal: ok,
    });
    kids.push([]);
    return id;
  };

  const root = make([], 1);

  /* Walk the authored tree, creating one state per prefix. */
  const walk = (parentId: number, nodes: readonly WordNode[]) => {
    for (const n of nodes) {
      const words = [...states[parentId].words, n.word];
      const id = make(words, states[parentId].probability * n.p);
      kids[parentId].push(id);
      if (n.next && words.length < spec.length) walk(id, n.next);
    }
  };
  walk(root, spec.tree);

  for (let i = 0; i < thoughts.length; i++) {
    thoughts[i] = {
      ...thoughts[i],
      next: kids[i],
      deadEnd: kids[i].length === 0 && !thoughts[i].isGoal,
    };
  }

  return {
    spec,
    space: { thoughts, root, goal: thoughts.findIndex((t) => t.isGoal) },
    states,
    choices: (state) =>
      kids[state.id]
        .map((id) => ({
          word: states[id].words[states[id].words.length - 1],
          p: states[id].probability / state.probability,
          stateId: id,
        }))
        .sort((a, b) => b.p - a.p),
    line: (state) => [spec.lead, ...state.words].join(" "),
  };
}
