"use client";

import { scaleLinear, scaleLog, line as d3line } from "d3";
import { ChartFrame, CHART_MARGIN } from "./ChartFrame";

export interface LineChartProps {
  title: string;
  points: { x: number; y: number }[];
  xLabel?: string;
  yLabel?: string;
  yDomain?: [number, number];
  xDomain?: [number, number];
  /** Highlight the value at this x with a marker + guide line. */
  markerX?: number;
  /** Draw a dashed horizontal reference line (e.g. the reader's prediction). */
  referenceY?: number;
  referenceLabel?: string;
  logX?: boolean;
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
  referenceY,
  referenceLabel,
  logX = false,
  width = 480,
  height = 320,
}: LineChartProps) {
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xd = xDomain ?? [Math.min(...xs), Math.max(...xs)];
  const yd = yDomain ?? [Math.min(...ys), Math.max(...ys)];

  const x = (logX ? scaleLog() : scaleLinear())
    .domain([Math.max(logX ? 1 : xd[0], xd[0]), xd[1]])
    .range([0, innerW]);
  const y = scaleLinear().domain(yd).range([innerH, 0]);

  const path = d3line<{ x: number; y: number }>()
    .x((p) => x(p.x))
    .y((p) => y(p.y))(points);

  const markerPoint =
    markerX !== undefined
      ? points.reduce((best, p) =>
          Math.abs(p.x - markerX) < Math.abs(best.x - markerX) ? p : best,
        )
      : null;

  const yTicks = y.ticks(5);
  const xTicks = x.ticks(5);

  return (
    <ChartFrame title={title} width={width} height={height} xLabel={xLabel} yLabel={yLabel}>
      {/* gridlines + y ticks */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
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
          {t}
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

      {path ? <path d={path} fill="none" className="stroke-correct" strokeWidth={2.5} /> : null}

      {markerPoint ? (
        <g>
          <line
            x1={x(markerPoint.x)}
            x2={x(markerPoint.x)}
            y1={0}
            y2={innerH}
            className="stroke-compute"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={x(markerPoint.x)} cy={y(markerPoint.y)} r={5} className="fill-compute" />
        </g>
      ) : null}
    </ChartFrame>
  );
}
