/**
 * Page 8's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-08-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_08/derived.json`, produced by
 * `page_08_best_of_n.ipynb` from 12,800 generations and 70,960 judgements, and
 * the page ships the file it draws from beside a download of the files that
 * file came from.
 *
 * Page 8's `derived.json` carries an explicit `claims` block, so the gates
 * below are read rather than recomputed. They fail the way page 5's and page
 * 6's do: a run that does not pass is a load error here, never a conditional
 * in the component. A wrong run pasted into `web/data/` fails the build
 * instead of drawing a plausible lie.
 *
 * The gates are the notebook's own blocking three:
 *
 *   · a verifier was actually scored, so there is a best-of-N line at all
 *   · its gain over one chain is resolved by an exact McNemar over the items
 *     where the two disagree, which is the only claim this page makes
 *   · the vote here reproduces page 7's on the same candidates, so the two
 *     pages are quoting one measurement
 *
 * Deliberately NOT a gate: beating majority voting. That is a harder question,
 * one the book never asks, and the run answers it "no". The page reports it as
 * the caveat it is. Gating on it would mean a page that reproduces a real,
 * significant result gets marked as a failure for also running a harder
 * experiment.
 *
 * The consistency assertions are the cross-language check in miniature. The
 * paired counts and the accuracies have to agree arithmetically: a rule that
 * fixes f problems and breaks b against a baseline of a must land at
 * a + (f - b) / n. The specimen's bundled tally has to be the tally its own
 * candidates produce, and the verifier's bundled pick has to be the highest
 * scoring candidate in it, because the page draws a ring around that dot and a
 * mismatch would put a ring on the wrong one.
 */
import rawDerived from "@data/page-08-derived.json";
import { tidyMath } from "./traceText";

export { tidyMath };

export class Page08DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawPoint {
  n: number;
  accuracy: number;
  ci_lo: number;
  ci_hi: number;
  n_items: number;
}

interface RawLine {
  selector: string;
  what: string;
  points: RawPoint[];
}

interface RawCandidate {
  sample_index: number;
  answer: string | null;
  answer_class: string | null;
  votes: number;
  correct: boolean;
  score: number | null;
  chars: number;
  trace: string;
}

interface RawSpecimen {
  problem_id: string;
  question: string;
  ground_truth: string;
  config_id: string;
  temperature: number;
  n: number;
  judge: string;
  vote: { answer: string | null; votes: number; correct: boolean };
  verifier: { sample_index: number; answer: string | null; correct: boolean; score: number | null };
  candidates: RawCandidate[];
}

interface RawPairedRow {
  selector: string;
  accuracy: number;
  delta_pts: number;
  fixed: number;
  broke: number;
  p: number;
  resolved: boolean;
}

interface RawAcross {
  mean: number;
  lo: number;
  hi: number;
  per_config: Record<string, number>;
  n: number;
}

interface RawVerifier {
  name: string;
  kind: string;
  model: string | null;
  loaded_as: string;
  scored_at: string | null;
  solves_these_items: number | null;
  solves_source: string;
  stronger_generator_than_the_writer: boolean;
  complete: boolean;
}

interface RawAgreement {
  config_id: string;
  n: number;
  same_candidates: boolean;
  page_07_vote: number;
  page_08_vote: number;
  page_07_coverage: number;
  page_08_coverage: number;
}

