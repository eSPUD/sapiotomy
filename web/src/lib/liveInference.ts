/**
 * Optional live in-browser inference (M9) — always behind a flag, always with a
 * graceful fallback to the pre-computed trace bank.
 *
 * Default is OFF: `NEXT_PUBLIC_LIVE_INFERENCE` unset → the app is byte-for-byte
 * the pre-computed MVP. When enabled AND WebGPU is available, a small quantized
 * instruct model runs fully client-side (transformers.js / WebGPU) in a worker;
 * otherwise the page silently reverts to the pre-computed trace.
 *
 * NOTE: enabling live mode requires installing the peer dep:
 *   npm i @huggingface/transformers
 * It is intentionally NOT a dependency of the default build (keeps the MVP small
 * and offline-capable). The dynamic import below fails soft → fallback.
 */
export const LIVE_MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";

export type InferenceMode = "live" | "precomputed";

/** Read the build-time feature flag. Default OFF. */
export function isLiveInferenceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LIVE_INFERENCE === "1";
}

/** Capability detection: is WebGPU available in this browser? */
export function detectWebGPU(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator && (navigator as unknown as { gpu?: unknown }).gpu != null;
}

/** Pure decision: which mode to use given the flag and capability. */
export function chooseInferenceMode(enabled: boolean, hasWebGPU: boolean): InferenceMode {
  return enabled && hasWebGPU ? "live" : "precomputed";
}

/**
 * Attempt to load the transformers.js text-generation pipeline. Returns null on
 * ANY failure (package missing, WebGPU absent, download error) so callers fall
 * back to the pre-computed trace without breaking the page.
 */
export async function loadPipeline(): Promise<unknown | null> {
  if (!detectWebGPU()) return null;
  try {
    // Variable specifier + webpackIgnore: keeps this out of the default bundle
    // and out of TS module resolution (the package is an OPTIONAL peer dep).
    const specifier = "@huggingface/transformers";
    const mod = await import(/* webpackIgnore: true */ specifier).catch(() => null);
    if (!mod) return null;
    const pipeline = (mod as { pipeline?: (...a: unknown[]) => Promise<unknown> }).pipeline;
    if (!pipeline) return null;
    return await pipeline("text-generation", LIVE_MODEL, { device: "webgpu" });
  } catch {
    return null;
  }
}
