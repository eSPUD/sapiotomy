"use client";

/**
 * Page 14, "Frontier Reasoners II: DeepSeek-R1, GRPO, and the 'Aha Moment'" —
 * the open-weight answer to the closed frontier. o1 proved RL-trained reasoning
 * works and hid how; in January 2025 DeepSeek published the recipe, the
 * training curve, and the weights (MIT license). The page's one idea: reward
 * ONLY verifiable right answers and the pausing / second-guessing /
 * self-correcting emerges on its own — nobody writes it in.
 *
 * Step 1 is the recipe, GRPO, shown as the thing it actually is: the group of
 * sampled answers IS the baseline. Four sampled answers to page 1's 17 × 24, a
 * rule-based checker (= 408?), and each answer pushed by (its reward − the
 * group mean). Clicking a slot resamples it — the cue sits ABOVE the widget so
 * the page's only step-1 interaction is actually found — and the reader can
 * feel the two properties that matter: the same right answer earns a smaller
 * push in a luckier group, and a uniform group teaches nothing. No critic
 * network anywhere — that is what made RL at this scale affordable.
 *
 * Step 2 is the training scrubber over R1-Zero (curves.deepseekTraining). The
 * chart plots BOTH of the section's variables against training step on a dual
 * y-axis: AIME pass@1 (left, 15.6 → 71.0) and average response length (right,
 * ~1k → ~9k tokens). The divergence IS the argument — accuracy saturates while
 * length keeps climbing; the model spends more to buy less and chooses to
 * anyway. A dashed rule at the aha step ties the chart to the scratchpad
 * below, which stages the paper's Table-3 trace: early = square once and stop;
 * mid = longer but strictly forward; past the aha step the verbatim "Wait,
 * wait. Wait." interruption appears and a gutter arrow draws the loop — the
 * trace visibly returns to its own first line. The paper places that trace
 * only at "an intermediate version", so its position here is an illustrative
 * placement — said under the trace and again in the footer.
 *
 * Step 3 is the give-away: full R1's headline numbers (cold start + more RL),
 * then the six distilled dense models (curves.deepseekDistill, Table 5) as a
 * scatter of AIME pass@1 against parameters (log x). The scatter draws what
 * the section promises: the ~48× gap between Qwen-14B and the 671B teacher as
 * a horizontal span (page 11's annotation grammar), Qwen-32B beating Llama-70B
 * as a visible non-monotonicity, and the distillation frontier as a shape.
 * o1-mini's parameter count is undisclosed, so it is a dashed reference line
 * (page 13's GPT-4o idiom), not a point. Chips below the chart pick a size;
 * the picked point is ringed on the plot.
 *
 * Footer follows the deck-wide two-label provenance pattern: Simulated (the
 * interpolated curve, the illustrative aha placement) and Cited (every number
 * pinned to DeepSeek-AI 2025, the verbatim Table-3 passage).
 */

