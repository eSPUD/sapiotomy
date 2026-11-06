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
 * The stepped figure on measured groups (Page13LoopStepped) moved back to the
 * prototype block (author, 2026-11-05). Line 2's bridge to page 7 stops at "keeps what the right ones
 * did": GRPO is a policy gradient with a group baseline, not best-of-N
 * distillation. The author is training a model for this page, so sections 2
 * and 3's figures are placeholders until that run exists.
 *
 * Section 2 is old page 13's two-knob lab, with one change of evidence. The
 * handoff asked for R1-Zero's training curve to carry the RL dial, but that
 * run's answers grew from ~1k to ~9k tokens over the same steps, so its score
 * mixes both knobs, its intermediate points are authored, and its x axis is
 * steps rather than log compute. The author chose (2026-11-04) to show it as
 * BOTH KNOBS AT ONCE: the two reported endpoint pairs, captioned as training
 * lifting the curve while the model slides itself along it, handing the length
 * to section 3. The o1 surface then separates the knobs, as the interactive
 * construction it is. The two exponents enter twoAxisAccuracy as a sum, so the
 * dials substitute exactly (law(2,0) = law(0,2) = 21.0): never claim they do
 * not. The page's ONE disclosure block sits at the end of this section and
 * covers both constructions (the o1 surface and the R1-Zero points, skeleton
 * and aha placement); there is no second block and no Simulated/Cited footer.
 *
 * Section 3 turns old page 13's first three questions into claims, shown
 * rather than recapped: the dial buys one longer chain (the skeleton is one
 * trace), and the tokens do the work (the chain is the reinforced object, so
 * there was never a step where a narration could be written beside it). No
 * term in the reward mentions length. The dual-axis chart became two stacked
 * panels sharing the step axis. The interrupt is DOUBT, never a found mistake,
 * and its marked block takes the compute hue, never the wrong hue: the reward
 * is outcome-only, so nothing ever scored a step.
 *
 * Section 4 is old page 13's bars, drawn from a common zero (the readings are
 * alternatives, never a waterfall), with R1-Zero's cons@64 added as a second
 * model so the stacking claim holds across two. The o1-ioi vs o3 ablation is a
 * short callout and the only place o3 appears.
 *
 * Section 5 is old page 14's distillation, framed as the answer to "does the
 * law need a frontier-scale model?": SFT on traces, no RL, and traces are new
 * data outside page 3's finite stock. GPT-4o carries two published AIME
 * scores, OpenAI's 12 (sections 2 and 4) and DeepSeek's 9.3 (section 5); each
 * figure keeps its own lab's number and the dot plot's caption says so.
 *
 * Anchored to data/o1-scaling.json, deepseek-r1-training.json and
 * deepseek-r1-distill.json; the law is pinned in frontier.test.ts, the page in
 * Page13.test.tsx.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
import { scaleLinear, scaleLog } from "d3";
import { BigNumber } from "@/components/BigNumber";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { twoAxisAccuracy } from "@/lib/frontier";
import { useStore } from "@/store/useStore";
import { GrpoLoop } from "./Page13GrpoLoop";
import { CodeLine } from "@/components/CodeLine";
/* PROTOTYPES (2026-11-04): remove this import and the block above PageNav to revert */
import { LoopPrototypes } from "./Page13LoopPrototypes";

const PAGE_N = 13;

/** Page 13's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2, announce: 3, competitive: 4 } as const;

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
 * Section 2: one law, two knobs
 * ------------------------------------------------------------------------- */

const SCALING = curves.o1Scaling;
const P = SCALING.fit!.params;

/* The chart samples the law every tenth of a decade across the figure's span. */
const EXPS = Array.from({ length: 21 }, (_, i) => i / 10);

const law = (testExp: number, trainExp: number) =>
  twoAxisAccuracy(testExp, trainExp, P.intercept, P.slopePerDecade, P.maxExp, P.floor);

/* Where o1's reported pass@1 sits on the fully-trained line. */
const O1_DOT = { x: 10 ** ((P.o1Pass1 - P.intercept) / P.slopePerDecade), y: P.o1Pass1 };

/*
 * The family of RL runs, one per decade of train-time compute: the same
 * authored line, slid one decade right for each decade of RL forgone, clamped
 * at the floor. Every curve carries its own end label, so identity is never
 * colour alone.
 */
const TRAIN_STOPS = [0, 1, 2] as const;
const RUN_HUES: Record<number, { stroke: string; fill: string; text: string; label: string }> = {
  0: { stroke: "stroke-wrong", fill: "fill-wrong", text: "fill-wrong-ink", label: "×1" },
  1: { stroke: "stroke-compute", fill: "fill-compute", text: "fill-compute-ink", label: "×10" },
  2: { stroke: "stroke-correct", fill: "fill-correct", text: "fill-correct-ink", label: "×100 RL" },
};

