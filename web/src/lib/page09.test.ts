/**
 * The cross-language check for page 9.
 *
 * `page09.ts` throws on load if the committed run fails a blocking claim, so the
 * import itself is the first assertion: these tests only run at all because
 * `web/data/page-09-derived.json` passed the notebook's gates. What is left to
 * check here is the arithmetic between the fields, which is what would break if
 * someone pasted a different run into `web/data/` or edited a number by hand.
 *
 * The specimen assertions matter more than they look. The page's whole argument
 * is the contrast between three roles, and a role that is not what it claims to
 * be would teach the opposite lesson with full confidence.
 */
import { describe, expect, it } from "vitest";
import { PAGE9, checkLabel } from "./page09";

describe("page 9's measured run", () => {
  it("loads a run that passed every blocking claim", () => {
    for (const claim of [
      "same_population_as_page_7",
      "every_chain_ended_itself",
      "detection_measurable",
      "localisation_has_a_population",
      "specimens_complete",
    ]) {
      expect(PAGE9.claims[claim]).toBe(true);
    }
  });

  it("grades only chains the model ended itself", () => {
    expect(PAGE9.filter.kept).toBe(PAGE9.run.chains);
    expect(PAGE9.filter.kept).toBeGreaterThan(0);
  });

  it("counts fewer contaminated chains than correct ones", () => {
    expect(PAGE9.detection.nContaminated).toBeLessThanOrEqual(PAGE9.detection.nRightChains);
    expect(PAGE9.detection.rate).toBeCloseTo(
      PAGE9.detection.nContaminated / PAGE9.detection.nRightChains,
      10,
    );
  });

  it("spreads the contaminated chains over no more problems than it has chains", () => {
    expect(PAGE9.detection.nProblems).toBeLessThanOrEqual(PAGE9.detection.nContaminated);
    expect(PAGE9.detection.nProblems).toBeLessThanOrEqual(
      PAGE9.detection.nProblemsWithARightChain,
    );
  });

  it("localises inside the population of wrong chains", () => {
    expect(PAGE9.localisation.nLocalisable).toBeLessThanOrEqual(PAGE9.localisation.nWrong);
    expect(PAGE9.localisation.nLocalisable).toBeGreaterThan(0);
    const share = PAGE9.localisation.medianShareSound ?? -1;
    expect(share).toBeGreaterThanOrEqual(0);
    expect(share).toBeLessThan(1);
  });

  it("carries the segmentation spread, because the median may not be quoted alone", () => {
    // The notebook's claim came back false on the shipped run. If a future run
    // makes it true the page drops the caveat, but it may never be missing while
    // the claim is false.
    if (!PAGE9.localisation.survivesSegmentation) {
      expect(PAGE9.localisation.spreadPts).not.toBeNull();
      expect(PAGE9.localisation.spreadPts!).toBeGreaterThan(0);
    }
  });

  it("tallies every step into exactly one label", () => {
    expect(PAGE9.graders.stepsJudged).toBeLessThanOrEqual(PAGE9.graders.stepsTotal);
    expect(PAGE9.graders.shareUnjudged).toBeGreaterThan(0);
    expect(PAGE9.graders.shareUnjudged).toBeLessThanOrEqual(1);
  });

  it("reports the selector rung honestly", () => {
    if (PAGE9.selection && !PAGE9.selection.helps) {
      // A null is allowed to ship; a null dressed as a gain is not.
      const delta =
        (PAGE9.selection.filtered - PAGE9.selection.majority) * 100;
      expect(delta).toBeCloseTo(PAGE9.selection.deltaPts, 6);
    }
  });
});

describe("page 9's three specimens", () => {
  it("gives the lucky role a right answer and a false step", () => {
    expect(PAGE9.lucky.outcomeCorrect).toBe(true);
    expect(PAGE9.lucky.nFalse).toBeGreaterThan(0);
  });

  it("gives the broken role a wrong answer and a findable break", () => {
    expect(PAGE9.broken.outcomeCorrect).toBe(false);
    expect(PAGE9.broken.firstFalse).not.toBeNull();
    expect(PAGE9.broken.firstFalse!).toBeLessThan(PAGE9.broken.steps.length);
  });

  it("gives the clean role a right answer and nothing false", () => {
    expect(PAGE9.clean.outcomeCorrect).toBe(true);
    expect(PAGE9.clean.nFalse).toBe(0);
  });

  it("counts each specimen's false steps the way its steps are labelled", () => {
    for (const sp of [PAGE9.lucky, PAGE9.broken, PAGE9.clean]) {
      expect(sp.steps.filter((s) => s.check === "false").length).toBe(sp.nFalse);
      expect(sp.steps.length).toBeGreaterThan(1);
    }
  });

  it("points every judged step at the claim that was judged", () => {
    // The reveal shows the claim, not the step. A judged step with no claim would
    // leave the page highlighting words that were never checked.
    for (const sp of [PAGE9.lucky, PAGE9.broken, PAGE9.clean]) {
      for (const step of sp.steps) {
        if (step.check !== "unknown") expect(step.claim).toBeTruthy();
      }
    }
  });

  it("puts the break where the share-sound figure says it is", () => {
    const sp = PAGE9.broken;
    expect(sp.shareSound).toBeCloseTo(sp.firstFalse! / sp.steps.length, 10);
  });

  it("never ships a PRM score the run refused to publish", () => {
    const published = PAGE9.graders.prm !== null;
    const anyScore = [PAGE9.lucky, PAGE9.broken, PAGE9.clean].some((sp) =>
      sp.steps.some((s) => s.prm !== null),
    );
    if (!published) expect(anyScore).toBe(false);
  });
});

describe("checkLabel", () => {
  it("words all three labels, including the refusal", () => {
    expect(checkLabel("true")).toBe("checked");
    expect(checkLabel("false")).toBe("false");
    expect(checkLabel("unknown")).toBe("not checkable");
  });
});
