"use client";

import { useId, useRef } from "react";
import { scaleLinear, scaleLog, line as d3line, area as d3area } from "d3";
import { ChartFrame, CHART_MARGIN } from "./ChartFrame";

/** The hues a line may take, mapped to the theme's stroke/fill utilities. */
export type ChartTone =
  | "correct"
  | "compute"
  | "wrong"
  | "ink"
  | "correct-bright"
  | "compute-bright"
  | "wrong-bright";
const STROKE: Record<ChartTone, string> = {
  correct: "stroke-correct",
  compute: "stroke-compute",
  wrong: "stroke-wrong",
  ink: "stroke-ink",
  "correct-bright": "stroke-correct-bright",
  "compute-bright": "stroke-compute-bright",
  "wrong-bright": "stroke-wrong-bright",
};
const FILL: Record<ChartTone, string> = {
  correct: "fill-correct",
  compute: "fill-compute",
  wrong: "fill-wrong",
  ink: "fill-ink",
  "correct-bright": "fill-correct-bright",
  "compute-bright": "fill-compute-bright",
  "wrong-bright": "fill-wrong-bright",
};

export interface LineChartProps {
  title: string;
  points: { x: number; y: number }[];
  xLabel?: string;
  yLabel?: string;
  yDomain?: [number, number];
  xDomain?: [number, number];
  /** Highlight the value at this x with a marker + guide line. */
  markerX?: number;
  /**
   * Make the marker a draggable handle. Supplying this turns the marker into a
   * real slider: pointer drag along the plot, plus arrow/Home/End keys, since a
   * drag-only control would be unusable by keyboard. The chart's svg switches to
   * role="group" because role="img" forbids interactive descendants.
   */
  onMarkerChange?: (x: number) => void;
  /** Accessible name for the draggable marker. Required with onMarkerChange. */
  markerLabel?: string;
  /** Snap step for the dragged marker, in x units. */
  markerStep?: number;
  /** Spoken value at the marker, e.g. "6 months". */
  markerValueText?: (x: number) => string;
  /** Draw a dashed horizontal reference line (e.g. the reader's prediction). */
  referenceY?: number;
  referenceLabel?: string;
  /** Optional second line (drawn in the compute hue) for a contrast. */
  secondary?: { points: { x: number; y: number }[]; label?: string };
  /** Draw the secondary line fainter and thinner — context, not a co-star. */
  secondaryFaint?: boolean;
  primaryLabel?: string;
  /**
   * Hue for each line and its legend swatch. Default to the house pair
   * (correct/compute); override when a page already colours the same two
   * quantities elsewhere, so the chart and its readouts agree.
   */
  primaryTone?: ChartTone;
  secondaryTone?: ChartTone;
  /**
   * Shade an interval around the primary line, e.g. a projection's 90% band.
   * Drawn behind the lines in the primary hue, so the line reads as the central
   * estimate and the shading as the range around it.
   */
  band?: { lower: { x: number; y: number }[]; upper: { x: number; y: number }[] };
  /** Shade the area between the primary and secondary lines (the gap itself). */
  fillBetween?: boolean;
  /** Opacity of the fillBetween band (raise it when the band IS the point). */
  fillOpacity?: number;
  /**
   * Annotation arrows in data coordinates, with an optional label at the
   * midpoint (e.g. slope callouts: "×10 → +29.5").
   */
  arrows?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
    labelAnchor?: "start" | "middle" | "end";
    /** Pixel nudges for the label, from the arrow's midpoint. */
    labelDx?: number;
    labelDy?: number;
  }[];
  /** Circle every data point on both lines, not just the marker. */
  markPoints?: boolean;
  /**
   * Label each line at its right end instead of in the corner legend box —
   * less chart furniture when there are only two series.
   */
  inlineLabels?: boolean;
  /**
   * At markerX, connect the two lines with a vertical segment carrying the
   * signed gap (ties the chart to a delta readout). Needs `secondary`.
   */
  markerDelta?: boolean;
  logX?: boolean;
  /** Log-scale the y axis; ticks land on powers of ten. */
  logY?: boolean;
  /** Custom y tick text (e.g. "10²³" for FLOP counts). */
  yTickFormat?: (t: number) => string;
  /** Custom x tick text (e.g. "100k" for query counts). */
  xTickFormat?: (t: number) => string;
  /**
   * Explicit x tick positions. Worth setting on a log axis, where d3 ignores the
   * requested tick count and returns every decade subdivision — enough labels to
   * collide once the chart is sized to a column rather than a full page.
   */
  xTicks?: number[];
  /** Labeled point markers (e.g. named models on a trend). */
  dots?: { x: number; y: number; label?: string }[];
  width?: number;
  height?: number;
}