interface RawDerived {
  manifest: {
    timestamp_utc: string;
    notebook_git_sha: string | null;
    candidates: {
      run_id: string;
      model_id: string;
      chain_cap: number;
      n_candidates: number;
      configs: { config_id: string; temperature: number; pool_n: number; n_items: number }[];
    };
    verifiers: RawVerifier[];
  };
  claims: Record<string, boolean>;
  paired: {
    config_id: string;
    n: number;
    n_items: number;
    /**
     * What the paired test measured against: one fixed chain, candidate index
     * 0. Deliberately not pass@1, which averages over all N and sits a couple
     * of points higher. Every "against one chain" number on the page is
     * against THIS, and substituting the other would misstate the test.
     */
    baseline: string;
    baseline_accuracy: number;
    vs_one_chain: RawPairedRow[];
    vs_majority: RawPairedRow[];
  };
  figure_1: {
    config_id: string;
    axis: number[];
    headline_selector: string | null;
    lines: RawLine[];
    specimen: RawSpecimen | null;
  };
  figure_2: {
    /** One row per temperature. `pass_at_1` is every candidate averaged. */
    by_temperature: { config_id: string; pass_at_1: number }[];
  };
  figure_3: {
    bar: number;
    writer_solves: number | null;
    reliability_across_temperatures: Record<string, RawAcross>;
  };
  page_7_agreement: RawAgreement;
}

const raw = rawDerived as unknown as RawDerived;

/* -------------------------------------------------------------------- gates */

const BLOCKING = [
  "verifier_scored",
  "best_of_n_beats_one_chain_resolved",
  "agrees_with_page_7",
] as const;

for (const claim of BLOCKING) {
  if (raw.claims[claim] !== true) {
    throw new Page08DataError(
      `page-08-derived.json fails the notebook's blocking claim "${claim}". ` +
        `That run may not be translated to a page: see docs/page_8_measured_payoff.md.`,
    );
  }
}

const headlineSelector = raw.figure_1.headline_selector;
if (!headlineSelector) {
  throw new Page08DataError("page-08-derived.json names no headline selector");
}

const specimen = raw.figure_1.specimen;
if (!specimen) {
  throw new Page08DataError(
    "page-08-derived.json bundles no specimen, so figure 1's left panel has no batch to draw",
  );
}

/* ------------------------------------------------------- consistency checks */

const nItems = raw.paired.n_items;

function row(rows: RawPairedRow[], selector: string): RawPairedRow {
  const hit = rows.find((r) => r.selector === selector);
  if (!hit) throw new Page08DataError(`no paired row for ${selector}`);
  return hit;
}

const baselineAccuracy = raw.paired.baseline_accuracy;
if (typeof baselineAccuracy !== "number") {
  throw new Page08DataError(
    "page-08-derived.json records no baseline accuracy for the paired test, so nothing " +
      "on the page can honestly say what its numbers are measured against",
  );
}

// A rule that fixes f and breaks b against a baseline of a must land at
// a + (f - b)/n. This is the notebook's two answers to the same question
// meeting: the accuracy came from the ladder, the counts from the paired test.
for (const r of raw.paired.vs_one_chain) {
  const expected = baselineAccuracy + (r.fixed - r.broke) / nItems;
  if (Math.abs(expected - r.accuracy) > 1e-9) {
    throw new Page08DataError(
      `${r.selector}: ${r.fixed} fixed and ${r.broke} broke against ` +
        `${(baselineAccuracy * 100).toFixed(1)}% implies ` +
        `${(expected * 100).toFixed(1)}%, but the ladder says ` +
        `${(r.accuracy * 100).toFixed(1)}%. The paired test and the ladder disagree.`,
    );
  }
}

// The specimen's bundled tally must be the tally its own candidates produce,
// and the ringed dot must be the highest-scoring one.
{
  const counts = new Map<string, number>();
  for (const c of specimen.candidates) {
    if (c.answer_class === null) continue;
    counts.set(c.answer_class, (counts.get(c.answer_class) ?? 0) + 1);
  }
  const top = [...counts.values()].reduce((a, b) => Math.max(a, b), 0);
  if (top !== specimen.vote.votes) {
    throw new Page08DataError(
      `the specimen says the vote took ${specimen.vote.votes} of ${specimen.n}, ` +
        `but its candidates tally ${top}`,
    );
  }
  const best = specimen.candidates.reduce((a, b) =>
    (b.score ?? -Infinity) > (a.score ?? -Infinity) ? b : a,
  );
  if (best.sample_index !== specimen.verifier.sample_index) {
    throw new Page08DataError(
      `the specimen rings chain ${specimen.verifier.sample_index} as the verifier's pick, ` +
        `but chain ${best.sample_index} scores highest`,
    );
  }
  if (specimen.vote.correct) {
    throw new Page08DataError("the specimen's vote is correct, so it does not show a disagreement");
  }
  if (!specimen.verifier.correct) {
    throw new Page08DataError("the specimen's verifier is wrong, so it does not show a rescue");
  }
}

