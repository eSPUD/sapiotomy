/**
 * Page 16's material: the closing ledger and the concept check.
 *
 * This page GENERATES NOTHING and DIGITIZES NOTHING. Every number it shows is
 * read back out of a module that already loaded, validated and gated it, which
 * is the whole point of a wrap-up: if a number here disagrees with the page it
 * came from, the deck contradicts itself in front of the reader on its last
 * page. So nothing below is retyped. The one thing this module adds is the
 * arrangement, plus the checks that the arrangement is honest.
 *
 * THE LADDER (section 1) is one chart of the whole toolbox, and it is only
 * allowed to exist because the rungs are comparable. `assertSameItems` refuses
 * to build it if the six runs that feed it stop agreeing about how many
 * problems they measured, because the chart's entire claim is that these bars
 * can be read against each other.
 *
 * THE SPINE IS PAGE 11'S RE-DERIVATION, not page 8's pool. Page 7 measures its
 * vote at 55% and page 8 measures one at 56% on candidates it generated itself.
 * Both are true and page 8 says so. The ladder quotes page 11 because page 11
 * is the only run that re-aggregates pages 6, 7 and 8 into ONE accounting (its
 * gate 1 reproduces them bit-exactly) and the only one that also prices them in
 * FLOPs. Quoting a vote from one run and a selector from another would invent a
 * step between them that nobody measured. Do not "fix" the 55/56 discrepancy by
 * averaging: it is two pools, and page 8 owns the paired test between them.
 *
 * THE BILL IS SPENT IN PROSE, NOT IN A COLUMN. Page 11 priced four of these
 * rungs in measured FLOPs and nothing else in the deck priced anything, because
 * mean tokens are not FLOPs. A column with four numbers and six blanks reads as
 * missing data rather than as two kinds of run, and the price only actually
 * decides one comparison on the page. So `bill` stays in the data, the chart
 * stays a chart of accuracy, and the one comparison that turns on cost is made
 * in a sentence where it can carry its own units.
 *
 * SEARCH IS NOT A RUNG. Page 10 taught it and never ran it: its tree is
 * hand-authored, its bars are Yao et al.'s on Game of 24 and crosswords, and
 * the arm that would measure it ships unrun. It is not drawn, and it is not
 * silently dropped either: the takeaways below carry what the deck does know
 * about it. Do not give it a bar without a run behind it, and do not borrow
 * Yao et al.'s number, which is another task on another axis.
 *
 * PAGE 9'S RUNG CARRIES ITS OWN BASELINE. Its filtering arm ran over a pool
 * whose vote sits at 57%, so the only true statement is "57 to 58, one problem
 * in a hundred". Drawn as a bare 58% beside page 8's 60% it would read as a
 * technique that lost by two points to a comparison nobody ran.
 *
 * THE OTHER AXIS is quoted but not plotted. See `OTHER_AXIS` below for why
 * R1-Distill-Qwen-1.5B's 83.9 on MATH-500 cannot be a bar next to our 1.5B's
 * 22, and for the deck's own measurement of how much of that gap is the item
 * mix rather than the distillation.
 *
 * THE CONCEPT CHECK (section 2) is ten questions, and every one of them is
 * about a MECHANISM rather than a magnitude. A reader who has understood the
 * deck can answer all ten without remembering a single number; the numbers
 * appear only as the setting the question is asked in, and they are
 * interpolated from the measured modules so a re-run cannot leave the question
 * stem quoting a figure the page no longer draws.
 *
 * Three rules the question set is built to, and `page16.test.ts` enforces all
 * three:
 *   1. Exactly one correct option per question, and no two options identical.
 *      A distractor that collides with the answer after a re-run changes the
 *      number is the failure mode this file is most exposed to.
 *   2. Every `page` a question cites is a page that exists. This was written
 *      the day four pages were cut, which is precisely when that stops being
 *      automatic.
 *   3. No em dash or en dash anywhere in the rendered strings (deck house
 *      rule). The component test sweeps the DOM; this one catches it in the
 *      source, where the fix is obvious.
 */
