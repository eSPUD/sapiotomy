"use client";

/**
 * Page 13, "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve".
 * Act 2 built the toolbox by hand: long chains (5-6), voting (7), verifiers
 * (8-9), search (10). In September 2024 OpenAI shipped the first commercial
 * model that had LEARNED the toolbox: o1 is trained with large-scale RL to
 * think in a long private chain of thought, and its signature artifact is a
 * pair of charts showing AIME accuracy log-linear in BOTH train-time RL
 * compute and test-time thinking compute. This page and the next (R1) open
 * Act 3; the rest of the act asks what the scores are worth.
 *
 * Step 1 reproduces that chart as a lab with the two knobs on it. The model is
 * one authored log-linear law (lib/frontier.ts twoAxisAccuracy): a decade of
 * either compute buys the same slope, so the "thinking" slider walks along the
 * curve and the "training" slider shifts the whole curve. The thesis is drawn
 * ON the chart as two equal slope arrows (×10 thinking right, ×10 RL up, same
 * +29.5), and the shaded band between the runs — what the missing RL would
 * have bought — is the protagonist, labelled with the live delta beside the
 * accuracy readout at equal weight. OpenAI published the source figures with
 * the compute axes UNLABELED (log, relative units); the fidelity note under
 * the chart says so out loud, and provenance in data/o1-scaling.json records
 * exactly which numbers are verbatim (GPT-4o 12%, o1 pass@1 74.4%) and which
 * are the redrawing's.
 *
 * Step 2 lands the curve as a waterfall: the AIME sampling ladder drawn as
 * increments (12 base, +62.4 learned chain, +8.9 page 7's majority vote over
 * 64 chains, +9.7 page 8's learned re-ranker over 1000) — the toolbox as a
 * second storey on the learned chain. Step 3 is the GPT-4o / o1 / o3
 * scoreboard: the o3 column (Dec 2024 preview, three months later) is the
 * two-axis law applied again.
 *
 * Step 4 is the design choice with teeth: the chain that does all this is
 * hidden. A boundary diagram — dashed divider, lab left, user right, a summary
 * crossing one way and billing crossing the other — replaces prose: the
 * asymmetry IS the argument. Hands the deck to R1 (open weights, visible
 * chain) next page and seeds the faithfulness question later in the act.
 *
 * Anchored to data/o1-scaling.json and data/o3-preview.json; the law and both
 * files' anchors are pinned in frontier.test.ts.
 */

