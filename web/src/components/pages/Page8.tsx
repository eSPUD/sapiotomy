"use client";

/**
 * Page 8, "Best-of-N and Verifiers" — page 7's vote counts by frequency, which
 * quietly assumes the crowd leans right. This page breaks that assumption on
 * purpose, with the lily-pad problem: the wrong answer (day 24, "half the days"
 * not "half the lake") is not a slip, it is an ATTRACTOR, so the popular answer
 * is wrong and the right answer is rare. Majority voting does not merely stall
 * in that regime — it gets WORSE
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
 * here is the very attractor that fooled the crowd. So step 1's reliability
 * slider re-judges the SAME candidates both ways, and step 2's own dial (which
 * drives the curves and nothing else) is where the reader watches best-of-N
 * cross below majority voting. That crossing is Stroebl et al. 2024's point, and
 * it is why frequency voting keeps its place in the toolbox.
 *
 * The simulation (lib/sim LILY_PAD_MODEL) is illustrative and chipped as
 * such: no published curve fixes what "a 40%-reliable verifier" means. What is
 * cited is the shape — that selection beats voting when the verifier is good,
 * and that imperfect verifiers cap resampling gains.
 *
 * Layout: shell matches page 1 — the intro paragraph runs full width above one
 * reading column of numbered steps, each step beside its own margin note that
 * scrolls with it. No sticky how-to-read rail. Two one-line notes only, each
 * carrying the one thing no on-screen label says: beside step 1, that both
 * panels judge the same batch; beside step 2, that its chart has its own
 * reliability dial. Step 3 has no note. Cobbe and Stroebl stay as the badge row
 * and the provenance footnote below the grid — not as margin cites.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { LILY_PADS } from "@/lib/authored";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { selectionAccuracy, selectionBatch } from "@/lib/sim";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const B = LILY_PADS;

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

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

export function Page8() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [n, setN] = useState(12);
  const [reliability, setReliability] = useState(100);
  const r = reliability / 100;

  // Step 2's chart has its OWN reliability dial, independent of the step-1 demo.
  // The curves are a separate experiment (population accuracy vs N), not a live
  // redraw of the single batch judged in step 1, so they never wobble when the
  // batch above is re-judged.
  const [chartReliability, setChartReliability] = useState(70);
  const cr = chartReliability / 100;

  // One batch of candidates, judged twice — the two panels share it exactly.
  const batch = useMemo(() => selectionBatch(n, SEED, r), [n, r]);
  const pop = useMemo(() => selectionAccuracy(n, TRIALS, SEED, r), [n, r]);

  const curves = useMemo(() => {
    const verifier = CURVE_NS.map((k) => ({
      x: k,
      y: selectionAccuracy(k, TRIALS, SEED, cr).verifier,
    }));
    const majority = CURVE_NS.map((k) => ({
      x: k,
      y: selectionAccuracy(k, TRIALS, SEED, cr).majority,
    }));
    return { verifier, majority };
  }, [cr]);

  const bestScore = Math.max(...batch.candidates.map((c) => c.score), 1);

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      <p className="max-w-2xl text-lg text-ink-muted">
        Frequency voting has a bad blind spot:{" "}
        <strong className="text-ink">sometimes the right answer is the rarest one</strong>. On a
        problem with a trap the crowd piles onto the trap, so counting votes just measures it
        precisely. Bring in a judge instead; nobody wins a poetry competition by submitting the same
        poem forty times. Score every candidate, keep the best:{" "}
        <strong className="text-ink">best-of-N with a verifier</strong>.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two selectors */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Judge one batch two ways
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              seeded illustrative simulation · no live model
            </span>
          </h2>
          <section
            aria-label="Majority vote versus verifier best-of-N on the same candidates"
            className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
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
                  scores every candidate, keeps the top one, and it has the easier job:{" "}
                  <em>checking</em> that day 47 doubles to a full lake on day 48 is one step,{" "}
                  <em>finding</em> day 47 meant resisting the &ldquo;half the days&rdquo; pull
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
                  {batch.candidates.slice(0, 8).map((c, i) => {
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
                  {n > 8 ? (
                    <p className="text-xs text-ink-muted">…and {n - 8} more, all scored</p>
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
              over {TRIALS.toLocaleString()} seeded batches of {n}; the panels above are one draw
              from this distribution
            </p>
          </section>
        </section>
        <Note kicker="Same batch, two rules">
          <p>Both panels judge the same candidates; only the rule for choosing differs.</p>
        </Note>

        {/* Step 2 — the curves. Self-contained: its own reliability dial
            drives it, decoupled from the step-1 demo, so the authoritative
            curves never wobble when the batch above is re-judged. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The two rules as N grows
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              seeded illustrative simulation
            </span>
          </h2>
          <figure
            aria-label="Selection accuracy against the number of candidates, for majority voting and verifier best-of-N"
            className="m-0 flex min-w-0 flex-col rounded-lg border-l-4 border-grid bg-surface"
          >
            <div className="flex flex-col gap-3 p-4">
              <LineChart
                title={`Accuracy against number of candidates on a trap problem, log x axis. Verifier best-of-N at ${chartReliability} percent reliability compared with majority voting, which falls as more candidates are drawn because the popular answer is the wrong one.`}
                points={curves.verifier}
                secondary={{ points: curves.majority, label: "majority vote" }}
                primaryLabel={`verifier best-of-N (${chartReliability}%)`}
                logX
                xDomain={[1, 64]}
                yDomain={[0, 100]}
                xLabel="candidates (log scale)"
                yLabel="accuracy (%)"
                width={560}
                height={250}
              />
              <Slider
                label="Verifier reliability — drag it down until best-of-N crosses below voting"
                min={0}
                max={100}
                value={chartReliability}
                suffix="%"
                onChange={(v) => {
                  setChartReliability(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <figcaption className="text-sm text-ink-muted">
                Majority voting <strong className="text-wrong">falls</strong> as N grows: counting
                cannot find a rare answer. And the verifier is a model too, so misread the criteria
                and it goes <em>confidently</em> wrong toward the trap. Below roughly{" "}
                <strong>45%</strong> it crosses <em>under</em> voting, and does worse at large N
                than small, since every extra candidate is another chance for a wrong one to score
                luckily high. That crossing is why voting keeps its place: it is dumb, but it cannot
                be fooled about what it measures.
              </figcaption>
            </div>
          </figure>
        </section>
        <Note kicker="A second dial">
          <p>This chart carries its own reliability dial; the batch in step 1 does not follow it.</p>
        </Note>

        {/* Step 3 — the handoff */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Where this leaves us</h2>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            Selection beats counting exactly as far as the selector can be trusted, so the next
            question is not &ldquo;how many candidates?&rdquo; but{" "}
            <em>&ldquo;what is the judge actually reading?&rdquo;</em>{" "}
            <em className="text-ink-muted">
              Grading only the final answer is its own kind of blindness. Turn the page.
            </em>
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={COBBE} />
        <CitationBadge citation={STROEBL} />
      </div>
      <p className="text-xs text-ink-muted">
        the lily-pad problem and its candidate chains are authored teaching examples, and the
        doubling check shown for each answer is recomputed by the test suite · the two panels and
        the chart are a seeded, ILLUSTRATIVE Monte Carlo, not a digitized published curve: no
        reported result fixes what &ldquo;a 40%-reliable verifier&rdquo; means numerically · what
        is cited is the shape: training a verifier and selecting among N sampled solutions
        outperforms taking the model&apos;s answer directly (Cobbe et al. 2021, arXiv:2110.14168,
        the GSM8K verifier result), and gains from resampling are capped, and can reverse, when the
        verifier is imperfect (Stroebl et al. 2024, &ldquo;Inference Scaling fLaws&rdquo;,
        arXiv:2411.17501)
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
