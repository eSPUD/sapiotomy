/**
 * Page 11's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-11-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_11/derived.json`, produced by
 * `page_11_training_vs_scale.ipynb`: arm 0 re-derives the accuracy-against-FLOPs
 * family chart from pages 6, 7 and 8's own runs (gate 1 checks it reproduces
 * them exactly), then the new arms sweep a fresh easy band on this instrument.
 *
 * The page draws two of the run's claims and leaves the third in the file:
 *
 *   B1  no crossing. On neither difficulty band does sampling-and-voting on the
 *       small model beat the big model's single greedy answer at a matched
 *       inference bill, or even at several times it.
 *   B2  the bottleneck is selection, not coverage. The right answer is in the
 *       sampled pile far more often than any realizable selector returns it.
 *
 * The specialist arm (a math-trained 1.5B) is measured and kept in the file,
 * but this page does not plot it: that comparison is the frontier-reasoners
 * page's, made at matched size with the reasoning distills, not the keystone's.
 *
 * The gates are read, not recomputed, the way page 6's and page 8's are: a run
 * that does not pass is a load error here, never a conditional in the
 * component, so a wrong file pasted into `web/data/` fails the build instead of
 * drawing a plausible lie.
 */
import rawDerived from "@data/page-11-derived.json";

export class Page11DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawGreedy {
  model_id: string;
  label: string;
  params: number;
  accuracy: number;
  mean_tokens: number;
  flops: number;
  source: string;
}
interface RawVotePoint {
  n: number;
  accuracy: number;
  coverage: number;
  mean_tokens: number;
  flops: number;
  source: string;
}
interface RawArmPoint {
  model_id: string;
  kind: "greedy" | "vote";
  n: number;
  accuracy: number;
  coverage?: number;
  mean_tokens: number;
  n_items: number;
  params: number;
  flops: number;
}
interface RawDerived {
  manifest: {
    run_mode: string;
    notebook_sha256: string;
    items: { hard: { n: number }; easy: { n: number } };
    gates: {
      gate1: { all: boolean };
      gate2: { accuracy: number; passed: boolean; floor: number; n: number };
    };
    versions: { torch: string; transformers: string };
  };
  claims: {
    gate1_reproduced: boolean;
    no_crossing_on_hard_band: boolean;
    selection_at_best_ties_target: boolean;
    coverage_clears_target: boolean;
  };
  family: {
    band: string;
    n_items: number;
    target: RawGreedy;
    greedy: RawGreedy[];
    vote_curve: RawVotePoint[];
    best_of: {
      n: number;
      selector: string;
      accuracy: number;
      majority_accuracy: number;
      baseline_accuracy: number;
      flops: number;
      p: number;
    };
  };
  arms: { easy: RawArmPoint[]; hard: RawArmPoint[] };
}

const RAW = rawDerived as unknown as RawDerived;

/* ----------------------------------------------------------- public shape */

/** The 3B ("Act 2's shared instrument") vote curve: what one small model buys
 *  with more samples, and how much of the pile it is failing to cash. */
export interface VotePoint {
  n: number;
  accuracy: number;
  coverage: number;
  flops: number;
  /** inference FLOPs as a multiple of the big model's one greedy answer */
  xTarget: number;
}
export interface GreedyPoint {
  label: string;
  params: number;
  accuracy: number;
  flops: number;
}
export interface BestOfPoint {
  label: string;
  accuracy: number;
  flops: number;
  xTarget: number;
}
export interface Band {
  key: "easy" | "hard";
  label: string;
  levels: string;
  nItems: number;
  /** the big model's single greedy answer: the dot to beat */
  target: GreedyPoint;
  /** greedy points for the whole family, smallest to largest */
  greedy: GreedyPoint[];
  /** the 3B vote curve, N = 1..16 */
  voteCurve: VotePoint[];
  /** the strongest realizable selector we own, where we own one (page 8, hard) */
  bestOf: BestOfPoint | null;
  /** coverage at N=16: how often the answer was in the pile at all */
  coverageAt16: number;
  /** the best any realizable selector returns at N=16 */
  selectionAt16: number;
}

const PRIMARY = "Qwen/Qwen2.5-3B-Instruct";
const TARGET = "Qwen/Qwen2.5-7B-Instruct";

const pct = (x: number) => Math.round(x * 1000) / 10;

function greedy(label: string, params: number, accuracy: number, flops: number): GreedyPoint {
  return { label, params, accuracy, flops };
}

/* ------- the hard band: pages 6/7/8's own numbers, gate-1 verified -------- */

const hardTarget: GreedyPoint = greedy(
  RAW.family.target.label,
  RAW.family.target.params,
  RAW.family.target.accuracy,
  RAW.family.target.flops,
);

