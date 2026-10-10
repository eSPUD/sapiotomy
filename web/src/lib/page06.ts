/**
 * Page 6's measured run, loaded from the notebook's committed `derived.json`.
 *
 * The boundary (notebooks/README.md): the notebook writes logs, the page reads
 * them. Nothing here recomputes a claim. `web/data/page-06-derived.json` is a
 * byte-for-byte copy of `notebooks/out/page_06/derived.json`, produced by
 * `page_06_thinking_longer.ipynb` from `traces.jsonl`, and the page ships the
 * file it draws from beside a download of the file that file came from.
 *
 * Page 5's `derived.json` carries an explicit `claims` block; page 6's does
 * not, so the gates below are computed from the run's own fields. They are the
 * same idea and they fail the same way: a run that does not pass is a load
 * error here, never a conditional in the component. The gates are the spec's
 * (docs/page_6_refactor.md sections 6 and 7):
 *
 *   · the specimen was found, not fallen back to (a flagged specimen must
 *     never be translated to a page)
 *   · the curve bends inside the grid, so the page may say it bent
 *   · the never-flipping band is big enough to see and small enough to be a
 *     band, so beat 3 has a payload and the item set was not simply too hard
 *   · the top of the grid does not bind, so the right end of the curve is a
 *     finished chain rather than a truncation
 *   · every checkpoint shares one tokenizer, which is the only thing that
 *     lets three curves sit on one token-budget x-axis
 *   · the run is a FULL one: QUICK is a preview and must not become a page
 *
 * The consistency assertions are the cross-language check in miniature. The
 * notebook's aggregates have to agree with each other arithmetically (a solve
 * count is its accuracy times n; a gain is the difference of two points; the
 * flip histogram plus the never-flippers is the item set), and figure 1's
 * bundled traces have to reconstruct from their token strings, because the
 * page draws the cut at a token boundary and a mismatch would put a lie on the
 * screen. A copy-paste of the wrong run into `web/data/` fails the build
 * rather than drawing a plausible wrong figure.
 */
import rawDerived from "@data/page-06-derived.json";
import { pairedTable } from "./paired";
import { pct, tidyMath } from "./traceText";

export { pct, tidyMath };

export class Page06DataError extends Error {}

/* --------------------------------------------------------------- raw shape */

interface RawBudgetRun {
  budget: number;
  trace: string;
  tokens: string[];
  /** Token index where the cap landed; null when the model finished on its own. */
  cut_index: number | null;
  /** Token index where the model's committed answer starts; null when unforced. */
  answer_start: number | null;
  truncated: boolean;
  forced: boolean;
  forced_suffix: string | null;
  answer_closed: boolean | null;
  extracted_answer: string;
  correct: boolean;
  own_tokens: number;
  answer_tokens: number;
  tokens_generated: number;
}

interface RawRow {
  problem_id: string;
  level: number;
  subject: string;
  question: string;
  ground_truth: string;
  first_correct_budget: number | null;
  /** The whole chain at the top budget: what the page greys out past the cut. */
  reference_tokens: string[];
  reference_truncated: boolean;
  by_budget: RawBudgetRun[];
}

interface RawCurvePoint {
  budget: number;
  n: number;
  n_correct: number;
  accuracy: number;
  mean_tokens: number;
  total_tokens: number;
  truncation_rate: number;
  forced_rate: number;
}

interface RawCurve {
  model_id: string;
  label: string;
  params: number;
  points: RawCurvePoint[];
  gains: { from_budget: number; to_budget: number; gain_pts: number }[];
  monotone: boolean;
  knee_budget: number | null;
  ceiling: number;
  floor: number;
  total_range_pts: number;
}

interface RawFlipItem {
  problem_id: string;
  level: number;
  subject: string;
  correct_by_budget: boolean[];
  first_correct_budget: number | null;
  /** Once it flips, does it stay flipped? */
  monotone: boolean;
  tokens_at_max: number;
  truncated_at_max: boolean;
}

