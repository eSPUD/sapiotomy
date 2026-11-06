"use client";

/**
 * Page 5, "Chain of Thought: Reasoning Out Loud". Act 2 opens on page 4's
 * question: can a language model reason through a problem instead of answering
 * on reflex? This page walks the two ways a model comes to write its steps out:
 * shown how in the prompt, or trained to.
 *
 * Rebuilt 2026-10-18 from Shashank's outline (planning/page_5_rework_plan.md and
 * planning/page_5_handoff.md), keeping the old page's prose wherever it still
 * holds: the Act 2 opener, the hardware note, section 1's definition and section
 * 4's argument and close are the author's words, with new numbers.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED. Two runs, each with its own
 * notebook, both greedy at bf16 with a 1,024-token limit, graded on the first
 * \boxed{} with math_verify, and tallied on the same 495 MATH-500 problems (the
 * five example problems are left out of both): `page_5_few_shot.ipynb` (base
 * Qwen2.5 1.5B, 3B, 7B; zero-shot and five-shot) and
 * `page_5_instruct_reasoning.ipynb` (Qwen2.5-Instruct 1.5B, 3B, 7B; reasoning and
 * final answer only). `notebooks/page_05_site_data.py` combines their traces into
 * `web/data/page-05-derived.json`, loaded through `@/lib/page05`, which throws if
 * the file's tallies disagree with each other.
 *
 * Layout: page 6's shell. One reading column of numbered steps, each beside its
 * own margin note that scrolls with it. Every step that carries a figure opens
 * with a sentence saying what the figure is a picture OF: "37.6%" is not a claim,
 * "37.6% of the same 495 problems" is.
 *
 *   Step 1: the definition and figure 1, interactive like the old figure 1 (author,
 *   2026-10-18), and as clean as the old one (author, 2026-11-05): one chat set
 *   like page 2's, a Zero-shot / Few-shot switch, and a quiet stepper over three
 *   test problems (levels 1, 3 and 5: the first test problem at each level in
 *   MATH-500 order, skipping [asy] diagrams, fixed before any results). Play shows
 *   the base Qwen2.5-3B's reply under the chosen prompt, Reset clears it. One
 *   model, the 3B, with no size picker (author, 2026-10-18). Under few-shot the
 *   user's turn shows ONE worked example, the last of the five, inside the same
 *   prompt box as the question and under it, with a line saying there are five,
 *   placed before the problem (author, 2026-11-05): the run is still five-shot.
 *
 *   Step 2: figure 2, zero-shot against few-shot for the three base models. The
 *   figure comes first, then the prose explaining Shashank's sentence: the
 *   examples make the model work out each intermediate result before it answers.
 *
 *   Step 3: figure 3, the instruct models with no examples against the base
 *   models with five. Its opening says what an instruct model is and follows from
 *   step 2 (author, 2026-10-18); the figure's legend gives each side's prompt
 *   length. ANY DISCUSSION OF THE RESULTS STILL WAITS FOR THE AUTHOR (handoff,
 *   section 4).
 *
 *   Step 4: figure 4, the old section 3's chart with the new run's numbers:
 *   each instruct model reasoning and asked for the final answer only. The claim
 *   is the FLAT FLOOR, never scale: no size axis, no line through the points.
 *
 * Load-bearing and easy to lose:
 *   · the notebook download: one zip of the two notebooks, beside the title.
 *   · the conditions are named plainly. Section 4 uses System 1 and System 2,
 *     which page 1 defines; no euphemism ("left alone", "forbidden to reason")
 *     may come back.
 *   · the worked solutions are ours, "written for this experiment, expanding
 *     MATH's own solutions". No sentence may present them as MATH's.
 *   · Wei et al. and Kojima et al. are cited for the TECHNIQUES they introduced.
 *     No cite may carry one of our numbers.
 *   · page 16's ladder still reads the retired page 5 run (`page05HowToReason`),
 *     whose 100 problems are page 6's. Nothing on this page draws from it.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ModelIcon, UserIcon } from "@/components/ChatIcons";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE5,
  gradedText,
  pct,
  textSteps,
  tidyPrompt,
  type ArmStats,
  type Problem,
  type Reply,
} from "@/lib/page05";
import { useStore } from "@/store/useStore";

const PAGE_N = 5;

const N = PAGE5.n;
const BASE = PAGE5.base;
const INSTRUCT = PAGE5.instruct;
const S4 = PAGE5.section4;
const DEC = PAGE5.provenance.decoding;
const BASE_7B = BASE[BASE.length - 1];

/**
 * Percentage points between two accuracies, as the difference of the two
 * percentages the page prints (one decimal each), so the reader's subtraction and
 * the page's agree: 37.6% against 22.8% is 14.8 points.
 */
const pts = (a: number, b: number) => (Math.round(a * 1000) - Math.round(b * 1000)) / 10;
const ptsLabel = (a: number, b: number) => pts(a, b).toFixed(1);

