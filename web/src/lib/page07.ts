/**
 * Page 7's measured run, loaded from `web/data/page-07-run.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads them. Nothing
 * here recomputes a claim. The file is built by `notebooks/page_7_site_data.py` from the chains
 * `notebooks/7_FrequencyVoting_InstructModels.ipynb` saves: Qwen2.5-3B-Instruct, 100 MATH-500
 * problems drawn at random within each level (the 500's own level mix), 16 chains per problem
 * at each of 12 temperatures, 0.0 to 1.1, every chain capped at 2,048 tokens and left to stop
 * where it stops. A chain that hits the cap has no answer and casts no vote.
 *
 * Section 3's lines, bars and best temperature come from the sweep. The two problems figure 1
 * shows are DRAWN at random from stated pools by the builder, not picked (`showcase.rule`).
 *
 * The consistency checks below are the cross-language check in miniature: the sweep's aggregates
 * have to agree with each other arithmetically, and a shown problem's tally has to be the chains
 * it ships. A copy-paste of the wrong run into `web/data/` fails the build rather than drawing a
 * plausible wrong figure.
 *
 * Page 16 reads `figure2.cold` and `figure2.hot` (the greedy line and the best temperature's
 * line) and `handoff`; page 8 opens on `handoff`.
 */
import rawRun from "@data/page-07-run.json";
import { pct, tidyMath } from "./traceText";

export { pct, tidyMath };

export class Page07DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

export interface SweepPoint {
  n: number;
  accuracy: number;
  coverage: number;
  tie_rate: number;
  /** Tokens written by the N chains, per problem. */
  mean_tokens: number;
}

interface SweepSummary {
  temperature: number;
  n_problems: number;
  vote_accuracy: number;
  coverage: number;
  single_chain_accuracy: number;
  tie_rate: number;
  mean_distinct: number;
  mean_tokens: number;
  capped_rate: number;
}

export interface SpecimenChain {
  sample_index: number;
  trace: string;
  /** What the chain boxed, verbatim; "" when it never boxed an answer. */
  extracted_answer: string;
  /** The tally row the chain voted for (its answer's first-seen spelling); null with no answer. */
  vote_key: string | null;
  correct: boolean;
  own_tokens: number;
  truncated: boolean;
}

interface RawRanked {
  answer: string;
  votes: number;
  correct: boolean;
}

export interface Problem {
  problem_id: string;
  level: number;
  subject: string;
  question: string;
  ground_truth: string;
  temperature: number;
  chain_cap: number;
  ranked: RawRanked[];
  distinct_answers: number;
  plurality_answer: string | null;
  plurality_correct: boolean;
  tie: boolean;
  any_correct: boolean;
  no_answer_rate: number;
  chains: SpecimenChain[];
}

/** How a shown problem's vote came out. */
export type Outcome = "right" | "wrong" | "tie";
export type ShowcaseOutcome = Exclude<Outcome, "wrong">;

interface RawShowcasePick {
  outcome: ShowcaseOutcome;
  /** How many problems qualified for the draw this one came from. */
  pool_size: number;
  problem: Problem;
  /** The same problem's one greedy chain. */
  greedy: { own_tokens: number; extracted_answer: string; correct: boolean; truncated: boolean };
}

interface RawRun {
  source: {
    notebook: string;
    model: string;
    precision: string;
    dataset: string;
    n_problems: number;
    levels: Record<string, number>;
    n_chains: number;
    chain_cap: number;
    top_p: number;
    seed: number;
  };
  n_chains: number;
  chain_cap: number;
  temperatures: number[];
  best_temperature: number;
  n_axis: number[];
  summary: SweepSummary[];
  curves: Record<string, SweepPoint[]>;
  handoff: {
    n_chains: number;
    temperature: number;
    n_items: number;
    single_chain_accuracy: number;
    plurality_accuracy: number;
    coverage: number;
    thrown_away: number;
    tie_rate: number;
  };
  showcase: { temperature: number; seed: number; rule: string; picks: RawShowcasePick[] };
}

