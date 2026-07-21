import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import { frontierCumulativeUSDM, sameModelCumulativeUSDM } from "./dailyTraining";
import {
  COMPUTER_SCRIPT,
  GAME_ROUNDS,
  WORLD_CUP_2026,
} from "./authored";
import { coverageAtLeastOne, sampleGrid } from "./sim";

const TOL = 1.0;

describe("Page 1 authored game rounds", () => {
  it("every round's answer is arithmetically correct", () => {
    expect(GAME_ROUNDS[0].answer).toBe(2 + 2);
    expect(GAME_ROUNDS[1].answer).toBe(17 * 24);
    expect(GAME_ROUNDS[2].answer).toBe(350 * 638);
  });

  it("display strings match the answers", () => {
    for (const r of GAME_ROUNDS) {
      expect(Number(r.display.replace(/,/g, ""))).toBe(r.answer);
    }
  });

  it("the computer script covers every round in order with rising times", () => {
    expect(COMPUTER_SCRIPT.map((m) => m.round)).toEqual(GAME_ROUNDS.map((_, i) => i));
    for (let i = 1; i < COMPUTER_SCRIPT.length; i++) {
      expect(COMPUTER_SCRIPT[i].seconds).toBeGreaterThan(COMPUTER_SCRIPT[i - 1].seconds);
    }
    for (const m of COMPUTER_SCRIPT) {
      expect(Number(m.typed.replace(/,/g, ""))).toBe(GAME_ROUNDS[m.round].answer);
    }
  });
});

describe("Page 2 world-cup question (authored; answer key is a flagged placeholder)", () => {
  it("offers four distinct names with the winner index inside the list", () => {
    expect(WORLD_CUP_2026.options).toHaveLength(4);
    expect(new Set(WORLD_CUP_2026.options).size).toBe(4);
    expect(WORLD_CUP_2026.winnerIndex).toBeGreaterThanOrEqual(0);
    expect(WORLD_CUP_2026.winnerIndex).toBeLessThan(WORLD_CUP_2026.options.length);
  });

  it("asks about the 2026 final by name", () => {
    expect(WORLD_CUP_2026.question).toContain("2026");
    expect(WORLD_CUP_2026.question).toContain("World Cup");
  });

  it("the machine's labels seal its memory before the final and turn search off", () => {
    expect(WORLD_CUP_2026.machine.cutoffLabel).toMatch(/202[0-5]/);
    expect(WORLD_CUP_2026.machine.constraintLabel).toMatch(/no web search/i);
  });

  it("the example reply owns the gap and never names one of the four as winner", () => {
    expect(WORLD_CUP_2026.exampleReply.length).toBeGreaterThan(0);
    const joined = WORLD_CUP_2026.exampleReply.join(" ");
    // The spec's ideal failure: it owns the gap, saying it was not trained on it...
    expect(joined).toMatch(/not trained/i);
    // ...and it points the reader to the obvious fix, a web/Google search...
    expect(joined).toMatch(/search/i);
    // ...and it refuses to guess a name (no option may appear in the reply).
    for (const name of WORLD_CUP_2026.options) {
      expect(joined).not.toContain(name);
    }
    // The page's own hard rule: no inference talk anywhere in the data.
    expect(joined).not.toMatch(/inference/i);
  });
});

describe("Page 3 daily-training meter (Epoch run-cost anchor)", () => {
  it("anchors: $78M per GPT-4-class run, $191M Gemini Ultra context, AI Index citation", () => {
    const d = curves.epochRunCost;
    const p = d.fit!.params;
    expect(p.usdMillionPerRun).toBe(78);
    expect(p.geminiUltraUSDMillion).toBe(191);
    expect(d.citation.venue).toContain("AI Index");
    expect(d.citation.preprint).toBe(true);
    expect(d.provenance.length).toBeGreaterThan(0);
    expect(d.provenance).toMatch(/derived/i);
  });

  it("the cumulative points are the pure daily rate (derived, linear)", () => {
    const d = curves.epochRunCost;
    expect(d.points[0]).toEqual({ x: 0, y: 0 });
    expect(d.points[d.points.length - 1]).toEqual({ x: 365, y: 28470 });
    expect(365 * 78).toBe(28470);
    expect(Math.abs(interpolate(d, 100) - 7800)).toBeLessThan(0.001);
    expect(Math.abs(interpolate(d, 365) - d.fit!.params.yearTotalUSDMillion)).toBeLessThan(0.001);
  });

  it("the $1B crossing lands on day 13", () => {
    const p = curves.epochRunCost.fit!.params;
    expect(p.crossBillionDay).toBe(13);
    expect(12 * 78).toBeLessThan(1000);
    expect(13 * 78).toBeGreaterThanOrEqual(1000);
  });
});