// The retired page 5 run (100 level 4 and 5 problems), not the page's current runs:
// its problems are page 6's, so the ladder can pair them.
import { PAGE5 } from "./page05HowToReason";
import { PAGE6, WAIT_TABLE, pLabel } from "./page06";
import { PAGE7 } from "./page07";
import { PAGE8 } from "./page08";
import { PAGE9 } from "./page09";
import { PAGE11 } from "./page11";
import { PAGE17 } from "./page17";
import { curves } from "./curves";
import { PAGES } from "./pages";

export class Page16DataError extends Error {}

/** Percentages, formatted the way every other page in the deck formats them. */
export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)}%`;

/* --------------------------------------------------------------- the ladder */

/**
 * The three movements the rungs are grouped in. This is an ORDERING and a
 * semantic tag, not a set of headings: drawing them turned the chart into a
 * table of contents, doubled its height and pulled every readout off its own
 * bar. The prose under the chart names the movements instead.
 *
 * `elsewhere` is the one the rendering still reads: it is the row measured on a
 * different model, so it is coloured apart and excluded from "best technique".
 */
export type BandKey = "chain" | "sample" | "elsewhere";

export const BAND_KEYS: BandKey[] = ["chain", "sample", "elsewhere"];

export interface Rung {
  band: BandKey;
  /** What was done to get this score. */
  label: string;
  /** The measured accuracy on 100 MATH-500 level 4 and 5 problems. */
  accuracy: number;
  /** Which page measured it, for the provenance column. */
  page: number;
  /**
   * The number this rung was measured against, when that is NOT the deck's
   * 43% greedy chain. Page 9 filtered a pool of its own whose vote sits at
   * 57%, so its result may only be read as the step from 57 to 58. Drawing it
   * as a bare 58% next to page 8's 60% would invent a comparison nobody ran.
   */
  baseline?: number;
  /**
   * Measured inference FLOPs, as a multiple of one greedy chain from the 3B.
   * Present ONLY on the rungs page 11 priced: it computed these properly and
   * the rest of the deck did not, and a token count is not a FLOP count.
   *
   * This is NOT drawn as a column. A number in every row that had one and a
   * blank in every row that did not reads as missing data rather than as two
   * different kinds of run, and the bill only actually decides one comparison.
   * So it is spent in prose, where it can be said in a sentence, and the chart
   * stays a chart of accuracy.
   */
  bill?: number;
  /** One clause on what the rung is, not what it scored. */
  note: string;
  /** A ceiling nothing reached, drawn hollow because it is not a technique. */
  ceiling?: boolean;
}

/**
 * The rungs must be talking about the same problem set or the chart is a lie
 * told in a legible font. Five separate runs put bars on this axis, so the item
 * counts are the thing to check: if a re-run changes one of them, these bars
 * stop being comparable and the page must not draw them.
 */
function assertSameItems(): number {
  const counts: [string, number][] = [
    ["page 5's suppression arm", PAGE5.figure2.bare.n],
    ["page 6's budget sweep", PAGE6.figure2.primary.points[0].n],
    ["page 8's paired comparison", PAGE8.paired.items],
    ["page 9's step grading", PAGE9.run.items],
    ["page 11's hard band", PAGE11.bands.hard.nItems],
    ["page 14's re-read", PAGE17.run.items],
  ];
  const [, first] = counts[0];
  for (const [what, n] of counts) {
    if (n !== first) {
      throw new Page16DataError(
        `page 16's ladder puts runs side by side that measured different item sets: ` +
          `${counts[0][0]} has ${first} problems and ${what} has ${n}. ` +
          `The chart's only claim is that these bars are comparable, so it must not be drawn.`,
      );
    }
  }
  return first;
}

const ITEMS = assertSameItems();

/**
 * Two of the numbers this page is built on are optional upstream: page 8's
 * coverage is null when the run did not compute it, and page 11's best-of-N
 * point is null when that arm did not complete. Both are load-bearing here (the
 * ceiling IS the chart's argument, and the crossing is its closing sentence), so
 * a missing one is a load error rather than a bar that quietly does not draw.
 */
function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Page16DataError(
      `page 16 needs ${what}, and the run it comes from does not carry it. ` +
        `The wrap-up cannot draw a partial ladder: its only claim is that the rungs are a complete set.`,
    );
  }
  return value;
}

