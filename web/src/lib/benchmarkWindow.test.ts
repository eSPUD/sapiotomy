import { describe, expect, it } from "vitest";
import {
  CEILING_PCT,
  FLOOR_PCT,
  logistic,
  MODEL_OFFSETS,
  populationScores,
  testScore,
  windowState,
  WINDOW_TESTS,
} from "./benchmarkWindow";

const statesAt = (capability: number) =>
  WINDOW_TESTS.map((t) => windowState(populationScores(capability, t.difficulty)));

describe("Page 15: the benchmark-window simulation (authored, illustrative)", () => {
  it("logistic is a proper squash: 0.5 at 0, monotone, bounded", () => {
    expect(logistic(0)).toBeCloseTo(0.5);
    expect(logistic(3)).toBeGreaterThan(logistic(1));
    expect(logistic(-10)).toBeGreaterThan(0);
    expect(logistic(10)).toBeLessThan(1);
  });

  it("scores rise monotonically with capability on every test", () => {
    for (const t of WINDOW_TESTS) {
      let prev = -1;
      for (let c = 0; c <= 12; c += 0.5) {
        const s = testScore(c, t.difficulty);
        expect(s).toBeGreaterThan(prev);
        prev = s;
      }
    }
  });

  it("the page's opening position reads ceiling / window / window / floor", () => {
    // capability 4.5 is Page15's default slider position.
    expect(statesAt(4.5)).toEqual(["ceiling", "window", "window", "floor"]);
  });

  it("every test passes floor → window → ceiling as the frontier climbs", () => {
    for (const t of WINDOW_TESTS) {
      const sweep: string[] = [];
      for (let c = t.difficulty - 4; c <= t.difficulty + 4; c += 0.25) {
        const s = windowState(populationScores(c, t.difficulty));
        if (sweep[sweep.length - 1] !== s) sweep.push(s);
      }
      expect(sweep).toEqual(["floor", "window", "ceiling"]);
    }
  });

  it("at the slider's top every test is at the ceiling: time for a harder one", () => {
    // capability 12 is Page15's slider maximum.
    expect(statesAt(12)).toEqual(["ceiling", "ceiling", "ceiling", "ceiling"]);
  });

  it("a test at the ceiling cannot separate the leader from the laggard", () => {
    const scores = populationScores(12, WINDOW_TESTS[0].difficulty);
    expect(Math.max(...scores) - Math.min(...scores)).toBeLessThan(100 - CEILING_PCT);
    // ...while a test in its window spreads the same population wide.
    const spread = populationScores(4.5, WINDOW_TESTS[1].difficulty);
    expect(Math.max(...spread) - Math.min(...spread)).toBeGreaterThan(40);
  });

  it("windowState needs the WHOLE population past a line, not just the leader", () => {
    const mixed = [FLOOR_PCT - 5, CEILING_PCT + 5, 50, 60, 70];
    expect(windowState(mixed)).toBe("window");
  });

  it("population offsets straddle the frontier, laggards first", () => {
    expect(MODEL_OFFSETS[0]).toBeLessThan(0);
    expect(MODEL_OFFSETS[MODEL_OFFSETS.length - 1]).toBeGreaterThan(0);
    expect([...MODEL_OFFSETS].sort((a, b) => a - b)).toEqual(MODEL_OFFSETS);
  });
});
