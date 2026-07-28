/**
 * Composite model for the Page-19 capstone "build a reasoner" panel: compose
 * the story's techniques and read off accuracy, cost, latency and
 * monitorability over a three-family problem suite. Pure and deterministic,
 * so it is unit-testable (reasoner.test.ts).
 *
 * It is an illustrative composite, not a live model. Each lever moves each
 * readout in the DIRECTION the cited results report; the magnitudes are
 * pedagogical:
 *  - Chain of thought lifts everything, most of all math (Wei et al. 2022).
 *  - More samples help with diminishing returns; a learned verifier selects
 *    better than a majority vote and costs extra (Wang et al., Cobbe et al.).
 *  - Tree search pays off mainly on planning and multiplies the bill
 *    (Yao et al. 2023).
 *  - Latent thought is cheaper and faster, stronger on planning, weaker on
 *    math, and unreadable (Hao et al. 2024, data/coconut.json).
 *  - An adaptive budget buys the same accuracy for less compute
 *    (Snell et al. 2024).
 */

export type Medium = "language" | "latent";
export type Selection = "majority" | "verifier";

export interface ReasonerConfig {
  cot: boolean;
  /** Only meaningful while `cot` is on: silent thoughts still need thoughts. */
  medium: Medium;
  samples: number;
  /** Only meaningful while `samples` > 1. */
  selection: Selection;
  /** Tree search over explicit thoughts; ignored while `cot` is off. */
  search: boolean;
  adaptive: boolean;
}

export type FamilyKey = "arithmetic" | "math" | "planning";

export interface ReasonerOutcome {
  /** Mean accuracy over the three families, %. */
  accuracy: number;
  families: Record<FamilyKey, number>;
  /** Total compute, relative to one direct answer. */
  cost: number;
  /** Wall-clock, relative to one direct answer: parallel samples are free. */
  latency: number;
  /** How much of the computation you can read, 0–100. */
  monitorability: number;
}

export const FAMILY_LABELS: Record<FamilyKey, string> = {
  arithmetic: "quick arithmetic",
  math: "competition math",
  planning: "multi-step planning",
};

const FAMILIES: FamilyKey[] = ["arithmetic", "math", "planning"];

const BASE: Record<FamilyKey, number> = { arithmetic: 62, math: 10, planning: 8 };
const COT_GAIN: Record<FamilyKey, number> = { arithmetic: 24, math: 27, planning: 10 };
const LATENT_SHIFT: Record<FamilyKey, number> = { arithmetic: -3, math: -7, planning: 14 };
const SELECT_GAIN: Record<Selection, Record<FamilyKey, number>> = {
  majority: { arithmetic: 5, math: 12, planning: 5 },
  verifier: { arithmetic: 7, math: 18, planning: 9 },
};
const SEARCH_GAIN: Record<FamilyKey, number> = { arithmetic: 1, math: 6, planning: 30 };
const CEILING: Record<FamilyKey, number> = { arithmetic: 97, math: 90, planning: 93 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function reasonerOutcome(c: ReasonerConfig): ReasonerOutcome {
  const n = clamp(Math.round(c.samples), 1, 16);
  const latent = c.cot && c.medium === "latent";
  const searching = c.cot && c.search;
  const verifying = n > 1 && c.selection === "verifier";

  // Diminishing returns in N; sampled DIRECT answers are less diverse than
  // sampled chains, so selection buys less without written reasoning.
  const sampleFactor = (1 - 1 / Math.sqrt(n)) * (c.cot ? 1 : 0.5);

  const families = {} as Record<FamilyKey, number>;
  let sum = 0;
  for (const f of FAMILIES) {
    let acc = BASE[f];
    if (c.cot) acc += COT_GAIN[f];
    if (latent) acc += LATENT_SHIFT[f];
    acc += SELECT_GAIN[c.selection][f] * sampleFactor;
    if (searching) acc += SEARCH_GAIN[f];
    acc = clamp(acc, 0, CEILING[f]);
    families[f] = round1(acc);
    sum += acc;
  }

  // Tokens per attempt; search triples the thoughts scored; every sample is
  // paid for; a verifier reads everything it judges; an adaptive budget stops
  // spending on prompts that never needed it.
  const attempt = c.cot ? (latent ? 2 : 10) : 1;
  const cost = round1(
    attempt * (searching ? 3 : 1) * n * (verifying ? 1.25 : 1) * (c.adaptive ? 0.6 : 1),
  );

  // Samples run in parallel, so N is absent here: that is the cost/latency
  // asymmetry the panel teaches.
  const latency = round1(
    attempt * (searching ? 3 : 1) * (verifying ? 1.1 : 1) * (c.adaptive ? 0.8 : 1),
  );

  const monitorability = clamp(
    (c.cot ? (latent ? 20 : 90) : 15) - (verifying ? 10 : 0),
    0,
    100,
  );

  return { accuracy: round1(sum / 3), families, cost, latency, monitorability };
}

export interface ReasonerPreset {
  key: string;
  label: string;
  config: ReasonerConfig;
}

/** Shortcut recipes, in the order the story taught them. */
export const PRESETS: ReasonerPreset[] = [
  {
    key: "direct",
    label: "Direct answer",
    config: { cot: false, medium: "language", samples: 1, selection: "majority", search: false, adaptive: false },
  },
  {
    key: "cot",
    label: "Classic CoT",
    config: { cot: true, medium: "language", samples: 1, selection: "majority", search: false, adaptive: false },
  },
  {
    key: "self-consistency",
    label: "Self-consistency",
    config: { cot: true, medium: "language", samples: 8, selection: "majority", search: false, adaptive: false },
  },
  {
    key: "search-verifier",
    label: "Search + verifier",
    config: { cot: true, medium: "language", samples: 8, selection: "verifier", search: true, adaptive: true },
  },
  {
    key: "latent",
    label: "Latent frontier",
    config: { cot: true, medium: "latent", samples: 8, selection: "verifier", search: true, adaptive: true },
  },
];
