/**
 * Page 7's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-07-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_07/derived.json`, produced by
 * `page_07_frequency_voting.ipynb` from `traces.jsonl`, and the page ships the
 * file it draws from beside a download of the file that file came from.
 *
 * The run carries an explicit `claims` block, so the gates below read it rather
 * than re-deriving it. A run that fails a blocking gate is a load error here,
 * never a conditional in the component:
 *
 *   · `vote_beats_bare_cot` — the page's sentence. Bare chain of thought is ONE
 *     GREEDY chain, which is page 5's `bare` condition and page 6's top rung,
 *     not one sampled chain. The run tests both and this is the one that blocks.
 *   · `coverage_exceeds_vote` — there is a gap between what the model produced
 *     and what the vote returned, which is the number page 8 opens on.
 *   · `specimen_usable` — figure 1's specimen was found, not fallen back to.
 *   · `t0_vote_is_a_noop` — the temperature-0 chains really were identical, so
 *     the flat line is a measurement rather than an assumption.
 *
 * Two gates are deliberately NOT blocking, because they change what the page
 * SAYS rather than whether it ships, and both came back false on the shipped
 * run:
 *
 *   · `splitting_a_fixed_budget_pays` — false. At a fixed budget the best split
 *     is not to split, which is a finding and is drawn as one.
 *   · `errors_are_diffuse` — false at a 50% threshold. 41% of answer classes
 *     appear exactly once, so the page must lead with truth CONCENTRATING (the
 *     modal answer holds 9.9 of 16 votes) rather than with errors scattering.
 *
 * The consistency assertions are the cross-language check in miniature: the
 * notebook's aggregates have to agree with each other arithmetically, and the
 * bundled specimen's tallies have to sum to the chains it ships. A copy-paste of
 * the wrong run into `web/data/` fails the build rather than drawing a plausible
 * wrong figure.
 */
import rawDerived from "@data/page-07-derived.json";
import rawHeatmap from "@data/page-07-heatmap.json";
import { pct, tidyMath } from "./traceText";

export { pct, tidyMath };

export class Page07DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawChain {
  sample_index: number;
  batch_seed: number | null;
  group_index: number | null;
  trace: string;
  cut_index: number | null;
  answer_start: number | null;
  truncated: boolean;
  forced: boolean;
  extracted_answer: string;
  vote_key: string | null;
  correct: boolean;
  own_tokens: number;
  tokens_generated: number;
}

interface RawRanked {
  answer: string;
  votes: number;
  correct: boolean;
}

interface RawProblem {
  problem_id: string;
  level: number;
  subject: string;
  question: string;
  ground_truth: string;
  config_id: string;
  temperature: number;
  chain_cap: number;
  ranked: RawRanked[];
  distinct_answers: number;
  answer_entropy: number;
  plurality_answer: string | null;
  plurality_correct: boolean;
  tie: boolean;
  any_correct: boolean;
  no_answer_rate: number;
  chains: RawChain[];
}

interface RawPilePoint {
  n: number;
  accuracy: number;
  coverage: number;
  tie_rate: number;
  /** What N chains actually cost. A chain stops long before the cap, so this is
   *  the real spend rather than N times the budget. */
  mean_tokens: number;
  n_draws: number;
}

interface RawSplitPoint {
  n: number;
  chain_budget: number;
  temperature: number;
  page_06_greedy: number | null;
  plurality_accuracy: number;
  accuracy: number;
  single_chain_accuracy: number;
  coverage: number;
  tie_rate: number;
  /** Real spend, not N times the budget: a chain stops before its cap. */
  mean_tokens: number;
  /** The column that explains the whole panel. At N=16 it is 1.0. */
  truncated_rate: number;
  n_items: number;
}

interface RawDiversity {
  temperature: number;
  n_chains: number;
  n_items: number;
  mean_distinct: number;
  mean_entropy: number;
  single_chain_accuracy: number;
  plurality_accuracy: number;
  coverage: number;
  tie_rate: number;
}

