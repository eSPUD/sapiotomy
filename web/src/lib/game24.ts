/**
 * A real Game-of-24 search engine (Page 10, "Searching Through Thoughts").
 *
 * Why a real engine and not a canned animation: the page's claim is that
 * different search STRATEGIES explore the same space differently and cost
 * different amounts of compute. That claim is only honest if the tree is
 * actually searched and the node counts are actually counted. Everything here
 * is pure, deterministic (seeded where it needs randomness) and unit-tested, so
 * the compute counter on screen is a measurement of this code, not a prop.
 *
 * The state space: a state is a multiset of numbers. A move picks two of them
 * and combines them with + − × ÷, leaving one fewer number. From four numbers,
 * three moves reach a single value; the state is a win when that value is the
 * target. This mirrors Tree-of-Thoughts' own decomposition of the task (Yao et
 * al. 2023), which is the result data/tree-of-thoughts.json is anchored to.
 *
 * TWO evaluators, deliberately kept apart:
 *   - `heuristic()` is what the SEARCHER sees. It is cheap and deliberately
 *     imperfect — the stand-in for an LLM's "is this state promising?" value
 *     judgement. If the searcher had a perfect evaluator there would be nothing
 *     to search and nothing to teach.
 *   - `canReach()` is the exact oracle, used ONLY to label nodes in the
 *     visualisation ("this branch was actually a dead end") and to verify a
 *     reported solution. No strategy is allowed to consult it.
 */

const EPS = 1e-6;

export type Op = "+" | "−" | "×" | "÷";

export interface Move {
  a: number;
  b: number;
  op: Op;
  result: number;
  /** e.g. "13 − 9 = 4" */
  expr: string;
}

/** Format a value: integers plain, fractions to at most two decimals. */
export function fmt(v: number): string {
  if (Math.abs(v - Math.round(v)) < EPS) return String(Math.round(v));
  return String(Math.round(v * 100) / 100);
}

