/**
 * Page 8's dots and comparison, loaded from `web/data/page-08-pile.json`.
 *
 * Built by `notebooks/page_08_pile_site_data.py` from the temperature sweep's
 * 16 chains on each of 100 problems, at the temperature its vote did best at,
 * and the trained verifier's score of every one of them. The builder refuses
 * to write unless its vote, chain accuracy and ceiling are the sweep's.
 *
 * The gates below fail the load, never a conditional in the component: every
 * row carries all its chains, the chains are in the verifier's order (the first
 * is the chain Best-of-N keeps; a chain with no answer cannot be kept, so those
 * come last with no score), the rows are ordered by how many chains are right,
 * and every bar is the average of the rows it summarises. A stand-in file,
 * scored by anything but the trained verifier, is refused.
 */
import raw from "@data/page-08-pile.json";

export class Page08PileError extends Error {}

/** A share as a percent. */
export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)}%`;

export interface PileChain {
  /** sample index within the problem's 16 */
  i: number;
  /** right or wrong, by the answer key */
  c: boolean;
  /** the verifier's score; null for a chain with no answer, which cannot be kept */
  s: number | null;
}

/** A chain shown in full: its rating as a percent, its final answer and its text. */
export interface PileCard extends PileChain {
  s: number;
  r: number;
  a: string | null;
  trace: string;
}

export interface PileRow {
  id: string;
  level: number;
  n_correct: number;
  vote: "right" | "wrong" | "tie";
  greedy: boolean;
  /** sorted by the verifier's score, highest first */
  chains: PileChain[];
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
  specimen: null | {
    id: string;
    question: string;
    answer: string;
    vote: string;
    vote_answer: string | null;
    n_correct: number;
    right_rank: number;
    cards: PileCard[];
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
  const outOfOrder = (c: PileChain, prev: PileChain) =>
    prev.s === null ? c.s !== null : c.s !== null && c.s > prev.s;
  if (row.chains.some((c, j) => j > 0 && outOfOrder(c, row.chains[j - 1]))) {
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