const hard: Band = {
  key: "hard",
  label: "hard",
  levels: "levels 4 and 5",
  nItems: RAW.family.n_items,
  target: hardTarget,
  greedy: RAW.family.greedy.map((g) => greedy(g.label, g.params, g.accuracy, g.flops)),
  voteCurve: RAW.family.vote_curve.map((p) => ({
    n: p.n,
    accuracy: p.accuracy,
    coverage: p.coverage,
    flops: p.flops,
    xTarget: p.flops / hardTarget.flops,
  })),
  bestOf: {
    label: RAW.family.best_of.selector,
    accuracy: RAW.family.best_of.accuracy,
    flops: RAW.family.best_of.flops,
    xTarget: RAW.family.best_of.flops / hardTarget.flops,
  },
  coverageAt16: RAW.family.vote_curve[RAW.family.vote_curve.length - 1].coverage,
  selectionAt16: Math.max(
    RAW.family.vote_curve[RAW.family.vote_curve.length - 1].accuracy,
    RAW.family.best_of.accuracy,
  ),
};

/* ------- the easy band: this run's fresh generation on levels 1..3 -------- */

const easyGeneral = RAW.arms.easy.filter(
  (p) => p.model_id === "Qwen/Qwen2.5-1.5B-Instruct" || p.model_id === PRIMARY || p.model_id === TARGET,
);
const easyGreedy = easyGeneral.filter((p) => p.kind === "greedy");
const easyVote3b = easyGeneral
  .filter((p) => p.kind === "vote" && p.model_id === PRIMARY)
  .sort((a, b) => a.n - b.n);
const label = (mid: string) => `Qwen2.5-${mid.split("-")[1]}`;
const easyTargetRow = easyGreedy.find((p) => p.model_id === TARGET);
if (!easyTargetRow) throw new Page11DataError("easy band is missing the 7B greedy target");
const easyTarget = greedy(label(TARGET), easyTargetRow.params, easyTargetRow.accuracy, easyTargetRow.flops);

const easy: Band = {
  key: "easy",
  label: "easy",
  levels: "levels 1 to 3",
  nItems: RAW.manifest.items.easy.n,
  target: easyTarget,
  greedy: easyGreedy
    .sort((a, b) => a.params - b.params)
    .map((p) => greedy(label(p.model_id), p.params, p.accuracy, p.flops)),
  voteCurve: easyVote3b.map((p) => ({
    n: p.n,
    accuracy: p.accuracy,
    coverage: p.coverage ?? p.accuracy,
    flops: p.flops,
    xTarget: p.flops / easyTarget.flops,
  })),
  bestOf: null,
  coverageAt16: easyVote3b[easyVote3b.length - 1].coverage ?? 0,
  selectionAt16: easyVote3b[easyVote3b.length - 1].accuracy,
};

/* --------------------------------------------------- the load-time gates */

const claims = RAW.claims;
const gate2 = RAW.manifest.gates.gate2;

function assert(ok: boolean, why: string): void {
  if (!ok) throw new Page11DataError(why);
}

assert(RAW.manifest.run_mode === "FULL", "page 11 derived.json is not a FULL run");
assert(RAW.manifest.gates.gate1.all === true, "gate 1 did not reproduce pages 6/7/8");
assert(claims.gate1_reproduced === true, "gate 1 claim is not set");
assert(gate2.passed === true, "gate 2 did not pass: the run is on a branch this page does not draw");

// B1, the no-crossing claim, checked as an arithmetic property of the points the
// page plots rather than trusted from the claims block: on neither band may any
// realizable selector we draw come out ABOVE the big model's greedy answer.
for (const b of [easy, hard] as const) {
  const best = Math.max(...b.voteCurve.map((p) => p.accuracy), b.bestOf?.accuracy ?? 0);
  assert(
    best <= b.target.accuracy + 1e-9,
    `no-crossing violated on the ${b.key} band: a selector reaches ${pct(best)}% over the ${pct(
      b.target.accuracy,
    )}% target`,
  );
}

// B2, the coverage-versus-selection gap: coverage clears the target the selector
// cannot, so the answer is present and un-cashed. If this ever inverts, the
// mechanism the page teaches is wrong and it must not ship.
for (const b of [easy, hard] as const) {
  assert(
    b.coverageAt16 >= b.target.accuracy - 1e-9,
    `coverage does not clear the target on the ${b.key} band`,
  );
  assert(
    b.coverageAt16 >= b.selectionAt16 - 1e-9,
    `coverage is below selection on the ${b.key} band: the gap the page draws is the wrong sign`,
  );
}

export const PAGE11 = {
  bands: { easy, hard },
  /** N stops on the sampling slider, shared by both bands' 3B vote curves. */
  sampleStops: hard.voteCurve.map((p) => p.n),
  gate2: { accuracy: gate2.accuracy, floor: gate2.floor, n: gate2.n },
  versions: RAW.manifest.versions,
  download: { slug: "page-11-training-vs-scale", sizeLabel: "1.7 MB" },
  pct,
} as const;

export type Page11 = typeof PAGE11;
