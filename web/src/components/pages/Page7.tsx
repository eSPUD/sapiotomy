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
const CURVE_NS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
const TRIALS = 1500;
const SEED = 20220311; // arXiv id of Wang et al. — a stable, documented seed
/** Milliseconds between chains arriving in the chamber. */
const STREAM_MS = 45;

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

  const accuracyNow = useMemo(() => {
    const nearest = curve.reduce((best, p) =>
      Math.abs(p.x - votes) < Math.abs(best.x - votes) ? p : best,
    );
    return nearest.y;
  }, [curve, votes]);

  const diversity = chamberDiversity(CHAMBER_MODEL, temperature);
  const probs = chamberProbs(CHAMBER_MODEL, temperature);
  const distinctChains = new Set(
    ballot.draws.filter((_, i) => !ballot.duplicated[i]).map((_, i) => i),
  ).size;

  // Stream the chains in whenever the batch changes.
  useEffect(() => {
    if (prediction === null) return;
    setShown(reducedMotion ? votes : 0);
  }, [votes, temperature, prediction, reducedMotion]);

  useEffect(() => {
    if (prediction === null || reducedMotion || shown >= votes) return;
    const t = setTimeout(() => setShown((s) => Math.min(votes, s + 1)), STREAM_MS);
    return () => clearTimeout(t);
  }, [prediction, reducedMotion, shown, votes]);

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
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        A chain of thought is a good road, but a single traveller can still take a wrong turn. So
        stop asking once. Ask the <em>same</em> question many times, let each attempt reason
        independently, and keep the answer that comes up <strong>most often</strong>.
      </p>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <p>
          <strong>Why does a vote work at all?</strong> You are at a party choosing between three
          pizza places. Ask one friend and you get one opinion, with all of that friend&apos;s
          quirks attached. Ask everyone, and the quirks scatter in different directions while the
          genuinely best place keeps collecting votes. Nobody had to be right on their own — the
          crowd only had to be wrong in <em>uncorrelated</em> ways.
        </p>
        <p className="mt-2 text-ink-muted">
          Do the same to a model and it is called <strong className="text-ink">self-consistency</strong>:
          sample many reasoning paths, then take the majority answer.
        </p>
      </div>

      {prediction === null ? (
        <PredictBar
          prompt="A single chain of thought gets 56.5% on GSM8K. If you sample 40 chains and take the majority answer, what accuracy do you predict?"
          min={40}
          max={100}
          suffix="%"
          onCommit={(p) => {
            setPrediction(p);
            setVotes(40);
            recordInteraction(PAGE_N);
          }}
        />
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section
              aria-label="The sampling chamber"
              className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
                <span>one question · many independent chains</span>
                <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                  authored chains · modelled temperature · no live model
                </span>
              </div>

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

                {/* The chamber: one tile per sampled chain. */}
                <div
                  className="flex flex-wrap gap-1"
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
                        className={`flex h-7 w-9 items-center justify-center rounded-sm border font-mono text-xs tabular-nums transition-opacity ${
                          !on
                            ? "border-dashed border-grid bg-surface-raised text-transparent"
                            : p.correct
                              ? "border-correct bg-correct/20 text-correct"
                              : "border-grid bg-surface-raised text-ink-muted"
                        }`}
                      >
                        {on ? p.display : "·"}
                      </span>
                    );
                  })}
                </div>

                {/* Live tally. */}
                <div className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">the tally</p>
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
                        <span className="w-10 shrink-0 font-mono text-ink">{p.display}</span>
                        <span className="relative h-4 flex-1 rounded-sm bg-surface-raised">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-sm ${
                              p.correct ? "bg-correct" : "bg-grid"
                            } ${winning ? "ring-2 ring-compute" : ""}`}
                            style={{ width: `${pct}%` }}
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

                {/* The winner. */}
                {streamDone ? (
                  leader === 0 ? (
                    <div className="rounded-lg border-l-4 border-correct bg-correct/15 p-3 text-sm">
                      <p className="text-ink">
                        <span className="font-semibold text-correct">✓ The vote lands on {C.display}.</span>{" "}
                        The plurality of chains agreed on the right answer — even though{" "}
                        {shown - liveTally[0]} of {shown} chains got it wrong.
                      </p>
                    </div>
                  ) : leader === -1 ? (
                    <div className="rounded-lg border-l-4 border-grid bg-surface-raised p-3 text-sm text-ink">
                      A tie. With this few chains the vote has nothing to separate the buckets.
                    </div>
                  ) : (
                    <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3 text-sm">
                      <p className="text-ink">
                        <span className="font-semibold text-wrong">
                          ✗ The vote lands on {C.paths[leader].display}.
                        </span>{" "}
                        This batch&apos;s plurality was wrong — {C.paths[leader].gist}. One ballot
                        is not the whole story; the curve to the right is what happens on average.
                      </p>
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

                {/* The selected reasoning path, in full. */}
                <div className="rounded-lg border border-dashed border-grid bg-surface-raised p-3">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    a chain that landed on {C.paths[openPath].display} —{" "}
                    {C.paths[openPath].gist}
                  </p>
                  <ol className="mt-2 flex flex-col gap-1">
                    {C.paths[openPath].steps.map((s, i) => (
                      <li key={i} className="text-sm text-ink">
                        <span className="mr-2 font-mono text-xs text-compute">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-xs text-ink-muted">
                    Click any row in the tally to read the chain behind it.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-4">
              <figure
                aria-label="Majority-vote accuracy against the number of sampled chains"
                className="m-0 flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
                  <span>what the vote buys, on average</span>
                  <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
                    Wang et al. 2022 · GSM8K · anchored
                  </span>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <LineChart
                    title={`Majority-vote accuracy versus number of sampled chains on GSM8K, log x axis. At the reference temperature accuracy climbs from 56.5 percent at one chain toward a plateau near 74.4 percent, with most of the gain arriving in the first dozen chains. Currently ${accuracyNow.toFixed(1)} percent at ${votes} chains.`}
                    points={curve}
                    logX
                    xDomain={[1, MAX_VOTES]}
                    yDomain={[50, 80]}
                    markerX={votes}
                    referenceY={prediction}
                    referenceLabel={`you predicted ${prediction}%`}
                    xLabel="chains sampled (log scale)"
                    yLabel="accuracy (%)"
                    width={460}
                    height={280}
                  />
                  <figcaption className="flex flex-col gap-2 text-sm">
                    <p className="text-ink">
                      <strong className="font-mono text-lg text-correct">
                        {accuracyNow.toFixed(1)}%
                      </strong>{" "}
                      <span className="text-ink-muted">
                        at {votes} chain{votes === 1 ? "" : "s"}, temperature {temperature.toFixed(1)}
                      </span>
                    </p>
                    <p className="text-ink-muted">
                      The gain is real and it is large — Wang et al. report self-consistency lifting
                      GSM8K by <strong className="text-ink">+17.9 points</strong>, 56.5% → 74.4% —
                      but look at the shape. It <strong className="text-ink">flattens</strong>. The
                      first handful of chains buy almost everything; going from 32 to 64 buys
                      almost nothing, at double the cost.
                    </p>
                  </figcaption>
                </div>
              </figure>

              <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-ink">
                <p>
                  <strong>Try turning the temperature to zero.</strong> The accuracy line goes flat
                  and stays flat no matter how many chains you buy. At zero the model writes the
                  same chain every time, so sampling 64 of them is asking one friend the same
                  question 64 times and calling it a poll.
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Voting does not create knowledge. It only cancels <em>uncorrelated</em> errors —
                  so the diversity you pay for is the thing that makes the vote work.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>Where this leaves us:</strong> voting reads the crowd by frequency alone — the
            most popular answer wins, and nothing ever looks at whether an answer is any{" "}
            <em>good</em>. That works while the crowd leans right.{" "}
            <em className="text-ink-muted">
              But what happens when the popular answer is the wrong one? Turn the page.
            </em>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={anchor.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the accuracy curve is a seeded Monte Carlo over a two-population model calibrated to Wang
        et al. 2022, &ldquo;Self-Consistency Improves Chain of Thought Reasoning in Language
        Models&rdquo; (arXiv:2203.11171, ICLR 2023): GSM8K with PaLM-540B, 56.5% for a single
        chain rising to 74.4% under self-consistency, and the model reproduces both endpoints at
        the reference temperature · the four reasoning paths are authored teaching examples whose
        arithmetic is recomputed by the test suite, not model transcripts · the temperature dial is
        modelled, not measured: below the reference temperature it makes chains duplicate, above it
        it flattens the answer distribution
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