/*
 * Round an SVG coordinate to 2 decimals: log-scale outputs differ in the last
 * float bits between server and client render, which React reports as a
 * hydration mismatch; rounding makes both sides emit the same string.
 */
const px = (v: number) => Math.round(v * 100) / 100;

/* The staircase: from one point on the ×10 run, up one curve and along one
   decade buy the same +29.5. */
const STAIR_EXP = 0.5;
const STAIR_LO = law(STAIR_EXP, 1);
const STAIR_HI = law(STAIR_EXP, 2);

/** An arrow drawn as a line with a small triangular head at (x2, y2). */
function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = px((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  return (
    <g aria-hidden="true">
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink" strokeWidth={1.2} />
      <polygon
        points="0,0 -7,3 -7,-3"
        transform={`translate(${x2},${y2}) rotate(${angle})`}
        className="fill-ink"
      />
    </g>
  );
}

/**
 * The two-knob chart, page 11's family idiom: every RL run drawn in full at
 * card width, the training dial highlighting one, the thinking dial sliding
 * the marker along it. The bracket from the marker up to the ×100 run prices
 * the missing RL; the staircase arrows state the law without any dragging.
 */
function RunFamilyChart({
  trainExp,
  testExp,
  acc,
  gap,
}: {
  trainExp: number;
  testExp: number;
  acc: number;
  gap: number;
}) {
  const width = 640;
  const height = 300;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([1, 100]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));

  const family = TRAIN_STOPS.map((t) => ({
    t,
    pts: EXPS.map((e) => ({ x: 10 ** e, y: law(e, t) })),
  }));
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("");

  const mx = x(10 ** testExp);
  const full = law(testExp, P.maxExp);
  /* Flip the bracket label to the left when the marker nears the right edge. */
  const bracketLeft = testExp > 1.5;

  /* The staircase's two arrows: a riser between the runs, then a tread along
     the top run, drawn just above it so neither overdraws a curve. */
  const sx = x(10 ** STAIR_EXP);
  const riserY1 = y(STAIR_LO) - 4;
  const riserY2 = y(STAIR_HI) + 4;
  const treadY1 = y(STAIR_HI) - 14;
  const treadX2 = x(10 ** (STAIR_EXP + 1));
  const treadY2 = y(law(STAIR_EXP + 1, 2)) - 14;
  const treadAngle = px((Math.atan2(treadY2 - treadY1, treadX2 - sx) * 180) / Math.PI);
  const treadMidX = px((sx + treadX2) / 2);
  const treadMidY = px((treadY1 + treadY2) / 2) - 8;

  const title = `AIME 2024 pass at 1 accuracy against thinking compute per problem, log x axis, redrawn in relative units. Three RL training runs, each one run at a different training-compute budget, are drawn in full as parallel lines: the times 100 run climbs from ${law(0, 2).toFixed(0)} to ${law(2, 2).toFixed(0)} percent across two decades; the times 10 run is the same line one decade right, ending at ${law(2, 1).toFixed(1)} percent; the times 1 run barely leaves the floor, ending at ${law(2, 0).toFixed(0)} percent. Staircase arrows on the times 10 run show that times 10 more RL and times 10 more thinking buy the same ${P.slopePerDecade} points. A dashed reference marks GPT-4o at ${P.gpt4oAime} percent; o1's published pass at 1 of ${P.o1Pass1} percent sits as a dot on the times 100 run. Your marker: the times ${Math.round(10 ** trainExp)} run at times ${Math.round(10 ** testExp)} thinking, scoring ${acc.toFixed(1)} percent${gap > 0 ? `, with ${gap.toFixed(1)} points forgone to the missing RL` : ""}.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="thinking per problem (relative compute, log scale)"
      yLabel="AIME 2024 pass@1 (%)"
    >
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[1, 10, 100].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          ×{t}
        </text>
      ))}

      {/* GPT-4o, the no-chain reference */}
      <line
        x1={0}
        x2={innerW}
        y1={y(P.gpt4oAime)}
        y2={y(P.gpt4oAime)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW - 4} y={y(P.gpt4oAime) + 12} textAnchor="end" className="fill-ink-muted text-[10px]">
        GPT-4o {P.gpt4oAime}%
      </text>

      {family.map((f) => {
        const selected = f.t === trainExp;
        const end = f.pts[f.pts.length - 1];
        const hue = RUN_HUES[f.t];
        return (
          <g key={f.t} opacity={selected ? 1 : 0.45}>
            <path d={path(f.pts)} fill="none" className={hue.stroke} strokeWidth={selected ? 2.75 : 1.25} />
            <text
              x={innerW - 4}
              y={y(end.y) - 6}
              textAnchor="end"
              className={`text-[10px] ${hue.text} ${selected ? "font-semibold" : ""}`}
            >
              {hue.label}
            </text>
          </g>
        );
      })}

      {/* o1's published anchor, on the full run */}
      <circle cx={x(O1_DOT.x)} cy={y(O1_DOT.y)} r={4.5} className="fill-ink stroke-canvas" strokeWidth={1.5} />
      <text x={x(O1_DOT.x) - 8} y={y(O1_DOT.y) - 8} textAnchor="end" className="fill-ink text-[10px]">
        o1 pass@1 {P.o1Pass1}%
      </text>

      {/* your marker, and the bracket pricing the missing RL */}
      <line x1={mx} x2={mx} y1={0} y2={innerH} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="3 3" />
      {gap > 0 ? (
        <g>
          <line x1={mx} x2={mx} y1={y(acc)} y2={y(full)} className="stroke-compute" strokeWidth={2} />
          <circle cx={mx} cy={y(full)} r={3.5} className="fill-canvas stroke-compute" strokeWidth={1.5} />
          <text
            x={bracketLeft ? mx - 8 : mx + 8}
            y={(y(acc) + y(full)) / 2}
            dy="0.32em"
            textAnchor={bracketLeft ? "end" : "start"}
            className="fill-compute-ink text-[10px] font-semibold"
          >
            the missing RL: +{gap.toFixed(1)}
          </text>
        </g>
      ) : null}
      <circle
        cx={mx}
        cy={y(acc)}
        r={5.5}
        className={`${RUN_HUES[trainExp].fill} stroke-canvas`}
        strokeWidth={1.5}
      />

      {/* the staircase, drawn last so the marker's lane never cuts its labels */}
      <Arrow x1={sx} y1={riserY1} x2={sx} y2={riserY2} />
      <text
        x={sx - 6}
        y={(riserY1 + riserY2) / 2}
        dy="0.32em"
        textAnchor="end"
        className="fill-ink text-[10px]"
      >
        ×10 RL → +{P.slopePerDecade}
      </text>
      <Arrow x1={sx + 6} y1={treadY1} x2={treadX2} y2={treadY2} />
      <text
        x={treadMidX}
        y={treadMidY}
        textAnchor="middle"
        transform={`rotate(${treadAngle}, ${treadMidX}, ${treadMidY})`}
        paintOrder="stroke"
        strokeWidth={3}
        className="fill-ink stroke-surface text-[10px]"
      >
        ×10 thinking → +{P.slopePerDecade}
      </text>
    </ChartFrame>
  );
}

/* ---------------------------------------------------------------------------
 * Section 3: where the thinking comes from
 * ------------------------------------------------------------------------- */

const MAX_STEP = 8000;
/** Skeleton staging thresholds on the scrubber (an illustrative placement,
    disclosed in section 2's block). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

type TraceStage = "early" | "mid" | "aha";

const STAGE_CHIP: Record<TraceStage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};
const STAGE_NOTE: Record<TraceStage, string> = {
  early: "A few steps forward, an answer, stop. Nothing looks back.",
  mid: "Longer now, more algebra per attempt, but still strictly forward: whatever was written first, stands.",
  aha: "Four steps in, the trace stops, doubts what it has just written, and goes back to its own first line to derive it again. Nothing scored those steps: the reward only sees the final answer, so nobody told the model that its last step was shaky. It learned to suspect itself anyway, because re-checking lands more right answers and right answers are all the reward pays. Page 10's branch, score, backtrack, with the harness deleted and the scoring moved inside the chain. The extra tokens in the length panel are these loops.",
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

  const title = `R1-Zero across RL training, two stacked panels sharing the training step axis. Top panel, AIME 2024 pass at 1: from 15.6 percent at step 0 to 71.0 percent at step ${MAX_STEP}, flattening late; the two endpoints are reported and the points between are drawn along the reported climb. Bottom panel, average response length, labelled as page 11's test-time compute: from about ${lengthStart.toLocaleString()} to about ${lengthEnd.toLocaleString()} tokens, still climbing after accuracy flattens; annotations note that no term in the reward mentions length and that nobody is turning this dial. A dashed rule at step ${AHA_STEP.toLocaleString()} marks where the aha trace appears (illustrative placement). Marker at step ${step.toLocaleString()}: ${pass.toFixed(1)} percent, about ${length.toLocaleString()} tokens.`;

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
        avg response (tokens) · page 11&apos;s test-time compute
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
 * Section 5: the curve is portable
 * ------------------------------------------------------------------------- */

interface Distill {
  size: number;
  label: string;
  family: "qwen" | "llama";
  note: string;
}
const DISTILLS: Distill[] = [
  { size: 1.5, label: "Qwen-1.5B", family: "qwen", note: "beats GPT-4o on AIME, from a model that fits on a phone" },
  { size: 7, label: "Qwen-7B", family: "qwen", note: "most of the way to o1-mini, at laptop scale" },
  { size: 8, label: "Llama-8B", family: "llama", note: "a Llama base instead of Qwen: the same traces teach a different family" },
  { size: 14, label: "Qwen-14B", family: "qwen", note: "clears o1-mini's line at a size a single workstation can serve" },
  { size: 32, label: "Qwen-32B", family: "qwen", note: "within seven points of the 671B teacher" },
  { size: 70, label: "Llama-70B", family: "llama", note: "bigger is not automatically better: the 32B Qwen edges it" },
];

/** A small legend swatch + label (page-11 idiom). */
function Key({ shape, className, label }: { shape: "circle" | "diamond" | "line" | "dash"; className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block ${
          shape === "line"
            ? "h-0.5 w-4"
            : shape === "dash"
              ? "h-0 w-4 border-t border-dashed"
              : shape === "diamond"
                ? "h-3 w-3 rotate-45"
                : "h-3 w-3 rounded-full"
        } ${className}`}
      />
      {label}
    </span>
  );
}

/**
 * Score is the axis; size is just row order. One row per distilled model
 * (smallest at the top), the 671B teacher as the bottom row, and the closed
 * models as vertical dashed rules: they have scores but no disclosed sizes.
 * Reading down the rows the dots march right through the rules; Llama-70B
 * sitting left of Qwen-32B is a visible kink. Clicking a row picks it.
 */
function DistillDotPlot({ picked, onPick }: { picked: number; onPick: (size: number) => void }) {
  const distill = curves.deepseekDistill;
  const D = distill.fit!.params;
  const aimeOf = (size: number) => distill.points.find((p) => p.x === size)!.y;

  const width = 720;
  const height = 280;
  const margin = { top: 26, right: 16, bottom: 40, left: 118 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const x = scaleLinear().domain([0, 90]).range([0, innerW]);
  const rows = DISTILLS.length + 1;
  const rowH = innerH / rows;
  const rowY = (i: number) => (i + 0.5) * rowH;

  const title = `AIME 2024 pass at 1 as a horizontal dot plot, one row per model, smallest at the top. Rows: ${DISTILLS.map(
    (d) => `${d.label} ${aimeOf(d.size)} percent`,
  ).join(", ")}, and the R1 teacher, a ${D.teacherParamsB}B mixture-of-experts, at ${D.r1Aime} percent. Dashed vertical rules mark closed models with undisclosed sizes: GPT-4o at ${D.gpt4oAime} percent and OpenAI o1-mini at ${D.o1miniAime} percent; a dotted rule marks the teacher's score. Reading down the rows, the dots move right past the closed-model rules; Llama-70B sits left of Qwen-32B. ${DISTILLS.find((d) => d.size === picked)?.label} is selected.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="AIME 2024 pass@1 (%)">
      {[0, 20, 40, 60, 80].map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={0.5} />
          <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* closed models: rules, not rows; their sizes are undisclosed */}
      {[
        { label: "GPT-4o", v: D.gpt4oAime, anchor: "start" as const, dx: 4 },
        { label: "o1-mini", v: D.o1miniAime, anchor: "end" as const, dx: -4 },
      ].map((r) => (
        <g key={r.label}>
          <line
            x1={x(r.v)}
            x2={x(r.v)}
            y1={0}
            y2={innerH}
            className="stroke-ink-muted"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text x={x(r.v) + r.dx} y={-8} textAnchor={r.anchor} className="fill-ink-muted text-[10px]">
            {r.label} · {r.v}%
          </text>
        </g>
      ))}

      {/* the teacher's score, ruled so "within seven points" is visible */}
      <line
        x1={x(D.r1Aime)}
        x2={x(D.r1Aime)}
        y1={0}
        y2={innerH}
        className="stroke-correct"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <text x={x(D.r1Aime) - 4} y={-8} textAnchor="end" className="fill-correct-ink text-[10px]">
        R1 teacher · {D.r1Aime}%
      </text>

      {DISTILLS.map((d, i) => {
        const cy = rowY(i);
        const cx = x(aimeOf(d.size));
        const active = d.size === picked;
        return (
          <g key={d.size} onClick={() => onPick(d.size)} className="cursor-pointer" aria-hidden="true">
            <rect x={-margin.left} y={cy - rowH / 2} width={margin.left + innerW} height={rowH} fill="transparent" />
            <line x1={0} x2={innerW} y1={cy} y2={cy} className="stroke-grid" strokeWidth={0.5} />
            <text
              x={-8}
              y={cy}
              dy="0.32em"
              textAnchor="end"
              className={`text-[10px] ${active ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {d.label}
            </text>
            {active ? <circle cx={cx} cy={cy} r={9} fill="none" className="stroke-ink" strokeWidth={1.5} /> : null}
            {d.family === "llama" ? (
              <rect
                x={cx - 4}
                y={cy - 4}
                width={8}
                height={8}
                transform={`rotate(45 ${cx} ${cy})`}
                className="fill-wrong stroke-canvas"
                strokeWidth={1.5}
              />
            ) : (
              <circle cx={cx} cy={cy} r={4.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
            )}
            {active ? (
              <text x={cx + 13} y={cy} dy="0.32em" textAnchor="start" className="fill-ink text-[10px] font-semibold">
                {aimeOf(d.size).toFixed(1)}%
              </text>
            ) : null}
          </g>
        );
      })}

      {/* the teacher's row, at the bottom: the biggest model, the rightmost dot */}
      <g aria-hidden="true">
        <line x1={0} x2={innerW} y1={rowY(rows - 1)} y2={rowY(rows - 1)} className="stroke-grid" strokeWidth={0.5} />
        <text x={-8} y={rowY(rows - 1)} dy="0.32em" textAnchor="end" className="fill-ink text-[10px] font-semibold">
          R1 teacher · {D.teacherParamsB}B
        </text>
        <circle cx={x(D.r1Aime)} cy={rowY(rows - 1)} r={6} className="fill-correct stroke-canvas" strokeWidth={1.5} />
      </g>
    </ChartFrame>
  );
}

/** A margin note that sits beside its step and scrolls with the page. */
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
  const D = curves.deepseekDistill.fit!.params;

  /* — section 2: open mid-family, ×10 thinking on the ×10 run, so the bracket
       shows exactly one forgone decade (+29.5) — */
  const [testExp, setTestExp] = useState(1);
  const [trainExp, setTrainExp] = useState(1);
  const acc = law(testExp, trainExp);
  const gap = law(testExp, P.maxExp) - acc;

  /* — section 3: the scrubber — */
  const [step, setStep] = useState(0);
  const pass = interpolate(training, step);
  const length = Math.round(T.lengthStart + (T.lengthEnd - T.lengthStart) * (step / MAX_STEP));
  const stage: TraceStage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";

  /* — section 5: the distills — */
  const [pickedSize, setPickedSize] = useState(14);
  const picked = DISTILLS.find((d) => d.size === pickedSize)!;
  const paramRatio = Math.round(D.teacherParamsB / picked.size);

  const touch = () => recordInteraction(PAGE_N);

  /*
   * Section 4's readings, grouped by model. Each group is one model on one
   * benchmark at several sampling budgets, reported as alternatives, so every
   * bar starts from zero and none is a storey on another.
   */
  const groups = [
    {
      heading: "o1, one model read three ways",
      readings: [
        { label: "one chain", note: "the private chain answers once, scored pass@1", value: P.o1Pass1, tone: "bg-compute" },
        { label: "majority vote", note: "the majority answer across 64 of those chains", value: P.o1Cons64, tone: "bg-compute" },
        { label: "learned re-ranker", note: "a learned judge picks one of 1000 of those chains", value: P.o1Rerank1000, tone: "bg-correct" },
      ],
    },
    {
      heading: "R1-Zero, one model read two ways",
      readings: [
        { label: "one chain", note: "its readable chain answers once, scored pass@1", value: T.passAt1, tone: "bg-compute" },
        { label: "majority vote", note: "the majority answer across 64 of those chains", value: T.cons64, tone: "bg-compute" },
      ],
    },
  ];

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
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
            <Cite n={REF.grpo} /> Where
            it differs from STaR is that STaR writes one chain per problem, while GRPO writes
            several and scores every one. Through reinforcement, the model is
            penalized for chains that scored poorly and rewarded for chains that scored well.
            This means every chain the model writes is kept for training, instead of dropping
            the chains that led to a wrong answer. Below, the loop is drawn first, so you can watch
            every chain reach reinforce, and then written out as an algorithm in the same form as
            STaR&apos;s.
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
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              Because each chain is compared with the others from the same problem, GRPO needs no
              second network to say what an average answer looks like. At 671 billion parameters,
              skipping that network is what made the training affordable.
            </figcaption>
          </figure>


          <p className="text-ink-muted">
            Notice that line 4 is the same sampling self-consistency uses,
            but this time the chains are drawn at training time instead of answer time, and the
            model learns from every one of them. Nobody writes that reasoning and nobody grades it
            by hand: the model writes its own chains and a program checks the answers, so the
            training data doesn&apos;t draw on the limited stock of human-written text.
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
            2. One law, two knobs
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored redrawing · anchors verbatim
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The test-time compute scaling law: <em>model size picks your curve; test-time compute slides you
              along it.</em> Learned reasoning swaps the curve-picker:{" "}
              <strong className="text-ink">RL training picks your curve now</strong>. Here is the
              loop above, run once on R1-Zero:
              <Cite n={REF.r1} />
            </p>

            <div
              className="grid gap-3 rounded-lg bg-surface-raised p-3 sm:grid-cols-2"
              role="img"
              aria-label={`R1-Zero, from the start of RL training to the end: AIME 2024 pass at 1 rose from ${T.start} to ${T.passAt1.toFixed(1)} percent, and the average answer grew from about ${T.lengthStart.toLocaleString()} to about ${T.lengthEnd.toLocaleString()} tokens.`}
            >
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-correct-ink">
                  {T.start}% → {T.passAt1.toFixed(1)}%
                </p>
                <p className="text-xs text-ink-muted">AIME 2024 pass@1, start to end of training</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-compute-ink">
                  ≈{T.lengthStart.toLocaleString()} → ≈{T.lengthEnd.toLocaleString()}
                </p>
                <p className="text-xs text-ink-muted">tokens per answer, over the same run</p>
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              The score climbed, and so did the length of every answer.{" "}
              <strong className="text-ink">This is both knobs moving at once</strong>: training
              lifted the curve while the model slid itself along it by thinking about nine times
              longer. Section 3 follows the length.
            </p>

            <p className="text-sm text-ink-muted">
              Turning the knobs one at a time takes a lab that measured them one at a time, and
              OpenAI&apos;s o1 announcement did: one chart against RL training compute, one against
              thinking compute, both log-linear, accuracy against the <em>logarithm</em> of compute.
              <Cite n={REF.announce} /> Below, the two are joined into one surface, all three runs
              drawn at once: the same line, slid one decade right for every decade of RL forgone.{" "}
              <strong className="text-ink">The training dial picks your curve; the thinking dial
              slides your marker along it</strong>, and the bracket prices what the missing RL
              would have bought.
            </p>
            <p className="text-sm text-ink-muted">
              Both dials count compute, not attempts.{" "}
              <strong className="text-ink">×100 RL training is one run given a hundred times
              the training compute</strong>, not a hundred runs; ×100 thinking is one answer
              whose private chain is allowed to run a hundred times as long, not a hundred
              sampled answers; sampling many chains and voting is a separate purchase, and
              section 4 stacks it on top. The score is{" "}
              <strong className="text-ink">pass@1 on AIME 2024</strong>: fifteen problems, one
              chain each, graded against the answer key.
            </p>

            <RunFamilyChart trainExp={trainExp} testExp={testExp} acc={acc} gap={gap} />
            <p className="text-xs text-ink-muted">
              the dials never move the runs; only the highlight and your marker respond. The
              staircase says it without dragging: up one curve and along one decade buy the same +
              {P.slopePerDecade}.
            </p>

            <div className="flex flex-col gap-4 border-t border-dashed border-grid pt-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Slider
                  label="RL training (compute in one training run)"
                  min={0}
                  max={2}
                  step={1}
                  value={trainExp}
                  format={(v) => `×${Math.round(10 ** v)}`}
                  onChange={(v) => {
                    setTrainExp(v);
                    touch();
                  }}
                />
                <Slider
                  label="Thinking time (compute in one answer)"
                  min={0}
                  max={2}
                  step={0.05}
                  value={testExp}
                  format={(v) => `×${Math.round(10 ** v)}`}
                  onChange={(v) => {
                    setTestExp(v);
                    touch();
                  }}
                />
              </div>
              <div className="flex items-start justify-center gap-8">
                <BigNumber
                  size="md"
                  value={acc}
                  suffix="%"
                  tone={acc > P.gpt4oAime ? "correct" : "wrong"}
                  label="AIME 2024 pass@1 here"
                />
                <BigNumber
                  size="md"
                  prefix="+"
                  value={gap}
                  tone={gap > 0 ? "compute" : "ink"}
                  label="the missing RL's share"
                />
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Thinking slides you along the curve; only training
              lifts it.</strong>{" "}
              The two dials pay the same +{P.slopePerDecade} per decade, and on this surface they
              trade one for one: a decade of thinking buys back exactly the decade of RL you
              skipped, which is why ×1 training with ×100 thinking scores the same{" "}
              {law(2, 0).toFixed(1)} as ×100 training with ×1 thinking. What differs is how often
              you pay. The RL is bought once, before any question arrives. The thinking is bought
              again on every answer.
            </p>
            {/* The page's one disclosure block: every authored construction on
                the page, o1's and R1-Zero's together. */}
            <p className="text-xs text-ink-muted">
              OpenAI published two separate charts, one per axis, both with the compute axis
              unlabeled: a log scale in undisclosed, relative units. Joining them into one surface,
              so that a decade of either dial buys the same points and training is a clean sideways
              shift, is this deck&apos;s construction and not a published result; so are the ×1 to
              ×100 span and the +{P.slopePerDecade}-per-decade slope. The dashed GPT-4o line and
              the o1 dot are verbatim. For R1-Zero, the start and end of each training curve are
              DeepSeek&apos;s; the points between them are drawn along the reported climb, the
              trace skeleton in section 3 is a schematic of the structure in the paper&apos;s
              Table 3, not its text, and where the aha lands on the slider is an illustrative
              placement, since the paper gives the behaviour and not a step number. The slope is
              the claim; the absolute compute is a secret.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="References">
            <RefItem n={REF.announce} href="https://openai.com/index/learning-to-reason-with-llms/">
              OpenAI 2024, <em>Learning to Reason with LLMs</em>.
            </RefItem>
          </Note>
          <Note kicker="Try it">
            <p>
              Drag training to ×1 and push thinking to ×100: all that thinking lands exactly where
              the full run <em>starts</em>.
            </p>
          </Note>
        </div>

        {/* Step 3: where the thinking comes from */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            3. Where the thinking comes from
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              R1-Zero · AIME 2024 · DeepSeek-AI 2025
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              Nothing in the recipe mentions reflection. Nothing in the reward mentions length.{" "}
              <strong>Watch both panels anyway.</strong>
            </p>

            <div className="flex flex-col gap-4">
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
              <TrainingPanels step={step} pass={pass} length={length} />
            </div>

            <p className="text-ink">
              Length is not a schedule anyone set: longer, re-checking traces win more reward, so
              the model <strong>buys itself more thinking time</strong>. The skeleton below shows
              what the extra tokens are made of.
            </p>

            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
                  the trace, as a shape · {STAGE_CHIP[stage]}
                </p>
                <p className="font-mono text-xs tabular-nums text-compute-ink">
                  ≈{length.toLocaleString()} tokens
                </p>
              </div>
              <TraceSkeleton stage={stage} />
              <p className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
                {STAGE_NOTE[stage]}
              </p>
            </div>

            <p className="text-ink">
              <strong>The thinking dial buys one longer chain.</strong> Count the traces: there is
              one, allowed to run longer, not many chains sampled and voted on behind an API. That
              is what section 2&apos;s thinking dial assumed and could not show.
            </p>
            <p className="text-ink">
              <strong>The tokens do the work, not describe it.</strong> A chain nobody can read
              might be a running commentary written beside the real work, and from outside there is
              no way to tell. These tokens cannot be that: the chain is what the model sampled and
              what training pushed on, and no separate step ever wrote a description of anything.
              Re-derivation is not narration, and the score climbs as the loops arrive.
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Drag past step {AHA_STEP.toLocaleString()}.</p>
        </Note>

        {/* Step 4: stacking on top */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. Stack the toolbox on top</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Act 2 did not become obsolete; it became the second storey. Put one of its mechanisms
              over a learned chain and the score moves, on both models that published the reading.
              Competition maths (AIME 2024), against a strong LLM with no learned chain at all:
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`AIME 2024 readings, every bar drawn from a common zero. A strong LLM with no learned chain, GPT-4o, scores ${P.gpt4oAime} percent. o1 is read three ways: ${P.o1Pass1} percent with its private chain answering once, ${P.o1Cons64} percent taking the majority across 64 of those chains by majority vote, and ${P.o1Rerank1000} percent when a learned re-ranker picks one of 1000 of those chains. R1-Zero is read two ways: ${T.passAt1.toFixed(1)} percent with one chain, ${T.cons64} percent with the majority across 64. Within each model the readings are alternatives, so no bar starts where another one ends.`}
            >
              <Reading
                label="no learned chain"
                note="one instant answer from a strong LLM (GPT-4o)"
                value={P.gpt4oAime}
                tone="bg-grid"
              />
              {groups.map((g) => (
                <div key={g.heading} className="flex flex-col gap-2 border-t border-dashed border-grid pt-2">
                  <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
                    {g.heading}
                  </p>
                  {g.readings.map((r) => (
                    <Reading key={r.label} {...r} />
                  ))}
                </div>
              ))}
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              Every bar starts at zero, because within a model the readings are alternatives and not
              a ladder: the vote and the re-ranker each replace the single chain, and neither runs on
              the other.{" "}
              <strong className="text-ink">Within each model the problems never change; what
              changes is how many chains were bought and who picked among them.</strong>
            </figcaption>
          </figure>

          <p className="rounded border-l-4 border-compute bg-surface p-4 text-sm text-ink-muted">
            <strong className="text-ink">One recipe, no domain tricks.</strong> OpenAI also ran the
            opposite experiment: bolt hand-engineered, contest-specific strategies onto o1 (
            <strong className="text-ink">o1-ioi</strong>), or just turn the two knobs further. The
            knob-turning branch, an early <strong className="text-ink">o3</strong>, beat the
            hand-built specialist on its own contest, no tricks attached. In their words, scaling
            &ldquo;general-purpose reinforcement learning, rather than relying on domain-specific
            techniques, offers a robust path toward state-of-the-art AI&rdquo;.
            <Cite n={REF.competitive} />{" "}
            <strong className="text-ink">Stacking pays once; the knobs compound.</strong>
          </p>
        </section>

        <Note kicker="References">
          <RefItem n={REF.competitive} href="https://arxiv.org/abs/2502.06807">
            El-Kishky et al. 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </RefItem>
        </Note>

        {/* Step 5: the curve is portable */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            5. The curve is portable
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Table 5 · ~800K samples · MIT license
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-grid bg-surface p-4">
            <p className="text-ink">
              The two knobs were never equally available. Anyone can pay for thinking at answer
              time; lifting the curve took frontier-scale RL, which meant being a frontier lab.{" "}
              <strong>Does the law need one?</strong> R1 wrote out{" "}
              <strong>~{D.samplesK}K of its own reasoning traces</strong>, six small models were
              fine-tuned on them, and the behaviour came with the text.
              <Cite n={REF.r1} />
            </p>
            <p className="text-ink">
              <strong>The curve-lifting knob got cheap.</strong> Not free: someone still paid for
              the RL once. But they paid once, and the result copies, so the reasoning does not
              have to be re-earned by anyone who wants it. The claim to check on the chart is not
              &ldquo;R1 is good&rdquo;; it is that{" "}
              <strong>a lifted curve fits in weights you can download</strong>. Pick a size:
            </p>

            <figure className="m-0 flex flex-col gap-2">
              <DistillDotPlot
                picked={pickedSize}
                onPick={(size) => {
                  setPickedSize(size);
                  touch();
                }}
              />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <Key shape="circle" className="bg-compute" label="Qwen base" />
                <Key shape="diamond" className="bg-wrong" label="Llama base" />
                <Key shape="circle" className="bg-correct" label="R1 teacher (671B MoE)" />
                <Key shape="dash" className="border-ink-muted" label="closed model (size undisclosed)" />
              </div>
              <figcaption className="text-xs text-ink-muted">
                plain supervised fine-tuning on the traces, no RL and no reward, which is STaR&apos;s
                recipe with a far stronger teacher · the released R1 adds a small cold
                start of curated traces before its own RL, and scores {D.r1Aime}% here · rows are
                ordered by size, smallest at the top; the teacher&apos;s {D.teacherParamsB}B is a
                mixture-of-experts total that activates ~{D.teacherActiveB}B per token · GPT-4o
                and o1-mini publish scores but not sizes, so they are rules, not rows · GPT-4o&apos;s{" "}
                {D.gpt4oAime}% is DeepSeek&apos;s measurement, where sections 2 and 4 use
                OpenAI&apos;s {P.gpt4oAime}%
              </figcaption>
            </figure>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a distilled model">
              {DISTILLS.map((d) => {
                const active = d.size === pickedSize;
                return (
                  <button
                    key={d.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPickedSize(d.size);
                      touch();
                    }}
                    className={`rounded border px-3 py-1.5 text-sm ${
                      active
                        ? "border-compute bg-compute/15 font-semibold text-ink"
                        : "border-grid bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-ink">
              <strong>R1-Distill-{picked.label}</strong>{" "}
              <span className="text-ink-muted">· ~{paramRatio}× smaller than its teacher,</span>{" "}
              {picked.note}.
            </p>

            <p className="text-sm text-ink-muted">
              Where a dot lands right of a dashed rule, a model you can download beats a closed
              frontier product by thinking longer at answer time. And the stock of human-written
              text is limited: these traces were never in it. One good reasoner now writes the
              curriculum for everyone else.
            </p>

            <Handoff>
              Every claim on this page arrived as a benchmark score: {T.passAt1.toFixed(1)}% on AIME,{" "}
              {T.cons64}% with a vote, a 14B crossing o1-mini&apos;s line. Every one of them is also
              a number for thinking longer.{" "}
              <em className="text-ink-muted">
                Next: the side of that dial where thinking longer makes the answer worse.
              </em>
            </Handoff>
          </div>
        </section>
      </div>

      {/* PROTOTYPES (2026-11-04): five loop animations under review. Delete this line to revert. */}
      <LoopPrototypes />

      <PageNav n={PAGE_N} />
    </article>
  );
}
