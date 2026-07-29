"use client";

/**
 * Page 3, "Training Daily?" (restructure, 2026-07: scaling-laws pivot).
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
 * The guess box then pivots the story: both walls come from paying compute up
 * front to bake smarts in, so turn it around and spend that effort when the
 * question arrives instead — the hint points back at page 1's 17 × 24, which
 * the reader worked out on the spot, not by knowing it in advance. Training
 * only on this page; the answer-time alternative is the next page's business.
 * No inference talk here.
 *
 * Layout rule: no reveals, no drag-to-unlock. Shell matches page 1 exactly —
 * numbered steps down the left, each followed by its margin cell. Citations
 * follow the page-2 house style: numbered inline markers (Cite) at the claim
 * they support, a References margin note (RefItem) beside the step that uses
 * each source. References live only in those margin notes; non-peer-reviewed
 * sources carry a preprint flag there. Steps 1 and 2 each get their own References note so a source
 * never drifts from the step it backs; step 3 cites nothing, so its margin
 * cell stays an empty <div aria-hidden="true" />. There is still no "how to
 * read this page" rail (a slider, a dial and a text box need no instructions).
 * What is cited vs derived is said inline in each step's h2 annotation
 * ("derived from the two Epoch trends", "cited stock, derived demand"), the
 * DataWindowMeter's caption line carries the "cited window, not a burn rate"
 * caveat that used to live in a margin note, and the bottom footnote carries the
 * CC BY redraw attribution plus the "no claims about what any lab actually
 * spends" disclaimer. All three are load-bearing: do not trim them.
 *
 * Each figure owns its own control, too. Step 1's five-year slider moves step
 * 1's cost curve, and nothing else; step 2's parameter dial moves step 2's
 * reading bar, and nothing else. The old build had step 1's slider secretly
 * driving a marker in step 2 — a dial in one figure yanking a needle in
 * another, with no causal story connecting them. The data wall's timeline is
 * now static, which is honest: Villalobos gives a window, not a rate, so there
 * was never anything for the reader to drag there.
 */

