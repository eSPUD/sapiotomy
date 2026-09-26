"use client";

import { scaleLinear } from "d3";
import { ChartFrame, CHART_MARGIN } from "./ChartFrame";
import type { TrainingTimeModelPoint } from "@/lib/trainingTime";

/** Where a dot's name sits, relative to the dot, in pixels. */
export interface LabelPlacement {
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
}
const RIGHT: LabelPlacement = { dx: 7, dy: 3.5, anchor: "start" };

/**
 * One dot per model: x is its release date, y how long its main training run
 * took. Each dot stands on a stem from zero, so its height reads as time the
 * model spent in training while the world kept moving. Solid dots rest on the
 * developer's own figures; hollow ones are estimates, drawn fainter so they
 * cannot pass for reported values.
 */
export function TrainingTimeScatter({
  title,
  models,
  xDomain,
  yDomain,
  placements = {},
  width = 640,
  height = 300,
}: {
  title: string;
  models: TrainingTimeModelPoint[];
  xDomain: [number, number];
  yDomain: [number, number];
  /** Per-model label placement, keyed by name; the default is right of the dot. */
  placements?: Record<string, LabelPlacement>;
  width?: number;
  height?: number;
}) {
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLinear().domain(xDomain).range([0, innerW]);
  const y = scaleLinear().domain(yDomain).range([innerH, 0]);
  const years = Array.from(
    { length: Math.floor(xDomain[1]) - Math.ceil(xDomain[0]) + 1 },
    (_, k) => Math.ceil(xDomain[0]) + k,
  );

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="release date"
      yLabel="training time (days)"
    >
      {y.ticks(5).map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {years.map((yr) => (
        <g key={`x${yr}`}>
          <line x1={x(yr)} x2={x(yr)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={0.5} />
          <text x={x(yr)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {yr}
          </text>
        </g>
      ))}

      {models.map((m) => {
        const est = m.basis === "estimate";
        const cx = x(m.x);
        const cy = y(m.days);
        const p = placements[m.name] ?? RIGHT;
        return (
          <g key={m.name} data-model={m.name} data-basis={m.basis}>
            <line
              x1={cx}
              x2={cx}
              y1={innerH}
              y2={cy}
              className={est ? "stroke-ink-muted" : "stroke-compute-bright"}
              strokeWidth={est ? 1 : 1.5}
              strokeOpacity={est ? 0.45 : 0.6}
              strokeDasharray={est ? "3 3" : undefined}
            />
            <circle
              cx={cx}
              cy={cy}
              r={5}
              className={est ? "fill-surface stroke-ink-muted" : "fill-compute-bright stroke-compute-bright"}
              strokeWidth={1.75}
            >
              <title>{`${m.name}: ${m.days} days (${m.basis})`}</title>
            </circle>
            <text
              x={cx + p.dx}
              y={cy + p.dy}
              textAnchor={p.anchor}
              // A halo in the plot's own colour, so a stem passing behind a name
              // never cuts through it.
              className={`stroke-surface text-[10px] ${est ? "fill-ink-muted" : "fill-ink"}`}
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {m.name}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}
