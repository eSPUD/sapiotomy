"use client";

/**
 * Page 6, "Thinking Longer" — the deck's first naming of inference-time
 * compute. Page 5 gave the model a chain; this page gives the chain a length,
 * and length is the meter. `max_new_tokens` IS the budget dial, so the page's
 * thesis is executed rather than asserted: cap the model, force it to commit at
 * the cap, grade what it committed to, sweep the cap.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED. Nothing is redrawn from a
 * paper and nothing is authored. The source is one FULL run of
 * `notebooks/page_06_thinking_longer.ipynb` — Qwen2.5-Instruct (1.5B and 3B at
 * bf16, 7B at 8-bit; the 3B is primary), MATH-500 levels 4 and 5, 100 items,
 * five budgets, greedy, 1,500 records. Its `derived.json` is committed verbatim
 * to `web/data/page-06-derived.json` and loaded through `@/lib/page06`, which
 * runs the spec's gates BEFORE any number and throws if one fails. No inference
 * runs at demonstration time; the page replays committed logs. The predecessor
 * of this file drew an authored five-step chain and a redrawn AIME24 curve for
 * a checkpoint nobody reading could inspect; both are gone, and with them the
 * whole word-versus-token dance, because we ran a tokenizer and the axis is
 * tokens.
 *
 * Layout: page 1's shell, kept. One reading column of numbered steps, each
 * beside its own margin note that scrolls with it. Three steps, and the
 * standalone System 1 / System 2 card pair is CUT — the reader met that idea in
 * Act 1 and it survives here as a single clause in step 1's caption.
 *
 *   Step 1 — figure 1, the truncation view. One problem, the budget on a dial.
 *   Three visual facts carry the idea and need no prose: the trace is GREYED
 *   past the cut rather than hidden (the single most important pixel on the
 *   page — the reader sees what the model would have written and was not
 *   allowed to); the forced answer is tinted as an intervention rather than a
 *   conclusion; and the verdict flips discontinuously, because item-level
 *   accuracy is a step function. Inset: asked nicely against cut off.
 *
 *   Step 2 — figure 2, the population curve. Three checkpoints, one tokenizer,
 *   log x-axis, and its OWN budget line on the chart. The y-axis is
 *   deliberately quiet: the SHAPE is the claim and the levels are not. The
 *   procedure line under the figure is what makes this re-derivable rather
 *   than merely reproducible.
 *
 *   Step 3 — figure 3, the chain-length distribution. One square per problem,
 *   placed by how long its chain ran with nothing cutting it, and its own
 *   budget line. The mass that never turns is the payload and the handoff:
 *   those problems are not budget-limited.
 *
 *   Step 4 — figure 4, the crossing. The extension arm as a swap: ten problems
 *   turning wrong passing nine turning right in the middle of it, with the two
 *   ends barely moving.
 *
 * Load-bearing and easy to lose:
 *   · the greying past the cut. Hiding it turns the figure into a progress bar.
 *   · the two curves-that-are-three teach an INVARIANT. No caption may compare
 *     their heights as a fact about scale: they differ in size AND in training,
 *     and the 7B is 8-bit while the others are bf16, so a level comparison is
 *     barred twice over (spec section 7).
 *   · the never-flipping band is not "unsolvable". What we measured is that no
 *     budget IN THIS GRID with THIS DECODING reaches it, and page 7 changes the
 *     decoding. Say it that way or not at all.
 *   · the 3B's last doubling scores -1 point, one problem out of 100. The chart
 *     draws the measured points, so the wobble is visible and un-smoothed, and
 *     the prose does not dress a single problem as the overthinking result.
 *     Page 15 owns that finding; this page owns the flattening.
 *   · the inset measures RELIABILITY, not overshoot. Asking for brevity held
 *     the mean under the line and missed it on a quarter of items; the cap
 *     missed on none. Do not caption it as "the soft request overspends" — that
 *     was the expectation, and it is not what the run says.
 *   · budget forcing gets an author-year cite with NO numbers attached. We show
 *     our curve, not theirs.
 *   · one control per figure. The three budgets were one, and a reader who
 *     touched any of them silently redrew a figure off screen. See the state
 *     block in `Page6` before merging them again.
 *   · a problem whose statement is an Asymptote program never reaches the
 *     picker (`isDrawingProgram` in `@/lib/page06`), because the page has no
 *     renderer for it and the reader gets twenty lines of drawing code where a
 *     question should be. Its traces still ship in the download.
 */

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE6,
  WAIT_TABLE,
  naturalLength,
  pLabel,
  pct,
  rowById,
  tidyMath,
  tokens,
  traceZones,
} from "@/lib/page06";
import { useStore } from "@/store/useStore";

const PAGE_N = 6;
const M = PAGE6.manifest;
const B = PAGE6.budgets;
const F1 = PAGE6.figure1;
const F2 = PAGE6.figure2;
const F3 = PAGE6.figure3;
const H = PAGE6.handoff;
const FW = PAGE6.figureWait;

/** The download: notebook + harness + every generation the page rests on. */
const NOTEBOOK_ZIP = "/notebooks/page-06-thinking-longer.zip";
const NOTEBOOK_SIZE = "2.0 MB";

const TOP = B[B.length - 1];

/**
 * The last doubling's move, in words. It comes out negative on the primary
 * checkpoint, and "moves it by -1 point" reads as a typo rather than as the
 * measurement it is, so the direction goes in the sentence and the number
 * stays unsigned.
 */
const LAST_GAIN = F2.primary.gains[F2.primary.gains.length - 1].gain_pts;
const LAST_GAIN_PTS = Math.abs(Math.round(LAST_GAIN));
const LAST_GAIN_MOVE = `${LAST_GAIN < 0 ? "down" : "up"} by ${LAST_GAIN_PTS} point${
  LAST_GAIN_PTS === 1 ? "" : "s"
}`;
/** The same move counted in problems, which is how the page reads a point. */
const LAST_GAIN_PROBLEMS = LAST_GAIN_PTS === 1 ? "one problem" : `${LAST_GAIN_PTS} problems`;

/**
 * What the injections cost, as a range rather than as one round number. The
 * three checkpoints run to 1.6, 1.8 and 2.2 times their unforced length, so
 * "roughly double" is wrong for two of the three and the sentence quotes the
 * span it actually measured.
 */
const WAIT_TOKEN_MULTIPLES = FW
  ? FW.curves.map((c) => c.points[c.points.length - 1].mean_tokens / c.points[0].mean_tokens)
  : [];
const WAIT_COST_RANGE = FW
  ? `${Math.min(...WAIT_TOKEN_MULTIPLES).toFixed(1)} to ${Math.max(...WAIT_TOKEN_MULTIPLES).toFixed(1)} times`
  : "";

/** Cited for the technique it introduced. No number of theirs appears here. */
const REF = { s1: 1 } as const;

/**
 * The budget control, drawn as what it actually is: five stops, not a slide.
 *
 * It was a range input, and a range input has to be propped up to be read at
 * all here: a label row, a readout, a track, and a row of tick numbers, four
 * stacked rows to choose one of five values. Native radios collapse that to
 * one row, keep arrow-key operation for free, and let the dead stops be a
 * property of the stop itself rather than a second bar underneath it.
 *
 * `deadFrom` is the first stop that no longer cuts the chain on show. Those
 * stops stay live rather than disabled, because "you can pick it and nothing
 * happens" is the fact the page is teaching, and a disabled control teaches
 * nothing.
 */
