/**
 * Page 8's heat map and comparison, loaded from `web/data/page-08-pile.json`.
 *
 * Built by `notebooks/page_08_pile_site_data.py` from page 7's chains (the
 * temperature sweep's 16 chains on each of 40 problems, at the temperature
 * its vote did best at) and the trained verifier's score of every one of
 * them (`notebooks/page_08_pile_scores.py`). The builder refuses to write
 * unless its vote, chain accuracy and ceiling are page 7's.
 *
 * The gates below fail the load, never a conditional in the component: every
 * row carries all its chains, the chains are in the verifier's order (column
 * 1 is the top score, the chain Best-of-N keeps), the rows are in the order
 * the map promises, and every bar is the average of the rows it summarises.
 * A stand-in file, scored by anything but the trained verifier, is refused.
 *
 * The chains' text is not bundled: one file per problem under
 * `web/data/page-08-chains/`, loaded when a reader opens a chain.
 */
import raw from "@data/page-08-pile.json";

export class Page08PileError extends Error {}

export interface PileChain {
  /** sample index within the problem's 16 */
  i: number;
  /** right or wrong, by the answer key */
  c: boolean;
  /** the verifier's raw score */
  s: number;
  /** the same score as a chance of being right, in percent */
  r: number;
  /** the chain's final answer */
  a: string | null;
}

export interface PileRow {
  id: string;
  level: number;
  subject: string;
  question: string;
  answer: string;
  n_correct: number;
  vote: "right" | "wrong" | "tie";
  vote_answer: string | null;
  greedy: boolean;
  /** sorted by the verifier's score, highest first */
  chains: PileChain[];
  /** the file under web/data/page-08-chains/ holding this row's chain text */
  file: string;
}

interface RawPile {
  source: { stand_in: boolean };
  writer: string;
  verifier: string;
  benchmark: string;
  temperature: number;
  n_chains: number;
  bars: {
    one_chain: number;
    chain_average: number;
    vote: number;
    best_of_n: number;
    ceiling: number;
    best_vs_vote: { best_only: number; vote_only: number; p: number };
    best_vs_one: { best_only: number; one_only: number; p: number };
    vote_vs_one: { vote_only: number; one_only: number; p: number };
  };
  misses: { n: number; of: number; ids: string[] };
  specimen: {
    id: string;
    question: string;
    answer: string;
    vote: string;
    vote_answer: string | null;
    n_correct: number;
    right_rank: number;
    cards: (PileChain & { trace: string })[];
  };
  rows: PileRow[];
}

const P = raw as unknown as RawPile;
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const avg = (f: (r: PileRow) => number) => P.rows.reduce((t, r) => t + f(r), 0) / P.rows.length;

if (P.source.stand_in) {
  throw new Page08PileError("page-08-pile.json was built from stand-in scores, not the trained verifier");
}
for (const [k, row] of P.rows.entries()) {
  const ids = new Set(row.chains.map((c) => c.i));
  if (row.chains.length !== P.n_chains || ids.size !== P.n_chains) {
    throw new Page08PileError(`${row.id}: ${row.chains.length} chains, not ${P.n_chains}`);
  }
  if (row.chains.some((c, j) => j > 0 && c.s > row.chains[j - 1].s)) {
    throw new Page08PileError(`${row.id}: chains are not in the verifier's order`);
  }
  if (row.chains.filter((c) => c.c).length !== row.n_correct) {
    throw new Page08PileError(`${row.id}: n_correct does not match its chains`);
  }
  if (k > 0 && row.n_correct > P.rows[k - 1].n_correct) {
    throw new Page08PileError("rows are not ordered by how many chains are right");
  }
}
if (
  !close(P.bars.best_of_n, avg((r) => +r.chains[0].c)) ||
  !close(P.bars.ceiling, avg((r) => +(r.n_correct > 0))) ||
  !close(P.bars.vote, avg((r) => +(r.vote === "right"))) ||
  !close(P.bars.one_chain, avg((r) => +r.greedy)) ||
  !close(P.bars.chain_average, avg((r) => r.n_correct / P.n_chains))
) {
  throw new Page08PileError("a bar is not the average of the rows it summarises");
}
const missIds = P.rows.filter((r) => r.n_correct > 0 && !r.chains[0].c).map((r) => r.id);
if (missIds.length !== P.misses.n || P.misses.of !== P.rows.filter((r) => r.n_correct > 0).length) {
  throw new Page08PileError("the judge's miss count does not match the rows");
}

/** The three bands the map falls into. */
const band = (r: PileRow) =>
  r.n_correct === P.n_chains ? "all" : r.n_correct === 0 ? "none" : "mixed";

export const PILE8 = {
  writer: P.writer,
  verifier: P.verifier,
  benchmark: P.benchmark,
  nChains: P.n_chains,
  rows: P.rows,
  bars: P.bars,
  misses: P.misses,
  specimen: P.specimen,
  bands: {
    all: P.rows.filter((r) => band(r) === "all").length,
    mixed: P.rows.filter((r) => band(r) === "mixed").length,
    none: P.rows.filter((r) => band(r) === "none").length,
    /** mixed rows whose first column, the kept chain, is right */
    mixedKeptRight: P.rows.filter((r) => band(r) === "mixed" && r.chains[0].c).length,
  },
};

/** One problem's chain text, keyed by sample index. */
export async function loadChains(file: string): Promise<Record<string, string>> {
  const mod = await import(`../../data/page-08-chains/${file}.json`);
  return (mod.default ?? mod) as Record<string, string>;
}
