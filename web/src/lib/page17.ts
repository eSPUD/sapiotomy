/**
 * Page 15's measured material, loaded from committed `derived.json` files.
 *
 * The page was 17 until the 2026-08-10 cut. This module, `page-17-derived.json`
 * and `page_17_when_reasoning_breaks.ipynb` keep the 17: they name one notebook
 * run, not a route, and renaming them would break the pairing PROVENANCE.md
 * records. "Page 17" below therefore means the run, and the gate messages it
 * raises say 17 for the same reason.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-17-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_17/derived.json`, produced by
 * `page_17_when_reasoning_breaks.ipynb`, which generates nothing: it
 * re-aggregates pages 5 to 9's published runs and asserts that its
 * re-aggregation reproduces page 6's own fifteen accuracy cells exactly.
 *
 * Page 17 reads THREE runs, so its first job is to earn the phrase "the same
 * hundred problems". The notebook's gate A settles it and the gates below read
 * that verdict rather than re-deriving it, with one distinction the page must
 * carry into its copy: pages 5, 6, 7 and 9 share an item set AND, for 9, page
 * 7's actual chains, while page 8 generated its own pool over the same problems
 * (`page_7_agreement.same_candidates` is false upstream). So the page may write
 * "the same problems" of page 8 and may NOT write "the same chains".
 *
 * FOUR of the notebook's claims are false on the shipped run, and every one of
 * them is load-bearing rather than a defect:
 *
 *   · `rescues_came_from_finished_reasoning` — false. Not one of the 25 rescues
 *     had concluded anything when it was cut, so the right answer came from the
 *     forced commit and not from finished working. `control1` exists so that
 *     omitting this beside the specimen is awkward.
 *   · `stopping_early_is_a_strategy` — false. A fixed cut is WORSE than letting
 *     the model finish.
 *   · `cut_points_beat_resampling_per_token` — false. The best cut point buys no
 *     more coverage per token than plain resampling.
 *   · `easy_problems_break_sooner_than_hard` — false. This is the claim page
 *     17's deleted authored figure used to make. `levelNull` keeps it in the
 *     page's reach as a stated null rather than a silence.
 *
 * The blocking gates are the two that would make the page dishonest rather than
 * merely wrong: the population claim, and page 6's reproduction. A run failing
 * either is a load error here rather than a conditional in the component.
 *
 * Step 3's verifier material comes from elsewhere. The temperature sweep and the
 * discrimination table are read from page 8's raw `derived.json` because
 * `page08.ts` collapses `per_config` to mean/lo/hi and never surfaces
 * `discrimination`. Everything page 17 needs about what a grader can read is
 * taken from `PAGE9` rather than re-derived, so page 9's own gates run first and
 * the two pages cannot disagree about one measurement.
 */
import rawDerived from "@data/page-17-derived.json";
import raw08 from "@data/page-08-derived.json";
import { PAGE9 } from "./page09";
import { pct, tidyMath } from "./traceText";

export { pct, tidyMath, PAGE9 };

export class Page17DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawRung {
  from_budget: number;
  to_budget: number;
  gained: number;
  lost: number;
  net: number;
}

interface RawRescued {
  problem_id: string;
  level: number;
  subject: string;
  right_when_cut_at: number[];
  natural_length: number;
  exceeded_cap: boolean;
}

interface RawAffected {
  n_regressions: number;
  n_rescued: number;
  regressions: { problem_id: string; level: number; lost_at: number[] }[];
  rescued: RawRescued[];
}

interface RawSpecimenBudget {
  budget: number;
  trace: string;
  own_tokens: number;
  cut_index: number | null;
  answer_start: number | null;
  truncated: boolean;
  forced: boolean;
  extracted_answer: string | null;
  correct: boolean;
  /** Where the harness appended its forced commit, or null on a chain that ended itself. */
  commit: number | null;
}