interface RawWaitPoint {
  waits: number;
  n: number;
  n_correct: number;
  accuracy: number;
  mean_tokens: number;
  /** Share whose committed answer moved at all, by the grader's equivalence. */
  churn: number;
  offered_a_stop: number;
}

interface RawWaitPaired {
  waits: number;
  fixed: number;
  broken: number;
  p: number;
  n: number;
}

const D = rawDerived as unknown as {
  manifest: {
    run_id: string;
    run_mode: string;
    timestamp_utc: string;
    notebook_git_sha: string;
    models: {
      id: string;
      label: string;
      params: number;
      revision: string;
      dtype: string;
      tokenizer_sha256: string;
      role: string;
      quant: string;
    }[];
    decoding: { strategy: string; do_sample: boolean };
    budgets: number[];
    forcing: { stem: string; answer_allowance: number };
    items: { source: string; dataset: string; n: number; item_set_sha256: string; seed: number };
    grading: { extract: string; grade: string };
    prompt_template: string;
    versions: { torch: string; transformers: string; device: string };
    integrity: {
      n_records: number;
      n_forced: number;
      unclosed_forced_rate: number;
      prefix_exact_rate: number;
      n_prefix_comparisons: number;
      n_carried_forward: number;
      carry_forward_spot_check: { identical: boolean } | null;
    };
  };
  budgets: number[];
  procedure: string;
  pilot: {
    n: number;
    budget: number;
    accuracy: number;
    mean_own_tokens: number;
    truncation_rate: number;
    verdict: string;
    advice: string;
  } | null;
  figure_1: {
    specimen_id: string;
    specimen_is_fallback: boolean;
    flip_budget: number | null;
    n_candidate_specimens: number;
    rows: RawRow[];
  };
  figure_2: { curves: RawCurve[] };
  figure_3: {
    model_id: string;
    items: RawFlipItem[];
    histogram: Record<string, number>;
    never_flip_count: number;
    never_flip_share: number;
    n_regressions: number;
    clickable_row_ids: string[];
  };
  figure_wait: {
    waits: number[];
    word: string;
    curves: {
      model_id: string;
      label: string;
      params: number;
      points: RawWaitPoint[];
      paired: RawWaitPaired[];
    }[];
    integrity: { k0_matches_uncapped: [number, number] };
  } | null;
  handoff: {
    model_id: string;
    max_budget: number;
    min_budget: number;
    chains_at_min_budget: number;
    accuracy_at_max: number;
    accuracy_at_min: number;
    total_tokens_at_max: number;
    mean_tokens_at_max: number;
    never_flip_share: number;
    never_flip_count: number;
    n_items: number;
    page_5_endpoints: {
      source: string;
      run_id: string;
      model: string;
      suppressed: number;
      suppressed_tokens: number;
      unconstrained: number;
      unconstrained_tokens: number;
    } | null;
  };
};

const fail = (message: string): never => {
  throw new Page06DataError(`page-06-derived.json: ${message}`);
};

/* -------------------------------------------------------------- the gates */

/**
 * The never-flipping band has to be visible without being the whole strip.
 * Spec section 7: at 2% beat 3 has no payload, at 60% the item set is too hard
 * and the pilot's verdict was ignored.
 */
const NEVER_FLIP_MIN = 0.02;
const NEVER_FLIP_MAX = 0.6;

/** Above this share truncated at the top budget, the grid's top still binds. */
const TOP_TRUNCATION_MAX = 0.1;

/** The row figure 1 opens on. See `PAGE6.figure1.openingId` for why not the notebook's. */
const OPENING_ID = "test/counting_and_probability/1014.json";

