/**
 * Page 5's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. Everything in `web/data/page-05-derived.json`
 * is a byte-for-byte copy of `notebooks/out/page_05/derived.json`, produced by
 * `page_05_how_to_reason.ipynb` from `traces.jsonl`, and the page ships the file
 * it draws from beside a download of the file that file came from.
 *
 * What this module DOES do is refuse to hand the page numbers it is not allowed
 * to use. `derived.json.claims` is the machine-readable form of the claims
 * contract in docs/page_5_refactor.md section 6, and the translation step reads
 * it BEFORE it reads any number. A run whose gates are false does not ship, so a
 * false gate is a load error here, not a conditional in the component.
 *
 * The consistency assertions below are cheap and they are the cross-language
 * check in miniature: the notebook's own aggregates have to agree with each
 * other arithmetically (a solve count is its accuracy times n; a paired contrast
 * is its two discordant counts), and a copy-paste of the wrong run into
 * `web/data/` fails the build rather than drawing a plausible wrong figure.
 */
import rawDerived from "@data/page-05-derived.json";
import { pairedTable as sharedPairedTable } from "./paired";
import { pct, tidyMath } from "./traceText";

export class Page05DataError extends Error {}

/**
 * Re-exported for page 5's existing callers. The implementations moved to
 * `traceText` when page 6 became the second consumer: one derivation, one copy.
 */
export { pct, tidyMath };

/** One prompt condition's trace on figure 1's single curated problem. */
export interface SpecimenTab {
  condition: string;
  label: string;
  /** Prompt text before the shared stem (empty for every condition we ran). */
  promptBefore: string;
  /** Prompt text appended after the shared stem: the whole manipulation. */
  promptAfter: string;
  trace: string;
  /** The generated token strings, in order. Concatenating them rebuilds `trace`. */
  tokens: string[];
  /** Contiguous, gapless segmentation of `tokens` into reveal steps. */
  steps: { text: string; tokenStart: number; tokenEnd: number }[];
  tokensGenerated: number;
  extractedAnswer: string;
  correct: boolean;
}

export interface ConditionStats {
  condition: string;
  label: string;
  n: number;
  nCorrect: number;
  accuracy: number;
  /** 95% Wilson interval on the accuracy, as fractions. */
  ci: [number, number];
  medianTokens: number;
  meanTokens: number;
  p90Tokens: number;
  chainShare: number;
  boxedRate: number;
}

/** A paired contrast: exact McNemar over the items where the two disagree. */
export interface Contrast {
  high: string;
  low: string;
  what: string;
  deltaPts: number;
  ciPts: [number, number];
  /** Items the `high` condition solves and the `low` condition does not. */
  fixed: number;
  /** Items the `low` condition solves and the `high` condition does not. */
  broken: number;
  p: number;
  significant: boolean;
}

export interface ModelRow {
  modelId: string;
  label: string;
  params: number;
  quant: string;
  blurtAccuracy: number;
  bareAccuracy: number;
  /** Median tokens this checkpoint wrote per problem, non-reasoning. */
  blurtMedianTokens: number;
  /** Median tokens this checkpoint wrote per problem, reasoning. */
  bareMedianTokens: number;
  deltaPts: number;
  fixed: number;
  broken: number;
  p: number;
}

const D = rawDerived as unknown as {
  manifest: {
    run_id: string;
    timestamp_utc: string;
    run_mode: string;
    primary_model: string;
    models: { id: string; label: string; params: number; quant: string }[];
    decoding: { strategy: string; max_new_tokens: number };
    items: { source: string; eval_levels: number[]; n: number };
    conditions: Record<string, string>;
    grading: { extract: string; grade: string };
    integrity: { blurt_compliance: number; complies_under_tokens: number };
  };
  truncation: { worst: { condition: string; rate: number }; biases_headline: string };
  claims: Record<string, boolean>;
  figure_1: {
    problem_id: string;
    level: number;
    question: string;
    ground_truth: string;
    prompt_stem: string;
    tabs: Record<string, unknown>[];
    n_candidates: number;
    specimen_is_fallback: boolean;
  };
  figure_2: {
    model_id: string;
    conditions: Record<string, unknown>[];
    contrasts: Record<string, unknown>[];
    instruction_bound_pts: number;
    measured_only: Record<string, unknown>[];
  };
  figure_3: {
    models: Record<string, unknown>[];
    cross: {
      gagged_large: string;
      gagged_large_accuracy: number;
      ungagged_small: string;
      ungagged_small_accuracy: number;
      delta_pts: number;
      fixed: number;
      broken: number;
      p: number;
      significant: boolean;
      param_ratio: number;
    };
    floor_is_flat: boolean;
  };
  close: {
    blurt_median_tokens: number;
    bare_median_tokens: number;
    token_multiple: number;
    blurt_accuracy: number;
    bare_accuracy: number;
    suppression_pts: number;
    instruction_pts: number;
    instruction_bound_pts: number;
  };
};

