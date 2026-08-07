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

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
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

/** The download: notebook + harness + every generation the page rests on. */
const NOTEBOOK_ZIP = "/notebooks/page-06-thinking-longer.zip";
const NOTEBOOK_SIZE = "1.3 MB";

const RUN_DATE = M.timestamp_utc.slice(0, 10);
const TOP = B[B.length - 1];

/** Cited for the technique it introduced. No number of theirs appears here. */
const S1: Citation = {
  ref: "Muennighoff et al. 2025",
  url: "https://arxiv.org/abs/2501.19393",
  venue: "preprint",
  preprint: true,
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
const S_M = { top: 18, right: 122, bottom: 44, left: 58 };
const S_IW = S_W - S_M.left - S_M.right;
const S_IH = S_H - S_M.top - S_M.bottom;

/**
 * One row per problem, sorted by flip point, so each row is a step and the
 * smooth climb in figure 2 is revealed as the average of a hundred steps
 * landing in different places. Regressions (correct, then wrong again at a
 * larger budget) are marked rather than hidden, which is why a flip point is
 * defined as FIRST correct and not permanently correct.
 *
 * Two marks do the teaching. The y axis is labelled easy at the top and hard at
 * the bottom, because without it a reader has no reason to know the rows are
 * sorted at all. And the boundary between unsolved and solved is drawn as a
 * heavy staircase: that line IS "the budget this problem needs", which is the
 * section's title and was previously only implied by where the colour changed.
 * It runs off the right-hand edge at the never-flipping band, which is the
 * whole handoff in one stroke.
 */
function FlipStrip({ budgetIndex, selectedId }: { budgetIndex: number; selectedId: string }) {
  const items = F3.items;
  const rowH = S_IH / items.length;
  const colW = S_IW / B.length;
  const firstNever = items.findIndex((d) => d.first_correct_budget === null);
  const selectedIndex = items.findIndex((d) => d.problem_id === selectedId);
  const maxHist = Math.max(...Object.values(F3.histogram), F3.neverFlipCount);

  // The staircase along the unsolved/solved boundary. Two points per row, so
  // the polyline turns a corner wherever the required budget changes; past the
  // last problem that flips it leaves the chart to the right, because those
  // problems' budget is not on this axis.
  const frontier: string[] = [];
  const flipping = firstNever >= 0 ? firstNever : items.length;
  for (let i = 0; i < flipping; i++) {
    const x = items[i].correct_by_budget.findIndex(Boolean) * colW;
    frontier.push(`${x},${i * rowH}`, `${x},${(i + 1) * rowH}`);
  }
  if (firstNever >= 0) frontier.push(`${S_IW},${flipping * rowH}`);

  return (
    <ChartFrame
      title={`One row per problem, ${items.length} problems sorted by the budget at which each first grades correct, for ${F3.modelId}. ${Object.entries(
        F3.histogram,
      )
        .map(([b, n]) => `${n} first solved at ${b} tokens`)
        .join(", ")}, and ${F3.neverFlipCount} never solved at any budget in this grid.`}
      width={S_W}
      height={S_H}
      margin={S_M}
      xLabel="token budget"
    >
      {items.map((d, y) =>
        d.correct_by_budget.map((solved, x) =>
          solved ? (
            <rect
              key={`${y}-${x}`}
              x={x * colW}
              y={y * rowH}
              width={colW}
              // A hair over one row: at a hundred rows the fractional y values
              // would otherwise antialias a white seam through every band.
              height={Math.max(rowH + 0.6, 1)}
              className="fill-compute"
            />
          ) : null,
        ),
      )}

      {/* regressions: solved once, wrong again at a larger budget */}
      {items.map((d, y) =>
        d.monotone
          ? null
          : d.correct_by_budget.map((solved, x) =>
              !solved && d.correct_by_budget.slice(0, x).some(Boolean) ? (
                <circle
                  key={`r-${y}-${x}`}
                  cx={x * colW + colW / 2}
                  cy={y * rowH + rowH / 2}
                  r={1.8}
                  className="fill-wrong"
                />
              ) : null,
            ),
      )}

      {/* where the dial runs out */}
      {firstNever >= 0 ? (
        <>
          <line
            x1={0}
            x2={S_IW}
            y1={firstNever * rowH}
            y2={firstNever * rowH}
            className="stroke-wrong"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={S_IW + 8}
            y={firstNever * rowH + (S_IH - firstNever * rowH) / 2}
            className="fill-wrong text-[11px] font-semibold"
          >
            never flips
          </text>
          <text
            x={S_IW + 8}
            y={firstNever * rowH + (S_IH - firstNever * rowH) / 2 + 13}
            className="fill-ink-muted text-[10px]"
          >
            {F3.neverFlipCount} of {items.length}
          </text>
        </>
      ) : null}

      {/* The budget each problem needs. The staircase is the figure's claim:
          not "more is better" but "each problem has a threshold, and they are
          not the same threshold".

          Drawn twice. The line sits exactly on the boundary, so half its width
          falls on the solved fill, where near-black on dark teal is invisible;
          a casing in the page colour underneath lifts it off the fill and the
          staircase reads as an edge on both sides. */}
      <polyline
        points={frontier.join(" ")}
        fill="none"
        className="stroke-canvas"
        strokeWidth={4.5}
      />
      <polyline points={frontier.join(" ")} fill="none" className="stroke-ink" strokeWidth={1.75} />

      {/* the budget the reader is holding, dashed compute as in figure 2 */}
      <line
        x1={(budgetIndex + 1) * colW}
        x2={(budgetIndex + 1) * colW}
        y1={0}
        y2={S_IH}
        className="stroke-compute"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />

      {/* easy at the top, hard at the bottom: without this the sort is invisible */}
      <text x={-10} y={10} textAnchor="end" className="fill-ink-muted text-[10px] font-semibold">
        easy
      </text>
      <text x={-10} y={S_IH - 2} textAnchor="end" className="fill-ink-muted text-[10px] font-semibold">
        hard
      </text>
      <line x1={-16} x2={-16} y1={14} y2={S_IH - 14} className="stroke-grid" strokeWidth={1} />
      <text
        x={-16}
        y={S_IH / 2}
        textAnchor="middle"
        transform={`rotate(-90, -16, ${S_IH / 2})`}
        className="fill-ink-muted text-[9px]"
      >
        <tspan dy={-4}>{items.length} problems</tspan>
      </text>

      {/* the problem currently loaded into figure 1 */}
      {selectedIndex >= 0 ? (
        <g>
          <line
            x1={-6}
            x2={S_IW}
            y1={selectedIndex * rowH + rowH / 2}
            y2={selectedIndex * rowH + rowH / 2}
            className="stroke-ink opacity-40"
            strokeWidth={0.75}
          />
          <text x={-10} y={selectedIndex * rowH + rowH / 2 + 3} textAnchor="end" className="fill-ink text-[10px]">
            ▸
          </text>
        </g>
      ) : null}

      {B.map((b, i) => (
        <text
          key={b}
          x={i * colW + colW / 2}
          y={S_IH + 16}
          textAnchor="middle"
          className="fill-ink-muted text-[11px]"
        >
          {b}
        </text>
      ))}

      {/* the flip-point distribution, as the strip's own margin */}
      {[...B.map((b) => [String(b), F3.histogram[String(b)] ?? 0] as const), ["never", F3.neverFlipCount] as const].map(
        ([label, n], i) => {
          const barY = i * 14 + 2;
          return (
            <g key={label} transform={`translate(${S_IW + 62}, 0)`}>
              <rect
                x={0}
                y={barY}
                width={(n / maxHist) * 44}
                height={9}
                className={label === "never" ? "fill-wrong" : "fill-compute"}
              />
              <text x={-4} y={barY + 8} textAnchor="end" className="fill-ink-muted text-[9px]">
                {label}
              </text>
              <text x={(n / maxHist) * 44 + 3} y={barY + 8} className="fill-ink-muted text-[9px] tabular-nums">
                {n}
              </text>
            </g>
          );
        },
      )}
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
          records, {RUN_DATE}. Every figure below is one measurement of ours, not a redrawing of
          anyone&apos;s.
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
          <section
            aria-label="The truncation view"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-xs text-ink-muted">
              Qwen2.5-3B-Instruct at bf16, greedy · MATH-500 level {row.level},{" "}
              {row.subject.replace(/_/g, " ")}
            </p>

            <p className="text-lg text-ink">{tidyMath(row.question)}</p>

            <div className="flex flex-col gap-1">
              <Slider
                label="Token budget"
                min={0}
                max={B.length - 1}
                value={budgetIndex}
                onChange={onBudget}
                format={(i) => String(B[i])}
                suffix=" tokens"
              />
              {/* A stop this chain is actually cut at reads in ink; a stop it
                  already finished inside is greyed, so the dead travel at the
                  top of the dial is visible before the reader drags into it. */}
              <div
                aria-hidden="true"
                className="flex justify-between px-0.5 font-mono text-[10px] tabular-nums"
              >
                {B.map((b, i) => (
                  <span
                    key={b}
                    className={row.byBudget[i].forced ? "text-ink" : "text-ink-muted opacity-50"}
                  >
                    {b}
                  </span>
                ))}
              </div>
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
              <div ref={scrollRef} className="max-h-64 overflow-y-auto px-3 py-2 text-sm leading-relaxed">
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

            {/* Inset: asked nicely versus cut off. Read the reliability, not
                the means: the arms ran to different caps, so their token totals
                and their scores are not a like-for-like comparison. */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                asked nicely vs cut off · {F1.inset.n} items at a nominal {F1.inset.nominal_budget}{" "}
                tokens
              </p>
              {(
                [
                  ["asked nicely in the prompt", F1.inset.soft, "bg-wrong"],
                  [`capped at ${F1.inset.nominal_budget}`, F1.inset.hard, "bg-compute"],
                ] as const
              ).map(([label, arm, tone]) => (
                <div key={label} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="text-xs text-ink">{label}</span>
                  <span className="h-3 w-full rounded-sm bg-surface-raised">
                    <span
                      className={`block h-3 rounded-sm ${tone}`}
                      style={{ width: `${Math.max(arm.over_budget_rate * 100, 1)}%` }}
                    />
                  </span>
                  <span className="font-mono text-xs tabular-nums text-ink-muted">
                    {pct(arm.over_budget_rate)} over
                  </span>
                </div>
              ))}
              <p className="text-xs text-ink-muted">
                Same nominal length, two ways of imposing it. The request holds the median under the
                line ({F1.inset.soft.median_own_tokens} tokens) and then misses it on{" "}
                {pct(F1.inset.soft.over_budget_rate)} of items;{" "}
                <span className="font-mono">max_new_tokens</span> misses on none. A prompt is a
                preference, not a cap.
              </p>
              <p className="text-xs text-ink-muted">
                Read the token columns and not the scores: the two arms ran to different caps, so
                what they solved is not comparable and this page does not compare it.
              </p>
            </div>
          </section>
          <p className="text-sm text-ink-muted">
            The grey text is what the model would have written and was not allowed to; the tinted
            line is ours, not its conclusion. Drag the dial and the verdict does not slide, it{" "}
            <strong className="text-ink">flips</strong>: for one problem, thinking longer is a
            threshold and not a gradient. That is Act 1&apos;s slow deliberate System 2, priced in
            the only currency a model has.
          </p>
        </section>
        <Note kicker="Try it">
          <p>Drag to {F1.flipBudget} tokens and back.</p>
        </Note>

        {/* Step 2 — figure 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The same dial, every problem
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              three checkpoints · the same {curvePoint.n} problems
            </span>
          </h2>
          <section
            aria-label="The population curve"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
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
            {shortLabel(F2.primary.label)} by{" "}
            {F2.primary.gains[F2.primary.gains.length - 1].gain_pts.toFixed(0)} point, which is one
            problem out of {curvePoint.n}. Three heights, one shape, and the shape is the part that
            is not about any of these checkpoints.
          </p>
        </section>
        <Note kicker="References">
          <p>Cited for the technique. Every number on this page is ours.</p>
          <p>
            Muennighoff et al. 2025, <em>s1: Simple Test-Time Scaling</em>: forcing a model to stop
            thinking, or to keep going, at a budget you choose.
          </p>
        </Note>

        {/* Step 3 — figure 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Not every problem costs the same
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              one row per problem · sorted by where it flips
            </span>
          </h2>
          <section
            aria-label="The flip-point strip"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <FlipStrip budgetIndex={budgetIndex} selectedId={rowId} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute" /> graded correct at this budget
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm border border-grid bg-surface" /> graded wrong
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-wrong" /> solved, then wrong again ·{" "}
                {F3.nRegressions} problems
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-ink" /> the budget each problem needs
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-px bg-compute" /> the budget you are holding
              </span>
            </div>

            {/* Clicking a row loads that problem into figure 1. The rows are
                two pixels tall, so the affordance is a button rather than the
                row itself: the nine problems whose full traces ship with the
                page, spanning the strip from top to bottom. */}
            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                load one into figure 1 · nine of these rows ship with their full traces
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Bundled problems">
                {F3.clickableRowIds.map((id) => {
                  const r = rowById(id);
                  const active = id === rowId;
                  // Four of the nine never flip, so the flip point alone does
                  // not name a row. The subject and the strip position do.
                  const place = F3.items.findIndex((d) => d.problem_id === id) + 1;
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
                      row {place} · {r.subject.replace(/_/g, " ")} · flips at {r.flipLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          <p className="text-sm text-ink-muted">
            Every row is a step, and figure 2&apos;s smooth climb is a hundred steps landing in
            different places: {F3.histogram[String(B[0])]} problems are already solved at {B[0]}{" "}
            tokens and {F3.histogram[String(B[B.length - 2])]} wait until {B[B.length - 2]}. Then
            there is the band at the bottom:{" "}
            <strong className="text-ink">
              {F3.neverFlipCount} of {F3.items.length}
            </strong>{" "}
            problems that no budget in this grid reaches. The dial runs out before they do.
          </p>
        </section>
        <Note kicker="Try it">
          <p>Load a never-flipping row into figure 1 and take it to {TOP} tokens.</p>
        </Note>

        {/* Close */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. Where the length runs out</h2>
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
                  the same budget, split
                </p>
                <p className="font-mono text-2xl tabular-nums text-ink">
                  {H.chains_at_min_budget} × {H.min_budget}
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">chains, not one</p>
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
        <div aria-hidden="true" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">
          Technique cited. The measurements on this page are ours:
        </span>
        <CitationBadge citation={S1} />
      </div>

      {/* Apparatus, not a tail of apology. The manifest is in the download, so
          this carries only what a download cannot state: grading we did not
          write, the seam with page 5, and the limits. Never folded away. */}
      <div className="grid gap-x-8 gap-y-3 text-xs text-ink-muted sm:grid-cols-2">
        <p>
          <strong className="text-ink">Grading is not ours to defend.</strong> Answers are
          extracted and graded by ch03&apos;s{" "}
          <a
            className="underline underline-offset-2"
            href="https://github.com/rasbt/reasoning-from-scratch"
            target="_blank"
            rel="noopener noreferrer"
          >
            reasoning-from-scratch
          </a>{" "}
          functions, used unchanged. At the cap we close the block, append{" "}
          <span className="font-code">{M.forcing.stem.trim()}</span> and allow{" "}
          {M.forcing.answer_allowance} more tokens, so a small budget grades as a wrong answer
          rather than as no answer at all. Run{" "}
          <span className="font-mono">{M.run_id}</span>.
        </p>
        <p>
          <strong className="text-ink">One measurement with page 5, not two.</strong> Same
          checkpoints, same {M.items.n} items, same grader. Page 5 measured both ends of the
          segment swept here: forbidden to reason the 3B scores{" "}
          {pct(H.page_5_endpoints!.suppressed)} at a median of{" "}
          {H.page_5_endpoints!.suppressed_tokens} tokens, and unconstrained it scores{" "}
          {pct(H.page_5_endpoints!.unconstrained)} at {H.page_5_endpoints!.unconstrained_tokens}.
          This page fills in the middle.
        </p>
        <p>
          <strong className="text-ink">The heights are not a claim.</strong> The three curves
          differ in size and in training, and the 7B ran at 8-bit while the other two ran at bf16,
          so nothing here is a statement about scale. The never-flipping band is what{" "}
          <em>this</em> grid at <em>this</em> decoding does not reach, never a claim that those
          problems are unsolvable; page 7 changes the decoding and revisits them.
        </p>
        <p>
          <strong className="text-ink">What the run does not resolve.</strong> The 3B&apos;s last
          doubling scores {F2.primary.gains[F2.primary.gains.length - 1].gain_pts.toFixed(0)} point,
          one problem out of {curvePoint.n}, drawn as measured and too small to read either way.{" "}
          {pct(F2.primary.points[B.length - 1].truncation_rate)} of chains still hit the cap at{" "}
          {TOP} tokens, which understates the right end of the curve rather than flattering it,
          since a truncated chain loses its <span className="font-mono">{"\\boxed{}"}</span>.
          Greedy decoding diverges on a handful of items across hardware, so re-deriving reproduces
          the shape and not every digit, and this is one benchmark in one language. Cut at the
          smallest budget, the 3B answers with the prompt template&apos;s own placeholder on{" "}
          {pct(0.21)} of items, which is a model with nothing to commit rather than a wrong value;
          two records in {tokens(M.integrity.n_records)} hide a right value behind it, and figure 1
          opens on a problem that does neither.
        </p>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
