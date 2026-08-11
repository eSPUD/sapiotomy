import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_NULL,
  BAND_KEYS,
  CROSSING,
  FORCED,
  ITEM_COUNT,
  JUDGES,
  LADDER,
  OTHER_AXIS,
  QUIZ,
  pct,
} from "./page16";
import { PAGE5 } from "./page05";
import { PAGE6 } from "./page06";
import { PAGE7 } from "./page07";
import { PAGE8 } from "./page08";
import { PAGE9 } from "./page09";
import { WAIT_TABLE } from "./page06";
import { PAGE11 } from "./page11";
import { curves } from "./curves";
import { PAGES } from "./pages";

/**
 * Page 16 is a wrap-up, which makes it the one page that can contradict the
 * rest of the deck. Every number on it was measured by an earlier page, so the
 * failure mode is not a bad number, it is a stale one: a re-run moves page 8's
 * headline and page 16 goes on printing what page 8 used to say. These tests
 * exist to make that a red suite rather than a quiet inconsistency on the last
 * page a reader sees.
 *
 * The quiz has its own failure mode, and it is worse than being wrong. A
 * distractor that happens to be true, or two options that say the same thing in
 * different words, teaches the reader the opposite of the lesson while looking
 * exactly like a working question. The structural checks below are cheap and
 * they are the only thing standing between an authoring slip and that.
 */

