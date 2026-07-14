"use client";

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/** Increment/decrement control with ARIA-labelled buttons. */
export function Stepper({ label, value, min, max, step = 1, onChange }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
          className="h-7 w-7 rounded bg-surface-raised text-ink disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center font-mono text-ink" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
          className="h-7 w-7 rounded bg-surface-raised text-ink disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
