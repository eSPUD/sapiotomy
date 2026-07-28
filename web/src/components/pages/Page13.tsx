"use client";

/**
 * Page 13, "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve".
 * Act 2 built the toolbox by hand: long chains (5-6), voting (7), verifiers
 * (8-9), search (10). In September 2024 OpenAI shipped the first commercial
 * model that had LEARNED the toolbox: o1 is trained with large-scale RL to
 * think in a long private chain of thought, and its signature artifact is a
 * pair of charts showing AIME accuracy log-linear in BOTH train-time RL
 * compute and test-time thinking compute.
 *
 * Step 1 reproduces that chart as a lab with the two knobs on it. The model is
 * one authored log-linear law (lib/frontier.ts twoAxisAccuracy): a decade of
 * either compute buys the same slope, so the "thinking" slider walks along the
 * curve and the "training" slider shifts the whole curve. OpenAI published the
 * source figures with the compute axes UNLABELED (log, relative units), so the
 * redrawing keeps relative units; the sidenote says so out loud, which is the
 * kind of beyond-the-basics reading the margin exists for. Anchors that ARE
 * verbatim (GPT-4o 12%, o1 pass@1 74.4%) are drawn as a reference line and a
 * dot; the curve's shape between them is illustrative, and provenance in
 * data/o1-scaling.json records exactly that split.
 *
 * Step 2 lands the curve on published numbers: the AIME sampling ladder
 * (74.4 -> 83.3 by page 7's majority vote over 64 chains -> 93 by page 8's
 * learned re-ranker over 1000), then the GPT-4o / o1 / o3 scoreboard. The o3
 * column (Dec 2024 preview, three months later) is the two-axis law applied
 * again: more RL, more thinking, every benchmark jumps.
 *
 * Step 3 is the design choice with teeth: the chain that does all this is
 * hidden. OpenAI's argument (monitorable chains must stay untrained, plus
 * competitive advantage) and its price (unauditable, billed sight unseen) in
 * two cards, which hands the deck to R1 (open weights, visible chain) next
 * page and seeds the faithfulness question of Act 3.
 *
 * Anchored to data/o1-scaling.json and data/o3-preview.json; the law and both
 * files' anchors are pinned in frontier.test.ts.
 */

