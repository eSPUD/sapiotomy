/**
 * Page 7's data-fidelity tests.
 *
 * Two jobs. The first is that the committed run passes the spec's claims contract,
 * so a wrong file in `web/data/` fails here rather than drawing a plausible wrong
 * figure. The second is the cross-language check: TypeScript recomputes what it can
 * from the bundled records and asserts it matches the aggregates the notebook wrote.
 * The full recomputation lives in the notebook's own verification cell, against
 * `traces.jsonl`, which ships as a download rather than in the bundle.
 */
import { describe, expect, it } from "vitest";
import { PAGE7, chainsFor, pLabel } from "./page07";

describe("the run that shipped", () => {
  it("is a FULL run, not a preview", () => {
    expect(PAGE7.manifest.run_mode).not.toBe("QUICK");
    expect(PAGE7.manifest.items.n).toBe(100);
  });

  it("passes every blocking claim", () => {
    for (const gate of [
      "vote_beats_bare_cot",
      "coverage_exceeds_vote",
      "specimen_usable",
      "t0_vote_is_a_noop",
    ]) {
      expect(PAGE7.claims[gate], gate).toBe(true);
    }
  });

  it("describes the same population as pages 5 and 6", () => {
    expect(PAGE7.manifest.items.dataset).toBe("math500_l45");
    expect(PAGE7.manifest.items.seed).toBe(123);
    expect(PAGE7.manifest.items.same_as_page_6).toBe(true);
  });
});

describe("the headline: voting improves on chain of thought", () => {
  const g = PAGE7.figure2.gain;

  it("compares against ONE GREEDY CHAIN, which is what pages 5 and 6 measured", () => {
    // 43% is page 5's `bare` and page 6's top rung on these same items. If this moves,
    // three notebooks have stopped agreeing and the arc is broken.
    expect(g.bare_cot).toBeCloseTo(0.43, 10);
  });

  it("is a real gain, and a resolved one", () => {
    expect(g.vote).toBeCloseTo(0.55, 10);
    expect(g.gain_pts).toBeCloseTo(12, 6);
    expect(g.p).toBeLessThan(0.05);
    expect(g.fixed).toBeGreaterThan(g.broken);
  });

  it("keeps the sampled-chain contrast separate, because it says something else", () => {
    // Against one SAMPLED chain the same vote gains 4 points and does not resolve.
    // The page must not quote this as the headline, and must not hide it either.
    const s = PAGE7.figure2.gainVsOneSample;
    expect(s.pts).toBeLessThan(g.gain_pts);
    expect(s.p).toBeGreaterThan(0.05);
  });

  it("agrees arithmetically with itself", () => {
    expect(g.gain_pts).toBeCloseTo((g.vote - g.bare_cot) * 100, 6);
    expect(g.vote).toBeCloseTo(PAGE7.handoff.plurality_accuracy, 10);
  });
});

describe("figure 2, the pile", () => {
  it("is flat at temperature zero, because N copies of one chain is one chain", () => {
    const ys = PAGE7.figure2.cold.points.map((p) => p.accuracy);
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBeCloseTo(PAGE7.figure2.gain.bare_cot, 10);
  });

  it("climbs with N when the chains differ", () => {
    const pts = PAGE7.figure2.hot.points;
    expect(pts[pts.length - 1].accuracy).toBeGreaterThan(pts[0].accuracy);
  });

  it("never reports coverage below the vote", () => {
    for (const line of [PAGE7.figure2.hot, PAGE7.figure2.cold]) {
      for (const p of line.points) expect(p.coverage).toBeGreaterThanOrEqual(p.accuracy - 1e-9);
    }
  });

  it("widens the gap the next page lives in as N grows", () => {
    const pts = PAGE7.figure2.hot.points;
    const first = pts[0].coverage - pts[0].accuracy;
    const last = pts[pts.length - 1].coverage - pts[pts.length - 1].accuracy;
    expect(last).toBeGreaterThan(first);
  });
});

