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
 * a refutation. Sections 3 and 4 keep Wu et al.'s Pythia bands and REBASE
 * frontier as published receipts; section 3's ownership bands are washed in
 * again, with the tint DEEPENING by scale so they separate without colour, and
 * each handover carried as a capped bar in a reserved strip under the band
 * names rather than a full-height rule that could cut through one. The
 * hand-off names the two loose
 * ends (the selection wall and the discarded reasoning) and points at Act 3,
 * which trains the reasoning into the weights.
 *
 * The page runs on pages 5 to 9's shape: every section is a heading with its
 * own kicker, then a lede in the page's whitespace saying what the figure is a
 * picture OF, then a bordered card holding only the figure and its apparatus.
 * Nothing that frames a figure lives inside the card with it.
 *
 * The apparatus lives beside the figures it qualifies, not in a footer: the
 * Measured / Cited block was retired (page 17's move, page 5's and page 7's
 * pattern), and the notebook download rides the top line with the act kicker as
 * on page 5. Section 1's figure branches the vote curve off the small model's
 * OWN greedy dot, so the two roads leave one place instead of the blue curve
 * appearing to cut the parameter line by accident, and the coverage gap is drawn
 * as risers plus one capped, counted bracket instead of a shaded wash.
 *
 * No em or en dashes in the rendered copy (Page11.test.tsx guards it). Refs:
 * Snell (§2), Brown (§2 hard-mode box), Wu (§3 to 4), Stroebl (§4).
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
const REF = { snell: 1, monkeys: 2, wu: 3, resample: 4 } as const;

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

  const showBestOf = band.bestOf !== null && model === "3B";
  // The sampling road, rung 0 of which IS the small model's own greedy answer,
  // so the vote curve and the coverage curve both start ON the black dot rather
  // than near it. Where the two roads part is the page's whole claim, and a
  // curve that begins beside its origin and doubles back reads as a bug.
  const road = PAGE11.roadFor(band, model);
  const ownLabel = `Qwen2.5-${model}`;
  const votePath = road.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.xTarget)},${y(p.accuracy)}`).join("");
  const covPath = road.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.xTarget)},${y(p.coverage)}`).join("");
  const marker = road[nIdx];
  const last = road[road.length - 1];
  // the coverage-selection gap, drawn as a measured distance rather than a
  // wash: one thin riser per sample budget, and a capped bracket on the last.
  const gapPts = Math.round((last.coverage - last.accuracy) * 100);

  const title =
    `Accuracy against inference FLOPs on ${band.label} problems (${band.levels}), priced in ` +
    `multiples of the ${tgt.label}'s single greedy answer, log x axis. The target is ${tgt.label} ` +
    `greedy at ${PAGE11.pct(tgt.accuracy)} percent, at one times its own bill. The Qwen2.5-${model}'s ` +
    `sampling road leaves that model's own greedy dot at ${PAGE11.pct(road[0].accuracy)} percent and ` +
    `${road[0].xTarget.toFixed(2)} times the target's bill, dips at 2 samples, and climbs to ` +
    `${PAGE11.pct(last.accuracy)} percent at ${last.n} samples and ${last.xTarget.toFixed(1)} times ` +
    `the target's bill, never reaching the target line. The line above it is coverage, which leaves the ` +
    `same dot: the answer was in the pile ${PAGE11.pct(last.coverage)} percent of the time, ${gapPts} ` +
    `points above what the vote returns. Your marker: ` +
    `${marker.greedy ? "the greedy answer" : `${marker.n} samples`}, ${PAGE11.pct(marker.accuracy)} ` +
    `percent, at ${marker.xTarget.toFixed(1)} times the bill.`;

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
          {/* the fork wears a ring: this one dot is where both roads start, the
              small model's own single answer before it buys any more thinking */}
          {g.label === ownLabel ? (
            <circle
              data-testid="branch-point"
              cx={xf(g.flops)}
              cy={y(g.accuracy)}
              r={7.5}
              fill="none"
              className="stroke-compute"
              strokeWidth={1.25}
              opacity={0.7}
            />
          ) : null}
          <circle
            cx={xf(g.flops)}
            cy={y(g.accuracy)}
            r={4}
            className={`${g.label === tgt.label ? "fill-ink" : "fill-ink-muted"} stroke-canvas`}
            strokeWidth={1.5}
          />
          <text
            x={xf(g.flops)}
            y={y(g.accuracy) + (g.label === ownLabel ? 19 : 15)}
            textAnchor="middle"
            className="fill-ink-muted text-[9px]"
          >
            {g.label.replace("Qwen2.5-", "")}
          </text>
        </g>
      ))}

      {/* the target: the big model's one greedy answer, the bar to beat */}
      <line x1={0} x2={innerW} y1={y(tgt.accuracy)} y2={y(tgt.accuracy)} className="stroke-ink" strokeWidth={1.25} strokeDasharray="4 3" />
      <text x={2} y={y(tgt.accuracy) - 6} textAnchor="start" className="fill-ink text-[11px] font-semibold">
        the bar to beat: {tgt.label} greedy, {PAGE11.pct(tgt.accuracy)}%
      </text>

      {/* the coverage-selection gap, measured rather than washed: one thin riser
          per sample budget, so the reader sees it open as samples are added */}
      {/* on rung 0 there is nothing to pick between, so coverage IS the answer
          and the riser has no height; drawing it would be a tick meaning nothing */}
      {road.filter((p) => p.coverage > p.accuracy).map((p) => (
        <line
          key={`riser${p.n}`}
          data-testid="gap-riser"
          x1={x(p.xTarget)}
          x2={x(p.xTarget)}
          y1={y(p.accuracy)}
          y2={y(p.coverage)}
          className="stroke-correct"
          strokeWidth={1}
          opacity={0.45}
        />
      ))}

      {/* coverage: the answer was reachable this often, the ceiling selection cannot hit */}
      <path d={covPath} fill="none" className="stroke-correct" strokeWidth={1.5} strokeDasharray="1 3" opacity={0.85} />
      <text x={x(last.xTarget) - 3} y={y(last.coverage) - 6} textAnchor="end" className="fill-correct text-[10px] font-semibold">
        coverage {PAGE11.pct(last.coverage)}%
      </text>

      {/* the widest riser, capped and named: this many points were found and
          thrown away at the top of the budget */}
      <g>
        {[last.accuracy, last.coverage].map((v) => (
          <line
            key={`cap${v}`}
            x1={x(last.xTarget) - 4}
            x2={x(last.xTarget) + 4}
            y1={y(v)}
            y2={y(v)}
            className="stroke-correct"
            strokeWidth={1.25}
          />
        ))}
        {/* Labelled to the RIGHT of the bracket: to its left the coverage line
            is climbing into exactly this band of the plot. On the easy band the
            gap is narrow and straddles the target rule, so the label sits on a
            canvas plate and knocks the rule out rather than fighting it. */}
        <rect
          x={x(last.xTarget) + 5}
          y={px((y(last.accuracy) + y(last.coverage)) / 2) - 13}
          width={86}
          height={22}
          rx={2}
          className="fill-surface"
        />
        <text
          x={x(last.xTarget) + 8}
          y={px((y(last.accuracy) + y(last.coverage)) / 2) - 4}
          textAnchor="start"
          className="fill-correct text-[9px] font-semibold"
        >
          found, not selected
        </text>
        <text
          x={x(last.xTarget) + 8}
          y={px((y(last.accuracy) + y(last.coverage)) / 2) + 6}
          textAnchor="start"
          className="fill-correct text-[9px]"
        >
          {gapPts} points
        </text>
      </g>

      {/* PATH 2 -- samples: the small model's vote curve, starting ON its own
          greedy dot, so the two roads leave one place and only ever go right */}
      <path data-testid="vote-road" d={votePath} fill="none" className="stroke-compute" strokeWidth={2.5} />
      {/* rung 0 already has the black dot and its ring; a blue dot on top would
          just hide the fork */}
      {road.filter((p) => !p.greedy).map((p) => (
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
      {marker.greedy ? (
        // on the fork, a filled marker would bury the black dot underneath it
        <circle cx={x(marker.xTarget)} cy={y(marker.accuracy)} r={7.5} fill="none" className="stroke-compute" strokeWidth={2.5} />
      ) : (
        <circle cx={x(marker.xTarget)} cy={y(marker.accuracy)} r={6} className="fill-compute stroke-canvas" strokeWidth={2} />
      )}
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
 * How hard each scale's ownership band is tinted, smallest to largest. The
 * ramp is the point: it makes the three bands separable by lightness alone, so
 * the figure still segments for a reader who cannot tell the green from the
 * blue, and it means something (a heavier tint is a bigger model).
 */
const WASH_OPACITY = [0.07, 0.15, 0.24];

/**
 * Who is the best buy at each budget, and how well the points pin down the
 * moment the baton passes. Scanned on a log-spaced grid, and only over budgets
 * where at least two series were measured: with nothing to compare against
 * there is no leader to claim.
 *
 * A band is the stretch where one series tops the others. A boundary is one
 * handover between two adjacent bands, carried as the interval AROUND that
 * crossing over which the top two sit within the read-off tolerance.
 *
 * Tying the interval to its crossing is the point. An earlier version scanned
 * for "tight" stretches independently of the bands, so a bracket edge could
 * land anywhere, including straight through a band's own label. Every interval
 * this returns now straddles exactly one band edge.
 */
function ownershipScan(allPts: { x: number; y: number }[][]): {
  bands: { idx: number; x0: number; x1: number }[];
  boundaries: { at: number; x0: number; x1: number }[];
} {
  const lo = Math.min(...allPts.map((p) => p[0].x));
  const hi = Math.max(...allPts.map((p) => p[p.length - 1].x));
  const STEPS = 240;
  const at = (s: number) => Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * (s / STEPS));
  /** leader index and the top-two margin at one grid step, or null if nothing to compare */
  const rank = (xv: number) => {
    const r = allPts
      .map((pts, i) => ({ i, y: seriesAt(pts, xv) }))
      .filter((v): v is { i: number; y: number } => v.y !== null)
      .sort((a, b) => b.y - a.y);
    return r.length < 2 ? null : { idx: r[0].i, margin: r[0].y - r[1].y };
  };

  const bands: { idx: number; x0: number; x1: number }[] = [];
  const scored: { s: number; idx: number; margin: number }[] = [];
  let open = false;
  for (let s = 0; s <= STEPS; s++) {
    const r = rank(at(s));
    if (!r) {
      open = false;
      continue;
    }
    scored.push({ s, ...r });
    const last = bands[bands.length - 1];
    if (open && last && last.idx === r.idx) last.x1 = at(s);
    else {
      // hand the axis over at one x, so the washes tile the compared range with
      // no seam: the crossing is inside the last grid interval either way, and
      // that uncertainty is what the boundary bracket is for
      if (open && last) last.x1 = at(s);
      bands.push({ idx: r.idx, x0: at(s), x1: at(s) });
    }
    open = true;
  }

  // one bracket per band edge, grown outward from the crossing for as long as
  // the two leading curves stay inside the by-eye read-off
  const boundaries: { at: number; x0: number; x1: number }[] = [];
  for (let b = 1; b < bands.length; b++) {
    const cross = bands[b].x0;
    const pivot = scored.findIndex((v) => at(v.s) >= cross);
    if (pivot < 0) continue;
    let i = pivot;
    let j = pivot;
    while (i > 0 && scored[i - 1].margin <= READ_OFF_TOLERANCE) i--;
    while (j < scored.length - 1 && scored[j + 1].margin <= READ_OFF_TOLERANCE) j++;
    boundaries.push({ at: cross, x0: at(scored[i].s), x1: at(scored[j].s) });
  }
  return { bands, boundaries };
}

/**
 * Wu et al.'s Pythia curves on GSM8K (digitized by eye, replotted as
 * accuracy): the allocator's picture with real, published parameter counts.
 * The section's claim is drawn into the figure: the budget axis is washed into
 * one tinted band per scale, each curve is bold only inside the band it owns,
 * and each band is named in its own colour.
 *
 * Colour is never the only carrier. Every band prints its model's name inside
 * it, every curve prints its name at its end, and the hard wash edges plus the
 * handover bars segment the axis readably with no colour at all, which is what
 * a reader who cannot separate the green from the red is left with.
 *
 * The handover uncertainty lives in a reserved strip along the bottom of the
 * plot rather than as full-height dashed rules. Those rules used to run the
 * whole height of the figure and one of them cut straight through the "410M
 * leads" label; a capped bar under the labels cannot collide with anything.
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

  const { bands, boundaries } = ownershipScan(series.map((s) => s.pts));

  /**
   * The wash tiles the whole axis; the rail marks only where two curves were
   * compared.
   *
   * The scan can only crown a leader where at least two models were measured,
   * which here is 8 to 990 out of an axis running 1 to 4096. Drawn at that
   * extent the washes left 42% of the plot bare, and the two end bands, the
   * ones whose whole point is that the smallest model owns the cheap end and
   * the largest owns the dear end, came out the two shortest on the page: the
   * 12B's was 8% of the width. So each end band now runs out to the axis edge.
   * The claim survives the extension because outside the compared stretch
   * there is no rival left on the grid, not a rival that wins: below 8 the
   * budget does not cover the 2.8B's cheapest run, and past 990 the 2.8B was
   * not sampled any further. The rail is what says which is which, and the
   * footnote under the figure says so.
   */
  const [X0, X1] = xScale.domain() as [number, number];
  const drawn = bands.map((b, i) => ({
    ...b,
    d0: i === 0 ? X0 : b.x0,
    d1: i === bands.length - 1 ? X1 : b.x1,
  }));

  // The strip along the bottom that carries the ownership labels and, under
  // them, the handover bars. Nothing else is drawn in it.
  const LABEL_Y = innerH - 22;
  const BAR_Y = innerH - 8;
  /** rough width of an 11px semibold label, enough to keep it inside its band */
  const labelW = (s: string) => s.length * 5.8 + 6;
  /**
   * Centre the label on its band, but never let it spill left of the band it
   * names: a label that drifts into the neighbour's wash claims the wrong
   * stretch of the axis. Narrow bands push right instead, into the budgets
   * where nothing was left to compare against.
   */
  const labelX = (b: { idx: number; d0: number; d1: number }) => {
    const half = labelW(`${series[b.idx].label} leads`) / 2;
    const lo = x(b.d0) + half;
    const hi = Math.max(x(b.d1) - half, lo);
    return px(Math.min(Math.max((x(b.d0) + x(b.d1)) / 2, lo), hi));
  };

  const title = `GSM8K accuracy against inference FLOPs per question, log x axis, three Pythia models under weighted majority voting. ${series
    .map(
      (s) =>
        `Pythia ${s.label}: from ${s.pts[0].y} percent at ${s.pts[0].x} to ${s.pts[s.pts.length - 1].y} percent at ${s.pts[s.pts.length - 1].x} (times ten to the eleven FLOPs)`,
    )
    .join("; ")}. The budget axis is washed into one tinted band per scale and each curve is drawn bold only inside its own band: ${bands
    .map((b) => `the ${series[b.idx].label} leads from ${b.x0.toFixed(0)} to ${b.x1.toFixed(0)}`)
    .join(", ")}. Under the band names, one capped bar per handover spans the budgets where the two leading curves sit within the ${READ_OFF_TOLERANCE} point read-off tolerance, so each crossing is bracketed rather than located: ${boundaries
    .map((h) => `the handover near ${h.at.toFixed(0)} is bracketed from ${h.x0.toFixed(0)} to ${h.x1.toFixed(0)}`)
    .join("; ")}. The washes tile the whole axis; the saturated rail along the top of each band marks the stretch where two or more models were measured against each other, which is ${bands[0].x0.toFixed(0)} to ${bands[bands.length - 1].x1.toFixed(0)}.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs per question (×10¹¹, log scale)"
      yLabel="GSM8K accuracy (%)"
    >
      {/* each scale owns a band of the budget: a tinted wash behind it, a
          saturated rail along its top, the bold curve segment through it, and
          its name printed inside it.
          The wash alone could not carry this. Tinted to 12 percent, the 410M's
          green and the 2.8B's blue land within nine values of each other on
          every channel, so the two bands read as one. The tint therefore also
          DEEPENS with scale, which separates them in plain greyscale, and the
          rail puts each colour on the page at full strength where a reader can
          actually compare them. */}
      {drawn.map((b) => (
        <g key={`wash${b.idx}-${b.x0}`}>
          <rect
            data-testid="ownership-wash"
            x={x(b.d0)}
            y={0}
            width={px(x(b.d1) - x(b.d0))}
            height={innerH}
            className={series[b.idx].band}
            opacity={WASH_OPACITY[b.idx] ?? 0.12}
          />
          {/* the rail is the measured claim: it spans only the budgets where
              this model was compared against another, which is why the two end
              bands carry a wash wider than their rail */}
          <rect
            data-testid="ownership-rail"
            x={x(b.x0)}
            y={0}
            width={px(x(b.x1) - x(b.x0))}
            height={3}
            className={series[b.idx].band}
            opacity={0.9}
          />
        </g>
      ))}
      {drawn.map((b) => (
        <text
          key={`leadlabel${b.idx}-${b.x0}`}
          data-testid="ownership-band"
          x={labelX(b)}
          y={LABEL_Y}
          textAnchor="middle"
          className={`${series[b.idx].text} text-[11px] font-semibold`}
        >
          {series[b.idx].label} leads
        </text>
      ))}
      {/* the handovers, in their own strip under the names: a capped bar around
          each wash edge, spanning the budgets over which the two leading curves
          sit inside the by-eye read-off. The crossing is somewhere in the bar,
          not on the edge the wash has to draw. */}
      {boundaries.map((h) => (
        <g key={`handover${h.at}`} data-testid="handover-strip">
          <line
            x1={x(h.x0)}
            x2={x(h.x1)}
            y1={BAR_Y}
            y2={BAR_Y}
            className="stroke-ink-muted"
            strokeWidth={1}
            opacity={0.75}
          />
          {[h.x0, h.x1].map((edge) => (
            <line
              key={`cap${edge}`}
              x1={x(edge)}
              x2={x(edge)}
              y1={BAR_Y - 3}
              y2={BAR_Y + 3}
              className="stroke-ink-muted"
              strokeWidth={1}
              opacity={0.75}
            />
          ))}
          <circle cx={x(h.at)} cy={BAR_Y} r={1.75} className="fill-ink-muted" opacity={0.75} />
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

      {/* The bold segment follows the wash, not the rail: a curve that went
          thin over the cheap end would say the 410M stops leading there, when
          what stops is the comparison. */}
      <defs>
        {drawn.map((b, i) => (
          <clipPath key={`clip${i}`} id={`pythia-band-${i}`}>
            <rect x={x(b.d0)} y={0} width={px(x(b.d1) - x(b.d0))} height={innerH} />
          </clipPath>
        ))}
      </defs>

      {/* full curves as thin ghosts, then each one bold inside its own band:
          the baton pass is the picture */}
      {series.map((s) => (
        <path key={`ghost${s.label}`} d={path(s.pts)} fill="none" className={s.stroke} strokeWidth={1.25} opacity={0.35} />
      ))}
      {drawn.map((b, i) => (
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
  // rung 0 is the model's own greedy answer; the vote rungs are 2 to 16
  const road = PAGE11.roadFor(band, model);
  const marker = road[nIdx];
  const vote16 = road[road.length - 1];
  const gapPts = Math.round((band.target.accuracy - marker.accuracy) * 100);
  // best-of is the 3B's trained verifier (page 8); it applies only to the 3B.
  const showBestOf = model === "3B" && band.bestOf !== null;
  // does the selected model's pile hold the answer more often than the 7B just
  // gets it? True for the 3B (both bands) and the 1.5B on hard; false for the
  // 1.5B on easy, where the small model does not even reach the answer reliably.
  const coversTarget = vote16.coverage > band.target.accuracy + 1e-9;

  return (
    <article className="flex flex-col gap-6">
      {/* The download shares the top line with the act kicker, as on page 5:
          the first thing after the title row is the way to re-derive all of it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={`/notebooks/${PAGE11.download.slug}.zip`}
          download
        >
          Download the notebook and traces (zip, {PAGE11.download.sizeLabel}) ↓
        </a>
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      {/* Six sentences, not three. This was the deck's densest opener: it asked the
          reader to hold FLOPs, pretraining, parameters, sampling and voting at once,
          glossed only the first, then made them count back to resolve "the second
          kind". The facts and the hedges are unchanged; only the welding is undone. */}
      <p className="max-w-2xl text-lg text-ink-muted">
        FLOPs are floating-point operations, the raw count of arithmetic a chip does. A bigger model
        and more thinking are{" "}
        <strong className="text-ink">two ways to spend the same FLOPs</strong>. Pretraining burns
        them once, before any question arrives, into the model&rsquo;s parameters (the numbers it
        learns during training). Sampling and voting burn them at answer time, on every question you
        ask. Act 2 built the answer-time kind. Matched budget for budget on the deck&rsquo;s own run,
        a 3B model against a 7B on the same problems,{" "}
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
          {/* the lede sits in the page's whitespace, above the card, as on pages
              5 to 9: it says what the figure is a picture OF before the reader
              meets it. The card below holds only the figure and its apparatus. */}
          <p className="text-ink-muted">
            Both roads leave the same dot: the small model&rsquo;s own single greedy answer, ringed
            on the black line. Go up the black line and you are buying parameters, until the{" "}
            <strong className="text-ink">{band.target.label}</strong>&rsquo;s single greedy answer
            sets the bar at <strong className="text-ink">one times its own bill</strong>. Go right
            along the blue curve and you are buying samples and a vote instead. Push the samples and
            the blue curve climbs, but{" "}
            <strong className="text-ink">it never reaches the black line</strong>, here or several
            times past it.
          </p>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <MeasuredGame band={band} model={model} nIdx={nIdx} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="line" className="bg-ink-muted" label="a bigger model (scale up the parameters)" />
              <Key shape="line" className="bg-compute" label={`the ${model}, thinking harder (more samples + a vote)`} />
              <Key shape="line" className="bg-correct" label="coverage: the answer was in the pile (the green risers are what the vote throws away)" />
              {showBestOf ? (
                <Key shape="diamond" className="bg-wrong" label="best-of-16 (a trained verifier)" />
              ) : null}
            </div>
            <p className="text-xs text-ink-muted">
              both curves start on the small model&rsquo;s own greedy dot, because at one answer
              there is nothing to vote over and nothing to have missed. measured on this
              deck&rsquo;s instrument: the hard band is pages 6 to 8&rsquo;s own 100 MATH-500 level
              4 to 5 problems, and the run reproduces their shipped numbers exactly before it draws
              anything new (gate 1). FLOPs are counted 2 &times; parameters &times; tokens, from
              measured token counts.
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
                format={(v) =>
                  v === 0 ? "1 answer, greedy" : `${PAGE11.sampleStops[v]} samples`
                }
                onChange={(v) => {
                  setNIdx(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <div className="rounded border-l-4 border-wrong bg-wrong/15 p-3 text-sm" role="status">
              <p className="font-semibold text-wrong">
                {model} {marker.greedy ? "greedy" : `vote@${marker.n}`}:{" "}
                {PAGE11.pct(marker.accuracy)}%, still {gapPts} point
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
          <h2 className="text-xl font-semibold text-ink">
            2. The published law, and its fine print
            <span className="block text-xs font-normal text-ink-muted">
              cited · Snell et al. 2024, on models from before the reasoning recipes
            </span>
          </h2>
          <p className="text-ink-muted">
            That was one model family, on one date. The published record says the opposite is
            possible: a small model that thinks <em>can</em> out-buy a bigger one. The rest of this
            page is that record, and the gap between it and what we measured. Start with the law
            itself. Snell et al. 2024 found that guessing how hard a prompt is first, then choosing
            the strategy and budget to match, can beat a bigger model at a matched bill. They call
            it compute-optimal.
            <Cite n={REF.snell} /> Three numbers carry it.
          </p>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
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
                R = tokens you will serve ÷ tokens you trained on. Pretraining is bought once, and
                its cost is spread over every query you ever answer. Thinking is a surcharge on each
                one. Serve little (R → 0) and thinking wins; serve billions (R → ∞) and parameters
                win
              </LawPanel>
            </div>
            <p className="rounded border-l-4 border-wrong bg-wrong/10 p-3 text-sm text-ink">
              <strong>Hard mode is the other boundary:</strong> where the small model has no
              foothold, no budget rescues it. Sampling can only ever surface an answer the model was
              already capable of writing. Drawing more samples turns up more of what it can write,
              <Cite n={REF.monkeys} /> but it does not teach the model anything. If this model would
              never write the right answer, a thousand tries are a thousand copies of the same wrong
              idea. Parameters are the knob that changes what it can write at all.
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
        </Note>

        {/* Step 3 — how MUCH compute: each scale's band, measured */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Each scale owns a band of the budget
            <span className="block text-xs font-normal text-ink-muted">
              cited · Wu et al. 2024, Pythia 410M, 2.8B and 12B on GSM8K
            </span>
          </h2>
          <p className="text-ink-muted">
            The law is not only Snell&rsquo;s claim; Wu et al. 2024 measured it. They took three
            real models on GSM8K (grade-school word problems), gave each steadily more samples, and
            had them vote, with each vote weighted by a scorer&rsquo;s confidence. Sampling the small
            one many times beats sampling a big one a few times. And the crossings the law predicts
            show up in the data.
            <Cite n={REF.wu} /> Section 2 allocated by prompt; this allocates by budget. Below, the
            budget axis is washed into one band per scale, the stretch of budgets where that model
            is the compute-optimal buy, and each curve runs bold through its own band.
          </p>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <PythiaChart />
            {/* the bands and the curves both name themselves, so the only thing
                left to gloss is the strip along the bottom */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="line" className="bg-ink-muted" label="the bar under each band name: where that handover could be" />
            </div>
            <figcaption className="text-sm text-ink-muted">
              On a small budget the <strong className="text-ink">410M model is the
              compute-optimal pick</strong>: sampling it many times beats sampling a big model a
              few times. Then every curve flattens. Once the 410M saturates near 60%, the 2.8B and
              then the 12B pull ahead, so each scale owns a band of the budget axis. The bars along
              the bottom say how firmly each handover is placed, and they are wide. Across each
              bar, the two leading curves differ by less than the ±3 points this figure was read to.
              So the crossing sits somewhere inside the bar, and not on the edge the wash has to
              draw.
              The second bar runs to the last budget where two models were still being compared, so
              the order of the handoffs is what this chart shows, not the budget at which the 12B
              takes over. This is a
              2024-era family and a wide one, the 2.8B about 7× the 410M and the 12B about 29×, so
              the colours carry rank, not fixed multiples.
            </figcaption>
            <p className="text-xs text-ink-muted">
              read off the paper&rsquo;s figure by eye (±3 points) and replotted as accuracy; two
              of their five model sizes omitted for legibility. The washes tile the axis, but only
              the rail on top of each band was measured against a rival. Left of the 410M&rsquo;s
              rail, the budget does not cover the 2.8B&rsquo;s cheapest run. Right of the
              12B&rsquo;s, the 2.8B was not sampled any further. Out there the wash names the last
              model standing, not a winner over a rival
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
          <h2 className="text-xl font-semibold text-ink">
            4. Better search moves the whole frontier
            <span className="block text-xs font-normal text-ink-muted">
              cited · the same paper&rsquo;s MATH500 table, sampling against tree search
            </span>
          </h2>
          <p className="text-ink-muted">
            Section 3 varied how <em>much</em> compute; this one varies how it is <em>spent</em>.
            The same paper&rsquo;s results table on MATH500: three models, each under plain sampling
            and under their REBASE tree search, an arrow carrying each model&rsquo;s pair from the
            gray point to the green one. Up and to the left is better.
          </p>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <ParetoScatter />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="circle" className="bg-ink-muted" label="sampling + weighted voting (64 to 256 samples)" />
              <Key shape="diamond" className="bg-correct-bright" label="REBASE tree search + weighted voting (32 samples)" />
            </div>
            <figcaption className="text-sm text-ink-muted">
              Wu et al. tested every inference strategy and both benchmarks. Across all of them
              they find the 7B model needs{" "}
              <strong className="text-ink">about half the total FLOPs</strong> of the 34B to reach
              comparable accuracy. This table&rsquo;s sharpest instance is sharper still: 7B with
              tree search{" "}
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
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong className="text-ink">So why did the crossing not appear for us?</strong> The
            law lives in a narrow window, where the model reaches the answer sometimes but not
            reliably, and on a 2026 post-trained model that window has shrunk toward the hardest
            problems. Two loose ends are left. The selection wall: the answer is in the pile, but no
            rule we can run at answer time reliably grabs it. And the waste: a chain that reached
            the answer is a worked solution the model wrote for itself, and the vote throws it
            away.{" "}
            <em>Act 3 stops selecting at inference time and trains the reasoning into the weights.
            Page 12 keeps the winning chains and fine-tunes on them. Pages 13 and 14 reward only
            correct answers, until the reasoning emerges on its own.</em>
          </div>
        </div>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
