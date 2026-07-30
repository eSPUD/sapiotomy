"use client";

/**
 * Page 11, "The Keystone" — the act's tools (voting, verifiers, search) all
 * spend inference FLOPs to buy accuracy. This page states the law that makes
 * that spending strategic: parameters and test-time thinking draw on the SAME
 * currency, and on all but the hardest prompts, thinking is the better buy.
 *
 * Step 1 is the two-knob allocator (lib/allocator.ts). The chart is the
 * centerpiece: full card width, all four model curves drawn in full,
 * Wu-figure style, with the controls in a strip beneath it. The knobs never
 * move a line — model size selects which curve is highlighted and test-time
 * compute slides the marker along it (the page-3 idiom), so the reader SEES
 * the crossings the game is about. To keep four overlapping curves from
 * reading as noise, only the selected curve is drawn at full strength; the
 * rest are thin ghosts, though every end label stays large and legible so the
 * family is always identifiable. The two dials sit side by side in one row
 * (equal height by construction), difficulty above them. Sizes are labeled as
 * multiples (1x..14x) because Snell et al. never publish absolute parameter
 * counts (disclosed in the Simulated footer, not the setup prose). The curves
 * are AUTHORED shapes following Snell et al. 2024's claims, pinned in
 * act2allocator.test.ts; the Snell cite sits beside the chart's caption, not
 * only in the setup prose. The card closes with the mechanism behind the
 * verdicts (sampling re-draws from the model's own distribution: thinking
 * amplifies a foothold, only parameters create one), so hard mode has a
 * reason, not just a result.
 *
 * Step 2 states the law with a unit on every number, each panel body one
 * concrete comparison in plain words: 4x is flat best-of-N (256 for every
 * question) against guess-difficulty-then-spend (64); 14x is one FLOPs bill
 * paid two ways (14 answers of thinking vs one greedy answer); R is the
 * serve/train token ratio read as amortization (pretraining bought once,
 * thinking a per-query surcharge).
 * Each panel's drawing carries exactly its caption's claim: 4x is two dot
 * clusters (16 vs 4 sample dots, the same 4:1 ratio) under two checkpoints
 * pinned to one same-accuracy line; 14x is two equal-height FLOPs bills, one
 * paid as 14 thin thinking slices, one as a single parameter block; R is one
 * axis with both regime labels on one baseline. The hard-mode boundary closes
 * the step as a deliberate callout, page-12's closing-statement treatment —
 * and now carries the WHY, the page's distribution intuition: test-time
 * compute (sampling, voting, search) can only surface answers the model can
 * already produce — it mines a fixed distribution (coverage grows log-linearly
 * with samples, Brown et al. 2024), while parameters change what is in the
 * distribution at all (complexity-cliff evidence: Shojaee et al. 2025). This
 * intuition is stated once here and reused by pages 12 (the plateau) and 13
 * (RL lifting the curve).
 *
 * Steps 3 and 4 are field data from Wu et al. 2024, where parameter counts
 * ARE published — split into two sections because they carry two different
 * claims. Step 3 (data/pythia-inference-scaling.json, by-eye digitization,
 * replotted as accuracy): how MUCH compute. The section title's claim is
 * drawn, not asserted: the budget axis is shaded into tinted ownership bands,
 * one per Pythia scale, and each curve is bold only inside the band where it
 * is the compute-optimal pick (clip-path segments over thin full ghosts), so
 * the baton pass from 410M to 2.8B to 12B is visible before the caption says
 * it. Band boundaries are computed from the digitized points (log-x linear
 * interpolation), not hand-placed. Step 4 (data/rebase-pareto.json, exact
 * table values): how it is SPENT — REBASE tree search shifts the whole
 * MATH500 frontier. Color is the strategy differentiator (muted sampling
 * circles, bright-green search diamonds) and each model's pair is tied by an
 * arrow pointing at the shift, led by their ~2x-less-total-FLOPs finding.
 *
 * The page closes with a hand-off block under step 4 (page-12's border-l
 * closing idiom) that names BOTH loose ends the next page answers: the hard
 * boundary (thinking mines what the weights hold; only weights move the wall)
 * and the waste (every tool spends at answer time and discards the reasoning
 * it bought). Page 12 (STaR) answers both with one move — train on the
 * reasoning — so 11→12→13 reads as a ladder of walls, each page ending on the
 * wall the next one moves (12 ends on its plateau, which 13's budget-exit
 * rewrite answers). The hand-off, not step 4's title, carries the bridge.
 *
 * Provenance: each chart's fidelity caveat sits directly under that chart;
 * the page footer uses page-12's two-label Simulated / Cited pattern. Refs:
 * Snell (§1–2), Brown/Monkeys + Shojaee/Illusion (§2 hard-mode callout), Wu
 * (§3–4), Stroebl/fLaws (§4 ceiling fine print), each beside first use.
 */

import { useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import {
  accuracy,
  BIG_MODEL,
  ceiling,
  curvePoints,
  DIFFICULTIES,
  flopsOf,
  MAX_EXP,
  MODEL_SIZES,
  target,
  type Difficulty,
} from "@/lib/allocator";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 11;

/** Page 11's references, numbered in order of first appearance. */
const REF = { snell: 1, monkeys: 2, illusion: 3, wu: 4, resample: 5 } as const;

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "the 1× model already lands most answers on its first try",
  medium: "the 1× model succeeds now and then, enough traction for thinking to build on",
  hard: "the 1× model essentially never lands one on its own",
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

/** A small legend swatch + label. */
function Key({ shape, className, label }: { shape: "circle" | "diamond" | "line"; className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block ${
          shape === "line" ? "h-0.5 w-4" : shape === "diamond" ? "h-3 w-3 rotate-45" : "h-3 w-3 rounded-full"
        } ${className}`}
      />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------------- *
 * Step 2's three findings as small panels, Page-2-comic style: a tiny
 * decorative drawing (aria-hidden, currentColor via token classes) above a
 * caption that carries the claim.
 * ------------------------------------------------------------------------- */

/** 4x: two checkpoints on one accuracy line; one cluster holds 4x fewer sample dots. */
function ArtFourX() {
  const cluster = (cx: number, cols: number, rows: number) => {
    const dots: { x: number; y: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        dots.push({ x: cx + (c - (cols - 1) / 2) * 6, y: 24 + r * 6 });
    return dots;
  };
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="9" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        same accuracy
      </text>
      <line
        x1="12"
        y1="14"
        x2="84"
        y2="14"
        className="stroke-current text-ink-muted"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <circle cx="26" cy="14" r="3" className="fill-current text-correct" />
      <circle cx="70" cy="14" r="3" className="fill-current text-correct" />
      {/* the samples each run drew to get there: 16 dots vs 4, the same 4:1 */}
      {cluster(26, 4, 4).map((d) => (
        <circle key={`a${d.x}-${d.y}`} cx={d.x} cy={d.y} r="2" className="fill-current text-compute" />
      ))}
      {cluster(70, 2, 2).map((d) => (
        <circle key={`b${d.x}-${d.y}`} cx={d.x} cy={d.y} r="2" className="fill-current text-compute" />
      ))}
      <text x="26" y="54" textAnchor="middle" fontSize="7" className="fill-current text-ink">
        256 samples
      </text>
      <text x="70" y="54" textAnchor="middle" fontSize="7" className="fill-current text-ink">
        64
      </text>
    </svg>
  );
}

/** 14x: the same FLOPs bill paid two ways — 14 thinking slices, or one parameter block. */
function ArtFourteenX() {
  const barY = 15;
  const barH = 28;
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="9" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        the same FLOPs bill
      </text>
      {/* left: paid in samples — 14 thin slices of thinking from the 1× model */}
      <rect x="17" y={barY} width="18" height={barH} className="fill-current text-compute/25" />
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={i}
          x1="17"
          x2="35"
          y1={barY + (barH / 14) * (i + 1)}
          y2={barY + (barH / 14) * (i + 1)}
          className="stroke-current text-canvas"
          strokeWidth="0.8"
        />
      ))}
      <rect x="17" y={barY} width="18" height={barH} className="stroke-current text-compute" fill="none" strokeWidth="1.2" />
      <text x="26" y="53" textAnchor="middle" fontSize="6.5" className="fill-current text-ink">
        1× + thinking
      </text>
      <text x="48" y="34" textAnchor="middle" fontSize="12" className="fill-current text-ink">
        ≥
      </text>
      {/* right: paid once, in parameters */}
      <rect x="61" y={barY} width="18" height={barH} className="fill-current text-ink-muted/15" />
      <rect x="61" y={barY} width="18" height={barH} className="stroke-current text-ink-muted" fill="none" strokeWidth="1.2" />
      <text x="70" y="53" textAnchor="middle" fontSize="6.5" className="fill-current text-ink-muted">
        14×, greedy
      </text>
    </svg>
  );
}

/** R: one axis, two limits — both regime labels on one baseline, one per end. */
function ArtRatioR() {
  return (
    <svg viewBox="0 0 128 56" className="h-full w-full" aria-hidden="true">
      <text x="64" y="14" textAnchor="middle" fontSize="10" className="fill-current text-wrong">
        R
      </text>
      <line x1="14" y1="26" x2="114" y2="26" className="stroke-current text-ink-muted" strokeWidth="1" />
      <path d="M18 23 L13 26 L18 29" className="stroke-current text-ink-muted" fill="none" strokeWidth="1" />
      <path d="M110 23 L115 26 L110 29" className="stroke-current text-ink-muted" fill="none" strokeWidth="1" />
      <text x="14" y="20" fontSize="7" className="fill-current text-ink-muted">
        → 0
      </text>
      <text x="114" y="20" textAnchor="end" fontSize="7" className="fill-current text-ink-muted">
        → ∞
      </text>
      <text x="4" y="38" fontSize="7" className="fill-current text-correct">
        thinking wins
      </text>
      <text x="124" y="38" textAnchor="end" fontSize="7" className="fill-current text-ink">
        parameters win
      </text>
    </svg>
  );
}

/** One finding: the tiny drawing above, the claim below. */
function LawPanel({
  head,
  headTone,
  title,
  art,
  children,
}: {
  head: string;
  headTone: string;
  title: string;
  art: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure className="m-0 flex h-full flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
      <div className="flex h-20 items-center justify-center rounded border border-grid bg-canvas px-2">
        {art}
      </div>
      <figcaption className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-ink">
          <span className={`font-mono ${headTone}`}>{head}</span> {title}
        </span>
        <span className="text-xs leading-snug text-ink-muted">{children}</span>
      </figcaption>
    </figure>
  );
}

/**
 * One hue per model size, Wu-figure style, so the family reads at a glance.
 * The three semantic hues plus ink are the palette's only line colors; every
 * curve carries its own end label, so identity is never color alone.
 */
/**
 * Round an SVG coordinate to 2 decimals. Log-scale outputs differ in the last
 * float bits between the server and client render, which React reports as a
 * hydration mismatch; rounding makes both sides emit the same string.
 */
const px = (v: number) => Math.round(v * 100) / 100;

const SIZE_HUES: Record<number, { stroke: string; fill: string }> = {
  1: { stroke: "stroke-correct", fill: "fill-correct" },
  2: { stroke: "stroke-compute", fill: "fill-compute" },
  4: { stroke: "stroke-wrong", fill: "fill-wrong" },
  14: { stroke: "stroke-ink", fill: "fill-ink" },
};

/**
 * The allocator chart: every model's full trajectory drawn at once, the
 * selected one highlighted, the knobs only moving the marker along it.
 */
function FamilyChart({
  difficulty,
  size,
  cost,
  acc,
}: {
  difficulty: Difficulty;
  size: number;
  cost: number;
  acc: number;
}) {
  const width = 640;
  const height = 300;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([1, 4096]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));
  const tgt = target(difficulty);

  const family = MODEL_SIZES.map((s) => ({ s, pts: curvePoints(difficulty, s) }));
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("");

  const title = `Accuracy against total inference FLOPs on ${difficulty} problems, log x axis. All four model curves are drawn: ${family
    .map(
      (f) =>
        `the ${f.s} times model runs from ${f.pts[0].y.toFixed(0)} percent with one answer up to ${f.pts[f.pts.length - 1].y.toFixed(0)} percent at 256 samples`,
    )
    .join("; ")}. The dashed target line marks ${tgt.toFixed(0)} percent, the 14 times model's single greedy answer, at 14 FLOPs units. Your marker: the ${size} times model at ${cost} units, scoring ${acc.toFixed(1)} percent.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="total inference FLOPs (units of one 1× answer, log scale)"
      yLabel="accuracy (%)"
    >
      {[0, 20, 40, 60, 80, 100].map((t) => (
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

      {/* the target: the 14x model's one greedy answer */}
      <line
        x1={0}
        x2={innerW}
        y1={y(tgt)}
        y2={y(tgt)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW - 4} y={y(tgt) - 5} textAnchor="end" className="fill-ink-muted text-[11px]">
        the target
      </text>

      {/* every curve, drawn in full; the selected one carries the weight, the
          rest are thin ghosts — but every end label stays large and legible */}
      {family.map((f) => {
        const selected = f.s === size;
        const end = f.pts[f.pts.length - 1];
        const hue = SIZE_HUES[f.s];
        return (
          <g key={f.s}>
            <path
              d={path(f.pts)}
              fill="none"
              className={hue.stroke}
              strokeWidth={selected ? 3 : 1}
              opacity={selected ? 1 : 0.25}
            />
            <text
              x={x(end.x) + (f.s === BIG_MODEL ? -2 : 5)}
              y={y(end.y) + (f.s === BIG_MODEL ? -10 : 4)}
              textAnchor={f.s === BIG_MODEL ? "end" : "start"}
              className={`text-[13px] font-semibold ${hue.fill}`}
              opacity={selected ? 1 : 0.7}
            >
              {f.s}×
            </text>
          </g>
        );
      })}

      {/* the 14x model's greedy point — the dot to beat */}
      <circle cx={x(BIG_MODEL)} cy={y(tgt)} r={5} className="fill-ink stroke-canvas" strokeWidth={1.5} />
      <text x={x(BIG_MODEL)} y={y(tgt) + 16} textAnchor="middle" className="fill-ink text-[11px]">
        14× · 1 answer
      </text>

      {/* your marker, sliding along the selected curve */}
      <line
        x1={x(cost)}
        x2={x(cost)}
        y1={0}
        y2={innerH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle
        cx={x(cost)}
        cy={y(acc)}
        r={5.5}
        className={`${SIZE_HUES[size].fill} stroke-canvas`}
        strokeWidth={1.5}
      />
    </ChartFrame>
  );
}

/** Accuracy of a digitized series at x, interpolating linearly in log-x. */
function seriesAt(pts: { x: number; y: number }[], xv: number): number | null {
  if (xv < pts[0].x || xv > pts[pts.length - 1].x) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (xv >= a.x && xv <= b.x) {
      const t = (Math.log(xv) - Math.log(a.x)) / (Math.log(b.x) - Math.log(a.x));
      return a.y + t * (b.y - a.y);
    }
  }
  return null;
}

/**
 * Which budgets each series wins: contiguous [x0, x1] bands where that series
 * is the most accurate of those defined there, scanned on a log-spaced grid
 * over the data's span and clamped outward to the chart's domain edges.
 */
function ownershipBands(
  allPts: { x: number; y: number }[][],
  domain: [number, number],
): { idx: number; x0: number; x1: number }[] {
  const lo = Math.min(...allPts.map((p) => p[0].x));
  const hi = Math.max(...allPts.map((p) => p[p.length - 1].x));
  const STEPS = 240;
  const leaderAt = (xv: number) => {
    let best = -1;
    let bestY = -Infinity;
    allPts.forEach((pts, i) => {
      const yv = seriesAt(pts, xv);
      if (yv !== null && yv > bestY) {
        bestY = yv;
        best = i;
      }
    });
    return best;
  };
  const bands: { idx: number; x0: number; x1: number }[] = [];
  for (let s = 0; s <= STEPS; s++) {
    const xv = Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * (s / STEPS));
    const idx = leaderAt(xv);
    const last = bands[bands.length - 1];
    if (last && last.idx === idx) last.x1 = xv;
    else bands.push({ idx, x0: xv, x1: xv });
  }
  bands[0].x0 = domain[0];
  bands[bands.length - 1].x1 = domain[1];
  return bands;
}

/**
 * Wu et al.'s Pythia curves on GSM8K (digitized by eye, replotted as
 * accuracy): the allocator's picture with real, published parameter counts.
 * The section's claim is drawn into the figure: the budget axis is shaded
 * into one tinted band per scale, and each curve is bold only inside the band
 * it owns — the stretch of budgets where it is the compute-optimal pick.
 */
function PythiaChart() {
  const data = curves.pythiaInferenceScaling;
  const { n410m, n2p8b } = data.fit!.params;
  const series = [
    {
      label: "410M",
      pts: data.points.slice(0, n410m),
      stroke: "stroke-compute-bright",
      fill: "fill-compute-bright",
      band: "fill-compute-bright",
      text: "fill-compute",
    },
    {
      label: "2.8B",
      pts: data.points.slice(n410m, n410m + n2p8b),
      stroke: "stroke-correct-bright",
      fill: "fill-correct-bright",
      band: "fill-correct-bright",
      text: "fill-correct",
    },
    {
      label: "12B",
      pts: data.points.slice(n410m + n2p8b),
      stroke: "stroke-wrong-bright",
      fill: "fill-wrong-bright",
      band: "fill-wrong-bright",
      text: "fill-wrong",
    },
  ];

  const width = 560;
  const height = 260;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([1, 4096]).range([0, innerW]);
  const yScale = scaleLinear().domain([20, 80]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("");

  const bands = ownershipBands(
    series.map((s) => s.pts),
    [1, 4096],
  );

  const title = `GSM8K accuracy against inference FLOPs per question, log x axis, three Pythia models under weighted majority voting. ${series
    .map(
      (s) =>
        `Pythia ${s.label}: from ${s.pts[0].y} percent at ${s.pts[0].x} to ${s.pts[s.pts.length - 1].y} percent at ${s.pts[s.pts.length - 1].x} (times ten to the eleven FLOPs)`,
    )
    .join("; ")}. The budget axis is shaded into three bands, one per model, marking where that model is the most accurate: the 410M leads at small budgets, flattens near 60 percent, then the 2.8B takes over, and the 12B pulls ahead at the largest budgets.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs per question (×10¹¹, log scale)"
      yLabel="GSM8K accuracy (%)"
    >
      {/* the ownership bands: who is the best buy at each budget */}
      {bands.map((b) => (
        <g key={`band${b.idx}`}>
          <rect
            data-testid="ownership-band"
            x={x(b.x0)}
            y={0}
            width={px(x(b.x1) - x(b.x0))}
            height={innerH}
            className={series[b.idx].band}
            opacity={0.08}
          />
          <text
            x={px((x(b.x0) + x(b.x1)) / 2)}
            y={innerH - 8}
            textAnchor="middle"
            className={`${series[b.idx].text} text-[11px] font-semibold`}
          >
            {series[b.idx].label} leads
          </text>
        </g>
      ))}
      {bands.slice(1).map((b) => (
        <line
          key={`edge${b.idx}`}
          x1={x(b.x0)}
          x2={x(b.x0)}
          y1={0}
          y2={innerH}
          className="stroke-ink-muted"
          strokeWidth={0.75}
          strokeDasharray="3 3"
          opacity={0.5}
        />
      ))}

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

      <defs>
        {bands.map((b) => (
          <clipPath key={`clip${b.idx}`} id={`pythia-band-${b.idx}`}>
            <rect x={x(b.x0)} y={0} width={px(x(b.x1) - x(b.x0))} height={innerH} />
          </clipPath>
        ))}
      </defs>

      {/* full curves as thin ghosts, then each one bold inside its own band:
          the baton pass is the picture */}
      {series.map((s) => (
        <path key={`ghost${s.label}`} d={path(s.pts)} fill="none" className={s.stroke} strokeWidth={1.25} opacity={0.35} />
      ))}
      {bands.map((b) => (
        <path
          key={`lead${b.idx}`}
          d={path(series[b.idx].pts)}
          fill="none"
          className={series[b.idx].stroke}
          strokeWidth={3}
          clipPath={`url(#pythia-band-${b.idx})`}
        />
      ))}

      {series.map((s) => {
        const end = s.pts[s.pts.length - 1];
        const atEdge = x(end.x) > innerW - 40;
        return (
          <g key={s.label}>
            {s.pts.map((p) => (
              <circle
                key={`${p.x}-${p.y}`}
                cx={x(p.x)}
                cy={y(p.y)}
                r={3}
                className={`${s.fill} stroke-canvas`}
                strokeWidth={1.5}
              />
            ))}
            <text
              x={x(end.x) + (atEdge ? 0 : 6)}
              y={y(end.y) + (atEdge ? -8 : 3)}
              textAnchor={atEdge ? "end" : "start"}
              className={`${s.text} text-[11px] font-semibold`}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/** Wu et al. 2024's MATH500 results table as a scatter: accuracy vs FLOPs. */
function ParetoScatter() {
  const data = curves.rebasePareto;
  const p = data.fit!.params;
  const rows = [
    { model: "Mistral-7B", rebase: false, flops: p.mistral7bSamplingFlops, acc: p.mistral7bSamplingAcc, dx: -10, dy: 4, anchor: "end" as const },
    { model: "Mistral-7B", rebase: true, flops: p.mistral7bRebaseFlops, acc: p.mistral7bRebaseAcc, dx: 10, dy: -9, anchor: "start" as const },
    { model: "Llemma-7B", rebase: false, flops: p.llemma7bSamplingFlops, acc: p.llemma7bSamplingAcc, dx: -10, dy: 4, anchor: "end" as const },
    { model: "Llemma-7B", rebase: true, flops: p.llemma7bRebaseFlops, acc: p.llemma7bRebaseAcc, dx: 10, dy: -9, anchor: "start" as const },
    { model: "Llemma-34B", rebase: false, flops: p.llemma34bSamplingFlops, acc: p.llemma34bSamplingAcc, dx: 10, dy: 4, anchor: "start" as const },
    { model: "Llemma-34B", rebase: true, flops: p.llemma34bRebaseFlops, acc: p.llemma34bRebaseAcc, dx: 10, dy: 4, anchor: "start" as const },
  ];

  const width = 560;
  const height = 280;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([1, 20]).range([0, innerW]);
  const yScale = scaleLinear().domain([40, 52]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));

  // The headline pair: 7B + tree search vs 34B + sampling, same accuracy.
  const a = rows[3];
  const b = rows[4];
  const savings = Math.round(b.flops / a.flops);

  // Trim a connector short of its end point so the arrowhead lands at the
  // mark's edge instead of underneath it.
  const trim = (x1: number, y1: number, x2: number, y2: number, d: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    return { x: px(x2 - (dx / len) * d), y: px(y2 - (dy / len) * d) };
  };

  const title = `Accuracy on MATH500 against inference FLOPs, log x axis. ${rows
    .map(
      (r) =>
        `${r.model} with ${r.rebase ? "REBASE tree search" : "sampling"}: ${r.acc} percent at ${r.flops} times ten to the fourteen FLOPs`,
    )
    .join("; ")}. A thin connector ties each model's sampling point to its tree-search point: same model, better strategy, up and to the left. Llemma-7B with tree search matches Llemma-34B's sampling accuracy with about ${savings} times fewer FLOPs.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs (×10¹⁴, log scale)"
      yLabel="MATH500 accuracy (%)"
    >
      {[40, 44, 48, 52].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[1, 2, 5, 10, 20].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      <defs>
        <marker
          id="frontier-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" className="fill-ink-muted" />
        </marker>
      </defs>

      {/* each model's sampling → REBASE pair as an arrow: same model, better
          strategy, up and to the left */}
      {[0, 2, 4].map((i) => {
        const from = rows[i];
        const to = rows[i + 1];
        const end = trim(x(from.flops), y(from.acc), x(to.flops), y(to.acc), 11);
        return (
          <line
            key={from.model}
            data-testid="pair-connector"
            x1={x(from.flops)}
            y1={y(from.acc)}
            x2={end.x}
            y2={end.y}
            className="stroke-ink-muted"
            strokeWidth={1.25}
            opacity={0.7}
            markerEnd="url(#frontier-arrow)"
          />
        );
      })}

      {/* the headline pair, tied together: same accuracy, ~8x fewer FLOPs */}
      <line
        x1={x(a.flops)}
        y1={y(a.acc)}
        x2={x(b.flops)}
        y2={y(b.acc)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text
        x={(x(a.flops) + x(b.flops)) / 2}
        y={Math.min(y(a.acc), y(b.acc)) - 8}
        textAnchor="middle"
        className="fill-ink text-[11px] font-semibold"
      >
        same accuracy · {savings}× fewer FLOPs
      </text>

      {/* color is the strategy: muted sampling circles, bright search diamonds */}
      {rows.map((r) => (
        <g key={`${r.model}-${r.rebase}`}>
          {r.rebase ? (
            <rect
              x={x(r.flops) - 5.5}
              y={y(r.acc) - 5.5}
              width={11}
              height={11}
              transform={`rotate(45 ${x(r.flops)} ${y(r.acc)})`}
              className="fill-correct-bright stroke-canvas"
              strokeWidth={1.5}
            />
          ) : (
            <circle cx={x(r.flops)} cy={y(r.acc)} r={6} className="fill-ink-muted stroke-canvas" strokeWidth={1.5} />
          )}
          <text
            x={x(r.flops) + r.dx}
            y={y(r.acc) + r.dy}
            textAnchor={r.anchor}
            className="fill-ink-muted text-[10px]"
          >
            {r.model}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

export function Page11() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exp, setExp] = useState(0);

  const size = MODEL_SIZES[sizeIdx];
  const k = 2 ** exp;
  const acc = accuracy(difficulty, size, k);
  const cost = flopsOf(size, k);
  const tgt = target(difficulty);
  const cap = ceiling(difficulty, size);

  const beaten = acc >= tgt;
  const verdict = beaten
    ? cost < BIG_MODEL
      ? {
          tone: "border-correct bg-correct/15",
          head: `✓ matched the 14× model's ${tgt.toFixed(0)}%, for ${(BIG_MODEL / cost).toFixed(1)}× less compute`,
          headTone: "text-correct",
          body: "Test-time compute just did the work of parameters. That is the FLOPs-matched headline result.",
        }
      : {
          tone: "border-compute bg-compute/10",
          head: `matched it, but you spent ${cost} units and the 14× model needs only ${BIG_MODEL}`,
          headTone: "text-ink",
          body: "The win only counts while your bill stays under the big model's. Back off the knobs and find the cheap crossing.",
        }
    : cap < tgt
      ? {
          tone: "border-wrong bg-wrong/15",
          head: `✗ this model saturates near ${cap.toFixed(0)}%; the target is out of reach`,
          headTone: "text-wrong",
          body: "No sample budget closes the gap: the curve flattens below the dashed line. On problems this far past the base model, pretraining the larger model is the better buy.",
        }
      : {
          tone: "border-grid bg-surface-raised",
          head: `${acc.toFixed(1)}% so far; the 14× model gets ${tgt.toFixed(0)}%`,
          headTone: "text-ink",
          body: "Keep turning the test-time knob and watch what it costs.",
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
        A bigger model and a longer think are{" "}
        <strong className="text-ink">two ways to spend the same FLOPs</strong>: pretraining burns
        them once into parameters, test-time compute burns them at answer time, on the question
        that needs them. Matched budget for budget,{" "}
        <strong className="text-ink">which buys more accuracy?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two-knob allocator */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Problem complexity and the compromise
            <span className="block text-xs font-normal text-ink-muted">
              the game: beat the 14× model · illustrative curves, no live LLM
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              One unit is one answer from the 1× model. An M× model costs M units per answer, so
              the 14× model&rsquo;s single greedy answer costs <strong>14 units</strong> and scores{" "}
              <strong className="text-ink">{tgt.toFixed(0)}%</strong>: the black dot.{" "}
              <strong>Model size picks your curve; test-time compute slides
              you along it.</strong> Win by crossing the dashed line <em>left</em> of the dot.
            </p>

            {/* the centerpiece at full card width, controls in a strip beneath */}
            <FamilyChart difficulty={difficulty} size={size} cost={cost} acc={acc} />
            <p className="text-xs text-ink-muted">
              all four model curves are drawn in full and the knobs never move them; only the
              highlight and your marker respond. The crossings and ceilings are Snell et
              al.&rsquo;s claims; the exact coordinates are illustrative, since the paper reports
              scale only as multiples.
              <Cite n={REF.snell} />
            </p>

            <div className="flex flex-col gap-4 border-t border-dashed border-grid pt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm text-ink-muted">Problem difficulty</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Problem difficulty">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={difficulty === d}
                      onClick={() => {
                        setDifficulty(d);
                        recordInteraction(PAGE_N);
                      }}
                      className={`rounded border px-3 py-1.5 text-sm capitalize ${
                        difficulty === d
                          ? "border-compute bg-compute/15 font-semibold text-ink"
                          : "border-grid bg-surface-raised text-ink-muted"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="basis-full text-xs text-ink-muted">{DIFFICULTY_BLURB[difficulty]}</p>
              </div>
              {/* the two dials share one row, so they always sit at the same height */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Slider
                  label="Model size (× base parameters)"
                  min={0}
                  max={MODEL_SIZES.length - 1}
                  value={sizeIdx}
                  format={(v) => `${MODEL_SIZES[v]}×`}
                  onChange={(v) => {
                    setSizeIdx(v);
                    recordInteraction(PAGE_N);
                  }}
                />
                <Slider
                  label="Test-time compute"
                  min={0}
                  max={MAX_EXP}
                  value={exp}
                  format={(v) => `${2 ** v} sample${v === 0 ? "" : "s"}`}
                  onChange={(v) => {
                    setExp(v);
                    recordInteraction(PAGE_N);
                  }}
                />
              </div>
            </div>

            {/* the scoreboard: three numbers + the verdict, one strip */}
            <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)]">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "your accuracy",
                    value: `${acc.toFixed(1)}%`,
                    tone: beaten ? "text-correct" : "text-ink",
                    note: `${size}× · ${k} sample${k === 1 ? "" : "s"}`,
                  },
                  {
                    label: "your bill",
                    value: String(cost),
                    tone: "text-compute",
                    note: "FLOPs units",
                  },
                  {
                    label: "the target",
                    value: `${tgt.toFixed(0)}%`,
                    tone: "text-ink",
                    note: "14× · 14 units",
                  },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-grid bg-surface-raised px-3 py-2">
                    <p className={`font-mono text-lg font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                    <p className="text-xs text-ink">{s.label}</p>
                    <p className="text-xs text-ink-muted">{s.note}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded border-l-4 p-3 text-sm ${verdict.tone}`} role="status">
                <p className={`font-semibold ${verdict.headTone}`}>{verdict.head}</p>
                <p className="mt-1 text-ink">{verdict.body}</p>
              </div>
            </div>

            {/* the mechanism behind the verdicts, so hard mode has a reason */}
            <p className="border-t border-dashed border-grid pt-3 text-sm text-ink">
              <strong>Why difficulty decides the game:</strong> extra samples only re-draw from
              what the model can already produce. On easy problems the first draw is usually
              right. On medium ones a correct chain turns up now and then, and voting or a
              verifier can fish it out: thinking amplifies a foothold. On hard ones every chain
              breaks somewhere, so no number of re-draws holds a right answer to find.{" "}
              <strong>Thinking amplifies competence; only parameters create it.</strong>
            </p>
          </div>
        </section>
        <Note kicker="Try it">
          <p>
            Drag <em>test-time compute</em> right until your marker crosses the dashed line —
            before the black dot means you beat the 14× model for less.
          </p>
          <p>Then set difficulty to hard and try to cross at all.</p>
        </Note>

        {/* Step 2 — the law, stated */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. The law, and its fine print</h2>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              Snell et al. tried two ways of converting test-time FLOPs into accuracy: search over
              sampled steps under a process verifier (page 9&rsquo;s graders), or letting the
              model redraft its own answer. Guessing how hard the prompt is first, then choosing
              the strategy and budget to match, is what they call compute-optimal.
              <Cite n={REF.snell} /> Three numbers carry the result:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <LawPanel head="4×" headTone="text-correct" title="fewer samples than best-of-N" art={<ArtFourX />}>
                best-of-N spends 256 samples on every question, easy or hard. Guess the difficulty
                first and spend accordingly, and 64 samples buy the same accuracy
              </LawPanel>
              <LawPanel head="14×" headTone="text-correct" title="the parameters, matched on FLOPs" art={<ArtFourteenX />}>
                give both sides the same FLOPs bill: the 1× model buys 14 answers&rsquo; worth of
                thinking, the 14× model buys one greedy answer. The thinker scores higher, on
                problems it can already sometimes solve
              </LawPanel>
              <LawPanel head="R" headTone="text-wrong" title="decides the regime" art={<ArtRatioR />}>
                R = tokens you will serve ÷ tokens you trained on. Pretraining is bought once and
                amortized over every query; thinking is a surcharge on every one. Serve little
                (R → 0) and thinking wins; serve billions (R → ∞) and parameters win
              </LawPanel>
            </div>
            <p className="rounded border-l-4 border-wrong bg-wrong/10 p-3 text-sm text-ink">
              <strong>Hard mode is the other boundary:</strong> where the small model has no
              foothold, no budget rescues it. The reason is what the test-time knob actually
              does: sampling, voting, and search can only surface answers the model can
              already produce. The odds of finding a correct path climb steadily with every
              extra sample
              <Cite n={REF.monkeys} /> because more samples mine the distribution more
              thoroughly, but the distribution itself never moves. If the right answer has
              essentially zero probability, a thousand samples are a thousand copies of the
              same blindness, and past a complexity threshold even models trained to think
              collapse no matter the budget.
              <Cite n={REF.illusion} /> Parameters are the knob that changes what is in the
              distribution at all.
            </p>
          </div>
        </section>
        <Note kicker="References">
          <RefItem n={REF.snell} href="https://arxiv.org/abs/2408.03314">
            Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally can be More Effective
            than Scaling Model Parameters</em>.
          </RefItem>
          <RefItem n={REF.monkeys} href="https://arxiv.org/abs/2407.21787" preprint>
            Brown et al. 2024, <em>Large Language Monkeys: Scaling Inference Compute with
            Repeated Sampling</em>.
          </RefItem>
          <RefItem n={REF.illusion} href="https://arxiv.org/abs/2506.06941" preprint>
            Shojaee et al. 2025, <em>The Illusion of Thinking: Understanding the Strengths and
            Limitations of Reasoning Models via the Lens of Problem Complexity</em>.
          </RefItem>
        </Note>

        {/* Step 3 — how MUCH compute: each scale's band, measured */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Each scale owns a band of the budget</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The game&rsquo;s picture, with real published sizes. Wu et al. gave three Pythia
              models (<strong className="text-ink">410M, 2.8B, and 12B parameters</strong>) a
              growing sample budget on GSM8K, under weighted majority voting. Each curve is drawn
              bold only where that model is the best buy; the shaded bands mark whose stretch of
              the budget axis you are in.
              <Cite n={REF.wu} />
            </p>
            <PythiaChart />
            <figcaption className="text-sm text-ink-muted">
              On a small budget the <strong className="text-ink">410M model is the
              compute-optimal pick</strong>: sampling it many times beats sampling a big model a
              few times. Then every curve flattens. Once the 410M saturates near 60%, the 2.8B and
              finally the 12B pull ahead. Each scale owns a band of the budget axis, exactly the
              crossings you just steered through.
            </figcaption>
            <p className="text-xs text-ink-muted">
              read off the paper&rsquo;s figure by eye (±3 points) and replotted as accuracy; two
              of their five model sizes omitted for legibility
            </p>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.wu} href="https://arxiv.org/abs/2408.00724">
            Wu et al. 2024, <em>Inference Scaling Laws: An Empirical Analysis of Compute-Optimal
            Inference</em>.
          </RefItem>
        </Note>

        {/* Step 4 — how it is SPENT: better search shifts the frontier */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. Better search moves the whole frontier</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Section 3 varied how <em>much</em> compute; this one varies how it is{" "}
              <em>spent</em>. The same paper&rsquo;s results table on MATH500: three models, each
              under plain sampling and under their REBASE tree search, an arrow carrying each
              model&rsquo;s pair from the gray point to the green one. Up and to the left is
              better.
            </p>
            <ParetoScatter />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="circle" className="bg-ink-muted" label="sampling + weighted voting (64–256 samples)" />
              <Key shape="diamond" className="bg-correct-bright" label="REBASE tree search + weighted voting (32 samples)" />
            </div>
            <figcaption className="text-sm text-ink-muted">
              Across every inference strategy and both benchmarks they tested, Wu et al. find the
              7B model needs <strong className="text-ink">about half the total FLOPs</strong> of
              the 34B to reach comparable accuracy, and this table&rsquo;s sharpest instance is
              sharper still: 7B with tree search{" "}
              <strong className="text-ink">edges the 34B model&rsquo;s best sampling run with
              roughly 8× fewer inference FLOPs</strong>.
              <Cite n={REF.wu} /> The fine print holds here too: gains from
              more samples flatten toward a ceiling that the model&rsquo;s own answer distribution
              sets, so without a perfect external verifier, sampling alone never reaches 100%.
              <Cite n={REF.resample} />
            </figcaption>
            <p className="text-xs text-ink-muted">
              exact values from the paper&rsquo;s MATH500 results table (Table 1); no digitization
              involved
            </p>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.resample} href="https://arxiv.org/abs/2411.17501" preprint>
            Stroebl et al. 2024, <em>Inference Scaling fLaws: The Limits of LLM Resampling with
            Imperfect Verifiers</em>.
          </RefItem>
        </Note>

        {/* The hand-off to page 12 — deliberately its own block, not section
            4's job: better search still spends everything at answer time. */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <p className="rounded border-l-4 border-compute bg-surface p-4 text-base text-ink">
            <strong className="text-ink">This page leaves two loose ends.</strong> The hard
            boundary: no budget rescues a model without a foothold, because thinking only mines
            what the weights already hold, and so far the only way to change the weights is
            buying parameters. And the waste: voting, verifiers, search, and the
            allocator&rsquo;s knobs all spend their compute at answer time, and the reasoning
            that compute buys is thrown away the moment the answer is scored, even though a
            chain that survived the check is a worked solution the model wrote for itself.{" "}
            <em>Page 12 spends one move on both: keep the reasoning and train on it, teaching
            the model to reason, so the frontier that stalled at inference time starts to
            move.</em>
          </p>
        </div>
      </div>

      
      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Simulated</strong> — the allocator curves in section 1 are
          authored illustrations pinned to the cited findings, not digitized data, because there
          is no per-difficulty accuracy figure in the paper to digitize: Snell et al.
          report model scale only as a multiple (absolute parameter counts undisclosed), so 14×
          means 14× the base model&rsquo;s parameter count, and FLOPs per answer are counted in
          proportion to parameters throughout. The curves are the simplest shapes that obey the
          reported findings (crossings ordered by scale, saturation at every scale, no budget
          rescuing the small model on hard prompts), and every on-screen behaviour is pinned in
          the test suite.
        </p>
        <p>
          <strong className="text-ink">Cited</strong> — section 3 is read off Wu et
          al.&rsquo;s GSM8K figure by eye (±3 points, two of five model sizes omitted for
          legibility); section 4 is transcribed exactly from the same paper&rsquo;s MATH500
          results table.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
