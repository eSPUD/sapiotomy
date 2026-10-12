"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { line as d3line, scaleLinear, scaleLog } from "d3";
import { CHART_MARGIN, ChartFrame } from "@/components/ChartFrame";
import { Slider } from "@/components/Slider";
import { ISO_BUDGETS, lossAtBudget, optimumAt, tokensFor } from "@/lib/scalingLaw";
import { fmtParams } from "@/lib/trainingTime";

/** "60B", "1.3T": a token count in the units a reader can hold. */
const fmtTokens = (d: number) =>
  d >= 1e12 ? `${(d / 1e12).toFixed(1)}T` : d >= 1e9 ? `${Math.round(d / 1e9)}B` : `${Math.round(d / 1e6)}M`;
/** The exponent of a power of ten: 1e23 -> 23. */
const exp10 = (c: number) => Math.round(Math.log10(c));
/** 1e23 spoken: "10 to the 23". */
const spoken = (c: number) => `10 to the ${exp10(c)}`;
/**
 * 1e23 set as 10 with a raised 23. A real superscript, not the Unicode
 * superscript digits: those come from two blocks (¹²³ and ⁴-⁹) that most fonts
 * draw at different heights, so "10²⁴" looks misaligned. Screen readers get
 * "10 to the 23" instead of a run of digits.
 */
function Pow10({ c }: { c: number }) {
  return (
    <>
      <span aria-hidden="true">
        10<sup className="text-[0.7em]">{exp10(c)}</sup>
      </span>
      <span className="sr-only">{spoken(c)}</span>
    </>
  );
}

/**
 * Putting a budget in familiar terms. Chinchilla's own run (70B parameters on
 * 1.4T tokens, Hoffmann et al. 2022) cost about 6 x 70e9 x 1.4e12 = 5.9e23 FLOPs.
 * The GPU time is DERIVED under a stated assumption, said again in page 3's FLOPs
 * note: 1,000 NVIDIA B200 (Blackwell) GPUs, each sustaining 900 trillion FLOPs a
 * second, 40% of its 2.25 petaFLOPS dense BF16 peak (NVIDIA's HGX B200 spec: 36
 * PFLOPS BF16 for 8 GPUs, quoted sparse; dense is half), so 9e17 FLOPs a second.
 */
const CHINCHILLA_FLOPS = 6 * 70e9 * 1.4e12;
const FLEET_FLOPS_PER_S = 1000 * 9e14;
/** "about 1/60 of", "about 1.7 times": a budget against Chinchilla's run. */
function vsChinchilla(c: number): string {
  const r = c / CHINCHILLA_FLOPS;
  if (r >= 10) return `about ${Math.round(r)} times`;
  if (r >= 1) return `about ${r.toFixed(1)} times`;
  const inv = 1 / r;
  const round1 = Number(inv.toPrecision(1));
  return round1 === 6 ? "about a sixth of" : `about 1/${round1} of`;
}
/** "40 minutes", "7 hours", "3 days", "29 days": a budget on the assumed fleet. */
function onFleet(c: number): string {
  const sec = c / FLEET_FLOPS_PER_S;
  if (sec < 3600) return `${Math.round(sec / 60)} minutes`;
  if (sec < 2 * 86400) return `${Math.round(sec / 3600)} hours`;
  return `${Math.round(sec / 86400)} days`;
}

const N_MIN = 1e8;
const N_MAX = 1e12;
const Y_DOMAIN: [number, number] = [1.85, 2.8];

/**
 * The iso-compute explorer. A fixed training budget can buy a bigger model on
 * less text or a smaller one on more; the U-shaped curve is the predicted loss
 * along one budget, and its lowest point is the compute-optimal split. Six
 * budgets, each ten times the last, share the plot so the reader sees two
 * things at once: the best split stays near 20 tokens per parameter, and each
 * tenfold budget lowers the best loss by less than the one before.
 *
 * Drawn at its own measured width and a fixed height, like page 3's other
 * charts, so its text keeps its size; on a phone it is drawn 640 wide and scales.
 */