import { useEffect, useRef, useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import type { Citation } from "@/lib/data";
import { useStore } from "@/store/useStore";

const PAGE_N = 14;
const MAX_STEP = 8000;
/** Trace staging thresholds on the scrubber (illustrative placement — see the
    provenance line under the trace). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

/** Page 14's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2 } as const;

const GRPO_CITATION: Citation = {
  ref: "Shao et al. 2024",
  url: "https://arxiv.org/abs/2402.03300",
  venue: "arXiv (preprint)",
  preprint: true,
};

/** Page 1's multiplication, sampled four times. Each slot's wrong answer is
    fixed so a resample is deterministic: right ↔ that slot's wrong. */
const RIGHT_ANSWER = "408";
const SLOT_WRONGS = ["398", "428", "308", "388"];

type Stage = "early" | "mid" | "aha";

/* The Table-3 trace, staged. OPEN and MID are the verbatim trace abridged;
   AHA is the famous passage verbatim, ellipses as printed. */
const TRACE_PROBLEM =
  "If a > 1, then the sum of the real solutions of √(a − √(a+x)) = x is equal to …";
const TRACE_OPEN = [
  "To solve the equation √(a − √(a+x)) = x, let's start by squaring both sides …",
  "(√(a − √(a+x)))² = x² ⟹ a − √(a+x) = x²",
];
const TRACE_MID = [
  "Rearrange to isolate the inner square root: √(a+x) = a − x², then square again: a + x = (a − x²)²",
  "Expanding and collecting terms: x⁴ − 2ax² − x + (a² − a) = 0 …",
];
const TRACE_AHA = [
  "Wait, wait. Wait. That's an aha moment I can flag here.",
  "Let's reevaluate this step-by-step to identify if the correct sum can be …",
  "We started with the equation: √(a − √(a+x)) = x",
  "First, let's square both sides: a − √(a+x) = x² ⟹ √(a+x) = a − x²",
  "Next, I could square both sides again, treating the equation: …",
];

const STAGE_CHIP: Record<Stage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};
const STAGE_NOTE: Record<Stage, string> = {
  early: "One pass: square once, write an answer, stop. Nothing looks back.",
  mid: "Longer now — more algebra per attempt — but still strictly forward: whatever was written first, stands.",
  aha: "The trace interrupts itself mid-solution and starts over. Nobody trained that in; correct answers simply pay better, and re-checking finds more of them.",
};

interface Distill {
  size: number;
  label: string;
  family: "qwen" | "llama";
  mathKey: string;
  note: string;
}
const DISTILLS: Distill[] = [
  { size: 1.5, label: "Qwen-1.5B", family: "qwen", mathKey: "math1p5", note: "On AIME it beats GPT-4o-0513 (9.3%) — from a model that fits on a phone." },
  { size: 7, label: "Qwen-7B", family: "qwen", mathKey: "math7", note: "Most of the way to o1-mini (63.6%), at laptop scale." },
  { size: 8, label: "Llama-8B", family: "llama", mathKey: "math8", note: "A Llama base instead of Qwen: the same 800K traces teach a different family." },
  { size: 14, label: "Qwen-14B", family: "qwen", mathKey: "math14", note: "Beats QwQ-32B-Preview (50.0%) — the leading open reasoning model when R1 shipped — at less than half the size." },
  { size: 32, label: "Qwen-32B", family: "qwen", mathKey: "math32", note: "Within ~7 points of the 671B teacher." },
  { size: 70, label: "Llama-70B", family: "llama", mathKey: "math70", note: "Bigger is not automatically better: the 32B Qwen edges it on AIME." },
];

/** Per-point label offsets on the scatter, tuned against the log-x layout. */
const SCATTER_LABEL: Record<number, { dx: number; dy: number; anchor: "start" | "end" | "middle" }> = {
  1.5: { dx: 8, dy: 4, anchor: "start" },
  7: { dx: -8, dy: 4, anchor: "end" },
  8: { dx: 8, dy: 12, anchor: "start" },
  14: { dx: -8, dy: 4, anchor: "end" },
  32: { dx: 0, dy: -10, anchor: "middle" },
  70: { dx: 0, dy: -8, anchor: "middle" },
};

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
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
 * so both series live on one plot. A dashed rule marks the (illustrative) aha
 * step so the chart and the scratchpad are visibly the same moment.
 */