import { useMemo, useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import type { Citation } from "@/lib/data";
import { twoAxisAccuracy } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 13;

/** Page 13's references, numbered in order of first appearance. */
const REF = { announce: 1, o3preview: 2, competitive: 3, systemCard: 4 } as const;

const SCALING = curves.o1Scaling;
const O3 = curves.o3Preview;
const P = SCALING.fit!.params;
const Q = O3.fit!.params;

/* The chart samples the law every tenth of a decade across the figure's span. */
const EXPS = Array.from({ length: 21 }, (_, i) => i / 10);

const law = (testExp: number, trainExp: number) =>
  twoAxisAccuracy(testExp, trainExp, P.intercept, P.slopePerDecade, P.maxExp, P.floor);

const FULL_CURVE = EXPS.map((e) => ({ x: 10 ** e, y: law(e, P.maxExp) }));

/* Where o1's reported pass@1 sits on the fully-trained line. */
const O1_DOT = { x: 10 ** ((P.o1Pass1 - P.intercept) / P.slopePerDecade), y: P.o1Pass1 };

/* The thesis, drawn on the chart: from one point on the full-RL line, ×10
   thinking (right) and ×10 RL (up) buy the same +29.5 — equal magnitude,
   different direction. */
const SLOPE_ARROWS = [
  {
    x1: 10 ** 0.5,
    y1: law(0.5, P.maxExp),
    x2: 10 ** 1.5,
    y2: law(0.5, P.maxExp),
    label: `×10 thinking → +${P.slopePerDecade}`,
    labelDy: 14,
  },
  {
    x1: 10 ** 0.5,
    y1: law(0.5, P.maxExp),
    x2: 10 ** 0.5,
    y2: law(1.5, P.maxExp),
    label: `×10 RL → +${P.slopePerDecade}`,
    labelAnchor: "start" as const,
    labelDx: 6,
    labelDy: -4,
  },
];

/* Sources cited in the copy but not backing a data file. */
const SYSTEM_CARD: Citation = {
  ref: "OpenAI o1 System Card (2024)",
  url: "https://openai.com/index/openai-o1-system-card/",
  venue: "OpenAI (not peer-reviewed)",
  preprint: true,
};
const COMPETITIVE_PROGRAMMING: Citation = {
  ref: "El-Kishky et al. 2025",
  url: "https://arxiv.org/abs/2502.06807",
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

export function Page13() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [testExp, setTestExp] = useState(0);
  const [trainExp, setTrainExp] = useState(2);
  const fullyTrained = trainExp >= P.maxExp;

  const curve = useMemo(() => EXPS.map((e) => ({ x: 10 ** e, y: law(e, trainExp) })), [trainExp]);
  const acc = law(testExp, trainExp);
  /* The finding, not the parking spot: what the forgone RL would have added here. */
  const gap = law(testExp, P.maxExp) - acc;

  const chainGain = +(P.o1Pass1 - P.gpt4oAime).toFixed(1);
  const voteGain = +(P.o1Cons64 - P.o1Pass1).toFixed(1);
  const rerankGain = +(P.o1Rerank1000 - P.o1Cons64).toFixed(1);

  const waterfall = [
    {
      label: "GPT-4o, one answer",
      note: "no long chain at all",
      start: 0,
      gain: P.gpt4oAime,
      total: P.gpt4oAime,
      tone: "bg-grid",
      base: true,
    },
    {
      label: "o1, one chain",
      note: "the learned private chain of thought",
      start: P.gpt4oAime,
      gain: chainGain,
      total: P.o1Pass1,
      tone: "bg-compute",
      base: false,
    },
    {
      label: "o1, majority of 64 chains",
      note: "page 7's frequency voting, stacked on top",
      start: P.o1Pass1,
      gain: voteGain,
      total: P.o1Cons64,
      tone: "bg-compute",
      base: false,
    },
    {
      label: "o1, best of 1000 re-ranked",
      note: "page 8's learned judge, stacked on top",
      start: P.o1Cons64,
      gain: rerankGain,
      total: P.o1Rerank1000,
      tone: "bg-correct",
      base: false,
    },
  ];

  const scoreboard = [
    {
      bench: "AIME 2024 (competition maths)",
      gpt4o: `${P.gpt4oAime}%`,
      o1: `${P.o1Pass1}%`,
      o3: `${Q.o3Aime}%`,
    },
    {
      bench: "GPQA Diamond (PhD science)",
      gpt4o: `${P.gpt4oGpqa}%`,
      o1: `${P.o1Gpqa.toFixed(1)}%`,
      o3: `${Q.o3Gpqa}%`,
    },
    {
      bench: "Codeforces (competitive coding)",
      gpt4o: `${P.gpt4oElo} Elo · ${P.gpt4oCfPercentile}th pct`,
      o1: `${P.o1Elo} Elo · ${P.o1CfPercentile}th pct`,
      o3: `${Q.o3Elo} Elo`,
    },
    {
      bench: "SWE-bench Verified (real bug fixes)",
      gpt4o: "n/a",
      o1: `${Q.o1Swe}%`,
      o3: `${Q.o3Swe}%`,
    },
  ];

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
        Everything so far bolted reasoning on from outside — prompts, votes, judges, search.{" "}
        <strong className="text-ink">o1</strong> trained it in, and its signature is{" "}
        <strong className="text-ink">a curve with two compute axes</strong>: how much of the score
        did the training buy, and how much did the thinking?
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two-axis lab */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">1. One law, two knobs</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              OpenAI&apos;s own framing was that o1 improves with more reinforcement learning at
              train time and with more time spent thinking at test time
              <Cite n={REF.announce} /> — and both of the announcement&apos;s charts are
              log-linear: accuracy against the <em>logarithm</em> of compute.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Slider
                  label="Thinking time (test-time compute)"
                  min={0}
                  max={2}
                  step={0.05}
                  value={testExp}
                  format={(v) => `×${Math.round(10 ** v)}`}
                  onChange={(v) => {
                    setTestExp(v);
                    recordInteraction(PAGE_N);
                  }}
                />
                <Slider
                  label="RL training (train-time compute)"
                  min={0}
                  max={2}
                  step={0.05}
                  value={trainExp}
                  format={(v) => `×${Math.round(10 ** v)}`}
                  onChange={(v) => {
                    setTrainExp(v);
                    recordInteraction(PAGE_N);
                  }}
                />
                <p className="text-sm text-ink-muted">
                  Log-compute is log-compute, whichever axis it arrives on — which is why the
                  training slider translates the whole line rather than moving a point along it.{" "}
                  <strong className="text-ink">Drag it down and watch the delta at your
                  marker:</strong>{" "}
                  that gap is what the missing RL would have bought.
                </p>
                <div className="flex items-start justify-center gap-8">
                  <BigNumber
                    size="md"
                    value={acc}
                    suffix="%"
                    tone={acc > P.gpt4oAime ? "correct" : "wrong"}
                    label="AIME accuracy here"
                  />
                  <BigNumber
                    size="md"
                    prefix="+"
                    value={gap}
                    tone={gap > 0 ? "compute" : "ink"}
                    label="the missing RL's share"
                  />
                </div>
              </div>
              <LineChart
                title="AIME 2024 accuracy against test-time compute (redrawn; relative log units)"
                points={curve}
                secondary={fullyTrained ? undefined : { points: FULL_CURVE, label: "o1's full RL run" }}
                primaryLabel={fullyTrained ? undefined : "a smaller RL run"}
                inlineLabels
                fillBetween={!fullyTrained}
                fillOpacity={0.25}
                arrows={SLOPE_ARROWS}
                markerX={10 ** testExp}
                markerDelta={!fullyTrained}
                referenceY={P.gpt4oAime}
                referenceLabel={`GPT-4o ${P.gpt4oAime}%`}
                dots={[{ x: O1_DOT.x, y: O1_DOT.y, label: `o1 pass@1 ${P.o1Pass1}%` }]}
                xLabel="test-time compute (relative units, log scale)"
                yLabel="accuracy (%)"
                xDomain={[1, 100]}
                yDomain={[0, 100]}
                logX
                xTicks={[1, 10, 100]}
              />
            </div>
            <p className="text-xs text-ink-muted">
              The line is an authored redrawing of the announcement figure&apos;s shape: OpenAI
              published both charts with the compute axis unlabeled — a log scale in undisclosed,
              relative units — so ×1 to ×100 here spans the figure&apos;s two decades, and the +
              {P.slopePerDecade}-per-decade slope is the redrawing&apos;s, not a published number.
              The slope is the claim; the absolute compute is a secret. The dashed GPT-4o line and
              the o1 dot are the source&apos;s verbatim numbers.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.announce} href="https://openai.com/index/learning-to-reason-with-llms/" preprint>
            OpenAI 2024, <em>Learning to Reason with LLMs</em>.
          </RefItem>
        </Note>

        {/* Step 2 — where the curve landed */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">2. Where the curve landed</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The toolbox did not become obsolete — it became a second storey. Act 2&apos;s tricks
              stack <em>on top of</em> the learned chain, and each increment below is what one of
              them still buys:
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`AIME 2024 accuracy waterfall: GPT-4o with no chain starts at ${P.gpt4oAime} percent; the learned chain adds ${chainGain} points to reach ${P.o1Pass1}; majority voting over 64 chains adds ${voteGain} to reach ${P.o1Cons64}; re-ranking 1000 chains with a learned judge adds ${rerankGain} to reach ${P.o1Rerank1000}.`}
            >
              {waterfall.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-44 shrink-0 text-ink-muted">
                    {b.label}
                    <span className="block text-xs text-ink-muted">{b.note}</span>
                  </span>
                  <div className="relative h-5 flex-1 rounded bg-surface-raised">
                    <div
                      className={`absolute h-5 rounded ${b.tone}`}
                      style={{ left: `${b.start}%`, width: `${b.gain}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right">
                    <span className="block font-mono font-semibold tabular-nums text-ink">
                      {b.base ? `${b.total}%` : `+${b.gain}`}
                    </span>
                    {b.base ? null : (
                      <span className="block font-mono text-xs tabular-nums text-ink-muted">
                        = {b.total}%
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </figure>
        </section>

        {/* Step 3 — the scoreboard */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">3. Three months apart</h2>
          <div className="overflow-x-auto rounded-lg border border-grid bg-surface p-4">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="mb-2 caption-top text-left text-sm text-ink-muted">
                Three months apart on the same two axes: more RL, more thinking, every benchmark
                jumps.
              </caption>
              <thead>
                <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="py-1.5 pr-3 font-semibold">Benchmark</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">GPT-4o</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">o1 · Sept 2024</th>
                  <th scope="col" className="py-1.5 font-semibold">o3 · Dec 2024 preview</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((r) => (
                  <tr key={r.bench} className="border-b border-dashed border-grid last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-ink">
                      {r.bench}
                    </th>
                    <td className="py-2 pr-3 font-mono tabular-nums text-ink-muted">{r.gpt4o}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-ink">{r.o1}</td>
                    <td className="py-2 font-mono tabular-nums font-semibold text-correct">{r.o3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-ink-muted">
              o1&apos;s {P.o1Gpqa.toFixed(1)}% on GPQA Diamond beat the {P.expertGpqa}% of human
              PhD experts on their own fields&apos; questions — &ldquo;the first model to do
              so&rdquo;, by the announcement&apos;s own claim.
              <Cite n={REF.announce} /> The o3 column is OpenAI&apos;s own scoring of an
              announcement preview, not an independent measurement.
              <Cite n={REF.o3preview} /> Its Codeforces rating was later measured at 2724 (99.8th
              percentile of human competitors) on simulated contests mirroring real ones.
              <Cite n={REF.competitive} /> AIME and GPQA entries for o1 are pass@1 and cons@64
              respectively, as the source reports them.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.o3preview} href="https://arcprize.org/blog/oai-o3-pub-breakthrough" preprint>
            OpenAI 2024, <em>OpenAI o3 preview</em> (via ARC Prize).
          </RefItem>
          <RefItem n={REF.competitive} href="https://arxiv.org/abs/2502.06807" preprint>
            El-Kishky et al. 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </RefItem>
        </Note>

        {/* Step 4 — the hidden chain */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. The thoughts you cannot read</h2>
          <p className="text-ink-muted">
            The chain that does all of this is <strong className="text-ink">hidden</strong> — a
            design choice the announcement defends with a safety argument, not just a commercial
            one.
          </p>

          {/* The boundary: a summary crosses one way, billing crosses the other. */}
          <div className="relative rounded-lg border border-grid bg-surface p-4">
            <div
              aria-hidden
              className="absolute inset-y-3 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-grid"
            />
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Inside the lab
              </p>
              <p className="m-0 text-right text-xs font-semibold uppercase tracking-wide text-ink-muted">
                The user
              </p>

              <div className="relative rounded border-l-4 border-compute bg-surface-raised p-3">
                <strong className="text-ink">The raw chain of thought</strong>
                <span className="block text-xs text-ink-muted">unrestricted, left untrained</span>
                {/* the one thing that crosses left to right: a summary */}
                <div
                  aria-hidden
                  className="absolute -right-12 top-1/2 flex w-12 -translate-y-1/2 items-center"
                >
                  <span className="h-px flex-1 bg-ink" />
                  <span className="text-[10px] leading-none text-ink">▶</span>
                </div>
              </div>
              <div className="rounded border-l-4 border-grid bg-surface-raised p-3">
                <strong className="text-ink">A model-written summary</strong>
                <span className="block text-xs text-ink-muted">all the user ever sees</span>
              </div>

              <div className="rounded border-l-4 border-compute bg-surface-raised p-3">
                <strong className="text-ink">The deception monitor</strong>
                <span className="block text-xs text-ink-muted">
                  reads the raw chain internally; flagged 0.17% of responses as deceptive, over
                  ~100k synthetic prompts
                  <Cite n={REF.systemCard} />
                </span>
              </div>

              {/* the one thing that crosses right to left: money */}
              <div className="col-span-2 flex items-center gap-2 text-xs text-wrong">
                <span aria-hidden className="leading-none">◀</span>
                <span aria-hidden className="h-px w-10 bg-wrong" />
                <span className="relative bg-surface px-1">
                  billing — billed for tokens on the other side, sight unseen
                </span>
                <span aria-hidden className="h-px flex-1 bg-wrong" />
              </div>
            </div>
          </div>

          <p className="text-sm text-ink-muted">
            <strong className="text-ink">The case for hiding:</strong> a chain you can trust as a
            monitor must be left untrained — start rewarding polite, policy-compliant thoughts and
            the model learns to think one thing and show another.
            <Cite n={REF.announce} />
          </p>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">The price:</strong> nobody outside can audit the reasoning
            behind an answer, and a monitor is only as good as the chain is honest — a question
            this deck returns to before the end.
          </p>

          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            A closed lab proved the two-axis law and kept the recipe. Within four months an open lab
            published one: weights, training curve, visible chain and all.{" "}
            <em className="text-ink-muted">Turn the page.</em>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.systemCard} href="https://openai.com/index/openai-o1-system-card/" preprint>
            OpenAI 2024, <em>OpenAI o1 System Card</em>.
          </RefItem>
        </Note>
      </div>

      
      <p className="text-xs text-ink-muted">
        <strong className="text-ink">Simulated</strong> — the section 1 curve is a redrawing of an
        unlabeled-axis figure, preserving its log-linear shape and two-decade span; the absolute
        compute units (and the +{P.slopePerDecade}-per-decade slope) are the redrawing&apos;s, not
        published values. · <strong className="text-ink">Cited</strong> — every named number on
        this page is verbatim from the sources and pinned as such in the test suite.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
