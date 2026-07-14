/**
 * Monte Carlo Web Worker entry — keeps heavy simulation off the UI thread
 * (performance invariant). All logic lives in lib/mcProtocol.ts; this file is
 * only the worker-context glue, so nothing here is imported by the client.
 */
/// <reference lib="webworker" />
import { handleRequest, type WorkerRequest } from "@/lib/mcProtocol";

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const response = handleRequest(event.data);
  (self as unknown as Worker).postMessage(response);
});