describe("page 16's ladder", () => {
  const at = (frag: string) => {
    const hits = LADDER.filter((r) => r.label.includes(frag));
    expect(hits, `"${frag}" matches ${hits.length} rungs`).toHaveLength(1);
    return hits[0];
  };

  it("reads its rungs out of the pages that measured them, never a copy", () => {
    expect(at("no chain at all").accuracy).toBe(PAGE5.figure2.blurt.accuracy);
    expect(at("one chain of thought, greedy").accuracy).toBe(PAGE5.figure2.bare.accuracy);
    expect(at("temperature zero").accuracy).toBe(
      PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    );
    expect(at("at least one of the").accuracy).toBe(PAGE8.coverage);
    expect(at("filtered by step soundness").accuracy).toBe(PAGE9.selection!.filtered);
    expect(at("one greedy chain").accuracy).toBe(PAGE11.bands.hard.target.accuracy);
  });

  it("puts forcing more thinking on the chart, and lets it come out flat", () => {
    // Page 6's wait arm is the deck's one measurement of making a model that
    // has finished carry on. It is a null and the chart must show it as one:
    // a band that only climbs would be an advert rather than a summary.
    const forced = at("forced to keep thinking");
    expect(forced.page).toBe(6);
    expect(forced.accuracy).toBeCloseTo(WAIT_TABLE!.after / WAIT_TABLE!.table.n, 5);
    expect(forced.accuracy).toBeLessThanOrEqual(at("one chain of thought, greedy").accuracy);
    expect(forced.note).toMatch(/times the tokens/);
  });

  it("pairs the wait arm to the chain directly above it", () => {
    // The arm's "before" IS the rung above it, which is what lets a reader read
    // the step between two adjacent bars as a result. page16.ts throws on load
    // if that stops being true, because then it is two runs and not one step.
    expect(FORCED.before).toBe(at("one chain of thought, greedy").accuracy);
    expect(FORCED.turnedRight).toBeLessThan(FORCED.turnedWrong);
    expect(FORCED.tokenMultiple).toBeGreaterThan(1);
  });

  it("bookends the first band with page 5's own paired contrast", () => {
    // The blurt arm and the full chain are one paired result on one run, and
    // page 6's cuts sit between them as the climb. Citing the full chain to
    // page 6 would split a pair across two pages for no reason.
    expect(at("no chain at all").page).toBe(5);
    expect(at("one chain of thought, greedy").page).toBe(5);
  });

  it("keeps page 5's baseline and page 6's top rung agreeing", () => {
    // They are the same measurement made twice. The band only reads as one
    // climb while they match, and page16.ts throws on load if they stop.
    expect(PAGE5.figure2.bare.accuracy).toBe(
      PAGE6.figure2.primary.points[PAGE6.figure2.primary.points.length - 1].accuracy,
    );
  });

  it("cites the vote and the coverage ceiling to page 7, which measured them", () => {
    expect(at("sampled chains, voted").page).toBe(7);
    expect(at("at least one of the").page).toBe(7);
    expect(at("temperature zero").page).toBe(7);
    // Selection is page 8's: that is the page that ran the judges.
    expect(at("trained verifier picks one").page).toBe(8);
  });

  it("draws no rung for search, which was never run on these problems", () => {
    // Page 10 ships no run: hand-authored tree, Yao et al.'s bars on Game of 24
    // and crosswords. A bar would invent a result and borrowing Yao's number
    // would put another task on this axis. The takeaways carry it instead.
    expect(LADDER.some((r) => r.page === 10)).toBe(false);
    expect(LADDER.every((r) => r.accuracy > 0)).toBe(true);
  });

  it("takes its vote and its selector from ONE run, since they are compared", () => {
    // Page 7 measures its vote at 55% and page 8 measures one at 56% on its own
    // candidates. The ladder quotes page 11, the only run that re-aggregates
    // pages 6, 7 and 8 into one accounting AND prices them, so the step between
    // the vote and the selector is a step somebody actually measured.
    const hard = PAGE11.bands.hard;
    expect(at("sampled chains, voted").accuracy).toBe(
      hard.voteCurve[hard.voteCurve.length - 1].accuracy,
    );
    expect(at("trained verifier picks one").accuracy).toBe(hard.bestOf!.accuracy);
  });

  it("gives page 9's rung its own baseline, because its pool is not the others'", () => {
    // Read as a bare number this rung sits below page 8's selector and would
    // look like a technique that lost. It is not comparable: page 9 filtered a
    // pool whose own vote is 57%. The only true reading is the step from there.
    const r = at("filtered by step soundness");
    expect(r.baseline).toBe(PAGE9.selection!.majority);
    expect(r.accuracy - r.baseline!).toBeCloseTo(PAGE9.selection!.deltaPts / 100, 5);
    expect(PAGE9.selection!.helps).toBe(false);
  });

  it("prices only the rungs page 11 actually measured in FLOPs", () => {
    // The bill is spent in prose rather than in a column, but it still may only
    // exist where somebody measured FLOPs. Mean tokens are not FLOPs.
    const priced = LADDER.filter((r) => r.bill !== undefined);
    expect(priced).toHaveLength(4);
    for (const r of priced) expect(r.bill!).toBeGreaterThan(0);
    expect(at("one chain of thought, greedy").bill).toBeCloseTo(1, 5);
  });

  it("carries page 11's finding in the bill column, not just in the prose", () => {
    // The point of the last band: the same accuracy, reached two ways, at bills
    // that differ by roughly seven times. If a re-run ever flips this, the
    // page's closing paragraph is wrong and must be rewritten, not re-rendered.
    const selector = at("trained verifier picks one");
    const bigger = at("one greedy chain");
    expect(bigger.accuracy).toBe(selector.accuracy);
    expect(bigger.accuracy).toBe(CROSSING);
    expect(bigger.bill!).toBeLessThan(selector.bill! / 5);
  });

  it("keeps the coverage ceiling above every technique on the axis", () => {
    const ceiling = LADDER.filter((r) => r.ceiling);
    expect(ceiling).toHaveLength(1);
    const best = Math.max(
      ...LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere").map((r) => r.accuracy),
    );
    expect(ceiling[0].accuracy).toBeGreaterThan(best);
  });

  it("only puts bars side by side that measured the same problems", () => {
    expect(ITEM_COUNT).toBe(PAGE5.figure2.bare.n);
    expect(ITEM_COUNT).toBe(PAGE8.paired.items);
    expect(ITEM_COUNT).toBe(PAGE9.run.items);
    expect(ITEM_COUNT).toBe(PAGE11.bands.hard.nItems);
  });

  it("keeps the rungs grouped in order, even though the groups are not drawn", () => {
    // The bands order the chart and tag the row measured on another model. They
    // are no longer headings, so the only thing left to protect is that the
    // grouping is contiguous: rungs interleaved between bands would put the
    // other-model row in the middle of the answer-time ladder.
    for (const r of LADDER) {
      expect(BAND_KEYS.includes(r.band), `${r.label} has band ${r.band}`).toBe(true);
    }
    const order = LADDER.map((r) => BAND_KEYS.indexOf(r.band));
    expect([...order]).toEqual([...order].sort((a, b) => a - b));
    for (const key of BAND_KEYS) {
      expect(LADDER.filter((r) => r.band === key).length, key).toBeGreaterThan(0);
    }
  });

  it("cites a real page for every rung", () => {
    for (const r of LADDER) expect(PAGES.some((p) => p.n === r.page)).toBe(true);
  });
});

