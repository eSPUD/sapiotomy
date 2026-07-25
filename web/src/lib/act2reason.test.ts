import { describe, expect, it } from "vitest";
import { curves } from "./curves";
import { COT_DEMO, THINK_BUDGET } from "./authored";

describe("Page 5 authored CoT demo (quoted from Wei et al. 2022, Fig. 1)", () => {
  it("the cafeteria arithmetic is self-consistent and the blurt is wrong", () => {
    const d = COT_DEMO;
    expect(d.start - d.used + d.bought).toBe(d.answerNumber);
    expect(d.blurtNumber).not.toBe(d.answerNumber);
    expect(d.blurt).toContain(String(d.blurtNumber));
    expect(d.answer).toContain(String(d.answerNumber));
    // The question quotes the three numbers the chain works with.
    for (const n of [d.start, d.used, d.bought]) {
      expect(d.question).toContain(String(n));
    }
  });

  it("the quoted chain walks 23 − 20 = 3 then 3 + 6 = 9", () => {
    const joined = COT_DEMO.steps.join(" ");
    expect(joined).toContain("23 - 20 = 3");
    expect(joined).toContain("3 + 6 = 9");
    expect(COT_DEMO.steps.length).toBeGreaterThan(1);
  });

  it("the prepended exemplar (tennis balls) is self-consistent and lands 11", () => {
    const e = COT_DEMO.exemplar;
    // 5 + 2 × 3 = 11, the Fig. 1 blue exemplar the model imitates.
    expect(5 + 2 * 3).toBe(e.answerNumber);
    expect(e.answer).toContain(String(e.answerNumber));
    expect(e.steps.join(" ")).toContain("5 + 6 = 11");
    // A DIFFERENT problem from the cafeteria question it is prepended to.
    expect(e.question).not.toBe(COT_DEMO.question);
    expect(e.answerNumber).not.toBe(COT_DEMO.answerNumber);
  });
});

describe("Page 5 Wei CoT scaling curve (per-scale GSM8K, PaLM family)", () => {
  it("params carry both curves and points hold the CoT curve", () => {
    const d = curves.weiCotScaling;
    const p = d.fit!.params;
    expect(p.palm8Standard).toBe(4.9);
    expect(p.palm62Standard).toBe(9.6);
    expect(p.palm540Standard).toBe(17.9);
    expect(p.palm8Cot).toBe(4.1);
    expect(p.palm62Cot).toBe(29.9);
    expect(p.palm540Cot).toBe(56.9);
    expect(d.points).toEqual([
      { x: 8, y: p.palm8Cot },
      { x: 62, y: p.palm62Cot },
      { x: 540, y: p.palm540Cot },
    ]);
  });

  it("agrees with the existing 540B chain-of-thought anchor and is peer-reviewed", () => {
    const d = curves.weiCotScaling;
    const cot = curves.chainOfThought.fit!.params;
    expect(d.fit!.params.palm540Standard).toBe(cot.standard);
    expect(d.fit!.params.palm540Cot).toBe(cot.chainOfThought);
    expect(d.citation.ref).toBe("Wei et al. 2022");
    expect(d.citation.venue).toContain("NeurIPS");
    expect(d.citation.preprint).toBe(false);
    // The honesty beat the page keeps: CoT is BELOW standard at 8B (emergence).
    expect(d.fit!.params.palm8Cot).toBeLessThan(d.fit!.params.palm8Standard);
  });
});

describe("Page 6 authored budget chain (costs are word counts, NOT tokens)", () => {
  const T = THINK_BUDGET;

  it("the chain's intermediate values recompute from the question's factors", () => {
    expect(47 * 60).toBe(T.steps[0].value); // 2,820
    expect(47 * 63).toBe(T.steps[1].value); // 2,961
    expect(29 * 40).toBe(T.steps[2].value); // 1,160
    expect(29 * 41).toBe(T.steps[3].value); // 1,189
    expect(T.steps[1].value - T.steps[3].value).toBe(T.steps[4].value); // 1,772
    expect(T.steps[4].value).toBe(T.answer);
    expect(47 * 63 - 29 * 41).toBe(T.answer);
    expect(Number(T.display.replace(/,/g, ""))).toBe(T.answer);
  });

  it("every step's cost is exactly its whitespace word count", () => {
    for (const s of T.steps) {
      expect(s.words).toBe(s.text.trim().split(/\s+/).length);
    }
    // The two figures the page puts on screen, pinned explicitly: step 1 is 9
    // words and the whole chain is 47. These are word counts — nothing here
    // claims they are tokenizer token counts.
    expect(T.steps[0].words).toBe(9);
    expect(T.steps.reduce((n, s) => n + s.words, 0)).toBe(47);
    // A real budget exists: multiple steps, non-trivial total.
    const total = T.steps.reduce((n, s) => n + s.words, 0);
    expect(T.steps.length).toBe(5);
    expect(total).toBeGreaterThan(20);
  });

  it("each step's text states the value it lands, and the blurt is a wrong near-miss", () => {
    for (const s of T.steps) {
      expect(s.text).toContain(s.value.toLocaleString("en-US"));
    }
    expect(T.blurtNumber).not.toBe(T.answer);
    expect(T.blurt).toBe(T.blurtNumber.toLocaleString("en-US"));
    // A near-miss, not a random number: within 100 of the true answer.
    expect(Math.abs(T.blurtNumber - T.answer)).toBeLessThanOrEqual(100);
  });
});
