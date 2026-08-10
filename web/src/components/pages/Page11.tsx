"use client";

/**
 * Page 11, "The Keystone" — Act 2's payoff, now measured on the deck's own
 * instrument instead of the authored allocator it used to open on.
 *
 * The claim under test is the test-time compute scaling law: parameters and
 * sampling-and-voting spend the same FLOPs, so at a matched bill, can thinking
 * harder out-buy a bigger model? Section 1 answers it with this deck's own run
 * (lib/page11.ts, from notebooks/page_11_training_vs_scale.ipynb):
 *
 *   B1  no crossing. The 3B's vote curve climbs with more samples but never
 *       reaches the 7B's single greedy answer, on the hard band (pages 6 to 8's
 *       own 100 items, gate-1 reproduced) OR the fresh easy band, even at
 *       several times the 7B's bill. A band toggle and a samples slider let the
 *       reader push it and watch it stall.
 *   B2  the bottleneck is selection, not coverage. The dashed coverage line
 *       sits above the target: the right answer is in the pile far more often
 *       than any realizable selector returns it. This replaces the page's old
 *       "every chain breaks" mechanism, which the deck's own page 7 refuted.
 *
 * The specialist arm the run also measured (a math-trained 1.5B that beats the
 * 7B) is deliberately NOT drawn here: that reasoning-vs-general comparison is
 * page 14's, made at matched size with the R1 distills. Shipping it here would
 * spoil page 14 and break this page's two-knob frame.
 *
 * Section 2 keeps Snell et al. 2024's law (the 4x / 14x / R panels) but reframed
 * as the PUBLISHED 2024 result, on models from before the reasoning recipes, so
 * the measured no-crossing above reads as an era-instance beside it rather than
 * a refutation. Sections 3 and 4 keep Wu et al.'s Pythia bands (main's handover-strip
 * treatment) and REBASE frontier as published receipts. The hand-off names the two loose
 * ends (the selection wall and the discarded reasoning) and points at Act 3,
 * which trains the reasoning into the weights. Footer: Measured / Cited, with a
 * download of the notebook that produced section 1.
 *
 * No em or en dashes in the rendered copy (Page11.test.tsx guards it). Refs:
 * Snell (§2), Brown + Shojaee (§2 hard-mode box), Wu (§3 to 4), Stroebl (§4).
 */

import { useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { PAGE11, type Band, type SmallModel } from "@/lib/page11";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 11;

/** Page 11's references, numbered in order of first appearance. */
const REF = { snell: 1, monkeys: 2, illusion: 3, wu: 4, resample: 5 } as const;

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

/**
 * The keystone game, measured. Accuracy against inference FLOPs, priced in
 * multiples of the big model's one greedy answer (the vertical line at 1x). The
 * small model's vote curve (Qwen2.5-3B, Act 2's shared instrument) climbs with
 * more samples but never crosses the big model's greedy dot, on either band;
 * the dashed line above it is coverage, the answer that was in the pile and
 * went uncashed.
 */
function MeasuredGame({ band, model, nIdx }: { band: Band; model: SmallModel; nIdx: number }) {
  const width = 640;
  const height = 320;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([0.1, 20]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v * 100));
  const tgt = band.target;
  const xf = (flops: number) => x(flops / tgt.flops);

  const vote = band.voteByModel[model];
  const showBestOf = band.bestOf !== null && model === "3B";
  const votePath = vote.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.xTarget)},${y(p.accuracy)}`).join("");
  const covPath = vote.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.xTarget)},${y(p.coverage)}`).join("");
  const marker = vote[nIdx];
  const last = vote[vote.length - 1];

  const title =
    `Accuracy against inference FLOPs on ${band.label} problems (${band.levels}), priced in ` +
    `multiples of the ${tgt.label}'s single greedy answer, log x axis. The target is ${tgt.label} ` +
    `greedy at ${PAGE11.pct(tgt.accuracy)} percent, at one times its own bill. The Qwen2.5-${model} vote ` +
    `curve runs from ${PAGE11.pct(vote[0].accuracy)} percent at ${vote[0].n} sample up to ` +
    `${PAGE11.pct(last.accuracy)} percent at ${last.n} samples and ${last.xTarget.toFixed(1)} times ` +
    `the target's bill, and never reaches the target line. The line above it is coverage: the ` +
    `answer was in the pile ${PAGE11.pct(last.coverage)} percent of the time. Your marker: ` +
    `${marker.n} samples, ${PAGE11.pct(marker.accuracy)} percent, at ${marker.xTarget.toFixed(1)} times the bill.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs (multiples of the big model's one answer, log scale)"
      yLabel="accuracy (%)"
    >
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t / 100)} y2={y(t / 100)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t / 100)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[0.1, 1, 10].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}×
        </text>
      ))}

      {/* PATH 1 -- parameters: the greedy family, one answer each, as a solid
          line so it reads as a deliberate path (a bigger model) that reaches the
          bar at 1x */}
      <path
        d={band.greedy.map((g, i) => `${i === 0 ? "M" : "L"}${xf(g.flops)},${y(g.accuracy)}`).join("")}
        fill="none"
        className="stroke-ink-muted"
        strokeWidth={1.5}
        opacity={0.85}
      />
      {band.greedy.map((g) => (
        <g key={g.label}>
          <circle
            cx={xf(g.flops)}
            cy={y(g.accuracy)}
            r={4}
            className={`${g.label === tgt.label ? "fill-ink" : "fill-ink-muted"} stroke-canvas`}
            strokeWidth={1.5}
          />
          <text x={xf(g.flops)} y={y(g.accuracy) + 15} textAnchor="middle" className="fill-ink-muted text-[9px]">
            {g.label.replace("Qwen2.5-", "")}
          </text>
        </g>
      ))}

      {/* the target: the big model's one greedy answer, the bar to beat */}
      <line x1={0} x2={innerW} y1={y(tgt.accuracy)} y2={y(tgt.accuracy)} className="stroke-ink" strokeWidth={1.25} strokeDasharray="4 3" />
      <text x={2} y={y(tgt.accuracy) - 6} textAnchor="start" className="fill-ink text-[11px] font-semibold">
        the bar to beat: {tgt.label} greedy, {PAGE11.pct(tgt.accuracy)}%
      </text>

      {/* coverage: the answer was reachable this often, the ceiling selection cannot hit */}
      <path d={covPath} fill="none" className="stroke-correct" strokeWidth={1.5} strokeDasharray="1 3" opacity={0.85} />
      <text x={x(last.xTarget) - 3} y={y(last.coverage) - 6} textAnchor="end" className="fill-correct text-[10px] font-semibold">
        coverage {PAGE11.pct(last.coverage)}%
      </text>

      {/* PATH 2 -- samples: the 3B vote curve */}
      <path d={votePath} fill="none" className="stroke-compute" strokeWidth={2.5} />
      {vote.map((p) => (
        <circle key={p.n} cx={x(p.xTarget)} cy={y(p.accuracy)} r={2.5} className="fill-compute stroke-canvas" strokeWidth={1} />
      ))}

      {/* the strongest realizable selector we own, where we own one (page 8);
          it is the 3B's verifier, so only shown when the 3B is selected */}
      {showBestOf && band.bestOf ? (
        <rect
          x={x(band.bestOf.xTarget) - 5}
          y={y(band.bestOf.accuracy) - 5}
          width={10}
          height={10}
          transform={`rotate(45 ${x(band.bestOf.xTarget)} ${y(band.bestOf.accuracy)})`}
          className="fill-wrong stroke-canvas"
          strokeWidth={1.25}
        />
      ) : null}

      {/* the marker: where the sampling slider stands now, a short drop to the axis */}
      <line x1={x(marker.xTarget)} x2={x(marker.xTarget)} y1={y(marker.accuracy)} y2={innerH} className="stroke-compute" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
      <circle cx={x(marker.xTarget)} cy={y(marker.accuracy)} r={6} className="fill-compute stroke-canvas" strokeWidth={2} />
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
 * The source figure was read by eye, so two curves closer than this many
 * accuracy points are not separated by the digitization.
 */
const READ_OFF_TOLERANCE = 3;

/**
 * Who is the best buy at each budget, and where the points cannot tell.
 * Scanned on a log-spaced grid, and only over budgets where at least two
 * series were measured: with nothing to compare against there is no leader
 * to claim. A band is the stretch where one series tops the others; a
 * handover is the stretch where the top two sit within the read-off
 * tolerance, so the crossing inside it is bracketed, not located.
 */
function ownershipScan(allPts: { x: number; y: number }[][]): {
  bands: { idx: number; x0: number; x1: number }[];
  handovers: { x0: number; x1: number }[];
} {
  const lo = Math.min(...allPts.map((p) => p[0].x));
  const hi = Math.max(...allPts.map((p) => p[p.length - 1].x));
  const STEPS = 240;
  const bands: { idx: number; x0: number; x1: number }[] = [];
  const handovers: { x0: number; x1: number }[] = [];
  let scored = false;
  let wasTight = false;
  for (let s = 0; s <= STEPS; s++) {
    const xv = Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * (s / STEPS));
    const ranked = allPts
      .map((pts, i) => ({ i, y: seriesAt(pts, xv) }))
      .filter((r): r is { i: number; y: number } => r.y !== null)
      .sort((a, b) => b.y - a.y);
    if (ranked.length < 2) {
      scored = false;
      wasTight = false;
      continue;
    }
    const last = bands[bands.length - 1];
    if (scored && last && last.idx === ranked[0].i) last.x1 = xv;
    else bands.push({ idx: ranked[0].i, x0: xv, x1: xv });
    const tight = ranked[0].y - ranked[1].y <= READ_OFF_TOLERANCE;
    const lastHandover = handovers[handovers.length - 1];
    if (tight && wasTight && lastHandover) lastHandover.x1 = xv;
    else if (tight) handovers.push({ x0: xv, x1: xv });
    scored = true;
    wasTight = tight;
  }
  return { bands, handovers };
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
  // Hues rank-match section 1's family (smallest green, then blue, then red),
  // so a colour means the same rank in both charts. The -bright siblings carry
  // across this plot's width; the rank order is what has to agree.
  const series = [
    {
      label: "410M",
      pts: data.points.slice(0, n410m),
      stroke: "stroke-correct-bright",
      fill: "fill-correct-bright",
      band: "fill-correct-bright",
      text: "fill-correct",
    },
    {
      label: "2.8B",
      pts: data.points.slice(n410m, n410m + n2p8b),
      stroke: "stroke-compute-bright",
      fill: "fill-compute-bright",
      band: "fill-compute-bright",
      text: "fill-compute",
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

  const { bands, handovers } = ownershipScan(series.map((s) => s.pts));

  const title = `GSM8K accuracy against inference FLOPs per question, log x axis, three Pythia models under weighted majority voting. ${series
    .map(
      (s) =>
        `Pythia ${s.label}: from ${s.pts[0].y} percent at ${s.pts[0].x} to ${s.pts[s.pts.length - 1].y} percent at ${s.pts[s.pts.length - 1].x} (times ten to the eleven FLOPs)`,
    )
    .join("; ")}. Each model's curve is drawn bold only over the budgets where it is the most accurate: the 410M leads at small budgets, flattens near 60 percent, then the 2.8B takes over, and the 12B is ahead at the top of the measured range. Light dashed brackets mark the handovers, where the two leading curves sit within the ${READ_OFF_TOLERANCE} point read-off tolerance and the crossing is bracketed rather than located; the last bracket spans the whole 12B band.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs per question (×10¹¹, log scale)"
      yLabel="GSM8K accuracy (%)"
    >
      {/* each scale owns a band of the budget: the bold curve segments below
          carry it, named here, with no background wash */}
      {bands.map((b) => (
        <text
          key={`leadlabel${b.idx}-${b.x0}`}
          data-testid="ownership-band"
          x={px((x(b.x0) + x(b.x1)) / 2)}
          y={innerH - 8}
          textAnchor="middle"
          className={`${series[b.idx].text} text-[11px] font-semibold`}
        >
          {series[b.idx].label} leads
        </text>
      ))}
      {/* the handovers: a light dashed bracket, not a rule. Inside each the two
          leading curves are within the by-eye read-off, so the crossing sits
          somewhere between the pair rather than on a line. */}
      {handovers.map((h) => (
        <g key={`handover${h.x0}`} data-testid="handover-strip">
          {[h.x0, h.x1].map((edge) => (
            <line
              key={`edge${edge}`}
              x1={x(edge)}
              x2={x(edge)}
              y1={0}
              y2={innerH}
              className="stroke-ink-muted"
              strokeWidth={0.75}
              strokeDasharray="3 3"
              opacity={0.4}
            />
          ))}
        </g>
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
        {bands.map((b, i) => (
          <clipPath key={`clip${i}`} id={`pythia-band-${i}`}>
            <rect x={x(b.x0)} y={0} width={px(x(b.x1) - x(b.x0))} height={innerH} />
          </clipPath>
        ))}
      </defs>

      {/* full curves as thin ghosts, then each one bold inside its own band:
          the baton pass is the picture */}
      {series.map((s) => (
        <path key={`ghost${s.label}`} d={path(s.pts)} fill="none" className={s.stroke} strokeWidth={1.25} opacity={0.35} />
      ))}
      {bands.map((b, i) => (
        <path
          key={`lead${i}`}
          data-testid="lead-segment"
          d={path(series[b.idx].pts)}
          fill="none"
          className={series[b.idx].stroke}
          strokeWidth={3}
          clipPath={`url(#pythia-band-${i})`}
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

  const [bandKey, setBandKey] = useState<"hard" | "easy">("hard");
  const [model, setModel] = useState<SmallModel>("3B");
  const [nIdx, setNIdx] = useState(PAGE11.sampleStops.length - 1);

  const band = PAGE11.bands[bandKey];
  const vote = band.voteByModel[model];
  const marker = vote[nIdx];
  const vote16 = vote[vote.length - 1];
  const gapPts = Math.round((band.target.accuracy - marker.accuracy) * 100);
  // best-of is the 3B's trained verifier (page 8); it applies only to the 3B.
  const showBestOf = model === "3B" && band.bestOf !== null;
  // does the selected model's pile hold the answer more often than the 7B just
  // gets it? True for the 3B (both bands) and the 1.5B on hard; false for the
  // 1.5B on easy, where the small model does not even reach the answer reliably.
  const coversTarget = vote16.coverage > band.target.accuracy + 1e-9;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Act {page.act} · {ACTS[page.act].title}
          </p>
          <h1 className="text-3xl font-bold text-ink">
            <span className="font-mono text-ink-muted">{page.n}. </span>
            {page.title}
          </h1>
        </div>
        <aside className="flex shrink-0 flex-col gap-1 rounded-lg border border-compute/40 bg-compute/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-compute">Reproduce it</p>
          <a
            href={`/notebooks/${PAGE11.download.slug}.zip`}
            download
            className="text-sm font-semibold text-compute underline underline-offset-2 hover:text-compute/80"
          >
            Download the notebook and traces
          </a>
          <p className="text-xs text-ink-muted">{PAGE11.download.sizeLabel}, REPLAY mode, no GPU</p>
        </aside>
      </div>
      <p className="max-w-2xl text-lg text-ink-muted">
        A bigger model and more thinking are{" "}
        <strong className="text-ink">two ways to spend the same FLOPs</strong> (floating-point
        operations, the raw count of arithmetic a chip does): pretraining burns them once into
        parameters, sampling and voting burn them at answer time. Act 2 built the second kind.
        Matched budget for budget on this deck&rsquo;s own instrument,{" "}
        <strong className="text-ink">can thinking harder out-buy a bigger model?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the game, measured on our own instrument */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. The game, on our own instrument
            <span className="block text-xs font-normal text-ink-muted">
              beat the bigger model&rsquo;s one answer · measured, Qwen2.5-3B against 7B
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              The <strong className="text-ink">{band.target.label}</strong>&rsquo;s single greedy
              answer is the target: the black line, priced at{" "}
              <strong>one times its own bill</strong>. The small model
              {" "}(<strong className="text-ink">3B</strong>) spends that same bill differently, on
              more samples and a vote. Push the samples and its blue curve climbs, but{" "}
              <strong>it never reaches the black line</strong>, here or several times past it.
            </p>

            <MeasuredGame band={band} model={model} nIdx={nIdx} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="line" className="bg-ink-muted" label="a bigger model (scale up the parameters)" />
              <Key shape="line" className="bg-compute" label={`the ${model}, thinking harder (more samples + a vote)`} />
              <Key shape="line" className="bg-correct" label="coverage: a correct answer was in the pile" />
              {showBestOf ? (
                <Key shape="diamond" className="bg-wrong" label="best-of-16 (a trained verifier)" />
              ) : null}
            </div>
            <p className="text-xs text-ink-muted">
              measured on this deck&rsquo;s instrument: the hard band is pages 6 to 8&rsquo;s own
              100 MATH-500 level 4 to 5 problems, and the run reproduces their shipped numbers
              exactly before it draws anything new (gate 1). FLOPs are counted 2 &times; parameters &times;
              tokens, from measured token counts.
            </p>

            <div className="flex flex-col gap-4 border-t border-dashed border-grid pt-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-sm text-ink-muted">Problem difficulty</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Problem difficulty">
                    {(["easy", "hard"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={bandKey === k}
                        onClick={() => {
                          setBandKey(k);
                          recordInteraction(PAGE_N);
                        }}
                        className={`rounded border px-3 py-1.5 text-sm capitalize ${
                          bandKey === k
                            ? "border-compute bg-compute/15 font-semibold text-ink"
                            : "border-grid bg-surface-raised text-ink-muted"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-sm text-ink-muted">Which model votes</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Which model votes">
                    {(["1.5B", "3B"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={model === m}
                        onClick={() => {
                          setModel(m);
                          recordInteraction(PAGE_N);
                        }}
                        className={`rounded border px-3 py-1.5 text-sm ${
                          model === m
                            ? "border-compute bg-compute/15 font-semibold text-ink"
                            : "border-grid bg-surface-raised text-ink-muted"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="basis-full text-xs text-ink-muted">
                  {band.label} problems, MATH-500 {band.levels}, n = {band.nItems}
                </p>
              </div>
              <Slider
                label={`Test-time compute (samples the ${model} votes over)`}
                min={0}
                max={PAGE11.sampleStops.length - 1}
                value={nIdx}
                format={(v) => `${PAGE11.sampleStops[v]} sample${PAGE11.sampleStops[v] === 1 ? "" : "s"}`}
                onChange={(v) => {
                  setNIdx(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <div className="rounded border-l-4 border-wrong bg-wrong/15 p-3 text-sm" role="status">
              <p className="font-semibold text-wrong">
                {model} vote@{marker.n}: {PAGE11.pct(marker.accuracy)}%, still {gapPts} point
                {gapPts === 1 ? "" : "s"} under the {band.target.label}&rsquo;s{" "}
                {PAGE11.pct(band.target.accuracy)}%
              </p>
              <p className="mt-1 text-ink">
                and now at <strong>{marker.xTarget.toFixed(1)}&times;</strong> its bill.{" "}
                {showBestOf && band.bestOf
                  ? `Even a trained verifier (page 8) only ties it, at ${PAGE11.pct(band.bestOf.accuracy)}%. `
                  : ""}
                No sample budget on this band crosses the line.
              </p>
            </div>

            {/* the mechanism (B2): the bottleneck is selection, not coverage. On the
                1.5B easy band coverage itself falls below the target, so the copy adapts. */}
            <p className="border-t border-dashed border-grid pt-3 text-sm text-ink">
              <strong>Why more samples do not cross:</strong>{" "}
              {coversTarget ? (
                <>
                  the bottleneck is not the thinking, it is the picking. The dotted green line is{" "}
                  <strong className="text-ink">coverage</strong>: a correct answer is somewhere in
                  the {vote16.n} sampled chains{" "}
                  <strong className="text-ink">{PAGE11.pct(vote16.coverage)}%</strong> of the time,
                  above the {band.target.label}&rsquo;s {PAGE11.pct(band.target.accuracy)}%. The
                  chains are not breaking; the reasoning is there. What fails is selection: voting
                  returns that answer only{" "}
                  <strong className="text-ink">{PAGE11.pct(vote16.accuracy)}%</strong> of the time.{" "}
                  <strong>
                    The answer is in the pile, and no rule we can run at answer time reliably grabs
                    it.
                  </strong>
                </>
              ) : (
                <>
                  for the {model} on easy problems it is not only the picking. Coverage, the dotted
                  green line, reaches just{" "}
                  <strong className="text-ink">{PAGE11.pct(vote16.coverage)}%</strong> in the{" "}
                  {vote16.n} sampled chains, already below the {band.target.label}&rsquo;s{" "}
                  {PAGE11.pct(band.target.accuracy)}%: the smaller model does not reliably reach the
                  answer to begin with, and voting cashes only{" "}
                  <strong className="text-ink">{PAGE11.pct(vote16.accuracy)}%</strong>.{" "}
                  <strong>Scaling the parameters, not the samples, is what closes that gap.</strong>
                </>
              )}
            </p>
          </div>
        </section>
        <Note kicker="Try it">
          <p>
            Push <em>test-time compute</em> to 16 and watch the blue curve stall below the black
            line.
          </p>
          <p>
            Then switch bands, or to the <strong>1.5B</strong>, and watch it stall lower still.
          </p>
        </Note>

        {/* Step 2 — the law, stated */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. The published law, and its fine print</h2>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              That was our own instrument, in 2026, and the result should surprise you: the
              published record says a small model that thinks <em>can</em> out-buy a bigger one.
              The rest of this page is that record, and the gap between it and what we measured.
              Start with the law itself. Snell et al. 2024, on models from before the
              reasoning-training recipes, found that guessing how hard a prompt is first, then
              choosing the strategy and budget to match, can beat a bigger model at a matched bill.
              They call it compute-optimal.
              <Cite n={REF.snell} /> Three numbers carry it:
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
              same blindness. There is contested evidence that this hardens into a cliff: that
              past a complexity threshold even models trained to think collapse no matter the
              budget.
              <Cite n={REF.illusion} /> The argument here does not need the cliff. Parameters are
              the knob that changes what is in the distribution at all.
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
              The law is not only Snell&rsquo;s claim; Wu et al. 2024 measured it. Three real
              models (<strong className="text-ink">Pythia 410M, 2.8B, and 12B</strong>) on a growing
              GSM8K sample budget under weighted majority voting: sampling the small one many times
              beats sampling a big one a few times, and the crossings the law predicts show up in
              the data.
              <Cite n={REF.wu} /> This is a 2024-era family, and a wide one: the 2.8B is about 7×
              the 410M and the 12B about 29×, so the colours carry rank, not fixed multiples.
              Section 2 allocated by prompt; this allocates by budget. Each curve is drawn bold only
              where that model is the compute-optimal buy, over the budgets where more than one
              model was measured.
            </p>
            <PythiaChart />
            <figcaption className="text-sm text-ink-muted">
              On a small budget the <strong className="text-ink">410M model is the
              compute-optimal pick</strong>: sampling it many times beats sampling a big model a
              few times. Then every curve flattens. Once the 410M saturates near 60%, the 2.8B and
              then the 12B pull ahead, so each scale owns a band of the budget axis, shown by the
              bold curve segments. The dashed brackets mark those handoffs, and they are wide:
              inside them the leading curves differ by less than the ±3 points this figure was read
              to, so the crossing sits somewhere in the bracket rather than on a line. The last
              bracket spans the whole 12B band, so the order of the handoffs is what this chart
              shows, not the budget at which the 12B takes over.
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
              <Key shape="circle" className="bg-ink-muted" label="sampling + weighted voting (64 to 256 samples)" />
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
            <strong className="text-ink">So why did the crossing not appear for us?</strong> The
            record above is real, but the law lives in a narrow window, where the model reaches the
            answer sometimes but not reliably, and on a 2026 post-trained model that window has
            shrunk toward the hardest problems. That leaves two loose ends. The selection
            wall: the answer is in the pile, but no rule we can run at answer time reliably grabs
            it, and past the hardest problems the pile stops holding it at all. And the waste:
            sampling, voting, and search all spend their compute at answer time and throw away the
            reasoning they bought, even though a chain that reached the answer is a worked solution
            the model wrote for itself.{" "}
            <em>The frontier&rsquo;s answer to both was to stop selecting at inference time and
            train the reasoning into the weights: page 12 keeps the winning chains and fine-tunes
            on them, and pages 13 and 14 reward only correct answers until the reasoning emerges on
            its own.</em>
          </p>
        </div>
      </div>

      
      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Measured</strong>: section 1 is this deck&rsquo;s own run on
          Qwen2.5 1.5B, 3B and 7B-Instruct. The hard band is pages 6 to 8&rsquo;s exact 100
          MATH-500 level 4 to 5 problems, reproduced to the digit before any new generation (gate
          1), plus a fresh 50-item easy band at levels 1 to 3. One family, one grader, one date, so
          the crossing&rsquo;s absence is an instance on a 2026 instrument, not a refutation of the
          cited results, which is why sections 3 and 4 keep them as published. The notebook that
          produced this section is linked at the top of the page.
        </p>
        <p>
          <strong className="text-ink">Cited</strong>: the law panels in section 2 are Snell et
          al. 2024&rsquo;s findings, reported as scale multiples (absolute parameter counts
          undisclosed); section 3 is read off Wu et al.&rsquo;s GSM8K figure by eye (plus or minus
          3 points, two of five model sizes omitted for legibility); section 4 is transcribed from
          the same paper&rsquo;s MATH500 results table.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
