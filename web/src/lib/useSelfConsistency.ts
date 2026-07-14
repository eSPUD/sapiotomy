"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  handleRequest,
  type SelfConsistencyRequest,
  type SelfConsistencyResponse,
} from "@/lib/mcProtocol";

/**
 * Runs the self-consistency Monte Carlo in a Web Worker (off the UI thread),
 * falling back to synchronous compute when Worker is unavailable (SSR / older
 * browsers) — graceful degradation, per the page "done" checklist.
 */
export function useSelfConsistency() {
  const [result, setResult] = useState<SelfConsistencyResponse | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const worker = new Worker(new URL("../workers/monteCarlo.worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<SelfConsistencyResponse>) => {
      if (e.data.kind === "selfConsistency") setResult(e.data);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const request = useCallback((req: SelfConsistencyRequest) => {
    if (workerRef.current) {
      workerRef.current.postMessage(req);
    } else {
      // Synchronous fallback keeps the page fully functional without a Worker.
      setResult(handleRequest(req) as SelfConsistencyResponse);
    }
  }, []);

  return { result, request };
}
