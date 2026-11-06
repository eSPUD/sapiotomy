/**
 * Page 8's section 4: Best-of-N once per judge, loaded from
 * `web/data/page-08-judges.json`.
 *
 * The file is written by step 13 of `notebooks/8_Best_of_N.ipynb`. Until that
 * run lands, the file in the repo is a placeholder built from the old
 * 100-problem run at T = 0.3 and says so (`placeholder: true`); the figure
 * prints that on itself.
 *
 * Every rate is a share of problems solved, 0 to 1. The gates fail the load,
 * never a conditional in the component.
 */
import raw from "@data/page-08-judges.json";

export class Page08JudgesError extends Error {}

export interface JudgeBar {
  id: string;
  label: string;
  kind: "language model" | "reward model";
  /** share of problems Best-of-N solves with this judge picking */
  best_of_n: number;
}

interface RawJudges {
  placeholder: boolean;
  writer: string;
  benchmark: string;
  n_problems: number;
  n_chains: number;
  temperature: number;
  one_chain: number;
  vote: number;
  ceiling: number;
  judges: JudgeBar[];
}

const J = raw as unknown as RawJudges;
const isRate = (v: number) => Number.isFinite(v) && v >= 0 && v <= 1;

if (!J.judges.length) throw new Page08JudgesError("page-08-judges.json has no judges");
for (const v of [J.one_chain, J.vote, J.ceiling, ...J.judges.map((j) => j.best_of_n)]) {
  if (!isRate(v)) throw new Page08JudgesError(`page-08-judges.json: ${v} is not a share between 0 and 1`);
}
for (const j of J.judges) {
  if (j.best_of_n > J.ceiling + 1e-9) {
    throw new Page08JudgesError(`${j.label}: Best-of-N above the ceiling`);
  }
}

/** Best first. */
const judges = [...J.judges].sort((a, b) => b.best_of_n - a.best_of_n);

export const JUDGES8 = {
  placeholder: J.placeholder,
  writer: J.writer,
  benchmark: J.benchmark,
  nProblems: J.n_problems,
  nChains: J.n_chains,
  oneChain: J.one_chain,
  vote: J.vote,
  ceiling: J.ceiling,
  judges,
  /** the judges whose Best-of-N solves more problems than the vote */
  beatVote: judges.filter((j) => j.best_of_n > J.vote),
};
