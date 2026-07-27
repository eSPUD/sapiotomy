/**
 * A real search engine over a space of partial thoughts (Page 10, "Searching
 * Through Thoughts").
 *
 * Why a real engine and not a canned animation: the page's claim is that
 * different search STRATEGIES explore the same space differently and cost
 * different amounts of compute. That is only honest if the space is actually
 * searched and the thoughts examined are actually counted. Everything here is
 * pure and deterministic (seeded where it needs randomness) and unit-tested, so
 * the "thoughts scored" counter on screen is a measurement of this code.
 *
 * WHAT IS AUTHORED AND WHAT IS DERIVED. The GROUPS are authored teaching content
 * — their words, the category the model claims, its one-line rationale, and the
 * evaluator's confidence in each. Everything else is derived mechanically by
 * `buildThoughtSpace`: a THOUGHT is a state, i.e. a set of groups committed so
 * far whose words do not overlap, and its children are the states reached by
 * committing one more compatible group. Deriving rather than hand-writing the
 * lattice means no typo can invent an edge that is not there, and the leftover
 * words on every card are computed, not transcribed.
 *
 * The state space is a DAG, not a tree: committing "red" then "eye" reaches the
 * same state as "eye" then "red". Thoughts are keyed on the SET, so the visited
 * set dedups them and the counter never charges twice for scoring the same
 * partial solution.
 *
 * TWO evaluators, deliberately kept apart:
 *   - `score` is what the SEARCHER sees: the mean of its committed groups'
 *     confidences. Each confidence rates how tight a category sounds IN
 *     ISOLATION; none of them looks at what the group leaves behind. That
 *     blindness is the whole point — it ranks a wrong group above a right one,
 *     and it is right to, on the evidence it is allowed to see.
 *   - `deadEnd` is an exact structural label (a state with no children that is
 *     not the goal), used ONLY to colour the tree. No strategy consults it.
 */

/** One candidate grouping — the authored unit. */
export interface Group {
  id: number;
  /** The category the model claims, e.g. "Shades of red". */
  label: string;
  /** An abbreviation of `label` that fits a tree node, e.g. "Reds". */
  short: string;
  words: readonly string[];
  /** The model's one-line case for the group, shown on the card. */
  rationale: string;
  /** The evaluator's confidence in this group alone, 0..1. */
  confidence: number;
  /** Whether it is part of the true solution. Viz only; never consulted. */
  correct: boolean;
}

/** A state: the set of groups committed so far. */
export interface Thought {
  id: number;
  /** Committed group ids, ascending. The empty set is the root. */
  groups: readonly number[];
  depth: number;
  /** The searcher's evaluator on this partial solution, 0..1. */
  score: number;
  /** Words not yet placed, in the puzzle's own order. */
  loose: readonly string[];
  /** Thought ids reached by committing one more compatible group. */
  next: readonly number[];
  /** Structural oracle: no children and not the goal. Viz only. */
  deadEnd: boolean;
  isGoal: boolean;
}

export interface ThoughtSpace {
  prompt: string;
  words: readonly string[];
  groups: readonly Group[];
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
      "Always take the grouping that sounds surest, and never reconsider. The cheapest search, and it inherits every place the evaluator is wrong.",
  },
  {
    key: "bfs",
    label: "Breadth-first",
    blurb:
      "Score every partial solution one whole layer at a time. It refuses to prune, so it cannot be fooled — and it pays for that by scoring almost everything.",
  },
  {
    key: "dfs",
    label: "Depth-first",
    blurb:
      "Follow the surest-looking idea all the way down; when it dead-ends, back up to the last untried grouping and try that. Little memory, and it pours effort into a bad first idea.",
  },
  {
    key: "beam",
    label: "Beam",
    blurb:
      "Branch, then keep only the b most promising partial solutions at each layer. The middle road that Tree-of-Thoughts actually uses: b is the branching dial.",
  },
  {
    key: "mcts",
    label: "MCTS",
    blurb:
      "Run a few trial continuations from each partial solution and keep exploring wherever they tend to pay off, balancing what looks best against what is barely explored. The AlphaGo family's answer.",
  },
];

