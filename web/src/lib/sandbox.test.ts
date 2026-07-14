import { describe, expect, it } from "vitest";
import { sandboxOutcome } from "./sandbox";
import { scoreQuiz, QUIZ } from "./quiz";
import { DEFAULT_LEVERS, type SandboxLevers } from "@/store/useStore";

const base: SandboxLevers = { ...DEFAULT_LEVERS };

describe("Page 20 sandbox composite model", () => {
  it("is a pure function of the levers", () => {
    expect(sandboxOutcome(base)).toEqual(sandboxOutcome({ ...base }));
  });

  it("chain-of-thought lifts accuracy (echoing the CoT page ~18 -> ~57)", () => {
    const off = sandboxOutcome({ ...base, cotEnabled: false }).accuracy;
    const on = sandboxOutcome({ ...base, cotEnabled: true }).accuracy;
    expect(off).toBeLessThan(25);
    expect(on).toBeGreaterThan(50);
    expect(on).toBeGreaterThan(off);
  });

  it("more samples increases accuracy with diminishing returns", () => {
    const a1 = sandboxOutcome({ ...base, samples: 1 }).accuracy;
    const a5 = sandboxOutcome({ ...base, samples: 5 }).accuracy;
    const a40 = sandboxOutcome({ ...base, samples: 40 }).accuracy;
    expect(a5).toBeGreaterThan(a1);
    expect(a40).toBeGreaterThan(a5);
    expect(a5 - a1).toBeGreaterThan(a40 - a5);
  });

  it("verifier > majority > random", () => {
    const r = sandboxOutcome({ ...base, verifier: "random" }).accuracy;
    const m = sandboxOutcome({ ...base, verifier: "majority" }).accuracy;
    const v = sandboxOutcome({ ...base, verifier: "verifier" }).accuracy;
    expect(v).toBeGreaterThan(m);
    expect(m).toBeGreaterThan(r);
  });

  it("wider tree branching helps", () => {
    expect(sandboxOutcome({ ...base, treeBranching: 5 }).accuracy).toBeGreaterThan(
      sandboxOutcome({ ...base, treeBranching: 1 }).accuracy,
    );
  });

  it("budget forcing helps at first but over-thinks past a point", () => {
    const none = sandboxOutcome({ ...base, budgetForcing: 0 }).accuracy;
    const some = sandboxOutcome({ ...base, budgetForcing: 2 }).accuracy;
    const lots = sandboxOutcome({ ...base, budgetForcing: 8 }).accuracy;
    expect(some).toBeGreaterThan(none);
    expect(lots).toBeLessThan(some); // overthinking
  });

  it("cost increases with every compute-related lever", () => {
    const c0 = sandboxOutcome(base).cost;
    expect(sandboxOutcome({ ...base, samples: 20 }).cost).toBeGreaterThan(c0);
    expect(sandboxOutcome({ ...base, treeBranching: 5 }).cost).toBeGreaterThan(c0);
    expect(sandboxOutcome({ ...base, budgetForcing: 8 }).cost).toBeGreaterThan(c0);
    expect(sandboxOutcome({ ...base, computeBudget: 16 }).cost).toBeGreaterThan(c0);
  });
});

describe("Page 20 quiz", () => {
  it("scores all-correct answers as full marks", () => {
    const answers = Object.fromEntries(QUIZ.map((q) => [q.id, q.correctIndex]));
    expect(scoreQuiz(answers)).toBe(QUIZ.length);
  });

  it("scores wrong answers as zero", () => {
    const answers = Object.fromEntries(QUIZ.map((q) => [q.id, (q.correctIndex + 1) % q.options.length]));
    expect(scoreQuiz(answers)).toBe(0);
  });

  it("covers the three learning objectives", () => {
    const ids = QUIZ.map((q) => q.id);
    expect(ids).toContain("log-axis");
    expect(ids).toContain("verifier-vs-vote");
    expect(ids).toContain("overthinking");
  });
});