const HARD = PAGE11.bands.hard;
const EASY = PAGE11.bands.easy;
const greedyOf = (band: typeof HARD, size: string) => {
  const row = band.greedy.find((g) => g.label.includes(size));
  if (!row) {
    throw new Page16DataError(`page 11's ${band.key} band has no ${size} greedy row for page 16`);
  }
  return row;
};

const GREEDY_3B = greedyOf(HARD, "3B");
const VOTE_16 = HARD.voteCurve[HARD.voteCurve.length - 1];
const BEST_OF = required(
  HARD.bestOf,
  "page 11's best-of-N point on the hard band, which prices the selector against a bigger model",
);
const COVERAGE = required(PAGE8.coverage, "page 8's coverage, which is the ladder's ceiling");

/**
 * The bill column's unit: one greedy chain from the 3B, the model every rung in
 * the first two bands is running. Page 11 measured these FLOPs; this only
 * changes their denominator, from its own 7B target to the chain a reader of
 * this chart is actually looking at.
 */
const bill = (flops: number) => flops / GREEDY_3B.flops;

/** Page 6's sweep, looked up by budget: a positional index would silently re-point. */
const budgetRung = (budget: number) => {
  const r = PAGE6.figure2.primary.points.find((p) => p.budget === budget);
  if (!r) {
    throw new Page16DataError(
      `page 16's ladder is written about the ${budget}-token rung, which page 6's sweep no longer has`,
    );
  }
  return r;
};

/**
 * Page 5's bare arm and the top of page 6's sweep are the same measurement made
 * twice: one greedy chain from the 3B on these hundred items, uncapped in
 * practice. The ladder quotes page 5, because page 5 is where that number is
 * established as a paired result against the blurt arm and page 6 inherits it
 * as the end of an axis. If the two ever disagree, one of the runs moved and
 * the band is telling a story about two different models.
 */
function assertBaselineAgrees(): void {
  const p5 = PAGE5.figure2.bare.accuracy;
  const p6 = PAGE6.figure2.primary.points[PAGE6.figure2.primary.points.length - 1].accuracy;
  if (p5 !== p6) {
    throw new Page16DataError(
      `page 16's baseline rung: page 5 measures one greedy chain at ${pct(p5)} and page 6's ` +
        `top rung measures it at ${pct(p6)}. The ladder puts page 6's budget rungs under page ` +
        `5's full chain, which only reads as one climb while those agree.`,
    );
  }
}

const TOP_BUDGET = PAGE6.budgets[PAGE6.budgets.length - 1];
const FINISHED = budgetRung(TOP_BUDGET);
assertBaselineAgrees();

/**
 * Page 6's other arm: refuse to let the chain stop, append `Wait`, make it carry
 * on. It is the deck's one measurement of forcing MORE reasoning onto a model
 * that had finished, and it is a null, which is why it belongs on a summary
 * chart next to the chain that is worth 36 points.
 *
 * Its `before` is the same greedy chain as the rung above it, so the two rungs
 * are a paired arm and the reader can read the step between them directly. If
 * they ever stop agreeing, the pair is two different runs and must not be drawn
 * as one step.
 */
const WAIT = required(
  WAIT_TABLE,
  "page 6's wait-injection arm, which is the chart's only measurement of forcing more thinking",
);
if (WAIT.before / WAIT.table.n !== PAGE5.figure2.bare.accuracy) {
  throw new Page16DataError(
    `page 16 draws page 6's wait arm directly under the greedy chain it extends, but the arm ` +
      `starts from ${pct(WAIT.before / WAIT.table.n)} and the chain above it is ` +
      `${pct(PAGE5.figure2.bare.accuracy)}. Those are two different runs and the step between ` +
      `them is not a measurement.`,
  );
}

/**
 * The whole toolbox as one column of bars, floor to ceiling, in three bands.
 *
 * The order is the deck's order and the shape it makes is the deck's argument.
 * Writing the reasoning at all is the biggest single step on the chart, and
 * nothing after it comes close. Length is the next: a chain cut at 128 tokens
 * scores what no chain at all scores, which is the cheapest way to see that the
 * tokens are the computation. Then sampling, voting and selecting, in steps
 * that keep shrinking. Then the step that never comes, the coverage line.
 *
 * The last band is one row and it is the point of drawing the other nine: the
 * same 60% the best selector reached for 21.6 greedy chains is reached by a
 * bigger model for 2.2 of them.
 */
