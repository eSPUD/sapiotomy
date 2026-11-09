"use client";

/**
 * Page 13, "Learned Reasoning: One Law, Two Knobs". Merged 2026-11-04 from
 * the old page 13 ("Frontier Reasoners I: o1, o3, and the Two-Axis Scaling
 * Curve") and the old page 14 ("Frontier Reasoners II: DeepSeek-R1, GRPO, and
 * the 'Aha Moment'"). The two pages told one idea in calendar order, and the
 * numbering itself was a historical device; the merge reorders them around the
 * concept. The thesis, in one line: RL on verifiable problems builds reasoning
 * into the weights and lifts the compute curve; thinking at answer time slides
 * along it; the lifted curve is portable.
 *
 * What the merge cut, and must not come back: old page 13's four open
 * questions and closing teaser, old page 14's lede that re-asked them, the
 * "Frontier Reasoners I/II" framing, one of the two "Where this leaves us"
 * codas (old page 14's survives, since it sets up page 14's wrong side of the
 * dial), and every date used as plot ("four months later", "an open lab
 * answered", "the week before"). The page is not a history: the margin
 * timeline the merge first kept went on 2026-11-04 (author), with o1's place
 * in section 1. The LRM-definition quote went too; El-Kishky et al. is still
 * cited for the ablation.
 *
 * The lede is the author's (2026-11-04): STaR isolates good reasoning by
 * whether it reaches a correct answer; RL goes further and learns from every
 * chain, right or wrong. Never call RL "process-based" here: both grade only
 * the answer, and "process" is page 9's word for step grading.
 *
 * Section 1, "What can a wrong chain teach?", is the RL loop for reasoning
 * models as it stands, with no o1 in it (author: the page does not need o1 to
 * explain the loop). The strip's three stations are labelled on their own
 * terms, then the no-human / page 3 data callout, then GRPO in five lines with
 * plain-language notes. Its figure is a page-12-style loop graph (Page13GrpoLoop):
 * a group leaves generate, every chain is scored, every chain reaches
 * reinforce. The pseudocode uses page 12's listing (CodeLine) and notation.
 * The opening is GRPO on its own terms; the STaR comparison (what happens to
 * a wrong chain) comes after the algorithm, beside the self-consistency link,
 * once the reader has watched every chain reach reinforce (author, 2026-11-06).
 * The lede already names STaR, so the listing's STaR notes still land.
 * Section 1 is only what GRPO is and how it differs (author, 2026-11-06). Two
 * points were cut from its closing paragraph and are PARKED for elsewhere on
 * the page, in the author's last wording:
 *   - "Notice that line 4 is the same sampling self-consistency uses, but this
 *     time the chains are drawn at training time instead of answer time."
 *   - "Nobody writes that reasoning and nobody grades it by hand: the model
 *     writes its own chains and a program checks the answers, so the training
 *     data doesn't draw on the limited stock of human-written text."
 * The loop-animation prototypes (A–E, incl. the stepped figure on measured
 * groups) were deleted at the author's request, 2026-11-06; they live in git
 * history (Page13LoopPrototypes.tsx, Page13LoopStepped.tsx). Line 2's bridge to page 7 stops at "keeps what the right ones
 * did": GRPO is a policy gradient with a group baseline, not best-of-N
 * distillation.
 *
 * Sections 2 to 4 run on the author's own GRPO run (2026-11-06): Qwen2.5-1.5B-
 * Instruct, full fine-tune, 400 steps on difficulty-filtered GSM8K, six
 * checkpoints each tested on 600 problems x 32 chains (lib/page13.ts). It
 * replaced the o1 surface (an authored construction joining OpenAI's two
 * charts), R1-Zero's endpoints as section 2's headline, the o1/GPT-4o/R1-Zero
 * bars and the o1-ioi/o3 callout; none of those come back.
 *
 * Section 2 opens on the run in prose (author's wording, 2026-11-06): about 9
 * points of one-chain accuracy and about 18% more tokens per answer. The
 * shaded before/after strip was removed; the graph carries the visuals. Then
 * both knobs are read off the run: the training dial
 * picks a checkpoint, the thinking dial cuts the first chain at a token budget
 * (author chose the budget dial over samples-voted, 2026-11-06, because the
 * page defines thinking as one longer chain and voting as section 4's
 * purchase). Every cell is measured. The data do NOT show o1's tidy law, and
 * the copy must not claim it: training lifts the ceiling (most of it by step
 * 50), the trained model scores LESS under a tight budget (its answers are
 * longer), and past 512 tokens neither curve moves. The opening's lift uses
 * pass@1 averaged over 32 chains; the dials use the first chain.
 *
 * Section 3 is R1-Zero at frontier scale, said up front to be DeepSeek's
 * numbers (author, 2026-11-06: the aha moment matters). Our run's training-log
 * chart was cut the same day: section 2 already shows our model writing longer
 * answers, so a small-scale panel added nothing. The lead-in bridges from
 * section 2. Under the figure: the author's aha paragraph (re-checking is not
 * exclusive to RL; Qwen2.5 base models do it rarely, Liu et al. 2025) and a
 * one-line close. The "length is not a schedule" line and "Learned, or brought
 * out?" (GRPO length bias, DAPO) were cut as jargon, 2026-11-06; don't
 * re-add them. Whether OUR model re-checks more after training
 * waits on notebooks/page_13_rechecking.ipynb, unplaced on the page. The
 * "tokens do the work, not narration" paragraph was cut: superficial
 * self-reflection contests it. No term in the reward
 * mentions length. The interrupt is DOUBT, never a found mistake, and its
 * marked block takes the compute hue, never the wrong hue: the reward is
 * outcome-only, so nothing ever scored a step. The page's ONE disclosure block
 * closes this section and covers R1-Zero's drawn points, the skeleton and the
 * aha placement; there is no second block and no Simulated/Cited footer.
 *
 * Section 4 is our run read four ways from a common zero (the readings are
 * alternatives, never a waterfall), and the trade measured: the untrained
 * model voting over 4 chains about matches the trained model's one, but the
 * training is paid once and the vote on every question.
 *
 * Section 5 (2026-11-08, author) is our own distillation: the 1.5B GRPO teacher
 * into Qwen2.5-0.5B-Instruct, against a student taught by the 1.5B before RL
 * and the 0.5B as released. It replaced "Data the model writes itself" (the
 * bill and text-stock argument, R1's $294K, the two limits) and R1's distill
 * dot plot. The two trained students read unequal rows (896 and 1,891) and each
 * was trained once, so the margin note says so and the page prints no transfer
 * ratio: on these rows it would read as a misleading 100%. The matched,
 * three-seed design is notebooks/page_13_distill_grpo_into_0.5B.ipynb, not run.
 *
 * Anchored to data/page-13-two-axis.json (built by notebooks/page_13_site_data.py
 * from notebooks/page_13_two_axis_grpo.ipynb), data/page-13-distill.json (built by
 * notebooks/page_13_distill_site_data.py from
 * notebooks/page_13_distill_1p5b_to_0p5b.ipynb) and deepseek-r1-training.json; the
 * page is pinned in Page13.test.tsx.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
import { scaleLinear, scaleLog } from "d3";
import { BigNumber } from "@/components/BigNumber";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { NotebookDownload } from "@/components/NotebookDownload";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import {
  BASE,
  BUDGETS,
  CHECKPOINTS,
  DISTILL,
  FINAL,
  RUN,
  modelLabel,
  pct,
  studentLabel,
  type DistillSource,
} from "@/lib/page13";
import { useStore } from "@/store/useStore";
import { GrpoLoop } from "./Page13GrpoLoop";
import { CodeLine } from "@/components/CodeLine";

const PAGE_N = 13;

/** The author's notebook, shipped as a single file (as page 5 ships its own). */
const NOTEBOOK_HREF = "/notebooks/page_13_two_axis_grpo.ipynb";
const NOTEBOOK_SIZE = "0.6 MB";