interface RawDerived {
  manifest: {
    run_id: string;
    run_mode: string;
    timestamp_utc: string;
    generates: string;
    items: { n: number; levels: number[]; item_set_sha256: string };
    models: { primary: string; family: string[] };
    budgets: number[];
    decoding: { strategy: string };
    sources: Record<string, { run_id: string; read_as: string }>;
    gates: {
      A_one_population: { passed: boolean; page_08_same_chains: boolean | null };
      B_page_6_reproduced: { passed: boolean; max_drift: number };
    };
  };
  claims: Record<string, boolean>;
  ledger: Record<string, RawRung[]>;
  self_terminated: Record<
    string,
    {
      share_at_max: number;
      mean_own_tokens_at_max: number;
      truncation_by_budget: Record<string, number>;
    }
  >;
  affected: Record<string, RawAffected>;
  controls: {
    concluded_when_cut: {
      n_cases: number;
      n_with_a_concluding_step: number;
      boxed_share_when_finished: number;
      boxed_share_when_cut: number;
    };
    blurt_arm: { n_items: number; forced_blurt_right: number; zero_shot_cot_right: number };
    is_it_a_rule: {
      natural: number;
      fixed_cut: number;
      fixed_cut_accuracy: number;
      oracle_over_cuts: number;
      oracle_token_cost: number;
      sampling_coverage_at_that_cost: number;
      sampling_temperature: number;
      sampling_bracket: { n: number; coverage: number; mean_tokens: number }[];
    };
  };
  level_null: Record<string, { n: number; median_lost_at: number } | number>;
  specimen: {
    problem_id: string;
    model_id: string;
    level: number;
    subject: string;
    question: string;
    ground_truth: string;
    natural_length: number;
    by_budget: RawSpecimenBudget[];
    also_regresses_on: string[];
    zones: {
      assumption: [number, number];
      conclusion: [number, number];
      mark: string;
      why: string;
    };
  };
}

interface RawAcross {
  mean: number;
  per_config: Record<string, number>;
  n: number;
}

const raw = rawDerived as unknown as RawDerived;

/* -------------------------------------------------------------------- gates */

const BLOCKING = ["one_population", "page_6_reproduced_exactly"] as const;

for (const claim of BLOCKING) {
  if (raw.claims[claim] !== true) {
    throw new Page17DataError(
      `page-17-derived.json fails the notebook's blocking claim "${claim}". ` +
        `That run may not be translated to a page: see docs/page_17_refactor.md.`,
    );
  }
}

if (raw.manifest.gates.B_page_6_reproduced.max_drift !== 0) {
  throw new Page17DataError(
    `page 17 re-aggregates page 6 and drifted by ` +
      `${raw.manifest.gates.B_page_6_reproduced.max_drift}. The deck would show one ` +
      `measurement with two values.`,
  );
}

/* ------------------------------------------------------- consistency checks */

const PRIMARY = raw.manifest.models.primary;
const FAMILY = raw.manifest.models.family;
const BUDGETS = raw.manifest.budgets;

if (!FAMILY.includes(PRIMARY)) {
  throw new Page17DataError("the primary checkpoint is not in the family it is drawn against");
}

for (const model of FAMILY) {
  if (!raw.ledger[model] || !raw.affected[model] || !raw.self_terminated[model]) {
    throw new Page17DataError(`page-17-derived.json is missing rows for ${model}`);
  }
  const a = raw.affected[model];
  if (a.rescued.length !== a.n_rescued || a.regressions.length !== a.n_regressions) {
    throw new Page17DataError(
      `${model} reports ${a.n_rescued} rescued and ${a.n_regressions} regressions but ` +
        `carries ${a.rescued.length} and ${a.regressions.length}`,
    );
  }
}

// The specimen is the step's whole centre, so it has to be what the page says it is:
// right at more than one cut, wrong at its own ending, and that ending its own rather
// than the cap. A specimen that fails any of these teaches the opposite lesson.
const sp = raw.specimen;
if (sp.by_budget.length !== BUDGETS.length) {
  throw new Page17DataError(
    `the specimen carries ${sp.by_budget.length} budgets against the ladder's ${BUDGETS.length}`,
  );
}
const specimenCuts = sp.by_budget.filter((b) => b.correct).map((b) => b.budget);
const specimenEnd = sp.by_budget[sp.by_budget.length - 1];
if (specimenCuts.length < 2) {
  throw new Page17DataError(
    "the specimen must be right at more than one cut, or it is a coin flip on screen",
  );
}
if (specimenEnd.correct) {
  throw new Page17DataError("the specimen must be wrong at its own ending");
}
if (specimenEnd.truncated) {
  throw new Page17DataError(
    "the specimen's ending must be the model's own, not the cap: a capped ending makes " +
      "this page 6's truncation finding wearing page 17's clothes",
  );
}
if (sp.by_budget.some((b) => !b.trace)) {
  throw new Page17DataError("the specimen is missing a trace at some budget");
}