interface RawDerived {
  source: { results_sha256: string };
  manifest: {
    run_id: string;
    timestamp_utc: string;
    primary_model: string;
    run_mode: string;
    models: { id: string; label: string; quant: string | null; dtype: string | null }[];
    decoding: { top_p: number; temperatures: number[]; pile_temperature: number };
    pile: { chain_cap: number; n_chains: number; n_axis: number[]; n_resamples: number };
    split: { budget_total: number; n_grid: number[] };
    items: { dataset: string; n: number; seed: number; same_as_page_6: boolean | null };
    vote: { tie_rule: string; equivalence: string };
  };
  claims: Record<string, boolean>;
  procedure: string;
  figure_1: {
    config_id: string;
    n_chains: number;
    temperature: number;
    chain_cap: number;
    specimen_id: string;
    specimen_is_fallback: boolean;
    n_candidates: number;
    shape: {
      mean_distinct: number;
      singleton_share: number;
      mean_top_votes: number;
      n_chains: number;
    };
    problems: RawProblem[];
  };
  figure_2: {
    pile: { temperature: number; points: RawPilePoint[] }[];
    split: RawSplitPoint[];
    splitting_pays: boolean;
    best_split_n: number;
    diversity: RawDiversity[];
    gain: {
      vs_one_sample: { pts: number; p: number; fixed: number; broken: number; baseline: number };
      vs_bare_cot: {
        bare_cot: number;
        vote: number;
        gain_pts: number;
        p: number;
        fixed: number;
        broken: number;
        n_items: number;
      } | null;
      vote: number;
      n_chains: number;
    };
  };
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
  pool: { config_id: string; n_chains: number; chain_cap: number; temperature: number };
}

const D = rawDerived as unknown as RawDerived;

/* -------------------------------------------------------------- the gates */

/** Blocking: the spec's claims contract, read before any number reaches a component. */
const BLOCKING = [
  "vote_beats_bare_cot",
  "coverage_exceeds_vote",
  "specimen_usable",
  "t0_vote_is_a_noop",
] as const;

for (const gate of BLOCKING) {
  if (D.claims[gate] !== true) {
    throw new Page07DataError(
      `page-07-derived.json fails the blocking claim '${gate}'. The notebook decides what ` +
        `this page may say; a run that does not pass must not be translated. See ` +
        `docs/page_7_refactor.md and notebooks/page_07_frequency_voting.ipynb section 15.`,
    );
  }
}

if (D.manifest.run_mode === "QUICK") {
  throw new Page07DataError(
    "page-07-derived.json came from a QUICK run. QUICK is a preview on a reduced grid and " +
      "must not become a page.",
  );
}

if (D.figure_1.specimen_is_fallback) {
  throw new Page07DataError(
    "figure 1's specimen is the notebook's flagged fallback, which means no problem had a " +
      "correct plurality with a real tail. A flagged specimen must never be translated.",
  );
}

/* ------------------------------------------------------- consistency checks */

function near(a: number, b: number, tol: number, what: string): void {
  if (Math.abs(a - b) > tol) {
    throw new Page07DataError(`${what}: ${a} and ${b} disagree by more than ${tol}`);
  }
}

// The page prints the precision on its provenance plate, so the run has to record one.
// It shipped as `quant: null` for a while, with the page asserting bf16 out of a code
// literal: a claim on screen with nothing behind it in the artifact.
const PRIMARY_MODEL = D.manifest.models.find((m) => m.id === D.manifest.primary_model);
if (!PRIMARY_MODEL?.quant) {
  throw new Page07DataError(
    `page-07-derived.json records no precision for ${D.manifest.primary_model}, so the ` +
      `page cannot state one. A REPLAY reads it off the run id; see the notebook's ` +
      `model_meta block.`,
  );
}

const BARE = D.figure_2.gain.vs_bare_cot;
if (!BARE) {
  throw new Page07DataError(
    "the run has no bare-chain-of-thought contrast, so the page's headline sentence is " +
      "untested. The notebook writes it only when the temperature-0 pile is present.",
  );
}

// The gain is the difference of the two numbers the page prints beside it.
near(BARE.gain_pts, (BARE.vote - BARE.bare_cot) * 100, 1e-6, "the headline gain");
// The vote the contrast used is the vote the handoff reports.
near(BARE.vote, D.handoff.plurality_accuracy, 1e-9, "the vote");
// Thrown away is coverage minus the vote, and it is page 8's whole subject.
near(
  D.handoff.thrown_away,
  D.handoff.coverage - D.handoff.plurality_accuracy,
  1e-9,
  "the thrown-away share",
);

const PILE_LINES = D.figure_2.pile;
const HOT = PILE_LINES.find((l) => l.temperature === D.manifest.decoding.pile_temperature);
const COLD = PILE_LINES.find((l) => l.temperature === 0);
if (!HOT || !COLD) {
  throw new Page07DataError(
    "figure 2 needs both the sampled line and the temperature-0 line; one is missing.",
  );
}

