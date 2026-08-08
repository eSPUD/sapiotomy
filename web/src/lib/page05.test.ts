import { describe, expect, it } from "vitest";
import {
  PAGE5,
  PairedTableError,
  SUPPRESSION_TABLE,
  pLabel,
  pairedTable,
  pct,
  solvedIn,
  tidyMath,
  type Contrast,
} from "./page05";

/**
 * The translation step's own guardrail. The notebook is the authority on every
 * number; what these tests check is that the file committed to web/data is the
 * run page 5 was written against, that its aggregates agree with each other,
 * and that the two derivations the page performs on top of them (the paired
 * table and the LaTeX tidying) are right. A wrong copy into web/data fails
 * here rather than drawing a plausible wrong figure.
 */
describe("page 5 derived run: the claims contract", () => {
  it("passes every gate the page depends on", () => {
    for (const flag of [
      "suppression_resolves",
      "blurt_compliance",
      "specimen_usable",
      "instruction_null_bounded",
      "floor_is_flat",
      "may_compare_across_models",
    ]) {
      expect(PAGE5.claims[flag]).toBe(true);
    }
  });

  it("is the Qwen2.5 instrument at n = 100, greedy, levels 4 and 5", () => {
    expect(PAGE5.manifest.primary_model).toBe("Qwen/Qwen2.5-3B-Instruct");
    expect(PAGE5.manifest.decoding.strategy).toBe("greedy");
    expect(PAGE5.manifest.items.eval_levels).toEqual([4, 5]);
    expect(PAGE5.manifest.items.n).toBe(100);
    // Every model on the page is bf16: the page's numbers carry no quantisation
    // caveat, and figure 3 may only compare across models when precision is
    // recorded per model.
    for (const m of PAGE5.manifest.models) expect(m.quant).toBe("bf16");
  });

  it("carries the gag as an exact string, since one phrasing is all it is", () => {
    expect(PAGE5.manifest.conditions.forced_blurt).toContain("No explanation, no working");
    expect(PAGE5.manifest.conditions.bare).toBe("");
  });
});

describe("page 5 figure 1: the specimen", () => {
  const tabs = PAGE5.figure1.tabs;

  it("is one problem under two prompts, blurt wrong and bare right", () => {
    expect(tabs.map((t) => t.condition)).toEqual(["forced_blurt", "bare"]);
    const blurt = tabs[0];
    const bare = tabs[1];
    expect(blurt.correct).toBe(false);
    expect(bare.correct).toBe(true);
    expect(bare.extractedAnswer).toBe(PAGE5.figure1.groundTruth);
  });

  it("differs only in the suffix: the stem is shared and nothing precedes it", () => {
    for (const t of tabs) expect(t.promptBefore).toBe("");
    expect(tabs[0].promptAfter.length).toBeGreaterThan(0);
    expect(tabs[1].promptAfter).toBe("");
  });

  it("reveals real token boundaries: the steps tile the token list exactly", () => {
    for (const t of tabs) {
      expect(t.tokens).toHaveLength(t.tokensGenerated);
      expect(t.steps[0].tokenStart).toBe(0);
      expect(t.steps[t.steps.length - 1].tokenEnd).toBe(t.tokens.length);
      expect(t.tokens.join("")).toBe(t.trace);
    }
  });

  it("shows a chain the bare prompt never asked for", () => {
    const bare = tabs[1];
    expect(bare.steps.length).toBeGreaterThan(1);
    expect(bare.tokensGenerated).toBeGreaterThan(tabs[0].tokensGenerated * 10);
  });
});

