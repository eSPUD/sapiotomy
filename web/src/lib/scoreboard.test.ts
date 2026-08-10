/**
 * RETAINED UNRENDERED: old page 15 (The Scoreboard) was cut on 2026-08-10 and
 * nothing draws `scoreboard.ts` now. Kept because it cross-checks
 * `benchmark-scoreboard.json` against `wei-cot-scaling.json`, so two files
 * quoting one source cannot drift apart unnoticed.
 */
import { describe, expect, it } from "vitest";
import { DataValidationError } from "./data";
import { curves } from "./curves";
import { frontierOf, parseScoreboard, SCOREBOARD } from "./scoreboard";

const bench = (key: string) => SCOREBOARD.benchmarks.find((b) => b.key === key)!;
const score = (key: string, model: RegExp) => {
  const e = bench(key).entries.find((x) => model.test(x.model));
  expect(e, `${key}: no entry matching ${model}`).toBeDefined();
  return e!;
};

describe("Page 15: benchmark scoreboard data (published headline scores)", () => {
  it("carries all six benchmarks of the tour, and not ARC-AGI (old page 16's story)", () => {
    expect(SCOREBOARD.benchmarks.map((b) => b.key)).toEqual([
      "gsm8k",
      "math",
      "aime",
      "gpqa",
      "codeforces",
      "swebench",
      "frontiermath",
    ]);
  });

  it("GSM8K: PaLM CoT jump matches the page-5 source file, and the top is saturated", () => {
    // Same source (Wei et al. 2022) as data/wei-cot-scaling.json — must agree.
    const wei = curves.weiCotScaling.fit!.params;
    expect(score("gsm8k", /direct answer/).y).toBe(wei.palm540Standard);
    expect(score("gsm8k", /chain of thought/).y).toBe(wei.palm540Cot);
    expect(score("gsm8k", /GPT-4$/).y).toBe(92.0);
    expect(score("gsm8k", /Claude 3 Opus/).y).toBe(95.0);
    expect(bench("gsm8k").refLines[0].y).toBe(95);
  });

  it("MATH: ~5% (2021) to 42.5 (GPT-4) to 96.4/97.3 on MATH-500, subset switch flagged", () => {
    expect(score("math", /GPT-3/).y).toBe(5.0);
    expect(score("math", /GPT-4$/).y).toBe(42.5);
    expect(score("math", /^o1$/).y).toBe(96.4);
    expect(score("math", /DeepSeek-R1/).y).toBe(97.3);
    expect(score("math", /GPT-4o/).note).toMatch(/MATH-500.*subset/i);
  });

  it("AIME 2024: 12 (GPT-4o) to 74 (o1, one sample) to 96.7 (o3), R1 at 79.8", () => {
    expect(score("aime", /GPT-4o/).y).toBe(12);
    expect(score("aime", /o1, one sample/).y).toBe(74);
    expect(score("aime", /^o3$/).y).toBe(96.7);
    expect(score("aime", /DeepSeek-R1/).y).toBe(79.8);
    // The compute-settings asterisk is part of the datum, not garnish.
    expect(score("aime", /o1, one sample/).note).toMatch(/83%.*93%/);
    expect(score("aime", /GPT-4o/).note).toMatch(/9\.3%/);
  });

  it("GPQA Diamond: o1 (77.3) is the first past the PhD-expert bar (69.7); o3 at 87.7", () => {
    const experts = bench("gpqa").refLines.find((r) => /expert/i.test(r.label))!;
    expect(experts.y).toBe(69.7);
    expect(score("gpqa", /^o1$/).y).toBe(77.3);
    expect(score("gpqa", /^o3$/).y).toBe(87.7);
    expect(score("gpqa", /DeepSeek-R1/).y).toBe(71.5);
    const before = bench("gpqa").entries.filter((e) => e.x < score("gpqa", /^o1$/).x);
    for (const e of before) expect(e.y).toBeLessThan(experts.y);
  });

  it("Codeforces: Elo, not %, and o3's 2727 tops o1's 2061 and R1's 2029", () => {
    expect(bench("codeforces").unit).toMatch(/Elo/);
    expect(score("codeforces", /^o3$/).y).toBe(2727);
    expect(score("codeforces", /^o1$/).y).toBe(2061);
    expect(score("codeforces", /DeepSeek-R1/).y).toBe(2029);
    expect(score("codeforces", /GPT-4o/).y).toBe(759);
  });

  it("SWE-bench Verified: 38.8 (GPT-4o) to 48.9 (o1) to 71.7 (o3)", () => {
    expect(score("swebench", /GPT-4o/).y).toBe(38.8);
    expect(score("swebench", /^o1$/).y).toBe(48.9);
    expect(score("swebench", /^o3$/).y).toBe(71.7);
    expect(score("swebench", /DeepSeek-R1/).y).toBe(49.2);
  });

  it("FrontierMath: under 2 at launch, then the disputed pair 25.2 vs ~10", () => {
    expect(score("frontiermath", /best frontier models/).y).toBe(2.0);
    const internal = score("frontiermath", /internal/);
    const epoch = score("frontiermath", /Epoch/);
    expect(internal.y).toBe(25.2);
    expect(epoch.y).toBe(10.0);
    // Both sides of the dispute must carry their conditions.
    expect(internal.note).toMatch(/180-problem/);
    expect(epoch.note).toMatch(/290-problem/);
    expect(bench("frontiermath").lifespan!.fell).toBeNull();
    expect(bench("frontiermath").provenance).toMatch(/funding.*disclosed/i);
  });

  it("every entry names its model and source, every benchmark its citation", () => {
    for (const b of SCOREBOARD.benchmarks) {
      expect(b.citation.url).toMatch(/^https?:\/\//);
      expect(b.provenance.length).toBeGreaterThan(40);
      for (const e of b.entries) {
        expect(e.model.length).toBeGreaterThan(0);
        expect(e.source.length).toBeGreaterThan(0);
      }
    }
  });

  it("vendor-announcement figures are preprint-flagged or attributed per-dot", () => {
    // The o3 December figures are announcement numbers: every one carries an
    // OpenAI source label and a benchmark-level non-peer-reviewed trail.
    for (const key of ["aime", "gpqa", "codeforces", "swebench", "frontiermath"]) {
      const o3 = bench(key).entries.find((e) => /^o3\b/.test(e.model));
      if (o3) expect(o3.source).toMatch(/OpenAI 2024/);
    }
  });

  it("lifespans are consistent with the entries: the fall date has a dot behind it", () => {
    for (const b of SCOREBOARD.benchmarks) {
      if (!b.lifespan || b.lifespan.fell === null) continue;
      expect(b.lifespan.fell).toBeGreaterThanOrEqual(b.lifespan.introduced);
      expect(b.entries.some((e) => e.x === b.lifespan!.fell)).toBe(true);
    }
  });

  it("shelf lives shrink: GPQA and AIME fell in under a year, MATH stood ~4", () => {
    const span = (k: string) => bench(k).lifespan!.fell! - bench(k).lifespan!.introduced;
    expect(span("math")).toBeGreaterThan(3.5);
    expect(span("gpqa")).toBeLessThan(1);
    expect(span("aime")).toBeLessThan(1);
  });
});

describe("scoreboard loader validation", () => {
  const minimal = () => ({
    xDomain: [2021, 2026],
    benchmarks: [
      {
        key: "k",
        name: "n",
        ask: "a",
        status: "s",
        unit: "%",
        unitShort: "%",
        yDomain: [0, 100],
        refLines: [],
        lifespan: null,
        entries: [{ x: 2024, y: 50, model: "m", source: "src" }],
        citation: { ref: "r", url: "https://x", venue: "v", preprint: true },
        provenance: "p",
      },
    ],
  });

  it("accepts a well-formed file", () => {
    expect(parseScoreboard(minimal()).benchmarks).toHaveLength(1);
  });

  it("rejects a missing citation", () => {
    const raw = minimal();
    delete (raw.benchmarks[0] as Record<string, unknown>).citation;
    expect(() => parseScoreboard(raw)).toThrow(DataValidationError);
  });

  it("rejects a score with no source, and a non-finite score", () => {
    const noSource = minimal();
    (noSource.benchmarks[0].entries[0] as Record<string, unknown>).source = "";
    expect(() => parseScoreboard(noSource)).toThrow(DataValidationError);

    const nan = minimal();
    (nan.benchmarks[0].entries[0] as Record<string, unknown>).y = NaN;
    expect(() => parseScoreboard(nan)).toThrow(DataValidationError);
  });

  it("rejects out-of-order entries — the timeline must be a timeline", () => {
    const raw = minimal();
    raw.benchmarks[0].entries = [
      { x: 2025, y: 60, model: "m2", source: "s2" },
      { x: 2024, y: 50, model: "m1", source: "s1" },
    ];
    expect(() => parseScoreboard(raw)).toThrow(DataValidationError);
  });
});

describe("frontierOf (the best-so-far staircase)", () => {
  it("keeps only record-setting scores, in order", () => {
    const mk = (x: number, y: number) => ({ x, y, model: `${y}`, source: "s" });
    expect(frontierOf([mk(1, 10), mk(2, 5), mk(3, 20), mk(4, 20), mk(5, 25)]).map((e) => e.y)).toEqual([
      10, 20, 25,
    ]);
  });

  it("on AIME it runs 12 → 74 → 96.7 and skips R1's later, lower dot", () => {
    expect(frontierOf(bench("aime").entries).map((e) => e.y)).toEqual([12, 74, 96.7]);
  });
});
