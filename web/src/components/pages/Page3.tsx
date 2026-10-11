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
 * left, one per failure page 2 raises: the knowledge gap (cost, lag, data)
 * and the bias. Section 1's three walls are h3 sub-heads, so its argument reads
 * as a list; section 2 is one paragraph on the bias (the fact was already
 * there, so more data would not have helped; next-word training on more text
 * strengthens the default) with no sub-heads. Each section is followed by its
 * margin cell. Citations
 * follow the page-2 house style: numbered inline markers (Cite) at the claim
 * they support, a References margin note (RefItem) beside the step that uses
 * each source. References live only in those margin notes; non-peer-reviewed
 * sources carry a preprint flag there. Section 1's References note sits beside
 * it; section 2 cites nothing, so its margin cell is empty. There is still no
 * "how to read this page" rail (a slider, a dial and a text box need no instructions).
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
import { Handoff } from "@/components/Handoff";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import {
  SIZE_FILL,
  TrainingTimeScatter,
  UNDISCLOSED_OPACITY,
  type LabelPlacement,
} from "@/components/TrainingTimeScatter";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { frontierCumulativeUSDM, sameModelCumulativeUSDM } from "@/lib/dailyTraining";
import { fmtParams, SIZE_BINS, trainingTimeModels } from "@/lib/trainingTime";
import { useStore } from "@/store/useStore";

const PAGE_N = 3;
const DAYS = 365;
const COMBO_MONTHS = 12;
/** Epoch's own historical projection of the largest training set, reproduced
 *  from src/dataset_size_projections.py in their data-stock repo. */
const PROJ = curves.epochDatasetProjection;
const PP = PROJ.fit!.params;
/** Median and 90% band at a projected time (fractional year), interpolated
 *  between Epoch's yearly points on the log scale the chart uses. */
const projAt = (t: number) => {
  const pts = PROJ.points;
  const lerpLog = (arr: { x: number; y: number }[]) => {
    const k = Math.min(arr.length - 2, Math.max(0, Math.floor(t) - arr[0].x));
    const a = arr[k];
    const b = arr[k + 1];
    const f = Math.min(1, Math.max(0, (t - a.x) / (b.x - a.x)));
    return Math.exp(Math.log(a.y) + f * (Math.log(b.y) - Math.log(a.y)));
  };
  return { t, med: lerpLog(pts), lo: lerpLog(PROJ.band!.lower), hi: lerpLog(PROJ.band!.upper) };
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** A fractional year as "Sep 2026". */
const fmtYM = (t: number) => {
  const m = Math.round((t - Math.floor(t)) * 12);
  const y = Math.floor(t) + (m === 12 ? 1 : 0);
  return `${MONTHS_SHORT[m % 12]} ${y}`;
};
/** The projection's fixed marker: this month, September 2026 (not read from the
 *  clock, so the page and its tests stay deterministic). */
const PROJ_START = 2026 + 8 / 12;

/** One mark per month, on both the chart axis and the slider. */
const MONTH_TICKS = Array.from({ length: COMBO_MONTHS + 1 }, (_, i) => i);

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  trainTrend: 1,
  runCost: 2,
  trainingTime: 3,
  chinchilla: 4,
  dataStock: 5,
  datasetSizes: 6,
} as const;

