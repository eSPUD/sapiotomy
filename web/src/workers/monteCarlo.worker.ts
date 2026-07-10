/**
 * Monte Carlo Web Worker — keeps heavy simulation off the UI thread
 * (performance invariant, task_list.md). The worker is a thin wrapper around
 * the pure functions in lib/sim.ts, which are what the unit tests exercise.
 */
/// <reference lib="webworker" />
import { coverageMonteCarlo } from "@/lib/sim";

export interface CoverageRequest {
  kind: "coverage";
  p: number;
  n: number;
  trials: number;
  seed: number;
}

export interface CoverageResponse {
  kind: "coverage";
  result: number;
}

self.addEventListener("message", (event: MessageEvent<CoverageRequest>) => {
  const msg = event.data;
  if (msg.kind === "coverage") {
    const result = coverageMonteCarlo(msg.p, msg.n, msg.trials, msg.seed);
    const response: CoverageResponse = { kind: "coverage", result };
    (self as unknown as Worker).postMessage(response);
  }
});
