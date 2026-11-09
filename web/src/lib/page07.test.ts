/**
 * Page 7's data-fidelity tests.
 *
 * Two jobs. The first is that the committed run is the one the page describes (100 problems,
 * 12 temperatures, 16 chains each), so a wrong file in `web/data/` fails here rather than
 * drawing a plausible wrong figure. The second is the cross-language check: TypeScript
 * recomputes what it can from the bundled records and asserts it matches the aggregates the
 * builder wrote. The full recomputation, against every chain, is `notebooks/page_7_site_data.py`,
 * which reads the notebook's saved chains and ships as part of the repo.
 */
import { describe, expect, it } from "vitest";
import { PAGE7, chainsFor, pLabel } from "./page07";

const SWEEP = PAGE7.sweep;
const line = (t: number) => SWEEP.curves[t.toFixed(1)];
const SAMPLED = SWEEP.temperatures.filter((t) => t > 0);
const GREEDY = line(0)[0].accuracy;

describe("the run that shipped", () => {
  it("is the sweep the page describes: 100 problems, 16 chains, 0.0 to 1.1", () => {
    expect(PAGE7.run.n_problems).toBe(100);
    expect(SWEEP.n_chains).toBe(16);
    expect(SWEEP.chain_cap).toBe(2048);
    expect(SWEEP.temperatures).toHaveLength(12);
    SWEEP.temperatures.forEach((t, j) => expect(t).toBeCloseTo(j / 10, 9));
    expect(SWEEP.n_axis).toEqual([1, 2, 4, 8, 16]);
  });

  // The notebook's own grid runs to 1.2; the author dropped it from the page.
  it("has no 1.2", () => {
    expect(SWEEP.temperatures).not.toContain(1.2);
    expect(SWEEP.curves["1.2"]).toBeUndefined();
  });

  it("draws the 100 problems across all five levels, in the 500's proportions", () => {
    const levels = Object.values(PAGE7.run.levels);
    expect(levels.reduce((a, b) => a + b, 0)).toBe(100);
    expect(Object.keys(PAGE7.run.levels)).toEqual(["1", "2", "3", "4", "5"]);
    // MATH-500 has 43, 90, 105, 128 and 134 problems at levels 1 to 5.
    expect(levels).toEqual([9, 18, 21, 26, 26]);
  });

  it("records the model and the precision the page prints", () => {
    expect(PAGE7.primary.label).toBe("Qwen2.5-3B-Instruct");
    expect(PAGE7.primary.precision).toBe("bf16");
  });
});

describe("the sweep", () => {
  it("is flat at temperature zero, because N copies of one chain is one chain", () => {
    const ys = line(0).map((p) => p.accuracy);
    expect(new Set(ys).size).toBe(1);
    expect(PAGE7.figure2.cold.points).toBe(line(0));
    expect(line(0).every((p) => p.tie_rate === 0)).toBe(true);
  });

  it("names the best temperature: most problems right, the lower one on a tie", () => {
    const top = Math.max(...SWEEP.summary.map((d) => d.vote_accuracy));
    const first = SWEEP.summary.find((d) => Math.abs(d.vote_accuracy - top) < 1e-9)!;
    expect(SWEEP.best_temperature).toBe(first.temperature);
    expect(PAGE7.figure2.hot.points).toBe(line(SWEEP.best_temperature));
  });

  it("has the vote at 16 chains beat one greedy chain at every sampled temperature", () => {
    for (const t of SAMPLED) {
      const top = line(t)[line(t).length - 1];
      expect(top.n).toBe(16);
      expect(top.accuracy, `T = ${t}`).toBeGreaterThan(GREEDY);
    }
  });

  it("dips at N = 2, where a disagreement is a tie and a tie is not a vote", () => {
    for (const t of SAMPLED) {
      const [one, two] = line(t);
      expect(two.n).toBe(2);
      expect(two.tie_rate, `T = ${t}`).toBeGreaterThan(0.1);
      expect(two.accuracy, `T = ${t}`).toBeLessThan(one.accuracy);
    }
  });

  it("is below greedy only where two chains vote", () => {
    for (const t of SAMPLED) {
      for (const p of line(t).filter((q) => q.n >= 2 && q.accuracy < GREEDY)) {
        expect(p.n, `T = ${t}`).toBe(2);
      }
    }
  });

  it("never reports coverage below the vote", () => {
    for (const t of SWEEP.temperatures) {
      for (const p of line(t)) expect(p.coverage).toBeGreaterThanOrEqual(p.accuracy - 1e-9);
    }
  });

  it("widens the gap page 8 lives in as N grows", () => {
    const pts = PAGE7.figure2.hot.points;
    const first = pts[0].coverage - pts[0].accuracy;
    const last = pts[pts.length - 1].coverage - pts[pts.length - 1].accuracy;
    expect(last).toBeGreaterThan(first);
  });

  // The N-chain means are averages over random subsets of the 16, so they track N times one
  // chain closely but not exactly.
  it("writes about N times the tokens for N chains", () => {
    const one = line(SWEEP.best_temperature)[0].mean_tokens;
    for (const p of line(SWEEP.best_temperature)) {
      expect(Math.abs(p.mean_tokens / (one * p.n) - 1)).toBeLessThan(0.02);
    }
  });
});