/** Section b's year span, read off the data so the title cannot outrun it. */
const TT_FIRST_YEAR = Math.floor(trainingTimeModels[0].x);
const TT_LAST_YEAR = Math.floor(trainingTimeModels[trainingTimeModels.length - 1].x);
/** "64 days", or "20.8 days" when Epoch's value is fractional. */
const fmtDays = (d: number) => `${Number.isInteger(d) ? d : d.toFixed(1)} days`;
/** The same span in the unit a reader thinks in: weeks under five, else months. */
const fmtSpan = (d: number) => {
  if (d < 35) return `about ${Math.round(d / 7)} weeks`;
  const mo = Math.round(d / 30.44);
  return `about ${mo} ${mo === 1 ? "month" : "months"}`;
};
/** "2022-04-04" as "Apr 2022". */
const fmtRelease = (iso: string) => `${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** Name placements where the default (right of the dot) would run off the plot or into a dot. */
const TT_LEFT: LabelPlacement = { dx: -12, dy: 3.5, anchor: "end" };
const TT_ABOVE: LabelPlacement = { dx: 0, dy: -11, anchor: "middle" };
const TT_PLACEMENTS: Record<string, LabelPlacement> = {
  RoBERTa: TT_LEFT,
  "Megatron-LM": { dx: 8, dy: 15, anchor: "start" },
  "MT-NLG": { dx: -6, dy: -8, anchor: "end" },
  "GLM-130B": TT_ABOVE,
  "LLaMA-65B": TT_LEFT,
  "Gemini 1.0 Ultra": { dx: -6, dy: -8, anchor: "end" },
  "Mistral Large": TT_ABOVE,
  "Nemotron-4 340B": { dx: -4, dy: 16, anchor: "end" },
  "Llama 3.1-405B": { dx: 4, dy: 17, anchor: "start" },
  "EXAONE 4.0": TT_LEFT,
};

/** A margin note that sits beside its step and scrolls with the page. */
function Note({
  kicker,
  tight = false,
  children,
}: {
  kicker: string;
  /** Drop the top offset, for a note that should sit level with a figure's top. */
  tight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside className={`flex flex-col gap-2 text-sm text-ink-muted ${tight ? "" : "lg:pt-9"}`}>
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
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

export function Page3() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const runCost = curves.epochRunCost;
  const rp = runCost.fit!.params;
  const RUN_M = rp.usdMillionPerRun;
  const trainTrend = curves.epochTrainingCosts;
  const tp = trainTrend.fit!.params;
  const dataStock = curves.epochDataStock;
  const ds = dataStock.fit!.params;
  const chinchilla = curves.chinchilla;
  const cp = chinchilla.fit!.params;

  const [months, setMonths] = useState(6); // mid-range: room to drag either way
  /** Section b: the model whose dot was clicked, or none yet. */
  const [ttPick, setTtPick] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const monthsTouchedRef = useRef(false);
  const crossedFlatYearRef = useRef(false);
  const crossedStockRef = useRef(false);

  const STOCK_T = ds.stockTrillionTokens;
  /** Compute-optimal reading for a model this size, in trillions of tokens. */
  /** The size whose compute-optimal appetite is exactly the whole stock. */

  // The observed-frontier figure's own year handle, independent of step 1's.
  // The projection's marker is fixed on the current month.
  const proj = projAt(PROJ_START);

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
  /** The exact month the newest-model plan passes a full year at the flat rate. */
  const flatYearCrossMonth = useMemo(() => {
    const target = sameModelCumulativeUSDM(DAYS);
    let lo = 0;
    let hi = COMBO_MONTHS;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (frontierCumulativeUSDM(mid) >= target) hi = mid;
      else lo = mid;
    }
    return hi;
  }, []);

  const onTtPick = (name: string | null) => {
    // One interaction per page, whichever control the reader touches first.
    if (name && !monthsTouchedRef.current) {
      monthsTouchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setTtPick(name);
  };

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
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        A missing fact needs new knowledge, and the obvious way to supply it is to{" "}
        <strong className="text-ink">train the model again</strong>. Retraining looks like the fix
        for a <strong className="text-ink">knowledge bias</strong> too: show the model more text,
        and the reading it overlooked should get its due.
      </p>

      {/* Each step (left) sits beside its margin notes (right); section 2 cites nothing. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Section 1 — everything that stands between retraining and the knowledge gap.
            It spans both columns as a subgrid, so each margin note can sit level with
            the part of the section it serves: References beside the top, Try it beside
            section b's chart. */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-span-2 lg:grid lg:grid-cols-subgrid lg:items-start lg:gap-x-8">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 className="text-xl font-semibold text-ink">
              1. Challenges in addressing knowledge gaps
            </h2>
            <p className="text-ink">
              Retraining runs into three problems: what it costs, how long it takes, and how much text
              there is to train on.
            </p>

            <h3 className="text-lg font-semibold text-ink">
              a. Rising cost
            </h3>
            {/* The section's text sits above its chart; the chart frame holds only
                the chart and its live readout. */}
            <p className="text-ink">
              What would it cost to retrain a model every day for a year? Frontier training runs grow
              about &times;{tp.perYear} more expensive each year, and one GPT-4-class run costs an
              estimated ${RUN_M}M.
              <Cite n={[REF.trainTrend, REF.runCost]} /> Drag the slider to run the plan forward. For
              a few missing facts, that bill is not economically feasible.
            </p>
            <figure
              aria-label="Problem one: rising cost"
              className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
            >
              <LineChart
                title={`The first year: retraining the same GPT-4-class model daily accumulates linearly to about ${fmtM(sameModelCumulativeUSDM(DAYS))}, while retraining the frontier model of the day daily compounds at Epoch's times ${tp.perYear} per year cost trend to about ${fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Derived from the cited anchors.`}
                points={comboSame}
                secondary={{
                  points: comboFrontier,
                  label: "newest model",
                }}
                primaryLabel="same model"
                // The extra spend of chasing the newest model, shaded between the lines.
                fillBetween
                fillTone="wrong-bright"
                fillOpacity={0.15}
                // Always shown: the month the newest model has spent more than a full
                // year of the same model, and everything after it.
                referenceX={flatYearCrossMonth}
                referenceXLabel="newest > 1 year of same model"
                shadeRightOfX="wrong-bright"
                primaryTone="compute-bright"
                secondaryTone="wrong-bright"
                markerX={months}
                onMarkerChange={onMonths}
                markerLabel="Drag through the first year of keeping the plan up"
                markerStep={1}
                markerValueText={(m) => `${m} ${m === 1 ? "month" : "months"}`}
                markerFormat={(bn) => fmtM(bn * 1000)}
                xLabel="time (months)"
                yLabel="cumulative cost of training ($ billions)"
                yDomain={[0, 52]}
                xTicks={MONTH_TICKS}
                width={640}
                height={300}
              />
              {/* The two curves read at the slider's month. Both are running
                  totals, which the heading has to say: a bare "$17.9B" reads just
                  as easily as a daily or per-run price. */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
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
                    <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-wrong-ink">
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
                    <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-compute-ink">
                      {fmtM(sameAtM)}
                    </p>
                  </div>
                </div>
              </div>
            </figure>
          </div>

          {/* References last on a phone, beside the section's top on a wide screen. */}
          <div className="order-last lg:order-none">
            <Note kicker="References">
              <RefItem n={REF.trainTrend} href="https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models" preprint>
                Cottier et al. 2024, <em>How Much Does It Cost to Train Frontier AI Models?</em>{" "}
                (Epoch AI).
              </RefItem>
              <RefItem n={REF.runCost} href="https://hai.stanford.edu/assets/files/hai_ai-index-report-2024_chapter1.pdf" preprint>
                Epoch AI via the Stanford HAI <em>AI Index Report 2024</em>.
              </RefItem>
              <RefItem n={REF.trainingTime} href="https://epoch.ai/data/ai-models" preprint>
                Epoch AI, <em>Data on AI Models</em>, Training time field (accessed Sep 2026; CC BY).
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
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <h3 className="text-lg font-semibold text-ink">b. Always behind</h3>
            <p className="text-ink">
              A training run takes weeks, so by the time a model is finished, its cutoff is already
              behind. Across six years of popular models, below, this delay has persisted.
              <Cite n={REF.trainingTime} />
            </p>
          </div>
          <div aria-hidden="true" className="hidden lg:block" />

          <figure
            aria-label="Training time of popular LLMs"
            className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
          >
            <TrainingTimeScatter
              title={`Training time of ${trainingTimeModels.length} popular LLMs released ${TT_FIRST_YEAR} to ${TT_LAST_YEAR}, in days, from Epoch AI's database. ${trainingTimeModels
                .map(
                  (m) =>
                    `${m.name} ${m.days} days, ${m.sizeDisclosed && m.epochParams ? `${fmtParams(m.epochParams)} parameters` : "size not disclosed"}${m.basis === "estimate" ? " (estimate)" : ""}`,
                )
                .join("; ")}.`}
              models={trainingTimeModels}
              // Half a year of room on the left, for the first labels.
              xDomain={[TT_FIRST_YEAR - 0.5, TT_LAST_YEAR + 1]}
              yDomain={[0, 190]}
              placements={TT_PLACEMENTS}
              height={380}
              selected={ttPick}
              onSelect={onTtPick}
              // The clicked dot, in three short lines: which model, how long, how it is known.
              renderDetail={(m) => (
                <div className="flex flex-col gap-0.5 pr-4">
                  <p className="text-xs text-ink-muted">
                    <strong className="text-ink">{m.name}</strong> · {m.developer} ·{" "}
                    {fmtRelease(m.released)} ·{" "}
                    {m.sizeDisclosed && m.epochParams
                      ? `${fmtParams(m.epochParams)} parameters`
                      : "size not disclosed"}
                  </p>
                  <p className="text-xl font-bold tabular-nums text-ink">
                    {fmtDays(m.days)}{" "}
                    <span className="text-xs font-normal text-ink-muted">({fmtSpan(m.days)})</span>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {m.how} Source:{" "}
                    <a
                      href={m.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-compute-ink underline"
                    >
                      {m.source.label}
                    </a>
                  </p>
                </div>
              )}
            />
            {/* The legend: colour is the model's size, fill says who measured it. */}
            <figcaption className="flex flex-col gap-1.5 text-xs text-ink-muted">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold">model size</span>
                {SIZE_BINS.map((b, k) => (
                  <span key={b.label} className="flex items-center gap-1.5">
                    <svg width="10" height="10" aria-hidden="true">
                      <circle cx="5" cy="5" r="4.5" className={SIZE_FILL[k]} />
                    </svg>
                    {b.label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <svg width="10" height="10" aria-hidden="true">
                    <circle cx="5" cy="5" r="4.5" className={SIZE_FILL[-1]} fillOpacity={UNDISCLOSED_OPACITY} />
                  </svg>
                  not disclosed
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <svg width="10" height="10" aria-hidden="true">
                    <circle cx="5" cy="5" r="4.5" className="fill-ink-muted" />
                  </svg>
                  solid: reported by the developer
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="10" height="10" aria-hidden="true">
                    <circle cx="5" cy="5" r="3.5" className="fill-surface stroke-ink-muted" strokeWidth={1.75} />
                  </svg>
                  hollow: estimated by Epoch AI
                </span>
              </span>
            </figcaption>
          </figure>
          <Note kicker="Try it" tight>
            <p>Clicking a dot shows model training time and data source.</p>
          </Note>

          <div className="flex min-w-0 flex-col gap-4">
            <h3 className="text-lg font-semibold text-ink">
              c. Not enough data
            </h3>
            {/* The argument is section prose, like section b; only the chart keeps a frame. */}
            <section aria-label="Problem two: not enough data" className="flex flex-col gap-3">
              {/* Section c's text, one paragraph above the chart; the frame holds only the chart. */}
              <p className="text-ink">
                {/* First load-bearing use of "parameter" in the deck, and pages 5 and 11 are
                    both denominated in it. Defined once, at the altitude of this page. */}
                Suppose money were no object. Bigger models need more text: a{" "}
                <strong>scaling law</strong>, measured across hundreds of models, calls for about{" "}
                {cp.tokensPerParam} <strong>tokens</strong> (pieces of text, roughly a word each) for
                every <strong>parameter</strong> (a number training adjusts).
                <Cite n={REF.chinchilla} /> Only about {STOCK_T} trillion tokens of quality writing
                exist, and no budget buys tokens that do not exist.
                <Cite n={REF.dataStock} /> Epoch projects the largest training sets growing about
                &times;{PP.growthPerYearMedian.toFixed(1)} a year, likely between &times;
                {PP.growthPerYearLow.toFixed(1)} and &times;{PP.growthPerYearHigh.toFixed(1)} (the
                shading).
                <Cite n={REF.datasetSizes} /> The largest training set in{" "}
                <strong className="text-ink">{fmtYM(proj.t)}</strong>:{" "}
                <strong className="text-ink">≈{fmtT(proj.med)}</strong> tokens,{" "}
                {proj.med >= PP.stockTrillionTokens ? (
                  <strong className="text-wrong-ink">more than all quality text</strong>
                ) : (
                  <>{((100 * proj.med) / PP.stockTrillionTokens).toFixed(0)}% of all quality text</>
                )}
                . At this pace it runs out around {PP.medianCrossesStockMonth <= 6 ? "mid-" : "late "}
                {PP.medianCrossesStockYear} (Epoch&apos;s range: {ds.windowStartYear} to{" "}
                {ds.windowEndYear}).
                <Cite n={REF.dataStock} />
              </p>
              <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface-raised p-4">
                <LineChart
                  title={`Projected largest training set, ${PROJ.points[0].x} to ${PP.lastProjectedYear}, on a log scale in trillions of tokens, with a ${PP.bandCredibility}% band, against the ${PP.stockTrillionTokens}T effective stock. Reproduced from Epoch's historical projection.`}
                  points={PROJ.points}
                  band={PROJ.band}
                  bandLabel={`likely range (×${PP.growthPerYearLow.toFixed(1)} to ×${PP.growthPerYearHigh.toFixed(1)} a year)`}
                  primaryTone="wrong-bright"
                  primaryLabel="projected largest training set"
                  logY
                  yDomain={[1, 5000]}
                  yTickFormat={(t) => (t >= 1000 ? `${t / 1000}Q` : `${t}T`)}
                  xTickFormat={(t) => String(Math.round(t))}
                  xTicks={PROJ.points.map((p) => p.x)}
                  xLabel="projected year"
                  yLabel="largest training set (tokens)"
                  referenceY={PP.stockTrillionTokens}
                  // The cap: all the quality text that exists today. Everything above it is
                  // text that would have to be written first.
                  referenceLabel={`Total quality tokens that exist = ${PP.stockTrillionTokens}T tokens`}
                  shadeAboveY="ink"
                  referenceLabelAlign="start"
                  // A fixed "today" marker: the reader cannot move it.
                  markerX={PROJ_START}
                  markerInterpolate
                  markerRuleLabel="Today"
                  width={640}
                  height={260}
                />
              </figure>

            </section>
          </div>
        </section>


        {/* Section 2 — the failure retraining was never going to reach, and the pivot */}
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink">
            2. Challenges in addressing knowledge bias
          </h2>

          <p className="text-ink">
            In the World Cup problem, the model almost certainly had the women&apos;s 2023 title in
            its data and left it out anyway. More data would not have helped. Even worse, a model is
            trained to predict the most likely next word, which means it goes with whatever its
            training data covers most. Retraining on more text, where the men&apos;s tournament still
            gets more coverage, <strong>strengthens that bad habit</strong>.
          </p>
        </section>
        <div aria-hidden="true" />
        {/* Both sections in two sentences, in the content column so it does not
            run under the sidenotes. */}
        <Handoff>
          Training-time scaling buys more knowledge, narrowing the knowledge gap, but at a compounding
          cost. It can also make the knowledge bias worse. The problem is that retraining spends its
          compute before anyone asks. Thinking it through spends compute at answer time, on the
          question actually asked.
        </Handoff>
        <div aria-hidden="true" />
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