// Temperature 0 is N copies of one greedy chain, so its line must be flat. That is the
// page's cleanest demonstration that the vote needs diversity, and it is checked rather
// than asserted: a wobble here would mean the replication rule leaked.
for (const p of COLD.points) {
  near(p.accuracy, COLD.points[0].accuracy, 1e-9, `the temperature-0 line at N=${p.n}`);
}
near(COLD.points[0].accuracy, BARE.bare_cot, 1e-9, "the flat line and bare chain of thought");

// Coverage can never be below the vote: the vote returns one of the answers present.
for (const line of PILE_LINES) {
  for (const p of line.points) {
    if (p.coverage + 1e-9 < p.accuracy) {
      throw new Page07DataError(
        `coverage ${p.coverage} is below the vote ${p.accuracy} at N=${p.n}, which is impossible`,
      );
    }
  }
}

// The split and the pile share their N=1 configuration, and since the notebook was
// changed to compute both with one estimator they must now agree there exactly. They
// used to differ by five points -- the split read chain 0 alone while the pile averaged
// every single draw -- and the page showed both numbers without saying so.
{
  const s1 = D.figure_2.split.find((s) => s.n === 1);
  const p1 = HOT.points.find((p) => p.n === 1);
  if (s1 && p1) near(s1.accuracy, p1.accuracy, 1e-9, "the split and the pile at N=1");
}

/* ------------------------------------------------------------ the specimen */

export interface SpecimenChain extends RawChain {}

export interface Problem extends Omit<RawProblem, "chains"> {
  chains: SpecimenChain[];
}

const PROBLEMS = D.figure_1.problems as Problem[];
const SPECIMEN = PROBLEMS.find((p) => p.problem_id === D.figure_1.specimen_id);
if (!SPECIMEN) {
  throw new Page07DataError(
    `figure 1 names ${D.figure_1.specimen_id} as its specimen but that problem is not bundled.`,
  );
}

/**
 * The two boxes figure 1 lets the reader switch between: the vote coming out right
 * (the notebook's specimen) and the vote tying (a bundled problem picked for it,
 * checked below rather than trusted, because the reader is told it in a label).
 * A third box, the vote coming out wrong (test/algebra/224, still bundled by
 * notebooks/page_07_site_data.py), was cut from the page on 2026-10-11 by the author.
 */
export type Outcome = "right" | "wrong" | "tie";
export type ShowcaseOutcome = Exclude<Outcome, "wrong">;

const SHOWCASE_PICKS: { id: string; outcome: ShowcaseOutcome }[] = [
  { id: D.figure_1.specimen_id, outcome: "right" },
  // Picked for being short and easy to follow. 7 chains say 5, which is right, and
  // 7 say 4, so the vote returns nothing.
  { id: "test/algebra/1837.json", outcome: "tie" },
];

const outcomeOf = (p: Problem): Outcome =>
  p.tie ? "tie" : p.plurality_correct ? "right" : "wrong";

export const SHOWCASE = SHOWCASE_PICKS.map(({ id, outcome }) => {
  const problem = PROBLEMS.find((p) => p.problem_id === id);
  if (!problem) {
    throw new Page07DataError(`figure 1 shows ${id} but that problem is not bundled.`);
  }
  if (outcomeOf(problem) !== outcome) {
    throw new Page07DataError(
      `figure 1 labels ${id} as a vote that comes out '${outcome}', but the run says ` +
        `'${outcomeOf(problem)}'.`,
    );
  }
  // The non-specimen boxes are there to show the right answer being lost, so it has
  // to be in the box for the reader to find.
  if (outcome !== "right" && !problem.any_correct) {
    throw new Page07DataError(`figure 1's '${outcome}' box ${id} has no correct chain in it.`);
  }
  return { outcome, problem };
});

// Each tally must account for every chain the box ships: the votes plus the chains
// that produced nothing usable. If these disagree the histogram is drawing a different
// pile than the one the reader can open.
for (const { problem } of SHOWCASE) {
  const votes = problem.ranked.reduce((s, r) => s + r.votes, 0);
  const noAnswer = Math.round(problem.no_answer_rate * problem.chains.length);
  if (votes + noAnswer !== problem.chains.length) {
    throw new Page07DataError(
      `${problem.problem_id} tallies ${votes} votes plus ${noAnswer} non-answers, but ships ` +
        `${problem.chains.length} chains`,
    );
  }
  if (problem.ranked.length !== problem.distinct_answers) {
    throw new Page07DataError(
      `${problem.problem_id}'s ranked tally and distinct_answers disagree`,
    );
  }
}

