/**
 * The cross-language check for page 15 (page 17 until the 2026-08-10 cut; the
 * run keeps the old number, see `page17.ts`).
 *
 * `page17.ts` throws on load if the committed run fails a blocking claim, so the
 * import itself is the first assertion: these tests only run at all because
 * `web/data/page-17-derived.json` passed the notebook's gates and page 9's
 * loader passed its own. What is left is the arithmetic between the fields, plus
 * one duty this page has that the others do not.
 *
 * That duty: page 17's step 2 is a specimen, and a specimen oversells unless the
 * controls that cut it down travel with it. Four of the notebook's claims are
 * FALSE on the shipped run and the page is built to print all four. The tests
 * below pin them false on purpose. If a future run flips one, these fail, and
 * that is the point: it is a finding that needs new copy, not a green suite.
 */
import { describe, expect, it } from "vitest";
import { PAGE17 } from "./page17";

describe("page 17's measured material", () => {
  it("loads a run that earned the phrase 'the same hundred problems'", () => {
    expect(PAGE17.run.items).toBe(100);
    expect(PAGE17.run.decoding).toBe("greedy");
    expect(PAGE17.run.family).toContain(PAGE17.run.primary);
    // Every upstream run is named, so the provenance line cannot claim a source it
    // never opened.
    expect(Object.keys(PAGE17.run.sources).sort()).toEqual(["5", "6", "7", "8", "9"]);
  });

  it("knows page 8 shares the problems but not the chains", () => {
    // Upstream `same_candidates` is false: page 8 generated its own pool. The page may
    // write "the same problems" of it and may not write "the same chains".
    expect(PAGE17.run.page08SharesChains).toBe(false);
  });

  it("generates nothing of its own", () => {
    expect(PAGE17.run.mode).toBe("REPLAY");
    expect(PAGE17.run.generates).toMatch(/re-aggregation/i);
  });

  describe("step 2, what the climbing curve netted out", () => {
    it("loses answers on every rung of the primary's ladder", () => {
      expect(PAGE17.ledger.everyRungLoses).toBe(true);
      for (const rung of PAGE17.ledger.primary) {
        expect(rung.lost).toBeGreaterThan(0);
        expect(rung.net).toBe(rung.gained - rung.lost);
      }
    });

    it("gains nothing on the top rung, and can say why", () => {
      expect(PAGE17.ledger.topRungGainsNothing).toBe(true);
      // The reason is the axis, not the model: under greedy decoding a chain that has
      // stopped itself is not regenerated at a larger budget. Without this the flat top
      // reads as a measured plateau.
      expect(PAGE17.axisBound.shareSelfTerminated).toBeGreaterThan(0.9);
      expect(PAGE17.axisBound.meanOwnTokens).toBeLessThan(PAGE17.axisBound.maxBudget);
    });

    it("keeps regressions and rescued items as different counts", () => {
      // They differ (the 7B has 4 and 2) and the page talks about the second, so a
      // loader that quietly aliased them would let copy swap the two names.
      expect(PAGE17.affected.definitions.regression).not.toBe(
        PAGE17.affected.definitions.rescued,
      );
      for (const row of PAGE17.affected.byModel) {
        expect(row.rescued).toBeLessThanOrEqual(row.regressions);
      }
    });

    it("makes exactly one aggregate claim: the count falls with capability", () => {
      expect(PAGE17.affected.fallsWithCapability).toBe(true);
      const counts = PAGE17.affected.counts;
      expect(counts).toEqual([...counts].sort((a, b) => b - a));
      expect(counts[0]).toBeGreaterThan(counts[counts.length - 1]);
    });

    it("carries a specimen that is right at several cuts and wrong at its own ending", () => {
      const s = PAGE17.specimen;
      expect(s.rightWhenCutAt.length).toBeGreaterThanOrEqual(2);
      expect(s.byBudget[s.byBudget.length - 1].correct).toBe(false);
      // Its ending must be the model's own. A capped ending would make this page 6's
      // truncation finding wearing page 17's clothes.
      expect(s.byBudget[s.byBudget.length - 1].truncated).toBe(false);
      expect(s.naturalLength).toBeLessThan(PAGE17.axisBound.maxBudget);
      expect(s.byBudget).toHaveLength(PAGE17.run.budgets.length);
      for (const b of s.byBudget) expect(b.trace.length).toBeGreaterThan(0);
    });

    it("breaks on every checkpoint, which is why this specimen and not another", () => {
      expect(PAGE17.specimen.alsoRegressesOn).toHaveLength(PAGE17.run.family.length - 1);
    });
  });

  describe("step 2's three controls, all of which cut the specimen down", () => {
    it("shows the rescues had concluded nothing when they were cut", () => {
      const c = PAGE17.controls.concludedWhenCut;
      expect(c.cameFromFinishedReasoning).toBe(false);
      expect(c.withAConclusion).toBe(0);
      expect(c.cases).toBeGreaterThan(0);
      // The base rates are what make that zero readable rather than surprising.
      expect(c.boxedWhenFinished).toBeGreaterThan(0.9);
      expect(c.boxedWhenCut).toBeLessThan(0.05);
    });

    it("shows the model did not simply already know the answers", () => {
      const c = PAGE17.controls.blurtArm;
      expect(c.blurtRight).toBeGreaterThan(0);
      expect(c.blurtRight).toBeLessThan(c.items);
    });

    it("shows stopping early is not a strategy", () => {
      const c = PAGE17.controls.isItARule;
      expect(c.stoppingEarlyIsAStrategy).toBe(false);
      expect(c.fixedCutAccuracy).toBeLessThan(c.natural);
    });

    it("shows cut points buy no more coverage per token than resampling", () => {
      const c = PAGE17.controls.isItARule;
      expect(c.cutPointsBeatResampling).toBe(false);
      expect(c.oracle).toBeLessThanOrEqual(c.samplingCoverage + 0.005);
      // Both bracketing points ship, so the page can show what it interpolated between
      // rather than asking the reader to trust a single derived number.
      expect(c.bracket).toHaveLength(2);
      expect(c.bracket[0].mean_tokens).toBeLessThanOrEqual(c.oracleTokenCost);
      expect(c.bracket[1].mean_tokens).toBeGreaterThan(c.oracleTokenCost);
    });
  });

  it("keeps the deleted authored claim reachable as a stated null", () => {
    // Page 17's old figure asserted easy problems break sooner. Pooled over all three
    // checkpoints the medians are identical, so the page states the null rather than
    // going quiet about a claim it used to make.
    expect(PAGE17.levelNull.easyBreaksSooner).toBe(false);
    expect(PAGE17.levelNull.pooledEvents).toBeGreaterThan(0);
    const medians = PAGE17.levelNull.byLevel.map((l) => l.median_lost_at);
    expect(new Set(medians).size).toBe(1);
  });

  describe("step 3, reliability is a coordinate rather than a property", () => {
    it("sweeps temperature at one candidate depth", () => {
      // Reliability decays with N too, so a mixed-depth figure would smuggle that decay
      // into a comparison the caption attributes to temperature.
      expect(PAGE17.reliability.depth).toBeGreaterThan(0);
      expect(PAGE17.reliability.temperatures.length).toBeGreaterThanOrEqual(3);
      const t = PAGE17.reliability.temperatures;
      expect(t).toEqual([...t].sort((a, b) => a - b));
    });

    it("has every model-as-judge decay faster than the trained one", () => {
      const trained = PAGE17.reliability.trained;
      for (const line of PAGE17.reliability.lines) {
        if (line.trained) continue;
        expect(line.fallPts).toBeGreaterThan(trained.fallPts);
      }
      // The crossing is the claim, so the figure must not be readable at one column.
      expect(PAGE17.reliability.steepest.fallPts).toBeGreaterThan(10);
    });

    it("reports the share of the chain no checker can read", () => {
      expect(PAGE17.readable.shareUnjudged).toBeGreaterThan(0.9);
      expect(PAGE17.readable.stepsJudged).toBeLessThan(PAGE17.readable.stepsTotal);
      // The PRM's quality figures were computed inside the readable sliver, which is the
      // whole point of putting them next to each other.
      expect(PAGE17.readable.prm).not.toBeNull();
    });
  });

  it("measures trace length as an anti-signal, and says what it beats", () => {
    expect(PAGE17.length.auc).toBeLessThan(0.5);
    expect(PAGE17.length.inverted).toBeCloseTo(1 - PAGE17.length.auc, 10);
    expect(PAGE17.length.beats.length).toBeGreaterThan(0);
    for (const j of PAGE17.length.beats) {
      expect(j.auc).toBeLessThan(PAGE17.length.inverted);
    }
  });
});
