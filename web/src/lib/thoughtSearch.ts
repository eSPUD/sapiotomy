/**
 * The search engine for Page 10, "Searching Through Thoughts".
 *
 * This file knows nothing about the task being searched. It takes a SearchSpace
 * — a set of states, each with a score, a list of successors, and flags for
 * "goal" and "dead end" — and runs five strategies over it, counting honestly.
 * The word tree that page 10 actually searches is built in lib/nextWord.ts.
 *
 * Why a real engine and not a canned animation: the page claims that different
 * strategies explore the same space differently and cost different amounts of
 * compute. That is only honest if the space is actually searched and the
 * thoughts scored are actually counted. Everything here is pure and
 * deterministic (seeded where it needs randomness) and unit-tested, so the
 * "thoughts scored" counter on screen is a measurement of this code.
 *
 * TWO evaluators, deliberately kept apart:
 *   - `score` is what the SEARCHER sees: the model's own confidence in the
 *     partial answer it has built. It never verifies anything; it only reports
 *     how good each thought sounded. That blindness is the whole point.
 *   - `deadEnd` is an exact structural label (a state with no successors that
 *     is not the goal), used ONLY to colour the tree. No strategy consults it.
 */

/** One state in the space. Everything the engine needs and nothing else. */
export interface Thought {
  id: number;
  /** Thoughts committed along the path that first reached this state. */
  depth: number;
  /** The searcher's evaluator on this partial answer, 0..1. */
  score: number;
  /** How much of the task this state completes, 0..1. Used for MCTS rewards. */
  progress: number;
  /** Ids of the states reachable by committing one more thought. */
  next: readonly number[];
  /** Structural oracle: no successors and not the goal. Viz only. */
  deadEnd: boolean;
  isGoal: boolean;
}

export interface SearchSpace {
  thoughts: readonly Thought[];
  root: number;
  goal: number;
}

export type Strategy = "greedy" | "bfs" | "dfs" | "beam" | "mcts";

export const STRATEGIES: { key: Strategy; label: string; blurb: string }[] = [
  {
    key: "greedy",
    label: "Greedy",
    blurb:
      "Take the likeliest next word every time and never look back. This is plain autocomplete, and it is what a chain of thought does: one line, written forward, no way to undo a word.",
  },
  {
    key: "bfs",
    label: "Breadth-first",
    blurb:
      "Extend every unfinished line by every word, one whole position at a time. No confident wrong word can fool it, and it pays for that by scoring nearly every word in the tree.",
  },
  {
    key: "dfs",
    label: "Depth-first",
    blurb:
      "Follow the likeliest word to the end of the line; when that line turns out not to rhyme, back up to the last word it did not try and go again.",
  },
  {
    key: "beam",
    label: "Beam",
    blurb:
      "Carry the b likeliest unfinished lines forward at each word and drop the rest. b = 1 is greedy exactly. This is what Tree-of-Thoughts does at each level.",
  },
  {
    key: "mcts",
    // The acronym is load-bearing on page 10 and glossed nowhere else in the deck,
    // so it is unpacked here, where the reader meets the button.
    label: "MCTS",
    blurb:
      "Monte Carlo tree search: finish a few lines at random from each starting point, see which openings tend to end well, and spend the next tries there. The AlphaGo family's answer.",
  },
];

export interface SearchNode {
  id: number;
  parentId: number | null;
  thoughtId: number;
  depth: number;
  score: number;
  /** Structural oracle: a dead end that is not the goal. Viz only. */
  deadEnd: boolean;
  /** 1-based order in which the searcher scored this thought. */
  order: number;
  /** Did the searcher keep/expand this thought, or prune it? */
  kept: boolean;
  isGoal: boolean;
  /** MCTS only: how many trial continuations passed through here. */
  visits?: number;
}

export interface SearchTrace {
  strategy: Strategy;
  nodes: SearchNode[];
  /** The compute counter: thoughts the evaluator was asked to score. */
  thoughtsScored: number;
  solved: boolean;
  /** Node ids from the root to the goal, when solved. */
  solutionPath: number[];
  /** Thought ids along that path, when solved. */
  solutionThoughts: number[];
  /** Thought id where a committed strategy ran out of moves, when it failed. */
  deadEndReached: number | null;
  /**
   * MCTS only: the path of each trial continuation, as thought ids in the
   * order it walked them. Recorded so an animation can replay what MCTS
   * actually does — whole lines tried, attention narrowing — rather than the
   * misleading order in which states happened to be first scored.
   */
  rollouts?: number[][];
  /** MCTS only: cumulative thoughts scored after each trial. */
  rolloutScored?: number[];
}

