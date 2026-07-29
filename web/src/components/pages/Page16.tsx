"use client";

/**
 * Page 16, "The Bill Comes Due" — Act 3 turns from what thinking longer buys to
 * what it costs. Three steps, each one economic fact:
 *
 * Step 1 anchors the bill: o3's two ARC-AGI-Pub configs (6 vs 1024 samples per
 * task, 172x the compute) bought 75.7% -> 87.5% for ~$20 -> ~$3,460 per task
 * (per-task dollars as compiled by Bender et al. from ARC Prize's estimates).
 * Dollar figures are estimate-dependent — OpenAI never published o3 pricing and
 * ARC Prize later revised its numbers upward — so the copy leans on the stable
 * facts: token counts and the 172x multiplier. Humans sit at ~$17/task
 * measured, $2–5 plausible floor.
 *
 * Step 2 is the counter-current: DeepSeek-R1 launched at ~27x below o1's list
 * price. But cheaper tokens move the bill down, not the curve's shape —
 * coverage is log-linear in samples (Brown et al.) and an imperfect verifier
 * caps the ceiling (Stroebl et al.). Exponential spend, linear gains, hard cap.
 *
 * Step 3 is the interactive: a cost-accuracy dial. Pick a target accuracy and
 * a lifetime query volume; the page prices three ways to serve it — rent the
 * big model, sample the small one N times (N from the log-linear law), or pay
 * a one-time retraining/distillation bill and serve cheap forever — and plots
 * rent-vs-own with the amortization crossover. The arithmetic (lib/frontier.ts)
 * is pure and pinned in act3.test.ts. Anchors are disclosed in the step body:
 * list prices are real (o1/R1), the retraining bill is DeepSeek's reported
 * $294k RL-stage figure, the small model's climb (+12 pts per 10x samples from
 * 60%, ceiling 90%) is authored — Brown-shaped, Stroebl-capped — because no
 * published result fixes those numbers for a generic workload. Snell et al.'s
 * regime (small model + inference compute stands in for a 14x larger one on
 * easy/medium problems) is where the "sample" verdict comes from.
 *
 * Layout follows pages 3–10: full-width intro, numbered steps in the reading
 * column, margin notes carry numbered cites (Cite/RefItem; venues, ids and
 * links live in the badge row at the bottom), caveats live in step bodies, one
 * short provenance footnote.
 */

