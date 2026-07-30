"use client";

/**
 * Page 14, "Frontier Reasoners II: DeepSeek-R1, GRPO, and the 'Aha Moment'" —
 * the open-weight answer to the closed frontier. Page 13 closed on a promise
 * (weights, training curve, visible chain); this page cashes all three in.
 * The page's one idea: reward ONLY verifiable right answers and the pausing /
 * second-guessing / self-correcting emerges on its own — nobody writes it in.
 *
 * Step 1 is the recipe, GRPO, abstracted honestly: five lines of annotated
 * pseudocode (sample a group, score with a rule, advantage = distance from
 * the group's own mean) instead of the clipped-surrogate objective. The one
 * interaction is a single dial: sample 1 always answers page 1's 17 × 24
 * correctly, and the dial sets how many of the other three also get it
 * right. The reader watches the SAME right answer earn a shrinking push as
 * the group gets luckier, down to 0.00 when the group is uniform — the two
 * properties that matter, one control. No critic network anywhere: that is
 * what made RL at this scale affordable, and the copy says so against PPO.
 *
 * Step 2 is the training scrubber over R1-Zero (curves.deepseekTraining),
 * both variables on a dual y-axis: AIME pass@1 (left, 15.6 → 71.0) and
 * average response length (right, ~1k → ~9k tokens). Neither curve is a
 * schedule — no term in the reward mentions length (the chart says so in an
 * annotation); the model buys itself thinking time because re-checking pays.
 * Below the chart, the trace is shown as a SHAPE, not text: a skeleton of
 * forward steps early and mid, and past the aha step an interrupt node with
 * a loop back to the trace's own first line and a second, re-deriving pass.
 * The skeleton is the abstraction of the paper's Table-3 trace — structure
 * only, nothing quoted — and it is what the right axis's extra tokens are
 * made of. The paper places the behaviour at "an intermediate version", so
 * where the aha lands on the slider is an illustrative placement — said
 * under the skeleton and again in the footer.
 *
 * Step 3 is the give-away, reframed as its actual thesis: reasoning
 * transfers as data. ~800K traces, plain SFT, no RL and no reward — page
 * 12's recipe with a stronger teacher — and six dense models inherit the
 * behaviour (curves.deepseekDistill, Table 5), drawn as a horizontal dot
 * plot: score on the x axis, one row per model ordered by size (teacher at
 * the bottom), closed models as vertical dashed rules because they publish
 * scores but not sizes. Reading down the rows the dots march right through
 * the closed rules, and Llama-70B left of Qwen-32B is a visible kink. Where
 * a dot lands right of a rule, page 11's law has been compressed into
 * weights anyone can download. R1's own scoreboard is
 * deliberately NOT tabled here — one number places the teacher, the rest is
 * deferred to page 15, which is the page's closing handoff: two pages of
 * frontier claims all arrived as benchmark scores, read at face value so
 * far; whether they should be is The Scoreboard's job.
 *
 * Footer keeps the deck-wide two-label provenance pattern: Simulated (the
 * interpolated curve, the schematic skeleton, the illustrative aha
 * placement) and Cited (every number pinned to DeepSeek-AI 2025).
 */

import { useState } from "react";
import { scaleLinear } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 14;
const MAX_STEP = 8000;
/** Skeleton staging thresholds on the scrubber (illustrative placement — see
    the provenance line under the skeleton). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

/** Page 14's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2 } as const;

/** Page 1's multiplication. Sample 1 always gets it right; the other three
    slots have fixed wrong answers so the dial is deterministic. */
const RIGHT_ANSWER = "408";
const OTHER_WRONGS = ["398", "428", "308"];

/** The GRPO recipe as five annotated lines — the honest abstraction of the
    objective (advantage from the group's own statistics), minus the clipped
    surrogate machinery. */
const PSEUDO: { code: string; note?: string }[] = [
  { code: "for each problem q:" },
  { code: "  sample G answers from the current policy" },
  { code: "  rᵢ ← 1 if answerᵢ is right, else 0", note: "the reward is a program, not a second model" },
  { code: "  Aᵢ ← (rᵢ − mean(r)) / std(r)", note: "the group is its own baseline: no critic network" },
  { code: "  push toward answers with Aᵢ > 0, away from Aᵢ < 0", note: "plus a leash (KL) back to the reference model" },
];

