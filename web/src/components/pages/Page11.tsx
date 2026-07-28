"use client";

/**
 * Page 11, "The Keystone" — the act's tools (voting, verifiers, search) all
 * spend inference FLOPs to buy accuracy. This page states the law that makes
 * that spending strategic: parameters and test-time thinking draw on the SAME
 * currency, and on all but the hardest prompts, thinking is the better buy.
 *
 * Step 1 is the two-knob allocator (lib/allocator.ts). All four model curves
 * are drawn in full, Wu-figure style; the knobs never move a line — model size
 * selects which curve is highlighted and test-time compute slides the marker
 * along it (the page-3 idiom), so the reader SEES the crossings the game is
 * about. Sizes are labeled as multiples (1x..14x) because Snell et al. never
 * publish absolute parameter counts; the card states the exchange rate
 * explicitly (Mx parameters => ~Mx inference FLOPs per answer). The curves are
 * AUTHORED shapes following Snell et al. 2024's claims, pinned in
 * act2allocator.test.ts.
 *
 * Step 2 states the law with a unit on every number: 4x fewer samples than
 * best-of-N (64 vs 256), 14x the parameters matched on FLOPs, and the ratio R
 * given as its two limits (R -> 0 thinking wins, R -> inf parameters win).
 *
 * Step 3 is field data from Wu et al. 2024, where parameter counts ARE
 * published: (a) the Pythia inference-scaling curves on GSM8K
 * (data/pythia-inference-scaling.json, by-eye digitization of their figure,
 * replotted as accuracy) — the game's picture with real sizes; (b) the MATH500
 * results table (data/rebase-pareto.json, exact values) — REBASE tree search
 * shifting the whole frontier, led by their ~2x-less-total-FLOPs finding.
 */

import { useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
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
const REF = { snell: 1, wu: 2 } as const;

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "the 1× model already lands most answers on its first try",
  medium: "the 1× model succeeds now and then — enough traction for thinking to build on",
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

/** 4x: two runs land on the same accuracy line; one pays a quarter the samples. */
function ArtFourX() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="9" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        same accuracy
      </text>
      <line
        x1="10"
        y1="14"
        x2="86"
        y2="14"
        className="stroke-current text-ink-muted"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <circle cx="28" cy="14" r="3" className="fill-current text-correct" />
      <circle cx="68" cy="14" r="3" className="fill-current text-correct" />
      {/* each run's sample bill, hanging from the same line */}
      <rect x="20" y="18" width="16" height="28" className="fill-current text-compute/25" />
      <rect x="20" y="18" width="16" height="28" className="stroke-current text-compute" fill="none" strokeWidth="1" />
      <rect x="60" y="39" width="16" height="7" className="fill-current text-compute/25" />
      <rect x="60" y="39" width="16" height="7" className="stroke-current text-compute" fill="none" strokeWidth="1" />
      <line x1="10" y1="46" x2="86" y2="46" className="stroke-current text-ink-muted" strokeWidth="1" />
      <text x="28" y="54" textAnchor="middle" fontSize="7" className="fill-current text-ink">
        256
      </text>
      <text x="68" y="54" textAnchor="middle" fontSize="7" className="fill-current text-ink">
        64
      </text>
    </svg>
  );
}

/** 14x: a small model plus its sampled thoughts outscores the big one. */
function ArtFourteenX() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <rect x="14" y="26" width="13" height="13" className="fill-current text-correct/20" />
      <rect x="14" y="26" width="13" height="13" className="stroke-current text-correct" fill="none" strokeWidth="1.2" />
      {/* its sampled answers, fanned out above */}
      <circle cx="12" cy="18" r="2" className="fill-current text-compute" />
      <circle cx="20" cy="13" r="2" className="fill-current text-compute" />
      <circle cx="28" cy="16" r="2" className="fill-current text-compute" />
      <circle cx="33" cy="23" r="2" className="fill-current text-compute" />
      <text x="20" y="51" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        1× + thinking
      </text>
      <text x="48" y="37" textAnchor="middle" fontSize="14" className="fill-current text-ink">
        ≥
      </text>
      <rect x="61" y="10" width="26" height="26" className="fill-current text-ink-muted/15" />
      <rect x="61" y="10" width="26" height="26" className="stroke-current text-ink-muted" fill="none" strokeWidth="1.2" />
      <text x="74" y="51" textAnchor="middle" fontSize="7" className="fill-current text-ink-muted">
        14×, greedy
      </text>
    </svg>
  );
}