/** Page 13's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2, critical: 3 } as const;

/* ---------------------------------------------------------------------------
 * Section 1: the loop, and GRPO
 * ------------------------------------------------------------------------- */

/**
 * GRPO in page 12's listing form and notation (M, x, y, r, ŷ), so it reads
 * against STaR's ten lines: a group where STaR writes one chain, a score in
 * place of STaR's keep-or-drop, and the current model updated where STaR
 * re-fine-tunes M₀. Plain notes, no critic / PPO / KL.
 */
const GRPO_LINES: { indent: number; code: React.ReactNode; note?: React.ReactNode }[] = [
  { indent: 0, code: <>M ← M<sub>0</sub></>, note: "the same starting point as STaR" },
  { indent: 0, code: "loop: for many steps" },
  { indent: 1, code: "for (x, y) in problems:" },
  {
    indent: 2,
    code: <>r<sub>i</sub>, ŷ<sub>i</sub> ← M(x)  for i = 1…G</>,
    note: "a group of G chains per problem; STaR writes one",
  },
  {
    indent: 2,
    code: <>s<sub>i</sub> ← 1 if ŷ<sub>i</sub> = y, else 0</>,
    note: "the same answer key as STaR: a short program, not another model",
  },
  {
    indent: 2,
    code: <>A<sub>i</sub> ← (s<sub>i</sub> − mean(s)) / std(s)</>,
    note: "each chain against its group's average; a wrong chain gets a negative weight instead of being dropped",
  },
  {
    indent: 1,
    code: "M ← update(M, r, A)",
    note: <>each r<sub>i</sub> pushed by its A<sub>i</sub>, on the current model, not M<sub>0</sub>; a pull toward M<sub>0</sub> keeps it from drifting too far</>,
  },
];

/* ---------------------------------------------------------------------------
 * Section 2: better answers, longer chains, read off our run
 * ------------------------------------------------------------------------- */

/*
 * Round an SVG coordinate to 2 decimals: log-scale outputs differ in the last
 * float bits between server and client render, which React reports as a
 * hydration mismatch; rounding makes both sides emit the same string.
 */
const px = (v: number) => Math.round(v * 100) / 100;

/** Checkpoint i's first chain, cut after b tokens: accuracy in percent. */
const cut = (i: number, b: number) => pct(CHECKPOINTS[i].budget[String(b)]);

const LAST = CHECKPOINTS.length - 1;
const stepName = (i: number) =>
  CHECKPOINTS[i].step === 0 ? "before training" : `after ${CHECKPOINTS[i].step} steps`;
const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;

/* The checkpoint the lift has mostly arrived by, for the takeaway. */
const EARLY = CHECKPOINTS.find((c) => c.step === 50)!;
const EARLY_IDX = CHECKPOINTS.indexOf(EARLY);
// The closing paragraph quotes the chart's own cells (first chain, cut at a
// budget), so every number in it can be found on the dials.
const MAX_BUDGET = BUDGETS[BUDGETS.length - 1];
// Section 2's opening, rounded the way the prose reads them: points of one-chain
// accuracy gained, and percent more tokens per answer, step 0 to the last step.
const LIFT_POINTS = Math.round(pct(FINAL.pass1) - pct(BASE.pass1));
const LENGTH_GROWTH = Math.round((FINAL.mean_len / BASE.mean_len - 1) * 100);

/**
 * The two knobs, every cell measured: one line per training checkpoint, accuracy
 * against the thinking budget (tokens the one chain may write before it is cut
 * off). The training dial highlights a line; the thinking dial slides the
 * marker. The untrained model stays drawn as the reference, and the bracket
 * between the two markers is what training did at that budget, which goes
 * negative where the trained model's longer answers no longer fit.
 */
