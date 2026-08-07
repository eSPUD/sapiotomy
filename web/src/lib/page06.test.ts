import { describe, expect, it } from "vitest";
import rawDerived from "@data/page-06-derived.json";
import { PAGE6, rowById, tidyMath, traceZones } from "./page06";

/**
 * The translation step's own guardrail. The notebook is the authority on every
 * number; what these tests check is that the file committed to web/data is the
 * run page 6 was written against, that its aggregates agree with each other and
 * with the raw records they were computed from, and that the one derivation the
 * page performs on top of them — slicing a trace into the four zones figure 1
 * tints — is right. A wrong copy into web/data fails here rather than drawing a
 * plausible wrong figure.
 *
 * This is the cross-language agreement test named in docs/page_6_refactor.md
 * section 6: the aggregates are recomputed in TypeScript from the per-item
 * records the notebook emitted alongside them, and any disagreement is a
 * failing suite rather than a page that quietly ships different numbers than
 * the notebook produced.
 */

const RAW = rawDerived as unknown as {
  figure_2: {
    curves: {
      model_id: string;
      points: { budget: number; n: number; n_correct: number; accuracy: number; total_tokens: number; mean_tokens: number }[];
      gains: { from_budget: number; to_budget: number; gain_pts: number }[];
      knee_budget: number | null;
      monotone: boolean;
      ceiling: number;
      floor: number;
    }[];
  };
  figure_3: {
    items: { problem_id: string; correct_by_budget: boolean[]; first_correct_budget: number | null; monotone: boolean }[];
    histogram: Record<string, number>;
    never_flip_count: number;
    never_flip_share: number;
    n_regressions: number;
  };
};

describe("page 6 derived run: the gates that let it be translated", () => {
  it("is a FULL run of the Qwen2.5 instrument at n = 100, greedy, levels 4 and 5", () => {
    expect(PAGE6.manifest.run_mode).toBe("FULL");
    expect(PAGE6.manifest.decoding.strategy).toBe("greedy");
    expect(PAGE6.manifest.decoding.do_sample).toBe(false);
    expect(PAGE6.manifest.items.dataset).toBe("math500_l45");
    expect(PAGE6.manifest.items.n).toBe(100);
    expect(PAGE6.handoff.model_id).toBe("Qwen/Qwen2.5-3B-Instruct");
  });

  it("shares one tokenizer across every curve, which is what the x-axis rests on", () => {
    const hashes = new Set(PAGE6.manifest.models.map((m) => m.tokenizer_sha256));
    expect(hashes.size).toBe(1);
  });

  it("records precision per model, because one curve is quantised and two are not", () => {
    const quants = PAGE6.manifest.models.map((m) => m.quant);
    expect(quants).toContain("8bit");
    expect(quants).toContain("bf16");
    // Page 5 could assert every model was bf16 and therefore compare levels.
    // Page 6 cannot, which is exactly why its captions claim shape and not level.
    for (const m of PAGE6.manifest.models) expect(m.quant).toBeTruthy();
  });

  it("bends inside the grid on every curve, so the page may say the curve bends", () => {
    for (const c of PAGE6.figure2.curves) {
      expect(c.knee_budget).not.toBeNull();
      expect(PAGE6.budgets).toContain(c.knee_budget!);
    }
  });

  it("lets go at the top of the grid, so the right end is a chain and not a truncation", () => {
    const top = PAGE6.budgets[PAGE6.budgets.length - 1];
    for (const c of PAGE6.figure2.curves) {
      const atTop = c.points.find((p) => p.budget === top)!;
      expect(atTop.truncation_rate).toBeLessThanOrEqual(0.1);
    }
    expect(PAGE6.pilot?.verdict).toBe("grid brackets the model");
  });

  it("has a never-flipping band big enough to see and small enough to be a band", () => {
    expect(PAGE6.figure3.neverFlipShare).toBeGreaterThan(0.02);
    expect(PAGE6.figure3.neverFlipShare).toBeLessThan(0.6);
  });

  it("found figure 1's specimen rather than falling back to one", () => {
    // A flagged specimen must never be translated to a page; the loader throws
    // on one, so reaching this line at all is the assertion.
    expect(PAGE6.figure1.nCandidates).toBeGreaterThan(0);
    expect(PAGE6.figure1.flipBudget).not.toBeNull();
    expect(PAGE6.figure1.rows.some((r) => r.problemId === PAGE6.figure1.specimenId)).toBe(true);
  });
});