/** R: one axis, two limits — thinking wins at one end, parameters at the other. */
function ArtRatioR() {
  return (
    <svg viewBox="0 0 96 56" className="h-full w-full" aria-hidden="true">
      <text x="48" y="14" textAnchor="middle" fontSize="10" className="fill-current text-wrong">
        R
      </text>
      <line x1="14" y1="26" x2="82" y2="26" className="stroke-current text-ink-muted" strokeWidth="1" />
      <path d="M18 23 L13 26 L18 29" className="stroke-current text-ink-muted" fill="none" strokeWidth="1" />
      <path d="M78 23 L83 26 L78 29" className="stroke-current text-ink-muted" fill="none" strokeWidth="1" />
      <text x="14" y="20" fontSize="7" className="fill-current text-ink-muted">
        → 0
      </text>
      <text x="82" y="20" textAnchor="end" fontSize="7" className="fill-current text-ink-muted">
        → ∞
      </text>
      <text x="14" y="38" fontSize="7" className="fill-current text-correct">
        thinking wins
      </text>
      <text x="82" y="50" textAnchor="end" fontSize="7" className="fill-current text-ink">
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
  const width = 500;
  const height = 290;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([1, 4096]).range([0, innerW]);
  const y = scaleLinear().domain([0, 100]).range([innerH, 0]);
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
      <text x={innerW - 4} y={y(tgt) - 5} textAnchor="end" className="fill-ink-muted text-[10px]">
        the target
      </text>

      {/* every curve, drawn in full; only the selected one is emphasized */}
      {family.map((f) => {
        const selected = f.s === size;
        const end = f.pts[f.pts.length - 1];
        const hue = SIZE_HUES[f.s];
        return (
          <g key={f.s} opacity={selected ? 1 : 0.45}>
            <path
              d={path(f.pts)}
              fill="none"
              className={hue.stroke}
              strokeWidth={selected ? 2.75 : 1.25}
            />
            <text
              x={x(end.x) + (f.s === BIG_MODEL ? -2 : 5)}
              y={y(end.y) + (f.s === BIG_MODEL ? -8 : 3)}
              textAnchor={f.s === BIG_MODEL ? "end" : "start"}
              className={`text-[10px] ${hue.fill} ${selected ? "font-semibold" : ""}`}
            >
              {f.s}×
            </text>
          </g>
        );
      })}

      {/* the 14x model's greedy point — the dot to beat */}
      <circle cx={x(BIG_MODEL)} cy={y(tgt)} r={5} className="fill-ink stroke-canvas" strokeWidth={1.5} />
      <text x={x(BIG_MODEL)} y={y(tgt) + 16} textAnchor="middle" className="fill-ink text-[10px]">
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

/**
 * Wu et al.'s Pythia curves on GSM8K (digitized by eye, replotted as
 * accuracy): the allocator's picture with real, published parameter counts.
 */
function PythiaChart() {
  const data = curves.pythiaInferenceScaling;
  const { n410m, n2p8b } = data.fit!.params;
  const series = [
    { label: "410M", pts: data.points.slice(0, n410m), stroke: "stroke-compute", fill: "fill-compute" },
    { label: "2.8B", pts: data.points.slice(n410m, n410m + n2p8b), stroke: "stroke-correct", fill: "fill-correct" },
    { label: "12B", pts: data.points.slice(n410m + n2p8b), stroke: "stroke-ink", fill: "fill-ink" },
  ];

  const width = 560;
  const height = 260;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([1, 4096]).range([0, innerW]);
  const y = scaleLinear().domain([20, 80]).range([innerH, 0]);
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("");

  const title = `GSM8K accuracy against inference FLOPs per question, log x axis, three Pythia models under weighted majority voting. ${series
    .map(
      (s) =>
        `Pythia ${s.label}: from ${s.pts[0].y} percent at ${s.pts[0].x} to ${s.pts[s.pts.length - 1].y} percent at ${s.pts[s.pts.length - 1].x} (times ten to the eleven FLOPs)`,
    )
    .join("; ")}. The smallest model leads at small budgets, flattens near 60 percent, and the larger models pull ahead at large budgets.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs per question (×10¹¹, log scale)"
      yLabel="GSM8K accuracy (%)"
    >
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

      {series.map((s) => {
        const end = s.pts[s.pts.length - 1];
        const atEdge = x(end.x) > innerW - 40;
        return (
          <g key={s.label}>
            <path d={path(s.pts)} fill="none" className={s.stroke} strokeWidth={2} />
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
              className="fill-ink text-[10px] font-semibold"
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
    { model: "Mistral-7B", rebase: false, flops: p.mistral7bSamplingFlops, acc: p.mistral7bSamplingAcc, dx: -8, dy: 4, anchor: "end" as const },
    { model: "Mistral-7B", rebase: true, flops: p.mistral7bRebaseFlops, acc: p.mistral7bRebaseAcc, dx: 8, dy: 4, anchor: "start" as const },
    { model: "Llemma-7B", rebase: false, flops: p.llemma7bSamplingFlops, acc: p.llemma7bSamplingAcc, dx: -8, dy: 4, anchor: "end" as const },
    { model: "Llemma-7B", rebase: true, flops: p.llemma7bRebaseFlops, acc: p.llemma7bRebaseAcc, dx: 8, dy: -8, anchor: "start" as const },
    { model: "Llemma-34B", rebase: false, flops: p.llemma34bSamplingFlops, acc: p.llemma34bSamplingAcc, dx: 8, dy: 4, anchor: "start" as const },
    { model: "Llemma-34B", rebase: true, flops: p.llemma34bRebaseFlops, acc: p.llemma34bRebaseAcc, dx: 8, dy: 4, anchor: "start" as const },
  ];

  const width = 560;
  const height = 280;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([1, 20]).range([0, innerW]);
  const y = scaleLinear().domain([40, 52]).range([innerH, 0]);

  // The headline pair: 7B + tree search vs 34B + sampling, same accuracy.
  const a = rows[3];
  const b = rows[4];
  const savings = Math.round(b.flops / a.flops);

  const title = `Accuracy on MATH500 against inference FLOPs, log x axis. ${rows
    .map(
      (r) =>
        `${r.model} with ${r.rebase ? "REBASE tree search" : "sampling"}: ${r.acc} percent at ${r.flops} times ten to the fourteen FLOPs`,
    )
    .join("; ")}. Llemma-7B with tree search matches Llemma-34B's sampling accuracy with about ${savings} times fewer FLOPs.`;

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
        className="fill-ink text-[10px] font-semibold"
      >
        same accuracy · {savings}× fewer FLOPs
      </text>

      {rows.map((r) => (
        <g key={`${r.model}-${r.rebase}`}>
          {r.rebase ? (
            <rect
              x={x(r.flops) - 4}
              y={y(r.acc) - 4}
              width={8}
              height={8}
              transform={`rotate(45 ${x(r.flops)} ${y(r.acc)})`}
              className="fill-correct stroke-canvas"
              strokeWidth={1.5}
            />
          ) : (
            <circle cx={x(r.flops)} cy={y(r.acc)} r={4.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
          )}
          <text
            x={x(r.flops) + r.dx}
            y={y(r.acc) + r.dy}
            textAnchor={r.anchor}
            className="fill-ink-muted text-[9px]"
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
          head: `✓ matched the 14× model's ${tgt.toFixed(0)}% — for ${(BIG_MODEL / cost).toFixed(1)}× less compute`,
          headTone: "text-correct",
          body: "Test-time compute just did the work of parameters. That is the FLOPs-matched headline result.",
        }
      : {
          tone: "border-compute bg-compute/10",
          head: `matched it — but you spent ${cost} units, and the 14× model needs only ${BIG_MODEL}`,
          headTone: "text-ink",
          body: "The win only counts while your bill stays under the big model's. Back off the knobs and find the cheap crossing.",
        }
    : cap < tgt
      ? {
          tone: "border-wrong bg-wrong/15",
          head: `✗ this model saturates near ${cap.toFixed(0)}% — the target is out of reach`,
          headTone: "text-wrong",
          body: "No sample budget closes the gap: the curve flattens below the dashed line. On problems this far past the base model, pretraining the larger model is the better buy.",
        }
      : {
          tone: "border-grid bg-surface-raised",
          head: `${acc.toFixed(1)}% so far — the 14× model gets ${tgt.toFixed(0)}%`,
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
        that needs them. Matched budget for budget —{" "}
        <strong className="text-ink">which buys more accuracy?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two-knob allocator */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Beat the 14× model
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored illustrative curves · no live model
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              <strong>14× means 14× the base model&rsquo;s parameter count</strong> (Snell et al.
              report model scale only as a multiple),
              <Cite n={REF.snell} /> and inference FLOPs scale with parameters: an M× model spends
              M units per answer, where one unit is a single answer from the 1× model. The 14×
              model&rsquo;s one greedy answer therefore costs <strong>14 units</strong> and scores{" "}
              <strong className="text-ink">{tgt.toFixed(0)}%</strong> here — the black dot below.
              All four model curves are drawn in full and the knobs never move them: model size
              picks your curve, test-time compute slides your marker along it, and you win by
              crossing the dashed line <em>left</em> of the 14× dot.
            </p>

            {/* controls beside the chart, so the whole game fits one screen */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-center">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
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
                  <p className="text-xs text-ink-muted">{DIFFICULTY_BLURB[difficulty]}</p>
                </div>
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
                  format={(v) => String(2 ** v)}
                  suffix=" samples"
                  onChange={(v) => {
                    setExp(v);
                    recordInteraction(PAGE_N);
                  }}
                />
              </div>
              <FamilyChart difficulty={difficulty} size={size} cost={cost} acc={acc} />
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
              Snell et al. tried two ways of converting test-time FLOPs into accuracy — search over
              sampled steps under a process verifier (page 9&rsquo;s graders), or let the model
              redraft its own answer — and found that the right choice, and the right budget,
              depend on how hard the prompt is. Estimating difficulty first, then allocating, is
              what they call compute-optimal.
              <Cite n={REF.snell} /> Three numbers carry the result:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <LawPanel head="4×" headTone="text-correct" title="fewer samples than best-of-N" art={<ArtFourX />}>
                difficulty-adaptive allocation matches its accuracy for as little as a quarter of
                the compute: 64 samples doing the work of 256
              </LawPanel>
              <LawPanel head="14×" headTone="text-correct" title="the parameters, matched on FLOPs" art={<ArtFourteenX />}>
                a small model plus adaptive test-time compute outscores a pretrained model ~14× its
                size answering greedily — on prompts it can already sometimes solve
              </LawPanel>
              <LawPanel head="R" headTone="text-wrong" title="decides the regime" art={<ArtRatioR />}>
                R = inference tokens served ÷ pretraining tokens. As R → 0, thinking wins. As R →
                ∞, parameters win: pretraining amortizes away, a per-question surcharge never does.
              </LawPanel>
            </div>
            <p className="text-sm text-ink-muted">
              Hard mode is the other boundary: where the small model has no foothold, no budget
              rescues it.
            </p>
          </div>
        </section>
        <Note kicker="References">
          <RefItem n={REF.snell}>
            Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally can be More Effective
            than Scaling Model Parameters</em>.
          </RefItem>
        </Note>

        {/* Step 3 — the field data */}
        <section className="flex min-w-0 flex-col gap-6">
          <h2 className="text-xl font-semibold text-ink">3. The frontier, measured</h2>

          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The game&rsquo;s picture, with real published sizes. Wu et al. gave three Pythia
              models — <strong className="text-ink">410M, 2.8B, and 12B parameters</strong> — a
              growing sample budget on GSM8K, under weighted majority voting.
              <Cite n={REF.wu} />
            </p>
            <PythiaChart />
            <figcaption className="text-sm text-ink-muted">
              On a small budget the <strong className="text-ink">410M model is the
              compute-optimal pick</strong> — sampling it many times beats sampling a big model a
              few times. Then every curve flattens: once the 410M saturates near 60%, the 2.8B and
              finally the 12B pull ahead. Each scale owns a band of the budget axis, exactly the
              crossings you just steered through.
            </figcaption>
            <p className="text-xs text-ink-muted">
              read off the paper&rsquo;s figure by eye (±3 points) and replotted as accuracy; two
              of their five model sizes omitted for legibility
            </p>
          </figure>

          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Smarter inference then shifts the whole frontier. The same paper&rsquo;s results
              table on MATH500: three models, each under plain sampling and under their REBASE
              tree search. Up and to the left is better.
            </p>
            <ParetoScatter />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="circle" className="bg-compute" label="sampling + weighted voting (64–256 samples)" />
              <Key shape="diamond" className="bg-correct" label="REBASE tree search + weighted voting (32 samples)" />
            </div>
            <figcaption className="text-sm text-ink-muted">
              Across every inference strategy and both benchmarks they tested, Wu et al. find the
              7B model needs <strong className="text-ink">about half the total FLOPs</strong> of
              the 34B to reach comparable accuracy — and this table&rsquo;s sharpest instance is
              sharper still: 7B with tree search{" "}
              <strong className="text-ink">edges the 34B model&rsquo;s best sampling run with
              roughly 8× fewer inference FLOPs</strong>.
              <Cite n={REF.wu} /> The fine print holds here too: gains from
              more samples flatten toward a ceiling that the model&rsquo;s own answer distribution
              sets, so without a perfect external verifier, sampling alone never reaches 100%.
            </figcaption>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.wu}>
            Wu et al. 2024, <em>Inference Scaling Laws: An Empirical Analysis of Compute-Optimal
            Inference</em>.
          </RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={curves.computeOptimal.citation} />
        <CitationBadge citation={curves.rebasePareto.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the allocator&rsquo;s curves are authored illustrations pinned to the cited findings, not
        digitized data: Snell et al. report difficulty-adaptive allocation matching best-of-N with
        up to 4× fewer samples, and — at matched total FLOPs — beating a pretrained model about
        14× their base model&rsquo;s parameter count (absolute sizes undisclosed) on prompts the
        base model can already sometimes solve; the exact shapes here are ours, and every
        on-screen behaviour is pinned in the test suite · the Pythia chart is read off Wu et
        al.&rsquo;s GSM8K figure by eye and replotted as accuracy; the REBASE chart is transcribed
        exactly from their MATH500 results table · FLOPs per answer are counted in proportion to
        parameter count throughout
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
