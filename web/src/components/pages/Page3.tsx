"use client";

/**
 * Page 3, "Training Daily?" (restructure, 2026-07: scaling-laws pivot).
 * Page 2 ended on the question: what if the model HAD been trained on data
 * that includes last night? The obvious fix, retrain every day, hits two
 * independent walls:
 *   Problem 1 — the bill: daily runs whose per-run price rides Epoch's
 *     x2.4/year training-cost trend (the dollar shadow of ~5x/year frontier
 *     compute growth) across five years, vs the flat $78M/run rate (Epoch via
 *     AI Index 2024).
 *   Problem 2 — the data: even with an unlimited budget, the effective stock
 *     of quality human text is ~300T tokens, fully utilized between 2026 and
 *     2032 if trends continue (Villalobos et al. 2024, Epoch AI).
 * The guess box then pivots the story: training is hitting a wall, so look
 * through a different scope — the hint points back at page 1's 17 × 24, which
 * the reader solved by thinking longer, not by knowing more. Training only on
 * this page; the answer-time alternative is the next page's business. No
 * inference talk here.
 *
 * Layout rule: no reveals, no drag-to-unlock. Shell matches pages 1 and 4 — a
 * single numbered reading column (1. the bill · 2. the data · 3. the guess)
 * beside a sticky instructions/references rail. The earlier two-column split
 * made the eye run left-down-right-down; the numbered stack is one straight
 * read. One dial (the five-year slider) drives both walls: it moves the cost
 * curve in step 1 and the calendar marker in step 2.
 * Every citation lands at the bottom of the page.
 */