/**
 * A problem whose statement is a drawing PROGRAM rather than prose.
 *
 * MATH-500 inlines Asymptote source for the geometry figures, and the page has
 * no Asymptote renderer, so the reader meets twenty lines of `label("$A$", A,
 * SW);` where a question should be. `tidyMath` cannot help: this is not LaTeX
 * standing in for a symbol, it is code standing in for a picture, and the only
 * honest renderings are to draw it or to not offer the problem. The traces
 * still ship in the download; what this hides is the button.
 *
 * The test is on the source rather than on an id, because the next run picks
 * its own specimens and a hardcoded exclusion would silently stop applying.
 */
const isDrawingProgram = (question: string) => /\[asy\]/.test(question);

if (D.manifest.run_mode !== "FULL") {
  fail(`run mode is "${D.manifest.run_mode}"; only a FULL run may be translated to the page`);
}
if (D.figure_1.specimen_is_fallback) {
  fail("figure 1's specimen is flagged as a fallback, which must never reach a page");
}
if (D.manifest.decoding.strategy !== "greedy" || D.manifest.decoding.do_sample) {
  fail("decoding is not greedy, so budget is not the only variable on this page");
}
for (const curve of D.figure_2.curves) {
  if (curve.knee_budget === null) {
    fail(
      `${curve.label} has not bent inside this grid, so the page may not say the curve bends; extend the grid instead`,
    );
  }
}
if (
  D.figure_3.never_flip_share < NEVER_FLIP_MIN ||
  D.figure_3.never_flip_share > NEVER_FLIP_MAX
) {
  fail(
    `${pct(D.figure_3.never_flip_share)} of problems never flip, outside the ${pct(NEVER_FLIP_MIN)} to ${pct(NEVER_FLIP_MAX)} band this page's third beat needs`,
  );
}
{
  const tokenizers = new Set(D.manifest.models.map((m) => m.tokenizer_sha256));
  if (tokenizers.size !== 1) {
    fail(
      "the checkpoints do not share one tokenizer, so their curves cannot share a token-budget axis",
    );
  }
}
{
  // The top of the grid must have let go: otherwise the right end of every
  // curve is a truncation rather than a finished chain.
  const top = D.budgets[D.budgets.length - 1];
  for (const curve of D.figure_2.curves) {
    const atTop = curve.points.find((p) => p.budget === top);
    if (!atTop) fail(`${curve.label} has no point at the top budget ${top}`);
    if (atTop!.truncation_rate > TOP_TRUNCATION_MAX) {
      fail(
        `${curve.label} is still truncated on ${pct(atTop!.truncation_rate)} of items at ${top} tokens, so the top of the grid still binds`,
      );
    }
  }
}

if (D.figure_wait) {
  // k=0 is the model left alone, which IS the cap arm at the top budget. If those
  // traces do not reproduce, the two arms are not one experiment and the page may
  // not put them on one instrument.
  const [same, of] = D.figure_wait.integrity.k0_matches_uncapped;
  if (of > 0 && same / of < 0.9) {
    fail(`the wait arm reproduces only ${same} of ${of} uncapped traces at k=0, so the two arms are not the same experiment`);
  }
  for (const c of D.figure_wait.curves) {
    for (const pt of c.points) {
      if (Math.abs(pt.n_correct / pt.n - pt.accuracy) > 1e-9) {
        fail(`${c.label} at ${pt.waits} waits reports ${pt.n_correct}/${pt.n} but an accuracy of ${pt.accuracy}`);
      }
    }
  }
}

/* ------------------------------------------------- consistency assertions */

for (const curve of D.figure_2.curves) {
  if (curve.points.length !== D.budgets.length) {
    fail(`${curve.label} has ${curve.points.length} points for ${D.budgets.length} budgets`);
  }
  curve.points.forEach((p, i) => {
    if (p.budget !== D.budgets[i]) fail(`${curve.label} point ${i} is budget ${p.budget}`);
    if (Math.abs(p.n_correct / p.n - p.accuracy) > 1e-9) {
      fail(`${curve.label} at ${p.budget} reports ${p.n_correct}/${p.n} but an accuracy of ${p.accuracy}`);
    }
  });
  curve.gains.forEach((g, i) => {
    const measured = (curve.points[i + 1].accuracy - curve.points[i].accuracy) * 100;
    if (Math.abs(measured - g.gain_pts) > 1e-6) {
      fail(`${curve.label}'s gain from ${g.from_budget} does not match its own points`);
    }
  });
  // The page draws the measured points and never a smoothed line, so a curve
  // that dips must arrive here labelled as one.
  const dips = curve.gains.some((g) => g.gain_pts < 0);
  if (dips === curve.monotone) {
    fail(`${curve.label} is flagged monotone=${curve.monotone} but its gains say otherwise`);
  }
}