/**
 * The gates that make the run translatable at all. Every one of these is
 * "not translatable" or "the figure drops" in the spec's table, so a false
 * value means the committed data file is not the one the page was written
 * against and the page must not render it.
 */
const REQUIRED_CLAIMS = [
  "suppression_resolves", // the page IS this contrast
  "blurt_compliance", // a model that will not stop gives the page no floor
  "specimen_usable", // figure 1's triple was found, not faked
  "instruction_null_bounded", // the footnote states a bound, never "nothing"
  "floor_is_flat", // figure 3's headline sentence
  "may_compare_across_models", // figure 3 ran, precision recorded per model
] as const;

for (const flag of REQUIRED_CLAIMS) {
  if (D.claims?.[flag] !== true) {
    throw new Page05DataError(
      `page-05-derived.json: claim gate "${flag}" is not true, so this run is not the one page 5 was written against`,
    );
  }
}

/** One reasoning move: an instruction and the working it announces, as one reveal. */
export interface ReasoningStep {
  /** The trace segments it joins, in order. */
  parts: string[];
  tokenStart: number;
  tokenEnd: number;
}

/**
 * Groups the notebook's line-level segments into intermediate steps for
 * display. A segment that ends on a colon ("First, eliminate the fraction by
 * multiplying both sides by 2:") announces the working after it, so it joins
 * the next segment, and so on down a chain of colons. Token ranges stay
 * contiguous, so every generated token is still revealed exactly once.
 */
export function reasoningSteps(steps: SpecimenTab["steps"]): ReasoningStep[] {
  const out: ReasoningStep[] = [];
  let open = false;
  for (const s of steps) {
    const last = out[out.length - 1];
    if (open && last) {
      last.parts.push(s.text);
      last.tokenEnd = s.tokenEnd;
    } else {
      out.push({ parts: [s.text], tokenStart: s.tokenStart, tokenEnd: s.tokenEnd });
    }
    open = s.text.trimEnd().endsWith(":");
  }
  return out;
}

function tab(raw: Record<string, unknown>): SpecimenTab {
  const steps = (raw.steps as { text: string; token_start: number; token_end: number }[]).map(
    (s) => ({ text: s.text, tokenStart: s.token_start, tokenEnd: s.token_end }),
  );
  const tokens = raw.tokens as string[];
  // The reveal animates real token boundaries, so the segmentation has to cover
  // every token exactly once: a gap would silently drop generated text.
  let cursor = 0;
  for (const s of steps) {
    if (s.tokenStart !== cursor) {
      throw new Page05DataError(`page-05-derived.json: step segmentation is not contiguous`);
    }
    cursor = s.tokenEnd;
  }
  if (cursor !== tokens.length) {
    throw new Page05DataError(`page-05-derived.json: step segmentation does not cover all tokens`);
  }
  return {
    condition: raw.condition as string,
    label: raw.label as string,
    promptBefore: raw.prompt_before as string,
    promptAfter: raw.prompt_after as string,
    trace: raw.trace as string,
    tokens,
    steps,
    tokensGenerated: raw.tokens_generated as number,
    extractedAnswer: raw.extracted_answer as string,
    correct: raw.correct as boolean,
  };
}

function condition(raw: Record<string, unknown>): ConditionStats {
  const n = raw.n as number;
  const nCorrect = raw.n_correct as number;
  const accuracy = raw.accuracy as number;
  if (Math.abs(nCorrect / n - accuracy) > 1e-9) {
    throw new Page05DataError(
      `page-05-derived.json: ${String(raw.condition)} reports ${nCorrect}/${n} but an accuracy of ${accuracy}`,
    );
  }
  return {
    condition: raw.condition as string,
    label: raw.label as string,
    n,
    nCorrect,
    accuracy,
    ci: raw.ci as [number, number],
    medianTokens: raw.median_tokens as number,
    meanTokens: raw.mean_tokens as number,
    p90Tokens: raw.p90_tokens as number,
    chainShare: raw.chain_share as number,
    boxedRate: raw.boxed_rate as number,
  };
}

function contrast(raw: Record<string, unknown>): Contrast {
  return {
    high: raw.high as string,
    low: raw.low as string,
    what: raw.what as string,
    deltaPts: raw.delta_pts as number,
    ciPts: raw.ci_pts as [number, number],
    fixed: raw.fixed as number,
    broken: raw.broken as number,
    p: raw.p as number,
    significant: raw.significant as boolean,
  };
}

