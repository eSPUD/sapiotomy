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
 * allowed to exist because the rungs are comparable. They are drawn from ONE
 * pool wherever a comparison is being made: page 8's paired run supplies the
 * one-chain baseline, the vote, the selected best-of-N and the coverage
 * ceiling, all over its own 12,800 chains on the same hundred MATH-500 level 4
 * and 5 items. Two rungs come from elsewhere and are labelled as such rather
 * than blended in: the floor is page 5's forced-blurt arm (same items, same
 * family, a different run), and the 7B's greedy line is page 11's (same items,
 * a bigger model). `assertSameItems` below refuses to build the ladder if those
 * runs stop agreeing about how many problems they measured, because the chart's
 * entire claim is that these bars can be read against each other.
 *
 * Page 7's vote lands at 55% and page 8's at 56% on its own candidates. Both
 * are true and the deck says so on page 8; the ladder quotes page 8's, because
 * mixing two runs inside one comparison is exactly the error the ladder exists
 * to avoid. Do not "fix" the discrepancy by averaging them.
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

export interface Rung {
  /** What was done to get this score. */
  label: string;
  /** The measured accuracy on 100 MATH-500 level 4 and 5 problems. */
  accuracy: number;
  /** Which page measured it, for the provenance column. */
  page: number;
  /** Roughly what it cost, in chains generated per problem. */
  chains: number;
  /** One clause on what the rung is, not what it scored. */
  note: string;
  /** A ceiling nothing on the page reached, drawn as a rule rather than a bar. */
  ceiling?: boolean;
}

/**
 * The rungs must be talking about the same problem set or the chart is a lie
 * told in a legible font. Page 8's paired comparison, page 5's suppression arm
 * and page 11's hard band are three separate runs over one item set, so the
 * item counts are the thing to check: if a re-run changes one of them, these
 * bars stop being comparable and the page must not draw them.
 */
function assertSameItems(): number {
  const counts: [string, number][] = [
    ["page 5's suppression arm", PAGE5.figure2.bare.n],
    ["page 8's paired comparison", PAGE8.paired.items],
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

const COVERAGE = required(PAGE8.coverage, "page 8's coverage, which is the ladder's ceiling");
const BEST_OF = required(
  PAGE11.bands.hard.bestOf,
  "page 11's best-of-N point on the hard band, which prices the selector against a bigger model",
);

/**
 * The whole toolbox as one column of bars, floor to ceiling.
 *
 * The order is the deck's order, and the shape it makes is the deck's argument:
 * a large step for writing the reasoning at all, a step for sampling and
 * voting, a smaller step for selecting with a trained judge, and then a gap to
 * the coverage line that no selector we tested closed. The 7B's greedy chain
 * sits at the same height as the best selector for a fraction of the bill,
 * which is page 11's crossing restated as one row.
 */
export const LADDER: Rung[] = [
  {
    label: "no chain at all, forced to answer immediately",
    accuracy: PAGE5.figure2.blurt.accuracy,
    page: 5,
    chains: 1,
    note: `${PAGE5.figure2.blurt.medianTokens} tokens, median`,
  },
  {
    label: "one chain of thought, greedy",
    accuracy: PAGE8.oneChain,
    page: 8,
    chains: 1,
    note: "the baseline every later rung is paired against",
  },
  {
    label: `${PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].n} chains at temperature zero, majority vote`,
    accuracy: PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].accuracy,
    page: 7,
    chains: PAGE7.figure2.cold.points[PAGE7.figure2.cold.points.length - 1].n,
    note: "identical copies, so the vote sees one opinion",
  },
  {
    label: `${PAGE7.handoff.n_chains} sampled chains, majority vote`,
    accuracy: PAGE8.majority.accuracy,
    page: 8,
    chains: PAGE7.handoff.n_chains,
    note: "diversity is what the vote actually buys",
  },
  {
    label: `${PAGE7.handoff.n_chains} sampled chains, trained verifier picks one`,
    accuracy: PAGE8.headline.accuracy,
    page: 8,
    chains: PAGE7.handoff.n_chains,
    note: `${PAGE8.headline.fixed} fixed against ${PAGE8.headline.broke} broken, ${
      PAGE8.headline.p < 0.001 ? "p < 0.001" : `p = ${PAGE8.headline.p.toFixed(3)}`
    }`,
  },
  {
    label: `at least one of the ${PAGE7.handoff.n_chains} was right`,
    accuracy: COVERAGE,
    page: 7,
    chains: PAGE7.handoff.n_chains,
    note: "the ceiling a perfect selector would reach, and nothing did",
    ceiling: true,
  },
];

/** Page 11's crossing, drawn as a rule across the ladder rather than as a bar. */
export const BIGGER_MODEL = {
  label: PAGE11.bands.hard.target.label,
  accuracy: PAGE11.bands.hard.target.accuracy,
  /** What the small model's 16-way vote cost, as a multiple of this one chain. */
  voteCostMultiple:
    PAGE11.bands.hard.voteCurve[PAGE11.bands.hard.voteCurve.length - 1].xTarget,
  selectCostMultiple: BEST_OF.xTarget,
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

/**
 * The two budget rungs question 5 is about, looked up by budget rather than by
 * position in the sweep. The sweep's length is a property of the run, and a
 * re-run that adds a rung would silently re-point a positional index at a
 * different pair of numbers while the question stem went on reading fine.
 */
const budgetRung = (budget: number) => {
  const p = PAGE6.figure2.primary.points.find((r) => r.budget === budget);
  if (!p) {
    throw new Page16DataError(
      `page 16's question 5 is written about the ${budget}-token rung, which page 6's sweep no longer has`,
    );
  }
  return p;
};
const TOP = budgetRung(PAGE6.budgets[PAGE6.budgets.length - 1]);
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
    stem: `With sixteen chains sampled hot, the majority vote landed on ${pct(
      PAGE8.majority.accuracy,
    )} of problems, while at least one of the sixteen chains was right on ${pct(
      COVERAGE,
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
    stem: `Put on one axis of measured compute: a ${
      PAGE11.bands.hard.greedy[1].label
    }'s sixteen-way vote reached ${pct(
      PAGE11.bands.hard.voteCurve[PAGE11.bands.hard.voteCurve.length - 1].accuracy,
    )} for about ${BIGGER_MODEL.voteCostMultiple.toFixed(
      1,
    )} times the bill of one greedy chain from the ${BIGGER_MODEL.label}, which reached ${pct(
      BIGGER_MODEL.accuracy,
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