export interface SearchNode {
  id: number;
  parentId: number | null;
  thoughtId: number;
  /** Groups committed along the branch that reached this state. */
  depth: number;
  /** The searcher's evaluator on this thought. */
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
  /** Thought ids of the found solution, when solved. */
  solutionThoughts: number[];
  /** Group ids in the order they were committed, when solved. */
  solutionGroups: number[];
  /** Thought id where a committed strategy ran out of ideas, when it failed. */
  deadEndReached: number | null;
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

const disjoint = (a: readonly string[], b: readonly string[]) =>
  !a.some((w) => b.includes(w));

/** A stable key for a set of group ids, so the DAG dedups on the SET. */
const keyOf = (groups: readonly number[]) => groups.join(",");

export interface ThoughtSpaceSpec {
  prompt: string;
  words: readonly string[];
  groups: readonly Omit<Group, "id">[];
}

/**
 * Derive the full state lattice from the authored groups.
 *
 * A state is any set of groups whose words are pairwise disjoint. The goal is
 * the state that places every word. States are created in breadth order and
 * children are listed ascending by id, so the whole structure — and therefore
 * every count the page prints — is deterministic.
 */
export function buildThoughtSpace(spec: ThoughtSpaceSpec): ThoughtSpace {
  const groups: Group[] = spec.groups.map((g, id) => ({ ...g, id }));

  const thoughts: Thought[] = [];
  const byKey = new Map<string, number>();

  const create = (committed: number[]): number => {
    const key = keyOf(committed);
    const existing = byKey.get(key);
    if (existing !== undefined) return existing;
    const placed = new Set(committed.flatMap((gid) => groups[gid].words));
    const id = thoughts.length;
    const confidences = committed.map((gid) => groups[gid].confidence);
    thoughts.push({
      id,
      groups: committed,
      depth: committed.length,
      // The evaluator on a partial solution: the mean of its groups' confidences.
      score: confidences.length
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0,
      loose: spec.words.filter((w) => !placed.has(w)),
      next: [],
      deadEnd: false,
      isGoal: placed.size === spec.words.length,
    });
    byKey.set(key, id);
    return id;
  };

  const root = create([]);
  // Breadth order: every state at depth d is created before any at depth d + 1.
  for (let cursor = 0; cursor < thoughts.length; cursor++) {
    const here = thoughts[cursor];
    if (here.isGoal) continue;
    const placed = new Set(here.groups.flatMap((gid) => groups[gid].words));
    const looseWords = spec.words.filter((w) => !placed.has(w));
    const next: number[] = [];
    for (const g of groups) {
      if (here.groups.includes(g.id)) continue;
      if (!disjoint(g.words, [...placed])) continue;
      if (!g.words.every((w) => looseWords.includes(w))) continue;
      next.push(create([...here.groups, g.id].sort((a, b) => a - b)));
    }
    thoughts[cursor] = { ...here, next: next.sort((a, b) => a - b) };
  }

  const goal = thoughts.findIndex((t) => t.isGoal);
  for (let i = 0; i < thoughts.length; i++) {
    thoughts[i] = {
      ...thoughts[i],
      deadEnd: thoughts[i].next.length === 0 && !thoughts[i].isGoal,
    };
  }

  return { prompt: spec.prompt, words: spec.words, groups, thoughts, root, goal };
}

/** Shared bookkeeping so every strategy counts the same way. */
class Trace {
  nodes: SearchNode[] = [];
  examined = 0;
  private nextId = 0;
  private space: ThoughtSpace;
  private maxNodes: number;

  constructor(space: ThoughtSpace, maxNodes: number) {
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
    // The groups, in the order the search actually committed them.
    const solutionGroups: number[] = [];
    for (let i = 1; i < solutionThoughts.length; i++) {
      const before = this.space.thoughts[solutionThoughts[i - 1]].groups;
      const after = this.space.thoughts[solutionThoughts[i]].groups;
      const added = after.find((g) => !before.includes(g));
      if (added !== undefined) solutionGroups.push(added);
    }
    return {
      strategy,
      nodes: this.nodes,
      thoughtsScored: this.examined,
      solved: solution !== null,
      solutionPath: path,
      solutionThoughts,
      solutionGroups,
      deadEndReached,
    };
  }
}

/** Run one search over the space and return the full, replayable trace. */
export function search(
  space: ThoughtSpace,
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
        if (kids.length === 0) break; // ran out of ideas
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
        // Surest-looking idea explored first → push it last (popped first).
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
      // PUCT trial continuations over the same space: follow promising branches,
      // with an exploration bonus that eventually tries the unglamorous idea.
      const rng = createRng(seed);
      const visited = new Set<number>([space.root]); // thoughts scored (global dedup)
      const childrenOf = new Map<number, SearchNode[]>();
      const visits = new Map<number, number>();
      const value = new Map<number, number>();
      visits.set(root.id, 0);
      value.set(root.id, root.score);

      const c = 1.4;
      const goalDepth = space.thoughts[space.goal].depth;
      let solution: SearchNode | null = null;

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
          if (avail.length === 0) break; // this continuation ran out of ideas
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

        // What the trial actually achieved: the fraction of the puzzle it
        // finished. A run that stalls two groups in is worth half of one that
        // sorts all sixteen words, however confident the evaluator was about
        // the groups it did commit. Note this reads only what the search
        // observed — it ran out of continuations — and never the deadEnd
        // oracle. Rewarding a stranded run by its evaluator score instead
        // (which is what a distance heuristic does) makes MCTS chase the trap,
        // because the trap is exactly where the evaluator is most confident.
        const reward = node.isGoal ? 1 : node.depth / goalDepth;
        for (const p of path) {
          const v = (visits.get(p.id) ?? 0) + 1;
          visits.set(p.id, v);
          const old = value.get(p.id) ?? 0;
          value.set(p.id, old + (reward - old) / v);
          p.visits = v;
          p.kept = true;
        }
      }

      for (const n of t.nodes) n.visits = visits.get(n.id) ?? 0;
      return t.finish(strategy, solution, null);
    }
  }
}

/** The cheapest possible baseline: score nothing, commit to one run. */
export const PLAIN_COT_THOUGHTS = 1;