/**
 * The shipped notebook for each page whose run this chart draws. Filenames are
 * the zips in `public/notebooks`; `notebookBundles.test.ts` is what keeps those
 * archives honest about the runs they carry, and this table only has to point at
 * the right one. Any page that gains a rung must gain an entry here, and NOTEBOOKS
 * throws rather than silently omitting a source.
 */
/** A page's download: a zip bundle (notebook, harness, traces) unless `format` says a bare .ipynb. */
type NotebookLink = { title: string; href: string; size: string; format?: "zip" | "ipynb" };
const NOTEBOOK_BY_PAGE: Record<number, NotebookLink | NotebookLink[]> = {
  // Page 5 links the author's two notebooks as plain files, as page 5 itself does.
  5: [
    { title: "Zero-shot vs few-shot", href: "/notebooks/5_CoT_ZeroShot-vs-FewShot.ipynb", size: "228 KB", format: "ipynb" },
    { title: "Base few-shot vs instruct", href: "/notebooks/5_CoT_BaseFewShot-vs-Instruct.ipynb", size: "908 KB", format: "ipynb" },
  ],
  6: { title: "Thinking longer, and budget forcing", href: "/notebooks/page-06-thinking-longer.zip", size: "2.0 MB" },
  7: { title: "Sampling and voting", href: "/notebooks/page-07-frequency-voting.zip", size: "3.0 MB" },
  8: { title: "Best-of-N and the judges", href: "/notebooks/page-08-best-of-n.zip", size: "9.7 MB" },
  9: { title: "Outcome against process grading", href: "/notebooks/page-09-outcome-vs-process.zip", size: "1.6 MB" },
  10: { title: "The search arm", href: "/notebooks/page-10-search-arm.zip", size: "4.8 MB" },
  11: { title: "Training against scale", href: "/notebooks/page-11-training-vs-scale.zip", size: "2.7 MB" },
};

export const LADDER: Rung[] = [
  {
    band: "chain",
    label: "no chain at all, forced to answer immediately",
    accuracy: PAGE5.figure2.blurt.accuracy,
    page: 5,
    note: `${PAGE5.figure2.blurt.medianTokens} tokens, median`,
  },
  {
    band: "chain",
    label: "one chain of thought, greedy",
    accuracy: PAGE5.figure2.bare.accuracy,
    page: 5,
    bill: bill(GREEDY_3B.flops),
    note: `${PAGE5.figure2.bare.medianTokens} tokens, median; the baseline every later rung is paired against`,
  },
  {
    band: "chain",
    label: "one chain, forced to keep thinking",
    accuracy: WAIT.after / WAIT.table.n,
    page: 6,
    note: `${WAIT.tokenMultiple.toFixed(1)} times the tokens, ${WAIT.table.afterOnly} answers turned right against ${WAIT.table.beforeOnly} turned wrong, ${pLabel(WAIT.p)}`,
  },
  {
    band: "sample",
    label: `${PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].n} chains at temperature zero, voted`,
    accuracy: PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    page: 7,
    note: "identical copies, so the vote sees one opinion",
  },
  {
    band: "sample",
    label: `${VOTE_16.n} sampled chains, voted`,
    accuracy: VOTE_16.accuracy,
    page: 7,
    bill: bill(VOTE_16.flops),
    note: "diversity is what the vote actually buys",
  },
  {
    band: "sample",
    label: `${VOTE_16.n} sampled chains, trained verifier picks one`,
    accuracy: BEST_OF.accuracy,
    page: 8,
    bill: bill(BEST_OF.flops),
    note: `beats one chain at ${
      PAGE8.headline.p < 0.001 ? "p < 0.001" : `p = ${PAGE8.headline.p.toFixed(3)}`
    }, and the vote by ${Math.round(
      (PAGE8.headline.accuracy - PAGE8.majority.accuracy) * 100,
    )} points at p = ${PAGE8.caveat.p.toFixed(2)}, which is not a difference`,
  },
  {
    band: "sample",
    label: "sampled chains, filtered by step soundness",
    accuracy: required(PAGE9.selection, "page 9's selection arm").filtered,
    baseline: required(PAGE9.selection, "page 9's selection arm").majority,
    page: 9,
    note: `page 9's own pool: its vote sits at ${pct(
      PAGE9.selection!.majority,
    )} and grading every step moved ${PAGE9.selection!.nChanged} problem in ${ITEMS}`,
  },
  {
    band: "sample",
    label: `at least one of the ${VOTE_16.n} was right`,
    accuracy: COVERAGE,
    page: 7,
    note: "the ceiling a perfect selector would reach, and nothing did",
    ceiling: true,
  },
];

