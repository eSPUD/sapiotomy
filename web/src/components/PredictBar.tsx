"use client";

import { useState } from "react";
import { Slider } from "./Slider";

export interface PredictBarProps {
  /** The question the reader predicts an answer to (Predict-Observe-Explain). */
  prompt: string;
  min?: number;
  max?: number;
  suffix?: string;
  /** Called once the reader commits a prediction, revealing the real value. */
  onCommit: (prediction: number) => void;
}

/**
 * Predict-Observe-Explain control: the reader must commit a prediction BEFORE
 * the real data is revealed. Especially effective where intuitions are wrong
 * (e.g. "more thinking is always better").
 */
export function PredictBar({ prompt, min = 0, max = 100, suffix = "%", onCommit }: PredictBarProps) {
  const [prediction, setPrediction] = useState(Math.round((min + max) / 2));
  const [committed, setCommitted] = useState(false);

  return (
    <div className="rounded-lg border border-grid bg-surface p-4">
      <p className="mb-3 text-sm font-medium text-ink">{prompt}</p>
      <Slider
        label="Your prediction"
        min={min}
        max={max}
        value={prediction}
        suffix={suffix}
        disabled={committed}
        onChange={setPrediction}
      />
      <button
        type="button"
        disabled={committed}
        onClick={() => {
          setCommitted(true);
          onCommit(prediction);
        }}
        className="mt-3 rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
      >
        {committed ? `Predicted ${prediction}${suffix}` : "Lock in prediction"}
      </button>
    </div>
  );
}
