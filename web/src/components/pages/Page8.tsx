"use client";

/**
 * Page 8, "Best-of-N and Verifiers" — page 7's vote counts by frequency, which
 * quietly assumes the crowd leans right. This page breaks that assumption on
 * purpose, with the bat-and-ball problem: the wrong answer there is not a slip,
 * it is an ATTRACTOR, so the popular answer is wrong and the right answer is
 * rare. Majority voting does not merely stall in that regime — it gets WORSE
 * with more samples, because more samples means a more reliable measurement of
 * the wrong consensus.
 *
 * The fix is to stop counting and start judging: score every candidate and keep
 * the best one. A judge at a poetry competition does not pick whichever poem
 * was submitted most often. Cobbe et al. 2021 is the canonical version — train
 * a verifier, generate N solutions, keep the one the verifier likes.
 *
 * And then the caveat that gives the page its second half. The verifier is
 * itself a model, and a judge reading the wrong criterion does not fail
 * gracefully — it fails toward whatever is most superficially appealing, which
 * here is the very attractor that fooled the crowd. So the reliability slider
 * runs both selections on the SAME candidates and lets the reader watch
 * best-of-N cross below majority voting. That crossing is Stroebl et al. 2024's
 * point, and it is why frequency voting keeps its place in the toolbox.
 *
 * The simulation (lib/sim BAT_AND_BALL_MODEL) is illustrative and chipped as
 * such: no published curve fixes what "a 40%-reliable verifier" means. What is
 * cited is the shape — that selection beats voting when the verifier is good,
 * and that imperfect verifiers cap resampling gains.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { BAT_AND_BALL } from "@/lib/authored";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { selectionAccuracy, selectionBatch } from "@/lib/sim";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const B = BAT_AND_BALL;

const CURVE_NS = [1, 2, 4, 8, 16, 32, 64];
const TRIALS = 1200;
const SEED = 21101968; // arXiv id of Cobbe et al. — a stable, documented seed

const COBBE: Citation = {
  ref: "Cobbe et al. 2021",
  url: "https://arxiv.org/abs/2110.14168",
  venue: "arXiv",
  preprint: true,
};

const STROEBL: Citation = {
  ref: "Stroebl et al. 2024",
  url: "https://arxiv.org/abs/2411.17501",
  venue: "arXiv",
  preprint: true,
};

export function Page8() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [n, setN] = useState(12);
  const [reliability, setReliability] = useState(100);
  const r = reliability / 100;

  // One batch of candidates, judged twice — the two panels share it exactly.
  const batch = useMemo(() => selectionBatch(n, SEED, r), [n, r]);
  const pop = useMemo(() => selectionAccuracy(n, TRIALS, SEED, r), [n, r]);

  const curves = useMemo(() => {
    const verifier = CURVE_NS.map((k) => ({
      x: k,
      y: selectionAccuracy(k, TRIALS, SEED, r).verifier,
    }));
    const majority = CURVE_NS.map((k) => ({
      x: k,
      y: selectionAccuracy(k, TRIALS, SEED, r).majority,
    }));
    return { verifier, majority };
  }, [r]);

  const bestScore = Math.max(...batch.candidates.map((c) => c.score), 1);

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
        Frequency voting has a blind spot, and it is a bad one:{" "}
        <strong>sometimes the right answer is the rarest one</strong>. When a problem has a trap in
        it, the crowd does not scatter randomly around the truth — it piles onto the trap. Count
        those votes and you have measured the trap very precisely.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section
          aria-label="Majority vote versus verifier best-of-N on the same candidates"
          className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>one batch of candidates · two ways to choose</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              illustrative simulation · seeded · no live model
            </span>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <p className="text-ink">{B.question}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <Slider
                label="Candidates (N)"
                min={1}
                max={32}
                value={n}
                suffix=" drafts"
                onChange={(v) => {
                  setN(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <Slider
                label="Verifier reliability"
                min={0}
                max={100}
                value={reliability}
                suffix="%"
                onChange={(v) => {
                  setReliability(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* --- Panel A: majority vote ------------------------------- */}
              <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Majority vote
                </p>
                <p className="text-xs text-ink-muted">counts answers, ignores quality</p>
                <div className="flex flex-col gap-1.5 pt-1">
                  {B.answers.map((a, i) => {
                    const count = batch.tally[i];
                    const pct = n > 0 ? (count / n) * 100 : 0;
                    const wins = i === batch.majorityAnswer;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-12 shrink-0 font-mono text-ink">{a.display}</span>
                        <span className="relative h-4 flex-1 rounded-sm bg-surface">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-sm ${
                              a.correct ? "bg-correct" : "bg-grid"
                            } ${wins ? "ring-2 ring-compute" : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-ink">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p
                  className={`mt-1 rounded border-l-4 p-2 text-sm ${
                    batch.majorityCorrect
                      ? "border-correct bg-correct/15"
                      : "border-wrong bg-wrong/15"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      batch.majorityCorrect ? "text-correct" : "text-wrong"
                    }`}
                  >
                    {batch.majorityCorrect ? "✓" : "✗"} picks{" "}
                    {B.answers[batch.majorityAnswer].display}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {B.answers[batch.majorityAnswer].gist}
                  </span>
                </p>
              </div>

              {/* --- Panel B: verifier best-of-N -------------------------- */}
              <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Verifier best-of-N
                </p>
                <p className="text-xs text-ink-muted">
                  scores every candidate, keeps the top one
                </p>
                <div
                  className="flex flex-col gap-1 pt-1"
                  role="img"
                  aria-label={`${n} candidates scored by the verifier; it picks candidate ${
                    batch.verifierPick + 1
                  }, which answers ${B.answers[batch.candidates[batch.verifierPick].answer].display} and is ${
                    batch.verifierCorrect ? "correct" : "wrong"
                  }.`}
                >
                  {batch.candidates.slice(0, 12).map((c, i) => {
                    const a = B.answers[c.answer];
                    const picked = i === batch.verifierPick;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-12 shrink-0 font-mono text-ink">{a.display}</span>
                        <span className="relative h-3 flex-1 rounded-sm bg-surface">
                          <span
                            className={`absolute inset-y-0 left-0 rounded-sm ${
                              a.correct ? "bg-correct" : "bg-grid"
                            } ${picked ? "ring-2 ring-compute" : ""}`}
                            style={{ width: `${(c.score / bestScore) * 100}%` }}
                          />
                        </span>
                        <span className="w-8 shrink-0 text-right font-mono tabular-nums text-ink-muted">
                          {c.score.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  {n > 12 ? (
                    <p className="text-xs text-ink-muted">
                      …and {n - 12} more, all scored
                    </p>
                  ) : null}
                </div>
                <p
                  className={`mt-1 rounded border-l-4 p-2 text-sm ${
                    batch.verifierCorrect
                      ? "border-correct bg-correct/15"
                      : "border-wrong bg-wrong/15"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      batch.verifierCorrect ? "text-correct" : "text-wrong"
                    }`}
                  >
                    {batch.verifierCorrect ? "✓" : "✗"} picks{" "}
                    {B.answers[batch.candidates[batch.verifierPick].answer].display}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {B.answers[batch.candidates[batch.verifierPick].answer].check}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid gap-2 border-t border-dashed border-grid pt-3 sm:grid-cols-3">
              {[
                {
                  label: "a right answer was in the pile",
                  value: pop.coverage,
                  tone: "text-ink",
                  note: "the ceiling",
                },
                { label: "majority vote got it", value: pop.majority, tone: "text-wrong", note: "counts only" },
                {
                  label: "verifier best-of-N got it",
                  value: pop.verifier,
                  tone: batch.verifierCorrect ? "text-correct" : "text-ink",
                  note: `at ${reliability}% reliability`,
                },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className={`font-mono text-2xl font-bold tabular-nums ${s.tone}`}>
                    {s.value.toFixed(0)}%
                  </p>
                  <p className="text-xs text-ink">{s.label}</p>
                  <p className="text-xs text-ink-muted">{s.note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              over {TRIALS.toLocaleString()} seeded batches of {n} — the panels above are one draw
              from this distribution
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <p>
              <strong>So bring in a judge.</strong> At a poetry competition nobody wins by
              submitting the same poem forty times. A judge reads every entry and scores it against
              criteria — craft, novelty, whether it actually lands. The winner can be the one nobody
              else saw coming.
            </p>
            <p className="mt-2 text-ink-muted">
              That is <strong className="text-ink">best-of-N with a verifier</strong>: generate N
              candidates, have a scoring model grade each one, keep its top pick. And notice why
              the judge has the easier job here — <em>checking</em> that $0.05 and $1.05 sum to
              $1.10 and differ by $1.00 is arithmetic. <em>Finding</em> $0.05 took insight.
            </p>
          </div>

          <figure
            aria-label="Selection accuracy against the number of candidates, for majority voting and verifier best-of-N"
            className="m-0 flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
              <span>the two rules as N grows</span>
              <span className="rounded-full border border-wrong/60 px-2 py-0.5 text-wrong">
                illustrative
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <LineChart
                title={`Accuracy against number of candidates on a trap problem, log x axis. Verifier best-of-N at ${reliability} percent reliability compared with majority voting, which falls as more candidates are drawn because the popular answer is the wrong one.`}
                points={curves.verifier}
                secondary={{ points: curves.majority, label: "majority vote" }}
                primaryLabel={`verifier best-of-N (${reliability}%)`}
                logX
                xDomain={[1, 64]}
                yDomain={[0, 100]}
                markerX={n}
                xLabel="candidates (log scale)"
                yLabel="accuracy (%)"
                width={420}
                height={250}
              />
              <figcaption className="text-sm text-ink-muted">
                Majority voting <strong className="text-wrong">falls</strong> as N grows here.
                More samples do not help you find a rare answer if your rule for choosing is
                &ldquo;whatever is most common&rdquo; — they just sharpen your measurement of the
                trap.
              </figcaption>
            </div>
          </figure>

          <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-ink">
            <p>
              <strong>Now drag the reliability slider down.</strong> The caveat: the judge is a
              model too. And a judge that has misunderstood the criteria does not become random —
              it becomes <em>confidently</em> wrong, drifting toward whatever looks most fluent and
              familiar. Which, on a trap problem, is the trap.
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Watch the two lines cross. Below roughly {" "}
              <strong className="text-ink">45% reliability</strong> the verifier is worse than
              simply counting votes — and worse at large N than small N, because every extra
              candidate is another chance for a wrong one to score luckily high. A weak verifier
              turns more compute into more confident errors. This is why frequency voting keeps its
              place in the toolbox: it is dumb, but it cannot be fooled about what it is measuring.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <strong>Where this leaves us:</strong> selection beats counting exactly as far as the
        selector can be trusted — so the next question is not &ldquo;how many candidates?&rdquo;
        but <em>&ldquo;what is the judge actually reading?&rdquo;</em>{" "}
        <em className="text-ink-muted">
          Grading only the final answer turns out to be its own kind of blindness. Turn the page.
        </em>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={COBBE} />
        <CitationBadge citation={STROEBL} />
      </div>
      <p className="text-xs text-ink-muted">
        the bat-and-ball problem and both candidate chains are authored teaching examples, and the
        arithmetic check shown for each answer is recomputed by the test suite · the two panels and
        the chart are a seeded, ILLUSTRATIVE Monte Carlo, not a digitized published curve: no
        reported result fixes what &ldquo;a 40%-reliable verifier&rdquo; means numerically · what
        is cited is the shape — training a verifier and selecting among N sampled solutions
        outperforms taking the model&apos;s answer directly (Cobbe et al. 2021, arXiv:2110.14168,
        the GSM8K verifier result), and gains from resampling are capped, and can reverse, when the
        verifier is imperfect (Stroebl et al. 2024, &ldquo;Inference Scaling fLaws&rdquo;,
        arXiv:2411.17501)
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
