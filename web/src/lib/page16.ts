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
 * THE BILL COLUMN IS DELIBERATELY SPARSE. Four rungs carry a FLOPs multiple and
 * six do not. Page 11 computed inference FLOPs properly; nothing else in the
 * deck did, and mean tokens are not FLOPs. An empty cell says "this run did not
 * price itself", which is true. Filling it by scaling token counts would put an
 * estimate in the same column as a measurement, in the same units, with no way
 * for a reader to tell them apart. That is the one thing this page must not do.
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
 * THE CONCEPT CHECK (section 2) is twelve questions, and every one of them is
 * about a MECHANISM rather than a magnitude. A reader who has understood the
 * deck can answer all twelve without remembering a single number; the numbers
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
import { PAGE5 } from "./page05";
import { PAGE6 } from "./page06";
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

export type BandKey = "chain" | "sample" | "elsewhere";

export interface Band {
  key: BandKey;
  /** The question this group of rungs answers. */
  title: string;
}

export const BANDS: Band[] = [
  { key: "chain", title: "what writing the reasoning is worth" },
  { key: "sample", title: "what sampling and selecting add to it" },
  { key: "elsewhere", title: "what the same money buys elsewhere" },
];

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
   * Present ONLY on the four rungs page 11 priced: it computed these properly
   * and the rest of the deck did not, and a token count is not a FLOP count.
   * A blank cell is honest; an estimated one would not be.
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
    ["page 15's re-read", PAGE17.run.items],
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

const TOP_BUDGET = PAGE6.budgets[PAGE6.budgets.length - 1];
const CUT_SHORT = budgetRung(PAGE6.budgets[0]);
const CUT_MID = budgetRung(PAGE6.budgets[2]);
const FINISHED = budgetRung(TOP_BUDGET);

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
    label: `one chain, cut off at ${CUT_SHORT.budget} tokens`,
    accuracy: CUT_SHORT.accuracy,
    page: 6,
    note: "the same score as no chain at all: too short to be a computation",
  },
  {
    band: "chain",
    label: `one chain, cut off at ${CUT_MID.budget} tokens`,
    accuracy: CUT_MID.accuracy,
    page: 6,
    note: "most of the climb happens in here",
  },
  {
    band: "chain",
    label: "one chain, allowed to finish",
    accuracy: FINISHED.accuracy,
    page: 6,
    bill: bill(GREEDY_3B.flops),
    note: `${Math.round(FINISHED.mean_tokens)} tokens, mean; the baseline every later rung is paired against`,
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
  {
    band: "elsewhere",
    label: `${HARD.target.label}, one greedy chain`,
    accuracy: HARD.target.accuracy,
    page: 11,
    bill: bill(HARD.target.flops),
    note: "the same score as the best selector, for a seventh of its bill",
  },
];

/** The accuracy two rungs tie at, which is the whole reason the bill column exists. */
export const CROSSING = HARD.target.accuracy;

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

