"use client";

/**
 * Page 3, "Training-Time Scaling" (restructure, 2026-07: scaling-laws pivot).
 * Page 2 ends on a limit, not a proposal: a System 2 pass settles the question's
 * ambiguity for free, but thinking cannot produce a fact the model was never
 * shown. So the gap wants new KNOWLEDGE, and this page takes the obvious way to
 * supply it, retrain the model every day, and shows it hitting two independent
 * walls:
 *   Problem 1 — the bill: daily runs whose per-run price rides Epoch's
 *     x2.4/year training-cost trend (the dollar shadow of ~5x/year frontier
 *     compute growth) across the first year, vs the flat $78M/run GPT-4-class
 *     rate (Epoch via AI Index 2024).
 *   Problem 2 — the data: even with an unlimited budget, the effective stock
 *     of quality human text is ~300T tokens, fully utilized between 2026 and
 *     2032 if trends continue (Villalobos et al. 2024, Epoch AI).
 * The closing pull quote states both failures and hands off. Training only on
 * this page; the answer-time alternative is the next page's business. No
 * inference talk here.
 *
 * Layout rule: no reveals, no drag-to-unlock. TWO numbered sections down the
 * left, one per failure page 2 raises: the knowledge gap (cost, lag, aim, data)
 * and the bias (was-already-there, more-text-sharpens-the-default — the top two;
 * the model-collapse and alignment challenges were trimmed away). The figures
 * are h3 sub-heads inside them, so the page reads as two arguments rather than a
 * list of walls. Each section is followed by its margin cell. Citations
 * follow the page-2 house style: numbered inline markers (Cite) at the claim
 * they support, a References margin note (RefItem) beside the step that uses
 * each source. References live only in those margin notes; non-peer-reviewed
 * sources carry a preprint flag there. Only section 1 cites now, so its
 * References note sits beside it; section 2 cites nothing, so its margin cell is
 * an empty <div aria-hidden="true" />. There is still no "how to
 * read this page" rail (a slider, a dial and a text box need no instructions).
 * What is cited vs derived is said inline in each step's h2 annotation
 * ("derived from the two Epoch trends", "cited stock, derived demand"), and the
 * DataWindowMeter's caption line carries the "cited window, not a burn rate"
 * caveat. Attribution to Epoch, who publish under Creative Commons Attribution,
 * rides on the linked References entries (Sevilla & Roldan, Cottier, AI Index),
 * which name and link each source; the standalone CC BY footnote was removed.
 *
 * Each figure owns its own control. The cost chart's month marker moves that
 * chart and nothing else; the projection's year marker moves the projection and
 * nothing else. An earlier build had one figure's slider secretly driving a
 * marker in another, with no causal story connecting them. The data-window
 * timeline stays static on purpose: Villalobos gives a window, not a rate, so
 * there is nothing there for a reader to drag.
 */

import { useMemo, useRef, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { PullQuote } from "@/components/PullQuote";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { frontierCumulativeUSDM, sameModelCumulativeUSDM } from "@/lib/dailyTraining";
import { useStore } from "@/store/useStore";

const PAGE_N = 3;
const DAYS = 365;
const COMBO_MONTHS = 12;
/** Epoch's own historical projection of the largest training set, reproduced
 *  from src/dataset_size_projections.py in their data-stock repo. */
const PROJ = curves.epochDatasetProjection;
const PP = PROJ.fit!.params;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Median and 90% band at a projected year. */
const projAt = (year: number) => {
  const y = Math.round(year);
  const i = Math.max(0, PROJ.points.findIndex((p) => p.x === y));
  return {
    year: PROJ.points[i].x,
    med: PROJ.points[i].y,
    lo: PROJ.band!.lower[i].y,
    hi: PROJ.band!.upper[i].y,
  };
};

/** One mark per month, on both the chart axis and the slider. */
const MONTH_TICKS = Array.from({ length: COMBO_MONTHS + 1 }, (_, i) => i);

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  computeGrowth: 1,
  trainTrend: 2,
  runCost: 3,
  chinchilla: 4,
  dataStock: 5,
  datasetSizes: 6,
} as const;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** "$78M" below a billion, "$1.0B" to a trillion, "$2.6T" past it. */
const fmtM = (m: number) =>
  m >= 1e6
    ? `$${(m / 1e6).toFixed(1)}T`
    : m >= 1000
      ? `$${(m / 1000).toFixed(1)}B`
      : `$${Math.round(m)}M`;

