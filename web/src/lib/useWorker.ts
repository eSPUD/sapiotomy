"use client";

import { useEffect, useRef } from "react";

/**
 * Minimal harness for running a Web Worker with a typed request/response
 * contract. Falls back gracefully: if `Worker` is unavailable (e.g. SSR), the
 * caller can compute synchronously instead.
 */
export function useMonteCarloWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const worker = new Worker(
      new URL("../workers/monteCarlo.worker.ts", import.meta.url),
    );
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return workerRef;
}