describe("figure 2, the split", () => {
  it("records that splitting a fixed budget did NOT pay, which the page must say", () => {
    expect(PAGE7.claims.splitting_a_fixed_budget_pays).toBe(false);
    expect(PAGE7.figure2.bestSplitN).toBe(1);
  });

  it("tracks page 6's greedy curve, because it is the same procedure", () => {
    const overlap = PAGE7.figure2.split.filter((s) => s.page_06_greedy !== null);
    expect(overlap.length).toBeGreaterThan(1);
    for (const s of overlap) {
      // Same model, same items, same caps: sampled and greedy should not be far apart.
      expect(Math.abs(s.plurality_accuracy - (s.page_06_greedy as number))).toBeLessThan(0.12);
    }
  });
});

describe("diversity is measured, not asserted", () => {
  it("has one answer at temperature zero and more as it warms", () => {
    const d = [...PAGE7.figure2.diversity].sort((a, b) => a.temperature - b.temperature);
    expect(d[0].temperature).toBe(0);
    expect(d[0].mean_distinct).toBeCloseTo(1, 6);
    expect(d[0].mean_entropy).toBeCloseTo(0, 6);
    expect(d[d.length - 1].mean_distinct).toBeGreaterThan(d[0].mean_distinct);
  });

  it("does not let the reader mistake its item count for the pile's", () => {
    // The diversity readout is a count of answers on 30 items, not an accuracy on 100.
    for (const d of PAGE7.figure2.diversity) expect(d.n_items).toBeLessThan(PAGE7.manifest.items.n);
  });
});

describe("figure 1's specimen", () => {
  const s = PAGE7.figure1.specimen;

  it("was curated from the sweep, not fallen back to", () => {
    expect(PAGE7.figure1.specimen_is_fallback).toBe(false);
    expect(PAGE7.figure1.n_candidates).toBeGreaterThan(1);
  });

  it("shows the mechanism the page claims: a spike the vote gets right", () => {
    expect(s.plurality_correct).toBe(true);
    expect(s.tie).toBe(false);
    expect(s.distinct_answers).toBeGreaterThanOrEqual(3);
  });

  it("recomputes: the ranked tally IS the chains it ships", () => {
    const counted = new Map<string, number>();
    for (const c of s.chains) {
      const k = c.extracted_answer;
      counted.set(k, (counted.get(k) ?? 0) + 1);
    }
    for (const row of s.ranked) {
      expect(counted.get(row.answer), `votes for ${row.answer}`).toBe(row.votes);
    }
    const votes = s.ranked.reduce((t, r) => t + r.votes, 0);
    expect(votes).toBeLessThanOrEqual(s.chains.length);
  });

  it("recomputes: the winner is the row with the most votes", () => {
    const top = [...s.ranked].sort((a, b) => b.votes - a.votes)[0];
    expect(s.plurality_answer).toBe(top.answer);
    expect(top.correct).toBe(true);
  });

  it("can open a bar and find the chains behind it", () => {
    const top = s.ranked[0];
    expect(chainsFor(s, top.answer)).toHaveLength(top.votes);
  });

  it("ships every bundled problem with chains attached", () => {
    for (const p of PAGE7.figure1.problems) {
      expect(p.chains.length, p.problem_id).toBeGreaterThan(1);
      expect(p.question.length).toBeGreaterThan(0);
    }
  });
});

describe("the handoff to page 8", () => {
  it("is coverage minus the vote", () => {
    const h = PAGE7.handoff;
    expect(h.thrown_away).toBeCloseTo(h.coverage - h.plurality_accuracy, 10);
    expect(h.thrown_away).toBeGreaterThan(0.05);
  });

  it("names the pile page 8 reads", () => {
    expect(PAGE7.pool.config_id).toBe(PAGE7.figure1.config_id);
    expect(PAGE7.pool.n_chains).toBe(PAGE7.figure1.n_chains);
  });
});

describe("pLabel", () => {
  it("does not round a significant p to zero", () => {
    expect(pLabel(0.0075)).toBe("p = 0.0075");
    expect(pLabel(0.0001)).toBe("p < 0.001");
    expect(pLabel(0.39)).toBe("p = 0.390");
  });
});