type Stage = "early" | "mid" | "aha";

const STAGE_CHIP: Record<Stage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};
const STAGE_NOTE: Record<Stage, string> = {
  early: "A few steps forward, an answer, stop. Nothing looks back.",
  mid: "Longer now, more algebra per attempt, but still strictly forward: whatever was written first, stands.",
  aha: "The trace interrupts itself, loops back to its own first line, and re-derives. Nobody wrote that in: re-checking finds more right answers, and right answers are all the reward pays. The extra tokens on the right axis are these loops.",
};

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
  { size: 14, label: "Qwen-14B", family: "qwen", note: "beats QwQ-32B-Preview, the leading open reasoning model when R1 shipped, at less than half its size" },
  { size: 32, label: "Qwen-32B", family: "qwen", note: "within seven points of the 671B teacher" },
  { size: 70, label: "Llama-70B", family: "llama", note: "bigger is not automatically better: the 32B Qwen edges it" },
];

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/**
 * The push, drawn: an arrow whose length scales with the advantage's
 * magnitude, up in the correct hue or down in the wrong hue, from a shared
 * baseline. Zero renders as a flat dash — no push at all. The number next to
 * it stays the accessible value; this is aria-hidden.
 */
function PushArrow({ adv }: { adv: number }) {
  const len = Math.abs(adv) * 19;
  const mid = 20;
  const tipY = adv > 0 ? mid - len : mid + len;
  const dir = adv > 0 ? -1 : 1;
  return (
    <svg aria-hidden="true" width={14} height={40} viewBox="0 0 14 40" className="shrink-0">
      {adv === 0 ? (
        <line x1={3} x2={11} y1={mid} y2={mid} className="stroke-ink-muted" strokeWidth={1.5} />
      ) : (
        <g className={adv > 0 ? "stroke-correct fill-correct" : "stroke-wrong fill-wrong"}>
          <line x1={7} x2={7} y1={mid} y2={tipY - dir * 3} strokeWidth={2} />
          <polygon
            points={`7,${tipY} ${7 - 3.5},${tipY - dir * 5} ${7 + 3.5},${tipY - dir * 5}`}
            stroke="none"
          />
        </g>
      )}
    </svg>
  );
}

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
 * The section-2 chart: BOTH of the section's variables against training step.
 * Accuracy (left axis, correct hue) saturates while average response length
 * (right axis, compute hue) keeps climbing — that divergence is the argument,
 * so both series live on one plot, and an annotation under the length curve
 * states the fact the divergence rests on: no term in the reward mentions
 * length. A dashed rule marks the (illustrative) aha step so the chart and
 * the skeleton below are visibly the same moment.
 */
