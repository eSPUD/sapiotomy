"use client";

import { useId } from "react";

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional labels for the two states (shown in addition to the switch). */
  offLabel?: string;
  onLabel?: string;
}

/**
 * Accessible switch. Meaning is never carried by colour alone — the current
 * state is always announced as text (accessibility invariant).
 */
export function Toggle({ label, checked, onChange, offLabel = "Off", onLabel = "On" }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-correct" : "bg-grid"
        }`}
      >
        <span className="sr-only">{checked ? onLabel : offLabel}</span>
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-ink transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="w-8 text-xs text-ink" aria-hidden="true">
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}