const specimenTabs = D.figure_1.tabs.map(tab);
const fig2Conditions = D.figure_2.conditions.map(condition);
const fig2Contrasts = D.figure_2.contrasts.map(contrast);

const blurt = fig2Conditions.find((c) => c.condition === "forced_blurt");
const bare = fig2Conditions.find((c) => c.condition === "bare");
const suppression = fig2Contrasts.find((c) => c.low === "forced_blurt" && c.high === "bare");
const instruction = fig2Contrasts.find((c) => c.high === "zero_shot_cot");

if (!blurt || !bare || !suppression || !instruction) {
  throw new Page05DataError("page-05-derived.json: missing a condition or a contrast page 5 draws");
}

/**
 * Figure 2's 10x10 grid is the deck's paired-contrast picture, and page 6's
 * extension arm now draws the same one, so the arithmetic lives in
 * `lib/paired.ts`. Re-exported here because page 5 is where it is used most and
 * where the figure was designed.
 *
 * The orientation, which is the one thing easy to get backwards: the GAG is the
 * baseline and the chain is the change, so `afterOnly` is a problem solved only
 * when the model reasons, which is what the gag costs.
 */
export { pairedTable, solvedIn, PairedTableError } from "./paired";
export type { PairedClass, PairedTable } from "./paired";

export const PAGE5 = {
  manifest: D.manifest,
  truncation: D.truncation,
  claims: D.claims,
  figure1: {
    problemId: D.figure_1.problem_id,
    level: D.figure_1.level,
    question: D.figure_1.question,
    groundTruth: D.figure_1.ground_truth,
    promptStem: D.figure_1.prompt_stem,
    nCandidates: D.figure_1.n_candidates,
    tabs: specimenTabs,
  },
  figure2: {
    modelId: D.figure_2.model_id,
    blurt,
    bare,
    suppression,
    /** Measured, deliberately not plotted: spent on page 12. Spec section 5. */
    instruction,
    instructionStats: condition(D.figure_2.measured_only[0]),
    instructionBoundPts: D.figure_2.instruction_bound_pts,
  },
  figure3: {
    models: D.figure_3.models.map(
      (m): ModelRow => ({
        modelId: m.model_id as string,
        label: m.label as string,
        params: m.params as number,
        quant: m.quant as string,
        blurtAccuracy: m.blurt_accuracy as number,
        bareAccuracy: m.bare_accuracy as number,
        blurtMedianTokens: m.blurt_median_tokens as number,
        bareMedianTokens: m.bare_median_tokens as number,
        deltaPts: m.delta_pts as number,
        fixed: m.fixed as number,
        broken: m.broken as number,
        p: m.p as number,
      }),
    ),
    cross: D.figure_3.cross,
    floorIsFlat: D.figure_3.floor_is_flat,
  },
  close: D.close,
} as const;

/**
 * Figure 3's rows and figure 2's conditions are the same 100 generations of the
 * primary checkpoint, aggregated by two different cells of the notebook. The
 * close plots the per-model medians on the same axes as figure 2's numbers, so
 * the two aggregations have to agree: if they do not, the halves of the file
 * came from different runs and neither figure may be drawn.
 */
const primaryRow = PAGE5.figure3.models.find((m) => m.modelId === PAGE5.figure2.modelId);
if (!primaryRow) {
  throw new Page05DataError(
    `page-05-derived.json: figure 3 has no row for ${PAGE5.figure2.modelId}, the model figure 2 measures`,
  );
}
for (const [what, a, b] of [
  ["median tokens reasoning", primaryRow.bareMedianTokens, bare.medianTokens],
  ["median tokens non-reasoning", primaryRow.blurtMedianTokens, blurt.medianTokens],
  ["accuracy reasoning", primaryRow.bareAccuracy, bare.accuracy],
  ["accuracy non-reasoning", primaryRow.blurtAccuracy, blurt.accuracy],
] as const) {
  if (a !== b) {
    throw new Page05DataError(
      `page-05-derived.json: ${PAGE5.figure2.modelId} reports ${what} as ${a} in figure 3 and ${b} in figure 2`,
    );
  }
}

/** The 10x10 paired table figure 2 animates. Built once; it is pure arithmetic. */
export const SUPPRESSION_TABLE = sharedPairedTable(
  PAGE5.figure2.bare.n,
  PAGE5.figure2.blurt.nCorrect,
  PAGE5.figure2.bare.nCorrect,
  PAGE5.figure2.suppression,
);

/** A p-value the way the figures print it: exact McNemar, floored for display. */
export function pLabel(p: number): string {
  if (p < 0.0001) return "p < 0.0001";
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(p < 0.01 ? 4 : 3)}`;
}

