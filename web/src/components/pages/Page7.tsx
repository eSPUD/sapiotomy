"use client";

/**
 * Page 7, "Frequency Voting" — page 6 bought accuracy by making ONE chain
 * longer. This page buys it a different way: run the chain MANY times and keep
 * the answer that comes up most often. Same trade (compute at answer time for
 * accuracy), different axis — parallel instead of serial.
 *
 * The analogy is a vote, and it is load-bearing rather than decorative. A party
 * picking one of three pizza places asks everyone; the hope is that with enough
 * voters the best place collects the most votes. That only works if the voters
 * are actually different people. Which is the page's real lesson, and the
 * reason the temperature dial exists: turn it to zero and all 64 "voters" are
 * one voter answering 64 times, and the curve goes flat at the single-chain
 * rate. No diversity, no vote.
 *
 * The interactive is a sampling chamber: set N (1-64) and temperature, watch N
 * chains stream in, land in one of four buckets (lib/authored SAMPLING_CHAMBER,
 * one correct path and three named misreadings), and tally into a live
 * histogram with the winning bucket called out. The companion plot is accuracy
 * against log N, flattening into the plateau.
 *
 * Anchoring: the vote model (lib/sim CHAMBER_MODEL) is calibrated to Wang et
 * al. 2022 — GSM8K, PaLM-540B, 56.5% single chain -> 74.4% with self-consistency
 * — and reduces EXACTLY to that curve at the reference temperature. Temperature
 * itself is not in the paper's reported numbers, so the dial is modelled and the
 * page's chip says so.
 *
 * NO GATE (load-bearing). An earlier build hid the ENTIRE page behind the
 * PredictBar — `prediction === null ? <PredictBar/> : <>whole page</>` — so
 * pressing "Lock it in" replaced the whole document in one jump. That is the
 * one interaction on the page that must not feel like a page change. The
 * chamber and the curve now render from first paint; committing a prediction
 * swaps only the small strip above the chart and draws your line on it. Keep it
 * that way: if you find yourself wrapping a section in `prediction === null ?`,
 * you are rebuilding the thing that was removed.
 *
 * Layout: shell matches pages 1, 3, 5 and 6 — one numbered reading column
 * (1. run the vote · 2. what the vote buys · 3. where it leaves us) beside a
 * sticky instructions/references rail.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { PredictBar } from "@/components/PredictBar";
import { Slider } from "@/components/Slider";
import { SAMPLING_CHAMBER } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import {
  CHAMBER_MODEL,
  chamberCurve,
  chamberDiversity,
  chamberProbs,
  representativeChamberBallot,
} from "@/lib/sim";
import { useStore } from "@/store/useStore";

const PAGE_N = 7;
const C = SAMPLING_CHAMBER;

const MAX_VOTES = 64;
/** 40 is on the list so the step-2 curve can mark it exactly (the predict N). */
const CURVE_NS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 40, 48, 64];
const TRIALS = 1500;
const SEED = 20220311; // arXiv id of Wang et al. — a stable, documented seed
/** Milliseconds between chains arriving in the chamber. */
const STREAM_MS = 45;
/** The step-2 curve is about this many chains — the question the reader predicts.
 *  It is fixed and independent of step 1's N slider (the two figures are decoupled). */
const PREDICT_N = 40;

/**
 * One colour per reasoning bucket, so the dot array above and the tally bars
 * below share a legend. Correct is the deck's green; the three misreadings are
 * muted, distinct hues mixed from the semantic tokens (theme-aware, no raw hex).
 * Order matches SAMPLING_CHAMBER.paths: [22 correct, 33, 17, 11].
 */