/**
 * Shared line chart built on the ChartFrame grammar. Used across pages so the
 * reader learns one visual language (Mayer coherence).
 */
export function LineChart({
  title,
  points,
  xLabel,
  yLabel,
  yDomain,
  xDomain,
  markerX,
  onMarkerChange,
  markerLabel,
  markerStep = 1,
  markerValueText,
  referenceY,
  referenceLabel,
  secondary,
  secondaryFaint = false,
  primaryLabel,
  primaryTone = "correct",
  secondaryTone = "compute",
  band,
  fillBetween = false,
  fillOpacity = 0.12,
  arrows,
  markPoints = false,
  inlineLabels = false,
  markerDelta = false,
  logX = false,
  logY = false,
  yTickFormat,
  xTickFormat,
  xTicks: xTicksProp,
  dots,
  width = 480,
  height = 320,
}: LineChartProps) {
  const arrowId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xd = xDomain ?? [Math.min(...xs), Math.max(...xs)];
  const yd = yDomain ?? [Math.min(...ys), Math.max(...ys)];

  const x = (logX ? scaleLog() : scaleLinear())
    .domain([Math.max(logX ? 1 : xd[0], xd[0]), xd[1]])
    .range([0, innerW]);
  const y = (logY ? scaleLog() : scaleLinear()).domain(yd).range([innerH, 0]);

  const lineGen = d3line<{ x: number; y: number }>()
    .x((p) => x(p.x))
    .y((p) => y(p.y));
  const path = lineGen(points);
  const secondaryPath = secondary ? lineGen(secondary.points) : null;

  const markerPoint =
    markerX !== undefined
      ? points.reduce((best, p) =>
          Math.abs(p.x - markerX) < Math.abs(best.x - markerX) ? p : best,
        )
      : null;

  // The secondary point at the marker, for the delta connector.
  const secondaryMarkerPoint =
    markerX !== undefined && secondary
      ? secondary.points.reduce((best, p) =>
          Math.abs(p.x - markerX) < Math.abs(best.x - markerX) ? p : best,
        )
      : null;

  // A filled polygon between the two lines: forward along primary, back along
  // secondary. Renders correctly through the crossover (primary can be on top
  // at one x and below at another) — it always shades the gap itself.
  const bandPath =
    fillBetween && secondary
      ? `M${points.map((p) => `${x(p.x)},${y(p.y)}`).join("L")}L${secondary.points
          .map((p) => `${x(p.x)},${y(p.y)}`)
          .reverse()
          .join("L")}Z`
      : null;

  // On a log y-axis, tick only the powers of ten inside the domain.
  const yTicks = logY
    ? Array.from(
        { length: Math.floor(Math.log10(yd[1])) - Math.ceil(Math.log10(yd[0])) + 1 },
        (_, k) => 10 ** (Math.ceil(Math.log10(yd[0])) + k),
      )
    : y.ticks(5);
  const xTicks = xTicksProp ?? x.ticks(5);

  const draggable = onMarkerChange !== undefined && markerX !== undefined;
  const [xLo, xHi] = [xd[0], xd[1]];
  const clampSnap = (v: number) => {
    const snapped = Math.round(v / markerStep) * markerStep;
    return Math.min(xHi, Math.max(xLo, snapped));
  };
  /** Map a client pixel to an x value, going through the svg's own coordinate
   *  space so it stays correct when the chart is scaled to fit its column. */
  const xFromClient = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return markerX!;
    const r = svg.getBoundingClientRect();
    const scale = r.width / width;
    const local = (clientX - r.left) / (scale || 1) - CHART_MARGIN.left;
    return clampSnap(x.invert(local));
  };
  const onPointer = (e: React.PointerEvent<SVGRectElement>) => {
    if (!draggable) return;
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const next = xFromClient(e.clientX);
    if (next !== markerX) onMarkerChange!(next);
  };
  const onMarkerKey = (e: React.KeyboardEvent<SVGGElement>) => {
    if (!draggable) return;
    const big = Math.max(markerStep, (xHi - xLo) / 4);
    const move: Record<string, number> = {
      ArrowLeft: -markerStep, ArrowDown: -markerStep,
      ArrowRight: markerStep, ArrowUp: markerStep,
      PageDown: -big, PageUp: big,
    };
    let next: number | null = null;
    if (e.key in move) next = clampSnap(markerX! + move[e.key]);
    else if (e.key === "Home") next = xLo;
    else if (e.key === "End") next = xHi;
    if (next === null) return;
    e.preventDefault();
    if (next !== markerX) onMarkerChange!(next);
  };

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel={xLabel}
      yLabel={yLabel}
      role={draggable ? "group" : "img"}
      svgRef={svgRef}
    >
      {/* gridlines + y ticks */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {yTickFormat ? yTickFormat(t) : t}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text
          key={`x${t}`}
          x={x(t)}
          y={innerH + 14}
          textAnchor="middle"
          className="fill-ink-muted text-[10px]"
        >
          {xTickFormat ? xTickFormat(t) : t}
        </text>
      ))}

      {referenceY !== undefined ? (
        <g>
          <line
            x1={0}
            x2={innerW}
            y1={y(referenceY)}
            y2={y(referenceY)}
            className="stroke-ink-muted"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {referenceLabel ? (
            <text x={innerW - 4} y={y(referenceY) - 4} textAnchor="end" className="fill-ink-muted text-[10px]">
              {referenceLabel}
            </text>
          ) : null}
        </g>
      ) : null}

      {/* the gap between the lines, shaded (drawn under the lines) */}
      {bandPath ? <path d={bandPath} className="fill-compute" fillOpacity={fillOpacity} /> : null}

      {secondaryPath ? (
        <path
          d={secondaryPath}
          fill="none"
          className={STROKE[secondaryTone]}
          strokeWidth={secondaryFaint ? 1.5 : 3}
          strokeOpacity={secondaryFaint ? 0.55 : 1}
        />
      ) : null}
      {band ? (
        <path
          d={`${d3area<{ x: number; y: number }>()
            .x((p) => x(p.x))
            .y0((_, i) => y(band.lower[i]?.y ?? band.lower[0].y))
            .y1((p) => y(p.y))(band.upper)}`}
          className={FILL[primaryTone]}
          opacity={0.16}
        />
      ) : null}

      {path ? (
        <path d={path} fill="none" className={STROKE[primaryTone]} strokeWidth={3} />
      ) : null}

      {/* dot every real data point on both lines (surface ring keeps them off the line) */}
      {markPoints ? (
        <g>
          {points.map((p) => (
            <circle
              key={`pp${p.x}`}
              cx={x(p.x)}
              cy={y(p.y)}
              r={3.5}
              className="fill-correct stroke-canvas"
              strokeWidth={2}
            />
          ))}
          {secondary?.points.map((p) => (
            <circle
              key={`sp${p.x}`}
              cx={x(p.x)}
              cy={y(p.y)}
              r={secondaryFaint ? 2.5 : 3.5}
              className="fill-compute stroke-canvas"
              strokeWidth={2}
              fillOpacity={secondaryFaint ? 0.55 : 1}
            />
          ))}
        </g>
      ) : null}

      {/* identity: either direct end-of-line labels, or the corner legend box */}
      {inlineLabels && (primaryLabel || secondary?.label) ? (
        <g>
          {primaryLabel && points.length ? (
            <text
              x={x(points[points.length - 1].x) - 6}
              y={y(points[points.length - 1].y) + 14}
              textAnchor="end"
              className="fill-ink text-[10px]"
            >
              {primaryLabel}
            </text>
          ) : null}
          {secondary?.label && secondary.points.length ? (
            <text
              x={x(secondary.points[secondary.points.length - 1].x) - 6}
              y={y(secondary.points[secondary.points.length - 1].y) - 8}
              textAnchor="end"
              className="fill-ink text-[10px]"
            >
              {secondary.label}
            </text>
          ) : null}
        </g>
      ) : (primaryLabel || secondary?.label) ? (
        <g>
          {primaryLabel ? (
            <>
              {/* A longer dash reads as a line sample, not a bullet, and matches
                  the 3px stroke it stands for. */}
              <rect x={8} y={8} width={26} height={3} rx={1.5} className={FILL[primaryTone]} />
              <text x={40} y={12} className="fill-ink text-[10px]">{primaryLabel}</text>
            </>
          ) : null}
          {secondary?.label ? (
            <>
              <rect x={8} y={22} width={26} height={3} rx={1.5} className={FILL[secondaryTone]} />
              <text x={40} y={26} className="fill-ink text-[10px]">{secondary.label}</text>
            </>
          ) : null}
        </g>
      ) : null}

      {/* annotation arrows (e.g. the two slope callouts on page 13) */}
      {arrows?.length ? (
        <g>
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX={8}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M0,0L10,5L0,10Z" className="fill-ink" />
            </marker>
          </defs>
          {arrows.map((a, i) => (
            <g key={i}>
              <line
                x1={x(a.x1)}
                y1={y(a.y1)}
                x2={x(a.x2)}
                y2={y(a.y2)}
                className="stroke-ink"
                strokeWidth={1.5}
                markerEnd={`url(#${arrowId})`}
              />
              {a.label ? (
                <text
                  x={(x(a.x1) + x(a.x2)) / 2 + (a.labelDx ?? 0)}
                  y={(y(a.y1) + y(a.y2)) / 2 + (a.labelDy ?? 0)}
                  dy="0.32em"
                  textAnchor={a.labelAnchor ?? "middle"}
                  className="fill-ink text-[10px] font-semibold"
                >
                  {a.label}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      ) : null}

      {dots?.map((d) => {
        const atRightEdge = x(d.x) > innerW - 70;
        return (
          <g key={`${d.x}-${d.y}`}>
            <circle cx={x(d.x)} cy={y(d.y)} r={4} className="fill-compute" />
            {d.label ? (
              <text
                x={x(d.x) + (atRightEdge ? -7 : 7)}
                y={y(d.y) - 6}
                textAnchor={atRightEdge ? "end" : "start"}
                className="fill-ink text-[9px]"
              >
                {d.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Drag surface: the whole plot, so the reader can grab anywhere along it
          rather than having to hit the 1px rule. */}
      {draggable ? (
        <rect
          x={0}
          y={0}
          width={innerW}
          height={innerH}
          fill="transparent"
          className="cursor-ew-resize"
          onPointerDown={onPointer}
          onPointerMove={onPointer}
        />
      ) : null}

      {markerPoint ? (
        <g
          role={draggable ? "slider" : undefined}
          tabIndex={draggable ? 0 : undefined}
          aria-label={draggable ? markerLabel : undefined}
          aria-valuemin={draggable ? xLo : undefined}
          aria-valuemax={draggable ? xHi : undefined}
          aria-valuenow={draggable ? markerX : undefined}
          aria-valuetext={
            draggable ? (markerValueText ? markerValueText(markerX!) : String(markerX)) : undefined
          }
          onKeyDown={draggable ? onMarkerKey : undefined}
          className={draggable ? "cursor-ew-resize focus:outline-none" : undefined}
        >
          <line
            x1={x(markerPoint.x)}
            x2={x(markerPoint.x)}
            y1={0}
            y2={innerH}
            className="stroke-compute"
            strokeWidth={draggable ? 1.5 : 1}
            strokeDasharray="3 3"
          />
          {draggable ? (
            <>
              {/* grab handle at the top of the rule */}
              <rect
                x={x(markerPoint.x) - 7}
                y={-9}
                width={14}
                height={14}
                rx={3}
                className="fill-compute"
              />
              <path
                d={`M${x(markerPoint.x) - 3} -5 v6 M${x(markerPoint.x) + 3} -5 v6`}
                className="stroke-canvas"
                strokeWidth={1}
              />
              {/* focus ring, drawn only when the handle has keyboard focus */}
              <rect
                x={x(markerPoint.x) - 10}
                y={-12}
                width={20}
                height={innerH + 20}
                rx={4}
                fill="none"
                className="stroke-ink opacity-0 group-focus:opacity-100 [g:focus>&]:opacity-100"
                strokeWidth={1.5}
              />
            </>
          ) : null}
          <circle cx={x(markerPoint.x)} cy={y(markerPoint.y)} r={5} className="fill-compute" />
        </g>
      ) : null}

      {/* the signed gap at the marker: a bracket between the two lines + label */}
      {markerDelta && markerPoint && secondaryMarkerPoint
        ? (() => {
            const cx = x(markerPoint.x);
            const y1 = y(markerPoint.y);
            const y2 = y(secondaryMarkerPoint.y);
            const delta = +(secondaryMarkerPoint.y - markerPoint.y).toFixed(1);
            const up = delta >= 0;
            const atRightEdge = cx > innerW - 48;
            return (
              <g>
                <line
                  x1={cx}
                  x2={cx}
                  y1={y1}
                  y2={y2}
                  className={up ? "stroke-correct" : "stroke-wrong"}
                  strokeWidth={2}
                />
                <text
                  x={cx + (atRightEdge ? -8 : 8)}
                  y={(y1 + y2) / 2}
                  dy="0.32em"
                  textAnchor={atRightEdge ? "end" : "start"}
                  className={`${up ? "fill-correct" : "fill-wrong"} text-[10px] font-semibold`}
                >
                  {up ? "+" : ""}
                  {delta} pts
                </text>
              </g>
            );
          })()
        : null}
    </ChartFrame>
  );
}