/**
 * The bigger model's own greedy row was cut from the ladder on 2026-08-10, and
 * the dashed crossing rule went with it: the rule marked exactly that row's
 * accuracy, so with the row gone it marked nothing a reader could name.
 *
 * One thing that removal bought, which is worth keeping true: every chain still
 * on this chart was written by the SAME model. The judges on page 8's rung score
 * chains, they do not write them, so `WRITER` describes the whole chart and the
 * page says so under it.
 */
export const WRITER = GREEDY_3B.label;

/**
 * The notebooks behind the rungs, derived from the ladder rather than listed by
 * hand, so a rung that is added or cut cannot leave the download list lying.
 */
export const NOTEBOOKS: ({ page: number } & NotebookLink)[] = [
  ...new Set(LADDER.map((r) => r.page)),
]
  .sort((a, b) => a - b)
  .flatMap((page) => {
    const meta = NOTEBOOK_BY_PAGE[page];
    if (!meta) {
      throw new Page16DataError(
        `page 16 draws a rung from page ${page} and has no notebook to show for it`,
      );
    }
    return [meta].flat().map((link) => ({ page, ...link }));
  });

/** How much of a real chain a step checker can actually adjudicate. Page 9's. */
export const CHECKABLE_SHARE = 1 - PAGE9.graders.shareUnjudged;

/** Page 6's wait arm, for the takeaway that forcing more thinking is a null. */
export const FORCED = {
  before: WAIT.before / WAIT.table.n,
  after: WAIT.after / WAIT.table.n,
  tokenMultiple: WAIT.tokenMultiple,
  turnedRight: WAIT.table.afterOnly,
  turnedWrong: WAIT.table.beforeOnly,
  churn: WAIT.churn,
  p: WAIT.p,
} as const;

/**
 * What the deck actually measured about judges, for the takeaway that the judge
 * is the bottleneck. Every model asked to judge decays as the pool it is judging
 * gets more diverse; the one trained to score does not. That is the argument for
 * a trained judge, and best-of-N is the expensive way you have to use one.
 */
export const JUDGES = {
  worstFallPts: PAGE17.reliability.steepest.fallPts,
  trainedFallPts:
    (PAGE17.reliability.trained.points[0].reliability -
      PAGE17.reliability.trained.points[PAGE17.reliability.trained.points.length - 1].reliability) *
    100,
  depth: PAGE17.reliability.depth,
} as const;

/**
 * The measured counterweight to "adaptive compute fixes this". Page 15 gave one
 * form of it an oracle: the best cut point per problem, chosen with hindsight.
 * It reached `oracle` for about `oracleTokens` tokens, and plain resampling
 * reached `sampling` at the same cost. So the direction is right and this deck
 * has no rule that beats sampling per token, and the copy has to say both.
 */
export const ADAPTIVE_NULL = {
  oracle: PAGE17.controls.isItARule.oracle,
  oracleTokens: Math.round(PAGE17.controls.isItARule.oracleTokenCost),
  sampling: PAGE17.controls.isItARule.samplingCoverage,
  natural: PAGE17.controls.isItARule.natural,
  beatsResampling: PAGE17.controls.isItARule.cutPointsBeatResampling,
} as const;

/* ------------------------------------------------- the other axis, off-chart */

const DISTILL = curves.deepseekDistill.fit!.params;
const OUR_1P5B_HARD = greedyOf(HARD, "1.5B");
const OUR_1P5B_EASY = greedyOf(EASY, "1.5B");

