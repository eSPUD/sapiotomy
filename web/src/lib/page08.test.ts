/**
 * Page 8's data module is mostly assertions that run at import, so the first
 * thing this file proves is that importing it does not throw: the committed
 * run passes the notebook's blocking claims and its own arithmetic.
 *
 * The rest re-derives, in TypeScript, numbers the notebook computed in Python.
 * That is the cross-language check the pipeline asks for (notebooks/README.md):
 * if a translation bug or a stale paste puts a different run in `web/data/`,
 * these fail rather than the page drawing a plausible wrong figure.
 */
import { describe, expect, it } from "vitest";
import { PAGE8, pValue, pct } from "./page08";

describe("page 8's committed run", () => {
  it("passes the notebook's blocking claims", () => {
    expect(PAGE8.claims.verifier_scored).toBe(true);
    expect(PAGE8.claims.best_of_n_beats_one_chain_resolved).toBe(true);
    expect(PAGE8.claims.agrees_with_page_7).toBe(true);
  });

  it("does not claim to beat counting, because the run does not", () => {
    // The page's caveat is load-bearing: if a later run flips this, the copy
    // on the page is wrong and this test is where that surfaces.
    expect(PAGE8.claims.best_of_n_beats_counting_resolved).toBe(false);
    expect(PAGE8.caveat.p).toBeGreaterThan(0.05);
  });

  it("has a headline resolved by the paired test", () => {
    expect(PAGE8.headline.p).toBeLessThan(0.05);
    expect(PAGE8.headline.fixed).toBeGreaterThan(PAGE8.headline.broke);
    expect(PAGE8.headline.resolved).toBe(true);
  });
});

describe("the paired counts and the ladder agree", () => {
  it("reconstructs every accuracy from fixed minus broke", () => {
    for (const r of PAGE8.paired.vsOneChain) {
      if (r.selector === "one chain") continue;
      expect(r.accuracy).toBeCloseTo(PAGE8.oneChain + r.net / PAGE8.paired.items, 9);
    }
  });

  it("counts fixed and broke over items that exist", () => {
    for (const r of PAGE8.paired.vsOneChain) {
      expect(r.fixed + r.broke).toBeLessThanOrEqual(PAGE8.paired.items);
    }
  });
});

describe("the specimen the page draws", () => {
  const s = PAGE8.specimen;

  it("is a batch where counting loses and selection wins", () => {
    expect(s.vote.correct).toBe(false);
    expect(s.verifier.correct).toBe(true);
  });

  it("bundles every candidate the panel plots", () => {
    expect(s.candidates).toHaveLength(s.n);
    for (const c of s.candidates) expect(c.trace.length).toBeGreaterThan(0);
  });

  it("rings the highest-scoring chain", () => {
    const best = s.candidates.reduce((a, b) =>
      (b.score ?? -Infinity) > (a.score ?? -Infinity) ? b : a,
    );
    expect(best.sample_index).toBe(s.verifier.sample_index);
  });

  it("has a wrong answer that most chains agreed on", () => {
    const wrong = s.candidates.filter((c) => !c.correct).length;
    expect(s.vote.votes).toBeGreaterThan(s.n / 2);
    expect(wrong).toBeGreaterThan(0);
  });
});

describe("the judge ladder", () => {
  it("includes a trained verifier with no solve rate", () => {
    const trained = PAGE8.judges.filter((j) => j.trained);
    expect(trained).toHaveLength(1);
    expect(trained[0].solves).toBeNull();
  });

  it("puts the trained verifier above every generator-judge on the mean", () => {
    const trained = PAGE8.judges.find((j) => j.trained)!;
    for (const j of PAGE8.judges) {
      if (j.trained) continue;
      expect(trained.mean).toBeGreaterThan(j.mean);
    }
  });

  it("shows solving ability failing to predict judging", () => {
    // The page says capability does not buy reliability. The check is that the
    // best solver is NOT the best judge among the models that can solve at all.
    const solvers = PAGE8.judges.filter((j) => j.solves !== null);
    const bestSolver = solvers.reduce((a, b) => (b.solves! > a.solves! ? b : a));
    const bestJudge = solvers.reduce((a, b) => (b.mean > a.mean ? b : a));
    expect(bestSolver.name).not.toBe(bestJudge.name);
  });

  it("spans every temperature, so no claim rests on one column", () => {
    for (const j of PAGE8.judges) {
      expect(j.hi).toBeGreaterThanOrEqual(j.mean);
      expect(j.lo).toBeLessThanOrEqual(j.mean);
    }
    expect(PAGE8.bar.per_config && Object.keys(PAGE8.bar.per_config).length).toBeGreaterThan(1);
  });
});

describe("formatting", () => {
  it("quotes small p-values as a bound rather than a rounded zero", () => {
    expect(pValue(0.0009)).toBe("p < 0.001");
    expect(pValue(0.4545)).toBe("p = 0.455");
  });

  it("formats shares as percentages", () => {
    expect(pct(0.6)).toBe("60%");
    expect(pct(0.605, 1)).toBe("60.5%");
  });
});