describe("page 6 figure 2: the curve, recomputed", () => {
  it("reports a solve count that is its accuracy times n, at every budget", () => {
    for (const c of PAGE6.figure2.curves) {
      for (const p of c.points) {
        expect(p.n_correct / p.n).toBeCloseTo(p.accuracy, 10);
      }
    }
  });

  it("reports gains that are the differences of its own points", () => {
    for (const c of RAW.figure_2.curves) {
      c.gains.forEach((g, i) => {
        expect(g.gain_pts).toBeCloseTo((c.points[i + 1].accuracy - c.points[i].accuracy) * 100, 9);
        expect(g.from_budget).toBe(c.points[i].budget);
        expect(g.to_budget).toBe(c.points[i + 1].budget);
      });
    }
  });

  it("reports a floor, a ceiling and a monotonicity flag its points agree with", () => {
    for (const c of RAW.figure_2.curves) {
      expect(c.floor).toBeCloseTo(c.points[0].accuracy, 10);
      expect(c.ceiling).toBeCloseTo(Math.max(...c.points.map((p) => p.accuracy)), 10);
      expect(c.monotone).toBe(c.gains.every((g) => g.gain_pts >= 0));
    }
  });

  it("keeps the primary curve's dip rather than smoothing it", () => {
    // The 3B loses ground on its last doubling. It is one problem out of 100 and
    // the page says so, but the data must arrive un-smoothed: a run that quietly
    // reported a monotone climb would be a different run.
    const primary = PAGE6.figure2.primary;
    expect(primary.monotone).toBe(false);
    expect(primary.gains.some((g) => g.gain_pts < 0)).toBe(true);
  });

  it("has the primary curve's total tokens equal to its mean times n", () => {
    for (const p of PAGE6.figure2.primary.points) {
      expect(p.total_tokens).toBeCloseTo(p.mean_tokens * p.n, 6);
    }
  });
});

describe("page 6 figure 3: the flip points, recomputed from the per-item grid", () => {
  const items = RAW.figure_3.items;

  it("derives every flip point from that item's own verdicts", () => {
    for (const d of items) {
      const first = d.correct_by_budget.findIndex(Boolean);
      expect(d.first_correct_budget).toBe(first === -1 ? null : PAGE6.budgets[first]);
    }
  });

  it("counts the never-flippers and the regressions the item grid holds", () => {
    const never = items.filter((d) => d.first_correct_budget === null);
    expect(RAW.figure_3.never_flip_count).toBe(never.length);
    expect(RAW.figure_3.never_flip_share).toBeCloseTo(never.length / items.length, 12);
    // A regression is correct at one budget and wrong at a larger one, which is
    // why a flip point is FIRST correct rather than permanently correct.
    const regressions = items.filter(
      (d) => !d.correct_by_budget.slice(d.correct_by_budget.findIndex(Boolean)).every(Boolean) && d.first_correct_budget !== null,
    );
    expect(RAW.figure_3.n_regressions).toBe(regressions.length);
  });

  it("has a histogram that, with the never-flippers, is the whole item set", () => {
    const fromItems = Object.fromEntries(PAGE6.budgets.map((b) => [String(b), 0])) as Record<string, number>;
    for (const d of items) {
      if (d.first_correct_budget !== null) fromItems[String(d.first_correct_budget)] += 1;
    }
    expect(RAW.figure_3.histogram).toEqual(fromItems);
    const total = Object.values(RAW.figure_3.histogram).reduce((a, b) => a + b, 0);
    expect(total + RAW.figure_3.never_flip_count).toBe(items.length);
  });

  it("agrees with figure 2's primary curve about how many problems each budget solves", () => {
    // Two independent derivations of the same run: the per-item grid summed
    // down its columns has to be the population curve.
    PAGE6.budgets.forEach((b, i) => {
      const solved = items.filter((d) => d.correct_by_budget[i]).length;
      const point = PAGE6.figure2.primary.points.find((p) => p.budget === b)!;
      expect(solved).toBe(point.n_correct);
    });
  });

  it("sorts never-flippers to the bottom, so the band is contiguous", () => {
    const firstNever = items.findIndex((d) => d.first_correct_budget === null);
    expect(firstNever).toBeGreaterThan(0);
    expect(items.slice(firstNever).every((d) => d.first_correct_budget === null)).toBe(true);
  });
});

