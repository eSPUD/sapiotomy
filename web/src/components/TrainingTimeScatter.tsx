"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { scaleLinear } from "d3";
import { ChartFrame, CHART_MARGIN } from "./ChartFrame";
import { sizeBin, type TrainingTimeModelPoint } from "@/lib/trainingTime";

/** Size bin (0 smallest to 3 largest) to its ramp step; -1 is an undisclosed size, in gray. */
export const SIZE_FILL: Record<number, string> = {
  [-1]: "fill-ink-muted",
  0: "fill-size-1",
  1: "fill-size-2",
  2: "fill-size-3",
  3: "fill-size-4",
};
export const SIZE_STROKE: Record<number, string> = {
  [-1]: "stroke-ink-muted",
  0: "stroke-size-1",
  1: "stroke-size-2",
  2: "stroke-size-3",
  3: "stroke-size-4",
};
/** Undisclosed sizes are gray, lighter than text so they read as secondary. */
export const UNDISCLOSED_OPACITY = 0.45;

/** Where a dot's name sits, relative to the dot, in pixels. */
export interface LabelPlacement {
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
}
const RIGHT: LabelPlacement = { dx: 12, dy: 3.5, anchor: "start" };
/** The popup's width (w-64), its offset from the dot's centre, and the screen
 *  margin it keeps, in pixels. */
const POPUP_W_PX = 256;
const GAP_PX = 8;
const EDGE_PX = 16;

/**
 * One dot per model: x is its release date, y how long its main training run
 * took. A dot's colour is the model's size, light (small) to dark (large) in
 * one cyan hue, gray where the size was never disclosed. Solid dots rest on the
 * developer's own figures; hollow ones are estimates.
 *
 * With onSelect, each dot is a button: click it, or Tab to it and press Enter or
 * Space. The chosen dot gets a ring and, given renderDetail, a popup at its top
 * right (top left only when the right would run off the screen).
 * Clicking the dot again, clicking anywhere else, or Escape closes the popup.
 */
