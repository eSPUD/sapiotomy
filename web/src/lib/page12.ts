/**
 * Page 12's measured harvest, loaded from the notebook's committed `derived.json`.
 *
 * `web/data/page-12-derived.json` is `notebooks/out/page_12/derived.json`, built by
 * `page_12_site_data.py` from what `page_12_star_harvest.ipynb` saved. The run is page
 * 7's pile replayed: 100 MATH-500 problems, 16 chains each from Qwen2.5-3B-Instruct, and
 * STaR's filter applied to them. Nothing is trained.
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

export type Rule = "key" | "popular";

export interface Chain {
  sample_index: number;
  trace: string;
  extracted_answer: string;
  correct: boolean;
  truncated: boolean;
  tokens_generated: number;
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
  /** The chains the page can open, keyed by their index in sample order. */
  chains: Record<string, Chain>;
  /** The same question asked once more, greedily, with the answer as a hint. */
  hint: HintChain | null;
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
export function harvest(p: Pick<Problem, "correct" | "cls">, k: number, rule: Rule): number[] {
  const idx = Array.from({ length: k }, (_, j) => j);
  if (rule === "key") return idx.filter((j) => p.correct[j]);
  const top = popular(p.cls, k);
  return top === null ? [] : idx.filter((j) => p.cls[j] === top);
}

export type CellState = "right" | "wrong" | "hint" | "none";

/**
 * What one problem contributes to the training set. The hint retry is STaR's second
 * chance and only exists under the answer key: a problem with no right chain among the
 * first k gets a lesson when its hinted chain reached the answer.
 */
export function cellState(p: Problem, k: number, rule: Rule, useHint: boolean): CellState {
  const kept = harvest(p, k, rule);
  if (kept.length) return p.correct[kept[0]] ? "right" : "wrong";
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
  for (const rule of ["key", "popular"] as const) {
    for (const pt of d.curves[rule]) {
      const mine = curvePoint(d.problems, pt.k, rule);
      if (JSON.stringify(mine) !== JSON.stringify(pt)) {
        throw new Page12DataError(`${rule} at k=${pt.k}: page computes ${JSON.stringify(mine)}, notebook ${JSON.stringify(pt)}`);
      }
    }
  }
  // Every chain the page can open must be one the filter would keep somewhere.
  for (const p of d.problems) {
    for (const rule of ["key", "popular"] as const) {
      for (let k = 1; k <= d.n_chains; k++) {
        const first = harvest(p, k, rule)[0];
        if (first !== undefined && !(String(first) in p.chains)) {
          throw new Page12DataError(`${p.problem_id}: chain ${first} is kept under ${rule} at k=${k} but not bundled`);
        }
      }
    }
  }
  for (const p of d.problems) {
    if (!("0" in p.chains)) throw new Page12DataError(`${p.problem_id}: its first chain is not bundled`);
  }
  if (!d.claims.key_keeps_no_wrong_chain || !d.claims.popular_keeps_wrong_chains) {
    throw new Page12DataError("the run does not support the section's two claims");
  }
  // Most right chains first, so the grid fills from the left as attempts rise.
  const nRight = (p: Problem) => p.correct.filter(Boolean).length;
  const order = [...d.problems].sort(
    (a, b) => nRight(b) - nRight(a) || a.problem_id.localeCompare(b.problem_id),
  );
  return { ...d, order };
}

export const PAGE12 = load(rawDerived);

export const hasHint = PAGE12.hint !== null && PAGE12.problems.every((p) => p.hint !== null);

export const modelLabel = PAGE12.manifest.model_id.split("/").pop()!;
