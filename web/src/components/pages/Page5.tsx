"use client";

/**
 * Page 5, "How to Reason" — Act 2 opens on page 4's open question: can we guide
 * a machine down a road? The first tool is the simplest: SHOW it one.
 *
 * REDESIGN (matches the "drive one stage" feel of pages 1 & 4, no left-to-right
 * read-both-columns): two stacked stages, each a do -> see loop with a live
 * narration line, no static prose panels.
 *
 *   Stage A — "Teach it by example." The lever the reader flips is the actual
 *   cause in few-shot chain-of-thought: the WORKED EXAMPLE in the prompt.
 *   Example OFF -> ask -> the model blurts 27 (one forward leap, wrong).
 *   Example ON  -> ask -> a stepper (Back/Next/Play, page-4 style) walks the
 *   quoted chain to 9, one line at a time, narration per step. Flip the switch
 *   after asking to feel that the example is what flips blurt -> chain. The
 *   prepended exemplar itself (Fig. 1's tennis-ball problem) is real, not
 *   abstract: a "see full prompt" disclosure reveals it on demand.
 *
 *   Stage B — "The road only helps a big-enough walker." Predict-then-drive:
 *   the reader first guesses what showing work does at 8B (the deck's
 *   PredictBar), then steps a model-size control across the three real PaLM
 *   points (8B / 62B / 540B). Two big readouts (standard vs CoT) and the chart
 *   marker move together; narration flips from "it HURTS here (emergent)" at 8B
 *   to "+39.0 points from a prompt alone" at 540B.
 *
 * Everything is authored + cited (Wei et al. 2022): the Figure-1 cafeteria
 * problem and its 27/9 outputs, and the per-scale GSM8K table redrawn as the
 * flat-vs-steep curves. No live model; the chip says so.
 */

