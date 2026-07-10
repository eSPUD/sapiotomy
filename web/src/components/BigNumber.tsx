"use client";

import { useEffect, useRef, useState } from "react";

export interface BigNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
  label?: string;
  /** Semantic hue for the number. */
  tone?: "compute" | "correct" | "wrong" | "ink";
}

const toneClass: Record<NonNullable<BigNumberProps["tone"]>, string> = {
  compute: "text-compute",
  correct: "text-correct",
  wrong: "text-wrong",
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
export function BigNumber({ value, suffix = "", decimals = 1, label, tone = "ink" }: BigNumberProps) {
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
      <span className={`font-mono text-6xl font-bold tabular-nums ${toneClass[tone]}`}>
        {display.toFixed(decimals)}
        {suffix}
      </span>
      {label ? <span className="mt-1 text-sm text-ink-muted">{label}</span> : null}
    </div>
  );
}