/**
 * Two numbers on this page are both called one chain and they are not the same
 * quantity: figure 1's flat line is every candidate averaged, figure 2's
 * baseline is one fixed chain, and they sit three points apart. The page labels
 * them apart rather than reconciling them, and a label is only honest if the
 * line really is the average, so the identification is checked here instead of
 * being asserted in the copy.
 */
const oneChainLine = raw.figure_1.lines.find((l) => l.selector === "one chain");
const curveTemperature = raw.figure_2.by_temperature.find(
  (t) => t.config_id === raw.figure_1.config_id,
);
if (!oneChainLine || !curveTemperature) {
  throw new Page08DataError(
    "page-08-derived.json draws a one-chain line on figure 1 with no average to name it by, " +
      "so the page cannot tell it apart from the paired test's fixed chain",
  );
}
const chainAverage = curveTemperature.pass_at_1;
for (const p of oneChainLine.points) {
  if (Math.abs(p.accuracy - chainAverage) > 1e-9) {
    throw new Page08DataError(
      `figure 1's one-chain line sits at ${(p.accuracy * 100).toFixed(1)}% at N=${p.n}, but the ` +
        `run's average over all candidates at ${raw.figure_1.config_id} is ` +
        `${(chainAverage * 100).toFixed(1)}%. The page labels that line as the average.`,
    );
  }
}

/* --------------------------------------------------------- reader-facing names */

/**
 * The notebook's identifiers are keys, never labels. `selector` and `name` stay
 * as they are for every lookup and no figure ever renders one: a row that reads
 * `best-of-N (qwen1.5b)` tells a reader nothing, and `logprob` tells them less.
 *
 * One map serves both figures. Figure 2's rows are `best-of-N, <judge>` and
 * figure 3's points are the judge alone, so the two cannot drift apart, and the
 * judge names are short because in figure 3 they sit beside a plotted point.
 */
const JUDGE_LABELS: Record<string, string> = {
  self: "the writer itself",
  "qwen1.5b": "1.5B generalist",
  "qwen7b": "7B generalist",
  "math1.5b": "1.5B math specialist",
  "skywork-prm": "trained verifier",
};

/** The rules that are not a judge scoring candidates. */
const RULE_LABELS: Record<string, string> = {
  majority: "majority vote",
  heuristic: "hand-written length heuristic",
  logprob: "answer log-probability",
  "one chain": "one chain",
  coverage: "a correct answer is present",
};

/**
 * Where a solve rate came from, in the reader's words. Figure 3's left gutter
 * prints one of these under every solve rate it shows, because that column is
 * not one measurement: most of it is page 6's greedy run and one row was
 * measured here under sampling. `null` is the row with no number to source.
 */
const SOLVES_SOURCE_LABELS: Record<string, string | null> = {
  "page 6": "from page 6",
  "measured in this run": "measured here",
  unmeasured: null,
};

/**
 * An unmapped selector is a load error rather than a raw identifier drawn on a
 * figure. A re-run that adds a judge has to name it here before the page can
 * show it, which is the point.
 */
function judgeLabel(name: string): string {
  const label = JUDGE_LABELS[name];
  if (!label) {
    throw new Page08DataError(
      `no reader-facing label for the judge "${name}". Add one to JUDGE_LABELS in ` +
        `web/src/lib/page08.ts: page 8 does not render notebook identifiers.`,
    );
  }
  return label;
}