{
  const items = D.figure_3.items;
  const never = items.filter((d) => d.first_correct_budget === null);
  if (never.length !== D.figure_3.never_flip_count) {
    fail(`${never.length} items never flip but the run reports ${D.figure_3.never_flip_count}`);
  }
  if (Math.abs(never.length / items.length - D.figure_3.never_flip_share) > 1e-9) {
    fail("the never-flip share is not the never-flip count over the item set");
  }
  const histTotal = Object.values(D.figure_3.histogram).reduce((a, b) => a + b, 0);
  if (histTotal + never.length !== items.length) {
    fail(`the flip histogram plus the never-flippers is ${histTotal + never.length}, not ${items.length}`);
  }
  const regressions = items.filter((d) => !d.monotone).length;
  if (regressions !== D.figure_3.n_regressions) {
    fail(`${regressions} items regress but the run reports ${D.figure_3.n_regressions}`);
  }
  for (const d of items) {
    if (d.correct_by_budget.length !== D.budgets.length) {
      fail(`${d.problem_id} has ${d.correct_by_budget.length} verdicts for ${D.budgets.length} budgets`);
    }
    const first = d.correct_by_budget.findIndex(Boolean);
    const expected = first === -1 ? null : D.budgets[first];
    if (expected !== d.first_correct_budget) {
      fail(`${d.problem_id}'s flip point does not match its own verdicts`);
    }
  }
}

for (const row of D.figure_1.rows) {
  const reference = row.reference_tokens.join("");
  if (row.by_budget.length !== D.budgets.length) {
    fail(`${row.problem_id} carries ${row.by_budget.length} budgets, not ${D.budgets.length}`);
  }
  for (const run of row.by_budget) {
    if (run.tokens.join("") !== run.trace) {
      fail(`${row.problem_id} at ${run.budget}: token strings do not rebuild the trace`);
    }
    if (run.forced) {
      if (run.cut_index === null || run.answer_start === null) {
        fail(`${row.problem_id} at ${run.budget} is forced but carries no cut`);
      }
      if (run.own_tokens !== run.cut_index) {
        fail(`${row.problem_id} at ${run.budget}: the cut is not where the thinking ended`);
      }
      if (run.own_tokens > run.budget) {
        fail(`${row.problem_id} at ${run.budget}: thinking ran past its cap`);
      }
      if (run.tokens_generated !== run.own_tokens + run.answer_tokens) {
        fail(`${row.problem_id} at ${run.budget}: the token counts do not add up`);
      }
    }
    // Figure 1 greys out what the model would have written past the cut, which
    // is only honest if the visible text really is the beginning of it.
    const own = run.forced ? run.tokens.slice(0, run.cut_index!).join("") : run.trace;
    if (!reference.startsWith(own)) {
      fail(`${row.problem_id} at ${run.budget} is not a prefix of its own full chain`);
    }
  }
  const first = row.by_budget.findIndex((r) => r.correct);
  const expected = first === -1 ? null : D.budgets[first];
  if (expected !== row.first_correct_budget) {
    fail(`${row.problem_id}'s bundled flip point does not match its bundled verdicts`);
  }
}

