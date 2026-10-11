import { describe, expect, it } from "vitest";
import { curves, interpolate } from "./curves";
import { frontierCumulativeUSDM, sameModelCumulativeUSDM } from "./dailyTraining";
import {
  COMPUTER_SCRIPT,
  GAME_ROUNDS,
  MULT_METHODS,
  SORTING_ITEMS,
  SPAIN_WORLD_CUPS,
  SYSTEMS,
  SYSTEM_EXAMPLES,
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

describe("Page 1 System 1 / System 2 (authored multiplication contrast)", () => {
  it("System 1 product is 3 × 4 = 12", () => {
    expect(SYSTEMS.fast.prompt).toBe("3 × 4");
    expect(Number(SYSTEMS.fast.answer)).toBe(3 * 4);
  });

  it("System 2 steps are arithmetically consistent and equal 17 × 24", () => {
    expect(17 * 20).toBe(340);
    expect(17 * 4).toBe(68);
    expect(340 + 68).toBe(408);
    expect(20 + 4).toBe(24);
    // A planning step (split 24) before the three computing steps.
    expect(SYSTEMS.slow.steps).toEqual(["24 = 20 + 4", "17 × 20 = 340", "17 × 4 = 68", "340 + 68 = 408"]);
    expect(Number(SYSTEMS.slow.answer)).toBe(17 * 24);
  });

  it("every page 1 example is arithmetically consistent: split, two partials, sum", () => {
    const n = (x: string) => Number(x.replace(/\s/g, ""));
    for (const { fast, slow } of SYSTEM_EXAMPLES) {
      const [fa, fb] = fast.prompt.split("×").map(n);
      expect(fa * fb).toBe(n(fast.answer));
      const [a, b] = slow.prompt.split("×").map(n);
      expect(slow.steps).toHaveLength(4);
      const [split, p1, p2, sum] = slow.steps;
      const [hi, lo] = split.split("=")[1].split("+").map(n);
      expect(n(split.split("=")[0])).toBe(b);
      expect(hi + lo).toBe(b);
      expect(p1).toBe(`${a} × ${hi} = ${a * hi}`);
      expect(p2).toBe(`${a} × ${lo} = ${a * lo}`);
      expect(sum).toBe(`${a * hi} + ${a * lo} = ${a * b}`);
      expect(n(slow.answer)).toBe(a * b);
    }
    expect(new Set(SYSTEM_EXAMPLES.map((e) => e.slow.prompt)).size).toBe(SYSTEM_EXAMPLES.length);
    expect(SYSTEM_EXAMPLES[0]).toBe(SYSTEMS);
  });

  it("offers nine sort items, five System 1 and four System 2, with unique ids", () => {
    expect(SORTING_ITEMS).toHaveLength(9);
    expect(SORTING_ITEMS.filter((x) => x.system === "fast")).toHaveLength(5);
    expect(SORTING_ITEMS.filter((x) => x.system === "slow")).toHaveLength(4);
    expect(new Set(SORTING_ITEMS.map((x) => x.id)).size).toBe(9);
    for (const x of SORTING_ITEMS) expect(["fast", "slow"]).toContain(x.system);
  });
});

describe("Page 2 Spain World-Cup count (authored; the 2026 win is a flagged placeholder)", () => {
  it("asks how many World Cups Spain has won", () => {
    expect(SPAIN_WORLD_CUPS.question).toContain("Spain");
    expect(SPAIN_WORLD_CUPS.question).toContain("World Cup");
  });

  it("the true count is the wins list, and the machine undercounts by exactly the newest", () => {
    expect(SPAIN_WORLD_CUPS.wins).toHaveLength(SPAIN_WORLD_CUPS.trueCount);
    // latestYear is the most recent win, the one the model was sealed before.
    expect(Math.max(...SPAIN_WORLD_CUPS.wins)).toBe(SPAIN_WORLD_CUPS.latestYear);
    // The model knows only the pre-cutoff wins, so it lands exactly one short.
    expect(SPAIN_WORLD_CUPS.machine.knownWins).not.toContain(SPAIN_WORLD_CUPS.latestYear);
    expect(SPAIN_WORLD_CUPS.machine.answer).toBe(SPAIN_WORLD_CUPS.trueCount - 1);
    expect(SPAIN_WORLD_CUPS.machine.answer).toBe(SPAIN_WORLD_CUPS.machine.knownWins.length);
  });

  it("the machine's labels seal its memory before the final and turn search off", () => {
    expect(SPAIN_WORLD_CUPS.machine.cutoffLabel).toMatch(/202[0-5]/);
    expect(SPAIN_WORLD_CUPS.machine.constraintLabel).toMatch(/no web search/i);
  });

  it("the blurt is a confident count off stale memory: it cites a known win, never the newest", () => {
    expect(SPAIN_WORLD_CUPS.machine.reply.length).toBeGreaterThan(0);
    const joined = SPAIN_WORLD_CUPS.machine.reply.join(" ");
    // It confidently cites a title it DOES know (a pre-cutoff year)...
    expect(joined).toContain(String(SPAIN_WORLD_CUPS.machine.knownWins[0]));
    // ...but never the newest title it was sealed before (its whole problem)...
    expect(joined).not.toContain(String(SPAIN_WORLD_CUPS.latestYear));
    // ...and the page's hard rule: no inference talk in the data.
    expect(joined).not.toMatch(/inference/i);
  });

  it("the page-4 thinking trace recognizes the gap and checks; it does not invent the fact", () => {
    const t = SPAIN_WORLD_CUPS.thinking;
    expect(t.steps.length).toBeGreaterThan(1);
    const joined = t.steps.join(" ");
    // It reasons about its own cutoff / staleness before answering...
    expect(joined).toMatch(/cutoff|sealed|memory|behind|recent/i);
    // ...decides to look rather than answer from memory...
    expect(joined).toMatch(/check|source|look/i);
    // ...and, having looked, DOES name the newest title the blurt omitted
    // (the contrast with machine.reply) — recognition, not invention.
    expect(joined).toContain(String(SPAIN_WORLD_CUPS.latestYear));
    // The count it lands on matches the true total, not the blurt.
    expect(t.answer).toMatch(/two/i);
    expect(SPAIN_WORLD_CUPS.trueCount).toBe(2);
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

describe("Page 3 dataset-size projection (Epoch's own historical projection)", () => {
  const d = curves.epochDatasetProjection;
  const p = d.fit!.params;

  it("reproduces the growth rate the source script prints", () => {
    // dataset_size_projections.py prints "Median: 0.37" log10/year with a 95% CI
    // of [0.26, 0.49]. Our seeded rerun of that regression has to land there, or
    // the projection is not the one Epoch published.
    expect(p.log10PerYearMedian).toBeCloseTo(0.37, 1);
    expect(p.growthPerYearMedian).toBeCloseTo(10 ** p.log10PerYearMedian, 1);
    expect(p.growthPerYearLow).toBeLessThan(p.growthPerYearMedian);
    expect(p.growthPerYearHigh).toBeGreaterThan(p.growthPerYearMedian);
    expect(p.systemsRegressed).toBe(80);
    expect(p.bootstrapDraws).toBe(10000);
  });

  it("starts from the script's stated 2024 anchor, not the regression intercept", () => {
    expect(p.anchorYear).toBe(2024);
    expect(p.anchorLowTokensT).toBe(3);
    expect(p.anchorHighTokensT).toBe(13);
    // lognormal median of the anchor is the geometric mean of its bounds
    expect(p.anchorMedianTokensT).toBeCloseTo(Math.sqrt(3 * 13), 2);
    expect(d.points[0].x).toBe(p.anchorYear);
    expect(d.points[0].y).toBeCloseTo(p.anchorMedianTokensT, 2);
  });

  it("compounds at the fitted rate and runs to 2030", () => {
    expect(d.points[d.points.length - 1].x).toBe(p.lastProjectedYear);
    expect(p.lastProjectedYear).toBe(2030);
    for (let i = 1; i < d.points.length; i++) {
      expect(d.points[i].x).toBe(d.points[i - 1].x + 1);
      // each year multiplies by the fitted factor, within rounding
      expect(d.points[i].y / d.points[i - 1].y).toBeCloseTo(p.growthPerYearMedian, 1);
    }
  });

  it("carries a band that brackets the median at every year", () => {
    expect(d.band).toBeDefined();
    expect(p.bandCredibility).toBe(90);
    d.points.forEach((pt, i) => {
      expect(d.band!.lower[i].x).toBe(pt.x);
      expect(d.band!.upper[i].x).toBe(pt.x);
      expect(d.band!.lower[i].y).toBeLessThanOrEqual(pt.y);
      expect(d.band!.upper[i].y).toBeGreaterThanOrEqual(pt.y);
    });
  });

  it("crosses the cited stock inside Villalobos's own utilization window", () => {
    // The whole point of the figure: the trend meets the ceiling, and it does so
    // when the paper says the stock is fully used, which is a real corroboration
    // rather than a number we chose.
    const stock = p.stockTrillionTokens;
    expect(stock).toBe(curves.epochDataStock.fit!.params.stockTrillionTokens);
    const window = curves.epochDataStock.fit!.params;
    expect(p.medianCrossesStockYear).toBeGreaterThanOrEqual(window.windowStartYear);
    expect(p.medianCrossesStockYear).toBeLessThanOrEqual(window.windowEndYear);
    const before = d.points.filter((pt) => pt.x < p.medianCrossesStockYear).at(-1)!;
    const after = d.points.find((pt) => pt.x > p.medianCrossesStockYear)!;
    expect(before.y).toBeLessThan(stock);
    expect(after.y).toBeGreaterThan(stock);
  });

  it("says how it was derived, and what it leaves out", () => {
    expect(d.citation.url).toContain("github.com/epoch-research/data-stock");
    expect(d.provenance).toMatch(/dataset_size_projections\.py/);
    expect(d.provenance).toMatch(/words to\s+tokens by x4\/5/);
    expect(d.provenance).toMatch(/seeded at 20240101/);
    // the compute-based projection is NOT drawn, and the file must admit it
    expect(d.provenance).toMatch(/NOT included/);
    expect(d.provenance).toMatch(/dataset_size_comp/);
  });
});

describe("Page 3 data stock (Villalobos et al. 2024, Epoch AI)", () => {
  it("anchors: ~300T-token effective stock, fully utilized 2026-2032", () => {
    const d = curves.epochDataStock;
    const p = d.fit!.params;
    expect(p.stockTrillionTokens).toBe(300);
    expect(p.windowStartYear).toBe(2026);
    expect(p.windowEndYear).toBe(2032);
    // points encode exactly the two window endpoints against the stock.
    expect(d.points).toEqual([
      { x: 2026, y: 300 },
      { x: 2032, y: 300 },
    ]);
    expect(d.citation.ref).toContain("Villalobos");
    expect(d.citation.preprint).toBe(true);
    expect(d.provenance).toMatch(/300 trillion tokens/);
    expect(d.provenance).toMatch(/between 2026 and 2032/);
    // The median year the meter's hairline marks, and the standing promise that
    // no depletion rate is invented from a source that only gives a window.
    expect(p.medianYear).toBe(2028);
    expect(p.medianYear).toBeGreaterThanOrEqual(p.windowStartYear);
    expect(p.medianYear).toBeLessThanOrEqual(p.windowEndYear);
    expect(d.provenance).toMatch(/no depletion curve is digitized or drawn/i);
  });
});

describe("Page 3 compute-optimal scaling (Hoffmann et al. 2022, Chinchilla)", () => {
  it("anchors: ~20 tokens/param, and Chinchilla 70B beats Gopher 280B at equal compute", () => {
    const d = curves.chinchilla;
    const p = d.fit!.params;
    expect(p.tokensPerParam).toBe(20);
    expect(p.chinchillaParamsB).toBe(70);
    expect(p.chinchillaTokensB).toBe(1400);
    expect(p.gopherParamsB).toBe(280);
    expect(p.gopherTokensB).toBe(300);
    expect(p.chinchillaMMLU).toBe(67.5);
    expect(p.mmluGainPts).toBe(7);
    // The rule is self-consistent: Chinchilla's tokens ARE ~20 per parameter.
    expect(p.chinchillaTokensB / p.chinchillaParamsB).toBe(p.tokensPerParam);
    // Gopher is the counterexample: far bigger, far under the token rule.
    expect(p.gopherParamsB).toBeGreaterThan(p.chinchillaParamsB);
    expect(p.gopherTokensB / p.gopherParamsB).toBeLessThan(p.tokensPerParam);
  });

  it("is cited as peer-reviewed and names the Kaplan recipe it revised", () => {
    const d = curves.chinchilla;
    expect(d.citation.ref).toContain("Hoffmann");
    expect(d.citation.venue).toContain("NeurIPS");
    expect(d.citation.preprint).toBe(false);
    expect(d.provenance).toMatch(/Kaplan/);
    expect(d.provenance).toMatch(/20 tokens per parameter/i);
  });

  it("the points are the two model anchors, params vs training tokens", () => {
    const pts = curves.chinchilla.points;
    expect(pts).toEqual([
      { x: 280, y: 300 },
      { x: 70, y: 1400 },
    ]);
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

describe("Retained Epoch rate anchors (page 3's cost trend; prices and energy reserved)", () => {
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

describe("Page 4 authored multiplication methods (three roads, one destination)", () => {
  const { a, b, aDigits, bDigits, answer, display } = MULT_METHODS.problem;
  const digitsToNumber = (ds: readonly number[]) => ds.reduce((n, d) => n * 10 + d, 0);

  /** Place-value column u (0 = units): sum of digit pairs with msf indices i+j = 4-u. */
  const columnSum = (u: number) => {
    let s = 0;
    for (let i = 0; i <= 2; i++) {
      const j = 4 - u - i;
      if (j >= 0 && j <= 2) s += aDigits[i] * bDigits[j];
    }
    return s;
  };

  it("the problem is exactly page 1's round 3", () => {
    expect(`${a} × ${b}`).toBe(GAME_ROUNDS[2].prompt);
    expect(answer).toBe(GAME_ROUNDS[2].answer);
    expect(display).toBe(GAME_ROUNDS[2].display);
    expect(a * b).toBe(answer);
    expect(digitsToNumber(aDigits)).toBe(a);
    expect(digitsToNumber(bDigits)).toBe(b);
  });

  it("standard rows are the true partial products and sum to the answer", () => {
    const rows = MULT_METHODS.standard.rows;
    // One row per digit of b, units first.
    expect(rows.map((r) => r.digit)).toEqual([...bDigits].reverse());
    let sum = 0;
    rows.forEach((r, i) => {
      expect(r.placeValue).toBe(10 ** i);
      expect(r.partial).toBe(a * r.digit * r.placeValue);
      sum += r.partial;
    });
    expect(sum).toBe(answer);
  });

  it("line diagonals count the true crossings, and their weighted sum is the answer", () => {
    const diags = MULT_METHODS.lines.diagonals;
    expect(diags).toHaveLength(5);
    let total = 0;
    diags.forEach((d, u) => {
      expect(d.placeValue).toBe(10 ** u);
      // The listed digit pairs multiply out to the column's crossing count...
      expect(d.pairs.reduce((s, [x, y]) => s + x * y, 0)).toBe(d.sum);
      // ...which is the true convolution column recomputed from the digits.
      expect(d.sum).toBe(columnSum(u));
      total += d.sum * d.placeValue;
    });
    expect(total).toBe(answer);
  });

  it("vedic columns match the line diagonals and carry to exactly the answer", () => {
    const cols = MULT_METHODS.vedic.columns;
    expect(cols).toHaveLength(5);
    let carry = 0;
    let assembled = 0;
    cols.forEach((c, u) => {
      // The deliberate beat: the same five sums as the line method's diagonals.
      expect(c.sum).toBe(MULT_METHODS.lines.diagonals[u].sum);
      expect(c.carryIn).toBe(carry);
      const total = c.sum + c.carryIn;
      if (u < cols.length - 1) {
        expect(c.digit).toBe(total % 10);
        expect(c.carryOut).toBe(Math.floor(total / 10));
      } else {
        // The last column writes everything left.
        expect(c.digit).toBe(total);
        expect(c.carryOut).toBe(0);
      }
      carry = c.carryOut;
      assembled += c.digit * c.placeValue;
    });
    expect(assembled).toBe(answer);
  });

  it("no Act 2 jargon anywhere in the authored copy", () => {
    expect(JSON.stringify(MULT_METHODS)).not.toMatch(/inference/i);
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
