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
 *   log x-axis, marker tracking step 1's dial so the two figures are one
 *   instrument. The y-axis is deliberately quiet: the SHAPE is the claim and
 *   the levels are not. The procedure line under the figure is what makes this
 *   re-derivable rather than merely reproducible.
 *
 *   Step 3 — figure 3, the flip-point strip. One row per problem, sorted by the
 *   budget at which it first grades correct. The band that never turns is the
 *   payload and the handoff: those problems are not budget-limited.
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
 *     Page 17 owns that finding; this page owns the flattening.
 *   · the inset measures RELIABILITY, not overshoot. Asking for brevity held
 *     the mean under the line and missed it on a quarter of items; the cap
 *     missed on none. Do not caption it as "the soft request overspends" — that
 *     was the expectation, and it is not what the run says.
 *   · budget forcing gets an author-year cite with NO numbers attached. We show
 *     our curve, not theirs.
 */

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { PAGE6, naturalLength, pct, rowById, tidyMath, tokens, traceZones } from "@/lib/page06";
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

const RUN_DATE = M.timestamp_utc.slice(0, 10);
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

/** Cited for the technique it introduced. No number of theirs appears here. */
const S1: Citation = {
  ref: "Muennighoff et al. 2025",
  url: "https://arxiv.org/abs/2501.19393",
  venue: "arXiv",
  preprint: true,
};

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

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const C_W = 620;
const C_H = 262;
const C_M = { top: 22, right: 104, bottom: 46, left: 52 };
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
function BudgetCurve({ budgetIndex }: { budgetIndex: number }) {
  const markX = cx(B[budgetIndex]);
  const knee = F2.primary.knee_budget!;
  const kneeX = cx(knee);
  const lastGain = F2.primary.gains[F2.primary.gains.length - 1].gain_pts;
  return (
    <ChartFrame
      title={`Share of 100 MATH-500 level 4 and 5 problems solved against the token budget, on a log axis, for three Qwen2.5-Instruct checkpoints. ${F2.curves
        .map(
          (c) =>
            `${c.label}: ${c.points.map((p) => `${pct(p.accuracy)} at ${p.budget} tokens`).join(", ")}`,
        )
        .join(". ")}. Every curve bends at ${knee} tokens. The marker is at ${B[budgetIndex]} tokens.`}
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
        {lastGain > 0
          ? `past here, doubling buys ${lastGain.toFixed(0)} point`
          : "past here, doubling stops paying"}
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

      <line
        x1={markX}
        x2={markX}
        y1={0}
        y2={C_IH}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="3 3"
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
  const atTop = budgetIndex === B.length - 1;
  const svgRef = useRef<SVGSVGElement | null>(null);

  /**
   * Here the line IS the control, so this figure carries no widget of its own.
   * The reader is already looking at the line when the prose asks them to move
   * it, and a stop row under this chart would be a third copy of a control
   * whose whole job on this page is to be somewhere else.
   *
   * Client pixels go through the svg's own coordinate space, because the chart
   * scales to fit its column, and they snap to a stop: the budget is one of
   * five values, and a line resting between two of them would be a lie.
   */
  const indexFromClient = useCallback((clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const scale = (r.width || S_W) / S_W;
    const local = (clientX - r.left) / (scale || 1) - S_M.left;
    let best = 0;
    for (let i = 1; i < B.length; i++) {
      if (Math.abs(lengthX(B[i]) - local) < Math.abs(lengthX(B[best]) - local)) best = i;
    }
    return best;
  }, []);

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

      {/* Grab anywhere along the plot rather than having to hit the rule. It
          sits under the line and over the squares, so a drag that starts on a
          problem still moves the budget. */}
      <rect
        x={0}
        y={0}
        width={S_IW}
        height={S_IH}
        fill="transparent"
        className="cursor-ew-resize"
        onPointerDown={onPointer}
        onPointerMove={onPointer}
      />

      <g
        role="slider"
        tabIndex={0}
        aria-label="Token budget"
        aria-valuemin={B[0]}
        aria-valuemax={TOP}
        aria-valuenow={budget}
        aria-valuetext={`${budget} tokens`}
        onKeyDown={onKey}
        className="cursor-ew-resize focus:outline-none"
      >
        <line x1={bx} x2={bx} y1={-6} y2={S_IH} className="stroke-compute" strokeWidth={2} />
        {/* The handle is what says "this moves", and it is also the focus ring
            target, so keyboard and pointer readers are looking at one object. */}
        <rect
          x={bx - 4}
          y={-12}
          width={8}
          height={10}
          rx={2}
          className="fill-compute"
        />
        <text
          x={atTop ? bx - 8 : bx + 8}
          y={-3}
          textAnchor={atTop ? "end" : "start"}
          className="fill-compute text-[10px] font-semibold tabular-nums"
        >
          {budget}
        </text>
      </g>
    </ChartFrame>
  );
}