function solvesSourceLabel(name: string, source: string): string | null {
  if (!(source in SOLVES_SOURCE_LABELS)) {
    throw new Page08DataError(
      `no reader-facing label for the solve-rate source "${source}" on the judge "${name}". ` +
        `Add one to SOLVES_SOURCE_LABELS in web/src/lib/page08.ts: figure 3 says where every ` +
        `solve rate came from and will not print a notebook string.`,
    );
  }
  return SOLVES_SOURCE_LABELS[source];
}

function labelFor(selector: string): string {
  const judge = /^best-of-N \((.+)\)$/.exec(selector);
  if (judge) return `best-of-N, ${judgeLabel(judge[1])}`;
  const rule = RULE_LABELS[selector];
  if (!rule) {
    throw new Page08DataError(
      `no reader-facing label for the selector "${selector}". Add one to RULE_LABELS in ` +
        `web/src/lib/page08.ts: page 8 does not render notebook identifiers.`,
    );
  }
  return rule;
}

/* ------------------------------------------------------------------ exports */

export interface PairedRow {
  selector: string;
  /** What the figure prints. `selector` is the key; this is the English. */
  label: string;
  accuracy: number;
  fixed: number;
  broke: number;
  net: number;
  p: number;
  resolved: boolean;
}

const asPaired = (r: RawPairedRow): PairedRow => ({
  selector: r.selector,
  label: labelFor(r.selector),
  accuracy: r.accuracy,
  fixed: r.fixed,
  broke: r.broke,
  net: r.fixed - r.broke,
  p: r.p,
  resolved: r.resolved,
});

export interface JudgeRow {
  name: string;
  /** What the figure prints beside the point. */
  label: string;
  /** What it solves unaided. Null when it has no generative head at all. */
  solves: number | null;
  /**
   * Where `solves` came from. The x axis of figure 3 is not one measurement:
   * most positions are page 6's greedy scores, one was measured in this run
   * under sampling, and one was never measured. The figure has to say so, so
   * the provenance travels with the number rather than being flattened out.
   */
  solvesSource: string;
  /** `solvesSource` as the gutter prints it. Null when there is nothing to source. */
  solvesSourceLabel: string | null;
  /** Whether this judge solves these problems better than the model it judges. */
  strongerThanWriter: boolean;
  mean: number;
  lo: number;
  hi: number;
  trained: boolean;
}

const verifiersByName = new Map(raw.manifest.verifiers.map((v) => [v.name, v]));

const judges: JudgeRow[] = Object.entries(raw.figure_3.reliability_across_temperatures)
  .filter(([selector]) => selector.startsWith("best-of-N ("))
  .map(([selector, across]) => {
    const name = selector.slice("best-of-N (".length, -1);
    const spec = verifiersByName.get(name);
    const source = spec?.solves_source ?? "unmeasured";
    return {
      name,
      label: judgeLabel(name),
      solves: spec?.solves_these_items ?? null,
      solvesSource: source,
      solvesSourceLabel: solvesSourceLabel(name, source),
      strongerThanWriter: spec?.stronger_generator_than_the_writer ?? false,
      mean: across.mean,
      lo: across.lo,
      hi: across.hi,
      trained: spec?.kind === "rm",
    };
  })
  .sort((a, b) => (a.solves ?? -1) - (b.solves ?? -1));

const majorityAcross = raw.figure_3.reliability_across_temperatures["majority"];
if (!majorityAcross) throw new Page08DataError("no across-temperature reliability for the vote");

const headline = row(raw.paired.vs_one_chain, headlineSelector);
const headlineVsVote = row(raw.paired.vs_majority, headlineSelector);
const majorityVsOne = row(raw.paired.vs_one_chain, "majority");
const heuristic = raw.paired.vs_one_chain.find((r) => r.selector === "heuristic");

const trainedVerifier = raw.manifest.verifiers.find((v) => v.kind === "rm" && v.complete);

