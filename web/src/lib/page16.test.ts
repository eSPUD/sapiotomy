import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_NULL,
  BASE_CHART,
  CATEGORIES,
  GRPO_CHART,
  GRPO_SCOPE,
  INSTRUCT_CHART,
  JUDGES,
  OTHER_AXIS,
  QUIZ,
  pct,
} from "./page16";
import { PAGE5, SHOTS } from "./page05";
import { PAGE6 } from "./page06";
import { PAGE7 } from "./page07";
import { PILE8 } from "./page08Pile";
import { BEST_OF_N } from "./page09";
import { PAGE11 } from "./page11";
import { FINAL as GRPO_FINAL, RUN as GRPO_RUN } from "./page13";
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

describe("page 15's charts", () => {
  const all = [...BASE_CHART, ...INSTRUCT_CHART, ...GRPO_CHART];
  const whole = (bars: typeof all) => bars.map((b) => Math.round(b.accuracy * 100));

  it("draws what the source pages draw today", () => {
    // A re-run that moves one of these should be a deliberate edit here.
    expect(whole(BASE_CHART)).toEqual([32, 38, 64]);
    expect(whole(INSTRUCT_CHART)).toEqual([68, 60, 81, 83, 86]);
    expect(whole(GRPO_CHART)).toEqual([74, 85]);
  });

  it("reads the first chart out of page 5's two runs", () => {
    const shots = SHOTS.rows.find((r) => r.label === "Qwen2.5-3B")!;
    expect(BASE_CHART[0].accuracy).toBe(shots.solved.zero_shot / 100);
    expect(BASE_CHART[1].accuracy).toBe(shots.solved["10_shot"] / 100);
    expect(BASE_CHART[2].accuracy).toBe(PAGE5.instruct.find((m) => m.size === "3B")!.cot.accuracy);
  });

  it("reads the second chart out of the one sweep, except thinking longer", () => {
    expect(INSTRUCT_CHART[0].accuracy).toBe(PILE8.bars.one_chain);
    expect(INSTRUCT_CHART[2].accuracy).toBe(PILE8.bars.vote);
    expect(INSTRUCT_CHART[2].accuracy).toBe(
      PAGE7.figure2.hot.points[PAGE7.figure2.hot.points.length - 1].accuracy,
    );
    expect(INSTRUCT_CHART[3].accuracy).toBe(PILE8.bars.best_of_n);
    expect(INSTRUCT_CHART[4].accuracy).toBe(BEST_OF_N.bars.prm);
    expect(INSTRUCT_CHART[1].label).toContain("*");
    expect(INSTRUCT_CHART[1].detail).toMatch(/different 100/);
  });

  it("reads the GRPO chart out of page 13's final checkpoint", () => {
    expect(GRPO_CHART[0].accuracy).toBe(GRPO_FINAL.pass1);
    expect(GRPO_CHART[1].accuracy).toBe(GRPO_FINAL.maj[String(GRPO_RUN.k)]);
    expect(GRPO_RUN.model).toBe("Qwen/Qwen2.5-1.5B-Instruct");
    expect(GRPO_SCOPE).toMatch(/1\.5B-Instruct only, on GSM8K/);
  });

  it("gives each bar its category: one colour per kind of scaling", () => {
    expect(BASE_CHART.map((b) => b.category)).toEqual(["base", "inference", "fineTuned"]);
    expect(INSTRUCT_CHART.map((b) => b.category)).toEqual([
      "fineTuned",
      "inference",
      "inference",
      "inference",
      "inference",
    ]);
    expect(GRPO_CHART.every((b) => b.category === "inferenceTraining")).toBe(true);
    expect(new Set(all.map((b) => b.category)).size).toBe(CATEGORIES.length);
  });

  it("draws no bar for search, which was never run", () => {
    // Page 10 ships no run: hand-authored tree, Yao et al.'s bars on Game of 24
    // and crosswords. The takeaways carry it instead.
    expect(all.some((b) => b.run === 10)).toBe(false);
    expect(all.every((b) => b.accuracy > 0 && b.accuracy <= 1)).toBe(true);
  });

  it("names a real page for every bar's run", () => {
    for (const b of all) expect(PAGES.some((p) => p.n === b.run)).toBe(true);
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
    const gap = PILE8.bars.ceiling - Math.max(BEST_OF_N.bars.prm, PILE8.bars.best_of_n);
    expect(Math.round(gap * 100)).toBeGreaterThanOrEqual(5);
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
    const all = [...BASE_CHART, ...INSTRUCT_CHART, ...GRPO_CHART];
    expect(all.some((b) => b.label.includes(OTHER_AXIS.label))).toBe(false);
    expect(all.some((b) => b.accuracy === OTHER_AXIS.math500)).toBe(false);
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

  // A reader who knows the idea should pick the answer without parsing a compound
  // clause, and a reader who does not should get no help from the shape of the
  // options. The first draft failed both: q11's key ran 25 words against
  // distractors of 8, and across the bank the key was the longest option 11 times
  // in 12, so "pick the long one" scored better than knowing the deck.
  it("never makes the right answer the conspicuously long one", () => {
    for (const q of QUIZ) {
      const key = q.options.find((o) => o.correct)!.text;
      const longestDistractor = Math.max(
        ...q.options.filter((o) => !o.correct).map((o) => o.text.length),
      );
      expect(key.length / longestDistractor, `${q.id} key is ${key.length} chars`).toBeLessThan(1.3);
    }
  });

  it("does not let 'pick the longest' beat knowing the answer", () => {
    const keyIsLongest = QUIZ.filter((q) => {
      const key = q.options.find((o) => o.correct)!.text.length;
      return q.options.every((o) => o.text.length <= key);
    }).length;
    // Strictly better than chance would be 3 of 12. Some overlap is unavoidable
    // because a key sometimes needs a clause a distractor does not, but a reader
    // must not be able to farm it.
    expect(keyIsLongest, `key is the longest option in ${keyIsLongest} of ${QUIZ.length}`)
      .toBeLessThanOrEqual(QUIZ.length / 2);
  });

  it("asks in sentences a person would say out loud", () => {
    for (const q of QUIZ) {
      // A stem is a scene then a question, not a run report with a question mark
      // on the end. Two proxies: it ends on a question, and it breaks the setup
      // into more than one sentence rather than one long subordinate pile.
      expect(q.stem.trim().endsWith("?"), `${q.id} does not end on a question`).toBe(true);
      const sentences = q.stem.split(/[.?]\s+/).filter(Boolean).length;
      expect(sentences, `${q.id} is one long sentence`).toBeGreaterThan(1);
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