describe("page 16's takeaways", () => {
  it("rests the judge takeaway on what page 15 measured, not on a hunch", () => {
    // The claim is a crossing: models asked to judge decay as the pool they are
    // judging gets more diverse, and the trained scorer does not. If a re-run
    // ever flattens the first or bends the second, takeaway 3 is wrong.
    expect(JUDGES.worstFallPts).toBeGreaterThan(0);
    expect(JUDGES.trainedFallPts).toBeLessThan(JUDGES.worstFallPts);
    expect(JUDGES.depth).toBeGreaterThan(1);
  });

  it("keeps the adaptive-compute takeaway honest about its own null", () => {
    // The oracle got hindsight and still bought no more coverage per token than
    // plain resampling. The takeaway proposes a direction; this is why it may
    // not be written as a result.
    expect(ADAPTIVE_NULL.beatsResampling).toBe(false);
    expect(ADAPTIVE_NULL.oracle).toBeGreaterThan(ADAPTIVE_NULL.natural);
    expect(ADAPTIVE_NULL.sampling).toBeCloseTo(ADAPTIVE_NULL.oracle, 1);
    expect(ADAPTIVE_NULL.oracleTokens).toBeGreaterThan(0);
  });

  it("has a coverage gap worth writing takeaway 2 about", () => {
    const ceiling = LADDER.find((r) => r.ceiling)!;
    const best = Math.max(
      ...LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere").map((r) => r.accuracy),
    );
    expect(Math.round((ceiling.accuracy - best.valueOf()) * 100)).toBeGreaterThan(10);
  });
});

describe("page 16's other axis (quoted, not plotted)", () => {
  it("quotes the distill number verbatim from the published table", () => {
    expect(OTHER_AXIS.math500).toBeCloseTo(curves.deepseekDistill.fit!.params.math1p5 / 100, 5);
    expect(OTHER_AXIS.teacher.math500).toBeCloseTo(
      curves.deepseekDistill.fit!.params.r1Math / 100,
      5,
    );
  });

  it("is NOT a rung, because it is not measured on this deck's problems", () => {
    // The published figure is the whole of MATH-500; the axis above is levels 4
    // and 5 only. Putting it on that axis would be the deck dropping the
    // coordinates off a score on its own last page.
    expect(LADDER.some((r) => r.label.includes(OTHER_AXIS.label))).toBe(false);
    expect(LADDER.some((r) => r.accuracy === OTHER_AXIS.math500)).toBe(false);
  });

  it("sizes the item-mix difference from the deck's own two bands", () => {
    // The correction is quoted, not asserted: page 11 ran this family over both
    // difficulty bands, so the deck can say what the easier mix is worth on its
    // own. Both ends must be real and the gap must be large enough to matter,
    // or the caveat is decoration.
    expect(OTHER_AXIS.bandGapPts.min).toBeGreaterThan(10);
    expect(OTHER_AXIS.bandGapPts.max).toBeGreaterThanOrEqual(OTHER_AXIS.bandGapPts.min);
    expect(OTHER_AXIS.ours.easy).toBeGreaterThan(OTHER_AXIS.ours.hard);
    expect(OTHER_AXIS.ours.hard).toBe(
      PAGE11.bands.hard.greedy.find((g) => g.label.includes("1.5B"))!.accuracy,
    );
    expect(OTHER_AXIS.ours.easy).toBe(
      PAGE11.bands.easy.greedy.find((g) => g.label.includes("1.5B"))!.accuracy,
    );
  });

  it("still beats every lever on the chart, which is why it is quoted at all", () => {
    const best = Math.max(...LADDER.map((r) => r.accuracy));
    expect(OTHER_AXIS.math500).toBeGreaterThan(best);
  });
});