{
  const bundled = new Set(D.figure_1.rows.map((r) => r.problem_id));
  for (const id of D.figure_3.clickable_row_ids) {
    if (!bundled.has(id)) fail(`figure 3 offers ${id} but its traces are not bundled`);
  }
  if (!bundled.has(D.figure_1.specimen_id)) {
    fail(`figure 1's specimen ${D.figure_1.specimen_id} is not among the bundled traces`);
  }
  if (!bundled.has(OPENING_ID)) {
    fail(`figure 1 opens on ${OPENING_ID}, whose traces are not bundled`);
  }
  {
    // The picker may lose a problem to `isDrawingProgram`; the row the page
    // OPENS on may not, because there would be nothing to fall back to and the
    // first thing the reader meets would be twenty lines of Asymptote.
    const opening = D.figure_1.rows.find((r) => r.problem_id === OPENING_ID)!;
    if (isDrawingProgram(opening.question)) {
      fail(`figure 1 opens on ${OPENING_ID}, whose statement is an Asymptote drawing program`);
    }
    const offered = D.figure_3.clickable_row_ids.filter(
      (id) => !isDrawingProgram(D.figure_1.rows.find((r) => r.problem_id === id)!.question),
    );
    if (offered.length < 4) {
      fail(`only ${offered.length} bundled problems read as prose, which is not a picker`);
    }
  }
  {
    // The row the page opens on has to demonstrate the thing the page claims:
    // wrong below some budget, right at and above it, and cut where it is
    // wrong. A run that no longer satisfies that is a run this page was not
    // written against.
    const opening = D.figure_1.rows.find((r) => r.problem_id === OPENING_ID)!;
    const flip = opening.by_budget.findIndex((r) => r.correct);
    if (flip < 1) fail(`figure 1's opening row does not flip above the smallest budget`);
    if (!opening.by_budget[flip - 1].forced) {
      fail(`figure 1's opening row is not cut at the budget below its flip`);
    }
    if (!opening.by_budget.slice(flip).every((r) => r.correct)) {
      fail(`figure 1's opening row goes right and then wrong again`);
    }
  }
}

{
  const h = D.handoff;
  if (h.chains_at_min_budget !== Math.floor(h.max_budget / h.min_budget)) {
    fail("the handoff's chain count is not the top budget over the bottom one");
  }
  if (Math.abs(h.never_flip_share - D.figure_3.never_flip_share) > 1e-9) {
    fail("the handoff and figure 3 disagree about the never-flip share");
  }
}

/* ------------------------------------------------------------- the exports */

export interface BudgetRun {
  budget: number;
  tokens: string[];
  cutIndex: number | null;
  answerStart: number | null;
  truncated: boolean;
  forced: boolean;
  answerClosed: boolean | null;
  extractedAnswer: string;
  correct: boolean;
  ownTokens: number;
  tokensGenerated: number;
}

export interface SpecimenRow {
  problemId: string;
  level: number;
  subject: string;
  question: string;
  groundTruth: string;
  firstCorrectBudget: number | null;
  referenceTokens: string[];
  /** True when even the top budget did not let this chain finish. */
  referenceTruncated: boolean;
  byBudget: BudgetRun[];
  /** A short label for the row picker: where this problem flips, if it does. */
  flipLabel: string;
}

const BUDGETS = D.budgets;

/**
 * Lower median: on an even count take the lower of the two middle values rather
 * than their mean, so the number the page prints is a length some chain in the
 * run actually ran to and not an average of two that no chain did.
 */
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) throw new Page06DataError("median of an empty set");
  return s[Math.floor((s.length - 1) / 2)];
}

function row(raw: RawRow): SpecimenRow {
  return {
    problemId: raw.problem_id,
    level: raw.level,
    subject: raw.subject,
    question: raw.question,
    groundTruth: raw.ground_truth,
    firstCorrectBudget: raw.first_correct_budget,
    referenceTokens: raw.reference_tokens,
    referenceTruncated: raw.reference_truncated,
    byBudget: raw.by_budget.map((r) => ({
      budget: r.budget,
      tokens: r.tokens,
      cutIndex: r.cut_index,
      answerStart: r.answer_start,
      truncated: r.truncated,
      forced: r.forced,
      answerClosed: r.answer_closed,
      extractedAnswer: r.extracted_answer,
      correct: r.correct,
      ownTokens: r.own_tokens,
      tokensGenerated: r.tokens_generated,
    })),
    flipLabel:
      raw.first_correct_budget === null ? "never" : `${raw.first_correct_budget} tokens`,
  };
}

