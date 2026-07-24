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
 * Layout rule: no reveals, no drag-to-unlock. Two-column grid: Problem 1 (the
 * figure) on the left; Problem 2 and the guess box stacked on the right.
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
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Page 2&apos;s machine lost to one fact born after its memory was sealed. The obvious fix
        stares right at you: reseal the memory <strong>every morning</strong>. Retrain the model
        daily and it is never a day out of date. That plan fails twice — first the bill, then the
        data itself.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <figure
          aria-label="Problem one: the bill compounds"
          className="m-0 overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span className="font-semibold text-wrong">problem one · the bill compounds</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              derived from the two Epoch trends
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
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
              width={460}
              height={280}
            />
            <Slider
              label="Drag through five years"
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
          </div>
        </figure>

        <div className="flex flex-col gap-4">
        <section
          aria-label="Problem two: the data runs out"
          className="overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span className="font-semibold text-wrong">problem two · the data runs out</span>
            <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
              Villalobos et al. 2024 · Epoch AI
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm text-ink">
              Suppose the money were no object. The well itself is finite: training this hard runs
              the world <strong>out of data</strong>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  the effective &ldquo;stock&rdquo; of quality training data
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                  ≈{ds.stockTrillionTokens}T tokens
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  fully utilized, if trends continue
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-wrong">
                  {ds.windowStartYear}–{ds.windowEndYear}
                </p>
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              Analysts estimate everything worth training on — the accumulated public human text of
              the internet — at roughly {ds.stockTrillionTokens} trillion tokens. On current
              trends, models will have consumed all of it between {ds.windowStartYear} and{" "}
              {ds.windowEndYear}. No budget buys tokens that do not exist.
            </p>
          </div>
        </section>

        <section aria-label="The guess" className="overflow-hidden rounded-lg border border-grid bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
          <span>the guess</span>
          <span className="rounded-full border border-grid px-2 py-0.5 text-ink-muted">
            optional · skip freely
          </span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-lg text-ink">
            Training is hitting a wall — cost on one side, data on the other. So we had to look at
            the problem through a <strong>different scope</strong>. What do you think the solution
            may be?
          </p>
          <p className="text-sm text-ink-muted">
            Hint: how did you solve <strong className="font-mono text-ink">{GAME_ROUNDS[1].prompt}</strong>{" "}
            on page 1?
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
        </div>
        </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={runCost.citation} />
        <CitationBadge citation={computeGrowth.citation} />
        <CitationBadge citation={trainTrend.citation} />
        <CitationBadge citation={dataStock.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        daily retraining is a deliberately absurd hypothetical priced from two cited Epoch
        anchors: the ≈ ${RUN_M}M compute estimate for the GPT-4 run (AI Index 2024) and the ×
        {tp.perYear}-per-year training-cost trend · the frontier compute trend (about 5x per
        year for language models since mid-2020) is an Epoch figure, redrawn under CC BY, not
        Epoch&apos;s image · the combined curve is derived: one run per day priced at ${RUN_M}M ×{" "}
        {tp.perYear}^years, whose per-run price passes $1B around year three, consistent with
        Epoch&apos;s {tp.projectionYear} projection · the ≈{ds.stockTrillionTokens}T-token
        effective data stock and the {ds.windowStartYear}–{ds.windowEndYear} full-utilization
        window are Villalobos et al. 2024 (Epoch AI) estimates, quoted verbatim · no claims
        about what any lab actually spends
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
