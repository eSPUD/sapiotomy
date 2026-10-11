"use client";

import { useEffect, useRef, useState } from "react";

export interface BigNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
  /** Semantic hue for the number. */
  tone?: "compute" | "correct" | "wrong" | "ink";
  /** `md` fits two readouts side by side at equal weight. */
  size?: "md" | "lg";
}

const toneClass: Record<NonNullable<BigNumberProps["tone"]>, string> = {
  compute: "text-compute-ink",
  correct: "text-correct-ink",
  wrong: "text-wrong-ink",
  ink: "text-ink",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Big animated counter (signalling: one number, spotlighted). Motion is
 * purposeful and respects prefers-reduced-motion (jumps straight to the value).
 */
export function BigNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 1,
  label,
  tone = "ink",
  size = "lg",
}: BigNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (prefersReducedMotion() || from === value) {
      setDisplay(value);
      return;
    }
    const durationMs = 500;
    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      setDisplay(from + (value - from) * p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono ${size === "lg" ? "text-6xl" : "text-4xl"} font-bold tabular-nums ${toneClass[tone]}`}
      >
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </span>
      {label ? <span className="mt-1 text-sm text-ink-muted">{label}</span> : null}
    </div>
  );
}
