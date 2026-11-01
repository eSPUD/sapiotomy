/**
 * Page 12's measured harvest, loaded from the notebook's committed `derived.json`.
 *
 * `web/data/page-12-derived.json` is `notebooks/out/page_12/derived.json`, built by
 * `page_12_site_data.py` from what `page_12_star_harvest.ipynb` saved. The run is page
 * 7's pile replayed: 100 MATH-500 problems, 16 chains each from Qwen2.5-3B-Instruct, and
 * STaR's filter applied to them. Nothing is trained.
 *
 * Page 9's step scores over the same chains ride along: the third rule keeps a chain when
 * page 9's process reward model passes every step, and each openable chain carries its steps.
 *
 * The page lets the reader change the rule and the number of attempts, so it has to
 * recompute what the filter keeps. `harvest` and `popular` below are the notebook's two
 * functions translated, and the load step re-derives every point of the notebook's curves
 * with them. A translation that drifts from the notebook is a load error, not a figure.
 */
import rawDerived from "@data/page-12-derived.json";
import { tidyMath } from "./traceText";

export { tidyMath };

export class Page12DataError extends Error {}

export type Rule = "key" | "popular" | "prm";

export const RULES: readonly Rule[] = ["key", "popular", "prm"];

export interface Chain {
  sample_index: number;
  trace: string;
  extracted_answer: string;
  correct: boolean;
  truncated: boolean;
  tokens_generated: number;
  /** Page 9's steps as [start, end, score] spans of `trace`; null when page 9 never graded it. */
  steps: [number, number, number][] | null;
}

export interface Problem {
  problem_id: string;
  level: number;
  subject: string;
  question: string;
  ground_truth: string;
  /** One verdict per chain, in sample order. */
  correct: boolean[];
  /** The answer class each chain landed in (ch03 equivalence), -1 for no answer. */
  cls: number[];
  labels: string[];
  greedy_correct: boolean;
  /** Whether page 9's step grader passed each chain; null for a chain it never graded. */
  prm_pass: (boolean | null)[];
  /** The chains the page can open, keyed by their index in sample order. */
  chains: Record<string, Chain>;
  /** STaR's own setting: the one chain decoded greedily. Page 9 never scored these. */
  greedy: GreedyChain;
  /** The same question asked once more, greedily, with the answer as a hint. */
  hint: HintChain | null;
}

export interface GreedyChain {
  trace: string;
  extracted_answer: string;
  correct: boolean;
  truncated: boolean;
  tokens_generated: number;
}

export interface HintChain {
  trace: string;
  answer: string;
  correct: boolean;
  mentions_hint: boolean;
  truncated: boolean;
  tokens_generated: number;
}

export interface CurvePoint {
  k: number;
  problems_with_lesson: number;
  problems_all_wrong: number;
  chains_kept: number;
  chains_wrong: number;
}

interface Derived {
  manifest: {
    run_id: string;
    model_id: string;
    pool_config: string;
    temperature: number;
    chain_cap: number;
    n_items: number;
    n_chains: number;
  };
  claims: Record<string, boolean>;
  n_chains: number;
  curves: Record<Rule, CurvePoint[]>;
  greedy_lessons: number;
  vote_missed: string[];
  never: string[];
  prm: {
    model_id: string;
    threshold: number;
    right_rejected: number;
    right_total: number;
    lost: string[];
    never_passed: string[];
  };
  hint: {
    template: string;
    n_missed: number;
    n_retried: number;
    recovered: string[];
    recovered_never: string[];
    mentions_hint: string[];
  } | null;
  problems: Problem[];
}

/** The class most of the first k chains agree on; a tie, or no answers, is null. */
export function popular(cls: number[], k: number): number | null {
  const tally = new Map<number, number>();
  for (const c of cls.slice(0, k)) if (c >= 0) tally.set(c, (tally.get(c) ?? 0) + 1);
  if (tally.size === 0) return null;
  const ranked = [...tally.values()].sort((a, b) => b - a);
  if (ranked.length > 1 && ranked[0] === ranked[1]) return null;
  for (const [c, n] of tally) if (n === ranked[0]) return c;
  return null;
}

/** The chains among the first k that the filter keeps, as indices in sample order. */
export function harvest(p: Pick<Problem, "correct" | "cls" | "prm_pass">, k: number, rule: Rule): number[] {
  const idx = Array.from({ length: k }, (_, j) => j);
  if (rule === "key") return idx.filter((j) => p.correct[j]);
  if (rule === "prm") return idx.filter((j) => p.prm_pass[j] === true);
  const top = popular(p.cls, k);
  return top === null ? [] : idx.filter((j) => p.cls[j] === top);
}

export type CellState = "right" | "wrong" | "hint" | "none";

/** The kept chain the page opens: the first wrong one if any got in, else the first. */
export function shownChain(p: Pick<Problem, "correct">, kept: number[]): number | undefined {
  return kept.find((j) => !p.correct[j]) ?? kept[0];
}