/**
 * The four zones figure 1 tints differently, in the order they were written.
 *
 * `own` is the model's, up to where the cap landed. `unwritten` is the rest of
 * the chain it would have written and was not allowed to, taken from the same
 * problem's run at the top budget — greyed, never hidden, because that is the
 * single most important pixel on the page. `stem` is our intervention, the
 * closing of the block and the forced-answer prefix. `answer` is what the model
 * committed to once we made it commit.
 */
export interface TraceZones {
  own: string;
  unwritten: string;
  stem: string;
  answer: string;
  /** False when the model finished inside its budget: no cut, no forcing. */
  wasCut: boolean;
}

export function traceZones(r: SpecimenRow, budgetIndex: number): TraceZones {
  const run = r.byBudget[budgetIndex];
  if (!run.forced) {
    return { own: run.tokens.join(""), unwritten: "", stem: "", answer: "", wasCut: false };
  }
  const own = run.tokens.slice(0, run.cutIndex!).join("");
  return {
    own,
    unwritten: r.referenceTokens.join("").slice(own.length),
    stem: run.tokens.slice(run.cutIndex!, run.answerStart!).join(""),
    answer: run.tokens.slice(run.answerStart!).join(""),
    wasCut: true,
  };
}

const rows = D.figure_1.rows.map(row);

export const PAGE6 = {
  manifest: D.manifest,
  budgets: BUDGETS,
  /** The one line printed under figure 2: cap, force, grade, sweep. */
  procedure: D.procedure,
  pilot: D.pilot,
  figure1: {
    specimenId: D.figure_1.specimen_id,
    flipBudget: D.figure_1.flip_budget,
    nCandidates: D.figure_1.n_candidate_specimens,
    /**
     * The row figure 1 opens on, which is NOT the notebook's specimen.
     *
     * The notebook ranks candidates by where they flip and how short they are;
     * it cannot see what the answer says. Its pick flips at 512 because at 256
     * the model wrote the right value behind the prompt template's placeholder
     * ("ANSWER 3√3/4") and the grader could not read it. Two records in 1,500
     * are like that and the notebook's specimen is one, so its flip is partly
     * the grader rather than the budget, which is the one thing figure 1 exists
     * to show. This row answers 360 and then 480: wrong for a real reason, then
     * right. Both rows ship, and the notebook's pick is still in the picker.
     */
    openingId: OPENING_ID,
    rows,
  },
  figure2: {
    curves: D.figure_2.curves,
    primary: D.figure_2.curves.find((c) => c.model_id === D.handoff.model_id) ?? D.figure_2.curves[0],
  },
  figure3: {
    modelId: D.figure_3.model_id,
    items: D.figure_3.items,
    histogram: D.figure_3.histogram,
    neverFlipCount: D.figure_3.never_flip_count,
    neverFlipShare: D.figure_3.never_flip_share,
    nRegressions: D.figure_3.n_regressions,
    /**
     * What figure 1's picker offers. The notebook ranks candidates by what they
     * demonstrate and cannot see how they read, so a problem whose statement is
     * an Asymptote program is filtered out here rather than there: it is a
     * presentation fact about this page, not a fact about the run.
     */
    clickableRowIds: D.figure_3.clickable_row_ids.filter(
      (id) => !isDrawingProgram(D.figure_1.rows.find((r) => r.problem_id === id)!.question),
    ),
    /**
     * Chains still running when the top budget arrived. Their `tokens_at_max`
     * is a lower bound rather than a length, so the figure draws them off the
     * axis and the page never averages them in with the measured ones.
     */
    censoredCount: D.figure_3.items.filter((d) => d.truncated_at_max).length,
    /**
     * Never solved AND finished on its own. This is an intersection, not the
     * never-solved count minus the censored count: the two sets overlap in five
     * items, not six, because one censored chain does come right (at 1024). The
     * page's third claim counts these, and a reader can count them on the strip.
     */
    neverFlipFinishedCount: D.figure_3.items.filter(
      (d) => !d.correct_by_budget.some(Boolean) && !d.truncated_at_max,
    ).length,
    /**
     * The median length of a chain that never grades correct and was not still
     * running when the cap arrived. Load-bearing for the page's third claim:
     * these chains stopped on their own, well inside the budget, so what limits
     * them is not the dial. The censored ones are excluded because their length
     * is a lower bound, which is the promise the note above makes.
     */
    medianLengthNever: median(
      D.figure_3.items
        .filter((d) => !d.correct_by_budget.some(Boolean) && !d.truncated_at_max)
        .map((d) => d.tokens_at_max),
    ),
  },
  /**
   * The extension arm: what the model did when it was not allowed to stop.
   * Null when the run predates the arm, and the page drops the step rather than
   * drawing an empty one.
   */
  figureWait: D.figure_wait,
  handoff: D.handoff,
} as const;