function TrainingChart({ step, pass, length }: { step: number; pass: number; length: number }) {
  const training = curves.deepseekTraining;
  const { lengthStart, lengthEnd } = training.fit!.params;

  const width = 480;
  const height = 300;
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

  const title = `R1-Zero across RL training, two y axes. Left axis, AIME 2024 pass at 1: from 15.6 percent at step 0 to 71.0 percent at step ${MAX_STEP}, flattening late. Right axis, average response length: from about ${lengthStart.toLocaleString()} to about ${lengthEnd.toLocaleString()} tokens, still climbing after accuracy flattens. A dashed rule at step ${AHA_STEP.toLocaleString()} marks where the aha trace appears (illustrative placement). Marker at step ${step.toLocaleString()}: ${pass.toFixed(1)} percent, about ${length.toLocaleString()} tokens.`;

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

      {/* the aha step: the chart's moment is the scratchpad's moment */}
      <line
        x1={x(AHA_STEP)}
        x2={x(AHA_STEP)}
        y1={0}
        y2={innerH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={x(AHA_STEP) + 4} y={12} textAnchor="start" className="fill-ink-muted text-[9px]">
        the aha appears
      </text>

      <path d={lenPath} fill="none" className="stroke-compute" strokeWidth={2.5} />
      <path d={accPath} fill="none" className="stroke-correct" strokeWidth={2.5} />

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

/**
 * The section-3 chart: the accuracy/size trade actually drawn. x = total
 * parameters (log), y = AIME 2024 pass@1; Qwen circles, Llama diamonds (shape
 * as well as colour), the 671B MoE teacher top-right, o1-mini as a dashed
 * reference line (its parameter count is undisclosed, so it has no x), and the
 * ~48× Qwen-14B → teacher gap as a horizontal span annotation.
 */
function DistillScatter({ picked, onPick }: { picked: number; onPick: (size: number) => void }) {
  const distill = curves.deepseekDistill;
  const P = distill.fit!.params;
  const aimeOf = (size: number) => distill.points.find((p) => p.x === size)!.y;

  const width = 560;
  const height = 300;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([1, 1000]).range([0, innerW]);
  const y = scaleLinear().domain([20, 90]).range([innerH, 0]);

  const spanRatio = Math.round(P.teacherParamsB / 14);
  const spanY = y(87);

  const title = `AIME 2024 pass at 1 against total parameters, log x axis. Distilled models: ${DISTILLS.map(
    (d) => `${d.label} ${aimeOf(d.size)} percent`,
  ).join(", ")}. The R1 teacher, a ${P.teacherParamsB}B mixture-of-experts, sits at ${P.r1Aime} percent; a dashed reference line marks OpenAI o1-mini at ${P.o1miniAime} percent (parameter count undisclosed). A span annotation marks the roughly ${spanRatio} times parameter gap between Qwen-14B and the teacher. ${DISTILLS.find((d) => d.size === picked)?.label} is selected.`;

  return (
    <ChartFrame title={title} width={width} height={height} xLabel="total parameters (B, log scale)" yLabel="AIME 2024 pass@1 (%)">
      {[20, 40, 60, 80].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[1, 10, 100, 1000].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      {/* o1-mini: a reference line, page-13 style — its size is undisclosed */}
      <line
        x1={0}
        x2={innerW}
        y1={y(P.o1miniAime)}
        y2={y(P.o1miniAime)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW - 4} y={y(P.o1miniAime) - 5} textAnchor="end" className="fill-ink-muted text-[10px]">
        OpenAI o1-mini · {P.o1miniAime}% (size undisclosed)
      </text>

      {/* the ~48× gap, drawn as a horizontal span (page 11's annotation grammar) */}
      <line x1={x(14)} x2={x(P.teacherParamsB)} y1={spanY} y2={spanY} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={x(14)} x2={x(14)} y1={spanY} y2={y(aimeOf(14)) - 7} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="2 2" />
      <line x1={x(P.teacherParamsB)} x2={x(P.teacherParamsB)} y1={spanY} y2={y(P.r1Aime) - 9} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="2 2" />
      <text
        x={(x(14) + x(P.teacherParamsB)) / 2}
        y={spanY - 5}
        textAnchor="middle"
        className="fill-ink text-[10px] font-semibold"
      >
        ~{spanRatio}× the parameters
      </text>

      {/* the teacher */}
      <g aria-hidden="true">
        <circle cx={x(P.teacherParamsB)} cy={y(P.r1Aime)} r={6} className="fill-correct stroke-canvas" strokeWidth={1.5} />
        <text x={x(P.teacherParamsB) - 10} y={y(P.r1Aime) + 4} textAnchor="end" className="fill-ink text-[9px] font-semibold">
          R1 teacher · {P.teacherParamsB}B MoE
        </text>
      </g>

      {/* the six distills; the picked one is ringed */}
      {DISTILLS.map((d) => {
        const px = x(d.size);
        const py = y(aimeOf(d.size));
        const lab = SCATTER_LABEL[d.size];
        const active = d.size === picked;
        return (
          <g key={d.size} onClick={() => onPick(d.size)} className="cursor-pointer" aria-hidden="true">
            {active ? <circle cx={px} cy={py} r={8.5} fill="none" className="stroke-ink" strokeWidth={1.5} /> : null}
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
            <text
              x={px + lab.dx}
              y={py + lab.dy}
              textAnchor={lab.anchor}
              className={`text-[9px] ${active ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {d.label}
            </text>
          </g>
        );
      })}
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
  const [rightSlots, setRightSlots] = useState([true, false, false, true]);

  /* — step 1: the group is the baseline — */
  const rewards: number[] = rightSlots.map((c) => (c ? 1 : 0));
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const uniform = rewards.every((r) => r === rewards[0]);
  const resample = (i: number) => {
    setRightSlots((prev) => prev.map((c, k) => (k === i ? !c : c)));
    recordInteraction(PAGE_N);
  };

  /* — step 2: the scrubber — */
  const pass = interpolate(training, step);
  const length = Math.round(lengthStart + (lengthEnd - lengthStart) * (step / MAX_STEP));
  const stage: Stage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";

  /* The gutter arrow beside the trace: measured from the rendered lines so the
     loop connects the aha interruption back to the trace's own first line. */
  const firstLineRef = useRef<HTMLLIElement>(null);
  const ahaLineRef = useRef<HTMLLIElement>(null);
  const [loop, setLoop] = useState<{ from: number; to: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const first = firstLineRef.current;
      const aha = ahaLineRef.current;
      if (stage !== "aha" || !first || !aha) {
        setLoop(null);
        return;
      }
      const from = aha.offsetTop + aha.offsetHeight / 2;
      const to = first.offsetTop + first.offsetHeight / 2;
      setLoop(from - to > 24 ? { from, to } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stage]);

  /* — step 3: the distills — */
  const picked = DISTILLS.find((d) => d.size === pickedSize)!;
  const aimeOf = (size: number) => distill.points.find((p) => p.x === size)!.y;
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
        o1 proved RL-trained reasoning works and kept the recipe. DeepSeek published one in January
        2025 — weights, curve, and <strong className="text-ink">no worked examples at all</strong>:
        so <strong className="text-ink">where does the backtracking come from?</strong>
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
              from a plain base model. The reward is{" "}
              <strong>a program, not a network</strong>: did the final answer match, and is the
              thinking wrapped in the right tags? Sample a <strong>group</strong> of answers to one
              problem, score each with the rule, and push each one up or down by how far it beats{" "}
              <em>the group&apos;s own average</em>. That is{" "}
              <strong>Group Relative Policy Optimization</strong> — the group is the baseline, so
              there is no second &ldquo;critic&rdquo; model to train, which is what makes RL at
              this scale affordable.
              <Cite n={REF.grpo} />
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
                <span aria-hidden="true" className="text-compute">↻ </span>
                Click any answer to resample it — watch every push move.
              </p>
              <div className="grid gap-2 sm:grid-cols-4" role="group" aria-label="Four sampled answers">
                {rightSlots.map((right, i) => {
                  const adv = rewards[i] - mean;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Resample answer ${i + 1}`}
                      onClick={() => resample(i)}
                      className={`flex flex-col items-center gap-1 rounded-lg border-l-4 p-2 text-sm ${
                        right ? "border-correct bg-correct/10" : "border-wrong bg-wrong/10"
                      }`}
                    >
                      <span className="text-xs text-ink-muted">
                        sample {i + 1} <span aria-hidden="true">· ↻</span>
                      </span>
                      <span className="font-mono font-semibold text-ink">
                        {right ? RIGHT_ANSWER : SLOT_WRONGS[i]}
                      </span>
                      <span className={right ? "text-xs text-correct" : "text-xs text-wrong"}>
                        {right ? "✓ reward 1" : "✗ reward 0"}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          adv > 0 ? "text-correct" : adv < 0 ? "text-wrong" : "text-ink-muted"
                        }`}
                      >
                        {adv > 0 ? "+" : ""}
                        {adv.toFixed(2)}
                      </span>
                    </button>
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
                  Every answer scored the same, so every push is{" "}
                  <span className="font-mono">0.00</span>: a problem the model already aces — or is
                  hopeless on — teaches it nothing. Learning lives where the group disagrees.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1}>
            DeepSeek-AI 2025, <em>DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
            Reinforcement Learning</em>.
          </RefItem>
          <RefItem n={REF.grpo}>
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
              Nothing in the setup mentions reflection. Watch what the reward alone buys — and
              notice the two curves diverging: accuracy flattens while <em>thinking length</em>{" "}
              keeps climbing. The model is spending more to buy less, and chooses to anyway — it is
              learning to <strong>allocate itself more thinking time</strong>.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
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
                <div className="flex items-end gap-6">
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
                </div>
                <p className="text-sm text-ink-muted">
                  From 15.6% to 71.0% pass@1 with no supervised examples. Add page 7&apos;s
                  majority vote across 64 samples and it reaches{" "}
                  <strong className="text-ink">{cons64}%</strong> — level with OpenAI-o1-0912.
                  <Cite n={REF.r1} />
                </p>
              </div>
              <TrainingChart step={step} pass={pass} length={length} />
            </div>

            {/* the scratchpad */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                the model&apos;s scratchpad · {STAGE_CHIP[stage]}
              </p>
              <p className="text-sm text-ink-muted">{TRACE_PROBLEM}</p>
              {/* The gutter carries the structure: empty while the trace runs
                  strictly forward, a return arrow once the aha appears. */}
              <ol className="relative flex flex-col gap-1.5 pl-8">
                {loop ? (
                  <svg aria-hidden="true" className="absolute inset-y-0 left-0 w-8">
                    <defs>
                      <marker
                        id="trace-loop-arrowhead"
                        markerWidth="7"
                        markerHeight="7"
                        refX="5"
                        refY="3.5"
                        orient="auto"
                      >
                        <path d="M0,0 L6,3.5 L0,7" fill="none" className="stroke-correct" strokeWidth={1.2} />
                      </marker>
                    </defs>
                    <path
                      d={`M 26 ${loop.from} C 2 ${loop.from - 10}, 2 ${loop.to + 10}, 22 ${loop.to}`}
                      fill="none"
                      className="stroke-correct"
                      strokeWidth={1.5}
                      markerEnd="url(#trace-loop-arrowhead)"
                    />
                  </svg>
                ) : null}
                {TRACE_OPEN.map((line, i) => (
                  <li key={`o${i}`} ref={i === 0 ? firstLineRef : undefined} className="text-sm text-ink">
                    {line}
                  </li>
                ))}
                {stage !== "early"
                  ? TRACE_MID.map((line, i) => (
                      <li key={`m${i}`} className="text-sm text-ink">
                        {line}
                      </li>
                    ))
                  : null}
                {stage === "aha"
                  ? TRACE_AHA.map((line, i) => (
                      <li
                        key={`a${i}`}
                        ref={i === 0 ? ahaLineRef : undefined}
                        className={
                          i === 0
                            ? "rounded border-l-4 border-correct bg-correct/10 p-2 text-sm font-semibold text-ink"
                            : "text-sm text-ink"
                        }
                      >
                        {line}
                        {i === 0 ? (
                          <span className="ml-2 rounded bg-correct/25 px-1.5 py-0.5 text-xs font-semibold text-correct">
                            the aha moment
                          </span>
                        ) : null}
                      </li>
                    ))
                  : null}
              </ol>
              <p className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
                {STAGE_NOTE[stage]}
              </p>
            </div>
            <p className="text-xs text-ink-muted">
              the &ldquo;Wait, wait. Wait.&rdquo; passage is verbatim from Table 3 of DeepSeek-AI
              2025, where R1-Zero produced it unprompted at &ldquo;an intermediate version&rdquo;
              of training; the earlier stages are that same trace abridged, and where the aha lands
              on the slider and the chart is an illustrative placement — the paper gives the
              behaviour, not a step number
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
              long traces before the RL — same recipe, better manners:
            </p>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                { v: `${P.r1Aime}%`, l: "AIME 2024" },
                { v: `${P.r1Math}%`, l: "MATH-500" },
                { v: `${P.r1Gpqa}%`, l: "GPQA Diamond" },
                { v: `${P.r1CfElo}`, l: `Codeforces Elo · ${P.r1CfPct}rd pct` },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="font-mono text-2xl font-bold tabular-nums text-ink">{s.v}</p>
                  <p className="text-xs text-ink-muted">{s.l}</p>
                </div>
              ))}
            </div>

            <p className="text-ink">
              Then the give-away, twice over: the weights, and the reasoning itself. R1 wrote{" "}
              <strong>~{P.samplesK}K reasoning traces</strong>, and six small dense models (Qwen
              and Llama bases, 1.5B–70B) were fine-tuned on them.
              <Cite n={REF.r1} /> No RL, no reward — the small
              models simply <em>imitate the big one&apos;s thinking</em>. Pick a size and read the
              accuracy/cost trade:
            </p>

            <figure className="m-0 flex flex-col gap-2">
              <DistillScatter picked={pickedSize} onPick={pick} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <Key shape="circle" className="bg-compute" label="Qwen base" />
                <Key shape="diamond" className="bg-wrong" label="Llama base" />
                <Key shape="circle" className="bg-correct" label="R1 teacher (671B MoE)" />
                <Key shape="dash" className="border-ink-muted" label="o1-mini reference" />
              </div>
              <figcaption className="text-xs text-ink-muted">
                the parameter axis counts total parameters; the {P.teacherParamsB}B teacher is a
                mixture-of-experts that activates ~{P.teacherActiveB}B per token, so the drawn gap
                overstates its per-token compute · o1-mini&apos;s parameter count is undisclosed,
                so it is a reference line, not a point
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

            <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              <p>
                <strong>R1-Distill-{picked.label}</strong>: AIME{" "}
                <span className="font-mono">{aimeOf(picked.size).toFixed(1)}%</span> · MATH-500{" "}
                <span className="font-mono">{P[picked.mathKey].toFixed(1)}%</span> · ~
                <span className="font-mono">{paramRatio}×</span> fewer parameters than the teacher.
              </p>
              <p className="mt-1 text-ink-muted">{picked.note}</p>
            </div>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.r1}>
            DeepSeek-AI 2025, Tables 4–5. Distilled weights released under the MIT license.
          </RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={distill.citation} />
        <CitationBadge citation={GRPO_CITATION} />
      </div>
      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Simulated</strong> — the training curve&apos;s intermediate
          points are interpolated along the reported 15.6% → 71.0% climb, and where the aha lands
          on the slider is an illustrative placement; the paper gives the behaviour, not a step
          number.
        </p>
        <p>
          <strong className="text-ink">Cited</strong> — every benchmark number is transcribed from
          DeepSeek-AI 2025 (Tables 3–5, Fig. 2–3) and pinned in the test suite. The &ldquo;Wait,
          wait. Wait.&rdquo; passage is verbatim from Table 3.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
