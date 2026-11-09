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
 * THE CHARTS (section 1) are three: the 3B base (`BASE_CHART`), the 3B-Instruct
 * (`INSTRUCT_CHART`) and GRPO (`GRPO_CHART`), which so far exists only for the
 * 1.5B-Instruct on GSM8K, and the page says so inside its figure. A bar's colour
 * is its category. One number is read from `data/page-15-3b-runs.json` rather
 * than a page's module: thinking longer, from the all-levels run page 6 has not
 * moved to yet.
 *
 * THE SECOND CHART'S SPINE IS THE TEMPERATURE SWEEP. The vote and both selectors
 * are compared with each other, so they come from one run: 16 chains on each of
 * the sweep's 100 problems, every chain scored by both reward models.
 * `assertSweepAgrees` refuses to build the charts if pages 7, 8 and 9 stop
 * agreeing about that run.
 *
 * SEARCH IS NOT A BAR. Page 10 taught it and never ran it: its tree is
 * hand-authored, its bars are Yao et al.'s on Game of 24 and crosswords, and
 * the arm that would measure it ships unrun. It is not drawn, and it is not
 * silently dropped either: the takeaways below carry what the deck does know
 * about it. Do not give it a bar without a run behind it, and do not borrow
 * Yao et al.'s number, which is another task on another axis.
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
import rawRuns3B from "@data/page-15-3b-runs.json";
import { PAGE5, SHOTS } from "./page05";
import { PAGE6, WAIT_TABLE } from "./page06";
import { PAGE7 } from "./page07";
import { PILE8 } from "./page08Pile";
import { BEST_OF_N, PAGE9 } from "./page09";
import { PAGE11 } from "./page11";
import { FINAL as GRPO_FINAL, RUN as GRPO_RUN } from "./page13";
import { PAGE17 } from "./page17";
import { curves } from "./curves";
import { PAGES } from "./pages";

export class Page16DataError extends Error {}

/** Percentages, formatted the way every other page in the deck formats them. */
export const pct = (v: number, digits = 0): string => `${(v * 100).toFixed(digits)}%`;

/* --------------------------------------------------------------- the charts */

/** What was done to the model to get a bar. Each category has one colour. */
export type Category = "base" | "fineTuned" | "inference" | "inferenceTraining";

/** In legend order. */
export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "base", label: "base model" },
  { key: "fineTuned", label: "fine-tuning" },
  { key: "inference", label: "inference-time scaling" },
  { key: "inferenceTraining", label: "inference + training-time scaling" },
];

export interface Bar {
  category: Category;
  label: string;
  /** Share of problems solved. */
  accuracy: number;
  /** The page whose download carries the run. */
  run: number;
  /** The run's conditions, for the hover text and the spoken description. */
  detail: string;
}

/**
 * The vote, the selectors and the ceiling are compared with each other, so pages
 * 7, 8 and 9 have to be reading one run. If a re-run moves one and not the others,
 * the steps between those bars stop being measurements.
 */
const COLD = PAGE7.figure2.cold.points;
const HOT = PAGE7.figure2.hot.points;
const VOTE_POINT = HOT[HOT.length - 1];

function assertSweepAgrees(): void {
  const checks: [string, number, number | null, number | null][] = [
    ["problems", PAGE7.handoff.n_items, PILE8.rows.length, BEST_OF_N.nProblems],
    ["chains per problem", VOTE_POINT.n, PILE8.nChains, BEST_OF_N.nChains],
    // Page 8's loader does not export its temperature, so its slot repeats page 7's.
    ["the temperature", PAGE7.figure2.hot.temperature, PAGE7.figure2.hot.temperature, BEST_OF_N.temperature],
    ["the greedy chain", COLD[0].accuracy, PILE8.bars.one_chain, BEST_OF_N.bars.one_chain],
    ["the vote", VOTE_POINT.accuracy, PILE8.bars.vote, BEST_OF_N.bars.vote],
    ["the outcome reward model", PILE8.bars.best_of_n, PILE8.bars.best_of_n, BEST_OF_N.bars.orm],
    ["the ceiling", PAGE7.handoff.coverage, PILE8.bars.ceiling, PILE8.bars.ceiling],
  ];
  for (const [what, p7, p8, p9] of checks) {
    if (p7 !== p8 || p8 !== p9) {
      throw new Page16DataError(
        `page 16 compares the vote, the selectors and the ceiling as one run, but for ${what} ` +
          `page 7 has ${p7}, page 8 has ${p8} and page 9 has ${p9}.`,
      );
    }
  }
}
assertSweepAgrees();