// The two lit spans are offsets into the chain the model wrote for itself. They are the
// notebook's claim about where it goes wrong, so they are checked against the trace
// here: a run whose trace moved would otherwise light the wrong words with the same
// confidence as the right ones.
const naturalTrace = sp.by_budget[sp.by_budget.length - 1].trace;
const [aStart, aEnd] = sp.zones.assumption;
const [cStart, cEnd] = sp.zones.conclusion;
if (naturalTrace.slice(aStart, aEnd) !== sp.zones.mark) {
  throw new Page17DataError(
    `the specimen's assumption zone does not hold its declared mark "${sp.zones.mark}"`,
  );
}
if (!naturalTrace.slice(cStart, cEnd).includes("\\boxed{")) {
  throw new Page17DataError("the specimen's conclusion zone holds no boxed answer");
}
if (aEnd >= cStart) {
  throw new Page17DataError("the specimen concludes before it goes wrong");
}

// Every cut budget must know where its forced commit begins, because that span is the
// payload of the figure: the answer came from there and not from the working above it.
for (const b of sp.by_budget) {
  if (b.truncated && (b.commit === null || b.commit <= 0)) {
    throw new Page17DataError(`the specimen at budget ${b.budget} was forced but has no commit`);
  }
}

// Every control has to have a population, because each one is printed as a number and a
// control with n = 0 would read as a reassurance rather than as a test that was run.
const c1 = raw.controls.concluded_when_cut;
const c2 = raw.controls.blurt_arm;
const c3 = raw.controls.is_it_a_rule;
if (c1.n_cases === 0 || c2.n_items === 0) {
  throw new Page17DataError("a control was published with nothing in it");
}
if (c3.sampling_bracket.length !== 2) {
  throw new Page17DataError(
    "the resampling comparison needs both bracketing points, or the page cannot show " +
      "what it interpolated between",
  );
}

/* --------------------------------------------------- page 8's two unrendered tables */

const across = raw08.figure_3.reliability_across_temperatures as unknown as Record<
  string,
  RawAcross
>;
const discrimination = raw08.figure_3.discrimination as { signal: string; auc: number }[];

/** The four temperature columns, in order, read off any selector's `per_config`. */
const TEMP_CONFIGS = Object.keys(across["majority"]?.per_config ?? {}).sort();
if (TEMP_CONFIGS.length < 3) {
  throw new Page17DataError("page 8's temperature sweep has too few columns to draw a trend");
}

// Reliability decays with N as well as with temperature, so a figure that mixed depths
// would smuggle that decay into the comparison. The notebook holds depth fixed; the page
// asserts it rather than trusting the caption.
const depths = new Set(Object.values(across).map((a) => a.n));
if (depths.size !== 1) {
  throw new Page17DataError(
    `page 8's temperature sweep mixes candidate depths (${[...depths].join(", ")}), so ` +
      `temperature is not the only thing changing across it`,
  );
}

const temperatureOf = (configId: string): number => {
  const m = /^t(\d+\.\d+)-/.exec(configId);
  if (!m) throw new Page17DataError(`cannot read a temperature out of "${configId}"`);
  return Number(m[1]);
};

/** One selector's line across the temperature sweep. */
export interface ReliabilityLine {
  selector: string;
  label: string;
  /** True for the one judge that was trained to score rather than asked to judge. */
  trained: boolean;
  points: { temperature: number; reliability: number }[];
  first: number;
  last: number;
  fallPts: number;
}

// Kept short because they are drawn at the right edge of the sweep, where a long
// label either clips or steals width from the plot. The three best-of-N selectors
// are named by what does the judging, which is the only axis that separates them.
const LABELS: Record<string, string> = {
  "one chain": "one chain, unexamined",
  majority: "majority vote",
  "best-of-N (self)": "judged by itself",
  "best-of-N (qwen7b)": "judged by a bigger model",
  "best-of-N (skywork-prm)": "judged by a trained scorer",
};

const reliability: ReliabilityLine[] = Object.entries(LABELS).map(([selector, label]) => {
  const row = across[selector];
  if (!row) throw new Page17DataError(`page 8 published no reliability for "${selector}"`);
  const points = TEMP_CONFIGS.map((c) => ({
    temperature: temperatureOf(c),
    reliability: row.per_config[c],
  })).sort((a, b) => a.temperature - b.temperature);
  const first = points[0].reliability;
  const last = points[points.length - 1].reliability;
  return {
    selector,
    label,
    trained: selector.includes("prm"),
    points,
    first,
    last,
    fallPts: (first - last) * 100,
  };
});

const trainedLine = reliability.find((r) => r.trained)!;
const untrained = reliability.filter((r) => !r.trained);