function BudgetStops({
  value,
  onChange,
  deadFrom,
}: {
  value: number;
  onChange: (i: number) => void;
  deadFrom?: number;
}) {
  const name = useId();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm text-ink-muted">Token budget</span>
      <div role="radiogroup" aria-label="Token budget" className="flex flex-wrap gap-1">
        {B.map((b, i) => {
          const dead = deadFrom !== undefined && i >= deadFrom;
          return (
            <label key={b} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                className="peer sr-only"
                checked={value === i}
                aria-label={`${b} tokens`}
                onChange={() => onChange(i)}
              />
              <span
                className={`block rounded border px-2 py-0.5 font-mono text-xs tabular-nums peer-focus-visible:ring-2 peer-focus-visible:ring-compute peer-checked:border-compute peer-checked:bg-compute peer-checked:text-canvas ${
                  dead ? "border-dashed border-grid text-ink-muted" : "border-grid text-ink"
                }`}
              >
                {b}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The budget line, which IS the control: a rule the reader drags along a chart
 * whose x-axis is already tokens.
 *
 * It began as figure 3's, on the argument that a stop row under that chart
 * would be a third copy of a widget whose job was to be somewhere else. Then
 * the widget stopped being somewhere else. Figures 2 and 3 used to answer to
 * ONE budget, which meant the stop row in step 2 silently moved a figure a
 * screen and a half below it, and dragging figure 3's line silently moved the
 * trace two screens above: a reader who touched either one changed something
 * they could not see. So the state split three ways and this control was
 * extracted, because the fix for a hidden effect is a control per figure, not a
 * better caption.
 *
 * Everything here is scale-agnostic. Figure 2's axis is log and figure 3's is
 * linear, so the only thing the caller passes is `xOf`, and the snapping,
 * capture and keyboard handling stay in one place.
 *
 * The pointer maths goes through the svg's own coordinate space, because these
 * charts scale to fit their column, and it snaps to a stop: the budget is one
 * of five values, and a line resting between two of them would be a lie.
 */
function BudgetLine({
  svgRef,
  xOf,
  width,
  height,
  svgWidth,
  marginLeft,
  budgetIndex,
  onBudget,
  /**
   * Which figure's budget this is. There are two of these on the page now, and
   * a screen reader that meets "Token budget" twice cannot tell a reader which
   * one they have landed on.
   */
  label,
  /** How far right of the plot the shading reaches, for figure 3's gutter. */
  overhang = 0,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  xOf: (budget: number) => number;
  width: number;
  height: number;
  svgWidth: number;
  marginLeft: number;
  budgetIndex: number;
  onBudget: (i: number) => void;
  label: string;
  overhang?: number;
}) {
  const budget = B[budgetIndex];
  const bx = xOf(budget);
  const atTop = budgetIndex === B.length - 1;

  const indexFromClient = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const r = svg.getBoundingClientRect();
      const scale = (r.width || svgWidth) / svgWidth;
      const local = (clientX - r.left) / (scale || 1) - marginLeft;
      let best = 0;
      for (let i = 1; i < B.length; i++) {
        if (Math.abs(xOf(B[i]) - local) < Math.abs(xOf(B[best]) - local)) best = i;
      }
      return best;
    },
    [svgRef, xOf, svgWidth, marginLeft],
  );

  const onPointer = (e: React.PointerEvent<SVGRectElement>) => {
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const next = indexFromClient(e.clientX);
    if (next !== null && next !== budgetIndex) onBudget(next);
  };

  const onKey = (e: React.KeyboardEvent<SVGGElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    let next: number | null = null;
    if (e.key in step) next = budgetIndex + step[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = B.length - 1;
    if (next === null) return;
    e.preventDefault();
    next = Math.min(B.length - 1, Math.max(0, next));
    if (next !== budgetIndex) onBudget(next);
  };

  return (
    <>
      {/* Grab anywhere along the plot rather than having to hit the rule. It
          sits over the marks, so a drag that starts on a datum still moves the
          budget. */}
      <rect
        x={0}
        y={0}
        width={width + overhang}
        height={height}
        fill="transparent"
        className="cursor-ew-resize"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
      />
      <g
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={B[0]}
        aria-valuemax={TOP}
        aria-valuenow={budget}
        aria-valuetext={`${budget} tokens`}
        onKeyDown={onKey}
        className="cursor-ew-resize focus:outline-none"
      >
        <line x1={bx} x2={bx} y1={-6} y2={height} className="stroke-compute" strokeWidth={2} />
        {/* The handle is what says "this moves", and it is also the focus ring
            target, so keyboard and pointer readers are looking at one object. */}
        <rect x={bx - 4} y={-12} width={8} height={10} rx={2} className="fill-compute" />
        <text
          x={atTop ? bx - 8 : bx + 8}
          y={-3}
          textAnchor={atTop ? "end" : "start"}
          className="fill-compute text-[10px] font-semibold tabular-nums"
        >
          {budget}
        </text>
      </g>
    </>
  );
}

/**
 * A margin note that sits beside its step and scrolls with the page.
 *
 * `lg:pt-9` drops the note past its step's <h2> so the two bodies start on the
 * same line. A note STACKED under another one is already past the heading, so
 * it takes `tight` and skips the offset.
 */
function Note({
  kicker,
  tight = false,
  children,
}: {
  kicker: string;
  tight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside className={`flex flex-col gap-2 text-sm text-ink-muted ${tight ? "" : "lg:pt-9"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const C_W = 620;
const C_H = 272;
const C_M = { top: 28, right: 104, bottom: 46, left: 52 };
const C_IW = C_W - C_M.left - C_M.right;
const C_IH = C_H - C_M.top - C_M.bottom;

/**
 * The primary checkpoint is drawn bold in the compute hue, because it is the
 * model every other figure on the page uses; the other two are thin neutral
 * inks. `correct` and `wrong` are spoken for here: they are what a verdict
 * looks like in figure 1 and what a cell means in figure 3, so a curve may not
 * borrow them.
 */
const isPrimary = (id: string) => id === F2.primary.model_id;
const curveStroke = (id: string) => (isPrimary(id) ? "stroke-compute" : "stroke-ink-muted");
const curveFill = (id: string) => (isPrimary(id) ? "fill-compute" : "fill-ink-muted");

const shortLabel = (label: string) => label.replace("Qwen2.5-", "").replace("-Instruct", "");

const logMin = Math.log2(B[0]);
const logMax = Math.log2(TOP);
const cx = (budget: number) => ((Math.log2(budget) - logMin) / (logMax - logMin)) * C_IW;
const cy = (accuracy: number) => C_IH - accuracy * C_IH;

/**
 * Share of problems solved against token budget. The figure is built to be read
 * as a shape rather than as three readings: the y-axis is a quiet grid, the
 * climb each curve makes before it bends is drawn as a rising wedge under the
 * primary, and everything past the knee sits inside a shaded slab labelled with
 * what the last doubling actually bought. Three curves at three heights enter
 * the same slab, which is the invariant the page is claiming.
 */
function BudgetCurve({
  budgetIndex,
  onBudget,
}: {
  budgetIndex: number;
  onBudget: (i: number) => void;
}) {
  const knee = F2.primary.knee_budget!;
  const kneeX = cx(knee);
  const lastGain = F2.primary.gains[F2.primary.gains.length - 1].gain_pts;
  const svgRef = useRef<SVGSVGElement | null>(null);
  return (
    <ChartFrame
      svgRef={svgRef}
      role="group"
      title={`Share of 100 MATH-500 level 4 and 5 problems solved against the token budget, on a log axis, for three Qwen2.5-Instruct checkpoints. ${F2.curves
        .map(
          (c) =>
            `${c.label}: ${c.points.map((p) => `${pct(p.accuracy)} at ${p.budget} tokens`).join(", ")}`,
        )
        .join(". ")}. Every curve bends at ${knee} tokens. The budget line is at ${B[budgetIndex]} tokens.`}
      width={C_W}
      height={C_H}
      margin={C_M}
      xLabel="token budget (max_new_tokens), log scale"
      yLabel="solved (%)"
    >
      {/* Past the knee the dial has stopped paying. Shading it says so once,
          instead of asking the reader to compare five pairs of dots. */}
      <rect x={kneeX} y={0} width={C_IW - kneeX} height={C_IH} className="fill-ink opacity-[0.06]" />
      <line x1={kneeX} x2={kneeX} y1={0} y2={C_IH} className="stroke-ink-muted" strokeWidth={1} />
      <text x={kneeX + 6} y={12} className="fill-ink-muted text-[10px]">
        {/* Scoped to the checkpoint whose last gain it reads off: inside this
            slab the 7B still rises a point, so the label may not be phrased as
            a fact about all three curves. */}
        {lastGain > 0
          ? `past here, doubling buys the ${shortLabel(F2.primary.label)} ${lastGain.toFixed(0)} point`
          : `past here, doubling stops paying for the ${shortLabel(F2.primary.label)}`}
      </text>

      {[0, 0.2, 0.4, 0.6].map((t) => (
        <g key={t}>
          <line x1={0} x2={C_IW} y1={cy(t)} y2={cy(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={cy(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t * 100}
          </text>
        </g>
      ))}

      {/* what the budget bought the primary checkpoint, as area rather than as
          two numbers the reader has to subtract */}
      <polygon
        points={`${F2.primary.points.map((p) => `${cx(p.budget)},${cy(p.accuracy)}`).join(" ")} ${C_IW},${cy(F2.primary.floor)} 0,${cy(F2.primary.floor)}`}
        className="fill-compute opacity-10"
      />

      {B.map((b) => (
        <text key={b} x={cx(b)} y={C_IH + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
          {b}
        </text>
      ))}

      {F2.curves.map((c) => {
        const primary = isPrimary(c.model_id);
        const d = c.points.map((p) => `${cx(p.budget)},${cy(p.accuracy)}`).join(" ");
        const last = c.points[c.points.length - 1];
        return (
          <g key={c.model_id}>
            <polyline
              points={d}
              fill="none"
              className={curveStroke(c.model_id)}
              strokeWidth={primary ? 2.5 : 1.25}
            />
            {c.points.map((p) => (
              <circle
                key={p.budget}
                cx={cx(p.budget)}
                cy={cy(p.accuracy)}
                r={primary ? 3.5 : 2}
                className={curveFill(c.model_id)}
              />
            ))}
            <text
              x={C_IW + 8}
              y={cy(last.accuracy) + 4}
              className={`${curveFill(c.model_id)} text-[11px] ${primary ? "font-semibold" : ""}`}
            >
              {shortLabel(c.label)}
            </text>
          </g>
        );
      })}

      {/* Last, so the drag surface sits over the curves and the handle over
          everything: this figure's dial is its own, and it is on the chart. */}
      <BudgetLine
        svgRef={svgRef}
        xOf={cx}
        width={C_IW}
        height={C_IH}
        svgWidth={C_W}
        marginLeft={C_M.left}
        budgetIndex={budgetIndex}
        onBudget={onBudget}
        label="Token budget, the population curve"
      />
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const S_W = 620;
const S_H = 300;
const S_M = { top: 30, right: 86, bottom: 44, left: 30 };
const S_IW = S_W - S_M.left - S_M.right;
const S_IH = S_H - S_M.top - S_M.bottom;

/** One column per 128 tokens, so the bins land exactly on the dial's stops. */
const BIN = 128;
const N_BINS = TOP / BIN;
const COL_W = S_IW / N_BINS;
const SQ = 9;
const SQ_PITCH = 10.8;
/** Past the axis: a chain still running at the cap has a floor, not a length. */
const GUTTER_X = S_IW + 34;

const lengthX = (t: number) => (Math.min(t, TOP) / TOP) * S_IW;

/** Ever solved at any budget in the grid. The one thing colour encodes here. */
const everSolved = (d: (typeof F3.items)[number]) => d.correct_by_budget.some(Boolean);

/**
 * Figure 3, rebuilt. It used to be a hundred 2px rows sorted by flip point, and
 * it failed three ways: half the plot was the empty rectangle left by the 51
 * problems that never flip, adjacent rows merged so "one row is one problem"
 * was invisible, and what remained read as a second drawing of figure 2's curve.
 *
 * What replaced it is the same hundred problems placed by a MEASURED quantity:
 * how long each chain actually ran when nothing cut it. That single change does
 * most of the work.
 *
 *   · The silhouette stops being a block and becomes a distribution, so it can
 *     never be confused with page 5's grid, which is a hundred squares whose
 *     ARRANGEMENT is explicitly not data. Here position is the data, and this
 *     figure needs no such caveat.
 *   · The dial earns its keep. The line is the budget the reader holds; left of
 *     it a chain finished on its own, right of it the cap was still biting.
 *     Sweeping the dial gives 0, 8, 45, 84, 94 finishing inside, which IS
 *     figure 2's truncation series read from the other side. The two figures
 *     become one measurement seen twice rather than two views of accuracy.
 *   · "Was it cut off" moves from a colour to a POSITION relative to the line,
 *     so it re-reads on every drag, and colour is left carrying one thing.
 *
 * The payload is visible rather than asserted: at the top budget the shaded
 * still-being-cut zone holds six squares, and the mass of never-solved problems
 * sits well to its left, finished and wrong.
 */
function LengthStrip({
  budgetIndex,
  onBudget,
}: {
  budgetIndex: number;
  onBudget: (i: number) => void;
}) {
  const budget = B[budgetIndex];
  const bx = lengthX(budget);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Censored chains leave the axis: their length is a lower bound, so binning
  // them with the measured ones would draw six floors as six values.
  const censored = F3.items.filter((d) => d.truncated_at_max);
  const stacks = new Map<number, typeof F3.items>();
  for (const d of F3.items) {
    if (d.truncated_at_max) continue;
    const k = Math.min(N_BINS - 1, Math.floor(d.tokens_at_max / BIN));
    // solved first, so each column reads as one band under one band
    const col = stacks.get(k) ?? [];
    col.push(d);
    stacks.set(k, col);
  }
  for (const col of stacks.values()) {
    col.sort((a, b) => Number(everSolved(b)) - Number(everSolved(a)));
  }

  const inside = F3.items.filter((d) => d.tokens_at_max <= budget).length;
  const square = (d: (typeof F3.items)[number], x: number, y: number, key: string) => (
    <rect
      key={key}
      x={x}
      y={y}
      width={SQ}
      height={SQ}
      rx={1.5}
      className={everSolved(d) ? "fill-compute" : "fill-wrong"}
      opacity={everSolved(d) ? 1 : 0.85}
      strokeDasharray={d.truncated_at_max ? "2 1.4" : undefined}
      strokeWidth={d.truncated_at_max ? 1.2 : 0}
      stroke={d.truncated_at_max ? "currentColor" : undefined}
    />
  );

  return (
    <ChartFrame
      title={`How long each of ${F3.items.length} chains ran when nothing cut it, one square per problem, against the token budget. ${
        F3.items.length - F3.neverFlipCount
      } are solved at some budget and ${F3.neverFlipCount} are never solved. At the ${budget}-token budget ${inside} chains finish on their own and ${
        F3.items.length - inside
      } are still being cut. ${censored.length} chains were still running at ${TOP} tokens, so their length is a lower bound.`}
      width={S_W}
      height={S_H}
      margin={S_M}
      role="group"
      svgRef={svgRef}
      xLabel="tokens the chain actually ran to, with nothing cutting it"
    >
      {/* Everything right of the dial was still being cut at this budget, and
          that includes the gutter: a chain censored at the top budget is being
          cut at every budget, so the shading has to reach it. */}
      <rect
        x={bx}
        y={0}
        width={GUTTER_X + SQ + 4 - bx}
        height={S_IH}
        className="fill-ink opacity-[0.055]"
      />

      <line x1={0} x2={S_IW} y1={S_IH} y2={S_IH} className="stroke-grid" strokeWidth={1} />
      {[0, 512, 1024, 1536, 2048].map((t) => (
        <text
          key={t}
          x={lengthX(t)}
          y={S_IH + 16}
          textAnchor="middle"
          className="fill-ink-muted text-[10px] tabular-nums"
        >
          {t}
        </text>
      ))}

      {[...stacks.entries()].map(([k, col]) =>
        col.map((d, i) =>
          square(d, k * COL_W + (COL_W - SQ) / 2, S_IH - (i + 1) * SQ_PITCH, `${k}-${i}`),
        ),
      )}

      {/* the gutter: still running when the cap arrived */}
      <g className="text-ink">
        {censored.map((d, i) => square(d, GUTTER_X, S_IH - (i + 1) * SQ_PITCH, `c-${i}`))}
      </g>
      <text x={GUTTER_X + SQ / 2} y={S_IH + 16} textAnchor="middle" className="fill-ink-muted text-[10px]">
        ≥{TOP}
      </text>

      {/* The two readings sit at the corners rather than beside the line, so
          they cannot clip off the left edge when the dial is at its lowest stop
          or collide with each other when it is near an end. Only the budget tag
          tracks the line, and it flips side at the midpoint. */}
      <text x={0} y={-14} className="fill-compute text-[10px] font-semibold tabular-nums">
        {inside} finished on their own
      </text>
      <text
        x={GUTTER_X + SQ}
        y={-14}
        textAnchor="end"
        className="fill-ink-muted text-[10px] tabular-nums"
      >
        {F3.items.length - inside} still being cut
      </text>

      <BudgetLine
        svgRef={svgRef}
        xOf={lengthX}
        width={S_IW}
        height={S_IH}
        svgWidth={S_W}
        marginLeft={S_M.left}
        budgetIndex={budgetIndex}
        onBudget={onBudget}
        label="Token budget, the chain lengths"
      />
    </ChartFrame>
  );
}


/* ------------------------------------------------------------------ figure 4 */

const X_W = 620;
const X_H = 258;
const X_M = { top: 46, right: 16, bottom: 18, left: 16 };
const X_IW = X_W - X_M.left - X_M.right;
const X_IH = X_H - X_M.top - X_M.bottom;

/** The two stacks, and the space between right and wrong inside each. */
const COL_X0 = 116;
const COL_X1 = 452;
const COL_WIDTH = 24;
const X_GAP = 14;

/**
 * The extension arm, drawn as the crossing it is.
 *
 * Two figures used to carry this step and neither could say the finding. The
 * first was page 5's paired grid, a hundred squares with nineteen of them lit:
 * WHICH square holds which problem is arrangement rather than data, so the
 * reader was asked to count lit squares in a field of unlit ones and then to
 * take it on trust that the two lit blocks were the whole story. The second was
 * three accuracy lines against injection count, and three flat lines are a
 * picture of nothing happening, which is the opposite of what happened.
 *
 * What happened is a swap. Ten problems the model had right when it was allowed
 * to stop came back wrong once its stop was suppressed, nine it had wrong came
 * back right, and the two blocks pass each other in the middle. The
 * ends barely move and the middle is thick, and those are one drawing rather
 * than two. Everything here is the notebook's own paired counts; the concordant
 * blocks follow from them by arithmetic, in `pairedTable`.
 */
function WaitCrossing() {
  if (!WAIT_TABLE) return null;
  const t = WAIT_TABLE.table;
  const u = (X_IH - X_GAP) / t.n;
  const solvedBefore = t.both + t.beforeOnly;
  const solvedAfter = t.both + t.afterOnly;

  // Each block is stacked so that the flow which crosses sits against the gap:
  // right of the left column, right-then-wrong; left of the right column,
  // right-then-wrong again. The two crossings then meet in the middle instead
  // of threading past the concordant bands.
  const wrongTopL = solvedBefore * u + X_GAP;
  const wrongTopR = solvedAfter * u + X_GAP;
  const both = { yL: 0, yR: 0, h: t.both * u };
  const broken = { yL: both.h, yR: wrongTopR, h: t.beforeOnly * u };
  const fixed = { yL: wrongTopL, yR: both.h, h: t.afterOnly * u };
  const neither = { yL: wrongTopL + fixed.h, yR: wrongTopR + broken.h, h: t.neither * u };

  const x0 = COL_X0 + COL_WIDTH;
  const x1 = COL_X1;
  const mid = (x0 + x1) / 2;
  const ribbon = (f: { yL: number; yR: number; h: number }) =>
    `M${x0},${f.yL} C${mid},${f.yL} ${mid},${f.yR} ${x1},${f.yR} ` +
    `L${x1},${f.yR + f.h} C${mid},${f.yR + f.h} ${mid},${f.yL + f.h} ${x0},${f.yL + f.h} Z`;

  /** A column is two blocks, and the reader reads the block, not the segments. */
  const column = (x: number, solved: number, wrong: number, wrongTop: number) => (
    <>
      <rect x={x} y={0} width={COL_WIDTH} height={solved * u} rx={2} className="fill-correct" />
      <rect
        x={x}
        y={wrongTop}
        width={COL_WIDTH}
        height={wrong * u}
        rx={2}
        className="fill-ink opacity-20"
      />
    </>
  );

  return (
    <ChartFrame
      title={`What ${WAIT_TABLE.waits} "${FW!.word}" injections did to ${t.n} problems on the ${shortLabel(
        WAIT_TABLE.label,
      )}. Allowed to stop it solved ${solvedBefore}; with the stop suppressed it solved ${solvedAfter}. ${t.both} were right either way, ${t.neither} were wrong either way, ${t.afterOnly} turned from wrong to right and ${t.beforeOnly} turned from right to wrong.`}
      width={X_W}
      height={X_H}
      margin={X_M}
    >
      {/* Concordant first, so the two crossings sit on top of them. Each band
          takes the tint of the verdict it carries all the way across, which is
          the same tint its column block has: nothing in this figure is a colour
          the legend cannot name. */}
      <path d={ribbon(neither)} className="fill-ink opacity-[0.09]" />
      <path d={ribbon(both)} className="fill-correct opacity-20" />
      <path d={ribbon(broken)} className="fill-wrong opacity-60" />
      <path d={ribbon(fixed)} className="fill-correct opacity-60" />

      {column(COL_X0, solvedBefore, t.n - solvedBefore, wrongTopL)}
      {column(COL_X1, solvedAfter, t.n - solvedAfter, wrongTopR)}

      {/* Column headings sit above their stack; the counts sit outside it, so
          nothing is written over a band whose height IS the number. */}
      <text x={COL_X0 + COL_WIDTH / 2} y={-24} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        allowed to stop
      </text>
      <text x={COL_X0 + COL_WIDTH / 2} y={-12} textAnchor="middle" className="fill-ink-muted text-[10px]">
        0 injections
      </text>
      <text x={COL_X1 + COL_WIDTH / 2} y={-24} textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        stop suppressed
      </text>
      <text x={COL_X1 + COL_WIDTH / 2} y={-12} textAnchor="middle" className="fill-ink-muted text-[10px]">
        {WAIT_TABLE.waits} injections
      </text>

      <text x={COL_X0 - 8} y={(solvedBefore * u) / 2 + 4} textAnchor="end" className="fill-correct text-[11px] font-semibold tabular-nums">
        {solvedBefore} right
      </text>
      <text x={COL_X0 - 8} y={wrongTopL + ((t.n - solvedBefore) * u) / 2 + 4} textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
        {t.n - solvedBefore} wrong
      </text>
      <text x={COL_X1 + COL_WIDTH + 8} y={(solvedAfter * u) / 2 + 4} className="fill-correct text-[11px] font-semibold tabular-nums">
        {solvedAfter} right
      </text>
      <text x={COL_X1 + COL_WIDTH + 8} y={wrongTopR + ((t.n - solvedAfter) * u) / 2 + 4} className="fill-ink-muted text-[11px] tabular-nums">
        {t.n - solvedAfter} wrong
      </text>

      {/* The two crossings, labelled where they LEAVE rather than where they
          arrive: at the left edge they are still thirty pixels apart, and in
          the middle they are on top of each other. Each label sits ON a band of
          its own hue, so it carries a halo in the page's background colour
          rather than relying on a contrast that does not survive dark mode. */}
      <text
        x={x0 + 0.16 * (x1 - x0)}
        y={broken.yL + broken.h / 2 + 3.5}
        paintOrder="stroke"
        strokeWidth={3}
        strokeLinejoin="round"
        className="fill-wrong stroke-surface text-[11px] font-semibold tabular-nums"
      >
        {t.beforeOnly} right → wrong
      </text>
      <text
        x={x0 + 0.16 * (x1 - x0)}
        y={fixed.yL + fixed.h / 2 + 3.5}
        paintOrder="stroke"
        strokeWidth={3}
        strokeLinejoin="round"
        className="fill-correct stroke-surface text-[11px] font-semibold tabular-nums"
      >
        {t.afterOnly} wrong → right
      </text>
    </ChartFrame>
  );
}

/**
 * The same crossing for all three checkpoints, as the widths of the two things
 * that crossed. This is what the three accuracy lines were for, and it says the
 * part they could not: a flat line has two completely different causes, and
 * "nothing moved" against "everything moved and cancelled" is the whole finding
 * of this step. Right-to-wrong runs left of the centre and wrong-to-right runs
 * right of it,
 * so a checkpoint that gained would be visibly lopsided. None of them is.
 */
function WaitLedger() {
  if (!FW) return null;
  const rows = FW.curves.map((c) => ({
    label: shortLabel(c.label),
    paired: c.paired[c.paired.length - 1],
    first: c.points[0],
    last: c.points[c.points.length - 1],
  }));
  const widest = Math.max(...rows.flatMap((r) => [r.paired.fixed, r.paired.broken]));
  const bar = (n: number) => `${(n / widest) * 100}%`;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-xs tabular-nums">
        <caption className="sr-only">
          Answers turned right and turned wrong by {FW.waits[FW.waits.length - 1]} injections, one
          row per checkpoint, against what each solved when allowed to stop.
        </caption>
        <thead className="text-ink-muted">
          <tr>
            <th className="py-1 pr-3 font-semibold">checkpoint</th>
            <th className="py-1 pr-3 text-right font-semibold">right → wrong</th>
            <th className="py-1 font-semibold" />
            <th className="py-1 pl-3 font-semibold">wrong → right</th>
            <th className="py-1 pl-6 font-semibold">solved, and what it cost</th>
          </tr>
        </thead>
        <tbody className="text-ink">
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-grid">
              <td className="py-1.5 pr-3 whitespace-nowrap">{r.label}</td>
              <td className="py-1.5 pr-2 text-right text-wrong">{r.paired.broken}</td>
              {/* One cell, split down the middle: the centre line is zero, and
                  the two halves are the same scale. */}
              {/* A fixed width rather than a percentage: the summary column
                  next to it is long, and a percentage lets the browser crush
                  the bars to nothing on a narrow screen, which leaves the row
                  with two numbers and no picture. */}
              <td className="w-40 min-w-[10rem] py-1.5">
                <div className="relative grid h-4 grid-cols-2 items-center">
                  <div className="flex justify-end">
                    <span className="h-3 rounded-l-sm bg-wrong" style={{ width: bar(r.paired.broken) }} />
                  </div>
                  <div className="flex justify-start">
                    <span className="h-3 rounded-r-sm bg-correct" style={{ width: bar(r.paired.fixed) }} />
                  </div>
                  {/* Zero, drawn, and taller than the bars so it survives them:
                      without it the two abut and read as one bar of nineteen
                      rather than as ten against nine. */}
                  <span className="absolute inset-y-0 left-1/2 w-px bg-ink-muted" />
                </div>
              </td>
              <td className="py-1.5 pl-2 text-correct">{r.paired.fixed}</td>
              <td className="py-1.5 pl-6 text-ink-muted">
                {pct(r.first.accuracy)} → {pct(r.last.accuracy)} · {pct(r.last.churn)} of answers
                moved · ×{(r.last.mean_tokens / r.first.mean_tokens).toFixed(1)} the tokens ·{" "}
                {pLabel(r.paired.p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------- figure 5: the reallocation */

const RA_W = 620;
const RA_H = 196;
const RA_M = { top: 34, right: 108, bottom: 38, left: 16 };
const RA_IW = RA_W - RA_M.left - RA_M.right;
const RA_IH = RA_H - RA_M.top - RA_M.bottom;

/**
 * The handoff, drawn instead of tallied. The three stat cards it replaces each
 * restated a number already on the page: {min}→7% and {max}→43% are two points
 * on figure 2's curve, and "51 never reached" is figure 3's band and the callout
 * below. What no other figure draws is the pivot page 7 turns on — that one long
 * chain and sixteen short ones cost the SAME budget. So this figure spends that
 * budget twice down one shared token axis: once as the single chain the page
 * measured to 43%, and once as the sixteen 7%-each tries page 7 will pit against
 * it. Bar length is tokens, never accuracy: both rows reach the same right edge
 * because both spend the same 2,048, and the accuracies ride alongside as text.
 * What sixteen short chains are worth TOGETHER is drawn as a question, because
 * that is the one number on this page we have not measured.
 */
function ReallocationChart() {
  const raX = (t: number) => (t / H.max_budget) * RA_IW;
  const rowH = 30;
  const longY = 4;
  const tileY = RA_IH - rowH - 4;
  const gap = 3;
  const tileW = RA_IW / H.chains_at_min_budget - gap;
  return (
    <ChartFrame
      title={`The same ${H.max_budget} tokens spent two ways down one token axis. As one chain of ${H.max_budget} tokens it solves ${pct(
        H.accuracy_at_max,
      )} of the ${H.n_items} problems. Split into ${H.chains_at_min_budget} chains of ${H.min_budget} tokens, each solves ${pct(
        H.accuracy_at_min,
      )}; what the ${H.chains_at_min_budget} together are worth is page 7's question.`}
      width={RA_W}
      height={RA_H}
      margin={RA_M}
      xLabel={`tokens spent · ${tokens(H.max_budget)} either way`}
    >
      {/* row 1: one long chain, the ceiling the page just hit */}
      <text x={0} y={longY - 5} className="fill-ink text-[11px] font-semibold">
        one chain of {tokens(H.max_budget)}
      </text>
      <rect x={0} y={longY} width={RA_IW} height={rowH} rx={2} className="fill-compute" />
      <text
        x={RA_IW + 8}
        y={longY + rowH / 2 + 4}
        className="fill-compute text-[12px] font-semibold tabular-nums"
      >
        {pct(H.accuracy_at_max)} solved
      </text>

      {/* the two rows reach the same right edge: same budget, drawn as same width */}
      <line
        x1={RA_IW}
        x2={RA_IW}
        y1={longY}
        y2={tileY + rowH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <text
        x={RA_IW / 2}
        y={(longY + rowH + tileY) / 2 + 4}
        textAnchor="middle"
        className="fill-ink-muted text-[11px]"
      >
        the same {tokens(H.max_budget)} tokens, spent differently
      </text>

      {/* row 2: sixteen short chains, the same total width */}
      <text x={0} y={tileY - 5} className="fill-ink text-[11px] font-semibold">
        {H.chains_at_min_budget} chains of {H.min_budget}
      </text>
      {Array.from({ length: H.chains_at_min_budget }, (_, i) => (
        <rect
          key={i}
          x={i * (tileW + gap)}
          y={tileY}
          width={tileW}
          height={rowH}
          rx={1.5}
          className="fill-compute opacity-30"
        />
      ))}
      <text
        x={RA_IW + 8}
        y={tileY + rowH / 2 + 4}
        className="fill-ink-muted text-[12px] font-semibold tabular-nums"
      >
        {pct(H.accuracy_at_min)} each
      </text>

      {/* shared token axis */}
      <line x1={0} x2={RA_IW} y1={RA_IH} y2={RA_IH} className="stroke-grid" strokeWidth={1} />
      {[0, 512, 1024, 1536, 2048].map((t) => (
        <text
          key={t}
          x={raX(t)}
          y={RA_IH + 16}
          textAnchor={t === 0 ? "start" : t === H.max_budget ? "end" : "middle"}
          className="fill-ink-muted text-[10px] tabular-nums"
        >
          {t}
        </text>
      ))}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page6() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  /**
   * Three budgets, one per figure, and that is the point.
   *
   * They used to be one. The argument for it was that figures 1, 2 and 3 are
   * one measurement seen three ways, which is true, and the page said so in
   * prose: "the same dial drives the next two figures". What the reader got
   * instead was a control whose effect was off screen in both directions. The
   * stop row in step 2 also redrew the trace a screen and a half above it; the
   * line in step 3 also redrew that trace two screens above IT. Moving one
   * changed two things the reader could not see moving, which is the one
   * failure mode an explorable cannot absorb: it teaches the reader that the
   * controls do not mean anything.
   *
   * So each figure holds its own, and the invariant is carried by the axis
   * rather than by the state: all three read the same five stops off the same
   * measured grid, and a reader who wants to line them up can, deliberately.
   */
  const [traceBudget, setTraceBudget] = useState(0);
  const [curveBudget, setCurveBudget] = useState(0);
  const [stripBudget, setStripBudget] = useState(0);
  const [rowId, setRowId] = useState<string>(F1.openingId);
  const [announce, setAnnounce] = useState("");

  const row = useMemo(() => rowById(rowId), [rowId]);
  const run = row.byBudget[traceBudget];
  const zones = useMemo(() => traceZones(row, traceBudget), [row, traceBudget]);
  const natural = useMemo(() => naturalLength(row), [row]);
  /**
   * The last stop that actually cuts THIS chain. Past it the dial has travel
   * and no effect, which is a property of the problem rather than of the grid:
   * this chain stops on its own and the remaining stops have nothing left to
   * take away. Drawn on the track so it reads before the reader drags into it.
   */
  const lastBiting = useMemo(
    () => row.byBudget.reduce((last, b, i) => (b.forced ? i : last), -1),
    [row],
  );
  const curvePoint = F2.primary.points[curveBudget];

  // The cut is the figure. A trace long enough to scroll would otherwise open
  // with the cut below the fold, and the reader would meet a wall of the
  // model's working with no sign that anything had been taken away.
  const scrollRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const centreTheCut = () => {
      const box = scrollRef.current;
      const cut = cutRef.current;
      if (!box) return;
      if (!cut) {
        // Nothing was cut at this budget, so there is no cut to centre and the
        // reader should meet the chain at its beginning rather than wherever
        // the previous budget's cut left the box.
        box.scrollTop = 0;
        return;
      }
      if (box.scrollHeight <= box.clientHeight) return;
      // Measured rather than derived from offsetTop: neither node is
      // positioned, so their offsetParent is an ancestor of the page and the
      // difference between them is not the distance inside this box.
      const delta = cut.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTop = Math.max(0, box.scrollTop + delta - box.clientHeight * 0.62);
    };
    // Three times, because one measurement is taken too early to be right. The
    // first pass runs before the box has its clamped height and before the
    // serif has loaded, and both change where the cut falls; a measurement made
    // then reads as "already at the top" and leaves the cut below the fold.
    centreTheCut();
    const frame = requestAnimationFrame(centreTheCut);
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) centreTheCut();
    });
    return () => {
      live = false;
      cancelAnimationFrame(frame);
    };
  }, [rowId, traceBudget]);

  /**
   * One announcer per dial, saying what THAT figure just did. The single
   * announcer this replaces read out a trace and a population curve on every
   * move, which was accurate while the dials were shared and is a lie now.
   */
  const onTraceBudget = (i: number) => {
    recordInteraction(PAGE_N);
    setTraceBudget(i);
    const r = row.byBudget[i];
    setAnnounce(
      `Budget ${B[i]} tokens. ${
        r.forced
          ? `The chain is cut after ${r.ownTokens} tokens and made to commit`
          : `The chain finished on its own in ${r.ownTokens} tokens`
      }; it answered ${r.extractedAnswer} and graded ${r.correct ? "correct" : "wrong"}.`,
    );
  };

  const onCurveBudget = (i: number) => {
    recordInteraction(PAGE_N);
    setCurveBudget(i);
    const p = F2.primary.points[i];
    setAnnounce(
      `Budget ${B[i]} tokens. Across all ${p.n} problems, ${F2.primary.label} solves ${p.n_correct}.`,
    );
  };

  const onStripBudget = (i: number) => {
    recordInteraction(PAGE_N);
    setStripBudget(i);
    const inside = F3.items.filter((d) => d.tokens_at_max <= B[i]).length;
    setAnnounce(
      `Budget ${B[i]} tokens. ${inside} of ${F3.items.length} chains finish on their own and ${
        F3.items.length - inside
      } are still being cut.`,
    );
  };

  const onRow = (id: string) => {
    recordInteraction(PAGE_N);
    setRowId(id);
    const r = rowById(id);
    setAnnounce(
      r.firstCorrectBudget === null
        ? `Loaded a problem no budget in this grid reaches.`
        : `Loaded a problem that first grades correct at ${r.firstCorrectBudget} tokens.`,
    );
  };

  return (
    <article className="flex flex-col gap-6">
      {/* Title and the download share the top line. The page's whole claim is
          that every figure below replays from committed traces on no GPU, so the
          file that makes good on it sits top-right, reachable before the reader
          has scrolled a pixel — not buried in a footer. The run's instrument
          line used to sit here as a colophon; it belongs to the notebook and is
          left to it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Page 5 gave the model a chain. A chain has a{" "}
        <strong className="text-ink">length</strong>, and that length is compute you pay for, one
        token at a time. So put the length on a dial and turn it.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — figure 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Cut it off, make it answer
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one problem · one model · the cap on a dial
            </span>
          </h2>
          <p className="text-ink-muted">
            The dial below is <span className="font-code">max_new_tokens</span>, a hard limit on how
            much the model may write. Turn it down and the chain stops mid-thought, so at the cap we
            close its working off, start the answer line for it, and allow it{" "}
            {M.forcing.answer_allowance} more tokens to finish.
            <Cite n={REF.s1} /> That is why a starved model still
            produces an answer to grade rather than nothing at all. The tinted band in the trace
            below is that line, printed as we wrote it. Every figure on this page carries its own
            copy of this dial, so nothing you do here moves anything below.
          </p>
          <section
            aria-label="The truncation view"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-xs text-ink-muted">
              Qwen2.5-3B-Instruct at bf16, greedy · MATH-500 level {row.level},{" "}
              {row.subject.replace(/_/g, " ")}
            </p>

            {/* The question and the trace are listings of what a machine read
                and wrote, so they take the deck's one licensed non-serif face,
                the same rule page 5 settled on. */}
            <p className="font-code text-sm leading-relaxed text-ink">{tidyMath(row.question)}</p>

            <div className="flex flex-col gap-2">
              {/* Dead travel, carried by the stops themselves. Most chains
                  finish well inside the top of the grid, so on any given
                  problem the last stops cut nothing and picking one does
                  nothing. That is the same fact figure 3 draws for all 100
                  problems at once, and it is the page's finding rather than an
                  artefact of the grid, so it is drawn rather than implied. */}
              <BudgetStops
                value={traceBudget}
                onChange={onTraceBudget}
                deadFrom={lastBiting + 1}
              />
              {natural ? (
                <p className="text-xs text-ink-muted">
                  This chain runs to <strong className="text-ink">{natural.tokens} tokens</strong>{" "}
                  and stops on its own, so the dial bites at{" "}
                  {B.filter((_, i) => row.byBudget[i].forced).join(" and ")} and then has nothing
                  left to cut: {natural.fromBudget} and up are the same chain.
                </p>
              ) : (
                <p className="text-xs text-ink-muted">
                  This chain is still going at {TOP} tokens, so every stop on the dial cuts it.
                </p>
              )}
            </div>

            {/* The model's own words, then what it would have written and was
                not allowed to, then our intervention, then what it committed
                to. Four zones, four tints, and the greyed one is the point. */}
            <div className="flex flex-col rounded-lg border border-grid bg-surface-raised">
              <p className="border-b border-dashed border-grid px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                the model →
              </p>
              <div
                ref={scrollRef}
                className="max-h-64 overflow-y-auto px-3 py-2 font-code text-xs leading-relaxed"
              >
                <span className="whitespace-pre-wrap text-ink">{tidyMath(zones.own)}</span>
                {zones.wasCut ? (
                  <>
                    <span ref={cutRef} aria-hidden="true" className="font-semibold text-compute">
                      ▌
                    </span>
                    <span className="whitespace-pre-wrap text-ink-muted opacity-40">
                      {tidyMath(zones.unwritten)}
                    </span>
                  </>
                ) : null}
              </div>
              {zones.wasCut ? (
                <div className="border-t border-dashed border-grid bg-compute/10 px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-compute">
                    budget spent · we close the block and make it commit
                  </p>
                  {/* The stem is ours and stays verbatim, because it is the
                      intervention. What the model then committed to is its
                      text, and reads as maths like the rest of the trace. */}
                  <p className="mt-1 break-words text-sm text-ink">
                    <span className="font-code text-ink-muted">Final answer:</span>{" "}
                    <span className="font-semibold">{tidyMath(`\\boxed{${zones.answer}`)}</span>
                  </p>
                </div>
              ) : (
                <div className="border-t border-dashed border-grid px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                    it stopped at {run.ownTokens} tokens, inside the budget · nothing was cut and
                    nothing was forced
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg border-l-4 px-3 py-1.5 text-sm font-semibold ${
                  run.correct ? "border-correct bg-correct/15 text-correct" : "border-wrong bg-wrong/15 text-wrong"
                }`}
              >
                {run.correct ? "✓ graded correct" : "✗ graded wrong"}
              </span>
              <span className="font-mono text-sm tabular-nums text-ink-muted">
                {run.ownTokens} of {run.budget} tokens thought
              </span>
              <span className="font-mono text-sm tabular-nums text-ink-muted">
                answered {tidyMath(run.extractedAnswer) || "nothing"}
                {run.correct ? "" : ` · the answer is ${tidyMath(row.groundTruth)}`}
              </span>
            </div>

            {/* The problem picker belongs to this figure, because this figure
                is the only thing it changes. It used to sit inside figure 3,
                two screens down, on the grounds that its labels are figure 3's
                measurement; but every one of those labels is a statement about
                the flip that THIS figure draws, so the reader met the labels
                nowhere near the thing they describe.

                Labelled by what each problem demonstrates rather than by a row
                index into a sort the reader cannot see, which is what the old
                strip's buttons did. */}
            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                or run a different problem · {F3.clickableRowIds.length} of these ship with their
                full traces
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Bundled problems">
                {F3.clickableRowIds.map((id) => {
                  const r = rowById(id);
                  const d = F3.items.find((x) => x.problem_id === id);
                  const active = id === rowId;
                  const what = !d
                    ? r.flipLabel
                    : d.correct_by_budget.some(Boolean)
                      ? `needs ${r.flipLabel}`
                      : d.truncated_at_max
                        ? "cut off at every budget"
                        : `finished at ${d.tokens_at_max}, still wrong`;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onRow(id)}
                      className={`rounded border px-2 py-1 text-xs ${
                        active
                          ? "border-compute bg-compute text-canvas"
                          : "border-grid bg-surface-raised text-ink-muted"
                      }`}
                    >
                      {r.subject.replace(/_/g, " ")} · {what}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <p className="text-sm text-ink-muted">
            The grey text is what the model would have written and was not allowed to; the tinted
            line is ours, not its conclusion. Step through the stops and the verdict does not
            slide, it{" "}
            <strong className="text-ink">flips</strong>: for one problem, thinking longer is a
            threshold and not a gradient. That is Act 1&apos;s slow deliberate System 2, priced in
            the only currency a model has.
          </p>
        </section>
        {/* Both of step 1's notes share step 1's cell.
            References used to sit in a row of its own, under an EMPTY left
            cell, which cost four hundred pixels of blank page between step 1's
            closing line and step 2's heading and left the citation floating in
            the margin next to nothing. It is a sidenote to step 1, which is the
            step that carries the citation, so it belongs beside step 1's body,
            in the column's own unused height. */}
        <div className="flex flex-col gap-6 lg:pt-9">
          {/* References first: the marker it answers sits in step 1's opening
              paragraph, so the citation lands level with the sentence that
              raised it rather than a screen below. */}
          <Note kicker="References" tight>
            <RefItem n={REF.s1} href="https://arxiv.org/abs/2501.19393" preprint>
              Muennighoff et al. 2025, <em>s1: Simple Test-Time Scaling</em> (arXiv 2501.19393).
            </RefItem>
          </Note>
          <Note kicker="Try it" tight>
            <p>Step to {F1.flipBudget} tokens and back.</p>
            {/* The two arms cannot be scored against each other: the capped one
                was capped, so an overrun of its own cap is arithmetically
                impossible and reads as a result it is not. Only the request arm
                measures anything, and the line says what the cap is instead. */}
            <p>
              A cap, not a request: asked in the prompt for a sentence or two and left free to run,
              the model ran past {F1.inset.nominal_budget} tokens on{" "}
              {pct(F1.inset.soft.over_budget_rate)} of items. Every length on this page is set with{" "}
              <span className="font-code">max_new_tokens</span> instead, where the number holds
              because generation stops there.
            </p>
          </Note>
        </div>

        {/* Step 2 — figure 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The same dial, every problem
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              three checkpoints · the same {curvePoint.n} problems
            </span>
          </h2>
          <p className="text-ink-muted">
            {/* The instruction here, the reason in the margin. Both used to carry the
                reason, with "differ in size and in training" repeated word for word. */}
            One problem is an anecdote. Below is the same sweep run over all {curvePoint.n}, on
            three checkpoints: how many each solves at every stop on the dial. The line on the chart
            is this figure&apos;s own dial, so drag it. Read the shape rather than the heights.
          </p>
          <section
            aria-label="The population curve"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            {/* This figure's dial is the line ON the figure, as figure 3's is.
                It used to be a second stop row above the chart, wired to
                figure 1's budget, so a reader who moved it also redrew a trace
                a screen and a half up the page with no way of knowing. */}
            <BudgetCurve budgetIndex={curveBudget} onBudget={onCurveBudget} />
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  at {B[curveBudget]} tokens, {F2.primary.label.replace("Qwen2.5-", "")} solves
                </p>
                <p className="font-mono text-3xl tabular-nums text-ink">
                  {curvePoint.n_correct}
                  <span className="text-base text-ink-muted"> of {curvePoint.n}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  tokens generated to get there
                </p>
                <p className="font-mono text-3xl tabular-nums text-ink">
                  {tokens(curvePoint.total_tokens)}
                </p>
              </div>
              <p className="font-mono text-xs tabular-nums text-ink-muted">
                the cap bound {pct(curvePoint.truncation_rate)} of these {curvePoint.n} chains
              </p>
            </div>
            <p className="border-t border-dashed border-grid pt-3 text-xs text-ink-muted">
              <span className="font-semibold uppercase tracking-wide">the procedure</span> ·{" "}
              {PAGE6.procedure}
            </p>
          </section>
          <p className="text-sm text-ink-muted">
            Every curve climbs steeply and then enters the same slab: past{" "}
            {F2.primary.knee_budget} tokens, one more doubling moves the{" "}
            {shortLabel(F2.primary.label)} {LAST_GAIN_MOVE}, which is {LAST_GAIN_PROBLEMS} out of{" "}
            {curvePoint.n}. Three heights, one shape, and the shape is the part that is not about
            any of these checkpoints.
          </p>
        </section>
        {/* One line, and only the one the figure cannot supply. The cap rate at
            the top stop is printed under the chart already, and the reader is
            told to read the shape in the body; what neither can say is that
            these three levels are not commensurable in the first place. */}
        <Note kicker="Limits">
          <p>
            The three differ in size and in training, and the 7B ran at 8-bit against bf16 for the
            other two, so a level comparison is barred twice over.
          </p>
        </Note>

        {/* Step 3 — figure 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. It stops mattering before you run out of dial
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one square per problem · placed by how long its chain ran
            </span>
          </h2>
          <p className="text-ink-muted">
            So why does the curve flatten? Below are the same {F3.items.length} problems again, each
            one placed by how long its chain ran when nothing cut it off. The line is the budget you
            are holding: everything to its left finished on its own, everything to its right was
            still being cut, and here the line is the control: drag it along the axis and watch it
            move past the pile.
          </p>
          <section
            aria-label="The chain-length distribution"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <LengthStrip budgetIndex={stripBudget} onBudget={onStripBudget} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-compute" /> solved at some budget (
                {F3.items.length - F3.neverFlipCount})
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-wrong opacity-85" /> never solved (
                {F3.neverFlipCount})
              </span>
              {/* The dashed outline is the mark, and it sits on top of whichever
                  colour the square already has. The gutter holds one solved
                  square among its six, so the never-solved fill this swatch
                  used to carry named a colour the gutter does not all share. */}
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-dashed border-ink" /> dashed and
                off the axis: still running at {TOP}, so its length is a floor ({F3.censoredCount})
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-px bg-compute" /> the budget you are holding · drag it
              </span>
            </div>

            {/* The threshold distribution, promoted out of the old figure's
                right margin where it sat at 9px. It answers a different
                question from the strip above (how much do problems DIFFER in
                what they need) and it deserves to be legible. */}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                and where each problem first grades correct
              </p>
              {[...B.map((b) => [String(b), F3.histogram[String(b)] ?? 0] as const), ["never", F3.neverFlipCount] as const].map(
                ([label, n]) => (
                  <div key={label} className="grid grid-cols-[3.2rem_minmax(0,1fr)_1.6rem] items-center gap-2">
                    <span className="text-right font-mono text-xs tabular-nums text-ink-muted">
                      {label}
                    </span>
                    <span className="h-3 rounded-sm bg-surface-raised">
                      <span
                        className={`block h-3 rounded-sm ${label === "never" ? "bg-wrong" : "bg-compute"}`}
                        style={{ width: `${(n / F3.neverFlipCount) * 100}%` }}
                      />
                    </span>
                    <span className="font-mono text-xs tabular-nums text-ink-muted">{n}</span>
                  </div>
                ),
              )}
            </div>

          </section>
          <p className="text-sm text-ink-muted">
            At {TOP} tokens the shaded strip holds {F3.censoredCount} squares. Every other chain
            stopped when it had nothing left to say, a median of {F3.medianLengthNever} tokens for
            the ones that never come right, with {TOP - F3.medianLengthNever} still unspent. So{" "}
            <strong className="text-ink">
              {F3.neverFlipFinishedCount} of these problems did not run out of room, they ran out of
              ideas
            </strong>
            . The dial was never what was holding them back.
          </p>
        </section>
        <Note kicker="Try it">
          <p>
            Drag the line from {B[0]} to {TOP} and watch the shaded strip empty out.
          </p>
          <p>
            <em>Not reached at any length we ran</em> means this grid at this decoding, never a
            claim that those problems are unsolvable. Page 7 changes the decoding.
          </p>
        </Note>

        {/* Step 4 — figure 4, the other direction */}
        {FW ? (
          <>
            <section className="flex min-w-0 flex-col gap-3">
              <h2 className="text-xl font-semibold text-ink">
                4. The other direction: refuse to let it stop
                <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                  the same {H.n_items} problems · not allowed to stop
                </span>
              </h2>
              <section
                aria-label="The extension arm"
                className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
              >
                <p className="text-sm text-ink-muted">
                  Everything above takes room away. This does the opposite: when the model tries
                  to end its turn, the stop is dropped, the word{" "}
                  <span className="font-mono text-ink">{FW.word}</span> is appended to what it has
                  written, and it carries on. {FW.waits[FW.waits.length - 1]} times over.
                </p>

                {/* The finding is a swap, so the figure is a crossing. The two
                    pictures this replaces were a hundred squares whose
                    arrangement is not data and three flat accuracy lines, and
                    between them they asked the reader to hold "almost nothing
                    changed" and "a third of the answers changed" in mind at
                    once without drawing either. */}
                <WaitCrossing />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-5 rounded-sm bg-correct opacity-60" /> wrong, then right
                    once it could not stop ({WAIT_TABLE!.table.afterOnly})
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-5 rounded-sm bg-wrong opacity-60" /> right, then wrong (
                    {WAIT_TABLE!.table.beforeOnly})
                  </span>
                  {/* Four bands, four entries. The legend used to fold the two
                      concordant ones into a single grey swatch, which is not
                      what the figure draws: a problem right at both ends keeps
                      the tint it has at both ends. */}
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-5 rounded-sm bg-correct opacity-20" /> right either way (
                    {WAIT_TABLE!.table.both})
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-5 rounded-sm bg-ink opacity-10" /> wrong either way (
                    {WAIT_TABLE!.table.neither})
                  </span>
                </div>

                <p className="text-sm text-ink">
                  {WAIT_TABLE!.table.afterOnly} answers turned from wrong to right against{" "}
                  {WAIT_TABLE!.table.beforeOnly} that turned from right to wrong,{" "}
                  {pLabel(WAIT_TABLE!.p)}. Both crossings are thick and they cancel. In all{" "}
                  {pct(WAIT_TABLE!.churn)} of answers moved, because a further{" "}
                  {WAIT_TABLE!.movedWithoutChangingTheVerdict} swapped one wrong answer for another
                  and never touched the verdict.
                </p>

                {/* What the three accuracy lines were for, drawn as the widths
                    of the two things that crossed. */}
                <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    and the same crossing on all three checkpoints
                  </p>
                  <WaitLedger />
                  <p className="text-xs text-ink-muted">
                    Both counts are against the same problem at zero injections, so they are paired.
                  </p>
                </div>
              </section>
              <p className="text-sm text-ink-muted">
                It <strong className="text-ink">redistributes rather than adds</strong>. Spending{" "}
                {WAIT_COST_RANGE} the tokens buys a third of the answers changed and no more of them
                right: across the three checkpoints it turns{" "}
                {FW.curves.reduce((n, c) => n + c.paired[c.paired.length - 1].fixed, 0)} wrong
                answers right and{" "}
                {FW.curves.reduce((n, c) => n + c.paired[c.paired.length - 1].broken, 0)} right
                answers wrong. Not one of the three crossings resolves, so the direction is a null
                and not a finding: what is measured here is that a great deal moved and the totals
                did not.
              </p>
            </section>
            {/* No margin note here. It said "watch the bars, not the lines", which was
                advice for a figure that led with the lines; the crossing leads now and
                the takeaway above it is the same sentence, better placed. */}
            <div aria-hidden="true" />
          </>
        ) : null}

        {/* Close */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            5. Where the length runs out
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              the same {tokens(H.max_budget)} tokens · two ways to spend them
            </span>
          </h2>
          <p className="text-ink-muted">
            The dial flattened at {pct(H.accuracy_at_max)}, and {pct(F3.neverFlipShare)} of these
            problems never came right at any length. But a budget is not a length: the same{" "}
            {tokens(H.max_budget)} tokens can be one long chain or {H.chains_at_min_budget} short
            ones, and page 7 turns on the difference.
          </p>
          {/* The three stat cards this replaces each restated a number already
              drawn above — 7% and 43% are two points on figure 2's curve, and
              "51 never reached" is figure 3's band. The reallocation is the one
              thing no other figure shows, so it gets the picture. */}
          <section
            aria-label="The same budget, spent two ways"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <ReallocationChart />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute" /> one chain of{" "}
                {tokens(H.max_budget)} → {pct(H.accuracy_at_max)} solved
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute opacity-30" />{" "}
                {H.chains_at_min_budget} chains of {H.min_budget} → {pct(H.accuracy_at_min)} each
              </span>
              <span>bar length is the token budget; both rows spend {tokens(H.max_budget)}.</span>
            </div>
          </section>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong className="text-ink">The dial has a far end, and you have reached it.</strong>{" "}
            This is inference-time scaling in its simplest form: the curve flattens, and{" "}
            {pct(F3.neverFlipShare)} of these problems are not reached at any length we ran. A
            problem <em>this</em> chain cannot solve, it cannot solve by being longer.{" "}
            {/* The pivot page 7 needs, and the one thing this close was missing: a second
                chain is not a longer chain. Step 4 already measured that the model has more
                than one answer in it, so the handoff cites it rather than asserting it. */}
            {WAIT_TABLE ? (
              <>
                A different chain is another matter. Refusing to let this same model stop moved{" "}
                {pct(WAIT_TABLE.churn)} of its answers without improving them: there is more than
                one answer in there, and one run only ever shows you one of them.{" "}
              </>
            ) : null}
            So spend the same {tokens(H.max_budget)} tokens on {H.chains_at_min_budget} chains of{" "}
            {H.min_budget} instead of one long one, sampled rather than greedy so they can differ.{" "}
            <em>
              Page 7 asks what {H.chains_at_min_budget} voters at {pct(H.accuracy_at_min)} each are
              worth.
            </em>
          </div>
        </section>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