/** Every distinct one-move successor of a state, with the move that made it. */
export function moves(nums: number[]): { nums: number[]; move: Move }[] {
  const out: { nums: number[]; move: Move }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const a = nums[i];
      const b = nums[j];
      const rest = nums.filter((_, k) => k !== i && k !== j);

      const candidates: { op: Op; x: number; y: number; result: number }[] = [
        { op: "+", x: a, y: b, result: a + b },
        { op: "×", x: a, y: b, result: a * b },
        { op: "−", x: a, y: b, result: a - b },
        { op: "−", x: b, y: a, result: b - a },
      ];
      if (Math.abs(b) > EPS) candidates.push({ op: "÷", x: a, y: b, result: a / b });
      if (Math.abs(a) > EPS) candidates.push({ op: "÷", x: b, y: a, result: b / a });

      for (const c of candidates) {
        const next = [...rest, c.result].sort((p, q) => p - q);
        const key = `${c.x}${c.op}${c.y}|${next.map(fmt).join(",")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          nums: next,
          move: {
            a: c.x,
            b: c.y,
            op: c.op,
            result: c.result,
            expr: `${fmt(c.x)} ${c.op} ${fmt(c.y)} = ${fmt(c.result)}`,
          },
        });
      }
    }
  }
  return out;
}

/** Exact oracle: can this state still reach the target? Labelling only. */
export function canReach(nums: number[], target: number): boolean {
  if (nums.length === 1) return Math.abs(nums[0] - target) < EPS;
  for (const m of moves(nums)) {
    if (canReach(m.nums, target)) return true;
  }
  return false;
}

/**
 * The searcher's value estimate, in [0, 1] — informative but not an oracle.
 *
 * Three regimes, mirroring how much work an honest evaluator can do at a
 * glance:
 *   1 number  — exact closeness to the target. Nothing left to judge.
 *   2 numbers — exact. With one move left there are only six things to try, so
 *               any evaluator worth the name checks them: 1.0 if some op lands
 *               the target, otherwise closeness of the nearest miss.
 *   3+ numbers — a guess. It asks the two questions a person eyeballs first,
 *               "do these sum to about 24?" and "do they multiply to about
 *               24?", and takes the better.
 *
 * That third regime is where the imperfection lives, and it is what makes the
 * page's point: the evaluator likes 6, 9, 13 (they sum to 28) but is blind to
 * why 4, 4, 10 is just as good (10 − 4 = 6 sets up 4 × 6). A searcher steered
 * by this can and does walk into dead ends — which is why the strategy on top
 * of it matters.
 */
export function heuristic(nums: number[], target: number): number {
  if (nums.length === 1) {
    return Math.max(0, 1 - Math.abs(nums[0] - target) / target);
  }
  if (nums.length === 2) {
    let best = Infinity;
    for (const m of moves(nums)) {
      best = Math.min(best, Math.abs(m.nums[0] - target));
    }
    return Math.max(0, 1 - best / target);
  }
  const sum = nums.reduce((a, b) => a + b, 0);
  const product = nums.reduce((a, b) => a * b, 1);
  const distance = Math.min(Math.abs(sum - target), Math.abs(product - target));
  return Math.max(0, 1 - distance / target);
}

export type Strategy = "greedy" | "bfs" | "dfs" | "beam" | "mcts";

export const STRATEGIES: { key: Strategy; label: string; blurb: string }[] = [
  {
    key: "greedy",
    label: "Greedy",
    blurb:
      "Take the best-looking move at every step and never look back. Cheapest possible search, and it inherits every mistake its evaluator makes.",
  },
  {
    key: "bfs",
    label: "Breadth-first",
    blurb:
      "Expand every state at one depth before going deeper. Guaranteed to find the shallowest solution, and pays for the guarantee in nodes.",
  },
  {
    key: "dfs",
    label: "Depth-first",
    blurb:
      "Follow one line all the way down, and when it dead-ends, back up to the last unexplored branch and try again. Cheap memory, and it can sink a lot of compute into a bad opening.",
  },
  {
    key: "beam",
    label: "Beam",
    blurb:
      "Breadth-first, but keep only the b best states at each depth. The middle road that Tree-of-Thoughts actually uses: b is the branching dial.",
  },
  {
    key: "mcts",
    label: "MCTS",
    blurb:
      "Spend rollouts where they look most valuable, balancing what already scores well against what is barely explored. The AlphaGo family's answer.",
  },
];

export interface SearchNode {
  id: number;
  parentId: number | null;
  depth: number;
  nums: number[];
  /** The move that produced this state; null at the root. */
  expr: string | null;
  /** What the searcher's evaluator thought of this state. */
  score: number;
  /** Exact oracle — for labelling dead ends in the viz, never read by a strategy. */
  solvable: boolean;
  /** 1-based order in which the searcher evaluated this node. */
  order: number;
  /** Did the searcher expand/keep this node, or prune it? */
  kept: boolean;
  /** Is this the target, reached? */
  isSolution: boolean;
  /** MCTS only: how many rollouts passed through this node. */
  visits?: number;
}

export interface SearchTrace {
  strategy: Strategy;
  target: number;
  nodes: SearchNode[];
  /** The compute counter: states the evaluator was asked to score. */
  nodesEvaluated: number;
  solved: boolean;
  /** Node ids from root to the solution leaf, when solved. */
  solutionPath: number[];
  /** The three moves that make the target, when solved. */
  solutionMoves: string[];
}

export interface SearchOptions {
  /** Beam width / branching factor b. Used by beam (and caps greedy's shortlist). */
  beamWidth?: number;
  /** Hard ceiling on evaluated nodes, so a bad strategy cannot run forever. */
  maxNodes?: number;
  /** MCTS rollout budget. */
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

/** Shared bookkeeping so every strategy counts compute the same way. */
class Trace {
  nodes: SearchNode[] = [];
  evaluated = 0;
  private nextId = 0;

  constructor(
    readonly target: number,
    readonly maxNodes: number,
  ) {}

  root(nums: number[]): SearchNode {
    const node: SearchNode = {
      id: this.nextId++,
      parentId: null,
      depth: 0,
      nums,
      expr: null,
      score: heuristic(nums, this.target),
      solvable: canReach(nums, this.target),
      order: 0,
      kept: true,
      isSolution: false,
    };
    this.nodes.push(node);
    return node;
  }

  /** Score and record a child. Counts against the compute budget. */
  add(parent: SearchNode, nums: number[], expr: string): SearchNode {
    this.evaluated += 1;
    const node: SearchNode = {
      id: this.nextId++,
      parentId: parent.id,
      depth: parent.depth + 1,
      nums,
      expr,
      score: heuristic(nums, this.target),
      solvable: canReach(nums, this.target),
      order: this.evaluated,
      kept: false,
      isSolution: nums.length === 1 && Math.abs(nums[0] - this.target) < EPS,
    };
    this.nodes.push(node);
    return node;
  }

  get exhausted(): boolean {
    return this.evaluated >= this.maxNodes;
  }

  finish(strategy: Strategy, solution: SearchNode | null): SearchTrace {
    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const path: number[] = [];
    const solutionMoves: string[] = [];
    let cur = solution;
    while (cur) {
      path.unshift(cur.id);
      if (cur.expr) solutionMoves.unshift(cur.expr);
      cur.kept = true;
      cur = cur.parentId === null ? null : (byId.get(cur.parentId) ?? null);
    }
    return {
      strategy,
      target: this.target,
      nodes: this.nodes,
      nodesEvaluated: this.evaluated,
      solved: solution !== null,
      solutionPath: path,
      solutionMoves,
    };
  }
}

/** Run one search and return the full, replayable trace. */
export function search(
  numbers: number[],
  target: number,
  strategy: Strategy,
  opts: SearchOptions = {},
): SearchTrace {
  const beamWidth = opts.beamWidth ?? 3;
  const maxNodes = opts.maxNodes ?? 2000;
  const rollouts = opts.rollouts ?? 60;
  const seed = opts.seed ?? 24;

  const t = new Trace(target, maxNodes);
  const root = t.root([...numbers].sort((a, b) => a - b));

  const expand = (node: SearchNode): SearchNode[] =>
    moves(node.nums).map((m) => t.add(node, m.nums, m.move.expr));

  switch (strategy) {
    case "greedy": {
      // One line, no backtracking: score the children, keep the single best.
      let node = root;
      while (node.nums.length > 1 && !t.exhausted) {
        const children = expand(node);
        if (children.length === 0) break;
        const solution = children.find((c) => c.isSolution);
        if (solution) return t.finish(strategy, solution);
        children.sort((a, b) => b.score - a.score);
        node = children[0];
        node.kept = true;
      }
      return t.finish(strategy, null);
    }

    case "bfs": {
      // Every state at one depth before any state at the next.
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const next: SearchNode[] = [];
        for (const node of frontier) {
          if (node.nums.length === 1 || t.exhausted) continue;
          for (const child of expand(node)) {
            if (child.isSolution) {
              child.kept = true;
              return t.finish(strategy, child);
            }
            child.kept = true;
            next.push(child);
          }
        }
        frontier = next;
      }
      return t.finish(strategy, null);
    }

    case "dfs": {
      // One line to the bottom, then back up to the last untried branch.
      const stack: SearchNode[] = [root];
      while (stack.length > 0 && !t.exhausted) {
        const node = stack.pop()!;
        if (node.isSolution) {
          return t.finish(strategy, node);
        }
        if (node.nums.length === 1) continue; // dead end: back up
        node.kept = true;
        const children = expand(node);
        const solution = children.find((c) => c.isSolution);
        if (solution) return t.finish(strategy, solution);
        // Best-scoring child explored first → push in reverse.
        children.sort((a, b) => a.score - b.score);
        stack.push(...children);
      }
      return t.finish(strategy, null);
    }

    case "beam": {
      // Breadth-first with a width cap: the pruning step made visible.
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const children: SearchNode[] = [];
        for (const node of frontier) {
          if (node.nums.length === 1 || t.exhausted) continue;
          children.push(...expand(node));
        }
        const solution = children.find((c) => c.isSolution);
        if (solution) {
          solution.kept = true;
          return t.finish(strategy, solution);
        }
        if (children.length === 0) break;
        children.sort((a, b) => b.score - a.score);
        frontier = children.slice(0, beamWidth);
        for (const k of frontier) k.kept = true;
      }
      return t.finish(strategy, null);
    }

    case "mcts": {
      // PUCT over the same tree: expand once, then spend rollouts where the
      // combination of "scores well" and "barely explored" is highest.
      const rng = createRng(seed);
      const childrenOf = new Map<number, SearchNode[]>();
      const visits = new Map<number, number>();
      const value = new Map<number, number>();
      visits.set(root.id, 0);
      value.set(root.id, root.score);

      const c = 1.2;
      let solution: SearchNode | null = null;

      for (let r = 0; r < rollouts && !t.exhausted && !solution; r++) {
        // Selection: walk down by PUCT, expanding the first unexpanded node.
        const path: SearchNode[] = [root];
        let node = root;
        while (node.nums.length > 1) {
          let kids = childrenOf.get(node.id);
          if (!kids) {
            kids = expand(node);
            childrenOf.set(node.id, kids);
            for (const k of kids) {
              visits.set(k.id, 0);
              value.set(k.id, k.score);
            }
            const win = kids.find((k) => k.isSolution);
            if (win) {
              solution = win;
              break;
            }
            if (kids.length === 0) break;
          }
          if (kids.length === 0) break;
          const parentVisits = (visits.get(node.id) ?? 0) + 1;
          const prior = 1 / kids.length;
          let best = kids[0];
          let bestScore = -Infinity;
          for (const k of kids) {
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
          if (node.isSolution) {
            solution = node;
            break;
          }
          if (t.exhausted) break;
        }

        // Backup: the leaf's value flows to every node on the path.
        const reward = node.score;
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
      return t.finish(strategy, solution);
    }
  }
}

/** The cheapest possible baseline: expand nothing, commit to one chain. */
export const PLAIN_COT_NODES = 1;