export function IsoComputeExplorer({ height = 280 }: { height?: number }) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = plotRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const px = Math.round(e.contentRect.width);
      setWidth(px < 480 ? 640 : px);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Opens on 10^23 FLOPs, a sixth of Chinchilla's run.
  const [budgetIdx, setBudgetIdx] = useState<number>(ISO_BUDGETS.indexOf(1e23));
  // Opens off the optimum (a model too big for its budget), so the first drag
  // finds the bottom of the curve.
  const [logN, setLogN] = useState(11);
  const groupId = useId();

  const C = ISO_BUDGETS[budgetIdx];
  const N = 10 ** logN;
  const D = tokensFor(C, N);
  const loss = lossAtBudget(C, N);
  const best = optimumAt(C);
  const bests = useMemo(() => ISO_BUDGETS.map((c) => optimumAt(c)), []);

  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([N_MIN, N_MAX]).range([0, innerW]);
  const y = scaleLinear().domain(Y_DOMAIN).range([innerH, 0]);
  const clipId = `${groupId}-clip`.replace(/:/g, "");

  const curvePath = (c: number) => {
    const pts = Array.from({ length: 121 }, (_, k) => {
      const n = 10 ** (8 + (4 * k) / 120);
      return [x(n), y(lossAtBudget(c, n))] as [number, number];
    });
    return d3line()(pts) ?? "";
  };

  return (
    <div className="flex flex-col gap-4 min-[1440px]:flex-row min-[1440px]:items-start">
      <div ref={plotRef} className="flex min-w-0 flex-1 flex-col gap-3">
        <ChartFrame
          title={`Predicted training loss against model size, along ${ISO_BUDGETS.length} training budgets of ${ISO_BUDGETS.map(spoken).join(", ")} FLOPs. Each curve is U-shaped: too small a model wastes the budget on text it cannot use, too big a model leaves too little text. The lowest points sit near 20 tokens per parameter, at losses of ${bests.map((b) => b.loss.toFixed(2)).join(", ")}, each tenfold budget buying a smaller drop.`}
          width={width}
          height={height}
          xLabel="model size (parameters, log scale)"
          yLabel="predicted loss (lower is better)"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={0} y={0} width={innerW} height={innerH} />
            </clipPath>
          </defs>
          {/* axes */}
          {[1e8, 1e9, 1e10, 1e11, 1e12].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={1} />
              <text x={x(t)} y={innerH + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
                {fmtParams(t)}
              </text>
            </g>
          ))}
          {[2.0, 2.2, 2.4, 2.6, 2.8].map((t) => (
            <g key={t}>
              <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={1} />
              <text x={-8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[11px]">
                {t.toFixed(1)}
              </text>
            </g>
          ))}
          <g clipPath={`url(#${clipId})`}>
            {/* the unselected budgets, faint, then the chosen one on top */}
            {ISO_BUDGETS.map((c, i) =>
              i === budgetIdx ? null : (
                <path key={c} d={curvePath(c)} fill="none" className="stroke-ink-muted" strokeOpacity={0.35} strokeWidth={1.25} />
              ),
            )}
            <path d={curvePath(C)} fill="none" className="stroke-compute-bright" strokeWidth={2.5} />
            {/* each budget's best split, joined: it moves right and down, by less each time */}
            <path
              d={d3line()(bests.map((b) => [x(b.N), y(b.loss)] as [number, number])) ?? ""}
              fill="none"
              className="stroke-ink-muted"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          </g>
          {bests.map((b, i) => (
            <g key={ISO_BUDGETS[i]}>
              <circle
                cx={x(b.N)}
                cy={y(b.loss)}
                r={i === budgetIdx ? 4.5 : 3}
                className={i === budgetIdx ? "fill-compute-bright" : "fill-ink-muted"}
                fillOpacity={i === budgetIdx ? 1 : 0.5}
              />
              <text
                x={x(b.N)}
                y={y(b.loss) - 9}
                textAnchor="middle"
                className={`text-[10px] ${i === budgetIdx ? "fill-ink font-semibold" : "fill-ink-muted"}`}
              >
                10
                <tspan dy={-4} fontSize="0.75em">
                  {exp10(ISO_BUDGETS[i])}
                </tspan>
              </text>
            </g>
          ))}
          {/* the reader's split on the chosen budget */}
          {loss <= Y_DOMAIN[1] ? (
            <>
              <line x1={x(N)} x2={x(N)} y1={y(loss)} y2={innerH} className="stroke-compute-ink" strokeDasharray="2 3" strokeWidth={1} />
              <circle cx={x(N)} cy={y(loss)} r={6} className="fill-canvas stroke-compute-ink" strokeWidth={2} />
            </>
          ) : null}
        </ChartFrame>

        {/* Budget: one of six, each ten times the last. */}
        <div role="radiogroup" aria-label="Training budget" className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-ink-muted">Training budget</span>
          {ISO_BUDGETS.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={i === budgetIdx}
              onClick={() => setBudgetIdx(i)}
              className={`rounded border px-1.5 py-0.5 text-xs tabular-nums ${
                i === budgetIdx ? "border-compute bg-compute font-semibold text-ink" : "border-grid text-ink-muted hover:text-ink"
              }`}
            >
              <Pow10 c={c} /> FLOPs
            </button>
          ))}
        </div>
        {/* The chosen budget, in familiar terms. */}
        <p className="text-sm text-ink-muted" aria-live="polite">
          <Pow10 c={C} /> FLOPs is {vsChinchilla(C)} Chinchilla&apos;s training run, or roughly{" "}
          {onFleet(C)} on 1,000 NVIDIA B200 GPUs.
        </p>
        <Slider
          label="Model size (the rest of the budget buys training text)"
          min={8}
          max={12}
          step={0.05}
          value={logN}
          onChange={setLogN}
          format={(v) => `${fmtParams(10 ** v)} parameters`}
        />
      </div>

      {/* The readout: the reader's split against the best one for this budget. */}
      <div className="flex flex-col gap-2 min-[1440px]:w-48 min-[1440px]:shrink-0">
        <div className="flex flex-col gap-0.5 rounded-lg border border-grid bg-canvas p-2.5">
          <p className="text-xs font-semibold text-ink">Your split</p>
          <p className="text-[11px] leading-snug text-ink-muted">
            {fmtParams(N)} parameters on {fmtTokens(D)} tokens,{" "}
            {D / N < 1 ? "under 1 token" : `${Math.round(D / N).toLocaleString("en-US")} tokens`} per parameter
          </p>
          <p className="font-mono text-lg font-bold tabular-nums text-compute-ink">loss {loss.toFixed(3)}</p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg border border-grid bg-canvas p-2.5">
          <p className="text-xs font-semibold text-ink">Best split for <Pow10 c={C} /> FLOPs</p>
          <p className="text-[11px] leading-snug text-ink-muted">
            {fmtParams(best.N)} parameters on {fmtTokens(best.D)} tokens, about {Math.round(best.D / best.N)} tokens per
            parameter
          </p>
          <p className="font-mono text-lg font-bold tabular-nums text-ink">loss {best.loss.toFixed(3)}</p>
        </div>
        <BestLossSpark losses={bests.map((b) => b.loss)} selected={budgetIdx} />
      </div>
    </div>
  );
}