const R = rawRun as unknown as RawRun;

/* ------------------------------------------------------- consistency checks */

function near(a: number, b: number, tol: number, what: string): void {
  if (Math.abs(a - b) > tol) {
    throw new Page07DataError(`${what}: ${a} and ${b} disagree by more than ${tol}`);
  }
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

if (R.source.n_problems !== 100 || R.n_chains !== 16) {
  throw new Page07DataError("page-07-run.json is not the 100-problem, 16-chain run the page describes");
}
if (!R.source.precision) {
  throw new Page07DataError("page-07-run.json records no precision for the model");
}

// Every temperature has a summary row and a line, and the line's ends are the summary:
// N = 16 is the whole set of chains, N = 1 is one chain, averaged.
R.temperatures.forEach((t, j) => {
  const s = R.summary[j];
  const line = R.curves[t.toFixed(1)];
  if (!s || s.temperature !== t || s.n_problems !== R.source.n_problems) {
    throw new Page07DataError(`the summary row for T = ${t} is missing or out of order`);
  }
  if (!line || line.map((p) => p.n).join() !== R.n_axis.join()) {
    throw new Page07DataError(`the T = ${t} line is not on the run's N axis`);
  }
  const top = line[line.length - 1];
  if (
    !close(top.accuracy, s.vote_accuracy) ||
    !close(top.coverage, s.coverage) ||
    !close(top.tie_rate, s.tie_rate) ||
    !close(line[0].accuracy, s.single_chain_accuracy)
  ) {
    throw new Page07DataError(`the T = ${t} line disagrees with its summary`);
  }
  // Coverage can never be below the vote: the vote returns one of the answers present.
  for (const p of line) {
    if (p.coverage + 1e-9 < p.accuracy) {
      throw new Page07DataError(`T = ${t}: coverage ${p.coverage} is below the vote ${p.accuracy} at N=${p.n}`);
    }
  }
});

// Temperature 0 is sixteen copies of one greedy chain, so its line is flat. That is the
// page's cleanest demonstration that the vote needs diversity: checked, not assumed.
const COLD_POINTS = R.curves["0.0"];
if (!COLD_POINTS || COLD_POINTS.some((p) => !close(p.accuracy, COLD_POINTS[0].accuracy))) {
  throw new Page07DataError("the T = 0 line is not flat, so it is not one greedy chain");
}

// The best temperature is the one the summary names: most problems right, the lower on a tie.
const BEST = [...R.summary].sort(
  (a, b) => b.vote_accuracy - a.vote_accuracy || a.temperature - b.temperature,
)[0];
if (BEST.temperature !== R.best_temperature) {
  throw new Page07DataError(`the run names T = ${R.best_temperature} as best, not T = ${BEST.temperature}`);
}
const HOT_POINTS = R.curves[R.best_temperature.toFixed(1)];

// The handoff is the best temperature's full set of chains.
near(R.handoff.plurality_accuracy, BEST.vote_accuracy, 1e-9, "the handoff's vote");
near(R.handoff.coverage, BEST.coverage, 1e-9, "the handoff's coverage");
near(R.handoff.thrown_away, R.handoff.coverage - R.handoff.plurality_accuracy, 1e-9, "the thrown-away share");

/* ---------------------------------------------------------- figure 1's problems */

const outcomeOf = (p: Problem): Outcome => (p.tie ? "tie" : p.plurality_correct ? "right" : "wrong");

export const SHOWCASE = R.showcase.picks.map((pick) => {
  const { problem, outcome } = pick;
  if (outcomeOf(problem) !== outcome) {
    throw new Page07DataError(
      `figure 1 labels ${problem.problem_id} as a vote that comes out '${outcome}', but the run says '${outcomeOf(problem)}'.`,
    );
  }
  if (outcome !== "right" && !problem.any_correct) {
    throw new Page07DataError(`figure 1's '${outcome}' box ${problem.problem_id} has no correct chain in it.`);
  }
  // Each tally must account for every chain the box ships: the votes plus the chains that
  // wrote no answer. If these disagree the histogram draws a different pile than the one the
  // reader can open.
  const votes = problem.ranked.reduce((s, r) => s + r.votes, 0);
  const noAnswer = problem.chains.filter((c) => c.vote_key === null).length;
  if (votes + noAnswer !== problem.chains.length || problem.chains.length !== R.n_chains) {
    throw new Page07DataError(
      `${problem.problem_id} tallies ${votes} votes plus ${noAnswer} non-answers, but ships ${problem.chains.length} chains`,
    );
  }
  if (problem.ranked.length !== problem.distinct_answers) {
    throw new Page07DataError(`${problem.problem_id}'s ranked tally and distinct_answers disagree`);
  }
  for (const row of problem.ranked) {
    if (problem.chains.filter((c) => c.vote_key === row.answer).length !== row.votes) {
      throw new Page07DataError(`${problem.problem_id}: row '${row.answer}' is not the chains that voted for it`);
    }
  }
  return pick;
});

/** The chains that landed on one answer, in the order they were sampled. */
export function chainsFor(problem: Problem, answer: string): SpecimenChain[] {
  return problem.chains.filter((c) => c.vote_key === answer);
}

/**
 * A chain cut for reading: its opening paragraph (how it read the problem), its
 * last two (where it committed to an answer), and everything between folded away
 * for the reader to open. The question a reader brings to a wrong chain is where
 * it ended up, not every step of getting there.
 *
 * A cut at paragraph breaks, never inside one, so every word shown is still the
 * model's own and in its own order. A chain short enough that folding would hide
 * almost nothing is returned whole, with an empty middle.
 */
export function foldTrace(
  text: string,
  head = 1,
  tail = 2,
): { head: string[]; middle: string[]; tail: string[] } {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length <= head + tail + 1) return { head: paras, middle: [], tail: [] };
  return {
    head: paras.slice(0, head),
    middle: paras.slice(head, paras.length - tail),
    tail: paras.slice(paras.length - tail),
  };
}

