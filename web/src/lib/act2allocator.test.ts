import { describe, expect, it } from "vitest";
import {
  accuracy,
  BIG_MODEL,
  ceiling,
  cheapestWin,
  DIFFICULTIES,
  flopsOf,
  MAX_EXP,
  MODEL_SIZES,
  target,
} from "./allocator";

describe("page 11 allocator model (authored shape, pinned)", () => {
  it("more samples never hurt, at every size and difficulty", () => {
    for (const d of DIFFICULTIES) {
      for (const size of MODEL_SIZES) {
        for (let e = 1; e <= MAX_EXP; e++) {
          expect(accuracy(d, size, 2 ** e)).toBeGreaterThanOrEqual(
            accuracy(d, size, 2 ** (e - 1)),
          );
        }
      }
    }
  });

  it("a bigger model never scores lower at the same sample count", () => {
    for (const d of DIFFICULTIES) {
      for (let s = 1; s < MODEL_SIZES.length; s++) {
        for (let e = 0; e <= MAX_EXP; e++) {
          expect(accuracy(d, MODEL_SIZES[s], 2 ** e)).toBeGreaterThanOrEqual(
            accuracy(d, MODEL_SIZES[s - 1], 2 ** e),
          );
        }
      }
    }
  });

  it("the 14x model answering once sits exactly on the target line", () => {
    for (const d of DIFFICULTIES) {
      expect(accuracy(d, BIG_MODEL, 1)).toBe(target(d));
      expect(flopsOf(BIG_MODEL, 1)).toBe(14);
    }
  });

  it("accuracy saturates: no budget exceeds the ceiling", () => {
    for (const d of DIFFICULTIES) {
      for (const size of MODEL_SIZES) {
        expect(accuracy(d, size, 2 ** MAX_EXP)).toBeLessThan(ceiling(d, size));
      }
    }
  });

  // The paper's headline, as the widget plays it: on easy and medium problems
  // the 1x model beats the 14x model's one-shot score for FEWER than 14 units.
  it("easy: the 1x model matches the 14x target at 4 samples (3.5x cheaper)", () => {
    expect(cheapestWin("easy", 1)).toBe(4);
    expect(accuracy("easy", 1, 4)).toBeCloseTo(88.5, 5);
    expect(flopsOf(1, 4)).toBeLessThan(14);
  });

  it("medium: the 1x model matches the 14x target at 8 samples (1.75x cheaper)", () => {
    expect(cheapestWin("medium", 1)).toBe(8);
    expect(accuracy("medium", 1, 8)).toBeGreaterThanOrEqual(62);
    expect(accuracy("medium", 1, 4)).toBeLessThan(62);
    expect(flopsOf(1, 8)).toBeLessThan(14);
  });

  // The crucial nuance: on the hardest problems the small model's ceiling is
  // BELOW the target, so test-time compute cannot win at any budget…
  it("hard: the 1x and 2x models can never reach the target", () => {
    expect(cheapestWin("hard", 1)).toBeNull();
    expect(cheapestWin("hard", 2)).toBeNull();
    expect(ceiling("hard", 1)).toBeLessThan(target("hard"));
    expect(ceiling("hard", 2)).toBeLessThan(target("hard"));
  });

  // …and even a mid-size model that CAN reach it pays far more than 14 units,
  // so pretraining the larger model is the better buy in this regime.
  it("hard: the 4x model reaches the target only by overpaying", () => {
    const k = cheapestWin("hard", 4);
    expect(k).not.toBeNull();
    expect(flopsOf(4, k!)).toBeGreaterThan(14);
  });
});