/**
 * R1-Distill-Qwen-1.5B on MATH-500, and why it is NOT a bar on the chart above.
 *
 * It is the most vivid number available to this page: the same 1.5B base our
 * own runs measure, fine-tuned on R1's reasoning traces, scoring 83.9 where our
 * copy of it scores 22. That is the train-time axis beating every answer-time
 * lever on the chart, and the page should say so.
 *
 * It is also measured somewhere else. The published figure is the whole of
 * MATH-500, all five difficulty levels; this deck's hundred items are levels 4
 * and 5 only, the hard end. Different harness, different decoding, published
 * rather than run here. Putting it on the same axis would be the deck dropping
 * the coordinates off a score on its own last page.
 *
 * So the size of the coordinate change is quoted from the deck's own instrument
 * rather than waved at: page 11 ran this family over both bands, and the easier
 * mix alone is worth `bandGapPts` for the same weights on the same harness.
 * That is not a correction to subtract, it is the reason the two numbers cannot
 * be subtracted, and the copy has to say it that way.
 */
export const OTHER_AXIS = {
  label: "R1-Distill-Qwen-1.5B",
  /** Published, full MATH-500, all five levels. */
  math500: DISTILL.math1p5 / 100,
  teacher: { label: "DeepSeek-R1", math500: DISTILL.r1Math / 100, samplesK: DISTILL.samplesK },
  ours: {
    label: OUR_1P5B_HARD.label,
    hard: OUR_1P5B_HARD.accuracy,
    hardLevels: HARD.levels,
    easy: OUR_1P5B_EASY.accuracy,
    easyLevels: EASY.levels,
  },
  /**
   * What moving from this deck's hard band to an easier mix is worth on its own,
   * measured across the three checkpoints page 11 ran over both bands. Quoted as
   * a range because it is a range: it shrinks as the model gets better.
   */
  bandGapPts: (() => {
    const gaps = HARD.greedy.map((h) => {
      const size = h.label.replace("Qwen2.5-", "");
      return Math.round((greedyOf(EASY, size).accuracy - h.accuracy) * 100);
    });
    return { min: Math.min(...gaps), max: Math.max(...gaps) };
  })(),
} as const;

/* -------------------------------------------------------- the concept check */

export interface Option {
  text: string;
  correct?: true;
}

export interface Question {
  /** Stable id, so a reader's answers survive a re-order during authoring. */
  id: string;
  /** The page whose idea is being checked. */
  page: number;
  /** The idea, in three or four words, shown as the question's chip. */
  concept: string;
  stem: string;
  options: Option[];
  /** Shown after answering, whichever option was picked. */
  why: string;
}

const SC = curves.selfCorrection.fit!.params;

/** Question 5's pair, through the same by-budget lookup the ladder uses. */
const TOP = FINISHED;
const KNEE = budgetRung(PAGE6.budgets[PAGE6.budgets.length - 2]);

/**
 * The bank was rewritten on 2026-08-10 against two rules the first draft broke.
 *
 * SAY IT THE WAY A PERSON WOULD. Several stems were a run report with a question
 * mark on the end ("What is the page entitled to say?", "What follows?"), and
 * carried every number the page had rather than the two the question turns on.
 * A stem now sets a scene in short sentences and asks the thing plainly.
 *
 * THE ANSWER SHOULD BE STRAIGHTFORWARD. A reader who knows the idea should be
 * able to pick it without parsing a compound clause, and a reader who does not
 * should get no help from the shape of the options. That means the key is stated
 * flat, and it is not visibly the longest thing on offer: the old q11 key ran to
 * 25 words against distractors of 8, which is answerable without reading the
 * stem. page16.test.ts pins the ratio so the tell cannot creep back.
 */
