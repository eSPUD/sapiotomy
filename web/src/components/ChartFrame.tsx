"use client";

import { ReactNode } from "react";

export interface ChartFrameProps {
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  /** Title announced to screen readers describing what the chart shows. */
  title: string;
  /**
   * ARIA role for the svg. The default "img" is right for a static chart;
   * a chart with focusable marks inside must be a "group" instead — role
   * img forbids interactive descendants (axe: nested-interactive).
   */
  role?: "img" | "group";
  /**
   * Margin override — the default fits a single left axis; a chart carrying a
   * second y axis on the right needs a wider right margin for its ticks.
   */
  margin?: { top: number; right: number; bottom: number; left: number };
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
  role = "img",
  margin = MARGIN,
  children,
}: ChartFrameProps) {
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role={role}
      aria-label={title}
      className="max-w-full"
    >
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      <g transform={`translate(${margin.left},${margin.top})`}>
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
          x={margin.left + innerW / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-ink-muted text-xs"
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          x={-(margin.top + innerH / 2)}
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