// The figure's claim is a crossing, not a column: every model-as-judge decays and the
// trained one does not. If a future run breaks that, the page's sentence is wrong and it
// should fail here rather than render a caption the picture no longer supports.
if (!untrained.every((r) => r.fallPts > trainedLine.fallPts)) {
  throw new Page17DataError(
    "page 17's step 3 says every model-as-judge decays faster than the trained one, and " +
      "on this run at least one does not",
  );
}

const lengthSignal = discrimination.find((d) => d.signal === "trace length");
if (!lengthSignal) {
  throw new Page17DataError("page 8 published no trace-length discrimination");
}
if (lengthSignal.auc >= 0.5) {
  throw new Page17DataError(
    `page 17 calls trace length an anti-signal and this run scores it at ` +
      `${lengthSignal.auc.toFixed(3)}, which is not one`,
  );
}

/** Judges the inverted length rule beats, which is the only reason to mention it. */
const beatenByLength = discrimination.filter(
  (d) => d.signal.startsWith("verifier: ") && d.auc < 1 - lengthSignal.auc,
);

/* ------------------------------------------------------------------ exports */

const affectedCounts = FAMILY.map((m) => raw.affected[m].n_rescued);
const shortName = (id: string): string => id.split("/").pop() ?? id;

export const PAGE17 = {
  /** The run itself, for the provenance line. This page generated nothing. */
  run: {
    runId: raw.manifest.run_id,
    mode: raw.manifest.run_mode,
    generates: raw.manifest.generates,
    date: raw.manifest.timestamp_utc.slice(0, 10),
    primary: PRIMARY,
    primaryLabel: shortName(PRIMARY),
    family: FAMILY,
    familyLabels: FAMILY.map(shortName),
    items: raw.manifest.items.n,
    levels: raw.manifest.items.levels,
    budgets: BUDGETS,
    decoding: raw.manifest.decoding.strategy,
    sources: raw.manifest.sources,
    /**
     * False upstream, and the page's copy depends on it: page 8 ran its own pool over
     * these problems, so "the same problems" is true of it and "the same chains" is not.
     */
    page08SharesChains: raw.manifest.gates.A_one_population.page_08_same_chains === true,
  },

  /** Step 2a: what page 6's climbing curve netted out. */
  ledger: {
    primary: raw.ledger[PRIMARY],
    byModel: raw.ledger,
    /** True on the primary; the 1.5B's top rung is 0 and 0, so this is scoped. */
    everyRungLoses: raw.claims["every_rung_loses_answers_on_the_primary"] === true,
    topRungGainsNothing: raw.claims["top_rung_gains_nothing_on_the_primary"] === true,
  },

  /**
   * Step 2's required caption. Under greedy decoding a chain that has stopped itself is
   * not regenerated at a larger budget, it is the same generation, so the budget axis has
   * no room above the model's own stopping point. Without this the flat top reads as a
   * measured plateau rather than as the end of the axis.
   */
  axisBound: {
    shareSelfTerminated: raw.self_terminated[PRIMARY].share_at_max,
    meanOwnTokens: raw.self_terminated[PRIMARY].mean_own_tokens_at_max,
    truncationByBudget: raw.self_terminated[PRIMARY].truncation_by_budget,
    maxBudget: BUDGETS[BUDGETS.length - 1],
  },

  /** Step 2c: the one aggregate claim, which is about capability and not about budgets. */
  affected: {
    byModel: FAMILY.map((m) => ({
      model: m,
      label: shortName(m),
      rescued: raw.affected[m].n_rescued,
      regressions: raw.affected[m].n_regressions,
    })),
    primaryRescued: raw.affected[PRIMARY].rescued,
    counts: affectedCounts,
    fallsWithCapability: raw.claims["rescued_count_falls_with_capability"] === true,
    /**
     * A regression is any right-to-wrong step in the ladder; a rescued item is one wrong
     * at the top and right at some cut. They differ (the 7B has 4 and 2) and the page
     * talks about the second, so the two names must not be swapped in copy.
     */
    definitions: {
      regression: "any right-to-wrong step anywhere in the ladder",
      rescued: "wrong at the largest budget, right at some smaller cut",
    },
  },

  /** Step 2b: the specimen, and the only part of this page not in a derived.json already. */
  specimen: {
    problemId: sp.problem_id,
    shortId: sp.problem_id.replace(/^test\//, "").replace(/\.json$/, ""),
    model: sp.model_id,
    level: sp.level,
    subject: sp.subject,
    question: sp.question,
    groundTruth: sp.ground_truth,
    naturalLength: sp.natural_length,
    byBudget: sp.by_budget,
    rightWhenCutAt: specimenCuts,
    wrongAnswer: specimenEnd.extracted_answer,
    /** It breaks on all three checkpoints, which is as close to reproducible as one item gets. */
    alsoRegressesOn: sp.also_regresses_on.map(shortName),
    /**
     * The two spans the figure lights, in the chain the model wrote for itself: the
     * unjustified step, and what it committed to. Everything between them is correct
     * arithmetic downstream of the mistake, which is the part worth seeing.
     */
    zones: sp.zones,
    naturalTrace,
  },

  /**
   * Step 2's three controls. Each one was run to break the specimen's story and each one
   * partly succeeded, so the page prints all three beside it. `stoppingEarlyIsAStrategy`
   * and `cutPointsBeatResampling` are false on this run and the copy says so.
   */
  controls: {
    concludedWhenCut: {
      cases: c1.n_cases,
      withAConclusion: c1.n_with_a_concluding_step,
      boxedWhenFinished: c1.boxed_share_when_finished,
      boxedWhenCut: c1.boxed_share_when_cut,
      cameFromFinishedReasoning: raw.claims["rescues_came_from_finished_reasoning"] === true,
    },
    blurtArm: {
      items: c2.n_items,
      blurtRight: c2.forced_blurt_right,
      cotRight: c2.zero_shot_cot_right,
    },
    isItARule: {
      natural: c3.natural,
      fixedCut: c3.fixed_cut,
      fixedCutAccuracy: c3.fixed_cut_accuracy,
      oracle: c3.oracle_over_cuts,
      oracleTokenCost: c3.oracle_token_cost,
      samplingCoverage: c3.sampling_coverage_at_that_cost,
      samplingTemperature: c3.sampling_temperature,
      bracket: c3.sampling_bracket,
      stoppingEarlyIsAStrategy: raw.claims["stopping_early_is_a_strategy"] === true,
      cutPointsBeatResampling: raw.claims["cut_points_beat_resampling_per_token"] === true,
    },
  },

  /**
   * The claim page 17's deleted authored figure used to make, kept reachable as a stated
   * null. Section 4 of docs/page_17_findings.md is why it is unreachable on this
   * instrument rather than merely underpowered.
   */
  levelNull: {
    pooledEvents: raw.level_null["pooled_events"] as number,
    byLevel: Object.entries(raw.level_null)
      .filter(([k]) => k !== "pooled_events")
      .map(([level, v]) => ({
        level: Number(level),
        ...(v as { n: number; median_lost_at: number }),
      }))
      .sort((a, b) => a.level - b.level),
    easyBreaksSooner: raw.claims["easy_problems_break_sooner_than_hard"] === true,
  },

  /** Step 3a: page 8's temperature sweep, at a fixed candidate depth. */
  reliability: {
    lines: reliability,
    trained: trainedLine,
    depth: across["majority"].n,
    steepest: untrained.reduce((a, b) => (b.fallPts > a.fallPts ? b : a)),
    temperatures: reliability[0].points.map((p) => p.temperature),
  },

  /** Step 2d: the cheap instrument that works, from the same pile. */
  length: {
    auc: lengthSignal.auc,
    inverted: 1 - lengthSignal.auc,
    beats: beatenByLength.map((d) => ({
      judge: d.signal.replace("verifier: ", ""),
      auc: d.auc,
    })),
  },

  /**
   * What page 15 still borrows from page 9, wholesale rather than re-derived, so
   * page 9's gates run first and the two pages cannot disagree about one number.
   *
   * This was step 3b's whole instrument until 2026-08-10, when that beat was cut:
   * the sliver, the grader's audit surface and the selection null all went, first
   * to page 9 and then out of the deck. What is left is the two facts page 15 and
   * page 16 still argue from, and nothing here is drawn as a figure any more.
   */
  readable: {
    stepsTotal: PAGE9.graders.stepsTotal,
    shareUnjudged: PAGE9.graders.shareUnjudged,
    /**
     * Chains carrying no closed-form numeric claim anywhere. Page 15's step 4
     * argues for feedback from outside the model, and this is the number that
     * argues it: a calculator never fires at all on two chains in three.
     */
    nChainsUnreadable: PAGE9.detection.nChainsUnreadable,
    shareChainsUnreadable: PAGE9.detection.shareChainsUnreadable,
    nChains: PAGE9.detection.nChainsGraded,
  },
} as const;