function BudgetChart({ trainIdx, budgetIdx }: { trainIdx: number; budgetIdx: number }) {
  const width = 640;
  const height = 300;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog()
    .base(2)
    .domain([BUDGETS[0], BUDGETS[BUDGETS.length - 1]])
    .range([0, innerW]);
  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));
  const line = (i: number) => BUDGETS.map((b, j) => `${j ? "L" : "M"}${x(b)},${y(cut(i, b))}`).join("");

  const b = BUDGETS[budgetIdx];
  const acc = cut(trainIdx, b);
  const base = cut(0, b);
  const delta = acc - base;
  const mx = x(b);
  /* Flip the bracket label to the left near the right edge. */
  const labelLeft = budgetIdx >= BUDGETS.length - 2;
  const end = BUDGETS[BUDGETS.length - 1];

  const title = `${RUN.dataset} accuracy of one chain against its thinking budget, the number of tokens it may write before it is cut off, log axis from ${BUDGETS[0]} to ${end} tokens. One line per training checkpoint, ${CHECKPOINTS.length} in all. Before training the chain scores ${cut(0, BUDGETS[0]).toFixed(1)} percent at ${BUDGETS[0]} tokens and ${cut(0, 128).toFixed(1)} at 128, and levels off at ${cut(0, end).toFixed(1)} percent from 512 tokens. After ${FINAL.step} steps it scores ${cut(LAST, BUDGETS[0]).toFixed(1)} at ${BUDGETS[0]} and ${cut(LAST, 128).toFixed(1)} at 128, below the untrained model, and levels off higher, at ${cut(LAST, end).toFixed(1)} percent. Your marker: ${stepName(trainIdx)}, ${b} tokens, ${acc.toFixed(1)} percent${trainIdx > 0 ? `, ${signed(delta)} points against before training` : ""}.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="thinking budget: tokens the one chain may write (log scale)"
      yLabel={`${RUN.dataset} accuracy, one chain (%)`}
    >
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {BUDGETS.map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      {/* the other checkpoints, faint */}
      {CHECKPOINTS.map((c, i) =>
        i === 0 || i === trainIdx ? null : (
          <path key={c.step} d={line(i)} fill="none" className="stroke-ink-muted" strokeWidth={1} opacity={0.35} />
        ),
      )}

      {/* before training: the reference, always drawn */}
      <path d={line(0)} fill="none" className="stroke-ink-muted" strokeWidth={1.75} strokeDasharray="5 3" />
      <text x={innerW - 4} y={y(cut(0, end)) + 14} textAnchor="end" className="fill-ink-muted text-[10px]">
        before training
      </text>

      {trainIdx > 0 ? (
        <g>
          <path d={line(trainIdx)} fill="none" className="stroke-compute" strokeWidth={2.75} />
          <text
            x={innerW - 4}
            y={y(cut(trainIdx, end)) - 8}
            textAnchor="end"
            className="fill-compute-ink text-[10px] font-semibold"
          >
            {stepName(trainIdx)}
          </text>
        </g>
      ) : null}

      {/* your marker, and what training did at this budget */}
      <line x1={mx} x2={mx} y1={0} y2={innerH} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="3 3" />
      {trainIdx > 0 && Math.abs(delta) >= 0.5 ? (
        <g>
          <line
            x1={mx}
            x2={mx}
            y1={y(base)}
            y2={y(acc)}
            className={delta > 0 ? "stroke-correct" : "stroke-wrong"}
            strokeWidth={2}
          />
          <text
            x={labelLeft ? mx - 10 : mx + 10}
            y={(y(base) + y(acc)) / 2}
            dy="0.32em"
            textAnchor={labelLeft ? "end" : "start"}
            paintOrder="stroke"
            strokeWidth={3}
            className={`stroke-surface text-[10px] font-semibold ${delta > 0 ? "fill-correct-ink" : "fill-wrong-ink"}`}
          >
            training: {signed(delta)}
          </text>
        </g>
      ) : null}
      <circle cx={mx} cy={y(base)} r={4} className="fill-canvas stroke-ink-muted" strokeWidth={1.5} />
      {trainIdx > 0 ? (
        <circle cx={mx} cy={y(acc)} r={5.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
      ) : null}
    </ChartFrame>
  );
}

/* ---------------------------------------------------------------------------
 * Section 3: where the thinking comes from
 * ------------------------------------------------------------------------- */

const MAX_STEP = 8000;
/** Skeleton staging thresholds on the scrubber (an illustrative placement; the
    paper gives the behaviour, not a step. The on-page disclosure line was
    removed by the author, 2026-11-06; the chart's aria title still says so). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

type TraceStage = "early" | "mid" | "aha";

const STAGE_CHIP: Record<TraceStage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};

/**
 * Both of R1-Zero's training variables against one step axis, as two stacked
 * panels: accuracy on top (correct hue), average response length below
 * (compute hue). It replaced a dual-axis chart, the hardest of the page's
 * charts to read. One dashed rule marks the (illustrative) aha step across
 * both panels, so the chart and the skeleton below are visibly one moment.
 */
function TrainingPanels({ step, pass, length }: { step: number; pass: number; length: number }) {
  const training = curves.deepseekTraining;
  const { lengthStart, lengthEnd } = training.fit!.params;

  const width = 720;
  const height = 360;
  const margin = { top: 16, right: 16, bottom: 40, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const split = innerH / 2;
  const x = scaleLinear().domain([0, MAX_STEP]).range([0, innerW]);
  const yAcc = scaleLinear().domain([0, 90]).range([split - 4, 22]);
  const yLen = scaleLinear().domain([0, 10000]).range([innerH - 4, split + 22]);

  const lengthAt = (s: number) => lengthStart + (lengthEnd - lengthStart) * (s / MAX_STEP);
  const accPath = training.points.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yAcc(p.y)}`).join("");
  const lenPath = training.points
    .map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yLen(lengthAt(p.x))}`)
    .join("");
  const first = training.points[0];
  const last = training.points[training.points.length - 1];

  const title = `R1-Zero across RL training, two stacked panels sharing the training step axis. Top panel, AIME 2024 pass at 1: from 15.6 percent at step 0 to 71.0 percent at step ${MAX_STEP}, flattening late; the two endpoints are reported and the points between are drawn along the reported climb. Bottom panel, average response length, labelled as test-time compute: from about ${lengthStart.toLocaleString()} to about ${lengthEnd.toLocaleString()} tokens, still climbing after accuracy flattens; annotations note that no term in the reward mentions length and that nobody is turning this dial. A dashed rule at step ${AHA_STEP.toLocaleString()} marks where the aha trace appears (illustrative placement). Marker at step ${step.toLocaleString()}: ${pass.toFixed(1)} percent, about ${length.toLocaleString()} tokens.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="RL training step">
      {/* the seam between the panels */}
      <line x1={0} x2={innerW} y1={split} y2={split} className="stroke-grid" strokeWidth={1} />

      {/* top panel: accuracy */}
      <text x={8} y={14} className="fill-correct-ink text-[11px] font-semibold">
        AIME 2024 pass@1 (%)
      </text>
      {[0, 40, 80].map((t) => (
        <g key={`a${t}`}>
          <line x1={0} x2={innerW} y1={yAcc(t)} y2={yAcc(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={yAcc(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* bottom panel: length, named in the deck's terms */}
      <text x={8} y={split + 14} className="fill-compute-ink text-[11px] font-semibold">
        avg response (tokens) · test-time compute
      </text>
      {[0, 5000, 10000].map((t) => (
        <g key={`l${t}`}>
          <line x1={0} x2={innerW} y1={yLen(t)} y2={yLen(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={yLen(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t === 0 ? "0" : `${t / 1000}k`}
          </text>
        </g>
      ))}

      {[0, 2000, 4000, 6000, 8000].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t === 0 ? "0" : `${t / 1000}k`}
        </text>
      ))}

      {/* the aha step, across both panels */}
      <line
        x1={x(AHA_STEP)}
        x2={x(AHA_STEP)}
        y1={0}
        y2={innerH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={x(AHA_STEP) + 4} y={14} textAnchor="start" className="fill-ink-muted text-[10px]">
        the aha appears
      </text>

      <path d={accPath} fill="none" className="stroke-correct" strokeWidth={2.5} />
      {/* the reported endpoints, solid; the line between them is drawn */}
      <circle cx={x(first.x)} cy={yAcc(first.y)} r={3.5} className="fill-correct stroke-canvas" strokeWidth={1} />
      <circle cx={x(last.x)} cy={yAcc(last.y)} r={3.5} className="fill-correct stroke-canvas" strokeWidth={1} />
      <path d={lenPath} fill="none" className="stroke-compute" strokeWidth={2.5} />

      <text x={innerW * 0.62} y={yLen(1500)} textAnchor="middle" className="fill-compute-ink text-[10px]">
        no term in the reward mentions length
      </text>
      <text
        x={innerW * 0.62}
        y={yLen(1500) + 13}
        textAnchor="middle"
        className="fill-compute-ink text-[10px] font-semibold"
      >
        nobody is turning this dial
      </text>

      {/* the slider's marker, through both panels */}
      <line
        x1={x(step)}
        x2={x(step)}
        y1={0}
        y2={innerH}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle cx={x(step)} cy={yAcc(pass)} r={5} className="fill-correct stroke-canvas" strokeWidth={1.5} />
      <circle cx={x(step)} cy={yLen(length)} r={5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
    </ChartFrame>
  );
}

/** Geometry shared by the skeleton's rows. */
const SK_BLOCK_W = 46;
const SK_BLOCK_H = 16;
const SK_GAP = 16;
const skX = (i: number) => 8 + i * (SK_BLOCK_W + SK_GAP);

/** One row of forward steps: neutral blocks joined by arrows, optionally
    dashed (the aha's second pass) and optionally ending in an answer pill. */
function SkeletonRow({
  y,
  count,
  dashed = false,
  answer = false,
  answerCorrect = false,
}: {
  y: number;
  count: number;
  dashed?: boolean;
  answer?: boolean;
  answerCorrect?: boolean;
}) {
  const mid = y + SK_BLOCK_H / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <rect
            x={skX(i)}
            y={y}
            width={SK_BLOCK_W}
            height={SK_BLOCK_H}
            rx={3}
            className={dashed ? "stroke-correct" : "fill-grid"}
            fill={dashed ? "none" : undefined}
            strokeDasharray={dashed ? "3 2" : undefined}
          />
          {i < count - 1 || answer ? (
            <line
              x1={skX(i) + SK_BLOCK_W + 2}
              x2={skX(i + 1) - 5}
              y1={mid}
              y2={mid}
              className="stroke-ink-muted"
              strokeWidth={1}
              markerEnd="url(#skel-fwd)"
            />
          ) : null}
        </g>
      ))}
      {answer ? (
        <g>
          <rect
            x={skX(count)}
            y={y}
            width={58}
            height={SK_BLOCK_H}
            rx={SK_BLOCK_H / 2}
            fill="none"
            className={answerCorrect ? "stroke-correct" : "stroke-ink-muted"}
          />
          <text
            x={skX(count) + 29}
            y={mid}
            dy="0.32em"
            textAnchor="middle"
            className={`text-[9px] ${answerCorrect ? "fill-correct-ink" : "fill-ink-muted"}`}
          >
            answer
          </text>
        </g>
      ) : null}
    </g>
  );
}

/**
 * The trace as a shape, no text. Early and mid are strictly forward chains
 * of different lengths; the aha stage adds the only structure that matters:
 * an interrupt and a loop back to the trace's own first line, then a second,
 * re-deriving pass. The abstraction of the paper's Table-3 trace: the
 * structure it exhibits, not the words it uses.
 */
function TraceSkeleton({ stage }: { stage: TraceStage }) {
  const label =
    stage === "early"
      ? "Trace skeleton, early in training: three steps forward, then an answer. Nothing looks back. Schematic, structure only, no text."
      : stage === "mid"
        ? "Trace skeleton, mid training: six steps forward, then an answer. Longer, still strictly forward. Schematic, structure only, no text."
        : "Trace skeleton after the aha: four steps forward, the last of them outlined as the step the trace doubts, then the trace interrupts itself and loops back to its own first line; a second pass of five dashed steps re-derives the solution and ends in an answer. Schematic, structure only, no text.";

  const height = stage === "aha" ? 140 : 52;

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 560 ${height}`} className="w-full">
      <defs>
        <marker id="skel-fwd" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,0 L5,3 L0,6" fill="none" className="stroke-ink-muted" strokeWidth={1} />
        </marker>
        <marker id="skel-loop" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L6,3.5 L0,7" fill="none" className="stroke-correct" strokeWidth={1.2} />
        </marker>
      </defs>

      <text x={8} y={14} className="fill-ink-muted text-[9px] font-eyebrow uppercase tracking-wide">
        {stage === "aha" ? "first pass" : "one pass"}
      </text>

      {stage === "early" ? <SkeletonRow y={22} count={3} answer /> : null}
      {stage === "mid" ? <SkeletonRow y={22} count={6} answer /> : null}

      {stage === "aha" ? (
        <g>
          <SkeletonRow y={22} count={4} />
          {/*
           * The step the trace is about to doubt. Compute hue, dashed:
           * attention, not error. It must never take the wrong hue: nothing
           * ever scored this step, so a located mistake would contradict the
           * outcome-only reward in section 1.
           */}
          <rect
            x={skX(3)}
            y={22}
            width={SK_BLOCK_W}
            height={SK_BLOCK_H}
            rx={3}
            fill="none"
            className="stroke-compute"
            strokeWidth={1.5}
            strokeDasharray="3 2"
          />
          <line
            x1={skX(3) + SK_BLOCK_W + 2}
            x2={skX(4) - 5}
            y1={30}
            y2={30}
            className="stroke-ink-muted"
            strokeWidth={1}
            markerEnd="url(#skel-fwd)"
          />
          <rect x={skX(4)} y={22} width={64} height={SK_BLOCK_H} rx={3} fill="none" className="stroke-correct" strokeWidth={1.5} />
          <text x={skX(4) + 32} y={30} dy="0.32em" textAnchor="middle" className="fill-correct-ink text-[9px] font-semibold">
            interrupt
          </text>

          <path
            d={`M ${skX(4) + 32} 42 C ${skX(4) + 32} 76, 30 54, 30 90`}
            fill="none"
            className="stroke-correct"
            strokeWidth={1.5}
            markerEnd="url(#skel-loop)"
          />
          <text x={160} y={82} textAnchor="middle" className="fill-correct-ink text-[9px]">
            back to line 1
          </text>

          <SkeletonRow y={96} count={5} dashed answer answerCorrect />
          <text x={8} y={130} className="fill-ink-muted text-[9px] font-eyebrow uppercase tracking-wide">
            second pass
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Section 4: stacking on top
 * ------------------------------------------------------------------------- */

/**
 * One bar in section 4's figure. Every bar is drawn from a common zero and
 * carries its own published score: the readings are alternatives, so none of
 * them may start where another ended.
 */
function Reading({
  label,
  note,
  value,
  tone,
}: {
  label: string;
  note: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-44 shrink-0 text-ink-muted">
        {label}
        <span className="block text-xs text-ink-muted">{note}</span>
      </span>
      <div className="relative h-5 flex-1 rounded bg-surface-raised">
        <div className={`absolute left-0 h-5 rounded ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono font-semibold tabular-nums text-ink">
        {value}%
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Section 5: whose chains did the student read? (our distillation run)
 * ------------------------------------------------------------------------- */

const DISTILL_ARMS: { key: DistillSource; label: string; note: string }[] = [
  { key: "none", label: "nothing", note: "the 0.5B as released" },
  { key: "base15", label: "1.5B, before RL", note: "chains from the untrained 1.5B" },
  { key: "grpo15", label: "1.5B, after RL", note: "chains from the trained 1.5B" },
];

/** One sample's accuracy for a student, in percent. */
const studentPct = (s: DistillSource) => pct(DISTILL.arms[s].pass1);
const gainOver = (s: DistillSource, than: DistillSource) => (studentPct(s) - studentPct(than)).toFixed(1);

/**
 * One student per row, every bar from zero (section 4's idiom), with the 1.5B
 * teacher before and after RL as dashed rules across all rows, measured on the
 * same 300 problems as the students.
 */
function DistillBars({ picked, onPick }: { picked: DistillSource; onPick: (s: DistillSource) => void }) {
  const before = pct(DISTILL.teacher_before.pass1);
  const after = pct(DISTILL.teacher_after.pass1);
  return (
    <div className="flex flex-col gap-2">
      {DISTILL_ARMS.map((a) => {
        const value = studentPct(a.key);
        const active = a.key === picked;
        return (
          <button
            key={a.key}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(a.key)}
            className={`flex items-center gap-2 rounded px-1 py-0.5 text-left text-sm ${
              active ? "bg-compute/10" : ""
            }`}
          >
            <span className="w-44 shrink-0 text-ink-muted">
              <span className={active ? "font-semibold text-ink" : ""}>{a.label}</span>
              <span className="block text-xs text-ink-muted">{a.note}</span>
            </span>
            <span className="relative h-5 flex-1 rounded bg-surface-raised">
              <span
                className={`absolute left-0 h-5 rounded ${active ? "bg-compute" : "bg-grid"}`}
                style={{ width: `${value}%` }}
              />
              {[before, after].map((v) => (
                <span
                  key={v}
                  aria-hidden="true"
                  className="absolute -top-1 -bottom-1 border-l border-dashed border-ink-muted"
                  style={{ left: `${v}%` }}
                />
              ))}
            </span>
            <span className="w-16 shrink-0 text-right font-mono font-semibold tabular-nums text-ink">
              {value.toFixed(1)}%
            </span>
          </button>
        );
      })}
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span className="w-44 shrink-0" />
        <span className="relative h-4 flex-1">
          <span className="absolute -translate-x-full pr-1" style={{ left: `${before}%` }}>
            1.5B before RL · {before.toFixed(1)}%
          </span>
          <span className="absolute pl-1" style={{ left: `${after}%` }}>
            after · {after.toFixed(1)}%
          </span>
        </span>
        <span className="w-16 shrink-0" />
      </div>
    </div>
  );
}

/** A margin note that sits beside its step and scrolls with the page. */
/**
 * Caps a chart's growth. Every chart's svg is width="100%", so on a wide
 * screen it filled the 1,150px column and drew its labels at ~2x. The chart
 * still shrinks freely; it just stops at MAX_SCALE times the width it was
 * drawn at, centred in its card.
 */
const MAX_SCALE = 1.25;
function Fit({ drawnWidth, children }: { drawnWidth: number; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: drawnWidth * MAX_SCALE }}>
      {children}
    </div>
  );
}

function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

export function Page13() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const training = curves.deepseekTraining;
  const T = training.fit!.params;

  /* — section 2: open on the finished run with room to think, the headline's
       lift; the try-it note sends the reader to the tight budget — */
  const [trainIdx, setTrainIdx] = useState(LAST);
  const [budgetIdx, setBudgetIdx] = useState(BUDGETS.length - 1);
  const budget = BUDGETS[budgetIdx];
  const acc = cut(trainIdx, budget);
  const delta = acc - cut(0, budget);

  /* — section 3: the scrubber — */
  const [step, setStep] = useState(0);
  const pass = interpolate(training, step);
  const length = Math.round(T.lengthStart + (T.lengthEnd - T.lengthStart) * (step / MAX_STEP));
  const stage: TraceStage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";

  /* — section 5: our distillation run — */
  const [distillPick, setDistillPick] = useState<DistillSource>("grpo15");
  const distillArm = DISTILL_ARMS.find((a) => a.key === distillPick)!;

  const touch = () => recordInteraction(PAGE_N);

  /*
   * Section 4's readings (author's list, 2026-11-06): one run on the same
   * problems, one chain and a majority vote, each before and after training,
   * then any-of-K right after training. Grey bars are the untrained model,
   * compute bars the trained one. The readings are alternatives, so every bar
   * starts from zero. "Any right" is no method anyone can run: it is what a
   * perfect judge picking among the same chains would score. STaR's readings
   * join this list once its run exists.
   */
  const K = RUN.k;
  const readings = [
    { label: "before training", note: "one chain", value: pct(BASE.pass1), tone: "bg-grid" },
    { label: "after training", note: "one chain", value: pct(FINAL.pass1), tone: "bg-compute" },
    { label: "majority vote, before training", note: `the majority answer of ${K} chains`, value: pct(BASE.maj[String(K)]), tone: "bg-grid" },
    { label: "majority vote, after training", note: `the majority answer of ${K} chains`, value: pct(FINAL.maj[String(K)]), tone: "bg-compute" },
    { label: `any of ${K} right`, note: `after training: a perfect judge picking from ${K} chains`, value: pct(FINAL.pass_at_k_max), tone: "bg-correct" },
  ];

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title, as on page 5. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_HREF} size={NOTEBOOK_SIZE} label="GRPO" />
      </div>
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        STaR is reinforcement learning in its simplest form: the reward is 1 or 0, and only the
        1s are trained on. <strong className="text-ink">GRPO</strong> keeps that reward but goes
        further: it learns from every chain, right or wrong. At scale, it teaches the model
        something new, to think longer on its own.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1: the loop, and its cheapest published instance */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">1. What can a wrong chain teach?</h2>
          <p className="text-ink-muted">
            The loop illustrated below is GRPO&apos;s (Group Relative Policy Optimization), the
            recipe DeepSeek used to train R1-Zero.
            <Cite n={REF.r1} />
            <sup className="text-compute-ink">,</sup>
            <Cite n={REF.grpo} /> For
            every problem, the model writes several chains, and a program scores each answer 1 or
            0. Through reinforcement, the model is penalized for chains that scored poorly and
            rewarded for chains that scored well. Below, the loop is drawn first, so you can watch
            every chain reach reinforce, and then written out as an algorithm.
          </p>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            {/* the loop: a group leaves generate, every chain is scored, every chain reaches reinforce */}
            <GrpoLoop />
          </div>

          {/* the loop written down, divided off as page 12 divides STaR's */}
          <h3 className="mt-2 text-lg font-semibold text-ink">Algorithm</h3>

          <figure
            className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
            aria-label="GRPO pseudocode: start from the base model; for many steps, for each problem sample a group of chains, score each answer 1 or 0 against the key, measure each score against the group's average, then update the current model, toward the above-average chains and away from the rest."
          >
            <div className="flex flex-col">
              {GRPO_LINES.map((l, i) => (
                <CodeLine key={i} n={i + 1} indent={l.indent} code={l.code} note={l.note} />
              ))}
            </div>
          </figure>


          <p className="text-ink-muted">
            GRPO differs from STaR, and some other reinforcement-learning approaches, in what
            happens to a wrong chain. STaR writes one chain per problem, and drops it when the
            answer is wrong. GRPO, however, writes several and trains on every one. A wrong chain
            still teaches the model what not to do, so it is kept. Using this method, we can steer
            the model toward reasoning that reaches the right answer, and away from reasoning that
            doesn&apos;t. The steering happens at training time, unlike inference-time approaches
            such as best-of-N with a process reward model.
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="References">
            <RefItem n={REF.r1} href="https://arxiv.org/abs/2501.12948">
              DeepSeek-AI 2025, <em>DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
              Reinforcement Learning</em>.
            </RefItem>
            <RefItem n={REF.grpo} href="https://arxiv.org/abs/2402.03300">
              Shao et al. 2024, <em>DeepSeekMath</em> (GRPO).
            </RefItem>
          </Note>
        </div>

        {/* Step 2: what the loop buys */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            2. Better answers, longer chains
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {modelLabel} · {RUN.n_eval} {RUN.dataset} problems
            </span>
          </h2>
          <p className="text-ink-muted">
            To show how GRPO improves a model&apos;s reasoning, and with it the answers that
            reasoning reaches, we ran {RUN.rl_steps} steps of it on {modelLabel}, using
            grade-school maths word problems ({RUN.dataset}). This model had already been
            fine-tuned to follow instructions. Even so, the training raised its accuracy by about{" "}
            {LIFT_POINTS} points, and taught it to write about {LENGTH_GROWTH}% more tokens per
            answer, though nothing in the reward asks for length.
          </p>

          {/* The figure: the chart, its two dials and its two readouts, nothing else. */}
          <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <Fit drawnWidth={640}>
              <BudgetChart trainIdx={trainIdx} budgetIdx={budgetIdx} />
            </Fit>

            <div className="flex flex-col gap-4 border-t border-dashed border-grid pt-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Slider
                  label="RL training (steps in one training run)"
                  min={0}
                  max={LAST}
                  step={1}
                  value={trainIdx}
                  format={(v) => `${CHECKPOINTS[v].step} steps`}
                  onChange={(v) => {
                    setTrainIdx(v);
                    touch();
                  }}
                />
                <Slider
                  label="Thinking budget (tokens in one answer)"
                  min={0}
                  max={BUDGETS.length - 1}
                  step={1}
                  value={budgetIdx}
                  format={(v) => `${BUDGETS[v]} tokens`}
                  onChange={(v) => {
                    setBudgetIdx(v);
                    touch();
                  }}
                />
              </div>
              <div className="flex items-start justify-center gap-8">
                <BigNumber size="md" value={acc} suffix="%" tone="compute" label={`${RUN.dataset} accuracy here`} />
                <BigNumber
                  size="md"
                  prefix={delta >= 0 ? "+" : "−"}
                  value={Math.abs(delta)}
                  tone={trainIdx === 0 ? "ink" : delta >= 0 ? "correct" : "wrong"}
                  label="what training did at this budget"
                />
              </div>
            </div>
          </figure>

          <p className="text-ink-muted">
            <strong className="text-ink">Training raises the ceiling.</strong> With room to finish
            ({MAX_BUDGET.toLocaleString()} tokens), the trained model is right more often:{" "}
            {cut(0, MAX_BUDGET).toFixed(1)}% before training, {cut(EARLY_IDX, MAX_BUDGET).toFixed(1)}%
            after {EARLY.step} steps, {cut(LAST, MAX_BUDGET).toFixed(1)}% after {FINAL.step}. Most
            of the gain comes early. <strong className="text-ink">But the trained model needs that
            room.</strong> Cut both models off at 128 tokens, and the trained one scores{" "}
            {cut(LAST, 128).toFixed(1)}% against the untrained model&apos;s{" "}
            {cut(0, 128).toFixed(1)}%, because its longer answers are less likely to finish in time.
            Past 512 tokens, neither curve moves; on these problems, the chain is already done.
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="Try it">
            <p>
              Set thinking to 128 tokens, then drag training up: at that budget, training costs
              points.
            </p>
          </Note>
        </div>

        {/* Step 3: where the thinking comes from */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            3. At scale, the chains keep growing
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              R1-Zero · AIME 2024 · DeepSeek-AI 2025
            </span>
          </h2>

          {/* Author's wording, 2026-11-06. */}
          <p className="text-ink-muted">
            The GRPO reward function only steers the model based on whether the reasoning
            produced a correct answer. It <strong className="text-ink">does not</strong> reward
            longer responses or tell the model to double-check its work.
          </p>
          <p className="text-ink-muted">
            We&apos;ve already seen how a small model ({modelLabel}) reacted to this setup: as
            accuracy climbed, it naturally started using more tokens to work through problems. To
            see what happens when you scale this up, we can look at DeepSeek&apos;s R1-Zero, which
            used the exact same training method on a much larger base model (the start and end of
            each curve come from DeepSeek&apos;s paper; the climb between them is drawn).
            <Cite n={REF.r1} />
          </p>
          <p className="text-ink-muted">
            Move the slider forward in 500-step increments and keep an eye on how both accuracy
            and response length change over time.
          </p>

          {/* The figure: dial, readouts, both panels and the trace's shape, nothing else. */}
          <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
              <Slider
                label="RL training step"
                min={0}
                max={MAX_STEP}
                step={500}
                value={step}
                onChange={(v) => {
                  setStep(v);
                  touch();
                }}
              />
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="font-mono text-5xl font-bold tabular-nums text-correct-ink">
                    {pass.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-muted">AIME 2024 pass@1</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold tabular-nums text-compute-ink">
                    ≈{length.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-muted">avg response tokens</p>
                </div>
              </div>
              <Fit drawnWidth={720}>
                <TrainingPanels step={step} pass={pass} length={length} />
              </Fit>

            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
                  the trace, as a shape · {STAGE_CHIP[stage]}
                </p>
                <p className="font-mono text-xs tabular-nums text-compute-ink">
                  ≈{length.toLocaleString()} tokens
                </p>
              </div>
              <Fit drawnWidth={560}>
                <TraceSkeleton stage={stage} />
              </Fit>
            </div>
          </figure>

          {/* One fixed paragraph on the aha (author, 2026-11-06): the text no longer
              changes with the dial. Base models already re-check before RL (Liu et al.
              2025; Gandhi et al. 2025), so the copy says training made it common, not
              that it was invented here. */}
          {/* Author's wording, 2026-11-06, copy-edited for spelling and punctuation only. */}
          <p className="text-ink-muted">
            As you can see above, there is a very interesting side effect of RL here. R1-Zero&apos;s
            chains begin to interrupt themselves. In the trace DeepSeek shows, the model stops
            mid-solution and second-guesses its reasoning. It then goes back to re-derive an
            earlier step. This was not the goal of RL, nor is it exclusive to RL: on rare
            occasions, it can actually happen in Qwen2.5 base models.
            <Cite n={REF.critical} /> However, RL made it significantly more common.
          </p>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="Try it">
            <p>Drag past step {AHA_STEP.toLocaleString()}.</p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.critical} href="https://arxiv.org/abs/2503.20783">
              Liu et al. 2025, <em>Understanding R1-Zero-Like Training: A Critical Perspective</em>.
            </RefItem>
          </Note>
        </div>

        {/* Step 4: stacking on top */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. Training stacks with inference-time scaling</h2>
          {/* Author's opening, 2026-11-06, copy-edited for grammar only. */}
          <p className="text-ink-muted">
            It is now clear that RL methods such as GRPO and STaR result in longer chains and
            better accuracy. You may wonder whether we still need inference-time scaling methods
            at all, or whether we should simply train more. To answer that question, here is a
            quick overview of how inference-time scaling methods can actually be stacked with
            reasoning-focused RL.
          </p>
          {/* The figure: the bars and nothing else. */}
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`${RUN.dataset} readings of one run, every bar drawn from a common zero: ${readings
                .map((r) => `${r.label}, ${r.note}, ${r.value.toFixed(1)} percent`)
                .join("; ")}. The readings are alternatives, so no bar starts where another one ends.`}
            >
              {readings.map((r) => (
                <Reading key={r.label} {...r} />
              ))}
            </div>
          </figure>
        </section>

        {/* Step 5: our own distillation */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            5. Whose chains did the student read?
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · {studentLabel} · {DISTILL.n_eval} {DISTILL.dataset} problems
            </span>
          </h2>
          <p className="text-ink-muted">
            A trained model&apos;s chains are new training data, and they can teach other models.
          </p>
          <p className="text-ink-muted">
            To see how, we distilled our trained {modelLabel} into {studentLabel}. The 1.5B
            answered {RUN.dataset}&apos;s training questions, a program kept the chains that reached
            the right answer, and the 0.5B was fine-tuned to reproduce them: the same fine-tuning
            STaR uses, on another model&apos;s chains. To check that the reasoning is what travels,
            a second 0.5B was trained the same way on chains from the 1.5B before RL.
          </p>

          {/* The figure: the dial (one row per student), the bars and the readout. */}
          <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <div
              role="group"
              aria-label="What the 0.5B was trained on. Dashed rules: the 1.5B teacher before and after RL."
            >
              <DistillBars
                picked={distillPick}
                onPick={(s) => {
                  setDistillPick(s);
                  touch();
                }}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-grid pt-3 text-sm" aria-live="polite">
              <p className="text-ink">
                <strong>0.5B trained on {distillArm.label}</strong>
                <span className="text-ink-muted">
                  {" "}
                  · {studentPct(distillPick).toFixed(1)}% on {DISTILL.dataset} ·{" "}
                  {DISTILL.arms[distillPick].mean_len} tokens per answer
                </span>
              </p>
              {distillPick === "none" ? (
                <p className="text-ink-muted">This student read nothing: it is the 0.5B as released.</p>
              ) : (
                <p className="text-ink-muted">
                  <strong className="text-ink">
                    +{distillPick === "grpo15" ? gainOver("grpo15", "base15") : gainOver("base15", "none")}
                  </strong>{" "}
                  points over{" "}
                  {distillPick === "grpo15"
                    ? "the student that read the 1.5B before RL."
                    : "the 0.5B as released."}
                </p>
              )}
            </div>
          </figure>

          <Handoff>
            Every claim on this page arrived as a benchmark score: {pct(FINAL.pass1).toFixed(1)}% on{" "}
            {RUN.dataset}, {pct(FINAL.maj[String(RUN.k)]).toFixed(1)}% with a vote,{" "}
            {studentPct("grpo15").toFixed(1)}% for a 0.5B that read a trained model&apos;s chains.
            Every one of them is also a number for thinking longer.{" "}
            <em className="text-ink-muted">
              Next: the side of that dial where thinking longer makes the answer worse.
            </em>
          </Handoff>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="Try it">
            <p>Switch what the 0.5B was trained on.</p>
          </Note>
          <Note kicker="Reading the chart">
            <p>
              The two trained students did not read the same amount:{" "}
              {DISTILL.arms.base15.rows.toLocaleString("en-US")} training rows from the 1.5B before
              RL, {DISTILL.arms.grpo15.rows.toLocaleString("en-US")} from the 1.5B after it, so part
              of the gap may be quantity. Each was trained once and tested on {DISTILL.n_eval}{" "}
              problems, where one standard error is about {DISTILL.se_points} points. The dashed
              rules are the 1.5B on those same problems, so they differ slightly from section 2.
            </p>
          </Note>
        </div>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