function TrainingChart({ step, pass, length }: { step: number; pass: number; length: number }) {
  const training = curves.deepseekTraining;
  const { lengthStart, lengthEnd } = training.fit!.params;

  const width = 720;
  const height = 320;
  const margin = { ...CHART_MARGIN, right: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const x = scaleLinear().domain([0, MAX_STEP]).range([0, innerW]);
  const yAcc = scaleLinear().domain([0, 90]).range([innerH, 0]);
  const yLen = scaleLinear().domain([0, 10000]).range([innerH, 0]);

  const lengthAt = (s: number) => lengthStart + (lengthEnd - lengthStart) * (s / MAX_STEP);
  const accPath = training.points.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yAcc(p.y)}`).join("");
  const lenPath = training.points
    .map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yLen(lengthAt(p.x))}`)
    .join("");

  const title = `R1-Zero across RL training, two y axes. Left axis, AIME 2024 pass at 1: from 15.6 percent at step 0 to 71.0 percent at step ${MAX_STEP}, flattening late. Right axis, average response length: from about ${lengthStart.toLocaleString()} to about ${lengthEnd.toLocaleString()} tokens, still climbing after accuracy flattens; an annotation notes that no term in the reward mentions length. A dashed rule at step ${AHA_STEP.toLocaleString()} marks where the aha trace appears (illustrative placement). Marker at step ${step.toLocaleString()}: ${pass.toFixed(1)} percent, about ${length.toLocaleString()} tokens.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="RL training step">
      {/* gridlines + left (accuracy) ticks */}
      {[0, 20, 40, 60, 80].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={yAcc(t)} y2={yAcc(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={yAcc(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {/* right (length) ticks, in the length line's hue */}
      {[0, 5000, 10000].map((t) => (
        <text
          key={`r${t}`}
          x={innerW + 6}
          y={yLen(t)}
          dy="0.32em"
          textAnchor="start"
          className="fill-compute text-[10px]"
        >
          {t === 0 ? "0" : `${t / 1000}k`}
        </text>
      ))}
      {[0, 2000, 4000, 6000, 8000].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t === 0 ? "0" : `${t / 1000}k`}
        </text>
      ))}

      {/* axis titles, color-bound to their series */}
      <text
        transform={`translate(-32,${innerH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-correct text-xs"
      >
        pass@1 (%)
      </text>
      <text
        transform={`translate(${innerW + 36},${innerH / 2}) rotate(90)`}
        textAnchor="middle"
        className="fill-compute text-xs"
      >
        avg response (tokens)
      </text>

      {/* the aha step: the chart's moment is the skeleton's moment */}
      <line
        x1={x(AHA_STEP)}
        x2={x(AHA_STEP)}
        y1={0}
        y2={innerH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={x(AHA_STEP) + 4} y={12} textAnchor="start" className="fill-ink-muted text-[10px]">
        the aha appears
      </text>

      <path d={lenPath} fill="none" className="stroke-compute" strokeWidth={2.5} />
      <path d={accPath} fill="none" className="stroke-correct" strokeWidth={2.5} />

      {/* the fact the divergence rests on, said in the length line's hue */}
      <text
        x={innerW * 0.4}
        y={innerH - 12}
        textAnchor="middle"
        className="fill-compute text-[10px]"
      >
        no term in the reward mentions length
      </text>

      {/* legend, top-left (the curves start bottom-left) */}
      <rect x={8} y={8} width={10} height={3} className="fill-correct" />
      <text x={22} y={12} className="fill-ink text-[10px]">AIME pass@1 · left axis</text>
      <rect x={8} y={22} width={10} height={3} className="fill-compute" />
      <text x={22} y={26} className="fill-ink text-[10px]">avg response length · right axis</text>

      {/* the slider's marker, dotted onto both series */}
      <line
        x1={x(step)}
        x2={x(step)}
        y1={0}
        y2={innerH}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle cx={x(step)} cy={yLen(length)} r={5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
      <circle cx={x(step)} cy={yAcc(pass)} r={5} className="fill-correct stroke-canvas" strokeWidth={1.5} />
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
            className={`text-[9px] ${answerCorrect ? "fill-correct" : "fill-ink-muted"}`}
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
 * an interrupt node and a loop back to the trace's own first line, then a
 * second, re-deriving pass. This is the abstraction of the paper's Table-3
 * trace — the structure it exhibits, not the words it uses.
 */
function TraceSkeleton({ stage }: { stage: Stage }) {
  const label =
    stage === "early"
      ? "Trace skeleton, early in training: three steps forward, then an answer. Nothing looks back. Schematic, structure only, no text."
      : stage === "mid"
        ? "Trace skeleton, mid training: six steps forward, then an answer. Longer, still strictly forward. Schematic, structure only, no text."
        : "Trace skeleton after the aha: four steps forward, then the trace interrupts itself and loops back to its own first line; a second pass of five dashed steps re-derives the solution and ends in an answer. Schematic, structure only, no text.";

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

      <text x={8} y={14} className="fill-ink-muted text-[9px] uppercase tracking-wide">
        {stage === "aha" ? "first pass" : "one pass"}
      </text>

      {stage === "early" ? <SkeletonRow y={22} count={3} answer /> : null}
      {stage === "mid" ? <SkeletonRow y={22} count={6} answer /> : null}

      {stage === "aha" ? (
        <g>
          {/* first pass: four steps, then the interrupt */}
          <SkeletonRow y={22} count={4} />
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
          <text x={skX(4) + 32} y={30} dy="0.32em" textAnchor="middle" className="fill-correct text-[9px] font-semibold">
            interrupt
          </text>

          {/* the loop: back to the trace's own first line */}
          <path
            d={`M ${skX(4) + 32} 42 C ${skX(4) + 32} 76, 30 54, 30 90`}
            fill="none"
            className="stroke-correct"
            strokeWidth={1.5}
            markerEnd="url(#skel-loop)"
          />
          <text x={160} y={82} textAnchor="middle" className="fill-correct text-[9px]">
            back to line 1
          </text>

          {/* second pass: re-derivation, ending in the answer */}
          <SkeletonRow y={96} count={5} dashed answer answerCorrect />
          <text x={8} y={130} className="fill-ink-muted text-[9px] uppercase tracking-wide">
            second pass
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/**
 * The section-3 chart, reframed for the section's thesis. Score is the axis;
 * size is just row order. One row per distilled model (smallest at the top),
 * the 671B teacher as the bottom row, and the closed models as vertical
 * dashed rules — they have scores but no disclosed sizes, so rules, not
 * rows. Reading down the rows, the dots march right through the closed
 * models' rules as size grows; Llama-70B sitting left of Qwen-32B is a
 * visible kink. Clicking a row (or a chip below) picks it.
 */
function DistillDotPlot({ picked, onPick }: { picked: number; onPick: (size: number) => void }) {
  const distill = curves.deepseekDistill;
  const P = distill.fit!.params;
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
  ).join(", ")}, and the R1 teacher, a ${P.teacherParamsB}B mixture-of-experts, at ${P.r1Aime} percent. Dashed vertical rules mark closed models with undisclosed sizes: GPT-4o at ${P.gpt4oAime} percent and OpenAI o1-mini at ${P.o1miniAime} percent; a dotted rule marks the teacher's score. Reading down the rows, the dots move right past the closed-model rules; Llama-70B sits left of Qwen-32B. ${DISTILLS.find((d) => d.size === picked)?.label} is selected.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="AIME 2024 pass@1 (%)">
      {/* vertical gridlines + x ticks */}
      {[0, 20, 40, 60, 80].map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={0.5} />
          <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* closed models: rules, not rows — their sizes are undisclosed */}
      {[
        { label: "GPT-4o", v: P.gpt4oAime, anchor: "start" as const, dx: 4 },
        { label: "o1-mini", v: P.o1miniAime, anchor: "end" as const, dx: -4 },
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
          <text
            x={x(r.v) + r.dx}
            y={-8}
            textAnchor={r.anchor}
            className="fill-ink-muted text-[10px]"
          >
            {r.label} · {r.v}%
          </text>
        </g>
      ))}

      {/* the teacher's score, ruled so "within seven points" is visible */}
      <line
        x1={x(P.r1Aime)}
        x2={x(P.r1Aime)}
        y1={0}
        y2={innerH}
        className="stroke-correct"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <text x={x(P.r1Aime) - 4} y={-8} textAnchor="end" className="fill-correct text-[10px]">
        R1 teacher · {P.r1Aime}%
      </text>

      {/* the six distills, one row each */}
      {DISTILLS.map((d, i) => {
        const py = rowY(i);
        const px = x(aimeOf(d.size));
        const active = d.size === picked;
        return (
          <g key={d.size} onClick={() => onPick(d.size)} className="cursor-pointer" aria-hidden="true">
            <rect x={-margin.left} y={py - rowH / 2} width={margin.left + innerW} height={rowH} fill="transparent" />
            <line x1={0} x2={innerW} y1={py} y2={py} className="stroke-grid" strokeWidth={0.5} />
            <text
              x={-8}
              y={py}
              dy="0.32em"
              textAnchor="end"
              className={`text-[10px] ${active ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {d.label}
            </text>
            {active ? <circle cx={px} cy={py} r={9} fill="none" className="stroke-ink" strokeWidth={1.5} /> : null}
            {d.family === "llama" ? (
              <rect
                x={px - 4}
                y={py - 4}
                width={8}
                height={8}
                transform={`rotate(45 ${px} ${py})`}
                className="fill-wrong stroke-canvas"
                strokeWidth={1.5}
              />
            ) : (
              <circle cx={px} cy={py} r={4.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
            )}
            {active ? (
              <text x={px + 13} y={py} dy="0.32em" textAnchor="start" className="fill-ink text-[10px] font-semibold">
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
          R1 teacher · {P.teacherParamsB}B
        </text>
        <circle cx={x(P.r1Aime)} cy={rowY(rows - 1)} r={6} className="fill-correct stroke-canvas" strokeWidth={1.5} />
      </g>
    </ChartFrame>
  );
}

export function Page14() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const training = curves.deepseekTraining;
  const distill = curves.deepseekDistill;
  const { cons64, lengthStart, lengthEnd } = training.fit!.params;
  const P = distill.fit!.params;

  const [step, setStep] = useState(0);
  const [pickedSize, setPickedSize] = useState(14);
  /* — step 1: how many of the OTHER three samples also get 408 — */
  const [luck, setLuck] = useState(1);

  const rewards: number[] = [1, ...OTHER_WRONGS.map((_, i) => (i < luck ? 1 : 0))];
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const uniform = luck === 3;
  const push1 = 1 - mean;
  const fmtPush = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
  const setLuckAnd = (v: number) => {
    setLuck(v);
    recordInteraction(PAGE_N);
  };
  const LUCK_READ: Record<number, string> = {
    0: `Sample 1 is the only right answer in the group: the biggest push on offer (+${push1.toFixed(2)}).`,
    1: `Same right answer, luckier group: sample 1's push drops to +${push1.toFixed(2)}.`,
    2: `Luckier still: +${push1.toFixed(2)}. Now watch sample 4: a wrong answer in a mostly-right group is punished hardest (−${mean.toFixed(2)}). Rarity amplifies the signal in both directions.`,
    3: "",
  };

  /* — step 2: the scrubber — */
  const pass = interpolate(training, step);
  const length = Math.round(lengthStart + (lengthEnd - lengthStart) * (step / MAX_STEP));
  const stage: Stage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";

  /* — step 3: the distills — */
  const picked = DISTILLS.find((d) => d.size === pickedSize)!;
  const paramRatio = Math.round(P.teacherParamsB / picked.size);
  const pick = (size: number) => {
    setPickedSize(size);
    recordInteraction(PAGE_N);
  };

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        o1 proved RL-trained reasoning works, and kept both the recipe and the chain hidden. In
        January 2025 DeepSeek published everything o1 withheld: the weights, the training curve,
        and the chain itself, visible token by token, trained with{" "}
        <strong className="text-ink">no worked examples at all</strong>. For the first time anyone
        could watch reasoning emerge rather than take a lab&apos;s word for it. So:{" "}
        <strong className="text-ink">where does the backtracking come from?</strong>
        <Cite n={REF.r1} />
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the recipe */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. The recipe: the group grades itself
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              GRPO · rule-based reward · no worked examples
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              <strong>R1-Zero</strong> deletes the usual supervised warm-up entirely and starts RL
              from a plain base model. The whole recipe,{" "}
              <strong>Group Relative Policy Optimization</strong>, fits in five lines:
              <Cite n={REF.grpo} />
            </p>

            <div className="flex flex-col gap-1 rounded-lg border border-dashed border-grid bg-surface-raised p-3 font-mono text-sm">
              {PSEUDO.map((line, i) => (
                <div key={i} className="flex flex-wrap items-baseline gap-x-3">
                  <code className="whitespace-pre text-ink">{line.code}</code>
                  {line.note ? (
                    <span className="text-xs text-compute">{`# ${line.note}`}</span>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="text-ink">
              PPO, the standard alternative, learns its baseline from a second &ldquo;critic&rdquo;
              network about as large as the policy itself. GRPO reads the baseline off the
              group&apos;s own statistics instead. At 671B parameters, deleting the critic is not
              an implementation detail: <strong>it is what made RL at this scale affordable</strong>.
            </p>

            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <p className="text-sm text-ink">
                <span className="font-mono text-ink-muted">problem → </span>
                <span className="font-mono font-semibold text-ink">17 × 24 = ?</span>
                <span className="ml-2 text-xs text-ink-muted">
                  the rule checks one thing: does the answer equal 408?
                </span>
              </p>
              <p className="text-sm font-semibold text-ink">
                Sample 1 always answers 408. Drag the dial: the group&apos;s luck changes, sample
                1&apos;s answer never does.
              </p>
              <Slider
                label="of the other three samples, how many are also right"
                min={0}
                max={3}
                step={1}
                ticks={[0, 1, 2, 3]}
                value={luck}
                onChange={setLuckAnd}
              />
              <div className="grid gap-2 sm:grid-cols-4" role="group" aria-label="Four sampled answers">
                {rewards.map((r, i) => {
                  const right = r === 1;
                  const adv = r - mean;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1 rounded-lg border-l-4 p-2 text-sm ${
                        right ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"
                      } ${i === 0 ? "ring-2 ring-compute" : ""}`}
                    >
                      <span className="text-xs text-ink-muted">
                        sample {i + 1}
                        {i === 0 ? <span className="ml-1 font-semibold text-compute">watch this one</span> : null}
                      </span>
                      <span className="font-mono font-semibold text-ink">
                        {right ? RIGHT_ANSWER : OTHER_WRONGS[i - 1]}
                      </span>
                      <span className={right ? "text-xs text-correct" : "text-xs text-wrong"}>
                        {right ? "✓ reward 1" : "✗ reward 0"}
                      </span>
                      <span className="flex items-center gap-1">
                        <PushArrow adv={adv} />
                        <span
                          className={`font-mono text-xs font-semibold ${
                            adv > 0 ? "text-correct" : adv < 0 ? "text-wrong" : "text-ink-muted"
                          }`}
                        >
                          {fmtPush(adv)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-ink-muted">
                group average: <span className="font-mono text-ink">{mean.toFixed(2)}</span> · each
                sample&apos;s push is its reward minus that average (GRPO then divides by the
                group&apos;s spread)
              </p>
              {uniform ? (
                <p className="rounded border-l-4 border-compute bg-surface p-2 text-sm text-ink">
                  The limit of that trend: everyone scored the same, so every push is{" "}
                  <span className="font-mono">0.00</span> — a problem the model already aces, or
                  is hopeless on, teaches it nothing. Learning lives where the group disagrees.
                </p>
              ) : (
                <p className="text-sm text-ink">{LUCK_READ[luck]}</p>
              )}
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1} href="https://arxiv.org/abs/2501.12948">
            DeepSeek-AI 2025, <em>DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
            Reinforcement Learning</em>.
          </RefItem>
          <RefItem n={REF.grpo} href="https://arxiv.org/abs/2402.03300">
            Shao et al. 2024, <em>DeepSeekMath</em> (GRPO).
          </RefItem>
        </Note>

        {/* Step 2 — the scrubber */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Scrub through R1-Zero&apos;s training
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              AIME 2024 · pass@1 · DeepSeek-AI 2025
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              Nothing in the recipe mentions reflection, and nothing in the reward mentions length.
              Watch both curves anyway: accuracy climbs and flattens while average response length
              grows to nine times its starting point. Length is not a schedule anyone set — longer,
              re-checking traces win more reward, so the model{" "}
              <strong>buys itself more thinking time</strong>. The skeleton below shows what the
              extra tokens are made of.
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
                  recordInteraction(PAGE_N);
                }}
              />
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="font-mono text-5xl font-bold tabular-nums text-correct">
                    {pass.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-muted">AIME 2024 pass@1</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold tabular-nums text-compute">
                    ≈{length.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-muted">avg response tokens</p>
                </div>
                <p className="min-w-[16rem] flex-1 text-sm text-ink-muted">
                  From 15.6% to 71.0% pass@1 with no supervised examples. Add page 7&apos;s
                  majority vote across 64 samples and it reaches{" "}
                  <strong className="text-ink">{cons64}%</strong> — level with OpenAI-o1-0912.
                  <Cite n={REF.r1} />
                </p>
              </div>
              <TrainingChart step={step} pass={pass} length={length} />
            </div>

            {/* the trace, as a shape */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  the trace, as a shape · {STAGE_CHIP[stage]}
                </p>
                <p className="font-mono text-xs tabular-nums text-compute">
                  ≈{length.toLocaleString()} tokens
                </p>
              </div>
              <TraceSkeleton stage={stage} />
              <p className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
                {STAGE_NOTE[stage]}
              </p>
            </div>
            <p className="text-xs text-ink-muted">
              the skeleton abstracts the trace in Table 3 of DeepSeek-AI 2025, where R1-Zero
              interrupts a solution mid-stream, flags the moment, and restarts from its own first
              line at &ldquo;an intermediate version&rdquo; of training — the structure is
              theirs, no text is quoted, and where the aha lands on the slider and the chart is an
              illustrative placement: the paper gives the behaviour, not a step number
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Drag past step {AHA_STEP.toLocaleString()}.</p>
        </Note>

        {/* Step 3 — the give-away */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Then it was given away
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Table 5 · ~800K samples · MIT license
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-grid bg-surface p-4">
            <p className="text-ink">
              The released <strong>R1</strong> adds a small &ldquo;cold start&rdquo; of curated
              long traces before the RL — same recipe, better manners, {P.r1Aime}% on AIME 2024.
              The rest of its scoreboard can wait one page. The give-away is the part no closed lab
              had done: the weights, and <strong>the reasoning itself</strong>. R1 wrote{" "}
              <strong>~{P.samplesK}K traces</strong>, and six small dense models (Qwen and Llama
              bases, 1.5B–70B) were fine-tuned on them.
              <Cite n={REF.r1} /> No RL, no reward, no critic — page 12&apos;s recipe with a
              stronger teacher. So the claim to check on the chart is not &ldquo;R1 is
              good&rdquo;; it is that <strong>reasoning transfers as data</strong>. Pick a size:
            </p>

            <figure className="m-0 flex flex-col gap-2">
              <DistillDotPlot picked={pickedSize} onPick={pick} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <Key shape="circle" className="bg-compute" label="Qwen base" />
                <Key shape="diamond" className="bg-wrong" label="Llama base" />
                <Key shape="circle" className="bg-correct" label="R1 teacher (671B MoE)" />
                <Key shape="dash" className="border-ink-muted" label="closed model (size undisclosed)" />
              </div>
              <figcaption className="text-xs text-ink-muted">
                rows are ordered by size, smallest at the top; the teacher&apos;s{" "}
                {P.teacherParamsB}B is a mixture-of-experts total that activates ~
                {P.teacherActiveB}B per token · GPT-4o and o1-mini publish scores but not sizes,
                so they are rules, not rows
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
                    onClick={() => pick(d.size)}
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
              <span className="text-ink-muted">· ~{paramRatio}× smaller than its teacher —</span>{" "}
              {picked.note}.
            </p>

            <p className="text-sm text-ink-muted">
              Where a dot lands right of a dashed rule, a model you can download beats a closed
              frontier product — by thinking longer at answer time: page 11&apos;s law, compressed
              into weights.
            </p>

            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Two pages of frontier claims, and every one of them arrived as a benchmark score:
              71.0% on AIME, level with o1-0912, a 14B crossing o1-mini&apos;s line. So far those
              numbers have been read at face value.{" "}
              <em className="text-ink-muted">Whether you should is the next page.</em>
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1} href="https://arxiv.org/abs/2501.12948">
            DeepSeek-AI 2025, Tables 4–5. Distilled weights released under the MIT license.
          </RefItem>
        </Note>
      </div>


      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Simulated</strong> — the training curve&apos;s intermediate
          points are interpolated along the reported 15.6% → 71.0% climb; the trace skeleton is a
          schematic of the Table 3 trace&apos;s structure, not its text; and where the aha lands
          on the slider is an illustrative placement — the paper gives the behaviour, not a step
          number.
        </p>
        <p>
          <strong className="text-ink">Cited</strong> — every benchmark number is transcribed from
          DeepSeek-AI 2025 (Tables 3–5, Fig. 2–3) and pinned in the test suite.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