/**
 * The download: one zip of the page's two notebooks, page_5_few_shot.ipynb (base)
 * and page_5_instruct_reasoning.ipynb (instruct). The retired run's bundle, with
 * harness.py and its 900 traces, stays in public/notebooks for
 * build_trace_report.py and notebookBundles.test.ts.
 */
const NOTEBOOK_HREF = "/notebooks/page-05-chain-of-thought.zip";
const NOTEBOOK_SIZE = "14 KB";

/**
 * Numbered in order of first appearance. Wei and Kojima are cited for the
 * techniques they introduced; the dataset and the model card are cited as the
 * instruments the runs were made with. Every number on this page is ours, so no
 * entry may carry a figure.
 */
const REF = { wei: 1, kojima: 2, qwen: 3, math500: 4, qwenReport: 5 } as const;

/**
 * The trigger Kojima et al. published, quoted as they published it, because the
 * marker beside it sends the reader to that paper.
 */
const ZERO_SHOT_COT_TRIGGER = "Let's think step by step.";

/** A margin note that sits beside its step and scrolls with the page. */
function Note({
  kicker,
  flush = false,
  children,
}: {
  kicker: string;
  /** Drop the top padding. That padding clears a step's h2 so the note lines up
   *  with the prose under it; beside the headingless lede it drops a line too low. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside className={`flex flex-col gap-2 text-sm text-ink-muted ${flush ? "" : "lg:pt-9"}`}>
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

const chip = "rounded-full border border-grid px-2 py-0.5 text-ink-muted";

/** A run's vitals, inside the figure card they certify (never in the margin). */
function Ledger({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-1 border-b border-grid pb-3 font-mono text-xs leading-relaxed tabular-nums text-ink-muted">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt>{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ figure 1 */

/** Figure 1's one model (author, 2026-10-18: the base 3B, no size picker). */
const FIG1_MODEL = PAGE5.figure1Model;

/** Figure 1's two prompts, one at a time (author, 2026-11-05). */
type Mode = "zeroShot" | "fewShot";
const MODES: { key: Mode; label: string }[] = [
  { key: "zeroShot", label: "Zero-shot" },
  { key: "fewShot", label: "Few-shot" },
];

/** The prompt switch: a segmented control, one setting on at a time. */
function ModeSwitch({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div role="radiogroup" aria-label="Prompt" className="inline-flex rounded-md border border-grid bg-canvas p-0.5">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={m.key === mode}
          onClick={() => onMode(m.key)}
          className={`rounded px-3 py-1 text-sm font-semibold ${
            m.key === mode ? "bg-compute text-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/** The test problem, one at a time: a quiet "‹ 1 of 3 ›", wrapping round the three. */
function ProblemStepper({ active, onProblem }: { active: number; onProblem: (i: number) => void }) {
  const n = PAGE5.testProblems.length;
  const arrow = "rounded px-1.5 text-ink-muted hover:bg-grid/40 hover:text-ink";
  return (
    <div role="group" aria-label="Test problem" className="flex items-center gap-1 text-xs tabular-nums text-ink-muted">
      <button type="button" aria-label="Previous problem" onClick={() => onProblem((active + n - 1) % n)} className={arrow}>
        ‹
      </button>
      <span aria-live="polite">
        problem {active + 1} of {n} · level {PAGE5.testProblems[active].level}
      </span>
      <button type="button" aria-label="Next problem" onClick={() => onProblem((active + 1) % n)} className={arrow}>
        ›
      </button>
    </div>
  );
}

/**
 * The few-shot prompt's worked examples, shown as one (author, 2026-11-05: "1
 * worked example instead of five"): the last of the five, the one right before
 * the question, written as the notebook wrote it, "Problem:" then "Solution:". Its
 * lead line says there are five, placed before the problem, so the run is still
 * five-shot. The solution is folded to its shape and opens to its steps.
 */
const SHOWN_EXAMPLE = PAGE5.examples[PAGE5.examples.length - 1];

function WorkedExample() {
  const e = SHOWN_EXAMPLE;
  const steps = textSteps(e.solution);
  const rest = PAGE5.examples.length - 1;
  return (
    <div data-testid="worked-example" className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
      <p className="font-sans text-xs text-wrong-ink">
        + one of {rest + 1} worked examples, sent before the problem
      </p>
      <p className="line-clamp-3 whitespace-pre-wrap break-words">
        <span className="text-ink-muted">Problem:</span> {tidyPrompt(e.problem)}
      </p>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5">
          <span className="text-ink-muted">Solution:</span>
          <span className="rounded border border-wrong/60 px-1.5 font-sans text-xs text-wrong-ink">
            {steps.length} worked steps → {tidyPrompt(e.answer)}
          </span>
          <span aria-hidden="true" className="text-ink-muted transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>
        <div className="mt-1.5 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
          <ol className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-1.5 leading-relaxed">
                <span className="shrink-0 text-wrong-ink">{i + 1}</span>
                <span className="min-w-0 whitespace-pre-wrap break-words">{tidyPrompt(s)}</span>
              </li>
            ))}
          </ol>
          <p data-testid="examples-caption" className="font-sans text-xs text-ink-muted">
            One MATH-500 problem per level, with worked solutions written for this experiment, expanding
            MATH&apos;s own solutions.
          </p>
        </div>
      </details>
    </div>
  );
}

/**
 * The user's turn: the prompt in one box, so the worked example is plainly part of
 * it. The test problem comes first and the example under it (author, 2026-11-05),
 * though the notebook put the examples before the problem; the example's lead line
 * says so.
 */
function PromptBox({ mode, active }: { mode: Mode; active: number }) {
  const test = PAGE5.testProblems[active];
  const tokens = mode === "fewShot" ? FEW_PROMPT_ROUNDED : FIG1_MODEL.zeroShot.medianPromptTokens;
  return (
    <div data-testid="prompt" className="flex min-w-0 flex-col gap-3 rounded-lg border border-grid bg-surface px-3 py-2 font-code text-sm text-ink">
      <p className="font-sans text-xs text-ink-muted">
        the prompt · about {tokens.toLocaleString("en-GB")} tokens
      </p>
      {/* Display maths keeps its own line, without the blank lines around it. */}
      <p data-testid="test-problem" className="whitespace-pre-wrap break-words">
        <span className="text-ink-muted">Problem:</span> {tidyPrompt(test.problem).replace(/\n{2,}/g, "\n")}
      </p>
      {mode === "fewShot" ? <WorkedExample /> : null}
    </div>
  );
}

/**
 * Figure 1's chat, set like the old figure 1 and page 2: the user's turn on the
 * right and the model's on the left, each marked by an icon. The user's turn is
 * the prompt in one box, so it is plain the worked example is part of it (author,
 * 2026-11-05). Play shows the whole reply at once, grouped into
 * steps, with its verdict under it; there is no streaming. A long reply scrolls
 * inside its own box so the figure keeps its height.
 */
function Chat({ mode, active, shown }: { mode: Mode; active: number; shown: boolean }) {
  const test = PAGE5.testProblems[active];
  const reply = test.replies[mode];
  const steps = textSteps(gradedText(reply));
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-grid bg-canvas p-3">
      <div className="flex max-w-[95%] items-start gap-2 self-end">
        <PromptBox mode={mode} active={active} />
        <UserIcon />
      </div>

      <div className="flex max-w-[95%] items-start gap-2 self-start">
        <ModelIcon />
        <div data-testid="model-reply" className="flex min-w-0 flex-col gap-2">
          {!shown ? (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <span aria-hidden="true" className="animate-pulse text-compute-ink">
                ▍
              </span>
              press Play to see its reply
            </p>
          ) : (
            <>
              <ol className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2 font-code text-sm leading-relaxed text-ink">
                    {steps.length > 1 ? <span className="shrink-0 text-compute-ink">{i + 1}</span> : null}
                    <span className="min-w-0 whitespace-pre-wrap break-words">{tidyPrompt(s)}</span>
                  </li>
                ))}
              </ol>
              <p
                className={`rounded border-l-4 px-3 py-2 ${
                  reply.correct ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <span className={`font-semibold ${reply.correct ? "text-correct-ink" : "text-wrong-ink"}`}>
                  {reply.correct ? "✓" : "✗"}{" "}
                  {reply.extracted ? `Final answer: ${tidyPrompt(reply.extracted)}.` : "No boxed answer."}
                </span>{" "}
                <span className="font-mono text-xs tabular-nums text-ink-muted">
                  {reply.tokens.toLocaleString("en-GB")} tokens · {steps.length} {steps.length === 1 ? "step" : "steps"}
                  {reply.truncated ? ` · cut off at ${DEC.max_new_tokens.toLocaleString("en-GB")}` : ""}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Figure 1, as clean as the old one (author, 2026-11-05): a switch between the two
 * prompts and a quiet stepper over the three problems on top, one chat, and Play
 * and Reset under it, as before. The model is named in the prose, not here.
 */
function PromptFigure({
  mode,
  active,
  shown,
  onMode,
  onProblem,
  onPlay,
  onReset,
}: {
  mode: Mode;
  active: number;
  shown: boolean;
  onMode: (m: Mode) => void;
  onProblem: (i: number) => void;
  onPlay: () => void;
  onReset: () => void;
}) {
  return (
    <section aria-label="One problem, two prompts" className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ModeSwitch mode={mode} onMode={onMode} />
        <ProblemStepper active={active} onProblem={onProblem} />
      </div>
      <Chat mode={mode} active={active} shown={shown} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPlay}
          disabled={shown}
          className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={!shown}
          className="ml-auto rounded bg-wrong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ↺ Reset
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- figures 2 and 3 */

/** One prompt or model: a dot per size. */
interface DotSeries {
  key: string;
  label: string;
  fill: string;
  stroke: string;
  arms: ArmStats[];
  /** Shown after the label in the legend: figure 3 gives each prompt's length. */
  note?: string;
}

const ROWS_W = 660;
const ROWS_H = 176;
const ROWS_MARGIN = { top: 8, right: 76, bottom: 40, left: 52 };
const ROWS_INNER_W = ROWS_W - ROWS_MARGIN.left - ROWS_MARGIN.right;
const ROWS_INNER_H = ROWS_H - ROWS_MARGIN.top - ROWS_MARGIN.bottom;
const DOT_R = 5.5;

/**
 * Figures 2 and 3 as dot-and-arrow rows (author, 2026-10-18, replacing grouped
 * bars that repeated each other): one row per model size, a dot where it starts
 * (the first series), an arrow to where it ends (the second), the share of the
 * same 495 problems solved at each end, and the gain in points at the right.
 * Sizes are rows, not an axis: three sizes are not a trend.
 */
function ArrowRows({ id, title, series, sizes }: { id: string; title: string; series: [DotSeries, DotSeries]; sizes: string[] }) {
  const x = (accuracy: number) => Math.round(accuracy * ROWS_INNER_W * 100) / 100;
  const rowH = ROWS_INNER_H / sizes.length;
  const [from, to] = series;
  const arrowId = `${id}-arrow`;
  return (
    <ChartFrame
      title={title}
      width={ROWS_W}
      height={ROWS_H}
      margin={ROWS_MARGIN}
      xLabel={`percentage of the same ${N} problems solved`}
    >
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className={to.fill} />
        </marker>
      </defs>
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t / 100)} x2={x(t / 100)} y1={0} y2={ROWS_INNER_H} className="stroke-grid" strokeWidth={1} />
          <text x={x(t / 100)} y={ROWS_INNER_H + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
            {t}
          </text>
        </g>
      ))}
      {sizes.map((size, i) => {
        const y = i * rowH + rowH / 2;
        const a = from.arms[i].accuracy;
        const b = to.arms[i].accuracy;
        return (
          <g key={size} data-testid={`row-${size}`}>
            <text x={-10} y={y + 5} textAnchor="end" className="fill-ink text-sm font-semibold">
              {size}
            </text>
            <line
              x1={x(a) + DOT_R + 1}
              x2={x(b) - DOT_R - 1}
              y1={y}
              y2={y}
              className={to.stroke}
              strokeWidth={2}
              markerEnd={`url(#${arrowId})`}
            />
            {[
              { s: from, acc: a, labelX: x(a) - DOT_R - 5, anchor: "end" as const },
              { s: to, acc: b, labelX: x(b) + DOT_R + 5, anchor: "start" as const },
            ].map(({ s, acc, labelX, anchor }) => (
              <g key={s.key} data-testid={`dot-${size}-${s.key}`}>
                <circle cx={x(acc)} cy={y} r={DOT_R} className={`${s.fill} stroke-surface`} strokeWidth={1.5}>
                  <title>{`${size}, ${s.label}: ${pct(acc, 1)}`}</title>
                </circle>
                <text x={labelX} y={y + 4} textAnchor={anchor} className="fill-ink text-xs tabular-nums">
                  {pct(acc, 1)}
                </text>
              </g>
            ))}
            <text x={ROWS_INNER_W + 10} y={y + 4} className="fill-ink text-xs font-semibold tabular-nums">
              {`${pts(b, a) >= 0 ? "+" : ""}${ptsLabel(b, a)} pts`}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

function SeriesLegend({ series }: { series: DotSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {series.map((s, k) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <svg aria-hidden="true" width="12" height="12">
            <circle cx="6" cy="6" r="5" className={s.fill} />
          </svg>
          {k === 0 ? "from" : "to"}: {s.label}
          {s.note ? <span className="font-mono tabular-nums text-ink">· {s.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

const SIZES = BASE.map((m) => m.size);

/**
 * The page's colours (author, 2026-10-18): crimson for each comparison's baseline
 * (the problem alone in figure 2, the final answer only in figure 4), Sky blue for
 * few-shot (figures 1 to 3), Clay orange for instruct models reasoning (figures 3
 * and 4). Crimson is dark so it stays apart from Clay for colour-blind readers.
 */
const FEW_SHOT = { fill: "fill-wrong", stroke: "stroke-wrong" };
const BASELINE = { fill: "fill-crimson", stroke: "stroke-crimson" };
const INSTRUCT_REASONING = { fill: "fill-compute", stroke: "stroke-compute" };

const FIG2_SERIES: [DotSeries, DotSeries] = [
  { key: "zero", label: "zero-shot, the problem alone", ...BASELINE, arms: BASE.map((m) => m.zeroShot) },
  { key: "few", label: "few-shot, five worked examples first", ...FEW_SHOT, arms: BASE.map((m) => m.fewShot) },
];

/**
 * The prompt each side of figure 3 reads, in tokens (median over the 495): the cost
 * of the examples, which the instruct models do without. One tokenizer serves every
 * size, so one number per prompt; the loader's data says so (equal across sizes).
 */
/** Section 3's opening: the few-shot prompt's median length, to the nearest 50 ("around"). */
const FEW_PROMPT_ROUNDED = Math.round(BASE[0].fewShot.medianPromptTokens / 50) * 50;

const promptTokens = (arms: ArmStats[]) => {
  const ns = new Set(arms.map((a) => a.medianPromptTokens));
  if (ns.size !== 1) throw new Error("page 5: a prompt's length differs across sizes");
  return `prompt ${arms[0].medianPromptTokens.toLocaleString("en-GB")} tokens`;
};

const FIG3_SERIES: [DotSeries, DotSeries] = [
  {
    key: "few",
    label: "base model, five worked examples",
    ...FEW_SHOT,
    arms: BASE.map((m) => m.fewShot),
    note: promptTokens(BASE.map((m) => m.fewShot)),
  },
  {
    key: "instruct",
    label: "instruct model, no examples",
    ...INSTRUCT_REASONING,
    arms: INSTRUCT.map((m) => m.cot),
    note: promptTokens(INSTRUCT.map((m) => m.cot)),
  },
];

const describeSeries = (s: DotSeries) => SIZES.map((size, i) => `${size} ${pct(s.arms[i].accuracy, 1)}`).join(", ");

/* ------------------------------------------------------------------ figure 4 */

const FLOOR_W = 660;
const FLOOR_H = 250;
const FLOOR_MARGIN = { top: 30, right: 30, bottom: 44, left: 122 };
const FLOOR_INNER_W = FLOOR_W - FLOOR_MARGIN.left - FLOOR_MARGIN.right;
const FLOOR_INNER_H = FLOOR_H - FLOOR_MARGIN.top - FLOOR_MARGIN.bottom;

const FLOOR_ROWS = INSTRUCT.map((m) => ({
  modelId: m.modelId,
  label: m.label,
  blurtAccuracy: m.direct.accuracy,
  bareAccuracy: m.cot.accuracy,
  deltaPts: ptsLabel(m.cot.accuracy, m.direct.accuracy),
}));

/**
 * Three checkpoints, each bar split at the accuracy it keeps non-reasoning.
 * The shaded band is the claim: answering directly, every model lands in the
 * same narrow strip, and the strip does not move with size. There is no size
 * axis and no line through the points, deliberately. The old section 3's chart,
 * kept almost exactly: only the numbers changed (handoff, section 2).
 */
function FloorChart() {
  const rows = FLOOR_ROWS;
  const maxBlurt = Math.max(...rows.map((m) => m.blurtAccuracy));
  const x = (v: number) => (v / 100) * FLOOR_INNER_W;
  const rowH = FLOOR_INNER_H / rows.length;
  const barH = 22;
  const crossX = x(S4.small.cot.accuracy * 100);

  return (
    <ChartFrame
      title={`Share of ${N} MATH-500 problems solved by three Qwen2.5-Instruct checkpoints, each bar split into the part it keeps non-reasoning and the part its reasoning adds. Non-reasoning: ${rows.map((m) => `${m.label} ${pct(m.blurtAccuracy, 1)}`).join(", ")}. Reasoning: ${rows.map((m) => `${m.label} ${pct(m.bareAccuracy, 1)}`).join(", ")}.`}
      width={FLOOR_W}
      height={FLOOR_H}
      margin={FLOOR_MARGIN}
      xLabel="percentage of problems solved"
    >
      {/* the floor: every non-reasoning bar ends inside this strip */}
      <rect x={0} y={0} width={x(maxBlurt * 100)} height={FLOOR_INNER_H} className="fill-crimson opacity-10" />
      <line
        x1={x(maxBlurt * 100)}
        x2={x(maxBlurt * 100)}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-crimson"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text x={x(maxBlurt * 100) + 6} y={-10} className="fill-crimson-ink text-[11px] font-semibold">
        the floor: non-reasoning, all three land in here
      </text>

      {/* gridlines */}
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={FLOOR_INNER_H} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={FLOOR_INNER_H + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
            {t}
          </text>
        </g>
      ))}

      {/* the cross-model comparison, as a guide the eye can land on */}
      <line
        x1={crossX}
        x2={crossX}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {rows.map((m, i) => {
        const y = i * rowH + rowH / 2 - barH / 2;
        const kept = x(m.blurtAccuracy * 100);
        const added = x(m.bareAccuracy * 100) - kept;
        return (
          <g key={m.modelId} data-testid={`floor-${m.label}`}>
            <text x={-10} y={y + barH / 2 + 4} textAnchor="end" className="fill-ink text-xs">
              {m.label.replace("Qwen2.5-", "").replace("-Instruct", "")}
            </text>
            <text x={-10} y={y + barH / 2 + 17} textAnchor="end" className="fill-ink-muted text-[10px]">
              {DEC.dtype}
            </text>
            <rect x={0} y={y} width={kept} height={barH} className="fill-crimson" />
            <rect x={kept} y={y} width={added} height={barH} className="fill-compute" />
            <text x={kept + added + 8} y={y + barH / 2 + 4} className="fill-ink text-xs tabular-nums">
              {pct(m.bareAccuracy, 1)}
            </text>
            <text
              x={kept + added / 2}
              y={y + barH / 2 + 4}
              textAnchor="middle"
              className="fill-ink text-[11px] font-semibold tabular-nums"
            >
              +{m.deltaPts}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/** Median reply lengths across the three instruct models, for section 4's last sentence. */
const COT_MEDIAN_ROUNDED =
  Math.round(INSTRUCT.reduce((a, m) => a + m.cot.medianTokens, 0) / INSTRUCT.length / 10) * 10;
const DIRECT_MEDIANS = [...new Set(INSTRUCT.map((m) => m.direct.medianTokens))];
const DIRECT_MEDIAN_RANGE = DIRECT_MEDIANS.join(" or ");
/** The smallest share of Direct replies of 40 tokens or fewer, floored to a whole percent. */
const DIRECT_SHORT_FLOOR = Math.floor(Math.min(...INSTRUCT.map((m) => m.direct.shortShare ?? 0)) * 100);

/* -------------------------------------------------------------------- page */

export function Page5() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [announce, setAnnounce] = useState("");
  // ---- Step 1: the test problem, and whether the replies show ----
  const [mode, setMode] = useState<Mode>("zeroShot");
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);

  const describeReply = (m: Mode, i: number) => {
    const t = PAGE5.testProblems[i];
    const x = t.replies[m];
    const said = `${x.extracted ? `answered ${x.extracted}` : "gave no boxed answer"} (${x.correct ? "right" : "wrong"})`;
    return `${FIG1_MODEL.label}, ${m === "fewShot" ? "few-shot" : "zero-shot"}, ${said}. The answer is ${t.answer}.`;
  };

  const chooseMode = (m: Mode) => {
    recordInteraction(PAGE_N);
    setMode(m);
    setAnnounce(shown ? describeReply(m, active) : m === "fewShot" ? "Few-shot: five worked examples, then the problem." : "Zero-shot: the problem alone.");
  };
  const chooseProblem = (i: number) => {
    recordInteraction(PAGE_N);
    setActive(i);
    setAnnounce(shown ? describeReply(mode, i) : `Problem ${i + 1} of ${PAGE5.testProblems.length}, level ${PAGE5.testProblems[i].level}.`);
  };
  const play = () => {
    recordInteraction(PAGE_N);
    setShown(true);
    setAnnounce(describeReply(mode, active));
  };
  const reset = () => {
    recordInteraction(PAGE_N);
    setShown(false);
    setAnnounce("Both replies cleared.");
  };

  const gains = BASE.map((m) => ptsLabel(m.fewShot.accuracy, m.zeroShot.accuracy));

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebooks sit right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_HREF} size={NOTEBOOK_SIZE} format="notebooks" />
      </div>
      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Act 2's opener, unchanged from the old page: picks up page 4's open question
            in its own words and maps the act. A grid row of its own, so the hardware
            note can sit beside it (author, 2026-10-14). */}
        <p className="text-lg text-ink-muted">
          Act 1 ended on a question: can a language model reason through a problem instead of
          answering on reflex? Act 2 answers it with a toolbox of ways to spend more computation on
          each answer: think longer in one chain (pages 5 and 6), try many paths and pick the best
          (pages 7 to 9), search through them (page 10), and finally weigh all of it against simply
          using a bigger model (page 11). The first tool is the simplest: have the model write out
          its steps.
        </p>
        <Note kicker="Hardware" flush>
          <p>An A100 GPU with 80GB VRAM was used in these experiments.</p>
        </Note>

        {/* Step 1: the definition (the author's first paragraph, unchanged) and the
            few-shot prompt itself. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Chain of Thought (CoT): System 2, written down</h2>
          <p className="text-ink">
            We&apos;ve previously illustrated what step-by-step reasoning looks like for a couple of real-world
            problems. <strong>Chain-of-thought prompting</strong> simulates human reasoning by using
            each intermediate step as part of the LLM prompt to generate the next intermediate step.
            <Cite n={REF.wei} /> A common way to ask a model for one is to end the prompt with
            &ldquo;{ZERO_SHOT_COT_TRIGGER}&rdquo;
            <Cite n={REF.kojima} />
          </p>
          {/* The author's paragraph (2026-10-18), cut to two sentences so the figure
              carries the rest (author, same day): its column titles define zero-shot and
              few-shot, and the examples' caption says whose solutions they are. One
              model, the base 3B (author, same day). It opens as the alternative to
              paragraph 1's ask, not a second "common way" (author, same day): Wei et al.
              introduced chain of thought with worked examples, before Kojima's phrase. */}
          <p className="text-ink">
            The original way, though, is to show rather than ask: put a few{" "}
            <strong>worked examples</strong> in the prompt.
            <Cite n={REF.wei} /> Below, the base model {FIG1_MODEL.label}
            <Cite n={REF.qwen} /> answers MATH-500 problems
            <Cite n={REF.math500} /> with and without them.
          </p>
          <PromptFigure
            mode={mode}
            active={active}
            shown={shown}
            onMode={chooseMode}
            onProblem={chooseProblem}
            onPlay={play}
            onReset={reset}
          />
        </section>
        <Note kicker="References">
          <RefItem n={REF.wei} href="https://arxiv.org/abs/2201.11903">
            Wei et al. 2022, <em>Chain-of-Thought Prompting Elicits Reasoning in Large Language
            Models</em> (NeurIPS 2022).
          </RefItem>
          <RefItem n={REF.kojima} href="https://arxiv.org/abs/2205.11916">
            Kojima et al. 2022, <em>Large Language Models are Zero-Shot Reasoners</em> (NeurIPS
            2022).
          </RefItem>
          <RefItem n={REF.qwen} href="https://huggingface.co/Qwen/Qwen2.5-3B">
            Qwen team 2024, <em>Qwen2.5-3B</em> model card (Hugging Face). The 1.5B and 7B cards,
            and the Instruct versions, sit alongside it.
          </RefItem>
          <RefItem n={REF.math500} href="https://huggingface.co/datasets/HuggingFaceH4/MATH-500">
            <em>MATH-500</em> dataset card (Hugging Face): 500 MATH test problems (Hendrycks et
            al. 2021), the subset of Lightman et al. 2023.
          </RefItem>
        </Note>

        {/* Step 2: figure first, then the prose explaining Shashank's sentence. */}
        <section className="flex min-w-0 flex-col gap-3">
          {/* Headings 2 and 3 name Shashank's two solutions: one at inference time, one
              in post-training (author, 2026-10-18). */}
          <h2 className="text-xl font-semibold text-ink">2. At inference time: zero-shot versus few-shot</h2>
          <p className="text-ink-muted">
            {/* The old section 2's opening sentence, with the new run's denominator. */}
            One trace proves nothing, so both prompts were run across the other {N} MATH-500
            problems, with base models of three sizes.
          </p>
          <section
            aria-label="Zero-shot against few-shot"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <Ledger
              rows={[
                ["model", "Qwen2.5 base · 1.5B, 3B, 7B · bf16"],
                ["decoding", `${DEC.strategy} · ${DEC.max_new_tokens.toLocaleString("en-GB")}-token cap`],
                ["problems", `MATH-500 · n = ${N} paired`],
                ["output", `${(BASE.length * 2 * N).toLocaleString("en-GB")} replies`],
              ]}
            />
            <figure className="flex flex-col gap-2">
              <SeriesLegend series={FIG2_SERIES} />
              <ArrowRows
                id="p5-fig2"
                title={`Share of the same ${N} MATH-500 problems solved by three base Qwen2.5 models, from zero-shot to few-shot. Zero-shot: ${describeSeries(FIG2_SERIES[0])}. Few-shot: ${describeSeries(FIG2_SERIES[1])}.`}
                series={FIG2_SERIES}
                sizes={SIZES}
              />
              <figcaption className="text-center text-base font-semibold text-ink">
                Zero-shot vs few-shot: base Qwen2.5 on {N} MATH-500 problems
                <span className="block text-sm font-normal text-ink-muted">
                  How many problems each prompt solved, and the examples&apos; lead in points
                </span>
              </figcaption>
            </figure>
          </section>
          <p className="text-ink-muted">
            The worked examples help at every size, by {gains[0]}, {gains[1]} and {gains[2]} points,
            though less as the model grows.{" "}
            {/* Shashank's two sentences, verbatim (author, 2026-10-18); they replace the
                page's paraphrase of the same idea. Page5.test.tsx pins the wording. */}
            By providing the step-by-step intermediate logic in the examples, you force the model to
            generate its own reasoning pathway before committing to a final answer. This prevents
            the model from hallucinating a final state because it has to calculate the state
            sequentially. Without them, the 7B answers{" "}
            <strong className="text-ink">{BASE_7B.zeroShot.wroteCode}</strong> of the {N} problems by
            writing a Python program that nothing runs. After the examples, it never does.
          </p>
        </section>
        <div aria-hidden="true" />

        {/* Step 3. Its opening says what an instruct model is, picking up where step 2
            ends (author, 2026-10-18): the examples work, but they ride with every
            question, and post-training does the showing once instead. The results
            discussion still waits for the author; the figure carries the numbers. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. In post-training: instruct models, with no examples</h2>
          <p className="text-ink">
            The worked examples work, but they travel with every question: the few-shot prompt runs
            to around {FEW_PROMPT_ROUNDED.toLocaleString("en-GB")} tokens before the model writes a
            word. <strong>Instruct models</strong> do the showing once, in training. An instruct
            model is the same base model trained further on instructions paired with good answers,
            including step-by-step solutions to maths problems,
            <Cite n={REF.qwenReport} /> so it writes out its steps with no examples in front of the
            question.
          </p>
          <p className="text-ink-muted">
            Below, the instruct versions of the same three models answer the same {N} problems with
            no examples, against the base models with five.
          </p>
          <section
            aria-label="Instruct models against few-shot base models"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={chip}>Qwen2.5 base and Instruct · 1.5B, 3B, 7B · all bf16</span>
              <span className={chip}>greedy · the same {N} problems</span>
            </div>
            <figure className="flex flex-col gap-2">
              <SeriesLegend series={FIG3_SERIES} />
              <ArrowRows
                id="p5-fig3"
                title={`Share of the same ${N} MATH-500 problems solved, from base models with five worked examples to instruct models with none. Base, few-shot: ${describeSeries(FIG3_SERIES[0])}. Instruct, no examples: ${describeSeries(FIG3_SERIES[1])}.`}
                series={FIG3_SERIES}
                sizes={SIZES}
              />
              <figcaption className="text-center text-base font-semibold text-ink">
                Few-shot base vs instruct: Qwen2.5 on {N} MATH-500 problems
                <span className="block text-sm font-normal text-ink-muted">
                  How many problems each solved, and the instruct models&apos; lead in points
                </span>
              </figcaption>
            </figure>
          </section>
        </section>
        <Note kicker="References">
          <RefItem n={REF.qwenReport} href="https://arxiv.org/abs/2412.15115">
            Qwen team 2024, <em>Qwen2.5 Technical Report</em> (arXiv): how the Instruct models
            were post-trained.
          </RefItem>
        </Note>

        {/* Step 4: the old section 3, its argument and chart kept, its numbers from
            the instruct run. Every claim is guarded against the data in
            Page5.test.tsx: "less than a quarter the size", "twice as well", and
            "every model in System 2 beats every model in System 1". */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. Smaller reasoning models do better than larger non-reasoning models</h2>
          <p className="text-ink-muted">
            Today&apos;s instruct models no longer need asking: System&nbsp;2 thinking is their
            default mode. So we asked the same three models for the opposite, adding one line to
            every problem: give only the final answer, with no working. At least{" "}
            {DIRECT_SHORT_FLOOR}% of their replies are then 40 tokens or fewer: System&nbsp;1,
            answering immediately.
          </p>
          <p className="text-ink-muted">
            Can a bigger model make up for skipping the steps? Forced into System&nbsp;1, the 7B
            solves <strong className="text-ink">{pct(S4.large.direct.accuracy, 1)}</strong>. In
            System&nbsp;2, the 1.5B solves{" "}
            <strong className="text-ink">{pct(S4.small.cot.accuracy, 1)}</strong>: a model less
            than a quarter the size does twice as well, just by writing out its steps. Every model
            in System&nbsp;2 beats every model in System&nbsp;1. The steps are not free: a median of
            around {COT_MEDIAN_ROUNDED} tokens per problem, against {DIRECT_MEDIAN_RANGE}.
          </p>
          <section
            aria-label="The floor is flat"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <Ledger
              rows={[
                ["model", "Qwen2.5-Instruct · 1.5B, 3B, 7B · bf16"],
                ["decoding", `${DEC.strategy} · ${DEC.max_new_tokens.toLocaleString("en-GB")}-token cap`],
                ["problems", `MATH-500 · n = ${N} paired`],
                ["output", `${(INSTRUCT.length * 2 * N).toLocaleString("en-GB")} replies`],
              ]}
            />
            <FloorChart />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-crimson" /> solved with no reasoning
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute" /> added by the working
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-crimson opacity-20" /> the floor: all three
                non-reasoning bars end inside it
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-px bg-compute" /> the 1.5B, reasoning
              </span>
            </div>
          </section>
          <Handoff>
            <p className="text-ink">
              {/* The old page's closing line, author, 2026-09-27. */}
              A chain of thought makes a model better at hard problems, and it charges for that
              in tokens.
            </p>
          </Handoff>
        </section>
        <div aria-hidden="true" />
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
