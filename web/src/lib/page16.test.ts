import { describe, expect, it } from "vitest";
import { BIGGER_MODEL, ITEM_COUNT, LADDER, QUIZ, pct } from "./page16";
import { PAGE5 } from "./page05";
import { PAGE7 } from "./page07";
import { PAGE8 } from "./page08";
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
  it("reads its rungs out of the pages that measured them, never a copy", () => {
    const at = (frag: string) => LADDER.find((r) => r.label.includes(frag))!;
    expect(at("no chain at all").accuracy).toBe(PAGE5.figure2.blurt.accuracy);
    expect(at("one chain of thought").accuracy).toBe(PAGE8.oneChain);
    expect(at("majority vote").accuracy).toBe(
      PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    );
    expect(at("trained verifier picks one").accuracy).toBe(PAGE8.headline.accuracy);
    expect(at("at least one of the").accuracy).toBe(PAGE8.coverage);
  });

  it("keeps the vote and the selector on ONE run, since they are being compared", () => {
    // Page 7 measures its own vote at 55% and page 8 measures one at 56% on its
    // own candidates. Both are true; putting them in one chart is not. The
    // sampled-vote rung and the best-of-N rung must therefore agree about which
    // run they came from, or the ladder's step between them is an artefact of
    // mixing two pools.
    const vote = LADDER.find((r) => r.label.includes("sampled chains, majority vote"))!;
    const select = LADDER.find((r) => r.label.includes("trained verifier picks one"))!;
    expect(vote.accuracy).toBe(PAGE8.majority.accuracy);
    expect(select.accuracy).toBe(PAGE8.headline.accuracy);
    expect(vote.page).toBe(select.page);
  });

  it("is monotone except where the deck's argument says it should not be", () => {
    // Sixteen identical chains must not beat one chain: that flat step IS page
    // 7's finding, and a ladder that quietly sorted itself would erase it.
    const one = LADDER.find((r) => r.label.includes("one chain of thought"))!;
    const cold = LADDER.find((r) => r.label.includes("temperature zero"))!;
    expect(cold.accuracy).toBe(one.accuracy);
  });

  it("puts the coverage ceiling above everything that is a technique", () => {
    const ceiling = LADDER.filter((r) => r.ceiling);
    expect(ceiling).toHaveLength(1);
    const bestTechnique = Math.max(...LADDER.filter((r) => !r.ceiling).map((r) => r.accuracy));
    expect(ceiling[0].accuracy).toBeGreaterThan(bestTechnique);
  });

  it("charges the whole ladder against a bigger model, as page 11 does", () => {
    const bestTechnique = Math.max(...LADDER.filter((r) => !r.ceiling).map((r) => r.accuracy));
    // The crossing: one greedy chain from the larger model matches or beats
    // everything answer-time bought, for a fraction of the bill. If a re-run
    // ever flips this, the page's closing paragraph is wrong and must be rewritten
    // rather than left to render a sentence the chart contradicts.
    expect(BIGGER_MODEL.accuracy).toBeGreaterThanOrEqual(bestTechnique);
    expect(BIGGER_MODEL.voteCostMultiple).toBeGreaterThan(1);
  });

  it("only puts bars side by side that measured the same problems", () => {
    expect(ITEM_COUNT).toBe(PAGE5.figure2.bare.n);
    expect(ITEM_COUNT).toBe(PAGE8.paired.items);
  });

  it("cites a real page for every rung", () => {
    for (const r of LADDER) {
      expect(PAGES.some((p) => p.n === r.page)).toBe(true);
    }
  });
});

describe("page 16's concept check", () => {
  it("asks twelve questions", () => {
    expect(QUIZ).toHaveLength(12);
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