export function TrainingTimeScatter({
  title,
  models,
  xDomain,
  yDomain,
  placements = {},
  selected = null,
  onSelect,
  renderDetail,
  focusBin = null,
  width = 640,
  height = 300,
}: {
  title: string;
  models: TrainingTimeModelPoint[];
  xDomain: [number, number];
  yDomain: [number, number];
  /** Per-model label placement, keyed by name; the default is right of the dot. */
  placements?: Record<string, LabelPlacement>;
  /** Name of the chosen model, ringed on the plot. */
  selected?: string | null;
  /** Makes each dot a button: reports the model's name, or null on close. */
  onSelect?: (name: string | null) => void;
  /** The popup's content for the chosen model. */
  renderDetail?: (m: TrainingTimeModelPoint) => ReactNode;
  /** A size bin to highlight (its index, or -1 for "not disclosed"): every other
   *  model fades back. null shows them all. */
  focusBin?: number | null;
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

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const picked = models.find((m) => m.name === selected) ?? null;
  const popRef = useRef<HTMLDivElement | null>(null);
  /** Mirror the popup to the dot's top left, decided once it has been laid out. */
  const [flip, setFlip] = useState(false);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const vw = document.documentElement.clientWidth;
    if (!picked || !wrap || !vw) return setFlip(false);
    // Where the popup's right edge lands when placed top right, from the dot's
    // own position, so the answer does not depend on which side it sits now.
    const box = wrap.getBoundingClientRect();
    const dotX = box.left + ((CHART_MARGIN.left + x(picked.x)) / width) * box.width;
    const popW = popRef.current?.offsetWidth || POPUP_W_PX;
    setFlip(dotX + GAP_PX + popW > vw - EDGE_PX);
  }, [picked, x, width]);
  // Close on Escape (focus back on the dot) or on a click outside the dots and popup.
  useEffect(() => {
    if (!picked || !onSelect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onSelect(null);
      wrapRef.current
        ?.querySelector<SVGGElement>(`g[data-model="${CSS.escape(picked.name)}"]`)
        ?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-model], [data-popup]")) return;
      onSelect(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [picked, onSelect]);

  // The popup's anchor, as a share of the chart box so it tracks the svg as it
  // scales. It sits above the dot and to its right, its corner just off the
  // ring; if that would run off the screen it mirrors to the dot's top left.
  let popup: ReactNode = null;
  if (picked && renderDetail) {
    const left = ((CHART_MARGIN.left + x(picked.x)) / width) * 100;
    const top = ((CHART_MARGIN.top + y(picked.days)) / height) * 100;
    const tx = flip ? `calc(-100% - ${GAP_PX}px)` : `${GAP_PX}px`;
    const ty = `calc(-100% - ${GAP_PX}px)`;
    popup = (
      <div
        ref={popRef}
        data-popup
        role="dialog"
        aria-label={`${picked.name} training time`}
        data-side={flip ? "top-left" : "top-right"}
        className="absolute z-10 w-64 rounded-lg border border-grid bg-surface-raised p-3 shadow"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          transform: `translate(${tx}, ${ty})`,
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => onSelect?.(null)}
          className="absolute right-1.5 top-1 px-1 text-ink-muted hover:text-ink"
        >
          &times;
        </button>
        {renderDetail(picked)}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <ChartFrame
        title={title}
        width={width}
        height={height}
        xLabel="release date"
        yLabel="training time (days)"
        // Buttons inside: role img forbids interactive descendants.
        role={onSelect ? "group" : "img"}
      >
        {y.ticks(5).map((t) => (
          <g key={`y${t}`}>
            <line
              x1={0}
              x2={innerW}
              y1={y(t)}
              y2={y(t)}
              className="stroke-grid"
              strokeWidth={0.5}
            />
            <text
              x={-6}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-muted text-[10px]"
            >
              {t}
            </text>
          </g>
        ))}
        {years.map((yr) => (
          <g key={`x${yr}`}>
            <line
              x1={x(yr)}
              x2={x(yr)}
              y1={0}
              y2={innerH}
              className="stroke-grid"
              strokeWidth={0.5}
            />
            <text
              x={x(yr)}
              y={innerH + 14}
              textAnchor="middle"
              className="fill-ink-muted text-[10px]"
            >
              {yr}
            </text>
          </g>
        ))}

        {models.map((m) => {
          const est = m.basis === "estimate";
        const bin = sizeBin(m);
          const cx = x(m.x);
          const cy = y(m.days);
          const p = placements[m.name] ?? RIGHT;
          // Faded when a size is highlighted and this model is not that size.
          const faded = focusBin !== null && (bin ?? -1) !== focusBin;
          return (
            <g
              key={m.name}
              data-model={m.name}
              data-basis={m.basis}
              data-faded={faded || undefined}
              opacity={faded ? 0.15 : 1}
              style={{ transition: "opacity 150ms" }}
              {...(onSelect
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `${m.name}, ${m.days} days${est ? ", estimate" : ""}`,
                    "aria-pressed": selected === m.name,
                    "aria-haspopup": renderDetail ? ("dialog" as const) : undefined,
                    // A second click on the open dot closes it.
                    onClick: () => onSelect(selected === m.name ? null : m.name),
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(selected === m.name ? null : m.name);
                      }
                    },
                    className: "cursor-pointer outline-none [&:focus-visible_.ring]:opacity-100",
                  }
                : {})}
            >
              {/* A larger invisible target than the dot, so it is easy to hit. */}
              {onSelect ? <circle cx={cx} cy={cy} r={12} fill="transparent" /> : null}
              <circle
                cx={cx}
                cy={cy}
                r={9.5}
                className={`ring fill-none ${selected === m.name ? "stroke-ink" : "stroke-ink-muted"}`}
                strokeWidth={1.5}
                opacity={selected === m.name ? 1 : 0}
              />
              <circle
                cx={cx}
                cy={cy}
                r={est ? 4.5 : 5.25}
                data-size-bin={bin ?? "undisclosed"}
                // Colour is the model's size; a hollow dot is an estimate.
                className={
                  est ? `fill-surface ${SIZE_STROKE[bin ?? -1]}` : `${SIZE_FILL[bin ?? -1]} stroke-none`
                }
                strokeWidth={est ? 2 : 0}
                fillOpacity={!est && bin === null ? UNDISCLOSED_OPACITY : 1}
                strokeOpacity={est && bin === null ? UNDISCLOSED_OPACITY : 1}
              >
                <title>{`${m.name}: ${m.days} days (${m.basis})`}</title>
              </circle>
              <text
                x={cx + p.dx}
                y={cy + p.dy}
                textAnchor={p.anchor}
                // A halo in the plot's own colour, so a gridline passing behind a
                // name never cuts through it.
                className={`stroke-surface text-[10px] ${est ? "fill-ink-muted" : "fill-ink"}`}
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {m.label ?? m.name}
              </text>
            </g>
          );
        })}
      </ChartFrame>
      {popup}
    </div>
  );
}
