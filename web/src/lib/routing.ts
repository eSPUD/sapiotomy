/**
 * A real road-map routing engine (Page 10, "Searching Through Thoughts").
 *
 * Why a real engine and not a canned animation: the page's claim is that
 * different search STRATEGIES explore the same map differently and cost
 * different amounts of compute. That is only honest if the map is actually
 * searched and the towns examined are actually counted. Everything here is pure
 * and deterministic (seeded where it needs randomness) and unit-tested, so the
 * "towns examined" counter on screen is a measurement of this code, not a prop.
 *
 * The state space: a state is a TOWN. A move drives down a road to a neighbouring
 * town. The search is a win when it reaches the destination. A visited set keeps
 * the search from driving in circles.
 *
 * TWO evaluators, deliberately kept apart:
 *   - `milesToGo()` is what the SEARCHER sees: the straight-line ("as the crow
 *     flies") distance to the destination — exactly the number a GPS shows.
 *     It is informative but blind to water: the town closest in a straight line
 *     may be a dead-end spur with no bridge. It stands in for a model's "is this
 *     thought promising?" value judgement, and its blindness is the whole point.
 *   - `deadEnd` is an exact structural label (a degree-one spur that is not the
 *     destination), used ONLY to colour the map. No strategy consults it.
 */

export interface Town {
  id: number;
  name: string;
  /** Map coordinates; y increases northward. */
  x: number;
  y: number;
}

export interface RouteMap {
  towns: readonly Town[];
  /** Undirected roads, by town id. */
  roads: readonly (readonly [number, number])[];
  origin: number;
  destination: number;
}

export type Strategy = "greedy" | "bfs" | "dfs" | "beam" | "mcts";

export const STRATEGIES: { key: Strategy; label: string; blurb: string }[] = [
  {
    key: "greedy",
    label: "Greedy",
    blurb:
      "Always drive toward the destination as the crow flies, and never turn back. The cheapest search, and it inherits every place the straight-line guess is wrong.",
  },
  {
    key: "bfs",
    label: "Breadth-first",
    blurb:
      "Fan out road by road, a whole ring of towns at a time. Guaranteed to find the fewest-hops route, and it pays for the guarantee by visiting almost every town.",
  },
  {
    key: "dfs",
    label: "Depth-first",
    blurb:
      "Follow one route to its end; when it dead-ends, back up to the last untried turn and try again. Little memory, and it can pour effort into a bad first direction.",
  },
  {
    key: "beam",
    label: "Beam",
    blurb:
      "Fan out, but keep only the b most promising towns at each step. The middle road that Tree-of-Thoughts actually uses: b is the branching dial.",
  },
  {
    key: "mcts",
    label: "MCTS",
    blurb:
      "Send a few test-drives out from each town and keep exploring wherever they tend to arrive, balancing what looks close against what is barely explored. The AlphaGo family's answer.",
  },
];

export interface RouteNode {
  id: number;
  parentId: number | null;
  townId: number;
  /** Hops from the origin along the branch that reached this town. */
  depth: number;
  /** Straight-line distance to the destination — the searcher's evaluator. */
  milesToGo: number;
  /** Closeness in [0, 1] (higher is better): 1 − milesToGo / mapSpan. */
  score: number;
  /** Structural oracle: a degree-one spur that is not the destination. Viz only. */
  deadEnd: boolean;
  /** 1-based order in which the searcher examined this town. */
  order: number;
  /** Did the searcher keep/expand this town, or prune it? */
  kept: boolean;
  isDestination: boolean;
  /** MCTS only: how many test-drives passed through this town. */
  visits?: number;
}

export interface RouteTrace {
  strategy: Strategy;
  nodes: RouteNode[];
  /** The compute counter: towns the evaluator was asked to score. */
  townsExamined: number;
  solved: boolean;
  /** Node ids from origin to the destination, when solved. */
  routePath: number[];
  /** Town ids of the found route, when solved. */
  routeTowns: number[];
  /** e.g. "Westford → Highbridge", one per hop of the found route. */
  routeSteps: string[];
  /** Total straight-line miles along the found route. */
  routeMiles: number;
  /** Town id where a committed strategy ran out of road, when it failed. */
  deadEndReached: number | null;
}