import { useMemo, useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import type { Citation } from "@/lib/data";
import { twoAxisAccuracy } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 13;
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

  const ladder = [
    { label: "GPT-4o, one answer", value: P.gpt4oAime, tone: "bg-grid", note: "no long chain at all" },
    { label: "o1, one chain", value: P.o1Pass1, tone: "bg-compute", note: "just the private chain of thought" },
    { label: "o1, majority of 64 chains", value: P.o1Cons64, tone: "bg-compute", note: "page 7's frequency voting, stacked on top" },
    { label: "o1, best of 1000 re-ranked", value: P.o1Rerank1000, tone: "bg-correct", note: "page 8's learned judge, stacked on top" },
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
        Everything in this act so far was scaffolding bolted on from outside: prompts that ask for
        steps, votes over many chains, judges, search. In September 2024 OpenAI shipped{" "}
        <strong className="text-ink">o1</strong>, the first commercial model trained with
        large-scale reinforcement learning to do the reasoning <em>itself</em>: before answering, it
        writes a long private chain of thought in which it drafts, catches its own mistakes, and
        backtracks. Its signature is not one score but{" "}
        <strong className="text-ink">a curve with two compute axes</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two-axis lab */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. One law, two knobs</h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <blockquote className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              &ldquo;The performance of o1 consistently improves with more reinforcement learning
              (train-time compute) and with more time spent thinking (test-time compute).&rdquo;
              <span className="mt-1 block text-xs text-ink-muted">
                OpenAI, announcing o1. Both charts in the announcement are log-linear: accuracy
                against the <em>logarithm</em> of compute.
              </span>
            </blockquote>

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
                <BigNumber
                  value={acc}
                  suffix="%"
                  tone={acc > P.gpt4oAime ? "correct" : "wrong"}
                  label="AIME accuracy at these two budgets"
                />
                <p className="text-sm text-ink-muted">
                  Ten times the thinking buys about {P.slopePerDecade} points. So does ten times the
                  RL. Log-compute is log-compute, whichever axis it arrives on: that is the whole
                  law, and it is why the second slider slides the entire line rather than a point on
                  it.
                </p>
              </div>
              <LineChart
                title="AIME 2024 accuracy against test-time compute (redrawn; relative log units)"
                points={curve}
                secondary={fullyTrained ? undefined : { points: FULL_CURVE, label: "o1's full RL run" }}
                primaryLabel={fullyTrained ? "o1's full RL run" : "a smaller RL run"}
                inlineLabels
                fillBetween={!fullyTrained}
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
              The line is an authored redrawing of the announcement figure&apos;s shape; the dashed
              GPT-4o line and the o1 dot are the source&apos;s verbatim numbers.
            </p>
          </div>
        </section>

        <Note kicker="Reading the chart">
          <p>
            OpenAI published both scaling charts with the compute axis unlabeled: a log scale in
            undisclosed, relative units. This redrawing keeps that convention, so ×1 to ×100 spans
            the figure&apos;s two decades. The slope is the claim; the absolute compute is a secret.
          </p>
          <p>Drag the training slider down and watch the delta at your marker: that gap is what the missing RL would have bought.</p>
        </Note>

        {/* Step 2 — where the curve landed */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Where the curve landed</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The toolbox did not become obsolete, it became a second storey. Act 2&apos;s tricks
              stack <em>on top of</em> the learned chain:
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`AIME 2024 accuracy ladder: GPT-4o one answer ${P.gpt4oAime} percent; o1 one chain ${P.o1Pass1} percent; o1 majority vote over 64 chains ${P.o1Cons64} percent; o1 re-ranking 1000 chains with a learned scorer ${P.o1Rerank1000} percent.`}
            >
              {ladder.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-44 shrink-0 text-ink-muted">
                    {b.label}
                    <span className="block text-xs text-ink-muted">{b.note}</span>
                  </span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value}%
                  </span>
                </div>
              ))}
            </div>
          </figure>

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
              o1&apos;s {P.o1Gpqa.toFixed(1)}% on GPQA Diamond is the first score above the{" "}
              {P.expertGpqa}% of human PhD experts on their own fields&apos; questions. The o3 column is OpenAI&apos;s own
              scoring of an announcement preview, not an independent measurement; its Codeforces
              rating was later measured at 2724 in live contests (99.8th percentile of human
              competitors). AIME and GPQA entries for o1 are pass@1 and cons@64 respectively, as
              the source reports them.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <p>
            OpenAI 2024, <em>Learning to Reason with LLMs</em>.
          </p>
          <p>
            OpenAI 2024, <em>OpenAI o3 preview</em> (via ARC Prize).
          </p>
          <p>
            El-Kishky et al. 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </p>
        </Note>

        {/* Step 3 — the hidden chain */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The thoughts you cannot read</h2>
          <p className="text-ink-muted">
            The chain that does all of this is <strong className="text-ink">hidden</strong>. Users
            see a model-written summary; the raw chain of thought stays inside OpenAI. That is a
            design choice, and the announcement defends it with a safety argument, not just a
            commercial one.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-base text-ink">
              <strong>The case for hiding.</strong> A chain you can trust as a monitor must be left{" "}
              <em>untrained</em>: start rewarding polite, policy-compliant thoughts and the model
              learns to think one thing and show another. So OpenAI keeps the raw chain unrestricted,
              reads it internally to catch things the answer never shows (their deception monitor
              flagged about 0.17% of o1 responses), and shows you a summary. The raw chain is also,
              plainly, the recipe&apos;s output, and the recipe was the product.
            </div>
            <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-base text-ink">
              <strong>The price of hiding.</strong> Nobody outside can audit the reasoning behind an
              answer, and every reasoning token is billed <em>sight unseen</em>: you pay for
              thinking you are not allowed to read. And the safety argument cuts both ways: a
              monitor is only as good as the chain is honest, which is a question this deck returns
              to before the end.
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            A closed lab proved the two-axis law and kept the recipe. Within four months an open lab
            published one: weights, training curve, visible chain and all.{" "}
            <em className="text-ink-muted">Turn the page.</em>
          </div>
        </section>

        <Note kicker="References">
          <p>
            OpenAI 2024, <em>OpenAI o1 System Card</em>.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={SCALING.citation} />
        <CitationBadge citation={O3.citation} />
        <CitationBadge citation={SYSTEM_CARD} />
        <CitationBadge citation={COMPETITIVE_PROGRAMMING} />
      </div>
      <p className="text-xs text-ink-muted">
        The curve is a redrawing of an unlabeled-axis figure; every named number above is verbatim
        from the sources, and both are pinned as such in the test suite.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