/** A p-value the way the other pages print it. */
export const pLabel = (p: number): string =>
  p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(p < 0.01 ? 4 : 3)}`;

/**
 * The extension arm as page 5's paired grid: one square per problem, at the
 * deepest injection count, for the primary checkpoint.
 *
 * This figure used to lead with three nearly flat accuracy lines, which reads as
 * "nothing happened" when the finding is that a great deal happened and none of
 * it helped. The grid says that in one picture: the two discordant blocks are
 * both large and they cancel. Built from the notebook's own fixed and broken
 * counts, so nothing here is a second measurement.
 */
export const WAIT_TABLE = (() => {
  const w = D.figure_wait;
  if (!w) return null;
  const curve = w.curves.find((c) => c.model_id === D.figure_2.curves[0].model_id) ?? w.curves[0];
  const paired = curve.paired[curve.paired.length - 1];
  const before = curve.points[0];
  const after = curve.points.find((p) => p.waits === paired.waits);
  if (!after) return null;
  // Churn counts every answer that moved; the grid lights only the ones that
  // changed the VERDICT. The difference is the wrong answers that became other
  // wrong answers, and it has to be said, or a reader who compares 30% against
  // 19 lit squares finds the figure and the readout disagreeing.
  const moved = Math.round(after.churn * paired.n);
  return {
    label: curve.label,
    waits: paired.waits,
    p: paired.p,
    churn: after.churn,
    moved,
    movedWithoutChangingTheVerdict: Math.max(0, moved - paired.fixed - paired.broken),
    tokenMultiple: after.mean_tokens / before.mean_tokens,
    before: before.n_correct,
    after: after.n_correct,
    table: pairedTable(paired.n, before.n_correct, after.n_correct, paired),
  };
})();

/**
 * Where this chain stops needing the dial: the length it runs to when nothing
 * cuts it, and the first budget that lets it get there. Past that stop the
 * dial has no more travel on this problem, and figure 1 says so rather than
 * leaving the reader dragging a control that does nothing.
 */
export function naturalLength(r: SpecimenRow): { tokens: number; fromBudget: number } | null {
  const finished = r.byBudget.find((b) => !b.forced);
  return finished ? { tokens: finished.ownTokens, fromBudget: finished.budget } : null;
}

/** Look up a bundled problem by id. Figure 3's row picker feeds figure 1. */
export function rowById(problemId: string): SpecimenRow {
  const found = rows.find((r) => r.problemId === problemId);
  if (!found) throw new Page06DataError(`no bundled traces for ${problemId}`);
  return found;
}

/** A count of tokens the way the readouts print it. */
export const tokens = (n: number): string => n.toLocaleString("en-US");
