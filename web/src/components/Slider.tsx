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
  disabled = false,
}: SliderProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center justify-between text-sm text-ink-muted">
        <span>{label}</span>
        <span className="font-mono text-ink" aria-hidden="true">
          {value}
          {suffix}
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
        aria-valuetext={`${value}${suffix}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-grid accent-compute disabled:opacity-50"
      />
    </div>
  );
}
