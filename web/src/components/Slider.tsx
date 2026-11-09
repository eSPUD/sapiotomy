"use client";

import { useId } from "react";

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** Optional unit/suffix shown next to the value, e.g. "%" or " votes". */
  suffix?: string;
  /**
   * Optional readout formatter, for dials that step in one unit but are spoken
   * in another (e.g. stepping in billions, reading out "1.0T"). Drives both the
   * visible value and aria-valuetext, so the two never drift apart.
   */
  format?: (value: number) => string;
  /**
   * Draw a mark under every one of these values. For a short, countable range
   * (twelve months, say) it shows the reader what the step actually is; leave
   * it unset on wide ranges, where a mark per step is noise.
   */
  ticks?: number[];
  /** What a tick prints, for dials whose steps stand for other values. */
  tickLabel?: (tick: number) => string;
  disabled?: boolean;
}

/**
 * Keyboard-operable, ARIA-labelled range control (accessibility invariant).
 * The native <input type="range"> gives arrow-key operation for free.
 */
export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  suffix = "",
  format,
  ticks,
  tickLabel,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const listId = `${id}-ticks`;
  const readout = `${format ? format(value) : value}${suffix}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center justify-between text-sm text-ink-muted">
        <span>{label}</span>
        <span className="font-mono text-ink" aria-hidden="true">
          {readout}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={readout}
        list={ticks ? listId : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-grid accent-compute disabled:opacity-50"
      />
      {ticks ? (
        <>
          {/* Native marks where the browser draws them, plus our own readable
              row: the numbers are the point, and Safari renders no datalist. */}
          <datalist id={listId}>
            {ticks.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div
            aria-hidden="true"
            className="flex justify-between px-0.5 font-mono text-[10px] tabular-nums text-ink-muted"
          >
            {ticks.map((t) => (
              <span key={t}>{tickLabel ? tickLabel(t) : t}</span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
