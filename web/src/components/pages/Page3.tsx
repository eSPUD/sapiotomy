"use client";

/**
 * Page 3, "Daily Training?" (docs/page_3_refactor.md). Page 2 ended on the
 * question: what if the model HAD been trained on data that includes last
 * night? The obvious fix, retrain every day, gets priced in three figures:
 *   Fig. 1 the meter: one $78M run per morning (Epoch AI via AI Index 2024),
 *          dragged across a year;
 *   Fig. 2 the note: that assumed the SAME model; frontier language-model
 *          compute has grown ~5x/year since mid-2020 (Epoch, redrawn, CC BY);
 *   Fig. 3 the combination: daily runs whose price rides Epoch's x2.4/year
 *          cost trend (the dollar shadow of that compute growth) over 5 years.
 * Training only on this page; the answer-time alternative is the next page's
 * business, teased by an optional guess box. No inference talk here.
 *
 * Layout rule (revision, 2026-07): no reveals, no drag-to-unlock. All three
 * figures sit side by side in a textbook grid, each with its note directly
 * below it, and every citation lands at the bottom of the page.
 */

import { useMemo, useRef, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
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

  const [day, setDay] = useState(1);
  const [months, setMonths] = useState(12);
  const [guessText, setGuessText] = useState("");
  const [guessState, setGuessState] = useState<GuessState>("open");
  const [announcement, setAnnouncement] = useState("");
  const dayTouchedRef = useRef(false);
  const monthsTouchedRef = useRef(false);
  const crossedBillionRef = useRef(false);
  const crossedTrillionRef = useRef(false);

  // The one-year meter, in $ billions per day, straight off the cited rate.
  const chartPoints = useMemo(
    () => Array.from({ length: DAYS + 1 }, (_, d) => ({ x: d, y: sameModelCumulativeUSDM(d) / 1000 })),
    [],
  );

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

  const totalM = day * RUN_M;
  const yearFmt = fmtM(DAYS * RUN_M);
  const frontierAtM = frontierCumulativeUSDM(months);
  const sameAtM = sameModelCumulativeUSDM((months / 12) * DAYS);

  const milestones = [
    { day: 1, tag: fmtM(RUN_M), note: "one GPT-4-class run" },
    {
      day: rp.crossBillionDay,
      tag: fmtM(rp.crossBillionDay * RUN_M),
      note: `passes Epoch's projected record run ($${tp.projectionBillionUSD}B, ${tp.projectionYear})`,
    },
    { day: DAYS, tag: yearFmt, note: "365 runs for one year of fresh memory" },
  ];

  const onDay = (v: number) => {
    if (!dayTouchedRef.current) {
      dayTouchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setDay(v);
    if (!crossedBillionRef.current && v * RUN_M >= 1000) {
      crossedBillionRef.current = true;
      setAnnouncement(
        `Day ${v}: the bill passed one billion dollars, more than Epoch's projected record single run.`,
      );
    } else if (v === DAYS) {
      setAnnouncement(`Day ${DAYS}: the year of daily retraining totals about ${yearFmt}.`);
    }
  };

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
        daily and it is never a day out of date. The two figures below price that plan.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <figure
          aria-label="Figure 1: the daily-retraining meter"
          className="m-0 overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>Fig. 1 · one full training run, every morning</span>
            <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
              Epoch AI estimate · ${RUN_M}M per GPT-4-class run
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <LineChart
              title={`Cumulative bill for one full training run per day: a straight line from zero to about ${yearFmt} over ${DAYS} days, crossing Epoch's projected one billion dollar record run on day ${rp.crossBillionDay}. Derived from Epoch's ${RUN_M} million dollar GPT-4 run estimate.`}
              points={chartPoints}
              markerX={day}
              referenceY={tp.projectionBillionUSD}
              referenceLabel={`Epoch's projected record run ($${tp.projectionBillionUSD}B, ${tp.projectionYear})`}
              xLabel="days of retraining daily"
              yLabel="cumulative bill ($ billions)"
              width={460}
              height={280}
            />
            <Slider
              label="Drag through the year"
              min={0}
              max={DAYS}
              value={day}
              onChange={onDay}
              suffix=" days"
            />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">total so far</p>
                <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                  {fmtM(totalM)}
                </p>
                <p className="text-sm text-ink-muted">
                  {day} {day === 1 ? "day" : "days"} · {day} {day === 1 ? "run" : "runs"}
                </p>
              </div>
              <p className="text-right text-sm text-ink-muted">
                at <strong className="font-mono text-ink">${RUN_M}M</strong> per run
                <br />
                (Epoch&apos;s GPT-4 estimate)
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {milestones.map((m) => (
                <span
                  key={m.day}
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    day >= m.day
                      ? "border-compute bg-compute/15 text-ink"
                      : "border-grid text-ink-muted"
                  }`}
                >
                  day {m.day} · {m.tag} · {m.note}
                </span>
              ))}
            </div>
            <figcaption className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3 text-sm text-ink">
              <strong>As you can see: training every day is simply not feasible.</strong> There is
              no justification for it. {rp.crossBillionDay} mornings in, the tab passes the
              priciest single run ever projected; by December it is {yearFmt} a year, spent
              keeping one model&apos;s diary current. And that is with the cheap run: Epoch prices
              Gemini Ultra&apos;s at ${rp.geminiUltraUSDMillion}M.{" "}
              <span className="text-ink-muted">
                (Real labs do retrain, on rhythms of months or years; never mornings.)
              </span>
            </figcaption>
          </div>
        </figure>

        <aside
          aria-label="Note: training price is not fixed"
          className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-compute">the catch</p>
          <p className="mt-2 text-ink">
            <strong>Fig. 1 assumed a fixed training price.</strong> It is not: Epoch AI puts
            training-compute cost on a <strong>~5&times;-per-year</strong> climb. Fold that in and
            you get the curve below.
          </p>
        </aside>

        <figure
          aria-label="Figure 2: the two rates, combined"
          className="m-0 overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>Fig. 2 · the two rates, combined</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              derived from the two Epoch trends
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <LineChart
              title={`The combination across five years: retraining the same model daily accumulates linearly to about ${fmtM(sameModelCumulativeUSDM(5 * DAYS))}, while retraining the frontier model of the day daily compounds at Epoch's times ${tp.perYear} per year cost trend to about ${fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Derived from the cited anchors.`}
              points={comboSame}
              secondary={{ points: comboFrontier, label: "the frontier model of the day, daily" }}
              primaryLabel="the same model, daily (the plan Fig. 1 rejected)"
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
              measured in trillions, while the plan Fig. 1 already rejected is the flat line at
              the bottom of its own chart.
            </figcaption>
          </div>
        </figure>

        <section aria-label="One way out" className="overflow-hidden rounded-lg border border-grid bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>one way out</span>
            <span className="rounded-full border border-grid px-2 py-0.5 text-ink-muted">
              optional · skip freely
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-lg text-ink">
              There is, however, a way to get fresh facts to a model{" "}
              <strong>without retraining it at all</strong>. Any guesses?
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

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={runCost.citation} />
        <CitationBadge citation={computeGrowth.citation} />
        <CitationBadge citation={trainTrend.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the daily-retrain meter is a deliberately absurd hypothetical priced with one cited
        anchor: Epoch AI&apos;s ≈ ${RUN_M}M compute estimate for the GPT-4 run (AI Index
        2024) · the cumulative line, the day-{rp.crossBillionDay} crossing, and the{" "}
        {yearFmt} year total are derived from that anchor · the $
        {tp.projectionBillionUSD}B record-run line is Epoch&apos;s {tp.projectionYear}{" "}
        projection · the frontier compute trend (about 5x per year for language models
        since mid-2020) and the three model anchors are Epoch figures, redrawn under CC BY,
        not Epoch&apos;s image · the combined curve is derived: one run per day priced at $
        {RUN_M}M × {tp.perYear}^years, whose per-run price passes $1B around year three,
        consistent with Epoch&apos;s {tp.projectionYear} projection · no claims about what
        any lab actually spends
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