import { useEffect, useMemo, useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { PredictBar } from "@/components/PredictBar";
import { COT_DEMO } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 5;
const D = COT_DEMO;

/** Milliseconds a chain step lingers before the next appears (Play). */
const STEP_MS = 800;

/** The three PaLM scales, in billions of parameters — the paper's data points. */
const SIZES = [8, 62, 540] as const;
type Size = (typeof SIZES)[number];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Narration for the Stage-A model surface at a given chain step (example ON). */
function narrationA(step: number): string {
  const maxStep = D.steps.length;
  if (step <= 0) return "One worked example is in the prompt. Press Next (or Play) to walk the chain.";
  if (step >= maxStep) return `✓ ${D.answer} Each line set up the next; the answer fell out of the walk.`;
  return D.steps[step - 1];
}

export function Page5() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const scaling = curves.weiCotScaling;
  const sp = scaling.fit!.params;
  const cot = curves.chainOfThought;
  const cp = cot.fit!.params;

  // size -> { standard, cot } from the per-scale table.
  const scoreAt = useMemo(
    () => ({
      8: { standard: sp.palm8Standard, cot: sp.palm8Cot },
      62: { standard: sp.palm62Standard, cot: sp.palm62Cot },
      540: { standard: sp.palm540Standard, cot: sp.palm540Cot },
    }),
    [sp],
  );
  const delta540 = +(cp.chainOfThought - cp.standard).toFixed(1); // +39.0
  const delta8 = +(sp.palm8Cot - sp.palm8Standard).toFixed(1); // -0.8

  const standardCurve = SIZES.map((x) => ({ x, y: scoreAt[x].standard }));
  const cotCurve = SIZES.map((x) => ({ x, y: scoreAt[x].cot }));

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const [announce, setAnnounce] = useState("");

  // ---- Stage A: teach it by example ------------------------------------
  const [example, setExample] = useState(false); // worked example in the prompt
  const [asked, setAsked] = useState(false);
  const [step, setStep] = useState(0); // chain reveal step (example ON)
  const [playing, setPlaying] = useState(false);
  const maxStep = D.steps.length;
  const chainDone = asked && example && step >= maxStep;

  const setEx = (on: boolean) => {
    recordInteraction(PAGE_N);
    setExample(on);
    setStep(0);
    setPlaying(false);
    if (asked) {
      setAnnounce(
        on
          ? "One worked example is now in the prompt. Walk the chain to compare."
          : `Back to the blurt: ${D.blurt} Wrong.`,
      );
    }
  };

  const askModel = () => {
    recordInteraction(PAGE_N);
    setAsked(true);
    setStep(0);
    setPlaying(false);
    setAnnounce(
      example
        ? "One worked example is in the prompt. Press Next or Play to watch the model imitate its shape."
        : `Without an example to copy, the model blurts ${D.blurt} Wrong.`,
    );
  };

  const go = (next: number) => {
    recordInteraction(PAGE_N);
    setPlaying(false);
    const clamped = Math.min(maxStep, Math.max(0, next));
    setStep(clamped);
    setAnnounce(narrationA(clamped));
  };

  const play = () => {
    recordInteraction(PAGE_N);
    setPlaying(true);
  };

  // Auto-advance while playing (motion only); stop at the landing.
  useEffect(() => {
    if (!playing || reducedMotion || !example) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const next = Math.min(maxStep, step + 1);
      setStep(next);
      setAnnounce(narrationA(next));
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [playing, reducedMotion, example, step, maxStep]);

  const surfaceNarration = !asked
    ? "Set the example switch, then ask. Flip it after asking to compare the two behaviours."
    : example
      ? narrationA(step)
      : `No worked example to copy: one forward leap. It is ${D.blurtNumber}, not ${D.answerNumber}. The right count is ${D.start} − ${D.used} + ${D.bought} = ${D.answerNumber}.`;

  // ---- Stage B: the scaling law, predict then drive --------------------
  const [prediction, setPrediction] = useState<number | null>(null);
  const [size, setSize] = useState<Size>(8);
  const now = scoreAt[size];
  const deltaNow = +(now.cot - now.standard).toFixed(1);

  const pickSize = (s: Size) => {
    recordInteraction(PAGE_N);
    setSize(s);
    setAnnounce(narrationB(s));
  };

  function narrationB(s: Size): string {
    const v = scoreAt[s];
    if (s === 8)
      return `Chain-of-thought HURTS here: ${v.cot}% versus ${v.standard}% for the blurt. The model is too small to follow the road; the paper calls the ability emergent.`;
    if (s === 62)
      return `Now it helps: ${v.cot}% versus ${v.standard}%. The road starts to pay off as the model grows.`;
    return `+${delta540} points from a prompt alone: ${v.cot}% versus ${v.standard}%, past the old fine-tuned record of ${cp.priorSota}%.`;
  }

  const segBtn = (active: boolean) =>
    `rounded px-3 py-1.5 text-sm font-semibold ${
      active ? "bg-compute text-canvas" : "border border-grid bg-surface-raised text-ink-muted"
    }`;

  return (
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Act 1 ended on a question: can we <strong>guide a machine down a road</strong>? The first
        tool is the simplest: <em>show it one</em>. Put a worked example in the prompt and watch
        what changes.
      </p>

      {/* ================= Stage A: teach it by example ================= */}
      <section
        aria-label="Teach it by example"
        className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
          <span>one word problem · flip the example, then ask</span>
          <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
            authored, quoted from Wei et al. Fig. 1 · no live model
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* the few-shot lever */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Worked example in the prompt"
          >
            <span className="text-sm font-semibold text-ink">Worked example in the prompt:</span>
            <button type="button" aria-pressed={!example} onClick={() => setEx(false)} className={segBtn(!example)}>
              none
            </button>
            <button type="button" aria-pressed={example} onClick={() => setEx(true)} className={segBtn(example)}>
              one
            </button>
          </div>

          {/* the prompt surface */}
          <div className="rounded-lg border border-dashed border-grid bg-surface-raised p-3">
            {example ? (
              <details className="group mb-2 border-b border-dashed border-grid pb-2">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-xs text-compute focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-compute">
                  <span aria-hidden="true" className="font-mono transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  <span>
                    <span aria-hidden="true">＋</span>1 worked example prepended (Wei et al. Fig. 1)
                    <span className="text-ink-muted"> · see full prompt</span>
                  </span>
                </summary>
                <div className="mt-2 rounded border border-grid bg-surface p-3 text-xs">
                  <p className="font-mono uppercase tracking-wide text-ink-muted">example →</p>
                  <p className="mt-1 text-ink-muted">{D.exemplar.question}</p>
                  <ol className="mt-2 flex flex-col gap-1 text-ink-muted">
                    {D.exemplar.steps.map((s, i) => (
                      <li key={i}>
                        <span className="mr-2 font-mono text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-ink-muted">{D.exemplar.answer}</p>
                </div>
              </details>
            ) : null}
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">you →</p>
            <p className="mt-1 text-ink">{D.question}</p>
          </div>

          {/* the model surface */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">the model →</p>
            {!asked ? (
              <p className="mt-1 rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink-muted">
                Press <strong className="text-ink">Ask</strong> below.
              </p>
            ) : example ? (
              <div className="mt-1 rounded-lg border-l-4 border-compute bg-surface-raised p-3">
                <ol className="flex flex-col gap-2">
                  {D.steps.slice(0, step).map((s, i) => (
                    <li key={i} className="text-sm text-ink motion-safe:animate-fade-in">
                      <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
                {chainDone ? (
                  <p className="mt-3 border-t border-grid pt-3 text-ink">
                    <span className="font-semibold text-correct">✓ {D.answer}</span>
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="animate-pulse text-compute">▍</span>
                    {step === 0 ? "a worked example sits in the prompt…" : "thinking on the page…"}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-1 rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">{D.blurt}</p>
              </div>
            )}
          </div>

          {/* the driver */}
          <div className="flex flex-wrap items-center gap-2">
            {!asked ? (
              <button
                type="button"
                onClick={askModel}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas"
              >
                Ask the model ▸
              </button>
            ) : example ? (
              <>
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={step === 0}
                  className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
                >
                  ◂ Back
                </button>
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  disabled={step >= maxStep}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  Next ▸
                </button>
                {!reducedMotion ? (
                  <button
                    type="button"
                    onClick={play}
                    disabled={playing || step >= maxStep}
                    className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute disabled:opacity-50"
                  >
                    ▶ Play
                  </button>
                ) : null}
                <span className="font-mono text-xs tabular-nums text-ink-muted">
                  step {step} of {maxStep}
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEx(true)}
                className="rounded border border-compute px-3 py-2 text-sm font-semibold text-compute"
              >
                now add an example ▸
              </button>
            )}
          </div>

          {/* live narration */}
          <p className="min-h-[1.5rem] border-t border-grid pt-3 text-ink">{surfaceNarration}</p>
        </div>
      </section>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        This is <strong>chain-of-thought prompting</strong>: the worked example in the prompt
        carries its reasoning out loud, so the model answers the new question the same way.
        Reasoning first, answer last. The page is its scratch paper.
      </div>

      {/* ================= Stage B: the scaling law ===================== */}
      <section
        aria-label="The road only helps a big-enough walker"
        className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
          <span>the same trick, across model sizes</span>
          <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
            Wei et al. 2022 · GSM8K · redrawn
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* The prediction strip is the ONLY thing that swaps on commit — the
              stepper, readouts and chart below stay mounted. Do not wrap them in
              `prediction === null ?`; that gate replaced the whole stage in one
              jump and read as a page change. Same rule as page 7. */}
          {prediction === null ? (
            <PredictBar
              prompt={`Before you read it off the chart: showing work lifts the biggest model (PaLM-540B) by +${delta540} points on GSM8K. At 8B (a model ~67× smaller), what does showing work do to the score? (points gained)`}
              min={-10}
              max={40}
              suffix=" pts"
              onCommit={(p) => {
                setPrediction(p);
                setSize(8);
                recordInteraction(PAGE_N);
                setAnnounce(narrationB(8));
              }}
            />
          ) : (
            <p className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-sm text-ink">
              You guessed{" "}
              <strong className="font-mono text-compute">
                {prediction >= 0 ? "+" : ""}
                {prediction} pts
              </strong>
              . Step through the model sizes and watch the real numbers.
            </p>
          )}

          <>
              {/* size stepper */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Model size">
                <span className="text-sm font-semibold text-ink">Model size:</span>
                {SIZES.map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} onClick={() => pickSize(s)} className={segBtn(size === s)}>
                    {s}B
                  </button>
                ))}
              </div>

              {/* chart beside the readouts: the marker and the numbers are one
                  glance apart, and the section stops running a screen tall. */}
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
                {/* the chart, marker snapped to the current size. The viewBox is
                    sized to the column it lands in so ChartFrame's width="100%"
                    scales it ~1:1 instead of magnifying the axis type. */}
                <div className="min-w-0">
                  <LineChart
                    title={`GSM8K solve rate for the PaLM family at 8, 62 and 540 billion parameters, log x axis, redrawn from Wei et al. 2022: standard prompting stays low at ${sp.palm8Standard}, ${sp.palm62Standard} and ${sp.palm540Standard} percent, while chain-of-thought climbs from ${sp.palm8Cot} through ${sp.palm62Cot} to ${sp.palm540Cot} percent: below standard at 8B, far above it at 540B. Currently marking ${size} billion parameters.`}
                    points={standardCurve}
                    secondary={{ points: cotCurve, label: "chain-of-thought" }}
                    primaryLabel="standard (the blurt)"
                    fillBetween
                    markPoints
                    inlineLabels
                    markerDelta
                    logX
                    xTicks={[...SIZES]}
                    xDomain={[7, 700]}
                    yDomain={[0, 65]}
                    markerX={size}
                    xLabel="model size (billions of parameters, log scale)"
                    yLabel="GSM8K solve rate (%)"
                    width={620}
                    height={300}
                  />
                </div>

                {/* two readouts + delta, stacked in the rail */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center rounded-lg border-l-4 border-grid bg-surface-raised px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Standard · the blurt
                    </p>
                    <BigNumber value={now.standard} suffix="%" decimals={1} tone="ink" />
                  </div>
                  <div className="flex flex-col items-center rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                      Chain-of-thought
                    </p>
                    <BigNumber value={now.cot} suffix="%" decimals={1} tone="compute" />
                  </div>
                  <div
                    className={`rounded-lg border-l-4 px-3 py-2 text-sm ${
                      deltaNow >= 0 ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                    }`}
                  >
                    <span className={`font-semibold ${deltaNow >= 0 ? "text-correct" : "text-wrong"}`}>
                      {deltaNow >= 0 ? "✓" : "✗"} showing work at {size}B:{" "}
                      {deltaNow >= 0 ? "+" : ""}
                      {deltaNow} points
                    </span>
                  </div>
                </div>
              </div>

              {/* live narration */}
              <p className="min-h-[1.5rem] border-t border-grid pt-3 text-ink">{narrationB(size)}</p>
          </>
        </div>
      </section>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        Same models, same questions. But the road only helps a walker big enough to follow it.{" "}
        <em className="text-ink-muted">
          And if a longer walk buys a better answer, what sets how long the model may walk? Turn the
          page.
        </em>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={cot.citation} />
        <CitationBadge citation={scaling.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the word problem, the wrong blurt ({D.blurtNumber}), the worked chain, and the prepended
        exemplar (the tennis-ball problem → {D.exemplar.answerNumber}) are quoted from Figure 1 of
        Wei et al. 2022 (arXiv:2201.11903); no live model runs on this page · the
        flat-vs-steep numbers are the paper&apos;s per-scale GSM8K results for the PaLM family
        (appendix table, drawn as its Figure 4): standard {sp.palm8Standard}/{sp.palm62Standard}/
        {sp.palm540Standard}% and chain-of-thought {sp.palm8Cot}/{sp.palm62Cot}/{sp.palm540Cot}% at
        8B/62B/540B · at 8B the chain is <em>below</em> standard ({delta8} pts); the paper calls the
        ability emergent · the +{delta540}-point gain and the {cp.priorSota}% prior state of the art
        are the paper&apos;s own numbers
      </p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