const PATH_COLORS = [
  "var(--correct)",
  "var(--wrong)",
  "color-mix(in srgb, var(--wrong) 55%, var(--compute))",
  "color-mix(in srgb, var(--wrong) 38%, var(--canvas))",
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Page7() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const anchor = curves.selfConsistency;

  const [prediction, setPrediction] = useState<number | null>(null);
  const [votes, setVotes] = useState(16);
  const [temperature, setTemperature] = useState(0.7);
  const [shown, setShown] = useState(0);
  const [openPath, setOpenPath] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  // One representative ballot: which path each of the N chains walked.
  const ballot = useMemo(
    () => representativeChamberBallot(votes, temperature, SEED + 1000),
    [votes, temperature],
  );

  const curve = useMemo(
    () => chamberCurve(CURVE_NS, temperature, TRIALS, SEED),
    [temperature],
  );

  // Step 2 reads accuracy at the fixed PREDICT_N, NOT at step 1's votes slider:
  // the curve (the average over many trials) is decoupled from the single ballot.
  const accuracyAtPredict = useMemo(() => {
    const nearest = curve.reduce((best, p) =>
      Math.abs(p.x - PREDICT_N) < Math.abs(best.x - PREDICT_N) ? p : best,
    );
    return nearest.y;
  }, [curve]);

  // Hot temperatures start the curve well below 56.5% (each chain is individually
  // worse), and a low prediction line can dip too. Drop the y-axis floor to
  // contain them so the line never spills off the plot — the lower start at high
  // temperature is the lesson, not a glitch. Stays at 50 for the default range.
  const yFloor = useMemo(() => {
    const yLow = Math.min(...curve.map((p) => p.y), prediction ?? 100);
    return Math.max(30, Math.min(50, Math.floor((yLow - 4) / 5) * 5));
  }, [curve, prediction]);

  const diversity = chamberDiversity(CHAMBER_MODEL, temperature);
  const probs = chamberProbs(CHAMBER_MODEL, temperature);
  const distinctChains = new Set(
    ballot.draws.filter((_, i) => !ballot.duplicated[i]).map((_, i) => i),
  ).size;

  // Stream the chains in whenever the batch changes. Deliberately NOT gated on
  // the prediction: the chamber runs from first paint, so committing a guess
  // adds a reference line to the chart instead of swapping the page.
  useEffect(() => {
    setShown(reducedMotion ? votes : 0);
  }, [votes, temperature, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || shown >= votes) return;
    const t = setTimeout(() => setShown((s) => Math.min(votes, s + 1)), STREAM_MS);
    return () => clearTimeout(t);
  }, [reducedMotion, shown, votes]);

  const visible = ballot.draws.slice(0, shown);
  const liveTally = new Array(C.paths.length).fill(0) as number[];
  for (const d of visible) liveTally[d] += 1;
  const liveMax = Math.max(...liveTally, 0);
  const leaders = liveTally
    .map((v, i) => ({ v, i }))
    .filter((e) => e.v === liveMax && e.v > 0)
    .map((e) => e.i);
  const leader = leaders.length === 1 ? leaders[0] : -1;
  const streamDone = shown >= votes;

  const touched = useRef(false);
  const mark = () => {
    if (!touched.current) {
      touched.current = true;
    }
    recordInteraction(PAGE_N);
  };

  const onVotes = (v: number) => {
    mark();
    setVotes(v);
  };
  const onTemp = (v: number) => {
    mark();
    setTemperature(v);
    if (v === 0) {
      setAnnouncement(
        "Temperature zero: every chain is a copy of the first one, so the vote is a single vote repeated and accuracy stays at the single-chain rate.",
      );
    }
  };

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      {/* Left = the numbered walk-through · Right = instructions + references */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8">
          <p className="text-lg text-ink-muted">
            One traveller on a good road can still take a wrong turn. So stop asking once: ask the{" "}
            <em>same</em> question many times and keep the answer that comes up{" "}
            <strong className="text-ink">most often</strong>. Choosing between three pizza places,
            one friend gives you one opinion and all their quirks; ask everyone and the quirks
            scatter while the best place keeps collecting votes. Nobody had to be right alone; the
            crowd only had to be wrong in <em>uncorrelated</em> ways. Done to a model, that is{" "}
            <strong className="text-ink">self-consistency</strong>.
          </p>

          {/* Step 1 — the chamber */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. Run the vote
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                one question · many independent chains · no live model
              </span>
            </h2>
            <section
              aria-label="The sampling chamber"
              className="flex flex-col rounded-lg border-l-4 border-compute bg-surface"
            >
              <div className="flex flex-col gap-4 p-4">
                <p className="text-ink">{C.question}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Slider
                    label="Chains sampled (N)"
                    min={1}
                    max={MAX_VOTES}
                    value={votes}
                    suffix=" chains"
                    onChange={onVotes}
                  />
                  <Slider
                    label="Temperature"
                    min={0}
                    max={1.4}
                    step={0.1}
                    value={temperature}
                    onChange={onTemp}
                  />
                </div>

                <p className="text-xs text-ink-muted">
                  {temperature === 0 ? (
                    <>
                      <strong className="text-wrong">Frozen.</strong> Every chain is the same
                      chain. {votes} votes, one opinion.
                    </>
                  ) : diversity < 1 ? (
                    <>
                      Only <strong className="text-ink">{Math.round(diversity * 100)}%</strong> of
                      chains are genuinely independent; the rest are duplicates of the first.
                    </>
                  ) : (
                    <>
                      All chains independent. Each one lands on the right answer{" "}
                      <strong className="text-ink">{Math.round(probs[0] * 100)}%</strong> of the
                      time on its own.
                    </>
                  )}
                </p>

                {/* The chamber: one dot per sampled chain, coloured by the bucket
                    it landed in. A unit array reads as a distribution at a glance;
                    the tally below shares the same colours as its legend. */}
                <div
                  className="flex flex-wrap gap-1.5"
                  role="img"
                  aria-label={`${shown} of ${votes} chains sampled. Tally: ${liveTally
                    .map((v, i) => `${C.paths[i].display} appears ${v} times`)
                    .join(", ")}.`}
                >
                  {ballot.draws.map((d, i) => {
                    const on = i < shown;
                    const p = C.paths[d];
                    return (
                      <span
                        key={i}
                        title={on ? `chain ${i + 1} → ${p.display}` : undefined}
                        className={`h-3 w-3 rounded-full transition-opacity ${
                          on
                            ? p.correct
                              ? "ring-1 ring-correct/50"
                              : ""
                            : "border border-dashed border-grid"
                        }`}
                        style={on ? { backgroundColor: PATH_COLORS[d] } : undefined}
                      />
                    );
                  })}
                </div>

                {/* Tally and the chain behind the selected row, side by side —
                    they are one read (pick a bucket, see its reasoning), and
                    stacking them ran the section a screen taller. */}
                <div className="grid gap-4 border-t border-dashed border-grid pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    the tally · click a row to read its chain
                  </p>
                  {C.paths.map((p, i) => {
                    const count = liveTally[i];
                    const pct = shown > 0 ? (count / shown) * 100 : 0;
                    const winning = streamDone && i === leader;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setOpenPath(i);
                          recordInteraction(PAGE_N);
                        }}
                        aria-pressed={openPath === i}
                        className={`flex items-center gap-2 rounded-sm px-1 py-0.5 text-left text-sm ${
                          openPath === i ? "bg-surface-raised" : ""
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PATH_COLORS[i] }}
                          aria-hidden="true"
                        />
                        <span className="w-8 shrink-0 font-mono text-ink">{p.display}</span>
                        <span className="relative h-4 flex-1 rounded-sm bg-surface-raised">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-sm ${
                              winning ? "ring-2 ring-compute" : ""
                            }`}
                            style={{ width: `${pct}%`, backgroundColor: PATH_COLORS[i] }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-ink">
                          {count}
                        </span>
                        <span className="w-24 shrink-0 text-right text-xs text-ink-muted">
                          {p.correct ? "correct" : "wrong"}
                          {winning ? " · wins" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* The selected reasoning path, in full. */}
                <div className="rounded-lg border border-dashed border-grid bg-surface-raised p-3">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    a chain landing on {C.paths[openPath].display}: {C.paths[openPath].gist}
                  </p>
                  <ol className="mt-2 flex flex-col gap-1">
                    {C.paths[openPath].steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
                </div>

                {/* The winner. */}
                {streamDone ? (
                  leader === 0 ? (
                    <div className="rounded-lg border-l-4 border-correct bg-correct/15 p-3 text-sm text-ink">
                      <span className="font-semibold text-correct">✓ The vote lands on {C.display}.</span>{" "}
                      The plurality agreed on the right answer, even though {shown - liveTally[0]}{" "}
                      of {shown} chains got it wrong.
                    </div>
                  ) : leader === -1 ? (
                    <div className="rounded-lg border-l-4 border-grid bg-surface-raised p-3 text-sm text-ink">
                      A tie: too few chains to separate the buckets.
                    </div>
                  ) : (
                    <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3 text-sm text-ink">
                      <span className="font-semibold text-wrong">
                        ✗ The vote lands on {C.paths[leader].display}.
                      </span>{" "}
                      This batch&apos;s plurality was wrong: {C.paths[leader].gist}. One ballot is
                      not the whole story; the curve below is the average.
                    </div>
                  )
                ) : (
                  <p className="flex items-center gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="animate-pulse text-compute">
                      ▍
                    </span>
                    sampling chain {shown + 1} of {votes}…
                  </p>
                )}
              </div>
            </section>
          </section>

          {/* Step 2 — the curve */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. What the vote buys
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                Wang et al. 2022 · GSM8K · anchored
              </span>
            </h2>

            {/* The prediction. This strip is the ONLY thing that swaps when you
                commit — the curve below stays put. See the no-gate note above. */}
            {prediction === null ? (
              <PredictBar
                prompt="Before you read it off the curve: a single chain of thought gets 56.5% on GSM8K. Sample 40 chains and take the majority answer. What accuracy do you predict?"
                min={40}
                max={100}
                suffix="%"
                onCommit={(p) => {
                  setPrediction(p);
                  recordInteraction(PAGE_N);
                  setAnnouncement(
                    `Prediction locked at ${p} percent. Your line is drawn on the curve; the real majority-vote accuracy at ${PREDICT_N} chains is ${accuracyAtPredict.toFixed(1)} percent.`,
                  );
                }}
              />
            ) : (
              <p className="rounded-lg border-l-4 border-compute bg-surface-raised px-3 py-2 text-sm text-ink">
                You predicted{" "}
                <strong className="font-mono text-compute">{prediction}%</strong>; it is the dashed
                line on the curve. The marker sits at {PREDICT_N} chains — the accuracy the majority
                vote actually reaches.
              </p>
            )}

            <figure
              aria-label="Majority-vote accuracy against the number of sampled chains"
              className="m-0 flex flex-col rounded-lg border-l-4 border-grid bg-surface"
            >
                <div className="flex flex-col gap-3 p-4">
                  <LineChart
                    title={`Majority-vote accuracy versus number of sampled chains on GSM8K, log x axis. At the reference temperature accuracy climbs from 56.5 percent at one chain toward a plateau near 74.4 percent, with most of the gain arriving in the first dozen chains. Marking ${PREDICT_N} chains, where the majority vote reaches ${accuracyAtPredict.toFixed(1)} percent.`}
                    points={curve}
                    logX
                    xDomain={[1, MAX_VOTES]}
                    yDomain={[yFloor, 80]}
                    markerX={PREDICT_N}
                    referenceY={prediction ?? undefined}
                    referenceLabel={
                      prediction !== null ? `you predicted ${prediction}%` : undefined
                    }
                    xLabel="chains sampled (log scale)"
                    yLabel="accuracy (%)"
                    width={620}
                    height={300}
                  />
                  <figcaption className="text-sm text-ink-muted">
                    <strong className="font-mono text-lg text-correct">
                      {accuracyAtPredict.toFixed(1)}%
                    </strong>{" "}
                    at {PREDICT_N} chains, temperature {temperature.toFixed(1)}. The gain is large
                    (Wang et al. report{" "}
                    <strong className="text-ink">+17.9 points</strong>, 56.5% → 74.4%), but it{" "}
                    <strong className="text-ink">flattens</strong>: the first handful of chains buy
                    almost everything, and 32 → 64 buys almost nothing at double the cost. Voting
                    cancels <em>uncorrelated</em> errors, so the diversity is what you are paying
                    for.
                  </figcaption>
              </div>
            </figure>
          </section>

          {/* Step 3 — the handoff */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">3. Where this leaves us</h2>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Voting picks by frequency alone; nothing ever asks whether an answer is any{" "}
              <em>good</em>. Fine while the crowd leans right.{" "}
              <em className="text-ink-muted">
                So what happens when the popular answer is the wrong one? Turn the page.
              </em>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              How to read this page
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>
                Two dials in step 1: how many chains, and how different they may be. Click a tally
                row to read that chain.
              </li>
              <li>
                Turn temperature to <strong className="text-ink">0</strong>: the vote collapses to
                one opinion repeated and the curve goes flat.
              </li>
              <li>
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd>{" "}
                move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </h2>
            <p className="text-sm text-ink-muted">
              Self-consistency: Wang et al. 2022 (GSM8K, PaLM-540B, 56.5% → 74.4%). Chains are
              authored; the temperature dial is modelled, not measured. Links at the foot.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={anchor.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the accuracy curve is a seeded Monte Carlo over a two-population model calibrated to Wang
        et al. 2022 (arXiv:2203.11171, ICLR 2023), GSM8K with PaLM-540B: 56.5% single chain to
        74.4% under self-consistency, both endpoints reproduced at the reference temperature · the
        four reasoning paths are authored teaching examples, not model transcripts, and their
        arithmetic is recomputed by the test suite · the temperature dial is modelled, not
        measured: below the reference it duplicates chains, above it flattens the answer
        distribution
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