import { useMemo, useRef, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { GAME_ROUNDS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { frontierCumulativeUSDM, sameModelCumulativeUSDM } from "@/lib/dailyTraining";
import { useStore } from "@/store/useStore";

const PAGE_N = 3;
const DAYS = 365;
const COMBO_MONTHS = 60;

/** "$78M" below a billion, "$1.0B" to a trillion, "$2.6T" past it. */
const fmtM = (m: number) =>
  m >= 1e6 ? `$${(m / 1e6).toFixed(1)}T` : m >= 1000 ? `$${(m / 1000).toFixed(1)}B` : `$${Math.round(m)}M`;

type GuessState = "open" | "guessed" | "skipped";

/** The meter's calendar span, one year either side of the cited window. */
const TRACK_START = 2025;
const TRACK_END = 2033;
/** Mid-2026: "today", so the five-year slider reads as a calendar date. */
const PROGRAM_START_YEAR = 2026.5;

const trackPct = (year: number) =>
  ((year - TRACK_START) / (TRACK_END - TRACK_START)) * 100;

/**
 * The data wall as a timeline rather than a pair of static numbers. The shaded
 * band is Villalobos et al.'s cited full-utilization window and the hairline is
 * their median year; the moving marker is only the five-year slider's month
 * placed on the calendar (derived, and labelled as such). Deliberately NOT a
 * depletion curve — the source gives a window, not a per-month burn rate, so
 * nothing here animates a "tokens remaining" figure.
 */
function DataWindowMeter({
  months,
  startY,
  endY,
  medianY,
}: {
  months: number;
  startY: number;
  endY: number;
  medianY: number;
}) {
  const markerYear = PROGRAM_START_YEAR + months / 12;
  const left = trackPct(startY);
  const width = trackPct(endY) - left;
  return (
    <div>
      <div
        role="img"
        aria-label={`Timeline ${TRACK_START} to ${TRACK_END}. The cited full-utilization window runs ${startY} to ${endY}, median ${medianY}. Keeping the plan up for ${months} months reaches ${Math.floor(markerYear)}.`}
        className="relative h-3 rounded-sm border border-grid bg-canvas"
      >
        <div
          className="absolute inset-y-0 rounded-sm bg-wrong/25"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-wrong/70"
          style={{ left: `${trackPct(medianY)}%` }}
        />
        <div
          className="absolute -bottom-1.5 -top-1.5 w-1 -translate-x-1/2 rounded-sm bg-compute ring-1 ring-canvas transition-[left] duration-150"
          style={{ left: `${trackPct(markerYear)}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span>
          fully utilized <span className="font-mono text-wrong">{startY}–{endY}</span> · median{" "}
          {medianY}
        </span>
        <span>
          this plan, month {months} ·{" "}
          <span className="font-mono text-ink">{Math.floor(markerYear)}</span>
        </span>
      </div>
    </div>
  );
}

export function Page3() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const runCost = curves.epochRunCost;
  const rp = runCost.fit!.params;
  const RUN_M = rp.usdMillionPerRun;
  const trainTrend = curves.epochTrainingCosts;
  const tp = trainTrend.fit!.params;
  const computeGrowth = curves.epochComputeGrowth;
  const dataStock = curves.epochDataStock;
  const ds = dataStock.fit!.params;
  const chinchilla = curves.chinchilla;
  const cp = chinchilla.fit!.params;

  const [months, setMonths] = useState(12);
  const [guessText, setGuessText] = useState("");
  const [guessState, setGuessState] = useState<GuessState>("open");
  const [announcement, setAnnouncement] = useState("");
  const monthsTouchedRef = useRef(false);
  const crossedTrillionRef = useRef(false);

  // The five-year combination: same model (linear) vs the frontier model of
  // the day (per-run price riding Epoch's x2.4/year cost trend). Derived.
  const comboSame = useMemo(
    () =>
      Array.from({ length: COMBO_MONTHS + 1 }, (_, m) => ({
        x: m,
        y: sameModelCumulativeUSDM((m / 12) * DAYS) / 1000,
      })),
    [],
  );
  const comboFrontier = useMemo(
    () =>
      Array.from({ length: COMBO_MONTHS + 1 }, (_, m) => ({
        x: m,
        y: frontierCumulativeUSDM(m) / 1000,
      })),
    [],
  );

  const frontierAtM = frontierCumulativeUSDM(months);
  const sameAtM = sameModelCumulativeUSDM((months / 12) * DAYS);

  const onMonths = (v: number) => {
    if (!monthsTouchedRef.current) {
      monthsTouchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setMonths(v);
    if (!crossedTrillionRef.current && frontierCumulativeUSDM(v) >= 1e6) {
      crossedTrillionRef.current = true;
      setAnnouncement(`Month ${v}: the combined bill passed one trillion dollars.`);
    }
  };

  const lockGuess = () => {
    if (guessState !== "open" || guessText.trim().length === 0) return;
    recordInteraction(PAGE_N);
    setGuessState("guessed");
    setAnnouncement("Guess noted. Hold that thought; the answer is one page away.");
  };

  const skipGuess = () => {
    if (guessState !== "open") return;
    recordInteraction(PAGE_N);
    setGuessState("skipped");
    setAnnouncement("Skipped. The reveal waits on the next page.");
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
            Page 2&apos;s machine lost to one fact born after its memory was sealed. The obvious fix
            stares right at you: reseal the memory <strong className="text-ink">every morning</strong>.
            Retrain the model daily and it is never a day out of date. That plan fails twice — first
            the bill, then the data itself.
          </p>

          {/* Step 1 — the bill */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. The bill compounds
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                derived from the two Epoch trends
              </span>
            </h2>
            <figure
              aria-label="Problem one: the bill compounds"
              className="m-0 flex flex-col gap-4 rounded-lg border-l-4 border-wrong bg-surface p-4"
            >
              <p className="text-sm text-ink">
                Every day of the plan costs more than the day before: training price is not a fixed
                number, and Epoch AI puts training-compute cost on a{" "}
                <strong>~5&times;-per-year</strong> climb.
              </p>
              <LineChart
                title={`The combination across five years: retraining the same model daily accumulates linearly to about ${fmtM(sameModelCumulativeUSDM(5 * DAYS))}, while retraining the frontier model of the day daily compounds at Epoch's times ${tp.perYear} per year cost trend to about ${fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Derived from the cited anchors.`}
                points={comboSame}
                secondary={{ points: comboFrontier, label: "the frontier model of the day, daily" }}
                primaryLabel="the same model, daily (flat $78M rate)"
                markerX={months}
                xLabel="months of keeping it up"
                yLabel="cumulative bill ($ billions)"
                yDomain={[0, 2600]}
                width={640}
                height={300}
              />
              <Slider
                label="Drag through five years — this one dial drives both walls"
                min={0}
                max={COMBO_MONTHS}
                value={months}
                onChange={onMonths}
                suffix=" months"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    the frontier of the day, daily
                  </p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-wrong">
                    {fmtM(frontierAtM)}
                  </p>
                </div>
                <div className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    the same model, daily
                  </p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                    {fmtM(sameAtM)}
                  </p>
                </div>
              </div>
              <figcaption className="text-sm text-ink">
                Combine the two rates: compute per frontier run grows about 5x a
                year; cheaper, better hardware absorbs part of that, so the <strong>bill</strong>{" "}
                per run grows ×{tp.perYear} a year (Epoch&apos;s measured cost trend). Retrain{" "}
                <em>the frontier model of the day</em>, every day, and by year five the program is
                measured in trillions — and even the flat ${RUN_M}M-per-run plan at the bottom of the
                chart burns {fmtM(DAYS * RUN_M)} a year.
              </figcaption>
            </figure>
          </section>

          {/* Step 2 — the data */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. The data runs out
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                Hoffmann 2022 · Villalobos 2024
              </span>
            </h2>
            <section
              aria-label="Problem two: the data runs out"
              className="flex flex-col gap-3 rounded-lg border-l-4 border-wrong bg-surface p-4"
            >
              <p className="text-sm text-ink">
                Suppose money were no object. It fails anyway — on the scaling law itself.
                Compute-optimal training needs parameters and training tokens to grow{" "}
                <strong>together</strong>, about{" "}
                <strong>{cp.tokensPerParam} tokens per parameter</strong>. You cannot turn money
                into capability without turning it into <strong>data</strong>.
              </p>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <p className="rounded border-l-2 border-compute bg-surface-raised p-2 text-xs text-ink-muted">
                  Chinchilla <strong className="text-ink">{cp.chinchillaParamsB}B</strong> on{" "}
                  {cp.chinchillaTokensB / 1000}T tokens beat Gopher{" "}
                  <strong className="text-ink">{cp.gopherParamsB}B</strong> on {cp.gopherTokensB}B
                  tokens at equal compute — <strong className="text-ink">+{cp.mmluGainPts} pts</strong>{" "}
                  MMLU. A quarter the size, four times the data.
                </p>
                <div className="rounded-lg border border-grid bg-surface-raised p-3 md:text-right">
                  <p className="text-xs uppercase tracking-wide text-ink-muted">
                    and the tokens are finite
                  </p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                    ≈{ds.stockTrillionTokens}T tokens
                  </p>
                </div>
              </div>
              <DataWindowMeter
                months={months}
                startY={ds.windowStartYear}
                endY={ds.windowEndYear}
                medianY={ds.medianYear}
              />
              <p className="text-sm text-ink-muted">
                That is everything worth training on — the public human text of the internet. The
                same dial from step 1 walks the plan straight into the window.{" "}
                <strong className="text-ink">No budget buys tokens that do not exist.</strong>
              </p>
            </section>
          </section>

          {/* Step 3 — the guess */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              3. So what is left?
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                optional · skip freely
              </span>
            </h2>
            <section
              aria-label="The guess"
              className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
            >
              <p className="text-lg text-ink">
                Training is hitting a wall — cost on one side, data on the other. So we had to look
                at the problem through a <strong>different scope</strong>. What do you think the
                solution may be?
              </p>
              <p className="text-sm text-ink-muted">
                Hint: how did you solve{" "}
                <strong className="font-mono text-ink">{GAME_ROUNDS[1].prompt}</strong> on page 1?
              </p>
              {guessState === "open" ? (
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    lockGuess();
                  }}
                >
                  <input
                    type="text"
                    autoComplete="off"
                    aria-label="Your guess"
                    placeholder="a word or a sentence"
                    value={guessText}
                    onChange={(e) => setGuessText(e.target.value)}
                    className="min-w-[220px] flex-1 rounded border border-grid bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                  />
                  <button
                    type="submit"
                    disabled={guessText.trim().length === 0}
                    className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                  >
                    Lock it in
                  </button>
                  <button
                    type="button"
                    onClick={skipGuess}
                    className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink"
                  >
                    Skip
                  </button>
                </form>
              ) : (
                <p className="text-ink">
                  {guessState === "guessed" ? (
                    <>
                      Noted: <em>&ldquo;{guessText.trim()}&rdquo;</em>. Hold that thought.
                    </>
                  ) : (
                    <>Hold that thought anyway.</>
                  )}{" "}
                  <em className="text-ink-muted">The answer is one page away.</em>
                </p>
              )}
            </section>
          </section>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              How to read this page
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>Read straight down: the bill, then the data, then the guess.</li>
              <li>
                One dial runs the page — drag the five-year slider in step 1 and both the cost curve
                and the calendar meter in step 2 move with it.
              </li>
              <li>The guess box is optional; skipping costs you nothing.</li>
              <li>
                Use{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd>{" "}
                to move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </h2>
            <p className="text-sm text-ink-muted">
              Run cost and the cost trend: Epoch AI. Compute-optimal scaling: Hoffmann et al. 2022.
              Data stock: Villalobos et al. 2024.
            </p>
            <p className="text-sm text-ink-muted">
              Full links and the derivation notes are at the foot of the page.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={runCost.citation} />
        <CitationBadge citation={computeGrowth.citation} />
        <CitationBadge citation={trainTrend.citation} />
        <CitationBadge citation={chinchilla.citation} />
        <CitationBadge citation={dataStock.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        daily retraining is a deliberately absurd hypothetical priced from two cited Epoch
        anchors: the ≈ ${RUN_M}M compute estimate for the GPT-4 run (AI Index 2024) and the ×
        {tp.perYear}-per-year training-cost trend · the frontier compute trend (about 5x per
        year for language models since mid-2020) is an Epoch figure, redrawn under CC BY, not
        Epoch&apos;s image · the combined curve is derived: one run per day priced at ${RUN_M}M ×{" "}
        {tp.perYear}^years, whose per-run price passes $1B around year three, consistent with
        Epoch&apos;s {tp.projectionYear} projection · the ≈{cp.tokensPerParam}-tokens-per-parameter
        compute-optimal rule and the Chinchilla {cp.chinchillaParamsB}B / Gopher{" "}
        {cp.gopherParamsB}B comparison are Hoffmann et al. 2022, which revised the earlier
        very-large-model recipe of Kaplan et al. 2020 (arXiv:2001.08361) · the ≈
        {ds.stockTrillionTokens}T-token effective data stock and the {ds.windowStartYear}–
        {ds.windowEndYear} full-utilization window (median {ds.medianYear}) are Villalobos et al.
        2024 (Epoch AI) estimates, quoted verbatim · the timeline marker is derived — it just places
        the slider&apos;s month on the calendar assuming the plan starts today; no depletion rate is
        claimed or drawn · no claims about what any lab actually spends
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