describe("page 16's concept check", () => {
  it("asks ten questions", () => {
    // Twelve until 2026-08-10, when pages 8 and 11 lost theirs by request.
    expect(QUIZ).toHaveLength(10);
  });

  it("gives every question exactly one right answer", () => {
    for (const q of QUIZ) {
      const correct = q.options.filter((o) => o.correct === true);
      expect(correct, `${q.id} has ${correct.length} correct options`).toHaveLength(1);
    }
  });

  it("offers four options per question, none of them duplicated", () => {
    for (const q of QUIZ) {
      expect(q.options, q.id).toHaveLength(4);
      const texts = q.options.map((o) => o.text.trim().toLowerCase());
      expect(new Set(texts).size, `${q.id} repeats an option`).toBe(4);
    }
  });

  it("never lets an interpolated number collide a distractor with the answer", () => {
    // The stems and options carry measured figures, so a re-run can in principle
    // make a distractor identical to the key. The duplicate check above catches
    // exact collisions; this catches the near ones by requiring every option to
    // differ in more than whitespace and case.
    for (const q of QUIZ) {
      const normalised = q.options.map((o) => o.text.replace(/\s+/g, " ").trim());
      expect(new Set(normalised).size, q.id).toBe(q.options.length);
    }
  });

  it("cites a page that exists, for every question", () => {
    for (const q of QUIZ) {
      expect(PAGES.some((p) => p.n === q.page), `${q.id} cites page ${q.page}`).toBe(true);
    }
  });

  it("walks the deck in order and covers all three acts", () => {
    const pagesCited = QUIZ.map((q) => q.page);
    expect([...pagesCited]).toEqual([...pagesCited].sort((a, b) => a - b));
    const acts = new Set(pagesCited.map((n) => PAGES.find((p) => p.n === n)!.act));
    expect(acts).toEqual(new Set([1, 2, 3]));
  });

  it("explains itself on every question, whichever option was picked", () => {
    for (const q of QUIZ) {
      expect(q.why.length, `${q.id} has no explanation`).toBeGreaterThan(40);
      expect(q.stem.length, q.id).toBeGreaterThan(40);
      expect(q.concept.length, q.id).toBeGreaterThan(0);
    }
  });

  it("carries no em dash or en dash in anything it renders", () => {
    // House rule, enforced across the deck. Caught here in the source, where the
    // fix is one character, as well as in the DOM sweep the component test runs.
    for (const q of QUIZ) {
      const strings = [q.stem, q.why, q.concept, ...q.options.map((o) => o.text)];
      for (const s of strings) {
        expect(s.includes("—") || s.includes("–"), `${q.id}: ${s}`).toBe(false);
      }
    }
  });
});

describe("page 16's formatting", () => {
  it("formats percentages the way the rest of the deck does", () => {
    expect(pct(0.43)).toBe("43%");
    expect(pct(0.0582, 1)).toBe("5.8%");
  });
});