describe("page 5 figure 2: the paired table", () => {
  it("reconciles the discordant counts with both solve counts", () => {
    const t = SUPPRESSION_TABLE;
    expect(t.cells).toHaveLength(PAGE5.figure2.bare.n);
    expect(t.both + t.afterOnly).toBe(PAGE5.figure2.bare.nCorrect);
    expect(t.both + t.beforeOnly).toBe(PAGE5.figure2.blurt.nCorrect);
    expect(t.both + t.afterOnly + t.beforeOnly + t.neither).toBe(t.n);
    // The contrast the page prints is exactly those two discordant counts.
    expect(t.afterOnly).toBe(PAGE5.figure2.suppression.fixed);
    expect(t.beforeOnly).toBe(PAGE5.figure2.suppression.broken);
  });

  it("flipping the gag moves precisely the discordant cells", () => {
    const t = SUPPRESSION_TABLE;
    const solvedFree = t.cells.filter((c) => solvedIn(c, "after")).length;
    const solvedGagged = t.cells.filter((c) => solvedIn(c, "before")).length;
    expect(solvedFree).toBe(PAGE5.figure2.bare.nCorrect);
    expect(solvedGagged).toBe(PAGE5.figure2.blurt.nCorrect);
    expect(solvedFree - solvedGagged).toBe(PAGE5.figure2.suppression.deltaPts);
  });

  it("rejects counts that cannot come from one paired run", () => {
    const bad: Contrast = { ...PAGE5.figure2.suppression, fixed: 90, broken: 90 };
    expect(() => pairedTable(100, 7, 43, bad)).toThrow(PairedTableError);
  });

  it("keeps the suppression contrast resolved and the instruction bounded", () => {
    expect(PAGE5.figure2.suppression.significant).toBe(true);
    expect(PAGE5.figure2.suppression.p).toBeLessThan(0.05);
    // The null is a bound, never a zero: the page may only say "smaller than".
    expect(PAGE5.figure2.instruction.significant).toBe(false);
    expect(PAGE5.figure2.instructionBoundPts).toBeLessThan(15);
    expect(PAGE5.figure2.instructionBoundPts).toBeGreaterThan(0);
  });

  it("verifies the gag worked, which is all chain share is for", () => {
    expect(PAGE5.figure2.blurt.chainShare).toBe(0);
    expect(PAGE5.figure2.bare.chainShare).toBe(1);
  });
});

describe("page 5 figure 3: the floor", () => {
  it("has a flat floor and a fanned-out top", () => {
    const rows = PAGE5.figure3.models;
    expect(rows).toHaveLength(3);
    const blurts = rows.map((m) => m.blurtAccuracy * 100);
    const bares = rows.map((m) => m.bareAccuracy * 100);
    expect(Math.max(...blurts) - Math.min(...blurts)).toBeLessThan(10);
    expect(Math.max(...bares) - Math.min(...bares)).toBeGreaterThan(10);
  });

  it("has the cross-model comparison the headline sentence rests on", () => {
    const c = PAGE5.figure3.cross;
    expect(c.gagged_large_accuracy).toBeLessThan(c.ungagged_small_accuracy);
    expect(c.significant).toBe(true);
    expect(c.param_ratio).toBeGreaterThan(4);
  });
});

describe("page 5 close", () => {
  it("carries the token multiple page 6 opens on", () => {
    expect(PAGE5.close.bare_median_tokens / PAGE5.close.blurt_median_tokens).toBeCloseTo(
      PAGE5.close.token_multiple,
      1,
    );
    expect(PAGE5.close.suppression_pts).toBe(PAGE5.figure2.suppression.deltaPts);
  });
});

describe("display helpers", () => {
  it("formats percentages and p-values the way the figures print them", () => {
    expect(pct(0.43)).toBe("43%");
    expect(pct(0.0343, 1)).toBe("3.4%");
    expect(pLabel(1.7e-8)).toBe("p < 0.0001");
    expect(pLabel(0.0433)).toBe("p = 0.043");
    expect(pLabel(0.0005)).toBe("p < 0.001");
  });

  it("tidies the model's LaTeX for display without changing what it says", () => {
    expect(tidyMath("Half the value of $3x-9$ is $x+37$.")).toBe("Half the value of 3x-9 is x+37.");
    expect(tidyMath("\\[\n\\frac{1}{2}(3x - 9) = x + 37\n\\]")).toBe("1/2(3x - 9) = x + 37");
    expect(tidyMath("The value of \\( x \\) is \\(\\boxed{83}\\).")).toBe("The value of x is 83.");
    expect(tidyMath("2 \\cdot 3 \\le 7")).toBe("2 · 3 ≤ 7");
  });

  it("leaves anything it does not recognise exactly as the model wrote it", () => {
    expect(tidyMath("\\underbrace{x}_{y}")).toBe("\\underbrace{x}_{y}");
  });

  it("tidies every step of the shipped specimen without emptying one", () => {
    for (const t of PAGE5.figure1.tabs) {
      for (const s of t.steps) expect(tidyMath(s.text).length).toBeGreaterThan(0);
    }
  });
});