/** Trillions of tokens: "1.4T" small, "300T" large. */
const fmtT = (t: number) => `${t >= 10 ? Math.round(t) : t.toFixed(1)}T`;

/** The meter's calendar span, one year either side of the cited window. */
const TRACK_START = 2025;
const TRACK_END = 2033;
/** Mid-2026, drawn as "today" so the cited window has a present to sit after. */
const TODAY_YEAR = 2026.5;

const trackPct = (year: number) => ((year - TRACK_START) / (TRACK_END - TRACK_START)) * 100;

/**
 * The cited data-stock window on a calendar. Entirely static: the shaded band
 * is Villalobos et al.'s full-utilization window, the hairline their median
 * year, the marker just today. Deliberately NOT a depletion curve and no
 * longer driven by step 1's slider — the source gives a window, not a
 * per-month burn rate, so there is nothing here for a reader to drag. The
 * caption line under the track says exactly that; it is the only place on the
 * page that does, so keep it.
 */
function DataWindowMeter({
  startY,
  endY,
  medianY,
}: {
  startY: number;
  endY: number;
  medianY: number;
}) {
  const left = trackPct(startY);
  const width = trackPct(endY) - left;
  return (
    <div>
      <div
        role="img"
        aria-label={`Timeline ${TRACK_START} to ${TRACK_END}. The cited full-utilization window runs ${startY} to ${endY}, median ${medianY}; today sits just before it.`}
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
          className="absolute -bottom-1.5 -top-1.5 w-1 -translate-x-1/2 rounded-sm bg-ink-muted ring-1 ring-canvas"
          style={{ left: `${trackPct(TODAY_YEAR)}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span>today</span>
        <span>
          fully utilized{" "}
          <span className="font-mono text-wrong">
            {startY}–{endY}
          </span>{" "}
          · median {medianY}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-ink-muted">
        The band is the cited window, not a burn rate; nothing here depletes.
      </p>
    </div>
  );
}

export function Page3() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const runCost = curves.epochRunCost;
  const rp = runCost.fit!.params;
  const RUN_M = rp.usdMillionPerRun;
  const GEMINI_M = rp.geminiUltraUSDMillion;
  const trainTrend = curves.epochTrainingCosts;
  const tp = trainTrend.fit!.params;
  const computeGrowth = curves.epochComputeGrowth;
  const dataStock = curves.epochDataStock;
  const ds = dataStock.fit!.params;
  const chinchilla = curves.chinchilla;
  const cp = chinchilla.fit!.params;

  const [months, setMonths] = useState(6); // mid-range: room to drag either way
  const [announcement, setAnnouncement] = useState("");
  const monthsTouchedRef = useRef(false);
  const crossedFlatYearRef = useRef(false);
  const crossedStockRef = useRef(false);

  const STOCK_T = ds.stockTrillionTokens;
  /** Compute-optimal reading for a model this size, in trillions of tokens. */
  /** The size whose compute-optimal appetite is exactly the whole stock. */

  // The observed-frontier figure's own year handle, independent of step 1's.
  const [projYear, setProjYear] = useState(PP.medianCrossesStockYear);
  const proj = projAt(projYear);

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
  /**
   * The milestone, derived rather than latched: the compounding plan has passed a
   * whole year of the flat rate. It announces itself to a screen reader once, on
   * the crossing, and the chip below reads it live, so dragging back reads the
   * month the reader is actually standing on.
   */
  const crossedFlatYear = frontierAtM >= sameModelCumulativeUSDM(DAYS);

  const onMonths = (v: number) => {
    if (!monthsTouchedRef.current) {
      monthsTouchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setMonths(v);
    // The trillion crossing sat at month 48, outside this chart's year. The
    // milestone that does land inside it: the compounding plan overtaking a
    // whole year of the flat rate, which it manages before the year is out.
    if (!crossedFlatYearRef.current && frontierCumulativeUSDM(v) >= sameModelCumulativeUSDM(DAYS)) {
      crossedFlatYearRef.current = true;
      setAnnouncement(
        `Month ${v}: the frontier plan has already outspent a full year at the flat rate.`,
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

      <p className="max-w-2xl text-lg text-ink-muted">
        A missing fact needs new knowledge, and the obvious way to supply it is to{" "}
        <strong className="text-ink">train the model again</strong>. The bill says no, then the data
        says no. And even if both said yes, it would do nothing about the bias.
      </p>

      {/* Each step (left) sits beside its References note (right); step 3 cites nothing. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Section 1 — everything that stands between retraining and the knowledge gap */}
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink">
            1. Challenges in addressing knowledge gaps
          </h2>

          <h3 className="text-lg font-semibold text-ink">
            a. The bill compounds
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              derived from the two Epoch trends
            </span>
          </h3>
          <figure
            aria-label="Problem one: the bill compounds"
            className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-sm text-ink">
              Training price is not a fixed number, so every day of the plan costs more than the day
              before.
            </p>
            <LineChart
              title={`The first year: retraining the same GPT-4-class model daily accumulates linearly to about ${fmtM(sameModelCumulativeUSDM(DAYS))}, while retraining the frontier model of the day daily compounds at Epoch's times ${tp.perYear} per year cost trend to about ${fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Derived from the cited anchors.`}
              points={comboSame}
              secondary={{
                points: comboFrontier,
                label: `the newest frontier model, daily · e.g. Gemini Ultra at $${GEMINI_M}M · its price climbs`,
              }}
              primaryLabel={`the same GPT-4 model, daily · flat $${RUN_M}M a run`}
              primaryTone="compute-bright"
              secondaryTone="wrong-bright"
              markerX={months}
              onMarkerChange={onMonths}
              markerLabel="Drag through the first year of keeping the plan up"
              markerStep={1}
              markerValueText={(m) => `${m} ${m === 1 ? "month" : "months"}`}
              markerFormat={(bn) => fmtM(bn * 1000)}
              xLabel="months of keeping it up"
              yLabel="cumulative bill ($ billions)"
              yDomain={[0, 52]}
              xTicks={MONTH_TICKS}
              width={640}
              height={300}
            />
            {/* The two curves read at the slider's month. Both are running
                totals, which the heading has to say: a bare "$17.9B" reads just
                as easily as a daily or per-run price. */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                total spent after {months} {months === 1 ? "month" : "months"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-lg border border-grid bg-canvas p-3">
                  <p className="text-sm font-semibold text-ink">
                    Retrain the <em>newest</em> model each day
                  </p>
                  <p className="text-xs text-ink-muted">
                    its price climbs ×{tp.perYear} a year, so the total curves upward
                  </p>
                  <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-wrong-bright">
                    {fmtM(frontierAtM)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-grid bg-canvas p-3">
                  <p className="text-sm font-semibold text-ink">
                    Retrain the <em>same</em> model each day
                  </p>
                  <p className="text-xs text-ink-muted">
                    a flat ${RUN_M}M a run, so the total climbs in a straight line
                  </p>
                  <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-compute-bright">
                    {fmtM(sameAtM)}
                  </p>
                </div>
              </div>
              {/* The designed aha, on screen. It reached the sr-only live region only, so
                  a sighted reader dragged straight past the moment the page is built
                  around. Lights when the crossing happens and stays lit. */}
              {crossedFlatYear ? (
                <p className="rounded-lg border-l-4 border-wrong bg-wrong/10 px-3 py-2 text-sm text-ink">
                  <strong className="text-wrong">Month {months}:</strong> chasing the frontier has
                  already outspent a <em>whole year</em> at the flat rate.
                </p>
              ) : null}
              {months > 0 ? (
                <p className="text-sm text-ink-muted">
                  Chasing the frontier costs{" "}
                  <strong className="text-ink">{fmtM(frontierAtM - sameAtM)}</strong> more so far,
                  and the gap widens every month.
                </p>
              ) : (
                <p className="text-sm text-ink-muted">
                  Nothing spent yet. Drag the slider to run the plan forward.
                </p>
              )}
            </div>
            <figcaption className="text-sm text-ink">
              Compute per frontier run grows about 5x a year.
              <Cite n={REF.computeGrowth} /> Cheaper hardware absorbs part of that, so the{" "}
              <strong>bill</strong> per run grows ×{tp.perYear} a year.
              <Cite n={REF.trainTrend} /> Retrain <em>the frontier model of the day</em>, every day,
              and year one alone runs to {fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Even a flat rate
              burns{" "}
              {fmtM(DAYS * RUN_M)} a year: one <strong>GPT-4</strong>-class run costs an estimated $
              {RUN_M}M of compute, and <strong>Gemini Ultra</strong> an estimated ${GEMINI_M}M.
              <Cite n={REF.runCost} />
            </figcaption>
          </figure>

          <h3 className="text-lg font-semibold text-ink">b. It always lags</h3>
          <p className="text-ink">
            A training run takes weeks, so the cutoff moves forward but never reaches <em>now</em>.
            Retraining resets the clock. It does not stop it.
          </p>

          <h3 className="text-lg font-semibold text-ink">c. It cannot be aimed</h3>
          <p className="text-ink">
            There is no retraining for one missing fact. You buy the whole distribution to obtain a
            single result.
          </p>

          <h3 className="text-lg font-semibold text-ink">
            d. The data runs out
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              cited stock, derived demand
            </span>
          </h3>
          <section
            aria-label="Problem two: the data runs out"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-sm text-ink">
              {/* First load-bearing use of "parameter" in the deck, and pages 5 and 11 are
                  both denominated in it. One parenthetical, at the altitude of this page. */}
              Suppose money were no object. It still fails. A <strong>bigger</strong> model only pays
              off if it also <strong>reads more</strong>, in step: about {cp.tokensPerParam} tokens
              per <strong>parameter</strong> (one of the numbers inside the model that training
              adjusts, and the usual way of saying how big it is), which is the scaling law.
              <Cite n={REF.chinchilla} /> So the ceiling was never money. It is how much there is
              worth reading, and{" "}
              <strong className="text-ink">no budget buys tokens that do not exist</strong>.
            </p>
            <div className="rounded-lg border border-grid bg-surface-raised p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                every quality token humans have written
                <Cite n={REF.dataStock} />
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums text-ink">
                ≈{ds.stockTrillionTokens}T tokens
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                tokens: the pieces of text a model reads, roughly a word each
              </p>
            </div>
            {/* Where the trend lands. Epoch's own historical projection, run
                forward from their dataset-size regression to 2030. */}
            <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface-raised p-4">
              <figcaption className="text-sm text-ink">
                So when does the field actually reach the ceiling? Epoch project the largest training
                set forward from its own trend, about{" "}
                <strong>&times;{PP.growthPerYearMedian.toFixed(1)} a year</strong>. Drag the year.
                <Cite n={REF.datasetSizes} />
              </figcaption>
              <LineChart
                title={`Projected largest training set, ${PROJ.points[0].x} to ${PP.lastProjectedYear}, on a log scale in trillions of tokens, with a ${PP.bandCredibility}% band, against the ${PP.stockTrillionTokens}T effective stock. Reproduced from Epoch's historical projection.`}
                points={PROJ.points}
                band={PROJ.band}
                primaryTone="wrong-bright"
                primaryLabel="projected largest training set"
                logY
                yDomain={[1, 5000]}
                yTickFormat={(t) => (t >= 1000 ? `${t / 1000}Q` : `${t}T`)}
                xTickFormat={(t) => String(Math.round(t))}
                xTicks={PROJ.points.map((p) => p.x)}
                referenceY={PP.stockTrillionTokens}
                referenceLabel={`${PP.stockTrillionTokens}T stock`}
                markerX={projYear}
                onMarkerChange={setProjYear}
                markerLabel="Drag through the projected years"
                markerStep={1}
                markerValueText={(v) => String(Math.round(v))}
                width={640}
                height={260}
              />
              <p className="text-sm text-ink-muted">
                By <strong className="text-ink">{proj.year}</strong> the trend points at{" "}
                <strong className="text-ink">≈{fmtT(proj.med)}</strong> tokens, with a{" "}
                {PP.bandCredibility}% band from{" "}
                <strong className="text-ink">{fmtT(proj.lo)}</strong> to{" "}
                <strong className="text-ink">{fmtT(proj.hi)}</strong>.{" "}
                {proj.med >= PP.stockTrillionTokens ? (
                  <strong className="text-wrong-bright">
                    That is past the whole stock, so the recipe is asking for text that does not
                    exist.
                  </strong>
                ) : (
                  <>
                    That is{" "}
                    {((100 * proj.med) / PP.stockTrillionTokens).toFixed(0)}% of the stock.
                  </>
                )}{" "}
                On this projection the median crosses the stock in{" "}
                <strong className="text-ink">
                  {MONTH_NAMES[PP.medianCrossesStockMonth - 1]} {PP.medianCrossesStockYear}
                </strong>
                , inside the window below.
              </p>
              <p className="text-xs text-ink-muted">
                the trend projection only · Epoch also run a compute-based projection, which is not
                drawn here
              </p>
            </figure>

            <DataWindowMeter
              startY={ds.windowStartYear}
              endY={ds.windowEndYear}
              medianY={ds.medianYear}
            />

          </section>
        </section>

        <Note kicker="References">
          <RefItem n={REF.computeGrowth} href="https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year" preprint>
            Sevilla &amp; Rold&aacute;n 2024,{" "}
            <em>Training Compute of Frontier AI Models Grows by 4&ndash;5x per Year</em> (Epoch
            AI).
          </RefItem>
          <RefItem n={REF.trainTrend} href="https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models" preprint>
            Cottier et al. 2024, <em>How Much Does It Cost to Train Frontier AI Models?</em>{" "}
            (Epoch AI).
          </RefItem>
          <RefItem n={REF.runCost} href="https://hai.stanford.edu/assets/files/hai_ai-index-report-2024_chapter1.pdf" preprint>
            Epoch AI via the Stanford HAI <em>AI Index Report 2024</em>.
          </RefItem>
          <RefItem n={REF.chinchilla} href="https://arxiv.org/abs/2203.15556">
            Hoffmann et al. 2022, <em>Training Compute-Optimal Large Language Models</em> (NeurIPS
            2022).
          </RefItem>
          <RefItem n={REF.dataStock} href="https://arxiv.org/abs/2211.04325" preprint>
            Villalobos et al. 2024, <em>Will We Run Out of Data? Limits of LLM Scaling Based on
            Human-Generated Data</em> (Epoch AI &middot; arXiv 2211.04325).
          </RefItem>
          <RefItem
            n={REF.datasetSizes}
            href="https://github.com/epoch-research/data-stock"
            preprint
          >
            Epoch AI, <em>data-stock</em> repository, <code>data/dataset_sizes.csv</code> (the
            training-set table behind Villalobos et al. 2024).
          </RefItem>
        </Note>

        {/* Section 2 — the failure retraining was never going to reach, and the pivot */}
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink">
            2. Challenges in addressing knowledge bias
          </h2>

          <h3 className="text-lg font-semibold text-ink">a. The fact was already there</h3>
          <p className="text-ink">
            Page 2&apos;s model held the 2023 title the whole time and dropped it anyway. That miss
            was never about what it had read, so more reading cannot answer it.
          </p>

          <h3 className="text-lg font-semibold text-ink">b. More text sharpens the default</h3>
          <p className="text-ink">
            The reading a model picks is whatever its corpus says most. More text from the same
            world strengthens that majority rather than loosening it.
          </p>
        </section>

        <div aria-hidden="true" />
        {/* Both sections in two sentences, in the content column so it does not
            run under the sidenotes. */}
        <PullQuote>
          Training-time scaling buys more facts, later, at compounding cost, and it cannot touch a
          bias that was never about missing facts. Every wall here limits what a model can be given{" "}
          <strong>before</strong> the question arrives, which leaves only what it does{" "}
          <strong>after</strong> it.
        </PullQuote>
        <div aria-hidden="true" />
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