export const QUESTIONS: Question[] = [
  {
    id: "q1-two-failures",
    page: 2,
    concept: "what thinking longer can reach",
    stem:
      "A model gets one question wrong in two separate ways. It quotes a record that changed after its training data was collected, and it assumes the question is about the men's tournament when the question never said so. You hand it back and let it think the question over again, with nothing new to go on. Which mistake can it fix?",
    options: [
      { text: "The assumption, but not the stale record", correct: true },
      { text: "The stale record, but not the assumption" },
      { text: "Both of them" },
      { text: "Neither of them" },
    ],
    why:
      "The assumption is a misreading of a question the model can read again, so a slower pass can catch it. The record is a fact it never had, and no amount of thinking imports a fact. That split is why this deck has two halves.",
  },
  {
    id: "q2-retraining",
    page: 3,
    concept: "what retraining cannot buy",
    stem:
      "Now imagine retraining were free. No compute bill, no shortage of fresh text, no waiting weeks for a run to finish. You rebuild the model from scratch every morning. Which of those two mistakes is still there tomorrow?",
    options: [
      { text: "The assumption, because it was never about what the model had read", correct: true },
      { text: "The stale record, because yesterday's text is always one day behind" },
      { text: "Both, because retraining does not change how a model behaves" },
      { text: "Neither, because a freshly trained model is a correct one" },
    ],
    why:
      "Retraining aims at the corpus. The assumption is a habit in how the question gets handled, so it survives every retrain, and that is exactly the gap answer-time compute was invented to fill.",
  },
  {
    id: "q3-what-a-chain-is",
    page: 5,
    concept: "what a chain of thought is",
    stem:
      "A model writes out its working, then gives an answer. To the model, what is that written working?",
    options: [
      { text: "The thinking itself: the answer gets computed as the text is written", correct: true },
      { text: "A readable summary of the thinking it had already finished before writing" },
      { text: "A justification written up after the answer was picked" },
      { text: "A passage recalled from training data that fit the question" },
    ],
    why:
      "When a person talks through their reasoning, they are reporting thinking that already happened. For a model the text IS the thinking: every token is computed with all the earlier ones in view. Take the working away and you have not hidden the reasoning, you have removed it.",
  },
  {
    id: "q5-axis-bound",
    page: 6,
    concept: "reading a flat curve",
    stem: `You raise the token budget and accuracy climbs, ${pct(KNEE.accuracy)} at ${
      KNEE.budget
    } tokens, then it goes flat: ${pct(TOP.accuracy)} at ${TOP.budget}. One more thing to know. ${pct(
      PAGE17.axisBound.shareSelfTerminated,
    )} of these chains stop themselves before the biggest budget. What is the flat part telling you?`,
    options: [
      { text: "The axis ran out: a bigger cap replays a chain that already stopped", correct: true },
      { text: "The model starts overthinking once its chains get long enough" },
      { text: "The problems still unsolved are simply too hard for this model" },
      { text: "The grader stops being able to read the chains once they get this long" },
    ],
    why:
      "Under greedy decoding a chain that has already ended is not rerun at a bigger cap, it is the identical generation. So the flat top is a fact about the measuring stick, not about the model, and any claim that accuracy falls past a peak needs a different axis to stand on.",
  },
  {
    id: "q6-diversity",
    page: 7,
    concept: "what voting needs",
    stem: `Sixteen chains sampled at temperature zero scored ${pct(
      PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    )}. One chain on its own scored exactly the same. Why did the other fifteen buy nothing?`,
    options: [
      { text: "All sixteen are the same chain, so the vote has one opinion", correct: true },
      { text: "Sixteen chains is too few for a majority to form" },
      { text: "The ties all got resolved in favour of a wrong answer" },
      { text: "The chains were cut off before they could disagree" },
    ],
    why:
      "Voting turns disagreement into a signal. With nothing to disagree about there is nothing to turn, so what self-consistency really buys is diversity, and temperature is the knob you pay for it with.",
  },
  {
    id: "q7-coverage",
    page: 7,
    concept: "coverage against accuracy",
    stem: `Sample ${PAGE7.handoff.n_chains} chains hot. The majority vote gets ${pct(
      PAGE7.handoff.plurality_accuracy,
    )} of the problems right. But on ${pct(
      PAGE7.handoff.coverage,
    )} of them, at least one of those chains had the right answer. What is that gap made of?`,
    options: [
      { text: "Problems where a right answer was generated and the vote binned it", correct: true },
      { text: "Problems that no chain solved, which more sampling would eventually reach" },
      { text: "Problems where the vote tied and had to guess" },
      { text: "Noise between two ways of counting the same thing" },
    ],
    why:
      "Coverage is what the generator found. Accuracy is what the selection rule kept. The gap between them is not a generation problem at all, which is why the next thing to fix is the selector rather than the number of chains.",
  },
  {
    id: "q9-right-answer-wrong-working",
    page: 9,
    concept: "why the answer is not enough",
    stem:
      "A model works through a problem, slips on one division halfway down, and still lands on the right final answer. Two graders look at it. One compares only the final answer to the known one. The other reads every line. What does the first grader say?",
    options: [
      { text: "It passes the chain, because the answer is right", correct: true },
      { text: "It fails the chain, because the working is broken" },
      { text: "It passes the chain, but flags it as low confidence" },
      { text: "It cannot grade a chain that contains a slip" },
    ],
    why:
      "An outcome grader never opens the working, so a right answer reached by broken reasoning goes straight through. That is the whole case for grading steps: the failure it catches is invisible from the answer alone, and it is the failure you would least like to trust.",
  },
  {
    id: "q10-search-bill",
    page: 10,
    concept: "what search costs",
    stem:
      "Tree search branches into several partial lines of reasoning, scores them, drops the weak ones and backs up to try somewhere else. What does the compute bill scale with?",
    options: [
      { text: "Every node it evaluated, including the ones it threw away", correct: true },
      { text: "The single path that survives all the way to the end" },
      { text: "The depth of the tree, since width is explored for free" },
      { text: "The number of different final answers it produced" },
    ],
    why:
      "Pruning is what search does with a node after paying for it, not instead of paying for it. That is why a deeper search can be worse value than plain sampling even though it explores more.",
  },
  {
    id: "q12-external-check",
    page: 12,
    concept: "what self-improvement rests on",
    stem:
      "STaR trains a model on reasoning it wrote itself. R1 was taught to reason by rewarding it for getting answers right. Strip both loops back to the one thing neither works without. What is it?",
    options: [
      { text: "Something outside the model deciding which attempts were right", correct: true },
      { text: "A bigger teacher model for it to imitate" },
      { text: "Human-written worked solutions for every problem in the training set" },
      { text: "A temperature high enough to stumble on rare solutions" },
    ],
    why:
      "Neither loop needs a person to write the reasoning, which is what lets them scale. Both need something outside the model to say which attempts were right. Take that filter away and the model trains on its own mistakes.",
  },
  {
    id: "q13-self-correction",
    page: 14,
    concept: "why unaided revision fails",
    stem: `Ask a model to look over its own answer and fix any mistakes. No hints, no tools, nothing it did not already have. On CommonSenseQA that took GPT-3.5 from ${SC.gpt35Csqa0}% down to ${SC.gpt35Csqa1}%. Why does asking make it worse?`,
    options: [
      { text: "The weights that produced the error are the ones asked to find it", correct: true },
      { text: "The model forgets its first answer and has to start over" },
      { text: "The extra prompt pushes the question out of the context window" },
      { text: "It only happens on multiple choice, where wrong options tempt it" },
    ],
    why:
      "A review needs information the reviewer did not already have. A failing test, a calculator, a proof checker: give revision something to push against and it works. 'Are you sure?' is not information.",
  },
];

/**
 * Ten, over pages 2, 3, 5, 6, 7, 7, 9, 10, 12 and 15.
 *
 * It was twelve, spread one per page, until 2026-08-10, when the questions for
 * pages 8 and 11 were cut by request. So the one-per-page property is gone and
 * the copy no longer claims it. Page 7 still gets two, because it teaches two
 * separable things (why voting needs disagreement, and why coverage is not
 * accuracy) and the second is the one the rest of Act 2 is built on.
 *
 * The order is the deck's order, so anything added back belongs at its page's
 * position rather than on the end.
 */
export const QUIZ: Question[] = QUESTIONS;

/**
 * A question that cites a page the deck does not have sends the reader nowhere.
 * Cheap to check, and it was not hypothetical: four pages came out of this deck
 * the same day this file was written.
 */
for (const q of QUIZ) {
  if (!PAGES.some((p) => p.n === q.page)) {
    throw new Page16DataError(
      `page 16's question "${q.id}" cites page ${q.page}, which is not in the deck`,
    );
  }
}

export const ITEM_COUNT = ITEMS;