/* ------------------------------------------------------------------ figure 4 */

const K_W = 620;
const K_H = 250;
const K_M = { top: 22, right: 104, bottom: 46, left: 52 };
const K_IW = K_W - K_M.left - K_M.right;
const K_IH = K_H - K_M.top - K_M.bottom;

/**
 * The other direction: not a cap, but a refusal to let the model stop. Accuracy
 * against the number of injections, same items, same grader.
 *
 * The figure has to make a flat line readable, because a flat line here has two
 * completely different causes. So churn rides underneath it as a bar: the share
 * whose committed answer moved at all. Three curves that barely move over bars
 * that are large is the finding — it is doing plenty, and none of it helps.
 */
function WaitCurve() {
  if (!FW) return null;
  const ks = FW.waits;
  const kx = (k: number) => (k / (ks[ks.length - 1] || 1)) * K_IW;
  const ky = (a: number) => K_IH - a * K_IH;
  const primary = FW.curves.find((c) => c.model_id === F2.primary.model_id) ?? FW.curves[0];
  return (
    <ChartFrame
      title={`Share of problems solved against the number of "${FW.word}" injections, for three Qwen2.5-Instruct checkpoints. ${FW.curves
        .map((c) => `${c.label}: ${c.points.map((p) => `${pct(p.accuracy)} at ${p.waits}`).join(", ")}`)
        .join(". ")}. Churn, the share whose answer moved at all, reaches ${pct(
        primary.points[primary.points.length - 1].churn,
      )} on the ${shortLabel(primary.label)}.`}
      width={K_W}
      height={K_H}
      margin={K_M}
      xLabel={`number of "${FW.word}" injections`}
      yLabel="solved (%)"
    >
      {[0, 0.2, 0.4, 0.6].map((t) => (
        <g key={t}>
          <line x1={0} x2={K_IW} y1={ky(t)} y2={ky(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={ky(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t * 100}
          </text>
        </g>
      ))}

      {/* churn under the curves: what moved, whether or not it helped */}
      {primary.points.map((p) =>
        p.churn > 0 ? (
          <rect
            key={p.waits}
            x={kx(p.waits) - 9}
            y={K_IH - p.churn * K_IH}
            width={18}
            height={p.churn * K_IH}
            className="fill-wrong opacity-20"
          />
        ) : null,
      )}
      <text x={kx(ks[ks.length - 1]) + 8} y={K_IH - primary.points[ks.length - 1].churn * K_IH + 4}
            className="fill-wrong text-[10px]">
        churn {pct(primary.points[ks.length - 1].churn)}
      </text>

      {ks.map((k) => (
        <text key={k} x={kx(k)} y={K_IH + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
          {k}
        </text>
      ))}

      {FW.curves.map((c) => {
        const isP = c.model_id === primary.model_id;
        const last = c.points[c.points.length - 1];
        return (
          <g key={c.model_id}>
            <polyline
              points={c.points.map((p) => `${kx(p.waits)},${ky(p.accuracy)}`).join(" ")}
              fill="none"
              className={curveStroke(c.model_id)}
              strokeWidth={isP ? 2.5 : 1.25}
            />
            {c.points.map((p) => (
              <circle key={p.waits} cx={kx(p.waits)} cy={ky(p.accuracy)} r={isP ? 3.5 : 2}
                      className={curveFill(c.model_id)} />
            ))}
            <text x={K_IW + 8} y={ky(last.accuracy) + 4}
                  className={`${curveFill(c.model_id)} text-[11px] ${isP ? "font-semibold" : ""}`}>
              {shortLabel(c.label)}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page6() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [budgetIndex, setBudgetIndex] = useState(0);
  const [rowId, setRowId] = useState<string>(F1.openingId);
  const [announce, setAnnounce] = useState("");

  const row = useMemo(() => rowById(rowId), [rowId]);
  const run = row.byBudget[budgetIndex];
  const zones = useMemo(() => traceZones(row, budgetIndex), [row, budgetIndex]);
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
  const curvePoint = F2.primary.points[budgetIndex];

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
  }, [rowId, budgetIndex]);

  const onBudget = (i: number) => {
    recordInteraction(PAGE_N);
    setBudgetIndex(i);
    const r = row.byBudget[i];
    setAnnounce(
      `Budget ${B[i]} tokens. ${
        r.forced
          ? `The chain is cut after ${r.ownTokens} tokens and made to commit`
          : `The chain finished on its own in ${r.ownTokens} tokens`
      }; it answered ${r.extractedAnswer} and graded ${r.correct ? "correct" : "wrong"}. Across all ${curvePoint.n} problems, ${F2.primary.label} solves ${F2.primary.points[i].n_correct}.`,
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
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Page 5 gave the model a chain. A chain has a{" "}
        <strong className="text-ink">length</strong>, and that length is compute you pay for, one
        token at a time. So put the length on a dial and turn it.
      </p>

      {/* Provenance as a colophon, not as chrome: hairlines, no fill, one line
          naming the instrument, and the download as the only lit element. It is
          the pipeline's whole claim, so it stays above the fold. */}
      <div className="flex flex-col gap-3 border-y border-grid py-3">
        <p className="text-xs text-ink-muted">
          Qwen2.5-Instruct at 1.5B, 3B and 7B, greedy, budget forced at the cap; MATH-500 levels 4
          and 5, n = {M.items.n} items across {B.length} budgets, {tokens(M.integrity.n_records)}{" "}
          records, run <span className="font-mono">{M.run_id}</span>, {RUN_DATE}. Every figure below
          is one measurement of ours, not a redrawing of anyone&apos;s.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            className="rounded border border-compute px-3 py-1.5 text-sm font-semibold text-compute"
            href={NOTEBOOK_ZIP}
            download
          >
            Download the notebook, the harness and every trace ({NOTEBOOK_SIZE})
          </a>
          <span className="text-xs text-ink-muted">
            it opens in a replay mode that redraws every figure here from those traces, on no GPU,
            in about a minute
          </span>
        </div>
      </div>

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
            {M.forcing.answer_allowance} more tokens to finish. That is why a starved model still
            produces an answer to grade rather than nothing at all. The tinted band in the trace
            below is that line, printed as we wrote it. The same dial drives the next two figures.
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
                value={budgetIndex}
                onChange={onBudget}
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
                or run a different problem · nine of these ship with their full traces
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
        <Note kicker="Try it">
          <p>Step to {F1.flipBudget} tokens and back.</p>
          <p>
            A cap, not a request: asked in the prompt for a sentence or two, the model ran past{" "}
            {F1.inset.nominal_budget} tokens on {pct(F1.inset.soft.over_budget_rate)} of items. Held
            to the same {F1.inset.nominal_budget} by{" "}
            <span className="font-code">max_new_tokens</span>, it overran on none.
          </p>
        </Note>

        {/* Step 2 — figure 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The same dial, every problem
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              three checkpoints · the same {curvePoint.n} problems
            </span>
          </h2>
          <p className="text-ink-muted">
            One problem is an anecdote. Below is the same sweep run over all {curvePoint.n}, on
            three checkpoints: how many each solves at every stop on the dial. Read the shape rather
            than the heights, because the three differ in size and in training and the largest ran
            at a different precision.
          </p>
          <section
            aria-label="The population curve"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            {/* The same budget as figure 1, which is the section's whole
                point, so the control comes with it rather than being left a
                screen and a half up the page. */}
            <BudgetStops value={budgetIndex} onChange={onBudget} />
            <BudgetCurve budgetIndex={budgetIndex} />
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  at {B[budgetIndex]} tokens, {F2.primary.label.replace("Qwen2.5-", "")} solves
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
        <Note kicker="Cited for the technique">
          <div className="flex flex-wrap gap-2">
            <CitationBadge citation={S1} />
          </div>
          <p>
            The heights are not a claim. The three differ in size and in training, and the 7B ran at
            8-bit against bf16 for the other two, so a level comparison is barred twice over.
          </p>
          <p>
            {pct(F2.primary.points[B.length - 1].truncation_rate)} of chains still hit the cap at{" "}
            {TOP}, which understates the right-hand end rather than flattering it.
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
            <LengthStrip budgetIndex={budgetIndex} onBudget={onBudget} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-compute" /> solved at some budget (
                {F3.items.length - F3.neverFlipCount})
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-wrong opacity-85" /> never solved (
                {F3.neverFlipCount})
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-dashed border-ink bg-wrong opacity-85" />{" "}
                still running at {TOP}, so its length is a floor ({F3.censoredCount})
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
              {F3.neverFlipCount - F3.censoredCount} of these problems did not run out of room, they
              ran out of ideas
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
                  the same {H.n_items} problems · told to keep going
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
                <WaitCurve />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] text-left text-xs tabular-nums">
                    <thead className="text-ink-muted">
                      <tr>
                        <th className="py-1 pr-3 font-semibold">checkpoint</th>
                        <th className="py-1 pr-3 font-semibold">at 0</th>
                        <th className="py-1 pr-3 font-semibold">
                          at {FW.waits[FW.waits.length - 1]}
                        </th>
                        <th className="py-1 pr-3 font-semibold">answers moved</th>
                        <th className="py-1 pr-3 font-semibold">fixed</th>
                        <th className="py-1 pr-3 font-semibold">broken</th>
                        <th className="py-1 font-semibold">tokens</th>
                      </tr>
                    </thead>
                    <tbody className="text-ink">
                      {FW.curves.map((c) => {
                        const first = c.points[0];
                        const last = c.points[c.points.length - 1];
                        const paired = c.paired[c.paired.length - 1];
                        return (
                          <tr key={c.model_id} className="border-t border-grid">
                            <td className="py-1 pr-3">{shortLabel(c.label)}</td>
                            <td className="py-1 pr-3">{pct(first.accuracy)}</td>
                            <td className="py-1 pr-3">{pct(last.accuracy)}</td>
                            <td className="py-1 pr-3">{pct(last.churn)}</td>
                            <td className="py-1 pr-3 text-correct">{paired.fixed}</td>
                            <td className="py-1 pr-3 text-wrong">{paired.broken}</td>
                            <td className="py-1">
                              ×{(last.mean_tokens / first.mean_tokens).toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-ink-muted">
                  Fixed and broken are counted against the same item at zero injections, so they
                  are paired. A net near zero with both columns large is a different result from
                  nothing happening, which is what the moved-answers column is there to tell you.
                </p>
              </section>
              <p className="text-sm text-ink-muted">
                It <strong className="text-ink">redistributes rather than adds</strong>. Roughly
                double the tokens buys a third of the answers changed and no more of them right:
                across the three checkpoints it rescues{" "}
                {FW.curves.reduce((n, c) => n + c.paired[c.paired.length - 1].fixed, 0)} problems
                and wrecks{" "}
                {FW.curves.reduce((n, c) => n + c.paired[c.paired.length - 1].broken, 0)}. The
                model was not holding back; it had already spent what the problem was worth to it.
              </p>
            </section>
            <Note kicker="Reading it">
              <p>Watch the bars, not the lines: the flat curve is a lot of motion going nowhere.</p>
            </Note>
          </>
        ) : null}

        {/* Close */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">5. Where the length runs out</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col rounded-lg border-l-4 border-wrong bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  one chain of {H.min_budget}
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">{pct(H.accuracy_at_min)}</p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">solved</p>
              </div>
              <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                  one chain of {tokens(H.max_budget)}
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">{pct(H.accuracy_at_max)}</p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  {Math.round(H.mean_tokens_at_max)} tokens spent per problem
                </p>
              </div>
              <div className="flex flex-col rounded-lg border-l-4 border-grid bg-surface-raised px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  never reached
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">
                  {F3.neverFlipCount} of {F3.items.length}
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  at any length we ran
                </p>
              </div>
            </div>
          </div>
          <p className="rounded border-l-4 border-compute bg-surface p-4 text-base text-ink">
            <strong className="text-ink">The dial has a far end, and you have reached it.</strong>{" "}
            This is inference-time scaling in its simplest form: the curve flattens, and{" "}
            {pct(F3.neverFlipShare)} of these problems are not reached at any length we ran. A
            problem this chain cannot solve, it cannot solve by being longer. So spend the same{" "}
            {tokens(H.max_budget)} tokens differently: {H.chains_at_min_budget} chains of{" "}
            {H.min_budget} instead of one long one.{" "}
            <em>
              Page 7 asks what {H.chains_at_min_budget} voters at {pct(H.accuracy_at_min)} each are
              worth.
            </em>
          </p>
        </section>
        <Note kicker="One measurement with page 5, not two">
          {H.page_5_endpoints ? (
            <p>
              Page 5 measured both ends of the segment swept here: forbidden to reason the 3B scores{" "}
              {pct(H.page_5_endpoints.suppressed)} at {H.page_5_endpoints.suppressed_tokens} tokens,
              and left alone it scores {pct(H.page_5_endpoints.unconstrained)} at{" "}
              {H.page_5_endpoints.unconstrained_tokens}. This page fills in the middle.
            </p>
          ) : null}
          <p>
            The 3B&apos;s last doubling moves it {LAST_GAIN_MOVE}, {LAST_GAIN_PROBLEMS} out of{" "}
            {curvePoint.n}, drawn as measured and too small to read either way. Page 17 owns
            overthinking; this page owns the flattening.
          </p>
        </Note>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
