/**
 * Page 5's two runs, loaded from `web/data/page-05-derived.json`.
 *
 * The boundary (notebooks/README.md): the notebooks write logs, the page reads
 * them. `web/data/page-05-derived.json` is a byte-for-byte copy of
 * `notebooks/out/page_05/derived.json`, which `notebooks/page_05_site_data.py`
 * builds from the two runs' traces:
 *
 *   · the few-shot run, `page_5_few_shot.ipynb`: base Qwen2.5 1.5B, 3B and 7B,
 *     zero-shot and five-shot chain of thought;
 *   · the instruct run, `page_5_instruct_reasoning.ipynb`: Qwen2.5 1.5B, 3B and 7B
 *     Instruct, reasoning (CoT) and asked for the final answer only (Direct).
 *
 * Every tally is on the same 495 MATH-500 problems: the five example problems the
 * few-shot prompt shows are left out of both runs' numbers.
 *
 * Nothing here recomputes a claim. What this module does is check that the file's
 * tallies agree with each other arithmetically (a solve count is its accuracy
 * times n; a paired table's cells add up to both arms' solve counts), so a copy of
 * the wrong file into `web/data/` fails the build rather than drawing a plausible
 * wrong figure.
 */
import rawDerived from "@data/page-05-derived.json";
import { pct, tidyMath } from "./traceText";

export class Page05DataError extends Error {}

export { pct, tidyMath };

/** One MATH-500 problem as the page shows it. */
export interface Problem {
  uniqueId: string;
  level: number;
  subject: string;
  problem: string;
  answer: string;
}

/** One of the few-shot prompt's five examples: a problem and its worked solution. */
export interface Example extends Problem {
  solution: string;
}

/** One model under one prompt, tallied over the 495 problems. */
export interface ArmStats {
  n: number;
  correct: number;
  accuracy: number;
  medianTokens: number;
  truncated: number;
  /** Replies with no \boxed{} answer, which grade as wrong. */
  unboxed: number;
  /** Accuracy by MATH level, 1 to 5. */
  byLevel: { level: number; n: number; correct: number; accuracy: number }[];
  /** Base replies that write a Python block (the few-shot run only). */
  wroteCode?: number;
  /** Replies of 40 tokens or fewer (the instruct run only). */
  shortReplies?: number;
  shortShare?: number;
}

/** Two prompts or models on the same problems: who solves what. */
export interface PairedCounts {
  size?: string;
  a: string;
  b: string;
  n: number;
  both: number;
  neither: number;
  aOnly: number;
  bOnly: number;
}

export interface BaseRow {
  size: string;
  modelId: string;
  label: string;
  zeroShot: ArmStats;
  fewShot: ArmStats;
}

export interface InstructRow {
  size: string;
  modelId: string;
  label: string;
  cot: ArmStats;
  direct: ArmStats;
}

type RawArm = {
  n: number;
  correct: number;
  accuracy: number;
  median_tokens: number;
  truncated: number;
  unboxed: number;
  by_level: Record<string, { n: number; correct: number; accuracy: number | null }>;
  wrote_code?: number;
  short_replies?: number;
  short_share?: number;
};
type RawProblem = { unique_id: string; level: number; subject: string; problem: string; answer: string };
type RawPaired = { size?: string; a: string; b: string; n: number; both: number; neither: number; a_only: number; b_only: number };

const D = rawDerived as unknown as {
  provenance: {
    runs: Record<string, { notebook: string; traces_sha256: string; records: number; models: string[] }>;
    solutions_sha256: string;
    decoding: { strategy: string; dtype: string; max_new_tokens: number; repetition_penalty: number; hardware: string };
    grader: string;
    problems: { source: string; n: number; excluded: string };
    builder: string;
    builder_sha256: string;
  };
  section_1: { examples: (RawProblem & { solution: string })[]; test_problems: RawProblem[] };
  models: { size: string; model_id: string; label: string; kind: "base" | "instruct"; arms: Record<string, RawArm> }[];
  paired: Record<"few_vs_zero" | "instruct_cot_vs_base_few" | "cot_vs_direct", RawPaired[]>;
  section_4: {
    models: { size: string; label: string; cot_accuracy: number; direct_accuracy: number; direct_short_share: number }[];
    cross: RawPaired;
  };
};

const N = D.provenance.problems.n;

function fail(message: string): never {
  throw new Page05DataError(`page-05-derived.json: ${message}`);
}

function arm(raw: RawArm, what: string): ArmStats {
  if (raw.n !== N) fail(`${what} covers ${raw.n} problems, not the ${N} every figure compares`);
  if (Math.abs(raw.correct / raw.n - raw.accuracy) > 1e-9) {
    fail(`${what} reports ${raw.correct}/${raw.n} but an accuracy of ${raw.accuracy}`);
  }
  const byLevel = Object.entries(raw.by_level).map(([level, v]) => ({
    level: Number(level),
    n: v.n,
    correct: v.correct,
    accuracy: v.accuracy ?? 0,
  }));
  const sum = (k: "n" | "correct") => byLevel.reduce((a, v) => a + v[k], 0);
  if (sum("n") !== raw.n || sum("correct") !== raw.correct) {
    fail(`${what}'s levels do not add up to its total`);
  }
  return {
    n: raw.n,
    correct: raw.correct,
    accuracy: raw.accuracy,
    medianTokens: raw.median_tokens,
    truncated: raw.truncated,
    unboxed: raw.unboxed,
    byLevel,
    wroteCode: raw.wrote_code,
    shortReplies: raw.short_replies,
    shortShare: raw.short_share,
  };
}