export interface SearchOptions {
  /** Beam width / branching factor b. */
  beamWidth?: number;
  /** Hard ceiling on thoughts scored, so a bad strategy cannot run forever. */
  maxNodes?: number;
  /** MCTS trial-continuation budget. */
  rollouts?: number;
  seed?: number;
}

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared bookkeeping so every strategy counts the same way. */
class Trace {
  nodes: SearchNode[] = [];
  examined = 0;
  private nextId = 0;
  private space: SearchSpace;
  private maxNodes: number;

  constructor(space: SearchSpace, maxNodes: number) {
    this.space = space;
    this.maxNodes = maxNodes;
  }

  private make(thoughtId: number, parent: SearchNode | null): SearchNode {
    const t = this.space.thoughts[thoughtId];
    return {
      id: this.nextId++,
      parentId: parent ? parent.id : null,
      thoughtId,
      depth: t.depth,
      score: t.score,
      deadEnd: t.deadEnd,
      order: parent ? this.examined : 0,
      kept: parent === null,
      isGoal: t.isGoal,
    };
  }

  root(): SearchNode {
    const node = this.make(this.space.root, null);
    this.nodes.push(node);
    return node;
  }

  /** Score and record arrival at `thoughtId`. Counts against the budget. */
  add(parent: SearchNode, thoughtId: number): SearchNode {
    this.examined += 1;
    const node = this.make(thoughtId, parent);
    this.nodes.push(node);
    return node;
  }

  get exhausted(): boolean {
    return this.examined >= this.maxNodes;
  }

  finish(
    strategy: Strategy,
    solution: SearchNode | null,
    deadEndReached: number | null,
  ): SearchTrace {
    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const path: number[] = [];
    const solutionThoughts: number[] = [];
    let cur = solution;
    while (cur) {
      path.unshift(cur.id);
      solutionThoughts.unshift(cur.thoughtId);
      cur.kept = true;
      cur = cur.parentId === null ? null : (byId.get(cur.parentId) ?? null);
    }
    return {
      strategy,
      nodes: this.nodes,
      thoughtsScored: this.examined,
      solved: solution !== null,
      solutionPath: path,
      solutionThoughts,
      deadEndReached,
    };
  }
}