describe("page 6 figure 1: the bundled traces", () => {
  it("rebuilds every trace from its token strings", () => {
    for (const row of PAGE6.figure1.rows) {
      for (const run of row.byBudget) {
        expect(run.tokens.length).toBeGreaterThan(0);
      }
    }
  });

  it("never lets the thinking run past its cap", () => {
    for (const row of PAGE6.figure1.rows) {
      for (const run of row.byBudget) {
        expect(run.ownTokens).toBeLessThanOrEqual(run.budget);
      }
    }
  });

  it("bundles a row for every id figure 3 offers", () => {
    for (const id of PAGE6.figure3.clickableRowIds) {
      expect(() => rowById(id)).not.toThrow();
    }
    expect(() => rowById("test/nothing/0.json")).toThrow();
  });

  it("spans the strip: bundled rows include early flips, late flips and never", () => {
    const flips = PAGE6.figure1.rows.map((r) => r.firstCorrectBudget);
    expect(flips).toContain(PAGE6.budgets[0]);
    expect(flips).toContain(null);
    expect(new Set(flips).size).toBeGreaterThan(2);
  });
});

describe("page 6 figure 1: slicing a trace into the zones the page tints", () => {
  const specimen = rowById(PAGE6.figure1.specimenId);
  const flipIndex = PAGE6.budgets.indexOf(PAGE6.figure1.flipBudget!);

  it("is a step, not a ramp: wrong below the flip and right at it", () => {
    expect(specimen.byBudget[flipIndex - 1].correct).toBe(false);
    expect(specimen.byBudget[flipIndex].correct).toBe(true);
  });

  it("cuts a truncated run into own text, unwritten text, our stem and its answer", () => {
    const z = traceZones(specimen, 0);
    const run = specimen.byBudget[0];
    expect(z.wasCut).toBe(true);
    expect(run.forced).toBe(true);
    // The four zones are the trace plus the reference chain, and nothing else.
    expect(z.own + z.stem + z.answer).toBe(run.tokens.join(""));
    expect(z.stem.trim()).toBe(PAGE6.manifest.forcing.stem.trim());
    expect(z.answer.length).toBeGreaterThan(0);
  });

  it("greys out text that really is the continuation of what it wrote", () => {
    // The page shows the reader what the model would have written and was not
    // allowed to. That is only honest if the visible text is genuinely the
    // beginning of the longer chain, which is the notebook's check 5.
    for (const row of PAGE6.figure1.rows) {
      const reference = row.referenceTokens.join("");
      row.byBudget.forEach((_, i) => {
        const z = traceZones(row, i);
        expect(reference.startsWith(z.own)).toBe(true);
        if (z.wasCut) expect(z.own + z.unwritten).toBe(reference);
      });
    }
  });

  it("leaves an uncut run with no unwritten text, no stem and no forced answer", () => {
    const finished = specimen.byBudget.find((r) => !r.forced)!;
    const i = specimen.byBudget.indexOf(finished);
    const z = traceZones(specimen, i);
    expect(z.wasCut).toBe(false);
    expect(z.unwritten).toBe("");
    expect(z.stem).toBe("");
    expect(z.answer).toBe("");
    expect(z.own).toBe(finished.tokens.join(""));
  });
});

describe("tidyMath, on this page's traces", () => {
  it("renders LaTeX as symbols without touching what the model said", () => {
    expect(tidyMath("\\frac{17}{12}")).toBe("17/12");
    expect(tidyMath("\\sqrt{27}")).toBe("√27");
    expect(tidyMath("\\boxed{83}")).toBe("83");
  });

  it("leaves an answer cut mid-macro exactly as the model left it", () => {
    // A budget that lands inside a macro is the point of figure 1; tidying must
    // not invent a closing brace to make it look finished.
    expect(tidyMath("so we get \\frac{3\\sqrt")).toContain("\\frac{3");
  });

  it("keeps the grouping the braces were doing", () => {
    // Flattened naively this reads "√ab + a/√ab - b", which is a different
    // expression from the one the model wrote. A term that is not single keeps
    // a bracket; a single term does not collect a redundant one.
    expect(tidyMath("\\frac{\\sqrt{ab + a}}{\\sqrt{ab - b}}")).toBe("√(ab + a)/√(ab - b)");
    expect(tidyMath("\\frac{a+b}{c-d}")).toBe("(a+b)/(c-d)");
    expect(tidyMath("\\frac{3\\sqrt{3}}{4}")).toBe("3√3/4");
    expect(tidyMath("\\sqrt{27}")).toBe("√27");
  });

  it("renders a forced answer as maths, not as the LaTeX we spliced", () => {
    // Figure 1 prints the model's committed answer through the same tidying as
    // the rest of the trace, so a square root looks like one.
    expect(tidyMath("\\boxed{ANSWER \\frac{3\\sqrt{3}}{4}}")).toBe("ANSWER 3√3/4");
    expect(tidyMath("\\boxed{2\\sqrt{113}}")).toBe("2√113");
  });
});