describe("Page 3 frontier compute growth (Epoch, redrawn) and the combined meter", () => {
  it("rates and anchors are the verbatim Epoch figures, under CC BY", () => {
    const d = curves.epochComputeGrowth;
    const p = d.fit!.params;
    expect(p.perYearLM).toBe(5.0);
    expect(p.ci90Low).toBe(3.1);
    expect(p.ci90High).toBe(7.3);
    expect(p.gpt3Flop).toBe(3e23);
    expect(p.gpt4Flop).toBe(2e25);
    expect(p.geminiUltraFlop).toBe(5e25);
    expect(d.citation.venue).toBe("Epoch AI");
    expect(d.citation.preprint).toBe(true);
    expect(d.provenance).toMatch(/Creative Commons/);
    expect(d.provenance).toMatch(/REDRAWING/);
  });

  it("the drawn trend is 5x per year and stays inside the cited window", () => {
    const pts = curves.epochComputeGrowth.points;
    for (let i = 1; i < pts.length; i++) {
      const years = pts[i].x - pts[i - 1].x;
      const expected = Math.pow(5, years);
      const ratio = pts[i].y / pts[i - 1].y;
      expect(Math.abs(ratio - expected) / expected).toBeLessThan(0.01);
    }
    expect(pts[0].x).toBe(2020.5);
    // No extrapolation past the study's May 2024 endpoint.
    expect(pts[pts.length - 1].x).toBeLessThanOrEqual(2024.5);
  });

  it("combined meter: linear same-model, compounding frontier, $1T crossing at month 48", () => {
    expect(sameModelCumulativeUSDM(365)).toBe(28470);
    expect(frontierCumulativeUSDM(0)).toBe(0);
    expect(frontierCumulativeUSDM(12)).toBeGreaterThan(sameModelCumulativeUSDM(365));
    expect(frontierCumulativeUSDM(60) / 1e6).toBeCloseTo(2.557, 1);
    expect(frontierCumulativeUSDM(47)).toBeLessThan(1e6);
    expect(frontierCumulativeUSDM(48)).toBeGreaterThanOrEqual(1e6);
  });
});

describe("Page 4 Epoch rate anchors", () => {
  it("training-cost rate: x2.4 per year (CI x2.0 to x3.1), $1B projection by 2027", () => {
    const d = curves.epochTrainingCosts;
    const p = d.fit!.params;
    expect(p.perYear).toBe(2.4);
    expect(p.ci95Low).toBe(2.0);
    expect(p.ci95High).toBe(3.1);
    expect(p.projectionYear).toBe(2027);
    expect(d.citation.venue).toBe("Epoch AI");
    expect(d.citation.preprint).toBe(true);
    expect(d.provenance.length).toBeGreaterThan(0);
    expect(Math.abs(interpolate(d, 1) - 2.4)).toBeLessThan(0.001);
    expect(Math.abs(interpolate(d, 2) - 2.4 * 2.4)).toBeLessThan(0.001);
  });

  it("answer-price rate: /40 per year at the GPQA bar; range /9 to /900, median /50", () => {
    const d = curves.epochInferencePrices;
    const p = d.fit!.params;
    expect(p.perYearGPQA).toBe(40);
    expect(p.rangeLow).toBe(9);
    expect(p.rangeHigh).toBe(900);
    expect(p.median).toBe(50);
    expect(p.medianSinceJan2024).toBe(200);
    expect(d.citation.preprint).toBe(true);
    expect(Math.abs(interpolate(d, 1) - 1 / 40)).toBeLessThan(0.0001);
  });

  it("energy ladder: rungs derive from 0.3 Wh per answer and 50 GWh per run", () => {
    const d = curves.queryEnergy;
    const p = d.fit!.params;
    expect(p.whShortAnswer).toBe(0.3);
    expect(p.runGWh).toBe(50);
    expect(d.points[0].y).toBe(0.3);
    expect(d.points[1].y).toBe(10 * 365 * 0.3);
    expect(d.points[2].y).toBe(2.5e9 * 0.3);
    expect(d.points[3].y).toBe(50e9);
    expect(d.citation.preprint).toBe(true);
    // the derived comparisons quoted in-app
    expect(Math.round(d.points[3].y / d.points[2].y)).toBe(67);
    expect(Math.round(d.points[3].y / d.points[0].y / 1e9)).toBe(167);
  });
});

describe("Retained anchor: chain-of-thought (Wei et al.), reserved for later pages", () => {
  it("17.9% -> 56.9% (+39.0) still matches Wei et al.", () => {
    const cot = curves.chainOfThought;
    const standard = interpolate(cot, 0);
    const withCot = interpolate(cot, 1);
    expect(Math.abs(standard - 17.9)).toBeLessThan(TOL);
    expect(Math.abs(withCot - 56.9)).toBeLessThan(TOL);
    expect(Math.abs(withCot - standard - 39.0)).toBeLessThan(TOL);
    expect(cot.citation.ref).toBe("Wei et al. 2022");
    expect(cot.citation.preprint).toBe(false);
  });
});

describe("Page 5 coverage sampling", () => {
  it("sampleGrid is deterministic and the right length", () => {
    const a = sampleGrid(0.35, 8, 7);
    const b = sampleGrid(0.35, 8, 7);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
  });

  it("coverage rises with attempts toward 1", () => {
    expect(coverageAtLeastOne(0.35, 10)).toBeGreaterThan(coverageAtLeastOne(0.35, 1));
    expect(coverageAtLeastOne(0.35, 10)).toBeLessThan(1);
  });
});