/** Run one search over the space and return the full, replayable trace. */
export function search(
  space: SearchSpace,
  strategy: Strategy,
  opts: SearchOptions = {},
): SearchTrace {
  const beamWidth = opts.beamWidth ?? 3;
  const maxNodes = opts.maxNodes ?? 400;
  const rollouts = opts.rollouts ?? 80;
  const seed = opts.seed ?? 24;

  const t = new Trace(space, maxNodes);
  const root = t.root();
  const nextOf = (id: number) => space.thoughts[id].next;

  // Expand a state: score every not-yet-seen continuation (counts + marks seen).
  const expand = (node: SearchNode, visited: Set<number>): SearchNode[] => {
    const kids: SearchNode[] = [];
    for (const nb of nextOf(node.thoughtId)) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      kids.push(t.add(node, nb));
      if (t.exhausted) break;
    }
    return kids;
  };

  switch (strategy) {
    case "greedy": {
      // One committed run: score the options, take the surest, never reconsider.
      const visited = new Set<number>([space.root]);
      let node = root;
      while (!node.isGoal && !t.exhausted) {
        const kids = expand(node, visited);
        const win = kids.find((k) => k.isGoal);
        if (win) return t.finish(strategy, win, null);
        if (kids.length === 0) break; // ran out of moves
        kids.sort((a, b) => b.score - a.score);
        node = kids[0];
        node.kept = true;
      }
      return t.finish(strategy, node.isGoal ? node : null, node.isGoal ? null : node.thoughtId);
    }

    case "bfs": {
      const visited = new Set<number>([space.root]);
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const next: SearchNode[] = [];
        for (const node of frontier) {
          if (node.isGoal || t.exhausted) continue;
          for (const child of expand(node, visited)) {
            if (child.isGoal) {
              child.kept = true;
              return t.finish(strategy, child, null);
            }
            child.kept = true;
            next.push(child);
          }
        }
        frontier = next;
      }
      return t.finish(strategy, null, null);
    }

    case "dfs": {
      const visited = new Set<number>([space.root]);
      const stack: SearchNode[] = [root];
      while (stack.length > 0 && !t.exhausted) {
        const node = stack.pop()!;
        if (node.isGoal) return t.finish(strategy, node, null);
        node.kept = true;
        const kids = expand(node, visited);
        const win = kids.find((k) => k.isGoal);
        if (win) return t.finish(strategy, win, null);
        // Surest-looking answer explored first → push it last (popped first).
        kids.sort((a, b) => a.score - b.score);
        stack.push(...kids);
      }
      return t.finish(strategy, null, null);
    }

    case "beam": {
      const visited = new Set<number>([space.root]);
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const kids: SearchNode[] = [];
        for (const node of frontier) {
          if (node.isGoal || t.exhausted) continue;
          kids.push(...expand(node, visited));
        }
        const win = kids.find((k) => k.isGoal);
        if (win) {
          win.kept = true;
          return t.finish(strategy, win, null);
        }
        if (kids.length === 0) break;
        kids.sort((a, b) => b.score - a.score);
        frontier = kids.slice(0, beamWidth);
        for (const k of frontier) k.kept = true;
      }
      return t.finish(strategy, null, null);
    }

    case "mcts": {
      // PUCT trial continuations: follow promising branches, with an exploration
      // bonus that eventually tries the answer the evaluator liked less.
      const rng = createRng(seed);
      const visited = new Set<number>([space.root]);
      const childrenOf = new Map<number, SearchNode[]>();
      const visits = new Map<number, number>();
      const value = new Map<number, number>();
      visits.set(root.id, 0);
      value.set(root.id, root.score);

      const c = 1.4;
      let solution: SearchNode | null = null;
      const rolloutPaths: number[][] = [];
      const rolloutScored: number[] = [];

      for (let r = 0; r < rollouts && !t.exhausted && !solution; r++) {
        const path: SearchNode[] = [root];
        const seen = new Set<number>([root.thoughtId]);
        let node = root;
        while (!node.isGoal) {
          let kids = childrenOf.get(node.id);
          if (!kids) {
            kids = expand(node, visited);
            childrenOf.set(node.id, kids);
            for (const k of kids) {
              visits.set(k.id, 0);
              value.set(k.id, k.score);
            }
            const win = kids.find((k) => k.isGoal);
            if (win) {
              solution = win;
              break;
            }
          }
          const avail = kids.filter((k) => !seen.has(k.thoughtId));
          if (avail.length === 0) break; // this continuation ran out of moves
          const parentVisits = (visits.get(node.id) ?? 0) + 1;
          const prior = 1 / avail.length;
          let best = avail[0];
          let bestScore = -Infinity;
          for (const k of avail) {
            const kv = visits.get(k.id) ?? 0;
            const q = kv === 0 ? k.score : (value.get(k.id) ?? 0);
            const u = (c * prior * Math.sqrt(parentVisits)) / (1 + kv);
            const s = q + u + rng() * 1e-6; // deterministic tie-break
            if (s > bestScore) {
              bestScore = s;
              best = k;
            }
          }
          node = best;
          path.push(node);
          seen.add(node.thoughtId);
          if (node.isGoal) {
            solution = node;
            break;
          }
          if (t.exhausted) break;
        }

        /* What the trial actually achieved: how much of the grid it filled.
           A run that jams half-finished is worth half of one that completes it,
           however confident the evaluator was about the words it did write.
           This reads only what the search observed — it ran out of moves — and
           never the deadEnd oracle. Rewarding a jammed run by its evaluator
           score instead makes MCTS chase the trap, because the trap is exactly
           where the evaluator is most confident. */
        const reward = node.isGoal ? 1 : space.thoughts[node.thoughtId].progress;
        for (const p of path) {
          const v = (visits.get(p.id) ?? 0) + 1;
          visits.set(p.id, v);
          const old = value.get(p.id) ?? 0;
          value.set(p.id, old + (reward - old) / v);
          p.visits = v;
          p.kept = true;
        }

        // Record the trial for replay. When the goal turned up while expanding
        // this node's children, the walk itself never stepped onto it — append
        // it so the animated trial ends where the search ended.
        const ids = path.map((p) => p.thoughtId);
        if (solution && ids[ids.length - 1] !== solution.thoughtId) {
          ids.push(solution.thoughtId);
        }
        rolloutPaths.push(ids);
        rolloutScored.push(t.examined);
      }

      for (const n of t.nodes) n.visits = visits.get(n.id) ?? 0;
      const out = t.finish(strategy, solution, null);
      out.rollouts = rolloutPaths;
      out.rolloutScored = rolloutScored;
      return out;
    }
  }
}
