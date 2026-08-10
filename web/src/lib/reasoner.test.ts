import { describe, expect, it } from "vitest";
import { curves } from "./curves";
import { PRESETS, reasonerOutcome, type ReasonerConfig } from "./reasoner";

const COT: ReasonerConfig = {
  cot: true,
  medium: "language",
  samples: 1,
  selection: "majority",
  search: false,
  adaptive: false,
};

describe("Page 19: build-a-reasoner composite", () => {
  it("chain of thought lifts every family, most of all math", () => {
    const off = reasonerOutcome({ ...COT, cot: false });
    const on = reasonerOutcome(COT);
    for (const f of ["arithmetic", "math", "planning"] as const) {
      expect(on.families[f]).toBeGreaterThan(off.families[f]);
    }
    const gain = (f: "arithmetic" | "math" | "planning") => on.families[f] - off.families[f];
    expect(gain("math")).toBeGreaterThanOrEqual(gain("arithmetic"));
    expect(gain("math")).toBeGreaterThan(gain("planning"));
  });

  it("latent thought mirrors Coconut's directions: planning up, math down, bill down, unreadable", () => {
    // The data file must agree with the model's directions.
    const p = curves.coconut.fit!.params;
    expect(p.prosqaCoconut).toBeGreaterThan(p.prosqaCot);
    expect(p.gsm8kCoconut).toBeLessThan(p.gsm8kCot);
    expect(p.prosqaCoconutTokens).toBeLessThan(p.prosqaCotTokens);

    const words = reasonerOutcome(COT);
    const latent = reasonerOutcome({ ...COT, medium: "latent" });
    expect(latent.families.planning).toBeGreaterThan(words.families.planning);
    expect(latent.families.math).toBeLessThan(words.families.math);
    expect(latent.cost).toBeLessThan(words.cost);
    expect(latent.latency).toBeLessThan(words.latency);
    expect(latent.monitorability).toBeLessThan(words.monitorability / 3);
  });

  it("samples: accuracy never falls, the bill grows linearly, latency does not move", () => {
    let prev = reasonerOutcome(COT);
    for (const n of [2, 4, 8, 16]) {
      const out = reasonerOutcome({ ...COT, samples: n });
      expect(out.accuracy).toBeGreaterThanOrEqual(prev.accuracy);
      expect(out.cost).toBe(reasonerOutcome(COT).cost * n);
      expect(out.latency).toBe(prev.latency);
      prev = out;
    }
  });

  it("a learned verifier out-selects the majority vote and costs extra", () => {
    const majority = reasonerOutcome({ ...COT, samples: 8 });
    const verifier = reasonerOutcome({ ...COT, samples: 8, selection: "verifier" });
    expect(verifier.accuracy).toBeGreaterThan(majority.accuracy);
    expect(verifier.cost).toBeGreaterThan(majority.cost);
    expect(verifier.monitorability).toBeLessThan(majority.monitorability);
  });

  it("tree search pays off most on planning and multiplies both bills", () => {
    const chain = reasonerOutcome(COT);
    const tree = reasonerOutcome({ ...COT, search: true });
    const gain = (f: "arithmetic" | "math" | "planning") => tree.families[f] - chain.families[f];
    expect(gain("planning")).toBeGreaterThan(gain("math"));
    expect(gain("math")).toBeGreaterThan(gain("arithmetic"));
    expect(tree.cost).toBe(chain.cost * 3);
    expect(tree.latency).toBe(chain.latency * 3);
    // Search needs explicit thoughts to search over.
    const noThoughts = reasonerOutcome({ ...COT, cot: false, search: true });
    expect(noThoughts.accuracy).toBe(reasonerOutcome({ ...COT, cot: false }).accuracy);
  });

  it("an adaptive budget trades a little accuracy for a lot of bill", () => {
    const flat = reasonerOutcome({ ...COT, samples: 8, selection: "verifier", search: true });
    const adaptive = reasonerOutcome({
      ...COT,
      samples: 8,
      selection: "verifier",
      search: true,
      adaptive: true,
    });
    // Not free, and not nearly free enough to be a reason to leave it off: the
    // saving is tens of percent and the price is the prompts an imperfect
    // difficulty estimate under-budgets. A lever with no cost teaches nothing.
    expect(adaptive.accuracy).toBeLessThan(flat.accuracy);
    expect(flat.accuracy - adaptive.accuracy).toBeLessThan(2);
    expect(adaptive.cost).toBeLessThan(flat.cost);
    expect(adaptive.latency).toBeLessThan(flat.latency);
  });

  it("charges readability to every lever that hides something, not only latent", () => {
    // pages.ts:68 promises "what each costs in readability" for all three
    // frontier directions; search and adaptive used to be free of it.
    const base = reasonerOutcome({ ...COT, samples: 8 });
    expect(reasonerOutcome({ ...COT, samples: 8, search: true }).monitorability).toBeLessThan(
      base.monitorability,
    );
    expect(reasonerOutcome({ ...COT, samples: 8, adaptive: true }).monitorability).toBeLessThan(
      base.monitorability,
    );
    expect(
      reasonerOutcome({ ...COT, samples: 8, selection: "verifier" }).monitorability,
    ).toBeLessThan(base.monitorability);
    // Latent is still the largest single drop by a wide margin.
    const latent = reasonerOutcome({ ...COT, samples: 8, medium: "latent" });
    expect(base.monitorability - latent.monitorability).toBeGreaterThan(50);
  });

  it("stays within bounds under every lever combination", () => {
    for (const cot of [true, false])
      for (const medium of ["language", "latent"] as const)
        for (const samples of [1, 16])
          for (const selection of ["majority", "verifier"] as const)
            for (const search of [true, false])
              for (const adaptive of [true, false]) {
                const out = reasonerOutcome({ cot, medium, samples, selection, search, adaptive });
                expect(out.accuracy).toBeGreaterThan(0);
                expect(out.accuracy).toBeLessThan(100);
                expect(out.monitorability).toBeGreaterThanOrEqual(0);
                expect(out.monitorability).toBeLessThanOrEqual(100);
                expect(out.cost).toBeGreaterThan(0);
                expect(out.latency).toBeGreaterThan(0);
              }
  });

  it("the presets climb in accuracy along the story's order", () => {
    const accs = PRESETS.map((p) => reasonerOutcome(p.config).accuracy);
    for (let i = 1; i < accs.length; i++) expect(accs[i]).toBeGreaterThan(accs[i - 1]);
    // ...and the frontier preset trades readability for the efficiency win.
    const search = reasonerOutcome(PRESETS.find((p) => p.key === "search-verifier")!.config);
    const latent = reasonerOutcome(PRESETS.find((p) => p.key === "latent")!.config);
    expect(latent.cost).toBeLessThan(search.cost / 4);
    expect(latent.monitorability).toBeLessThan(search.monitorability / 4);
  });
});