import { useMemo, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import {
  cheapestStrategy,
  distillCrossover,
  perQueryCosts,
  samplesForTarget,
  totalBills,
  type BillAnchors,
} from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 16;

/** Page 16's references, numbered in order of first appearance. */
const REF = { arcPrize: 1, bender: 2, pricing: 3, brown: 4, stroebl: 5, snell: 6, r1: 7 } as const;

/** Reasoning tokens one hard query is priced at (disclosed assumption). */
const TOK_PER_QUERY = 10_000;

/** Query-volume slider runs on log10(q) x 10, so arrows step ~1.26x. */
const VOL_MIN = 20; // 10^2
const VOL_MAX = 70; // 10^7
const CHART_QS = Array.from({ length: 26 }, (_, i) => Math.pow(10, 2 + i * 0.2));

const BENDER: Citation = {
  ref: "Bender et al. 2025",
  url: "https://arxiv.org/abs/2501.07458",
  venue: "arXiv",
  preprint: true,
};

const STROEBL: Citation = {
  ref: "Stroebl et al. 2024",
  url: "https://arxiv.org/abs/2411.17501",
  venue: "arXiv",
  preprint: true,
};

const fmtQ = (q: number) =>
  q >= 1e6
    ? `${+(q / 1e6).toPrecision(2)}M`
    : q >= 1e3
      ? `${+(q / 1e3).toPrecision(2)}k`
      : `${Math.round(q)}`;

const fmtUSD = (v: number) =>
  v >= 1e6
    ? `$${+(v / 1e6).toPrecision(3)}M`
    : v >= 1e3
      ? `$${+(v / 1e3).toPrecision(3)}k`
      : `$${v.toFixed(0)}`;

const fmtPerQ = (v: number) => `$${v >= 0.095 ? v.toFixed(2) : v.toFixed(3)}`;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** Dollars-per-task on a $1–$10,000 log strip: human anchors below, o3 above. */
function CostStrip({
  floorLow,
  floorHigh,
  measured,
  low,
  high,
}: {
  floorLow: number;
  floorHigh: number;
  measured: number;
  low: number;
  high: number;
}) {
  const pct = (v: number) => (Math.log10(v) / 4) * 100;
  return (
    <div>
      <div
        role="img"
        aria-label={`Estimated dollars per task on a log scale from $1 to $10,000: the human cost-efficiency floor is $${floorLow} to $${floorHigh}, measured human solvers about $${measured}, o3's low-compute configuration about $${low}, o3's high-compute configuration about $${high.toLocaleString()}.`}
        className="relative h-16"
      >
        <p className="absolute top-0 text-[11px] text-ink" style={{ left: `${pct(low)}%` }}>
          <span className="text-compute">●</span> o3 low · ~${low}
        </p>
        <p
          className="absolute top-0 -translate-x-full whitespace-nowrap text-[11px] text-ink"
          style={{ left: `${pct(high)}%` }}
        >
          <span className="text-wrong">●</span> o3 high · ~${high.toLocaleString()}
        </p>
        <div className="absolute inset-x-0 top-6 h-3 rounded-sm border border-grid bg-canvas">
          <div
            className="absolute inset-y-0 rounded-sm bg-correct/30"
            style={{ left: `${pct(floorLow)}%`, width: `${pct(floorHigh) - pct(floorLow)}%` }}
          />
          <div className="absolute inset-y-0 w-px bg-correct" style={{ left: `${pct(measured)}%` }} />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-compute"
            style={{ left: `${pct(low)}%` }}
          />
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wrong"
            style={{ left: `${pct(high)}%` }}
          />
        </div>
        <p
          className="absolute bottom-0 whitespace-nowrap text-[11px] text-ink-muted"
          style={{ left: `${pct(floorLow)}%` }}
        >
          humans: ${floorLow}–{floorHigh} floor · ${measured} measured
        </p>
      </div>
      <p className="text-[11px] text-ink-muted">estimated $ per task · log scale, $1 to $10,000</p>
    </div>
  );
}

export function Page16() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const arc = curves.arcCost;
  const a = arc.fit!.params;
  const pricing = curves.deepseekPricing;
  const pd = pricing.fit!.params;
  const brown = curves.coverageScaling;
  const snell = curves.computeOptimal;
  const nature = curves.deepseekTraining;

  // Per-query dollars from the cited list prices; climb/ceiling authored
  // (Brown-shaped, Stroebl-capped) and disclosed in the step body.
  const ANCHORS: BillAnchors = useMemo(
    () => ({
      bigPerQuery: (TOK_PER_QUERY / 1e6) * pd.o1OutputPerM, // $0.60
      smallPerSample: (TOK_PER_QUERY / 1e6) * pd.r1OutputPerM, // $0.022
      distillUSD: pd.r1RlTrainUSD, // $294k, reported
      baseAcc: 60,
      slopePerDecade: 12,
      ceiling: 90,
    }),
    [pd],
  );

  const [target, setTarget] = useState(72);
  const [vol, setVol] = useState(50); // 10^5 queries

  const queries = Math.pow(10, vol / 10);
  const n = samplesForTarget(target, ANCHORS);
  const cost = perQueryCosts(target, ANCHORS);
  const bills = totalBills(queries, target, ANCHORS);
  const crossover = distillCrossover(target, ANCHORS);
  const verdict = cheapestStrategy(queries, target, ANCHORS);

  const rentPts = useMemo(
    () =>
      CHART_QS.map((q) => ({
        x: q,
        y: totalBills(q, target, ANCHORS).rent,
      })),
    [target, ANCHORS],
  );
  const ownPts = useMemo(
    () => CHART_QS.map((q) => ({ x: q, y: ANCHORS.distillUSD + ANCHORS.smallPerSample * q })),
    [ANCHORS],
  );
  const crossoverDot =
    crossover !== null && crossover >= 100 && crossover <= 1e7
      ? [
          {
            x: crossover,
            y: ANCHORS.distillUSD + ANCHORS.smallPerSample * crossover,
            label: `pays off at ${fmtQ(crossover)}`,
          },
        ]
      : undefined;

  const gapPts = (a.o3HighAcc - a.o3LowAcc).toFixed(1);

  const verdictText: Record<typeof verdict, { head: string; body: string }> = {
    sample: {
      head: "✓ cheapest here: sample the small model",
      body: `${n} sample${n === 1 ? "" : "s"} per query at ${fmtPerQ(cost.sample ?? 0)} still undercuts one big-model call at ${fmtPerQ(cost.big)} — the regime where inference compute substitutes for size.`,
    },
    big: {
      head: "✓ cheapest here: one big-model call",
      body:
        cost.sample === null
          ? `at a ${target}% target the small model cannot get there by sampling at all, and the volume is too low for a retraining bill to pay off.`
          : `hitting ${target}% would take ${n} samples (${fmtPerQ(cost.sample)}/query) — the log-linear tax has eaten the whole ${pd.outputRatio}× price gap.`,
    },
    distill: {
      head: "✓ cheapest here: distill once, then serve",
      body: `${fmtUSD(ANCHORS.distillUSD)} up front beats renting by ${fmtUSD(bills.rent - bills.distill)} over ${fmtQ(queries)} queries — per-query cost is paid forever, a training bill only once.`,
    },
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
        Every trick in the toolbox spends the same currency: reasoning tokens, metered in dollars
        and seconds. And the returns diminish —{" "}
        <strong className="text-ink">
          coverage grows with the logarithm of the samples, so each next point of accuracy costs
          exponentially more than the last
        </strong>
        . This page reads the invoice: what one hard benchmark actually cost, why collapsing token
        prices don&apos;t repeal that math, and when the right move stops being{" "}
        <em>think longer</em> and becomes <em>go retrain</em>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the anchor */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. What one hard benchmark cost
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              reported estimates · not peer-reviewed
            </span>
          </h2>
          <figure
            aria-label="The o3 ARC-AGI bill: two configurations of the same model"
            className="m-0 flex flex-col gap-4 rounded-lg border-l-4 border-wrong bg-surface p-4"
          >
            <p className="text-sm text-ink">
              December 2024: OpenAI&apos;s o3 attacks ARC-AGI, a benchmark of visual puzzles a
              person solves in minutes. Same model, two budgets — the only difference is how many
              reasoning chains it samples per task.
              <Cite n={REF.arcPrize} />
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  o3 low · {a.o3LowSamples} samples/task
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-ink">{a.o3LowAcc}%</p>
                <p className="text-xs text-ink-muted">≈ ${a.o3LowCost} per task</p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  o3 high · {a.o3HighSamples} samples/task
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-wrong">
                  {a.o3HighAcc}%
                </p>
                <p className="text-xs text-ink-muted">
                  ≈ ${a.o3HighCost.toLocaleString()} per task · {a.computeFactor}× the compute
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">human solvers</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-correct">
                  ~${a.humanMeasuredCost}
                </p>
                <p className="text-xs text-ink-muted">
                  per task measured · ${a.humanFloorLow}–{a.humanCost} plausible floor
                </p>
              </div>
            </div>
            <CostStrip
              floorLow={a.humanFloorLow}
              floorHigh={a.humanCost}
              measured={a.humanMeasuredCost}
              low={a.o3LowCost}
              high={a.o3HighCost}
            />
            <figcaption className="text-sm text-ink">
              Read it as a price list: the first {a.o3LowAcc}% cost about ${a.o3LowCost} a task; the
              last <strong>{gapPts} points cost {a.computeFactor}× the compute</strong>. ARC
              Prize&apos;s own framing: the low config fits the contest&apos;s $10k budget, the high
              config is &ldquo;quite expensive.&rdquo;
              <Cite n={REF.arcPrize} /> That is diminishing returns as an invoice.
            </figcaption>
            <p className="text-xs text-ink-muted">
              The dollar signs are the soft part: OpenAI never published o3 pricing, and ARC Prize
              later revised its estimates upward, toward ~$30,000 per high-compute task. The sample
              counts and the {a.computeFactor}× multiplier are the stable facts; every $ figure here
              is estimate-dependent.
              <Cite n={REF.bender} />
            </p>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.arcPrize} href="https://arcprize.org/blog/oai-o3-pub-breakthrough">
            ARC Prize Foundation 2024, <em>o3 Breakthrough on ARC-AGI-Pub</em>.
          </RefItem>
          <RefItem n={REF.bender} href="https://arxiv.org/abs/2501.07458">
            Bender et al. 2025, <em>OpenAI&apos;s o3 Is Not AGI</em>.
          </RefItem>
        </Note>

        {/* Step 2 — prices fall, the shape stays */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Prices collapse; the shape doesn&apos;t
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              list prices · cited shape
            </span>
          </h2>
          <figure
            aria-label="Reasoning-token list prices: o1 versus DeepSeek-R1"
            className="m-0 flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
            <p className="text-sm text-ink">
              A month after that bill, DeepSeek-R1 put a comparable reasoner on the market at{" "}
              <strong>
                ~{pd.outputRatio}× (≈96%) below o1&apos;s list price
              </strong>
              .<Cite n={REF.pricing} /> The meter that step 1 ran on can drop by an order of
              magnitude in a season.
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Output price per million reasoning tokens: OpenAI o1 $${pd.o1OutputPerM}, DeepSeek-R1 $${pd.r1OutputPerM} — about ${pd.outputRatio} times cheaper. Input prices: $${pd.o1InputPerM} versus $${pd.r1InputMissPerM} per million.`}
            >
              {[
                { label: "OpenAI o1", value: pd.o1OutputPerM, tone: "bg-wrong" },
                { label: "DeepSeek-R1", value: pd.r1OutputPerM, tone: "bg-correct" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 text-ink-muted">{b.label}</span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div
                      className={`h-5 rounded ${b.tone}`}
                      style={{ width: `${(b.value / pd.o1OutputPerM) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono tabular-nums text-ink">
                    ${b.value}/M
                  </span>
                </div>
              ))}
              <p className="text-xs text-ink-muted">
                $ per million output (reasoning) tokens · inputs: ${pd.o1InputPerM} vs $
                {pd.r1InputMissPerM} per million, the same ~27× gap
              </p>
            </div>
            <figcaption className="text-sm text-ink">
              But a price cut moves the bill <em>down</em>, not the curve&apos;s <em>shape</em>.
              Coverage still grows log-linearly — ten times the samples per fixed gain
              <Cite n={REF.brown} /> — and an imperfect verifier still caps what any amount of
              sampling can reach.
              <Cite n={REF.stroebl} />{" "}
              <strong>Exponential spend, linear gains, hard ceiling</strong>: those survive every
              price cut, which is why the next dial exists.
            </figcaption>
          </figure>
        </section>
        <Note kicker="References">
          <RefItem n={REF.pricing} href="https://api-docs.deepseek.com/quick_start/pricing">DeepSeek API pricing, January 2025.</RefItem>
          <RefItem n={REF.brown} href="https://arxiv.org/abs/2407.21787">
            Brown et al. 2024, <em>Large Language Monkeys</em>.
          </RefItem>
          <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501">
            Stroebl et al. 2024, <em>Inference Scaling fLaws</em>.
          </RefItem>
        </Note>

        {/* Step 3 — the cost-accuracy dial */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Rent, sample, or retrain?
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              illustrative calculator from cited anchors
            </span>
          </h2>
          <section
            aria-label="The cost-accuracy dial: rent a big model, sample a small one, or distill"
            className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
            <p className="text-sm text-ink">
              You run a product that gets a stream of hard queries. Three ways to serve every one at
              your target accuracy: <strong>rent</strong> a frontier model (one call each),{" "}
              <strong>sample</strong> a {pd.outputRatio}×-cheaper small model N times and pick the
              best, or <strong>retrain</strong> — pay one distillation bill so the small model does
              it in a single call, then serve at its rate forever.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider
                label="Target accuracy on hard queries"
                min={62}
                max={92}
                value={target}
                suffix="%"
                onChange={(v) => {
                  setTarget(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <Slider
                label="Queries you expect to serve"
                min={VOL_MIN}
                max={VOL_MAX}
                value={vol}
                format={(v) => fmtQ(Math.pow(10, v / 10))}
                suffix=" queries"
                onChange={(v) => {
                  setVol(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">rent big · 1 call</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                  {fmtPerQ(cost.big)}
                </p>
                <p className="text-xs text-ink-muted">per query, at o1&apos;s rate</p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  rent small · ×{cost.sample === null ? "?" : n}
                </p>
                <p
                  className={`font-mono text-2xl font-bold tabular-nums ${cost.sample === null ? "text-wrong" : "text-compute"}`}
                >
                  {cost.sample === null ? "—" : fmtPerQ(cost.sample)}
                </p>
                <p className="text-xs text-ink-muted">
                  {cost.sample === null
                    ? `no number of samples reaches ${target}%`
                    : `per query, ${n} sample${n === 1 ? "" : "s"} at R1's rate`}
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  distill first ({fmtUSD(ANCHORS.distillUSD)})
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-correct">
                  {fmtPerQ(cost.distilled)}
                </p>
                <p className="text-xs text-ink-muted">per query after the one-time bill</p>
              </div>
            </div>

            {cost.sample === null ? (
              <p className="rounded border-l-4 border-wrong bg-wrong/10 p-3 text-sm text-ink">
                {target}% sits past the verifier&apos;s ceiling ({ANCHORS.ceiling}%): the selector
                cannot tell the best sample from a plausible wrong one often enough, so resampling
                stops helping no matter the budget. The choice collapses to the big model now, or a
                better small model later.
              </p>
            ) : null}

            <p
              role="status"
              className={`rounded border-l-4 p-3 text-sm ${
                verdict === "distill"
                  ? "border-correct bg-correct/15"
                  : verdict === "sample"
                    ? "border-compute bg-compute/15"
                    : "border-grid bg-surface-raised"
              }`}
            >
              <span className="font-semibold text-ink">{verdictText[verdict].head}</span>
              <span className="block text-ink-muted">{verdictText[verdict].body}</span>
            </p>

            <LineChart
              title={`Total dollars against queries served, both axes log. Keep renting at the cheapest per-query rate for a ${target} percent target, versus paying the one-time retraining bill and serving at the small model's rate. ${
                crossover === null
                  ? "At this target the small model already answers in one sample, so retraining never undercuts renting."
                  : `The lines cross at about ${fmtQ(crossover)} queries, where the training bill has amortized.`
              }`}
              points={ownPts}
              secondary={{ points: rentPts, label: "keep renting" }}
              primaryLabel="distill once, then serve"
              logX
              logY
              xDomain={[100, 1e7]}
              yDomain={[1, Math.max(rentPts[rentPts.length - 1].y, ownPts[ownPts.length - 1].y) * 3]}
              xTicks={[100, 1e3, 1e4, 1e5, 1e6, 1e7]}
              xTickFormat={fmtQ}
              yTickFormat={(v) => fmtUSD(v)}
              markerX={queries}
              dots={crossoverDot}
              xLabel="queries served (log)"
              yLabel="total $ (log)"
              width={640}
              height={300}
            />
            <figcaption className="text-sm text-ink-muted">
              Two regimes fall out of the arithmetic. At moderate targets and volumes,{" "}
              <strong className="text-ink">answer-time compute wins</strong>: a small model plus
              sampling stands in for a far larger one — Snell et al. measure the substitution
              holding up against a {snell.fit!.params.largerModelFactor}× larger model on easy and
              medium problems.
              <Cite n={REF.snell} /> Push the target up and the log-linear tax compounds ~10× per{" "}
              {ANCHORS.slopePerDecade} points until the big model is cheaper anyway; push the{" "}
              <em>volume</em> up and <strong className="text-ink">retraining wins</strong>, because
              a per-query price is paid forever and a training bill only once
              {crossover !== null ? (
                <> — here it pays off past ≈{fmtQ(crossover)} queries</>
              ) : (
                <> — though at this target one sample already suffices, so there is nothing to amortize</>
              )}
              . And every extra sample is also latency: the meter runs in seconds as well as
              dollars.
            </figcaption>
            <p className="text-xs text-ink-muted">
              Illustrative calculator, not a quote: queries are priced at{" "}
              {TOK_PER_QUERY.toLocaleString()} reasoning tokens each at the cited o1 / R1 list
              rates; the retraining bill is DeepSeek&apos;s reported{" "}
              {fmtUSD(pd.r1RlTrainUSD)} RL-stage cost for R1 (base model excluded);
              <Cite n={REF.r1} /> the
              small model&apos;s climb (+{ANCHORS.slopePerDecade} points per 10× samples from{" "}
              {ANCHORS.baseAcc}%, ceiling {ANCHORS.ceiling}%) is authored — the log-linear shape is
              Brown et al.&apos;s, the ceiling is Stroebl et al.&apos;s.
            </p>
          </section>
        </section>
        <Note kicker="Try it">
          <p>Hold 72% and push the volume: renting wins early, owning wins late.</p>
          <p>Then hold the volume and raise the target past ~77%: the samples stop paying.</p>
          <p className="pt-1 text-xs font-semibold uppercase tracking-wide">References</p>
          <RefItem n={REF.snell} href="https://arxiv.org/abs/2408.03314">
            Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally</em>.
          </RefItem>
          <RefItem n={REF.r1} href="https://arxiv.org/abs/2501.12948">DeepSeek-R1 2025 (the retraining bill).</RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={arc.citation} />
        <CitationBadge citation={BENDER} />
        <CitationBadge citation={pricing.citation} />
        <CitationBadge citation={brown.citation} />
        <CitationBadge citation={snell.citation} />
        <CitationBadge citation={STROEBL} />
        <CitationBadge citation={nature.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        every dollar figure on this page is a reported estimate or a list price, presented as
        reported · the step-3 calculator is derived arithmetic over those cited anchors plus the
        disclosed authored parameters, and is pinned in the test suite
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
