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
  complete: boolean;
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
  figure_3: {
    bar: number;
    writer_solves: number | null;
    reliability_across_temperatures: Record<string, RawAcross>;
  };
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

/* ------------------------------------------------------------------ exports */

export interface PairedRow {
  selector: string;
  accuracy: number;
  fixed: number;
  broke: number;
  net: number;
  p: number;
  resolved: boolean;
}

const asPaired = (r: RawPairedRow): PairedRow => ({
  selector: r.selector,
  accuracy: r.accuracy,
  fixed: r.fixed,
  broke: r.broke,
  net: r.fixed - r.broke,
  p: r.p,
  resolved: r.resolved,
});

export interface JudgeRow {
  name: string;
  /** What it solves unaided. Null when it has no generative head at all. */
  solves: number | null;
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
    return {
      name,
      solves: spec?.solves_these_items ?? null,
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

  /** The three sentences the page is allowed to say, with their statistics. */
  headline: asPaired(headline),
  majority: asPaired(majorityVsOne),
  heuristic: heuristic ? asPaired(heuristic) : null,
  caveat: asPaired(headlineVsVote),
  oneChain: baselineAccuracy,
  baselineIs: raw.paired.baseline,

  /** The side note the plan requires: a PRM read as an ORM. */
  verifierNote: trainedVerifier
    ? { model: trainedVerifier.model, scoredAt: trainedVerifier.scored_at }
    : null,

  claims: raw.claims,
} as const;

export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)}%`;

/** p-values are quoted, so they are formatted once and the same way everywhere. */
export const pValue = (p: number): string => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`);