export interface RouteOptions {
  /** Beam width / branching factor b. */
  beamWidth?: number;
  /** Hard ceiling on towns examined, so a bad strategy cannot run forever. */
  maxNodes?: number;
  /** MCTS test-drive budget. */
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

const distance = (a: Town, b: Town) => Math.hypot(a.x - b.x, a.y - b.y);

/** Adjacency list, degree, and the map's diagonal span (for normalising score). */
function analyse(map: RouteMap) {
  const neighbors = new Map<number, number[]>();
  const degree = new Map<number, number>();
  for (const t of map.towns) {
    neighbors.set(t.id, []);
    degree.set(t.id, 0);
  }
  for (const [a, b] of map.roads) {
    neighbors.get(a)!.push(b);
    neighbors.get(b)!.push(a);
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  // Deterministic expansion order: neighbours sorted by town id.
  for (const list of neighbors.values()) list.sort((p, q) => p - q);
  const xs = map.towns.map((t) => t.x);
  const ys = map.towns.map((t) => t.y);
  const span = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  return { neighbors, degree, span };
}

/** Straight-line distance from a town to the destination (the GPS heuristic). */
export function milesToGo(map: RouteMap, townId: number): number {
  const town = map.towns[townId];
  return distance(town, map.towns[map.destination]);
}

/** Shared bookkeeping so every strategy counts the same way. */
class Trace {
  nodes: RouteNode[] = [];
  examined = 0;
  private nextId = 0;

  constructor(
    private readonly map: RouteMap,
    private readonly degree: Map<number, number>,
    private readonly span: number,
    private readonly maxNodes: number,
  ) {}

  private make(townId: number, parent: RouteNode | null): RouteNode {
    const m = milesToGo(this.map, townId);
    return {
      id: this.nextId++,
      parentId: parent ? parent.id : null,
      townId,
      depth: parent ? parent.depth + 1 : 0,
      milesToGo: m,
      score: Math.max(0, 1 - m / this.span),
      deadEnd: (this.degree.get(townId) ?? 0) <= 1 && townId !== this.map.destination,
      order: parent ? this.examined : 0,
      kept: parent === null,
      isDestination: townId === this.map.destination,
    };
  }

  root(): RouteNode {
    const node = this.make(this.map.origin, null);
    this.nodes.push(node);
    return node;
  }

  /** Score and record an arrival at `townId`. Counts against the compute budget. */
  add(parent: RouteNode, townId: number): RouteNode {
    this.examined += 1;
    const node = this.make(townId, parent);
    this.nodes.push(node);
    return node;
  }

  get exhausted(): boolean {
    return this.examined >= this.maxNodes;
  }

  finish(strategy: Strategy, solution: RouteNode | null, deadEndReached: number | null): RouteTrace {
    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    const path: number[] = [];
    const routeTowns: number[] = [];
    let cur = solution;
    while (cur) {
      path.unshift(cur.id);
      routeTowns.unshift(cur.townId);
      cur.kept = true;
      cur = cur.parentId === null ? null : (byId.get(cur.parentId) ?? null);
    }
    const routeSteps: string[] = [];
    let routeMiles = 0;
    for (let i = 1; i < routeTowns.length; i++) {
      const from = this.map.towns[routeTowns[i - 1]];
      const to = this.map.towns[routeTowns[i]];
      routeSteps.push(`${from.name} → ${to.name}`);
      routeMiles += distance(from, to);
    }
    return {
      strategy,
      nodes: this.nodes,
      townsExamined: this.examined,
      solved: solution !== null,
      routePath: path,
      routeTowns,
      routeSteps,
      routeMiles: Math.round(routeMiles),
      deadEndReached,
    };
  }
}

/** Run one search over the map and return the full, replayable trace. */
export function search(map: RouteMap, strategy: Strategy, opts: RouteOptions = {}): RouteTrace {
  const beamWidth = opts.beamWidth ?? 3;
  const maxNodes = opts.maxNodes ?? 400;
  const rollouts = opts.rollouts ?? 80;
  const seed = opts.seed ?? 24;

  const { neighbors, degree, span } = analyse(map);
  const t = new Trace(map, degree, span, maxNodes);
  const root = t.root();

  // Expand a town: score every not-yet-visited neighbour (counts + marks visited).
  const expand = (node: RouteNode, visited: Set<number>): RouteNode[] => {
    const kids: RouteNode[] = [];
    for (const nb of neighbors.get(node.townId) ?? []) {
      if (visited.has(nb)) continue;
      visited.add(nb);
      kids.push(t.add(node, nb));
      if (t.exhausted) break;
    }
    return kids;
  };

  switch (strategy) {
    case "greedy": {
      // One committed drive: score the turns, take the closest, never turn back.
      const visited = new Set<number>([map.origin]);
      let node = root;
      while (!node.isDestination && !t.exhausted) {
        const kids = expand(node, visited);
        const win = kids.find((k) => k.isDestination);
        if (win) return t.finish(strategy, win, null);
        if (kids.length === 0) break; // ran out of road
        kids.sort((a, b) => b.score - a.score);
        node = kids[0];
        node.kept = true;
      }
      return t.finish(
        strategy,
        node.isDestination ? node : null,
        node.isDestination ? null : node.townId,
      );
    }

    case "bfs": {
      const visited = new Set<number>([map.origin]);
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const next: RouteNode[] = [];
        for (const node of frontier) {
          if (node.isDestination || t.exhausted) continue;
          for (const child of expand(node, visited)) {
            if (child.isDestination) {
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
      const visited = new Set<number>([map.origin]);
      const stack: RouteNode[] = [root];
      while (stack.length > 0 && !t.exhausted) {
        const node = stack.pop()!;
        if (node.isDestination) return t.finish(strategy, node, null);
        node.kept = true;
        const kids = expand(node, visited);
        const win = kids.find((k) => k.isDestination);
        if (win) return t.finish(strategy, win, null);
        // Closest-looking turn explored first → push it last (popped first).
        kids.sort((a, b) => a.score - b.score);
        stack.push(...kids);
      }
      return t.finish(strategy, null, null);
    }

    case "beam": {
      const visited = new Set<number>([map.origin]);
      let frontier = [root];
      while (frontier.length > 0 && !t.exhausted) {
        const kids: RouteNode[] = [];
        for (const node of frontier) {
          if (node.isDestination || t.exhausted) continue;
          kids.push(...expand(node, visited));
        }
        const win = kids.find((k) => k.isDestination);
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
      // PUCT test-drives over the same map: expand along promising routes, with an
      // exploration bonus that eventually tries the road that heads away first.
      const rng = createRng(seed);
      const visited = new Set<number>([map.origin]); // towns scored (global, dedup)
      const childrenOf = new Map<number, RouteNode[]>();
      const visits = new Map<number, number>();
      const value = new Map<number, number>();
      visits.set(root.id, 0);
      value.set(root.id, root.score);

      const c = 1.4;
      let solution: RouteNode | null = null;

      for (let r = 0; r < rollouts && !t.exhausted && !solution; r++) {
        const path: RouteNode[] = [root];
        const seenTowns = new Set<number>([root.townId]);
        let node = root;
        while (!node.isDestination) {
          let kids = childrenOf.get(node.id);
          if (!kids) {
            kids = expand(node, visited);
            childrenOf.set(node.id, kids);
            for (const k of kids) {
              visits.set(k.id, 0);
              value.set(k.id, k.score);
            }
            const win = kids.find((k) => k.isDestination);
            if (win) {
              solution = win;
              break;
            }
          }
          const avail = kids.filter((k) => !seenTowns.has(k.townId));
          if (avail.length === 0) break; // this drive ran out of road
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
          seenTowns.add(node.townId);
          if (node.isDestination) {
            solution = node;
            break;
          }
          if (t.exhausted) break;
        }

        const reward = node.isDestination ? 1 : node.score;
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

/** The cheapest possible baseline: examine nothing, commit to one drive. */
export const PLAIN_COT_TOWNS = 1;
