/**
 * Page 10, "Searching Through Thoughts" — the road-map routing engine.
 *
 * The page shows a "towns examined" counter and claims one strategy costs
 * several times another. That is only honest if the engine is real, so these
 * tests pin the exact behaviour the page's copy describes on the chosen map:
 * greedy drives into the bridgeless peninsula and strands, a beam of 1 strands
 * with it, a beam of 2+ succeeds, depth-first succeeds by backtracking,
 * breadth-first succeeds by flooding the map (the most expensive), and MCTS
 * succeeds for a fraction of that. If the engine or the map drifts, the copy
 * becomes false and this suite fails first.
 */
import { describe, expect, it } from "vitest";
import { ROUTE_MAP } from "./authored";
import { milesToGo, search, STRATEGIES, type RouteMap, type Strategy } from "./routing";

const MAP = ROUTE_MAP as RouteMap;
const OPTS = { maxNodes: 400, rollouts: 80 };
const run = (s: Strategy, beamWidth?: number) => search(MAP, s, { ...OPTS, beamWidth });

/** True iff there is a road between towns a and b (either direction). */
function roadExists(a: number, b: number): boolean {
  return MAP.roads.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

describe("Route map: the instance", () => {
  it("has an origin, a destination, and the destination is a distinct town", () => {
    expect(MAP.origin).toBe(0);
    expect(MAP.destination).toBe(10);
    expect(MAP.towns[MAP.destination].name).toBe("Easton");
  });

  it("the straight-line heuristic makes the bridgeless spur look closest", () => {
    // Ferry Landing (the trap) is nearer the destination as the crow flies than
    // any town on the real route — which is exactly why greedy is fooled.
    const trap = milesToGo(MAP, ROUTE_MAP.trap);
    for (const onRoute of [5, 6, 7]) {
      expect(trap).toBeLessThan(milesToGo(MAP, onRoute));
    }
  });

  it("the destination is reachable (breadth-first finds it)", () => {
    expect(run("bfs").solved).toBe(true);
  });
});

describe("Route map: the strategies on the chosen instance", () => {
  it("greedy drives into the peninsula and strands at the bridgeless spur", () => {
    const r = run("greedy");
    expect(r.solved).toBe(false);
    expect(r.deadEndReached).toBe(ROUTE_MAP.trap);
    expect(r.townsExamined).toBeLessThan(20);
  });

  it("a beam of 1 fails, and a beam of 2 or more succeeds", () => {
    expect(run("beam", 1).solved).toBe(false);
    for (const b of [2, 3, 4, 5]) {
      expect(run("beam", b).solved).toBe(true);
    }
  });

  it("wider beams cost more", () => {
    for (let b = 3; b <= 5; b++) {
      expect(run("beam", b).townsExamined).toBeGreaterThan(run("beam", b - 1).townsExamined);
    }
  });

  it("depth-first, breadth-first and MCTS all solve it", () => {
    for (const s of ["bfs", "dfs", "mcts"] as const) {
      expect(run(s).solved).toBe(true);
    }
  });

  it("breadth-first is the most expensive way to be right", () => {
    const bfs = run("bfs").townsExamined;
    expect(bfs).toBeGreaterThan(run("dfs").townsExamined);
    expect(bfs).toBeGreaterThan(run("mcts").townsExamined);
    expect(bfs).toBeGreaterThan(run("beam", 2).townsExamined);
    // It floods the map: nearly every town is scored.
    expect(bfs).toBeGreaterThan(MAP.towns.length - 3);
  });

  it("MCTS finds the same route for a fraction of breadth-first's bill", () => {
    const ratio = run("bfs").townsExamined / run("mcts").townsExamined;
    expect(ratio).toBeGreaterThan(1.2);
  });

  it("MCTS is stable across rollout budgets (it stops when it arrives)", () => {
    const a = search(MAP, "mcts", { ...OPTS, rollouts: 24 }).townsExamined;
    const b = search(MAP, "mcts", { ...OPTS, rollouts: 80 }).townsExamined;
    expect(a).toBe(b);
  });

  it("every reported route is a real drive from origin to destination", () => {
    for (const s of ["bfs", "dfs", "mcts"] as const) {
      const r = run(s);
      expect(r.routeTowns[0]).toBe(MAP.origin);
      expect(r.routeTowns[r.routeTowns.length - 1]).toBe(MAP.destination);
      for (let i = 1; i < r.routeTowns.length; i++) {
        expect(roadExists(r.routeTowns[i - 1], r.routeTowns[i])).toBe(true);
      }
      expect(r.routeSteps.length).toBe(r.routeTowns.length - 1);
    }
  });

  it("is deterministic per strategy", () => {
    for (const s of STRATEGIES) {
      const a = search(MAP, s.key, OPTS);
      const b = search(MAP, s.key, OPTS);
      expect(a.townsExamined).toBe(b.townsExamined);
      expect(a.solved).toBe(b.solved);
      expect(a.routeTowns).toEqual(b.routeTowns);
    }
  });

  it("never exceeds its node ceiling", () => {
    for (const s of STRATEGIES) {
      const r = search(MAP, s.key, { maxNodes: 8, rollouts: 80 });
      expect(r.townsExamined).toBeLessThanOrEqual(8 + 5); // one expansion may overshoot
    }
  });

  it("the structural oracle labels the bridgeless spur a dead end, unconsulted", () => {
    const r = run("bfs");
    const dead = r.nodes.filter((n) => n.deadEnd);
    expect(dead.length).toBeGreaterThan(0);
    expect(dead.some((n) => n.townId === ROUTE_MAP.trap)).toBe(true);
  });

  it("every strategy has a label and a blurb for the dropdown", () => {
    expect(STRATEGIES.length).toBe(5);
    for (const s of STRATEGIES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.blurb.length).toBeGreaterThan(0);
    }
  });
});
