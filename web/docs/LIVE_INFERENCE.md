# Optional live in-browser inference (M9)

Pages 2, 6, and 14 can *optionally* show a **real** chain-of-thought from a small
model running fully client-side (WebGPU). This is an enhancement — **never a
dependency**. The default build has it OFF and is byte-for-byte the pre-computed
MVP.

## Enable it

1. Install the optional peer dependency (kept out of the default build to stay
   small + offline-capable):
   ```bash
   npm i @huggingface/transformers
   ```
2. Set the build-time flag:
   ```bash
   NEXT_PUBLIC_LIVE_INFERENCE=1 npm run build
   ```
   On Vercel, add `NEXT_PUBLIC_LIVE_INFERENCE=1` as an environment variable.

## Behaviour

| Flag | WebGPU | Result |
|---|---|---|
| unset (default) | — | `LiveDemo` renders nothing; pure pre-computed MVP |
| `1` | available | "Run live in your browser" → streams from `Qwen2.5-0.5B-Instruct` via WebGPU |
| `1` | absent / load fails | silently shows the pre-computed trace (graceful fallback) |

The model runs **client-side** — no server, no API key, no per-user cost. Nothing
here is on the critical path: a load failure or missing WebGPU always falls back
to the pre-computed trace, so the lesson and the budget can never break.

`chooseInferenceMode(enabled, hasWebGPU)` and `detectWebGPU()` are unit-tested;
`LiveDemo` is tested to render nothing when the flag is off.
