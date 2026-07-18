"use client";

import { useEffect, useState } from "react";
import { chooseInferenceMode, detectWebGPU, isLiveInferenceEnabled, loadPipeline } from "@/lib/liveInference";

export interface LiveDemoProps {
  /** The prompt to run live (e.g. the page's worked problem). */
  prompt: string;
  /** The pre-computed trace shown when live mode is off/unavailable. */
  fallbackTrace: string[];
}

/**
 * Optional "see a real chain-of-thought" panel for Pages 2, 6, 14.
 *
 * - Flag OFF (default): renders NOTHING — the page is byte-for-byte the MVP.
 * - Flag ON + WebGPU: offers a "Run live" button that streams from a small
 *   in-browser model.
 * - Flag ON but no WebGPU / load failure: silently shows the pre-computed trace.
 */
export function LiveDemo({ prompt, fallbackTrace }: LiveDemoProps) {
  const [hasWebGPU, setHasWebGPU] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "fallback">("idle");
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    setHasWebGPU(detectWebGPU());
  }, []);

  if (!isLiveInferenceEnabled()) return null; // OFF by default → nothing changes

  const mode = chooseInferenceMode(true, hasWebGPU);

  const runLive = async () => {
    setStatus("loading");
    const pipe = await loadPipeline();
    if (!pipe) {
      setStatus("fallback");
      setOutput(fallbackTrace);
      return;
    }
    try {
      const gen = pipe as (p: string, o: unknown) => Promise<Array<{ generated_text: string }>>;
      const res = await gen(prompt, { max_new_tokens: 256 });
      setOutput([res?.[0]?.generated_text ?? fallbackTrace.join("\n")]);
      setStatus("done");
    } catch {
      setStatus("fallback");
      setOutput(fallbackTrace);
    }
  };

  return (
    <section className="rounded-lg border border-compute/40 bg-surface p-4">
      <p className="mb-2 text-sm font-semibold text-compute">Experimental: run a real model live</p>
      {mode === "precomputed" ? (
        <p className="text-sm text-ink-muted">
          Your browser doesn&apos;t support WebGPU, so this shows the pre-computed trace instead:
        </p>
      ) : (
        <button
          type="button"
          disabled={status === "loading"}
          onClick={runLive}
          className="mb-2 rounded bg-compute px-3 py-1.5 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          {status === "loading" ? "Loading model…" : "Run live in your browser"}
        </button>
      )}
      <ol className="mt-2 flex flex-col gap-1 font-mono text-sm text-ink">
        {(output.length ? output : mode === "precomputed" ? fallbackTrace : []).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      {status === "fallback" ? (
        <p className="mt-2 text-xs italic text-ink-muted">
          Live model unavailable — fell back to the pre-computed trace.
        </p>
      ) : null}
    </section>
  );
}
