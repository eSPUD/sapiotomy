import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import {
  COMPUTER_SCRIPT,
  GAME_ROUNDS,
  INSTANT_BLURTS,
  MATCH_NIGHT,
  TRACE_4502,
  TRACE_4502_ANSWER,
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

describe("Page 2 instant blurts (informal DeepSeek-V3 test) and the trace", () => {
  it("the first three blurts are right and the fourth is wrong by exactly 10,000", () => {
    const [a, b, c, d] = INSTANT_BLURTS.rounds;
    expect(a.blurted).toBe(a.trueValue);
    expect(b.blurted).toBe(b.trueValue);
    expect(c.blurted).toBe(c.trueValue);
    expect(d.trueValue).toBe(4502 * 6398);
    expect(d.trueValue - d.blurted).toBe(10000);
  });

  it("true values are the actual products", () => {
    expect(INSTANT_BLURTS.rounds[1].trueValue).toBe(17 * 24);
    expect(INSTANT_BLURTS.rounds[2].trueValue).toBe(350 * 638);
  });

  it("carries the informal-test label", () => {
    expect(INSTANT_BLURTS.model).toBe("DeepSeek-V3");
    expect(INSTANT_BLURTS.note.length).toBeGreaterThan(0);
  });

  it("the trace opens with the blurt, catches it, and lands the true product", () => {
    expect(TRACE_4502_ANSWER).toBe(4502 * 6398);
    expect(TRACE_4502[0]).toContain("28,793,796");
    const joined = TRACE_4502.join(" ");
    expect(joined).toContain("27,012,000");
    expect(joined).toContain("1,791,796");
    expect(joined).toContain("28,791,000");
    expect(TRACE_4502[TRACE_4502.length - 1]).toContain("28,803,796");
  });

  it("the trace's arithmetic is internally consistent", () => {
    expect(4502 * 6000).toBe(27012000);
    expect(4502 * 400 - 4502 * 2).toBe(1791796);
    expect(27012000 + 1791796).toBe(TRACE_4502_ANSWER);
    expect(4500 * 6398 + 2 * 6398).toBe(TRACE_4502_ANSWER);
  });
});

describe("Page 3 match-night config (hypothetical by design)", () => {
  it("has a form guide with material to reason from on both sides", () => {
    expect(MATCH_NIGHT.formGuide.favorite.length).toBeGreaterThanOrEqual(3);
    expect(MATCH_NIGHT.formGuide.underdog.length).toBeGreaterThanOrEqual(3);
  });

  it("the injury news strikes a real line of the favorite's form guide", () => {
    const i = MATCH_NIGHT.injuredLineIndex;
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(MATCH_NIGHT.formGuide.favorite.length);
    expect(MATCH_NIGHT.injuredLineReplacement.length).toBeGreaterThan(0);
  });

  it("the past final is far enough back that a blank memory is common", () => {
    expect(MATCH_NIGHT.pastYear).toBeLessThanOrEqual(2014);
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