export const QUESTIONS: Question[] = [
  {
    id: "q1-two-failures",
    page: 2,
    concept: "what thinking longer can reach",
    stem:
      "One question was answered wrong twice over: the record it asked about had moved after the model finished training, and the question was read as being about the men's tournament when it never said so. A second, slower pass over the same question, with no new information, fixes which of those?",
    options: [
      { text: "The misreading, and only the misreading", correct: true },
      { text: "The stale record, and only the stale record" },
      { text: "Both of them" },
      { text: "Neither of them" },
    ],
    why:
      "Re-reading is free and the misreading is in the question, so a slower pass can catch it. The record is a fact the model never held; no amount of thinking imports it. That split is the whole reason the deck has two halves.",
  },
  {
    id: "q2-retraining",
    page: 3,
    concept: "what retraining cannot buy",
    stem:
      "Suppose the compounding bill, the finite stock of human text and the weeks of lag were all solved, and you could retrain the model from scratch every morning for free. Which of the two failures above would still be there tomorrow?",
    options: [
      { text: "The misreading, because it was never about what the model had read", correct: true },
      { text: "The stale record, because yesterday's text is always a day behind" },
      { text: "Both, because retraining changes nothing about behaviour" },
      { text: "Neither, because a fresh model is a correct model" },
    ],
    why:
      "Retraining is aimed at the corpus. The misreading is a habit of how the question gets processed, so it survives every retrain and is exactly what an answer-time pass is for.",
  },
  {
    id: "q3-what-a-chain-is",
    page: 5,
    concept: "what a chain of thought is",
    stem:
      "A model writes out its working and then gives an answer. For the model, what is that written working?",
    options: [
      {
        text: "The computation itself: the answer is produced by writing it, token by token",
        correct: true,
      },
      { text: "A readable summary of reasoning the model did internally before writing" },
      { text: "A justification composed after the answer was chosen" },
      { text: "A passage recalled from training data that matched the question" },
    ],
    why:
      "For a person, saying your reasoning out loud is a report of thinking that already happened. For a model the text IS the thinking: each token is computed with every earlier token in view, so taking the working away does not hide the reasoning, it removes it.",
  },
  {
    id: "q5-axis-bound",
    page: 6,
    concept: "reading a flat curve",
    stem: `Sweeping the token budget, accuracy climbed to ${pct(
      KNEE.accuracy,
    )} at ${KNEE.budget} tokens and sat at ${pct(TOP.accuracy)} at ${
      TOP.budget
    }. Given that ${pct(
      PAGE17.axisBound.shareSelfTerminated,
    )} of these chains stop themselves before the largest budget, what does the flat top show?`,
    options: [
      {
        text: "The end of the axis: above a chain's own stopping point, a bigger cap replays the same generation",
        correct: true,
      },
      { text: "That the model starts overthinking once it passes 1024 tokens" },
      { text: "That the remaining problems are simply beyond this model" },
      { text: "That the grader stops being able to read chains that long" },
    ],
    why:
      "Under greedy decoding a chain that has already ended is not rerun at a larger cap, it is the identical generation. So the flat top is a fact about the instrument, and any claim about accuracy falling past a peak needs a different axis to stand on.",
  },
  {
    id: "q6-diversity",
    page: 7,
    concept: "what voting needs",
    stem: `Sixteen chains sampled at temperature zero scored ${pct(
      PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    )}, which is exactly what one chain scored. Why did sixteen buy nothing?`,
    options: [
      {
        text: "At temperature zero the sixteen chains are identical, and a vote among copies has one opinion",
        correct: true,
      },
      { text: "Sixteen is too few for a majority to form" },
      { text: "The ties were resolved in favour of the wrong answer" },
      { text: "The chains were truncated before they could disagree" },
    ],
    why:
      "Voting converts disagreement into a signal. With no disagreement there is nothing to convert, so the thing self-consistency actually buys is diversity, and the temperature knob is what pays for it.",
  },
  {
    id: "q7-coverage",
    page: 7,
    concept: "coverage against accuracy",
    stem: `With ${PAGE7.handoff.n_chains} chains sampled hot, the majority vote landed on ${pct(
      PAGE7.handoff.plurality_accuracy,
    )} of problems, while at least one of those chains was right on ${pct(
      PAGE7.handoff.coverage,
    )}. What is that gap?`,
    options: [
      {
        text: "Problems where the right answer was generated and the vote threw it away",
        correct: true,
      },
      { text: "Problems no chain solved, which more sampling would eventually reach" },
      { text: "Problems where the vote tied and had to guess" },
      { text: "Measurement noise between two ways of counting the same thing" },
    ],
    why:
      "Coverage is what the generator found; accuracy is what the selection rule kept. The gap is not a generation problem at all, which is why the next lever is a better selector rather than more chains.",
  },
  {
    id: "q8-selection-verdict",
    page: 8,
    concept: "what a run may claim",
    stem: `Best-of-sixteen with a trained verifier scored ${pct(
      PAGE8.headline.accuracy,
    )} against one chain's ${pct(PAGE8.oneChain)}, at ${
      PAGE8.headline.p < 0.001 ? "p < 0.001" : `p = ${PAGE8.headline.p.toFixed(3)}`
    }. Against the majority vote on the same candidates it was ahead by ${
      Math.round((PAGE8.headline.accuracy - PAGE8.majority.accuracy) * 100)
    } points at p = ${PAGE8.caveat.p.toFixed(2)}. What is the page entitled to say?`,
    options: [
      {
        text: "That selecting beats one chain, and that this run cannot tell the verifier and the vote apart",
        correct: true,
      },
      { text: "That the trained verifier beats the vote, since it scored higher" },
      { text: "That the vote beats the trained verifier, since it is cheaper" },
      { text: "That neither is worth running, since one is not clearly ahead" },
    ],
    why:
      "A difference you cannot distinguish from noise is not a result. Reporting the four points without the p-value would turn an unresolved comparison into a recommendation, which is the failure the deck is most careful about.",
  },
  {
    id: "q9-process-sliver",
    page: 9,
    concept: "where a grader can see",
    stem: `Of ${PAGE9.graders.stepsTotal.toLocaleString()} steps across real chains, an arithmetic checker could adjudicate ${PAGE9.graders.stepsJudged.toLocaleString()}, or ${pct(
      1 - PAGE9.graders.shareUnjudged,
      1,
    )}. The process reward model scores every step and is silent on none. What follows?`,
    options: [
      {
        text: "Its reliability was measured inside that sliver, so its numbers are an optimistic estimate of how it does on the rest",
        correct: true,
      },
      { text: "Nothing, because it scores every step and therefore reads every step" },
      { text: "Its reliability is understated, since the checkable steps are the hard ones" },
      { text: "The problem only affects chains that reach a wrong answer" },
    ],
    why:
      "Most of a chain is prose: 'by symmetry', 'consider the cases'. Where the checker is silent there was nothing to score the grader against, so the grader's quality figures come from the small part of the chain a machine could adjudicate.",
  },
  {
    id: "q10-search-bill",
    page: 10,
    concept: "what search costs",
    stem:
      "Search over thoughts branches, scores partial lines, prunes the poor ones and backtracks. What does the compute bill scale with?",
    options: [
      { text: "Every node that gets evaluated, including the ones thrown away", correct: true },
      { text: "The length of the single path that survives to the end" },
      { text: "The depth of the tree, since width is explored in parallel for free" },
      { text: "The number of distinct final answers the search produces" },
    ],
    why:
      "Pruning is what search does with a node after paying for it, not instead of paying for it. This is why a deeper search can be worse value than plain sampling even when it explores more.",
  },
  {
    id: "q11-keystone",
    page: 11,
    concept: "answer-time against parameters",
    stem: `Priced in measured FLOPs, in units of one greedy chain from the ${
      GREEDY_3B.label
    }: its sixteen-way vote reached ${pct(VOTE_16.accuracy)} for about ${Math.round(
      bill(VOTE_16.flops),
    )} chains, and a trained verifier picking among those chains reached ${pct(
      BEST_OF.accuracy,
    )} for about ${Math.round(bill(BEST_OF.flops))}. One greedy chain from the ${
      HARD.target.label
    } reached that same ${pct(HARD.target.accuracy)} for about ${bill(HARD.target.flops).toFixed(
      1,
    )}. What is the finding?`,
    options: [
      {
        text: "On these problems no answer-time rule we tested out-bought the larger model at a matched bill, even though a right answer was often in the pile",
        correct: true,
      },
      { text: "Sampling and voting always beat buying a larger model" },
      { text: "Parameters always beat answer-time compute, at any budget" },
      { text: "The two are equivalent, so it does not matter which you buy" },
    ],
    why:
      "Both knobs spend the same FLOPs, so they can be charged against each other. Here the bigger model won at a matched bill, and the reason is not generation: coverage was high and no rule reliably picked the right chain out.",
  },
  {
    id: "q12-external-check",
    page: 12,
    concept: "what self-improvement rests on",
    stem:
      "STaR trains a model on rationales it wrote itself, and R1 was taught to reason by rewarding it for reaching right answers. Strip both down: what is the one ingredient neither loop works without?",
    options: [
      {
        text: "An external check on the answer, deciding which of the model's own output it is allowed to learn from",
        correct: true,
      },
      { text: "A larger teacher model to imitate" },
      { text: "Human-written worked solutions for every problem" },
      { text: "Sampling at a high enough temperature to find rare solutions" },
    ],
    why:
      "Neither loop needs anyone to write the reasoning, which is what makes them scale. Both need something outside the model to say which attempts were right, and remove that filter and the model trains on its own errors.",
  },
  {
    id: "q13-self-correction",
    page: 15,
    concept: "why unaided revision fails",
    stem: `Asked to look its answer over and correct any mistakes, with no new information and no tools, GPT-3.5 on CommonSenseQA went from ${SC.gpt35Csqa0}% to ${SC.gpt35Csqa1}% after one round. Why does asking again make things worse?`,
    options: [
      {
        text: "The same weights that produced the error are asked to find it, so nothing new enters and the revision mostly adds noise",
        correct: true,
      },
      { text: "The model forgets its first answer and has to start over" },
      { text: "The extra prompt pushes the question out of the context window" },
      { text: "It is specific to multiple choice, where there are wrong options to be talked into" },
    ],
    why:
      "Review needs information the reviewer did not already have. A failing test, a calculator, a proof checker: give revision something to push against and it works. 'Are you sure?' is not information.",
  },
];

/**
 * Twelve, deliberately, and spread one per page rather than weighted to the
 * pages with the best numbers on them: 2, 3, 5, 6, 7, 7, 8, 9, 10, 11, 12, 15.
 * Page 7 gets two because it teaches two separable things (why voting needs
 * disagreement, and why coverage is not accuracy) and the second is the one the
 * rest of Act 2 is built on.
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