// Page 7 closes on the problems where a right answer was generated and thrown
// away, so page 8 has to be able to say what judging recovers of it. This is
// figure 1's dotted ceiling read at the widest N, which is the same quantity
// page 7 calls coverage.
const coverageLine = raw.figure_1.lines.find((l) => l.selector === "coverage");
const coverage = coverageLine ? coverageLine.points[coverageLine.points.length - 1].accuracy : null;

export const PAGE8 = {
  /** The run itself, for the provenance chip. */
  run: {
    model: raw.manifest.candidates.model_id,
    runId: raw.manifest.candidates.run_id,
    chains: raw.manifest.candidates.n_candidates,
    chainCap: raw.manifest.candidates.chain_cap,
    items: nItems,
    date: raw.manifest.timestamp_utc.slice(0, 10),
    temperatures: raw.manifest.candidates.configs.map((c) => c.temperature),
    judgements: raw.manifest.verifiers.filter((v) => v.complete).length *
      raw.manifest.candidates.n_candidates,
  },

  /** Figure 1: one batch, then a hundred problems. */
  specimen,
  curve: {
    configId: raw.figure_1.config_id,
    axis: raw.figure_1.axis,
    lines: raw.figure_1.lines,
    headlineSelector,
  },

  /** Figure 2: the paired comparison, which is the page's evidence. */
  paired: {
    n: raw.paired.n,
    items: nItems,
    vsOneChain: raw.paired.vs_one_chain.map(asPaired),
    vsMajority: raw.paired.vs_majority.map(asPaired),
  },

  /** Figure 3: what a judge is worth, across every temperature. */
  judges,
  bar: majorityAcross,

  /**
   * What the model that wrote the candidates solves on these problems, on the
   * same axis as the judges. Two of the judges are above it, which the figure
   * has to say: nothing here held the judge's own ability fixed against the
   * writer's, and the run keeps a gate for exactly that.
   */
  writerSolves: raw.figure_3.writer_solves,

  /** How often a right answer was there to be found at all. Page 7's number. */
  coverage,

  /**
   * The receipt behind page 7's handoff. Page 8 did not reuse page 7's chains,
   * it re-ran the protocol, so the honest seam claim is that the two runs land
   * in the same place and only the selection rule changed. These are the numbers
   * that say so, and the page renders them rather than asserting an identity.
   */
  agreement: {
    configId: raw.page_7_agreement.config_id,
    n: raw.page_7_agreement.n,
    sameCandidates: raw.page_7_agreement.same_candidates,
    page7Vote: raw.page_7_agreement.page_07_vote,
    page8Vote: raw.page_7_agreement.page_08_vote,
    page7Coverage: raw.page_7_agreement.page_07_coverage,
    page8Coverage: raw.page_7_agreement.page_08_coverage,
  },

  /** The three sentences the page is allowed to say, with their statistics. */
  headline: asPaired(headline),
  majority: asPaired(majorityVsOne),
  heuristic: heuristic ? asPaired(heuristic) : null,
  caveat: asPaired(headlineVsVote),
  oneChain: baselineAccuracy,
  baselineIs: raw.paired.baseline,

  /**
   * The other one-chain number: what a candidate scores on average, which is
   * where figure 1's flat line sits. Three points above `oneChain`, and the two
   * are labelled apart wherever they are drawn.
   */
  chainAverage,

  /**
   * The side note the plan requires: a PRM read as an ORM. `rebuilt` is the
   * other half of it. The checkpoint did not run as published here, and every
   * headline number on the page comes from what did run, so the flag is read
   * from the manifest rather than asserted in the copy: a re-run that loads it
   * as published drops the disclosure by itself.
   */
  verifierNote: trainedVerifier
    ? {
        model: trainedVerifier.model,
        scoredAt: trainedVerifier.scored_at,
        rebuilt: trainedVerifier.loaded_as !== "as published",
      }
    : null,

  claims: raw.claims,
} as const;

export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)}%`;

/** p-values are quoted, so they are formatted once and the same way everywhere. */
export const pValue = (p: number): string => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`);