/**
 * A number this page is built on that is optional upstream is a load error when
 * it is missing, rather than a bar that quietly does not draw.
 */
function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Page16DataError(
      `page 16 needs ${what}, and the run it comes from does not carry it. ` +
        `The wrap-up cannot be built without it.`,
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

/** The first chart's three bars, from the two runs page 5 draws them from. */
const INSTRUCT_3B = required(
  PAGE5.instruct.find((m) => m.size === "3B"),
  "page 5's 3B-Instruct row, which is the first chart's last bar",
);
const SHOTS_3B = required(
  SHOTS.rows.find((r) => r.label === "Qwen2.5-3B"),
  "page 5's 3B base row, which is the first chart's first two bars",
);

/** Page 6's sweep, looked up by budget: a positional index would silently re-point. */
const budgetRung = (budget: number) => {
  const r = PAGE6.figure2.primary.points.find((p) => p.budget === budget);
  if (!r) {
    throw new Page16DataError(
      `page 16's quiz is written about the ${budget}-token rung, which page 6's sweep no longer has`,
    );
  }
  return r;
};

const TOP_BUDGET = PAGE6.budgets[PAGE6.budgets.length - 1];
const FINISHED = budgetRung(TOP_BUDGET);

/**
 * Page 6's other arm: refuse to let the chain stop, append `Wait`, make it carry
 * on. It is the deck's one measurement of forcing MORE reasoning onto a model
 * that had finished, and it is a null, which the takeaways say.
 */
const WAIT = required(
  WAIT_TABLE,
  "page 6's wait-injection arm, the deck's only measurement of forcing more thinking",
);

/**
 * The shipped notebook for each page whose run these charts draw. Any page that
 * gains a bar must gain an entry here, and NOTEBOOKS throws rather than silently
 * omitting a source.
 */
/** A page's download: a zip bundle (notebook, harness, traces) unless `format` says a bare .ipynb. */
type NotebookLink = { title: string; href: string; size: string; format?: "zip" | "ipynb" };
const NOTEBOOK_BY_PAGE: Record<number, NotebookLink | NotebookLink[]> = {
  // One notebook for each of the first chart's two runs, the same two page 5 links.
  5: [
    { title: "Zero-shot vs few-shot", href: "/notebooks/5_CoT_ZeroShot-vs-FewShot.ipynb", size: "228 KB", format: "ipynb" },
    { title: "Base few-shot vs instruct", href: "/notebooks/5_CoT_BaseFewShot-vs-Instruct.ipynb", size: "908 KB", format: "ipynb" },
  ],
  6: { title: "Thinking longer", href: "/notebooks/6_ThinkingLonger_InstructModels.ipynb", size: "176 KB", format: "ipynb" },
  7: { title: "Sampling and voting", href: "/notebooks/7_FrequencyVoting_InstructModels.ipynb", size: "145 KB", format: "ipynb" },
  8: { title: "Best-of-N", href: "/notebooks/8_Best_of_N.ipynb", size: "30 KB", format: "ipynb" },
  9: { title: "Best-of-N with a process reward model", href: "/notebooks/9_Best_of_N_PRM_dev.ipynb", size: "28 KB", format: "ipynb" },
  10: { title: "The search arm", href: "/notebooks/page-10-search-arm.zip", size: "4.8 MB" },
  11: { title: "Training against scale", href: "/notebooks/page-11-training-vs-scale.zip", size: "2.7 MB" },
  13: { title: "GRPO", href: "/notebooks/page_13_two_axis_grpo.ipynb", size: "0.6 MB", format: "ipynb" },
};

/** The first chart: what the 3B base model does, and what its Instruct version does. */
export const BASE_CHART: Bar[] = [
  {
    category: "base",
    label: "zero-shot",
    accuracy: SHOTS_3B.solved.zero_shot / 100,
    run: 5,
    detail: "Qwen2.5-3B, no examples in the prompt",
  },
  {
    category: "inference",
    label: "few-shot CoT",
    accuracy: SHOTS_3B.solved["10_shot"] / 100,
    run: 5,
    detail: "Qwen2.5-3B, ten worked examples in the prompt",
  },
  {
    category: "fineTuned",
    label: "instruct model",
    accuracy: INSTRUCT_3B.cot.accuracy,
    run: 5,
    detail: `Qwen2.5-3B-Instruct, no examples, ${PAGE5.n} MATH-500 problems`,
  },
];

const SWEEP_NOTE = `${PILE8.nChains} chains on each of ${PILE8.rows.length} MATH-500 problems, temperature ${PAGE7.figure2.hot.temperature}`;
const LONGER = rawRuns3B.thinking_longer;

/** The second chart: everything done to the 3B-Instruct, in the deck's order. */
export const INSTRUCT_CHART: Bar[] = [
  {
    category: "fineTuned",
    label: "instruct model",
    accuracy: COLD[0].accuracy,
    run: 7,
    detail: `one greedy chain on the same ${PILE8.rows.length} MATH-500 problems`,
  },
  {
    category: "inference",
    label: "thinking longer, 2K tokens*",
    accuracy: LONGER.accuracy,
    run: 6,
    detail: `${LONGER.budget.toLocaleString("en-GB")}-token budget, on a different ${LONGER.n} MATH-500 problems`,
  },
  {
    category: "inference",
    label: `frequency voting, ${VOTE_POINT.n} chains`,
    accuracy: VOTE_POINT.accuracy,
    run: 7,
    detail: `majority vote, ${SWEEP_NOTE}`,
  },
  {
    category: "inference",
    label: "Best-of-N (outcome)",
    accuracy: PILE8.bars.best_of_n,
    run: 8,
    detail: `outcome reward model picks one, ${SWEEP_NOTE}`,
  },
  {
    category: "inference",
    label: "Best-of-N (process)",
    accuracy: BEST_OF_N.bars.prm,
    run: 9,
    detail: `process reward model picks one, ${SWEEP_NOTE}`,
  },
];

const GRPO_NOTE = `${GRPO_RUN.rl_steps} GRPO steps, ${GRPO_RUN.n_eval} ${GRPO_RUN.dataset} problems, temperature ${GRPO_RUN.temperature}`;

/**
 * The third chart: GRPO, trained then sampled. The run samples every chain, so
 * "one chain" is `pass1`, the average over all of them; it has no greedy reading.
 */
export const GRPO_CHART: Bar[] = [
  {
    category: "inferenceTraining",
    label: "GRPO, one chain",
    accuracy: GRPO_FINAL.pass1,
    run: 13,
    detail: `one sampled chain, ${GRPO_NOTE}`,
  },
  {
    category: "inferenceTraining",
    label: `GRPO vote, ${GRPO_RUN.k} chains`,
    accuracy: GRPO_FINAL.maj[String(GRPO_RUN.k)],
    run: 13,
    detail: `majority of ${GRPO_RUN.k} chains, ${GRPO_NOTE}`,
  },
];

/** Who the third chart's run covers, stated in its figure. */
export const GRPO_SCOPE = `Currently 1.5B-Instruct only, on ${GRPO_RUN.dataset}.`;

/**
 * The notebooks behind the bars, derived from the charts rather than listed by
 * hand, so a bar that is added or cut cannot leave the download list lying.
 */
export const NOTEBOOKS: ({ page: number } & NotebookLink)[] = [
  ...new Set([...BASE_CHART, ...INSTRUCT_CHART, ...GRPO_CHART].map((b) => b.run)),
]
  .sort((a, b) => a - b)
  .flatMap((page) => {
    const meta = NOTEBOOK_BY_PAGE[page];
    if (!meta) {
      throw new Page16DataError(
        `page 16 draws a bar from page ${page} and has no notebook to show for it`,
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
