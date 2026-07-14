/**
 * Monte Carlo worker protocol — the PURE request/response contract and handler.
 *
 * Kept separate from the worker entry file so the client (synchronous fallback)
 * and the tests can import `handleRequest` WITHOUT pulling in the worker's
 * top-level `self.addEventListener` (which is undefined during SSR/prerender).
 */
import {
  coverageMonteCarlo,
  representativeBallot,
  selfConsistencyCurve,
  type Ballot,
} from "./sim";

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

export interface SelfConsistencyRequest {
  kind: "selfConsistency";
  ns: number[];
  currentN: number;
  trials: number;
  seed: number;
}
export interface SelfConsistencyResponse {
  kind: "selfConsistency";
  curve: { x: number; y: number }[];
  ballot: Ballot;
  currentN: number;
}

export type WorkerRequest = CoverageRequest | SelfConsistencyRequest;
export type WorkerResponse = CoverageResponse | SelfConsistencyResponse;

export function handleRequest(msg: WorkerRequest): WorkerResponse {
  switch (msg.kind) {
    case "coverage":
      return { kind: "coverage", result: coverageMonteCarlo(msg.p, msg.n, msg.trials, msg.seed) };
    case "selfConsistency":
      return {
        kind: "selfConsistency",
        curve: selfConsistencyCurve(msg.ns, msg.trials, msg.seed),
        ballot: representativeBallot(msg.currentN, msg.seed + 1000),
        currentN: msg.currentN,
      };
  }
}
