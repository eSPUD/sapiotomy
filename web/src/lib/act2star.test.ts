/**
 * Page 12 — STaR and self-improvement.
 *
 * The page makes three mechanical claims with the loop in step 1, and quotes
 * one table verbatim in step 2. All four are pinned here:
 *  - the filtered loop RATCHETS: accuracy never falls and saturates at a
 *    plateau well above the base model and well below the ceiling;
 *  - rationalization lifts that plateau (the paper's 68.8% → 72.5% shape);
 *  - removing the correctness filter collapses the loop from its plateau to
 *    within a few points of 5-way chance — the failure the page flags for
 *    Act 3;
 *  - the CommonsenseQA numbers in data/star-cqa.json match Zelikman et al.
 *    2022, Table 1, digit for digit.
 */
import { describe, expect, it } from "vitest";
import { curves } from "./curves";
import {
  STAR_CHOICES,
  STAR_MAX_ITERS,
  STAR_POOL,
  starAccuracy,
  starBase,
  starInit,
  starStep,
  type StarIteration,
  type StarStepOptions,
} from "./star";

const POOL = starInit();
const CHANCE = 100 / STAR_CHOICES;

function run(opts: StarStepOptions, iters: number, from?: StarIteration): StarIteration[] {
  const out = [from ?? starBase(POOL)];
  for (let i = 0; i < iters; i++) out.push(starStep(POOL, out[out.length - 1], opts));
  return out;
}

describe("Page 12: the base model", () => {
  it("starts a little above chance, far below the ceiling", () => {
    const base = starBase(POOL);
    expect(base.accuracy).toBeCloseTo(34.6, 1);
    expect(base.accuracy).toBeGreaterThan(CHANCE);
    expect(base.verified + base.rationalized + base.wrong).toBe(0);
  });

  it("accuracy is monotone in skill and floored at chance", () => {
    expect(starAccuracy(POOL, 0.6)).toBeGreaterThan(starAccuracy(POOL, 0.3));
    expect(starAccuracy(POOL, -10)).toBeCloseTo(CHANCE, 1);
  });
});

describe("Page 12: the filtered loop ratchets", () => {
  const traj = run({ filter: true, rationalize: false }, STAR_MAX_ITERS);

  it("is deterministic for the documented seed", () => {
    const again = run({ filter: true, rationalize: false }, STAR_MAX_ITERS);
    expect(again.map((s) => s.accuracy)).toEqual(traj.map((s) => s.accuracy));
  });

  it("accuracy and the verified set never shrink", () => {
    for (let i = 1; i < traj.length; i++) {
      expect(traj[i].accuracy).toBeGreaterThanOrEqual(traj[i - 1].accuracy);
      expect(traj[i].verified).toBeGreaterThanOrEqual(traj[i - 1].verified);
    }
  });

  it("nothing wrong ever enters the training set", () => {
    for (const s of traj) expect(s.wrong).toBe(0);
  });

  it("saturates at the pinned plateau, well below the ceiling", () => {
    const last = traj[traj.length - 1];
    expect(last.accuracy).toBeCloseTo(67.1, 1);
    // Saturation: the last iterations add almost nothing.
    expect(last.accuracy - traj[traj.length - 3].accuracy).toBeLessThan(2);
    // The hardest problems stay out of the set — the plateau's cause.
    expect(last.verified).toBeLessThan(STAR_POOL);
  });
});

describe("Page 12: rationalization lifts the plateau", () => {
  const plain = run({ filter: true, rationalize: false }, STAR_MAX_ITERS);
  const hinted = run({ filter: true, rationalize: true }, STAR_MAX_ITERS);

  it("hints admit problems the model missed unaided", () => {
    expect(hinted[1].rationalized).toBeGreaterThan(0);
    expect(plain[1].rationalized).toBe(0);
  });

  it("and the loop ends strictly higher for it", () => {
    const a = plain[plain.length - 1].accuracy;
    const b = hinted[hinted.length - 1].accuracy;
    expect(b).toBeCloseTo(79.5, 1);
    expect(b).toBeGreaterThan(a + 5);
  });
});

describe("Page 12: removing the filter collapses the loop", () => {
  const plateau = run({ filter: true, rationalize: false }, STAR_MAX_ITERS);
  const collapse = run(
    { filter: false, rationalize: false },
    8,
    plateau[plateau.length - 1],
  );

  it("every problem contributes, right or wrong", () => {
    for (const s of collapse.slice(1)) {
      expect(s.verified + s.wrong).toBe(STAR_POOL);
      expect(s.wrong).toBeGreaterThan(0);
      expect(s.rationalized).toBe(0); // a hint needs an answer key
    }
  });

  it("accuracy falls every iteration until the floor", () => {
    for (let i = 1; i < collapse.length; i++) {
      expect(collapse[i].accuracy).toBeLessThanOrEqual(collapse[i - 1].accuracy);
    }
  });

  it("and lands within a few points of guessing", () => {
    const last = collapse[collapse.length - 1].accuracy;
    expect(last).toBeCloseTo(21.3, 1);
    expect(last - CHANCE).toBeLessThan(3);
  });
});

describe("Page 12: the quoted CommonsenseQA table", () => {
  const p = curves.starCqa.fit!.params;

  it("matches Zelikman et al. 2022, Table 1, digit for digit", () => {
    expect(p.fewShotDirect).toBe(20.9);
    expect(p.fewShotCot).toBe(36.6);
    expect(p.fewShotCotLamda).toBe(55.6);
    expect(p.gptjFinetuned).toBe(60.0);
    expect(p.starNoRationalization).toBe(68.8);
    expect(p.star).toBe(72.5);
    expect(p.gpt3Finetuned).toBe(73.0);
    expect(p.trainDataNoRationalization).toBe(69.7);
    expect(p.trainDataRationalization).toBe(86.7);
  });

  it("tells the story the page's copy tells", () => {
    // Self-generated rationales beat fine-tuning on human answers alone…
    expect(p.starNoRationalization).toBeGreaterThan(p.gptjFinetuned);
    // …the 6B model beats a 23x larger LaMDA prompted the same way…
    expect(p.star).toBeGreaterThan(p.fewShotCotLamda);
    // …rationalization adds more…
    expect(p.star).toBeGreaterThan(p.starNoRationalization);
    // …to within half a point of a 30x larger fine-tuned model.
    expect(Math.abs(p.gpt3Finetuned - p.star)).toBeLessThanOrEqual(0.5);
  });

  it("is a peer-reviewed citation with provenance", () => {
    expect(curves.starCqa.citation.preprint).toBe(false);
    expect(curves.starCqa.provenance).toContain("Table 1");
  });
});