const problem = (r: RawProblem): Problem => ({
  uniqueId: r.unique_id,
  level: r.level,
  subject: r.subject,
  problem: r.problem,
  answer: r.answer,
});

const paired = (r: RawPaired): PairedCounts => ({
  size: r.size,
  a: r.a,
  b: r.b,
  n: r.n,
  both: r.both,
  neither: r.neither,
  aOnly: r.a_only,
  bOnly: r.b_only,
});

const SIZES = ["1.5B", "3B", "7B"] as const;

const modelOf = (kind: "base" | "instruct", size: string) =>
  D.models.find((m) => m.kind === kind && m.size === size) ?? fail(`no ${kind} ${size} model`);

const base: BaseRow[] = SIZES.map((s) => {
  const m = modelOf("base", s);
  return {
    size: s,
    modelId: m.model_id,
    label: m.label,
    zeroShot: arm(m.arms.zero_shot, `${m.label} zero-shot`),
    fewShot: arm(m.arms.few_shot, `${m.label} few-shot`),
  };
});

const instruct: InstructRow[] = SIZES.map((s) => {
  const m = modelOf("instruct", s);
  return {
    size: s,
    modelId: m.model_id,
    label: m.label,
    cot: arm(m.arms.CoT, `${m.label} CoT`),
    direct: arm(m.arms.Direct, `${m.label} Direct`),
  };
});

/**
 * A paired table has to agree with the two arms it pairs: its cells add up to n,
 * and "both" plus each arm's own column is that arm's solve count.
 */
function checkPaired(p: PairedCounts, a: ArmStats, b: ArmStats, what: string) {
  if (p.both + p.neither + p.aOnly + p.bOnly !== p.n || p.n !== N) fail(`${what}: the cells do not add up to ${N}`);
  if (p.both + p.aOnly !== a.correct || p.both + p.bOnly !== b.correct) {
    fail(`${what}: the paired counts disagree with the two arms' solve counts`);
  }
}

const pairs = {
  fewVsZero: D.paired.few_vs_zero.map(paired),
  instructVsFew: D.paired.instruct_cot_vs_base_few.map(paired),
  cotVsDirect: D.paired.cot_vs_direct.map(paired),
};
SIZES.forEach((s, i) => {
  checkPaired(pairs.fewVsZero[i], base[i].fewShot, base[i].zeroShot, `${s} few-shot vs zero-shot`);
  checkPaired(pairs.instructVsFew[i], instruct[i].cot, base[i].fewShot, `${s} instruct vs few-shot`);
  checkPaired(pairs.cotVsDirect[i], instruct[i].cot, instruct[i].direct, `${s} CoT vs Direct`);
});

// Section 4 repeats the instruct arms' accuracies; the two copies must agree.
D.section_4.models.forEach((m, i) => {
  if (m.cot_accuracy !== instruct[i].cot.accuracy || m.direct_accuracy !== instruct[i].direct.accuracy) {
    fail(`section 4's ${m.label} disagrees with its arms`);
  }
});
const cross = paired(D.section_4.cross);
const SMALL = instruct[0];
const LARGE = instruct[instruct.length - 1];
checkPaired(cross, SMALL.cot, LARGE.direct, "section 4's cross comparison");

if (D.section_1.examples.length !== 5 || D.section_1.test_problems.length !== 3) {
  fail("section 1 needs five examples and three test problems");
}

export const PAGE5 = {
  provenance: D.provenance,
  /** Problems every figure is drawn on. */
  n: N,
  examples: D.section_1.examples.map((e): Example => ({ ...problem(e), solution: e.solution })),
  testProblems: D.section_1.test_problems.map(problem),
  base,
  instruct,
  paired: pairs,
  section4: {
    /** The smallest model reasoning against the largest answering directly. */
    small: SMALL,
    large: LARGE,
    cross,
  },
} as const;

/**
 * Display-only tidying for figure 1's prompt text. The worked solutions use display
 * maths that `tidyMath` leaves alone (it was written for model traces): `align*`
 * environments with `&` alignment marks and `\\` line breaks, and `\[ ... \]` blocks.
 * Those become plain lines, then `tidyMath` does the rest. An [asy] diagram is code
 * the model read, so it is left exactly as written.
 */
export function tidyPrompt(text: string): string {
  return text
    .split(/(\[asy\][\s\S]*?\[\/asy\])/)
    .map((part, i) => {
      if (i % 2 === 1) return part;
      const plain = part
        .replace(/\\begin\{align\*?\}\s*/g, "\n")
        .replace(/\s*\\end\{align\*?\}/g, "\n")
        .replace(/\\\[\s*/g, "\n")
        .replace(/\s*\\\]/g, "\n")
        .replace(/\s*\\\\\s*/g, "\n")
        .replace(/(^|[^\\])&\s?/gm, "$1")
        // `2\cdot\frac{AB}{AC}` would flatten to the unknown macro `\cdotAB`.
        .replace(/\s*\\cdot\s*/g, " · ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\n+/, "");
      return tidyMath(plain);
    })
    .join("");
}

/**
 * The few-shot prompt exactly as the notebook built it: each example as
 * "Problem:" and "Solution:", then the test problem and an open "Solution:" for
 * the model to continue. The zero-shot prompt is the last block alone.
 */
export const exampleBlock = (e: Example) => `Problem:\n${e.problem}\n\nSolution:\n${e.solution}\n\n`;
export const questionBlock = (p: Problem) => `Problem:\n${p.problem}\n\nSolution:\n`;
export const fewShotPrompt = (p: Problem) => PAGE5.examples.map(exampleBlock).join("") + questionBlock(p);