/**
 * The best loss at each budget as a tiny line plot, so the flattening is seen
 * rather than read off a row of numbers: each tenfold step drops the line by
 * less. The chosen budget's point is lit; the numbers stay in the label.
 */
function BestLossSpark({ losses, selected }: { losses: number[]; selected: number }) {
  const W = 192;
  const H = 84;
  const m = { left: 12, right: 12, top: 14, bottom: 18 };
  const lo = Math.min(...losses);
  const hi = Math.max(...losses);
  const sx = (i: number) => m.left + (i * (W - m.left - m.right)) / (losses.length - 1);
  const sy = (l: number) => m.top + ((hi - l) / (hi - lo)) * (H - m.top - m.bottom);
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-[11px] leading-snug text-ink-muted">
        Best loss as the budget grows ×10 each step. Each step buys less.
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[16rem]"
        role="img"
        aria-label={`Best loss at ${ISO_BUDGETS.map(spoken).join(", ")} FLOPs: ${losses.map((l) => l.toFixed(2)).join(", ")}.`}
      >
        <polyline
          points={losses.map((l, i) => `${sx(i)},${sy(l)}`).join(" ")}
          fill="none"
          className="stroke-ink-muted"
          strokeWidth={1.25}
        />
        {losses.map((l, i) => (
          <g key={ISO_BUDGETS[i]}>
            <circle
              cx={sx(i)}
              cy={sy(l)}
              r={i === selected ? 3.5 : 2.5}
              className={i === selected ? "fill-compute-bright" : "fill-ink-muted"}
            />
            <text
              x={sx(i)}
              y={sy(l) - 6}
              textAnchor="middle"
              className={`text-[9px] tabular-nums ${i === selected ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {l.toFixed(2)}
            </text>
            <text
              x={sx(i)}
              y={H - 4}
              textAnchor="middle"
              className={`text-[9px] ${i === selected ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              10
              <tspan dy={-3} fontSize="0.75em">
                {exp10(ISO_BUDGETS[i])}
              </tspan>
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