/* --------------------------------------------------------------- the page */

export const PAGE7 = {
  run: R.source,
  /** The model as the run recorded it, label and precision. */
  primary: { label: R.source.model.split("/").pop() as string, precision: R.source.precision },

  /** Figure 1: two problems, 16 chains each, ranked. */
  figure1: {
    n_chains: R.n_chains,
    temperature: R.showcase.temperature,
    chain_cap: R.chain_cap,
    /** The two boxes the reader switches between, the vote right first. */
    showcase: SHOWCASE,
    specimen: SHOWCASE[0].problem,
    showcaseRule: R.showcase.rule,
  },

  /** The temperature sweep: a line per temperature over the N axis, T = 0 the greedy chain. */
  sweep: {
    n_chains: R.n_chains,
    chain_cap: R.chain_cap,
    temperatures: R.temperatures,
    best_temperature: R.best_temperature,
    n_axis: R.n_axis,
    summary: R.summary,
    curves: R.curves,
    n_problems: R.source.n_problems,
    levels: R.source.levels,
  },

  /** Figure 2's two reference lines. */
  figure2: {
    hot: { temperature: R.best_temperature, points: HOT_POINTS },
    cold: { temperature: 0, points: COLD_POINTS },
  },

  /** The one number the page closes on, and page 8 opens on. */
  handoff: R.handoff,
} as const;

/** Formats a p-value the way the deck does elsewhere. */
export const pLabel = (p: number): string =>
  p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(p < 0.01 ? 4 : 3)}`;

/** Thousands separators, matching page 6. */
export const tokens = (n: number): string => Math.round(n).toLocaleString("en-US");