describe("diversity is measured, not asserted", () => {
  const byT = [...SWEEP.summary].sort((a, b) => a.temperature - b.temperature);

  // A greedy chain cut off at the cap has no answer, so the mean can sit just under one.
  it("has one answer at temperature zero and more as it warms", () => {
    expect(byT[0].temperature).toBe(0);
    expect(byT[0].mean_distinct).toBeLessThanOrEqual(1);
    expect(byT[0].mean_distinct).toBeGreaterThan(0.9);
    expect(byT[byT.length - 1].mean_distinct).toBeGreaterThan(byT[1].mean_distinct);
    expect(byT[byT.length - 1].mean_distinct).toBeGreaterThan(3);
  });

  it("counts the same 100 problems at every temperature", () => {
    for (const d of byT) expect(d.n_problems).toBe(100);
  });
});

describe("figure 1's two problems", () => {
  const [right, tie] = PAGE7.figure1.showcase;

  it("are the vote right, then the vote tied", () => {
    expect(right.outcome).toBe("right");
    expect(tie.outcome).toBe("tie");
    expect(right.problem.plurality_correct).toBe(true);
    expect(right.problem.tie).toBe(false);
    expect(tie.problem.tie).toBe(true);
    expect(tie.problem.any_correct).toBe(true);
  });

  // Drawn at random from a pool, not picked: the file says what the pool was.
  it("were drawn from a stated pool, not picked", () => {
    expect(PAGE7.figure1.showcaseRule).toMatch(/drawn at random/);
    for (const pick of PAGE7.figure1.showcase) expect(pick.pool_size).toBeGreaterThan(1);
  });

  it("show the best temperature's chains", () => {
    for (const { problem } of PAGE7.figure1.showcase) {
      expect(problem.temperature).toBe(SWEEP.best_temperature);
      expect(problem.chain_cap).toBe(2048);
    }
    expect(right.problem.distinct_answers).toBeGreaterThanOrEqual(3);
  });

  it("recomputes: each ranked tally IS the chains it ships", () => {
    for (const { problem } of PAGE7.figure1.showcase) {
      for (const row of problem.ranked) {
        expect(chainsFor(problem, row.answer), `votes for ${row.answer}`).toHaveLength(row.votes);
      }
      const votes = problem.ranked.reduce((t, r) => t + r.votes, 0);
      const silent = problem.chains.filter((c) => c.vote_key === null).length;
      expect(votes + silent).toBe(problem.chains.length);
      expect(problem.no_answer_rate).toBeCloseTo(silent / problem.chains.length, 10);
    }
  });

  it("recomputes: the vote returns the row with the most votes, and ties return nothing", () => {
    const top = right.problem.ranked[0];
    expect(right.problem.plurality_answer).toBe(top.answer);
    expect(top.correct).toBe(true);
    const [a, b] = tie.problem.ranked;
    expect(a.votes).toBe(b.votes);
    expect(tie.problem.plurality_answer).toBeNull();
  });

  // A chain that hits the cap just stops: no forced answer, so it casts no vote.
  it("lets a chain that hit the cap stop without an answer", () => {
    for (const { problem } of PAGE7.figure1.showcase) {
      for (const c of problem.chains) {
        expect(c.own_tokens).toBeLessThanOrEqual(2048);
        expect(c.truncated).toBe(c.own_tokens >= 2048);
        if (c.vote_key === null) expect(c.extracted_answer).toBe("");
      }
    }
  });

  it("ships the same problem's greedy chain for section 4", () => {
    for (const { greedy } of PAGE7.figure1.showcase) {
      expect(greedy.own_tokens).toBeGreaterThan(0);
      expect(greedy.own_tokens).toBeLessThanOrEqual(2048);
    }
  });
});

describe("the handoff to page 8", () => {
  it("is coverage minus the vote, at the best temperature", () => {
    const h = PAGE7.handoff;
    expect(h.temperature).toBe(SWEEP.best_temperature);
    expect(h.thrown_away).toBeCloseTo(h.coverage - h.plurality_accuracy, 10);
    expect(h.thrown_away).toBeGreaterThan(0.05);
    expect(h.n_chains).toBe(16);
    expect(h.n_items).toBe(100);
  });
});

describe("pLabel", () => {
  it("does not round a significant p to zero", () => {
    expect(pLabel(0.0075)).toBe("p = 0.0075");
    expect(pLabel(0.0001)).toBe("p < 0.001");
    expect(pLabel(0.39)).toBe("p = 0.390");
  });
});
