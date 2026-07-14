"use client";

import { ReactNode } from "react";

export interface ChartFrameProps {
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  /** Title announced to screen readers describing what the chart shows. */
  title: string;
  children: ReactNode;
}

const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };

/**
 * Shared chart grammar: one consistent axis/legend frame so readers learn a
 * single visual language across all 20 pages. Children are drawn inside the
 * inner plotting area (already translated by the margins).
 */
export function ChartFrame({
  width = 480,
  height = 320,
  xLabel,
  yLabel,
  title,
  children,
}: ChartFrameProps) {
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={title}
      className="max-w-full"
    >
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Plot border */}
        <rect
          x={0}
          y={0}
          width={innerW}
          height={innerH}
          className="fill-surface stroke-grid"
          strokeWidth={1}
        />
        {children}
      </g>
      {xLabel ? (
        <text
          x={MARGIN.left + innerW / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-ink-muted text-xs"
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          x={-(MARGIN.top + innerH / 2)}
          y={14}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-ink-muted text-xs"
        >
          {yLabel}
        </text>
      ) : null}
    </svg>
  );
}

export const CHART_MARGIN = MARGIN;
