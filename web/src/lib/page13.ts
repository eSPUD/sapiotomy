/**
 * Page 13's measured run: GRPO on Qwen2.5-1.5B-Instruct, loaded from
 * `web/data/page-13-two-axis.json`.
 *
 * That file is built by `notebooks/page_13_site_data.py` from the outputs saved in
 * `notebooks/page_13_two_axis_grpo.ipynb` (the author's Colab run, v3: full fine-tune,
 * difficulty-filtered GSM8K prompts, 400 steps). Six checkpoints were each evaluated on
 * the same 600 GSM8K test problems with 32 chains apiece. Per checkpoint:
 *
 *  - `pass1`: one chain's accuracy, averaged over all 32 chains (the precise estimate);
 *  - `maj[k]`: the majority answer of the first k chains (`maj[1]` is the first chain alone);
 *  - `budget[b]`: the first chain cut off after b tokens and graded on what it wrote;
 *  - `pass_at_k_max`: any of the 32 chains right.
 *
 * The load step checks the shape the page relies on, so a rebuilt file that drifts is a
 * load error, not a quietly wrong figure.
 */
import raw from "@data/page-13-two-axis.json";

export class Page13DataError extends Error {}

export interface Checkpoint {
  step: number;
  pass1: number;
  pass1_se: number;
  mean_len: number;
  frac_truncated: number;
  maj: Record<string, number>;
  budget: Record<string, number>;
  pass_at_k_max: number;
}

export interface Run {
  model: string;
  dataset: string;
  gpu: string;
  full_finetune: boolean;
  rl_steps: number;
  prompts_per_step: number;
  chains_per_prompt: number;
  learning_rate: number;
  filter_kept: number;
  filter_screened: number;
  train_minutes: number;
  n_eval: number;
  k: number;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface Page13Data {
  source: { notebook: string; sha256: string };
  run: Run;
  checkpoints: Checkpoint[];
  train_log: { step: number; reward: number; length: number }[];
}

function load(d: Page13Data): Page13Data {
  const steps = d.checkpoints.map((c) => c.step);
  if (steps[0] !== 0 || steps.at(-1) !== d.run.rl_steps)
    throw new Page13DataError(`checkpoints must run from 0 to ${d.run.rl_steps}, got ${steps.join(", ")}`);
  if (steps.some((s, i) => i > 0 && s <= steps[i - 1]))
    throw new Page13DataError("checkpoints must be in increasing step order");
  const budgets = Object.keys(d.checkpoints[0].budget).join(",");
  for (const c of d.checkpoints) {
    if (Object.keys(c.budget).join(",") !== budgets)
      throw new Page13DataError(`step ${c.step} has different budgets`);
    if (!(String(d.run.k) in c.maj)) throw new Page13DataError(`step ${c.step} has no majority of ${d.run.k}`);
  }
  return d;
}

export const PAGE13 = load(raw as Page13Data);

export const RUN = PAGE13.run;
export const CHECKPOINTS = PAGE13.checkpoints;
export const BASE = CHECKPOINTS[0];
export const FINAL = CHECKPOINTS[CHECKPOINTS.length - 1];
/** The thinking budgets, in tokens, ascending. */
export const BUDGETS = Object.keys(BASE.budget)
  .map(Number)
  .sort((a, b) => a - b);

/** A proportion as a percentage, one decimal. */
export const pct = (p: number) => Math.round(p * 1000) / 10;

/** "Qwen2.5-1.5B-Instruct", without the organisation. */
export const modelLabel = RUN.model.split("/").pop()!;

/* ---------------------------------------------------------------------------
 * Section 5b: the distillation run (notebooks/page_13_distill_grpo_into_0.5B.ipynb).
 * Not run yet: DISTILL is null and the section draws its placeholder. Once the
 * run exists, page_13_site_data.py writes data/page-13-distill.json in this
 * shape and DISTILL loads it. Proportions are 0-1, as in page-13-two-axis.json.
 * ------------------------------------------------------------------------- */

/** What the 0.5B student was fine-tuned on: the notebook's student arms. */
export type DistillSource = "none" | "self" | "base15" | "grpo15";

export interface DistillChain {
  question: string;
  /** The kept chain the student was trained on, drawn at random from the matched pool. */
  text: string;
  n_tokens: number;
}

export interface DistillArm {
  /** pass@1 on the 600 test problems, averaged over the SFT seeds ("none": the one untrained model). */
  pass1: number;
  pass1_by_seed: number[];
  /** One training chain from this source; null for "none", which read nothing. */
  chain: DistillChain | null;
}

export interface DistillRun {
  student: string;
  teacher: string;
  /** The 1.5B teacher before and after GRPO, re-measured in the distillation run. */
  teacher_before: number;
  teacher_after: number;
  /** Training problems in the matched pool: each source contributes one chain per problem. */
  n_pool: number;
  arms: Record<DistillSource, DistillArm>;
  /** (student on after-RL chains - student on before-RL chains) / (teacher after - teacher before), with its 95% interval. */
  transfer: { mean: number; lo: number; hi: number };
}

export const DISTILL: DistillRun | null = null;