/**
 * What one problem contributes to the training set: any wrong answer kept makes it
 * "wrong". The hint retry is STaR's second chance and only exists under the answer key:
 * a problem with no right chain among the first k gets a lesson when its hinted chain
 * reached the answer.
 */
export function cellState(p: Problem, k: number, rule: Rule, useHint: boolean): CellState {
  const kept = harvest(p, k, rule);
  if (kept.length) return kept.every((j) => p.correct[j]) ? "right" : "wrong";
  if (useHint && rule === "key" && p.hint?.correct) return "hint";
  return "none";
}

export function curvePoint(problems: Problem[], k: number, rule: Rule): CurvePoint {
  let withLesson = 0, allWrong = 0, kept = 0, wrong = 0;
  for (const p of problems) {
    const h = harvest(p, k, rule);
    const w = h.filter((j) => !p.correct[j]).length;
    if (h.length) withLesson += 1;
    if (h.length && w === h.length) allWrong += 1;
    kept += h.length;
    wrong += w;
  }
  return { k, problems_with_lesson: withLesson, problems_all_wrong: allWrong, chains_kept: kept, chains_wrong: wrong };
}

function load(raw: unknown): Derived & { order: Problem[] } {
  const d = raw as Derived;
  if (d.problems.length !== d.manifest.n_items) {
    throw new Page12DataError(`${d.problems.length} problems bundled, manifest says ${d.manifest.n_items}`);
  }
  for (const rule of RULES) {
    for (const pt of d.curves[rule]) {
      const mine = curvePoint(d.problems, pt.k, rule);
      if (JSON.stringify(mine) !== JSON.stringify(pt)) {
        throw new Page12DataError(`${rule} at k=${pt.k}: page computes ${JSON.stringify(mine)}, notebook ${JSON.stringify(pt)}`);
      }
    }
  }
  // Every chain the page can open must be bundled.
  for (const p of d.problems) {
    for (const rule of RULES) {
      for (let k = 1; k <= d.n_chains; k++) {
        const j = shownChain(p, harvest(p, k, rule));
        if (j !== undefined && !(String(j) in p.chains)) {
          throw new Page12DataError(`${p.problem_id}: chain ${j} is kept under ${rule} at k=${k} but not bundled`);
        }
      }
    }
  }
  for (const p of d.problems) {
    if (!("0" in p.chains)) throw new Page12DataError(`${p.problem_id}: its first chain is not bundled`);
    if (p.greedy.correct !== p.greedy_correct) throw new Page12DataError(`${p.problem_id}: its greedy chain disagrees with its verdict`);
  }
  if (d.problems.filter((p) => p.greedy_correct).length !== d.greedy_lessons) {
    throw new Page12DataError("the greedy chains do not add up to the notebook's greedy lessons");
  }
  if (d.hint && d.problems.filter((p) => !p.greedy_correct).length !== d.hint.n_missed) {
    throw new Page12DataError("the hint retry's misses are not the greedy chains' misses");
  }
  for (const p of d.problems) {
    for (const [j, c] of Object.entries(p.chains)) {
      const pass = p.prm_pass[Number(j)];
      if ((c.steps === null) !== (pass === null)) throw new Page12DataError(`${p.problem_id}: chain ${j}'s steps disagree with its grade`);
      if (c.steps && c.steps.every((s) => s[2] >= d.prm.threshold) !== pass) {
        throw new Page12DataError(`${p.problem_id}: chain ${j}'s step scores disagree with its grade`);
      }
    }
  }
  const claims = ["key_keeps_no_wrong_chain", "popular_keeps_wrong_chains", "prm_keeps_wrong_chains", "prm_rejects_right_chains"];
  if (!claims.every((c) => d.claims[c])) {
    throw new Page12DataError("the run does not support the section's claims");
  }
  // Most right chains first, so the grid fills from the left as attempts rise.
  const nRight = (p: Problem) => p.correct.filter(Boolean).length;
  const order = [...d.problems].sort(
    (a, b) => nRight(b) - nRight(a) || a.problem_id.localeCompare(b.problem_id),
  );
  return { ...d, order };
}

export const PAGE12 = load(rawDerived);

/**
 * The problems the figure walks through, in order, each with the one thing it shows.
 * `page12.test.ts` checks that the data still says what each note says.
 */
export const WALK: readonly { id: string; note: string }[] = [
  { id: "test/algebra/2064.json", note: "the greedy chain is right, so its reasoning goes in" },
  { id: "test/algebra/224.json", note: "the greedy chain misses; with the answer as a hint, the model finds the route" },
  { id: "test/number_theory/357.json", note: "the greedy chain misses; with the hint, the model reaches the answer by leaning on it" },
  { id: "test/number_theory/737.json", note: "the greedy chain misses, and so does the hinted retry" },
];

export const walked: Problem[] = WALK.map(({ id }) => {
  const p = PAGE12.problems.find((q) => q.problem_id === id);
  if (!p) throw new Page12DataError(`${id} is walked by the figure but not in the run`);
  return p;
});

export const hasHint = PAGE12.hint !== null && PAGE12.problems.every((p) => p.hint !== null);

export const modelLabel = PAGE12.manifest.model_id.split("/").pop()!;