/* ----------------------------------------------------------- the heat map */

/**
 * The diversity family per problem: one cell per problem and temperature, how many
 * of its chains are right and how the vote came out. The notebook saves this family
 * only as one aggregate per temperature; `notebooks/page_07_heatmap.py` re-tallies
 * the same chains with the notebook's own vote and refuses to write unless it
 * reproduces those aggregates. It is checked again here, against the derived file
 * the rest of the page reads, so a heat map from another run fails the build.
 */
export interface HeatCell {
  temperature: number;
  n_correct: number;
  outcome: Outcome;
}

interface RawHeatmap {
  source: { run_id: string; results_sha256: string };
  n_chains: number;
  temperatures: number[];
  problems: { problem_id: string; level: number; subject: string; cells: HeatCell[] }[];
}

const HM = rawHeatmap as unknown as RawHeatmap;

if (HM.source.run_id !== D.manifest.run_id || HM.source.results_sha256 !== D.source.results_sha256) {
  throw new Page07DataError("the heat map was built from a different run than derived.json");
}
D.figure_2.diversity.forEach((d, j) => {
  const cells = HM.problems.map((p) => p.cells[j]);
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const avg = (f: (c: HeatCell) => number) => cells.reduce((s, c) => s + f(c), 0) / cells.length;
  if (
    HM.temperatures[j] !== d.temperature ||
    HM.n_chains !== d.n_chains ||
    HM.problems.length !== d.n_items ||
    cells.some((c) => c.temperature !== d.temperature) ||
    !close(avg((c) => +(c.outcome === "right")), d.plurality_accuracy) ||
    !close(avg((c) => +(c.outcome === "tie")), d.tie_rate) ||
    !close(avg((c) => c.n_correct / HM.n_chains), d.single_chain_accuracy) ||
    !close(avg((c) => +(c.n_correct > 0)), d.coverage)
  ) {
    throw new Page07DataError(`the heat map's T = ${d.temperature} column disagrees with derived.json`);
  }
});

export const HEATMAP = HM;

/** The chains that landed on one answer, in the order they were sampled. */
export function chainsFor(problem: Problem, answer: string): SpecimenChain[] {
  return problem.chains.filter((c) => c.extracted_answer === answer);
}

/**
 * A chain cut for reading: its opening paragraph (how it read the problem), its
 * last two (where it committed to an answer), and everything between folded away
 * for the reader to open. Chains run 31 to 272 lines, and the question a reader
 * brings to a wrong one is where it ended up, not every step of getting there.
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

/** The share of the tally one row holds, for a bar width. */
export const share = (votes: number, total: number): number => votes / total;

/* --------------------------------------------------------------- the page */

export const PAGE7 = {
  manifest: D.manifest,
  /** The primary model as the run recorded it, label and precision, for the plate. */
  primary: { label: PRIMARY_MODEL.label, precision: PRIMARY_MODEL.quant },
  claims: D.claims,
  procedure: D.procedure,

  /** Figure 1: one problem, N chains, ranked. */
  figure1: {
    ...D.figure_1,
    specimen: SPECIMEN,
    problems: PROBLEMS,
    /** The two boxes the reader switches between, specimen first. */
    showcase: SHOWCASE,
    /** Every problem of the diversity family at every temperature, one cell each. */
    heatmap: HEATMAP,
  },

  /** Figure 2: what the vote buys, and what it costs at a fixed budget. */
  figure2: {
    hot: HOT,
    cold: COLD,
    split: D.figure_2.split,
    splittingPays: D.figure_2.splitting_pays,
    bestSplitN: D.figure_2.best_split_n,
    diversity: D.figure_2.diversity,
    /** The page's sentence: the vote against ONE GREEDY CHAIN. */
    gain: BARE,
    /** Measured and reported, not plotted: the vote against one SAMPLED chain. */
    gainVsOneSample: D.figure_2.gain.vs_one_sample,
  },

  /** The one number the page closes on, and page 8 opens on. */
  handoff: D.handoff,
  pool: D.pool,
} as const;

/** Formats a p-value the way the deck does elsewhere. */
export const pLabel = (p: number): string =>
  p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(p < 0.01 ? 4 : 3)}`;

/** Thousands separators, matching page 6. */
export const tokens = (n: number): string => Math.round(n).toLocaleString("en-US");