import { useMemo, useRef, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
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
const COMBO_MONTHS = 12;
/** One mark per month, on both the chart axis and the slider. */
const MONTH_TICKS = Array.from({ length: COMBO_MONTHS + 1 }, (_, i) => i);

/** Reference numbers, in order of first appearance on the page. */
const REF = { computeGrowth: 1, trainTrend: 2, runCost: 3, chinchilla: 4, dataStock: 5 } as const;

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

/** Parameter counts, dialled in billions but spoken in trillions past 1000B. */
const fmtParams = (b: number) => (b >= 1000 ? `${(b / 1000).toFixed(1)}T` : `${b}B`);

/** Step 2's dial: model size in billions of parameters. */
const PARAMS_MIN = 100;
const PARAMS_MAX = 20000;
const PARAMS_STEP = 100;

type GuessState = "open" | "guessed" | "skipped";

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

/**
 * Step 2's own figure: how much of the finite stock one model has to read.
 * Compute-optimal training wants about {tokensPerParam} tokens per parameter
 * (Hoffmann et al. 2022), so the reader's parameter dial converts straight into
 * a demand for text, drawn against Villalobos et al.'s ~300T stock. Derived
 * from those two cited anchors and labelled as such; past 100% the bar turns
 * red and says so rather than pretending the tokens exist.
 */
function ReadingBar({ tokensT, stockT }: { tokensT: number; stockT: number }) {
  const share = tokensT / stockT;
  const over = share > 1;
  return (
    <div>
      <div
        role="img"
        aria-label={`Reading demand against the stock: this model must read about ${tokensT.toFixed(1)} trillion tokens, ${(share * 100).toFixed(0)} percent of the ${stockT} trillion token stock.`}
        className="relative h-3 overflow-hidden rounded-sm border border-grid bg-canvas"
      >
        <div
          className={`absolute inset-y-0 left-0 transition-[width] duration-150 ${over ? "bg-wrong" : "bg-compute"}`}
          style={{ width: `${Math.min(share, 1) * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span>
          must read <span className="font-mono text-ink">≈{fmtT(tokensT)}</span>
        </span>
        <span>
          {over ? (
            <span className="font-semibold text-wrong">
              {(share * 100).toFixed(0)}% — more text than exists
            </span>
          ) : (
            `${(share * 100).toFixed(share < 0.1 ? 2 : 1)}% of everything ever written`
          )}
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
  const GEMINI_M = rp.geminiUltraUSDMillion;
  const trainTrend = curves.epochTrainingCosts;
  const tp = trainTrend.fit!.params;
  const computeGrowth = curves.epochComputeGrowth;
  const dataStock = curves.epochDataStock;
  const ds = dataStock.fit!.params;
  const chinchilla = curves.chinchilla;
  const cp = chinchilla.fit!.params;

  const [months, setMonths] = useState(6); // mid-range: room to drag either way
  const [paramsB, setParamsB] = useState(1000);
  const [guessText, setGuessText] = useState("");
  const [guessState, setGuessState] = useState<GuessState>("open");
  const [announcement, setAnnouncement] = useState("");
  const monthsTouchedRef = useRef(false);
  const paramsTouchedRef = useRef(false);
  const crossedFlatYearRef = useRef(false);
  const crossedStockRef = useRef(false);

  const STOCK_T = ds.stockTrillionTokens;
  /** Compute-optimal reading for a model this size, in trillions of tokens. */
  const tokensT = (paramsB * cp.tokensPerParam) / 1000;
  /** The size whose compute-optimal appetite is exactly the whole stock. */
  const paramsAtFullStock = (STOCK_T * 1000) / cp.tokensPerParam;

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

  const onParams = (v: number) => {
    if (!paramsTouchedRef.current) {
      paramsTouchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setParamsB(v);
    if (!crossedStockRef.current && (v * cp.tokensPerParam) / 1000 > STOCK_T) {
      crossedStockRef.current = true;
      setAnnouncement(
        `At ${fmtParams(v)} parameters the compute-optimal recipe asks for more text than humans have written.`,
      );
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

      <p className="max-w-2xl text-lg text-ink-muted">
        Thinking cannot produce a fact the model never saw. That gap needs new knowledge, and the
        obvious way to supply it is to train the model again. Do it{" "}
        <strong className="text-ink">every morning</strong> and it is never a day out of date. That
        plan fails twice: first the bill, then the data itself.
      </p>

      {/* Each step (left) sits beside its References note (right); step 3 cites nothing. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the bill */}
        <section className="flex min-w-0 flex-col gap-3">
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
              Training price is not a fixed number, so every day of the plan costs more than the day
              before.
            </p>
            <LineChart
              title={`The first year: retraining the same GPT-4-class model daily accumulates linearly to about ${fmtM(sameModelCumulativeUSDM(DAYS))}, while retraining the frontier model of the day daily compounds at Epoch's times ${tp.perYear} per year cost trend to about ${fmtM(frontierCumulativeUSDM(COMBO_MONTHS))}. Derived from the cited anchors.`}
              points={comboSame}
              secondary={{
                points: comboFrontier,
                label: "the frontier model of the day, daily",
              }}
              primaryLabel={`the same model, daily (flat GPT-4-class $${RUN_M}M rate)`}
              markerX={months}
              xLabel="months of keeping it up"
              yLabel="cumulative bill ($ billions)"
              yDomain={[0, 52]}
              xTicks={MONTH_TICKS}
              width={640}
              height={300}
            />
            <Slider
              label="Drag through the first year of keeping the plan up"
              min={0}
              max={COMBO_MONTHS}
              value={months}
              onChange={onMonths}
              suffix=" months"
              ticks={MONTH_TICKS}
            />
            {/* The two curves read at the slider's month. Both are running
                totals, which the heading has to say: a bare "$17.9B" reads just
                as easily as a daily or per-run price. */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                total spent after {months} {months === 1 ? "month" : "months"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="text-sm font-semibold text-ink">
                    Retrain the <em>newest</em> model each day
                  </p>
                  <p className="text-xs text-ink-muted">
                    its price climbs ×{tp.perYear} a year, so the total curves upward
                  </p>
                  <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-wrong">
                    {fmtM(frontierAtM)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-grid bg-surface-raised p-3">
                  <p className="text-sm font-semibold text-ink">
                    Retrain the <em>same</em> model each day
                  </p>
                  <p className="text-xs text-ink-muted">
                    a flat ${RUN_M}M a run, so the total climbs in a straight line
                  </p>
                  <p className="mt-auto font-mono text-2xl font-bold tabular-nums text-ink">
                    {fmtM(sameAtM)}
                  </p>
                </div>
              </div>
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
        </Note>

        {/* Step 2 — the data */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Bigger models, finite data
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              cited stock, derived demand
            </span>
          </h2>
          <section
            aria-label="Problem two: the data runs out"
            className="flex flex-col gap-3 rounded-lg border-l-4 border-wrong bg-surface p-4"
          >
            <p className="text-sm text-ink">
              Suppose money were no object. It still fails. The other way to make a model smarter is
              to make it <strong>bigger</strong>, but a bigger model only pays off if it also{" "}
              <strong>reads more</strong>, in step: about {cp.tokensPerParam} tokens for every
              parameter. Size and reading climb together: that is the scaling law.
              <Cite n={REF.chinchilla} /> So the ceiling was never the money. It is how much there
              is worth reading.
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
            <Slider
              label="Size the model you want to train next"
              min={PARAMS_MIN}
              max={PARAMS_MAX}
              step={PARAMS_STEP}
              value={paramsB}
              onChange={onParams}
              format={fmtParams}
              suffix=" parameters"
            />
            <ReadingBar tokensT={tokensT} stockT={STOCK_T} />
            <p className="text-sm text-ink-muted">
              A <strong className="text-ink">{fmtParams(paramsB)}</strong>
              -parameter model wants <strong className="text-ink">≈{fmtT(tokensT)}</strong> tokens
              of training text. Push the dial to{" "}
              <strong className="text-ink">{fmtParams(paramsAtFullStock)}</strong> and the recipe
              asks for every
              quality token humans have written — and the field is already on course to use the lot.{" "}
              <strong className="text-ink">No budget buys tokens that do not exist.</strong>
            </p>
            <DataWindowMeter
              startY={ds.windowStartYear}
              endY={ds.windowEndYear}
              medianY={ds.medianYear}
            />
          </section>
        </section>
        <Note kicker="References">
          <RefItem n={REF.chinchilla} href="https://arxiv.org/abs/2203.15556">
            Hoffmann et al. 2022, <em>Training Compute-Optimal Large Language Models</em> (NeurIPS
            2022).
          </RefItem>
          <RefItem n={REF.dataStock} href="https://arxiv.org/abs/2211.04325" preprint>
            Villalobos et al. 2024, <em>Will We Run Out of Data? Limits of LLM Scaling Based on
            Human-Generated Data</em> (Epoch AI &middot; arXiv 2211.04325).
          </RefItem>
        </Note>

        {/* Step 3 — the guess */}
        <section className="flex min-w-0 flex-col gap-3">
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
              Both walls come from the same habit: paying for smarts <strong>up front</strong>, all
              at once, before a single question is asked. Page 2 left the other option on the table
              without naming its price. That is what the bill buys, and what the
              data runs out on. So turn it around, and instead of front-loading everything to make
              the model <strong>know</strong> the answer, what if we spent that effort{" "}
              <strong>when the question arrives</strong>, and let it{" "}
              <strong>work the answer out</strong>? What do you think that would look like?
            </p>
            <p className="text-sm text-ink-muted">
              Hint: how did you solve{" "}
              <strong className="font-mono text-ink">{GAME_ROUNDS[1].prompt}</strong> on page 1? You
              didn&apos;t know it in advance. You built it on the spot.
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
        <div aria-hidden="true" />
      </div>

      

      <p className="text-xs text-ink-muted">
        the frontier compute trend (about 5x per year for language models since mid-2020) is an
        Epoch figure, redrawn under CC BY, not Epoch&apos;s image · no claims about what any lab
        actually spends
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
